#!/usr/bin/env bash
# Renderiza as 3 cenas do Blender em sequência (PNG com transparência).
set -euo pipefail
cd "$(dirname "$0")/.."
DUR=$(python3 -c "import json;d=json.load(open('public/duracoes.json'));print(d['terra_lua']+0.5, d['canhao']+0.3, d['orbita_3d']+0.3)")
read TL CA OR <<< "$DUR"
python3 blender/cenas.py terra_lua "$TL" 10 build/blender/terra_lua
python3 blender/cenas.py canhao "$CA" 15 build/blender/canhao
python3 blender/cenas.py orbita "$OR" 12 build/blender/orbita
echo BLENDER_OK
