import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { users } from "@/db/schema";
import { authenticatedUser, forbiddenMutationResponse, readJson, requestError, unauthorizedResponse } from "@/lib/api-security";
import { parseBusinessProfile } from "@/lib/business-profile";
import { databaseError } from "@/lib/quote-data";
import { jsonResponse } from "@/lib/http";
import { businessProfileSchema } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const user = await authenticatedUser(request);
    if (!user) return unauthorizedResponse();
    const [row] = await getDb().select({ profile: users.businessProfile }).from(users).where(eq(users.id, user.dataOwnerId)).limit(1);
    return jsonResponse({ profile: parseBusinessProfile(row?.profile) }, { headers: { "Cache-Control": "no-store" } });
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
    const profile = businessProfileSchema.parse(await readJson(request, 4_096));
    const [updated] = await getDb().update(users).set({ businessProfile: JSON.stringify(profile) }).where(eq(users.id, user.dataOwnerId));
    if (!updated.affectedRows) return jsonResponse({ error: "Conta não encontrada." }, { status: 404 });
    return jsonResponse({ profile }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return requestError(error, databaseError(error));
  }
}
