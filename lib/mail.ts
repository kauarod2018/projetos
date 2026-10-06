import nodemailer from "nodemailer";

export function mailConfigured() {
  return ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD", "MAIL_FROM"].every((key) => Boolean(process.env[key]))
    && [465, 587].includes(Number(process.env.SMTP_PORT || 465));
}

export async function sendAccountMail(to: string, subject: string, text: string) {
  if (!mailConfigured()) throw new Error("Mail configuration missing");
  const port = Number(process.env.SMTP_PORT || 465);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port, secure: port === 465, requireTLS: true,
    auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASSWORD! },
    tls: { minVersion: "TLSv1.2", rejectUnauthorized: true },
    connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 20_000,
    disableFileAccess: true, disableUrlAccess: true,
  });
  try {
    await transport.sendMail({ from: { name: "Vemo", address: process.env.MAIL_FROM! }, to, subject, text });
  } finally {
    transport.close();
  }
}
