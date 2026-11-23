#!/usr/bin/env bash
# FFmpeg: prepara os clipes que o Remotion vai montar.
#  - Blender: PNG transparente (720p) sobre estrelas -> interpolação de movimento até 30 fps -> 1080p
#  - Manim: copia os MP4 renderizados
# Uso: ./scripts/clipes.sh [terra_lua canhao orbita]   (sem argumentos faz todos)
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p public/clipes build
[ -f build/estrelas.png ] || python3 scripts/estrelas.py build/estrelas.png
declare -A FPS=([terra_lua]=10 [canhao]=15 [orbita]=12)
declare -A SAIDA=([terra_lua]=terra_lua [canhao]=canhao [orbita]=orbita_3d)
processar() {
  local nome=$1 saida=${SAIDA[$1]}
  # minterpolate usa um núcleo só, então os clipes rodam em paralelo
  ffmpeg -y -v error -framerate "${FPS[$nome]}" -i "build/blender/$nome/q_%04d.png" -loop 1 -i build/estrelas.png \
    -filter_complex "[1]scale=1280:720[e];[e][0]overlay=shortest=1,format=yuv420p,minterpolate=fps=30:mi_mode=mci:mc_mode=obmc:me_mode=bidir:vsbmc=1,scale=1920:1080:flags=lanczos" \
    -c:v libx264 -crf 16 -preset medium -pix_fmt yuv420p "public/clipes/$saida.mp4"
  echo "clipe $saida: $(ffprobe -v error -show_entries format=duration -of csv=p=0 public/clipes/$saida.mp4)s"
}
LISTA=("$@"); [ ${#LISTA[@]} -eq 0 ] && LISTA=(terra_lua canhao orbita)
for n in "${LISTA[@]}"; do processar "$n" & done
wait
cp build/manim/videos/cenas/1080p30/*.mp4 public/clipes/
