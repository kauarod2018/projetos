"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { QuoteActions } from "./quote-actions";
import { whatsappLink } from "@/lib/whatsapp";
import { canEditQuote } from "@/lib/quote-editing";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Copy, Download, MessageCircle, RotateCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkspaceShell } from "@/components/workspace-shell";
import { VemoWordmark } from "@/components/vemo-brand";
import { QuoteReceipt } from "@/components/quote-receipt";
import { QuoteWorkflow } from "@/components/quote-workflow";
import { formatDate, formatMoney, quoteStatuses, type Quote, type QuoteStatus } from "@/lib/models";
import styles from "@/components/quote-workspace.module.css";

const progressSteps: QuoteStatus[] = ["Rascunho", "Enviado", "Aprovado", "Em andamento", "Finalizado", "Pago"];

export function QuoteDetail({ id }: { id: number }) {
  return <WorkspaceShell><QuoteDetailContent key={id} id={id} /></WorkspaceShell>;
}

function QuoteDetailContent({ id }: { id: number }) {
  const router = useRouter();
  const { workspace } = useCurrentUser();
  const readonly = workspace?.role === "viewer";
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [actionError, setActionError] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusOptions, setStatusOptions] = useState<QuoteStatus[]>([]);
  const [statusMessage, setStatusMessage] = useState("");

  async function renewLink() {
    setRotating(true);
    setActionError("");
    try {
      const response = await fetch(`/api/quotes/${id}/share`, { method: "POST" });
      const data = await response.json() as { quote?: Quote; error?: string };
      if (!response.ok || !data.quote) throw new Error(data.error || "Não foi possível renovar o link.");
      setQuote(data.quote);
      setCopied(false);
    } catch (failure) {
      setActionError(failure instanceof Error ? failure.message : "Tente novamente.");
    } finally {
      setRotating(false);
    }
  }

  const loadQuote = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/quotes/${id}`, { cache: "no-store" });
      const data = (await response.json()) as { quote?: Quote; error?: string; statusOptions?: QuoteStatus[]; statusMessage?: string };
      if (!response.ok || !data.quote) throw new Error(data.error);
      setQuote(data.quote);
      setStatusOptions((data.statusOptions ?? quoteStatuses.filter(status => status !== "Pago")) as QuoteStatus[]);
      setStatusMessage(data.statusMessage ?? "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar o orçamento.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadQuote();
  }, [loadQuote]);

  const approvalUrl = typeof window === "undefined" || !quote ? "" : `${window.location.origin}/aprovar/${quote.publicToken}`;
  const whatsappHref = useMemo(() => {
    if (!quote) return "#";
    const message = `Olá, ${quote.client.name}! Segue o orçamento #${quote.id}, no valor de ${formatMoney(quote.totalCents)}. Confira os detalhes e aprove por aqui: ${approvalUrl}`;
    return whatsappLink(quote.client.phone, message);
  }, [approvalUrl, quote]);

  async function updateStatus(status: QuoteStatus) {
    if (updatingStatus) return;
    setUpdatingStatus(true);
    setActionError("");
    try {
    const response = await fetch(`/api/quotes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, expectedUpdatedAt: quote?.updatedAt }),
    });
    const data = (await response.json()) as { quote?: Quote; error?: string };
    if (!response.ok || !data.quote) throw new Error(data.error || "Não foi possível atualizar o status.");
    setQuote(data.quote);
    } catch (failure) {
      setActionError(failure instanceof Error ? failure.message : "Não foi possível atualizar o status.");
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function copyApprovalLink() {
    await navigator.clipboard.writeText(approvalUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return <div className="mx-auto w-full max-w-6xl p-6"><Skeleton className="h-[700px] rounded-2xl" /></div>;
  }

  if (!quote || error) {
    return (
      <>
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <h1 className="text-xl font-semibold">Orçamento não encontrado</h1>
          <p className="mt-2 text-sm text-gray-500">{error || "Este orçamento não está mais disponível."}</p>
          <Button asChild className="mt-5 rounded-xl"><Link href="/dashboard">Voltar ao Dashboard</Link></Button>
        </div>
      </>
    );
  }

  const currentStep = progressSteps.indexOf(quote.status);

  return (
    <>
      <section className={`mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8 ${styles.quoteDetail}`}>
        <div className="print-hidden flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Button asChild variant="ghost" className="w-fit rounded-xl text-gray-600">
            <Link href="/orcamentos"><ArrowLeft className="size-4" /> Voltar</Link>
          </Button>
          <div className="flex flex-wrap gap-2">
            {!readonly && !quote.archivedAt && canEditQuote(quote) && <Button asChild variant="outline"><Link href={`/novo-orcamento?editar=${quote.id}`}>Editar orçamento</Link></Button>}
            {!readonly && <Button asChild variant="outline"><Link href={`/novo-orcamento?duplicar=${quote.id}`}>{canEditQuote(quote) ? "Duplicar orçamento" : "Criar nova versão"}</Link></Button>}
            <Label htmlFor="quote-status" className="sr-only">Status do orçamento</Label>
            <Select disabled={readonly || updatingStatus || Boolean(quote.archivedAt) || statusOptions.length < 2} value={quote.status} onValueChange={(value) => void updateStatus(value as QuoteStatus)}>
              <SelectTrigger id="quote-status" className="h-10 w-[170px] rounded-xl bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>{[...new Set([quote.status, ...statusOptions])].map((status) => <SelectItem key={status} value={status} disabled={!statusOptions.includes(status)}>{status}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" disabled={Boolean(quote.archivedAt)} className="rounded-xl bg-white" onClick={() => void copyApprovalLink()}>
              {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
              {copied ? "Link copiado" : "Link de aceite"}
            </Button>
            <Button variant="outline" className="rounded-xl bg-white" onClick={() => window.print()}>
              <Download className="size-4" /> Baixar PDF
            </Button>
            <Button variant="outline" disabled={readonly || rotating || Boolean(quote.archivedAt)} className="rounded-xl bg-white" onClick={() => void renewLink()} title="Substituir o link de aceite e invalidar o anterior">
              <RotateCw className="size-4" /> Renovar link
            </Button>
            {!readonly && <QuoteActions quote={quote} onRemoved={() => router.push("/orcamentos")} onChanged={() => void loadQuote()} />}
            <Button asChild className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">
              <a href={whatsappHref} target="_blank" rel="noreferrer">
                <MessageCircle className="size-4" /> WhatsApp
              </a>
            </Button>
          </div>
        </div>

        {actionError && <div role="alert" className="print-hidden rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{actionError}<Button variant="outline" className="ml-2 min-h-10" onClick={() => void loadQuote()}>Atualizar orçamento</Button></div>}
        {quote.archivedAt && <p className="print-hidden border-l-4 border-gray-400 bg-gray-100 p-3 text-sm text-gray-700">Arquivado em {formatDate(quote.archivedAt)}. Os registros vinculados continuam no histórico.</p>}
        {statusMessage && <p className="print-hidden text-sm leading-6 text-gray-600">{statusMessage}</p>}
        <div className="print-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">Acompanhamento</p>
              <p className="mt-1 font-semibold">{quote.status}</p>
            </div>
            <Badge variant="outline" className="rounded-lg px-3 py-1">Orçamento #{quote.id}</Badge>
          </div>
          <div className="mt-5 grid grid-cols-6 gap-1">
            {progressSteps.map((step, index) => (
              <div key={step} className="min-w-0">
                <div className={`h-2 rounded-full ${currentStep >= index ? "bg-blue-600" : "bg-gray-200"}`} />
                <p className="mt-2 hidden truncate text-xs text-gray-500 sm:block">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <QuoteWorkflow quote={quote} />
        <QuoteReceipt quote={quote} onSaved={() => void loadQuote()} />
        <article className="print-document rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-10">
          <header className="flex flex-col gap-6 border-b border-gray-200 pb-7 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <VemoWordmark className="h-11 w-44" />
              <p className="mt-1 text-sm text-gray-500">{quote.ownerName} · Profissional autônomo</p>
            </div>
            <div className="sm:text-right">
              <h1 className="text-2xl font-semibold">ORÇAMENTO</h1>
              <p className="mt-1 text-sm text-gray-500">#{quote.id} · emitido em {formatDate(quote.createdAt)}</p>
            </div>
          </header>

          <div className="grid gap-6 border-b border-gray-200 py-7 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Cliente</p>
              <p className="mt-2 text-lg font-semibold">{quote.client.name}</p>
              {quote.client.phone && <p className="mt-1 text-sm text-gray-600">{quote.client.phone}</p>}
              {quote.client.email && <p className="text-sm text-gray-600">{quote.client.email}</p>}
              {quote.client.address && <p className="mt-1 text-sm text-gray-600">{quote.client.address}</p>}
            </div>
            <div className="sm:text-right">
              <p className="text-sm text-gray-500">Válido até</p><p className="font-semibold">{formatDate(quote.validUntil)}</p>
              <p className="mt-3 text-sm text-gray-500">Prazo</p><p className="font-semibold">{quote.deadline}</p>
            </div>
          </div>

          {quote.description && <p className="my-6 text-sm leading-6 text-gray-600">{quote.description}</p>}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <thead><tr className="border-b border-gray-200 text-gray-500"><th className="py-3 font-medium">Item</th><th className="py-3 text-center font-medium">Qtd.</th><th className="py-3 text-right font-medium">Valor</th><th className="py-3 text-right font-medium">Total</th></tr></thead>
              <tbody>{quote.items.map((item) => <tr key={item.id} className="border-b border-gray-100"><td className="py-4 pr-4"><p className="font-medium">{item.description}</p><p className="mt-1 text-xs text-gray-500">{item.kind === "material" ? "Material" : "Mão de obra"}</p></td><td className="py-4 text-center">{item.quantity}</td><td className="py-4 text-right">{formatMoney(item.unitPriceCents)}</td><td className="py-4 text-right font-medium">{formatMoney(Math.round(item.quantity * item.unitPriceCents))}</td></tr>)}</tbody>
            </table>
          </div>

          <div className="ml-auto mt-6 max-w-sm space-y-2">
            <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>{formatMoney(quote.subtotalCents)}</span></div>
            <div className="flex justify-between text-sm text-gray-600"><span>Desconto</span><span>- {formatMoney(quote.discountCents)}</span></div>
            <div className="flex justify-between border-t border-gray-200 pt-3 text-xl font-semibold"><span>Total</span><span>{formatMoney(quote.totalCents)}</span></div>
          </div>

          <footer className="mt-10 rounded-xl bg-gray-50 p-5 text-sm text-gray-600">
            <p><strong className="text-gray-900">Pagamento:</strong> {quote.paymentMethod}</p>
            <p className="mt-2">A execução será iniciada após a aprovação deste orçamento.</p>
          </footer>
        </article>
      </section>
    </>
  );
}
