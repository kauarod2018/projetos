import { eq, and } from "drizzle-orm";
import { workspaceEmployees, workspaceSubscriptions } from "@/db/schema";
import { canManageTeam, canSchedule, entitlement } from "@/lib/saas-policy";
import { lockWorkspaceAuthority, type DbTransaction } from "@/lib/workspace";

export async function employeeAuthority(tx: DbTransaction, workspaceId: number, actorId: number, worker = false, requireAccess = true, scheduling = false) {
  const authority = await lockWorkspaceAuthority(tx, workspaceId, actorId);
  if ((authority.company.kind ?? "company") !== "company" || (worker ? authority.role !== "employee" : !(scheduling ? canSchedule(authority.role) : canManageTeam(authority.role)))) throw new Error("SAAS_FORBIDDEN");
  if (requireAccess) {
    const [subscription] = await tx.select().from(workspaceSubscriptions).where(eq(workspaceSubscriptions.workspaceId, workspaceId));
    if (!entitlement(subscription).allowed) throw new Error("SAAS_SUBSCRIPTION_REQUIRED");
  }
  return authority;
}

export async function ownEmployee(tx: DbTransaction, workspaceId: number, actorId: number) {
  const [employee] = await tx.select().from(workspaceEmployees).where(and(eq(workspaceEmployees.workspaceId, workspaceId), eq(workspaceEmployees.userId, actorId), eq(workspaceEmployees.archived, false))).for("update");
  if (!employee) throw new Error("SAAS_FORBIDDEN");
  return employee;
}
