import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { appointments, businessActivity, financialObligations, transactions, users } from "@/db/schema";
import { authenticatedUser, forbiddenMutationResponse, requestError, unauthorizedResponse } from "@/lib/api-security";
import { jsonResponse } from "@/lib/http";

type Context = { params: Promise<{ id: string }> };
type UndoDetails = { kind?: string; transactionId?: number; obligationId?: number | null; appointmentId?: number; expectedVersion?: number; appointments?: Array<{ id: number; version: number }> };

export async function POST(request: Request, context: Context) {
  const forbidden = forbiddenMutationResponse(request);
  if (forbidden) return forbidden;
  try {
    const user = await authenticatedUser(request);
    if (!user) return unauthorizedResponse();
    const { id } = await context.params;
    if (!/^[1-9]\d{0,9}$/.test(id)) return jsonResponse({ error: "Ação não encontrada." }, { status: 404 });
    const result = await getDb().transaction(async tx => {
      await tx.select({ id: users.id }).from(users).where(eq(users.id, user.dataOwnerId)).for("update");
      const [activity] = await tx.select().from(businessActivity).where(and(eq(businessActivity.id, Number(id)), eq(businessActivity.userId, user.dataOwnerId))).for("update");
      if (!activity) return { error: "Ação não encontrada.", status: 404 };
      if (activity.undoneAt) return { undone: true };
      if (!activity.reversible || !activity.details) return { error: "Esta ação não pode ser desfeita com segurança.", status: 409 };
      let details: UndoDetails;
      try { details = JSON.parse(activity.details) as UndoDetails; } catch { return { error: "Não foi possível verificar os dados da ação.", status: 409 }; }
      const now = new Date().toISOString();
      if (details.kind === "transaction.create" && details.transactionId) {
        const [movement] = await tx.select().from(transactions).where(and(eq(transactions.id, details.transactionId), eq(transactions.userId, user.dataOwnerId))).for("update");
        if (!movement) return { error: "O lançamento original não está disponível.", status: 409 };
        if (movement.quoteId) return { error: "Recebimentos de orçamento não podem ser desfeitos por aqui. Corrija o orçamento pela tela dele.", status: 409 };
        if (movement.voidedAt) return { error: "Este lançamento já foi estornado.", status: 409 };
        await tx.update(transactions).set({ voidedAt: now }).where(and(eq(transactions.id, movement.id), eq(transactions.userId, user.dataOwnerId), isNull(transactions.voidedAt)));
        await tx.insert(transactions).values({ userId: user.dataOwnerId, type: movement.type === "income" ? "expense" : "income", category: "Outros", description: `Estorno interno do lançamento #${movement.id}`, amountCents: movement.amountCents, transactionDate: movement.transactionDate, reversalOfId: movement.id, obligationId: movement.obligationId });
        if (details.obligationId) await tx.update(financialObligations).set({ status: "open", version: sql`${financialObligations.version} + 1`, updatedAt: now }).where(and(eq(financialObligations.id, details.obligationId), eq(financialObligations.userId, user.dataOwnerId)));
      } else if (details.kind === "appointment.series.create" && details.appointments?.length) {
        const ids = details.appointments.map(item => item.id);
        const selected = await tx.select().from(appointments).where(and(eq(appointments.userId, user.dataOwnerId), inArray(appointments.id, ids))).for("update");
        if (selected.length !== ids.length || selected.some(row => row.status !== "Agendado" || row.version !== details.appointments?.find(item => item.id === row.id)?.version)) return { error: "Um ou mais compromissos foram alterados depois desta ação. Atualize a agenda; não fiz mudanças.", status: 409 };
        for (const appointment of selected) await tx.update(appointments).set({ status: "Cancelado", version: appointment.version + 1, updatedAt: now }).where(and(eq(appointments.id, appointment.id), eq(appointments.userId, user.dataOwnerId)));
      } else if (details.kind === "appointment.create" && details.appointmentId && details.expectedVersion) {
        const [appointment] = await tx.select().from(appointments).where(and(eq(appointments.id, details.appointmentId), eq(appointments.userId, user.dataOwnerId))).for("update");
        if (!appointment || appointment.version !== details.expectedVersion || appointment.status !== "Agendado") return { error: "O compromisso foi alterado depois desta ação. Atualize a agenda; não fiz mudanças.", status: 409 };
        await tx.update(appointments).set({ status: "Cancelado", version: appointment.version + 1, updatedAt: now }).where(and(eq(appointments.id, appointment.id), eq(appointments.userId, user.dataOwnerId)));
      } else return { error: "Esta ação não tem uma reversão disponível.", status: 409 };

      await tx.update(businessActivity).set({ undoneAt: now, reversible: false }).where(and(eq(businessActivity.id, activity.id), eq(businessActivity.userId, user.dataOwnerId)));
      await tx.insert(businessActivity).values({ userId: user.dataOwnerId, action: "activity.undone", entityType: activity.entityType, entityId: activity.entityId, title: `Desfez: ${activity.title}`, details: JSON.stringify({ activityId: activity.id }), reversible: false });
      return { undone: true };
    });
    if ("error" in result) return jsonResponse({ error: result.error }, { status: result.status });
    return jsonResponse(result);
  } catch (error) { return requestError(error, "Não foi possível desfazer esta ação."); }
}
