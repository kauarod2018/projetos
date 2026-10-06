import { z } from "zod";
import { validDay } from "./appointments.ts";

export const reportPhoto = z.object({ id: z.string().uuid(), kind: z.enum(["before", "after"]), caption: z.string().trim().min(1).max(120), data: z.string().max(350_000).regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/) }).strict();
export const reportInput = z.object({
  version: z.number().int().min(0),
  checklist: z.array(z.object({ id: z.string().uuid(), label: z.string().trim().min(1).max(180), done: z.boolean() }).strict()).max(16),
  photos: z.array(reportPhoto).max(4), summary: z.string().trim().max(2000),
  acknowledgedBy: z.string().trim().min(2).max(120).nullable(),
  nextVisitOn: z.string().refine(validDay).nullable(),
}).strict();
export type ReportDraft = Omit<z.infer<typeof reportInput>, "version">;
export type ServiceReport = ReportDraft & { version: number; acknowledgedAt: string | null; publicExpiresAt: string | null; updatedAt: string | null };
export const emptyReport: ServiceReport = { version: 0, checklist: [], photos: [], summary: "", acknowledgedBy: null, acknowledgedAt: null, nextVisitOn: null, publicExpiresAt: null, updatedAt: null };
export function canEditReport(role: string, status: string) { return ["owner", "admin", "editor", "employee"].includes(role) && status !== "Cancelado"; }
export function canShareReport(role: string) { return ["owner", "admin", "editor"].includes(role); }
export function publicReportProjection(report: ServiceReport) {
  return { checklist: report.checklist.map(item => ({ label: item.label, done: item.done })), photos: report.photos.map(photo => ({ kind: photo.kind, caption: photo.caption, data: photo.data })), summary: report.summary, nextVisitOn: report.nextVisitOn, updatedAt: report.updatedAt };
}
