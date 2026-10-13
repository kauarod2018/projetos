import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tableFromNumbers } from '../../lib/checks.ts';
import type { LoadedBonus, LoadedNiche } from '../../lib/content.ts';
import { icon } from '../../lib/icons.ts';
import type { BonusBlock } from '../../schemas/bonus.ts';
import { brandName, type NumberItem, type Sign, type Site } from '../../schemas/content.ts';
import type { KeyFact } from '../../schemas/map.ts';
import { brandLockup } from '../shared/brand.ts';
import { esc, fill, pad2 } from '../shared/html.ts';
import { htmlDocument } from '../map/render.ts';
import { renderTable, signCell } from '../visuals/basic.ts';

const HERE = import.meta.dirname;
export const BRAND_GREEN = '#0B6E4F';

export interface PlanMap {
  code: string;
  title: string;
}

export interface BonusContext {
  /** maps the plan and the index are built from (verified maps, or the planned inventory in a preview) */
  maps: PlanMap[];
  /** numbers.json items to print (verified ones, or all in a preview) */
  numbers: NumberItem[];
  preview: boolean;
  signFile: (s: Sign) => string | undefined;
}

export const bonusCss = () =>
  ['../shared/base.css', '../map/map.css', 'bonus.css'].map((f) => readFileSync(join(HERE, f), 'utf8')).join('\n');

const JURISDICTION: Record<string, string> = {
  'great-britain': 'Great Britain',
  england: 'England',
  wales: 'Wales',
  scotland: 'Scotland',
  'england-and-wales': 'England & Wales',
};

function fact(f: KeyFact, law: string) {
  return typeof f === 'string'
    ? `<li>${esc(f)}</li>`
    : `<li class="law"><span class="law-badge">${esc(law)}</span><span>${esc(f.text)}</span></li>`;
}

const head = (iconName: string, title: string) =>
  `<div class="block-head"><span class="tag">${icon(iconName, 11, 2.4)}${esc(title)}</span></div>`;

/** Splits the maps over the days: study days, a review day every 7th day, a practice test and a final check. */
export function revisionPlan(maps: PlanMap[], days: number) {
  const special = new Map<number, 'review' | 'practice' | 'final'>();
  for (let d = 7; d < days - 1; d += 7) special.set(d, 'review');
  special.set(days - 1, 'practice');
  special.set(days, 'final');
  const studyDays = Array.from({ length: days }, (_, i) => i + 1).filter((d) => !special.has(d));
  const perDay = studyDays.map((_, i) => Math.floor(maps.length / studyDays.length) + (i < maps.length % studyDays.length ? 1 : 0));
  const plan: { day: number; kind: 'study' | 'review' | 'practice' | 'final'; maps: PlanMap[]; from?: string; to?: string }[] = [];
  let next = 0;
  let sinceReview: PlanMap[] = [];
  for (let day = 1; day <= days; day++) {
    const kind = special.get(day) ?? 'study';
    if (kind === 'study') {
      const count = perDay[studyDays.indexOf(day)];
      const todays = maps.slice(next, next + count);
      next += count;
      sinceReview.push(...todays);
      plan.push({ day, kind, maps: todays });
    } else if (kind === 'review') {
      plan.push({ day, kind, maps: [], from: sinceReview[0]?.code, to: sinceReview.at(-1)?.code });
      sinceReview = [];
    } else {
      plan.push({ day, kind, maps: [] });
    }
  }
  return plan;
}

function renderBlock(b: BonusBlock, n: LoadedNiche, ctx: BonusContext): string {
  const t = n.i18n;
  const span = b.span === 1 ? ' half' : '';
  switch (b.type) {
    case 'lead':
      return `<p class="lead bn-lead${span}">${esc(b.text)}</p>`;
    case 'stat-row':
      return `<div class="stat-row${span}" style="--n:${b.items.length}">${b.items
        .map((s) => `<div class="stat"><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`)
        .join('')}</div>`;
    case 'facts':
      return `<section class="block facts${span}">${head('list-checks', b.title)}<ul>${b.items.map((f) => fact(f, t.map.law)).join('')}</ul></section>`;
    case 'steps':
      return `<section class="block${span}">${head('route', b.title)}<div class="steps">${b.items
        .map((s) => `<div class="step"><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div>`)
        .join('')}</div></section>`;
    case 'callout':
      return `<aside class="callout ${b.tone}${span}">${icon(b.tone === 'tip' ? 'lightbulb' : 'triangle-alert', 16, 2.2)}<div><h3>${esc(
        b.title,
      )}</h3><p>${esc(b.text)}</p></div></aside>`;
    case 'checklist':
      return `<section class="block${span}">${head('clipboard-check', b.title)}<ul class="checklist">${b.items
        .map((i) => `<li><i></i><span>${esc(i)}</span></li>`)
        .join('')}</ul></section>`;
    case 'table': {
      const data = b.data ?? tableFromNumbers(n, b.numbersKey!)!;
      return `<section class="block${span}">${head('table', b.title)}${renderTable(data)}</section>`;
    }
    case 'scoring-window':
      return `<section class="block${span}">${head('timer', b.title)}${scoringWindow(b.labels)}</section>`;
    case 'sign-pairs':
      return `<section class="block${span}">${head('arrow-left-right', b.title)}<div class="pairs">${b.pairs
        .map((p) => {
          const a = n.signs.signs.find((s) => s.id === p.a)!;
          const c = n.signs.signs.find((s) => s.id === p.b)!;
          return `<div class="pair">${signCell(a, ctx.signFile(a))}<span class="vs-mid">${esc(t.map.vs)}</span>${signCell(c, ctx.signFile(c))}<p>${esc(
            p.tell,
          )}</p></div>`;
        })
        .join('')}</div></section>`;
    case 'numbers-table':
      return `<section class="block${span}">${head('hash', b.title)}<table class="tb numbers"><tbody>${ctx.numbers
        .map(
          (i) =>
            `<tr><th>${esc(i.label)}${i.jurisdiction === 'great-britain' ? '' : ` <em>${esc(JURISDICTION[i.jurisdiction])}</em>`}</th><td>${esc(i.value)}</td></tr>`,
        )
        .join('')}</tbody></table></section>`;
    case 'revision-plan': {
      const plan = revisionPlan(ctx.maps, b.days);
      const label = { study: t.bonus.study, review: t.bonus.review, practice: t.bonus.practice, final: t.bonus.final };
      const cards = plan
        .map((d) => {
          let body = '';
          if (d.kind === 'study') body = d.maps.map((m) => `<span class="code">${esc(m.code)}</span>`).join('');
          else if (d.kind === 'review') body = d.from ? `<p>${fill(t.bonus.reviewTask, { from: d.from, to: d.to ?? d.from })}</p>` : '';
          else body = `<p>${esc(d.kind === 'practice' ? t.bonus.practiceTask : t.bonus.finalTask)}</p>`;
          return `<div class="day ${d.kind}"><div class="day-head"><b>${fill(t.bonus.day, { day: d.day })}</b><span>${esc(label[d.kind])}</span></div>${body}</div>`;
        })
        .join('');
      return `<section class="block${span}">${head('calendar-days', b.title)}<div class="plan">${cards}</div></section>`;
    }
    case 'map-index':
      return `<section class="block${span}">${head('list', b.title)}<ol class="map-index">${ctx.maps
        .map((m) => `<li><span class="code">${esc(m.code)}</span>${esc(m.title)}</li>`)
        .join('')}</ol></section>`;
  }
}

function scoringWindow(l: { before: string; start: string; end: string; after: string }): string {
  const seg = [5, 4, 3, 2, 1]
    .map((p, i) => `<div class="sw-seg${p <= 2 ? ' light' : ''}" style="--k:${(5 - i) / 5}"><b>${p}</b></div>`)
    .join('');
  return `<div class="sw">
    <div class="sw-bar"><div class="sw-off">0</div>${seg}<div class="sw-off">0</div></div>
    <div class="sw-labels"><span>${esc(l.before)}</span><span class="sw-start">${esc(l.start)}</span><span class="sw-end">${esc(l.end)}</span><span>${esc(l.after)}</span></div>
  </div>`;
}

export function renderBonusDocument(n: LoadedNiche, b: LoadedBonus, site: Site, ctx: BonusContext): string {
  const t = n.i18n;
  const d = b.data;
  const brand = brandName(site, n.niche.language);
  const draft = ctx.preview || d.review.status !== 'verified';
  const pages = d.pages.map((page, i) => {
    const last = i === d.pages.length - 1;
    const status = draft
      ? `<span class="draft">${esc(t.map.draftFooter)}</span>`
      : `<span>${fill(t.map.version, { version: n.niche.content.version })}</span>`;
    return `<div class="page bn" style="--area:${BRAND_GREEN}">
  <header class="bn-band">
    <span class="bn-num">${esc(t.bonus.label)} ${pad2(d.number)}</span>
    <span class="bn-title">${esc(d.title)}</span>
    <span class="bn-brand">${brandLockup(brand, 13)}</span>
  </header>
  <main class="bn-main">
    <h1>${esc(page.heading)}</h1>
    <div class="bn-grid">${page.blocks.map((block) => renderBlock(block, n, ctx)).join('')}</div>
  </main>
  <footer class="foot">
    ${last ? `<div class="sources"><span class="tag">${icon('book-open', 10, 2.4)}${esc(t.blocks.sources)}</span><span>${d.sources.map((s) => `${esc(s.doc)}, ${esc(s.ref)}`).join(' · ')}</span></div>` : ''}
    <div class="foot-line"><span class="brand">${esc(brand)} · ${esc(n.niche.examName)}</span><span>${esc(t.bonus.label)} ${d.number} · ${fill(t.bonus.page, {
      page: i + 1,
      pages: d.pages.length,
    })} · ${status}</span></div>
  </footer>
  ${draft ? `<div class="watermark"><span>${esc(t.map.draftWatermark)}</span></div>` : ''}
</div>`;
  });
  return htmlDocument(d.title, pages.join('\n'), bonusCss());
}
