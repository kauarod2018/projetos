# Countryballs Shorts

Shorts de guerras históricas com countryballs, feitos com código (Remotion + React + SVG).
Formato 1080x1920 a 30 fps, pronto para YouTube Shorts, TikTok e Reels.

## Como usar

```bash
npm install
npm run studio   # abre o editor no navegador para ver e ajustar
npm run render   # gera out/guerra-do-paraguai.mp4
```

## Estrutura

- `src/flags/` – bandeiras em SVG (Império do Brasil, Argentina, Uruguai, Paraguai)
- `src/components/CountryBall.tsx` – o countryball: bandeira, olhos com expressões
  (`neutral`, `happy`, `angry`, `surprised`, `sad`, `determined`, `dead`), piscar,
  rachaduras (`damage`) e curativos (`bandage`)
- `src/components/ui.tsx` – legendas palavra a palavra, etiqueta de data, balão de fala,
  transição de cena, tremor de câmera, nota de rodapé
- `src/components/scenery.tsx` – céu, raios, morros, água, fumaça, pergaminho, navio
- `src/components/fx.tsx` – explosão, bala de canhão, linhas de velocidade
- `src/videos/GuerraDoParaguai.tsx` – o Short, dividido em cenas com duração em frames

## Novo vídeo

1. Adicione as bandeiras que faltam em `src/flags/index.tsx` (e no objeto `FLAGS`).
2. Copie `src/videos/GuerraDoParaguai.tsx`, troque as cenas e textos.
3. Registre a nova `<Composition>` em `src/Root.tsx`.

## Licença do Remotion

O Remotion é gratuito para uso individual e empresas de até 3 pessoas.
