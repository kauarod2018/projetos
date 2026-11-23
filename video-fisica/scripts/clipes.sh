#!/usr/bin/env bash
# FFmpeg: prepara os clipes que o Remotion vai montar.
#  - Blender: PNG transparente -> sobre estrelas -> 1080p -> interpolação de movimento até 30 fps
#  - Manim: copia os MP4 renderizados
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p public/clipes build
[ -f build/estrelas.png ] || python3 scripts/estrelas.py build/estrelas.png
for par in terra_lua:10:terra_lua canhao:15:canhao orbita:12:orbita_3d; do
  IFS=: read -r nome fps saida <<< "$par"
  ffmpeg -y -v error -framerate "$fps" -i "build/blender/$nome/q_%04d.png" -loop 1 -i build/estrelas.png \
    -filter_complex "[0]scale=1920:1080:flags=lanczos,format=rgba[f];[1][f]overlay=shortest=1,format=yuv420p,minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1" \
    -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p "public/clipes/$saida.mp4"
  echo "clipe $saida: $(ffprobe -v error -show_entries format=duration -of csv=p=0 public/clipes/$saida.mp4)s"
done
cp build/manim/videos/cenas/1080p30/*.mp4 public/clipes/
