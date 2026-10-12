import type { Metadata } from 'next';
import { CookieConsent } from './components/CookieConsent.tsx';
import { Footer, Header, PreviewBanner } from './components/Chrome.tsx';
import { allNiches, content, fillText, legalFor, MODE, siteValues } from './data.ts';
import { formatDate } from '../templates/shared/html.ts';

const LANGUAGE = 'en-GB';
type Kind = 'privacy' | 'terms' | 'refund';

function values() {
  // the guarantee and update policy come from the niches; the build fails if they disagree
  const niches = allNiches().filter((n) => n.niche.language === LANGUAGE);
  const days = new Set(niches.map((n) => n.niche.guaranteeDays));
  if (days.size > 1) throw new Error('legal pages: niches in the same language have different guarantee periods');
  return siteValues(LANGUAGE, niches[0]?.niche.guaranteeDays, niches[0]?.niche.updatePolicy);
}

export function legalMetadata(kind: Kind): Metadata {
  const page = legalFor(LANGUAGE)[kind];
  const v = values();
  return { title: `${page.title} | ${v.brand}`, description: fillText(page.intro, v, `legal.${kind}.intro`).slice(0, 160) };
}

export function LegalPage({ kind }: { kind: Kind }) {
  const legal = legalFor(LANGUAGE);
  const page = legal[kind];
  const v = values();
  const f = (s: string, where: string) => fillText(s, v, `legal.${kind}.${where}`);
  return (
    <>
      {MODE === 'preview' ? <PreviewBanner text={legal.ui.preview} /> : null}
      <Header brand={v.brand} />
      <main className="wrap">
        <article className="legal">
          <h1>{page.title}</h1>
          <p className="updated">{fillText(legal.ui.lastUpdated, { date: formatDate(legal.updated, LANGUAGE) }, 'ui.lastUpdated')}</p>
          <p className="intro">{f(page.intro, 'intro')}</p>
          {page.sections.map((s, i) => (
            <section key={i}>
              <h2>{f(s.h, `sections[${i}].h`)}</h2>
              {s.p.map((p, j) => (
                <p key={j}>{f(p, `sections[${i}].p[${j}]`)}</p>
              ))}
            </section>
          ))}
        </article>
      </main>
      <Footer brand={v.brand} ui={legal.ui} company={f(legal.ui.footer.company, 'ui.footer.company')} email={v.email} />
      <CookieConsent pixelId={content().site.metaPixelId} labels={legal.ui.cookies} />
    </>
  );
}
