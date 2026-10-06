import { z } from "zod";

export const appointmentStatuses = ["Agendado", "Confirmado", "Em atendimento", "Concluído", "Cancelado"] as const;
export type AppointmentStatus = typeof appointmentStatuses[number];
export const appointmentRecurrences = ["none", "weekly", "biweekly", "monthly"] as const;
export type AppointmentRecurrence = typeof appointmentRecurrences[number];
export type Appointment = {
  id: number; customerId: number | null; serviceId: number | null;
  customerPhone?: string | null;
  employeeId?: number | null; employeeName?: string | null; quoteId?: number | null;
  customerName: string; title: string; startsAt: string; endsAt: string;
  durationMinutes: number; notes: string; status: AppointmentStatus; version: number;
  createdAt: string; updatedAt: string;
};

export function validDay(value: string) {
  return /^20\d{2}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value + "T00:00:00Z")) && new Date(value + "T00:00:00Z").toISOString().slice(0, 10) === value;
}
export function validStart(value: string) {
  return /^20\d{2}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/.test(value) && validDay(value.slice(0, 10));
}
// Civil times in Brasilia, independent of the browser/server timezone.
export function endOfAppointment(start: string, minutes: number) {
  return new Date(Date.parse(start + ":00Z") + minutes * 60_000).toISOString().slice(0, 16);
}
export function moveDay(day: string, offset: number) {
  return new Date(Date.parse(day + "T12:00:00Z") + offset * 86_400_000).toISOString().slice(0, 10);
}
export function recurringStart(start: string, recurrence: Exclude<AppointmentRecurrence, "none">, occurrence: number) {
  const [year, month, day] = start.slice(0, 10).split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  if (recurrence === "weekly" || recurrence === "biweekly") date.setUTCDate(date.getUTCDate() + occurrence * (recurrence === "weekly" ? 7 : 14));
  else {
    const targetMonth = month - 1 + occurrence;
    const lastDay = new Date(Date.UTC(year, targetMonth + 1, 0, 12)).getUTCDate();
    date.setUTCFullYear(year, targetMonth, Math.min(day, lastDay));
  }
  return `${date.toISOString().slice(0, 10)}${start.slice(10)}`;
}
export function brasiliaDay(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
export function appointmentStartLabel(appointment: Pick<Appointment, "startsAt">, day: string) {
  return `${appointment.startsAt.slice(11)}${appointment.startsAt.slice(0, 10) < day ? " (dia anterior)" : ""}`;
}

function formatAppointmentDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(date);
}

export function whatsappReminderUrl(phone: string | null | undefined, customerName: string, title: string, startsAt: string) {
  const digits = (phone ?? "").replace(/\D/g, "");
  const internationalBrazilianNumber = digits.length === 12 || digits.length === 13;
  if (!(digits.length === 10 || digits.length === 11 || (internationalBrazilianNumber && digits.startsWith("55")))) return null;
  const number = digits.length <= 11 ? `55${digits}` : digits;
  const message = `Olá, ${customerName}! Passando para lembrar do nosso atendimento de ${title}, marcado para ${formatAppointmentDate(startsAt)} às ${startsAt.slice(11)}. Se precisar ajustar, é só me avisar por aqui. Até lá!`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function appointmentIsUpcoming(startsAt: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  const brasiliaNow = `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
  return startsAt > brasiliaNow;
}
export const appointmentFieldsSchema = z.object({
  customerId: z.number().int().positive().max(4_294_967_295),
  serviceId: z.number().int().positive().max(4_294_967_295).nullable(),
  title: z.string().trim().min(1, "Informe o serviço ou assunto.").max(120),
  startsAt: z.string().refine(validStart, "Informe uma data e horário válidos."),
  durationMinutes: z.number().int().min(1).max(1440),
  notes: z.string().trim().max(1000).default(""),
  employeeId: z.number().int().positive().max(4_294_967_295).nullable().optional(),
}).strict();
export const appointmentCreateSchema = appointmentFieldsSchema.extend({ quoteId: z.number().int().positive().nullable().optional(), requestKey: z.string().uuid(), recurrence: z.enum(appointmentRecurrences).default("none"), recurrenceCount: z.number().int().min(1).max(24).default(1) }).strict().superRefine((value, ctx) => {
  if (value.quoteId && value.recurrence !== "none") ctx.addIssue({ code: "custom", path: ["recurrence"], message: "Agende cada visita do orçamento separadamente." });
  if (value.recurrence === "none" && value.recurrenceCount !== 1) ctx.addIssue({ code: "custom", path: ["recurrenceCount"], message: "Compromisso único deve ter uma ocorrência." });
  if (value.recurrence !== "none" && value.recurrenceCount < 2) ctx.addIssue({ code: "custom", path: ["recurrenceCount"], message: "Escolha pelo menos duas ocorrências para repetir." });
});
export const appointmentEditSchema = appointmentFieldsSchema.extend({ version: z.number().int().positive().max(4_294_967_294) }).strict();
export const appointmentStatusSchema = z.object({ status: z.enum(appointmentStatuses), version: z.number().int().positive().max(4_294_967_294) }).strict();
export const appointmentRangeSchema = z.object({ from: z.string().refine(validDay), to: z.string().refine(validDay) }).refine(v => v.to >= v.from && Date.parse(v.to) - Date.parse(v.from) <= 31 * 86_400_000);
export function overlaps(a: { startsAt: string; endsAt: string }, b: { startsAt: string; endsAt: string }) { return a.startsAt < b.endsAt && a.endsAt > b.startsAt; }
