/**
 * Shop filters live in the home page URL (/?q=…&country=…&cat=…#shop), so a search from any page
 * lands on the filtered shop and a filtered shop can be shared. On the home page the header search
 * and the catalogue talk through a window event instead of reloading the page.
 */
export interface ShopFilter {
  q: string;
  /** ISO country code, lower case ("gb") */
  country: string;
  /** category slug */
  cat: string;
}

export const EMPTY_FILTER: ShopFilter = { q: '', country: '', cat: '' };
const EVENT = 'shop:filter';

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** lower case, no accents: "Côte" and "cote" match */
export const normalise = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

export function readFilter(): ShopFilter {
  const p = new URLSearchParams(window.location.search);
  return { q: p.get('q') ?? '', country: p.get('country') ?? '', cat: p.get('cat') ?? '' };
}

export function filterUrl(f: ShopFilter): string {
  const p = new URLSearchParams();
  if (f.q.trim()) p.set('q', f.q.trim());
  if (f.country) p.set('country', f.country);
  if (f.cat) p.set('cat', f.cat);
  const query = p.toString();
  return `/${query ? `?${query}` : ''}#shop`;
}

const onShopPage = () => window.location.pathname === '/' && document.getElementById('shop') !== null;

/** apply a filter: on the shop page it updates the list in place, anywhere else it opens the shop */
export function applyFilter(f: ShopFilter, { scroll = true } = {}) {
  if (!onShopPage()) {
    window.location.href = filterUrl(f);
    return;
  }
  window.history.replaceState(null, '', filterUrl(f));
  window.dispatchEvent(new CustomEvent<ShopFilter>(EVENT, { detail: f }));
  if (scroll) document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function onFilter(handler: (f: ShopFilter) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<ShopFilter>).detail);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}

/** every word of the query must appear somewhere in the product's text */
export function matches(f: ShopFilter, item: { searchText: string; country: string; cat: string }): boolean {
  if (f.country && item.country !== f.country) return false;
  if (f.cat && item.cat !== f.cat) return false;
  const words = normalise(f.q).split(/\s+/).filter(Boolean);
  return words.every((w) => item.searchText.includes(w));
}
