// Gera os PDFs bônus do Mente Ativa, com a mesma moldura florida do kit.
// Uso: npm run build:bonus
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as g from './geradores.mjs';
import { paleta, vinheta, guirlanda } from './flores.mjs';
import { molduraPagina, gerarPDF } from './layout.mjs';
import { diferencas, mandala, mandalaFloral, azulejo, vasoDeFlores, paisagem, casinha, borboletas, guirlandaFrase, cafeComBolo } from './desenhos.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(raiz, 'dist');

// Monta um livro (lista de páginas numeradas) com a moldura do kit.
function livro(marca, frase) {
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

const cores = {
  sudoku: { cor: '#6B5B95', tint: '#EEE9F6', medio: '#C9BCE3', flores: [paleta.lavanda, paleta.rosa, paleta.amarelo] },
  caca: { cor: '#4E7D5B', tint: '#E7F1E8', medio: '#B7D3BC', flores: [paleta.amarelo, paleta.pessego, paleta.lavanda] },
  cruz: { cor: '#3A6F6B', tint: '#E3F0EE', medio: '#A9CEC9', flores: [paleta.lavanda, paleta.pessego, paleta.rosa] },
  lab: { cor: '#B0643A', tint: '#FBEADF', medio: '#EDC0A2', flores: [paleta.pessego, paleta.amarelo, paleta.rosa] },
  dif: { cor: '#A84B60', tint: '#F8E6EA', medio: '#E8B4C0', flores: [paleta.rosa, paleta.pessego, paleta.amarelo] },
  geral: { cor: '#9C6A1F', tint: '#FAF0DC', medio: '#E8CD92', flores: [paleta.rosa, paleta.amarelo, paleta.lavanda] },
  colorir: { cor: '#7B4FB8', tint: '#F1EAF8', medio: '#D3C0EA', flores: [paleta.lavanda, paleta.rosa, paleta.pessego] },
};

const lista = (itens) => `<ol class="passos">${itens.map((i) => `<li>${i}</li>`).join('')}</ol>`;

function capa({ est, numeroBonus, titulo, sub, chamada, selos }) {
  return `
  <div class="capa-guirlanda">
    ${guirlanda([paleta.rosa, paleta.amarelo, paleta.lavanda, paleta.pessego], 11 + numeroBonus)}
    <div class="capa-centro">
      <p class="capa-kicker">bônus ${numeroBonus}</p>
      <h1 style="font-size:40pt">${titulo}</h1>
      <p class="capa-sub">${sub}</p>
    </div>
  </div>
  <p class="capa-chamada">${chamada}</p>
  <div class="capa-partes">${selos.map((s) => `<span style="--cor:${est.cor}">${s}</span>`).join('')}</div>
  <div class="capa-selo" style="background:${est.cor}">Mente Ativa · material bônus</div>
  <p class="capa-assinatura">Feito com carinho para jogar junto de quem a gente ama</p>`;
}

// =====================================================================
// Bônus 1 — Caderno Extra de Passatempos
// =====================================================================
const b1 = livro('Mente Ativa · Bônus', 'jogar junto é cuidar');

const sudokus = [
  ['Fácil', 1101, 42], ['Fácil', 1102, 41], ['Fácil', 1103, 40], ['Fácil', 1104, 40],
  ['Médio', 1205, 33], ['Médio', 1206, 32], ['Médio', 1207, 31], ['Médio', 1208, 30],
  ['Difícil', 1309, 27], ['Difícil', 1310, 26], ['Difícil', 1311, 26], ['Difícil', 1312, 25],
].map(([nivel, s, p]) => ({ nivel, ...g.sudoku(s, p) }));

const temasCaca = [
  { tema: 'Festa junina', palavras: ['QUENTAO', 'PAMONHA', 'FOGUEIRA', 'QUADRILHA', 'BANDEIRINHA', 'CANJICA', 'MILHO', 'SANFONA', 'CURAU', 'BALAO', 'PIPOCA', 'CHAPEU'] },
  { tema: 'Flores do jardim', palavras: ['ROSA', 'MARGARIDA', 'ORQUIDEA', 'VIOLETA', 'GIRASSOL', 'HORTENSIA', 'TULIPA', 'LIRIO', 'CRAVO', 'JASMIM', 'AZALEIA', 'BROMELIA'] },
  { tema: 'Bichos do Brasil', palavras: ['ONCA', 'TUCANO', 'ARARA', 'CAPIVARA', 'TATU', 'MICO', 'JABUTI', 'SABIA', 'BOTO', 'TAMANDUA', 'PREGUICA', 'QUATI'] },
  { tema: 'Brincadeiras de antigamente', palavras: ['PETECA', 'PIAO', 'AMARELINHA', 'PIPA', 'CIRANDA', 'BAMBOLE', 'IOIO', 'ELASTICO', 'QUEIMADA', 'GUDE', 'BONECA', 'CARRINHO'] },
  { tema: 'Comida brasileira', palavras: ['FEIJOADA', 'MOQUECA', 'ACARAJE', 'VATAPA', 'TAPIOCA', 'COXINHA', 'BRIGADEIRO', 'QUINDIM', 'CUSCUZ', 'PACOCA', 'TUTU', 'ESCONDIDINHO'] },
  { tema: 'Estados do Brasil', palavras: ['BAHIA', 'PARANA', 'GOIAS', 'AMAPA', 'ACRE', 'PIAUI', 'CEARA', 'SERGIPE', 'ALAGOAS', 'RORAIMA', 'AMAZONAS', 'TOCANTINS'] },
].map((t, i) => ({ ...t, ...g.cacaPalavras(t.palavras, 15, 1500 + i) }));

const temasCruz = [
  { tema: 'Na cozinha', itens: [
    ['PANELA', 'Onde se cozinha o feijão'], ['FOGAO', 'Aparelho com bocas e forno'], ['COLHER', 'Talher usado para tomar sopa'],
    ['GARFO', 'Talher com dentes'], ['XICARA', 'Onde se serve o cafezinho'], ['BULE', 'Recipiente para servir chá ou café'],
    ['PRATO', 'Onde se coloca a comida'], ['FORNO', 'Onde se assa o bolo'], ['TOALHA', 'Cobre a mesa'], ['FACA', 'Talher que corta'], ['PIA', 'Onde se lava a louça']] },
  { tema: 'Natureza', itens: [
    ['SOL', 'Estrela que ilumina o dia'], ['LUA', 'Aparece à noite e tem fases'], ['CHUVA', 'Água que cai das nuvens'],
    ['RIO', 'Curso de água doce'], ['MAR', 'Grande extensão de água salgada'], ['ARVORE', 'Tem tronco, galhos e folhas'],
    ['FLOR', 'Parte colorida e perfumada da planta'], ['NUVEM', 'Branca e fofa, no céu'], ['VENTO', 'Ar em movimento'],
    ['PEDRA', '“Água mole em ___ dura…”'], ['ESTRELA', 'Brilha no céu à noite']] },
  { tema: 'Bichos da fazenda', itens: [
    ['GATO', 'Animal que mia'], ['CAVALO', 'Animal que relincha'], ['VACA', 'Dá leite e faz “muu”'], ['GALO', 'Canta de manhã cedo'],
    ['PATO', 'Ave que nada e faz “quá-quá”'], ['ABELHA', 'Produz o mel'], ['PEIXE', 'Vive na água e tem escamas'],
    ['CACHORRO', 'O melhor amigo do homem'], ['COELHO', 'Tem orelhas compridas e gosta de cenoura'], ['OVELHA', 'Dá a lã'], ['SAPO', 'Pula e coaxa na lagoa']] },
  { tema: 'Profissões', itens: [
    ['MEDICO', 'Cuida da saúde das pessoas'], ['PADEIRO', 'Faz o pão'], ['CARTEIRO', 'Entrega as cartas'], ['PROFESSOR', 'Ensina na escola'],
    ['BOMBEIRO', 'Apaga incêndios'], ['COSTUREIRA', 'Faz e conserta roupas'], ['PEDREIRO', 'Constrói casas'], ['MOTORISTA', 'Dirige ônibus ou carro'],
    ['DENTISTA', 'Cuida dos dentes'], ['PINTOR', 'Pinta paredes ou quadros'], ['COZINHEIRO', 'Prepara as refeições']] },
  { tema: 'Dentro de casa', itens: [
    ['SOFA', 'Assento estofado da sala'], ['CAMA', 'Onde se dorme'], ['MESA', 'Onde se fazem as refeições'], ['CADEIRA', 'Assento com encosto'],
    ['JANELA', 'Abertura por onde entra a luz'], ['PORTA', 'Por onde se entra no cômodo'], ['ESPELHO', 'Reflete a nossa imagem'],
    ['RELOGIO', 'Marca as horas'], ['TAPETE', 'Fica no chão da sala'], ['ESCADA', 'Liga um andar ao outro'], ['TELHADO', 'Cobre a casa']] },
  { tema: 'Frutas', itens: [
    ['BANANA', 'Fruta amarela e comprida'], ['LARANJA', 'Fruta cítrica do suco de todo dia'], ['MANGA', 'Doce, amarela e de caroço grande'],
    ['UVA', 'Fruta em cacho que vira vinho'], ['MELANCIA', 'Verde por fora e vermelha por dentro'], ['ABACAXI', 'Tem coroa e casca espinhosa'],
    ['GOIABA', 'A fruta da goiabada'], ['LIMAO', 'Fruta azeda da limonada'], ['MORANGO', 'Vermelho, com sementinhas por fora'],
    ['COCO', 'Tem água dentro'], ['CAJU', 'Tem a castanha do lado de fora']] },
].map((t, i) => ({ ...t, ...g.cruzadinha(t.itens, 2100 + i * 31) }));
for (const t of temasCruz) if (t.total < t.itens.length - 1) throw new Error(`Cruzadinha "${t.tema}" encaixou só ${t.total} palavras`);

const labirintos = [[10, 13, 3101], [12, 16, 3102], [14, 18, 3103], [16, 21, 3104]].map(([cl, rw, s]) => g.labirinto(cl, rw, s));

// ---- render helpers ----
const gradeSudoku = (jogo, tam) => `<table class="sudoku" style="--t:${tam}mm">${Array.from({ length: 9 }, (_, l) => `<tr>${Array.from({ length: 9 }, (_, k) => `<td>${jogo[l * 9 + k] || ''}</td>`).join('')}</tr>`).join('')}</table>`;

function gradeCaca(caca, solucao = false) {
  const marcadas = new Set();
  if (solucao) for (const p of caca.posicoes) for (let i = 0; i < p.palavra.length; i++) marcadas.add(`${p.l0 + p.dl * i},${p.c0 + p.dc * i}`);
  return `<table class="caca ${solucao ? 'mini' : ''}">${caca.grade.map((linha, l) => `<tr>${linha.map((ch, k) => `<td class="${marcadas.has(`${l},${k}`) ? 'm' : ''}">${ch}</td>`).join('')}</tr>`).join('')}</table>`;
}

// Cruzadinha em SVG: cada quadrinho é desenhado na posição exata (tam = lado do quadrinho em mm).
function gradeCruz(cz, { solucao = false, tam = 10 } = {}) {
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

function desenhoLabirinto(m, { solucao = false, cor = '#B0643A' } = {}) {
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

const todasDiferencas = (cena) => Object.fromEntries(Object.keys(cena.marcas).map((k) => [k, true]));

// ---- páginas ----
b1.pagina(capa({
  est: cores.geral, numeroBonus: 1, titulo: 'Caderno Extra<br>de Passatempos', sub: 'Mais atividades para imprimir sempre que quiser',
  chamada: 'Sudoku, caça-palavras, cruzadinhas, labirintos e jogos de encontrar as diferenças, com letras grandes e respostas no final.',
  selos: ['12 sudokus', '6 caça-palavras', '6 cruzadinhas', '4 labirintos', '3 jogos de diferenças'],
}), { est: cores.geral, classe: 'capa', rodape: false });

const B1_SUM = b1.paginas.length;
b1.pagina('', { est: cores.geral });

const blocoSudoku = (s, i, tam) => `<div class="sudoku-bloco"><h3>Sudoku ${i + 1} <small>${s.nivel}</small></h3>${gradeSudoku(s.jogo, tam)}</div>`;
for (let i = 0; i < 6; i++) {
  const intro = i === 0 ? '<p class="instrucao"><b>Como jogar:</b> complete a grade para que cada linha, cada coluna e cada quadrado 3×3 tenha os números de 1 a 9, sem repetir.</p>' : '';
  b1.pagina(`${intro}<div class="sudokus">${sudokus.slice(i * 2, i * 2 + 2).map((s, k) => blocoSudoku(s, i * 2 + k, i === 0 ? 11.2 : 12)).join('')}</div>`,
    { est: cores.sudoku, rotulo: 'Sudoku', titulo: 'Sudoku' });
}

temasCaca.forEach((t, i) => {
  b1.pagina(`<h2 class="titulo-jogo">${t.tema}</h2>
    ${i === 0 ? '<p class="instrucao">Encontre as palavras na horizontal, na vertical e na diagonal. Acentos foram retirados.</p>' : ''}
    ${gradeCaca(t)}<ul class="palavras">${[...t.palavras].sort().map((p) => `<li>${p}</li>`).join('')}</ul>`,
  { est: cores.caca, rotulo: 'Caça-palavras', titulo: 'Caça-palavras' });
});

temasCruz.forEach((t, i) => {
  b1.pagina(`<h2 class="titulo-jogo">Cruzadinha · ${t.tema}</h2>
    ${i === 0 ? '<p class="instrucao">Leia as dicas e escreva as respostas nos quadrinhos, começando pelo número indicado. Acentos e “ç” foram retirados.</p>' : ''}
    <div class="cruz-area">${gradeCruz(t, { tam: Math.min(11, 160 / Math.max(t.grade[0].length, t.grade.length * 0.9)) })}</div>
    <div class="dicas-cruz">
      <div><h3>Horizontais →</h3><ol>${t.horizontais.map((w) => `<li value="${w.n}">${w.dica} <small>(${w.palavra.length})</small></li>`).join('')}</ol></div>
      <div><h3>Verticais ↓</h3><ol>${t.verticais.map((w) => `<li value="${w.n}">${w.dica} <small>(${w.palavra.length})</small></li>`).join('')}</ol></div>
    </div>`, { est: cores.cruz, rotulo: 'Cruzadinhas', titulo: 'Cruzadinhas' });
});

const niveisLab = ['Fácil', 'Médio', 'Médio', 'Difícil'];
labirintos.forEach((m, i) => {
  b1.pagina(`<h2 class="titulo-jogo">Labirinto ${i + 1} <small class="nivel">${niveisLab[i]}</small></h2>
    ${i === 0 ? '<p class="instrucao">Trace com o lápis o caminho do Início até o Fim, sem atravessar as paredes. Vale apagar e tentar de novo!</p>' : ''}
    <div class="lab-area">${desenhoLabirinto(m)}</div>`, { est: cores.lab, rotulo: 'Labirintos', titulo: 'Labirintos' });
});

diferencas.forEach((cena, i) => {
  const n = Object.keys(cena.marcas).length;
  b1.pagina(`<h2 class="titulo-jogo">Encontre as diferenças · ${cena.nome}</h2>
    <p class="instrucao">As duas imagens parecem iguais, mas há <b>${n} diferenças</b>. Circule cada uma na imagem de baixo.</p>
    <div class="dif"><svg viewBox="0 0 300 210">${cena.desenhar({})}</svg><svg viewBox="0 0 300 210">${cena.desenhar(todasDiferencas(cena))}</svg></div>`,
  { est: cores.dif, rotulo: 'Diferenças', titulo: 'Encontre as diferenças' });
});

// respostas
const titR = (t) => `<h3 class="resp-tit">${t}</h3>`;
b1.pagina(`<h1 class="titulo">Respostas</h1>${titR('Sudoku')}
  <div class="resp-sudokus b">${sudokus.map((s, i) => `<div><small>${i + 1} · ${s.nivel}</small>${gradeSudoku(s.solucao, 4.4)}</div>`).join('')}</div>`,
{ est: cores.geral, titulo: 'Respostas' });
b1.pagina(`${titR('Caça-palavras')}<div class="resp-cacas b">${temasCaca.map((t) => `<div><small>${t.tema}</small>${gradeCaca(t, true)}</div>`).join('')}</div>`, { est: cores.geral });
b1.pagina(`${titR('Cruzadinhas')}<div class="resp-cruz">${temasCruz.map((t) => `<div><small>${t.tema}</small>${gradeCruz(t, { solucao: true, tam: Math.min(5.2, 80 / Math.max(t.grade[0].length, t.grade.length)) })}</div>`).join('')}</div>`, { est: cores.geral });
b1.pagina(`${titR('Labirintos')}<div class="resp-lab">${labirintos.map((m, i) => `<div><small>Labirinto ${i + 1}</small>${desenhoLabirinto(m, { solucao: true })}</div>`).join('')}</div>`, { est: cores.geral });
b1.pagina(`${titR('Encontre as diferenças')}<div class="resp-dif">${diferencas.map((cena) => `<div><small>${cena.nome}</small><svg viewBox="0 0 300 210">${cena.desenhar(todasDiferencas(cena))}
  ${Object.values(cena.marcas).map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#C0392B" stroke-width="3"/>`).join('')}</svg>
  <p>${Object.keys(cena.marcas).length} diferenças</p></div>`).join('')}</div>
  <div class="fim"><p>Bons passatempos!</p><small>Material bônus do Mente Ativa, para uso pessoal e familiar. Proibida a revenda ou distribuição.</small></div>`, { est: cores.geral });

const sumario1 = [['Sudoku', '12 grades em três níveis'], ['Caça-palavras', '6 temas'], ['Cruzadinhas', '6 temas com dicas'], ['Labirintos', '4 níveis'], ['Encontre as diferenças', '3 cenas'], ['Respostas', 'de todas as atividades']];
b1.paginas[B1_SUM] = molduraPagina(`<h1 class="titulo">Bem-vindo(a) ao seu bônus</h1>${vinheta(cores.geral.cor)}
  <p class="lead">Este caderno traz mais atividades para quando as folhas do kit acabarem. Imprima quantas vezes quiser,
  em papel A4 comum, e use lápis para poder apagar.</p>
  <div class="sumario">${sumario1.map(([t, d]) => `<div class="sum-item"><div class="sum-linha"><span>${t} <small class="sum-desc">${d}</small></span><i></i><b>${b1.sumario[t]}</b></div></div>`).join('')}</div>
  <div class="dica-box"><b>Dica para quem acompanha:</b> comece pelos níveis fáceis e alterne os tipos de atividade.
  Um sudoku num dia, uma cruzadinha no outro. Sessões de 20 a 30 minutos funcionam melhor do que uma tarde inteira.</div>`,
{ est: cores.geral, numero: B1_SUM + 1, marca: 'Mente Ativa · Bônus', frase: 'jogar junto é cuidar' });

// =====================================================================
// Bônus 2 — Colorir para Relaxar
// =====================================================================
const b2 = livro('Mente Ativa · Bônus', 'colorir também é cuidar');
const desenhosColorir = [
  ['Mandala de pétalas', mandala(401)], ['Mandala florida', mandalaFloral(402)], ['Azulejo português', azulejo(403)],
  ['Vaso de flores', vasoDeFlores(404)], ['Entardecer na serra', paisagem(405)], ['Mandala do sol', mandala(406)],
  ['Casinha no campo', casinha()], ['Borboletas e flores', borboletas()], ['Azulejo de flores', azulejo(408)],
  ['Mandala do jardim', mandalaFloral(409)], ['Café da tarde', cafeComBolo()], ['Hoje é um bom dia', guirlandaFrase('Hoje é|um bom dia')],
  ['Mandala de estrela', mandala(412)],
];

b2.pagina(capa({
  est: cores.colorir, numeroBonus: 2, titulo: 'Colorir<br>para Relaxar', sub: 'Desenhos de traço firme para adultos',
  chamada: 'Mandalas, azulejos, flores e paisagens para colorir com calma, sozinho ou em boa companhia.',
  selos: [`${desenhosColorir.length} desenhos`, 'traço grosso', 'áreas grandes', 'sem desenho infantil'],
}), { est: cores.colorir, classe: 'capa', rodape: false });

b2.pagina(`<h1 class="titulo">Um momento só seu</h1>
  <p class="lead">Colorir acalma, ocupa as mãos e deixa a cabeça leve. Estes desenhos foram feitos com traço firme e áreas grandes,
  para colorir sem pressa e sem forçar a vista.</p>
  <h2 class="sub">Como aproveitar melhor</h2>
  ${lista([
    '<b>Papel:</b> imprima em A4 comum. Para canetinha ou tinta, prefira papel mais grosso (120 g ou mais).',
    '<b>Material:</b> lápis de cor, giz de cera, canetinha ou aquarela. Lápis de cor grosso é mais fácil de segurar.',
    '<b>Ritmo:</b> não precisa terminar de uma vez. Uma mandala pode durar a semana inteira.',
    '<b>Juntos:</b> cada um pinta metade do desenho, ou escolham juntos as cores antes de começar.',
    '<b>Exponha:</b> pendure os desenhos prontos na geladeira ou num mural. É motivo de orgulho e de conversa.',
  ])}
  <h2 class="sub">Sugestões de cores</h2>
  <div class="paletas">${[
    ['Jardim', ['#E8A0B4', '#F5D76E', '#9CC89A', '#B8A6D9', '#F4B88A']],
    ['Azulejo', ['#1F4E8C', '#4F81BD', '#A8C6E8', '#F4F1E8', '#E9B949']],
    ['Entardecer', ['#2E3F63', '#B8607A', '#F09A6B', '#F8D29A', '#4C3B57']],
    ['Campo', ['#6DB33F', '#E3C38B', '#D64933', '#7EC8F2', '#FFD23F']],
  ].map(([nome, cs]) => `<div><b>${nome}</b><span>${cs.map((cc) => `<i style="background:${cc}"></i>`).join('')}</span></div>`).join('')}</div>`,
{ est: cores.colorir });

desenhosColorir.forEach(([nome, svg]) => {
  b2.pagina(`<div class="colorir">${svg}</div><p class="legenda-colorir">${nome}</p>`, { est: cores.colorir, rotulo: 'Colorir para relaxar', titulo: nome });
});

// ---------- estilo extra dos bônus ----------
const cssExtra = `
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
.lab-txt { font-family: 'Lora'; font-size: 6px; font-weight: 700; fill: var(--cor); }
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
.legenda-colorir { text-align: center; font-family: 'Dancing Script'; font-size: 16pt; color: var(--cor); margin-top: 2mm; }
.paletas { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm 8mm; }
.paletas div { background: #FFFFFF; border: 1px solid #EFE0D6; border-radius: 4mm; padding: 3mm 4mm; }
.paletas b { display: block; font-family: 'Lora'; font-size: 12pt; margin-bottom: 2mm; }
.paletas span { display: flex; gap: 2mm; }
.paletas i { width: 12mm; height: 12mm; border-radius: 50%; box-shadow: 0 0 0 1px #00000022; }
`;

await gerarPDF({ paginas: b1.paginas, titulo: 'Mente Ativa · Bônus 1 · Caderno Extra de Passatempos', html: path.join(dist, 'bonus-1.html'), pdf: path.join(dist, 'Bonus-1-Caderno-Extra-de-Passatempos.pdf'), cssExtra });
await gerarPDF({ paginas: b2.paginas, titulo: 'Mente Ativa · Bônus 2 · Colorir para Relaxar', html: path.join(dist, 'bonus-2.html'), pdf: path.join(dist, 'Bonus-2-Colorir-para-Relaxar.pdf'), cssExtra });
