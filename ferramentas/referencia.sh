#!/usr/bin/env bash
# Baixa a legenda e os dados (título, views, duração, capítulos) de um vídeo do YouTube,
# sem baixar o vídeo, para estudar a estrutura de roteiros que funcionam.
#
# Uso: bash ferramentas/referencia.sh URL_DO_VIDEO [idioma=pt]
# Obs.: na nuvem o YouTube às vezes responde "429 Too Many Requests" (limita servidores).
# Espere alguns minutos e tente de novo; no seu computador isso quase nunca acontece.
# Saída: saida/referencias/<id>/ com info.json, legenda .vtt e roteiro.txt (texto limpo).
set -euo pipefail

URL="${1:?Uso: bash ferramentas/referencia.sh URL [idioma]}"
IDIOMA="${2:-pt}"
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
YTDLP="$RAIZ/.venv/bin/yt-dlp"

ID="$("$YTDLP" --no-update --js-runtimes node --print id --skip-download "$URL" 2>/dev/null)"
PASTA="$RAIZ/saida/referencias/$ID"
mkdir -p "$PASTA"

"$YTDLP" --no-update --js-runtimes node --skip-download --write-info-json --write-subs --write-auto-subs \
  --sub-langs "${IDIOMA}-BR,${IDIOMA}-PT,${IDIOMA}-orig,${IDIOMA}" --sub-format vtt --sleep-subtitles 3 \
  -o "$PASTA/%(id)s.%(ext)s" "$URL" || echo "(aviso: parte dos downloads falhou; seguindo com o que veio)" >&2

VTT="$(ls "$PASTA"/*.vtt 2>/dev/null | head -1 || true)"
if [[ -z "$VTT" ]]; then
  echo "Sem legenda em '$IDIOMA' para este vídeo. Os dados estão em $PASTA." >&2
  exit 0
fi

# Converte a legenda em texto corrido (tira tempos, tags e linhas repetidas da legenda automática).
"$RAIZ/.venv/bin/python" -I - "$VTT" "$PASTA/roteiro.txt" <<'PY'
import re, sys
linhas, vistas = [], set()
for l in open(sys.argv[1], encoding="utf-8"):
    l = re.sub(r"<[^>]+>", "", l).strip()
    if not l or "-->" in l or l.startswith(("WEBVTT", "Kind:", "Language:")) or l.isdigit():
        continue
    if l not in vistas:
        vistas.add(l)
        linhas.append(l)
open(sys.argv[2], "w", encoding="utf-8").write("\n".join(linhas) + "\n")
PY

[[ -f "$PASTA/$ID.info.json" ]] && "$RAIZ/.venv/bin/python" -I -c '
import json, sys
d = json.load(open(sys.argv[1], encoding="utf-8"))
print("título:", d.get("title")); print("canal:", d.get("channel"))
print("views:", d.get("view_count"), "· duração:", d.get("duration_string"))
for c in d.get("chapters") or []: print("  capítulo", round(c["start_time"]), "s:", c["title"])
' "$PASTA/$ID.info.json" || echo "(sem dados do vídeo desta vez; o YouTube limitou os pedidos)"
echo "roteiro: $PASTA/roteiro.txt"
