# Página de vendas — Cão Cansado, Apê em Paz

## O que subir para a `public_html` da Hostinger

```
index.html
privacidade.html
termos.html
style.css
script.js
imagens/          (a pasta inteira: .webp + og-capa.jpg)
```

**Não precisa subir:** `originais/` (fotos JPG originais, guardadas só como backup), `PROMPT.md` e este `LEIA-ME.md`.

## Antes de publicar

1. **Link do checkout:** abra `script.js` e troque `LINK_DO_CHECKOUT` na primeira linha pelo link da Kiwify/Hotmart. Todos os botões usam esse link.
2. **Páginas legais:** em `privacidade.html` e `termos.html`, preencha `[SEU NOME OU EMPRESA]`, `[SEU CNPJ OU CPF]`, `[SEU E-MAIL DE CONTATO]` e `[DATA]`.
3. **Pixel da Meta:** cole o código no bloco comentado dentro do `<head>` do `index.html`. O evento `InitiateCheckout` já dispara sozinho no clique dos botões de compra.
4. **Imagem do WhatsApp:** em `index.html`, troque `content="imagens/og-capa.jpg"` pelo endereço completo, ex.: `https://seudominio.com.br/imagens/og-capa.jpg` (o WhatsApp precisa do endereço completo).
