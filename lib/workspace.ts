import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { workspaceMembers, workspaces, workspaceSelections, workspaceSubscriptions, sessions } from "@/db/schema";
import { readSessionToken, tokenHash, type AuthUser } from "@/lib/auth";
import { assertBusinessAccess, canManageTeam, entitlement, oneMonthAfter, validRole, type WorkspaceSummary, type WorkspaceKind } from "@/lib/saas-policy";

export function saasEnabled() { return process.env.SAAS_ENABLED === "true"; }

export type DbTransaction = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
export async function provisionWorkspace(tx: DbTransaction, user: { id: number; name: string; kind?: WorkspaceKind; companyName?: string }, now = new Date()) {
  const [created] = await tx.insert(workspaces).values({ ownerUserId: user.id, name: user.companyName || user.name, kind: user.kind ?? "individual", createdAt: now.toISOString() }).$returningId();
  await tx.insert(workspaceMembers).values({ workspaceId: created.id, userId: user.id, role: "owner" });
  await tx.insert(workspaceSubscriptions).values({ workspaceId: created.id, status: "trialing", trialStartsAt: now.toISOString(), trialEndsAt: oneMonthAfter(now), updatedAt: now.toISOString() });
}

export async function listWorkspaces(userId: number) {
  return getDb().select({ id: workspaces.id, name: workspaces.name, kind: workspaces.kind, dataOwnerId: workspaces.ownerUserId, role: workspaceMembers.role,
    status: workspaceSubscriptions.status, trialStartsAt: workspaceSubscriptions.trialStartsAt, trialEndsAt: workspaceSubscriptions.trialEndsAt, paidUntil: workspaceSubscriptions.paidUntil })
    .from(workspaceMembers).innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .leftJoin(workspaceSubscriptions, eq(workspaces.id, workspaceSubscriptions.workspaceId))
    .where(eq(workspaceMembers.userId, userId));
}

export async function resolveWorkspace(request: Request, actor: AuthUser) {
  if (!saasEnabled()) throw new Error("SAAS_DISABLED");
  const db = getDb();
  const token = readSessionToken(request);
  const [selected] = await db.select().from(workspaceSelections).where(eq(workspaceSelections.sessionId, await tokenHash(token))).limit(1);
  const companies = await listWorkspaces(actor.id);
  const company = selected ? companies.find(row => row.id === selected.workspaceId) : companies.find(row => row.dataOwnerId === actor.id) ?? companies[0];
  // A revoked membership must never silently expose a different company's data.
  if (!company || !validRole(company.role) || (company.role === "owner" && company.dataOwnerId !== actor.id)) throw new Error("SAAS_WORKSPACE_UNAVAILABLE");
  const access = entitlement(company.status ? { ...company, status: company.status } : undefined);
  return { actor, dataOwnerId: company.dataOwnerId, summary: { id: company.id, name: company.name, kind: company.kind === "individual" ? "individual" : "company", role: company.role, entitlement: access } satisfies WorkspaceSummary };
}

export async function authorizeWorkspace(request: Request, actor: AuthUser, manageCompany = false) {
  const scope = await resolveWorkspace(request, actor);
  assertBusinessAccess(scope.summary.role, scope.summary.entitlement, request.method, new URL(request.url).pathname);
  if (manageCompany && !canManageTeam(scope.summary.role)) throw new Error("SAAS_FORBIDDEN");
  return scope;
}

export async function lockWorkspaceAuthority(tx: DbTransaction, workspaceId: number, actorId: number) {
  const [company] = await tx.select().from(workspaces).where(eq(workspaces.id, workspaceId)).for("update");
  const [member] = await tx.select().from(workspaceMembers).where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, actorId))).for("update");
  if (!company || !member || !validRole(member.role) || (member.role === "owner" && company.ownerUserId !== actorId)) throw new Error("SAAS_FORBIDDEN");
  return { company, role: member.role };
}

export async function selectWorkspace(tx: DbTransaction, request: Request, actorId: number, workspaceId: number) {
  const id = await tokenHash(readSessionToken(request));
  const [session] = await tx.select().from(sessions).where(and(eq(sessions.id, id), eq(sessions.userId, actorId))).for("update");
  if (!session || session.expiresAt <= new Date().toISOString()) throw new Error("SAAS_FORBIDDEN");
  await tx.insert(workspaceSelections).values({ sessionId: id, workspaceId }).onDuplicateKeyUpdate({ set: { workspaceId } });
}

export async function inviteDigest(token: string) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)));
  return Array.from(bytes, value => value.toString(16).padStart(2, "0")).join("");
}
