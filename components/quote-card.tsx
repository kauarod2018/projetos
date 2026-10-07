"use client";

import Link from "next/link";
import { whatsappLink } from "@/lib/whatsapp";
import { Eye, MessageCircle } from "lucide-react";
import { QuoteActions } from "./quote-actions";
import { Button } from "@/components/ui/button";
import { formatDate, formatMoney, type Quote } from "@/lib/models";
import styles from "./quote-workspace.module.css";

type QuoteCardProps = {
  quote: Quote;
  onDelete: () => void | Promise<void>;
  onChanged: (quote: Quote) => void;
  readonly?: boolean;
};

function validity(quote: Quote) {
  if (!["Rascunho", "Enviado"].includes(quote.status)) return null;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const days = Math.round((Date.parse(`${quote.validUntil.slice(0, 10)}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86_400_000);
  if (days < 0) return { state: "expired", label: "Vencido" };
  if (days === 0) return { state: "soon", label: "Vence hoje" };
  if (days <= 3) return { state: "soon", label: `Vence em ${days} dia${days === 1 ? "" : "s"}` };
  return { state: "ok", label: `Válido até ${formatDate(quote.validUntil).slice(0, 5)}` };
}

export function QuoteCard({ quote, onDelete, onChanged, readonly }: QuoteCardProps) {
  const whatsappMessage = `Olá, ${quote.client.name}! Estou entrando em contato sobre o orçamento #${quote.id}.`;
  const whatsappHref = whatsappLink(quote.client.phone, whatsappMessage);
  const valid = validity(quote);

  return (
    <article className={styles.card} data-status={quote.status} data-slot="card">
      <div className={styles.cardTop}>
        <div className="min-w-0"><h3>{quote.client.name}</h3><small>Orçamento #{quote.id} · criado em {formatDate(quote.createdAt).slice(0, 5)}</small></div>
        <span className={styles.statusPill}>{quote.status}</span>
      </div>
      <p className={styles.cardDescription}>{quote.description || quote.items[0]?.description || "Serviço sem descrição"}</p>
      <div className={styles.cardValue}>
        <strong>{formatMoney(quote.totalCents)}</strong>
        {valid && <span className={styles.validity} data-state={valid.state}>{valid.label}</span>}
      </div>
      <div className={styles.cardActions}>
        <Button asChild className={`${styles.viewButton} h-10`} variant="outline">
          <Link href={`/orcamentos/${quote.id}`}><Eye className="size-4" aria-hidden="true" />Abrir</Link>
        </Button>
        <a href={whatsappHref} rel="noreferrer" target="_blank" aria-label="Enviar pelo WhatsApp" title="Enviar pelo WhatsApp" className={styles.whatsLink}><MessageCircle aria-hidden="true" /></a>
        {!readonly && <QuoteActions quote={quote} onRemoved={() => void onDelete()} onChanged={onChanged} />}
      </div>
    </article>
  );
}
