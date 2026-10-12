import { Header } from '../site/components/Chrome.tsx';
import { legalFor, siteValues } from '../site/data.ts';

export default function NotFound() {
  const ui = legalFor('en-GB').ui;
  const v = siteValues('en-GB');
  return (
    <>
      <Header brand={v.brand} />
      <main className="wrap legal">
        <h1>{ui.notFound.title}</h1>
        <p className="intro">{ui.notFound.text}</p>
        <p style={{ marginTop: 28 }}>
          <a className="btn btn-primary" href="/">
            {ui.notFound.cta}
          </a>
        </p>
      </main>
    </>
  );
}
