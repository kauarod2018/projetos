import { jsonResponse } from "@/lib/http";
import { and, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { users } from "@/db/schema";
import {
  clearLoginAttempts,
  createSession,
  hashPassword,
  consumeRateLimit,
  requestIp,
  passwordNeedsUpgrade,
  sessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { forbiddenMutationResponse, readJson, requestError } from "@/lib/api-security";
import { loginSchema } from "@/lib/validation";
import { verificationRequired } from "@/lib/account-policy";

export async function POST(request: Request) {
  const forbidden = forbiddenMutationResponse(request);
  if (forbidden) return forbidden;

  try {
    const { email, password } = loginSchema.parse(await readJson(request, 4_096));
    const ipAllowed = await consumeRateLimit("login:ip:" + requestIp(request), 100);
    const accountAllowed = ipAllowed && await consumeRateLimit("login:account:" + email, 5);
    if (!accountAllowed) {
      return jsonResponse(
        { error: "Muitas tentativas. Aguarde 15 minutos para tentar novamente." },
        { status: 429, headers: { "Retry-After": "900" } },
      );
    }

    const [user] = await getDb().select().from(users).where(eq(users.email, email)).limit(1);
    const passwordMatches = user
      ? await verifyPassword(password, user.passwordSalt, user.passwordHash)
      : (await hashPassword(password), false);

    if (!user || !passwordMatches) {
      return jsonResponse({ error: "E-mail ou senha incorretos." }, { status: 401 });
    }

    if (verificationRequired() && !user.emailVerifiedAt) {
      return jsonResponse({ code: "EMAIL_NOT_VERIFIED", error: "Confirme seu e-mail antes de entrar." }, { status: 403 });
    }
    let acceptedHash = user.passwordHash;
    if (passwordNeedsUpgrade(user.passwordHash)) {
      const upgraded = await hashPassword(password);
      const [updated] = await getDb().update(users).set({
        passwordHash: upgraded.hash, passwordSalt: upgraded.salt,
      }).where(and(eq(users.id, user.id), eq(users.passwordHash, user.passwordHash)));
      if (!updated.affectedRows) return jsonResponse({ error: "Tente entrar novamente." }, { status: 401 });
      acceptedHash = upgraded.hash;
    }
    await clearLoginAttempts(email);
    const session = await createSession(user.id, acceptedHash);
    return jsonResponse(
      { user: { id: user.id, name: user.name, email: user.email, phone: user.phone } },
      { headers: { "Set-Cookie": sessionCookie(request, session.token, session.expiresAt) } },
    );
  } catch (error) {
    return requestError(error, "Não foi possível entrar agora.");
  }
}
