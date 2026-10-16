# Horta na Varanda · página de vendas

A página está pronta na pasta **`site/`**. Ela é estática (HTML, CSS e um JS pequeno), então não precisa de Node.js, banco de dados nem "build": é só subir os arquivos.

```
site/
├── index.html          página de vendas
├── privacidade.html    Política de Privacidade
├── termos.html         Termos de Uso
├── style.css
├── script.js           link do checkout, repasse de UTMs, FAQ e botão fixo no celular
├── favicon.svg
├── .htaccess           HTTPS, compressão e cache (arquivo oculto, confira se subiu)
└── img/                imagens já em WebP (capa, prévias das páginas e 15 plantas)
```

Peso total da página: cerca de 460 KB (a meta era menos de 1,5 MB).

---

## 1. Antes de publicar: preencha 4 coisas

| Onde | O que trocar |
|---|---|
| `script.js`, linha 4 | `COLE_AQUI_O_LINK_DO_CHECKOUT_KIWIFY` → link do checkout da Kiwify (veja a parte 3) |
| `index.html`, `privacidade.html`, `termos.html` | `[SEU NOME OU EMPRESA]`, `[CNPJ OU CPF]`, `[E-MAIL DE CONTATO]` e `[DATA]` |
| `index.html`, tags `og:url` e `og:image` (topo do arquivo) | `https://SEUDOMINIO.com.br/horta/` → endereço real da página. Sem isso, a prévia no WhatsApp não mostra a capa. |
| `index.html`, bloco do Pixel da Meta (opcional) | `SEU_PIXEL_ID` → número do pixel, e apague as marcações de comentário `<!--` e `-->` em volta do bloco |

Enquanto o `CHECKOUT_URL` não for preenchido, os botões levam para a seção de oferta da própria página (nada quebra).

> **Pixel:** a página dispara só o `PageView`. O `InitiateCheckout` e o `Purchase` ficam por conta da Kiwify (parte 3, passo 5). Não adicione `InitiateCheckout` no clique do botão, senão os eventos ficam duplicados.

> **Mudou o `script.js` ou o `style.css` depois de publicar?** Os navegadores guardam esses arquivos em cache. No `index.html` (e nas páginas legais, no caso do CSS), troque `?v=1` por `?v=2` no final de `style.css?v=1` / `script.js?v=1` para que todos recebam a versão nova.

---

## 2. Publicar na Hostinger

1. Abra o **hPanel** da Hostinger, vá em **Sites** e entre em **Gerenciador de Arquivos** do domínio.
2. Abra a pasta **`public_html`**. Para a página ficar num endereço como `seudominio.com.br/horta`, crie a pasta `horta` dentro dela.
3. Envie **todo o conteúdo** da pasta `site/` (o `index.html` precisa ficar direto na pasta, não dentro de outra subpasta).
   - Dica: compacte o *conteúdo* da pasta `site/` em um `.zip`, envie o zip e use **Extrair** no Gerenciador de Arquivos.
   - Confira se o arquivo **`.htaccess`** foi junto (ele começa com ponto e pode ficar oculto no seu computador).
4. Confira se o **SSL (https)** está ativo no domínio (hPanel → **Segurança → SSL**).
5. Abra a página no celular e teste:
   - o botão leva para a Kiwify;
   - acessando `https://seudominio.com.br/horta/?utm_source=teste`, o link do botão abre o checkout com `utm_source=teste` no endereço;
   - o botão fixo aparece no rodapé da tela depois de rolar o topo e some na seção de oferta;
   - as perguntas frequentes abrem e fecham.
6. Depois de publicar, cole o link no WhatsApp para ver a prévia com a capa. Se a imagem não aparecer, confira o `og:image` e use o [Depurador de Compartilhamento da Meta](https://developers.facebook.com/tools/debug/) para atualizar o cache.

Parâmetros repassados para o checkout: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `src`, `sck` e `fbclid`.

---

## 3. Configurar a Kiwify

1. Criar o produto **Horta na Varanda** (R$ 27,00) e enviar o PDF como conteúdo.
2. Criar o produto **Varanda com Pouco Sol** (R$ 12,90) e enviar o PDF.
3. Nas configurações do checkout do Horta na Varanda, adicionar o **Varanda com Pouco Sol como order bump**.
   - Título sugerido: "Sua varanda não pega muito sol?"
   - Descrição sugerida: "Adicione o guia que mostra o que plantar e como fazer render cada raio de luz: 12 plantas de meia-sombra, truques para ganhar luz e lâmpada de cultivo sem mistério. Por apenas R$ 12,90."
4. Copiar o link do checkout e colar em `CHECKOUT_URL` no `script.js`.
5. Se for usar anúncios, conectar o Pixel da Meta na própria Kiwify.

O order bump **não aparece na página de vendas**: ele só aparece no checkout da Kiwify.

---

## Outros arquivos desta pasta

- `BRIEFING-PAGINA-DE-VENDAS.md`: o briefing original.
- `assets-originais/`: imagens originais em PNG/SVG (não precisam subir para a Hostinger). A capa do "Varanda com Pouco Sol" e as prévias `pouco-sol-pag-*` estão aqui caso um dia a seção opcional de upsell seja criada.
