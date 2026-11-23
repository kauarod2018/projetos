import { Config } from "@remotion/cli/config";
import { existsSync } from "node:fs";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// O 3D (three.js) precisa de WebGL na renderização sem tela.
Config.setChromiumOpenGlRenderer("angle");

// Na nuvem do Claude Code o download do navegador do Remotion é bloqueado,
// então usamos o Chromium que já vem instalado. No seu computador isso é ignorado.
const chromeDaNuvem = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const chrome = process.env.REMOTION_CHROME ?? (existsSync(chromeDaNuvem) ? chromeDaNuvem : null);
if (chrome) {
  Config.setBrowserExecutable(chrome);
}
