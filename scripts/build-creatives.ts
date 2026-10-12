/**
 * Ad carousel creatives (1080×1080 and 1080×1350) made from the real rendered pages.
 *   npm run creatives            → preview: numbers from the plan, every slide tagged PREVIEW (never use in ads)
 *   npm run creatives:release    → only verified maps and real counts; fails if a slide needs a draft map
 * Run after build:pdfs / build:preview. Output: dist/<niche>/creatives/<size>/slide-N.png
 */
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { loadContent, ROOT } from '../lib/content.ts';
import { icon } from '../lib/icons.ts';
import { copyValues, fillDeep, type Mode } from '../site/data.ts';
import { esc } from '../templates/shared/html.ts';

const mode: Mode = process.argv.includes('--release') ? 'release' : 'preview';
const SIZES = [
  { name: '1080x1080', width: 1080, height: 1080 },
  { name: '1080x1350', width: 1080, height: 1350 },
];

const font = (file: string) => readFileSync(join(ROOT, 'node_modules', file)).toString('base64');
const FONTS = `
@font-face{font-family:'Archivo';font-weight:100 900;font-stretch:62% 125%;src:url(data:font/woff2;base64,${font('@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2')}) format('woff2');}
@font-face{font-family:'Atkinson';font-weight:400;src:url(data:font/woff2;base64,${font('@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-normal.woff2')}) format('woff2');}
@font-face{font-family:'Atkinson';font-weight:700;src:url(data:font/woff2;base64,${font('@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-700-normal.woff2')}) format('woff2');}`;

const CSS = `
*{box-sizing:border-box;margin:0}
body{width:var(--w);height:var(--h);overflow:hidden;font-family:'Atkinson',sans-serif;color:#16181d}
.slide{position:relative;width:100%;height:100%;display:flex;flex-direction:column;padding:72px;background:#f6f5f1}
.slide.dark{background:#0b6e4f;color:#fff}
.brand{display:flex;align-items:center;gap:14px;font-family:'Archivo';font-weight:800;font-size:34px}
.mark{width:46px;height:46px;border-radius:12px;background:#0b6e4f;display:grid;place-items:center}
.dark .mark{background:#fff}
.mark i{display:block;width:24px;height:5px;background:repeating-linear-gradient(90deg,#ffc93c 0 8px,transparent 8px 12px)}
.count{margin-left:auto;font-family:'Archivo';font-weight:700;font-size:26px;opacity:.6}
.eyebrow{margin-top:56px;font-family:'Archivo';font-weight:800;font-size:28px;letter-spacing:.1em;text-transform:uppercase;color:#0b6e4f}
.dark .eyebrow{color:#ffc93c}
h1{font-family:'Archivo';font-weight:800;font-stretch:90%;font-size:86px;line-height:1.02;letter-spacing:-.02em;margin-top:20px}
.page h1{font-size:70px;margin-top:40px}
p.text{margin-top:22px;font-size:36px;line-height:1.3;max-width:900px}
.dark p.text{opacity:.95}
.stat{margin-top:auto;font-family:'Archivo';font-weight:800;font-size:220px;line-height:.9;letter-spacing:-.04em;color:#ffc93c}
.source{margin-top:24px;font-size:24px;opacity:.75}
.thumbs{margin-top:44px;flex:1;min-height:0;display:flex;gap:22px;align-items:flex-start}
.thumbs img{flex:1;min-width:0;max-height:100%;object-fit:cover;object-position:top;border-radius:8px;box-shadow:0 20px 40px rgba(0,0,0,.25)}
.offer .cta{margin-top:44px}
.shot{position:relative;flex:1;min-height:0;margin-top:44px;border-radius:14px;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,.08),0 30px 60px rgba(0,0,0,.18);background:#fff}
.shot img{width:100%;height:100%;object-fit:cover;object-position:50% var(--fy);transform:scale(var(--zoom));transform-origin:50% var(--fy)}
.cta{margin-top:auto;align-self:flex-start;display:inline-flex;align-items:center;gap:14px;background:#ffc93c;color:#1a1400;font-family:'Archivo';font-weight:800;font-size:38px;letter-spacing:.04em;text-transform:uppercase;padding:26px 44px;border-radius:999px;box-shadow:0 8px 0 #f2b705}
.ticks{margin-top:40px;display:grid;gap:18px;font-size:34px;font-weight:700}
.ticks li{display:flex;gap:16px;align-items:center;list-style:none}
.ticks svg{color:#ffc93c}
.preview{position:absolute;top:0;right:0;background:#b91c1c;color:#fff;font-family:'Archivo';font-weight:800;font-size:22px;letter-spacing:.08em;padding:10px 18px;border-bottom-left-radius:12px}
`;

const content = loadContent();
const browser = await chromium.launch();
try {
  for (const n of content.niches) {
    const { manifest, counts, values } = copyValues(n, mode);
    const slides = fillDeep(n.creatives.slides, values, `${n.niche.id}/creatives.json`);
    const out = join(ROOT, 'dist', n.niche.id, 'creatives');
    rmSync(out, { recursive: true, force: true });

    const pagePng = (mapId: string) => {
      const entry = manifest.maps.find((x) => x.id === mapId);
      if (!entry) throw new Error(`creatives.json: map "${mapId}" has not been rendered (run build:pdfs first)`);
      if (mode === 'release' && entry.status !== 'verified') throw new Error(`creatives.json: map "${mapId}" is a draft and can't go in an ad`);
      const png = entry.webp.replace('/webp/', '/png/').replace(/\.webp$/, '.png');
      return `data:image/png;base64,${readFileSync(join(ROOT, 'dist', n.niche.id, png)).toString('base64')}`;
    };

    for (const size of SIZES) {
      mkdirSync(join(out, size.name), { recursive: true });
      const page = await browser.newPage({ viewport: { width: size.width, height: size.height } });
      for (const [i, s] of slides.entries()) {
        const head = `<div class="brand"><span class="mark"><i></i></span>${esc(values.brand)}<span class="count">${i + 1}/${slides.length}</span></div>`;
        let body = '';
        if (s.kind === 'hook') {
          body = `<div class="slide dark">${head}<div class="eyebrow">${esc(s.eyebrow)}</div><h1>${esc(s.title)}</h1><p class="text">${esc(s.text)}</p><div class="stat">${esc(n.sales.pain.stat)}</div><p class="source">${esc(s.source)}</p>`;
        } else if (s.kind === 'page') {
          body = `<div class="slide page">${head}<h1>${esc(s.title)}</h1><p class="text">${esc(s.text)}</p><div class="shot" style="--zoom:${s.zoom};--fy:${s.focusY}%"><img src="${pagePng(s.mapId)}" alt=""></div>`;
        } else {
          const ticks = [`${counts.totalMaps} A4 maps, all 14 official topics`, `${counts.bonuses} bonuses in the Complete pack`, `${values.guaranteeDays}-day money-back guarantee`];
          const thumbs = manifest.maps
            .filter((x) => mode === 'preview' || x.status === 'verified')
            .slice(0, 3)
            .map((x) => `<img src="${pagePng(x.id)}" alt="">`)
            .join('');
          body = `<div class="slide dark offer">${head}<h1>${esc(s.title)}</h1><p class="text">${esc(s.text)}</p><ul class="ticks">${ticks
            .map((t) => `<li>${icon('circle-check', 40, 2.4)}${esc(t)}</li>`)
            .join('')}</ul><div class="thumbs">${thumbs}</div><span class="cta">${esc(s.cta)} ${icon('arrow-right', 38, 3)}</span>`;
        }
        const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTS}${CSS}</style></head><body style="--w:${size.width}px;--h:${size.height}px">${body}${
          mode === 'preview' ? '<span class="preview">PREVIEW · DO NOT USE</span>' : ''
        }</div></body></html>`;
        await page.setContent(html, { waitUntil: 'load' });
        await page.evaluate('document.fonts.ready');
        const overflow = (await page.evaluate('document.querySelector(".slide").scrollHeight - document.querySelector(".slide").clientHeight')) as number;
        if (overflow > 1) throw new Error(`slide ${i + 1} (${size.name}) is ${overflow}px too tall: shorten its text`);
        await page.screenshot({ path: join(out, size.name, `slide-${i + 1}.png`) });
      }
      await page.close();
    }
    console.log(`  ✓ ${n.niche.id}: ${slides.length} slides × ${SIZES.length} sizes → dist/${n.niche.id}/creatives/ (${mode})`);
  }
} finally {
  await browser.close();
}
