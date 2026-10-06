import type { FinanceTransaction, Quote } from "./models";

export function localDateKey(date: Date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

function dateKey(date: Date, timeZone?: string) {
  return timeZone ? new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date) : localDateKey(date);
}

export function greeting(date: Date, timeZone?: string) {
  const hour = timeZone ? Number(new Intl.DateTimeFormat("en-US", { timeZone, hour: "2-digit", hourCycle: "h23" }).format(date)) : date.getHours();
  return hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
}

function calendarDay(key: string) {
  return Date.parse(`${key}T00:00:00Z`) / 86_400_000;
}

export function summarizeQuotes(quotes: Quote[], now: Date, timeZone?: string) {
  const today = dateKey(now, timeZone);
  const drafts: Quote[] = [];
  const expired: Quote[] = [];
  const followUps: { quote: Quote; days: number }[] = [];
  let awaiting = 0;
  let receivable = 0;

  for (const quote of quotes) {
    if (["Aprovado", "Em andamento", "Finalizado"].includes(quote.status)) receivable += quote.totalCents;
    if (quote.status === "Rascunho") drafts.push(quote);
    if (quote.status !== "Enviado") continue;
    // Validity belongs to the quote, not to a payment's due date.
    if (quote.validUntil.slice(0, 10) < today) {
      expired.push(quote);
      continue;
    }
    awaiting += 1;
    if (!quote.sentAt) continue;
    const sent = new Date(quote.sentAt);
    if (Number.isNaN(sent.getTime())) continue;
    const days = calendarDay(today) - calendarDay(dateKey(sent, timeZone));
    if (days >= 3) followUps.push({ quote, days });
  }
  followUps.sort((a, b) => b.days - a.days || a.quote.id - b.quote.id);
  return { drafts, expired, followUps, awaiting, receivable, pending: drafts.length + expired.length + followUps.length };
}

export function summarizeMovement(transactions: FinanceTransaction[], now: Date, timeZone?: string) {
  const today = dateKey(now, timeZone);
  let income = 0;
  let expenses = 0;
  for (const item of transactions) {
    if (item.transactionDate.slice(0, 10) !== today) continue;
    if (item.type === "income") income += item.amountCents;
    else expenses += item.amountCents;
  }
  // Only recorded transactions: quote.updatedAt is not a payment timestamp.
  return { income, expenses, balance: income - expenses };
}

export function followUpMessage(quote: Quote) {
  return `Olá, ${quote.client.name}! Tudo bem? Gostaria de saber se conseguiu avaliar o orçamento #${quote.id}. Ficou alguma dúvida ou precisa de algum ajuste? Estou à disposição.`;
}
