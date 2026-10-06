import { and, asc, eq, gt, lt } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { appointments, employeeAssignments, users, businessActivity, customers } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { forbiddenMutationResponse, readJson, requestError, unauthorizedResponse } from "@/lib/api-security";
import { employeeAuthority, ownEmployee } from "@/lib/employee-access";
import { employeeTransition } from "@/lib/employee-policy";
import { appointmentRangeSchema, moveDay } from "@/lib/appointments";
import { resolveWorkspace } from "@/lib/workspace";
import { jsonResponse } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const actor = await getCurrentUser(request); if (!actor) return unauthorizedResponse();
    const scope = await resolveWorkspace(request, actor);
    const query = new URL(request.url).searchParams;
    if ([...query.keys()].some(key => !["from", "to"].includes(key)) || query.getAll("from").length !== 1 || query.getAll("to").length !== 1) return jsonResponse({ error: "Período inválido." }, { status: 400 });
    const { from, to } = appointmentRangeSchema.parse({ from: query.get("from"), to: query.get("to") });
    const rows = await getDb().transaction(async tx => {
      const authority = await employeeAuthority(tx, scope.summary.id, actor.id, true);
      const employee = await ownEmployee(tx, scope.summary.id, actor.id);
      // Contact details only for assigned jobs; no customer notes, prices or financial IDs.
      return tx.select({ id: appointments.id, title: appointments.title, customerName: appointments.customerName, customerPhone: customers.phone, customerAddress: customers.address, startsAt: appointments.startsAt, endsAt: appointments.endsAt, status: appointments.status, version: appointments.version, instructions: employeeAssignments.instructions }).from(employeeAssignments)
        .innerJoin(appointments, and(eq(appointments.id, employeeAssignments.appointmentId), eq(appointments.employeeId, employeeAssignments.employeeId)))
        .leftJoin(customers, and(eq(customers.id, appointments.customerId), eq(customers.userId, authority.company.ownerUserId)))
        .where(and(eq(employeeAssignments.workspaceId, scope.summary.id), eq(employeeAssignments.employeeId, employee.id), eq(appointments.userId, authority.company.ownerUserId), lt(appointments.startsAt, moveDay(to, 1) + "T00:00"), gt(appointments.endsAt, from + "T00:00"))).orderBy(asc(appointments.startsAt)).limit(250);
    });
    return jsonResponse({ appointments: rows });
  } catch (error) { return requestError(error, "Não foi possível carregar seus atendimentos."); }
}

export async function PATCH(request: Request) {
  const forbidden = forbiddenMutationResponse(request); if (forbidden) return forbidden;
  try {
    const actor = await getCurrentUser(request); if (!actor) return unauthorizedResponse();
    const scope = await resolveWorkspace(request, actor);
    const body = z.object({ appointmentId: z.number().int().positive(), version: z.number().int().positive(), status: z.enum(["Em atendimento", "Concluído"]) }).strict().parse(await readJson(request, 1024));
    await getDb().transaction(async tx => {
      const authority = await employeeAuthority(tx, scope.summary.id, actor.id, true);
      await tx.select({ id: users.id }).from(users).where(eq(users.id, authority.company.ownerUserId)).for("update");
      const employee = await ownEmployee(tx, scope.summary.id, actor.id);
      const [assignment] = await tx.select().from(employeeAssignments).where(and(eq(employeeAssignments.workspaceId, scope.summary.id), eq(employeeAssignments.employeeId, employee.id), eq(employeeAssignments.appointmentId, body.appointmentId))).for("update");
      if (!assignment) throw new Error("SAAS_FORBIDDEN");
      const [appointment] = await tx.select().from(appointments).where(and(eq(appointments.id, body.appointmentId), eq(appointments.userId, authority.company.ownerUserId))).for("update");
      if (!appointment || appointment.employeeId !== employee.id) throw new Error("SAAS_FORBIDDEN");
      if (appointment.version !== body.version || !employeeTransition(appointment.status, body.status)) throw new Error("ASSIGNMENT_CONFLICT");
      await tx.update(appointments).set({ status: body.status, version: appointment.version + 1, updatedAt: new Date().toISOString() }).where(eq(appointments.id, appointment.id));
      await tx.insert(businessActivity).values({ userId: authority.company.ownerUserId, action: "employee.status", entityType: "appointment", entityId: appointment.id, title: "Funcionário atualizou o andamento do atendimento", details: JSON.stringify({ actorId: actor.id, employeeId: employee.id, status: body.status }), reversible: false });
    });
    return jsonResponse({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "ASSIGNMENT_CONFLICT") return jsonResponse({ error: "O atendimento mudou. Atualize a lista antes de continuar." }, { status: 409 });
    return requestError(error, "Não foi possível atualizar o atendimento.");
  }
}
