# Kit de vídeo 2D/3D com o Claude

Um kit para o Claude montar vídeos por código: escrever o roteiro, narrar, legendar, animar
em 2D ou 3D, renderizar e **olhar o resultado** para corrigir antes de te entregar.

## O que tem aqui

| Peça | Para quê | Base (projeto confiável do GitHub) |
|---|---|---|
| `video/` | Animação 2D e 3D por código, render em MP4 | [Remotion](https://github.com/remotion-dev/remotion) + [three.js](https://github.com/mrdoob/three.js) |
| `.claude/skills/remotion-*` | Regras oficiais do Remotion para o Claude | [remotion-dev/skills](https://github.com/remotion-dev/skills) |
| `ferramentas/olho.py` | O "olho": detecta cenas e gera uma folha de quadros para o Claude ver | [PySceneDetect](https://github.com/Breakthrough/PySceneDetect) + ffmpeg |
| `ferramentas/transcrever.py` | Transcrição com o tempo de cada palavra (legendas animadas, SRT) | [faster-whisper](https://github.com/SYSTRAN/faster-whisper) |
| `ferramentas/narrar.py` | Narração em português, offline | [Piper](https://github.com/OHF-Voice/piper1-gpl) |
| `ferramentas/referencia.sh` | Baixa legenda e dados de vídeos do YouTube para estudar roteiros | [yt-dlp](https://github.com/yt-dlp/yt-dlp) |

## Como pedir um vídeo

Basta pedir ao Claude, por exemplo: *"faz um short de 40 segundos sobre X, no estilo do canal Y"*.
Ele segue o fluxo descrito em [`CLAUDE.md`](CLAUDE.md): roteiro → narração → legendas →
animação → render → revisão com o olho → correções.

## Rodar no seu computador

Precisa de Python 3.10+, Node.js 20+ e ffmpeg.

```bash
bash ferramentas/instalar.sh
```

```bash
cd video && npm run studio
```

O `studio` abre o editor visual do Remotion no navegador, para você ver e ajustar o vídeo.

## Exemplos incluídos

- **Batalha2D** (vertical, 13 s): dois lutadores, narração, legenda palavra por palavra,
  impacto com tremida de câmera, contagem e pergunta final, tudo sincronizado com a voz.
- **Arena3D** (vertical, 6 s): a mesma arena em 3D com câmera girando.

## Licenças

- Remotion é grátis para pessoas físicas e empresas de até 3 pessoas; empresas maiores precisam
  de licença paga. Confira em [remotion.dev/license](https://www.remotion.dev/docs/license).
- Voz `pt_BR-faber-medium`: treinada com dados abertos (conjunto "faber", CC0, ajustado a partir
  do Hi-Fi TTS). O programa Piper é GPL-3.0, o que vale para o código dele, não para o áudio gerado.
- Fonte Anton: SIL Open Font License, uso comercial liberado.
