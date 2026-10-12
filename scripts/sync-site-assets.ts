/**
 * Copies the rendered page images from dist/ into public/media/ for the website,
 * with a 600 px version for phones and a social share image per niche.
 * Run after build:pdfs or build:preview.
 */
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
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

for (const n of loadContent().niches) {
  const dist = join(ROOT, 'dist', n.niche.id);
  if (!existsSync(join(dist, 'manifest.json'))) throw new Error(`run "npm run build:preview" first: dist/${n.niche.id} is missing`);
  let count = 0;
  for (const file of walk(dist)) {
    if (!file.endsWith('.webp')) continue;
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
