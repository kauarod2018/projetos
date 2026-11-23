"""Trilha do vídeo de física: música espacial sintetizada, efeitos e narração com ducking.

Uso: python3 scripts/trilha.py
Saída: build/audio.wav (48 kHz, estéreo). Tudo gerado por código: sem direitos autorais.
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
SR = 48000
rng = np.random.default_rng(7)


def ler_wav(caminho: Path) -> np.ndarray:
    with wave.open(str(caminho)) as w:
        assert w.getframerate() == SR, caminho
        dados = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
        if w.getnchannels() == 2:
            dados = dados.reshape(-1, 2).mean(axis=1)
    return dados


def passa_baixa(x: np.ndarray, corte: float) -> np.ndarray:
    espec = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    espec *= 1 / np.sqrt(1 + (f / corte) ** 4)
    return np.fft.irfft(espec, len(x))


def passa_alta(x: np.ndarray, corte: float) -> np.ndarray:
    espec = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    espec *= 1 / np.sqrt(1 + (corte / np.maximum(f, 1)) ** 4)
    return np.fft.irfft(espec, len(x))


def nota(midi: float) -> float:
    return 440.0 * 2 ** ((midi - 69) / 12)


def musica(duracao: float) -> np.ndarray:
    """Clima espacial: pad largo, arpejo cristalino e batida leve, 84 BPM."""
    n = int(duracao * SR) + SR
    t = np.arange(n) / SR
    bpm = 84
    batida = 60 / bpm
    compasso = batida * 4
    # Am  F  C  Em  (2 compassos cada)
    acordes = [[45, 52, 57, 60], [41, 48, 53, 57], [48, 52, 55, 60], [40, 47, 52, 55]]
    pad = np.zeros(n)
    arp = np.zeros(n)
    baixo = np.zeros(n)
    dur_acorde = compasso * 2
    k = 0
    while k * dur_acorde < duracao + 1:
        ac = acordes[k % 4]
        a, b = int(k * dur_acorde * SR), min(n, int((k + 1) * dur_acorde * SR))
        tt = t[a:b] - t[a]
        env = np.minimum(1, tt / 0.4) * np.minimum(1, (dur_acorde - tt) / 0.4)
        for m in ac:
            for det in (-0.08, 0.08):
                fr = nota(m + 12 + det)
                pad[a:b] += env * (2 * ((tt * fr) % 1) - 1) * 0.05  # dente de serra
        # baixo em colcheias
        for j in range(int(dur_acorde / (batida / 2))):
            s = a + int(j * batida / 2 * SR)
            e = min(b, s + int(batida / 2 * SR))
            if s >= n:
                break
            u = (np.arange(e - s)) / SR
            baixo[s:e] += np.sin(2 * np.pi * nota(ac[0] - 12) * u) * np.exp(-u * 5) * 0.35
        # arpejo em semicolcheias
        seq = [ac[0] + 24, ac[1] + 24, ac[2] + 24, ac[3] + 24, ac[2] + 24, ac[1] + 24]
        for j in range(int(dur_acorde / (batida / 4))):
            s = a + int(j * batida / 4 * SR)
            if s >= n:
                break
            e = min(n, s + int(0.35 * SR))
            u = np.arange(e - s) / SR
            fr = nota(seq[j % len(seq)])
            som = np.sin(2 * np.pi * fr * u) + 0.3 * np.sin(4 * np.pi * fr * u)
            arp[s:e] += som * np.exp(-u * 14) * 0.10
        k += 1
    pad = passa_baixa(pad, 1100)
    # batida: bumbo nos tempos, chimbal no contratempo
    perc = np.zeros(n)
    bumbo_u = np.arange(int(0.25 * SR)) / SR
    bumbo = np.sin(2 * np.pi * (50 + 90 * np.exp(-bumbo_u * 30)) * bumbo_u) * np.exp(-bumbo_u * 12) * 0.55
    chimbal = passa_alta(rng.standard_normal(int(0.05 * SR)), 7000) * np.exp(-np.arange(int(0.05 * SR)) / SR * 80) * 0.12
    j = 0
    while j * batida < duracao + 1:
        s = int(j * batida * SR)
        if s + len(bumbo) < n:
            perc[s:s + len(bumbo)] += bumbo
        s2 = int((j + 0.5) * batida * SR)
        if s2 + len(chimbal) < n:
            perc[s2:s2 + len(chimbal)] += chimbal
        j += 1
    mix = pad + arp + baixo + perc
    # entra suave e sai com fade
    env = np.minimum(1, t / 1.5) * np.clip((duracao - t) / 2.5, 0, 1)
    return (mix * env)[: int(duracao * SR)]


def pop(intensidade: float = 1.0) -> np.ndarray:
    u = np.arange(int(0.5 * SR)) / SR
    tom = np.sin(2 * np.pi * (500 + 900 * (1 - np.exp(-u * 40))) * u) * np.exp(-u * 30)
    sino = sum(np.sin(2 * np.pi * f * u) * np.exp(-u * d) * a for f, d, a in [(1568, 6, 0.4), (2349, 8, 0.25), (3136, 10, 0.15)])
    return (tom * 0.6 + sino * 0.5) * intensidade


def whoosh(dur: float = 1.0) -> np.ndarray:
    m = int(dur * SR)
    u = np.arange(m) / SR
    ruido = rng.standard_normal(m)
    ruido = passa_alta(passa_baixa(ruido, 2500), 300)
    env = np.sin(np.pi * np.clip(u / dur, 0, 1)) ** 2
    return ruido * env * 0.18


def impacto() -> np.ndarray:
    u = np.arange(int(1.2 * SR)) / SR
    grave = np.sin(2 * np.pi * (40 + 80 * np.exp(-u * 8)) * u) * np.exp(-u * 3)
    ruido = passa_baixa(rng.standard_normal(len(u)), 900) * np.exp(-u * 6) * 0.3
    return (grave + ruido) * 0.6


def colocar(destino: np.ndarray, som: np.ndarray, t: float, ganho: float = 1.0) -> None:
    s = int(t * SR)
    if s >= len(destino):
        return
    e = min(len(destino), s + len(som))
    destino[s:e] += som[: e - s] * ganho


def tempo_de(c: dict, trecho: str) -> float:
    i = c["fala"].lower().find(trecho.lower())
    return c["inicioFala"] + c["duracaoFala"] * max(i, 0) / len(c["fala"])


def main() -> None:
    tl = json.loads((RAIZ / "public" / "timeline.json").read_text(encoding="utf-8"))
    n = int(tl["duracao"] * SR)
    voz, fala_ativa, efeitos = np.zeros(n), np.zeros(n), np.zeros(n)
    por_id = {c["id"]: c for c in tl["cenas"]}
    for i, c in enumerate(tl["cenas"]):
        v = ler_wav(RAIZ / "public" / c["audio"])
        colocar(voz, v, c["inicioFala"])
        a = int(c["inicioFala"] * SR)
        fala_ativa[a:a + len(v)] = 1
        if i > 0:
            colocar(efeitos, whoosh(0.9), c["inicio"] - 0.45, 0.8)
    # impactos e "pops" sincronizados com os textos do Remotion
    colocar(efeitos, impacto(), 0.2, 1.0)
    colocar(efeitos, pop(0.7), 0.6)
    g, v, f, e = por_id["gancho"], por_id["virada"], por_id["final"], por_id["estacao"]
    colocar(efeitos, pop(0.8), tempo_de(g, "setenta"))
    colocar(efeitos, impacto(), tempo_de(g, "Por quê"), 0.8)
    for trecho in ("a Lua está caindo", "O tempo todo", "Ela só nunca"):
        colocar(efeitos, pop(0.8), tempo_de(v, trecho))
    colocar(efeitos, whoosh(1.6), e["inicioFala"] - 0.2, 0.7)
    for trecho in ("está sempre caindo", "sempre errando", "Se você"):
        colocar(efeitos, pop(0.9), tempo_de(f, trecho))

    janela = int(0.25 * SR)
    suave = np.convolve(fala_ativa, np.ones(janela) / janela, mode="same")
    ganho_musica = 0.55 - 0.33 * suave
    m = musica(tl["duracao"])
    m = m / (np.abs(m).max() + 1e-9)
    mono = voz + efeitos * 0.5
    mus = m * ganho_musica * 0.42
    atraso = int(0.012 * SR)
    est = np.stack([mono + mus, mono + np.concatenate([np.zeros(atraso), mus[:-atraso]])], axis=1)
    est /= max(1.0, np.abs(est).max() / 0.95)
    saida = RAIZ / "build" / "audio.wav"
    saida.parent.mkdir(exist_ok=True)
    with wave.open(str(saida), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((est * 32767).astype(np.int16).tobytes())
    print(saida)


if __name__ == "__main__":
    main()
