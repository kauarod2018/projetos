"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, CalendarDays, CircleDollarSign, FileClock, RefreshCw, Search, UserRoundPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { VemoMark } from "@/components/vemo-brand";
import { assistantTopics, type AssistantAnswer, type AssistantTopic } from "@/lib/assistant-topics";
import { formatMoney } from "@/lib/models";
import dynamic from "next/dynamic";
import { useAssistant } from "@/components/assistant-context";
import { AssistantQuestion } from "@/components/assistant-question";
import { AssistantMonth } from "@/components/assistant-month";
import type { AssistantInput } from "@/lib/assistant-question";

const AssistantReceipt = dynamic(() => import("@/components/assistant-receipt").then(module => module.AssistantReceipt), { loading: () => <p role="status" className="py-5 text-sm">Abrindo recebimentos...</p> });
const AssistantExpense = dynamic(() => import("@/components/assistant-expense").then(module => module.AssistantExpense), { loading: () => <p role="status" className="py-5 text-sm">Abrindo despesas...</p> });
const AssistantAppointment = dynamic(() => import("@/components/assistant-appointment").then(module => module.AssistantAppointment), { loading: () => <p role="status" className="py-5 text-sm">Abrindo agenda...</p> });
const AssistantCustomer = dynamic(() => import("@/components/assistant-customer").then(module => module.AssistantCustomer), { loading: () => <p role="status" className="py-5 text-sm">Abrindo cadastro...</p> });
const AssistantQuote = dynamic(() => import("@/components/assistant-quote").then(module => module.AssistantQuote), { loading: () => <p role="status" className="py-5 text-sm">Abrindo preparação...</p> });
const AssistantCustomerSearch = dynamic(() => import("@/components/assistant-customer-search").then(module => module.AssistantCustomerSearch), { loading: () => <p role="status" className="py-5 text-sm">Abrindo clientes...</p> });

export function WorkspaceAssistant() {
  const { request, restoreFocus } = useAssistant();
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<"receipt" | "expense" | "appointment" | "customer" | "quote" | "search" | null>(null);
  const [receiptRequest, setReceiptRequest] = useState<{ clientName: string; amountCents: number } | null>(null);
  const [expenseRequest, setExpenseRequest] = useState<{ description: string; amountCents: number } | null>(null);
  const [appointmentRequest, setAppointmentRequest] = useState<{ clientName: string; startsAt: string } | null>(null);
  const [quoteRequest, setQuoteRequest] = useState<{ clientName: string; amountCents: number } | null>(null);
  const [customerRequest, setCustomerRequest] = useState<{ name: string; phone: string } | null>(null);
  const searchButton = useRef<HTMLButtonElement>(null);
  const quoteButton = useRef<HTMLButtonElement>(null);
  const customerButton = useRef<HTMLButtonElement>(null);
  const receiptButton = useRef<HTMLButtonElement>(null);
  const expenseButton = useRef<HTMLButtonElement>(null);
  const appointmentButton = useRef<HTMLButtonElement>(null);
  const [locked, setLocked] = useState(false);
  const [topic, setTopic] = useState<AssistantTopic | null>(null);
  const [month, setMonth] = useState("");
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{ key: string; answer?: AssistantAnswer; error?: string }>({ key: "" });
  const resultRef = useRef<HTMLDivElement>(null);
  const key = `${topic}/${month}/${revision}`;
  useEffect(() => {
    if (!request) return;
    setMonth("");
    setReceiptRequest(null);
    setExpenseRequest(null);
    setAppointmentRequest(null);
    setQuoteRequest(null);
    setCustomerRequest(null);
    setAction(request.target === "receipt" || request.target === "appointment" ? request.target : null);
    setTopic(request.target === "receipt" || request.target === "appointment" ? null : request.target);
    setState({ key: "" }); setRevision(value => value + 1); setOpen(true);
  }, [request]);
  function changeOpen(value: boolean) {
    if (locked) return;
    setOpen(value);
    if (!value) { setTopic(null); setMonth(""); setState({ key: "" }); setAction(null); setReceiptRequest(null); setExpenseRequest(null); setAppointmentRequest(null); setQuoteRequest(null); setCustomerRequest(null); }
  }
  function backToQueries() {
    const target = action === "search" ? searchButton : action === "quote" ? quoteButton : action === "customer" ? customerButton : action === "appointment" ? appointmentButton : action === "expense" ? expenseButton : receiptButton;
    setAction(null); setTopic(null); setMonth(""); setReceiptRequest(null); setExpenseRequest(null); setAppointmentRequest(null); setQuoteRequest(null); setCustomerRequest(null);
    requestAnimationFrame(() => target.current?.focus());
  }
  function handleAssistantInput(input: AssistantInput | null) {
    setMonth(""); setState({ key: "" });
    if (!input) { setAction(null); setTopic(null); setReceiptRequest(null); setExpenseRequest(null); setAppointmentRequest(null); setQuoteRequest(null); setCustomerRequest(null); return; }
    if (input.type === "query") {
      setAction(null); setReceiptRequest(null); setExpenseRequest(null); setAppointmentRequest(null); setQuoteRequest(null); setCustomerRequest(null); setTopic(input.topic); setRevision(value => value + 1);
      return;
    }
    setTopic(null);
    if (input.type === "receipt") {
      setReceiptRequest({ clientName: input.clientName, amountCents: input.amountCents }); setAppointmentRequest(null); setAction("receipt");
    } else if (input.type === "appointment") {
      setAppointmentRequest({ clientName: input.clientName, startsAt: input.startsAt }); setReceiptRequest(null); setAction("appointment");
    } else if (input.type === "quote") {
      setQuoteRequest({ clientName: input.clientName, amountCents: input.amountCents }); setReceiptRequest(null); setAppointmentRequest(null); setAction("quote");
    } else if (input.type === "expense") {
      setExpenseRequest({ description: input.description, amountCents: input.amountCents }); setReceiptRequest(null); setAppointmentRequest(null); setQuoteRequest(null); setAction("expense");
    } else {
      setCustomerRequest({ name: input.name, phone: input.phone }); setReceiptRequest(null); setExpenseRequest(null); setAppointmentRequest(null); setQuoteRequest(null); setAction("customer");
    }
  }
  useEffect(() => {
    if (!open || !topic || action) return;
    const controller = new AbortController();
    setState({ key });
    const params = new URLSearchParams({ topic });
    if ((topic === "cashflow" || topic === "expenses") && month) params.set("month", month);
    void fetch(`/api/assistant?${params}`, { cache: "no-store", signal: controller.signal }).then(async response => {
      const data = await response.json();
      if (!response.ok || data.answer?.topic !== topic || ((topic === "cashflow" || topic === "expenses") && month && data.answer?.month !== month)) throw new Error();
      if (!controller.signal.aborted) setState({ key, answer: data.answer });
    }).catch(() => { if (!controller.signal.aborted) setState({ key, error: "Não foi possível consultar os dados agora. Tente novamente." }); });
    return () => controller.abort();
  }, [open, topic, month, revision, key, action]);
  const answer = state.key === key ? state.answer : undefined;
  const error = state.key === key ? state.error : undefined;
  useEffect(() => { if (open && !action && (answer || error)) resultRef.current?.focus(); }, [open, action, answer, error]);
  return <Sheet open={open} onOpenChange={changeOpen}>
    <SheetTrigger asChild><Button variant="outline" className="ml-auto h-11 gap-2 rounded-lg border-blue-200 text-blue-800"><VemoMark decorative className="size-5" />Assistente</Button></SheetTrigger>
    <SheetContent onCloseAutoFocus={() => { requestAnimationFrame(restoreFocus); }} showCloseButton={false} className="print-hidden w-full gap-0 bg-white sm:max-w-md">
      <SheetHeader className="shrink-0 border-b border-gray-200 p-5 pr-16">
        <SheetTitle className="flex items-center gap-2 text-lg"><VemoMark decorative className="size-7" />Vemo Assistente</SheetTitle>
        <SheetDescription>{action === "quote" ? "Cliente e serviço para o orçamento" : action === "customer" ? "Cadastro com confirmação" : action === "receipt" ? "Recebimento com confirmação" : action === "expense" ? "Despesa com confirmação" : action === "appointment" ? "Agenda com confirmação" : "Consultas do seu negócio"}</SheetDescription>
      </SheetHeader>
      <SheetClose asChild><Button variant="ghost" size="icon" disabled={locked} className="absolute right-3 top-4 size-11" aria-label="Fechar assistente" title="Fechar assistente"><X className="size-5" /></Button></SheetClose>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
        {action === "search" ? <AssistantCustomerSearch onBack={backToQueries} /> : action === "quote" ? <AssistantQuote key={quoteRequest ? `${quoteRequest.clientName}/${quoteRequest.amountCents}` : "manual"} request={quoteRequest ?? undefined} onBack={backToQueries} /> : action === "customer" ? <AssistantCustomer key={customerRequest ? `${customerRequest.name}/${customerRequest.phone}` : "manual"} request={customerRequest ?? undefined} locked={locked} onLockChange={setLocked} onBack={backToQueries} /> : action === "receipt" ? <AssistantReceipt key={receiptRequest ? `${receiptRequest.clientName}/${receiptRequest.amountCents}` : "manual"} request={receiptRequest ?? undefined} locked={locked} onLockChange={setLocked} onBack={backToQueries} /> : action === "expense" ? <AssistantExpense key={expenseRequest ? `${expenseRequest.description}/${expenseRequest.amountCents}` : "manual"} request={expenseRequest ?? undefined} locked={locked} onLockChange={setLocked} onBack={backToQueries} /> : action === "appointment" ? <AssistantAppointment key={appointmentRequest ? `${appointmentRequest.clientName}/${appointmentRequest.startsAt}` : "manual"} request={appointmentRequest ?? undefined} locked={locked} onLockChange={setLocked} onBack={backToQueries} /> : <>
        <AssistantQuestion onQuery={handleAssistantInput} />
        <div className="mt-5 grid gap-2">
          <Button ref={receiptButton} className="h-11 w-full" onClick={() => { setReceiptRequest(null); setAction("receipt"); }}><CircleDollarSign className="size-4" />Registrar recebimento</Button>
          <Button ref={expenseButton} variant="outline" className="h-11 w-full" onClick={() => { setExpenseRequest(null); setAction("expense"); }}><CircleDollarSign className="size-4" />Registrar despesa</Button>
          <Button ref={appointmentButton} variant="outline" className="h-11 w-full" onClick={() => { setAppointmentRequest(null); setAction("appointment"); }}><CalendarDays className="size-4" />Agendar atendimento</Button>
          <Button ref={customerButton} variant="outline" className="h-11 w-full" onClick={() => { setCustomerRequest(null); setAction("customer"); }}><UserRoundPlus className="size-4" />Cadastrar cliente</Button>
          <Button ref={quoteButton} variant="outline" className="h-11 w-full" onClick={() => setAction("quote")}><FileClock className="size-4" />Preparar orçamento</Button>
        </div>
        <div role="group" aria-label="Consultas disponíveis" className="grid grid-cols-1 gap-1 border-b border-gray-200 py-4">
          <button ref={searchButton} type="button" onClick={() => setAction("search")} className="flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-blue-600"><Search className="size-4 shrink-0" aria-hidden="true" />Buscar cliente<ArrowRight className="ml-auto size-4 shrink-0" aria-hidden="true" /></button>
          {assistantTopics.map(item => { const Icon = item.value === "today" || item.value === "tomorrow" ? CalendarDays : item.value === "followups" ? FileClock : CircleDollarSign;
            return <button key={item.value} type="button" aria-pressed={topic === item.value} onClick={() => { setMonth(""); setTopic(item.value); setRevision(v => v + 1); }} className={`flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium focus-visible:outline-2 focus-visible:outline-blue-600 ${topic === item.value ? "bg-blue-50 text-blue-800" : "text-gray-700 hover:bg-gray-50"}`}><Icon className="size-4 shrink-0" aria-hidden="true" />{item.label}<ArrowRight className="ml-auto size-4 shrink-0" aria-hidden="true" /></button>;
          })}
        </div>
        {topic === "cashflow" || topic === "expenses" ? <AssistantMonth key={month || "current"} month={month} onApply={value => { setMonth(value); setRevision(v => v + 1); }} /> : null}
        <div ref={resultRef} tabIndex={-1} className="min-w-0 py-5 outline-offset-2">
          {!topic ? <p className="text-sm text-gray-500">Agenda, recebimentos e próximos retornos.</p> : error ? <div role="alert" className="border-l-4 border-red-600 bg-red-50 p-4 text-sm text-red-800"><p>{error}</p><Button variant="outline" onClick={() => setRevision(v => v + 1)} className="mt-3 h-11">Tentar novamente</Button></div> : !answer ? <p role="status" className="py-8 text-sm text-gray-500">Consultando registros...</p> : <>
            <div className="flex items-start justify-between gap-2"><div className="min-w-0"><h2 className="text-lg font-semibold">{answer.title}</h2><p className="mt-1 text-sm text-gray-500">{answer.period}</p></div><Button variant="ghost" size="icon" className="size-11 shrink-0" aria-label="Atualizar consulta" title="Atualizar consulta" onClick={() => setRevision(v => v + 1)}><RefreshCw className="size-4" /></Button></div>
            {answer.cashflow ? <dl className="mt-5 divide-y divide-gray-200 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 py-3"><dt>Entrou</dt><dd className="break-all font-semibold tabular-nums text-emerald-800">{formatMoney(answer.cashflow.incomeCents)}</dd></div>
              <div className="flex flex-wrap items-center justify-between gap-2 py-3"><dt>Saiu</dt><dd className="break-all font-semibold tabular-nums text-red-700">{formatMoney(answer.cashflow.expenseCents)}</dd></div>
              <div className="flex flex-wrap items-center justify-between gap-2 py-3"><dt>{answer.cashflow.differenceCents < 0 ? "Saiu a mais do que entrou" : "O que sobrou"}</dt><dd className={`break-all text-xl font-semibold tabular-nums ${answer.cashflow.differenceCents < 0 ? "text-red-700" : "text-emerald-800"}`}>{formatMoney(answer.cashflow.differenceCents)}</dd></div>
            </dl> : <p className={`mt-5 break-all text-2xl font-semibold tabular-nums ${topic === "expenses" ? "text-red-700" : "text-emerald-800"}`}>{answer.totalCents !== undefined ? formatMoney(answer.totalCents) : topic === "obligations" ? `${answer.count} ${answer.count === 1 ? "parcela" : "parcelas"}` : `${answer.count} ${answer.count === 1 ? "registro" : "registros"}`}</p>}
            <p className="mt-2 text-sm leading-6 text-gray-600">{answer.source}</p>
            {answer.obligations ? <dl className="mt-4 divide-y divide-gray-200 text-sm">{([
              ["Vencidas · a receber", answer.obligations.overdue.receivable],
              ["Vencidas · a pagar", answer.obligations.overdue.payable],
              ["Próximos 7 dias · a receber", answer.obligations.upcoming.receivable],
              ["Próximos 7 dias · a pagar", answer.obligations.upcoming.payable],
            ] as const).map(([label, group]) => <div key={label} className="flex flex-wrap items-center justify-between gap-2 py-3"><dt>{label}<span className="ml-2 text-xs text-gray-500">{group.count} {group.count === 1 ? "parcela" : "parcelas"}</span></dt><dd className="font-semibold tabular-nums">{formatMoney(group.remainingCents)}</dd></div>)}</dl> : null}
            {answer.expenseCategories?.length ? <section className="mt-5" aria-labelledby="assistant-expense-categories"><h3 id="assistant-expense-categories" className="text-sm font-semibold">Despesas por categoria</h3><ul className="mt-2 divide-y divide-gray-200">{answer.expenseCategories.map(item => <li key={item.category} className="py-3 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><span className="min-w-0"><span className="block font-medium">{item.category}</span><span className="text-xs text-gray-500">{item.count} {item.count === 1 ? "lançamento" : "lançamentos"}</span></span><span className="font-semibold tabular-nums">{formatMoney(item.amountCents)}</span></div><progress aria-label={`Despesas em ${item.category}`} max={answer.totalCents || 1} value={item.amountCents} className="mt-2 h-2 w-full accent-blue-600" /></li>)}</ul></section> : null}
            {answer.count === 0 ? <p className="py-6 text-sm text-gray-600">{answer.empty}</p> : <>
              <p className="mt-5 text-xs text-gray-500">Exibindo {answer.records.length} de {answer.count} {topic === "receivableClients" ? "clientes" : topic === "obligations" ? "parcelas" : "registros"}</p>
              <ul className="mt-2 divide-y divide-gray-200">{answer.records.map(row => <li key={row.id} className="py-4"><Link href={row.href} onClick={() => changeOpen(false)} className="block rounded-md focus-visible:outline-2 focus-visible:outline-blue-600"><p className="break-words text-sm font-semibold text-gray-900">{row.title}</p><p className="mt-1 break-words text-xs leading-5 text-gray-500">{row.detail}</p><p className="mt-2 break-words text-sm font-medium text-blue-800">{row.value}<ArrowRight className="ml-2 inline size-4" aria-hidden="true" /></p></Link></li>)}</ul>
            </>}
            <Button asChild variant="outline" className="mt-3 h-11"><Link href={answer.href} onClick={() => changeOpen(false)}>Abrir registros<ArrowRight className="size-4" /></Link></Button>
            <p className="mt-5 text-xs text-gray-500">Consultado às {new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" }).format(new Date(answer.checkedAt))} · Brasília</p>
          </>}
        </div>
        </>}
      </div>
    </SheetContent>
  </Sheet>;
}
