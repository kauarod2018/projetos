"use client";
import Link from "next/link";
import { MessageCircle, Pencil } from "lucide-react";
import { Button } from "./ui/button";
import { ServiceReportButton } from "./service-report";
import { appointmentIsUpcoming, appointmentStatuses, whatsappReminderUrl, type Appointment, type AppointmentStatus } from "@/lib/appointments";
import { formatDate } from "@/lib/models";
import styles from "./agenda-workspace.module.css";
const statusStyles: Record<AppointmentStatus, string> = { Agendado: styles.scheduled, Confirmado: styles.confirmed, "Em atendimento": styles.inProgress, "Concluído": styles.completed, Cancelado: styles.cancelled };
export function AgendaAppointment({ appointment: a, readonly, reception, company, edit, status }: { appointment: Appointment; readonly: boolean; reception: boolean; company: boolean; edit: () => void; status: (value: AppointmentStatus) => void }) {
  const reminder = whatsappReminderUrl(a.customerPhone, a.customerName, a.title, a.startsAt);
  return <li className={styles.appointment}>
    <div className={styles.time}><p>{a.startsAt.slice(11)}<span>–</span>{a.endsAt.slice(11)}</p><p>{formatDate(a.startsAt)}{a.startsAt.slice(0,10) !== a.endsAt.slice(0,10) ? ` a ${formatDate(a.endsAt)}` : ""}</p></div>
    <div className={styles.details}><h2>{a.title}</h2><p className={styles.customer}>{a.customerName}</p>{company && <p className={styles.notes}>{a.employeeName || (a.employeeId ? `Funcionário #${a.employeeId}` : "Minha agenda / sem funcionário")}</p>}{a.notes && <p className={styles.notes}>{a.notes}</p>}<span className={`${styles.status} ${statusStyles[a.status]}`}>{a.status}</span>{a.quoteId && !reception && <Link className={styles.quoteLink} href={`/orcamentos/${a.quoteId}`}>Orçamento #{a.quoteId}</Link>}</div>
    <div className={styles.actions}>{!readonly && <><label className="sr-only" htmlFor={`status-${a.id}`}>Situação de {a.title}</label><select id={`status-${a.id}`} value={a.status} onChange={event => status(event.target.value as AppointmentStatus)} className={styles.statusSelect}>{appointmentStatuses.map(value => <option key={value}>{value}</option>)}</select>{reminder && appointmentIsUpcoming(a.startsAt) && !["Concluído", "Cancelado"].includes(a.status) && <Button variant="outline" asChild className={styles.secondaryButton}><a href={reminder} target="_blank" rel="noopener noreferrer"><MessageCircle aria-hidden="true" className="size-4" />Preparar lembrete</a></Button>}{!["Concluído", "Cancelado"].includes(a.status) && <Button variant="outline" size="icon" className={styles.iconButton} title="Editar ou remarcar" aria-label={`Editar ${a.title}`} onClick={edit}><Pencil className="size-4" /></Button>}</>}<ServiceReportButton id={a.id} title={`${a.title} · ${a.customerName}`} /></div>
  </li>;
}
