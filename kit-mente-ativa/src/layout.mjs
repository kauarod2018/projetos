// Layout comum do kit e dos bônus: moldura florida, estilo e geração do PDF com revisão de layout.
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { canto, flor } from './flores.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fonte = (pacote, arq) => pathToFileURL(path.join(raiz, 'node_modules/@fontsource', pacote, 'files', arq)).href;

// Fundo estampado com florzinhas na cor da parte.
export function estampa(id, tint, medio) {
  return `<svg class="estampa" preserveAspectRatio="none"><defs><pattern id="e${id}" width="22" height="22" patternUnits="userSpaceOnUse">
    <g opacity=".75">${flor(6, 6, 5, medio, { miolo: '#FFFFFF' })}</g><circle cx="17" cy="17" r="1.6" fill="${medio}"/>
    <circle cx="17" cy="5" r=".9" fill="${medio}"/><circle cx="5" cy="17" r=".9" fill="${medio}"/></pattern></defs>
    <rect width="100%" height="100%" fill="${tint}"/><rect width="100%" height="100%" fill="url(#e${id})"/></svg>`;
}

// Selo com o número da página dentro de uma flor.
export function selo(n, cor, medio) {
  const petalas = Array.from({ length: 8 }, (_, i) => `<ellipse cx="0" cy="-10" rx="6" ry="8" transform="rotate(${i * 45})" fill="${medio}"/>`).join('');
  return `<svg viewBox="-20 -20 40 40" class="selo">${petalas}<circle r="11" fill="${cor}"/><circle r="11" fill="none" stroke="#FFFFFF" stroke-width="1.2" stroke-dasharray="1.6 1.4"/>
    <text y="4" text-anchor="middle">${n}</text></svg>`;
}

// Moldura comum a todas as páginas: fundo estampado, cartão central, cantos floridos e rodapé.
export function molduraPagina(corpo, { est, numero: num, marca, frase = 'jogar junto é cuidar', classe = '', rotulo = '', titulo = '', rodape = true }) {
  const fita = rotulo ? `<div class="fita"><span>${rotulo}</span>${titulo ? `<em>${titulo}</em>` : ''}</div>` : '';
  return `<section class="page ${classe}" style="--cor:${est.cor};--tint:${est.tint};--medio:${est.medio}">
    ${estampa(num, est.tint, est.medio)}
    <div class="cartao">${fita}<div class="miolo">${corpo}</div></div>
    <div class="canto-se">${canto(est.flores, num * 3)}</div><div class="canto-id">${canto([est.flores[1], est.flores[2], est.flores[0]], num * 3 + 1)}</div>
    <div class="canto-sd">${canto([est.flores[2], est.flores[0], est.flores[1]], num * 3 + 2)}</div><div class="canto-ie">${canto(est.flores, num * 3 + 5)}</div>
    ${rodape ? `<footer><span class="marca">${marca}</span>${selo(num, est.cor, est.medio)}<span class="frase">${frase}</span></footer>` : ''}
  </section>`;
}

export const css = `
@font-face { font-family: 'Lora'; font-weight: 400; src: url('${fonte('lora', 'lora-latin-400-normal.woff2')}'); }
@font-face { font-family: 'Lora'; font-weight: 400; font-style: italic; src: url('${fonte('lora', 'lora-latin-400-italic.woff2')}'); }
@font-face { font-family: 'Lora'; font-weight: 600; src: url('${fonte('lora', 'lora-latin-600-normal.woff2')}'); }
@font-face { font-family: 'Lora'; font-weight: 700; src: url('${fonte('lora', 'lora-latin-700-normal.woff2')}'); }
@font-face { font-family: 'Dancing Script'; font-weight: 600; src: url('${fonte('dancing-script', 'dancing-script-latin-600-normal.woff2')}'); }
@page { size: A4; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { font-family: 'Inter', sans-serif; color: #1E2633; font-size: 12.5pt; }
.miolo { flex: 1; display: flex; flex-direction: column; min-height: 0; }
h1, h2, h3 { font-family: 'Lora', serif; font-weight: 700; }
.titulo { font-size: 30pt; margin-bottom: 2mm; color: var(--cor); }
.titulo-jogo { font-size: 23pt; margin-bottom: 2mm; color: var(--cor); }
.sub { font-size: 14pt; margin: 5mm 0 2.5mm; color: var(--cor, #1E2633); }
.lead { font-family: 'Lora'; font-size: 13pt; line-height: 1.45; margin-bottom: 3mm; }
.lead.pequeno { font-family: 'Inter'; font-size: 11.5pt; margin-bottom: 5mm; }
.miolo > p { line-height: 1.55; }
.instrucao { font-size: 12pt; line-height: 1.5; margin-bottom: 5mm; color: #3A4250; }
.passos { list-style: none; counter-reset: p; }
.passos li { counter-increment: p; position: relative; padding-left: 10mm; margin-bottom: 2.6mm; line-height: 1.45; font-size: 12pt; }
.passos li::before { content: counter(p); position: absolute; left: 0; top: .2mm; font-family: 'Lora'; font-weight: 700; color: var(--cor, #7A2E3A); font-size: 13pt; }
.dicas { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm 6mm; }
.dicas div { font-size: 10.5pt; line-height: 1.4; background: #FFFFFF; border: 1px solid #F0E2D8; border-radius: 4mm; padding: 3mm 4mm; }
.nota-saude { margin-top: auto; font-size: 9.5pt !important; color: #7A746A; border-top: 1px solid #E2DACB; padding-top: 3mm; }
.ficha-jogo { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2mm 6mm; background: #FBEFE8; border-radius: 5mm; padding: 4mm 6mm; margin: 2mm 0 4mm; }
.ficha-jogo dt { font-size: 8pt; text-transform: uppercase; letter-spacing: .1em; color: var(--cor); font-weight: 700; }
.ficha-jogo dd { font-size: 11pt; line-height: 1.4; }
.dica-box { margin-top: auto; background: #FFF4DE; border-radius: 5mm; padding: 4mm 6mm; font-size: 11pt; line-height: 1.5; }
.aviso-corte { margin-top: auto; font-size: 9.5pt; color: #6B655B; padding-top: 3mm; }

.page { width: 210mm; height: 297mm; position: relative; overflow: hidden; page-break-after: always; background: var(--tint); }
.estampa { position: absolute; inset: 0; width: 100%; height: 100%; }
.cartao { position: absolute; top: 11mm; left: 11mm; right: 11mm; bottom: 17mm; background: #FFFDF9; border-radius: 7mm;
  box-shadow: 0 0 0 .7mm var(--cor), 0 0 0 2.2mm #FFFFFF, 0 0 0 2.7mm var(--medio), 0 1.5mm 4mm 2.5mm rgba(0,0,0,.08);
  padding: 0 8mm 7mm; display: flex; flex-direction: column; z-index: 1; }
.fita { align-self: flex-start; margin: 0 0 5mm -8mm; display: flex; align-items: center; gap: 4mm; }
.fita span { background: var(--cor); color: #FFFFFF; font-size: 8.5pt; font-weight: 700; letter-spacing: .14em; text-transform: uppercase;
  padding: 2.4mm 7mm 2.4mm 8mm; border-radius: 7mm 0 4mm 0; }
.fita em { font-family: 'Dancing Script'; font-style: normal; font-size: 15pt; color: var(--cor); }
.cartao > .miolo { padding-top: 0; }
.cartao:not(:has(.fita)) { padding-top: 7mm; }
.canto-se, .canto-id, .canto-sd, .canto-ie { position: absolute; width: 46mm; height: 46mm; z-index: 0; pointer-events: none; }
.canto-sd svg, .canto-ie svg { width: 100%; height: 100%; }
.canto-sd { right: -3mm; top: -3mm; transform: scaleY(-1); width: 34mm; height: 34mm; }
.canto-ie { left: -3mm; bottom: 5mm; transform: scaleX(-1); width: 34mm; height: 34mm; }
.canto-se { right: -3mm; bottom: 4mm; }
.canto-id { left: -3mm; top: -3mm; transform: rotate(180deg); }
.canto-se svg, .canto-id svg { width: 100%; height: 100%; }
footer { position: absolute; left: 14mm; right: 14mm; bottom: 2mm; height: 13mm; display: flex; align-items: center; justify-content: center; gap: 8mm; z-index: 3; }
footer .marca, footer .frase { font-family: 'Dancing Script'; font-size: 14pt; color: var(--cor); width: 55mm; }
footer .marca { text-align: right; } footer .frase { text-align: left; }
.selo { width: 13mm; height: 13mm; }
.selo text { font-family: 'Inter'; font-weight: 700; font-size: 10px; fill: #FFFFFF; }

/* capa */
.capa .cartao { top: 14mm; left: 14mm; right: 14mm; bottom: 14mm; align-items: center; text-align: center; padding: 8mm 10mm; }
.capa .miolo { align-items: center; }
.capa .canto-se, .capa .canto-id { width: 70mm; height: 70mm; }
.capa .canto-se { right: -4mm; bottom: -4mm; } .capa .canto-id { left: -4mm; top: -4mm; }
.capa-assinatura { margin-top: auto; font-family: 'Dancing Script'; font-size: 20pt; color: #4E7D5B; }
.capa-selo { display: inline-block; margin-top: 7mm; background: #A84B60; color: #FFFFFF; font-weight: 700; font-size: 11pt; letter-spacing: .06em;
  padding: 3mm 7mm; border-radius: 99px; box-shadow: 0 0 0 1.2mm #FFFFFF, 0 0 0 1.7mm #E8B4C0; }

/* divisórias */
.divisoria .page, .divisoria { }
.divisoria .cartao { top: 16mm; left: 16mm; right: 16mm; bottom: 22mm; padding: 6mm 14mm 10mm; }
.divisoria .canto-se, .divisoria .canto-id { width: 62mm; height: 62mm; }

.capa-guirlanda { position: relative; width: 150mm; height: 150mm; margin-top: 4mm; }
.capa-guirlanda .guirlanda { width: 100%; height: 100%; }
.capa-centro { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.capa-kicker { font-family: 'Lora'; font-style: italic; font-size: 14pt; color: #8A7A6E; letter-spacing: .2em; }
.capa h1 { font-family: 'Dancing Script'; font-weight: 600; font-size: 50pt; color: #A84B60; line-height: 1; margin: 2mm 0 4mm; }
.capa-sub { font-family: 'Lora'; font-size: 13.5pt; color: #4A4038; max-width: 80mm; line-height: 1.35; font-weight: 600; }
.capa-chamada { font-family: 'Lora'; font-style: italic; font-size: 13.5pt; color: #5E544C; max-width: 150mm; margin: 6mm auto 0; line-height: 1.5; }
.capa-partes { display: flex; justify-content: center; gap: 2.5mm; margin-top: 9mm; flex-wrap: wrap; max-width: 175mm; }
.capa-partes span { background: #FFFFFF; border: 1px solid #EBD9CF; border-radius: 99px; padding: 2mm 4.5mm; font-size: 10pt; color: #4A4038; }
.capa-partes b { color: var(--cor); margin-right: 2mm; font-family: 'Lora'; }

/* divisórias */
.div-buque { width: 95mm; margin: 0 auto 4mm; }
.div-buque svg { width: 100%; display: block; }
.div-num { font-family: 'Dancing Script'; font-size: 26pt; color: var(--cor); text-align: center; }
.divisoria h1 { font-size: 40pt; line-height: 1.05; margin: 1mm 0 5mm; color: var(--cor); text-align: center; }
.div-frase { font-family: 'Lora'; font-style: italic; font-size: 14pt; line-height: 1.5; max-width: 140mm; margin: 0 auto 8mm; color: #5E544C; text-align: center; }
.div-lista { list-style: none; counter-reset: d; background: #FFFFFF; border-radius: 6mm; padding: 4mm 9mm; box-shadow: 0 0 0 1px #EFE0D6; }
.div-lista li { counter-increment: d; font-size: 13pt; padding: 2.6mm 0; border-bottom: 1px dashed #EAD7CB; }
.div-lista li:last-child { border-bottom: 0; }
.div-lista li::before { content: counter(d, decimal-leading-zero); font-family: 'Lora'; font-weight: 700; margin-right: 6mm; color: var(--cor); }

/* ornamentos */
.vinheta { display: block; width: 34mm; height: 4mm; margin: -1.5mm 0 4mm; }
.icone-flor { width: 3.6mm; height: 3.6mm; vertical-align: -0.8mm; margin-right: 1.8mm; }
.florzinha { width: 4.5mm; height: 4.5mm; vertical-align: -1mm; }

/* sumário */
.sumario { display: flex; flex-direction: column; gap: 2.6mm; }
.sum-linha, .sumario li { display: flex; align-items: baseline; gap: 3mm; }
.sum-linha i, .sumario li i { flex: 1; border-bottom: 1px dotted #B5AC9C; }
.sum-linha { font-family: 'Lora'; font-size: 15pt; font-weight: 600; }
.sum-item.parte .sum-linha { color: var(--cor); }
.sumario ul { list-style: none; margin: 1.5mm 0 0 8mm; }
.sumario li { font-size: 11pt; padding: .4mm 0; color: #3A4250; }

/* sudoku */
.sudokus { flex: 1; display: flex; flex-direction: column; justify-content: space-around; align-items: center; }
.sudoku-bloco h3 { font-size: 14pt; margin-bottom: 2mm; color: var(--cor); }
.sudoku-bloco h3 small { font-family: 'Inter'; font-size: 9pt; letter-spacing: .1em; text-transform: uppercase; color: #8B8478; margin-left: 2mm; }
.sudoku { border-collapse: collapse; border: 2.2px solid #1E2633; background: #fff; }
.sudoku td { width: var(--t); height: var(--t); border: .6px solid #9D978C; text-align: center; vertical-align: middle;
  font-size: calc(var(--t) * 0.58); font-weight: 600; }
.sudoku tr:nth-child(3n) td { border-bottom: 2.2px solid #1E2633; }
.sudoku td:nth-child(3n) { border-right: 2.2px solid #1E2633; }

/* sequências, pirâmides, enigmas */
.seq { columns: 2; column-gap: 10mm; list-style: none; counter-reset: s; }
.seq li { counter-increment: s; break-inside: avoid; font-family: 'Lora'; font-size: 16pt; padding: 4.2mm 0; border-bottom: 1px solid #E2DACB; }
.seq li::before { content: counter(s) '.'; font-family: 'Inter'; font-size: 10pt; color: var(--cor); font-weight: 700; display: inline-block; width: 9mm; }
.piramides { display: grid; grid-template-columns: 1fr 1fr; gap: 12mm 6mm; margin-top: 4mm; }
.piramide { display: flex; flex-direction: column; align-items: center; gap: 1.2mm; }
.pir-linha { display: flex; gap: 1.2mm; }
.pir-linha span { width: 16mm; height: 12mm; border: 1.2px solid #1E2633; background: #fff; display: grid; place-items: center; font-size: 14pt; font-weight: 600; }
.pir-linha span.dado { background: #E6EDF4; }
.piramides.mini { grid-template-columns: repeat(4, 1fr); gap: 4mm; margin-bottom: 4mm; }
.piramides.mini .pir-linha span { width: 6.8mm; height: 6mm; font-size: 8.5pt; border-width: .8px; }
.piramides.mini .pir-linha { gap: .6mm; } .piramides.mini .piramide { gap: .6mm; }
.enigmas { list-style: none; counter-reset: e; }
.enigmas li { counter-increment: e; position: relative; padding: 3.2mm 0 3.2mm 12mm; border-bottom: 1px solid #E2DACB; font-size: 12.5pt; line-height: 1.5; }
.enigmas li::before { content: counter(e); position: absolute; left: 0; top: 2.6mm; font-family: 'Lora'; font-size: 17pt; font-weight: 700; color: var(--cor); }

/* palavras */
.caca { border-collapse: collapse; margin: 2mm auto 6mm; background: #fff; border: 1.5px solid #1E2633; }
.caca td { width: 11.8mm; height: 11.8mm; text-align: center; vertical-align: middle; font-size: 16pt; font-weight: 600; letter-spacing: 0; }
.caca.mini { margin: 1mm 0 0; border-width: 1px; }
.caca.mini td { width: 5mm; height: 5mm; font-size: 7pt; font-weight: 500; color: #A39C90; }
.caca.mini td.m { background: #D7E3DC; color: #1E2633; font-weight: 700; }
.palavras { list-style: none; display: grid; grid-template-columns: repeat(4, 1fr); gap: 2mm 4mm; }
.palavras li { font-size: 11.5pt; font-weight: 600; letter-spacing: .04em; border-bottom: 1px solid #E2DACB; padding-bottom: 1mm; }
.anagramas { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm 10mm; }
.anagramas h3 { font-size: 14pt; color: var(--cor); margin-bottom: 2mm; }
.anagramas ol { list-style: none; }
.anagramas li { display: flex; align-items: flex-end; gap: 4mm; padding: 3.5mm 0; }
.mist { font-family: 'Lora'; font-size: 15pt; font-weight: 600; letter-spacing: .18em; min-width: 42mm; }
.linha { flex: 1; border-bottom: 1px solid #9D978C; height: 6mm; min-width: 30mm; }
.ditados { list-style: none; counter-reset: dt; }
.ditados li { counter-increment: dt; display: flex; align-items: flex-end; gap: 3mm; padding: 4mm 0 2mm; font-size: 13pt; }
.ditados li::before { content: counter(dt) '.'; color: var(--cor); font-weight: 700; width: 7mm; font-size: 10pt; }
.ditados b { font-family: 'Lora'; font-weight: 600; white-space: nowrap; }

/* quebra-cabeças */
.refs { display: flex; gap: 6mm; justify-content: center; margin-top: auto; }
.refs figure { width: 52mm; text-align: center; }
.refs svg { width: 100%; display: block; box-shadow: 0 0 0 1px #D8CFBE; }
.refs figcaption { font-family: 'Lora'; font-size: 11pt; font-weight: 600; margin-top: 2mm; }
.refs small { display: block; font-family: 'Inter'; font-weight: 400; font-size: 9pt; color: #7A746A; }
.quebra { flex: 1; display: flex; justify-content: center; min-height: 0; }
.quebra svg { height: 100%; max-width: 100%; }
.legenda-quebra { text-align: center; font-size: 9pt; color: #7A746A; margin-top: 2mm; letter-spacing: .08em; text-transform: uppercase; }

/* desafios */
.tangram-pecas { display: flex; justify-content: center; margin: 4mm 0; }
.tangram-pecas svg { width: 135mm; }
.silhuetas { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; flex: 1; }
.silhuetas figure, .resp-tangram figure { display: flex; flex-direction: column; align-items: center; justify-content: center; }
.silhuetas svg { width: 70mm; height: 58mm; }
.silhuetas figcaption, .resp-tangram figcaption { font-family: 'Lora'; font-size: 12pt; font-weight: 600; margin-top: 2mm; }
.hanoi { width: 180mm; margin: 4mm auto 0; display: block; }
.hanoi-letra { font-family: 'Lora'; font-size: 7px; font-weight: 700; fill: #9A7440; }
.hanoi-num { font-size: 5.5px; font-weight: 700; fill: #FFFFFF; }
.palitos { list-style: none; counter-reset: pl; display: flex; flex-direction: column; gap: 8mm; margin-top: 2mm; }
.palitos li { counter-increment: pl; display: flex; align-items: center; gap: 8mm; }
.palitos li::before { content: counter(pl); font-family: 'Lora'; font-size: 22pt; font-weight: 700; color: var(--cor); width: 10mm; }
.eq { height: 46mm; }

/* tabuleiros */
.tab { display: inline-grid; grid-template-columns: auto auto; grid-template-rows: auto auto; }
.tab-num { display: flex; flex-direction: column; }
.tab-num span { height: var(--c); display: grid; place-items: center; font-size: calc(var(--c) * .32); padding-right: 1.5mm; color: #6B655B; font-weight: 600; }
.tab-grade { display: grid; grid-template-columns: repeat(8, var(--c)); grid-template-rows: repeat(8, var(--c)); border: 2px solid #3B2A1E; }
.tab-letras { grid-column: 2; display: flex; }
.tab-letras span { width: var(--c); text-align: center; font-size: calc(var(--c) * .32); padding-top: 1mm; color: #6B655B; font-weight: 600; }
.casa { display: grid; place-items: center; }
.casa.clara { background: #EBDDBF; } .casa.escura { background: #A4744B; }
.pc { font-family: 'FreeSerif'; font-size: calc(var(--c) * 0.82); line-height: 1; }
.pc.b { color: #1E2633; } .pc.p { color: #000; }
.tab-pagina { flex: 1; display: grid; place-items: center; }
.xadrez-intro { display: grid; grid-template-columns: auto 1fr; gap: 7mm; align-items: start; }
.xadrez-intro .sub { margin-top: 0; }
.legenda { font-size: 9.5pt; color: #6B655B; margin-top: 2mm; max-width: 80mm; line-height: 1.4; }
.movimentos td { padding: 1.6mm 0; vertical-align: top; font-size: 11pt; line-height: 1.4; }
.movimentos td.g { font-family: 'FreeSerif'; font-size: 24pt; width: 11mm; line-height: 1; }
.regras-col { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm 8mm; margin-bottom: 5mm; }
.regras-col h3 { font-size: 13.5pt; color: var(--cor); margin-bottom: 1.5mm; }
.regras-col p { font-size: 11pt; line-height: 1.5; }
.fichas { display: grid; grid-template-columns: repeat(6, 1fr); gap: 3mm; justify-items: center; }
.ficha { width: 27mm; height: 27mm; border-radius: 50%; display: grid; place-items: center; outline: 1px dashed #6B655B; outline-offset: 1.2mm; }
.ficha.fb { background: #F3EBDA; box-shadow: inset 0 0 0 1.6mm #E2D3B5, inset 0 0 0 2mm #1E2633; }
.ficha.fp { background: #2A2522; box-shadow: inset 0 0 0 1.6mm #3E3632, inset 0 0 0 2mm #C9A96E; }
.ficha span { font-family: 'FreeSerif'; font-size: 54px; line-height: 1; }
.ficha.fb span { color: #1E2633; } .ficha.fp span { color: #F3EBDA; }
.ficha.dama i { width: 15mm; height: 15mm; border-radius: 50%; }
.ficha.fb.dama i { border: 1.2px solid #B49A6C; box-shadow: 0 0 0 2.2mm #F3EBDA, 0 0 0 2.6mm #B49A6C; }
.ficha.fp.dama i { border: 1.2px solid #6E5E4E; box-shadow: 0 0 0 2.2mm #2A2522, 0 0 0 2.6mm #6E5E4E; }
.mates { display: grid; grid-template-columns: repeat(2, 1fr); gap: 7mm 8mm; justify-items: center; }
.mates figcaption { font-family: 'Lora'; font-size: 11.5pt; margin-top: 1.5mm; }
.dominos { flex: 1; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: repeat(7, auto); align-content: space-evenly; justify-items: center; gap: 2mm 4mm; }
.domino svg { width: 70mm; display: block; }
.trilha { width: 125mm; margin: 4mm auto 0; display: block; }

/* registro e respostas */
.registro { width: 100%; border-collapse: collapse; font-size: 10.5pt; }
.registro th { background: #A84B60; color: #FFFFFF; padding: 2.5mm; text-align: left; font-weight: 600; }
.registro td { border: 1px solid #D8CFBE; height: 13mm; background: #fff; }
.registro th:nth-child(1), .registro th:nth-child(3), .registro th:nth-child(4) { width: 20mm; }
.resp-tit { font-size: 14pt; color: #7A2E3A; margin: 2mm 0 3mm; padding-bottom: 1.5mm; border-bottom: 1px solid #E2DACB; }
.resp-sudokus { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; margin-bottom: 5mm; }
.resp-sudokus small, .resp-cacas small { display: block; font-size: 8.5pt; color: #7A746A; margin-bottom: 1mm; text-transform: uppercase; letter-spacing: .06em; }
.resp-sudokus .sudoku td { font-weight: 500; }
.resp-seq { columns: 2; column-gap: 8mm; font-size: 10.5pt; line-height: 1.75; padding-left: 6mm; }
.resp-enigmas, .resp-ditados, .resp-mates { padding-left: 6mm; font-size: 10.5pt; line-height: 1.6; }
.resp-enigmas li, .resp-mates li { margin-bottom: 1.6mm; }
.resp-ditados { columns: 2; column-gap: 8mm; margin-bottom: 4mm; }
.resp-cacas { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; margin-bottom: 4mm; }
.resp-ana p { font-size: 10.5pt; line-height: 1.7; }
.resp-tangram { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5mm; }
.resp-tangram svg { width: 45mm; height: 38mm; }
.resp-palitos { padding-left: 6mm; font-size: 10.5pt; }
.resp-palitos li { margin-bottom: 2mm; }
.resp-palitos .eq { height: 15mm; }
.resp-palitos p { color: #3A4250; }
.resp-txt { font-size: 10.5pt; line-height: 1.6; margin-bottom: 3mm; }
.fim { margin-top: auto; text-align: center; border-top: 1px solid #E2DACB; padding-top: 4mm; }
.fim p { font-family: 'Lora'; font-style: italic; font-size: 14pt; margin-bottom: 1.5mm; }
.fim small { font-size: 8.5pt; color: #7A746A; }
/* Parte VI */
.cartas { flex: 1; display: grid; grid-template-columns: repeat(var(--cols), 1fr); grid-template-rows: repeat(var(--rows), 1fr); }
.cartas .carta { outline: 1px dashed #8F8680; outline-offset: -.5px; background: #FFFFFF; padding: 5mm; display: flex; flex-direction: column; position: relative; }
.cartas .carta::before { content: ''; position: absolute; inset: 2.5mm; border: 1.2px solid var(--cor); border-radius: 4mm; opacity: .35; pointer-events: none; }
.fichas-bingo .carta { align-items: center; justify-content: center; text-align: center; gap: 1.5mm; padding: 3mm; }
.fichas-bingo b { font-family: 'Lora'; font-size: 12pt; line-height: 1.2; }
.fichas-bingo small { font-size: 7.5pt; color: #7A6F68; line-height: 1.3; }
.cartelas { flex: 1; display: grid; grid-template-rows: 1fr 1fr; gap: 7mm; }
.cartela { outline: 1px dashed #8F8680; outline-offset: 2mm; background: #FFFFFF; border-radius: 4mm; display: flex; flex-direction: column; overflow: hidden; border: 2px solid var(--cor); }
.cartela-topo { background: #FBEFE8; display: flex; align-items: center; justify-content: center; gap: 3mm; padding: 2.5mm; }
.cartela-topo span { font-family: 'Dancing Script'; font-size: 22pt; color: var(--cor); }
.cartela-topo small { font-size: 9pt; color: #7A6F68; text-transform: uppercase; letter-spacing: .08em; }
.cartela-grade { flex: 1; display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(3, 1fr); }
.cartela-grade div { border-top: 1px solid #EAD7CB; border-left: 1px solid #EAD7CB; display: grid; place-items: center; text-align: center;
  font-family: 'Lora'; font-weight: 600; font-size: 14pt; padding: 3mm; line-height: 1.25; }
.cartela-grade div:nth-child(3n+1) { border-left: 0; }
.quiz .carta { padding: 6mm 7mm; }
.quiz-n { font-size: 8.5pt; text-transform: uppercase; letter-spacing: .1em; color: var(--cor); font-weight: 700; margin-bottom: 2mm; }
.quiz-p { font-family: 'Lora'; font-weight: 600; font-size: 13pt; line-height: 1.35; margin-bottom: 3mm; }
.quiz-op { list-style: none; font-size: 11.5pt; line-height: 1.7; }
.quiz-op b { display: inline-grid; place-items: center; width: 5.5mm; height: 5.5mm; border-radius: 50%; background: #FBEFE8; color: var(--cor); font-size: 9pt; margin-right: 2mm; }
.quiz-r { margin-top: auto; transform: rotate(180deg); font-size: 8.5pt; color: #8A7F78; text-align: center; border-top: 1px dashed #E2D5C6; padding-top: 1.5mm; }
.quiz3 .quiz-p { font-size: 11.5pt; } .quiz3 .quiz-op { font-size: 10pt; } .quiz3 .carta { padding: 5mm; }
.mimica .carta { align-items: center; justify-content: center; text-align: center; gap: 2mm; }
.mimica b { font-family: 'Lora'; font-size: 14.5pt; }
.mimica .florzinha { width: 6mm; height: 6mm; }
.letras { display: grid; grid-template-columns: repeat(5, 26mm); justify-content: center; margin-top: 5mm; }
.letras div { height: 26mm; outline: 1px dashed #8F8680; outline-offset: -.5px; display: grid; place-items: center; font-family: 'Lora'; font-size: 30pt; font-weight: 700; color: var(--cor); background: #FFFFFF; }
.adedonha { width: 100%; border-collapse: collapse; font-size: 10pt; flex: 1; }
.adedonha th { background: var(--cor); color: #FFFFFF; padding: 2mm 1mm; font-weight: 600; font-size: 9pt; }
.adedonha td { border: 1px solid #E2D5C6; background: #FFFFFF; height: 15mm; }
.adedonha th:first-child { width: 13mm; } .adedonha th:last-child { width: 15mm; }
.adedonha tfoot td { height: 10mm; text-align: right; padding-right: 3mm; font-weight: 700; }
.frota { font-size: 11pt; line-height: 1.5; margin-top: 3mm; }
.navais { display: flex; flex-direction: column; align-items: center; gap: 6mm; }
.naval h3 { font-size: 13pt; color: var(--cor); margin-bottom: 1.5mm; }
.naval table { border-collapse: collapse; margin: 0 auto; }
.naval { width: 100%; text-align: center; }
.naval th { width: 8.6mm; height: 8.6mm; font-size: 9.5pt; color: #6B655B; font-weight: 600; }
.naval td { width: 8.6mm; height: 8.6mm; border: 1px solid #B9AE9E; background: #FFFFFF; }
.frota-check { display: flex; flex-wrap: wrap; gap: 2mm 6mm; justify-content: center; margin-top: 4mm; font-size: 10.5pt; }
.frota-check i { font-style: normal; color: var(--cor); letter-spacing: 1px; margin-left: 1mm; }
.pontinhos { width: 150mm; margin: 2mm auto 0; display: block; }
.conversa .carta { padding: 7mm 8mm; }
.conv-cat { font-size: 9pt; text-transform: uppercase; letter-spacing: .1em; color: var(--cor); font-weight: 700; margin-bottom: 3mm; }
.conversa p { font-family: 'Lora'; font-weight: 600; font-size: 15pt; line-height: 1.35; }
.conv3 p { font-size: 13pt; } .conv3 .carta { padding: 6mm; }
`;


export async function gerarPDF({ paginas, titulo, html: arquivoHtml, pdf, cssExtra = '' }) {
const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>${titulo}</title><style>${css}${cssExtra}</style></head>
<body>${paginas.join('\n')}</body></html>`;

await mkdir(path.dirname(arquivoHtml), { recursive: true });
await writeFile(arquivoHtml, html);

const navegador = await chromium.launch();
const aba = await navegador.newPage();
await aba.goto(pathToFileURL(arquivoHtml).href);
await aba.evaluate(() => document.fonts.ready);

// Revisão automática: nenhum conteúdo pode sair do cartão da página.
const problemas = await aba.evaluate(() => {
  const erros = [];
  document.querySelectorAll('section.page').forEach((sec, i) => {
    const cartao = sec.querySelector('.cartao');
    if (!cartao) return;
    const lim = cartao.getBoundingClientRect();
    for (const el of cartao.querySelectorAll('.miolo *')) {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      if (el.ownerSVGElement) continue; // o desenho interno do SVG é recortado pelo próprio SVG
      if (r.bottom > lim.bottom + 0.5 || r.right > lim.right + 0.5 || r.left < lim.left - 0.5 || r.top < lim.top - 0.5) {
        erros.push(`pág. ${i + 1}: <${el.tagName.toLowerCase()} class="${el.className.baseVal ?? el.className}"> sai do cartão`);
        break;
      }
    }
  });
  return erros;
});
if (problemas.length) {
  console.error('Problemas de layout:\n' + problemas.join('\n'));
  process.exitCode = 1;
}
await aba.pdf({ path: pdf, format: 'A4', printBackground: true, preferCSSPageSize: true });
await navegador.close();
console.log(`OK: ${paginas.length} páginas → ${path.basename(pdf)}`);
}
