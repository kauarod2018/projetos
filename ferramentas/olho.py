"""O "olho" do Claude: transforma um vídeo em imagens que ele consegue ver.

Uso:
  python ferramentas/olho.py VIDEO [--saida PASTA] [--cada SEGUNDOS] [--colunas N]
  python ferramentas/olho.py VIDEO --quadro 12.5        # um quadro exato (em segundos)

O que gera na pasta de saída (padrão: saida/olho/<nome-do-video>/):
  cena_XX_<tempo>.jpg   um quadro do meio de cada cena (troca de plano detectada)
  amostra_<tempo>.jpg   um quadro a cada N segundos (padrão 2s), para vídeos sem cortes
  folha.jpg             uma "folha de contato" com tudo lado a lado e o tempo em cima
  cenas.txt             a lista de cenas com início e fim

Depois é só o Claude abrir folha.jpg (e os quadros que quiser) com a ferramenta Read.
"""

from __future__ import annotations

import argparse
import math
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


def duracao(video: Path) -> float:
    saida = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(video)],
        capture_output=True, text=True, check=True,
    )
    return float(saida.stdout.strip())


def tirar_quadro(video: Path, segundos: float, destino: Path, largura: int = 540) -> Path | None:
    """Tira um quadro; devolve None se não houver imagem nesse tempo (ex.: bem no fim)."""
    destino.unlink(missing_ok=True)
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-ss", f"{segundos:.3f}", "-i", str(video),
         "-frames:v", "1", "-vf", f"scale={largura}:-2", "-q:v", "3", str(destino)],
        check=True,
    )
    return destino if destino.exists() else None


def detectar_cenas(video: Path) -> list[tuple[float, float]]:
    from scenedetect import ContentDetector, detect

    cenas = detect(str(video), ContentDetector(threshold=27.0))
    return [(ini.get_seconds(), fim.get_seconds()) for ini, fim in cenas]


def fmt(t: float) -> str:
    m, s = divmod(t, 60)
    return f"{int(m):02d}m{s:05.2f}s"


def folha_de_contato(quadros: list[tuple[str, Path]], destino: Path, colunas: int) -> None:
    imagens = [(rotulo, Image.open(p).convert("RGB")) for rotulo, p in quadros]
    larg = max(im.width for _, im in imagens)
    alt = max(im.height for _, im in imagens)
    faixa = 34
    linhas = math.ceil(len(imagens) / colunas)
    folha = Image.new("RGB", (colunas * larg, linhas * (alt + faixa)), (20, 20, 20))
    desenho = ImageDraw.Draw(folha)
    try:
        fonte = ImageFont.truetype("DejaVuSans-Bold.ttf", 22)
    except OSError:
        fonte = ImageFont.load_default()
    for i, (rotulo, im) in enumerate(imagens):
        x, y = (i % colunas) * larg, (i // colunas) * (alt + faixa)
        desenho.text((x + 8, y + 5), rotulo, fill=(255, 230, 0), font=fonte)
        folha.paste(im, (x, y + faixa))
    folha.save(destino, quality=88)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("video", type=Path)
    ap.add_argument("--saida", type=Path)
    ap.add_argument("--cada", type=float, default=2.0, help="segundos entre amostras (0 desliga)")
    ap.add_argument("--colunas", type=int, default=5)
    ap.add_argument("--quadro", type=float, help="tira só um quadro neste tempo (segundos)")
    ap.add_argument("--largura", type=int, default=540, help="largura de cada quadro em pixels")
    args = ap.parse_args()

    video: Path = args.video.resolve()
    if not video.exists():
        sys.exit(f"Vídeo não encontrado: {video}")
    pasta = (args.saida or Path("saida/olho") / video.stem).resolve()
    pasta.mkdir(parents=True, exist_ok=True)

    if args.quadro is not None:
        destino = tirar_quadro(video, args.quadro, pasta / f"quadro_{fmt(args.quadro)}.jpg", 1080)
        print(destino or f"Não há quadro em {args.quadro}s (o vídeo é mais curto?)")
        return

    total = duracao(video)
    cenas = detectar_cenas(video) or [(0.0, total)]
    quadros: list[tuple[str, Path]] = []
    linhas_txt = []
    for i, (ini, fim) in enumerate(cenas, 1):
        meio = ini + (fim - ini) / 2
        p = tirar_quadro(video, meio, pasta / f"cena_{i:02d}_{fmt(meio)}.jpg", args.largura)
        if p:
            quadros.append((f"cena {i} · {fmt(meio)}", p))
        linhas_txt.append(f"cena {i:02d}: {fmt(ini)} -> {fmt(fim)} ({fim - ini:.2f}s)")

    if args.cada > 0:
        t = 0.0
        while t < total:
            p = tirar_quadro(video, t, pasta / f"amostra_{fmt(t)}.jpg", args.largura)
            if p:
                quadros.append((f"{fmt(t)}", p))
            t += args.cada

    quadros.sort(key=lambda q: q[1].name.split("_")[-1])
    folha_de_contato(quadros, pasta / "folha.jpg", args.colunas)
    (pasta / "cenas.txt").write_text(
        f"vídeo: {video.name}\nduração: {fmt(total)}\ncenas detectadas: {len(cenas)}\n" + "\n".join(linhas_txt) + "\n",
        encoding="utf-8",
    )
    print((pasta / "cenas.txt").read_text(encoding="utf-8"))
    print(f"folha de contato: {pasta / 'folha.jpg'}")


if __name__ == "__main__":
    main()
