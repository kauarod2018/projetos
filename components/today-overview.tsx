"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlarmClock, ArrowRight, ArrowDownLeft, ArrowUpRight, CalendarDays, CalendarPlus, Check, Copy, FileText, MessageCircle, Plus, RefreshCw, Sparkles, TriangleAlert, UserRoundPlus, Wallet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCurrentUser } from "@/hooks/use-current-user";
import { formatMoney, type FinanceTransaction, type Quote, type QuoteStatus } from "@/lib/models";
import { followUpMessage, greeting, summarizeMovement, summarizeQuotes } from "@/lib/today-summary";
import { useAppointments } from "@/hooks/use-appointments";
import { brasiliaDay, whatsappReminderUrl, type Appointment } from "@/lib/appointments";
import type { ObligationSummary } from "@/lib/obligations-summary";
import { useAssistant } from "@/components/assistant-context";
import { OperationsQueue } from "./operations-queue";
import styles from "./today-overview.module.css";

type LoadState<T> = { status: "loading" } | { status: "error" } | { status: "ready"; data: T[] };
type ValueState<T> = { status: "loading" } | { status: "error" } | { status: "ready"; data: T };
const TZ = "America/Sao_Paulo";
const pipeline: { status: QuoteStatus; label: string; tone: string }[] = [
  { status: "Rascunho", label: "Rascunho", tone: "gray" },
  { status: "Enviado", label: "Enviado", tone: "blue" },
  { status: "Aprovado", label: "Aprovado", tone: "violet" },
  { status: "Em andamento", label: "Em andamento", tone: "amber" },
  { status: "Finalizado", label: "Finalizado", tone: "cyan" },
  { status: "Pago", label: "Pago", tone: "green" },
];

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

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

/* Digita o texto aos poucos, como uma resposta de IA. Respeita quem prefere menos movimento. */
function useTyping(text: string) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    if (!text) { setShown(""); return; }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setShown(text); return; }
    let index = 0;
    setShown("");
    const timer = window.setInterval(() => {
      index += 2;
      setShown(text.slice(0, index));
      if (index >= text.length) window.clearInterval(timer);
    }, 18);
    return () => window.clearInterval(timer);
  }, [text]);
  return shown;
}

function timeOf(appointment: Appointment) {
  return appointment.startsAt.slice(11, 16);
}

export function TodayOverview() {
  const { user, workspace } = useCurrentUser();
  const { launch } = useAssistant();
  const [now, setNow] = useState<Date | null>(null);
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<Quote | null>(null);
  const [message, setMessage] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const messageTrigger = useRef<HTMLElement | null>(null);
  const quotes = useTodayData<Quote>("/api/quotes", "quotes", Boolean(user), revision);
  const transactions = useTodayData<FinanceTransaction>("/api/transactions", "transactions", Boolean(user), revision);
  const [obligations, setObligations] = useState<ValueState<ObligationSummary>>({ status: "loading" });
  const today = now ? brasiliaDay(now) : "";
  const agenda = useAppointments(today, today, revision);
  const appointments = useMemo(() => agenda.items.filter(a => a.status !== "Cancelado").sort((a, b) => a.startsAt.localeCompare(b.startsAt)), [agenda.items]);
  const canAsk = Boolean(workspace ? !["employee", "reception", "viewer"].includes(workspace.role) : true);

  useEffect(() => {
    if (!user) { setObligations({ status: "loading" }); return; }
    const controller = new AbortController();
    setObligations({ status: "loading" });
    void fetch("/api/obligations/summary", { cache: "no-store", signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error("REQUEST_FAILED");
      const data = await response.json() as { summary?: ObligationSummary };
      if (!data.summary?.overdue || !data.summary?.upcoming) throw new Error("INVALID_RESPONSE");
      if (!controller.signal.aborted) setObligations({ status: "ready", data: data.summary });
    }).catch(() => {
      if (!controller.signal.aborted) setObligations({ status: "error" });
    });
    return () => controller.abort();
  }, [user, revision]);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    const refresh = () => {
      if (document.visibilityState === "visible") { setNow(new Date()); setRevision((value) => value + 1); }
    };
    document.addEventListener("visibilitychange", refresh);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", refresh); };
  }, []);

  const summary = quotes.status === "ready" && now ? summarizeQuotes(quotes.data, now, TZ) : null;
  const movement = transactions.status === "ready" && now ? summarizeMovement(transactions.data, now, TZ) : null;
  const obligation = obligations.status === "ready" ? obligations.data : null;
  const clock = now ? new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(now) : "";
  const nowKey = now ? `${today}T${clock}` : "";
  const nextVisit = appointments.find(a => a.startsAt >= nowKey && !["Concluído"].includes(a.status));
  const firstName = user?.name.trim().split(/\s+/)[0] ?? "";
  const rawDate = now ? new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" }).format(now) : "";
  const dateLabel = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);
  const overdueCount = (obligation?.overdue.receivable.count ?? 0) + (obligation?.overdue.payable.count ?? 0) + (summary?.expired.length ?? 0);
  const ready = !agenda.loading && summary && movement && obligations.status !== "loading";

  const brief = useMemo(() => {
    if (!ready || !summary || !movement) return "";
    const parts: string[] = [];
    if (!appointments.length) parts.push("Sua agenda de hoje está livre.");
    else if (nextVisit) parts.push(`Hoje você tem ${plural(appointments.length, "atendimento", "atendimentos")}. O próximo é às ${timeOf(nextVisit)}, com ${nextVisit.customerName}.`);
    else parts.push(`Você já passou por ${plural(appointments.length, "atendimento", "atendimentos")} hoje.`);
    if (movement.income > 0) parts.push(`Entraram ${formatMoney(movement.income)} hoje.`);
    if (summary.receivable > 0) parts.push(`Há ${formatMoney(summary.receivable)} para receber de orçamentos aprovados.`);
    if (obligation && obligation.overdue.receivable.count + obligation.overdue.payable.count > 0) parts.push(`Atenção: ${plural(obligation.overdue.receivable.count + obligation.overdue.payable.count, "conta está atrasada", "contas estão atrasadas")}.`);
    if (summary.pending > 0) parts.push(`${plural(summary.pending, "orçamento precisa", "orçamentos precisam")} da sua atenção.`);
    if (parts.length === 1 && !appointments.length) parts.push("Que tal aproveitar para enviar orçamentos ou cadastrar novos clientes?");
    return parts.join(" ");
  }, [ready, summary, movement, obligation, appointments, nextVisit]);
  const typed = useTyping(brief);

  const quoteStats = useMemo(() => {
    const stats = new Map<QuoteStatus, { count: number; total: number }>();
    if (quotes.status === "ready") for (const quote of quotes.data) {
      if (quote.archivedAt) continue;
      const entry = stats.get(quote.status) ?? { count: 0, total: 0 };
      entry.count += 1; entry.total += quote.totalCents;
      stats.set(quote.status, entry);
    }
    return stats;
  }, [quotes]);
  const pipelineTotal = pipeline.reduce((sum, step) => sum + (quoteStats.get(step.status)?.count ?? 0), 0);

  const retry = () => setRevision((value) => value + 1);

  function prepareMessage(quote: Quote) {
    messageTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSelected(quote); setMessage(followUpMessage(quote)); setCopyState("idle");
  }

  async function copyMessage() {
    try { await navigator.clipboard.writeText(message); setCopyState("copied"); }
    catch { setCopyState("error"); }
  }

  return <>
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="today-greeting">
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.heroGrid} aria-hidden="true" />
        <div className={styles.heroTop}>
          <div className={styles.orb} aria-hidden="true"><span /><span /><span /></div>
          <div className={styles.heroClock}><span className={styles.live} aria-hidden="true" />{clock || "--:--"}<span>{dateLabel}</span></div>
        </div>
        <h1 id="today-greeting" className={styles.greeting}>
          <span>{now ? greeting(now, TZ) : "Olá"}{firstName ? `, ${firstName}` : ""}.</span>
        </h1>
        <p className={styles.brief} aria-live="polite" aria-busy={!brief}>
          {brief ? <>{typed}<span className={styles.caret} aria-hidden="true" /></> : <span className={styles.thinking}>Analisando o seu dia<span aria-hidden="true">...</span></span>}
        </p>
        <div className={styles.chips}>
          <Link href="/novo-orcamento" className={styles.chipPrimary}><Plus aria-hidden="true" />Novo orçamento</Link>
          <Link href="/agenda" className={styles.chip}><CalendarPlus aria-hidden="true" />Agendar</Link>
          <Link href="/clientes?novo=1" className={styles.chip}><UserRoundPlus aria-hidden="true" />Novo cliente</Link>
          <Link href="/financas?novo=entrada" className={styles.chip}><ArrowDownLeft aria-hidden="true" />Registrar entrada</Link>
          {canAsk && <button type="button" onClick={() => launch("today")} className={styles.chip}><Sparkles aria-hidden="true" />Perguntar à Vemo</button>}
        </div>
        <dl className={styles.pulse}>
          <div><dt><CalendarDays aria-hidden="true" />Atendimentos hoje</dt><dd>{agenda.loading ? "·" : agenda.error ? "—" : appointments.length}</dd></div>
          <div><dt><ArrowDownLeft aria-hidden="true" />Entrou hoje</dt><dd>{movement ? formatMoney(movement.income) : transactions.status === "error" ? "—" : "·"}</dd></div>
          <div><dt><Wallet aria-hidden="true" />A receber</dt><dd>{summary ? formatMoney(summary.receivable) : quotes.status === "error" ? "—" : "·"}</dd></div>
          <div data-alert={overdueCount > 0 || undefined}><dt><AlarmClock aria-hidden="true" />Atrasos</dt><dd>{ready ? overdueCount : "·"}</dd></div>
        </dl>
      </section>

      <div className={styles.grid}>
        <section className={`${styles.panel} ${styles.agenda}`} aria-labelledby="agenda-title">
          <header className={styles.panelHead}>
            <span className={`${styles.icon} ${styles.toneBlue}`}><CalendarDays aria-hidden="true" /></span>
            <div><h2 id="agenda-title">Agenda de hoje</h2><p>{agenda.loading ? "Carregando..." : appointments.length ? plural(appointments.length, "compromisso", "compromissos") : "Nenhum compromisso"}</p></div>
            <Link href="/agenda" className={styles.more}>Abrir agenda<ArrowRight aria-hidden="true" /></Link>
          </header>
          {agenda.error ? <Failure retry={retry}>{agenda.error}</Failure> : agenda.loading ? <Skeleton rows={3} /> : !appointments.length ? <div className={styles.empty}><CalendarDays aria-hidden="true" /><p>Dia livre. Um bom momento para organizar a semana.</p><Link href="/agenda" className={styles.more}>Agendar atendimento<ArrowRight aria-hidden="true" /></Link></div> : <ol className={styles.timeline}>
            {appointments.map(a => {
              const done = a.status === "Concluído";
              const current = !done && nextVisit?.id === a.id;
              const whatsapp = whatsappReminderUrl(a.customerPhone, a.customerName, a.title, a.startsAt);
              return <li key={a.id} data-state={done ? "done" : current ? "next" : "later"}>
                <time dateTime={a.startsAt}>{timeOf(a)}</time>
                <span className={styles.dot} aria-hidden="true" />
                <div className={styles.visit}>
                  <strong>{a.title}</strong>
                  <span>{a.customerName}{a.employeeName ? ` · ${a.employeeName}` : ""}</span>
                </div>
                {current && <span className={styles.nextTag}>Próximo</span>}
                {!current && <span className={styles.statusTag}>{a.status}</span>}
                {whatsapp && !done && <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={styles.whats} aria-label={`Enviar lembrete pelo WhatsApp para ${a.customerName}`} title="Lembrete pelo WhatsApp"><MessageCircle aria-hidden="true" /></a>}
              </li>;
            })}
          </ol>}
        </section>

        <section className={`${styles.panel} ${styles.money}`} aria-labelledby="money-title">
          <header className={styles.panelHead}>
            <span className={`${styles.icon} ${styles.toneGreen}`}><Wallet aria-hidden="true" /></span>
            <div><h2 id="money-title">Dinheiro</h2><p>Movimento de hoje</p></div>
            <Link href="/financas" className={styles.more}>Financeiro<ArrowRight aria-hidden="true" /></Link>
          </header>
          {transactions.status === "error" ? <Failure retry={retry}>Não foi possível carregar as movimentações.</Failure> : !movement ? <Skeleton rows={3} /> : <>
            <div className={styles.balance}><span>Sobrou hoje</span><strong data-negative={movement.balance < 0 || undefined}>{formatMoney(movement.balance)}</strong></div>
            <ul className={styles.flow}>
              <li><ArrowDownLeft className={styles.in} aria-hidden="true" />Entrou<b>{formatMoney(movement.income)}</b></li>
              <li><ArrowUpRight className={styles.out} aria-hidden="true" />Saiu<b>{formatMoney(movement.expenses)}</b></li>
              <li><Wallet className={styles.wait} aria-hidden="true" />A receber<b>{summary ? formatMoney(summary.receivable) : "—"}</b></li>
            </ul>
          </>}
        </section>

        <section className={`${styles.panel} ${styles.alerts}`} aria-labelledby="alerts-title">
          <header className={styles.panelHead}>
            <span className={`${styles.icon} ${overdueCount ? styles.toneRed : styles.toneGreen}`}>{overdueCount ? <TriangleAlert aria-hidden="true" /> : <Check aria-hidden="true" />}</span>
            <div><h2 id="alerts-title">Atrasos e vencimentos</h2><p>{!ready ? "Verificando..." : overdueCount ? "Precisam da sua atenção" : "Tudo em dia"}</p></div>
          </header>
          {obligations.status === "error" ? <Failure retry={retry}>Não foi possível consultar os vencimentos.</Failure> : !obligation || !summary ? <Skeleton rows={3} /> : <ul className={styles.alertList}>
            <AlertRow tone={obligation.overdue.receivable.count ? "red" : "ok"} label="Clientes com pagamento atrasado" count={obligation.overdue.receivable.count} value={obligation.overdue.receivable.remainingCents} href="/financas#contas" />
            <AlertRow tone={obligation.overdue.payable.count ? "red" : "ok"} label="Contas suas atrasadas" count={obligation.overdue.payable.count} value={obligation.overdue.payable.remainingCents} href="/financas#contas" />
            <AlertRow tone={obligation.upcoming.payable.count + obligation.upcoming.receivable.count ? "amber" : "ok"} label="Vencem nos próximos 7 dias" count={obligation.upcoming.payable.count + obligation.upcoming.receivable.count} value={obligation.upcoming.payable.remainingCents + obligation.upcoming.receivable.remainingCents} href="/financas#contas" />
            <AlertRow tone={summary.expired.length ? "amber" : "ok"} label="Orçamentos com validade vencida" count={summary.expired.length} href="/orcamentos?filtro=expirados" />
          </ul>}
        </section>

        <section className={`${styles.panel} ${styles.quotes}`} aria-labelledby="quotes-title">
          <header className={styles.panelHead}>
            <span className={`${styles.icon} ${styles.toneViolet}`}><FileText aria-hidden="true" /></span>
            <div><h2 id="quotes-title">Orçamentos</h2><p>{summary ? `${plural(summary.awaiting, "aguardando resposta", "aguardando resposta")}` : "Carregando..."}</p></div>
            <Link href="/orcamentos" className={styles.more}>Ver todos<ArrowRight aria-hidden="true" /></Link>
          </header>
          {quotes.status === "error" ? <Failure retry={retry}>Não foi possível carregar seus orçamentos.</Failure> : quotes.status === "loading" ? <Skeleton rows={3} /> : <>
            {pipelineTotal > 0 && <div className={styles.funnelBar} role="img" aria-label="Distribuição dos orçamentos por etapa">
              {pipeline.map(step => { const count = quoteStats.get(step.status)?.count ?? 0; return count ? <span key={step.status} data-tone={step.tone} style={{ flexGrow: count }} /> : null; })}
            </div>}
            <ul className={styles.funnel}>
              {pipeline.map(step => { const stat = quoteStats.get(step.status); return <li key={step.status} data-tone={step.tone}><span className={styles.swatch} aria-hidden="true" />{step.label}<b>{stat?.count ?? 0}</b><small>{stat ? formatMoney(stat.total) : "—"}</small></li>; })}
            </ul>
            {summary && (summary.followUps.length > 0 || summary.drafts.length > 0) && <ul className={styles.followList}>
              {summary.followUps.slice(0, 2).map(({ quote, days }) => <li key={quote.id}>
                <div><strong>{quote.client.name}</strong><span>Sem resposta há {days} dias</span></div>
                <button type="button" onClick={() => prepareMessage(quote)}><MessageCircle aria-hidden="true" />Cobrar resposta</button>
              </li>)}
              {summary.drafts.length > 0 && <li><div><strong>{plural(summary.drafts.length, "rascunho", "rascunhos")}</strong><span>Ainda não enviados ao cliente</span></div><Link href="/orcamentos?filtro=rascunhos">Revisar</Link></li>}
            </ul>}
            {quotes.data.length === 0 && <div className={styles.empty}><FileText aria-hidden="true" /><p>Nenhum orçamento ainda.</p><Link href="/novo-orcamento" className={styles.more}>Criar o primeiro<ArrowRight aria-hidden="true" /></Link></div>}
          </>}
        </section>

        <section className={`${styles.panel} ${styles.suggestions}`} aria-label="Sugestões da Vemo">
          <OperationsQueue revision={revision} />
        </section>
      </div>
    </div>

    <Dialog open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null); }}>
      <DialogContent showCloseButton={false} onCloseAutoFocus={(event) => { event.preventDefault(); messageTrigger.current?.focus(); }} className="max-h-[90dvh] overflow-y-auto rounded-xl bg-white sm:max-w-lg">
        <DialogHeader><DialogTitle className="pr-8">Mensagem para o cliente</DialogTitle><DialogDescription>Revise o texto, copie e envie pelo WhatsApp.</DialogDescription></DialogHeader>
        <DialogClose aria-label="Fechar" title="Fechar" className="absolute right-3 top-3 flex size-10 items-center justify-center rounded-lg focus-visible:ring-2 focus-visible:ring-[var(--vemo-focus)]"><X className="size-5" aria-hidden="true" /></DialogClose>
        <Label htmlFor="follow-up-message">Mensagem para {selected?.client.name}</Label><Textarea id="follow-up-message" rows={6} value={message} onChange={(event) => { setMessage(event.target.value); setCopyState("idle"); }} className="min-h-40 text-base" />
        <p role="status" className="text-sm text-[var(--vemo-muted)]">{copyState === "copied" ? "Mensagem copiada." : copyState === "error" ? "Não foi possível copiar. Selecione o texto e copie manualmente." : ""}</p>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline" className="h-11">Fechar</Button></DialogClose>
          {selected && whatsappLinkFor(selected, message) && <Button asChild variant="outline" className="h-11"><a href={whatsappLinkFor(selected, message)!} target="_blank" rel="noopener noreferrer"><MessageCircle className="size-4" aria-hidden="true" />Abrir no WhatsApp</a></Button>}
          <Button onClick={() => void copyMessage()} disabled={!message.trim()} className="h-11"><Copy className="size-4" aria-hidden="true" />Copiar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}

function whatsappLinkFor(quote: Quote, message: string) {
  const digits = (quote.client.phone ?? "").replace(/\D/g, "");
  if (!(digits.length === 10 || digits.length === 11 || ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")))) return null;
  return `https://wa.me/${digits.length <= 11 ? `55${digits}` : digits}?text=${encodeURIComponent(message)}`;
}

function AlertRow({ tone, label, count, value, href }: { tone: "red" | "amber" | "ok"; label: string; count: number; value?: number; href: string }) {
  return <li data-tone={tone}>
    <Link href={href}>
      <span className={styles.alertDot} aria-hidden="true" />
      <span className={styles.alertLabel}>{label}</span>
      <b>{count}</b>
      {value !== undefined && count > 0 && <small>{formatMoney(value)}</small>}
    </Link>
  </li>;
}

function Failure({ children, retry }: { children: React.ReactNode; retry: () => void }) {
  return <div className={styles.failure} role="alert"><p>{children}</p><button type="button" onClick={retry}><RefreshCw aria-hidden="true" />Tentar novamente</button></div>;
}

function Skeleton({ rows }: { rows: number }) {
  return <div className={styles.skeleton} role="status" aria-label="Carregando">{Array.from({ length: rows }, (_, index) => <span key={index} />)}</div>;
}
