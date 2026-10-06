import assert from "node:assert/strict";
import { test } from "node:test";
import { whatsappLink } from "../lib/whatsapp.ts";

test("Brazilian DDD numbers receive a country code", () => {
  assert.equal(new URL(whatsappLink("(41) 99999-1234")).pathname, "/5541999991234");
  assert.equal(new URL(whatsappLink("(11) 3333-1234")).pathname, "/551133331234");
});
test("International numbers are preserved", () => {
  assert.equal(new URL(whatsappLink("+55 41 99999-1234")).pathname, "/5541999991234");
  assert.equal(new URL(whatsappLink("+1 212 555 1234")).pathname, "/12125551234");
});
test("Missing or invalid numbers open recipient selection, without fake contacts", () => {
  for (const phone of ["", "abc", "123", "00000000000"]) {
    assert.equal(new URL(whatsappLink(phone)).pathname, "/");
  }
});
test("Messages survive URL encoding", () => {
  const message = "Olá! R$ 10,00 & aprovação: https://example.com/a?x=1";
  assert.equal(new URL(whatsappLink("", message)).searchParams.get("text"), message);
});
