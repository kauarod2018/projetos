# Guia visual

Vale para os mapas em PDF, os bônus e, na etapa 2, a página de vendas. Se algo precisar fugir daqui, avisar antes.

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

## Placas

Só imagens oficiais do DfT, sem alteração. Enquanto não há imagem oficial, aparece apenas o contorno tracejado da forma, mais o selo "Official image pending". Nunca desenhar o símbolo.

## O que não fazer

- Sem degradê, sombra pesada ou foto de banco de imagem nos mapas.
- Sem mais de uma cor de destaque por página (a cor da área).
- Sem diagrama de via desenhado à mão: tudo sai do gerador, com a mão de direção do `niche.json`.
- Sem texto abaixo de 8 pt.
