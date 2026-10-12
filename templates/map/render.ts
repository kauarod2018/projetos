import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { barData, mapCode, tableDataOf } from '../../lib/checks.ts';
import type { LoadedMap, LoadedNiche } from '../../lib/content.ts';
import { icon } from '../../lib/icons.ts';
import { brandName, type Site } from '../../schemas/content.ts';
import type { KeyFact } from '../../schemas/map.ts';
import { fontFaceCss } from '../shared/fonts.ts';
import { esc, fill, formatDate, pad2 } from '../shared/html.ts';
import { renderBarScale, renderSignGrid, renderTable } from '../visuals/basic.ts';
import { renderRoundabout } from '../visuals/roundabout.ts';

const HERE = import.meta.dirname;
const css = () => readFileSync(join(HERE, '../shared/base.css'), 'utf8') + readFileSync(join(HERE, 'map.css'), 'utf8');

/** official sign files are embedded as data URIs so the page needs no file access */
function signDataUri(n: LoadedNiche, file: string): string {
  const buf = readFileSync(join(n.signsDir, file));
  const type = file.endsWith('.svg') ? 'image/svg+xml' : file.endsWith('.png') ? 'image/png' : 'image/jpeg';
  return `data:${type};base64,${buf.toString('base64')}`;
}

export function htmlDocument(title: string, body: string, styles: string): string {
  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<style>${fontFaceCss()}\n${styles}</style>
</head>
<body>${body}</body>
</html>`;
}

function renderFact(f: KeyFact, lawLabel: string): string {
  if (typeof f === 'string') return `<li>${esc(f)}</li>`;
  return `<li class="law"><span class="law-badge">${esc(lawLabel)}</span><span>${esc(f.text)}</span></li>`;
}

export function renderMapPage(n: LoadedNiche, m: LoadedMap, site: Site): string {
  const t = n.i18n;
  const d = m.data;
  const areaIndex = n.niche.areas.findIndex((a) => a.slug === d.area);
  const area = n.niche.areas[areaIndex];
  const code = mapCode(n, m);
  const draft = d.review.status !== 'verified';
  const v = d.visual;

  let visualBody = '';
  let pending = false;
  if (v.type === 'sign-grid') {
    pending = v.signs.some((id) => n.signs.signs.find((s) => s.id === id)?.status !== 'official');
    visualBody = renderSignGrid(v.signs, n.signs.signs, (s) => (s.file ? signDataUri(n, s.file) : undefined));
  } else if (v.type === 'bar-scale') {
    visualBody = renderBarScale(barData(n, m)!, t);
  } else if (v.type === 'road-diagram') {
    visualBody = renderRoundabout(v, n.niche.drivingSide, t, area.colour);
  } else {
    visualBody = renderTable(tableDataOf(n, m)!);
  }

  const questions = d.onTheTest
    .map(
      (q, qi) => `<div class="q">
        <div class="q-text"><span class="q-num">Q${qi + 1}</span><span>${esc(q.question)}</span></div>
        <div class="opts">${q.options
          .map(
            (o, i) =>
              `<div class="opt${i === q.answerIndex ? ' correct' : ''}"><b>${'ABCD'[i]}</b><span>${esc(o)}</span>${
                i === q.answerIndex ? icon('check', 11, 3) : ''
              }</div>`,
          )
          .join('')}</div>
        <div class="why"><strong>${esc(t.map.why)}:</strong> ${esc(q.why)}</div>
      </div>`,
    )
    .join('');

  const jurisdiction = d.jurisdictionNotes
    .map((j) => `<p class="jurisdiction"><strong>${fill(t.map.jurisdictionNote, { place: titleCase(j.jurisdiction) })}:</strong> ${esc(j.text)}</p>`)
    .join('');

  const footRight = draft
    ? `<span class="draft">${esc(t.map.code)} ${code} · ${fill(t.map.version, { version: n.niche.content.version })} · ${esc(t.map.draftFooter)}</span>`
    : `<span>${esc(t.map.code)} ${code} · ${fill(t.map.version, { version: n.niche.content.version })} · ${fill(t.map.checkedAgainst, {
        source: n.niche.primarySource,
        date: formatDate(d.review.checkedOn!, n.niche.language),
      })}</span>`;

  const body = `<div class="page" style="--area:${area.colour}" data-map="${esc(d.id)}">
  <header class="band">
    <span class="band-num">${pad2(areaIndex + 1)}</span>
    <span class="band-area">${icon(area.icon, 15, 2.2)}${esc(area.name)}</span>
    <span class="band-code">${esc(t.map.code)} ${code}</span>
  </header>
  <main class="content">
    <section class="intro">
      <h1>${esc(d.title)}</h1>
      <p class="lead"><span class="tag">${icon('info', 11, 2.4)}${esc(t.blocks.whatItIs)}</span>${esc(d.whatItIs)}</p>
    </section>
    <section class="visual" data-fit>
      <div class="block-head"><span class="tag">${esc(v.caption)}</span>${pending ? `<span class="pending">${esc(t.map.signPending)}</span>` : ''}</div>
      <div class="visual-body">${visualBody}</div>
    </section>
    <div class="row">
      <section class="block facts" data-fit>
        <div class="block-head"><span class="tag">${icon('list-checks', 11, 2.4)}${esc(t.blocks.keyFacts)}</span></div>
        <ul>${d.keyFacts.map((f) => renderFact(f, t.map.law)).join('')}</ul>
        ${jurisdiction}
      </section>
      <section class="block confused" data-fit>
        <div class="block-head"><span class="tag">${icon('arrow-left-right', 11, 2.4)}${esc(t.blocks.confused)}</span></div>
        <div class="vs-grid">
          <div class="vs-card"><h3>${esc(d.confused.a.label)}</h3><ul>${d.confused.a.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul></div>
          <div class="vs-mid">${esc(t.map.vs)}</div>
          <div class="vs-card"><h3>${esc(d.confused.b.label)}</h3><ul>${d.confused.b.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul></div>
        </div>
      </section>
    </div>
    <div class="row test-row">
      <section class="block test" data-fit>
        <div class="block-head"><span class="tag">${icon('clipboard-check', 11, 2.4)}${esc(t.blocks.onTheTest)}</span></div>
        <div class="qs" style="--qcount:${d.onTheTest.length}">${questions}</div>
      </section>
      <section class="block traps" data-fit>
        <div class="block-head"><span class="tag">${icon('eye', 11, 2.4)}${esc(t.blocks.traps)}</span></div>
        <ul>${d.traps.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      </section>
    </div>
  </main>
  <footer class="foot">
    <div class="sources"><span class="tag">${icon('book-open', 10, 2.4)}${esc(t.blocks.sources)}</span><span>${d.sources
      .map((s) => `${esc(s.doc)}, ${esc(s.ref)}`)
      .join(' · ')}</span></div>
    <div class="foot-line"><span class="brand">${esc(brandName(site, n.niche.language))}</span>${footRight}</div>
  </footer>
  ${draft ? `<div class="watermark"><span>${esc(t.map.draftWatermark)}</span></div>` : ''}
</div>`;

  return htmlDocument(`${d.title} · ${code}`, body, css());
}

const titleCase = (s: string) => s.split('-').map((w) => (w === 'and' ? w : w[0].toUpperCase() + w.slice(1))).join(' ');
