// Anúncio UGC vertical (1080 x 1920, 30 fps): página HTML animada por tempo, capturada quadro a quadro
// com o Playwright e montada com o ffmpeg junto da narração e da trilha.
// Uso: node anuncio/ugc/video.mjs   (antes: python3 narracao.py e musica.py, chamados por aqui mesmo)
import { chromium } from 'playwright';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, '../..');
const tmp = path.join(aqui, 'build');
const saida = path.join(aqui, 'anuncio-ugc-mente-ativa.mp4');
fs.mkdirSync(tmp, { recursive: true });

const FPS = 30, LARG = 1080, ALT = 1920;
const INICIO = 0.35, PAUSA = 0.32, FINAL = 2.4;

// ---------- áudio ----------
execFileSync('python3', [path.join(aqui, 'narracao.py'), tmp], { stdio: 'inherit' });
const falas = JSON.parse(fs.readFileSync(path.join(aqui, 'falas.json'), 'utf8'));
const dur = JSON.parse(fs.readFileSync(path.join(tmp, 'duracoes.json'), 'utf8'));

// Linha do tempo: cada fala começa após a anterior + pausa; palavras distribuídas pelo tamanho (pontuação pesa como pausa).
let t = INICIO;
const linha = falas.map((texto, i) => {
  const ini = t;
  const brutas = texto.split(/\s+/);
  const peso = (w) => w.replace(/[^\p{L}\d]/gu, '').length + 2 + (/[,.:…]$/.test(w) ? 4 : 0);
  const totalPeso = brutas.reduce((s, w) => s + peso(w), 0);
  const util = dur[i] - 0.2;
  let acc = 0.1;
  const palavras = brutas.map((w) => {
    const d = (peso(w) / totalPeso) * util;
    const p = { w, a: ini + acc, b: ini + acc + d };
    acc += d;
    return p;
  });
  t += dur[i] + PAUSA;
  return { ini, fim: ini + dur[i], palavras };
});
const TOTAL = linha.at(-1).fim + FINAL;

execFileSync('python3', [path.join(aqui, 'musica.py'), path.join(tmp, 'trilha.wav'), String(Math.ceil(TOTAL))], { stdio: 'inherit' });

// ---------- página ----------
const url = (p) => 'file://' + path.join(raiz, p);
const fonte = (peso) => url(`node_modules/@fontsource/fredoka/files/fredoka-latin-${peso}-normal.woff2`);
const img = {
  tablet: url('anuncio/imagens/mockup-tablet-capa.png'),
  leque: url('anuncio/imagens/mockup-paginas-leque.png'),
  mesa: url('anuncio/imagens/mockup-mesa-recortaveis.png'),
  oferta: url('pagina-de-vendas/img/oferta.webp'),
  pilha: url('pagina-de-vendas/img/kit-pilha.webp'),
};
const jogos = [
  ['sudoku', 'Sudoku', '03-sudoku'],
  ['caça-palavras', 'Caça-palavras', '04-caca-palavras'],
  ['quebra-cabeça', 'Quebra-cabeça', '05-quebra-cabeca'],
  ['dominó', 'Dominó', '07-domino-pecas'],
  ['xadrez', 'Xadrez', '09-xadrez-pecas'],
  ['bingo', 'Bingo', '10-bingo-cartelas'],
];

const coracao = (cor) => `<svg viewBox="-12 -12 24 24"><path d="M0 9 C-14 -1 -7 -13 0 -4 C7 -13 14 -1 0 9Z" fill="${cor}"/></svg>`;
const tv = `<svg viewBox="0 0 200 170" class="tv">
  <line x1="70" y1="10" x2="95" y2="40" stroke="#6b6b6b" stroke-width="6" stroke-linecap="round"/>
  <line x1="130" y1="10" x2="105" y2="40" stroke="#6b6b6b" stroke-width="6" stroke-linecap="round"/>
  <rect x="10" y="40" width="180" height="115" rx="18" fill="#5a5a5a"/>
  <rect x="24" y="52" width="130" height="91" rx="10" fill="#9a9a9a"/>
  ${[0, 1, 2, 3, 4, 5].map((k) => `<line x1="30" y1="${62 + k * 14}" x2="148" y2="${62 + k * 14}" stroke="#b9b9b9" stroke-width="5"/>`).join('')}
  <circle cx="172" cy="75" r="8" fill="#7b7b7b"/><circle cx="172" cy="100" r="8" fill="#7b7b7b"/>
</svg>`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: F; font-weight: 500; src: url(${fonte(500)}); }
@font-face { font-family: F; font-weight: 600; src: url(${fonte(600)}); }
@font-face { font-family: F; font-weight: 700; src: url(${fonte(700)}); }
* { box-sizing: border-box; margin: 0; }
body { width: ${LARG}px; height: ${ALT}px; overflow: hidden; background: #F3EEE6; font-family: F, 'Noto Color Emoji', sans-serif; color: #33302E; }
#camera { position: absolute; inset: 0; transform-origin: 50% 50%; }
.cena { position: absolute; inset: 0; opacity: 0; overflow: hidden; transform-origin: 50% 50%;
  background: #F3EEE6 radial-gradient(circle, rgba(224,122,95,.18) 3px, transparent 4px) 0 0 / 70px 70px; }
.cheia { position: absolute; inset: -60px; width: calc(100% + 120px); height: calc(100% + 120px); object-fit: cover; }
.adesivo { position: absolute; background: #fff; border: 5px solid #33302E; border-radius: 26px; padding: 18px 30px;
  font-weight: 700; box-shadow: 10px 10px 0 #33302E; white-space: nowrap; transform-origin: 50% 50%; }
.legenda { position: absolute; left: 60px; right: 60px; top: 1470px; text-align: center; z-index: 50; }
.legenda span.bloco { display: inline; background: #fff; box-decoration-break: clone; -webkit-box-decoration-break: clone;
  padding: 6px 22px; border-radius: 18px; font-size: 76px; font-weight: 700; line-height: 1.42; box-shadow: 0 8px 0 rgba(51,48,46,.25); }
.legenda .ativa { color: #E07A5F; }
.cartao { position: absolute; border-radius: 34px; overflow: hidden; border: 6px solid #33302E; box-shadow: 14px 14px 0 #33302E; }
.chip { position: absolute; font-weight: 700; font-size: 46px; padding: 10px 26px; border-radius: 999px; border: 4px solid #33302E; }
.pagina { position: absolute; left: 190px; top: 260px; width: 700px; border-radius: 14px; box-shadow: 0 30px 60px rgba(0,0,0,.28); transform-origin: 50% 60%; }
.coracao { position: absolute; width: 90px; height: 90px; }
.tv { width: 300px; }
</style></head><body><div id="camera">

<section class="cena" id="c0">
  <img class="cheia" id="c0img" src="${img.tablet}">
  <div class="adesivo" id="h1" style="left:70px; top:190px; font-size:64px; rotate:-3deg">achei o presente perfeito</div>
  <div class="adesivo" id="h2" style="left:140px; top:330px; font-size:64px; rotate:2deg; background:#F2C14E">pra minha mãe de 78 anos 🥹</div>
</section>

<section class="cena" id="c1">
  <div class="cartao" id="antes" style="left:70px; top:130px; width:940px; height:620px; background:#d9d6d2; filter:grayscale(1)">
    <div style="position:absolute; left:0; right:0; top:110px; text-align:center">${tv}</div>
    <div style="position:absolute; left:0; right:0; bottom:60px; text-align:center; font-size:58px; font-weight:600; color:#555">a tarde inteira na TV…</div>
  </div>
  <div class="chip" id="chipAntes" style="left:110px; top:95px; background:#9a9a9a; color:#fff">ANTES</div>
  <div class="cartao" id="agora" style="left:70px; top:810px; width:940px; height:620px; border-color:#E07A5F; box-shadow:14px 14px 0 #33302E">
    <img src="${img.mesa}" style="width:100%; height:100%; object-fit:cover; object-position:50% 35%">
  </div>
  <div class="chip" id="chipAgora" style="left:110px; top:775px; background:#F2C14E">AGORA ✨</div>
</section>

<section class="cena" id="c2">
  <img class="cheia" id="c2leque" src="${img.leque}">
  <div class="adesivo" id="contador" style="left:270px; top:230px; font-size:96px; rotate:-3deg; background:#E07A5F; color:#fff">63 páginas</div>
  ${jogos.map(([, nome, arq], k) => `<img class="pagina" id="p${k}" src="${url('anuncio/imagens/' + arq + '.png')}">
  <div class="adesivo" id="n${k}" style="left:0; top:150px; font-size:70px; background:${['#F2C14E', '#81B29A', '#E07A5F', '#F2C14E', '#81B29A', '#E07A5F'][k]}">${nome}</div>`).join('')}
</section>

<section class="cena" id="c3">
  <img class="cheia" id="c3img" src="${img.mesa}">
  <div class="adesivo" id="s0" style="left:70px; top:170px; font-size:62px; background:#F2C14E">1 · imprime 🖨️</div>
  <div class="adesivo" id="s1" style="left:70px; top:320px; font-size:62px; background:#81B29A">2 · recorta ✂️</div>
  <div class="adesivo" id="s2" style="left:70px; top:470px; font-size:62px; background:#E07A5F; color:#fff">3 · joga! 🎲</div>
  <div class="adesivo" id="k0" style="right:70px; top:760px; font-size:58px">✅ letra grande</div>
  <div class="adesivo" id="k1" style="right:70px; top:900px; font-size:58px">✅ nada infantil</div>
</section>

<section class="cena" id="c4">
  <img id="c4img" src="${img.oferta}" style="position:absolute; left:20px; top:260px; width:1040px">
  <div class="adesivo" id="bonus" style="left:300px; top:150px; font-size:110px; background:#F2C14E; rotate:-5deg">+ BÔNUS</div>
  <div class="adesivo" id="adorou" style="left:250px; top:1130px; font-size:64px; rotate:3deg; background:#81B29A">ela adorou 🥹❤️</div>
  ${Array.from({ length: 12 }, (_, k) => `<div class="coracao" id="h${k}">${coracao(['#E07A5F', '#F2C14E', '#81B29A'][k % 3])}</div>`).join('')}
</section>

<section class="cena" id="c5">
  <img id="c5img" src="${img.pilha}" style="position:absolute; left:150px; top:90px; width:780px">
  <div class="cartao" id="preco" style="left:110px; top:860px; width:860px; height:520px; background:#fff; text-align:center; padding-top:40px">
    <div style="font-size:50px; font-weight:600">Kit Mente Ativa + 2 bônus</div>
    <div style="font-size:54px; font-weight:500; color:#8a837d; margin-top:14px"><s>de R$ 62,98</s></div>
    <div style="font-size:150px; font-weight:700; color:#E07A5F; line-height:1.1">R$ 19,99</div>
    <div style="font-size:44px; font-weight:600; color:#4F8A6B">PDF para imprimir em casa</div>
  </div>
  <div class="adesivo" id="seta" style="left:240px; top:1640px; font-size:64px; background:#F2C14E">toque no link 👇</div>
</section>

<div class="legenda" id="legenda"></div>
</div>
<script>
const L = ${JSON.stringify(linha)}, TOTAL = ${TOTAL};
const jogos = ${JSON.stringify(jogos.map((j) => j[0]))};
const $ = (id) => document.getElementById(id);
const clamp = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => 1 - Math.pow(1 - clamp(x), 3);
// salto com leve passada do ponto (efeito "pop" de adesivo)
const pop = (x) => x <= 0 ? 0 : x >= 0.6 ? 1 : 1 - Math.exp(-9 * x) * Math.cos(13 * x);
const norm = (w) => w.toLowerCase().replace(/[^\\p{L}\\d-]/gu, '');
const quando = (i, alvo, k = 0) => { const ws = L[i].palavras.filter((p) => norm(p.w) === alvo); return (ws[k] || ws[0]).a; };
const inicios = L.map((f, i) => i === 0 ? 0 : f.ini - 0.12);
const aparece = (el, t0, t, giro = 0) => { const p = pop(t - t0); el.style.transform = 'scale(' + p + ') rotate(' + (1 - p) * giro + 'deg)'; el.style.opacity = t >= t0 ? 1 : 0; };

// legenda em blocos de até 3 palavras, quebrando na pontuação
const blocos = L.map((f) => { const bs = []; let b = []; f.palavras.forEach((p) => { b.push(p); if (b.length === 3 || /[,.:…]$/.test(p.w)) { bs.push(b); b = []; } }); if (b.length) bs.push(b); return bs; }).flat();

window.render = (t) => {
  // câmera na mão: tremidinha contínua
  $('camera').style.transform = 'translate(' + (5 * Math.sin(t * 1.7) + 3 * Math.sin(t * 4.1)).toFixed(2) + 'px,' + (6 * Math.sin(t * 1.3 + 1) + 2 * Math.sin(t * 5.3)).toFixed(2) + 'px) rotate(' + (0.35 * Math.sin(t * 0.9)).toFixed(3) + 'deg) scale(1.025)';
  let cena = 0; inicios.forEach((s, i) => { if (t >= s) cena = i; });
  document.querySelectorAll('.cena').forEach((el, i) => { el.style.opacity = i === cena ? 1 : 0; });
  const lt = t - inicios[cena];
  $('c' + cena).style.transform = 'scale(' + (1 + 0.07 * Math.exp(-lt * 9)) + ')';

  if (cena === 0) {
    $('c0img').style.transform = 'scale(' + (1.18 - 0.1 * ease(lt / 4)) + ')';
    aparece($('h1'), 0.15, t, -8); aparece($('h2'), 0.55, t, 8);
  }
  if (cena === 1) {
    const tA = quando(1, 'agora');
    aparece($('antes'), inicios[1], t); aparece($('chipAntes'), inicios[1] + 0.2, t, -10);
    aparece($('agora'), tA - 0.05, t); aparece($('chipAgora'), tA + 0.15, t, 10);
    $('antes').style.filter = 'grayscale(1) brightness(' + (t >= tA ? 0.75 : 1) + ')';
  }
  if (cena === 2) {
    const t0 = quando(2, 'sessenta');
    $('c2leque').style.transform = 'scale(' + (1.05 + 0.08 * ease(lt / 3)) + ')';
    aparece($('contador'), t0, t, -10);
    const n = Math.round(63 * ease((t - t0) / 1.1));
    $('contador').textContent = n + ' páginas';
    const ts = jogos.map((j) => quando(2, j));
    $('c2leque').style.opacity = t >= ts[0] - 0.05 ? 0.25 : 1;
    $('contador').style.display = t >= ts[0] - 0.05 ? 'none' : 'block';
    jogos.forEach((_, k) => {
      const p = $('p' + k), nome = $('n' + k), ativo = t >= ts[k] - 0.05, atual = ativo && (k === jogos.length - 1 || t < ts[k + 1] - 0.05);
      const d = t - (ts[k] - 0.05), y = (1 - ease(d / 0.25)) * 900;
      p.style.opacity = ativo ? 1 : 0;
      p.style.transform = 'translateY(' + y + 'px) rotate(' + ((k % 2 ? 5 : -5) + (k - 2.5)) + 'deg) scale(' + (atual ? 1 : 0.94) + ')';
      nome.style.display = atual ? 'block' : 'none';
      nome.style.left = (540 - nome.offsetWidth / 2) + 'px';
      aparece(nome, ts[k], t, k % 2 ? 6 : -6);
    });
  }
  if (cena === 3) {
    $('c3img').style.transform = 'scale(' + (1.1 + 0.08 * ease(lt / 5)) + ') translateY(' + (-40 * ease(lt / 5)) + 'px)';
    aparece($('s0'), quando(3, 'imprime'), t, -6); aparece($('s1'), quando(3, 'recorta'), t, 6); aparece($('s2'), quando(3, 'pronto'), t, -6);
    aparece($('k0'), quando(3, 'letra'), t, 6); aparece($('k1'), quando(3, 'infantil'), t, -6);
  }
  if (cena === 4) {
    const tb = quando(4, 'bônus'), ta = quando(4, 'adorou');
    $('c4img').style.transform = 'scale(' + (0.92 + 0.06 * ease(lt / 3)) + ')';
    aparece($('bonus'), tb, t, -14); aparece($('adorou'), ta, t, 10);
    for (let k = 0; k < 12; k++) {
      const h = $('h' + k), d = t - ta - k * 0.07;
      h.style.opacity = d > 0 ? clamp(1.6 - d) : 0;
      h.style.left = (90 + ((k * 337) % 900)) + 'px';
      h.style.top = (1500 - d * (380 + (k % 4) * 60)) + 'px';
      h.style.transform = 'rotate(' + (Math.sin(d * 4 + k) * 18) + 'deg) scale(' + (0.7 + (k % 3) * 0.25) + ')';
    }
  }
  if (cena === 5) {
    $('c5img').style.transform = 'translateY(' + (30 * (1 - ease(lt / 0.6))) + 'px) scale(' + (0.96 + 0.04 * ease(lt / 2)) + ')';
    aparece($('preco'), inicios[5] + 0.1, t);
    const tl = quando(5, 'link');
    aparece($('seta'), tl, t, -8);
    if (t > tl + 0.6) $('seta').style.transform = 'translateY(' + (Math.abs(Math.sin((t - tl) * 5)) * -22) + 'px)';
  }

  // legenda
  const leg = $('legenda');
  const b = blocos.find((bl) => t >= bl[0].a - 0.05 && t < bl.at(-1).b + 0.15);
  leg.innerHTML = b ? '<span class="bloco">' + b.map((p) => '<span class="' + (t >= p.a && t < p.b + 0.05 ? 'ativa' : '') + '">' + p.w + '</span>').join(' ') + '</span>' : '';
  leg.style.top = (cena === 5 ? 1410 : 1470) + 'px';
};
</script></body></html>`;

const pagina = path.join(tmp, 'video.html');
fs.writeFileSync(pagina, html);

const navegador = await chromium.launch();
const p = await navegador.newPage({ viewport: { width: LARG, height: ALT } });
await p.goto('file://' + pagina);
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(500);

// --previa: salva alguns quadros soltos (um por cena) para conferir o visual sem renderizar o vídeo todo
if (process.argv.includes('--previa')) {
  const marcas = linha.map((f) => f.fim - 0.3).concat(TOTAL - 0.1);
  for (const [k, tm] of marcas.entries()) {
    await p.evaluate((x) => window.render(x), tm);
    await p.screenshot({ path: path.join(tmp, `previa-${k}.png`) });
  }
  await navegador.close();
  console.log('prévias em', tmp);
  process.exit(0);
}

const quadros = Math.ceil(TOTAL * FPS);
const mudo = path.join(tmp, 'mudo.mp4');
const ff = spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '20', mudo], { stdio: ['pipe', 'inherit', 'inherit'] });
for (let f = 0; f < quadros; f++) {
  await p.evaluate((t) => window.render(t), f / FPS);
  const jpg = await p.screenshot({ type: 'jpeg', quality: 92 });
  if (!ff.stdin.write(jpg)) await new Promise((r) => ff.stdin.once('drain', r));
  if (f % 150 === 0) process.stdout.write(`quadro ${f}/${quadros}\n`);
}
ff.stdin.end();
await new Promise((r) => ff.on('close', r));
await navegador.close();

// mixagem: narração no tempo de cada fala, trilha baixa que abaixa ainda mais quando a voz entra
const entradas = linha.flatMap((_, i) => ['-i', path.join(tmp, `fala${i}.wav`)]);
const atrasos = linha.map((f, i) => `[${i + 2}:a]aresample=44100,adelay=${Math.round(f.ini * 1000)}:all=1[v${i}]`).join(';');
const filtro = `${atrasos};${linha.map((_, i) => `[v${i}]`).join('')}amix=inputs=${linha.length}:normalize=0,volume=1.6,apad,asplit[voz][chave];`
  + `[1:a]volume=0.32[mus];[mus][chave]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=400[musd];`
  + `[voz][musd]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[a]`;
execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', mudo, '-i', path.join(tmp, 'trilha.wav'), ...entradas,
  '-filter_complex', filtro, '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-t', TOTAL.toFixed(2), saida], { stdio: 'inherit' });
console.log(`OK: ${saida} (${TOTAL.toFixed(1)} s)`);
