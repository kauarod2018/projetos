import { and, asc, eq, gt, lt, ne } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { appointments, employeeAbsences, users, workspaceEmployees, businessActivity } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { forbiddenMutationResponse, readJson, requestError, unauthorizedResponse } from "@/lib/api-security";
import { employeeAuthority } from "@/lib/employee-access";
import { absenceSchema } from "@/lib/scheduling-policy";
import { resolveWorkspace } from "@/lib/workspace";
import { jsonResponse } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const actor = await getCurrentUser(request); if (!actor) return unauthorizedResponse();
    const scope = await resolveWorkspace(request, actor);
    const rows = await getDb().transaction(async tx => {
      const authority = await employeeAuthority(tx, scope.summary.id, actor.id, false, true, true);
      return tx.select({ id: employeeAbsences.id, employeeId: employeeAbsences.employeeId, startsAt: employeeAbsences.startsAt, endsAt: employeeAbsences.endsAt, ...(authority.role === "reception" ? {} : { reason: employeeAbsences.reason }) }).from(employeeAbsences).where(eq(employeeAbsences.workspaceId, scope.summary.id)).orderBy(asc(employeeAbsences.startsAt)).limit(250);
    });
    return jsonResponse({ absences: rows });
  } catch (error) { return requestError(error, "Não foi possível carregar as ausências."); }
}
export async function POST(request: Request) { return write(request, false); }
export async function DELETE(request: Request) { return write(request, true); }
async function write(request: Request, removing: boolean) {
  const forbidden = forbiddenMutationResponse(request); if (forbidden) return forbidden;
  try {
    const actor = await getCurrentUser(request); if (!actor) return unauthorizedResponse();
    const scope = await resolveWorkspace(request, actor);
    const body = removing ? z.object({ id: z.number().int().positive() }).strict().parse(await readJson(request, 1024)) : absenceSchema.parse(await readJson(request, 2048));
    await getDb().transaction(async tx => {
      const authority = await employeeAuthority(tx, scope.summary.id, actor.id);
      await tx.select({ id: users.id }).from(users).where(eq(users.id, authority.company.ownerUserId)).for("update");
      if ("id" in body) {
        await tx.delete(employeeAbsences).where(and(eq(employeeAbsences.workspaceId, scope.summary.id), eq(employeeAbsences.id, body.id)));
      } else {
        const [employee] = await tx.select().from(workspaceEmployees).where(and(eq(workspaceEmployees.workspaceId, scope.summary.id), eq(workspaceEmployees.id, body.employeeId), eq(workspaceEmployees.archived, false))).for("update");
        if (!employee) throw new Error("SAAS_FORBIDDEN");
        const conflicts = await tx.select({ id: appointments.id }).from(appointments).where(and(eq(appointments.userId, authority.company.ownerUserId), eq(appointments.employeeId, employee.id), ne(appointments.status, "Cancelado"), ne(appointments.status, "Concluído"), lt(appointments.startsAt, body.endsAt), gt(appointments.endsAt, body.startsAt))).for("update");
        if (conflicts.length) throw new Error("SCHEDULE_CONFLICT");
        await tx.insert(employeeAbsences).values({ ...body, workspaceId: scope.summary.id });
      }
      await tx.insert(businessActivity).values({ userId: authority.company.ownerUserId, action: "employee.availability", entityType: "employee", title: removing ? "Removeu uma ausência da equipe" : "Registrou uma ausência da equipe", details: JSON.stringify({ actorId: actor.id }), reversible: false });
    });
    return jsonResponse({ ok: true });
  } catch (error) { return requestError(error, "Não foi possível salvar a ausência."); }
}
