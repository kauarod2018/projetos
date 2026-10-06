import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { MySqlDialect } from 'drizzle-orm/mysql-core';
import * as schema from '../db/schema.ts';
import * as http from '../lib/http.ts';
import * as models from '../lib/models.ts';

const require = createRequire(import.meta.url), dialect = new MySqlDialect();
let user = { id: 1 }, rows = [], activity = [], accesses = 0, locks = 0, fail = false;
const matches = (condition, row) => {
  const query = dialect.sqlToQuery(condition);
  assert.match(query.sql, /`customers`\.`user_id` = \?/);
  const terms = [...query.sql.matchAll(/`customers`\.`(\w+)` = \?/g)];
  assert.equal(terms.length, query.params.length);
  return terms.every((term, i) => row[({ user_id: 'userId', request_key: 'requestKey', id: 'id' })[term[1]]] === query.params[i]);
};
const db = {
  async transaction(callback) { return callback(db); },
  select(fields) {
    accesses++; if (fail) throw new Error('DB_PASSWORD=private');
    let table, condition;
    const read = () => table === schema.users ? [{ id: user.id }] : rows.filter(row => matches(condition, row)).map(row => Object.fromEntries(Object.keys(fields).map(key => [key, row[key]])));
    const query = { from(value) { table = value; return query; }, where(value) { condition = value; return query; }, async for(mode) { assert.equal(mode, 'update'); if (table === schema.users) { assert.deepEqual(dialect.sqlToQuery(condition).params, [user.id]); locks++; } return read(); }, async orderBy() { return read(); }, then(resolve, reject) { return Promise.resolve().then(read).then(resolve, reject); } };
    return query;
  },
  insert(table) { return { values(value) { if (table === schema.businessActivity) { activity.push(value); return Promise.resolve(); } return { async $returningId() { const row = { id: rows.length + 1, createdAt: '2026-09-30', ...value }; rows.push(row); return [{ id: row.id }]; } }; } }; },
};
const imports = { '@/db': { getDb: () => db }, '@/db/schema': schema, '@/lib/http': http, './models': models, '@/lib/auth': { getCurrentUser: async () => user }, '@/lib/deployment': { appOrigin: () => 'https://vemo.test' }, '@/lib/quote-data': { databaseError: () => 'Falha ao acessar dados.' } };
function compile(path) {
  const output = ts.transpileModule(readFileSync(new URL('../' + path, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  runInNewContext(output, { module, exports: module.exports, require: name => imports[name] ?? require(name), Request, Response, Headers, TextDecoder, Uint8Array, Error, Date, URL, console });
  return module.exports;
}
imports['./transaction-categories'] = { expenseCategories: ['Materiais', 'Transporte', 'Ferramentas', 'Contas do negócio', 'Alimentação', 'Serviços terceirizados', 'Marketing', 'Outros'] };
imports['./pix'] = { pixText: value => value };
imports['@/lib/validation'] = compile('lib/validation.ts');
imports['@/lib/api-security'] = compile('lib/api-security.ts');
const route = compile('app/api/customers/route.ts');
const payload = () => ({ name: ' Ana ', email: 'ANA@EXAMPLE.COM', requestKey: crypto.randomUUID() });
const request = (body, origin = 'https://vemo.test') => new Request('https://vemo.test/api/customers', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify(body) });

test('Customer creation requires owner authentication and same-origin before DB access', async () => {
  accesses = 0; user = null;
  assert.equal((await route.POST(request(payload()))).status, 401);
  user = { id: 1 };
  assert.equal((await route.POST(request(payload(), 'https://evil.test'))).status, 403);
  assert.equal(accesses, 0);
});
test('Guided customer retry reuses saved record, rejects changed payload and isolates owners', async () => {
  rows = []; activity = []; locks = 0; user = { id: 1 }; const body = payload();
  const first = await route.POST(request(body)); assert.equal(first.status, 201);
  const saved = (await first.json()).customer;
  assert.equal(saved.name, 'Ana'); assert.equal(saved.email, 'ana@example.com');
  assert.equal('requestKey' in saved, false); assert.equal('userId' in saved, false);
  assert.equal((await route.POST(request(body))).status, 201); assert.equal(rows.length, 1); assert.equal(activity.length, 1);
  assert.equal((await route.POST(request({ ...body, name: 'Bia' }))).status, 409);
  rows[0].name = 'Editado';
  assert.equal((await route.POST(request(body))).status, 409); assert.equal(rows.length, 1);
  user = { id: 2 }; assert.equal((await route.POST(request(body))).status, 201); assert.equal(rows.length, 2);
  assert.equal(locks, 5);
});
test('Legacy creation remains supported and invalid keys/ownership/fields cannot write', async () => {
  user = { id: 1 }; const before = rows.length;
  assert.equal((await route.POST(request({ name: 'Sem chave' }))).status, 201);
  assert.equal(rows.length, before + 1);
  for (const body of [{ ...payload(), userId: 2 }, { ...payload(), requestKey: 'bad' }, { ...payload(), name: ' ' }, { ...payload(), email: 'bad' }, { ...payload(), notes: 'x'.repeat(1001) }]) assert.equal((await route.POST(request(body))).status, 400);
  assert.equal((await route.POST(request({ name: 'x'.repeat(17000) }))).status, 413);
  assert.equal(rows.length, before + 1);
});
test('Customer DB failures do not leak secrets', async () => {
  fail = true;
  try { const response = await route.POST(request(payload())); assert.equal(response.status, 500); assert.doesNotMatch(await response.text(), /PASSWORD|private/); } finally { fail = false; }
});
test('Customer request DDL only adds nullable retry metadata', () => {
  const ddl = readFileSync(new URL('../database/schema.sql', import.meta.url), 'utf8');
  assert.match(ddl, /request_key VARCHAR\(36\) NULL/);
  assert.match(ddl, /UNIQUE KEY uq_customers_owner_request \(user_id, request_key\)/);
  assert.doesNotMatch(ddl, /^\s*(DROP TABLE|DELETE FROM|TRUNCATE TABLE)\b/im);
});
