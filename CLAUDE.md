# Kit de vídeo — instruções para o Claude

Este repositório serve para produzir vídeos (principalmente 2D, às vezes 3D) por código.
Responda e escreva sempre em português do Brasil.

## Estrutura

- `video/` — projeto Remotion (React). Composições registradas em `video/src/Root.tsx`.
  - `Batalha2D.tsx` exemplo 2D sincronizado com narração; `Arena3D.tsx` exemplo 3D (three.js);
    `Legendas.tsx` legenda palavra por palavra; `fontes.ts` fonte local (Anton).
  - `video/public/` áudio, imagens e fontes usados no vídeo (referência com `staticFile()`).
- `ferramentas/` — scripts Python/Bash (rodar sempre com `.venv/bin/python -I`).
- `roteiros/` — roteiros em `.txt` (uma fala por linha; `#` = anotação de cena, não é narrado).
- `saida/` — tudo que é gerado (vídeos, quadros, transcrições). Não vai para o git.
- `.claude/skills/remotion-*` — skills oficiais do Remotion. Siga `remotion-best-practices`.

Se `.venv` ou `video/node_modules` não existirem: `bash ferramentas/instalar.sh`.

## Fluxo para fazer um vídeo

1. **Roteiro** em `roteiros/<nome>.txt`. Para canais do usuário, use as skills dele
   (`roteiro-e-se-voce`, `referencia-videos-pov`, `modelo-visual-batalhas`). Para estudar vídeos
   que funcionam: `bash ferramentas/referencia.sh URL` (baixa legenda e dados, sem o vídeo).
2. **Narração**: `.venv/bin/python -I ferramentas/narrar.py roteiros/<nome>.txt video/public/<nome>.wav`
   (ou use o áudio que o usuário mandar).
3. **Legendas com tempo de cada palavra**:
   `.venv/bin/python -I ferramentas/transcrever.py video/public/<nome>.wav --saida video/src/dados/<nome> --roteiro roteiros/<nome>.txt`
   O `--roteiro` corrige o texto com o roteiro original; o Whisper só fornece os tempos.
4. **Animar** no Remotion, sincronizando eventos com as palavras (veja `quando()` em `Root.tsx`).
   Animações só com `useCurrentFrame()` + `interpolate()`/`spring()` — nada de CSS animation
   nem `useFrame()` no 3D.
5. **Renderizar**: `cd video && npx tsc && npx remotion render <Id> ../saida/videos/<nome>.mp4`
6. **Revisar com o "olho"** (obrigatório antes de entregar):
   `.venv/bin/python -I ferramentas/olho.py saida/videos/<nome>.mp4` e abra `folha.jpg` com Read.
   Para um instante exato: `--quadro 6.7`. Procure: texto cortado ou sobreposto, elementos fora
   do quadro, legenda quebrando frase no lugar errado, momentos-chave fora de sincronia.
   Corrija e renderize de novo até ficar limpo.

## Observações do ambiente na nuvem

- O Remotion usa o Chromium pré-instalado (configurado em `video/remotion.config.ts`).
- Fontes do Google não carregam no render na nuvem: coloque a fonte em `video/public/fonts/`.
- O YouTube às vezes responde 429 para servidores; espere e tente de novo.
- Não baixar vídeos do YouTube aqui (o host de vídeo é bloqueado); só legendas e dados.
