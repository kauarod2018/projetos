# Vemo: guia visual

Toda tela nova segue este guia. Se uma tela precisar fugir dele, registre aqui o motivo.

## Direção: "claro e vivo"
- Base no estilo Notion: fundo claro e quente, menu lateral claro, linhas finas e muito respiro.
- Vida com acentos de cor: azul Vemo como cor principal, mais o degradê "aurora" (azul → violeta → ciano) reservado para a Assistente/IA e para destaques da página de apresentação.
- Três adjetivos: **confiável, simples, moderno**.

## Cores (tokens em `app/globals.css`)
| Uso | Token | Valor |
| --- | --- | --- |
| Fundo da página | `--background` | `#fbfaf8` |
| Superfície (cards) | `--vemo-surface` | `#ffffff` |
| Fundo sutil | `--vemo-subtle` | `#f6f5f2` |
| Linhas | `--vemo-line` | `#ebe9e4` |
| Texto | `--vemo-text` | `#1f1e1c` |
| Texto secundário | `--vemo-muted` | `#6f6d68` |
| Principal (ações) | `--vemo-brand` | `#2f62f5` |
| IA / destaque | `--vemo-violet`, `--vemo-aurora` | `#7c5cff`, degradê |
| Entrou dinheiro | `--vemo-success` | `#0f8a63` |
| Atenção | `--vemo-warning` | `#a15c07` |
| Saiu / atraso | `--vemo-danger` | `#c8322f` |

Cada cor de status tem uma versão `-soft` para fundos de etiqueta e cartão.
Regra 60-30-10: 60% neutros, 30% branco/superfícies, 10% cor.

## Tipografia
- Títulos: **Plus Jakarta Sans** (`--font-display`).
- Texto e números: **Inter**.
- Ambas são servidas pelo próprio site (pacotes `@fontsource-variable`), sem depender do Google Fonts.

## Formas
- Raio padrão 10px (`--vemo-radius`); cartões grandes 16px (`--vemo-radius-lg`).
- Sombra leve (`--vemo-shadow`); sombra elevada só em destaques (`--vemo-shadow-lg`).
- Um estilo de botão principal (azul sólido) e um secundário (branco com borda).

## Textos
- Português simples, sem termos técnicos ou contábeis. Prefira "Entrou", "Saiu", "Sobrou", "A receber".
- Datas sempre no formato brasileiro (06/10, "6 de outubro").
- Avisos longos viram dica curta; nada de parágrafos de ressalva na tela.

## Não fazer
- Degradê fora da Assistente/IA e da página de apresentação.
- Sombras pesadas, bordas grossas, muitas cores na mesma tela.
- Cores fixas no código: use os tokens.
