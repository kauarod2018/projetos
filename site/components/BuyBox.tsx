'use client';

import { useEffect, useRef, useState } from 'react';
import { BuyButton } from './BuyButton.tsx';

export interface Plan {
  tier: 'basic' | 'complete';
  name: string;
  desc: string;
  price: string;
  badge?: string;
  features: string[];
  href: string;
  event: { value: number; currency: string; content_ids: string[]; content_name: string };
}

interface Props {
  plans: Plan[];
  initial: Plan['tier'];
  labels: { choose: string; buy: string; sticky: string; priceNote: string; vatNote: string; missing?: string };
  checkIcon: string;
}

/** Pack selector + buy button. On phones a slim bar with the price follows you once the box scrolls away. */
export function BuyBox({ plans, initial, labels, checkIcon }: Props) {
  const [tier, setTier] = useState(initial);
  const [showBar, setShowBar] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const plan = plans.find((p) => p.tier === tier) ?? plans[0]!;

  useEffect(() => {
    const el = box.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([entry]) => setShowBar(!entry!.isIntersecting && entry!.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div className="buybox" id="buy" ref={box}>
        <fieldset>
          <legend>{labels.choose}</legend>
          {plans.map((p) => (
            <label key={p.tier} className={`plan-option${p.tier === tier ? ' is-selected' : ''}`}>
              <input type="radio" name="plan" value={p.tier} checked={p.tier === tier} onChange={() => setTier(p.tier)} />
              <span className="plan-text">
                <span className="plan-name">
                  {p.name}
                  {p.badge ? <em>{p.badge}</em> : null}
                </span>
                <span className="plan-desc">{p.desc}</span>
              </span>
              <span className="plan-price">{p.price}</span>
            </label>
          ))}
        </fieldset>
        <ul className="plan-features">
          {plan.features.map((f) => (
            <li key={f}>
              <span className="icon" aria-hidden="true" dangerouslySetInnerHTML={{ __html: checkIcon }} />
              {f}
            </li>
          ))}
        </ul>
        <BuyButton href={plan.href} event={plan.event} className="btn btn-primary btn-block btn-lg">
          {labels.buy} · {plan.price}
        </BuyButton>
        {labels.missing ? <p className="buybox-missing">{labels.missing}</p> : null}
        <p className="buybox-note">
          {labels.priceNote} {labels.vatNote}
        </p>
      </div>
      <div className={`sticky-buy${showBar ? ' is-visible' : ''}`} aria-hidden={!showBar}>
        <span>
          <strong>{plan.name}</strong> · {plan.price}
        </span>
        <a className="btn btn-primary btn-sm" href="#buy" tabIndex={showBar ? 0 : -1}>
          {labels.sticky}
        </a>
      </div>
    </>
  );
}
