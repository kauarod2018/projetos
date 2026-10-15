'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { applyFilter, EMPTY_FILTER, matches, onFilter, readFilter, type ShopFilter } from '../shopFilter.ts';

export interface CatalogItem {
  id: string;
  cat: string;
  country: string;
  /** product name, exam, category, country and keywords, already normalised */
  searchText: string;
  card: ReactNode;
}

interface Props {
  items: CatalogItem[];
  categories: { slug: string; name: string }[];
  countries: { code: string; name: string; flag: string }[];
  labels: { allCategories: string; countOne: string; countMany: string; resultsTitle: string; clear: string; noResultsTitle: string; noResultsText: string };
  /** last tile of the shop (suggest an exam) */
  tail: ReactNode;
}

const count = (n: number, l: Props['labels']) => (n === 1 ? l.countOne : l.countMany).replace('{n}', String(n));

/** The shop: category chips, active filters, then one shelf per category. */
export function Catalog({ items, categories, countries, labels, tail }: Props) {
  const [f, setF] = useState<ShopFilter>(EMPTY_FILTER);
  useEffect(() => {
    setF(readFilter());
    return onFilter(setF);
  }, []);

  const shown = items.filter((i) => matches(f, i));
  const shelves = categories.map((c) => ({ ...c, items: shown.filter((i) => i.cat === c.slug) })).filter((c) => c.items.length);
  const filtered = Boolean(f.q.trim() || f.country || f.cat);
  // while every category holds only one or two guides, one grid reads better than near-empty shelves
  const oneGrid = shelves.length > 0 && shelves.every((s) => s.items.length < 3);
  const set = (next: Partial<ShopFilter>) => applyFilter({ ...f, ...next }, { scroll: false });
  const country = countries.find((c) => c.code === f.country);

  return (
    <div className="catalog">
      <div className="chips" role="group" aria-label={labels.allCategories}>
        {[{ slug: '', name: labels.allCategories }, ...categories].map((c) => {
          const n = items.filter((i) => matches({ ...f, cat: c.slug }, i)).length;
          return (
            <button key={c.slug || 'all'} type="button" className={`chip${f.cat === c.slug ? ' is-active' : ''}`} aria-pressed={f.cat === c.slug} onClick={() => set({ cat: c.slug })}>
              {c.name}
              <span className="chip-count">{n}</span>
            </button>
          );
        })}
      </div>

      {filtered ? (
        <div className="filters" aria-live="polite">
          <strong>
            {labels.resultsTitle}: {count(shown.length, labels)}
          </strong>
          {f.q.trim() ? (
            <button type="button" className="filter-tag" onClick={() => set({ q: '' })}>
              “{f.q.trim()}” <span aria-hidden="true">×</span>
            </button>
          ) : null}
          {country ? (
            <button type="button" className="filter-tag" onClick={() => set({ country: '' })}>
              <img src={country.flag} alt="" width={16} height={12} /> {country.name} <span aria-hidden="true">×</span>
            </button>
          ) : null}
          <button type="button" className="linklike" onClick={() => set(EMPTY_FILTER)}>
            {labels.clear}
          </button>
        </div>
      ) : null}

      {oneGrid ? (
        <ul className="pgrid">
          {shelves.flatMap((s) => s.items).map((it) => (
            <li key={it.id}>{it.card}</li>
          ))}
          <li>{tail}</li>
        </ul>
      ) : null}

      {(oneGrid ? [] : shelves).map((s, i) => (
        <section className="shelf" key={s.slug} aria-labelledby={`shelf-${s.slug}`}>
          <header className="shelf-head">
            <h3 id={`shelf-${s.slug}`}>{s.name}</h3>
            <span>{count(s.items.length, labels)}</span>
          </header>
          <ul className="pgrid">
            {s.items.map((it) => (
              <li key={it.id}>{it.card}</li>
            ))}
            {i === shelves.length - 1 ? <li>{tail}</li> : null}
          </ul>
        </section>
      ))}

      {shelves.length === 0 ? (
        <div className="empty">
          <h3>{labels.noResultsTitle}</h3>
          <p>{labels.noResultsText}</p>
          <ul className="pgrid">
            <li>{tail}</li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}
