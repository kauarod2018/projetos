# Vídeo de física: "Por que a Lua não cai na Terra?"

Cada ferramenta tem um papel no pipeline:

| ferramenta | o que faz | arquivos |
|---|---|---|
| **Blender** (bpy, Cycles) | cenas 3D: Terra com textura gerada dos contornos reais, Lua orbitando, canhão de Newton com trajetórias calculadas por física (RK2), satélite em órbita | `blender/cenas.py`, `blender/textura_terra.js` |
| **Manim** | explicações matemáticas: curvatura da Terra (8 km → 5 m), queda livre (h = ½gt²), órbita (v = √gR), Lua caindo 1,4 mm/s | `manim/cenas.py` |
| **Remotion** | edição: sequência, transições, título, legendas sincronizadas, rótulos de capítulo, contador de km/h, tela final | `src/Video.tsx` |
| **FFmpeg** | tratamento da voz, estrelas atrás do Blender, interpolação de movimento até 30 fps, mixagem e montagem final com loudness de YouTube (-14 LUFS) | `scripts/clipes.sh`, `gerar.sh` |

Narração: Piper TTS (offline, pt-BR). Música e efeitos: sintetizados em `scripts/trilha.py`.

```bash
./gerar.sh
```

O roteiro fica em `roteiro.json`. A duração de cada cena segue a duração da fala, e Blender e Manim leem essas durações de `public/duracoes.json`.

Para editar a montagem ao vivo no navegador: `npm run estudio`.
