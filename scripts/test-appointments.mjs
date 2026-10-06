import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { appointmentCreateSchema, appointmentFieldsSchema, appointmentRangeSchema, appointmentStartLabel, brasiliaDay, endOfAppointment, moveDay, overlaps, recurringStart, validDay, validStart } from '../lib/appointments.ts';

test('Agenda uses valid civil dates and Brasilia day, independent of server timezone', () => {
  assert.equal(validDay('2026-02-29'), false);
  assert.equal(validDay('2028-02-29'), true);
  for (const value of ['2026-13-01', '2026-04-31', '2026-1-01', '1999-12-31']) assert.equal(validDay(value), false);
  assert.equal(validStart('2026-09-28T24:00'), false);
  assert.equal(validStart('2026-09-28T14:60'), false);
  assert.equal(validStart('2026-09-28T14:00'), true);
  assert.equal(brasiliaDay(new Date('2026-09-29T01:30:00Z')), '2026-09-28');
  assert.equal(endOfAppointment('2026-12-31T23:30', 90), '2027-01-01T01:00');
  assert.equal(moveDay('2028-02-28', 1), '2028-02-29');
  assert.equal(appointmentStartLabel({ startsAt: '2026-09-28T23:30' }, '2026-09-29'), '23:30 (dia anterior)');
});
test('Touching intervals are allowed; containing, overnight and overlapping intervals conflict', () => {
  const base = { startsAt: '2026-09-28T23:00', endsAt: '2026-09-29T01:00' };
  assert.equal(overlaps(base, { startsAt: base.endsAt, endsAt: '2026-09-29T02:00' }), false);
  assert.equal(overlaps(base, { startsAt: '2026-09-29T00:00', endsAt: '2026-09-29T00:30' }), true);
  assert.equal(overlaps(base, { startsAt: '2026-09-28T22:00', endsAt: '2026-09-29T02:00' }), true);
});
test('Recurring appointments preserve civil time and clamp monthly dates safely', () => {
  assert.equal(recurringStart('2028-01-31T09:30', 'monthly', 1), '2028-02-29T09:30');
  assert.equal(recurringStart('2028-01-31T09:30', 'monthly', 2), '2028-03-31T09:30');
  assert.equal(recurringStart('2026-10-04T14:00', 'weekly', 2), '2026-10-18T14:00');
  assert.equal(recurringStart('2026-10-04T14:00', 'biweekly', 1), '2026-10-18T14:00');
  const base = { customerId: 1, serviceId: null, title: 'Visita', startsAt: '2026-10-04T14:00', durationMinutes: 60, notes: '', requestKey: '26b0c506-5672-4c46-9d87-d87cd77d3ab9' };
  assert.equal(appointmentCreateSchema.safeParse({ ...base, recurrence: 'weekly', recurrenceCount: 4 }).success, true);
  assert.equal(appointmentCreateSchema.safeParse({ ...base, recurrence: 'weekly', recurrenceCount: 1 }).success, false);
  assert.equal(appointmentCreateSchema.safeParse({ ...base, recurrence: 'none', recurrenceCount: 2 }).success, false);
});
test('Appointment input rejects ownership, invalid dates, duration and excessive query ranges', () => {
  const valid = { customerId: 1, serviceId: null, title: 'Visita', startsAt: '2026-09-28T10:00', durationMinutes: 60, notes: '' };
  assert.ok(appointmentFieldsSchema.safeParse(valid).success);
  for (const patch of [{ userId: 2 }, { customerId: 0 }, { durationMinutes: 0 }, { durationMinutes: 1441 }, { durationMinutes: 1.5 }, { startsAt: '2026-02-30T10:00' }, { status: 'Concluído' }]) assert.equal(appointmentFieldsSchema.safeParse({ ...valid, ...patch }).success, false);
  assert.equal(appointmentRangeSchema.safeParse({ from: '2026-09-28', to: '2026-09-27' }).success, false);
  assert.equal(appointmentRangeSchema.safeParse({ from: '2026-09-01', to: '2026-12-01' }).success, false);
});
test('Agenda migration is additive and preserves appointments when contacts are removed', () => {
  const sql = readFileSync(new URL('../database/012-assistente-financeiro-agenda-historico.sql', import.meta.url), 'utf8');
  assert.match(sql, /ALTER TABLE appointments[\s\S]*ADD COLUMN series_id/);
  assert.match(sql, /UNIQUE KEY uq_appointments_owner_occurrence/);
  assert.match(sql, /ON DELETE SET NULL/);
  assert.doesNotMatch(sql, /\b(DROP TABLE|TRUNCATE|UPDATE|INSERT)\s/i);
});
