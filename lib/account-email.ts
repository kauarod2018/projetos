import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { accountTokens, sessions, users } from "@/db/schema";
import { accountLink, accountTokenHash, newAccountToken, validAccountToken, type TokenPurpose } from "@/lib/account-token";
import { sendAccountMail } from "@/lib/mail";

export async function issueAccountEmail(email: string, purpose: TokenPurpose, origin: string) {
  const db = getDb();
  const [found] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (!found) return;
  const created = newAccountToken(purpose);
  const link = accountLink(origin, purpose, created.token);
  const issued = await db.transaction(async (tx) => {
    const [user] = await tx.select().from(users).where(eq(users.id, found.id)).for("update");
    if (!user || user.email !== email || (purpose === "verify" && user.emailVerifiedAt)) return false;
    await tx.delete(accountTokens).where(and(eq(accountTokens.userId, user.id), eq(accountTokens.purpose, purpose)));
    await tx.insert(accountTokens).values({ id: created.id, userId: user.id, email, purpose, expiresAt: created.expiresAt });
    return true;
  });
  if (!issued) return;
  try {
    await sendAccountMail(email,
      purpose === "reset" ? "Redefina sua senha do Vemo" : "Confirme seu e-mail no Vemo",
      purpose === "reset"
        ? `Recebemos um pedido para alterar sua senha. Abra o link e escolha uma nova senha:\n\n${link}\n\nO link vale por 30 minutos e funciona uma unica vez. Se nao foi voce, ignore esta mensagem. Sua senha atual nao foi alterada.`
        : `Confirme seu endereco de e-mail abrindo este link e tocando em Confirmar e-mail:\n\n${link}\n\nO link vale por 24 horas e funciona uma unica vez. Se voce nao criou uma conta no Vemo, ignore esta mensagem.`);
  } catch {
    await db.delete(accountTokens).where(eq(accountTokens.id, created.id));
    // Never log provider errors: they can contain recipients, tokens or credentials.
    console.error("VEMO_ACCOUNT_EMAIL_SEND_FAILED");
  }
}

export async function consumeAccountToken(token: string, purpose: TokenPurpose, password?: { hash: string; salt: string }) {
  if (!validAccountToken(token) || (purpose === "reset" && !password)) return null;
  const db = getDb();
  const id = accountTokenHash(token);
  const [candidate] = await db.select({ userId: accountTokens.userId }).from(accountTokens)
    .where(and(eq(accountTokens.id, id), eq(accountTokens.purpose, purpose))).limit(1);
  if (!candidate) return null;
  // All issuance and consumption paths lock the user first, then their tokens.
  return db.transaction(async (tx) => {
    const [user] = await tx.select().from(users).where(eq(users.id, candidate.userId)).for("update");
    const [pending] = await tx.select().from(accountTokens).where(eq(accountTokens.id, id)).for("update");
    const now = new Date().toISOString();
    if (!user || !pending || pending.userId !== user.id || pending.purpose !== purpose || pending.email !== user.email || pending.expiresAt <= now) return null;
    if (purpose === "reset") {
      await tx.update(users).set({ passwordHash: password!.hash, passwordSalt: password!.salt }).where(eq(users.id, user.id));
      await tx.delete(sessions).where(eq(sessions.userId, user.id));
    } else {
      await tx.update(users).set({ emailVerifiedAt: now }).where(eq(users.id, user.id));
    }
    await tx.delete(accountTokens).where(and(eq(accountTokens.userId, user.id), eq(accountTokens.purpose, purpose)));
    return { email: user.email };
  });
}
