/** Cookie consent + Meta Pixel. Nothing is loaded before the visitor clicks Accept. */
export const CONSENT_KEY = 'testhelp-consent-v1';
export type Consent = 'granted' | 'denied';

type Fbq = ((...args: unknown[]) => void) & { callMethod?: (...a: unknown[]) => void; queue: unknown[]; loaded: boolean; version: string; push: unknown };

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

export function readConsent(): Consent | null {
  try {
    const v = window.localStorage.getItem(CONSENT_KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
}

export function saveConsent(v: Consent) {
  try {
    window.localStorage.setItem(CONSENT_KEY, v);
  } catch {
    // private mode: the choice lasts for this page view only
  }
}

/** standard Meta Pixel loader, written out so nothing runs before consent */
export function loadPixel(pixelId: string) {
  if (window.fbq) return;
  const n = function (...args: unknown[]) {
    if (n.callMethod) n.callMethod(...args);
    else n.queue.push(args);
  } as Fbq;
  n.queue = [];
  n.loaded = true;
  n.version = '2.0';
  n.push = n;
  window.fbq = n;
  window._fbq = n;
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);
  window.fbq('init', pixelId);
}

export function track(event: string, params?: Record<string, unknown>) {
  if (readConsent() === 'granted' && window.fbq) window.fbq('track', event, params);
}

export const OPEN_SETTINGS_EVENT = 'testhelp:cookie-settings';
