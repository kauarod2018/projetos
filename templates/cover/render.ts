import { readFileSync } from 'node:fs';
import type { LoadedNiche } from '../../lib/content.ts';
import { brandName, type Site } from '../../schemas/content.ts';
import { brandLockup } from '../shared/brand.ts';
import { esc, fill } from '../shared/html.ts';
import { htmlDocument } from '../map/render.ts';

export interface CoverInput {
  /** PNG files of up to 3 real pages, shown fanned out */
  pages: string[];
  counts: { maps: number; questions: number; bonuses: number };
}

/** CSS size of the cover; it is captured at 2x, so the image is 1200 x 1500 px */
export const COVER_SIZE = { width: 600, height: 750 };

const dataUri = (file: string) => `data:image/png;base64,${readFileSync(file).toString('base64')}`;

/** The product image used in the shop: brand band, exam name, badges and three real pages. */
export function renderProductCover(n: LoadedNiche, site: Site, input: CoverInput): string {
  const s = n.niche.store;
  const brand = brandName(site, n.niche.language);
  const badges = s.coverBadges.map((b) => `<li>${esc(fill(b, input.counts))}</li>`).join('');
  const pages = input.pages
    .slice(0, 3)
    .map((file, i) => `<img class="pg pg-${i}" src="${dataUri(file)}" alt="">`)
    .join('');
  const body = `<div class="cover">
  <header>${brandLockup(brand, 34)}</header>
  <p class="chip">${esc(s.countryName)} · ${esc(s.category)}</p>
  <h1>${esc(n.niche.examName)}</h1>
  <p class="tagline">${esc(s.coverTagline)}</p>
  <ul class="badges">${badges}</ul>
  <div class="pages">${pages}</div>
</div>`;
  const css = `
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: ${COVER_SIZE.width}px; height: ${COVER_SIZE.height}px; }
.cover {
  position: relative; width: 100%; height: 100%; overflow: hidden;
  background: #0b6e4f; color: #fff; padding: 34px 38px; font-family: 'Atkinson', sans-serif;
}
.cover::before {
  content: ''; position: absolute; left: 0; right: 0; top: 330px; height: 4px;
  background: repeating-linear-gradient(90deg, #ffc93c 0 34px, transparent 34px 56px); opacity: 0.9;
}
header { display: flex; align-items: center; font-size: 24px; color: #fff; }
.chip {
  display: inline-block; margin-top: 30px; padding: 5px 12px; border-radius: 999px;
  background: rgba(255, 255, 255, 0.14); font-weight: 700; font-size: 14px; letter-spacing: 0.02em;
}
h1 {
  margin-top: 14px; font-family: 'Archivo', sans-serif; font-weight: 800; font-stretch: 88%;
  font-size: 54px; line-height: 0.98; letter-spacing: -0.02em; max-width: 480px;
}
.tagline { margin-top: 10px; font-family: 'Archivo', sans-serif; font-weight: 800; font-size: 26px; color: #ffc93c; }
.badges { position: absolute; top: 352px; left: 38px; display: flex; flex-wrap: wrap; gap: 8px; list-style: none; max-width: 524px; }
.badges li { background: #fff; color: #08513a; border-radius: 999px; padding: 5px 12px; font-weight: 700; font-size: 14px; }
.pages { position: absolute; left: 0; right: 0; top: 412px; height: 420px; }
.pg { position: absolute; width: 250px; border-radius: 4px; box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35); background: #fff; }
.pg-0 { left: 175px; top: 0; z-index: 3; }
.pg-1 { left: 22px; top: 44px; transform: rotate(-8deg); z-index: 2; }
.pg-2 { right: 22px; top: 44px; transform: rotate(8deg); z-index: 1; }
`;
  return htmlDocument(`${n.niche.examName}: cover`, body, css);
}
