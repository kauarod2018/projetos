import type { FinanceTransaction, Quote } from "./models";

export function financeSummary(quotes: Quote[], transactions: FinanceTransaction[], month: string) {
  let income = 0, expenses = 0, receivable = 0;
  const linked = new Set(transactions.map(item => item.quoteId).filter(Boolean));
  for (const item of transactions) {
    if (item.transactionDate.slice(0, 7) !== month) continue;
    if (item.type === "income") income += item.amountCents;
    else expenses += item.amountCents;
  }
  for (const quote of quotes) {
    if (["Aprovado", "Em andamento", "Finalizado"].includes(quote.status)) receivable += quote.totalCents;
  }
  // A document status is not a dated ledger entry, especially for legacy records.
  const unlinkedPaid = quotes.filter(quote => quote.status === "Pago" && !linked.has(quote.id));
  return { income, expenses, receivable, balance: income - expenses, unlinkedPaid };
}
