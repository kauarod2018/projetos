import type { MetadataRoute } from 'next';
import { content, MODE } from '../site/data.ts';

export const dynamic = 'force-static';

/** release: open to search engines, with the sitemap; preview: closed */
export default function robots(): MetadataRoute.Robots {
  if (MODE !== 'release') return { rules: { userAgent: '*', disallow: '/' } };
  return { rules: { userAgent: '*', allow: '/' }, sitemap: `https://${content().site.domain}/sitemap.xml` };
}
