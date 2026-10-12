import { z } from 'zod';
import { hexColour, isoDate, semver, slug } from './common.ts';

/** Refund periods Hotmart lets you choose. Sales to Europe need at least 15. */
export const HOTMART_GUARANTEE_DAYS = [7, 15, 21, 30] as const;

export const niche = z.object({
  schemaVersion: z.literal(1),
  id: slug,
  examName: z.string().min(1),
  /** short name for file names, e.g. "UK-Theory-Maps" */
  filePrefix: z.string().regex(/^[A-Za-z0-9-]+$/),
  country: z.string().length(2),
  jurisdiction: z.string().min(1),
  language: z.string().regex(/^[a-z]{2}-[A-Z]{2}$/),
  currency: z.string().length(3),
  /** which side of the road traffic drives on: drives every road diagram */
  drivingSide: z.enum(['left', 'right']),
  /** the main official document maps are checked against, e.g. "The Highway Code" */
  primarySource: z.string().min(1),
  areas: z
    .array(
      z.object({
        slug,
        name: z.string().min(1).max(48),
        colour: hexColour,
        /** icon name from lucide-static */
        icon: slug,
        officialTopics: z.array(slug).min(1),
      }),
    )
    .min(1)
    .max(9),
  officialTopics: z.object({
    authority: z.string().min(1),
    items: z.array(z.object({ slug, name: z.string().min(1) })).min(1),
  }),
  coverage: z.object({
    minMapsPerTopicComplete: z.number().int().min(1),
    minMapsPerTopicBasic: z.number().int().min(1),
  }),
  content: z.object({
    version: semver,
    checkedOn: isoDate.nullable(),
  }),
  pricing: z.object({
    basic: z.number().positive(),
    complete: z.number().positive(),
    /** only a price that was really charged before; otherwise null */
    anchor: z.number().positive().nullable(),
    /** the price shown is the final price a UK buyer pays, VAT included */
    vatIncluded: z.boolean(),
  }),
  checkout: z.object({
    basicUrl: z.union([z.url(), z.literal('')]),
    completeUrl: z.union([z.url(), z.literal('')]),
  }),
  guaranteeDays: z
    .number()
    .int()
    .refine((d) => (HOTMART_GUARANTEE_DAYS as readonly number[]).includes(d), {
      message: `Hotmart only allows ${HOTMART_GUARANTEE_DAYS.join(', ')} days`,
    }),
  updatePolicy: z.string().min(1),
  disclaimer: z.string().min(1),
  /** attribution lines printed on the credits page of every package */
  attributions: z.array(z.string().min(1)).min(1),
});
export type Niche = z.infer<typeof niche>;
