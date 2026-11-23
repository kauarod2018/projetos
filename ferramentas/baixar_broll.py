"""Baixa os vídeos de banco (Pixabay) listados num manifesto .broll.json para video/public/broll/.

Uso:
  python ferramentas/baixar_broll.py roteiros/<nome>.broll.json            # baixa os vídeos
  python ferramentas/baixar_broll.py roteiros/<nome>.broll.json --minis    # só as miniaturas + folha para revisar

Os vídeos ficam fora do git (são grandes); o manifesto guarda id, autor e link de cada um.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DESTINO = RAIZ / "video" / "public" / "broll"


def baixar(url: str, arquivo: Path) -> None:
    if arquivo.exists() and arquivo.stat().st_size > 0:
        return
    arquivo.parent.mkdir(parents=True, exist_ok=True)
    tmp = arquivo.with_suffix(arquivo.suffix + ".parcial")
    pedido = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (video-kit)"})
    with urllib.request.urlopen(pedido, timeout=120) as r, open(tmp, "wb") as f:
        while bloco := r.read(1 << 20):
            f.write(bloco)
    tmp.rename(arquivo)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("manifesto", type=Path)
    ap.add_argument("--minis", action="store_true", help="baixa só as miniaturas e monta uma folha")
    args = ap.parse_args()

    dados = json.loads(args.manifesto.read_text(encoding="utf-8"))
    vistos: dict[int, dict] = {}
    for fala, lista in sorted(dados["escolhas"].items(), key=lambda kv: int(kv[0])):
        for item in lista:
            vistos.setdefault(item["id"], {**item, "fala": fala})

    if args.minis:
        pasta = RAIZ / "saida" / "olho" / f"minis-{args.manifesto.stem}"
        for item in vistos.values():
            baixar(item["mini"], pasta / f"fala{int(item['fala']):02d}_{item['id']}.jpg")
        subprocess.run([str(RAIZ / ".venv/bin/python"), "-I", str(RAIZ / "ferramentas/folha.py"), str(pasta), "--colunas", "6"], check=True)
        return

    for n, item in enumerate(vistos.values(), 1):
        arquivo = DESTINO / f"{item['id']}.mp4"
        baixar(item["url"], arquivo)
        print(f"[{n}/{len(vistos)}] {arquivo.name} ({arquivo.stat().st_size / 1e6:.1f} MB) — {item['autor']}")


if __name__ == "__main__":
    main()
