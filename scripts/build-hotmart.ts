/**
 * Hotmart files for one niche: the two square product images (1200×1200) and the two zips to upload.
 * Run after `npm run build:pdfs` (it reads the release packages and map images in dist/).
 *
 *   npx tsx scripts/build-hotmart.ts --niche uk-hgv-theory --pages 2-03-breaks,3-04-load-securing-basics,5-01-blind-spots
 *
 * --pages: three map images (file names in dist/<niche>/maps/png without .png); the first one goes in the middle.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { loadContent } from '../lib/content.ts';
import { htmlDocument } from '../templates/map/render.ts';
import { brandLockup } from '../templates/shared/brand.ts';
import { esc } from '../templates/shared/html.ts';

const args = process.argv.slice(2);
const arg = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const nicheId = arg('--niche');
const pageNames = (arg('--pages') ?? '').split(',').filter(Boolean);
if (!nicheId || pageNames.length !== 3) throw new Error('usage: --niche <id> --pages <map1>,<map2>,<map3>');

const content = loadContent();
const n = content.niches.find((x) => x.niche.id === nicheId);
if (!n) throw new Error(`no niche "${nicheId}"`);
const verified = n.maps.filter((m) => m.data.review.status === 'verified');
const basic = verified.filter((m) => m.data.tier === 'basic');
const questions = verified.reduce((s, m) => s + m.data.onTheTest.length, 0);
const bonuses = n.bonuses.filter((b) => b.data.review.status === 'verified').length;
const areas = new Set(basic.map((m) => m.data.area)).size;

const dist = join('dist', n.niche.id);
const uri = (f: string) => {
  const p = join(dist, 'maps', 'png', `${f}.png`);
  if (!existsSync(p)) throw new Error(`${p} not found: run npm run build:pdfs first`);
  return `data:image/png;base64,${readFileSync(p).toString('base64')}`;
};
const pages = pageNames.map(uri);
const { primary, accent } = n.niche.theme;
const brand = content.site.brand.default;
const prefix = `${brand}-${n.niche.filePrefix}`;

const packs = [
  { id: 'complete', name: 'COMPLETE PACK', line: `${verified.length} maps · ${questions} practice questions · ${bonuses} bonuses` },
  { id: 'basic', name: 'BASIC PACK', line: `${basic.length} essential maps · all ${areas} areas` },
];

const css = `*{margin:0;padding:0;box-sizing:border-box}html,body{width:600px;height:600px}
.c{position:relative;width:600px;height:600px;overflow:hidden;background:${primary};color:#fff;padding:30px 36px;font-family:'Montserrat',sans-serif}
.pack{position:absolute;top:30px;right:36px;background:${accent};color:#14110a;font-weight:800;font-size:14px;letter-spacing:.06em;padding:8px 14px;border-radius:999px}
h1{margin-top:30px;font-weight:800;font-size:46px;line-height:1.02;letter-spacing:-.02em}
.t{margin-top:10px;font-weight:800;font-size:24px;color:${accent}}
.l{margin-top:14px;font-weight:700;font-size:16px;opacity:.95}
.pg{position:absolute;left:0;right:0;top:300px}.pg img{position:absolute;width:210px;border-radius:4px;box-shadow:0 16px 36px rgba(0,0,0,.35);background:#fff}
.p0{left:195px;top:0;z-index:3}.p1{left:30px;top:36px;transform:rotate(-8deg)}.p2{right:30px;top:36px;transform:rotate(8deg)}`;

mkdirSync('entrega', { recursive: true });
const browser = await chromium.launch().catch(() => chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium' }));
for (const p of packs) {
  const body = `<div class="c">${brandLockup(brand, 34)}<span class="pack">${p.name}</span>
  <h1>${esc(n.niche.examName)}</h1><p class="t">${esc('Visual revision maps')}</p><p class="l">${esc(p.line)}</p>
  <div class="pg">${pages.map((s, i) => `<img class="p${i}" src="${s}">`).join('')}</div></div>`;
  const page = await browser.newPage({ viewport: { width: 600, height: 600 }, deviceScaleFactor: 2 });
  await page.setContent(htmlDocument(n.niche.examName, body, css), { waitUntil: 'load' });
  await page.evaluate('document.fonts.ready');
  const file = join('entrega', `hotmart-${n.niche.filePrefix}-${p.id}.png`);
  await page.screenshot({ path: file });
  await page.close();
  console.log(`  ✓ ${file}`);

  const src = join(dist, 'packages', 'release', p.id);
  if (!existsSync(src)) throw new Error(`${src} not found: run npm run build:pdfs first`);
  const zip = join(process.cwd(), 'entrega', `${prefix}-${p.id === 'basic' ? 'Basic' : 'Complete'}.zip`);
  rmSync(zip, { force: true });
  execFileSync('zip', ['-qrX', zip, '.'], { cwd: src });
  console.log(`  ✓ ${zip}`);
}
await browser.close();
