'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

interface Props {
  slides: { id: string; content: ReactNode }[];
  labels: { region: string; prev: string; next: string; goTo: string };
}

const INTERVAL = 7000;

/**
 * Banner carousel: a scroll-snap strip (swipe works natively on phones) with dots and arrows.
 * It moves on its own every 7 s, but stops while the pointer or keyboard focus is on it,
 * when the tab is hidden, and for visitors who ask for reduced motion.
 */
export function Banners({ slides, labels }: Props) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const many = slides.length > 1;

  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    const n = (i + slides.length) % slides.length;
    el.scrollTo({ left: n * el.clientWidth, behavior: 'smooth' });
  };

  // which slide is in view (also follows swipes)
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => setActive(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!many || paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = window.setInterval(() => {
      if (!document.hidden) go(active + 1);
    }, INTERVAL);
    return () => window.clearInterval(t);
  });

  return (
    <section
      className="banners"
      aria-roledescription="carousel"
      aria-label={labels.region}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="banners-track" ref={track}>
        {slides.map((s, i) => (
          <div
            key={s.id}
            className="banner-slide"
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} / ${slides.length}`}
            aria-hidden={many && i !== active ? true : undefined}
            inert={many && i !== active ? true : undefined}
          >
            {s.content}
          </div>
        ))}
      </div>
      {many ? (
        <div className="banners-nav">
          <button type="button" className="banners-arrow" aria-label={labels.prev} onClick={() => go(active - 1)}>
            <Chevron dir="left" />
          </button>
          <div className="banners-dots">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className={i === active ? 'is-active' : undefined}
                aria-label={labels.goTo.replace('{n}', String(i + 1))}
                aria-current={i === active ? 'true' : undefined}
                onClick={() => go(i)}
              />
            ))}
          </div>
          <button type="button" className="banners-arrow" aria-label={labels.next} onClick={() => go(active + 1)}>
            <Chevron dir="right" />
          </button>
        </div>
      ) : null}
    </section>
  );
}

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={dir === 'left' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
    </svg>
  );
}
