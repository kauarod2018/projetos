// Gera as imagens da página de vendas a partir dos PDFs (rode depois de `npm run build`).
// Uso: npm run imagens:vendas
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdir, rm, writeFile, readdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(raiz, 'dist');
const pasta = path.join(raiz, 'pagina-de-vendas', 'img');

// [pdf, página, nome]
const paginas = [
  ['Kit-Mente-Ativa.pdf', 1, 'kit-capa'], ['Kit-Mente-Ativa.pdf', 3, 'kit-sumario'],
  ['Kit-Mente-Ativa.pdf', 5, 'kit-sudoku'], ['Kit-Mente-Ativa.pdf', 8, 'kit-sequencias'],
  ['Kit-Mente-Ativa.pdf', 12, 'kit-caca'], ['Kit-Mente-Ativa.pdf', 20, 'kit-quebra-serra'],
  ['Kit-Mente-Ativa.pdf', 22, 'kit-quebra-casario'], ['Kit-Mente-Ativa.pdf', 25, 'kit-tangram'],
  ['Kit-Mente-Ativa.pdf', 27, 'kit-palitos'], ['Kit-Mente-Ativa.pdf', 30, 'kit-domino'],
  ['Kit-Mente-Ativa.pdf', 32, 'kit-xadrez'], ['Kit-Mente-Ativa.pdf', 35, 'kit-xadrez-pecas'],
  ['Kit-Mente-Ativa.pdf', 36, 'kit-mates'], ['Kit-Mente-Ativa.pdf', 42, 'kit-bingo'],
  ['Kit-Mente-Ativa.pdf', 46, 'kit-quiz'], ['Kit-Mente-Ativa.pdf', 55, 'kit-conversa'],
  ['Bonus-1-Caderno-Extra-de-Passatempos.pdf', 1, 'b1-capa'], ['Bonus-1-Caderno-Extra-de-Passatempos.pdf', 15, 'b1-cruzadinha'],
  ['Bonus-1-Caderno-Extra-de-Passatempos.pdf', 22, 'b1-labirinto'], ['Bonus-1-Caderno-Extra-de-Passatempos.pdf', 26, 'b1-diferencas'],
  ['Bonus-2-Colorir-para-Relaxar.pdf', 1, 'b2-capa'], ['Bonus-2-Colorir-para-Relaxar.pdf', 4, 'b2-mandala'],
  ['Bonus-2-Colorir-para-Relaxar.pdf', 6, 'b2-vaso'], ['Bonus-2-Colorir-para-Relaxar.pdf', 9, 'b2-casinha'],
];

await rm(pasta, { recursive: true, force: true });
await mkdir(pasta, { recursive: true });
for (const [pdf, pg, nome] of paginas) {
  execFileSync('pdftoppm', ['-jpeg', '-jpegopt', 'quality=84', '-scale-to', '900', '-singlefile', '-f', String(pg), '-l', String(pg),
    path.join(dist, pdf), path.join(pasta, nome)], { stdio: 'ignore' });
}

// Mockups com fundo transparente.
const img = (n) => pathToFileURL(path.join(pasta, `${n}.jpg`)).href;
const tablet = (src, w) => `<div style="width:${w}px;padding:${w * 0.045}px;background:#1E1E22;border-radius:${w * 0.07}px;
  box-shadow:0 30px 60px rgba(60,20,30,.30), inset 0 0 0 3px #3A3A40"><img src="${src}" style="width:100%;display:block;border-radius:${w * 0.02}px"></div>`;
const folha = (src, w, x, y, giro, z = 0) => `<img src="${src}" style="position:absolute;left:${x}px;top:${y}px;width:${w}px;transform:rotate(${giro}deg);
  box-shadow:0 16px 34px rgba(60,20,30,.28);border-radius:6px;z-index:${z}">`;
const selo = (txt, x, y, cor, tam = 150) => `<div style="position:absolute;left:${x}px;top:${y}px;width:${tam}px;height:${tam}px;border-radius:50%;background:${cor};color:#fff;
  display:grid;place-items:center;text-align:center;font:800 ${tam * 0.2}px/1.05 Inter,sans-serif;transform:rotate(-10deg);z-index:9;
  box-shadow:0 0 0 7px #fff, 0 0 0 10px #DCD3C5, 0 14px 30px rgba(0,0,0,.22)">${txt}</div>`;

const mockups = {
  'hero.png': [1000, 900, `
    ${folha(img('b1-capa'), 360, 20, 210, -11)}
    ${folha(img('b2-capa'), 360, 620, 210, 11)}
    <div style="position:absolute;left:250px;top:40px;z-index:5">${tablet(img('kit-capa'), 500)}</div>
    ${selo('+2<br><span style="font-size:22px">BÔNUS</span>', 790, 640, '#D9654B', 160)}`],
  'kit-pilha.png': [900, 900, `
    ${folha(img('kit-quebra-casario'), 400, 40, 120, -9)}
    ${folha(img('kit-xadrez-pecas'), 400, 460, 110, 8)}
    <div style="position:absolute;left:225px;top:30px;z-index:5">${tablet(img('kit-capa'), 450)}</div>`],
  'b1-pilha.png': [800, 820, `
    ${folha(img('b1-labirinto'), 380, 30, 120, -8)}${folha(img('b1-cruzadinha'), 380, 390, 110, 8)}
    ${folha(img('b1-capa'), 420, 190, 40, 0, 5)}`],
  'b2-pilha.png': [800, 820, `
    ${folha(img('b2-mandala'), 380, 30, 120, -8)}${folha(img('b2-vaso'), 380, 390, 110, 8)}
    ${folha(img('b2-capa'), 420, 190, 40, 0, 5)}`],
  'oferta.png': [1000, 760, `
    ${folha(img('b1-capa'), 330, 30, 170, -10)}${folha(img('b2-capa'), 330, 640, 170, 10)}
    <div style="position:absolute;left:280px;top:20px;z-index:5">${tablet(img('kit-capa'), 440)}</div>`],
};

const navegador = await chromium.launch();
for (const [nome, [w, h, html]] of Object.entries(mockups)) {
  const aba = await navegador.newPage({ viewport: { width: w, height: h } });
  const tmp = path.join(pasta, '_tmp.html');
  await writeFile(tmp, `<html><body style="margin:0;background:transparent"><div style="position:relative;width:${w}px;height:${h}px">${html}</div></body></html>`);
  await aba.goto(pathToFileURL(tmp).href, { waitUntil: 'load' });
  const png = await aba.screenshot({ omitBackground: true });
  await rm(tmp);
  // Converte para WebP (mantém a transparência e pesa bem menos que PNG).
  const webp = await aba.evaluate(async (b64) => {
    const im = new Image();
    im.src = `data:image/png;base64,${b64}`;
    await im.decode();
    const cv = document.createElement('canvas');
    cv.width = im.width; cv.height = im.height;
    cv.getContext('2d').drawImage(im, 0, 0);
    return cv.toDataURL('image/webp', 0.86).split(',')[1];
  }, png.toString('base64'));
  await writeFile(path.join(pasta, nome.replace('.png', '.webp')), Buffer.from(webp, 'base64'));
  await aba.close();
}
await navegador.close();
console.log('Imagens da página de vendas:', (await readdir(pasta)).length);
