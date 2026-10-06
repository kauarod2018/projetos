import { and, eq, isNull } from "drizzle-orm";

import { getDb } from "@/db";
import { businessLogos, quotes } from "@/db/schema";
import { parseLogoDataUrl } from "@/lib/business-logo";

type RouteContext = { params: Promise<{ token: string }> };

// Logo do negócio para o link público do orçamento. Sem logo (ou sem a tabela 018), responde 404.
export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;
  if (!/^[A-Za-z0-9_-]{32,64}$/.test(token)) return new Response(null, { status: 404 });
  try {
    const [row] = await getDb().select({ dataUrl: businessLogos.dataUrl }).from(quotes)
      .innerJoin(businessLogos, eq(businessLogos.userId, quotes.userId))
      .where(and(eq(quotes.publicToken, token), isNull(quotes.archivedAt))).limit(1);
    const logo = parseLogoDataUrl(row?.dataUrl);
    if (!logo) return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
    return new Response(new Uint8Array(logo.bytes), { headers: { "Content-Type": logo.mime, "Cache-Control": "private, max-age=300", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
}
