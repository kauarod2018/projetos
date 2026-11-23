#!/usr/bin/env bash
# Pipeline completo: narração -> Blender -> Manim -> FFmpeg (clipes) -> trilha -> Remotion -> FFmpeg (final)
set -euo pipefail
cd "$(dirname "$0")"
[ -d node_modules ] || npm install
echo "1/7 narração (Piper)";        python3 scripts/narracao.py 2>&1 | grep -v WARNING
echo "2/7 textura da Terra";        [ -f blender/terra.png ] || node blender/textura_terra.js
echo "3/7 cenas 3D (Blender)";      ./scripts/render_blender.sh
echo "4/7 cenas de física (Manim)"; manim -r 1920,1080 --fps 30 --media_dir build/manim manim/cenas.py Curvatura QuedaLivre Orbita Lua
echo "5/7 clipes (FFmpeg)";         ./scripts/clipes.sh
echo "6/7 trilha";                  python3 scripts/trilha.py
echo "7/7 edição (Remotion) + montagem final (FFmpeg)"
npx remotion render src/index.ts LuaNaoCai build/video_mudo.mp4 --log=error
mkdir -p saida
ffmpeg -y -v error -i build/video_mudo.mp4 -i build/audio.wav -map 0:v -map 1:a -c:v copy \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 -c:a aac -b:a 192k -shortest -movflags +faststart saida/lua-nao-cai.mp4
echo "pronto: saida/lua-nao-cai.mp4"
