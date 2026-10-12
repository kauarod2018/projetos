/**
 * The validator is the safety net for content mistakes, so it is tested against broken copies
 * of the real content: each case breaks one thing and expects a clear error about it.
 */
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, describe, test } from 'node:test';
import { checkContent } from '../lib/checks.ts';
import { CONTENT_DIR, ContentError, loadContent } from '../lib/content.ts';

const temps: string[] = [];
after(() => temps.forEach((d) => rmSync(d, { recursive: true, force: true })));

const MAPS = join('niches', 'uk-driving-theory', 'maps');

/** copy the real content, apply one change to a JSON file, return all problems found */
function problemsAfter(file: string, change: (json: any) => void, release = false): string[] {
  const dir = mkdtempSync(join(tmpdir(), 'content-'));
  temps.push(dir);
  cpSync(CONTENT_DIR, dir, { recursive: true });
  const path = join(dir, file);
  const json = JSON.parse(readFileSync(path, 'utf8'));
  change(json);
  writeFileSync(path, JSON.stringify(json));
  try {
    return checkContent(loadContent(dir), { release }).errors;
  } catch (err) {
    if (err instanceof ContentError) return err.problems;
    throw err;
  }
}

const expectProblem = (problems: string[], pattern: RegExp) =>
  assert.ok(problems.some((p) => pattern.test(p)), `expected a problem matching ${pattern}, got:\n${problems.join('\n')}`);

describe('content as committed', () => {
  test('passes the normal validation', () => {
    assert.deepEqual(checkContent(loadContent(), { release: false }).errors, []);
  });

  test('is blocked in release mode while maps are drafts and signs are not official', () => {
    const errors = checkContent(loadContent(), { release: true }).errors;
    expectProblem(errors, /without the official image/);
    expectProblem(errors, /topics are below the minimum/);
    expectProblem(errors, /placeholder/);
  });
});

describe('map errors', () => {
  test('area that does not exist', () => {
    expectProblem(problemsAfter(join(MAPS, 'stopping-distances.json'), (m) => (m.area = 'motorway')), /area: "motorway" is not an area/);
  });

  test('answerIndex out of range', () => {
    expectProblem(problemsAfter(join(MAPS, 'roundabouts.json'), (m) => (m.onTheTest[0].answerIndex = 4)), /answerIndex/);
  });

  test('a question without exactly 4 options', () => {
    expectProblem(problemsAfter(join(MAPS, 'roundabouts.json'), (m) => m.onTheTest[0].options.pop()), /options/);
  });

  test('missing source', () => {
    expectProblem(problemsAfter(join(MAPS, 'roundabouts.json'), (m) => (m.sources = [])), /sources/);
  });

  test('text too long for the page', () => {
    expectProblem(problemsAfter(join(MAPS, 'roundabouts.json'), (m) => (m.whatItIs = 'x'.repeat(201))), /whatItIs/);
  });

  test('sign that is not in the manifest', () => {
    expectProblem(problemsAfter(join(MAPS, 'signs-warning-junctions.json'), (m) => (m.visual.signs[0] = 'no-such-sign')), /"no-such-sign" is not in signs.json/);
  });

  test('two maps with the same code', () => {
    expectProblem(problemsAfter(join(MAPS, 'roundabouts.json'), (m) => { m.area = 'safety-margins'; m.order = 1; }), /map code 4\.01/);
  });

  test('verified without a check date', () => {
    expectProblem(problemsAfter(join(MAPS, 'roundabouts.json'), (m) => (m.review = { status: 'verified' })), /review/);
  });

  test('signal-left marker after a later exit', () => {
    expectProblem(problemsAfter(join(MAPS, 'roundabouts.json'), (m) => (m.visual.routes[1].signalLeftAfterExit = 2)), /signalLeftAfterExit/);
  });
  test('a card with neither an icon nor a swatch', () => {
    expectProblem(problemsAfter(join(MAPS, 'signs-shapes-colours.json'), (m) => delete m.visual.items[0].icon), /give an icon or a swatch/);
  });
  test('a card icon that does not exist', () => {
    expectProblem(problemsAfter(join(MAPS, 'signs-shapes-colours.json'), (m) => (m.visual.items[0].icon = 'not-an-icon')), /lucide icon "not-an-icon"/);
  });
  test('a road marking pattern that is not drawn', () => {
    expectProblem(problemsAfter(join(MAPS, 'markings-along-the-road.json'), (m) => (m.visual.items[0].pattern = 'zebra-stripes')), /pattern/);
  });
});

describe('numbers and niche errors', () => {
  test('bar values that do not add up to the total', () => {
    expectProblem(
      problemsAfter(join('niches', 'uk-driving-theory', 'numbers.json'), (n) => (n.items[0].data.rows[3].total = 52)),
      /values add up to 53, total says 52/,
    );
  });

  test('a guarantee Hotmart does not offer', () => {
    expectProblem(problemsAfter(join('niches', 'uk-driving-theory', 'niche.json'), (n) => (n.guaranteeDays = 14)), /Hotmart only allows/);
  });

  test('an official topic left out of every area', () => {
    expectProblem(
      problemsAfter(join('niches', 'uk-driving-theory', 'niche.json'), (n) => (n.areas[5].officialTopics = ['safety-and-your-vehicle'])),
      /"vehicle-loading" is not assigned to any area/,
    );
  });

  test('an "official" sign without its file', () => {
    expectProblem(
      problemsAfter(join('assets', 'signs', 'gb', 'signs.json'), (s) => (s.signs[0].status = 'official')),
      /needs "file" and "officialNumber"/,
    );
  });
});

describe('plan, bonuses and copy', () => {
  test('a map that differs from inventory.json', () => {
    expectProblem(problemsAfter(join(MAPS, 'roundabouts.json'), (m) => (m.title = 'Roundabouts!')), /title: "Roundabouts!" differs from inventory.json/);
  });

  test('a map that is not in the plan', () => {
    expectProblem(
      problemsAfter(join('niches', 'uk-driving-theory', 'inventory.json'), (inv) => (inv.maps = inv.maps.filter((m: { id: string }) => m.id !== 'roundabouts'))),
      /"roundabouts" is not in inventory.json/,
    );
  });

  test('a plan that leaves an official topic uncovered', () => {
    expectProblem(
      problemsAfter(join('niches', 'uk-driving-theory', 'inventory.json'), (inv) => {
        for (const m of inv.maps) m.officialTopics = m.officialTopics.filter((t: string) => t !== 'vehicle-loading');
        for (const m of inv.maps) if (!m.officialTopics.length) m.officialTopics = ['rules-of-the-road'];
      }),
      /the plan does not cover "vehicle-loading"/,
    );
  });

  test('a bonus sign pair with an unknown sign', () => {
    expectProblem(
      problemsAfter(join('niches', 'uk-driving-theory', 'bonuses', 'critical-signs-cheat-sheet.json'), (b) => (b.pages[0].blocks[1].pairs[0].a = 'no-such-sign')),
      /sign "no-such-sign" is not in signs.json/,
    );
  });

  test('a typo in a sales page placeholder', () => {
    expectProblem(problemsAfter(join('niches', 'uk-driving-theory', 'sales.json'), (s) => (s.topBar = '{totalMap} maps')), /unknown placeholder \{totalMap\}/);
  });

  test('a creative that points to a map that is not planned', () => {
    expectProblem(problemsAfter(join('niches', 'uk-driving-theory', 'creatives.json'), (c) => (c.slides[1].mapId = 'nope')), /slides\[1\]\.mapId: "nope"/);
  });

  test('a niche without a brand name in its language', () => {
    expectProblem(problemsAfter('site.json', (s) => delete s.brand.byLanguage['en-GB']), /add the brand name in en-GB/);
  });
});
