import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './content.ts';

export const iconPath = (name: string) => join(ROOT, 'node_modules', 'lucide-static', 'icons', `${name}.svg`);

const cache = new Map<string, string>();

/** Inline lucide icon (stroke = currentColor), without the licence comment. */
export function icon(name: string, size = 12, strokeWidth = 2): string {
  let svg = cache.get(name);
  if (!svg) {
    svg = readFileSync(iconPath(name), 'utf8').replace(/<!--[\s\S]*?-->\s*/, '').trim();
    cache.set(name, svg);
  }
  return svg
    .replace(/width="24"/, `width="${size}"`)
    .replace(/height="24"/, `height="${size}"`)
    .replace(/stroke-width="2"/, `stroke-width="${strokeWidth}"`)
    .replace(/class="[^"]*"/, 'class="icon" aria-hidden="true"');
}
