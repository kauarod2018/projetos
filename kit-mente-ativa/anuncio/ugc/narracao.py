# Gera a narração (voz feminina pf_dora do Kokoro) de cada fala em falas.json e salva as durações.
# Uso: python3 narracao.py <pasta-de-saida>
import json, sys, os, soundfile as sf
from kokoro_onnx import Kokoro

saida = sys.argv[1]
k = Kokoro("/opt/kokoro/kokoro-v1.0.onnx", "/opt/kokoro/voices-v1.0.bin")
dur = []
for i, texto in enumerate(json.load(open(os.path.join(os.path.dirname(__file__), "falas.json")))):
    som, sr = k.create(texto, voice="pf_dora", speed=1.1, lang="pt-br")
    sf.write(os.path.join(saida, f"fala{i}.wav"), som, sr)
    dur.append(len(som) / sr)
json.dump(dur, open(os.path.join(saida, "duracoes.json"), "w"))
print("narração:", [round(d, 2) for d in dur])
