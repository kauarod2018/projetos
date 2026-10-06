import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { appointments, employeeAssignments, users, workspaceSubscriptions } from "@/db/schema";
import { getCurrentUser } from "./auth";
import { entitlement, validRole } from "./saas-policy";
import { lockWorkspaceAuthority, resolveWorkspace, saasEnabled, type DbTransaction } from "./workspace";
import { ownEmployee } from "./employee-access";
import { emptyReport, reportInput, type ServiceReport } from "./service-report-policy";

export async function reportScope(request: Request) {
  const actor = await getCurrentUser(request); if (!actor) return null;
  if (!saasEnabled()) return { actorId: actor.id, ownerId: actor.id, workspaceId: null, role: "owner" };
  const scope = await resolveWorkspace(request, actor);
  if (!scope.summary.entitlement.allowed) throw new Error("SAAS_SUBSCRIPTION_REQUIRED");
  return { actorId: actor.id, ownerId: scope.dataOwnerId, workspaceId: scope.summary.id, role: scope.summary.role };
}
export async function authorizedAppointment(tx: DbTransaction, scope: NonNullable<Awaited<ReturnType<typeof reportScope>>>, id: number) {
  let role = scope.role;
  if (scope.workspaceId !== null) {
    const authority = await lockWorkspaceAuthority(tx, scope.workspaceId, scope.actorId);
    role = authority.role;
    if (authority.company.ownerUserId !== scope.ownerId || !validRole(role)) throw new Error("SAAS_FORBIDDEN");
    const [subscription] = await tx.select().from(workspaceSubscriptions).where(eq(workspaceSubscriptions.workspaceId, scope.workspaceId));
    if (!entitlement(subscription).allowed) throw new Error("SAAS_SUBSCRIPTION_REQUIRED");
  }
  await tx.select({ id: users.id }).from(users).where(eq(users.id, scope.ownerId)).for("update");
  const [appointment] = await tx.select().from(appointments).where(and(eq(appointments.userId, scope.ownerId), eq(appointments.id, id))).for("update");
  if (!appointment) throw new Error("SAAS_FORBIDDEN");
  if (role === "employee") {
    if (scope.workspaceId === null) throw new Error("SAAS_FORBIDDEN");
    const employee = await ownEmployee(tx, scope.workspaceId, scope.actorId);
    const [assignment] = await tx.select().from(employeeAssignments).where(and(eq(employeeAssignments.workspaceId, scope.workspaceId), eq(employeeAssignments.employeeId, employee.id), eq(employeeAssignments.appointmentId, id))).for("update");
    if (!assignment || appointment.employeeId !== employee.id) throw new Error("SAAS_FORBIDDEN");
  }
  return { appointment, role };
}
export function decodeReport(row?: { version: number; checklist: string; photos: string; summary: string; acknowledgedBy: string | null; acknowledgedAt: string | null; nextVisitOn: string | null; publicExpiresAt: string | null; updatedAt: string }) : ServiceReport {
  if (!row) return { ...emptyReport, checklist: [], photos: [] };
  const content = reportInput.parse({ version: row.version, checklist: JSON.parse(row.checklist), photos: JSON.parse(row.photos), summary: row.summary, acknowledgedBy: row.acknowledgedBy, nextVisitOn: row.nextVisitOn });
  return { ...content, acknowledgedAt: row.acknowledgedAt, publicExpiresAt: row.publicExpiresAt, updatedAt: row.updatedAt };
}
export function validJpeg(data: string) {
  const buffer = Buffer.from(data.slice("data:image/jpeg;base64,".length), "base64");
  return buffer.length >= 4 && buffer.length <= 250_000 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff && buffer.at(-2) === 0xff && buffer.at(-1) === 0xd9;
}
