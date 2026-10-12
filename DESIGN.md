# Guia visual

Vale para os mapas em PDF, os bônus, o site e os criativos de anúncio. Se algo precisar fugir daqui, avisar antes.

## Direção

**Limpo, direto e confiável**: material de estudo que parece sério e fácil de usar, não um panfleto.

- Fundo branco, muito espaço, **uma cor por área**, texto escuro.
- Informação em blocos sempre na mesma posição: quem estudou um mapa já sabe ler o próximo.
- Detalhe que se repete (assinatura): a **"linha de faixa"**, uma linha tracejada longa na cor da área, igual à faixa pintada no asfalto, separando as linhas de blocos.

## Cores

| Uso | Valor |
|---|---|
| Texto principal | `#16181D` |
| Texto secundário | `#4A505C` |
| Texto terciário / rodapé | `#6B7280` |
| Linhas | `#D9DDE3` |
| Fundo suave (armadilhas) | `#F4F5F7` |
| Marca "DRAFT" | `#B91C1C` |

**Cores das áreas** (em `niche.json`), escolhidas para não competir com o vermelho de proibição e o azul de ordem das placas:

| Área | Cor |
|---|---|
| 01 Road & Traffic Signs | `#B45309` âmbar |
| 02 Rules of the Road | `#0F766E` verde-azulado |
| 03 Motorways | `#6D28D9` violeta |
| 04 Safety Margins & Vehicle Handling | `#4D7C0F` verde-oliva |
| 05 Hazard Awareness & Vulnerable Road Users | `#BE185D` magenta |
| 06 Your Vehicle, Documents & Incidents | `#334155` ardósia |

Cada cor gera 3 tons automáticos (`--area-soft` 7%, `--area-mid` 38%, `--area-deep` 82% + preto). A cor nunca é a única pista: número da área e ícone aparecem junto, para quem imprime em preto e branco.

Nos diagramas de rotatória, as rotas usam azul `#2563EB`, laranja `#EA580C` e roxo `#9333EA`. A seta de pisca é amarela sobre fundo escuro, como no painel do carro.

## Tipografia

| Papel | Fonte | Tamanho |
|---|---|---|
| Título do mapa | Archivo 800, largura 88% | 24 pt |
| Número da área na faixa | Archivo 800, largura 80% | 25 pt |
| Rótulos de bloco (MAIÚSCULAS, espaçado) | Archivo 700 | 8 pt |
| "What it is" | Atkinson Hyperlegible | 11 pt |
| Corpo | Atkinson Hyperlegible | 9–9,5 pt |
| Legendas, fontes, rodapé | Atkinson Hyperlegible | 8 pt (mínimo) |

- **Archivo** (títulos): firme, lembra sinalização sem copiar a fonte oficial das placas.
- **Atkinson Hyperlegible** (texto): feita para legibilidade, com letras e números difíceis de confundir (o zero tem um traço de propósito).
- As duas são licença OFL e ficam embutidas no PDF. Nada é baixado da internet na hora de gerar.
- **Nunca** diminuir a fonte para caber: se não couber, encurtar o texto ou dividir o tema em dois mapas.

## Grade do mapa A4

```
┌ faixa da área: 01 · ícone · nome da área ··············· MAP 1.02 ┐
│ Título                                                             │
│ WHAT IT IS  definição curta                                        │
│ ┌ VISUAL (ocupa todo o espaço que sobrar) ───────────────────────┐ │
│ └────────────────────────────────────────────────────────────────┘ │
│ KEY FACTS                       │ EASILY CONFUSED  [A] vs [B]      │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ (linha de faixa) ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│ HOW IT SHOWS UP ON THE TEST  Q1 │ Q2           │ TRAPS             │
│ SOURCES                                                            │
└ marca ······························· Map 1.02 · v0.1.0 · conferido ┘
```

- Margens laterais de 10 mm. Raio de canto: 3 mm nos blocos grandes, 1,2–2 mm nos pequenos.
- Sem sombras. Separação por espaço, linhas finas e a linha de faixa.
- Ícones: só **Lucide**, traço 2,2–2,4, na cor da área.
- Selo **LAW** (preto) marca o que o Highway Code escreve com MUST / MUST NOT.
- A resposta certa fica com contorno e fundo na cor da área, mais um ✓. As erradas ficam sem caixa.
- Mapas em rascunho levam a marca d'água "DRAFT" em vermelho bem claro e o rodapé em vermelho.

## Tipos de visual do mapa

O bloco do visual ocupa o espaço que sobra na página. Os blocos crescem até um limite e o resto fica centralizado, para
não sobrar um buraco em branco nem esticar demais.

| Tipo | Quando usar | Exemplo |
|---|---|---|
| `sign-grid` | Até 10 placas oficiais com legenda | 1.03 Warning signs |
| `bar-scale` | Barras empilhadas (tempo de reação + frenagem) | 4.01 Stopping distances |
| `road-diagram` | Rotatória desenhada por geometria | 2.05 Roundabouts |
| `table` | Comparações em linhas; tabela de até 6 linhas ganha letra maior | 2.01, 6.03 |
| `cards` | 2 a 9 cartões com ícone Lucide ou amostra de cor; selo LAW opcional | 1.06, 3.06 |
| `steps` | 2 a 6 passos em ordem, com setas | 2.04, 6.09 |
| `stats` | 2 a 4 números grandes; número longo reduz a linha toda | 4.02, 5.03 |
| `markings` | Faixas pintadas, desenhadas a partir de um padrão fixo (você dirige na faixa de cima) | 1.07, 1.08 |
| `light-sequence` | Semáforo, com as luzes acesas de cada fase | 1.09 |

Regra de conteúdo: 4 a 6 fatos-chave, 1 questão (no máximo 2), 2 a 3 armadilhas. Menos texto, mais visual.

## Capa e sumário dos pacotes

Cada pacote abre com 2 páginas:

- **Capa:** os números do pacote (mapas, questões, armadilhas, contados dos arquivos), a linha de faixa nas 6 cores das
  áreas, o modo de usar, a legenda, o aviso de independência e as licenças.
- **Sumário:** os mapas agrupados por área, em 2 colunas.

## Marca (site, bônus e anúncios)

Marca: **Ajuda com Provas**, traduzida por idioma (`content/site.json`): **Test Help** em inglês britânico. O símbolo é um
quadrado verde com uma faixa tracejada amarela, a mesma "linha de faixa" dos mapas.

| Uso | Valor |
|---|---|
| Verde da marca (faixa dos bônus, títulos de destaque, final da página) | `#0B6E4F` |
| Amarelo de ação (botões de compra, marca-texto do título, selo dos bônus) | `#FFC93C` (sombra `#F2B705`) |
| Fundo suave do site | `#F6F5F1` |
| Linhas do site | `#E3E1DA` |

- **Botões de compra:** amarelos, texto escuro em maiúsculas, cantos totalmente arredondados, sombra "sólida" embaixo.
  Um estilo só para a ação principal; o secundário é contornado em preto.
- **Site:** mobile-first, margem lateral de 16 px, largura máxima de 1120 px, seções alternando branco e `#F6F5F1`,
  sobretítulo verde em maiúsculas acima de cada título. Texto base de 17 px no celular e 18 px no desktop.
- **Bônus:** mesma grade dos mapas, faixa verde da marca com o selo amarelo "BONUS 0N"; texto de 10,5 pt (são guias para
  ler com calma).
- **Criativos:** fundo verde (abertura e oferta) ou bege (páginas reais), título em Archivo 800, página real com sombra,
  botão amarelo no último slide.

## Placas

Só imagens oficiais do DfT, sem alteração. Enquanto não há imagem oficial, aparece apenas o contorno tracejado da forma, mais o selo "Official image pending". Nunca desenhar o símbolo.

## O que não fazer

- Sem degradê, sombra pesada ou foto de banco de imagem nos mapas.
- Sem mais de uma cor de destaque por página (a cor da área).
- Sem diagrama de via desenhado à mão: tudo sai do gerador, com a mão de direção do `niche.json`.
- Sem texto abaixo de 8 pt.
