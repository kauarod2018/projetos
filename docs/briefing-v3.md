# Briefing para o Claude Code — Loja de mapas visuais de revisão para provas (Europa) — v3

> v3 revisada em 12/10/2026. O que mudou em relação à v2 e por quê: `docs/revisao-v2-para-v3.md`.
> Fatos marcados com **[conferir]** foram checados em fontes secundárias. O gov.uk estava bloqueado no ambiente da revisão, então reconfira no gov.uk antes de publicar.

## 0. Resumo em 30 segundos

- Vamos montar uma **loja de infoprodutos low ticket**: pacotes de **mapas visuais de revisão** em PDF, um pacote por prova.
- **Primeiro nicho: UK Driving Theory Test**, a prova teórica de carro da **Grã-Bretanha** (Inglaterra, Escócia e País de Gales). A Irlanda do Norte tem prova e órgão próprios (DVA) e fica de fora. Público em inglês britânico, preço em **libra (£)**.
- A arquitetura precisa permitir **adicionar novas provas e novos países só trocando arquivos de conteúdo/config**. Os próximos candidatos são as provas teóricas de direção de outros países (França, Espanha, Alemanha…) e o Life in the UK Test (ver seção 10).
- Checkout e entrega: **Hotmart** (pagamento, imposto e área de membros). Nada de Stripe ou Cakto.
- Primeiro validamos **1 nicho** com anúncios. Só depois produzimos o segundo. Construa pensando em vários, mas entregue um.

> Não copie textos, imagens nem conteúdo de concorrentes ou do anúncio de referência. Use só a estrutura e a lógica de venda. Todo o conteúdo e o visual serão originais, com uma exceção autorizada: as imagens oficiais das placas do Department for Transport (ver 4.4).

### 0.1 Regras que nunca podem ser quebradas

1. **Nenhum fato entra no PDF vendido sem fonte e sem conferência.** Mapa com `review.status` diferente de `verified` sai com marca d'água "DRAFT" e não entra nos pacotes.
2. **Mão inglesa em tudo:** no Reino Unido se dirige pela **esquerda**, as rotatórias giram no **sentido horário** e se dá preferência a quem vem **pela direita**. Qualquer diagrama com tráfego pela direita é erro grave.
3. **Placas nunca são redesenhadas "de cabeça".** Use as imagens oficiais do DfT, sem alterar cor, forma nem símbolo (4.4).
4. **Nenhum número na página de vendas é digitado à mão.** `TOTAL_MAPS`, número de áreas, de bônus e de páginas são calculados pelo build a partir dos arquivos que existem.
5. **Nenhuma afirmação de venda sem lastro:** sem prova social inventada, sem urgência falsa, sem preço âncora fictício e sem "valor" de bônus que nunca foi vendido (seção 5.2).
6. **O preço mostrado na página é o preço final que o comprador do Reino Unido paga no checkout, com VAT incluído** (seção 6).

---

## 1. Arquitetura da loja (multi-nicho)

```
/content
  site.json                 ← marca, domínio, e-mail de suporte, dados legais da empresa, pixel
  /i18n
    en-GB.json              ← rótulos dos blocos do mapa e textos fixos da interface (por idioma)
  /niches
    /uk-driving-theory
      niche.json            ← dados da prova, preços, áreas, FAQ, checkout, versão do conteúdo
      numbers.json          ← "Numbers to know" com fonte de cada número (alimenta mapas e bônus)
      /maps
        signs-warning.json
        stopping-distances.json
        ...                 ← 1 arquivo JSON por mapa (schema na seção 3)
      /bonuses
        ...
  /assets
    /signs/uk               ← SVGs convertidos das imagens oficiais do DfT + signs.json (manifesto)
/schemas                    ← schemas (zod ou JSON Schema) de map, niche, site, numbers, signs
/templates
  map.html                  ← template único do mapa A4 (lê o JSON)
  bonus-*.html
/app                        ← home da loja + página de vendas por nicho (rota dinâmica)
/scripts
  validate                  ← valida todos os JSONs (roda antes do build e no CI)
  build-pdfs                ← gera PDFs e PNGs a partir dos JSONs
```

- **Home da loja** (`/`): lista as provas disponíveis em cards. No começo terá só uma.
- **Página de vendas por nicho** (`/uk-driving-theory/`): mesmo componente para todos os nichos, alimentado por `niche.json`.
- **i18n por nicho:** cada nicho define `language` (ex.: `en-GB`) e `currency` (ex.: `GBP`). Os **rótulos** dos blocos ("What it is", "Traps"…) e os textos fixos vêm de `/content/i18n/{language}.json`, nunca escritos dentro do template. Preços formatados com `Intl.NumberFormat(language, { style: 'currency', currency })`.
- **Placeholders do site** (`site.json`): `{{BRAND_NAME}}`, `{{DOMAIN}}`, `{{SUPPORT_EMAIL}}`, `{{LEGAL_ENTITY_NAME}}`, `{{LEGAL_ADDRESS}}`, `{{COMPANY_ID}}` (CNPJ ou equivalente). A lei do Reino Unido exige nome e endereço físico de quem vende, num lugar visível (rodapé e páginas legais).
- **Stack:** Next.js com exportação estática, para hospedar em qualquer lugar (Hostinger/Vercel). Mobile-first e rápido. Cuidados que costumam quebrar o build com `output: 'export'`:
  - `next/image` não otimiza imagens em export estático. Use `images: { unoptimized: true }` e entregue as imagens já otimizadas pelo pipeline (WebP, tamanhos certos).
  - Use `trailingSlash: true`, para `/uk-driving-theory/` virar `index.html` em hospedagem estática.
  - A rota dinâmica do nicho precisa de `generateStaticParams` lendo a pasta `/content/niches`.
  - Nada de API routes, middleware, ISR ou `next/headers`.
  - Tudo que depende de data (ex.: `{{YEAR}}`) é congelado no build. Por isso não existe "data dinâmica" na página (ver 5.2).
  - **Fontes locais** (pacotes `@fontsource/*` ou arquivos no repositório), usadas no site e nos PDFs. Não dependa do Google Fonts na hora do build, porque ele pode estar bloqueado no ambiente.

---

## 2. Geração dos mapas (pipeline)

O gargalo é produzir dezenas de mapas, então **nada de mapa feito à mão um por um**:

1. Cada mapa é um **arquivo JSON** com o conteúdo estruturado (seção 3).
2. `scripts/validate` checa todos os JSONs **antes** de renderizar e falha o build com mensagem clara (arquivo + campo). Ele verifica:
   - schema completo (todos os blocos obrigatórios e o campo `sources` com pelo menos 1 item);
   - limites de texto (ver 3.2);
   - `answerIndex` válido e exatamente 4 opções distintas por questão;
   - `area` existente em `niche.json` e tópicos DVSA válidos;
   - toda placa citada (`signId`) existe em `signs.json`;
   - **cobertura:** cada um dos 14 tópicos oficiais da DVSA (4.2) tem pelo menos 2 mapas no Complete e 1 no Basic;
   - IDs únicos e nomes de arquivo iguais ao `id`.
3. Um **template HTML/CSS único** renderiza qualquer mapa.
4. O script usa **Playwright** (`page.pdf()`) para gerar os PDFs em **A4**. Detalhes que evitam erro:
   - `@page { size: A4; margin: 0 }` no CSS, com `preferCSSPageSize: true` e **`printBackground: true`** (sem isso as cores de fundo somem do PDF);
   - esperar `document.fonts.ready` e o carregamento de todas as imagens/SVGs antes de gerar;
   - **detector de estouro:** se o conteúdo passar de 1 página A4, o build falha e diz qual mapa estourou. A solução é encurtar o texto ou dividir o tema em dois mapas, nunca diminuir a fonte abaixo do mínimo;
   - no ambiente de nuvem do Claude Code o Chromium já vem instalado (`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`). Não rode `playwright install`; se a versão não bater, use `executablePath: '/opt/pw-browsers/chromium'`.
5. Gera também um **PNG por página** (viewport 794×1123, `deviceScaleFactor: 2`) e uma versão **WebP** para o site e os anúncios.
6. Junta os mapas por área num PDF (`pdf-lib`), preenche os metadados (título, autor = marca) e gera:
   - **Complete:** todos os mapas `verified` + bônus;
   - **Basic:** só os mapas com `tier: "basic"` (ver 4.3).
   Nomes de arquivo legíveis: `UK-Theory-Maps-Area-1-Road-and-Traffic-Signs.pdf`.
7. **Rodapé de versão em toda página:** `{{BRAND_NAME}} · v{{contentVersion}} · Checked against The Highway Code on {{checkedOn}} · p. X`. Esse rodapé sustenta a promessa de "up to date" e de atualizações.
8. **Página de créditos** no início de cada PDF, com o disclaimer de independência (5.1, item 14) e as atribuições de licença (4.4).
9. O build também grava um `manifest.json` com contagens (mapas por área e por tier, bônus, páginas). A página de vendas lê esses números desse arquivo.

---

## 3. Estrutura do mapa (genérica, com presets por nicho)

### 3.1 Blocos

**Blocos padrão** (qualquer prova):
1. **What it is**: definição curta.
2. **Key rules / facts**: o que precisa saber, em tópicos curtos. No preset UK, marque com um selo **"LAW"** o que o Highway Code escreve com **MUST / MUST NOT**, porque isso é exigência legal. "Should / do / do not" é recomendação. A prova cobra essa diferença.
3. **Visual**: diagrama, fluxograma, tabela, linha do tempo, régua ou grade de placas (o coração do mapa).
4. **Easily confused (X vs Y)**: comparativo do que o candidato mistura.
5. **How it shows up on the test**: 1–2 questões **originais** no estilo da prova (4 opções, 1 correta), com o porquê da resposta certa.
6. **Traps**: pegadinhas e erros comuns.
7. **Sources**: referência oficial (ex.: "The Highway Code, Rule 126"). Aumenta a confiança e facilita a revisão.

**Preset do nicho UK Driving Theory:**
- O bloco Visual geralmente é: grade de placas, diagrama de cruzamento/rotatória, régua de distâncias de parada ou tabela de limites.
- **Placas:** sempre pela referência `signId` ao manifesto `signs.json`, que aponta para a imagem oficial do DfT (4.4).
- **Diagramas de via:** monte com um conjunto pequeno de peças reutilizáveis (pista, faixa, seta, carro, pedestre, ciclista), já configuradas para **mão inglesa**. Não desenhe cada diagrama do zero. Checklist de revisão de todo diagrama: carros do lado esquerdo da pista · rotatória no sentido horário · preferência para quem vem da direita · setas de saída coerentes com a faixa.

**Padrão visual:** 1 tema por página, mesma grade, **1 cor por área**, tipografia consistente, ícones de uma única biblioteca (ex.: Lucide). A cor da área nunca é o único jeito de identificar a área: use também número e ícone, porque muita gente imprime em preto e branco. Evite cores de área que se confundam com as cores das placas (vermelho de proibição, azul de ordem).
- Tamanho mínimo de fonte no PDF: **9 pt** no corpo e **8 pt** em legendas.
- **Leitura no celular:** um A4 inteiro numa tela de 360–390 px fica pequeno. O A4 é pensado para imprimir e para tablet; no celular a pessoa dá zoom. A página de vendas e a FAQ precisam dizer isso com honestidade. Uma versão "phone edition" (mesmo JSON, página estreita, um bloco por tela) fica como melhoria opcional depois da validação.

### 3.2 Schema do mapa

```json
{
  "schemaVersion": 1,
  "id": "stopping-distances",
  "niche": "uk-driving-theory",
  "area": "safety-margins",
  "order": 1,
  "tier": "basic",
  "dvsaTopics": ["safety-margins"],
  "title": "Stopping Distances",
  "whatItIs": "The distance your car travels from the moment you see a hazard until it stops: thinking distance plus braking distance.",
  "keyFacts": [
    "Overall stopping distance = thinking distance + braking distance.",
    "The table assumes a dry road, good brakes and tyres, and an alert driver.",
    "On wet roads, stopping distances are at least double.",
    "On icy roads, braking distances can be up to ten times greater."
  ],
  "visual": {
    "type": "bar-scale",
    "caption": "Typical stopping distances (dry road)",
    "data": {
      "unit": "m",
      "segments": ["thinking", "braking"],
      "rows": [
        { "label": "20 mph", "values": [6, 6], "total": 12, "totalFeet": 40 },
        { "label": "30 mph", "values": [9, 14], "total": 23, "totalFeet": 75 },
        { "label": "40 mph", "values": [12, 24], "total": 36, "totalFeet": 118 },
        { "label": "50 mph", "values": [15, 38], "total": 53, "totalFeet": 175 },
        { "label": "60 mph", "values": [18, 55], "total": 73, "totalFeet": 240 },
        { "label": "70 mph", "values": [21, 75], "total": 96, "totalFeet": 315 }
      ]
    }
  },
  "confused": {
    "a": { "label": "Thinking distance", "points": ["Grows in step with speed", "Longer if you're tired, distracted or have been drinking"] },
    "b": { "label": "Braking distance", "points": ["Grows much faster than speed", "Longer on wet or icy roads and with worn tyres"] }
  },
  "onTheTest": [
    {
      "question": "You're driving at 50 mph on a dry road. What is the typical overall stopping distance?",
      "options": ["23 metres (75 feet)", "36 metres (118 feet)", "53 metres (175 feet)", "96 metres (315 feet)"],
      "answerIndex": 2,
      "why": "At 50 mph: 15 m thinking + 38 m braking = 53 m (175 feet)."
    }
  ],
  "traps": [
    "Don't confuse braking distance with overall stopping distance.",
    "The figures are for dry roads. Wet or icy roads change the answer."
  ],
  "sources": [
    { "doc": "The Highway Code", "ref": "Rule 126", "url": "https://www.gov.uk/guidance/the-highway-code" }
  ],
  "jurisdictionNotes": [],
  "review": { "status": "draft", "checkedOn": null, "checkedAgainst": null }
}
```

Regras do schema:
- `area` é um **slug** que existe em `niche.json` (não um número). O número exibido (01–06) vem da ordem das áreas no `niche.json`.
- `tier`: `"basic"` (entra nos dois pacotes) ou `"complete"` (só no Complete).
- `dvsaTopics`: um ou mais dos 14 slugs da seção 4.2.
- `answerIndex` começa em **0**. Sempre 4 opções, uma correta, sem "all of the above".
- `visual.type` é um enum fechado, cada um com o seu schema de `data`: `sign-grid` (lista de `signId` + legenda), `bar-scale`, `table`, `flowchart`, `road-diagram` (peças da 3.1), `comparison`, `timeline`.
- `sources` é uma lista. Cada item tem `doc`, `ref` e `url`.
- `jurisdictionNotes`: diferenças dentro da Grã-Bretanha (ex.: limite de álcool na Escócia).
- `review.status`: `draft` → `verified`. Só vira `verified` com `checkedOn` (data) e `checkedAgainst` (documento e versão conferidos).
- **Limites de texto** (o validador checa): `whatItIs` ≤ 200 caracteres · `keyFacts` 3–6 itens de ≤ 120 caracteres · `confused` 2–4 pontos por lado · `onTheTest` 1–2 questões · `traps` 2–4 itens.

---

## 4. Nicho 1: UK Driving Theory Test

### 4.1 Sobre a prova (para a página e a FAQ)

| Fato | Valor | Situação |
|---|---|---|
| Partes | 2 partes no mesmo dia; é preciso passar nas duas. Quem passa numa e reprova na outra refaz as duas. | confirmado |
| Múltipla escolha | 50 questões em 57 minutos; aprovação com **43/50** | confirmado |
| Vídeo na múltipla escolha | Desde 28/09/2020, **3** das 50 questões são sobre um vídeo curto (substituiu o antigo estudo de caso) | confirmado |
| Hazard perception | **14** vídeos com **15** perigos (um vídeo tem 2); até 5 pontos por perigo; aprovação com **44/75** | confirmado |
| Cliques em padrão | Clicar sem parar ou em padrão zera a pontuação daquele vídeo | [conferir] |
| Taxa | **£23** (uma consulta pública, de data não confirmada, propôs £23,40) | [conferir] no gov.uk |
| Validade do certificado | 2 anos | [conferir] |
| Taxa de aprovação | **44,8%** das provas teóricas de carro em abr/2025–mar/2026 (tabela DVSA DRT111A) | [conferir] |
| Volume | ~**2,9 milhões** de provas teóricas de carro em 2025/26 na Grã-Bretanha | [conferir] |

- **Formulação correta da dor:** "Fewer than half of car theory tests are passed". A estatística conta **provas feitas** (com repetições), não candidatos. Não escreva "menos da metade dos candidatos passa".
- **Fontes oficiais do conteúdo:** **The Highway Code**, **Know Your Traffic Signs** (DfT) e o material público da DVSA no gov.uk. A DVSA também usa o livro *The Official DVSA Guide to Driving – the essential skills*, que é pago e não é licença aberta: pode ser citado, nunca copiado.
- **Mudanças em andamento que afetam o conteúdo:** a Road Safety Strategy (jan/2026) propõe baixar o limite de álcool da Inglaterra e do País de Gales de 35 para 22 µg/100 ml de ar expirado (o mesmo da Escócia) e criar um período mínimo de aprendizado. Em 10/2026 isso ainda era proposta em consulta. Os mapas mostram a lei em vigor e são atualizados se a lei mudar.

### 4.2 Áreas e cobertura dos 14 tópicos oficiais

A DVSA organiza a prova em **14 tópicos**. Agrupamos em **6 áreas**, e o validador garante que nenhum tópico fique sem mapa:

| Área (slug) | Nome | Tópicos DVSA cobertos (`dvsaTopics`) |
|---|---|---|
| `signs` | Road & Traffic Signs | `road-and-traffic-signs` |
| `rules-of-the-road` | Rules of the Road | `rules-of-the-road`, `attitude` |
| `motorways` | Motorways | `motorway-rules` |
| `safety-margins` | Safety Margins & Vehicle Handling | `safety-margins`, `vehicle-handling` |
| `hazards-and-vulnerable` | Hazard Awareness & Vulnerable Road Users | `alertness`, `attitude`, `hazard-awareness`, `vulnerable-road-users`, `other-types-of-vehicle` |
| `vehicle-docs-incidents` | Your Vehicle, Documents & Incidents | `safety-and-your-vehicle`, `essential-documents`, `incidents-accidents-and-emergencies`, `vehicle-loading` |

Na página de vendas isso vira um argumento honesto: **"All 14 official theory test topics, organised into 6 visual areas"**. Só use essa frase se o validador de cobertura passar.

### 4.3 Inventário inicial de mapas (~60)

Lista de partida, ajustável. **B** = entra também no Basic (`tier: "basic"`). As faixas de regras do Highway Code são referências para pesquisa; o número exato de cada regra vai no `sources` depois da conferência.

**Área 1 — Road & Traffic Signs** (Know Your Traffic Signs; Highway Code: Traffic signs, Road markings, Light signals)
1. How to read any sign: shapes and colours **B**
2. Warning signs: junctions, bends, road layout **B** ← exemplo da etapa 1
3. Warning signs: hazards, road users, animals, level crossings
4. Prohibition signs (red circles) **B**
5. Mandatory signs (blue circles) vs information (blue rectangles)
6. Direction signs: colour by road type (motorway, primary, local, tourist)
7. Road markings along the road (centre lines, hazard lines, double white lines) **B**
8. Road markings across the road and at the kerb (give way, stop, yellow lines, box junctions)
9. Traffic lights and filter arrows **B**
10. Signals by police, authorised persons and other drivers
11. Bus, tram and cycle lanes

**Área 2 — Rules of the Road** (Highway Code H1–H3, 103–203, 238–252, 288–307)
1. Speed limits (Rule 124 table) **B**
2. The hierarchy of road users (H1–H3, mudanças de 2022) **B**
3. Junctions: who goes first **B**
4. Turning right and left, box junctions
5. Roundabouts: approach, lanes, signals (184–187) **B** ← exemplo da etapa 1
6. Mini and multiple roundabouts (188–190)
7. Pedestrian crossings: zebra, pelican, puffin, toucan, equestrian (191–199)
8. Overtaking: when and when not (162–169)
9. Parking and waiting (238–252)
10. Reversing and turning in the road (200–203)
11. Lane discipline and one-way streets
12. Lights and horn: when to use them
13. Level crossings and tramways (288–307)

**Área 3 — Motorways** (Highway Code 253–273; Breakdowns 274–287)
1. Who can't use motorways, and learners **B**
2. Joining and leaving **B**
3. Lane discipline and overtaking **B**
4. Motorway signals, variable limits and the red X **B**
5. Smart motorways and emergency areas
6. Reflective studs and motorway markings
7. Breaking down on a motorway

**Área 4 — Safety Margins & Vehicle Handling** (Highway Code 126, 226–237)
1. Stopping distances (Rule 126) **B** ← exemplo da etapa 1
2. Following distance: the two-second rule **B**
3. Wet roads and aquaplaning **B**
4. Ice and snow **B**
5. Fog
6. Windy weather
7. Hills, gears and coasting
8. Skids, ABS and ESC
9. Driving at night and dazzle

**Área 5 — Hazard Awareness & Vulnerable Road Users** (Highway Code 89–102, 204–225)
1. Alertness, distractions and mobile phones **B**
2. Tiredness
3. Alcohol and the law **B** (com `jurisdictionNotes` para a Escócia)
4. Drugs and medicines
5. Attitude: following too close, courtesy, flashing headlights
6. Pedestrians: children, older and disabled people **B**
7. Cyclists: passing distance, cycle lanes, the Dutch reach **B**
8. Motorcyclists
9. Horse riders and animals
10. Large vehicles, buses, trams and emergency vehicles **B**

**Área 6 — Your Vehicle, Documents & Incidents** (Highway Code 274–287 e Anexos 3–8)
1. Vehicle checks and tyres **B**
2. Eco-safe driving and the environment
3. Seat belts and child restraints
4. Loading and towing **B**
5. Documents: licence, insurance, MOT, vehicle tax, V5C **B**
6. Learner and new driver rules
7. Penalties and points
8. Breakdowns and warning triangles
9. At the scene of an incident and first aid **B**
10. Tunnels and vehicle fires

Total: 60 mapas no Complete, sendo 26 também no Basic. Se o validador de cobertura acusar um tópico DVSA sem mapa no Basic (ex.: `attitude`), promova um mapa daquele tópico para **B**.

### 4.4 Placas e licenças

- O DfT publica no gov.uk mais de 600 **imagens oficiais de placas** (página "Traffic sign images", em JPG e EPS vetorial). Elas podem ser reproduzidas **de graça e sem pedir permissão**, desde que:
  - sejam reproduzidas **com fidelidade** (sem mudar cor, proporção nem símbolo, e sem estilizar);
  - não sejam usadas em contexto enganoso;
  - tenham a indicação de **Crown copyright**.
- **Fluxo:** baixar o pacote EPS uma vez, converter para SVG (Inkscape, ou Ghostscript `ps2pdf -dEPSCrop` seguido de `pdftocairo -svg`), versionar em `/assets/signs/uk/` e registrar cada placa em `signs.json` (`signId` = número do diagrama TSRGD, significado em inglês, arquivo, origem).
- **Atribuição** na página de créditos de cada PDF: "Traffic sign images: Crown copyright, reproduced under the Open Government Licence v3.0." Para conteúdo baseado no Highway Code e no Know Your Traffic Signs: "Contains public sector information licensed under the Open Government Licence v3.0."
- A licença OGL **não** permite usar brasões, logos (DVSA, gov.uk) nem sugerir que o produto é oficial ou endossado.
- Os vídeos oficiais de hazard perception da DVSA são licenciados: não use prints deles. O bônus de hazard perception usa ilustrações próprias.

### 4.5 Números de referência (`numbers.json`)

Alimenta os mapas, o bônus "Numbers Table" e os flashcards. Cada item tem `value`, `source`, `jurisdiction` e `checkedOn`. Nada aqui é digitado de memória pelo agente: tudo é conferido na fonte.

| Item | Valor (GB) | Fonte | Situação |
|---|---|---|---|
| Distâncias de parada | tabela da 3.2 | Highway Code, Rule 126 | confirmado |
| Distância de segurança | ≥ 2 s no seco; ≥ 4 s no molhado; frenagem até 10× maior no gelo | Rule 126 (e a regra de gelo da seção Adverse weather) | valores confirmados; [conferir] número da regra de gelo |
| Limites de velocidade | tabela completa por tipo de veículo e de via | Rule 124 | [conferir] copiar a tabela inteira da fonte |
| Carro com reboque/trailer | 50 mph em pista simples; 60 mph em pista dupla e motorway; proibido na faixa da direita de motorway com 3+ faixas | Rule 124 / seção Motorways | [conferir] |
| Álcool (Inglaterra e País de Gales) | 35 µg/100 ml ar · 80 mg/100 ml sangue · 107 mg/100 ml urina | gov.uk "drink-drive limit" | [conferir] e acompanhar a proposta de 22/50/67 |
| Álcool (Escócia) | 22 µg/100 ml ar · 50 mg/100 ml sangue · 67 mg/100 ml urina | gov.uk "drink-drive limit" | [conferir] |
| Pneus | sulco mínimo de 1,6 mm nos 3/4 centrais da banda, em toda a volta | Highway Code, Anexo 6 | [conferir] |
| MOT | primeiro aos 3 anos do carro | gov.uk | [conferir] |
| Motorista novo | 6 pontos em até 2 anos após passar = carteira cancelada | gov.uk | [conferir] |
| Celular ao volante | £200 + 6 pontos | gov.uk | [conferir] |
| Cadeirinha | até 12 anos ou 135 cm de altura | gov.uk | [conferir] |
| Ultrapassar ciclista | ≥ 1,5 m até 30 mph | Rule 163 | [conferir] |
| Ultrapassar cavalo | ≥ 2 m, no máximo 10 mph | Rule 215 | [conferir] |

### 4.6 Regras de conteúdo

- Questões do bloco "How it shows up on the test" são **100% originais**. O banco oficial de questões da DVSA é licenciado: não reproduza questões oficiais e não use sites de simulado como base. Escreva a partir dos fatos da fonte.
- Não copie o texto do Highway Code palavra por palavra. Resuma, preserve a diferença entre MUST e should, e cite a regra em `sources`. Trechos curtos de regras legais (MUST/MUST NOT) podem ser citados entre aspas com atribuição, quando a redação exata importar.
- Todo mapa passa por **conferência de fatos contra a fonte oficial** antes de virar `verified`. A conferência exige acesso ao gov.uk: se o ambiente bloquear o site, o mapa fica `draft` e a conferência vai para o Kauã. Nunca marque `verified` com base em memória ou em site de terceiros.
- Antes de fechar o conteúdo, conferir a página "Updates to The Highway Code" no gov.uk para pegar mudanças recentes.

### 4.7 Bônus (6) — escopo de cada um

| # | Bônus | Conteúdo | Formato |
|---|---|---|---|
| 1 | **Hazard Perception Visual Guide** | O que é um perigo em desenvolvimento, como funciona a pontuação (5 a 1 ponto conforme o momento do clique), os 14 vídeos e 15 perigos, por que clicar em padrão zera o vídeo, tipos comuns de perigo. Ilustrações próprias. | 4–6 páginas A4 |
| 2 | **Critical Signs Cheat Sheet** | Pares de placas mais confundidas, lado a lado, com a diferença destacada. Usa `signs.json`. | 2 páginas |
| 3 | **Numbers Table** | Todos os itens de `numbers.json` numa página, com a fonte em letra pequena. | 1 página |
| 4 | **30-Day Revision Plan** | **Gerado a partir do inventário de mapas** (área, ordem e tier), para nunca citar um mapa que não existe. Inclui dias de revisão e de simulado. | 2–3 páginas |
| 5 | **Test-Day Checklist** | O que levar (carteira provisória com foto), chegar cedo, como funciona o dia, gestão do tempo nas 2 partes, onde marcar a prova (só pelo gov.uk, £23). Itens operacionais [conferir] no gov.uk. | 1–2 páginas |
| 6 | **Flashcards** | Placas e números gerados de `signs.json` e `numbers.json`. Versão A4 para imprimir (8 cartões por folha, com linhas de corte e verso espelhado para impressão frente e verso) e versão para celular (1 cartão por página, formato vertical). | 2 PDFs |

---

## 5. Página de vendas (mesmo componente para todos os nichos)

Página única, longa e mobile-first, com CTA a cada 1–2 seções (sempre levando aos preços). Textos em **inglês britânico** ("colour", "organised", "licence" como substantivo, "practise" como verbo e "practice" como substantivo). Tom direto e confiante.

### 5.1 Seções

1. **Barra de topo:** "🎁 Complete pack: {{TOTAL_MAPS}} maps + 6 bonuses · One-time payment". **Sem data**, sem "today only" e sem "% OFF" se o desconto não for real.
2. **Hero:**
   - Etiqueta: `{{EXAM_NAME}} {{YEAR}}` (o `{{YEAR}}` só aparece se `contentCheckedOn` for do mesmo ano).
   - H1: "{{TOTAL_MAPS}} Visual Revision Maps to pass your {{EXAM_NAME}}"
   - Subtítulo: "A4 illustrated maps covering all 14 official topics, organised into 6 areas: {{AREAS}}. Ready to print or revise on a tablet."
   - Botões: "GET MY MAPS NOW" (rola até os preços) e "SEE WHAT'S INSIDE" (rola até o conteúdo).
   - 4 bullets: organised maps · all 14 official topics · download and keep forever + free updates · 6 bonuses.
   - A promessa de "free updates" precisa de regra escrita em `niche.json` (`updatePolicy`, ex.: "free updated PDFs whenever The Highway Code or the test format changes, for as long as the product is on sale") e repetida nos Terms.
   - Linha de prova social: **só aparece se `socialProof` estiver preenchido no config.**
   - Mockup do material: pilha de páginas ou tablet **genérico** (sem marca de aparelho), feito com os PNGs reais.
3. **"Real pages from the material":** carrossel com 4–8 PNGs reais, só de mapas `verified`, + CTA.
4. **"6 areas, all 14 official topics":** 6 cards numerados (01–06) com 4–6 temas cada, lidos do inventário.
5. **"Look inside":** zoom e detalhes das páginas.
6. **"Strategic content":** os 3 blocos, cada um ligado a algo que existe no produto:
   - **Numbers to know** → bônus Numbers Table + flashcards;
   - **Decisions** → fluxogramas de cruzamentos, rotatórias e preferência;
   - **Traps** → bloco Traps de cada mapa + Critical Signs Cheat Sheet.
7. **"Who is this for":** quem vai fazer a prova em breve · quem aprende melhor visualmente · quem já reprovou ou precisa revisar rápido.
8. **Bônus:** "6 bonuses included in the Complete pack", 6 cards com mockup, nome, 1 linha e número de páginas (do `manifest.json`).
9. **"How access works":** Buy → Email from Hotmart in minutes → Log in to the members area → Download the PDFs → Revise with confidence.
10. **Depoimentos:** componente pronto, **oculto automaticamente enquanto a lista estiver vazia**. Só depoimentos reais, com autorização registrada. Não inventar nomes, números de alunos nem aprovações.
11. **Preços:** "One-time payment. No subscription. Download and keep forever."
    - **Basic:** {{BASIC_MAP_COUNT}} essential maps covering all 6 areas, sem bônus. Aviso "⚠️ Basic version. Only Complete includes:" com a lista do que fica de fora (✗): os outros mapas, os 6 bônus.
    - **Complete (destacado, selo "RECOMMENDED"):** todos os mapas + 6 bônus. Não use "MOST POPULAR" até haver dados de venda que provem isso.
    - Variáveis: `{{PRICE_BASIC}}`, `{{PRICE_COMPLETE}}`, `{{CURRENCY}}` (GBP). `{{PRICE_ANCHOR}}` fica `null` e não aparece, a menos que o preço tenha sido realmente praticado (ver 5.2).
    - Sugestão inicial: **Basic £15 / Complete £24–27**, preços finais com VAT (seção 6).
    - Texto sob os preços: "Price includes VAT for UK buyers." Só use se for verdade no checkout (seção 6).
12. **Garantia:** "Risk-free for 15 days. Full refund, no questions asked." (15 dias, porque a Hotmart só oferece 7, 15, 21 ou 30 dias, e para a Europa o mínimo é 15.)
13. **FAQ (accordion):**
    - Who is it for?
    - Is it up to date for {{YEAR}}? → responde com a data de `contentCheckedOn` e a versão.
    - Is this official DVSA material? → "No. It's an independent revision guide based on The Highway Code and official public guidance. All practice questions are our own."
    - Does it cover Northern Ireland? → "It's designed for the theory test in Great Britain (England, Scotland and Wales)."
    - How do I receive it?
    - Can I print it? → sim, A4.
    - Does it work on phone/tablet? → "Yes, the PDFs open on any device. They're designed for A4, so they're most comfortable on a tablet or printed; on a phone, zoom in." (A versão de celular dos flashcards entra aqui.)
    - Does it cover hazard perception? → "Yes, with a visual guide to how hazards are scored. You'll still need to practise with video clips."
    - Are the files editable? → não, PDF em alta resolução.
    - Refund? → 15 dias, pela Hotmart.
14. **CTA final + rodapé:**
    - disclaimer: "This product is independent and is not affiliated with, endorsed by or connected to the DVSA, the Department for Transport or any government body.";
    - nome da empresa, endereço físico, e-mail de suporte (`site.json`);
    - links para Privacy, Terms, Refund policy e "Cookie settings".

### 5.2 Proibido na copy e nos anúncios

- "guaranteed pass", "pass first time guaranteed" ou equivalentes.
- Contador regressivo, "today only", "offer ends tonight" ou data que muda sozinha. A lei de consumo do Reino Unido (DMCC Act 2024, em vigor desde 06/04/2025) trata urgência falsa como prática enganosa.
- Números de alunos, aprovações ou avaliações inventados. Avaliações falsas estão na lista de práticas sempre proibidas da DMCC Act.
- Preço âncora riscado que nunca foi praticado.
- "Bonuses worth £X" ou "valor total dos bônus" se os bônus nunca foram vendidos separadamente por esse preço. Tem o mesmo problema da âncora falsa. No lugar, mostre o que tem dentro (número de páginas, o que cobre).
- "MOST POPULAR" sem dados.
- "Official", "DVSA approved" ou logos do governo, na marca, no domínio, na página ou nos anúncios.
- "Fewer than half of candidates pass" (o correto é "of tests").

---

## 6. Checkout, entrega e rastreamento (Hotmart)

**Configuração da Hotmart:**
- **2 produtos separados** (Basic e Complete), cada um com seu checkout e sua área de membros. **Sem order bump, funil ou combo (bundle):** a Hotmart não oferece Klarna nessas ofertas, e o Google Pay também fica de fora do order bump.
- **Upgrade Basic → Complete:** opcional, por cupom enviado por e-mail aos compradores do Basic.
- **Garantia:** **15 dias** em ambos os produtos.
- **Moeda:** preço em **GBP**. [conferir] se a conta permite precificar em GBP (a Hotmart lista GBP entre as moedas, mas a fonte é antiga).
- **Meios de pagamento na Europa:** cartão, PayPal, Google Pay e Klarna (que a Hotmart diz estar disponível no Reino Unido para pagamento único de produto digital).
- **Imposto e preço final:** para produto digital vendido a comprador da UE, a Hotmart calcula, cobra e recolhe o VAT. Nesse modelo o preço cadastrado é **sem imposto** e o VAT é **somado no checkout**. A lei do Reino Unido exige que o consumidor veja o preço final com impostos desde o início (cobrança escondida no fim do checkout, a "drip pricing", é proibida pela DMCC Act). Então:
  1. confirmar com a Hotmart se o VAT do Reino Unido é recolhido por ela e somado no checkout (a pendência da seção 9);
  2. se for somado, cadastrar o preço base de forma que **base + VAT = preço redondo mostrado na página** (ex.: base £12,50 + 20% = **£15,00**; base £20,00 + 20% = **£24,00**);
  3. **testar o checkout com endereço do Reino Unido** e conferir que o total bate exatamente com a página antes de ligar os anúncios.
  Compradores de outros países europeus pagam o VAT do próprio país, então o total deles pode variar. A página do nicho UK mostra o preço do Reino Unido.
- **Taxas da Hotmart:** 9,9% + taxa fixa por venda. A central de ajuda informa que a taxa fixa internacional passou de 0,50 para **1,00 EUR/USD em 21/09/2026**. A regra da v2 ("taxa extra abaixo de 15") **não foi confirmada**: as fontes falam de taxa de microtransação *menor* para vendas baixas, e a de 20% vale para vendas de até R$ 10 no Brasil. O piso de £15 continua recomendado, mas por margem, não por essa regra. Estimativa a confirmar: líquido de ~£10 por Basic de £15 e ~£17 por Complete de £24 (já sem VAT e taxas, antes do custo de anúncio).

**Entrega:** área de membros da Hotmart (PDFs para download). A Hotmart envia o e-mail de acesso.

**Site:**
- Botões levam a `{{CHECKOUT_BASIC_URL}}` e `{{CHECKOUT_COMPLETE_URL}}`, vindos do `niche.json`.
- **Repassar os parâmetros de rastreio** da URL da página (`utm_*`, `fbclid`, `src`, `sck`) para o link do checkout. [conferir] quais parâmetros a Hotmart lê.

**Meta Pixel:**
- Carrega **só depois do consentimento** no banner de cookies (seção 7).
- Eventos no site: `PageView`, `ViewContent` (página do nicho, com `content_ids` = id do nicho) e `InitiateCheckout` (no clique dos botões de compra, com `value` e `currency`).
- `Purchase` é disparado pela integração de pixel da própria Hotmart. Configure o **mesmo Pixel ID** no produto dentro da Hotmart e documente o passo a passo.
- **Conversions API:** a Hotmart não tem integração nativa confirmada. O caminho comum é webhook de venda aprovada da Hotmart → n8n/Zapier → CAPI da Meta, com deduplicação por `event_id`. Fica documentado como melhoria, não bloqueia o lançamento.

---

## 7. Páginas legais

- **Privacy Policy** (UK GDPR / GDPR): quem é o controlador (nome, endereço, e-mail), dados coletados pelo pixel e pelo checkout (o checkout é da Hotmart, com política própria), base legal, prazos de retenção, direitos do titular e contato.
- **Banner de cookies:** nada de pixel antes do consentimento. Botões "Accept" e "Reject" com o mesmo destaque. Link "Cookie settings" no rodapé para mudar a escolha.
- **Terms of Use:** licença de uso pessoal dos PDFs (proibido revender ou compartilhar), compra processada pela Hotmart (os termos de compra dela também valem), disclaimer de independência, "não garante aprovação".
- **Refund Policy:** **15 dias**, reembolso integral, pedido feito pela Hotmart. O texto tem que bater com o prazo configurado na Hotmart.
- Todos os textos usam os placeholders de marca, empresa, endereço e e-mail.

---

## 8. Entregas esperadas (em etapas)

Ao terminar cada etapa: rodar `validate` e o build, conferir no celular (360–390 px) e **me mostrar antes de seguir**.

1. **Estrutura do projeto + schemas + validador + template de mapa A4 + 3 mapas de exemplo** do nicho UK (Warning Signs, Stopping Distances, Roundabouts), já gerando PDF e PNG pelo script. **Parar aqui para validar o estilo.**
   - Pronto quando: o validador passa; nenhum mapa estoura 1 página; o PDF sai com as cores de fundo; a placa vem do pacote oficial do DfT; o diagrama da rotatória está em mão inglesa; os 3 mapas mostram `sources` e o rodapé de versão.
2. **Página de vendas do nicho UK + home da loja**, lendo tudo do config e do `manifest.json`.
   - Pronto quando: `next build` com export estático passa; não há número digitado à mão; depoimentos e prova social ficam ocultos com listas vazias; o pixel só carrega após consentimento; os links de checkout levam os UTMs.
3. **Modelos dos 6 bônus** (mesmo pipeline JSON → PDF).
4. **3–5 criativos de carrossel** para o anúncio, usando os PNGs reais das páginas (1080×1080 e 1080×1350), seguindo a seção 5.2.
5. **Páginas legais + banner de cookies.**
6. **Produção do restante do inventário** (4.3), em lotes por área, cada lote parando para conferência de fatos.

---

## 9. Pendências do Kauã (não são código)

- [ ] Confirmar com o suporte da Hotmart: (a) se ela recolhe o **VAT do Reino Unido** para criador no Brasil; (b) se o VAT é somado no checkout ou pode ser incluído no preço; (c) se o produto pode ter preço em GBP; (d) a taxa atual para venda de £15. Fazer isso antes de rodar anúncios no Reino Unido.
- [ ] Configurar a garantia de **15 dias** nos 2 produtos.
- [ ] Fazer uma compra-teste com endereço do Reino Unido e conferir o total.
- [ ] Liberar `www.gov.uk` e `assets.publishing.service.gov.uk` na rede do ambiente do Claude Code (para baixar as placas e conferir fatos), ou baixar o pacote de placas e colocá-lo no repositório.
- [ ] Preencher `site.json` com nome da empresa, endereço e e-mail de suporte.
- [ ] Verificar com contador/advogado se precisa de representante no Reino Unido para fins de UK GDPR (empresa de fora do Reino Unido que vende para residentes de lá).
- [ ] Fazer a conferência final dos mapas que o agente não conseguir verificar no gov.uk.

---

## 10. Próximos nichos — o que muda

- **França, Espanha, Alemanha:** dirige-se pela **direita**. Os diagramas de via **não podem ser espelhados** (o texto inverte), então são refeitos pelo mesmo conjunto de peças com a configuração de mão trocada. As placas seguem a Convenção de Viena, mas variam de país para país: cada nicho precisa do próprio `signs.json` e da licença das imagens daquele país. Unidades em km/h e metros. Formato da prova, nota de corte, fonte oficial e licença das questões oficiais precisam ser levantados para cada país antes de produzir.
- **Life in the UK Test:** a fonte é o livro oficial *Life in the United Kingdom: A Guide for New Residents*. Conferir a licença desse material e se há edição nova antes de investir.
