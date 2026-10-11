# Guia visual · Manual S.O.S. Ansiedade

**Estilo:** editorial, sóbrio e acolhedor, combinando com a capa do livro (verde-petróleo, creme e coral).
**Adjetivos:** confiável, sereno, cuidadoso.
**Arquivos que seguem este guia:** `index.html` (página de vendas) e `obrigado.html` (página de obrigado). Os tokens abaixo estão no `:root` de cada um. As páginas legais usam as mesmas fontes e o mesmo favicon (`img/favicon.svg`).
**Antes de publicar:** siga a lista de conferência no topo do `config.js` (link da Hotmart, e-mail, endereço completo da imagem de compartilhamento, identificação do vendedor).

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
- **Carregamento (Google Fonts):** Inter 400–700 e Source Serif 4 com o eixo de tamanho óptico (`opsz`), pesos 500–700, mais o itálico 500. Não tire o `opsz`: sem ele os títulos grandes ficam pesados e largos. Não use itálico 600 (é mais um arquivo para baixar).

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
| Números dos tópicos (01–06) | 26px | 22px | Serif *itálico* 500, `--coral-ink` |

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
  - **≥ 1600px:** container de 1240px, H1 de 68px e arte do hero maior, para a primeira tela não ficar vazia.
- **Alinhamento:** no computador, alterne os cabeçalhos para não ficar repetitivo:
  - centralizado (`.head.center`): O que você vai aprender, Plano, Para quem é, Oferta
  - dividido (`.head-split`, título à esquerda e texto de apoio à direita): Ciência, Por dentro, O que você recebe
  - à esquerda, ao lado do conteúdo: Você se reconhece, Por que acontece, Método S.O.S., FAQ
  Abaixo de 900px, tudo fica à esquerda (inclusive os botões centralizados).

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
  - `--sh-1`: card da garantia
  - `--sh-2`: páginas do manual e celular
  - `--sh-3`: só o card de preço
  - `--sh-book`: só a capa e o celular
- **Menos caixas:** só o que a pessoa recebe (cards de entrega, preço e garantia) fica em caixa com borda. Listas, tópicos, ciência, fases do plano e FAQ usam linhas finas divisórias.
  - "Para quem é / não é": duas colunas sem caixa, separadas por uma linha vertical fina.
  - Nota do Diário no plano: uma linha com divisória em cima, sem caixa.
  - "Onde o manual atua": o único painel de fundo creme sem borda, por ser um destaque.
  - Diagrama do ciclo: cartões brancos com borda fina, sem sombra.
  - Marcadores da lista "Você se reconhece?": traço coral curto (14px), não bolinha.

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
- **Selo da garantia:** SVG com o círculo verde-petróleo, "7 DIAS", o texto na borda "GARANTIA • 7 DIAS • 100% DE VOLTA" e raios coral, que imitam o selo da capa. Tem 210px no computador e 150px no celular, para o texto da borda ficar legível. O card da garantia tem uma borda só, sem contorno tracejado. Há uma versão mini (`.mini-selo`) no card de preço.
- **Oferta (`#oferta`):** seção própria, com fundo creme e cabeçalho "Oferta · Comece hoje por R$ 27,90".
  - No computador: à esquerda, a composição (capa, página do diário e celular) com "Como funciona a compra" (3 passos) embaixo. À direita, o card de preço (`#comprar`).
  - No card: título, lista curta (principal, bônus 1 e bônus 2, cada um com rótulo em cima), preço, botão da Hotmart, "Compra processada pela Hotmart" e o mini selo.
  - No tablet, o card vem primeiro. No celular, a composição some e a descrição do card também, para o preço e o botão aparecerem logo.
- **Para onde vão os botões:**
  - os botões do meio da página (hero, Método S.O.S. e plano) levam ao card de preço (`#comprar`)
  - os botões `[data-checkout]` (card de preço, painel final e barra do celular) vão direto para a Hotmart quando o link está no `config.js`; sem link, ficam em `#oferta`
- **Lista com check (`.checks`):** check verde-petróleo de 18px.
- **Aviso de saúde (`.disclaimer`):**
  - fundo creme e borda esquerda verde-petróleo, sem cara de erro
  - 188 e 192 são links `tel:` e cvv.org.br é link
- **Ampliar páginas:** botão sobre cada página do manual que abre um `<dialog>` nativo. Fecha com Esc, com clique fora ou com o botão "Fechar", e devolve o foco.
  - No computador, a página aparece com 700px de largura (tamanho real do arquivo), com rolagem dentro da janela.
  - No celular, a janela ocupa a tela toda e a página fica em tamanho real (700px), para arrastar e ler. A legenda avisa "Arraste para ver a página inteira".
- **Navegadores antigos sem `cqw`** (iOS 15, Chrome antes da versão 105): os palcos mostram só a capa ou o celular, centralizados, sem as páginas e as ondas (`@supports not (width:1cqw)`).

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
| 10 | O que você recebe (só texto) | branco |
| 11 | Oferta `#oferta` (card de preço `#comprar`) | creme |
| 12 | Garantia `#garantia` | `--mist` |
| 13 | FAQ | branco |
| 14 | Painel final + aviso | branco |
| 15 | Rodapé | creme |

## 8. Regras fixas do dono

- **Topo:**
  - sem cabeçalho nem logo no topo
  - só a faixa fina com o texto da garantia correndo
  - a faixa não é fixa, pausa ao passar o mouse, ao focar, ao tocar ou com Enter/Espaço, e fica parada com movimento reduzido (no celular, com o texto curto "Garantia de 7 dias · 100% do valor de volta")
  - na `obrigado.html` também não há cabeçalho: só uma faixa fina parada ("Acesso enviado pela Hotmart · confira o seu e-mail")
- **Barra fixa no celular:**
  - só existe no celular e só tem o botão "Quero o manual", sem preço
  - aparece depois do topo
  - some enquanto a seção da oferta (`#oferta`) ou o painel final estão na tela
  - também some em telas muito baixas (até 480px de altura, como com zoom alto), e a página reserva espaço embaixo (`scroll-padding-bottom`) para o foco do teclado nunca ficar escondido atrás dela
- **"O que você recebe"** é **texto** (ícone, rótulo, descrição e lista), nunca prints do produto.
- **Checkout:** é só pela Hotmart (`config.js`). Botões `[data-checkout]` recebem o link e repassam os `utm_`. `[data-preco]` mostra o preço e `[data-email]`/`[data-email-link]` mostram o e-mail.
- **Proibido inventar:**
  - depoimentos, notas, número de alunos ou compradores
  - autor, credenciais
  - contador regressivo, escassez
  - preço "de/por"
  - prazo de resposta do suporte, formas de pagamento além de Pix e cartão
- **Linguagem de saúde:** "ajuda", "técnicas usadas por psicólogos", "material educativo". Nunca "cura" ou "garante resultado".

## 9. Imagens

- **Reais (em `img/`):**
  - `capa.webp` aparece no hero, na oferta (só no tablet e no computador) e no painel final
  - `pg-*.webp` aparecem no hero e na galeria "Por dentro"
  - `cartao.webp` aparece no celular do Método S.O.S. e da oferta
  - `og.jpg` é a imagem de compartilhamento: 1200 × 630, gerada a partir da capa real, com o título. Na publicação, o endereço dela no `<head>` precisa ser completo (`https://…`)
  - `favicon.svg` é o ícone da aba, usado em todas as páginas
- **Futuras (Google Flow):** estão em `PROMPTS-GOOGLE-FLOW.md`. Cada uma já tem um espaço comentado no HTML com o nome do arquivo:
  - `fundo-kit.webp`
  - `ilustra-noite.webp`
  - `ilustra-calma.webp`
  - `ilustra-escada.webp`
- **Recortes das imagens futuras:** `ilustra-noite` em 4:3 (sem corte), `ilustra-escada` em 2:1, `ilustra-calma` em 4:5 com topo em arco no computador e no tablet, e quadrada (até 300px) no celular e na página de obrigado, `fundo-kit` quase quadrado.
- **Como são carregadas:**
  - toda imagem tem `width`/`height` e `alt`
  - abaixo da dobra, usa `loading="lazy"`
  - a capa do hero tem `fetchpriority="high"`

## 10. Movimento e acessibilidade

- **Animação de entrada:** só nos cabeçalhos das seções, com `.js .reveal`. Sem JavaScript, tudo aparece normalmente.
- **`prefers-reduced-motion`:** a faixa fica parada, sem animações e sem rolagem suave.
- **Foco visível:** em botões, links, perguntas do FAQ e páginas da galeria.
- **Diagrama do ciclo:** é uma lista `<ol>` de verdade, legível por leitor de tela.
- **Faixa da garantia:** é uma região com nome ("Garantia"), recebe foco e pausa com Enter ou Espaço.
- **Toque:** links soltos (rodapé, "Entenda por que isso acontece") têm pelo menos 44px de altura no celular.
- **Impressão / salvar em PDF:** os cabeçalhos aparecem mesmo sem rolar, e a faixa, a barra e a janela de ampliar ficam escondidas.
- **Testado em:** 360, 390, 768, 1366 e 1920px, sem rolagem lateral; sem erros no console; axe-core sem violações.

## Não fazer

- Degradês coloridos ou cores fora da paleta.
- Botões em formato pílula ou cantos muito redondos.
- Outras fontes.
- Caixas com borda em tudo: prefira linhas finas.
- Texto dentro de imagens geradas por IA.
