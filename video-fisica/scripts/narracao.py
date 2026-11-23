"""Narração (Piper TTS offline) + linha do tempo.

Uso: python3 scripts/narracao.py
Saída: public/audio/voz_NN.wav e public/timeline.json
"""
import json
import subprocess
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
MODELO = RAIZ.parent / "gerador-mapas" / "vozes" / "pt-br-edresson-low.onnx"
FPS = 30
FILTRO_VOZ = (
    "aresample=48000:resampler=soxr,highpass=f=90,"
    "equalizer=f=3200:t=q:w=1.2:g=4,equalizer=f=250:t=q:w=1:g=-2,"
    "acompressor=threshold=-20dB:ratio=3:attack=5:release=80:makeup=3,alimiter=limit=0.9"
)


def duracao(p: Path) -> float:
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)],
                       capture_output=True, text=True, check=True)
    return float(r.stdout)


def main() -> None:
    roteiro = json.loads((RAIZ / "roteiro.json").read_text(encoding="utf-8"))
    pasta = RAIZ / "public" / "audio"
    pasta.mkdir(parents=True, exist_ok=True)
    t = 0.0
    cenas = []
    n = len(roteiro["cenas"])
    for i, c in enumerate(roteiro["cenas"]):
        bruto, final = pasta / f"voz_{i:02d}_bruto.wav", pasta / f"voz_{i:02d}.wav"
        subprocess.run(["piper", "-m", str(MODELO), "-f", str(bruto), "--noise-scale", "0.6",
                        "--noise-w-scale", "0.7", "--sentence-silence", "0.3"],
                       input=c["fala"], text=True, check=True, capture_output=True)
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(bruto), "-af", FILTRO_VOZ, "-ac", "1", str(final)], check=True)
        bruto.unlink()
        d = duracao(final)
        antes = 2.6 if i == 0 else 0.5   # a 1ª cena começa com o título
        depois = 3.0 if i == n - 1 else 0.5
        fim = t + antes + d + depois
        cenas.append({**{k: c[k] for k in ("id", "ferramenta", "clipe", "rotulo", "fala")},
                      "inicio": round(t, 3), "inicioFala": round(t + antes, 3),
                      "duracaoFala": round(d, 3), "fim": round(fim, 3), "audio": f"audio/voz_{i:02d}.wav"})
        print(f"{i} {c['id']:<10} {c['ferramenta']:<8} fala {d:5.2f}s  [{t:6.2f} → {fim:6.2f}]")
        t = fim
    tl = {"titulo": roteiro["titulo"], "fps": FPS, "duracao": round(t, 3), "cenas": cenas}
    (RAIZ / "public" / "timeline.json").write_text(json.dumps(tl, indent=2, ensure_ascii=False), encoding="utf-8")
    # quanto tempo cada clipe precisa ter (clipes reaproveitados somam as cenas)
    precisa = {}
    for c in cenas:
        precisa.setdefault(c["clipe"], 0)
        precisa[c["clipe"]] += c["fim"] - c["inicio"]
    (RAIZ / "public" / "duracoes.json").write_text(json.dumps({k: round(v, 2) for k, v in precisa.items()}, indent=2), encoding="utf-8")
    print("total", round(t, 1), "s", precisa)


if __name__ == "__main__":
    main()
