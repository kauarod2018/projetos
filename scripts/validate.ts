/**
 * Validates every content file before anything is rendered.
 *   npm run validate            → schema + consistency errors fail; drafts and gaps are warnings
 *   npm run validate:release    → also fails on drafts, missing official signs, coverage gaps and placeholders
 */
import { checkContent } from '../lib/checks.ts';
import { ContentError, loadContent } from '../lib/content.ts';

const release = process.argv.includes('--release');

try {
  const content = loadContent();
  const { errors, warnings } = checkContent(content, { release });
  const maps = content.niches.reduce((sum, n) => sum + n.maps.length, 0);

  for (const w of warnings) console.warn(`  ! ${w}`);
  for (const e of errors) console.error(`  ✗ ${e}`);

  if (errors.length) {
    console.error(`\nValidation failed: ${errors.length} error(s), ${warnings.length} warning(s).`);
    process.exit(1);
  }
  console.log(
    `\nValidation passed${release ? ' (release mode)' : ''}: ${content.niches.length} niche(s), ${maps} map(s), ${warnings.length} warning(s).`,
  );
} catch (err) {
  if (err instanceof ContentError) {
    for (const p of err.problems) console.error(`  ✗ ${p}`);
    console.error(`\nValidation failed: ${err.problems.length} problem(s) in the content files.`);
    process.exit(1);
  }
  throw err;
}
