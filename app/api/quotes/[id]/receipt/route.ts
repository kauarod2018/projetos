import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { businessActivity, quotes, quoteItems, transactions, users, receiptDateCorrections, financialObligations } from "@/db/schema";
import { authenticatedUser, forbiddenMutationResponse, readJson, requestError, unauthorizedResponse } from "@/lib/api-security";
import { jsonResponse } from "@/lib/http";
import { receiptSchema, receiptTotal, receiptCorrectionSchema } from "@/lib/quote-receipts";
import { brasiliaDay } from "@/lib/appointments";

type Context = { params: Promise<{ id: string }> };
const fields = { id: transactions.id, quoteId: transactions.quoteId, receiptVersion: transactions.receiptVersion, type: transactions.type,
  description: transactions.description, amountCents: transactions.amountCents,
  transactionDate: transactions.transactionDate, createdAt: transactions.createdAt };
const validId = (id: string) => /^[1-9]\d*$/.test(id) && Number(id) <= 4294967295;

export async function GET(request: Request, context: Context) {
  try {
    const user = await authenticatedUser(request);
    if (!user) return unauthorizedResponse();
    const { id } = await context.params;
    if (!validId(id)) return jsonResponse({ error: "Orçamento não encontrado." }, { status: 404 });
    const db = getDb();
    const [quote] = await db.select({ id: quotes.id }).from(quotes).where(and(eq(quotes.id, Number(id)), eq(quotes.userId, user.dataOwnerId))).limit(1);
    if (!quote) return jsonResponse({ error: "Orçamento não encontrado." }, { status: 404 });
    const [receipt] = await db.select(fields).from(transactions).where(and(eq(transactions.quoteId, Number(id)), eq(transactions.userId, user.dataOwnerId), isNull(transactions.voidedAt), isNull(transactions.reversalOfId))).limit(1);
    const corrections = receipt ? await db.select({ id: receiptDateCorrections.id, version: receiptDateCorrections.version, previousDate: receiptDateCorrections.previousDate, correctedDate: receiptDateCorrections.correctedDate, reason: receiptDateCorrections.reason, createdAt: receiptDateCorrections.createdAt })
      .from(receiptDateCorrections).where(and(eq(receiptDateCorrections.userId, user.dataOwnerId), eq(receiptDateCorrections.transactionId, receipt.id))).orderBy(desc(receiptDateCorrections.id)).limit(20) : [];
    return jsonResponse({ receipt: receipt ?? null, corrections });
  } catch (error) { return requestError(error, "Não foi possível consultar o recebimento."); }
}

export async function PATCH(request: Request, context: Context) {
  const forbidden = forbiddenMutationResponse(request);
  if (forbidden) return forbidden;
  try {
    const user = await authenticatedUser(request);
    if (!user) return unauthorizedResponse();
    const { id } = await context.params;
    if (!validId(id)) return jsonResponse({ error: "Orçamento não encontrado." }, { status: 404 });
    const body = receiptCorrectionSchema.parse(await readJson(request, 4096));
    if (body.transactionDate > brasiliaDay()) return jsonResponse({ error: "O recebimento não pode ter uma data futura." }, { status: 400 });
    const result = await getDb().transaction(async tx => {
      // Use the same lock order as receipt creation; audit and correction commit together.
      await tx.select({ id: users.id }).from(users).where(eq(users.id, user.dataOwnerId)).for("update");
      const [quote] = await tx.select({ id: quotes.id }).from(quotes).where(and(eq(quotes.id, Number(id)), eq(quotes.userId, user.dataOwnerId))).for("update");
      if (!quote) return { status: 404, error: "Orçamento não encontrado." };
      const where = and(eq(transactions.id, body.receiptId), eq(transactions.quoteId, quote.id), eq(transactions.userId, user.dataOwnerId));
      const [receipt] = await tx.select(fields).from(transactions).where(where).for("update");
      if (!receipt || receipt.type !== "income") return { status: 404, error: "Recebimento não encontrado." };
      if (receipt.receiptVersion !== body.expectedVersion) {
        const [prior] = await tx.select().from(receiptDateCorrections).where(and(eq(receiptDateCorrections.transactionId, receipt.id), eq(receiptDateCorrections.userId, user.dataOwnerId), eq(receiptDateCorrections.version, body.expectedVersion + 1))).limit(1);
        if (receipt.receiptVersion === body.expectedVersion + 1 && prior?.correctedDate === body.transactionDate && prior.reason === body.reason && receipt.transactionDate === body.transactionDate) return { status: 200, receipt };
        return { status: 409, error: "Este recebimento mudou em outra janela. Atualize o orçamento antes de corrigir." };
      }
      if (receipt.transactionDate === body.transactionDate) return { status: 400, error: "Escolha uma data diferente da atual." };
      await tx.insert(receiptDateCorrections).values({ userId: user.dataOwnerId, transactionId: receipt.id, version: body.expectedVersion + 1, previousDate: receipt.transactionDate, correctedDate: body.transactionDate, reason: body.reason });
      await tx.update(transactions).set({ transactionDate: body.transactionDate, receiptVersion: body.expectedVersion + 1 }).where(where);
      await tx.insert(businessActivity).values({ userId: user.dataOwnerId, action: "receipt.date_corrected", entityType: "transaction", entityId: receipt.id, title: `Corrigiu a data do recebimento do orçamento #${quote.id}`, details: JSON.stringify({ quoteId: quote.id, transactionId: receipt.id }), reversible: false });
      return { status: 200, receipt: { ...receipt, transactionDate: body.transactionDate, receiptVersion: body.expectedVersion + 1 } };
    });
    return jsonResponse(result.error ? { error: result.error } : { receipt: result.receipt }, { status: result.status });
  } catch (error) { return requestError(error, "Não foi possível corrigir a data. Tente novamente com os mesmos dados."); }
}

export async function POST(request: Request, context: Context) {
  const forbidden = forbiddenMutationResponse(request);
  if (forbidden) return forbidden;
  try {
    const user = await authenticatedUser(request);
    if (!user) return unauthorizedResponse();
    const { id } = await context.params;
    if (!validId(id)) return jsonResponse({ error: "Orçamento não encontrado." }, { status: 404 });
    const body = receiptSchema.parse(await readJson(request, 4096));
    if (body.transactionDate > brasiliaDay()) return jsonResponse({ error: "O recebimento não pode ter uma data futura." }, { status: 400 });
    const result = await getDb().transaction(async tx => {
      // Serialize receipt linking for this owner, then contend with quote edits/status/deletion.
      await tx.select({ id: users.id }).from(users).where(eq(users.id, user.dataOwnerId)).for("update");
      const where = and(eq(quotes.id, Number(id)), eq(quotes.userId, user.dataOwnerId));
      const [quote] = await tx.select().from(quotes).where(where).for("update");
      if (!quote) return { error: "Orçamento não encontrado.", status: 404 };
      const [saved] = await tx.select(fields).from(transactions).where(and(eq(transactions.quoteId, quote.id), eq(transactions.userId, user.dataOwnerId), isNull(transactions.voidedAt), isNull(transactions.reversalOfId))).for("update");
      if (saved) {
        if (saved.amountCents !== body.amountCents || saved.transactionDate !== body.transactionDate || (body.existingTransactionId && saved.id !== body.existingTransactionId)) return { error: "Já existe um recebimento para este orçamento. Atualize a página.", status: 409 };
        return { receipt: saved, status: 200 };
      }
      if (!["Aprovado", "Em andamento", "Finalizado", "Pago"].includes(quote.status)) return { error: "Aprove o orçamento antes de registrar o recebimento.", status: 409 };
      const items = await tx.select({ quantity: quoteItems.quantity, unitPriceCents: quoteItems.unitPriceCents }).from(quoteItems).where(eq(quoteItems.quoteId, quote.id));
      const total = receiptTotal(items, quote.discountCents);
      if (total === null || total !== body.amountCents) return { error: "O valor mudou ou não é válido. Reabra o orçamento antes de confirmar.", status: 409 };
      const charges = await tx.select().from(financialObligations).where(and(eq(financialObligations.userId, user.dataOwnerId), eq(financialObligations.quoteId, quote.id))).for("update");
      if (charges.length > 1 || charges.some(charge => charge.status !== "open" || charge.amountCents !== total || charge.type !== "receivable")) return { error: "A cobrança vinculada precisa ser conferida nas contas previstas.", status: 409 };
      const charge = charges[0];
      if (charge) {
        const prior = await tx.select({ id: transactions.id }).from(transactions).where(and(eq(transactions.userId, user.dataOwnerId), eq(transactions.obligationId, charge.id), isNull(transactions.voidedAt), isNull(transactions.reversalOfId)));
        if (prior.length) return { error: "Já há recebimentos nesta cobrança. Confira as contas previstas antes de continuar.", status: 409 };
      }
      let transactionId = body.existingTransactionId;
      if (transactionId) {
        const ownMovement = and(eq(transactions.id, transactionId), eq(transactions.userId, user.dataOwnerId));
        const [movement] = await tx.select().from(transactions).where(ownMovement).for("update");
        if (!movement || movement.quoteId || movement.obligationId || movement.voidedAt || movement.reversalOfId || movement.type !== "income" || movement.amountCents !== total || movement.transactionDate !== body.transactionDate) return { error: "A entrada escolhida não está disponível ou não corresponde ao recebimento.", status: 409 };
        await tx.update(transactions).set({ quoteId: quote.id, obligationId: charge?.id ?? null }).where(ownMovement);
      } else {
        const [created] = await tx.insert(transactions).values({ userId: user.dataOwnerId, quoteId: quote.id, obligationId: charge?.id ?? null, type: "income", description: `Recebimento do orçamento #${quote.id}`, amountCents: total, transactionDate: body.transactionDate }).$returningId();
        transactionId = created.id;
      }
      const now = new Date().toISOString();
      if (charge) await tx.update(financialObligations).set({ status: "paid", version: charge.version + 1, updatedAt: now }).where(and(eq(financialObligations.userId, user.dataOwnerId), eq(financialObligations.id, charge.id)));
      await tx.update(quotes).set({ status: "Pago", approvedAt: quote.approvedAt ?? now, updatedAt: now }).where(where);
      const [receipt] = await tx.select(fields).from(transactions).where(and(eq(transactions.id, transactionId), eq(transactions.userId, user.dataOwnerId))).limit(1);
      await tx.insert(businessActivity).values({ userId: user.dataOwnerId, action: "receipt.created", entityType: "transaction", entityId: transactionId, title: `Confirmou recebimento integral do orçamento #${quote.id}`, details: JSON.stringify({ quoteId: quote.id, transactionId }), reversible: false });
      return { receipt, status: 201 };
    });
    return jsonResponse(result.error ? { error: result.error } : { receipt: result.receipt }, { status: result.status });
  } catch (error) { return requestError(error, "Não foi possível registrar o recebimento. Tente novamente sem alterar os dados."); }
}
