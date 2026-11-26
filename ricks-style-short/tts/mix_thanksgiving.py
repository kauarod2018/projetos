"""Trilha do episódio Two Thanksgivings: narração + música + efeitos sincronizados."""
import json, numpy as np, soundfile as sf
HERE = __file__.rsplit('/', 1)[0]; D = f"{HERE}/../build/thanksgiving"
SR = 44100
tm = json.load(open(f"{D}/timing.json")); dur = tm["duration"]; N = int(SR * (dur + 0.3))
v, vsr = sf.read(f"{D}/voice.wav"); v = np.interp(np.linspace(0, len(v) - 1, int(len(v) * SR / vsr)), np.arange(len(v)), v)
mix = np.zeros(N); mix[:min(N, len(v))] += v[:N] * 1.0
rng = np.random.default_rng(7)
def S(*xs):
    n = max(len(x) for x in xs); o = np.zeros(n)
    for x in xs: o[:len(x)] += x
    return o
def add(sig, at, amp=1.0):
    i = int(at * SR); j = min(N, i + len(sig))
    if j > i: mix[i:j] += sig[:j - i] * amp
def tone(f, d, decay=6, harm=(1, .4, .15)):
    t = np.arange(int(SR * d)) / SR; return np.exp(-t * decay) * sum(a * np.sin(2 * np.pi * f * (k + 1) * t) for k, a in enumerate(harm))
def noise(d, smooth=1, decay=10):
    n = int(SR * d); x = rng.normal(0, 1, n); x = np.convolve(x, np.ones(smooth) / smooth, 'same'); return x * np.exp(-np.arange(n) / SR * decay)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
# música: ragtime/swing leve dos anos 30 (baixo alternado + acordes no contratempo + melodia de clarinete simples), 116 bpm
mus = np.zeros(N); beat = 60 / 116
prog = [[60, 64, 67], [57, 60, 64], [62, 65, 69], [55, 59, 62, 65]]
mel = [72, 74, 76, 79, 76, 74, 72, 69, 71, 72, 74, 71, 67, 69, 71, 72]
b, t = 0, 0.0
while t < dur:
    ch = prog[(b // 4) % 4]
    root = ch[0] - 24 + (7 if b % 2 else 0)
    i = int(t * SR); s = tone(hz(root), beat * 0.9, 5, (1, .5, .2)) * 0.32
    mus[i:i + len(s)] += s[:max(0, min(len(s), N - i))]
    if b % 2: 
        for n_ in ch: s = tone(hz(n_), beat * 0.4, 9) * 0.06; mus[i:i + len(s)] += s[:max(0, min(len(s), N - i))]
    if b % 2 == 0 and (b // 16) % 2 == 0:
        m = mel[(b // 2) % len(mel)]; s = tone(hz(m), beat * 1.6, 2.5, (1, .0, .3, .0, .1)) * 0.07; mus[i:i + len(s)] += s[:max(0, min(len(s), N - i))]
    s = noise(0.025, 1, 150) * 0.03; mus[i:i + len(s)] += s[:max(0, min(len(s), N - i))]
    b += 1; t += beat
fade = np.clip((dur - np.arange(N) / SR) / 1.5, 0, 1); mus *= fade
mix += mus * 0.42
def whoosh(d=0.32): n = int(SR * d); y = np.convolve(rng.normal(0, 1, n), np.ones(30) / 30, 'same'); return y * np.sin(np.pi * np.arange(n) / n) ** 2
cuts = [2.75, 5.44, 8.35, 11.11, 13.9, 16.9, 20.8, 23.5, 25.6, 27.64, 30.3, 33.67, 36.4, 39.55]
for c in cuts: add(whoosh(), c - 0.2, 0.12)
def wt(li, w): return next(x["t"] for x in tm["lines"][li]["words"] if x["w"].lower().startswith(w))
L = tm["lines"]
add(S(tone(880, 0.25, 12), tone(1320, 0.2, 14)), 4.25, 0.18)                 # susto: 2º peru
for i in range(5): add(tone(1046 + i * 120, 0.18, 14), wt(1, 'five') + i * 0.22 + 0.1, 0.12)   # círculos nas quintas
add(S(tone(523, 0.5, 5), tone(659, 0.5, 5)), wt(1, 'last') + 0.15, 0.12)      # dia 30
n = int(SR * 2.6); add(np.convolve(rng.normal(0, 1, n), np.ones(200) / 200, 'same') * np.sin(np.pi * np.arange(n) / n) * 3, 14.0, 0.1)  # vento da tumbleweed
add(noise(0.12, 4, 25), wt(3, 'moved') + 0.6, 0.12)                          # adesivo do peru
n = int(SR * 2.6); tt = np.arange(n) / SR; add(np.convolve(rng.normal(0, 1, n), np.ones(50) / 50, 'same') * (0.6 + 0.4 * np.sin(2 * np.pi * 3 * tt)) * np.sin(np.pi * tt / tt[-1]) * 2.2, 20.9, 0.18)  # multidão protestando
add(tone(1800, 0.35, 6, (1,)), 23.7, 0.08)                                    # apito do juiz
add(noise(0.08, 3, 30), 25.35, 0.25)                                          # bola cai
for k in range(6): add(noise(0.05, 2, 60), 25.6 + k * 0.12, 0.08)             # jornal girando
add(S(tone(392, 0.4, 7), tone(523, 0.4, 7)), 26.5, 0.15)
for k in range(8): add(tone(1400 + k * 50, 0.08, 30), 27.9 + k * 0.21, 0.06)  # peças virando no quadro
for h in [wt(6, 'settled') - 0.05, wt(6, 'settled') + 0.32]: add(S(noise(0.12, 2, 40), tone(160, 0.2, 18)), h, 0.4)   # martelo
for h in [wt(6, 'fourth'), wt(6, 'forever')]: add(S(noise(0.1, 6, 35), tone(120, 0.2, 20)), h, 0.45)                 # carimbo
n = int(SR * 2.4); tt = np.arange(n) / SR; add(np.convolve(rng.normal(0, 1, n), np.ones(30) / 30, 'same') * np.minimum(1, tt * 3) * np.exp(-tt * 0.8) * 2.0, L[7]["start"] + 0.2, 0.16)  # vivas no final
mix = mix / np.abs(mix).max() * 0.95
sf.write(f"{D}/audio.wav", mix, SR); print("ok", len(mix) / SR)
