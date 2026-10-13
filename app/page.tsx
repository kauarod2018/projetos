import type { Metadata } from 'next';
import { Banners } from '../site/components/Banners.tsx';
import { Catalog } from '../site/components/Catalog.tsx';
import { ShopShell, TrustStrip } from '../site/components/Chrome.tsx';
import { Icon } from '../site/components/Icon.tsx';
import { LogoMark } from '../site/components/Logo.tsx';
import { ProductCard } from '../site/components/ProductCard.tsx';
import { allNiches, fillText, legalFor, nicheView, shopIndex, siteValues, type NicheView } from '../site/data.ts';
import { normalise, slugify } from '../site/shopFilter.ts';

const LANGUAGE = 'en-GB';
/** how many best sellers get a banner of their own */
const BANNER_PRODUCTS = 3;

type Home = ReturnType<typeof legalFor>['ui']['home'];

export function generateMetadata(): Metadata {
  const v = siteValues(LANGUAGE);
  const ui = legalFor(LANGUAGE).ui;
  return {
    title: `${v.brand}: ${ui.home.title}`,
    description: ui.home.metaDescription,
    openGraph: { title: `${v.brand}: ${ui.home.title}`, description: ui.home.metaDescription, type: 'website' },
  };
}

/** a product banner: what it is, the highlights and three real pages fanned out */
function ProductBanner({ p, h }: { p: NicheView; h: Home }) {
  const pages = [...p.gallery.filter((g) => g.kind === 'cover'), ...p.gallery.filter((g) => g.kind === 'map')].slice(0, 3);
  return (
    <div className="banner banner-product">
      <div className="banner-text">
        <p className="banner-label">
          <span className="banner-tag">{h.banner.label}</span>
          <span className="banner-where">
            <img src={p.country.flag} alt="" width={20} height={15} />
            {p.country.name} · {p.store.category}
          </span>
        </p>
        <h2>{p.examName}</h2>
        <p className="banner-tagline">{p.store.coverTagline}</p>
        <ul className="banner-highlights">
          {p.highlights.map((x) => (
            <li key={x}>
              <Icon name="check" size={16} stroke={3} />
              {x}
            </li>
          ))}
        </ul>
        <div className="banner-actions">
          <a className="btn btn-gold btn-lg" href={`/${p.id}/`}>
            {h.banner.cta} <Icon name="arrow-right" size={18} stroke={2.4} />
          </a>
          <p className="banner-price">
            <strong>{fillText(h.banner.from, { price: p.prices.basic }, 'ui.home.banner.from')}</strong>
            <span>{fillText(h.banner.complete, { price: p.prices.complete }, 'ui.home.banner.complete')}</span>
          </p>
        </div>
      </div>
      <div className="banner-art" aria-hidden="true">
        {pages.map((im, i) => (
          <img key={im.src} className={`banner-page banner-page-${i}`} src={im.srcSmall} alt="" width={600} height={848} />
        ))}
      </div>
    </div>
  );
}

function SuggestBanner({ h, email }: { h: Home; email: string }) {
  return (
    <div className="banner banner-suggest">
      <div className="banner-text">
        <h2>{h.soonTitle}</h2>
        <p className="banner-sub">{h.soonText}</p>
        <div className="banner-actions">
          <a className="btn btn-navy btn-lg" href={`mailto:${email}?subject=${encodeURIComponent(h.soonCta)}`}>
            <Icon name="mail" size={18} stroke={2.2} /> {h.soonCta}
          </a>
        </div>
      </div>
      <div className="banner-art" aria-hidden="true">
        <LogoMark size={190} id="logo-banner" />
      </div>
    </div>
  );
}

export default function Shop() {
  const ui = legalFor(LANGUAGE).ui;
  const h = ui.home;
  const v = siteValues(LANGUAGE);
  const products = allNiches().map(nicheView);
  const index = shopIndex();
  const suggest = `mailto:${v.email}?subject=${encodeURIComponent(h.soonCta)}`;

  return (
    <ShopShell>
      <main>
        <h1 className="sr-only">
          {v.brand}: {h.title}
        </h1>
        <div className="wrap banners-wrap">
          <Banners
            labels={h.banner}
            slides={[
              ...products.slice(0, BANNER_PRODUCTS).map((p) => ({ id: p.id, content: <ProductBanner p={p} h={h} /> })),
              { id: 'suggest', content: <SuggestBanner h={h} email={v.email} /> },
            ]}
          />
        </div>

        <TrustStrip />

        <section className="section" id="shop" aria-labelledby="shop-title">
          <div className="wrap">
            <h2 id="shop-title" className="catalog-title">
              {h.catalogTitle}
            </h2>
            <Catalog
              categories={index.categories}
              countries={index.countries}
              labels={h}
              items={products.map((p) => ({
                id: p.id,
                cat: slugify(p.store.category),
                country: p.country.code,
                searchText: normalise(
                  [
                    p.store.productName,
                    p.examName,
                    p.store.category,
                    p.country.name,
                    p.country.code,
                    p.store.cardText,
                    ...p.store.keywords,
                    // topics: area names and map titles, so "roundabouts" finds the driving guide
                    ...p.areas.flatMap((a) => [a.name, ...a.maps.map((m) => m.title)]),
                  ].join(' '),
                ),
                card: <ProductCard v={p} labels={h} />,
              }))}
              tail={
                <a className="suggest-tile" href={suggest}>
                  <Icon name="circle-plus" size={28} stroke={1.8} />
                  <strong>{h.soonTitle}</strong>
                  <span>{h.soonText}</span>
                  <span className="link-arrow">
                    {h.soonCta} <Icon name="arrow-right" size={15} stroke={2.4} />
                  </span>
                </a>
              }
            />
          </div>
        </section>

        <section className="howband" id="how" aria-labelledby="how-title">
          <div className="wrap howband-grid">
            <div>
              <h2 id="how-title">{h.howTitle}</h2>
              <ol className="howband-steps">
                {h.howSteps.map((s, i) => (
                  <li key={s.title}>
                    <span className="how-num">{i + 1}</span>
                    <div>
                      <h3>{s.title}</h3>
                      <p>{s.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <h2>{fillText(h.whyTitle, v, 'ui.home.whyTitle')}</h2>
              <ul className="howband-why">
                {h.whyCards.map((c) => (
                  <li key={c.title}>
                    <span className="why-icon">
                      <Icon name={c.icon} size={18} stroke={2.2} />
                    </span>
                    <div>
                      <strong>{c.title}</strong>
                      <span>{c.text}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="section" id="help" aria-labelledby="faq-title">
          <div className="wrap faq-grid">
            <div className="faq-intro">
              <h2 id="faq-title">{h.faqTitle}</h2>
              <p>{h.faqSub}</p>
              <a className="faq-mail" href={`mailto:${v.email}`}>
                <span className="why-icon">
                  <Icon name="mail" size={18} stroke={2.2} />
                </span>
                <span>
                  <strong>{h.faqContact}</strong>
                  {v.email}
                </span>
              </a>
            </div>
            <div className="faq">
              {h.faq.map((f) => (
                <details key={f.q}>
                  <summary>
                    {f.q}
                    <Icon name="plus" size={20} stroke={2.4} />
                  </summary>
                  <p>{fillText(f.a, v, 'ui.home.faq')}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
    </ShopShell>
  );
}
