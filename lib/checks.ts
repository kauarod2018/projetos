import { existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import type { NumberItem } from '../schemas/content.ts';
import type { BarScaleData, TableData } from '../schemas/map.ts';
import { rel, type LoadedContent, type LoadedMap, type LoadedNiche } from './content.ts';
import { iconPath } from './icons.ts';

export interface CheckResult {
  errors: string[];
  warnings: string[];
}

export interface CheckOptions {
  /** release mode: everything that goes into a sold package must be complete and verified */
  release: boolean;
}

/** "4.01": area number (position in niche.json) + order inside the area */
export function mapCode(n: LoadedNiche, m: LoadedMap): string {
  const areaIndex = n.niche.areas.findIndex((a) => a.slug === m.data.area) + 1;
  return `${areaIndex}.${String(m.data.order).padStart(2, '0')}`;
}

export function findNumber(n: LoadedNiche, key: string): NumberItem | undefined {
  return n.numbers.items.find((i) => i.key === key);
}

/** bar-scale data, resolved from numbers.json when the map uses numbersKey */
export function barData(n: LoadedNiche, m: LoadedMap): BarScaleData | undefined {
  const v = m.data.visual;
  if (v.type !== 'bar-scale') return undefined;
  return v.data ?? findNumber(n, v.numbersKey ?? '')?.data;
}

/**
 * A numbers.json item as a table: its own table, or its bar data turned into rows
 * (e.g. stopping distances: speed | thinking | braking | overall).
 */
export function tableFromNumbers(n: LoadedNiche, key: string): TableData | undefined {
  const item = findNumber(n, key);
  if (!item) return undefined;
  if (item.table) return item.table;
  const bars = item.data;
  if (!bars) return undefined;
  const unit = (v: number) => `${v} ${bars.unit}`;
  return {
    columns: ['', ...bars.segments.map((s) => n.i18n.segments[s] ?? s), n.i18n.map.overall],
    rows: bars.rows.map((r) => [r.label, ...r.values.map(unit), `${unit(r.total)}${r.totalFeet ? ` (${r.totalFeet} ft)` : ''}`]),
    notes: [],
  };
}

/** table data, resolved from numbers.json when the map uses numbersKey */
export function tableDataOf(n: LoadedNiche, m: LoadedMap): TableData | undefined {
  const v = m.data.visual;
  if (v.type !== 'table') return undefined;
  return v.data ?? tableFromNumbers(n, v.numbersKey ?? '');
}

export function signsUsed(m: LoadedMap): string[] {
  return m.data.visual.type === 'sign-grid' ? m.data.visual.signs : [];
}

const PLACEHOLDER = /^\{\{.*\}\}$|^your |example\.com|TODO/i;

/** {placeholders} the site and the creatives know how to fill */
export const COPY_PLACEHOLDERS = ['examName', 'brand', 'totalMaps', 'basicMaps', 'bonuses', 'areasList', 'guaranteeDays', 'version', 'checkedOn', 'priceBasic', 'priceComplete', 'year'];
export const LEGAL_PLACEHOLDERS = ['brand', 'domain', 'email', 'entityName', 'address', 'companyId', 'guaranteeDays', 'updatePolicy', 'date', 'n', 'maps', 'price'];

function* strings(value: unknown, path: string): Generator<[string, string]> {
  if (typeof value === 'string') yield [path, value];
  else if (Array.isArray(value)) for (const [i, v] of value.entries()) yield* strings(v, `${path}[${i}]`);
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) yield* strings(v, path ? `${path}.${k}` : k);
}

function unknownPlaceholders(value: unknown, allowed: string[], file: string, errors: string[]) {
  for (const [path, s] of strings(value, '')) {
    for (const [, key] of s.matchAll(/\{(\w+)\}/g)) {
      if (!allowed.includes(key)) errors.push(`${file} → ${path}: unknown placeholder {${key}} (allowed: ${allowed.join(', ')})`);
    }
  }
}

export function checkContent(content: LoadedContent, opts: CheckOptions): CheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const releaseOrWarn = (msg: string) => (opts.release ? errors : warnings).push(msg);

  const { site } = content;
  for (const [field, value] of Object.entries({
    domain: site.domain,
    supportEmail: site.supportEmail,
    'legal.entityName': site.legal.entityName,
    'legal.address': site.legal.address,
    'legal.companyId': site.legal.companyId,
  })) {
    if (PLACEHOLDER.test(value)) releaseOrWarn(`content/site.json → ${field} is still a placeholder ("${value}")`);
  }

  for (const [language, l] of Object.entries(content.legal)) {
    unknownPlaceholders(l, LEGAL_PLACEHOLDERS, `content/legal/${language}.json`, errors);
  }

  for (const n of content.niches) {
    const nf = rel(join(n.dir, 'niche.json'));
    if (!site.brand.byLanguage[n.niche.language]) {
      errors.push(`content/site.json → brand.byLanguage: add the brand name in ${n.niche.language} for ${n.niche.id}`);
    }
    const topicSlugs = new Set(n.niche.officialTopics.items.map((t) => t.slug));
    const areaSlugs = new Set(n.niche.areas.map((a) => a.slug));

    for (const area of n.niche.areas) {
      for (const t of area.officialTopics) {
        if (!topicSlugs.has(t)) errors.push(`${nf} → areas.${area.slug}: unknown official topic "${t}"`);
      }
    }
    const topicsInAreas = new Set(n.niche.areas.flatMap((a) => a.officialTopics));
    for (const t of topicSlugs) {
      if (!topicsInAreas.has(t)) errors.push(`${nf}: official topic "${t}" is not assigned to any area`);
    }

    for (const area of n.niche.areas) {
      if (!existsSync(iconPath(area.icon))) errors.push(`${nf} → areas.${area.slug}.icon: lucide icon "${area.icon}" does not exist`);
    }

    // numbers.json
    const seenKeys = new Set<string>();
    for (const item of n.numbers.items) {
      if (seenKeys.has(item.key)) errors.push(`${rel(join(n.dir, 'numbers.json'))}: duplicate key "${item.key}"`);
      seenKeys.add(item.key);
      if (item.data) checkBars(item.data, `${rel(join(n.dir, 'numbers.json'))} → ${item.key}`, n, errors);
    }

    // signs.json
    const signIds = new Set<string>();
    for (const s of n.signs.signs) {
      if (signIds.has(s.id)) errors.push(`signs.json: duplicate sign id "${s.id}"`);
      signIds.add(s.id);
      if (s.file && !existsSync(join(n.signsDir, s.file))) {
        errors.push(`${rel(join(n.signsDir, 'signs.json'))} → ${s.id}: file "${s.file}" does not exist`);
      }
    }

    // inventory.json: the plan must be consistent and cover every official topic
    const inv = rel(join(n.dir, 'inventory.json'));
    const planned = new Map(n.inventory.maps.map((p) => [p.id, p]));
    if (planned.size !== n.inventory.maps.length) errors.push(`${inv}: duplicate map ids`);
    const plannedCodes = new Set<string>();
    for (const p of n.inventory.maps) {
      if (!areaSlugs.has(p.area)) errors.push(`${inv} → ${p.id}: unknown area "${p.area}"`);
      const code = `${p.area}#${p.order}`;
      if (plannedCodes.has(code)) errors.push(`${inv} → ${p.id}: area + order already used`);
      plannedCodes.add(code);
      for (const t of p.officialTopics) if (!topicSlugs.has(t)) errors.push(`${inv} → ${p.id}: unknown topic "${t}"`);
    }
    for (const t of n.niche.officialTopics.items) {
      const c = n.inventory.maps.filter((p) => p.officialTopics.includes(t.slug)).length;
      const b = n.inventory.maps.filter((p) => p.tier === 'basic' && p.officialTopics.includes(t.slug)).length;
      if (c < n.niche.coverage.minMapsPerTopicComplete || b < n.niche.coverage.minMapsPerTopicBasic) {
        errors.push(`${inv}: the plan does not cover "${t.slug}" enough (complete ${c}, basic ${b})`);
      }
    }

    // maps
    const ids = new Map<string, string>();
    const codes = new Map<string, string>();
    for (const m of n.maps) {
      const f = rel(m.file);
      const d = m.data;
      if (basename(m.file, '.json') !== d.id) errors.push(`${f}: file name must be "${d.id}.json"`);
      if (ids.has(d.id)) errors.push(`${f}: id "${d.id}" is also used by ${ids.get(d.id)}`);
      ids.set(d.id, f);
      if (d.niche !== n.niche.id) errors.push(`${f} → niche: must be "${n.niche.id}"`);
      const plan = planned.get(d.id);
      if (!plan) errors.push(`${f}: "${d.id}" is not in inventory.json (add it to the plan first)`);
      else {
        for (const key of ['area', 'order', 'tier', 'title'] as const) {
          if (plan[key] !== d[key]) errors.push(`${f} → ${key}: "${d[key]}" differs from inventory.json ("${plan[key]}")`);
        }
        if ([...plan.officialTopics].sort().join() !== [...d.officialTopics].sort().join()) {
          errors.push(`${f} → officialTopics: differs from inventory.json (${plan.officialTopics.join(', ')})`);
        }
      }
      if (!areaSlugs.has(d.area)) {
        errors.push(`${f} → area: "${d.area}" is not an area in niche.json (${[...areaSlugs].join(', ')})`);
      } else {
        const code = mapCode(n, m);
        if (codes.has(code)) errors.push(`${f}: map code ${code} (area + order) is also used by ${codes.get(code)}`);
        codes.set(code, f);
      }
      for (const t of d.officialTopics) {
        if (!topicSlugs.has(t)) errors.push(`${f} → officialTopics: unknown topic "${t}"`);
      }
      const pending: string[] = [];
      for (const id of signsUsed(m)) {
        const sign = n.signs.signs.find((s) => s.id === id);
        if (!sign) errors.push(`${f} → visual.signs: sign "${id}" is not in signs.json`);
        else if (sign.status !== 'official') pending.push(id);
      }
      if (pending.length) {
        const msg = `${f} → visual.signs: ${pending.length} sign(s) without the official image yet: ${pending.join(', ')}`;
        (d.review.status === 'verified' || opts.release ? errors : warnings).push(msg);
      }
      const v = d.visual;
      if (v.type === 'bar-scale') {
        if (v.numbersKey) {
          const item = findNumber(n, v.numbersKey);
          if (!item) errors.push(`${f} → visual.numbersKey: "${v.numbersKey}" is not in numbers.json`);
          else if (!item.data) errors.push(`${f} → visual.numbersKey: "${v.numbersKey}" has no bar data`);
          else if (d.review.status === 'verified' && item.review.status !== 'verified') {
            errors.push(`${f}: map is verified but numbers.json → ${v.numbersKey} is not`);
          }
        }
        const data = barData(n, m);
        if (data && v.data) checkBars(data, `${f} → visual.data`, n, errors);
      }
      if (v.type === 'table' && v.numbersKey) {
        const item = findNumber(n, v.numbersKey);
        if (!item) errors.push(`${f} → visual.numbersKey: "${v.numbersKey}" is not in numbers.json`);
        else if (!tableFromNumbers(n, v.numbersKey)) errors.push(`${f} → visual.numbersKey: "${v.numbersKey}" has no table or bar data`);
        else if (d.review.status === 'verified' && item.review.status !== 'verified') {
          errors.push(`${f}: map is verified but numbers.json → ${v.numbersKey} is not`);
        }
      }
      if (v.type === 'cards') {
        for (const c of v.items) {
          if (!c.icon && !c.swatch) errors.push(`${f} → visual.items "${c.title}": give an icon or a swatch`);
          if (c.icon && !existsSync(iconPath(c.icon))) errors.push(`${f} → visual.items "${c.title}": lucide icon "${c.icon}" does not exist`);
        }
      }
      if (v.type === 'road-diagram') {
        const exits = v.routes.map((r) => r.exit);
        if (new Set(exits).size !== exits.length) errors.push(`${f} → visual.routes: each exit can only appear once`);
        for (const r of v.routes) {
          if (r.signalLeftAfterExit !== null && r.signalLeftAfterExit >= r.exit) {
            errors.push(`${f} → visual.routes (exit ${r.exit}): signalLeftAfterExit must be an earlier exit`);
          }
        }
      }
      if (d.review.status !== 'verified') {
        warnings.push(`${f}: draft (not yet fact-checked) — printed with a DRAFT watermark and left out of the packages`);
      }
    }

    // bonuses
    const bonusIds = new Set<string>();
    const bonusNumbers = new Set<number>();
    for (const b of n.bonuses) {
      const f = rel(b.file);
      const d = b.data;
      if (basename(b.file, '.json') !== d.id) errors.push(`${f}: file name must be "${d.id}.json"`);
      if (d.niche !== n.niche.id) errors.push(`${f} → niche: must be "${n.niche.id}"`);
      if (bonusIds.has(d.id)) errors.push(`${f}: duplicate bonus id "${d.id}"`);
      if (bonusNumbers.has(d.number)) errors.push(`${f}: bonus number ${d.number} is used twice`);
      bonusIds.add(d.id);
      bonusNumbers.add(d.number);
      const pending: string[] = [];
      for (const [pi, page] of d.pages.entries()) {
        for (const block of page.blocks) {
          if (block.type === 'sign-pairs') {
            for (const pair of block.pairs) {
              for (const id of [pair.a, pair.b]) {
                const sign = n.signs.signs.find((s) => s.id === id);
                if (!sign) errors.push(`${f} → pages.${pi}: sign "${id}" is not in signs.json`);
                else if (sign.status !== 'official' && !pending.includes(id)) pending.push(id);
              }
            }
          }
          if (block.type === 'table' && block.numbersKey && !tableFromNumbers(n, block.numbersKey)) {
            errors.push(`${f} → pages.${pi}: numbersKey "${block.numbersKey}" has no table or bar data in numbers.json`);
          }
        }
      }
      if (d.kind === 'flashcards' && d.flashcards?.signs) {
        for (const s of n.signs.signs) if (s.status !== 'official') pending.push(s.id);
      }
      if (pending.length) {
        const msg = `${f}: ${pending.length} sign(s) without the official image yet`;
        (d.review.status === 'verified' || opts.release ? errors : warnings).push(msg);
      }
      if (d.review.status !== 'verified') warnings.push(`${f}: draft bonus — watermarked and left out of the packages`);
    }

    // sales page and ad creatives
    const sf = rel(join(n.dir, 'sales.json'));
    const cf = rel(join(n.dir, 'creatives.json'));
    unknownPlaceholders(n.sales, COPY_PLACEHOLDERS, sf, errors);
    unknownPlaceholders(n.creatives, COPY_PLACEHOLDERS, cf, errors);
    if (!planned.has(n.sales.lookInside.mapId)) errors.push(`${sf} → lookInside.mapId: "${n.sales.lookInside.mapId}" is not in inventory.json`);
    for (const card of [...n.sales.strategic.cards, ...n.sales.whoFor.cards]) {
      if (!existsSync(iconPath(card.icon))) errors.push(`${sf}: lucide icon "${card.icon}" does not exist`);
    }
    for (const [i, s] of n.creatives.slides.entries()) {
      if (s.kind === 'page' && !planned.has(s.mapId)) errors.push(`${cf} → slides[${i}].mapId: "${s.mapId}" is not in inventory.json`);
    }
    if (opts.release && n.sales.socialProof === null && n.sales.testimonials.length === 0) {
      warnings.push(`${sf}: no social proof or testimonials yet (both stay hidden, which is correct until you have real ones)`);
    }

    // coverage of the official topics
    const count = (tier: 'basic' | 'complete', topic: string) =>
      n.maps.filter(
        (m) => m.data.officialTopics.includes(topic) && (tier === 'complete' || m.data.tier === 'basic') &&
          (!opts.release || m.data.review.status === 'verified'),
      ).length;
    const missing: string[] = [];
    for (const t of n.niche.officialTopics.items) {
      const c = count('complete', t.slug);
      const b = count('basic', t.slug);
      if (c < n.niche.coverage.minMapsPerTopicComplete || b < n.niche.coverage.minMapsPerTopicBasic) {
        missing.push(`${t.slug} (complete ${c}/${n.niche.coverage.minMapsPerTopicComplete}, basic ${b}/${n.niche.coverage.minMapsPerTopicBasic})`);
      }
    }
    if (missing.length) {
      releaseOrWarn(
        `${n.niche.id}: ${missing.length} of ${topicSlugs.size} ${n.niche.officialTopics.authority} topics are below the minimum number of maps: ${missing.join('; ')}`,
      );
    }

    if (opts.release) {
      if (!n.niche.content.checkedOn) errors.push(`${nf} → content.checkedOn: set the date the content was checked`);
      if (!n.niche.checkout.basicUrl || !n.niche.checkout.completeUrl) errors.push(`${nf} → checkout: add both Hotmart checkout links`);
      if (n.niche.pricing.anchor !== null) {
        warnings.push(`${nf} → pricing.anchor is set: only use it if that price was really charged before`);
      }
    }
  }

  return { errors, warnings };
}

function checkBars(data: BarScaleData, where: string, n: LoadedNiche, errors: string[]) {
  for (const row of data.rows) {
    if (row.values.length !== data.segments.length) {
      errors.push(`${where} → ${row.label}: ${row.values.length} values for ${data.segments.length} segments`);
    }
    const sum = row.values.reduce((a, b) => a + b, 0);
    if (Math.abs(sum - row.total) > 0.001) errors.push(`${where} → ${row.label}: values add up to ${sum}, total says ${row.total}`);
  }
  for (const s of data.segments) {
    if (!n.i18n.segments[s]) errors.push(`${where}: segment "${s}" has no label in i18n/${n.niche.language}.json → segments`);
  }
}
