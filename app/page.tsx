import type { Metadata } from 'next';
import { CookieConsent } from '../site/components/CookieConsent.tsx';
import { Footer, Header, PreviewBanner } from '../site/components/Chrome.tsx';
import { Icon } from '../site/components/Icon.tsx';
import { allNiches, content, fillText, legalFor, MODE, nicheView, siteValues } from '../site/data.ts';

const LANGUAGE = 'en-GB';

export function generateMetadata(): Metadata {
  const v = siteValues(LANGUAGE);
  const ui = legalFor(LANGUAGE).ui;
  return { title: `${v.brand}: ${ui.home.title}`, description: ui.home.metaDescription };
}

export default function Home() {
  const legal = legalFor(LANGUAGE);
  const v = siteValues(LANGUAGE);
  const ui = legal.ui;
  const exams = allNiches().map(nicheView);
  return (
    <>
      {MODE === 'preview' ? <PreviewBanner text={ui.preview} /> : null}
      <Header brand={v.brand} />
      <main>
        <section className="hero">
          <div className="wrap">
            <div className="section-head">
              <h1>{ui.home.title}</h1>
              <p className="hero-sub">{ui.home.sub}</p>
            </div>
          </div>
        </section>
        <section className="section soft">
          <div className="wrap">
            <div className="section-head">
              <h2>{ui.home.examsTitle}</h2>
            </div>
            <div className="cards">
              {exams.map((e) => (
                <a key={e.id} className="card exam-card" href={`/${e.id}/`}>
                  {e.pages[0] ? <img src={e.pages[0].srcSmall} alt="" width={220} height={311} loading="lazy" /> : null}
                  <div>
                    <h3>{e.examName}</h3>
                    <p style={{ marginTop: 8 }}>{e.copy.meta.description}</p>
                    <p style={{ marginTop: 12, fontWeight: 700 }}>
                      {fillText(ui.home.cardMeta, { maps: e.counts.totalMaps, price: e.prices.basic }, 'ui.home.cardMeta')}
                    </p>
                    <span className="btn btn-primary" style={{ marginTop: 16 }}>
                      {ui.home.cardCta} <Icon name="arrow-right" size={18} stroke={2.6} />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer brand={v.brand} ui={ui} company={fillText(ui.footer.company, v, 'legal.ui.footer.company')} email={v.email} />
      <CookieConsent pixelId={content().site.metaPixelId} labels={ui.cookies} />
    </>
  );
}
