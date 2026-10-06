import { and, eq, gt, gte, isNotNull, isNull, lte, lt, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { appointments, customers, financialObligations, transactions } from "@/db/schema";
import { authenticatedUser, requestError, unauthorizedResponse } from "@/lib/api-security";
import { jsonResponse } from "@/lib/http";
import { loadQuotes } from "@/lib/quote-data";
import { brasiliaDay, moveDay } from "@/lib/appointments";
import { agendaAnswer, cashflowAnswer, expensesAnswer, incomeAnswer, obligationAnswer, quoteAnswer, receivableClientsAnswer } from "@/lib/assistant-summary";
import type { Appointment } from "@/lib/appointments";
import type { FinanceTransaction } from "@/lib/models";
import { assistantMonthPeriod } from "@/lib/assistant-period";
import { summarizeObligationRows, type ObligationSummaryRow } from "@/lib/obligations-summary";

const querySchema = z.object({ topic: z.enum(["today", "tomorrow", "receivable", "receivableClients", "obligations", "income", "expenses", "cashflow", "followups"]), month: z.string().optional() }).strict().refine(value => value.month === undefined || ["cashflow", "expenses"].includes(value.topic));

export async function GET(request: Request) {
  try {
    const user = await authenticatedUser(request);
    if (!user) return unauthorizedResponse();
    const query = new URL(request.url).searchParams;
    if (new Set(query.keys()).size !== [...query.keys()].length) return jsonResponse({ error: "Escolha uma consulta válida." }, { status: 400 });
    const { topic, month } = querySchema.parse(Object.fromEntries(query));
    const now = new Date(), today = brasiliaDay(now);
    const period = assistantMonthPeriod(now, month);
    if (!period) return jsonResponse({ error: "Escolha um mês válido entre janeiro de 2000 e o mês atual." }, { status: 400 });
    if (topic === "receivable" || topic === "followups" || topic === "receivableClients") {
      const rows = await loadQuotes(user.dataOwnerId);
      return jsonResponse({ answer: topic === "receivableClients" ? receivableClientsAnswer(rows, now) : quoteAnswer(rows, topic, now) });
    }
    if (topic === "income" || topic === "expenses" || topic === "cashflow") {
      const rows = await getDb().select({ id: transactions.id, quoteId: transactions.quoteId, type: transactions.type, category: transactions.category, description: transactions.description, amountCents: transactions.amountCents, transactionDate: transactions.transactionDate, createdAt: transactions.createdAt }).from(transactions)
        .where(and(eq(transactions.userId, user.dataOwnerId), isNull(transactions.voidedAt), isNull(transactions.reversalOfId), topic === "income" ? eq(transactions.type, "income") : topic === "expenses" ? eq(transactions.type, "expense") : undefined, gte(transactions.transactionDate, period.start), lt(transactions.transactionDate, period.until)));
      return jsonResponse({ answer: topic === "income" ? incomeAnswer(rows as FinanceTransaction[], now) : topic === "expenses" ? expensesAnswer(rows as FinanceTransaction[], now, month) : cashflowAnswer(rows as FinanceTransaction[], now, month) });
    }
    if (topic === "obligations") {
      const throughDate = moveDay(today, 7), db = getDb();
      const paidTotals = db.select({
        obligationId: transactions.obligationId,
        paidCents: sql<number>`COALESCE(SUM(${transactions.amountCents}), 0)`.as("paid_cents"),
      }).from(transactions).where(and(
        eq(transactions.userId, user.dataOwnerId), isNotNull(transactions.obligationId),
        isNull(transactions.voidedAt), isNull(transactions.reversalOfId),
      )).groupBy(transactions.obligationId).as("paid_totals");
      const bucket = sql<string>`CASE WHEN ${financialObligations.dueDate} < ${today} THEN 'overdue' ELSE 'upcoming' END`.as("bucket");
      const remainingCents = sql<number>`GREATEST(${financialObligations.amountCents} - COALESCE(${paidTotals.paidCents}, 0), 0)`;
      const baseWhere = and(eq(financialObligations.userId, user.dataOwnerId), eq(financialObligations.status, "open"));
      const [totals, overdue, upcoming] = await Promise.all([
        db.select({
          bucket,
          type: financialObligations.type,
          count: sql<number>`COUNT(CASE WHEN ${remainingCents} > 0 THEN 1 END)`.as("item_count"),
          remainingCents: sql<number>`SUM(${remainingCents})`.as("remaining_cents"),
        }).from(financialObligations).leftJoin(paidTotals, eq(financialObligations.id, paidTotals.obligationId))
          .where(and(baseWhere, lte(financialObligations.dueDate, throughDate))).groupBy(bucket, financialObligations.type),
        db.select({ id: financialObligations.id, description: financialObligations.description, customerName: customers.name, type: financialObligations.type, dueDate: financialObligations.dueDate, installmentNumber: financialObligations.installmentNumber, installmentCount: financialObligations.installmentCount, remainingCents: remainingCents.as("remaining_cents") })
          .from(financialObligations).leftJoin(paidTotals, eq(financialObligations.id, paidTotals.obligationId))
          .leftJoin(customers, and(eq(customers.id, financialObligations.customerId), eq(customers.userId, user.dataOwnerId)))
          .where(and(baseWhere, lt(financialObligations.dueDate, today), lte(financialObligations.dueDate, throughDate), gt(remainingCents, 0)))
          .orderBy(financialObligations.dueDate, financialObligations.id).limit(5),
        db.select({ id: financialObligations.id, description: financialObligations.description, customerName: customers.name, type: financialObligations.type, dueDate: financialObligations.dueDate, installmentNumber: financialObligations.installmentNumber, installmentCount: financialObligations.installmentCount, remainingCents: remainingCents.as("remaining_cents") })
          .from(financialObligations).leftJoin(paidTotals, eq(financialObligations.id, paidTotals.obligationId))
          .leftJoin(customers, and(eq(customers.id, financialObligations.customerId), eq(customers.userId, user.dataOwnerId)))
          .where(and(baseWhere, gte(financialObligations.dueDate, today), lte(financialObligations.dueDate, throughDate), gt(remainingCents, 0)))
          .orderBy(financialObligations.dueDate, financialObligations.id).limit(5),
      ]);
      const summary = summarizeObligationRows(totals as ObligationSummaryRow[]);
      const withBucket = (source: typeof overdue, value: "overdue" | "upcoming") => source.flatMap(row =>
        row.type === "receivable" || row.type === "payable" ? [{ ...row, type: row.type as "receivable" | "payable", bucket: value }] : [],
      );
      const rows = [...withBucket(overdue, "overdue"), ...withBucket(upcoming, "upcoming")];
      return jsonResponse({ answer: obligationAnswer(rows, summary, throughDate, now) });
    }
    const day = topic === "tomorrow" ? moveDay(today, 1) : today;
    const rows = await getDb().select({ id: appointments.id, title: appointments.title, customerName: appointments.customerName, startsAt: appointments.startsAt, endsAt: appointments.endsAt, status: appointments.status }).from(appointments)
      .where(and(eq(appointments.userId, user.dataOwnerId), lt(appointments.startsAt, moveDay(day, 1) + "T00:00"), gt(appointments.endsAt, day + "T00:00"), ne(appointments.status, "Cancelado")));
    return jsonResponse({ answer: agendaAnswer(rows as Appointment[], topic, now) });
  } catch (error) { return requestError(error, "Não foi possível consultar os dados agora. Tente novamente."); }
}
