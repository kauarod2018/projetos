"use client";
import Link from "next/link";
import { ChevronDown, Clock3, FileText, MessageCircle, Pencil, UserRound } from "lucide-react";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { ServiceReportButton } from "./service-report";
import { appointmentStatuses, type Appointment, type AppointmentStatus } from "@/lib/appointments";
import { whatsappMessage, whatsappMessageUrl, whatsappNumber, whatsappTemplates } from "@/lib/whatsapp-messages";
import styles from "./agenda-workspace.module.css";

const statusTone: Record<AppointmentStatus, string> = { Agendado: "blue", Confirmado: "green", "Em atendimento": "amber", "Concluído": "gray", Cancelado: "red" };

export function AgendaAppointment({ appointment: a, readonly, reception, company, today, businessName, showDate, edit, status }: { appointment: Appointment; readonly: boolean; reception: boolean; company: boolean; today: string; businessName?: string; showDate?: boolean; edit: () => void; status: (value: AppointmentStatus) => void }) {
  const hasWhatsapp = Boolean(whatsappNumber(a.customerPhone)) && a.status !== "Cancelado";
  const closed = ["Concluído", "Cancelado"].includes(a.status);
  return <li className={styles.appointment} data-tone={statusTone[a.status]}>
    <div className={styles.time}>
      <strong>{a.startsAt.slice(11, 16)}</strong>
      <span>{a.endsAt.slice(11, 16)}</span>
      {showDate && <small>{a.startsAt.slice(8, 10)}/{a.startsAt.slice(5, 7)}</small>}
    </div>
    <div className={styles.details}>
      <div className={styles.titleRow}><h2>{a.title}</h2><span className={styles.status}>{a.status}</span></div>
      <p className={styles.customer}><UserRound aria-hidden="true" />{a.customerName}</p>
      <p className={styles.meta}>
        <span><Clock3 aria-hidden="true" />{a.durationMinutes >= 60 ? `${Math.floor(a.durationMinutes / 60)}h${a.durationMinutes % 60 ? String(a.durationMinutes % 60).padStart(2, "0") : ""}` : `${a.durationMinutes} min`}</span>
        {company && <span>{a.employeeName || (a.employeeId ? `Funcionário #${a.employeeId}` : "Sem responsável")}</span>}
        {a.quoteId && !reception && <Link href={`/orcamentos/${a.quoteId}`}><FileText aria-hidden="true" />Orçamento #{a.quoteId}</Link>}
      </p>
      {a.notes && <p className={styles.notes}>{a.notes}</p>}
    </div>
    <div className={styles.actions}>
      {hasWhatsapp && <DropdownMenu>
        <DropdownMenuTrigger asChild><button type="button" className={styles.whatsButton}><MessageCircle aria-hidden="true" />WhatsApp<ChevronDown aria-hidden="true" /></button></DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={styles.whatsMenu}>
          <DropdownMenuLabel>Mensagem para {a.customerName.split(" ")[0]}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {whatsappTemplates.filter(item => item.value === "thanks" ? a.status === "Concluído" : a.status !== "Concluído").map(item => {
            const url = whatsappMessageUrl(a.customerPhone, whatsappMessage(item.value, a, today, businessName));
            return url ? <DropdownMenuItem key={item.value} asChild><a href={url} target="_blank" rel="noopener noreferrer"><span className={styles.menuText}><b>{item.label}</b><small>{item.hint}</small></span></a></DropdownMenuItem> : null;
          })}
        </DropdownMenuContent>
      </DropdownMenu>}
      {!readonly && <>
        <label className="sr-only" htmlFor={`status-${a.id}`}>Situação de {a.title}</label>
        <select id={`status-${a.id}`} value={a.status} onChange={event => status(event.target.value as AppointmentStatus)} className={styles.statusSelect}>{appointmentStatuses.map(value => <option key={value}>{value}</option>)}</select>
        {!closed && <Button variant="outline" size="icon" className={styles.iconButton} title="Editar ou remarcar" aria-label={`Editar ${a.title}`} onClick={edit}><Pencil className="size-4" /></Button>}
      </>}
      <ServiceReportButton id={a.id} title={`${a.title} · ${a.customerName}`} />
    </div>
  </li>;
}
