// Motor de animação: desenha o quadro do instante t (em segundos) num canvas 1920x1080.
// Tudo é determinístico: o mesmo t sempre gera o mesmo quadro.
"use strict";

const W = 1920, H = 1080;
const COR = {
  oceanoA: "#0f2a4a", oceanoB: "#040c18",
  terra: "#283a50", borda: "#41566f",
  verde: "#1fb85c", amarelo: "#ffd400", laranja: "#ff9f1c",
  painel: "rgba(6,14,27,0.88)", textoSuave: "#c9d8ec",
  vermelho: "#e62117", cinzaAzul: "#3d5476",
};

let R, T, ctx, proj, caminho;
let pathsPorId = {}, centros = {}, tamanhos = {};
let terraToda, grade, esfera, vistaMundo;
const bandeiras = {};
let cameras = [];
let ordemPaises = []; // cenas do tipo "pais", em ordem

// ---------- utilidades ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const easeInOut = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const easeOut = (u) => 1 - Math.pow(1 - u, 3);
const easeOutBack = (u) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); };
const prog = (t, t0, dur) => clamp((t - t0) / dur);
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function mistura(a, b, u) {
  const A = hexRgb(a), B = hexRgb(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * clamp(u))).join(",")})`;
}
function texto(str, x, y, { fonte, cor = "#fff", alinhar = "center", base = "alphabetic", espaco = "0px", sombra = true } = {}) {
  ctx.font = fonte; ctx.fillStyle = cor; ctx.textAlign = alinhar; ctx.textBaseline = base; ctx.letterSpacing = espaco;
  if (sombra) { ctx.shadowColor = "rgba(0,0,0,0.55)"; ctx.shadowBlur = 18; ctx.shadowOffsetY = 4; }
  ctx.fillText(str, x, y);
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; ctx.letterSpacing = "0px";
}
function largura(str, fonte, espaco = "0px") { ctx.font = fonte; ctx.letterSpacing = espaco; const w = ctx.measureText(str).width; ctx.letterSpacing = "0px"; return w; }
function comEscala(cx, cy, s, alpha, fn) {
  if (alpha <= 0 || s <= 0) return;
  ctx.save(); ctx.globalAlpha *= clamp(alpha); ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy); fn(); ctx.restore();
}
function painel(x, y, w, h, r = 22, cor = COR.painel) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 30; ctx.shadowOffsetY = 8;
  ctx.fillStyle = cor; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.stroke();
}
function bandeira(cod, x, y, w, h, r = 10) {
  const im = bandeiras[cod]; if (!im) return;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 14; ctx.shadowOffsetY = 4;
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.roundRect(x - 4, y - 4, w + 8, h + 8, r + 3); ctx.fill();
  ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.clip(); ctx.drawImage(im, x, y, w, h); ctx.restore();
}

// ---------- inicialização ----------
window.iniciar = async function () {
  R = window.ROTEIRO; T = window.TIMELINE;
  ctx = document.getElementById("tela").getContext("2d");
  const geo = topojson.feature(window.MUNDO, window.MUNDO.objects.countries);
  const feats = geo.features.filter((f) => f.id !== "010"); // sem Antártida
  const colecao = { type: "FeatureCollection", features: feats };
  proj = d3.geoNaturalEarth1().fitExtent([[30, 70], [W - 30, H - 10]], colecao);
  caminho = d3.geoPath(proj);
  terraToda = new Path2D();
  for (const f of feats) {
    const s = caminho(f); if (!s) continue;
    const p = new Path2D(s);
    terraToda.addPath(p);
    if (f.id) {
      pathsPorId[f.id] = p;
      const b = caminho.bounds(f);
      centros[f.id] = [(b[0][0] + b[1][0]) / 2, (b[0][1] + b[1][1]) / 2];
      tamanhos[f.id] = Math.max(b[1][0] - b[0][0], b[1][1] - b[0][1]);
      if (f.id === "076" || f.id === "024" || f.id === "508") centros[f.id] = caminho.centroid(f);
    }
  }
  grade = new Path2D(caminho(d3.geoGraticule10()));
  esfera = new Path2D(caminho({ type: "Sphere" }));
  const b = caminho.bounds(colecao);
  vistaMundo = [(b[0][0] + b[1][0]) / 2, (b[0][1] + b[1][1]) / 2 + 10, W * 1.02];

  ordemPaises = R.cenas.map((c, i) => ({ c, i })).filter((x) => x.c.tipo === "pais");

  const cods = [...new Set(R.cenas.filter((c) => c.bandeira).map((c) => c.bandeira))];
  await Promise.all(cods.map((cod) => new Promise((ok, erro) => {
    const im = new Image();
    im.onload = () => { bandeiras[cod] = im; ok(); };
    im.onerror = () => erro(new Error("bandeira não encontrada: " + cod));
    im.src = "../node_modules/flag-icons/flags/4x3/" + cod + ".svg";
  })));
  await Promise.all(["100px Anton", "600 30px Montserrat", "800 30px Montserrat", "900 30px Montserrat"].map((f) => document.fonts.load(f, "ÁÉÍÓÚÂÊÔÃÕÇ")));
  calcularCameras();
  return true;
};

// ---------- câmera ----------
// Uma "vista" é [x, y, w]: o ponto do mapa no centro da tela e a largura visível (em px do mapa).
function vistaFoco(px, py, zoom) {
  // posiciona o país um pouco à direita e acima do centro, deixando espaço para o cartão
  return [px - (0.10 * W) / zoom, py + (0.05 * H) / zoom, W / zoom];
}
function calcularCameras() {
  let anterior = vistaMundo;
  cameras = R.cenas.map((c, i) => {
    let alvo = vistaMundo;
    if (c.tipo === "pais" || c.tipo === "marcador") {
      if (c.camera) {
        const [x, y] = proj([c.camera[0], c.camera[1]]);
        alvo = vistaFoco(x, y, c.camera[2]);
      } else {
        const f = { id: c.id };
        const [x, y] = centros[f.id];
        const bb = caminhoBounds(c.id);
        const z = clamp(Math.min((W * 0.40) / bb[0], (H * 0.56) / bb[1]), 1.5, 14);
        alvo = vistaFoco(x, y, z);
      }
    }
    const mesmo = alvo === anterior || (alvo[0] === anterior[0] && alvo[1] === anterior[1] && alvo[2] === anterior[2]);
    const voo = mesmo ? 0 : c.tipo === "marcador" ? 1.35 : c.tipo === "total" ? 1.3 : c.tipo === "barra" ? 1.0 : 1.15;
    const deriva = c.tipo === "pais" || c.tipo === "marcador" ? 0.05 : 0.035;
    anterior = alvo;
    return { alvo, voo, deriva };
  });
}
function caminhoBounds(id) {
  const geo = topojson.feature(window.MUNDO, window.MUNDO.objects.countries).features.find((f) => f.id === id);
  const b = caminho.bounds(geo);
  return [b[1][0] - b[0][0], b[1][1] - b[0][1]];
}
function vistaDerivada(i, t) {
  const c = cameras[i], s = T.cenas[i];
  const u = clamp((t - (s.inicio + c.voo)) / Math.max(s.fim - s.inicio - c.voo, 0.01));
  const [x, y, w] = c.alvo;
  return [x, y, w / (1 + c.deriva * easeInOut(u))];
}
function vistaEm(t) {
  const i = cenaEm(t), s = T.cenas[i], c = cameras[i];
  if (t < s.inicio + c.voo) {
    const de = i === 0 ? c.alvo : vistaDerivada(i - 1, s.inicio);
    const u = easeInOut(prog(t, s.inicio, c.voo));
    return d3.interpolateZoom(de, c.alvo)(u);
  }
  return vistaDerivada(i, t);
}
function cenaEm(t) {
  for (let i = 0; i < T.cenas.length; i++) if (t < T.cenas[i].fim) return i;
  return T.cenas.length - 1;
}

// ---------- mapa ----------
function corPais(t, i) {
  const s = T.cenas[i], r = s.eventos[0];
  if (t < r) return null;
  const tipo = R.cenas[i].tipo;
  const base = tipo === "marcador" ? COR.laranja : COR.amarelo;
  let cor = mistura(COR.terra, base, easeOut(prog(t, r, 0.35)));
  if (tipo === "pais" && t >= s.fim) cor = mistura(base, COR.verde, prog(t, s.fim, 0.6));
  // onda de destaque na cena "total"
  const iTotal = R.cenas.findIndex((c) => c.tipo === "total");
  if (tipo === "pais" && iTotal >= 0) {
    const k = ordemPaises.findIndex((x) => x.i === i);
    const tk = T.cenas[iTotal].inicio + 1.4 + k * 0.12;
    const brilho = clamp(1 - Math.abs(t - tk) / 0.3);
    if (brilho > 0) cor = mistura(COR.verde, COR.amarelo, brilho);
  }
  return cor;
}

function desenharMapa(t, vista) {
  const z = W / vista[2];
  const g = ctx.createRadialGradient(W / 2, H * 0.45, 100, W / 2, H / 2, W * 0.75);
  g.addColorStop(0, COR.oceanoA); g.addColorStop(1, COR.oceanoB);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  ctx.setTransform(z, 0, 0, z, W / 2 - vista[0] * z, H / 2 - vista[1] * z);
  ctx.fillStyle = "rgba(40,90,150,0.10)"; ctx.fill(esfera);
  ctx.strokeStyle = "rgba(255,255,255,0.045)"; ctx.lineWidth = 1 / z; ctx.stroke(grade);

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = 22; ctx.shadowOffsetY = 6;
  ctx.fillStyle = COR.terra; ctx.fill(terraToda);
  ctx.restore();
  ctx.strokeStyle = COR.borda; ctx.lineWidth = 1.1 / z; ctx.stroke(terraToda);

  const atual = cenaEm(t);
  R.cenas.forEach((c, i) => {
    if ((c.tipo !== "pais" && c.tipo !== "marcador") || !pathsPorId[c.id]) return;
    const cor = corPais(t, i); if (!cor) return;
    const p = pathsPorId[c.id];
    const emFoco = i === atual;
    if (emFoco) { ctx.save(); ctx.shadowColor = c.tipo === "marcador" ? COR.laranja : COR.amarelo; ctx.shadowBlur = 35; }
    ctx.fillStyle = cor; ctx.fill(p);
    if (emFoco) ctx.restore();
    ctx.strokeStyle = emFoco ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.35)";
    ctx.lineWidth = (emFoco ? 2.4 : 1.2) / z; ctx.stroke(p);
  });
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // anel de impacto e marcador para países muito pequenos na tela
  R.cenas.forEach((c, i) => {
    if ((c.tipo !== "pais" && c.tipo !== "marcador") || !centros[c.id]) return;
    const s = T.cenas[i], r = s.eventos[0];
    if (t < r) return;
    const [mx, my] = centros[c.id];
    const sx = (mx - vista[0]) * z + W / 2, sy = (my - vista[1]) * z + H / 2;
    const cor = c.tipo === "marcador" ? COR.laranja : COR.amarelo;
    const u = prog(t, r, 1.0);
    if (u < 1 && i === atual) {
      ctx.strokeStyle = cor; ctx.globalAlpha = 1 - u; ctx.lineWidth = 8 * (1 - u) + 1;
      ctx.beginPath(); ctx.arc(sx, sy, 30 + 300 * easeOut(u), 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
    }
    if (i !== atual && tamanhos[c.id] * z < 30) {
      // país minúsculo fora de foco: um ponto para ele continuar visível no mapa
      ctx.fillStyle = corPais(t, i); ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(sx, sy, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    if (i === atual && tamanhos[c.id] * z < 70) {
      const pulso = 1 + 0.08 * Math.sin((t - r) * 7);
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 5; ctx.globalAlpha = easeOut(prog(t, r, 0.3));
      ctx.beginPath(); ctx.arc(sx, sy, (Math.max(tamanhos[c.id] * z * 0.7, 34)) * pulso, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = cor; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(sx, sy, (Math.max(tamanhos[c.id] * z * 0.7, 34) + 10) * pulso, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
  });

  // vinheta
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, W * 0.72);
  v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}

// ---------- interface ----------
function escurecer(a) { if (a > 0) { ctx.fillStyle = `rgba(3,8,18,${a})`; ctx.fillRect(0, 0, W, H); } }

function intro(t, s) {
  const saida = 1 - prog(t, s.fim - 0.6, 0.6);
  escurecer(0.55 * saida);
  const [e1, e2, e3] = s.eventos;
  const y1 = H * 0.36;
  comEscala(W / 2, y1 - 50, 0.6 + 0.4 * easeOutBack(prog(t, e1, 0.5)), prog(t, e1, 0.25) * saida, () =>
    texto(R.titulo[0], W / 2, y1, { fonte: "150px Anton", espaco: "2px" }));
  comEscala(W / 2, y1 + 120, 0.6 + 0.4 * easeOutBack(prog(t, e2, 0.5)), prog(t, e2, 0.25) * saida, () =>
    texto(R.titulo[1], W / 2, y1 + 175, { fonte: "150px Anton", cor: COR.amarelo, espaco: "2px" }));
  const ys = y1 + 300;
  const balanco = Math.sin((t - e3) * 3) * 0.02;
  comEscala(W / 2, ys, easeOutBack(prog(t, e3, 0.5)), prog(t, e3, 0.2) * saida, () => {
    const lw = largura(R.selo, "900 50px Montserrat", "4px") + 90;
    ctx.save(); ctx.translate(W / 2, ys); ctx.rotate(balanco - 0.02); ctx.translate(-W / 2, -ys);
    ctx.fillStyle = COR.amarelo; ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 25;
    ctx.beginPath(); ctx.roundRect(W / 2 - lw / 2, ys - 46, lw, 92, 46); ctx.fill(); ctx.shadowBlur = 0;
    texto(R.selo, W / 2, ys + 2, { fonte: "900 50px Montserrat", cor: "#0a1628", base: "middle", espaco: "4px", sombra: false });
    ctx.restore();
  });
}

function revelados(t) { return ordemPaises.filter((x) => t >= T.cenas[x.i].eventos[0]); }

function cabecalho(t, alpha) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha;
  const f = "800 27px Montserrat", txt = R.cabecalho;
  const lw = largura(txt, f, "2px") + 70;
  painel(W / 2 - lw / 2, 34, lw, 62, 31);
  texto(txt, W / 2, 66, { fonte: f, base: "middle", espaco: "2px", sombra: false });
  ctx.restore();
}

function contador(t, alpha, extra) {
  if (alpha <= 0) return;
  const lista = revelados(t);
  const n = lista.length;
  const ultimo = n ? T.cenas[lista[n - 1].i].eventos[0] : -9;
  const u = prog(t, ultimo, 0.45);
  const pop = u < 1 ? 1 + 0.3 * Math.sin(Math.PI * u) : 1;
  ctx.save(); ctx.globalAlpha = alpha;
  painel(50, 34, 230, 190, 26);
  comEscala(165, 120, pop, 1, () =>
    texto(String(n), 165, 160, { fonte: "128px Anton", cor: COR.amarelo }));
  texto(R.contadorRotulo, 165, 202, { fonte: "800 26px Montserrat", espaco: "4px", sombra: false });
  if (extra) {
    const v = easeOutBack(prog(t, extra, 0.45));
    comEscala(165, 262, v, prog(t, extra, 0.2), () => {
      ctx.fillStyle = COR.laranja; ctx.beginPath(); ctx.roundRect(60, 238, 210, 50, 25); ctx.fill();
      texto("+1 REGIÃO", 165, 264, { fonte: "900 25px Montserrat", cor: "#1b1205", base: "middle", espaco: "2px", sombra: false });
    });
  }
  ctx.restore();
}

function colecao(t, alpha) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha;
  const bw = 78, bh = 58, gap = 16, x = W - 50 - bw;
  const total = ordemPaises.length;
  const y0 = (H - (total * bh + (total - 1) * gap)) / 2 + 40;
  ordemPaises.forEach((p, k) => {
    const y = y0 + k * (bh + gap);
    const r = T.cenas[p.i].eventos[0];
    ctx.fillStyle = "rgba(6,14,27,0.65)"; ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(x, y, bw, bh, 9); ctx.fill(); ctx.stroke();
    if (t >= r + 0.35) {
      const v = easeOutBack(prog(t, r + 0.35, 0.45));
      comEscala(x + bw / 2, y + bh / 2, v, 1, () => bandeira(p.c.bandeira, x, y, bw, bh, 8));
    } else {
      texto("?", x + bw / 2, y + bh / 2 + 2, { fonte: "34px Anton", cor: "rgba(255,255,255,0.3)", base: "middle", sombra: false });
    }
  });
  ctx.restore();
}

function cartao(t, c, s, numero) {
  const r = s.eventos[0] + 0.1;
  if (t < r) return;
  const entra = easeOutBack(prog(t, r, 0.5));
  const sai = easeInOut(prog(t, s.fim - 0.4, 0.4));
  const dx = (1 - entra) * -900 + sai * -900;
  const fNome = "86px Anton", fInfo = "600 33px Montserrat", fCont = "800 25px Montserrat";
  const sub = numero ? `${c.continente}  •  Nº ${numero}` : c.continente;
  const wTexto = Math.max(largura(c.nome, fNome, "1px"), largura(c.info, fInfo), largura(sub, fCont, "3px"));
  const fw = 184, fh = 138, pad = 34;
  const w = pad + fw + 36 + wTexto + pad + 10, h = fh + pad * 2;
  const x = 60 + dx, y = H - 60 - h;
  ctx.save(); ctx.globalAlpha = 1 - sai;
  painel(x, y, w, h, 26);
  ctx.fillStyle = c.tipo === "marcador" ? COR.laranja : COR.amarelo;
  ctx.beginPath(); ctx.roundRect(x, y + 24, 8, h - 48, 4); ctx.fill();
  bandeira(c.bandeira, x + pad, y + pad, fw, fh, 12);
  const tx = x + pad + fw + 36;
  texto(sub, tx, y + pad + 22, { fonte: fCont, cor: c.tipo === "marcador" ? COR.laranja : COR.amarelo, alinhar: "left", espaco: "3px", sombra: false });
  texto(c.nome, tx, y + pad + 108, { fonte: fNome, alinhar: "left", espaco: "1px", sombra: false });
  texto(c.info, tx, y + pad + 148, { fonte: fInfo, cor: COR.textoSuave, alinhar: "left", sombra: false });
  ctx.restore();
}

function total(t, c, s) {
  const sai = 1 - prog(t, s.fim - 0.45, 0.45);
  const n = c.estatisticas.length, cw = 360, ch = 200, gap = 40;
  const x0 = W / 2 - (n * cw + (n - 1) * gap) / 2;
  c.estatisticas.forEach(([num, rot], k) => {
    const e = s.eventos[k];
    const cx = x0 + k * (cw + gap) + cw / 2, cy = H - 50 - ch / 2;
    comEscala(cx, cy, easeOutBack(prog(t, e, 0.5)), prog(t, e, 0.2) * sai, () => {
      painel(cx - cw / 2, cy - ch / 2, cw, ch, 28);
      texto(num, cx, cy + 30, { fonte: num.length > 4 ? "86px Anton" : "112px Anton", cor: COR.amarelo, sombra: false });
      texto(rot, cx, cy + 76, { fonte: "800 28px Montserrat", espaco: "4px", sombra: false });
    });
  });
}

function barra(t, c, s) {
  const [ePainel, eBarra, eDestaque] = s.eventos;
  const sai = 1 - prog(t, s.fim - 0.45, 0.45);
  escurecer(0.72 * easeOut(prog(t, s.inicio, 0.5)) * (0.3 + 0.7 * sai));
  const pw = 1400, ph = 640, px = W / 2 - pw / 2, py = H / 2 - ph / 2;
  comEscala(W / 2, H / 2, 0.85 + 0.15 * easeOutBack(prog(t, ePainel, 0.5)), prog(t, ePainel, 0.25) * sai, () => {
    painel(px, py, pw, ph, 34);
    texto(c.titulo, W / 2, py + 92, { fonte: "800 42px Montserrat", espaco: "3px", sombra: false });
    // barra
    const bx = W / 2 - 600, by = py + 170, bw = 1200, bh = 96;
    const u = easeOut(prog(t, eBarra, 1.5));
    ctx.fillStyle = "rgba(255,255,255,0.07)"; ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 18); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 18); ctx.clip();
    ctx.fillStyle = COR.cinzaAzul; ctx.globalAlpha = u; ctx.fillRect(bx + bw * c.valor, by, bw * (1 - c.valor), bh); ctx.globalAlpha = 1;
    ctx.fillStyle = COR.verde; ctx.fillRect(bx, by, bw * c.valor * u, bh);
    ctx.restore();
    if (u > 0.05) {
      ctx.save(); ctx.globalAlpha = clamp(u * 2);
      bandeira("br", bx + 24, by + 20, 75, 56, 7);
      texto(`${Math.round(c.valor * 100 * u)}%`, bx + 120, by + bh / 2 + 4, { fonte: "62px Anton", alinhar: "left", base: "middle", sombra: false });
      texto(`${Math.round((1 - c.valor) * 100 * u)}%`, bx + bw - 26, by + bh / 2 + 4, { fonte: "50px Anton", alinhar: "right", base: "middle", sombra: false });
      texto(c.rotuloA, bx, by + bh + 46, { fonte: "800 28px Montserrat", cor: COR.verde, alinhar: "left", espaco: "3px", sombra: false });
      texto(c.rotuloB, bx + bw, by + bh + 46, { fonte: "800 28px Montserrat", cor: COR.textoSuave, alinhar: "right", espaco: "3px", sombra: false });
      ctx.restore();
    }
    comEscala(W / 2, py + 470, easeOutBack(prog(t, eDestaque, 0.5)), prog(t, eDestaque, 0.2), () => {
      texto(c.destaque, W / 2, py + 500, { fonte: "150px Anton", cor: COR.amarelo, espaco: "2px", sombra: false });
      texto(c.legenda, W / 2, py + 576, { fonte: "800 44px Montserrat", espaco: "5px", sombra: false });
    });
  });
}

function outro(t, c, s) {
  const [eTexto, eBotao] = s.eventos;
  escurecer(0.55 * easeOut(prog(t, s.inicio, 0.6)));
  const y1 = H * 0.36;
  comEscala(W / 2, y1, 0.6 + 0.4 * easeOutBack(prog(t, eTexto, 0.5)), prog(t, eTexto, 0.25), () => {
    texto(c.texto[0], W / 2, y1, { fonte: "140px Anton", espaco: "2px" });
    texto(c.texto[1], W / 2, y1 + 160, { fonte: "140px Anton", cor: COR.amarelo, espaco: "2px" });
  });
  const yb = H * 0.72;
  const pulso = 1 + 0.04 * Math.sin((t - eBotao) * 6);
  comEscala(W / 2, yb, easeOutBack(prog(t, eBotao, 0.5)) * pulso, prog(t, eBotao, 0.2), () => {
    const bw = 620, bh = 130;
    ctx.save(); ctx.shadowColor = "rgba(230,33,23,0.6)"; ctx.shadowBlur = 40;
    ctx.fillStyle = COR.vermelho; ctx.beginPath(); ctx.roundRect(W / 2 - bw / 2, yb - bh / 2, bw, bh, 26); ctx.fill(); ctx.restore();
    texto(c.botao, W / 2, yb + 3, { fonte: "900 60px Montserrat", base: "middle", espaco: "4px", sombra: false });
  });
  const fade = prog(t, s.fim - 0.8, 0.8);
  if (fade > 0) { ctx.fillStyle = `rgba(0,0,0,${fade})`; ctx.fillRect(0, 0, W, H); }
}

// ---------- quadro ----------
window.desenhar = function (t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  desenharMapa(t, vistaEm(t));

  const i = cenaEm(t), c = R.cenas[i], s = T.cenas[i];
  const primeiro = ordemPaises.length ? T.cenas[ordemPaises[0].i].inicio : Infinity;
  const iBarra = R.cenas.findIndex((x) => x.tipo === "barra");
  const fimHud = iBarra >= 0 ? T.cenas[iBarra].inicio + 0.4 : T.duracao;
  const hud = prog(t, primeiro, 0.5) * (1 - prog(t, fimHud - 0.4, 0.4));
  const iMarc = R.cenas.findIndex((x) => x.tipo === "marcador");
  const extra = iMarc >= 0 && t >= T.cenas[iMarc].eventos[0] ? T.cenas[iMarc].eventos[0] + 0.3 : null;

  if (c.tipo === "intro") intro(t, s);
  if (c.tipo === "pais") cartao(t, c, s, ordemPaises.findIndex((x) => x.i === i) + 1);
  if (c.tipo === "marcador") cartao(t, c, s, null);
  if (c.tipo === "total") total(t, c, s);
  cabecalho(t, hud);
  contador(t, hud, extra);
  colecao(t, hud);
  if (c.tipo === "barra") barra(t, c, s);
  if (c.tipo === "outro") outro(t, c, s);
};
