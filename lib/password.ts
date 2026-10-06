const CURRENT_ITERATIONS = 600_000;
const LEGACY_ITERATIONS = 120_000;
const PREFIX = "pbkdf2-sha256:600000:";

function base64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}

async function derive(password: string, salt: string, iterations: number) {
  const saltBytes = Uint8Array.from(atob(salt), (character) => character.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: saltBytes, iterations }, key, 256,
  );
  return base64(new Uint8Array(bits));
}

function equalHash(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export async function hashPassword(password: string) {
  const salt = base64(crypto.getRandomValues(new Uint8Array(16)));
  return { hash: PREFIX + await derive(password, salt, CURRENT_ITERATIONS), salt };
}

export function passwordNeedsUpgrade(hash: string) {
  return !hash.startsWith(PREFIX);
}

export async function verifyPassword(password: string, salt: string, expected: string) {
  if (typeof password !== "string" || password.length > 128) return false;
  if (!/^[A-Za-z0-9+/]{22}==$/.test(salt)) return false;
  if (expected.startsWith(PREFIX)) {
    return equalHash(await derive(password, salt, CURRENT_ITERATIONS), expected.slice(PREFIX.length));
  }
  if (!/^[A-Za-z0-9+/]{43}=$/.test(expected)) return false;
  // The first versions saved unversioned hashes at both work factors.
  const current = await derive(password, salt, CURRENT_ITERATIONS);
  const legacy = await derive(password, salt, LEGACY_ITERATIONS);
  return equalHash(current, expected) || equalHash(legacy, expected);
}
