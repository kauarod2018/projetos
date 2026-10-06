import { and, eq, isNull, isNotNull, ne } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { workspaces, workspaceMembers, workspaceEmployees, workspaceInvites, appointments } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { forbiddenMutationResponse, readJson, requestError, unauthorizedResponse } from "@/lib/api-security";
import { jsonResponse } from "@/lib/http";
import { canManageTeam, entitlement, validRole } from "@/lib/saas-policy";
import { listWorkspaces, lockWorkspaceAuthority, resolveWorkspace, saasEnabled, selectWorkspace } from "@/lib/workspace";

export async function GET(request: Request) {
  try {
    const actor = await getCurrentUser(request);
    if (!actor) return unauthorizedResponse();
    if (!saasEnabled()) return jsonResponse({ enabled: false });
    const rows = await listWorkspaces(actor.id);
    let activeId: number | null = null;
    try { activeId = (await resolveWorkspace(request, actor)).summary.id; } catch { /* The picker remains available after membership removal. */ }
    return jsonResponse({ enabled: true, activeId, workspaces: rows.filter(row => validRole(row.role)).map(row => ({ id: row.id, name: row.name, kind: row.kind === "individual" ? "individual" : "company", role: row.role, entitlement: entitlement(row.status ? { ...row, status: row.status } : undefined) })) });
  } catch (error) { return requestError(error, "Não foi possível carregar suas empresas."); }
}

export async function POST(request: Request) {
  const forbidden = forbiddenMutationResponse(request);
  if (forbidden) return forbidden;
  try {
    const actor = await getCurrentUser(request);
    if (!actor) return unauthorizedResponse();
    if (!saasEnabled()) throw new Error("SAAS_DISABLED");
    const { workspaceId } = z.object({ workspaceId: z.number().int().positive() }).strict().parse(await readJson(request, 1_024));
    await getDb().transaction(async tx => {
      await lockWorkspaceAuthority(tx, workspaceId, actor.id);
      await selectWorkspace(tx, request, actor.id, workspaceId);
    });
    return jsonResponse({ ok: true });
  } catch (error) { return requestError(error, "Não foi possível trocar de empresa."); }
}

export async function PATCH(request: Request) {
  const forbidden = forbiddenMutationResponse(request);
  if (forbidden) return forbidden;
  try {
    const actor = await getCurrentUser(request);
    if (!actor) return unauthorizedResponse();
    const scope = await resolveWorkspace(request, actor);
    const body = z.union([z.object({ name: z.string().trim().min(2).max(120) }).strict(), z.object({ kind: z.enum(["individual", "company"]) }).strict()]).parse(await readJson(request, 2_048));
    await getDb().transaction(async tx => {
      const authority = await lockWorkspaceAuthority(tx, scope.summary.id, actor.id);
      if (!canManageTeam(authority.role)) throw new Error("SAAS_FORBIDDEN");
      if ("kind" in body) {
        if (authority.role !== "owner") throw new Error("SAAS_FORBIDDEN");
        if (body.kind === "individual") {
          const members = await tx.select().from(workspaceMembers).where(eq(workspaceMembers.workspaceId, scope.summary.id));
          const employees = await tx.select().from(workspaceEmployees).where(and(eq(workspaceEmployees.workspaceId, scope.summary.id), eq(workspaceEmployees.archived, false)));
          const invitations = await tx.select().from(workspaceInvites).where(and(eq(workspaceInvites.workspaceId, scope.summary.id), isNull(workspaceInvites.acceptedAt), isNull(workspaceInvites.revokedAt)));
          if (members.some(member => member.userId !== actor.id) || employees.length || invitations.some(invite => invite.expiresAt > new Date().toISOString())) throw new Error("WORKSPACE_HAS_TEAM");
          const [assigned] = await tx.select({ id: appointments.id }).from(appointments).where(and(eq(appointments.userId, authority.company.ownerUserId), isNotNull(appointments.employeeId), ne(appointments.status, "Concluído"), ne(appointments.status, "Cancelado"))).limit(1);
          if (assigned) throw new Error("WORKSPACE_HAS_ASSIGNED_WORK");
        }
      }
      await tx.update(workspaces).set(body).where(eq(workspaces.id, scope.summary.id));
    });
    return jsonResponse({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "WORKSPACE_HAS_TEAM") return jsonResponse({ error: "Remova os acessos, revogue os convites e arquive os funcionários antes de mudar para Individual." }, { status: 409 });
    if (error instanceof Error && error.message === "WORKSPACE_HAS_ASSIGNED_WORK") return jsonResponse({ error: "Reatribua à sua agenda ou cancele os atendimentos pendentes dos funcionários antes de mudar para Individual." }, { status: 409 });
    return requestError(error, "Não foi possível atualizar a empresa.");
  }
}
