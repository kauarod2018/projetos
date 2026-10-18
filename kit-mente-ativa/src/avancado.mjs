// Order bump: Mente Ativa Nível Avançado.
// Uso: npm run build:avancado
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as g from './geradores.mjs';
import { paleta, vinheta } from './flores.mjs';
import { molduraPagina, gerarPDF } from './layout.mjs';
import { livro, lista, capa, gradeSudoku, gradeCruz, cssExtra, tabuleiro, traduzir } from './livro.mjs';
import { problemaLogica, atributos, criptograma, quadradoMagico, mateEm2 } from './desafios.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(raiz, 'dist');

const cores = {
  geral: { cor: '#4A3F7A', tint: '#ECE8F6', medio: '#C4BAE3', flores: [paleta.lavanda, paleta.rosa, paleta.amarelo] },
  sudoku: { cor: '#6B5B95', tint: '#EEE9F6', medio: '#C9BCE3', flores: [paleta.lavanda, paleta.rosa, paleta.amarelo] },
  logica: { cor: '#3A6F6B', tint: '#E3F0EE', medio: '#A9CEC9', flores: [paleta.lavanda, paleta.pessego, paleta.rosa] },
  xadrez: { cor: '#2D4739', tint: '#E4EEE7', medio: '#A8C6B1', flores: [paleta.amarelo, paleta.rosa, paleta.lavanda] },
  cripto: { cor: '#A84B60', tint: '#F8E6EA', medio: '#E8B4C0', flores: [paleta.rosa, paleta.pessego, paleta.amarelo] },
  cruz: { cor: '#B0643A', tint: '#FBEADF', medio: '#EDC0A2', flores: [paleta.pessego, paleta.amarelo, paleta.rosa] },
  magico: { cor: '#9C6A1F', tint: '#FAF0DC', medio: '#E8CD92', flores: [paleta.amarelo, paleta.rosa, paleta.lavanda] },
};

const L = livro('Mente Ativa · Nível Avançado', 'desafio também é cuidado');

// ---------- conteúdo ----------
const sudokus = [
  ...[[7101, 25], [7102, 24], [7103, 24], [7104, 23]].map(([s, p]) => ({ tipo: 'Difícil', ...g.sudoku(s, p) })),
  ...[[7201, 26], [7202, 25], [7203, 24], [7204, 24]].map(([s, p]) => ({ tipo: 'Sudoku X', diag: true, ...g.sudoku(s, p, { diag: true }) })),
];

const logicas = [
  { titulo: 'A rua das flores', cats: ['nome', 'cor', 'fruta', 'animal'], vals: [['Ana', 'Bruno', 'Clara', 'Davi'], ['amarela', 'azul', 'verde', 'branca'], ['banana', 'uva', 'manga', 'laranja'], ['o gato', 'o cachorro', 'o papagaio', 'o peixe']], semente: 11 },
  { titulo: 'Vizinhos do bairro', cats: ['nome', 'bebida', 'flor', 'time'], vals: [['Helena', 'Jorge', 'Lúcia', 'Mário'], ['café', 'chá', 'suco', 'chimarrão'], ['rosas', 'margaridas', 'orquídeas', 'violetas'], ['Flamengo', 'Corinthians', 'Grêmio', 'Bahia']], semente: 23 },
  { titulo: 'A vila do interior', cats: ['nome', 'cor', 'bebida', 'animal'], vals: [['Rosa', 'Pedro', 'Teresa', 'Antônio'], ['vermelha', 'azul', 'amarela', 'verde'], ['café', 'leite', 'chá', 'suco'], ['o coelho', 'a galinha', 'o cavalo', 'o cachorro']], semente: 37 },
  { titulo: 'Os jardins da praça', cats: ['nome', 'flor', 'fruta', 'time'], vals: [['Lurdes', 'Carlos', 'Fátima', 'João'], ['girassóis', 'lírios', 'hortênsias', 'cravos'], ['goiaba', 'caju', 'abacaxi', 'mamão'], ['Palmeiras', 'Vasco', 'Cruzeiro', 'Internacional']], semente: 41 },
].map((p) => ({ ...p, ...problemaLogica(p) }));

// Posições encontradas por busca e conferidas aqui: mate forçado em 2, sem mate em 1, com um único primeiro lance.
const mates = [
  'k7/8/8/3N2p1/5Q2/K6P/8/8 w - - 0 1', '6Q1/k7/8/8/8/5R2/2K5/8 w - - 0 1',
  '4k3/8/3R2p1/7Q/8/4P1K1/1R6/8 w - - 0 1', '5k2/1BP5/8/8/6R1/2B5/8/1K6 w - - 0 1',
  '4Q3/8/k2B4/8/8/3K4/8/7B w - - 0 1', '1k6/6P1/8/8/8/8/B1K2R2/8 w - - 0 1',
  '3k4/4R3/8/8/8/8/8/1R2K2B w - - 0 1', '2k5/8/7P/6Q1/8/8/8/1R2K3 w - - 0 1',
].map((fen) => {
  const { chaves, temMateEm1 } = mateEm2(fen);
  if (temMateEm1 || chaves.length !== 1) throw new Error(`Mate em 2 inválido: ${fen}`);
  return { fen, chave: traduzir(chaves[0]) };
});

const frases = [
  'Quem não arrisca não petisca', 'Gato escaldado tem medo de água fria', 'Devagar se vai ao longe',
  'A união faz a força', 'Uma andorinha só não faz verão', 'Pau que nasce torto nunca se endireita',
];
const criptos = frases.map((f, i) => ({ frase: f, ...criptograma(f, 900 + i, 3) }));

const cruzadas = [
  { tema: 'Brasil', itens: [
    ['BRASILIA', 'Capital do Brasil desde 1960'], ['AMAZONAS', 'Maior rio do Brasil em volume de água'], ['PELE', 'O “Rei do Futebol”'],
    ['SAMBA', 'Ritmo das escolas do carnaval carioca'], ['FEIJOADA', 'Prato de feijão preto com carnes'], ['SALVADOR', 'Primeira capital do Brasil'],
    ['JANGADA', 'Embarcação dos pescadores do Nordeste'], ['CAPOEIRA', 'Mistura de luta e dança afro-brasileira'], ['PANTANAL', 'Grande planície alagada de MT e MS'],
    ['TUCANO', 'Ave de bico grande e colorido'], ['CARIOCA', 'Quem nasce na cidade do Rio de Janeiro'], ['FREVO', 'Dança pernambucana com sombrinha'],
    ['IPE', 'Árvore de flores amarelas, roxas ou brancas'], ['CARNAVAL', 'Festa popular que acontece antes da Quaresma']] },
  { tema: 'Música e cultura', itens: [
    ['NOEL', '___ Rosa, o “Poeta da Vila”'], ['CARTOLA', 'Sambista autor de “As Rosas Não Falam”'], ['ELIS', '___ Regina, a “Pimentinha”'],
    ['GONZAGA', 'Sobrenome do “Rei do Baião”'], ['PIXINGUINHA', 'Compositor de “Carinhoso”'], ['VIOLAO', 'Instrumento de seis cordas'],
    ['PANDEIRO', 'Instrumento de percussão com platinelas'], ['SANFONA', 'Também chamada de acordeão'], ['RADIO', 'Aparelho das novelas de antigamente'],
    ['NOVELA', 'História contada em capítulos'], ['CHORO', 'Gênero musical também chamado de chorinho'], ['ROBERTO', '___ Carlos, o “Rei”'],
    ['CAETANO', '___ Veloso, autor de “Sampa”'], ['MPB', 'Sigla de Música Popular Brasileira']] },
  { tema: 'Natureza e ciência', itens: [
    ['OXIGENIO', 'Gás que respiramos'], ['SATURNO', 'Planeta famoso pelos anéis'], ['MARTE', 'O “planeta vermelho”'], ['LUA', 'Satélite natural da Terra'],
    ['BALEIA', 'A azul é o maior animal do mundo'], ['ORVALHO', 'Gotinhas de água nas folhas pela manhã'], ['VULCAO', 'Montanha que pode soltar lava'],
    ['GRAVIDADE', 'Força que faz as coisas caírem'], ['ECLIPSE', 'Quando a Lua encobre o Sol'], ['TERRA', 'Terceiro planeta a partir do Sol'],
    ['FERRO', 'Metal que enferruja'], ['COMETA', 'Astro com uma cauda luminosa'], ['ARCOIRIS', 'Aparece no céu com sol e chuva'],
    ['FOTOSSINTESE', 'Processo em que a planta produz alimento com a luz']] },
  { tema: 'Volta ao mundo', itens: [
    ['PARIS', 'Capital da França'], ['LISBOA', 'Capital de Portugal'], ['ROMA', 'Capital da Itália'], ['NILO', 'Rio que atravessa o Egito'],
    ['EVEREST', 'Montanha mais alta do mundo'], ['SAARA', 'Maior deserto quente do mundo'], ['ANDES', 'Cordilheira da América do Sul'],
    ['JAPAO', 'O “país do sol nascente”'], ['MEXICO', 'País dos mariachis'], ['CANADA', 'País com a folha de bordo na bandeira'],
    ['ATLANTICO', 'Oceano que banha o Brasil'], ['AFRICA', 'Continente do Egito e de Angola'], ['CHILE', 'País comprido e estreito, vizinho da Argentina'],
    ['MADRI', 'Capital da Espanha'], ['LONDRES', 'Capital da Inglaterra']] },
].map((t, i) => ({ ...t, ...g.cruzadinha(t.itens, 8100 + i * 37, 120) }));
for (const t of cruzadas) if (t.total < t.itens.length - 2) throw new Error(`Cruzada "${t.tema}" encaixou só ${t.total} de ${t.itens.length} palavras`);

const magicos = [61, 62, 63, 64].map(quadradoMagico);

// ---------- páginas ----------
L.pagina(capa({
  est: cores.geral, kicker: 'nível avançado', titulo: 'Mente Ativa<br>Avançado', sub: 'Desafios para quem já resolveu tudo',
  chamada: 'Sudokus difíceis, Sudoku X, problemas de lógica, xadrez com mate em 2, criptogramas, palavras cruzadas e quadrados mágicos.',
  selos: ['8 sudokus', '4 problemas de lógica', '8 mates em 2', '6 criptogramas', '4 cruzadas', '4 quadrados mágicos'], selo: 'Mente Ativa · nível avançado',
}), { est: cores.geral, classe: 'capa', rodape: false });

const SUM = L.paginas.length;
L.pagina('', { est: cores.geral });

const blocoSudoku = (s, i) => `<div class="sudoku-bloco"><h3>${s.diag ? 'Sudoku X' : 'Sudoku'} ${i + 1} <small>${s.tipo === 'Difícil' ? 'difícil' : 'diagonais'}</small></h3>${gradeSudoku(s.jogo, 11.4).replace('class="sudoku"', `class="sudoku${s.diag ? ' x' : ''}"`)}</div>`;
for (let i = 0; i < 4; i++) {
  const intro = i === 0
    ? '<p class="instrucao"><b>Sudoku difícil:</b> complete a grade para que cada linha, coluna e quadrado 3×3 tenha os números de 1 a 9. Com poucas pistas, vale anotar a lápis os números possíveis em cada casa.</p>'
    : i === 2 ? '<p class="instrucao"><b>Sudoku X:</b> as mesmas regras, com um desafio a mais: as <b>duas diagonais destacadas</b> também precisam ter os números de 1 a 9, sem repetir.</p>' : '';
  L.pagina(`${intro}<div class="sudokus">${sudokus.slice(i * 2, i * 2 + 2).map((s, k) => blocoSudoku(s, i * 2 + k)).join('')}</div>`,
    { est: cores.sudoku, rotulo: i < 2 ? 'Sudoku difícil' : 'Sudoku X', titulo: i < 2 ? 'Sudoku difícil' : 'Sudoku X' });
}

logicas.forEach((p, i) => {
  const cats = p.cats.slice(1);
  L.pagina(`<h2 class="titulo-jogo">Lógica ${i + 1} · ${p.titulo}</h2>
    ${i === 0 ? '<p class="instrucao">Quatro casas ficam lado a lado numa rua, numeradas de 1 a 4 da esquerda para a direita. Em cada casa mora uma pessoa diferente. Use as pistas para descobrir tudo sobre cada morador. Só existe uma resposta possível.</p>' : '<p class="instrucao">Quatro casas lado a lado, numeradas de 1 a 4 da esquerda para a direita. Descubra tudo sobre cada morador.</p>'}
    <ol class="pistas">${p.pistas.map((t) => `<li>${t}</li>`).join('')}</ol>
    <table class="tabela-logica"><thead><tr><th></th>${[1, 2, 3, 4].map((n) => `<th>Casa ${n}</th>`).join('')}</tr></thead>
    <tbody><tr><th>Nome</th>${'<td></td>'.repeat(4)}</tr>${cats.map((c) => `<tr><th>${atributos[c].titulo}</th>${'<td></td>'.repeat(4)}</tr>`).join('')}</tbody></table>
    <p class="opcoes">${p.cats.map((c, a) => `<b>${a === 0 ? 'Nomes' : atributos[c].titulo}:</b> ${p.vals[a].join(', ')}`).join(' · ')}</p>`,
  { est: cores.logica, rotulo: 'Problemas de lógica', titulo: 'Problemas de lógica' });
});

for (let i = 0; i < 2; i++) {
  L.pagina(`<h2 class="titulo-jogo">Xadrez · mate em 2</h2>
    <p class="instrucao">${i === 0 ? 'As <b>brancas jogam e dão xeque-mate em dois lances</b>, não importa como as pretas respondam. Encontre o primeiro lance. Dica: em todos estes problemas, o primeiro lance não é xeque nem captura.' : 'Brancas jogam e dão mate em dois lances.'}</p>
    <div class="mates2">${mates.slice(i * 4, i * 4 + 4).map((m, k) => `<figure>${tabuleiro(m.fen, { tam: 9 })}<figcaption>Problema ${i * 4 + k + 1}</figcaption></figure>`).join('')}</div>`,
  { est: cores.xadrez, rotulo: 'Xadrez', titulo: 'Xadrez · mate em 2' });
}

const desenhaCripto = (c, solucao = false) => `<div class="cripto">${c.palavras.map((p) => `<div class="cp">${[...p].map((l) =>
  `<div class="cl"><span class="${c.reveladas.has(l) && !solucao ? 'rev' : ''}">${solucao || c.reveladas.has(l) ? l : ''}</span><i>${c.codigo[l]}</i></div>`).join('')}</div>`).join('')}</div>`;
for (let i = 0; i < 3; i++) {
  L.pagina(`<h2 class="titulo-jogo">Criptogramas</h2>
    ${i === 0 ? '<p class="instrucao">Cada letra foi trocada por um número, e a mesma letra tem sempre o mesmo número. Algumas letras já estão reveladas. Descubra o ditado popular escondido. Acentos foram retirados.</p>' : ''}
    ${criptos.slice(i * 2, i * 2 + 2).map((c, k) => `<div class="cripto-bloco"><h3>Criptograma ${i * 2 + k + 1}</h3>${desenhaCripto(c)}</div>`).join('')}
    <div class="apoio"><b>Tabela de apoio</b><div>${Array.from({ length: 26 }, (_, n) => `<span><i>${n + 1}</i></span>`).join('')}</div></div>`,
  { est: cores.cripto, rotulo: 'Criptogramas', titulo: 'Criptogramas' });
}

cruzadas.forEach((t, i) => {
  L.pagina(`<h2 class="titulo-jogo">Palavras cruzadas · ${t.tema}</h2>
    ${i === 0 ? '<p class="instrucao">Responda às dicas começando pelo número indicado. Acentos, “ç” e hífens foram retirados.</p>' : ''}
    <div class="cruz-area">${gradeCruz(t, { tam: Math.min(9, 168 / t.grade[0].length, 128 / t.grade.length) })}</div>
    <div class="dicas-cruz">
      <div><h3>Horizontais →</h3><ol>${t.horizontais.map((w) => `<li value="${w.n}">${w.dica} <small>(${w.palavra.length})</small></li>`).join('')}</ol></div>
      <div><h3>Verticais ↓</h3><ol>${t.verticais.map((w) => `<li value="${w.n}">${w.dica} <small>(${w.palavra.length})</small></li>`).join('')}</ol></div>
    </div>`, { est: cores.cruz, rotulo: 'Palavras cruzadas', titulo: 'Palavras cruzadas' });
});

const gradeMagica = (q, solucao = false) => `<table class="magico">${[0, 1, 2].map((l) => `<tr>${[0, 1, 2].map((c) => {
  const v = q.jogo[l * 3 + c];
  return `<td class="${v ? 'dado' : ''}">${v || (solucao ? q.solucao[l * 3 + c] : '')}</td>`;
}).join('')}</tr>`).join('')}</table>`;
L.pagina(`<h2 class="titulo-jogo">Quadrados mágicos</h2>
  <p class="instrucao">Escreva os números de <b>1 a 9</b>, sem repetir, para que <b>cada linha, cada coluna e as duas diagonais somem 15</b>. Dica: o número do centro é sempre o mesmo. Você descobre qual?</p>
  <div class="magicos">${magicos.map((q, i) => `<figure>${gradeMagica(q)}<figcaption>Quadrado ${i + 1}</figcaption></figure>`).join('')}</div>`,
{ est: cores.magico, rotulo: 'Quadrados mágicos', titulo: 'Quadrados mágicos' });

// respostas
const titR = (t) => `<h3 class="resp-tit">${t}</h3>`;
L.pagina(`<h1 class="titulo">Respostas</h1>${titR('Sudokus')}
  <div class="resp-sudokus b">${sudokus.map((s, i) => `<div><small>${s.diag ? 'Sudoku X' : 'Sudoku'} ${i + 1}</small>${gradeSudoku(s.solucao, 4.4)}</div>`).join('')}</div>
  ${titR('Quadrados mágicos')}<div class="magicos mini">${magicos.map((q, i) => `<figure>${gradeMagica(q, true)}<figcaption>${i + 1}</figcaption></figure>`).join('')}</div>`,
{ est: cores.geral, titulo: 'Respostas' });
L.pagina(`${titR('Problemas de lógica')}<div class="resp-logica">${logicas.map((p, i) => `<div><small>Lógica ${i + 1} · ${p.titulo}</small>
  <table class="tabela-logica mini"><thead><tr><th></th>${[1, 2, 3, 4].map((n) => `<th>Casa ${n}</th>`).join('')}</tr></thead>
  <tbody>${p.cats.map((c, a) => `<tr><th>${a === 0 ? 'Nome' : atributos[c].titulo}</th>${p.casas.map((casa) => `<td>${casa[a]}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`).join('')}</div>
  ${titR('Xadrez · mate em 2 (primeiro lance)')}
  <ol class="resp-mates2">${mates.map((m) => `<li><b>${m.chave}</b></li>`).join('')}</ol>
  <p class="resp-txt">Notação: R (rei), D (dama), T (torre), B (bispo), C (cavalo). Depois do primeiro lance, qualquer resposta das pretas permite o mate no lance seguinte.</p>`,
{ est: cores.geral });
L.pagina(`${titR('Criptogramas')}<ol class="resp-cripto">${criptos.map((c) => `<li>${c.frase}.</li>`).join('')}</ol>
  ${titR('Palavras cruzadas')}<div class="resp-cruz">${cruzadas.map((t) => `<div><small>${t.tema}</small>${gradeCruz(t, { solucao: true, tam: Math.min(5, 84 / t.grade[0].length, 70 / t.grade.length) })}</div>`).join('')}</div>
  <div class="fim"><p>Parabéns por chegar até aqui!</p><small>Material do Mente Ativa para uso pessoal e familiar. Proibida a revenda ou distribuição.</small></div>`,
{ est: cores.geral });

const itensSum = [['Sudoku difícil', '4 grades com poucas pistas'], ['Sudoku X', '4 grades com diagonais'], ['Problemas de lógica', '4 enigmas de dedução'],
  ['Xadrez · mate em 2', '8 problemas'], ['Criptogramas', '6 ditados escondidos'], ['Palavras cruzadas', '4 temas'], ['Quadrados mágicos', '4 desafios'], ['Respostas', 'de tudo']];
L.paginas[SUM] = molduraPagina(`<h1 class="titulo">Para quem gosta de desafio</h1>${vinheta(cores.geral.cor)}
  <p class="lead">Este caderno é para quem já resolveu o kit inteiro e quer ir além. Os desafios são mais difíceis e pedem
  paciência, atenção e, às vezes, um lápis com borracha por perto.</p>
  <div class="sumario">${itensSum.map(([t, d]) => `<div class="sum-item"><div class="sum-linha"><span>${t} <small class="sum-desc">${d}</small></span><i></i><b>${L.sumario[t]}</b></div></div>`).join('')}</div>
  <div style="margin-top:7mm">${lista(['<b>Sem pressa:</b> um problema difícil pode levar vários dias. Isso faz parte da graça.', '<b>Juntos:</b> resolver em dupla, discutindo as pistas, é ainda mais divertido.', '<b>Travou?</b> Olhe só a primeira linha da resposta e tente continuar sozinho.'])}</div>`,
{ est: cores.geral, numero: SUM + 1, marca: 'Mente Ativa · Nível Avançado', frase: 'desafio também é cuidado' });

const cssAvancado = `
.sudoku.x tr:nth-child(1) td:nth-child(1), .sudoku.x tr:nth-child(2) td:nth-child(2), .sudoku.x tr:nth-child(3) td:nth-child(3),
.sudoku.x tr:nth-child(4) td:nth-child(4), .sudoku.x tr:nth-child(5) td:nth-child(5), .sudoku.x tr:nth-child(6) td:nth-child(6),
.sudoku.x tr:nth-child(7) td:nth-child(7), .sudoku.x tr:nth-child(8) td:nth-child(8), .sudoku.x tr:nth-child(9) td:nth-child(9),
.sudoku.x tr:nth-child(1) td:nth-child(9), .sudoku.x tr:nth-child(2) td:nth-child(8), .sudoku.x tr:nth-child(3) td:nth-child(7),
.sudoku.x tr:nth-child(4) td:nth-child(6), .sudoku.x tr:nth-child(6) td:nth-child(4),
.sudoku.x tr:nth-child(7) td:nth-child(3), .sudoku.x tr:nth-child(8) td:nth-child(2), .sudoku.x tr:nth-child(9) td:nth-child(1) { background: #E6DFF3; }
.pistas { padding-left: 8mm; margin-bottom: 5mm; }
.pistas li { font-size: 12pt; line-height: 1.5; margin-bottom: 1.2mm; }
.pistas li::marker { font-weight: 700; color: var(--cor); }
.tabela-logica { width: 100%; border-collapse: collapse; margin-top: auto; }
.tabela-logica th, .tabela-logica td { border: 1px solid #C9BFB2; padding: 2mm; font-size: 11pt; text-align: center; }
.tabela-logica thead th { background: var(--cor); color: #fff; font-weight: 600; }
.tabela-logica tbody th { background: #F4EFE8; text-align: left; width: 38mm; font-weight: 600; }
.tabela-logica td { height: 13mm; background: #fff; }
.tabela-logica.mini th, .tabela-logica.mini td { font-size: 8.5pt; padding: 1mm; height: auto; }
.tabela-logica.mini tbody th { width: 26mm; }
.opcoes { font-size: 9.5pt; color: #6E625C; margin-top: 2.5mm; line-height: 1.5; }
.mates2 { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; align-content: center; justify-items: center; }
.mates2 figcaption { font-family: 'Lora'; font-weight: 600; text-align: center; margin-top: 1.5mm; }
.cripto-bloco { margin-bottom: 10mm; }
.cripto-bloco h3 { font-size: 13pt; color: var(--cor); margin-bottom: 2mm; }
.cripto { display: flex; flex-wrap: wrap; gap: 6mm 8mm; }
.cp { display: flex; gap: 1mm; }
.cl { display: flex; flex-direction: column; align-items: center; width: 10mm; }
.cl span { width: 10mm; height: 11mm; border-bottom: 2px solid #2B2B2B; display: grid; place-items: center; font-size: 17pt; font-weight: 700; }
.cl span.rev { color: var(--cor); }
.cl i { font-style: normal; font-size: 9pt; color: #6E625C; font-weight: 600; margin-top: .6mm; }
.apoio { margin-top: auto; }
.apoio b { font-size: 10pt; color: var(--cor); }
.apoio div { display: grid; grid-template-columns: repeat(13, 1fr); gap: 1.2mm; margin-top: 1.5mm; }
.apoio span { border: 1px solid #C9BFB2; height: 11mm; background: #fff; position: relative; }
.apoio span i { position: absolute; left: .8mm; top: .3mm; font-style: normal; font-size: 7pt; color: #6E625C; }
.magicos { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 10mm; align-content: center; justify-items: center; }
.magicos figcaption { text-align: center; font-family: 'Lora'; font-weight: 600; margin-top: 2mm; }
.magico { border-collapse: collapse; border: 2.5px solid #2B2B2B; }
.magico td { width: 22mm; height: 22mm; border: 1.2px solid #2B2B2B; text-align: center; font-size: 22pt; font-weight: 700; background: #fff; }
.magico td.dado { background: #FAF0DC; color: var(--cor); }
.magicos.mini { flex: none; grid-template-columns: repeat(4, 1fr); gap: 4mm; }
.magicos.mini .magico td { width: 8mm; height: 8mm; font-size: 9pt; }
.magicos.mini figcaption { font-size: 9pt; }
.resp-logica { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm 6mm; margin-bottom: 4mm; }
.resp-logica small { display: block; font-size: 8.5pt; color: #7A746A; margin-bottom: 1mm; text-transform: uppercase; letter-spacing: .06em; }
.resp-mates2 { columns: 4; padding-left: 7mm; font-size: 11pt; line-height: 1.8; }
.resp-cripto { padding-left: 7mm; font-size: 11pt; line-height: 1.7; margin-bottom: 3mm; }
`;

await gerarPDF({ paginas: L.paginas, titulo: 'Mente Ativa · Nível Avançado', html: path.join(dist, 'avancado.html'),
  pdf: path.join(dist, 'Order-Bump-Mente-Ativa-Nivel-Avancado.pdf'), cssExtra: cssExtra + cssAvancado });
