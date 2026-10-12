import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { mapCode } from '../../lib/checks.ts';
import type { LoadedMap, LoadedNiche } from '../../lib/content.ts';
import { icon } from '../../lib/icons.ts';
import { brandName, type Site } from '../../schemas/content.ts';
import { esc, fill, formatDate, pad2 } from '../shared/html.ts';
import { htmlDocument } from '../map/render.ts';

const HERE = import.meta.dirname;

export interface CreditsInput {
  title: string;
  subtitle: string;
  maps: LoadedMap[];
  preview: boolean;
  year: number;
}

/** First two pages of every package: how to use, legend, disclaimer and licences, then the contents. */
export function renderCreditsPage(n: LoadedNiche, site: Site, input: CreditsInput): string {
  const t = n.i18n;
  const c = t.credits;
  const brand = brandName(site, n.niche.language);
  const versionLine = input.preview
    ? `<p class="cr-draft">${esc(c.draftLine)}</p>`
    : `<p class="cr-version">${fill(c.versionLine, {
        version: n.niche.content.version,
        date: n.niche.content.checkedOn ? formatDate(n.niche.content.checkedOn, n.niche.language) : '—',
      })}</p>`;

  // contents, grouped by area, on a page of its own: 60 maps don't fit next to the rest
  const toc = n.niche.areas
    .map((a, i) => {
      const maps = input.maps.filter((m) => m.data.area === a.slug);
      if (!maps.length) return '';
      const items = maps.map((m) => `<li><span class="cr-code">${mapCode(n, m)}</span>${esc(m.data.title)}</li>`).join('');
      return `<section class="cr-toc-area" style="--area:${a.colour}"><h3><span class="cr-chip">${pad2(i + 1)}</span>${icon(a.icon, 12, 2.2)}${esc(a.name)}</h3><ol>${items}</ol></section>`;
    })
    .join('');

  const areas = n.niche.areas
    .map((a, i) => `<li style="--area:${a.colour}"><span class="cr-chip">${pad2(i + 1)}</span>${icon(a.icon, 12, 2.2)}${esc(a.name)}</li>`)
    .join('');

  const attributions = [...n.niche.attributions, n.signs.attribution].map((a) => `<li>${esc(a)}</li>`).join('');
  const band = `<header class="cr-band">
    <span class="cr-brand">${esc(brand)}</span>
    <span class="cr-exam">${esc(n.niche.examName)}</span>
  </header>`;
  const counts = {
    maps: input.maps.length,
    questions: input.maps.reduce((sum, m) => sum + m.data.onTheTest.length, 0),
    traps: input.maps.reduce((sum, m) => sum + m.data.traps.length, 0),
  };
  const stats = c.coverStats
    .map((s) => `<div class="cr-stat"><b>${esc(fill(s.value, counts))}</b><span>${esc(fill(s.label, counts))}</span></div>`)
    .join('');
  const lane = n.niche.areas.map((a) => `<span style="--area:${a.colour}"></span>`).join('');
  const watermark = input.preview ? `<div class="watermark"><span>${esc(t.map.draftWatermark)}</span></div>` : '';

  const body = `<div class="page cr">
  ${band}
  <main class="cr-main">
    <h1>${esc(input.title)}</h1>
    <p class="cr-sub">${esc(input.subtitle)}</p>
    ${versionLine}
    <div class="cr-stats">${stats}</div>
    <div class="cr-lane" aria-hidden="true">${lane}</div>
    <div class="cr-grid">
      <section>
        <h2>${esc(c.howToUseTitle)}</h2>
        <ul class="cr-how">${c.howToUse.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>
      </section>
      <section>
        <h2>${esc(c.legendTitle)}</h2>
        <ul class="cr-areas">${areas}</ul>
        <p class="cr-law"><span class="law-badge">${esc(t.map.law)}</span>${esc(t.map.lawLegend)}</p>
      </section>
    </div>
  </main>
  <footer class="cr-foot">
    <h2>${esc(c.disclaimerTitle)}</h2>
    <p>${esc(n.niche.disclaimer)}</p>
    <h2>${esc(c.attributionsTitle)}</h2>
    <ul>${attributions}</ul>
    <p class="cr-copy">${fill(c.copyright, { year: input.year, brand })} ${fill(c.support, { email: site.supportEmail })}</p>
  </footer>
  ${watermark}
</div>
<div class="page cr">
  ${band}
  <main class="cr-main">
    <h2 class="cr-toc-title">${esc(c.contents)}</h2>
    <div class="cr-toc">${toc}</div>
  </main>
  ${watermark}
</div>`;

  const css = readFileSync(join(HERE, '../shared/base.css'), 'utf8') + readFileSync(join(HERE, '../map/map.css'), 'utf8') + readFileSync(join(HERE, 'credits.css'), 'utf8');
  return htmlDocument(input.title, body, css);
}
