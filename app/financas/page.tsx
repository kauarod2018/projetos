"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Clock3, Download, Plus, ReceiptText, RefreshCw, Search, WalletCards } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkspaceShell } from "@/components/workspace-shell";
import { formatDate, formatMoney, type FinanceTransaction, type Quote } from "@/lib/models";
import { financeSummary } from "@/lib/finance-summary";
import { expenseCategories, type ExpenseCategory } from "@/lib/transaction-categories";
import { FinanceExpenseChart } from "@/components/finance-expense-chart";
import { buildFinanceCsv } from "@/lib/finance-csv";
import { FinanceMonthComparison } from "@/components/finance-month-comparison";
import { FinanceCashflowChart } from "@/components/finance-cashflow-chart";
import { FinancialObligations } from "@/components/financial-obligations";
import styles from "@/components/finance-workspace.module.css";
import tableStyles from "@/components/finance-table.module.css";

function parseMoney(value: string) {
  const clean = value.replace(/R\$/g, "").replace(/\s/g, "");
  const normalized = clean.includes(",") ? clean.replace(/\./g, "").replace(",", ".") : clean;
  const amount = Number(normalized);
  return Number.isFinite(amount) ? Math.max(0, Math.round(amount * 100)) : 0;
}

function today() {
  const date = new Date();
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
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
  const [visibleCount, setVisibleCount] = useState(8);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [form, setForm] = useState({ type: "expense", category: "Outros" as ExpenseCategory, description: "", amount: "", transactionDate: today() });

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

  const summary = useMemo(() => financeSummary(quotes, transactions, month), [quotes, transactions, month]);

  const filteredTransactions = useMemo(() => transactions
    .filter((item) => item.transactionDate.slice(0, 7) === month)
    .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate) || b.id - a.id),
  [transactions, month]);

  const visibleTransactions = useMemo(() => {
    const query = search.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
    return filteredTransactions.filter((transaction) => {
      if (typeFilter !== "all" && transaction.type !== typeFilter) return false;
      if (categoryFilter !== "all" && (transaction.type !== "expense" || (transaction.category ?? "Outros") !== categoryFilter)) return false;
      if (!query) return true;
      const searchable = [transaction.description, transaction.category ?? "", transaction.transactionDate, transaction.quoteId ? `orcamento ${transaction.quoteId}` : ""]
        .join(" ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
      return searchable.includes(query);
    });
  }, [filteredTransactions, search, typeFilter, categoryFilter]);

  function clearMovementFilters() {
    setSearch("");
    setTypeFilter("all");
    setCategoryFilter("all");
    setVisibleCount(8);
  }

  function exportCsv() {
    const csv = `\uFEFF${buildFinanceCsv(filteredTransactions)}`;
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
      setVisibleCount(8);
      setForm({ type: "expense", category: "Outros", description: "", amount: "", transactionDate: today() });
      setOpen(false);
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section className={`${styles.page} mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8`}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Finanças</p>
            <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Financeiro</h1>
            <p className={`${styles.subtitle} mt-2 text-base`}>Caixa do mês, contas em aberto e orçamentos.</p>
          </div>
          <Button onClick={() => { setFormError(""); setOpen(true); }} className={styles.primaryAction}><Plus className="size-4" /> Registrar movimentação</Button>
        </header>

        {error && <div role="alert" className={styles.error}><p>{error}</p><Button variant="outline" className="mt-3 min-h-11" onClick={() => void loadData()}><RefreshCw className="size-4" aria-hidden="true" />Tentar novamente</Button></div>}
        {!loading && !error && summary.unlinkedPaid.length > 0 && <section aria-label="Recebimentos a conferir" className={styles.unlinked}>
          <h2 className="font-semibold">{summary.unlinkedPaid.length} orçamento(s) pago(s) sem entrada vinculada</h2>
          <p className="mt-1">O resumo soma apenas movimentações com data. Confira estes pagamentos e vincule uma entrada existente antes de criar outra.</p>
          <div className="mt-2 flex flex-wrap gap-3">{summary.unlinkedPaid.map(quote => <Link className="underline underline-offset-4" key={quote.id} href={`/orcamentos/${quote.id}`}>#{quote.id} · {quote.client.name}</Link>)}</div>
        </section>}
        <div className={styles.monthControls}>
          <div className={styles.monthField}>
            <Label htmlFor="finance-month">Mês de referência</Label>
            <Input id="finance-month" name="financeMonth" autoComplete="off" type="month" value={month} onChange={(event) => {
              if (event.target.value) { setMonth(event.target.value); setVisibleCount(8); }
            }} className={styles.monthInput} />
          </div>
          <Button type="button" variant="outline" onClick={exportCsv} disabled={loading || !!error || filteredTransactions.length === 0} className={styles.exportButton}>
            <Download aria-hidden="true" className="size-4" /> Exportar CSV
          </Button>
        </div>

        {loading ? (
          <div className={`${styles.metrics} grid gap-4 sm:grid-cols-2 lg:grid-cols-4`}>{[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-36 rounded-2xl" />)}</div>
        ) : error ? <p className="py-4 text-sm text-gray-600">Resumo indisponível. Os saldos não puderam ser conferidos.</p> : (
          <div className={`${styles.metrics} grid gap-4 sm:grid-cols-2 lg:grid-cols-4`}>
            <div className={styles.metric}><ArrowDownLeft className={styles.incomeIcon} /><p className="mt-4 text-sm text-gray-500">Entrou no mês</p><p className="mt-1 text-2xl font-semibold">{formatMoney(summary.income)}</p></div>
            <div className={styles.metric}><ArrowUpRight className={styles.expenseIcon} /><p className="mt-4 text-sm text-gray-500">Saiu no mês</p><p className="mt-1 text-2xl font-semibold">{formatMoney(summary.expenses)}</p></div>
            <div className={styles.metric}><Clock3 className={styles.receivableIcon} /><p className="mt-4 text-sm text-gray-500">Projeção dos orçamentos</p><p className="mt-1 text-2xl font-semibold">{formatMoney(summary.receivable)}</p></div>
            <div className={styles.metric}><WalletCards className={styles.balanceIcon} /><p className="mt-4 text-sm text-gray-500">O que sobrou</p><p className={`mt-1 text-2xl font-semibold ${summary.balance < 0 ? "text-red-600" : ""}`}>{formatMoney(summary.balance)}</p></div>
          </div>
        )}

        <div className={styles.movements}>
          <div className={styles.movementHeader}><h2 className="text-lg font-semibold">Movimentações do mês</h2><p className="mt-1 text-sm text-gray-500">Valores já registrados no caixa.</p></div>
          {loading ? <Skeleton className="m-5 h-32" /> : error ? <p className="p-5 text-sm text-red-800">Movimentações indisponíveis. Atualize a página para tentar novamente.</p> : filteredTransactions.length ? (
            <>
              <div className={styles.movementFilters}>
                <div className={`grid gap-3 ${typeFilter === "income" ? "sm:grid-cols-1" : "sm:grid-cols-[minmax(0,1fr)_220px]"}`}>
                  <div className="space-y-2">
                    <Label htmlFor="movement-search">Buscar movimentação</Label>
                    <div className="relative">
                      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                      <Input id="movement-search" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setVisibleCount(8); }} placeholder="Descrição, data ou orçamento" className="h-11 rounded-xl pl-9" />
                    </div>
                  </div>
                  {typeFilter !== "income" ? <div className="space-y-2">
                    <Label htmlFor="movement-category">Categoria de saída</Label>
                    <Select value={categoryFilter} onValueChange={(value) => { setCategoryFilter(value); setVisibleCount(8); }}>
                      <SelectTrigger id="movement-category" className="h-11 w-full rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent className={styles.selectContent}><SelectItem value="all">Todas as categorias</SelectItem>{expenseCategories.map(category => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent>
                    </Select>
                  </div> : null}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por tipo de movimentação">
                    {[{ value: "all", label: "Todas" }, { value: "income", label: "Entradas" }, { value: "expense", label: "Saídas" }].map(option => (
                      <Button key={option.value} type="button" size="sm" variant={typeFilter === option.value ? "default" : "outline"} aria-pressed={typeFilter === option.value} onClick={() => { setTypeFilter(option.value as typeof typeFilter); if (option.value === "income") setCategoryFilter("all"); setVisibleCount(8); }} className="min-h-10 rounded-lg">
                        {option.label}
                      </Button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500" aria-live="polite">{visibleTransactions.length} {visibleTransactions.length === 1 ? "movimentação" : "movimentações"}</p>
                </div>
              </div>
              {visibleTransactions.length ? (
            <div className={`${tableStyles.wrap} ${styles.tableInset}`}>
              <table className={tableStyles.table} aria-label="Movimentações do mês">
                <thead><tr><th scope="col" className={tableStyles.date}>Data</th><th scope="col" className={tableStyles.description}>Descrição / origem</th><th scope="col">Tipo</th><th scope="col">Categoria</th><th scope="col" className={tableStyles.amount}>Valor</th></tr></thead><tbody>
              {visibleTransactions.slice(0, visibleCount).map((transaction) => (
                <tr key={transaction.id}>
                  <td data-label="Data" className={tableStyles.date}>{formatDate(transaction.transactionDate)}</td>
                  <td data-label="Descrição / origem" className={tableStyles.description}><p className="font-medium">{transaction.description}</p>{transaction.quoteId ? <Link className={tableStyles.muted} href={`/orcamentos/${transaction.quoteId}`}>Orçamento #{transaction.quoteId}</Link> : <span className={tableStyles.muted}>Registro de caixa</span>}</td>
                  <td data-label="Tipo"><span className={`${tableStyles.badge} ${transaction.type === "income" ? tableStyles.income : tableStyles.expense}`}>{transaction.type === "income" ? <ArrowDownLeft aria-hidden="true" className="size-3" /> : <ArrowUpRight aria-hidden="true" className="size-3" />}{transaction.type === "income" ? "Entrada" : "Saída"}</span></td>
                  <td data-label="Categoria">{transaction.type === "expense" ? transaction.category ?? "Outros" : "Recebimento"}</td>
                  <td data-label="Valor" className={`${tableStyles.amount} ${transaction.type === "income" ? styles.incomeAmount : styles.expenseAmount}`}>{transaction.type === "income" ? "+ " : "- "}{formatMoney(transaction.amountCents)}</td>
                </tr>
              ))}
                </tbody>
              </table>
            </div>
              ) : (
                <div className="px-5 py-10 text-center">
                  <p className="font-medium">Nenhum resultado para os filtros escolhidos</p>
                  <Button type="button" variant="link" onClick={clearMovementFilters} className="mt-1">Limpar filtros</Button>
                </div>
              )}
              {visibleTransactions.length > visibleCount && <div className="border-t border-gray-100 p-4 text-center"><Button variant="outline" onClick={() => setVisibleCount((count) => count + 8)}>Carregar mais</Button></div>}
            </>
          ) : (
          <div className={styles.empty}><ReceiptText className="size-8" /><p className="mt-3 font-medium">Nenhuma movimentação neste mês</p></div>
          )}
        </div>

        <FinancialObligations onChanged={loadData} />
        {!loading && !error && quotes.some((quote) => ["Aprovado", "Em andamento", "Finalizado"].includes(quote.status)) && (
          <div className={styles.receivableList}>
            <h2 className="font-semibold">Projeção dos orçamentos</h2>
            <p className="mt-1 mb-4 text-sm text-gray-600">Sem data de recebimento. Pode incluir serviços já listados em contas a receber.</p>
            <div className={tableStyles.wrap}><table className={tableStyles.table} aria-label="Projeção dos orçamentos"><thead><tr><th scope="col" className={tableStyles.description}>Cliente / orçamento</th><th scope="col">Etapa</th><th scope="col" className={tableStyles.amount}>Valor do orçamento</th></tr></thead><tbody>
              {quotes.filter((quote) => ["Aprovado", "Em andamento", "Finalizado"].includes(quote.status)).map((quote) => (
                <tr key={quote.id}><td data-label="Cliente / orçamento" className={tableStyles.description}><Link href={`/orcamentos/${quote.id}`} className="font-medium">{quote.client.name}</Link><span className={tableStyles.muted}>#{quote.id}{quote.archivedAt ? " · Arquivado" : ""}</span></td><td data-label="Etapa"><span className={`${tableStyles.badge} ${tableStyles.neutral}`}>{quote.status}</span></td><td data-label="Valor do orçamento" className={tableStyles.amount}>{formatMoney(quote.totalCents)}</td></tr>
              ))}
            </tbody></table></div>
          </div>
        )}
        {!loading && !error ? <FinanceCashflowChart transactions={transactions} month={month} /> : null}
        {!loading && !error ? <FinanceExpenseChart transactions={transactions} month={month} /> : null}
        {!loading && !error ? <FinanceMonthComparison transactions={transactions} month={month} /> : null}
      </section>

      <Dialog open={open} onOpenChange={(value) => { if (!saving) setOpen(value); }}>
        <DialogContent className={`${styles.dialog} rounded-lg sm:max-w-md`}>
          <DialogHeader><DialogTitle className={styles.dialogTitle}>Registrar movimentação</DialogTitle><DialogDescription>Adicione uma entrada ou um gasto.</DialogDescription></DialogHeader>
          <form className="space-y-4" onSubmit={submitTransaction}>
            <div className="space-y-2"><Label htmlFor="transaction-type">Tipo</Label><Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value })}><SelectTrigger id="transaction-type" className="h-11 w-full rounded-xl"><SelectValue /></SelectTrigger><SelectContent className={styles.selectContent}><SelectItem value="income">Entrada</SelectItem><SelectItem value="expense">Saída</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="transaction-description">Descrição</Label><Input id="transaction-description" name="description" autoComplete="off" required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="h-11 rounded-xl" placeholder="Ex.: Compra de materiais" /></div>
            {form.type === "expense" ? <div className="space-y-2"><Label htmlFor="transaction-category">Categoria</Label><Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value as ExpenseCategory })}><SelectTrigger id="transaction-category" className="h-11 w-full rounded-xl"><SelectValue /></SelectTrigger><SelectContent className={styles.selectContent}>{expenseCategories.map(category => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent></Select></div> : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="transaction-amount">Valor (R$)</Label><Input id="transaction-amount" name="amount" autoComplete="off" required inputMode="decimal" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} className="h-11 rounded-xl" placeholder="0,00" /></div>
              <div className="space-y-2"><Label htmlFor="transaction-date">Data</Label><Input id="transaction-date" name="transactionDate" autoComplete="off" required type="date" value={form.transactionDate} onChange={(event) => setForm({ ...form, transactionDate: event.target.value })} className="h-11 rounded-xl" /></div>
            </div>
            {formError && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
            <DialogFooter><Button type="button" disabled={saving} variant="outline" onClick={() => setOpen(false)} className={styles.secondaryButton}>Cancelar</Button><Button type="submit" disabled={saving} aria-live="polite" className={styles.primaryAction}>{saving ? "Salvando…" : "Salvar movimentação"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
