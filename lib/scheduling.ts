import { and, eq, gt, isNull, lt, ne } from "drizzle-orm";
import { appointments, employeeAbsences, workspaceEmployees } from "@/db/schema";
import type { DbTransaction } from "./workspace";
import { withinAvailability } from "./scheduling-policy";

// Call only after locking the workspace (when present) and the business owner.
export async function assertAvailable(tx: DbTransaction, ownerId: number, workspaceId: number | null, employeeId: number | null, startsAt: string, endsAt: string, exceptId?: number) {
  if (employeeId !== null) {
    if (workspaceId === null) throw new Error("SAAS_FORBIDDEN");
    const [employee] = await tx.select().from(workspaceEmployees).where(and(eq(workspaceEmployees.workspaceId, workspaceId), eq(workspaceEmployees.id, employeeId), eq(workspaceEmployees.archived, false))).for("update");
    if (!employee) throw new Error("SAAS_FORBIDDEN");
    if (!withinAvailability(employee.availability, startsAt, endsAt)) throw new Error("SCHEDULE_UNAVAILABLE");
    const absences = await tx.select({ id: employeeAbsences.id }).from(employeeAbsences).where(and(eq(employeeAbsences.workspaceId, workspaceId), eq(employeeAbsences.employeeId, employeeId), lt(employeeAbsences.startsAt, endsAt), gt(employeeAbsences.endsAt, startsAt))).for("update");
    if (absences.length) throw new Error("SCHEDULE_UNAVAILABLE");
  }
  const conflicts = await tx.select({ id: appointments.id }).from(appointments).where(and(eq(appointments.userId, ownerId), ne(appointments.status, "Cancelado"), workspaceId !== null ? employeeId === null ? isNull(appointments.employeeId) : eq(appointments.employeeId, employeeId) : undefined, lt(appointments.startsAt, endsAt), gt(appointments.endsAt, startsAt), exceptId ? ne(appointments.id, exceptId) : undefined)).for("update");
  if (conflicts.length) throw new Error("SCHEDULE_CONFLICT");
}
