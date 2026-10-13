import { ShopShell } from '../site/components/Chrome.tsx';
import { legalFor } from '../site/data.ts';

export default function NotFound() {
  const ui = legalFor('en-GB').ui;
  return (
    <ShopShell>
      <main className="wrap legal">
        <h1>{ui.notFound.title}</h1>
        <p className="intro">{ui.notFound.text}</p>
        <p style={{ marginTop: 28 }}>
          <a className="btn btn-primary" href="/">
            {ui.notFound.cta}
          </a>
        </p>
      </main>
    </ShopShell>
  );
}
