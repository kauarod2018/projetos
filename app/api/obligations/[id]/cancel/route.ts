import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { businessActivity, financialObligations, transactions, users } from "@/db/schema";
import { authenticatedUser, forbiddenMutationResponse, requestError, unauthorizedResponse } from "@/lib/api-security";
import { jsonResponse } from "@/lib/http";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const forbidden = forbiddenMutationResponse(request);
  if (forbidden) return forbidden;
  try {
    const user = await authenticatedUser(request);
    if (!user) return unauthorizedResponse();
    const { id } = await context.params;
    if (!/^[1-9]\d{0,9}$/.test(id)) return jsonResponse({ error: "Conta prevista não encontrada." }, { status: 404 });

    const result = await getDb().transaction(async tx => {
      await tx.select({ id: users.id }).from(users).where(eq(users.id, user.dataOwnerId)).for("update");
      const [obligation] = await tx.select().from(financialObligations)
        .where(and(eq(financialObligations.id, Number(id)), eq(financialObligations.userId, user.dataOwnerId))).for("update");
      if (!obligation) return { error: "Conta prevista não encontrada.", status: 404 };
      if (obligation.status === "cancelled") return { cancelled: true, replay: true };
      if (obligation.status !== "open") return { error: "Somente parcelas em aberto podem ser canceladas.", status: 409 };

      const [sum] = await tx.select({ amount: sql<number>`coalesce(sum(${transactions.amountCents}), 0)` }).from(transactions)
        .where(and(eq(transactions.userId, user.dataOwnerId), eq(transactions.obligationId, obligation.id), isNull(transactions.voidedAt), isNull(transactions.reversalOfId)));
      const paidCents = Number(sum?.amount ?? 0);
      if (paidCents >= obligation.amountCents) return { error: "Esta parcela já está totalmente paga e não pode ser cancelada.", status: 409 };
      const cancelledCents = Math.max(0, obligation.amountCents - paidCents);
      const now = new Date().toISOString();
      await tx.update(financialObligations).set({ status: "cancelled", version: sql`${financialObligations.version} + 1`, updatedAt: now })
        .where(and(eq(financialObligations.id, obligation.id), eq(financialObligations.userId, user.dataOwnerId), eq(financialObligations.status, "open")));
      await tx.insert(businessActivity).values({
        userId: user.dataOwnerId,
        action: "obligation.cancelled",
        entityType: "obligation",
        entityId: obligation.id,
        title: `Cancelou parcela ${obligation.installmentNumber}/${obligation.installmentCount}: ${obligation.description}`,
        details: JSON.stringify({ kind: "obligation.cancel", obligationId: obligation.id, paidCents, cancelledCents }),
        reversible: false,
      });
      return { cancelled: true, replay: false, paidCents, cancelledCents };
    });
    if ("error" in result) return jsonResponse({ error: result.error }, { status: result.status });
    return jsonResponse(result);
  } catch (error) {
    return requestError(error, "Não foi possível cancelar esta parcela.");
  }
}
