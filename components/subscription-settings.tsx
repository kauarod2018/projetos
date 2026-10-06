"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, CreditCard, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MONTHLY_PRICE_LABEL } from "@/lib/billing-policy";
import type { WorkspaceSummary } from "@/lib/saas-policy";
import styles from "./saas-workspace-settings.module.css";

type Billing = { workspaceId: number; configured: boolean; mode: "test" | "live"; hasSubscription: boolean; cancelAtPeriodEnd: boolean; paymentAttention: boolean };
export function SubscriptionSettings({ company, verified }: { company: WorkspaceSummary; verified: boolean }) {
  const [billing, setBilling] = useState<Billing | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [returned, setReturned] = useState(false);
  const [canceled, setCanceled] = useState(false);
  useEffect(() => {
    let live = true;
    const controller = new AbortController();
    const query = new URLSearchParams(window.location.search);
    setReturned(query.get("billing") === "returned"); setCanceled(query.get("billing") === "canceled");
    void fetch("/api/workspaces/billing", { cache: "no-store", signal: controller.signal }).then(async response => {
      const data = await response.json();
      if (!response.ok || data.workspaceId !== company.id) throw new Error(data.error || "Não foi possível carregar a assinatura.");
      if (live) setBilling(data);
    }).catch(failure => { if (live) setError(failure instanceof Error ? failure.message : "Não foi possível carregar a assinatura."); });
    return () => { live = false; controller.abort(); };
  }, [company.id]);

  async function openPayment(action: "checkout" | "portal") {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/workspaces/billing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível abrir o pagamento.");
      const url = new URL(data.url);
      if (url.protocol !== "https:" || !["checkout.stripe.com", "billing.stripe.com"].includes(url.hostname) || url.username || url.password || url.port) throw new Error("O endereço do pagamento não é válido.");
      window.location.assign(url.href);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Não foi possível abrir o pagamento."); setBusy(false); }
  }

  const owner = company.role === "owner";
  const free = company.entitlement.state === "trial";
  const paid = company.entitlement.state === "paid";
  return <div className={styles.form}>
    <div className={styles.price}><strong>{MONTHLY_PRICE_LABEL}</strong><span className={styles.muted}>/ mês por empresa</span></div>
    <p className={styles.muted}>Assinatura mensal com renovação automática após a contratação. Cancele a renovação a qualquer momento, mantendo o período já pago.</p>
    {free && <p className={styles.muted}>Nenhum cartão necessário durante o teste. A contratação fica disponível ao fim do mês gratuito.</p>}
    {billing?.mode === "test" && billing.configured && <p className={styles.error}>Ambiente de teste: não use um cartão real. Este pagamento não é uma contratação válida.</p>}
    {billing && !billing.configured && <p id="billing-unavailable" className={styles.muted}>A contratação ainda não foi ativada. Nenhuma cobrança será realizada.</p>}
    {billing?.cancelAtPeriodEnd && <p role="status" className={styles.muted}>Renovação cancelada. O acesso permanece até a data do período pago.</p>}
    {billing?.paymentAttention && <p role="status" className={styles.error}>Há uma pendência no pagamento. Confira a fatura e o cartão em Gerenciar assinatura.</p>}
    {returned && !paid && <p role="status" className={styles.muted}>Aguardando a confirmação do pagamento. O acesso será liberado após a confirmação.</p>}
    {returned && paid && <p role="status" className={styles.success}>Pagamento confirmado. Seu acesso está liberado.</p>}
    {canceled && <p role="status" className={styles.muted}>Você saiu do pagamento. Confira o status da assinatura antes de tentar novamente.</p>}
    {!owner && <p className={styles.muted}>A assinatura é administrada pelo proprietário da empresa.</p>}
    {owner && !verified && <p className={styles.muted}>Confirme seu e-mail para contratar ou administrar a assinatura.</p>}
    <div className={styles.row}>
      {owner && billing?.hasSubscription && <Button variant="outline" disabled={busy || !billing.configured || !verified} onClick={() => void openPayment("portal")}><ArrowUpRight aria-hidden="true" />{busy ? "Abrindo…" : "Gerenciar assinatura"}</Button>}
      {owner && !free && !paid && <Button disabled={busy || !billing?.configured || !verified} aria-describedby={billing && !billing.configured ? "billing-unavailable" : undefined} onClick={() => void openPayment("checkout")}><CreditCard aria-hidden="true" />{busy ? "Abrindo…" : `Assinar por ${MONTHLY_PRICE_LABEL}/mês`}</Button>}
      {(returned || error) && <Button variant="outline" disabled={busy} onClick={() => window.location.reload()}><RefreshCw aria-hidden="true" />Atualizar assinatura</Button>}
    </div>
    {!billing && !error && <p role="status" className={styles.muted}>Carregando assinatura…</p>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
  </div>;
}
