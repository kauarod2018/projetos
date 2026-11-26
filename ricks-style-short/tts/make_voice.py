"""Gera a narração com Kokoro e o arquivo de timings (frases e palavras)."""
import json, re, sys, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

HERE = __file__.rsplit('/', 1)[0]
script = json.load(open(f"{HERE}/../script.json"))
voice = script.get("voice", "am_michael"); speed = script.get("speed", 1.15)
k = Kokoro(f"{HERE}/kokoro.onnx", f"{HERE}/voices.bin")
SR = 24000
gap = 0.12
audio, t, out = [], 0.35, []
audio.append(np.zeros(int(SR * t), np.float32))

def trim(a, thr=0.008):
    idx = np.where(np.abs(a) > thr)[0]
    if not len(idx): return a
    return a[max(0, idx[0] - 240): idx[-1] + 600]

for i, line in enumerate(script["lines"]):
    s, sr = k.create(line["text"], voice=voice, speed=line.get("speed", speed), lang="en-us")
    s = trim(s.astype(np.float32))
    dur = len(s) / SR
    words = line["text"].split()
    # peso por palavra ~ nº de letras + pausa em pontuação
    w = [len(re.sub(r"[^A-Za-z0-9]", "", x)) + 2 + (3 if re.search(r"[,.!?]$", x) else 0) for x in words]
    tot = sum(w); acc = 0; wt = []
    for x, ww in zip(words, w):
        wt.append({"w": x, "t": round(t + dur * acc / tot, 3)})
        acc += ww
    out.append({"i": i, "start": round(t, 3), "end": round(t + dur, 3), "text": line["text"], "words": wt})
    audio.append(s); t += dur
    p = line.get("pause", gap)
    audio.append(np.zeros(int(SR * p), np.float32)); t += p

audio.append(np.zeros(int(SR * 0.6), np.float32)); t += 0.6
a = np.concatenate(audio)
a = a / max(1e-6, np.abs(a).max()) * 0.9
sf.write(f"{HERE}/../build/voice.wav", a, SR)
json.dump({"duration": round(t, 3), "lines": out}, open(f"{HERE}/../build/timing.json", "w"), indent=1)
print("duration", t)
