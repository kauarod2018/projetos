import { and, eq, gt, lt, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { loginAttempts, sessions, users } from "@/db/schema";
import { appOrigin } from "@/lib/deployment";
import { verificationRequired } from "@/lib/account-policy";

const SESSION_COOKIE = "vemo_session";
const SESSION_DAYS = 14;
export { hashPassword, verifyPassword, passwordNeedsUpgrade } from "./password";

export type AuthUser = { id: number; name: string; email: string; phone: string; emailVerifiedAt?: string | null };

function bytesToBase64(bytes: Uint8Array) {
  let value = "";
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value);
}

function randomValue(size = 32) {
  return bytesToBase64(crypto.getRandomValues(new Uint8Array(size)))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

export function createPublicToken() {
  return randomValue(24);
}

export async function tokenHash(token: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return bytesToBase64(new Uint8Array(hash));
}

export async function createSession(userId: number, expectedPasswordHash: string) {
  const now = new Date().toISOString();
  await getDb().delete(sessions).where(lt(sessions.expiresAt, now));
  const token = randomValue();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const id = await tokenHash(token);
  await getDb().transaction(async (tx) => {
    const [user] = await tx.select({ hash: users.passwordHash, verified: users.emailVerifiedAt }).from(users).where(eq(users.id, userId)).for("update");
    if (!user || user.hash !== expectedPasswordHash || (verificationRequired() && !user.verified)) throw new Error("CREDENTIALS_CHANGED");
    await tx.insert(sessions).values({ id, userId, expiresAt: expiresAt.toISOString() });
  });
  return { token, expiresAt };
}

export function sessionCookie(request: Request, token: string, expiresAt: Date) {
  const secure = appOrigin(request).startsWith("https:") ? "; Secure" : "";
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Expires=${expiresAt.toUTCString()}; Priority=High${secure}`;
}

export function clearSessionCookie(request: Request) {
  const secure = appOrigin(request).startsWith("https:") ? "; Secure" : "";
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0; Priority=High${secure}`;
}

export function readSessionToken(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  for (const part of cookie.split(";")) {
    const [name, ...value] = part.trim().split("=");
    if (name === SESSION_COOKIE) return value.join("=");
  }
  return "";
}

export async function getCurrentUser(request: Request): Promise<AuthUser | null> {
  const token = readSessionToken(request);
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;

  const now = new Date().toISOString();
  const [row] = await getDb()
    .select({ id: users.id, name: users.name, email: users.email, phone: users.phone, emailVerifiedAt: users.emailVerifiedAt })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, await tokenHash(token)), gt(sessions.expiresAt, now)))
    .limit(1);

  if (row && verificationRequired() && !row.emailVerifiedAt) return null;
  return row ?? null;
}

export async function deleteCurrentSession(request: Request) {
  const token = readSessionToken(request);
  if (token) await getDb().delete(sessions).where(eq(sessions.id, await tokenHash(token)));
}

export async function consumeRateLimit(key: string, limit: number, seconds = 900) {
  const id = await tokenHash(key);
  const now = new Date().toISOString();
  const cutoff = new Date(Date.now() - seconds * 1000).toISOString();
  // Keep the upsert row lock until its resulting counter has been read.
  return getDb().transaction(async (tx) => {
    await tx.insert(loginAttempts)
      .values({ id, attempts: 1, windowStartedAt: now, updatedAt: now })
      .onDuplicateKeyUpdate({ set: {
        attempts: sql`CASE WHEN ${loginAttempts.windowStartedAt} <= ${cutoff} THEN 1 ELSE LEAST(${loginAttempts.attempts} + 1, 1000000) END`,
        windowStartedAt: sql`CASE WHEN ${loginAttempts.windowStartedAt} <= ${cutoff} THEN ${now} ELSE ${loginAttempts.windowStartedAt} END`,
        updatedAt: now,
      } });
    const [result] = await tx.select({ attempts: loginAttempts.attempts }).from(loginAttempts).where(eq(loginAttempts.id, id)).for("update");
    return result.attempts <= limit;
  });
}

export function requestIp(request: Request) {
  const url = new URL(request.url);
  // Do not trust proxy headers until the hosting ingress policy is verified.
  if (["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) return "local";
  return "shared-ingress";
}

export async function clearLoginAttempts(email: string) {
  await getDb().delete(loginAttempts).where(eq(loginAttempts.id, await tokenHash("login:account:" + email)));
}
