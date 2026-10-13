/**
 * Copies the page images the shop shows from dist/ into public/media/ for the website,
 * with a 600 px version for phones and a social share image per niche.
 * Run after build:pdfs or build:preview.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import sharp from 'sharp';
import { loadContent, ROOT } from '../lib/content.ts';

const publicMedia = join(ROOT, 'public', 'media');
rmSync(publicMedia, { recursive: true, force: true });

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

const niches = loadContent().niches;

// country flags for the shop filter and product cards (flag-icons, MIT licence)
mkdirSync(join(publicMedia, 'flags'), { recursive: true });
for (const code of new Set(niches.map((n) => n.niche.country.toLowerCase()))) {
  const flag = join(ROOT, 'node_modules', 'flag-icons', 'flags', '4x3', `${code}.svg`);
  if (!existsSync(flag)) throw new Error(`no flag for country "${code}" in flag-icons: check "country" in niche.json`);
  copyFileSync(flag, join(publicMedia, 'flags', `${code}.svg`));
}

for (const n of niches) {
  const dist = join(ROOT, 'dist', n.niche.id);
  if (!existsSync(join(dist, 'manifest.json'))) throw new Error(`run "npm run build:preview" first: dist/${n.niche.id} is missing`);
  // only what the shop shows: the gallery (cover, contents, sample maps) and the first page of each bonus.
  // Publishing every map would give the whole product away to anyone who guesses the URLs.
  const manifest = JSON.parse(readFileSync(join(dist, 'manifest.json'), 'utf8')) as {
    covers?: Record<string, string>;
    maps: { id: string; webp: string }[];
    bonuses: { id: string; preview: { webp: string }; release?: { webp: string } }[];
  };
  const wanted = new Set<string>([
    ...Object.values(manifest.covers ?? {}),
    ...manifest.maps.filter((m) => n.sales.gallery.maps.includes(m.id) || m.id === n.sales.lookInside.mapId).map((m) => m.webp),
    ...manifest.bonuses.flatMap((b) => [b.preview.webp, ...(b.release ? [b.release.webp] : [])]),
  ]);
  let count = 0;
  for (const file of walk(dist)) {
    if (!file.endsWith('.webp') || !wanted.has(relative(dist, file))) continue;
    const target = join(publicMedia, n.niche.id, relative(dist, file));
    mkdirSync(dirname(target), { recursive: true });
    await sharp(file).toFile(target);
    await sharp(file).resize({ width: 600 }).webp({ quality: 78 }).toFile(target.replace(/\.webp$/, '-600.webp'));
    count++;
  }
  // social share image: the top of the first map page
  const firstPng = [...walk(join(dist, 'maps', 'png'))].filter((f) => f.endsWith('.png') && !f.includes('OVERFLOW')).sort()[0];
  if (firstPng) {
    await sharp(firstPng).resize({ width: 1200 }).extract({ left: 0, top: 0, width: 1200, height: 630 }).jpeg({ quality: 82 }).toFile(join(publicMedia, n.niche.id, 'og.jpg'));
  }
  console.log(`  ✓ ${n.niche.id}: ${count} image(s) → public/media/${n.niche.id}/`);
}
