import { z } from "zod";
import { forbiddenMutationResponse, readJson, requestError } from "@/lib/api-security";
import { consumeRateLimit, requestIp } from "@/lib/auth";
import { consumeAccountToken } from "@/lib/account-email";
import { jsonResponse } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const forbidden = forbiddenMutationResponse(request);
    if (forbidden) return forbidden;
    const { token } = z.object({ token: z.string().regex(/^[A-Za-z0-9_-]{43}$/) }).parse(await readJson(request, 2048));
    if (!await consumeRateLimit("verify:ip:" + requestIp(request), 30)) return jsonResponse({ error: "Muitas tentativas. Aguarde 15 minutos." }, { status: 429 });
    if (!await consumeAccountToken(token, "verify")) return jsonResponse({ error: "Link inválido, expirado ou já utilizado. Solicite um novo link." }, { status: 400 });
    return jsonResponse({ message: "E-mail confirmado. Você já pode entrar na sua conta." });
  } catch (error) {
    return requestError(error, "Não foi possível confirmar o e-mail.");
  }
}
