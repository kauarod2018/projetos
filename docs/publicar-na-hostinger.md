# Publicar o HelpTest na Hostinger

O site é feito só de arquivos prontos (HTML, CSS, imagens). Não precisa de Node.js, banco de dados nem PHP: é só
colocar os arquivos na pasta `public_html` e ligar o domínio.

## O que está em `entrega/`

| Arquivo | Para onde vai |
|---|---|
| `helptest-site-2026-10-13.zip` | **Hostinger**: o site inteiro |
| `HelpTest-UK-Theory-Basic.zip` | **Hotmart**: arquivo do produto Basic (£15) |
| `HelpTest-UK-Theory-Complete.zip` | **Hotmart**: arquivo do produto Complete (£24) |
| `hotmart-basic.png`, `hotmart-complete.png` | **Hotmart**: imagem de cada produto (1200×1200) |

---

## Parte 1: ligar o domínio à hospedagem

### Caso A: você comprou o `helptest.online` na própria Hostinger (o mais comum)

1. Entre no **hPanel** e vá em **Websites** (Sites).
2. Se o `helptest.online` já aparece na lista, pule para a Parte 2.
3. Se não aparece, clique em **Add website** (Adicionar site). Escolha a opção de site vazio (**Empty website** /
   "site PHP/HTML vazio"). **Não** escolha WordPress nem o Criador de Sites. Depois selecione o domínio
   `helptest.online`.
4. Pronto: como o domínio é da Hostinger, ele já aponta para a hospedagem.

### Caso B: você comprou o domínio em outro lugar (GoDaddy, Namecheap, etc.)

> **Antes de trocar qualquer coisa:** se o e-mail `contact@helptest.online` foi criado **fora** da Hostinger (Zoho,
> Google Workspace…), me avise. Trocar os nameservers sem recriar os registros de e-mail faz o e-mail parar.
> Se o e-mail foi criado na Hostinger, pode seguir.

1. No hPanel: **Websites → Add website → Empty website** e escolha **usar um domínio que já tenho**. Digite
   `helptest.online`. O site precisa existir na Hostinger **antes** de apontar o domínio.
2. No site onde você comprou o domínio, procure **Nameservers** (ou DNS). Troque os que estão lá por:
   - `ns1.dns-parking.com`
   - `ns2.dns-parking.com`
3. Salve. Pode levar algumas horas (até 24 h) para funcionar em todo lugar.
4. Para conferir no hPanel: **Domains (Domínios) → helptest.online → DNS / Nameservers**.

---

## Parte 2: subir o site

1. hPanel → **Websites** → `helptest.online` → **Dashboard/Painel** → **File Manager** (Gerenciador de Arquivos).
2. Entre na pasta **`public_html`**.
3. Se houver arquivos de exemplo da Hostinger (`default.php`, `index.php`), apague só eles.
4. Clique no ícone de **Upload** (canto superior direito) e envie `helptest-site-2026-10-13.zip`.
5. Clique com o botão direito no zip → **Extract** (Extrair). No destino, deixe **a própria `public_html`**, não uma
   subpasta. Se perguntar sobre substituir arquivos, marque **sim**.
6. Confira: dentro de `public_html` devem estar direto o `index.html` e as pastas `_next`, `media`,
   `uk-driving-theory`, `privacy`… Se aparecer uma pasta `helptest-site-2026-10-13` com tudo dentro, os arquivos
   ficaram um nível abaixo; mova o conteúdo dela para `public_html`.
7. Apague o `.zip` de dentro de `public_html`. Tudo que fica ali é público.

> O arquivo `.htaccess` (página de erro 404 e cache) vem dentro do zip. Ele começa com ponto, então pode ficar
> escondido; no File Manager há a opção de mostrar arquivos ocultos.

---

## Parte 3: cadeado (HTTPS)

1. hPanel → **Security → SSL** (Segurança → SSL). A Hostinger instala o SSL grátis sozinha depois que o domínio
   aponta para ela. Pode levar de alguns minutos a algumas horas.
2. Quando o status estiver **Active** (Ativo), ligue **Force HTTPS** (Forçar HTTPS).
3. Se o navegador mostrar "conexão não segura" logo depois de publicar, é o SSL ainda sendo instalado. Espere e
   tente de novo.

---

## Parte 4: conferir (5 minutos)

- [ ] `https://helptest.online` abre com a logo nova e **sem** a faixa vermelha de PREVIEW.
- [ ] O cadeado aparece na barra do navegador.
- [ ] A busca: digite `roundabouts` e o guia aparece; escolha "United Kingdom" no país e ele continua aparecendo.
- [ ] Na página do produto, o botão do **Basic** abre `pay.hotmart.com/K108006347L` e o do **Complete** abre
      `pay.hotmart.com/Q108006436Q`. Não precisa pagar, só ver se abre.
- [ ] No celular, a página inicial e a do produto ficam certas.
- [ ] `https://helptest.online/sitemap.xml` abre (lista das páginas para o Google).
- [ ] Uma página que não existe (ex.: `helptest.online/teste`) mostra a página "não encontrada" do site.
- [ ] `www.helptest.online` também abre o site.

---

## Parte 5: Hotmart

1. **Página externa:** no campo "Insira o endereço (URL) da sua página", coloque
   `https://helptest.online/uk-driving-theory/`.
2. **Arquivos:** na área de membros de cada produto, troque os arquivos antigos (com o nome "Help Test") pelos novos
   `HelpTest-UK-Theory-Basic.zip` e `HelpTest-UK-Theory-Complete.zip` (ou pelos PDFs de dentro deles).
3. **Imagens:** troque as imagens dos produtos por `hotmart-basic.png` e `hotmart-complete.png`.

---

## Parte 6 (opcional): aparecer no Google

1. Entre no [Google Search Console](https://search.google.com/search-console) e adicione a propriedade de
   **Domínio** `helptest.online`.
2. O Google mostra um registro **TXT**. No hPanel: **Domains → helptest.online → DNS / Nameservers → adicionar
   registro** do tipo TXT, nome `@`, com o valor que o Google deu. Volte ao Google e clique em **Verificar**.
3. Em **Sitemaps**, envie `sitemap.xml`.

---

## Quando houver uma versão nova do site

1. Eu gero um novo `helptest-site-AAAA-MM-DD.zip` (comando `npm run site:package`).
2. No File Manager, apague o conteúdo de `public_html` (o site antigo) e repita a Parte 2 com o zip novo.

## Se algo der errado

| O que aparece | O que fazer |
|---|---|
| Página da Hostinger dizendo que o domínio está "estacionado" | O domínio ainda não aponta para a hospedagem: Parte 1. No caso B, espere até 24 h. |
| Lista de arquivos, erro 403 ou página em branco | Os arquivos ficaram numa subpasta: Parte 2, passo 6. |
| Aviso de "conexão não segura" | SSL ainda sendo instalado: Parte 3. |
| "Too many redirects" (redirecionamentos demais) | Desligue o Force HTTPS, espere o SSL ficar Ativo e ligue de novo. |
| Ainda aparece o site antigo depois de atualizar | É cache: hPanel → **Cache Manager → Purge all** (Limpar tudo) e recarregue a página com Ctrl+F5. |
