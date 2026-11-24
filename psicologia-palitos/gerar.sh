#!/usr/bin/env bash
# Gera um vídeo do canal: narração (Piper) -> animação (Manim) -> trilha -> montagem (FFmpeg)
# Uso: ./gerar.sh teste   (roteiro em roteiros/teste.json, cena em cenas/teste.py)
set -euo pipefail
cd "$(dirname "$0")"
NOME="${1:?informe o nome, ex.: teste}"
FORMATO=$(python3 -c "import json,sys;print(json.load(open(sys.argv[1]))['formato'])" "roteiros/$NOME.json")
CLASSE=$(python3 -c "import re,sys;print(re.search(r'class (\w+)\(CenaNarrada\)', open(sys.argv[1]).read()).group(1))" "cenas/$NOME.py")
if [ "$FORMATO" = vertical ]; then RES=1080,1920; else RES=1920,1080; fi
[ -f "build/papel_$FORMATO.png" ] || python3 scripts/papel.py "$FORMATO" "build/papel_$FORMATO.png"
echo "1/4 narração";  python3 scripts/narracao.py "roteiros/$NOME.json" 2>&1 | grep -v WARNING
echo "2/4 animação";  manim -r "$RES" --fps 30 --media_dir build/manim "cenas/$NOME.py" "$CLASSE" 2>&1 | grep -iE "error|Traceback" || true
echo "3/4 trilha";    python3 scripts/trilha.py "$NOME"
echo "4/4 montagem"
mkdir -p saida
VIDEO=$(ls -t build/manim/videos/"$NOME"/*/"$CLASSE".mp4 | head -1)
ffmpeg -y -v error -i "$VIDEO" -i "build/$NOME/audio.wav" -map 0:v -map 1:a -c:v copy \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 -c:a aac -b:a 192k -shortest -movflags +faststart "saida/$NOME.mp4"
echo "pronto: saida/$NOME.mp4"
