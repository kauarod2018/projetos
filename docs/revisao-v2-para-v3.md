# Revisão do briefing v2 → v3

Revisão feita em 12/10/2026, com foco no produto (mapas, conteúdo, pacotes e regras de venda). Legenda:

- 🔴 **Erro**: daria problema real se fosse montado como estava.
- 🟠 **Risco**: pode gerar erro de conteúdo, reembolso ou problema legal.
- 🟡 **Melhoria**: evita retrabalho na hora de montar.

> O gov.uk e o site da Hotmart estavam bloqueados pela rede deste ambiente. Tudo foi conferido por busca na web, em fontes secundárias e na central de ajuda da Hotmart indexada. Os itens marcados **[conferir]** no briefing v3 ainda precisam de uma olhada direta no gov.uk.

## 🔴 Erros corrigidos

| # | Na v2 | Problema | Na v3 |
|---|---|---|---|
| 1 | Garantia de **14 dias** | A Hotmart só oferece **7, 15, 21 ou 30 dias**, e para vendas na Europa o mínimo é **15**. Não dá para configurar 14, e a página de reembolso ficaria diferente do checkout. | **15 dias** na página, na Refund Policy e na Hotmart. |
| 2 | Exemplo de JSON com `"area": 3` em Stopping Distances | Stopping Distances fica na área 4 (Safety Margins). A área 3 é Motorways. O exemplo ensinaria o agente a errar. | `area` virou slug (`"safety-margins"`) validado contra o `niche.json`. |
| 3 | "Hotmart cobra taxa extra em vendas abaixo de 15" | Não confirmado. As fontes falam de taxa de microtransação **menor** em vendas baixas no internacional, e os 20% valem para vendas de até R$ 10 no Brasil. A taxa fixa internacional subiu para 1,00 EUR/USD em 21/09/2026. | O piso de £15 continua, mas justificado pela margem, com estimativa de líquido e a pendência de confirmar com a Hotmart. |
| 4 | Preço £15 / £24–27 sem falar de imposto | Para produto digital, a Hotmart cadastra o preço **sem** imposto e **soma o VAT no checkout**. No Reino Unido o consumidor tem que ver o preço final desde o início, e cobrança somada no fim ("drip pricing") é proibida pela DMCC Act desde 06/04/2025. | Preço base calculado para que base + VAT = preço da página (£12,50 → £15,00), mais uma compra-teste com endereço do Reino Unido antes dos anúncios. |
| 5 | Barra de topo "Today's offer" **com data dinâmica** | É urgência falsa (a oferta é a mesma todo dia), justamente o que a v2 proíbe no contador regressivo. Além disso, a data congela no build do export estático. | Barra fixa, sem data: "Complete pack: N maps + 6 bonuses · One-time payment". |
| 6 | Selo **"MOST POPULAR"** no Complete | No lançamento não existe venda nenhuma, então a afirmação é falsa. | "RECOMMENDED" até haver dados. |
| 7 | "Valor total dos bônus" como alternativa à âncora falsa | Dar um "valor" a bônus que nunca foram vendidos tem o mesmo problema do preço âncora fictício. | Mostrar o que tem dentro (páginas, cobertura), sem valor em libras. |
| 8 | "Menos da metade **dos candidatos** passa" e "mais de 2,7 milhões" | A estatística da DVSA conta **provas** (com repetições), não pessoas. O dado mais recente encontrado: 44,8% de aprovação e ~2,9 milhões de provas em 2025/26. | "Fewer than half of car theory tests are passed (44.8% in 2025/26)" [conferir na tabela DRT111A]. |
| 9 | Basic = "poucas áreas" | Um pacote que não cobre a prova inteira para quem vai fazer a prova gera reembolso e pode ser lido como enganoso ao lado de "pass your test". | Basic = mapas essenciais de **todas** as 6 áreas, sem bônus. A diferença para o Complete fica na quantidade e nos bônus. |

## 🟠 Riscos de conteúdo tratados

| # | Tema | O que muda |
|---|---|---|
| 10 | **Placas desenhadas "como SVG próprio"** | Redesenhar mais de 100 placas é a maior fonte de erro do produto (forma, cor ou símbolo errado). O DfT libera as imagens oficiais (mais de 600, em EPS vetorial) para reprodução **gratuita e sem pedir permissão**, desde que fiéis e com "Crown copyright". A v3 usa essas imagens, com manifesto `signs.json` e atribuição. |
| 11 | **Mão inglesa** | A v2 não dizia que o Reino Unido dirige pela esquerda. Um agente pode gerar rotatória girando no sentido errado. Isso virou regra inviolável, com checklist de revisão de diagrama e peças de diagrama reutilizáveis. |
| 12 | **Cobertura da prova** | A DVSA organiza a prova em **14 tópicos**. As 6 áreas da v2 não garantiam que todos estivessem cobertos. A v3 mapeia os 14 tópicos nas 6 áreas, cada mapa declara `dvsaTopics`, e o validador falha se algum tópico ficar sem mapa. |
| 13 | **Inventário de mapas** | A v2 falava em "100+ mapas" sem lista. A v3 traz um inventário de partida com 60 mapas (26 no Basic), com áreas, temas e faixas de regras do Highway Code. |
| 14 | **MUST vs should** | No Highway Code, "MUST / MUST NOT" é lei e "should" é recomendação, e a prova cobra essa diferença. A v3 pede um selo "LAW" nos fatos legais. |
| 15 | **Limite de álcool em mudança** | A Road Safety Strategy (jan/2026) propõe baixar o limite da Inglaterra e do País de Gales de 35 para 22 µg. Em 10/2026 ainda era consulta. Os mapas mostram a lei em vigor, com nota para a Escócia e um processo de atualização. |
| 16 | **Escopo geográfico** | A prova é da Grã-Bretanha. A Irlanda do Norte tem órgão (DVA) e regras próprias, e a Escócia tem limite de álcool diferente. A v3 cria `jurisdictionNotes` e uma pergunta na FAQ. |
| 17 | **Fontes oficiais** | Faltava o *Know Your Traffic Signs* (licença OGL). O livro *Driving – the essential skills* é pago e não é licença aberta: pode ser citado, nunca copiado. |
| 18 | **Mudanças de formato da prova** | Desde 28/09/2020, 3 das 50 questões são sobre um vídeo. Isso entrou nos fatos da prova. |
| 19 | **Conferência de fatos sem acesso ao gov.uk** | Se o agente não alcança o gov.uk, ele "confere" de memória. A v3 cria `review.status` (draft/verified): mapa não verificado sai com marca d'água DRAFT e não entra no pacote. |
| 20 | **Leitura no celular** | Um A4 inteiro numa tela de 390 px fica ilegível sem zoom. A v3 define fonte mínima, resposta honesta na FAQ e "phone edition" como melhoria opcional. Os flashcards ganham versão de celular. |
| 21 | **Identificação do vendedor** | A lei do Reino Unido exige nome e endereço físico de quem vende. Placeholders `LEGAL_ENTITY_NAME` e `LEGAL_ADDRESS` adicionados. |
| 22 | **Klarna e Google Pay** | A Hotmart não oferece Klarna em order bump, funil ou combo, e o Google Pay fica fora do order bump. A v3 manda usar 2 produtos com checkout direto. |

## 🟡 Melhorias para não errar na montagem

| # | Tema | O que entrou na v3 |
|---|---|---|
| 23 | Schema do mapa | `answerIndex` começando em 0, 4 opções, `sources` como lista estruturada, `visual.type` como enum com schema de `data`, `tier`, `order`, `review`, limites de texto. |
| 24 | Validador | Checa schema, limites, cobertura dos 14 tópicos, placas existentes e IDs únicos, e falha o build com mensagem clara. |
| 25 | Estouro de página | O build falha se um mapa passar de 1 página A4, em vez de gerar PDF cortado. |
| 26 | PDF sem cor | `printBackground: true` e espera pelas fontes. O esquecimento mais comum do `page.pdf()`. |
| 27 | Next.js estático | `images.unoptimized`, `trailingSlash`, `generateStaticParams` e fontes locais (Google Fonts pode estar bloqueado no build). |
| 28 | Números na página | `TOTAL_MAPS`, contagens e páginas saem de um `manifest.json` gerado pelo build. Nada digitado à mão. |
| 29 | Versão e "up to date" | Rodapé com versão e data de conferência em toda página. A pergunta "Is it up to date?" da FAQ responde com esses dados. |
| 30 | i18n | Rótulos dos blocos num dicionário por idioma, não no template. Necessário para FR/ES/DE. |
| 31 | Bônus | Escopo, formato e fonte de dados de cada bônus. O plano de 30 dias é gerado do inventário, e os flashcards têm verso espelhado para impressão frente e verso. |
| 32 | Rastreio | Repasse de `utm_*`, `fbclid`, `src` e `sck` para o checkout, mais o caminho de CAPI via webhook. |
| 33 | Critério de pronto | Cada etapa ganhou uma lista objetiva do que precisa estar funcionando antes de mostrar. |
| 34 | Próximos países | Mão de direção diferente, diagramas não espelháveis, placas e licenças por país. |

## Decisões que tomei por você (fácil de reverter)

- **Composição do Basic:** mapas essenciais de todas as áreas, em vez de "poucas áreas". Se preferir o Basic com menos áreas, deixe claro na página quais tópicos da prova ele **não** cobre.
- **Selo "RECOMMENDED"** no lugar de "MOST POPULAR".
- **2 produtos separados na Hotmart**, sem order bump.

## Fontes consultadas

**Prova e conteúdo**
- [nidirect — Taking the theory test (formato e notas de corte)](https://www.nidirect.gov.uk/articles/taking-theory-test)
- [DVSA — Introducing planned changes to the car theory test (vídeo no lugar do estudo de caso)](https://content.govdelivery.com/accounts/UKDVSA/bulletins/2a0dbd1)
- [Driving Theory Test — pass rate 2025/26](https://drivingtheorytest.io/pass-rate/) · [PassRates.uk — theory test pass rates](https://passrates.uk/guide/theory-test-pass-rates) · [Driving Mastery — pass rates 2026](https://drivingmastery.co.uk/theory-test-pass-rates/)
- [PassRates.uk — theory test cost 2026](https://passrates.uk/guide/theory-test-cost-and-booking) · [CBW — consultation on licence fee changes](https://cbwmagazine.com/consultation-on-licence-fee-changes/)
- [GOV.UK — Traffic sign images](https://www.gov.uk/traffic-sign-images) · [Know Your Traffic Signs (PDF, OGL v3.0)](https://assets.publishing.service.gov.uk/media/655dca78046ed4000d8b9de7/know-your-traffic-signs-dft.pdf)
- [GOV.UK — Highway Code, motorways 253 to 273](https://www.gov.uk/highway-code/motorways-253-to-273) · [Roundabouts (rules 184 to 190)](https://theorytest.org.uk/subsections/roundabouts-rules-184-to-190)
- [AA — Stopping distances](https://www.theaa.com/sitecore-cd/breakdown-cover/advice/stopping-distances) · [Driving Theory 4 All — Stopping distances](https://www.drivingtheory4all.co.uk/learning-to-drive/stopping-distances)
- [What Car? — towing speed limits](https://whatcar.com/advice/owning/what-speed-limits-apply-when-towing-a-caravan-or-trailer/n1224)
- [House of Commons Library — Road safety in the UK (2026)](https://commonslibrary.parliament.uk/research-briefings/cdp-2026-0022/) · [RAC — new Road Safety Strategy](https://www.rac.co.uk/drive/news/motoring-news/new-road-safety-strategy-announced/) · [ITV — proposed driving reforms](https://www.itv.com/news/2026-01-07/lower-drink-drive-limits-and-eye-tests-for-over-70s-proposed-driving-reforms)

**Hotmart**
- [Prazo de garantia (7, 15, 21 ou 30 dias; mínimo de 15 na Europa)](https://help.hotmart.com/pt-br/article/360034552751)
- [Taxas cobradas pela Hotmart](https://help.hotmart.com/en/article/208298448/what-are-the-fees-charged-by-hotmart-) · [Engaged — taxa da Hotmart em 2026](https://engaged.com.br/blog/taxa-hotmart-quanto-custa-vender/)
- [Klarna na Hotmart](https://help.hotmart.com/en/article/38465293543309/how-to-sell-with-klarna-on-hotmart-) · [Meios de pagamento](https://help.hotmart.com/en/article/25648853025037/what-payment-methods-are-available-for-purchasing-on-hotmart-)
- [Global sales: tax responsibilities](https://help.hotmart.com/en/article/27142347940749/global-sales-tax-responsibilities-for-sales-made-on-hotmart) · [Regras fiscais e precificação](https://help.hotmart.com/pt-br/article/28274925159437/como-as-regras-fiscais-de-diferentes-regi-es-podem-afetar-a-precificacao-do-meu-produto-)
- [Como rastrear vendas da Hotmart no Meta Ads (pixel + webhook/CAPI)](https://viniensina.com.br/?p=3071)

**Lei de consumo do Reino Unido**
- [CMS — DMCC Act: consumer elements in force from 6 April 2025](https://cms.law/en/gbr/legal-updates/the-dmcc-act-consumer-elements-come-into-force-from-6-april-2025) · [CMA207 — Unfair commercial practices guidance](https://assets.publishing.service.gov.uk/media/686666f2e4184a43f9785c0e/CMA207_Unfair_commercial_practices_guidance.pdf)
- [Consumer Contracts Regulations 2013, reg. 37 (conteúdo digital)](https://www.legislation.gov.uk/uksi/2013/3134/regulation/37)
