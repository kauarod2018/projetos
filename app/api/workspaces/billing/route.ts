import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { workspaceBilling } from "@/db/schema";
import { getCurrentUser, consumeRateLimit } from "@/lib/auth";
import { forbiddenMutationResponse, readJson, requestError, unauthorizedResponse } from "@/lib/api-security";
import { billingConfiguration, startBilling } from "@/lib/billing";
import { MONTHLY_PRICE_CENTS } from "@/lib/billing-policy";
import { jsonResponse } from "@/lib/http";
import { resolveWorkspace } from "@/lib/workspace";

export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const actor = await getCurrentUser(request);
    if (!actor) return unauthorizedResponse();
    const scope = await resolveWorkspace(request, actor);
    if (scope.summary.role === "employee") throw new Error("SAAS_FORBIDDEN");
    const [row] = await getDb().select().from(workspaceBilling).where(eq(workspaceBilling.workspaceId, scope.summary.id)).limit(1);
    const { configured, mode } = billingConfiguration();
    return jsonResponse({ workspaceId: scope.summary.id, configured, mode, monthlyPriceCents: MONTHLY_PRICE_CENTS, hasSubscription: Boolean(row?.subscriptionId), cancelAtPeriodEnd: row?.cancelAtPeriodEnd ?? false, paymentAttention: ["past_due", "unpaid", "incomplete"].includes(row?.providerStatus ?? "") });
  } catch (error) { return requestError(error, "Não foi possível carregar a assinatura."); }
}

export async function POST(request: Request) {
  const forbidden = forbiddenMutationResponse(request);
  if (forbidden) return forbidden;
  try {
    const actor = await getCurrentUser(request);
    if (!actor) return unauthorizedResponse();
    const scope = await resolveWorkspace(request, actor);
    if (scope.summary.role !== "owner" || !actor.emailVerifiedAt) throw new Error("SAAS_FORBIDDEN");
    const { action } = z.object({ action: z.enum(["checkout", "portal"]) }).strict().parse(await readJson(request, 1024));
    if (!await consumeRateLimit(`billing:${actor.id}`, 10, 600)) return jsonResponse({ error: "Aguarde alguns minutos antes de tentar novamente." }, { status: 429 });
    const url = await startBilling(request, actor, scope.summary.id, action);
    return jsonResponse({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (["BILLING_UNAVAILABLE", "BILLING_PRICE_MISMATCH"].includes(message)) return jsonResponse({ error: "A contratação está temporariamente indisponível. Nenhum pagamento foi iniciado." }, { status: 503 });
    if (["BILLING_EXISTS", "BILLING_NO_SUBSCRIPTION", "BILLING_PENDING", "BILLING_NOT_DUE"].includes(message)) return jsonResponse({ error: message === "BILLING_NOT_DUE" ? "Seu acesso ainda está válido. A contratação será disponibilizada ao fim do período." : message === "BILLING_PENDING" ? "A confirmação está em processamento. Atualize a assinatura em instantes." : "Confira sua assinatura em Gerenciar assinatura antes de contratar novamente." }, { status: 409 });
    return requestError(error, "Não foi possível abrir o pagamento. Tente novamente em instantes.");
  }
}
