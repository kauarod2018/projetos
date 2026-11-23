"""Junta várias imagens (ex.: stills de cada cena) numa folha de contato, com o nome de cada uma.

Uso: python ferramentas/folha.py PASTA [--colunas 6] [--saida PASTA/folha.jpg]
"""

from __future__ import annotations

import argparse
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("pasta", type=Path)
    ap.add_argument("--colunas", type=int, default=6)
    ap.add_argument("--saida", type=Path)
    args = ap.parse_args()

    arquivos = sorted(p for p in args.pasta.glob("*.jpg") if p.name != "folha.jpg") + sorted(args.pasta.glob("*.png"))
    if not arquivos:
        raise SystemExit(f"Nenhuma imagem em {args.pasta}")
    imagens = [Image.open(p).convert("RGB") for p in arquivos]
    w = max(i.width for i in imagens)
    h = max(i.height for i in imagens)
    faixa = 30
    linhas = math.ceil(len(imagens) / args.colunas)
    folha = Image.new("RGB", (args.colunas * w, linhas * (h + faixa)), (20, 20, 20))
    desenho = ImageDraw.Draw(folha)
    try:
        fonte = ImageFont.truetype("DejaVuSans-Bold.ttf", 20)
    except OSError:
        fonte = ImageFont.load_default()
    for n, (arq, im) in enumerate(zip(arquivos, imagens)):
        x, y = (n % args.colunas) * w, (n // args.colunas) * (h + faixa)
        desenho.text((x + 6, y + 4), f"{n + 1} · {arq.stem}", fill=(255, 230, 0), font=fonte)
        folha.paste(im, (x, y + faixa))
    destino = args.saida or args.pasta / "folha.jpg"
    folha.save(destino, quality=88)
    print(destino)


if __name__ == "__main__":
    main()
