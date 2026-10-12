import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { mapCode } from '../../lib/checks.ts';
import type { LoadedMap, LoadedNiche } from '../../lib/content.ts';
import { icon } from '../../lib/icons.ts';
import type { Site } from '../../schemas/content.ts';
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

/** First page of every package: contents, how to use, legend, disclaimer and licences. */
export function renderCreditsPage(n: LoadedNiche, site: Site, input: CreditsInput): string {
  const t = n.i18n;
  const c = t.credits;
  const versionLine = input.preview
    ? `<p class="cr-draft">${esc(c.draftLine)}</p>`
    : `<p class="cr-version">${fill(c.versionLine, {
        version: n.niche.content.version,
        date: n.niche.content.checkedOn ? formatDate(n.niche.content.checkedOn, n.niche.language) : '—',
      })}</p>`;

  const contents = input.maps
    .map((m) => {
      const area = n.niche.areas.find((a) => a.slug === m.data.area)!;
      return `<li style="--area:${area.colour}"><span class="cr-code">${mapCode(n, m)}</span>${esc(m.data.title)}</li>`;
    })
    .join('');

  const areas = n.niche.areas
    .map((a, i) => `<li style="--area:${a.colour}"><span class="cr-chip">${pad2(i + 1)}</span>${icon(a.icon, 12, 2.2)}${esc(a.name)}</li>`)
    .join('');

  const attributions = [...n.niche.attributions, n.signs.attribution].map((a) => `<li>${esc(a)}</li>`).join('');

  const body = `<div class="page cr">
  <header class="cr-band">
    <span class="cr-brand">${esc(site.brandName)}</span>
    <span class="cr-exam">${esc(n.niche.examName)}</span>
  </header>
  <main class="cr-main">
    <h1>${esc(input.title)}</h1>
    <p class="cr-sub">${esc(input.subtitle)}</p>
    ${versionLine}
    <div class="cr-grid">
      <section>
        <h2>${esc(c.contents)}</h2>
        <ol class="cr-contents${input.maps.length > 14 ? ' two-col' : ''}">${contents}</ol>
      </section>
      <section>
        <h2>${esc(c.howToUseTitle)}</h2>
        <ul class="cr-how">${c.howToUse.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>
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
    <p class="cr-copy">${fill(c.copyright, { year: input.year, brand: site.brandName })} ${fill(c.support, { email: site.supportEmail })}</p>
  </footer>
  ${input.preview ? `<div class="watermark"><span>${esc(t.map.draftWatermark)}</span></div>` : ''}
</div>`;

  const css = readFileSync(join(HERE, '../shared/base.css'), 'utf8') + readFileSync(join(HERE, '../map/map.css'), 'utf8') + readFileSync(join(HERE, 'credits.css'), 'utf8');
  return htmlDocument(input.title, body, css);
}
