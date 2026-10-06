import { jsonResponse } from "@/lib/http";
import { getCurrentUser, type AuthUser } from "@/lib/auth";
import { z } from "zod";
import { appOrigin } from "@/lib/deployment";
import type { WorkspaceSummary } from "@/lib/saas-policy";

export const MAX_JSON_BYTES = 64_000;

export function unauthorizedResponse() {
  return jsonResponse({ error: "Faça login para continuar." }, { status: 401 });
}

export async function authenticatedUser(request: Request, options: { manageCompany?: boolean } = {}): Promise<(AuthUser & { dataOwnerId: number; workspace?: WorkspaceSummary }) | null> {
  const actor = await getCurrentUser(request);
  if (!actor) return null;
  if (typeof process === "undefined" || process.env.SAAS_ENABLED !== "true") return { ...actor, dataOwnerId: actor.id };
  const { authorizeWorkspace } = await import("@/lib/workspace");
  const scope = await authorizeWorkspace(request, actor, options.manageCompany);
  return { ...actor, dataOwnerId: scope.dataOwnerId, workspace: scope.summary };
}

export function acceptsMutation(request: Request) {
  const expectedOrigin = appOrigin(request);
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");

  if (origin && origin !== expectedOrigin) return false;
  if (fetchSite && !["same-origin", "none"].includes(fetchSite)) return false;
  return Boolean(origin === expectedOrigin || fetchSite === "same-origin");
}

export async function readJson<T>(request: Request, maxBytes = MAX_JSON_BYTES): Promise<T> {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    throw new Error("UNSUPPORTED_MEDIA");
  }
  const announcedSize = Number(request.headers.get("content-length") ?? 0);
  if (announcedSize > maxBytes) throw new Error("PAYLOAD_TOO_LARGE");

  const reader = request.body?.getReader();
  if (!reader) throw new Error("INVALID_JSON");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new Error("PAYLOAD_TOO_LARGE");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  const raw = new TextDecoder().decode(bytes);

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error("INVALID_JSON");
  }
}

export function requestError(error: unknown, fallback: string) {
  if (error instanceof z.ZodError) {
    return jsonResponse({ error: "Dados inválidos. Confira os campos e tente novamente." }, { status: 400 });
  }
  const message = error instanceof Error ? error.message : "";
  if (message === "SCHEDULE_CONFLICT") return jsonResponse({ error: "O responsável já tem um atendimento neste horário. Escolha outro horário ou responsável." }, { status: 409 });
  if (message === "SCHEDULE_UNAVAILABLE") return jsonResponse({ error: "O horário está fora do expediente ou coincide com uma ausência do funcionário." }, { status: 409 });
  if (message === "REPORT_CONFLICT") return jsonResponse({ error: "O relatório mudou. Atualize antes de salvar novamente." }, { status: 409 });
  if (message === "SAAS_SUBSCRIPTION_REQUIRED") return jsonResponse({ error: "O período de acesso terminou. Assine para continuar. Seus dados estão preservados.", code: "subscription_required" }, { status: 402 });
  if (message === "SAAS_READ_ONLY") return jsonResponse({ error: "Seu acesso a esta empresa é somente leitura." }, { status: 403 });
  if (["SAAS_FORBIDDEN", "SAAS_WORKSPACE_UNAVAILABLE"].includes(message)) return jsonResponse({ error: "Você não tem acesso a esta operação ou empresa." }, { status: 403 });
  if (message === "SAAS_DISABLED") return jsonResponse({ error: "A área de empresas ainda não está disponível." }, { status: 503 });
  if (message === "UNSUPPORTED_MEDIA") return jsonResponse({ error: "Envie os dados em JSON." }, { status: 415 });
  if (message === "PAYLOAD_TOO_LARGE") return jsonResponse({ error: "Os dados enviados são muito grandes." }, { status: 413 });
  if (message === "INVALID_JSON") return jsonResponse({ error: "Os dados enviados são inválidos." }, { status: 400 });
  return jsonResponse({ error: fallback }, { status: 500 });
}

export function forbiddenMutationResponse(request: Request) {
  return acceptsMutation(request)
    ? null
    : jsonResponse({ error: "Requisição não autorizada." }, { status: 403 });
}
