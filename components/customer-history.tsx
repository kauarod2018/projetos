"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, FilePlus2, FileText, Mail, MapPin, MessageCircle, Phone, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, formatMoney } from "@/lib/models";
import { whatsappLink } from "@/lib/whatsapp";
import { CustomerReceiptList } from "@/components/customer-receipt-list";
import type { CustomerHistory } from "@/lib/customer-history";
import styles from "@/components/customer-workspace.module.css";

export function CustomerHistoryView({ customerId }: { customerId: string }) {
  const [kind, setKind] = useState<CustomerHistory["kind"]>("quotes");
  const [cursors, setCursors] = useState<(number | null)[]>([null]);
  const [revision, setRevision] = useState(0);
  const paginationFocus = useRef(false);
  const [state, setState] = useState<{ key: string; data?: CustomerHistory; error?: string; missing?: boolean }>({ key: "" });
  const before = cursors.at(-1);
  const key = `${customerId}/${kind}/${before}/${revision}`;
  useEffect(() => {
    const controller = new AbortController();
    setState({ key });
    void fetch(`/api/customers/${encodeURIComponent(customerId)}/history?kind=${kind}${before ? `&before=${before}` : ""}`, { cache: "no-store", signal: controller.signal }).then(async response => {
      if (response.status === 404) { if (!controller.signal.aborted) setState({ key, missing: true }); return; }
      const data = await response.json();
      if (!response.ok || data.kind !== kind || !data.customer || !Array.isArray(data.records)) throw new Error();
      if (!controller.signal.aborted) setState({ key, data });
    }).catch(() => { if (!controller.signal.aborted) setState({ key, error: "Não foi possível carregar o histórico. Tente novamente." }); });
    return () => controller.abort();
  }, [customerId, kind, before, revision, key]);
  const data = state.key === key ? state.data : undefined;
  const error = state.key === key ? state.error : undefined;
  const missing = state.key === key && state.missing;
  useEffect(() => {
    if (paginationFocus.current && (data || error)) {
      paginationFocus.current = false;
      document.getElementById("history-result")?.focus();
    }
  }, [data, error]);
  function goOlder(cursor: number) { paginationFocus.current = true; setCursors(current => [...current, cursor]); }
  function goNewer() { paginationFocus.current = true; setCursors(current => current.slice(0, -1)); }
  function changeKind(value: typeof kind) { setKind(value); setCursors([null]); }
  const refresh = () => { setCursors([null]); setRevision(v => v + 1); };
  return <section className={`${styles.history} mx-auto w-full max-w-6xl space-y-6 px-5 py-8 sm:px-8`}>
    <Link href="/clientes" className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm text-blue-700 focus-visible:outline-2"><ArrowLeft className="size-4" aria-hidden="true" />Voltar para clientes</Link>
    {missing ? <div className="border-t py-10"><h1 className="text-2xl font-semibold">Cliente não encontrado</h1><p className="mt-3 text-gray-600">Este cadastro não está disponível na sua conta.</p></div> : <>
      <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><p className="text-sm text-gray-600">Histórico do cliente</p><h1 className="mt-2 break-words text-3xl font-semibold">{data?.customer.name ?? "Cliente"}</h1></div>{data && <div className="flex shrink-0 flex-wrap gap-2"><Button asChild variant="outline" className="h-11"><Link href={`/agenda?cliente=${data.customer.id}`}><CalendarDays className="size-4" aria-hidden="true" />Agendar</Link></Button><Button asChild className="h-11"><Link href={`/novo-orcamento?cliente=${data.customer.id}`}><FilePlus2 className="size-4" aria-hidden="true" />Novo orçamento</Link></Button></div>}</header>
      <div role="group" aria-label="Registros do cliente" className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-4">{([['quotes', 'Orçamentos'], ['appointments', 'Atendimentos'], ['receipts', 'Recebimentos']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={kind === value} onClick={() => changeKind(value)} className={`min-h-11 rounded-lg px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-blue-600 ${kind === value ? "bg-blue-50 text-blue-800" : "text-gray-600 hover:bg-gray-100"}`}>{label}</button>)}<Button variant="ghost" size="icon" title="Atualizar histórico" aria-label="Atualizar histórico" onClick={refresh} className="ml-auto size-11"><RefreshCw className="size-4" aria-hidden="true" /></Button></div>
      {error ? <div id="history-result" tabIndex={-1} role="alert" className="border-l-4 border-red-600 bg-red-50 p-5"><p>{error}</p><Button variant="outline" className="mt-3 h-11" onClick={() => { paginationFocus.current = true; setRevision(v => v + 1); }}>Tentar novamente</Button></div> : !data ? <p role="status" className="py-12 text-gray-600">Carregando histórico…</p> : <div id="history-result" tabIndex={-1} className="grid min-w-0 gap-8 outline-offset-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0 space-y-4"><div><h2 className="text-xl font-semibold">{kind === "quotes" ? "Orçamentos" : kind === "receipts" ? "Recebimentos" : "Atendimentos"}</h2><p className="mt-1 text-sm text-gray-600">{kind === "receipts" ? "Entradas vinculadas aos orçamentos deste cliente · do registro mais recente para o mais antigo" : "Situação atual · do cadastro mais recente para o mais antigo"}</p></div>
          {!data.records.length ? <div className="border-t border-gray-200 py-12 text-center"><FileText className="mx-auto size-9 text-gray-400" aria-hidden="true" /><h3 className="mt-4 text-lg font-semibold">{kind === "quotes" ? "Nenhum orçamento nesta página" : kind === "receipts" ? "Nenhum recebimento nesta página" : "Nenhum atendimento nesta página"}</h3><p className="mt-2 text-sm text-gray-600">{cursors.length > 1 ? "Volte à página anterior ou atualize os registros." : kind === "receipts" ? "Recebimentos aparecerão após serem registrados ou vinculados no orçamento. Entradas sem vínculo não aparecem aqui." : "Os registros vinculados a este cliente aparecerão aqui."}</p></div> : <ul className="divide-y divide-gray-200 border-y border-gray-200">
            {data.kind === "receipts" ? <CustomerReceiptList records={data.records} /> : data.kind === "quotes" ? data.records.map(q => <li key={q.id} className="space-y-3 py-5"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">Orçamento #{q.id}</h3><span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-800">{q.status}</span></div><p className="whitespace-pre-line break-words text-sm text-gray-600">{q.description || "Sem descrição adicional"}</p><p className="text-sm text-gray-600">Criado em {formatDate(q.createdAt)} · válido até {formatDate(q.validUntil)}</p><div className="flex flex-wrap items-center justify-between gap-3"><strong className="tabular-nums text-teal-800">{formatMoney(q.totalCents)}</strong><Link href={`/orcamentos/${q.id}`} className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-medium text-blue-700 focus-visible:outline-2">Ver orçamento<ArrowRight className="size-4" aria-hidden="true" /></Link></div></li>) : data.records.map(a => <li key={a.id} className="space-y-3 py-5"><div className="flex flex-wrap items-start justify-between gap-2"><h3 className="min-w-0 break-words font-semibold">{a.title}</h3><span className={`shrink-0 rounded-md px-2 py-1 text-xs font-medium ${a.status === "Cancelado" ? "bg-gray-100 text-gray-700" : "bg-teal-50 text-teal-800"}`}>{a.status}</span></div><p className="text-sm text-gray-600">{formatDate(a.startsAt)} às {a.startsAt.slice(11)} até {a.startsAt.slice(0,10) !== a.endsAt.slice(0,10) ? `${formatDate(a.endsAt)} às ` : ""}{a.endsAt.slice(11)} · Brasília</p>{a.notes && <p className="whitespace-pre-line break-words text-sm text-gray-600">{a.notes}</p>}<Link href={`/agenda?data=${a.startsAt.slice(0,10)}`} className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-medium text-blue-700 focus-visible:outline-2">Ver dia na agenda<ArrowRight className="size-4" aria-hidden="true" /></Link></li>)}
          </ul>}
          <div className="flex flex-wrap items-center justify-between gap-2"><Button variant="outline" className="h-11" disabled={cursors.length === 1} onClick={goNewer}><ArrowLeft className="size-4" aria-hidden="true" />Mais recentes</Button><p role="status" className="text-sm text-gray-600">Página {cursors.length}</p><Button variant="outline" className="h-11" disabled={data.nextCursor === null} onClick={() => { if (data.nextCursor !== null) goOlder(data.nextCursor); }}>Mais antigos<ArrowRight className="size-4" aria-hidden="true" /></Button></div>
        </div>
        <aside aria-label="Dados do cliente" className="min-w-0 space-y-6 border-t border-gray-200 pt-6 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0"><div><h2 className="text-lg font-semibold">Contato</h2><dl className="mt-4 space-y-4 text-sm">{data.customer.phone && <div><dt className="flex items-center gap-2 text-gray-500"><Phone className="size-4" aria-hidden="true" />Telefone</dt><dd className="mt-1 break-words">{data.customer.phone}</dd></div>}{data.customer.email && <div><dt className="flex items-center gap-2 text-gray-500"><Mail className="size-4" aria-hidden="true" />E-mail</dt><dd className="mt-1 break-all">{data.customer.email}</dd></div>}{data.customer.address && <div><dt className="flex items-center gap-2 text-gray-500"><MapPin className="size-4" aria-hidden="true" />Endereço</dt><dd className="mt-1 break-words">{data.customer.address}</dd></div>}</dl>{!data.customer.phone && !data.customer.email && !data.customer.address && <p className="mt-3 text-sm text-gray-600">Sem contato informado.</p>}{data.customer.phone && <Button asChild variant="outline" className="mt-5 h-11"><a href={whatsappLink(data.customer.phone)} target="_blank" rel="noreferrer"><MessageCircle className="size-4" aria-hidden="true" />WhatsApp</a></Button>}</div><div><h2 className="text-lg font-semibold">Observações</h2><p className="mt-3 whitespace-pre-line break-words text-sm leading-6 text-gray-600">{data.customer.notes || "Nenhuma observação cadastrada."}</p></div></aside>
      </div>}
    </>}
  </section>;
}
