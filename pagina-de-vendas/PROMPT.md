# Página de vendas: "Cão Cansado, Apê em Paz"

Você vai criar a página de vendas de um ebook em PDF (produto digital low ticket). Leia este arquivo inteiro antes de começar.

## O que construir

- Uma página única, estática: `index.html` + `style.css` + `script.js` (pouco JS), sem framework.
- Os arquivos ficam nesta pasta. As imagens já estão em `./imagens/`.
- Vai ser publicada na Hostinger, subindo os arquivos para a pasta `public_html`.
- Público: quase todo mundo vai chegar pelo celular, vindo de anúncio do Instagram/Facebook. **Mobile first**: pensar primeiro em telas de 360 a 390 px e depois adaptar para o computador.
- Idioma: português do Brasil.

## Produto

- Nome: **Cão Cansado, Apê em Paz — Desafio 30 Dias**
- Formato: PDF de 37 páginas, para ler no celular ou imprimir
- Preço: **R$ 19,90**
- Público: tutor de cachorro que mora em apartamento e passa o dia fora
- Promessa: 30 brincadeiras de 10 minutos, com coisas que a pessoa já tem em casa, para o cachorro gastar energia, ficar mais calmo e parar de descontar o tédio na casa
- Checkout: botões levam para `LINK_DO_CHECKOUT` (vou trocar pelo link da Kiwify/Hotmart). Deixe o link numa constante única no `script.js` para eu trocar em um lugar só.

## Identidade visual (igual à do ebook)

- Fundo creme `#FBF6EE`, cartões `#FFFDF9`, bordas `#E4D6BD`
- Verde principal `#2F5D50`, verde claro `#DCE8E1`
- Terracota (destaques e botões) `#C0603A`, terracota claro `#F6E1D6`
- Texto `#2A2520`, texto secundário `#6F655A`
- Fontes (Google Fonts): **Fraunces** para títulos (com itálico em terracota para destacar palavras), **Inter** para textos, **Caveat** para pequenas frases manuscritas
- Visual quente, acolhedor e premium. Cantos arredondados (14–20 px), sombras bem suaves, muito respiro. Nada de visual "infoproduto genérico" (sem fundo preto, neon ou setas piscando).

## Imagens disponíveis em `./imagens/`

- Fotos: `foto-sofa.jpg`, `foto-toalha.jpg`, `foto-focinho.jpg`, `foto-quebra-cabeca.jpg`, `foto-tutora.jpg`, `foto-tapete-lamber.jpg`, `foto-dormindo.jpg`
- Páginas do ebook: `ebook-capa.jpg`, `ebook-sumario.jpg`, `ebook-avaliacao.jpg`, `ebook-dia-1.jpg`, `ebook-receitas.jpg`, `ebook-rotina.jpg`, `ebook-calendario.jpg`

Converta todas para WebP com largura máxima de 1200 px (guarde os originais). Use `loading="lazy"` em tudo que não aparece na primeira tela. Mostre as páginas do ebook como "folhas" com sombra suave e leve rotação, como um mockup.

## Estrutura e textos (use exatamente estes textos)

### 1. Topo
- Selo pequeno: `DESAFIO 30 DIAS · PDF COM ACESSO IMEDIATO`
- Título: **Seu cachorro não é bagunceiro.** *Ele está entediado.*
- Subtítulo: 30 brincadeiras de 10 minutos, com coisas que você já tem em casa, para o seu cachorro gastar energia, ficar mais calmo e parar de descontar o tédio no apartamento.
- Botão: **Quero o desafio por R$ 19,90**
- Abaixo do botão, em letra pequena: PDF para celular ou impressão · Acesso imediato no e-mail · Garantia de 7 dias
- Imagem: `ebook-capa.jpg` em destaque como mockup, com `foto-sofa.jpg` ao fundo ou ao lado

### 2. Identificação
- Título: Você reconhece alguma dessas cenas?
- Lista:
  - Chega em casa e encontra almofada destruída, sapato roído ou lixo espalhado
  - O vizinho já reclamou do latido enquanto você estava fora
  - Ele fica agitado quando você pega a chave ou a bolsa
  - A festa na chegada é tão exagerada que ele pula em todo mundo
  - Você sai para trabalhar com o coração apertado, sentindo culpa
- Fechamento: Se você marcou pelo menos uma, o problema provavelmente não é falta de educação. É **energia acumulada** sem ter para onde ir.

### 3. A virada
- Título: Correr cansa o corpo. *Farejar cansa a cabeça.*
- Texto: Cachorro de apartamento passa muitas horas sem nada para fazer. Passear ajuda, mas não basta. O que realmente cansa é usar o nariz e a cabeça: procurar, farejar, resolver pequenos desafios. E cachorro com a cabeça cansada descansa em vez de procurar o que destruir.
- Imagem: `foto-toalha.jpg`

### 4. Como funciona (3 passos com número grande)
1. **Abra no celular ou imprima.** Cada dia tem uma brincadeira com materiais, passo a passo e tempo.
2. **10 minutos antes de sair.** Faça a brincadeira do dia e deixe um recheio congelado no cantinho dele.
3. **Acompanhe a evolução.** Marque no calendário e compare a avaliação do Dia 0 com a do Dia 30.

### 5. As 4 semanas (4 cartões, um por semana)
- **Semana 1 · Primeiros Passos:** brincadeiras simples para ele entender o jogo.
- **Semana 2 · Faro Afiado:** esconderijos mais espertos e os primeiros comandos.
- **Semana 3 · Cabeça Pensante:** paciência e o "cantinho", o lugar seguro dele quando você sai.
- **Semana 4 · Nível Mestre:** os desafios mais difíceis e o grande final.

Use `foto-focinho.jpg`, `foto-quebra-cabeca.jpg` e `foto-tutora.jpg` nesta seção.

### 6. Veja por dentro
- Título: Veja *por dentro*
- Carrossel deslizável no celular (arrastar com o dedo, com bolinhas indicadoras) e grade no computador com: `ebook-sumario.jpg`, `ebook-dia-1.jpg`, `ebook-avaliacao.jpg`, `ebook-receitas.jpg`, `ebook-rotina.jpg`, `ebook-calendario.jpg`
- Ao tocar numa página, abrir ampliada (lightbox simples, fecha com toque fora ou botão X)

### 7. O que você recebe (lista com ícones de check)
- 30 brincadeiras guiadas com materiais, passo a passo e "por que funciona"
- Ritual de saída e de chegada para ele ficar calmo quando você sai
- Avaliação de antes e depois para medir a evolução
- Adaptações para filhote, idoso, pequeno e grande porte, focinho curto e medroso
- 6 receitas de recheio congelado e a lista de alimentos proibidos
- Checklist "Apê à prova de tédio"
- Rotina em uma página e calendário para a geladeira
- Perguntas frequentes e certificado de conclusão

Use `foto-tapete-lamber.jpg` nesta seção.

### 8. Para quem é
- **É para você se:** mora em apartamento ou casa pequena; passa várias horas fora; quer um cachorro mais calmo sem gastar com brinquedos caros; tem 10 minutos por dia.
- **Não é para você se:** procura uma solução mágica sem fazer nada; o cachorro tem um problema de saúde ou de comportamento grave (nesse caso, o primeiro passo é o veterinário).

### 9. Oferta
- Cartão de destaque com `ebook-capa.jpg`, a lista resumida do que vem e o preço grande: **R$ 19,90**
- Texto pequeno: pagamento único · acesso imediato · Pix ou cartão
- Botão: **Quero começar o desafio hoje**

### 10. Garantia
- Selo "7 dias"
- Texto: Você tem 7 dias para ler, testar e decidir. Se não gostar, é só pedir o reembolso pela plataforma de pagamento e você recebe 100% do valor de volta. Sem perguntas.

### 11. Perguntas frequentes (acordeão, só uma aberta por vez)
- **Como recebo o ebook?** Logo após a confirmação do pagamento, o acesso chega no seu e-mail. Com Pix, costuma ser na hora.
- **Preciso comprar algum material?** Não. As brincadeiras usam toalha, rolo de papel, caixa de ovo, garrafa PET e outras coisas que você já tem em casa.
- **Funciona para qualquer cachorro?** O desafio foi feito para cachorros que ficam entediados em casa. O ebook traz adaptações para filhote, idoso, pequeno e grande porte, focinho curto e cachorro medroso.
- **E se eu só tiver 5 minutos por dia?** Funciona. Constância importa mais que tempo.
- **Posso imprimir?** Pode. O PDF foi feito em tamanho A4, pronto para imprimir ou ler no celular.
- **O ebook substitui o veterinário ou o adestrador?** Não. Ele ajuda com tédio e energia acumulada. Se o seu cachorro se machuca quando fica sozinho ou tem sinais de sofrimento, procure um profissional. O ebook explica quais são esses sinais.

### 12. Chamada final
- Imagem: `foto-dormindo.jpg`
- Título: Imagine chegar em casa e encontrar *ele dormindo.*
- Texto: 10 minutos por dia. Coisas que você já tem. 30 dias para mudar a rotina de vocês dois.
- Botão: **Quero o desafio por R$ 19,90**

### 13. Rodapé
- Aviso: Este material tem caráter educativo e não substitui a orientação de um médico-veterinário.
- Links para "Política de Privacidade" e "Termos de Uso" (crie as duas páginas simples, em `privacidade.html` e `termos.html`, deixando `[SEU NOME OU EMPRESA]`, `[SEU CNPJ OU CPF]` e `[SEU E-MAIL DE CONTATO]` para eu preencher)
- © 2026 Cão Cansado, Apê em Paz

## Regras importantes

- **Não invente depoimentos, avaliações, notas, números de clientes vendidos ou "pessoas comprando agora".** Não crie seção de depoimentos. Vou adicionar depoimentos reais depois.
- **Não use contador regressivo falso** nem "últimas unidades".
- **Não mostre preço "de R$ X por R$ 19,90"** a menos que eu peça.
- No celular, mostre uma **barra fixa no rodapé da tela** com o preço e o botão de compra, que aparece depois que a pessoa rola além do topo e some quando a seção de oferta está visível.
- Todos os botões de compra usam a mesma constante de link e abrem na mesma aba.
- Botões grandes (mínimo 48 px de altura), fáceis de tocar com o polegar.
- Animações bem sutis de entrada ao rolar (fade + leve subida) e respeitar `prefers-reduced-motion`.
- Deixe um bloco comentado no `<head>` para eu colar o **Pixel da Meta** depois, e dispare o evento `InitiateCheckout` no clique dos botões de compra (só se o pixel existir).
- Adicione as meta tags de compartilhamento (Open Graph) com título, descrição e `ebook-capa.jpg`, para ficar bonito quando eu mandar o link no WhatsApp.
- A página precisa carregar rápido no 4G: imagens em WebP, fontes com `display=swap`, sem bibliotecas pesadas.

## Quando terminar

1. Abra a página e confira em 375 px e em 1280 px. Corrija qualquer coisa cortada, desalinhada ou com rolagem lateral.
2. Me diga quais arquivos subir para a `public_html` da Hostinger.
3. Me lembre de trocar `LINK_DO_CHECKOUT` e preencher os dados das páginas legais.
