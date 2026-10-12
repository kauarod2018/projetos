import type { ReactNode } from 'react';
import type { Legal } from '../../schemas/site-copy.ts';
import { CookieSettingsButton } from './CookieConsent.tsx';

export function Logo({ brand }: { brand: string }) {
  return (
    <a className="logo" href="/">
      <span className="logo-mark" aria-hidden="true">
        <i />
      </span>
      {brand}
    </a>
  );
}

export function PreviewBanner({ text }: { text: string }) {
  return <div className="preview-banner">{text}</div>;
}

export function Header({ brand, children }: { brand: string; children?: ReactNode }) {
  return (
    <header className="header">
      <div className="wrap">
        <Logo brand={brand} />
        {children}
      </div>
    </header>
  );
}

interface FooterProps {
  brand: string;
  ui: Legal['ui'];
  company: string;
  email: string;
  disclaimer?: string;
  showPrices?: boolean;
}

export function Footer({ brand, ui, company, email, disclaimer, showPrices }: FooterProps) {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <Logo brand={brand} />
            {disclaimer ? <p style={{ marginTop: 16 }}>{disclaimer}</p> : null}
            <p>{company}</p>
            {showPrices ? <p>{ui.footer.prices}</p> : null}
          </div>
          <nav aria-label="Legal">
            <ul>
              <li>
                <a href="/privacy/">{ui.nav.privacy}</a>
              </li>
              <li>
                <a href="/terms/">{ui.nav.terms}</a>
              </li>
              <li>
                <a href="/refund/">{ui.nav.refund}</a>
              </li>
              <li>
                <CookieSettingsButton label={ui.nav.cookies} />
              </li>
              <li>
                <a href={`mailto:${email}`}>{ui.nav.contact}</a>
              </li>
            </ul>
          </nav>
        </div>
        <small>
          © {new Date().getFullYear()} {brand}
        </small>
      </div>
    </footer>
  );
}
