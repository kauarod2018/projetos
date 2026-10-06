import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { test } from "node:test";
import ts from "typescript";
import * as zod from "zod";
import { getTableColumns, getTableName } from "drizzle-orm";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import * as schema from "../db/schema.ts";
import * as policy from "../lib/saas-policy.ts";
import * as models from "../lib/models.ts";
import * as categories from "../lib/transaction-categories.ts";
import * as pix from "../lib/pix.ts";
import * as profile from "../lib/business-profile.ts";
import * as editing from "../lib/quote-editing.ts";
import * as catalog from "../lib/service-catalog.ts";
import * as http from "../lib/http.ts";
import * as billingPolicy from "../lib/billing-policy.ts";
import * as employeePolicy from "../lib/employee-policy.ts";
import * as appointmentPolicy from "../lib/appointments.ts";
import * as schedulingPolicy from "../lib/scheduling-policy.ts";
import * as reportPolicy from "../lib/service-report-policy.ts";
import * as mediaPolicy from "../lib/assistant-media.ts";
import Stripe from "stripe";

const require = createRequire(import.meta.url);
const dialect = new MySqlDialect();
let stores, actor, selectedSession, serviceReads, failInsert;
const environment = { SAAS_ENABLED: "true", REGISTRATION_ENABLED: "true" };
let provider, providerCalls, mediaCalls;
let mediaFetch = async () => { throw new Error("Unexpected external request"); };
const monthlyPrice = { id: "price_vemo", active: true, currency: "brl", unit_amount: 4990, type: "recurring", recurring: { interval: "month", interval_count: 1, usage_type: "licensed" }, billing_scheme: "per_unit", tax_behavior: "inclusive" };
class FakeStripe extends Stripe {
  constructor() {
    super("sk_test_fake");
    this.prices = { retrieve: async () => provider.price };
    this.customers = { create: async () => { providerCalls.customers++; return { id: "cus_vemo" }; } };
    this.subscriptions = { retrieve: async id => { providerCalls.reads++; return structuredClone(provider.subscriptions[id]); } };
    this.checkout = { sessions: {
      retrieve: async id => structuredClone(provider.sessions[id]),
      create: async (params, options) => { providerCalls.checkouts++; providerCalls.params = params; providerCalls.key = options.idempotencyKey; const session = { id: `cs_${providerCalls.checkouts}`, url: "https://checkout.stripe.com/c/pay/test", status: "open", customer: params.customer, client_reference_id: params.client_reference_id, mode: "subscription" }; provider.sessions[session.id] = session; return structuredClone(session); },
    } };
    this.billingPortal = { configurations: { retrieve: async () => provider.portal }, sessions: { create: async params => { providerCalls.portals++; providerCalls.portalCustomer = params.customer; return { url: "https://billing.stripe.com/p/session/test" }; } } };
  }
}
const tables = Object.fromEntries(Object.values(schema).map(table => [getTableName(table), table]));
const nameOf = column => `${getTableName(column.table)}.${column.name}`;
const qualify = (table, row) => Object.fromEntries(Object.entries(getTableColumns(table)).map(([key, column]) => [nameOf(column), row[key] ?? null]));
const sessionKey = () => `session-${selectedSession}`;

function matches(condition, row) {
  if (!condition) return true;
  const query = dialect.sqlToQuery(condition);
  assert.doesNotMatch(query.sql, /\bor\b/i, "Harness intentionally supports only conjunctive predicates");
  let param = 0;
  const terms = [...query.sql.matchAll(/`(\w+)`\.`(\w+)`\s*(=|<>|>=|>|<=|<|is not null|is null)\s*(\?|`(\w+)`\.`(\w+)`)?/gi)];
  assert.ok(terms.length, query.sql);
  const results = terms.map(match => {
    const left = row[`${match[1]}.${match[2]}`];
    const op = match[3].toLowerCase();
    const right = match[4] === "?" ? query.params[param++] : row[`${match[5]}.${match[6]}`];
    if (op === "is null") return left === null;
    if (op === "is not null") return left !== null;
    if (op === "=") return typeof left === "boolean" ? Number(left) === Number(right) : left === right;
    if (op === "<>") return left !== right;
    if (op === ">=") return left !== null && left >= right;
    if (op === ">") return left !== null && left > right;
    if (op === "<") return left !== null && left < right;
    return left !== null && left <= right;
  });
  assert.equal(param, query.params.length, query.sql);
  return results.every(Boolean);
}

const db = {
  async transaction(callback) {
    const saved = structuredClone(stores);
    try { return await callback(db); } catch (error) { stores = saved; throw error; }
  },
  select(fields) {
    let table, condition, count = Infinity;
    const joins = [];
    const rows = () => {
      const name = getTableName(table);
      if (name === "services") serviceReads++;
      let qualified = stores[name].map(row => qualify(table, row));
      for (const join of joins) {
        qualified = qualified.flatMap(row => {
          const found = stores[getTableName(join.table)].map(other => ({ ...row, ...qualify(join.table, other) })).filter(other => matches(join.condition, other));
          return found.length ? found : join.left ? [{ ...row, ...qualify(join.table, {}) }] : [];
        });
      }
      const columns = fields ?? getTableColumns(table);
      const filtered = qualified.filter(row => matches(condition, row)).slice(0, count);
      if (fields?.amount && !fields.amount.table) return [{ amount: filtered.reduce((sum, row) => sum + Number(row["transactions.amount_cents"] ?? 0), 0) }];
      return filtered.map(row => Object.fromEntries(Object.entries(columns).map(([key, column]) => [key, column.table ? row[nameOf(column)] : Object.fromEntries(Object.entries(getTableColumns(column)).map(([childKey, childColumn]) => [childKey, row[nameOf(childColumn)]]))])));
    };
    const query = {
      from(value) { table = value; return query; },
      innerJoin(value, where) { joins.push({ table: value, condition: where }); return query; },
      leftJoin(value, where) { joins.push({ table: value, condition: where, left: true }); return query; },
      where(value) { condition = value; return query; },
      limit(value) { count = value; return query; }, orderBy() { return query; }, for() { return query; },
      then(resolve, reject) { return Promise.resolve().then(rows).then(resolve, reject); },
    };
    return query;
  },
  insert(table) {
    const name = getTableName(table);
    return { values(value) {
      const insert = () => {
        if (failInsert === name) throw new Error("DB_PASSWORD=hidden");
        const rows = stores[name];
        const row = { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), archived: false, version: 1, acceptedAt: null, revokedAt: null, paidUntil: null, checkoutGeneration: 0, cancelAtPeriodEnd: false, ...value };
        if ("id" in getTableColumns(table) && !row.id) row.id = Math.max(0, ...rows.map(item => item.id)) + 1;
        rows.push(row); return row;
      };
      return {
        async $returningId() { const row = insert(); return [{ id: row.id }]; },
        async onDuplicateKeyUpdate({ set }) {
          const old = name === "workspace_selections" ? stores[name].find(row => row.sessionId === value.sessionId)
            : name === "services" ? stores[name].find(row => row.userId === value.userId && row.requestKey === value.requestKey) : undefined;
          if (!old) insert(); else if (name === "workspace_selections") Object.assign(old, set);
        },
        then(resolve, reject) { return Promise.resolve().then(insert).then(resolve, reject); },
      };
    } };
  },
  update(table) { return { set(patch) { return { async where(condition) { for (const row of stores[getTableName(table)]) if (matches(condition, qualify(table, row))) Object.assign(row, patch); return [{ affectedRows: 1 }]; } }; } }; },
  delete(table) { return { async where(condition) { stores[getTableName(table)] = stores[getTableName(table)].filter(row => !matches(condition, qualify(table, row))); } }; },
};

const imports = {
  stripe: { default: FakeStripe }, "@/lib/billing-policy": billingPolicy,
  "@/lib/employee-policy": employeePolicy, "@/lib/appointments": appointmentPolicy,
  "./scheduling-policy": schedulingPolicy,
  zod, "@/db": { getDb: () => db }, "@/db/schema": schema, "@/lib/http": http,
  "@/lib/saas-policy": policy, "./models": models, "@/lib/models": models, "./transaction-categories": categories, "./pix": pix, "@/lib/service-catalog": catalog,
  "@/lib/business-profile": profile, "@/lib/quote-editing": editing,
  "@/lib/quote-data": { databaseError: () => "Unavailable", loadQuote: async () => null },
  "@/lib/auth": { getCurrentUser: async () => actor, readSessionToken: sessionKey, tokenHash: async token => token,
    consumeRateLimit: async () => true, requestIp: () => "test", createPublicToken: () => "a".repeat(32), hashPassword: async () => ({ hash: "hashed", salt: "salt" }) },
  "@/lib/deployment": { appOrigin: () => "https://vemo.test" }, "next/server": { after() {} },
  "@/lib/account-policy": { verificationRequired: () => true }, "@/lib/account-email": { issueAccountEmail() {} }, "@/lib/mail": { mailConfigured: () => true },
};
function compile(file) {
  const module = { exports: {} };
  const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  runInNewContext(output, { module, exports: module.exports, require: name => imports[name] ?? require(name), Request, Response, Headers, FormData, Blob, AbortController, setTimeout, clearTimeout, fetch: (...args) => mediaFetch(...args), TextDecoder, TextEncoder, Uint8Array, Buffer, Error, Date, URL, Number, Boolean, console: { ...console, error() {} }, crypto, process: { env: environment } });
  return module.exports;
}
imports["@/lib/validation"] = compile("lib/validation.ts");
imports["@/lib/workspace"] = compile("lib/workspace.ts");
imports["@/lib/api-security"] = compile("lib/api-security.ts");
imports["@/lib/employee-access"] = compile("lib/employee-access.ts");
imports["@/lib/service-data"] = compile("lib/service-data.ts");
imports["@/lib/scheduling"] = compile("lib/scheduling.ts");
imports["@/lib/billing"] = compile("lib/billing.ts");
imports["@/lib/legal-links"] = compile("lib/legal-links.ts");
imports["./auth"] = imports["@/lib/auth"];
imports["./saas-policy"] = policy;
imports["./workspace"] = imports["@/lib/workspace"];
imports["./employee-access"] = imports["@/lib/employee-access"];
imports["./service-report-policy"] = imports["@/lib/service-report-policy"] = reportPolicy;
imports["@/lib/service-report"] = compile("lib/service-report.ts");
imports["./validation"] = imports["@/lib/validation"];
imports["@/lib/quote-receipts"] = compile("lib/quote-receipts.ts");
imports["@/lib/obligations"] = compile("lib/obligations.ts");
imports["@/lib/assistant-quota"] = compile("lib/assistant-quota.ts");
imports["@/lib/assistant-media"] = mediaPolicy;
const billingRoute = compile("app/api/workspaces/billing/route.ts");
const webhookRoute = compile("app/api/billing/webhook/route.ts");
const workspace = compile("app/api/workspaces/route.ts");
const team = compile("app/api/workspaces/team/route.ts");
const accept = compile("app/api/workspaces/invites/accept/route.ts");
const services = compile("app/api/services/route.ts");
const register = compile("app/api/auth/register/route.ts");
const session = compile("app/api/auth/session/route.ts");
const businessProfile = compile("app/api/business-profile/route.ts");
const employees = compile("app/api/workspaces/employees/route.ts");
const assignments = compile("app/api/workspaces/assignments/route.ts");
const myWork = compile("app/api/my-work/route.ts");
const quote = compile("app/api/quotes/[id]/route.ts");
const reportRoute = compile("app/api/appointments/[id]/report/route.ts");
const shareRoute = compile("app/api/appointments/[id]/report/share/route.ts");
const publicReport = compile("app/api/public/service-report/route.ts");
const workflow = compile("app/api/quotes/[id]/workflow/route.ts");
const payment = compile("app/api/obligations/[id]/payments/route.ts");
const capture = compile("app/api/assistant/capture/route.ts");
const request = (method = "GET", body, path = "/api/workspaces", origin = "https://vemo.test") => new Request("https://vemo.test" + path, { method, headers: { "Content-Type": "application/json", Origin: origin }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
function reset(id = 9) {
  Object.keys(environment).forEach(key => delete environment[key]);
  Object.assign(environment, { SAAS_ENABLED: "true", REGISTRATION_ENABLED: "true" });
  stores = Object.fromEntries(Object.keys(tables).map(name => [name, []]));
  stores.users = [1, 2, 8, 9].map(id => ({ id, name: `User ${id}`, email: `user${id}@example.com`, phone: "", emailVerifiedAt: "2026-01-01" }));
  stores.workspaces = [{ id: 10, ownerUserId: 1, name: "Company A" }, { id: 20, ownerUserId: 2, name: "Company B" }, { id: 99, ownerUserId: 9, name: "Personal" }];
  stores.workspace_members = [{ workspaceId: 10, userId: 1, role: "owner" }, { workspaceId: 10, userId: 9, role: "editor" }, { workspaceId: 20, userId: 2, role: "owner" }, { workspaceId: 99, userId: 9, role: "owner" }];
  stores.workspace_subscriptions = [10, 20, 99].map(workspaceId => ({ workspaceId, status: "trialing", trialStartsAt: "2020-01-01T00:00:00.000Z", trialEndsAt: "2050-01-01T00:00:00.000Z", paidUntil: null }));
  stores.sessions = [1, 8, 9].map(userId => ({ id: `session-${userId}`, userId, expiresAt: "2050-01-01T00:00:00.000Z" }));
  stores.workspace_selections = [{ sessionId: "session-9", workspaceId: 10 }, { sessionId: "session-1", workspaceId: 10 }];
  stores.services = [1, 2, 9].map(userId => ({ id: userId, userId, name: `Service ${userId}`, description: "", archived: false, priceCents: 1000, durationMinutes: 60, version: 1 }));
  actor = stores.users.find(row => row.id === id); selectedSession = id; serviceReads = 0; failInsert = "";
}

function resetBilling() {
  reset(1);
  stores.workspace_subscriptions[0].trialEndsAt = "2001-01-01T00:00:00.000Z";
  Object.assign(environment, { BILLING_ENABLED: "true", STRIPE_MODE: "test", STRIPE_SECRET_KEY: "sk_test_fake", STRIPE_WEBHOOK_SECRET: "whsec_test_secret", STRIPE_PRICE_ID: "price_vemo", STRIPE_PORTAL_CONFIGURATION_ID: "bpc_test", APP_URL: "https://vemo.test" });
  providerCalls = { customers: 0, checkouts: 0, portals: 0, reads: 0 };
  provider = { price: structuredClone(monthlyPrice), sessions: {}, subscriptions: {}, portal: { active: true, features: { subscription_update: { enabled: false }, subscription_cancel: { enabled: true, mode: "at_period_end" }, payment_method_update: { enabled: true }, invoice_history: { enabled: true } } } };
}

async function purchase() {
  const response = await billingRoute.POST(request("POST", { action: "checkout" }));
  assert.equal(response.status, 200, await response.clone().text());
  const row = stores.workspace_billing[0];
  const periodStart = Math.floor(Date.now() / 1000), periodEnd = periodStart + 30 * 86400;
  const invoice = { id: "in_vemo", status: "paid", customer: "cus_vemo", currency: "brl", amount_paid: 4990, amount_remaining: 0, billing_reason: "subscription_create", parent: { subscription_details: { subscription: "sub_vemo" } }, lines: { has_more: false, data: [{ amount: 4990, period: { start: periodStart, end: periodEnd }, pricing: { price_details: { price: "price_vemo" } }, parent: { subscription_item_details: { proration: false, subscription: "sub_vemo" } } }] } };
  provider.sessions[row.checkoutId].status = "complete"; provider.sessions[row.checkoutId].subscription = "sub_vemo";
  provider.subscriptions.sub_vemo = { id: "sub_vemo", status: "active", metadata: { workspaceId: "10" }, customer: "cus_vemo", livemode: false, items: { has_more: false, data: [{ quantity: 1, price: monthlyPrice }] }, latest_invoice: invoice, cancel_at_period_end: false };
  return { id: "evt_paid", type: "invoice.paid", livemode: false, data: { object: invoice } };
}
const apply = event => imports["@/lib/billing"].applyBillingEvent(new FakeStripe(), event);

test("Billing configuration fails closed, requiring an explicit separate opt-in for live payments", () => {
  resetBilling(); assert.equal(imports["@/lib/billing"].billingConfiguration().configured, true);
  environment.STRIPE_MODE = "live"; environment.STRIPE_SECRET_KEY = "sk_live_fake";
  assert.equal(imports["@/lib/billing"].billingConfiguration().configured, false);
  environment.LIVE_PAYMENTS_ENABLED = "true"; assert.equal(imports["@/lib/billing"].billingConfiguration().configured, true);
  environment.APP_URL = "http://vemo.test"; assert.equal(imports["@/lib/billing"].billingConfiguration().configured, false);
  environment.APP_URL = "https://user:password@vemo.test"; assert.equal(imports["@/lib/billing"].billingConfiguration().configured, false);
});
test("Checkout requires verified owner, same origin, strict inputs, expired access and correct server price", async () => {
  resetBilling();
  selectedSession = 9; actor = stores.users.find(row => row.id === 9);
  assert.equal((await billingRoute.POST(request("POST", { action: "checkout" }))).status, 403);
  resetBilling(); actor.emailVerifiedAt = null;
  assert.equal((await billingRoute.POST(request("POST", { action: "checkout" }))).status, 403);
  resetBilling();
  assert.equal((await billingRoute.POST(request("POST", { action: "checkout" }, "/api/workspaces/billing", "https://evil.test"))).status, 403);
  assert.equal((await billingRoute.POST(request("POST", { action: "checkout", price: 1, workspaceId: 20 }))).status, 400);
  stores.workspace_subscriptions[0].trialEndsAt = "2050-01-01T00:00:00.000Z";
  assert.equal((await billingRoute.POST(request("POST", { action: "checkout" }))).status, 409);
  resetBilling(); provider.price.unit_amount = 1;
  assert.equal((await billingRoute.POST(request("POST", { action: "checkout" }))).status, 503);
  assert.equal(providerCalls.checkouts, 0); assert.equal(providerCalls.customers, 0);
});
test("Repeated checkout reuses an open session and never grants access before confirmation", async () => {
  resetBilling();
  const before = structuredClone(stores.workspace_subscriptions);
  for (let count = 0; count < 2; count++) assert.equal((await billingRoute.POST(request("POST", { action: "checkout" }))).status, 200);
  assert.equal(providerCalls.checkouts, 1); assert.equal(providerCalls.customers, 1);
  assert.equal(providerCalls.params.line_items[0].price, "price_vemo");
  assert.equal(providerCalls.params.subscription_data.trial_end, undefined);
  assert.equal(providerCalls.key, "vemo-checkout-10-1");
  assert.deepEqual(stores.workspace_subscriptions, before);
});
test("Signed paid events bind only the recorded checkout/customer and are idempotent", async () => {
  resetBilling(); const event = await purchase(); await apply(event); const before = structuredClone(stores);
  await apply(event); assert.deepEqual(stores, before);
  assert.equal(stores.billing_events.length, 1); assert.equal(stores.workspace_billing[0].subscriptionId, "sub_vemo");
  assert.equal(stores.workspace_subscriptions[0].status, "active");
  assert.equal(stores.workspace_subscriptions[0].paidUntil, new Date(event.data.object.lines.data[0].period.end * 1000).toISOString());
  assert.equal(stores.workspace_subscriptions[0].trialEndsAt, "2001-01-01T00:00:00.000Z");
});
test("Payment failures and out-of-order snapshots never manufacture paid access", async () => {
  resetBilling(); const event = await purchase();
  provider.subscriptions.sub_vemo.status = "past_due"; provider.subscriptions.sub_vemo.latest_invoice.status = "open";
  await apply(event);
  assert.equal(stores.workspace_subscriptions[0].paidUntil, null); assert.equal(stores.workspace_subscriptions[0].status, "expired");
  provider.subscriptions.sub_vemo.status = "active"; provider.subscriptions.sub_vemo.latest_invoice.status = "paid";
  await apply({ ...event, id: "evt_later" });
  const paidUntil = stores.workspace_subscriptions[0].paidUntil;
  provider.subscriptions.sub_vemo.status = "past_due"; provider.subscriptions.sub_vemo.latest_invoice.status = "open";
  await apply({ ...event, id: "evt_old", type: "customer.subscription.updated", data: { object: { id: "sub_vemo", status: "active" } } });
  assert.equal(stores.workspace_subscriptions[0].paidUntil, paidUntil);
});
test("Cancellation keeps the finite paid period; portal cannot expose another company's customer", async () => {
  resetBilling(); const event = await purchase(); await apply(event);
  provider.subscriptions.sub_vemo.status = "canceled"; provider.subscriptions.sub_vemo.cancel_at_period_end = true;
  await apply({ ...event, id: "evt_cancel", type: "customer.subscription.deleted", data: { object: { id: "sub_vemo" } } });
  assert.equal(policy.entitlement(stores.workspace_subscriptions[0]).allowed, true);
  assert.equal(stores.workspace_billing[0].cancelAtPeriodEnd, true);
  assert.equal((await billingRoute.POST(request("POST", { action: "portal" }))).status, 200);
  assert.equal(providerCalls.portalCustomer, "cus_vemo");
  selectedSession = 9; actor = stores.users.find(row => row.id === 9);
  assert.equal((await billingRoute.POST(request("POST", { action: "portal" }))).status, 403);
  assert.equal(providerCalls.portals, 1);
});
test("Foreign customers, metadata, checkout references and live-mode events roll back safely", async () => {
  for (const reason of ["customer", "company", "checkout", "mode", "event-table"]) {
    resetBilling(); const event = await purchase(); const before = structuredClone(stores);
    if (reason === "customer") provider.subscriptions.sub_vemo.customer = "cus_other";
    if (reason === "company") provider.subscriptions.sub_vemo.metadata.workspaceId = "20";
    if (reason === "checkout") provider.sessions.cs_1.client_reference_id = "20";
    if (reason === "mode") event.livemode = true;
    if (reason === "event-table") failInsert = "billing_events";
    await assert.rejects(() => apply(event)); assert.deepEqual(stores, before, reason);
  }
});
test("Webhook verifies raw signatures and body limits with the official SDK", async () => {
  resetBilling(); const event = await purchase(); const raw = JSON.stringify(event);
  const signature = Stripe.webhooks.generateTestHeaderString({ payload: raw, secret: environment.STRIPE_WEBHOOK_SECRET });
  const req = (body, sig = signature, extra = {}) => new Request("https://vemo.test/api/billing/webhook", { method: "POST", headers: { "stripe-signature": sig, ...extra }, body });
  assert.equal((await webhookRoute.POST(req(raw, "bad"))).status, 400);
  assert.equal((await webhookRoute.POST(req(raw + " "))).status, 400);
  assert.equal((await webhookRoute.POST(req(raw, signature, { "content-length": "300000" }))).status, 413);
  assert.equal((await webhookRoute.POST(req("x".repeat(262145)))).status, 413);
  assert.equal(stores.billing_events.length, 0);
  assert.equal((await webhookRoute.POST(req(raw))).status, 200);
  assert.equal(stores.billing_events.length, 1);
});

test("Actual session keeps actor identity while business queries use only the selected company owner", async () => {
  reset();
  const identity = await (await session.GET(request())).json();
  assert.equal(identity.user.id, 9); assert.equal(identity.workspace.id, 10);
  const listed = await (await services.GET(request("GET", undefined, "/api/services"))).json();
  assert.deepEqual(listed.services.map(row => row.name), ["Service 1"]);
  const created = await services.POST(request("POST", { name: "Shared service", description: "", priceCents: 2000, durationMinutes: 60, requestKey: crypto.randomUUID() }, "/api/services"));
  assert.equal(created.status, 201);
  assert.equal(stores.services.at(-1).userId, 1);
  assert.equal((await workspace.POST(request("POST", { workspaceId: 20 }))).status, 403);
  assert.equal(stores.workspace_selections[0].workspaceId, 10);
  assert.equal((await workspace.POST(request("POST", { workspaceId: 99 }))).status, 200);
  const personal = await (await services.GET(request("GET", undefined, "/api/services"))).json();
  assert.deepEqual(personal.services.map(row => row.name), ["Service 9"]);
});

test("Revocation fails closed instead of falling back to personal data; company picker remains usable", async () => {
  reset(); stores.workspace_members = stores.workspace_members.filter(row => !(row.workspaceId === 10 && row.userId === 9));
  assert.equal((await services.GET(request("GET", undefined, "/api/services"))).status, 403);
  assert.equal(serviceReads, 0);
  assert.equal((await workspace.GET(request())).status, 200);
  assert.equal((await workspace.POST(request("POST", { workspaceId: 99 }))).status, 200);
});

test("Expired subscriptions and viewers are blocked before any business read or write", async () => {
  reset(); stores.workspace_subscriptions[0].trialEndsAt = "2001-01-01T00:00:00.000Z";
  assert.equal((await services.GET(request("GET", undefined, "/api/services"))).status, 402);
  assert.equal((await services.POST(request("POST", {}, "/api/services"))).status, 402);
  assert.equal(serviceReads, 0); assert.equal(stores.services.length, 3);
  assert.equal((await quote.GET(request("GET", undefined, "/api/quotes/1"), { params: Promise.resolve({ id: "1" }) })).status, 402);
  reset(); stores.workspace_members.find(row => row.userId === 9 && row.workspaceId === 10).role = "viewer";
  assert.equal((await services.POST(request("POST", {}, "/api/services"))).status, 403);
  assert.equal((await team.GET(request())).status, 403);
  assert.equal((await services.GET(request("GET", undefined, "/api/services"))).status, 200);
});

test("Payment profile permission is explicit in its handler, independent of URL spelling", async () => {
  reset();
  const body = { pixKey: "", pixName: "", pixCity: "" };
  assert.equal((await businessProfile.PUT(request("PUT", body, "/api/business-profile"))).status, 403);
  assert.equal((await businessProfile.PUT(request("PUT", body, "/api/business%2Dprofile"))).status, 403);
  stores.workspace_members.find(row => row.userId === 9 && row.workspaceId === 10).role = "admin";
  assert.equal((await businessProfile.PUT(request("PUT", body, "/api/business-profile"))).status, 200);
  assert.ok(stores.users.find(row => row.id === 1).businessProfile);
  assert.equal(stores.users.find(row => row.id === 9).businessProfile, undefined);
});

test("Team endpoints enforce owner immutability, self protection, admin boundaries and origin", async () => {
  reset(); stores.workspace_members.find(row => row.userId === 9 && row.workspaceId === 10).role = "admin";
  assert.equal((await team.PATCH(request("PATCH", { userId: 1, role: "viewer" }))).status, 403);
  assert.equal((await team.PATCH(request("PATCH", { userId: 9, role: "editor" }))).status, 403);
  assert.equal((await team.POST(request("POST", { email: "user8@example.com", role: "admin" }))).status, 403);
  reset(1);
  assert.equal((await team.PATCH(request("PATCH", { userId: 9, role: "viewer" }))).status, 200);
  assert.equal((await team.DELETE(request("DELETE", { userId: 9 }, "/api/workspaces/team", "https://evil.test"))).status, 403);
  assert.equal((await team.DELETE(request("DELETE", { userId: 9 }))).status, 200);
});

test("Invites are hashed, email-bound, single-use, and never extend the company trial", async () => {
  reset(1);
  const response = await team.POST(request("POST", { email: "user8@example.com", role: "editor" }));
  assert.equal(response.status, 201);
  const url = new URL((await response.json()).invitationUrl);
  assert.equal(url.search, ""); const token = url.hash.slice(1);
  assert.equal(stores.workspace_invites[0].id.length, 64); assert.notEqual(stores.workspace_invites[0].id, token);
  const oldTrial = stores.workspace_subscriptions[0].trialEndsAt;
  selectedSession = 9; actor = stores.users.find(row => row.id === 9);
  assert.equal((await accept.POST(request("POST", { token }))).status, 403);
  selectedSession = 8; actor = stores.users.find(row => row.id === 8);
  assert.equal((await accept.POST(request("POST", { token }))).status, 200);
  assert.equal(stores.workspace_subscriptions[0].trialEndsAt, oldTrial);
  assert.equal(stores.workspace_selections.find(row => row.sessionId === "session-8").workspaceId, 10);
  assert.equal((await accept.POST(request("POST", { token }))).status, 410);
  stores.workspace_members = stores.workspace_members.filter(row => row.userId !== 8);
  assert.equal((await accept.POST(request("POST", { token }))).status, 410);
});

test("Expired, revoked, unverified and no-longer-authorized invitations cannot add a member", async () => {
  for (const reason of ["expiry", "revoked", "unverified", "inviter", "subscription"]) {
    reset(1); await team.POST(request("POST", { email: "user8@example.com", role: "editor" }));
    if (reason === "expiry") stores.workspace_invites[0].expiresAt = "2001-01-01";
    if (reason === "revoked") stores.workspace_invites[0].revokedAt = "2026-01-01";
    if (reason === "inviter") stores.workspace_members = stores.workspace_members.filter(row => row.userId !== 1);
    if (reason === "subscription") stores.workspace_subscriptions[0].trialEndsAt = "2001-01-01";
    selectedSession = 8; actor = stores.users.find(row => row.id === 8);
    if (reason === "unverified") actor.emailVerifiedAt = null;
    const response = await accept.POST(request("POST", { token: "a".repeat(32) }));
    assert.equal(response.status, reason === "unverified" ? 403 : reason === "subscription" ? 402 : 410, reason);
    assert.equal(stores.workspace_members.some(row => row.userId === 8), false, reason);
  }
});

test("Registration creates user, owner membership and one-month trial atomically, rolling back failures", async () => {
  reset();
  const payload = { name: "New Customer", email: "new@example.com", phone: "", password: "test-password-123456" };
  const result = await register.POST(request("POST", payload, "/api/auth/register"));
  assert.equal(result.status, 201);
  const user = stores.users.find(row => row.email === payload.email);
  const company = stores.workspaces.find(row => row.ownerUserId === user.id);
  assert.ok(stores.workspace_members.some(row => row.workspaceId === company.id && row.userId === user.id && row.role === "owner"));
  const trial = stores.workspace_subscriptions.find(row => row.workspaceId === company.id);
  assert.equal(trial.trialEndsAt, policy.oneMonthAfter(new Date(trial.trialStartsAt)));
  reset(); failInsert = "workspace_subscriptions";
  const before = structuredClone(stores);
  const failed = await register.POST(request("POST", payload, "/api/auth/register"));
  assert.equal(failed.status, 500);
  assert.doesNotMatch(await failed.text(), /DB_PASSWORD/);
  assert.deepEqual(stores, before);
});

function employeeFixture(worker = true) {
  reset(worker ? 9 : 1);
  stores.workspaces[0].kind = "company";
  stores.workspace_members.find(row => row.workspaceId === 10 && row.userId === 9).role = "employee";
  stores.workspace_employees = [
    { id: 31, workspaceId: 10, userId: 9, name: "Joana", email: "user9@example.com", phone: "", jobTitle: "Tecnica", archived: false, version: 1 },
    { id: 32, workspaceId: 10, userId: null, name: "Rui", email: "user8@example.com", phone: "", jobTitle: "Tecnico", archived: false, version: 1 },
    { id: 41, workspaceId: 20, userId: null, name: "Outro", email: "other@example.com", phone: "", jobTitle: "", archived: false, version: 1 },
  ];
  stores.appointments = [51, 52, 53].map(id => ({ id, employeeId: id === 51 ? 31 : id === 52 ? 32 : 41, userId: id === 53 ? 2 : 1, title: "Servico " + id, customerName: "Cliente " + id, customerId: 70, serviceId: 80, notes: "INTERNAL FINANCIAL SECRET", startsAt: "2026-10-05T09:00", endsAt: "2026-10-05T10:00", status: "Agendado", version: 1 }));
  stores.customers = [{ id: 70, userId: 1, name: "Cliente", phone: "11999999999", address: "Rua de teste", notes: "PRIVATE CUSTOMER NOTE" }];
  stores.employee_assignments = [
    { appointmentId: 51, workspaceId: 10, employeeId: 31, instructions: "Levar ferramentas", assignedBy: 1 },
    { appointmentId: 52, workspaceId: 10, employeeId: 32, instructions: "Outro trabalho", assignedBy: 1 },
    { appointmentId: 53, workspaceId: 20, employeeId: 41, instructions: "Outra empresa", assignedBy: 2 },
  ];
}
const workRequest = (method = "GET", body) => request(method, body, "/api/my-work?from=2026-10-05&to=2026-10-05");
const routeContext = id => ({ params: Promise.resolve({ id: String(id) }) });
const reportRequest = (method = "GET", body) => request(method, body, "/api/appointments/51/report");
const reportDraft = () => ({ version: 0, checklist: [{ id: crypto.randomUUID(), label: "Verificar filtro", done: true }], photos: [], summary: "Serviço realizado", acknowledgedBy: "Cliente", nextVisitOn: "2026-11-06" });

test("Media capture requires active access, consent and quota, sending only a review draft to the provider", async () => {
  employeeFixture(false); mediaCalls = [];
  mediaFetch = async (url, options) => { mediaCalls.push({ url, options }); return Response.json({ output: [{ type: "message", content: [{ type: "output_text", text: "Registra R$ 180 para Ana" }] }] }); };
  const input = { kind: "photo", mime: "image/jpeg", base64: Buffer.from([255, 216, 255, 224, 255, 217]).toString("base64"), consent: true };
  const req = body => request("POST", body, "/api/assistant/capture");
  assert.equal((await capture.POST(req(input))).status, 503);
  environment.ASSISTANT_MEDIA_ENABLED = "true"; environment.OPENAI_API_KEY = "server-only-test-key";
  assert.equal((await capture.POST(req({ ...input, consent: false }))).status, 400);
  assert.equal((await capture.POST(req({ ...input, userId: 2 }))).status, 400);
  assert.equal((await capture.POST(request("POST", input, "/api/assistant/capture", "https://evil.test"))).status, 403);
  const saved = structuredClone({ appointments: stores.appointments, transactions: stores.transactions, quotes: stores.quotes });
  const response = await capture.POST(req(input)); assert.equal(response.status, 200);
  assert.equal((await response.json()).reviewRequired, true); assert.equal(mediaCalls.length, 1);
  const body = JSON.parse(mediaCalls[0].options.body); assert.equal(body.store, false); assert.equal("tools" in body, false);
  assert.equal(stores.assistant_usage[0].requestCount, 3);
  assert.deepEqual({ appointments: stores.appointments, transactions: stores.transactions, quotes: stores.quotes }, saved);
  mediaFetch = async (url, options) => { mediaCalls.push({ url, options }); return Response.json({ text: "Pedido de áudio para revisão" }); };
  const audio = { kind: "audio", mime: "audio/wav", base64: Buffer.from("RIFFxxxxWAVEaaaa").toString("base64"), consent: true };
  assert.equal((await capture.POST(req(audio))).status, 200);
  assert.match(mediaCalls[1].url, /audio\/transcriptions$/);
  assert.equal(mediaCalls[1].options.body.get("language"), "pt"); assert.equal(mediaCalls[1].options.body.get("file").type, "audio/wav");
  assert.equal(stores.assistant_usage[0].requestCount, 6);
  stores.assistant_usage[0].requestCount = 38;
  assert.equal((await capture.POST(req(input))).status, 429); assert.equal(mediaCalls.length, 2);
  stores.workspace_subscriptions[0].trialEndsAt = "2000-01-01";
  assert.equal((await capture.POST(req(input))).status, 402); assert.equal(mediaCalls.length, 2);
});

test("Worker report authorization is bound to the current assignment and does not change money or job status", async () => {
  employeeFixture(); const draft = reportDraft(); const finance = structuredClone(stores.transactions);
  assert.equal((await reportRoute.GET(reportRequest(), routeContext(52))).status, 403);
  assert.equal((await reportRoute.PUT(reportRequest("PUT", draft), routeContext(52))).status, 403);
  const saved = await reportRoute.PUT(reportRequest("PUT", draft), routeContext(51)); assert.equal(saved.status, 200);
  assert.equal((await saved.json()).report.version, 1);
  assert.equal((await reportRoute.PUT(reportRequest("PUT", draft), routeContext(51))).status, 409);
  assert.equal(stores.appointments[0].status, "Agendado"); assert.deepEqual(stores.transactions, finance);
  assert.equal((await shareRoute.POST(reportRequest("POST", { version: 1 }), routeContext(51))).status, 403);
  stores.employee_assignments[0].employeeId = 32;
  assert.equal((await reportRoute.GET(reportRequest(), routeContext(51))).status, 403);
});
test("Report links are reviewed, hashed, finite, revocable and exclude private identity and contact data", async () => {
  employeeFixture(false); const draft = reportDraft();
  assert.equal((await reportRoute.PUT(reportRequest("PUT", draft), routeContext(51))).status, 200);
  assert.equal((await shareRoute.POST(reportRequest("POST", { version: 2 }), routeContext(51))).status, 409);
  const shared = await shareRoute.POST(reportRequest("POST", { version: 1 }), routeContext(51)); assert.equal(shared.status, 200);
  const { url } = await shared.json(); assert.match(url, /\/atendimento#[a-z]{32}$/);
  assert.notEqual(stores.service_reports[0].publicTokenHash, "a".repeat(32));
  const publicRequest = () => new Request("https://vemo.test/api/public/service-report", { headers: { "x-report-token": "a".repeat(32) } });
  const response = await publicReport.GET(publicRequest()); assert.equal(response.status, 200);
  const exposed = await response.text(); assert.doesNotMatch(exposed, /acknowledgedBy|userId|customerId|phone|address|INTERNAL|PRIVATE|publicToken|Cliente/);
  assert.match(response.headers.get("cache-control"), /no-store/);
  assert.equal((await reportRoute.PUT(reportRequest("PUT", { ...draft, version: 1 }), routeContext(51))).status, 200);
  assert.equal((await publicReport.GET(publicRequest())).status, 404);
  assert.equal((await shareRoute.POST(reportRequest("POST", { version: 2 }), routeContext(51))).status, 200);
  stores.service_reports[0].publicExpiresAt = "2000-01-01";
  assert.equal((await publicReport.GET(publicRequest())).status, 404);
  assert.equal((await shareRoute.DELETE(reportRequest("DELETE"), routeContext(51))).status, 200);
});
test("Reception can read reports and a minimal scheduler directory but cannot edit or share reports", async () => {
  employeeFixture(); stores.workspace_members.find(row => row.userId === 9 && row.workspaceId === 10).role = "reception";
  const directory = await employees.GET(request()); assert.equal(directory.status, 200);
  assert.deepEqual(Object.keys((await directory.json()).employees[0]).sort(), ["archived", "id", "name"]);
  const view = await reportRoute.GET(reportRequest(), routeContext(51)); assert.equal(view.status, 200); assert.equal((await view.json()).editable, false);
  assert.equal((await reportRoute.PUT(reportRequest("PUT", reportDraft()), routeContext(51))).status, 403);
  assert.equal((await workflow.GET(request("GET", undefined, "/api/quotes/1/workflow"), routeContext(1))).status, 403);
});
test("Linked charge uses server total, cannot duplicate, protects quote and payment settles both records exactly once", async () => {
  employeeFixture(false);
  stores.quotes = [{ id: 1, userId: 1, customerId: 70, status: "Aprovado", discountCents: 0, approvedAt: "2026-10-01", updatedAt: "2026-10-01T10:00:00.000Z" }];
  stores.quote_items = [{ id: 1, quoteId: 1, quantity: 1, unitPriceCents: 18000 }];
  const chargeBody = { dueDate: "2026-10-06", expectedUpdatedAt: stores.quotes[0].updatedAt };
  const chargeRequest = body => request("POST", body, "/api/quotes/1/workflow");
  assert.equal((await workflow.POST(chargeRequest({ ...chargeBody, amountCents: 1 }), routeContext(1))).status, 400);
  assert.equal((await workflow.POST(chargeRequest({ ...chargeBody, expectedUpdatedAt: "2020-01-01" }), routeContext(1))).status, 409);
  assert.equal((await workflow.POST(chargeRequest(chargeBody), routeContext(1))).status, 201);
  assert.equal(stores.financial_obligations[0].amountCents, 18000);
  assert.equal((await workflow.POST(chargeRequest(chargeBody), routeContext(1))).status, 409);
  assert.equal(stores.financial_obligations.length, 1);
  assert.equal((await quote.PATCH(request("PATCH", { status: "Rascunho" }, "/api/quotes/1"), routeContext(1))).status, 409);
  assert.equal((await quote.DELETE(request("DELETE", undefined, "/api/quotes/1"), routeContext(1))).status, 409);
  const payBody = { amountCents: 18000, transactionDate: "2026-10-05", requestKey: crypto.randomUUID() };
  const payRequest = body => request("POST", body, "/api/obligations/1/payments");
  assert.equal((await payment.POST(payRequest({ ...payBody, amountCents: 5000 }), routeContext(1))).status, 409);
  assert.equal((await payment.POST(payRequest(payBody), routeContext(1))).status, 201);
  assert.equal(stores.quotes[0].status, "Pago"); assert.equal(stores.financial_obligations[0].status, "paid");
  assert.equal(stores.transactions[0].quoteId, 1); assert.equal(stores.transactions[0].obligationId, 1);
  assert.equal((await payment.POST(payRequest(payBody), routeContext(1))).status, 200);
  assert.equal((await payment.POST(payRequest({ ...payBody, requestKey: crypto.randomUUID() }), routeContext(1))).status, 409);
  assert.equal(stores.transactions.length, 1);
});

test("Registration defaults Individual, requires company name and keeps a single trial when converting", async () => {
  reset();
  const body = { name: "New Person", email: "new@example.com", phone: "", password: "test-password-123456" };
  assert.equal((await register.POST(request("POST", { ...body, accountKind: "company" }))).status, 400);
  assert.equal((await register.POST(request("POST", body))).status, 201);
  const individual = stores.workspaces.at(-1); assert.equal(individual.kind, "individual");
  actor = stores.users.at(-1); selectedSession = actor.id;
  stores.sessions.push({ id: sessionKey(), userId: actor.id, expiresAt: "2050-01-01" });
  const before = structuredClone(stores.workspace_subscriptions);
  assert.equal((await workspace.PATCH(request("PATCH", { kind: "company" }))).status, 200);
  assert.equal(individual.kind, "company"); assert.deepEqual(stores.workspace_subscriptions, before);
  reset(); assert.equal((await register.POST(request("POST", { ...body, accountKind: "company", companyName: "New Company" }))).status, 201);
  assert.equal(stores.workspaces.at(-1).name, "New Company"); assert.equal(stores.workspaces.at(-1).kind, "company");
});

test("Individual mode forbids team creation; Company cannot downgrade while members, staff or invites remain", async () => {
  employeeFixture(false);
  assert.equal((await workspace.PATCH(request("PATCH", { kind: "individual" }))).status, 409);
  stores.workspace_members = stores.workspace_members.filter(row => row.workspaceId !== 10 || row.userId === 1);
  assert.equal((await workspace.PATCH(request("PATCH", { kind: "individual" }))).status, 409);
  stores.workspace_employees.forEach(row => { if (row.workspaceId === 10) row.archived = true; });
  assert.equal((await workspace.PATCH(request("PATCH", { kind: "individual" }))).status, 409, "Pending assigned work must be resolved before downgrade");
  stores.appointments.forEach(row => { if (row.userId === 1) row.status = "Cancelado"; });
  assert.equal((await workspace.PATCH(request("PATCH", { kind: "individual" }))).status, 200);
  assert.equal((await employees.POST(request("POST", { name: "Staff", email: "staff@example.com" }))).status, 403);
  assert.equal((await team.POST(request("POST", { email: "staff@example.com", role: "employee" }))).status, 403);
});

test("Employee role cannot read general business endpoints, team directory or billing metadata", async () => {
  employeeFixture();
  for (const route of [services, businessProfile, team, employees, billingRoute]) assert.equal((await route.GET(request())).status, 403);
  assert.equal((await quote.GET(request(), { params: Promise.resolve({ id: "1" }) })).status, 403);
  assert.equal(serviceReads, 0);
  const access = { allowed: true, state: "trial", endsAt: null, daysLeft: 1 };
  for (const path of ["/api/customers", "/api/transactions", "/api/quotes", "/api/appointments", "/api/activity", "/api/assistant"])
    for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE"]) assert.throws(() => policy.assertBusinessAccess("employee", access, method, path), /SAAS_FORBIDDEN/);
});

test("Employee work contains only own scoped minimal projection, not private notes or identifiers", async () => {
  employeeFixture();
  const response = await myWork.GET(workRequest()); assert.equal(response.status, 200);
  const rows = (await response.json()).appointments; assert.deepEqual(rows.map(row => row.id), [51]);
  assert.deepEqual(Object.keys(rows[0]).sort(), ["id", "title", "customerName", "customerPhone", "customerAddress", "startsAt", "endsAt", "status", "version", "instructions"].sort());
  assert.equal(rows[0].customerPhone, "11999999999"); assert.equal(rows[0].customerAddress, "Rua de teste");
  assert.equal(rows[0].instructions, "Levar ferramentas"); assert.doesNotMatch(JSON.stringify(rows), /INTERNAL|customerId|serviceId/);
  assert.equal((await myWork.GET(request("GET", undefined, "/api/my-work?from=2026-10-05&to=2026-10-05&employeeId=32"))).status, 400);
  assert.equal((await myWork.GET(request("GET", undefined, "/api/my-work?from=2026-10-05&from=2026-10-06&to=2026-10-05"))).status, 400);
});

test("Employee work is blocked for revoked, archived or expired access", async () => {
  for (const reason of ["revoked", "archived", "expired"]) {
    employeeFixture();
    if (reason === "revoked") stores.workspace_members = stores.workspace_members.filter(row => !(row.workspaceId === 10 && row.userId === 9));
    if (reason === "archived") stores.workspace_employees[0].archived = true;
    if (reason === "expired") stores.workspace_subscriptions[0].trialEndsAt = "2001-01-01";
    assert.equal((await myWork.GET(workRequest())).status, reason === "expired" ? 402 : 403, reason);
    assert.equal((await myWork.PATCH(workRequest("PATCH", { appointmentId: 51, version: 1, status: "Em atendimento" }))).status, reason === "expired" ? 402 : 403, reason);
  }
});

test("Employee status updates enforce assignment, optimistic version and forward-only progress without finance writes", async () => {
  employeeFixture(); const financial = structuredClone(stores.transactions);
  assert.equal((await myWork.PATCH(workRequest("PATCH", { appointmentId: 52, version: 1, status: "Em atendimento" }))).status, 403);
  assert.equal((await myWork.PATCH(workRequest("PATCH", { appointmentId: 51, version: 1, status: "Concluído" }))).status, 409);
  assert.equal((await myWork.PATCH(workRequest("PATCH", { appointmentId: 51, version: 1, status: "Em atendimento", notes: "injection" }))).status, 400);
  assert.equal((await myWork.PATCH(workRequest("PATCH", { appointmentId: 51, version: 1, status: "Em atendimento" }))).status, 200);
  assert.equal((await myWork.PATCH(workRequest("PATCH", { appointmentId: 51, version: 1, status: "Concluído" }))).status, 409);
  assert.equal((await myWork.PATCH(workRequest("PATCH", { appointmentId: 51, version: 2, status: "Concluído" }))).status, 200);
  assert.equal(stores.appointments[0].status, "Concluído"); assert.deepEqual(stores.transactions, financial);
  assert.equal(JSON.parse(stores.business_activity[0].details).actorId, 9);
});

test("Managers distribute only their company's work and staff, preserving version checks and atomic audit", async () => {
  employeeFixture(false);
  const body = { appointmentId: 51, version: 1, employeeId: 32, instructions: "Nova instrução" };
  assert.equal((await assignments.POST(request("POST", body))).status, 409, "Reassignment must detect the other worker's occupied slot");
  stores.appointments[1].startsAt = "2026-10-05T10:00"; stores.appointments[1].endsAt = "2026-10-05T11:00";
  assert.equal((await assignments.POST(request("POST", { ...body, employeeId: 41 }))).status, 403);
  assert.equal((await assignments.POST(request("POST", { ...body, appointmentId: 53 }))).status, 403);
  failInsert = "business_activity"; const before = structuredClone(stores);
  assert.equal((await assignments.POST(request("POST", body))).status, 500); assert.deepEqual(stores, before);
  failInsert = ""; assert.equal((await assignments.POST(request("POST", body))).status, 200);
  assert.equal(stores.employee_assignments.find(row => row.appointmentId === 51).employeeId, 32);
  assert.equal((await assignments.POST(request("POST", body))).status, 409);
  assert.equal((await assignments.POST(request("POST", { ...body, version: 2, employeeId: null }))).status, 200);
  assert.equal(stores.employee_assignments.some(row => row.appointmentId === 51), false);
  stores.appointments[0].status = "Cancelado";
  assert.equal((await assignments.POST(request("POST", { ...body, version: 3 }))).status, 409);
});

test("Employee directory is company-scoped, strict, duplicate-safe and cannot silently link a general role", async () => {
  employeeFixture(false);
  assert.deepEqual((await (await employees.GET(request())).json()).employees.map(row => row.id), [31, 32]);
  assert.equal((await employees.POST(request("POST", { name: "New", email: "user8@example.com" }))).status, 409);
  assert.equal((await employees.POST(request("POST", { name: "New", email: "user1@example.com" }))).status, 409);
  assert.equal((await employees.POST(request("POST", { name: "New", email: "new@example.com", role: "owner" }))).status, 400);
  const created = await employees.POST(request("POST", { name: "New", email: " NEW@example.com " })); assert.equal(created.status, 201);
  assert.equal((await created.json()).employee.email, "new@example.com");
  const row = stores.workspace_employees[0];
  assert.equal((await employees.PATCH(request("PATCH", { ...row, email: "other@example.com", workspaceId: undefined, userId: undefined }))).status, 409);
});

test("Employee invitation requires a directory record, binds verified email and lands in own work", async () => {
  employeeFixture(false);
  assert.equal((await team.POST(request("POST", { email: "unknown@example.com", role: "employee" }))).status, 409);
  const response = await team.POST(request("POST", { email: "user8@example.com", role: "employee" })); assert.equal(response.status, 201);
  const token = new URL((await response.json()).invitationUrl).hash.slice(1), trial = stores.workspace_subscriptions[0].trialEndsAt;
  actor = stores.users.find(row => row.id === 8); selectedSession = 8; actor.emailVerifiedAt = null;
  assert.equal((await accept.POST(request("POST", { token }))).status, 403);
  actor.emailVerifiedAt = "2026-01-01";
  const result = await accept.POST(request("POST", { token })); assert.equal(result.status, 200);
  assert.equal((await result.json()).next, "/meu-trabalho");
  assert.equal(stores.workspace_employees[1].userId, 8); assert.equal(stores.workspace_subscriptions[0].trialEndsAt, trial);
  assert.equal((await accept.POST(request("POST", { token }))).status, 410);
});

test("Archiving revokes login and pending invites; restoring requires invitation and retains assignments", async () => {
  employeeFixture(false);
  await team.POST(request("POST", { email: "user8@example.com", role: "employee" }));
  const body = employee => ({ id: employee.id, version: employee.version, name: employee.name, email: employee.email, phone: employee.phone, jobTitle: employee.jobTitle, archived: true });
  assert.equal((await employees.PATCH(request("PATCH", body(stores.workspace_employees[0])))).status, 200);
  assert.equal(stores.workspace_members.some(row => row.workspaceId === 10 && row.userId === 9), false);
  assert.equal(stores.workspace_employees[0].userId, null); assert.equal(stores.employee_assignments.length, 3);
  assert.equal((await employees.PATCH(request("PATCH", body(stores.workspace_employees[1])))).status, 200);
  assert.ok(stores.workspace_invites[0].revokedAt);
  assert.equal((await employees.PATCH(request("PATCH", { ...body(stores.workspace_employees[0]), archived: false }))).status, 200);
  assert.equal(stores.workspace_employees[0].userId, null);
});
