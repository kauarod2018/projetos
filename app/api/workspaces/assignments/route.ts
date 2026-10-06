import { and, asc, eq, gt, lt } from "drizzle-orm";
import { getDb } from "@/db";
import { appointments, employeeAssignments, workspaceEmployees, users, businessActivity } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { forbiddenMutationResponse, readJson, requestError, unauthorizedResponse } from "@/lib/api-security";
import { employeeAuthority } from "@/lib/employee-access";
import { assignmentInput } from "@/lib/employee-policy";
import { appointmentRangeSchema, moveDay } from "@/lib/appointments";
import { resolveWorkspace } from "@/lib/workspace";
import { jsonResponse } from "@/lib/http";
import { assertAvailable } from "@/lib/scheduling";

export async function GET(request: Request) {
  try {
    const actor = await getCurrentUser(request); if (!actor) return unauthorizedResponse();
    const scope = await resolveWorkspace(request, actor);
    const query = Object.fromEntries(new URL(request.url).searchParams);
    const { from, to } = appointmentRangeSchema.parse(query);
    const rows = await getDb().transaction(async tx => {
      await employeeAuthority(tx, scope.summary.id, actor.id, false, true, true);
      return tx.select({ id: appointments.id, title: appointments.title, customerName: appointments.customerName, startsAt: appointments.startsAt, endsAt: appointments.endsAt, status: appointments.status, version: appointments.version, employeeId: employeeAssignments.employeeId, instructions: employeeAssignments.instructions }).from(appointments)
        .leftJoin(employeeAssignments, and(eq(employeeAssignments.appointmentId, appointments.id), eq(employeeAssignments.workspaceId, scope.summary.id)))
        .where(and(eq(appointments.userId, scope.dataOwnerId), lt(appointments.startsAt, moveDay(to, 1) + "T00:00"), gt(appointments.endsAt, from + "T00:00"))).orderBy(asc(appointments.startsAt)).limit(250);
    });
    return jsonResponse({ appointments: rows });
  } catch (error) { return requestError(error, "Não foi possível carregar os atendimentos."); }
}

export async function POST(request: Request) {
  const forbidden = forbiddenMutationResponse(request); if (forbidden) return forbidden;
  try {
    const actor = await getCurrentUser(request); if (!actor) return unauthorizedResponse();
    const scope = await resolveWorkspace(request, actor);
    const body = assignmentInput.parse(await readJson(request, 4096));
    await getDb().transaction(async tx => {
      const authority = await employeeAuthority(tx, scope.summary.id, actor.id, false, true, true);
      await tx.select({ id: users.id }).from(users).where(eq(users.id, authority.company.ownerUserId)).for("update");
      if (body.employeeId !== null) {
        const [employee] = await tx.select().from(workspaceEmployees).where(and(eq(workspaceEmployees.workspaceId, scope.summary.id), eq(workspaceEmployees.id, body.employeeId), eq(workspaceEmployees.archived, false))).for("update");
        if (!employee) throw new Error("SAAS_FORBIDDEN");
      }
      const [appointment] = await tx.select().from(appointments).where(and(eq(appointments.userId, authority.company.ownerUserId), eq(appointments.id, body.appointmentId))).for("update");
      if (!appointment) throw new Error("SAAS_FORBIDDEN");
      if (appointment.version !== body.version || ["Concluído", "Cancelado"].includes(appointment.status)) throw new Error("ASSIGNMENT_CONFLICT");
      await assertAvailable(tx, authority.company.ownerUserId, scope.summary.id, body.employeeId, appointment.startsAt, appointment.endsAt, appointment.id);
      await tx.delete(employeeAssignments).where(and(eq(employeeAssignments.appointmentId, body.appointmentId), eq(employeeAssignments.workspaceId, scope.summary.id)));
      if (body.employeeId !== null) await tx.insert(employeeAssignments).values({ appointmentId: body.appointmentId, workspaceId: scope.summary.id, employeeId: body.employeeId, instructions: body.instructions, assignedBy: actor.id });
      await tx.update(appointments).set({ employeeId: body.employeeId, version: appointment.version + 1, updatedAt: new Date().toISOString() }).where(eq(appointments.id, appointment.id));
      await tx.insert(businessActivity).values({ userId: authority.company.ownerUserId, action: "employee.assignment", entityType: "appointment", entityId: appointment.id, title: "Atualizou o responsável pelo atendimento", details: JSON.stringify({ actorId: actor.id, employeeId: body.employeeId }), reversible: false });
    });
    return jsonResponse({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "ASSIGNMENT_CONFLICT") return jsonResponse({ error: "O atendimento mudou ou já foi encerrado. Atualize a lista." }, { status: 409 });
    return requestError(error, "Não foi possível distribuir o atendimento.");
  }
}
