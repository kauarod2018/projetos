import { and, eq, isNotNull, isNull, lte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { financialObligations, transactions } from "@/db/schema";
import { authenticatedUser, requestError, unauthorizedResponse } from "@/lib/api-security";
import { jsonResponse } from "@/lib/http";
import { brasiliaDay, moveDay } from "@/lib/appointments";
import { summarizeObligationRows, type ObligationSummaryRow } from "@/lib/obligations-summary";

export async function GET(request: Request) {
  try {
    const user = await authenticatedUser(request);
    if (!user) return unauthorizedResponse();

    const today = brasiliaDay();
    const throughDate = moveDay(today, 7);
    const db = getDb();
    const paidTotals = db.select({
      obligationId: transactions.obligationId,
      paidCents: sql<number>`COALESCE(SUM(${transactions.amountCents}), 0)`.as("paid_cents"),
    }).from(transactions)
      .where(and(
        eq(transactions.userId, user.dataOwnerId),
        isNotNull(transactions.obligationId),
        isNull(transactions.voidedAt),
        isNull(transactions.reversalOfId),
      ))
      .groupBy(transactions.obligationId)
      .as("paid_totals");

    const bucket = sql<string>`CASE WHEN ${financialObligations.dueDate} < ${today} THEN 'overdue' ELSE 'upcoming' END`.as("bucket");
    const rows = await db.select({
      bucket,
      type: financialObligations.type,
      count: sql<number>`COUNT(*)`.as("item_count"),
      remainingCents: sql<number>`SUM(GREATEST(${financialObligations.amountCents} - COALESCE(${paidTotals.paidCents}, 0), 0))`.as("remaining_cents"),
    }).from(financialObligations)
      .leftJoin(paidTotals, eq(financialObligations.id, paidTotals.obligationId))
      .where(and(
        eq(financialObligations.userId, user.dataOwnerId),
        eq(financialObligations.status, "open"),
        lte(financialObligations.dueDate, throughDate),
      ))
      .groupBy(bucket, financialObligations.type);

    return jsonResponse({ today, throughDate, summary: summarizeObligationRows(rows as ObligationSummaryRow[]) });
  } catch (error) {
    return requestError(error, "Não foi possível consultar os vencimentos próximos.");
  }
}
