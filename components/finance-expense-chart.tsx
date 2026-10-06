"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { formatMoney, type FinanceTransaction } from "@/lib/models";
import { expenseCategories } from "@/lib/transaction-categories";

const categoryColors = ["#2f62f5", "#12a37f", "#f59e0b", "#7c5cff", "#ef4f6b", "#10b5c9", "#d97706", "#9b9993"];

export function FinanceExpenseChart({ transactions, month }: { transactions: FinanceTransaction[]; month: string }) {
  const categories = useMemo(() => {
    const totals = new Map<string, number>();
    for (const item of transactions) {
      if (item.type !== "expense" || item.transactionDate.slice(0, 7) !== month) continue;
      const category = expenseCategories.includes(item.category as typeof expenseCategories[number]) ? item.category! : "Outros";
      totals.set(category, (totals.get(category) ?? 0) + item.amountCents);
    }
    return [...totals].map(([category, amountCents]) => ({ category, amountCents }))
      .sort((a, b) => b.amountCents - a.amountCents || a.category.localeCompare(b.category, "pt-BR"));
  }, [transactions, month]);
  const total = categories.reduce((sum, item) => sum + item.amountCents, 0);
  const chartConfig = { expenses: { label: "Despesas", color: "var(--chart-1)" } };

  return <section className="rounded-[18px] border border-[var(--vemo-line)] bg-white p-5" aria-labelledby="finance-expense-chart-title">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div><h2 id="finance-expense-chart-title" className="text-lg font-semibold">Para onde foi o seu dinheiro</h2><p className="mt-1 text-sm text-[var(--vemo-muted)]">Saídas do mês por categoria</p></div>
      <p className="text-sm font-semibold tabular-nums">Total · {formatMoney(total)}</p>
    </div>
    {categories.length ? <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(220px,1fr)] lg:items-center">
      <ChartContainer config={chartConfig} className="h-[280px] w-full aspect-auto" role="img" aria-label={`Gráfico de despesas por categoria, total de ${formatMoney(total)}`}>
        <BarChart data={categories} layout="vertical" margin={{ top: 4, right: 8, bottom: 0, left: 2 }} accessibilityLayer>
          <CartesianGrid horizontal={false} strokeDasharray="3 3" />
          <XAxis type="number" tickFormatter={value => formatMoney(Number(value))} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="category" width={125} interval={0} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
          <Tooltip formatter={value => formatMoney(Number(value))} cursor={{ fill: "#f3f4f6" }} />
          <Bar dataKey="amountCents" name="Despesas" radius={[0, 4, 4, 0]}>
            {categories.map((item, index) => <Cell key={item.category} fill={categoryColors[index % categoryColors.length]} />)}
          </Bar>
        </BarChart>
      </ChartContainer>
      <ul aria-label="Totais de despesas por categoria" className="divide-y divide-gray-100">{categories.map((item, index) => <li key={item.category} className="flex items-center justify-between gap-3 py-3 text-sm"><span className="flex min-w-0 items-center gap-2"><span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: categoryColors[index % categoryColors.length] }} aria-hidden="true" /><span className="break-words">{item.category}</span></span><span className="shrink-0 font-semibold tabular-nums">{formatMoney(item.amountCents)}</span></li>)}</ul>
      <ul className="sr-only">{categories.map(item => <li key={item.category}>{item.category}: {formatMoney(item.amountCents)}</li>)}</ul>
    </div> : <p className="mt-5 border-t border-[var(--vemo-line)] py-6 text-sm text-[var(--vemo-muted)]">Nenhuma despesa registrada neste mês.</p>}
  </section>;
}
