import { z } from "zod";
import type { Customer, QuoteStatus } from "./models";
import type { AppointmentStatus } from "./appointments";

export const historyQuerySchema = z.object({
  kind: z.enum(["quotes", "appointments", "receipts"]),
  before: z.string().regex(/^[1-9]\d{0,9}$/).transform(Number).refine(v => v <= 4_294_967_295).optional(),
});
export const HISTORY_PAGE_SIZE = 20;
export type HistoryQuote = { id: number; description: string; status: QuoteStatus; createdAt: string; validUntil: string; totalCents: number };
export type HistoryAppointment = { id: number; title: string; status: AppointmentStatus; startsAt: string; endsAt: string; notes: string };
export type HistoryReceipt = { id: number; quoteId: number; description: string; amountCents: number; transactionDate: string; createdAt: string };
export type CustomerHistory = { customer: Customer; nextCursor: number | null } & (
  { kind: "quotes"; records: HistoryQuote[] } | { kind: "appointments"; records: HistoryAppointment[] } | { kind: "receipts"; records: HistoryReceipt[] }
);
