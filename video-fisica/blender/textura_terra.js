// Gera a textura equirretangular da Terra (4096x2048) a partir dos contornos reais (Natural Earth / world-atlas).
// Uso: node blender/textura_terra.js  -> blender/terra.png
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const RAIZ = path.resolve(__dirname, "..");
const mundo = fs.readFileSync(path.join(RAIZ, "node_modules/world-atlas/countries-50m.json"), "utf8");
const lib = (p) => fs.readFileSync(path.join(RAIZ, "node_modules", p), "utf8");

const html = `<canvas id="c" width="4096" height="2048"></canvas>
<script>${lib("d3-array/dist/d3-array.min.js")}</script>
<script>${lib("d3-geo/dist/d3-geo.min.js")}</script>
<script>${lib("topojson-client/dist/topojson-client.min.js")}</script>
<script>
const W = 4096, H = 2048, M = ${mundo};
const ctx = document.getElementById("c").getContext("2d");
const proj = d3.geoEquirectangular().scale(W / (2 * Math.PI)).translate([W / 2, H / 2]);
const path = d3.geoPath(proj, ctx);
// oceano: mais escuro no meio, mais claro nas plataformas (aprox. pela latitude)
const g = ctx.createLinearGradient(0, 0, 0, H);
g.addColorStop(0, "#0b2a4a"); g.addColorStop(0.5, "#0a3a6b"); g.addColorStop(1, "#0b2a4a");
ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
const terra = topojson.merge(M, M.objects.countries.geometries);
// sombra costeira (água rasa)
ctx.save(); ctx.strokeStyle = "rgba(40,140,170,0.55)"; ctx.lineWidth = 14; ctx.filter = "blur(10px)";
ctx.beginPath(); path(terra); ctx.stroke(); ctx.restore();
// terra: verde nos trópicos e latitudes médias, bege nas faixas de deserto
ctx.save(); ctx.beginPath(); path(terra); ctx.clip();
const gl = ctx.createLinearGradient(0, 0, 0, H);
const faixas = [[0, "#e8eef2"], [0.12, "#dfe6ea"], [0.17, "#5b6b45"], [0.25, "#3e6b34"], [0.33, "#7a7a4a"],
  [0.36, "#b89a62"], [0.41, "#a48a57"], [0.46, "#3f7a35"], [0.5, "#2f6a2c"], [0.54, "#3d7634"],
  [0.6, "#9b8556"], [0.64, "#b49662"], [0.69, "#5f7a40"], [0.8, "#55693f"], [0.86, "#e6ecf0"], [1, "#f4f7f9"]];
for (const [o, c] of faixas) gl.addColorStop(o, c);
ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
ctx.restore();
// gelo: Groenlândia e Antártida
ctx.fillStyle = "#eef3f6";
for (const id of ["304", "010"]) {
  const geo = M.objects.countries.geometries.filter((x) => x.id === id);
  ctx.beginPath(); path(topojson.merge(M, geo)); ctx.fill();
}
// granulado para dar textura de relevo
const img = ctx.getImageData(0, 0, W, H), d = img.data;
let s = 12345; const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
for (let i = 0; i < d.length; i += 4) { const n = (rnd() - 0.5) * 18; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
ctx.putImageData(img, 0, 0);
window.pronto = true;
</script>`;

(async () => {
  const nav = await chromium.launch();
  const pg = await nav.newPage({ viewport: { width: 4096, height: 2048 } });
  await pg.setContent(html);
  await pg.waitForFunction(() => window.pronto === true, null, { timeout: 120000 });
  const url = await pg.evaluate(() => document.getElementById("c").toDataURL("image/png"));
  fs.writeFileSync(path.join(__dirname, "terra.png"), Buffer.from(url.split(",")[1], "base64"));
  await nav.close();
  console.log("blender/terra.png");
})();
