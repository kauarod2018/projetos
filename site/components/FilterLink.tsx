'use client';

import type { ReactNode } from 'react';
import { applyFilter, EMPTY_FILTER, filterUrl, readFilter } from '../shopFilter.ts';

/** a category link: filters the shop in place on the home page, opens the filtered shop elsewhere */
export function FilterLink({ cat, className, children }: { cat: string; className?: string; children: ReactNode }) {
  const target = { ...EMPTY_FILTER, cat };
  return (
    <a
      className={className}
      href={filterUrl(target)}
      onClick={(e) => {
        if (window.location.pathname !== '/') return;
        e.preventDefault();
        // keep the country the visitor picked, start a fresh text search
        applyFilter({ ...target, country: readFilter().country });
      }}
    >
      {children}
    </a>
  );
}
