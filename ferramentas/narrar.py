"""Gera narração em português, offline, com a voz Piper.

Uso:
  python ferramentas/narrar.py ROTEIRO.txt SAIDA.wav [--voz pt_BR-faber-medium] [--pausa 0.35] [--velocidade 1.0]

Cada linha não vazia do roteiro vira uma fala, separada por uma pausa curta.
Linhas que começam com # são ignoradas (use para anotações de cena).
A voz é baixada na primeira vez para .cache/vozes/.
Velocidade: 1.0 normal, 0.9 um pouco mais rápido, 1.15 mais devagar (é o length_scale do Piper).
"""

from __future__ import annotations

import argparse
import subprocess
import sys
import wave
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
VOZES = RAIZ / ".cache" / "vozes"


def garantir_voz(nome: str) -> Path:
    modelo = VOZES / f"{nome}.onnx"
    if not modelo.exists():
        VOZES.mkdir(parents=True, exist_ok=True)
        subprocess.run([sys.executable, "-I", "-m", "piper.download_voices", "--download-dir", str(VOZES), nome], check=True)
    return modelo


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("roteiro", type=Path)
    ap.add_argument("saida", type=Path)
    ap.add_argument("--voz", default="pt_BR-faber-medium")
    ap.add_argument("--pausa", type=float, default=0.35, help="segundos de silêncio entre falas")
    ap.add_argument("--velocidade", type=float, default=1.0)
    args = ap.parse_args()

    from piper import PiperVoice, SynthesisConfig

    voz = PiperVoice.load(str(garantir_voz(args.voz)))
    cfg = SynthesisConfig(length_scale=args.velocidade)
    falas = [l.strip() for l in args.roteiro.read_text(encoding="utf-8").splitlines()
             if l.strip() and not l.strip().startswith("#")]
    if not falas:
        sys.exit("Roteiro vazio.")

    args.saida.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(args.saida), "wb") as wav:
        configurado = False
        for fala in falas:
            for pedaco in voz.synthesize(fala, syn_config=cfg):
                if not configurado:
                    wav.setnchannels(pedaco.sample_channels)
                    wav.setsampwidth(pedaco.sample_width)
                    wav.setframerate(pedaco.sample_rate)
                    configurado = True
                wav.writeframes(pedaco.audio_int16_bytes)
            silencio = int(wav.getframerate() * args.pausa) * wav.getsampwidth() * wav.getnchannels()
            wav.writeframes(b"\x00" * silencio)
    print(f"narração salva: {args.saida} ({len(falas)} falas)")


if __name__ == "__main__":
    main()
