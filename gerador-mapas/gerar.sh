#!/usr/bin/env bash
# Gera um vídeo completo a partir de um roteiro.
# Uso: ./gerar.sh roteiros/lusofonia.json
set -euo pipefail
cd "$(dirname "$0")"
ROTEIRO="${1:?informe o roteiro, ex.: roteiros/lusofonia.json}"
SLUG=$(python3 -c "import json,sys; print(json.load(open(sys.argv[1]))['slug'])" "$ROTEIRO")

# Voz pt-BR do Piper (baixada uma vez)
if [ ! -f vozes/pt-br-edresson-low.onnx ]; then
  mkdir -p vozes
  curl -sSL https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-pt-br-edresson-low.tar.gz | tar xz -C vozes
fi
[ -d node_modules ] || npm install

echo "1/4 narração"; python3 scripts/narracao.py "$ROTEIRO" 2>&1 | grep -v WARNING
echo "2/4 trilha";   python3 scripts/trilha.py "$ROTEIRO"
echo "3/4 imagens";  node engine/render.js "$ROTEIRO"
echo "4/4 montagem"
mkdir -p saida
ffmpeg -y -v error -i "build/$SLUG/video_mudo.mp4" -i "build/$SLUG/audio.wav" -map 0:v -map 1:a -c:v copy \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 -c:a aac -b:a 192k -shortest -movflags +faststart "saida/$SLUG.mp4"
echo "pronto: saida/$SLUG.mp4"
