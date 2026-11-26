// Biblioteca v2: texturas com relevo, materiais, personagens articulados, poses, caminhada e props
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

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
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const sstep = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };

// ---------- texturas em canvas (+ normal map gerado da luminância) ----------
function normalFromCanvas(src, strength = 2) {
  const w = src.width, h = src.height;
  const d = src.getContext('2d').getImageData(0, 0, w, h).data;
  const hgt = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) hgt[i] = (d[i * 4] * 0.3 + d[i * 4 + 1] * 0.59 + d[i * 4 + 2] * 0.11) / 255;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d'); const img = ctx.createImageData(w, h); const o = img.data;
  const at = (x, y) => hgt[((y + h) % h) * w + ((x + w) % w)];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x - 1, y) - at(x - 1, y + 1)) * strength;
    const dy = (at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1)) * strength;
    const nx = -dx, ny = dy, nz = 1; const l = Math.hypot(nx, ny, nz);
    const i = (y * w + x) * 4; o[i] = (nx / l * 0.5 + 0.5) * 255; o[i + 1] = (ny / l * 0.5 + 0.5) * 255; o[i + 2] = (nz / l * 0.5 + 0.5) * 255; o[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}
function texFrom(canvas, rep, srgb) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]);
  t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
export function canvasTex(w, h, draw, rep = [1, 1], srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  return texFrom(c, rep, srgb);
}
export function canvasTexN(w, h, draw, rep = [1, 1], strength = 2) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const n = normalFromCanvas(c, strength);
  return { map: texFrom(c, rep, true), normalMap: texFrom(n, rep, false) };
}
export function repTex(set, x, y) { const o = { map: set.map.clone(), normalMap: set.normalMap.clone() }; o.map.repeat.set(x, y); o.normalMap.repeat.set(x, y); o.map.needsUpdate = o.normalMap.needsUpdate = true; return o; }
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
  TEX.planks = canvasTexN(1024, 1024, (c, w, h) => {
    const n = 8;
    for (let i = 0; i < n; i++) {
      const y0 = i * h / n, ph = h / n;
      c.fillStyle = hsl(26 + R() * 8, 40 + R() * 14, 30 + R() * 12); c.fillRect(0, y0, w, ph);
      for (let k = 0; k < 70; k++) { c.strokeStyle = `rgba(40,20,5,${0.08 + R() * 0.16})`; c.lineWidth = 1 + R() * 2.5; c.beginPath(); const y = y0 + R() * ph; c.moveTo(0, y); c.bezierCurveTo(w * .3, y + R() * 8 - 4, w * .6, y + R() * 8 - 4, w, y + R() * 6 - 3); c.stroke(); }
      for (let k = 0; k < 2; k++) { const kx = R() * w, ky = y0 + ph * (0.3 + R() * 0.4); c.fillStyle = 'rgba(50,25,8,0.55)'; c.beginPath(); c.ellipse(kx, ky, 10 + R() * 8, 5 + R() * 3, 0, 0, 7); c.fill(); }
      c.fillStyle = 'rgba(15,8,0,0.9)'; c.fillRect(0, y0, w, 5);
      const cut = R() * w; c.fillRect(cut, y0, 5, ph);
      c.fillStyle = 'rgba(30,30,30,0.9)'; for (const nx of [cut - 18, cut + 22]) { c.beginPath(); c.arc(nx, y0 + ph * 0.3, 4, 0, 7); c.arc(nx, y0 + ph * 0.7, 4, 0, 7); c.fill(); }
    }
    noise(c, w, h, 0.15, 12000);
  }, [1, 1], 3);
  TEX.plaster = canvasTexN(1024, 1024, (c, w, h) => {
    c.fillStyle = '#ebdec4'; c.fillRect(0, 0, w, h); noise(c, w, h, 0.14, 30000);
    for (let i = 0; i < 60; i++) { c.fillStyle = `rgba(120,90,50,${R() * 0.07})`; c.beginPath(); c.arc(R() * w, R() * h, 20 + R() * 90, 0, 7); c.fill(); }
    for (let i = 0; i < 12; i++) { c.strokeStyle = 'rgba(90,70,50,0.25)'; c.lineWidth = 1; c.beginPath(); let x = R() * w, y = R() * h; c.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (R() - .5) * 40; y += R() * 30; c.lineTo(x, y); } c.stroke(); }
    for (let i = 0; i < 6; i++) { c.fillStyle = 'rgba(150,80,60,0.5)'; const x = R() * w, y = R() * h; for (let k = 0; k < 4; k++) c.fillRect(x + (k % 2) * 34, y + k * 15, 30, 12); }
  }, [1, 1], 1.5);
  TEX.brick = canvasTexN(1024, 1024, (c, w, h) => {
    c.fillStyle = '#6e5e50'; c.fillRect(0, 0, w, h); noise(c, w, h, 0.3, 20000);
    const bh = 64, bw = 170;
    for (let y = 0; y < h / bh; y++) for (let x = -1; x < w / bw + 1; x++) {
      const ox = (y % 2) * bw / 2;
      const g = c.createLinearGradient(0, y * bh, 0, y * bh + bh);
      const l = 30 + R() * 14, hh = 8 + R() * 16;
      g.addColorStop(0, hsl(hh, 50, l + 6)); g.addColorStop(1, hsl(hh, 48, l - 4));
      c.fillStyle = g; c.beginPath(); c.roundRect(x * bw + ox + 5, y * bh + 5, bw - 10, bh - 10, 6); c.fill();
      if (R() < 0.25) { c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x * bw + ox + 10, y * bh + 10, (bw - 20) * R(), bh - 20); }
    }
    noise(c, w, h, 0.22, 25000);
  }, [1, 1], 3);
  TEX.stone = canvasTexN(1024, 1024, (c, w, h) => {
    c.fillStyle = '#3e3e44'; c.fillRect(0, 0, w, h);
    const bh = 128, bw = 256;
    for (let y = 0; y < h / bh; y++) for (let x = -1; x < w / bw + 1; x++) {
      const ox = (y % 2) * bw / 2; const l = 38 + R() * 18;
      const g = c.createLinearGradient(0, y * bh, 0, y * bh + bh); g.addColorStop(0, hsl(220, 6, l + 6)); g.addColorStop(1, hsl(220, 6, l - 6));
      c.fillStyle = g; c.beginPath(); c.roundRect(x * bw + ox + 7, y * bh + 7, bw - 14, bh - 14, 10); c.fill();
    }
    noise(c, w, h, 0.25, 40000);
    for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(60,90,40,${R() * 0.25})`; c.beginPath(); c.arc(R() * w, R() * h, 4 + R() * 20, 0, 7); c.fill(); }
  }, [1, 1], 3);
  TEX.cobble = canvasTexN(1024, 1024, (c, w, h) => {
    c.fillStyle = '#34312d'; c.fillRect(0, 0, w, h);
    const N = 14;
    for (let y = 0; y < N; y++) for (let x = 0; x < N + 1; x++) {
      const cx = (x + (y % 2) * 0.5) * w / N + (R() - .5) * 10, cy = (y + 0.5) * h / N + (R() - .5) * 10;
      const rx = 28 + R() * 6, ry = 25 + R() * 6, rot = R() * 3;
      const l = 42 + R() * 20;
      const g = c.createRadialGradient(cx - 8, cy - 8, 2, cx, cy, rx);
      g.addColorStop(0, hsl(30 + R() * 20, 10, l + 12)); g.addColorStop(1, hsl(30 + R() * 20, 9, l - 12));
      c.fillStyle = g; c.beginPath(); c.ellipse(cx, cy, rx, ry, rot, 0, 7); c.fill();
    }
    noise(c, w, h, 0.18, 20000);
    for (let i = 0; i < 25; i++) { c.fillStyle = `rgba(70,100,40,${0.2 + R() * 0.3})`; c.beginPath(); c.arc(R() * w, R() * h, 2 + R() * 5, 0, 7); c.fill(); }
  }, [1, 1], 4);
  TEX.roof = canvasTexN(512, 512, (c, w, h) => {
    const rows = 8, cols = 6;
    for (let y = 0; y < rows; y++) for (let x = -1; x < cols + 1; x++) {
      const ox = (y % 2) * w / cols / 2; const tx = x * w / cols + ox, ty = y * h / rows;
      const g = c.createLinearGradient(0, ty, 0, ty + h / rows);
      const hh = 8 + R() * 14, l = 28 + R() * 12;
      g.addColorStop(0, hsl(hh, 45, l - 10)); g.addColorStop(1, hsl(hh, 50, l + 8));
      c.fillStyle = g; c.beginPath(); c.roundRect(tx + 2, ty, w / cols - 4, h / rows + 6, [0, 0, 18, 18]); c.fill();
    }
    noise(c, w, h, 0.2, 9000);
  }, [1, 1], 3);
  TEX.bread = canvasTex(512, 256, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#8a4a18'); g.addColorStop(.45, '#c1802f'); g.addColorStop(1, '#e8b56a');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) { const x = 120 + i * 90; const gg = c.createLinearGradient(x - 30, 0, x + 30, 0); gg.addColorStop(0, '#f6dca6'); gg.addColorStop(1, '#d9a85e'); c.strokeStyle = gg; c.lineWidth = 16; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - 30, 50); c.quadraticCurveTo(x, 80, x + 30, 120); c.stroke(); }
    noise(c, w, h, 0.25, 4000);
    for (let i = 0; i < 300; i++) { c.fillStyle = 'rgba(255,250,235,0.5)'; c.fillRect(R() * w, R() * h * 0.5, 2, 2); }
  });
  TEX.paper = canvasTex(512, 640, (c, w, h) => {
    c.fillStyle = '#efe0b8'; c.fillRect(0, 0, w, h); noise(c, w, h, 0.1, 8000);
    const g = c.createRadialGradient(w / 2, h / 2, 100, w / 2, h / 2, 420); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(120,80,20,0.35)'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = '#3b2412'; c.textAlign = 'center';
    c.font = 'bold 56px DejaVu Serif'; c.fillText('ASSIZE', w / 2, 110);
    c.font = 'bold 40px DejaVu Serif'; c.fillText('of BREAD & ALE', w / 2, 170);
    c.font = 'bold 120px DejaVu Serif'; c.fillStyle = '#7a1010'; c.fillText('1266', w / 2, 330);
    c.fillStyle = '#3b2412'; c.font = '28px DejaVu Serif';
    ['One penny shall buy', 'a loaf of the weight', 'decreed by the King.', 'Bakers who cheat', 'shall be punished.'].forEach((s, i) => c.fillText(s, w / 2, 400 + i * 42));
    c.fillStyle = '#a01515'; c.beginPath(); c.arc(w - 90, h - 70, 40, 0, 7); c.fill(); c.fillStyle = '#7a0a0a'; c.beginPath(); c.arc(w - 90, h - 70, 26, 0, 7); c.fill();
  });
  TEX.notes = canvasTex(256, 320, (c, w, h) => {
    c.fillStyle = '#efe4c8'; c.fillRect(0, 0, w, h); noise(c, w, h, 0.1, 2000);
    c.strokeStyle = '#3b2412'; c.lineWidth = 3; for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(20, 40 + i * 28); for (let x = 20; x < w - 20; x += 12) c.lineTo(x, 40 + i * 28 + Math.sin(x * 0.4 + i) * 3); c.stroke(); }
  });
  TEX.banner = canvasTex(256, 512, (c, w, h) => {
    c.fillStyle = '#8a1010'; c.fillRect(0, 0, w, h); noise(c, w, h, 0.12, 4000);
    c.fillStyle = '#e0b030'; c.fillRect(0, 0, w, 18); c.fillRect(0, 0, 14, h); c.fillRect(w - 14, 0, 14, h);
    c.beginPath(); c.moveTo(60, 260); c.lineTo(60, 170); c.lineTo(95, 210); c.lineTo(128, 150); c.lineTo(161, 210); c.lineTo(196, 170); c.lineTo(196, 260); c.closePath(); c.fill();
    c.beginPath(); c.arc(128, 340, 46, 0, 7); c.fill(); c.fillStyle = '#8a1010'; c.font = 'bold 50px DejaVu Serif'; c.textAlign = 'center'; c.fillText('R', 128, 358);
  });
  TEX.sign = canvasTex(512, 256, (c, w, h) => {
    c.fillStyle = '#5a3a1a'; c.fillRect(0, 0, w, h); noise(c, w, h, 0.2, 5000);
    c.strokeStyle = '#2a1a0a'; c.lineWidth = 12; c.strokeRect(6, 6, w - 12, h - 12);
    c.fillStyle = '#f2d39a'; c.font = 'bold 72px DejaVu Serif'; c.textAlign = 'center'; c.fillText('BAKERY', w / 2, 150);
    c.font = '34px DejaVu Serif'; c.fillText('~ fresh bread ~', w / 2, 210);
  });
  TEX.awning = canvasTex(512, 128, (c, w, h) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#f2efe6' : '#b52a2a'; c.fillRect(i * w / 8, 0, w / 8, h); } noise(c, w, h, 0.15, 3000); });
  TEX.carpet = canvasTex(256, 1024, (c, w, h) => {
    c.fillStyle = '#8a1018'; c.fillRect(0, 0, w, h); noise(c, w, h, 0.15, 8000);
    c.fillStyle = '#d4a017'; c.fillRect(10, 0, 14, h); c.fillRect(w - 24, 0, 14, h);
    for (let y = 60; y < h; y += 160) { c.save(); c.translate(w / 2, y); c.rotate(Math.PI / 4); c.strokeStyle = '#d4a017'; c.lineWidth = 6; c.strokeRect(-30, -30, 60, 60); c.restore(); }
  });
  TEX.sack = canvasTexN(256, 256, (c, w, h) => { c.fillStyle = '#d6c69c'; c.fillRect(0, 0, w, h); for (let i = 0; i < w; i += 4) { c.fillStyle = 'rgba(0,0,0,0.08)'; c.fillRect(i, 0, 2, h); c.fillRect(0, i, w, 2); } noise(c, w, h, 0.2, 3000); c.fillStyle = 'rgba(80,60,30,0.7)'; c.font = 'bold 50px DejaVu Serif'; c.textAlign = 'center'; c.fillText('FLOUR', w / 2, h / 2 + 18); }, [1, 1], 1.5);
  TEX.window = canvasTex(256, 256, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#ffe7a8'); g.addColorStop(1, '#d9a24a'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(80,50,20,0.35)'; c.lineWidth = 2; for (let i = -h; i < w; i += 26) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + h, h); c.moveTo(i + h, 0); c.lineTo(i, h); c.stroke(); }
    c.fillStyle = '#3a2513'; c.fillRect(0, 0, w, 16); c.fillRect(0, h - 16, w, 16); c.fillRect(0, 0, 16, h); c.fillRect(w - 16, 0, 16, h); c.fillRect(w / 2 - 7, 0, 14, h); c.fillRect(0, h / 2 - 7, w, 14);
  });
  TEX.blob = canvasTex(128, 128, (c, w, h) => { const g = c.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(0.6, 'rgba(0,0,0,0.25)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
  TEX.soft = canvasTex(128, 128, (c, w, h) => { const g = c.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
  const sr = rng(77);
  TEX.smoke = canvasTex(128, 128, (c, w, h) => { for (let i = 0; i < 10; i++) { const x = 40 + sr() * 48, y = 40 + sr() * 48, r = 18 + sr() * 26; const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); } });
}

// ---------- materiais ----------
let toonGrad;
export function toonGradient() {
  if (toonGrad) return toonGrad;
  const v = [150, 190, 225, 255];
  const d = new Uint8Array(v.flatMap(x => [x, x, x, 255]));
  toonGrad = new THREE.DataTexture(d, v.length, 1, THREE.RGBAFormat);
  toonGrad.minFilter = toonGrad.magFilter = THREE.LinearFilter; toonGrad.needsUpdate = true;
  return toonGrad;
}
export const toon = (color, extra = {}) => new THREE.MeshToonMaterial({ color, gradientMap: toonGradient(), ...extra });
export const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0, ...extra });
export const stdT = (set, color = '#ffffff', extra = {}) => new THREE.MeshStandardMaterial({ color, map: set.map, normalMap: set.normalMap, roughness: 0.85, ...extra });
export const BLACK = new THREE.MeshBasicMaterial({ color: 0x141414 });

const outlineMats = {};
export function outlineMat(th = 0.02, color = 0x111111) {
  const k = th + '_' + color; if (outlineMats[k]) return outlineMats[k];
  const m = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide });
  m.onBeforeCompile = (s) => { s.vertexShader = s.vertexShader.replace('#include <begin_vertex>', `vec3 transformed = position + normalize(normal) * ${th.toFixed(4)};`); };
  outlineMats[k] = m; return m;
}
export function withOutline(mesh, th = 0.02) {
  const o = new THREE.Mesh(mesh.geometry, outlineMat(th)); o.castShadow = false;
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
  if (o.cheeks !== false) { [-1, 1].forEach(s => { const g = c.createRadialGradient(cx + s * 118, 300, 0, cx + s * 118, 300, 44); g.addColorStop(0, 'rgba(255,130,130,0.35)'); g.addColorStop(1, 'rgba(255,130,130,0)'); c.fillStyle = g; c.beginPath(); c.ellipse(cx + s * 118, 300, 44, 28, 0, 0, 7); c.fill(); }); }
  const look = o.look || [0, 0];
  const eye = (s, kind) => {
    const x = cx + s * dx, y = ey, r = expr === 'shock' ? 40 : 32;
    if (kind === 'closed') { c.strokeStyle = ink; c.lineWidth = 10; c.beginPath(); c.moveTo(x - 28, y + 4); c.quadraticCurveTo(x, y + 12, x + 28, y + 4); c.stroke(); return; }
    if (kind === 'happy') { c.strokeStyle = ink; c.lineWidth = 11; c.beginPath(); c.arc(x, y + 12, 26, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); return; }
    c.fillStyle = '#fff'; c.strokeStyle = ink; c.lineWidth = 8;
    c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.stroke();
    c.fillStyle = ink; const pr = expr === 'shock' ? 9 : 13;
    const px = x + look[0] * 12, py = y + look[1] * 10 + (kind === 'lid' ? 8 : 0);
    c.beginPath(); c.arc(px, py, pr, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(px - pr * 0.35, py - pr * 0.4, pr * 0.3, 0, 7); c.fill();
    if (kind === 'lid' || kind === 'angry') {
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
  const browPair = (inner, lift = 0) => {
    [-1, 1].forEach(s => { const x = cx + s * dx, y = ey - 58 - lift; c.strokeStyle = ink; c.lineWidth = 13; c.beginPath(); c.moveTo(x - s * 30, y + inner); c.lineTo(x + s * 30, y - inner * 0.4); c.stroke(); });
  };
  let eyes = ['open', 'open'];
  switch (expr) {
    case 'smug': eyes = ['lid', 'lid']; break;
    case 'angry': eyes = ['angry', 'angry']; break;
    case 'happy': case 'laugh': eyes = ['happy', 'happy']; break;
    case 'bliss': eyes = ['closed', 'closed']; break;
    case 'wink': eyes = ['lid', 'closed']; break;
  }
  if (o.blink && eyes[0] === 'open' || o.blink && eyes[0] === 'lid' && expr !== 'wink') eyes = ['closed', 'closed'];
  eye(-1, eyes[0]); eye(1, eyes[1]);
  if (expr === 'smug') { [-1, 1].forEach(s => { const x = cx + s * dx, y = ey - 50 - (s > 0 ? 18 : 0); c.strokeStyle = ink; c.lineWidth = 13; c.beginPath(); c.moveTo(x - 30, y + 4); c.lineTo(x + 30, y - 2); c.stroke(); }); }
  else if (expr === 'angry') browPair(22);
  else if (expr === 'worried' || expr === 'shock') browPair(-16, expr === 'shock' ? 22 : 4);
  else if (expr === 'question') { [-1, 1].forEach(s => { const x = cx + s * dx, y = ey - 52 - (s > 0 ? 24 : 0); c.strokeStyle = ink; c.lineWidth = 13; c.beginPath(); c.moveTo(x - 28, y + (s > 0 ? 6 : 0)); c.lineTo(x + 28, y - (s > 0 ? 6 : 0)); c.stroke(); }); }
  else if (expr === 'wink') { [-1, 1].forEach(s => { const x = cx + s * dx, y = ey - 52 - (s < 0 ? 14 : 0); c.strokeStyle = ink; c.lineWidth = 13; c.beginPath(); c.moveTo(x - 28, y); c.lineTo(x + 28, y - 4); c.stroke(); }); }
  else if (expr === 'happy' || expr === 'laugh' || expr === 'bliss') browPair(-6, 10);
  else browPair(0, 0);
  const mustache = () => {
    c.fillStyle = o.hairColor || ink;
    [-1, 1].forEach(s => { c.beginPath(); c.moveTo(cx, my - 30); c.bezierCurveTo(cx + s * 30, my - 50, cx + s * 70, my - 40, cx + s * 92, my - 12); c.bezierCurveTo(cx + s * 70, my - 22, cx + s * 40, my - 14, cx, my - 18); c.fill(); });
  };
  c.strokeStyle = ink; c.lineWidth = 10;
  if (o.beard) { c.fillStyle = o.hairColor || '#5a3a1a'; c.beginPath(); c.moveTo(cx - 120, 300); c.quadraticCurveTo(cx - 110, 470, cx, 500); c.quadraticCurveTo(cx + 110, 470, cx + 120, 300); c.quadraticCurveTo(cx + 60, 390, cx, 385); c.quadraticCurveTo(cx - 60, 390, cx - 120, 300); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.15)'; c.lineWidth = 3; for (let i = 0; i < 14; i++) { const x = cx - 90 + i * 14; c.beginPath(); c.moveTo(x, 400); c.lineTo(x + 4, 460); c.stroke(); } c.strokeStyle = ink; c.lineWidth = 10; }
  const openMouth = (wid, hgt, y = my) => {
    const path = () => { c.beginPath(); c.moveTo(cx - wid, y - 6); c.quadraticCurveTo(cx, y - 14, cx + wid, y - 6); c.quadraticCurveTo(cx + wid * 0.8, y + hgt, cx, y + hgt); c.quadraticCurveTo(cx - wid * 0.8, y + hgt, cx - wid, y - 6); };
    c.fillStyle = '#4a1010'; path(); c.fill();
    c.save(); path(); c.clip();
    c.fillStyle = '#e46a6a'; c.beginPath(); c.ellipse(cx, y + hgt * 0.8, wid * 0.55, hgt * 0.3, 0, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.fillRect(cx - wid, y - 16, wid * 2, 16);
    c.restore();
    c.lineWidth = 8; c.strokeStyle = ink; path(); c.stroke();
  };
  switch (expr) {
    case 'smug': case 'wink': c.beginPath(); c.moveTo(cx - 34, my + 2); c.quadraticCurveTo(cx + 10, my + 16, cx + 44, my - 10); c.stroke(); break;
    case 'happy': openMouth(46, 50); break;
    case 'laugh': openMouth(56, 68, my - 4); break;
    case 'bliss': c.beginPath(); c.moveTo(cx - 30, my); c.quadraticCurveTo(cx, my + 22, cx + 30, my); c.stroke(); break;
    case 'question': c.beginPath(); c.moveTo(cx - 24, my + 8); c.quadraticCurveTo(cx, my, cx + 24, my + 10); c.stroke(); break;
    case 'shock': c.fillStyle = '#4a1010'; c.beginPath(); c.ellipse(cx, my + 14, 24, 32, 0, 0, 7); c.fill(); c.stroke(); break;
    case 'angry': c.fillStyle = '#fff'; c.beginPath(); c.rect(cx - 40, my - 4, 80, 26); c.fill(); c.stroke(); c.lineWidth = 5; c.beginPath(); c.moveTo(cx - 40, my + 9); c.lineTo(cx + 40, my + 9); for (let i = -20; i <= 20; i += 20) { c.moveTo(cx + i, my - 4); c.lineTo(cx + i, my + 22); } c.stroke(); break;
    case 'worried': c.beginPath(); c.moveTo(cx - 36, my + 6); for (let i = 0; i <= 6; i++) c.lineTo(cx - 36 + i * 12, my + 6 + (i % 2 ? -7 : 5)); c.stroke(); break;
    default: c.beginPath(); c.moveTo(cx - 26, my + 4); c.quadraticCurveTo(cx, my + 10, cx + 26, my + 4); c.stroke();
  }
  if (o.mustache) mustache();
  if (expr === 'worried' || o.sweat) { c.fillStyle = '#8fd0ff'; c.strokeStyle = ink; c.lineWidth = 5; const x = cx + 170, y = 140 + (o.sweatY || 0); c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 22, y + 40, x, y + 52); c.quadraticCurveTo(x - 22, y + 40, x, y); c.fill(); c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.arc(x - 5, y + 34, 5, 0, 7); c.fill(); }
  if (o.glasses) { c.strokeStyle = '#222'; c.lineWidth = 7; [-1, 1].forEach(sx => { c.beginPath(); c.arc(cx + sx * dx, ey, 44, 0, 7); c.stroke(); }); c.beginPath(); c.moveTo(cx - dx + 44, ey - 4); c.quadraticCurveTo(cx, ey - 16, cx + dx - 44, ey - 4); c.stroke(); c.fillStyle = 'rgba(255,255,255,0.18)'; [-1, 1].forEach(sx => { c.beginPath(); c.ellipse(cx + sx * dx - 14, ey - 16, 12, 7, -0.5, 0, 7); c.fill(); }); }
  if (o.monocle) { c.strokeStyle = '#c9a227'; c.lineWidth = 8; c.beginPath(); c.arc(cx + dx, ey, 46, 0, 7); c.stroke(); c.beginPath(); c.moveTo(cx + dx + 40, ey + 24); c.quadraticCurveTo(cx + dx + 80, ey + 120, cx + dx + 60, 470); c.stroke(); }
}

// ---------- poses ----------
export const REST = {
  armL: { out: 0.22, fwd: 0.05, elbow: -0.25, twist: 0 }, armR: { out: 0.22, fwd: 0.05, elbow: -0.25, twist: 0 },
  legL: { hip: 0, knee: 0.04, out: 0.03 }, legR: { hip: 0, knee: 0.04, out: 0.03 },
  bob: 0, lean: 0, sway: 0, twist: 0, headX: 0, headY: 0, headZ: 0, squash: 0, rootY: 0,
};
export function mixPose(a, b, k) {
  if (typeof a === 'number') return a + (b - a) * k;
  const o = {}; for (const key in a) o[key] = (b && key in b) ? mixPose(a[key], b[key], k) : a[key]; return o;
}
export function P(over = {}, base = REST) {
  const o = JSON.parse(JSON.stringify(base));
  for (const k in over) { if (typeof over[k] === 'object') Object.assign(o[k], over[k]); else o[k] = over[k]; }
  return o;
}
export function kf(t, keys, ease = sstep) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) { const [a, va] = keys[i], [b, vb] = keys[i + 1]; if (t < b) return mixAny(va, vb, ease((t - a) / (b - a))); }
  return keys[keys.length - 1][1];
}
function mixAny(a, b, k) { if (typeof a === 'number') return a + (b - a) * k; if (Array.isArray(a)) return a.map((x, i) => x + (b[i] - x) * k); return mixPose(a, b, k); }
// expressão por keyframes; devolve também o instante da última troca (para o "take")
export function exprKeys(ch, t, keys) { let cur = keys[0]; for (const k of keys) if (t >= k[0]) cur = k; ch.setExpr(cur[1], cur === keys[0] ? -99 : cur[0]); }
// pose de caminhada
export function walkPose(base, phase, amt, stride = 0.5) {
  if (amt <= 0.001) return base;
  const s = Math.sin(phase), c = Math.cos(phase);
  const w = P({
    legL: { hip: -s * stride, knee: 0.08 + Math.max(0, c) * 1.0 }, legR: { hip: s * stride, knee: 0.08 + Math.max(0, -c) * 1.0 },
    armL: { out: base.armL.out, fwd: s * 0.45, elbow: -0.35, twist: base.armL.twist }, armR: { out: base.armR.out, fwd: -s * 0.45, elbow: -0.35, twist: base.armR.twist },
    bob: 0.035 * Math.cos(2 * phase) + 0.01, lean: base.lean + 0.07, sway: s * 0.05, twist: s * 0.1, headZ: -s * 0.03,
  }, base);
  const o = mixPose(base, w, amt);
  ['armL', 'armR'].forEach(k => { if (Math.abs(base[k].fwd) > 0.6) o[k] = mixPose(o[k], base[k], 0.85); });
  return o;
}
// caminho [[x,z],...] percorrido a partir de t0 sem patinar (fase = distância / passada)
export function pathAt(path, t, t0, speed = 1.1, cycle = 1.7) {
  const seg = []; let L = 0;
  for (let i = 0; i < path.length - 1; i++) { const l = Math.hypot(path[i + 1][0] - path[i][0], path[i + 1][1] - path[i][1]); seg.push(l); L += l; }
  const T = L / speed + 0.6;
  const a = 0.3 / T, vmax = 1 / (1 - a);
  const prof = (u) => { u = clamp(u); if (u < a) return vmax * u * u / (2 * a); if (u > 1 - a) return 1 - vmax * (1 - u) * (1 - u) / (2 * a); return vmax * (u - a / 2); };
  const u = (t - t0) / T;
  const d = prof(u) * L, d2 = prof(u + 0.02) * L;
  const posAt = (dd) => { let acc = 0; for (let i = 0; i < seg.length; i++) { if (dd <= acc + seg[i] || i === seg.length - 1) { const k = clamp((dd - acc) / seg[i]); return [lerp(path[i][0], path[i + 1][0], k), lerp(path[i][1], path[i + 1][1], k)]; } acc += seg[i]; } };
  const p = posAt(d), q = posAt(Math.min(L, d + 0.3)), q0 = posAt(Math.max(0, d - 0.3));
  const v = (d2 - d) / (0.02 * T);
  let dir = Math.atan2(q[0] - q0[0], q[1] - q0[1]);
  return { x: p[0], z: p[1], dir, phase: d / cycle * Math.PI * 2, amt: clamp(v / speed * 1.15), done: u >= 1, T };
}

// ---------- personagem ----------
export const charList = [];
export function makeChar(o = {}) {
  const Pp = Object.assign({ body: '#c0392b', legLen: 0.95, bodyR: 0.33, bodyLen: 0.32, headR: 0.47, hat: null, expr: 'neutral', hair: '#3a2410' }, o);
  const root = new THREE.Group();
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshBasicMaterial({ map: TEX.blob, transparent: true, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2; blob.position.y = 0.012; blob.renderOrder = 1; root.add(blob);
  const rig = new THREE.Group(); root.add(rig);
  const limbMat = new THREE.MeshBasicMaterial({ color: 0x151515 });
  const half = Pp.legLen / 2;
  const legs = [];
  for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(s * 0.13, Pp.legLen, 0); rig.add(hip);
    const thigh = mesh(new THREE.CylinderGeometry(0.034, 0.032, half, 8), limbMat); thigh.position.y = -half / 2; hip.add(thigh);
    const knee = new THREE.Group(); knee.position.y = -half; hip.add(knee);
    knee.add(mesh(new THREE.SphereGeometry(0.033, 8, 6), limbMat));
    const shin = mesh(new THREE.CylinderGeometry(0.032, 0.03, half, 8), limbMat); shin.position.y = -half / 2; knee.add(shin);
    const ankle = new THREE.Group(); ankle.position.y = -half + 0.025; knee.add(ankle);
    const foot = mesh(new THREE.SphereGeometry(0.1, 14, 10), limbMat); foot.scale.set(0.8, 0.45, 1.35); foot.position.set(0, 0, 0.06); ankle.add(foot);
    legs.push({ hip, knee, ankle });
  }
  const bodyY = Pp.legLen + Pp.bodyR + Pp.bodyLen / 2 - 0.08;
  const torso = new THREE.Group(); torso.position.y = bodyY; rig.add(torso);
  const torsoInner = new THREE.Group(); torso.add(torsoInner);
  const body = withOutline(mesh(new THREE.CapsuleGeometry(Pp.bodyR, Pp.bodyLen, 10, 28), toon(Pp.body)), 0.022);
  body.scale.set(1, 1, 0.88); torsoInner.add(body);
  const bR = Pp.bodyR;
  if (Pp.apron) {
    const ap = mesh(new THREE.CylinderGeometry(bR * 1.03, bR * 1.06, Pp.bodyLen + bR * 0.95, 28, 1, true, -1.05, 2.1), toon('#f4f1e8', { side: THREE.DoubleSide })); ap.position.y = -0.13; ap.scale.z = 0.9; torsoInner.add(ap);
    const pocket = mesh(new THREE.CylinderGeometry(bR * 1.075, bR * 1.075, 0.14, 16, 1, true, -0.35, 0.7), toon('#e3ddcc', { side: THREE.DoubleSide })); pocket.position.y = -0.28; pocket.scale.z = 0.9; torsoInner.add(pocket);
    for (let i = 0; i < 5; i++) { const f = mesh(new THREE.SphereGeometry(0.018 + (i % 2) * 0.008, 6, 4), toon('#ffffff')); f.scale.z = 0.3; f.position.set(-0.13 + i * 0.065, -0.04 - (i % 3) * 0.07, bR * 0.95); torsoInner.add(f); }
  }
  if (Pp.buttons !== false) for (let i = 0; i < 3; i++) { const b = mesh(new THREE.SphereGeometry(0.028, 8, 6), toon(Pp.buttonColor || '#222')); b.position.set(0, 0.16 - i * 0.14, bR * 0.88 + (Pp.apron ? 0.02 : 0.005)); b.scale.z = 0.6; torsoInner.add(b); }
  if (Pp.belt) { const bl = mesh(new THREE.TorusGeometry(bR * 0.99, 0.035, 8, 40), toon(Pp.belt)); bl.rotation.x = Math.PI / 2; bl.scale.y = 0.88; bl.position.y = -0.12; torsoInner.add(bl); const bk = mesh(new THREE.BoxGeometry(0.1, 0.08, 0.03), std('#d4af37', { metalness: .8, roughness: .3 })); bk.position.set(0, -0.12, bR * 0.9); torsoInner.add(bk); }
  if (Pp.collar) { const cl = withOutline(mesh(new THREE.TorusGeometry(bR * 0.75, 0.09, 10, 32), toon(Pp.collar)), 0.015); cl.rotation.x = Math.PI / 2; cl.position.y = Pp.bodyLen / 2 + bR * 0.55; torsoInner.add(cl); if (Pp.ermine) for (let i = 0; i < 12; i++) { const d = mesh(new THREE.SphereGeometry(0.018, 6, 4), BLACK); const a = i / 12 * Math.PI * 2; d.position.set(Math.cos(a) * bR * 0.75, Pp.bodyLen / 2 + bR * 0.55 + 0.06, Math.sin(a) * bR * 0.75); torsoInner.add(d); } }
  if (Pp.cape) { const cp = mesh(new THREE.CylinderGeometry(bR * 1.06, bR * 1.4, Pp.bodyLen + bR * 1.5, 28, 1, true, Math.PI * 0.6, Math.PI * 0.8), toon(Pp.cape, { side: THREE.DoubleSide })); cp.position.y = -0.15; torsoInner.add(cp); }
  if (Pp.vest) { const v = mesh(new THREE.CylinderGeometry(bR * 1.02, bR * 1.04, Pp.bodyLen + bR * 0.6, 28, 1, true, -0.6, 1.2), toon(Pp.vest, { side: THREE.DoubleSide })); v.scale.z = 0.9; torsoInner.add(v); }
  if (Pp.lapels) { for (const sd of [-1, 1]) { const lp = mesh(new THREE.CylinderGeometry(bR * 1.03, bR * 1.05, Pp.bodyLen + bR * 0.5, 16, 1, true, sd > 0 ? 0.12 : -0.62, 0.5), toon(Pp.lapels, { side: THREE.DoubleSide })); lp.position.y = 0.06; lp.scale.z = 0.9; torsoInner.add(lp); } const sh = mesh(new THREE.CylinderGeometry(bR * 1.01, bR * 1.02, Pp.bodyLen * 0.9, 12, 1, true, -0.12, 0.24), toon('#f4f2ea', { side: THREE.DoubleSide })); sh.position.y = 0.1; sh.scale.z = 0.9; torsoInner.add(sh); }
  if (Pp.tie) { const tg = new THREE.Group(); tg.position.set(0, Pp.bodyLen / 2 + 0.05, bR * 0.9 + 0.02); torsoInner.add(tg); const knot = mesh(new THREE.SphereGeometry(0.04, 10, 8), toon(Pp.tie)); tg.add(knot); const bl = mesh(new THREE.ConeGeometry(0.055, 0.34, 4), toon(Pp.tie)); bl.rotation.x = Math.PI; bl.position.y = -0.2; bl.scale.z = 0.3; tg.add(bl); }
  if (Pp.bowtie) { const bg = new THREE.Group(); bg.position.set(0, Pp.bodyLen / 2 + 0.07, bR * 0.85 + 0.03); torsoInner.add(bg); for (const sd of [-1, 1]) { const w = mesh(new THREE.ConeGeometry(0.05, 0.1, 4), toon(Pp.bowtie)); w.rotation.z = sd * Math.PI / 2; w.position.x = sd * 0.05; w.scale.z = 0.4; bg.add(w); } bg.add(mesh(new THREE.SphereGeometry(0.025, 8, 6), toon(Pp.bowtie))); }
  // braços
  const arms = [];
  const shoulderY = Pp.bodyLen / 2 + 0.1;
  for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(s * (bR - 0.02), shoulderY, 0); torsoInner.add(sh);
    const upper = mesh(new THREE.CylinderGeometry(0.029, 0.028, 0.42, 8), limbMat); upper.position.y = -0.21; sh.add(upper);
    const elbow = new THREE.Group(); elbow.position.y = -0.42; sh.add(elbow);
    elbow.add(mesh(new THREE.SphereGeometry(0.029, 8, 6), limbMat));
    const lower = mesh(new THREE.CylinderGeometry(0.028, 0.027, 0.38, 8), limbMat); lower.position.y = -0.19; elbow.add(lower);
    const hand = new THREE.Group(); hand.position.y = -0.38; elbow.add(hand);
    hand.add(mesh(new THREE.SphereGeometry(0.058, 12, 10), limbMat));
    arms.push({ sh, elbow, hand, s });
  }
  // cabeça
  const neck = new THREE.Group(); neck.position.y = Pp.bodyLen / 2 + bR - 0.05; torsoInner.add(neck);
  const head = new THREE.Group(); head.position.y = Pp.headR * 0.85; neck.add(head);
  const skinMat = toon(SKIN, { emissive: '#ffffff', emissiveIntensity: 0.24 });
  const skull = withOutline(mesh(new THREE.SphereGeometry(Pp.headR, 48, 32), skinMat), 0.024);
  skull.scale.set(1.04, 0.96, 1); head.add(skull);
  const faceCanvas = document.createElement('canvas'); faceCanvas.width = faceCanvas.height = 512;
  const faceTex = new THREE.CanvasTexture(faceCanvas); faceTex.colorSpace = THREE.SRGBColorSpace; faceTex.anisotropy = 8;
  const faceGeo = new THREE.SphereGeometry(Pp.headR * 1.006, 56, 36, Math.PI / 2 - 1.05, 2.1, Math.PI / 2 - 0.95, 1.9);
  const face = new THREE.Mesh(faceGeo, new THREE.MeshToonMaterial({ map: faceTex, transparent: true, gradientMap: toonGradient(), depthWrite: false, emissive: '#ffffff', emissiveMap: faceTex, emissiveIntensity: 0.24 }));
  face.scale.copy(skull.scale); face.renderOrder = 2; head.add(face);
  if (Pp.hairCap) { const hc = withOutline(mesh(new THREE.SphereGeometry(Pp.headR * 1.025, 36, 18, 0, Math.PI * 2, 0, 1.1), toon(Pp.hair)), 0.02); hc.rotation.x = -0.55; head.add(hc); }
  for (const s of [-1, 1]) { const e = withOutline(mesh(new THREE.SphereGeometry(0.07, 12, 8), skinMat), 0.014); e.scale.set(0.5, 1, 0.8); e.position.set(s * Pp.headR * 1.02, -0.02, 0); head.add(e); }
  if (Pp.bun) { const bn = withOutline(mesh(new THREE.SphereGeometry(0.17, 16, 12), toon(Pp.hair)), 0.015); bn.position.set(0, Pp.headR * 0.75, -Pp.headR * 0.45); head.add(bn); }
  const hat = new THREE.Group(); hat.position.y = Pp.headR * 0.62; head.add(hat);
  buildHat(hat, Pp);
  const ch = { root, rig, torso, torsoInner, body, head, neck, arms, legs, blob, P: Pp, face: { canvas: faceCanvas, tex: faceTex, key: '' }, expr: Pp.expr, look: [0, 0], blinkSeed: R() * 10, hat, idleAmt: 1, popT: -99 };
  ch.setExpr = (e, changedAt = -99) => { ch.expr = e; ch.popT = changedAt; };
  ch.updateFace = (t) => {
    const blink = ch.noBlink ? false : ((t + ch.blinkSeed) % 3.7) < 0.12;
    const sy = ch.sweat ? Math.round((t * 30) % 50) : 0;
    const key = ch.expr + (blink ? 'b' : '') + ch.look.map(v => v.toFixed(2)).join(',') + (ch.sweat ? 's' + sy : '');
    if (key === ch.face.key) return;
    ch.face.key = key;
    drawFace(ch.face.canvas.getContext('2d'), ch.expr, { blink, look: ch.look, mustache: Pp.mustache, beard: Pp.beard, hairColor: Pp.hairColor, monocle: Pp.monocle, glasses: Pp.glasses, sweat: ch.sweat, sweatY: sy, cheeks: Pp.cheeks });
    ch.face.tex.needsUpdate = true;
  };
  // aplica pose + camada procedural (respiração, balanço do peso, "take" ao trocar expressão)
  ch.apply = (p, t) => {
    const ia = ch.idleAmt;
    const br = Math.sin(t * 2.3 + ch.blinkSeed);
    arms.forEach((a, i) => { const q = i === 0 ? p.armL : p.armR; const s = a.s; a.sh.rotation.set(-q.fwd + br * 0.025 * ia, q.twist * s, s * (q.out + br * 0.02 * ia)); a.elbow.rotation.set(q.elbow - br * 0.03 * ia, 0, 0); });
    legs.forEach((l, i) => { const q = i === 0 ? p.legL : p.legR; const s = i === 0 ? -1 : 1; l.hip.rotation.set(q.hip, 0, s * q.out); l.knee.rotation.x = q.knee; l.ankle.rotation.x = -(q.hip + q.knee) * 0.9; });
    const legH = (q) => half * Math.cos(q.hip) + half * Math.cos(q.hip + q.knee);
    const drop = Pp.legLen - Math.max(legH(p.legL), legH(p.legR));
    rig.position.y = p.bob - drop + p.rootY;
    const dt = t - ch.popT;
    const pop = dt >= 0 && dt < 0.5 ? Math.sin(dt / 0.5 * Math.PI) * Math.exp(-dt * 3) : 0;
    torso.rotation.set(p.lean + Math.sin(t * 0.7 + ch.blinkSeed) * 0.012 * ia, p.twist, p.sway + Math.sin(t * 0.9 + ch.blinkSeed * 3) * 0.018 * ia);
    const sq = p.squash + br * 0.012 * ia - pop * 0.07;
    torsoInner.scale.set(1 - sq * 0.5, 1 + sq, 1 - sq * 0.5);
    head.rotation.set(p.headX + Math.sin(t * 1.7 + ch.blinkSeed * 2) * 0.025 * ia - pop * 0.22, p.headY + Math.sin(t * 0.8 + ch.blinkSeed) * 0.04 * ia, p.headZ + Math.sin(t * 1.3 + ch.blinkSeed) * 0.03 * ia);
    head.scale.setScalar(1 + pop * 0.07);
    const lift = Math.max(0, rig.position.y);
    blob.scale.setScalar(Math.max(0.3, 1 - lift * 0.8)); blob.material.opacity = Math.max(0.2, 1 - lift);
  };
  charList.push(ch);
  return ch;
}

function buildHat(hat, Pp) {
  const o = (m, th = 0.018) => withOutline(m, th);
  switch (Pp.hat) {
    case 'toque': {
      const band = o(mesh(new THREE.CylinderGeometry(0.36, 0.34, 0.22, 32), toon('#fbfaf5'))); band.position.y = 0.02; hat.add(band);
      [[0, 0.33, 0, 0.3], [0.19, 0.27, 0.05, 0.22], [-0.19, 0.27, 0.05, 0.22], [0, 0.27, -0.18, 0.22], [0, 0.28, 0.17, 0.22], [0.13, 0.3, -0.12, 0.2], [-0.13, 0.3, -0.12, 0.2]]
        .forEach(([x, y, z, r]) => { const p = o(mesh(new THREE.SphereGeometry(r, 24, 16), toon('#fbfaf5'))); p.position.set(x, y, z); hat.add(p); });
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const pl = mesh(new THREE.BoxGeometry(0.012, 0.2, 0.012), toon('#e2e0d6')); pl.position.set(Math.sin(a) * 0.352, 0.02, Math.cos(a) * 0.352); pl.rotation.y = a; hat.add(pl); }
      hat.rotation.x = -0.12; break;
    }
    case 'crown': {
      const gold = std('#f2c230', { metalness: 1, roughness: 0.22, emissive: '#4a3000', emissiveIntensity: 0.3 });
      const ring = mesh(new THREE.CylinderGeometry(0.34, 0.32, 0.14, 40, 1, true), gold); ring.material.side = THREE.DoubleSide; hat.add(ring);
      const rim = mesh(new THREE.TorusGeometry(0.33, 0.018, 8, 40), gold); rim.rotation.x = Math.PI / 2; rim.position.y = -0.07; hat.add(rim);
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const sp = mesh(new THREE.ConeGeometry(0.06, 0.2, 8), gold); sp.position.set(Math.sin(a) * 0.33, 0.16, Math.cos(a) * 0.33); hat.add(sp); const ball = mesh(new THREE.SphereGeometry(0.03, 10, 8), gold); ball.position.set(Math.sin(a) * 0.33, 0.27, Math.cos(a) * 0.33); hat.add(ball); const gem = mesh(new THREE.SphereGeometry(0.035, 12, 10), std(i % 2 ? '#d01c3c' : '#1c5ad0', { roughness: .05, metalness: .2, emissive: i % 2 ? '#400010' : '#001040' })); gem.position.set(Math.sin(a) * 0.335, 0.0, Math.cos(a) * 0.335); hat.add(gem); }
      const vel = mesh(new THREE.SphereGeometry(0.3, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), toon('#8a1020')); vel.position.y = 0.02; vel.scale.y = 0.6; hat.add(vel);
      const cr1 = mesh(new THREE.BoxGeometry(0.03, 0.12, 0.03), gold); cr1.position.y = 0.26; hat.add(cr1); const cr2 = mesh(new THREE.BoxGeometry(0.08, 0.03, 0.03), gold); cr2.position.y = 0.28; hat.add(cr2);
      hat.position.y += 0.02; break;
    }
    case 'tophat': {
      const m = toon(Pp.hatColor || '#1d1d22');
      const brim = o(mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.04, 40), m)); hat.add(brim);
      const top = o(mesh(new THREE.CylinderGeometry(0.3, 0.29, 0.55, 40), m)); top.position.y = 0.28; hat.add(top);
      const band = mesh(new THREE.CylinderGeometry(0.297, 0.297, 0.09, 40), toon(Pp.bandColor || '#7a1a1a')); band.position.y = 0.07; hat.add(band);
      hat.rotation.z = 0.08; break;
    }
    case 'cap': {
      const m = toon(Pp.hatColor || '#55606e');
      const dome = o(mesh(new THREE.SphereGeometry(0.42, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), m)); dome.scale.y = 0.55; dome.position.y = -0.08; hat.add(dome);
      const visor = o(mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.03, 24, 1, false, -0.9, 1.8), m)); visor.position.set(0, -0.08, 0.28); hat.add(visor);
      const btn = mesh(new THREE.SphereGeometry(0.035, 8, 6), m); btn.position.y = 0.15; hat.add(btn);
      break;
    }
    case 'helmet': {
      const m = std('#9aa3ab', { metalness: 0.9, roughness: 0.3 });
      const dome = mesh(new THREE.SphereGeometry(0.4, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), m); dome.position.y = -0.06; hat.add(dome);
      const brim = mesh(new THREE.CylinderGeometry(0.62, 0.55, 0.05, 40), m); brim.position.y = -0.06; hat.add(brim);
      const ridge = mesh(new THREE.TorusGeometry(0.4, 0.02, 6, 32, Math.PI), m); ridge.rotation.y = Math.PI / 2; ridge.position.y = -0.06; hat.add(ridge);
      break;
    }
    case 'fedora': {
      const m = toon(Pp.hatColor || '#4a4038');
      const brim = o(mesh(new THREE.CylinderGeometry(0.56, 0.58, 0.035, 40), m)); brim.scale.z = 0.9; hat.add(brim);
      const crown = o(mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.32, 32), m)); crown.position.y = 0.16; crown.scale.z = 0.9; hat.add(crown);
      const dent = mesh(new THREE.BoxGeometry(0.05, 0.05, 0.5), toon('#2a2420')); dent.position.y = 0.32; hat.add(dent);
      const band = mesh(new THREE.CylinderGeometry(0.343, 0.343, 0.07, 32), toon(Pp.bandColor || '#1a1a1a')); band.position.y = 0.05; band.scale.z = 0.9; hat.add(band);
      hat.rotation.set(-0.06, 0, 0.06); break;
    }
    case 'leather': {
      const m = toon('#7a4a24');
      const dome = o(mesh(new THREE.SphereGeometry(0.5, 32, 18, 0, Math.PI * 2, 0, Math.PI * 0.62), m)); dome.position.y = -0.22; hat.add(dome);
      for (const sd of [-1, 1]) { const flap = o(mesh(new THREE.SphereGeometry(0.16, 12, 10), m)); flap.scale.set(0.4, 1, 1); flap.position.set(sd * 0.47, -0.4, 0); hat.add(flap); }
      const stripe = mesh(new THREE.BoxGeometry(0.08, 0.02, 0.9), toon('#5a3418')); stripe.position.y = 0.27; stripe.rotation.x = 0; hat.add(stripe); break;
    }
    case 'beret': { const b = o(mesh(new THREE.SphereGeometry(0.42, 28, 14), toon(Pp.hatColor || '#2d4f8a'))); b.scale.set(1.05, 0.35, 1.05); b.position.set(0.05, 0.02, -0.03); b.rotation.z = -0.25; hat.add(b); break; }
    case 'bonnet': { const b = o(mesh(new THREE.SphereGeometry(0.5, 32, 18, 0, Math.PI * 2, 0, 1.6), toon(Pp.hatColor || '#f2efe6'))); b.rotation.x = -0.6; b.position.set(0, -0.2, -0.05); hat.add(b); break; }
    case 'hood': { const b = o(mesh(new THREE.SphereGeometry(0.53, 32, 18, 0, Math.PI * 2, 0, 1.75), toon(Pp.hatColor || '#6b4a2a'))); b.rotation.x = -0.75; b.position.set(0, -0.25, -0.08); hat.add(b); break; }
  }
}

// ---------- props ----------
let breadMat;
const breadM = () => breadMat || (breadMat = new THREE.MeshStandardMaterial({ map: TEX.bread, roughness: 0.65 }));
export function loaf(scale = 1, kind = 'loaf') {
  const g = new THREE.Group(); let m;
  if (kind === 'baguette') { m = mesh(new THREE.CapsuleGeometry(0.07, 0.55, 8, 16), breadM()); m.rotation.z = Math.PI / 2; m.scale.set(1, 1, 0.8); }
  else if (kind === 'boule') { m = mesh(new THREE.SphereGeometry(0.18, 28, 16), breadM()); m.scale.set(1, 0.62, 1); }
  else if (kind === 'bun') { m = mesh(new THREE.SphereGeometry(0.09, 20, 12), breadM()); m.scale.set(1, 0.7, 1); }
  else { m = mesh(new THREE.SphereGeometry(0.2, 32, 18), breadM()); m.scale.set(1.45, 0.72, 0.9); }
  withOutline(m, 0.008); g.add(m); g.scale.setScalar(scale);
  return g;
}
export function balanceScale() {
  const g = new THREE.Group(); const brass = std('#d9b23a', { metalness: 0.75, roughness: 0.28 });
  const pole = mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.75, 12), brass); pole.position.y = 0.375; g.add(pole);
  g.add(mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.05, 24), brass));
  const finial = mesh(new THREE.SphereGeometry(0.04, 12, 8), brass); finial.position.y = 0.8; g.add(finial);
  const beam = new THREE.Group(); beam.position.y = 0.75; g.add(beam);
  beam.add(mesh(new THREE.BoxGeometry(0.9, 0.035, 0.035), brass));
  const needle = mesh(new THREE.ConeGeometry(0.02, 0.18, 6), brass); needle.position.y = 0.1; beam.add(needle);
  const pans = [];
  for (const s of [-1, 1]) {
    const hang = new THREE.Group(); hang.position.x = s * 0.43; beam.add(hang);
    for (const a of [0, 2.1, 4.2]) { const c = mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.41, 4), brass); c.position.set(Math.cos(a) * 0.075, -0.2, Math.sin(a) * 0.075); c.rotation.z = Math.cos(a) * 0.18; c.rotation.x = -Math.sin(a) * 0.18; hang.add(c); }
    const pan = mesh(new THREE.CylinderGeometry(0.17, 0.12, 0.04, 28), brass); pan.position.y = -0.41; hang.add(pan);
    pans.push(hang);
  }
  return { g, beam, pans };
}
export function scroll() {
  const g = new THREE.Group();
  const paper = mesh(new THREE.PlaneGeometry(0.8, 1.0, 1, 10), new THREE.MeshStandardMaterial({ map: TEX.paper, roughness: 0.9, side: THREE.DoubleSide }), { cast: true, recv: false });
  const pos = paper.geometry.attributes.position; for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getY(i) * 6) * 0.015); paper.geometry.computeVertexNormals();
  g.add(paper);
  const top = new THREE.Group(), bot = new THREE.Group(); top.position.y = 0.51; bot.position.y = -0.51; g.add(top, bot);
  for (const grp of [top, bot]) { const rod = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.95, 14), std('#6b3f1d')); rod.rotation.z = Math.PI / 2; grp.add(rod); for (const e of [-1, 1]) { const k = mesh(new THREE.SphereGeometry(0.05, 10, 8), std('#d4af37', { metalness: .8, roughness: .3 })); k.position.x = e * 0.49; grp.add(k); } }
  g.userData = { paper, top, bot };
  return g;
}
export function cloud(seed) {
  const r = rng(seed); const g = new THREE.Group(); const m = new THREE.MeshLambertMaterial({ color: '#ffffff', emissive: '#c8d8f0', emissiveIntensity: 0.45 });
  for (let i = 0; i < 9; i++) { const s = mesh(new THREE.IcosahedronGeometry(1, 2), m, { cast: false, recv: false }); s.scale.set(1.2 + r() * 1.4, 0.9 + r() * 0.9, 1.1 + r()); s.position.set((r() - .5) * 6, r() * 1.2, (r() - .5) * 1.5); g.add(s); }
  return g;
}
export function skyDome(top = '#3d7fd6', bottom = '#cfe6ff', sunDir = [0.5, 0.45, -0.7]) {
  const m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: { top: { value: new THREE.Color(top) }, bottom: { value: new THREE.Color(bottom) }, sun: { value: new THREE.Vector3(...sunDir).normalize() } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} ',
    fragmentShader: 'uniform vec3 top; uniform vec3 bottom; uniform vec3 sun; varying vec3 vP; void main(){ float h = clamp(vP.y*1.5+0.08,0.0,1.0); vec3 col = mix(bottom, top, pow(h,0.75)); float s = max(dot(vP, sun),0.0); col += vec3(1.0,0.85,0.6)*pow(s,30.0)*0.5 + vec3(1.0,0.95,0.8)*pow(s,800.0)*6.0; gl_FragColor = vec4(col,1.0);\n#include <colorspace_fragment>\n}' });
  const s = new THREE.Mesh(new THREE.SphereGeometry(400, 48, 24), m); s.renderOrder = -1; return s;
}
// casa enxaimel: vigas 3D, telhado de telhas com relevo, persianas, floreiras, porta
export function house(w, h, d, base, seed) {
  const r = rng(seed); const g = new THREE.Group();
  const pl = repTex(TEX.plaster, w / 3, h / 3);
  const wallMat = stdT(pl, base, { roughness: 0.95 });
  const walls = mesh(new THREE.BoxGeometry(w, h, d), wallMat); walls.position.y = h / 2; g.add(walls);
  const stoneBase = mesh(new THREE.BoxGeometry(w + 0.08, 0.6, d + 0.08), stdT(repTex(TEX.stone, w / 2, 0.3), '#cfcfcf')); stoneBase.position.y = 0.3; g.add(stoneBase);
  // vigas (uma malha só)
  const bt = 0.16, bd = 0.08; const geos = [];
  const addBeam = (bw, bh, x, y, rz, rotY, off) => { const gg = new THREE.BoxGeometry(bw, bh, bd).toNonIndexed(); const inner = new THREE.Matrix4().compose(new THREE.Vector3(x, y, off + bd / 2), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, rz)), new THREE.Vector3(1, 1, 1)); gg.applyMatrix4(new THREE.Matrix4().makeRotationY(rotY).multiply(inner)); geos.push(gg); };
  const face = (fw, rotY, off) => {
    addBeam(fw + 0.1, bt, 0, h - bt / 2, 0, rotY, off); addBeam(fw + 0.1, bt, 0, h * 0.5, 0, rotY, off); addBeam(fw + 0.1, bt, 0, 0.66, 0, rotY, off);
    const nV = Math.max(2, Math.round(fw / 1.3));
    for (let i = 0; i <= nV; i++) addBeam(bt, h - 0.6, -fw / 2 + i * fw / nV, (h + 0.6) / 2, 0, rotY, off);
    for (let i = 0; i < nV; i++) { if ((i + seed) % 2) continue; const cw = fw / nV, chh = h * 0.5 - bt; addBeam(bt, Math.hypot(cw, chh), -fw / 2 + (i + 0.5) * cw, h * 0.75 - bt / 4, Math.atan2(cw, chh) * (i % 2 ? 1 : -1), rotY, off); }
  };
  face(w, 0, d / 2); face(w, Math.PI, d / 2); face(d, Math.PI / 2, w / 2); face(d, -Math.PI / 2, w / 2);
  g.add(mesh(mergeGeometries(geos), stdT(repTex(TEX.planks, 0.3, 0.3), '#6a4428', { roughness: 0.9 })));
  // telhado (inclinação ao longo de x, cumeeira ao longo de z)
  const roofH = 1.5 + r() * 1.2, ov = 0.35, run = w / 2 + ov;
  const slope = Math.hypot(run, roofH), ang = Math.atan2(roofH, run);
  const roofMat = stdT(repTex(TEX.roof, slope / 0.9, (d + ov * 2) / 1.2), ['#e0a090', '#c89080', '#d0a890', '#a8a0a0'][Math.floor(r() * 4)], { roughness: 0.85 });
  for (const s of [-1, 1]) { const rp = mesh(new THREE.BoxGeometry(slope + 0.1, 0.1, d + ov * 2), roofMat); rp.position.set(s * run / 2, h + (w / 2) * Math.tan(ang) - run / 2 * Math.tan(ang) + 0.05, 0); rp.rotation.z = -s * ang; g.add(rp); }
  const gShape = new THREE.Shape(); const gh = roofH * (w / 2) / run; gShape.moveTo(-w / 2, 0); gShape.lineTo(0, gh); gShape.lineTo(w / 2, 0); gShape.lineTo(-w / 2, 0);
  for (const s of [-1, 1]) { const gg = mesh(new THREE.ShapeGeometry(gShape), wallMat); gg.position.set(0, h, s * d / 2); if (s < 0) gg.rotation.y = Math.PI; g.add(gg); }
  const ridge = mesh(new THREE.CylinderGeometry(0.1, 0.1, d + ov * 2, 8), std('#6a3a28')); ridge.rotation.x = Math.PI / 2; ridge.position.y = h + gh + 0.12; g.add(ridge);
  const chx = w * 0.22, chz = -d * 0.15, chy = h + (w / 2 - chx) * Math.tan(ang) + 0.5;
  const ch = mesh(new THREE.BoxGeometry(0.55, 1.6, 0.55), stdT(repTex(TEX.brick, 0.5, 1), '#d0a090')); ch.position.set(chx, chy, chz); g.add(ch);
  const chCap = mesh(new THREE.BoxGeometry(0.7, 0.1, 0.7), std('#555')); chCap.position.set(chx, chy + 0.82, chz); g.add(chCap);
  g.userData.chimneyTop = new THREE.Vector3(chx, chy + 0.9, chz);
  // janelas
  const wm = new THREE.MeshStandardMaterial({ map: TEX.window, emissive: '#ffb84a', emissiveIntensity: 0.08, roughness: .2, metalness: 0.1 });
  const shutterC = ['#2f5d3a', '#3a4f7a', '#7a2f2f', '#6a5a2a'][Math.floor(r() * 4)];
  const nW = Math.max(1, Math.floor(w / 1.6));
  const doorX = (seed % 2) ? -w * .25 : w * .22;
  for (let i = 0; i < nW; i++) {
    const x = -w / 2 + (i + 0.5) * w / nW, y = h * 0.74;
    const win = mesh(new THREE.PlaneGeometry(0.7, 0.8), wm, { cast: false }); win.position.set(x, y, d / 2 + 0.09); g.add(win);
    const sill = box(0.9, 0.06, 0.16, std('#5a3a22')); sill.position.set(x, y - 0.44, d / 2 + 0.12); g.add(sill);
    for (const s of [-1, 1]) { const sh = box(0.34, 0.82, 0.04, std(shutterC, { roughness: 0.8 })); sh.position.set(x + s * 0.55, y, d / 2 + 0.12); sh.rotation.y = s * 0.2; g.add(sh); }
    if (r() < 0.7) { const fb = box(0.8, 0.18, 0.2, std('#6a4224')); fb.position.set(x, y - 0.55, d / 2 + 0.22); g.add(fb); for (let k = 0; k < 7; k++) { const lf = mesh(new THREE.IcosahedronGeometry(0.075, 0), toon('#3f7a2a')); lf.position.set(x - 0.3 + k * 0.1, y - 0.44, d / 2 + 0.22); g.add(lf); const fl = mesh(new THREE.IcosahedronGeometry(0.055, 0), toon(['#e74c3c', '#f1c40f', '#ecf0f1', '#9b59b6'][Math.floor(r() * 4)])); fl.position.set(x - 0.33 + k * 0.11, y - 0.38 + r() * 0.05, d / 2 + 0.22 + (r() - .5) * 0.08); g.add(fl); } }
    const x2 = x + (i % 2 ? 0.45 : -0.45);
    if (Math.abs(x2 - doorX) > 0.9) { const w2 = win.clone(); w2.position.set(x2, h * 0.3 + 0.3, d / 2 + 0.09); g.add(w2); }
  }
  const door = box(0.95, 1.7, 0.1, stdT(repTex(TEX.planks, 0.5, 0.8), '#8a5a32')); door.position.set(doorX, 0.85, d / 2 + 0.05); g.add(door);
  const knob = mesh(new THREE.SphereGeometry(0.04, 8, 6), std('#222', { metalness: 0.8 })); knob.position.set(doorX + 0.32, 0.85, d / 2 + 0.12); g.add(knob);
  const lintel = box(1.15, 0.14, 0.16, std('#4a2c14')); lintel.position.set(doorX, 1.75, d / 2 + 0.08); g.add(lintel);
  return g;
}
export function tree(seed, autumn = false) {
  const r = rng(seed); const g = new THREE.Group();
  const trunk = mesh(new THREE.CylinderGeometry(0.14, 0.26, 2.4, 10), std('#5a3a1e', { roughness: 1 })); trunk.position.y = 1.2; g.add(trunk);
  for (let i = 0; i < 3; i++) { const br = mesh(new THREE.CylinderGeometry(0.04, 0.08, 1, 6), std('#5a3a1e')); br.position.set((r() - .5) * 0.5, 2.2, (r() - .5) * 0.5); br.rotation.set((r() - .5) * 1.2, 0, (r() - .5) * 1.2); g.add(br); }
  const leaves = new THREE.Group(); g.add(leaves); g.userData.leaves = leaves;
  for (let i = 0; i < 10; i++) { const lm = toon(autumn ? hsl(15 + r() * 30, 65 + r() * 20, 38 + r() * 12) : hsl(90 + r() * 30, 40 + r() * 15, 26 + r() * 12)); const l = mesh(new THREE.IcosahedronGeometry(0.7 + r() * 0.5, 1), lm); l.position.set((r() - .5) * 1.8, 2.4 + r() * 1.5, (r() - .5) * 1.8); l.rotation.set(r() * 3, r() * 3, 0); leaves.add(l); }
  return g;
}
export function lantern() {
  const g = new THREE.Group();
  const frame = std('#222', { metalness: .7, roughness: .4 });
  g.add(mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.28, 6), new THREE.MeshStandardMaterial({ color: '#ffcf70', emissive: '#ffae3a', emissiveIntensity: 3, transparent: true, opacity: .9 }), { cast: false }));
  const cap = mesh(new THREE.ConeGeometry(0.16, 0.14, 6), frame); cap.position.y = 0.2; g.add(cap);
  const bot = mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.04, 6), frame); bot.position.y = -0.15; g.add(bot);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const bar = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.3, 4), frame); bar.position.set(Math.cos(a) * 0.115, 0, Math.sin(a) * 0.115); g.add(bar); }
  return g;
}
export function tomato() {
  const g = new THREE.Group();
  const t = withOutline(mesh(new THREE.SphereGeometry(0.11, 18, 14), std('#d62a1a', { roughness: 0.35 })), 0.01); t.scale.y = 0.85; g.add(t);
  const st = mesh(new THREE.ConeGeometry(0.045, 0.04, 5), toon('#2f7a22')); st.position.y = 0.1; g.add(st);
  return g;
}
export function barrel(scale = 1) {
  const g = new THREE.Group();
  const pts = []; for (let i = 0; i <= 10; i++) { const y = i / 10; pts.push(new THREE.Vector2(0.36 + Math.sin(y * Math.PI) * 0.07, y)); }
  g.add(mesh(new THREE.LatheGeometry(pts, 24), stdT(repTex(TEX.planks, 2, 0.5), '#a8784a')));
  const top = mesh(new THREE.CircleGeometry(0.36, 24), stdT(repTex(TEX.planks, 0.5, 0.5), '#9a6a3a')); top.rotation.x = -Math.PI / 2; top.position.y = 0.99; g.add(top);
  for (const y of [0.12, 0.88, 0.5]) { const hp = mesh(new THREE.TorusGeometry(0.36 + Math.sin(y * Math.PI) * 0.07 + 0.006, 0.018, 6, 28), std('#333', { metalness: .7, roughness: .5 })); hp.rotation.x = Math.PI / 2; hp.position.y = y; g.add(hp); }
  g.scale.setScalar(scale); return g;
}
export function crate(s = 0.6) {
  const g = new THREE.Group();
  const b = box(s, s, s, stdT(repTex(TEX.planks, 0.6, 0.6), '#c09060')); b.position.y = s / 2; g.add(b);
  const fm = std('#6a4224'); for (const [x, z, ry] of [[0, s / 2 + 0.012, 0], [0, -s / 2 - 0.012, 0], [s / 2 + 0.012, 0, Math.PI / 2], [-s / 2 - 0.012, 0, Math.PI / 2]]) { const dd = box(0.06, s * 1.3, 0.02, fm); dd.position.set(x, s / 2, z); dd.rotation.set(0, ry, 0.78); g.add(dd); }
  return g;
}
export function sack() { const g = new THREE.Group(); const s = withOutline(box(0.6, 0.85, 0.45, stdT(TEX.sack), 0.2), 0.01); s.position.y = 0.42; g.add(s); const tie = mesh(new THREE.SphereGeometry(0.12, 10, 8), stdT(TEX.sack)); tie.scale.y = 0.6; tie.position.y = 0.88; g.add(tie); return g; }
export function cart() {
  const g = new THREE.Group(); const m = stdT(repTex(TEX.planks, 1, 0.5), '#a87a4a');
  const bed = box(1.8, 0.1, 1.1, m); bed.position.y = 0.7; g.add(bed);
  for (const [x, z, w, d] of [[0, 0.55, 1.8, 0.06], [0, -0.55, 1.8, 0.06], [0.9, 0, 0.06, 1.1], [-0.9, 0, 0.06, 1.1]]) { const s = box(w, 0.35, d, m); s.position.set(x, 0.92, z); g.add(s); }
  for (const s of [-1, 1]) { const wh = new THREE.Group(); wh.position.set(0, 0.45, s * 0.62); g.add(wh); wh.add(mesh(new THREE.TorusGeometry(0.43, 0.045, 8, 24), std('#5a3a1e'))); for (let i = 0; i < 8; i++) { const sp = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.86, 5), std('#6a4a2a')); sp.rotation.z = i / 8 * Math.PI; wh.add(sp); } const hub = mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.12, 10), std('#333')); hub.rotation.x = Math.PI / 2; wh.add(hub); }
  for (const s of [-1, 1]) { const hd = box(1.4, 0.06, 0.06, m); hd.position.set(1.5, 0.62, s * 0.35); hd.rotation.z = -0.15; g.add(hd); }
  for (let i = 0; i < 7; i++) { const hb = mesh(new THREE.IcosahedronGeometry(0.25, 1), toon('#d9b860')); hb.position.set(-0.7 + i * 0.23, 0.98, (i % 2 - 0.5) * 0.4); hb.scale.y = 0.6; g.add(hb); }
  return g;
}
export function bunting(a, b, n = 14, sag = 0.8, seed = 1) {
  const r = rng(seed); const g = new THREE.Group(); const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const pts = []; for (let i = 0; i <= 24; i++) { const k = i / 24; const p = A.clone().lerp(B, k); p.y -= Math.sin(k * Math.PI) * sag; pts.push(p); }
  const curve = new THREE.CatmullRomCurve3(pts);
  g.add(mesh(new THREE.TubeGeometry(curve, 40, 0.012, 4), std('#333'), { cast: false }));
  const cols = ['#e74c3c', '#f1c40f', '#3498db', '#2ecc71', '#ecf0f1', '#9b59b6'];
  const tri = new THREE.BufferGeometry(); tri.setAttribute('position', new THREE.Float32BufferAttribute([-0.14, 0, 0, 0.14, 0, 0, 0, -0.32, 0], 3)); tri.computeVertexNormals();
  const flags = [];
  for (let i = 1; i < n; i++) { const p = curve.getPoint(i / n); const f = mesh(tri, std(cols[i % cols.length], { side: THREE.DoubleSide, roughness: 0.9 })); f.position.copy(p); const tg = curve.getTangent(i / n); f.rotation.y = Math.atan2(-tg.z, tg.x); f.userData.ph = r() * 6; f.userData.ry = f.rotation.y; g.add(f); flags.push(f); }
  g.userData.flags = flags; return g;
}
export function bird() {
  const g = new THREE.Group(); const m = new THREE.MeshBasicMaterial({ color: '#2a2a2a', side: THREE.DoubleSide });
  const wing = new THREE.BufferGeometry(); wing.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.12, 0, 0, -0.12, 0.6, 0, 0], 3));
  const wl = new THREE.Mesh(wing, m), wr = new THREE.Mesh(wing, m); wr.scale.x = -1; g.add(wl, wr);
  const bd = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 4), m); bd.scale.z = 2.2; g.add(bd);
  g.userData.wings = [wl, wr]; return g;
}
// partículas determinísticas: fn(sprite, i, t) define posição/escala/opacidade
export function particles(n, mat, fn) {
  const g = new THREE.Group(); const sprites = [];
  for (let i = 0; i < n; i++) { const s = new THREE.Sprite(mat.clone()); g.add(s); sprites.push(s); }
  g.userData.update = (t) => sprites.forEach((s, i) => fn(s, i, t));
  return g;
}
export function lightShaft(len, r0, r1, color = '#fff2d0', intensity = 0.35) {
  const geo = new THREE.CylinderGeometry(r0, r1, len, 32, 1, true); geo.translate(0, -len / 2, 0);
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { col: { value: new THREE.Color(color) }, inten: { value: intensity } },
    vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vec4 mv = modelViewMatrix*vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
    fragmentShader: 'uniform vec3 col; uniform float inten; varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ float edge = pow(abs(dot(vN, vV)), 2.5); float along = pow(vUv.y, 1.3); gl_FragColor = vec4(col * inten * edge * along, 1.0); }',
  });
  const s = new THREE.Mesh(geo, m); s.renderOrder = 5; return s;
}
