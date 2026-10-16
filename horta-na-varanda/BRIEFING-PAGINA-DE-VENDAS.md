# Briefing: página de vendas "Horta na Varanda"

> **Para o Claude Code:** crie a página de vendas descrita abaixo. Ela será publicada na **Hostinger** (hospedagem comum, arquivos estáticos) e todos os botões de compra levam para o **checkout da Kiwify**. O texto da página já está pronto na seção 5: use exatamente esse texto, sem inventar depoimentos, números de vendas, avaliações ou contadores de escassez.

---

## 1. O produto

| | Produto principal | Order bump (no checkout da Kiwify) |
|---|---|---|
| Nome | **Horta na Varanda: do zero à primeira colheita em 30 dias** | **Varanda com Pouco Sol** |
| Formato | PDF, 40 páginas, A4 (ler no celular ou imprimir) | PDF, 15 páginas, A4 |
| Preço | **R$ 27,00** | **R$ 12,90** |
| Entrega | Kiwify envia o acesso por e-mail logo após a compra | Mesma coisa |

**Público:** quem mora em apartamento no Brasil (varanda, janela, área de serviço), quer ter temperos e folhas frescas e nunca plantou, ou já tentou e as plantas morreram. Maioria mulheres de 25 a 55 anos, vindas de anúncios no Instagram e Facebook, ou seja, **celular primeiro**.

**O order bump não aparece na página de vendas.** Ele é configurado dentro da Kiwify e aparece no checkout. A página vende só o produto principal.

---

## 2. Decisões técnicas

- **Página estática**: um `index.html`, um `style.css`, um `script.js` pequeno (só para o FAQ em sanfona e o botão fixo no celular) e uma pasta `img/`. Sem framework, sem build, sem Node.js. Assim é só subir os arquivos na Hostinger.
- **Mobile-first**: desenhar primeiro para 360 a 390 px de largura e depois adaptar para desktop (largura máxima do conteúdo de uns 1100 px).
- **Rápida**: imagens convertidas para **WebP** e redimensionadas (capa com uns 900 px de largura, prévias de páginas com uns 700 px), `loading="lazy"` em tudo que estiver abaixo da primeira tela, `width` e `height` em todas as imagens, fontes do Google com `display=swap`. Meta: página inteira com menos de 1,5 MB.
- **Todos os links de compra** usam uma única constante no `script.js`:
  ```js
  const CHECKOUT_URL = "COLE_AQUI_O_LINK_DO_CHECKOUT_KIWIFY";
  ```
  O script aplica essa URL a todos os botões com a classe `.btn-comprar` e **repassa os parâmetros UTM** da URL da página (utm_source, utm_medium, utm_campaign, utm_content, utm_term, além de `src`, `sck` e `fbclid`, se existirem) para o link do checkout. Isso mantém o rastreamento dos anúncios dentro da Kiwify.
- **Pixel da Meta**: deixe o bloco do pixel pronto no `<head>`, comentado, com o marcador `SEU_PIXEL_ID` e com o evento `PageView`. Não dispare `InitiateCheckout` no clique se a Kiwify já estiver integrada ao pixel, para não duplicar. Deixe um comentário explicando isso.
- **SEO e compartilhamento**: `<title>`, meta description, Open Graph (título, descrição e imagem usando a capa), favicon simples (folhinha verde em SVG), `lang="pt-BR"`. Use o texto de `og:description` que está na seção 5.
- **Acessibilidade**: `alt` descritivo em todas as imagens, contraste bom, botões com pelo menos 48 px de altura.
- **Páginas legais**: crie também `privacidade.html` e `termos.html` simples (texto padrão para venda de produto digital, citando que o pagamento e a entrega são feitos pela Kiwify, a garantia de 7 dias e a LGPD). Coloque os links no rodapé. Deixe marcado com `[SEU NOME OU EMPRESA]`, `[CNPJ OU CPF]` e `[E-MAIL DE CONTATO]` o que o dono precisa preencher.

---

## 3. Identidade visual (igual à do PDF)

| Token | Cor | Uso |
|---|---|---|
| `--papel` | `#FBF7EE` | Fundo principal |
| `--papel-2` | `#F4EEDF` | Fundo de seções alternadas |
| `--verde` | `#2F5D3A` | Títulos, faixas escuras, rodapé |
| `--verde-2` | `#4E8B4F` | Detalhes, marcadores de lista |
| `--salvia` | `#E6EEDD` | Cartões claros |
| `--terracota` | `#C96F4A` | **Botões de compra**, destaques, números |
| `--terracota-claro` | `#F7E4D9` | Caixas de alerta |
| `--sol` | `#F3C861` | Pequenos detalhes (sol, selos) |
| `--tinta` | `#22302A` | Texto |
| `--cinza` | `#66736B` | Texto secundário |

- **Fontes:** títulos em **Lora** (serifada, peso 600), texto em **Inter** (400, 500 e 600), ambas do Google Fonts.
- **Estilo:** acolhedor, natural e organizado. Cantos arredondados (10 a 14 px), sombras bem suaves, muito respiro, ilustrações de vasos de barro. Nada de neon, gradientes chamativos ou visual de "marketing agressivo".
- **Botão de compra:** fundo terracota, texto branco, Inter 600, cantos de 12 px, sombra suave, hover um pouco mais escuro, com uma pequena seta →. Abaixo de cada botão, em texto pequeno: "Pagamento seguro pela Kiwify · Acesso imediato por e-mail".
- **No celular**, depois que o usuário passar do topo, mostre um **botão fixo no rodapé da tela** ("Quero minha horta · R$ 27"), que some quando a seção de oferta estiver visível.

---

## 4. Imagens disponíveis (pasta `assets/`)

- `capas/capa-horta-na-varanda.png`: capa do produto principal. Use no topo dentro de um mockup simples feito em CSS (leve rotação, sombra e borda clara, parecendo uma folha ou tablet).
- `capas/capa-varanda-com-pouco-sol.png`: capa do order bump. Use na página só se for criar a seção opcional da seção 6.
- `paginas/guia-pag-*.png`: prévias reais de páginas do guia, para a seção "Por dentro do guia":
  - `guia-pag-4`: teste do sol
  - `guia-pag-6`: tabela Sol × Plantas
  - `guia-pag-8`: índice das 15 plantas
  - `guia-pag-9` e `guia-pag-21`: exemplos de fichas (cebolinha e tomate-cereja)
  - `guia-pag-24`: calendário por região
  - `guia-pag-29`: rega
  - `guia-pag-33`: plano de 30 dias
  - `guia-pag-36`: diário
- `plantas/*.svg`: 15 ilustrações de plantas em vaso (cebolinha, salsinha, manjericão etc.). Use como ícones decorativos e na grade das "15 plantas".

Converta tudo para WebP com a qualidade e o tamanho adequados antes de usar.

---

## 5. Estrutura e texto da página (usar este texto)

### 5.1 Topo (hero)
- Selo pequeno: **Guia prático em PDF · para quem mora em apartamento**
- Título (H1): **Sua horta de temperos na varanda, do zero à primeira colheita em 30 dias**
- Subtítulo: **Mesmo sem quintal, sem experiência e sem "mão boa" para planta. Um guia passo a passo que mostra o que plantar no seu espaço, como cuidar e o que fazer a cada dia.**
- Três marcadores curtos com ícones:
  - 15 plantas fáceis, cada uma com sua ficha completa
  - Plano de 30 dias com uma tarefa curta por dia
  - Calendário de plantio para cada região do Brasil
- Botão: **Quero minha horta por R$ 27 →**
- Abaixo do botão: "Pagamento seguro pela Kiwify · Acesso imediato por e-mail"
- Imagem: mockup da capa.

### 5.2 O problema
- Título: **Já comprou um vasinho de manjericão que morreu em duas semanas?**
- Texto: "Você não está sozinha(o). A maioria das hortas de apartamento não morre por falta de vontade. Morre por três motivos simples, que ninguém explica quando a gente compra a muda:"
- Três cartões:
  1. **Planta errada para o seu sol.** Cada planta precisa de uma quantidade de luz. Colocar a planta certa no lugar errado é a causa número um de fracasso.
  2. **Vaso pequeno demais.** Raiz apertada não cresce, seca rápido e a planta definha.
  3. **Água de mais (ou de menos).** Mais plantas morrem afogadas do que de sede, e quase ninguém sabe a hora certa de regar.
- Fechamento: "O Horta na Varanda resolve os três **antes** de você plantar a primeira semente."

### 5.3 O que é
- Título: **Um guia que pega você pela mão, do diagnóstico à colheita**
- Texto: "São 40 páginas ilustradas, feitas para ler no celular ou imprimir. Você descobre quanto sol o seu espaço recebe, escolhe as plantas certas para ele, monta os vasos do jeito certo e segue um plano de 30 dias, com uma tarefa curta por dia. Com mudas de temperos e duas plantas de ciclo rápido, a primeira colheita acontece dentro do primeiro mês."

### 5.4 Por dentro do guia (com as prévias das páginas)
Título: **O que você vai encontrar**

Use um carrossel ou grade das prévias das páginas, cada uma com uma legenda:

1. **Descubra quanto sol você tem:** o teste do sol, feito em um dia, que define tudo o que vem depois. *(guia-pag-4)*
2. **O que plantar no seu caso:** a tabela Sol × Plantas e combinações prontas para começar. *(guia-pag-6)*
3. **15 fichas de plantas:** vaso, como plantar, rega, colheita, o erro mais comum e uma dica de ouro para cada uma. *(guia-pag-9, guia-pag-21)*
4. **Calendário por região:** quando plantar no Sul, no Sudeste, no Centro-Oeste, no Norte e no Nordeste. *(guia-pag-24)*
5. **Montagem e rega sem erro:** o vaso montado em 6 passos e o teste do dedo, que acaba com a dúvida de quando regar. *(guia-pag-29)*
6. **Pragas e problemas:** o que fazer com folha amarela, pulgão, lagarta e fungo, com receitas caseiras.
7. **Plano de 30 dias:** uma tarefa por dia, com quadradinho para marcar. *(guia-pag-33)*
8. **Diário de cultivo para imprimir:** registro de plantio, controle do mês, colheitas e fotos de antes e depois. *(guia-pag-36)*

### 5.5 As 15 plantas
- Título: **15 plantas que dão certo em vaso**
- Grade com os SVGs de `plantas/` e o nome de cada uma: Cebolinha, Salsinha, Manjericão, Hortelã, Alecrim, Orégano, Tomilho, Coentro, Alface, Rúcula, Rabanete, Couve, Tomate-cereja, Pimenta, Morango.
- Legenda: "Temperos, folhas e até frutinhas, cada uma com sua ficha completa e nível de dificuldade."

### 5.6 Para quem é
Duas colunas:
- **É para você se…**
  - mora em apartamento e tem uma varanda, janela ou área de serviço
  - nunca plantou nada, ou já tentou e as plantas morreram
  - quer temperos frescos sem depender da feira
  - gosta de instruções claras, passo a passo
- **Não é para você se…**
  - procura um curso de agricultura ou de horta comercial
  - quer uma horta grande no quintal ou no sítio
  - não tem nenhum tempo: o plano pede uns 5 minutos por dia

### 5.7 Como funciona
Três passos com números grandes em terracota:
1. **Você compra** pelo checkout seguro da Kiwify (Pix, cartão ou boleto).
2. **Recebe o acesso por e-mail** na hora e baixa o PDF.
3. **Começa hoje:** faça o teste do sol e siga o plano de 30 dias.

### 5.8 Oferta
Cartão central em destaque:
- Mockup da capa
- **Horta na Varanda: guia completo em PDF**
- Lista do que está incluído, com ✓:
  - Guia ilustrado com 40 páginas
  - 15 fichas de plantas
  - Calendário de plantio por região
  - Plano de 30 dias
  - Diário de cultivo para imprimir
  - Acesso imediato e para sempre
- Preço: **R$ 27** (grande, Lora) e "pagamento único".
- Botão: **Quero começar minha horta →**
- Abaixo: "Pix, cartão ou boleto · Pagamento seguro pela Kiwify"

> Não colocar preço "de/por" riscado nem contador regressivo.

### 5.9 Garantia
- Selo circular verde com "7 dias".
- Título: **Garantia incondicional de 7 dias**
- Texto: "Se nos primeiros 7 dias você achar que o guia não é para você, é só pedir o reembolso pela própria Kiwify. Você recebe 100% do valor de volta, sem perguntas."

### 5.10 Perguntas frequentes (sanfona)
1. **Como recebo o guia?** Logo após a confirmação do pagamento, a Kiwify envia o acesso para o seu e-mail. Pix e cartão são liberados na hora; boleto, em até 2 dias úteis.
2. **Preciso ter experiência?** Não. O guia foi feito para quem nunca plantou e explica tudo do zero, com linguagem simples.
3. **Minha varanda tem pouco sol. Funciona?** O primeiro capítulo mostra como medir o sol do seu espaço, e a tabela Sol × Plantas indica o que dá certo com sol pleno, sol médio ou meia-sombra.
4. **Quanto vou gastar para montar a horta?** Dá para começar com poucos vasos, substrato e algumas mudas. O guia traz a lista de compras e mostra como reaproveitar baldes e potes para gastar menos.
5. **Serve para qualquer região do Brasil?** Sim. O calendário de plantio é dividido por região: Sul, Sudeste e Centro-Oeste, Norte e Nordeste.
6. **Consigo ler no celular?** Sim. O PDF pode ser lido no celular, no tablet ou no computador, e também impresso.
7. **E se eu não gostar?** Você tem 7 dias de garantia para pedir o reembolso total pela Kiwify.

### 5.11 Chamada final
- Faixa verde escura com ilustração de vasos.
- Título: **Daqui a 30 dias, você pode estar colhendo o seu próprio tempero**
- Botão: **Quero minha horta por R$ 27 →**

### 5.12 Rodapé
- "Horta na Varanda · © 2026 [SEU NOME OU EMPRESA]"
- Links: Política de Privacidade · Termos de Uso · Contato ([E-MAIL DE CONTATO])
- Aviso pequeno: "Este produto é um material educativo digital. Os resultados variam conforme o clima, o local e os cuidados de cada pessoa. Este site não é afiliado ao Facebook ou ao Instagram."

### Meta tags
- `<title>`: Horta na Varanda: sua horta de temperos em 30 dias
- meta description e `og:description`: "Guia ilustrado em PDF para montar sua horta na varanda ou na janela do apartamento: o que plantar, como cuidar e um plano de 30 dias até a primeira colheita."

---

## 6. Seção opcional (só se o dono pedir)
Se no futuro o order bump for vendido também como upsell, crie uma seção com a capa `capa-varanda-com-pouco-sol.png` e o título "Sua varanda pega pouco sol?". **Por enquanto, não incluir.**

---

## 7. Publicação na Hostinger (passo a passo para entregar ao dono)

Ao terminar, gere a pasta `site/` com tudo pronto e um `LEIA-ME.md` com este roteiro:

1. Abrir o **hPanel** da Hostinger, ir em **Sites** e entrar em **Gerenciador de Arquivos** do domínio.
2. Abrir a pasta **`public_html`**. Para a página ficar num endereço como `seudominio.com.br/horta`, criar a pasta `horta` dentro dela.
3. Enviar **todo o conteúdo** da pasta `site/` (o `index.html` precisa ficar direto na pasta, não dentro de outra subpasta).
4. Conferir se o **SSL (https)** está ativo no domínio.
5. Abrir a página no celular e testar: o botão leva para a Kiwify, e os parâmetros UTM aparecem no link quando a página é acessada com `?utm_source=teste`.

Inclua também um `.htaccess` simples com redirecionamento para HTTPS, compressão (gzip/deflate) e cache longo para imagens, CSS e JS.

---

## 8. Configuração na Kiwify (o dono faz)

1. Criar o produto **Horta na Varanda** (R$ 27,00) e enviar o PDF como conteúdo.
2. Criar o produto **Varanda com Pouco Sol** (R$ 12,90) e enviar o PDF.
3. Nas configurações do checkout do Horta na Varanda, adicionar o **Varanda com Pouco Sol como order bump**.
   - Título sugerido: "Sua varanda não pega muito sol?"
   - Descrição sugerida: "Adicione o guia que mostra o que plantar e como fazer render cada raio de luz: 12 plantas de meia-sombra, truques para ganhar luz e lâmpada de cultivo sem mistério. Por apenas R$ 12,90."
4. Copiar o link do checkout e colar em `CHECKOUT_URL` no `script.js`.
5. Se for usar anúncios, conectar o Pixel da Meta na própria Kiwify.

---

## 9. Checklist de entrega (o Claude Code confere antes de terminar)
- [ ] Testado em 360 px, 390 px, 768 px e 1280 px, sem rolagem horizontal
- [ ] Todos os botões de compra usam `.btn-comprar` e `CHECKOUT_URL`
- [ ] Parâmetros UTM repassados para o checkout
- [ ] Imagens em WebP, com `alt`, `width`, `height` e lazy loading
- [ ] Botão fixo no celular funcionando
- [ ] FAQ abre e fecha
- [ ] Open Graph com a capa (testar o preview no WhatsApp depois de publicar)
- [ ] `privacidade.html` e `termos.html` criados e linkados
- [ ] Nenhum depoimento, número de vendas ou contador inventado
- [ ] `LEIA-ME.md` com o passo a passo da Hostinger e da Kiwify
