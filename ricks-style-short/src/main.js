import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import * as L from './lib.js';
const { mesh, box, std, toon, makeChar, loaf, TEX, rng } = L;

const W = 1080, H = 1920, FPS = 30;
const timing = await (await fetch('./build/timing.json')).json();
const lines = timing.lines;
L.buildTextures();

// ---------- renderer ----------
const glCanvas = document.createElement('canvas'); glCanvas.id = 'gl'; document.body.appendChild(glCanvas);
const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const camera = new THREE.PerspectiveCamera(40, W / H, 0.05, 900);
const composer = new EffectComposer(renderer);
const pmrem = new THREE.PMREMGenerator(renderer); const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
const renderPass = new RenderPass(new THREE.Scene(), camera); composer.addPass(renderPass);
const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.3, 0.45, 1.25); composer.addPass(bloom);
composer.addPass(new OutputPass());

const out = document.getElementById('out'); out.width = W; out.height = H;
const octx = out.getContext('2d');

// ---------- utilidades ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
const v3 = (a) => new THREE.Vector3(...a);
const wordT = (li, w) => { const ws = lines[li].words; const f = ws.find(x => x.w.toLowerCase().replace(/[^a-z0-9']/g, '').startsWith(w)); return f ? f.t : lines[li].start; };
function idle(ch, t, amp = 1) {
  const s = Math.sin(t * 2.4 + ch.blinkSeed);
  ch.torso.scale.y = 1 + s * 0.012 * amp; ch.rig.position.y = 0;
  ch.head.rotation.z = Math.sin(t * 1.3 + ch.blinkSeed) * 0.04 * amp;
  ch.head.rotation.x = Math.sin(t * 1.7 + ch.blinkSeed * 2) * 0.03 * amp;
}
function arm(ch, i, out, fwd, elbow = -0.2, twist = 0) { const a = ch.arms[i]; const s = i === 0 ? -1 : 1; a.sh.rotation.set(-fwd, twist, s * out); a.elbow.rotation.x = elbow; }
function face(ch, target) { const p = ch.root.position; ch.root.rotation.y = Math.atan2(target[0] - p.x, target[2] - p.z); }
function place(ch, x, y, z, ry = 0) { ch.root.position.set(x, y, z); ch.root.rotation.y = ry; }
function sunLight(scene, pos, intensity = 3, color = '#fff2dd', size = 14) {
  const d = new THREE.DirectionalLight(color, intensity); d.position.set(...pos); d.castShadow = true;
  d.shadow.mapSize.set(2048, 2048); const c = d.shadow.camera; c.left = c.bottom = -size; c.right = c.top = size; c.near = 0.5; c.far = 120; d.shadow.bias = -0.0004; d.shadow.normalBias = 0.02;
  scene.add(d); scene.add(d.target); return d;
}
function flame(scale = 1) {
  const g = new THREE.Group();
  const m1 = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff7a1a').multiplyScalar(3), transparent: true, opacity: 0.9 });
  const m2 = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffe08a').multiplyScalar(4), transparent: true, opacity: 0.95 });
  const prof = (r, h) => { const pts = []; for (let i = 0; i <= 12; i++) { const y = i / 12; pts.push(new THREE.Vector2(r * Math.sin(Math.PI * Math.pow(1 - y, 1.6)) * Math.pow(1 - y, 0.3) + 0.001, y * h)); } return new THREE.LatheGeometry(pts, 14); };
  const a = mesh(prof(0.17, 0.6), m1, { cast: false, recv: false }); g.add(a);
  const b = mesh(prof(0.09, 0.36), m2, { cast: false, recv: false }); b.position.z = 0.03; g.add(b);
  g.scale.setScalar(scale); g.userData.parts = [a, b]; return g;
}
function flicker(f, t, k = 0) { const s = 1 + Math.sin(t * 17 + k) * 0.12 + Math.sin(t * 29 + k * 3) * 0.08; f.scale.y = f.userData.base * s; f.rotation.z = Math.sin(t * 11 + k) * 0.08; }

const scenes = {};

// =====================================================================
// PADARIA
// =====================================================================
{
  const S = new THREE.Scene(); scenes.bakery = S;
  S.background = new THREE.Color('#2a1c12'); S.fog = new THREE.Fog('#2a1c12', 10, 26);
  S.add(new THREE.HemisphereLight('#fff1dc', '#6a4a30', 1.5));
  { const fill = new THREE.DirectionalLight('#fff6ea', 1.2); fill.position.set(1, 3, 8); S.add(fill); }
  const floor = mesh(new THREE.PlaneGeometry(14, 14), std('#ffffff', { map: TEX.planks.clone() })); floor.material.map.repeat.set(4, 4); floor.rotation.x = -Math.PI / 2; S.add(floor);
  const wallM = std('#ffffff', { map: TEX.plaster.clone() }); wallM.map.repeat.set(3, 1.5);
  const back = mesh(new THREE.PlaneGeometry(14, 5), wallM); back.position.set(0, 2.5, -4.5); S.add(back);
  const left = mesh(new THREE.PlaneGeometry(14, 5), wallM); left.rotation.y = Math.PI / 2; left.position.set(-5.5, 2.5, 0); S.add(left);
  const right = mesh(new THREE.PlaneGeometry(14, 5), wallM); right.rotation.y = -Math.PI / 2; right.position.set(5.5, 2.5, 0); S.add(right);
  const ceil = mesh(new THREE.PlaneGeometry(14, 14), std('#3a2414', { map: TEX.planks })); ceil.rotation.x = Math.PI / 2; ceil.position.y = 5; S.add(ceil);
  const beamM = std('#3a2513', { map: TEX.planks });
  for (let i = -2; i <= 2; i++) { const b = box(0.3, 0.35, 14, beamM); b.position.set(i * 2.6, 4.8, 0); S.add(b); }
  for (const x of [-5.3, 5.3]) for (const z of [-4.3, -1, 2.3]) { const p = box(0.3, 5, 0.3, beamM); p.position.set(x, 2.5, z); S.add(p); }
  for (const x of [-3, 0, 3]) { const p = box(0.3, 5, 0.3, beamM); p.position.set(x, 2.5, -4.35); S.add(p); }
  // forno de tijolos
  const oven = new THREE.Group(); oven.position.set(-2.6, 0, -3.0); S.add(oven);
  const brickM = std('#ffffff', { map: TEX.brick.clone() }); brickM.map.repeat.set(3, 2);
  const baseO = box(3.4, 1.0, 2.6, brickM); baseO.position.y = 0.5; oven.add(baseO);
  const dome = mesh(new THREE.SphereGeometry(1.6, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), brickM); dome.position.y = 1.0; dome.scale.z = 0.8; oven.add(dome);
  const mouth = mesh(new THREE.CircleGeometry(0.62, 24, 0, Math.PI), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff6a1a').multiplyScalar(0.55) })); mouth.position.set(0, 1.0, 1.29); oven.add(mouth);
  const arch = mesh(new THREE.TorusGeometry(0.7, 0.1, 8, 24, Math.PI), std('#7a3a24', { map: TEX.brick })); arch.position.set(0, 1.0, 1.3); oven.add(arch);
  const chim = box(0.6, 2.6, 0.6, brickM); chim.position.set(0, 3.6, -0.4); oven.add(chim);
  // interior do forno visível pela boca
  const ovenFloor = mesh(new THREE.PlaneGeometry(1.1, 1.0), std('#2a1408', { emissive: '#ff5a10', emissiveIntensity: 0.25 })); ovenFloor.rotation.x = -Math.PI / 2; ovenFloor.position.set(0, 1.01, 1.55); oven.add(ovenFloor);
  const fires = [];
  for (let i = 0; i < 9; i++) { const f = flame(0.38 + ((i * 7) % 3) * 0.12); f.position.set(-0.44 + i * 0.11, 1.0, 1.31 + (i % 2) * 0.02); f.userData.base = f.scale.y; oven.add(f); fires.push(f); }
  const ovenLight = new THREE.PointLight('#ff8a2a', 7, 7, 1.6); ovenLight.position.set(0, 1.9, 2.4); oven.add(ovenLight);
  const ovenLoaves = [];
  for (let i = 0; i < 3; i++) { const l = loaf(0.85); l.position.set(-0.3 + i * 0.3, 1.1, 1.5); oven.add(l); ovenLoaves.push(l); }
  // prateleiras com pães
  const shelf = new THREE.Group(); shelf.position.set(2.4, 0, -4.2); S.add(shelf);
  for (let k = 0; k < 3; k++) { const b = box(3.2, 0.08, 0.6, beamM); b.position.y = 1.0 + k * 0.85; shelf.add(b); for (let i = 0; i < 6; i++) { const l = loaf(0.75 + L.R() * 0.2); l.position.set(-1.3 + i * 0.52, 1.13 + k * 0.85, 0.05); l.rotation.y = (L.R() - .5) * .5; shelf.add(l); } }
  for (const x of [-1.6, 1.6]) { const p = box(0.1, 3, 0.6, beamM); p.position.set(x, 1.5, 0); shelf.add(p); }
  // balcão
  const counter = new THREE.Group(); counter.position.set(0.8, 0, 0.9); S.add(counter);
  const ct = box(3.2, 0.12, 1.0, std('#8a5a30', { map: TEX.planks }), 0.03); ct.position.y = 1.06; counter.add(ct);
  const cb = box(3.0, 1.0, 0.85, std('#c08a5a', { map: TEX.planks })); cb.position.y = 0.5; counter.add(cb);
  // sacos de farinha e barris
  const sackM = toon('#d8c9a3');
  for (let i = 0; i < 3; i++) { const s = L.withOutline(box(0.7, 0.9, 0.5, sackM, 0.2), 0.015); s.position.set(-4.6 + i * 0.6, 0.45, 1.5 + (i % 2) * 0.4); s.rotation.y = i * 0.4; S.add(s); }
  for (let i = 0; i < 2; i++) { const b = mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.0, 16), std('#7a4a22', { map: TEX.planks })); b.position.set(4.6, 0.5, -2.6 + i * 1.0); S.add(b); }
  // janela com luz do dia
  const win = mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff4d8').multiplyScalar(2.2) })); win.rotation.y = -Math.PI / 2; win.position.set(5.48, 2.6, 0.5); S.add(win);
  const wf = new THREE.Group(); wf.position.copy(win.position); wf.rotation.y = -Math.PI / 2; S.add(wf);
  [[0, 0.8, 1.8, 0.1], [0, -0.8, 1.8, 0.1], [0.8, 0, 0.1, 1.7], [-0.8, 0, 0.1, 1.7], [0, 0, 0.08, 1.6], [0, 0, 1.6, 0.08]].forEach(([x, y, w, h]) => { const b = box(w, h, 0.12, beamM); b.position.set(x, y, 0.02); wf.add(b); });
  const sun = new THREE.SpotLight('#fff0d0', 120, 20, 0.5, 0.6, 1.2); sun.position.set(9, 5, 0.5); sun.target.position.set(0, 0, 0.8); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0005; S.add(sun); S.add(sun.target);
  const lamps = [];
  for (const p of [[-1, 3.9, 0.5], [2.5, 3.9, -1.5]]) { const l = L.lantern(); l.position.set(...p); S.add(l); const pl = new THREE.PointLight('#ffb050', 6, 8, 1.8); pl.position.set(p[0], p[1] - 0.1, p[2]); S.add(pl); const ch = mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.9), L.BLACK); ch.position.set(p[0], p[1] + 0.65, p[2]); S.add(ch); lamps.push(l); }
  // personagens
  const baker = makeChar({ body: '#8a5a3a', apron: true, hat: 'toque', mustache: true, expr: 'smug', buttons: false, belt: '#5a3a1e' });
  place(baker, 0.8, 0, 0); S.add(baker.root);
  const heldLoaf = loaf(1); heldLoaf.rotation.z = 0.3; heldLoaf.position.set(0, -0.05, 0.12); baker.arms[1].hand.add(heldLoaf);
  const customer = makeChar({ body: '#3f7a5a', hat: 'bonnet', expr: 'happy', buttons: true, buttonColor: '#f2efe6', legLen: 0.85 });
  place(customer, -0.3, 0, 2.3, Math.PI * 0.9); S.add(customer.root);
  const counterLoaves = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const l = loaf(0.8); l.position.set(-0.95 + c * 0.45, 1.2, -0.32 + r * 0.32); counter.add(l); counterLoaves.push(l); }
  const loaf13 = loaf(0.85); counter.add(loaf13);
  S.userData = { baker, customer, fires, ovenLoaves, counterLoaves, loaf13, counter, heldLoaf, oven, ovenLight };
  S.userData.update = (t) => {
    fires.forEach((f, i) => flicker(f, t, i));
    ovenLight.intensity = 7 + Math.sin(t * 13) * 1.2 + Math.sin(t * 31) * 0.8;
    lamps.forEach((l, i) => { l.rotation.z = Math.sin(t * 1.2 + i) * 0.04; });
  };
}

// =====================================================================
// SALA DO TRONO
// =====================================================================
{
  const S = new THREE.Scene(); scenes.throne = S;
  S.background = new THREE.Color('#1a1418'); S.fog = new THREE.Fog('#1a1418', 14, 40);
  S.add(new THREE.HemisphereLight('#d8d0ff', '#4a3020', 1.0));
  { const fill = new THREE.DirectionalLight('#ffeedd', 0.9); fill.position.set(2, 4, 8); S.add(fill); }
  const stoneM = std('#ffffff', { map: TEX.stone.clone() }); stoneM.map.repeat.set(5, 2);
  const flM = std('#ffffff', { map: TEX.stone.clone() }); flM.map.repeat.set(8, 10);
  const floor = mesh(new THREE.PlaneGeometry(16, 24), flM); floor.rotation.x = -Math.PI / 2; S.add(floor);
  const back = mesh(new THREE.PlaneGeometry(16, 9), stoneM); back.position.set(0, 4.5, -6); S.add(back);
  for (const s of [-1, 1]) { const w = mesh(new THREE.PlaneGeometry(24, 9), stoneM); w.rotation.y = -s * Math.PI / 2; w.position.set(s * 8, 4.5, 2); S.add(w); }
  const carpet = mesh(new THREE.PlaneGeometry(2.2, 20), std('#8a1018', { roughness: 1 })); carpet.rotation.x = -Math.PI / 2; carpet.position.set(0, 0.01, 4); S.add(carpet);
  for (const s of [-1, 1]) { const tr = mesh(new THREE.PlaneGeometry(0.15, 20), std('#d4a017', { metalness: .6, roughness: .4 })); tr.rotation.x = -Math.PI / 2; tr.position.set(s * 1.05, 0.015, 4); S.add(tr); }
  // plataforma + trono
  const plat = box(6, 0.5, 3, stoneM); plat.position.set(0, 0.25, -4.3); S.add(plat);
  const step = box(4, 0.25, 0.8, stoneM); step.position.set(0, 0.125, -2.5); S.add(step);
  const gold = std('#e0b030', { metalness: 1, roughness: 0.3 });
  const red = std('#9a1020', { roughness: .9 });
  const throne = new THREE.Group(); throne.position.set(0, 0.5, -4.4); S.add(throne);
  const seat = box(1.6, 0.25, 1.2, red, 0.06); seat.position.y = 0.75; throne.add(seat);
  const backT = box(1.7, 2.8, 0.25, gold, 0.06); backT.position.set(0, 1.9, -0.55); throne.add(backT);
  const backR = box(1.3, 2.3, 0.1, red, 0.04); backR.position.set(0, 1.8, -0.4); throne.add(backR);
  for (const s of [-1, 1]) { const a = box(0.25, 0.9, 1.2, gold, 0.05); a.position.set(s * 0.85, 0.85, 0); throne.add(a); const b = mesh(new THREE.SphereGeometry(0.16, 16, 12), gold); b.position.set(s * 0.85, 3.4, -0.55); throne.add(b); }
  const legT = box(1.6, 0.65, 1.1, gold); legT.position.y = 0.32; throne.add(legT);
  // pilares, estandartes, tochas
  const torches = [];
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
    const z = -3 + i * 4.5;
    const p = mesh(new THREE.CylinderGeometry(0.45, 0.5, 9, 16), stoneM); p.position.set(s * 5, 4.5, z); S.add(p);
    const ban = mesh(new THREE.PlaneGeometry(1.4, 2.8), std('#ffffff', { map: TEX.banner, side: THREE.DoubleSide })); ban.position.set(s * 4.45, 4.6, z); ban.rotation.y = -s * Math.PI / 2; S.add(ban);
    const f = flame(1.2); f.position.set(s * 4.35, 2.9, z + 0.9); f.userData.base = f.scale.y; S.add(f); torches.push(f);
    const hold = mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.5), std('#333', { metalness: .8 })); hold.position.set(s * 4.35, 2.7, z + 0.9); S.add(hold);
    const pl = new THREE.PointLight('#ff9a3a', 9, 9, 1.6); pl.position.set(s * 4.2, 3.3, z + 0.9); S.add(pl);
  }
  const bigBan = mesh(new THREE.PlaneGeometry(2.6, 4.6), std('#ffffff', { map: TEX.banner })); bigBan.position.set(0, 5.6, -5.95); S.add(bigBan);
  // janelas altas com raios de luz
  for (const s of [-1, 1]) { const w = mesh(new THREE.PlaneGeometry(1.2, 3), new THREE.MeshBasicMaterial({ color: new THREE.Color('#bcd8ff').multiplyScalar(2) })); w.position.set(s * 3.2, 5.8, -5.98); S.add(w); }
  const spot = new THREE.SpotLight('#dfe8ff', 70, 30, 0.35, 0.7, 1.2); spot.position.set(0, 12, 4); spot.target.position.set(0, 1.5, -4); spot.castShadow = true; spot.shadow.mapSize.set(2048, 2048); spot.shadow.bias = -0.0005; S.add(spot); S.add(spot.target);
  // rei e guardas
  const king = makeChar({ body: '#a0182a', hat: 'crown', beard: true, hairColor: '#d8d2c4', collar: '#f6f3ea', ermine: true, expr: 'smug', buttonColor: '#e0b030', belt: '#e0b030' });
  place(king, 0, 0.5 + 0.62, -4.25); S.add(king.root);
  const sc = L.scroll(); sc.scale.setScalar(0.7); sc.rotation.set(-0.15, Math.PI, 0); king.arms[1].hand.add(sc); sc.position.set(-0.15, 0.25, 0.25);
  const guards = [];
  for (const s of [-1, 1]) { const g = makeChar({ body: '#4a5058', hat: 'helmet', expr: 'neutral', belt: '#3a2a1a', mustache: s > 0 }); place(g, s * 2.2, 0.5, -3.6); S.add(g.root); const spear = new THREE.Group(); const sh = mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.6), std('#6b3f1d')); spear.add(sh); const tip = mesh(new THREE.ConeGeometry(0.07, 0.25, 6), std('#ccc', { metalness: 1, roughness: .3 })); tip.position.y = 1.4; spear.add(tip); spear.position.set(0, 0.6, 0.04); g.arms[s > 0 ? 1 : 0].hand.add(spear); guards.push(g); }
  S.userData = { king, sc, guards };
  S.userData.update = (t) => { torches.forEach((f, i) => flicker(f, t, i)); };
}

// =====================================================================
// CIDADE (rua com barraca + praça com pelourinho)
// =====================================================================
{
  const S = new THREE.Scene(); scenes.town = S;
  S.add(L.skyDome('#3f86e0', '#d8ecff'));
  S.fog = new THREE.Fog('#cfe3f7', 35, 140);
  S.add(new THREE.HemisphereLight('#bcdcff', '#6a5a3a', 1.1));
  const sun = sunLight(S, [18, 26, 14], 3.4, '#fff1d6', 22);
  const ground = mesh(new THREE.PlaneGeometry(120, 120), std('#ffffff', { map: TEX.cobble.clone() })); ground.material.map.repeat.set(40, 40); ground.rotation.x = -Math.PI / 2; S.add(ground);
  const r = rng(7);
  const bases = ['#efe2c6', '#e8d2b0', '#f2e8d8', '#e6c9a8', '#dcd0bc', '#f0d8c0'];
  // casas ao redor
  const houseSpots = [];
  for (let i = 0; i < 7; i++) houseSpots.push([-15 + i * 5.2, -9, 0]);
  for (let i = 0; i < 5; i++) houseSpots.push([-17, -4 + i * 5.2, Math.PI / 2]);
  for (let i = 0; i < 6; i++) houseSpots.push([20, -4 + i * 5.2, -Math.PI / 2]);
  for (let i = 0; i < 7; i++) houseSpots.push([-15 + i * 5.2, 26, Math.PI]);
  houseSpots.forEach(([x, z, ry], i) => { const h = L.house(4.6, 3.5 + r() * 2.5, 4, bases[i % bases.length], 100 + i); h.position.set(x, 0, z); h.rotation.y = ry; S.add(h); });
  for (let i = 0; i < 6; i++) { const tr = L.tree(50 + i); tr.position.set(-12 + r() * 28, 0, -6 + r() * 3); if (Math.abs(tr.position.x) < 3) tr.position.x += 6; S.add(tr); }
  for (let i = 0; i < 9; i++) { const c = L.cloud(300 + i); c.position.set(-80 + i * 22, 45 + r() * 20, -120 - r() * 60); c.scale.setScalar(2 + r() * 2); S.add(c); }
  for (let i = 0; i < 4; i++) { const c = L.cloud(400 + i); c.position.set(-60 + i * 40, 50 + r() * 10, 120); c.scale.setScalar(3); S.add(c); }
  // poço
  const well = new THREE.Group(); well.position.set(6, 0, 4); S.add(well);
  const wb = mesh(new THREE.CylinderGeometry(1, 1, 0.9, 20, 1, true), std('#ffffff', { map: TEX.stone, side: THREE.DoubleSide })); wb.position.y = 0.45; well.add(wb);
  for (const s of [-1, 1]) { const p = box(0.15, 2, 0.15, std('#5a3a1e')); p.position.set(s * 0.9, 1.4, 0); well.add(p); }
  const wr = mesh(new THREE.ConeGeometry(1.4, 0.8, 4), std('#7a2e1e')); wr.position.y = 2.7; wr.rotation.y = Math.PI / 4; well.add(wr);
  // barraca do padeiro
  const stall = new THREE.Group(); stall.position.set(0, 0, 0); S.add(stall);
  const wood = std('#8a5a30', { map: TEX.planks });
  const table = box(2.6, 0.12, 1.1, wood, 0.03); table.position.y = 1.0; stall.add(table);
  const tb = box(2.5, 0.9, 1.0, std('#6a4224', { map: TEX.planks })); tb.position.y = 0.48; stall.add(tb);
  for (const x of [-1.25, 1.25]) for (const z of [-0.5]) { const p = box(0.1, 2.6, 0.1, wood); p.position.set(x, 1.3, z - 0.5); stall.add(p); }
  for (const x of [-1.25, 1.25]) { const p = box(0.1, 2.3, 0.1, wood); p.position.set(x, 1.15, 0.55); stall.add(p); }
  const aw = mesh(new THREE.PlaneGeometry(2.9, 1.8), std('#ffffff', { map: TEX.awning, side: THREE.DoubleSide })); aw.material.map.repeat.set(3, 1); aw.position.set(0, 2.45, 0); aw.rotation.x = -Math.PI / 2 + 0.25; stall.add(aw);
  const sign = mesh(new THREE.PlaneGeometry(1.4, 0.7), std('#ffffff', { map: TEX.sign })); sign.position.set(0, 0.55, 0.52); sign.scale.setScalar(0.9); stall.add(sign);
  const stallLoaves = [];
  for (let i = 0; i < 5; i++) { const l = loaf(0.85); l.position.set(-1.0 + i * 0.22, 1.15, -0.25 + (i % 2) * 0.15); l.rotation.y = r(); stall.add(l); stallLoaves.push(l); }
  const basket = mesh(new THREE.CylinderGeometry(0.35, 0.28, 0.25, 16, 1, true), std('#a07a3a', { side: THREE.DoubleSide })); basket.position.set(-0.85, 1.19, 0.2); stall.add(basket);
  for (let i = 0; i < 3; i++) { const l = loaf(0.6); l.position.set(-0.95 + i * 0.12, 1.32, 0.2); l.rotation.z = 0.5; stall.add(l); }
  const scale = L.balanceScale(); scale.g.position.set(0.55, 1.06, 0.1); stall.add(scale.g);
  const pl = loaf(0.75); pl.position.y = -0.36; scale.pans[0].add(pl);
  const wt = mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.12, 12), std('#555', { metalness: 1, roughness: .35 })); wt.position.y = -0.33; scale.pans[1].add(wt);
  const wt2 = wt.clone(); wt2.position.set(0.05, -0.21, 0); wt2.scale.setScalar(0.7); scale.pans[1].add(wt2);
  const bakerT = makeChar({ body: '#8a5a3a', apron: true, hat: 'toque', mustache: true, expr: 'worried', buttons: false, belt: '#5a3a1e' });
  place(bakerT, -0.2, 0, -0.95); S.add(bakerT.root);
  const insp = makeChar({ body: '#2b3f5c', hat: 'tophat', hatColor: '#1a1a20', bandColor: '#c9a227', monocle: true, expr: 'smug', buttonColor: '#c9a227', legLen: 1.05, collar: '#e8e4da' });
  place(insp, 1.55, 0, 0.95, -0.9); S.add(insp.root);
  const quill = new THREE.Group(); const qp = mesh(new THREE.PlaneGeometry(0.42, 0.55), new THREE.MeshStandardMaterial({ map: TEX.paper, side: THREE.DoubleSide })); quill.add(qp); quill.position.set(0, 0.05, 0.12); quill.rotation.x = -0.6; insp.arms[0].hand.add(quill);
  // praça: pelourinho
  const sq = new THREE.Group(); sq.position.set(-6, 0, 12); sq.rotation.y = 0; S.add(sq);
  const platf = box(3.6, 0.7, 2.6, std('#7a5230', { map: TEX.planks })); platf.position.y = 0.35; sq.add(platf);
  for (const s of [-1, 1]) { const p = box(0.22, 2.6, 0.22, std('#5a3a1e', { map: TEX.planks })); p.position.set(s * 0.95, 0.7 + 1.3, -0.1); sq.add(p); }
  const board = box(2.3, 0.42, 0.22, std('#8a6040', { map: TEX.planks })); board.position.set(0, 0.7 + 1.68, -0.1); sq.add(board);
  const bakerP = makeChar({ body: '#8a5a3a', apron: true, hat: null, hairCap: true, hair: '#3a2410', mustache: true, expr: 'shock', buttons: false, belt: '#5a3a1e' });
  place(bakerP, 0, 0.7, -0.45); sq.add(bakerP.root);
  const splats = [];
  for (let i = 0; i < 3; i++) { const sp = mesh(new THREE.SphereGeometry(0.1, 12, 8), toon('#c81e10')); sp.scale.set(1.3, 1.0, 0.3); sp.visible = false; bakerP.head.add(sp); splats.push(sp); }
  splats[0].position.set(0.18, 0.12, 0.45); splats[1].position.set(-0.25, -0.1, 0.4); splats[2].position.set(0.05, -0.28, 0.4);
  const crowd = []; const cr = rng(99);
  const cols = ['#c0392b', '#2e86c1', '#27ae60', '#8e44ad', '#d68910', '#16a085', '#7f8c8d', '#a04000', '#1f618d', '#b03a2e'];
  const hats = ['cap', 'beret', 'bonnet', 'hood', null, 'cap', 'beret', 'hood', 'bonnet', null];
  for (let i = 0; i < 10; i++) {
    const c = makeChar({ body: cols[i], hat: hats[i], hatColor: ['#5a6a3a', '#6b2a2a', '#f2efe6', '#5a4030', '#334'][i % 5], hairCap: !hats[i], hair: ['#3a2410', '#c09040', '#1a1a1a'][i % 3], expr: 'laugh', mustache: i % 3 === 0, beard: i === 7, legLen: 0.82 + cr() * 0.2, buttonColor: '#f2efe6' });
    const row = Math.floor(i / 5), k = i % 5;
    place(c, -6 + (k - 2) * 1.05 + (cr() - .5) * 0.3, 0, 12 + 2.4 + row * 1.2 + cr() * 0.3); face(c, [-6, 2, 12]); S.add(c.root); crowd.push(c);
  }
  const tomatoes = [];
  for (let i = 0; i < 4; i++) { const tm = L.tomato(); tm.visible = false; S.add(tm); tomatoes.push(tm); }
  S.userData = { bakerT, insp, scale, stall, bakerP, crowd, tomatoes, splats, sq, sun, stallLoaves };
  S.userData.update = () => {};
}

// =====================================================================
// PLANOS (shots)
// =====================================================================
const _q = new THREE.Quaternion();
function worldOrient(obj, euler) { obj.parent.updateWorldMatrix(true, false); obj.parent.getWorldQuaternion(_q); obj.quaternion.setFromEuler(new THREE.Euler(...euler)).premultiply(_q.invert()); }
const LS = (i) => lines[i].start, LE = (i) => (i + 1 < lines.length ? lines[i + 1].start : timing.duration);
const shots = [];
function shot(scene, a, b, cam, update) { shots.push({ scene, a, b, cam, update }); }
function resetAll() {
  const B = scenes.bakery.userData, T = scenes.town.userData, K = scenes.throne.userData;
  L.charList.forEach(c => { c.noBlink = false; c.sweat = false; c.look = [0, 0]; c.rig.position.y = 0; c.legs.forEach(l => l.rotation.x = 0); c.head.rotation.set(0, 0, 0); c.root.visible = true; });
  place(B.baker, 0.8, 0, 0, 0); B.heldLoaf.visible = true; B.loaf13.visible = false; B.ovenLoaves.forEach(l => l.scale.setScalar(0.85)); B.customer.root.visible = false;
  place(T.insp, 1.55, 0, 0.95, -0.9); place(T.bakerT, -0.2, 0, -0.95, 0); T.scale.beam.rotation.z = 0; T.scale.pans.forEach(p => p.rotation.z = 0);
  T.tomatoes.forEach(x => x.visible = false); T.splats.forEach(x => x.visible = false);
  T.crowd.forEach((c, i) => { const side = i % 2 ? 1 : -1, k = Math.floor(i / 2); const a = side * (0.2 + k * 0.14); const rr = 3.0 + (k % 2) * 0.9; place(c, -6 + Math.sin(a) * rr, 0, 12 + Math.cos(a) * rr); face(c, [-6, 2, 12]); });
}
const split = (i, f) => lerp(LS(i), LE(i), f);

// Linha 0: padaria
shot('bakery', 0, split(0, 0.55), { from: [[1.7, 2.15, 3.4], [0.8, 2.0, 0]], to: [[1.35, 2.1, 2.75], [0.8, 2.0, 0]], fov: 40 }, (t, lt) => {
  const { baker, customer } = scenes.bakery.userData; baker.setExpr('smug'); customer.root.visible = false;
  idle(baker, t); arm(baker, 1, 0.35, 1.1, -1.2); arm(baker, 0, 0.3, 0.1, -0.2); baker.head.rotation.y = 0.15; baker.look = [0.4, 0];
});
shot('bakery', split(0, 0.55), LE(0), { from: [[3.9, 2.1, 5.4], [-0.2, 1.5, -1.5]], to: [[3.4, 2.0, 4.7], [-0.2, 1.5, -1.5]], fov: 50 }, (t, lt) => {
  const { baker } = scenes.bakery.userData; baker.setExpr(lt > 0.6 ? 'shock' : 'neutral'); baker.look = [0.5, 0];
  idle(baker, t); arm(baker, 1, 0.35, 0.8, -1.0); arm(baker, 0, 0.5, 0.4, -1.4); baker.head.rotation.y = 0.3;
});
// Linha 1: rei
shot('throne', LS(1), split(1, 0.5), { from: [[0.9, 1.1, 1.6], [0, 2.4, -4.3]], to: [[0.6, 1.25, 0.3], [0, 2.6, -4.3]], fov: 42 }, (t, lt) => {
  const { king, sc } = scenes.throne.userData; king.setExpr('smug'); idle(king, t);
  const raise = easeOut(lt * 1.5); arm(king, 1, lerp(0.3, 0.5, raise), lerp(0.3, 1.9, raise), lerp(-0.2, -0.6, raise)); arm(king, 0, 0.5, 0.6, -1.2);
  sc.visible = true; king.look = [0, 0.2]; worldOrient(sc, [-0.1, 0.25, 0]);
});
shot('throne', split(1, 0.5), LE(1), { from: [[1.7, 3.0, -0.8], [0.15, 2.95, -4.1]], to: [[1.45, 2.95, -1.3], [0.15, 2.95, -4.1]], fov: 38 }, (t, lt) => {
  const { king, sc } = scenes.throne.userData; king.setExpr(lt > 0.55 ? 'angry' : 'smug'); idle(king, t);
  arm(king, 1, 0.5, 1.9, -0.6); arm(king, 0, 0.9, 1.2, -1.6); king.look = [-0.5, 0]; worldOrient(sc, [-0.1, 0.35, 0]);
});
// Linha 2: inspetor
shot('town', LS(2), split(2, 0.5), { from: [[1.3, 1.9, 6.4], [0.9, 1.85, 0]], to: [[1.2, 1.85, 5.4], [0.9, 1.85, 0]], fov: 44 }, (t, lt) => {
  const U = scenes.town.userData; place(U.insp, lerp(3.2, 1.3, easeOut(lt * 1.3)), 0, lerp(1.6, 0.95, easeOut(lt * 1.3)), -1.3);
  const walk = lt < 0.75 ? Math.sin(t * 12) : 0; U.insp.legs[0].rotation.x = walk * 0.4; U.insp.legs[1].rotation.x = -walk * 0.4; U.insp.rig.position.y = Math.abs(walk) * 0.04;
  U.insp.setExpr('smug'); idle(U.insp, t); arm(U.insp, 0, 0.3, 0.7, -1.2); arm(U.insp, 1, 0.25, -walk * 0.3, -0.2);
  U.bakerT.setExpr('worried'); idle(U.bakerT, t, 2); U.bakerT.look = [0.6, 0]; arm(U.bakerT, 0, 0.4, 0.5, -1.6); arm(U.bakerT, 1, 0.4, 0.5, -1.6);
  U.scale.beam.rotation.z = 0; U.scale.pans.forEach(p => p.rotation.z = 0);
});
shot('town', split(2, 0.5), LE(2), { from: [[0.05, 2.05, 1.8], [0.6, 1.7, 0.1]], to: [[0.15, 2.0, 1.5], [0.6, 1.7, 0.1]], fov: 42 }, (t, lt) => {
  const U = scenes.town.userData; place(U.insp, 1.55, 0, 0.95, -0.9); U.insp.legs.forEach(l => l.rotation.x = 0); U.insp.rig.position.y = 0;
  const tip = easeOut(clamp((lt - 0.2) * 2)) * -0.22 + Math.sin(t * 8) * 0.015 * (1 - lt);
  U.scale.beam.rotation.z = -tip; U.scale.pans.forEach(p => p.rotation.z = tip);
  U.insp.setExpr(lt > 0.5 ? 'angry' : 'smug'); arm(U.insp, 0, 0.3, 0.7, -1.2); arm(U.insp, 1, 0.4, 1.3, -0.3); U.insp.head.rotation.y = 0.4;
  U.bakerT.setExpr('worried'); U.bakerT.sweat = true; idle(U.bakerT, t, 2);
});
// Linha 3: pelourinho
const tHit = wordT(3, 'garbage');
shot('town', LS(3), split(3, 0.45), { from: [[-6.4, 4.0, 21.0], [-6, 2.3, 12]], to: [[-6.3, 3.8, 19.4], [-6, 2.4, 12]], fov: 40 }, (t, lt) => {
  const U = scenes.town.userData; U.bakerP.setExpr('shock'); idle(U.bakerP, t);
  arm(U.bakerP, 0, 1.45, 0, 0); arm(U.bakerP, 1, 1.45, 0, 0);
  U.crowd.forEach((c, i) => { idle(c, t * 1.5 + i, 2); const j = Math.abs(Math.sin(t * 6 + i)); c.rig.position.y = j * 0.08; arm(c, i % 2, 0.5, 2.4 + Math.sin(t * 6 + i) * 0.3, -0.4); arm(c, 1 - i % 2, 0.4, 0.4, -1.2); c.setExpr('laugh'); });
});
shot('town', split(3, 0.45), LE(3), { from: [[-4.7, 3.0, 14.6], [-6, 2.65, 11.55]], to: [[-4.95, 2.95, 13.9], [-6, 2.65, 11.55]], fov: 42 }, (t, lt) => {
  const U = scenes.town.userData; idle(U.bakerP, t);
  arm(U.bakerP, 0, 1.45, 0, 0); arm(U.bakerP, 1, 1.45, 0, 0);
  // tomates voando
  const throws = [tHit - 0.45, tHit + 0.1, tHit + 0.6];
  const head = new THREE.Vector3(); U.bakerP.head.getWorldPosition(head);
  U.tomatoes.forEach((tm, i) => {
    const t0 = throws[i]; if (t0 === undefined) { tm.visible = false; return; }
    const k = (t - t0) / 0.45; tm.visible = k > 0 && k < 1;
    const st = new THREE.Vector3(-4.5 - i * 0.6, 1.8, 14.5);
    const en = head.clone().add(U.splats[i].position.clone().multiplyScalar(1));
    tm.position.lerpVectors(st, en, clamp(k)); tm.position.y += Math.sin(clamp(k) * Math.PI) * 1.2; tm.rotation.x = t * 10;
    U.splats[i].visible = k >= 1;
  });
  const hitAny = t > throws[0] + 0.45;
  U.bakerP.setExpr(hitAny ? (t > throws[0] + 1.6 ? 'worried' : 'shock') : 'worried');
  U.bakerP.head.rotation.z = hitAny ? Math.sin((t - throws[0]) * 30) * 0.12 * Math.max(0, 1 - (t - throws[0] - 0.45) * 2) : 0;
});
// Linha 4: forno
shot('bakery', LS(4), split(4, 0.42), { from: [[2.1, 2.2, 3.4], [0.5, 2.0, 0]], to: [[1.8, 2.15, 2.9], [0.5, 2.0, 0]], fov: 40 }, (t, lt) => {
  const B = scenes.bakery.userData; place(B.baker, 0.8, 0, 0, -0.9); B.baker.setExpr('worried'); B.baker.look = [-0.8, 0]; idle(B.baker, t);
  B.heldLoaf.visible = false; arm(B.baker, 0, 0.4, 0.4, -1.8); arm(B.baker, 1, 0.3, 0.2, -0.3); B.customer.root.visible = false;
  B.baker.head.rotation.y = -0.2;
});
shot('bakery', split(4, 0.42), LE(4), { from: [[-2.0, 1.6, 0.3], [-2.6, 1.2, -1.7]], to: [[-2.2, 1.5, -0.25], [-2.6, 1.2, -1.7]], fov: 42 }, (t, lt) => {
  const B = scenes.bakery.userData; const sh = 1 - easeOut(lt) * 0.28;
  B.ovenLoaves.forEach((l, i) => { l.scale.setScalar(0.85 * (sh + Math.sin(t * 3 + i) * 0.01)); });
});
// Linha 5: balcão (12 + 1)
const tExtra = wordT(5, 'extra');
shot('bakery', LS(5), LE(5), { from: [[1.1, 3.0, 4.4], [0.8, 1.75, 0.6]], to: [[0.95, 2.8, 3.8], [0.8, 1.8, 0.6]], fov: 40 }, (t, lt) => {
  const B = scenes.bakery.userData; B.ovenLoaves.forEach(l => l.scale.setScalar(0.85 * 0.72));
  place(B.baker, 0.8, 0, 0, 0); B.heldLoaf.visible = false; B.customer.root.visible = false;
  idle(B.baker, t); B.baker.look = [0, 0.6];
  const k = (t - tExtra + 0.15) / 0.35;
  B.loaf13.visible = k > 0;
  const y = k < 1 ? lerp(2.4, 1.2, clamp(k) * clamp(k)) : 1.2 + Math.abs(Math.sin((k - 1) * 6)) * 0.12 * Math.max(0, 1 - (k - 1));
  B.loaf13.position.set(0.95, y, 0.0); B.loaf13.rotation.set(0, 0.3, k < 1 ? -0.6 + clamp(k) * 0.6 : 0);
  B.baker.setExpr(k > 1.1 ? 'happy' : 'neutral');
  if (k < 0) { arm(B.baker, 0, 0.3, 0.6, -1.0); arm(B.baker, 1, 0.3, 0.6, -1.0); }
  else { arm(B.baker, 1, 0.3, 1.0 + Math.sin(clamp(k) * 3) * 0.3, -0.9); arm(B.baker, 0, 0.6, 0.3, -1.4); }
});
// Linha 6: piscadinha
shot('bakery', LS(6), LE(6), { from: [[1.15, 2.2, 2.7], [0.8, 2.1, 0]], to: [[1.05, 2.2, 2.25], [0.8, 2.12, 0]], fov: 38 }, (t, lt) => {
  const B = scenes.bakery.userData; place(B.baker, 0.8, 0, 0, 0); B.baker.noBlink = true;
  B.baker.setExpr(lt > 0.3 ? 'wink' : 'smug'); B.baker.look = [0, 0]; idle(B.baker, t);
  arm(B.baker, 1, 0.5, lerp(0.3, 1.5, easeOut(lt * 2)), lerp(-0.3, -2.0, easeOut(lt * 2))); arm(B.baker, 0, 0.3, 0.2, -0.3);
  B.baker.head.rotation.z = -0.12 * easeOut(lt * 2);
});
// Linha 7: final na cidade
shot('town', LS(7), timing.duration + 1, { from: [[1.6, 2.0, 4.4], [0, 1.8, 0]], to: [[6.0, 5.6, 12.5], [0, 1.4, 0]], fov: 44 }, (t, lt) => {
  const U = scenes.town.userData; U.bakerT.noBlink = false; U.bakerT.sweat = false;
  U.bakerT.setExpr('happy'); idle(U.bakerT, t); arm(U.bakerT, 0, 0.6, 2.2 + Math.sin(t * 5) * 0.2, -0.3); arm(U.bakerT, 1, 0.6, 2.2 + Math.sin(t * 5 + 1) * 0.2, -0.3);
  U.insp.setExpr('happy'); place(U.insp, 1.55, 0, 0.95, -0.6); arm(U.insp, 1, 0.3, 1.0, -0.4);
  U.scale.beam.rotation.z = 0; U.scale.pans.forEach(p => p.rotation.z = 0);
  U.crowd.forEach((c, i) => { const side = i % 2 ? 1 : -1, k = Math.floor(i / 2); place(c, side * (2.0 + k * 0.75), 0, 0.9 + k * 0.55 + (side > 0 ? 0.6 : 0)); face(c, [0, 1.5, 0]); c.setExpr(i % 2 ? 'happy' : 'laugh'); c.rig.position.y = Math.abs(Math.sin(t * 5 + i)) * 0.06; arm(c, i % 2, 0.4, 2.2, -0.4); });
});

// ---------- legendas ----------
const groups = [];
lines.forEach((ln) => {
  const ws = ln.words; let i = 0;
  while (i < ws.length) {
    let txt = ws[i].w; const t0 = ws[i].t; let j = i + 1;
    const letters = (s) => s.replace(/[^A-Za-z0-9]/g, '').length;
    if (letters(ws[i].w) <= 3 && j < ws.length && !/[,.!?]$/.test(ws[i].w) && letters(ws[j].w) <= 6) { txt += ' ' + ws[j].w; j++; }
    groups.push({ txt, t0, t1: j < ws.length ? ws[j].t : ln.end + 0.1 });
    i = j;
  }
});
function drawCaption(t) {
  const g = groups.find(g => t >= g.t0 && t < g.t1); if (!g) return;
  const k = clamp((t - g.t0) / 0.08); const s = 0.85 + 0.15 * easeOut(k);
  octx.save(); octx.translate(W / 2, H * 0.705); octx.scale(s, s);
  octx.font = '900 84px Inter'; octx.textAlign = 'center'; octx.textBaseline = 'middle';
  octx.lineJoin = 'round'; octx.miterLimit = 2;
  octx.shadowColor = 'rgba(0,0,0,0.55)'; octx.shadowBlur = 14; octx.shadowOffsetY = 4;
  octx.strokeStyle = '#000'; octx.lineWidth = 16; octx.strokeText(g.txt, 0, 0);
  octx.shadowColor = 'transparent'; octx.fillStyle = '#fff'; octx.fillText(g.txt, 0, 0);
  octx.restore();
}

// ---------- render de um instante ----------
const camPos = new THREE.Vector3(), camTgt = new THREE.Vector3();
function renderAt(t) {
  const sh = shots.find(s => t >= s.a && t < s.b) || shots[shots.length - 1];
  const lt = clamp((t - sh.a) / (sh.b - sh.a));
  const S = scenes[sh.scene];
  resetAll(); sh.update(t, lt); S.userData.update(t);
  const e = ease(lt);
  camPos.lerpVectors(v3(sh.cam.from[0]), v3(sh.cam.to[0]), e);
  camTgt.lerpVectors(v3(sh.cam.from[1]), v3(sh.cam.to[1]), e);
  // leve câmera na mão
  camPos.x += Math.sin(t * 1.3) * 0.015 + Math.sin(t * 3.1) * 0.006; camPos.y += Math.sin(t * 1.7) * 0.012;
  if (window.CAM) { camPos.set(...window.CAM[0]); camTgt.set(...window.CAM[1]); }
  camera.position.copy(camPos); camera.lookAt(camTgt);
  camera.rotation.z += Math.sin(t * 0.9) * 0.006;
  camera.fov = sh.cam.fov; camera.updateProjectionMatrix();
  L.charList.forEach(c => c.updateFace(t));
  renderPass.scene = S;
  composer.render();
  octx.drawImage(glCanvas, 0, 0, W, H);
  // vinheta suave
  const vg = octx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.35)'); octx.fillStyle = vg; octx.fillRect(0, 0, W, H);
  drawCaption(t);
}
await document.fonts.load('900 84px Inter');
Object.values(scenes).forEach(S => { S.environment = envTex; S.environmentIntensity = 0.45; });
window.renderAt = renderAt;
window.DURATION = timing.duration;
window.FPS = FPS;
window.frameData = (q = 0.92) => out.toDataURL('image/jpeg', q);
window.READY = true;
const qt = new URLSearchParams(location.search).get('t');
if (qt !== null) renderAt(parseFloat(qt));
else { const t0 = performance.now(); const loop = () => { renderAt(((performance.now() - t0) / 1000) % timing.duration); requestAnimationFrame(loop); }; loop(); }
