import { and, asc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { appointments, businessActivity, financialObligations, quoteItems, quotes, transactions, users } from "@/db/schema";
import { authenticatedUser, forbiddenMutationResponse, readJson, requestError, unauthorizedResponse } from "@/lib/api-security";
import { jsonResponse } from "@/lib/http";
import { serviceId } from "@/lib/service-data";
import { receiptTotal } from "@/lib/quote-receipts";
import { validDay } from "@/lib/appointments";
type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  try {
    const user = await authenticatedUser(request); if (!user) return unauthorizedResponse();
    const id = serviceId((await context.params).id); if (!id) return jsonResponse({ error: "Orçamento indisponível." }, { status: 404 });
    const [quote] = await getDb().select({ id: quotes.id }).from(quotes).where(and(eq(quotes.userId, user.dataOwnerId), eq(quotes.id, id)));
    if (!quote) return jsonResponse({ error: "Orçamento indisponível." }, { status: 404 });
    const visits = await getDb().select({ id: appointments.id, title: appointments.title, startsAt: appointments.startsAt, status: appointments.status }).from(appointments).where(and(eq(appointments.userId, user.dataOwnerId), eq(appointments.quoteId, id))).orderBy(asc(appointments.startsAt));
    const charges = await getDb().select({ id: financialObligations.id, dueDate: financialObligations.dueDate, status: financialObligations.status, amountCents: financialObligations.amountCents }).from(financialObligations).where(and(eq(financialObligations.userId, user.dataOwnerId), eq(financialObligations.quoteId, id)));
    return jsonResponse({ appointments: visits, charges });
  } catch (error) { return requestError(error, "Não foi possível carregar o acompanhamento."); }
}
export async function POST(request: Request, context: Context) {
  const forbidden = forbiddenMutationResponse(request); if (forbidden) return forbidden;
  try {
    const user = await authenticatedUser(request); if (!user) return unauthorizedResponse();
    const id = serviceId((await context.params).id); if (!id) return jsonResponse({ error: "Orçamento indisponível." }, { status: 404 });
    const body = z.object({ dueDate: z.string().refine(validDay), expectedUpdatedAt: z.string().max(24).min(10) }).strict().parse(await readJson(request, 1024));
    const result = await getDb().transaction(async tx => {
      await tx.select({ id: users.id }).from(users).where(eq(users.id, user.dataOwnerId)).for("update");
      const [quote] = await tx.select().from(quotes).where(and(eq(quotes.userId, user.dataOwnerId), eq(quotes.id, id))).for("update");
      if (!quote || !["Aprovado", "Em andamento", "Finalizado"].includes(quote.status)) return { error: "Aprove o orçamento antes de criar a cobrança.", status: 409 };
      const existing = await tx.select().from(financialObligations).where(and(eq(financialObligations.userId, user.dataOwnerId), eq(financialObligations.quoteId, id))).for("update");
      if (existing.length) return { error: "Este orçamento já tem uma cobrança. Consulte as contas previstas; não criei outra.", status: 409 };
      if (quote.updatedAt !== body.expectedUpdatedAt) return { error: "O orçamento mudou. Atualize antes de criar a cobrança.", status: 409 };
      const receipts = await tx.select({ id: transactions.id }).from(transactions).where(and(eq(transactions.userId, user.dataOwnerId), eq(transactions.quoteId, id), isNull(transactions.voidedAt), isNull(transactions.reversalOfId))).for("update");
      if (receipts.length) return { error: "Já existe um recebimento para este orçamento.", status: 409 };
      const items = await tx.select({ quantity: quoteItems.quantity, unitPriceCents: quoteItems.unitPriceCents }).from(quoteItems).where(eq(quoteItems.quoteId, id));
      const total = receiptTotal(items, quote.discountCents);
      if (total === null) return { error: "O orçamento precisa ter um valor válido maior que zero.", status: 400 };
      const [created] = await tx.insert(financialObligations).values({ userId: user.dataOwnerId, quoteId: id, customerId: quote.customerId, type: "receivable", description: `Serviço do orçamento #${id}`, amountCents: total, dueDate: body.dueDate, installmentNumber: 1, installmentCount: 1, status: "open" }).$returningId();
      await tx.insert(businessActivity).values({ userId: user.dataOwnerId, action: "quote.charge", entityType: "obligation", entityId: created.id, title: `Criou cobrança vinculada ao orçamento #${id}`, details: JSON.stringify({ quoteId: id }), reversible: false });
      return { id: created.id, status: 201 };
    });
    return jsonResponse("error" in result ? { error: result.error } : { obligationId: result.id }, { status: result.status });
  } catch (error) { return requestError(error, "Não foi possível criar a cobrança."); }
}
