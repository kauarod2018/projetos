import { applyBillingEvent, billingClient, billingConfiguration } from "@/lib/billing";
import { jsonResponse } from "@/lib/http";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!billingConfiguration().configured) return jsonResponse({ error: "Unavailable" }, { status: 503 });
  const stripe = billingClient();
  let event;
  try {
    if (Number(request.headers.get("content-length") ?? 0) > 262144) return jsonResponse({ error: "Payload too large" }, { status: 413 });
    const reader = request.body?.getReader();
    if (!reader) return jsonResponse({ error: "Invalid body" }, { status: 400 });
    const chunks: Uint8Array[] = []; let size = 0;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 262144) { await reader.cancel(); return jsonResponse({ error: "Payload too large" }, { status: 413 }); }
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
    event = stripe.webhooks.constructEvent(Buffer.concat(chunks), request.headers.get("stripe-signature") ?? "", process.env.STRIPE_WEBHOOK_SECRET!);
  } catch { return jsonResponse({ error: "Invalid signature or body" }, { status: 400 }); }
  try {
    await applyBillingEvent(stripe, event);
    return jsonResponse({ received: true });
  } catch {
    // No payload, customer details, API secrets or card data are logged.
    console.error("Billing event processing failed", { eventId: event.id, type: event.type });
    return jsonResponse({ error: "Retry required" }, { status: 500 });
  }
}
