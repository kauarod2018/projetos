/**
 * Renders every map to an A4 PDF + PNG + WebP, then assembles the packages.
 *
 *   npm run build:pdfs       → maps (drafts get a watermark) + packages with verified maps only
 *   npm run build:preview    → same, plus PREVIEW packages that include drafts (never sell these)
 *   ... -- --only <map-id>   → render a single map
 *   ... -- --debug-layout    → keep going when a page overflows and save <map>.OVERFLOW.png to inspect it
 *
 * Output: dist/<niche>/ (maps/pdf, maps/png, maps/webp, packages/, manifest.json)
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { chromium, type Browser, type Page } from 'playwright';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import { checkContent, mapCode } from '../lib/checks.ts';
import { ContentError, loadContent, ROOT, type LoadedMap, type LoadedNiche } from '../lib/content.ts';
import type { Site } from '../schemas/content.ts';
import { renderCreditsPage } from '../templates/credits/render.ts';
import { renderMapPage } from '../templates/map/render.ts';

const args = process.argv.slice(2);
const includeDrafts = args.includes('--include-drafts');
const onlyIndex = args.indexOf('--only');
const only = onlyIndex >= 0 ? args[onlyIndex + 1] : undefined;
/** development only: write the files even when a page overflows, so you can see what is wrong */
const debugLayout = args.includes('--debug-layout');

/** A4 at 96 dpi */
const A4 = { width: 794, height: 1123 };

const fileSlug = (s: string) =>
  s
    .replace(/&/g, 'and')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

async function launch(): Promise<Browser> {
  try {
    return await chromium.launch();
  } catch (err) {
    // cloud environments ship Chromium in /opt/pw-browsers; never run "playwright install" there
    const executablePath = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';
    console.warn(`Default Chromium failed (${(err as Error).message.split('\n')[0]}), trying ${executablePath}`);
    return chromium.launch({ executablePath });
  }
}

/**
 * Browser-side layout check, kept as plain text: tsx rewrites named functions with a helper
 * that does not exist inside the page. Returns everything that does not fit on its A4 page.
 */
const FIT_CHECK = `(() => {
  const problems = [];
  const px = (n) => Math.round(n) + 'px (~' + Math.round(n / 3.78) + 'mm)';
  const root = document.querySelector('.page');
  if (!root) return ['no .page element'];
  if (root.scrollHeight > root.clientHeight + 1) problems.push('content is ' + px(root.scrollHeight - root.clientHeight) + ' taller than the A4 page');
  for (const el of document.querySelectorAll('.content, .cr-main, [data-fit], .visual-body')) {
    const name = '.' + el.className.split(' ').join('.');
    if (el.scrollHeight > el.clientHeight + 1) problems.push(name + ' overflows by ' + px(el.scrollHeight - el.clientHeight));
    if (el.scrollWidth > el.clientWidth + 1) problems.push(name + ' is ' + px(el.scrollWidth - el.clientWidth) + ' too wide');
  }
  const foot = document.querySelector('.foot, .cr-foot');
  if (foot && foot.getBoundingClientRect().bottom > root.getBoundingClientRect().bottom + 0.5) problems.push('the footer is pushed off the page');
  return problems;
})()`;

const WAIT_FOR_ASSETS = `(async () => {
  await document.fonts.ready;
  await Promise.all([...document.images].map((img) => img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; })));
})()`;

async function renderPage(page: Page, html: string): Promise<{ pdf: Buffer; png: Buffer; problems: string[] }> {
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(WAIT_FOR_ASSETS);
  const problems = (await page.evaluate(FIT_CHECK)) as string[];
  const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
  const pages = (await PDFDocument.load(pdf)).getPageCount();
  if (pages !== 1) problems.push(`the PDF has ${pages} pages instead of 1`);
  const png = await page.locator('.page').screenshot({ type: 'png' });
  return { pdf, png, problems };
}

interface BuiltMap {
  map: LoadedMap;
  code: string;
  pdf: Buffer;
  files: { pdf: string; png: string; webp: string };
}

async function assemble(
  n: LoadedNiche,
  site: Site,
  page: Page,
  built: BuiltMap[],
  opts: { title: string; subtitle: string; file: string; preview: boolean },
  outDir: string,
) {
  const credits = await renderPage(
    page,
    renderCreditsPage(n, site, { title: opts.title, subtitle: opts.subtitle, maps: built.map((b) => b.map), preview: opts.preview, year: new Date().getFullYear() }),
  );
  if (credits.problems.length) throw new Error(`credits page for ${opts.file}: ${credits.problems.join('; ')}`);

  const doc = await PDFDocument.create();
  for (const part of [credits.pdf, ...built.map((b) => b.pdf)]) {
    const src = await PDFDocument.load(part);
    for (const p of await doc.copyPages(src, src.getPageIndices())) doc.addPage(p);
  }
  doc.setTitle(`${opts.title}${opts.preview ? ' (PREVIEW)' : ''}`);
  doc.setSubject(`${n.niche.examName} · ${opts.subtitle}`);
  doc.setAuthor(site.brandName);
  doc.setCreator(site.brandName);
  doc.setProducer(`${site.brandName} content pipeline v${n.niche.content.version}`);
  doc.setLanguage(n.niche.language);
  const bytes = await doc.save();
  writeFileSync(join(outDir, opts.file), bytes);
  return { file: join(basename(outDir), opts.file), preview: opts.preview, pages: doc.getPageCount(), maps: built.map((b) => b.code) };
}

async function buildNiche(n: LoadedNiche, site: Site, browser: Browser) {
  const out = join(ROOT, 'dist', n.niche.id);
  const dirs = { pdf: join(out, 'maps', 'pdf'), png: join(out, 'maps', 'png'), webp: join(out, 'maps', 'webp'), packages: join(out, 'packages') };
  if (!only) rmSync(out, { recursive: true, force: true });
  for (const d of Object.values(dirs)) mkdirSync(d, { recursive: true });

  const areaPos = (m: LoadedMap) => n.niche.areas.findIndex((a) => a.slug === m.data.area);
  const maps = n.maps
    .filter((m) => !only || m.data.id === only)
    .sort((a, b) => areaPos(a) - areaPos(b) || a.data.order - b.data.order);
  if (only && maps.length === 0) throw new Error(`no map with id "${only}"`);

  const context = await browser.newContext({ viewport: A4, deviceScaleFactor: 2 });
  const page = await context.newPage();
  const built: BuiltMap[] = [];
  const failures: string[] = [];

  for (const m of maps) {
    const code = mapCode(n, m);
    const base = `${code.replace('.', '-')}-${m.data.id}`;
    const { pdf, png, problems } = await renderPage(page, renderMapPage(n, m, site));
    if (problems.length && debugLayout) {
      writeFileSync(join(dirs.png, `${base}.OVERFLOW.png`), png);
      console.warn(`  ! ${code} ${m.data.id} overflows: ${problems.join('; ')}`);
      continue;
    }
    if (problems.length) {
      failures.push(`${m.data.id} (${code}) does not fit on one A4 page:\n      - ${problems.join('\n      - ')}\n      Shorten the text or split the topic into two maps (never shrink the font).`);
      continue;
    }
    const files = { pdf: join(dirs.pdf, `${base}.pdf`), png: join(dirs.png, `${base}.png`), webp: join(dirs.webp, `${base}.webp`) };
    writeFileSync(files.pdf, pdf);
    writeFileSync(files.png, png);
    await sharp(png).resize({ width: 1200 }).webp({ quality: 82 }).toFile(files.webp);
    built.push({ map: m, code, pdf, files });
    console.log(`  ✓ ${code} ${m.data.title}${m.data.review.status === 'verified' ? '' : '  [DRAFT]'}`);
  }

  if (failures.length) {
    await context.close();
    throw new Error(`${failures.length} map(s) failed:\n  ✗ ${failures.join('\n  ✗ ')}`);
  }

  const packages: Awaited<ReturnType<typeof assemble>>[] = [];
  if (!only) {
    const sets: { preview: boolean; maps: BuiltMap[] }[] = [{ preview: false, maps: built.filter((b) => b.map.data.review.status === 'verified') }];
    if (includeDrafts) sets.push({ preview: true, maps: built });

    for (const set of sets) {
      if (set.maps.length === 0) {
        console.log(
          set.preview
            ? '  · no maps to preview'
            : `  · release packages skipped: no verified maps yet${includeDrafts ? ' (PREVIEW packages below include the drafts)' : ' (npm run build:preview makes a draft preview)'}`,
        );
        continue;
      }
      const suffix = set.preview ? '-PREVIEW' : '';
      const dir = join(dirs.packages, set.preview ? 'preview' : 'release');
      mkdirSync(join(dir, 'complete'), { recursive: true });
      mkdirSync(join(dir, 'basic'), { recursive: true });
      const p = n.niche.filePrefix;

      for (const [i, area] of n.niche.areas.entries()) {
        const areaMaps = set.maps.filter((b) => b.map.data.area === area.slug);
        if (!areaMaps.length) continue;
        packages.push(
          await assemble(n, site, page, areaMaps, {
            title: `Area ${i + 1}: ${area.name}`,
            subtitle: 'Complete pack',
            file: join('complete', `${p}-Area-${i + 1}-${fileSlug(area.name)}${suffix}.pdf`),
            preview: set.preview,
          }, dir),
        );
      }
      packages.push(
        await assemble(n, site, page, set.maps, { title: `${n.niche.examName}: all maps`, subtitle: 'Complete pack', file: join('complete', `${p}-All-Maps${suffix}.pdf`), preview: set.preview }, dir),
      );
      const basic = set.maps.filter((b) => b.map.data.tier === 'basic');
      if (basic.length) {
        packages.push(
          await assemble(n, site, page, basic, { title: `${n.niche.examName}: essential maps`, subtitle: 'Basic pack', file: join('basic', `${p}-Basic${suffix}.pdf`), preview: set.preview }, dir),
        );
      }
    }
  }
  await context.close();

  const verified = built.filter((b) => b.map.data.review.status === 'verified');
  const manifest = {
    niche: n.niche.id,
    contentVersion: n.niche.content.version,
    generatedAt: new Date().toISOString(),
    counts: {
      maps: built.length,
      verifiedMaps: verified.length,
      basicMaps: verified.filter((b) => b.map.data.tier === 'basic').length,
      completeMaps: verified.length,
      byArea: Object.fromEntries(n.niche.areas.map((a) => [a.slug, verified.filter((b) => b.map.data.area === a.slug).length])),
      areas: n.niche.areas.length,
      bonuses: 0,
    },
    maps: built.map((b) => ({
      id: b.map.data.id,
      code: b.code,
      title: b.map.data.title,
      area: b.map.data.area,
      tier: b.map.data.tier,
      status: b.map.data.review.status,
      pdf: b.files.pdf.replace(`${out}/`, ''),
      png: b.files.png.replace(`${out}/`, ''),
      webp: b.files.webp.replace(`${out}/`, ''),
    })),
    packages,
  };
  if (!only) writeFileSync(join(out, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`\n${n.niche.id}: ${built.length} map(s) rendered (${verified.length} verified), ${packages.length} package file(s) → dist/${n.niche.id}/`);
}

async function main() {
  const content = loadContent();
  const { errors } = checkContent(content, { release: false });
  if (errors.length) throw new ContentError(errors);
  const browser = await launch();
  try {
    for (const n of content.niches) await buildNiche(n, content.site, browser);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  if (err instanceof ContentError) {
    for (const p of err.problems) console.error(`  ✗ ${p}`);
    console.error('\nFix the content errors above (npm run validate).');
  } else {
    console.error(`\nBuild failed: ${(err as Error).message}`);
  }
  process.exit(1);
});
