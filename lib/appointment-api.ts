import { and, asc, eq, gt, lt, ne } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb } from "@/db";
import { appointmentSeries, appointments, businessActivity, customers, services, users, quotes, employeeAssignments, workspaceSubscriptions } from "@/db/schema";
import { authenticatedUser, forbiddenMutationResponse, readJson, requestError, unauthorizedResponse } from "@/lib/api-security";
import { appointmentCreateSchema, appointmentEditSchema, appointmentStatusSchema, endOfAppointment, recurringStart } from "@/lib/appointments";
import { jsonResponse } from "@/lib/http";
import { serviceId } from "@/lib/service-data";
import { assertAvailable } from "@/lib/scheduling";
import { lockWorkspaceAuthority } from "@/lib/workspace";
import { canSchedule, entitlement } from "@/lib/saas-policy";

export const appointmentFields = {
  id: appointments.id, customerId: appointments.customerId, serviceId: appointments.serviceId,
  customerName: appointments.customerName, title: appointments.title, startsAt: appointments.startsAt,
  endsAt: appointments.endsAt, durationMinutes: appointments.durationMinutes, notes: appointments.notes,
  status: appointments.status, version: appointments.version, seriesId: appointments.seriesId, createdAt: appointments.createdAt, updatedAt: appointments.updatedAt,
  employeeId: appointments.employeeId, quoteId: appointments.quoteId,
};
const failure = (error: string, status = 409) => ({ body: { error }, status });

export async function writeAppointment(request: Request, mode: "create" | "edit" | "status", rawId?: string) {
  const forbidden = forbiddenMutationResponse(request);
  if (forbidden) return forbidden;
  try {
    const user = await authenticatedUser(request);
    if (!user) return unauthorizedResponse();
    const id = mode === "create" ? null : serviceId(rawId ?? "");
    if (mode !== "create" && !id) return jsonResponse({ error: "Compromisso não encontrado." }, { status: 404 });
    const raw = await readJson(request, 8192);
    const body = mode === "create" ? appointmentCreateSchema.parse(raw) : mode === "edit" ? appointmentEditSchema.parse(raw) : appointmentStatusSchema.parse(raw);
    const result = await getDb().transaction(async tx => {
      const workspaceId = user.workspace?.kind === "company" ? user.workspace.id : null;
      if (user.workspace) {
        const authority = await lockWorkspaceAuthority(tx, user.workspace.id, user.id);
        if (!canSchedule(authority.role)) throw new Error("SAAS_FORBIDDEN");
        const [subscription] = await tx.select().from(workspaceSubscriptions).where(eq(workspaceSubscriptions.workspaceId, user.workspace.id));
        if (!entitlement(subscription).allowed) throw new Error("SAAS_SUBSCRIPTION_REQUIRED");
      }
      // Serialize schedule changes for one owner, including empty-calendar races.
      await tx.select({ id: users.id }).from(users).where(eq(users.id, user.dataOwnerId)).for("update");
      const [existing] = await tx.select(appointmentFields).from(appointments).where(and(eq(appointments.userId, user.dataOwnerId),
        "requestKey" in body ? eq(appointments.requestKey, body.requestKey) : eq(appointments.id, id!))).for("update");
      if ("requestKey" in body && existing) {
        const matches = existing.customerId === body.customerId && existing.serviceId === body.serviceId && existing.title === body.title && existing.startsAt === body.startsAt && existing.durationMinutes === body.durationMinutes && existing.notes === body.notes && (existing.employeeId ?? null) === (body.employeeId ?? null) && (existing.quoteId ?? null) === (body.quoteId ?? null);
        if (!matches) return failure("Esta solicitação já foi salva. Atualize a agenda.");
        const seriesRows = existing.seriesId ? await tx.select().from(appointmentSeries).where(and(eq(appointmentSeries.id, existing.seriesId), eq(appointmentSeries.userId, user.dataOwnerId))).for("update") : [];
        const series = seriesRows[0];
        let seriesMatches: boolean = body.recurrence === "none" && !series;
        if (body.recurrence !== "none" && series && existing.seriesId && series.recurrence === body.recurrence) {
          const occurrences = await tx.select({ id: appointments.id }).from(appointments).where(and(eq(appointments.userId, user.dataOwnerId), eq(appointments.seriesId, existing.seriesId)));
          seriesMatches = occurrences.length === body.recurrenceCount;
        }
        if (!seriesMatches) return failure("Esta solicitação já foi salva com outra recorrência. Atualize a agenda.");
        const seriesCount = existing.seriesId ? (await tx.select({ id: appointments.id }).from(appointments).where(and(eq(appointments.userId, user.dataOwnerId), eq(appointments.seriesId, existing.seriesId)))).length : 1;
        return { body: { appointment: existing, seriesCount }, status: 201 };
      }
      if (mode !== "create" && !existing) return failure("Compromisso não encontrado.", 404);
      if ("version" in body && existing?.version !== body.version) return failure("Este compromisso mudou em outra aba. Atualize a agenda antes de editar.");
      if (mode === "edit" && ["Concluído", "Cancelado"].includes(existing.status)) return failure("Reabra o compromisso antes de remarcar.");
      const employeeId = "employeeId" in body ? body.employeeId ?? null : existing?.employeeId ?? null;
      const quoteId = "quoteId" in body ? body.quoteId ?? null : existing?.quoteId ?? null;
      if (employeeId !== null && workspaceId === null) throw new Error("SAAS_FORBIDDEN");
      if (quoteId !== null && "customerId" in body) {
        if (user.workspace?.role === "reception" && (mode === "create" || existing.customerId !== body.customerId)) throw new Error("SAAS_FORBIDDEN");
        const [quote] = await tx.select().from(quotes).where(and(eq(quotes.userId, user.dataOwnerId), eq(quotes.id, quoteId))).for("update");
        if (!quote || quote.customerId !== body.customerId || !["Aprovado", "Em andamento", "Finalizado", "Pago"].includes(quote.status)) return failure("Escolha um orçamento aprovado e mantenha o cliente do orçamento.", 400);
      }
      let customerName = existing?.customerName ?? "";
      if ("customerId" in body) {
        const [customer] = await tx.select({ name: customers.name }).from(customers).where(and(eq(customers.id, body.customerId), eq(customers.userId, user.dataOwnerId))).for("update");
        if (!customer) return failure("Cliente indisponível. Escolha um cliente da sua conta.", 400);
        customerName = customer.name;
        if (body.serviceId !== null) {
          const [service] = await tx.select({ archived: services.archived }).from(services).where(and(eq(services.id, body.serviceId), eq(services.userId, user.dataOwnerId))).for("update");
          if (!service || (service.archived && existing?.serviceId !== body.serviceId)) return failure("Serviço indisponível. Escolha outro serviço.", 400);
        }
      }
      const values = "startsAt" in body ? { customerId: body.customerId, serviceId: body.serviceId, customerName, title: body.title, startsAt: body.startsAt, endsAt: endOfAppointment(body.startsAt, body.durationMinutes), durationMinutes: body.durationMinutes, notes: body.notes, employeeId, quoteId, status: existing?.status ?? "Agendado" } : { ...existing, employeeId, quoteId, status: body.status };
      if (values.status !== "Cancelado" && !(mode === "status" && values.status === "Concluído")) {
        await assertAvailable(tx, user.dataOwnerId, workspaceId, employeeId, values.startsAt, values.endsAt, existing?.id);
      }
      if (mode === "create" && "requestKey" in body) {
        const starts = body.recurrence === "none" ? [body.startsAt] : Array.from({ length: body.recurrenceCount }, (_, occurrence) => recurringStart(body.startsAt, body.recurrence as "weekly" | "biweekly" | "monthly", occurrence));
        if (starts.at(-1)!.slice(0, 10) > "2099-12-31") return failure("A recorrência ultrapassa o limite de datas permitido.", 400);
        const endDate = starts.at(-1)!.slice(0, 10);
        const planned = starts.map(startsAt => ({ startsAt, endsAt: endOfAppointment(startsAt, body.durationMinutes) }));
        for (const item of planned) await assertAvailable(tx, user.dataOwnerId, workspaceId, employeeId, item.startsAt, item.endsAt);
        if (planned.some((item, i) => planned.slice(0, i).some(previous => item.startsAt < previous.endsAt && item.endsAt > previous.startsAt))) return failure("Há um conflito de horário em uma das ocorrências. Nenhum compromisso foi criado.");
        let seriesId: number | null = null;
        if (body.recurrence !== "none") {
          const inserted = await tx.insert(appointmentSeries).values({ userId: user.dataOwnerId, recurrence: body.recurrence, intervalCount: body.recurrence === "biweekly" ? 2 : 1, startsOn: starts[0].slice(0, 10), endsOn: starts.at(-1)!.slice(0, 10) });
          seriesId = Number(inserted[0].insertId);
        }
        await tx.insert(appointments).values(starts.map((startsAt, index) => ({ ...values, startsAt, endsAt: endOfAppointment(startsAt, body.durationMinutes), userId: user.dataOwnerId, requestKey: index === 0 ? body.requestKey : randomUUID(), seriesId, occurrenceKey: seriesId ? `${seriesId}:${startsAt}` : null })));
        const [appointment] = await tx.select(appointmentFields).from(appointments).where(and(eq(appointments.userId, user.dataOwnerId), eq(appointments.requestKey, body.requestKey))).for("update");
        const seriesIds = seriesId ? (await tx.select({ id: appointments.id, version: appointments.version }).from(appointments).where(and(eq(appointments.userId, user.dataOwnerId), eq(appointments.seriesId, seriesId)))).map(row => ({ id: row.id, version: row.version })) : [{ id: appointment.id, version: appointment.version }];
        if (employeeId !== null && workspaceId !== null) await tx.insert(employeeAssignments).values(seriesIds.map(row => ({ appointmentId: row.id, workspaceId, employeeId, instructions: "", assignedBy: user.id })));
        await tx.insert(businessActivity).values({ userId: user.dataOwnerId, action: "appointment.created", entityType: "appointment", entityId: appointment.id, title: `Criou ${starts.length} atendimento${starts.length === 1 ? "" : "s"} para ${appointment.customerName}`, details: JSON.stringify({ kind: "appointment.series.create", appointments: seriesIds }), reversible: true });
        return { body: { appointment, seriesCount: starts.length }, status: 201 };
      }
      const patch = { ...values, version: existing.version + 1, updatedAt: new Date().toISOString() };
      await tx.update(appointments).set(patch).where(and(eq(appointments.userId, user.dataOwnerId), eq(appointments.id, existing.id)));
      if (mode === "edit" && workspaceId !== null && employeeId !== (existing.employeeId ?? null)) {
        await tx.delete(employeeAssignments).where(and(eq(employeeAssignments.workspaceId, workspaceId), eq(employeeAssignments.appointmentId, existing.id)));
        if (employeeId !== null) await tx.insert(employeeAssignments).values({ appointmentId: existing.id, workspaceId, employeeId, instructions: "", assignedBy: user.id });
      }
      await tx.insert(businessActivity).values({ userId: user.dataOwnerId, action: mode === "edit" ? "appointment.edited" : "appointment.status", entityType: "appointment", entityId: existing.id, title: mode === "edit" ? `Atualizou atendimento de ${existing.customerName}` : `Alterou atendimento de ${existing.customerName} para ${values.status}`, details: JSON.stringify({ appointmentId: existing.id }), reversible: false });
      return { body: { appointment: { ...existing, ...patch } }, status: 200 };
    });
    return jsonResponse(result.body, { status: result.status });
  } catch (error) { return requestError(error, "Não foi possível salvar o compromisso. Tente novamente."); }
}
