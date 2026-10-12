# Ajuda com Provas · loja de mapas visuais de revisão

Pacotes de mapas visuais de revisão em PDF, um por prova. A marca é traduzida por país: **Test Help** no Reino Unido.
Primeiro nicho: **UK Driving Theory Test** (Grã-Bretanha).

- Plano completo: [`docs/briefing-v3.md`](docs/briefing-v3.md)
- Guia visual: [`DESIGN.md`](DESIGN.md)
- O que foi revisado e o que falta: [`docs/revisao-geral.md`](docs/revisao-geral.md)

## Status

| Etapa | Situação |
|---|---|
| 1. Estrutura, template A4, 3 mapas de exemplo | ✅ pronta (mapas em rascunho) |
| 2. Página de vendas + home | ✅ pronta (modo preview) |
| 3. 6 bônus | ✅ prontos (rascunho) |
| 4. Criativos de carrossel | ✅ prontos (preview) |
| 5. Páginas legais + banner de cookies | ✅ prontas (revisar com advogado) |
| 6. Os outros 57 mapas | ⏳ a produzir, em lotes por área, com conferência no gov.uk |

Nada pode ser vendido ainda: os mapas não foram conferidos no gov.uk, as placas oficiais não foram importadas e faltam os
dados da empresa e os links da Hotmart. O comando `npm run validate:release` lista tudo o que falta.

## Comandos

```bash
npm install

# conteúdo
npm run validate            # confere todos os JSONs (rápido)
npm run validate:release    # o portão antes de vender: bloqueia rascunho, placa sem imagem oficial, tópico sem mapa, placeholder
npm test                    # 22 testes do validador
npm run check               # tipos + validação + testes

# PDFs (mapas, bônus e pacotes)
npm run build:pdfs          # tudo; pacotes só com conteúdo verificado
npm run build:preview       # igual, mais pacotes PREVIEW com rascunhos (nunca vender)

# criativos de anúncio (1080×1080 e 1080×1350)
npm run creatives           # preview, com a tarja PREVIEW · DO NOT USE
npm run creatives:release   # só com mapas verificados

# site (Next.js, exportação estática em out/)
npm run site:preview        # números do plano, faixa PREVIEW, noindex
npm run site:build          # versão para publicar: exige validate:release passando
npm run site:check          # testa out/ em 360, 390 e 1280 px: rolagem lateral, imagens, erros
npm run site:dev            # servidor local de desenvolvimento
```

Opções do build de PDFs: `-- --only <id-do-mapa>` gera um mapa só; `-- --debug-layout` salva `*.OVERFLOW.png` quando uma
página estoura.

## Onde fica cada coisa

```
content/
  site.json                         marca por idioma, domínio, e-mail, dados legais, pixel (placeholders {{…}} até preencher)
  i18n/en-GB.json                   rótulos impressos nos PDFs
  legal/en-GB.json                  Privacy, Terms, Refund e rótulos do site
  niches/uk-driving-theory/
    niche.json                      prova, áreas, cores, 14 tópicos DVSA, preços, garantia, versão
    inventory.json                  os 60 mapas planejados (cada mapa precisa bater com o plano)
    numbers.json                    números da prova: fonte única para mapas, bônus e flashcards
    maps/*.json                     1 arquivo por mapa
    bonuses/*.json                  os 6 bônus
    sales.json                      textos da página de vendas
    creatives.json                  slides do carrossel de anúncio
  assets/signs/gb/                  manifesto das placas (números TSRGD) + SVGs oficiais (ver README da pasta)
schemas/                            formato de cada arquivo (zod)
lib/                                leitura do conteúdo e checagens
templates/                          HTML/CSS dos mapas, bônus, flashcards e página de créditos
site/ + app/                        site Next.js (dados, componentes e páginas)
scripts/                            validate, build-pdfs, build-creatives, sync-site-assets, check-site
tests/                              testes do validador
dist/  out/  public/media/          gerados (fora do Git)
```

## Como adicionar um mapa

1. Confira se ele está em `inventory.json` (área, ordem, tier, título e tópicos DVSA).
2. Copie um arquivo de `maps/`, use o mesmo `id` do inventário e preencha os blocos. Os limites de texto estão em
   `schemas/map.ts` (`LIMITS`).
3. Números que aparecem em mais de um lugar vão em `numbers.json` (o mapa aponta com `numbersKey`).
4. `npm run validate`, depois `npm run build:pdfs -- --only <id>` e confira o PNG em `dist/`.
5. Só troque `review.status` para `verified` depois de conferir cada fato no gov.uk, preenchendo `checkedOn` e
   `checkedAgainst`. Nunca a partir de memória ou de site de terceiros.

## Regras que o código garante

- Página que não cabe no A4 (mapa, bônus ou flashcard) quebra o build, com o tamanho do estouro.
- Rascunho sai com marca d'água DRAFT e não entra nos pacotes vendidos, no site de produção nem nos criativos de release.
- A rotatória é desenhada por geometria a partir de `drivingSide`: mão inglesa e sentido horário saem certos por construção.
- Placa sem imagem oficial aparece só como contorno tracejado, e o modo release bloqueia.
- Os números da página de vendas (mapas, bônus, preços) vêm dos arquivos gerados, nunca digitados à mão; um placeholder
  com erro de digitação para o build.
- O pixel da Meta só carrega depois do "Accept" no banner; os links de compra levam os UTMs e o `fbclid` do anúncio.
- Garantia só aceita os prazos que a Hotmart oferece (7, 15, 21 ou 30 dias).

## Publicar (quando o conteúdo estiver verificado)

`npm run site:build` gera `out/`. Envie o conteúdo de `out/` para a hospedagem (Hostinger: pasta `public_html`; Vercel:
projeto estático). As URLs terminam com `/` (por exemplo `/uk-driving-theory/`).
