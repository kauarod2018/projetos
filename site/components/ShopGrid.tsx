'use client';

import { useState, type ReactNode } from 'react';

interface Props {
  allLabel: string;
  items: { id: string; category: string; card: ReactNode }[];
  /** extra card at the end of the grid (e.g. "suggest an exam") */
  tail?: ReactNode;
}

/** Product grid with category chips. The chips appear only when there is more than one category. */
export function ShopGrid({ allLabel, items, tail }: Props) {
  const categories = [...new Set(items.map((i) => i.category))];
  const [active, setActive] = useState<string | null>(null);
  const shown = items.filter((i) => !active || i.category === active);
  return (
    <>
      {categories.length > 1 ? (
        <div className="chips" role="group">
          {[null, ...categories].map((c) => (
            <button key={c ?? 'all'} type="button" className={`chip${c === active ? ' is-active' : ''}`} aria-pressed={c === active} onClick={() => setActive(c)}>
              {c ?? allLabel}
            </button>
          ))}
        </div>
      ) : null}
      <ul className="products">
        {shown.map((i) => (
          <li key={i.id}>{i.card}</li>
        ))}
        {tail ? <li>{tail}</li> : null}
      </ul>
    </>
  );
}
