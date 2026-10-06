"use client";

import { useState } from "react";
import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { Quote } from "@/lib/models";

type Props = { quote: Quote; onRemoved: () => void; onChanged: (quote: Quote) => void };

export function QuoteActions(props: Props) {
  return <>{props.quote.archivedAt ? <QuoteAction {...props} action="restore" /> : <QuoteAction {...props} action="archive" />}<QuoteAction {...props} action="delete" /></>;
}

function QuoteAction({ quote, onRemoved, onChanged, action }: Props & { action: "delete" | "archive" | "restore" }) {
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const label = action === "delete" ? "Excluir orçamento" : action === "archive" ? "Arquivar orçamento" : "Restaurar orçamento";
  const Icon = action === "delete" ? Trash2 : action === "archive" ? Archive : ArchiveRestore;
  async function confirm() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/quotes/${quote.id}`, { method: action === "delete" ? "DELETE" : "POST", ...(action === "delete" ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, expectedUpdatedAt: quote.updatedAt }) }) });
      const data = await response.json() as { quote?: Quote; error?: string };
      if (!response.ok) throw new Error(data.error || "Não foi possível concluir a ação.");
      if (action !== "delete" && !data.quote) throw new Error("Atualize a página para conferir o orçamento.");
      setOpen(false);
      if (action === "delete") onRemoved(); else onChanged(data.quote!);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Tente novamente."); }
    finally { setBusy(false); }
  }
  return <AlertDialog open={open} onOpenChange={value => { if (!busy) { setOpen(value); if (value) setError(""); } }}>
    <AlertDialogTrigger asChild><Button variant="outline" size="icon" className={`size-10 rounded-md ${action === "delete" ? "border-red-200 text-red-700 hover:bg-red-50" : ""}`} title={label} aria-label={`${label} #${quote.id}`}><Icon className="size-4" aria-hidden="true" /></Button></AlertDialogTrigger>
    <AlertDialogContent className="max-h-[90dvh] overflow-y-auto rounded-lg bg-white">
      <AlertDialogHeader><AlertDialogTitle>{label} #{quote.id}?</AlertDialogTitle><AlertDialogDescription className="text-left leading-6"><span className="block break-words font-medium text-gray-900">{quote.client.name}</span>{action === "delete" ? "Exclusão definitiva, disponível apenas quando não há atendimentos, cobranças ou pagamentos vinculados. Para retirar um orçamento com histórico da lista, use Arquivar." : action === "archive" ? "O orçamento sairá da lista ativa e poderá ser restaurado. O link de aceite será invalidado. Atendimentos, cobranças e pagamentos continuam no histórico e não serão cancelados." : "O orçamento voltará à lista ativa. O link de aceite anterior continuará inválido."}</AlertDialogDescription></AlertDialogHeader>
      {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800">{error}</p>}
      <AlertDialogFooter><AlertDialogCancel disabled={busy} className="min-h-11 rounded-md">Cancelar</AlertDialogCancel><AlertDialogAction variant={action === "delete" ? "destructive" : "default"} asChild><Button disabled={busy} variant={action === "delete" ? "destructive" : "default"} className="min-h-11 rounded-md" onClick={event => { event.preventDefault(); void confirm(); }}><Icon className="size-4" aria-hidden="true" />{busy ? "Aguarde..." : label}</Button></AlertDialogAction></AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}
