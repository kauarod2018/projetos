import { jsonResponse } from "@/lib/http";
import { and, eq, gte, inArray, isNull } from "drizzle-orm";

import { getDb } from "@/db";
import { quotes } from "@/db/schema";
import { forbiddenMutationResponse, readJson, requestError } from "@/lib/api-security";
import { databaseError, loadPublicQuote } from "@/lib/quote-data";
import { publicDecisionSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ token: string }> };

function validToken(token: string) {
  return /^[A-Za-z0-9_-]{32,64}$/.test(token);
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;
    if (!validToken(token)) return jsonResponse({ error: "Orçamento não encontrado." }, { status: 404 });
    const quote = await loadPublicQuote(token);
    if (quote && quote.validUntil < new Date().toISOString().slice(0, 10)) {
      return jsonResponse({ error: "Este link expirou. Solicite um novo orçamento." }, { status: 410 });
    }
    return quote
      ? jsonResponse({ quote }, { headers: { "Cache-Control": "no-store" } })
      : jsonResponse({ error: "Orçamento não encontrado." }, { status: 404 });
  } catch (error) {
    return jsonResponse({ error: databaseError(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const forbidden = forbiddenMutationResponse(request);
  if (forbidden) return forbidden;

  try {
    const { token } = await context.params;
    if (!validToken(token)) return jsonResponse({ error: "Orçamento não encontrado." }, { status: 404 });
    const body = publicDecisionSchema.parse(await readJson(request, 2_048));
    if (!body.status || !["Aprovado", "Recusado"].includes(body.status)) {
      return jsonResponse({ error: "Escolha uma resposta válida." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const [updated] = await getDb()
      .update(quotes)
      .set({
        status: body.status,
        updatedAt: now,
        ...(body.status === "Aprovado" ? { approvedAt: now } : {}),
      })
      .where(and(eq(quotes.publicToken, token), isNull(quotes.archivedAt), inArray(quotes.status, ["Rascunho", "Enviado"]), gte(quotes.validUntil, now.slice(0, 10))));

    if (updated.affectedRows === 0) {
      const existing = await loadPublicQuote(token);
      if (existing && existing.validUntil < now.slice(0, 10)) return jsonResponse({ error: "Este link expirou." }, { status: 410 });
      return existing
        ? jsonResponse({ quote: existing }, { headers: { "Cache-Control": "no-store" } })
        : jsonResponse({ error: "Orçamento não encontrado." }, { status: 404 });
    }

    return jsonResponse({ quote: await loadPublicQuote(token) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return requestError(error, databaseError(error));
  }
}
