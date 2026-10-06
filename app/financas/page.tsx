"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Car, ChevronLeft, ChevronRight, CircleDot, Download, FileText, Hammer, Megaphone, Package, PiggyBank, Plus, ReceiptText, RefreshCw, Search, Users, UtensilsCrossed, Wallet, Zap, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkspaceShell } from "@/components/workspace-shell";
import { formatMoney, type FinanceTransaction, type Quote } from "@/lib/models";
import { financeSummary } from "@/lib/finance-summary";
import { expenseCategories, type ExpenseCategory } from "@/lib/transaction-categories";
import { FinanceExpenseChart } from "@/components/finance-expense-chart";
import { buildFinanceCsv } from "@/lib/finance-csv";
import { FinanceMonthComparison } from "@/components/finance-month-comparison";
import { FinanceCashflowChart } from "@/components/finance-cashflow-chart";
import { FinancialObligations } from "@/components/financial-obligations";
import styles from "@/components/finance-workspace.module.css";

type Tab = "extrato" | "contas" | "relatorios";
const tabs: { value: Tab; label: string }[] = [
  { value: "extrato", label: "Extrato" },
  { value: "contas", label: "Contas a pagar e receber" },
  { value: "relatorios", label: "Relatórios" },
];
const categoryIcons: Record<ExpenseCategory, LucideIcon> = {
  "Materiais": Package,
  "Transporte": Car,
  "Ferramentas": Hammer,
  "Contas do negócio": Zap,
  "Alimentação": UtensilsCrossed,
  "Serviços terceirizados": Users,
  "Marketing": Megaphone,
  "Outros": CircleDot,
};

function parseMoney(value: string) {
  const clean = value.replace(/R\$/g, "").replace(/\s/g, "");
  const normalized = clean.includes(",") ? clean.replace(/\./g, "").replace(",", ".") : clean;
  const amount = Number(normalized);
  return Number.isFinite(amount) ? Math.max(0, Math.round(amount * 100)) : 0;
}

function today() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function shiftMonth(month: string, offset: number) {
  const [year, number] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, number - 1 + offset, 1, 12));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(month: string, style: "long" | "short" = "long") {
  const [year, number] = month.split("-").map(Number);
  const text = new Intl.DateTimeFormat("pt-BR", { month: style, year: style === "long" ? "numeric" : undefined, timeZone: "UTC" }).format(new Date(Date.UTC(year, number - 1, 1, 12)));
  return text.charAt(0).toUpperCase() + text.slice(1).replace(".", "");
}

function dayLabel(day: string, todayKey: string) {
  if (day === todayKey) return "Hoje";
  if (day === shiftDay(todayKey, -1)) return "Ontem";
  const text = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function shiftDay(day: string, offset: number) {
  return new Date(Date.parse(`${day}T12:00:00Z`) + offset * 86_400_000).toISOString().slice(0, 10);
}

function totalsFor(transactions: FinanceTransaction[], month: string) {
  let income = 0, expenses = 0;
  for (const item of transactions) {
    if (item.transactionDate.slice(0, 7) !== month) continue;
    if (item.type === "income") income += item.amountCents; else expenses += item.amountCents;
  }
  return { income, expenses, balance: income - expenses };
}

export default function FinancesPage() {
  return <WorkspaceShell><FinancesContent /></WorkspaceShell>;
}

function FinancesContent() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [month, setMonth] = useState(today().slice(0, 7));
  const [tab, setTab] = useState<Tab>("extrato");
  const [visibleCount, setVisibleCount] = useState(20);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [form, setForm] = useState({ type: "expense" as "income" | "expense", category: "Outros" as ExpenseCategory, description: "", amount: "", transactionDate: today() });
  const todayKey = today();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [quotesResponse, transactionsResponse] = await Promise.all([
        fetch("/api/quotes", { cache: "no-store" }),
        fetch("/api/transactions", { cache: "no-store" }),
      ]);
      const quotesData = (await quotesResponse.json()) as { quotes?: Quote[]; error?: string };
      const transactionsData = (await transactionsResponse.json()) as { transactions?: FinanceTransaction[]; error?: string };
      if (!quotesResponse.ok) throw new Error(quotesData.error);
      if (!transactionsResponse.ok) throw new Error(transactionsData.error);
      setQuotes(quotesData.quotes ?? []);
      setTransactions((transactionsData.transactions ?? []).map((item) => ({ ...item, type: item.type as "income" | "expense" })));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar as finanças.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  // Atalhos vindos de outras telas: /financas?novo=entrada|saida e /financas#contas.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const novo = params.get("novo");
    if (novo === "entrada" || novo === "saida") openForm(novo === "entrada" ? "income" : "expense");
    const syncHash = () => { const hash = window.location.hash.slice(1); if (tabs.some(item => item.value === hash)) setTab(hash as Tab); };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  const summary = useMemo(() => financeSummary(quotes, transactions, month), [quotes, transactions, month]);
  const previous = useMemo(() => totalsFor(transactions, shiftMonth(month, -1)), [transactions, month]);
  const history = useMemo(() => Array.from({ length: 6 }, (_, index) => {
    const key = shiftMonth(month, index - 5);
    return { key, label: monthLabel(key, "short"), ...totalsFor(transactions, key) };
  }), [transactions, month]);
  const historyMax = Math.max(1, ...history.map(item => Math.max(item.income, item.expenses)));

  const monthTransactions = useMemo(() => transactions
    .filter((item) => item.transactionDate.slice(0, 7) === month)
    .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate) || b.id - a.id),
  [transactions, month]);

  const topCategory = useMemo(() => {
    const totals = new Map<string, number>();
    for (const item of monthTransactions) if (item.type === "expense") totals.set(item.category ?? "Outros", (totals.get(item.category ?? "Outros") ?? 0) + item.amountCents);
    const [name, amount] = [...totals].sort((a, b) => b[1] - a[1])[0] ?? [];
    return name ? { name, amount: amount!, share: summary.expenses ? Math.round((amount! / summary.expenses) * 100) : 0 } : null;
  }, [monthTransactions, summary.expenses]);
  const savedShare = summary.income > 0 ? Math.round((summary.balance / summary.income) * 100) : null;
  const balanceChange = previous.balance !== 0 ? Math.round(((summary.balance - previous.balance) / Math.abs(previous.balance)) * 100) : null;

  const visibleTransactions = useMemo(() => {
    const query = search.trim().normalize("NFD").replace(/[̀-ͯ]/g, "").toLocaleLowerCase("pt-BR");
    return monthTransactions.filter((transaction) => {
      if (typeFilter !== "all" && transaction.type !== typeFilter) return false;
      if (categoryFilter !== "all" && (transaction.type !== "expense" || (transaction.category ?? "Outros") !== categoryFilter)) return false;
      if (!query) return true;
      const searchable = [transaction.description, transaction.category ?? "", transaction.transactionDate, transaction.quoteId ? `orcamento ${transaction.quoteId}` : ""]
        .join(" ").normalize("NFD").replace(/[̀-ͯ]/g, "").toLocaleLowerCase("pt-BR");
      return searchable.includes(query);
    });
  }, [monthTransactions, search, typeFilter, categoryFilter]);

  const groupedDays = useMemo(() => {
    const groups: { day: string; items: FinanceTransaction[]; total: number }[] = [];
    for (const item of visibleTransactions.slice(0, visibleCount)) {
      const day = item.transactionDate.slice(0, 10);
      let group = groups.at(-1);
      if (!group || group.day !== day) { group = { day, items: [], total: 0 }; groups.push(group); }
      group.items.push(item);
      group.total += item.type === "income" ? item.amountCents : -item.amountCents;
    }
    return groups;
  }, [visibleTransactions, visibleCount]);

  function selectTab(value: Tab) {
    setTab(value);
    window.history.replaceState(null, "", `${window.location.pathname}${value === "extrato" ? "" : `#${value}`}`);
  }

  function changeMonth(offset: number) {
    setMonth(current => shiftMonth(current, offset));
    setVisibleCount(20);
  }

  function clearMovementFilters() {
    setSearch("");
    setTypeFilter("all");
    setCategoryFilter("all");
    setVisibleCount(20);
  }

  function openForm(type: "income" | "expense") {
    setFormError("");
    setForm({ type, category: "Outros", description: "", amount: "", transactionDate: today() });
    setOpen(true);
  }

  function exportCsv() {
    const csv = `﻿${buildFinanceCsv(monthTransactions)}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `vemo-financeiro-${month}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function submitTransaction(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setFormError("");
    try {
      if (parseMoney(form.amount) <= 0) throw new Error("Informe um valor maior que zero.");
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          category: form.type === "expense" ? form.category : "Outros",
          description: form.description,
          amountCents: parseMoney(form.amount),
          transactionDate: form.transactionDate,
        }),
      });
      const data = (await response.json()) as { transaction?: FinanceTransaction; error?: string };
      if (!response.ok || !data.transaction) throw new Error(data.error);
      setTransactions((current) => [data.transaction!, ...current]);
      setMonth(form.transactionDate.slice(0, 7));
      setVisibleCount(20);
      setOpen(false);
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section className={styles.page}>
        <header className={styles.header}>
          <div>
            <h1>Financeiro</h1>
            <p>Seu dinheiro organizado: o que entrou, o que saiu e o que ainda vai entrar.</p>
          </div>
          <div className={styles.headerActions}>
            <button type="button" className={styles.incomeButton} onClick={() => openForm("income")}><ArrowDownLeft aria-hidden="true" />Entrada</button>
            <button type="button" className={styles.expenseButton} onClick={() => openForm("expense")}><ArrowUpRight aria-hidden="true" />Saída</button>
          </div>
        </header>

        <div className={styles.monthBar}>
          <button type="button" onClick={() => changeMonth(-1)} aria-label="Mês anterior" title="Mês anterior"><ChevronLeft aria-hidden="true" /></button>
          <strong aria-live="polite">{monthLabel(month)}</strong>
          <button type="button" onClick={() => changeMonth(1)} aria-label="Próximo mês" title="Próximo mês"><ChevronRight aria-hidden="true" /></button>
          {month !== todayKey.slice(0, 7) && <button type="button" className={styles.backToday} onClick={() => setMonth(todayKey.slice(0, 7))}>Voltar para este mês</button>}
        </div>

        {error && <div role="alert" className={styles.error}><p>{error}</p><Button variant="outline" className="mt-3 min-h-11" onClick={() => void loadData()}><RefreshCw className="size-4" aria-hidden="true" />Tentar novamente</Button></div>}

        {loading ? <div className={styles.overview}><Skeleton className="h-64 rounded-3xl" /><Skeleton className="h-64 rounded-3xl" /></div> : !error && <>
          <div className={styles.overview}>
            <section className={styles.balanceCard} aria-labelledby="balance-title">
              <div className={styles.cardPattern} aria-hidden="true" />
              <p id="balance-title" className={styles.cardLabel}><Wallet aria-hidden="true" />Sobrou em {monthLabel(month, "short").toLowerCase()}</p>
              <strong className={styles.cardValue} data-negative={summary.balance < 0 || undefined}>{formatMoney(summary.balance)}</strong>
              {balanceChange !== null && <span className={styles.change} data-down={balanceChange < 0 || undefined}>{balanceChange >= 0 ? "▲" : "▼"} {Math.abs(balanceChange)}% em relação ao mês anterior</span>}
              <div className={styles.split}>
                <div><span><ArrowDownLeft aria-hidden="true" />Entrou</span><b>{formatMoney(summary.income)}</b></div>
                <div><span><ArrowUpRight aria-hidden="true" />Saiu</span><b>{formatMoney(summary.expenses)}</b></div>
              </div>
              <div className={styles.ratio} role="img" aria-label={`Entrou ${formatMoney(summary.income)} e saiu ${formatMoney(summary.expenses)}`}>
                <span style={{ flexGrow: Math.max(summary.income, 1) }} /><span style={{ flexGrow: summary.expenses }} />
              </div>
            </section>

            <section className={styles.historyCard} aria-labelledby="history-title">
              <div className={styles.cardHead}><h2 id="history-title">Últimos 6 meses</h2><span className={styles.legend}><i data-kind="in" />Entrou<i data-kind="out" />Saiu</span></div>
              <ol className={styles.bars}>
                {history.map(item => <li key={item.key} data-current={item.key === month || undefined}>
                  <div className={styles.barPair} title={`${item.label}: entrou ${formatMoney(item.income)}, saiu ${formatMoney(item.expenses)}`}>
                    <span data-kind="in" style={{ height: `${Math.max(2, (item.income / historyMax) * 100)}%` }} />
                    <span data-kind="out" style={{ height: `${Math.max(2, (item.expenses / historyMax) * 100)}%` }} />
                  </div>
                  <button type="button" onClick={() => setMonth(item.key)}>{item.label}</button>
                </li>)}
              </ol>
            </section>
          </div>

          <div className={styles.insights}>
            <div className={styles.insight}>
              <span className={styles.insightIcon} data-tone="violet"><FileText aria-hidden="true" /></span>
              <p>Para receber de orçamentos</p>
              <strong>{formatMoney(summary.receivable)}</strong>
              <small>Orçamentos aprovados ainda não pagos</small>
            </div>
            <div className={styles.insight}>
              <span className={styles.insightIcon} data-tone="red"><ReceiptText aria-hidden="true" /></span>
              <p>Onde você mais gastou</p>
              <strong>{topCategory ? topCategory.name : "Nenhum gasto"}</strong>
              <small>{topCategory ? `${formatMoney(topCategory.amount)} · ${topCategory.share}% do que saiu` : "Nenhuma saída registrada neste mês"}</small>
            </div>
            <div className={styles.insight}>
              <span className={styles.insightIcon} data-tone="green"><PiggyBank aria-hidden="true" /></span>
              <p>Quanto sobrou do que entrou</p>
              <strong>{savedShare === null ? "—" : `${savedShare}%`}</strong>
              <small>{savedShare === null ? "Registre suas entradas para acompanhar" : savedShare >= 0 ? "Parte do que entrou ficou com você" : "Saiu mais do que entrou neste mês"}</small>
            </div>
          </div>

          {summary.unlinkedPaid.length > 0 && <section aria-label="Recebimentos a conferir" className={styles.unlinked}>
            <h2>{summary.unlinkedPaid.length === 1 ? "1 orçamento pago ainda não aparece no extrato" : `${summary.unlinkedPaid.length} orçamentos pagos ainda não aparecem no extrato`}</h2>
            <p>Registre o recebimento no orçamento para que o valor entre nas contas.</p>
            <div>{summary.unlinkedPaid.map(quote => <Link key={quote.id} href={`/orcamentos/${quote.id}`}>#{quote.id} · {quote.client.name}</Link>)}</div>
          </section>}
        </>}

        <div className={styles.tabs} role="tablist" aria-label="Seções do financeiro">
          {tabs.map(item => <button key={item.value} type="button" role="tab" id={`tab-${item.value}`} aria-controls={`panel-${item.value}`} aria-selected={tab === item.value} onClick={() => selectTab(item.value)}>{item.label}</button>)}
        </div>

        <div role="tabpanel" id="panel-extrato" aria-labelledby="tab-extrato" hidden={tab !== "extrato"} className={styles.statement}>
          <div className={styles.filters}>
            <div className={styles.search}>
              <Search aria-hidden="true" />
              <Label htmlFor="movement-search" className="sr-only">Buscar no extrato</Label>
              <Input id="movement-search" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setVisibleCount(20); }} placeholder="Buscar no extrato" />
            </div>
            <div className={styles.pills} role="group" aria-label="Filtrar por tipo">
              {[{ value: "all", label: "Tudo" }, { value: "income", label: "Entradas" }, { value: "expense", label: "Saídas" }].map(option => (
                <button key={option.value} type="button" aria-pressed={typeFilter === option.value} onClick={() => { setTypeFilter(option.value as typeof typeFilter); if (option.value === "income") setCategoryFilter("all"); setVisibleCount(20); }}>{option.label}</button>
              ))}
            </div>
            {typeFilter !== "income" && <select aria-label="Categoria de saída" value={categoryFilter} onChange={(event) => { setCategoryFilter(event.target.value); setVisibleCount(20); }} className={styles.categorySelect}>
              <option value="all">Todas as categorias</option>
              {expenseCategories.map(category => <option key={category} value={category}>{category}</option>)}
            </select>}
            <button type="button" className={styles.exportButton} onClick={exportCsv} disabled={loading || !!error || monthTransactions.length === 0}><Download aria-hidden="true" />Baixar planilha</button>
          </div>

          {loading ? <Skeleton className="h-48 rounded-2xl" /> : error ? null : !monthTransactions.length ? <div className={styles.empty}>
            <ReceiptText aria-hidden="true" />
            <h3>Nada registrado em {monthLabel(month).toLowerCase()}</h3>
            <p>Registre o que entrou e o que saiu para acompanhar seu dinheiro.</p>
            <div><button type="button" className={styles.incomeButton} onClick={() => openForm("income")}><Plus aria-hidden="true" />Registrar entrada</button></div>
          </div> : !visibleTransactions.length ? <div className={styles.empty}>
            <Search aria-hidden="true" /><h3>Nenhum resultado</h3><button type="button" className={styles.linkButton} onClick={clearMovementFilters}>Limpar filtros</button>
          </div> : <>
            {groupedDays.map(group => <section key={group.day} className={styles.dayGroup} aria-label={dayLabel(group.day, todayKey)}>
              <header><h3>{dayLabel(group.day, todayKey)}</h3><span data-negative={group.total < 0 || undefined}>{group.total >= 0 ? "+" : "−"} {formatMoney(Math.abs(group.total))}</span></header>
              <ul>
                {group.items.map(transaction => {
                  const income = transaction.type === "income";
                  const Icon = income ? (transaction.quoteId ? FileText : ArrowDownLeft) : categoryIcons[(transaction.category ?? "Outros") as ExpenseCategory] ?? CircleDot;
                  return <li key={transaction.id}>
                    <span className={styles.txIcon} data-kind={income ? "in" : "out"}><Icon aria-hidden="true" /></span>
                    <div className={styles.txText}>
                      <strong>{transaction.description}</strong>
                      <span>{income ? (transaction.quoteId ? <Link href={`/orcamentos/${transaction.quoteId}`}>Recebimento · Orçamento #{transaction.quoteId}</Link> : "Entrada") : transaction.category ?? "Outros"}</span>
                    </div>
                    <b className={styles.txAmount} data-kind={income ? "in" : "out"}>{income ? "+" : "−"} {formatMoney(transaction.amountCents)}</b>
                  </li>;
                })}
              </ul>
            </section>)}
            <p className={styles.count} aria-live="polite">{visibleTransactions.length} {visibleTransactions.length === 1 ? "movimentação" : "movimentações"} em {monthLabel(month).toLowerCase()}</p>
            {visibleTransactions.length > visibleCount && <div className="text-center"><button type="button" className={styles.linkButton} onClick={() => setVisibleCount((count) => count + 20)}>Mostrar mais</button></div>}
          </>}
        </div>

        <div role="tabpanel" id="panel-contas" aria-labelledby="tab-contas" hidden={tab !== "contas"} className={styles.panelStack}>
          <FinancialObligations onChanged={loadData} />
          {!loading && !error && quotes.some((quote) => ["Aprovado", "Em andamento", "Finalizado"].includes(quote.status)) && (
            <section className={styles.receivableList} aria-labelledby="quote-receivable-title">
              <h2 id="quote-receivable-title">Orçamentos aprovados para receber</h2>
              <p>Valores combinados com clientes que ainda não foram pagos.</p>
              <ul>
                {quotes.filter((quote) => ["Aprovado", "Em andamento", "Finalizado"].includes(quote.status)).map((quote) => (
                  <li key={quote.id}>
                    <span className={styles.txIcon} data-kind="wait"><FileText aria-hidden="true" /></span>
                    <div className={styles.txText}><Link href={`/orcamentos/${quote.id}`}><strong>{quote.client.name}</strong></Link><span>Orçamento #{quote.id} · {quote.status}{quote.archivedAt ? " · Arquivado" : ""}</span></div>
                    <b className={styles.txAmount}>{formatMoney(quote.totalCents)}</b>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div role="tabpanel" id="panel-relatorios" aria-labelledby="tab-relatorios" hidden={tab !== "relatorios"} className={styles.panelStack}>
          {!loading && !error ? <>
            <FinanceMonthComparison transactions={transactions} month={month} />
            <FinanceExpenseChart transactions={transactions} month={month} />
            <FinanceCashflowChart transactions={transactions} month={month} />
          </> : null}
        </div>
      </section>

      <Dialog open={open} onOpenChange={(value) => { if (!saving) setOpen(value); }}>
        <DialogContent className={`${styles.dialog} sm:max-w-md`}>
          <DialogHeader><DialogTitle>{form.type === "income" ? "Registrar entrada" : "Registrar saída"}</DialogTitle><DialogDescription>{form.type === "income" ? "Dinheiro que chegou para você." : "Dinheiro que você gastou ou pagou."}</DialogDescription></DialogHeader>
          <form className="space-y-4" onSubmit={submitTransaction}>
            <div className={styles.typeSwitch} role="radiogroup" aria-label="Tipo">
              <button type="button" role="radio" aria-checked={form.type === "income"} data-kind="in" onClick={() => setForm({ ...form, type: "income" })}><ArrowDownLeft aria-hidden="true" />Entrada</button>
              <button type="button" role="radio" aria-checked={form.type === "expense"} data-kind="out" onClick={() => setForm({ ...form, type: "expense" })}><ArrowUpRight aria-hidden="true" />Saída</button>
            </div>
            <div className={styles.amountField}>
              <Label htmlFor="transaction-amount">Valor</Label>
              <div><span>R$</span><input id="transaction-amount" name="amount" autoComplete="off" required inputMode="decimal" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="0,00" /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="transaction-description">Descrição</Label><Input id="transaction-description" name="description" autoComplete="off" required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="h-11" placeholder={form.type === "income" ? "Ex.: Pagamento da instalação" : "Ex.: Compra de materiais"} /></div>
            {form.type === "expense" ? <fieldset className="space-y-2"><legend className="text-sm font-medium">Categoria</legend><div className={styles.categoryChips}>{expenseCategories.map(category => { const Icon = categoryIcons[category]; return <button key={category} type="button" aria-pressed={form.category === category} onClick={() => setForm({ ...form, category })}><Icon aria-hidden="true" />{category}</button>; })}</div></fieldset> : null}
            <div className="space-y-2"><Label htmlFor="transaction-date">Data</Label><Input id="transaction-date" name="transactionDate" autoComplete="off" required type="date" value={form.transactionDate} onChange={(event) => setForm({ ...form, transactionDate: event.target.value })} className="h-11" /></div>
            {formError && <p role="alert" className={styles.formError}>{formError}</p>}
            <DialogFooter><Button type="button" disabled={saving} variant="outline" onClick={() => setOpen(false)} className="h-11">Cancelar</Button><Button type="submit" disabled={saving} aria-live="polite" className="h-11">{saving ? "Salvando…" : "Salvar"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
