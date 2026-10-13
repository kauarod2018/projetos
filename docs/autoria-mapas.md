# Writing revision maps (brief for authors)

This is the brief every author (person or agent) follows when writing maps for a niche. The example niche here
is `uk-hgv-theory`, but the rules are the same for every product.

## The one rule that matters

**Every fact on a map must be found in an official source text that you have read.** No facts from memory, no
facts from training sites, apps or blogs. If you can't find it in the official text, leave it out. A shorter,
correct map is always better than a full one with one wrong fact. The product is sold on that promise.

## Where the official texts are

Downloaded as plain text in the scratchpad (`$SP` = `/tmp/claude-0/-home-user-projetos/a6d99d78-b85b-5743-a152-5f8a93fba27c/scratchpad`):

| File in `$SP/hgv/` | What it is |
|---|---|
| `guidance_drivers-hours-goods-vehicles.txt` | GV262: drivers' hours (assimilated/AETR, GB domestic, mixed), tachograph rules, operators, enforcement, working time (annex 2) |
| `guidance_securing-loads-on-hgvs-and-goods-vehicles.txt` | DVSA code of practice on securing loads |
| `guidance_carry-out-daily-heavy-goods-vehicle-hgv-walkaround-checks.txt` | Daily walkaround checks |
| `roadworthiness-guide.txt` | Guide to maintaining roadworthiness (defect reporting, inspections, brakes) |
| `roadside-vehicle-checks-for-commercial-drivers.txt` | Roadside checks, prohibitions, fines |
| `become-lorry-bus-driver.txt` | Getting qualified: Driver CPC parts 1–4, test formats, pass marks, fees |
| `driver-cpc-training.txt`, `renew-lorry-bus-coach-licence.txt` | Periodic training, DQC, licence renewal and medicals |
| `driving-licence-categories.txt` | Licence categories (C1, C, C1E, CE…) |
| `drivers-hours.txt`, `tachographs.txt` | Short GOV.UK overviews |
| `guidance_clandestine-entrant-civil-penalty-scheme.txt` | Clandestine entrants: vehicle security, civil penalty |
| `guidance_driving-dangerous-goods-and-special-loads.txt` | Dangerous goods and special loads (abroad) |
| `speed-limits.txt`, `drink-drive-limit.txt` | Speed limits page, drink-drive limits |
| `highway-code/*.txt` | The Highway Code, by section (rules for large vehicles: 126, 160, 164, 187, 221–222, 233, 246–247, 265, 294; annex 6 tyres) |
| `kyts.txt` | Know Your Traffic Signs (search with `python3 $SP/tools/kyts.py grep "<regex>" 150`) |

More GOV.UK pages: `python3 $SP/govuk.py /path/on/gov.uk out.txt` (uses the GOV.UK content API).
Legislation (reachable): `curl -s https://www.legislation.gov.uk/uksi/1986/1078/regulation/36A/data.xml` or the
`/contents` page of an Act or SI. Cite the regulation number.

Search a source quickly: `grep -n -i "45 minutes" $SP/hgv/*.txt`.

## The file format

One JSON file per map in `content/niches/<niche>/maps/<id>.json`. The schema is `schemas/map.ts`. Read it, and
read `content/niches/uk-hgv-theory/maps/breaks.json` (finished example) and a few maps in
`content/niches/uk-driving-theory/maps/` for tone.

- `id`, `area`, `order`, `tier`, `title`, `officialTopics` must match the map's line in `inventory.json` exactly.
- Text limits (characters): title 48 · whatItIs 200 · key fact 120 (3–6 facts) · confused label 40, points 90
  (2–4 each side) · 1–2 questions: question 180, options 80, why 220 · traps 140 (2–4) · caption 90.
- `keyFacts`: a plain string, or `{ "text": "...", "law": true }` when it is a legal requirement: MUST / MUST NOT in
  The Highway Code, or a duty set by law or by the drivers' hours rules ("must" in GV262). Write MUST in capitals
  in law facts. Advice ("should") is never `law`.
- `onTheTest`: original questions in the style of the test, 4 different options, `answerIndex` is 0-based, never
  "all/none of the above". `why` explains the answer from the source. Never copy questions from any question bank.
- `traps`: the mistakes candidates make, written as short corrections.
- `sources`: every document the facts come from, with the exact section/rule (`ref`) and the GOV.UK/legislation URL.
- `jurisdictionNotes`: only if a rule differs in Scotland, Wales or England (`great-britain`, `england`, `wales`,
  `scotland`, `england-and-wales`).
- `review`: always `{ "status": "draft" }`. Only the fact-check step marks a map verified.

## Visuals (pick the one that explains the topic best)

| type | use it for |
|---|---|
| `timeline` | time drawn to scale: driving, breaks, rest (`drive`, `break`, `rest`, `work`, `availability`), rows with `verdict` `ok` / `wrong` / `info` and an optional `note`. `scaleHours` must fit every row. |
| `table` | `data: { columns, rows, notes }` for limits and comparisons (2–6 columns, ≤12 rows). |
| `stats` | 2–4 big figures (`value` ≤14 chars) with a label. |
| `cards` | 2–9 cards with a lucide `icon` (must exist in `node_modules/lucide-static/icons/<name>.svg`), `title` ≤44, `text` ≤120, `law` true/false; `columns` 2, 3 or 4. |
| `steps` | 2–6 steps in order (`title` ≤40, `text` ≤110). |
| `sign-grid` | official sign images only, ids from `content/assets/signs/gb/signs.json` (e.g. `goods-vehicles-weight-limit`, `max-height`, `max-width`, `max-length`, `headroom-warning`, `height-restriction-ahead`, `arch-bridge-headroom`, `no-articulated-vehicles`, `end-goods-vehicle-restriction`, `level-crossing-barrier`). Never draw a sign. |

## How to work

1. Read the inventory line and the source sections for the map. Note the exact sentences you rely on.
2. Write the JSON.
3. `npm run validate`. Fix errors in **your** files (ignore errors in files you don't own).
4. Render it: `npx tsx scripts/build-pdfs.ts --include-drafts --only <id>`, then open
   `dist/<niche>/maps/png/<code>-<id>.png` and look at it. If the build says the page overflows, shorten the text
   (never ask for a smaller font). The page must look calm, not crammed.
5. Only edit your own map files. Don't edit `inventory.json`, `niche.json`, `numbers.json` or anything else, and
   don't commit. Put suggestions for those files in your report.

## Your report

For every map: the id, then each key fact, question answer and trap with the source and the exact sentence (or a
close paraphrase with the section) that supports it. List anything you left out because you couldn't find it in
an official source, and any number that should go into `numbers.json`.
