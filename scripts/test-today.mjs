import assert from "node:assert/strict";
import { test } from "node:test";
import { followUpMessage, greeting, localDateKey, summarizeMovement, summarizeQuotes } from "../lib/today-summary.ts";
import { isWorkspaceRouteActive, workspaceNavigation } from "../lib/workspace-navigation.ts";
import { nextDailyAppointment } from "../lib/daily-brief.ts";
import { summarizeObligationRows } from "../lib/obligations-summary.ts";

const now = new Date(2026, 8, 28, 10, 0);
const quote = (id, status, options = {}) => ({ id, status, totalCents: 10000, validUntil: "2026-10-10", sentAt: new Date(2026, 8, 22, 9).toISOString(), client: { name: "Lucas" }, ...options });

test("Dates and greetings follow the local calendar", () => {
  assert.equal(localDateKey(now), "2026-09-28");
  assert.equal(greeting(now), "Bom dia");
  assert.equal(greeting(new Date(2026, 8, 28, 12)), "Boa tarde");
  assert.equal(greeting(new Date(2026, 8, 28, 18)), "Boa noite");
});

test("Pending groups are disjoint and paid/rejected quotes never become receivables", () => {
  const result = summarizeQuotes([
    quote(1, "Enviado"), quote(2, "Rascunho"),
    quote(3, "Enviado", { validUntil: "2026-09-27" }),
    quote(4, "Aprovado"), quote(5, "Em andamento"), quote(6, "Finalizado"),
    quote(7, "Pago"), quote(8, "Recusado"),
    quote(9, "Enviado", { validUntil: "2026-09-28", sentAt: now.toISOString() }),
  ], now);
  assert.equal(result.receivable, 30000);
  assert.equal(result.pending, 3);
  assert.equal(result.awaiting, 2);
  assert.deepEqual(result.expired.map(q => q.id), [3]);
  assert.equal(result.followUps[0].days, 6);
});

test("Three calendar days includes the boundary; future and invalid dates do not make reminders", () => {
  const rows = [quote(1, "Enviado", { sentAt: new Date(2026, 8, 25, 23, 59).toISOString() }), quote(2, "Enviado", { sentAt: null }), quote(3, "Enviado", { sentAt: "bad date" }), quote(4, "Enviado", { sentAt: new Date(2026, 8, 29).toISOString() })];
  const result = summarizeQuotes(rows, now);
  assert.equal(result.awaiting, 4);
  assert.deepEqual(result.followUps.map(item => item.quote.id), [1]);
  assert.equal(result.followUps[0].days, 3);
});

test("Daily movement uses only actual manual transactions on the selected calendar date", () => {
  const result = summarizeMovement([
    { type: "income", transactionDate: "2026-09-28", amountCents: 45000 },
    { type: "expense", transactionDate: "2026-09-28", amountCents: 12000 },
    { type: "income", transactionDate: "2026-09-27", amountCents: 99000 },
    { type: "expense", transactionDate: "2026-09-29", amountCents: 99000 },
  ], now);
  assert.deepEqual(result, { income: 45000, expenses: 12000, balance: 33000 });
  assert.deepEqual(summarizeMovement([], now), { income: 0, expenses: 0, balance: 0 });
  assert.equal(summarizeMovement([{ type: "expense", transactionDate: "2026-09-28", amountCents: 10 }], now).balance, -10);
});

test("Message preparation does not modify quotes or include private financial details", () => {
  const item = quote(12, "Enviado");
  const before = structuredClone(item);
  const text = followUpMessage(item);
  assert.match(text, /Lucas/);
  assert.match(text, /#12/);
  assert.doesNotMatch(text, /10000/);
  assert.deepEqual(item, before);
});

test("Navigation covers canonical and legacy routes without matching unrelated prefixes", () => {
  assert.deepEqual(workspaceNavigation.map(item => item.label), ["Hoje", "Clientes", "Agenda", "Financeiro", "Orçamentos", "Serviços", "Configurações"]);
  for (const path of ["/dashboard", "/novo-orcamento", "/orcamentos/12", "/orcamentos"]) assert.equal(isWorkspaceRouteActive(path, "/orcamentos"), true);
  assert.equal(isWorkspaceRouteActive("/home", "/hoje"), true);
  assert.equal(isWorkspaceRouteActive("/clientes-antigos", "/clientes"), false);
  assert.equal(isWorkspaceRouteActive("/orcamentos/12", "/hoje"), false);
});

test('Explicit Brasilia day keeps Today aligned with Assistant across midnight', () => {
  const instant = new Date('2026-10-01T01:30:00Z');
  const zone = 'America/Sao_Paulo';
  assert.equal(greeting(instant, zone), 'Boa noite');
  const result = summarizeQuotes([quote(1, 'Enviado', { validUntil: '2026-09-30', sentAt: '2026-09-28T01:00:00Z' })], instant, zone);
  assert.equal(result.expired.length, 0); assert.equal(result.followUps[0].days, 3);
  assert.equal(summarizeMovement([{ type: 'income', amountCents: 12000, transactionDate: '2026-09-30' }, { type: 'income', amountCents: 99000, transactionDate: '2026-10-01' }], instant, zone).income, 12000);
});

test('Daily brief prioritizes active time windows without claiming service started and excludes closed/past/future days', () => {
  const instant = new Date('2026-10-01T01:30:00Z');
  const row = (id, start, end, status = 'Agendado') => ({ id, startsAt: start, endsAt: end, status });
  const rows = [row(1, '2026-09-30T23:00', '2026-10-01T00:30'), row(2, '2026-09-30T22:00', '2026-09-30T23:00'), row(3, '2026-09-30T21:00', '2026-09-30T22:30'), row(4, '2026-09-30T22:00', '2026-09-30T23:00', 'Cancelado'), row(5, '2026-09-30T22:00', '2026-09-30T23:00', 'Concluído'), row(6, '2026-10-01T09:00', '2026-10-01T10:00')];
  const before = structuredClone(rows), result = nextDailyAppointment(rows, instant);
  assert.equal(result.next.id, 2); assert.equal(result.remaining, 2); assert.equal(result.inProgressWindow, true); assert.deepEqual(rows, before);
  assert.equal(nextDailyAppointment([rows[0]], instant).inProgressWindow, false);
  assert.equal(nextDailyAppointment([], instant).next, null);
  const overnight = nextDailyAppointment([row(7, '2026-09-29T23:00', '2026-09-30T02:00')], new Date('2026-09-30T04:00:00Z'));
  assert.equal(overnight.next.id, 7); assert.equal(overnight.inProgressWindow, true);
});

test("Open obligations summary keeps overdue and upcoming receivables/payables separate", () => {
  assert.deepEqual(summarizeObligationRows([
    { bucket: "overdue", type: "receivable", count: 2, remainingCents: "12500" },
    { bucket: "overdue", type: "payable", count: "1", remainingCents: 4000 },
    { bucket: "upcoming", type: "receivable", count: "3", remainingCents: "9050" },
    { bucket: "upcoming", type: "payable", count: 1, remainingCents: "999" },
    { bucket: "unknown", type: "receivable", count: 90, remainingCents: 900000 },
    { bucket: "upcoming", type: "other", count: 90, remainingCents: 900000 },
  ]), {
    overdue: { receivable: { count: 2, remainingCents: 12500 }, payable: { count: 1, remainingCents: 4000 } },
    upcoming: { receivable: { count: 3, remainingCents: 9050 }, payable: { count: 1, remainingCents: 999 } },
  });
});

test("No open obligation rows produce explicit zero groups", () => {
  assert.deepEqual(summarizeObligationRows([]), {
    overdue: { receivable: { count: 0, remainingCents: 0 }, payable: { count: 0, remainingCents: 0 } },
    upcoming: { receivable: { count: 0, remainingCents: 0 }, payable: { count: 0, remainingCents: 0 } },
  });
});
