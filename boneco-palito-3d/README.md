# Boneco Palito 3D animado

Abra `index.html` no navegador (precisa de internet para baixar o Three.js).

## Animações (teclas 1–7)
1. Parado (respiração e balanço) · 2. Andar · 3. Correr · 4. Pular · 5. Dançar · 6. Acenar · 7. Polichinelo

## Como funciona
- **Esqueleto hierárquico**: cada articulação é um `THREE.Group` (quadril → coluna → tórax → pescoço → cabeça; ombro → cotovelo → pulso; quadril → joelho → tornozelo → pé). Girar uma articulação move tudo o que vem depois dela.
- **Ossos**: cilindros finos entre articulações; esferas azuis marcam as juntas.
- **Poses procedurais**: cada animação é uma função do tempo que devolve ângulos (senos/cossenos para ciclos de passada, braços em oposição às pernas, etc.).
- **Transição suave**: a pose atual se aproxima da pose-alvo a cada quadro, então trocar de animação nunca "pula".
- **Pés no chão**: depois de aplicar a pose, o boneco é ajustado na altura para que o pé mais baixo encoste no chão (o pulo e a corrida somam uma elevação extra).
- **Esteira**: a grade do chão desliza na velocidade da caminhada/corrida.

Controles: arrastar gira a câmera, roda do mouse dá zoom, painel muda velocidade, cor e articulações.
