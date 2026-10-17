// Tangram: as 7 peças e as figuras-desafio.
// Unidade: o cateto do triângulo pequeno vale 1. Cada figura é validada no build
// (peças certas, sem sobreposição e área total 8).
import pc from 'polygon-clipping';

const Q = Math.SQRT1_2;

// Peças do quadrado inicial, num quadrado de lado 4 (catetos do triângulo pequeno = √2).
// Para desenhar, escala por 1/√2.
export const pecasQuadrado = {
  'Triângulo grande A': [[0, 0], [4, 0], [2, 2]],
  'Triângulo grande B': [[0, 0], [2, 2], [0, 4]],
  'Triângulo médio': [[4, 2], [4, 4], [2, 4]],
  'Quadrado': [[2, 2], [3, 1], [4, 2], [3, 3]],
  'Triângulo pequeno A': [[4, 0], [4, 2], [3, 1]],
  'Triângulo pequeno B': [[2, 2], [3, 3], [1, 3]],
  'Paralelogramo': [[0, 4], [1, 3], [3, 3], [2, 4]],
};

const s5 = (ox, oy) => [
  // quadrado de lado 2 formado pelas 5 peças menores
  [[ox, oy], [ox + 2, oy], [ox + 1, oy + 1]], // médio
  [[ox + 1, oy + 1], [ox + 2, oy + 1], [ox + 2, oy + 2], [ox + 1, oy + 2]], // quadrado
  [[ox + 1, oy + 1], [ox + 2, oy], [ox + 2, oy + 1]], // pequeno
  [[ox, oy], [ox + 1, oy + 1], [ox + 1, oy + 2], [ox, oy + 1]], // paralelogramo
  [[ox, oy + 1], [ox + 1, oy + 2], [ox, oy + 2]], // pequeno
];

// Figuras em coordenadas com y para cima (convertidas ao desenhar).
export const figuras = [
  {
    nome: 'Quadrado', escala: Q,
    pecas: Object.values(pecasQuadrado),
  },
  {
    nome: 'Triângulo', escala: Q,
    pecas: [
      [[0, 0], [4, 0], [2, 2]],
      [[4, 0], [8, 0], [6, 2]],
      ...s5(0, 0).map((p) => p.map(([u, v]) => [u - v + 4, u + v])),
    ],
  },
  {
    nome: 'Retângulo', escala: 1,
    pecas: [...s5(0, 0), [[2, 0], [4, 0], [2, 2]], [[4, 0], [4, 2], [2, 2]]],
  },
  {
    nome: 'Casa', escala: 1,
    pecas: [...s5(1, 0), [[0, 2], [2, 2], [2, 4]], [[2, 2], [4, 2], [2, 4]]],
  },
  {
    nome: 'Seta', escala: 1,
    pecas: [...s5(0, 1), [[2, 0], [4, 2], [2, 2]], [[2, 2], [4, 2], [2, 4]]],
  },
  {
    nome: 'Barco', escala: 1,
    pecas: [
      [[0, 1], [1, 0], [1, 1]],
      [[1, 0], [2, 0], [2, 1], [1, 1]],
      [[2, 1], [3, 0], [4, 1]],
      [[2, 0], [3, 0], [2, 1]],
      [[3, 0], [4, 0], [5, 1], [4, 1]],
      [[2, 1], [4, 3], [2, 3]],
      [[2, 3], [4, 3], [2, 5]],
    ],
  },
];

// ---------- validação ----------
const lados = (p) => p.map((a, i) => {
  const b = p[(i + 1) % p.length];
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}).sort((a, b) => a - b).map((v) => v.toFixed(3)).join(',');

const area = (p) => Math.abs(p.reduce((s, a, i) => {
  const b = p[(i + 1) % p.length];
  return s + a[0] * b[1] - b[0] * a[1];
}, 0)) / 2;

const areaMulti = (mp) => mp.reduce((s, poly) => s + area(poly[0]) - poly.slice(1).reduce((t, h) => t + area(h), 0), 0);

const r2 = Math.SQRT2;
const assinaturaPecas = [
  [2, 2, 2 * r2], [2, 2, 2 * r2], [r2, r2, 2], [1, 1, 1, 1], [1, 1, r2], [1, 1, r2], [1, 1, r2, r2],
].map((l) => l.map((v) => v.toFixed(3)).sort().join(',')).sort().join('|');

export function validar(fig) {
  const pecas = fig.pecas.map((p) => p.map(([x, y]) => [x * fig.escala, y * fig.escala]));
  const assin = pecas.map((p) => lados(p).split(',').sort().join(',')).sort().join('|');
  if (assin !== assinaturaPecas) throw new Error(`Tangram "${fig.nome}": peças não conferem`);
  for (let i = 0; i < pecas.length; i++) {
    for (let j = i + 1; j < pecas.length; j++) {
      const inter = pc.intersection([pecas[i]], [pecas[j]]);
      if (areaMulti(inter) > 1e-6) throw new Error(`Tangram "${fig.nome}": peças ${i} e ${j} se sobrepõem`);
    }
  }
  const total = areaMulti(pc.union(...pecas.map((p) => [p])));
  if (Math.abs(total - 8) > 1e-6) throw new Error(`Tangram "${fig.nome}": área ${total}`);
  return pecas;
}

// Desenha a silhueta (todas as peças na mesma cor) dentro de uma caixa.
export function silhuetaSVG(fig, cor) {
  const pecas = validar(fig);
  const xs = pecas.flat().map((p) => p[0]), ys = pecas.flat().map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const pad = 0.3;
  const vb = `${minX - pad} ${-maxY - pad} ${maxX - minX + 2 * pad} ${maxY - minY + 2 * pad}`;
  const polys = pecas.map((p) => `<polygon points="${p.map(([x, y]) => `${x},${-y}`).join(' ')}" fill="${cor}" stroke="${cor}" stroke-width="0.04" stroke-linejoin="round"/>`).join('');
  return `<svg viewBox="${vb}">${polys}</svg>`;
}

export function solucaoSVG(fig) {
  const pecas = validar(fig);
  const xs = pecas.flat().map((p) => p[0]), ys = pecas.flat().map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const pad = 0.2;
  const vb = `${minX - pad} ${-maxY - pad} ${maxX - minX + 2 * pad} ${maxY - minY + 2 * pad}`;
  const polys = pecas.map((p) => `<polygon points="${p.map(([x, y]) => `${x},${-y}`).join(' ')}" fill="#E8E1D3" stroke="#1E2633" stroke-width="0.05" stroke-linejoin="round"/>`).join('');
  return `<svg viewBox="${vb}">${polys}</svg>`;
}
