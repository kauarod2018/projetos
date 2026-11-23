"""Gera uma trilha de fundo original e calma (acordes lentos de "piano elétrico" + pad), sem direitos de terceiros.

Uso: python ferramentas/trilha.py SAIDA.wav --duracao 215 [--bpm 70] [--tom C] [--clima calmo|esperanca]

A trilha é feita por código (somas de senoides com envelope), então pode ser usada à vontade.
Use volume baixo no vídeo (ex.: 0.12–0.2) para não brigar com a narração.
"""

from __future__ import annotations

import argparse
import wave

import numpy as np

TAXA = 44100
NOTAS = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}

# progressões em graus da escala maior (semitons a partir da tônica) — acordes com 7ª/9ª para soar "lo-fi"
PROGRESSOES = {
    "calmo": [[0, 4, 7, 11, 14], [9, 12, 16, 19], [5, 9, 12, 16], [7, 11, 14, 17]],  # Imaj9 – vi7 – IVmaj7 – V7
    "esperanca": [[5, 9, 12, 16], [7, 11, 14, 17], [4, 7, 11, 14], [9, 12, 16, 19]],  # IV – V – iii – vi
}


def freq(semitom: float, base_midi: int) -> float:
    return 440.0 * 2 ** ((base_midi + semitom - 69) / 12)


def nota_piano(f: float, dur: float, vel: float) -> np.ndarray:
    t = np.arange(int(dur * TAXA)) / TAXA
    env = np.exp(-t * 1.6) * (1 - np.exp(-t * 80))  # ataque rápido, decaimento longo
    som = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 3) + 0.12 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t * 5)
    tremolo = 1 + 0.06 * np.sin(2 * np.pi * 4.5 * t)
    return som * env * tremolo * vel


def pad(f: float, dur: float) -> np.ndarray:
    t = np.arange(int(dur * TAXA)) / TAXA
    ataque = np.clip(t / 1.2, 0, 1)
    soltura = np.clip((dur - t) / 1.2, 0, 1)
    som = sum(np.sin(2 * np.pi * f * (1 + d) * t) for d in (-0.003, 0, 0.004)) / 3
    return som * ataque * soltura


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("saida")
    ap.add_argument("--duracao", type=float, required=True, help="segundos")
    ap.add_argument("--bpm", type=float, default=70)
    ap.add_argument("--tom", default="C", choices=NOTAS.keys())
    ap.add_argument("--clima", default="calmo", choices=PROGRESSOES.keys())
    ap.add_argument("--semente", type=int, default=7)
    args = ap.parse_args()

    rng = np.random.default_rng(args.semente)
    base = 48 + NOTAS[args.tom]  # C3
    batida = 60 / args.bpm
    compasso = 4 * batida
    total = int((args.duracao + 3) * TAXA)
    mix = np.zeros(total)
    prog = PROGRESSOES[args.clima]

    t0, i = 0.0, 0
    while t0 < args.duracao:
        acorde = prog[i % len(prog)]
        ini = int(t0 * TAXA)
        # pad sustentado (oitava baixa) durante o compasso inteiro
        for s in acorde[:3]:
            p = pad(freq(s, base - 12), compasso + 1.2) * 0.10
            fim = min(total, ini + len(p))
            mix[ini:fim] += p[: fim - ini]
        # baixo
        b = nota_piano(freq(acorde[0], base - 12), compasso, 0.22)
        mix[ini : ini + len(b)] += b[: max(0, min(len(b), total - ini))]
        # arpejo leve do piano: 4 notas por compasso, com pequena variação humana
        for k in range(4):
            s = acorde[(k * 2 + i) % len(acorde)] + (12 if k % 2 else 0)
            atraso = k * batida + rng.uniform(-0.02, 0.02)
            vel = 0.16 + rng.uniform(-0.03, 0.03)
            n = nota_piano(freq(s, base), batida * 2.5, vel)
            a = int((t0 + atraso) * TAXA)
            if a < total:
                mix[a : a + len(n)] += n[: max(0, min(len(n), total - a))]
        t0 += compasso
        i += 1

    # reverb simples (ecos amortecidos) + fade in/out
    eco = np.zeros_like(mix)
    for atraso_s, ganho in ((0.11, 0.35), (0.23, 0.22), (0.37, 0.14), (0.53, 0.08)):
        d = int(atraso_s * TAXA)
        eco[d:] += mix[:-d] * ganho
    mix = mix + eco
    n_total = int(args.duracao * TAXA)
    mix = mix[:n_total]
    fade = int(2.5 * TAXA)
    mix[:fade] *= np.linspace(0, 1, fade)
    mix[-fade:] *= np.linspace(1, 0, fade)
    mix = mix / (np.abs(mix).max() + 1e-9) * 0.8

    estereo = np.stack([mix, np.roll(mix, int(0.012 * TAXA))], axis=1)
    with wave.open(args.saida, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(TAXA)
        w.writeframes((estereo * 32767).astype(np.int16).tobytes())
    print(f"trilha salva: {args.saida} ({args.duracao:.0f} s, {args.clima}, {args.tom}, {args.bpm:.0f} bpm)")


if __name__ == "__main__":
    main()
