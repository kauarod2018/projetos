"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { brasiliaDay } from "@/lib/appointments";
import { formatDate, formatMoney, type FinanceTransaction } from "@/lib/models";
import { expenseCategories, type ExpenseCategory } from "@/lib/transaction-categories";

function parseMoney(value: string) {
  const clean = value.replace(/R\$/g, "").replace(/\s/g, "");
  const normalized = clean.includes(",") ? clean.replace(/\./g, "").replace(",", ".") : clean;
  const amount = Number(normalized);
  return Number.isFinite(amount) ? Math.max(0, Math.round(amount * 100)) : 0;
}

type ExpenseRequest = { description: string; amountCents: number };

export function AssistantExpense({ onBack, locked, onLockChange, request }: { onBack: () => void; locked: boolean; onLockChange: (value: boolean) => void; request?: ExpenseRequest }) {
  const [description, setDescription] = useState(request?.description ?? "");
  const [category, setCategory] = useState<ExpenseCategory>("Outros");
  const [amount, setAmount] = useState(request ? (request.amountCents / 100).toFixed(2).replace(".", ",") : "");
  const [date, setDate] = useState(brasiliaDay());
  const [review, setReview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<FinanceTransaction | null>(null);
  const requestKey = useRef<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, [review, saved]);
  function submit(event: FormEvent) {
    event.preventDefault();
    if (parseMoney(amount) <= 0) { setError("Informe um valor maior que zero."); return; }
    if (!date || !description.trim()) { setError("Preencha a descrição, o valor e a data."); return; }
    setError(""); requestKey.current ??= crypto.randomUUID(); setReview(true);
  }
  async function confirm() {
    if (saving || !requestKey.current) return;
    setSaving(true); onLockChange(true); setError("");
    try {
      const response = await fetch("/api/transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "expense", category, description: description.trim(), amountCents: parseMoney(amount), transactionDate: date, requestKey: requestKey.current }) });
      const data = await response.json() as { transaction?: FinanceTransaction; error?: string };
      if (!response.ok || !data.transaction) throw new Error(data.error || "Não foi possível salvar a despesa.");
      setSaved(data.transaction); setReview(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível salvar a despesa. Tente novamente.");
    } finally { setSaving(false); onLockChange(false); }
  }
  if (saved) return <div className="py-6">
    <h2 ref={heading} tabIndex={-1} className="flex items-center gap-2 text-lg font-semibold text-emerald-800 outline-offset-2"><CheckCircle2 className="size-5" aria-hidden="true" />Despesa registrada</h2>
    <p className="mt-4 break-words font-medium">{saved.description}</p>
    <p className="mt-1 text-2xl font-semibold tabular-nums text-red-700">{formatMoney(saved.amountCents)}</p>
    <p className="mt-1 text-sm text-gray-600">{formatDate(saved.transactionDate)}</p>
    <div className="mt-5 flex flex-wrap gap-2"><Button asChild className="h-11"><Link href="/financas">Abrir Financeiro<ArrowRight className="size-4" /></Link></Button><Button variant="outline" className="h-11" onClick={onBack}>Voltar à Assistente</Button></div>
  </div>;
  if (review) return <div className="py-5">
    <Button variant="ghost" className="mb-4 h-11 px-0" disabled={saving} onClick={() => { setReview(false); setError(""); }}><ArrowLeft className="size-4" />Editar despesa</Button>
    <h2 ref={heading} tabIndex={-1} className="text-lg font-semibold outline-offset-2">Confira antes de registrar</h2>
    <dl className="my-5 space-y-4 text-sm"><div><dt className="text-gray-500">Descrição</dt><dd className="mt-1 break-words font-semibold">{description.trim()}</dd></div><div><dt className="text-gray-500">Categoria</dt><dd className="mt-1 font-medium">{category}</dd></div><div><dt className="text-gray-500">Valor</dt><dd className="mt-1 text-xl font-semibold text-red-700">{formatMoney(parseMoney(amount))}</dd></div><div><dt className="text-gray-500">Data</dt><dd className="mt-1 font-medium">{formatDate(date)}</dd></div></dl>
    {error ? <p role="alert" className="mb-4 border-l-4 border-red-600 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
    <p className="mb-5 text-sm leading-6 text-gray-600">A confirmação adiciona esta despesa ao Financeiro. Você poderá conferi-la na lista de movimentações.</p>
    <Button className="h-11 w-full" disabled={saving || locked} onClick={() => void confirm()}>{saving ? "Registrando…" : "Confirmar despesa"}</Button>
  </div>;
  return <div className="py-5">
    <Button variant="ghost" className="mb-4 h-11 px-0" onClick={onBack}><ArrowLeft className="size-4" />Voltar às consultas</Button>
    <h2 ref={heading} tabIndex={-1} className="text-lg font-semibold outline-offset-2">Registrar uma despesa</h2>
    <p className="mt-1 text-sm leading-6 text-gray-600">{request ? "Confira descrição, categoria, valor e data antes de salvar." : "Informe o gasto e confira os dados antes de salvar."}</p>
    <form className="mt-5 space-y-4" onSubmit={submit} noValidate>
      <div className="space-y-2"><Label htmlFor="assistant-expense-description">Descrição</Label><Input id="assistant-expense-description" value={description} maxLength={200} autoComplete="off" required onChange={event => setDescription(event.target.value)} placeholder="Ex.: Material para serviço" className="h-11" /></div>
      <div className="space-y-2"><Label htmlFor="assistant-expense-category">Categoria</Label><select id="assistant-expense-category" value={category} onChange={event => setCategory(event.target.value as ExpenseCategory)} className="h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-base focus-visible:outline-2 focus-visible:outline-blue-600">{expenseCategories.map(item => <option key={item} value={item}>{item}</option>)}</select></div>
      <div className="space-y-2"><Label htmlFor="assistant-expense-amount">Valor (R$)</Label><Input id="assistant-expense-amount" value={amount} inputMode="decimal" autoComplete="off" required onChange={event => setAmount(event.target.value)} placeholder="Ex.: 45,90" className="h-11" /></div>
      <div className="space-y-2"><Label htmlFor="assistant-expense-date">Data</Label><Input id="assistant-expense-date" type="date" value={date} required onChange={event => setDate(event.target.value)} className="h-11" /></div>
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
      <Button type="submit" className="h-11 w-full">Revisar despesa<ArrowRight className="size-4" /></Button>
    </form>
  </div>;
}
