# Mente Ativa — Kit de Jogos Recortáveis para Idosos

Produto digital low ticket: um PDF de 31 páginas, para imprimir e recortar, feito para filhos e cuidadores jogarem junto com idosos.

## O que tem aqui

| Caminho | O quê |
|---|---|
| `dist/Kit-Mente-Ativa-Jogos-Recortaveis.pdf` | **O produto** (é o arquivo que o cliente recebe) |
| `pagina-de-vendas/index.html` | Página de vendas pronta (responsiva) |
| `pagina-de-vendas/img/` | Prévias das páginas do kit, geradas automaticamente |
| `src/conteudo.mjs` | Todas as figuras, palavras, ditados e perguntas |
| `src/cenas.mjs` | Ilustrações dos quebra-cabeças (SVG) |
| `src/build.mjs` | Gera o PDF e as prévias |

## Conteúdo do kit

1. Jogo da Memória (12 pares)
2. Dominó de Figuras (28 peças)
3. Bingo das Lembranças (6 cartelas + 24 fichas)
4. O que combina com o quê? (12 pares de associação)
5. Sequências do Dia a Dia (4 histórias de 4 passos)
6. Complete o Ditado (12 ditados populares)
7. Quebra-cabeças (6 e 12 peças)
8. Cartas de Conversa (24 perguntas de memória afetiva)

Além disso: boas-vindas com guia para o cuidador, sumário, ficha de acompanhamento e gabarito.
Cada jogo tem uma página de instruções com níveis "para facilitar" e "para desafiar".

## Como editar e gerar de novo

```bash
npm install
npm run build
```

Edite `src/conteudo.mjs` para trocar figuras ou textos. O build recria o PDF em `dist/` e as imagens em `pagina-de-vendas/img/`.

## Antes de publicar a página de vendas

- [ ] Troque `href="#CHECKOUT"` em `pagina-de-vendas/index.html` pelo link da Hotmart, Kiwify, Eduzz etc.
- [ ] Confira o preço (R$ 19,90, "de R$ 47,00") e a garantia de 7 dias com a plataforma
- [ ] Adicione depoimentos **reais** quando tiver os primeiros clientes (não há depoimentos inventados na página)
- [ ] Adicione o Pixel/Analytics, se for rodar anúncios
- [ ] Publique a pasta `pagina-de-vendas/` (Vercel, Netlify, Hostinger...)

## Ideias de order bump e upsell

- **Order bump (R$ 9,90):** Kit Datas Comemorativas (bingo de festa junina, cartas de Natal)
- **Upsell (R$ 27):** Caderno de Atividades (caça-palavras em letra grande, ligue os pontos, pintura)
- **Upsell:** Livro de Memórias da Família (preenchido a partir das Cartas de Conversa)

> Material de lazer e estímulo. Não fazer promessas de prevenção ou tratamento de doenças nos anúncios.
