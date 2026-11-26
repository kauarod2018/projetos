# Short estilo "RicksClips3000" em three.js

Short vertical (1080x1920, 30 fps, ~37 s) — **"Why Bakers Gave You 13 Loaves"** — feito 100% em three.js:
cenários 3D com iluminação/sombras/bloom, personagens cartoon (cabeça branca grande, corpo em cápsula,
braços e pernas finos, rosto desenhado), legenda palavra a palavra no centro-baixo e narração em inglês.

## Estrutura
- `script.json` — roteiro (frases + cena).
- `tts/make_voice.py` — narração com Kokoro TTS → `build/voice.wav` + `build/timing.json` (tempo de cada palavra).
- `tts/mix_audio.py` — mixa narração + música sintetizada + efeitos → `build/audio.wav`.
- `src/lib.js` — texturas procedurais, personagens, props.
- `src/main.js` — cenas (padaria, sala do trono, cidade/pelourinho), planos de câmera e legendas.
- `render.mjs` — renderiza frame a frame no Chromium headless e envia ao ffmpeg.

## Como gerar
```bash
npm install
pip install kokoro-onnx soundfile   # e baixe kokoro.onnx / voices.bin em tts/ (releases do kokoro-onnx)
python3 tts/make_voice.py
python3 tts/mix_audio.py
node render.mjs preview 1.5,12,21     # prévias em build/preview
node render.mjs video 30              # build/video_noaudio.mp4
ffmpeg -i build/video_noaudio.mp4 -i build/audio.wav -c:v copy -c:a aac -b:a 192k -shortest build/final.mp4
```
Para ver ao vivo no navegador: sirva a pasta (`npx serve .`) e abra `index.html`.
