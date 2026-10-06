import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { copyFileSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "entregas");
const excludedDirectories = new Set([
  "node_modules", ".next", ".git", ".cache", ".npm", ".claude", ".codex",
  ".openai", "coverage", "dist", "entregas", "outputs", "backups", "backup",
  "playwright-report", "test-results",
]);
const excludedFile = /(?:\.log$|\.tsbuildinfo$|\.tar(?:\.gz)?$|\.tgz$|\.zip$|\.sql\.gz$|\.sqlite(?:3)?$|\.db$|\.pem$|\.key$|\.p12$|\.pfx$|\.bak$|\.swp$|^\.npmrc$|^\.DS_Store$|^Thumbs\.db$)/i;

function collect(directory, prefix = "") {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (excludedDirectories.has(entry.name)) continue;
    if (entry.name.startsWith(".env") && entry.name !== ".env.example") continue;
    if (excludedFile.test(entry.name)) continue;
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) throw new Error(`Link simbolico nao permitido: ${relative}`);
    if (entry.isDirectory()) files.push(...collect(path.join(directory, entry.name), relative));
    else if (entry.isFile()) files.push(relative);
    else throw new Error(`Arquivo especial nao permitido: ${relative}`);
  }
  return files.sort();
}

function sha256(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

const files = collect(root);
for (const required of ["package.json", "package-lock.json", "next.config.ts", ".env.example", "database/schema.sql"]) {
  assert.ok(files.includes(required), `Arquivo obrigatorio ausente: ${required}`);
}
for (const directory of ["app/", "components/", "lib/", "public/", "vendor/", "scripts/"]) {
  assert.ok(files.some(file => file.startsWith(directory)), `Diretorio obrigatorio ausente: ${directory}`);
}
const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
assert.ok(pkg.scripts?.build && pkg.scripts?.start, "Comandos build/start ausentes.");
if (existsSync(output)) {
  const info = lstatSync(output);
  assert.ok(info.isDirectory() && !info.isSymbolicLink(), "entregas deve ser uma pasta local normal.");
} else mkdirSync(output);

const parts = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
}).formatToParts(new Date());
const stamp = Object.fromEntries(parts.map(part => [part.type, part.value]));
const name = `Vemo-Hostinger-${stamp.year}-${stamp.month}-${stamp.day}-${stamp.hour}${stamp.minute}${stamp.second}-${randomBytes(4).toString("hex")}`;
const archive = path.join(output, `${name}.tar.gz`);
assert.ok(!existsSync(archive), "O destino ja existe; nada sera sobrescrito.");
const stage = mkdtempSync(path.join(tmpdir(), "vemo-hostinger-stage-"));

try {
  const manifest = files.map(file => ({ path: file, sha256: sha256(path.join(root, file)) }));
  for (const file of files) {
    const target = path.join(stage, file);
    mkdirSync(path.dirname(target), { recursive: true });
    copyFileSync(path.join(root, file), target);
  }
  for (const item of manifest) {
    assert.equal(sha256(path.join(stage, item.path)), item.sha256, `Arquivo alterado durante copia: ${item.path}`);
  }
  // Use an argument array: archive paths never become shell commands.
  execFileSync("tar", ["-czf", archive, "-C", stage, "."], { windowsHide: true, stdio: "pipe" });
  const listing = execFileSync("tar", ["-tzf", archive], { windowsHide: true, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  const entries = listing.split(/\r?\n/).filter(Boolean).map(entry => entry.replace(/^\.\//, "")).filter(Boolean);
  assert.ok(entries.every(entry => !entry.startsWith("/") && !entry.split("/").includes("..") && !entry.includes("\\") && !/^[A-Za-z]:/.test(entry)), "Caminho inseguro dentro do pacote.");
  assert.deepEqual(entries.filter(entry => entry !== "." && !entry.endsWith("/")).sort(), files, "Conteudo do tar.gz difere do manifesto.");
  const archiveHash = sha256(archive);
  writeFileSync(path.join(output, `${name}.sha256`), `${archiveHash}  ${name}.tar.gz\n`, { flag: "wx" });
  writeFileSync(path.join(output, `${name}.manifesto.json`), JSON.stringify({ archive: `${name}.tar.gz`, sha256: archiveHash, files: manifest }, null, 2) + "\n", { flag: "wx" });
  writeFileSync(path.join(output, `${name}.LEIA-ME.md`), [
    "# Entrega Vemo para Hostinger", "",
    `Pacote: ${name}.tar.gz`, `Arquivos incluidos: ${files.length}`, `SHA-256: ${archiveHash}`, "",
    "Atualize a mesma aplicacao Node.js/Next.js, preservando banco e variaveis privadas.",
    "package.json esta na raiz interna. Use Node compativel com package.json e os comandos npm ci, npm run build e npm start conforme a configuracao da aplicacao.", "",
    "Leia INSTRUCOES-ENTREGA-HOSTINGER.md no projeto e o guia de mudancas da versao.",
    "Este empacotamento nao executou testes, nao publicou o site e nao acessou o banco.",
    "O tar.gz nao aplica SQL. Confira backup, esquema e migracoes pendentes separadamente.",
    "Nao importe schema.sql sobre um banco existente nem ative SaaS sem homologacao.",
    "Revise segredos: filtros de nome nao detectam credenciais dentro do codigo.", "",
  ].join("\n"), { flag: "wx" });
  console.log(`Pacote conferido: ${archive}`);
  console.log(`Arquivos: ${files.length}. Manifesto, checksum e guia em ${output}`);
} finally {
  assert.equal(path.dirname(stage), path.resolve(tmpdir()));
  assert.ok(path.basename(stage).startsWith("vemo-hostinger-stage-"));
  rmSync(stage, { recursive: true, force: true });
}
