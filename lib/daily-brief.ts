import type { Appointment } from "./appointments";

export function nextDailyAppointment(items: Appointment[], now: Date) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now).map(part => [part.type, part.value]));
  const day = `${parts.year}-${parts.month}-${parts.day}`;
  const current = `${day}T${parts.hour}:${parts.minute}`;
  const remaining = items.filter(item => !["Cancelado", "Concluído"].includes(item.status) && item.startsAt.slice(0, 10) <= day && item.endsAt > current)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt) || a.id - b.id);
  const next = remaining[0] ?? null;
  return { next, remaining: remaining.length, inProgressWindow: next !== null && next.startsAt <= current };
}
