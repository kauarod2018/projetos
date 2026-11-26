import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import * as L from './lib.js';
const { mesh, box, std, stdT, toon, makeChar, loaf, TEX, rng, P, kf, clamp, lerp, sstep, walkPose, pathAt, exprKeys, repTex, mixPose } = L;

const W = 1080, H = 1920, FPS = 30;
const timing = await (await fetch('./build/timing.json')).json();
const lines = timing.lines;
L.buildTextures();

// ---------- renderer + pós-processamento ----------
const glCanvas = document.createElement('canvas'); glCanvas.id = 'gl'; document.body.appendChild(glCanvas);
const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const camera = new THREE.PerspectiveCamera(40, W / H, 0.05, 900);
const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
const composer = new EffectComposer(renderer, rt);
const renderPass = new RenderPass(new THREE.Scene(), camera); composer.addPass(renderPass);
composer.addPass(new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.28, 0.5, 1.2));
composer.addPass(new OutputPass());
const grade = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, time: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float time; varying vec2 vUv;
  void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb;
    c = (c - 0.5) * 1.07 + 0.5;
    float l = dot(c, vec3(0.299, 0.587, 0.114)); c = mix(vec3(l), c, 1.1);
    c *= vec3(1.025, 1.0, 0.965);
    vec2 d = vUv - 0.5; float v = smoothstep(0.9, 0.3, length(d * vec2(0.95, 1.05))); c *= mix(0.72, 1.0, v);
    float n = fract(sin(dot(vUv * vec2(1080.0, 1920.0) + time * 13.1, vec2(12.9898, 78.233))) * 43758.5453); c += (n - 0.5) * 0.02;
    gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0); }`,
});
composer.addPass(grade);
const pmrem = new THREE.PMREMGenerator(renderer); const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const out = document.getElementById('out'); out.width = W; out.height = H;
const octx = out.getContext('2d');

// ---------- utilidades ----------
const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
const v3 = (a) => new THREE.Vector3(...a);
const wordT = (li, w) => { const f = lines[li].words.find(x => x.w.toLowerCase().replace(/[^a-z0-9']/g, '').startsWith(w)); return f ? f.t : lines[li].start; };
const place = (ch, x, y, z, ry = 0) => { ch.root.position.set(x, y, z); ch.root.rotation.y = ry; };
const angTo = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);
const handPos = (ch, i) => { ch.root.updateMatrixWorld(true); return ch.arms[i].hand.getWorldPosition(new THREE.Vector3()); };
const arcPos = (a, b, k, h) => { const p = a.clone().lerp(b, k); p.y += Math.sin(clamp(k) * Math.PI) * h; return p; };
const spring = (dt, f = 18, d = 6) => dt < 0 ? 0 : Math.exp(-dt * d) * Math.sin(dt * f);
const mix2 = (a, b, k) => mixPose(a, b, clamp(k));
function sunLight(scene, pos, intensity = 3, color = '#fff2dd', size = 10) {
  const d = new THREE.DirectionalLight(color, intensity); d.position.set(...pos); d.castShadow = true;
  d.shadow.mapSize.set(2048, 2048); const c = d.shadow.camera; c.left = c.bottom = -size; c.right = c.top = size; c.near = 0.5; c.far = 120; d.shadow.bias = -0.0003; d.shadow.normalBias = 0.025; d.shadow.radius = 3;
  scene.add(d); scene.add(d.target); d.userData.offset = new THREE.Vector3(...pos); return d;
}
function flame(scale = 1) {
  const g = new THREE.Group();
  const m1 = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff6a10').multiplyScalar(2.6), transparent: true, opacity: 0.85, depthWrite: false });
  const m2 = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd070').multiplyScalar(3.2), transparent: true, opacity: 0.95, depthWrite: false });
  const prof = (r, h) => { const pts = []; for (let i = 0; i <= 12; i++) { const y = i / 12; pts.push(new THREE.Vector2(r * Math.sin(Math.PI * Math.pow(1 - y, 1.6)) * Math.pow(1 - y, 0.3) + 0.001, y * h)); } return new THREE.LatheGeometry(pts, 14); };
  g.add(mesh(prof(0.17, 0.6), m1, { cast: false, recv: false }));
  const b = mesh(prof(0.09, 0.36), m2, { cast: false, recv: false }); b.position.z = 0.03; g.add(b);
  g.scale.setScalar(scale); g.userData.base = scale; return g;
}
function flicker(f, t, k = 0) { const s = 1 + Math.sin(t * 17 + k) * 0.13 + Math.sin(t * 29 + k * 3) * 0.08; f.scale.y = f.userData.base * s; f.scale.x = f.userData.base * (1 - (s - 1) * 0.5); f.rotation.z = Math.sin(t * 11 + k) * 0.1; }
function orientShaft(sh, from, to) { sh.position.copy(from); sh.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), to.clone().sub(from).normalize()); }
const addMat = (color, op = 1) => new THREE.SpriteMaterial({ map: TEX.soft, color, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending });
const smokeMat = (color = '#d8d8d8', op = 0.4) => new THREE.SpriteMaterial({ map: TEX.smoke, color, transparent: true, opacity: op, depthWrite: false });
function dust(n, center, size, seed, color = '#fff3d8') {
  const r = rng(seed); const base = Array.from({ length: n }, () => [r() - .5, r() - .5, r() - .5, r() * 6, 0.012 + r() * 0.02]);
  return L.particles(n, addMat(color, 0.7), (s, i, t) => { const b = base[i]; s.position.set(center[0] + b[0] * size[0] + Math.sin(t * 0.3 + b[3]) * 0.15, center[1] + b[1] * size[1] + Math.sin(t * 0.2 + b[3] * 2) * 0.12, center[2] + b[2] * size[2] + Math.cos(t * 0.25 + b[3]) * 0.15); s.scale.setScalar(b[4] * (0.8 + Math.sin(t * 2 + b[3]) * 0.2)); s.material.opacity = 0.35 + 0.35 * Math.sin(t * 0.8 + b[3]); });
}
function smoke(n, origin, seed, { life = 4, rise = 2.2, spread = 0.6, size = 0.5, grow = 1.6, color = '#d8d8d8', op = 0.35, wind = [0.4, 0] } = {}) {
  const r = rng(seed); const ph = Array.from({ length: n }, (_, i) => [i / n, r() * 6, r() - .5, r() - .5]);
  return L.particles(n, smokeMat(color, op), (s, i, t) => { const p = ph[i]; const age = ((t / life + p[0]) % 1); s.position.set(origin.x + p[2] * 0.2 + age * (wind[0] * life) + Math.sin(age * 4 + p[1]) * spread * age, origin.y + age * rise, origin.z + p[3] * 0.2 + age * wind[1] * life); s.scale.setScalar(size * (0.5 + age * grow)); s.material.opacity = op * Math.sin(age * Math.PI) * (1 - age * 0.3); s.material.rotation = p[1] + age; });
}
function sparks(n, origin, seed) {
  const r = rng(seed); const ph = Array.from({ length: n }, (_, i) => [i / n, r() - .5, r() - .5, 0.6 + r() * 0.8]);
  return L.particles(n, addMat(new THREE.Color('#ff9a30').multiplyScalar(3), 1), (s, i, t) => { const p = ph[i]; const age = ((t / p[3] + p[0]) % 1); s.position.set(origin.x + p[1] * 0.6 + Math.sin(t * 9 + i) * 0.05 * age, origin.y + age * 1.1, origin.z + p[2] * 0.3 + age * 0.2); s.scale.setScalar(0.035 * (1 - age)); s.material.opacity = 1 - age; });
}

const scenes = {};
const updaters = { bakery: [], throne: [], town: [] };

// =====================================================================
// PADARIA
// =====================================================================
{
  const S = new THREE.Scene(); scenes.bakery = S; const U = updaters.bakery;
  S.background = new THREE.Color('#2a1c12'); S.fog = new THREE.Fog('#2a1c12', 11, 28);
  S.add(new THREE.HemisphereLight('#fff8f0', '#6a4a30', 1.3));
  { const fill = new THREE.DirectionalLight('#fff6ea', 1.0); fill.position.set(1, 3, 8); S.add(fill); }
  const floor = mesh(new THREE.PlaneGeometry(14, 14), stdT(repTex(TEX.planks, 4, 4), '#d8b890', { roughness: 0.7 })); floor.rotation.x = -Math.PI / 2; S.add(floor);
  const wallM = stdT(repTex(TEX.plaster, 3, 1.2), '#ffffff', { roughness: 0.95 });
  const back = mesh(new THREE.PlaneGeometry(14, 5), wallM); back.position.set(0, 2.5, -4.5); S.add(back);
  const left = mesh(new THREE.PlaneGeometry(14, 5), wallM); left.rotation.y = Math.PI / 2; left.position.set(-5.5, 2.5, 0); S.add(left);
  const right = mesh(new THREE.PlaneGeometry(14, 5), wallM); right.rotation.y = -Math.PI / 2; right.position.set(5.5, 2.5, 0); S.add(right);
  const ceil = mesh(new THREE.PlaneGeometry(14, 14), stdT(repTex(TEX.planks, 3, 3), '#5a3a24')); ceil.rotation.x = Math.PI / 2; ceil.position.y = 5; S.add(ceil);
  const beamM = stdT(repTex(TEX.planks, 0.4, 2), '#5a3a22');
  for (let i = -2; i <= 2; i++) { const b = box(0.3, 0.35, 14, beamM); b.position.set(i * 2.6, 4.8, 0); S.add(b); }
  for (const x of [-5.3, 5.3]) for (const z of [-4.3, -1, 2.3]) { const p = box(0.3, 5, 0.3, beamM); p.position.set(x, 2.5, z); S.add(p); }
  for (const x of [-3, 0, 3]) { const p = box(0.3, 5, 0.3, beamM); p.position.set(x, 2.5, -4.35); S.add(p); }
  { const rail = box(11, 0.12, 0.12, beamM); rail.position.set(0, 1.2, -4.38); S.add(rail); }
  // forno
  const oven = new THREE.Group(); oven.position.set(-2.6, 0, -3.0); S.add(oven);
  const brickM = stdT(repTex(TEX.brick, 3, 2), '#ffffff', { roughness: 0.9 });
  const baseO = box(3.4, 1.0, 2.6, brickM); baseO.position.y = 0.5; oven.add(baseO);
  const dome = mesh(new THREE.SphereGeometry(1.6, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), stdT(repTex(TEX.brick, 4, 1.5), '#ffffff')); dome.position.y = 1.0; dome.scale.z = 0.8; oven.add(dome);
  const soot = mesh(new THREE.CircleGeometry(0.9, 24, 0, Math.PI), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.35, depthWrite: false })); soot.position.set(0, 1.25, 1.292); oven.add(soot);
  const mouthMat = new THREE.ShaderMaterial({ uniforms: { t: { value: 0 } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} ', fragmentShader: 'uniform float t; varying vec2 vUv; void main(){ float g = smoothstep(0.0, 0.9, 1.0 - vUv.y); float f = 0.75 + 0.25*sin(t*9.0 + vUv.x*12.0); vec3 c = mix(vec3(0.08,0.02,0.0), vec3(2.2,0.7,0.12), g*f); gl_FragColor = vec4(c,1.0); }' });
  const mouth = mesh(new THREE.CircleGeometry(0.62, 32, 0, Math.PI), mouthMat, { cast: false }); mouth.position.set(0, 1.0, 1.295); oven.add(mouth);
  const arch = mesh(new THREE.TorusGeometry(0.7, 0.1, 10, 32, Math.PI), stdT(repTex(TEX.brick, 2, 0.2), '#b06040')); arch.position.set(0, 1.0, 1.3); oven.add(arch);
  const ledge = box(1.6, 0.1, 0.5, stdT(repTex(TEX.stone, 1, 0.3), '#a0a0a0')); ledge.position.set(0, 0.97, 1.45); oven.add(ledge);
  const chim = box(0.6, 2.6, 0.6, brickM); chim.position.set(0, 3.6, -0.4); oven.add(chim);
  const coals = []; for (let i = 0; i < 14; i++) { const c = mesh(new THREE.IcosahedronGeometry(0.05 + (i % 3) * 0.02, 0), new THREE.MeshBasicMaterial({ color: '#ff4a10' }), { cast: false }); c.position.set(-0.45 + (i * 0.07) % 0.9, 1.03, 1.33 + (i % 2) * 0.02); oven.add(c); coals.push(c); }
  const fires = [];
  for (let i = 0; i < 9; i++) { const f = flame(0.36 + ((i * 7) % 3) * 0.12); f.position.set(-0.44 + i * 0.11, 1.0, 1.31 + (i % 2) * 0.02); oven.add(f); fires.push(f); }
  const ovenLight = new THREE.PointLight('#ff8a2a', 7, 7, 1.6); ovenLight.position.set(0, 1.9, 2.4); oven.add(ovenLight);
  const ovenLoaves = [];
  for (let i = 0; i < 3; i++) { const l = loaf(0.82); l.position.set(-0.3 + i * 0.3, 1.1, 1.5); oven.add(l); ovenLoaves.push(l); }
  const sp = sparks(22, new THREE.Vector3(-2.6, 1.2, -1.6), 5); S.add(sp); U.push(sp.userData.update);
  const sm = smoke(10, new THREE.Vector3(-2.6, 1.7, -1.55), 6, { life: 3, rise: 1.6, size: 0.35, color: '#9a8a7a', op: 0.25, wind: [0.05, 0.1] }); S.add(sm); U.push(sm.userData.update);
  for (let i = 0; i < 12; i++) { const lg = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.9, 8), std('#6a4a2a', { roughness: 1 })); lg.rotation.x = Math.PI / 2; lg.position.set(-4.8 + (i % 4) * 0.15, 0.08 + Math.floor(i / 4) * 0.13, -1.3); S.add(lg); }
  const peel = new THREE.Group(); const ph = mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.2, 8), std('#8a6a3a')); ph.position.y = 1.1; peel.add(ph); const pb = box(0.4, 0.5, 0.03, std('#a07a4a')); pb.position.y = 2.4; peel.add(pb); peel.position.set(-0.6, 0, -4.2); peel.rotation.z = 0.15; S.add(peel);
  const shelf = new THREE.Group(); shelf.position.set(2.4, 0, -4.2); S.add(shelf);
  const kinds = ['loaf', 'boule', 'loaf', 'baguette', 'boule', 'loaf'];
  for (let k = 0; k < 3; k++) { const b = box(3.2, 0.08, 0.6, beamM); b.position.y = 1.0 + k * 0.85; shelf.add(b); for (let i = 0; i < 6; i++) { const kind = kinds[(i + k) % 6]; const l = loaf(0.75 + L.R() * 0.2, kind); l.position.set(-1.3 + i * 0.52, 1.13 + k * 0.85 + (kind === 'baguette' ? -0.05 : 0), 0.05); l.rotation.y = (L.R() - .5) * .5; shelf.add(l); } }
  for (const x of [-1.6, 1.6]) { const p = box(0.1, 3, 0.6, beamM); p.position.set(x, 1.5, 0); shelf.add(p); }
  for (let i = 0; i < 5; i++) { const hb = new THREE.Group(); hb.position.set(-1.2 + i * 0.5, 4.6, -3.9); S.add(hb); const st = mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.4), L.BLACK); st.position.y = -0.2; hb.add(st); for (let k = 0; k < 4; k++) { const lf = mesh(new THREE.ConeGeometry(0.06, 0.3, 5), toon(['#5a7a3a', '#7a8a4a', '#a08050'][i % 3])); lf.position.set((k - 1.5) * 0.04, -0.5, 0); lf.rotation.z = Math.PI + (k - 1.5) * 0.2; hb.add(lf); } }
  for (let i = 0; i < 3; i++) { const pot = mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.22, 16, 1, true), std('#8a5a3a', { metalness: 0.6, roughness: 0.35, side: THREE.DoubleSide })); pot.position.set(3.4 + i * 0.5, 3.5, -3.9); S.add(pot); }
  // balcão
  const counter = new THREE.Group(); counter.position.set(0.8, 0, 0.9); S.add(counter);
  const ct = box(3.2, 0.12, 1.0, stdT(repTex(TEX.planks, 1.2, 0.5), '#c89a68', { roughness: 0.6 }), 0.03); ct.position.y = 1.06; counter.add(ct);
  const cb = box(3.0, 1.0, 0.85, stdT(repTex(TEX.planks, 1.5, 0.6), '#c08a5a')); cb.position.y = 0.5; counter.add(cb);
  for (const x of [-1.0, 0, 1.0]) { const pnl = box(0.85, 0.6, 0.03, stdT(repTex(TEX.planks, 0.5, 0.4), '#a87a4a')); pnl.position.set(x, 0.5, 0.44); counter.add(pnl); }
  const dough = mesh(new THREE.SphereGeometry(0.2, 20, 12), toon('#f2e2c0')); dough.scale.set(1.2, 0.45, 1); dough.position.set(1.2, 1.17, -0.2); counter.add(dough);
  const pin = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 12), std('#c8a070')); pin.rotation.z = Math.PI / 2; pin.position.set(1.2, 1.17, 0.15); counter.add(pin);
  const flourDust = mesh(new THREE.CircleGeometry(0.35, 20), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.45, depthWrite: false })); flourDust.rotation.x = -Math.PI / 2; flourDust.position.set(1.15, 1.125, -0.05); counter.add(flourDust);
  const basket = mesh(new THREE.CylinderGeometry(0.3, 0.24, 0.3, 18, 1, true), std('#b08a4a', { side: THREE.DoubleSide })); basket.position.set(-1.3, 1.27, -0.25); counter.add(basket);
  for (let i = 0; i < 4; i++) { const bg = loaf(0.9, 'baguette'); bg.position.set(-1.3 + (i - 1.5) * 0.06, 1.45, -0.25); bg.rotation.set(0.2, i, 1.2); counter.add(bg); }
  for (let i = 0; i < 3; i++) { const s = L.sack(); s.position.set(-4.6 + i * 0.6, 0, 1.5 + (i % 2) * 0.4); s.rotation.y = i * 0.4; S.add(s); }
  for (let i = 0; i < 2; i++) { const b = L.barrel(1); b.position.set(4.6, 0, -2.6 + i * 1.0); S.add(b); }
  { const c = L.crate(0.6); c.position.set(3.9, 0, 2.2); S.add(c); const c2 = L.crate(0.5); c2.position.set(3.95, 0.6, 2.2); c2.rotation.y = 0.4; S.add(c2); }
  const win = mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff4d8').multiplyScalar(2.4) })); win.rotation.y = -Math.PI / 2; win.position.set(5.48, 2.6, 0.5); S.add(win);
  const wf = new THREE.Group(); wf.position.copy(win.position); wf.rotation.y = -Math.PI / 2; S.add(wf);
  [[0, 0.8, 1.8, 0.1], [0, -0.8, 1.8, 0.1], [0.8, 0, 0.1, 1.7], [-0.8, 0, 0.1, 1.7], [0, 0, 0.08, 1.6], [0, 0, 1.6, 0.08]].forEach(([x, y, w, h]) => { const b = box(w, h, 0.12, beamM); b.position.set(x, y, 0.02); wf.add(b); });
  const sun = new THREE.SpotLight('#fff0d0', 110, 20, 0.5, 0.6, 1.2); sun.position.set(9, 5, 0.5); sun.target.position.set(0, 0, 0.8); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.radius = 4; S.add(sun); S.add(sun.target);
  const shaft = L.lightShaft(7.5, 0.75, 1.5, '#fff0c8', 0.22); orientShaft(shaft, new THREE.Vector3(5.4, 2.6, 0.5), new THREE.Vector3(0.5, 0.0, 0.8)); S.add(shaft);
  const du = dust(60, [2.6, 1.8, 0.6], [5, 2.6, 2], 11); S.add(du); U.push(du.userData.update);
  const lamps = [];
  for (const p of [[-1, 3.9, 0.5], [2.5, 3.9, -1.5]]) { const l = L.lantern(); l.position.set(...p); S.add(l); const pl = new THREE.PointLight('#ffb050', 5, 8, 1.8); pl.position.set(p[0], p[1] - 0.1, p[2]); S.add(pl); const c = mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.9), L.BLACK); c.position.set(p[0], p[1] + 0.65, p[2]); S.add(c); lamps.push(l); }
  const baker = makeChar({ body: '#8a5a3a', apron: true, hat: 'toque', mustache: true, buttons: false, belt: '#5a3a1e' }); S.add(baker.root);
  const customer = makeChar({ body: '#3f7a5a', hat: 'bonnet', buttonColor: '#f2efe6', legLen: 0.85, vest: '#2e5a42' }); S.add(customer.root);
  const custBasket = new THREE.Group(); const cbh = mesh(new THREE.TorusGeometry(0.16, 0.02, 6, 16, Math.PI), std('#8a6a3a')); custBasket.add(cbh); const cbk = mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.16, 14, 1, true), std('#b08a4a', { side: THREE.DoubleSide })); cbk.position.y = -0.08; custBasket.add(cbk); custBasket.position.set(0, -0.06, 0); custBasket.scale.setScalar(0.7); customer.arms[0].hand.add(custBasket);
  const heldLoaf = loaf(1); S.add(heldLoaf);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const l = loaf(0.8); l.position.set(-0.95 + c * 0.45, 1.19, -0.32 + r * 0.32); l.rotation.y = ((r * 4 + c) % 3 - 1) * 0.08; counter.add(l); }
  const loaf13 = loaf(0.85); S.add(loaf13);
  const sparkle = new THREE.Sprite(addMat(new THREE.Color('#fff6c0').multiplyScalar(3), 1)); S.add(sparkle);
  S.userData = { baker, customer, ovenLoaves, counter, heldLoaf, loaf13, sparkle };
  U.push((t) => { fires.forEach((f, i) => flicker(f, t, i)); ovenLight.intensity = 7 + Math.sin(t * 13) * 1.2 + Math.sin(t * 31) * 0.8; mouthMat.uniforms.t.value = t; coals.forEach((c, i) => c.material.color.setRGB(1.6 + Math.sin(t * 5 + i) * 0.5, 0.35, 0.05)); lamps.forEach((l, i) => { l.rotation.z = Math.sin(t * 1.2 + i) * 0.04; }); });
}

// =====================================================================
// SALA DO TRONO
// =====================================================================
{
  const S = new THREE.Scene(); scenes.throne = S; const U = updaters.throne;
  S.background = new THREE.Color('#1a1418'); S.fog = new THREE.Fog('#1a1418', 14, 40);
  S.add(new THREE.HemisphereLight('#d8d0ff', '#4a3020', 0.9));
  { const fill = new THREE.DirectionalLight('#ffeedd', 0.8); fill.position.set(2, 4, 8); S.add(fill); }
  const stoneM = stdT(repTex(TEX.stone, 5, 2.2), '#ffffff', { roughness: 0.85 });
  const floor = mesh(new THREE.PlaneGeometry(16, 24), stdT(repTex(TEX.stone, 6, 9), '#c8c8d0', { roughness: 0.45 })); floor.rotation.x = -Math.PI / 2; S.add(floor);
  const back = mesh(new THREE.PlaneGeometry(16, 9), stoneM); back.position.set(0, 4.5, -6); S.add(back);
  for (const s of [-1, 1]) { const w = mesh(new THREE.PlaneGeometry(24, 9), stoneM); w.rotation.y = -s * Math.PI / 2; w.position.set(s * 8, 4.5, 2); S.add(w); }
  const carpetT = TEX.carpet.clone(); carpetT.needsUpdate = true; carpetT.repeat.set(1, 4);
  const carpet = mesh(new THREE.PlaneGeometry(2.4, 20), std('#ffffff', { map: carpetT, roughness: 1 })); carpet.rotation.x = -Math.PI / 2; carpet.position.set(0, 0.01, 4); S.add(carpet);
  const plat = box(6, 0.5, 3, stoneM); plat.position.set(0, 0.25, -4.3); S.add(plat);
  const step = box(4, 0.25, 0.8, stoneM); step.position.set(0, 0.125, -2.5); S.add(step);
  const gold = std('#e0b030', { metalness: 1, roughness: 0.28 });
  const red = std('#9a1020', { roughness: .9 });
  const throne = new THREE.Group(); throne.position.set(0, 0.5, -4.4); S.add(throne);
  const seat = box(1.6, 0.25, 1.2, red, 0.06); seat.position.y = 0.75; throne.add(seat);
  const backT = box(1.7, 2.8, 0.25, gold, 0.06); backT.position.set(0, 1.9, -0.55); throne.add(backT);
  const backR = box(1.3, 2.3, 0.1, red, 0.04); backR.position.set(0, 1.8, -0.4); throne.add(backR);
  for (let i = 0; i < 12; i++) { const st = mesh(new THREE.SphereGeometry(0.03, 8, 6), gold); st.position.set(-0.55 + (i % 4) * 0.37, 0.95 + Math.floor(i / 4) * 0.7, -0.34); throne.add(st); }
  for (const s of [-1, 1]) { const a = box(0.25, 0.9, 1.2, gold, 0.05); a.position.set(s * 0.85, 0.85, 0); throne.add(a); const b = mesh(new THREE.SphereGeometry(0.16, 16, 12), gold); b.position.set(s * 0.85, 3.4, -0.55); throne.add(b); const knob = mesh(new THREE.SphereGeometry(0.12, 12, 10), gold); knob.position.set(s * 0.85, 1.35, 0.55); throne.add(knob); }
  const legT = box(1.6, 0.65, 1.1, gold); legT.position.y = 0.32; throne.add(legT);
  const torches = [];
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
    const z = -3 + i * 4.5;
    const p = mesh(new THREE.CylinderGeometry(0.45, 0.5, 9, 20), stoneM); p.position.set(s * 5, 4.5, z); S.add(p);
    const cap = box(1.2, 0.3, 1.2, stoneM); cap.position.set(s * 5, 0.15, z); S.add(cap);
    const ban = mesh(new THREE.PlaneGeometry(1.4, 2.8, 1, 12), std('#ffffff', { map: TEX.banner, side: THREE.DoubleSide })); ban.position.set(s * 4.45, 4.6, z); ban.rotation.y = -s * Math.PI / 2; S.add(ban);
    const bp = ban.geometry.attributes.position; const orig = bp.array.slice();
    U.push((t) => { for (let k = 0; k < bp.count; k++) { const y = orig[k * 3 + 1]; bp.setZ(k, Math.sin(t * 1.5 + y * 2 + i) * 0.04 * (1.4 - y)); } bp.needsUpdate = true; });
    const f = flame(1.1); f.position.set(s * 4.35, 2.9, z + 0.9); S.add(f); torches.push(f);
    const hold = mesh(new THREE.CylinderGeometry(0.07, 0.04, 0.5, 8), std('#333', { metalness: .8, roughness: .4 })); hold.position.set(s * 4.35, 2.7, z + 0.9); S.add(hold);
    const pl = new THREE.PointLight('#ff9a3a', 8, 9, 1.6); pl.position.set(s * 4.2, 3.3, z + 0.9); S.add(pl);
  }
  const bigBan = mesh(new THREE.PlaneGeometry(2.6, 4.6), std('#ffffff', { map: TEX.banner })); bigBan.position.set(0, 5.6, -5.95); S.add(bigBan);
  for (const s of [-1, 1]) {
    const w = mesh(new THREE.PlaneGeometry(1.2, 3), new THREE.MeshBasicMaterial({ color: new THREE.Color('#bcd8ff').multiplyScalar(2) })); w.position.set(s * 3.2, 5.8, -5.98); S.add(w);
    const sh = L.lightShaft(9, 0.5, 1.2, '#cfe0ff', 0.16); orientShaft(sh, new THREE.Vector3(s * 3.2, 5.8, -5.9), new THREE.Vector3(s * 1.6, 0, -1.5)); S.add(sh);
    for (const z of [-3.2]) { const cand = new THREE.Group(); cand.position.set(s * 2.4, 0.5, z); S.add(cand); const pole = mesh(new THREE.CylinderGeometry(0.04, 0.12, 1.6, 10), gold); pole.position.y = 0.8; cand.add(pole); for (const dx of [-0.2, 0, 0.2]) { const c = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.25, 8), std('#f4ecd8')); c.position.set(dx, 1.72, 0); cand.add(c); const fl = flame(0.18); fl.position.set(dx, 1.85, 0); cand.add(fl); torches.push(fl); } }
  }
  const du = dust(50, [0, 3, -3], [6, 5, 4], 21, '#e0e8ff'); S.add(du); U.push(du.userData.update);
  const spot = new THREE.SpotLight('#dfe8ff', 60, 30, 0.35, 0.7, 1.2); spot.position.set(0, 12, 4); spot.target.position.set(0, 1.5, -4); spot.castShadow = true; spot.shadow.mapSize.set(2048, 2048); spot.shadow.bias = -0.0005; spot.shadow.radius = 4; S.add(spot); S.add(spot.target);
  const king = makeChar({ body: '#a0182a', hat: 'crown', beard: true, hairColor: '#d8d2c4', collar: '#f6f3ea', ermine: true, buttonColor: '#e0b030', belt: '#e0b030', cape: '#6a0a18' }); S.add(king.root);
  const sc = L.scroll(); sc.scale.setScalar(0.7); S.add(sc);
  const scepter = new THREE.Group(); const sp1 = mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.8, 8), gold); sp1.position.y = 0.2; scepter.add(sp1); const sp2 = mesh(new THREE.SphereGeometry(0.07, 12, 10), gold); sp2.position.y = 0.62; scepter.add(sp2); const sp3 = mesh(new THREE.SphereGeometry(0.035, 10, 8), std('#d01c3c', { roughness: 0.05 })); sp3.position.y = 0.7; scepter.add(sp3); king.arms[0].hand.add(scepter);
  const guards = [];
  for (const s of [-1, 1]) { const g = makeChar({ body: '#4a5058', hat: 'helmet', belt: '#3a2a1a', mustache: s > 0, vest: '#8a1c1c' }); S.add(g.root); const spear = new THREE.Group(); spear.add(mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.6), std('#6b3f1d'))); const tip = mesh(new THREE.ConeGeometry(0.07, 0.25, 6), std('#ccc', { metalness: 1, roughness: .3 })); tip.position.y = 1.4; spear.add(tip); spear.position.set(0, 0.6, 0.04); g.arms[s > 0 ? 1 : 0].hand.add(spear); g.side = s; guards.push(g); }
  S.userData = { king, sc, guards, scepter };
  U.push((t) => torches.forEach((f, i) => flicker(f, t, i)));
}

// =====================================================================
// CIDADE
// =====================================================================
{
  const S = new THREE.Scene(); scenes.town = S; const U = updaters.town;
  S.add(L.skyDome('#3f86e0', '#d8ecff', [0.45, 0.5, 0.75]));
  S.fog = new THREE.Fog('#cfe3f7', 35, 140);
  S.add(new THREE.HemisphereLight('#bcdcff', '#7a6a4a', 1.0));
  const sun = sunLight(S, [14, 22, 16], 3.4, '#fff1d6', 9);
  const ground = mesh(new THREE.PlaneGeometry(120, 120), stdT(repTex(TEX.cobble, 50, 50), '#ffffff', { roughness: 0.9 })); ground.rotation.x = -Math.PI / 2; S.add(ground);
  const r = rng(7);
  const bases = ['#f2e6cc', '#ecd6b4', '#f4ecdc', '#e8cdb0', '#e0d6c4', '#f2dcc4'];
  const houseSpots = [];
  for (let i = 0; i < 7; i++) houseSpots.push([-15 + i * 5.2, -9, 0]);
  for (let i = 0; i < 5; i++) houseSpots.push([-17, -4 + i * 5.2, Math.PI / 2]);
  for (let i = 0; i < 6; i++) houseSpots.push([20, -4 + i * 5.2, -Math.PI / 2]);
  for (let i = 0; i < 7; i++) houseSpots.push([-15 + i * 5.2, 27, Math.PI]);
  const chimneys = [];
  houseSpots.forEach(([x, z, ry], i) => { const h = L.house(4.6, 3.6 + r() * 2.4, 4, bases[i % bases.length], 100 + i); h.position.set(x, 0, z); h.rotation.y = ry; S.add(h); h.updateMatrixWorld(true); if (i % 3 === 0) chimneys.push(h.localToWorld(h.userData.chimneyTop.clone())); });
  chimneys.forEach((c, i) => { const s = smoke(9, c, 30 + i, { life: 5, rise: 4, size: 0.9, grow: 2.2, color: '#e6e6e6', op: 0.35, wind: [0.5, 0.15] }); S.add(s); U.push(s.userData.update); });
  const trees = [];
  [[-11, -5.5], [-5, -6], [9, -6], [14, -5], [-13, 6], [16, 8]].forEach(([x, z], i) => { const tr = L.tree(50 + i); tr.position.set(x, 0, z); S.add(tr); trees.push(tr); });
  U.push((t) => trees.forEach((tr, i) => { tr.userData.leaves.rotation.z = Math.sin(t * 1.1 + i) * 0.02; tr.userData.leaves.rotation.x = Math.sin(t * 0.9 + i * 2) * 0.015; }));
  const clouds = [];
  for (let i = 0; i < 9; i++) { const c = L.cloud(300 + i); c.position.set(-80 + i * 22, 45 + r() * 20, -120 - r() * 60); c.scale.setScalar(2 + r() * 2); S.add(c); clouds.push(c); }
  for (let i = 0; i < 5; i++) { const c = L.cloud(400 + i); c.position.set(-70 + i * 35, 48 + r() * 10, 120); c.scale.setScalar(3); S.add(c); clouds.push(c); }
  clouds.forEach(c => c.userData.x0 = c.position.x);
  U.push((t) => clouds.forEach(c => { c.position.x = c.userData.x0 + t * 0.6; }));
  [[[-12.7, 4.6, -7], [-2.5, 4.4, 6]], [[17.7, 5.2, -6], [5, 4.6, 8]], [[-14.6, 4.8, 14], [-1, 5.0, 25]], [[-2.5, 4.5, -7], [8, 4.8, -7]]].forEach(([a, b], i) => { const bt = L.bunting(a, b, 18, 0.9, i + 3); S.add(bt); U.push((t) => bt.userData.flags.forEach(f => { f.rotation.x = Math.sin(t * 3 + f.userData.ph) * 0.25; })); });
  const cartM = L.cart(); cartM.position.set(-7, 0, 1.5); cartM.rotation.y = 0.6; S.add(cartM);
  [[3.6, -1.6], [4.3, -1.2], [-3.4, -2.2], [12, 3], [-9.5, -5]].forEach(([x, z], i) => { const b = L.barrel(0.9); b.position.set(x, 0, z); b.rotation.y = i; S.add(b); });
  [[3.0, -2.6, 0.6], [3.05, -2.6, 0.45], [-10, 9, 0.6], [11, 6, 0.6]].forEach(([x, z, s], i) => { const c = L.crate(s); c.position.set(x, i === 1 ? 0.6 : 0, z); c.rotation.y = i * 0.5; S.add(c); });
  for (let i = 0; i < 3; i++) { const s = L.sack(); s.position.set(-2.2 + i * 0.5, 0, -1.9 + (i % 2) * 0.3); s.rotation.y = i; S.add(s); }
  const well = new THREE.Group(); well.position.set(6, 0, 4); S.add(well);
  const wb = mesh(new THREE.CylinderGeometry(1, 1, 0.9, 24, 1, true), stdT(repTex(TEX.stone, 3, 0.5), '#ffffff', { side: THREE.DoubleSide })); wb.position.y = 0.45; well.add(wb);
  const wrim = mesh(new THREE.TorusGeometry(1, 0.12, 8, 28), stdT(repTex(TEX.stone, 4, 0.3))); wrim.rotation.x = Math.PI / 2; wrim.position.y = 0.9; well.add(wrim);
  const water = mesh(new THREE.CircleGeometry(0.95, 24), std('#2a4a5a', { roughness: 0.05, metalness: 0.3 })); water.rotation.x = -Math.PI / 2; water.position.y = 0.5; well.add(water);
  for (const s of [-1, 1]) { const p = box(0.15, 2, 0.15, std('#5a3a1e')); p.position.set(s * 0.9, 1.4, 0); well.add(p); }
  const wr = mesh(new THREE.ConeGeometry(1.4, 0.8, 4), stdT(repTex(TEX.roof, 2, 1), '#c08070')); wr.position.y = 2.7; wr.rotation.y = Math.PI / 4; well.add(wr);
  const birds = []; for (let i = 0; i < 5; i++) { const b = L.bird(); S.add(b); birds.push(b); }
  U.push((t) => birds.forEach((b, i) => { const a = t * 0.25 + i * 1.3; b.position.set(Math.cos(a) * (14 + i * 2) - 2, 14 + i * 1.2 + Math.sin(t + i) * 0.6, Math.sin(a) * (10 + i) + 4); b.rotation.y = -a; const fl = Math.sin(t * 9 + i * 2) * 0.6; b.userData.wings[0].rotation.z = fl; b.userData.wings[1].rotation.z = -fl; }));
  // barraca
  const stall = new THREE.Group(); S.add(stall);
  const wood = stdT(repTex(TEX.planks, 1, 0.4), '#b88a5a', { roughness: 0.7 });
  const table = box(2.6, 0.12, 1.1, wood, 0.03); table.position.y = 1.0; stall.add(table);
  const tb = box(2.5, 0.9, 1.0, stdT(repTex(TEX.planks, 1.2, 0.5), '#9a6a40')); tb.position.y = 0.48; stall.add(tb);
  for (const x of [-1.25, 1.25]) { const p = box(0.1, 2.6, 0.1, wood); p.position.set(x, 1.3, -1.0); stall.add(p); const p2 = box(0.1, 2.3, 0.1, wood); p2.position.set(x, 1.15, 0.55); stall.add(p2); }
  const awT = TEX.awning.clone(); awT.needsUpdate = true; awT.repeat.set(3, 1);
  const awGeo = new THREE.PlaneGeometry(2.9, 1.8, 12, 6); { const p = awGeo.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, -Math.sin((p.getX(i) / 2.9 + 0.5) * Math.PI * 6) * 0.03 - Math.pow(p.getY(i) / 0.9, 2) * 0.05); awGeo.computeVertexNormals(); }
  const aw = mesh(awGeo, std('#ffffff', { map: awT, side: THREE.DoubleSide, roughness: 0.9 })); aw.position.set(0, 2.45, -0.2); aw.rotation.x = -Math.PI / 2 + 0.25; stall.add(aw);
  const valGeo = new THREE.PlaneGeometry(2.9, 0.22, 24, 1); { const p = valGeo.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) < 0) p.setY(i, p.getY(i) + Math.abs(Math.sin(p.getX(i) * 10.8)) * 0.08); }
  const val = mesh(valGeo, std('#ffffff', { map: awT, side: THREE.DoubleSide })); val.position.set(0, 2.12, 0.68); stall.add(val);
  const sign = mesh(new THREE.PlaneGeometry(1.4, 0.7), std('#ffffff', { map: TEX.sign })); sign.position.set(0, 0.55, 0.52); sign.scale.setScalar(0.9); stall.add(sign);
  for (let i = 0; i < 5; i++) { const l = loaf(0.85, i % 2 ? 'boule' : 'loaf'); l.position.set(-1.05 + i * 0.22, 1.15, -0.25 + (i % 2) * 0.15); l.rotation.y = r(); stall.add(l); }
  const basket = mesh(new THREE.CylinderGeometry(0.35, 0.28, 0.25, 18, 1, true), std('#b08a4a', { side: THREE.DoubleSide })); basket.position.set(-0.85, 1.19, 0.2); stall.add(basket);
  for (let i = 0; i < 4; i++) { const l = loaf(0.6, 'bun'); l.position.set(-0.93 + (i % 2) * 0.16, 1.3 + Math.floor(i / 2) * 0.05, 0.15 + (i > 1 ? 0.1 : 0)); stall.add(l); }
  const scale = L.balanceScale(); scale.g.position.set(0.55, 1.06, 0.1); stall.add(scale.g);
  const pl = loaf(0.72); pl.position.y = -0.36; scale.pans[0].add(pl);
  const wt = mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.12, 14), std('#555', { metalness: 1, roughness: .35 })); wt.position.y = -0.33; scale.pans[1].add(wt);
  const wt2 = wt.clone(); wt2.position.set(0.05, -0.21, 0); wt2.scale.setScalar(0.7); scale.pans[1].add(wt2);
  const bakerT = makeChar({ body: '#8a5a3a', apron: true, hat: 'toque', mustache: true, buttons: false, belt: '#5a3a1e' }); S.add(bakerT.root);
  const insp = makeChar({ body: '#2b3f5c', hat: 'tophat', hatColor: '#1a1a20', bandColor: '#c9a227', monocle: true, buttonColor: '#c9a227', legLen: 1.05, collar: '#e8e4da' }); S.add(insp.root);
  const notes = mesh(new THREE.PlaneGeometry(0.3, 0.38), new THREE.MeshStandardMaterial({ map: TEX.notes, side: THREE.DoubleSide })); notes.position.set(0, 0.1, 0.1); notes.rotation.set(-1.0, 0, 0.2); insp.arms[0].hand.add(notes);
  const cane = new THREE.Group(); const cn = mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.0, 8), std('#222', { roughness: 0.3 })); cn.position.y = -0.45; cane.add(cn); cane.add(mesh(new THREE.SphereGeometry(0.04, 10, 8), std('#d4af37', { metalness: 0.9, roughness: 0.3 }))); insp.arms[1].hand.add(cane);
  // pelourinho
  const sq = new THREE.Group(); sq.position.set(-6, 0, 12); S.add(sq);
  const platf = box(3.6, 0.7, 2.6, stdT(repTex(TEX.planks, 1.5, 0.5), '#a07a50')); platf.position.y = 0.35; sq.add(platf);
  const stairs = box(1.2, 0.35, 0.6, stdT(repTex(TEX.planks, 0.6, 0.3), '#8a6a40')); stairs.position.set(1.0, 0.175, 1.6); sq.add(stairs);
  for (const s of [-1, 1]) { const p = box(0.22, 2.6, 0.22, stdT(repTex(TEX.planks, 0.2, 1), '#7a5a3a')); p.position.set(s * 0.95, 2.0, -0.1); sq.add(p); }
  const board = box(2.3, 0.42, 0.22, stdT(repTex(TEX.planks, 1, 0.3), '#a07a50')); board.position.set(0, 0.7 + 1.68, -0.1); sq.add(board);
  const hinge = box(0.1, 0.5, 0.25, std('#333', { metalness: 0.8, roughness: 0.4 })); hinge.position.set(-0.75, 2.38, -0.1); sq.add(hinge);
  const bakerP = makeChar({ body: '#8a5a3a', apron: true, hairCap: true, hair: '#3a2410', mustache: true, buttons: false, belt: '#5a3a1e' }); sq.add(bakerP.root);
  const splats = [];
  for (let i = 0; i < 3; i++) { const s = mesh(new THREE.SphereGeometry(0.1, 12, 8), std('#c81e10', { roughness: 0.3 })); s.scale.set(1.4, 1.0, 0.3); s.visible = false; bakerP.head.add(s); splats.push(s); }
  splats[0].position.set(0.18, 0.12, 0.45); splats[1].position.set(-0.25, -0.1, 0.4); splats[2].position.set(0.05, -0.28, 0.42);
  splats.forEach(s => s.lookAt(s.position.clone().multiplyScalar(2)));
  const boardSplats = []; for (let i = 0; i < 2; i++) { const s = mesh(new THREE.CircleGeometry(0.12, 10), std('#b81a0e', { roughness: 0.3 })); s.position.set(i ? 0.6 : -0.55, 2.4, 0.015); s.visible = false; sq.add(s); boardSplats.push(s); }
  const crowd = []; const cr = rng(99);
  const cols = ['#c0392b', '#2e86c1', '#27ae60', '#8e44ad', '#d68910', '#16a085', '#7f8c8d', '#a04000', '#1f618d', '#b03a2e'];
  const hats = ['cap', 'beret', 'bonnet', 'hood', null, 'cap', 'beret', 'hood', 'bonnet', null];
  for (let i = 0; i < 10; i++) {
    const c = makeChar({ body: cols[i], hat: hats[i], hatColor: ['#5a6a3a', '#6b2a2a', '#f2efe6', '#5a4030', '#334'][i % 5], hairCap: !hats[i], hair: ['#3a2410', '#c09040', '#1a1a1a'][i % 3], mustache: i % 3 === 0, beard: i === 7, legLen: 0.82 + cr() * 0.2, buttonColor: '#f2efe6', apron: i === 2 || i === 8, vest: i === 5 ? '#4a3a2a' : null });
    S.add(c.root); crowd.push(c);
  }
  const walkers = [makeChar({ body: '#6a8a3a', hat: 'hood', hatColor: '#5a4a3a', legLen: 0.9 }), makeChar({ body: '#9a3a5a', hat: 'bonnet', legLen: 0.85 })];
  walkers.forEach(w => S.add(w.root));
  const sack2 = L.sack(); sack2.scale.setScalar(0.45); sack2.position.set(0, -0.15, -0.36); walkers[0].torsoInner.add(sack2);
  const tomatoes = [];
  for (let i = 0; i < 4; i++) { const tm = L.tomato(); tm.visible = false; S.add(tm); tomatoes.push(tm); }
  const giveLoaf = loaf(0.85); S.add(giveLoaf);
  S.userData = { bakerT, insp, scale, bakerP, crowd, tomatoes, splats, boardSplats, sun, walkers, giveLoaf };
}
Object.values(scenes).forEach(S => { S.environment = envTex; S.environmentIntensity = 0.4; });

// =====================================================================
// PLANOS E ANIMAÇÃO
// =====================================================================
const LS = (i) => lines[i].start;
const shots = [];
const shot = (scene, a, b, cam, update) => shots.push({ scene, a, b, cam, update });
const B = scenes.bakery.userData, K = scenes.throne.userData, T = scenes.town.userData;

function resetAll(t) {
  L.charList.forEach(c => { c.noBlink = false; c.sweat = false; c.look = [0, 0]; c.root.visible = true; c.idleAmt = 1; c.setExpr('neutral'); c.apply(L.REST, t); });
  place(B.baker, 0.8, 0, 0, 0); B.customer.root.visible = false; B.heldLoaf.visible = false; B.loaf13.visible = false; B.sparkle.visible = false; B.loaf13.scale.setScalar(0.85);
  B.ovenLoaves.forEach(l => l.scale.setScalar(0.82));
  place(T.insp, 1.35, 0, 0.95, -1.0); place(T.bakerT, -0.2, 0, -0.95, 0);
  T.scale.beam.rotation.z = 0; T.scale.pans.forEach(p => p.rotation.z = 0);
  T.tomatoes.forEach(x => x.visible = false); T.splats.forEach(x => x.visible = false); T.boardSplats.forEach(x => x.visible = false); T.giveLoaf.visible = false;
  place(T.bakerP, 0, 0.7, -0.45);
  T.walkers.forEach(w => w.root.visible = false);
  T.crowd.forEach((c, i) => { const side = i % 2 ? 1 : -1, k = Math.floor(i / 2); const a = side * (0.2 + k * 0.14); const rr = 3.0 + (k % 2) * 0.9; const x = -6 + Math.sin(a) * rr, z = 12 + Math.cos(a) * rr; place(c, x, 0, z, angTo(x, z, -6, 12)); });
}
function crowdLaugh(c, i, t) {
  const j = Math.abs(Math.sin(t * (5 + i % 3) + i * 1.7));
  const up = i % 3 === 0, point = i % 3 === 1;
  c.apply(P({ armL: up ? { out: 0.5, fwd: 2.5 + Math.sin(t * 6 + i) * 0.3, elbow: -0.3 } : { out: 0.15, fwd: 0.9, elbow: -1.7 }, armR: point ? { out: 0.2, fwd: 1.45, elbow: -0.1 } : { out: 0.5, fwd: 2.4 + Math.cos(t * 6 + i) * 0.3, elbow: -0.4 }, lean: -0.1 + Math.sin(t * 5 + i) * 0.06, headX: -0.15, bob: j * 0.07, legL: { hip: 0, knee: j * 0.25 }, legR: { hip: 0, knee: j * 0.25 } }), t);
  c.setExpr('laugh');
}

// ---- 0. padaria: cheira o pão e se gaba ----
shot('bakery', 0, 2.9, { from: [[1.75, 2.15, 3.5], [0.8, 2.0, 0]], to: [[1.3, 2.1, 2.75], [0.8, 2.05, 0]], fov: 40 }, (t) => {
  const b = B.baker;
  b.apply(kf(t, [[0, P({ armR: { out: 0.25, fwd: 1.05, elbow: -1.15 }, armL: { out: 0.3, fwd: 0.2, elbow: -0.4 } })],
    [0.9, P({ armR: { out: -0.05, fwd: 1.35, elbow: -1.85 }, armL: { out: 0.3, fwd: 0.2, elbow: -0.4 }, headX: 0.15, lean: 0.05 })],
    [1.8, P({ armR: { out: -0.05, fwd: 1.35, elbow: -1.85 }, armL: { out: 0.3, fwd: 0.2, elbow: -0.4 }, headX: -0.12, lean: -0.05 })],
    [2.3, P({ armR: { out: 0.35, fwd: 1.25, elbow: -0.75 }, armL: { out: 0.5, fwd: 0.4, elbow: -1.6 }, headY: 0.15, headZ: 0.08 })]]), t);
  exprKeys(b, t, [[-1, 'smug'], [0.95, 'bliss'], [2.1, 'smug']]); b.look = [0.3, 0];
  B.heldLoaf.visible = true; B.heldLoaf.position.copy(handPos(b, 1)).add(new THREE.Vector3(0, 0.02, 0.08)); B.heldLoaf.rotation.set(0, 0.3, 0.35);
});
// ---- 1. padaria aberta: susto, o pão cai ----
const tRuin = wordT(0, 'ruin');
const ruinPose = (t) => kf(t, [[2.9, P({ armR: { out: 0.35, fwd: 1.25, elbow: -0.75 }, armL: { out: 0.5, fwd: 0.4, elbow: -1.6 }, headY: 0.15 })],
    [tRuin - 0.05, P({ armR: { out: 0.35, fwd: 1.25, elbow: -0.75 }, armL: { out: 0.5, fwd: 0.4, elbow: -1.6 }, headY: 0.3 })],
    [tRuin + 0.15, P({ armR: { out: 0.9, fwd: 1.9, elbow: -0.6 }, armL: { out: 0.9, fwd: 1.9, elbow: -0.6 }, lean: -0.15, squash: 0.06, headX: -0.1 })],
    [tRuin + 0.8, P({ armR: { out: 0.7, fwd: 1.5, elbow: -1.4 }, armL: { out: 0.7, fwd: 1.5, elbow: -1.4 }, lean: -0.05, headX: 0.05 })]]);
shot('bakery', 2.9, LS(1), { from: [[3.9, 2.1, 5.4], [-0.2, 1.5, -1.5]], to: [[3.45, 2.0, 4.7], [-0.2, 1.5, -1.5]], fov: 50 }, (t) => {
  const b = B.baker; const tRel = tRuin + 0.08;
  b.apply(ruinPose(tRel), tRel); const s0 = handPos(b, 1).add(new THREE.Vector3(0, 0.02, 0.08));
  b.apply(ruinPose(t), t);
  exprKeys(b, t, [[-1, 'smug'], [tRuin, 'shock']]); b.look = [0.4, 0];
  B.heldLoaf.visible = true;
  const end = new THREE.Vector3(1.75, 1.22, 1.05); const k = (t - tRel) / 0.42;
  if (k < 0) { B.heldLoaf.position.copy(handPos(b, 1)).add(new THREE.Vector3(0, 0.02, 0.08)); B.heldLoaf.rotation.set(0, 0.3, 0.35); }
  else if (k < 1) { B.heldLoaf.position.lerpVectors(s0, end, k); B.heldLoaf.position.y = lerp(s0.y, end.y, k * k) + Math.sin(k * Math.PI) * 0.15; B.heldLoaf.rotation.set(k * 3, 0.3, 0.35 + k * 2); }
  else { const dt = (k - 1) * 0.42; B.heldLoaf.position.copy(end); B.heldLoaf.position.y += Math.abs(Math.sin(dt * 14)) * 0.12 * Math.exp(-dt * 6); B.heldLoaf.rotation.set(3, 0.3, 2.35); }
});
// ---- 2. rei sentado ergue o decreto ----
const tLaw = wordT(1, 'law'), tPassed = wordT(1, 'passed');
const kingSit = (over = {}) => P({ legL: { hip: -1.5, knee: 1.5, out: 0.08 }, legR: { hip: -1.5, knee: 1.5, out: 0.08 }, ...over });
function kingBase(t) {
  place(K.king, 0, 0.93, -4.3, 0);
  K.guards.forEach((g, i) => { place(g, g.side * 2.2, 0.5, -3.6, -g.side * 0.25); const hold = { out: 0.15, fwd: 0.5, elbow: -1.0 }; g.apply(P({ armL: g.side < 0 ? hold : { out: 0.2 }, armR: g.side > 0 ? hold : { out: 0.2 }, sway: Math.sin(t * 0.6 + i) * 0.04, headY: Math.sin(t * 0.4 + i * 2) * 0.2 }), t); });
}
function scrollAt(t, hand, openT, euler) { const s = K.sc; s.position.copy(hand).add(new THREE.Vector3(0.0, 0.24, 0.12)); s.rotation.set(...euler); const k = Math.max(0.05, sstep((t - openT) / 0.5)); s.userData.paper.scale.y = k; s.userData.top.position.y = 0.51 * k; s.userData.bot.position.y = -0.51 * k; }
shot('throne', LS(1), 8.1, { from: [[0.9, 1.1, 2.0], [0, 2.4, -4.3]], to: [[0.55, 1.3, 0.2], [0, 2.6, -4.3]], fov: 42 }, (t) => {
  kingBase(t); const k = K.king;
  k.apply(kf(t, [[LS(1), kingSit({ armR: { out: 0.3, fwd: 0.6, elbow: -1.2 }, armL: { out: 0.35, fwd: 0.7, elbow: -1.0 }, lean: -0.05 })],
    [tPassed - 0.1, kingSit({ armR: { out: 0.3, fwd: 0.6, elbow: -1.2 }, armL: { out: 0.35, fwd: 0.7, elbow: -1.0 }, lean: 0.05 })],
    [tPassed + 0.5, kingSit({ armR: { out: 0.45, fwd: 2.2, elbow: -0.5 }, armL: { out: 0.35, fwd: 0.7, elbow: -1.0 }, lean: 0.12, headX: -0.15 })],
    [tLaw + 0.2, kingSit({ armR: { out: 0.4, fwd: 2.35, elbow: -0.35 }, armL: { out: 0.6, fwd: 1.2, elbow: -0.6 }, lean: 0.18, headX: -0.05 })]]), t);
  exprKeys(k, t, [[-1, 'smug'], [tLaw, 'angry']]); k.look = [0, 0.2];
  scrollAt(t, handPos(k, 1), tPassed + 0.3, [-0.1, 0, 0]);
});
// ---- 3. close no decreto 1266 ----
const tPenny = wordT(1, 'penny');
shot('throne', 8.1, LS(2), { from: [[1.7, 3.05, -0.8], [0.15, 2.95, -4.1]], to: [[1.45, 3.0, -1.35], [0.15, 2.95, -4.1]], fov: 38 }, (t) => {
  kingBase(t); const k = K.king;
  const tap = (t > tPenny - 0.1 && t < tPenny + 0.5) ? Math.max(0, Math.sin((t - tPenny + 0.1) / 0.6 * Math.PI * 3)) : 0;
  const pose = kf(t, [[8.1, kingSit({ armR: { out: 0.4, fwd: 2.0, elbow: -0.6 }, armL: { out: 0.6, fwd: 1.2, elbow: -0.6 }, lean: 0.12 })],
    [9.2, kingSit({ armR: { out: 0.4, fwd: 2.0, elbow: -0.6 }, armL: { out: 0.1, fwd: 1.55, elbow: -0.9 }, lean: 0.12, headY: 0.2 })]]);
  pose.armL.elbow -= tap * 0.25;
  k.apply(pose, t);
  exprKeys(k, t, [[-1, 'smug'], [8.9, 'angry'], [10.9, 'smug']]); k.look = [-0.5, 0.1];
  scrollAt(t, handPos(k, 1), 0, [-0.08, 0.32, 0.03]);
});
// ---- 4. inspetor chega andando ----
const inspPath = [[3.1, 2.3], [2.2, 1.5], [1.35, 0.95]];
function bakerNervous(t) { const b = T.bakerT; const wr = Math.sin(t * 7) * 0.12; b.sweat = true; b.apply(P({ armL: { out: -0.15, fwd: 1.0 + wr, elbow: -1.4 }, armR: { out: -0.15, fwd: 1.0 - wr, elbow: -1.4 }, headY: 0.35, lean: -0.05, sway: Math.sin(t * 3) * 0.03 }), t); b.setExpr('worried'); b.look = [0.7, 0]; }
function bgWalkers(t, t0) { T.walkers.forEach((wk, k) => { wk.root.visible = true; const p = pathAt(k ? [[-9, -3.2], [9, -3.6]] : [[8, -4.6], [-9, -4.2]], t, t0 + k * 0.6, 1.0); place(wk, p.x, 0, p.z, p.dir); wk.apply(walkPose(P(k ? {} : { armL: { out: 0.1, fwd: 2.6, elbow: -1.2 } }), p.phase, p.amt), t); }); }
shot('town', LS(2), 14.6, { from: [[2.2, 2.0, 7.6], [1.35, 1.75, 0.3]], to: [[1.8, 1.95, 6.6], [1.0, 1.8, 0.2]], fov: 48 }, (t) => {
  const w = pathAt(inspPath, t, 11.9, 1.3); const i = T.insp;
  place(i, w.x, 0, w.z, w.done ? kf(t, [[11.9 + w.T, w.dir], [11.9 + w.T + 0.4, -1.0]]) : w.dir);
  i.apply(walkPose(P({ armL: { out: 0.25, fwd: 0.9, elbow: -1.3 }, armR: { out: 0.25, fwd: 0.1, elbow: -0.2 }, headX: -0.1, lean: -0.06 }), w.phase, w.amt, 0.45), t); i.setExpr('smug');
  bakerNervous(t); bgWalkers(t, 11.0);
});
// ---- 5. a balança: o pão é leve demais (prato do pão sobe) ----
const tWeigh = wordT(2, 'weighing');
shot('town', 14.6, LS(3), { from: [[-0.5, 2.15, 2.6], [0.75, 1.8, 0.25]], to: [[-0.35, 2.1, 2.25], [0.75, 1.8, 0.25]], fov: 44 }, (t) => {
  const i = T.insp; const dt = t - tWeigh;
  const tip = dt < 0 ? 0 : -0.24 * (1 - Math.exp(-dt * 3.2)) + spring(dt, 12, 3.5) * 0.12;
  T.scale.beam.rotation.z = tip; T.scale.pans.forEach(p => p.rotation.z = -tip);
  const write = t > 15.5 ? Math.sin(t * 22) * 0.06 : 0;
  i.apply(kf(t, [[14.6, P({ armL: { out: 0.25, fwd: 0.9, elbow: -1.3 }, armR: { out: 0.3, fwd: 1.1, elbow: -0.3 }, headX: 0.2, lean: 0.1 })],
    [15.4, P({ armL: { out: 0.15, fwd: 1.1, elbow: -1.5 + write }, armR: { out: 0.2, fwd: 0.6, elbow: -1.2 }, headX: 0.25, lean: 0.12 })]]), t);
  exprKeys(i, t, [[-1, 'smug'], [tWeigh + 0.4, 'angry']]); i.look = [-0.3, 0.6];
  bakerNervous(t); exprKeys(T.bakerT, t, [[-1, 'worried'], [tWeigh + 0.5, 'shock']]);
});
// ---- 6. pelourinho: a multidão ri, um tomate erra ----
const tThrow1 = 18.55;
function pilloryBaker(t, hits = []) { const b = T.bakerP; let rec = 0; hits.forEach(h => rec += spring(t - h, 20, 5)); b.apply(P({ armL: { out: 1.45, fwd: 0, elbow: 0 }, armR: { out: 1.45, fwd: 0, elbow: 0 }, headZ: rec * 0.25, headX: -rec * 0.15, headY: Math.sin(t * 1.3) * 0.15 }), t); }
function thrower(c, t, tRel) {
  c.apply(kf(t, [[tRel - 0.9, P({ armR: { out: 0.3, fwd: 0.5, elbow: -0.6 } })], [tRel - 0.25, P({ armR: { out: 0.4, fwd: -0.9, elbow: -1.6 }, lean: -0.15, twist: -0.3 })], [tRel, P({ armR: { out: 0.3, fwd: 2.3, elbow: -0.2 }, lean: 0.2, twist: 0.25 })], [tRel + 0.5, P({ armR: { out: 0.3, fwd: 1.2, elbow: -0.4 }, lean: 0.05 })]]), t);
  c.setExpr(t < tRel + 0.2 ? 'smug' : 'laugh');
}
function flyTomato(tm, t, tRel, from, to, h = 1.0, dur = 0.5) { const k = (t - tRel) / dur; tm.visible = k > 0 && k < 1; if (tm.visible) { tm.position.copy(arcPos(from, to, k, h)); tm.rotation.set(t * 12, t * 7, 0); } return k >= 1; }
shot('town', LS(3), 19.6, { from: [[-6.4, 4.6, 21.5], [-6, 2.2, 12]], to: [[-6.3, 3.7, 19.4], [-6, 2.45, 12]], fov: 40 }, (t) => {
  exprKeys(T.bakerP, t, [[-1, 'shock'], [18.4, 'worried']]); T.bakerP.look = [0, 0.3];
  pilloryBaker(t);
  T.crowd.forEach((c, i) => { if (i === 1) thrower(c, t, tThrow1); else crowdLaugh(c, i, t); });
  const from = handPos(T.crowd[1], 1);
  if (flyTomato(T.tomatoes[0], t, tThrow1, from, new THREE.Vector3(-6.55, 2.42, 11.95), 1.2, 0.55)) T.boardSplats[0].visible = true;
});
// ---- 7. pelourinho de perto: tomatadas ----
const tG = wordT(3, 'garbage'); const hitTimes = [tG - 0.25, tG + 0.3, tG + 0.8];
shot('town', 19.6, LS(4), { from: [[-4.7, 3.0, 14.7], [-6, 2.65, 11.55]], to: [[-4.95, 2.95, 14.0], [-6, 2.65, 11.55]], fov: 42 }, (t) => {
  T.boardSplats[0].visible = true;
  pilloryBaker(t, hitTimes);
  exprKeys(T.bakerP, t, [[-1, 'worried'], [hitTimes[0], 'shock'], [hitTimes[1], 'shock'], [hitTimes[2] + 0.5, 'worried']]);
  T.crowd.forEach((c, i) => crowdLaugh(c, i, t));
  T.bakerP.root.updateMatrixWorld(true);
  hitTimes.forEach((h, i) => { const to = T.splats[i].getWorldPosition(new THREE.Vector3()); flyTomato(T.tomatoes[i + 1], t, h - 0.45, new THREE.Vector3(-4.6 - i * 0.7, 1.8, 15.0), to, 0.9, 0.45); T.splats[i].visible = t >= h; });
});
// ---- 8. "o problema?" ----
shot('bakery', LS(4), 24.2, { from: [[-0.7, 2.2, 3.3], [0.6, 2.0, 0]], to: [[-0.5, 2.15, 2.8], [0.6, 2.0, 0]], fov: 42 }, (t) => {
  const b = B.baker; place(b, 0.8, 0, 0, kf(t, [[LS(4), 0], [LS(4) + 0.6, -0.85]]));
  b.apply(kf(t, [[LS(4), P()], [LS(4) + 0.5, P({ armL: { out: -0.1, fwd: 1.3, elbow: -2.1 }, armR: { out: 0.3, fwd: 0.9, elbow: -1.6 }, headZ: 0.18, headY: -0.15 })]]), t);
  exprKeys(b, t, [[-1, 'neutral'], [LS(4) + 0.3, 'question']]); b.look = [-0.7, -0.2];
});
// ---- 9. forno: a massa encolhe ----
shot('bakery', 24.2, LS(5), { from: [[-2.0, 1.62, 0.35], [-2.6, 1.2, -1.7]], to: [[-2.2, 1.5, -0.25], [-2.6, 1.18, -1.7]], fov: 42 }, (t) => {
  const k = sstep((t - 24.4) / 2.2);
  B.ovenLoaves.forEach((l, i) => { const s = 0.82 * (1 - k * 0.3); l.scale.set(s * (1 + Math.sin(t * 3 + i) * 0.01), s * (1 - k * 0.1), s); });
});
// ---- 10. balcão: 12 + 1 ----
const tExtra = wordT(5, 'extra');
const custPath = [[-2.0, 2.6], [0.0, 1.85]];
shot('bakery', LS(5), LS(6), { from: [[1.9, 3.1, 5.4], [0.45, 1.6, 0.9]], to: [[1.7, 2.95, 4.8], [0.45, 1.65, 0.9]], fov: 46 }, (t) => {
  const b = B.baker;
  B.ovenLoaves.forEach(l => l.scale.setScalar(0.82 * 0.7));
  const cnt = clamp((t - 27.8) / 1.4); const stepK = Math.floor(cnt * 4) / 4 + sstep((cnt * 4) % 1) / 4;
  const countPose = P({ armR: { out: lerp(-0.35, 0.3, stepK), fwd: 1.05 - Math.abs(Math.sin(cnt * Math.PI * 4)) * 0.12, elbow: -0.7 }, armL: { out: 0.3, fwd: 0.25, elbow: -0.5 }, headX: 0.3, lean: 0.12 });
  const windPose = P({ armR: { out: 0.45, fwd: 0.6, elbow: -1.7 }, armL: { out: 0.35, fwd: 0.3, elbow: -0.5 }, headX: 0.1 });
  const tossPose = P({ armR: { out: 0.3, fwd: 1.6, elbow: -0.3 }, armL: { out: 0.35, fwd: 0.3, elbow: -0.5 }, headX: 0.15, lean: 0.06 });
  const happy = P({ armR: { out: 0.5, fwd: 1.0, elbow: -1.2 }, armL: { out: 0.5, fwd: 1.0, elbow: -1.2 }, headZ: 0.1 });
  const keysAt = (tt) => kf(tt, [[27.6, P()], [27.85, countPose], [29.2, countPose], [tExtra - 0.25, windPose], [tExtra + 0.05, tossPose], [tExtra + 0.7, happy]]);
  b.apply(keysAt(tExtra + 0.05), tExtra + 0.05); const relHand = handPos(b, 1).add(new THREE.Vector3(0, 0.05, 0.05));
  b.apply(keysAt(t), t);
  exprKeys(b, t, [[-1, 'neutral'], [tExtra - 0.2, 'smug'], [tExtra + 0.5, 'happy']]); b.look = [0, 0.7];
  const land = new THREE.Vector3(0.6, 1.36, 0.92);
  if (t > tExtra - 0.6) {
    B.loaf13.visible = true; const hp = handPos(b, 1);
    if (t < tExtra + 0.05) { B.loaf13.position.copy(hp).add(new THREE.Vector3(0, 0.05, 0.05)); B.loaf13.rotation.set(0, 0.3, 0.4); }
    else { const k = (t - tExtra - 0.05) / 0.45; const rel = relHand;
      if (k < 1) { B.loaf13.position.copy(arcPos(rel, land, k, 0.45)); B.loaf13.rotation.set(0, 0.3 + k * 3, 0.4 - k * 0.4); }
      else { const dt = (k - 1) * 0.45; B.loaf13.position.copy(land); B.loaf13.position.y += Math.abs(Math.sin(dt * 13)) * 0.1 * Math.exp(-dt * 6); B.loaf13.rotation.set(0, 3.3, 0); const sp = spring(dt, 25, 8); B.loaf13.scale.set(0.85 * (1 + sp * 0.15), 0.85 * (1 - sp * 0.2), 0.85); } }
  }
  const c = B.customer; c.root.visible = true; const w = pathAt(custPath, t, 27.6, 1.25);
  place(c, w.x, 0, w.z, w.done ? kf(t, [[27.6 + w.T, w.dir], [27.6 + w.T + 0.35, Math.PI]]) : w.dir);
  const jump = Math.max(0, Math.sin(clamp((t - tExtra - 0.55) / 0.5) * Math.PI));
  c.apply(walkPose(P({ armL: { out: 0.15, fwd: 0.7, elbow: -1.2 }, armR: jump > 0 ? { out: 0.6, fwd: 2.4 * jump, elbow: -0.3 } : { out: 0.2 }, rootY: jump * 0.25, squash: -jump * 0.05 }), w.phase, w.amt, 0.45), t);
  exprKeys(c, t, [[-1, 'neutral'], [tExtra + 0.45, 'happy']]); c.look = [0, -0.3];
});
// ---- 11. piscadinha ----
shot('bakery', LS(6), LS(7), { from: [[1.15, 2.2, 2.75], [0.8, 2.1, 0]], to: [[1.05, 2.2, 2.25], [0.8, 2.12, 0]], fov: 38 }, (t) => {
  const b = B.baker; b.noBlink = true; const s = LS(6);
  b.apply(kf(t, [[s, P({ armR: { out: 0.5, fwd: 1.0, elbow: -1.2 }, armL: { out: 0.5, fwd: 1.0, elbow: -1.2 } })], [s + 0.35, P({ armR: { out: 0.45, fwd: 1.45, elbow: -2.05, twist: 0.4 }, armL: { out: 0.25, fwd: 0.2, elbow: -0.4 }, headZ: -0.15, lean: -0.04 })]]), t);
  exprKeys(b, t, [[-1, 'smug'], [s + 0.3, 'wink']]);
  const k = clamp((t - s - 0.35) / 0.5); B.sparkle.visible = k > 0 && k < 1; if (B.sparkle.visible) { B.sparkle.position.copy(handPos(b, 1)).add(new THREE.Vector3(0.05, 0.12, 0.1)); B.sparkle.scale.setScalar(0.25 * Math.sin(k * Math.PI)); B.sparkle.material.rotation = k * 2; }
});
// ---- 12. final: todos vêm buscar pão ----
shot('town', LS(7), timing.duration + 1, { from: [[1.6, 2.0, 4.6], [0, 1.8, 0]], to: [[6.2, 5.8, 12.8], [0, 1.3, 0]], fov: 44 }, (t) => {
  const s0 = LS(7);
  const b = T.bakerT; b.setExpr('happy');
  const give = sstep((t - s0 - 0.6) / 0.6) * (1 - sstep((t - s0 - 2.2) / 0.5));
  b.apply(mix2(P({ armR: { out: 0.6, fwd: 2.3 + Math.sin(t * 5) * 0.2, elbow: -0.3 }, armL: { out: 0.6, fwd: 2.3 + Math.sin(t * 5 + 1) * 0.2, elbow: -0.3 }, bob: Math.abs(Math.sin(t * 5)) * 0.03 }), P({ armR: { out: 0.1, fwd: 1.5, elbow: -0.2 }, armL: { out: 0.5, fwd: 0.4 }, lean: 0.15 }), give), t);
  T.giveLoaf.visible = give > 0.05; if (T.giveLoaf.visible) T.giveLoaf.position.copy(handPos(b, 1)).add(new THREE.Vector3(0, 0.03, 0.1));
  const i = T.insp; place(i, 1.35, 0, 0.95, -0.7); i.setExpr('happy'); i.apply(P({ armR: { out: 0.3, fwd: 1.2, elbow: -1.6, twist: 0.4 }, armL: { out: 0.25, fwd: 0.6, elbow: -1.0 }, headX: Math.max(0, Math.sin(t * 4)) * 0.15 }), t);
  T.crowd.forEach((c, k) => {
    const side = k % 2 ? 1 : -1, n = Math.floor(k / 2);
    const target = [side * (1.9 + n * 0.75), 1.0 + n * 0.5 + (side > 0 ? 0.6 : 0)];
    const start = [side * (4.6 + n * 0.9), target[1] + 1.2 + n * 0.3];
    const t0 = s0 - 0.6 + n * 0.2;
    const w = pathAt([start, target], t, t0, 1.35);
    place(c, w.x, 0, w.z, w.done ? kf(t, [[t0 + w.T, w.dir], [t0 + w.T + 0.4, angTo(w.x, w.z, 0, 0)]]) : w.dir);
    const cheer = P({ armL: { out: 0.4, fwd: 2.3 + Math.sin(t * 6 + k) * 0.25, elbow: -0.4 }, armR: { out: 0.4, fwd: 2.2 + Math.cos(t * 6 + k) * 0.25, elbow: -0.4 }, bob: Math.abs(Math.sin(t * 5 + k)) * 0.06 });
    c.apply(walkPose(mix2(P(), cheer, 1 - w.amt), w.phase, w.amt, 0.45), t); c.setExpr(k % 2 ? 'happy' : 'laugh');
  });
  bgWalkers(t, s0 - 2);
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
  const k = clamp((t - g.t0) / 0.09); const s = 0.82 + 0.18 * easeOut(k) + Math.sin(k * Math.PI) * 0.04;
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
  resetAll(t); sh.update(t, lt); updaters[sh.scene].forEach(f => f(t));
  const e = ease(lt);
  camPos.lerpVectors(v3(sh.cam.from[0]), v3(sh.cam.to[0]), e);
  camTgt.lerpVectors(v3(sh.cam.from[1]), v3(sh.cam.to[1]), e);
  camPos.x += Math.sin(t * 1.1) * 0.01 + Math.sin(t * 2.3) * 0.004; camPos.y += Math.sin(t * 1.5) * 0.008;
  if (window.CAM) { camPos.set(...window.CAM[0]); camTgt.set(...window.CAM[1]); }
  camera.position.copy(camPos); camera.lookAt(camTgt);
  camera.rotation.z += Math.sin(t * 0.8) * 0.004;
  camera.fov = sh.cam.fov; camera.updateProjectionMatrix();
  if (sh.scene === 'town') { const s = T.sun; s.target.position.copy(camTgt); s.position.copy(camTgt).add(s.userData.offset); }
  L.charList.forEach(c => c.updateFace(t));
  grade.uniforms.time.value = t;
  renderPass.scene = S;
  composer.render();
  octx.drawImage(glCanvas, 0, 0, W, H);
  drawCaption(t);
}
await document.fonts.load('900 84px Inter');
window.renderAt = renderAt;
window.DURATION = timing.duration;
window.FPS = FPS;
window.frameData = (q = 0.92) => out.toDataURL('image/jpeg', q);
window.READY = true;
const qt = new URLSearchParams(location.search).get('t');
if (qt !== null) renderAt(parseFloat(qt));
else { const t0 = performance.now(); const loop = () => { renderAt(((performance.now() - t0) / 1000) % timing.duration); requestAnimationFrame(loop); }; loop(); }
