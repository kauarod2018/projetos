import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { businessActivity, financialObligations, transactions, users, quotes, quoteItems } from "@/db/schema";
import { authenticatedUser, forbiddenMutationResponse, readJson, requestError, unauthorizedResponse } from "@/lib/api-security";
import { jsonResponse } from "@/lib/http";
import { obligationPaymentSchema } from "@/lib/obligations";
import { receiptTotal } from "@/lib/quote-receipts";
import { brasiliaDay } from "@/lib/appointments";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const forbidden = forbiddenMutationResponse(request);
  if (forbidden) return forbidden;
  try {
    const user = await authenticatedUser(request);
    if (!user) return unauthorizedResponse();
    const { id } = await context.params;
    if (!/^[1-9]\d{0,9}$/.test(id)) return jsonResponse({ error: "Conta prevista não encontrada." }, { status: 404 });
    const body = obligationPaymentSchema.parse(await readJson(request, 2_048));
    if (body.transactionDate > brasiliaDay()) return jsonResponse({ error: "O recebimento não pode ter uma data futura." }, { status: 400 });
    const result = await getDb().transaction(async tx => {
      await tx.select({ id: users.id }).from(users).where(eq(users.id, user.dataOwnerId)).for("update");
      const [existingRequest] = await tx.select().from(transactions).where(and(eq(transactions.userId, user.dataOwnerId), eq(transactions.requestKey, body.requestKey))).for("update");
      if (existingRequest) {
        const matches = existingRequest.obligationId === Number(id) && existingRequest.amountCents === body.amountCents && existingRequest.transactionDate === body.transactionDate;
        return matches ? { transaction: existingRequest, remainingCents: null, replay: true } : { error: "Esta solicitação já foi salva com outros dados.", status: 409 };
      }
      const [obligation] = await tx.select().from(financialObligations).where(and(eq(financialObligations.id, Number(id)), eq(financialObligations.userId, user.dataOwnerId))).for("update");
      if (!obligation || obligation.status !== "open") return { error: "Esta conta prevista não está mais em aberto.", status: 409 };
      const [sum] = await tx.select({ amount: sql<number>`coalesce(sum(${transactions.amountCents}), 0)` }).from(transactions)
        .where(and(eq(transactions.userId, user.dataOwnerId), eq(transactions.obligationId, obligation.id), isNull(transactions.voidedAt), isNull(transactions.reversalOfId)));
      const paidCents = Number(sum?.amount ?? 0);
      const remainingCents = obligation.amountCents - paidCents;
      if (body.amountCents > remainingCents) return { error: "O valor informado ultrapassa o saldo desta conta prevista.", status: 400 };
      if (obligation.quoteId) {
        const [quote] = await tx.select().from(quotes).where(and(eq(quotes.userId, user.dataOwnerId), eq(quotes.id, obligation.quoteId))).for("update");
        const items = await tx.select({ quantity: quoteItems.quantity, unitPriceCents: quoteItems.unitPriceCents }).from(quoteItems).where(eq(quoteItems.quoteId, obligation.quoteId));
        const total = quote ? receiptTotal(items, quote.discountCents) : null;
        if (!quote || !["Aprovado", "Em andamento", "Finalizado"].includes(quote.status) || obligation.type !== "receivable" || total !== obligation.amountCents || paidCents !== 0 || body.amountCents !== total) return { error: "Nesta cobrança vinculada ao orçamento, registre o valor integral. Parcelas vinculadas ainda não estão disponíveis.", status: 409 };
        const prior = await tx.select({ id: transactions.id }).from(transactions).where(and(eq(transactions.userId, user.dataOwnerId), eq(transactions.quoteId, quote.id), isNull(transactions.voidedAt), isNull(transactions.reversalOfId)));
        if (prior.length) return { error: "Já existe um recebimento deste orçamento. Atualize as contas previstas.", status: 409 };
      }
      const [created] = await tx.insert(transactions).values({
        userId: user.dataOwnerId, obligationId: obligation.id, quoteId: obligation.quoteId ?? null, type: obligation.type === "receivable" ? "income" : "expense",
        category: "Outros", description: `${obligation.description} · parcela ${obligation.installmentNumber}/${obligation.installmentCount}`,
        amountCents: body.amountCents, transactionDate: body.transactionDate, requestKey: body.requestKey,
      }).$returningId();
      const newRemaining = remainingCents - body.amountCents;
      if (newRemaining === 0) await tx.update(financialObligations).set({ status: "paid", version: obligation.version + 1, updatedAt: new Date().toISOString() }).where(and(eq(financialObligations.id, obligation.id), eq(financialObligations.userId, user.dataOwnerId)));
      if (obligation.quoteId && newRemaining === 0) await tx.update(quotes).set({ status: "Pago", updatedAt: new Date().toISOString() }).where(and(eq(quotes.userId, user.dataOwnerId), eq(quotes.id, obligation.quoteId)));
      await tx.insert(businessActivity).values({ userId: user.dataOwnerId, action: "obligation.payment", entityType: "transaction", entityId: created.id, title: `Registrou ${obligation.type === "receivable" ? "recebimento" : "pagamento"} de R$ ${(body.amountCents / 100).toFixed(2).replace(".", ",")}`, details: JSON.stringify({ kind: "transaction.create", transactionId: created.id, obligationId: obligation.id }), reversible: !obligation.quoteId });
      const [transaction] = await tx.select().from(transactions).where(and(eq(transactions.id, created.id), eq(transactions.userId, user.dataOwnerId))).limit(1);
      return { transaction, remainingCents: newRemaining, replay: false };
    });
    if ("error" in result) return jsonResponse({ error: result.error }, { status: result.status });
    return jsonResponse({ transaction: result.transaction, remainingCents: result.remainingCents }, { status: result.replay ? 200 : 201 });
  } catch (error) { return requestError(error, "Não foi possível registrar o pagamento parcial."); }
}
