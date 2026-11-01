#!/usr/bin/env bash
# Instala as ferramentas de edição de vídeo usadas pelo Claude (só CPU, sem GPU).
set -euo pipefail
DIR="${VIDEOTOOLS_DIR:-/opt/videotools}"
HERE="$(cd "$(dirname "$0")" && pwd)"

mkdir -p "$DIR"
python3 -m venv "$DIR/venv"
"$DIR/venv/bin/pip" install -q --upgrade pip
"$DIR/venv/bin/pip" install -q \
  librosa soundfile \
  auto-editor \
  scenedetect opencv-python-headless \
  faster-whisper \
  colour-science opentimelineio moviepy

# Remotion (motion graphics em React)
(cd "$HERE/remotion" && npm install --silent)

echo "Pronto. Python: $DIR/venv/bin/python"
echo "Remotion: cd $HERE/remotion && npx remotion render src/index.ts <Composicao> saida.mp4 \\"
echo "  --browser-executable=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell"
