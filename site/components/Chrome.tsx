import type { ReactNode } from 'react';
import { allNiches, content, fillText, legalFor, MODE, shopIndex, siteValues } from '../data.ts';
import { CookieConsent, CookieSettingsButton } from './CookieConsent.tsx';
import { FilterLink } from './FilterLink.tsx';
import { Icon } from './Icon.tsx';
import { Logo } from './Logo.tsx';
import { SearchBar } from './SearchBar.tsx';

const LANGUAGE = 'en-GB';

export function PreviewBanner({ text }: { text: string }) {
  return <div className="preview-banner">{text}</div>;
}

/** the store's promises: same strip on the home page and every product page */
export function TrustStrip({ guaranteeDays = 15 }: { guaranteeDays?: number }) {
  const ui = legalFor(LANGUAGE).ui;
  const v = siteValues(LANGUAGE, guaranteeDays);
  return (
    <div className="trust">
      <ul className="wrap">
        {ui.trust.map((t) => (
          <li key={t.icon}>
            <Icon name={t.icon} size={20} stroke={2.2} />
            {fillText(t.text, v, 'ui.trust')}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Header, footer, preview banner and cookie banner around every page of the shop.
 * Footer links list every product, so a new niche shows up everywhere without code changes.
 */
export function ShopShell({
  children,
  guaranteeDays,
  disclaimer,
  pageEvent,
}: {
  children: ReactNode;
  guaranteeDays?: number;
  disclaimer?: string;
  /** Meta Pixel event for this page (sent only after consent) */
  pageEvent?: { name: string; params: Record<string, unknown> };
}) {
  const legal = legalFor(LANGUAGE);
  const ui = legal.ui;
  const v = siteValues(LANGUAGE, guaranteeDays);
  const products = allNiches().map((n) => ({ href: `/${n.niche.id}/`, name: n.niche.examName }));
  const index = shopIndex();
  return (
    <>
      {MODE === 'preview' ? <PreviewBanner text={ui.preview} /> : null}
      <header className="header">
        <div className="header-top">
          <div className="wrap">
            <Logo brand={v.brand} id="logo-head" />
            <SearchBar labels={ui.home.search} countries={index.countries} />
            <nav className="header-links" aria-label={ui.nav.help}>
              <a href="/#help">
                <Icon name="circle-help" size={20} stroke={2} />
                <span>{ui.nav.help}</span>
              </a>
              <a href={`mailto:${v.email}`}>
                <Icon name="mail" size={20} stroke={2} />
                <span>{ui.nav.contact}</span>
              </a>
            </nav>
          </div>
        </div>
        <nav className="catbar" aria-label={ui.nav.shop}>
          <div className="wrap">
            <ul>
              <li>
                <FilterLink cat="">{ui.home.allCategories}</FilterLink>
              </li>
              {index.categories.map((c) => (
                <li key={c.slug}>
                  <FilterLink cat={c.slug}>{c.name}</FilterLink>
                </li>
              ))}
              <li>
                <a href="/#how">{ui.nav.how}</a>
              </li>
            </ul>
            <p className="catbar-promise">
              <Icon name="shield-check" size={16} stroke={2.2} />
              {ui.nav.promise}
            </p>
          </div>
        </nav>
      </header>
      {children}
      <footer className="footer">
        <div className="wrap">
          <div className="footer-grid">
            <div className="footer-brand">
              <Logo brand={v.brand} id="logo-foot" />
              <p>{fillText(ui.footer.company, v, 'ui.footer.company')}</p>
              <p className="footer-label">{ui.footer.contactTitle}</p>
              <a className="footer-mail" href={`mailto:${v.email}`}>
                <Icon name="mail" size={18} stroke={2.2} />
                {v.email}
              </a>
              {disclaimer ? <p className="footer-disclaimer">{disclaimer}</p> : null}
            </div>
            <nav aria-label={ui.footerCols.shop}>
              <h2>{ui.footerCols.shop}</h2>
              <ul>
                {products.map((p) => (
                  <li key={p.href}>
                    <a href={p.href}>{p.name}</a>
                  </li>
                ))}
              </ul>
            </nav>
            <nav aria-label={ui.footerCols.help}>
              <h2>{ui.footerCols.help}</h2>
              <ul>
                <li>
                  <a href="/#how">{ui.nav.how}</a>
                </li>
                <li>
                  <a href="/#help">{ui.nav.help}</a>
                </li>
                <li>
                  <a href="/refund/">{ui.nav.refund}</a>
                </li>
              </ul>
            </nav>
            <nav aria-label={ui.footerCols.legal}>
              <h2>{ui.footerCols.legal}</h2>
              <ul>
                <li>
                  <a href="/privacy/">{ui.nav.privacy}</a>
                </li>
                <li>
                  <a href="/terms/">{ui.nav.terms}</a>
                </li>
                <li>
                  <CookieSettingsButton label={ui.nav.cookies} />
                </li>
              </ul>
            </nav>
          </div>
          <div className="footer-bottom">
            <small>
              © {new Date().getFullYear()} {v.brand}
            </small>
            <small>
              <Icon name="lock" size={14} stroke={2.2} /> {ui.footerCols.payments} {ui.footer.prices}
            </small>
          </div>
        </div>
      </footer>
      <CookieConsent pixelId={content().site.metaPixelId} labels={ui.cookies} pageEvent={pageEvent} />
    </>
  );
}
