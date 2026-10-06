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
import * as domain from '../lib/appointments.ts';
import * as http from '../lib/http.ts';

const require = createRequire(import.meta.url), dialect = new MySqlDialect();
let user = { id: 1 }, calls = 0, failDb = false, trace = [];
let data;
function reset() {
  user = { id: 1 }; calls = 0; trace = []; failDb = false;
  data = { users: [{ id: 1 }, { id: 2 }], customers: [{ id: 1, userId: 1, name: 'Ana' }, { id: 2, userId: 2, name: 'Private' }], services: [{ id: 1, userId: 1, archived: false }, { id: 2, userId: 2, archived: false }, { id: 3, userId: 1, archived: true }], appointments: [], appointment_series: [], business_activity: [] };
}
const keys = { user_id: 'userId', id: 'id', request_key: 'requestKey', status: 'status', starts_at: 'startsAt', ends_at: 'endsAt', customer_id: 'customerId', service_id: 'serviceId', title: 'title', duration_minutes: 'durationMinutes', notes: 'notes', series_id: 'seriesId', starts_on: 'startsOn', recurrence: 'recurrence' };
function matches(condition, row, table) {
  const q = dialect.sqlToQuery(condition);
  assert.match(q.sql, new RegExp('`' + table + '`\\.`' + (table === 'users' ? 'id' : 'user_id') + '` = \\?'));
  const terms = [...q.sql.matchAll(/`\w+`\.`(\w+)` (=|<>|<|>) \?/g)];
  assert.equal(terms.length, q.params.length, q.sql);
    return terms.every((term, i) => { const a = row[keys[term[1]]], b = q.params[i]; return term[2] === '=' ? a === b : term[2] === '<>' ? a !== b : term[2] === '<' ? a < b : a > b; });
}
const db = {
  async transaction(callback) { trace = []; return callback(db); },
  select(fields) {
    calls++; if (failDb) throw new Error('DB_PASSWORD=private');
    let table, condition;
    const rows = () => data[table].filter(row => matches(condition, row, table)).map(row => fields ? Object.fromEntries(Object.keys(fields).map(key => [key, row[key]])) : { ...row });
    const query = { from(t) { table = getTableName(t); return query; }, leftJoin() { return query; }, where(c) { condition = c; return query; }, orderBy() { return query; }, async for(value) { assert.equal(value, 'update'); trace.push(table); return rows(); }, then(resolve, reject) { return Promise.resolve(rows()).then(resolve, reject); } };
    return query;
  },
  insert(t) { calls++; assert.equal(trace[0], 'users', 'Owner must be locked before schedule writes'); const table = getTableName(t); return { async values(values) { const items = Array.isArray(values) ? values : [values]; const firstId = data[table].length + 1; data[table].push(...items.map((value, index) => ({ id: firstId + index, status: 'Agendado', version: 1, createdAt: '2026-09-28', updatedAt: '2026-09-28', ...value }))); return [{ insertId: firstId }]; } }; },
  update(t) { calls++; assert.equal(trace[0], 'users'); const table = getTableName(t); return { set(patch) { return { async where(c) { data[table] = data[table].map(row => matches(c, row, table) ? { ...row, ...patch } : row); } }; } }; },
};
const imports = { zod, '@/db': { getDb: () => db }, '@/db/schema': schema, '@/lib/appointments': domain, '@/lib/http': http, '@/lib/auth': { getCurrentUser: async () => user }, '@/lib/deployment': { appOrigin: () => 'https://vemo.test' } };
function compile(file) {
  const output = ts.transpileModule(readFileSync(new URL('../' + file, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  runInNewContext(output, { module, exports: module.exports, require: name => imports[name] ?? require(name), Request, Response, Headers, TextDecoder, Uint8Array, Error, Date, URL, Number, console });
  return module.exports;
}
imports['@/lib/api-security'] = compile('lib/api-security.ts');
imports['@/lib/service-data'] = compile('lib/service-data.ts');
imports['./appointments.ts'] = domain;
imports['./scheduling-policy'] = compile('lib/scheduling-policy.ts');
imports['@/lib/scheduling'] = compile('lib/scheduling.ts');
imports['@/lib/workspace'] = { lockWorkspaceAuthority: () => { throw new Error('Unexpected legacy workspace access'); } };
imports['@/lib/saas-policy'] = compile('lib/saas-policy.ts');
imports['@/lib/appointment-api'] = compile('lib/appointment-api.ts');
const list = compile('app/api/appointments/route.ts'), item = compile('app/api/appointments/[id]/route.ts');
const request = (method = 'GET', body, origin = 'https://vemo.test', range = '?from=2026-09-28&to=2026-09-28') => new Request('https://vemo.test/api/appointments' + range, { method, headers: { Origin: origin, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }) });
const context = id => ({ params: Promise.resolve({ id: String(id) }) });
const payload = (patch = {}) => ({ customerId: 1, serviceId: 1, title: 'Instalação', startsAt: '2026-09-28T10:00', durationMinutes: 60, notes: '', requestKey: crypto.randomUUID(), ...patch });

test('Agenda handlers reject anonymous and cross-origin requests before database access', async () => {
  reset(); user = null;
  assert.equal((await list.GET(request())).status, 401);
  assert.equal((await list.POST(request('POST', payload()))).status, 401);
  assert.equal((await item.PUT(request('PUT', {}), context(1))).status, 401);
  assert.equal((await item.PATCH(request('PATCH', {}), context(1))).status, 401);
  assert.equal((await list.POST(request('POST', payload(), 'https://evil.test'))).status, 403);
  assert.equal(calls, 0);
});
test('Creation locks the owner, isolates references and retries without duplication', async () => {
  reset();
  for (const patch of [{ customerId: 2 }, { serviceId: 2 }, { serviceId: 3 }]) assert.equal((await list.POST(request('POST', payload(patch)))).status, 400);
  const body = payload();
  const result = await list.POST(request('POST', body)); assert.equal(result.status, 201);
  const saved = (await result.json()).appointment;
  assert.equal(saved.customerName, 'Ana'); assert.equal(saved.endsAt, '2026-09-28T11:00');
  assert.equal('userId' in saved, false); assert.equal('requestKey' in saved, false);
  assert.equal((await list.POST(request('POST', body))).status, 201);
  assert.equal(data.appointments.length, 1);
  assert.equal((await list.POST(request('POST', { ...body, title: 'Changed' }))).status, 409);
  user = { id: 2 };
  assert.equal((await (await list.GET(request())).json()).appointments.length, 0);
  assert.equal((await item.PATCH(request('PATCH', { status: 'Cancelado', version: 1 }), context(1))).status, 404);
  assert.equal((await item.PUT(request('PUT', { customerId: 2, serviceId: null, title: 'Private', startsAt: body.startsAt, durationMinutes: 60, notes: '', version: 1 }), context(1))).status, 404);
});
test('Overlap is blocked, adjacent bookings accepted, cancelled slots released and reopening rechecked', async () => {
  reset(); await list.POST(request('POST', payload()));
  assert.equal((await list.POST(request('POST', payload({ startsAt: '2026-09-28T10:30' })))).status, 409);
  assert.equal((await list.POST(request('POST', payload({ startsAt: '2026-09-28T11:00' })))).status, 201);
  assert.equal((await item.PATCH(request('PATCH', { status: 'Cancelado', version: 1 }), context(1))).status, 200);
  assert.equal((await list.POST(request('POST', payload()))).status, 201);
  assert.equal((await item.PATCH(request('PATCH', { status: 'Agendado', version: 2 }), context(1))).status, 409);
  assert.equal(data.appointments[0].status, 'Cancelado');
});
test('Recurring series are created atomically, idempotently and reject any occurrence conflict', async () => {
  reset();
  const body = payload({ startsAt: '2026-09-28T13:00', recurrence: 'weekly', recurrenceCount: 4 });
  const created = await list.POST(request('POST', body)); assert.equal(created.status, 201);
  assert.equal((await created.json()).seriesCount, 4);
  assert.equal(data.appointments.length, 4);
  assert.equal((await list.POST(request('POST', body))).status, 201);
  assert.equal(data.appointments.length, 4);
  const collision = payload({ startsAt: '2026-10-19T13:30', recurrence: 'weekly', recurrenceCount: 3 });
  assert.equal((await list.POST(request('POST', collision))).status, 409);
  assert.equal(data.appointments.length, 4);
});
test('Edits use versions, conflict detection excludes self, completion never writes finance', async () => {
  reset(); const { requestKey, ...body } = payload(); await list.POST(request('POST', { ...body, requestKey }));
  assert.equal((await item.PUT(request('PUT', { ...body, title: 'Visita', version: 1 }), context(1))).status, 200);
  assert.equal((await item.PUT(request('PUT', { ...body, version: 1 }), context(1))).status, 409);
  assert.equal((await item.PATCH(request('PATCH', { status: 'Concluído', version: 2 }), context(1))).status, 200);
  assert.equal((await item.PUT(request('PUT', { ...body, version: 3 }), context(1))).status, 409);
  assert.equal(data.appointments[0].status, 'Concluído');
  assert.ok(trace.every(table => ['users', 'appointments', 'customers', 'services'].includes(table)));
});
test('Day queries include overnight appointments and reject invalid/oversized/untrusted data', async () => {
  reset(); await list.POST(request('POST', payload({ startsAt: '2026-09-27T23:30', durationMinutes: 90 })));
  assert.equal((await (await list.GET(request())).json()).appointments.length, 1);
  assert.equal((await list.GET(request('GET', undefined, 'https://vemo.test', '?from=2026-01-01&to=2026-12-31'))).status, 400);
  const before = data.appointments.length;
  assert.equal((await list.POST(request('POST', '{'))).status, 400);
  assert.equal((await list.POST(request('POST', payload({ userId: 2 })))).status, 400);
  assert.equal((await list.POST(request('POST', payload({ notes: 'x'.repeat(9000) })))).status, 413);
  assert.equal(data.appointments.length, before);
  failDb = true;
  const failed = await list.GET(request()); assert.equal(failed.status, 500); assert.doesNotMatch(await failed.text(), /PASSWORD|private/);
});
