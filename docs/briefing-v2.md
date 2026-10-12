# Briefing para o Claude Code — Loja de mapas visuais de revisão para provas (Europa) — v2

## 0. Resumo em 30 segundos

- Vamos montar uma **loja de infoprodutos low ticket**: pacotes de **mapas visuais de revisão** em PDF, um pacote por prova.
- **Primeiro nicho: UK Driving Theory Test** (prova teórica de direção do Reino Unido). Público em inglês, preço em **libra (£)**.
- A arquitetura precisa permitir **adicionar novas provas e novos países só trocando arquivos de conteúdo/config**. Os próximos candidatos são as provas teóricas de direção de outros países (França, Espanha, Alemanha…), no mesmo template e traduzidas, e o Life in the UK Test.
- Checkout e entrega: **Hotmart** (pagamento, imposto europeu e área de membros). Nada de Stripe ou Cakto.
- Primeiro validamos **1 nicho** com anúncios. Só depois produzimos o segundo. Construa pensando em vários, mas entregue um.

> Não copie textos, imagens nem conteúdo de concorrentes ou do anúncio de referência. Use só a estrutura e a lógica de venda. Todo o conteúdo e o visual serão originais.

---

## 1. Arquitetura da loja (multi-nicho)

```
/content
  /niches
    /uk-driving-theory
      niche.json          ← nome da prova, país, idioma, moeda, preços, áreas, textos da página, FAQ, links de checkout
      /maps
        signs-warning.json
        stopping-distances.json
        ...               ← 1 arquivo JSON por mapa
      /bonuses
        ...
  site.json               ← nome da marca, domínio, links legais, pixel
/templates
  map.html                ← template único do mapa A4 (lê o JSON)
  bonus-*.html
/app ou /pages            ← home da loja + 1 página de vendas por nicho
/scripts
  build-pdfs              ← gera todos os PDFs a partir dos JSONs
```

- **Home da loja** (`/`): lista as provas disponíveis em cards. No começo terá só uma.
- **Página de vendas por nicho** (`/uk-driving-theory`): mesmo componente para todos os nichos, alimentado por `niche.json`.
- **i18n por nicho:** cada nicho define `language` e `currency`. Nichos futuros em francês, espanhol ou alemão usam o mesmo template.
- Placeholders da marca: `{{BRAND_NAME}}`, `{{DOMAIN}}`, `{{SUPPORT_EMAIL}}`.
- **Stack sugerida:** Next.js com exportação estática (`output: 'export'`), para hospedar em qualquer lugar (Hostinger/Vercel). Mobile-first, rápido e com imagens otimizadas.

---

## 2. Geração dos mapas (pipeline)

O gargalo é produzir 100+ mapas, então **nada de mapa feito à mão um por um**:

1. Cada mapa é um **arquivo JSON** com o conteúdo estruturado (ver seção 3).
2. Um **template HTML/CSS único** renderiza qualquer mapa.
3. Um script (Playwright/Puppeteer → `page.pdf()`) gera os PDFs em **A4** (padrão do Reino Unido e da Europa) e também PNGs de cada página para usar na página de vendas e nos anúncios.
4. O script junta os mapas por área num PDF e gera o pacote completo e o pacote Basic.
5. Um validador checa se todo JSON tem todos os blocos obrigatórios e o campo `source`.

---

## 3. Estrutura do mapa (genérica, com presets por nicho)

**Blocos padrão** (qualquer prova):
1. **What it is**: definição curta.
2. **Key rules / facts**: o que precisa saber, em tópicos curtos.
3. **Visual**: diagrama, fluxograma, tabela, linha do tempo ou ilustração (o coração do mapa).
4. **Easily confused (X vs Y)**: comparativo do que o candidato mistura.
5. **How it shows up on the test**: 1–2 questões **originais** no estilo da prova, com o porquê da resposta certa.
6. **Traps**: pegadinhas e erros comuns.
7. **Source**: referência oficial (ex.: "Highway Code, Rule 126"). Aumenta a confiança e facilita a revisão.

**Preset do nicho UK Driving Theory:**
- O bloco Visual geralmente é: placa desenhada, diagrama de cruzamento/rotatória, régua de distâncias de parada ou tabela de limites.
- Placas devem ser **desenhadas como SVG próprio**, seguindo forma e cor padrão (triângulo vermelho = aviso, círculo = ordem etc.). Não use imagens oficiais sem confirmar a licença.

**Padrão visual:** 1 tema por página, mesma grade, **1 cor por área**, tipografia consistente, ícones de uma única biblioteca. Visual limpo e direto, legível no celular.

**Exemplo de JSON de mapa:**
```json
{
  "id": "stopping-distances",
  "area": 3,
  "title": "Stopping Distances",
  "whatItIs": "...",
  "keyFacts": ["...", "..."],
  "visual": { "type": "bar-scale", "data": [] },
  "confused": { "a": "Thinking distance", "b": "Braking distance", "points": [] },
  "onTheTest": [{ "question": "...", "options": ["..."], "answer": 1, "why": "..." }],
  "traps": ["..."],
  "source": "Highway Code, Rule 126"
}
```

---

## 4. Nicho 1: UK Driving Theory Test

**Sobre a prova** (para a página e a FAQ; conferir no gov.uk antes de publicar):
- 2 partes no mesmo dia, as duas precisam ser aprovadas:
  - Múltipla escolha: 50 questões em 57 minutos, aprovação com 43/50.
  - Hazard perception: 14 vídeos, aprovação com 44/75.
- Taxa da prova: £23. O certificado vale 2 anos.
- Menos da metade dos candidatos passa, e mais de 2,7 milhões de provas são feitas por ano na Grã-Bretanha. Esse é o argumento central da dor.
- Fonte oficial do conteúdo: **The Highway Code** e o material público da DVSA.

**6 áreas** (`{{AREA_1}}`…`{{AREA_6}}`; temas iniciais, a ajustar):
1. **Road & Traffic Signs**: placas de aviso, de ordem e informativas · marcações no asfalto · semáforos e sinais de mão.
2. **Rules of the Road**: preferência e cruzamentos · rotatórias · ultrapassagem · estacionamento · limites de velocidade.
3. **Motorways**: entrar e sair · uso das faixas · smart motorways · acostamento e paradas.
4. **Safety Margins & Vehicle Handling**: distâncias de parada · clima (chuva, gelo, neblina) · aquaplanagem · descidas.
5. **Hazard Awareness & Vulnerable Road Users**: atenção e cansaço · álcool e drogas · pedestres, ciclistas, motociclistas, cavalos · outros veículos.
6. **Your Vehicle, Documents & Incidents**: manutenção e pneus · carga · documentos (licença, seguro, MOT) · acidentes, primeiros socorros e emergências.

**Conteúdo estratégico (3 blocos):**
- **Numbers to know**: limites de velocidade, distâncias de parada, limites de álcool, prazos e documentos.
- **Decisions**: quem tem preferência, rotatórias, cruzamentos e situações de decisão.
- **Traps**: placas parecidas, perguntas de "most / least", erros mais comuns.

**Regras de conteúdo:**
- Questões do bloco "How it shows up on the test" são **100% originais**. O banco oficial de questões da DVSA é licenciado: não reproduza questões oficiais.
- Não copie texto do Highway Code palavra por palavra. Resuma e cite a regra no campo `source`.
- Todo mapa passa por uma conferência de fatos contra a fonte oficial antes de entrar no pacote.

**Bônus (6):**
1. **Hazard Perception Visual Guide**: tipos de perigo em desenvolvimento, quando clicar, erros que zeram a pontuação.
2. **Critical Signs Cheat Sheet**: as placas mais confundidas lado a lado.
3. **Numbers Table**: velocidades, distâncias, limites e prazos numa página.
4. **30-Day Revision Plan**: cronograma diário por área.
5. **Test-Day Checklist**: o que levar, como funciona o dia, dicas de tempo.
6. **Flashcards**: placas e números, em PDF para imprimir ou usar no celular.

---

## 5. Página de vendas (mesmo componente para todos os nichos)

Página única, longa e mobile-first, com CTA a cada 1–2 seções (sempre levando aos preços). Textos em **inglês britânico** (UK spelling: "colour", "licence", "practise"), tom direto e confiante.

1. **Barra de topo:** "🎁 Today's offer: {{TOTAL_MAPS}} Maps + 6 bonuses", com data dinâmica. **Sem "% OFF" se o desconto não for real.**
2. **Hero:**
   - Etiqueta: `{{EXAM_NAME}} {{YEAR}}`
   - H1: "{{TOTAL_MAPS}} Visual Revision Maps to pass your {{EXAM_NAME}}"
   - Subtítulo: A4 illustrated maps organised by topic (listar as áreas), ready to revise.
   - Botões: "GET MY MAPS NOW" (rola até os preços) e "SEE WHAT'S INSIDE" (rola até o conteúdo).
   - 4 bullets: organised maps · content by topic · lifetime access + free updates · 6 bonuses.
   - Linha de prova social: **só aparece se `socialProof` estiver preenchido no config.**
   - Mockup do material (pilha de páginas / tablet).
3. **"Real pages from the material":** carrossel com 4–8 PNGs reais gerados pelo pipeline + CTA.
4. **"6 topics, all in visual maps":** 6 cards numerados (01–06) com 4–6 temas cada.
5. **"Look inside":** zoom e detalhes das páginas.
6. **"Strategic content":** os 3 blocos (Numbers to know · Decisions · Traps).
7. **"Who is this for":** quem vai fazer a prova em breve · quem aprende melhor visualmente · quem já reprovou ou precisa revisar rápido.
8. **Bônus:** "6 bonuses worth a product on their own", 6 cards com mockup, nome e 1 linha.
9. **"How access works":** Buy → Email in minutes → Log in to the members area → Download the PDFs → Revise and pass.
10. **Depoimentos:** componente pronto, **oculto automaticamente enquanto a lista estiver vazia**. Só depoimentos reais. Não inventar nomes, números de alunos nem aprovações.
11. **Preços:** "Lifetime access, one-time payment. No subscription."
    - **Basic:** versão resumida (poucas áreas, sem bônus) + aviso "⚠️ Basic version. Only Complete includes:" com a lista do que fica de fora (✗).
    - **Complete (destacado, "MOST POPULAR"):** tudo + bônus + updates + suporte.
    - Variáveis: `{{PRICE_BASIC}}`, `{{PRICE_COMPLETE}}`, `{{PRICE_ANCHOR}}`, `{{CURRENCY}}` (aqui GBP).
    - Sugestão inicial: **Basic £15 / Complete £24–27**. Não colocar o Basic abaixo de £15, porque a Hotmart cobra taxa extra em vendas abaixo de 15.
    - **Preço âncora riscado só se for um preço realmente praticado.** Se não for, mostrar o "valor total dos bônus" no lugar. Âncora falsa pode ser enquadrada como preço enganoso e também reprova anúncio na Meta.
12. **Garantia:** "Risk-free for 14 days", reembolso integral. São 14 dias e não 7, para ficar alinhado com a regra europeia e britânica de direito de desistência.
13. **FAQ (accordion):** Who is it for? · Is it up to date for {{YEAR}}? · How do I receive it? · Can I print it? · Does it work on phone/tablet? · Does it cover hazard perception? · Are the files editable? (não, PDF em alta) · Refund?
14. **CTA final + rodapé:** disclaimer "This product is independent and is not affiliated with, endorsed by or connected to the DVSA or any government body." + links para Privacy, Terms e Refund policy.

**Proibido na copy:** "guaranteed pass", contador regressivo falso, números de alunos inventados.

---

## 6. Checkout, entrega e rastreamento

- **Plataforma: Hotmart.** Ela aceita na Europa cartão de crédito/débito, PayPal, Google Pay e Klarna, converte a moeda e, para produto digital vendido a comprador da UE, recolhe o VAT como revendedora.
- **Entrega:** área de membros da Hotmart (PDFs para download).
- Botões: `{{CHECKOUT_BASIC_URL}}` e `{{CHECKOUT_COMPLETE_URL}}` vindos do `niche.json`.
- **Meta Pixel** no site: PageView, ViewContent e InitiateCheckout (no clique dos botões de compra).
- **Purchase:** é disparado pela integração de pixel da Hotmart (o checkout é dela). Deixar documentado como configurar, e considerar a Conversions API.
- **Pendência (responsabilidade do Kauã, não do código):** confirmar com o suporte da Hotmart se ela também recolhe o **VAT do Reino Unido** para criador no Brasil antes de rodar anúncios no Reino Unido.

---

## 7. Páginas legais

- Privacy Policy (GDPR/UK GDPR: dados coletados pelo pixel e pelo checkout, banner de cookies antes de carregar o pixel).
- Terms of Use.
- Refund Policy (14 dias).
- Textos com placeholders da marca e do e-mail de suporte.

---

## 8. Entregas esperadas (em etapas)

1. **Estrutura do projeto + template de mapa A4 + 3 mapas de exemplo** do nicho UK (sugestão: Warning Signs, Stopping Distances, Roundabouts), já gerando PDF e PNG pelo script. **Parar aqui para validar o estilo.**
2. Página de vendas completa do nicho UK + home da loja, lendo tudo do config.
3. Modelos dos 6 bônus (mesmo pipeline JSON → PDF).
4. 3–5 criativos de carrossel para o anúncio, usando os PNGs reais das páginas (formatos 1080×1080 e 1080×1350).
5. Páginas legais.

Ao terminar cada etapa: rodar build, conferir no celular (360–390px) e me mostrar antes de seguir.
