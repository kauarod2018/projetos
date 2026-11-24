# Psicologia com palitos (Manim)

Canal de psicologia no formato **dor → erro de interpretação → mecanismo → causa → o que muda**, sem tom motivacional.

## Identidade

- Papel de caderno creme com margem vermelha (`scripts/papel.py`)
- Traço grafite levemente tremido, como desenho à mão
- **Cuca**: personagem de palito com a cabeça colorida pela emoção (`palitos/estilo.py`)
  - roxo: desconforto/culpa · verde: alívio/calma · azul: cansaço · vermelho: irritação · mostarda: energia · cinza: neutro
- Marca-texto amarelo nas palavras-chave, Caveat (letra de mão) e Nunito (rótulos)
- Lo-fi sintetizado e efeitos de lápis, risco, marca-texto e pop (`scripts/trilha.py`)

## Como fazer um vídeo

1. Escreva as falas em `roteiros/<nome>.json` (`formato`: `horizontal` ou `vertical`).
2. Monte a cena em `cenas/<nome>.py`, herdando de `CenaNarrada`. Use `self.ate(self.fala(i, "trecho"))` para sincronizar cada animação com o momento em que o trecho é dito, e `self.som("lapis")` para marcar efeitos sonoros.
3. Rode `./gerar.sh <nome>`.

Roteiros completos ficam em `roteiros/*.md`.
