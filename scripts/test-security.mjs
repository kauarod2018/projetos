import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { drizzle } from "drizzle-orm/mysql2";
import { eq, sql } from "drizzle-orm";
import { getTableColumns, getTableName } from "drizzle-orm";
import * as schema from "../db/schema.ts";
import { hashPassword, verifyPassword } from "../lib/password.ts";
import { appOrigin } from "../lib/deployment.ts";
import { newAccountToken, validAccountToken, accountTokenHash, accountLink } from "../lib/account-token.ts";

test("Next is pinned and the lockfile excludes the reported vulnerable release", () => {
  const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  const lock = JSON.parse(readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"));
  const version = manifest.dependencies.next;
  assert.match(version, /^\d+\.\d+\.\d+$/);
  const [major, minor, patch] = version.split(".").map(Number);
  assert.ok(major > 16 || (major === 16 && (minor > 3 || (minor === 3 && patch >= 6))), "Do not restore Next below 16.3.6");
  assert.equal(lock.packages[""].dependencies.next, version);
  assert.equal(lock.packages["node_modules/next"].version, version);
  assert.equal(lock.packages["node_modules/@next/env"].version, version);
});

test("Account links use random hashed tokens, purpose-specific expiry and URL fragments", () => {
  const before = Date.now();
  const reset = newAccountToken("reset");
  const verify = newAccountToken("verify");
  assert.ok(validAccountToken(reset.token));
  assert.ok(!validAccountToken("../invalid"));
  assert.notEqual(reset.token, verify.token);
  assert.equal(reset.id, accountTokenHash(reset.token));
  assert.notEqual(reset.id, reset.token);
  assert.match(reset.id, /^[a-f0-9]{64}$/);
  assert.ok(Date.parse(reset.expiresAt) >= before + 30 * 60_000);
  assert.ok(Date.parse(reset.expiresAt) <= Date.now() + 30 * 60_000);
  assert.ok(Date.parse(verify.expiresAt) >= before + 24 * 60 * 60_000);
  const link = new URL(accountLink("https://example.invalid", "reset", reset.token));
  assert.equal(link.pathname, "/redefinir-senha");
  assert.equal(link.search, "");
  assert.equal(new URLSearchParams(link.hash.slice(1)).get("token"), reset.token);
  assert.throws(() => accountLink("http://example.invalid", "verify", verify.token));
});

test("Passwords are salted, versioned and reject incorrect input", async () => {
  const first = await hashPassword("test-only-password-123");
  const second = await hashPassword("test-only-password-123");
  assert.notEqual(first.hash, second.hash);
  assert.match(first.hash, /^pbkdf2-sha256:600000:/);
  assert.equal(await verifyPassword("test-only-password-123", first.salt, first.hash), true);
  assert.equal(await verifyPassword("wrong", first.salt, first.hash), false);
  assert.equal(await verifyPassword("test-only-password-123", "invalid", first.hash), false);
});

test("MySQL queries bind untrusted strings as parameters", () => {
  const db = drizzle.mock({ schema, mode: "default" });
  const injection = "' OR 1=1 --";
  const query = db.select().from(schema.users).where(eq(schema.users.email, injection)).toSQL();
  assert.ok(!query.sql.includes(injection));
  assert.ok(query.params.includes(injection));
  assert.ok(query.sql.includes("?"));
});

test("MySQL throttle compiles to upsert with capped counter", () => {
  const db = drizzle.mock({ schema, mode: "default" });
  const query = db.insert(schema.loginAttempts)
    .values({ id: "test", attempts: 1, windowStartedAt: new Date().toISOString() })
    .onDuplicateKeyUpdate({ set: { attempts: sql`LEAST(${schema.loginAttempts.attempts} + 1, 1000000)` } }).toSQL();
  assert.match(query.sql, /on duplicate key update/i);
  assert.match(query.sql, /LEAST/);
});

test("Installation SQL declares every application column and binary tokens", () => {
  const ddl = readFileSync(new URL("../database/schema.sql", import.meta.url), "utf8");
  for (const table of Object.values(schema)) {
    const name = getTableName(table);
    const block = ddl.match(new RegExp("CREATE TABLE " + name + " \\(([\\s\\S]*?)\\) ENGINE"))?.[1];
    assert.ok(block, name);
    for (const column of Object.values(getTableColumns(table))) {
      assert.match(block, new RegExp("\\b" + column.name + "\\b"));
    }
  }
  assert.match(ddl, /public_token VARCHAR\(64\) CHARACTER SET ascii COLLATE ascii_bin/);
  assert.ok(!/DROP TABLE/i.test(ddl));
});

test("Production origins require explicit HTTPS and ignore forwarded origin", () => {
  const oldMode = process.env.NODE_ENV;
  const oldUrl = process.env.APP_URL;
  try {
    process.env.NODE_ENV = "production";
    delete process.env.APP_URL;
    const request = new Request("http://localhost:3000", { headers: { "x-forwarded-host": "evil.invalid" } });
    assert.throws(() => appOrigin(request));
    process.env.APP_URL = "http://example.invalid";
    assert.throws(() => appOrigin(request));
    process.env.APP_URL = "https://example.invalid";
    assert.equal(appOrigin(request), "https://example.invalid");
  } finally {
    if (oldMode === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = oldMode;
    if (oldUrl === undefined) delete process.env.APP_URL; else process.env.APP_URL = oldUrl;
  }
});
