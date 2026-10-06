"use client";
import { useState } from "react";
import { Check, MessageCircle, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAppointments } from "@/hooks/use-appointments";
import { moveDay } from "@/lib/appointments";
import { whatsappMessage, whatsappMessageUrl, type WhatsappTemplate } from "@/lib/whatsapp-messages";
import styles from "./agenda-workspace.module.css";

/* Painel para enviar, um a um, as mensagens do dia pelo WhatsApp do próprio usuário. */
export function WhatsappReminders({ open, onOpenChange, today, businessName, onCloseAutoFocus }: { open: boolean; onOpenChange: (open: boolean) => void; today: string; businessName?: string; onCloseAutoFocus: (event: Event) => void }) {
  const [target, setTarget] = useState<"today" | "tomorrow">("tomorrow");
  const [template, setTemplate] = useState<WhatsappTemplate>("confirm");
  const [sent, setSent] = useState<Set<number>>(new Set());
  const day = target === "today" ? today : moveDay(today, 1);
  const state = useAppointments(open ? day : "", open ? day : "", 0);
  const items = state.items.filter(a => !["Cancelado", "Concluído"].includes(a.status)).sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent showCloseButton={false} onCloseAutoFocus={onCloseAutoFocus} className={`${styles.dialog} max-h-[90dvh] overflow-y-auto sm:max-w-lg`}>
      <DialogHeader>
        <DialogTitle className={`${styles.dialogTitle} flex items-center gap-2 pr-9`}><span className={styles.whatsBadge}><MessageCircle aria-hidden="true" /></span>Lembretes no WhatsApp</DialogTitle>
        <DialogDescription>Escolha a mensagem e toque em enviar. O WhatsApp abre com o texto pronto para cada cliente.</DialogDescription>
      </DialogHeader>
      <button type="button" aria-label="Fechar" title="Fechar" onClick={() => onOpenChange(false)} className={styles.closeDialog}><X className="size-5" /></button>
      <div className={styles.reminderControls}>
        <div role="group" aria-label="Dia" className={styles.period}>
          {(["today", "tomorrow"] as const).map(value => <button key={value} type="button" aria-pressed={target === value} onClick={() => setTarget(value)} className={styles.periodOption}>{value === "today" ? "Hoje" : "Amanhã"}</button>)}
        </div>
        <div role="group" aria-label="Mensagem" className={styles.period}>
          {([["confirm", "Confirmar horário"], ["reminder", "Lembrete"]] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={template === value} onClick={() => setTemplate(value)} className={styles.periodOption}>{label}</button>)}
        </div>
      </div>
      {state.loading ? <p role="status" className={styles.loading}>Carregando…</p> : state.error ? <p role="alert" className={styles.dialogError}>{state.error}</p> : !items.length ? <p className={styles.reminderEmpty}>Nenhum atendimento {target === "today" ? "hoje" : "amanhã"} para avisar.</p> : <>
        <ul className={styles.reminderList}>
          {items.map(a => {
            const message = whatsappMessage(template, a, today, businessName);
            const url = whatsappMessageUrl(a.customerPhone, message);
            const done = sent.has(a.id);
            return <li key={a.id} data-done={done || undefined}>
              <time>{a.startsAt.slice(11, 16)}</time>
              <div><strong>{a.customerName}</strong><span>{a.title}</span></div>
              {url ? <a href={url} target="_blank" rel="noopener noreferrer" onClick={() => setSent(current => new Set(current).add(a.id))} className={styles.sendButton}>{done ? <><Check aria-hidden="true" />Enviado</> : <><MessageCircle aria-hidden="true" />Enviar</>}</a> : <span className={styles.noPhone}>Sem WhatsApp</span>}
            </li>;
          })}
        </ul>
        <p className={styles.reminderHint}>{sent.size ? `${[...sent].filter(id => items.some(a => a.id === id)).length} de ${items.filter(a => whatsappMessageUrl(a.customerPhone, "x")).length} enviados.` : "Clientes sem celular cadastrado aparecem como \"Sem WhatsApp\"."}</p>
      </>}
    </DialogContent>
  </Dialog>;
}
