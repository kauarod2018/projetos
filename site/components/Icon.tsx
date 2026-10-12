import { icon } from '../../lib/icons.ts';

/** Lucide icon rendered at build time (same icon set as the PDFs). */
export function Icon({ name, size = 20, stroke = 2 }: { name: string; size?: number; stroke?: number }) {
  return <span className="icon" aria-hidden="true" dangerouslySetInnerHTML={{ __html: icon(name, size, stroke) }} />;
}
