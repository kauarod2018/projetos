import { icon } from '../../lib/icons.ts';
import type { Visual } from '../../schemas/map.ts';
import { esc } from '../shared/html.ts';

type Of<T extends Visual['type']> = Extract<Visual, { type: T }>;

const law = (on: boolean, label: string) => (on ? `<span class="law-badge">${esc(label)}</span>` : '');

/** grid of cards, each with an icon or a colour swatch */
export function renderCards(v: Of<'cards'>, lawLabel: string): string {
  const items = v.items
    .map((c) => {
      const mark = c.swatch
        ? `<span class="cd-swatch" style="background:${c.swatch}"></span>`
        : `<span class="cd-icon">${icon(c.icon ?? 'circle', 15, 2.2)}</span>`;
      return `<div class="cd">${mark}<div><h3>${esc(c.title)} ${law(c.law, lawLabel)}</h3><p>${esc(c.text)}</p></div></div>`;
    })
    .join('');
  return `<div class="cds" style="--cols:${v.columns}">${items}</div>`;
}

/** numbered steps in order, with arrows between them */
export function renderSteps(v: Of<'steps'>): string {
  const perRow = v.items.length <= 4 ? v.items.length : 3;
  const items = v.items
    .map(
      (s, i) => `<div class="st">
        <div class="st-head"><span class="st-num">${i + 1}</span>${i < v.items.length - 1 && (i + 1) % perRow !== 0 ? `<span class="st-arrow">${icon('arrow-right', 14, 2.4)}</span>` : ''}</div>
        <h3>${esc(s.title)}</h3><p>${esc(s.text)}</p>
      </div>`,
    )
    .join('');
  return `<div class="sts" style="--cols:${perRow}">${items}</div>`;
}

/** big figures */
export function renderStats(v: Of<'stats'>): string {
  // long figures ("Dutch reach") would wrap at full size, so the whole row steps down together
  const long = v.items.some((s) => s.value.length > 8);
  return `<div class="sx${long ? ' long' : ''}" style="--n:${v.items.length}">${v.items
    .map((s) => `<div class="sx-item"><b>${esc(s.value)}</b><span>${esc(s.label)}</span>${s.note ? `<small>${esc(s.note)}</small>` : ''}</div>`)
    .join('')}</div>`;
}

const LAMP = { red: '#DC2626', amber: '#F59E0B', green: '#16A34A' } as const;

/** traffic light housings with the lit lamps */
export function renderLights(v: Of<'light-sequence'>): string {
  const housing = (lit: string[]) => {
    const lamp = (colour: keyof typeof LAMP, cy: number) =>
      `<circle cx="20" cy="${cy}" r="11" fill="${lit.includes(colour) ? LAMP[colour] : '#3A3F47'}" ${lit.includes(colour) ? 'stroke="#fff" stroke-width="1.5"' : ''}/>`;
    return `<svg viewBox="0 0 40 92" width="40" height="92" aria-hidden="true"><rect x="2" y="2" width="36" height="88" rx="9" fill="#1F2329"/>${lamp('red', 19)}${lamp('amber', 46)}${lamp('green', 73)}</svg>`;
  };
  return `<div class="ls" style="--n:${v.items.length}">${v.items
    .map((s, i) => `<div class="ls-item">${housing(s.lamps)}<div><span class="ls-step">${i + 1}</span><h3>${esc(s.label)}</h3><p>${esc(s.meaning)}</p></div></div>`)
    .join('')}</div>`;
}

/**
 * Schematic road markings on a short piece of road seen from above. You drive from left to right in the
 * upper lane (traffic keeps left), so "the line nearest you" is the upper one of a pair.
 */
export function renderMarkings(v: Of<'markings'>, lawLabel: string): string {
  return `<div class="mk" style="--cols:${v.items.length <= 3 ? 1 : 2}">${v.items
    .map((m) => `<div class="mk-item">${markingSvg(m.pattern)}<div><h3>${esc(m.label)} ${law(m.law, lawLabel)}</h3><p>${esc(m.meaning)}</p></div></div>`)
    .join('')}</div>`;
}

const W = 240;
const H = 64;
const ROAD = '#4B5563';
const WHITE = '#F8FAFC';
const YELLOW = '#FACC15';

function dashes(y: number, dash: number, gap: number, width = 3, colour = WHITE) {
  return `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${colour}" stroke-width="${width}" stroke-dasharray="${dash} ${gap}"/>`;
}

function solid(y: number, width = 3, colour = WHITE) {
  return `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${colour}" stroke-width="${width}"/>`;
}

/** small arrow showing your direction of travel in the upper (left-hand) lane */
const you = (x = 18, y = 16) => `<path d="M${x} ${y - 5} L${x + 14} ${y} L${x} ${y + 5} Z" fill="#FBBF24"/>`;

function markingSvg(pattern: string): string {
  const kerb = `<rect x="0" y="0" width="${W}" height="5" fill="#D1D5DB"/>`;
  let body = '';
  switch (pattern) {
    case 'centre-line':
      body = dashes(H / 2, 14, 28) + you();
      break;
    case 'hazard-line':
      body = dashes(H / 2, 36, 10) + you();
      break;
    case 'double-solid':
      body = solid(H / 2 - 4) + solid(H / 2 + 4) + you();
      break;
    case 'double-solid-near':
      body = solid(H / 2 - 4) + dashes(H / 2 + 4, 14, 14) + you();
      break;
    case 'double-broken-near':
      body = dashes(H / 2 - 4, 14, 14) + solid(H / 2 + 4) + you();
      break;
    case 'give-way':
      body =
        dashes(H / 2, 14, 28) +
        `<line x1="196" y1="5" x2="196" y2="${H / 2}" stroke="${WHITE}" stroke-width="3" stroke-dasharray="6 4"/><line x1="203" y1="5" x2="203" y2="${H / 2}" stroke="${WHITE}" stroke-width="3" stroke-dasharray="6 4"/>` +
        you(150);
      break;
    case 'stop-line':
      body = dashes(H / 2, 14, 28) + `<rect x="196" y="5" width="7" height="${H / 2 - 5}" fill="${WHITE}"/>` + you(150);
      break;
    case 'single-yellow':
      body = kerb + solid(10, 3, YELLOW) + you(18, 26);
      break;
    case 'double-yellow':
      body = kerb + solid(9, 2.5, YELLOW) + solid(14, 2.5, YELLOW) + you(18, 28);
      break;
    case 'kerb-single':
    case 'kerb-double': {
      const marks = [40, 120, 200]
        .map((x) => (pattern === 'kerb-single' ? `<rect x="${x}" y="0" width="5" height="9" fill="${YELLOW}"/>` : `<rect x="${x}" y="0" width="4" height="9" fill="${YELLOW}"/><rect x="${x + 8}" y="0" width="4" height="9" fill="${YELLOW}"/>`))
        .join('');
      body = kerb + marks + solid(14, 2.5, YELLOW) + you(18, 30);
      break;
    }
    case 'zigzag': {
      const zig = (y: number) => {
        let d = `M0 ${y}`;
        for (let x = 0; x <= W; x += 16) d += ` L${x + 8} ${y + 6} L${x + 16} ${y}`;
        return `<path d="${d}" fill="none" stroke="${WHITE}" stroke-width="2.5"/>`;
      };
      body = kerb + zig(8) + zig(H / 2 - 3) + you(18, 22);
      break;
    }
    case 'box-junction': {
      let lines = '';
      for (let x = -60; x <= W; x += 16) lines += `<line x1="${x}" y1="6" x2="${x + 56}" y2="${H - 6}" stroke="${YELLOW}" stroke-width="2"/><line x1="${x + 56}" y1="6" x2="${x}" y2="${H - 6}" stroke="${YELLOW}" stroke-width="2"/>`;
      body = `<svg x="60" y="0" width="120" height="${H}" viewBox="60 0 120 ${H}"><rect x="62" y="6" width="116" height="${H - 12}" fill="none" stroke="${YELLOW}" stroke-width="3"/>${lines}</svg>` + you(18, 20);
      break;
    }
    case 'cycle-lane-solid':
    case 'cycle-lane-broken':
      body =
        kerb +
        (pattern === 'cycle-lane-solid' ? solid(27) : dashes(27, 14, 10)) +
        `<g transform="translate(110 7)" color="${WHITE}">${icon('bike', 17, 2)}</g>` +
        you(18, 44);
      break;
    case 'bus-lane':
      body = kerb + solid(24, 6) + `<text x="120" y="18" text-anchor="middle" font-family="Archivo" font-weight="800" font-size="11" fill="${WHITE}">BUS LANE</text>` + you(18, 42);
      break;
  }
  return `<svg class="mk-svg" viewBox="0 0 ${W} ${H}" aria-hidden="true"><rect width="${W}" height="${H}" rx="6" fill="${ROAD}"/>${body}</svg>`;
}
