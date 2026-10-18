// Desenhos dos bônus: cenas de "encontre as diferenças" e artes de traço para colorir.
import { aleatorio } from './geradores.mjs';

// ---------- Encontre as diferenças ----------
// Cada cena recebe `d` (conjunto de diferenças ligadas) e devolve o SVG (viewBox 300 x 210).
// `marcas` traz o centro e o raio de cada diferença, para o gabarito.

const petala = (cx, cy, r, cor) => [0, 72, 144, 216, 288].map((a) =>
  `<ellipse cx="${cx}" cy="${cy - r * 0.6}" rx="${r * 0.45}" ry="${r * 0.65}" transform="rotate(${a} ${cx} ${cy})" fill="${cor}" stroke="#5A4636" stroke-width=".8"/>`).join('')
  + `<circle cx="${cx}" cy="${cy}" r="${r * 0.3}" fill="#F2C14E" stroke="#5A4636" stroke-width=".8"/>`;

export const diferencas = [
  {
    nome: 'Cantinho do café',
    desenhar: (d) => `
      <rect width="300" height="210" fill="#F6E7D3"/>
      <rect y="150" width="300" height="60" fill="#C99E73"/>
      <!-- janela -->
      <rect x="20" y="20" width="80" height="70" fill="#BFE3F2" stroke="#7A5A43" stroke-width="4"/>
      <line x1="60" y1="20" x2="60" y2="90" stroke="#7A5A43" stroke-width="3"/><line x1="20" y1="55" x2="100" y2="55" stroke="#7A5A43" stroke-width="3"/>
      <path d="M14 16 Q30 55 22 96 L14 96Z" fill="#D9867A"/>
      ${d.cortina ? '' : '<path d="M106 16 Q90 55 98 96 L106 96Z" fill="#D9867A"/>'}
      <!-- relógio -->
      <circle cx="160" cy="45" r="22" fill="#FFFFFF" stroke="#7A5A43" stroke-width="3"/>
      <line x1="160" y1="45" x2="160" y2="30" stroke="#333" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="160" y1="45" x2="${d.relogio ? 147 : 173}" y2="${d.relogio ? 52 : 45}" stroke="#333" stroke-width="2.5" stroke-linecap="round"/>
      <!-- quadro -->
      <rect x="215" y="22" width="60" height="48" fill="#FFF8EC" stroke="#B5813F" stroke-width="4"/>
      ${d.quadro ? '<circle cx="245" cy="46" r="12" fill="#F5D76E"/><circle cx="251" cy="41" r="10" fill="#FFF8EC"/>' : '<circle cx="245" cy="46" r="12" fill="#F2A541"/>'}
      <!-- mesa -->
      <rect x="40" y="140" width="220" height="12" rx="3" fill="#8C5A3C"/>
      <rect x="55" y="152" width="8" height="50" fill="#8C5A3C"/><rect x="237" y="152" width="8" height="50" fill="#8C5A3C"/>
      <!-- bule -->
      <path d="M70 140 Q62 112 84 104 L104 104 Q126 112 118 140Z" fill="${d.bule ? '#5E8C61' : '#3D6FB6'}" stroke="#2F3B4C" stroke-width="1.5"/>
      <path d="M118 120 Q134 112 130 100" fill="none" stroke="#2F3B4C" stroke-width="3"/>
      <rect x="88" y="96" width="12" height="8" rx="2" fill="#2F3B4C"/>
      <!-- xícaras -->
      <path d="M140 128 h22 v8 a11 6 0 0 1 -22 0z" fill="#FFFFFF" stroke="#2F3B4C" stroke-width="1.5"/>
      ${d.xicara ? '' : '<path d="M172 128 h22 v8 a11 6 0 0 1 -22 0z" fill="#FFFFFF" stroke="#2F3B4C" stroke-width="1.5"/>'}
      <!-- bolo -->
      <rect x="205" y="116" width="44" height="24" rx="3" fill="#E9B97A" stroke="#7A5A43" stroke-width="1.5"/>
      <path d="M205 120 q5.5 6 11 0 t11 0 t11 0 t11 0" fill="#FFFFFF" stroke="#7A5A43" stroke-width="1"/>
      ${d.cereja ? '' : '<circle cx="227" cy="112" r="4.5" fill="#C0392B"/>'}
      <!-- vaso -->
      <path d="M150 104 h18 l-3 22 h-12z" fill="#D2557A"/>
      <line x1="159" y1="104" x2="152" y2="80" stroke="#4E7D5B" stroke-width="2"/><line x1="159" y1="104" x2="166" y2="78" stroke="#4E7D5B" stroke-width="2"/>
      ${d.flor ? '' : '<line x1="159" y1="104" x2="159" y2="74" stroke="#4E7D5B" stroke-width="2"/>'}
      ${petala(152, 80, 7, '#F0B48A')}${petala(166, 78, 7, '#A99BC9')}${d.flor ? '' : petala(159, 72, 7, '#D98C9A')}
      <!-- gato -->
      <ellipse cx="150" cy="190" rx="26" ry="13" fill="#9A9A9A"/>
      <circle cx="${126}" cy="182" r="10" fill="#9A9A9A"/>
      <path d="M118 176 l2 -10 l6 6z M128 172 l6 -6 l1 10z" fill="#9A9A9A"/>
      <path d="M176 190 Q${d.rabo ? '196 206 204 196' : '194 178 202 168'}" fill="none" stroke="#9A9A9A" stroke-width="5" stroke-linecap="round"/>`,
    marcas: { cortina: [102, 56, 14], relogio: [160, 45, 26], quadro: [245, 46, 32], bule: [95, 120, 26], xicara: [183, 133, 15], cereja: [227, 110, 10], flor: [159, 72, 12], rabo: [195, 186, 18] },
  },
  {
    nome: 'Dia no jardim',
    desenhar: (d) => `
      <rect width="300" height="210" fill="#CDE9F7"/>
      <circle cx="${d.sol ? 262 : 262}" cy="34" r="20" fill="${d.sol ? '#F5A65B' : '#F5D76E'}"/>
      <g fill="#FFFFFF"><ellipse cx="70" cy="34" rx="28" ry="10"/><ellipse cx="88" cy="28" rx="18" ry="10"/>
      ${d.nuvem ? '<ellipse cx="170" cy="50" rx="22" ry="8"/><ellipse cx="182" cy="45" rx="12" ry="8"/>' : ''}</g>
      <rect y="140" width="300" height="70" fill="#8CC56A"/>
      <!-- árvore -->
      <rect x="40" y="90" width="14" height="60" fill="#7A4B27"/>
      <circle cx="47" cy="80" r="32" fill="#4E8F4A"/>
      <g fill="#D64933"><circle cx="35" cy="72" r="5"/><circle cx="58" cy="68" r="5"/><circle cx="47" cy="92" r="5"/>${d.macas ? '' : '<circle cx="62" cy="88" r="5"/>'}</g>
      <!-- cerca -->
      <g fill="#FFFFFF" stroke="#B9A58A" stroke-width="1">
        ${[110, 132, 154, 176, 198, 220, 242, 264].filter((x) => !(d.cerca && x === 198)).map((x) => `<path d="M${x} 150 v-40 l7 -8 l7 8 v40z"/>`).join('')}
        <rect x="104" y="118" width="180" height="6"/><rect x="104" y="136" width="180" height="6"/>
      </g>
      ${d.passaro ? '' : '<g transform="translate(150 98)"><ellipse rx="9" ry="6" fill="#3D6FB6"/><circle cx="7" cy="-5" r="4.5" fill="#3D6FB6"/><path d="M11 -5 l5 1 l-5 2z" fill="#F2A541"/><circle cx="8" cy="-6" r="1" fill="#fff"/></g>'}
      <!-- regador -->
      <g transform="translate(70 170)"><rect x="-14" y="-14" width="28" height="22" rx="3" fill="${d.regador ? '#D2557A' : '#3A6F6B'}"/>
        <path d="M14 -8 l16 -12" stroke="${d.regador ? '#D2557A' : '#3A6F6B'}" stroke-width="4"/><path d="M-6 -14 q6 -12 12 0" fill="none" stroke="#333" stroke-width="2"/></g>
      <!-- flores -->
      ${[[130, 170, '#D98C9A'], [165, 178, '#F0B48A'], [200, 168, d.florCor ? '#A99BC9' : '#F5D76E'], [235, 176, '#D98C9A']].map(([x, y, cor]) =>
        `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + 22}" stroke="#2D6A2F" stroke-width="2"/>${petala(x, y, 9, cor)}`).join('')}
      <!-- borboleta -->
      <g transform="translate(110 70)"><ellipse cx="-6" cy="-3" rx="7" ry="9" fill="${d.borboleta ? '#7B4FB8' : '#F2A541'}"/><ellipse cx="6" cy="-3" rx="7" ry="9" fill="${d.borboleta ? '#7B4FB8' : '#F2A541'}"/>
        <rect x="-1" y="-8" width="2" height="14" fill="#333"/></g>`,
    marcas: { sol: [262, 34, 24], nuvem: [176, 48, 26], macas: [62, 88, 10], cerca: [205, 125, 16], passaro: [152, 96, 16], regador: [80, 162, 26], florCor: [200, 170, 14], borboleta: [110, 68, 15] },
  },
  {
    nome: 'Sala de estar',
    desenhar: (d) => `
      <rect width="300" height="210" fill="#EFE6F3"/>
      <rect y="165" width="300" height="45" fill="#BFA58A"/>
      <!-- estante -->
      <rect x="18" y="40" width="72" height="125" fill="#9C6B43"/>
      <rect x="24" y="78" width="60" height="4" fill="#7A4B27"/><rect x="24" y="118" width="60" height="4" fill="#7A4B27"/>
      ${[['#D2557A', 26], ['#3D6FB6', 36], ['#E9A03B', 46], ['#4E7D5B', 56], ['#7B4FB8', 66]].filter(([, x]) => !(d.livro && x === 46)).map(([cor, x]) => `<rect x="${x}" y="52" width="8" height="26" fill="${cor}"/>`).join('')}
      ${[['#4E7D5B', 28], ['#D2557A', 40], ['#3D6FB6', 52]].map(([cor, x]) => `<rect x="${x}" y="92" width="10" height="26" fill="${cor}"/>`).join('')}
      <!-- quadro -->
      <rect x="125" y="28" width="62" height="46" fill="#FFF8EC" stroke="#B5813F" stroke-width="4"/>
      <path d="M129 70 L148 48 L160 60 L170 50 L183 70Z" fill="${d.quadro ? '#7B4FB8' : '#4E7D5B'}"/>
      <!-- abajur -->
      <rect x="250" y="70" width="4" height="95" fill="#5A4636"/>
      <path d="M232 70 h40 l-8 -26 h-24z" fill="${d.abajur ? '#5E8C61' : '#F2C14E'}"/>
      <rect x="240" y="162" width="24" height="5" fill="#5A4636"/>
      <!-- poltrona -->
      <rect x="120" y="105" width="90" height="60" rx="14" fill="#C0714F"/>
      <rect x="110" y="125" width="20" height="40" rx="8" fill="#A85F40"/><rect x="200" y="125" width="20" height="40" rx="8" fill="#A85F40"/>
      <rect x="128" y="135" width="74" height="18" rx="6" fill="#D08A6A"/>
      ${d.almofada ? '' : '<rect x="150" y="112" width="30" height="22" rx="6" fill="#F5D76E"/>'}
      <!-- planta -->
      <path d="M100 165 h18 l-3 -22 h-12z" fill="#D2557A"/>
      ${[[-30, 109], [0, 109], [30, 109], ...(d.folha ? [] : [[60, 109]])].map(([a]) => `<ellipse cx="109" cy="128" rx="5" ry="14" transform="rotate(${a - 15} 109 143)" fill="#4E8F4A"/>`).join('')}
      <!-- tapete e gato -->
      <ellipse cx="170" cy="190" rx="70" ry="12" fill="${d.tapete ? '#7B4FB8' : '#3A6F6B'}"/>
      <ellipse cx="200" cy="184" rx="16" ry="9" fill="#2B2B2B"/><circle cx="186" cy="178" r="7" fill="#2B2B2B"/>
      <path d="M181 173 l1 -7 l4 5z M187 171 l4 -5 l1 7z" fill="#2B2B2B"/>
      ${d.gato ? '' : '<circle cx="184" cy="177" r="1.4" fill="#F2C14E"/><circle cx="189" cy="177" r="1.4" fill="#F2C14E"/>'}`,
    marcas: { livro: [50, 64, 12], quadro: [156, 58, 20], abajur: [252, 56, 24], almofada: [165, 122, 20], folha: [118, 126, 16], tapete: [140, 192, 18], gato: [186, 177, 10] },
  },
];

// ---------- Desenhos para colorir (traço preto, sem preenchimento) ----------
export const T = 'fill="#FFFFFF" stroke="#2B2B2B" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"';

export const petalaPonta = (comp, larg) => `M0 0 C${larg} ${-comp * 0.3} ${larg * 0.6} ${-comp * 0.85} 0 ${-comp} C${-larg * 0.6} ${-comp * 0.85} ${-larg} ${-comp * 0.3} 0 0Z`;

export function anel(n, desenho, giro = 0) {
  return Array.from({ length: n }, (_, i) => `<g transform="rotate(${giro + (360 / n) * i})">${desenho}</g>`).join('');
}

export function mandala(semente) {
  const r = aleatorio(semente);
  const n1 = [8, 10, 12][Math.floor(r() * 3)], n2 = n1 * 2;
  const partes = [];
  partes.push(`<circle r="190" ${T}/>`);
  partes.push(anel(n2, `<path transform="translate(0 -150)" d="M-14 0 Q0 -40 14 0Z" ${T}/>`, 180 / n2));
  partes.push(`<circle r="150" ${T}/>`);
  partes.push(anel(n1, `<path transform="translate(0 -60)" d="${petalaPonta(88, 34)}" ${T}/><path transform="translate(0 -72)" d="${petalaPonta(56, 16)}" ${T}/>`));
  partes.push(anel(n1, `<circle cy="-132" r="9" ${T}/><circle cy="-132" r="3.5" ${T}/>`, 180 / n1));
  partes.push(anel(n1, `<path transform="translate(0 -30)" d="${petalaPonta(36, 18)}" ${T}/>`, 180 / n1));
  partes.push(`<circle r="30" ${T}/>`);
  partes.push(anel(n1, `<path transform="translate(0 -6)" d="${petalaPonta(22, 9)}" ${T}/>`));
  partes.push(`<circle r="7" ${T}/>`);
  if (r() > 0.4) partes.push(anel(n2, `<circle cy="-172" r="5" ${T}/>`, 0));
  return `<svg viewBox="-200 -200 400 400">${partes.join('')}</svg>`;
}

export function mandalaFloral(semente) {
  const r = aleatorio(semente);
  const n = [6, 8][Math.floor(r() * 2)];
  const flor = (cy, s) => `<g transform="translate(0 ${cy}) scale(${s})">${anel(6, `<path d="${petalaPonta(22, 11)}" ${T}/>`)}<circle r="6" ${T}/></g>`;
  const folha = `<path d="M0 0 Q12 -14 0 -34 Q-12 -14 0 0Z" ${T}/><path d="M0 -2 L0 -30" fill="none" stroke="#2B2B2B" stroke-width="1"/>`;
  return `<svg viewBox="-200 -200 400 400">
    <circle r="192" ${T}/><circle r="178" ${T}/>
    ${anel(n * 3, `<circle cy="-185" r="4" ${T}/>`)}
    ${anel(n, `<g transform="translate(0 -128) rotate(${-30})">${folha}</g><g transform="translate(0 -128) rotate(30)">${folha}</g>${flor(-138, 1.35)}`)}
    ${anel(n, `<path transform="translate(0 -46)" d="${petalaPonta(60, 26)}" ${T}/>`, 180 / n)}
    ${anel(n, `${flor(-82, 0.9)}`)}
    <circle r="46" ${T}/>${flor(0, 1.6)}
  </svg>`;
}

export function azulejo(semente) {
  const r = aleatorio(semente);
  const variante = Math.floor(r() * 2);
  const tile = (x, y) => `<g transform="translate(${x} ${y})">
    <rect width="100" height="100" ${T}/>
    ${variante ? `<circle cx="50" cy="50" r="34" ${T}/>${anel(8, `<path transform="translate(0 -6)" d="${petalaPonta(26, 9)}" ${T}/>`).replace(/<g transform="rotate/g, '<g transform="translate(50 50) rotate')}<circle cx="50" cy="50" r="6" ${T}/>`
      : `<path d="M50 6 Q62 38 94 50 Q62 62 50 94 Q38 62 6 50 Q38 38 50 6Z" ${T}/><rect x="38" y="38" width="24" height="24" transform="rotate(45 50 50)" ${T}/><circle cx="50" cy="50" r="5" ${T}/>`}
    <path d="M0 0 h16 a16 16 0 0 1 -16 16z" ${T}/><path d="M100 0 v16 a16 16 0 0 1 -16 -16z" ${T}/>
    <path d="M0 100 v-16 a16 16 0 0 1 16 16z" ${T}/><path d="M100 100 h-16 a16 16 0 0 1 16 -16z" ${T}/>
  </g>`;
  const t = [];
  for (let l = 0; l < 4; l++) for (let c = 0; c < 3; c++) t.push(tile(c * 100, l * 100));
  return `<svg viewBox="-4 -4 308 408">${t.join('')}<rect x="0" y="0" width="300" height="400" fill="none" stroke="#2B2B2B" stroke-width="3"/></svg>`;
}

export function florTraco(x, y, s, tipo = 0) {
  if (tipo === 1) {
    return `<g transform="translate(${x} ${y}) scale(${s})">${anel(8, `<ellipse cy="-14" rx="6" ry="14" ${T}/>`)}<circle r="9" ${T}/>${anel(6, `<circle cy="-4.5" r="1.6" ${T}/>`)}</g>`;
  }
  if (tipo === 2) {
    return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-14 0 Q-18 -26 0 -30 Q18 -26 14 0 Q0 10 -14 0Z" ${T}/><path d="M-8 -4 Q-10 -22 0 -26 Q10 -22 8 -4" ${T}/><path d="M-3 -10 Q0 -20 3 -10" ${T}/></g>`;
  }
  return `<g transform="translate(${x} ${y}) scale(${s})">${anel(5, `<path d="${petalaPonta(24, 14)}" ${T}/>`)}<circle r="7" ${T}/></g>`;
}
export const folhaTraco = (x, y, ang, s = 1) => `<g transform="translate(${x} ${y}) rotate(${ang}) scale(${s})"><path d="M0 0 Q16 -12 34 0 Q16 12 0 0Z" ${T}/><path d="M2 0 L30 0" fill="none" stroke="#2B2B2B" stroke-width="1"/></g>`;

export function vasoDeFlores(semente) {
  const r = aleatorio(semente);
  const hastes = [];
  const flores = [];
  const pontos = [[150, 70], [100, 105], [200, 100], [125, 150], [180, 150], [70, 165], [232, 160], [150, 130]];
  pontos.forEach(([x, y], i) => {
    hastes.push(`<path d="M150 300 Q${(150 + x) / 2 + (r() - 0.5) * 30} ${(300 + y) / 2} ${x} ${y}" fill="none" stroke="#2B2B2B" stroke-width="1.6"/>`);
    hastes.push(folhaTraco((150 + x) / 2, (300 + y) / 2 + 10, x < 150 ? 200 : -20, 0.8));
  });
  pontos.forEach(([x, y], i) => flores.push(florTraco(x, y, 1.15 + r() * 0.3, i % 3)));
  return `<svg viewBox="0 0 300 420">
    ${hastes.join('')}${flores.join('')}
    <path d="M100 300 h100 l-10 100 q-40 14 -80 0z" ${T}/>
    <path d="M96 292 h108 v14 h-108z" ${T}/>
    <path d="M110 330 q40 18 80 0" fill="none" stroke="#2B2B2B" stroke-width="1.4"/>
    ${anel(6, '<path d="M0 0 l6 -10 l6 10 l-6 10z" ' + T + '/>').replace(/<g transform="rotate\(([\d.]+)\)">/g, (_, a) => `<g transform="translate(${117 + (+a / 60) * 13} 352)">`)}
    <rect x="20" y="398" width="260" height="10" rx="3" ${T}/>
  </svg>`;
}

export function paisagem(semente) {
  const r = aleatorio(semente);
  const pinheiros = Array.from({ length: 9 }, (_, i) => {
    const x = 10 + i * 34 + r() * 8, h = 40 + r() * 30;
    return `<path d="M${x} 300 L${x + 12} ${300 - h} L${x + 24} 300Z" ${T}/><path d="M${x + 4} ${300 - h * 0.4} L${x + 12} ${300 - h * 0.75} L${x + 20} ${300 - h * 0.4}" fill="none" stroke="#2B2B2B" stroke-width="1"/>`;
  });
  return `<svg viewBox="0 0 320 420">
    <rect x="1" y="1" width="318" height="418" ${T}/>
    <circle cx="230" cy="80" r="34" ${T}/>
    ${anel(12, `<path d="M0 -44 L0 -58" stroke="#2B2B2B" stroke-width="1.6"/>`).replace(/<g transform="rotate/g, '<g transform="translate(230 80) rotate')}
    <path d="M30 70 q14 -14 28 0 q12 -10 24 0 q10 12 -6 14 h-44 q-14 -4 -2 -14z" ${T}/>
    <path d="M0 230 L60 150 L100 190 L160 110 L220 185 L260 150 L320 210 L320 300 L0 300Z" ${T}/>
    <path d="M140 136 L160 110 L180 140 L170 134 L160 146 L150 134Z" ${T}/>
    <path d="M0 260 Q80 220 160 250 T320 240 L320 300 L0 300Z" ${T}/>
    ${pinheiros.join('')}
    <path d="M0 300 h320 v120 h-320z" ${T}/>
    ${[320, 340, 360, 380, 400].map((y, i) => `<path d="M${30 + i * 18} ${y} q20 -6 40 0 t40 0" fill="none" stroke="#2B2B2B" stroke-width="1.2"/>`).join('')}
    <path d="M190 360 h60 l-10 14 h-40z" ${T}/><path d="M220 360 v-34 l22 30z" ${T}/>
    <g fill="none" stroke="#2B2B2B" stroke-width="1.6"><path d="M70 120 q6 -6 12 0 q6 -6 12 0"/><path d="M110 100 q5 -5 10 0 q5 -5 10 0"/></g>
  </svg>`;
}

export function casinha() {
  return `<svg viewBox="0 0 320 420">
    <rect x="1" y="1" width="318" height="418" ${T}/>
    <path d="M30 60 q14 -14 28 0 q12 -10 24 0 q10 12 -6 14 h-44 q-14 -4 -2 -14z" ${T}/>
    <circle cx="262" cy="60" r="26" ${T}/>
    <path d="M0 250 Q100 210 200 240 T320 230 L320 420 L0 420Z" ${T}/>
    <rect x="70" y="170" width="150" height="120" ${T}/>
    <path d="M55 175 L145 105 L235 175Z" ${T}/>
    <rect x="180" y="112" width="20" height="40" ${T}/>
    <rect x="128" y="220" width="34" height="70" ${T}/><circle cx="155" cy="257" r="3" ${T}/>
    <rect x="84" y="195" width="32" height="32" ${T}/><line x1="100" y1="195" x2="100" y2="227" stroke="#2B2B2B" stroke-width="1.4"/><line x1="84" y1="211" x2="116" y2="211" stroke="#2B2B2B" stroke-width="1.4"/>
    <rect x="174" y="195" width="32" height="32" ${T}/><line x1="190" y1="195" x2="190" y2="227" stroke="#2B2B2B" stroke-width="1.4"/><line x1="174" y1="211" x2="206" y2="211" stroke="#2B2B2B" stroke-width="1.4"/>
    <circle cx="145" cy="150" r="11" ${T}/>
    <path d="M128 290 L162 290 L190 420 L100 420Z" ${T}/>
    <rect x="262" y="210" width="16" height="90" ${T}/><circle cx="270" cy="185" r="40" ${T}/>
    ${[[252, 172], [285, 168], [270, 200], [292, 196], [250, 198]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" ${T}/>`).join('')}
    ${[0, 1, 2, 3, 4].map((i) => `<rect x="${8 + i * 12}" y="290" width="8" height="36" ${T}/>`).join('')}<rect x="2" y="298" width="64" height="6" ${T}/><rect x="2" y="314" width="64" height="6" ${T}/>
    ${[[30, 360, 0], [70, 380, 1], [230, 360, 2], [270, 385, 0], [210, 395, 1]].map(([x, y, t]) => `<path d="M${x} ${y} v30" stroke="#2B2B2B" stroke-width="1.4"/>${florTraco(x, y, 0.75, t)}`).join('')}
  </svg>`;
}

export function borboletas() {
  const borboleta = (x, y, s, a) => `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})">
    <path d="M0 0 C-30 -50 -70 -30 -50 0 C-70 30 -30 50 0 0Z" ${T}/><path d="M0 0 C30 -50 70 -30 50 0 C70 30 30 50 0 0Z" ${T}/>
    <circle cx="-34" cy="-14" r="8" ${T}/><circle cx="34" cy="-14" r="8" ${T}/><circle cx="-30" cy="16" r="5" ${T}/><circle cx="30" cy="16" r="5" ${T}/>
    <ellipse rx="4" ry="22" ${T}/><path d="M-2 -20 q-8 -14 -14 -14 M2 -20 q8 -14 14 -14" fill="none" stroke="#2B2B2B" stroke-width="1.4"/></g>`;
  return `<svg viewBox="0 0 320 420">
    ${borboleta(160, 120, 1.5, 0)}${borboleta(70, 280, 0.9, -20)}${borboleta(250, 300, 1, 18)}
    ${[[40, 400, 0], [100, 405, 1], [160, 398, 2], [220, 404, 0], [280, 400, 1]].map(([x, y, t]) => `<path d="M${x} ${y} v-50" stroke="#2B2B2B" stroke-width="1.4"/>${folhaTraco(x, y - 20, -40, 0.6)}${florTraco(x, y - 50, 0.9, t)}`).join('')}
  </svg>`;
}

export function guirlandaFrase(frase) {
  const itens = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2, x = 160 + Math.cos(a) * 125, y = 200 + Math.sin(a) * 125;
    itens.push(i % 2 ? folhaTraco(x, y, (a * 180) / Math.PI + 60, 0.9) : florTraco(x, y, 0.9, (i / 2) % 3));
  }
  const linhas = frase.split('|');
  return `<svg viewBox="0 0 320 400">
    <circle cx="160" cy="200" r="125" fill="none" stroke="#2B2B2B" stroke-width="1.4"/>
    ${itens.join('')}
    ${linhas.map((l, i) => `<text x="160" y="${200 - (linhas.length - 1) * 22 + i * 44}" text-anchor="middle" font-family="Lora" font-weight="700" font-size="34" fill="#FFFFFF" stroke="#2B2B2B" stroke-width="1.4">${l}</text>`).join('')}
  </svg>`;
}

export function cafeComBolo() {
  return `<svg viewBox="0 0 320 400">
    <rect x="10" y="300" width="300" height="16" rx="4" ${T}/>
    <path d="M30 300 Q20 230 70 214 L120 214 Q170 230 160 300Z" ${T}/>
    <path d="M160 260 Q196 246 186 214" fill="none" stroke="#2B2B2B" stroke-width="6"/><path d="M160 260 Q196 246 186 214" fill="none" stroke="#FFFFFF" stroke-width="3"/>
    <path d="M38 250 Q95 268 152 250" fill="none" stroke="#2B2B2B" stroke-width="1.4"/>
    ${florTraco(95, 270, 0.6, 0)}${florTraco(60, 262, 0.45, 1)}${florTraco(130, 262, 0.45, 1)}
    <rect x="80" y="198" width="30" height="16" rx="4" ${T}/><circle cx="95" cy="192" r="6" ${T}/>
    <path d="M200 270 h50 v14 a25 12 0 0 1 -50 0z" ${T}/><path d="M250 274 q14 0 10 12 q-4 6 -12 4" fill="none" stroke="#2B2B2B" stroke-width="1.6"/>
    <ellipse cx="225" cy="296" rx="38" ry="6" ${T}/>
    ${[0, 1, 2].map((i) => `<path d="M${214 + i * 10} 262 q-6 -12 0 -22 q6 -10 0 -20" fill="none" stroke="#2B2B2B" stroke-width="1.3"/>`).join('')}
    <path d="M190 150 h100 v40 h-100z" ${T}/><path d="M190 150 q12 14 25 0 q12 14 25 0 q12 14 25 0 q12 14 25 0" ${T}/>
    <ellipse cx="240" cy="192" rx="62" ry="8" ${T}/><circle cx="240" cy="138" r="8" ${T}/>
  </svg>`;
}
