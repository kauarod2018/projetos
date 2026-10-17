// Gera o kit em HTML e PDF (A4) e as imagens de prévia da página de vendas.
// Uso: npm run build
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as c from './conteudo.mjs';
import { casaNoCampo, praia } from './cenas.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(raiz, 'dist');
const imgVendas = path.join(raiz, 'pagina-de-vendas', 'img');

const cores = {
  memoria: '#E4572E', domino: '#2D7DD2', bingo: '#E9A03B', pares: '#4E8F4A',
  sequencias: '#7B4FB8', ditados: '#178C8C', quebra: '#D2557A', conversa: '#B5651D',
};

// ---------- utilidades ----------
const paginas = [];
let numPagina = 0;

function pagina(conteudo, { classe = '', rodape = true } = {}) {
  numPagina++;
  paginas.push(`<section class="page ${classe}">${conteudo}${
    rodape ? `<footer><span>${c.marca.nome} · ${c.marca.subtitulo}</span><span>${numPagina}</span></footer>` : ''
  }</section>`);
}

function topoCartas(titulo, cor, extra = '') {
  return `<div class="topo-cartas" style="--cor:${cor}">
    <strong>${titulo}</strong>${extra ? `<span>${extra}</span>` : ''}
    <em>✂ Recorte nas linhas tracejadas</em></div>`;
}

function grade(itens, cols, rows, cor) {
  return `<div class="grade" style="--cols:${cols};--rows:${rows};--cor:${cor}">${itens.join('')}</div>`;
}

const carta = (emoji, palavra, extra = '') =>
  `<div class="carta ${extra}"><span class="emo">${emoji}</span><span class="pal">${palavra}</span></div>`;

function embaralhar(lista, semente) {
  const r = mulberry32(semente);
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function abertura({ n, emoji, nome, cor, nivel, jogadores, tempo, serve, material, passos, facil, dificil, dica, extra = '' }) {
  pagina(`
  <header class="abertura" style="--cor:${cor}">
    <div class="num">Jogo ${n}</div>
    <h1>${nome}</h1>
    <div class="selo">${emoji}</div>
    <ul class="info">
      <li><b>Nível</b>${nivel}</li><li><b>Jogadores</b>${jogadores}</li><li><b>Tempo</b>${tempo}</li>
    </ul>
  </header>
  <div class="corpo" style="--cor:${cor}">
    <div class="duas">
      <div class="bloco"><h3>Para que serve</h3><ul>${serve.map((s) => `<li>${s}</li>`).join('')}</ul></div>
      <div class="bloco"><h3>Você vai precisar</h3><ul>${material.map((s) => `<li>${s}</li>`).join('')}</ul></div>
    </div>
    <div class="bloco"><h3>Como jogar</h3><ol class="passos">${passos.map((s) => `<li>${s}</li>`).join('')}</ol></div>
    <div class="duas">
      <div class="bloco"><h3>Para facilitar</h3><p>${facil}</p></div>
      <div class="bloco"><h3>Para desafiar</h3><p>${dificil}</p></div>
    </div>
    ${extra}
    <div class="dica"><b>💛 Dica para quem cuida</b><p>${dica}</p></div>
  </div>`);
}

// ---------- capa e páginas iniciais ----------
const emojisCapa = ['🍎', '🌻', '☕', '📻', '🐓', '🧩', '🎲', '🐈', '🍰', '🚲', '🌹', '🎸'];
pagina(`
  <div class="capa">
    <div class="capa-emojis">${emojisCapa.map((e) => `<span>${e}</span>`).join('')}</div>
    <div class="capa-texto">
      <p class="capa-kicker">Kit para imprimir e recortar</p>
      <h1>${c.marca.nome}</h1>
      <h2>${c.marca.subtitulo}</h2>
      <p class="capa-chamada">${c.marca.chamada}</p>
      <ul class="capa-lista">
        <li>8 jogos completos</li><li>31 páginas</li><li>Letras e figuras grandes</li><li>Guia para o cuidador</li>
      </ul>
    </div>
  </div>`, { classe: 'pag-capa', rodape: false });

pagina(`
  <h1 class="titulo-pag">Seja bem-vindo(a)!</h1>
  <p class="lead">Este kit foi feito para quem cuida de alguém especial: filhos, netos, cuidadores e familiares que
  querem transformar o tempo junto em momentos leves, divertidos e cheios de conversa.</p>
  <p>Os jogos estimulam memória, atenção, linguagem, coordenação das mãos e — principalmente — a convivência.
  Não existe certo ou errado: o objetivo é estar junto, rir e relembrar.</p>
  <h2 class="sub">Como preparar o material</h2>
  <ol class="passos grandes">
    <li><b>Imprima</b> em papel mais grosso (180g ou mais) ou cole as folhas em papelão fino ou cartolina.</li>
    <li><b>Recorte</b> nas linhas tracejadas. Peça ajuda na hora de recortar: isso também é atividade!</li>
    <li><b>Proteja</b> as cartas com plástico adesivo (contact) ou plastificação para durarem muito mais.</li>
    <li><b>Guarde</b> cada jogo num envelope ou saquinho com o nome escrito.</li>
  </ol>
  <h2 class="sub">7 dicas para jogar bem</h2>
  <div class="dicas-grid">
    <div><span>⏰</span><p><b>Sessões curtas.</b> De 15 a 30 minutos é o ideal. Pare antes de cansar.</p></div>
    <div><span>🌤️</span><p><b>Escolha o melhor horário.</b> Aquele em que a pessoa está mais disposta.</p></div>
    <div><span>💡</span><p><b>Boa luz e mesa livre.</b> Sem TV ligada e com os óculos por perto.</p></div>
    <div><span>🤝</span><p><b>Jogue junto, não teste.</b> Evite “você não lembra?”. Prefira “vamos ver juntos?”.</p></div>
    <div><span>👏</span><p><b>Elogie o esforço,</b> não só o acerto.</p></div>
    <div><span>🎚️</span><p><b>Ajuste o nível.</b> Comece fácil e aumente aos poucos. Cada jogo traz sugestões.</p></div>
    <div><span>📝</span><p><b>Anote os momentos.</b> Use a ficha de acompanhamento no final do kit.</p></div>
  </div>
  <p class="aviso">Este material é de lazer e estímulo. Ele não substitui o acompanhamento de médicos, terapeutas
  ocupacionais, fonoaudiólogos ou outros profissionais de saúde.</p>`);

const sumario = [
  ['🃏', 'Jogo da Memória', 'Fácil a médio', cores.memoria],
  ['🎲', 'Dominó de Figuras', 'Fácil', cores.domino],
  ['🎯', 'Bingo das Lembranças', 'Fácil', cores.bingo],
  ['🔗', 'O que combina com o quê?', 'Fácil', cores.pares],
  ['🔢', 'Sequências do Dia a Dia', 'Médio', cores.sequencias],
  ['💬', 'Complete o Ditado', 'Médio', cores.ditados],
  ['🧩', 'Quebra-cabeças', 'Fácil a médio', cores.quebra],
  ['☕', 'Cartas de Conversa', 'Livre', cores.conversa],
];
pagina(`
  <h1 class="titulo-pag">O que tem neste kit</h1>
  <div class="sumario">
    ${sumario.map(([e, n, nv, cor], i) => `<div class="item-sum" style="--cor:${cor}">
      <span class="sum-n">${i + 1}</span><span class="sum-e">${e}</span>
      <span class="sum-t">${n}<small>${nv}</small></span></div>`).join('')}
  </div>
  <div class="extras">
    <div><b>📋 Ficha de acompanhamento</b><p>Para anotar os jogos, o humor e as conquistas de cada dia.</p></div>
    <div><b>✅ Respostas</b><p>Gabarito dos pares, sequências e ditados no final do kit.</p></div>
  </div>`);

// ---------- 1. Memória ----------
abertura({
  n: 1, emoji: '🃏', nome: 'Jogo da Memória', cor: cores.memoria,
  nivel: 'Fácil a médio', jogadores: '1 a 4', tempo: '15 a 25 min',
  serve: ['Memória de curto prazo', 'Atenção e concentração', 'Nomear objetos e frutas'],
  material: ['As 24 cartas recortadas (12 pares)', 'Uma mesa livre'],
  passos: [
    'Embaralhe as cartas e coloque todas viradas para baixo.',
    'Cada pessoa, na sua vez, vira duas cartas e diz o nome das figuras em voz alta.',
    'Se forem iguais, guarda o par e joga de novo. Se não, desvira as cartas no mesmo lugar.',
    'Ganha quem juntar mais pares — mas o melhor é comemorar cada acerto!',
  ],
  facil: 'Comece com 4 ou 6 pares e as cartas viradas para cima: a pessoa só precisa encontrar as iguais.',
  dificil: 'Use os 12 pares. Ao formar um par, peça para contar uma lembrança ligada à figura.',
  dica: 'Se a pessoa esquecer onde estava uma carta, aponte a região da mesa em vez de dar a resposta. Dar pistas mantém a autoestima em alta.',
});
const cartasMemoria = c.memoria.map(([e, p]) => carta(e, p));
for (let i = 0; i < 2; i++) {
  pagina(topoCartas('Jogo da Memória', cores.memoria, `Folha ${i + 1} de 2`) + grade(cartasMemoria, 3, 4, cores.memoria));
}

// ---------- 2. Dominó ----------
abertura({
  n: 2, emoji: '🎲', nome: 'Dominó de Figuras', cor: cores.domino,
  nivel: 'Fácil', jogadores: '2 a 4', tempo: '15 a 30 min',
  serve: ['Comparar e reconhecer figuras', 'Raciocínio e planejamento', 'Coordenação das mãos'],
  material: ['As 28 peças recortadas', 'Uma mesa livre'],
  passos: [
    'Vire as peças para baixo e misture. Cada jogador pega 7 peças (com 2 jogadores, 7 cada e o resto fica no “monte”).',
    'Quem tiver a peça com duas maçãs começa.',
    'Na sua vez, encaixe uma peça que tenha a mesma figura de uma das pontas da fila.',
    'Se não tiver, compre do monte. Ganha quem terminar as peças primeiro.',
  ],
  facil: 'Jogue com as peças abertas na mesa e ajude a procurar o encaixe. Diga o nome da figura em voz alta.',
  dificil: 'Esconda as peças dos outros jogadores e conte os pontos de quem ficou com peças na mão.',
  dica: 'O dominó costuma ser um jogo conhecido. Pergunte se a pessoa jogava antigamente e com quem — é uma ótima ponte para a conversa.',
});
const pecas = [];
for (let i = 0; i < c.domino.length; i++) {
  for (let j = i; j < c.domino.length; j++) {
    const [ea, pa] = c.domino[i];
    const [eb, pb] = c.domino[j];
    pecas.push(`<div class="peca"><div>${carta(ea, pa)}</div><i></i><div>${carta(eb, pb)}</div></div>`);
  }
}
for (let i = 0; i < 2; i++) {
  pagina(topoCartas('Dominó de Figuras', cores.domino, `Folha ${i + 1} de 2`) +
    `<div class="grade grade-domino" style="--cor:${cores.domino}">${pecas.slice(i * 14, i * 14 + 14).join('')}</div>`);
}

// ---------- 3. Bingo ----------
abertura({
  n: 3, emoji: '🎯', nome: 'Bingo das Lembranças', cor: cores.bingo,
  nivel: 'Fácil', jogadores: '2 a 7', tempo: '20 a 30 min',
  serve: ['Atenção e escuta', 'Reconhecer figuras e palavras', 'Socialização em grupo'],
  material: ['6 cartelas e 24 fichas de sorteio', 'Grãos de feijão, milho ou botões para marcar', 'Um saquinho ou pote para as fichas'],
  passos: [
    'Cada jogador pega uma cartela. Quem não joga vira o “cantor” do bingo.',
    'O cantor tira uma ficha do pote e fala o nome da figura em voz alta.',
    'Quem tiver a figura na cartela marca com um feijão.',
    'Quem completar uma linha (ou a cartela cheia) grita “BINGO!”.',
  ],
  facil: 'Mostre a ficha sorteada além de falar o nome. Jogue valendo uma linha só.',
  dificil: 'Fale só uma pista (“é amarela e o macaco adora”) sem dizer o nome nem mostrar a ficha.',
  dica: 'O bingo é perfeito para reunir a família no fim de semana. Um pequeno prêmio — um bombom, uma fruta — deixa tudo mais animado.',
});
const cartelas = [];
for (let k = 0; k < 6; k++) {
  const itens = embaralhar(c.bingo, 101 + k * 7).slice(0, 9);
  cartelas.push(`<div class="cartela" style="--cor:${cores.bingo}">
    <div class="cartela-topo">BINGO <span>Cartela ${k + 1}</span></div>
    <div class="cartela-grade">${itens.map(([e, p]) => carta(e, p)).join('')}</div></div>`);
}
for (let i = 0; i < 3; i++) {
  pagina(topoCartas('Bingo das Lembranças', cores.bingo, `Cartelas ${i * 2 + 1} e ${i * 2 + 2}`) +
    `<div class="cartelas">${cartelas.slice(i * 2, i * 2 + 2).join('')}</div>`);
}
pagina(topoCartas('Bingo das Lembranças', cores.bingo, 'Fichas de sorteio') +
  grade(c.bingo.map(([e, p]) => carta(e, p, 'pequena')), 4, 6, cores.bingo));

// ---------- 4. Pares ----------
abertura({
  n: 4, emoji: '🔗', nome: 'O que combina com o quê?', cor: cores.pares,
  nivel: 'Fácil', jogadores: '1 a 3', tempo: '10 a 20 min',
  serve: ['Raciocínio e associação de ideias', 'Vocabulário', 'Conversa sobre o dia a dia'],
  material: ['As 24 cartas recortadas (12 pares)'],
  passos: [
    'Espalhe as cartas viradas para cima na mesa.',
    'Peça para a pessoa encontrar duas cartas que “combinam” — como a abelha e o mel.',
    'Ao formar um par, pergunte: “por que essas duas combinam?”.',
    'Continue até formar todos os pares. As respostas estão no final do kit.',
  ],
  facil: 'Comece com 4 pares. Você pode segurar uma carta e oferecer duas opções para a outra.',
  dificil: 'Misture com as cartas da memória e do bingo. Aceite outras combinações, desde que a pessoa explique!',
  dica: 'Não existe uma única resposta certa. Se a pessoa juntar o pão com o leite e explicar que é café da manhã, comemore o raciocínio.',
});
const cartasPares = c.pares.flat().map(([e, p]) => carta(e, p));
for (let i = 0; i < 2; i++) {
  const folha = embaralhar(cartasPares, 7).slice(i * 12, i * 12 + 12);
  pagina(topoCartas('O que combina com o quê?', cores.pares, `Folha ${i + 1} de 2`) + grade(folha, 3, 4, cores.pares));
}

// ---------- 5. Sequências ----------
abertura({
  n: 5, emoji: '🔢', nome: 'Sequências do Dia a Dia', cor: cores.sequencias,
  nivel: 'Médio', jogadores: '1 a 2', tempo: '10 a 20 min',
  serve: ['Planejamento e organização', 'Noção de ordem e tempo', 'Lembrar tarefas da rotina'],
  material: ['As 16 cartas recortadas (4 histórias de 4 passos)'],
  passos: [
    'Separe as cartas pela cor da borda: cada cor é uma história.',
    'Entregue as 4 cartas de uma história, misturadas.',
    'Peça para colocar em ordem: o que vem primeiro, depois, e no final?',
    'Com as cartas em ordem, peça para contar a história em voz alta.',
  ],
  facil: 'Use só 3 cartas por história, ou coloque a primeira carta já no lugar.',
  dificil: 'Misture duas histórias e peça para separar e ordenar as duas ao mesmo tempo.',
  dica: 'Aproveite para fazer a atividade de verdade depois: passar um café ou regar uma planta juntos dá sentido ao jogo.',
});
const cartasSeq = c.sequencias.flatMap((s) =>
  s.passos.map(([e, p]) => `<div class="carta seq" style="--borda:${s.cor}"><small>${s.tema}</small><span class="emo">${e}</span><span class="pal">${p}</span></div>`));
pagina(topoCartas('Sequências do Dia a Dia', cores.sequencias, '4 histórias') +
  grade(embaralhar(cartasSeq, 21), 4, 4, cores.sequencias));

// ---------- 6. Ditados ----------
abertura({
  n: 6, emoji: '💬', nome: 'Complete o Ditado', cor: cores.ditados,
  nivel: 'Médio', jogadores: '1 a 4', tempo: '10 a 20 min',
  serve: ['Memória de longo prazo', 'Linguagem e leitura', 'Relembrar a sabedoria popular'],
  material: ['12 cartas de começo (bege) e 12 de final (verde)'],
  passos: [
    'Separe as cartas de começo e de final em dois montes.',
    'Leia em voz alta uma carta de começo: “Quem espera…”.',
    'Peça para completar de memória ou encontrar a carta de final certa.',
    'Junte as duas partes e leia o ditado inteiro juntos.',
  ],
  facil: 'Deixe só 3 opções de final na mesa para a pessoa escolher.',
  dificil: 'Peça para explicar o que o ditado quer dizer e lembrar de alguém que costumava falar isso.',
  dica: 'Ditados ficam guardados na memória mais antiga, que costuma ser preservada por mais tempo. Muitas vezes a pessoa completa sem esforço — e se sente muito bem com isso.',
});
pagina(topoCartas('Complete o Ditado', cores.ditados, 'Começos') +
  grade(c.ditados.map(([a]) => `<div class="carta texto inicio"><span>${a}…</span></div>`), 3, 4, cores.ditados));
pagina(topoCartas('Complete o Ditado', cores.ditados, 'Finais') +
  grade(embaralhar(c.ditados, 5).map(([, b]) => `<div class="carta texto final"><span>…${b}</span></div>`), 3, 4, cores.ditados));

// ---------- 7. Quebra-cabeças ----------
const miniatura = (svg) => `<svg viewBox="0 0 300 400" class="mini">${svg}</svg>`;
abertura({
  n: 7, emoji: '🧩', nome: 'Quebra-cabeças', cor: cores.quebra,
  nivel: 'Fácil a médio', jogadores: '1 a 2', tempo: '10 a 20 min',
  serve: ['Percepção visual e de espaço', 'Coordenação fina das mãos', 'Paciência e concentração'],
  material: ['Casa no Campo: 6 peças', 'Dia de Praia: 12 peças', 'Cole a folha em papelão antes de recortar'],
  passos: [
    'Mostre a figura pronta (abaixo) e converse sobre o que aparece nela.',
    'Misture as peças com a figura virada para cima.',
    'Comece pelos cantos e pelas partes fáceis: o sol, o céu, a casa.',
    'Monte até completar a figura. Deixe montado na mesa para admirar!',
  ],
  facil: 'Comece pela Casa no Campo (6 peças) e deixe a figura de referência ao lado.',
  dificil: 'Monte o Dia de Praia (12 peças) sem olhar a figura de referência.',
  dica: 'Se puder, imprima duas vezes: uma para recortar e outra inteira, para servir de “tampa da caixa”.',
  extra: `<div class="refs">${miniatura(casaNoCampo)}${miniatura(praia)}</div>`,
});
function quebra(titulo, svg, cols, rows) {
  const linhas = [];
  for (let i = 1; i < cols; i++) linhas.push(`<line x1="${(300 / cols) * i}" y1="0" x2="${(300 / cols) * i}" y2="400"/>`);
  for (let i = 1; i < rows; i++) linhas.push(`<line x1="0" y1="${(400 / rows) * i}" x2="300" y2="${(400 / rows) * i}"/>`);
  pagina(topoCartas('Quebra-cabeça', cores.quebra, `${titulo} · ${cols * rows} peças`) + `
    <div class="quebra"><svg viewBox="0 0 300 400" preserveAspectRatio="none">${svg}
      <g class="corte-branco">${linhas.join('')}</g><g class="corte">${linhas.join('')}</g>
      <rect x="0.5" y="0.5" width="299" height="399" fill="none" stroke="#555" stroke-width="1" stroke-dasharray="4 3"/>
    </svg></div>`);
}
quebra('Casa no Campo', casaNoCampo, 2, 3);
quebra('Dia de Praia', praia, 3, 4);

// ---------- 8. Conversa ----------
abertura({
  n: 8, emoji: '☕', nome: 'Cartas de Conversa', cor: cores.conversa,
  nivel: 'Livre', jogadores: '2 ou mais', tempo: 'Quanto quiserem',
  serve: ['Memória afetiva e autobiográfica', 'Fala e expressão', 'Fortalecer o vínculo familiar'],
  material: ['As 24 cartas de perguntas', 'Um cafezinho, se possível 🙂'],
  passos: [
    'Coloque as cartas viradas para baixo, num montinho.',
    'Cada um tira uma carta e lê a pergunta em voz alta.',
    'Quem tirou responde — e todos podem fazer mais perguntas sobre a história.',
    'Vale trocar de carta se a pergunta não agradar.',
  ],
  facil: 'Você lê e responde primeiro, contando uma história sua. Isso dá exemplo e deixa a pessoa à vontade.',
  dificil: 'Grave as respostas no celular ou anote num caderno: vira um livro de memórias da família.',
  dica: 'Algumas lembranças podem trazer saudade ou tristeza. Tudo bem: acolha, escute sem pressa e, se for o caso, mude de assunto com carinho.',
});
const cartasConversa = c.conversa.map(([e, cat, q]) =>
  `<div class="carta conversa"><div class="cat">${e} ${cat}</div><p>${q}</p></div>`);
for (let i = 0; i < 3; i++) {
  pagina(topoCartas('Cartas de Conversa', cores.conversa, `Folha ${i + 1} de 3`) +
    grade(cartasConversa.slice(i * 8, i * 8 + 8), 2, 4, cores.conversa));
}

// ---------- ficha e respostas ----------
pagina(`
  <h1 class="titulo-pag">Ficha de acompanhamento</h1>
  <p class="lead pequeno">Nome: ________________________________________ &nbsp; Mês: ______________</p>
  <table class="ficha">
    <thead><tr><th>Data</th><th>Jogo</th><th>Tempo</th><th>Como foi?</th><th>O que chamou atenção</th></tr></thead>
    <tbody>${'<tr><td></td><td></td><td></td><td class="carinhas">😊 😐 😟</td><td></td></tr>'.repeat(13)}</tbody>
  </table>
  <p class="nota">Leve esta ficha nas consultas: ela ajuda médicos e terapeutas a entenderem a rotina e as mudanças do dia a dia.</p>`);

pagina(`
  <h1 class="titulo-pag">Respostas</h1>
  <div class="respostas">
    <div class="bloco" style="--cor:${cores.pares}"><h3>O que combina com o quê?</h3>
      <ul>${c.pares.map(([[ea, a], [eb, b]]) => `<li>${ea} ${a} + ${eb} ${b}</li>`).join('')}</ul></div>
    <div class="bloco" style="--cor:${cores.sequencias}"><h3>Sequências do Dia a Dia</h3>
      ${c.sequencias.map((s) => `<p><b>${s.tema}:</b> ${s.passos.map(([, p], i) => `${i + 1}. ${p}`).join(' → ')}</p>`).join('')}</div>
    <div class="bloco largo" style="--cor:${cores.ditados}"><h3>Complete o Ditado</h3>
      <ul class="cols2">${c.ditados.map(([a, b]) => `<li>${a} ${b}.</li>`).join('')}</ul></div>
  </div>
  <div class="fim">
    <p>Obrigado por levar mais alegria para o dia de quem você ama. 💛</p>
    <small>Material para uso pessoal e familiar. Imprima quantas vezes quiser. Não é permitida a revenda ou distribuição.</small>
  </div>`);

// ---------- estilo ----------
const css = `
@page { size: A4; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { font-family: 'Inter', 'DejaVu Sans', sans-serif; color: #2B2522; background: #fff; }
.emo, .selo, .capa-emojis, .sum-e, .dicas-grid span { font-family: 'Noto Color Emoji', sans-serif; }
.page { width: 210mm; height: 297mm; padding: 11mm 11mm 14mm; position: relative; overflow: hidden;
  page-break-after: always; display: flex; flex-direction: column; background: #FFFCF7; }
footer { position: absolute; left: 11mm; right: 11mm; bottom: 6mm; display: flex; justify-content: space-between;
  font-size: 8.5pt; color: #9A8F87; }

/* capa */
.pag-capa { padding: 0; background: #FFF4E6; }
.capa { height: 100%; display: flex; flex-direction: column; }
.capa-emojis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 7mm; padding: 18mm 18mm 8mm; font-size: 64px; text-align: center; }
.capa-emojis span { background: #fff; border-radius: 22px; padding: 6mm 0; box-shadow: 0 2px 0 #F1D9BF; }
.capa-emojis span:nth-child(3n+1) { transform: rotate(-4deg); } .capa-emojis span:nth-child(3n+2) { transform: rotate(3deg); }
.capa-texto { flex: 1; background: #E4572E; color: #fff; padding: 14mm 18mm; border-radius: 40px 40px 0 0; }
.capa-kicker { text-transform: uppercase; letter-spacing: .14em; font-size: 12pt; font-weight: 700; opacity: .85; }
.capa h1 { font-family: 'Inter Display', 'Inter'; font-weight: 900; font-size: 66pt; line-height: 1; margin: 3mm 0 2mm; }
.capa h2 { font-weight: 700; font-size: 22pt; line-height: 1.2; }
.capa-chamada { font-size: 15pt; margin-top: 5mm; max-width: 150mm; line-height: 1.4; }
.capa-lista { list-style: none; display: flex; gap: 4mm; margin-top: 9mm; flex-wrap: wrap; }
.capa-lista li { background: #fff; color: #C2401C; font-weight: 800; padding: 3mm 5mm; border-radius: 99px; font-size: 12pt; }

/* páginas de texto */
.titulo-pag { font-family: 'Inter Display', 'Inter'; font-size: 30pt; font-weight: 900; color: #C2401C; margin-bottom: 5mm; }
.lead { font-size: 14pt; line-height: 1.45; margin-bottom: 3mm; }
.lead.pequeno { font-size: 12pt; margin-bottom: 5mm; }
.page > p { font-size: 12pt; line-height: 1.5; }
.sub { font-size: 16pt; margin: 7mm 0 3mm; color: #2B2522; }
.passos { padding-left: 0; list-style: none; counter-reset: p; }
.passos li { counter-increment: p; position: relative; padding-left: 11mm; margin-bottom: 3mm; font-size: 13pt; line-height: 1.45; }
.passos li::before { content: counter(p); position: absolute; left: 0; top: -.5mm; width: 7.5mm; height: 7.5mm; border-radius: 50%;
  background: var(--cor, #E4572E); color: #fff; font-weight: 800; display: grid; place-items: center; font-size: 11pt; }
.dicas-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3.5mm; }
.dicas-grid div { display: flex; gap: 3mm; align-items: flex-start; background: #fff; border: 1px solid #F0E2D2; border-radius: 12px; padding: 3mm 4mm; }
.dicas-grid span { font-size: 22pt; line-height: 1; }
.dicas-grid p { font-size: 11pt; line-height: 1.4; }
.aviso { margin-top: auto; font-size: 9.5pt !important; color: #7A6F68; border-top: 1px solid #E8DCCD; padding-top: 3mm; }

.sumario { display: grid; gap: 3.5mm; }
.item-sum { display: flex; align-items: center; gap: 5mm; background: #fff; border-radius: 14px; padding: 4mm 6mm; border-left: 8px solid var(--cor); }
.sum-n { font-size: 20pt; font-weight: 900; color: var(--cor); width: 9mm; }
.sum-e { font-size: 26pt; }
.sum-t { font-size: 16pt; font-weight: 800; display: flex; flex-direction: column; }
.sum-t small { font-size: 10.5pt; font-weight: 600; color: #8A7F78; }
.extras { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; margin-top: 6mm; }
.extras div { background: #FFF1E3; border-radius: 14px; padding: 4mm 5mm; font-size: 11pt; line-height: 1.4; }
.extras b { font-size: 12.5pt; }

/* aberturas */
.abertura { background: var(--cor); color: #fff; border-radius: 20px; padding: 8mm 9mm 7mm; position: relative; margin-bottom: 6mm; }
.abertura .num { text-transform: uppercase; letter-spacing: .15em; font-weight: 800; font-size: 11pt; opacity: .85; }
.abertura h1 { font-family: 'Inter Display', 'Inter'; font-size: 30pt; font-weight: 900; line-height: 1.1; margin: 1mm 0 5mm; max-width: 130mm; }
.selo { position: absolute; right: 8mm; top: 7mm; font-size: 56px; background: #fff; border-radius: 50%; width: 30mm; height: 30mm; display: grid; place-items: center; }
.info { list-style: none; display: flex; gap: 3mm; }
.info li { background: rgba(255,255,255,.18); border-radius: 10px; padding: 2mm 4mm; font-size: 11.5pt; display: flex; flex-direction: column; }
.info b { font-size: 8.5pt; text-transform: uppercase; letter-spacing: .08em; opacity: .85; }
.corpo { display: flex; flex-direction: column; gap: 4mm; flex: 1; }
.duas { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; }
.bloco { background: #fff; border: 1px solid #EFE4D8; border-radius: 14px; padding: 4mm 5mm; }
.bloco h3 { color: var(--cor); font-size: 13.5pt; margin-bottom: 2.5mm; }
.bloco ul { padding-left: 5mm; } .bloco li { font-size: 12.5pt; line-height: 1.45; margin-bottom: 1mm; }
.bloco p { font-size: 12.5pt; line-height: 1.45; }
.dica { background: #FFF5D6; border-radius: 14px; padding: 4mm 5mm; margin-top: auto; }
.dica b { font-size: 13.5pt; } .dica p { font-size: 12.5pt; line-height: 1.45; margin-top: 1.5mm; }
.refs { display: flex; gap: 6mm; justify-content: center; }
.mini { height: 52mm; border-radius: 8px; box-shadow: 0 0 0 1px #E8DCCD; }

/* cartas */
.topo-cartas { display: flex; align-items: baseline; gap: 4mm; margin-bottom: 4mm; padding-bottom: 2mm; border-bottom: 3px solid var(--cor); }
.topo-cartas strong { font-size: 15pt; color: var(--cor); }
.topo-cartas span { font-size: 11pt; color: #7A6F68; }
.topo-cartas em { margin-left: auto; font-style: normal; font-size: 10pt; color: #7A6F68; }
.grade { flex: 1; display: grid; grid-template-columns: repeat(var(--cols), 1fr); grid-template-rows: repeat(var(--rows), 1fr); }
.carta { outline: 1.3px dashed #8F8680; outline-offset: -0.65px; background: #fff; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 2mm; padding: 3mm; text-align: center; position: relative; }
.grade > .carta::after { content: ''; position: absolute; inset: 3.5mm; border: 2.5px solid var(--cor); border-radius: 12px; opacity: .55; pointer-events: none; }
.carta .emo { font-size: 74px; line-height: 1; }
.carta .pal { font-size: 17pt; font-weight: 800; }
.carta.pequena .emo { font-size: 44px; } .carta.pequena .pal { font-size: 12pt; }
.carta.seq { padding: 6mm 4mm; } .carta.seq::after { border-color: var(--borda) !important; border-width: 4px !important; opacity: 1 !important; }
.carta.seq small { font-size: 9pt; font-weight: 700; color: var(--borda); text-transform: uppercase; letter-spacing: .05em; }
.carta.seq .emo { font-size: 58px; } .carta.seq .pal { font-size: 13.5pt; line-height: 1.2; }
.carta.texto span { font-size: 18pt; font-weight: 800; line-height: 1.25; padding: 0 5mm; }
.carta.texto.final { background: #E3F4EF; }
.carta.conversa { justify-content: flex-start; align-items: flex-start; text-align: left; padding: 8mm 9mm; }
.carta.conversa .cat { font-size: 11pt; font-weight: 800; color: var(--cor); text-transform: uppercase; letter-spacing: .06em; margin-bottom: 3mm; }
.carta.conversa p { font-size: 17pt; font-weight: 700; line-height: 1.3; }

.grade-domino { grid-template-columns: 1fr 1fr; grid-template-rows: repeat(7, 1fr); }
.peca { outline: 1.3px dashed #8F8680; outline-offset: -0.65px; display: flex; align-items: stretch; padding: 3mm; background: #fff; }
.peca > div { flex: 1; display: flex; }
.peca > div > .carta { flex: 1; outline: none; padding: 0; gap: 0; }
.peca .carta .emo { font-size: 52px; } .peca .carta .pal { font-size: 10pt; font-weight: 700; color: #7A6F68; }
.peca { position: relative; } .peca::after { content: ''; position: absolute; inset: 3mm; border: 3px solid var(--cor); border-radius: 12px; }
.peca i { width: 3px; background: var(--cor); margin: 2mm 0; }

.cartelas { flex: 1; display: grid; grid-template-rows: 1fr 1fr; gap: 6mm; }
.cartela { outline: 1.3px dashed #8F8680; padding: 4mm; display: flex; flex-direction: column; background: #fff; }
.cartela-topo { background: var(--cor); color: #fff; font-weight: 900; font-size: 20pt; letter-spacing: .2em; text-align: center; border-radius: 10px 10px 0 0; padding: 1.5mm; }
.cartela-topo span { font-size: 10pt; letter-spacing: .05em; font-weight: 700; opacity: .9; margin-left: 3mm; }
.cartela-grade { flex: 1; display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(3, 1fr); border: 3px solid var(--cor); border-top: 0; }
.cartela-grade .carta { outline: none; border: 1.5px solid #F1D9A8; gap: 1mm; padding: 1mm; }
.cartela-grade .emo { font-size: 46px; } .cartela-grade .pal { font-size: 13pt; }

.quebra { flex: 1; display: flex; }
.quebra svg { width: 100%; height: 100%; }
.corte line { stroke: #333; stroke-width: 1; stroke-dasharray: 5 3; }
.corte-branco line { stroke: #fff; stroke-width: 3; opacity: .9; }

/* ficha e respostas */
.ficha { width: 100%; border-collapse: collapse; font-size: 11pt; flex: 1; }
.ficha th { background: #E4572E; color: #fff; padding: 2.5mm; text-align: left; }
.ficha td { border: 1px solid #E2D5C6; height: 15mm; padding: 2mm; background: #fff; }
.ficha td.carinhas { font-family: 'Noto Color Emoji'; font-size: 15pt; white-space: nowrap; letter-spacing: 2px; }
.ficha th:nth-child(1) { width: 18mm; } .ficha th:nth-child(3) { width: 18mm; } .ficha th:nth-child(4) { width: 30mm; }
.nota { margin-top: 4mm; font-size: 10.5pt !important; color: #7A6F68; }
.respostas { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; }
.respostas .largo { grid-column: 1 / -1; }
.respostas li, .respostas p { font-size: 11pt; line-height: 1.5; }
.respostas p { margin-bottom: 2mm; }
.cols2 { columns: 2; column-gap: 8mm; }
.fim { margin-top: auto; text-align: center; background: #FFF1E3; border-radius: 16px; padding: 6mm; }
.fim p { font-size: 15pt; font-weight: 800; color: #C2401C; margin-bottom: 2mm; }
.fim small { font-size: 9.5pt; color: #7A6F68; }
`;

const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>${c.marca.nome} – ${c.marca.subtitulo}</title><style>${css}</style></head>
<body>${paginas.join('\n')}</body></html>`;

await mkdir(dist, { recursive: true });
await mkdir(imgVendas, { recursive: true });
const arquivoHtml = path.join(dist, 'kit-mente-ativa.html');
await writeFile(arquivoHtml, html);

const navegador = await chromium.launch();
const aba = await navegador.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 1.5 });
await aba.goto('file://' + arquivoHtml);
await aba.evaluate(() => document.fonts.ready);
await aba.pdf({ path: path.join(dist, 'Kit-Mente-Ativa-Jogos-Recortaveis.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true });

// Prévias para a página de vendas: capa + uma folha de cada jogo.
const secoes = await aba.$$('section.page');
const previas = { capa: 0, memoria: 5, domino: 7, bingo: 10, pares: 15, sequencias: 18, ditados: 20, quebra: 24, conversa: 27 };
for (const [nome, i] of Object.entries(previas)) {
  await secoes[i].screenshot({ path: path.join(imgVendas, `${nome}.jpg`), type: 'jpeg', quality: 80 });
}
await navegador.close();
console.log(`OK: ${paginas.length} páginas geradas em dist/`);
