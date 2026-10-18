# Mente Ativa — Coleção de Jogos e Desafios para Imprimir

Produto digital low ticket para filhos e cuidadores de idosos: um PDF de 63 páginas, com visual florido e acolhedor, dividido em 6 partes.

| Caminho | O quê |
|---|---|
| `dist/Kit-Mente-Ativa.pdf` | **O produto** (é o arquivo que o cliente recebe) |
| `pagina-de-vendas/` | Página de vendas (ainda descreve a versão anterior do kit) |
| `src/conteudo.mjs` | Textos: sequências, enigmas, temas, ditados, problemas de xadrez, palitos |
| `src/geradores.mjs` | Sudoku (solução única), caça-palavras, pirâmides e cortes de encaixe |
| `src/tangram.mjs` | Peças e figuras do tangram, com validação geométrica |
| `src/cenas.mjs` | Ilustrações dos quebra-cabeças |
| `src/flores.mjs` | Ornamentos florais (guirlanda, buquês, cantos e vinhetas) |
| `src/build.mjs` | Layout e geração do PDF |

## Conteúdo

- **Parte I · Raciocínio:** 6 sudokus (fácil, médio, difícil), 16 sequências lógicas, 4 pirâmides de soma, 10 enigmas
- **Parte II · Palavras:** 4 caça-palavras temáticos, 20 anagramas, 15 ditados para completar
- **Parte III · Quebra-cabeças:** 3 ilustrações com cortes de encaixe (12, 20 e 30 peças)
- **Parte IV · Desafios:** tangram (7 peças + 6 figuras), torre de Hanói, desafios com palitos
- **Parte V · Jogos de tabuleiro:** dominó (28 peças), xadrez (regras, tabuleiro, 32 peças, 6 problemas de mate em 1), damas brasileiras, trilha
- **Parte VI · Para jogar juntos:** Bingo das Canções (6 cartelas + 24 fichas), Quiz de Antigamente (24 cartas), Mímica (18 cartas), Adedonha, Batalha Naval, Jogo dos Pontinhos, Cartas de Conversa (24)

Além disso: apresentação com guia para quem acompanha, sumário, registro de atividades e respostas de tudo.
Os problemas de xadrez e o tangram são conferidos automaticamente no build (o build falha se algum estiver errado).

## Como editar e gerar de novo

```bash
npm install
npm run build
```

Edite `src/conteudo.mjs` para trocar figuras ou textos. O build recria o PDF em `dist/`.

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
