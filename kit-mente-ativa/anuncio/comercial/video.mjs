// Comercial vertical (1080 x 1920, 30 fps): abre e fecha com o casal de idosos jogando à direita da tela e o produto
// com os bônus à esquerda, sobre um véu claro; no meio, as páginas por dentro e o "como funciona".
// A cena do casal vem de midia/casal.mp4 (ou .jpg/.png); veja midia/LEIA-ME.md.
// Uso: node anuncio/comercial/video.mjs            → anuncio/comercial/comercial-mente-ativa.mp4
//      node anuncio/comercial/video.mjs --previa   → um quadro por cena em anuncio/comercial/build/
import { chromium } from 'playwright';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, '../..');
const tmp = path.join(aqui, 'build');
const saida = path.join(aqui, 'comercial-mente-ativa.mp4');
const previa = process.argv.includes('--previa');
fs.mkdirSync(tmp, { recursive: true });

const FPS = 30, LARG = 1080, ALT = 1920;
const INICIO = 0.5, PAUSA = 0.45, FINAL = 3.2, FUSAO = 0.45;

// ---------- cena do casal ----------
const midia = path.join(aqui, 'midia');
const casalArq = ['casal.mp4', 'casal.mov', 'casal.webm', 'casal.jpg', 'casal.jpeg', 'casal.png'].map((a) => path.join(midia, a)).find((a) => fs.existsSync(a));
// casal.json (opcional): { "x": 0.5 posição do recorte vertical 9:16 dentro de um vídeo deitado (0 = esquerda, 1 = direita), "inicio": segundo do vídeo onde começar, "congelar": segundo do quadro do final }
const ajuste = { x: 0.5, inicio: 0, congelar: null, ...(fs.existsSync(path.join(midia, 'casal.json')) ? JSON.parse(fs.readFileSync(path.join(midia, 'casal.json'), 'utf8')) : {}) };
if (!casalArq && !previa) {
  console.error('Falta a cena do casal: coloque o vídeo ou a foto em anuncio/comercial/midia/casal.mp4 (ou .jpg/.png). Veja midia/LEIA-ME.md.');
  process.exit(1);
}
const ehVideo = casalArq && /\.(mp4|mov|webm)$/i.test(casalArq);
const PAINEL = 540; // largura da metade esquerda, onde fica o produto

// ---------- áudio ----------
const falasArq = path.join(aqui, 'falas.json');
execFileSync('python3', [path.join(aqui, '../ugc/narracao.py'), tmp, falasArq], { stdio: 'inherit' });
const falas = JSON.parse(fs.readFileSync(falasArq, 'utf8')).map((f) => (typeof f === 'string' ? f : f.texto));
const dur = JSON.parse(fs.readFileSync(path.join(tmp, 'duracoes.json'), 'utf8'));

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
const inicios = linha.map((f, i) => (i === 0 ? 0 : f.ini - 0.2));

if (!previa) execFileSync('python3', [path.join(aqui, '../ugc/musica.py'), path.join(tmp, 'trilha.wav'), String(Math.ceil(TOTAL))], { stdio: 'inherit' });

// Quadros do casal já recortados em 1080 x 1920 (o Chromium do Playwright não toca H.264).
const pastaCasal = path.join(tmp, 'casal');
let quadrosCasal = 0;
if (casalArq) {
  fs.rmSync(pastaCasal, { recursive: true, force: true });
  fs.mkdirSync(pastaCasal);
  const recorte = `scale=${LARG}:${ALT}:force_original_aspect_ratio=increase:flags=lanczos,crop=${LARG}:${ALT}:(iw-${LARG})*${ajuste.x}:(ih-${ALT})/2`;
  if (ehVideo) {
    const precisa = inicios[1] + FUSAO + 0.2;
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-ss', String(ajuste.inicio), '-i', casalArq, '-t', String(precisa), '-vf', `fps=${FPS},${recorte}`, '-q:v', '3', path.join(pastaCasal, 'f%04d.jpg')]);
    const congelar = ajuste.congelar ?? ajuste.inicio + precisa - 0.3;
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-ss', String(congelar), '-i', casalArq, '-frames:v', '1', '-vf', recorte, '-q:v', '2', path.join(pastaCasal, 'final.jpg')]);
    quadrosCasal = fs.readdirSync(pastaCasal).filter((a) => a.startsWith('f')).length;
  } else {
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', casalArq, '-vf', recorte, '-q:v', '2', path.join(pastaCasal, 'final.jpg')]);
  }
}

// ---------- página ----------
const url = (p) => 'file://' + (path.isAbsolute(p) ? p : path.join(raiz, p));
const fonte = (peso) => url(`node_modules/@fontsource/fredoka/files/fredoka-latin-${peso}-normal.woff2`);
const pg = (arq) => url(`anuncio/imagens/${arq}.png`);
const paginas = [
  ['sumario', '02-sumario', '24 jogos e desafios'],
  ['sudoku', '03-sudoku', 'Sudoku'],
  ['caça-palavras', '04-caca-palavras', 'Caça-palavras'],
  ['quebra-cabeças', '05-quebra-cabeca', 'Quebra-cabeças'],
  ['dominó', '07-domino-pecas', 'Dominó para recortar'],
  ['xadrez', '08-tabuleiro', 'Xadrez e damas'],
  ['bingo', '10-bingo-cartelas', 'Bingo das Canções'],
  ['letra', '11-quiz', 'Letra grande · regras simples'],
];
const passos = [
  ['recebe', 'mockup-tablet-capa', 'Receba o PDF na hora'],
  ['imprime', 'mockup-paginas-leque', 'Imprima em casa'],
  ['recorta', 'mockup-mesa-recortaveis', 'Recorte e jogue junto'],
];

// Produto + bônus montados em HTML para poderem entrar animados (cabe na metade esquerda).
const produto = (id) => `<div class="produto" id="${id}">
  <img class="bonus b1" src="${url('pagina-de-vendas/img/b1-capa.jpg')}">
  <img class="bonus b2" src="${url('pagina-de-vendas/img/b2-capa.jpg')}">
  <div class="tablet"><img src="${pg('01-capa')}"></div>
  <div class="selo"><b>+2</b><span>bônus</span></div>
</div>`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: F; font-weight: 500; src: url(${fonte(500)}); }
@font-face { font-family: F; font-weight: 600; src: url(${fonte(600)}); }
@font-face { font-family: F; font-weight: 700; src: url(${fonte(700)}); }
* { box-sizing: border-box; margin: 0; }
body { width: ${LARG}px; height: ${ALT}px; overflow: hidden; background: #F3EEE6; font-family: F, sans-serif; color: #33302E; }
.cena { position: absolute; inset: 0; opacity: 0; overflow: hidden;
  background: #F3EEE6 radial-gradient(circle, rgba(224,122,95,.14) 3px, transparent 4px) 0 0 / 70px 70px; }
.esq { position: absolute; left: 0; top: 0; width: ${PAINEL}px; height: 100%; }
.fundo { position: absolute; inset: 0; overflow: hidden; background: #d8cfc2; }
.fundo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transform-origin: 70% 45%; }
.fundo .vazio { position: absolute; left: ${PAINEL}px; right: 0; top: 0; bottom: 0; display: flex; align-items: center; justify-content: center; text-align: center;
  font-size: 40px; font-weight: 600; color: #6d655d; padding: 40px; border: 6px dashed #a99f93; }
/* véu claro do lado esquerdo, onde o produto fica por cima da cena */
.veu { position: absolute; inset: 0; background: linear-gradient(to right, rgba(243,238,230,.97) 0, rgba(243,238,230,.93) 34%, rgba(243,238,230,.55) 46%, rgba(243,238,230,0) 58%); }
.marca { position: absolute; left: 0; width: ${PAINEL}px; text-align: center; }
.marca small { display: block; font-size: 26px; letter-spacing: 6px; font-weight: 600; color: #4F8A6B; }
.marca b { display: block; font-size: 84px; color: #E07A5F; line-height: 1.05; }
.marca span { display: block; font-size: 32px; font-weight: 600; margin-top: 8px; }
.produto { position: absolute; left: 0; width: ${PAINEL}px; height: 760px; }
.produto .tablet { position: absolute; left: 100px; top: 200px; width: 340px; padding: 14px; background: #2b2a2c; border-radius: 34px; box-shadow: 0 30px 50px rgba(0,0,0,.25); }
.produto .tablet img { display: block; width: 100%; border-radius: 12px; }
.produto .bonus { position: absolute; top: 20px; width: 250px; border-radius: 10px; box-shadow: 0 18px 30px rgba(0,0,0,.2); }
.produto .b1 { left: 18px; } .produto .b2 { left: 272px; }
.produto .selo { position: absolute; left: 335px; top: 600px; width: 170px; height: 170px; border-radius: 50%; background: #E07A5F; color: #fff;
  border: 7px solid #fff; box-shadow: 0 12px 24px rgba(0,0,0,.2); display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: .95; }
.selo b { font-size: 72px; } .selo span { font-size: 36px; font-weight: 600; }
.folha { position: absolute; left: 110px; top: 150px; width: 860px; border-radius: 12px; box-shadow: 0 40px 70px rgba(0,0,0,.22); transform-origin: 50% 50%; }
.rotulo { position: absolute; left: 0; right: 0; top: 1395px; text-align: center; }
.rotulo span { display: inline-block; background: #33302E; color: #fff; font-size: 54px; font-weight: 700; padding: 14px 40px; border-radius: 999px; }
.passo { position: absolute; inset: 0; overflow: hidden; }
.passo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.passo .faixa { position: absolute; left: 0; right: 0; bottom: 0; height: 900px; background: linear-gradient(to top, rgba(40,36,33,.94) 45%, rgba(40,36,33,0)); }
.passo .txt { position: absolute; left: 80px; right: 80px; top: 1380px; color: #fff; display: flex; gap: 34px; align-items: center; }
.passo .num { flex: none; width: 140px; height: 140px; border-radius: 50%; background: #F2C14E; color: #33302E; font-size: 84px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.passo .txt div:last-child { font-size: 70px; font-weight: 700; line-height: 1.05; }
.cabecalho { position: absolute; left: 0; right: 0; top: 110px; text-align: center; z-index: 5; }
.cabecalho span { display: inline-block; background: #fff; border: 5px solid #33302E; box-shadow: 8px 8px 0 #33302E; font-size: 52px; font-weight: 700; padding: 10px 36px; border-radius: 999px; }
.preco { position: absolute; left: 40px; width: 460px; top: 1080px; background: #fff; border-radius: 30px; border: 5px solid #33302E; box-shadow: 10px 10px 0 #33302E; text-align: center; padding: 26px 10px; }
.preco s { font-size: 40px; color: #8a837d; font-weight: 500; }
.preco b { display: block; font-size: 104px; color: #E07A5F; line-height: 1.05; }
.preco span { display: block; font-size: 30px; font-weight: 600; color: #4F8A6B; }
.botao { position: absolute; left: 140px; right: 140px; top: 1520px; z-index: 5; background: #4F8A6B; color: #fff; text-align: center; font-size: 60px; font-weight: 700; padding: 26px; border-radius: 999px; box-shadow: 0 10px 0 #33302E; }
.legenda { position: absolute; left: 70px; right: 70px; top: 1700px; text-align: center; z-index: 20; }
.legenda span { background: rgba(40,36,33,.82); color: #fff; box-decoration-break: clone; -webkit-box-decoration-break: clone; padding: 6px 20px; border-radius: 14px; font-size: 50px; font-weight: 600; line-height: 1.45; }
</style></head><body>

<section class="cena" id="c0">
  <div class="esq" style="z-index:2">
    <div class="marca" style="top:170px"><small>COLEÇÃO</small><b>Mente Ativa</b><span>jogos para imprimir<br>e jogar junto</span></div>
    ${produto('prod0').replace('class="produto"', 'class="produto" style="top:470px"')}
  </div>
  <div class="fundo">${casalArq ? `<img id="casal0" src="">` : '<div class="vazio">cena do casal<br>(aguardando a mídia)</div>'}</div>
  <div class="veu"></div>
</section>

<section class="cena" id="c1">
  ${paginas.map(([, arq], k) => `<img class="folha" id="f${k}" src="${pg(arq)}">`).join('')}
  <div class="rotulo"><span id="rot1"></span></div>
</section>

<section class="cena" id="c2">
  ${passos.map(([, arq, txt], k) => `<div class="passo" id="p${k}"><img src="${url('anuncio/imagens/' + arq + '.png')}"><div class="faixa"></div>
    <div class="txt"><div class="num">${k + 1}</div><div>${txt}</div></div></div>`).join('')}
  <div class="cabecalho"><span>Como funciona</span></div>
</section>

<section class="cena" id="c3">
  <div class="esq" style="z-index:2">
    <div class="marca" style="top:110px"><small>COLEÇÃO</small><b>Mente Ativa</b></div>
    ${produto('prod3').replace('class="produto"', 'class="produto" style="top:250px; transform:scale(.9)"')}
    <div class="preco" id="preco"><s>de R$ 62,98</s><b>R$ 19,99</b><span>kit + 2 bônus · PDF</span></div>
  </div>
  <div class="fundo">${casalArq ? `<img id="casal3" src="${url(path.join(pastaCasal, 'final.jpg'))}">` : '<div class="vazio">cena do casal<br>(aguardando a mídia)</div>'}</div>
  <div class="veu"></div>
  <div class="botao" id="botao">Garanta o seu ›</div>
</section>

<div class="legenda" id="legenda"></div>
<script>
const L = ${JSON.stringify(linha)}, TOTAL = ${TOTAL}, INI = ${JSON.stringify(inicios)}, FUSAO = ${FUSAO};
const paginas = ${JSON.stringify(paginas.map((p) => p[0]))}, rotulos = ${JSON.stringify(paginas.map((p) => p[2]))};
const passos = ${JSON.stringify(passos.map((p) => p[0]))};
const casal = { video: ${!!ehVideo}, quadros: ${quadrosCasal}, pasta: ${JSON.stringify(url(pastaCasal))} };
const $ = (id) => document.getElementById(id);
const clamp = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const saida = (x) => 1 - Math.pow(1 - clamp(x), 3);
const pop = (x) => x <= 0 ? 0 : x >= 0.7 ? 1 : 1 - Math.exp(-8 * x) * Math.cos(11 * x);
const norm = (w) => w.toLowerCase().replace(/[^\\p{L}\\d-]/gu, '');
const quando = (i, alvo) => { const p = L[i].palavras.find((p) => norm(p.w).startsWith(alvo)); return p ? p.a : INI[i]; };
const entra = (el, t0, t, dy = 40) => { const p = saida((t - t0) / 0.5); el.style.opacity = p; el.style.transform = 'translateY(' + (1 - p) * dy + 'px)'; };

// legenda em blocos de até 5 palavras, quebrando na pontuação
const blocos = L.map((f) => { const bs = []; let b = []; f.palavras.forEach((p) => { b.push(p); if (b.length === 5 || /[,.:…]$/.test(p.w)) { bs.push(b); b = []; } }); if (b.length) bs.push(b); return bs; }).flat();

function produto(id, t, t0, tBonus) {
  const el = $(id), tab = el.querySelector('.tablet'), b1 = el.querySelector('.b1'), b2 = el.querySelector('.b2'), selo = el.querySelector('.selo');
  const p = saida((t - t0) / 0.7);
  tab.style.opacity = p; tab.style.transform = 'translateY(' + (1 - p) * 80 + 'px)';
  const q = saida((t - tBonus) / 0.6);
  b1.style.opacity = q; b1.style.transform = 'translateX(' + (1 - q) * 120 + 'px) rotate(' + (-9 * q) + 'deg)';
  b2.style.opacity = q; b2.style.transform = 'translateX(' + (q - 1) * 120 + 'px) rotate(' + (9 * q) + 'deg)';
  const s = pop((t - tBonus - 0.25) * 1.2);
  selo.style.opacity = s > 0 ? 1 : 0; selo.style.transform = 'scale(' + s + ') rotate(' + (-12 + 12 * s) + 'deg)';
}

window.render = async (t) => {
  // fusão entre cenas
  document.querySelectorAll('.cena').forEach((el, i) => {
    const ini = INI[i], fim = i + 1 < INI.length ? INI[i + 1] : 1e9;
    el.style.opacity = i === 0 ? (t < fim ? 1 : clamp(1 - (t - fim) / FUSAO)) : clamp((t - ini) / FUSAO) * (t < fim ? 1 : clamp(1 - (t - fim) / FUSAO));
    el.style.zIndex = i;
  });
  const espera = [];

  // 1 · tela dividida: produto à esquerda, casal à direita
  if (t < INI[1] + FUSAO) {
    produto('prod0', t, 0.15, quando(0, 'bônus') - 0.1);
    entra(document.querySelector('#c0 .marca'), 0.05, t);
    const img = $('casal0');
    if (img) {
      const alvo = casal.video ? casal.pasta + '/f' + String(Math.min(casal.quadros, Math.floor(t * ${FPS}) + 1)).padStart(4, '0') + '.jpg' : casal.pasta + '/final.jpg';
      if (img.getAttribute('src') !== alvo) { img.setAttribute('src', alvo); espera.push(img.decode().catch(() => {})); }
      img.style.transform = 'scale(' + (1.04 + 0.06 * (t / (INI[1] + FUSAO))) + ')';
    }
  }

  // 2 · por dentro: páginas passando, cada uma no momento em que é falada
  if (t >= INI[1] - 0.1 && t < INI[2] + FUSAO) {
    const ts = paginas.map((p, k) => k === 0 ? INI[1] : quando(1, p) - 0.12);
    let atual = 0; ts.forEach((x, k) => { if (t >= x) atual = k; });
    paginas.forEach((_, k) => {
      const el = $('f' + k), d = t - ts[k], prox = k + 1 < ts.length ? t - ts[k + 1] : -1;
      const ent = saida(d / 0.45), sai = saida(prox / 0.45);
      el.style.opacity = d < 0 ? 0 : (prox > 0.5 ? 0 : 1);
      const dur = (k + 1 < ts.length ? ts[k + 1] : INI[2]) - ts[k];
      let zoom = 1 + 0.04 * clamp(d / Math.max(dur, .1));
      if (paginas[k] === 'letra') zoom = 1 + 0.7 * ease(d / 1.4);   // aproxima para mostrar o tamanho da letra
      el.style.transformOrigin = paginas[k] === 'letra' ? '30% 32%' : '50% 50%';
      el.style.transform = 'translateX(' + ((1 - ent) * 1000 - sai * 1100) + 'px) rotate(' + ((1 - ent) * 8 - sai * 6) + 'deg) scale(' + zoom + ')';
      el.style.zIndex = k;
    });
    const r = $('rot1'), dr = t - ts[atual];
    r.textContent = rotulos[atual];
    r.style.transform = 'scale(' + (0.85 + 0.15 * saida(dr / 0.3)) + ')'; r.style.opacity = saida(dr / 0.25);
  }

  // 3 · como funciona: três passos em tela cheia
  if (t >= INI[2] - 0.1 && t < INI[3] + FUSAO) {
    const ts = passos.map((p, k) => k === 0 ? INI[2] : quando(2, p) - 0.1);
    passos.forEach((_, k) => {
      const el = $('p' + k), d = t - ts[k];
      const ent = saida(d / 0.5);
      el.style.opacity = d < 0 ? 0 : 1;
      el.style.clipPath = 'inset(' + (1 - ent) * 100 + '% 0 0 0)';
      el.querySelector('img').style.transform = 'scale(' + (1.12 - 0.07 * clamp(d / 3)) + ')';
      const txt = el.querySelector('.txt'), q = saida((d - 0.2) / 0.45);
      txt.style.opacity = q; txt.style.transform = 'translateX(' + (1 - q) * -80 + 'px)';
    });
  }

  // 4 · final: tela dividida com preço e chamada
  if (t >= INI[3] - 0.1) {
    const lt = t - INI[3];
    produto('prod3', t, INI[3] + 0.1, INI[3] + 0.3);
    entra(document.querySelector('#c3 .marca'), INI[3], t);
    entra($('preco'), INI[3] + 0.5, t, 60);
    const b = $('botao'), q = saida((t - quando(3, 'garanta')) / 0.4);
    b.style.opacity = q;
    b.style.transform = 'scale(' + ((0.8 + 0.2 * q) * (1 + 0.035 * Math.sin(Math.max(0, lt - 1) * 6))) + ')';
    const img = $('casal3'); if (img) img.style.transform = 'scale(' + (1.04 + 0.04 * clamp(lt / 6)) + ')';
  }

  // legenda
  const leg = $('legenda');
  const bl = blocos.find((b) => t >= b[0].a - 0.05 && t < b.at(-1).b + 0.2);
  leg.innerHTML = bl ? '<span>' + bl.map((p) => p.w).join(' ') + '</span>' : '';
  await Promise.all(espera);
};
</script></body></html>`;

const pagina = path.join(tmp, 'comercial.html');
fs.writeFileSync(pagina, html);

const navegador = await chromium.launch();
const p = await navegador.newPage({ viewport: { width: LARG, height: ALT } });
await p.goto('file://' + pagina);
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(500);

if (previa) {
  const marcas = [1.0, linha[0].fim - 0.3, quando(1, 'sudoku') + 0.4, quando(1, 'bingo') + 0.4, linha[1].fim - 0.2, linha[2].ini + 1, linha[2].fim - 0.3, TOTAL - 0.2];
  for (const [k, tm] of marcas.entries()) {
    await p.evaluate((x) => window.render(x), tm);
    await p.screenshot({ path: path.join(tmp, `previa-${k}.png`) });
  }
  await navegador.close();
  console.log('prévias em', tmp);
  process.exit(0);
}
function quando(i, alvo) {
  const n = (w) => w.toLowerCase().replace(/[^\p{L}\d-]/gu, '');
  return (linha[i].palavras.find((x) => n(x.w).startsWith(alvo)) ?? { a: linha[i].ini }).a;
}

const quadros = Math.ceil(TOTAL * FPS);
const mudo = path.join(tmp, 'mudo.mp4');
const ff = spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '19', mudo], { stdio: ['pipe', 'inherit', 'inherit'] });
for (let f = 0; f < quadros; f++) {
  await p.evaluate((x) => window.render(x), f / FPS);
  const jpg = await p.screenshot({ type: 'jpeg', quality: 92 });
  if (!ff.stdin.write(jpg)) await new Promise((r) => ff.stdin.once('drain', r));
  if (f % 150 === 0) process.stdout.write(`quadro ${f}/${quadros}\n`);
}
ff.stdin.end();
await new Promise((r) => ff.on('close', r));
await navegador.close();

// mixagem: narração no tempo de cada fala e trilha baixa que abaixa ainda mais quando a voz entra
const entradas = linha.flatMap((_, i) => ['-i', path.join(tmp, `fala${i}.wav`)]);
const atrasos = linha.map((f, i) => `[${i + 2}:a]aresample=44100,adelay=${Math.round(f.ini * 1000)}:all=1[v${i}]`).join(';');
const filtro = `${atrasos};${linha.map((_, i) => `[v${i}]`).join('')}amix=inputs=${linha.length}:normalize=0,volume=1.6,apad,asplit[voz][chave];`
  + `[1:a]volume=0.28[mus];[mus][chave]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=400[musd];`
  + `[voz][musd]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[a]`;
execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', mudo, '-i', path.join(tmp, 'trilha.wav'), ...entradas,
  '-filter_complex', filtro, '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-t', TOTAL.toFixed(2), saida], { stdio: 'inherit' });
console.log(`OK: ${saida} (${TOTAL.toFixed(1)} s)`);
