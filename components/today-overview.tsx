"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, CalendarDays, Check, CircleDollarSign, Copy, FileText, Plus, RefreshCw, TriangleAlert, UserRoundPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCurrentUser } from "@/hooks/use-current-user";
import { formatMoney, type FinanceTransaction, type Quote } from "@/lib/models";
import { followUpMessage, greeting, summarizeMovement, summarizeQuotes } from "@/lib/today-summary";
import styles from "./today-overview.module.css";
import { useAppointments } from "@/hooks/use-appointments";
import { appointmentStartLabel, brasiliaDay } from "@/lib/appointments";
import { DailyBrief } from "@/components/daily-brief";
import type { ObligationSummary } from "@/lib/obligations-summary";
import { OperationsQueue } from "./operations-queue";

type LoadState<T> = { status: "loading" } | { status: "error" } | { status: "ready"; data: T[] };
type ValueState<T> = { status: "loading" } | { status: "error" } | { status: "ready"; data: T };

function useTodayData<T>(url: string, field: string, enabled: boolean, revision: number) {
  const [state, setState] = useState<LoadState<T>>({ status: "loading" });
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    setState({ status: "loading" });
    void fetch(url, { cache: "no-store", signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error("REQUEST_FAILED");
      const data = await response.json();
      if (!Array.isArray(data[field])) throw new Error("INVALID_RESPONSE");
      if (!controller.signal.aborted) setState({ status: "ready", data: data[field] });
    }).catch(() => {
      if (!controller.signal.aborted) setState({ status: "error" });
    });
    return () => controller.abort();
  }, [url, field, enabled, revision]);
  return state;
}

function LoadFailure({ children, retry }: { children: React.ReactNode; retry: () => void }) {
  return <div className={styles.failure} role="alert"><p>{children}</p><Button variant="outline" onClick={retry} className="mt-3 h-11 rounded-lg"><RefreshCw className="size-4" aria-hidden="true" />Tentar novamente</Button></div>;
}

export function TodayOverview() {
  const { user } = useCurrentUser();
  const [now, setNow] = useState<Date | null>(null);
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<Quote | null>(null);
  const [message, setMessage] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const messageTrigger = useRef<HTMLElement | null>(null);
  const quotes = useTodayData<Quote>("/api/quotes", "quotes", Boolean(user), revision);
  const transactions = useTodayData<FinanceTransaction>("/api/transactions", "transactions", Boolean(user), revision);
  const [obligationState, setObligationState] = useState<ValueState<ObligationSummary>>({ status: "loading" });
  const today = now ? brasiliaDay(now) : "";
  const agenda = useAppointments(today, today, revision);
  const appointments = agenda.items.filter(a => a.status !== "Cancelado");

  useEffect(() => {
    if (!user) { setObligationState({ status: "loading" }); return; }
    const controller = new AbortController();
    setObligationState({ status: "loading" });
    void fetch("/api/obligations/summary", { cache: "no-store", signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error("REQUEST_FAILED");
      const data = await response.json() as { summary?: ObligationSummary };
      if (!data.summary?.overdue || !data.summary?.upcoming) throw new Error("INVALID_RESPONSE");
      if (!controller.signal.aborted) setObligationState({ status: "ready", data: data.summary });
    }).catch(() => {
      if (!controller.signal.aborted) setObligationState({ status: "error" });
    });
    return () => controller.abort();
  }, [user, revision]);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    const refresh = () => {
      if (document.visibilityState === "visible") { setNow(new Date()); setRevision((value) => value + 1); }
    };
    document.addEventListener("visibilitychange", refresh);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", refresh); };
  }, []);

  const summary = quotes.status === "ready" && now ? summarizeQuotes(quotes.data, now, "America/Sao_Paulo") : null;
  const movement = transactions.status === "ready" && now ? summarizeMovement(transactions.data, now, "America/Sao_Paulo") : null;
  const retry = () => setRevision((value) => value + 1);
  const dateLabel = now ? new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long", day: "numeric", month: "long" }).format(now) : "";

  function prepareMessage(quote: Quote) {
    messageTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSelected(quote); setMessage(followUpMessage(quote)); setCopyState("idle");
  }

  async function copyMessage() {
    try { await navigator.clipboard.writeText(message); setCopyState("copied"); }
    catch { setCopyState("error"); }
  }

  return <>
    <div className={styles.toolbar}><span>Hoje</span><Link href="/clientes?novo=1"><UserRoundPlus size={19} aria-hidden="true" />Novo cliente</Link></div>
    <div className={styles.page}>
      <header className={styles.heading}>
        <div><h1>{now ? greeting(now, "America/Sao_Paulo") : "Olá"}{user ? `, ${user.name.trim().split(/\s+/)[0]}` : ""}</h1><p className={styles.date}>{dateLabel}</p></div>
        <Button asChild className="h-12 rounded-lg px-5 text-base"><Link href="/novo-orcamento"><Plus className="size-5" aria-hidden="true" />Novo orçamento</Link></Button>
      </header>
      <OperationsQueue revision={revision} />
      <DailyBrief now={now} agenda={agenda} summary={summary} quotesError={quotes.status === "error"} obligationSummary={obligationState.status === "ready" ? obligationState.data : null} obligationsError={obligationState.status === "error"} retry={retry} prepareMessage={prepareMessage} />
      <dl className={styles.metrics} aria-label="Resumo do trabalho" aria-busy={quotes.status === "loading"}>
        <div><dt><CalendarDays aria-hidden="true" />Atendimentos hoje</dt><dd>{agenda.loading || agenda.error ? "—" : appointments.length}</dd><p>{agenda.error ? "Agenda indisponível" : "Agenda · horário de Brasília"}</p></div>
        <div><dt><CircleDollarSign className={styles.teal} aria-hidden="true" />A receber</dt><dd className={styles.teal}>{summary ? formatMoney(summary.receivable) : "—"}</dd><p>{quotes.status === "error" ? "Não foi possível carregar" : "Orçamentos aprovados"}</p></div>
        <div><dt><TriangleAlert className={styles.amber} aria-hidden="true" />Pendências</dt><dd className={styles.amber}>{summary?.pending ?? "—"}</dd><p>Precisam da sua atenção</p></div>
        <div><dt><FileText aria-hidden="true" />Orçamentos aguardando</dt><dd className={styles.blue}>{summary?.awaiting ?? "—"}</dd><p>Dentro da validade</p></div>
      </dl>
      <div className={styles.columns}>
        <section aria-labelledby="attention-title" className={styles.attention}>
          <h2 id="attention-title">Para acompanhar{summary && <span className={styles.count}>{summary.pending}<span className="sr-only"> pendências</span></span>}</h2>
          {quotes.status === "error" ? <LoadFailure retry={retry}>Não foi possível carregar seus orçamentos. Os valores estão indisponíveis.</LoadFailure> : !summary ? <p className={styles.loading} role="status">Carregando orçamentos…</p> : summary.pending === 0 ? <div className={styles.empty}>
            <Check size={28} className={styles.teal} aria-hidden="true" />
            <h3>{quotes.status === "ready" && quotes.data.length ? "Tudo em dia por aqui" : "Seu próximo trabalho começa aqui"}</h3>
            <p>{quotes.status === "ready" && quotes.data.length ? "Nenhum rascunho, validade encerrada ou retorno pendente há 3 dias ou mais." : "Você ainda não tem orçamentos. Comece pelo primeiro cliente."}</p>
            <Link href={quotes.status === "ready" && quotes.data.length ? "/orcamentos" : "/clientes?novo=1"} className={styles.textLink}>{quotes.status === "ready" && quotes.data.length ? "Ver orçamentos" : "Cadastrar cliente"}<ArrowRight size={17} aria-hidden="true" /></Link>
          </div> : <ul className={styles.tasks}>
            {summary.followUps.slice(0, 3).map(({ quote, days }) => <li key={quote.id}>
              <FileText className={styles.taskIcon} aria-hidden="true" />
              <div className={styles.taskText}><h3>Orçamento para {quote.client.name}</h3><p>Sem resposta há {days} dias</p></div>
              <div className={styles.actions}><Link href={`/orcamentos/${quote.id}`} className={styles.actionLink}>Ver orçamento</Link><button type="button" onClick={() => prepareMessage(quote)} className={styles.actionLink}>Preparar mensagem</button></div>
            </li>)}
            {summary.drafts.length > 0 && <li>
              <FileText className={styles.taskIcon} aria-hidden="true" /><div className={styles.taskText}><h3>{summary.drafts.length} orçamento{summary.drafts.length === 1 ? "" : "s"} para revisar</h3><p>{summary.drafts.length === 1 ? "Rascunho ainda não enviado" : "Rascunhos ainda não enviados"}</p></div><Link href="/orcamentos?filtro=rascunhos" className={styles.actionLink}>Ver orçamentos</Link>
            </li>}
            {summary.expired.length > 0 && <li>
              <TriangleAlert className={`${styles.taskIcon} ${styles.amber}`} aria-hidden="true" /><div className={styles.taskText}><h3>{summary.expired.length} orçamento{summary.expired.length === 1 ? "" : "s"} com validade encerrada</h3><p>Confira antes de compartilhar novamente</p></div><Link href="/orcamentos?filtro=expirados" className={styles.actionLink}>Ver orçamentos</Link>
            </li>}
            {summary.followUps.length > 3 && <li><Link href="/orcamentos?filtro=retornos" className={styles.textLink}>Ver os {summary.followUps.length} orçamentos sem resposta<ArrowRight size={17} aria-hidden="true" /></Link></li>}
          </ul>}
        </section>
        <section aria-labelledby="movement-title" className={styles.movement}>
          <h2 id="movement-title">Movimento de hoje</h2><p className={styles.muted}>Lançamentos manuais</p>
          {transactions.status === "error" ? <LoadFailure retry={retry}>Não foi possível carregar as movimentações.</LoadFailure> : !movement ? <p className={styles.loading} role="status">Carregando movimentações…</p> : <dl className={styles.moneyList}>
            <div><dt>Entradas</dt><dd className={styles.teal}>{formatMoney(movement.income)}</dd></div><div><dt>Saídas</dt><dd className={styles.rose}>{formatMoney(movement.expenses)}</dd></div><div className={styles.balance}><dt>O que sobrou</dt><dd className={movement.balance < 0 ? styles.rose : styles.teal}>{formatMoney(movement.balance)}</dd></div>
          </dl>}
          <Link href="/financas" className={styles.textLink}>Abrir financeiro<ArrowRight size={18} aria-hidden="true" /></Link>
        </section>
        <section className={styles.agenda} aria-labelledby="agenda-title"><div className={styles.sectionHeading}><h2 id="agenda-title">Agenda de hoje</h2><Link href="/agenda" className={styles.textLink}>Abrir agenda<ArrowRight size={18} aria-hidden="true" /></Link></div>
          {agenda.loading ? <p role="status" className={styles.loading}>Carregando agenda…</p> : agenda.error ? <LoadFailure retry={retry}>{agenda.error}</LoadFailure> : !appointments.length ? <div className={styles.empty}><CalendarDays size={36} aria-hidden="true" /><h3>Nenhum compromisso para hoje.</h3><Link href="/agenda" className={styles.textLink}>Organizar agenda<ArrowRight size={17} aria-hidden="true" /></Link></div> : <ul className={styles.appointmentList}>{appointments.map(a => <li key={a.id}><span className={styles.appointmentTime}>{appointmentStartLabel(a, today)}</span><div className={styles.appointmentDetails}><h3>{a.title}</h3><p>{a.customerName}</p></div><span className={styles.appointmentStatus}>{a.status}</span></li>)}</ul>}
        </section>
      </div>
    </div>
    <Dialog open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null); }}>
      <DialogContent showCloseButton={false} onCloseAutoFocus={(event) => { event.preventDefault(); messageTrigger.current?.focus(); }} className="max-h-[90dvh] overflow-y-auto rounded-lg bg-white sm:max-w-lg">
        <DialogHeader><DialogTitle className="pr-8">Preparar mensagem</DialogTitle><DialogDescription>Revise o texto antes de copiar. Nenhuma mensagem será enviada automaticamente.</DialogDescription></DialogHeader>
        <DialogClose aria-label="Fechar" title="Fechar" className="absolute right-3 top-3 flex size-10 items-center justify-center rounded-lg focus-visible:ring-2 focus-visible:ring-blue-600"><X className="size-5" aria-hidden="true" /></DialogClose>
        <Label htmlFor="follow-up-message">Mensagem para {selected?.client.name}</Label><Textarea id="follow-up-message" rows={6} value={message} onChange={(event) => { setMessage(event.target.value); setCopyState("idle"); }} className="min-h-40 text-base" />
        <p role="status" className="text-sm text-gray-600">{copyState === "copied" ? "Mensagem copiada. Você pode enviá-la quando quiser." : copyState === "error" ? "Não foi possível copiar. Selecione o texto e copie manualmente." : "O orçamento permanece sem alterações."}</p>
        <DialogFooter><DialogClose asChild><Button variant="outline" className="h-11">Fechar</Button></DialogClose><Button onClick={() => void copyMessage()} disabled={!message.trim()} className="h-11"><Copy className="size-4" aria-hidden="true" />Copiar mensagem</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}
