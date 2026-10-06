import type { Quote } from "./models";

export type ReceiptQuote = Pick<Quote, "id" | "status" | "totalCents"> & { client: { name: string } };
export type ReceiptCandidate = ReceiptQuote & { description: string };
export type ReceiptCandidates = { records: ReceiptCandidate[]; nextCursor: number | null; total: number };

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");

export function receiptCandidates(quotes: Quote[], receivedIds: Set<number>, search: string, cursor?: number, amountCents?: number): ReceiptCandidates {
  const terms = normalize(search.trim()).split(/\s+/).filter(Boolean);
  const matches = quotes.filter(quote => (amountCents === undefined
    ? ["Aprovado", "Em andamento", "Finalizado", "Pago"].includes(quote.status)
    : ["Aprovado", "Em andamento", "Finalizado"].includes(quote.status))
    && quote.totalCents > 0 && quote.totalCents <= 100_000_000_000 && Number.isSafeInteger(quote.totalCents)
    && (amountCents === undefined || quote.totalCents === amountCents)
    && !receivedIds.has(quote.id)
    && terms.every(term => normalize(`${quote.client.name} ${quote.description} #${quote.id}`).includes(term)))
    .sort((a, b) => b.id - a.id);
  const page = matches.filter(quote => cursor === undefined || quote.id < cursor).slice(0, 21);
  const records = page.slice(0, 20).map(quote => ({ id: quote.id, client: { name: quote.client.name },
    description: quote.description, status: quote.status, totalCents: quote.totalCents }));
  return { records, total: matches.length, nextCursor: page.length > 20 ? records[19].id : null };
}
