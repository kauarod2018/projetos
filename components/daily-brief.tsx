"use client";

import Link from "next/link";
import { CalendarClock, CalendarDays, CircleDollarSign, MessageCircle, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VemoMark } from "@/components/vemo-brand";
import { useAssistant } from "@/components/assistant-context";
import { nextDailyAppointment } from "@/lib/daily-brief";
import { formatMoney, type Quote } from "@/lib/models";
import type { Appointment } from "@/lib/appointments";
import type { summarizeQuotes } from "@/lib/today-summary";
import styles from "./daily-brief.module.css";
import type { ObligationSummary } from "@/lib/obligations-summary";

export function DailyBrief({ now, agenda, summary, quotesError, obligationSummary, obligationsError, retry, prepareMessage }: {
  now: Date | null; agenda: { items: Appointment[]; loading: boolean; error: string };
  summary: ReturnType<typeof summarizeQuotes> | null; quotesError: boolean;
  obligationSummary: ObligationSummary | null; obligationsError: boolean;
  retry: () => void; prepareMessage: (quote: Quote) => void;
}) {
  const { launch } = useAssistant();
  const schedule = now && !agenda.loading && !agenda.error ? nextDailyAppointment(agenda.items, now) : null;
  const followUp = summary?.followUps[0];
  return <section aria-labelledby="daily-brief-title" className={styles.brief}>
    <div className={styles.header}>
      <div className={styles.titleGroup}><VemoMark decorative className="size-8" /><div><h2 id="daily-brief-title">Seu dia com a Vemo</h2><p>Agenda, dinheiro e pendências em um só lugar.</p></div></div>
      <div className={styles.headerActions}><Button variant="outline" className="h-11" title="Conversar com a Vemo" aria-label="Conversar com a Vemo" onClick={() => launch("today")}><Sparkles className="size-4" aria-hidden="true" /><span>Conversar com a Vemo</span></Button><Button variant="ghost" size="icon" className="size-11 shrink-0" title="Atualizar resumo" aria-label="Atualizar resumo" onClick={retry}><RefreshCw className="size-4" /></Button></div>
    </div>
    <div className={styles.grid}>
      <div className={`${styles.item} ${styles.appointment}`}><h3><CalendarDays className="size-4" aria-hidden="true" />{schedule?.inProgressWindow ? "Horário em curso" : "Próximo atendimento"}</h3>
        {agenda.error ? <p role="alert" className="mt-3 text-sm text-red-700">Agenda indisponível. Atualize o resumo para tentar novamente.</p> : !schedule ? <p role="status" className="mt-3 text-sm text-gray-500">Consultando agenda...</p> : schedule.next ? <><p className="mt-3 break-words font-semibold">{schedule.next.startsAt.slice(11)} · {schedule.next.customerName}</p><p className="mt-1 break-words text-sm text-gray-600">{schedule.next.title}</p><p className="mt-2 text-xs text-gray-500">{schedule.remaining} atendimento(s) com horário em curso ou a seguir hoje.</p></> : <p className="mt-3 text-sm leading-6 text-gray-600">Nenhum atendimento restante registrado para hoje.</p>}
        <Button variant="outline" className="mt-4 h-11" onClick={() => launch("appointment")}>Agendar atendimento</Button>
      </div>
      <div className={`${styles.item} ${styles.receivable}`}><h3><CircleDollarSign className="size-4" aria-hidden="true" />Recebimentos para conferir</h3>
        {quotesError ? <p role="alert" className="mt-3 text-sm text-red-700">Valores indisponíveis. Atualize o resumo para tentar novamente.</p> : !summary ? <p role="status" className="mt-3 text-sm text-gray-500">Consultando valores...</p> : <><p className="mt-3 text-xl font-semibold tabular-nums">{formatMoney(summary.receivable)}</p><p className="mt-1 text-sm leading-6 text-gray-600">A receber em orçamentos aprovados, em andamento ou finalizados. Não é saldo bancário.</p><Button variant="outline" className="mt-4 h-11" onClick={() => launch(summary.receivable > 0 ? "receipt" : "income")}>{summary.receivable > 0 ? "Registrar recebimento" : "Consultar entradas do mês"}</Button></>}
      </div>
      <div className={`${styles.item} ${styles.followup}`}><h3><MessageCircle className="size-4" aria-hidden="true" />Próximo retorno</h3>
        {quotesError ? <p role="alert" className="mt-3 text-sm text-red-700">Orçamentos indisponíveis.</p> : !summary ? <p role="status" className="mt-3 text-sm text-gray-500">Consultando retornos...</p> : followUp ? <><p className="mt-3 break-words font-semibold">{followUp.quote.client.name}</p><p className="mt-1 text-sm leading-6 text-gray-600">Orçamento #{followUp.quote.id} sem resposta há {followUp.days} dias. {summary.followUps.length > 1 ? `Mais ${summary.followUps.length - 1} para acompanhar.` : ""}</p><Button variant="outline" className="mt-4 h-11" onClick={() => prepareMessage(followUp.quote)}>Preparar retorno</Button></> : <><p className="mt-3 text-sm leading-6 text-gray-600">Nenhum orçamento ainda válido está sem resposta há 3 dias ou mais.</p><Button asChild variant="outline" className="mt-4 h-11"><Link href="/orcamentos">Ver orçamentos</Link></Button></>}
      </div>
      <div className={`${styles.item} ${styles.dueDates}`}><h3><CalendarClock className="size-4" aria-hidden="true" />Vencimentos de contas</h3>
        {obligationsError ? <p role="alert" className="mt-3 text-sm text-red-700">Não foi possível consultar as contas previstas.</p> : !obligationSummary ? <p role="status" className="mt-3 text-sm text-gray-500">Consultando vencimentos...</p> : (() => {
          const overdueCount = obligationSummary.overdue.receivable.count + obligationSummary.overdue.payable.count;
          const upcomingCount = obligationSummary.upcoming.receivable.count + obligationSummary.upcoming.payable.count;
          if (!overdueCount && !upcomingCount) return <p className="mt-3 text-sm leading-6 text-gray-600">Nenhuma conta aberta vencida ou com vencimento em até 7 dias.</p>;
          return <div className="mt-3 space-y-3 text-sm leading-6">
            {overdueCount > 0 ? <div><p className="font-semibold">{overdueCount} parcela{overdueCount === 1 ? " vencida" : "s vencidas"}</p><p className="text-gray-600">A receber: {formatMoney(obligationSummary.overdue.receivable.remainingCents)} · A pagar: {formatMoney(obligationSummary.overdue.payable.remainingCents)}</p></div> : null}
            {upcomingCount > 0 ? <div><p className="font-semibold">{upcomingCount} parcela{upcomingCount === 1 ? " a vencer" : "s a vencer"} em até 7 dias</p><p className="text-gray-600">A receber: {formatMoney(obligationSummary.upcoming.receivable.remainingCents)} · A pagar: {formatMoney(obligationSummary.upcoming.payable.remainingCents)}</p></div> : null}
          </div>;
        })()}
        <Button asChild variant="outline" className="mt-4 h-11"><Link href="/financas#contas-previstas">Abrir contas previstas</Link></Button>
      </div>
    </div>
    <p className={styles.note}>Agenda e vencimentos consideram Brasília. Valores previstos não são saldo bancário; nenhuma mensagem é enviada automaticamente.</p>
  </section>;
}
