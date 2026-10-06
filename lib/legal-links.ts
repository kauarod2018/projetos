export function legalLink(value: string | undefined) {
  try { const url = new URL(value ?? ""); return url.protocol === "https:" && !url.username && !url.password ? url.href : null; } catch { return null; }
}
export function legalLinks() {
  return { terms: legalLink(process.env.LEGAL_TERMS_URL), privacy: legalLink(process.env.LEGAL_PRIVACY_URL) };
}
