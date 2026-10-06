"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from "recharts";

import { ChartContainer } from "@/components/ui/chart";
import { formatMoney, type FinanceTransaction } from "@/lib/models";

type MonthTotal = { month: string; label: string; income: number; expenses: number; balance: number };

function precedingMonths(endMonth: string) {
  const [endYear, endMonthNumber] = endMonth.split("-").map(Number);
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(endYear, endMonthNumber - 1 - (5 - index), 1, 12));
    return {
      month: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`,
      label: new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit", timeZone: "UTC" }).format(date),
    };
  });
}

export function FinanceCashflowChart({ transactions, month }: { transactions: FinanceTransaction[]; month: string }) {
  const data = useMemo<MonthTotal[]>(() => {
    const months = precedingMonths(month).map(item => ({ ...item, income: 0, expenses: 0, balance: 0 }));
    const byMonth = new Map(months.map(item => [item.month, item]));
    for (const transaction of transactions) {
      const entry = byMonth.get(transaction.transactionDate.slice(0, 7));
      if (!entry) continue;
      if (transaction.type === "income") entry.income += transaction.amountCents;
      else entry.expenses += transaction.amountCents;
    }
    return months.map(item => ({ ...item, balance: item.income - item.expenses }));
  }, [transactions, month]);

  const hasMovements = data.some(item => item.income > 0 || item.expenses > 0);
  const config = {
    income: { label: "Entradas", color: "#12a37f" },
    expenses: { label: "Saídas", color: "#ef8a8a" },
  };

  return (
    <section className="rounded-[18px] border border-[var(--vemo-line)] bg-white p-5" aria-labelledby="finance-cashflow-title">
      <div className="border-b border-[var(--vemo-line)] pb-4">
        <h2 id="finance-cashflow-title" className="text-lg font-semibold">Entradas e saídas dos últimos 6 meses</h2>
        <p className="mt-1 text-sm text-[var(--vemo-muted)]">Entradas e saídas registradas até o mês selecionado.</p>
      </div>
      {hasMovements ? (
        <>
          <ChartContainer config={config} className="mt-4 h-[280px] w-full aspect-auto" role="img" aria-label="Gráfico de entradas e saídas registradas nos últimos seis meses">
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} accessibilityLayer>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={value => formatMoney(Number(value))} tickLine={false} axisLine={false} width={76} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value, name) => [formatMoney(Number(value ?? 0)), name === "income" ? "Entradas" : "Saídas"]} />
              <Legend formatter={value => value === "income" ? "Entradas" : "Saídas"} />
              <Bar dataKey="income" name="income" fill={config.income.color} radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="expenses" fill={config.expenses.color} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-left text-sm">
              <caption className="sr-only">Valores mensais de entradas, saídas e saldo no período exibido no gráfico</caption>
              <thead><tr className="border-b border-gray-200 text-[var(--vemo-muted)]"><th scope="col" className="py-2 pr-3 font-medium">Mês</th><th scope="col" className="px-3 py-2 text-right font-medium">Entradas</th><th scope="col" className="px-3 py-2 text-right font-medium">Saídas</th><th scope="col" className="py-2 pl-3 text-right font-medium">O que sobrou</th></tr></thead>
              <tbody>{data.map(item => <tr key={item.month} className="border-b border-[var(--vemo-line)] last:border-0"><th scope="row" className="py-3 pr-3 font-medium capitalize">{item.label}</th><td className="px-3 py-3 text-right tabular-nums">{formatMoney(item.income)}</td><td className="px-3 py-3 text-right tabular-nums">{formatMoney(item.expenses)}</td><td className={`py-3 pl-3 text-right font-medium tabular-nums ${item.balance < 0 ? "text-rose-700" : ""}`}>{formatMoney(item.balance)}</td></tr>)}</tbody>
            </table>
          </div>
        </>
      ) : <p className="py-8 text-sm text-[var(--vemo-muted)]">Nenhuma movimentação registrada neste período.</p>}
    </section>
  );
}
