import { z } from 'zod';
import { slug } from './common.ts';

/**
 * Sales page copy for one niche. Text can use {placeholders} that the site fills from real data:
 * {examName} {brand} {totalMaps} {basicMaps} {bonuses} {areasList} {guaranteeDays} {version}
 * {checkedOn} {priceBasic} {priceComplete} {year}
 */
const text = z.string().min(1);
const card = z.object({ title: text, text });

export const sales = z.object({
  schemaVersion: z.literal(1),
  niche: slug,
  meta: z.object({ title: text, description: z.string().min(50).max(170) }),
  topBar: text,
  hero: z.object({
    eyebrow: text,
    h1: text,
    /** part of the h1 that gets the highlighter */
    highlight: text,
    sub: text,
    primaryCta: text,
    secondaryCta: text,
    bullets: z.array(text).min(3).max(4),
  }),
  /** shown only when filled in, with real numbers you can prove */
  socialProof: z.string().min(1).nullable(),
  /** stat: a big figure with its source, e.g. a pass rate from official statistics */
  pain: z.object({ eyebrow: text, stat: text, title: text, text, source: text }),
  pages: z.object({ eyebrow: text, title: text, text }),
  areas: z.object({ eyebrow: text, title: text, text }),
  lookInside: z.object({ eyebrow: text, title: text, mapId: slug, points: z.array(card).min(3).max(6) }),
  strategic: z.object({ eyebrow: text, title: text, cards: z.array(card.extend({ icon: slug })).length(3) }),
  whoFor: z.object({ eyebrow: text, title: text, cards: z.array(card.extend({ icon: slug })).min(3).max(4) }),
  bonuses: z.object({ eyebrow: text, title: text, text }),
  access: z.object({ eyebrow: text, title: text, steps: z.array(text).min(3).max(6) }),
  /** real testimonials only, with permission on file; the section hides while the list is empty */
  testimonials: z.array(z.object({ name: text, place: text, text, permissionOn: z.string() })),
  pricing: z.object({
    eyebrow: text,
    title: text,
    sub: text,
    priceNote: text,
    vatNote: text,
    basic: z.object({ name: text, desc: text, features: z.array(text).min(1), missingTitle: text, missing: z.array(text).min(1), cta: text }),
    complete: z.object({ name: text, badge: text, desc: text, features: z.array(text).min(1), cta: text }),
  }),
  guarantee: z.object({ title: text, text }),
  faq: z.object({ eyebrow: text, title: text, items: z.array(z.object({ q: text, a: text })).min(4) }),
  finalCta: z.object({ title: text, text, cta: text }),
});
export type Sales = z.infer<typeof sales>;

/**
 * Ad carousel slides. Same {placeholders} as the sales page. Page slides use a real rendered map;
 * focusY (0 = top, 100 = bottom) and zoom choose the part of the page that shows.
 */
export const creatives = z.object({
  schemaVersion: z.literal(1),
  niche: slug,
  slides: z
    .array(
      z.discriminatedUnion('kind', [
        z.object({ kind: z.literal('hook'), eyebrow: text, title: text, text, source: text }),
        z.object({ kind: z.literal('page'), mapId: slug, title: text, text, focusY: z.number().min(0).max(100), zoom: z.number().min(1).max(3) }),
        z.object({ kind: z.literal('offer'), title: text, text, cta: text }),
      ]),
    )
    .min(3)
    .max(10),
});
export type Creatives = z.infer<typeof creatives>;

/** Legal pages and site-wide labels for one language. */
const section = z.object({ h: text, p: z.array(text).min(1) });
const legalPage = z.object({ title: text, intro: text, sections: z.array(section).min(1) });

export const legal = z.object({
  schemaVersion: z.literal(1),
  language: z.string(),
  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  privacy: legalPage,
  terms: legalPage,
  refund: legalPage,
  ui: z.object({
    home: z.object({ title: text, sub: text, examsTitle: text, cardMeta: text, cardCta: text, metaDescription: text }),
    nav: z.object({ privacy: text, terms: text, refund: text, cookies: text, contact: text }),
    cookies: z.object({ title: text, text, accept: text, reject: text, more: text }),
    footer: z.object({ company: text, prices: text }),
    lastUpdated: text,
    preview: text,
    checkoutMissing: text,
    labels: z.object({ bonus: text, pages: text, more: text, days: text }),
    notFound: z.object({ title: text, text, cta: text }),
  }),
});
export type Legal = z.infer<typeof legal>;
