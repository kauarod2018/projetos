import type { I18n } from '../../schemas/content.ts';
import type { Visual } from '../../schemas/map.ts';
import { esc } from '../shared/html.ts';

type RoadDiagram = Extract<Visual, { type: 'road-diagram' }>;
type Route = RoadDiagram['routes'][number];
type Vec = { x: number; y: number };

/**
 * Four-arm roundabout drawn from geometry, not by hand.
 * drivingSide decides which side of each arm traffic uses and which way it circulates
 * (left → clockwise, right → anticlockwise), so the diagram can't be drawn "the wrong way round".
 * The driver enters from the bottom arm; exits are counted in the direction of circulation.
 * Route texts and "signal left after exit N" follow UK practice; a right-hand-traffic niche will need
 * its own signalling fields when it is added.
 */
const SIZE = 400;
const C: Vec = { x: 200, y: 200 };
const R_OUT = 112;
const R_IN = 54;
const LANE = 26;
const RADIUS_BY_LANE = { outer: 98, inner: 70 } as const;
const JOIN = 35; // degrees between an arm's axis and where a route joins / leaves the ring
export const ROUTE_COLOURS = ['#2563EB', '#EA580C', '#9333EA'] as const;
const ROAD = '#E6E9EE';
const KERB = '#A3AAB6';
const MARK = '#8B93A1';
const INK = '#16181D';

const rad = (deg: number) => (deg * Math.PI) / 180;
const add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y });
const mul = (a: Vec, k: number): Vec => ({ x: a.x * k, y: a.y * k });
const dirAt = (deg: number): Vec => ({ x: Math.cos(rad(deg)), y: Math.sin(rad(deg)) });
const p = (v: Vec) => `${v.x.toFixed(1)} ${v.y.toFixed(1)}`;

export function renderRoundabout(v: RoadDiagram, side: 'left' | 'right', t: I18n, areaColour: string): string {
  const s = side === 'left' ? 1 : -1;
  /** screen angles (y points down): 90 = bottom arm, where the driver enters */
  const ENTRY = 90;
  const armAngle = (exitNo: number) => ENTRY + s * 90 * exitNo;
  /** side of a road that traffic travelling in direction d keeps to */
  const keepSide = (d: Vec): Vec => mul({ x: d.y, y: -d.x }, s);
  /** unit tangent of the circulation at angle deg */
  const tangent = (deg: number): Vec => mul({ x: -Math.sin(rad(deg)), y: Math.cos(rad(deg)) }, s);
  const onRing = (deg: number, r: number): Vec => add(C, mul(dirAt(deg), r));

  const arms = [0, 1, 2, 3].map((i) => {
    const angle = armAngle(i);
    const u = dirAt(angle);
    const inward = mul(u, -1);
    const inLanes = i === 0 ? 2 : 1;
    return { angle, u, v: keepSide(inward), inLanes, outLanes: 1 };
  });
  const at = (arm: (typeof arms)[number], dist: number, offset: number) => add(add(C, mul(arm.u, dist)), mul(arm.v, offset));

  // road surface: kerb outline first, then the surface on top (gives a clean union outline)
  const shapes = [
    `<circle cx="${C.x}" cy="${C.y}" r="${R_OUT}"/>`,
    ...arms.map((a) => {
      const pts = [at(a, 0, -a.outLanes * LANE), at(a, 230, -a.outLanes * LANE), at(a, 230, a.inLanes * LANE), at(a, 0, a.inLanes * LANE)];
      return `<polygon points="${pts.map(p).join(' ')}"/>`;
    }),
  ].join('');

  const giveWayDist = (a: (typeof arms)[number]) => Math.sqrt(R_OUT ** 2 - (a.inLanes * LANE) ** 2) + 5;
  const markings: string[] = [];
  for (const a of arms) {
    const start = giveWayDist(a);
    // centre line between the two directions
    markings.push(line(at(a, start + 4, 0), at(a, 230, 0), MARK, 2, '9 7'));
    // lane lines between inbound lanes
    for (let j = 1; j < a.inLanes; j++) markings.push(line(at(a, start + 4, j * LANE), at(a, 230, j * LANE), MARK, 1.5, '6 8'));
    // give way: double broken line across the inbound lanes
    for (const extra of [0, 5]) markings.push(line(at(a, start + extra, 0), at(a, start + extra, a.inLanes * LANE), INK, 2, '4 3'));
  }
  markings.push(`<circle cx="${C.x}" cy="${C.y}" r="${(RADIUS_BY_LANE.outer + RADIUS_BY_LANE.inner) / 2}" fill="none" stroke="${MARK}" stroke-width="1.5" stroke-dasharray="6 8"/>`);

  // circulation hint on the island
  const hintFrom = ENTRY + s * 110;
  const hintTo = ENTRY + s * 250;
  const island = `<circle cx="${C.x}" cy="${C.y}" r="${R_IN}" fill="#E4EBE0" stroke="${KERB}" stroke-width="3"/>
    <path d="M ${p(onRing(hintFrom, 34))} A 34 34 0 0 ${s === 1 ? 1 : 0} ${p(onRing(hintTo, 34))}" fill="none" stroke="#8FA486" stroke-width="3" marker-end="url(#arrow-hint)"/>`;

  // traffic coming from the right of the entry, already on the roundabout
  const fromRight = `<path d="M ${p(onRing(ENTRY - s * 62, RADIUS_BY_LANE.outer))} A ${RADIUS_BY_LANE.outer} ${RADIUS_BY_LANE.outer} 0 0 ${s === 1 ? 1 : 0} ${p(
    onRing(ENTRY - s * 22, RADIUS_BY_LANE.outer),
  )}" fill="none" stroke="${INK}" stroke-width="3.5" stroke-dasharray="2 5" stroke-linecap="round" marker-end="url(#arrow-ink)"/>`;

  const routes = v.routes.map((r, i) => routePath(r, i));
  function routePath(r: Route, i: number) {
    const colour = ROUTE_COLOURS[i % ROUTE_COLOURS.length];
    const entry = arms[0];
    const exitArm = arms[r.exit];
    // the kerb-side lane is the left lane when driving on the left, the right lane when driving on the right
    const kerbSide = (r.approachLane === 'left') === (s === 1);
    const lane = kerbSide ? entry.inLanes - 1 : 0;
    const sameLane = v.routes.filter((o) => o.approachLane === r.approachLane).sort((a, b) => a.exit - b.exit);
    const k = sameLane.indexOf(r);
    const spread = ((sameLane.length - 1) / 2 - k) * 7; // earlier exits nearer the kerb and the outside
    const offset = (lane + 0.5) * LANE + spread;
    const radius = (kerbSide ? RADIUS_BY_LANE.outer : RADIUS_BY_LANE.inner) + spread;
    const start = at(entry, 205, offset);
    const e = at(entry, giveWayDist(entry) - 2, offset);
    const th0 = ENTRY + s * JOIN;
    const th1 = exitArm.angle - s * JOIN;
    const p0 = onRing(th0, radius);
    const p1 = onRing(th1, radius);
    const travel = (((th1 - th0) * s) % 360 + 360) % 360;
    const exitPoint = at(exitArm, R_OUT + 8, -0.5 * LANE);
    const end = at(exitArm, 200, -0.5 * LANE);
    const bend = 16;
    const d = [
      `M ${p(start)}`,
      `L ${p(e)}`,
      `C ${p(add(e, mul(entry.u, -bend)))} ${p(add(p0, mul(tangent(th0), -bend)))} ${p(p0)}`,
      `A ${radius} ${radius} 0 ${travel > 180 ? 1 : 0} ${s === 1 ? 1 : 0} ${p(p1)}`,
      `C ${p(add(p1, mul(tangent(th1), bend)))} ${p(add(exitPoint, mul(exitArm.u, -bend)))} ${p(exitPoint)}`,
      `L ${p(end)}`,
    ].join(' ');

    const marks: string[] = [];
    if (r.signalOnApproach !== 'none') marks.push(signal(at(entry, 172, offset), r.signalOnApproach));
    if (r.signalLeftAfterExit !== null) marks.push(signal(onRing(arms[r.signalLeftAfterExit].angle + s * 22, radius), 'left'));
    const badgeAt = at(exitArm, 176, -0.5 * LANE);
    return {
      colour,
      path: `<path d="${d}" fill="none" stroke="${colour}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#arrow-${i})" opacity="0.95"/>`,
      marks: marks.join(''),
      badge: badge(badgeAt, r.exit, colour),
    };
  }

  const defs = `<defs>
    ${ROUTE_COLOURS.map((c, i) => arrowMarker(`arrow-${i}`, c)).join('')}
    ${arrowMarker('arrow-ink', INK)}
    ${arrowMarker('arrow-hint', '#8FA486')}
  </defs>`;

  const svg = `<svg class="roundabout" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(v.caption)}">
    ${defs}
    <g fill="${KERB}" stroke="${KERB}" stroke-width="7" stroke-linejoin="round">${shapes}</g>
    <g fill="${ROAD}">${shapes}</g>
    ${markings.join('')}
    ${island}
    ${fromRight}
    ${routes.map((r) => r.path).join('')}
    ${routes.map((r) => r.marks).join('')}
    ${routes.map((r) => r.badge).join('')}
  </svg>`;

  const legend = `<div class="rb-legend">
    ${v.routes
      .map(
        (r, i) => `<div class="rb-route" style="--route:${routes[i].colour}">
          <div class="rb-route-head"><span class="rb-num">${r.exit}</span>${esc(r.label)}</div>
          <ul>${r.steps.map((step) => `<li>${esc(step)}</li>`).join('')}</ul>
        </div>`,
      )
      .join('')}
    <div class="rb-keys">
      <div class="rb-key"><svg viewBox="0 0 40 14" width="30" height="11"><path d="M2 7 H30" stroke="${INK}" stroke-width="3.5" stroke-dasharray="2 5" stroke-linecap="round" marker-end="url(#k-ink)"/><defs>${arrowMarker('k-ink', INK)}</defs></svg>${esc(t.diagram.giveWay)}</div>
      <div class="rb-key"><svg viewBox="0 0 40 14" width="30" height="11"><path d="M4 11 A 12 8 0 0 1 30 7" fill="none" stroke="#8FA486" stroke-width="3" marker-end="url(#k-hint)"/><defs>${arrowMarker('k-hint', '#8FA486')}</defs></svg>${esc(
        t.diagram.circulation[s === 1 ? 'clockwise' : 'anticlockwise'],
      )}</div>
      <div class="rb-key">${signalIcon('left')}${esc(t.diagram.signalLeft)}<span class="rb-gap"></span>${signalIcon('right')}${esc(t.diagram.signalRight)}</div>
    </div>
    ${v.notes.length ? `<ul class="rb-notes">${v.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
  </div>`;

  return `<div class="rb" style="--area:${areaColour}">${svg}${legend}</div>`;
}

function line(a: Vec, b: Vec, colour: string, width: number, dash: string) {
  return `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke="${colour}" stroke-width="${width}" stroke-dasharray="${dash}"/>`;
}

function arrowMarker(id: string, colour: string) {
  return `<marker id="${id}" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${colour}"/></marker>`;
}

function badge(at: Vec, n: number, colour: string) {
  return `<g><circle cx="${at.x.toFixed(1)}" cy="${at.y.toFixed(1)}" r="11" fill="${colour}" stroke="#fff" stroke-width="2.5"/>
    <text x="${at.x.toFixed(1)}" y="${(at.y + 4.6).toFixed(1)}" text-anchor="middle" font-family="Archivo" font-weight="800" font-size="13" fill="#fff">${n}</text></g>`;
}

/** indicator lamp: dark rounded square with a white arrow (like a dashboard indicator) */
function signal(at: Vec, dir: 'left' | 'right') {
  const x = at.x - 10;
  const y = at.y - 8;
  const arrow = dir === 'left' ? 'M14 3 L5 8 L14 13 Z' : 'M6 3 L15 8 L6 13 Z';
  return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><rect width="20" height="16" rx="4" fill="${INK}" stroke="#fff" stroke-width="2"/><path d="${arrow}" fill="#FBBF24"/></g>`;
}

function signalIcon(dir: 'left' | 'right') {
  const arrow = dir === 'left' ? 'M14 3 L5 8 L14 13 Z' : 'M6 3 L15 8 L6 13 Z';
  return `<svg viewBox="-1 -1 22 18" width="17" height="14" aria-hidden="true"><rect width="20" height="16" rx="4" fill="${INK}"/><path d="${arrow}" fill="#FBBF24"/></svg>`;
}
