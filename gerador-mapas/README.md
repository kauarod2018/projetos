# Gerador de vídeos com mapa

Gera vídeos explicativos no formato "Quantos países... (Veja o Mapa)": mapa-múndi animado,
câmera voando até cada país, contador, coleção de bandeiras, cartões com dados,
narração em português, música e efeitos sonoros. Tudo é feito por código, a partir de um roteiro em JSON.

```bash
./gerar.sh roteiros/lusofonia.json
```

O vídeo sai em `saida/<slug>.mp4` (1920x1080, 30 fps).

## Como fazer um vídeo novo

Copie `roteiros/lusofonia.json` e edite. Tipos de cena:

| tipo       | o que faz |
|------------|-----------|
| `intro`    | título grande sobre o mapa e o selo "VEJA O MAPA" |
| `pais`     | voa até o país (`id` = código ISO numérico), acende no mapa, soma no contador e mostra o cartão com bandeira (`bandeira` = código de 2 letras) |
| `total`    | volta ao mapa-múndi e mostra os cartões de `estatisticas` |
| `marcador` | destaca uma região em laranja (ex.: Macau), sem somar no contador |
| `barra`    | painel com barra de proporção (`valor` de 0 a 1) |
| `outro`    | pergunta final e botão "INSCREVA-SE" |

- `camera: [longitude, latitude, zoom]` é opcional; sem ela o enquadramento é automático.
- `fala` é o texto narrado. Escreva os números por extenso para a voz ler direito.
- O tempo de cada cena se ajusta sozinho à duração da fala.

## Peças

- `scripts/narracao.py`: voz com Piper TTS (offline) e linha do tempo
- `scripts/trilha.py`: música e efeitos sintetizados (sem direitos autorais) e mixagem com ducking
- `engine/cena.js`: desenha cada quadro no canvas (d3-geo + Natural Earth via world-atlas)
- `engine/render.js`: captura os quadros no Chromium (Playwright) e codifica com ffmpeg

Para conferir quadros sem renderizar tudo: `node engine/render.js roteiros/lusofonia.json --previa 5,20,40`.
