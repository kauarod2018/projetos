import { z } from 'zod';
import { jurisdiction, review, slug, sourceRef } from './common.ts';

/** Text limits keep every map on one A4 page. The build also checks for overflow. */
export const LIMITS = {
  title: 48,
  whatItIs: 200,
  keyFact: 120,
  keyFactsMin: 3,
  keyFactsMax: 6,
  confusedLabel: 40,
  confusedPoint: 90,
  confusedPointsMin: 2,
  confusedPointsMax: 4,
  questionsMin: 1,
  questionsMax: 2,
  question: 180,
  option: 80,
  why: 220,
  trap: 140,
  trapsMin: 2,
  trapsMax: 4,
  caption: 90,
} as const;

/** A key fact is plain text, or { text, law: true } when The Highway Code says MUST / MUST NOT. */
export const keyFact = z.union([
  z.string().min(1).max(LIMITS.keyFact),
  z.object({ text: z.string().min(1).max(LIMITS.keyFact), law: z.literal(true) }),
]);
export type KeyFact = z.infer<typeof keyFact>;

export const barScaleData = z.object({
  unit: z.string().min(1),
  /** i18n keys for the segments, e.g. ["thinking", "braking"] */
  segments: z.array(slug).min(1).max(3),
  rows: z
    .array(
      z.object({
        label: z.string().min(1).max(16),
        values: z.array(z.number().nonnegative()).min(1).max(3),
        total: z.number().positive(),
        totalFeet: z.number().positive().optional(),
      }),
    )
    .min(2)
    .max(8),
});
export type BarScaleData = z.infer<typeof barScaleData>;

export const tableData = z.object({
  columns: z.array(z.string().min(1)).min(2).max(6),
  rows: z.array(z.array(z.string())).min(1).max(12),
  notes: z.array(z.string().min(1).max(160)).max(3).default([]),
});
export type TableData = z.infer<typeof tableData>;

const signGrid = z.object({
  type: z.literal('sign-grid'),
  caption: z.string().min(1).max(LIMITS.caption),
  signs: z.array(slug).min(1).max(10),
});

const barScale = z
  .object({
    type: z.literal('bar-scale'),
    caption: z.string().min(1).max(LIMITS.caption),
    /** inline data, or a key in numbers.json (preferred: one source of truth for every number) */
    data: barScaleData.optional(),
    numbersKey: slug.optional(),
  })
  .refine((v) => Boolean(v.data) !== Boolean(v.numbersKey), {
    message: 'bar-scale needs exactly one of "data" or "numbersKey"',
  });

const roundaboutRoute = z.object({
  /** 1 = first exit after your entry, following the direction of circulation */
  exit: z.number().int().min(1).max(3),
  label: z.string().min(1).max(40),
  steps: z.array(z.string().min(1).max(70)).min(1).max(3),
  approachLane: z.enum(['left', 'right']),
  signalOnApproach: z.enum(['left', 'right', 'none']),
  /** draw a "signal left" marker after passing this exit (null = signal left from the start) */
  signalLeftAfterExit: z.number().int().min(1).max(3).nullable(),
});

const roadDiagram = z.object({
  type: z.literal('road-diagram'),
  diagram: z.literal('roundabout-exits'),
  caption: z.string().min(1).max(LIMITS.caption),
  routes: z.array(roundaboutRoute).min(1).max(3),
  notes: z.array(z.string().min(1).max(70)).max(3).default([]),
});

const table = z
  .object({
    type: z.literal('table'),
    caption: z.string().min(1).max(LIMITS.caption),
    data: tableData.optional(),
    numbersKey: slug.optional(),
  })
  .refine((v) => Boolean(v.data) !== Boolean(v.numbersKey), {
    message: 'table needs exactly one of "data" or "numbersKey"',
  });

export const visual = z.discriminatedUnion('type', [signGrid, barScale, roadDiagram, table]);
export type Visual = z.infer<typeof visual>;

const confusedSide = z.object({
  label: z.string().min(1).max(LIMITS.confusedLabel),
  points: z.array(z.string().min(1).max(LIMITS.confusedPoint)).min(LIMITS.confusedPointsMin).max(LIMITS.confusedPointsMax),
});

export const question = z
  .object({
    question: z.string().min(1).max(LIMITS.question),
    options: z.tuple([
      z.string().min(1).max(LIMITS.option),
      z.string().min(1).max(LIMITS.option),
      z.string().min(1).max(LIMITS.option),
      z.string().min(1).max(LIMITS.option),
    ]),
    /** zero-based: 0 = first option */
    answerIndex: z.number().int().min(0).max(3),
    why: z.string().min(1).max(LIMITS.why),
  })
  .refine((q) => new Set(q.options.map((o) => o.trim().toLowerCase())).size === 4, {
    message: 'the 4 options must all be different',
  })
  .refine((q) => !q.options.some((o) => /^(all|none) of the above$/i.test(o.trim())), {
    message: 'do not use "all of the above" / "none of the above"',
  });
export type Question = z.infer<typeof question>;

export const map = z.object({
  schemaVersion: z.literal(1),
  id: slug,
  niche: slug,
  /** area slug from niche.json */
  area: slug,
  /** position inside the area: map code = area number + order (e.g. 4.01) */
  order: z.number().int().min(1).max(99),
  /** "basic" maps go in both packages, "complete" maps only in the Complete package */
  tier: z.enum(['basic', 'complete']),
  /** official exam topics covered (slugs from niche.json officialTopics) */
  officialTopics: z.array(slug).min(1),
  title: z.string().min(1).max(LIMITS.title),
  whatItIs: z.string().min(1).max(LIMITS.whatItIs),
  keyFacts: z.array(keyFact).min(LIMITS.keyFactsMin).max(LIMITS.keyFactsMax),
  visual,
  confused: z.object({ a: confusedSide, b: confusedSide }),
  onTheTest: z.array(question).min(LIMITS.questionsMin).max(LIMITS.questionsMax),
  traps: z.array(z.string().min(1).max(LIMITS.trap)).min(LIMITS.trapsMin).max(LIMITS.trapsMax),
  sources: z.array(sourceRef).min(1),
  jurisdictionNotes: z.array(z.object({ jurisdiction, text: z.string().min(1).max(160) })).default([]),
  review,
});
export type RevisionMap = z.infer<typeof map>;
