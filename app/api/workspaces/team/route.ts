import { and, eq, gt, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { users, workspaceInvites, workspaceMembers, workspaceSubscriptions, workspaceEmployees } from "@/db/schema";
import { consumeRateLimit, createPublicToken, getCurrentUser } from "@/lib/auth";
import { forbiddenMutationResponse, readJson, requestError, unauthorizedResponse } from "@/lib/api-security";
import { jsonResponse } from "@/lib/http";
import { appOrigin } from "@/lib/deployment";
import { canManageRole, canManageTeam, entitlement, validRole } from "@/lib/saas-policy";
import { inviteDigest, lockWorkspaceAuthority, resolveWorkspace } from "@/lib/workspace";

const role = z.enum(["admin", "editor", "viewer", "employee", "reception"]);

export async function GET(request: Request) {
  try {
    const actor = await getCurrentUser(request);
    if (!actor) return unauthorizedResponse();
    const scope = await resolveWorkspace(request, actor);
    if (!canManageTeam(scope.summary.role)) throw new Error("SAAS_FORBIDDEN");
    const id = scope.summary.id;
    const members = await getDb().select({ userId: users.id, name: users.name, email: users.email, role: workspaceMembers.role }).from(workspaceMembers)
      .innerJoin(users, eq(users.id, workspaceMembers.userId)).where(eq(workspaceMembers.workspaceId, id));
    const invites = await getDb().select({ id: workspaceInvites.id, email: workspaceInvites.email, role: workspaceInvites.role, expiresAt: workspaceInvites.expiresAt }).from(workspaceInvites)
      .where(and(eq(workspaceInvites.workspaceId, id), isNull(workspaceInvites.revokedAt), isNull(workspaceInvites.acceptedAt), gt(workspaceInvites.expiresAt, new Date().toISOString())));
    return jsonResponse({ members, invites });
  } catch (error) { return requestError(error, "Não foi possível carregar a equipe."); }
}

export async function POST(request: Request) {
  const forbidden = forbiddenMutationResponse(request);
  if (forbidden) return forbidden;
  try {
    const actor = await getCurrentUser(request);
    if (!actor) return unauthorizedResponse();
    const scope = await resolveWorkspace(request, actor);
    if (!actor.emailVerifiedAt) return jsonResponse({ error: "Confirme seu e-mail antes de convidar a equipe." }, { status: 403 });
    if (!canManageTeam(scope.summary.role)) throw new Error("SAAS_FORBIDDEN");
    const body = z.object({ email: z.string().trim().toLowerCase().email().max(254), role }).strict().parse(await readJson(request, 2_048));
    if (!canManageRole(scope.summary.role, body.role, body.role)) throw new Error("SAAS_FORBIDDEN");
    if (!await consumeRateLimit("workspace-invite:" + actor.id, 25, 86_400)) return jsonResponse({ error: "Limite de convites atingido. Tente novamente amanhã." }, { status: 429 });
    const token = createPublicToken();
    const id = await inviteDigest(token);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 86_400_000).toISOString();
    await getDb().transaction(async tx => {
      const authority = await lockWorkspaceAuthority(tx, scope.summary.id, actor.id);
      if ((authority.company.kind ?? "company") !== "company") throw new Error("SAAS_FORBIDDEN");
      if (!canManageRole(authority.role, body.role, body.role)) throw new Error("SAAS_FORBIDDEN");
      if (body.role === "employee") {
        const [employee] = await tx.select().from(workspaceEmployees).where(and(eq(workspaceEmployees.workspaceId, scope.summary.id), eq(workspaceEmployees.email, body.email), eq(workspaceEmployees.archived, false))).for("update");
        if (!employee) throw new Error("EMPLOYEE_REQUIRED");
      }
      const [subscription] = await tx.select().from(workspaceSubscriptions).where(eq(workspaceSubscriptions.workspaceId, scope.summary.id));
      if (!entitlement(subscription).allowed) throw new Error("SAAS_SUBSCRIPTION_REQUIRED");
      const [already] = await tx.select({ id: users.id }).from(workspaceMembers).innerJoin(users, eq(users.id, workspaceMembers.userId))
        .where(and(eq(workspaceMembers.workspaceId, scope.summary.id), eq(users.email, body.email)));
      if (already) throw new Error("TEAM_ALREADY_MEMBER");
      await tx.update(workspaceInvites).set({ revokedAt: now.toISOString() }).where(and(eq(workspaceInvites.workspaceId, scope.summary.id), eq(workspaceInvites.email, body.email), isNull(workspaceInvites.acceptedAt), isNull(workspaceInvites.revokedAt)));
      await tx.insert(workspaceInvites).values({ id, workspaceId: scope.summary.id, invitedBy: actor.id, email: body.email, role: body.role, expiresAt });
    });
    return jsonResponse({ invitationUrl: `${appOrigin(request)}/convite#${token}`, expiresAt }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "EMPLOYEE_REQUIRED") return jsonResponse({ error: "Cadastre o funcionário com este e-mail antes de convidá-lo." }, { status: 409 });
    if (error instanceof Error && error.message === "TEAM_ALREADY_MEMBER") return jsonResponse({ error: "Esta pessoa já faz parte da empresa." }, { status: 409 });
    return requestError(error, "Não foi possível criar o convite.");
  }
}

export async function PATCH(request: Request) { return mutateMember(request, false); }
export async function DELETE(request: Request) { return mutateMember(request, true); }

async function mutateMember(request: Request, remove: boolean) {
  const forbidden = forbiddenMutationResponse(request);
  if (forbidden) return forbidden;
  try {
    const actor = await getCurrentUser(request);
    if (!actor) return unauthorizedResponse();
    const scope = await resolveWorkspace(request, actor);
    const body = remove ? z.union([z.object({ userId: z.number().int().positive() }).strict(), z.object({ inviteId: z.string().regex(/^[a-f0-9]{64}$/) }).strict()]).parse(await readJson(request, 2_048))
      : z.object({ userId: z.number().int().positive(), role }).strict().parse(await readJson(request, 2_048));
    await getDb().transaction(async tx => {
      const authority = await lockWorkspaceAuthority(tx, scope.summary.id, actor.id);
      if (!canManageTeam(authority.role)) throw new Error("SAAS_FORBIDDEN");
      if ("inviteId" in body) {
        const condition = and(eq(workspaceInvites.id, body.inviteId), eq(workspaceInvites.workspaceId, scope.summary.id));
        const [invite] = await tx.select().from(workspaceInvites).where(condition).for("update");
        if (!invite || !validRole(invite.role) || !canManageRole(authority.role, invite.role)) throw new Error("SAAS_FORBIDDEN");
        await tx.update(workspaceInvites).set({ revokedAt: new Date().toISOString() }).where(condition);
        return;
      }
      const condition = and(eq(workspaceMembers.workspaceId, scope.summary.id), eq(workspaceMembers.userId, body.userId));
      const [member] = await tx.select().from(workspaceMembers).where(condition).for("update");
      const next = "role" in body && typeof body.role === "string" && validRole(body.role) ? body.role : undefined;
      if (!member || body.userId === actor.id || !validRole(member.role) || !canManageRole(authority.role, member.role, next)) throw new Error("SAAS_FORBIDDEN");
      if (remove) {
        await tx.delete(workspaceMembers).where(condition);
        await tx.update(workspaceEmployees).set({ userId: null }).where(and(eq(workspaceEmployees.workspaceId, scope.summary.id), eq(workspaceEmployees.userId, body.userId)));
      }
      else {
        if ((authority.company.kind ?? "company") !== "company") throw new Error("SAAS_FORBIDDEN");
        if (next === "employee") {
          const [person] = await tx.select().from(users).where(eq(users.id, body.userId));
          const [employee] = person ? await tx.select().from(workspaceEmployees).where(and(eq(workspaceEmployees.workspaceId, scope.summary.id), eq(workspaceEmployees.email, person.email), eq(workspaceEmployees.archived, false))).for("update") : [];
          if (!employee) throw new Error("EMPLOYEE_REQUIRED");
          await tx.update(workspaceEmployees).set({ userId: body.userId }).where(eq(workspaceEmployees.id, employee.id));
        }
        const [subscription] = await tx.select().from(workspaceSubscriptions).where(eq(workspaceSubscriptions.workspaceId, scope.summary.id));
        if (!entitlement(subscription).allowed) throw new Error("SAAS_SUBSCRIPTION_REQUIRED");
        await tx.update(workspaceMembers).set({ role: next! }).where(condition);
      }
    });
    return jsonResponse({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "EMPLOYEE_REQUIRED") return jsonResponse({ error: "Cadastre o funcionário com o e-mail desta conta antes de alterar o acesso." }, { status: 409 });
    return requestError(error, "Não foi possível atualizar o acesso.");
  }
}
