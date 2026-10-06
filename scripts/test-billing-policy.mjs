import assert from "node:assert/strict";
import { test } from "node:test";
import { assertMonthlyPrice, confirmedPaidUntil, laterPaidUntil, MONTHLY_PRICE_CENTS } from "../lib/billing-policy.ts";

const price = { id: "price_vemo", active: true, currency: "brl", unit_amount: 4990, type: "recurring", recurring: { interval: "month", interval_count: 1, usage_type: "licensed" }, billing_scheme: "per_unit", tax_behavior: "inclusive" };
const invoice = () => ({ status: "paid", currency: "brl", amount_paid: 4990, amount_remaining: 0, billing_reason: "subscription_cycle", lines: { has_more: false, data: [{ amount: 4990, period: { start: 1791244800, end: 1793923200 }, pricing: { price_details: { price: "price_vemo" } }, parent: { subscription_item_details: { subscription: "sub_vemo", proration: false } } }] } });

test("Approved plan is strictly BRL 49.90 for one licensed monthly unit", () => {
  assert.equal(MONTHLY_PRICE_CENTS, 4990);
  assertMonthlyPrice(price, "price_vemo");
  for (const patch of [{ unit_amount: 4900 }, { currency: "usd" }, { active: false }, { id: "price_other" }, { type: "one_time" }, { tax_behavior: "exclusive" }, { recurring: { ...price.recurring, interval: "year" } }, { recurring: { ...price.recurring, interval_count: 2 } }, { recurring: { ...price.recurring, usage_type: "metered" } }]) assert.throws(() => assertMonthlyPrice({ ...price, ...patch }, "price_vemo"), /BILLING_PRICE_MISMATCH/);
});
test("Only a fully paid matching subscription invoice grants its finite period", () => {
  assert.equal(confirmedPaidUntil(invoice(), "sub_vemo", "price_vemo"), new Date(1793923200000).toISOString());
  for (const patch of [{ status: "open" }, { amount_paid: 0 }, { amount_paid: 4989 }, { currency: "usd" }, { amount_remaining: 1 }, { billing_reason: "manual" }, { billing_reason: "subscription_update" }]) assert.equal(confirmedPaidUntil({ ...invoice(), ...patch }, "sub_vemo", "price_vemo"), null);
  assert.equal(confirmedPaidUntil(invoice(), "sub_other", "price_vemo"), null);
  assert.equal(confirmedPaidUntil(invoice(), "sub_vemo", "price_other"), null);
});
test("Partial, paginated, prorated and unbounded invoice periods do not unlock access", () => {
  for (const mutate of [data => data.lines.has_more = true, data => data.lines.data.push(data.lines.data[0]), data => data.lines.data[0].parent.subscription_item_details.proration = true, data => data.lines.data[0].period.end = Infinity, data => data.lines.data[0].period.end += 86400 * 365, data => data.lines.data[0].period.end = data.lines.data[0].period.start]) {
    const data = invoice(); mutate(data); assert.equal(confirmedPaidUntil(data, "sub_vemo", "price_vemo"), null);
  }
});
test("Retries cannot shorten paid access or manufacture another free period", () => {
  assert.equal(laterPaidUntil("2026-12-01T00:00:00.000Z", "2026-11-01T00:00:00.000Z"), "2026-12-01T00:00:00.000Z");
  assert.equal(laterPaidUntil(null, null), null);
  assert.equal(laterPaidUntil("invalid", null), null);
});
