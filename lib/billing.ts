import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { billingEvents, workspaceBilling, workspaceSubscriptions, workspaces } from "@/db/schema";
import { assertMonthlyPrice, confirmedPaidUntil, laterPaidUntil, providerId } from "@/lib/billing-policy";
import { entitlement } from "@/lib/saas-policy";
import { lockWorkspaceAuthority, type DbTransaction } from "@/lib/workspace";
import type { AuthUser } from "@/lib/auth";

export function billingConfiguration() {
  const mode = process.env.STRIPE_MODE === "live" ? "live" : "test";
  let origin = "";
  try {
    const url = new URL(process.env.APP_URL ?? "");
    if (!url.username && !url.password && (url.protocol === "https:" || (mode === "test" && ["localhost", "127.0.0.1"].includes(url.hostname) && url.protocol === "http:"))) origin = url.origin;
  } catch { /* Missing configuration must keep checkout unavailable. */ }
  const configured = process.env.SAAS_ENABLED === "true" && process.env.BILLING_ENABLED === "true" && Boolean(origin) && Boolean(process.env.STRIPE_SECRET_KEY?.startsWith(`sk_${mode}_`)) && Boolean(process.env.STRIPE_WEBHOOK_SECRET?.startsWith("whsec_")) && Boolean(process.env.STRIPE_PRICE_ID?.startsWith("price_")) && Boolean(process.env.STRIPE_PORTAL_CONFIGURATION_ID?.startsWith("bpc_")) && (mode === "test" || process.env.LIVE_PAYMENTS_ENABLED === "true");
  return { configured, mode, origin };
}

export function billingClient() {
  if (!billingConfiguration().configured) throw new Error("BILLING_UNAVAILABLE");
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-09-30.endive", timeout: 8000, maxNetworkRetries: 0 });
}

type BillingRow = typeof workspaceBilling.$inferSelect;
async function lockBilling(tx: DbTransaction, workspaceId: number) {
  const [row] = await tx.select().from(workspaceBilling).where(eq(workspaceBilling.workspaceId, workspaceId)).for("update");
  return row;
}

export function billingRedirect(value: string | null, host: "checkout.stripe.com" | "billing.stripe.com") {
  if (!value) throw new Error("BILLING_UNAVAILABLE");
  const url = new URL(value);
  if (url.protocol !== "https:" || url.hostname !== host || url.username || url.password || url.port) throw new Error("BILLING_UNAVAILABLE");
  return url.href;
}

async function assertPortal(stripe: Stripe) {
  const config = await stripe.billingPortal.configurations.retrieve(process.env.STRIPE_PORTAL_CONFIGURATION_ID!);
  if (!config.active || config.features.subscription_update.enabled || !config.features.subscription_cancel.enabled || config.features.subscription_cancel.mode !== "at_period_end" || !config.features.payment_method_update.enabled || !config.features.invoice_history.enabled) throw new Error("BILLING_UNAVAILABLE");
}

async function synchronize(tx: DbTransaction, stripe: Stripe, workspaceId: number, row: BillingRow, subscriptionId: string) {
  // Remote state is fetched under the company lock: out-of-order deliveries
  // cannot overwrite a newer local state with an old event snapshot.
  const sub = await stripe.subscriptions.retrieve(subscriptionId, { expand: ["latest_invoice"] });
  if (sub.metadata.workspaceId !== String(workspaceId) || providerId(sub.customer) !== row.customerId || sub.livemode !== (billingConfiguration().mode === "live")) throw new Error("BILLING_LINK_MISMATCH");
  if (row.subscriptionId !== sub.id) {
    if (!row.checkoutId) throw new Error("BILLING_LINK_MISMATCH");
    const checkout = await stripe.checkout.sessions.retrieve(row.checkoutId);
    if (checkout.status !== "complete" || checkout.mode !== "subscription" || checkout.client_reference_id !== String(workspaceId) || providerId(checkout.customer) !== row.customerId || providerId(checkout.subscription) !== sub.id) throw new Error("BILLING_LINK_MISMATCH");
  }
  const [access] = await tx.select().from(workspaceSubscriptions).where(eq(workspaceSubscriptions.workspaceId, workspaceId)).for("update");
  if (!access || access.status === "legacy") throw new Error("BILLING_LINK_MISMATCH");
  const item = sub.items.data[0];
  const validPlan = sub.items.data.length === 1 && !sub.items.has_more && item?.quantity === 1 && item.price.id === process.env.STRIPE_PRICE_ID;
  let confirmed: string | null = null;
  if (validPlan) {
    assertMonthlyPrice(item.price, process.env.STRIPE_PRICE_ID!);
    const invoice = sub.latest_invoice;
    if (invoice && typeof invoice !== "string" && providerId(invoice.customer) === row.customerId && providerId(invoice.parent?.subscription_details?.subscription) === sub.id) confirmed = confirmedPaidUntil(invoice, sub.id, process.env.STRIPE_PRICE_ID!);
  }
  const paidUntil = laterPaidUntil(access.paidUntil, confirmed);
  const paid = paidUntil !== null && Date.parse(paidUntil) > Date.now();
  const status = validPlan && !["paused", "unpaid", "incomplete_expired"].includes(sub.status)
    ? paid ? sub.status === "canceled" ? "canceled" : "active" : "expired"
    : "expired";
  await tx.update(workspaceSubscriptions).set({ status, paidUntil, updatedAt: new Date().toISOString() }).where(eq(workspaceSubscriptions.workspaceId, workspaceId));
  await tx.update(workspaceBilling).set({ subscriptionId: sub.id, providerStatus: sub.status, cancelAtPeriodEnd: sub.cancel_at_period_end, updatedAt: new Date().toISOString() }).where(eq(workspaceBilling.workspaceId, workspaceId));
  return sub;
}

export async function startBilling(request: Request, actor: AuthUser, workspaceId: number, action: "checkout" | "portal") {
  const stripe = billingClient();
  const { origin } = billingConfiguration();
  return getDb().transaction(async tx => {
    const authority = await lockWorkspaceAuthority(tx, workspaceId, actor.id);
    if (authority.role !== "owner" || authority.company.ownerUserId !== actor.id || !actor.emailVerifiedAt) throw new Error("SAAS_FORBIDDEN");
    let row = await lockBilling(tx, workspaceId);
    if (action === "portal") {
      if (!row?.customerId || !row.subscriptionId) throw new Error("BILLING_NO_SUBSCRIPTION");
      await assertPortal(stripe);
      const portal = await stripe.billingPortal.sessions.create({ customer: row.customerId, configuration: process.env.STRIPE_PORTAL_CONFIGURATION_ID!, return_url: `${origin}/configuracoes#assinatura`, locale: "pt-BR" });
      return billingRedirect(portal.url, "billing.stripe.com");
    }
    const [access] = await tx.select().from(workspaceSubscriptions).where(eq(workspaceSubscriptions.workspaceId, workspaceId)).for("update");
    if (!access || entitlement(access).allowed) throw new Error("BILLING_NOT_DUE");
    assertMonthlyPrice(await stripe.prices.retrieve(process.env.STRIPE_PRICE_ID!), process.env.STRIPE_PRICE_ID!);
    await assertPortal(stripe);
    if (row?.subscriptionId) {
      const sub = await synchronize(tx, stripe, workspaceId, row, row.subscriptionId);
      if (!["canceled", "incomplete_expired"].includes(sub.status)) throw new Error("BILLING_EXISTS");
    }
    if (row?.checkoutId) {
      const checkout = await stripe.checkout.sessions.retrieve(row.checkoutId);
      if (checkout.status === "open") return billingRedirect(checkout.url, "checkout.stripe.com");
      if (checkout.status === "complete" && providerId(checkout.subscription) !== row.subscriptionId) throw new Error("BILLING_PENDING");
    }
    if (!row) {
      await tx.insert(workspaceBilling).values({ workspaceId });
      row = (await lockBilling(tx, workspaceId))!;
    }
    if (!row.customerId) {
      const customer = await stripe.customers.create({ email: actor.email, name: authority.company.name, metadata: { workspaceId: String(workspaceId) } }, { idempotencyKey: `vemo-customer-${workspaceId}` });
      await tx.update(workspaceBilling).set({ customerId: customer.id }).where(eq(workspaceBilling.workspaceId, workspaceId));
      row.customerId = customer.id;
    }
    const generation = row.checkoutGeneration + 1;
    const checkout = await stripe.checkout.sessions.create({ mode: "subscription", customer: row.customerId, client_reference_id: String(workspaceId), locale: "pt-BR", allowed_payment_method_types: ["card"], line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }], allow_promotion_codes: false, automatic_tax: { enabled: false }, subscription_data: { metadata: { workspaceId: String(workspaceId) } }, metadata: { workspaceId: String(workspaceId) }, success_url: `${origin}/configuracoes?billing=returned#assinatura`, cancel_url: `${origin}/configuracoes?billing=canceled#assinatura` }, { idempotencyKey: `vemo-checkout-${workspaceId}-${generation}` });
    await tx.update(workspaceBilling).set({ checkoutId: checkout.id, checkoutGeneration: generation, updatedAt: new Date().toISOString() }).where(eq(workspaceBilling.workspaceId, workspaceId));
    return billingRedirect(checkout.url, "checkout.stripe.com");
  });
}

export async function applyBillingEvent(stripe: Stripe, event: Stripe.Event) {
  if (event.livemode !== (billingConfiguration().mode === "live") || event.account) throw new Error("BILLING_LINK_MISMATCH");
  let subscriptionId: string | null = null;
  if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) subscriptionId = (event.data.object as Stripe.Subscription).id;
  if (["invoice.paid", "invoice.payment_failed", "invoice.payment_action_required"].includes(event.type)) subscriptionId = providerId((event.data.object as Stripe.Invoice).parent?.subscription_details?.subscription);
  if (event.type === "checkout.session.completed") subscriptionId = providerId((event.data.object as Stripe.Checkout.Session).subscription);
  if (!subscriptionId) return;
  const remote = await stripe.subscriptions.retrieve(subscriptionId);
  const workspaceId = Number(remote.metadata.workspaceId);
  if (!Number.isSafeInteger(workspaceId) || workspaceId <= 0) return;
  await getDb().transaction(async tx => {
    const [company] = await tx.select().from(workspaces).where(eq(workspaces.id, workspaceId)).for("update");
    if (!company) return;
    const [processed] = await tx.select().from(billingEvents).where(eq(billingEvents.id, event.id)).limit(1);
    if (processed) return;
    const row = await lockBilling(tx, workspaceId);
    if (!row?.customerId) throw new Error("BILLING_PENDING");
    // Events from a previous subscription cannot replace the current one.
    if (row.subscriptionId && row.subscriptionId !== subscriptionId) {
      if (!row.checkoutId) return;
      const checkout = await stripe.checkout.sessions.retrieve(row.checkoutId);
      if (providerId(checkout.subscription) !== subscriptionId) return;
    }
    await synchronize(tx, stripe, workspaceId, row, subscriptionId);
    await tx.insert(billingEvents).values({ id: event.id, workspaceId, type: event.type });
  });
}
