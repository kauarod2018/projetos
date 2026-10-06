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
import * as domain from '../lib/customer-history.ts';
import * as http from '../lib/http.ts';

const require = createRequire(import.meta.url), dialect = new MySqlDialect();
let user = { id: 1 }, calls = [], fail = false;
const data = {
  customers: [{ id: 1, userId: 1, name: 'Ana', notes: 'Privado', phone: '', email: '', address: '', createdAt: '2026-09-29' }, { id: 2, userId: 2, name: 'Outra conta' }],
  quotes: [...Array.from({ length: 30 }, (_, i) => ({ id: i + 1, userId: 1, customerId: 1, description: `Orçamento ${i + 1}`, status: 'Aprovado', totalCents: 4500, createdAt: '2026-09-29', validUntil: '2026-10-01', publicToken: 'SECRET' })), { id: 99, userId: 2, customerId: 1 }, { id: 100, userId: 1, customerId: 7 }],
  appointments: [{ id: 1, userId: 1, customerId: 1, title: 'Visita', status: 'Cancelado', startsAt: '2026-09-29T10:00', endsAt: '2026-09-29T11:00', notes: 'Nota' }, { id: 2, userId: 2, customerId: 1 }, { id: 3, userId: 1, customerId: 7 }],
};
const keys = { user_id: 'userId', customer_id: 'customerId', id: 'id' };
data.transactions = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, userId: 1, quoteId: i + 1, type: 'income', description: 'Pagamento', amountCents: 4500, transactionDate: '2026-08-01', createdAt: '2026-09-29' }));
data.transactions.push(
  { id: 91, userId: 2, quoteId: 1, type: 'income' },
  { id: 92, userId: 1, quoteId: 99, type: 'income' },
  { id: 93, userId: 1, quoteId: 100, type: 'income' },
  { id: 94, userId: 1, quoteId: 1, type: 'expense' },
  { id: 95, userId: 1, quoteId: null, type: 'income' },
);
data.quotes.forEach(q => { q.discountCents = q.id === 29 ? 200 : 0; });
const db = { select(fields) {
  let table, where, join;
  return { from(t) { table = getTableName(t); return this; }, where(c) { where = c; return this; }, innerJoin(t, condition) { join = condition; return this; }, orderBy() { return this; }, then(resolve, reject) {
    try {
      assert.equal(table, 'quote_items');
      const q = dialect.sqlToQuery(where);
      assert.match(q.sql, /`quotes`\.`user_id` = \?/); assert.match(q.sql, /`quotes`\.`customer_id` = \?/); assert.match(q.sql, /`quotes`\.`id` in/);
      const [owner, customer, ...ids] = q.params;
      return Promise.resolve(data.quotes.filter(row => row.userId === owner && row.customerId === customer && ids.includes(row.id)).map(row => ({ quoteId: row.id, quantity: 0.5, unitPriceCents: 101 }))).then(resolve, reject);
    } catch (error) { return Promise.reject(error).then(resolve, reject); }
  }, async limit(limit) {
    calls.push(table); if (fail) throw new Error('DB_PASSWORD=private');
    const q = dialect.sqlToQuery(where);
    assert.match(q.sql, /`user_id` = \?/);
    if (table !== 'customers') { assert.match(q.sql, /`customer_id` = \?/); assert.equal(limit, 21); }
    if (table === 'transactions') {
      assert.match(dialect.sqlToQuery(join).sql, /`transactions`\.`quote_id` = `quotes`\.`id`/);
      assert.match(q.sql, /`transactions`\.`user_id` = \?/);
      assert.match(q.sql, /`quotes`\.`user_id` = \?/);
      assert.match(q.sql, /`transactions`\.`type` = \?/);
      const [movementOwner, quoteOwner, customer, type, before] = q.params;
      return data.transactions.filter(row => row.userId === movementOwner && row.type === type && (!before || row.id < before) && data.quotes.some(quote => quote.id === row.quoteId && quote.userId === quoteOwner && quote.customerId === customer))
        .sort((a, b) => b.id - a.id).slice(0, limit).map(row => Object.fromEntries(Object.keys(fields).map(key => [key, row[key]])));
    }
    const conditions = [...q.sql.matchAll(/`\w+`\.`(\w+)` (=|<) \?/g)];
    assert.equal(conditions.length, q.params.length);
    return data[table].filter(row => conditions.every((c, i) => c[2] === '=' ? row[keys[c[1]]] === q.params[i] : row[keys[c[1]]] < q.params[i])).sort((a, b) => b.id - a.id).slice(0, limit).map(row => Object.fromEntries(Object.keys(fields).map(key => [key, row[key]])));
  } };
} };
const imports = { zod, '@/db': { getDb: () => db }, '@/db/schema': schema, '@/lib/customer-history': domain, '@/lib/http': http, '@/lib/auth': { getCurrentUser: async () => user }, '@/lib/deployment': { appOrigin: () => 'https://vemo.test' } };
function compile(file) {
  const output = ts.transpileModule(readFileSync(new URL('../' + file, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  runInNewContext(output, { module, exports: module.exports, require: name => imports[name] ?? require(name), Request, Response, Headers, TextDecoder, Uint8Array, Error, Date, URL, Number, console });
  return module.exports;
}
imports['@/lib/api-security'] = compile('lib/api-security.ts');
imports['@/lib/service-data'] = compile('lib/service-data.ts');
const { GET } = compile('app/api/customers/[id]/history/route.ts');
const request = (query = '') => new Request('https://vemo.test/api/customers/1/history' + query);
const context = id => ({ params: Promise.resolve({ id: String(id) }) });
test('History authentication, ownership and absent IDs have no cross-account disclosures', async () => {
  calls = []; user = null; assert.equal((await GET(request(), context(1))).status, 401); assert.deepEqual(calls, []);
  user = { id: 2 }; const other = await GET(request(), context(1)); assert.equal(other.status, 404); assert.deepEqual(calls, ['customers']);
  user = { id: 1 }; assert.equal((await GET(request(), context(999))).status, 404);
  for (const id of ['0', '1 OR 1=1', '4294967296']) assert.equal((await GET(request(), context(id))).status, 404);
});
test('Quote pages filter by owner AND client, omit tokens, use stable exclusive cursors', async () => {
  const response = await GET(request(), context(1)); assert.equal(response.status, 200); assert.match(response.headers.get('cache-control'), /no-store/);
  const first = await response.json(); assert.equal(first.records.length, 20); assert.equal(first.records[0].id, 30); assert.equal(first.nextCursor, 11);
  assert.equal(first.records[0].totalCents, 51); assert.equal(first.records[1].totalCents, 0);
  assert.equal('userId' in first.customer, false); assert.equal('publicToken' in first.records[0], false);
  const second = await (await GET(request('?before=11'), context(1))).json();
  assert.equal(second.records.length, 10); assert.equal(second.records[0].id, 10); assert.equal(second.nextCursor, null);
  assert.equal(new Set([...first.records, ...second.records].map(r => r.id)).size, 30);
});
test('Appointment history retains cancellations and excludes other customers and owners', async () => {
  const result = await (await GET(request('?kind=appointments'), context(1))).json();
  assert.equal(result.kind, 'appointments'); assert.equal(result.records.length, 1); assert.equal(result.records[0].status, 'Cancelado');
  assert.equal('userId' in result.records[0], false); assert.equal(result.nextCursor, null);
});

test('Receipt history scopes both joined owners and customer, omits unlinked/expense records, pages without duplicates', async () => {
  const response = await GET(request('?kind=receipts'), context(1));
  assert.equal(response.status, 200); assert.match(response.headers.get('cache-control'), /no-store/);
  const first = await response.json(); assert.equal(first.kind, 'receipts'); assert.equal(first.records.length, 20);
  assert.equal(first.records[0].id, 25); assert.equal(first.nextCursor, 6);
  assert.equal(first.records[0].transactionDate, '2026-08-01'); assert.equal(first.records[0].createdAt, '2026-09-29');
  assert.equal(first.records[0].amountCents, 4500); assert.equal('userId' in first.records[0], false); assert.equal('publicToken' in first.records[0], false);
  const second = await (await GET(request('?kind=receipts&before=6'), context(1))).json();
  assert.equal(second.records.length, 5); assert.equal(second.nextCursor, null);
  assert.equal(new Set([...first.records, ...second.records].map(row => row.id)).size, 25);
  assert.equal((await GET(request('?kind=receipts'), context(2))).status, 404);
  const empty = await (await GET(request('?kind=receipts&before=1'), context(1))).json(); assert.deepEqual(empty.records, []);
});
test('Bad filters fail before reading data and database failures do not expose secrets', async () => {
  calls = [];
  for (const query of ['?kind=users', '?before=-1', '?before=1.2', '?before=0', '?before=4294967296', '?before=1%20OR%201=1']) assert.equal((await GET(request(query), context(1))).status, 400);
  assert.deepEqual(calls, []); fail = true;
  try { const response = await GET(request(), context(1)); assert.equal(response.status, 500); assert.doesNotMatch(await response.text(), /PASSWORD|private/); } finally { fail = false; }
});
