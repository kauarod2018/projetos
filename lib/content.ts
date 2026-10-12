import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';
import type { z } from 'zod';
import { i18n, inventory, numbers, signs, site, type I18n, type Inventory, type Numbers, type Signs, type Site } from '../schemas/content.ts';
import { bonus, type Bonus } from '../schemas/bonus.ts';
import { map, type RevisionMap } from '../schemas/map.ts';
import { niche, type Niche } from '../schemas/niche.ts';

export const ROOT = resolve(import.meta.dirname, '..');
export const CONTENT_DIR = join(ROOT, 'content');

export interface LoadedMap {
  file: string;
  data: RevisionMap;
}

export interface LoadedBonus {
  file: string;
  data: Bonus;
}

export interface LoadedNiche {
  dir: string;
  niche: Niche;
  numbers: Numbers;
  inventory: Inventory;
  signs: Signs;
  signsDir: string;
  i18n: I18n;
  maps: LoadedMap[];
  bonuses: LoadedBonus[];
}

export interface LoadedContent {
  site: Site;
  niches: LoadedNiche[];
}

export class ContentError extends Error {
  constructor(public readonly problems: string[]) {
    super(`${problems.length} problem(s) in the content files`);
  }
}

const rel = (file: string) => relative(ROOT, file);

function readJson(file: string, problems: string[]): unknown {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    problems.push(`${rel(file)}: invalid JSON (${(err as Error).message})`);
    return undefined;
  }
}

function parseFile<S extends z.ZodType>(schema: S, file: string, problems: string[]): z.infer<S> | undefined {
  if (!existsSync(file)) {
    problems.push(`${rel(file)}: file is missing`);
    return undefined;
  }
  const raw = readJson(file, problems);
  if (raw === undefined) return undefined;
  const result = schema.safeParse(raw);
  if (!result.success) {
    for (const issue of result.error.issues) {
      const path = issue.path.length ? issue.path.join('.') : '(root)';
      problems.push(`${rel(file)} → ${path}: ${issue.message}`);
    }
    return undefined;
  }
  return result.data;
}

/** Loads and schema-checks every content file. Throws ContentError listing all problems. */
export function loadContent(contentDir = CONTENT_DIR): LoadedContent {
  const problems: string[] = [];
  const siteData = parseFile(site, join(contentDir, 'site.json'), problems);
  const nichesDir = join(contentDir, 'niches');
  const loaded: LoadedNiche[] = [];

  const nicheDirs = existsSync(nichesDir)
    ? readdirSync(nichesDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => join(nichesDir, d.name))
    : [];
  if (nicheDirs.length === 0) problems.push('content/niches: no niche folders found');

  for (const dir of nicheDirs) {
    const nicheData = parseFile(niche, join(dir, 'niche.json'), problems);
    const numbersData = parseFile(numbers, join(dir, 'numbers.json'), problems);
    const inventoryData = parseFile(inventory, join(dir, 'inventory.json'), problems);
    const i18nData = nicheData
      ? parseFile(i18n, join(contentDir, 'i18n', `${nicheData.language}.json`), problems)
      : undefined;
    const signsDir = nicheData ? join(contentDir, 'assets', 'signs', nicheData.country.toLowerCase()) : '';
    const signsData = nicheData ? parseFile(signs, join(signsDir, 'signs.json'), problems) : undefined;

    const mapsDir = join(dir, 'maps');
    const maps: LoadedMap[] = [];
    if (existsSync(mapsDir)) {
      for (const name of readdirSync(mapsDir).filter((f) => f.endsWith('.json')).sort()) {
        const file = join(mapsDir, name);
        const data = parseFile(map, file, problems);
        if (data) maps.push({ file, data });
      }
    }

    const bonusesDir = join(dir, 'bonuses');
    const bonuses: LoadedBonus[] = [];
    if (existsSync(bonusesDir)) {
      for (const name of readdirSync(bonusesDir).filter((f) => f.endsWith('.json')).sort()) {
        const file = join(bonusesDir, name);
        const data = parseFile(bonus, file, problems);
        if (data) bonuses.push({ file, data });
      }
    }

    if (nicheData && numbersData && inventoryData && i18nData && signsData) {
      if (basename(dir) !== nicheData.id) {
        problems.push(`${rel(dir)}: folder name must match niche id "${nicheData.id}"`);
      }
      loaded.push({ dir, niche: nicheData, numbers: numbersData, inventory: inventoryData, signs: signsData, signsDir, i18n: i18nData, maps, bonuses });
    }
  }

  if (problems.length || !siteData) throw new ContentError(problems);
  return { site: siteData, niches: loaded };
}

export { rel };
