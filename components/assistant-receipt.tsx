"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QuoteReceipt } from "@/components/quote-receipt";
import { formatMoney } from "@/lib/models";
import type { ReceiptCandidate, ReceiptCandidates } from "@/lib/assistant-receipts";

type ReceiptRequest = { clientName: string; amountCents: number };

export function AssistantReceipt({ onBack, locked, onLockChange, request }: { onBack: () => void; locked: boolean; onLockChange: (value: boolean) => void; request?: ReceiptRequest }) {
  const [text, setText] = useState(request?.clientName ?? "");
  const [query, setQuery] = useState(request?.clientName ?? "");
  const [cursors, setCursors] = useState<number[]>([]);
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<ReceiptCandidate | null>(null);
  const [state, setState] = useState<{ key: string; data?: ReceiptCandidates; error?: string }>({ key: "" });
  const heading = useRef<HTMLHeadingElement>(null);
  const cursor = cursors.at(-1);
  const key = `${query}/${cursor}/${revision}/${request?.amountCents ?? ""}`;
  useEffect(() => { heading.current?.focus(); }, [selected]);
  useEffect(() => {
    if (selected) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ q: query });
    if (cursor !== undefined) params.set("cursor", String(cursor));
    if (request) params.set("amountCents", String(request.amountCents));
    void fetch(`/api/assistant/receipts?${params}`, { cache: "no-store", signal: controller.signal }).then(async response => {
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.records)) throw new Error();
      if (!controller.signal.aborted) setState({ key, data });
    }).catch(() => { if (!controller.signal.aborted) setState({ key, error: "Não foi possível consultar os orçamentos. Tente novamente." }); });
    return () => controller.abort();
  }, [query, cursor, revision, key, selected, request]);
  const data = state.key === key ? state.data : undefined;
  const error = state.key === key ? state.error : undefined;
  function search(event: FormEvent) { event.preventDefault(); setQuery(text.trim()); setCursors([]); setRevision(value => value + 1); }
  function back() { if (selected) { setSelected(null); setRevision(value => value + 1); } else onBack(); }
  return <div className="py-5">
    <Button variant="ghost" className="mb-4 h-11 px-0" disabled={locked} onClick={back}><ArrowLeft className="size-4" />{selected ? "Escolher outro orçamento" : "Voltar às consultas"}</Button>
    <h2 ref={heading} tabIndex={-1} className="text-lg font-semibold outline-offset-2">{selected ? "Revisar recebimento" : request ? "Conferir o recebimento" : "Qual orçamento você recebeu?"}</h2>
    {request && !selected && <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm leading-6 text-blue-950">
      <p>Entendi: recebimento de <strong>{request.clientName}</strong>, no valor de <strong>{formatMoney(request.amountCents)}</strong>.</p>
      <p className="mt-1">Vou procurar um orçamento com esse cliente e valor integral. A data ficará preenchida como hoje para você conferir; nada será salvo nesta busca.</p>
    </div>}
    {selected ? <>
      <dl className="my-5 space-y-3 text-sm">
        <div><dt className="text-gray-500">Cliente</dt><dd className="mt-1 break-words font-semibold">{selected.client.name}</dd></div>
        <div><dt className="text-gray-500">Orçamento #{selected.id} · {selected.status}</dt><dd className="mt-1 whitespace-pre-line break-words">{selected.description || "Sem descrição adicional"}</dd></div>
        <div><dt className="text-gray-500">Valor integral</dt><dd className="mt-1 text-xl font-semibold text-emerald-800">{formatMoney(selected.totalCents)}</dd></div>
      </dl>
      <p className="mb-5 text-sm leading-6 text-gray-600">Após confirmar, o orçamento atualizado será aberto. Nada será salvo antes da confirmação.</p>
      <QuoteReceipt key={selected.id} quote={selected} onDialogOpenChange={onLockChange} onSaved={() => window.location.assign(`/orcamentos/${selected.id}`)} />
    </> : <>
      <form onSubmit={search} className="mt-5 space-y-2">
        <Label htmlFor="assistant-receipt-search">Cliente, serviço ou número do orçamento</Label>
        <div className="flex gap-2"><Input id="assistant-receipt-search" value={text} onChange={event => setText(event.target.value)} maxLength={120} className="h-11 min-w-0" /><Button type="submit" variant="outline" size="icon" className="size-11 shrink-0" aria-label="Buscar orçamentos" title="Buscar orçamentos"><Search className="size-4" /></Button></div>
      </form>
      {error ? <div role="alert" className="mt-5 space-y-3 text-sm text-red-700"><p>{error}</p><Button variant="outline" onClick={() => setRevision(value => value + 1)}>Tentar novamente</Button></div> : !data ? <p role="status" className="py-6 text-sm text-gray-500">Conferindo orçamentos e recebimentos...</p> : <>
        <p role="status" className="mt-5 text-sm text-gray-600">{data.total} {data.total === 1 ? "orçamento disponível" : "orçamentos disponíveis"}</p>
        {data.records.length === 0 ? <p className="py-5 text-sm leading-6 text-gray-600">{request ? "Não encontrei um orçamento elegível desse cliente com esse valor integral. Nenhum dado foi alterado. Confira o nome e o valor; pagamentos parciais ainda precisam ser registrados pelo fluxo do Financeiro." : "Nenhum orçamento disponível nesta busca. Orçamentos ainda não aprovados ou com recebimento vinculado não aparecem aqui."}</p> : <ul className="mt-2 divide-y divide-gray-200">{data.records.map(quote => <li key={quote.id} className="py-4">
          <p className="break-words font-semibold">{quote.client.name}</p><p className="mt-1 text-xs text-gray-500">Orçamento #{quote.id} · {quote.status}</p>
          <p className="mt-2 line-clamp-2 break-words text-sm text-gray-600">{quote.description || "Sem descrição adicional"}</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><strong className="text-sm tabular-nums text-emerald-800">{formatMoney(quote.totalCents)}</strong><Button variant="outline" className="h-11" onClick={() => setSelected(quote)} aria-label={`Revisar orçamento ${quote.id} de ${quote.client.name}`}>Revisar<ArrowRight className="size-4" /></Button></div>
        </li>)}</ul>}
        <div className="mt-3 flex flex-wrap justify-between gap-2">{cursors.length > 0 && <Button variant="outline" className="h-11" onClick={() => setCursors(values => values.slice(0, -1))}><ArrowLeft className="size-4" />Anterior</Button>}{data.nextCursor !== null && <Button variant="outline" className="ml-auto h-11" onClick={() => setCursors(values => [...values, data.nextCursor!])}>Próximos<ArrowRight className="size-4" /></Button>}</div>
      </>}
    </>}
  </div>;
}
