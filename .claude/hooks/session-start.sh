#!/bin/bash
# Instala as ferramentas de vídeo/áudio e as dependências do kit-mente-ativa nas sessões do Claude Code na nuvem.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

PIPER_DIR=/opt/piper
PIPER_BIN="$PIPER_DIR/piper/piper"
PIPER_VOZ="$PIPER_DIR/vozes/pt-br-edresson-low.onnx"

# Piper (voz offline) + voz pt-BR, baixados do GitHub releases.
if [ ! -x "$PIPER_BIN" ]; then
  mkdir -p "$PIPER_DIR"
  curl -fsSL https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_linux_x86_64.tar.gz | tar -xz -C "$PIPER_DIR"
fi
if [ ! -f "$PIPER_VOZ" ]; then
  mkdir -p "$PIPER_DIR/vozes"
  curl -fsSL https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-pt-br-edresson-low.tar.gz | tar -xz -C "$PIPER_DIR/vozes"
fi

# edge-tts (vozes neurais da Microsoft; precisa do domínio speech.platform.bing.com liberado na rede).
if ! command -v edge-tts >/dev/null 2>&1; then
  pip install --quiet edge-tts || echo "aviso: não foi possível instalar o edge-tts" >&2
fi

# Kokoro (voz feminina pt-BR "pf_dora", usada na narração do anúncio UGC); modelo baixado do GitHub releases.
KOKORO_DIR=/opt/kokoro
python3 -c "import kokoro_onnx, soundfile" 2>/dev/null || pip install --quiet kokoro-onnx soundfile
mkdir -p "$KOKORO_DIR"
for arq in kokoro-v1.0.onnx voices-v1.0.bin; do
  [ -f "$KOKORO_DIR/$arq" ] || curl -fsSL -o "$KOKORO_DIR/$arq" "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/$arq"
done

# Dependências npm do kit (Playwright usa o Chromium já instalado no ambiente).
cd "$CLAUDE_PROJECT_DIR/kit-mente-ativa"
npm install --no-audit --no-fund

if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  {
    echo "export PIPER_BIN=\"$PIPER_BIN\""
    echo "export PIPER_VOZ=\"$PIPER_VOZ\""
    echo "export PATH=\"$PIPER_DIR/piper:\$PATH\""
  } >> "$CLAUDE_ENV_FILE"
fi
