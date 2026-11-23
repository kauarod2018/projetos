"""Gera a narração de cada cena (Piper TTS, offline) e a linha do tempo do vídeo.

Uso: python3 scripts/narracao.py roteiros/lusofonia.json
Saída: build/<slug>/voz/NN.wav (48 kHz) e build/<slug>/timeline.json
"""
import json
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
MODELO = RAIZ / "vozes" / "pt-br-edresson-low.onnx"

# Tempo antes da fala (para a câmera voar até o lugar) e depois dela, por tipo de cena.
RITMO = {
    "intro": (0.5, 0.7),
    "pais": (1.25, 0.45),
    "marcador": (1.4, 0.6),
    "total": (1.3, 1.1),
    "barra": (0.8, 1.2),
    "outro": (0.6, 2.2),
}

# Tratamento da voz: tira graves sujos, dá presença, comprime e sobe para 48 kHz.
FILTRO_VOZ = (
    "aresample=48000:resampler=soxr,highpass=f=90,"
    "equalizer=f=3200:t=q:w=1.2:g=4,equalizer=f=250:t=q:w=1:g=-2,"
    "acompressor=threshold=-20dB:ratio=3:attack=5:release=80:makeup=3,"
    "alimiter=limit=0.9"
)


def eventos(cena: dict, inicio: float, fala: float, dur_fala: float) -> list:
    """Momentos-chave de cada cena, usados tanto pela animação quanto pelos efeitos sonoros."""
    tipo = cena["tipo"]
    if tipo == "intro":
        return [inicio + 0.15, inicio + 0.45, inicio + 1.2]  # linha 1, linha 2, selo
    if tipo in ("pais", "marcador"):
        return [inicio + 1.0]  # país acende no mapa
    if tipo == "total":
        n = len(cena.get("estatisticas", []))
        # espalha os cartões ao longo da fala
        return [fala + 0.9 + k * (dur_fala * 0.5) / max(n - 1, 1) for k in range(n)]
    if tipo == "barra":
        return [inicio + 0.2, fala + dur_fala * 0.30, fala + dur_fala * 0.48]  # painel, barra, destaque
    if tipo == "outro":
        return [inicio + 0.3, fala + dur_fala * 0.45]  # texto, botão
    return []


def duracao(caminho: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(caminho)],
        capture_output=True, text=True, check=True,
    )
    return float(out.stdout.strip())


def main() -> None:
    roteiro_path = Path(sys.argv[1])
    roteiro = json.loads(roteiro_path.read_text(encoding="utf-8"))
    build = RAIZ / "build" / roteiro["slug"]
    pasta_voz = build / "voz"
    pasta_voz.mkdir(parents=True, exist_ok=True)

    t = 0.0
    cenas = []
    for i, cena in enumerate(roteiro["cenas"]):
        bruto = pasta_voz / f"{i:02d}_bruto.wav"
        final = pasta_voz / f"{i:02d}.wav"
        subprocess.run(
            ["piper", "-m", str(MODELO), "-f", str(bruto), "--length-scale", "1.0",
             "--noise-scale", "0.6", "--noise-w-scale", "0.7", "--sentence-silence", "0.22"],
            input=cena["fala"], text=True, check=True, capture_output=True,
        )
        subprocess.run(
            ["ffmpeg", "-y", "-v", "error", "-i", str(bruto), "-af", FILTRO_VOZ, "-ac", "1", str(final)],
            check=True,
        )
        bruto.unlink()
        d = duracao(final)
        antes, depois = RITMO[cena["tipo"]]
        fala = t + antes
        cenas.append({
            "indice": i,
            "tipo": cena["tipo"],
            "inicio": round(t, 3),
            "inicioFala": round(fala, 3),
            "duracaoFala": round(d, 3),
            "fim": round(fala + d + depois, 3),
            "audio": str(final.relative_to(build)),
            "eventos": [round(x, 3) for x in eventos(cena, t, fala, d)],
        })
        print(f"cena {i:02d} {cena['tipo']:<9} fala {d:5.2f}s  [{t:6.2f} → {cenas[-1]['fim']:6.2f}]")
        t = cenas[-1]["fim"]

    timeline = {"duracao": round(t, 3), "fps": 30, "largura": 1920, "altura": 1080, "cenas": cenas}
    (build / "timeline.json").write_text(json.dumps(timeline, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"duração total: {t:.1f}s")


if __name__ == "__main__":
    main()
