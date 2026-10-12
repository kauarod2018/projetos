import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../../lib/content.ts';

/**
 * Fonts are embedded as data URIs so every page renders the same without network access.
 * Archivo (headings, variable weight + width) and Atkinson Hyperlegible (body, designed for legibility).
 * Both are SIL Open Font License. Only the Latin subset is embedded (covers English, £, µ, dashes).
 */
const FONTS = [
  { family: 'Archivo', file: '@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2', weight: '100 900', stretch: '62% 125%', style: 'normal' },
  { family: 'Atkinson', file: '@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-normal.woff2', weight: '400', style: 'normal' },
  { family: 'Atkinson', file: '@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-700-normal.woff2', weight: '700', style: 'normal' },
  { family: 'Atkinson', file: '@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-italic.woff2', weight: '400', style: 'italic' },
];

let css: string | undefined;

export function fontFaceCss(): string {
  if (css) return css;
  css = FONTS.map((f) => {
    const data = readFileSync(join(ROOT, 'node_modules', f.file)).toString('base64');
    return `@font-face{font-family:'${f.family}';font-style:${f.style};font-weight:${f.weight};${
      f.stretch ? `font-stretch:${f.stretch};` : ''
    }font-display:block;src:url(data:font/woff2;base64,${data}) format('woff2');}`;
  }).join('\n');
  return css;
}
