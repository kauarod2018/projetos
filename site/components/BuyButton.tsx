'use client';

import type { MouseEvent, ReactNode } from 'react';
import { track } from './consent.ts';

/** tracking parameters passed on from the ad to the Hotmart checkout */
const PASS_THROUGH = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'src', 'sck'];

interface Props {
  href: string;
  className?: string;
  children: ReactNode;
  /** InitiateCheckout data, sent only with consent */
  event: { value: number; currency: string; content_ids: string[]; content_name: string };
}

export function BuyButton({ href, className = 'btn btn-primary btn-block', children, event }: Props) {
  if (!href) {
    return (
      <span className={className} aria-disabled="true">
        {children}
      </span>
    );
  }
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = new URL(href);
    const here = new URLSearchParams(window.location.search);
    for (const key of PASS_THROUGH) {
      const v = here.get(key);
      if (v && !target.searchParams.has(key)) target.searchParams.set(key, v);
    }
    track('InitiateCheckout', { ...event, content_type: 'product' });
    window.location.href = target.toString();
  };
  return (
    <a href={href} className={className} onClick={onClick} rel="noopener">
      {children}
    </a>
  );
}
