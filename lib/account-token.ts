import { createHash, randomBytes } from "node:crypto";

export type TokenPurpose = "reset" | "verify";
export function validAccountToken(token: string) {
  return /^[A-Za-z0-9_-]{43}$/.test(token);
}
export function accountTokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
export function newAccountToken(purpose: TokenPurpose) {
  const token = randomBytes(32).toString("base64url");
  const minutes = purpose === "reset" ? 30 : 24 * 60;
  return { token, id: accountTokenHash(token), expiresAt: new Date(Date.now() + minutes * 60_000).toISOString() };
}
export function accountLink(origin: string, purpose: TokenPurpose, token: string) {
  const url = new URL(origin);
  if (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1"].includes(url.hostname))) {
    throw new Error("Secure email origin required");
  }
  url.pathname = purpose === "reset" ? "/redefinir-senha" : "/confirmar-email";
  url.search = "";
  url.hash = new URLSearchParams({ token }).toString();
  return url.toString();
}
