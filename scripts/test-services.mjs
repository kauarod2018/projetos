import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { serviceFieldsSchema, serviceCreateSchema, serviceUpdateSchema, serviceArchiveSchema, parseServicePrice, servicePriceInput, serviceQuoteItem, formatDuration } from "../lib/service-catalog.ts";

const valid = { name: "Instalação", description: "Material incluso", priceCents: 15000, durationMinutes: 60 };

test("Service prices accept Brazilian formatting and reject ambiguous or invalid inputs", () => {
  for (const [input, expected] of [["150", 15000], ["150,5", 15050], ["150.50", 15050], ["1.234,56", 123456], ["1.234", 123400], ["R$ 0,00", 0]]) assert.equal(parseServicePrice(input), expected, input);
  for (const input of ["", " ", "-1", "1e3", "Infinity", "1,234", "12.34,50", "1,2,3", "9".repeat(25)]) assert.equal(parseServicePrice(input), null, input);
  assert.equal(servicePriceInput(123456), "1234,56");
  assert.equal(formatDuration(90), "1h 30min");
  assert.equal(formatDuration(60), "1h");
  assert.equal(formatDuration(25), "25min");
});

test("Service schemas constrain fields and reject client-supplied ownership", () => {
  assert.equal(serviceFieldsSchema.parse({ ...valid, name: " Teste " }).name, "Teste");
  for (const patch of [{ name: " " }, { description: "a".repeat(301) }, { priceCents: -1 }, { priceCents: 1.5 }, { priceCents: 1_000_000_001 }, { durationMinutes: 0 }, { durationMinutes: 1.5 }, { durationMinutes: 10081 }, { userId: 2 }, { archived: true }]) assert.equal(serviceFieldsSchema.safeParse({ ...valid, ...patch }).success, false);
  assert.equal(serviceCreateSchema.safeParse({ ...valid, requestKey: crypto.randomUUID() }).success, true);
  assert.equal(serviceCreateSchema.safeParse({ ...valid, requestKey: "bad" }).success, false);
  assert.equal(serviceUpdateSchema.safeParse({ ...valid, version: 0 }).success, false);
  assert.equal(serviceArchiveSchema.safeParse({ archived: "false", version: 1 }).success, false);
  assert.equal(serviceArchiveSchema.safeParse({ archived: true, version: 1, userId: 2 }).success, false);
});

test("Quote items are independent snapshots and fit the existing database field", () => {
  const service = { ...valid, name: "a".repeat(120), description: "b".repeat(300) };
  const item = serviceQuoteItem(service);
  assert.ok(item.description.length <= 500);
  assert.equal(item.quantity, 1);
  service.priceCents = 99999;
  service.name = "Changed";
  assert.equal(item.unitPriceCents, 15000);
  assert.ok(!item.description.includes("Changed"));
  assert.deepEqual(Object.keys(item).sort(), ["description", "kind", "quantity", "unitPriceCents"]);
});

test("The incremental migration is additive, repeatable and tenant-indexed", () => {
  const sql = readFileSync(new URL("../database/005-service-catalog.sql", import.meta.url), "utf8");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS services/);
  assert.match(sql, /UNIQUE KEY uq_services_owner_request \(user_id, request_key\)/);
  assert.match(sql, /FOREIGN KEY \(user_id\) REFERENCES users\(id\)/);
  assert.doesNotMatch(sql, /\b(DROP|TRUNCATE|DELETE|ALTER)\s+(TABLE|FROM)\b/i);
});
