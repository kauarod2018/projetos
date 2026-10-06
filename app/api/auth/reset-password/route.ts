import { after } from "next/server";
import { z } from "zod";
import { forbiddenMutationResponse, readJson, requestError } from "@/lib/api-security";
import { consumeRateLimit, requestIp, hashPassword, clearSessionCookie } from "@/lib/auth";
import { consumeAccountToken } from "@/lib/account-email";
import { jsonResponse } from "@/lib/http";
import { sendAccountMail } from "@/lib/mail";

const input = z.object({ token: z.string().regex(/^[A-Za-z0-9_-]{43}$/), password: z.string().min(12).max(128), confirmPassword: z.string().max(128) })
  .refine((value) => value.password === value.confirmPassword);

export async function POST(request: Request) {
  try {
    const forbidden = forbiddenMutationResponse(request);
    if (forbidden) return forbidden;
    const body = input.parse(await readJson(request, 4096));
    if (!await consumeRateLimit("reset:ip:" + requestIp(request), 20)) return jsonResponse({ error: "Muitas tentativas. Aguarde 15 minutos." }, { status: 429 });
    const password = await hashPassword(body.password);
    const changed = await consumeAccountToken(body.token, "reset", password);
    if (!changed) return jsonResponse({ error: "Link inválido, expirado ou já utilizado. Solicite um novo link." }, { status: 400 });
    after(async () => {
      try { await sendAccountMail(changed.email, "Sua senha do Vemo foi alterada", "Sua senha foi alterada e as sessoes anteriores foram encerradas. Se nao foi voce, solicite uma nova redefinicao de senha no site do Vemo e proteja sua conta de e-mail."); }
      catch { console.error("VEMO_PASSWORD_NOTICE_FAILED"); }
    });
    return jsonResponse({ message: "Senha alterada. Entre novamente com sua nova senha." }, { headers: { "Set-Cookie": clearSessionCookie(request) } });
  } catch (error) {
    return requestError(error, "Não foi possível alterar a senha.");
  }
}
