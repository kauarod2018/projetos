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
