import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { test } from "node:test";
import ts from "typescript";
import * as zod from "zod";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import * as schema from "../db/schema.ts";
import * as catalog from "../lib/service-catalog.ts";
import * as http from "../lib/http.ts";

const require = createRequire(import.meta.url);
const dialect = new MySqlDialect();
let user = { id: 1 };
let records = [];
let calls = 0;
let locks = 0;
let failDb = false;
const columnKeys = { user_id: "userId", request_key: "requestKey", id: "id", archived: "archived" };

function matches(condition, row) {
  const query = dialect.sqlToQuery(condition);
  assert.match(query.sql, /`services`\.`user_id` = \?/);
  const terms = [...query.sql.matchAll(/`services`\.`(\w+)` = \?/g)];
  assert.equal(terms.length, query.params.length);
  return terms.every((term, i) => {
    const key = columnKeys[term[1]];
    assert.ok(key, term[1]);
    return key === "archived" ? Number(row[key]) === Number(query.params[i]) : row[key] === query.params[i];
  });
}

const db = {
  async transaction(callback) { return callback(db); },
  select(fields) {
    calls++;
    if (failDb) throw new Error("DB_PASSWORD=do-not-leak");
    let condition;
    const rows = () => records.filter(row => matches(condition, row)).map(row => Object.fromEntries(Object.keys(fields).map(key => [key, row[key]])));
    const query = { from() { return query; }, where(value) { condition = value; return query; }, async orderBy() { return rows(); }, async for(value) { assert.equal(value, "update"); locks++; return rows(); } };
    return query;
  },
  insert() {
    calls++;
    return { values(value) { return { async onDuplicateKeyUpdate() {
      if (!records.some(row => row.userId === value.userId && row.requestKey === value.requestKey)) records.push({ id: records.length + 1, archived: false, version: 1, createdAt: "2026-09-28", updatedAt: "2026-09-28", ...value });
    } }; } };
  },
  update() {
    calls++;
    return { set(patch) { return { async where(condition) { records = records.map(row => matches(condition, row) ? { ...row, ...patch } : row); } }; } };
  },
};

const imports = {
  zod,
  "@/db": { getDb: () => db }, "@/db/schema": schema, "@/lib/service-catalog": catalog,
  "@/lib/http": http, "@/lib/auth": { getCurrentUser: async () => user },
  "@/lib/deployment": { appOrigin: () => "https://vemo.test" },
};
function compile(file) {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  runInNewContext(output, { module, exports: module.exports, require: name => imports[name] ?? require(name), Request, Response, Headers, TextDecoder, Uint8Array, Error, Date, URL, Number, Boolean, console });
  return module.exports;
}
imports["@/lib/api-security"] = compile("lib/api-security.ts");
imports["@/lib/service-data"] = compile("lib/service-data.ts");
const list = compile("app/api/services/route.ts");
const item = compile("app/api/services/[id]/route.ts");
const payload = () => ({ name: "Instalação", description: "Material incluso", priceCents: 15000, durationMinutes: 60, requestKey: crypto.randomUUID() });
const request = (method = "GET", body, path = "/api/services", origin = "https://vemo.test") => new Request("https://vemo.test" + path, { method, headers: { "Content-Type": "application/json", Origin: origin }, ...(body === undefined ? {} : { body: typeof body === "string" ? body : JSON.stringify(body) }) });
const context = id => ({ params: Promise.resolve({ id: String(id) }) });

test("Anonymous and cross-origin requests are rejected before touching the catalog", async () => {
  user = null; calls = 0;
  assert.equal((await list.GET(request())).status, 401);
  assert.equal((await list.POST(request("POST", payload()))).status, 401);
  assert.equal((await item.PUT(request("PUT", {}), context(1))).status, 401);
  assert.equal((await item.PATCH(request("PATCH", {}), context(1))).status, 401);
  user = { id: 1 };
  assert.equal((await list.POST(request("POST", payload(), "/api/services", "https://evil.test"))).status, 403);
  assert.equal((await item.PATCH(request("PATCH", { archived: true, version: 1 }, "/api/services/1", "https://evil.test"), context(1))).status, 403);
  assert.equal(calls, 0);
});

test("Actual handlers create, retry once, isolate owners and exclude private metadata", async () => {
  records = []; calls = 0; user = { id: 1 };
  const body = payload();
  const response = await list.POST(request("POST", body));
  assert.equal(response.status, 201);
  assert.match(response.headers.get("cache-control"), /no-store/);
  const saved = (await response.json()).service;
  assert.equal("userId" in saved, false);
  assert.equal("requestKey" in saved, false);
  assert.equal((await list.POST(request("POST", body))).status, 201);
  assert.equal(records.length, 1);
  assert.equal((await list.POST(request("POST", { ...body, name: "Different" }))).status, 409);
  assert.equal(records.length, 1);
  user = { id: 2 };
  assert.equal((await list.GET(request())).status, 200);
  assert.equal((await (await list.GET(request())).json()).services.length, 0);
  assert.equal((await item.PUT(request("PUT", { name: "Other", description: "", priceCents: 100, durationMinutes: 1, version: 1 }), context(1))).status, 404);
  assert.equal((await item.PATCH(request("PATCH", { archived: true, version: 1 }), context(1))).status, 404);
  assert.equal(records[0].name, body.name);
  assert.equal((await list.POST(request("POST", body))).status, 201);
  assert.equal(records.length, 2);
});

test("Versioned updates reject stale edits; archive and restore remain scoped to the owner", async () => {
  user = { id: 1 }; locks = 0;
  const body = { name: "Novo nome", description: "", priceCents: 20000, durationMinutes: 90, version: 1 };
  assert.equal((await item.PUT(request("PUT", body), context(1))).status, 200);
  assert.equal(records[0].version, 2);
  assert.equal((await item.PUT(request("PUT", body), context(1))).status, 409);
  assert.equal((await item.PATCH(request("PATCH", { archived: true, version: 2 }), context(1))).status, 200);
  assert.equal((await (await list.GET(request())).json()).services.length, 0);
  assert.equal((await (await list.GET(request("GET", undefined, "/api/services?incluirArquivados=1"))).json()).services.length, 1);
  assert.equal((await item.PATCH(request("PATCH", { archived: false, version: 3 }), context(1))).status, 200);
  assert.equal(records[0].archived, false);
  assert.equal(records[1].version, 1);
  assert.ok(locks >= 4);
});

test("Malformed and oversized payloads and ownership injection cannot write data", async () => {
  user = { id: 1 }; const before = calls;
  assert.equal((await list.POST(request("POST", "{"))).status, 400);
  assert.equal((await list.POST(request("POST", { ...payload(), userId: 2 }))).status, 400);
  assert.equal((await list.POST(request("POST", { ...payload(), description: "x".repeat(9000) }))).status, 413);
  for (const id of ["../1", "1 OR 1=1", "0", "4294967296"]) assert.equal((await item.PATCH(request("PATCH", { archived: true, version: 1 }), context(id))).status, 404);
  const wrongType = new Request("https://vemo.test/api/services", { method: "POST", headers: { Origin: "https://vemo.test", "Content-Type": "text/plain" }, body: "{}" });
  assert.equal((await list.POST(wrongType)).status, 415);
  assert.equal(calls, before);
});

test("Database failures return a generic error, not secrets", async () => {
  failDb = true;
  try {
    const response = await list.GET(request());
    assert.equal(response.status, 500);
    assert.doesNotMatch(await response.text(), /PASSWORD|do-not-leak/);
  } finally { failDb = false; }
});
