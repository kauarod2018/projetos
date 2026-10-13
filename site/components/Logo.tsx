/**
 * The HelpTest logo: a page with a folded corner and a gold tick, then the word mark.
 * The page outline uses currentColor so the same mark works on white (navy) and on navy (white).
 */
const TICK = 'M285 578L331 546L397 620C470 528 600 410 747 365C650 408 495 565 398 716Z';

export function LogoMark({ size = 32, id = 'lm' }: { size?: number; id?: string }) {
  return (
    <svg className="logo-mark" viewBox="200 314 550 488" width={(size * 550) / 488} height={size} aria-hidden="true" focusable="false">
      <defs>
        {/* the tick cuts a small gap into the page's right edge, as in the original artwork */}
        <mask id={id} maskUnits="userSpaceOnUse" x="196" y="310" width="560" height="500">
          <rect x="196" y="310" width="560" height="500" fill="#fff" />
          <path d={TICK} fill="#000" stroke="#000" strokeWidth="44" strokeLinejoin="round" />
        </mask>
      </defs>
      <g fill="none" stroke="currentColor" strokeWidth="33" mask={`url(#${id})`}>
        <path d="M219.5 781.5V333.5H458L554.5 430V781.5Z" />
        <path d="M454.5 350V431.5H540" />
      </g>
      <path d={TICK} fill="var(--gold, #c9a23f)" />
    </svg>
  );
}

/** "Help" + "Test" in the logo's two colours; the brand name is split before "Test" */
export function Wordmark({ brand }: { brand: string }) {
  const i = brand.search(/test/i);
  if (i <= 0) return <span className="wordmark">{brand}</span>;
  return (
    <span className="wordmark">
      {brand.slice(0, i)}
      <span className="wordmark-accent">{brand.slice(i)}</span>
    </span>
  );
}

export function Logo({ brand, id }: { brand: string; id?: string }) {
  return (
    <a className="logo" href="/" aria-label={`${brand}: home`}>
      <LogoMark id={id} />
      <Wordmark brand={brand} />
    </a>
  );
}
