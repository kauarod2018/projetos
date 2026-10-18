// Gera as imagens de apoio para o vídeo do anúncio (formato vertical 1080 x 1920).
// Uso: node anuncio/mockups.mjs (depois de `npm run build` e de exportar as páginas em anuncio/imagens)
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { writeFile, rm } from 'node:fs/promises';

const pasta = path.join(path.dirname(fileURLToPath(import.meta.url)), 'imagens');
const img = (n) => pathToFileURL(path.join(pasta, n)).href;

const madeira = `background: repeating-linear-gradient(92deg, #8A5A36 0 14px, #94633D 14px 30px, #7E5131 30px 41px, #9A6A43 41px 60px);`;
const fundoQuente = `background: radial-gradient(circle at 30% 20%, #F6E7D3 0, transparent 40%), radial-gradient(circle at 80% 75%, #E3ECE6 0, transparent 45%), #F3EEE6;`;

const tablet = (src, w) => `<div style="width:${w}px;padding:${w * 0.045}px;background:#1E1E22;border-radius:${w * 0.07}px;
  box-shadow:0 40px 80px rgba(0,0,0,.35), inset 0 0 0 3px #3A3A40"><img src="${src}" style="width:100%;display:block;border-radius:${w * 0.02}px"></div>`;

const folha = (src, w, x, y, giro) => `<img src="${src}" style="position:absolute;left:${x}px;top:${y}px;width:${w}px;transform:rotate(${giro}deg);
  box-shadow:0 18px 30px rgba(0,0,0,.35);border-radius:4px">`;

const cenas = {
  'mockup-tablet-capa.png': { w: 1080, h: 1920, html: `<div style="${fundoQuente}width:1080px;height:1920px;display:grid;place-items:center">${tablet(img('01-capa.png'), 820)}</div>` },
  'mockup-mesa-recortaveis.png': { w: 1080, h: 1920, html: `<div style="${madeira}width:1080px;height:1920px;position:relative;overflow:hidden">
    ${folha(img('05-quebra-cabeca.png'), 620, -60, 80, -8)}
    ${folha(img('09-xadrez-pecas.png'), 600, 470, 40, 7)}
    ${folha(img('07-domino-pecas.png'), 620, 60, 760, 4)}
    ${folha(img('10-bingo-cartelas.png'), 560, 540, 980, -6)}
  </div>` },
  'mockup-paginas-leque.png': { w: 1080, h: 1920, html: `<div style="${fundoQuente}width:1080px;height:1920px;position:relative;overflow:hidden">
    ${folha(img('03-sudoku.png'), 600, 40, 260, -12)}
    ${folha(img('04-caca-palavras.png'), 600, 440, 240, 10)}
    ${folha(img('11-quiz.png'), 600, 60, 1000, -5)}
    ${folha(img('06-tangram.png'), 600, 430, 960, 8)}
    ${folha(img('01-capa.png'), 560, 260, 560, 0)}
  </div>` },
  'mockup-produto-esquerda.png': { w: 540, h: 1920, transparente: true, html: `<div style="width:540px;height:1920px;position:relative">
    ${folha(img('07-domino-pecas.png'), 330, 150, 520, 9)}
    ${folha(img('05-quebra-cabeca.png'), 330, 40, 560, -7)}
    <div style="position:absolute;left:40px;top:640px">${tablet(img('01-capa.png'), 440)}</div>
    <div style="position:absolute;left:300px;top:1340px;width:210px;height:210px;border-radius:50%;background:#D9654B;color:#fff;
      display:grid;place-items:center;text-align:center;font:800 40px/1.05 Inter,sans-serif;transform:rotate(-10deg);
      box-shadow:0 0 0 10px #fff, 0 0 0 14px #DCD3C5, 0 20px 40px rgba(0,0,0,.25)">+ BÔNUS<br><span style="font-size:22px;font-weight:600">especiais</span></div>
  </div>` },
};

const navegador = await chromium.launch();
for (const [nome, { w, h, html, transparente }] of Object.entries(cenas)) {
  const aba = await navegador.newPage({ viewport: { width: w, height: h } });
  // Abre como arquivo local para o navegador conseguir carregar as imagens das páginas.
  const tmp = path.join(pasta, '_tmp.html');
  await writeFile(tmp, `<html><body style="margin:0;${transparente ? 'background:transparent' : ''}">${html}</body></html>`);
  await aba.goto(pathToFileURL(tmp).href, { waitUntil: 'load' });
  await rm(tmp);
  await aba.screenshot({ path: path.join(pasta, nome), omitBackground: !!transparente });
  await aba.close();
}
await navegador.close();
console.log('Mockups gerados em', pasta);
