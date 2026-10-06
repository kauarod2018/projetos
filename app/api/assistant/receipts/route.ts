import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { transactions } from "@/db/schema";
import { authenticatedUser, requestError, unauthorizedResponse } from "@/lib/api-security";
import { jsonResponse } from "@/lib/http";
import { loadQuotes } from "@/lib/quote-data";
import { receiptCandidates } from "@/lib/assistant-receipts";

const querySchema = z.object({
  q: z.string().trim().max(120).default(""),
  cursor: z.string().regex(/^[1-9]\d{0,9}$/).transform(Number).refine(value => value <= 4294967295).optional(),
  amountCents: z.string().regex(/^[1-9]\d{0,11}$/).transform(Number).refine(value => Number.isSafeInteger(value) && value <= 100_000_000_000).optional(),
}).strict();

export async function GET(request: Request) {
  try {
    const user = await authenticatedUser(request);
    if (!user) return unauthorizedResponse();
    const params = new URL(request.url).searchParams;
    if (new Set(params.keys()).size !== [...params.keys()].length) return jsonResponse({ error: "Consulta inválida." }, { status: 400 });
    const query = querySchema.parse(Object.fromEntries(params));
    const quotes = await loadQuotes(user.dataOwnerId);
    const received = await getDb().select({ quoteId: transactions.quoteId }).from(transactions)
      .where(and(eq(transactions.userId, user.dataOwnerId), isNotNull(transactions.quoteId), isNull(transactions.voidedAt), isNull(transactions.reversalOfId)));
    return jsonResponse(receiptCandidates(quotes, new Set(received.map(row => row.quoteId!)), query.q, query.cursor, query.amountCents));
  } catch (error) { return requestError(error, "Não foi possível consultar os orçamentos. Tente novamente."); }
}
