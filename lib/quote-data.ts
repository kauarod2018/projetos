import { and, desc, eq, isNull, type SQL } from "drizzle-orm";

import { getDb } from "@/db";
import { customers, quoteItems, quotes, users } from "@/db/schema";
import type { Quote, QuoteStatus } from "@/lib/models";
import { readClientSnapshot } from "@/lib/quote-editing";
import { parseBusinessProfile } from "@/lib/business-profile";
import { createStaticPixPayment } from "@/lib/pix";

async function loadMatchingQuotes(condition: SQL): Promise<Quote[]> {
  const db = getDb();
  const [quoteRows, itemRows] = await Promise.all([
    db
      .select({
        id: quotes.id,
        customerId: quotes.customerId,
        clientSnapshot: quotes.clientSnapshot,
        businessProfile: users.businessProfile,
        description: quotes.description,
        status: quotes.status,
        validUntil: quotes.validUntil,
        deadline: quotes.deadline,
        paymentMethod: quotes.paymentMethod,
        discountCents: quotes.discountCents,
        createdAt: quotes.createdAt,
        updatedAt: quotes.updatedAt,
        sentAt: quotes.sentAt,
        approvedAt: quotes.approvedAt,
        archivedAt: quotes.archivedAt,
        publicToken: quotes.publicToken,
        ownerName: users.name,
        clientId: customers.id,
        clientName: customers.name,
        clientPhone: customers.phone,
        clientEmail: customers.email,
        clientAddress: customers.address,
        clientNotes: customers.notes,
        clientCreatedAt: customers.createdAt,
      })
      .from(quotes)
      .innerJoin(customers, and(eq(quotes.customerId, customers.id), eq(quotes.userId, customers.userId)))
      .innerJoin(users, eq(quotes.userId, users.id))
      .where(condition)
      .orderBy(desc(quotes.createdAt), desc(quotes.id)),
    db
      .select({
        id: quoteItems.id,
        quoteId: quoteItems.quoteId,
        kind: quoteItems.kind,
        description: quoteItems.description,
        quantity: quoteItems.quantity,
        unitPriceCents: quoteItems.unitPriceCents,
      })
      .from(quoteItems)
      .innerJoin(quotes, eq(quoteItems.quoteId, quotes.id))
      .where(condition)
      .orderBy(quoteItems.id),
  ]);

  const itemsByQuote = new Map<number, Quote["items"]>();
  for (const item of itemRows) {
    const items = itemsByQuote.get(item.quoteId) ?? [];
    items.push({ ...item, kind: item.kind as "service" | "material" });
    itemsByQuote.set(item.quoteId, items);
  }

  return quoteRows.map((row) => {
    const items = itemsByQuote.get(row.id) ?? [];
    const subtotalCents = items.reduce(
      (sum, item) => sum + Math.round(item.quantity * item.unitPriceCents),
      0,
    );
    const totalCents = Math.max(0, subtotalCents - row.discountCents);
    const pixEligible = ["Aprovado", "Em andamento", "Finalizado"].includes(row.status) && row.paymentMethod === "Pix";
    const pixPayment = pixEligible
      ? createStaticPixPayment(parseBusinessProfile(row.businessProfile), totalCents)
      : null;

    return {
      id: row.id,
      customerId: row.customerId,
      client: {
        id: row.clientId,
        name: row.clientName,
        phone: row.clientPhone,
        email: row.clientEmail,
        address: row.clientAddress,
        notes: row.clientNotes,
        createdAt: row.clientCreatedAt,
        ...readClientSnapshot(row.clientSnapshot),
      },
      description: row.description,
      status: row.status as QuoteStatus,
      validUntil: row.validUntil,
      deadline: row.deadline,
      paymentMethod: row.paymentMethod,
      discountCents: row.discountCents,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      sentAt: row.sentAt,
      approvedAt: row.approvedAt,
      archivedAt: row.archivedAt,
      publicToken: row.publicToken,
      pixPayment,
      ownerName: row.ownerName,
      items,
      subtotalCents,
      totalCents,
    };
  });
}

export function loadQuotes(userId: number) {
  return loadMatchingQuotes(eq(quotes.userId, userId));
}

export async function loadQuote(id: number, userId: number) {
  const rows = await loadMatchingQuotes(and(eq(quotes.id, id), eq(quotes.userId, userId))!);
  return rows[0] ?? null;
}

export async function loadPublicQuote(publicToken: string) {
  const rows = await loadMatchingQuotes(and(eq(quotes.publicToken, publicToken), isNull(quotes.archivedAt))!);
  const quote = rows[0];
  if (!quote) return null;

  return {
    ...quote,
    publicToken: "",
    client: { ...quote.client, phone: "", email: "", address: "", notes: "" },
  };
}

export function databaseError(error: unknown) {
  const message = error instanceof Error ? error.message : "Erro inesperado";
  const detail = error instanceof Error && error.cause instanceof Error ? error.cause.message : "";
  const combined = `${message}\n${detail}`;

  if (/no such table|no such column|unknown column|ER_BAD_FIELD_ERROR|ER_NO_SUCH_TABLE/i.test(combined)) {
    return "A base de dados precisa das migrações desta versão. Confira o guia de atualização.";
  }

  return "Não foi possível acessar os dados agora.";
}
