import { sql } from "drizzle-orm";

import { getDb } from "@/db";
import { jsonResponse } from "@/lib/http";

// Diagnóstico de instalação: mostra apenas se cada configuração existe e se o banco responde.
// Nunca devolve valores, senhas ou mensagens internas do banco.
export async function GET() {
  const appUrl = process.env.APP_URL;
  let appUrlState = "ok";
  try { if (!appUrl) appUrlState = "ausente"; else if (new URL(appUrl).protocol !== "https:") appUrlState = "sem_https"; }
  catch { appUrlState = "invalida"; }
  const missing = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"].filter(key => !process.env[key]);
  let database = missing.length ? "configuracao_incompleta" : "ok";
  let logoTable = "nao_verificada";
  if (!missing.length) {
    try {
      await getDb().execute(sql`SELECT 1`);
      try { await getDb().execute(sql`SELECT 1 FROM business_logos LIMIT 1`); logoTable = "ok"; } catch { logoTable = "ausente"; }
    } catch { database = "sem_conexao"; }
  }
  const ok = appUrlState === "ok" && database === "ok";
  return jsonResponse({ ok, appUrl: appUrlState, database, missingDatabaseVariables: missing, logoTable }, { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
