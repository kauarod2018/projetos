import { Minus, TrendingDown, TrendingUp } from "lucide-react";

import { formatMoney, type FinanceTransaction } from "@/lib/models";

type Totals = { income: number; expenses: number; balance: number };

function monthBefore(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const previousYear = monthNumber === 1 ? year - 1 : year;
  const previousMonth = monthNumber === 1 ? 12 : monthNumber - 1;
  return `${previousYear}-${String(previousMonth).padStart(2, "0")}`;
}

function monthName(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(year, monthNumber - 1, 1));
}

function totalsForMonth(transactions: FinanceTransaction[], month: string): Totals {
  const totals = { income: 0, expenses: 0, balance: 0 };
  for (const transaction of transactions) {
    if (transaction.transactionDate.slice(0, 7) !== month) continue;
    if (transaction.type === "income") totals.income += transaction.amountCents;
    else totals.expenses += transaction.amountCents;
  }
  totals.balance = totals.income - totals.expenses;
  return totals;
}

function changeText(current: number, previous: number, kind: "money" | "spend") {
  if (current === previous) return "Sem variação";
  if (previous === 0) {
    return current === 0 ? "Sem movimentações nos dois meses" : `Sem base anterior · ${formatMoney(Math.abs(current))} neste mês`;
  }
  const amount = formatMoney(Math.abs(current - previous));
  const percentage = Math.round((Math.abs(current - previous) / Math.abs(previous)) * 100);
  const increased = current > previous;
  const verb = kind === "spend"
    ? increased ? "Aumentaram" : "Diminuíram"
    : increased ? "Subiu" : "Caiu";
  const sign = increased ? "+" : "−";
  const percentText = kind === "money" ? "" : ` ${percentage}%`;
  return `${verb}${percentText} (${sign}${amount})`;
}

export function FinanceMonthComparison({ transactions, month }: { transactions: FinanceTransaction[]; month: string }) {
  const previousMonth = monthBefore(month);
  const current = totalsForMonth(transactions, month);
  const previous = totalsForMonth(transactions, previousMonth);
  const metrics = [
    { label: "Entradas", value: current.income, oldValue: previous.income, kind: "spend" as const, favorableWhen: 1 },
    { label: "Despesas", value: current.expenses, oldValue: previous.expenses, kind: "spend" as const, favorableWhen: -1 },
    { label: "O que sobrou", value: current.balance, oldValue: previous.balance, kind: "money" as const, favorableWhen: 1 },
  ];

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm" aria-labelledby="finance-comparison-title">
      <div className="border-b border-gray-100 pb-4">
        <h2 id="finance-comparison-title" className="text-lg font-semibold">Comparação mensal</h2>
        <p className="mt-1 text-sm text-gray-500">Movimentações registradas em relação a {monthName(previousMonth)}.</p>
      </div>
      <dl className="grid divide-y divide-gray-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {metrics.map((metric) => {
          const delta = metric.value - metric.oldValue;
          const favorable = Math.sign(delta) === metric.favorableWhen;
          const Icon = delta === 0 ? Minus : delta > 0 ? TrendingUp : TrendingDown;
          const tone = delta === 0 ? "text-gray-500" : favorable ? "text-emerald-700" : "text-rose-700";
          return (
            <div key={metric.label} className="py-4 first:sm:pr-4 sm:px-4 sm:first:pl-0 sm:last:pr-0">
              <dt className="text-sm text-gray-500">{metric.label}</dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums">{formatMoney(metric.value)}</dd>
              <p className={`mt-2 flex items-start gap-1.5 text-sm ${tone}`}>
                <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                <span>{changeText(metric.value, metric.oldValue, metric.kind)}</span>
              </p>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
