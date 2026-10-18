// Order bump: Atividades Sensoriais e de Mãos.
// Uso: npm run build:sensorial
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { paleta, vinheta, enfeite } from './flores.mjs';
import { molduraPagina, gerarPDF } from './layout.mjs';
import { livro, lista, capa, cssExtra } from './livro.mjs';
import { vasoDeFlores, borboletas } from './desenhos.mjs';
import {
  dobraduras, papelEstampado, moldeFlor, caixa, bandeirinha, bandeirinhaColorir, cartao, marcadorPagina,
  arvoreCarimbo, vasoCarimbo, lavandaCarimbo, alinhavo,
} from './artesanato.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(raiz, 'dist');

const cores = {
  geral: { cor: '#4F8A6B', tint: '#F2EDE4', medio: '#DCD3C5', flores: [paleta.amarelo, paleta.rosa, paleta.lavanda] },
  dobra: { cor: '#D9654B', tint: '#F2EDE4', medio: '#DCD3C5', flores: [paleta.rosa, paleta.pessego, paleta.amarelo] },
  molde: { cor: '#D88A2D', tint: '#F2EDE4', medio: '#DCD3C5', flores: [paleta.pessego, paleta.amarelo, paleta.rosa] },
  papel: { cor: '#3D5A80', tint: '#F2EDE4', medio: '#DCD3C5', flores: [paleta.lavanda, paleta.rosa, paleta.amarelo] },
  pintura: { cor: '#2E7D86', tint: '#F2EDE4', medio: '#DCD3C5', flores: [paleta.lavanda, paleta.pessego, paleta.rosa] },
  costura: { cor: '#B9862A', tint: '#F2EDE4', medio: '#DCD3C5', flores: [paleta.rosa, paleta.amarelo, paleta.lavanda] },
};

const L = livro('Mente Ativa · Mãos à Obra', 'fazer com as mãos é cuidar');
const ficha = ({ material, tempo, nivel }) => `<dl class="ficha-jogo">
  ${nivel ? `<div><dt>Nível</dt><dd>${nivel}</dd></div>` : ''}${tempo ? `<div><dt>Tempo</dt><dd>${tempo}</dd></div>` : ''}
  <div style="grid-column:1/-1"><dt>Material</dt><dd>${material}</dd></div></dl>`;
const avisoCorte = '<p class="aviso-corte">✂ Recorte nas linhas tracejadas. Dobre nas linhas pontilhadas.</p>';

// ---------- capa e abertura ----------
L.pagina(capa({
  est: cores.geral, kicker: 'kit especial', titulo: 'Mãos<br>à Obra', sub: 'Atividades sensoriais e de artesanato',
  chamada: 'Dobraduras, flores de papel, caixinha de presente, bandeirinhas, cartões, mosaico, pintura com carimbo e alinhavo.',
  selos: ['5 dobraduras', 'moldes para recortar', 'mosaico e carimbo', 'alinhavo', 'passo a passo ilustrado'], selo: 'Mente Ativa · mãos à obra',
}), { est: cores.geral, classe: 'capa', rodape: false });

const SUM = L.paginas.length;
L.pagina('', { est: cores.geral });

L.pagina(`<h1 class="titulo">Antes de começar</h1>
  <p class="lead pequeno">Atividades com as mãos acalmam, trazem a sensação boa de “eu que fiz” e exercitam a coordenação fina.
  Estas dicas deixam o momento mais seguro e gostoso.</p>
  <div class="cuidados">
    <div><h3>${'✂'} Segurança</h3><p>Prefira tesoura de ponta redonda e cola branca ou em bastão. Deixe o estilete e a cola quente com quem acompanha.</p></div>
    <div><h3>💡 Ambiente</h3><p>Mesa firme, boa luz e uma toalha velha ou jornal por baixo. Óculos por perto e cadeira com encosto.</p></div>
    <div><h3>🤝 Parceria</h3><p>Divida as tarefas: um recorta, o outro cola. O objetivo é fazer junto, não fazer perfeito.</p></div>
    <div><h3>🖐 Mãos com tremor</h3><p>Use papel mais grosso, cola em bastão e peças maiores. Apoiar o cotovelo na mesa ajuda a dar firmeza.</p></div>
    <div><h3>⏰ No tempo certo</h3><p>Sessões de 20 a 40 minutos. Se cansar, guarde num envelope e termine outro dia.</p></div>
    <div><h3>🌷 Mostre o resultado</h3><p>Exponha os trabalhos num mural, dê de presente ou use na casa. Isso valoriza o esforço.</p></div>
  </div>
  <h2 class="sub">Material básico</h2>
  <p class="materiais">Tesoura sem ponta · cola branca e em bastão · lápis de cor ou giz de cera · papel sulfite colorido · papel-cartão · régua ·
  lã ou barbante grosso · agulha de tapeçaria sem ponta · tinta guache · rolhas, tampinhas e uma batata para carimbar · revistas velhas.</p>`,
{ est: cores.geral, titulo: 'Antes de começar' });

// ---------- dobraduras ----------
dobraduras.forEach((d, i) => {
  L.pagina(`<h2 class="titulo-jogo">Dobradura · ${d.nome}</h2>
    <p class="instrucao">${d.intro}</p>
    ${ficha({ nivel: d.nivel, tempo: '10 a 15 minutos', material: `${d.papel}. Use os papéis estampados deste kit ou papel sulfite colorido.` })}
    <div class="passos-dobra">${d.passos.map(([svg, txt], k) => `<figure><div class="pd-n">${k + 1}</div>${svg}<figcaption>${txt}</figcaption></figure>`).join('')}</div>
    ${i === 0 ? '<p class="legenda-dobra"><span class="lg-dobra"></span> linha de dobra &nbsp; <span class="lg-seta">➜</span> movimento do papel &nbsp; <span class="lg-cor"></span> lado colorido</p>' : ''}`,
  { est: cores.dobra, rotulo: 'Dobraduras', titulo: 'Dobraduras' });
});
for (let i = 0; i < 2; i++) {
  L.pagina(`<h2 class="titulo-jogo">Papéis estampados para dobrar</h2>
    <p class="instrucao">Imprima em papel fino (75 g), recorte os quadrados e use nas dobraduras. O verso branco faz o contraste.</p>
    <div class="papeis">${[0, 1, 2, 3].map((k) => `<div>${papelEstampado(i * 4 + k)}</div>`).join('')}</div>${avisoCorte}`,
  { est: cores.dobra, rotulo: 'Dobraduras', titulo: 'Papéis estampados' });
}

// ---------- flores de papel ----------
L.pagina(`<h2 class="titulo-jogo">Flores de papel em camadas</h2>
  <p class="instrucao">Flores que duram para sempre. Ficam lindas num vaso, coladas num cartão ou presas num varal de barbante.</p>
  ${ficha({ nivel: 'Fácil', tempo: '20 minutos por flor', material: 'Moldes da próxima página, papel colorido ou papel-cartão, tesoura, cola, lápis, um botão ou miçanga para o miolo e palitos de churrasco ou arame para o caule.' })}
  ${lista([
    'Recorte os moldes da página seguinte e use-os como gabarito: contorne com lápis sobre papéis de cores diferentes.',
    'Para cada flor, recorte três camadas do mesmo modelo: uma grande, uma média e uma pequena.',
    'Cole as camadas uma sobre a outra, girando um pouquinho cada uma para as pétalas não ficarem alinhadas.',
    'Dobre levemente as pétalas para cima, passando o lápis por baixo delas: a flor ganha volume.',
    'Cole um botão ou miçanga no centro. Para o caule, prenda um palito ou arame por trás com fita adesiva.',
    'Recorte folhas verdes e cole no caule. Junte várias flores num copinho ou vaso e pronto: um buquê!',
  ])}
  <div class="flores-ex">${['margarida', 'redonda', 'estrela'].map((t, i) => `<svg viewBox="0 0 100 100">
    <g opacity="1">${moldeFlor(t, 46).replace(/fill="#FFFFFF"/g, `fill="${['#F2B8C6', '#DCD3C5', '#F5D98C'][i]}"`).replace(/stroke-dasharray="[^"]*"/g, '')}</g>
    <g transform="translate(50 50) scale(.7) translate(-50 -50)">${moldeFlor(t, 46).replace(/fill="#FFFFFF"/g, `fill="${['#E8A0B4', '#A99BC9', '#F4B88A'][i]}"`).replace(/stroke-dasharray="[^"]*"/g, '')}</g>
    <circle cx="50" cy="50" r="7" fill="#C98A3C"/></svg>`).join('')}</div>`,
{ est: cores.molde, rotulo: 'Moldes', titulo: 'Flores de papel' });
L.pagina(`<h2 class="titulo-jogo">Moldes das flores</h2>
  <div class="moldes-flor">${['margarida', 'redonda', 'estrela'].map((t) => `<div class="mf-linha"><b>${{ margarida: 'Margarida', redonda: 'Flor redonda', estrela: 'Flor de cinco pétalas' }[t]}</b>
    ${[46, 34, 24].map((r) => `<svg viewBox="0 0 100 100" style="width:${r * 1.25}mm">${moldeFlor(t, r)}</svg>`).join('')}</div>`).join('')}
    <div class="mf-linha"><b>Folhas</b>${[0, 1, 2].map((k) => `<svg viewBox="0 0 100 50" style="width:${40 - k * 8}mm"><path d="M5 25 Q50 -10 95 25 Q50 60 5 25Z" fill="#FFFFFF" stroke="#2B2B2B" stroke-width=".8" stroke-dasharray="2.5 1.6"/><path d="M8 25 H90" stroke="#B9AE9E" stroke-width=".6"/></svg>`).join('')}</div>
  </div>${avisoCorte}`, { est: cores.molde, rotulo: 'Moldes', titulo: 'Moldes das flores' });

// ---------- caixinha ----------
const cxBase = caixa(56, 26), cxTampa = caixa(59, 16);
const fundoCaixa = '#F2EDE4';
L.pagina(`<h2 class="titulo-jogo">Caixinha de presente · base</h2>
  <p class="instrucao">Imprima em papel-cartão. Recorte no tracejado, vinque com a régua nas linhas pontilhadas, dobre as laterais para cima e cole as abas por dentro.
  Decore com lápis de cor, as flores de papel ou as bandeirinhas antes de montar.</p>
  <div class="caixa-area"><svg viewBox="0 0 ${cxBase.largura} ${cxBase.altura}" style="width:${cxBase.largura}mm">${cxBase.svg(fundoCaixa)}</svg></div>${avisoCorte}`,
{ est: cores.molde, rotulo: 'Moldes', titulo: 'Caixinha de presente' });
L.pagina(`<h2 class="titulo-jogo">Caixinha de presente · tampa</h2>
  <p class="instrucao">A tampa é um pouco maior que a base, para encaixar por cima. Monte do mesmo jeito. Dentro cabem bombons, sementes, bilhetes ou uma flor de papel.</p>
  <div class="caixa-area"><svg viewBox="0 0 ${cxTampa.largura} ${cxTampa.altura}" style="width:${cxTampa.largura}mm">${cxTampa.svg('#F2EDE4')}
    <g transform="translate(${cxTampa.largura / 2} ${cxTampa.altura / 2})">${enfeite(0, 0, 12, '#E07A5F', { tipo: 'coracao' })}</g></svg></div>${avisoCorte}`,
{ est: cores.molde, rotulo: 'Moldes', titulo: 'Caixinha de presente' });

// ---------- bandeirinhas ----------
const coresBand = ['#E8A0B4', '#F5D98C', '#9CC89A', '#DCD3C5', '#DCD3C5', '#F4B88A', '#E8A0B4', '#F5D98C', '#9CC89A'];
L.pagina(`<h2 class="titulo-jogo">Bandeirinhas de festa</h2>
  <p class="instrucao">Para enfeitar a festa junina, o aniversário ou a janela da sala. Recorte, dobre a faixa de cima sobre um barbante e cole.
  Imprima esta página quantas vezes quiser para fazer um varal comprido.</p>
  <div class="bandeiras">${coresBand.map((c, i) => bandeirinha(c, i)).join('')}</div>${avisoCorte}`,
{ est: cores.molde, rotulo: 'Moldes', titulo: 'Bandeirinhas' });
L.pagina(`<h2 class="titulo-jogo">Bandeirinhas para colorir</h2>
  <p class="instrucao">Pinte do jeito que quiser antes de recortar. Fica lindo alternar com as bandeirinhas estampadas.</p>
  <div class="bandeiras">${Array.from({ length: 9 }, (_, i) => bandeirinhaColorir(i)).join('')}</div>${avisoCorte}`,
{ est: cores.molde, rotulo: 'Moldes', titulo: 'Bandeirinhas' });

// ---------- cartões e marcadores ----------
for (let i = 0; i < 2; i++) {
  L.pagina(`<h2 class="titulo-jogo">Cartões para colorir e enviar</h2>
    <p class="instrucao">Pinte o desenho, escreva uma mensagem do lado direito e entregue a alguém querido. Também dá para colar num envelope do kit de dobraduras.</p>
    <div class="cartoes">${cartao(i * 2)}${cartao(i * 2 + 1)}</div>${avisoCorte}`,
  { est: cores.papel, rotulo: 'Papelaria', titulo: 'Cartões' });
}
L.pagina(`<h2 class="titulo-jogo">Marcadores de página para colorir</h2>
  <p class="instrucao">Pinte, recorte e, se quiser, faça um furinho em cima e amarre uma fitinha. Plastificados, duram anos.</p>
  <div class="marcadores-pag">${[0, 1, 2, 3, 4].map(marcadorPagina).join('')}</div>${avisoCorte}`,
{ est: cores.papel, rotulo: 'Papelaria', titulo: 'Marcadores de página' });

// ---------- mosaico ----------
L.pagina(`<h2 class="titulo-jogo">Mosaico de papel picado</h2>
  <p class="instrucao">Uma atividade calma e muito sensorial: rasgar o papel, sentir a textura e montar o desenho pedacinho por pedacinho.</p>
  ${ficha({ nivel: 'Fácil', tempo: '30 a 60 minutos', material: 'Revistas velhas ou papel colorido, cola branca, um pincel ou cotonete e os desenhos das próximas páginas.' })}
  ${lista([
    'Separe as revistas por cor: tudo o que é verde num pote, vermelho em outro, e assim por diante.',
    'Rasgue o papel com as mãos em pedacinhos de 1 a 2 cm. Rasgar é parte da atividade e exercita os dedos.',
    'Escolha uma área do desenho e passe cola com o pincel ou cotonete.',
    'Cole os pedacinhos um ao lado do outro, deixando um espacinho branco entre eles, como num mosaico.',
    'Vá trocando de área e de cor. Não precisa terminar no mesmo dia.',
  ])}
  <div class="dica-box"><b>Para variar:</b> em vez de papel, use grãos (feijão, lentilha, arroz colorido), botões ou sementes.
  A sensação nas mãos é diferente e o resultado fica com textura.</div>`,
{ est: cores.papel, rotulo: 'Mosaico', titulo: 'Mosaico' });
L.pagina(`<div class="desenho-grande">${vasoDeFlores(77)}</div><p class="legenda-colorir">Mosaico · Vaso de flores</p>`, { est: cores.papel, rotulo: 'Mosaico', titulo: 'Vaso de flores' });
L.pagina(`<div class="desenho-grande">${borboletas()}</div><p class="legenda-colorir">Mosaico · Borboletas</p>`, { est: cores.papel, rotulo: 'Mosaico', titulo: 'Borboletas' });

// ---------- pintura com carimbo ----------
L.pagina(`<h2 class="titulo-jogo">Pintura com carimbo</h2>
  <p class="instrucao">Carimbar é fácil, rápido e não exige traço firme. O resultado é sempre bonito, e cada um fica único.</p>
  ${ficha({ nivel: 'Fácil', tempo: '20 a 40 minutos', material: 'Tinta guache, um prato raso, guardanapo, a ponta do dedo, rolhas, tampinhas de garrafa ou meia batata cortada em formato de flor ou coração.' })}
  <div class="carimbos">
    <div><b>Dedo</b><p>Molhe a ponta do dedo na tinta e carimbe. Perfeito para as folhas da árvore.</p></div>
    <div><b>Rolha</b><p>Faz círculos perfeitos: flores, frutas e bolinhas.</p></div>
    <div><b>Batata</b><p>Quem acompanha corta meia batata e entalha uma forma simples, como um coração.</p></div>
    <div><b>Tampinha</b><p>Carimba anéis. Gire e sobreponha cores para fazer flores.</p></div>
  </div>
  ${lista([
    'Coloque um pouco de tinta no prato e espalhe em camada fina.',
    'Encoste o carimbo na tinta, retire o excesso no guardanapo e pressione no papel.',
    'Os círculos tracejados dos desenhos mostram onde carimbar, mas fique à vontade para sair deles.',
    'Espere secar antes de carimbar outra cor por cima.',
  ])}`,
{ est: cores.pintura, rotulo: 'Pintura com carimbo', titulo: 'Pintura com carimbo' });
L.pagina(`<div class="desenho-grande">${arvoreCarimbo()}</div><p class="legenda-colorir">Árvore: carimbe as folhas com a ponta do dedo</p>`, { est: cores.pintura, rotulo: 'Pintura com carimbo', titulo: 'Árvore' });
L.pagina(`<div class="desenho-grande">${vasoCarimbo()}</div><p class="legenda-colorir">Vaso: carimbe as flores com a rolha ou a tampinha</p>`, { est: cores.pintura, rotulo: 'Pintura com carimbo', titulo: 'Vaso de flores' });
L.pagina(`<div class="desenho-grande">${lavandaCarimbo()}</div><p class="legenda-colorir">Lavanda: carimbe as florzinhas com a ponta do dedo ou de um lápis com borracha</p>`, { est: cores.pintura, rotulo: 'Pintura com carimbo', titulo: 'Lavanda' });

// ---------- alinhavo ----------
L.pagina(`<h2 class="titulo-jogo">Alinhavo</h2>
  <p class="instrucao">Costurar com lã sobre papelão é uma atividade calma, que trabalha a coordenação das mãos e a concentração. Lembra os bordados de antigamente.</p>
  ${ficha({ nivel: 'Fácil a médio', tempo: '20 a 30 minutos', material: 'Os moldes das próximas páginas, papelão (de caixa de cereal, por exemplo), cola, um furador de papel ou a ponta de um lápis, lã grossa e agulha de tapeçaria sem ponta (ou fita adesiva enrolada na ponta da lã).' })}
  ${lista([
    'Cole a página do molde sobre o papelão e espere secar.',
    'Recorte a forma pela linha tracejada de fora.',
    'Quem acompanha faz os furos nos círculos com o furador ou com a ponta de um lápis, sobre uma borracha.',
    'Dê um nó na ponta da lã e comece pelo furo marcado “início”. Passe a lã por cima e por baixo, de furo em furo.',
    'Quando chegar ao fim, dê um nó por trás. Para variar, tente o ponto “chuleado”, passando sempre pela borda.',
  ])}
  <div class="dica-box"><b>Para facilitar:</b> enrole fita adesiva na ponta da lã para ela ficar durinha, como o cadarço de um sapato.
  Use lãs de cores diferentes em cada forma.</div>`,
{ est: cores.costura, rotulo: 'Alinhavo', titulo: 'Alinhavo' });
for (const par of [['Coração', 'Casinha'], ['Folha', 'Estrela'], ['Xícara', 'Flor']]) {
  L.pagina(`<div class="alinhavos">${par.map((n) => `<figure>${alinhavo(n)}<figcaption>${n}</figcaption></figure>`).join('')}</div>${avisoCorte}`,
    { est: cores.costura, rotulo: 'Alinhavo', titulo: 'Moldes de alinhavo' });
}

// ---------- galeria ----------
L.pagina(`<h1 class="titulo">Galeria dos meus trabalhos</h1>
  <p class="lead pequeno">Anote o que foi feito e para quem foi dado. Com o tempo, vira uma lembrança bonita de tardes bem vividas.</p>
  <table class="placar"><thead><tr><th>Data</th><th>O que fiz</th><th>Com quem</th><th>Para quem dei</th></tr></thead>
  <tbody>${'<tr><td></td><td></td><td></td><td></td></tr>'.repeat(12)}</tbody></table>
  <div class="fim"><p>Feito à mão, feito com amor.</p><small>Material do Mente Ativa para uso pessoal e familiar. Proibida a revenda ou distribuição.</small></div>`,
{ est: cores.geral, titulo: 'Galeria' });

const itensSum = [['Antes de começar', 'segurança e material'], ['Dobraduras', '5 modelos com passo a passo'], ['Papéis estampados', '8 quadrados para dobrar'],
  ['Flores de papel', 'flores em camadas'], ['Caixinha de presente', 'base e tampa'], ['Bandeirinhas', 'estampadas e para colorir'],
  ['Cartões', '4 cartões postais'], ['Marcadores de página', '5 para colorir'], ['Mosaico', 'papel picado'], ['Pintura com carimbo', '3 desenhos'],
  ['Alinhavo', '6 moldes'], ['Galeria', 'registro dos trabalhos']];
L.paginas[SUM] = molduraPagina(`<h1 class="titulo">Mãos à obra!</h1>${vinheta(cores.geral.cor)}
  <p class="lead">Este kit reúne atividades para fazer com as mãos: dobrar, recortar, colar, carimbar e costurar.
  Cada uma tem passo a passo ilustrado e moldes prontos para imprimir.</p>
  <div class="sumario">${itensSum.map(([t, d]) => `<div class="sum-item"><div class="sum-linha"><span>${t} <small class="sum-desc">${d}</small></span><i></i><b>${L.sumario[t]}</b></div></div>`).join('')}</div>`,
{ est: cores.geral, numero: SUM + 1, marca: 'Mente Ativa · Mãos à Obra', frase: 'fazer com as mãos é cuidar' });

const cssSensorial = `
.cuidados { display: grid; grid-template-columns: 1fr 1fr; gap: 3.5mm 5mm; }
.cuidados div { background: #fff; border: 1px solid #E7DFD3; border-radius: 4mm; padding: 3mm 4mm; }
.cuidados h3 { font-size: 12.5pt; color: var(--cor); margin-bottom: 1mm; }
.cuidados p { font-size: 10.5pt; line-height: 1.45; }
.materiais { font-size: 11pt; line-height: 1.6; background: #fff; border-radius: 4mm; padding: 3mm 5mm; border: 1px dashed var(--medio); }
.passos-dobra { flex: 1; display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; align-content: start; }
.passos-dobra figure { background: #fff; border: 1px solid #E7DFD3; border-radius: 4mm; padding: 3mm; position: relative; }
.passos-dobra svg { width: 100%; height: 40mm; }
.passos-dobra figcaption { font-size: 10pt; line-height: 1.4; margin-top: 1.5mm; }
.pd-n { position: absolute; top: 2mm; left: 2mm; width: 7mm; height: 7mm; border-radius: 50%; background: var(--cor); color: #fff; font-weight: 800; display: grid; place-items: center; font-size: 10pt; }
.legenda-dobra { font-size: 9.5pt; color: #6E625C; margin-top: 3mm; }
.lg-dobra { display: inline-block; width: 12mm; border-top: 1.5px dashed #2F6F9F; vertical-align: middle; }
.lg-seta { color: #C0392B; font-weight: 800; }
.lg-cor { display: inline-block; width: 5mm; height: 3.5mm; background: #F2B8C6; border: 1px solid #5A4636; vertical-align: middle; }
.papeis { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; justify-items: center; align-content: center; }
.papeis div { width: 85mm; height: 85mm; outline: 1px dashed #8F8680; outline-offset: 1mm; }
.papeis svg { width: 100%; height: 100%; display: block; }
.flores-ex { display: flex; justify-content: center; gap: 8mm; margin-top: auto; }
.flores-ex svg { width: 42mm; height: 42mm; }
.moldes-flor { flex: 1; display: flex; flex-direction: column; justify-content: space-around; }
.mf-linha { display: flex; align-items: center; gap: 6mm; }
.mf-linha b { width: 32mm; font-family: 'Fredoka'; font-size: 12pt; color: var(--cor); }
.caixa-area { flex: 1; display: flex; align-items: center; justify-content: center; min-height: 0; }
.caixa-area svg { max-width: 100%; max-height: 100%; }
.cx-txt { font-family: 'Fredoka'; font-size: 5px; fill: #B9AE9E; }
.cx-aba { font-size: 2.6px; fill: #8A7F78; }
.bandeiras { flex: 1; display: grid; grid-template-columns: repeat(3, 1fr); gap: 5mm; justify-items: center; align-content: center; }
.bandeiras svg { width: 44mm; height: 58mm; }
.cartoes { flex: 1; display: flex; flex-direction: column; justify-content: space-around; align-items: center; }
.cartoes svg { width: 158mm; }
.ct-txt { font-family: 'Fredoka'; font-size: 11px; fill: #8A7F78; }
.marcadores-pag { flex: 1; display: flex; justify-content: space-between; align-items: center; min-height: 0; }
.marcadores-pag svg { width: 32mm; height: 128mm; }
.mp-txt { font-family: 'Fredoka'; font-size: 13px; fill: #FFFFFF; stroke: #2B2B2B; stroke-width: .6; }
.desenho-grande { flex: 1; display: flex; justify-content: center; align-items: center; min-height: 0; background: #fff; }
.desenho-grande svg { width: 100%; height: 100%; }
.legenda-colorir { text-align: center; font-family: 'Fredoka'; font-weight: 500; font-size: 12.5pt; color: var(--cor); margin-top: 2mm; }
.carimbos { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3mm; margin-bottom: 4mm; }
.carimbos div { background: #fff; border-radius: 4mm; padding: 3mm; border-top: 4px solid var(--cor); box-shadow: 0 0 0 1px #E7DFD3; }
.carimbos b { font-family: 'Fredoka'; font-size: 12pt; color: var(--cor); }
.carimbos p { font-size: 9.8pt; line-height: 1.4; }
.alinhavos { flex: 1; display: flex; flex-direction: column; justify-content: space-around; align-items: center; }
.alinhavos figure { text-align: center; }
.alinhavos svg { width: 108mm; height: 108mm; }
.alinhavos figcaption { font-family: 'Fredoka'; font-weight: 500; font-size: 12pt; color: var(--cor); margin-top: -3mm; }
.al-txt { font-size: 6px; font-weight: 700; fill: #C0392B; }
.placar { width: 100%; border-collapse: collapse; }
.placar th { background: var(--cor); color: #fff; padding: 2.5mm; font-size: 10.5pt; }
.placar td { border: 1px solid #E2D5C6; height: 14mm; background: #fff; }
`;

await gerarPDF({ paginas: L.paginas, titulo: 'Mente Ativa · Mãos à Obra', html: path.join(dist, 'sensorial.html'),
  pdf: path.join(dist, 'Order-Bump-Maos-a-Obra-Atividades-Sensoriais.pdf'), cssExtra: cssExtra + cssSensorial });
