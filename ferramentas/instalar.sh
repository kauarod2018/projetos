#!/usr/bin/env bash
# Instala tudo o que o kit de vídeo precisa. Pode rodar quantas vezes quiser (só instala o que falta).
#
# Uso: bash ferramentas/instalar.sh
# Precisa de: Python 3.10+, Node.js 20+ e ffmpeg no sistema.
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
cd "$RAIZ"

for prog in python3 node npm ffmpeg ffprobe; do
  command -v "$prog" >/dev/null || { echo "Falta instalar: $prog" >&2; exit 1; }
done

# 1) Ferramentas Python (transcrição, olho, narração, referências)
[[ -d .venv ]] || python3 -m venv .venv
.venv/bin/pip install -q --disable-pip-version-check -r requirements.txt

# 2) Projeto de vídeo (Remotion, React, three.js)
(cd video && npm ci --no-audit --no-fund --loglevel=error)

# 3) Voz em português para a narração (63 MB, baixada uma vez)
if [[ ! -f .cache/vozes/pt_BR-faber-medium.onnx ]]; then
  mkdir -p .cache/vozes
  .venv/bin/python -I -m piper.download_voices --download-dir .cache/vozes pt_BR-faber-medium
fi

echo "Kit de vídeo pronto. (O modelo do Whisper é baixado na primeira transcrição.)"
