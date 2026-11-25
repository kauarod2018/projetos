#!/usr/bin/env python3
"""Gera a trilha (música + efeitos sonoros) de um Short a partir da linha do tempo JSON.

Tudo é sintetizado com numpy (sem samples externos, sem direitos autorais).

Uso:
    python3 scripts/gerar_audio.py src/videos/waterlooTimeline.json public/audio/waterloo.wav
"""
import json
import sys
import wave

import numpy as np

SR = 44100
rng = np.random.default_rng(1815)


# ---------------- utilitários ----------------
def t_axis(dur):
    return np.arange(int(dur * SR)) / SR


def lowpass(x, cutoff):
    """Filtro passa-baixa via FFT (suave)."""
    n = len(x)
    if n == 0:
        return x
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    X *= 1 / np.sqrt(1 + (f / cutoff) ** 4)
    return np.fft.irfft(X, n)


def highpass(x, cutoff):
    n = len(x)
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    r = (f / cutoff) ** 4
    X *= np.sqrt(r / (1 + r))
    return np.fft.irfft(X, n)


def bandpass(x, lo, hi):
    return highpass(lowpass(x, hi), lo)


def env(n, attack, decay_tau):
    t = np.arange(n) / SR
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    return a * np.exp(-t / decay_tau)


def noise(dur):
    return rng.standard_normal(int(dur * SR))


def norm(x, peak=1.0):
    m = np.max(np.abs(x)) or 1
    return x / m * peak


# ---------------- efeitos sonoros ----------------
def sfx_boom():
    d = 2.2
    t = t_axis(d)
    freq = 34 + 40 * np.exp(-t * 6)
    body = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t * 2.2)
    crack = lowpass(noise(d), 900) * np.exp(-t * 9)
    rumble = lowpass(noise(d), 160) * np.exp(-t * 1.6)
    return norm(body * 1.0 + crack * 0.6 + rumble * 0.7, 1.0)


def sfx_explosion():
    d = 2.6
    t = t_axis(d)
    n1 = lowpass(noise(d), 1400) * env(len(t), 0.005, 0.35)
    n2 = lowpass(noise(d), 220) * env(len(t), 0.01, 0.9)
    sub = np.sin(2 * np.pi * np.cumsum(28 + 50 * np.exp(-t * 5)) / SR) * np.exp(-t * 2)
    crackle = (rng.random(len(t)) > 0.9975) * rng.standard_normal(len(t)) * np.exp(-t * 2.5) * 3
    return norm(n1 * 0.8 + n2 + sub * 0.9 + lowpass(crackle, 4000) * 0.5, 1.0)


def sfx_impact():
    d = 1.4
    t = t_axis(d)
    hit = np.sin(2 * np.pi * np.cumsum(45 + 90 * np.exp(-t * 18)) / SR) * np.exp(-t * 4)
    click = highpass(noise(d), 2000) * np.exp(-t * 40)
    tail = bandpass(noise(d), 300, 5000) * np.exp(-t * 3) * 0.25
    return norm(hit + click * 0.5 + tail, 1.0)


def sfx_whoosh():
    d = 0.7
    n = int(d * SR)
    t = np.arange(n) / SR
    x = noise(d)
    # varredura: mistura de bandas com envelope em sino
    lo = bandpass(x, 300, 1500)
    hi = bandpass(x, 1500, 6000)
    k = np.sin(np.pi * t / d)
    sweep = t / d
    return norm((lo * (1 - sweep) + hi * sweep) * k**2, 0.6)


def sfx_thunder():
    d = 4.0
    t = t_axis(d)
    crack = highpass(noise(d), 1500) * np.exp(-t * 18) * 0.6
    rumble = lowpass(noise(d), 120)
    mod = lowpass(np.abs(noise(d)), 3) * 6
    rumble *= (0.3 + mod) * env(len(t), 0.05, 1.4)
    return norm(crack + rumble, 0.9)


def sfx_cheer():
    d = 2.6
    t = t_axis(d)
    crowd = np.zeros(len(t))
    for fc in (500, 800, 1200, 2400):
        crowd += bandpass(noise(d), fc * 0.7, fc * 1.3) * (0.6 + 0.4 * np.sin(2 * np.pi * rng.uniform(3, 7) * t + rng.uniform(0, 6)))
    e = np.clip(t / 0.3, 0, 1) * np.exp(-np.clip(t - 1.2, 0, None) * 1.8)
    return norm(crowd * e, 0.7)


def sfx_sparkle():
    d = 1.6
    t = t_axis(d)
    out = np.zeros(len(t))
    for i in range(9):
        st = int(i * 0.07 * SR)
        f = rng.uniform(1800, 4200)
        seg = t[: len(t) - st]
        out[st:] += np.sin(2 * np.pi * f * seg) * np.exp(-seg * 7) * 0.4
    return norm(out, 0.45)


def sfx_pop():
    d = 0.16
    t = t_axis(d)
    f = 500 + 900 * (t / d)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 32), 0.45)


def sfx_sad():
    d = 3.0
    t = t_axis(d)
    out = np.zeros(len(t))
    for f in (110.0, 130.81, 164.81, 220.0):  # lá menor
        for det in (-0.6, 0.6):
            out += np.sign(np.sin(2 * np.pi * (f + det) * t)) * 0.15 + np.sin(2 * np.pi * (f + det) * t) * 0.3
    out = lowpass(out, 900)
    e = np.clip(t / 0.8, 0, 1) * np.exp(-np.clip(t - 1.5, 0, None) * 1.5)
    return norm(out * e, 0.5)


def sfx_volley():
    d = 2.0
    out = np.zeros(int(d * SR))
    for i in range(10):
        st = int(rng.uniform(0, 0.28) * SR)
        c = highpass(noise(0.25), 700) * np.exp(-np.arange(int(0.25 * SR)) / SR * 30)
        c += lowpass(noise(0.25), 400) * np.exp(-np.arange(int(0.25 * SR)) / SR * 12) * 0.8
        out[st : st + len(c)] += c
    t = t_axis(d)
    out += lowpass(noise(d), 300) * np.exp(-t * 2.5) * 0.6
    return norm(out, 0.95)


def sfx_gallop(frames, fps):
    d = frames / fps + 0.4
    out = np.zeros(int(d * SR))
    step = 0.36
    k = 0
    tt = 0.0
    while tt < d - 0.3:
        for off in (0.0, 0.08, 0.17):
            st = max(0, int((tt + off + rng.uniform(-0.01, 0.01)) * SR))
            n = int(0.12 * SR)
            if st + n >= len(out):
                break
            tn = np.arange(n) / SR
            thump = np.sin(2 * np.pi * (90 + 60 * np.exp(-tn * 40)) * tn) * np.exp(-tn * 35)
            thump += lowpass(noise(0.12), 1200) * np.exp(-tn * 50) * 0.5
            out[st : st + n] += thump
        tt += step
        k += 1
    fade = np.minimum(1, np.minimum(np.arange(len(out)) / (0.3 * SR), (len(out) - np.arange(len(out))) / (0.3 * SR)))
    return norm(out * fade, 0.7)


def amb_rain(dur):
    x = bandpass(noise(dur), 900, 9000) * 0.5
    drops = (rng.random(len(x)) > 0.996) * rng.standard_normal(len(x))
    x += highpass(drops, 2500) * 0.6
    return norm(x, 0.35)


def amb_sea(dur):
    t = t_axis(dur)
    x = lowpass(noise(dur), 700)
    waves = 0.45 + 0.55 * (0.5 + 0.5 * np.sin(2 * np.pi * t / 5.5))
    return norm(x * waves, 0.3)


SFX = {
    "boom": sfx_boom,
    "explosion": sfx_explosion,
    "impact": sfx_impact,
    "whoosh": sfx_whoosh,
    "thunder": sfx_thunder,
    "cheer": sfx_cheer,
    "sparkle": sfx_sparkle,
    "pop": sfx_pop,
    "sad": sfx_sad,
    "volley": sfx_volley,
}
GAIN = {"boom": 0.9, "explosion": 0.85, "impact": 0.8, "whoosh": 0.45, "thunder": 0.8, "cheer": 0.55,
        "sparkle": 0.45, "pop": 0.35, "sad": 0.55, "volley": 0.75, "gallop": 0.55}


# ---------------- música ----------------
def note_freq(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def saw(f, t):
    return 2 * ((f * t) % 1.0) - 1


def music(total_s, intensity_curve, bpm=96):
    """Progressão épica em lá menor (Am - F - C - G) com cordas, baixo e tambores."""
    n = int(total_s * SR)
    t = np.arange(n) / SR
    beat = 60 / bpm
    bar = beat * 4
    chords = [(57, 60, 64), (53, 57, 60), (48, 52, 55), (55, 59, 62)]  # Am F C G
    pad = np.zeros(n)
    bass = np.zeros(n)
    for b in range(int(total_s / bar) + 1):
        s = int(b * bar * SR)
        e = min(n, int((b + 1) * bar * SR))
        if s >= n:
            break
        tt = t[s:e] - b * bar
        ch = chords[b % 4]
        seg = np.zeros(e - s)
        for m in ch:
            for det in (-0.25, 0.25):
                seg += saw(note_freq(m) * (1 + det / 100), tt + b * bar) * 0.12
            seg += saw(note_freq(m + 12), tt + b * bar) * 0.04
        a = np.clip(tt / 0.25, 0, 1) * np.clip((bar - tt) / 0.15, 0, 1)
        pad[s:e] += seg * a
        root = note_freq(ch[0] - 24)
        bass[s:e] += (np.sin(2 * np.pi * root * (tt + b * bar)) * 0.5 + saw(root, tt + b * bar) * 0.15) * a
    pad = lowpass(pad, 1800)
    bass = lowpass(bass, 400)

    drums = np.zeros(n)
    snare = np.zeros(n)
    kick_len = int(0.6 * SR)
    tk = np.arange(kick_len) / SR
    taiko = np.sin(2 * np.pi * np.cumsum(55 + 70 * np.exp(-tk * 25)) / SR) * np.exp(-tk * 6)
    taiko += lowpass(rng.standard_normal(kick_len), 600) * np.exp(-tk * 30) * 0.4
    sn_len = int(0.18 * SR)
    ts = np.arange(sn_len) / SR
    snare_hit = bandpass(rng.standard_normal(sn_len), 1200, 7000) * np.exp(-ts * 25)
    nbeats = int(total_s / beat)
    for i in range(nbeats):
        pos = int(i * beat * SR)
        it = intensity_curve[min(pos, n - 1)]
        if it < 0.4:
            continue
        pattern = [1, 0, 0.6, 0] if it < 0.8 else [1, 0.5, 0.8, 0.6]
        k = pattern[i % 4]
        if k and pos + kick_len < n:
            drums[pos : pos + kick_len] += taiko * k
        if it >= 0.6:
            for sub in range(4 if it >= 0.9 else 2):
                p2 = pos + int(sub * beat / (4 if it >= 0.9 else 2) * SR)
                if p2 + sn_len < n:
                    snare[p2 : p2 + sn_len] += snare_hit * (0.35 if sub else 0.55)
    ic = intensity_curve
    mix = pad * (0.35 + 0.65 * ic) + bass * (0.3 + 0.7 * ic) + drums * ic * 0.9 + snare * ic * 0.35
    return mix


def reverb(x, seconds=1.4, wet=0.22):
    ir_n = int(seconds * SR)
    ti = np.arange(ir_n) / SR
    ir = rng.standard_normal(ir_n) * np.exp(-ti * 4.5)
    ir[0] = 0
    ir = lowpass(ir, 5000)
    ir /= np.sqrt(np.sum(ir**2))
    n = len(x) + ir_n
    size = 1 << (n - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[: len(x)]
    return x * (1 - wet) + y * wet


def main():
    tl_path, out_path = sys.argv[1], sys.argv[2]
    tl = json.load(open(tl_path))
    fps = tl["fps"]
    scenes = tl["scenes"]
    total_frames = sum(s["frames"] for s in scenes)
    total_s = total_frames / fps + 1.0
    n = int(total_s * SR)

    # curva de intensidade da música (suavizada entre cenas)
    ic = np.zeros(n)
    start = 0
    for s in scenes:
        a = int(start / fps * SR)
        b = int((start + s["frames"]) / fps * SR)
        ic[a:b] = s.get("music", 0.5)
        start += s["frames"]
    ic[int(start / fps * SR):] = scenes[-1].get("music", 0.5)
    k = int(0.4 * SR)
    ic = np.convolve(ic, np.ones(k) / k, mode="same")

    mus = music(total_s, ic)
    sfx_l = np.zeros(n)
    sfx_r = np.zeros(n)
    amb = np.zeros(n)

    start = 0
    for s in scenes:
        for cue in s.get("cues", []):
            f, name = cue[0], cue[1]
            pos = int((start + f) / fps * SR)
            if name == "gallop":
                snd = sfx_gallop(cue[2] if len(cue) > 2 else 40, fps)
            else:
                snd = SFX[name]()
            snd = snd * GAIN.get(name, 0.6)
            end = min(n, pos + len(snd))
            pan = rng.uniform(-0.35, 0.35)
            sfx_l[pos:end] += snd[: end - pos] * (1 - pan)
            sfx_r[pos:end] += snd[: end - pos] * (1 + pan)
        if s.get("ambient"):
            a = int(start / fps * SR)
            dur = s["frames"] / fps
            snd = amb_rain(dur) if s["ambient"] == "rain" else amb_sea(dur)
            fade = np.minimum(1, np.minimum(np.arange(len(snd)) / (0.4 * SR), (len(snd) - np.arange(len(snd))) / (0.4 * SR)))
            amb[a : a + len(snd)] += (snd * fade)[: n - a]
        start += s["frames"]

    sfx_l = reverb(sfx_l)
    sfx_r = reverb(sfx_r)
    mus = norm(reverb(mus, 2.0, 0.25), 0.5)

    left = mus + sfx_l * 0.8 + amb
    right = mus + sfx_r * 0.8 + amb
    # fade final e limitador suave
    fade_out = np.ones(n)
    fo = int(1.5 * SR)
    fade_out[-fo:] = np.linspace(1, 0, fo)
    stereo = np.stack([left, right], axis=1) * fade_out[:, None]
    stereo = np.tanh(stereo * 1.2) / np.tanh(1.2)
    stereo = norm(stereo, 0.92)
    pcm = (stereo * 32767).astype(np.int16)
    with wave.open(out_path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print(f"ok: {out_path} ({total_s:.1f}s)")


if __name__ == "__main__":
    main()
