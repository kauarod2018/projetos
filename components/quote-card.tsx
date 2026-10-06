"use client";

import Link from "next/link";
import { whatsappLink } from "@/lib/whatsapp";
import { Eye, MessageCircle } from "lucide-react";
import { QuoteActions } from "./quote-actions";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate, formatMoney, type Quote, type QuoteStatus } from "@/lib/models";

type QuoteCardProps = {
  quote: Quote;
  onDelete: () => void | Promise<void>;
  onChanged: (quote: Quote) => void;
  readonly?: boolean;
};

const statusStyles: Record<QuoteStatus, string> = {
  Rascunho: "border-gray-200 bg-gray-100 text-gray-700",
  Enviado: "border-blue-200 bg-blue-100 text-blue-800",
  Aprovado: "border-emerald-200 bg-emerald-100 text-emerald-800",
  "Em andamento": "border-violet-200 bg-violet-100 text-violet-800",
  Finalizado: "border-cyan-200 bg-cyan-100 text-cyan-800",
  Pago: "border-green-200 bg-green-100 text-green-800",
  Recusado: "border-red-200 bg-red-100 text-red-800",
};

export function QuoteCard({ quote, onDelete, onChanged, readonly }: QuoteCardProps) {
  const whatsappMessage = `Olá, ${quote.client.name}! Estou entrando em contato sobre o orçamento #${quote.id}.`;
  const whatsappHref = whatsappLink(quote.client.phone, whatsappMessage);

  return (
    <Card className="gap-4 border-gray-200 bg-white py-5 shadow-sm">
      <CardHeader className="gap-3 px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="break-words text-lg font-semibold text-gray-950">
              {quote.client.name}
            </CardTitle>
            <p className="mt-1 text-xs text-gray-500">
              Orçamento #{quote.id} · válido até {formatDate(quote.validUntil)}
            </p>
          </div>
          <Badge className={statusStyles[quote.status]} variant="outline">
            {quote.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-5">
        <p className="line-clamp-2 text-sm leading-6 text-gray-500">
          {quote.description || quote.items[0]?.description || "Serviço sem descrição"}
        </p>
        <p className="text-2xl font-semibold text-gray-950">
          {formatMoney(quote.totalCents)}
        </p>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2 px-5">
        <Button asChild className="h-10 flex-1 rounded-xl sm:flex-none" variant="outline">
          <Link href={`/orcamentos/${quote.id}`}>
            <Eye className="size-4" aria-hidden="true" />
            Ver orçamento
          </Link>
        </Button>
        <Button
          asChild
          className="size-10 rounded-xl border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
          variant="outline"
          size="icon"
        >
          <a href={whatsappHref} rel="noreferrer" target="_blank" aria-label="Enviar pelo WhatsApp" title="Enviar pelo WhatsApp">
            <MessageCircle className="size-4 text-emerald-600" />
          </a>
        </Button>

        {!readonly && <QuoteActions quote={quote} onRemoved={() => void onDelete()} onChanged={onChanged} />}
      </CardFooter>
    </Card>
  );
}
