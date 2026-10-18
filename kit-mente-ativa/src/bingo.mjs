// Order bump: Kit Bingo para Grupos.
// Uso: npm run build:bingo
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as g from './geradores.mjs';
import { paleta, vinheta, flor } from './flores.mjs';
import { molduraPagina, gerarPDF } from './layout.mjs';
import { livro, lista, capa, cssExtra } from './livro.mjs';
import { cancoesGrupo, lembrancas, variacoesBingo } from './conteudo-extras.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(raiz, 'dist');

const cores = {
  geral: { cor: '#A84B60', tint: '#F8E6EA', medio: '#E8B4C0', flores: [paleta.rosa, paleta.amarelo, paleta.lavanda] },
  numeros: { cor: '#3A6F6B', tint: '#E3F0EE', medio: '#A9CEC9', flores: [paleta.lavanda, paleta.pessego, paleta.rosa] },
  cancoes: { cor: '#9C6A1F', tint: '#FAF0DC', medio: '#E8CD92', flores: [paleta.rosa, paleta.amarelo, paleta.lavanda] },
  lembrancas: { cor: '#6B5B95', tint: '#EEE9F6', medio: '#C9BCE3', flores: [paleta.lavanda, paleta.rosa, paleta.amarelo] },
  festa: { cor: '#B0643A', tint: '#FBEADF', medio: '#EDC0A2', flores: [paleta.pessego, paleta.amarelo, paleta.rosa] },
};

const L = livro('Mente Ativa · Kit Bingo', 'jogar junto é cuidar');
const fz = (cor, tam = 4.5) => `<svg viewBox="-10 -10 20 20" style="width:${tam}mm;height:${tam}mm;vertical-align:-1mm">${flor(0, 0, 9, cor)}</svg>`;
const avisoCorte = '<p class="aviso-corte">✂ Recorte nas linhas tracejadas. Para durar mais, cole em papel-cartão ou plastifique.</p>';

// ---------- cartelas ----------
// Números: padrão de 75 bolas (B 1–15, I 16–30, N 31–45, G 46–60, O 61–75), com o centro livre.
const cartelasNumeros = [];
{
  const r = g.aleatorio(4040);
  const vistas = new Set();
  while (cartelasNumeros.length < 12) {
    const cols = [0, 1, 2, 3, 4].map((c) => g.embaralhar(Array.from({ length: 15 }, (_, i) => c * 15 + i + 1), r).slice(0, 5).sort((a, b) => a - b));
    cols[2][2] = 0;
    const chave = cols.flat().join(',');
    if (!vistas.has(chave)) { vistas.add(chave); cartelasNumeros.push(cols); }
  }
}
const cartelasTexto = (pool, n, tam, semente) => {
  const r = g.aleatorio(semente);
  const out = [];
  const vistas = new Set();
  while (out.length < n) {
    const itens = g.embaralhar(pool.map((_, i) => i), r).slice(0, tam);
    const chave = [...itens].sort((a, b) => a - b).join(',');
    if (!vistas.has(chave)) { vistas.add(chave); out.push(itens); }
  }
  return out;
};
const cartelasCancoes = cartelasTexto(cancoesGrupo, 10, 16, 5050);
const cartelasLembrancas = cartelasTexto(lembrancas, 8, 16, 6060);
// Cada item precisa aparecer em pelo menos uma cartela.
for (const [pool, cs, nome] of [[cancoesGrupo, cartelasCancoes, 'canções'], [lembrancas, cartelasLembrancas, 'lembranças']]) {
  const usados = new Set(cs.flat());
  if (usados.size !== pool.length) throw new Error(`Bingo de ${nome}: ${pool.length - usados.size} itens fora das cartelas`);
}

const desenhaNumeros = (cols, n) => `<div class="cartela-g num">
  <div class="cg-topo"><span>Bingo</span><small>Cartela ${n}</small></div>
  <div class="cg-letras">${'BINGO'.split('').map((l) => `<b>${l}</b>`).join('')}</div>
  <div class="cg-grade c5">${[0, 1, 2, 3, 4].map((l) => cols.map((col) => (col[l] ? `<div>${col[l]}</div>` : `<div class="livre">${fz(paleta.rosa, 9)}<small>livre</small></div>`)).join('')).join('')}</div></div>`;
const desenhaTexto = (itens, pool, n, titulo) => `<div class="cartela-g txt">
  <div class="cg-topo"><span>${titulo}</span><small>Cartela ${n}</small></div>
  <div class="cg-grade c4">${itens.map((i) => `<div>${pool[i][0]}</div>`).join('')}</div></div>`;

// ---------- páginas ----------
L.pagina(capa({
  est: cores.geral, kicker: 'kit especial', titulo: 'Bingo<br>para Grupos', sub: 'Tudo para uma tarde de bingo inesquecível',
  chamada: '30 cartelas em três modalidades, fichas de sorteio, roteiro completo, convites, placar e certificados de campeão.',
  selos: ['12 cartelas de números', '10 de canções', '8 de lembranças', 'roteiro da tarde', 'convites e certificados'], selo: 'Mente Ativa · kit bingo',
}), { est: cores.geral, classe: 'capa', rodape: false });

const SUM = L.paginas.length;
L.pagina('', { est: cores.geral });

L.pagina(`<h1 class="titulo">Como organizar a tarde de bingo</h1>
  <p class="lead pequeno">Um roteiro simples para casas de repouso, centros-dia, grupos de convivência ou a família reunida no domingo.</p>
  <div class="roteiro">
    <div><h3>${fz(paleta.rosa)} Antes do dia</h3>${lista([
      'Escolha a modalidade: <b>números</b> (o bingo clássico), <b>canções</b> (para cantar junto) ou <b>lembranças</b> (para conversar).',
      'Imprima uma cartela por pessoa e um jogo de fichas de sorteio. Recorte as fichas e guarde num saquinho de pano ou pote.',
      'Separe os marcadores: feijão, milho, botões ou os marcadores redondos deste kit.',
      'Combine os prêmios. Coisas simples funcionam muito bem: um bombom, uma fruta, um vaso de flor, um aplauso caprichado.',
      'Se quiser, entregue os convites deste kit alguns dias antes. A expectativa já faz parte da festa.',
    ])}</div>
    <div><h3>${fz(paleta.amarelo)} No dia</h3>${lista([
      'Arrume as mesas com boa luz e deixe os óculos por perto. Para grupos grandes, use uma voz clara ou um microfone.',
      'Explique a regra da rodada antes de começar: linha, quatro cantos, cartela cheia… (veja as variações na próxima página).',
      'Quem canta sorteia uma ficha, fala em voz alta e marca na <b>folha de controle</b>. Repita o número ou o nome duas vezes, sem pressa.',
      'Quem completar a regra da rodada grita “Bingo!”. Confira a cartela com a folha de controle e celebre!',
      'Faça de 4 a 6 rodadas, com uma pausa para o lanche no meio. Uma tarde de 1h30 é o ideal.',
    ])}</div>
  </div>
  <div class="dica-box"><b>Para incluir todo mundo:</b> quem enxerga pouco pode jogar em dupla com um ajudante; quem tem tremor nas mãos
  pode usar marcadores grandes ou riscar com caneta grossa. O importante é que todos participem e se divirtam.</div>`,
{ est: cores.geral, titulo: 'Roteiro da tarde' });

L.pagina(`<h1 class="titulo">Variações para cada rodada</h1>
  <p class="lead pequeno">Mudar a regra a cada rodada deixa o jogo sempre novo. Anuncie a variação antes de sortear a primeira ficha.</p>
  <div class="variacoes">${variacoesBingo.map(([t, d], i) => `<div><b>${i + 1}. ${t}</b><p>${d}</p></div>`).join('')}</div>
  <h2 class="sub">As três modalidades deste kit</h2>
  <div class="modalidades">
    <div style="--c:#3A6F6B"><b>Números</b><p>O bingo clássico de 75 bolas. Cartelas 5×5 com o centro livre. Bom para grupos grandes e para quem já conhece o jogo.</p></div>
    <div style="--c:#9C6A1F"><b>Canções</b><p>Quem canta cantarola um trechinho; os jogadores adivinham a música. Puro clima de baile.</p></div>
    <div style="--c:#6B5B95"><b>Lembranças</b><p>Objetos e costumes de antigamente. Cada ficha traz uma pergunta para puxar conversa.</p></div>
  </div>`, { est: cores.geral, titulo: 'Variações' });

// Números
for (let i = 0; i < 6; i++) {
  L.pagina(`<div class="cartelas-g">${cartelasNumeros.slice(i * 2, i * 2 + 2).map((c, k) => desenhaNumeros(c, i * 2 + k + 1)).join('')}</div>${avisoCorte}`,
    { est: cores.numeros, rotulo: 'Bingo de números', titulo: 'Bingo de números' });
}
for (let i = 0; i < 2; i++) {
  const ini = i * 40;
  L.pagina(`<div class="fichas-num">${Array.from({ length: Math.min(40, 75 - ini) }, (_, k) => {
    const n = ini + k + 1;
    return `<div><small>${'BINGO'[Math.floor((n - 1) / 15)]}</small><b>${n}</b></div>`;
  }).join('')}</div>${avisoCorte}`, { est: cores.numeros, rotulo: 'Bingo de números', titulo: 'Fichas de sorteio' });
}
L.pagina(`<h2 class="titulo-jogo">Folha de controle · números</h2>
  <p class="instrucao">Quem canta marca aqui cada número sorteado. Na hora do “Bingo!”, é só conferir. Imprima uma folha por rodada.</p>
  <div class="controle-num">${'BINGO'.split('').map((l, c) => `<div class="cn-col"><b>${l}</b>${Array.from({ length: 15 }, (_, k) => `<span>${c * 15 + k + 1}</span>`).join('')}</div>`).join('')}</div>
  <p class="rodada">Rodada: ______  &nbsp; Variação: ______________________ &nbsp; Vencedor(a): ______________________</p>`,
{ est: cores.numeros, rotulo: 'Bingo de números', titulo: 'Folha de controle' });

// Canções
for (let i = 0; i < 5; i++) {
  L.pagina(`<div class="cartelas-g">${cartelasCancoes.slice(i * 2, i * 2 + 2).map((c, k) => desenhaTexto(c, cancoesGrupo, i * 2 + k + 1, 'Bingo das Canções')).join('')}</div>${avisoCorte}`,
    { est: cores.cancoes, rotulo: 'Bingo das canções', titulo: 'Bingo das canções' });
}
for (let i = 0; i < 2; i++) {
  L.pagina(`<div class="fichas-txt">${cancoesGrupo.slice(i * 18, i * 18 + 18).map(([t, a]) => `<div><b>${t}</b><small>${a}</small></div>`).join('')}</div>${avisoCorte}`,
    { est: cores.cancoes, rotulo: 'Bingo das canções', titulo: 'Fichas de sorteio' });
}
L.pagina(`<h2 class="titulo-jogo">Folha de controle · canções</h2>
  <p class="instrucao">Marque cada canção sorteada. Dica: cantarole só o comecinho e dê um tempo para o grupo adivinhar antes de dizer o nome.</p>
  <ol class="controle-txt compacto">${cancoesGrupo.map(([t, a]) => `<li><span class="box"></span><span><b>${t}</b><small>${a}</small></span></li>`).join('')}</ol>`,
{ est: cores.cancoes, rotulo: 'Bingo das canções', titulo: 'Folha de controle' });

// Lembranças
for (let i = 0; i < 4; i++) {
  L.pagina(`<div class="cartelas-g">${cartelasLembrancas.slice(i * 2, i * 2 + 2).map((c, k) => desenhaTexto(c, lembrancas, i * 2 + k + 1, 'Bingo das Lembranças')).join('')}</div>${avisoCorte}`,
    { est: cores.lembrancas, rotulo: 'Bingo das lembranças', titulo: 'Bingo das lembranças' });
}
for (let i = 0; i < 2; i++) {
  L.pagina(`<div class="fichas-txt">${lembrancas.slice(i * 18, i * 18 + 18).map(([t, q]) => `<div><b>${t}</b><small>${q}</small></div>`).join('')}</div>${avisoCorte}`,
    { est: cores.lembrancas, rotulo: 'Bingo das lembranças', titulo: 'Fichas de sorteio' });
}
L.pagina(`<h2 class="titulo-jogo">Folha de controle · lembranças</h2>
  <p class="instrucao">Ao sortear, leia o nome e a pergunta da ficha. Deixe quem quiser contar uma história antes de seguir para a próxima.</p>
  <ol class="controle-txt">${lembrancas.map(([t]) => `<li><span class="box"></span><b>${t}</b></li>`).join('')}</ol>`,
{ est: cores.lembrancas, rotulo: 'Bingo das lembranças', titulo: 'Folha de controle' });

// Festa
const coresMarcador = ['#A84B60', '#3A6F6B', '#9C6A1F', '#6B5B95', '#B0643A'];
L.pagina(`<h2 class="titulo-jogo">Marcadores</h2>
  <p class="instrucao">Para quem não quiser usar feijão ou botões. Recorte os círculos, de preferência colados em papel-cartão.</p>
  <div class="marcadores">${Array.from({ length: 80 }, (_, i) => `<span style="background:${coresMarcador[i % 5]}">${fz('#FFFFFF', 7)}</span>`).join('')}</div>`,
{ est: cores.festa, rotulo: 'Para a festa', titulo: 'Marcadores' });

const convite = `<div class="convite"><div class="cv-flores">${fz(paleta.rosa, 9)}${fz(paleta.amarelo, 7)}${fz(paleta.lavanda, 9)}</div>
  <p class="cv-k">Você está convidado(a) para a nossa</p><h3>Tarde de Bingo</h3>
  <div class="cv-linhas"><p>Dia: ____________________ &nbsp; Hora: __________</p><p>Local: ____________________________________</p><p>Com carinho, ______________________________</p></div>
  <p class="cv-f">Traga seu sorriso. Os prêmios são surpresa!</p></div>`;
L.pagina(`<div class="convites">${convite}${convite}</div>${avisoCorte}`, { est: cores.festa, rotulo: 'Para a festa', titulo: 'Convites' });

const certificado = `<div class="certificado"><div class="ct-borda">
  <p class="ct-k">Certificado de</p><h3>Campeão do Bingo</h3>
  <p>Conferido a <span class="ct-linha"></span></p>
  <p>pela vitória na rodada de <span class="ct-linha curta"></span> em ____/____/________.</p>
  <div class="ct-flores">${fz(paleta.rosa, 8)}${fz(paleta.amarelo, 10)}${fz(paleta.lavanda, 8)}</div></div></div>`;
L.pagina(`<div class="certificados">${certificado}${certificado}</div>${avisoCorte}`, { est: cores.festa, rotulo: 'Para a festa', titulo: 'Certificados' });

L.pagina(`<h2 class="titulo-jogo">Placar da tarde</h2>
  <p class="instrucao">Anote quem venceu cada rodada. No fim, quem tiver mais vitórias leva o título de campeão do dia!</p>
  <table class="placar"><thead><tr><th>Rodada</th><th>Modalidade</th><th>Variação</th><th>Vencedor(a)</th><th>Prêmio</th></tr></thead>
  <tbody>${Array.from({ length: 12 }, (_, i) => `<tr><td>${i + 1}</td><td></td><td></td><td></td><td></td></tr>`).join('')}</tbody></table>
  <div class="fim"><p>Que a tarde seja cheia de risadas!</p><small>Material do Mente Ativa para uso pessoal, familiar e em atividades de grupo. Proibida a revenda ou distribuição.</small></div>`,
{ est: cores.festa, rotulo: 'Para a festa', titulo: 'Placar' });

const itensSum = [['Roteiro da tarde', 'passo a passo'], ['Variações', '8 jeitos de jogar'], ['Bingo de números', '12 cartelas, fichas e controle'],
  ['Bingo das canções', '10 cartelas, 36 canções'], ['Bingo das lembranças', '8 cartelas, 36 lembranças'], ['Marcadores', '80 para recortar'],
  ['Convites', 'para chamar o grupo'], ['Certificados', 'de campeão'], ['Placar', 'da tarde']];
L.paginas[SUM] = molduraPagina(`<h1 class="titulo">Bem-vindo(a) ao Kit Bingo</h1>${vinheta(cores.geral.cor)}
  <p class="lead">O bingo é um dos jogos mais queridos de todos os tempos: junta gente, puxa conversa e rende boas risadas.
  Este kit traz tudo o que você precisa para organizar uma tarde de bingo para a família ou para um grupo inteiro.</p>
  <div class="sumario">${itensSum.map(([t, d]) => `<div class="sum-item"><div class="sum-linha"><span>${t} <small class="sum-desc">${d}</small></span><i></i><b>${L.sumario[t]}</b></div></div>`).join('')}</div>
  <div class="dica-box"><b>Imprima quantas vezes quiser.</b> As cartelas são todas diferentes entre si. Para grupos maiores, imprima o kit duas vezes e misture.</div>`,
{ est: cores.geral, numero: SUM + 1, marca: 'Mente Ativa · Kit Bingo', frase: 'jogar junto é cuidar' });

const cssBingo = `
.roteiro { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; margin-bottom: 5mm; }
.roteiro h3 { font-size: 14pt; color: var(--cor); margin-bottom: 2mm; }
.roteiro .passos li { font-size: 10.8pt; }
.variacoes { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm 5mm; }
.variacoes div { background: #fff; border: 1px solid #F0E2D8; border-radius: 4mm; padding: 3mm 4mm; }
.variacoes b { font-family: 'Lora'; font-size: 12.5pt; color: var(--cor); }
.variacoes p { font-size: 10.5pt; line-height: 1.4; }
.modalidades { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; }
.modalidades div { border-radius: 5mm; padding: 4mm 5mm; background: #fff; border-top: 5px solid var(--c); box-shadow: 0 0 0 1px #F0E2D8; }
.modalidades b { font-family: 'Lora'; font-size: 14pt; color: var(--c); }
.modalidades p { font-size: 10.5pt; line-height: 1.45; margin-top: 1mm; }
.cartelas-g { flex: 1; display: grid; grid-template-rows: 1fr 1fr; gap: 8mm; min-height: 0; }
.cartela-g { background: #fff; border: 2.5px solid var(--cor); border-radius: 5mm; outline: 1px dashed #8F8680; outline-offset: 2.5mm; display: flex; flex-direction: column; overflow: hidden; min-height: 0; }
.cg-topo { display: flex; align-items: baseline; justify-content: space-between; padding: 1.5mm 5mm; background: var(--tint); }
.cg-topo span { font-family: 'Dancing Script'; font-size: 21pt; color: var(--cor); }
.cg-topo small { font-size: 9pt; text-transform: uppercase; letter-spacing: .1em; color: #7A6F68; }
.cg-letras { display: grid; grid-template-columns: repeat(5, 1fr); background: var(--cor); }
.cg-letras b { color: #fff; text-align: center; font-size: 17pt; font-weight: 900; padding: .8mm 0; }
.cg-grade { flex: 1; display: grid; min-height: 0; }
.cg-grade.c5 { grid-template-columns: repeat(5, 1fr); grid-template-rows: repeat(5, 1fr); }
.cg-grade.c4 { grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(4, 1fr); }
.cg-grade div { border-right: 1px solid #E5D9CC; border-bottom: 1px solid #E5D9CC; display: grid; place-items: center; text-align: center; }
.cg-grade.c5 div:nth-child(5n), .cg-grade.c4 div:nth-child(4n) { border-right: 0; }
.cartela-g.num .cg-grade div { font-size: 20pt; font-weight: 800; }
.cartela-g.num .cg-grade div.livre { display: flex; flex-direction: column; justify-content: center; background: var(--tint); }
.livre small { font-size: 7pt; text-transform: uppercase; letter-spacing: .1em; color: var(--cor); font-weight: 700; }
.cartela-g.txt .cg-grade div { font-family: 'Lora'; font-weight: 600; font-size: 12pt; line-height: 1.2; padding: 1.5mm 2mm; }
.fichas-num { flex: 1; display: grid; grid-template-columns: repeat(5, 1fr); grid-auto-rows: 1fr; }
.fichas-num div { outline: 1px dashed #8F8680; outline-offset: -.5px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #fff; }
.fichas-num small { font-size: 9pt; font-weight: 800; color: var(--cor); letter-spacing: .1em; }
.fichas-num b { font-size: 22pt; font-weight: 900; line-height: 1; }
.fichas-txt { flex: 1; display: grid; grid-template-columns: repeat(3, 1fr); grid-auto-rows: 1fr; }
.fichas-txt div { outline: 1px dashed #8F8680; outline-offset: -.5px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 2mm 3mm; background: #fff; gap: 1mm; }
.fichas-txt b { font-family: 'Lora'; font-size: 12.5pt; line-height: 1.2; color: var(--cor); }
.fichas-txt small { font-size: 8.5pt; color: #6E625C; line-height: 1.3; }
.controle-num { flex: 1; display: grid; grid-template-columns: repeat(5, 1fr); gap: 3mm; min-height: 0; }
.cn-col { display: flex; flex-direction: column; gap: 1.2mm; }
.cn-col b { background: var(--cor); color: #fff; text-align: center; font-size: 18pt; border-radius: 2mm; }
.cn-col span { flex: 1; border: 1px solid #C9BFB2; border-radius: 1.5mm; display: grid; place-items: center; font-size: 13pt; font-weight: 700; background: #fff; }
.rodada { font-size: 11pt; margin-top: 3mm; }
.controle-txt { list-style: none; columns: 2; column-gap: 6mm; }
.controle-txt li { display: flex; align-items: baseline; gap: 2.5mm; padding: 2.4mm 0; border-bottom: 1px dashed #E5D9CC; break-inside: avoid; font-size: 12pt; line-height: 1.25; }
.controle-txt li > span:last-child { display: block; }
.controle-txt.compacto li { padding: .7mm 0; font-size: 11pt; line-height: 1.2; }
.controle-txt .box { flex: none; width: 5mm; height: 5mm; border: 1.4px solid var(--cor); border-radius: 1mm; display: inline-block; transform: translateY(.6mm); }
.controle-txt small { color: #8A7F78; font-size: 9pt; display: block; }
.marcadores { flex: 1; display: grid; grid-template-columns: repeat(8, 1fr); gap: 3mm; justify-items: center; align-content: center; }
.marcadores span { width: 19mm; height: 19mm; border-radius: 50%; display: grid; place-items: center; outline: 1px dashed #8F8680; outline-offset: 1mm; box-shadow: inset 0 0 0 1.2mm rgba(255,255,255,.35); }
.convites, .certificados { flex: 1; display: grid; grid-template-rows: 1fr 1fr; gap: 8mm; min-height: 0; }
.convite { background: #fff; border-radius: 6mm; outline: 1px dashed #8F8680; outline-offset: 2.5mm; border: 2px solid var(--medio); text-align: center; padding: 6mm 10mm;
  display: flex; flex-direction: column; justify-content: center; }
.cv-flores { display: flex; justify-content: center; gap: 2mm; }
.cv-k { font-family: 'Lora'; font-style: italic; color: #6E625C; margin-top: 2mm; }
.convite h3 { font-family: 'Dancing Script'; font-size: 40pt; color: var(--cor); line-height: 1.1; margin-bottom: 4mm; }
.cv-linhas p { font-size: 12pt; margin-bottom: 3mm; }
.cv-f { font-family: 'Lora'; font-style: italic; color: var(--cor); margin-top: 2mm; }
.certificado { background: #fff; border-radius: 4mm; outline: 1px dashed #8F8680; outline-offset: 2.5mm; padding: 4mm; }
.ct-borda { height: 100%; border: 3px double var(--cor); border-radius: 3mm; text-align: center; display: flex; flex-direction: column; justify-content: center; padding: 4mm 10mm; }
.ct-k { font-family: 'Lora'; font-style: italic; color: #6E625C; font-size: 13pt; }
.certificado h3 { font-family: 'Dancing Script'; font-size: 38pt; color: var(--cor); margin-bottom: 4mm; }
.certificado p { font-size: 12pt; margin-bottom: 3mm; }
.ct-linha { display: inline-block; width: 90mm; border-bottom: 1px solid #2B2B2B; }
.ct-linha.curta { width: 40mm; }
.ct-flores { display: flex; justify-content: center; gap: 2mm; margin-top: 2mm; }
.placar { width: 100%; border-collapse: collapse; }
.placar th { background: var(--cor); color: #fff; padding: 2.5mm; font-size: 10.5pt; }
.placar td { border: 1px solid #E2D5C6; height: 13mm; background: #fff; text-align: center; font-weight: 700; color: var(--cor); }
.placar th:first-child { width: 18mm; }
`;

await gerarPDF({ paginas: L.paginas, titulo: 'Mente Ativa · Kit Bingo para Grupos', html: path.join(dist, 'bingo.html'),
  pdf: path.join(dist, 'Order-Bump-Kit-Bingo-para-Grupos.pdf'), cssExtra: cssExtra + cssBingo });
