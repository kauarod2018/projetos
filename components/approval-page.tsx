"use client";

import { useCallback, useEffect, useState } from "react";
import { QuoteBrand } from "@/components/quote-brand";
import { CheckCircle2, XCircle } from "lucide-react";
import QRCode from "qrcode";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatMoney, type Quote, type QuoteStatus } from "@/lib/models";
import styles from "@/components/quote-workspace.module.css";

export function ApprovalPage({ token }: { token: string }) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [qrImage, setQrImage] = useState("");
  const [qrError, setQrError] = useState(false);
  const [copyNotice, setCopyNotice] = useState("");

  const loadQuote = useCallback(async () => {
    try {
      const response = await fetch(`/api/public/quotes/${token}`, { cache: "no-store" });
      const data = (await response.json()) as { quote?: Quote; error?: string };
      if (!response.ok || !data.quote) throw new Error(data.error);
      setQuote(data.quote);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Orçamento indisponível.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void loadQuote(); }, [loadQuote]);

  useEffect(() => {
    const payload = quote?.pixPayment?.payload;
    let active = true;
    setQrImage("");
    setQrError(false);
    if (!payload) return () => { active = false; };
    void QRCode.toDataURL(payload, { errorCorrectionLevel: "M", margin: 2, width: 240 })
      .then(image => { if (active) setQrImage(image); })
      .catch(() => { if (active) setQrError(true); });
    return () => { active = false; };
  }, [quote?.pixPayment?.payload]);

  async function decide(status: QuoteStatus) {
    setSaving(true);
    try {
      const response = await fetch(`/api/public/quotes/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = (await response.json()) as { quote?: Quote; error?: string };
      if (!response.ok || !data.quote) throw new Error(data.error || "Não foi possível registrar sua resposta.");
      setQuote(data.quote);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Não foi possível registrar sua resposta.");
    } finally {
      setSaving(false);
    }
  }

  async function copyPixCode() {
    const payload = quote?.pixPayment?.payload;
    if (!payload) return;
    try {
      await navigator.clipboard.writeText(payload);
      setCopyNotice("Código Pix copiado.");
    } catch {
      setCopyNotice("Não foi possível copiar automaticamente. Você pode selecionar o código acima.");
    }
  }

  if (loading) return <main id="main-content" tabIndex={-1} className="mx-auto min-h-screen max-w-3xl bg-gray-50 p-4 sm:p-8"><Skeleton className="h-[680px] rounded-2xl" /></main>;
  if (!quote || error) return <main id="main-content" tabIndex={-1} className="flex min-h-screen items-center justify-center bg-gray-50 p-4 text-center"><div><h1 className="text-xl font-semibold">Orçamento indisponível</h1><p className="mt-2 text-gray-500">{error}</p></div></main>;

  const decided = ["Aprovado", "Recusado", "Em andamento", "Finalizado", "Pago"].includes(quote.status);
  const pixDue = ["Aprovado", "Em andamento", "Finalizado"].includes(quote.status) && quote.paymentMethod === "Pix";

  return (
    <main id="main-content" tabIndex={-1} className={`${styles.publicPage} min-h-screen bg-gray-50 px-4 py-6 sm:py-10`}>
      <article className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-9">
        <header className="border-b border-gray-200 pb-6">
          <QuoteBrand src={`/api/public/quotes/${token}/logo`} ownerName={quote.ownerName} />
          <p className="mt-2 text-sm text-gray-500">Orçamento de {quote.ownerName}</p>
        </header>

        <div className="py-6">
          <p className="text-sm text-gray-500">Preparado para</p>
          <h1 className="mt-1 text-2xl font-semibold">{quote.client.name}</h1>
          <p className="mt-2 text-sm text-gray-500">Orçamento #{quote.id} · válido até {formatDate(quote.validUntil)}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead><tr className="border-b text-gray-500"><th className="py-3 font-medium">Item</th><th className="py-3 text-center font-medium">Qtd.</th><th className="py-3 text-right font-medium">Valor</th></tr></thead>
            <tbody>{quote.items.map((item) => <tr key={item.id} className="border-b border-gray-100"><td className="py-4"><p className="font-medium">{item.description}</p><p className="mt-1 text-xs text-gray-500">{item.kind === "material" ? "Material" : "Mão de obra"}</p></td><td className="py-4 text-center">{item.quantity}</td><td className="py-4 text-right">{formatMoney(Math.round(item.quantity * item.unitPriceCents))}</td></tr>)}</tbody>
          </table>
        </div>

        <div className="ml-auto mt-6 max-w-sm space-y-2">
          <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>{formatMoney(quote.subtotalCents)}</span></div>
          <div className="flex justify-between text-sm text-gray-600"><span>Desconto</span><span>- {formatMoney(quote.discountCents)}</span></div>
          <div className="flex justify-between border-t pt-3 text-xl font-semibold"><span>Total</span><span>{formatMoney(quote.totalCents)}</span></div>
        </div>

        <div className="mt-7 grid gap-3 rounded-xl bg-gray-50 p-5 text-sm sm:grid-cols-2">
          <p><span className="block text-gray-500">Prazo</span><strong>{quote.deadline}</strong></p>
          <p><span className="block text-gray-500">Pagamento</span><strong>{quote.paymentMethod}</strong></p>
        </div>

        {decided ? (
          <div className={`mt-7 rounded-xl p-5 text-center ${quote.status === "Recusado" ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800"}`}>
            {quote.status === "Recusado" ? <XCircle className="mx-auto size-7" /> : <CheckCircle2 className="mx-auto size-7" />}
            <p className="mt-2 font-semibold">{quote.status === "Recusado" ? "Orçamento recusado" : "Orçamento aprovado"}</p>
            <p className="mt-1 text-sm">Sua resposta foi registrada.</p>
          </div>
        ) : (
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Button disabled={saving} variant="outline" className="h-12 rounded-xl border-red-200 text-red-700 hover:bg-red-50" onClick={() => void decide("Recusado")}><XCircle className="size-4" /> Recusar</Button>
            <Button disabled={saving} className="h-12 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => void decide("Aprovado")}><CheckCircle2 className="size-4" /> Aprovar orçamento</Button>
          </div>
        )}

        {pixDue && (
          <section className="mt-7 border-t border-gray-200 pt-6" aria-labelledby="pix-payment-heading">
            <h2 id="pix-payment-heading" className="text-lg font-semibold">Pagamento via Pix</h2>
            {quote.pixPayment ? (
              <div className="mt-4 grid gap-5 sm:grid-cols-[240px_minmax(0,1fr)] sm:items-center">
                <div className="flex min-h-60 items-center justify-center rounded-lg bg-white p-3">
                  {qrImage ? <img src={qrImage} width="240" height="240" alt={`QR Code Pix de ${formatMoney(quote.pixPayment.amountCents)} para ${quote.pixPayment.name}`} className="size-60" /> : qrError ? <p role="status" className="text-center text-sm text-gray-600">Não foi possível gerar a imagem do QR Code. Use o código Pix ao lado.</p> : <p role="status" className="text-sm text-gray-600">Preparando QR Code…</p>}
                </div>
                <div className="min-w-0 space-y-3">
                  <p className="text-sm text-gray-600">Recebedor: <strong className="text-gray-950">{quote.pixPayment.name}</strong> · {quote.pixPayment.city}</p>
                  <p className="text-sm text-gray-600">Valor exato: <strong className="text-gray-950">{formatMoney(quote.pixPayment.amountCents)}</strong></p>
                  <div className="space-y-2">
                    <label htmlFor="pix-copy-code" className="text-sm font-medium">Pix Copia e Cola</label>
                    <textarea id="pix-copy-code" readOnly rows={3} value={quote.pixPayment.payload} onFocus={event => event.currentTarget.select()} className="w-full resize-y break-all rounded-lg border border-gray-300 bg-gray-50 p-3 font-mono text-xs leading-5 focus-visible:outline-2 focus-visible:outline-blue-700" />
                    <Button type="button" variant="outline" onClick={() => void copyPixCode()} className="h-11">Copiar código Pix</Button>
                    {copyNotice && <p role="status" className="text-sm text-gray-600">{copyNotice}</p>}
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-3 rounded-lg bg-amber-50 p-4 text-sm leading-6 text-amber-950">O prestador ainda não configurou o recebimento por Pix. Confirme diretamente com ele antes de pagar.</p>
            )}
            {quote.pixPayment && <p className="mt-4 rounded-lg bg-amber-50 p-4 text-sm leading-6 text-amber-950">Antes de confirmar no banco, confira o nome do recebedor e o valor. A aprovação do orçamento não confirma o pagamento.</p>}
          </section>
        )}
      </article>
    </main>
  );
}
