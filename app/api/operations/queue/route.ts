import { and, asc, eq, gte, inArray, isNotNull, lte, ne } from "drizzle-orm";
import { getDb } from "@/db";
import { appointments, customers, financialObligations, quotes, serviceReports } from "@/db/schema";
import { authenticatedUser, requestError, unauthorizedResponse } from "@/lib/api-security";
import { brasiliaDay, moveDay } from "@/lib/appointments";
import { operationsQueue } from "@/lib/operations-queue";
import { jsonResponse } from "@/lib/http";
export async function GET(request: Request) {
  try {
    const user = await authenticatedUser(request); if (!user) return unauthorizedResponse();
    const today = brasiliaDay(), db = getDb();
    const visits = await db.select({ id: appointments.id, customerId: appointments.customerId, quoteId: appointments.quoteId, employeeId: appointments.employeeId, title: appointments.title, customerName: appointments.customerName, startsAt: appointments.startsAt, status: appointments.status }).from(appointments).where(and(eq(appointments.userId, user.dataOwnerId), ne(appointments.status, "Cancelado"))).orderBy(asc(appointments.startsAt)).limit(2000);
    const docs = await db.select({ id: quotes.id, customerId: quotes.customerId, customerName: customers.name, status: quotes.status }).from(quotes).innerJoin(customers, and(eq(customers.id, quotes.customerId), eq(customers.userId, user.dataOwnerId))).where(and(eq(quotes.userId, user.dataOwnerId), inArray(quotes.status, ["Aprovado", "Em andamento", "Finalizado"]))).limit(1000);
    const charges = await db.select({ quoteId: financialObligations.quoteId, status: financialObligations.status }).from(financialObligations).where(and(eq(financialObligations.userId, user.dataOwnerId), isNotNull(financialObligations.quoteId))).limit(2000);
    const returns = await db.select({ appointmentId: serviceReports.appointmentId, customerId: appointments.customerId, customerName: appointments.customerName, title: appointments.title, nextVisitOn: serviceReports.nextVisitOn, startsAt: appointments.startsAt }).from(serviceReports).innerJoin(appointments, and(eq(appointments.id, serviceReports.appointmentId), eq(appointments.userId, user.dataOwnerId))).where(and(eq(serviceReports.userId, user.dataOwnerId), eq(appointments.status, "Concluído"), isNotNull(serviceReports.nextVisitOn), lte(serviceReports.nextVisitOn, moveDay(today, 7)))).limit(250);
    // Absence of a match is not evidence when the related query was capped.
    const tasks = operationsQueue(visits, visits.length === 2000 || charges.length === 2000 ? [] : docs, charges, visits.length === 2000 ? [] : returns.filter((row): row is typeof row & { nextVisitOn: string } => row.nextVisitOn !== null), today, user.workspace?.kind === "company");
    const [firstCustomer] = await db.select({ id: customers.id }).from(customers).where(eq(customers.userId, user.dataOwnerId)).limit(1);
    const [firstQuote] = await db.select({ id: quotes.id }).from(quotes).where(eq(quotes.userId, user.dataOwnerId)).limit(1);
    return jsonResponse({ tasks: tasks.slice(0, 8), total: tasks.length, truncated: visits.length === 2000 || docs.length === 1000 || charges.length === 2000 || returns.length === 250, firstRun: !firstQuote && !visits.length, hasCustomer: Boolean(firstCustomer) });
  } catch (error) { return requestError(error, "Não foi possível organizar as próximas ações."); }
}
