import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import * as zod from 'zod';
import { getTableName } from 'drizzle-orm';
import { MySqlDialect } from 'drizzle-orm/mysql-core';
import * as schema from '../db/schema.ts';
import * as http from '../lib/http.ts';
import * as models from '../lib/models.ts';
import { financeSummary } from '../lib/finance-summary.ts';

const require = createRequire(import.meta.url), dialect = new MySqlDialect();
let user, data, calls, failUpdate;
function reset() {
  user = { id: 1 }; calls = []; failUpdate = false;
  data = { users: [{ id: 1 }], quotes: [{ id: 1, userId: 1, status: 'Aprovado', discountCents: 50, approvedAt: '2026-09-01' }, { id: 2, userId: 2, status: 'Aprovado', discountCents: 0 }], quote_items: [{ quoteId: 1, quantity: 2.5, unitPriceCents: 100 }], transactions: [] };
}
const names = { user_id: 'userId', quote_id: 'quoteId', obligation_id: 'obligationId', voided_at: 'voidedAt', reversal_of_id: 'reversalOfId', id: 'id', transaction_id: 'transactionId', version: 'version' };
function match(row, where) {
  const query = dialect.sqlToQuery(where);
  const conditions = [...query.sql.matchAll(/`\w+`\.`(\w+)` = \?/g)];
  assert.equal(conditions.length, query.params.length);
  return conditions.every((c, i) => row[names[c[1]]] === query.params[i]) && [...query.sql.matchAll(/`\w+`\.`(\w+)` is null/gi)].every(c => row[names[c[1]]] == null);
}
const db = {
  async transaction(fn) { const backup = structuredClone(data); try { return await fn(db); } catch (error) { data = backup; throw error; } },
  select(fields) {
    let table, condition;
    const run = () => {
      const q = dialect.sqlToQuery(condition); calls.push({ table, sql: q.sql });
      if (['quotes', 'transactions', 'receipt_date_corrections'].includes(table)) assert.match(q.sql, /`user_id` = \?/);
      return (data[table] ?? []).filter(row => match(row, condition)).map(row => fields ? Object.fromEntries(Object.keys(fields).map(k => [k, row[k]])) : { ...row });
    };
    return { from(t) { table = getTableName(t); return this; }, orderBy() { return this; }, where(c) { condition = c; return this; }, async for(lock) { assert.equal(lock, 'update'); return run(); }, async limit(n) { return run().slice(0, n); }, then(resolve, reject) { return Promise.resolve().then(run).then(resolve, reject); } };
  },
  insert(t) { return { values(values) {
    const run = () => { const rows = data[getTableName(t)] ??= []; const id = rows.length + 10; rows.push({ receiptVersion: 1, ...values, id, createdAt: '2026-09-29T12:00:00.000Z' }); return [{ id }]; };
    return { async $returningId() { return run(); }, then(resolve, reject) { return Promise.resolve().then(run).then(resolve, reject); } };
  } }; },
  update(t) { return { set(values) { return { async where(condition) { if (failUpdate) throw new Error('DB_PASSWORD=secret'); for (const row of data[getTableName(t)]) if (match(row, condition)) Object.assign(row, { ...values, ...(values.approvedAt && typeof values.approvedAt === 'object' ? { approvedAt: row.approvedAt ?? new Date().toISOString() } : {}) }); } }; } }; },
  delete(t) { return { async where(condition) { data[getTableName(t)] = data[getTableName(t)].filter(row => !match(row, condition)); } }; },
};
const imports = { zod, '@/db': { getDb: () => db }, '@/db/schema': schema, '@/lib/http': http, './models': models, '@/lib/models': models, '@/lib/appointments': { brasiliaDay: () => '2026-09-29' }, '@/lib/auth': { getCurrentUser: async () => user }, '@/lib/deployment': { appOrigin: () => 'https://vemo.test' }, '@/lib/quote-data': { loadQuote: async () => data.quotes[0], databaseError: () => 'Erro ao salvar.' }, '@/lib/quote-editing': {} };
imports['@/lib/auth'].createPublicToken = () => 'b'.repeat(32);
function compile(file) {
  const output = ts.transpileModule(readFileSync(new URL('../' + file, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  runInNewContext(output, { module, exports: module.exports, require: name => imports[name] ?? require(name), Request, Response, Headers, TextDecoder, Uint8Array, Error, Date, URL, Number, console });
  return module.exports;
}
imports['@/lib/api-security'] = compile('lib/api-security.ts');
imports['./transaction-categories'] = { expenseCategories: ['Materiais', 'Transporte', 'Ferramentas', 'Contas do negócio', 'Alimentação', 'Serviços terceirizados', 'Marketing', 'Outros'] };
imports['./pix'] = { pixText: value => value };
imports['./validation'] = imports['@/lib/validation'] = compile('lib/validation.ts');
const domain = imports['@/lib/quote-receipts'] = compile('lib/quote-receipts.ts');
const route = compile('app/api/quotes/[id]/receipt/route.ts');
const quoteRoute = compile('app/api/quotes/[id]/route.ts');
const context = (id = 1) => ({ params: Promise.resolve({ id: String(id) }) });
const body = { amountCents: 200, transactionDate: '2026-09-28' };
const req = (value = body, method = 'POST', origin = 'https://vemo.test') => new Request('https://vemo.test/api/quotes/1/receipt', { method, headers: { origin, 'content-type': 'application/json' }, ...(method === 'GET' ? {} : { body: JSON.stringify(value) }) });

test('Receipt rejects unauthenticated, foreign origin, foreign owner and invalid IDs', async () => {
  reset(); user = null; assert.equal((await route.POST(req(), context())).status, 401); assert.equal((await route.GET(req(null, 'GET'), context())).status, 401); assert.equal(calls.length, 0);
  user = { id: 1 }; assert.equal((await route.POST(req(body, 'POST', 'https://evil.test'), context())).status, 403);
  assert.equal((await route.POST(req(), context(2))).status, 404); assert.equal((await route.GET(req(null, 'GET'), context(2))).status, 404);
  for (const id of ['0', '4294967296', '1 OR 1=1']) assert.equal((await route.POST(req(), context(id))).status, 404);
  assert.equal(data.transactions.length, 0);
});
test('Receipt validates money, calendar, future dates, unknown keys and current total', async () => {
  reset();
  for (const invalid of [{ ...body, amountCents: 0 }, { ...body, amountCents: 2.5 }, { ...body, transactionDate: '2026-02-30' }, { ...body, transactionDate: '2026-10-01' }, { ...body, userId: 2 }]) assert.equal((await route.POST(req(invalid), context())).status, 400);
  assert.equal((await route.POST(req({ ...body, amountCents: 201 }), context())).status, 409);
  data.quotes[0].status = 'Rascunho'; assert.equal((await route.POST(req(), context())).status, 409); assert.equal(data.transactions.length, 0);
  assert.equal(domain.receiptTotal([{ quantity: 0.5, unitPriceCents: 101 }], 0), 51);
  assert.equal(domain.receiptTotal([], 0), null);
});
test('Receipt creates a single dated movement and replay does not duplicate money', async () => {
  reset(); assert.equal((await route.POST(req(), context())).status, 201); assert.equal(data.quotes[0].status, 'Pago');
  assert.equal((await route.POST(req(), context())).status, 200); assert.equal(data.transactions.length, 1); assert.equal(data.transactions[0].amountCents, 200);
  assert.equal((await route.POST(req({ ...body, transactionDate: '2026-09-27' }), context())).status, 409);
  const result = await (await route.GET(req(null, 'GET'), context())).json(); assert.equal(result.receipt.quoteId, 1); assert.equal('userId' in result.receipt, false);
});

test('Receipt from the quote also settles the single linked charge and cannot link another obligation payment', async () => {
  reset(); data.financial_obligations = [{ id: 20, userId: 1, quoteId: 1, type: 'receivable', status: 'open', version: 1, amountCents: 200 }];
  assert.equal((await route.POST(req(), context())).status, 201);
  assert.equal(data.financial_obligations[0].status, 'paid'); assert.equal(data.transactions[0].obligationId, 20);
  assert.equal((await route.POST(req(), context())).status, 200); assert.equal(data.transactions.length, 1);
  for (const change of [{ obligationId: 99 }, { voidedAt: '2026-09-28' }, { reversalOfId: 3 }]) {
    reset(); data.transactions.push({ id: 5, userId: 1, quoteId: null, type: 'income', amountCents: 200, transactionDate: body.transactionDate, ...change });
    assert.equal((await route.POST(req({ ...body, existingTransactionId: 5 }), context())).status, 409);
  }
});
test('Canceled, inconsistent, partial or duplicate linked charges cannot produce another receipt', async () => {
  for (const change of [{ status: 'canceled' }, { amountCents: 201 }, { type: 'payable' }]) {
    reset(); data.financial_obligations = [{ id: 20, userId: 1, quoteId: 1, type: 'receivable', status: 'open', version: 1, amountCents: 200, ...change }];
    assert.equal((await route.POST(req(), context())).status, 409); assert.equal(data.transactions.length, 0);
  }
  reset(); data.financial_obligations = [{ id: 20, userId: 1, quoteId: 1, type: 'receivable', status: 'open', version: 1, amountCents: 200 }];
  data.transactions = [{ id: 5, userId: 1, obligationId: 20, quoteId: null, type: 'income', amountCents: 50 }];
  assert.equal((await route.POST(req(), context())).status, 409); assert.equal(data.transactions.length, 1);
});
test('Existing income linking preserves amount/date and creates no new money', async () => {
  reset(); data.transactions.push({ id: 5, userId: 1, quoteId: null, type: 'income', amountCents: 200, transactionDate: body.transactionDate, description: 'Carlos' });
  assert.equal((await route.POST(req({ ...body, existingTransactionId: 5 }), context())).status, 201);
  assert.equal(data.transactions.length, 1); assert.equal(data.transactions[0].quoteId, 1); assert.equal(data.transactions[0].description, 'Carlos');
});
test('Cannot link someone else income, expense, used entry or mismatching date/amount', async () => {
  for (const change of [{ userId: 2 }, { type: 'expense' }, { quoteId: 4 }, { transactionDate: '2026-09-01' }, { amountCents: 100 }]) {
    reset(); data.transactions.push({ id: 5, userId: 1, quoteId: null, type: 'income', amountCents: 200, transactionDate: body.transactionDate, ...change });
    assert.equal((await route.POST(req({ ...body, existingTransactionId: 5 }), context())).status, 409); assert.equal(data.quotes[0].status, 'Aprovado'); assert.equal(data.transactions.length, 1);
  }
});
test('Write failure rolls back receipt and returns no database details', async () => {
  reset(); failUpdate = true; const response = await route.POST(req(), context()); assert.equal(response.status, 500); assert.doesNotMatch(await response.text(), /PASSWORD|secret/); assert.equal(data.transactions.length, 0); assert.equal(data.quotes[0].status, 'Aprovado');
});
test('Paid cannot bypass receipt and linked quotes cannot change status or be deleted', async () => {
  reset(); assert.equal((await quoteRoute.PATCH(req({ status: 'Pago' }, 'PATCH'), context())).status, 409);
  await route.POST(req(), context()); assert.equal((await quoteRoute.PATCH(req({ status: 'Rascunho' }, 'PATCH'), context())).status, 409);
  assert.equal((await quoteRoute.DELETE(req({}, 'DELETE'), context())).status, 409); assert.equal(data.quotes.length, 2);
});
test('Finance totals use movement date exactly once and flag legacy paid quotes', () => {
  const quotes = [{ id: 1, status: 'Pago', totalCents: 200, updatedAt: '2026-09-29' }, { id: 2, status: 'Pago', totalCents: 500 }, { id: 3, status: 'Aprovado', totalCents: 400 }];
  const movements = [{ id: 1, quoteId: 1, type: 'income', amountCents: 200, transactionDate: '2026-08-01' }, { id: 2, type: 'expense', amountCents: 50, transactionDate: '2026-09-01' }];
  const summary = financeSummary(quotes, movements, '2026-09'); assert.equal(summary.income, 0); assert.equal(summary.balance, -50); assert.equal(summary.receivable, 400); assert.deepEqual(summary.unlinkedPaid.map(q => q.id), [2]);
  assert.equal(financeSummary(quotes, movements, '2026-08').income, 200);
});

test('Old completed and rejected quotes can change stage without creating money', async () => {
  for (const previous of ['Finalizado', 'Recusado', 'Enviado', 'Pago']) {
    reset(); Object.assign(data.quotes[0], { status: previous, updatedAt: '2023-01-01T12:00:00.000Z' });
    const response = await quoteRoute.PATCH(req({ status: 'Em andamento', expectedUpdatedAt: data.quotes[0].updatedAt }, 'PATCH'), context());
    assert.equal(response.status, 200, previous); assert.equal(data.quotes[0].status, 'Em andamento'); assert.equal(data.transactions.length, 0);
  }
  reset(); data.quotes[0].updatedAt = '2023-01-01T12:00:00.000Z';
  assert.equal((await quoteRoute.PATCH(req({ status: 'Recusado', expectedUpdatedAt: '2022-01-01' }, 'PATCH'), context())).status, 412);
  assert.equal(data.quotes[0].status, 'Aprovado');
  assert.equal((await quoteRoute.PATCH(req({ status: 'Finalizado', userId: 2 }, 'PATCH'), context())).status, 400);
});

test('Closed jobs and canceled charges do not freeze old quote stages; open links still do', async () => {
  reset(); data.appointments = [{ id: 8, userId: 1, quoteId: 1, status: 'Concluído' }]; data.financial_obligations = [{ id: 20, userId: 1, quoteId: 1, status: 'canceled' }];
  assert.equal((await quoteRoute.PATCH(req({ status: 'Recusado' }, 'PATCH'), context())).status, 200);
  assert.equal(data.appointments[0].status, 'Concluído'); assert.equal(data.financial_obligations[0].status, 'canceled');
  reset(); data.appointments = [{ id: 8, userId: 1, quoteId: 1, status: 'Agendado' }];
  assert.equal((await quoteRoute.PATCH(req({ status: 'Recusado' }, 'PATCH'), context())).status, 409);
  assert.equal((await quoteRoute.PATCH(req({ status: 'Finalizado' }, 'PATCH'), context())).status, 200);
  const options = await (await quoteRoute.GET(req(null, 'GET'), context())).json(); assert.deepEqual(Array.from(options.statusOptions), ['Aprovado', 'Em andamento', 'Finalizado']);
});

test('Finished quotes without links can be deleted; even voided financial history is preserved', async () => {
  reset(); data.quotes[0].status = 'Finalizado'; assert.equal((await quoteRoute.DELETE(req({}, 'DELETE'), context())).status, 200); assert.equal(data.quotes.length, 1);
  reset(); data.transactions = [{ id: 5, userId: 1, quoteId: 1, voidedAt: '2026-09-28' }];
  const response = await quoteRoute.DELETE(req({}, 'DELETE'), context()); assert.equal(response.status, 409); assert.match((await response.json()).error, /Arquivar/); assert.equal(data.transactions.length, 1);
});

test('Archive and restore preserve links and money, rotate acceptance token and detect stale changes', async () => {
  reset(); Object.assign(data.quotes[0], { updatedAt: '2023-01-01T12:00:00.000Z', publicToken: 'a'.repeat(32) });
  data.appointments = [{ id: 8, userId: 1, quoteId: 1, status: 'Concluído' }];
  await route.POST(req(), context());
  const history = structuredClone({ visits: data.appointments, transactions: data.transactions });
  const version = data.quotes[0].updatedAt;
  assert.equal((await quoteRoute.POST(req({ action: 'archive', expectedUpdatedAt: 'stale' }), context())).status, 412);
  assert.equal((await quoteRoute.POST(req({ action: 'archive', expectedUpdatedAt: version }), context())).status, 200);
  assert.ok(data.quotes[0].archivedAt); assert.equal(data.quotes[0].publicToken, 'b'.repeat(32));
  assert.equal((await quoteRoute.POST(req({ action: 'archive', expectedUpdatedAt: version }), context())).status, 200);
  assert.equal(data.business_activity.filter(row => row.action === 'quote.archive').length, 1);
  assert.equal((await quoteRoute.PATCH(req({ status: 'Finalizado' }, 'PATCH'), context())).status, 409);
  assert.equal((await quoteRoute.POST(req({ action: 'restore', expectedUpdatedAt: data.quotes[0].updatedAt }), context())).status, 200);
  assert.equal(data.quotes[0].archivedAt, null); assert.equal(data.quotes[0].status, 'Pago');
  assert.deepEqual({ visits: data.appointments, transactions: data.transactions }, history);
});

test('Archive validates authentication, origin, ownership and strict input before writes', async () => {
  reset(); const body = { action: 'archive', expectedUpdatedAt: '2023-01-01' };
  user = null; assert.equal((await quoteRoute.POST(req(body), context())).status, 401); assert.equal(calls.length, 0);
  user = { id: 1 }; assert.equal((await quoteRoute.POST(req(body, 'POST', 'https://evil.test'), context())).status, 403);
  assert.equal((await quoteRoute.POST(req(body), context(2))).status, 404);
  assert.equal((await quoteRoute.POST(req({ ...body, userId: 2 }), context())).status, 400);
  assert.equal(data.quotes[0].archivedAt, undefined);
});

test('Archive migration only adds nullable metadata and public acceptance rejects archived records', () => {
  const migration = readFileSync(new URL('../database/017-quote-archive.sql', import.meta.url), 'utf8');
  assert.match(migration, /ADD COLUMN archived_at VARCHAR\(24\) NULL/); assert.doesNotMatch(migration, /\b(DROP|DELETE|TRUNCATE|UPDATE)\b/i);
  const publicRoute = readFileSync(new URL('../app/api/public/quotes/[token]/route.ts', import.meta.url), 'utf8');
  assert.match(publicRoute, /isNull\(quotes\.archivedAt\)/);
});

const correction = { receiptId: 10, expectedVersion: 1, transactionDate: '2026-08-20', reason: 'Data informada por engano' };
test('Correction DDL is additive, versioned and leaves existing money unchanged', () => {
  const sql = readFileSync(new URL('../database/schema.sql', import.meta.url), 'utf8');
  assert.match(sql, /receipt_version INT UNSIGNED NOT NULL DEFAULT 1/);
  assert.match(sql, /UNIQUE KEY uq_receipt_correction_version \(transaction_id, version\)/);
  assert.match(sql, /FOREIGN KEY \(transaction_id\) REFERENCES transactions\(id\)/);
  assert.doesNotMatch(sql, /\b(DROP|TRUNCATE|UPDATE|DELETE)\s+(TABLE|FROM|transactions|quotes)/i);
});
test('Correction validates identity, origin, ownership and receipt association', async () => {
  reset(); user = null; assert.equal((await route.PATCH(req(correction, 'PATCH'), context())).status, 401); assert.equal(calls.length, 0);
  user = { id: 1 }; assert.equal((await route.PATCH(req(correction, 'PATCH', 'https://evil.test'), context())).status, 403);
  await route.POST(req(), context());
  assert.equal((await route.PATCH(req(correction, 'PATCH'), context(2))).status, 404);
  assert.equal((await route.PATCH(req({ ...correction, receiptId: 99 }, 'PATCH'), context())).status, 404);
  user = { id: 2 }; assert.equal((await route.PATCH(req(correction, 'PATCH'), context())).status, 404);
  assert.equal(data.transactions[0].transactionDate, body.transactionDate);
});
test('Correction rejects impossible/future/unchanged dates, blank reason and mass assignment', async () => {
  reset(); await route.POST(req(), context());
  for (const invalid of [{ ...correction, transactionDate: '2026-02-30' }, { ...correction, transactionDate: '2026-10-01' }, { ...correction, transactionDate: body.transactionDate }, { ...correction, reason: '   ' }, { ...correction, reason: 'x'.repeat(501) }, { ...correction, amountCents: 999 }, { ...correction, expectedVersion: 0 }]) assert.equal((await route.PATCH(req(invalid, 'PATCH'), context())).status, 400);
  assert.equal(data.receipt_date_corrections, undefined);
});
test('Correction preserves money/status, creates private audit and moves only the dated total', async () => {
  reset(); await route.POST(req(), context());
  assert.equal((await route.PATCH(req(correction, 'PATCH'), context())).status, 200);
  assert.equal(data.transactions.length, 1); assert.equal(data.transactions[0].amountCents, 200); assert.equal(data.quotes[0].status, 'Pago');
  assert.equal(data.transactions[0].receiptVersion, 2);
  assert.equal(financeSummary([], data.transactions, '2026-09').income, 0);
  assert.equal(financeSummary([], data.transactions, '2026-08').income, 200);
  data.receipt_date_corrections.push({ id: 99, userId: 2, transactionId: 10, reason: 'Other owner secret' });
  const result = await (await route.GET(req(null, 'GET'), context())).json();
  assert.equal(result.corrections.length, 1); assert.equal(result.corrections[0].previousDate, body.transactionDate); assert.equal(result.corrections[0].correctedDate, correction.transactionDate);
  assert.equal('userId' in result.corrections[0], false);
});
test('Correction retry is idempotent and stale version cannot overwrite a later correction, even after date returns', async () => {
  reset(); await route.POST(req(), context());
  await route.PATCH(req(correction, 'PATCH'), context());
  assert.equal((await route.PATCH(req(correction, 'PATCH'), context())).status, 200); assert.equal(data.receipt_date_corrections.length, 1);
  assert.equal((await route.PATCH(req({ ...correction, reason: 'Outro motivo' }, 'PATCH'), context())).status, 409);
  await route.PATCH(req({ ...correction, expectedVersion: 2, transactionDate: body.transactionDate }, 'PATCH'), context());
  assert.equal((await route.PATCH(req(correction, 'PATCH'), context())).status, 409); assert.equal(data.receipt_date_corrections.length, 2);
});
test('Correction and audit roll back together when update fails', async () => {
  reset(); await route.POST(req(), context()); failUpdate = true;
  const response = await route.PATCH(req(correction, 'PATCH'), context()); assert.equal(response.status, 500); assert.doesNotMatch(await response.text(), /PASSWORD|secret/);
  assert.equal(data.receipt_date_corrections, undefined); assert.equal(data.transactions[0].transactionDate, body.transactionDate); assert.equal(data.transactions[0].receiptVersion, 1);
});
