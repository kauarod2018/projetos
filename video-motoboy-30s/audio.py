"""Trilha e efeitos sonoros sintetizados (sem arquivos externos) para o vídeo de 30 s."""
import numpy as np, wave

SR = 44100
DUR = 30.0
N = int(SR * DUR)
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(7)


def t_arr(d):
    return np.arange(int(SR * d)) / SR


def add(sig, start, gain=1.0, pan=0.0):
    i = int(start * SR)
    if i >= N:
        return
    sig = sig[: N - i] * gain
    L[i:i + len(sig)] += sig * (1 - max(0, pan))
    R[i:i + len(sig)] += sig * (1 + min(0, pan))


def env(n, a=0.005, r=0.1, d=None):
    e = np.ones(n)
    ai = max(1, int(a * SR)); ri = max(1, int(r * SR))
    e[:ai] = np.linspace(0, 1, ai)
    e[-ri:] *= np.linspace(1, 0, ri)
    return e


def lowpass(x, k):  # média móvel simples
    k = max(1, int(k))
    return np.convolve(x, np.ones(k) / k, mode='same')


def noise(d):
    return rng.standard_normal(int(SR * d))


def fade(x, fi=0.2, fo=0.3):
    n = len(x); e = np.ones(n)
    a = int(fi * SR); b = int(fo * SR)
    if a: e[:a] = np.linspace(0, 1, a)
    if b: e[-b:] *= np.linspace(1, 0, b)
    return x * e


# ---------- ambientes ----------
def rainbed(d):
    n = noise(d)
    hi = n - lowpass(n, 6)
    return fade(hi * 0.18 + lowpass(n, 40) * 0.25, 0.3, 0.3)


def engine(d, base=62, wob=6):
    t = t_arr(d)
    f = base + wob * np.sin(2 * np.pi * 1.3 * t) + 4 * np.sin(2 * np.pi * 7 * t)
    ph = 2 * np.pi * np.cumsum(f) / SR
    saw = (ph / np.pi % 2) - 1
    x = lowpass(saw, 18) * 0.5 + np.sin(ph * 2) * 0.15
    return fade(x, 0.2, 0.2)


def whoosh(d=0.45, up=True):
    n = noise(d); t = t_arr(d)
    out = np.zeros_like(n)
    for k, w in [(30, 0.6), (10, 0.4)]:
        out += lowpass(n, k) * w
    sh = np.sin(np.pi * t / d) ** 2
    return out * sh * 0.9


def boom(d=1.2, f0=90, f1=28):
    t = t_arr(d)
    f = f1 + (f0 - f1) * np.exp(-t * 6)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-t * 3.2)
    x += lowpass(noise(d), 8) * np.exp(-t * 14) * 0.8
    return x


def screech(d=0.7):
    t = t_arr(d)
    f = 2400 - 600 * t / d
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = (np.sin(ph) + 0.4 * np.sin(ph * 1.5)) * (0.5 + 0.5 * np.sin(2 * np.pi * 23 * t))
    x += (noise(d) - lowpass(noise(d), 4)) * 0.3
    return x * env(len(t), 0.03, 0.2) * 0.35


def buzz(d=0.28):
    t = t_arr(d)
    x = np.sign(np.sin(2 * np.pi * 150 * t)) * 0.5
    return lowpass(x, 6) * env(len(t), 0.01, 0.05)


def tick(f=1800, d=0.03):
    t = t_arr(d)
    return np.sin(2 * np.pi * f * t) * np.exp(-t * 160)


def coin(d=0.35):
    t = t_arr(d)
    x = np.sin(2 * np.pi * 1318 * t) * (t < 0.08) + np.sin(2 * np.pi * 1760 * t) * (t >= 0.08)
    return x * np.exp(-t * 9) * 0.6


def pop(f=600, d=0.12):
    t = t_arr(d)
    ff = f * (1 + 2 * np.exp(-t * 40))
    return np.sin(2 * np.pi * np.cumsum(ff) / SR) * np.exp(-t * 30)


def errbeep(d=0.5):
    t = t_arr(d)
    x = np.sign(np.sin(2 * np.pi * 220 * t)) * ((t % 0.25) < 0.16)
    return lowpass(x, 5) * 0.35


def thunder(d=2.5):
    n = noise(d); t = t_arr(d)
    x = lowpass(n, 120) * 3 + lowpass(n, 30)
    return x * np.exp(-t * 1.4) * (1 - np.exp(-t * 30))


def stamp():
    x = boom(0.5, 140, 50) * 0.8
    p = pop(300, 0.1) * 0.4
    x[:len(p)] += p
    return x


def ding(f=1046, d=1.0):
    t = t_arr(d)
    return (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.01 * t)) * np.exp(-t * 4)


# ---------- música (lo-fi simples, 92 bpm) ----------
BPM = 92; beat = 60 / BPM


def kick():
    return boom(0.35, 120, 45) * 0.9


def hat():
    n = noise(0.05)
    return (n - lowpass(n, 3)) * np.exp(-t_arr(0.05) * 70) * 0.25


def snare():
    d = 0.2; t = t_arr(d)
    return (noise(d) - lowpass(noise(d), 3)) * np.exp(-t * 22) * 0.45 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * 0.3


def pad(freqs, d):
    t = t_arr(d)
    x = sum(np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2 * t + 0.3) for f in freqs)
    x = lowpass(x, 12)
    return x / len(freqs) * env(len(t), 0.25, 0.4)


def bass(f, d):
    t = t_arr(d)
    return np.sin(2 * np.pi * f * t) * env(len(t), 0.01, 0.15) * 0.7


CH = [([220, 261.6, 329.6], 110), ([174.6, 220, 261.6], 87.3), ([261.6, 329.6, 392], 130.8), ([196, 246.9, 293.7], 98)]


def music(start, end, gain=1.0, drums=True):
    t = start; b = 0
    while t < end - 0.01:
        bar = b // 4
        if b % 4 == 0:
            chord, bf = CH[bar % 4]
            d = min(beat * 4, end - t)
            add(pad(chord, d), t, 0.22 * gain)
            add(bass(bf, min(beat * 1.5, end - t)), t, 0.35 * gain)
            add(bass(bf, min(beat * 1.5, end - t)), t + beat * 2, 0.3 * gain)
        if drums:
            if b % 2 == 0: add(kick(), t, 0.55 * gain)
            else: add(snare(), t, 0.4 * gain)
            add(hat(), t, gain); add(hat(), t + beat / 2, 0.6 * gain)
        t += beat; b += 1


# ---------- linha do tempo ----------
# Cena A (0–4.4): chuva noturna, motor, freada, batida, congelamento, rebobinar
add(rainbed(4.6), 0, 0.9)
add(engine(2.3, 70), 0, 0.5, 0.2)
add(screech(0.65), 2.05, 1.0)
add(boom(1.4, 100, 30), 2.85, 1.1)
add(stamp(), 2.98, 0.6)
add(whoosh(0.5), 3.95, 0.9)
for i in range(10):
    add(tick(900 + i * 120, 0.02), 3.95 + i * 0.045, 0.3)

# Cena B (4.4–9): quarto, celular vibrando, título
add(lowpass(noise(4.6), 60) * 0.12, 4.4, 1.0)
for k in range(4):
    add(buzz(), 4.5 + k * 0.33, 0.55, -0.6)
add(pop(400, 0.15), 5.8, 0.5)
add(boom(0.6, 80, 40), 6.4, 0.6)
add(ding(784, 1.2), 6.5, 0.25)
for k in range(9):
    add(pop(500 + k * 60, 0.08), 6.5 + k * 0.08, 0.18)
music(6.4, 19.9, 0.9)

# transições
for tt in (8.95, 13.4, 24.6):
    add(whoosh(0.45), tt, 0.85)

# Cena C (9–13.6): contador subindo, ponto de interrogação, carimbo
for k in range(40):
    add(tick(1600 + k * 15), 9.6 + k * 0.045, 0.25)
add(coin(), 11.45, 0.8)
add(pop(300, 0.2), 11.5, 0.6)
add(stamp(), 12.4, 1.0)

# Cena D (13.6–20): motor de dia, ganhos e custos
add(engine(6.4, 58, 5), 13.6, 0.32, 0.1)
for tt in (0.5, 1.6, 2.6, 3.5, 4.4):
    add(coin(), 13.6 + tt, 0.5, 0.4)
add(errbeep(0.3), 14.6, 0.4, -0.4)
add(rainbed(1.6), 18.6, 0.6)

# Cena E (20–24.6): trovão, chuva forte, celular, conta suspensa
add(thunder(2.8), 20.0, 0.9)
add(rainbed(4.8), 20.0, 1.1)
add(errbeep(0.3), 20.9, 0.4, 0.4)
add(whoosh(0.4), 21.55, 0.7)
add(errbeep(0.6), 22.1, 0.6)
music(21.0, 24.6, 0.45, drums=False)

# Cena F (24.6–30): cortes da conta, saldo, CTA
for i in range(5):
    add(pop(260 - i * 20, 0.18), 25.6 + i * 0.42, 0.7)
    add(whoosh(0.3), 25.6 + i * 0.42, 0.3)
add(ding(1046, 1.2), 27.8, 0.4)
music(25.0, 30.0, 0.7)
add(boom(0.5, 110, 45), 28.6, 0.5)
add(pop(700, 0.12), 29.3, 0.5); add(pop(800, 0.12), 29.4, 0.5)

# ---------- master ----------
mix = np.stack([L, R], axis=1)
peak = np.max(np.abs(mix))
mix = np.tanh(mix / peak * 1.6) / np.tanh(1.6) * 0.89
mix[-int(0.4 * SR):] *= np.linspace(1, 0, int(0.4 * SR))[:, None]
pcm = (mix * 32767).astype(np.int16)
with wave.open('trilha.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print('trilha.wav ok', pcm.shape)
