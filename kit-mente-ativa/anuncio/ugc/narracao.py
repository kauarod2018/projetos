# Gera a narração (voz feminina pf_dora do Kokoro) de cada fala em falas.json e salva as durações.
# Uso: python3 narracao.py <pasta-de-saida> [falas.json]
# Cada fala é um texto ou {"texto": legenda, "fala": como pronunciar}.
import json, sys, os, soundfile as sf
from kokoro_onnx import Kokoro

saida = sys.argv[1]
arquivo = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), "falas.json")
k = Kokoro("/opt/kokoro/kokoro-v1.0.onnx", "/opt/kokoro/voices-v1.0.bin")
dur = []
for i, item in enumerate(json.load(open(arquivo))):
    texto = item if isinstance(item, str) else item["fala"]
    som, sr = k.create(texto, voice="pf_dora", speed=1.1, lang="pt-br")
    sf.write(os.path.join(saida, f"fala{i}.wav"), som, sr)
    dur.append(len(som) / sr)
json.dump(dur, open(os.path.join(saida, "duracoes.json"), "w"))
print("narração:", [round(d, 2) for d in dur])
