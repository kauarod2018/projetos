import { z } from "zod";
import { availabilitySchema } from "./scheduling-policy.ts";
export const employeeFields = z.object({ name: z.string().trim().min(2).max(120), email: z.string().trim().toLowerCase().email().max(254), phone: z.string().trim().max(30).default(""), jobTitle: z.string().trim().max(120).default(""), availability: availabilitySchema.nullable().optional() }).strict();
export const employeeEdit = employeeFields.extend({ id: z.number().int().positive(), version: z.number().int().positive(), archived: z.boolean() }).strict();
export const assignmentInput = z.object({ appointmentId: z.number().int().positive(), employeeId: z.number().int().positive().nullable(), version: z.number().int().positive(), instructions: z.string().trim().max(1000).default("") }).strict();
export function employeeTransition(current: string, next: string) {
  return (["Agendado", "Confirmado"].includes(current) && next === "Em atendimento") || (current === "Em atendimento" && next === "Concluído");
}
