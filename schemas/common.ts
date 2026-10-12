import { z } from 'zod';

/** lowercase-with-hyphens, used for every id in the content files */
export const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'use lowercase letters, numbers and hyphens (e.g. "stopping-distances")');

export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'use the format YYYY-MM-DD');

export const hexColour = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'use a 6-digit hex colour like "#0F766E"');

export const semver = z.string().regex(/^\d+\.\d+\.\d+$/, 'use a version like "1.0.0"');

export const sourceRef = z.object({
  doc: z.string().min(1),
  ref: z.string().min(1),
  url: z.url(),
});
export type SourceRef = z.infer<typeof sourceRef>;

/**
 * Fact-check status. Only "verified" content can go into a package that is sold:
 * it needs the date of the check and what it was checked against.
 */
export const review = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('draft'),
    checkedOn: z.null().optional(),
    checkedAgainst: z.null().optional(),
    notes: z.string().optional(),
  }),
  z.object({
    status: z.literal('verified'),
    checkedOn: isoDate,
    checkedAgainst: z.string().min(1),
    notes: z.string().optional(),
  }),
]);
export type Review = z.infer<typeof review>;

export const jurisdiction = z.enum(['great-britain', 'england', 'wales', 'scotland', 'england-and-wales']);
