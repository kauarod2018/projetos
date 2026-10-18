// Desenhos do order bump Atividades Sensoriais e de Mãos:
// passo a passo de dobraduras, papéis estampados, moldes, planificações e modelos de alinhavo.
import { flor } from './flores.mjs';
import { T, florTraco, folhaTraco, anel, petalaPonta } from './desenhos.mjs';

// ---------- dobraduras: elementos dos diagramas (viewBox 0 0 100 100) ----------
const FRENTE = '#F2B8C6'; // lado colorido do papel
const VERSO = '#FFFFFF'; // lado branco
const LINHA = '#5A4636';
const poli = (pts, cor = VERSO) => `<polygon points="${pts.map((p) => p.join(',')).join(' ')}" fill="${cor}" stroke="${LINHA}" stroke-width="1.1" stroke-linejoin="round"/>`;
const dobra = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#2F6F9F" stroke-width="1.3" stroke-dasharray="3.5 2.2"/>`;
const seta = (x1, y1, x2, y2, curva = 18) => {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
  const cx = mx - (dy / len) * curva, cy = my + (dx / len) * curva;
  return `<path d="M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}" fill="none" stroke="#C0392B" stroke-width="1.4" marker-end="url(#ponta)"/>`;
};
const defs = '<defs><marker id="ponta" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="#C0392B"/></marker></defs>';
const svgPasso = (conteudo) => `<svg viewBox="0 0 100 100">${defs}${conteudo}</svg>`;
const losango = [[50, 10], [90, 50], [50, 90], [10, 50]];

export const dobraduras = [
  {
    nome: 'Copo de papel', nivel: 'Fácil', papel: 'Quadrado de 15 a 20 cm',
    intro: 'Um clássico que muita gente aprendeu na escola. Serve para guardar balas, clipes ou sementes.',
    passos: [
      [svgPasso(poli(losango, FRENTE) + dobra(10, 50, 90, 50) + seta(50, 86, 50, 16, 26)),
        'Com o lado colorido para baixo, dobre a ponta de baixo até a ponta de cima, formando um triângulo.'],
      [svgPasso(poli([[10, 72], [90, 72], [50, 32]]) + dobra(38, 44, 46, 72) + seta(13, 70, 76, 58, -14)),
        'Dobre a ponta da esquerda até tocar a borda da direita. A borda de cima dessa dobra deve ficar reta.'],
      [svgPasso(poli([[38, 44], [50, 32], [90, 72], [46, 72]]) + poli([[40, 58], [46, 72], [77, 58]], VERSO) + dobra(62, 44, 54, 72) + seta(87, 70, 24, 58, 14)),
        'Faça o mesmo com a ponta da direita, levando-a até a borda da esquerda.'],
      [svgPasso(poli([[22, 58], [78, 58], [62, 82], [38, 82]]) + poli([[34, 58], [50, 28], [66, 58]], FRENTE) + dobra(30, 58, 70, 58) + seta(50, 31, 50, 70, 16)),
        'Dobre a ponta de cima, só a camada da frente, para baixo e encaixe no bolso da frente.'],
      [svgPasso(poli([[22, 58], [78, 58], [62, 82], [38, 82]]) + poli([[34, 58], [50, 28], [66, 58]], FRENTE) + seta(50, 31, 70, 66, -20)),
        'Vire o copo e dobre a outra ponta para baixo, do outro lado.'],
      [svgPasso(poli([[22, 40], [78, 40], [62, 82], [38, 82]], FRENTE) + '<ellipse cx="50" cy="40" rx="28" ry="6" fill="#FFFFFF" stroke="#5A4636" stroke-width="1.1"/>'),
        'Aperte as laterais com cuidado para abrir a boca do copo. Pronto!'],
    ],
  },
  {
    nome: 'Envelope', nivel: 'Fácil', papel: 'Quadrado de 20 cm',
    intro: 'Perfeito para guardar um bilhete, uma receita ou uma foto e entregar a alguém querido.',
    passos: [
      [svgPasso(poli(losango, VERSO) + dobra(30, 30, 30, 70) + dobra(70, 30, 70, 70) + seta(13, 50, 46, 50, -14) + seta(87, 50, 54, 50, 14)),
        'Coloque o papel como um losango. Dobre as pontas da esquerda e da direita até o centro.'],
      [svgPasso(poli([[50, 10], [70, 30], [70, 70], [50, 90], [30, 70], [30, 30]]) + poli([[30, 30], [50, 50], [30, 70]], FRENTE) + poli([[70, 30], [50, 50], [70, 70]], FRENTE) + dobra(30, 70, 70, 70) + seta(50, 87, 50, 54, 16)),
        'Dobre a ponta de baixo para cima, até um pouco acima do centro.'],
      [svgPasso(poli([[50, 10], [70, 30], [70, 70], [30, 70], [30, 30]]) + poli([[30, 30], [50, 50], [30, 70]], FRENTE) + poli([[70, 30], [50, 50], [70, 70]], FRENTE) + poli([[30, 70], [70, 70], [50, 48]], FRENTE) + dobra(30, 30, 70, 30) + seta(50, 13, 50, 52, -16)),
        'Dobre a ponta de cima para baixo, fechando o envelope.'],
      [svgPasso(poli([[30, 30], [70, 30], [70, 70], [30, 70]], FRENTE) + poli([[30, 30], [70, 30], [50, 56]], VERSO) + flor(50, 56, 6, '#D98C9A')),
        'Prenda a aba com um adesivo ou uma gota de cola. Escreva o nome de quem vai receber.'],
    ],
  },
  {
    nome: 'Marcador de página', nivel: 'Médio', papel: 'Quadrado de 15 cm',
    intro: 'Um marcador que se encaixa no canto da página. Ótimo presente para quem gosta de ler.',
    passos: [
      [svgPasso(poli(losango, FRENTE) + dobra(10, 50, 90, 50) + seta(50, 86, 50, 16, 26)),
        'Com o lado colorido para baixo, dobre ao meio na diagonal, formando um triângulo com a ponta para cima.'],
      [svgPasso(poli([[10, 75], [90, 75], [50, 35]]) + dobra(30, 75, 30, 55) + dobra(70, 75, 70, 55) + seta(13, 72, 47, 39, -16) + seta(87, 72, 53, 39, 16)),
        'Dobre as pontas da esquerda e da direita até a ponta de cima. Marque bem e desdobre.'],
      [svgPasso(poli([[10, 75], [90, 75], [50, 35]]) + dobra(30, 55, 70, 55) + seta(50, 38, 50, 72, 14)),
        'Dobre só a camada de cima da ponta de cima para baixo, até a base.'],
      [svgPasso(poli([[10, 75], [90, 75], [70, 55], [30, 55]]) + poli([[30, 55], [70, 55], [50, 75]], FRENTE) + dobra(30, 75, 30, 55) + dobra(70, 75, 70, 55) + seta(13, 72, 40, 62, -12) + seta(87, 72, 60, 62, 12)),
        'Dobre de novo as pontas laterais para cima e enfie-as dentro do bolso que se formou.'],
      [svgPasso(poli([[30, 55], [50, 35], [70, 55], [50, 75]], FRENTE) + poli([[30, 55], [70, 55], [50, 75]], VERSO) + '<path d="M18 92 L18 30 L82 30" fill="none" stroke="#5A4636" stroke-width="1" stroke-dasharray="2 2"/>'),
        'Pronto! O bolso de trás encaixa no canto da página do livro.'],
    ],
  },
  {
    nome: 'Tulipa com caule', nivel: 'Médio', papel: 'Dois quadrados de 15 cm (um para a flor e outro verde para o caule)',
    intro: 'Uma flor que não murcha. Faça várias, de cores diferentes, e monte um buquê num copinho.',
    passos: [
      [svgPasso(poli(losango, FRENTE) + dobra(10, 50, 90, 50) + seta(50, 14, 50, 84, -26)),
        '<b>Flor:</b> com o lado colorido para baixo, dobre a ponta de cima até a de baixo, formando um triângulo com a ponta para baixo.'],
      [svgPasso(poli([[10, 32], [90, 32], [50, 72]]) + dobra(46, 68, 30, 32) + dobra(54, 68, 70, 32) + seta(14, 34, 34, 10, 10) + seta(86, 34, 66, 10, -10)),
        'Dobre as pontas da esquerda e da direita para cima, inclinadas, passando um pouco da borda de cima.'],
      [svgPasso(poli([[30, 32], [70, 32], [50, 72]], FRENTE) + poli([[30, 32], [48, 66], [36, 10]], FRENTE) + poli([[70, 32], [52, 66], [64, 10]], FRENTE)),
        'Vire a flor. Dobre um pouquinho para trás as pontas de baixo e dos lados para arredondar.'],
      [svgPasso(poli(losango, '#9CC89A') + dobra(50, 10, 50, 90) + dobra(50, 90, 32, 32) + dobra(50, 90, 68, 32) + seta(14, 50, 44, 46, -10) + seta(86, 50, 56, 46, 10)),
        '<b>Caule:</b> com um papel verde em losango, dobre as laterais de baixo até a linha do meio, como uma pipa. Repita mais uma vez para afinar.'],
      [svgPasso(poli([[50, 10], [56, 40], [50, 90], [44, 40]], '#9CC89A') + dobra(40, 50, 60, 50) + seta(50, 87, 50, 16, 20)),
        'Dobre a ponta de baixo até a de cima. Depois dobre ao meio, na vertical, e puxe a parte de dentro para fora para formar a folha.'],
      [svgPasso(poli([[48, 40], [52, 40], [52, 92], [48, 92]], '#9CC89A') + poli([[52, 75], [72, 52], [56, 80]], '#7EB07C') + poli([[34, 40], [66, 40], [50, 66]], FRENTE) + poli([[34, 40], [48, 62], [38, 18]], FRENTE) + poli([[66, 40], [52, 62], [62, 18]], FRENTE)),
        'Encaixe a flor na ponta do caule e prenda com uma gota de cola. Pronto!'],
    ],
  },
  {
    nome: 'Chapéu de jornal', nivel: 'Fácil', papel: 'Folha de jornal ou A4, retangular',
    intro: 'O chapéu das brincadeiras de antigamente. Faça com jornal e conte para os netos como era.',
    passos: [
      [svgPasso(poli([[10, 20], [90, 20], [90, 85], [10, 85]], VERSO) + dobra(10, 52, 90, 52) + seta(50, 23, 50, 82, -24)),
        'Com a folha deitada, dobre ao meio de cima para baixo. A dobra fica em cima.'],
      [svgPasso(poli([[10, 30], [90, 30], [90, 85], [10, 85]]) + dobra(50, 30, 50, 85) + seta(13, 55, 87, 55, -18)),
        'Dobre ao meio da esquerda para a direita, marque bem e desdobre. Isso marca o centro.'],
      [svgPasso(poli([[10, 30], [90, 30], [90, 85], [10, 85]]) + dobra(50, 30, 10, 70) + dobra(50, 30, 90, 70) + seta(12, 32, 46, 50, 10) + seta(88, 32, 54, 50, -10)),
        'Dobre os dois cantos de cima até a linha do centro, formando um triângulo.'],
      [svgPasso(poli([[10, 70], [50, 30], [90, 70], [90, 85], [10, 85]]) + dobra(10, 70, 90, 70) + seta(50, 83, 50, 62, 12)),
        'Dobre a faixa de baixo, só a camada da frente, para cima.'],
      [svgPasso(poli([[10, 70], [50, 30], [90, 70]]) + poli([[6, 62], [94, 62], [94, 74], [6, 74]], FRENTE) + flor(76, 66, 5, '#D98C9A')),
        'Vire e dobre a outra faixa para cima. Abra por baixo e pronto: um chapéu!'],
    ],
  },
];

// ---------- papéis estampados para dobrar (viewBox 100 x 100) ----------
const estampas = [
  ['#F2B8C6', '#FFFFFF', 'flor'], ['#B8D8C2', '#FFFFFF', 'bolinha'], ['#F5D98C', '#FFFFFF', 'flor'], ['#DCD3C5', '#FFFFFF', 'xadrez'],
  ['#F4B88A', '#FFFFFF', 'bolinha'], ['#DCD3C5', '#FFFFFF', 'flor'], ['#E8A0B4', '#FFFFFF', 'xadrez'], ['#D3E3A8', '#FFFFFF', 'flor'],
];
export function papelEstampado(i) {
  const [fundo, motivo, tipo] = estampas[i % estampas.length];
  const id = `pe${i}`;
  const desenho = {
    flor: `${flor(6, 6, 4.5, motivo, { miolo: fundo })}<circle cx="16" cy="16" r="1.4" fill="${motivo}"/>`,
    bolinha: `<circle cx="5" cy="5" r="2.6" fill="${motivo}"/><circle cx="15" cy="15" r="2.6" fill="${motivo}"/>`,
    xadrez: `<rect width="10" height="10" fill="${motivo}" opacity=".45"/><rect x="10" y="10" width="10" height="10" fill="${motivo}" opacity=".45"/>`,
  }[tipo];
  return `<svg viewBox="0 0 100 100"><defs><pattern id="${id}" width="20" height="20" patternUnits="userSpaceOnUse">${desenho}</pattern></defs>
    <rect width="100" height="100" fill="${fundo}"/><rect width="100" height="100" fill="url(#${id})"/></svg>`;
}

// ---------- moldes de flor em camadas (viewBox 100 x 100) ----------
const corte = 'fill="#FFFFFF" stroke="#2B2B2B" stroke-width=".8" stroke-dasharray="2.5 1.6"';
export function moldeFlor(tipo, raio) {
  if (tipo === 'redonda') {
    const n = 8, pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      pts.push(`<circle cx="${50 + Math.cos(a) * raio * 0.62}" cy="${50 + Math.sin(a) * raio * 0.62}" r="${raio * 0.4}"/>`);
    }
    return `<g ${corte}>${pts.join('')}</g><circle cx="50" cy="50" r="${raio * 0.62}" fill="#FFFFFF"/><circle cx="50" cy="50" r="${raio * 0.12}" fill="none" stroke="#B9AE9E" stroke-width=".6"/>`;
  }
  const n = tipo === 'margarida' ? 10 : 5;
  const larg = tipo === 'margarida' ? raio * 0.22 : raio * 0.5;
  return `<g transform="translate(50 50)">${anel(n, `<path d="${petalaPonta(raio, larg)}" ${corte}/>`)}<circle r="${raio * 0.2}" fill="#FFFFFF"/></g>`;
}

// ---------- planificação de caixa (unidades em mm) ----------
// Caixa aberta: base quadrada de lado `l` e laterais de altura `h`, com abas de cola.
export function caixa(l, h, aba = 8) {
  const W = l + 2 * h, H = l + 2 * h, x0 = h, y0 = h;
  // abas de cola nas laterais esquerda e direita (presas às laterais de cima e de baixo)
  const abas = [
    [[x0, 0], [x0 - aba, aba * 0.8], [x0 - aba, h - aba * 0.4], [x0, h]],
    [[x0 + l, 0], [x0 + l + aba, aba * 0.8], [x0 + l + aba, h - aba * 0.4], [x0 + l, h]],
    [[x0, H], [x0 - aba, H - aba * 0.8], [x0 - aba, H - h + aba * 0.4], [x0, H - h]],
    [[x0 + l, H], [x0 + l + aba, H - aba * 0.8], [x0 + l + aba, H - h + aba * 0.4], [x0 + l, H - h]],
  ];
  const vincos = [[x0, y0, x0 + l, y0], [x0, y0 + l, x0 + l, y0 + l], [x0, y0, x0, y0 + l], [x0 + l, y0, x0 + l, y0 + l],
    [x0, 0, x0, y0], [x0 + l, 0, x0 + l, y0], [x0, H, x0, y0 + l], [x0 + l, H, x0 + l, y0 + l]];
  const P = (pts) => pts.map((p) => p.join(',')).join(' ');
  const pad = aba + 2;
  return {
    largura: W + 2 * pad, altura: H + 4,
    svg: (fundo) => `<g transform="translate(${pad} 2)">
      ${abas.map((a) => `<polygon points="${P(a)}" fill="#F4EFE8" stroke="#2B2B2B" stroke-width=".5" stroke-dasharray="2.5 1.6"/>`).join('')}
      <path d="M${x0} 0 H${x0 + l} V${y0} H${W} V${y0 + l} H${x0 + l} V${H} H${x0} V${y0 + l} H0 V${y0} H${x0} Z" fill="${fundo}" stroke="#2B2B2B" stroke-width=".5" stroke-dasharray="2.5 1.6"/>
      ${vincos.map(([a, b, c, d]) => `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="#2B2B2B" stroke-width=".4" stroke-dasharray=".8 1.2"/>`).join('')}
      <text x="${x0 + l / 2}" y="${y0 + l / 2}" text-anchor="middle" class="cx-txt">base</text>
      ${abas.map((a) => `<text x="${(a[0][0] + a[1][0]) / 2}" y="${(a[0][1] + a[3][1]) / 2 + 1}" text-anchor="middle" class="cx-aba">cola</text>`).join('')}
    </g>`,
  };
}

// ---------- bandeirinha (viewBox 0 0 60 80) ----------
export function bandeirinha(fundo, i) {
  return `<svg viewBox="-2 -2 64 84"><defs><pattern id="bd${i}" width="12" height="12" patternUnits="userSpaceOnUse">${flor(6, 6, 3.4, '#FFFFFF', { miolo: fundo })}</pattern></defs>
    <path d="M0 0 H60 V80 L30 60 L0 80 Z" fill="${fundo}" stroke="#2B2B2B" stroke-width=".5" stroke-dasharray="2.5 1.6"/>
    <path d="M0 0 H60 V80 L30 60 L0 80 Z" fill="url(#bd${i})" opacity=".7"/>
    <line x1="0" y1="6" x2="60" y2="6" stroke="#2B2B2B" stroke-width=".4" stroke-dasharray=".8 1.2"/></svg>`;
}
export function bandeirinhaColorir(i) {
  return `<svg viewBox="-2 -2 64 84"><path d="M0 0 H60 V80 L30 60 L0 80 Z" fill="#FFFFFF" stroke="#2B2B2B" stroke-width=".5" stroke-dasharray="2.5 1.6"/>
    <line x1="0" y1="6" x2="60" y2="6" stroke="#2B2B2B" stroke-width=".4" stroke-dasharray=".8 1.2"/>
    <g transform="translate(30 34) scale(.5)">${i % 2 ? florTraco(0, 0, 1.5, i % 3) : `${anel(8, `<path d="${petalaPonta(30, 12)}" ${T}/>`)}<circle r="8" ${T}/>`}</g></svg>`;
}

// ---------- cartões postais (viewBox 0 0 200 130) ----------
export function cartao(tipo) {
  const desenhos = [
    `${florTraco(55, 50, 1.6, 0)}${florTraco(30, 85, 1.1, 1)}${florTraco(80, 92, 1.1, 2)}${folhaTraco(40, 60, 140, 0.9)}${folhaTraco(70, 70, 30, 0.9)}`,
    `<path d="M25 70 h50 v14 a25 14 0 0 1 -50 0z" ${T}/><path d="M75 74 q14 0 10 12 q-4 6 -12 4" fill="none" stroke="#2B2B2B" stroke-width="1.6"/><ellipse cx="50" cy="100" rx="38" ry="6" ${T}/>
     ${[0, 1, 2].map((k) => `<path d="M${40 + k * 10} 62 q-6 -12 0 -22 q6 -10 0 -20" fill="none" stroke="#2B2B2B" stroke-width="1.3"/>`).join('')}${florTraco(50, 84, 0.5, 1)}`,
    `<rect x="25" y="55" width="55" height="50" ${T}/><path d="M18 58 L52 28 L87 58Z" ${T}/><rect x="45" y="78" width="15" height="27" ${T}/>
     <rect x="30" y="64" width="12" height="12" ${T}/><rect x="64" y="64" width="12" height="12" ${T}/>${florTraco(20, 108, 0.6, 0)}${florTraco(88, 108, 0.6, 1)}`,
    `<g transform="translate(52 66)">${anel(10, `<path d="${petalaPonta(42, 16)}" ${T}/>`)}${anel(10, `<path d="${petalaPonta(26, 10)}" ${T}/>`, 18)}<circle r="9" ${T}/></g>`,
  ];
  const linhas = Array.from({ length: 5 }, (_, k) => `<line x1="112" y1="${48 + k * 14}" x2="190" y2="${48 + k * 14}" stroke="#B9AE9E" stroke-width=".6"/>`).join('');
  return `<svg viewBox="0 0 200 130"><rect x=".5" y=".5" width="199" height="129" rx="4" fill="#FFFFFF" stroke="#2B2B2B" stroke-width=".6" stroke-dasharray="3 2"/>
    <line x1="104" y1="12" x2="104" y2="118" stroke="#D8CFBE" stroke-width=".6"/>
    ${desenhos[tipo % desenhos.length]}
    <text x="112" y="28" class="ct-txt">Com carinho,</text>${linhas}
    <rect x="168" y="8" width="22" height="26" fill="none" stroke="#B9AE9E" stroke-width=".6" stroke-dasharray="1.5 1.5"/></svg>`;
}

// ---------- marcadores de página para colorir (viewBox 0 0 50 200) ----------
export function marcadorPagina(tipo) {
  const furo = '<circle cx="25" cy="12" r="3" fill="none" stroke="#2B2B2B" stroke-width=".8"/>';
  const conteudo = [
    () => `<path d="M25 195 C10 160 40 130 25 95 C10 60 40 40 25 25" fill="none" stroke="#2B2B2B" stroke-width="1.4"/>
      ${[[18, 170, 200], [32, 140, -20], [17, 110, 200], [33, 78, -20], [18, 50, 200]].map(([x, y, a]) => folhaTraco(x, y, a, 0.45)).join('')}
      ${[[26, 150, 0], [24, 118, 1], [26, 85, 2], [24, 55, 0], [25, 32, 1]].map(([x, y, t]) => florTraco(x, y, 0.42, t)).join('')}`,
    () => [40, 85, 130, 172].map((y, k) => `<g transform="translate(25 ${y}) scale(.17)">${anel(8 + k * 2, `<path d="${petalaPonta(100, 34)}" ${T}/>`)}<circle r="22" ${T}/></g>`).join(''),
    () => [0, 1, 2, 3, 4, 5, 6].map((k) => `<g transform="translate(5 ${25 + k * 24})"><rect width="40" height="24" ${T}/>
      <path d="M20 2 Q24 12 38 12 Q24 12 20 22 Q16 12 2 12 Q16 12 20 2Z" ${T}/><circle cx="20" cy="12" r="2.6" ${T}/></g>`).join(''),
    () => `<text x="25" y="58" text-anchor="middle" class="mp-txt">Boa</text><text x="25" y="76" text-anchor="middle" class="mp-txt">leitura</text>
      ${florTraco(25, 110, 0.7, 1)}${florTraco(14, 140, 0.45, 0)}${florTraco(36, 150, 0.45, 2)}${folhaTraco(18, 126, 220, 0.4)}${folhaTraco(32, 128, -40, 0.4)}${florTraco(25, 178, 0.55, 0)}`,
    () => `<path d="M25 30 V190" stroke="#2B2B2B" stroke-width="1.2"/>${Array.from({ length: 9 }, (_, k) => `<ellipse cx="${k % 2 ? 31 : 19}" cy="${44 + k * 15}" rx="7" ry="4" transform="rotate(${k % 2 ? -30 : 30} ${k % 2 ? 31 : 19} ${44 + k * 15})" ${T}/>`).join('')}
      ${[0, 1, 2, 3, 4, 5].map((k) => `<circle cx="25" cy="${36 + k * 4}" r="2.4" ${T}/>`).join('')}`,
  ];
  return `<svg viewBox="0 0 50 200"><rect x=".5" y=".5" width="49" height="199" rx="3" fill="#FFFFFF" stroke="#2B2B2B" stroke-width=".6" stroke-dasharray="3 2"/>${furo}${conteudo[tipo % conteudo.length]()}</svg>`;
}

// ---------- pintura com carimbo (viewBox 0 0 300 400) ----------
export function arvoreCarimbo() {
  return `<svg viewBox="0 0 300 400">
    <path d="M135 390 C140 330 138 290 128 250 C118 215 92 190 70 170 M128 250 C150 220 170 205 205 190 M140 300 C165 280 200 270 235 250
      M133 270 C112 250 95 245 60 240 M150 205 C150 170 160 140 150 100 M205 190 C215 160 225 140 245 120 M70 170 C60 140 70 120 60 95" fill="none" stroke="#2B2B2B" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M120 390 C126 330 124 290 116 252 L140 248 C150 290 152 330 150 390Z" ${T}/>
    ${[[70, 160], [60, 100], [150, 105], [245, 120], [205, 185], [235, 245], [60, 235], [150, 160], [100, 130], [195, 140], [120, 200], [180, 230]].map(([x, y]) =>
      `<circle cx="${x}" cy="${y}" r="26" fill="none" stroke="#B9AE9E" stroke-width="1" stroke-dasharray="3 3"/>`).join('')}
    <path d="M60 395 Q150 375 250 395" fill="none" stroke="#2B2B2B" stroke-width="1.6"/>
  </svg>`;
}

export function vasoCarimbo() {
  const pontas = [[150, 70], [95, 110], [205, 105], [120, 160], [180, 158], [65, 175], [235, 170]];
  return `<svg viewBox="0 0 300 400">
    ${pontas.map(([x, y]) => `<path d="M150 290 Q${(150 + x) / 2} ${(290 + y) / 2 + 20} ${x} ${y}" fill="none" stroke="#2B2B2B" stroke-width="1.8"/>`).join('')}
    ${pontas.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="20" fill="none" stroke="#B9AE9E" stroke-width="1" stroke-dasharray="3 3"/>`).join('')}
    ${folhaTraco(120, 240, 200, 0.9)}${folhaTraco(180, 236, -20, 0.9)}
    <path d="M100 290 h100 l-12 95 q-38 12 -76 0z" ${T}/><path d="M96 282 h108 v14 h-108z" ${T}/>
  </svg>`;
}

export function lavandaCarimbo() {
  const hastes = [60, 100, 140, 180, 220];
  return `<svg viewBox="0 0 300 400">
    ${hastes.map((x, k) => `<path d="M150 370 Q${(150 + x) / 2} 250 ${x} ${110 + (k % 2) * 30}" fill="none" stroke="#2B2B2B" stroke-width="1.6"/>`).join('')}
    ${hastes.map((x, k) => Array.from({ length: 6 }, (_, j) => `<circle cx="${x + (j % 2 ? 4 : -4)}" cy="${110 + (k % 2) * 30 - j * 11}" r="6" fill="none" stroke="#B9AE9E" stroke-width=".9" stroke-dasharray="2 2"/>`).join('')).join('')}
    <path d="M120 365 q30 -16 60 0 l-6 14 h-48z" ${T}/><path d="M110 352 q40 10 80 0" fill="none" stroke="#2B2B2B" stroke-width="2"/>
  </svg>`;
}

// ---------- alinhavo: formas com furos (viewBox 0 0 200 200) ----------
function pontosAoLongo(pts, passo) {
  const fechado = [...pts, pts[0]];
  const tot = fechado.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - fechado[i][0], p[1] - fechado[i][1]), 0);
  const n = Math.max(8, Math.round(tot / passo));
  const out = [];
  let alvo = 0, acum = 0;
  for (let i = 1; i < fechado.length && out.length < n; i++) {
    const [ax, ay] = fechado[i - 1], [bx, by] = fechado[i];
    const seg = Math.hypot(bx - ax, by - ay);
    while (alvo <= acum + seg && out.length < n) {
      const t = (alvo - acum) / seg;
      out.push([ax + (bx - ax) * t, ay + (by - ay) * t]);
      alvo += tot / n;
    }
    acum += seg;
  }
  return out;
}
const curva = (f, n = 200) => Array.from({ length: n }, (_, i) => f((i / n) * Math.PI * 2));

export const formasAlinhavo = {
  'Coração': curva((t) => [100 + 72 * Math.pow(Math.sin(t), 3), 95 - (58 * Math.cos(t) - 23 * Math.cos(2 * t) - 9 * Math.cos(3 * t) - 4 * Math.cos(4 * t))]),
  'Casinha': [[40, 170], [40, 90], [100, 35], [160, 90], [160, 170]],
  'Folha': [...Array.from({ length: 60 }, (_, i) => { const t = i / 59; return [100 + 58 * Math.sin(Math.PI * t), 15 + 170 * t]; }),
    ...Array.from({ length: 58 }, (_, i) => { const t = 1 - (i + 1) / 59; return [100 - 58 * Math.sin(Math.PI * t), 15 + 170 * t]; })],
  'Estrela': Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 36 : 82; return [100 + Math.cos(a) * r, 108 + Math.sin(a) * r]; }),
  'Xícara': [[36, 58], [148, 58], [147, 72], [166, 68], [184, 80], [186, 100], [174, 116], [151, 119], [140, 138], [122, 152], [62, 152], [48, 138], [40, 100]],
  'Flor': curva((t) => { const r = 58 + 20 * Math.cos(5 * t); return [100 + r * Math.cos(t), 100 + r * Math.sin(t)]; }),
};

export function alinhavo(nome, passo = 13) {
  const pts = formasAlinhavo[nome];
  const furos = pontosAoLongo(pts, passo);
  const d = `M${pts.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join(' L')}Z`;
  return `<svg viewBox="0 0 200 200"><path d="${d}" fill="#FFFFFF" stroke="#2B2B2B" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="${d}" fill="none" stroke="#2B2B2B" stroke-width=".6" stroke-dasharray="3 2" transform="translate(100 100) scale(1.12) translate(-100 -100)"/>
    ${furos.map(([x, y], i) => {
      // furo um pouco para dentro da borda, na direção do centro
      const cx = 100 + (x - 100) * 0.9, cy = 100 + (y - 100) * 0.9;
      return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="3" fill="#FFFFFF" stroke="#2B2B2B" stroke-width="1.2"/>${i === 0 ? `<text x="${cx.toFixed(1)}" y="${(cy - 6).toFixed(1)}" text-anchor="middle" class="al-txt">início</text>` : ''}`;
    }).join('')}</svg>`;
}
