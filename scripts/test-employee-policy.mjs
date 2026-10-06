import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { employeeTransition, assignmentInput, employeeFields } from "../lib/employee-policy.ts";

test("Worker transitions cannot cancel, reopen or skip execution", () => {
  const valid = new Set(["Agendado|Em atendimento", "Confirmado|Em atendimento", "Em atendimento|Concluído"]);
  for (const current of ["Agendado", "Confirmado", "Em atendimento", "Concluído", "Cancelado"])
    for (const next of ["Agendado", "Confirmado", "Em atendimento", "Concluído", "Cancelado"])
      assert.equal(employeeTransition(current, next), valid.has(`${current}|${next}`));
});
test("Staff and assignment inputs reject privilege and financial field injection", () => {
  assert.equal(employeeFields.parse({ name: " Person ", email: " PERSON@example.com " }).email, "person@example.com");
  assert.throws(() => employeeFields.parse({ name: "Person", email: "person@example.com", workspaceId: 20 }));
  const body = { appointmentId: 1, employeeId: null, version: 1 };
  assert.equal(assignmentInput.parse(body).employeeId, null);
  assert.throws(() => assignmentInput.parse({ ...body, priceCents: 1 }));
  assert.throws(() => assignmentInput.parse({ ...body, instructions: "x".repeat(1001) }));
});
test("Employee migration is additive, preserves trials and keeps legacy accounts Company", () => {
  const sql = readFileSync(new URL("../database/015-individual-company-employees.sql", import.meta.url), "utf8");
  assert.match(sql, /DEFAULT 'company'/);
  assert.match(sql, /CREATE TABLE workspace_employees/);
  assert.match(sql, /CREATE TABLE employee_assignments/);
  assert.doesNotMatch(sql, /^\s*(DROP|TRUNCATE|DELETE|UPDATE)\b/im);
  assert.doesNotMatch(sql, /ALTER TABLE (appointments|workspace_subscriptions)/i);
});

test("Legacy client pages put data-loading content below the workspace access boundary", () => {
  for (const [file, component] of [["app/clientes/page.tsx", "CustomersContent"], ["app/financas/page.tsx", "FinancesContent"], ["app/orcamentos/page.tsx", "QuotesContent"], ["components/quote-detail.tsx", "QuoteDetailContent"]]) {
    const source = readFileSync(new URL("../" + file, import.meta.url), "utf8");
    assert.match(source, new RegExp(`return <WorkspaceShell><${component}[^>]*\\/>(?:<\\/WorkspaceShell>);`));
    assert.equal((source.match(/<WorkspaceShell>/g) || []).length, 1, file);
  }
});
