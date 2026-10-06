import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { oneMonthAfter, entitlement, assertBusinessAccess, canManageRole } from "../lib/saas-policy.ts";

test("Free trial is one UTC calendar month, preserving time and clamping month boundaries", () => {
  const examples = [
    ["2026-10-05T15:16:17.123Z", "2026-11-05T15:16:17.123Z"],
    ["2026-01-31T23:59:59.999Z", "2026-02-28T23:59:59.999Z"],
    ["2028-01-31T10:00:00.000Z", "2028-02-29T10:00:00.000Z"],
    ["2026-12-31T00:00:00.000Z", "2027-01-31T00:00:00.000Z"],
    ["2026-03-31T12:00:00.000Z", "2026-04-30T12:00:00.000Z"],
  ];
  for (const [start, end] of examples) {
    const date = new Date(start);
    assert.equal(oneMonthAfter(date), end);
    assert.equal(date.toISOString(), start);
  }
  assert.throws(() => oneMonthAfter(new Date("invalid")));
});

test("Access expires at the exact trial deadline; missing, invalid and unpaid states fail closed", () => {
  const trial = { status: "trialing", trialStartsAt: "2026-10-05T00:00:00.000Z", trialEndsAt: "2026-11-05T00:00:00.000Z", paidUntil: null };
  const end = Date.parse(trial.trialEndsAt);
  assert.equal(entitlement(trial, end - 1).allowed, true);
  assert.equal(entitlement(trial, end).allowed, false);
  assert.equal(entitlement(trial, Date.parse(trial.trialStartsAt) - 1).allowed, false);
  for (const value of [undefined, { ...trial, trialEndsAt: "invalid" }, { ...trial, trialStartsAt: null }, { ...trial, status: "past_due" }, { ...trial, status: "incomplete" }]) {
    assert.equal(entitlement(value, end - 1).allowed, false);
  }
  assert.equal(entitlement({ ...trial, status: "legacy" }, end + 1).allowed, true);
});

test("A paid status alone cannot unlock access; cancellation honors only a finite paid period", () => {
  const now = Date.parse("2026-10-05T00:00:00.000Z");
  const subscription = { status: "active", trialStartsAt: null, trialEndsAt: null, paidUntil: "2026-11-05T00:00:00.000Z" };
  assert.equal(entitlement(subscription, now).allowed, true);
  assert.equal(entitlement({ ...subscription, paidUntil: null }, now).allowed, false);
  assert.equal(entitlement({ ...subscription, status: "canceled" }, now).allowed, true);
  assert.equal(entitlement(subscription, Date.parse(subscription.paidUntil)).allowed, false);
});

test("Every business method is subscription-gated and read-only roles cannot mutate", () => {
  const allowed = { allowed: true, state: "trial", endsAt: null, daysLeft: 10 };
  for (const method of ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"]) {
    assert.throws(() => assertBusinessAccess("owner", { ...allowed, allowed: false }, method, "/api/customers"), /SAAS_SUBSCRIPTION_REQUIRED/);
  }
  for (const role of ["owner", "admin", "editor", "viewer"]) assert.doesNotThrow(() => assertBusinessAccess(role, allowed, "GET", "/api/customers"));
  for (const method of ["POST", "PUT", "PATCH", "DELETE"]) assert.throws(() => assertBusinessAccess("viewer", allowed, method, "/api/customers"), /SAAS_READ_ONLY/);
  assert.throws(() => assertBusinessAccess("editor", allowed, "PUT", "/api/business-profile"), /SAAS_FORBIDDEN/);
  assert.doesNotThrow(() => assertBusinessAccess("editor", allowed, "POST", "/api/customers"));
});

test("Team management cannot alter owner, escalate admin privileges or make viewer a manager", () => {
  for (const actor of ["owner", "admin", "editor", "viewer"]) {
    assert.equal(canManageRole(actor, "owner", "viewer"), false);
    assert.equal(canManageRole(actor, "viewer", "owner"), false);
  }
  assert.equal(canManageRole("admin", "admin", "viewer"), false);
  assert.equal(canManageRole("admin", "viewer", "admin"), false);
  assert.equal(canManageRole("admin", "editor", "viewer"), true);
  assert.equal(canManageRole("owner", "viewer", "admin"), true);
  assert.equal(canManageRole("editor", "viewer", "editor"), false);
});

test("Migration is additive, backfills existing access without a trial and never moves records", () => {
  const sql = readFileSync(new URL("../database/013-saas-workspaces.sql", import.meta.url), "utf8");
  assert.doesNotMatch(sql, /\b(DROP|TRUNCATE|DELETE|UPDATE)\s+(TABLE|FROM|users|customers|quotes|transactions)/i);
  assert.match(sql, /SELECT id, 'legacy', created_at FROM workspaces/);
  assert.match(sql, /UNIQUE KEY uq_workspace_member \(workspace_id, user_id\)/);
});
