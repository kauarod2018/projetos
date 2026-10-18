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
function podeColocar(g, i, n, diag = false) {
  const l = Math.floor(i / 9), c = i % 9;
  if (diag && l === c) for (let k = 0; k < 9; k++) if (g[k * 10] === n) return false;
  if (diag && l + c === 8) for (let k = 0; k < 9; k++) if (g[k * 8 + 8] === n) return false;
  for (let k = 0; k < 9; k++) {
    if (g[l * 9 + k] === n || g[k * 9 + c] === n) return false;
  }
  const bl = l - (l % 3), bc = c - (c % 3);
  for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) if (g[(bl + a) * 9 + bc + b] === n) return false;
  return true;
}

function preencher(g, r, diag = false) {
  const i = g.indexOf(0);
  if (i < 0) return true;
  for (const n of embaralhar([1, 2, 3, 4, 5, 6, 7, 8, 9], r)) {
    if (podeColocar(g, i, n, diag)) {
      g[i] = n;
      if (preencher(g, r, diag)) return true;
      g[i] = 0;
    }
  }
  return false;
}

function contarSolucoes(g, limite = 2, diag = false) {
  const i = g.indexOf(0);
  if (i < 0) return 1;
  let total = 0;
  for (let n = 1; n <= 9 && total < limite; n++) {
    if (podeColocar(g, i, n, diag)) {
      g[i] = n;
      total += contarSolucoes(g, limite - total, diag);
      g[i] = 0;
    }
  }
  return total;
}

// diag: Sudoku X, em que as duas diagonais também têm os números de 1 a 9.
export function sudoku(semente, pistas, { diag = false } = {}) {
  const r = aleatorio(semente);
  const solucao = new Array(81).fill(0);
  preencher(solucao, r, diag);
  const jogo = [...solucao];
  let restantes = 81;
  for (const i of embaralhar([...Array(81).keys()], r)) {
    if (restantes <= pistas) break;
    const v = jogo[i];
    jogo[i] = 0;
    if (contarSolucoes([...jogo], 2, diag) !== 1) jogo[i] = v;
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

// ---------- Cruzadinha ----------
// Encaixa as palavras cruzando letras iguais, sem encostar palavras lado a lado.
export function cruzadinha(itens, semente, tentativas = 60) {
  let melhor = null;
  for (let t = 0; t < tentativas; t++) {
    const r = aleatorio(semente + t * 7919);
    const ordem = [itens[0], ...embaralhar(itens.slice(1), r)].sort((a, b) => b[0].length - a[0].length);
    const res = montarCruzadinha(ordem, r);
    if (!melhor || res.colocadas.length > melhor.colocadas.length
      || (res.colocadas.length === melhor.colocadas.length && res.area < melhor.area)) melhor = res;
    if (melhor.colocadas.length === itens.length && t > 20) break;
  }
  return numerar(melhor);
}

function montarCruzadinha(itens, r) {
  const cel = new Map();
  const chave = (l, c) => `${l},${c}`;
  const colocadas = [];
  const pode = (p, l, c, dl, dc) => {
    let cruza = 0;
    if (cel.has(chave(l - dl, c - dc)) || cel.has(chave(l + dl * p.length, c + dc * p.length))) return -1;
    for (let i = 0; i < p.length; i++) {
      const L = l + dl * i, C = c + dc * i, v = cel.get(chave(L, C));
      if (v) { if (v !== p[i]) return -1; cruza++; continue; }
      if (cel.has(chave(L + dc, C + dl)) || cel.has(chave(L - dc, C - dl))) return -1;
    }
    return cruza;
  };
  const por = (p, l, c, dl, dc, dica) => {
    for (let i = 0; i < p.length; i++) cel.set(chave(l + dl * i, c + dc * i), p[i]);
    colocadas.push({ palavra: p, l, c, dl, dc, dica });
  };
  const [p0, d0] = itens[0];
  por(p0, 0, 0, 0, 1, d0);
  for (const [p, dica] of itens.slice(1)) {
    const opcoes = [];
    for (const [k, v] of cel) {
      const [L, C] = k.split(',').map(Number);
      for (let i = 0; i < p.length; i++) {
        if (p[i] !== v) continue;
        for (const [dl, dc] of [[0, 1], [1, 0]]) {
          const n = pode(p, L - dl * i, C - dc * i, dl, dc);
          if (n > 0) opcoes.push([n + r() * 0.5, L - dl * i, C - dc * i, dl, dc]);
        }
      }
    }
    if (!opcoes.length) continue;
    opcoes.sort((a, b) => b[0] - a[0]);
    const [, l, c, dl, dc] = opcoes[Math.floor(r() * Math.min(3, opcoes.length))];
    por(p, l, c, dl, dc, dica);
  }
  const ls = [...cel.keys()].map((k) => +k.split(',')[0]), cs = [...cel.keys()].map((k) => +k.split(',')[1]);
  const minL = Math.min(...ls), minC = Math.min(...cs);
  const altura = Math.max(...ls) - minL + 1, largura = Math.max(...cs) - minC + 1;
  return {
    colocadas: colocadas.map((w) => ({ ...w, l: w.l - minL, c: w.c - minC })),
    altura, largura, area: altura * largura * (Math.abs(altura - largura) + 4),
  };
}

function numerar(res) {
  const inicios = [...new Set(res.colocadas.map((w) => `${w.l},${w.c}`))]
    .map((k) => k.split(',').map(Number)).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const numeroDe = new Map(inicios.map(([l, c], i) => [`${l},${c}`, i + 1]));
  const grade = Array.from({ length: res.altura }, () => new Array(res.largura).fill(''));
  for (const w of res.colocadas) for (let i = 0; i < w.palavra.length; i++) grade[w.l + w.dl * i][w.c + w.dc * i] = w.palavra[i];
  const pistas = res.colocadas.map((w) => ({ ...w, n: numeroDe.get(`${w.l},${w.c}`) })).sort((a, b) => a.n - b.n);
  // Toda sequência de 2 ou mais letras precisa ser uma palavra colocada.
  const validas = new Set(res.colocadas.map((w) => (w.dc ? 'H' : 'V') + w.palavra));
  const conferir = (get, A, B, tipo) => {
    for (let a = 0; a < A; a++) {
      let s = '';
      for (let b = 0; b <= B; b++) {
        const ch = b < B ? get(a, b) : '';
        if (ch) { s += ch; continue; }
        if (s.length > 1 && !validas.has(tipo + s)) throw new Error(`Cruzadinha com sequência inválida: ${s}`);
        s = '';
      }
    }
  };
  conferir((a, b) => grade[a][b], res.altura, res.largura, 'H');
  conferir((a, b) => grade[b][a], res.largura, res.altura, 'V');
  return { grade, numeros: numeroDe, horizontais: pistas.filter((w) => w.dc), verticais: pistas.filter((w) => w.dl), total: res.colocadas.length };
}

// ---------- Labirinto ----------
// Labirinto perfeito (um único caminho entre quaisquer duas casas), gerado por busca em profundidade.
export function labirinto(cols, rows, semente) {
  const r = aleatorio(semente);
  const paredes = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({ n: true, s: true, l: true, o: true })));
  const visto = Array.from({ length: rows }, () => new Array(cols).fill(false));
  const pilha = [[0, 0]];
  visto[0][0] = true;
  const dirs = [[-1, 0, 'n', 's'], [1, 0, 's', 'n'], [0, 1, 'l', 'o'], [0, -1, 'o', 'l']];
  while (pilha.length) {
    const [l, c] = pilha[pilha.length - 1];
    const viz = embaralhar(dirs, r).filter(([dl, dc]) => {
      const L = l + dl, C = c + dc;
      return L >= 0 && L < rows && C >= 0 && C < cols && !visto[L][C];
    });
    if (!viz.length) { pilha.pop(); continue; }
    const [dl, dc, a, b] = viz[0];
    paredes[l][c][a] = false;
    paredes[l + dl][c + dc][b] = false;
    visto[l + dl][c + dc] = true;
    pilha.push([l + dl, c + dc]);
  }
  // caminho da entrada (0,0) até a saída (rows-1, cols-1)
  const anterior = new Map([['0,0', null]]);
  const fila = [[0, 0]];
  while (fila.length) {
    const [l, c] = fila.shift();
    for (const [dl, dc, a] of dirs) {
      if (paredes[l][c][a]) continue;
      const k = `${l + dl},${c + dc}`;
      if (!anterior.has(k)) { anterior.set(k, `${l},${c}`); fila.push([l + dl, c + dc]); }
    }
  }
  const caminho = [];
  for (let k = `${rows - 1},${cols - 1}`; k; k = anterior.get(k)) caminho.unshift(k.split(',').map(Number));
  return { paredes, caminho, cols, rows };
}
