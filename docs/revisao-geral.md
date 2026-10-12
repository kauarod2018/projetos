# Revisão geral: placas, fatos e etapas 2 a 5

Feita em 12/10/2026. O gov.uk continuou bloqueado neste ambiente, então os fatos foram cruzados pela busca na web (gov.uk
indexado, legislation.gov.uk, Traffic Signs Manual, Highway Code e sites de terceiros). Tudo continua marcado como
**rascunho** até alguém abrir a fonte oficial e conferir.

## 1. Placas: o que deu para pesquisar

As imagens oficiais do DfT **não puderam ser baixadas**: o gov.uk está bloqueado aqui e não existe nenhum pacote delas no
npm. O que ficou pronto para quando as imagens chegarem:

- **21 placas** cadastradas em `content/assets/signs/gb/signs.json`, com o número oficial do regulamento (TSRGD)
  confirmado em pelo menos uma fonte técnica.
  - Aviso: 504.1, 505.1, 506.1, 507.1, 510, 512, 513, 516, 520, 521.
  - Ordem: 601.1, 602, 606, 611.1, 616, 617, 619, 632, 652, 670, 671.
- As legendas seguem o **Highway Code**, que é o que o candidato estuda. Exemplos: "Roundabout" e "Two-way traffic
  straight ahead". O título no regulamento às vezes é diferente (por exemplo, "Two-way traffic ahead").
- A página oficial do DfT organiza as imagens em arquivos .zip, e o nome de cada arquivo traz o número TSRGD. Como o
  manifesto já tem esses números, a importação é só ligar o arquivo à placa.
- Ficaram **de fora**, por não terem o número confirmado: velocidade mínima, clearway e "no waiting".
- Regra confirmada e usada no mapa: nas placas de cruzamento, a **linha mais grossa** indica a via com prioridade
  (Traffic Signs Manual, cap. 4).

## 2. Erros e imprecisões encontrados e corrigidos

| Onde | Antes | Depois | Fonte |
|---|---|---|---|
| Mapa 4.01 | "Distância de 2 segundos **em estrada seca**" | "Em **estradas mais rápidas e túneis**, pelo menos 2 segundos" | Highway Code, Rule 126 |
| Mapa 4.01 | "No gelo, a **frenagem** pode ser até 10× maior" | "No gelo, a **distância de parada** pode ser até 10× maior" | Highway Code, Rule 230 |
| Mapa 2.05 | Seguir em frente: "**sem** sinalizar na aproximação" | "**normalmente** sem sinalizar" | Highway Code, Rule 186 |
| Limites de velocidade | Item vazio | Tabela da Rule 124 completa, com caminhões na Escócia (30/40/50/60) | Rule 124, RAC |
| País de Gales | Não mencionado | Nota: 20 mph é o padrão nas vias urbanas desde 17/09/2023 | Governo do País de Gales |
| Site (desktop) | O mockup do topo não aparecia (caixa com largura zero) | Corrigido e conferido em 1280 px | teste no navegador |
| Site | "44,8%", "Bonus 01", "pages" e "days" digitados no código | Movidos para os arquivos de conteúdo | regra do briefing |

## 3. Fatos usados nos bônus e na página (situação)

| Fato | Situação |
|---|---|
| 50 questões, 57 min, 43 para passar; 3 questões sobre um vídeo | confirmado (DVSA/nidirect) |
| Hazard perception: 14 vídeos, 15 perigos, até 5 pontos cada, 44/75 | confirmado |
| Clique errado não tira ponto; clicar em ritmo ou sem parar zera o vídeo | confirmado (gov.uk indexado) |
| Carteira com foto, ou de papel + passaporte; sem isso, prova cancelada sem reembolso | confirmado (gov.uk "what to take") |
| Reprovou: esperar pelo menos 3 dias úteis | fontes secundárias + regulamento de 1999; **conferir no gov.uk** |
| Taxa de £23 | fontes de 2026; **conferir no gov.uk** |
| Armário para pertences; marcar questões para revisar; pausa de 3 min | site da DVSA (Safe Driving for Life) e página de moto do gov.uk; **conferir a de carro** |
| 44,8% de aprovação em 2025/26 | fontes secundárias citando a tabela DVSA DRT111A; **conferir** |
| Limite de álcool (35 µg na Inglaterra e no País de Gales) | lei atual; a redução para 22 µg ainda é **proposta**: rever a cada versão |

## 4. O que foi construído nesta rodada

- **Marca por idioma:** "Ajuda com Provas"; "Test Help" em inglês, mais versões em francês, espanhol e alemão já cadastradas.
- **Inventário dos 60 mapas** como dado. O validador garante que cada mapa bate com o plano e que o plano cobre os 14
  tópicos da DVSA.
- **6 bônus** em PDF:
  - Hazard Perception Visual Guide (3 p.)
  - Critical Signs Cheat Sheet (2 p.)
  - Numbers Table (2 p.)
  - 30-Day Revision Plan (2 p., gerado a partir dos mapas)
  - Test-Day Checklist (2 p.)
  - Flashcards: A4 frente e verso com o verso espelhado, mais versão para celular
- **Site** com home, página de vendas, Privacy, Terms, Refund e 404:
  - números e textos lidos dos arquivos;
  - modo preview com faixa vermelha e `noindex`;
  - modo release bloqueado até haver conteúdo verificado.
- **Cookies e pixel**, testados no navegador:
  - nada carrega antes do "Accept";
  - "Reject" funciona e "Cookie settings" reabre o banner;
  - PageView e ViewContent disparam depois do aceite;
  - o clique em comprar repassa UTMs e `fbclid` ao checkout.
- **Criativos de carrossel:** 5 slides em 1080×1080 e 1080×1350, feitos das páginas reais. Em preview levam a tarja
  "PREVIEW · DO NOT USE".
- **Checagens automáticas:** 22 testes do validador, mais o `site:check` (5 páginas × 360/390/1280 px: sem rolagem
  lateral, imagens carregando, sem erros).

## 5. Pendências (não são código)

1. **Liberar o gov.uk** na rede do ambiente (`www.gov.uk` e `assets.publishing.service.gov.uk`), ou baixar os .zip de placas
   (aviso e ordem) e colocá-los no repositório. Sem isso não há placas oficiais nem conferência de fatos.
2. **Conferência dos fatos** marcados como "conferir", no gov.uk, antes de trocar qualquer mapa ou bônus para `verified`.
3. **Hotmart:** confirmar o VAT do Reino Unido, a precificação em GBP e a taxa para venda de £15; configurar a garantia
   de 15 dias; criar os 2 produtos e colar os links em `niche.json` → `checkout`.
4. **Dados da empresa** em `content/site.json`: domínio, e-mail, nome legal, endereço, CNPJ. Também o Pixel ID, quando
   houver.
5. **Revisão jurídica** dos textos de `content/legal/en-GB.json`. São um modelo de boa-fé, não um parecer. Inclui a
   pergunta sobre representante no Reino Unido para fins de UK GDPR.
6. **Domínio e marca:** "Test Help" é um nome genérico. Vale checar se o domínio está livre e se não há marca registrada
   igual no Reino Unido.
7. ~~Etapa 6: produzir os outros 57 mapas.~~ Feito, veja a seção 6 abaixo.

## 6. Etapa 6: os 60 mapas

Os 60 mapas do inventário estão escritos (26 no Basic, 60 no Complete). Todos continuam em **rascunho**.

**Como ficou o produto**
- Mapas mais enxutos: 4 a 6 fatos-chave, 1 questão e 2 a 3 armadilhas, com um visual grande em cada página.
- 5 tipos novos de visual: cartões, passos, números grandes, faixas pintadas e semáforo (detalhes no `DESIGN.md`).
- Os pacotes abrem com capa (60 mapas, 63 questões, 179 armadilhas no Complete) e sumário por área.
- 8 PDFs de pacote: Complete (62 p.), Basic (28 p.) e um por área.
- Prévias em `docs/preview/etapa-6/`: o PDF completo e uma folha de contato por área.

**Revisão de fatos.** Dois revisores independentes leram os 57 mapas novos (e o 1.02), cruzando por busca na web: 36
de 58 sem problema. Correções feitas:

| Onde | Antes | Depois | Base |
|---|---|---|---|
| 6.05 Documents | "taxado para rodar, **a não ser que tenha SORN**" | Com SORN o carro **tem de ficar fora** da via pública | lei do imposto veicular, gov.uk SORN |
| 2.08 Overtaking | "Ultrapassar nas zigue-zagues é ilegal" | Só é proibido ultrapassar o veículo mais próximo da faixa (ou o que parou) | Rules 165 e 191 |
| 2.11 Lane discipline | Faixa do meio "quando estiver livre" | Só para ultrapassar ou virar à direita | Rule 135 |
| 1.03 Quiz | Alternativa errada "playground" também podia ser certa | Trocada por "idosos ou pessoas com deficiência" | placa 545 + placa 547.2 |
| 6.02, 4.04, 5.02 | Textos que exageravam a regra | Ajustados ao texto da Rule 123, 229 e 91 | Highway Code |
| 12 mapas | Regras com MUST sem o selo LAW | Selo LAW incluído (Rules 106, 130, 149, 172, 196, 253, 293, Rule 98, Annex 3) | Highway Code |
| Mapas de autoestrada | "Rules 253 to 273" | "Rules 253 to 274"; panes: Rules 275 a 278 (a Rule 276 é a do triângulo) | títulos das seções no gov.uk |

**Confirmado na revisão:** limite de álcool na Inglaterra e no País de Gales continua 35 µg (a redução para 22 µg segue
como proposta; consulta encerrada em 2026, sem lei); primeiro MOT aos 3 anos; reboque até 3.500 kg desde 16/12/2021;
marcos de contagem a 300, 200 e 100 jardas; faixa de ônibus sem horário = 24 horas; queimadura 20 minutos e compressão
5–6 cm, cerca de 2 por segundo.

**Ainda conferir no gov.uk** (anotado em `review.notes` de cada mapa):
- 6.09: se o "C" do DR ABC no Annex 7 atual é "Circulation" ou "Compressions".
- 6.10: as regras de túnel e o conselho de não abrir o capô num incêndio no motor.
- 4.08: o texto sobre ESC (não está no Highway Code; vem de material de direção).
- Números de regra citados nas fontes, já que a numeração mudou entre edições.
