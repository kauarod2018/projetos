# Cena do casal (comercial)

O comercial (`anuncio/comercial/video.mjs`) abre e fecha com o casal de idosos jogando do **lado direito da tela**, enquanto o produto com os bônus aparece do **lado esquerdo**, sobre um véu claro. Coloque a cena aqui:

- `casal.mp4` (ou `.mov`/`.webm`): o ideal. Precisa de pelo menos 10 segundos e pode ser vertical 9:16 ou deitado 16:9.
- `casal.jpg` ou `casal.png`: se só tiver foto. O vídeo aplica um zoom lento.

Ajustes opcionais em `casal.json`:

```json
{ "x": 0.7, "inicio": 2.5, "congelar": 8 }
```

- `x`: em vídeo ou foto deitada, onde recortar a faixa vertical. 0 é a esquerda, 1 é a direita. Use um valor que deixe o casal à direita.
- `inicio`: segundo do vídeo onde a cena começa.
- `congelar`: segundo do quadro usado no fechamento.

Depois rode `node anuncio/comercial/video.mjs` na pasta `kit-mente-ativa`. O resultado é `anuncio/comercial/comercial-mente-ativa.mp4`.

## Como a cena precisa ser

O casal fica na metade direita, e a metade esquerda é uma área calma (parede ou cortina desfocada), porque o produto entra por cima dela.

## Prompt para gerar (Google Flow/Veo, Gemini, Imagen ou outra IA)

```
Vertical 9:16, photorealistic, shot on a 35mm lens, shallow depth of field, warm natural afternoon light.
A real elderly Brazilian couple in their mid-70s sits at a wooden dining table in a cozy, tidy living room,
assembling a printed paper jigsaw puzzle of colorful colonial houses with a white church. The couple is placed
in the RIGHT half of the frame; the LEFT 45% of the frame is a calm, softly blurred cream wall with sheer curtains
and nothing important in it. The woman has short silver hair and a light floral blouse; the man wears glasses and
a beige cardigan. She fits a piece, they look at each other and laugh genuinely. Two coffee cups on the table.
Natural skin texture, realistic hands with five fingers, no text, no logos, no watermark.
Camera: very slow push-in. Duration 8 to 10 seconds. No music, no voice.
```

Para a foto (Imagen, Gemini e similares), tire as linhas "Camera" e "Duration".
