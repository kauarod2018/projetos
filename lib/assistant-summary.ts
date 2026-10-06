import { brasiliaDay, moveDay } from "./appointments";
import type { Appointment } from "./appointments";
import { formatDate, formatMoney } from "./models";
import type { Quote, FinanceTransaction } from "./models";
import type { AssistantAnswer, ObligationBuckets } from "./assistant-topics";
import { assistantMonthPeriod } from "./assistant-period";

function sumMoney(values: number[]) {
  const total = values.reduce((sum, value) => sum + BigInt(value), BigInt(0));
  if (total > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("TOTAL_OUT_OF_RANGE");
  return Number(total);
}

export function agendaAnswer(rows: Pick<Appointment, "id" | "title" | "customerName" | "startsAt" | "endsAt" | "status">[], topic: "today" | "tomorrow", now: Date): AssistantAnswer {
  const day = moveDay(brasiliaDay(now), topic === "tomorrow" ? 1 : 0);
  const items = rows.filter(row => row.status !== "Cancelado" && row.startsAt < `${moveDay(day, 1)}T00:00` && row.endsAt > `${day}T00:00`).sort((a, b) => a.startsAt.localeCompare(b.startsAt) || a.id - b.id);
  const href = `/agenda?data=${day}`;
  return { topic, title: topic === "today" ? "Agenda de hoje" : "Agenda de amanhã", period: `${formatDate(day)} · Brasília`, source: "Agenda · sem compromissos cancelados", checkedAt: now.toISOString(), count: items.length, href, empty: "Nenhum compromisso registrado para este dia.", records: items.slice(0, 10).map(row => ({ id: row.id, title: row.title, detail: `${row.customerName} · ${row.status}`, value: `${row.startsAt.slice(0, 10) < day ? `${formatDate(row.startsAt)} ` : ""}${row.startsAt.slice(11)} até ${row.endsAt.slice(0, 10) > day ? `${formatDate(row.endsAt)} ` : ""}${row.endsAt.slice(11)}`, href })) };
}

export function incomeAnswer(rows: FinanceTransaction[], now: Date): AssistantAnswer {
  const today = brasiliaDay(now), start = today.slice(0, 7) + "-01";
  const items = rows.filter(row => row.type === "income" && row.transactionDate >= start && row.transactionDate <= today).sort((a, b) => b.transactionDate.localeCompare(a.transactionDate) || b.id - a.id);
  return { topic: "income", title: "Entradas do mês", period: `${formatDate(start)} a ${formatDate(today)} · Brasília`, source: "Financeiro · entradas pela data registrada, sem somar orçamentos novamente", checkedAt: now.toISOString(), count: items.length, totalCents: sumMoney(items.map(row => row.amountCents)), href: "/financas", empty: "Nenhuma entrada registrada neste período.", records: items.slice(0, 10).map(row => ({ id: row.id, title: row.description, detail: formatDate(row.transactionDate), value: formatMoney(row.amountCents), href: row.quoteId ? `/orcamentos/${row.quoteId}` : "/financas" })) };
}

export function expensesAnswer(rows: FinanceTransaction[], now: Date, month?: string): AssistantAnswer {
  const period = assistantMonthPeriod(now, month);
  if (!period) throw new Error("INVALID_MONTH");
  const items = rows.filter(row => row.type === "expense" && row.transactionDate >= period.start && row.transactionDate <= period.end)
    .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate) || b.id - a.id);
  const categories = new Map<string, { amountCents: number[]; count: number }>();
  for (const item of items) {
    const category = item.category || "Outros", current = categories.get(category) ?? { amountCents: [], count: 0 };
    current.amountCents.push(item.amountCents); current.count++; categories.set(category, current);
  }
  const expenseCategories = [...categories].map(([category, value]) => ({ category, amountCents: sumMoney(value.amountCents), count: value.count }))
    .sort((a, b) => b.amountCents - a.amountCents || a.category.localeCompare(b.category, "pt-BR"));
  return { topic: "expenses", month: period.month, title: "Saídas do mês", period: `${formatDate(period.start)} a ${formatDate(period.end)} · Brasília`, source: "Financeiro · despesas registradas pela data do lançamento", checkedAt: now.toISOString(), count: items.length, totalCents: sumMoney(items.map(row => row.amountCents)), expenseCategories, href: "/financas", empty: "Nenhuma despesa registrada neste período.", records: items.slice(0, 10).map(row => ({ id: row.id, title: row.description, detail: `${formatDate(row.transactionDate)} · ${row.category || "Outros"}`, value: formatMoney(row.amountCents), href: "/financas" })) };
}

export function cashflowAnswer(rows: FinanceTransaction[], now: Date, month?: string): AssistantAnswer {
  const period = assistantMonthPeriod(now, month);
  if (!period) throw new Error("INVALID_MONTH");
  const { start, end } = period;
  const items = rows.filter(row => (row.type === "income" || row.type === "expense") && row.transactionDate >= start && row.transactionDate <= end)
    .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate) || b.id - a.id);
  const incomeCents = sumMoney(items.filter(row => row.type === "income").map(row => row.amountCents));
  const expenseCents = sumMoney(items.filter(row => row.type === "expense").map(row => row.amountCents));
  return {
    topic: "cashflow", month: period.month, title: "Resumo financeiro do mês", period: `${formatDate(start)} a ${formatDate(end)} · Brasília`,
    source: "Financeiro · pela data dos lançamentos, sem valores futuros nem somar orçamentos novamente. Não é saldo bancário nem previsão de quanto você pode gastar.",
    checkedAt: now.toISOString(), count: items.length, cashflow: { incomeCents, expenseCents, differenceCents: incomeCents - expenseCents },
    href: "/financas", empty: "Nenhuma entrada ou saída registrada neste período.",
    records: items.slice(0, 10).map(row => ({ id: row.id, title: row.description, detail: formatDate(row.transactionDate), value: `${row.type === "income" ? "Entrada" : "Saída"} · ${formatMoney(row.amountCents)}`, href: row.quoteId ? `/orcamentos/${row.quoteId}` : "/financas" })),
  };
}

export function quoteAnswer(rows: Quote[], topic: "receivable" | "followups", now: Date): AssistantAnswer {
  const today = brasiliaDay(now);
  const items = topic === "receivable" ? receivableQuotes(rows).sort((a, b) => b.totalCents - a.totalCents || a.id - b.id) : rows.filter(row => {
    if (row.status !== "Enviado" || row.validUntil < today || !row.sentAt) return false;
    const sent = new Date(row.sentAt);
    return Number.isFinite(sent.getTime()) && Date.parse(today) - Date.parse(brasiliaDay(sent)) >= 3 * 86400000;
  }).sort((a, b) => a.sentAt!.localeCompare(b.sentAt!) || a.id - b.id);
  return { topic, title: topic === "receivable" ? "Valores a receber" : "Orçamentos sem resposta", period: `Posição em ${formatDate(today)} · Brasília`, source: topic === "receivable" ? "Orçamentos aprovados e ainda não quitados · sem classificação de atraso" : "Orçamentos enviados há 3 dias ou mais, ainda dentro da validade", checkedAt: now.toISOString(), count: items.length, ...(topic === "receivable" ? { totalCents: sumMoney(items.map(row => row.totalCents)) } : {}), href: topic === "receivable" ? "/financas" : "/orcamentos?filtro=retornos", empty: topic === "receivable" ? "Nenhum valor a receber nestes orçamentos." : "Nenhum orçamento atende a este critério de acompanhamento.", records: items.slice(0, 10).map(row => ({ id: row.id, title: row.client.name, detail: `Orçamento #${row.id} · ${row.status}`, value: formatMoney(row.totalCents), href: `/orcamentos/${row.id}` })) };
}

function receivableQuotes(rows: Quote[]) {
  return rows.filter(row => ["Aprovado", "Em andamento", "Finalizado"].includes(row.status) && row.totalCents > 0);
}

export function receivableClientsAnswer(rows: Quote[], now: Date): AssistantAnswer {
  const groups = new Map<number, { customerId: number; name: string; amounts: number[]; quotes: number }>();
  const eligible = receivableQuotes(rows);
  for (const row of eligible) {
    const group = groups.get(row.customerId) ?? { customerId: row.customerId, name: row.client.name, amounts: [], quotes: 0 };
    group.amounts.push(row.totalCents);
    group.quotes++;
    groups.set(row.customerId, group);
  }
  const clients = [...groups.values()].map(group => ({ ...group, totalCents: sumMoney(group.amounts) }))
    .sort((a, b) => b.totalCents - a.totalCents || a.name.localeCompare(b.name, "pt-BR") || a.customerId - b.customerId);
  return {
    topic: "receivableClients", title: "Clientes com valores a receber", period: `Posição em ${formatDate(brasiliaDay(now))} · Brasília`,
    source: "Orçamentos aprovados, em andamento ou finalizados ainda não marcados como pagos. Agrupados por cadastro; não indica atraso nem confirma saldo bancário.",
    checkedAt: now.toISOString(), count: clients.length, totalCents: sumMoney(eligible.map(row => row.totalCents)),
    href: "/financas", empty: "Nenhum cliente com valor a receber nestes orçamentos.",
    records: clients.slice(0, 10).map(group => ({
      id: group.customerId, title: group.name,
      detail: `${group.quotes} ${group.quotes === 1 ? "orçamento" : "orçamentos"} · cadastro #${group.customerId}`,
      value: formatMoney(group.totalCents), href: `/clientes/${group.customerId}`,
    })),
  };
}

type AssistantObligationRow = {
  id: number;
  description: string;
  customerName: string | null;
  type: "receivable" | "payable";
  dueDate: string;
  installmentNumber: number;
  installmentCount: number;
  remainingCents: number;
  bucket: "overdue" | "upcoming";
};

export function obligationAnswer(rows: AssistantObligationRow[], buckets: ObligationBuckets, throughDate: string, now: Date): AssistantAnswer {
  const ordered = [...rows].sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.id - b.id);
  const count = buckets.overdue.receivable.count + buckets.overdue.payable.count + buckets.upcoming.receivable.count + buckets.upcoming.payable.count;
  return {
    topic: "obligations",
    title: "Vencimentos pendentes",
    period: `Vencidas e até ${formatDate(throughDate)} · Brasília`,
    source: "Contas previstas em aberto, com pagamentos parciais descontados. Orçamentos não estão somados aqui.",
    checkedAt: now.toISOString(),
    count,
    obligations: buckets,
    href: "/financas#contas-previstas",
    empty: "Nenhum vencimento pendente ou previsto para os próximos 7 dias.",
    records: ordered.slice(0, 10).map(row => ({
      id: row.id,
      title: row.customerName || row.description,
      detail: `${row.description} · ${row.type === "receivable" ? "A receber" : "A pagar"} · ${row.bucket === "overdue" ? "Vencida" : "Vence"} ${formatDate(row.dueDate)} · parcela ${row.installmentNumber}/${row.installmentCount}`,
      value: formatMoney(row.remainingCents),
      href: "/financas#contas-previstas",
    })),
  };
}
