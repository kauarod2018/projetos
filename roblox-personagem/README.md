# Avatar em blocos (estilo Roblox) — Blender

Personagem em blocos com proporções R6 (tronco 2x2x1, braços e pernas 1x2x1, cabeça cilíndrica),
feito 100% por script no Blender 4.0, com esqueleto, rosto em geometria (olhos piscam, boca abre) e 7 animações:
Parado, Andar, Correr, Acenar, Pular, Falar, Dançar.

- `avatar.blend`: abra no Blender. As animações ficam no Action Editor / NLA (uma faixa por animação).
- `avatar.glb`: o mesmo modelo para three.js e para o kit dos Shorts (`GLTFLoader` + `AnimationMixer`).
- `build_avatar.py`: gera tudo. As cores ficam no topo do arquivo (`COL`).
- `viewer/`: página 3D para girar o boneco e trocar as animações.
- `previews/`: prints da interface do Blender e renders.

Para gerar de novo:

    blender -b --python build_avatar.py -- avatar.blend avatar.glb
