"""Narração (Piper TTS, offline, pt-BR) e linha do tempo de um roteiro.

Uso: python3 scripts/narracao.py roteiros/teste.json
Saída: build/<nome>/voz_NN.wav e build/<nome>/timeline.json
"""
import json
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
MODELO = RAIZ.parent / "gerador-mapas" / "vozes" / "pt-br-edresson-low.onnx"
FILTRO_VOZ = (
    "aresample=48000:resampler=soxr,highpass=f=90,"
    "equalizer=f=3200:t=q:w=1.2:g=4,equalizer=f=250:t=q:w=1:g=-2,"
    "acompressor=threshold=-20dB:ratio=3:attack=5:release=80:makeup=3,alimiter=limit=0.9"
)
INICIO, PAUSA, FINAL = 0.4, 0.35, 0.9  # silêncio antes da 1ª fala, entre falas e no fim


def duracao(p: Path) -> float:
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)],
                       capture_output=True, text=True, check=True)
    return float(r.stdout)


def main() -> None:
    roteiro = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    pasta = RAIZ / "build" / roteiro["nome"]
    pasta.mkdir(parents=True, exist_ok=True)
    t, falas = INICIO, []
    for i, texto in enumerate(roteiro["falas"]):
        bruto, final = pasta / f"voz_{i:02d}_bruto.wav", pasta / f"voz_{i:02d}.wav"
        subprocess.run(["piper", "-m", str(MODELO), "-f", str(bruto), "--length-scale", "0.93",
                        "--noise-scale", "0.6", "--noise-w-scale", "0.7", "--sentence-silence", "0.22"],
                       input=texto, text=True, check=True, capture_output=True)
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(bruto), "-af", FILTRO_VOZ, "-ac", "1", str(final)], check=True)
        bruto.unlink()
        d = duracao(final)
        falas.append({"texto": texto, "inicio": round(t, 3), "duracao": round(d, 3), "audio": final.name})
        print(f"{i:02d} [{t:6.2f} +{d:5.2f}s] {texto[:60]}")
        t += d + PAUSA
    total = t - PAUSA + FINAL
    tl = {"nome": roteiro["nome"], "formato": roteiro["formato"], "duracao": round(total, 3), "falas": falas}
    (pasta / "timeline.json").write_text(json.dumps(tl, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"total {total:.1f}s")


if __name__ == "__main__":
    main()
