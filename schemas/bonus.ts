import { z } from 'zod';
import { review, slug, sourceRef } from './common.ts';
import { keyFact, tableData } from './map.ts';

/** blocks a bonus page is made of; span 1 = half width, 2 = full width */
const base = { span: z.union([z.literal(1), z.literal(2)]).default(2) };
const title = z.string().min(1).max(60);

const block = z.discriminatedUnion('type', [
  z.object({ ...base, type: z.literal('lead'), text: z.string().min(1).max(400) }),
  z.object({
    ...base,
    type: z.literal('stat-row'),
    items: z.array(z.object({ value: z.string().min(1).max(10), label: z.string().min(1).max(40) })).min(2).max(5),
  }),
  z.object({ ...base, type: z.literal('facts'), title, items: z.array(keyFact).min(1).max(10) }),
  z.object({
    ...base,
    type: z.literal('steps'),
    title,
    items: z.array(z.object({ title: z.string().min(1).max(50), text: z.string().min(1).max(200) })).min(1).max(8),
  }),
  z.object({ ...base, type: z.literal('callout'), tone: z.enum(['tip', 'warning']), title, text: z.string().min(1).max(300) }),
  z.object({ ...base, type: z.literal('checklist'), title, items: z.array(z.string().min(1).max(140)).min(1).max(12) }),
  z
    .object({ ...base, type: z.literal('table'), title, data: tableData.optional(), numbersKey: slug.optional() })
    .refine((v) => Boolean(v.data) !== Boolean(v.numbersKey), { message: 'table needs exactly one of "data" or "numbersKey"' }),
  z.object({
    ...base,
    type: z.literal('scoring-window'),
    title,
    /** labels along the timeline, from "too early" to "too late" */
    labels: z.object({ before: z.string(), start: z.string(), end: z.string(), after: z.string() }),
  }),
  z.object({
    ...base,
    type: z.literal('sign-pairs'),
    title,
    pairs: z.array(z.object({ a: slug, b: slug, tell: z.string().min(1).max(160) })).min(1).max(4),
  }),
  /** every item of numbers.json, generated */
  z.object({
    ...base,
    type: z.literal('numbers-table'),
    title,
    /** only these numbers, in this order (default: all verified numbers); lets a long table run over two pages */
    keys: z.array(z.string().min(1)).min(1).optional(),
  }),
  /** a day-by-day plan generated from the maps that exist */
  z.object({ ...base, type: z.literal('revision-plan'), title, days: z.number().int().min(7).max(60) }),
  /** code → title of every map in the plan, generated */
  z.object({ ...base, type: z.literal('map-index'), title }),
]);
export type BonusBlock = z.infer<typeof block>;

export const bonus = z
  .object({
    schemaVersion: z.literal(1),
    id: slug,
    niche: slug,
    /** position 1–6 on the sales page and in file names */
    number: z.number().int().min(1).max(9),
    title: z.string().min(1).max(48),
    /** one line for the sales page */
    summary: z.string().min(1).max(110),
    kind: z.enum(['document', 'flashcards']),
    pages: z.array(z.object({ heading: z.string().min(1).max(60), blocks: z.array(block).min(1) })).default([]),
    /** signIds: only these signs (default: every official sign of the country) */
    flashcards: z.object({ signs: z.boolean(), numbers: z.boolean(), signIds: z.array(slug).optional() }).optional(),
    sources: z.array(sourceRef).min(1),
    review,
  })
  .refine((b) => (b.kind === 'document' ? b.pages.length > 0 : Boolean(b.flashcards)), {
    message: 'a document needs "pages"; flashcards need "flashcards"',
  });
export type Bonus = z.infer<typeof bonus>;
