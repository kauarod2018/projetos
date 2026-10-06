"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { CheckCircle2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { brasiliaDay } from "@/lib/appointments";
import { formatDate, formatMoney, type FinanceTransaction } from "@/lib/models";
import type { ReceiptQuote } from "@/lib/assistant-receipts";
import { ReceiptDateCorrection } from "@/components/receipt-date-correction";
import type { ReceiptDateCorrection as Correction } from "@/lib/quote-receipts";

export function QuoteReceipt({ quote, onSaved, onDialogOpenChange }: { quote: ReceiptQuote; onSaved: () => void; onDialogOpenChange?: (open: boolean) => void }) {
  const headingId = useId();
  const [receipt, setReceipt] = useState<FinanceTransaction | null>(null);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingChoices, setLoadingChoices] = useState(false);
  const [choicesReady, setChoicesReady] = useState(false);
  const [choices, setChoices] = useState<FinanceTransaction[]>([]);
  const [choice, setChoice] = useState("");
  const [date, setDate] = useState(brasiliaDay());
  const [formError, setFormError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const busy = useRef(false);
  const startRef = useRef<HTMLButtonElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => { onDialogOpenChange?.(open); }, [open, onDialogOpenChange]);

  useEffect(() => {
    const controller = new AbortController();
    setLoaded(false); setError("");
    void fetch(`/api/quotes/${quote.id}/receipt`, { cache: "no-store", signal: controller.signal })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Não foi possível consultar o recebimento.");
        if (!controller.signal.aborted) { setReceipt(data.receipt); setCorrections(data.corrections ?? []); setLoaded(true); }
      }).catch(failure => { if (!controller.signal.aborted) setError(failure.message); });
    return () => controller.abort();
  }, [quote.id, retry]);

  useEffect(() => { if (formError) errorRef.current?.focus(); }, [formError]);

  async function start() {
    setFormError(""); setConfirmed(false); setChoice(""); setChoices([]); setChoicesReady(false); setDate(brasiliaDay()); setOpen(true); setLoadingChoices(true);
    try {
      const response = await fetch("/api/transactions", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível conferir as entradas existentes.");
      setChoices((data.transactions as FinanceTransaction[]).filter(item => item.type === "income" && !item.quoteId && item.amountCents === quote.totalCents));
      setChoicesReady(true);
    } catch (failure) { setFormError(failure instanceof Error ? failure.message : "Tente novamente."); }
    finally { setLoadingChoices(false); }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy.current || !confirmed || !choice || !choicesReady) return;
    busy.current = true; setSaving(true); setFormError("");
    try {
      const response = await fetch(`/api/quotes/${quote.id}/receipt`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents: quote.totalCents, transactionDate: date, ...(choice !== "new" ? { existingTransactionId: Number(choice) } : {}) }),
      });
      const data = await response.json();
      if (!response.ok || !data.receipt) throw new Error(data.error || "Não foi possível registrar. Tente novamente com os mesmos dados.");
      setReceipt(data.receipt); setOpen(false); onSaved();
    } catch (failure) { setFormError(failure instanceof Error ? failure.message : "Tente novamente com os mesmos dados."); }
    finally { busy.current = false; setSaving(false); }
  }

  const eligible = ["Aprovado", "Em andamento", "Finalizado", "Pago"].includes(quote.status) && quote.totalCents > 0;
  return <section className="print-hidden border-y border-gray-200 py-5" aria-labelledby={headingId}>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h2 id={headingId} className="flex items-center gap-2 font-semibold"><Wallet className="size-5 text-emerald-700" /> Recebimento</h2>
        {error ? <p role="alert" className="mt-2 text-sm text-red-700">{error}</p> : !loaded ? <p role="status" className="mt-2 text-sm text-gray-500">Consultando recebimento...</p> : receipt ? <p role="status" className="mt-2 text-sm text-emerald-800"><CheckCircle2 className="mr-1 inline size-4" /> {formatMoney(receipt.amountCents)} registrado em {formatDate(receipt.transactionDate)}.</p> : <p className="mt-2 text-sm text-gray-600">{quote.status === "Pago" ? "Pagamento antigo: confira a entrada no financeiro antes de registrar outra." : eligible ? "Registre quando o valor integral tiver sido recebido." : "Disponível após a aprovação, para orçamentos com valor maior que zero."}</p>}
      </div>
      {error ? <Button variant="outline" onClick={() => setRetry(value => value + 1)}>Tentar novamente</Button> : loaded && !receipt && eligible && <Button ref={startRef} onClick={() => void start()} className="shrink-0"><Wallet className="size-4" /> Registrar recebimento</Button>}
    </div>
    {loaded && !error && receipt && <ReceiptDateCorrection receipt={receipt} corrections={corrections} onUpdated={() => setRetry(value => value + 1)} />}
    <Dialog open={open} onOpenChange={value => { if (!saving && !loadingChoices) setOpen(value); }}>
      <DialogContent onCloseAutoFocus={event => { event.preventDefault(); startRef.current?.focus(); }} className="max-h-[90dvh] overflow-y-auto bg-white sm:max-w-lg">
        <DialogHeader><DialogTitle>Confirmar recebimento integral</DialogTitle><DialogDescription>Orçamento #{quote.id} · {quote.client.name}</DialogDescription></DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <p className="text-2xl font-semibold">{formatMoney(quote.totalCents)}</p>
          {loadingChoices ? <p role="status">Conferindo entradas existentes...</p> : <>
            <div className="space-y-2"><Label htmlFor="receipt-source">Entrada no financeiro</Label>
              <select required id="receipt-source" disabled={saving || !choicesReady} value={choice} onChange={event => { const value = event.target.value; setChoice(value); setConfirmed(false); setDate(choices.find(item => item.id === Number(value))?.transactionDate ?? brasiliaDay()); }} className="h-11 w-full min-w-0 rounded-md border border-gray-300 bg-white px-3 text-sm">
                <option value="" disabled>Selecione uma opção</option>
                {choices.map(item => <option key={item.id} value={item.id}>{formatDate(item.transactionDate)} · {item.description}</option>)}
                <option value="new">Criar uma nova entrada</option>
              </select>
            </div>
            {choices.length > 0 && <p className="text-sm text-amber-800">Há entradas do mesmo valor. Vincule a correspondente para não duplicar o dinheiro recebido.</p>}
            <div className="space-y-2"><Label htmlFor="receipt-date">Data do recebimento</Label><Input id="receipt-date" required type="date" max={brasiliaDay()} disabled={saving || choice !== "new"} value={date} onChange={event => { setDate(event.target.value); setConfirmed(false); }} /></div>
            <label className="flex min-h-11 items-start gap-3 text-sm leading-6"><input type="checkbox" required disabled={saving || !choice} className="mt-1 size-5 shrink-0 accent-blue-600" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} /><span>Confirmo que recebi o valor integral e que {choice === "new" ? "ele ainda não está registrado no financeiro" : "a entrada selecionada corresponde a este orçamento"}.</span></label>
          </>}
          <p className="text-xs leading-5 text-gray-500">Este registro não verifica pagamentos no banco. Depois de confirmado, o orçamento fica pago e protegido contra exclusão. Parcelas e estornos ainda não estão disponíveis.</p>
          {formError && <p ref={errorRef} tabIndex={-1} role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
          <DialogFooter><Button type="button" variant="outline" disabled={saving || loadingChoices} onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={saving || loadingChoices || !confirmed || !choice}>{saving ? "Registrando..." : "Confirmar recebimento"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </section>;
}
