import { jsonResponse } from "@/lib/http";
import { and, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { quotes, customers, quoteItems, transactions, appointments, financialObligations, users, businessActivity } from "@/db/schema";
import { quoteStatuses, type QuoteStatus } from "@/lib/models";
import { databaseError, loadQuote } from "@/lib/quote-data";
import { authenticatedUser, forbiddenMutationResponse, readJson, requestError, unauthorizedResponse } from "@/lib/api-security";
import { quoteStatusSchema, quoteSchema } from "@/lib/validation";
import { canEditQuote, clientSnapshot } from "@/lib/quote-editing";
import { createPublicToken } from "@/lib/auth";
import type { DbTransaction } from "@/lib/workspace";

async function hasWorkflow(tx: DbTransaction, ownerId: number, quoteId: number) {
  const [visit] = await tx.select({ id: appointments.id }).from(appointments).where(and(eq(appointments.userId, ownerId), eq(appointments.quoteId, quoteId))).limit(1);
  const [charge] = await tx.select({ id: financialObligations.id }).from(financialObligations).where(and(eq(financialObligations.userId, ownerId), eq(financialObligations.quoteId, quoteId))).limit(1);
  return Boolean(visit || charge);
}

async function hasActiveWorkflow(tx: Pick<DbTransaction, "select">, ownerId: number, quoteId: number) {
  const visits = await tx.select({ status: appointments.status }).from(appointments).where(and(eq(appointments.userId, ownerId), eq(appointments.quoteId, quoteId)));
  const charges = await tx.select({ status: financialObligations.status }).from(financialObligations).where(and(eq(financialObligations.userId, ownerId), eq(financialObligations.quoteId, quoteId)));
  return visits.some(visit => !["Concluído", "Cancelado"].includes(visit.status)) || charges.some(charge => charge.status !== "canceled");
}

async function statusAccess(tx: Pick<DbTransaction, "select">, ownerId: number, quoteId: number, status: QuoteStatus, archivedAt?: string | null) {
  const [receipt] = await tx.select({ id: transactions.id }).from(transactions).where(and(eq(transactions.quoteId, quoteId), eq(transactions.userId, ownerId), isNull(transactions.voidedAt), isNull(transactions.reversalOfId))).limit(1);
  if (archivedAt) return { statusOptions: [], statusMessage: "Restaure o orçamento para alterar a etapa." };
  if (receipt) return { statusOptions: [status], statusMessage: "Há um recebimento registrado. A etapa de pagamento não pode ser desfeita pelo status." };
  if (await hasActiveWorkflow(tx, ownerId, quoteId)) return { statusOptions: ["Aprovado", "Em andamento", "Finalizado"], statusMessage: "Há atendimento ou cobrança em aberto. Para recusar ou voltar ao rascunho, resolva esses vínculos primeiro." };
  return { statusOptions: quoteStatuses.filter(value => value !== "Pago"), statusMessage: status === "Pago" ? "Pagamento antigo sem entrada vinculada: confira o recebimento antes de corrigir a etapa." : "" };
}

export async function PUT(request: Request, context: RouteContext) {
  const forbidden = forbiddenMutationResponse(request);
  if (forbidden) return forbidden;
  try {
    const user = await authenticatedUser(request);
    if (!user) return unauthorizedResponse();
    const { id } = await context.params;
    if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) return jsonResponse({ error: "Orçamento não encontrado." }, { status: 404 });
    const raw = await readJson(request);
    const body = quoteSchema.parse(raw);
    const { expectedToken } = z.object({ expectedToken: z.string().regex(/^[A-Za-z0-9_-]{32,64}$/) }).parse(raw);
    const result = await getDb().transaction(async (tx) => {
      const where = and(eq(quotes.id, Number(id)), eq(quotes.userId, user.dataOwnerId));
      // Approval and editing contend on the same row; an approved document cannot be overwritten.
      const [existing] = await tx.select().from(quotes).where(where).for("update");
      if (!existing) return 404;
      if (existing.archivedAt || !canEditQuote(existing)) return 409;
      if (await hasWorkflow(tx, user.dataOwnerId, existing.id)) return 409;
      if (existing.publicToken !== expectedToken) return 412;
      let customerId = body.customerId;
      if (!customerId) {
        const [created] = await tx.insert(customers).values({ ...body.customer!, userId: user.dataOwnerId }).$returningId();
        customerId = created.id;
      }
      const [client] = await tx.select().from(customers).where(and(eq(customers.id, customerId), eq(customers.userId, user.dataOwnerId))).limit(1);
      if (!client) return 404;
      await tx.update(quotes).set({
        customerId, clientSnapshot: clientSnapshot(client), description: body.description,
        validUntil: body.validUntil, deadline: body.deadline, paymentMethod: body.paymentMethod,
        discountCents: body.discountCents, status: "Rascunho", sentAt: null,
        updatedAt: new Date().toISOString(), publicToken: createPublicToken(),
      }).where(where);
      await tx.delete(quoteItems).where(eq(quoteItems.quoteId, existing.id));
      await tx.insert(quoteItems).values(body.items.map((item) => ({ ...item, quoteId: existing.id })));
      return 200;
    });
    if (result !== 200) return jsonResponse({ error: result === 412 ? "O orçamento mudou em outra janela. Reabra a edição antes de salvar." : result === 409 ? "Este orçamento está protegido. Duplique para criar uma nova versão." : "Orçamento ou cliente não encontrado." }, { status: result });
    return jsonResponse({ quote: await loadQuote(Number(id), user.dataOwnerId) });
  } catch (error) { return requestError(error, "Não foi possível atualizar o orçamento."); }
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await authenticatedUser(request);
    if (!user) return unauthorizedResponse();
    const { id } = await context.params;
    if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) return jsonResponse({ error: "Orçamento não encontrado." }, { status: 404 });
    const quote = await loadQuote(Number(id), user.dataOwnerId);
    return quote
      ? jsonResponse({ quote, ...await statusAccess(getDb(), user.dataOwnerId, quote.id, quote.status, quote.archivedAt) })
      : jsonResponse({ error: "Orçamento não encontrado." }, { status: 404 });
  } catch (error) {
    return requestError(error, databaseError(error));
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const forbidden = forbiddenMutationResponse(request);
  if (forbidden) return forbidden;

  try {
    const user = await authenticatedUser(request);
    if (!user) return unauthorizedResponse();
    const { id } = await context.params;
    if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) return jsonResponse({ error: "Orçamento não encontrado." }, { status: 404 });
    const body = quoteStatusSchema.parse(await readJson(request, 4_096));

    if (!body.status || !quoteStatuses.includes(body.status)) {
      return jsonResponse({ error: "Escolha uma etapa válida." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const result = await getDb().transaction(async tx => {
      const where = and(eq(quotes.id, Number(id)), eq(quotes.userId, user.dataOwnerId));
      await tx.select({ id: users.id }).from(users).where(eq(users.id, user.dataOwnerId)).for("update");
      const [existing] = await tx.select().from(quotes).where(where).for("update");
      if (!existing) return 404;
      if (existing.archivedAt) return "archived";
      if (body.expectedUpdatedAt && existing.updatedAt !== body.expectedUpdatedAt) return 412;
      if (existing.status === body.status) return 200;
      const [receipt] = await tx.select({ id: transactions.id }).from(transactions).where(and(eq(transactions.quoteId, existing.id), eq(transactions.userId, user.dataOwnerId), isNull(transactions.voidedAt), isNull(transactions.reversalOfId))).limit(1);
      if (body.status === "Pago") return "payment";
      if (receipt) return "receipt";
      if (!["Aprovado", "Em andamento", "Finalizado"].includes(body.status) && await hasActiveWorkflow(tx, user.dataOwnerId, existing.id)) return "workflow";
      await tx.update(quotes)
      .set({
        status: body.status,
        updatedAt: now,
        ...(body.status === "Enviado" ? { sentAt: now } : {}),
        ...(["Aprovado", "Em andamento", "Finalizado", "Pago"].includes(body.status) ? { approvedAt: sql`COALESCE(${quotes.approvedAt}, ${now})` } : {}),
      })
      .where(where);
      return 200;
    });
    if (result === 412) return jsonResponse({ error: "Este orçamento mudou em outra janela. Atualize antes de alterar a etapa." }, { status: 412 });
    if (typeof result === "string") {
      const messages = { archived: "Restaure o orçamento antes de alterar a etapa.", payment: "Registre ou vincule o recebimento para marcar como pago.", receipt: "Este orçamento tem um recebimento registrado. Alterar a etapa não pode desfazer esse pagamento.", workflow: "Há atendimento ou cobrança em aberto. Resolva esses vínculos antes de voltar ao rascunho ou recusar." };
      return jsonResponse({ error: messages[result] }, { status: 409 });
    }
    return result === 200
      ? jsonResponse({ quote: await loadQuote(Number(id), user.dataOwnerId) })
      : jsonResponse({ error: "Orçamento não encontrado." }, { status: 404 });
  } catch (error) {
    return requestError(error, databaseError(error));
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const forbidden = forbiddenMutationResponse(request);
  if (forbidden) return forbidden;

  try {
    const user = await authenticatedUser(request);
    if (!user) return unauthorizedResponse();
    const { id } = await context.params;
    if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) return jsonResponse({ error: "Orçamento não encontrado." }, { status: 404 });
    const result = await getDb().transaction(async tx => {
      const where = and(eq(quotes.id, Number(id)), eq(quotes.userId, user.dataOwnerId));
      await tx.select({ id: users.id }).from(users).where(eq(users.id, user.dataOwnerId)).for("update");
      const [existing] = await tx.select({ id: quotes.id }).from(quotes).where(where).for("update");
      if (!existing) return 404;
      const [receipt] = await tx.select({ id: transactions.id }).from(transactions).where(and(eq(transactions.quoteId, existing.id), eq(transactions.userId, user.dataOwnerId))).limit(1);
      if (receipt) return 409;
      if (await hasWorkflow(tx, user.dataOwnerId, existing.id)) return 409;
      await tx.delete(quotes).where(where);
      return 200;
    });
    if (result === 409) return jsonResponse({ error: "Este orçamento tem histórico vinculado. Use Arquivar para removê-lo da lista sem apagar atendimentos ou pagamentos." }, { status: 409 });
    return result === 200
      ? jsonResponse({ ok: true })
      : jsonResponse({ error: "Orçamento não encontrado." }, { status: 404 });
  } catch (error) {
    return requestError(error, databaseError(error));
  }
}

export async function POST(request: Request, context: RouteContext) {
  const forbidden = forbiddenMutationResponse(request);
  if (forbidden) return forbidden;
  try {
    const user = await authenticatedUser(request);
    if (!user) return unauthorizedResponse();
    const { id } = await context.params;
    if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) return jsonResponse({ error: "Orçamento não encontrado." }, { status: 404 });
    const body = z.object({ action: z.enum(["archive", "restore"]), expectedUpdatedAt: z.string().min(1).max(24) }).strict().parse(await readJson(request, 1024));
    const result = await getDb().transaction(async tx => {
      await tx.select({ id: users.id }).from(users).where(eq(users.id, user.dataOwnerId)).for("update");
      const where = and(eq(quotes.id, Number(id)), eq(quotes.userId, user.dataOwnerId));
      const [quote] = await tx.select().from(quotes).where(where).for("update");
      if (!quote) return 404;
      if (Boolean(quote.archivedAt) === (body.action === "archive")) return 200;
      if (quote.updatedAt !== body.expectedUpdatedAt) return 412;
      const now = new Date().toISOString();
      await tx.update(quotes).set({ archivedAt: body.action === "archive" ? now : null, updatedAt: now, publicToken: createPublicToken() }).where(where);
      await tx.insert(businessActivity).values({ userId: user.dataOwnerId, action: `quote.${body.action}`, entityType: "quote", entityId: quote.id, title: `${body.action === "archive" ? "Arquivou" : "Restaurou"} o orçamento #${quote.id}`, reversible: false });
      return 200;
    });
    if (result !== 200) return jsonResponse({ error: result === 412 ? "O orçamento mudou. Atualize antes de continuar." : "Orçamento não encontrado." }, { status: result });
    return jsonResponse({ quote: await loadQuote(Number(id), user.dataOwnerId) });
  } catch (error) { return requestError(error, databaseError(error)); }
}
