import type { Metadata } from 'next';
import { ShopShell, TrustStrip } from '../site/components/Chrome.tsx';
import { Icon } from '../site/components/Icon.tsx';
import { ProductCard } from '../site/components/ProductCard.tsx';
import { ShopGrid } from '../site/components/ShopGrid.tsx';
import { allNiches, fillText, legalFor, nicheView, siteValues } from '../site/data.ts';

const LANGUAGE = 'en-GB';

export function generateMetadata(): Metadata {
  const v = siteValues(LANGUAGE);
  const ui = legalFor(LANGUAGE).ui;
  return {
    title: `${v.brand}: ${ui.home.title}`,
    description: ui.home.metaDescription,
    openGraph: { title: `${v.brand}: ${ui.home.title}`, description: ui.home.metaDescription, type: 'website' },
  };
}

/** h1 with the highlighted words */
function Highlighted({ text, highlight }: { text: string; highlight: string }) {
  const i = text.indexOf(highlight);
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark>{highlight}</mark>
      {text.slice(i + highlight.length)}
    </>
  );
}

export default function Shop() {
  const ui = legalFor(LANGUAGE).ui;
  const h = ui.home;
  const v = siteValues(LANGUAGE);
  const products = allNiches().map(nicheView);
  // hero: the first product's cover in front of two of its real pages
  const first = products[0]?.gallery ?? [];
  const showcase = [...first.filter((g) => g.kind === 'product'), ...first.filter((g) => g.kind === 'map').slice(0, 2)];

  return (
    <ShopShell>
      <main>
        <section className="shop-hero">
          <div className="wrap shop-hero-grid">
            <div>
              <p className="eyebrow">{h.eyebrow}</p>
              <h1>
                <Highlighted text={h.title} highlight={h.highlight} />
              </h1>
              <p className="lead">{h.sub}</p>
              <div className="actions">
                <a className="btn btn-primary btn-lg" href="#shop">
                  {h.ctaShop} <Icon name="arrow-down" size={18} stroke={2.4} />
                </a>
                <a className="btn btn-ghost btn-lg" href="#how">
                  {h.ctaHow}
                </a>
              </div>
            </div>
            {showcase.length ? (
              <div className="showcase" aria-hidden="true">
                {showcase.map((im, i) => (
                  <img key={im.src} className={`showcase-${i}`} src={im.srcSmall} alt="" width={600} height={848} />
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <TrustStrip />

        <section className="section" id="shop">
          <div className="wrap">
            <div className="section-head">
              <h2>{h.shopTitle}</h2>
              <p>{h.shopSub}</p>
            </div>
            <ShopGrid
              allLabel={h.allCategories}
              items={products.map((p) => ({ id: p.id, category: p.store.category, card: <ProductCard v={p} labels={h} /> }))}
              tail={
                <a className="soon-card" href={`mailto:${v.email}?subject=${encodeURIComponent(h.soonCta)}`}>
                  <Icon name="circle-plus" size={32} stroke={1.8} />
                  <h3>{h.soonTitle}</h3>
                  <p>{h.soonText}</p>
                  <span className="link-arrow">
                    {h.soonCta} <Icon name="arrow-right" size={16} stroke={2.4} />
                  </span>
                </a>
              }
            />
          </div>
        </section>

        <section className="section soft" id="how">
          <div className="wrap">
            <div className="section-head">
              <h2>{h.howTitle}</h2>
            </div>
            <ol className="how">
              {h.howSteps.map((s, i) => (
                <li key={s.title}>
                  <span className="how-num">{i + 1}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section">
          <div className="wrap">
            <div className="section-head">
              <h2>{fillText(h.whyTitle, v, 'ui.home.whyTitle')}</h2>
            </div>
            <ul className="features">
              {h.whyCards.map((c) => (
                <li key={c.title}>
                  <span className="feature-icon">
                    <Icon name={c.icon} size={22} stroke={2.2} />
                  </span>
                  <h3>{c.title}</h3>
                  <p>{c.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section soft" id="help">
          <div className="wrap narrow">
            <div className="section-head">
              <h2>{h.faqTitle}</h2>
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
