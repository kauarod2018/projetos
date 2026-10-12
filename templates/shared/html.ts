const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escape text for HTML. Every content string goes through this. */
export const esc = (s: string | number) => String(s).replace(/[&<>"']/g, (c) => ENTITIES[c]);

/** Fill "{name}" placeholders from i18n strings (values are escaped). */
export function fill(template: string, values: Record<string, string | number>): string {
  return esc(template).replace(/\{(\w+)\}/g, (_, key: string) => (key in values ? esc(values[key]) : `{${key}}`));
}

export function formatDate(iso: string, language: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat(language, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}

export const pad2 = (n: number) => String(n).padStart(2, '0');
