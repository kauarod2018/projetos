import { z } from "zod";
import { overlaps, validStart } from "./appointments.ts";

const clock = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const availabilitySchema = z.object({ days: z.array(z.number().int().min(0).max(6)).min(1).max(7), start: clock, end: clock }).strict().refine(value => value.end > value.start, "O fim do expediente deve ser posterior ao início.");
export type Availability = z.infer<typeof availabilitySchema>;
export const absenceSchema = z.object({ employeeId: z.number().int().positive(), startsAt: z.string().refine(validStart), endsAt: z.string().refine(validStart), reason: z.string().trim().max(120).default("") }).strict().refine(value => value.endsAt > value.startsAt);

export function sameResource(a: number | null | undefined, b: number | null | undefined) { return (a ?? null) === (b ?? null); }
export function withinAvailability(raw: string | null | undefined, startsAt: string, endsAt: string) {
  if (!raw) return true;
  try {
    const schedule = availabilitySchema.parse(JSON.parse(raw));
    const day = new Date(startsAt.slice(0, 10) + "T12:00:00Z").getUTCDay();
    return startsAt.slice(0, 10) === endsAt.slice(0, 10) && schedule.days.includes(day) && startsAt.slice(11) >= schedule.start && endsAt.slice(11) <= schedule.end;
  } catch { return false; }
}
export function resourceCollision(a: { employeeId?: number | null; startsAt: string; endsAt: string; status?: string }, b: { employeeId?: number | null; startsAt: string; endsAt: string; status?: string }) {
  return a.status !== "Cancelado" && b.status !== "Cancelado" && sameResource(a.employeeId, b.employeeId) && overlaps(a, b);
}
