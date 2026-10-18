// Geradores do nível avançado: problemas de lógica, criptogramas, quadrados mágicos e mate em 2.
import { Chess } from 'chess.js';
import { aleatorio, embaralhar } from './geradores.mjs';

// ---------- Problemas de lógica (4 casas em fila) ----------
// Cada atributo sabe se escrever como sujeito ("Quem tem o gato"), predicado ("tem o gato") e objeto ("quem tem o gato").
export const atributos = {
  nome: { suj: (v) => v, pred: (v) => `se chama ${v}`, obj: (v) => v },
  cor: { suj: (v) => `O morador da casa ${v}`, pred: (v) => `mora na casa ${v}`, obj: (v) => `quem mora na casa ${v}`, titulo: 'Cor da casa' },
  fruta: { suj: (v) => `Quem gosta de ${v}`, pred: (v) => `gosta de ${v}`, obj: (v) => `quem gosta de ${v}`, titulo: 'Fruta preferida' },
  animal: { suj: (v) => `Quem tem ${v}`, pred: (v) => `tem ${v}`, obj: (v) => `quem tem ${v}`, titulo: 'Animal' },
  bebida: { suj: (v) => `Quem toma ${v}`, pred: (v) => `toma ${v}`, obj: (v) => `quem toma ${v}`, titulo: 'Bebida' },
  flor: { suj: (v) => `Quem cultiva ${v}`, pred: (v) => `cultiva ${v}`, obj: (v) => `quem cultiva ${v}`, titulo: 'Flor do jardim' },
  time: { suj: (v) => `Quem torce para o ${v}`, pred: (v) => `torce para o ${v}`, obj: (v) => `quem torce para o ${v}`, titulo: 'Time' },
};

const PERMS = (() => {
  const out = [];
  const rec = (a, resto) => (resto.length ? resto.forEach((x, i) => rec([...a, x], resto.filter((_, j) => j !== i))) : out.push(a));
  rec([], [0, 1, 2, 3]);
  return out; // perm[valor] = casa
})();

// Pista: uma função que diz se uma solução (casas por atributo) satisfaz a pista, e o texto.
function textoPista(p, cats, vals) {
  const S = (a, v) => atributos[cats[a]].suj(vals[a][v]);
  const P = (a, v) => atributos[cats[a]].pred(vals[a][v]);
  const O = (a, v) => atributos[cats[a]].obj(vals[a][v]);
  const cap = (t) => t[0].toUpperCase() + t.slice(1);
  switch (p.tipo) {
    case 'igual': return `${cap(S(p.a, p.va))} ${P(p.b, p.vb)}.`;
    case 'diferente': return `${cap(S(p.a, p.va))} não ${P(p.b, p.vb)}.`;
    case 'casa': return cats[p.a] === 'cor' ? `A casa ${p.n + 1} é ${vals[p.a][p.va]}.` : `${cap(S(p.a, p.va))} mora na casa ${p.n + 1}.`;
    case 'esquerda': return `${cap(S(p.a, p.va))} mora imediatamente à esquerda de ${O(p.b, p.vb)}.`;
    case 'vizinho': return `${cap(S(p.a, p.va))} mora ao lado de ${O(p.b, p.vb)}.`;
    case 'ponta': return `${cap(S(p.a, p.va))} mora em uma das pontas.`;
    default: return '';
  }
}
// Concordância: "Quem mora na casa X mora na casa Y" fica estranho; esses casos são evitados na geração.

function satisfaz(p, sol) {
  const ca = sol[p.a][p.va];
  const cb = p.b !== undefined ? sol[p.b][p.vb] : null;
  switch (p.tipo) {
    case 'igual': return ca === cb;
    case 'diferente': return ca !== cb;
    case 'casa': return ca === p.n;
    case 'esquerda': return ca + 1 === cb;
    case 'vizinho': return Math.abs(ca - cb) === 1;
    case 'ponta': return ca === 0 || ca === 3;
    default: return false;
  }
}

function contarSolucoesLogica(pistas, nAtr, limite = 2) {
  let total = 0;
  const sol = new Array(nAtr);
  const pistasPor = Array.from({ length: nAtr }, () => []);
  for (const p of pistas) pistasPor[Math.max(p.a, p.b ?? 0)].push(p);
  const rec = (k) => {
    if (k === nAtr) { total++; return; }
    for (const perm of PERMS) {
      sol[k] = perm;
      if (pistasPor[k].every((p) => satisfaz(p, sol))) rec(k + 1);
      if (total >= limite) return;
    }
  };
  rec(0);
  return total;
}

export function problemaLogica({ cats, vals, semente }) {
  const r = aleatorio(semente);
  const n = cats.length;
  const sol = cats.map(() => embaralhar([0, 1, 2, 3], r)); // sol[atributo][valor] = casa
  const candidatas = [];
  for (let a = 0; a < n; a++) {
    for (let va = 0; va < 4; va++) {
      candidatas.push({ tipo: 'casa', a, va, n: sol[a][va] });
      if (sol[a][va] === 0 || sol[a][va] === 3) candidatas.push({ tipo: 'ponta', a, va });
      for (let b = 0; b < n; b++) {
        if (b === a) continue;
        for (let vb = 0; vb < 4; vb++) {
          const da = sol[a][va], db = sol[b][vb];
          if (cats[b] === 'nome' && cats[a] !== 'nome') continue; // o nome fica sempre como sujeito
          if (da === db && b > a) candidatas.push({ tipo: 'igual', a, va, b, vb });
          if (da !== db && b > a) candidatas.push({ tipo: 'diferente', a, va, b, vb });
          if (da + 1 === db) candidatas.push({ tipo: 'esquerda', a, va, b, vb });
          if (Math.abs(da - db) === 1 && b > a) candidatas.push({ tipo: 'vizinho', a, va, b, vb });
        }
      }
    }
  }
  // Prefere pistas relacionais; as de casa fixa entram com menos frequência.
  const peso = { igual: 3, diferente: 1.5, esquerda: 2.5, vizinho: 2, ponta: 1, casa: 0.8 };
  const sorteio = () => {
    const tot = candidatas.reduce((s, c) => s + peso[c.tipo], 0);
    let x = r() * tot;
    for (const c of candidatas) { x -= peso[c.tipo]; if (x <= 0) return c; }
    return candidatas[0];
  };
  let pistas = [];
  for (let i = 0; i < 400 && (pistas.length < 3 || contarSolucoesLogica(pistas, n) > 1); i++) {
    const c = sorteio();
    if (!pistas.includes(c)) pistas.push(c);
  }
  if (contarSolucoesLogica(pistas, n) !== 1) throw new Error('Problema de lógica sem solução única');
  // Remove pistas desnecessárias.
  for (const p of embaralhar([...pistas], r)) {
    const sem = pistas.filter((x) => x !== p);
    if (contarSolucoesLogica(sem, n) === 1) pistas = sem;
  }
  const casas = [0, 1, 2, 3].map((casa) => cats.map((_, a) => vals[a][sol[a].indexOf(casa)]));
  return { pistas: embaralhar(pistas, r).map((p) => textoPista(p, cats, vals)), casas };
}

// ---------- Criptograma ----------
export function criptograma(frase, semente, dicas = 3) {
  const r = aleatorio(semente);
  const limpa = frase.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const letras = [...new Set(limpa.replace(/[^A-Z]/g, ''))];
  const numeros = embaralhar(Array.from({ length: 26 }, (_, i) => i + 1), r);
  const codigo = Object.fromEntries(letras.map((l, i) => [l, numeros[i]]));
  // Dicas: as letras que mais aparecem ajudam a destravar.
  const freq = letras.map((l) => [l, limpa.split(l).length - 1]).sort((a, b) => b[1] - a[1]);
  const reveladas = new Set(freq.slice(0, dicas).map(([l]) => l));
  return { palavras: limpa.split(' '), codigo, reveladas };
}

// ---------- Quadrado mágico 3x3 (números de 1 a 9, soma 15) ----------
const MAGICOS = (() => {
  const base = [2, 7, 6, 9, 5, 1, 4, 3, 8];
  const rot = (q) => [6, 3, 0, 7, 4, 1, 8, 5, 2].map((i) => q[i]);
  const esp = (q) => [2, 1, 0, 5, 4, 3, 8, 7, 6].map((i) => q[i]);
  const out = [];
  let q = base;
  for (let i = 0; i < 4; i++) { out.push(q, esp(q)); q = rot(q); }
  return out;
})();

export function quadradoMagico(semente) {
  const r = aleatorio(semente);
  const sol = MAGICOS[Math.floor(r() * 8)];
  for (const pos of embaralhar([[0, 8], [1, 5], [2, 3], [0, 5], [1, 6], [3, 8], [2, 7], [1, 3]], r)) {
    const unicos = MAGICOS.filter((m) => pos.every((i) => m[i] === sol[i]));
    if (unicos.length === 1 && !pos.includes(4)) return { jogo: sol.map((v, i) => (pos.includes(i) ? v : 0)), solucao: sol };
  }
  throw new Error('quadrado mágico sem pistas únicas');
}

// ---------- Xadrez: mate em 2 ----------
// Devolve os primeiros lances das brancas que forçam mate em 2 (e confirma que não há mate em 1).
export function mateEm2(fen) {
  const jogo = new Chess(fen);
  const mateEm1 = (j) => j.moves().some((m) => { j.move(m); const ok = j.isCheckmate(); j.undo(); return ok; });
  if (mateEm1(jogo)) return { chaves: [], temMateEm1: true };
  const chaves = [];
  for (const m of jogo.moves()) {
    jogo.move(m);
    let forca = !jogo.isStalemate() && !jogo.isDraw();
    if (forca && jogo.isCheckmate()) forca = false;
    if (forca) {
      for (const resp of jogo.moves()) {
        jogo.move(resp);
        const ok = mateEm1(jogo);
        jogo.undo();
        if (!ok) { forca = false; break; }
      }
    }
    jogo.undo();
    if (forca) chaves.push(m);
  }
  return { chaves, temMateEm1: false };
}
