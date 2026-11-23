// Renderiza os quadros no Chromium (Playwright) e codifica com ffmpeg.
// Uso:
//   node engine/render.js roteiros/lusofonia.json                 -> build/<slug>/video_mudo.mp4
//   node engine/render.js roteiros/lusofonia.json --previa 3,12.5 -> PNGs de conferência
"use strict";
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { chromium } = require("playwright");

const RAIZ = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const roteiro = JSON.parse(fs.readFileSync(path.resolve(args[0]), "utf8"));
const build = path.join(RAIZ, "build", roteiro.slug);
const timeline = JSON.parse(fs.readFileSync(path.join(build, "timeline.json"), "utf8"));
const iPrevia = args.indexOf("--previa");
const previa = iPrevia >= 0 ? args[iPrevia + 1].split(",").map(Number) : null;
const TRABALHADORES = Number(process.env.TRABALHADORES || 4);

const mundo = fs.readFileSync(path.join(RAIZ, "node_modules/world-atlas/countries-50m.json"), "utf8");
const dadosJs = path.join(build, "dados.js");
fs.writeFileSync(dadosJs,
  `window.MUNDO=${mundo};\nwindow.ROTEIRO=${JSON.stringify(roteiro)};\nwindow.TIMELINE=${JSON.stringify(timeline)};\n`);

async function abrirPagina(navegador) {
  const pagina = await navegador.newPage({ viewport: { width: timeline.largura, height: timeline.altura }, deviceScaleFactor: 1 });
  pagina.on("pageerror", (e) => console.error("erro na página:", e.message));
  await pagina.goto("file://" + path.join(RAIZ, "engine/pagina.html"));
  await pagina.addScriptTag({ path: dadosJs });
  await pagina.evaluate(() => window.iniciar());
  return pagina;
}

async function quadro(pagina, t, tipo = "jpeg") {
  await pagina.evaluate((tt) => window.desenhar(tt), t);
  return pagina.locator("#tela").screenshot(tipo === "jpeg" ? { type: "jpeg", quality: 94 } : { type: "png" });
}

async function renderizarTrecho(navegador, de, ate, saida, idTrab) {
  const pagina = await abrirPagina(navegador);
  const ff = spawn("ffmpeg", ["-y", "-v", "error", "-f", "image2pipe", "-framerate", String(timeline.fps), "-c:v", "mjpeg", "-i", "-",
    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-r", String(timeline.fps), saida], { stdio: ["pipe", "inherit", "inherit"] });
  const fim = new Promise((ok, erro) => ff.on("close", (c) => (c === 0 ? ok() : erro(new Error("ffmpeg saiu com " + c)))));
  for (let f = de; f < ate; f++) {
    const buf = await quadro(pagina, f / timeline.fps);
    if (!ff.stdin.write(buf)) await new Promise((ok) => ff.stdin.once("drain", ok));
    if ((f - de) % 300 === 0) console.log(`  [trabalhador ${idTrab}] quadro ${f - de}/${ate - de}`);
  }
  ff.stdin.end();
  await fim;
  await pagina.close();
}

(async () => {
  const navegador = await chromium.launch();
  try {
    if (previa) {
      const pagina = await abrirPagina(navegador);
      const pasta = path.join(build, "previa");
      fs.mkdirSync(pasta, { recursive: true });
      for (const t of previa) {
        const arq = path.join(pasta, `t${t.toFixed(2)}.png`);
        fs.writeFileSync(arq, await quadro(pagina, t, "png"));
        console.log(arq);
      }
      return;
    }
    const total = Math.ceil(timeline.duracao * timeline.fps);
    const porTrab = Math.ceil(total / TRABALHADORES);
    const partes = [];
    const inicio = Date.now();
    await Promise.all(Array.from({ length: TRABALHADORES }, (_, k) => {
      const de = k * porTrab, ate = Math.min(total, de + porTrab);
      const saida = path.join(build, `parte${k}.mp4`);
      partes.push(saida);
      return renderizarTrecho(navegador, de, ate, saida, k);
    }));
    const lista = path.join(build, "partes.txt");
    fs.writeFileSync(lista, partes.map((p) => `file '${p}'`).join("\n"));
    await new Promise((ok, erro) => spawn("ffmpeg", ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", lista, "-c", "copy",
      path.join(build, "video_mudo.mp4")], { stdio: "inherit" }).on("close", (c) => (c === 0 ? ok() : erro(new Error("concat falhou")))));
    partes.forEach((p) => fs.unlinkSync(p));
    console.log(`${total} quadros em ${((Date.now() - inicio) / 1000).toFixed(0)}s -> ${path.join(build, "video_mudo.mp4")}`);
  } finally {
    await navegador.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
