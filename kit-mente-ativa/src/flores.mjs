// Ornamentos florais em SVG: flores, folhas, raminhos, cantos e guirlanda.
import { aleatorio } from './geradores.mjs';

export const paleta = {
  rosa: '#D98C9A', rosaEscuro: '#B05468', lavanda: '#A99BC9', pessego: '#F0B48A',
  amarelo: '#EFC86B', folha: '#7E9F78', folhaEscura: '#5E8566', miolo: '#C98A3C',
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

// Canto floral para o rodapé das páginas (viewBox 120 x 120, ancorado no canto inferior direito).
export function canto(cores, semente = 3) {
  return `<svg viewBox="0 0 120 120" class="canto">
    ${raminho(118, 118, 95, -150, cores, semente)}
    ${raminho(118, 118, 70, -112, [cores[1], cores[0], cores[2]], semente + 1)}
    ${flor(108, 108, 13, cores[0], { giro: 20 })}
  </svg>`;
}

// Vinheta horizontal pequena, usada sob títulos.
export function vinheta(cor) {
  return `<svg viewBox="0 0 120 14" class="vinheta">
    <path d="M4 7 Q30 1 54 7" fill="none" stroke="${paleta.folhaEscura}" stroke-width="1"/>
    <path d="M66 7 Q90 13 116 7" fill="none" stroke="${paleta.folhaEscura}" stroke-width="1"/>
    ${folha(30, 4.5, 9, -30, paleta.folha)}${folha(90, 9.5, 9, 30, paleta.folha)}
    ${flor(60, 7, 7, cor, { giro: 10 })}
  </svg>`;
}

// Guirlanda circular para a capa e as divisórias (viewBox 300 x 300).
export function guirlanda(cores, semente = 7) {
  const r = aleatorio(semente);
  const itens = [];
  const n = 18;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, R = 118;
    const x = 150 + Math.cos(a) * R, y = 150 + Math.sin(a) * R;
    const graus = (a * 180) / Math.PI + 90;
    itens.push(folha(x, y, 26 + r() * 8, graus + (i % 2 ? 25 : -155), i % 3 ? paleta.folha : paleta.folhaEscura));
  }
  for (let i = 0; i < n; i++) {
    const a = ((i + 0.5) / n) * Math.PI * 2, R = 118 + (i % 2 ? 6 : -6);
    const x = 150 + Math.cos(a) * R, y = 150 + Math.sin(a) * R;
    if (i % 3 === 0) itens.push(flor(x, y, 15 + r() * 4, cores[i % cores.length], { giro: r() * 72 }));
    else if (i % 3 === 1) itens.push(botao(x, y, 6, cores[(i + 1) % cores.length]));
    else itens.push(flor(x, y, 9, cores[(i + 2) % cores.length], { petalas: 6, giro: r() * 60 }));
  }
  return `<svg viewBox="0 0 300 300" class="guirlanda"><circle cx="150" cy="150" r="118" fill="none" stroke="${paleta.folhaEscura}" stroke-width="1.4"/>${itens.join('')}</svg>`;
}

// Buquê para as divisórias (viewBox 200 x 200).
export function buque(cores, semente = 9) {
  const r = aleatorio(semente);
  const hastes = [];
  for (let i = 0; i < 7; i++) {
    const ang = -150 + i * 20 + (r() - 0.5) * 8;
    hastes.push(raminho(100, 190, 120 + r() * 40, ang, [cores[i % cores.length], cores[(i + 1) % cores.length], cores[(i + 2) % cores.length]], semente + i));
  }
  return `<svg viewBox="0 0 200 200" class="buque">${hastes.join('')}
    <path d="M86 186 Q100 170 114 186 L108 198 L92 198Z" fill="${paleta.rosaEscuro}" opacity=".85"/></svg>`;
}
