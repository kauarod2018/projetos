import type { MetadataRoute } from 'next';
import { allNiches, content, MODE } from '../site/data.ts';

export const dynamic = 'force-static';

/** every public page, for Google; a preview build lists nothing */
export default function sitemap(): MetadataRoute.Sitemap {
  if (MODE !== 'release') return [];
  const base = `https://${content().site.domain}`;
  return [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    ...allNiches().map((n) => ({ url: `${base}/${n.niche.id}/`, changeFrequency: 'monthly' as const, priority: 0.9 })),
    ...['privacy', 'terms', 'refund'].map((p) => ({ url: `${base}/${p}/`, changeFrequency: 'yearly' as const, priority: 0.2 })),
  ];
}
