import { existsSync } from "node:fs";
import { createConnection } from "mysql2/promise";
import nodemailer from "nodemailer";
import Stripe from "stripe";
import { getTableName, getTableColumns } from "drizzle-orm";
import * as schema from "../db/schema.ts";
import { assertMonthlyPrice } from "../lib/billing-policy.ts";
import { legalLink } from "../lib/legal-links.ts";

for (const file of [".env", ".env.local"]) if (existsSync(file)) process.loadEnvFile(file);
const checks = [];
const check = (name, ok) => { checks.push({ name, ok }); console.log(`${ok ? "OK" : "PENDENTE"}: ${name}`); };
let origin;
try { origin = new URL(process.env.APP_URL); } catch { /* Report only configuration status, never secrets. */ }
check("Endereço HTTPS explícito", Boolean(origin && origin.protocol === "https:" && !origin.username && !origin.password && !origin.hostname.endsWith(".example")));
check("Banco configurado", ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD"].every(key => process.env[key] && !/replace_in_hostinger/.test(process.env[key])));
check("Modo SaaS habilitado após migrações", process.env.SAAS_ENABLED === "true");
check("Verificação de e-mail obrigatória", process.env.EMAIL_VERIFICATION_REQUIRED === "true");
check("E-mail configurado", ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD", "MAIL_FROM"].every(key => Boolean(process.env[key])) && [465, 587].includes(Number(process.env.SMTP_PORT || 465)));
check("URLs HTTPS de termos e privacidade configuradas", Boolean(legalLink(process.env.LEGAL_TERMS_URL) && legalLink(process.env.LEGAL_PRIVACY_URL)));
check("Cobrança de teste configurada", process.env.BILLING_ENABLED === "true" && process.env.STRIPE_MODE === "test" && process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") && process.env.STRIPE_WEBHOOK_SECRET?.startsWith("whsec_") && process.env.STRIPE_PRICE_ID?.startsWith("price_") && process.env.STRIPE_PORTAL_CONFIGURATION_ID?.startsWith("bpc_"));
check("Cobrança real desativada durante homologação", process.env.LIVE_PAYMENTS_ENABLED !== "true" && process.env.STRIPE_MODE !== "live");

if (process.argv.includes("--remote")) {
  if (checks.some(item => !item.ok)) { console.log("Corrija a configuração antes das consultas externas."); process.exitCode = 1; }
  else {
    let connection;
    try {
      const local = ["localhost", "127.0.0.1", "::1"].includes(process.env.DB_HOST);
      connection = await createConnection({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, multipleStatements: false, connectTimeout: 10000, ssl: !local || process.env.DB_SSL === "true" ? { rejectUnauthorized: true } : undefined });
      const [columns] = await connection.execute("SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ?", [process.env.DB_NAME]);
      const present = new Set(columns.map(row => `${row.TABLE_NAME}.${row.COLUMN_NAME}`));
      const complete = Object.values(schema).every(table => Object.values(getTableColumns(table)).every(column => present.has(`${getTableName(table)}.${column.name}`)));
      check("Todas as tabelas e colunas da versão presentes", complete);
      const [engines] = await connection.execute("SELECT TABLE_NAME, ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?", [process.env.DB_NAME]);
      check("Tabelas transacionais InnoDB", Object.values(schema).every(table => engines.some(row => row.TABLE_NAME === getTableName(table) && row.ENGINE === "InnoDB")));
    } catch { check("Conexão e esquema MySQL", false); }
    finally { await connection?.end(); }
    const port = Number(process.env.SMTP_PORT || 465);
    const mail = nodemailer.createTransport({ host: process.env.SMTP_HOST, port, secure: port === 465, requireTLS: true, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }, tls: { minVersion: "TLSv1.2", rejectUnauthorized: true }, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000, disableFileAccess: true, disableUrlAccess: true });
    try { check("Autenticação SMTP (sem enviar e-mail)", await mail.verify()); } catch { check("Autenticação SMTP", false); } finally { mail.close(); }
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { timeout: 10000, maxNetworkRetries: 0 });
      const price = await stripe.prices.retrieve(process.env.STRIPE_PRICE_ID);
      assertMonthlyPrice(price, process.env.STRIPE_PRICE_ID); check("Preço de teste: BRL 49,90 mensal", !price.livemode);
      const portal = await stripe.billingPortal.configurations.retrieve(process.env.STRIPE_PORTAL_CONFIGURATION_ID);
      check("Portal: cancelar ao fim do período, sem alterar plano", portal.active && !portal.livemode && !portal.features.subscription_update.enabled && portal.features.subscription_cancel.enabled && portal.features.subscription_cancel.mode === "at_period_end" && portal.features.payment_method_update.enabled && portal.features.invoice_history.enabled);
    } catch { check("Preço e portal Stripe de teste", false); }
  }
} else console.log("Use --remote somente no ambiente de homologação para verificar MySQL, SMTP e Stripe sem criar registros ou cobranças.");
console.log("Este diagnóstico não comprova entrega de e-mail, webhook, isolamento entre contas nem restauração de backup. Execute o roteiro de VALIDACAO.md.");
if (checks.some(item => !item.ok)) process.exitCode = 1;
