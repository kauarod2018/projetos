# Loja de mapas visuais de revisão

Pacotes de mapas visuais de revisão em PDF, um por prova. Primeiro nicho: **UK Driving Theory Test** (Grã-Bretanha).
O plano completo está em [`docs/briefing-v3.md`](docs/briefing-v3.md), e o guia visual em [`DESIGN.md`](DESIGN.md).

**Status:** etapa 1 (estrutura + template A4 + 3 mapas de exemplo) pronta para validação de estilo. Os 3 mapas são
rascunho: ainda não foram conferidos no gov.uk e as placas oficiais ainda não foram importadas.

## Comandos

```bash
npm install
npm run validate        # confere todos os JSONs (rápido; roda antes de qualquer build)
npm run build:pdfs      # gera PDF/PNG/WebP de cada mapa + pacotes só com mapas verificados
npm run build:preview   # igual, mais pacotes PREVIEW com os rascunhos (nunca vender estes)
npm run validate:release  # o portão antes de vender: bloqueia rascunho, placa pendente, tópico sem mapa e placeholder
npm test                # testes do validador
npm run check           # tipos + validação + testes
```

Opções do build: `-- --only <id-do-mapa>` gera um mapa só; `-- --debug-layout` salva `*.OVERFLOW.png` quando uma página
estoura, para ver o que passou do limite.

Tudo sai em `dist/<nicho>/` (fora do Git):

```
maps/pdf/1-02-signs-warning-junctions.pdf   ← 1 página A4 por mapa
maps/png/…png                               ← 1588×2246, para conferência e anúncios
maps/webp/…webp                             ← 1200 px, para o site
packages/release/complete|basic/…pdf        ← só mapas verificados
packages/preview/…-PREVIEW.pdf              ← com rascunhos (build:preview)
manifest.json                               ← contagens que a página de vendas vai ler
```

## Como o projeto está organizado

```
content/
  site.json                       marca, e-mail, dados legais (placeholders {{…}} até preencher)
  i18n/en-GB.json                 rótulos impressos nos mapas (um arquivo por idioma)
  niches/uk-driving-theory/
    niche.json                    prova, áreas, cores, 14 tópicos DVSA, preços, garantia, versão
    numbers.json                  "Numbers to know": fonte única de todos os números
    maps/*.json                   1 arquivo por mapa
  assets/signs/gb/                manifesto das placas + SVGs oficiais (ver README da pasta)
schemas/                          formato de cada arquivo (zod)
lib/                              leitura do conteúdo e checagens de consistência
templates/                        HTML/CSS do mapa A4, página de créditos e visuais
scripts/                          validate e build-pdfs
tests/                            testes do validador
```

## Como adicionar um mapa

1. Copie um arquivo de `content/niches/uk-driving-theory/maps/` e troque `id` (igual ao nome do arquivo), `area`,
   `order` e `tier`.
2. Preencha os blocos. Os limites de texto estão em `schemas/map.ts` (`LIMITS`).
3. Números que aparecem em mais de um lugar vão em `numbers.json`, e o mapa aponta para eles (`numbersKey`).
4. `npm run validate`, depois `npm run build:pdfs -- --only <id>` e confira o PNG.
5. Só troque `review.status` para `verified` depois de conferir cada fato na fonte oficial, preenchendo `checkedOn`
   e `checkedAgainst`. Nunca a partir de memória ou de site de terceiros.

## Regras que o código garante

- Mapa que não cabe em uma página A4 **quebra o build**, com o tamanho do estouro.
- Mapa em rascunho sai com marca d'água DRAFT e não entra nos pacotes vendidos.
- O diagrama de rotatória é gerado por geometria a partir de `drivingSide`: mão inglesa e sentido horário saem certos
  por construção.
- Placa sem imagem oficial aparece só como contorno, e o modo release bloqueia.
- Garantia só aceita os prazos que a Hotmart oferece (7, 15, 21 ou 30 dias).
