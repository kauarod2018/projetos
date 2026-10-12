# Placas oficiais (GB)

Os arquivos desta pasta precisam ser as **imagens oficiais do Department for Transport**, reproduzidas sem alteração
(página "Traffic sign images" no gov.uk, em EPS vetorial). Nunca redesenhe uma placa.

Para cada placa:

1. Baixe o EPS oficial e converta para SVG:
   `ps2pdf -dEPSCrop placa.eps placa.pdf && pdftocairo -svg placa.pdf svg/<id>.svg`
   (ou abra no Inkscape e salve como SVG simples).
2. Em `signs.json`, preencha `officialNumber` (número do diagrama TSRGD), `file` (`svg/<id>.svg`)
   e troque `status` para `official`.
3. Confira se o significado (`meaning`) bate com o Know Your Traffic Signs.

Enquanto a placa estiver `pending-official-asset`, o mapa mostra só o contorno da forma, com o aviso
"Official image pending", e o validador em modo release bloqueia o pacote.

## Importação feita em 12/10/2026

- Fonte: pacotes EPS da página [Traffic sign images](https://www.gov.uk/guidance/traffic-sign-images) (warning,
  regulatory, speed limit, level crossing, bus and cycle) e a planilha "Traffic signs image details", que liga cada
  arquivo ao número do diagrama TSRGD.
- Conversão: `ps2pdf -dEPSCrop` (Ghostscript) e `pdftocairo -svg`, sem nenhuma alteração no desenho.
- Velocidade máxima usa o arquivo `670V30` (30 mph). "Zebra crossing" é o diagrama 544.
- **Ahead only** (606 com seta para cima) não existe no pacote oficial, que só traz as versões para a esquerda e a
  direita. A imagem não foi girada: os mapas e o bônus usam "Turn left" (606, seta para a esquerda).
