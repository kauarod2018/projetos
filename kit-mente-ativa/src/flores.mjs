// Paleta e enfeites em SVG: peças de jogo (dados, peões, estrelas, confete) e as flores usadas nos desenhos.
import { aleatorio } from './geradores.mjs';

// Paleta neutra e divertida. Os nomes antigos continuam valendo para não quebrar quem já usa.
export const paleta = {
  rosa: '#E07A5F', rosaEscuro: '#C25B42', lavanda: '#6F94B8', pessego: '#F4A261',
  amarelo: '#F2C14E', folha: '#81B29A', folhaEscura: '#4F8A6B', miolo: '#3D405B',
  coral: '#E07A5F', mostarda: '#F2C14E', salvia: '#81B29A', azul: '#3D5A80', grafite: '#33302E', areia: '#E9E1D4',
};

export function flor(x, y, r, cor, { petalas = 5, giro = 0, miolo = paleta.miolo } = {}) {
  const p = [];
  for (let i = 0; i < petalas; i++) {
    const a = giro + (360 / petalas) * i;
    p.push(`<ellipse cx="0" cy="${-r * 0.55}" rx="${r * 0.42}" ry="${r * 0.6}" transform="rotate(${a})" fill="${cor}"/>`);
  }
  return `<g transform="translate(${x} ${y})">${p.join('')}<circle r="${r * 0.28}" fill="${miolo}"/></g>`;
}

export function folha(x, y, comp, angulo, cor) {
  return `<path transform="translate(${x} ${y}) rotate(${angulo})" d="M0 0 Q${comp * 0.5} ${-comp * 0.32} ${comp} 0 Q${comp * 0.5} ${comp * 0.32} 0 0Z" fill="${cor}"/>`;
}

export function botao(x, y, r, cor) {
  return `<g transform="translate(${x} ${y})"><ellipse rx="${r * 0.55}" ry="${r * 0.8}" fill="${cor}"/><path d="M${-r * 0.5} ${r * 0.3} Q0 ${r * 1.3} ${r * 0.5} ${r * 0.3}" fill="${paleta.folha}"/></g>`;
}

// Raminho: um caule curvo com folhas e flores, desenhado a partir da origem na direção do ângulo.
export function raminho(x, y, comp, angulo, cores, semente = 1) {
  const r = aleatorio(semente);
  const partes = [`<path d="M0 0 Q${comp * 0.5} ${-comp * 0.12} ${comp} 0" fill="none" stroke="${paleta.folhaEscura}" stroke-width="${comp * 0.018}" stroke-linecap="round"/>`];
  const n = 5;
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1), px = comp * t, py = -comp * 0.12 * 4 * t * (1 - t) * 0.5;
    const lado = i % 2 ? -1 : 1;
    partes.push(folha(px, py, comp * (0.22 - t * 0.08), lado * (40 + r() * 15), i % 3 ? paleta.folha : paleta.folhaEscura));
  }
  partes.push(flor(comp, 0, comp * 0.13, cores[0], { giro: r() * 72 }));
  partes.push(flor(comp * 0.62, -comp * 0.1, comp * 0.09, cores[1] ?? cores[0], { giro: r() * 72 }));
  partes.push(botao(comp * 0.35, -comp * 0.11, comp * 0.05, cores[2] ?? cores[0]));
  return `<g transform="translate(${x} ${y}) rotate(${angulo})">${partes.join('')}</g>`;
}

// ---------- enfeites de jogo ----------
// enfeite(x, y, r, cor, { tipo, giro }): dado, peça de quebra-cabeça, estrela, peão, anel, confete, coração ou carta.
const TIPOS = ['dado', 'peca', 'estrela', 'peao', 'anel', 'confete', 'coracao', 'carta'];
export function enfeite(x, y, r, cor, { tipo = 'estrela', giro = 0 } = {}) {
  const g = (conteudo) => `<g transform="translate(${x} ${y}) rotate(${giro})">${conteudo}</g>`;
  const s = r;
  switch (tipo) {
    case 'dado': {
      const p = s * 0.42;
      return g(`<rect x="${-s}" y="${-s}" width="${2 * s}" height="${2 * s}" rx="${s * 0.35}" fill="${cor}"/>
        <circle cx="${-p}" cy="${-p}" r="${s * 0.17}" fill="#FFFFFF"/><circle r="${s * 0.17}" fill="#FFFFFF"/><circle cx="${p}" cy="${p}" r="${s * 0.17}" fill="#FFFFFF"/>`);
    }
    case 'peca': {
      const k = s * 0.32;
      return g(`<path d="M${-s} ${-s} H${-k} A${k} ${k} 0 1 1 ${k} ${-s} H${s} V${-k} A${k} ${k} 0 1 1 ${s} ${k} V${s} H${-s} Z" fill="${cor}"/>`);
    }
    case 'estrela': {
      const pts = Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? s * 0.45 : s; return `${(Math.cos(a) * rr).toFixed(2)},${(Math.sin(a) * rr).toFixed(2)}`; });
      return g(`<polygon points="${pts.join(' ')}" fill="${cor}" stroke="${cor}" stroke-width="${s * 0.18}" stroke-linejoin="round"/>`);
    }
    case 'peao':
      return g(`<circle cy="${-s * 0.55}" r="${s * 0.32}" fill="${cor}"/><path d="M${-s * 0.22} ${-s * 0.3} L${-s * 0.42} ${s * 0.55} H${s * 0.42} L${s * 0.22} ${-s * 0.3}Z" fill="${cor}"/>
        <rect x="${-s * 0.62}" y="${s * 0.5}" width="${s * 1.24}" height="${s * 0.42}" rx="${s * 0.12}" fill="${cor}"/>`);
    case 'anel': return g(`<circle r="${s * 0.75}" fill="none" stroke="${cor}" stroke-width="${s * 0.38}"/>`);
    case 'confete': return g(`<rect x="${-s * 0.28}" y="${-s * 0.75}" width="${s * 0.56}" height="${s * 1.5}" rx="${s * 0.26}" fill="${cor}"/>`);
    case 'coracao': return g(`<path d="M0 ${s * 0.8} C${-s * 1.3} ${-s * 0.1} ${-s * 0.6} ${-s * 1.1} 0 ${-s * 0.35} C${s * 0.6} ${-s * 1.1} ${s * 1.3} ${-s * 0.1} 0 ${s * 0.8}Z" fill="${cor}"/>`);
    case 'carta':
      return g(`<rect x="${-s * 0.72}" y="${-s}" width="${s * 1.44}" height="${s * 2}" rx="${s * 0.18}" fill="#FFFFFF" stroke="${cor}" stroke-width="${s * 0.12}"/>
        <path d="M0 ${s * 0.38} C${-s * 0.75} ${-s * 0.1} ${-s * 0.35} ${-s * 0.62} 0 ${-s * 0.2} C${s * 0.35} ${-s * 0.62} ${s * 0.75} ${-s * 0.1} 0 ${s * 0.38}Z" fill="${cor}"/>`);
    default: return '';
  }
}
export const tiposEnfeite = TIPOS;

// Canto para as páginas (viewBox 120 x 120, ancorado no canto inferior direito).
export function canto(cores, semente = 3) {
  const r = aleatorio(semente);
  const c = (i) => cores[i % cores.length];
  const giro = () => Math.round((r() - 0.5) * 40);
  return `<svg viewBox="0 0 120 120" class="canto">
    ${enfeite(96, 96, 15, c(0), { tipo: 'dado', giro: giro() })}
    ${enfeite(62, 104, 11, c(1), { tipo: 'peca', giro: giro() })}
    ${enfeite(100, 58, 10, c(2), { tipo: 'peao' })}
    ${enfeite(70, 72, 7, c(1), { tipo: 'estrela', giro: giro() })}
    ${enfeite(40, 108, 4, c(2), { tipo: 'confete', giro: 30 })}
    ${enfeite(110, 30, 4, c(0), { tipo: 'confete', giro: -20 })}
    ${enfeite(84, 40, 3.5, c(0), { tipo: 'anel' })}
    ${enfeite(46, 88, 3, c(0), { tipo: 'anel' })}
  </svg>`;
}

// Vinheta horizontal pequena, usada sob títulos: um rabisco divertido com uma estrelinha.
export function vinheta(cor) {
  return `<svg viewBox="0 0 120 14" class="vinheta">
    <path d="M4 7 q6 -6 12 0 t12 0 t12 0 t12 0" fill="none" stroke="${cor}" stroke-width="1.6" stroke-linecap="round"/>
    ${enfeite(62, 7, 5, paleta.mostarda, { tipo: 'estrela' })}
    <circle cx="74" cy="7" r="1.8" fill="${cor}"/><circle cx="81" cy="7" r="1.8" fill="${paleta.salvia}"/><circle cx="88" cy="7" r="1.8" fill="${paleta.coral}"/>
  </svg>`;
}

// Moldura circular de enfeites para as capas (viewBox 300 x 300).
export function guirlanda(cores, semente = 7) {
  const r = aleatorio(semente);
  const itens = [];
  const n = 22;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, R = 120 + (i % 2 ? 7 : -5);
    const x = 150 + Math.cos(a) * R, y = 150 + Math.sin(a) * R;
    const tipo = ['dado', 'estrela', 'peca', 'confete', 'peao', 'anel', 'carta', 'confete', 'coracao', 'estrela', 'anel'][i % 11];
    const tam = { dado: 13, peca: 12, peao: 13, carta: 11, coracao: 10, estrela: 10, anel: 7, confete: 7 }[tipo];
    itens.push(enfeite(x, y, tam, cores[i % cores.length], { tipo, giro: Math.round((r() - 0.5) * 60) }));
  }
  return `<svg viewBox="0 0 300 300" class="guirlanda">
    <circle cx="150" cy="150" r="120" fill="none" stroke="${paleta.areia}" stroke-width="10"/>
    <circle cx="150" cy="150" r="120" fill="none" stroke="${paleta.grafite}" stroke-width="1" stroke-dasharray="2 5"/>${itens.join('')}</svg>`;
}

// Composição para as aberturas de parte: uma mesa de jogos (viewBox 200 x 200).
export function buque(cores, semente = 9) {
  const r = aleatorio(semente);
  const c = (i) => cores[i % cores.length];
  const confetes = Array.from({ length: 14 }, (_, i) => enfeite(15 + r() * 170, 10 + r() * 70, 2.5 + r() * 2.5, c(i), { tipo: i % 3 ? 'confete' : 'estrela', giro: Math.round(r() * 180) })).join('');
  return `<svg viewBox="0 0 200 200" class="buque">
    ${confetes}
    <ellipse cx="100" cy="180" rx="88" ry="10" fill="${paleta.areia}"/>
    ${enfeite(55, 150, 24, c(0), { tipo: 'dado', giro: -12 })}
    ${enfeite(150, 152, 22, c(1), { tipo: 'peca', giro: 14 })}
    ${enfeite(100, 132, 30, c(2), { tipo: 'peao' })}
    ${enfeite(70, 100, 16, c(1), { tipo: 'carta', giro: -18 })}
    ${enfeite(128, 98, 16, c(0), { tipo: 'carta', giro: 16 })}
    ${enfeite(100, 70, 12, paleta.mostarda, { tipo: 'estrela' })}
  </svg>`;
}
