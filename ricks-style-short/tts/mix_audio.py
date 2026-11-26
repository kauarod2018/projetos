"""Mixa narração + música sintetizada (pizzicato divertido) + efeitos nos cortes."""
import json, numpy as np, soundfile as sf
HERE = __file__.rsplit('/', 1)[0]
SR = 44100
tm = json.load(open(f"{HERE}/../build/timing.json"))
dur = tm["duration"]; N = int(SR * (dur + 0.5))
voice, vsr = sf.read(f"{HERE}/../build/voice.wav")
idx = np.linspace(0, len(voice) - 1, int(len(voice) * SR / vsr)); voice = np.interp(idx, np.arange(len(voice)), voice)
mix = np.zeros(N); mix[:len(voice)] += voice[:N]
rng = np.random.default_rng(3)
def note(f, d, amp=0.2, kind='pluck'):
    t = np.arange(int(SR * d)) / SR
    if kind == 'pluck':
        env = np.exp(-t * 9); s = np.sin(2*np.pi*f*t) + 0.4*np.sin(4*np.pi*f*t) + 0.15*np.sin(6*np.pi*f*t)
    else:
        env = np.exp(-t * 3) * np.minimum(1, t * 50); s = np.sin(2*np.pi*f*t)
    return amp * env * s
def add(sig, at, buf):
    i = int(at * SR); j = min(len(buf), i + len(sig)); buf[i:j] += sig[:j - i]
# música: progressão I-vi-IV-V em Ré maior, 120 bpm, baixo + arpejo pizzicato
mus = np.zeros(N); beat = 0.5
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
prog = [[62, 66, 69], [59, 62, 66], [55, 59, 62], [57, 61, 64]]
arp = [0, 1, 2, 1, 0, 2, 1, 2]
b = 0; t = 0.0
while t < dur:
    ch = prog[(b // 8) % 4]
    if b % 4 == 0: add(note(hz(ch[0] - 24), 0.9, 0.35, 'bass'), t, mus)
    if b % 4 == 2: add(note(hz(ch[0] - 12), 0.5, 0.2, 'bass'), t, mus)
    add(note(hz(ch[arp[b % 8]] + 12), 0.4, 0.09), t, mus)
    if b % 2 == 1: add(rng.normal(0, 1, int(SR*0.03)) * np.exp(-np.arange(int(SR*0.03))/SR*120) * 0.04, t, mus)  # chimbal
    b += 1; t += beat / 2
mus *= np.clip((dur + 0.3 - np.arange(N) / SR) / 1.5, 0, 1)  # fade final
mix += mus * 0.45
# whoosh nos cortes (início de cada frase) + efeitos
def whoosh(d=0.35, amp=0.12):
    n = int(SR * d); x = rng.normal(0, 1, n); t = np.arange(n) / n
    y = np.convolve(x, np.ones(25) / 25, 'same')
    return amp * y * np.sin(np.pi * t) ** 2
for ln in tm["lines"][1:]: add(whoosh(), max(0, ln["start"] - 0.2), mix)
def word_t(li, w): return next(x["t"] for x in tm["lines"][li]["words"] if x["w"].lower().startswith(w))
# splat dos tomates
gt = word_t(3, 'garbage')
for k, dt in enumerate([0.0, 0.55, 1.05]):
    n = int(SR * 0.18); s = rng.normal(0, 1, n) * np.exp(-np.arange(n) / SR * 30) * 0.25
    add(np.convolve(s, np.ones(8) / 8, 'same'), gt + dt, mix)
# "ding" no 13º pão e na piscadinha
for at, f in [(word_t(5, 'extra') + 0.2, 1568), (tm["lines"][6]["start"] + 0.5, 2093)]:
    add(note(f, 0.8, 0.12, 'bass'), at, mix); add(note(f * 2, 0.6, 0.05, 'bass'), at, mix)
# multidão rindo (ruído modulado) no pelourinho
s0 = tm["lines"][3]["start"]; n = int(SR * 2.2); tt = np.arange(n) / SR
crowd = np.convolve(rng.normal(0, 1, n), np.ones(40) / 40, 'same') * (0.6 + 0.4 * np.sin(2*np.pi*5*tt)) * np.sin(np.pi * tt / tt[-1]) * 0.25
add(crowd, s0 + 0.2, mix)
mix = mix / np.abs(mix).max() * 0.95
sf.write(f"{HERE}/../build/audio.wav", mix, SR)
print("ok", len(mix) / SR)
