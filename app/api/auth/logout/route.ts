import { jsonResponse } from "@/lib/http";
import { clearSessionCookie, deleteCurrentSession } from "@/lib/auth";
import { forbiddenMutationResponse } from "@/lib/api-security";

export async function POST(request: Request) {
  const forbidden = forbiddenMutationResponse(request);
  if (forbidden) return forbidden;
  try {
    await deleteCurrentSession(request);
  } catch {
    return jsonResponse({ error: "Não foi possível encerrar a sessão. Tente novamente." }, { status: 503 });
  }
  return jsonResponse({ ok: true }, { headers: { "Set-Cookie": clearSessionCookie(request) } });
}
