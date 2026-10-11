# Guia visual · Manual S.O.S. Ansiedade

**Estilo:** editorial, sóbrio e acolhedor, combinando com a capa do livro (verde-petróleo, creme e coral).
**Adjetivos:** confiável, sereno, cuidadoso.
**Arquivos que seguem este guia:** `index.html` (página de vendas) e `obrigado.html` (página de obrigado). Os tokens abaixo estão no `:root` de cada um.

---

## 1. Cores

| Token | Cor | Uso |
|---|---|---|
| `--ink` | `#16262A` | Texto principal |
| `--ink-2` | `#4E5D61` | Texto secundário, parágrafos de apoio |
| `--ink-3` | `#5C6B6E` | Textos pequenos (legendas, notas) |
| `--deep` | `#173F43` | Títulos, fundos escuros (ciência, painel final) |
| `--deep-2` | `#12343A` | Faixa da garantia no topo, degradê do painel final |
| `--teal` | `#2F6F6A` | Ícones, checks, links |
| `--sage` / `--sage-2` | `#9FBDB2` / `#C9DBD2` | Linhas de onda, dias 1 a 5 do plano |
| `--mist` | `#EAF1EE` | Arcos atrás das imagens, seção da garantia, etiquetas |
| `--paper` | `#FFFFFF` | Fundo da página |
| `--cream` / `--cream-2` | `#F5EFE6` / `#EDE4D6` | Seções alternadas, rodapé |
| `--line` / `--line-2` | `#E6DFD3` / `#D8CEBF` | Bordas e divisórias (no creme, use `--line-2`) |
| `--cta` / `--cta-h` | `#C4532F` / `#B24E2B` | **Botões de compra** (branco sobre coral: 4,54:1 e 5,23:1) |
| `--coral` | `#D4603A` | **Só decoração:** pontos, ondas, letra "S" grande, raios do selo |
| `--coral-ink` | `#A8482A` | Texto coral pequeno (etiquetas de seção, "Bônus") |
| `--peach` / `--peach-dk` | `#FAE6DC` / `#F2B49B` | Fundo da etiqueta "Bônus" / destaque sobre fundo escuro |

**Regras:**
- O coral é só para o botão de compra e pequenos detalhes. O resto é branco, creme e verde-petróleo.
- Nunca use texto branco sobre `#D4603A`, porque o contraste é baixo. Use `--cta`.
- Todas as combinações de texto passam no AA. O texto mais fraco é `--ink-3` sobre creme, com 4,86:1.
- Nada de lilás, roxo ou visual de "app". Também não use degradês coloridos.

## 2. Tipografia

- **Títulos:** Source Serif 4, peso 600, `letter-spacing` negativo, `text-wrap: balance`. Frases de destaque vão em *itálico* coral (`--coral-ink`), sem marca-texto.
- **Texto, botões e rótulos:** Inter, peso 400 no texto e 600–700 em botões e rótulos.

| Papel | Computador | Celular | Fonte |
|---|---|---|---|
| H1 (`--fs-h1`) | 60px | 34–35px | Serif 600, altura de linha 1,06 |
| H2 de seção (`--fs-h2`) | 42px | 30px | Serif 600, 1,12 |
| H3 de item (`--fs-h3`) | 22px | 19px | Serif 600 |
| Lead e subtítulos (`--fs-lead`) | 19px | 17px | Inter 400, `--ink-2` |
| Texto | 17px | 16px | Inter 400, 1,65 |
| Listas e cards | 15–16px | 15px | Inter 400 |
| Etiqueta de seção (kicker) | 12px | 12px | Inter 700, maiúsculas, espaçamento .16em, com traço fino antes |
| Preço | 64px | 56px | Serif 700, números alinhados |
| Números da ciência | 52px | 40px | Serif 600, `--peach-dk` |
| Pull-quote | 18–23px | 19px | Serif *itálico* 500 |

- Parágrafos têm no máximo cerca de 62 caracteres por linha.
- Cada página tem um H1. Cada seção tem um H2, e os itens dentro dela usam H3.

## 3. Espaço e grade

- **Container:** 1160px, com laterais de `clamp(20px, 4vw, 32px)`.
- **Seções:** `--section-y` = 64px no celular e 96px no computador.
- **Distância do cabeçalho da seção até o conteúdo:** `--head-gap` (32–56px).
- **Breakpoints:**
  - **≥ 900px:** layout em colunas.
  - **640–899px:** colunas empilham e o texto fica alinhado à esquerda.
  - **≤ 640px:** celular.
  - **≤ 380px:** ajustes finos para telas de 360px.
- **Alinhamento:** no computador, cabeçalhos de seções de largura total ficam centralizados e seções divididas ficam à esquerda. Abaixo de 900px, tudo fica à esquerda.

## 4. Formas e sombras

- **Cantos:**
  - etiquetas: 6px
  - chips e ícones: 10–12px
  - **botões: 12px** (nunca pílula)
  - cards: 16px
  - card de preço e garantia: 20px
  - painéis grandes: 28px
  - capa do livro: `2px 6px 6px 2px`, com sombra de lombada
- **Bordas:** sempre 1px.
- **Sombras:**
  - `--sh-2`: páginas do manual e celular
  - `--sh-3`: só o card de preço
  - `--sh-book`: só a capa e o celular
- **Menos caixas:** só o que a pessoa recebe (cards de entrega, preço e garantia) fica em caixa. Listas, tópicos, ciência e FAQ usam linhas finas divisórias.

## 5. Componentes

- **Botão principal (`.btn`):**
  - coral `--cta`, texto branco 17–18px peso 700, altura de 56–60px, seta em SVG que anda 3px no hover
  - foco visível com contorno verde-petróleo de 3px
  - no celular, ocupa a largura toda
- **Link secundário (`.link-arrow`):** verde-petróleo, sublinhado em sálvia.
- **Etiqueta de seção (`.kicker`):** maiúsculas, coral escuro, com traço fino.
- **Palco (`.stage`):**
  - um arco verde-claro com linhas de onda
  - por cima, as imagens reais: capa (`.book`), páginas (`.pg`) e celular (`.phone` com `cartao.webp`)
  - posições em `cqw`, para escalar igual em qualquer tela
- **Selo da garantia:** SVG com o círculo verde-petróleo, "7 DIAS" e raios coral, que imitam o selo da capa. Há uma versão mini (`.mini-selo`) no card de preço.
- **Lista com check (`.checks`):** check verde-petróleo de 18px.
- **Aviso de saúde (`.disclaimer`):**
  - fundo creme e borda esquerda verde-petróleo, sem cara de erro
  - 188 e 192 são links `tel:` e cvv.org.br é link
- **Ampliar páginas:** botão sobre cada página do manual que abre um `<dialog>` nativo. Fecha com Esc, com clique fora ou com o botão "Fechar", e devolve o foco.

## 6. Motivos da marca (usar com moderação)

- **Ondas finas paralelas:** as mesmas da capa, no símbolo `#w-ondas`. Aparecem nos palcos, no topo da seção de ciência e no rodapé do painel final.
- **Letras S O S grandes:** S coral, O verde e S verde-escuro. Aparecem no Método S.O.S., como nas páginas reais do PDF.
- **Selo coral com raios:** só na garantia.

## 7. Ordem das seções e fundos (index.html)

| # | Seção | Fundo |
|---|---|---|
| 0 | Faixa da garantia (texto correndo) | `--deep-2` |
| 1 | Hero | branco + arco |
| 2 | Você se reconhece? | creme |
| 3 | Por que acontece (ciclo) | branco |
| 4 | Método S.O.S. | creme |
| 5 | O que você vai aprender | branco |
| 6 | Ciência | `--deep` |
| 7 | Plano de 20 dias | creme |
| 8 | Por dentro do manual | branco |
| 9 | Para quem é / não é | creme |
| 10–11 | O que você recebe (só texto) → Oferta `#oferta` | branco |
| 12 | Garantia `#garantia` | `--mist` |
| 13 | FAQ | branco |
| 14 | Painel final + aviso | branco |
| 15 | Rodapé | creme |

## 8. Regras fixas do dono

- **Topo:**
  - sem cabeçalho nem logo no topo
  - só a faixa fina com o texto da garantia correndo
  - a faixa não é fixa, pausa ao passar o mouse, ao focar ou ao tocar, e fica parada com movimento reduzido
- **Barra fixa no celular:**
  - só existe no celular e só tem o botão "Quero o manual", sem preço
  - aparece depois do topo
  - some enquanto a oferta (`#oferta`) ou o painel final estão na tela
- **"O que você recebe"** é **texto** (ícone, rótulo, descrição e lista), nunca prints do produto.
- **Checkout:** é só pela Hotmart (`config.js`). Botões `[data-checkout]` recebem o link e repassam os `utm_`. `[data-preco]` mostra o preço e `[data-email]`/`[data-email-link]` mostram o e-mail.
- **Proibido inventar:**
  - depoimentos, notas, número de alunos ou compradores
  - autor, credenciais
  - contador regressivo, escassez
  - preço "de/por"
- **Linguagem de saúde:** "ajuda", "técnicas usadas por psicólogos", "material educativo". Nunca "cura" ou "garante resultado".

## 9. Imagens

- **Reais (em `img/`):**
  - `capa.webp` aparece no hero, na oferta e no painel final
  - `pg-*.webp` aparecem no hero e na galeria "Por dentro"
  - `cartao.webp` aparece no celular do Método S.O.S. e da oferta
  - `og.jpg` é a imagem de compartilhamento: 1200 × 630, gerada a partir da capa real, com o título
- **Futuras (Google Flow):** estão em `PROMPTS-GOOGLE-FLOW.md`. Cada uma já tem um espaço comentado no HTML com o nome do arquivo:
  - `fundo-kit.webp`
  - `ilustra-noite.webp`
  - `ilustra-calma.webp`
  - `ilustra-escada.webp`
- **Como são carregadas:**
  - toda imagem tem `width`/`height` e `alt`
  - abaixo da dobra, usa `loading="lazy"`
  - a capa do hero tem `fetchpriority="high"`

## 10. Movimento e acessibilidade

- **Animação de entrada:** só nos cabeçalhos das seções, com `.js .reveal`. Sem JavaScript, tudo aparece normalmente.
- **`prefers-reduced-motion`:** a faixa fica parada, sem animações e sem rolagem suave.
- **Foco visível:** em botões, links, perguntas do FAQ e páginas da galeria.
- **Diagrama do ciclo:** é uma lista `<ol>` de verdade, legível por leitor de tela.
- **Testado em:** 360, 390, 768 e 1366px, sem rolagem lateral.

## Não fazer

- Degradês coloridos ou cores fora da paleta.
- Botões em formato pílula ou cantos muito redondos.
- Outras fontes.
- Caixas com borda em tudo: prefira linhas finas.
- Texto dentro de imagens geradas por IA.
