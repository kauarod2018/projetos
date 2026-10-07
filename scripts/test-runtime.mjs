import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";

const probe = createServer();
probe.listen(0, "127.0.0.1");
await once(probe, "listening");
const port = probe.address().port;
await new Promise((resolve) => probe.close(resolve));
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
  cwd: new URL("../", import.meta.url), windowsHide: true,
  env: { ...process.env, NODE_ENV: "production", APP_URL: "https://vemo-test.invalid", REGISTRATION_ENABLED: "false", SMTP_HOST: "", SMTP_PASSWORD: "", NEXT_TELEMETRY_DISABLED: "1" },
  stdio: ["ignore", "pipe", "pipe"],
});
const closed = new Promise((resolve) => child.once("close", resolve));
try {
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Server startup timeout")), 60000);
    child.once("error", (error) => { clearTimeout(timeout); reject(error); });
    child.once("exit", () => { clearTimeout(timeout); reject(new Error("Server stopped before ready")); });
    const read = (chunk) => {
      if (chunk.toString().includes("Ready in")) { clearTimeout(timeout); resolve(); }
    };
    child.stdout.on("data", read);
    child.stderr.on("data", read);
  });
  const base = `http://127.0.0.1:${port}`;
  let page;
  let pageBody = "";
  for (let attempt = 0; attempt < 20; attempt += 1) {
    page = await fetch(base);
    pageBody = await page.text();
    if (page.status === 200 && /Vemo/.test(pageBody)) break;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.ok(page);
  assert.equal(page.status, 200);
  assert.match(pageBody, /Vemo/);
  assert.equal(page.headers.get("x-frame-options"), "DENY");
  assert.match(page.headers.get("content-security-policy"), /frame-ancestors 'none'/);
  assert.equal((await fetch(base + "/api/quotes")).status, 401);
  for (const method of ["POST", "PATCH", "DELETE"]) {
    const headers = { Origin: "https://vemo-test.invalid", "Content-Type": "application/json" };
    assert.equal((await fetch(base + "/api/quotes/1", { method, headers, ...(method === "DELETE" ? {} : { body: "{}" }) })).status, 401);
    assert.equal((await fetch(base + "/api/quotes/1", { method, headers: { ...headers, Origin: "https://evil.invalid" }, ...(method === "DELETE" ? {} : { body: "{}" }) })).status, 403);
  }
  assert.equal((await fetch(base + "/api/assistant?topic=today")).status, 401);
  assert.equal((await fetch(base + "/api/assistant/receipts")).status, 401);
  assert.equal((await fetch(base + "/api/customers/1/history")).status, 401);
  const headers = { Origin: "https://vemo-test.invalid", "Content-Type": "application/json" };
  assert.equal((await fetch(base + "/api/quotes/1/receipt")).status, 401);
  assert.equal((await fetch(base + "/api/quotes/1/receipt", { method: "PATCH", headers, body: "{}" })).status, 401);
  assert.equal((await fetch(base + "/api/quotes/1/receipt", { method: "PATCH", headers: { ...headers, Origin: "https://evil.invalid" }, body: "{}" })).status, 403);
  assert.equal((await fetch(base + "/api/quotes/1/receipt", { method: "POST", headers, body: "{}" })).status, 401);
  assert.equal((await fetch(base + "/api/quotes/1/receipt", { method: "POST", headers: { ...headers, Origin: "https://evil.invalid" }, body: "{}" })).status, 403);
  assert.equal((await fetch(base + "/api/services")).status, 401);
  assert.equal((await fetch(base + "/api/business-logo")).status, 401);
  for (const method of ["PUT", "DELETE"]) {
    assert.equal((await fetch(base + "/api/business-logo", { method, headers, ...(method === "DELETE" ? {} : { body: "{}" }) })).status, 401);
    assert.equal((await fetch(base + "/api/business-logo", { method, headers: { ...headers, Origin: "https://evil.invalid" }, ...(method === "DELETE" ? {} : { body: "{}" }) })).status, 403);
  }
  assert.equal((await fetch(base + "/api/public/quotes/invalido/logo")).status, 404);
  for (const route of ["/api/appointments/1/report", "/api/quotes/1/workflow", "/api/operations/queue", "/api/workspaces/availability"]) assert.equal((await fetch(base + route)).status, 401);
  assert.equal((await fetch(base + "/api/public/service-report")).status, 404);
  for (const [route, method] of [["/api/appointments/1/report", "PUT"], ["/api/appointments/1/report/share", "POST"], ["/api/assistant/capture", "POST"], ["/api/quotes/1/workflow", "POST"], ["/api/workspaces/availability", "POST"]]) {
    assert.equal((await fetch(base + route, { method, headers, body: "{}" })).status, 401);
    assert.equal((await fetch(base + route, { method, headers: { ...headers, Origin: "https://evil.invalid" }, body: "{}" })).status, 403);
  }
  assert.equal((await fetch(base + "/api/workspaces")).status, 401);
  assert.equal((await fetch(base + "/api/workspaces/team")).status, 401);
  assert.equal((await fetch(base + "/api/workspaces/billing")).status, 401);
  for (const route of ["/api/workspaces/employees", "/api/workspaces/assignments", "/api/my-work"]) assert.equal((await fetch(base + route)).status, 401);
  for (const [route, method] of [["/api/workspaces/employees", "POST"], ["/api/workspaces/employees", "PATCH"], ["/api/workspaces/assignments", "POST"], ["/api/my-work", "PATCH"]]) {
    assert.equal((await fetch(base + route, { method, headers, body: "{}" })).status, 401);
    assert.equal((await fetch(base + route, { method, headers: { ...headers, Origin: "https://evil.invalid" }, body: "{}" })).status, 403);
  }
  assert.equal((await fetch(base + "/api/billing/webhook", { method: "POST", body: "{}" })).status, 503);
  for (const [route, method] of [["/api/workspaces", "POST"], ["/api/workspaces", "PATCH"], ["/api/workspaces/team", "POST"], ["/api/workspaces/team", "PATCH"], ["/api/workspaces/team", "DELETE"], ["/api/workspaces/invites/accept", "POST"], ["/api/workspaces/billing", "POST"]]) {
    assert.equal((await fetch(base + route, { method, headers, body: "{}" })).status, 401);
    assert.equal((await fetch(base + route, { method, headers: { ...headers, Origin: "https://evil.invalid" }, body: "{}" })).status, 403);
  }
  assert.equal((await fetch(base + "/api/appointments?from=2026-09-28&to=2026-09-28")).status, 401);
  for (const [route, method] of [["/api/appointments", "POST"], ["/api/appointments/1", "PUT"], ["/api/appointments/1", "PATCH"]]) {
    assert.equal((await fetch(base + route, { method, headers, body: "{}" })).status, 401);
    assert.equal((await fetch(base + route, { method, headers: { ...headers, Origin: "https://evil.invalid" }, body: "{}" })).status, 403);
  }
  for (const [route, method] of [["/api/services", "POST"], ["/api/services/1", "PUT"], ["/api/services/1", "PATCH"]]) {
    assert.equal((await fetch(base + route, { method, headers, body: "{}" })).status, 401);
    assert.equal((await fetch(base + route, { method, headers: { ...headers, Origin: "https://evil.invalid" }, body: "{}" })).status, 403);
  }
  for (const route of ["/api/customers/1", "/api/quotes/1"]) {
    assert.equal((await fetch(base + route, { method: "PUT", headers, body: "{}" })).status, 401);
    assert.equal((await fetch(base + route, { method: "PUT", headers: { ...headers, Origin: "https://evil.invalid" }, body: "{}" })).status, 403);
  }
  for (const path of ["/esqueci-senha", "/redefinir-senha", "/verificar-email", "/confirmar-email", "/funcionarios", "/meu-trabalho"]) {
    assert.equal((await fetch(base + path)).status, 200, path);
  }
  for (const route of ["forgot-password", "verification-email", "reset-password", "verify-email"]) {
    const url = base + "/api/auth/" + route;
    assert.equal((await fetch(url, { method: "POST", headers, body: "{}" })).status, 400, route);
    assert.equal((await fetch(url, { method: "POST", headers: { ...headers, Origin: "https://evil.invalid" }, body: "{}" })).status, 403, route);
  }
  assert.equal((await fetch(base + "/api/auth/forgot-password", { method: "POST", headers, body: JSON.stringify({ email: "test@example.invalid" }) })).status, 503);
  assert.equal((await fetch(base + "/api/auth/login", { method: "POST", headers, body: "{" })).status, 400);
  assert.equal((await fetch(base + "/api/auth/login", { method: "POST", headers: { ...headers, Origin: "https://evil.invalid" }, body: "{}" })).status, 403);
  assert.equal((await fetch(base + "/api/auth/register", { method: "POST", headers, body: "{}" })).status, 403);
  console.log("Production runtime smoke checks passed (no database writes).");
} finally {
  if (child.exitCode === null) child.kill();
  await closed;
}
