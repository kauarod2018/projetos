import { jsonResponse } from "@/lib/http";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { businessActivity, customers, quoteItems, quotes } from "@/db/schema";
import { databaseError, loadQuote, loadQuotes } from "@/lib/quote-data";
import { createPublicToken } from "@/lib/auth";
import { authenticatedUser, forbiddenMutationResponse, readJson, requestError, unauthorizedResponse } from "@/lib/api-security";
import { quoteSchema } from "@/lib/validation";
import { clientSnapshot } from "@/lib/quote-editing";

export async function GET(request: Request) {
  try {
    const user = await authenticatedUser(request);
    if (!user) return unauthorizedResponse();
    return jsonResponse({ quotes: await loadQuotes(user.dataOwnerId) });
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
    const body = quoteSchema.parse(await readJson(request));
    const db = getDb();
    if (body.customerId) {
      const [customer] = await db.select({ id: customers.id }).from(customers)
        .where(and(eq(customers.id, body.customerId), eq(customers.userId, user.dataOwnerId))).limit(1);
      if (!customer) return jsonResponse({ error: "Cliente não encontrado." }, { status: 404 });
    }
    // Include new customers and every item in the same MySQL transaction.
    const quoteId = await db.transaction(async (tx) => {
      let customerId = body.customerId;
      if (!customerId) {
        const [customer] = await tx.insert(customers).values({ ...body.customer!, userId: user.dataOwnerId }).$returningId();
        customerId = customer.id;
      }
      const [created] = await tx.insert(quotes).values({
        userId: user.dataOwnerId, customerId, publicToken: createPublicToken(),
        description: body.description, validUntil: body.validUntil,
        deadline: body.deadline, paymentMethod: body.paymentMethod, discountCents: body.discountCents,
        clientSnapshot: clientSnapshot((await tx.select().from(customers).where(and(eq(customers.id, customerId!), eq(customers.userId, user.dataOwnerId))).limit(1))[0]),
      }).$returningId();
      await tx.insert(quoteItems).values(body.items.map((item) => ({ ...item, quoteId: created.id })));
      await tx.insert(businessActivity).values({ userId: user.dataOwnerId, action: "quote.created", entityType: "quote", entityId: created.id, title: `Criou o orçamento #${created.id}`, reversible: false });
      return created.id;
    });
    return jsonResponse({ quote: await loadQuote(quoteId, user.dataOwnerId) }, { status: 201 });
  } catch (error) {
    return requestError(error, databaseError(error));
  }
}
