// Gera o kit Mente Ativa em HTML e PDF (A4).
// Uso: npm run build
import { chromium } from 'playwright';
import { Chess } from 'chess.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import * as c from './conteudo.mjs';
import * as g from './geradores.mjs';
import { serra, azulejos, casario } from './cenas.mjs';
import { pecasQuadrado, figuras as tangramFiguras, silhuetaSVG, solucaoSVG } from './tangram.mjs';
import { paleta, canto, vinheta, guirlanda, buque, flor } from './flores.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(raiz, 'dist');
const fonte = (pacote, arq) => pathToFileURL(path.join(raiz, 'node_modules/@fontsource', pacote, 'files', arq)).href;

const partes = {
  I: { nome: 'Raciocínio', cor: '#6B5B95', flores: [paleta.lavanda, paleta.rosa, paleta.amarelo] },
  II: { nome: 'Palavras', cor: '#4E7D5B', flores: [paleta.amarelo, paleta.pessego, paleta.lavanda] },
  III: { nome: 'Quebra-cabeças', cor: '#A84B60', flores: [paleta.rosa, paleta.pessego, paleta.amarelo] },
  IV: { nome: 'Desafios', cor: '#B0643A', flores: [paleta.pessego, paleta.amarelo, paleta.rosa] },
  V: { nome: 'Jogos de Tabuleiro', cor: '#3A6F6B', flores: [paleta.lavanda, paleta.pessego, paleta.rosa] },
  VI: { nome: 'Para Jogar Juntos', cor: '#9C6A1F', flores: [paleta.rosa, paleta.amarelo, paleta.lavanda] },
};
const floresPadrao = [paleta.rosa, paleta.amarelo, paleta.lavanda];

// ---------- estrutura de páginas ----------
const paginas = [];
const sumarioPaginas = {};
let num = 0;

// limpa: páginas de recorte e grades grandes ficam sem o canto florido.
function pagina(conteudo, { parte, titulo, classe = '', rodape = true, limpa = false } = {}) {
  num++;
  if (titulo && !sumarioPaginas[titulo]) sumarioPaginas[titulo] = num;
  const p = parte ? partes[parte] : null;
  const cor = p?.cor ?? '#A84B60';
  const icone = `<svg viewBox="-10 -10 20 20" class="icone-flor">${flor(0, 0, 9, (p?.flores ?? floresPadrao)[0])}</svg>`;
  const topo = p ? `<div class="cabecalho" style="--cor:${p.cor}"><span>${icone}Parte ${parte} · ${p.nome}</span><span>${titulo ?? ''}</span></div>` : '';
  const corpo = conteudo.replace(/(<h[12] class="(?:titulo-jogo|titulo)">[\s\S]*?<\/h[12]>)/, `$1${vinheta(cor)}`);
  paginas.push(`<section class="page ${classe}" style="--cor:${cor}">${topo}<div class="miolo">${corpo}</div>${
    limpa || !rodape ? '' : canto(p?.flores ?? floresPadrao, num)}${
    rodape ? `<footer><span>${c.marca.nome}</span><span>${num}</span></footer>` : ''}</section>`);
}

function divisoria(parte, itens, frase) {
  const p = partes[parte];
  num++;
  sumarioPaginas[`Parte ${parte}`] = num;
  paginas.push(`<section class="page divisoria" style="--cor:${p.cor}">
    <div class="div-buque">${buque(p.flores, num)}</div>
    <div class="div-num">Parte ${parte}</div>
    <h1>${p.nome}</h1>
    <p class="div-frase">${frase}</p>
    <ol class="div-lista">${itens.map((i) => `<li>${i}</li>`).join('')}</ol>
    <footer><span>${c.marca.nome}</span><span>${num}</span></footer></section>`);
}

const regras = ({ objetivo, material, jogadores, tempo }) => `
  <dl class="ficha-jogo">
    ${objetivo ? `<div><dt>Objetivo</dt><dd>${objetivo}</dd></div>` : ''}
    ${jogadores ? `<div><dt>Jogadores</dt><dd>${jogadores}</dd></div>` : ''}
    ${tempo ? `<div><dt>Duração</dt><dd>${tempo}</dd></div>` : ''}
    ${material ? `<div><dt>Material</dt><dd>${material}</dd></div>` : ''}
  </dl>`;

const lista = (itens, classe = 'passos') => `<ol class="${classe}">${itens.map((i) => `<li>${i}</li>`).join('')}</ol>`;
const avisoCorte = '<p class="aviso-corte">✂ Cole a folha em papel-cartão ou papelão fino e recorte nas linhas tracejadas.</p>';

// ---------- capa, apresentação, sumário ----------
pagina(`
  <div class="capa-guirlanda">
    ${guirlanda([paleta.rosa, paleta.amarelo, paleta.lavanda, paleta.pessego])}
    <div class="capa-centro">
      <p class="capa-kicker">coleção</p>
      <h1>${c.marca.nome}</h1>
      <p class="capa-sub">${c.marca.subtitulo}</p>
    </div>
  </div>
  <p class="capa-chamada">${c.marca.chamada}</p>
  <div class="capa-partes">${Object.entries(partes).map(([k, p]) => `<span style="--cor:${p.cor}"><b>${k}</b>${p.nome}</span>`).join('')}</div>
  <p class="capa-assinatura">Feito com carinho para jogar junto de quem a gente ama</p>`, { classe: 'capa', rodape: false });

pagina(`
  <h1 class="titulo">Seja bem-vindo(a)</h1>
  <p class="lead">Esta coleção reúne jogos clássicos e desafios para manter a mente em movimento, com a calma e o prazer de
  uma boa conversa à mesa. Foi feita para ser jogada junto: filhos, netos, amigos e cuidadores ao lado de quem tem
  muita história para contar.</p>
  <p>Os jogos estão em seis partes: do exercício individual de raciocínio aos grandes clássicos de tabuleiro, terminando com
  jogos feitos para rir e conversar em dupla ou em família. Cada um traz as regras completas e, quando é o caso, as respostas no final.</p>
  <h2 class="sub">Como imprimir e montar</h2>
  ${lista([
    '<b>Folhas de atividades</b> (sudoku, caça-palavras, enigmas): papel A4 comum. Imprima quantas vezes quiser.',
    '<b>Peças, cartas e tabuleiros</b>: use papel mais grosso (180 g ou mais) ou cole a folha em papel-cartão antes de recortar.',
    '<b>Durabilidade</b>: plastificar ou cobrir com plástico adesivo deixa as peças firmes e fáceis de pegar.',
    '<b>Organização</b>: guarde cada jogo num envelope identificado. As peças de damas também servem para a trilha.',
  ])}
  <h2 class="sub">Para quem acompanha</h2>
  <div class="dicas">
    <div><b>Desafio na medida certa.</b> Comece pelo nível que a pessoa domina e aumente aos poucos. Acertar dá vontade de continuar.</div>
    <div><b>Parceria, não prova.</b> Jogue junto. Prefira “vamos pensar juntos?” a corrigir ou apressar.</div>
    <div><b>Sessões curtas e frequentes.</b> De 20 a 40 minutos funcionam melhor do que uma tarde inteira.</div>
    <div><b>Ambiente tranquilo.</b> Boa luz, mesa livre, óculos por perto e sem televisão ligada.</div>
    <div><b>Valorize a experiência.</b> Muitos destes jogos fazem parte da história de quem joga. Pergunte com quem aprendeu.</div>
    <div><b>Registre.</b> A ficha de registro no final ajuda a acompanhar a evolução e o gosto por cada jogo.</div>
  </div>
  <p class="nota-saude">Material de lazer e estímulo cognitivo. Não substitui avaliação ou acompanhamento de profissionais de saúde.</p>`);

const SUMARIO_IDX = paginas.length;
pagina('');

// ---------- Parte I: Raciocínio ----------
divisoria('I', ['Sudoku — seis grades em três níveis', 'Sequências lógicas', 'Pirâmides de soma', 'Enigmas'],
  'Números, padrões e lógica. Atividades para fazer com lápis, no seu ritmo.');

function gradeSudoku(jogo, tam = 12.5) {
  return `<table class="sudoku" style="--t:${tam}mm">${Array.from({ length: 9 }, (_, l) => `<tr>${Array.from({ length: 9 }, (_, k) => {
    const v = jogo[l * 9 + k];
    return `<td>${v || ''}</td>`;
  }).join('')}</tr>`).join('')}</table>`;
}

const sudokus = [
  ['Fácil', 101, 40], ['Fácil', 102, 38], ['Médio', 203, 32], ['Médio', 204, 30], ['Difícil', 305, 26], ['Difícil', 306, 25],
].map(([nivel, s, p]) => ({ nivel, ...g.sudoku(s, p) }));

for (let i = 0; i < 3; i++) {
  const [a, b] = sudokus.slice(i * 2, i * 2 + 2);
  const intro = i === 0 ? `<p class="instrucao"><b>Como jogar:</b> complete a grade para que cada linha, cada coluna e cada quadrado 3×3 tenha os números de 1 a 9, sem repetir.</p>` : '';
  pagina(`${intro}<div class="sudokus">
    ${[a, b].map((s, k) => `<div class="sudoku-bloco"><h3>Sudoku ${i * 2 + k + 1} <small>${s.nivel}</small></h3>${gradeSudoku(s.jogo, i === 0 ? 11.8 : 12.5)}</div>`).join('')}
  </div>`, { parte: 'I', titulo: 'Sudoku' });
}

pagina(`
  <h2 class="titulo-jogo">Sequências lógicas</h2>
  <p class="instrucao">Descubra a regra de cada sequência e escreva o próximo termo. As regras estão nas respostas.</p>
  <ol class="seq">${c.sequencias.map(([s]) => `<li>${s}</li>`).join('')}</ol>`, { parte: 'I', titulo: 'Sequências lógicas' });

const piramides = [11, 12, 13, 14].map(g.piramide);
const desenhaPiramide = (p, resposta = false) => `<div class="piramide">${p.linhas.map((linha, l) => `<div class="pir-linha">${linha.map((v, k) => {
  const visivel = l === 0 ? false : p.mostrar[l][k];
  return `<span class="${visivel ? 'dado' : ''}">${visivel || resposta ? v : ''}</span>`;
}).join('')}</div>`).join('')}</div>`;
pagina(`
  <h2 class="titulo-jogo">Pirâmides de soma</h2>
  <p class="instrucao">Cada bloco é a soma dos dois blocos logo abaixo dele. Complete as pirâmides até o topo.
  Atenção: falta um número na base, e você vai precisar descobri-lo.</p>
  <div class="piramides">${piramides.map((p) => desenhaPiramide(p)).join('')}</div>`, { parte: 'I', titulo: 'Pirâmides de soma' });

pagina(`
  <h2 class="titulo-jogo">Enigmas</h2>
  <p class="instrucao">Leia com calma. Muitos parecem fáceis, mas escondem uma pegadinha. Converse sobre a resposta antes de conferir.</p>
  <ol class="enigmas">${c.enigmas.map(([q]) => `<li>${q}</li>`).join('')}</ol>`, { parte: 'I', titulo: 'Enigmas' });

// ---------- Parte II: Palavras ----------
divisoria('II', ['Caça-palavras — quatro temas', 'Anagramas', 'Complete o ditado'],
  'Vocabulário, memória e cultura popular. Letras grandes e temas do nosso dia a dia.');

const cacas = c.cacaPalavras.map((t, i) => ({ ...t, ...g.cacaPalavras(t.palavras, 15, 500 + i) }));
function gradeCaca(caca, solucao = false) {
  const marcadas = new Set();
  if (solucao) for (const p of caca.posicoes) for (let i = 0; i < p.palavra.length; i++) marcadas.add(`${p.l0 + p.dl * i},${p.c0 + p.dc * i}`);
  return `<table class="caca ${solucao ? 'mini' : ''}">${caca.grade.map((linha, l) => `<tr>${linha.map((ch, k) => `<td class="${marcadas.has(`${l},${k}`) ? 'm' : ''}">${ch}</td>`).join('')}</tr>`).join('')}</table>`;
}
cacas.forEach((caca, i) => {
  pagina(`
    <h2 class="titulo-jogo">${caca.tema}</h2>
    ${i === 0 ? '<p class="instrucao">Encontre as palavras na horizontal, na vertical e na diagonal. Acentos foram retirados.</p>' : ''}
    ${gradeCaca(caca)}
    <ul class="palavras">${[...caca.palavras].sort().map((p) => `<li>${p}</li>`).join('')}</ul>`, { parte: 'II', titulo: 'Caça-palavras', limpa: true });
});

const rAna = g.aleatorio(77);
const anagramas = c.anagramas.map(([tema, ps]) => [tema, ps.map((p) => {
  let e = p;
  while (e === p) e = g.embaralhar([...p], rAna).join('');
  return [e, p];
})]);
pagina(`
  <h2 class="titulo-jogo">Anagramas</h2>
  <p class="instrucao">As letras de cada palavra foram misturadas. Descubra a palavra original. O tema ajuda!</p>
  <div class="anagramas">${anagramas.map(([tema, ps]) => `<div><h3>${tema}</h3><ol>${ps.map(([e]) => `<li><span class="mist">${e}</span><span class="linha"></span></li>`).join('')}</ol></div>`).join('')}</div>`,
{ parte: 'II', titulo: 'Anagramas' });

pagina(`
  <h2 class="titulo-jogo">Complete o ditado</h2>
  <p class="instrucao">Complete os ditados populares. Depois, converse: quem costumava dizer cada um deles? O que significam?</p>
  <ol class="ditados">${c.ditados.map(([a]) => `<li><b>${a}</b> <span class="linha"></span></li>`).join('')}</ol>`, { parte: 'II', titulo: 'Complete o ditado' });

// ---------- Parte III: Quebra-cabeças ----------
divisoria('III', ['Entardecer na Serra — 12 peças', 'Azulejos — 20 peças', 'Casario Colonial — 30 peças'],
  'Três ilustrações com cortes de encaixe, como os quebra-cabeças de caixa. Do mais simples ao mais desafiador.');

const quebras = [
  { nome: 'Entardecer na Serra', svg: serra, cols: 3, rows: 4, semente: 21 },
  { nome: 'Azulejos', svg: azulejos, cols: 4, rows: 5, semente: 22 },
  { nome: 'Casario Colonial', svg: casario, cols: 5, rows: 6, semente: 23 },
];
pagina(`
  <h2 class="titulo-jogo">Como montar os quebra-cabeças</h2>
  ${regras({ objetivo: 'Remontar a ilustração completa.', jogadores: '1 ou 2', tempo: '20 a 60 minutos', material: 'A folha da ilustração, papel-cartão, cola e tesoura.' })}
  ${lista([
    'Imprima a ilustração em cores. Se puder, imprima duas vezes: uma para recortar e outra inteira, como a “tampa da caixa”.',
    'Cole a folha em papel-cartão ou papelão fino, deixe secar bem e recorte seguindo as linhas de encaixe.',
    'Separe primeiro as peças das bordas (que têm um lado reto) e monte a moldura.',
    'Depois, agrupe as peças por cor e por detalhe: céu, telhados, janelas, reflexos.',
  ])}
  <div class="refs">${quebras.map((q) => `<figure><svg viewBox="0 0 300 400">${q.svg}</svg><figcaption>${q.nome}<small>${q.cols * q.rows} peças</small></figcaption></figure>`).join('')}</div>`,
{ parte: 'III', titulo: 'Quebra-cabeças' });

for (const q of quebras) {
  const cortes = g.cortesEncaixe(300, 400, q.cols, q.rows, q.semente);
  pagina(`
    <div class="quebra"><svg viewBox="-2 -2 304 404">${q.svg}
      <g fill="none" stroke-linecap="round">
        ${cortes.map((d) => `<path d="${d}" stroke="#FFFFFF" stroke-width="1.6" opacity=".85"/>`).join('')}
        ${cortes.map((d) => `<path d="${d}" stroke="#1E2633" stroke-width=".6" stroke-dasharray="2.5 1.8"/>`).join('')}
        <rect x="0" y="0" width="300" height="400" stroke="#1E2633" stroke-width=".6" stroke-dasharray="2.5 1.8"/>
      </g></svg></div>
    <p class="legenda-quebra">${q.nome} · ${q.cols * q.rows} peças</p>`, { parte: 'III', titulo: q.nome, limpa: true });
}

// ---------- Parte IV: Desafios ----------
divisoria('IV', ['Tangram — 7 peças e 6 figuras', 'Torre de Hanói', 'Desafios com palitos'],
  'Quebra-cabeças de lógica e geometria que atravessam gerações.');

const tonsTangram = ['#7A2E3A', '#34557A', '#9A7440', '#4F6E5E', '#B5654A', '#5D5A7A', '#2D4739'];
pagina(`
  <h2 class="titulo-jogo">Tangram</h2>
  ${regras({ objetivo: 'Usar as 7 peças para formar as figuras da página seguinte.', jogadores: '1 ou 2', material: 'As 7 peças abaixo, recortadas.' })}
  ${lista([
    'Todas as figuras usam as 7 peças, sem sobrar nem sobrepor.',
    'As peças podem ser giradas e viradas do avesso.',
    'Comece pelos triângulos grandes: eles definem a forma geral.',
  ])}
  <div class="tangram-pecas"><svg viewBox="-0.15 -0.15 4.3 4.3">
    ${Object.values(pecasQuadrado).map((p, i) => `<polygon points="${p.map(([x, y]) => `${x},${y}`).join(' ')}" fill="${tonsTangram[i]}" stroke="#FBF8F2" stroke-width=".012"/>`).join('')}
    ${Object.values(pecasQuadrado).map((p) => `<polygon points="${p.map(([x, y]) => `${x},${y}`).join(' ')}" fill="none" stroke="#1E2633" stroke-width=".012" stroke-dasharray=".05 .035"/>`).join('')}
  </svg></div>
  ${avisoCorte}`, { parte: 'IV', titulo: 'Tangram', limpa: true });

pagina(`
  <h2 class="titulo-jogo">Tangram — figuras para montar</h2>
  <p class="instrucao">Monte cada figura usando as 7 peças. As soluções estão nas respostas.</p>
  <div class="silhuetas">${tangramFiguras.map((f) => `<figure>${silhuetaSVG(f, '#1E2633')}<figcaption>${f.nome}</figcaption></figure>`).join('')}</div>`,
{ parte: 'IV', titulo: 'Tangram', limpa: true });

const coresDiscos = ['#7A2E3A', '#9A7440', '#4F6E5E', '#34557A', '#5D5A7A'];
pagina(`
  <h2 class="titulo-jogo">Torre de Hanói</h2>
  ${regras({ objetivo: 'Levar a torre inteira do pino A para o pino C.', jogadores: '1', material: 'A base e os 5 discos abaixo, recortados.' })}
  ${lista([
    'Empilhe os discos no pino A, do maior (embaixo) para o menor (em cima).',
    'Mova um disco por vez, sempre o que está no topo de uma pilha.',
    'Um disco nunca pode ficar sobre outro menor que ele.',
    'Comece com 3 discos (mínimo de 7 movimentos), depois tente 4 (15) e 5 (31).',
  ])}
  <svg class="hanoi" viewBox="0 0 180 115">
    <rect x="1" y="1" width="178" height="40" rx="3" fill="#F1EADB" stroke="#1E2633" stroke-width=".4" stroke-dasharray="2 1.4"/>
    ${['A', 'B', 'C'].map((p, i) => `<g transform="translate(${30 + i * 60} 0)"><circle cy="19" r="9" fill="none" stroke="#9A7440" stroke-width="1"/><circle cy="19" r="1.4" fill="#9A7440"/><text y="37" text-anchor="middle" class="hanoi-letra">${p}</text></g>`).join('')}
    ${[100, 84, 68, 52, 36].map((w, i) => `<g transform="translate(${90 - w / 2} ${48 + i * 13})"><rect width="${w}" height="10" rx="2" fill="${coresDiscos[i]}"/><rect width="${w}" height="10" rx="2" fill="none" stroke="#1E2633" stroke-width=".4" stroke-dasharray="2 1.4"/><text x="${w / 2}" y="7" text-anchor="middle" class="hanoi-num">${5 - i}</text></g>`).join('')}
  </svg>
  <p class="aviso-corte">✂ Recorte a base (A, B, C) e os 5 discos. Os discos são empilhados sobre as marcas dos pinos.</p>`,
{ parte: 'IV', titulo: 'Torre de Hanói', limpa: true });

const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };
function palito(x1, y1, x2, y2) {
  const vertical = x1 === x2;
  const comp = vertical ? y2 - y1 : x2 - x1;
  const t = `translate(${x1} ${y1})${vertical ? ' rotate(90)' : ''}`;
  return `<g transform="${t}"><rect y="-1.6" width="${comp}" height="3.2" rx="1.2" fill="#E3C28E" stroke="#A88452" stroke-width=".4"/><circle cx="${comp - 1.6}" r="2.3" fill="#9B2C2C"/></g>`;
}
function simbolo(ch, x) {
  const s = [];
  if (/\d/.test(ch)) {
    const seg = SEG[ch];
    const L = { a: [3, 0, 21, 0], b: [24, 3, 24, 21], c: [24, 27, 24, 45], d: [3, 48, 21, 48], e: [0, 27, 0, 45], f: [0, 3, 0, 21], g: [3, 24, 21, 24] };
    for (const k of seg) { const [a, b, cc, d] = L[k]; s.push(palito(x + a, b, x + cc, d)); }
    return { svg: s.join(''), w: 24 };
  }
  if (ch === '+') return { svg: palito(x, 24, x + 18, 24) + palito(x + 9, 15, x + 9, 33), w: 18 };
  if (ch === '-') return { svg: palito(x, 24, x + 18, 24), w: 18 };
  return { svg: palito(x, 19, x + 18, 19) + palito(x, 29, x + 18, 29), w: 18 };
}
function equacao(conta) {
  let x = 4;
  const partesSvg = [];
  for (const ch of conta) { const s = simbolo(ch, x); partesSvg.push(s.svg); x += s.w + 12; }
  return `<svg class="eq" viewBox="0 -6 ${x - 8} 60">${partesSvg.join('')}</svg>`;
}
pagina(`
  <h2 class="titulo-jogo">Desafios com palitos</h2>
  <p class="instrucao">Cada conta está errada. Mova <b>apenas um palito</b> para que ela fique certa.
  Se quiser, monte com palitos de fósforo usados ou palitos de dente sobre a mesa.</p>
  <ol class="palitos">${c.palitos.map((p) => `<li>${equacao(p.conta)}</li>`).join('')}</ol>`, { parte: 'IV', titulo: 'Desafios com palitos', limpa: true });

// ---------- Parte V: Jogos de tabuleiro ----------
divisoria('V', ['Dominó', 'Xadrez — regras, tabuleiro, peças e problemas', 'Damas brasileiras', 'Trilha (moinho)'],
  'Os grandes clássicos de mesa, com regras completas, tabuleiros e peças para recortar.');

const PIPS = { 0: [], 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
const meiaPeca = (n, ox) => PIPS[n].map((p) => `<circle cx="${ox + 7.5 + (p % 3) * 9}" cy="${6 + Math.floor(p / 3) * 9}" r="2.6" fill="#1E2633"/>`).join('');
const pecasDomino = [];
for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) {
  pecasDomino.push(`<div class="domino"><svg viewBox="0 0 66 30"><rect x=".5" y=".5" width="65" height="29" rx="4" fill="#F6F0E1" stroke="#1E2633" stroke-width=".5" stroke-dasharray="2 1.5"/>
    ${meiaPeca(a, 0)}${meiaPeca(b, 33)}
    <line x1="33" y1="5" x2="33" y2="25" stroke="#9A7440" stroke-width="1"/><circle cx="33" cy="15" r="1.3" fill="#9A7440"/></svg></div>`);
}
pagina(`
  <h2 class="titulo-jogo">Dominó</h2>
  ${regras({ objetivo: 'Ser o primeiro a se livrar de todas as peças, ou ter menos pontos quando o jogo trancar.', jogadores: '2 a 4 (o tradicional é 4, em duplas)', tempo: '15 a 30 minutos por partida', material: '28 peças, de 0-0 até 6-6.' })}
  <h3 class="sub">Como jogar</h3>
  ${lista([
    'Vire as peças para baixo e misture. Cada jogador pega 7 peças. Com 2 ou 3 jogadores, as que sobram formam o “monte”.',
    'Começa quem tiver a peça 6-6 (a “carroça de sena”). Nas rodadas seguintes, começa quem venceu a anterior.',
    'O jogo segue no sentido anti-horário. Na sua vez, encaixe uma peça que tenha o mesmo número de uma das pontas da mesa.',
    'Se não tiver peça que encaixe, compre do monte até conseguir jogar. Sem monte, diga “passo”.',
    'Vence quem “bate”, ou seja, coloca a última peça. Nas duplas, a vitória é da dupla.',
    'Se ninguém conseguir jogar, o jogo “tranca”: vence quem tiver menos pontos somados nas peças da mão.',
  ])}
  <div class="dica-box"><b>Para variar:</b> no dominó de pontos, a cada jogada somam-se as duas pontas da mesa.
  Quando a soma der um múltiplo de 5 (5, 10, 15…), o jogador marca esses pontos. Ganha quem chegar primeiro a 100.</div>`,
{ parte: 'V', titulo: 'Dominó' });
for (let i = 0; i < 2; i++) {
  pagina(`<div class="dominos">${pecasDomino.slice(i * 14, i * 14 + 14).join('')}</div>${avisoCorte}`, { parte: 'V', titulo: `Dominó — peças ${i + 1}/2`, limpa: true });
}

// Xadrez
const GLIFO = { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙', k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
const glifo = (ch) => `${GLIFO[ch]}&#xFE0E;`;
function tabuleiro(fen, { tam = 22, coords = true, classe = '' } = {}) {
  const linhas = fen.split(' ')[0].split('/');
  const casas = [];
  linhas.forEach((linha, l) => {
    let k = 0;
    for (const ch of linha) {
      if (/\d/.test(ch)) { for (let n = 0; n < +ch; n++) casas.push({ l, k: k++, p: '' }); } else casas.push({ l, k: k++, p: ch });
    }
  });
  return `<div class="tab ${classe}" style="--c:${tam}mm">
    ${coords ? `<div class="tab-num">${[8, 7, 6, 5, 4, 3, 2, 1].map((n) => `<span>${n}</span>`).join('')}</div>` : ''}
    <div class="tab-grade">${casas.map(({ l, k, p }) => `<div class="casa ${(l + k) % 2 ? 'escura' : 'clara'}">${p ? `<span class="pc ${p === p.toUpperCase() ? 'b' : 'p'}">${glifo(p)}</span>` : ''}</div>`).join('')}</div>
    ${coords ? `<div class="tab-letras">${'abcdefgh'.split('').map((a) => `<span>${a}</span>`).join('')}</div>` : ''}
  </div>`;
}
const INICIAL = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

pagina(`
  <h2 class="titulo-jogo">Xadrez — as regras</h2>
  ${regras({ objetivo: 'Dar xeque-mate: atacar o rei adversário de forma que ele não tenha como escapar.', jogadores: '2', tempo: '20 a 60 minutos' })}
  <div class="xadrez-intro">
    <div>${tabuleiro(INICIAL, { tam: 9 })}<p class="legenda">Posição inicial. A casa do canto direito de cada jogador é clara. A dama começa na casa da sua cor.</p></div>
    <div>
      <h3 class="sub">Como as peças se movem</h3>
      <table class="movimentos">
        <tr><td class="g">${glifo('K')}</td><td><b>Rei</b> — uma casa em qualquer direção. Nunca pode ir para uma casa atacada.</td></tr>
        <tr><td class="g">${glifo('Q')}</td><td><b>Dama</b> — quantas casas quiser, em linha reta ou na diagonal.</td></tr>
        <tr><td class="g">${glifo('R')}</td><td><b>Torre</b> — quantas casas quiser, na horizontal ou na vertical.</td></tr>
        <tr><td class="g">${glifo('B')}</td><td><b>Bispo</b> — quantas casas quiser, na diagonal. Fica sempre na mesma cor.</td></tr>
        <tr><td class="g">${glifo('N')}</td><td><b>Cavalo</b> — em “L”: duas casas numa direção e uma para o lado. É a única peça que pula as outras.</td></tr>
        <tr><td class="g">${glifo('P')}</td><td><b>Peão</b> — anda uma casa para a frente (duas no primeiro lance) e captura na diagonal, uma casa à frente.</td></tr>
      </table>
    </div>
  </div>
  <p class="instrucao">As brancas começam. Cada jogador faz um lance por vez. Para capturar, a peça ocupa a casa da peça adversária, que sai do tabuleiro.</p>`,
{ parte: 'V', titulo: 'Xadrez' });

pagina(`
  <h2 class="titulo-jogo">Xadrez — regras especiais</h2>
  <div class="regras-col">
    <div><h3>Xeque e xeque-mate</h3><p>Quando o rei é atacado, está em <b>xeque</b> e o jogador precisa sair dele: movendo o rei, bloqueando o ataque ou capturando a peça atacante. Se não houver saída, é <b>xeque-mate</b> e a partida termina.</p></div>
    <div><h3>Roque</h3><p>Lance do rei com uma torre, feito uma vez por partida: o rei anda duas casas em direção à torre, e a torre pula para o outro lado do rei. Só vale se nenhum dos dois se moveu antes, se não houver peças entre eles e se o rei não estiver em xeque nem passar por casa atacada.</p></div>
    <div><h3>Promoção</h3><p>O peão que chega à última fileira vira dama, torre, bispo ou cavalo, à escolha do jogador. Quase sempre a escolha é a dama.</p></div>
    <div><h3>En passant</h3><p>Se um peão avança duas casas e para ao lado de um peão adversário, este pode capturá-lo como se ele tivesse andado só uma casa. Só no lance imediatamente seguinte.</p></div>
    <div><h3>Empate</h3><p>A partida empata por acordo, quando o jogador da vez não tem lance válido e não está em xeque (<b>afogamento</b>), quando a mesma posição se repete três vezes, ou quando não há peças suficientes para dar mate.</p></div>
    <div><h3>Notação</h3><p>Nas respostas, as peças são indicadas por letras: R (rei), D (dama), T (torre), B (bispo) e C (cavalo). As casas usam a letra da coluna e o número da fileira, como e4. O sinal # indica mate.</p></div>
  </div>
  <div class="dica-box"><b>Para quem está começando:</b> jogue as primeiras partidas com as peças à vista e comentando os lances. Desenvolva cavalos e bispos cedo, proteja o rei com o roque e evite mover a dama muito cedo.</div>`,
{ parte: 'V', titulo: 'Xadrez' });

pagina(`<div class="tab-pagina">${tabuleiro('8/8/8/8/8/8/8/8 w - - 0 1', { tam: 21 })}</div>
  <p class="aviso-corte">Tabuleiro de xadrez e damas. Cole em papelão para ficar firme. A casa clara fica no canto inferior direito de cada jogador.</p>`,
{ parte: 'V', titulo: 'Tabuleiro (xadrez e damas)', limpa: true });

const fichasXadrez = [...'RNBQKBNRPPPPPPPP', ...'rnbqkbnrpppppppp'];
pagina(`<div class="fichas">${fichasXadrez.map((p) => `<div class="ficha ${p === p.toUpperCase() ? 'fb' : 'fp'}"><span>${glifo(p)}</span></div>`).join('')}</div>
  <p class="aviso-corte">✂ 32 peças de xadrez: 16 claras e 16 escuras. Cole em papelão e recorte os círculos. Uma tampinha de garrafa colada embaixo deixa as peças fáceis de pegar.</p>`,
{ parte: 'V', titulo: 'Xadrez — peças', limpa: true });

const traduzir = (san) => san.replace(/^K/, 'R').replace(/^Q/, 'D').replace(/^R/, 'T').replace(/^N/, 'C');
const mates = c.mates.map((m) => {
  const jogo = new Chess(m.fen);
  const lances = jogo.moves().filter((mv) => { jogo.move(mv); const ok = jogo.isCheckmate(); jogo.undo(); return ok; });
  if (!lances.length) throw new Error('Posição sem mate em 1: ' + m.fen);
  return { ...m, lances: lances.map(traduzir) };
});
pagina(`
  <h2 class="titulo-jogo">Xadrez — problemas de mate em 1</h2>
  <p class="instrucao">Em todas as posições, as <b>brancas jogam e dão xeque-mate em um lance</b>. Monte no tabuleiro se preferir.</p>
  <div class="mates">${mates.map((m, i) => `<figure>${tabuleiro(m.fen, { tam: 7.2 })}<figcaption><b>${i + 1}.</b> ${m.nome}</figcaption></figure>`).join('')}</div>`,
{ parte: 'V', titulo: 'Problemas de xadrez', limpa: true });

// Damas
pagina(`
  <h2 class="titulo-jogo">Damas brasileiras</h2>
  ${regras({ objetivo: 'Capturar todas as peças do adversário ou deixá-lo sem lances.', jogadores: '2', tempo: '15 a 30 minutos', material: 'O tabuleiro e 12 peças de cada cor (há 4 peças extras de cada cor para marcar as damas).' })}
  <h3 class="sub">Como jogar</h3>
  ${lista([
    'Coloque as peças nas casas escuras das três primeiras fileiras de cada lado. A casa escura fica no canto inferior esquerdo de cada jogador.',
    'As peças claras começam. As peças andam uma casa na diagonal, sempre para a frente.',
    'A captura é feita pulando a peça adversária que está ao lado, na diagonal, para a casa vazia logo atrás. Pode-se capturar para a frente e para trás.',
    'Se depois de uma captura houver outra possível, ela continua no mesmo lance (captura em cadeia).',
    '<b>Capturar é obrigatório.</b> Se houver mais de um caminho, deve-se escolher o que captura mais peças.',
    'A peça que chega à última fileira vira <b>dama</b>: coloque uma peça extra por cima. A dama anda quantas casas quiser na diagonal, para a frente e para trás.',
  ])}
  <div class="dica-box"><b>Diferença para outros países:</b> nas damas brasileiras, o peão também captura para trás e a dama “voa” pela diagonal. Combinem as regras antes de começar.</div>`,
{ parte: 'V', titulo: 'Damas brasileiras' });

const fichasDamas = [...Array(16).fill('c'), ...Array(16).fill('e')];
pagina(`<div class="fichas">${fichasDamas.map((t) => `<div class="ficha ${t === 'c' ? 'fb' : 'fp'} dama"><i></i></div>`).join('')}</div>
  <p class="aviso-corte">✂ 32 peças: 16 claras e 16 escuras. Servem para as damas (12 de cada cor e 4 extras para marcar as damas) e para a trilha (9 de cada cor).</p>`,
{ parte: 'V', titulo: 'Peças de damas e trilha', limpa: true });

// Trilha
const pontosTrilha = [];
for (const d of [0, 1, 2]) {
  const a = 10 + d * 25, b = 160 - d * 25, m = 85;
  pontosTrilha.push([a, a], [m, a], [b, a], [b, m], [b, b], [m, b], [a, b], [a, m]);
}
pagina(`
  <h2 class="titulo-jogo">Trilha (moinho)</h2>
  ${regras({ objetivo: 'Deixar o adversário com apenas 2 peças ou sem lances.', jogadores: '2', tempo: '15 a 25 minutos', material: 'O tabuleiro abaixo e 9 peças de cada cor (as mesmas das damas).' })}
  ${lista([
    '<b>Colocação:</b> alternadamente, cada jogador coloca uma peça num ponto vazio, até colocar as 9.',
    '<b>Moinho:</b> sempre que formar uma linha de 3 peças suas, retire uma peça do adversário (de preferência, uma que não esteja num moinho).',
    '<b>Movimento:</b> depois de colocadas todas as peças, cada um move uma peça por vez, ao longo das linhas, para um ponto vizinho vazio.',
    '<b>Voo:</b> quem fica com só 3 peças pode “voar”: mover uma peça para qualquer ponto vazio.',
  ])}
  <svg class="trilha" viewBox="0 0 170 170">
    <rect width="170" height="170" rx="4" fill="#F1EADB"/>
    <g fill="none" stroke="#2D4739" stroke-width="1.4">
      <rect x="10" y="10" width="150" height="150"/><rect x="35" y="35" width="100" height="100"/><rect x="60" y="60" width="50" height="50"/>
      <line x1="85" y1="10" x2="85" y2="60"/><line x1="85" y1="110" x2="85" y2="160"/><line x1="10" y1="85" x2="60" y2="85"/><line x1="110" y1="85" x2="160" y2="85"/>
    </g>
    ${pontosTrilha.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.6" fill="#2D4739"/>`).join('')}
  </svg>`, { parte: 'V', titulo: 'Trilha' });

// ---------- Parte VI: Para jogar juntos ----------
divisoria('VI', ['Bingo das Canções', 'Quiz de Antigamente', 'Mímica', 'Adedonha (Stop)', 'Batalha Naval', 'Jogo dos Pontinhos', 'Cartas de Conversa'],
  'Jogos para rir, cantar e conversar. Feitos para filhos, netos e cuidadores jogarem lado a lado.');

const cartas = (itens, cols, rows, classe = '') =>
  `<div class="cartas ${classe}" style="--cols:${cols};--rows:${rows}">${itens.map((i) => `<div class="carta">${i}</div>`).join('')}</div>`;
const florzinha = (cor) => `<svg viewBox="-10 -10 20 20" class="florzinha">${flor(0, 0, 9, cor)}</svg>`;

// Bingo das Canções
pagina(`
  <h2 class="titulo-jogo">Bingo das Canções</h2>
  ${regras({ objetivo: 'Completar a cartela marcando as canções sorteadas.', jogadores: '2 a 7 (um deles é o “cantor”)', tempo: '20 a 40 minutos', material: '6 cartelas, 24 fichas de sorteio e grãos de feijão ou botões para marcar.' })}
  ${lista([
    'Cada jogador recebe uma cartela. Quem não joga fica com as fichas e vira o <b>cantor</b>.',
    'O cantor sorteia uma ficha e <b>cantarola um trechinho</b> da música, sem dizer o nome.',
    'Quem reconhecer a canção diz o nome. Se ela estiver na sua cartela, marque com um feijão.',
    'Se ninguém reconhecer, o cantor lê o título e os compositores em voz alta.',
    'Vence quem completar uma linha (ou a cartela inteira, no jogo mais longo) e gritar “Bingo!”.',
  ])}
  <div class="dica-box"><b>Para quem acompanha:</b> a música é uma das lembranças mais duradouras. Vale cantar junto,
  bater palmas e perguntar onde a pessoa ouvia essa canção. Se tiver celular por perto, toque a música depois de cada rodada.</div>`,
{ parte: 'VI', titulo: 'Bingo das Canções' });

const cartelasBingo = Array.from({ length: 6 }, (_, k) => g.embaralhar(c.cancoes, g.aleatorio(900 + k)).slice(0, 9));
for (let i = 0; i < 3; i++) {
  pagina(`<div class="cartelas">${cartelasBingo.slice(i * 2, i * 2 + 2).map((cart, k) => `
    <div class="cartela"><div class="cartela-topo">${florzinha(paleta.rosa)}<span>Bingo das Canções</span><small>Cartela ${i * 2 + k + 1}</small>${florzinha(paleta.amarelo)}</div>
    <div class="cartela-grade">${cart.map(([t]) => `<div>${t}</div>`).join('')}</div></div>`).join('')}</div>${avisoCorte}`,
  { parte: 'VI', titulo: 'Bingo das Canções — cartelas', limpa: true });
}
pagina(`${cartas(c.cancoes.map(([t, a]) => `<b>${t}</b><small>${a}</small>`), 4, 6, 'fichas-bingo')}${avisoCorte}`,
  { parte: 'VI', titulo: 'Bingo das Canções — fichas de sorteio', limpa: true });

// Quiz de Antigamente
const rQuiz = g.aleatorio(321);
const cartasQuiz = c.quiz.map(([perg, opcoes], i) => {
  const ordem = g.embaralhar([0, 1, 2], rQuiz);
  const letra = 'ABC'[ordem.indexOf(0)];
  return `<div class="quiz-n">${florzinha(paleta.rosa)} Pergunta ${i + 1}</div><p class="quiz-p">${perg}</p>
    <ol class="quiz-op">${ordem.map((o, k) => `<li><b>${'ABC'[k]}</b> ${opcoes[o]}</li>`).join('')}</ol>
    <div class="quiz-r">Resposta: ${letra} — ${opcoes[0]}</div>`;
});
pagina(`
  <h2 class="titulo-jogo">Quiz de Antigamente</h2>
  <p class="instrucao">Uma pessoa lê a pergunta e as três opções; a outra responde. A resposta está de cabeça para baixo
  no pé de cada carta. Vale contar o que lembra sobre cada assunto. Quem acertar fica com a carta.</p>
  ${cartas(cartasQuiz.slice(0, 6), 2, 3, 'quiz')}`, { parte: 'VI', titulo: 'Quiz de Antigamente', limpa: true });
for (let i = 0; i < 2; i++) {
  pagina(cartas(cartasQuiz.slice(6 + i * 9, 15 + i * 9), 3, 3, 'quiz quiz3'), { parte: 'VI', titulo: 'Quiz de Antigamente', limpa: true });
}

// Mímica
pagina(`
  <h2 class="titulo-jogo">Mímica</h2>
  <p class="instrucao">Sorteie uma carta e faça a mímica, sem falar nada. Quem adivinhar primeiro ganha a carta.
  Pode ser jogado em dupla ou em dois times. Depois, conte: você já fez isso muitas vezes?</p>
  ${cartas(c.mimica.map((m) => `${florzinha(paleta.lavanda)}<b>${m}</b>`), 3, 6, 'mimica')}`,
{ parte: 'VI', titulo: 'Mímica', limpa: true });

// Adedonha
const letras = 'ABCDEFGHIJLMNOPRSTUV'.split('');
pagina(`
  <h2 class="titulo-jogo">Adedonha (Stop)</h2>
  ${regras({ objetivo: 'Escrever uma palavra de cada categoria começando com a letra sorteada.', jogadores: '2 a 6', tempo: '15 a 30 minutos', material: 'As letras abaixo, recortadas, e uma folha de respostas por jogador.' })}
  ${lista([
    'Sorteie uma letra. Todos preenchem a linha da rodada: um nome, uma cidade, uma comida e assim por diante.',
    'Quem completar tudo primeiro diz “Stop!” e todos param de escrever.',
    'Cada resposta vale 10 pontos, ou 5 se outra pessoa escreveu a mesma palavra. Em branco vale 0.',
    'Para jogar com mais calma, combinem um tempo (por exemplo, 2 minutos) em vez do “Stop”.',
  ])}
  <div class="letras">${letras.map((l) => `<div>${l}</div>`).join('')}</div>${avisoCorte}`,
{ parte: 'VI', titulo: 'Adedonha (Stop)', limpa: true });
pagina(`
  <h2 class="titulo-jogo">Adedonha — folha de respostas</h2>
  <p class="lead pequeno">Jogador(a): __________________________________________</p>
  <table class="adedonha"><thead><tr><th>Letra</th>${c.adedonha.map((k) => `<th>${k}</th>`).join('')}<th>Pontos</th></tr></thead>
  <tbody>${`<tr><td></td>${c.adedonha.map(() => '<td></td>').join('')}<td></td></tr>`.repeat(12)}</tbody>
  <tfoot><tr><td colspan="${c.adedonha.length + 1}">Total</td><td></td></tr></tfoot></table>`,
{ parte: 'VI', titulo: 'Adedonha (Stop)', limpa: true });

// Batalha Naval
const gradeNaval = (titulo) => `<div class="naval"><h3>${titulo}</h3><table>
  <tr><th></th>${Array.from({ length: 10 }, (_, i) => `<th>${i + 1}</th>`).join('')}</tr>
  ${'ABCDEFGHIJ'.split('').map((l) => `<tr><th>${l}</th>${'<td></td>'.repeat(10)}</tr>`).join('')}</table></div>`;
const frota = [['Porta-aviões', 5, 1], ['Encouraçado', 4, 1], ['Cruzador', 3, 2], ['Submarino', 2, 2]];
pagina(`
  <h2 class="titulo-jogo">Batalha Naval</h2>
  ${regras({ objetivo: 'Afundar todos os navios do adversário antes que ele afunde os seus.', jogadores: '2', tempo: '20 a 40 minutos', material: 'Uma folha de jogo para cada jogador e um lápis.' })}
  ${lista([
    'Sem mostrar ao adversário, cada um desenha sua frota na grade “Minha frota”: os navios ficam na horizontal ou na vertical e não podem se encostar.',
    'Na sua vez, diga uma casa, como “C7”. O adversário responde “água” ou “acertou” e, se o navio todo foi atingido, “afundou”.',
    'Anote seus tiros na grade “Mar do adversário”: um ponto para água e um X para acerto.',
    'Quem acerta joga de novo. Vence quem afundar a frota inteira primeiro.',
  ])}
  <div class="frota"><b>Frota de cada jogador:</b> 1 porta-aviões (5 casas) · 1 encouraçado (4 casas) · 2 cruzadores (3 casas) · 2 submarinos (2 casas)</div>
  <div class="dica-box"><b>Para facilitar:</b> joguem com as duas folhas lado a lado, ajudando a localizar as casas pela letra e pelo número.</div>`,
{ parte: 'VI', titulo: 'Batalha Naval' });
pagina(`<p class="lead pequeno">Jogador(a): __________________________________________</p>
  <div class="navais">${gradeNaval('Minha frota')}${gradeNaval('Mar do adversário')}</div>
  <div class="frota-check">${frota.map(([n, t, q]) => Array.from({ length: q }, () => `<span>☐ ${n} <i>${'■'.repeat(t)}</i></span>`).join('')).join('')}</div>
  <p class="aviso-corte">Imprima uma folha para cada jogador.</p>`, { parte: 'VI', titulo: 'Batalha Naval — folha de jogo', limpa: true });

// Pontinhos
const pontos = [];
for (let l = 0; l < 11; l++) for (let k = 0; k < 9; k++) pontos.push(`<circle cx="${10 + k * 20}" cy="${10 + l * 20}" r="2.2" fill="#3A3A3A"/>`);
pagina(`
  <h2 class="titulo-jogo">Jogo dos Pontinhos</h2>
  <p class="instrucao">Cada jogador, na sua vez, liga dois pontos vizinhos com um traço (na horizontal ou na vertical).
  Quem fechar um quadradinho escreve sua inicial dentro dele e joga de novo. Quando não houver mais traços, vence quem tiver mais quadradinhos.
  Use uma caneta de cor diferente para cada jogador.</p>
  <svg class="pontinhos" viewBox="0 0 180 220">${pontos.join('')}</svg>`, { parte: 'VI', titulo: 'Jogo dos Pontinhos', limpa: true });

// Cartas de Conversa
const cartasConversa = c.conversa.map(([cat, q]) => `<div class="conv-cat">${florzinha(paleta.amarelo)} ${cat}</div><p>${q}</p>`);
pagina(`
  <h2 class="titulo-jogo">Cartas de Conversa</h2>
  <p class="instrucao">Embaralhe as cartas e deixe o monte virado para baixo. Cada pessoa tira uma carta, lê em voz alta e responde.
  Os outros podem fazer perguntas sobre a história. Vale trocar de carta se a pergunta não agradar. Algumas lembranças trazem
  saudade: escute com calma e acolha.</p>
  ${cartas(cartasConversa.slice(0, 6), 2, 3, 'conversa')}`, { parte: 'VI', titulo: 'Cartas de Conversa', limpa: true });
for (let i = 0; i < 2; i++) {
  pagina(cartas(cartasConversa.slice(6 + i * 9, 15 + i * 9), 3, 3, 'conversa conv3'), { parte: 'VI', titulo: 'Cartas de Conversa', limpa: true });
}

// ---------- registro e respostas ----------
pagina(`
  <h1 class="titulo">Registro de atividades</h1>
  <p class="lead pequeno">Nome: ____________________________________________ &nbsp; Período: ____________________</p>
  <table class="registro">
    <thead><tr><th>Data</th><th>Atividade</th><th>Tempo</th><th>Nível</th><th>Observações</th></tr></thead>
    <tbody>${'<tr><td></td><td></td><td></td><td></td><td></td></tr>'.repeat(14)}</tbody>
  </table>
  <p class="nota-saude">Leve este registro às consultas: ele ajuda profissionais de saúde a conhecer a rotina e perceber mudanças.</p>`,
{ titulo: 'Registro de atividades', limpa: true });

const titR = (t) => `<h3 class="resp-tit">${t}</h3>`;
pagina(`
  <h1 class="titulo">Respostas</h1>
  ${titR('Sudoku')}
  <div class="resp-sudokus">${sudokus.map((s, i) => `<div><small>${i + 1} · ${s.nivel}</small>${gradeSudoku(s.solucao, 4.6)}</div>`).join('')}</div>
  ${titR('Sequências lógicas')}
  <ol class="resp-seq">${c.sequencias.map(([, r, regra]) => `<li><b>${r}</b> — ${regra}</li>`).join('')}</ol>`,
{ titulo: 'Respostas' });

pagina(`
  ${titR('Pirâmides de soma')}
  <div class="piramides mini">${piramides.map((p) => desenhaPiramide(p, true)).join('')}</div>
  ${titR('Enigmas')}
  <ol class="resp-enigmas">${c.enigmas.map(([, r]) => `<li>${r}</li>`).join('')}</ol>`);

pagina(`
  ${titR('Caça-palavras')}
  <div class="resp-cacas">${cacas.map((cc) => `<div><small>${cc.tema}</small>${gradeCaca(cc, true)}</div>`).join('')}</div>
  ${titR('Anagramas')}
  <div class="resp-ana">${anagramas.map(([tema, ps]) => `<p><b>${tema}:</b> ${ps.map(([, p]) => p).join(', ')}</p>`).join('')}</div>`);

pagina(`
  ${titR('Complete o ditado')}
  <ol class="resp-ditados">${c.ditados.map(([a, b]) => `<li>${a} ${b}.</li>`).join('')}</ol>
  ${titR('Tangram')}
  <div class="resp-tangram">${tangramFiguras.map((f) => `<figure>${solucaoSVG(f)}<figcaption>${f.nome}</figcaption></figure>`).join('')}</div>`);

pagina(`
  ${titR('Desafios com palitos')}
  <ol class="resp-palitos">${c.palitos.map((p) => `<li><div class="eqs">${equacao(p.resposta)}</div><p>${p.dica}</p></li>`).join('')}</ol>
  ${titR('Torre de Hanói')}
  <p class="resp-txt">O menor número de movimentos é 2<sup>n</sup> − 1: 7 lances com 3 discos, 15 com 4 e 31 com 5.
  Uma dica que sempre funciona: mova o menor disco a cada dois lances, sempre girando no mesmo sentido (A → B → C → A).
  No lance entre eles, faça o único movimento possível sem usar o menor disco.</p>
  ${titR('Xadrez — mate em 1')}
  <ol class="resp-mates">${mates.map((m) => `<li><b>${m.nome}:</b> ${m.lances[0]}${m.lances.length > 1 ? ` <small>(também valem: ${m.lances.slice(1).join(', ')})</small>` : ''}</li>`).join('')}</ol>
  <div class="fim"><p>Bons jogos e boas conversas.</p>
  <small>Material para uso pessoal e familiar. Imprima quantas vezes quiser. Proibida a revenda ou distribuição.</small></div>`);

// sumário (preenchido depois de saber as páginas)
const itensSumario = [
  ['Apresentação', 'Apresentação'],
  ['Parte I', 'Parte I · Raciocínio', ['Sudoku', 'Sequências lógicas', 'Pirâmides de soma', 'Enigmas']],
  ['Parte II', 'Parte II · Palavras', ['Caça-palavras', 'Anagramas', 'Complete o ditado']],
  ['Parte III', 'Parte III · Quebra-cabeças', ['Entardecer na Serra', 'Azulejos', 'Casario Colonial']],
  ['Parte IV', 'Parte IV · Desafios', ['Tangram', 'Torre de Hanói', 'Desafios com palitos']],
  ['Parte V', 'Parte V · Jogos de Tabuleiro', ['Dominó', 'Xadrez', 'Damas brasileiras', 'Trilha']],
  ['Parte VI', 'Parte VI · Para Jogar Juntos', ['Bingo das Canções', 'Quiz de Antigamente', 'Mímica', 'Adedonha (Stop)', 'Batalha Naval', 'Jogo dos Pontinhos', 'Cartas de Conversa']],
  ['Registro de atividades', 'Registro de atividades'],
  ['Respostas', 'Respostas'],
];
sumarioPaginas['Apresentação'] = 2;
paginas[SUMARIO_IDX] = `<section class="page"><div class="miolo">
  <h1 class="titulo">Sumário</h1>
  <div class="sumario">${itensSumario.map(([chave, rotulo, filhos]) => `
    <div class="sum-item ${filhos ? 'parte' : ''}" ${filhos ? `style="--cor:${partes[chave.split(' ')[1]].cor}"` : ''}>
      <div class="sum-linha"><span>${rotulo}</span><i></i><b>${sumarioPaginas[chave]}</b></div>
      ${filhos ? `<ul>${filhos.map((f) => `<li><span>${f}</span><i></i><b>${sumarioPaginas[f]}</b></li>`).join('')}</ul>` : ''}
    </div>`).join('')}</div>
  </div><footer><span>${c.marca.nome}</span><span>3</span></footer></section>`;

// ---------- estilo ----------
const css = `
@font-face { font-family: 'Lora'; font-weight: 400; src: url('${fonte('lora', 'lora-latin-400-normal.woff2')}'); }
@font-face { font-family: 'Lora'; font-weight: 400; font-style: italic; src: url('${fonte('lora', 'lora-latin-400-italic.woff2')}'); }
@font-face { font-family: 'Lora'; font-weight: 600; src: url('${fonte('lora', 'lora-latin-600-normal.woff2')}'); }
@font-face { font-family: 'Lora'; font-weight: 700; src: url('${fonte('lora', 'lora-latin-700-normal.woff2')}'); }
@font-face { font-family: 'Dancing Script'; font-weight: 600; src: url('${fonte('dancing-script', 'dancing-script-latin-600-normal.woff2')}'); }
@page { size: A4; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { font-family: 'Inter', sans-serif; color: #1E2633; font-size: 12.5pt; }
.page { width: 210mm; height: 297mm; padding: 12mm 12mm 14mm; position: relative; overflow: hidden; page-break-after: always;
  display: flex; flex-direction: column; background: #FDF9F4; }
.miolo { flex: 1; display: flex; flex-direction: column; min-height: 0; }
footer { position: absolute; left: 12mm; right: 12mm; bottom: 6.5mm; display: flex; justify-content: space-between;
  font-size: 8.5pt; color: #8B8478; letter-spacing: .08em; text-transform: uppercase; }
.cabecalho { display: flex; justify-content: space-between; font-size: 8.5pt; letter-spacing: .12em; text-transform: uppercase;
  color: var(--cor); border-bottom: 1px dashed var(--cor); padding-bottom: 2mm; margin-bottom: 6mm; font-weight: 600; }
h1, h2, h3 { font-family: 'Lora', serif; font-weight: 700; }
.titulo { font-size: 30pt; margin-bottom: 2mm; color: var(--cor); }
.titulo-jogo { font-size: 23pt; margin-bottom: 2mm; color: var(--cor); }
.sub { font-size: 14pt; margin: 6mm 0 3mm; color: var(--cor, #1E2633); }
.lead { font-family: 'Lora'; font-size: 14pt; line-height: 1.5; margin-bottom: 3mm; }
.lead.pequeno { font-family: 'Inter'; font-size: 11.5pt; margin-bottom: 5mm; }
.miolo > p { line-height: 1.55; }
.instrucao { font-size: 12pt; line-height: 1.5; margin-bottom: 5mm; color: #3A4250; }
.passos { list-style: none; counter-reset: p; }
.passos li { counter-increment: p; position: relative; padding-left: 10mm; margin-bottom: 2.6mm; line-height: 1.45; font-size: 12pt; }
.passos li::before { content: counter(p); position: absolute; left: 0; top: .2mm; font-family: 'Lora'; font-weight: 700; color: var(--cor, #7A2E3A); font-size: 13pt; }
.dicas { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm 6mm; }
.dicas div { font-size: 11pt; line-height: 1.45; background: #FFFFFF; border: 1px solid #F0E2D8; border-radius: 4mm; padding: 3mm 4mm; }
.nota-saude { margin-top: auto; font-size: 9.5pt !important; color: #7A746A; border-top: 1px solid #E2DACB; padding-top: 3mm; margin-right: 28mm; }
.ficha-jogo { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2mm 6mm; background: #FBEFE8; border-radius: 5mm; padding: 4mm 6mm; margin: 2mm 0 4mm; }
.ficha-jogo dt { font-size: 8pt; text-transform: uppercase; letter-spacing: .1em; color: var(--cor); font-weight: 700; }
.ficha-jogo dd { font-size: 11pt; line-height: 1.4; }
.dica-box { margin-top: auto; background: #FFF4DE; border-radius: 5mm; padding: 4mm 6mm; margin-right: 26mm; font-size: 11pt; line-height: 1.5; }
.aviso-corte { margin-top: auto; font-size: 9.5pt; color: #6B655B; padding-top: 3mm; }

/* capa */
.capa { background: #FCF4EE; padding: 16mm 16mm; align-items: center; text-align: center; }
.capa .miolo { align-items: center; }
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
.capa-assinatura { margin-top: auto; font-family: 'Dancing Script'; font-size: 20pt; color: #7E9F78; }

/* divisórias */
.divisoria { background: #FCF4EE; padding: 16mm 22mm 20mm; }
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
.canto { position: absolute; right: 3mm; bottom: 3mm; width: 34mm; height: 34mm; opacity: .9; z-index: 0; pointer-events: none; }
.miolo, .cabecalho { position: relative; z-index: 1; }
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
.piramides.mini .pir-linha span { width: 8mm; height: 6.5mm; font-size: 8.5pt; border-width: .8px; }
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
.naval table { border-collapse: collapse; }
.naval th { width: 9.5mm; height: 9.5mm; font-size: 9.5pt; color: #6B655B; font-weight: 600; }
.naval td { width: 9.5mm; height: 9.5mm; border: 1px solid #B9AE9E; background: #FFFFFF; }
.frota-check { display: flex; flex-wrap: wrap; gap: 2mm 6mm; justify-content: center; margin-top: 4mm; font-size: 10.5pt; }
.frota-check i { font-style: normal; color: var(--cor); letter-spacing: 1px; margin-left: 1mm; }
.pontinhos { width: 150mm; margin: 2mm auto 0; display: block; }
.conversa .carta { padding: 7mm 8mm; }
.conv-cat { font-size: 9pt; text-transform: uppercase; letter-spacing: .1em; color: var(--cor); font-weight: 700; margin-bottom: 3mm; }
.conversa p { font-family: 'Lora'; font-weight: 600; font-size: 15pt; line-height: 1.35; }
.conv3 p { font-size: 13pt; } .conv3 .carta { padding: 6mm; }
`;

const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>${c.marca.nome} – ${c.marca.subtitulo}</title><style>${css}</style></head>
<body>${paginas.join('\n')}</body></html>`;

await mkdir(dist, { recursive: true });
const arquivoHtml = path.join(dist, 'kit-mente-ativa.html');
await writeFile(arquivoHtml, html);

const navegador = await chromium.launch();
const aba = await navegador.newPage();
await aba.goto(pathToFileURL(arquivoHtml).href);
await aba.evaluate(() => document.fonts.ready);
await aba.pdf({ path: path.join(dist, 'Kit-Mente-Ativa.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true });
await navegador.close();
console.log(`OK: ${paginas.length} páginas geradas em dist/`);
