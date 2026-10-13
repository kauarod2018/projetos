import type { LoadedBonus, LoadedNiche } from '../../lib/content.ts';
import { brandName, type NumberItem, type Sign, type Site } from '../../schemas/content.ts';
import { esc } from '../shared/html.ts';
import { htmlDocument } from '../map/render.ts';
import { signCell } from '../visuals/basic.ts';
import { bonusCss, themeStyle, type BonusContext } from './render.ts';

interface Card {
  kind: string;
  front: string;
  back: string;
}

const JURISDICTION: Record<string, string> = {
  england: 'England',
  wales: 'Wales',
  scotland: 'Scotland',
  'england-and-wales': 'England & Wales',
};

const CATEGORY: Record<Sign['category'], string> = {
  warning: 'Warning sign',
  regulatory: 'Sign giving orders',
  information: 'Information sign',
  direction: 'Direction sign',
  'road-marking': 'Road marking',
};

export function flashcardList(n: LoadedNiche, b: LoadedBonus, ctx: BonusContext): Card[] {
  const t = n.i18n.bonus;
  const cards: Card[] = [];
  if (b.data.flashcards?.signs) {
    const only = b.data.flashcards.signIds;
    const signs = n.signs.signs.filter((s) => (ctx.preview || s.status === 'official') && (!only || only.includes(s.id)));
    for (const s of signs) {
      cards.push({
        kind: t.cardSign,
        front: signCell(s, ctx.signFile(s), false),
        back: `<div class="card-a">${esc(s.meaning)}</div><div class="card-sub">${esc(CATEGORY[s.category])}</div>`,
      });
    }
  }
  if (b.data.flashcards?.numbers) {
    for (const item of ctx.numbers) cards.push(numberCard(item, t.cardNumber));
  }
  return cards;
}

function numberCard(item: NumberItem, kind: string): Card {
  const where = JURISDICTION[item.jurisdiction];
  return {
    kind,
    front: `<div class="card-q">${esc(item.label)}${where ? `<br><span class="hint">${esc(where)}</span>` : ''}</div>`,
    back: `<div class="card-a">${esc(item.value)}</div>`,
  };
}

const PER_SHEET = 8;
const COLS = 2;

/**
 * Double-sided A4 sheets: a page of fronts followed by a page of backs. On the backs each row is
 * mirrored, so after flipping on the long edge every back lands behind its front.
 */
export function renderFlashcardsA4(n: LoadedNiche, b: LoadedBonus, site: Site, ctx: BonusContext): string {
  const t = n.i18n.bonus;
  const brand = brandName(site, n.niche.language);
  const draft = ctx.preview || b.data.review.status !== 'verified';
  const cards = flashcardList(n, b, ctx);
  const pages: string[] = [];
  for (let start = 0; start < cards.length; start += PER_SHEET) {
    const sheet = cards.slice(start, start + PER_SHEET);
    const slots = Array.from({ length: PER_SHEET }, (_, i) => sheet[i]);
    const fronts = slots.map((c) => cell(c, 'front', brand, t.answer));
    const backs = slots.map((_, i) => {
      const row = Math.floor(i / COLS);
      const col = i % COLS;
      return cell(slots[row * COLS + (COLS - 1 - col)], 'back', brand, t.answer);
    });
    const sheetNo = start / PER_SHEET + 1;
    const sheets = Math.ceil(cards.length / PER_SHEET);
    for (const [side, html, note] of [
      ['front', fronts, t.flashcardsFront],
      ['back', backs, t.flashcardsBack],
    ] as const) {
      pages.push(`<div class="page fc" style="${themeStyle(n)}" data-side="${side}">
  <div class="fc-sheet">
    <div class="fc-note"><span>${esc(note)}</span><span>${esc(brand)} · ${sheetNo}/${sheets}</span></div>
    <div class="fc-grid">${html.join('')}</div>
  </div>
  ${draft ? `<div class="watermark"><span>${esc(n.i18n.map.draftWatermark)}</span></div>` : ''}
</div>`);
    }
  }
  return htmlDocument(b.data.title, pages.join('\n'), bonusCss());
}

function cell(c: Card | undefined, side: 'front' | 'back', brand: string, answer: string) {
  if (!c) return '<div class="card empty"></div>';
  return `<div class="card"><span class="card-kind">${esc(side === 'front' ? c.kind : answer)}</span>${side === 'front' ? c.front : c.back}<span class="card-brand">${esc(brand)}</span></div>`;
}

/** Phone edition: one card per screen, front then back. */
export function renderFlashcardsPhone(n: LoadedNiche, b: LoadedBonus, site: Site, ctx: BonusContext): string {
  const brand = brandName(site, n.niche.language);
  const draft = ctx.preview || b.data.review.status !== 'verified';
  const cards = flashcardList(n, b, ctx);
  const pages = cards.flatMap((c, i) =>
    (['front', 'back'] as const).map(
      (side) => `<div class="page phone" style="${themeStyle(n)}">
  <div class="phone-bar"><span>${esc(brand)}</span><span>${i + 1}/${cards.length} · ${side === 'front' ? 'Q' : 'A'}</span></div>
  <div class="card"><span class="card-kind">${esc(side === 'front' ? c.kind : n.i18n.bonus.answer)}</span>${side === 'front' ? c.front : c.back}</div>
  ${draft ? `<div class="watermark"><span>${esc(n.i18n.map.draftWatermark)}</span></div>` : ''}
</div>`,
    ),
  );
  const css = `${bonusCss()}\n@page { size: 90mm 160mm; margin: 0; }\n.page.phone .watermark span { font-size: 60pt; }`;
  return htmlDocument(`${b.data.title} (phone)`, pages.join('\n'), css);
}
