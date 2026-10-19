# Trilha leve estilo ukulele (Karplus-Strong), C - G - Am - F a 100 bpm. Uso: python3 musica.py <saida.wav> <segundos>
import sys, numpy as np, soundfile as sf

SR = 44100
saida, total = sys.argv[1], float(sys.argv[2])
rng = np.random.default_rng(7)

def corda(freq, dur, brilho=0.996):
    n, p = int(SR * dur), int(SR / freq)
    buf = rng.uniform(-1, 1, p)
    out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = brilho * 0.5 * (buf[i % p] + buf[(i + 1) % p])
    return out

nota = lambda m: 440 * 2 ** ((m - 69) / 12)
acordes = [[60, 64, 67, 72], [55, 59, 62, 67], [57, 60, 64, 69], [53, 57, 60, 65]]
baixos = [36, 43, 45, 41]
batida = 60 / 100
mix = np.zeros(int(SR * (total + 2)))

def soma(sinal, t, vol):
    i = int(t * SR); f = min(len(mix), i + len(sinal))
    mix[i:f] += sinal[: f - i] * vol

t, c = 0.0, 0
padrao = [0, 1, 2, 3, 2, 1, 2, 3]  # arpejo em colcheias
while t < total:
    ac = acordes[c % 4]
    soma(corda(nota(baixos[c % 4]), 2.5, 0.998), t, 0.35)
    for k, idx in enumerate(padrao):
        soma(corda(nota(ac[idx]), 1.2), t + k * batida / 2, 0.22 if k % 2 == 0 else 0.15)
    # chacoalho suave nos contratempos
    for k in range(8):
        ruido = rng.normal(0, 1, int(SR * 0.05)) * np.exp(-np.linspace(0, 8, int(SR * 0.05)))
        soma(ruido, t + k * batida / 2 + batida / 4, 0.025)
    t += 4 * batida; c += 1

mix = mix[: int(SR * total)]
fade = int(SR * 1.5)
mix[-fade:] *= np.linspace(1, 0, fade)
mix /= np.max(np.abs(mix)) * 1.1
sf.write(saida, np.stack([mix, mix], 1), SR)
print("trilha ok", total, "s")
