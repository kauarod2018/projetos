export const MONTHLY_PRICE_CENTS = 4990;
export const MONTHLY_PRICE_LABEL = "R$ 49,90";

type Price = { id: string; active: boolean; currency: string; unit_amount: number | null; type: string; recurring: { interval: string; interval_count: number; usage_type: string } | null; billing_scheme: string; tax_behavior?: string | null };
export function assertMonthlyPrice(price: Price, expectedId: string) {
  if (price.id !== expectedId || !price.active || price.currency !== "brl" || price.unit_amount !== MONTHLY_PRICE_CENTS || price.type !== "recurring" || price.billing_scheme !== "per_unit" || price.recurring?.interval !== "month" || price.recurring.interval_count !== 1 || price.recurring.usage_type !== "licensed" || price.tax_behavior === "exclusive") throw new Error("BILLING_PRICE_MISMATCH");
}

export function providerId(value: string | { id: string } | null | undefined) { return typeof value === "string" ? value : value?.id ?? null; }

// A payment confirms only its own finite period, never a future unpaid renewal.
export function confirmedPaidUntil(invoice: { status: string | null; currency: string; amount_paid: number; amount_remaining: number; billing_reason: string | null; lines: { has_more: boolean; data: { amount: number; period: { start: number; end: number }; pricing?: { price_details?: { price: string | { id: string } } | null } | null; parent?: { subscription_item_details?: { proration: boolean; subscription: string | null } | null } | null }[] } }, subscriptionId: string, priceId: string) {
  if (invoice.status !== "paid" || invoice.currency !== "brl" || invoice.amount_paid !== MONTHLY_PRICE_CENTS || invoice.amount_remaining !== 0 || !["subscription_create", "subscription_cycle"].includes(invoice.billing_reason ?? "") || invoice.lines.has_more || invoice.lines.data.length !== 1) return null;
  const line = invoice.lines.data[0];
  if (line.amount !== MONTHLY_PRICE_CENTS || providerId(line.pricing?.price_details?.price) !== priceId || line.parent?.subscription_item_details?.subscription !== subscriptionId || line.parent.subscription_item_details.proration || !Number.isSafeInteger(line.period.end) || line.period.end <= line.period.start || line.period.end - line.period.start > 32 * 86400) return null;
  const end = new Date(line.period.end * 1000);
  return Number.isFinite(end.getTime()) ? end.toISOString() : null;
}

export function laterPaidUntil(previous: string | null, confirmed: string | null) {
  const valid = [previous, confirmed].filter((value): value is string => value !== null && Number.isFinite(Date.parse(value)));
  return valid.sort().at(-1) ?? null;
}
