import { after } from "next/server";
import { z } from "zod";
import { forbiddenMutationResponse, readJson, requestError } from "@/lib/api-security";
import { consumeRateLimit, requestIp } from "@/lib/auth";
import { appOrigin } from "@/lib/deployment";
import { jsonResponse } from "@/lib/http";
import { mailConfigured } from "@/lib/mail";
import { issueAccountEmail } from "@/lib/account-email";
import type { TokenPurpose } from "@/lib/account-token";

const input = z.object({ email: z.string().trim().max(254).email().transform((value) => value.toLowerCase()) });
const message = "Se o endereço estiver cadastrado e precisar desta ação, enviaremos um link. Confira também a pasta de spam.";

export async function requestAccountEmail(request: Request, purpose: TokenPurpose) {
  try {
    const forbidden = forbiddenMutationResponse(request);
    if (forbidden) return forbidden;
    const { email } = input.parse(await readJson(request, 4096));
    if (!mailConfigured()) return jsonResponse({ error: "O envio de e-mails ainda não está disponível. Tente novamente mais tarde." }, { status: 503 });
    const origin = appOrigin(request);
    const allowed = await consumeRateLimit("email:ip:" + requestIp(request), 30, 3600);
    if (!allowed) return jsonResponse({ error: "Muitas solicitações. Tente novamente mais tarde." }, { status: 429, headers: { "Retry-After": "3600" } });
    const byAccount = await consumeRateLimit("email:" + purpose + ":" + email, 3, 3600);
    if (byAccount) {
      // Lookup and delivery happen after the identical HTTP response for all emails.
      after(async () => {
        try { await issueAccountEmail(email, purpose, origin); }
        catch { console.error("VEMO_ACCOUNT_EMAIL_TASK_FAILED"); }
      });
    }
    return jsonResponse({ message }, { status: 202 });
  } catch (error) {
    return requestError(error, "Não foi possível processar a solicitação.");
  }
}
