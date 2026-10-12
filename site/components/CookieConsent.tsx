'use client';

import { useEffect, useState } from 'react';
import { loadPixel, OPEN_SETTINGS_EVENT, readConsent, saveConsent, track, type Consent } from './consent.ts';

interface Props {
  pixelId: string | null;
  labels: { title: string; text: string; accept: string; reject: string; more: string };
  /** event fired on this page after consent, e.g. ViewContent on a sales page */
  pageEvent?: { name: string; params: Record<string, unknown> };
}

export function CookieConsent({ pixelId, labels, pageEvent }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!pixelId) return;
    const start = () => {
      loadPixel(pixelId);
      track('PageView');
      if (pageEvent) track(pageEvent.name, pageEvent.params);
    };
    const current = readConsent();
    if (current === 'granted') start();
    if (current === null) setOpen(true);
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, reopen);
  }, [pixelId, pageEvent]);

  if (!pixelId || !open) return null;

  const choose = (v: Consent) => {
    saveConsent(v);
    setOpen(false);
    if (v === 'granted') {
      loadPixel(pixelId);
      track('PageView');
      if (pageEvent) track(pageEvent.name, pageEvent.params);
    } else if (window.fbq) {
      // consent withdrawn: stop the pixel for the rest of this visit
      window.fbq('consent', 'revoke');
    }
  };

  return (
    <div className="cookie" role="dialog" aria-live="polite" aria-label={labels.title}>
      <h2>{labels.title}</h2>
      <p>
        {labels.text} <a href="/privacy/">{labels.more}</a>
      </p>
      <div className="cookie-actions">
        <button type="button" className="btn" onClick={() => choose('denied')}>
          {labels.reject}
        </button>
        <button type="button" className="btn" onClick={() => choose('granted')}>
          {labels.accept}
        </button>
      </div>
    </div>
  );
}

export function CookieSettingsButton({ label }: { label: string }) {
  return (
    <button type="button" className="linklike" onClick={() => window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT))}>
      {label}
    </button>
  );
}
