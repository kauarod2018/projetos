import { jsonResponse } from "@/lib/http";
import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { users } from "@/db/schema";
import { consumeRateLimit, requestIp, createSession, hashPassword, sessionCookie } from "@/lib/auth";
import { forbiddenMutationResponse, readJson, requestError } from "@/lib/api-security";
import { registerSchema } from "@/lib/validation";
import { after } from "next/server";
import { verificationRequired } from "@/lib/account-policy";
import { issueAccountEmail } from "@/lib/account-email";
import { mailConfigured } from "@/lib/mail";
import { appOrigin } from "@/lib/deployment";
import { provisionWorkspace, saasEnabled } from "@/lib/workspace";
import { legalLinks } from "@/lib/legal-links";

export async function POST(request: Request) {
  const forbidden = forbiddenMutationResponse(request);
  if (forbidden) return forbidden;

  try {
    if (process.env.REGISTRATION_ENABLED !== "true") {
      return jsonResponse({ error: "Novos cadastros estão temporariamente desativados." }, { status: 403 });
    }
    const legal = legalLinks();
    if (process.env.NODE_ENV === "production" && saasEnabled() && (!legal.terms || !legal.privacy)) return jsonResponse({ error: "Cadastros públicos ainda não foram liberados. Os documentos de contratação estão em preparação." }, { status: 503 });
    const { name, phone, email, password, accountKind, companyName } = registerSchema.parse(await readJson(request, 8_192));
    if (accountKind === "company" && companyName.length < 2) return jsonResponse({ error: "Informe o nome da empresa." }, { status: 400 });
    const requireVerification = verificationRequired();
    if (requireVerification && !mailConfigured()) return jsonResponse({ error: "O cadastro está temporariamente indisponível. Tente novamente mais tarde." }, { status: 503 });
    if (!await consumeRateLimit("register:ip:" + requestIp(request), 10, 3_600)) {
      return jsonResponse({ error: "Muitas tentativas. Tente novamente mais tarde." }, { status: 429, headers: { "Retry-After": "3600" } });
    }

    const [existing] = await getDb().select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing) return jsonResponse({ error: "Não foi possível criar a conta com esses dados. Tente entrar." }, { status: 409 });

    const passwordData = await hashPassword(password);
    const values = {
      name,
      phone,
      email,
      passwordHash: passwordData.hash,
      passwordSalt: passwordData.salt,
    };
    const created = saasEnabled() ? await getDb().transaction(async tx => {
      const [row] = await tx.insert(users).values(values).$returningId();
      await provisionWorkspace(tx, { id: row.id, name, kind: accountKind, companyName: accountKind === "company" ? companyName : "" });
      return row;
    }) : (await getDb().insert(users).values(values).$returningId())[0];
    const user = { id: created.id, name, email, phone };
    if (mailConfigured()) {
      const origin = appOrigin(request);
      after(async () => {
        try { await issueAccountEmail(email, "verify", origin); }
        catch { console.error("VEMO_ACCOUNT_EMAIL_TASK_FAILED"); }
      });
    }
    if (requireVerification) return jsonResponse({ requiresVerification: true }, { status: 201 });
    const session = await createSession(user.id, passwordData.hash);

    return jsonResponse(
      { user },
      { status: 201, headers: { "Set-Cookie": sessionCookie(request, session.token, session.expiresAt) } },
    );
  } catch (error) {
    return requestError(error, "Não foi possível criar sua conta agora.");
  }
}
