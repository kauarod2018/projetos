import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import * as zod from 'zod';
import { getTableName, sql } from 'drizzle-orm';
import { MySqlDialect } from 'drizzle-orm/mysql-core';
import * as schema from '../db/schema.ts';
import * as models from '../lib/models.ts';
import * as http from '../lib/http.ts';

const require = createRequire(import.meta.url), dialect = new MySqlDialect();
const now = new Date('2026-10-01T01:00:00.000Z'); // Still September in Brasilia.
class Clock extends Date { constructor(...args) { super(...(args.length ? args : [now.toISOString()])); } }
let user = { id: 1 }, reads = 0, failure = false;
const quotes = [
  { id: 1, userId: 1, customerId: 10, status: 'Aprovado', totalCents: 30000, client: { name: 'Ana', notes: 'PRIVATE' }, publicToken: 'SECRET' },
  { id: 2, userId: 2, customerId: 20, status: 'Aprovado', totalCents: 99000, client: { name: 'Other owner' } },
  { id: 3, userId: 1, customerId: 30, status: 'Pago', totalCents: 10000, client: { name: 'Carlos' } },
  { id: 4, userId: 1, customerId: 40, status: 'Enviado', totalCents: 12000, validUntil: '2026-10-05', sentAt: '2026-09-27T10:00:00Z', client: { name: 'Joana' } },
];
const data = {
  transactions: [
    { id: 1, userId: 1, type: 'income', amountCents: 10000, transactionDate: '2026-09-30', description: 'Pagamento Carlos', quoteId: 3 },
    { id: 2, userId: 2, type: 'income', amountCents: 999, transactionDate: '2026-09-30', description: 'Secret' },
    { id: 3, userId: 1, type: 'expense', amountCents: 200, transactionDate: '2026-09-30' },
    { id: 4, userId: 1, type: 'income', amountCents: 500, transactionDate: '2026-10-01' },
  ],
  appointments: [
    { id: 1, userId: 1, status: 'Confirmado', startsAt: '2026-09-30T23:00', endsAt: '2026-10-01T01:00', title: 'Plantão', customerName: 'Ana' },
    { id: 2, userId: 2, status: 'Confirmado', startsAt: '2026-10-01T14:00', endsAt: '2026-10-01T15:00', title: 'Secret' },
    { id: 3, userId: 1, status: 'Cancelado', startsAt: '2026-10-01T14:00', endsAt: '2026-10-01T15:00', title: 'Cancelled' },
    { id: 4, userId: 1, status: 'Confirmado', startsAt: '2026-09-30T23:00', endsAt: '2026-10-01T00:00', title: 'Ends before tomorrow' },
  ],
  financial_obligations: [
    { id: 11, userId: 1, status: 'open', type: 'receivable', dueDate: '2026-09-30', description: 'Instalação', customerName: 'Ana', installmentNumber: 1, installmentCount: 2, remainingCents: 7500 },
    { id: 12, userId: 1, status: 'open', type: 'payable', dueDate: '2026-10-04', description: 'Material', customerName: null, installmentNumber: 1, installmentCount: 1, remainingCents: 2500 },
    { id: 13, userId: 2, status: 'open', type: 'receivable', dueDate: '2026-10-03', description: 'Secret', customerName: 'Other owner', installmentNumber: 1, installmentCount: 1, remainingCents: 90000 },
  ],
};
const keys = { user_id: 'userId', type: 'type', transaction_date: 'transactionDate', starts_at: 'startsAt', ends_at: 'endsAt', due_date: 'dueDate', status: 'status' };
const db = { select(fields) { let table, where; return {
  from(t) { table = getTableName(t); return this; }, leftJoin() { return this; }, where(condition) { where = condition; return this; }, groupBy() { return this; }, orderBy() { return this; }, limit() { return this; }, as() { return { obligationId: sql.raw('paid_totals.obligation_id'), paidCents: sql.raw('paid_totals.paid_cents') }; },
  then(resolve, reject) { return Promise.resolve().then(() => {
    reads++; if (failure) throw new Error('DB_PASSWORD=private');
    const query = dialect.sqlToQuery(where); assert.match(query.sql, /`user_id` = \?/);
    const conditions = [...query.sql.matchAll(/`\w+`\.`(\w+)` (>=|<=|<>|=|<|>) \?/g)];
    assert.ok(conditions.length === query.params.length || (query.sql.includes('GREATEST') && conditions.length + 1 === query.params.length), `${query.sql} :: ${JSON.stringify(query.params)}`);
    if (table === 'financial_obligations' && Object.hasOwn(fields, 'bucket')) return [
      { bucket: 'overdue', type: 'receivable', count: 1, remainingCents: 7500 },
      { bucket: 'upcoming', type: 'payable', count: 1, remainingCents: 2500 },
    ];
    return data[table].filter(row => conditions.every(([_, field, op], i) => {
      const a = row[keys[field]], b = query.params[i];
      return op === '=' ? a === b : op === '<>' ? a !== b : op === '>=' ? a >= b : op === '<=' ? a <= b : op === '>' ? a > b : a < b;
    })).map(row => Object.fromEntries(Object.keys(fields).map(k => [k, row[k]])));
  }).then(resolve, reject); },
}; } };
const imports = { zod, './models': models, '@/lib/models': models, '@/db': { getDb: () => db }, '@/db/schema': schema, '@/lib/http': http, '@/lib/auth': { getCurrentUser: async () => user }, '@/lib/deployment': { appOrigin: () => 'https://vemo.test' }, '@/lib/quote-data': { loadQuotes: async owner => { reads++; if (failure) throw new Error('PRIVATE'); return quotes.filter(q => q.userId === owner); } } };
function compile(file) {
  const output = ts.transpileModule(readFileSync(new URL('../' + file, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  runInNewContext(output, { module, exports: module.exports, require: name => imports[name] ?? require(name), Request, Response, Headers, URL, Number, BigInt, Date: Clock, Intl, TextDecoder, Uint8Array, Error, console });
  return module.exports;
}
const dates = compile('lib/appointments.ts');
imports['./appointments'] = dates;
imports['@/lib/appointments'] = dates;
let lastRequestError = null;
imports['@/lib/api-security'] = compile('lib/api-security.ts');
const requestError = imports['@/lib/api-security'].requestError;
imports['@/lib/api-security'].requestError = (error, fallback) => { lastRequestError = error; return requestError(error, fallback); };
const periods = imports['./assistant-period'] = imports['@/lib/assistant-period'] = compile('lib/assistant-period.ts');
imports['@/lib/obligations-summary'] = compile('lib/obligations-summary.ts');
const domain = imports['@/lib/assistant-summary'] = compile('lib/assistant-summary.ts');
const { GET } = compile('app/api/assistant/route.ts');
const receipts = imports['@/lib/assistant-receipts'] = compile('lib/assistant-receipts.ts');
const { GET: candidatesGET } = compile('app/api/assistant/receipts/route.ts');
const request = query => new Request('https://vemo.test/api/assistant?' + query);

test('Assistant authenticates before reads and rejects unrecognized, repeated or owner-injected queries', async () => {
  reads = 0; user = null; assert.equal((await GET(request('topic=income'))).status, 401); assert.equal(reads, 0);
  user = { id: 1 };
  for (const query of ['', 'topic=sql', 'topic=income&userId=2', 'topic=income&topic=today']) assert.equal((await GET(request(query))).status, 400);
  assert.equal(reads, 0);
});
test('Assistant income uses Brasilia month-to-date, excludes future and expense, and does not add paid quotes', async () => {
  const response = await GET(request('topic=income')); assert.equal(response.status, 200); assert.match(response.headers.get('cache-control'), /no-store/);
  const { answer } = await response.json(); assert.equal(answer.totalCents, 10000); assert.equal(answer.count, 1); assert.match(answer.period, /30\/09\/2026/); assert.equal(answer.records[0].href, '/orcamentos/3');
  assert.doesNotMatch(JSON.stringify(answer), /Secret|userId/);
});
test('Monthly cashflow isolates owner and month, includes expenses without counting quotes', async () => {
  const response = await GET(request('topic=cashflow')); assert.equal(response.status, 200);
  const { answer } = await response.json();
  assert.deepEqual(answer.cashflow, { incomeCents: 10000, expenseCents: 200, differenceCents: 9800 });
  assert.equal(answer.count, 2); assert.match(answer.period, /01\/09\/2026 a 30\/09\/2026/);
  assert.match(answer.source, /Não é saldo bancário/);
  assert.doesNotMatch(JSON.stringify(answer), /Secret|userId|publicToken/);
  assert.match(answer.records[0].value, /Saída/);
});
test('Month periods handle leap years, year boundaries and Brasilia current-day cutoff', () => {
  for (const [month, end, until] of [['2024-02', '2024-02-29', '2024-03-01'], ['2025-02', '2025-02-28', '2025-03-01'], ['2025-12', '2025-12-31', '2026-01-01']]) {
    const period = periods.assistantMonthPeriod(now, month);
    assert.equal(period.end, end); assert.equal(period.until, until);
  }
  assert.equal(periods.assistantMonthPeriod(new Date('2026-09-15T12:00Z')).end, '2026-09-15');
  assert.equal(periods.assistantMonthPeriod(now).month, '2026-09');
  for (const month of ['', '2026-10', '2026-00', '2026-13', '1999-12', '2026-9', '2026-09-01']) assert.equal(periods.assistantMonthPeriod(now, month), null);
});
test('Historical month queries validate before reads and retain owner isolation', async () => {
  reads = 0;
  for (const query of ['topic=income&month=2026-08', 'topic=today&month=2026-08', 'topic=cashflow&month=', 'topic=cashflow&month=2026-10', 'topic=cashflow&month=2026-08&month=2026-09', 'topic=cashflow&month=2026-08&userId=2']) assert.equal((await GET(request(query))).status, 400, query);
  assert.equal(reads, 0);
  data.transactions.push({ id: 50, userId: 1, type: 'income', amountCents: 3500, transactionDate: '2026-08-31' }, { id: 51, userId: 2, type: 'expense', amountCents: 9000, transactionDate: '2026-08-31' });
  try {
    const { answer } = await (await GET(request('topic=cashflow&month=2026-08'))).json();
    assert.equal(answer.month, '2026-08'); assert.equal(answer.count, 1); assert.equal(answer.cashflow.differenceCents, 3500);
    assert.match(answer.period, /01\/08\/2026 a 31\/08\/2026/);
    assert.equal(domain.cashflowAnswer(data.transactions.filter(row => row.userId === 1), now, '2026-08').count, 1);
  } finally { data.transactions.splice(-2); }
});
test('Monthly summary preserves negatives, empty data, ten-row cap and full totals', () => {
  const rows = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, type: 'expense', amountCents: 100, description: 'Material', transactionDate: '2026-09-01' }));
  const answer = domain.cashflowAnswer([...rows, { ...rows[0], id: 20, type: 'income', amountCents: 500 }, { ...rows[0], id: 21, transactionDate: '2026-08-31' }, { ...rows[0], id: 22, transactionDate: '2026-10-01' }], now);
  assert.equal(answer.cashflow.differenceCents, -700); assert.equal(answer.cashflow.expenseCents, 1200);
  assert.equal(answer.count, 13); assert.equal(answer.records.length, 10);
  const blank = domain.cashflowAnswer([], now); assert.equal(blank.cashflow.differenceCents, 0); assert.equal(blank.count, 0);
  assert.throws(() => domain.cashflowAnswer([{ ...rows[0], amountCents: Number.MAX_SAFE_INTEGER }, rows[0]], now), /TOTAL_OUT_OF_RANGE/);
});
test('Assistant tomorrow includes overnight appointments, excludes midnight-ended/cancelled and other owners', async () => {
  const { answer } = await (await GET(request('topic=tomorrow'))).json(); assert.equal(answer.count, 1); assert.equal(answer.records[0].title, 'Plantão'); assert.equal(answer.href, '/agenda?data=2026-10-01');
  assert.match(answer.records[0].value, /30\/09\/2026/);
});
test('Quote summaries expose only relevant projections and never infer payment lateness', async () => {
  const { answer } = await (await GET(request('topic=receivable'))).json(); assert.equal(answer.totalCents, 30000); assert.equal(answer.count, 1);
  assert.doesNotMatch(JSON.stringify(answer), /SECRET|PRIVATE|publicToken|Other owner/);
  const followups = (await (await GET(request('topic=followups'))).json()).answer; assert.equal(followups.count, 1); assert.equal(followups.records[0].title, 'Joana');
});
test('Receivable clients are grouped by cadastro, scoped by owner and never labeled overdue', async () => {
  const response = await GET(request('topic=receivableClients')); assert.equal(response.status, 200);
  assert.match(response.headers.get('cache-control'), /no-store/);
  const { answer } = await response.json();
  assert.equal(answer.count, 1); assert.equal(answer.totalCents, 30000);
  assert.equal(answer.records[0].href, '/clientes/10');
  assert.match(answer.source, /não indica atraso/);
  assert.doesNotMatch(JSON.stringify(answer), /SECRET|PRIVATE|Other owner|publicToken|userId/);

  const rows = [
    { ...quotes[0], id: 10, totalCents: 5000 },
    { ...quotes[0], id: 11, totalCents: 7000, client: { name: 'Ana antiga' } },
    { ...quotes[0], id: 12, customerId: 11, totalCents: 8000 },
    { ...quotes[0], id: 13, status: 'Pago', totalCents: 3000 },
    { ...quotes[0], id: 14, status: 'Enviado', totalCents: 4000 },
  ];
  const grouped = domain.receivableClientsAnswer(rows, now);
  assert.equal(grouped.count, 2); assert.equal(grouped.totalCents, 20000);
  assert.equal(grouped.records[0].href, '/clientes/10'); assert.equal(grouped.records[0].value, models.formatMoney(12000));
  assert.equal(grouped.records[1].href, '/clientes/11'); assert.equal(grouped.records[1].value, models.formatMoney(8000));
  assert.equal(domain.receivableClientsAnswer([], now).count, 0);
  assert.equal((await GET(request('topic=receivableClients&month=2026-09'))).status, 400);
});
test('Assistant vencimentos subtract partial payments and return only this account past/upcoming items', async () => {
  lastRequestError = null;
  const response = await GET(request('topic=obligations'));
  assert.equal(response.status, 200, lastRequestError?.stack);
  const { answer } = await response.json();
  assert.equal(answer.count, 2);
  assert.equal(answer.obligations.overdue.receivable.remainingCents, 7500);
  assert.equal(answer.obligations.upcoming.payable.remainingCents, 2500);
  assert.deepEqual(answer.records.map(row => row.title), ['Ana', 'Material']);
  assert.doesNotMatch(JSON.stringify(answer), /Other owner|Secret|userId/);
  assert.equal(answer.href, '/financas#contas-previstas');
  assert.equal((await GET(request('topic=obligations&month=2026-09'))).status, 400);
});
test('Obligation answers separate overdue and upcoming receivables from payables and deduct partial payments', () => {
  const buckets = {
    overdue: { receivable: { count: 2, remainingCents: 12500 }, payable: { count: 1, remainingCents: 4000 } },
    upcoming: { receivable: { count: 1, remainingCents: 3000 }, payable: { count: 2, remainingCents: 2500 } },
  };
  const rows = [
    { id: 3, description: 'Material', customerName: null, type: 'payable', dueDate: '2026-09-29', installmentNumber: 1, installmentCount: 1, remainingCents: 4000, bucket: 'overdue' },
    { id: 1, description: 'Serviço elétrica', customerName: 'Ana', type: 'receivable', dueDate: '2026-09-28', installmentNumber: 1, installmentCount: 2, remainingCents: 7500, bucket: 'overdue' },
    { id: 4, description: 'Aluguel', customerName: null, type: 'payable', dueDate: '2026-10-04', installmentNumber: 1, installmentCount: 1, remainingCents: 2500, bucket: 'upcoming' },
  ];
  const answer = domain.obligationAnswer(rows, buckets, '2026-10-08', now);
  assert.equal(answer.count, 6);
  assert.equal(answer.totalCents, undefined);
  assert.equal(answer.records[0].title, 'Ana');
  assert.match(answer.records[0].detail, /A receber · Vencida/);
  assert.equal(answer.records[0].value, models.formatMoney(7500));
  assert.equal(answer.records[0].href, '/financas#contas-previstas');
  assert.match(answer.period, /08\/10\/2026/);
  assert.equal(answer.obligations.overdue.receivable.remainingCents, 12500);
  assert.equal(answer.obligations.upcoming.payable.remainingCents, 2500);
  assert.equal(domain.obligationAnswer([], { overdue: { receivable: { count: 0, remainingCents: 0 }, payable: { count: 0, remainingCents: 0 } }, upcoming: { receivable: { count: 0, remainingCents: 0 }, payable: { count: 0, remainingCents: 0 } } }, '2026-10-08', now).count, 0);
});
test('Followups honor calendar boundary/validity and lists cap at ten without truncating totals', () => {
  const base = quotes[3];
  assert.equal(domain.quoteAnswer([{ ...base, sentAt: '2026-09-28T01:00:00Z' }], 'followups', now).count, 1);
  for (const patch of [{ sentAt: 'invalid' }, { sentAt: '2026-09-28T12:00:00Z' }, { validUntil: '2026-09-29' }, { status: 'Recusado' }]) assert.equal(domain.quoteAnswer([{ ...base, ...patch }], 'followups', now).count, 0);
  const summary = domain.quoteAnswer(Array.from({ length: 12 }, (_, id) => ({ ...quotes[0], id })), 'receivable', now);
  assert.equal(summary.count, 12); assert.equal(summary.records.length, 10); assert.equal(summary.totalCents, 360000);
  assert.equal(domain.incomeAnswer([], now).totalCents, 0);
});
test('Assistant reports database failure as error, never zero or secret details', async () => {
  failure = true;
  try { for (const topic of ['income', 'cashflow', 'today', 'receivable', 'receivableClients']) { const response = await GET(request('topic=' + topic)); assert.equal(response.status, 500); const text = await response.text(); assert.doesNotMatch(text, /PRIVATE|PASSWORD|answer|totalCents/); } } finally { failure = false; }
});

test('Receipt choices authenticate and validate searches before reading the database', async () => {
  reads = 0; user = null;
  assert.equal((await candidatesGET(request(''))).status, 401); assert.equal(reads, 0);
  user = { id: 1 };
  for (const query of ['userId=2', 'q=a&q=b', 'cursor=0', 'cursor=-1', 'cursor=4294967296', 'cursor=1.2', 'cursor=1&cursor=2', 'q=' + 'a'.repeat(121)]) {
    assert.equal((await candidatesGET(request(query))).status, 400, query);
  }
  assert.equal(reads, 0);
});

test('Receipt choices exclude already-linked quotes, project only required fields and isolate owners', async () => {
  const response = await candidatesGET(request(''));
  assert.equal(response.status, 200); assert.match(response.headers.get('cache-control'), /no-store/);
  const body = await response.json(); assert.equal(body.total, 1); assert.equal(body.records[0].id, 1);
  assert.doesNotMatch(JSON.stringify(body), /SECRET|PRIVATE|Other owner|publicToken|userId/);
  const foreignMovement = data.transactions[1]; foreignMovement.quoteId = 1;
  try { assert.equal((await (await candidatesGET(request('q=ana'))).json()).records[0].id, 1); } finally { delete foreignMovement.quoteId; }
  assert.equal((await (await candidatesGET(request('q=nobody'))).json()).total, 0);
});

test('Receipt pagination is exclusive, searches support accents and duplicate names stay separate', () => {
  const rows = Array.from({ length: 25 }, (_, index) => ({ ...quotes[0], id: index + 1, client: { name: 'José Carlos', notes: 'PRIVATE' }, description: 'Instalação elétrica' }));
  const first = receipts.receiptCandidates(rows, new Set([25]), 'jose eletrica');
  assert.equal(first.total, 24); assert.equal(first.records.length, 20); assert.equal(first.nextCursor, 5);
  const second = receipts.receiptCandidates(rows, new Set([25]), 'jose eletrica', first.nextCursor);
  assert.deepEqual(Array.from(second.records, row => row.id), [4, 3, 2, 1]); assert.equal(second.nextCursor, null);
  assert.equal(receipts.receiptCandidates(rows, new Set(), '#24').records[0].id, 24);
  for (const patch of [{ status: 'Rascunho' }, { status: 'Recusado' }, { totalCents: 0 }, { totalCents: -1 }, { totalCents: 100_000_000_001 }, { totalCents: 1.5 }]) {
    assert.equal(receipts.receiptCandidates([{ ...rows[0], ...patch }], new Set(), '').total, 0);
  }
  assert.equal(receipts.receiptCandidates([{ ...rows[0], status: 'Pago' }], new Set(), '').total, 1);
});

test('Receipt choice failure remains an error without private data or a false empty list', async () => {
  failure = true;
  try { const response = await candidatesGET(request('')); assert.equal(response.status, 500); assert.doesNotMatch(await response.text(), /PRIVATE|PASSWORD|records/); }
  finally { failure = false; }
});
