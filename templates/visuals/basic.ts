import type { I18n, Sign } from '../../schemas/content.ts';
import type { BarScaleData, TableData } from '../../schemas/map.ts';
import { esc } from '../shared/html.ts';

/** Horizontal stacked bars drawn to scale (e.g. thinking + braking distance). */
export function renderBarScale(data: BarScaleData, t: I18n): string {
  const max = Math.max(...data.rows.map((r) => r.total));
  const step = niceStep(max);
  const axisMax = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: axisMax / step + 1 }, (_, i) => i * step);
  const pct = (n: number) => `${((n / axisMax) * 100).toFixed(3)}%`;

  const legend = data.segments
    .map((s, i) => `<span class="bs-key"><i class="bs-swatch seg-${i}"></i>${esc(t.segments[s] ?? s)}</span>`)
    .join('');

  const rows = data.rows
    .map((r) => {
      const segs = r.values
        .map((v, i) => {
          const show = v / axisMax >= 0.055;
          return `<span class="bs-seg seg-${i}" style="width:${pct(v)}">${show ? `${v}` : ''}</span>`;
        })
        .join('');
      const feet = r.totalFeet ? `<small>${r.totalFeet} ft</small>` : '';
      return `<div class="bs-row"><div class="bs-label">${esc(r.label)}</div><div class="bs-track">${segs}<span class="bs-total">${r.total} ${esc(
        data.unit,
      )}${feet}</span></div></div>`;
    })
    .join('');

  const grid = ticks
    .map((tk, i) => `<span class="bs-tick" style="left:${pct(tk)}"><em>${tk}${i === ticks.length - 1 ? ` ${esc(data.unit)}` : ''}</em></span>`)
    .join('');

  return `<div class="bs">
    <div class="bs-legend">${legend}</div>
    <div class="bs-body"><div class="bs-grid">${grid}</div>${rows}</div>
  </div>`;
}

function niceStep(max: number): number {
  const raw = max / 5;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const n = raw / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}

/**
 * Grid of road signs. Official images only: a sign without its official file shows just the empty
 * outline of its shape (never a hand-drawn symbol) and the visual gets an "official image pending" tag.
 */
export function renderSignGrid(ids: string[], signs: Sign[], signFile: (s: Sign) => string | undefined): string {
  const cells = ids
    .map((id) => {
      const sign = signs.find((s) => s.id === id)!;
      return signCell(sign, signFile(sign));
    })
    .join('');
  return `<div class="sg" style="--cols:${Math.min(5, ids.length)}">${cells}</div>`;
}

/** one sign with its caption: the official image, or only the empty outline of its shape */
export function signCell(sign: Sign, src: string | undefined, caption = true): string {
  const img = sign.status === 'official' && src ? `<img src="${src}" alt="${esc(sign.meaning)}">` : shapeOutline(sign.shape);
  return `<figure class="sg-cell"><div class="sg-img">${img}</div>${caption ? `<figcaption>${esc(sign.meaning)}</figcaption>` : ''}</figure>`;
}

function shapeOutline(shape: Sign['shape']): string {
  const common = 'fill="none" stroke="#9AA1AD" stroke-width="3" stroke-dasharray="7 5" stroke-linejoin="round"';
  const shapes: Record<Sign['shape'], string> = {
    triangle: `<path d="M50 8 L94 88 H6 Z" ${common}/>`,
    'inverted-triangle': `<path d="M6 12 H94 L50 92 Z" ${common}/>`,
    circle: `<circle cx="50" cy="50" r="42" ${common}/>`,
    octagon: `<path d="M33 8 H67 L92 33 V67 L67 92 H33 L8 67 V33 Z" ${common}/>`,
    rectangle: `<rect x="8" y="22" width="84" height="56" rx="6" ${common}/>`,
  };
  return `<svg viewBox="0 0 100 100" aria-hidden="true">${shapes[shape]}</svg>`;
}

export function renderTable(data: TableData): string {
  const notes = data.notes.length ? `<ul class="tb-notes">${data.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : '';
  return `<table class="tb"><thead><tr>${data.columns.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${data.rows
    .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`)
    .join('')}</tbody></table>${notes}`;
}
