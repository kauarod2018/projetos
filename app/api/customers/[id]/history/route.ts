import { and, desc, eq, inArray, isNull, lt } from "drizzle-orm";
import { getDb } from "@/db";
import { appointments, customers, quoteItems, quotes, transactions } from "@/db/schema";
import { authenticatedUser, requestError, unauthorizedResponse } from "@/lib/api-security";
import { HISTORY_PAGE_SIZE, historyQuerySchema } from "@/lib/customer-history";
import { jsonResponse } from "@/lib/http";
import { serviceId } from "@/lib/service-data";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await authenticatedUser(request);
    if (!user) return unauthorizedResponse();
    const id = serviceId((await context.params).id);
    if (!id) return jsonResponse({ error: "Cliente não encontrado." }, { status: 404 });
    const params = new URL(request.url).searchParams;
    const { kind, before } = historyQuerySchema.parse({ kind: params.get("kind") ?? "quotes", before: params.get("before") ?? undefined });
    const db = getDb();
    const [customer] = await db.select({ id: customers.id, name: customers.name, phone: customers.phone, email: customers.email, address: customers.address, notes: customers.notes, createdAt: customers.createdAt }).from(customers).where(and(eq(customers.id, id), eq(customers.userId, user.dataOwnerId))).limit(1);
    if (!customer) return jsonResponse({ error: "Cliente não encontrado." }, { status: 404 });
    if (kind === "receipts") {
      const rows = await db.select({ id: transactions.id, quoteId: quotes.id, description: transactions.description, amountCents: transactions.amountCents, transactionDate: transactions.transactionDate, createdAt: transactions.createdAt })
        .from(transactions).innerJoin(quotes, eq(transactions.quoteId, quotes.id))
        .where(and(eq(transactions.userId, user.dataOwnerId), eq(quotes.userId, user.dataOwnerId), eq(quotes.customerId, id), eq(transactions.type, "income"), isNull(transactions.voidedAt), isNull(transactions.reversalOfId), before ? lt(transactions.id, before) : undefined))
        .orderBy(desc(transactions.id)).limit(HISTORY_PAGE_SIZE + 1);
      const records = rows.slice(0, HISTORY_PAGE_SIZE);
      return jsonResponse({ customer, kind, records, nextCursor: rows.length > HISTORY_PAGE_SIZE ? records.at(-1)!.id : null });
    }
    if (kind === "appointments") {
      const rows = await db.select({ id: appointments.id, title: appointments.title, status: appointments.status, startsAt: appointments.startsAt, endsAt: appointments.endsAt, notes: appointments.notes }).from(appointments)
        .where(and(eq(appointments.userId, user.dataOwnerId), eq(appointments.customerId, id), before ? lt(appointments.id, before) : undefined)).orderBy(desc(appointments.id)).limit(HISTORY_PAGE_SIZE + 1);
      const records = rows.slice(0, HISTORY_PAGE_SIZE);
      return jsonResponse({ customer, kind, records, nextCursor: rows.length > HISTORY_PAGE_SIZE ? records.at(-1)!.id : null });
    }
    const rows = await db.select({ id: quotes.id, description: quotes.description, status: quotes.status, createdAt: quotes.createdAt, validUntil: quotes.validUntil, discountCents: quotes.discountCents })
      .from(quotes).where(and(eq(quotes.userId, user.dataOwnerId), eq(quotes.customerId, id), before ? lt(quotes.id, before) : undefined)).orderBy(desc(quotes.id)).limit(HISTORY_PAGE_SIZE + 1);
    const page = rows.slice(0, HISTORY_PAGE_SIZE);
    const items = page.length ? await db.select({ quoteId: quoteItems.quoteId, quantity: quoteItems.quantity, unitPriceCents: quoteItems.unitPriceCents }).from(quoteItems)
      .innerJoin(quotes, eq(quoteItems.quoteId, quotes.id)).where(and(eq(quotes.userId, user.dataOwnerId), eq(quotes.customerId, id), inArray(quotes.id, page.map(q => q.id)))) : [];
    // Match the existing quote document's per-item rounding, including fractions.
    const totals = new Map<number, number>();
    for (const item of items) totals.set(item.quoteId, (totals.get(item.quoteId) ?? 0) + Math.round(item.quantity * item.unitPriceCents));
    const records = page.map(({ discountCents, ...quote }) => ({ ...quote, totalCents: Math.max(0, (totals.get(quote.id) ?? 0) - discountCents) }));
    return jsonResponse({ customer, kind, records, nextCursor: rows.length > HISTORY_PAGE_SIZE ? records.at(-1)!.id : null });
  } catch (error) { return requestError(error, "Não foi possível carregar o histórico deste cliente."); }
}
