import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { workspaces, workspaceMembers, workspaceInvites, workspaceSubscriptions, workspaceEmployees } from "@/db/schema";
import { consumeRateLimit, getCurrentUser } from "@/lib/auth";
import { forbiddenMutationResponse, readJson, requestError, unauthorizedResponse } from "@/lib/api-security";
import { jsonResponse } from "@/lib/http";
import { entitlement, validRole } from "@/lib/saas-policy";
import { inviteDigest, saasEnabled, selectWorkspace } from "@/lib/workspace";

export async function POST(request: Request) {
  const forbidden = forbiddenMutationResponse(request);
  if (forbidden) return forbidden;
  try {
    const actor = await getCurrentUser(request);
    if (!actor) return unauthorizedResponse();
    if (!saasEnabled()) throw new Error("SAAS_DISABLED");
    if (!actor.emailVerifiedAt) return jsonResponse({ error: "Confirme seu e-mail antes de aceitar o convite." }, { status: 403 });
    const { token } = z.object({ token: z.string().regex(/^[A-Za-z0-9_-]{32}$/) }).strict().parse(await readJson(request, 1_024));
    if (!await consumeRateLimit("invite-accept:" + actor.id, 30, 3_600)) return jsonResponse({ error: "Muitas tentativas. Tente novamente mais tarde." }, { status: 429 });
    const id = await inviteDigest(token);
    const [lookup] = await getDb().select({ workspaceId: workspaceInvites.workspaceId }).from(workspaceInvites).where(eq(workspaceInvites.id, id)).limit(1);
    if (!lookup) throw new Error("INVITE_UNAVAILABLE");
    const role = await getDb().transaction(async tx => {
      const [company] = await tx.select().from(workspaces).where(eq(workspaces.id, lookup.workspaceId)).for("update");
      if (!company || (company.kind ?? "company") !== "company") throw new Error("INVITE_UNAVAILABLE");
      const [invite] = await tx.select().from(workspaceInvites).where(eq(workspaceInvites.id, id)).for("update");
      if (!invite || invite.revokedAt || invite.acceptedAt || invite.expiresAt <= new Date().toISOString() || !validRole(invite.role) || invite.role === "owner") throw new Error("INVITE_UNAVAILABLE");
      if (invite.email.toLowerCase() !== actor.email.toLowerCase()) throw new Error("INVITE_EMAIL_MISMATCH");
      const [inviter] = await tx.select().from(workspaceMembers).where(and(eq(workspaceMembers.workspaceId, invite.workspaceId), eq(workspaceMembers.userId, invite.invitedBy)));
      if (!inviter || (inviter.role !== "owner" && (inviter.role !== "admin" || invite.role === "admin"))) throw new Error("INVITE_UNAVAILABLE");
      const [subscription] = await tx.select().from(workspaceSubscriptions).where(eq(workspaceSubscriptions.workspaceId, invite.workspaceId));
      if (!entitlement(subscription).allowed) throw new Error("SAAS_SUBSCRIPTION_REQUIRED");
      const [existing] = await tx.select().from(workspaceMembers).where(and(eq(workspaceMembers.workspaceId, invite.workspaceId), eq(workspaceMembers.userId, actor.id)));
      if (existing) throw new Error("INVITE_UNAVAILABLE");
      if (invite.role === "employee") {
        const [employee] = await tx.select().from(workspaceEmployees).where(and(eq(workspaceEmployees.workspaceId, invite.workspaceId), eq(workspaceEmployees.email, actor.email.toLowerCase()), eq(workspaceEmployees.archived, false))).for("update");
        if (!employee || (employee.userId !== null && employee.userId !== actor.id)) throw new Error("INVITE_UNAVAILABLE");
        await tx.update(workspaceEmployees).set({ userId: actor.id }).where(eq(workspaceEmployees.id, employee.id));
      }
      await tx.insert(workspaceMembers).values({ workspaceId: invite.workspaceId, userId: actor.id, role: invite.role });
      await tx.update(workspaceInvites).set({ acceptedAt: new Date().toISOString() }).where(eq(workspaceInvites.id, id));
      await selectWorkspace(tx, request, actor.id, invite.workspaceId);
      return invite.role;
    });
    return jsonResponse({ ok: true, next: role === "employee" ? "/meu-trabalho" : "/hoje" });
  } catch (error) {
    if (error instanceof Error && error.message === "INVITE_EMAIL_MISMATCH") return jsonResponse({ error: "Entre com a conta que recebeu este convite." }, { status: 403 });
    if (error instanceof Error && error.message === "INVITE_UNAVAILABLE") return jsonResponse({ error: "Este convite foi usado, expirou ou foi revogado. Peça um novo link." }, { status: 410 });
    return requestError(error, "Não foi possível aceitar o convite.");
  }
}
