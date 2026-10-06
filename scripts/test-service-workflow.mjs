import assert from "node:assert/strict";
import { test } from "node:test";
import { availabilitySchema, absenceSchema, withinAvailability, resourceCollision } from "../lib/scheduling-policy.ts";
import { reportInput, emptyReport, publicReportProjection, canEditReport, canShareReport } from "../lib/service-report-policy.ts";
import { operationsQueue } from "../lib/operations-queue.ts";
import { mediaInput, decodeMedia, captureText } from "../lib/assistant-media.ts";
import { assertBusinessAccess } from "../lib/saas-policy.ts";

test("Independent resources allow concurrent jobs but not worker collisions", () => {
  const a = { employeeId: 1, startsAt: "2026-10-06T09:00", endsAt: "2026-10-06T10:00" };
  assert.equal(resourceCollision(a, { ...a, employeeId: 2 }), false);
  assert.equal(resourceCollision(a, { ...a }), true);
  assert.equal(resourceCollision(a, { ...a, startsAt: a.endsAt, endsAt: "2026-10-06T11:00" }), false);
  assert.equal(resourceCollision(a, { ...a, status: "Cancelado" }), false);
  assert.equal(resourceCollision({ ...a, employeeId: null }, { ...a, employeeId: null }), true);
});
test("Hours and absences validate civil dates, weekday bounds and fail closed", () => {
  const hours = JSON.stringify({ days: [1, 2, 3, 4, 5], start: "08:00", end: "18:00" });
  assert.equal(withinAvailability(hours, "2026-10-06T08:00", "2026-10-06T18:00"), true);
  for (const [start, end] of [["2026-10-06T07:59", "2026-10-06T09:00"], ["2026-10-10T09:00", "2026-10-10T10:00"], ["2026-10-06T17:00", "2026-10-07T08:00"]]) assert.equal(withinAvailability(hours, start, end), false);
  assert.equal(withinAvailability("{}", "2026-10-06T09:00", "2026-10-06T10:00"), false);
  assert.throws(() => availabilitySchema.parse({ days: [], start: "08:00", end: "18:00" }));
  assert.throws(() => absenceSchema.parse({ employeeId: 1, startsAt: "2026-02-30T08:00", endsAt: "2026-03-01T09:00" }));
});
test("Reception may schedule and edit clients but cannot guess a financial, quote or history URL", () => {
  const access = { allowed: true };
  for (const path of ["/api/customers", "/api/customers/1", "/api/appointments", "/api/appointments/1"]) for (const method of ["GET", "POST", "PUT", "PATCH"]) assert.doesNotThrow(() => assertBusinessAccess("reception", access, method, path));
  for (const path of ["/api/transactions", "/api/quotes", "/api/customers/1/history", "/api/assistant/capture", "/api/operations/queue", "/api/business-profile"]) assert.throws(() => assertBusinessAccess("reception", access, "GET", path), /SAAS_FORBIDDEN/);
  assert.throws(() => assertBusinessAccess("reception", access, "POST", "/api/services"));
});
test("Reports are bounded, strictly typed and public projection excludes internal identifiers and confirmation names", () => {
  assert.throws(() => reportInput.parse({ ...emptyReport, userId: 2 }));
  const draft = { version: 0, checklist: [], photos: [], summary: "Feito", acknowledgedBy: "Pessoa", nextVisitOn: "2026-11-06" };
  assert.equal(reportInput.parse(draft).summary, "Feito");
  assert.throws(() => reportInput.parse({ ...draft, nextVisitOn: "2026-02-30" }));
  assert.throws(() => reportInput.parse({ ...draft, photos: Array(5).fill({}) }));
  const projection = publicReportProjection({ ...emptyReport, ...draft });
  assert.equal("acknowledgedBy" in projection, false); assert.equal("version" in projection, false);
  for (const role of ["viewer", "reception", "unknown"]) assert.equal(canEditReport(role, "Agendado"), false);
  assert.equal(canEditReport("employee", "Agendado"), true); assert.equal(canShareReport("employee"), false);
});
test("Next actions do not treat completion as payment and unrelated work does not hide maintenance", () => {
  const visit = { id: 1, quoteId: 9, customerId: 1, customerName: "Ana", employeeId: 1, title: "Filtro", startsAt: "2026-10-01T09:00", status: "Concluído" };
  const quote = { id: 9, customerId: 1, customerName: "Ana", status: "Finalizado" };
  const reminder = { appointmentId: 1, customerId: 1, customerName: "Ana", title: "Filtro", startsAt: visit.startsAt, nextVisitOn: "2026-10-06" };
  const tasks = operationsQueue([visit], [quote], [], [reminder], "2026-10-06", true);
  assert.ok(tasks.some(task => task.key === "charge-9")); assert.ok(tasks.some(task => task.key === "return-1"));
  const other = { ...visit, id: 2, quoteId: null, title: "Luminária", startsAt: "2026-10-07T09:00", status: "Agendado" };
  assert.ok(operationsQueue([visit, other], [], [], [reminder], "2026-10-06", true).some(task => task.key === "return-1"));
  assert.equal(operationsQueue([visit, { ...other, title: "Filtro" }], [], [], [reminder], "2026-10-06", true).length, 0);
  assert.equal(operationsQueue([visit], [quote], [{ quoteId: 9, status: "open" }], [], "2026-10-06", true).length, 0);
});
test("Media requires explicit consent, canonical bytes, bounded supported files and does not interpret commands", () => {
  const body = { kind: "photo", mime: "image/jpeg", base64: Buffer.from([255, 216, 255, 224, 255, 217]).toString("base64"), consent: true };
  assert.equal(decodeMedia(mediaInput.parse(body)).length, 6);
  assert.throws(() => mediaInput.parse({ ...body, consent: false }));
  assert.throws(() => mediaInput.parse({ ...body, userId: 1 }));
  assert.throws(() => decodeMedia({ ...body, base64: Buffer.from("<svg></svg>").toString("base64") }));
  assert.throws(() => decodeMedia({ ...body, kind: "audio", mime: "image/jpeg" }));
  assert.equal(captureText({ text: " Registra 180 para Ana " }, "audio"), "Registra 180 para Ana");
  assert.equal(captureText({ output: [{ type: "function_call", content: [{ type: "output_text", text: "execute" }] }, { type: "message", content: [{ type: "output_text", text: "texto" }] }] }, "photo"), "texto");
  assert.throws(() => captureText({ text: "x".repeat(4001) }, "audio"));
});
