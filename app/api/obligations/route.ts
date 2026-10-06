import { and, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { businessActivity, customers, financialObligations, transactions, users } from "@/db/schema";
import { authenticatedUser, forbiddenMutationResponse, readJson, requestError, unauthorizedResponse } from "@/lib/api-security";
import { jsonResponse } from "@/lib/http";
import { installmentDate, obligationCreateSchema, splitInstallments } from "@/lib/obligations";

export async function GET(request: Request) {
  try {
    const user = await authenticatedUser(request);
    if (!user) return unauthorizedResponse();
    const db = getDb();
    const obligations = await db.select().from(financialObligations).where(and(eq(financialObligations.userId, user.dataOwnerId), eq(financialObligations.status, "open"))).orderBy(financialObligations.dueDate).limit(200);
    const customerIds = [...new Set(obligations.map(item => item.customerId).filter((id): id is number => id !== null))];
    const clientRows = customerIds.length ? await db.select({ id: customers.id, name: customers.name }).from(customers).where(and(eq(customers.userId, user.dataOwnerId), inArray(customers.id, customerIds))) : [];
    const clientNames = new Map(clientRows.map(item => [item.id, item.name]));
    const payments = obligations.length ? await db.select({ obligationId: transactions.obligationId, paidCents: sql<number>`coalesce(sum(${transactions.amountCents}), 0)` }).from(transactions)
      .where(and(eq(transactions.userId, user.dataOwnerId), inArray(transactions.obligationId, obligations.map(item => item.id)), isNotNull(transactions.obligationId), isNull(transactions.voidedAt), isNull(transactions.reversalOfId))).groupBy(transactions.obligationId) : [];
    const totals = new Map<number, number>();
    for (const payment of payments) if (payment.obligationId) totals.set(payment.obligationId, Number(payment.paidCents));
    return jsonResponse({ obligations: obligations.map(item => ({ ...item, customerName: item.customerId ? clientNames.get(item.customerId) ?? null : null, paidCents: totals.get(item.id) ?? 0, remainingCents: Math.max(0, item.amountCents - (totals.get(item.id) ?? 0)) })) });
  } catch (error) { return requestError(error, "Não foi possível carregar contas a receber e a pagar."); }
}

export async function POST(request: Request) {
  const forbidden = forbiddenMutationResponse(request);
  if (forbidden) return forbidden;
  try {
    const user = await authenticatedUser(request);
    if (!user) return unauthorizedResponse();
    const body = obligationCreateSchema.parse(await readJson(request, 4_096));
    const db = getDb();
    const result = await db.transaction(async tx => {
      await tx.select({ id: users.id }).from(users).where(eq(users.id, user.dataOwnerId)).for("update");
      if (body.requestKey) {
        const [prior] = await tx.select().from(financialObligations).where(and(eq(financialObligations.userId, user.dataOwnerId), eq(financialObligations.requestKey, body.requestKey))).for("update");
        if (prior) {
          const matches = prior.type === body.type && prior.customerId === body.customerId && prior.description === body.description && prior.amountCents === body.amountCents && prior.dueDate === body.dueDate && prior.installmentCount === body.installmentCount;
          return matches ? { rows: [prior], replay: true } : { error: "Esta solicitação já foi salva com outros dados. Atualize as contas previstas." };
        }
      }
      if (body.customerId !== null) {
        const [customer] = await tx.select({ id: customers.id }).from(customers).where(and(eq(customers.id, body.customerId), eq(customers.userId, user.dataOwnerId))).for("update");
        if (!customer) return { error: "Cliente indisponível. Escolha um cliente da sua conta." };
      }
      const group = crypto.randomUUID();
      const parts = splitInstallments(body.amountCents, body.installmentCount);
      const createdIds: number[] = [];
      for (let index = 0; index < parts.length; index += 1) {
        const [created] = await tx.insert(financialObligations).values({
          userId: user.dataOwnerId, customerId: body.customerId, type: body.type, description: body.description, amountCents: parts[index],
          dueDate: installmentDate(body.dueDate, index), status: "open", installmentGroup: group,
          installmentNumber: index + 1, installmentCount: parts.length, requestKey: index === 0 ? body.requestKey ?? null : null,
        }).$returningId();
        createdIds.push(created.id);
      }
      const rows = await tx.select().from(financialObligations).where(and(eq(financialObligations.userId, user.dataOwnerId), eq(financialObligations.installmentGroup, group))).orderBy(financialObligations.installmentNumber);
      await tx.insert(businessActivity).values({ userId: user.dataOwnerId, action: "obligation.created", entityType: "obligation", entityId: createdIds[0], title: `Criou ${parts.length} parcela${parts.length === 1 ? "" : "s"} em ${body.type === "receivable" ? "contas a receber" : "contas a pagar"}`, details: JSON.stringify({ obligationIds: createdIds }), reversible: false });
      return { rows, replay: false };
    });
    if ("error" in result) return jsonResponse(result, { status: 409 });
    return jsonResponse({ obligations: result.rows }, { status: result.replay ? 200 : 201 });
  } catch (error) { return requestError(error, "Não foi possível criar a conta prevista."); }
}
