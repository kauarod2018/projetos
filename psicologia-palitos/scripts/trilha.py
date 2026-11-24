"""Trilha: narração + lo-fi sintetizado + efeitos (lápis, risco, marca-texto, pop, peso).

Uso: python3 scripts/trilha.py <nome>   (lê build/<nome>/timeline.json e eventos.json)
Saída: build/<nome>/audio.wav. Tudo gerado por código: sem direitos autorais.
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
SR = 48000
rng = np.random.default_rng(5)


def ler_wav(p):
    with wave.open(str(p)) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
        return x.reshape(-1, w.getnchannels()).mean(1) if w.getnchannels() > 1 else x


def filtro(x, baixo=None, alto=None):
    e = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    if baixo:
        e *= 1 / np.sqrt(1 + (f / baixo) ** 4)
    if alto:
        e *= 1 / np.sqrt(1 + (alto / np.maximum(f, 1)) ** 4)
    return np.fft.irfft(e, len(x))


def nota(m):
    return 440 * 2 ** ((m - 69) / 12)


def lofi(dur):
    """Piano elétrico com acordes de sétima, baixo, batida com swing e chiado de vinil, 78 BPM."""
    n = int(dur * SR) + SR
    t = np.arange(n) / SR
    bpm, mix = 78, np.zeros(n)
    b = 60 / bpm
    acordes = [[50, 53, 57, 60, 64], [55, 59, 62, 65], [48, 52, 55, 59, 62], [45, 48, 52, 55, 60]]  # Dm9 G7 Cmaj9 Am7
    k = 0
    while k * 4 * b < dur + 1:
        ac = acordes[k % 4]
        for j, (bt, dd) in enumerate([(0, 1.6), (1.5, 0.5), (2.5, 1.4)]):
            s = int((k * 4 + bt) * b * SR)
            m = min(n - s, int(dd * b * SR) + int(0.4 * SR))
            if m <= 0:
                continue
            u = np.arange(m) / SR
            env = np.exp(-u * 2.2) * np.minimum(1, u / 0.01)
            for q, mm in enumerate(ac):
                fr = nota(mm) * (1 + 0.002 * np.sin(2 * np.pi * 0.7 * u))  # leve "wow" de fita
                mix[s:s + m] += env * (np.sin(2 * np.pi * fr * u) + 0.25 * np.sin(4 * np.pi * fr * u)) * 0.07 * (0.8 if j else 1)
        s = int(k * 4 * b * SR)
        m = min(n - s, int(3.6 * b * SR))
        u = np.arange(m) / SR
        mix[s:s + m] += np.sin(2 * np.pi * nota(ac[0] - 12) * u) * np.exp(-u * 0.9) * 0.22
        k += 1
    mix = filtro(mix, baixo=2600)
    # batida: bumbo, caixa abafada e chimbal com swing
    bu = np.arange(int(0.3 * SR)) / SR
    bumbo = np.sin(2 * np.pi * (48 + 70 * np.exp(-bu * 28)) * bu) * np.exp(-bu * 10) * 0.5
    cx_ = filtro(rng.standard_normal(int(0.2 * SR)), baixo=3500, alto=400) * np.exp(-np.arange(int(0.2 * SR)) / SR * 22) * 0.16
    ch = filtro(rng.standard_normal(int(0.04 * SR)), alto=6000) * np.exp(-np.arange(int(0.04 * SR)) / SR * 90) * 0.05
    j = 0
    while j * b < dur + 1:
        base = int(j * b * SR)
        if j % 4 in (0, 2) or (j % 8 == 7):
            mix[base:base + len(bumbo)] += bumbo[: max(0, min(len(bumbo), n - base))]
        if j % 2 == 1:
            mix[base:base + len(cx_)] += cx_[: max(0, min(len(cx_), n - base))]
        for sw in (0, 0.58):
            s = base + int(sw * b * SR)
            mix[s:s + len(ch)] += ch[: max(0, min(len(ch), n - s))]
        j += 1
    vinil = filtro(rng.standard_normal(n), baixo=5000, alto=800) * 0.006
    estalos = np.zeros(n)
    idx = rng.integers(0, n, int(dur * 6))
    estalos[idx] = rng.uniform(0.05, 0.2, len(idx))
    mix += vinil + filtro(estalos, baixo=4000) * 0.4
    env = np.minimum(1, t / 1.0) * np.clip((dur - t) / 1.5, 0, 1)
    return (mix * env)[: int(dur * SR)]


def lapis(d=0.5):
    m = int(d * SR)
    u = np.arange(m) / SR
    ruido = filtro(rng.standard_normal(m), baixo=6000, alto=1800)
    trem = 0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 11 * u + rng.uniform(0, 6)))  # vaivém do traço
    return ruido * trem * np.sin(np.pi * u / d) ** 0.5 * 0.12


def risco():
    m = int(0.28 * SR)
    u = np.arange(m) / SR
    return filtro(rng.standard_normal(m), baixo=7000, alto=1200) * np.exp(-u * 6) * np.minimum(1, u / 0.01) * 0.2


def marca():
    m = int(0.55 * SR)
    u = np.arange(m) / SR
    return filtro(rng.standard_normal(m), baixo=3000, alto=500) * np.sin(np.pi * u / 0.55) * 0.13


def pop():
    u = np.arange(int(0.18 * SR)) / SR
    return np.sin(2 * np.pi * (380 + 500 * np.exp(-u * 40)) * u) * np.exp(-u * 26) * 0.32


def pesado():
    u = np.arange(int(0.6 * SR)) / SR
    return (np.sin(2 * np.pi * (55 + 60 * np.exp(-u * 12)) * u) * np.exp(-u * 6) * 0.6
            + filtro(rng.standard_normal(len(u)), baixo=600) * np.exp(-u * 14) * 0.25)


SONS = {"lapis": lapis, "risco": risco, "marca": marca, "pop": pop, "pesado": pesado}


def colocar(dest, som, t, g=1.0):
    s = int(t * SR)
    if 0 <= s < len(dest):
        e = min(len(dest), s + len(som))
        dest[s:e] += som[: e - s] * g


def main():
    nome = sys.argv[1]
    pasta = RAIZ / "build" / nome
    tl = json.loads((pasta / "timeline.json").read_text(encoding="utf-8"))
    eventos = json.loads((pasta / "eventos.json").read_text(encoding="utf-8"))
    n = int(tl["duracao"] * SR)
    voz, ativa, sfx = np.zeros(n), np.zeros(n), np.zeros(n)
    for f in tl["falas"]:
        v = ler_wav(pasta / f["audio"])
        colocar(voz, v, f["inicio"])
        a = int(f["inicio"] * SR)
        ativa[a:a + len(v)] = 1
    for t, tipo in eventos:
        colocar(sfx, SONS[tipo](), t)
    suave = np.convolve(ativa, np.ones(int(0.3 * SR)) / int(0.3 * SR), mode="same")
    musica = lofi(tl["duracao"])
    musica /= np.abs(musica).max() + 1e-9
    mus = musica * (0.5 - 0.3 * suave) * 0.45
    mono = voz + sfx * 0.6
    atraso = int(0.015 * SR)
    est = np.stack([mono + mus, mono + np.concatenate([np.zeros(atraso), mus[:-atraso]])], 1)
    est /= max(1.0, np.abs(est).max() / 0.95)
    with wave.open(str(pasta / "audio.wav"), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((est * 32767).astype(np.int16).tobytes())
    print(pasta / "audio.wav")


if __name__ == "__main__":
    main()
