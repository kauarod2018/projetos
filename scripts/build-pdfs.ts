/**
 * Renders every map and bonus to PDF + PNG + WebP, then assembles the packages.
 *
 *   npm run build:pdfs       → maps and bonuses (drafts watermarked) + packages with verified content only
 *   npm run build:preview    → same, plus PREVIEW packages with the drafts (never sell these)
 *   ... -- --only <map-id>   → render a single map
 *   ... -- --debug-layout    → keep going when a page overflows and save <file>.OVERFLOW.png to inspect it
 *
 * Output: dist/<niche>/ (maps/, bonuses/, packages/release, packages/preview, manifest.json)
 */
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { chromium, type Browser, type Page } from 'playwright';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import { checkContent, mapCode } from '../lib/checks.ts';
import { ContentError, loadContent, ROOT, type LoadedBonus, type LoadedMap, type LoadedNiche } from '../lib/content.ts';
import { brandName, type Sign, type Site } from '../schemas/content.ts';
import { renderBonusDocument, type BonusContext, type PlanMap } from '../templates/bonus/render.ts';
import { renderFlashcardsA4, renderFlashcardsPhone } from '../templates/bonus/flashcards.ts';
import { renderCreditsPage } from '../templates/credits/render.ts';
import { COVER_SIZE, renderProductCover } from '../templates/cover/render.ts';
import { renderMapPage } from '../templates/map/render.ts';
import { pad2 } from '../templates/shared/html.ts';

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
 * that does not exist inside the page. Checks every .page and returns what does not fit.
 */
const FIT_CHECK = `(() => {
  const problems = [];
  const px = (n) => Math.round(n) + 'px (~' + Math.round(n / 3.78) + 'mm)';
  const pages = [...document.querySelectorAll('.page')];
  if (!pages.length) return ['no .page element'];
  pages.forEach((root, i) => {
    const where = pages.length > 1 ? 'page ' + (i + 1) + ': ' : '';
    if (root.scrollHeight > root.clientHeight + 1) problems.push(where + 'content is ' + px(root.scrollHeight - root.clientHeight) + ' taller than the page');
    for (const el of root.querySelectorAll('.content, .cr-main, .bn-main, .card, [data-fit], .visual-body')) {
      const name = '.' + el.className.split(' ').join('.');
      if (el.scrollHeight > el.clientHeight + 1) problems.push(where + name + ' overflows by ' + px(el.scrollHeight - el.clientHeight));
      if (el.scrollWidth > el.clientWidth + 1) problems.push(where + name + ' is ' + px(el.scrollWidth - el.clientWidth) + ' too wide');
    }
    const foot = root.querySelector('.foot, .cr-foot');
    if (foot && foot.getBoundingClientRect().bottom > root.getBoundingClientRect().bottom + 0.5) problems.push(where + 'the footer is pushed off the page');
  });
  return problems;
})()`;

const WAIT_FOR_ASSETS = `(async () => {
  await document.fonts.ready;
  await Promise.all([...document.images].map((img) => img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; })));
})()`;

interface Rendered {
  pdf: Buffer;
  /** PNG of the first page */
  png: Buffer;
  pages: number;
  problems: string[];
}

async function render(page: Page, html: string): Promise<Rendered> {
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(WAIT_FOR_ASSETS);
  const problems = (await page.evaluate(FIT_CHECK)) as string[];
  const expected = await page.locator('.page').count();
  const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
  const pages = (await PDFDocument.load(pdf)).getPageCount();
  if (pages !== expected) problems.push(`the PDF has ${pages} pages instead of ${expected}`);
  const png = await page.locator('.page').first().screenshot({ type: 'png' });
  return { pdf, png, pages, problems };
}

async function writeImages(png: Buffer, pngPath: string, webpPath: string) {
  writeFileSync(pngPath, png);
  await sharp(png).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 82 }).toFile(webpPath);
}

async function merge(parts: Buffer[], meta: { title: string; subject: string; author: string; language: string; producer: string }) {
  const doc = await PDFDocument.create();
  for (const part of parts) {
    const src = await PDFDocument.load(part);
    for (const p of await doc.copyPages(src, src.getPageIndices())) doc.addPage(p);
  }
  doc.setTitle(meta.title);
  doc.setSubject(meta.subject);
  doc.setAuthor(meta.author);
  doc.setCreator(meta.author);
  doc.setProducer(meta.producer);
  doc.setLanguage(meta.language);
  return { bytes: await doc.save(), pages: doc.getPageCount() };
}

interface BuiltMap {
  map: LoadedMap;
  code: string;
  pdf: Buffer;
  files: { pdf: string; png: string; webp: string };
}

interface BuiltBonus {
  bonus: LoadedBonus;
  /** file name base, e.g. "1-hazard-perception-guide" */
  base: string;
  files: { pdf: string; phonePdf?: string; png: string; webp: string };
  pages: number;
  release?: { pdf: string; phonePdf?: string; png: string; webp: string };
}

async function buildNiche(n: LoadedNiche, site: Site, browser: Browser) {
  const out = join(ROOT, 'dist', n.niche.id);
  const dir = {
    mapPdf: join(out, 'maps', 'pdf'),
    mapPng: join(out, 'maps', 'png'),
    mapWebp: join(out, 'maps', 'webp'),
    bonusPdf: join(out, 'bonuses', 'pdf'),
    bonusPng: join(out, 'bonuses', 'png'),
    bonusWebp: join(out, 'bonuses', 'webp'),
    bonusRelease: join(out, 'bonuses', 'release'),
    packages: join(out, 'packages'),
  };
  if (!only) rmSync(out, { recursive: true, force: true });
  for (const d of Object.values(dir)) mkdirSync(d, { recursive: true });

  const brand = brandName(site, n.niche.language);
  const r = (p: string) => relative(out, p);
  const areaPos = (area: string) => n.niche.areas.findIndex((a) => a.slug === area);
  const maps = n.maps
    .filter((m) => !only || m.data.id === only)
    .sort((a, b) => areaPos(a.data.area) - areaPos(b.data.area) || a.data.order - b.data.order);
  if (only && maps.length === 0) throw new Error(`no map with id "${only}"`);

  const context = await browser.newContext({ viewport: A4, deviceScaleFactor: 2 });
  const page = await context.newPage();
  const failures: string[] = [];
  const fail = (what: string, problems: string[]) =>
    failures.push(`${what} does not fit its page:\n      - ${problems.join('\n      - ')}\n      Shorten the text or split the content (never shrink the font).`);

  // ---------- maps ----------
  const built: BuiltMap[] = [];
  for (const m of maps) {
    const code = mapCode(n, m);
    const base = `${code.replace('.', '-')}-${m.data.id}`;
    const res = await render(page, renderMapPage(n, m, site));
    if (res.problems.length) {
      if (debugLayout) {
        writeFileSync(join(dir.mapPng, `${base}.OVERFLOW.png`), res.png);
        console.warn(`  ! ${code} ${m.data.id} overflows: ${res.problems.join('; ')}`);
      } else fail(`map ${m.data.id} (${code})`, res.problems);
      continue;
    }
    const files = { pdf: join(dir.mapPdf, `${base}.pdf`), png: join(dir.mapPng, `${base}.png`), webp: join(dir.mapWebp, `${base}.webp`) };
    writeFileSync(files.pdf, res.pdf);
    await writeImages(res.png, files.png, files.webp);
    built.push({ map: m, code, pdf: res.pdf, files });
    console.log(`  ✓ map ${code} ${m.data.title}${m.data.review.status === 'verified' ? '' : '  [DRAFT]'}`);
  }

  // ---------- bonuses ----------
  const signFile = (s: Sign) => {
    if (s.status !== 'official' || !s.file) return undefined;
    const type = s.file.endsWith('.svg') ? 'image/svg+xml' : s.file.endsWith('.png') ? 'image/png' : 'image/jpeg';
    return `data:${type};base64,${readFileSync(join(n.signsDir, s.file)).toString('base64')}`;
  };
  const planned: PlanMap[] = [...n.inventory.maps]
    .sort((a, b) => areaPos(a.area) - areaPos(b.area) || a.order - b.order)
    .map((p) => ({ code: `${areaPos(p.area) + 1}.${pad2(p.order)}`, title: p.title }));
  const verifiedMaps = built.filter((b) => b.map.data.review.status === 'verified');
  /** review copies show the full plan and every number, always watermarked */
  const previewCtx: BonusContext = { maps: planned, numbers: n.numbers.items, preview: true, signFile };
  /** the copy that is sold: only verified maps and numbers */
  const releaseCtx: BonusContext = {
    maps: verifiedMaps.map((b) => ({ code: b.code, title: b.map.data.title })),
    numbers: n.numbers.items.filter((i) => i.review.status === 'verified'),
    preview: false,
    signFile,
  };

  const bonuses: BuiltBonus[] = [];
  if (!only) {
    for (const b of [...n.bonuses].sort((x, y) => x.data.number - y.data.number)) {
      const base = `${b.data.number}-${b.data.id}`;
      const renderAll = async (ctx: BonusContext) => {
        if (b.data.kind === 'flashcards') {
          const a4 = await render(page, renderFlashcardsA4(n, b, site, ctx));
          const phone = await render(page, renderFlashcardsPhone(n, b, site, ctx));
          return { main: a4, phone, problems: [...a4.problems, ...phone.problems.map((p) => `phone ${p}`)] };
        }
        const doc = await render(page, renderBonusDocument(n, b, site, ctx));
        return { main: doc, phone: undefined, problems: doc.problems };
      };

      const preview = await renderAll(previewCtx);
      if (preview.problems.length) {
        if (debugLayout) {
          writeFileSync(join(dir.bonusPng, `${base}.OVERFLOW.png`), preview.main.png);
          console.warn(`  ! bonus ${b.data.number} ${b.data.id} overflows: ${preview.problems.join('; ')}`);
        } else fail(`bonus ${b.data.id}`, preview.problems);
        continue;
      }
      const files: BuiltBonus['files'] = {
        pdf: join(dir.bonusPdf, `${base}.pdf`),
        png: join(dir.bonusPng, `${base}.png`),
        webp: join(dir.bonusWebp, `${base}.webp`),
      };
      writeFileSync(files.pdf, preview.main.pdf);
      if (preview.phone) {
        files.phonePdf = join(dir.bonusPdf, `${base}-phone.pdf`);
        writeFileSync(files.phonePdf, preview.phone.pdf);
      }
      await writeImages(preview.main.png, files.png, files.webp);
      const entry: BuiltBonus = { bonus: b, base, files, pages: preview.main.pages };

      if (b.data.review.status === 'verified') {
        const rel = await renderAll(releaseCtx);
        if (rel.problems.length) fail(`bonus ${b.data.id} (release copy)`, rel.problems);
        else {
          entry.release = {
            pdf: join(dir.bonusRelease, `${base}.pdf`),
            png: join(dir.bonusRelease, `${base}.png`),
            webp: join(dir.bonusRelease, `${base}.webp`),
          };
          writeFileSync(entry.release.pdf, rel.main.pdf);
          if (rel.phone) {
            entry.release.phonePdf = join(dir.bonusRelease, `${base}-phone.pdf`);
            writeFileSync(entry.release.phonePdf, rel.phone.pdf);
          }
          await writeImages(rel.main.png, entry.release.png, entry.release.webp);
        }
      }
      bonuses.push(entry);
      console.log(`  ✓ bonus ${b.data.number} ${b.data.title} (${preview.main.pages} p.)${b.data.review.status === 'verified' ? '' : '  [DRAFT]'}`);
    }
  }

  if (failures.length) {
    await context.close();
    throw new Error(`${failures.length} file(s) failed:\n  ✗ ${failures.join('\n  ✗ ')}`);
  }

  // ---------- packages ----------
  const packages: { file: string; preview: boolean; pages: number; maps: string[] }[] = [];
  const covers: Record<string, string> = {};

  // ---------- product cover for the shop ----------
  if (!only) {
    const sold = verifiedMaps.length ? verifiedMaps : built;
    const coverPages = n.sales.gallery.maps
      .map((id) => sold.find((b) => b.map.data.id === id))
      .filter((b) => b !== undefined)
      .map((b) => b.files.png);
    const html = renderProductCover(n, site, {
      pages: coverPages,
      counts: {
        maps: sold.length,
        questions: sold.reduce((sum, b) => sum + b.map.data.onTheTest.length, 0),
        bonuses: (verifiedMaps.length ? bonuses.filter((b) => b.release) : bonuses).length,
      },
    });
    const previous = page.viewportSize();
    await page.setViewportSize(COVER_SIZE);
    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluate(WAIT_FOR_ASSETS);
    const png = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, ...COVER_SIZE } });
    if (previous) await page.setViewportSize(previous);
    mkdirSync(join(out, 'covers'), { recursive: true });
    await writeImages(png, join(out, 'covers', 'product.png'), join(out, 'covers', 'product.webp'));
    covers.product = r(join(out, 'covers', 'product.webp'));
    console.log('  ✓ product cover');
  }
  const assemble = async (set: BuiltMap[], opts: { title: string; subtitle: string; file: string; preview: boolean; root: string; covers?: boolean }) => {
    const credits = await render(
      page,
      renderCreditsPage(n, site, { title: opts.title, subtitle: opts.subtitle, maps: set.map((b) => b.map), preview: opts.preview, year: new Date().getFullYear() }),
    );
    if (credits.problems.length) throw new Error(`credits page for ${opts.file}: ${credits.problems.join('; ')}`);
    // the shop shows the cover and the contents page of the main pack next to the sample maps
    if (opts.covers) {
      mkdirSync(join(out, 'covers'), { recursive: true });
      for (const [i, name] of ['cover', 'contents'].entries()) {
        const png = await page.locator('.page').nth(i).screenshot({ type: 'png' });
        await writeImages(png, join(out, 'covers', `${name}.png`), join(out, 'covers', `${name}.webp`));
        covers[name] = r(join(out, 'covers', `${name}.webp`));
      }
    }
    const { bytes, pages } = await merge([credits.pdf, ...set.map((b) => b.pdf)], {
      title: `${opts.title}${opts.preview ? ' (PREVIEW)' : ''}`,
      subject: `${n.niche.examName} · ${opts.subtitle}`,
      author: brand,
      language: n.niche.language,
      producer: `${brand} content pipeline v${n.niche.content.version}`,
    });
    writeFileSync(join(opts.root, opts.file), bytes);
    packages.push({ file: r(join(opts.root, opts.file)), preview: opts.preview, pages, maps: set.map((b) => b.code) });
  };

  if (!only) {
    const sets = [{ preview: false, maps: verifiedMaps, bonuses: bonuses.filter((b) => b.release) }];
    if (includeDrafts) sets.push({ preview: true, maps: built, bonuses });

    for (const set of sets) {
      const root = join(dir.packages, set.preview ? 'preview' : 'release');
      const suffix = set.preview ? '-PREVIEW' : '';
      const p = n.niche.filePrefix;
      if (set.maps.length === 0) {
        console.log(
          set.preview
            ? '  · no maps to preview'
            : `  · release packages skipped: no verified maps yet${includeDrafts ? ' (the PREVIEW packages include the drafts)' : ' (npm run build:preview makes a draft preview)'}`,
        );
        continue;
      }
      mkdirSync(join(root, 'complete', 'bonuses'), { recursive: true });
      mkdirSync(join(root, 'basic'), { recursive: true });
      for (const [i, area] of n.niche.areas.entries()) {
        const areaMaps = set.maps.filter((b) => b.map.data.area === area.slug);
        if (!areaMaps.length) continue;
        await assemble(areaMaps, {
          title: `Area ${i + 1}: ${area.name}`,
          subtitle: 'Complete pack',
          file: join('complete', `${p}-Area-${i + 1}-${fileSlug(area.name)}${suffix}.pdf`),
          preview: set.preview,
          root,
        });
      }
      await assemble(set.maps, {
        title: `${n.niche.examName}: all maps`,
        subtitle: 'Complete pack',
        file: join('complete', `${p}-All-Maps${suffix}.pdf`),
        preview: set.preview,
        root,
        // release covers win; preview covers are used only while nothing is verified
        covers: !set.preview || verifiedMaps.length === 0,
      });
      const basic = set.maps.filter((b) => b.map.data.tier === 'basic');
      if (basic.length) {
        await assemble(basic, { title: `${n.niche.examName}: essential maps`, subtitle: 'Basic pack', file: join('basic', `${p}-Basic${suffix}.pdf`), preview: set.preview, root });
      }
      // bonuses are part of the Complete pack only
      for (const b of set.bonuses) {
        const src = set.preview ? b.files : b.release!;
        const name = `${p}-Bonus-${b.bonus.data.number}-${fileSlug(b.bonus.data.title)}${suffix}`;
        copyFileSync(src.pdf, join(root, 'complete', 'bonuses', `${name}.pdf`));
        if (src.phonePdf) copyFileSync(src.phonePdf, join(root, 'complete', 'bonuses', `${name}-Phone.pdf`));
      }
    }
  }
  await context.close();

  // ---------- manifest: the numbers the sales page is allowed to show ----------
  const releaseBonuses = bonuses.filter((b) => b.release);
  const manifest = {
    niche: n.niche.id,
    contentVersion: n.niche.content.version,
    generatedAt: new Date().toISOString(),
    counts: {
      maps: built.length,
      verifiedMaps: verifiedMaps.length,
      basicMaps: verifiedMaps.filter((b) => b.map.data.tier === 'basic').length,
      completeMaps: verifiedMaps.length,
      byArea: Object.fromEntries(n.niche.areas.map((a) => [a.slug, verifiedMaps.filter((b) => b.map.data.area === a.slug).length])),
      areas: n.niche.areas.length,
      bonuses: releaseBonuses.length,
      plannedMaps: n.inventory.maps.length,
      plannedBasicMaps: n.inventory.maps.filter((m) => m.tier === 'basic').length,
      plannedBonuses: n.bonuses.length,
    },
    maps: built.map((b) => ({
      id: b.map.data.id,
      code: b.code,
      title: b.map.data.title,
      area: b.map.data.area,
      tier: b.map.data.tier,
      status: b.map.data.review.status,
      pdf: r(b.files.pdf),
      png: r(b.files.png),
      webp: r(b.files.webp),
    })),
    bonuses: bonuses.map((b) => ({
      id: b.bonus.data.id,
      number: b.bonus.data.number,
      title: b.bonus.data.title,
      summary: b.bonus.data.summary,
      status: b.release ? 'verified' : 'draft',
      pages: b.pages,
      preview: { pdf: r(b.files.pdf), png: r(b.files.png), webp: r(b.files.webp), ...(b.files.phonePdf ? { phonePdf: r(b.files.phonePdf) } : {}) },
      ...(b.release ? { release: { pdf: r(b.release.pdf), png: r(b.release.png), webp: r(b.release.webp) } } : {}),
    })),
    packages,
    covers,
  };
  if (!only) writeFileSync(join(out, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(
    `\n${n.niche.id}: ${built.length} map(s) (${verifiedMaps.length} verified), ${bonuses.length} bonus(es) (${releaseBonuses.length} verified), ${packages.length} package file(s) → dist/${n.niche.id}/`,
  );
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

