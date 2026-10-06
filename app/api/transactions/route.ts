import { jsonResponse } from "@/lib/http";
import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { businessActivity, transactions, users } from "@/db/schema";
import { databaseError } from "@/lib/quote-data";
import { authenticatedUser, forbiddenMutationResponse, readJson, requestError, unauthorizedResponse } from "@/lib/api-security";
import { transactionCreateSchema } from "@/lib/validation";

const fields = {
  id: transactions.id, quoteId: transactions.quoteId, type: transactions.type, category: transactions.category, description: transactions.description,
  amountCents: transactions.amountCents, transactionDate: transactions.transactionDate,
  createdAt: transactions.createdAt,
};

export async function GET(request: Request) {
  try {
    const user = await authenticatedUser(request);
    if (!user) return unauthorizedResponse();
    const rows = await getDb().select(fields).from(transactions)
      .where(and(eq(transactions.userId, user.dataOwnerId), isNull(transactions.voidedAt), isNull(transactions.reversalOfId)))
      .orderBy(desc(transactions.transactionDate), desc(transactions.id));
    return jsonResponse({ transactions: rows });
  } catch (error) {
    return requestError(error, databaseError(error));
  }
}

export async function POST(request: Request) {
  const forbidden = forbiddenMutationResponse(request);
  if (forbidden) return forbidden;
  try {
    const user = await authenticatedUser(request);
    if (!user) return unauthorizedResponse();
    const { requestKey, ...body } = transactionCreateSchema.parse(await readJson(request, 8_192));
    if (requestKey) {
      const result = await getDb().transaction(async tx => {
        await tx.select({ id: users.id }).from(users).where(eq(users.id, user.dataOwnerId)).for("update");
        const ownerRequest = and(eq(transactions.userId, user.dataOwnerId), eq(transactions.requestKey, requestKey));
        const [existing] = await tx.select(fields).from(transactions).where(ownerRequest).for("update");
        if (existing) {
          const [state] = await tx.select({ voidedAt: transactions.voidedAt }).from(transactions).where(and(eq(transactions.userId, user.dataOwnerId), eq(transactions.requestKey, requestKey))).for("update");
          if (state?.voidedAt) return { error: "Este lançamento já foi desfeito. Crie um novo lançamento se ainda for necessário." };
          const matches = existing.type === body.type && existing.category === body.category && existing.description === body.description && existing.amountCents === body.amountCents && existing.transactionDate === body.transactionDate;
          return matches ? { transaction: existing, replay: true } : { error: "Esta despesa já foi salva com outros dados. Confira o Financeiro antes de tentar novamente." };
        }
        const [created] = await tx.insert(transactions).values({ ...body, requestKey, userId: user.dataOwnerId }).$returningId();
        const [transaction] = await tx.select(fields).from(transactions)
          .where(and(eq(transactions.userId, user.dataOwnerId), eq(transactions.id, created.id))).for("update");
        await tx.insert(businessActivity).values({ userId: user.dataOwnerId, action: "transaction.created", entityType: "transaction", entityId: transaction.id, title: `Registrou ${body.type === "income" ? "entrada" : "despesa"}: ${body.description}`, details: JSON.stringify({ kind: "transaction.create", transactionId: transaction.id }), reversible: true });
        return { transaction, replay: false };
      });
      return jsonResponse("error" in result ? result : { transaction: result.transaction }, { status: "error" in result ? 409 : result.replay ? 200 : 201 });
    }
    const result = await getDb().transaction(async tx => {
      const [created] = await tx.insert(transactions).values({ ...body, userId: user.dataOwnerId }).$returningId();
      const [transaction] = await tx.select(fields).from(transactions).where(and(eq(transactions.userId, user.dataOwnerId), eq(transactions.id, created.id)));
      await tx.insert(businessActivity).values({ userId: user.dataOwnerId, action: "transaction.created", entityType: "transaction", entityId: transaction.id, title: `Registrou ${body.type === "income" ? "entrada" : "despesa"}: ${body.description}`, details: JSON.stringify({ kind: "transaction.create", transactionId: transaction.id }), reversible: true });
      return transaction;
    });
    return jsonResponse({ transaction: result }, { status: 201 });
  } catch (error) {
    return requestError(error, databaseError(error));
  }
}
