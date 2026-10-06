import { jsonResponse } from "@/lib/http";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { quotes } from "@/db/schema";
import { createPublicToken } from "@/lib/auth";
import { authenticatedUser, forbiddenMutationResponse, requestError, unauthorizedResponse } from "@/lib/api-security";
import { loadQuote } from "@/lib/quote-data";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const forbidden = forbiddenMutationResponse(request);
  if (forbidden) return forbidden;
  try {
    const user = await authenticatedUser(request);
    if (!user) return unauthorizedResponse();
    const { id } = await context.params;
    if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) return jsonResponse({ error: "Orçamento não encontrado." }, { status: 404 });
    const [updated] = await getDb().update(quotes).set({
      publicToken: createPublicToken(), updatedAt: new Date().toISOString(),
    }).where(and(eq(quotes.id, Number(id)), eq(quotes.userId, user.dataOwnerId)));
    if (updated.affectedRows === 0) return jsonResponse({ error: "Orçamento não encontrado." }, { status: 404 });
    return jsonResponse({ quote: await loadQuote(Number(id), user.dataOwnerId) });
  } catch (error) {
    return requestError(error, "Não foi possível renovar o link.");
  }
}
