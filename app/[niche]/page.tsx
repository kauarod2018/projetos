import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { icon } from '../../lib/icons.ts';
import { BuyBox, type Plan } from '../../site/components/BuyBox.tsx';
import { ShopShell, TrustStrip } from '../../site/components/Chrome.tsx';
import { Gallery } from '../../site/components/Gallery.tsx';
import { Icon } from '../../site/components/Icon.tsx';
import { allNiches, content, fillText, legalFor, nicheView, siteValues, type NicheView } from '../../site/data.ts';

export const dynamicParams = false;

export function generateStaticParams() {
  return allNiches().map((n) => ({ niche: n.niche.id }));
}

function viewFor(id: string): NicheView {
  const n = allNiches().find((x) => x.niche.id === id);
  if (!n) notFound();
  return nicheView(n);
}

export async function generateMetadata({ params }: { params: Promise<{ niche: string }> }): Promise<Metadata> {
  const v = viewFor((await params).niche);
  const domain = content().site.domain;
  return {
    title: `${v.store.productName} | ${v.brand}`,
    description: v.copy.meta.description,
    alternates: domain.startsWith('{{') ? undefined : { canonical: `https://${domain}/${v.id}/` },
    openGraph: {
      title: v.copy.meta.title,
      description: v.copy.meta.description,
      images: [{ url: `/media/${v.id}/og.jpg`, width: 1200, height: 630 }],
      locale: v.language.replace('-', '_'),
      type: 'website',
    },
  };
}

/** schema.org Product with the two packs as offers (no ratings: there are no reviews yet) */
function productJsonLd(v: NicheView, domain: string) {
  const base = domain.startsWith('{{') ? '' : `https://${domain}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: v.store.productName,
    description: v.copy.meta.description,
    brand: { '@type': 'Brand', name: v.brand },
    category: v.store.category,
    image: v.gallery.map((g) => `${base}${g.src}`),
    offers: [
      { '@type': 'Offer', name: v.copy.pricing.basic.name, price: v.prices.basicValue, priceCurrency: v.prices.currency, availability: 'https://schema.org/InStock', url: `${base}/${v.id}/` },
      { '@type': 'Offer', name: v.copy.pricing.complete.name, price: v.prices.completeValue, priceCurrency: v.prices.currency, availability: 'https://schema.org/InStock', url: `${base}/${v.id}/` },
    ],
  };
}

export default async function ProductPage({ params }: { params: Promise<{ niche: string }> }) {
  const v = viewFor((await params).niche);
  const c = v.copy;
  const ui = legalFor(v.language).ui;
  const p = ui.product;
  const sv = siteValues(v.language, v.guaranteeDays);
  const domain = content().site.domain;
  const event = (tier: Plan['tier']) => ({
    value: tier === 'basic' ? v.prices.basicValue : v.prices.completeValue,
    currency: v.prices.currency,
    content_ids: [`${v.id}-${tier}`],
    content_name: `${v.examName} ${tier}`,
  });
  const plans: Plan[] = [
    { tier: 'complete', name: c.pricing.complete.name, desc: c.pricing.complete.desc, price: v.prices.complete, badge: c.pricing.complete.badge, features: c.pricing.complete.features, href: v.checkout.complete, event: event('complete') },
    { tier: 'basic', name: c.pricing.basic.name, desc: c.pricing.basic.desc, price: v.prices.basic, features: c.pricing.basic.features, href: v.checkout.basic, event: event('basic') },
  ];
  const missingCheckout = !v.checkout.basic || !v.checkout.complete;
  const yes = <Icon name="check" size={20} stroke={2.6} />;
  const no = <Icon name="minus" size={20} stroke={2.2} />;
  const compare: { label: string; basic: React.ReactNode; complete: React.ReactNode }[] = [
    { label: p.compareRows.maps, basic: v.counts.basicMaps, complete: v.counts.totalMaps },
    { label: p.compareRows.areas, basic: `${v.counts.areas}/${v.counts.areas}`, complete: `${v.counts.areas}/${v.counts.areas}` },
    { label: p.compareRows.questions, basic: v.basic.questions, complete: v.questions },
    { label: p.compareRows.traps, basic: v.basic.traps, complete: v.traps },
    ...v.bonuses.map((b) => ({ label: b.title, basic: no, complete: yes })),
    { label: p.compareRows.price, basic: v.prices.basic, complete: v.prices.complete },
  ];
  const sections = [
    { id: 'inside', label: p.sections.inside },
    { id: 'compare', label: p.sections.compare },
    ...(v.bonuses.length ? [{ id: 'bonuses', label: p.sections.bonuses }] : []),
    { id: 'why', label: p.sections.why },
    { id: 'faq', label: p.sections.faq },
  ];

  return (
    <ShopShell
      guaranteeDays={v.guaranteeDays}
      disclaimer={v.disclaimer}
      pageEvent={{ name: 'ViewContent', params: { content_ids: [v.id], content_type: 'product', content_name: v.examName } }}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(v, domain)) }} />
      <main>
        <div className="wrap">
          <nav className="breadcrumb" aria-label={p.aria.breadcrumb}>
            <a href="/#shop">{p.breadcrumbShop}</a>
            <Icon name="chevron-right" size={14} stroke={2.4} />
            <span>{v.store.category}</span>
            <Icon name="chevron-right" size={14} stroke={2.4} />
            <span aria-current="page">{v.examName}</span>
          </nav>

          <section className="pdp">
            <Gallery
              images={v.gallery}
              sampleLabel={p.sample}
              zoomHint={p.zoomHint}
              labels={{ close: p.aria.close, prev: p.aria.prev, next: p.aria.next }}
              icons={{ zoom: icon('zoom-in', 18, 2.4), prev: icon('chevron-left', 28, 2.4), next: icon('chevron-right', 28, 2.4), close: icon('x', 26, 2.4) }}
            />
            <div className="pdp-info">
              <p className="product-cat">
                {v.store.category} · {v.store.countryName}
              </p>
              <h1>{v.store.productName}</h1>
              <p className="pdp-sub">{v.store.cardText}</p>
              <ul className="specs">
                <li>
                  <Icon name="file-text" size={18} stroke={2.2} />
                  {fillText(p.specs.maps, { maps: v.counts.totalMaps, format: v.store.format }, 'ui.product.specs.maps')}
                </li>
                <li>
                  <Icon name="list-checks" size={18} stroke={2.2} />
                  {fillText(p.specs.practice, { questions: v.questions, traps: v.traps }, 'ui.product.specs.practice')}
                </li>
                <li>
                  <Icon name="gift" size={18} stroke={2.2} />
                  {fillText(p.specs.bonuses, { bonuses: v.counts.bonuses, pack: c.pricing.complete.name }, 'ui.product.specs.bonuses')}
                </li>
                <li>
                  <Icon name="badge-check" size={18} stroke={2.2} />
                  {fillText(p.checked, { checkedOn: v.checkedOn }, 'ui.product.checked')}
                </li>
              </ul>
              <BuyBox
                plans={plans}
                initial="complete"
                checkIcon={icon('check', 18, 2.6)}
                labels={{
                  choose: p.chooseTitle,
                  buy: p.buy,
                  sticky: c.pricing.title,
                  priceNote: c.pricing.priceNote,
                  vatNote: v.prices.vatIncluded ? c.pricing.vatNote : '',
                  missing: missingCheckout ? ui.checkoutMissing : undefined,
                }}
              />
              <div className="guarantee-mini">
                <Icon name="rotate-ccw" size={20} stroke={2.2} />
                <p>
                  <strong>{c.guarantee.title}</strong> {c.guarantee.text}
                </p>
              </div>
            </div>
          </section>
        </div>

        <TrustStrip guaranteeDays={v.guaranteeDays} />

        <nav className="section-tabs" aria-label={p.aria.onThisPage}>
          <div className="wrap">
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`}>
                {s.label}
              </a>
            ))}
          </div>
        </nav>

        <section className="section" id="inside">
          <div className="wrap inside">
            <div>
              <h2>{c.lookInside.title}</h2>
              <p className="lead">{c.hero.sub}</p>
              <ol className="points">
                {c.lookInside.points.map((pt, i) => (
                  <li key={pt.title}>
                    <span className="how-num">{i + 1}</span>
                    <div>
                      <h3>{pt.title}</h3>
                      <p>{pt.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="areas">
              <h3 className="areas-title">{c.areas.title}</h3>
              {v.areas.map((a) => (
                <details key={a.slug} style={{ ['--area' as string]: a.colour }}>
                  <summary>
                    <span className="area-num">{a.num}</span>
                    <span className="area-name">{a.name}</span>
                    <span className="area-count">{a.maps.length}</span>
                    <Icon name="chevron-down" size={18} stroke={2.4} />
                  </summary>
                  <ul>
                    {a.maps.map((m) => (
                      <li key={m.code}>
                        <code>{m.code}</code>
                        {m.title}
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="section soft" id="compare">
          <div className="wrap narrow">
            <div className="section-head">
              <h2>{p.sections.compare}</h2>
              <p>{c.pricing.sub}</p>
            </div>
            <div className="compare-wrap">
              <table className="compare">
                <thead>
                  <tr>
                    <th scope="col">{p.compareFeature}</th>
                    <th scope="col">{c.pricing.basic.name}</th>
                    <th scope="col" className="is-best">
                      {c.pricing.complete.name}
                      <em>{c.pricing.complete.badge}</em>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {compare.map((r) => (
                    <tr key={r.label}>
                      <th scope="row">{r.label}</th>
                      <td>{r.basic}</td>
                      <td className="is-best">{r.complete}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="center" style={{ marginTop: 24 }}>
              <a className="btn btn-primary btn-lg" href="#buy">
                {c.pricing.title} <Icon name="arrow-up" size={18} stroke={2.4} />
              </a>
            </p>
          </div>
        </section>

        {v.bonuses.length ? (
          <section className="section" id="bonuses">
            <div className="wrap">
              <div className="section-head">
                <h2>{c.bonuses.title}</h2>
                <p>{c.bonuses.text}</p>
              </div>
              <ul className="bonus-grid">
                {v.bonuses.map((b) => (
                  <li key={b.number}>
                    <img src={b.image.srcSmall} alt={b.image.alt} width={600} height={848} loading="lazy" decoding="async" />
                    <div>
                      <span className="bonus-tag">{fillText(ui.labels.bonus, { n: String(b.number).padStart(2, '0') }, 'ui.labels.bonus')}</span>
                      <h3>{b.title}</h3>
                      <p>{b.summary}</p>
                      <small>{fillText(ui.labels.pages, { n: b.pages }, 'ui.labels.pages')}</small>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        <section className="section soft" id="why">
          <div className="wrap">
            <div className="why-stat">
              <strong>{c.pain.stat}</strong>
              <div>
                <h2>{c.pain.title}</h2>
                <p>{c.pain.text}</p>
                <small>{c.pain.source}</small>
              </div>
            </div>
            <ul className="features three">
              {c.strategic.cards.map((k) => (
                <li key={k.title}>
                  <span className="feature-icon">
                    <Icon name={k.icon} size={22} stroke={2.2} />
                  </span>
                  <h3>{k.title}</h3>
                  <p>{k.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section" id="access">
          <div className="wrap">
            <div className="section-head">
              <h2>{c.access.title}</h2>
            </div>
            <ol className="steps">
              {c.access.steps.map((s, i) => (
                <li key={s}>
                  <span className="how-num">{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section soft" id="faq">
          <div className="wrap narrow">
            <div className="section-head">
              <h2>{c.faq.title}</h2>
            </div>
            <div className="faq">
              {c.faq.items.map((f) => (
                <details key={f.q}>
                  <summary>
                    {f.q}
                    <Icon name="plus" size={20} stroke={2.4} />
                  </summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="final">
          <div className="wrap">
            <h2>{c.finalCta.title}</h2>
            <p>{c.finalCta.text}</p>
            <a className="btn btn-primary btn-lg" href="#buy">
              {c.finalCta.cta} <Icon name="arrow-up" size={18} stroke={2.4} />
            </a>
            <p className="final-email">{fillText(p.contact, sv, 'ui.product.contact')}</p>
          </div>
        </section>
      </main>
    </ShopShell>
  );
}
