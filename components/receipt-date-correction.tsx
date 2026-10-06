"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { brasiliaDay } from "@/lib/appointments";
import { formatDate, formatMoney, type FinanceTransaction } from "@/lib/models";
import type { ReceiptDateCorrection as Correction } from "@/lib/quote-receipts";

export function ReceiptDateCorrection({ receipt, corrections, onUpdated }: {
  receipt: FinanceTransaction; corrections: Correction[]; onUpdated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(receipt.transactionDate);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const busy = useRef(false);
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);
  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy.current || !confirmed || conflict || !receipt.receiptVersion) return;
    busy.current = true; setSaving(true); setError("");
    try {
      const response = await fetch(`/api/quotes/${receipt.quoteId}/receipt`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptId: receipt.id, expectedVersion: receipt.receiptVersion, transactionDate: date, reason: reason.trim() }),
      });
      const data = await response.json();
      if (response.status === 409) setConflict(true);
      if (!response.ok || !data.receipt) throw new Error(data.error || "Não foi possível corrigir. Tente novamente com os mesmos dados.");
      setOpen(false); onUpdated();
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Não foi possível corrigir."); }
    finally { busy.current = false; setSaving(false); }
  }
  return <div className="mt-4 space-y-4">
    <Button variant="outline" className="h-11" disabled={!receipt.receiptVersion} onClick={() => { setDate(receipt.transactionDate); setReason(""); setConfirmed(false); setConflict(false); setError(""); setOpen(true); }}><CalendarClock className="size-4" aria-hidden="true" />Corrigir data</Button>
    {corrections.length > 0 && <details className="border-t border-gray-200 pt-3">
      <summary className="cursor-pointer py-2 text-sm font-medium text-blue-700">Histórico de correções (últimas 20)</summary>
      <ol className="divide-y divide-gray-200">{corrections.map(item => <li key={item.id} className="space-y-1 py-3 text-sm">
        <p className="font-medium">{formatDate(item.previousDate)} → {formatDate(item.correctedDate)}</p>
        <p className="whitespace-pre-wrap break-words text-gray-700">{item.reason}</p>
        <p className="text-xs text-gray-500">Alterado pela sua conta em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(item.createdAt))} · Brasília</p>
      </li>)}</ol>
    </details>}
    <Dialog open={open} onOpenChange={value => { if (!saving) setOpen(value); }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto bg-white sm:max-w-lg">
        <DialogHeader><DialogTitle>Corrigir data do recebimento</DialogTitle><DialogDescription>Orçamento #{receipt.quoteId} · {formatMoney(receipt.amountCents)}</DialogDescription></DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <p className="text-sm text-gray-600">Data atual: <strong>{formatDate(receipt.transactionDate)}</strong></p>
          <div className="space-y-2"><Label htmlFor="correction-date">Data correta</Label><Input id="correction-date" type="date" required max={brasiliaDay()} disabled={saving || conflict} value={date} onChange={event => { setDate(event.target.value); setConfirmed(false); }} /></div>
          <div className="space-y-2"><Label htmlFor="correction-reason">Motivo da correção</Label><textarea id="correction-reason" required minLength={5} maxLength={500} rows={3} disabled={saving || conflict} value={reason} onChange={event => { setReason(event.target.value); setConfirmed(false); }} className="w-full resize-y rounded-md border border-gray-300 bg-white p-3 text-sm" /></div>
          <p className="text-sm leading-6 text-gray-600">O valor será contado na data correta no Financeiro e no Hoje. O valor total e o status Pago serão mantidos. Isso não devolve dinheiro ao cliente.</p>
          <label className="flex min-h-11 items-start gap-3 text-sm leading-6"><input type="checkbox" required disabled={saving || conflict} checked={confirmed} onChange={event => setConfirmed(event.target.checked)} className="mt-1 size-5 shrink-0 accent-blue-600" /><span>Conferi a nova data e autorizo a correção com este motivo.</span></label>
          {error && <p role="alert" tabIndex={-1} ref={errorRef} className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <DialogFooter><Button type="button" variant="outline" disabled={saving} onClick={() => setOpen(false)}>Cancelar</Button>{conflict ? <Button type="button" onClick={() => { setOpen(false); onUpdated(); }}>Atualizar recebimento</Button> : <Button type="submit" disabled={saving || !confirmed || date === receipt.transactionDate || reason.trim().length < 5}>{saving ? "Corrigindo..." : "Confirmar correção"}</Button>}</DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>;
}
