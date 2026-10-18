// Peças comuns dos materiais extras (bônus e order bumps): livro com moldura, capa, grades e estilo.
import { paleta, guirlanda, vinheta } from './flores.mjs';
import { molduraPagina } from './layout.mjs';

// Monta um livro (lista de páginas numeradas) com a moldura do kit.
export function livro(marca, frase) {
  const paginas = [];
  const sumario = {};
  const pagina = (corpo, { est, rotulo = '', titulo = '', classe = '', rodape = true } = {}) => {
    const n = paginas.length + 1;
    if (titulo && !sumario[titulo]) sumario[titulo] = n;
    const comVinheta = corpo.replace(/(<h[12] class="(?:titulo-jogo|titulo)">[\s\S]*?<\/h[12]>)/, `$1${vinheta(est.cor)}`);
    paginas.push(molduraPagina(comVinheta, { est, numero: n, marca, frase, classe, rodape, rotulo, titulo }));
  };
  return { paginas, sumario, pagina };
}

export const cores = {
  sudoku: { cor: '#3D5A80', tint: '#F2EDE4', medio: '#DCD3C5', flores: [paleta.lavanda, paleta.rosa, paleta.amarelo] },
  caca: { cor: '#4F8A6B', tint: '#F2EDE4', medio: '#DCD3C5', flores: [paleta.amarelo, paleta.pessego, paleta.lavanda] },
  cruz: { cor: '#2E7D86', tint: '#F2EDE4', medio: '#DCD3C5', flores: [paleta.lavanda, paleta.pessego, paleta.rosa] },
  lab: { cor: '#D88A2D', tint: '#F2EDE4', medio: '#DCD3C5', flores: [paleta.pessego, paleta.amarelo, paleta.rosa] },
  dif: { cor: '#D9654B', tint: '#F2EDE4', medio: '#DCD3C5', flores: [paleta.rosa, paleta.pessego, paleta.amarelo] },
  geral: { cor: '#B9862A', tint: '#F2EDE4', medio: '#DCD3C5', flores: [paleta.rosa, paleta.amarelo, paleta.lavanda] },
  colorir: { cor: '#5868A8', tint: '#F2EDE4', medio: '#DCD3C5', flores: [paleta.lavanda, paleta.rosa, paleta.pessego] },
};

export const lista = (itens) => `<ol class="passos">${itens.map((i) => `<li>${i}</li>`).join('')}</ol>`;

export function capa({ est, numeroBonus, kicker = `bônus ${numeroBonus}`, titulo, sub, chamada, selos, selo = 'Mente Ativa · material bônus' }) {
  return `
  <div class="capa-guirlanda">
    ${guirlanda([paleta.rosa, paleta.amarelo, paleta.lavanda, paleta.pessego], 11 + (numeroBonus ?? 7))}
    <div class="capa-centro">
      <p class="capa-kicker">${kicker}</p>
      <h1 style="font-size:32pt">${titulo}</h1>
      <p class="capa-sub">${sub}</p>
    </div>
  </div>
  <p class="capa-chamada">${chamada}</p>
  <div class="capa-partes">${selos.map((s) => `<span style="--cor:${est.cor}">${s}</span>`).join('')}</div>
  <div class="capa-selo" style="background:${est.cor}">${selo}</div>
  <p class="capa-assinatura">Feito com carinho para jogar junto de quem a gente ama</p>`;
}

// ---- render helpers ----
export const gradeSudoku = (jogo, tam) => `<table class="sudoku" style="--t:${tam}mm">${Array.from({ length: 9 }, (_, l) => `<tr>${Array.from({ length: 9 }, (_, k) => `<td>${jogo[l * 9 + k] || ''}</td>`).join('')}</tr>`).join('')}</table>`;

export function gradeCaca(caca, solucao = false) {
  const marcadas = new Set();
  if (solucao) for (const p of caca.posicoes) for (let i = 0; i < p.palavra.length; i++) marcadas.add(`${p.l0 + p.dl * i},${p.c0 + p.dc * i}`);
  return `<table class="caca ${solucao ? 'mini' : ''}">${caca.grade.map((linha, l) => `<tr>${linha.map((ch, k) => `<td class="${marcadas.has(`${l},${k}`) ? 'm' : ''}">${ch}</td>`).join('')}</tr>`).join('')}</table>`;
}

// Cruzadinha em SVG: cada quadrinho é desenhado na posição exata (tam = lado do quadrinho em mm).
export function gradeCruz(cz, { solucao = false, tam = 10 } = {}) {
  const linhas = cz.grade.length, cols = cz.grade[0].length;
  const q = [];
  cz.grade.forEach((linha, l) => linha.forEach((ch, k) => {
    if (!ch) return;
    const n = cz.numeros.get(`${l},${k}`);
    q.push(`<rect x="${k * 10}" y="${l * 10}" width="10" height="10" fill="#FFFFFF" stroke="#2B2B2B" stroke-width="${solucao ? 0.5 : 0.6}"/>`);
    if (n && !solucao) q.push(`<text x="${k * 10 + 0.8}" y="${l * 10 + 3.2}" class="cruz-n">${n}</text>`);
    if (solucao) q.push(`<text x="${k * 10 + 5}" y="${l * 10 + 7.2}" text-anchor="middle" class="cruz-l">${ch}</text>`);
  }));
  return `<svg class="cruz" viewBox="-1 -1 ${cols * 10 + 2} ${linhas * 10 + 2}" style="width:${(cols * tam).toFixed(2)}mm">${q.join('')}</svg>`;
}

export function desenhoLabirinto(m, { solucao = false, cor = '#D88A2D' } = {}) {
  const s = 10, linhas = [];
  m.paredes.forEach((linha, l) => linha.forEach((p, c) => {
    const x = c * s, y = l * s;
    if (p.n && !(l === 0 && c === 0)) linhas.push(`M${x} ${y}h${s}`);
    if (p.o) linhas.push(`M${x} ${y}v${s}`);
    if (l === m.rows - 1 && !(c === m.cols - 1)) linhas.push(`M${x} ${y + s}h${s}`);
    if (c === m.cols - 1 && !(l === m.rows - 1)) linhas.push(`M${x + s} ${y}v${s}`);
  }));
  const cam = solucao ? `<path d="${m.caminho.map(([l, c], i) => `${i ? 'L' : 'M'}${c * s + s / 2} ${l * s + s / 2}`).join(' ')}" fill="none" stroke="${cor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity=".8"/>` : '';
  const W = m.cols * s, H = m.rows * s;
  return `<svg viewBox="-12 -12 ${W + 24} ${H + 24}" class="labirinto">${cam}
    <path d="${linhas.join(' ')}" fill="none" stroke="#2B2B2B" stroke-width="${solucao ? 1.2 : 1.6}" stroke-linecap="square"/>
    ${solucao ? '' : `<circle cx="${s / 2}" cy="-6" r="4" fill="${cor}"/><text x="${s / 2 + 7}" y="-4" class="lab-txt">Início</text>
    <circle cx="${W - s / 2}" cy="${H + 6}" r="4" fill="${cor}"/><text x="${W - s / 2 - 7}" y="${H + 8}" text-anchor="end" class="lab-txt">Fim</text>`}</svg>`;
}

// ---------- estilo extra dos bônus ----------
export const cssExtra = `
.nivel { font-family: 'Inter'; font-size: 10pt; letter-spacing: .1em; text-transform: uppercase; color: #8A7F78; margin-left: 2mm; }
.sum-desc { font-family: 'Inter'; font-weight: 400; font-size: 10pt; color: #8A7F78; margin-left: 2mm; }
.cruz-area { display: flex; justify-content: center; margin: 1mm 0 5mm; }
.cruz { display: block; max-width: 100%; }
.cruz-n { font-family: 'Inter'; font-size: 2.6px; font-weight: 700; fill: var(--cor); }
.cruz-l { font-family: 'Inter'; font-size: 6.2px; font-weight: 700; fill: #2B2B2B; }
.dicas-cruz { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; }
.dicas-cruz h3 { font-size: 13pt; color: var(--cor); margin-bottom: 1.5mm; }
.dicas-cruz ol { padding-left: 7mm; }
.dicas-cruz li { font-size: 11pt; line-height: 1.45; margin-bottom: 1mm; }
.dicas-cruz li::marker { font-weight: 700; color: var(--cor); }
.dicas-cruz small { color: #8A7F78; }
.lab-area { flex: 1; display: flex; justify-content: center; align-items: center; min-height: 0; }
.labirinto { height: 100%; max-width: 100%; }
.lab-txt { font-family: 'Fredoka'; font-size: 6px; font-weight: 700; fill: var(--cor); }
.dif { flex: 1; display: flex; flex-direction: column; gap: 6mm; align-items: center; justify-content: center; min-height: 0; }
.dif svg { height: calc(50% - 3mm); width: auto; max-width: 100%; border-radius: 3mm; box-shadow: 0 0 0 1px #D8CFBE; }
.resp-sudokus.b { grid-template-columns: repeat(4, 1fr); gap: 3mm; }
.resp-cacas.b { grid-template-columns: repeat(3, 1fr); gap: 4mm; }
.resp-cacas.b .caca.mini td { width: 3.4mm; height: 3.4mm; font-size: 5.5pt; }
.resp-cruz { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; }
.resp-cruz small, .resp-lab small, .resp-dif small { display: block; font-size: 8.5pt; color: #7A746A; margin-bottom: 1mm; text-transform: uppercase; letter-spacing: .06em; }
.resp-lab { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; }
.resp-lab svg { width: 100%; max-height: 105mm; }
.resp-dif { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; }
.resp-dif svg { width: 100%; border-radius: 2mm; box-shadow: 0 0 0 1px #D8CFBE; }
.resp-dif p { font-size: 9pt; color: #7A746A; }
.colorir { flex: 1; display: flex; justify-content: center; align-items: center; min-height: 0; background: #FFFFFF; }
.colorir svg { width: 100%; height: 100%; }
.legenda-colorir { text-align: center; font-family: 'Fredoka'; font-weight: 500; font-size: 12.5pt; color: var(--cor); margin-top: 2mm; }
.paletas { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm 8mm; }
.paletas div { background: #FFFFFF; border: 1px solid #E7DFD3; border-radius: 4mm; padding: 3mm 4mm; }
.paletas b { display: block; font-family: 'Fredoka'; font-size: 12pt; margin-bottom: 2mm; }
.paletas span { display: flex; gap: 2mm; }
.paletas i { width: 12mm; height: 12mm; border-radius: 50%; box-shadow: 0 0 0 1px #00000022; }
`;


// ---------- xadrez ----------
const GLIFO = { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙', k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
export const glifo = (ch) => `${GLIFO[ch]}&#xFE0E;`;
export function tabuleiro(fen, { tam = 22, coords = true, classe = '' } = {}) {
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
// Notação em português: R (rei), D (dama), T (torre), B (bispo), C (cavalo).
export const traduzir = (san) => san.replace(/^K/, 'R').replace(/^Q/, 'D').replace(/^R/, 'T').replace(/^N/, 'C');
