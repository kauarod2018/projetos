# Ferramentas de vídeo

Rode `./video/setup.sh` para instalar tudo (leva ~2 min).

| Ferramenta | Para quê |
|---|---|
| FFmpeg | cortes, junção, formatos, filtros, legendas, áudio |
| librosa | detectar batidas/BPM para cortar no ritmo da música |
| auto-editor | remover silêncios automaticamente |
| PySceneDetect | achar as trocas de cena de um vídeo de referência |
| faster-whisper | transcrição/legendas com tempo por palavra (*) |
| Remotion (`remotion/`) | textos animados, intros, motion graphics em React |
| colour-science | gerar LUTs (.cube) para correção de cor |
| OpenTimelineIO | exportar a linha do tempo para Premiere/DaVinci/Final Cut |

(*) O modelo do Whisper é baixado de `us.aws.cdn.hf.co`; esse domínio precisa
estar liberado na configuração de rede do ambiente.
