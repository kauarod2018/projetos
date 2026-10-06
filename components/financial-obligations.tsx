"use client";

import { Fragment, useCallback, useEffect, useState, type FormEvent } from "react";
import { ArrowDownLeft, ArrowUpRight, CalendarClock, Plus, X, WalletCards } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate, formatMoney } from "@/lib/models";
import styles from "./finance-table.module.css";

type Obligation = {
  id: number;
  type: "receivable" | "payable";
  description: string;
  customerId: number | null;
  customerName: string | null;
  amountCents: number;
  paidCents: number;
  remainingCents: number;
  dueDate: string;
  installmentNumber: number;
  installmentCount: number;
  installmentGroup: string | null;
};
type CustomerOption = { id: number; name: string };
const localToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

export function FinancialObligations({ onChanged }: { onChanged?: () => void | Promise<void> }) {
  const [items, setItems] = useState<Obligation[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [activePayment, setActivePayment] = useState<number | null>(null);
  const [activeCancel, setActiveCancel] = useState<Obligation | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [search, setSearch] = useState("");
  const [dueFilter, setDueFilter] = useState("all");
  const [form, setForm] = useState({ type: "receivable", customerId: "", description: "", amount: "", dueDate: localToday(), installments: "1" });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [response, clientResponse] = await Promise.all([
        fetch("/api/obligations", { cache: "no-store" }),
        fetch("/api/customers", { cache: "no-store" }),
      ]);
      const [data, clientData] = await Promise.all([response.json(), clientResponse.json()]) as [
        { obligations?: Obligation[]; error?: string }, { customers?: CustomerOption[] },
      ];
      if (!response.ok) throw new Error(data.error || "Não foi possível carregar contas previstas.");
      setItems(data.obligations ?? []);
      if (!clientResponse.ok) throw new Error("Não foi possível carregar os clientes.");
      setCustomers(clientData.customers ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível carregar contas previstas.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  function cents(value: string) {
    const normalized = value.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
    const amount = Number(normalized);
    return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
  }

  async function create(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    const amountCents = cents(form.amount);
    if (!form.description.trim() || amountCents < 1) {
      setError("Informe uma descrição e um valor maior que zero.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/obligations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: form.type, customerId: form.customerId ? Number(form.customerId) : null, description: form.description.trim(), amountCents, dueDate: form.dueDate, installmentCount: Number(form.installments), requestKey: crypto.randomUUID() }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Não foi possível salvar a conta prevista.");
      setForm(current => ({ ...current, customerId: "", description: "", amount: "", installments: "1" }));
      await load();
      await onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar a conta prevista.");
    } finally {
      setSaving(false);
    }
  }

  async function pay(event: FormEvent, item: Obligation) {
    event.preventDefault();
    if (saving) return;
    const amountCents = cents(paymentAmount);
    if (amountCents < 1 || amountCents > item.remainingCents) {
      setError("O valor precisa ser positivo e não pode ultrapassar o saldo desta parcela.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/obligations/${item.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents, transactionDate: localToday(), requestKey: crypto.randomUUID() }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Não foi possível registrar o pagamento.");
      setActivePayment(null);
      setPaymentAmount("");
      await load();
      await onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível registrar o pagamento.");
    } finally {
      setSaving(false);
    }
  }

  async function cancel(item: Obligation) {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/obligations/${item.id}/cancel`, { method: "POST" });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Não foi possível cancelar esta parcela.");
      setActiveCancel(null);
      await load();
      await onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível cancelar esta parcela.");
    } finally {
      setSaving(false);
    }
  }

  const currentDay = localToday();
  const query = search.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
  const filtered = items.filter(item => {
    if (dueFilter === "overdue" && item.dueDate >= currentDay) return false;
    if (dueFilter === "today" && item.dueDate !== currentDay) return false;
    if (dueFilter === "upcoming" && item.dueDate <= currentDay) return false;
    return !query || [item.description, item.customerName ?? "", item.dueDate].join(" ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").includes(query);
  }).sort((a,b) => a.dueDate.localeCompare(b.dueDate) || a.id - b.id);
  const groups = [{ title: "A receber", rows: filtered.filter(item => item.type === "receivable"), kind: "income" }, { title: "A pagar", rows: filtered.filter(item => item.type === "payable"), kind: "expense" }];

  return <section id="contas-previstas" aria-labelledby="planned-finance-title" className="space-y-4">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="flex items-center gap-2 text-sm font-semibold text-blue-700"><CalendarClock className="size-4" aria-hidden="true" />Todos os vencimentos</p><h2 id="planned-finance-title" className="mt-1 text-lg font-semibold">Contas em aberto</h2></div>
      <WalletCards className="size-5 text-blue-700" aria-hidden="true" />
    </header>
    {error ? <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
    <details className={styles.plannedForm}><summary>Nova conta prevista</summary>
      <form onSubmit={create} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="min-w-0 space-y-2"><Label htmlFor="obligation-type">Tipo</Label><select id="obligation-type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="h-11 w-full rounded-md border border-slate-400 bg-white px-3 text-sm"><option value="receivable">A receber</option><option value="payable">A pagar</option></select></div>
        <div className="min-w-0 space-y-2"><Label htmlFor="obligation-customer">Cliente (opcional)</Label><select id="obligation-customer" value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })} className="h-11 w-full min-w-0 rounded-md border border-slate-400 bg-white px-3 text-sm"><option value="">Sem cliente vinculado</option>{customers.map(customer => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></div>
        <div className="min-w-0 space-y-2"><Label htmlFor="obligation-description">Descrição</Label><Input id="obligation-description" required maxLength={300} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Ex.: manutenção para Ana" className="h-11 bg-white" /></div>
        <div className="min-w-0 space-y-2"><Label htmlFor="obligation-amount">Valor total (R$)</Label><Input id="obligation-amount" required inputMode="decimal" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0,00" className="h-11 bg-white" /></div>
        <div className="min-w-0 space-y-2"><Label htmlFor="obligation-date">Primeiro vencimento</Label><Input id="obligation-date" type="date" required value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="h-11 bg-white" /></div>
        <div className="min-w-0 space-y-2"><Label htmlFor="obligation-installments">Parcelas</Label><Input id="obligation-installments" type="number" min="1" max="24" value={form.installments} onChange={e => setForm({ ...form, installments: e.target.value })} className="h-11 bg-white" /></div>
        <Button type="submit" disabled={saving} className="h-11 w-fit"><Plus className="size-4" aria-hidden="true" />{saving ? "Salvando..." : "Adicionar conta"}</Button>
      </form>
    </details>
    {!loading && !error && items.length > 0 && <div className={styles.filterBar}>
      <label htmlFor="obligation-search">Buscar conta<Input id="obligation-search" type="search" value={search} onChange={event => { setSearch(event.target.value); setActivePayment(null); }} placeholder="Descrição, cliente ou vencimento" className="h-11 bg-white" /></label>
      <div className="grid gap-2"><label htmlFor="obligation-filter">Vencimento</label><select id="obligation-filter" value={dueFilter} onChange={event => { setDueFilter(event.target.value); setActivePayment(null); }}><option value="all">Todos</option><option value="overdue">Vencidas</option><option value="today">Vencem hoje</option><option value="upcoming">A vencer</option></select></div>
    </div>}
    {loading ? <p role="status" className="py-5 text-sm text-slate-600">Carregando contas...</p> : error && !items.length ? <p className="py-5 text-sm text-slate-600">Contas indisponíveis. Atualize para tentar novamente.</p> : !items.length ? <p className="border-y border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-600">Nenhuma conta em aberto.</p> : !filtered.length ? <div className="py-6 text-center"><p>Nenhuma conta para estes filtros.</p><Button variant="link" onClick={() => { setSearch(""); setDueFilter("all"); }}>Limpar filtros de contas</Button></div> : groups.map(({title, rows, kind}) => <section key={title} aria-label={title} className="min-w-0">
      <div className={styles.groupHeading}><h3>{kind === "income" ? <ArrowDownLeft className="size-4 text-emerald-700" aria-hidden="true" /> : <ArrowUpRight className="size-4 text-rose-700" aria-hidden="true" />}{title} <span className="text-sm font-normal text-slate-600">({rows.length})</span></h3><p>Saldo dos resultados: <strong>{formatMoney(rows.reduce((sum,item) => sum + item.remainingCents, 0))}</strong></p></div>
      {!rows.length ? <p className="py-4 text-sm text-slate-600">Nenhuma conta neste grupo.</p> : <div className={styles.wrap}><table className={styles.table} aria-label={"Contas " + title.toLocaleLowerCase("pt-BR")}>
        <thead><tr><th scope="col" className={styles.description}>Descrição / cliente</th><th scope="col">Vencimento</th><th scope="col" className={styles.amount}>Total</th><th scope="col" className={styles.amount}>{kind === "income" ? "Recebido" : "Pago"}</th><th scope="col" className={styles.amount}>Em aberto</th><th scope="col" className={styles.actions}>Ações</th></tr></thead>
        <tbody>{rows.map(item => <Fragment key={item.id}><tr>
          <td data-label="Descrição / cliente" className={styles.description}><p className="font-medium">{item.description}</p><span className={styles.muted}>{item.customerName || "Sem cliente vinculado"}</span><span className={styles.muted}>Parcela {item.installmentNumber}/{item.installmentCount}</span></td>
          <td data-label="Vencimento">{formatDate(item.dueDate)}<span className={styles.muted}><span className={styles.badge + " " + (item.dueDate < currentDay ? styles.expense : item.dueDate === currentDay ? styles.pending : styles.neutral)}>{item.dueDate < currentDay ? "Vencida" : item.dueDate === currentDay ? "Vence hoje" : "A vencer"}</span></span>{item.paidCents > 0 && <span className={styles.muted}>Parcialmente {kind === "income" ? "recebida" : "paga"}</span>}</td>
          <td data-label="Total" className={styles.amount}>{formatMoney(item.amountCents)}</td><td data-label={kind === "income" ? "Recebido" : "Pago"} className={styles.amount}>{formatMoney(item.paidCents)}</td><td data-label="Em aberto" className={styles.amount}>{formatMoney(item.remainingCents)}</td>
          <td data-label="Ações" className={styles.actions}><div className={styles.rowActions}>
            {activePayment !== item.id && <Button type="button" variant="outline" disabled={saving} onClick={() => { setError(""); setActivePayment(item.id); setPaymentAmount((item.remainingCents / 100).toFixed(2).replace(".", ",")); }}>{kind === "income" ? "Receber" : "Pagar"}</Button>}
            <AlertDialog open={activeCancel?.id === item.id} onOpenChange={open => { if (!open && !saving) setActiveCancel(null); }}>
              <AlertDialogTrigger asChild><Button type="button" variant="ghost" size="icon" title="Cancelar parcela" aria-label={"Cancelar parcela #" + item.id} disabled={saving} onClick={() => { setError(""); setActiveCancel(item); }}><X className="size-4" aria-hidden="true" /></Button></AlertDialogTrigger>
              <AlertDialogContent className="max-h-[90dvh] overflow-y-auto rounded-lg bg-white"><AlertDialogHeader><AlertDialogTitle>Cancelar esta parcela?</AlertDialogTitle><AlertDialogDescription className="space-y-2 text-left leading-6"><span className="block break-words">{item.description} · parcela {item.installmentNumber}/{item.installmentCount}</span><span className="block">Já {kind === "income" ? "recebido" : "pago"}: {formatMoney(item.paidCents)}. O saldo de {formatMoney(item.remainingCents)} sairá das contas em aberto. Os pagamentos e o histórico serão mantidos; as demais parcelas não serão alteradas.</span></AlertDialogDescription></AlertDialogHeader>
              {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
              <AlertDialogFooter><AlertDialogCancel disabled={saving}>Manter parcela</AlertDialogCancel><AlertDialogAction variant="destructive" asChild><Button type="button" variant="destructive" disabled={saving} onClick={event => { event.preventDefault(); void cancel(item); }}>{saving ? "Cancelando..." : "Confirmar cancelamento"}</Button></AlertDialogAction></AlertDialogFooter></AlertDialogContent>
            </AlertDialog>
          </div></td>
        </tr>
        {activePayment === item.id && <tr className={styles.paymentRow}><td colSpan={6}><form className="flex flex-wrap items-end gap-3" onSubmit={event => void pay(event, item)}><div className="min-w-0 flex-1 basis-44 space-y-2"><Label htmlFor={"obligation-payment-" + item.id}>{kind === "income" ? "Valor recebido (R$)" : "Valor pago (R$)"}</Label><Input id={"obligation-payment-" + item.id} inputMode="decimal" required value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="h-11 bg-white" /></div><Button type="submit" disabled={saving} className="h-11">{saving ? "Salvando..." : kind === "income" ? "Confirmar recebimento" : "Confirmar pagamento"}</Button><Button type="button" variant="outline" className="h-11" disabled={saving} onClick={() => setActivePayment(null)}>Cancelar</Button></form></td></tr>}
        </Fragment>)}</tbody>
      </table></div>}
    </section>)}
  </section>;
}
