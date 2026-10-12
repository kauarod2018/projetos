import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BuyButton } from '../../site/components/BuyButton.tsx';
import { CookieConsent } from '../../site/components/CookieConsent.tsx';
import { Footer, Header, PreviewBanner } from '../../site/components/Chrome.tsx';
import { Icon } from '../../site/components/Icon.tsx';
import { allNiches, content, fillText, legalFor, MODE, nicheView, siteValues, type Img, type NicheView } from '../../site/data.ts';

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
    title: v.copy.meta.title,
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

function Picture({ img, width, height, eager }: { img: Img; width: number; height: number; eager?: boolean }) {
  return (
    <img
      src={img.src}
      srcSet={`${img.srcSmall} 600w, ${img.src} 1200w`}
      sizes={`(max-width: 720px) 90vw, ${width}px`}
      alt={img.alt}
      width={width}
      height={height}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
    />
  );
}

/** the h1 with its highlighted words */
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

const A4_RATIO = 1123 / 794;

export default async function SalesPage({ params }: { params: Promise<{ niche: string }> }) {
  const v = viewFor((await params).niche);
  const c = v.copy;
  const legal = legalFor(v.language);
  const sv = siteValues(v.language, v.guaranteeDays);
  const ui = legal.ui;
  const event = (tier: 'basic' | 'complete') => ({
    value: tier === 'basic' ? v.prices.basicValue : v.prices.completeValue,
    currency: v.prices.currency,
    content_ids: [`${v.id}-${tier}`],
    content_name: `${v.examName} ${tier}`,
  });
  const missingCheckout = !v.checkout.basic || !v.checkout.complete;
  const toPrices = (label: string) => (
    <a className="btn btn-primary" href="#prices">
      {label} <Icon name="arrow-down" size={18} stroke={2.6} />
    </a>
  );

  return (
    <>
      {v.mode === 'preview' ? <PreviewBanner text={ui.preview} /> : null}
      <div className="topbar">
        <Icon name="gift" size={16} stroke={2.4} />
        {c.topBar}
      </div>
      <Header brand={v.brand}>
        <a className="btn btn-primary" href="#prices">
          {c.pricing.title}
        </a>
      </Header>

      <main>
        {/* 1. hero */}
        <section className="hero">
          <div className="wrap hero-grid">
            <div>
              {c.hero.eyebrow ? (
                <span className="badge">
                  <Icon name="badge-check" size={16} stroke={2.4} />
                  {c.hero.eyebrow}
                </span>
              ) : null}
              <h1>
                <Highlighted text={c.hero.h1} highlight={c.hero.highlight} />
              </h1>
              <p className="hero-sub">{c.hero.sub}</p>
              <div className="hero-ctas">
                {toPrices(c.hero.primaryCta)}
                <a className="btn btn-secondary" href="#inside">
                  {c.hero.secondaryCta}
                </a>
              </div>
              <ul className="ticks">
                {c.hero.bullets.map((b) => (
                  <li key={b}>
                    <Icon name="circle-check" size={20} stroke={2.4} />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              {c.socialProof ? <p className="social-proof">{c.socialProof}</p> : null}
            </div>
            <div className="stack" aria-hidden={v.pages.length === 0}>
              {v.pages.slice(0, 3).map((p) => (
                <Picture key={p.code} img={p} width={320} height={Math.round(320 * A4_RATIO)} eager />
              ))}
            </div>
          </div>
        </section>

        {/* why it matters */}
        <section className="section">
          <div className="wrap pain">
            <div className="pain-stat">{c.pain.stat}</div>
            <div>
              <span className="eyebrow">{c.pain.eyebrow}</span>
              <h2 style={{ fontSize: 'clamp(26px, 5.5vw, 36px)', fontWeight: 800 }}>{c.pain.title}</h2>
              <p style={{ marginTop: 14, color: 'var(--ink-2)' }}>{c.pain.text}</p>
              <small>{c.pain.source}</small>
            </div>
          </div>
        </section>

        {/* 3. real pages */}
        <section className="section soft" id="inside">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">{c.pages.eyebrow}</span>
              <h2>{c.pages.title}</h2>
              <p>{c.pages.text}</p>
            </div>
            <div className="rail" tabIndex={0} aria-label={c.pages.title}>
              {v.pages.map((p) => (
                <figure key={p.code}>
                  <a href={p.src} target="_blank" rel="noopener">
                    <Picture img={p} width={300} height={Math.round(300 * A4_RATIO)} />
                  </a>
                  <figcaption>
                    <b>{p.code}</b>
                    {p.title}
                  </figcaption>
                </figure>
              ))}
            </div>
            <div className="cta-row">{toPrices(c.hero.primaryCta)}</div>
          </div>
        </section>

        {/* 4. areas */}
        <section className="section">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">{c.areas.eyebrow}</span>
              <h2>{c.areas.title}</h2>
              <p>{c.areas.text}</p>
            </div>
            <div className="cards three">
              {v.areas.map((a) => (
                <article key={a.slug} className="card area-card" style={{ ['--area' as string]: a.colour }}>
                  <header>
                    <span className="area-num">{a.num}</span>
                    <h3>{a.name}</h3>
                    <Icon name={a.icon} size={22} stroke={2.2} />
                  </header>
                  <ul className="map-list">
                    {a.maps.slice(0, 6).map((m) => (
                      <li key={m.code}>
                        <code>{m.code}</code>
                        {m.title}
                      </li>
                    ))}
                  </ul>
                  {a.maps.length > 6 ? (
                    <details className="more">
                      <summary>{fillText(ui.labels.more, { n: a.maps.length - 6 }, 'ui.labels.more')}</summary>
                      <ul className="map-list">
                        {a.maps.slice(6).map((m) => (
                          <li key={m.code}>
                            <code>{m.code}</code>
                            {m.title}
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 5. look inside */}
        {v.lookInside ? (
          <section className="section soft">
            <div className="wrap look">
              <a className="look-img" href={v.lookInside.src} target="_blank" rel="noopener">
                <Picture img={v.lookInside} width={520} height={Math.round(520 * A4_RATIO)} />
              </a>
              <div>
                <div className="section-head">
                  <span className="eyebrow">{c.lookInside.eyebrow}</span>
                  <h2>{c.lookInside.title}</h2>
                </div>
                <ol className="points">
                  {c.lookInside.points.map((p) => (
                    <li key={p.title}>
                      <div>
                        <h3>{p.title}</h3>
                        <p>{p.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>
        ) : null}

        {/* 6. strategic content */}
        <section className="section">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">{c.strategic.eyebrow}</span>
              <h2>{c.strategic.title}</h2>
            </div>
            <div className="cards three">
              {c.strategic.cards.map((k) => (
                <article key={k.title} className="card icon-card">
                  <div className="icon-box">
                    <Icon name={k.icon} size={24} stroke={2.2} />
                  </div>
                  <h3>{k.title}</h3>
                  <p>{k.text}</p>
                </article>
              ))}
            </div>
            <div className="cta-row">{toPrices(c.hero.primaryCta)}</div>
          </div>
        </section>

        {/* 7. who it's for */}
        <section className="section soft">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">{c.whoFor.eyebrow}</span>
              <h2>{c.whoFor.title}</h2>
            </div>
            <div className="cards three">
              {c.whoFor.cards.map((k) => (
                <article key={k.title} className="card icon-card">
                  <div className="icon-box">
                    <Icon name={k.icon} size={24} stroke={2.2} />
                  </div>
                  <h3>{k.title}</h3>
                  <p>{k.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 8. bonuses */}
        {v.bonuses.length ? (
          <section className="section">
            <div className="wrap">
              <div className="section-head">
                <span className="eyebrow">{c.bonuses.eyebrow}</span>
                <h2>{c.bonuses.title}</h2>
                <p>{c.bonuses.text}</p>
              </div>
              <div className="cards three">
                {v.bonuses.map((b) => (
                  <article key={b.number} className="card bonus-card">
                    <div className="bonus-img">
                      <Picture img={b.image} width={320} height={Math.round(320 * A4_RATIO)} />
                    </div>
                    <div className="bonus-body">
                      <span className="bonus-tag">{fillText(ui.labels.bonus, { n: String(b.number).padStart(2, '0') }, 'ui.labels.bonus')}</span>
                      <h3>{b.title}</h3>
                      <p>{b.summary}</p>
                      <small>{fillText(ui.labels.pages, { n: b.pages }, 'ui.labels.pages')}</small>
                    </div>
                  </article>
                ))}
              </div>
              <div className="cta-row">{toPrices(c.hero.primaryCta)}</div>
            </div>
          </section>
        ) : null}

        {/* 9. how access works */}
        <section className="section soft">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">{c.access.eyebrow}</span>
              <h2>{c.access.title}</h2>
            </div>
            <ol className="steps">
              {c.access.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </div>
        </section>

        {/* 10. testimonials: hidden while the list is empty */}
        {c.testimonials.length ? (
          <section className="section">
            <div className="wrap cards three">
              {c.testimonials.map((t) => (
                <blockquote key={t.name} className="card quote">
                  <p>“{t.text}”</p>
                  <footer>
                    {t.name}, {t.place}
                  </footer>
                </blockquote>
              ))}
            </div>
          </section>
        ) : null}

        {/* 11. prices */}
        <section className="section" id="prices">
          <div className="wrap">
            <div className="section-head center">
              <span className="eyebrow">{c.pricing.eyebrow}</span>
              <h2>{c.pricing.title}</h2>
              <p>{c.pricing.sub}</p>
            </div>
            <div className="plans">
              <article className="plan">
                <h3>{c.pricing.basic.name}</h3>
                <p className="plan-desc">{c.pricing.basic.desc}</p>
                <p className="price">{v.prices.basic}</p>
                <p className="price-note">{c.pricing.priceNote}</p>
                <ul>
                  {c.pricing.basic.features.map((f) => (
                    <li key={f} className="yes">
                      <Icon name="check" size={18} stroke={3} />
                      {f}
                    </li>
                  ))}
                </ul>
                <p className="plan-warning">
                  <Icon name="triangle-alert" size={18} stroke={2.4} /> {c.pricing.basic.missingTitle}
                </p>
                <ul style={{ marginTop: 10 }}>
                  {c.pricing.basic.missing.map((f) => (
                    <li key={f} className="no">
                      <Icon name="x" size={18} stroke={3} />
                      {f}
                    </li>
                  ))}
                </ul>
                <BuyButton href={v.checkout.basic} className="btn btn-secondary btn-block" event={event('basic')}>
                  {c.pricing.basic.cta}
                </BuyButton>
              </article>
              <article className="plan featured">
                <span className="plan-badge">{c.pricing.complete.badge}</span>
                <h3>{c.pricing.complete.name}</h3>
                <p className="plan-desc">{c.pricing.complete.desc}</p>
                <p className="price">{v.prices.complete}</p>
                <p className="price-note">{c.pricing.priceNote}</p>
                <ul>
                  {c.pricing.complete.features.map((f) => (
                    <li key={f} className="yes">
                      <Icon name="check" size={18} stroke={3} />
                      {f}
                    </li>
                  ))}
                </ul>
                <BuyButton href={v.checkout.complete} event={event('complete')}>
                  {c.pricing.complete.cta}
                </BuyButton>
              </article>
            </div>
            {missingCheckout ? <p className="checkout-missing">{ui.checkoutMissing}</p> : null}
            {v.prices.vatIncluded ? <p className="vat-note">{c.pricing.vatNote}</p> : null}
          </div>
        </section>

        {/* 12. guarantee */}
        <section className="section soft">
          <div className="wrap">
            <div className="guarantee">
              <div className="seal" aria-hidden="true">
                <div>
                  <b>{v.guaranteeDays}</b>
                  <span>{ui.labels.days}</span>
                </div>
              </div>
              <div>
                <h3>{c.guarantee.title}</h3>
                <p>{c.guarantee.text}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 13. faq */}
        <section className="section">
          <div className="wrap">
            <div className="section-head center">
              <span className="eyebrow">{c.faq.eyebrow}</span>
              <h2>{c.faq.title}</h2>
            </div>
            <div className="faq">
              {c.faq.items.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 14. final cta */}
        <section className="final">
          <div className="wrap">
            <h2>{c.finalCta.title}</h2>
            <p>{c.finalCta.text}</p>
            {toPrices(c.finalCta.cta)}
          </div>
        </section>
      </main>

      <Footer
        brand={v.brand}
        ui={ui}
        company={fillText(ui.footer.company, sv, 'legal.ui.footer.company')}
        email={sv.email}
        disclaimer={v.disclaimer}
        showPrices
      />
      <CookieConsent
        pixelId={v.pixelId}
        labels={ui.cookies}
        pageEvent={{ name: 'ViewContent', params: { content_ids: [v.id], content_type: 'product', content_name: v.examName } }}
      />
    </>
  );
}
