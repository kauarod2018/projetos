import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { users, workspaceEmployees, workspaceMembers, workspaceInvites } from "@/db/schema";
import { getCurrentUser, consumeRateLimit } from "@/lib/auth";
import { forbiddenMutationResponse, readJson, requestError, unauthorizedResponse } from "@/lib/api-security";
import { employeeAuthority } from "@/lib/employee-access";
import { employeeFields, employeeEdit } from "@/lib/employee-policy";
import { jsonResponse } from "@/lib/http";
import { resolveWorkspace } from "@/lib/workspace";

export async function GET(request: Request) {
  try {
    const actor = await getCurrentUser(request); if (!actor) return unauthorizedResponse();
    const scope = await resolveWorkspace(request, actor);
    const employees = await getDb().transaction(async tx => {
      const authority = await employeeAuthority(tx, scope.summary.id, actor.id, false, true, true);
      return authority.role === "reception" || authority.role === "editor"
        ? tx.select({ id: workspaceEmployees.id, name: workspaceEmployees.name, archived: workspaceEmployees.archived }).from(workspaceEmployees).where(eq(workspaceEmployees.workspaceId, scope.summary.id))
        : tx.select().from(workspaceEmployees).where(eq(workspaceEmployees.workspaceId, scope.summary.id));
    });
    return jsonResponse({ employees });
  } catch (error) { return requestError(error, "Não foi possível carregar os funcionários."); }
}

export async function POST(request: Request) { return write(request, false); }
export async function PATCH(request: Request) { return write(request, true); }
async function write(request: Request, editing: boolean) {
  const forbidden = forbiddenMutationResponse(request); if (forbidden) return forbidden;
  try {
    const actor = await getCurrentUser(request); if (!actor) return unauthorizedResponse();
    const scope = await resolveWorkspace(request, actor);
    const raw = await readJson(request, 4096);
    const edit = editing ? employeeEdit.parse(raw) : null;
    const body = edit ?? employeeFields.parse(raw);
    if (!await consumeRateLimit(`employees:${actor.id}`, 60, 3600)) return jsonResponse({ error: "Aguarde antes de tentar novamente." }, { status: 429 });
    const employee = await getDb().transaction(async tx => {
      const archiving = edit?.archived ?? false;
      await employeeAuthority(tx, scope.summary.id, actor.id, false, !archiving);
      const [existing] = edit ? await tx.select().from(workspaceEmployees).where(and(eq(workspaceEmployees.workspaceId, scope.summary.id), eq(workspaceEmployees.id, edit.id))).for("update") : [];
      if (edit && (!existing || existing.version !== edit.version)) throw new Error("EMPLOYEE_CONFLICT");
      if (existing && existing.email !== body.email) throw new Error("EMPLOYEE_EMAIL_LINKED");
      const [duplicate] = await tx.select().from(workspaceEmployees).where(and(eq(workspaceEmployees.workspaceId, scope.summary.id), eq(workspaceEmployees.email, body.email)));
      if (duplicate && duplicate.id !== existing?.id) throw new Error("EMPLOYEE_DUPLICATE");
      const [member] = await tx.select({ userId: users.id, role: workspaceMembers.role }).from(workspaceMembers).innerJoin(users, eq(users.id, workspaceMembers.userId)).where(and(eq(workspaceMembers.workspaceId, scope.summary.id), eq(users.email, body.email)));
      if (member && member.role !== "employee") throw new Error("EMPLOYEE_GENERAL_ACCESS");
      const values = { name: body.name, email: body.email, phone: body.phone, jobTitle: body.jobTitle, availability: body.availability === undefined ? existing?.availability ?? null : body.availability === null ? null : JSON.stringify(body.availability), userId: existing?.userId ?? member?.userId ?? null, archived: edit?.archived ?? false, updatedAt: new Date().toISOString() };
      let id = existing?.id;
      if (id) await tx.update(workspaceEmployees).set({ ...values, version: existing.version + 1 }).where(eq(workspaceEmployees.id, id));
      else [ { id } ] = await tx.insert(workspaceEmployees).values({ ...values, workspaceId: scope.summary.id }).$returningId();
      if (archiving) {
        if (values.userId) await tx.delete(workspaceMembers).where(and(eq(workspaceMembers.workspaceId, scope.summary.id), eq(workspaceMembers.userId, values.userId), eq(workspaceMembers.role, "employee")));
        await tx.update(workspaceEmployees).set({ userId: null }).where(eq(workspaceEmployees.id, id!));
        await tx.update(workspaceInvites).set({ revokedAt: new Date().toISOString() }).where(and(eq(workspaceInvites.workspaceId, scope.summary.id), eq(workspaceInvites.email, body.email), isNull(workspaceInvites.acceptedAt), isNull(workspaceInvites.revokedAt)));
      }
      const [saved] = await tx.select().from(workspaceEmployees).where(eq(workspaceEmployees.id, id!));
      return saved;
    });
    return jsonResponse({ employee }, { status: editing ? 200 : 201 });
  } catch (error) {
    const messages: Record<string, string> = { EMPLOYEE_CONFLICT: "O cadastro mudou. Atualize a lista antes de editar.", EMPLOYEE_EMAIL_LINKED: "O e-mail identifica este cadastro. Para outra pessoa, crie um novo funcionário.", EMPLOYEE_DUPLICATE: "Já existe um funcionário com este e-mail, inclusive nos arquivados.", EMPLOYEE_GENERAL_ACCESS: "Esta conta tem acesso geral à empresa. Ajuste o acesso antes de vinculá-la como funcionário." };
    const message = error instanceof Error ? messages[error.message] : undefined;
    return message ? jsonResponse({ error: message }, { status: 409 }) : requestError(error, "Não foi possível salvar o funcionário.");
  }
}
