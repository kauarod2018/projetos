import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { businessLogos } from "@/db/schema";
import { authenticatedUser, forbiddenMutationResponse, readJson, requestError, unauthorizedResponse } from "@/lib/api-security";
import { MAX_LOGO_CHARS, parseLogoDataUrl } from "@/lib/business-logo";
import { databaseError } from "@/lib/quote-data";
import { jsonResponse } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const user = await authenticatedUser(request);
    if (!user) return unauthorizedResponse();
    const [row] = await getDb().select({ dataUrl: businessLogos.dataUrl }).from(businessLogos).where(eq(businessLogos.userId, user.dataOwnerId)).limit(1);
    return jsonResponse({ logo: row?.dataUrl ?? null }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return requestError(error, databaseError(error));
  }
}

export async function PUT(request: Request) {
  const forbidden = forbiddenMutationResponse(request);
  if (forbidden) return forbidden;
  try {
    const user = await authenticatedUser(request, { manageCompany: true });
    if (!user) return unauthorizedResponse();
    const body = await readJson<{ logo?: unknown }>(request, MAX_LOGO_CHARS + 1_024);
    const logo = parseLogoDataUrl(body?.logo);
    if (!logo) return jsonResponse({ error: "Envie uma imagem PNG, JPG ou WebP de até 300 KB." }, { status: 400 });
    const updatedAt = new Date().toISOString();
    await getDb().insert(businessLogos).values({ userId: user.dataOwnerId, dataUrl: logo.dataUrl, updatedAt }).onDuplicateKeyUpdate({ set: { dataUrl: logo.dataUrl, updatedAt } });
    return jsonResponse({ logo: logo.dataUrl }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return requestError(error, databaseError(error));
  }
}

export async function DELETE(request: Request) {
  const forbidden = forbiddenMutationResponse(request);
  if (forbidden) return forbidden;
  try {
    const user = await authenticatedUser(request, { manageCompany: true });
    if (!user) return unauthorizedResponse();
    await getDb().delete(businessLogos).where(eq(businessLogos.userId, user.dataOwnerId));
    return jsonResponse({ logo: null }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return requestError(error, databaseError(error));
  }
}
