# Countryballs Shorts

Shorts de guerras históricas com countryballs, feitos com código (Remotion + React + SVG).
Formato 1080x1920 a 30 fps, pronto para YouTube Shorts, TikTok e Reels.

## Como usar

```bash
npm install
npm run studio   # abre o editor no navegador para ver e ajustar
npm run render   # gera out/guerra-do-paraguai.mp4
npx remotion render NapoleaoRussia out/napoleao-russia-1812.mp4
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
- `src/components/effects.tsx` – neve/nevasca, brasas, chamas, vinheta, granulação, flash de impacto,
  raio, zoom "soco", Ken Burns, clarão de canhão, contador animado, etiqueta de nome, calendário voando
- `src/components/props.tsx` – canhão com recuo, silhueta de Moscou (com versão em chamas), ponte
- Personagens: `CountryBall` aceita `hat` (`bicorne` Napoleão, `crown` rei/czar, `kutuzov`, `ushanka`,
  `papakha`), `eyepatch`, `frozen` (congelando) e `shiver` (tremendo de frio)
- `src/components/map.tsx` – mapa aberto (Mercator) com câmera animada (`cameraAt`), países pintados
  com a bandeira, regiões ocupadas (`regions`: revelação circular + listras), setas (`MapArrow`),
  marcadores (`MapPin`), nomes (`MapLabel`) e countryballs no mapa (`MapBall`, por longitude/latitude)
- `src/geo/regions.json` – estados/províncias usados (Natural Earth, domínio público). Países vêm do pacote `world-atlas`
- `src/videos/paraguaiMapas.tsx` – cenas em mapa da Guerra do Paraguai
- `src/videos/GuerraDoParaguai.tsx` – cenas em desenho e a ordem final do Short (`SCENES`)
- `src/videos/Napoleao.tsx` – "O maior erro de Napoleão" (Rússia, 1812)

## Novo vídeo

1. Adicione as bandeiras que faltam em `src/flags/index.tsx` (e no objeto `FLAGS`).
2. Copie `src/videos/GuerraDoParaguai.tsx`, troque as cenas e textos.
3. Registre a nova `<Composition>` em `src/Root.tsx`.

## Licença do Remotion

O Remotion é gratuito para uso individual e empresas de até 3 pessoas.
