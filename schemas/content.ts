import { z } from 'zod';
import { barScaleData, LIMITS, tableData } from './map.ts';
import { jurisdiction, review, slug, sourceRef } from './common.ts';

export const site = z.object({
  schemaVersion: z.literal(1),
  /** brand name: one name everywhere ("HelpTest"); byLanguage can override it for a market if ever needed */
  brand: z.object({
    default: z.string().min(1),
    byLanguage: z.record(z.string().regex(/^[a-z]{2}-[A-Z]{2}$/), z.string().min(1)),
  }),
  domain: z.string().min(1),
  /** the only contact the buyer needs: products are sold by an independent seller through Hotmart, no company */
  supportEmail: z.string().min(1),
  metaPixelId: z.string().nullable(),
});
export type Site = z.infer<typeof site>;

/** brand name in the language of the niche, falling back to the default */
export const brandName = (s: Site, language: string) => s.brand.byLanguage[language] ?? s.brand.default;

/** Numbers to know: one source of truth for maps, the Numbers Table bonus and the flashcards. */
export const numbers = z.object({
  schemaVersion: z.literal(1),
  niche: slug,
  items: z
    .array(
      z.object({
        key: slug,
        label: z.string().min(1).max(60),
        /** short display value, e.g. "1.6 mm" */
        value: z.string().min(1).max(160),
        data: barScaleData.optional(),
        table: tableData.optional(),
        jurisdiction,
        sources: z.array(sourceRef).min(1),
        review,
        notes: z.string().optional(),
      }),
    )
    .min(1),
});
export type Numbers = z.infer<typeof numbers>;
export type NumberItem = Numbers['items'][number];

/** The planned maps of a niche. Map files must match their entry; coverage is planned here first. */
export const inventory = z.object({
  schemaVersion: z.literal(1),
  niche: slug,
  maps: z
    .array(
      z.object({
        id: slug,
        area: slug,
        order: z.number().int().min(1).max(99),
        tier: z.enum(['basic', 'complete']),
        title: z.string().min(1).max(LIMITS.title),
        officialTopics: z.array(slug).min(1),
      }),
    )
    .min(1),
});
export type Inventory = z.infer<typeof inventory>;

export const signShape = z.enum(['triangle', 'inverted-triangle', 'circle', 'octagon', 'rectangle']);

/**
 * Manifest of road signs. Files must be the official images, reproduced accurately.
 * A sign without an official file is "pending-official-asset" and renders as an empty outline.
 */
export const signs = z.object({
  schemaVersion: z.literal(1),
  country: z.string().length(2),
  attribution: z.string().min(1),
  sourceUrl: z.url(),
  signs: z
    .array(
      z
        .object({
          id: slug,
          meaning: z.string().min(1).max(60),
          category: z.enum(['warning', 'regulatory', 'information', 'direction', 'road-marking']),
          shape: signShape,
          /** official diagram number (TSRGD in the UK), filled in when the official file is imported */
          officialNumber: z.string().nullable(),
          /** path relative to the signs folder, e.g. "svg/crossroads.svg" */
          file: z.string().nullable(),
          status: z.enum(['pending-official-asset', 'official']),
        })
        .refine((s) => s.status !== 'official' || (s.file && s.officialNumber), {
          message: 'an "official" sign needs "file" and "officialNumber"',
        }),
    )
    .min(1),
});
export type Signs = z.infer<typeof signs>;
export type Sign = Signs['signs'][number];

/** Labels printed by the templates. Every language file must have all of them. */
export const i18n = z.object({
  schemaVersion: z.literal(1),
  language: z.string(),
  blocks: z.object({
    whatItIs: z.string(),
    keyFacts: z.string(),
    confused: z.string(),
    onTheTest: z.string(),
    traps: z.string(),
    sources: z.string(),
  }),
  map: z.object({
    code: z.string(),
    area: z.string(),
    law: z.string(),
    lawLegend: z.string(),
    why: z.string(),
    vs: z.string(),
    version: z.string(),
    checkedAgainst: z.string(),
    draftFooter: z.string(),
    draftWatermark: z.string(),
    signPending: z.string(),
    jurisdictionNote: z.string(),
    overall: z.string(),
  }),
  segments: z.record(z.string(), z.string()),
  /** timeline visual: block names, verdicts and the hour unit */
  timeline: z.object({
    drive: z.string(),
    break: z.string(),
    rest: z.string(),
    work: z.string(),
    availability: z.string(),
    ok: z.string(),
    wrong: z.string(),
    hours: z.string(),
  }),
  diagram: z.object({
    giveWay: z.string(),
    circulation: z.object({ clockwise: z.string(), anticlockwise: z.string() }),
    signalLeft: z.string(),
    signalRight: z.string(),
    exitLabel: z.string(),
  }),
  bonus: z.object({
    label: z.string(),
    page: z.string(),
    day: z.string(),
    study: z.string(),
    review: z.string(),
    reviewTask: z.string(),
    practice: z.string(),
    practiceTask: z.string(),
    final: z.string(),
    finalTask: z.string(),
    mapIndex: z.string(),
    flashcardsFront: z.string(),
    flashcardsBack: z.string(),
    flashcardsHowTo: z.string(),
    cardSign: z.string(),
    cardNumber: z.string(),
    answer: z.string(),
  }),
  credits: z.object({
    howToUseTitle: z.string(),
    howToUse: z.array(z.string()).min(1),
    legendTitle: z.string(),
    versionLine: z.string(),
    draftLine: z.string(),
    disclaimerTitle: z.string(),
    attributionsTitle: z.string(),
    copyright: z.string(),
    support: z.string(),
    contents: z.string(),
    /** big figures on the cover; {maps}, {questions} and {traps} are counted from the package */
    coverStats: z.array(z.object({ value: z.string(), label: z.string() })).min(1).max(4),
  }),
});
export type I18n = z.infer<typeof i18n>;

export { LIMITS };
