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
