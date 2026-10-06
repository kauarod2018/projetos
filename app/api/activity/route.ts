import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { businessActivity } from "@/db/schema";
import { authenticatedUser, requestError, unauthorizedResponse } from "@/lib/api-security";
import { jsonResponse } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const user = await authenticatedUser(request);
    if (!user) return unauthorizedResponse();
    const rows = await getDb().select({ id: businessActivity.id, action: businessActivity.action, entityType: businessActivity.entityType, entityId: businessActivity.entityId, title: businessActivity.title, reversible: businessActivity.reversible, undoneAt: businessActivity.undoneAt, createdAt: businessActivity.createdAt })
      .from(businessActivity).where(eq(businessActivity.userId, user.dataOwnerId)).orderBy(desc(businessActivity.id)).limit(100);
    return jsonResponse({ activities: rows });
  } catch (error) { return requestError(error, "Não foi possível carregar o histórico de ações."); }
}
