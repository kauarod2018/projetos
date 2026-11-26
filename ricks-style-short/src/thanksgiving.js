// Episódio: "The Year America Had Two Thanksgivings" (Franksgiving, 1939)
import * as THREE from 'three';
import * as L from './lib.js';
import * as F from './fx.js';
const { mesh, box, std, stdT, toon, makeChar, TEX, rng, P, kf, clamp, lerp, sstep, walkPose, pathAt, exprKeys, repTex, mixPose, canvasTex, canvasTexN, withOutline } = L;
const { place, angTo, handPos, arcPos, spring, flame, flicker } = F;

const timing = await (await fetch('./build/thanksgiving/timing.json')).json();
const lines = timing.lines;
L.buildTextures();
const R = F.setupRenderer();
const wordT = (li, w) => { const f = lines[li].words.find(x => x.w.toLowerCase().replace(/[^a-z0-9']/g, '').startsWith(w)); return f ? f.t : lines[li].start; };
const LS = (i) => lines[i].start;
const rr = rng(1939);

// ---------- texturas do episódio ----------
const T2 = {};
T2.wallpaper = canvasTexN(512, 512, (c, w, h) => {
  c.fillStyle = '#e9dfc2'; c.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 64) { c.fillStyle = '#7a9a7a'; c.fillRect(x, 0, 10, h); c.fillStyle = 'rgba(122,154,122,0.4)'; c.fillRect(x + 16, 0, 3, h); }
  for (let y = 0; y < h; y += 64) for (let x = 32; x < w; x += 64) { c.fillStyle = '#b06a5a'; for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; c.beginPath(); c.arc(x + Math.cos(a) * 6, y + 32 + Math.sin(a) * 6, 4, 0, 7); c.fill(); } c.fillStyle = '#e8c070'; c.beginPath(); c.arc(x, y + 32, 3, 0, 7); c.fill(); }
  for (let i = 0; i < 9000; i++) { c.fillStyle = `rgba(0,0,0,${Math.random() * 0.04})`; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
}, [1, 1], 0.8);
T2.marble = canvasTexN(1024, 1024, (c, w, h) => {
  c.fillStyle = '#ece9e2'; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 26; i++) { c.strokeStyle = `rgba(110,110,120,${0.15 + rr() * 0.25})`; c.lineWidth = 1 + rr() * 3; c.beginPath(); let x = rr() * w, y = 0; c.moveTo(x, y); while (y < h) { x += (rr() - .5) * 60; y += 20 + rr() * 30; c.lineTo(x, y); } c.stroke(); }
  for (let i = 0; i < 20000; i++) { c.fillStyle = `rgba(0,0,0,${rr() * 0.03})`; c.fillRect(rr() * w, rr() * h, 2, 2); }
  c.strokeStyle = 'rgba(80,80,80,0.5)'; c.lineWidth = 3; for (let x = 0; x <= w; x += 256) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } for (let y = 0; y <= h; y += 256) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
}, [1, 1], 1.5);
const textTex = (w, h, bg, lines2, opts = {}) => canvasTex(w, h, (c) => {
  c.fillStyle = bg; c.fillRect(0, 0, w, h);
  if (opts.border) { c.strokeStyle = opts.border; c.lineWidth = opts.bw || 12; c.strokeRect(8, 8, w - 16, h - 16); }
  for (let i = 0; i < 3000; i++) { c.fillStyle = `rgba(0,0,0,${Math.random() * 0.05})`; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  c.textAlign = 'center'; c.textBaseline = 'middle';
  lines2.forEach(([txt, size, col, y, font]) => { c.fillStyle = col; c.font = `${font || '900'} ${size}px ${opts.family || 'Inter'}`; c.fillText(txt, w / 2, y); });
});
T2.flag = canvasTex(760, 400, (c, w, h) => {
  for (let i = 0; i < 13; i++) { c.fillStyle = i % 2 ? '#f4f1ea' : '#b22234'; c.fillRect(0, i * h / 13, w, h / 13 + 1); }
  c.fillStyle = '#3c3b6e'; c.fillRect(0, 0, w * 0.4, h * 7 / 13);
  c.fillStyle = '#fff'; for (let r = 0; r < 6; r++) for (let k = 0; k < 8; k++) { const x = 18 + k * 36, y = 18 + r * 34; c.beginPath(); for (let p = 0; p < 10; p++) { const a = -Math.PI / 2 + p * Math.PI / 5, rad = p % 2 ? 4 : 10; c.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); } c.fill(); }
});
T2.presFlag = canvasTex(400, 300, (c, w, h) => { c.fillStyle = '#1c2f6e'; c.fillRect(0, 0, w, h); c.fillStyle = '#e0c060'; c.beginPath(); c.arc(w / 2, h / 2, 80, 0, 7); c.fill(); c.fillStyle = '#1c2f6e'; c.beginPath(); c.arc(w / 2, h / 2, 64, 0, 7); c.fill(); c.fillStyle = '#e0c060'; c.font = 'bold 60px DejaVu Serif'; c.textAlign = 'center'; c.fillText('★', w / 2, h / 2 + 22); for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(40 + (i % 2) * (w - 80), 40 + Math.floor(i / 2) * (h - 80), 10, 0, 7); c.fill(); } });
T2.view = canvasTex(512, 512, (c, w, h) => {
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#8ab8e8'); g.addColorStop(0.6, '#e8dcc0'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 14; i++) { const x = rr() * w, y = 230 + rr() * 120; c.fillStyle = ['#d2691e', '#e8a33a', '#b5401f', '#c8892a'][i % 4]; c.beginPath(); c.arc(x, y, 50 + rr() * 40, 0, 7); c.fill(); c.fillStyle = '#5a3a1e'; c.fillRect(x - 6, y + 30, 12, 140); }
  c.fillStyle = '#7a8a4a'; c.fillRect(0, 400, w, 112);
});
T2.roast = canvasTex(256, 256, (c, w, h) => { const g = c.createRadialGradient(110, 80, 10, 128, 128, 160); g.addColorStop(0, '#e8a050'); g.addColorStop(0.5, '#b8642a'); g.addColorStop(1, '#6a2e10'); c.fillStyle = g; c.fillRect(0, 0, w, h); for (let i = 0; i < 1500; i++) { c.fillStyle = `rgba(60,20,0,${Math.random() * 0.25})`; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); } });
function turkeyIcon(c, x, y, s) {
  const cols = ['#c0392b', '#e67e22', '#f1c40f', '#8e5a2a', '#d35400'];
  for (let i = 0; i < 7; i++) { const a = Math.PI + (i + 0.5) / 7 * Math.PI; c.fillStyle = cols[i % 5]; c.beginPath(); c.ellipse(x + Math.cos(a) * s * 0.55, y + Math.sin(a) * s * 0.55, s * 0.18, s * 0.38, a + Math.PI / 2, 0, 7); c.fill(); }
  c.fillStyle = '#7a4a24'; c.beginPath(); c.arc(x, y, s * 0.38, 0, 7); c.fill();
  c.beginPath(); c.arc(x, y - s * 0.38, s * 0.2, 0, 7); c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.arc(x - s * 0.06, y - s * 0.42, s * 0.06, 0, 7); c.fill(); c.fillStyle = '#000'; c.beginPath(); c.arc(x - s * 0.06, y - s * 0.42, s * 0.03, 0, 7); c.fill();
  c.fillStyle = '#f1c40f'; c.beginPath(); c.moveTo(x + s * 0.12, y - s * 0.4); c.lineTo(x + s * 0.3, y - s * 0.34); c.lineTo(x + s * 0.12, y - s * 0.3); c.fill();
  c.fillStyle = '#c0392b'; c.beginPath(); c.ellipse(x + s * 0.14, y - s * 0.24, s * 0.05, s * 0.1, 0, 0, 7); c.fill();
}
T2.turkeyIcon = canvasTex(256, 256, (c) => turkeyIcon(c, 128, 150, 200));
T2.newspaper = canvasTex(768, 1024, (c, w, h) => {
  c.fillStyle = '#efe9d8'; c.fillRect(0, 0, w, h); for (let i = 0; i < 20000; i++) { c.fillStyle = `rgba(0,0,0,${Math.random() * 0.05})`; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  c.fillStyle = '#1a1a1a'; c.textAlign = 'center';
  c.font = 'bold 64px DejaVu Serif'; c.fillText('The American Times', w / 2, 90);
  c.fillRect(30, 110, w - 60, 4); c.font = '22px DejaVu Serif'; c.fillText('NOVEMBER 1939  ·  EXTRA EDITION  ·  TWO CENTS', w / 2, 140); c.fillRect(30, 155, w - 60, 2);
  c.font = '900 92px Inter'; c.fillText('FRANKSGIVING!', w / 2, 275);
  c.font = 'bold 40px DejaVu Serif'; c.fillText('President Moves Thanksgiving', w / 2, 345); c.fillText('— Nation Splits in Two —', w / 2, 395);
  c.fillStyle = '#d8d0b8'; c.fillRect(40, 430, 330, 300); turkeyIcon(c, 205, 610, 220); c.strokeStyle = '#1a1a1a'; c.lineWidth = 3; c.strokeRect(40, 430, 330, 300);
  c.fillStyle = '#333'; for (let col = 0; col < 2; col++) for (let i = 0; i < 26; i++) { const x0 = col === 0 ? 40 : 400, ww = col === 0 ? 330 : 330; if (col === 0 && i < 13) continue; c.fillRect(x0, 450 + i * 21 - (col === 0 ? 0 : 0), ww * (0.7 + Math.random() * 0.3), 8); }
  c.font = 'bold 30px DejaVu Serif'; c.fillStyle = '#1a1a1a'; c.fillText('Football games moved!', 570, 470);
});
// calendário dinâmico (canvas redesenhado quando o estado muda)
function makeCalendar({ w = 1.2, h = 1.5, title = 'NOVEMBER', year = '1939', start = 3, days = 30 } = {}) {
  const cv = document.createElement('canvas'); cv.width = 768; cv.height = 960; const c = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const m = mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }), { cast: true, recv: true });
  const cw = 768 / 7, ch = 112, top = 250;
  const cell = (d) => { const idx = d - 1 + start; return { x: (idx % 7) * cw + cw / 2, y: top + Math.floor(idx / 7) * ch + ch / 2 }; };
  let key = '';
  const draw = (st = {}) => {
    const k = JSON.stringify(st); if (k === key) return; key = k;
    c.fillStyle = '#f6f1e2'; c.fillRect(0, 0, 768, 960);
    c.fillStyle = '#9a1c1c'; c.fillRect(0, 0, 768, 190);
    for (let i = 0; i < 9; i++) { c.fillStyle = '#444'; c.beginPath(); c.arc(60 + i * 81, 18, 10, 0, 7); c.fill(); }
    c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '900 92px Inter'; c.fillText(title, 384, 95); c.font = 'bold 40px Inter'; c.fillText(year, 384, 160);
    c.fillStyle = '#333'; c.font = 'bold 30px Inter'; ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].forEach((d, i) => { c.fillStyle = i === 4 && st.thuCol ? '#9a1c1c' : '#333'; c.fillText(d, i * cw + cw / 2, 222); });
    if (st.thuCol) { c.fillStyle = `rgba(230,150,40,${0.25 * st.thuCol})`; c.fillRect(4 * cw, top, cw, ch * 5); }
    c.strokeStyle = '#bbb'; c.lineWidth = 2; for (let r = 0; r <= 5; r++) { c.beginPath(); c.moveTo(0, top + r * ch); c.lineTo(768, top + r * ch); c.stroke(); } for (let i = 0; i <= 7; i++) { c.beginPath(); c.moveTo(i * cw, top); c.lineTo(i * cw, top + ch * 5); c.stroke(); }
    for (let d = 1; d <= days; d++) { const p = cell(d); const thu = (d - 1 + start) % 7 === 4; c.fillStyle = thu && st.thuBold ? '#9a1c1c' : '#2a2a2a'; c.font = (thu && st.thuBold ? '900 ' : 'bold ') + '44px Inter'; c.fillText(String(d), p.x, p.y); }
    (st.circles || []).forEach(({ d, col = '#d22', k = 1 }) => { const p = cell(d); c.strokeStyle = col; c.lineWidth = 9; c.beginPath(); c.arc(p.x, p.y, 44, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(k)); c.stroke(); });
    (st.icons || []).forEach(({ d, s = 1 }) => { const p = cell(d); turkeyIcon(c, p.x + 26, p.y + 22, 44 * s); });
    (st.stamps || []).forEach(({ txt, y, rot, k }) => { if (k <= 0) return; c.save(); c.translate(384, y); c.rotate(rot); c.globalAlpha = 0.85 * clamp(k); c.strokeStyle = '#c0141a'; c.fillStyle = '#c0141a'; c.lineWidth = 10; c.font = '900 84px Inter'; const tw = c.measureText(txt).width; c.strokeRect(-tw / 2 - 26, -62, tw + 52, 124); c.fillText(txt, 0, 4); c.restore(); });
    tex.needsUpdate = true;
  };
  draw({});
  const local = (d) => { const p = cell(d); return new THREE.Vector3((p.x / 768 - 0.5) * w, (0.5 - p.y / 960) * h, 0.01); };
  return { mesh: m, draw, local };
}

// ---------- props ----------
function turkey(s = 1) {
  const g = new THREE.Group();
  const plate = mesh(new THREE.CylinderGeometry(0.45, 0.4, 0.035, 36), std('#e8e4dc', { metalness: 0.3, roughness: 0.25 })); g.add(plate);
  const rim = mesh(new THREE.TorusGeometry(0.44, 0.018, 8, 36), std('#c9a227', { metalness: 0.9, roughness: 0.3 })); rim.rotation.x = Math.PI / 2; rim.position.y = 0.02; g.add(rim);
  const roast = new THREE.MeshStandardMaterial({ map: T2.roast, roughness: 0.35 });
  const body = withOutline(mesh(new THREE.SphereGeometry(0.24, 32, 20), roast), 0.008); body.scale.set(1.3, 0.85, 1); body.position.y = 0.2; g.add(body);
  const breast = mesh(new THREE.SphereGeometry(0.16, 20, 14), roast); breast.position.set(0.05, 0.3, 0); breast.scale.set(1.3, 0.8, 1.1); g.add(breast);
  for (const sd of [-1, 1]) {
    const leg = new THREE.Group(); leg.position.set(0.22, 0.2, sd * 0.13); leg.rotation.set(sd * 0.3, 0, -0.7); g.add(leg);
    const meat = withOutline(mesh(new THREE.CapsuleGeometry(0.075, 0.12, 6, 12), roast), 0.006); meat.position.y = 0.06; leg.add(meat);
    const bone = mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.12, 8), std('#f4ecd8')); bone.position.y = 0.2; leg.add(bone);
    for (const e of [-1, 1]) { const k = mesh(new THREE.SphereGeometry(0.025, 8, 6), std('#f4ecd8')); k.position.set(e * 0.02, 0.26, 0); leg.add(k); }
    const wing = mesh(new THREE.SphereGeometry(0.09, 12, 8), roast); wing.scale.set(1.4, 0.6, 0.6); wing.position.set(-0.08, 0.22, sd * 0.24); g.add(wing);
  }
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const gar = mesh(new THREE.IcosahedronGeometry(0.04, 0), toon(i % 3 ? '#3f8a2a' : '#e67e22')); gar.position.set(Math.cos(a) * 0.36, 0.04, Math.sin(a) * 0.36); g.add(gar); }
  g.scale.setScalar(s); return g;
}
function bowl(color, s = 1) { const g = new THREE.Group(); const b = mesh(new THREE.SphereGeometry(0.15, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), std('#f2efe6', { side: THREE.DoubleSide, roughness: 0.3 })); b.position.y = 0.13; g.add(b); const f = mesh(new THREE.SphereGeometry(0.135, 16, 8), toon(color)); f.scale.y = 0.4; f.position.y = 0.12; g.add(f); g.scale.setScalar(s); return g; }
function pie() { const g = new THREE.Group(); const c = mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.07, 28), std('#d9a05a')); c.position.y = 0.035; g.add(c); const top = mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.01, 28), toon('#c8701e')); top.position.y = 0.072; g.add(top); for (let i = 0; i < 6; i++) { const cr = mesh(new THREE.TorusGeometry(0.19, 0.018, 6, 6, Math.PI / 3), std('#e0b070')); cr.rotation.x = Math.PI / 2; cr.rotation.z = i * Math.PI / 3; cr.position.y = 0.07; g.add(cr); } return g; }
function candle() { const g = new THREE.Group(); const h = mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.06, 12), std('#c9a227', { metalness: 0.9, roughness: 0.3 })); h.position.y = 0.03; g.add(h); const c = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 10), std('#f4ecd8')); c.position.y = 0.2; g.add(c); const f = flame(0.14); f.position.y = 0.35; g.add(f); g.userData.flame = f; return g; }
function chair(color = '#6a4224') { const g = new THREE.Group(); const m = stdT(repTex(TEX.planks, 0.3, 0.3), color); const seat = box(0.48, 0.06, 0.48, m, 0.02); seat.position.y = 0.48; g.add(seat); for (const [x, z] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) { const l = box(0.05, 0.48, 0.05, m); l.position.set(x, 0.24, z); g.add(l); } const back = box(0.48, 0.6, 0.05, m, 0.02); back.position.set(0, 0.8, -0.22); g.add(back); return g; }
function football() { const g = new THREE.Group(); const b = withOutline(mesh(new THREE.SphereGeometry(0.1, 20, 14), std('#7a3a1a', { roughness: 0.6 })), 0.006); b.scale.set(1, 0.65, 0.65); g.add(b); for (let i = 0; i < 4; i++) { const l = mesh(new THREE.BoxGeometry(0.005, 0.03, 0.006), std('#fff')); l.position.set(-0.03 + i * 0.02, 0.065, 0); g.add(l); } return g; }
function sign(txt, col = '#f4ecd8', ink = '#1a1a1a') { const g = new THREE.Group(); const pole = mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.1, 6), std('#8a6a3a')); pole.position.y = 0.45; g.add(pole); const b = mesh(new THREE.BoxGeometry(0.75, 0.42, 0.03), [std('#d8ccb0'), std('#d8ccb0'), std('#d8ccb0'), std('#d8ccb0'), std('#ffffff', { map: textTex(512, 288, col, [[txt[0], txt[0].length > 10 ? 52 : 64, ink, txt[1] ? 105 : 144], [txt[1] || '', 52, ink, 195]], { border: ink, bw: 8 }) }), std('#d8ccb0')]); b.position.y = 1.1; g.add(b); return g; }
function car(color = '#2f4a3a') {
  const g = new THREE.Group(); const paint = std(color, { metalness: 0.5, roughness: 0.25 }); const chrome = std('#ddd', { metalness: 1, roughness: 0.15 });
  const bodyC = box(1.0, 0.45, 2.6, paint, 0.15); bodyC.position.y = 0.6; g.add(bodyC);
  const cab = box(0.95, 0.5, 1.3, paint, 0.15); cab.position.set(0, 1.05, -0.2); g.add(cab);
  const glass = new THREE.MeshStandardMaterial({ color: '#223', metalness: 0.6, roughness: 0.1 });
  for (const sd of [-1, 1]) { const wg = mesh(new THREE.PlaneGeometry(1.1, 0.36), glass); wg.position.set(sd * 0.48, 1.08, -0.2); wg.rotation.y = sd * Math.PI / 2; g.add(wg); }
  const ws = mesh(new THREE.PlaneGeometry(0.85, 0.36), glass); ws.position.set(0, 1.08, 0.46); g.add(ws);
  const hood = box(0.7, 0.35, 0.9, paint, 0.12); hood.position.set(0, 0.75, 1.0); g.add(hood);
  const grill = box(0.5, 0.4, 0.05, chrome); grill.position.set(0, 0.72, 1.46); g.add(grill);
  for (const sd of [-1, 1]) { const hl = mesh(new THREE.SphereGeometry(0.09, 14, 10), new THREE.MeshStandardMaterial({ color: '#fffbe0', emissive: '#665a30', metalness: 0.3, roughness: 0.1 })); hl.position.set(sd * 0.42, 0.9, 1.35); g.add(hl); }
  for (const [x, z] of [[-0.5, 0.95], [0.5, 0.95], [-0.5, -0.95], [0.5, -0.95]]) { const fender = mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.3, 20, 1, false, 0, Math.PI), paint); fender.rotation.set(0, 0, Math.PI / 2); fender.rotation.order = 'ZYX'; fender.position.set(x, 0.42, z); fender.rotation.set(Math.PI / 2, 0, Math.PI / 2); fender.rotation.set(0, Math.PI / 2, 0); fender.rotateZ(Math.PI / 2); g.add(fender); const wh = mesh(new THREE.TorusGeometry(0.24, 0.09, 10, 24), std('#151515', { roughness: 0.9 })); wh.rotation.y = Math.PI / 2; wh.position.set(x * 1.02, 0.32, z); g.add(wh); const hub = mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.2, 14), chrome); hub.rotation.z = Math.PI / 2; hub.position.set(x * 1.02, 0.32, z); g.add(hub); }
  const bump = box(1.1, 0.08, 0.08, chrome); bump.position.set(0, 0.42, 1.5); g.add(bump); const bump2 = bump.clone(); bump2.position.z = -1.32; g.add(bump2);
  return g;
}
function brickBuilding(w, h, d, seed, shop) {
  const r = rng(seed); const g = new THREE.Group();
  const col = ['#c08070', '#b07060', '#d0a080', '#a86a5a', '#c8b090'][Math.floor(r() * 5)];
  const walls = mesh(new THREE.BoxGeometry(w, h, d), stdT(repTex(TEX.brick, w / 2.5, h / 2.5), col)); walls.position.y = h / 2; g.add(walls);
  const corn = box(w + 0.3, 0.3, d + 0.3, std('#d8d0c0')); corn.position.y = h + 0.05; g.add(corn);
  const glass = new THREE.MeshStandardMaterial({ color: '#3a4a5a', metalness: 0.5, roughness: 0.15, emissive: '#2a2010', emissiveIntensity: 0.4 });
  const frameM = std('#e8e0d0');
  const floors = Math.floor((h - 3) / 2.2);
  for (let f = 0; f < floors; f++) for (let i = 0; i < Math.floor(w / 1.5); i++) { const x = -w / 2 + 0.75 + i * 1.5, y = 3.6 + f * 2.2; const win = mesh(new THREE.PlaneGeometry(0.75, 1.1), glass, { cast: false }); win.position.set(x, y, d / 2 + 0.01); g.add(win); const sill = box(0.95, 0.08, 0.14, frameM); sill.position.set(x, y - 0.6, d / 2 + 0.05); g.add(sill); const lint = box(0.95, 0.12, 0.1, frameM); lint.position.set(x, y + 0.62, d / 2 + 0.04); g.add(lint); const mull = box(0.04, 1.1, 0.04, frameM); mull.position.set(x, y, d / 2 + 0.03); g.add(mull); }
  if (shop) {
    const sw = mesh(new THREE.PlaneGeometry(w * 0.6, 1.6), glass, { cast: false }); sw.position.set(-w * 0.12, 1.3, d / 2 + 0.01); g.add(sw);
    const door = box(0.9, 2.1, 0.08, std('#3a2a1a')); door.position.set(w * 0.33, 1.05, d / 2 + 0.03); g.add(door);
    const awT = TEX.awning.clone(); awT.needsUpdate = true; awT.repeat.set(Math.round(w), 1);
    const aw = mesh(new THREE.PlaneGeometry(w - 0.3, 1.0), std('#ffffff', { map: awT, side: THREE.DoubleSide })); aw.position.set(0, 2.55, d / 2 + 0.4); aw.rotation.x = -Math.PI / 2 + 0.5; g.add(aw);
    const sg = mesh(new THREE.PlaneGeometry(w * 0.7, 0.55), std('#ffffff', { map: textTex(512, 128, shop[1] || '#1c3a2a', [[shop[0], 72, '#f2d39a', 66]], { border: '#c9a227', bw: 6, family: 'DejaVu Serif' }) })); sg.position.set(0, 3.15, d / 2 + 0.02); g.add(sg);
  }
  return g;
}
function streetLamp() { const g = new THREE.Group(); const m = std('#1f2a24', { metalness: 0.6, roughness: 0.4 }); const p = mesh(new THREE.CylinderGeometry(0.06, 0.09, 3.6, 10), m); p.position.y = 1.8; g.add(p); const head = mesh(new THREE.SphereGeometry(0.22, 14, 10), new THREE.MeshStandardMaterial({ color: '#fff4d0', emissive: '#ffd890', emissiveIntensity: 0.8 })); head.position.y = 3.75; g.add(head); const cap = mesh(new THREE.ConeGeometry(0.25, 0.2, 10), m); cap.position.y = 4.0; g.add(cap); return g; }
function teddy(col = '#a0703a') { const g = new THREE.Group(); const m = toon(col); const b = withOutline(mesh(new THREE.SphereGeometry(0.12, 14, 10), m), 0.006); b.position.y = 0.12; b.scale.y = 1.15; g.add(b); const h = withOutline(mesh(new THREE.SphereGeometry(0.09, 14, 10), m), 0.006); h.position.y = 0.3; g.add(h); for (const s of [-1, 1]) { const e = mesh(new THREE.SphereGeometry(0.035, 8, 6), m); e.position.set(s * 0.07, 0.38, 0); g.add(e); const a = mesh(new THREE.SphereGeometry(0.045, 8, 6), m); a.position.set(s * 0.12, 0.15, 0.03); g.add(a); } const sn = mesh(new THREE.SphereGeometry(0.035, 8, 6), toon('#e8d0a0')); sn.position.set(0, 0.29, 0.08); g.add(sn); for (const s of [-1, 1]) { const ey = mesh(new THREE.SphereGeometry(0.012, 6, 4), L.BLACK); ey.position.set(s * 0.03, 0.32, 0.08); g.add(ey); } return g; }
function toyTrain() { const g = new THREE.Group(); const cols = ['#c0392b', '#2e86c1', '#27ae60']; for (let i = 0; i < 3; i++) { const c = box(0.22, 0.14, 0.14, std(cols[i], { roughness: 0.4 }), 0.02); c.position.set(-0.26 * i, 0.11, 0); g.add(c); for (const s of [-1, 1]) for (const e of [-1, 1]) { const w = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 10), L.BLACK); w.rotation.x = Math.PI / 2; w.position.set(-0.26 * i + e * 0.07, 0.04, s * 0.07); g.add(w); } } const ch = mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.1, 8), std('#222')); ch.position.set(0.05, 0.23, 0); g.add(ch); return g; }
function drum() { const g = new THREE.Group(); const d = mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.16, 18), toon('#c0392b')); d.position.y = 0.08; g.add(d); for (const y of [0.005, 0.155]) { const rm = mesh(new THREE.TorusGeometry(0.13, 0.012, 6, 18), std('#f4ecd8')); rm.rotation.x = Math.PI / 2; rm.position.y = y; g.add(rm); } return g; }
function gift(col) { const g = new THREE.Group(); const b = box(0.25, 0.2, 0.25, toon(col), 0.01); b.position.y = 0.1; g.add(b); const rb = toon('#f1c40f'); const r1 = box(0.26, 0.21, 0.04, rb); r1.position.y = 0.1; g.add(r1); const r2 = box(0.04, 0.21, 0.26, rb); r2.position.y = 0.1; g.add(r2); const bw = mesh(new THREE.TorusGeometry(0.04, 0.015, 6, 12), rb); bw.position.y = 0.22; g.add(bw); return g; }

const scenes = {}, updaters = {}; const sunFollow = {};
const newScene = (name) => { const S = new THREE.Scene(); scenes[name] = S; updaters[name] = []; return S; };

// =====================================================================
// CASA: jantar de Thanksgiving
// =====================================================================
const H = {};
{
  const S = newScene('home'), U = updaters.home;
  S.background = new THREE.Color('#2a2018'); S.fog = new THREE.Fog('#2a2018', 12, 30);
  S.add(new THREE.HemisphereLight('#fff6ea', '#5a4030', 1.25));
  { const fill = new THREE.DirectionalLight('#fff3e0', 0.9); fill.position.set(1, 4, 7); S.add(fill); }
  const floor = mesh(new THREE.PlaneGeometry(12, 12), stdT(repTex(TEX.planks, 4, 4), '#c89a6a', { roughness: 0.55 })); floor.rotation.x = -Math.PI / 2; S.add(floor);
  const rug = mesh(new THREE.PlaneGeometry(4.2, 3.0), std('#8a2a2a', { roughness: 1 })); rug.rotation.x = -Math.PI / 2; rug.position.y = 0.005; S.add(rug);
  const rugB = mesh(new THREE.PlaneGeometry(4.0, 2.8), std('#b0803a', { roughness: 1 })); rugB.rotation.x = -Math.PI / 2; rugB.position.y = 0.007; S.add(rugB); const rugC = mesh(new THREE.PlaneGeometry(3.7, 2.5), std('#7a2424', { roughness: 1 })); rugC.rotation.x = -Math.PI / 2; rugC.position.y = 0.009; S.add(rugC);
  const wp = stdT(repTex(T2.wallpaper, 5, 2), '#ffffff', { roughness: 0.9 });
  const back = mesh(new THREE.PlaneGeometry(12, 4.2), wp); back.position.set(0, 2.1, -2.6); S.add(back);
  for (const s of [-1, 1]) { const w = mesh(new THREE.PlaneGeometry(12, 4.2), wp); w.rotation.y = -s * Math.PI / 2; w.position.set(s * 4.5, 2.1, 0); S.add(w); }
  const panelM = stdT(repTex(TEX.planks, 3, 0.4), '#7a4a2a', { roughness: 0.6 });
  const wain = box(12, 1.0, 0.06, panelM); wain.position.set(0, 0.5, -2.57); S.add(wain);
  for (const s of [-1, 1]) { const wn = box(0.06, 1.0, 12, panelM); wn.position.set(s * 4.47, 0.5, 0); S.add(wn); }
  const rail = box(12, 0.06, 0.1, std('#5a3418')); rail.position.set(0, 1.02, -2.54); S.add(rail);
  const ceil = mesh(new THREE.PlaneGeometry(12, 12), std('#efe6d6')); ceil.rotation.x = Math.PI / 2; ceil.position.y = 4.2; S.add(ceil);
  // janela com vista de outono
  const win = mesh(new THREE.PlaneGeometry(1.6, 1.8), new THREE.MeshBasicMaterial({ map: T2.view, color: new THREE.Color(1.4, 1.4, 1.4) })); win.position.set(-0.2, 2.2, -2.58); S.add(win);
  const wfm = std('#f2ece0'); [[0, 0.95, 1.8, 0.1], [0, -0.95, 1.8, 0.1], [0.85, 0, 0.1, 2.0], [-0.85, 0, 0.1, 2.0], [0, 0, 0.06, 1.8], [0, 0.2, 1.6, 0.06]].forEach(([x, y, w, h]) => { const b = box(w, h, 0.08, wfm); b.position.set(-0.2 + x, 2.2 + y, -2.54); S.add(b); });
  for (const s of [-1, 1]) { const cg = new THREE.PlaneGeometry(0.7, 2.4, 10, 1); const p = cg.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 18) * 0.04); cg.computeVertexNormals(); const cu = mesh(cg, std('#8a2a3a', { side: THREE.DoubleSide, roughness: 0.9 })); cu.position.set(-0.2 + s * 1.15, 2.2, -2.48); S.add(cu); }
  const valance = box(2.8, 0.3, 0.1, std('#8a2a3a')); valance.position.set(-0.2, 3.35, -2.48); S.add(valance);
  // lareira
  const fp = new THREE.Group(); fp.position.set(-4.4, 0, 0.2); fp.rotation.y = Math.PI / 2; S.add(fp);
  const fpb = box(1.8, 1.4, 0.5, stdT(repTex(TEX.brick, 1.2, 1), '#c08070')); fpb.position.y = 0.7; fp.add(fpb);
  const fpo = mesh(new THREE.PlaneGeometry(0.8, 0.7), new THREE.MeshBasicMaterial({ color: '#100804' })); fpo.position.set(0, 0.45, 0.26); fp.add(fpo);
  const mantel = box(2.1, 0.1, 0.6, std('#5a3418')); mantel.position.y = 1.45; fp.add(mantel);
  const fires = []; for (let i = 0; i < 4; i++) { const f = flame(0.35 + (i % 2) * 0.12); f.position.set(-0.24 + i * 0.16, 0.12, 0.3); fp.add(f); fires.push(f); }
  const fpl = new THREE.PointLight('#ff8a3a', 4, 6, 1.6); fpl.position.set(0, 0.6, 0.8); fp.add(fpl);
  const clockM = mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.1, 20), std('#c9a227', { metalness: 0.8, roughness: 0.3 })); clockM.rotation.x = Math.PI / 2; clockM.position.set(0, 1.65, 0.1); fp.add(clockM);
  // rádio e quadros
  const radio = new THREE.Group(); radio.position.set(3.6, 0, -2.2); S.add(radio);
  const cab = box(0.9, 0.9, 0.5, stdT(repTex(TEX.planks, 0.4, 0.4), '#6a3a1a')); cab.position.y = 0.45; radio.add(cab);
  const rb = mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.4, 24, 1, false, 0, Math.PI), stdT(repTex(TEX.planks, 0.4, 0.4), '#7a4a24')); rb.rotation.set(Math.PI / 2, 0, -Math.PI / 2); rb.rotation.set(0, 0, 0); rb.position.set(0, 0.9, 0); rb.rotation.x = -Math.PI / 2; rb.rotation.z = Math.PI / 2; radio.add(rb);
  const rbox = box(0.55, 0.55, 0.36, stdT(repTex(TEX.planks, 0.4, 0.4), '#7a4a24'), 0.12); rbox.position.set(0, 1.18, 0); radio.add(rbox);
  const grill = mesh(new THREE.CircleGeometry(0.17, 20), std('#d8c090')); grill.position.set(0, 1.22, 0.185); radio.add(grill);
  for (const [x, y, c] of [[2.4, 2.4, '#4a6a8a'], [1.6, 2.6, '#7a5a3a'], [-2.6, 2.3, '#5a7a4a']]) { const fr = box(0.6, 0.5, 0.04, std('#c9a227', { metalness: 0.7, roughness: 0.35 })); fr.position.set(x, y, -2.56); S.add(fr); const pc = mesh(new THREE.PlaneGeometry(0.5, 0.4), std(c)); pc.position.set(x, y, -2.53); S.add(pc); }
  // calendário de parede
  const wallCal = makeCalendar({ w: 0.6, h: 0.75 }); wallCal.mesh.position.set(1.75, 1.85, -2.55); S.add(wallCal.mesh);
  // mesa
  const table = new THREE.Group(); S.add(table);
  const top = box(2.8, 0.08, 1.3, stdT(repTex(TEX.planks, 1, 0.5), '#7a4a24')); top.position.y = 0.82; table.add(top);
  const cloth = mesh(new THREE.BoxGeometry(2.9, 0.3, 1.4), std('#f4f1ea', { roughness: 0.85 })); cloth.position.y = 0.72; table.add(cloth);
  const runner = mesh(new THREE.PlaneGeometry(2.6, 0.4), std('#b0402a', { roughness: 0.9 })); runner.rotation.x = -Math.PI / 2; runner.position.y = 0.872; table.add(runner);
  for (const [x, z] of [[-1.3, -0.55], [1.3, -0.55], [-1.3, 0.55], [1.3, 0.55]]) { const l = box(0.1, 0.72, 0.1, std('#5a3418')); l.position.set(x, 0.36, z); table.add(l); }
  const t1 = turkey(1); t1.position.set(0, 0.875, -0.05); table.add(t1);
  const dishes = [[bowl('#f2e8c8'), -0.7, -0.15], [bowl('#5a9a3a', 0.85), 0.7, -0.2], [bowl('#a0142a', 0.7), -0.45, 0.3], [pie(), 1.0, 0.25]];
  dishes.forEach(([d, x, z]) => { d.position.set(x, 0.875, z); table.add(d); });
  const cands = []; for (const x of [-1.15, 1.2]) { const c = candle(); c.position.set(x, 0.875, -0.3); table.add(c); cands.push(c); }
  const plates = []; for (const [x, z] of [[-0.85, -0.45], [0, -0.48], [0.85, -0.45], [-1.2, 0.2], [1.25, 0.2]]) { const p = mesh(new THREE.CylinderGeometry(0.17, 0.15, 0.02, 24), std('#f6f3ec', { roughness: 0.25 })); p.position.set(x, 0.885, z); table.add(p); plates.push(p); const gl = mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.14, 12), new THREE.MeshStandardMaterial({ color: '#e8f0ff', transparent: true, opacity: 0.45, roughness: 0.05 })); gl.position.set(x + 0.2, 0.95, z + 0.05); table.add(gl); }
  const chairs = []; for (const [x, z, ry] of [[-0.85, -1.0, 0], [0, -1.0, 0], [0.85, -1.0, 0], [-1.75, 0, Math.PI / 2], [1.75, 0, -Math.PI / 2]]) { const c = chair(); c.position.set(x, 0, z); c.rotation.y = ry; S.add(c); chairs.push(c); }
  const lamp = new THREE.Group(); lamp.position.set(0, 3.4, 0); S.add(lamp); const shade = mesh(new THREE.ConeGeometry(0.45, 0.35, 20, 1, true), std('#e8d8a8', { side: THREE.DoubleSide, emissive: '#806030', emissiveIntensity: 0.4 })); lamp.add(shade); const chain = mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.8), L.BLACK); chain.position.y = 0.55; lamp.add(chain);
  const lampL = new THREE.PointLight('#ffd9a0', 4.5, 8, 1.6); lampL.position.set(0, 3.1, 0); lampL.castShadow = true; lampL.shadow.mapSize.set(1024, 1024); lampL.shadow.radius = 4; lampL.shadow.bias = -0.002; S.add(lampL);
  const du = F.dust(40, [0, 2.2, 0], [5, 2.5, 3], 31); S.add(du); U.push(du.userData.update);
  // família
  const dad = makeChar({ body: '#4a5a7a', vest: '#6a4a2a', tie: '#8a1c1c', mustache: true, hairCap: true, hair: '#3a2a1a', glasses: false, buttons: false });
  const mom = makeChar({ body: '#a04a5a', apron: true, hairCap: true, hair: '#6a3a1a', bun: true, buttons: false, legLen: 0.9 });
  const grandpa = makeChar({ body: '#7a6a5a', bowtie: '#2a3a6a', glasses: true, mustache: true, hairColor: '#e8e8e8', hairCap: true, hair: '#d8d8d8', buttonColor: '#c9a227' });
  const boy = makeChar({ body: '#2e86c1', hat: 'cap', hatColor: '#7a5a3a', buttonColor: '#fff' });
  const girl = makeChar({ body: '#e67e9a', hairCap: true, hair: '#c8902a', bun: true, apron: false, buttonColor: '#fff' });
  boy.root.scale.setScalar(0.72); girl.root.scale.setScalar(0.72);
  [dad, mom, grandpa, boy, girl].forEach(c => S.add(c.root));
  const knife = new THREE.Group(); const kb = mesh(new THREE.BoxGeometry(0.02, 0.28, 0.05), std('#ddd', { metalness: 1, roughness: 0.2 })); kb.position.y = -0.18; knife.add(kb); const kh = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 8), std('#3a2a1a')); knife.add(kh); dad.arms[1].hand.add(knife); knife.rotation.x = 1.2;
  const fork = new THREE.Group(); const fb = mesh(new THREE.BoxGeometry(0.015, 0.25, 0.03), std('#ddd', { metalness: 1, roughness: 0.2 })); fb.position.y = -0.15; fork.add(fb); dad.arms[0].hand.add(fork); fork.rotation.x = 1.2;
  const t2 = turkey(1); S.add(t2);
  const glasses = []; [dad, mom, grandpa].forEach(c => { const g = mesh(new THREE.CylinderGeometry(0.045, 0.035, 0.14, 12), new THREE.MeshStandardMaterial({ color: '#e8f0ff', transparent: true, opacity: 0.5, roughness: 0.05 })); g.position.set(0, 0.06, 0.03); c.arms[1].hand.add(g); glasses.push(g); });
  Object.assign(H, { dad, mom, grandpa, boy, girl, t2, knife, fork, wallCal, glasses, chairs });
  U.push((t) => { fires.forEach((f, i) => flicker(f, t, i)); cands.forEach((c, i) => flicker(c.userData.flame, t, i + 5)); fpl.intensity = 4 + Math.sin(t * 13) * 0.6; });
}

// =====================================================================
// SALÃO OVAL (escritório do presidente)
// =====================================================================
const O = {};
{
  const S = newScene('office'), U = updaters.office;
  S.background = new THREE.Color('#1e1a16'); S.fog = new THREE.Fog('#1e1a16', 12, 30);
  S.add(new THREE.HemisphereLight('#f6f0e6', '#4a3a2a', 1.2));
  { const fill = new THREE.DirectionalLight('#fff6ea', 1.0); fill.position.set(2, 4, 7); S.add(fill); }
  const floor = mesh(new THREE.PlaneGeometry(14, 14), stdT(repTex(TEX.planks, 5, 5), '#b08050', { roughness: 0.4 })); floor.rotation.x = -Math.PI / 2; S.add(floor);
  const carpet = mesh(new THREE.CircleGeometry(3.2, 48), std('#2a3a6a', { roughness: 1 })); carpet.rotation.x = -Math.PI / 2; carpet.position.y = 0.006; S.add(carpet);
  const ring = mesh(new THREE.RingGeometry(2.7, 2.9, 48), std('#c9a227', { roughness: 1 })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.008; S.add(ring);
  const wallM = stdT(repTex(TEX.plaster, 3, 1.4), '#f0eadc', { roughness: 0.9 });
  const back = mesh(new THREE.PlaneGeometry(14, 4.6), wallM); back.position.set(0, 2.3, -2.8); S.add(back);
  for (const s of [-1, 1]) { const w = mesh(new THREE.PlaneGeometry(14, 4.6), wallM); w.rotation.y = -s * Math.PI / 2; w.position.set(s * 4.6, 2.3, 0); S.add(w); }
  const wain = box(14, 1.0, 0.08, stdT(repTex(TEX.planks, 4, 0.4), '#e8e0d0', { roughness: 0.6 })); wain.position.set(0, 0.5, -2.76); S.add(wain);
  const crown = box(14, 0.2, 0.2, std('#f6f0e6')); crown.position.set(0, 4.5, -2.7); S.add(crown);
  // janelas altas atrás da mesa
  for (const x of [-1.2, 1.2]) { const w = mesh(new THREE.PlaneGeometry(0.9, 2.2), new THREE.MeshBasicMaterial({ color: new THREE.Color('#dce8f6').multiplyScalar(1.8) })); w.position.set(x, 2.3, -2.78); S.add(w); for (const s of [-1, 1]) { const cg = new THREE.PlaneGeometry(0.45, 2.9, 8, 1); const p = cg.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 20) * 0.03); cg.computeVertexNormals(); const cu = mesh(cg, std('#c9a24a', { side: THREE.DoubleSide, roughness: 0.8 })); cu.position.set(x + s * 0.6, 2.4, -2.7); S.add(cu); } const sh = L.lightShaft(5, 0.4, 0.9, '#fff4d8', 0.12); F.orientShaft(sh, new THREE.Vector3(x, 2.6, -2.7), new THREE.Vector3(x * 0.5, 0, 0.5)); S.add(sh); }
  const sun = new THREE.SpotLight('#fff4e0', 40, 14, 0.6, 0.6, 1.2); sun.position.set(0, 3.2, -2.6); sun.target.position.set(0.3, 0, 1); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0005; sun.shadow.radius = 4; S.add(sun); S.add(sun.target);
  // bandeiras
  const mkFlag = (tex, x) => { const g = new THREE.Group(); g.position.set(x, 0, -2.2); S.add(g); const pole = mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.8, 10), std('#c9a227', { metalness: 0.9, roughness: 0.3 })); pole.position.y = 1.4; g.add(pole); const tip = mesh(new THREE.SphereGeometry(0.07, 10, 8), std('#c9a227', { metalness: 0.9, roughness: 0.3 })); tip.position.y = 2.85; g.add(tip); const fg = new THREE.PlaneGeometry(0.8, 1.3, 10, 10); const p = fg.attributes.position; for (let i = 0; i < p.count; i++) { p.setZ(i, Math.sin(p.getY(i) * 6) * 0.06); p.setX(i, p.getX(i) * (1 - (0.65 - p.getY(i)) * 0.15)); } fg.computeVertexNormals(); const fl = mesh(fg, std('#ffffff', { map: tex, side: THREE.DoubleSide, roughness: 0.8 })); fl.position.set(0.4 * Math.sign(x) * -1 + 0, 1.9, 0); fl.rotation.y = Math.PI / 2 * Math.sign(x) * -0.3; g.add(fl); };
  mkFlag(T2.flag, -2.1); mkFlag(T2.presFlag, 2.1);
  // mesa do presidente
  const desk = new THREE.Group(); S.add(desk);
  const wood = stdT(repTex(TEX.planks, 1, 0.5), '#6a3a1a', { roughness: 0.35 });
  const dtop = box(2.1, 0.08, 1.0, wood, 0.02); dtop.position.y = 0.8; desk.add(dtop);
  for (const s of [-1, 1]) { const ped = box(0.6, 0.76, 0.9, wood); ped.position.set(s * 0.72, 0.38, 0); desk.add(ped); for (let k = 0; k < 3; k++) { const kn = mesh(new THREE.SphereGeometry(0.02, 8, 6), std('#c9a227', { metalness: 0.9 })); kn.position.set(s * 0.72, 0.2 + k * 0.22, 0.46); desk.add(kn); } }
  const front = box(0.9, 0.5, 0.05, wood); front.position.set(0, 0.5, 0.43); desk.add(front);
  const phone = new THREE.Group(); phone.position.set(-0.7, 0.84, 0.1); desk.add(phone); const pb = box(0.18, 0.08, 0.22, std('#151515', { roughness: 0.3 }), 0.03); phone.add(pb); const ph = mesh(new THREE.CapsuleGeometry(0.03, 0.18, 6, 10), std('#151515', { roughness: 0.3 })); ph.rotation.z = Math.PI / 2; ph.position.y = 0.08; phone.add(ph);
  const dlamp = new THREE.Group(); dlamp.position.set(0.75, 0.84, -0.25); desk.add(dlamp); const ls = mesh(new THREE.CylinderGeometry(0.015, 0.06, 0.4, 8), std('#c9a227', { metalness: 0.9, roughness: 0.3 })); ls.position.y = 0.2; dlamp.add(ls); const lsh = mesh(new THREE.CylinderGeometry(0.06, 0.16, 0.14, 14, 1, true), std('#2a6a3a', { side: THREE.DoubleSide, emissive: '#204020', emissiveIntensity: 0.3 })); lsh.position.y = 0.42; dlamp.add(lsh);
  for (let i = 0; i < 4; i++) { const pp = mesh(new THREE.PlaneGeometry(0.21, 0.28), std('#f4efe2')); pp.rotation.x = -Math.PI / 2; pp.rotation.z = (i - 1.5) * 0.15; pp.position.set(-0.1 + i * 0.03, 0.842 + i * 0.002, 0.15); desk.add(pp); }
  const pen = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.16, 6), std('#151515', { roughness: 0.2 })); pen.rotation.set(Math.PI / 2, 0, 0.6); pen.position.set(0.25, 0.85, 0.2); desk.add(pen);
  const chairP = new THREE.Group(); chairP.position.set(0, 0, -0.75); S.add(chairP); const cs = box(0.6, 0.12, 0.55, std('#4a1a1a', { roughness: 0.6 }), 0.04); cs.position.y = 0.48; chairP.add(cs); const cbk = box(0.62, 1.0, 0.12, std('#4a1a1a', { roughness: 0.6 }), 0.05); cbk.position.set(0, 1.05, -0.25); chairP.add(cbk);
  const globe = new THREE.Group(); globe.position.set(-3.4, 0, -1.6); S.add(globe); const gs = mesh(new THREE.SphereGeometry(0.3, 24, 16), std('#5a8aaa', { roughness: 0.5 })); gs.position.y = 1.15; globe.add(gs); const gst = mesh(new THREE.CylinderGeometry(0.04, 0.2, 0.85, 10), wood); gst.position.y = 0.43; globe.add(gst); const gr = mesh(new THREE.TorusGeometry(0.33, 0.012, 6, 24), std('#c9a227', { metalness: 0.9 })); gr.position.y = 1.15; globe.add(gr);
  for (let i = 0; i < 2; i++) { const bs = new THREE.Group(); bs.position.set(i ? 3.6 : -3.6, 0, -2.4); S.add(bs); const fr = box(1.4, 2.6, 0.4, wood); fr.position.y = 1.3; bs.add(fr); for (let k = 0; k < 4; k++) for (let j = 0; j < 9; j++) { const bk = box(0.1, 0.4 + (j % 3) * 0.05, 0.28, std(['#7a2a2a', '#2a4a6a', '#3a5a2a', '#8a6a2a'][(j + k) % 4])); bk.position.set(-0.55 + j * 0.13, 0.5 + k * 0.6, 0.12); bs.add(bk); } }
  // cavaletes: calendário e quadro dos estados
  const easel = (x, ry) => { const g = new THREE.Group(); g.position.set(x, 0, 0.2); g.rotation.y = ry; S.add(g); const m = std('#6a4a2a'); for (const s of [-1, 1]) { const l = box(0.05, 2.3, 0.05, m); l.position.set(s * 0.5, 1.1, 0); l.rotation.z = s * 0.08; g.add(l); } const bl = box(0.05, 2.2, 0.05, m); bl.position.set(0, 1.05, -0.4); bl.rotation.x = -0.2; g.add(bl); const ledge = box(1.3, 0.05, 0.12, m); ledge.position.set(0, 0.78, 0.05); g.add(ledge); return g; };
  const calE = easel(1.6, -0.35);
  const cal = makeCalendar({}); cal.mesh.position.set(0, 1.55, 0.06); calE.add(cal.mesh);
  const sticker = mesh(new THREE.PlaneGeometry(0.16, 0.16), new THREE.MeshBasicMaterial({ map: T2.turkeyIcon, transparent: true })); calE.add(sticker);
  const brdE = easel(-1.6, 0.35);
  const brdCv = document.createElement('canvas'); brdCv.width = 768; brdCv.height = 960; const brdTex = new THREE.CanvasTexture(brdCv); brdTex.colorSpace = THREE.SRGBColorSpace;
  const board = mesh(new THREE.PlaneGeometry(1.2, 1.5), new THREE.MeshStandardMaterial({ map: brdTex, roughness: 0.9 })); board.position.set(0, 1.55, 0.06); brdE.add(board);
  const order = Array.from({ length: 48 }, (_, i) => i).sort(() => rr() - 0.5);
  let brdKey = '';
  const drawBoard = (n) => { const k = n.toFixed(2); if (k === brdKey) return; brdKey = k; const c = brdCv.getContext('2d'); c.fillStyle = '#f2ecd8'; c.fillRect(0, 0, 768, 960); c.fillStyle = '#1c2f6e'; c.fillRect(0, 0, 768, 150); c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '900 70px Inter'; c.fillText('48 STATES', 384, 78);
    for (let i = 0; i < 48; i++) { const col = i % 6, row = Math.floor(i / 6); const x = 40 + col * 116, y = 185 + row * 82; const rank = order.indexOf(i); const on = rank < Math.floor(n); const flip = rank === Math.floor(n) ? n % 1 : (on ? 1 : 0); c.fillStyle = on ? '#e67e22' : (flip > 0 ? '#e6a060' : '#9aa0a8'); c.fillRect(x, y + (1 - (on ? 1 : 1 - flip * 0.6)) * 30, 100, 66 * (on ? 1 : 1 - flip * 0.6)); if (on) { c.fillStyle = '#fff'; c.font = 'bold 26px Inter'; c.fillText('23', x + 50, y + 34); } }
    c.fillStyle = '#e67e22'; c.fillRect(70, 860, 50, 50); c.fillStyle = '#9aa0a8'; c.fillRect(420, 860, 50, 50); c.fillStyle = '#222'; c.font = 'bold 40px Inter'; c.textAlign = 'left'; c.fillText('NOV 23', 135, 887); c.fillText('NOV 30', 485, 887); brdTex.needsUpdate = true; };
  drawBoard(0);
  const fdr = makeChar({ body: '#2a3446', lapels: '#232c3c', tie: '#7a1a2a', glasses: true, hairCap: true, hair: '#8a8a8a', buttons: false, legLen: 0.95 });
  S.add(fdr.root);
  const pointer = new THREE.Group(); const pt = mesh(new THREE.CylinderGeometry(0.01, 0.015, 0.9, 6), std('#3a2a1a')); pt.position.y = 0.45; pointer.add(pt); fdr.arms[1].hand.add(pointer); pointer.visible = false;
  calE.updateMatrixWorld(true);
  Object.assign(O, { fdr, cal, calE, sticker, brdE, drawBoard, pointer, chairP });
}

// =====================================================================
// LOJA DE BRINQUEDOS (vazia)
// =====================================================================
const ST = {};
{
  const S = newScene('store'), U = updaters.store;
  S.background = new THREE.Color('#201a14'); S.fog = new THREE.Fog('#201a14', 12, 28);
  S.add(new THREE.HemisphereLight('#fff6e6', '#5a4030', 1.3));
  { const fill = new THREE.DirectionalLight('#fff3e0', 0.9); fill.position.set(1, 4, 7); S.add(fill); }
  const floor = mesh(new THREE.PlaneGeometry(12, 12), stdT(repTex(TEX.planks, 5, 5), '#b8946a', { roughness: 0.5 })); floor.rotation.x = -Math.PI / 2; S.add(floor);
  const wallM = stdT(repTex(T2.wallpaper, 5, 2), '#f0e0d0');
  const back = mesh(new THREE.PlaneGeometry(12, 4.2), wallM); back.position.set(0, 2.1, -2.4); S.add(back);
  for (const s of [-1, 1]) { const w = mesh(new THREE.PlaneGeometry(12, 4.2), wallM); w.rotation.y = -s * Math.PI / 2; w.position.set(s * 4.2, 2.1, 0); S.add(w); }
  const ceil = mesh(new THREE.PlaneGeometry(12, 12), std('#e8dcc8')); ceil.rotation.x = Math.PI / 2; ceil.position.y = 4.2; S.add(ceil);
  const shelfM = stdT(repTex(TEX.planks, 1.5, 0.3), '#8a5a30', { roughness: 0.6 });
  const toyMakers = [() => teddy(), () => toyTrain(), () => drum(), () => gift('#c0392b'), () => gift('#27ae60'), () => teddy('#c8a070'), () => gift('#2e86c1'), () => drum()];
  for (const [x0, z0, ry, wlen] of [[0, -2.2, 0, 7.6], [-4.0, 0, Math.PI / 2, 4], [4.0, 0, -Math.PI / 2, 4]]) {
    const sh = new THREE.Group(); sh.position.set(x0, 0, z0); sh.rotation.y = ry; S.add(sh);
    const bk = box(wlen, 2.8, 0.06, shelfM); bk.position.set(0, 1.4, -0.2); sh.add(bk);
    for (let k = 0; k < 4; k++) { const b = box(wlen, 0.05, 0.42, shelfM); b.position.y = 0.4 + k * 0.7; sh.add(b); for (let i = 0; i < Math.floor(wlen / 0.45); i++) { const toy = toyMakers[(((i + k * 3 + Math.floor(x0)) % toyMakers.length) + toyMakers.length) % toyMakers.length](); toy.position.set(-wlen / 2 + 0.3 + i * 0.45, 0.43 + k * 0.7, 0); toy.rotation.y = (rr() - 0.5) * 0.6; sh.add(toy); } }
  }
  const banner = mesh(new THREE.PlaneGeometry(3.6, 0.7), std('#ffffff', { map: textTex(1024, 200, '#b22234', [['CHRISTMAS SALE!', 120, '#fff4d0', 104]], { border: '#e0c060', bw: 10 }) })); banner.position.set(0, 3.45, -2.15); S.add(banner);
  // guirlanda
  const gpts = []; for (let i = 0; i <= 30; i++) { const k = i / 30; gpts.push(new THREE.Vector3(-3.8 + k * 7.6, 3.95 - Math.abs(Math.sin(k * Math.PI * 3)) * 0.35, -2.3)); }
  const gar = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(gpts), 80, 0.06, 6), toon('#2f6a2a')); S.add(gar);
  for (let i = 0; i < 14; i++) { const o = mesh(new THREE.SphereGeometry(0.06, 10, 8), std(['#c0392b', '#f1c40f', '#2e86c1'][i % 3], { metalness: 0.6, roughness: 0.2 })); o.position.copy(gpts[i * 2 + 1]).add(new THREE.Vector3(0, -0.08, 0.05)); S.add(o); }
  const counter = new THREE.Group(); S.add(counter);
  const ct = box(2.6, 0.08, 0.8, stdT(repTex(TEX.planks, 1, 0.3), '#a06a3a', { roughness: 0.4 })); ct.position.y = 1.02; counter.add(ct);
  const cb = box(2.5, 1.0, 0.7, stdT(repTex(TEX.planks, 1.2, 0.5), '#7a4a24')); cb.position.y = 0.5; counter.add(cb);
  const glassC = mesh(new THREE.PlaneGeometry(2.0, 0.6), new THREE.MeshStandardMaterial({ color: '#d8e8f0', transparent: true, opacity: 0.25, roughness: 0.05 })); glassC.position.set(0, 0.6, 0.36); counter.add(glassC);
  const reg = new THREE.Group(); reg.position.set(0.75, 1.06, 0); counter.add(reg);
  const brass = std('#c9a227', { metalness: 0.85, roughness: 0.3 });
  const rbx = box(0.5, 0.3, 0.4, brass, 0.04); rbx.position.y = 0.15; reg.add(rbx); const rtop = box(0.4, 0.22, 0.12, brass, 0.03); rtop.position.set(0, 0.4, -0.12); reg.add(rtop);
  for (let i = 0; i < 12; i++) { const k = mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.03, 8), std('#f4ecd8')); k.position.set(-0.15 + (i % 4) * 0.1, 0.32, 0.05 + Math.floor(i / 4) * 0.07 - 0.07); k.rotation.x = -0.4; reg.add(k); }
  const sale = mesh(new THREE.PlaneGeometry(0.36, 0.16), std('#ffffff', { map: textTex(256, 112, '#fff', [['$0.00', 70, '#1a1a1a', 58]]) })); sale.position.set(0, 0.42, -0.055); reg.add(sale);
  const clock = new THREE.Group(); clock.position.set(-2.4, 3.1, -2.36); S.add(clock); const cf = mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.06, 28), std('#f4efe2')); cf.rotation.x = Math.PI / 2; clock.add(cf); const cr = mesh(new THREE.TorusGeometry(0.3, 0.03, 8, 28), std('#3a2a1a')); clock.add(cr); const hh = box(0.02, 0.16, 0.01, L.BLACK); hh.position.set(0, 0.07, 0.04); clock.add(hh); const mh = box(0.015, 0.24, 0.01, L.BLACK); mh.position.set(0, 0.11, 0.045); clock.add(mh);
  const hang = []; for (const x of [-1.5, 1.5]) { const l = L.lantern(); l.position.set(x, 3.6, 0); l.scale.setScalar(1.2); S.add(l); hang.push(l); const pl = new THREE.PointLight('#ffcf80', 4, 7, 1.8); pl.position.set(x, 3.4, 0); S.add(pl); }
  const keeper = makeChar({ body: '#e8e4da', vest: '#3a4a3a', bowtie: '#a01a1a', mustache: true, buttons: false, belt: '#2a2a2a' });
  S.add(keeper.root);
  // tumbleweed
  const tw = new THREE.Group(); const twm = new THREE.MeshStandardMaterial({ color: '#a8885a', wireframe: true }); for (let i = 0; i < 3; i++) { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28 - i * 0.05, 1), twm); s.rotation.set(i, i * 2, 0); tw.add(s); } S.add(tw);
  Object.assign(ST, { keeper, tw, mh });
}

// =====================================================================
// RUA: protesto
// =====================================================================
const SR = {};
{
  const S = newScene('street'), U = updaters.street;
  S.add(L.skyDome('#5a8ac8', '#e6e0d0', [0.3, 0.35, 0.8])); S.fog = new THREE.Fog('#d8d4c8', 25, 90);
  S.add(new THREE.HemisphereLight('#cfe0f8', '#6a5a4a', 1.0));
  const sun = F.sunLight(S, [10, 16, 14], 3.0, '#ffe8c8', 9); sunFollow.street = sun;
  const road = mesh(new THREE.PlaneGeometry(8, 120), std('#3a3a3c', { roughness: 0.95 })); road.rotation.x = -Math.PI / 2; road.position.z = -20; S.add(road);
  for (let z = -70; z < 20; z += 4) { const ln = mesh(new THREE.PlaneGeometry(0.15, 2), std('#e8d8a0')); ln.rotation.x = -Math.PI / 2; ln.position.set(0, 0.005, z); S.add(ln); }
  for (const s of [-1, 1]) { const sw = mesh(new THREE.BoxGeometry(3, 0.18, 120), stdT(repTex(TEX.stone, 2, 60), '#c8c4bc')); sw.position.set(s * 5.5, 0.09, -20); S.add(sw); const curb = box(0.15, 0.2, 120, std('#9a9690')); curb.position.set(s * 4.0, 0.1, -20); S.add(curb); }
  const shops = [['TOYS', '#7a1a1a'], ['GROCERY', '#1c3a2a'], ['BARBER', '#1c2a5a'], ['DINER', '#5a2a1a'], ['HARDWARE', '#3a3a2a'], ['BAKERY', '#5a3a1a'], null, ['DRUGS', '#1c3a3a']];
  for (const s of [-1, 1]) for (let i = 0; i < 8; i++) { const w = 4.6, h = 6 + ((i * 7 + (s > 0 ? 3 : 0)) % 4) * 1.6; const b = brickBuilding(w, h, 5, i * 13 + (s > 0 ? 100 : 0), shops[(i + (s > 0 ? 3 : 0)) % 8]); b.position.set(s * 9.5, 0.18, 6 - i * 5); b.rotation.y = -s * Math.PI / 2; S.add(b); }
  const hall = brickBuilding(14, 11, 5, 999, null); hall.position.set(0, 0, -62); S.add(hall);
  for (let i = 0; i < 6; i++) { const col = mesh(new THREE.CylinderGeometry(0.35, 0.4, 5, 16), std('#e8e4dc')); col.position.set(-5 + i * 2, 2.5, -59.2); S.add(col); }
  for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { const l = streetLamp(); l.position.set(s * 4.4, 0.18, 4 - i * 9); S.add(l); }
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const tr = L.tree(200 + i + (s > 0 ? 10 : 0), true); tr.position.set(s * 5.2, 0.18, 1 - i * 12); tr.scale.setScalar(0.9); S.add(tr); }
  const c1 = car('#2f4a3a'); c1.position.set(3.0, 0, -3); S.add(c1); const c2 = car('#5a1a1a'); c2.position.set(-3.0, 0, -12); c2.rotation.y = Math.PI; S.add(c2); const c3 = car('#1a1a2a'); c3.position.set(3.0, 0, -17); S.add(c3);
  const lv = F.leaves(40, [0, 0, 1], [9, 5, 10], 41); S.add(lv); U.push(lv.userData.update);
  for (let i = 0; i < 25; i++) { const lf = mesh(new THREE.CircleGeometry(0.07, 5), std(['#d2691e', '#e8a33a', '#b5401f'][i % 3], { side: THREE.DoubleSide })); lf.rotation.x = -Math.PI / 2; lf.rotation.z = rr() * 6; lf.position.set((rr() - 0.5) * 8, 0.01 + rr() * 0.002, (rr() - 0.5) * 12 - 2); S.add(lf); }
  const protesters = [];
  const signs = [['KEEP', 'THANKSGIVING!'], ['NOV 30', 'OR BUST'], ['NO TO', 'FRANKSGIVING'], ['HANDS OFF', 'MY TURKEY'], ['WHICH', 'THURSDAY?!']];
  const hats = ['fedora', 'cap', 'fedora', 'bonnet', 'fedora', 'cap', null, 'fedora'];
  const cols = ['#5a4a3a', '#2a3a5a', '#6a2a2a', '#3a5a3a', '#4a4a4a', '#7a5a2a', '#5a3a5a', '#2a4a4a'];
  for (let i = 0; i < 8; i++) { const c = makeChar({ body: cols[i], hat: hats[i], hatColor: ['#4a4038', '#3a3a3a', '#5a4a3a'][i % 3], lapels: i % 2 ? null : '#222', tie: i % 3 === 0 ? '#8a1c1c' : null, mustache: i % 3 === 1, hairCap: !hats[i], hair: '#3a2a1a', buttons: i % 2 === 1, legLen: 0.88 + (i % 3) * 0.06 }); S.add(c.root); if (i < 5) { const sg = sign(signs[i]); sg.position.set(0, -0.45, 0.05); c.arms[1].hand.add(sg); c.sign = sg; } protesters.push(c); }
  const newsboy = makeChar({ body: '#8a6a4a', hat: 'cap', hatColor: '#5a5a5a', buttonColor: '#fff' }); newsboy.root.scale.setScalar(0.78); S.add(newsboy.root);
  const paper = mesh(new THREE.PlaneGeometry(0.35, 0.45), std('#ffffff', { map: T2.newspaper, side: THREE.DoubleSide })); paper.position.set(0, 0.15, 0.08); newsboy.arms[1].hand.add(paper);
  const bag = mesh(new THREE.BoxGeometry(0.3, 0.3, 0.12), std('#c8b890')); bag.position.set(-0.3, -0.25, 0.1); newsboy.torsoInner.add(bag);
  Object.assign(SR, { protesters, newsboy });
}

// =====================================================================
// CAMPO DE FUTEBOL AMERICANO
// =====================================================================
const FD = {};
{
  const S = newScene('field'), U = updaters.field;
  S.add(L.skyDome('#6a9ad8', '#eae4d0', [0.4, 0.3, 0.8])); S.fog = new THREE.Fog('#dcd8c8', 30, 110);
  S.add(new THREE.HemisphereLight('#d0e4ff', '#5a6a3a', 1.0));
  const sun = F.sunLight(S, [8, 14, 12], 3.0, '#ffe8c8', 9); sunFollow.field = sun;
  const grassT = TEX.grass ? null : null; void grassT;
  const field = mesh(new THREE.PlaneGeometry(60, 120), std('#4a8a34', { roughness: 1 })); field.rotation.x = -Math.PI / 2; S.add(field);
  for (let i = -12; i <= 12; i++) { const stripe = mesh(new THREE.PlaneGeometry(60, 2.5), std(i % 2 ? '#4f9238' : '#45802f', { roughness: 1 })); stripe.rotation.x = -Math.PI / 2; stripe.position.set(0, 0.002, i * 5); S.add(stripe); const ln = mesh(new THREE.PlaneGeometry(30, 0.12), std('#f4f4ee')); ln.rotation.x = -Math.PI / 2; ln.position.set(0, 0.004, i * 5 + 2.5); S.add(ln); }
  const gp = new THREE.Group(); gp.position.set(0, 0, -12); S.add(gp); const ym = std('#e8c020', { roughness: 0.5 }); for (const s of [-1, 1]) { const p = mesh(new THREE.CylinderGeometry(0.08, 0.08, 6, 10), ym); p.position.set(s * 2.8, 3, 0); gp.add(p); } const cbar = mesh(new THREE.CylinderGeometry(0.08, 0.08, 5.6, 10), ym); cbar.rotation.z = Math.PI / 2; cbar.position.y = 3; gp.add(cbar);
  const sb = new THREE.Group(); sb.position.set(-6, 0, -22); S.add(sb); for (const s of [-1, 1]) { const p = box(0.3, 5, 0.3, std('#3a3a3a')); p.position.set(s * 2.5, 2.5, 0); sb.add(p); }
  const sbb = mesh(new THREE.BoxGeometry(6, 3, 0.4), [std('#1a1a1a'), std('#1a1a1a'), std('#1a1a1a'), std('#1a1a1a'), std('#ffffff', { map: textTex(768, 384, '#141414', [['HOME   VISITOR', 52, '#f4ecd8', 70], ['GAME MOVED', 120, '#ffcf40', 200], ['TO NOV 23 ?!', 70, '#ff6040', 310]], { border: '#c9a227', bw: 10 }), emissive: '#ffffff', emissiveIntensity: 0.15 }), std('#1a1a1a')]); sbb.position.y = 6; sb.add(sbb);
  const bl = new THREE.Group(); bl.position.set(12, 0, -4); bl.rotation.y = -Math.PI / 2; S.add(bl); for (let k = 0; k < 7; k++) { const st = box(40, 0.45, 0.8, stdT(repTex(TEX.planks, 10, 0.3), '#9a8a7a')); st.position.set(0, 0.25 + k * 0.45, -k * 0.8); bl.add(st); }
  for (let i = 0; i < 8; i++) { const fan = makeChar({ body: ['#c0392b', '#2e86c1', '#f1c40f', '#27ae60'][i % 4], hat: i % 2 ? 'fedora' : 'cap', legLen: 0.85 }); fan.root.position.set(-14 + i * 3.6, 0.5 + (i % 3) * 0.45, -(i % 3) * 0.8); bl.add(fan.root); fan.isFan = true; }
  const player = makeChar({ body: '#a01a1a', hat: 'leather', buttons: false, legLen: 0.95 }); S.add(player.root);
  const num = mesh(new THREE.PlaneGeometry(0.3, 0.3), new THREE.MeshBasicMaterial({ map: textTex(128, 128, '#a01a1a', [['7', 110, '#ffffff', 68]]), transparent: false })); num.position.set(0, 0.0, 0.3); player.torsoInner.add(num);
  const ball = football(); S.add(ball);
  const coach = makeChar({ body: '#3a3a4a', hat: 'cap', hatColor: '#a01a1a', mustache: true, buttonColor: '#fff', legLen: 0.9 }); S.add(coach.root);
  Object.assign(FD, { player, ball, coach, bl });
}

// =====================================================================
// JORNAL GIRANDO (inserção)
// =====================================================================
const NP = {};
{
  const S = newScene('paper');
  const bgTex = canvasTex(512, 512, (c, w, h) => { const g = c.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, 360); g.addColorStop(0, '#6a5a40'); g.addColorStop(1, '#0a0806'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
  S.background = bgTex;
  S.add(new THREE.AmbientLight('#ffffff', 1.0)); const key = new THREE.DirectionalLight('#fff4e0', 1.6); key.position.set(1, 2, 4); S.add(key);
  const np = mesh(new THREE.PlaneGeometry(1.2, 1.6, 8, 8), new THREE.MeshStandardMaterial({ map: T2.newspaper, roughness: 0.9, side: THREE.DoubleSide }));
  { const p = np.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 3) * 0.02); np.geometry.computeVertexNormals(); }
  S.add(np); NP.np = np;
}

// =====================================================================
// CONGRESSO
// =====================================================================
const CG = {};
{
  const S = newScene('chamber'), U = updaters.chamber;
  S.background = new THREE.Color('#1a1814'); S.fog = new THREE.Fog('#1a1814', 14, 34);
  S.add(new THREE.HemisphereLight('#f6f0e6', '#4a3a2a', 1.1));
  { const fill = new THREE.DirectionalLight('#fff6ea', 0.9); fill.position.set(2, 5, 8); S.add(fill); }
  const marble = stdT(repTex(T2.marble, 4, 2), '#ffffff', { roughness: 0.3 });
  const floor = mesh(new THREE.PlaneGeometry(20, 20), stdT(repTex(T2.marble, 6, 6), '#d8d0c0', { roughness: 0.25 })); floor.rotation.x = -Math.PI / 2; S.add(floor);
  const carpet = mesh(new THREE.PlaneGeometry(16, 8), std('#3a5a8a', { roughness: 1 })); carpet.rotation.x = -Math.PI / 2; carpet.position.set(0, 0.005, 3); S.add(carpet);
  const back = mesh(new THREE.PlaneGeometry(20, 8), marble); back.position.set(0, 4, -4); S.add(back);
  for (let i = 0; i < 6; i++) { const x = -6.25 + i * 2.5; if (Math.abs(x) < 2) continue; const col = mesh(new THREE.CylinderGeometry(0.35, 0.4, 7, 20), marble); col.position.set(x, 3.5, -3.5); S.add(col); const cap = box(1.0, 0.3, 1.0, marble); cap.position.set(x, 7.1, -3.5); S.add(cap); }
  const flagBig = mesh(new THREE.PlaneGeometry(3.4, 1.8), std('#ffffff', { map: T2.flag, roughness: 0.9 })); flagBig.position.set(0, 4.6, -3.95); S.add(flagBig);
  const drape = mesh(new THREE.PlaneGeometry(5, 0.6), std('#8a1c1c')); drape.position.set(0, 5.8, -3.9); S.add(drape);
  const wood = stdT(repTex(TEX.planks, 1.5, 0.5), '#5a3418', { roughness: 0.4 });
  const ros = box(4, 1.2, 1.2, wood); ros.position.set(0, 0.6, -2.4); S.add(ros);
  const ros2 = box(2.4, 0.9, 0.9, wood); ros2.position.set(0, 1.65, -2.9); S.add(ros2);
  const plat = box(3, 1.2, 1.2, wood); plat.position.set(0, 0.6, -3.4); S.add(plat);
  const seal = mesh(new THREE.CircleGeometry(0.4, 28), std('#c9a227', { metalness: 0.8, roughness: 0.3 })); seal.position.set(0, 0.7, -1.79); S.add(seal);
  const speaker = makeChar({ body: '#2a2a32', lapels: '#1e1e26', bowtie: '#1a1a1a', glasses: true, hairCap: true, hair: '#e0e0e0', mustache: true, hairColor: '#e0e0e0', buttons: false });
  S.add(speaker.root);
  const gavel = new THREE.Group(); const gh = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8), std('#4a2a1a')); gh.position.y = 0.1; gavel.add(gh); const gt = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.18, 12), std('#5a3418', { roughness: 0.4 })); gt.rotation.z = Math.PI / 2; gt.position.y = 0.25; gavel.add(gt); gavel.rotation.x = 1.5; speaker.arms[1].hand.add(gavel);
  const block = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 14), std('#5a3418')); block.position.set(0.35, 2.12, -2.7); S.add(block);
  const members = [];
  for (let i = 0; i < 10; i++) { const m = makeChar({ body: ['#2a2a32', '#3a3a2a', '#2a3242', '#4a3a2a'][i % 4], lapels: '#1a1a1a', tie: ['#8a1c1c', '#1c3a8a', '#2a5a2a'][i % 3], hairCap: true, hair: ['#3a2a1a', '#8a8a8a', '#d0d0d0'][i % 3], glasses: i % 4 === 1, mustache: i % 3 === 0, buttons: false }); S.add(m.root); members.push(m); }
  for (let r = 0; r < 2; r++) { const bench = box(9, 0.9, 0.5, wood); bench.position.set(0, 0.45, 0.6 + r * 1.6 + 0.45); S.add(bench); }
  Object.assign(CG, { speaker, members, gavel });
}

// =====================================================================
// CARIMBO NO CALENDÁRIO (inserção)
// =====================================================================
const IN = {};
{
  const S = newScene('stamp');
  S.background = new THREE.Color('#1a1410');
  S.add(new THREE.HemisphereLight('#fff6ea', '#4a3020', 1.0));
  const key = new THREE.SpotLight('#fff0d8', 30, 8, 0.7, 0.5, 1.2); key.position.set(0.8, 3, 1.2); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 4; S.add(key);
  const desk = mesh(new THREE.PlaneGeometry(6, 6), stdT(repTex(TEX.planks, 2, 2), '#7a4a24', { roughness: 0.4 })); desk.rotation.x = -Math.PI / 2; S.add(desk);
  const cal = makeCalendar({ title: 'NOVEMBER', year: 'EVERY YEAR', start: 6 }); cal.mesh.rotation.x = -Math.PI / 2; cal.mesh.position.y = 0.005; S.add(cal.mesh);
  const stamp = new THREE.Group(); const sh = mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.3, 14), std('#5a3418', { roughness: 0.4 })); sh.position.y = 0.3; stamp.add(sh); const knob = mesh(new THREE.SphereGeometry(0.09, 14, 10), std('#5a3418')); knob.position.y = 0.48; stamp.add(knob); const bs = box(0.6, 0.08, 0.2, std('#3a2a1a')); bs.position.y = 0.12; stamp.add(bs); const pad = box(0.58, 0.04, 0.18, std('#a01015')); pad.position.y = 0.06; stamp.add(pad); S.add(stamp);
  const pen = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 8), std('#1a1a1a', { roughness: 0.2 })); pen.rotation.set(Math.PI / 2, 0, 0.7); pen.position.set(0.75, 0.015, 0.3); S.add(pen);
  const cup = mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.22, 18), std('#f2efe6', { roughness: 0.3 })); cup.position.set(-0.8, 0.11, -0.5); S.add(cup);
  Object.assign(IN, { cal, stamp });
}
Object.values(scenes).forEach(S => { S.environment = R.envTex; S.environmentIntensity = 0.4; });

// =====================================================================
// PLANOS E ANIMAÇÃO
// =====================================================================
const shots = [];
const shot = (scene, a, b, cam, update) => shots.push({ scene, a, b, cam, update });
const sitP = (over = {}) => P({ legL: { hip: -1.5, knee: 1.5, out: 0.06 }, legR: { hip: -1.5, knee: 1.5, out: 0.06 }, ...over });
const fam = () => [H.grandpa, H.dad, H.mom, H.boy, H.girl];
function homeReset(t, { momSeated = true, dadSits = false } = {}) {
  place(H.grandpa, -0.85, 0.05, -0.95, 0); H.grandpa.apply(sitP({ armL: { out: 0.2, fwd: 0.9, elbow: -1.0 }, armR: { out: 0.2, fwd: 0.9, elbow: -1.0 } }), t);
  if (dadSits) { place(H.dad, 0, 0.05, -0.95, 0); H.dad.apply(sitP(), t); } else { place(H.dad, 0, 0, -0.85, 0); }
  if (momSeated) { place(H.mom, 0.85, 0.08, -0.95, 0); H.mom.apply(sitP({ armL: { out: 0.2, fwd: 0.9, elbow: -1.0 }, armR: { out: 0.2, fwd: 0.9, elbow: -1.0 } }), t); }
  place(H.boy, -1.7, 0.2, 0, Math.PI / 2); H.boy.apply(sitP({ armL: { out: 0.3, fwd: 1.0, elbow: -0.8 }, armR: { out: 0.3, fwd: 1.0, elbow: -0.8 } }), t);
  place(H.girl, 1.7, 0.2, 0, -Math.PI / 2); H.girl.apply(sitP({ armL: { out: 0.3, fwd: 1.0, elbow: -0.8 }, armR: { out: 0.3, fwd: 1.0, elbow: -0.8 } }), t);
}
function resetAll(t) {
  L.charList.forEach(c => { c.noBlink = false; c.sweat = false; c.look = [0, 0]; c.root.visible = true; c.idleAmt = 1; c.setExpr('neutral'); if (!c.isFan) c.apply(L.REST, t); c.torsoInner.scale.set(1, 1, 1); });
  homeReset(t); H.t2.visible = false; H.knife.visible = true; H.fork.visible = true; H.glasses.forEach(g => g.visible = false);
  H.wallCal.draw({ circles: [{ d: 30, col: '#d22' }], icons: [{ d: 30 }] });
  O.pointer.visible = false; O.sticker.visible = false; O.cal.draw({}); O.drawBoard(0); place(O.fdr, 0, 0.05, -0.75, 0);
  place(ST.keeper, 0, 0, -0.65, 0); ST.tw.visible = false;
  FD.ball.visible = true;
}
const look = (ch, l) => { ch.look = l; };

// ---- 0. família no jantar, pai trinchando o peru ----
shot('home', 0, 2.75, { from: [[0.45, 1.75, 2.7], [0, 1.35, -0.45]], to: [[0.25, 1.7, 2.15], [0, 1.4, -0.45]], fov: 42 }, (t) => {
  const carve = Math.sin(t * 7);
  H.dad.apply(P({ armR: { out: 0.15, fwd: 1.1 + carve * 0.18, elbow: -0.9 - carve * 0.15 }, armL: { out: 0.1, fwd: 1.1, elbow: -1.0 }, lean: 0.25, headX: 0.35 }), t);
  H.dad.setExpr('smug'); look(H.dad, [0, 0.8]);
  fam().forEach(c => { if (c !== H.dad) { c.setExpr('happy'); look(c, [0, 0.4]); } });
});
// ---- 1. mãe chega com o SEGUNDO peru ----
const tTwo = 4.15;
const momPath = [[3.0, -1.55], [1.15, -1.45]];
shot('home', 2.75, LS(1), { from: [[1.0, 2.05, 4.3], [0.45, 1.3, -0.5]], to: [[0.8, 2.0, 3.7], [0.45, 1.3, -0.5]], fov: 46 }, (t) => {
  homeReset(t, { momSeated: false });
  const m = H.mom; const w = pathAt(momPath, t, 2.3, 1.5);
  place(m, w.x, 0, w.z, w.done ? kf(t, [[2.3 + w.T, w.dir], [2.3 + w.T + 0.3, -0.15]]) : w.dir);
  const putDown = sstep((t - tTwo) / 0.4);
  const carry = P({ armL: { out: 0.1, fwd: 1.25, elbow: -0.75 }, armR: { out: 0.1, fwd: 1.25, elbow: -0.75 } });
  m.apply(walkPose(mixPose(carry, P({ armL: { out: 0.1, fwd: 1.0, elbow: -0.3 }, armR: { out: 0.1, fwd: 1.0, elbow: -0.3 }, lean: 0.25 }), putDown), w.phase, w.amt, 0.4), t);
  exprKeys(m, t, [[-1, 'smug'], [tTwo + 0.4, 'happy']]);
  H.t2.visible = true;
  const hands = handPos(m, 0).add(handPos(m, 1)).multiplyScalar(0.5);
  const tablePos = new THREE.Vector3(0.7, 0.875, 0.1);
  if (t < tTwo) H.t2.position.copy(hands).add(new THREE.Vector3(0, 0.02, 0)); else H.t2.position.lerpVectors(hands, tablePos, putDown);
  H.t2.rotation.y = 0.4;
  const carve = Math.sin(t * 7) * (t < tTwo ? 1 : 0);
  H.dad.apply(P({ armR: { out: 0.15, fwd: 1.1 + carve * 0.18, elbow: -0.9 }, armL: { out: 0.1, fwd: 1.1, elbow: -1.0 }, lean: t < tTwo ? 0.25 : 0.0, headX: t < tTwo ? 0.35 : 0.0, headY: t < tTwo ? 0 : -0.5 }), t);
  fam().forEach(c => { if (c === H.mom) return; exprKeys(c, t, [[-1, c === H.dad ? 'smug' : 'happy'], [tTwo + 0.1 + (c === H.dad ? 0 : 0.08), 'shock']]); look(c, t > tTwo ? [0.8, 0.2] : [0, 0.4]); });
});
// ---- 2. calendário: cinco quintas-feiras ----
const calWorld = (d, off = 0.9) => { O.calE.updateMatrixWorld(true); const p = O.calE.localToWorld(O.cal.local(d).add(new THREE.Vector3(0, 1.55, 0.06))); const n = new THREE.Vector3(0, 0, 1).applyQuaternion(O.calE.quaternion); return { p, cam: p.clone().add(n.multiplyScalar(off)) }; };
const calC = calWorld(15, 1.95), calC2 = calWorld(16, 1.62);
const tFive = wordT(1, 'five');
shot('office', LS(1), 8.35, { from: [[calC.cam.x, calC.cam.y + 0.08, calC.cam.z], [calC.p.x, calC.p.y + 0.08, calC.p.z]], to: [[calC2.cam.x, calC2.cam.y, calC2.cam.z], [calC2.p.x, calC2.p.y, calC2.p.z]], fov: 46 }, (t) => {
  O.cal.draw({ thuBold: t > tFive, circles: [2, 9, 16, 23, 30].map((d, i) => ({ d, col: '#1c6ad0', k: clamp((t - tFive - i * 0.22) / 0.2) })) });
});
// ---- 3. o último dia do mês ----
const c30 = calWorld(30, 0.75), c30b = calWorld(30, 0.6);
const tLast = wordT(1, 'last');
shot('office', 8.35, LS(2), { from: [[calC2.cam.x, calC2.cam.y, calC2.cam.z], [calC2.p.x, calC2.p.y, calC2.p.z]], to: [[c30b.cam.x, c30b.cam.y, c30b.cam.z], [c30b.p.x, c30b.p.y, c30b.p.z]], fov: 46 }, (t) => {
  const k = clamp((t - tLast) / 0.3);
  O.cal.draw({ thuBold: true, circles: [2, 9, 16, 23].map(d => ({ d, col: '#1c6ad0' })).concat([{ d: 30, col: '#d22', k }]), icons: k > 0.6 ? [{ d: 30, s: 0.6 + 0.4 * easeOutB(k) }] : [] });
});
function easeOutB(k) { return 1 + Math.sin(k * Math.PI) * 0.3; }
// ---- 4. lojista em pânico ----
shot('store', LS(2), 13.9, { from: [[0.35, 1.9, 2.7], [0, 1.65, -0.6]], to: [[0.2, 1.88, 2.15], [0, 1.68, -0.6]], fov: 42 }, (t) => {
  const k = ST.keeper; const sh = Math.sin(t * 14) * 0.18;
  k.apply(kf(t, [[11.1, P({ armL: { out: 0.3, fwd: 0.8, elbow: -1.2 }, armR: { out: 0.3, fwd: 0.8, elbow: -1.2 } })], [11.9, P({ armL: { out: 0.55, fwd: 2.55, elbow: -2.3 }, armR: { out: 0.55, fwd: 2.55, elbow: -2.3 }, lean: -0.08, headY: sh })], [13.9, P({ armL: { out: 0.55, fwd: 2.55, elbow: -2.3 }, armR: { out: 0.55, fwd: 2.55, elbow: -2.3 }, lean: -0.08, headY: sh })]]), t);
  exprKeys(k, t, [[-1, 'worried'], [11.85, 'shock']]); k.sweat = true;
});
// ---- 5. loja vazia, passa uma tumbleweed ----
shot('store', 13.9, LS(3), { from: [[2.3, 1.75, 4.6], [-0.3, 1.25, -0.8]], to: [[1.9, 1.7, 3.9], [-0.3, 1.25, -0.8]], fov: 46 }, (t) => {
  const k = ST.keeper; k.apply(P({ armL: { out: -0.1, fwd: 1.5, elbow: -1.9 }, armR: { out: -0.1, fwd: 1.5, elbow: -1.9 }, lean: 0.4, headX: 0.25, headZ: 0.15 }), t);
  k.setExpr('worried'); look(k, [0.3, 0.3]);
  const u = clamp((t - 14.0) / 2.6); ST.tw.visible = u > 0 && u < 1; ST.tw.position.set(lerp(-4.5, 4.5, u), 0.28 + Math.abs(Math.sin(u * 14)) * 0.22, 1.4); ST.tw.rotation.z = -u * 18;
  ST.mh.rotation.z = -t * 0.5;
});
// ---- 6. Roosevelt muda a data ----
const tMoved = wordT(3, 'moved');
shot('office', LS(3), LS(4), { from: [[0.0, 1.75, 4.7], [1.05, 1.45, 0.2]], to: [[0.2, 1.72, 4.1], [1.1, 1.5, 0.2]], fov: 44 }, (t) => {
  const f = O.fdr; place(f, 0.7, 0, 0.75, 0.55);
  f.apply(kf(t, [[LS(3), P({ armR: { out: 0.2, fwd: 0.2, elbow: -0.3 }, armL: { out: 0.25, fwd: 0.1 } })], [tMoved - 0.35, P({ armR: { out: 0.9, fwd: 1.4, elbow: -0.5 }, armL: { out: 0.25, fwd: 0.1 }, twist: 0.3, headY: 0.5 })], [tMoved + 0.6, P({ armR: { out: 0.95, fwd: 1.45, elbow: -0.45 }, armL: { out: 0.25, fwd: 0.1 }, twist: 0.3, headY: 0.5 })], [tMoved + 1.2, P({ armR: { out: 0.4, fwd: 0.9, elbow: -1.8, twist: 0.4 }, armL: { out: 0.25, fwd: 0.1 }, headY: 0.1 })]]), t);
  exprKeys(f, t, [[-1, 'smug'], [tMoved + 1.0, 'wink']]); look(f, t < tMoved + 0.9 ? [0.8, -0.2] : [0, 0]);
  const k = sstep((t - tMoved) / 0.6);
  O.cal.draw({ thuBold: true, circles: [{ d: 30, col: '#bbb' }, { d: 23, col: '#1c9a3a', k: clamp((t - tMoved - 0.5) / 0.3) }] });
  O.sticker.visible = true; const a = O.cal.local(30).add(new THREE.Vector3(0.05, 1.6, 0.075)), b = O.cal.local(23).add(new THREE.Vector3(0.05, 1.6, 0.075));
  O.sticker.position.lerpVectors(a, b, k); O.sticker.position.z += Math.sin(k * Math.PI) * 0.08; O.sticker.scale.setScalar(1 + Math.sin(k * Math.PI) * 0.4); O.sticker.rotation.z = Math.sin(k * Math.PI) * 0.4;
});
// ---- 7. a rua protesta ----
shot('street', LS(4), 23.5, { from: [[0.6, 1.85, 7.0], [0, 1.85, 0]], to: [[0.35, 1.8, 5.6], [0, 1.85, 0]], fov: 46 }, (t) => {
  SR.protesters.forEach((c, i) => {
    const x = -2.6 + (i % 4) * 1.7 + (i >= 4 ? 0.85 : 0), z = i >= 4 ? -1.4 : 0.2; place(c, x, 0, z, angTo(x, z, 0.4, 7) + Math.sin(t * 2 + i) * 0.1);
    const wave = Math.sin(t * 5 + i * 1.3);
    c.apply(P({ armR: c.sign ? { out: 0.25, fwd: 2.6 + wave * 0.18, elbow: -0.3 } : { out: 0.4, fwd: 2.3 + wave * 0.4, elbow: -0.5 }, armL: { out: 0.3, fwd: c.sign ? 0.4 : 2.4 - wave * 0.4, elbow: -0.6 }, bob: Math.abs(wave) * 0.05, lean: -0.05, legL: { hip: 0, knee: Math.abs(wave) * 0.2 }, legR: { hip: 0, knee: Math.abs(wave) * 0.2 } }), t);
    c.setExpr(i % 3 === 2 ? 'shock' : 'angry');
  });
  const n = SR.newsboy; place(n, -1.2, 0, 2.6, 0.3); const sh = Math.sin(t * 6);
  n.apply(P({ armR: { out: 0.3, fwd: 2.3 + sh * 0.2, elbow: -0.4 }, armL: { out: 0.3, fwd: 0.4, elbow: -0.5 }, bob: Math.abs(sh) * 0.04, headX: -0.15 }), t); n.setExpr('laugh');
});
// ---- 8. jogo de futebol adiado ----
const tGames = wordT(4, 'football');
shot('field', 23.5, 25.6, { from: [[1.6, 1.5, 4.2], [-1.2, 2.5, -6]], to: [[1.4, 1.5, 3.7], [-1.3, 2.6, -6]], fov: 50 }, (t) => {
  const p = FD.player; place(p, 0, 0, 0, 0.35);
  p.apply(kf(t, [[23.5, P({ armR: { out: 0.25, fwd: 1.0, elbow: -1.2 }, armL: { out: 0.2 } })], [24.2, P({ armR: { out: 0.25, fwd: 1.0, elbow: -1.2 }, armL: { out: -0.1, fwd: 2.4, elbow: -2.2 }, headY: -0.6, headX: -0.2 })]]), t);
  exprKeys(p, t, [[-1, 'neutral'], [24.15, 'question']]); look(p, [-0.6, -0.4]);
  const drop = clamp((t - 25.0) / 0.35);
  if (drop <= 0) FD.ball.position.copy(handPos(p, 1)).add(new THREE.Vector3(0.02, 0.05, 0.08)); else { const s = handPos(p, 1).add(new THREE.Vector3(0.02, 0.05, 0.08)); FD.ball.position.set(s.x, lerp(s.y, 0.07, drop * drop) + (drop >= 1 ? Math.abs(Math.sin((t - 25.35) * 12)) * 0.15 * Math.exp(-(t - 25.35) * 5) : 0), s.z + drop * 0.2); }
  FD.ball.rotation.set(0.3 + drop * 3, 0.6, 0.2);
  const c = FD.coach; place(c, 1.4, 0, -0.6, -0.6); c.apply(P({ armR: { out: 0.3, fwd: 1.6, elbow: -0.1 }, armL: { out: 0.4, fwd: 0.5, elbow: -1.4 }, headY: 0.3 }), t); c.setExpr('angry'); void tGames;
  FD.bl.children.forEach((ch) => {});
  L.charList.filter(ch => ch.isFan).forEach((fan, i) => { fan.apply(P({ armL: { out: 0.3, fwd: 0.6 + Math.sin(t * 3 + i) * 0.3, elbow: -1 }, headY: Math.sin(t + i) * 0.3 }), t); fan.setExpr(i % 2 ? 'question' : 'worried'); });
});
// ---- 9. jornal girando: FRANKSGIVING! ----
shot('paper', 25.6, LS(5), { from: [[0, 0, 3.4], [0, 0, 0]], to: [[0, 0, 3.05], [0, 0, 0]], fov: 45, shake: 0.3 }, (t) => {
  const k = clamp((t - 25.6) / 0.85); const e = 1 - Math.pow(1 - k, 3);
  NP.np.rotation.set(0, 0, (1 - e) * Math.PI * 6 - 0.05); NP.np.scale.setScalar(Math.max(0.01, e) * (1 + spring(t - 26.45, 20, 7) * 0.05)); NP.np.position.z = (1 - e) * -2;
});
// ---- 10. metade dos estados segue o presidente ----
const brd = () => { O.brdE.updateMatrixWorld(true); const p = O.brdE.localToWorld(new THREE.Vector3(0, 1.55, 0.06)); const n = new THREE.Vector3(0, 0, 1).applyQuaternion(O.brdE.quaternion); return { p, n }; };
const B0 = brd();
shot('office', LS(5), 30.3, { from: [[B0.p.x + B0.n.x * 3.4 + 0.6, B0.p.y + 0.05, B0.p.z + B0.n.z * 3.4], [B0.p.x - 0.35, B0.p.y - 0.1, B0.p.z]], to: [[B0.p.x + B0.n.x * 3.0 + 0.55, B0.p.y + 0.05, B0.p.z + B0.n.z * 3.0], [B0.p.x - 0.35, B0.p.y - 0.1, B0.p.z]], fov: 46 }, (t) => {
  O.drawBoard(clamp((t - 27.9) / 1.7) * 24);
  const f = O.fdr; place(f, -2.55, 0, 0.45, 1.25); O.pointer.visible = true;
  f.apply(P({ armR: { out: 0.15, fwd: 1.55 + Math.sin(t * 3) * 0.08, elbow: -0.2, twist: 0 }, armL: { out: 0.2, fwd: 0.1 }, headY: -0.9, lean: -0.05 }), t);
  f.setExpr('smug'); look(f, [-0.8, -0.2]);
});
// ---- 11. família come peru duas vezes ----
const tTwice = wordT(5, 'turkey');
shot('home', 30.3, LS(6), { from: [[0.75, 2.1, 2.5], [0.3, 1.5, -0.95]], to: [[0.6, 2.05, 2.1], [0.3, 1.55, -0.95]], fov: 44 }, (t) => {
  homeReset(t, { momSeated: false, dadSits: true });
  H.wallCal.draw({ circles: [{ d: 23, col: '#1c9a3a' }, { d: 30, col: '#d22' }], icons: [{ d: 23 }, { d: 30 }] });
  const d = H.dad; H.knife.visible = false; H.fork.visible = false;
  d.apply(sitP({ armL: { out: 0.15, fwd: 0.55, elbow: -1.2 }, armR: { out: 0.15, fwd: 0.55, elbow: -1.2 }, lean: -0.2, headX: -0.1 }), t);
  const puff = 1.2 + Math.sin(t * 2) * 0.02 + sstep((t - tTwice) / 0.4) * 0.12; d.torsoInner.scale.set(puff, 1, puff);
  exprKeys(d, t, [[-1, 'bliss'], [tTwice + 0.1, 'worried']]); d.sweat = t > tTwice;
  const m = H.mom; const w = pathAt([[3.0, -1.6], [1.0, -1.5]], t, 30.6, 1.4);
  place(m, w.x, 0, w.z, w.done ? kf(t, [[30.6 + w.T, w.dir], [30.6 + w.T + 0.3, -0.2]]) : w.dir);
  m.apply(walkPose(P({ armL: { out: 0.1, fwd: 1.25, elbow: -0.75 }, armR: { out: 0.1, fwd: 1.25, elbow: -0.75 } }), w.phase, w.amt, 0.4), t); m.setExpr('happy');
  H.t2.visible = true; H.t2.position.copy(handPos(m, 0).add(handPos(m, 1)).multiplyScalar(0.5)).add(new THREE.Vector3(0, 0.02, 0)); H.t2.rotation.y = 0.4;
  look(d, t > tTwice ? [0.8, 0.2] : [0, 0]);
  [H.grandpa, H.boy, H.girl].forEach(c => { c.setExpr('bliss'); c.torsoInner.scale.set(1.12, 1, 1.12); });
});
// ---- 12. o Congresso resolve ----
const tSettled = wordT(6, 'settled');
const bang = (t) => [tSettled - 0.05, tSettled + 0.32].reduce((a, h) => a + spring(t - h, 30, 9), 0);
shot('chamber', LS(6), 36.4, { from: [[1.2, 3.2, 3.9], [0, 2.35, -2.6]], to: [[0.9, 3.1, 3.2], [0, 2.4, -2.6]], fov: 44, kick: (t) => bang(t) }, (t) => {
  const s = CG.speaker; place(s, 0, 1.2, -2.9, 0);
  const strokes = [tSettled - 0.05, tSettled + 0.32];
  let up = 0; strokes.forEach(h => { const dt = t - h; if (dt > -0.3 && dt < 0) up = Math.max(up, 1 + dt / 0.3 * -0); if (dt > -0.3 && dt <= 0) up = Math.max(up, sstep((dt + 0.3) / 0.15) * (dt < -0.05 ? 1 : 1)); });
  const near = strokes.map(h => t - h).find(dt => dt > -0.35 && dt < 0.15);
  const raise = near === undefined ? 0 : (near < -0.08 ? sstep((near + 0.35) / 0.2) : clamp(1 - (near + 0.08) / 0.1));
  s.apply(P({ armR: { out: 0.35, fwd: 0.9 + raise * 1.2, elbow: -0.7 - raise * 0.6 }, armL: { out: 0.3, fwd: 0.8, elbow: -1.2 }, lean: 0.12 - raise * 0.1 }), t);
  exprKeys(s, t, [[-1, 'smug'], [tSettled - 0.05, 'angry'], [36.0, 'smug']]); look(s, [0, 0.4]);
  CG.members.forEach((m, i) => { const row = Math.floor(i / 5), k = i % 5; place(m, -3 + k * 1.5 + (row ? 0.75 : 0), 0.1, 0.6 + row * 1.6 - 0.1, Math.PI + (k - 2) * 0.05); m.root.rotation.y = 0 + Math.PI * 0; m.root.rotation.y = Math.PI; m.root.rotation.y = Math.atan2(0 - m.root.position.x, -2.6 - m.root.position.z); const cheer = t > tSettled + 0.4 ? Math.abs(Math.sin(t * 6 + i)) : 0; m.apply(sitP({ armL: { out: 0.4, fwd: 0.8 + cheer * 1.6, elbow: -0.8 }, armR: { out: 0.4, fwd: 0.8 + cheer * 1.6, elbow: -0.8 } }), t); m.setExpr(t > tSettled + 0.4 ? 'happy' : 'neutral'); });
});
// ---- 13. carimbos: 4ª quinta-feira, para sempre ----
const tFourth = wordT(6, 'fourth'), tForever = wordT(6, 'forever');
const stampAt = (t, t0) => { const dt = t - t0; if (dt < -0.35 || dt > 0.45) return -1; return dt < 0 ? 1 - sstep((dt + 0.35) / 0.35) : sstep(dt / 0.35); };
shot('stamp', 36.4, LS(7), { from: [[0.15, 2.05, 0.75], [0, 0, -0.02]], to: [[0.1, 1.75, 0.6], [0, 0, 0]], fov: 46, kick: (t) => spring(t - tFourth, 30, 9) + spring(t - tForever, 30, 9) }, (t) => {
  IN.cal.draw({ thuBold: true, thuCol: clamp((t - 36.5) / 0.4), circles: [{ d: 24, col: '#1c9a3a', k: clamp((t - tFourth) / 0.25) }], stamps: [{ txt: '4TH THURSDAY', y: 470, rot: -0.12, k: t >= tFourth ? 1 : 0 }, { txt: 'FOREVER', y: 760, rot: 0.08, k: t >= tForever ? 1 : 0 }] });
  const s1 = stampAt(t, tFourth), s2 = stampAt(t, tForever);
  const st = IN.stamp;
  if (s1 >= 0 && t < tFourth + 0.5) { st.visible = true; st.position.set(0.0, s1 * 0.9, -0.08); st.rotation.set(0, -0.12, 0); }
  else if (s2 >= 0) { st.visible = true; st.position.set(0.0, s2 * 0.9, 0.19); st.rotation.set(0, 0.08, 0); }
  else st.visible = false;
});
// ---- 14. feliz Thanksgiving (os dois) ----
shot('home', LS(7), timing.duration + 1, { from: [[0.3, 1.8, 2.5], [0, 1.4, -0.4]], to: [[1.1, 2.5, 4.8], [0, 1.25, -0.4]], fov: 44 }, (t) => {
  homeReset(t, { dadSits: false });
  H.knife.visible = false; H.fork.visible = false; H.t2.visible = true; H.t2.position.set(0.62, 0.875, 0.25); H.t2.rotation.y = 0.4;
  H.glasses.forEach(g => g.visible = true);
  [H.dad, H.mom, H.grandpa].forEach((c, i) => { const up = sstep((t - LS(7) - 0.2 - i * 0.1) / 0.5); const base = c === H.dad ? P() : sitP(); c.apply(mixPose(mixPose(base, P({ armR: { out: 0.2, fwd: 0.9, elbow: -1.2 } }, base), 1), P({ armR: { out: 0.3, fwd: 2.4 + Math.sin(t * 4 + i) * 0.1, elbow: -0.6 }, armL: { out: 0.3, fwd: 0.8, elbow: -1.0 } }, base), up), t); c.setExpr('laugh'); });
  [H.boy, H.girl].forEach((c, i) => { const j = Math.abs(Math.sin(t * 6 + i)); c.apply(sitP({ armL: { out: 0.5, fwd: 2.4, elbow: -0.4 }, armR: { out: 0.5, fwd: 2.4, elbow: -0.4 }, bob: j * 0.05 }), t); c.setExpr('happy'); });
});

const captions = F.makeCaptions(lines, R.octx);
const renderAt = F.makeRenderer({ R, scenes, updaters, shots, resetAll, captions, sunFollow });
await document.fonts.load('900 84px Inter');
window.renderAt = renderAt; window.DURATION = timing.duration; window.FPS = 30;
window.frameData = (q = 0.92) => R.out.toDataURL('image/jpeg', q);
window.READY = true;
const qt = new URLSearchParams(location.search).get('t');
if (qt !== null) renderAt(parseFloat(qt));
else { const t0 = performance.now(); const loop = () => { renderAt(((performance.now() - t0) / 1000) % timing.duration); requestAnimationFrame(loop); }; loop(); }
