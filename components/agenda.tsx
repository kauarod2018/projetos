"use client";
import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, MessageCircle, Pencil, Plus, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AppointmentForm } from "@/components/appointment-form";
import { appointmentIsUpcoming, appointmentStatuses, brasiliaDay, moveDay, validDay, whatsappReminderUrl, type Appointment, type AppointmentStatus } from "@/lib/appointments";
import { formatDate } from "@/lib/models";
import { useAppointments } from "@/hooks/use-appointments";
import styles from "@/components/agenda-workspace.module.css";
import { AgendaAppointment } from "./agenda-appointment";
import { useCurrentUser } from "@/hooks/use-current-user";

const statusStyles: Record<AppointmentStatus, string> = { Agendado: styles.scheduled, Confirmado: styles.confirmed, "Em atendimento": styles.inProgress, "Concluído": styles.completed, Cancelado: styles.cancelled };
export function Agenda() {
  const { workspace } = useCurrentUser();
  const company = workspace?.kind === "company", readonly = workspace?.role === "viewer", reception = workspace?.role === "reception";
  const [resource, setResource] = useState("all"), [columns, setColumns] = useState(false);
  const [day, setDay] = useState("");
  const [week, setWeek] = useState(false);
  const [revision, setRevision] = useState(0);
  const [filter, setFilter] = useState("Todos");
  const [form, setForm] = useState<{ appointment: Appointment | null; customerId?: number; quoteId?: number } | null>(null);
  const [action, setAction] = useState<{ appointment: Appointment; status: AppointmentStatus } | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const trigger = useRef<HTMLElement | null>(null);
  const to = day && week ? moveDay(day, 6) : day;
  const state = useAppointments(day, to, revision);
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const date = query.get("data") ?? "";
    setDay(validDay(date) ? date : brasiliaDay());
    const customer = query.get("cliente") ?? "";
    const quote = query.get("orcamento") ?? "";
    if (/^[1-9]\d{0,9}$/.test(customer) && Number(customer) <= 4_294_967_295) setForm({ appointment: null, customerId: Number(customer), ...(/^[1-9]\d{0,9}$/.test(quote) && Number(quote) <= 4_294_967_295 ? { quoteId: Number(quote) } : {}) });
    const refresh = () => { if (document.visibilityState === "visible") setRevision(v => v + 1); };
    document.addEventListener("visibilitychange", refresh);
    return () => document.removeEventListener("visibilitychange", refresh);
  }, []);
  function remember() { trigger.current = document.activeElement as HTMLElement; setNotice(""); setError(""); }
  const restoreFocus = (event: Event) => { event.preventDefault(); if (trigger.current?.isConnected) trigger.current.focus(); else document.getElementById("agenda-day")?.focus(); };
  async function confirmStatus() {
    if (!action || busyRef.current) return;
    busyRef.current = true; setBusy(true); setError("");
    try {
      const response = await fetch(`/api/appointments/${action.appointment.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: action.status, version: action.appointment.version }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Não foi possível atualizar.");
      setNotice(`Compromisso atualizado: ${action.status}.`); setAction(null); setRevision(v => v + 1);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Não foi possível atualizar."); }
    finally { busyRef.current = false; setBusy(false); }
  }
  const visible = state.items.filter(a => (filter === "Todos" || a.status === filter) && (resource === "all" || String(a.employeeId ?? "none") === resource));
  const resources = [...new Map(state.items.map(a => [String(a.employeeId ?? "none"), a.employeeName || (a.employeeId ? `Funcionário #${a.employeeId}` : "Minha agenda / sem funcionário")])).entries()];
  const cards = (items: Appointment[]) => items.map(a => <AgendaAppointment key={a.id} appointment={a} readonly={readonly} reception={reception} company={company} edit={() => { remember(); setForm({ appointment: a }); }} status={status => { remember(); setAction({ appointment: a, status }); }} />);
  return <section className={`${styles.page} mx-auto w-full max-w-6xl space-y-6 px-5 py-8 sm:px-8`}>
    <header className={styles.header}><div><p className={styles.eyebrow}>Organize seus atendimentos</p><h1 className="text-3xl font-semibold">Agenda</h1><p className={styles.subtitle}>Seus compromissos, no horário certo.</p></div>{!readonly && <Button className={styles.newButton} disabled={!day} onClick={() => { remember(); setForm({ appointment: null }); }}><Plus className="size-5" />Novo compromisso</Button>}</header>
    <div className={styles.controls}>
      <div className={styles.dateField}><label htmlFor="agenda-day">Data inicial</label><div className={styles.dateNav}><Button variant="outline" size="icon" className={styles.iconButton} disabled={!day || moveDay(day, week ? -7 : -1) < '2000-01-01'} title="Período anterior" aria-label="Período anterior" onClick={() => setDay(moveDay(day, week ? -7 : -1))}><ChevronLeft /></Button><Input id="agenda-day" type="date" value={day} min="2000-01-01" max="2099-12-25" onChange={e => { if (validDay(e.target.value)) setDay(e.target.value); }} className={styles.dateInput} /><Button variant="outline" size="icon" className={styles.iconButton} disabled={!day || moveDay(day, week ? 13 : 1) > '2099-12-31'} title="Próximo período" aria-label="Próximo período" onClick={() => setDay(moveDay(day, week ? 7 : 1))}><ChevronRight /></Button></div></div>
      <Button variant="outline" className={styles.todayButton} onClick={() => setDay(brasiliaDay())}>Hoje</Button>
      <div role="group" aria-label="Período da agenda" className={styles.period}>{[false, true].map(value => <button key={String(value)} aria-pressed={week === value} onClick={() => setWeek(value)} className={styles.periodOption}>{value ? "7 dias" : "Dia"}</button>)}</div>
      <div className={styles.filterField}><label htmlFor="agenda-filter">Situação</label><select id="agenda-filter" value={filter} onChange={e => setFilter(e.target.value)}><option>Todos</option>{appointmentStatuses.map(status => <option key={status}>{status}</option>)}</select></div>
      {company && <><div className={styles.filterField}><label htmlFor="agenda-resource">Responsável</label><select id="agenda-resource" value={resource} onChange={event => setResource(event.target.value)}><option value="all">Todos os responsáveis</option>{resources.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></div><div role="group" aria-label="Visualização da agenda" className={styles.period}>{[false, true].map(value => <button key={String(value)} aria-pressed={columns === value} onClick={() => setColumns(value)} className={styles.periodOption}>{value ? "Por pessoa" : "Lista"}</button>)}</div></>}
      <Button variant="ghost" size="icon" className={styles.refreshButton} title="Atualizar agenda" aria-label="Atualizar agenda" onClick={() => setRevision(v => v + 1)}><RefreshCw className="size-4" /></Button>
    </div>
    <p className={styles.range}>{day ? `${formatDate(day)}${week ? ` a ${formatDate(to)}` : ""} · ` : ""}Horário de Brasília</p>
    <p role="status" className={styles.notice}>{notice}</p>
    {state.loading ? <p role="status" className={styles.loading}>Carregando agenda…</p> : state.error ? <div role="alert" className={styles.error}><p>{state.error}</p><Button variant="outline" className="mt-3 h-11" onClick={() => setRevision(v => v + 1)}>Tentar novamente</Button></div> : !visible.length ? <div className={styles.empty}><span><CalendarDays className="size-6" aria-hidden="true" /></span><h2>Nenhum compromisso neste período</h2><p>{filter !== "Todos" || resource !== "all" ? "Confira os filtros ou outro dia." : "Seu próximo atendimento pode começar aqui."}</p>{!readonly && filter === "Todos" && <Button variant="outline" onClick={() => { remember(); setForm({ appointment: null }); }}>Adicionar compromisso</Button>}</div> : company && columns ? <div className={styles.resources}>{resources.filter(([id]) => resource === "all" || id === resource).map(([id, name]) => <section key={id}><h2 className={styles.resourceTitle}>{name}</h2><ul className={styles.list}>{cards(visible.filter(a => String(a.employeeId ?? "none") === id))}</ul></section>)}</div> : <ul className={styles.list}>{cards(visible)}</ul>}
    <Dialog open={Boolean(form) && !readonly} onOpenChange={open => { if (!open && !busy) setForm(null); }}><DialogContent showCloseButton={false} onCloseAutoFocus={restoreFocus} className={`${styles.dialog} max-h-[90dvh] overflow-y-auto rounded-lg`}><DialogHeader><DialogTitle className={`${styles.dialogTitle} pr-9`}>{form?.appointment ? "Editar compromisso" : "Novo compromisso"}</DialogTitle><DialogDescription>Cliente, serviço e horário do atendimento.</DialogDescription></DialogHeader><button disabled={busy} aria-label="Fechar formulário" title="Fechar" onClick={() => setForm(null)} className={styles.closeDialog}><X className="size-5" /></button>{form && <AppointmentForm key={form.appointment?.id ?? "new"} appointment={form.appointment} day={day} initialCustomerId={form.customerId} initialQuoteId={form.quoteId} onBusy={setBusy} onCancel={() => setForm(null)} onSaved={(a, seriesCount = 1) => { setDay(a.startsAt.slice(0,10)); setFilter("Todos"); setResource("all"); setForm(null); setNotice(seriesCount > 1 ? `${seriesCount} atendimentos recorrentes criados.` : "Compromisso salvo."); setRevision(v => v + 1); }} />}</DialogContent></Dialog>
    <Dialog open={Boolean(action)} onOpenChange={open => { if (!open && !busy) setAction(null); }}><DialogContent showCloseButton={false} onCloseAutoFocus={restoreFocus} className={`${styles.dialog} ${styles.statusDialog} max-h-[90dvh] overflow-y-auto rounded-lg`}><DialogHeader><DialogTitle className={styles.dialogTitle}>Alterar situação?</DialogTitle><DialogDescription className="break-words">{action?.appointment.title} · {action && formatDate(action.appointment.startsAt)} às {action?.appointment.startsAt.slice(11)}. Nova situação: {action?.status}.</DialogDescription></DialogHeader><p className={styles.dialogCopy}>{action?.status === "Cancelado" ? "O horário será liberado e o registro ficará na agenda." : action?.status === "Concluído" ? "Concluir não registra recebimento no financeiro." : "A disponibilidade do horário será conferida ao confirmar."}</p>{error && <p role="alert" className={styles.dialogError}>{error}</p>}<div className="flex flex-wrap justify-end gap-2"><Button autoFocus variant="outline" disabled={busy} onClick={() => setAction(null)} className={styles.secondaryButton}>Voltar</Button><Button disabled={busy} onClick={() => void confirmStatus()} className={styles.confirmButton}>{busy ? "Salvando…" : "Confirmar alteração"}</Button></div></DialogContent></Dialog>
  </section>;
}
