'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { applyFilter, EMPTY_FILTER, onFilter, readFilter, type ShopFilter } from '../shopFilter.ts';

interface Props {
  labels: { label: string; placeholder: string; button: string; country: string; allCountries: string };
  countries: { code: string; name: string; flag: string }[];
}

/** Header search: country picker + text field. Typing filters the shop live; elsewhere it opens the shop. */
export function SearchBar({ labels, countries }: Props) {
  const [f, setF] = useState<ShopFilter>(EMPTY_FILTER);
  useEffect(() => {
    setF(readFilter());
    return onFilter(setF);
  }, []);

  const live = (next: ShopFilter) => {
    setF(next);
    // only live-update on the shop page; on other pages wait for the submit
    if (window.location.pathname === '/') applyFilter(next, { scroll: false });
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    applyFilter(f);
  };
  const flag = countries.find((c) => c.code === f.country)?.flag;

  return (
    <form className="search" role="search" onSubmit={submit}>
      <label className="search-country">
        <span className="sr-only">{labels.country}</span>
        {flag ? <img src={flag} alt="" width={20} height={15} /> : <GlobeIcon />}
        <select value={f.country} onChange={(e) => live({ ...f, country: e.target.value })}>
          <option value="">{labels.allCountries}</option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="search-field">
        <span className="sr-only">{labels.label}</span>
        <input
          type="search"
          name="q"
          value={f.q}
          placeholder={labels.placeholder}
          autoComplete="off"
          enterKeyHint="search"
          onChange={(e) => live({ ...f, q: e.target.value })}
        />
      </label>
      <button type="submit" className="search-btn" aria-label={labels.button}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </button>
    </form>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}
