import { esc } from './html.ts';

/** the logo's gold; the page outline takes the text colour of wherever the lockup sits */
const GOLD = '#c9a23f';
const TICK = 'M285 578L331 546L397 620C470 528 600 410 747 365C650 408 495 565 398 716Z';
let uid = 0;

/** The HelpTest lockup for PDFs and images: page-with-tick mark + "Help" + gold "Test" (same drawing as the site logo). */
export function brandLockup(brand: string, heightPx: number): string {
  const id = `bm${uid++}`;
  const w = (heightPx * 550) / 488;
  const i = brand.search(/test/i);
  const word = i > 0 ? `${esc(brand.slice(0, i))}<span style="color:${GOLD}">${esc(brand.slice(i))}</span>` : esc(brand);
  return `<span class="brand-lockup" style="display:inline-flex;align-items:center;gap:${Math.round(heightPx * 0.3)}px;font-family:'Montserrat',sans-serif;font-weight:800;letter-spacing:-0.01em;line-height:1">
<svg viewBox="200 314 550 488" width="${w.toFixed(1)}" height="${heightPx}" aria-hidden="true"><defs><mask id="${id}" maskUnits="userSpaceOnUse" x="196" y="310" width="560" height="500"><rect x="196" y="310" width="560" height="500" fill="#fff"/><path d="${TICK}" fill="#000" stroke="#000" stroke-width="44" stroke-linejoin="round"/></mask></defs><g fill="none" stroke="currentColor" stroke-width="33" mask="url(#${id})"><path d="M219.5 781.5V333.5H458L554.5 430V781.5Z"/><path d="M454.5 350V431.5H540"/></g><path d="${TICK}" fill="${GOLD}"/></svg><span>${word}</span></span>`;
}
