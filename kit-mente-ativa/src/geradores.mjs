// Geradores determinísticos: sudoku, caça-palavras, pirâmides e cortes de quebra-cabeça.
// Usam semente fixa, então o PDF sai igual a cada build.

export function aleatorio(semente) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function embaralhar(lista, r) {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- Sudoku ----------
function podeColocar(g, i, n) {
  const l = Math.floor(i / 9), c = i % 9;
  for (let k = 0; k < 9; k++) {
    if (g[l * 9 + k] === n || g[k * 9 + c] === n) return false;
  }
  const bl = l - (l % 3), bc = c - (c % 3);
  for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) if (g[(bl + a) * 9 + bc + b] === n) return false;
  return true;
}

function preencher(g, r) {
  const i = g.indexOf(0);
  if (i < 0) return true;
  for (const n of embaralhar([1, 2, 3, 4, 5, 6, 7, 8, 9], r)) {
    if (podeColocar(g, i, n)) {
      g[i] = n;
      if (preencher(g, r)) return true;
      g[i] = 0;
    }
  }
  return false;
}

function contarSolucoes(g, limite = 2) {
  const i = g.indexOf(0);
  if (i < 0) return 1;
  let total = 0;
  for (let n = 1; n <= 9 && total < limite; n++) {
    if (podeColocar(g, i, n)) {
      g[i] = n;
      total += contarSolucoes(g, limite - total);
      g[i] = 0;
    }
  }
  return total;
}

export function sudoku(semente, pistas) {
  const r = aleatorio(semente);
  const solucao = new Array(81).fill(0);
  preencher(solucao, r);
  const jogo = [...solucao];
  let restantes = 81;
  for (const i of embaralhar([...Array(81).keys()], r)) {
    if (restantes <= pistas) break;
    const v = jogo[i];
    jogo[i] = 0;
    if (contarSolucoes([...jogo]) !== 1) jogo[i] = v;
    else restantes--;
  }
  return { jogo, solucao, pistas: restantes };
}

// ---------- Caça-palavras ----------
const DIRECOES = [[0, 1], [1, 0], [1, 1], [-1, 1]];

export function cacaPalavras(palavras, tamanho, semente) {
  const r = aleatorio(semente);
  for (let tentativa = 0; tentativa < 200; tentativa++) {
    const g = Array.from({ length: tamanho }, () => new Array(tamanho).fill(''));
    const posicoes = [];
    let ok = true;
    for (const p of [...palavras].sort((a, b) => b.length - a.length)) {
      let colocou = false;
      for (let k = 0; k < 400 && !colocou; k++) {
        const [dl, dc] = DIRECOES[Math.floor(r() * DIRECOES.length)];
        const l0 = Math.floor(r() * tamanho), c0 = Math.floor(r() * tamanho);
        const lf = l0 + dl * (p.length - 1), cf = c0 + dc * (p.length - 1);
        if (lf < 0 || lf >= tamanho || cf >= tamanho) continue;
        let cabe = true;
        for (let i = 0; i < p.length; i++) {
          const v = g[l0 + dl * i][c0 + dc * i];
          if (v && v !== p[i]) { cabe = false; break; }
        }
        if (!cabe) continue;
        for (let i = 0; i < p.length; i++) g[l0 + dl * i][c0 + dc * i] = p[i];
        posicoes.push({ palavra: p, l0, c0, dl, dc });
        colocou = true;
      }
      if (!colocou) { ok = false; break; }
    }
    if (!ok) continue;
    const letras = 'AAABCDEEEFGHIIJLMNOOOPQRSSTUUVXZ';
    for (const linha of g) for (let c = 0; c < tamanho; c++) if (!linha[c]) linha[c] = letras[Math.floor(r() * letras.length)];
    return { grade: g, posicoes };
  }
  throw new Error('Não coube: ' + palavras.join(','));
}

// ---------- Pirâmide de soma ----------
// A base tem 5 números; cada bloco é a soma dos dois de baixo.
export function piramide(semente) {
  const r = aleatorio(semente);
  const base = Array.from({ length: 5 }, () => 1 + Math.floor(r() * 12));
  const linhas = [base];
  while (linhas[0].length > 1) {
    const ant = linhas[0];
    linhas.unshift(ant.slice(1).map((v, i) => ant[i] + v));
  }
  // linhas[0] é o topo. Mostra a base sem um número e o bloco acima dele.
  const oculta = 1 + Math.floor(r() * 3);
  const mostrar = linhas.map((l) => l.map(() => false));
  mostrar[4] = mostrar[4].map((_, i) => i !== oculta);
  mostrar[3][oculta - 1] = true;
  return { linhas, mostrar };
}

// ---------- Cortes de quebra-cabeça (encaixes) ----------
function borda(x0, y0, x1, y1, lado, r) {
  const L = Math.hypot(x1 - x0, y1 - y0);
  const ux = (x1 - x0) / L, uy = (y1 - y0) / L;
  const nx = -uy * lado, ny = ux * lado;
  const j = () => (r() - 0.5) * 0.04;
  const p = (t, n) => `${(x0 + ux * L * t + nx * L * n).toFixed(2)},${(y0 + uy * L * t + ny * L * n).toFixed(2)}`;
  const d = j();
  return [
    `L${p(0.37 + d, 0)}`,
    `C${p(0.41 + d, 0)} ${p(0.43 + d, 0.07)} ${p(0.39 + d, 0.13)}`,
    `C${p(0.33 + d, 0.24)} ${p(0.42 + d, 0.30)} ${p(0.5 + d, 0.30)}`,
    `C${p(0.58 + d, 0.30)} ${p(0.67 + d, 0.24)} ${p(0.61 + d, 0.13)}`,
    `C${p(0.57 + d, 0.07)} ${p(0.59 + d, 0)} ${p(0.63 + d, 0)}`,
    `L${p(1, 0)}`,
  ].join(' ');
}

export function cortesEncaixe(largura, altura, cols, rows, semente) {
  const r = aleatorio(semente);
  const w = largura / cols, h = altura / rows;
  const caminhos = [];
  for (let l = 1; l < rows; l++) {
    let d = `M0,${l * h}`;
    for (let c = 0; c < cols; c++) d += ' ' + borda(c * w, l * h, (c + 1) * w, l * h, r() < 0.5 ? 1 : -1, r);
    caminhos.push(d);
  }
  for (let c = 1; c < cols; c++) {
    let d = `M${c * w},0`;
    for (let l = 0; l < rows; l++) d += ' ' + borda(c * w, l * h, c * w, (l + 1) * h, r() < 0.5 ? 1 : -1, r);
    caminhos.push(d);
  }
  return caminhos;
}
