import assert from "node:assert/strict";
import { test } from "node:test";
import { canEditQuote, clientSnapshot, readClientSnapshot } from "../lib/quote-editing.ts";

test("Only unapproved drafts, sent and rejected quotes are editable", () => {
  for (const status of ["Rascunho", "Enviado", "Recusado"]) {
    assert.equal(canEditQuote({ status, approvedAt: null }), true);
    assert.equal(canEditQuote({ status, approvedAt: "2026-09-26" }), false);
  }
  for (const status of ["Aprovado", "Em andamento", "Finalizado", "Pago", "invalid"]) {
    assert.equal(canEditQuote({ status, approvedAt: null }), false);
  }
});
test("Client snapshots preserve document details and exclude private CRM notes", () => {
  const client = { name: "Maria", phone: "41999991234", email: "m@example.com", address: "Rua A", notes: "private" };
  const saved = clientSnapshot(client);
  client.name = "Novo nome";
  assert.equal(readClientSnapshot(saved).name, "Maria");
  assert.equal("notes" in readClientSnapshot(saved), false);
  assert.deepEqual(readClientSnapshot(null), {});
  assert.throws(() => readClientSnapshot('{"name":123}'));
});
