/**
 * Everything the website shows comes from here, built from the content files and dist/<niche>/manifest.json.
 *
 *   SITE_MODE=preview  → numbers from the plan (inventory.json), draft images, a PREVIEW banner, noindex
 *   SITE_MODE=release  → only verified maps and bonuses; the build fails if there is nothing verified to sell
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadContent, ROOT, type LoadedContent, type LoadedNiche } from '../lib/content.ts';
import { brandName } from '../schemas/content.ts';
import type { Legal, Sales } from '../schemas/site-copy.ts';
import { formatDate, pad2 } from '../templates/shared/html.ts';
import { slugify } from './shopFilter.ts';

export type Mode = 'preview' | 'release';
export const MODE: Mode = process.env.SITE_MODE === 'release' ? 'release' : 'preview';

interface Manifest {
  counts: { completeMaps: number; basicMaps: number; bonuses: number };
  maps: { id: string; code: string; title: string; area: string; tier: string; status: string; webp: string }[];
  covers?: { product?: string; cover?: string; contents?: string };
  bonuses: {
    id: string;
    number: number;
    title: string;
    summary: string;
    status: string;
    pages: number;
    preview: { webp: string };
    release?: { webp: string };
  }[];
}

let cached: LoadedContent | undefined;
export function content(): LoadedContent {
  cached ??= loadContent();
  return cached;
}

function manifest(id: string): Manifest {
  const file = join(ROOT, 'dist', id, 'manifest.json');
  if (!existsSync(file)) throw new Error(`dist/${id}/manifest.json is missing: run "npm run build:preview" (or build:pdfs) first`);
  return JSON.parse(readFileSync(file, 'utf8')) as Manifest;
}

/** dist/<niche>/maps/webp/x.webp → /media/<niche>/maps/webp/x.webp (copied by scripts/sync-site-assets.ts) */
const media = (niche: string, distPath: string) => `/media/${niche}/${distPath}`;
const small = (src: string) => src.replace(/\.webp$/, '-600.webp');

export interface Img {
  src: string;
  srcSmall: string;
  alt: string;
}

const img = (niche: string, distPath: string, alt: string): Img => {
  const src = media(niche, distPath);
  return { src, srcSmall: small(src), alt };
};

export function fillText(template: string, values: Record<string, string | number>, where: string): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    if (!(key in values)) throw new Error(`${where}: unknown placeholder {${key}}`);
    return String(values[key]);
  });
}

/** fills every string in a copy object; an unknown {placeholder} stops the build */
export function fillDeep<T>(value: T, values: Record<string, string | number>, where: string): T {
  if (typeof value === 'string') return fillText(value, values, where) as T;
  if (Array.isArray(value)) return value.map((v, i) => fillDeep(v, values, `${where}[${i}]`)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, fillDeep(v, values, `${where}.${k}`)])) as T;
  }
  return value;
}

export function legalFor(language: string): Legal {
  const l = content().legal[language];
  if (!l) throw new Error(`content/legal/${language}.json is missing`);
  return l;
}

export function siteValues(language: string, guaranteeDays?: number, updatePolicy?: string) {
  const s = content().site;
  return {
    brand: brandName(s, language),
    domain: s.domain,
    email: s.supportEmail,
    guaranteeDays: guaranteeDays ?? 15,
    updatePolicy: updatePolicy ?? '',
  };
}

export interface NicheView {
  id: string;
  language: string;
  brand: string;
  examName: string;
  mode: Mode;
  pixelId: string | null;
  copy: Sales;
  counts: { totalMaps: number; basicMaps: number; bonuses: number; areas: number };
  prices: { basic: string; complete: string; basicValue: number; completeValue: number; currency: string; vatIncluded: boolean };
  checkout: { basic: string; complete: string };
  areas: { num: string; slug: string; name: string; colour: string; icon: string; maps: { code: string; title: string }[] }[];
  lookInside: Img | undefined;
  /** product page gallery: pack cover, contents, sample maps and bonus pages */
  gallery: (Img & { label: string; kind: 'product' | 'cover' | 'contents' | 'map' | 'bonus' })[];
  store: { category: string; countryName: string; productName: string; cardText: string; format: string; coverTagline: string; keywords: string[]; badge?: string; rank: number };
  /** country of the exam: ISO code and the flag copied from flag-icons by site:assets */
  country: { code: string; name: string; flag: string };
  /** the cover badges with the counts filled in, e.g. "60 one-page maps" */
  highlights: string[];
  checkedOn: string;
  questions: number;
  traps: number;
  basic: { questions: number; traps: number };
  bonuses: { number: number; title: string; summary: string; pages: number; image: Img }[];
  disclaimer: string;
  guaranteeDays: number;
}

/** counts and {placeholder} values for one niche: real verified files (release) or the plan (preview) */
export function copyValues(n: LoadedNiche, mode: Mode = MODE) {
  const m = manifest(n.niche.id);
  const release = mode === 'release';
  const areaIndex = (slug: string) => n.niche.areas.findIndex((a) => a.slug === slug);

  // what exists (release) or what is planned (preview)
  const mapList = release
    ? m.maps.filter((x) => x.status === 'verified').map((x) => ({ code: x.code, title: x.title, area: x.area, tier: x.tier }))
    : n.inventory.maps.map((p) => ({ code: `${areaIndex(p.area) + 1}.${pad2(p.order)}`, title: p.title, area: p.area, tier: p.tier }));
  const bonusList = release ? m.bonuses.filter((b) => b.release) : m.bonuses;
  if (release && mapList.length === 0) throw new Error(`${n.niche.id}: there are no verified maps yet, so there is nothing to sell. Use SITE_MODE=preview.`);

  const counts = {
    totalMaps: mapList.length,
    basicMaps: mapList.filter((x) => x.tier === 'basic').length,
    bonuses: bonusList.length,
    areas: n.niche.areas.length,
  };

  const money = (v: number) => new Intl.NumberFormat(n.niche.language, { style: 'currency', currency: n.niche.currency, maximumFractionDigits: v % 1 ? 2 : 0 }).format(v);
  const checkedOn = n.niche.content.checkedOn;
  const thisYear = new Date().getFullYear();
  const year = checkedOn && Number(checkedOn.slice(0, 4)) === thisYear ? String(thisYear) : '';
  const values = {
    examName: n.niche.examName,
    brand: brandName(content().site, n.niche.language),
    totalMaps: counts.totalMaps,
    basicMaps: counts.basicMaps,
    bonuses: counts.bonuses,
    areasList: n.niche.areas.map((a) => a.name).join(', '),
    guaranteeDays: n.niche.guaranteeDays,
    version: n.niche.content.version,
    checkedOn: checkedOn ? formatDate(checkedOn, n.niche.language) : 'not checked yet',
    priceBasic: money(n.niche.pricing.basic),
    priceComplete: money(n.niche.pricing.complete),
    year,
  };
  return { manifest: m, mapList, bonusList, counts, values };
}

export function nicheView(n: LoadedNiche): NicheView {
  const id = n.niche.id;
  const release = MODE === 'release';
  const { manifest: m, mapList, bonusList, counts, values } = copyValues(n);
  const copy = fillDeep(n.sales, values, `${id}/sales.json`);
  copy.hero.eyebrow = copy.hero.eyebrow.trim();

  const pageMaps = release ? m.maps.filter((x) => x.status === 'verified') : m.maps;
  const gl = legalFor(n.niche.language).ui.product.galleryLabels;
  const soldMaps = n.maps.filter((x) => !release || x.data.review.status === 'verified');
  const basicMaps = soldMaps.filter((x) => x.data.tier === 'basic');
  const counted = {
    questions: soldMaps.reduce((sum, x) => sum + x.data.onTheTest.length, 0),
    traps: soldMaps.reduce((sum, x) => sum + x.data.traps.length, 0),
    basic: {
      questions: basicMaps.reduce((sum, x) => sum + x.data.onTheTest.length, 0),
      traps: basicMaps.reduce((sum, x) => sum + x.data.traps.length, 0),
    },
  };
  const look = pageMaps.find((x) => x.id === n.sales.lookInside.mapId) ?? pageMaps[0];

  return {
    id,
    language: n.niche.language,
    brand: values.brand,
    examName: n.niche.examName,
    mode: MODE,
    pixelId: content().site.metaPixelId,
    copy,
    counts,
    prices: {
      basic: values.priceBasic,
      complete: values.priceComplete,
      basicValue: n.niche.pricing.basic,
      completeValue: n.niche.pricing.complete,
      currency: n.niche.currency,
      vatIncluded: n.niche.pricing.vatIncluded,
    },
    checkout: { basic: n.niche.checkout.basicUrl, complete: n.niche.checkout.completeUrl },
    areas: n.niche.areas.map((a, i) => ({
      num: pad2(i + 1),
      slug: a.slug,
      name: a.name,
      colour: a.colour,
      icon: a.icon,
      maps: mapList.filter((x) => x.area === a.slug).map(({ code, title }) => ({ code, title })),
    })),
    lookInside: look ? img(id, look.webp, `${look.title}: a full page from the maps`) : undefined,
    gallery: [
      ...(['product', 'cover', 'contents'] as const)
        .filter((k) => m.covers?.[k])
        .map((k) => ({
          ...img(id, m.covers![k]!, `${n.niche.examName}: ${gl[k].toLowerCase()}`),
          label: gl[k],
          kind: k,
        })),
      ...n.sales.gallery.maps
        .map((mapId) => pageMaps.find((x) => x.id === mapId))
        .filter((x) => x !== undefined)
        .map((x) => ({ ...img(id, x.webp, `${x.title} (map ${x.code})`), label: fillText(gl.map, { code: x.code }, 'ui.product.galleryLabels.map'), kind: 'map' as const })),
      ...n.sales.gallery.bonuses
        .map((bonusId) => bonusList.find((b) => b.id === bonusId))
        .filter((b) => b !== undefined)
        .map((b) => ({
          ...img(id, b.release?.webp ?? b.preview.webp, `${b.title}, first page`),
          label: fillText(gl.bonus, { n: b.number }, 'ui.product.galleryLabels.bonus'),
          kind: 'bonus' as const,
        })),
    ],
    store: n.niche.store,
    country: { code: n.niche.country.toLowerCase(), name: n.niche.store.countryName, flag: `/media/flags/${n.niche.country.toLowerCase()}.svg` },
    highlights: n.niche.store.coverBadges.map((b) => fillText(b, { maps: counts.totalMaps, questions: counted.questions, bonuses: counts.bonuses }, `${id}/niche.json → store.coverBadges`)),
    checkedOn: values.checkedOn,
    questions: counted.questions,
    traps: counted.traps,
    basic: counted.basic,
    bonuses: bonusList.map((b) => ({
      number: b.number,
      title: b.title,
      summary: b.summary,
      pages: b.pages,
      image: img(id, b.release?.webp ?? b.preview.webp, `${b.title}, first page`),
    })),
    disclaimer: n.niche.disclaimer,
    guaranteeDays: n.niche.guaranteeDays,
  };
}

/** every niche, best sellers first (store.rank, then name) */
export function allNiches(): LoadedNiche[] {
  // products still being made show in preview builds only
  return [...content().niches].filter((n) => MODE !== 'release' || n.niche.published).sort((a, b) => a.niche.store.rank - b.niche.store.rank || a.niche.examName.localeCompare(b.niche.examName));
}


/** categories and countries across the shop, in best-seller order, for the header and the filters */
export function shopIndex() {
  const niches = allNiches();
  const categories = [...new Map(niches.map((n) => [slugify(n.niche.store.category), { slug: slugify(n.niche.store.category), name: n.niche.store.category }])).values()];
  const countries = [
    ...new Map(
      niches.map((n) => {
        const code = n.niche.country.toLowerCase();
        return [code, { code, name: n.niche.store.countryName, flag: `/media/flags/${code}.svg` }];
      }),
    ).values(),
  ].sort((a, b) => a.name.localeCompare(b.name));
  return { categories, countries };
}
