// Uso: node render.mjs preview t1,t2,...   |   node render.mjs video [fps]
import { createRequire } from 'module'; const require = createRequire(import.meta.url);
import http from 'http'; import fs from 'fs'; import path from 'path'; import { spawn } from 'child_process';
const { chromium } = require(process.env.PW || 'playwright');
const root = path.dirname(new URL(import.meta.url).pathname);
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.wav': 'audio/wav' };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': mime[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(0);
const port = srv.address().port;
const mode = process.argv[2] || 'preview';
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 540, height: 960 } });
p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text().slice(0, 3000)); });
p.on('pageerror', e => console.log('[pageerror]', e.message));
await p.goto(`http://localhost:${port}/index.html?t=0`);
await p.waitForFunction(() => window.READY === true, null, { timeout: 120000 });
const save = async (file, t) => { const d = await p.evaluate((t) => { window.renderAt(t); return window.frameData(0.9); }, t); fs.writeFileSync(file, Buffer.from(d.split(',')[1], 'base64')); };
fs.mkdirSync(path.join(root, 'build/preview'), { recursive: true });
if (process.env.CAM) await p.evaluate((c) => { window.CAM = JSON.parse(c); }, process.env.CAM);
if (mode === 'preview') { for (const f of fs.readdirSync(path.join(root, 'build/preview'))) fs.unlinkSync(path.join(root, 'build/preview', f));
  const ts = (process.argv[3] || '1,3,6,9,12,15,19,23,27,30,33,35').split(',').map(Number);
  for (const t of ts) { const s = Date.now(); await save(path.join(root, `build/preview/t${t.toFixed(2)}.jpg`), t); console.log('t', t, Date.now() - s, 'ms'); }
} else {
  const fps = +(process.argv[3] || 30); const dur = await p.evaluate(() => window.DURATION); const n = Math.ceil(dur * fps);
  const f0 = +(process.argv[4] || 0), f1 = Math.min(n, +(process.argv[5] || n)); const outName = process.argv[6] || 'build/video_noaudio.mp4';
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', path.join(root, outName)], { stdio: ['pipe', 'inherit', 'inherit'] });
  const st = Date.now();
  for (let i = f0; i < f1; i++) {
    const d = await p.evaluate((t) => { window.renderAt(t); return window.frameData(0.95); }, i / fps);
    if (!ff.stdin.write(Buffer.from(d.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 30 === 0) console.log(`frame ${i}/${f1}  ${((Date.now() - st) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
}
await b.close(); srv.close();
