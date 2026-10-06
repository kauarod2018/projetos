import { z } from "zod";
import { dateSchema } from "./validation";

export const receiptSchema = z.object({
  amountCents: z.number().int().positive().max(100_000_000_000),
  transactionDate: dateSchema,
  existingTransactionId: z.number().int().positive().max(4294967295).optional(),
}).strict();

export const receiptCorrectionSchema = z.object({
  receiptId: z.number().int().positive().max(4294967295),
  expectedVersion: z.number().int().positive().max(4294967294),
  transactionDate: dateSchema,
  reason: z.string().trim().min(5, "Descreva o motivo com pelo menos 5 caracteres.").max(500),
}).strict();

export type ReceiptDateCorrection = {
  id: number; version: number; previousDate: string; correctedDate: string;
  reason: string; createdAt: string;
};

export function receiptTotal(items: { quantity: number; unitPriceCents: number }[], discountCents: number) {
  const total = items.reduce((sum, item) => sum + Math.round(item.quantity * item.unitPriceCents), 0) - discountCents;
  return items.length && Number.isSafeInteger(total) && total > 0 && total <= 100_000_000_000 ? total : null;
}
