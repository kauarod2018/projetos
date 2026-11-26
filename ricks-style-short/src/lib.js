// Biblioteca: texturas procedurais, materiais, personagens e props
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// ---------- aleatório determinístico ----------
export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const R = rng(1266);

// ---------- texturas em canvas ----------
export function canvasTex(w, h, draw, rep = [1, 1], srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d'); draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]);
  t.anisotropy = 4; if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function noise(ctx, w, h, amt, n = 4000, r = R) {
  for (let i = 0; i < n; i++) {
    const v = (r() - 0.5) * amt;
    ctx.fillStyle = v > 0 ? `rgba(255,255,255,${v})` : `rgba(0,0,0,${-v})`;
    ctx.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3);
  }
}
const hsl = (h, s, l) => `hsl(${h},${s}%,${l}%)`;

export const TEX = {};
export function buildTextures() {
  TEX.planks = canvasTex(512, 512, (c, w, h) => {
    const n = 6;
    for (let i = 0; i < n; i++) {
      c.fillStyle = hsl(28 + R() * 6, 45 + R() * 10, 30 + R() * 10); c.fillRect(0, i * h / n, w, h / n);
      for (let k = 0; k < 40; k++) { c.strokeStyle = `rgba(40,20,5,${0.1 + R() * 0.15})`; c.lineWidth = 1 + R() * 2; c.beginPath(); const y = i * h / n + R() * h / n; c.moveTo(0, y); c.bezierCurveTo(w * .3, y + R() * 6 - 3, w * .6, y + R() * 6 - 3, w, y + R() * 4 - 2); c.stroke(); }
      c.fillStyle = 'rgba(20,10,0,0.8)'; c.fillRect(0, i * h / n, w, 4);
      const cut = R() * w; c.fillRect(cut, i * h / n, 4, h / n);
    }
    noise(c, w, h, 0.15);
  });
  TEX.plaster = canvasTex(512, 512, (c, w, h) => { c.fillStyle = '#e9dcc0'; c.fillRect(0, 0, w, h); noise(c, w, h, 0.12, 9000); for (let i = 0; i < 30; i++) { c.fillStyle = `rgba(120,90,50,${R() * 0.06})`; c.beginPath(); c.arc(R() * w, R() * h, 20 + R() * 60, 0, 7); c.fill(); } });
  TEX.brick = canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = '#6b5a4a'; c.fillRect(0, 0, w, h);
    const bh = 32, bw = 85;
    for (let y = 0; y < h / bh; y++) for (let x = -1; x < w / bw + 1; x++) {
      const ox = (y % 2) * bw / 2;
      c.fillStyle = hsl(10 + R() * 14, 45 + R() * 20, 30 + R() * 14);
      c.fillRect(x * bw + ox + 3, y * bh + 3, bw - 6, bh - 6);
    }
    noise(c, w, h, 0.2, 8000);
  });
  TEX.stone = canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = '#4a4a4f'; c.fillRect(0, 0, w, h);
    const bh = 64, bw = 128;
    for (let y = 0; y < h / bh; y++) for (let x = -1; x < w / bw + 1; x++) {
      const ox = (y % 2) * bw / 2; const l = 40 + R() * 16;
      c.fillStyle = hsl(220, 6, l); c.fillRect(x * bw + ox + 4, y * bh + 4, bw - 8, bh - 8);
    }
    noise(c, w, h, 0.22, 12000);
  });
  TEX.cobble = canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = '#3d3a36'; c.fillRect(0, 0, w, h);
    for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) {
      const cx = (x + (y % 2) * 0.5) * w / 12 + (R() - .5) * 8, cy = y * h / 12 + (R() - .5) * 8;
      c.fillStyle = hsl(30 + R() * 20, 8 + R() * 8, 45 + R() * 18);
      c.beginPath(); c.ellipse(cx, cy, 18 + R() * 4, 16 + R() * 4, R() * 3, 0, 7); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.08)'; c.beginPath(); c.ellipse(cx - 4, cy - 5, 9, 6, 0, 0, 7); c.fill();
    }
    noise(c, w, h, 0.15, 6000);
  }, [8, 8]);
  TEX.grass = canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#4f8a2c'; c.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { c.fillStyle = hsl(85 + R() * 30, 50, 25 + R() * 25); c.fillRect(R() * w, R() * h, 1, 3 + R() * 5); } }, [20, 20]);
  TEX.bread = canvasTex(256, 128, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#9a5a20'); g.addColorStop(.5, '#c98a3e'); g.addColorStop(1, '#e8b56a');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) { c.strokeStyle = '#f2d39a'; c.lineWidth = 7; c.beginPath(); const x = 60 + i * 45; c.moveTo(x - 15, 25); c.quadraticCurveTo(x, 40, x + 15, 60); c.stroke(); }
    noise(c, w, h, 0.2, 1500);
  }, [1, 1]);
  TEX.paper = canvasTex(512, 640, (c, w, h) => {
    c.fillStyle = '#efe0b8'; c.fillRect(0, 0, w, h); noise(c, w, h, 0.1, 6000);
    c.fillStyle = '#3b2412'; c.textAlign = 'center';
    c.font = 'bold 56px DejaVu Serif'; c.fillText('ASSIZE', w / 2, 110);
    c.font = 'bold 40px DejaVu Serif'; c.fillText('of BREAD & ALE', w / 2, 170);
    c.font = 'bold 120px DejaVu Serif'; c.fillStyle = '#7a1010'; c.fillText('1266', w / 2, 330);
    c.fillStyle = '#3b2412'; c.font = '28px DejaVu Serif';
    ['One penny shall buy', 'a loaf of the weight', 'decreed by the King.', 'Bakers who cheat', 'shall be punished.'].forEach((s, i) => c.fillText(s, w / 2, 400 + i * 42));
    c.fillStyle = '#a01515'; c.beginPath(); c.arc(w - 90, h - 70, 40, 0, 7); c.fill();
  }, [1, 1]);
  TEX.banner = canvasTex(256, 512, (c, w, h) => {
    c.fillStyle = '#8a1010'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#e0b030'; c.fillRect(0, 0, w, 18); c.fillRect(0, 0, 14, h); c.fillRect(w - 14, 0, 14, h);
    c.beginPath(); c.moveTo(60, 260); c.lineTo(60, 170); c.lineTo(95, 210); c.lineTo(128, 150); c.lineTo(161, 210); c.lineTo(196, 170); c.lineTo(196, 260); c.closePath(); c.fill();
    c.beginPath(); c.arc(128, 340, 46, 0, 7); c.fill(); c.fillStyle = '#8a1010'; c.font = 'bold 50px DejaVu Serif'; c.textAlign = 'center'; c.fillText('R', 128, 358);
  });
  TEX.sign = canvasTex(512, 256, (c, w, h) => {
    c.fillStyle = '#5a3a1a'; c.fillRect(0, 0, w, h); noise(c, w, h, 0.2, 3000);
    c.strokeStyle = '#2a1a0a'; c.lineWidth = 12; c.strokeRect(6, 6, w - 12, h - 12);
    c.fillStyle = '#f2d39a'; c.font = 'bold 72px DejaVu Serif'; c.textAlign = 'center'; c.fillText('BAKERY', w / 2, 150);
    c.font = '34px DejaVu Serif'; c.fillText('~ fresh bread ~', w / 2, 210);
  });
  TEX.awning = canvasTex(256, 64, (c, w, h) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#f2efe6' : '#b52a2a'; c.fillRect(i * w / 8, 0, w / 8, h); } });
  TEX.timber = (base) => canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = base; c.fillRect(0, 0, w, h); noise(c, w, h, 0.1, 6000);
    c.fillStyle = '#3a2513';
    c.fillRect(0, 0, w, 22); c.fillRect(0, h - 22, w, 22); c.fillRect(0, h / 2 - 11, w, 22);
    c.fillRect(0, 0, 22, h); c.fillRect(w - 22, 0, 22, h); c.fillRect(w / 2 - 11, 0, 22, h);
    c.lineWidth = 18; c.strokeStyle = '#3a2513';
    c.beginPath(); c.moveTo(0, h / 2); c.lineTo(w / 2, 0); c.moveTo(w / 2, h / 2); c.lineTo(w, 0); c.stroke();
  });
  TEX.window = canvasTex(128, 128, (c, w, h) => { c.fillStyle = '#ffd98a'; c.fillRect(0, 0, w, h); c.fillStyle = '#3a2513'; c.fillRect(0, 0, w, 10); c.fillRect(0, h - 10, w, 10); c.fillRect(0, 0, 10, h); c.fillRect(w - 10, 0, 10, h); c.fillRect(w / 2 - 5, 0, 10, h); c.fillRect(0, h / 2 - 5, w, 10); });
}

// ---------- materiais ----------
let toonGrad;
export function toonGradient() {
  if (toonGrad) return toonGrad;
  const d = new Uint8Array([90, 90, 90, 255, 175, 175, 175, 255, 255, 255, 255, 255]);
  toonGrad = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat);
  toonGrad.minFilter = toonGrad.magFilter = THREE.NearestFilter; toonGrad.needsUpdate = true;
  return toonGrad;
}
export const toon = (color, extra = {}) => new THREE.MeshToonMaterial({ color, gradientMap: toonGradient(), ...extra });
export const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0, ...extra });
export const BLACK = new THREE.MeshBasicMaterial({ color: 0x111111 });

const outlineMats = {};
export function outlineMat(th = 0.02, color = 0x111111) {
  const k = th + '_' + color; if (outlineMats[k]) return outlineMats[k];
  const m = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide });
  m.onBeforeCompile = (s) => { s.vertexShader = s.vertexShader.replace('#include <begin_vertex>', `vec3 transformed = position + normalize(normal) * ${th.toFixed(4)};`); };
  outlineMats[k] = m; return m;
}
export function withOutline(mesh, th = 0.02) {
  const o = new THREE.Mesh(mesh.geometry, outlineMat(th)); o.castShadow = false; o.raycast = () => {};
  mesh.add(o); return mesh;
}
export function mesh(geo, mat, { cast = true, recv = true } = {}) { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = recv; return m; }
export const box = (w, h, d, mat, r = 0) => mesh(r ? new RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d), mat);

// ---------- rostos ----------
const SKIN = '#f6f4ee';
function drawFace(c, expr, o) {
  const W = 512; c.clearRect(0, 0, W, W);
  const cx = 256, ey = 222, dx = 74, my = 335;
  const ink = '#141414';
  c.lineCap = 'round'; c.lineJoin = 'round';
  // bochechas
  if (o.cheeks !== false) { c.fillStyle = 'rgba(255,140,140,0.22)'; [-1, 1].forEach(s => { c.beginPath(); c.ellipse(cx + s * 118, 300, 34, 20, 0, 0, 7); c.fill(); }); }
  const look = o.look || [0, 0];
  const eye = (s, kind) => {
    const x = cx + s * dx, y = ey, r = expr === 'shock' ? 40 : 32;
    if (kind === 'closed') { c.strokeStyle = ink; c.lineWidth = 10; c.beginPath(); c.moveTo(x - 28, y + 4); c.quadraticCurveTo(x, y + 12, x + 28, y + 4); c.stroke(); return; }
    if (kind === 'happy') { c.strokeStyle = ink; c.lineWidth = 11; c.beginPath(); c.arc(x, y + 12, 26, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); return; }
    c.fillStyle = '#fff'; c.strokeStyle = ink; c.lineWidth = 8;
    c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.stroke();
    c.fillStyle = ink; const pr = expr === 'shock' ? 9 : 13;
    c.beginPath(); c.arc(x + look[0] * 12, y + look[1] * 10 + (kind === 'lid' ? 8 : 0), pr, 0, 7); c.fill();
    if (kind === 'lid' || kind === 'angry') {
      // pálpebra (meio fechada) na cor da pele
      c.save(); c.beginPath(); c.arc(x, y, r + 1, 0, 7); c.clip();
      c.fillStyle = SKIN; c.beginPath();
      if (kind === 'lid') c.rect(x - r - 2, y - r - 2, 2 * r + 4, r + 2);
      else { c.moveTo(x - r - 2, y - r - 2); c.lineTo(x + r + 2, y - r - 2); c.lineTo(x + r + 2, y + (s > 0 ? -2 : -14)); c.lineTo(x - r - 2, y + (s > 0 ? -14 : -2)); c.closePath(); }
      c.fill(); c.restore();
      c.strokeStyle = ink; c.lineWidth = 9; c.beginPath();
      if (kind === 'lid') { c.moveTo(x - r, y); c.lineTo(x + r, y); }
      else { c.moveTo(x - r, y + (s > 0 ? -14 : -2)); c.lineTo(x + r, y + (s > 0 ? -2 : -14)); }
      c.stroke();
      c.beginPath(); c.arc(x, y, r, 0, 7); c.lineWidth = 8; c.stroke();
    }
  };
  const brow = (s, ang, lift = 0, thick = 13) => {
    const x = cx + s * dx, y = ey - 58 - lift;
    c.strokeStyle = ink; c.lineWidth = thick; c.beginPath();
    c.moveTo(x - 30 * s * -1 - 0, y + ang * s * 1); // inner end
    c.lineTo(x + 30 * s, y - ang * s * 1 + (ang < 0 ? 0 : 0));
    c.stroke();
  };
  const browPair = (inner, lift = 0) => { // inner>0: bravo (\ /), inner<0: preocupado (/ \)
    [-1, 1].forEach(s => { const x = cx + s * dx, y = ey - 58 - lift; c.strokeStyle = ink; c.lineWidth = 13; c.beginPath(); c.moveTo(x - s * 30, y + inner); c.lineTo(x + s * 30, y - inner * 0.4); c.stroke(); });
  };
  let eyes = ['open', 'open'];
  switch (expr) {
    case 'smug': eyes = ['lid', 'lid']; break;
    case 'angry': eyes = ['angry', 'angry']; break;
    case 'happy': case 'laugh': eyes = ['happy', 'happy']; break;
    case 'wink': eyes = ['lid', 'closed']; break;
    case 'blink': eyes = ['closed', 'closed']; break;
  }
  if (o.blink && eyes[0] !== 'happy') eyes = ['closed', 'closed'];
  eye(-1, eyes[0]); eye(1, eyes[1]);
  // sobrancelhas
  if (expr === 'smug') { [-1, 1].forEach(s => { const x = cx + s * dx, y = ey - 50 - (s > 0 ? 18 : 0); c.strokeStyle = ink; c.lineWidth = 13; c.beginPath(); c.moveTo(x - 30, y + 4); c.lineTo(x + 30, y - 2); c.stroke(); }); }
  else if (expr === 'angry') browPair(22);
  else if (expr === 'worried' || expr === 'shock') browPair(-16, expr === 'shock' ? 22 : 4);
  else if (expr === 'wink') { [-1, 1].forEach(s => { const x = cx + s * dx, y = ey - 52 - (s < 0 ? 14 : 0); c.strokeStyle = ink; c.lineWidth = 13; c.beginPath(); c.moveTo(x - 28, y); c.lineTo(x + 28, y - 4); c.stroke(); }); }
  else if (expr !== 'happy' && expr !== 'laugh') browPair(0, 0);
  else browPair(-6, 10);
  // bigode
  const mustache = () => {
    c.fillStyle = o.hairColor || ink;
    [-1, 1].forEach(s => { c.beginPath(); c.moveTo(cx, my - 30); c.bezierCurveTo(cx + s * 30, my - 50, cx + s * 70, my - 40, cx + s * 92, my - 12); c.bezierCurveTo(cx + s * 70, my - 22, cx + s * 40, my - 14, cx, my - 18); c.fill(); });
  };
  // boca
  c.strokeStyle = ink; c.lineWidth = 10;
  if (o.beard) { c.fillStyle = o.hairColor || '#5a3a1a'; c.beginPath(); c.moveTo(cx - 120, 300); c.quadraticCurveTo(cx - 110, 470, cx, 500); c.quadraticCurveTo(cx + 110, 470, cx + 120, 300); c.quadraticCurveTo(cx + 60, 390, cx, 385); c.quadraticCurveTo(cx - 60, 390, cx - 120, 300); c.fill(); }
  const openMouth = (wid, hgt, y = my) => {
    c.fillStyle = '#4a1010'; c.beginPath(); c.moveTo(cx - wid, y - 6); c.quadraticCurveTo(cx, y - 14, cx + wid, y - 6); c.quadraticCurveTo(cx + wid * 0.8, y + hgt, cx, y + hgt); c.quadraticCurveTo(cx - wid * 0.8, y + hgt, cx - wid, y - 6); c.fill();
    c.fillStyle = '#e46a6a'; c.beginPath(); c.ellipse(cx, y + hgt * 0.72, wid * 0.5, hgt * 0.25, 0, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.fillRect(cx - wid * 0.7, y - 8, wid * 1.4, 10);
    c.lineWidth = 8; c.strokeStyle = ink; c.beginPath(); c.moveTo(cx - wid, y - 6); c.quadraticCurveTo(cx, y - 14, cx + wid, y - 6); c.quadraticCurveTo(cx + wid * 0.8, y + hgt, cx, y + hgt); c.quadraticCurveTo(cx - wid * 0.8, y + hgt, cx - wid, y - 6); c.stroke();
  };
  switch (expr) {
    case 'smug': case 'wink': c.beginPath(); c.moveTo(cx - 34, my + 2); c.quadraticCurveTo(cx + 10, my + 16, cx + 44, my - 10); c.stroke(); break;
    case 'happy': openMouth(46, 50); break;
    case 'laugh': openMouth(56, 68, my - 4); break;
    case 'shock': c.fillStyle = '#4a1010'; c.beginPath(); c.ellipse(cx, my + 14, 24, 32, 0, 0, 7); c.fill(); c.stroke(); break;
    case 'angry': c.fillStyle = '#fff'; c.beginPath(); c.rect(cx - 40, my - 4, 80, 26); c.fill(); c.stroke(); c.lineWidth = 5; c.beginPath(); c.moveTo(cx - 40, my + 9); c.lineTo(cx + 40, my + 9); for (let i = -20; i <= 20; i += 20) { c.moveTo(cx + i, my - 4); c.lineTo(cx + i, my + 22); } c.stroke(); break;
    case 'worried': c.beginPath(); c.moveTo(cx - 36, my + 6); for (let i = 0; i <= 6; i++) c.lineTo(cx - 36 + i * 12, my + 6 + (i % 2 ? -7 : 5)); c.stroke(); break;
    case 'talk': openMouth(30, 30); break;
    default: c.beginPath(); c.moveTo(cx - 26, my + 4); c.quadraticCurveTo(cx, my + 10, cx + 26, my + 4); c.stroke();
  }
  if (o.mustache) mustache();
  if (expr === 'worried' || o.sweat) { c.fillStyle = '#7fc8ff'; c.strokeStyle = ink; c.lineWidth = 5; c.beginPath(); const x = cx + 170, y = 150; c.moveTo(x, y); c.quadraticCurveTo(x + 22, y + 40, x, y + 52); c.quadraticCurveTo(x - 22, y + 40, x, y); c.fill(); c.stroke(); }
  if (o.monocle) { c.strokeStyle = '#c9a227'; c.lineWidth = 8; c.beginPath(); c.arc(cx + dx, ey, 46, 0, 7); c.stroke(); c.beginPath(); c.moveTo(cx + dx + 40, ey + 24); c.quadraticCurveTo(cx + dx + 80, ey + 120, cx + dx + 60, 470); c.stroke(); }
  if (expr === 'angry' && o.redEyes) {}
}

// ---------- personagem ----------
export const charList = [];
export function makeChar(o = {}) {
  const P = Object.assign({ body: '#c0392b', legLen: 0.95, bodyR: 0.33, bodyLen: 0.32, headR: 0.47, hat: null, expr: 'neutral', hair: '#3a2410' }, o);
  const root = new THREE.Group();
  const rig = new THREE.Group(); root.add(rig); // para bob/inclinação
  const legMat = new THREE.MeshBasicMaterial({ color: 0x151515 });
  const legs = [];
  for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(s * 0.13, P.legLen, 0); rig.add(hip);
    const leg = mesh(new THREE.CylinderGeometry(0.032, 0.032, P.legLen, 8), legMat); leg.position.y = -P.legLen / 2; hip.add(leg);
    const foot = mesh(new THREE.SphereGeometry(0.1, 12, 8), legMat); foot.scale.set(0.8, 0.45, 1.3); foot.position.set(0, -P.legLen + 0.02, 0.06); hip.add(foot);
    legs.push(hip);
  }
  const bodyY = P.legLen + P.bodyR + P.bodyLen / 2 - 0.08;
  const torso = new THREE.Group(); torso.position.y = bodyY; rig.add(torso);
  const bodyMat = toon(P.body);
  const body = withOutline(mesh(new THREE.CapsuleGeometry(P.bodyR, P.bodyLen, 8, 24), bodyMat), 0.022);
  body.scale.set(1, 1, 0.88); torso.add(body);
  // detalhes do corpo
  if (P.apron) { const ap = mesh(new THREE.CylinderGeometry(P.bodyR * 1.03, P.bodyR * 1.05, P.bodyLen + P.bodyR * 0.9, 24, 1, true, -1.0, 2.0), toon('#f4f1e8', { side: THREE.DoubleSide })); ap.position.y = -0.12; ap.scale.z = 0.9; torso.add(ap); }
  if (P.buttons !== false) for (let i = 0; i < 3; i++) { const b = mesh(new THREE.SphereGeometry(0.028, 8, 6), toon(P.buttonColor || '#222')); b.position.set(0, 0.16 - i * 0.14, P.bodyR * 0.88 + (P.apron ? 0.02 : 0.005)); torso.add(b); }
  if (P.belt) { const bl = mesh(new THREE.TorusGeometry(P.bodyR * 0.99, 0.035, 8, 32), toon(P.belt)); bl.rotation.x = Math.PI / 2; bl.scale.y = 0.88; bl.position.y = -0.12; torso.add(bl); const bk = mesh(new THREE.BoxGeometry(0.1, 0.08, 0.03), std('#d4af37', { metalness: .8, roughness: .3 })); bk.position.set(0, -0.12, P.bodyR * 0.9); torso.add(bk); }
  if (P.collar) { const cl = withOutline(mesh(new THREE.TorusGeometry(P.bodyR * 0.75, 0.09, 10, 32), toon(P.collar)), 0.015); cl.rotation.x = Math.PI / 2; cl.position.y = P.bodyLen / 2 + P.bodyR * 0.55; torso.add(cl); if (P.ermine) for (let i = 0; i < 10; i++) { const d = mesh(new THREE.SphereGeometry(0.018, 6, 4), BLACK); const a = i / 10 * Math.PI * 2; d.position.set(Math.cos(a) * P.bodyR * 0.75, P.bodyLen / 2 + P.bodyR * 0.55 + 0.05, Math.sin(a) * P.bodyR * 0.75); torso.add(d); } }
  // braços
  const arms = [];
  const shoulderY = P.bodyLen / 2 + 0.1;
  for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(s * (P.bodyR - 0.02), shoulderY, 0); torso.add(sh);
    const upper = mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.42, 8), legMat); upper.position.y = -0.21; sh.add(upper);
    const elbow = new THREE.Group(); elbow.position.y = -0.42; sh.add(elbow);
    const lower = mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.38, 8), legMat); lower.position.y = -0.19; elbow.add(lower);
    const hand = new THREE.Group(); hand.position.y = -0.38; elbow.add(hand);
    const hb = mesh(new THREE.SphereGeometry(0.055, 10, 8), legMat); hand.add(hb);
    sh.rotation.z = s * 0.25; elbow.rotation.x = -0.2;
    arms.push({ sh, elbow, hand });
  }
  // cabeça
  const neck = new THREE.Group(); neck.position.y = P.bodyLen / 2 + P.bodyR - 0.05; torso.add(neck);
  const head = new THREE.Group(); head.position.y = P.headR * 0.85; neck.add(head);
  const skull = withOutline(mesh(new THREE.SphereGeometry(P.headR, 40, 28), toon(SKIN, { emissive: '#ffffff', emissiveIntensity: 0.22 })), 0.024);
  skull.scale.set(1.04, 0.96, 1); head.add(skull);
  const faceCanvas = document.createElement('canvas'); faceCanvas.width = faceCanvas.height = 512;
  const faceTex = new THREE.CanvasTexture(faceCanvas); faceTex.colorSpace = THREE.SRGBColorSpace; faceTex.anisotropy = 4;
  const faceGeo = new THREE.SphereGeometry(P.headR * 1.006, 48, 32, Math.PI / 2 - 1.05, 2.1, Math.PI / 2 - 0.95, 1.9);
  const face = new THREE.Mesh(faceGeo, new THREE.MeshToonMaterial({ map: faceTex, transparent: true, gradientMap: toonGradient(), depthWrite: false, emissive: '#ffffff', emissiveMap: faceTex, emissiveIntensity: 0.22 }));
  face.scale.copy(skull.scale); face.renderOrder = 2; head.add(face);
  // cabelo atrás (quando sem chapéu alto)
  if (P.hairCap) { const hc = withOutline(mesh(new THREE.SphereGeometry(P.headR * 1.02, 32, 16, 0, Math.PI * 2, 0, 1.15), toon(P.hair)), 0.02); hc.rotation.x = -0.5; head.add(hc); }
  // chapéus
  const hat = new THREE.Group(); hat.position.y = P.headR * 0.62; head.add(hat);
  buildHat(hat, P);
  const ch = { root, rig, torso, body, head, neck, arms, legs, P, face: { canvas: faceCanvas, tex: faceTex, key: '' }, expr: P.expr, look: [0, 0], blinkSeed: R() * 10, hat };
  ch.setExpr = (e) => { ch.expr = e; };
  ch.updateFace = (t) => {
    const blink = ch.noBlink ? false : ((t + ch.blinkSeed) % 3.7) < 0.12;
    const key = ch.expr + (blink ? 'b' : '') + ch.look.join(',');
    if (key === ch.face.key) return;
    ch.face.key = key;
    drawFace(ch.face.canvas.getContext('2d'), ch.expr, { blink, look: ch.look, mustache: P.mustache, beard: P.beard, hairColor: P.hairColor, monocle: P.monocle, sweat: ch.sweat, cheeks: P.cheeks });
    ch.face.tex.needsUpdate = true;
  };
  charList.push(ch);
  return ch;
}

function buildHat(hat, P) {
  const o = (m, th = 0.018) => withOutline(m, th);
  switch (P.hat) {
    case 'toque': {
      const band = o(mesh(new THREE.CylinderGeometry(0.36, 0.34, 0.22, 28), toon('#fbfaf5'))); band.position.y = 0.02; hat.add(band);
      const puffs = [[0, 0.32, 0, 0.3], [0.18, 0.26, 0.05, 0.22], [-0.18, 0.26, 0.05, 0.22], [0, 0.26, -0.17, 0.22], [0, 0.27, 0.17, 0.22]];
      puffs.forEach(([x, y, z, r]) => { const p = o(mesh(new THREE.SphereGeometry(r, 20, 14), toon('#fbfaf5'))); p.position.set(x, y, z); hat.add(p); });
      hat.rotation.x = -0.12; break;
    }
    case 'crown': {
      const gold = std('#f2c230', { metalness: 1, roughness: 0.25, emissive: '#5a3a00', emissiveIntensity: 0.4 });
      const ring = mesh(new THREE.CylinderGeometry(0.34, 0.32, 0.14, 32, 1, true), gold); ring.material.side = THREE.DoubleSide; hat.add(ring);
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const sp = mesh(new THREE.ConeGeometry(0.06, 0.2, 6), gold); sp.position.set(Math.sin(a) * 0.33, 0.16, Math.cos(a) * 0.33); hat.add(sp); const ball = mesh(new THREE.SphereGeometry(0.03, 8, 6), gold); ball.position.set(Math.sin(a) * 0.33, 0.27, Math.cos(a) * 0.33); hat.add(ball); const gem = mesh(new THREE.SphereGeometry(0.035, 10, 8), std(i % 2 ? '#d01c3c' : '#1c5ad0', { roughness: .1, metalness: .3, emissive: i % 2 ? '#400010' : '#001040' })); gem.position.set(Math.sin(a) * 0.335, 0.0, Math.cos(a) * 0.335); hat.add(gem); }
      const vel = mesh(new THREE.SphereGeometry(0.3, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), toon('#8a1020')); vel.position.y = 0.02; vel.scale.y = 0.6; hat.add(vel);
      hat.position.y += 0.02; break;
    }
    case 'tophat': {
      const m = toon(P.hatColor || '#1d1d22');
      const brim = o(mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.04, 32), m)); hat.add(brim);
      const top = o(mesh(new THREE.CylinderGeometry(0.3, 0.29, 0.55, 32), m)); top.position.y = 0.28; hat.add(top);
      const band = mesh(new THREE.CylinderGeometry(0.297, 0.297, 0.09, 32), toon(P.bandColor || '#7a1a1a')); band.position.y = 0.07; hat.add(band);
      hat.rotation.z = 0.08; break;
    }
    case 'cap': {
      const m = toon(P.hatColor || '#55606e');
      const dome = o(mesh(new THREE.SphereGeometry(0.42, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), m)); dome.scale.y = 0.55; dome.position.y = -0.08; hat.add(dome);
      const visor = o(mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.03, 20, 1, false, -0.9, 1.8), m)); visor.position.set(0, -0.08, 0.28); hat.add(visor);
      break;
    }
    case 'helmet': {
      const m = std('#9aa3ab', { metalness: 0.9, roughness: 0.35 });
      const dome = mesh(new THREE.SphereGeometry(0.4, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), m); dome.position.y = -0.06; hat.add(dome);
      const brim = mesh(new THREE.CylinderGeometry(0.62, 0.55, 0.05, 32), m); brim.position.y = -0.06; hat.add(brim);
      break;
    }
    case 'beret': {
      const b = o(mesh(new THREE.SphereGeometry(0.42, 24, 12), toon(P.hatColor || '#2d4f8a'))); b.scale.set(1.05, 0.35, 1.05); b.position.set(0.05, 0.02, -0.03); b.rotation.z = -0.25; hat.add(b); break;
    }
    case 'bonnet': {
      const b = o(mesh(new THREE.SphereGeometry(0.5, 28, 16, 0, Math.PI * 2, 0, 1.6), toon(P.hatColor || '#f2efe6'))); b.rotation.x = -0.6; b.position.set(0, -0.2, -0.05); hat.add(b); break;
    }
    case 'hood': {
      const b = o(mesh(new THREE.SphereGeometry(0.53, 28, 16, 0, Math.PI * 2, 0, 1.75), toon(P.hatColor || '#6b4a2a'))); b.rotation.x = -0.75; b.position.set(0, -0.25, -0.08); hat.add(b); break;
    }
  }
}

// ---------- props ----------
export function loaf(scale = 1) {
  const g = new THREE.Group();
  const m = mesh(new THREE.SphereGeometry(0.2, 24, 14), new THREE.MeshStandardMaterial({ map: TEX.bread, roughness: 0.75, color: '#ffffff' }));
  m.scale.set(1.45, 0.75, 0.9); g.add(m); g.scale.setScalar(scale);
  withOutline(m, 0.012);
  return g;
}
export function balanceScale() {
  const g = new THREE.Group(); const brass = std('#d9b23a', { metalness: 0.7, roughness: 0.3, emissive: '#3a2a00', emissiveIntensity: 0.5 });
  const pole = mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.75, 10), brass); pole.position.y = 0.375; g.add(pole);
  const base = mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.05, 20), brass); g.add(base);
  const beam = new THREE.Group(); beam.position.y = 0.75; g.add(beam);
  const bar = mesh(new THREE.BoxGeometry(0.9, 0.035, 0.035), brass); beam.add(bar);
  const pans = [];
  for (const s of [-1, 1]) {
    const hang = new THREE.Group(); hang.position.x = s * 0.43; beam.add(hang);
    for (const a of [0, 2.1, 4.2]) { const ch = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.4, 4), brass); ch.position.set(Math.cos(a) * 0.08, -0.2, Math.sin(a) * 0.08); ch.rotation.z = Math.cos(a) * 0.2; ch.rotation.x = -Math.sin(a) * 0.2; hang.add(ch); }
    const pan = mesh(new THREE.CylinderGeometry(0.17, 0.12, 0.04, 24), brass); pan.position.y = -0.41; hang.add(pan);
    pans.push(hang);
  }
  return { g, beam, pans };
}
export function scroll() {
  const g = new THREE.Group();
  const paper = mesh(new THREE.PlaneGeometry(0.8, 1.0), new THREE.MeshStandardMaterial({ map: TEX.paper, roughness: 0.9, side: THREE.DoubleSide }), { cast: true, recv: false });
  g.add(paper);
  for (const s of [-1, 1]) { const rod = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.95, 12), std('#6b3f1d')); rod.rotation.z = Math.PI / 2; rod.position.y = s * 0.51; g.add(rod); }
  return g;
}
export function cloud(seed) {
  const r = rng(seed); const g = new THREE.Group(); const m = new THREE.MeshLambertMaterial({ color: '#ffffff', emissive: '#c8d8f0', emissiveIntensity: 0.35 });
  for (let i = 0; i < 7; i++) { const s = mesh(new THREE.SphereGeometry(1, 14, 10), m, { cast: false, recv: false }); s.scale.setScalar(1.2 + r() * 1.4); s.position.set((r() - .5) * 5, r() * 1.2, (r() - .5) * 1.5); g.add(s); }
  return g;
}
export function skyDome(top = '#3d7fd6', bottom = '#cfe6ff') {
  const m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: { top: { value: new THREE.Color(top) }, bottom: { value: new THREE.Color(bottom) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} ',
    fragmentShader: 'uniform vec3 top; uniform vec3 bottom; varying vec3 vP; void main(){ float h = clamp(vP.y*1.6+0.1,0.0,1.0); gl_FragColor = vec4(mix(bottom, top, pow(h,0.8)),1.0);\n#include <colorspace_fragment>\n}' });
  const s = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), m); s.renderOrder = -1; return s;
}
export function house(w, h, d, base, seed) {
  const r = rng(seed); const g = new THREE.Group();
  const wallTex = TEX.timber(base); wallTex.repeat.set(Math.max(1, Math.round(w / 2.5)), Math.max(1, Math.round(h / 2.5)));
  const walls = box(w, h, d, std('#ffffff', { map: wallTex })); walls.position.y = h / 2; g.add(walls);
  const roofH = 1.4 + r() * 1.2;
  const shape = new THREE.Shape(); shape.moveTo(-w / 2 - 0.3, 0); shape.lineTo(0, roofH); shape.lineTo(w / 2 + 0.3, 0); shape.lineTo(-w / 2 - 0.3, 0);
  const roof = mesh(new THREE.ExtrudeGeometry(shape, { depth: d + 0.6, bevelEnabled: false }), std(['#7a2e1e', '#5a3a2a', '#8a4a2a', '#3e3a3a'][Math.floor(r() * 4)], { roughness: .9 }));
  roof.position.set(0, h, -d / 2 - 0.3); g.add(roof);
  const ch = box(0.5, 1.4, 0.5, std('#7a4a3a', { map: TEX.brick })); ch.position.set(w * 0.25, h + roofH * 0.6, 0); g.add(ch);
  // janelas
  const wm = new THREE.MeshStandardMaterial({ map: TEX.window, emissive: '#ffb84a', emissiveIntensity: 0.15, roughness: .4 });
  for (let i = 0; i < Math.floor(w / 1.6); i++) { const win = mesh(new THREE.PlaneGeometry(0.7, 0.8), wm, { cast: false }); win.position.set(-w / 2 + 0.9 + i * 1.6, h * 0.72, d / 2 + 0.01); g.add(win); }
  const door = box(0.9, 1.6, 0.1, std('#4a2c14', { map: TEX.planks })); door.position.set(r() > .5 ? -w * .25 : w * .2, 0.8, d / 2); g.add(door);
  return g;
}
export function tree(seed) {
  const r = rng(seed); const g = new THREE.Group();
  const trunk = mesh(new THREE.CylinderGeometry(0.15, 0.25, 2.2, 8), std('#5a3a1e')); trunk.position.y = 1.1; g.add(trunk);
  const lm = toon(hsl(95 + r() * 20, 45, 32));
  for (let i = 0; i < 5; i++) { const l = mesh(new THREE.IcosahedronGeometry(0.9 + r() * 0.5, 1), lm); l.position.set((r() - .5) * 1.4, 2.4 + r() * 1.2, (r() - .5) * 1.4); g.add(l); }
  return g;
}
export function lantern() {
  const g = new THREE.Group();
  const frame = std('#222', { metalness: .7, roughness: .4 });
  const glass = mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.28, 6), new THREE.MeshStandardMaterial({ color: '#ffcf70', emissive: '#ffae3a', emissiveIntensity: 3, transparent: true, opacity: .9 }), { cast: false });
  g.add(glass);
  const cap = mesh(new THREE.ConeGeometry(0.16, 0.14, 6), frame); cap.position.y = 0.2; g.add(cap);
  const bot = mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.04, 6), frame); bot.position.y = -0.15; g.add(bot);
  return g;
}
export function tomato() {
  const g = new THREE.Group();
  const t = withOutline(mesh(new THREE.SphereGeometry(0.11, 16, 12), toon('#d62a1a')), 0.01); g.add(t);
  const st = mesh(new THREE.ConeGeometry(0.04, 0.05, 5), toon('#2f7a22')); st.position.y = 0.11; g.add(st);
  return g;
}
