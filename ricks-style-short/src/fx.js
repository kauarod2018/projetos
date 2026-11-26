// Infraestrutura compartilhada pelos episódios: renderer, pós-processamento, efeitos e legendas
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import * as L from './lib.js';
const { mesh, TEX, rng, clamp } = L;

export const W = 1080, H = 1920;
export function setupRenderer() {
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
      c *= vec3(1.02, 1.0, 0.97);
      vec2 d = vUv - 0.5; float v = smoothstep(0.9, 0.3, length(d * vec2(0.95, 1.05))); c *= mix(0.72, 1.0, v);
      float n = fract(sin(dot(vUv * vec2(1080.0, 1920.0) + time * 13.1, vec2(12.9898, 78.233))) * 43758.5453); c += (n - 0.5) * 0.02;
      gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0); }`,
  });
  composer.addPass(grade);
  const envTex = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  const out = document.getElementById('out'); out.width = W; out.height = H;
  return { renderer, camera, composer, renderPass, grade, envTex, glCanvas, out, octx: out.getContext('2d') };
}

export const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
export const v3 = (a) => new THREE.Vector3(...a);
export const place = (ch, x, y, z, ry = 0) => { ch.root.position.set(x, y, z); ch.root.rotation.y = ry; };
export const angTo = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);
export const handPos = (ch, i) => { ch.root.updateMatrixWorld(true); return ch.arms[i].hand.getWorldPosition(new THREE.Vector3()); };
export const arcPos = (a, b, k, h) => { const p = a.clone().lerp(b, k); p.y += Math.sin(clamp(k) * Math.PI) * h; return p; };
export const spring = (dt, f = 18, d = 6) => dt < 0 ? 0 : Math.exp(-dt * d) * Math.sin(dt * f);

export function sunLight(scene, pos, intensity = 3, color = '#fff2dd', size = 10) {
  const d = new THREE.DirectionalLight(color, intensity); d.position.set(...pos); d.castShadow = true;
  d.shadow.mapSize.set(2048, 2048); const c = d.shadow.camera; c.left = c.bottom = -size; c.right = c.top = size; c.near = 0.5; c.far = 120; d.shadow.bias = -0.0003; d.shadow.normalBias = 0.025; d.shadow.radius = 3;
  scene.add(d); scene.add(d.target); d.userData.offset = new THREE.Vector3(...pos); return d;
}
export function flame(scale = 1) {
  const g = new THREE.Group();
  const m1 = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff6a10').multiplyScalar(2.6), transparent: true, opacity: 0.85, depthWrite: false });
  const m2 = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd070').multiplyScalar(3.2), transparent: true, opacity: 0.95, depthWrite: false });
  const prof = (r, h) => { const pts = []; for (let i = 0; i <= 12; i++) { const y = i / 12; pts.push(new THREE.Vector2(r * Math.sin(Math.PI * Math.pow(1 - y, 1.6)) * Math.pow(1 - y, 0.3) + 0.001, y * h)); } return new THREE.LatheGeometry(pts, 14); };
  g.add(mesh(prof(0.17, 0.6), m1, { cast: false, recv: false }));
  const b = mesh(prof(0.09, 0.36), m2, { cast: false, recv: false }); b.position.z = 0.03; g.add(b);
  g.scale.setScalar(scale); g.userData.base = scale; return g;
}
export function flicker(f, t, k = 0) { const s = 1 + Math.sin(t * 17 + k) * 0.13 + Math.sin(t * 29 + k * 3) * 0.08; f.scale.y = f.userData.base * s; f.scale.x = f.userData.base * (1 - (s - 1) * 0.5); f.rotation.z = Math.sin(t * 11 + k) * 0.1; }
export function orientShaft(sh, from, to) { sh.position.copy(from); sh.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), to.clone().sub(from).normalize()); }
export const addMat = (color, op = 1) => new THREE.SpriteMaterial({ map: TEX.soft, color, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending });
export const smokeMat = (color = '#d8d8d8', op = 0.4) => new THREE.SpriteMaterial({ map: TEX.smoke, color, transparent: true, opacity: op, depthWrite: false });
export function dust(n, center, size, seed, color = '#fff3d8') {
  const r = rng(seed); const base = Array.from({ length: n }, () => [r() - .5, r() - .5, r() - .5, r() * 6, 0.012 + r() * 0.02]);
  return L.particles(n, addMat(color, 0.7), (s, i, t) => { const b = base[i]; s.position.set(center[0] + b[0] * size[0] + Math.sin(t * 0.3 + b[3]) * 0.15, center[1] + b[1] * size[1] + Math.sin(t * 0.2 + b[3] * 2) * 0.12, center[2] + b[2] * size[2] + Math.cos(t * 0.25 + b[3]) * 0.15); s.scale.setScalar(b[4] * (0.8 + Math.sin(t * 2 + b[3]) * 0.2)); s.material.opacity = 0.35 + 0.35 * Math.sin(t * 0.8 + b[3]); });
}
export function smoke(n, origin, seed, { life = 4, rise = 2.2, spread = 0.6, size = 0.5, grow = 1.6, color = '#d8d8d8', op = 0.35, wind = [0.4, 0] } = {}) {
  const r = rng(seed); const ph = Array.from({ length: n }, (_, i) => [i / n, r() * 6, r() - .5, r() - .5]);
  return L.particles(n, smokeMat(color, op), (s, i, t) => { const p = ph[i]; const age = ((t / life + p[0]) % 1); s.position.set(origin.x + p[2] * 0.2 + age * (wind[0] * life) + Math.sin(age * 4 + p[1]) * spread * age, origin.y + age * rise, origin.z + p[3] * 0.2 + age * wind[1] * life); s.scale.setScalar(size * (0.5 + age * grow)); s.material.opacity = op * Math.sin(age * Math.PI) * (1 - age * 0.3); s.material.rotation = p[1] + age; });
}
// folhas de outono caindo (meshes planos girando)
export function leaves(n, center, size, seed) {
  const r = rng(seed); const g = new THREE.Group(); const cols = ['#d2691e', '#e8a33a', '#b5401f', '#c8892a', '#8a3a1a'];
  const geo = new THREE.CircleGeometry(0.07, 5); geo.scale(1, 0.6, 1);
  const items = [];
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: cols[i % cols.length], side: THREE.DoubleSide, roughness: 0.8 })); m.castShadow = true; g.add(m); items.push([m, r() * 10, r(), r(), r() * 6, 0.5 + r() * 0.5]); }
  g.userData.update = (t) => items.forEach(([m, off, px, pz, ph, sp]) => { const age = ((t * 0.12 * sp + off) % 1); m.position.set(center[0] + (px - .5) * size[0] + Math.sin(t * 1.3 + ph) * 0.4 + age * 1.5, center[1] + size[1] * (1 - age), center[2] + (pz - .5) * size[2] + Math.cos(t + ph) * 0.3); m.rotation.set(t * 2 + ph, t * 1.5 + ph, t + ph); });
  return g;
}

// ---------- legendas palavra a palavra ----------
export function makeCaptions(lines, octx) {
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
  return (t) => {
    const g = groups.find(g => t >= g.t0 && t < g.t1); if (!g) return;
    const k = clamp((t - g.t0) / 0.09); let s = 0.82 + 0.18 * easeOut(k) + Math.sin(k * Math.PI) * 0.04;
    octx.save(); octx.font = '900 84px Inter';
    const wpx = octx.measureText(g.txt).width; if (wpx > W - 120) s *= (W - 120) / wpx;
    octx.translate(W / 2, H * 0.705); octx.scale(s, s);
    octx.textAlign = 'center'; octx.textBaseline = 'middle'; octx.lineJoin = 'round'; octx.miterLimit = 2;
    octx.shadowColor = 'rgba(0,0,0,0.55)'; octx.shadowBlur = 14; octx.shadowOffsetY = 4;
    octx.strokeStyle = '#000'; octx.lineWidth = 16; octx.strokeText(g.txt, 0, 0);
    octx.shadowColor = 'transparent'; octx.fillStyle = '#fff'; octx.fillText(g.txt, 0, 0);
    octx.restore();
  };
}

// ---------- laço de render por planos ----------
export function makeRenderer({ R, scenes, updaters, shots, resetAll, captions, sunFollow }) {
  const camPos = new THREE.Vector3(), camTgt = new THREE.Vector3();
  return (t) => {
    const sh = shots.find(s => t >= s.a && t < s.b) || shots[shots.length - 1];
    const lt = clamp((t - sh.a) / (sh.b - sh.a));
    resetAll(t); sh.update(t, lt); (updaters[sh.scene] || []).forEach(f => f(t));
    const e = (sh.cam.ease || ease)(lt);
    camPos.lerpVectors(v3(sh.cam.from[0]), v3(sh.cam.to[0]), e);
    camTgt.lerpVectors(v3(sh.cam.from[1]), v3(sh.cam.to[1]), e);
    const hh = sh.cam.shake ?? 1;
    camPos.x += (Math.sin(t * 1.1) * 0.01 + Math.sin(t * 2.3) * 0.004) * hh; camPos.y += Math.sin(t * 1.5) * 0.008 * hh;
    if (sh.cam.kick) { const k = sh.cam.kick(t); camPos.x += k * 0.03; camPos.y += k * 0.02; }
    if (window.CAM) { camPos.set(...window.CAM[0]); camTgt.set(...window.CAM[1]); }
    R.camera.position.copy(camPos); R.camera.lookAt(camTgt);
    R.camera.rotation.z += Math.sin(t * 0.8) * 0.004 * hh + (sh.cam.roll || 0);
    R.camera.fov = sh.cam.fov; R.camera.updateProjectionMatrix();
    if (sunFollow && sunFollow[sh.scene]) { const s = sunFollow[sh.scene]; s.target.position.copy(camTgt); s.position.copy(camTgt).add(s.userData.offset); }
    L.charList.forEach(c => c.updateFace(t));
    R.grade.uniforms.time.value = t;
    R.renderPass.scene = scenes[sh.scene];
    R.composer.render();
    R.octx.drawImage(R.glCanvas, 0, 0, W, H);
    captions(t);
  };
}
