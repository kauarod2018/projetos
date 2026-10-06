import { z } from "zod";
import { dateSchema } from "@/lib/validation";

export const obligationCreateSchema = z.object({
  type: z.enum(["receivable", "payable"]),
  customerId: z.number().int().positive().max(4_294_967_295).nullable().default(null),
  description: z.string().trim().min(2).max(300),
  amountCents: z.number().int().positive().max(100_000_000_000),
  dueDate: dateSchema,
  installmentCount: z.number().int().min(1).max(24).default(1),
  requestKey: z.string().uuid().optional(),
}).strict();

export const obligationPaymentSchema = z.object({
  amountCents: z.number().int().positive().max(100_000_000_000),
  transactionDate: dateSchema,
  requestKey: z.string().uuid(),
}).strict();

export function installmentDate(date: string, offset: number) {
  const [year, month, day] = date.split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1 + offset, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  return `${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, "0")}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
}

export function splitInstallments(totalCents: number, count: number) {
  const base = Math.floor(totalCents / count);
  const remainder = totalCents % count;
  return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0));
}
