/**
 * Checks the built site (out/) like a visitor would, at phone and desktop widths:
 * no horizontal scroll, every image loads, no failed requests or console errors.
 *   npm run site:check            (after site:preview or site:build)
 *   ... -- --shots <folder>        also saves full-page screenshots
 */
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { loadContent, ROOT } from '../lib/content.ts';

const OUT = join(ROOT, 'out');
const shotsIndex = process.argv.indexOf('--shots');
const shots = shotsIndex >= 0 ? process.argv[shotsIndex + 1] : undefined;
const TYPES: Record<string, string> = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.txt': 'text/plain', '.json': 'application/json' };

if (!existsSync(OUT)) throw new Error('out/ is missing: run npm run site:preview first');

const server = createServer((req, res) => {
  let path = join(OUT, decodeURIComponent((req.url ?? '/').split('?')[0]));
  if (existsSync(path) && statSync(path).isDirectory()) path = join(path, 'index.html');
  if (!existsSync(path)) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' }).end(readFileSync(path));
}).listen(0);
const port = (server.address() as { port: number }).port;

const pages = ['/', '/privacy/', '/terms/', '/refund/', ...loadContent().niches.map((n) => `/${n.niche.id}/`)];

const browser = await chromium.launch();
let problems = 0;
for (const path of pages) {
  for (const width of [360, 390, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors: string[] = [];
    page.on('response', (r) => {
      if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
    });
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(`console: ${m.text()}`);
    });
    await page.goto(`http://localhost:${port}${path}`, { waitUntil: 'networkidle' });
    await page.evaluate("document.querySelectorAll('img').forEach((i) => { i.loading = 'eager'; })");
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
    const overflow = (await page.evaluate('document.documentElement.scrollWidth - window.innerWidth')) as number;
    const broken = (await page.evaluate("[...document.images].filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.currentSrc || i.src)")) as string[];
    const found = [...(overflow > 0 ? [`page is ${overflow}px wider than the screen`] : []), ...broken.map((b) => `image did not load: ${b}`), ...errors];
    if (found.length) {
      problems += found.length;
      console.error(`  ✗ ${path} @${width}px\n      - ${found.join('\n      - ')}`);
    } else console.log(`  ✓ ${path} @${width}px`);
    if (shots) await page.screenshot({ path: join(shots, `site${path.replace(/\//g, '_')}${width}.png`), fullPage: true });
    await page.close();
  }
}
await browser.close();
server.close();
if (problems) {
  console.error(`\n${problems} problem(s) found.`);
  process.exit(1);
}
console.log('\nSite check passed.');
