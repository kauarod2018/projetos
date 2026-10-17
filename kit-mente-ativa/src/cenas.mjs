// Ilustrações dos quebra-cabeças em SVG (viewBox 300 x 400), em estilo adulto e sóbrio.
import { aleatorio } from './geradores.mjs';

// ---------- 1. Entardecer na serra ----------
export const serra = (() => {
  const r = aleatorio(11);
  const pinheiros = [];
  for (let i = 0; i < 26; i++) {
    const x = -10 + i * 12.5 + r() * 6, h = 38 + r() * 34, base = 300 + r() * 8;
    pinheiros.push(`<polygon points="${x},${base} ${x + 7},${base - h} ${x + 14},${base}" fill="#1D2B2A"/>`);
  }
  const reflexos = [];
  for (let i = 0; i < 14; i++) {
    const y = 318 + i * 6, w = 70 - i * 4 + r() * 10;
    reflexos.push(`<rect x="${150 - w / 2 + (r() - 0.5) * 10}" y="${y}" width="${w}" height="2" rx="1" fill="#F6C27A" opacity="${0.75 - i * 0.045}"/>`);
  }
  return `
  <defs>
    <linearGradient id="ceuS" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2E3F63"/><stop offset=".45" stop-color="#B8607A"/>
      <stop offset=".75" stop-color="#F09A6B"/><stop offset="1" stop-color="#F8D29A"/>
    </linearGradient>
    <linearGradient id="lagoS" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#C9796F"/><stop offset="1" stop-color="#2E3550"/>
    </linearGradient>
  </defs>
  <rect width="300" height="310" fill="url(#ceuS)"/>
  <g fill="#FFF3E0" opacity=".85">
    <circle cx="40" cy="30" r="0.9"/><circle cx="90" cy="18" r="0.7"/><circle cx="150" cy="40" r="0.8"/>
    <circle cx="210" cy="22" r="1"/><circle cx="265" cy="48" r="0.7"/><circle cx="20" cy="70" r="0.6"/>
  </g>
  <circle cx="150" cy="238" r="34" fill="#FCE3B0"/>
  <circle cx="150" cy="238" r="46" fill="#FCE3B0" opacity=".25"/>
  <g fill="#F6D2C4" opacity=".55">
    <ellipse cx="70" cy="120" rx="60" ry="5"/><ellipse cx="220" cy="105" rx="70" ry="4"/><ellipse cx="190" cy="150" rx="45" ry="3"/>
  </g>
  <path d="M0 230 L40 190 L75 215 L120 160 L160 205 L205 150 L250 200 L300 170 L300 310 L0 310Z" fill="#6B4E6E"/>
  <path d="M0 255 L35 225 L80 250 L130 205 L175 245 L230 210 L270 240 L300 225 L300 310 L0 310Z" fill="#4C3B57"/>
  <path d="M0 280 L50 255 L110 275 L160 250 L220 272 L300 255 L300 310 L0 310Z" fill="#33304A"/>
  ${pinheiros.join('')}
  <rect y="306" width="300" height="94" fill="url(#lagoS)"/>
  ${reflexos.join('')}
  <path d="M0 395 Q60 370 120 382 T300 372 L300 400 L0 400Z" fill="#15201F"/>
  <path d="M210 390 l18 -22 l3 22z M232 392 l10 -30 l4 30z" fill="#15201F"/>
  <g fill="none" stroke="#2A2233" stroke-width="1.6" stroke-linecap="round">
    <path d="M60 95 q5 -5 10 0 q5 -5 10 0"/><path d="M85 110 q4 -4 8 0 q4 -4 8 0"/><path d="M230 75 q5 -5 10 0 q5 -5 10 0"/>
  </g>
  <path d="M95 345 l40 0 l-6 6 l-28 0z" fill="#15201F"/><line x1="115" y1="345" x2="115" y2="322" stroke="#15201F" stroke-width="1.5"/>`;
})();

// ---------- 2. Azulejos portugueses ----------
export const azulejos = (() => {
  const azul = '#1F4E8C', claro = '#F4F1E8';
  const tile = (x, y, v) => {
    const c = 25;
    const base = `<rect x="${x}" y="${y}" width="50" height="50" fill="${claro}"/>`;
    const motivos = [
      `<circle cx="${x + c}" cy="${y + c}" r="16" fill="none" stroke="${azul}" stroke-width="3"/>
       <path d="M${x + c} ${y + 4} Q${x + c + 8} ${y + c} ${x + c} ${y + 46} Q${x + c - 8} ${y + c} ${x + c} ${y + 4}Z" fill="${azul}"/>
       <path d="M${x + 4} ${y + c} Q${x + c} ${y + c - 8} ${x + 46} ${y + c} Q${x + c} ${y + c + 8} ${x + 4} ${y + c}Z" fill="${azul}"/>
       <circle cx="${x + c}" cy="${y + c}" r="5" fill="${claro}" stroke="${azul}" stroke-width="2"/>`,
      `<path d="M${x} ${y} Q${x + c} ${y + 12} ${x + 50} ${y} Q${x + 38} ${y + c} ${x + 50} ${y + 50} Q${x + c} ${y + 38} ${x} ${y + 50} Q${x + 12} ${y + c} ${x} ${y}Z" fill="${azul}"/>
       <rect x="${x + 17}" y="${y + 17}" width="16" height="16" transform="rotate(45 ${x + c} ${y + c})" fill="${claro}"/>
       <circle cx="${x + c}" cy="${y + c}" r="3.5" fill="${azul}"/>`,
    ];
    const cantos = `<g fill="${azul}"><path d="M${x} ${y} h9 a9 9 0 0 1 -9 9z"/><path d="M${x + 50} ${y} v9 a9 9 0 0 1 -9 -9z"/>
      <path d="M${x} ${y + 50} v-9 a9 9 0 0 1 9 9z"/><path d="M${x + 50} ${y + 50} h-9 a9 9 0 0 1 9 -9z"/></g>`;
    return base + motivos[v] + cantos + `<rect x="${x}" y="${y}" width="50" height="50" fill="none" stroke="#C9C2B0" stroke-width=".6"/>`;
  };
  const t = [];
  for (let l = 0; l < 8; l++) for (let c = 0; c < 6; c++) t.push(tile(c * 50, l * 50, (l + c) % 2));
  return `${t.join('')}
  <rect x="55" y="105" width="190" height="190" fill="${claro}" stroke="${azul}" stroke-width="5"/>
  <rect x="64" y="114" width="172" height="172" fill="none" stroke="${azul}" stroke-width="1.5"/>
  <g transform="translate(150 200)">
    ${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<path transform="rotate(${a})" d="M0 -78 Q16 -50 0 -22 Q-16 -50 0 -78Z" fill="${azul}"/>`).join('')}
    ${[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((a) => `<circle transform="rotate(${a})" cx="0" cy="-58" r="5" fill="${azul}"/>`).join('')}
    <circle r="24" fill="${claro}" stroke="${azul}" stroke-width="4"/>
    <circle r="12" fill="${azul}"/><circle r="5" fill="${claro}"/>
  </g>
  <rect x="0" y="0" width="300" height="400" fill="none" stroke="${azul}" stroke-width="8"/>`;
})();

// ---------- 3. Casario colonial ----------
export const casario = (() => {
  const casas = [
    { x: 0, w: 62, h: 120, cor: '#E5B94E' }, { x: 62, w: 58, h: 140, cor: '#4F7CA3' },
    { x: 120, w: 64, h: 112, cor: '#F1EBDD' }, { x: 184, w: 56, h: 132, cor: '#B4483C' },
    { x: 240, w: 60, h: 118, cor: '#6E9472' },
  ];
  const chao = 330;
  const partes = casas.map(({ x, w, h, cor }, i) => {
    const topo = chao - h;
    const janelas = [];
    const nj = w > 60 ? 3 : 2;
    for (let k = 0; k < nj; k++) {
      const jx = x + (w / nj) * k + (w / nj - 12) / 2;
      janelas.push(`<rect x="${jx}" y="${topo + 18}" width="12" height="22" fill="#2C3E50"/>
        <rect x="${jx - 2}" y="${topo + 16}" width="16" height="26" fill="none" stroke="#FFFFFF" stroke-width="2"/>
        <rect x="${jx - 3}" y="${topo + 42}" width="18" height="3" fill="#3A2A20"/>
        <g stroke="#3A2A20" stroke-width=".8">${[0, 4, 8, 12, 16].map((d) => `<line x1="${jx - 2 + d}" y1="${topo + 42}" x2="${jx - 2 + d}" y2="${topo + 36}"/>`).join('')}</g>`);
    }
    const porta = x + w / 2 - 9;
    return `<rect x="${x}" y="${topo}" width="${w}" height="${h}" fill="${cor}"/>
      <rect x="${x}" y="${topo - 10}" width="${w}" height="10" fill="#9C4A2F"/>
      <g stroke="#7A3622" stroke-width=".8">${Array.from({ length: Math.floor(w / 6) }, (_, k) => `<line x1="${x + k * 6 + 3}" y1="${topo - 10}" x2="${x + k * 6 + 3}" y2="${topo}"/>`).join('')}</g>
      <rect x="${x}" y="${topo}" width="${w}" height="4" fill="#FFFFFF" opacity=".85"/>
      <rect x="${x}" y="${topo}" width="4" height="${h}" fill="#FFFFFF" opacity=".85"/>
      ${janelas.join('')}
      <rect x="${porta}" y="${chao - 38}" width="18" height="38" fill="${i % 2 ? '#5B3A29' : '#2F5D50'}"/>
      <path d="M${porta} ${chao - 38} a9 9 0 0 1 18 0z" fill="#FFFFFF"/>
      <rect x="${porta}" y="${chao - 38}" width="18" height="38" fill="none" stroke="#FFFFFF" stroke-width="2"/>
      ${h > 120 ? `<rect x="${x + 6}" y="${topo + 60}" width="${w - 12}" height="3" fill="#3A2A20"/>` : ''}`;
  });
  const r = aleatorio(5);
  const pedras = [];
  for (let l = 0; l < 9; l++) {
    for (let c = 0; c < 14; c++) {
      const y = chao + 6 + l * 7.5, x = c * 23 + (l % 2) * 11 - 8 + r() * 3;
      pedras.push(`<rect x="${x}" y="${y}" width="${18 + r() * 4}" height="5.5" rx="2.5" fill="#8E8579" opacity="${0.55 + r() * 0.35}"/>`);
    }
  }
  return `
  <defs><linearGradient id="ceuC" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#8DB7D8"/><stop offset="1" stop-color="#E7EEF0"/></linearGradient></defs>
  <rect width="300" height="400" fill="url(#ceuC)"/>
  <g fill="#FFFFFF" opacity=".9"><ellipse cx="60" cy="50" rx="40" ry="10"/><ellipse cx="85" cy="44" rx="25" ry="10"/>
    <ellipse cx="230" cy="80" rx="45" ry="9"/><ellipse cx="250" cy="73" rx="22" ry="9"/></g>
  <path d="M0 210 Q40 160 90 175 T190 150 T300 170 L300 260 L0 260Z" fill="#8FA88A"/>
  <path d="M0 230 Q60 195 120 210 T240 190 T300 205 L300 270 L0 270Z" fill="#6F8C6C"/>
  <!-- igreja ao fundo -->
  <rect x="120" y="120" width="60" height="110" fill="#F4F0E6"/>
  <rect x="120" y="96" width="22" height="40" fill="#F4F0E6"/><rect x="158" y="96" width="22" height="40" fill="#F4F0E6"/>
  <path d="M120 96 L131 80 L142 96Z M158 96 L169 80 L180 96Z" fill="#5E4A3A"/>
  <circle cx="131" cy="108" r="5" fill="#5E4A3A"/><circle cx="169" cy="108" r="5" fill="#5E4A3A"/>
  <path d="M138 140 h24 l-12 -14z" fill="#C9A35A"/>
  <line x1="131" y1="80" x2="131" y2="70" stroke="#5E4A3A" stroke-width="1.5"/><line x1="127" y1="74" x2="135" y2="74" stroke="#5E4A3A" stroke-width="1.5"/>
  <line x1="169" y1="80" x2="169" y2="70" stroke="#5E4A3A" stroke-width="1.5"/><line x1="165" y1="74" x2="173" y2="74" stroke="#5E4A3A" stroke-width="1.5"/>
  ${partes.join('')}
  <rect y="${chao}" width="300" height="${400 - chao}" fill="#B8AE9F"/>
  ${pedras.join('')}
  <rect y="${chao}" width="300" height="5" fill="#77706A"/>
  <g transform="translate(270 ${chao})"><rect x="-1.5" y="-70" width="3" height="70" fill="#2B2B2B"/>
    <path d="M-8 -78 h16 l-3 10 h-10z" fill="#2B2B2B"/><rect x="-5" y="-76" width="10" height="6" fill="#F6D27A"/></g>`;
})();
