# Darks — sistema para canais dark do YouTube

Sistema próprio para encontrar oportunidades no YouTube, **aprender com o que está
performando** e **criar vídeos automaticamente**, com um gerador separado para cada
tipo de vídeo. Usa só ferramentas gratuitas + Google (Gemini / YouTube API).

```
 BUSCA (painel)  ──►  AVALIAÇÃO / MODELO  ──►  IDEIAS  ──►  CRIAÇÃO (comando)  ──►  APRENDER
 YouTube API/yt-dlp   Gemini estuda os       temas com     roteiro → voz → mídia    suas notas e
 outliers, em alta,   vídeos em alta e       potencial     → montagem → legenda     números voltam
 canais               refina o modelo                                               para o modelo
```

## Instalação

Precisa de **Python 3.10+** e **FFmpeg** instalados.

```bash
pip install -r requirements.txt
```

```bash
cp .env.exemplo .env
```

Depois preencha o `.env` (todas as chaves são gratuitas):

| Chave | Para quê | Onde pegar |
|---|---|---|
| `GEMINI_API_KEY` | avaliação, roteiros, ideias, thumbnail | https://aistudio.google.com/apikey |
| `YOUTUBE_API_KEY` | busca completa (inscritos, likes, em alta) | Google Cloud → ative "YouTube Data API v3" |
| `PEXELS_API_KEY` | vídeos e fotos de banco | https://www.pexels.com/api/ |
| `PIXABAY_API_KEY` | vídeos e fotos de banco | https://pixabay.com/api/docs/ |

Sem `YOUTUBE_API_KEY` a busca usa o **yt-dlp** (funciona, com menos dados).
A narração usa o **Edge-TTS** (grátis, sem chave).

## 1. Busca — painel web

```bash
python -m darks painel
```

Abra http://localhost:8000. Abas:

- **Busca**: pesquisa por nicho com filtros de período/duração. Cada vídeo mostra
  views, views/dia, engajamento e **outlier** (quantas vezes o vídeo superou o
  número de inscritos do canal; 🔴 ≥5x, 🟠 ≥2x). Ordene por "oportunidade" e exporte CSV.
- **Em alta**: vídeos em alta por país e categoria.
- **Canal**: análise de um canal (médias e quais vídeos estouraram).
- **Modelos**: o que o sistema já aprendeu de cada nicho, versão a versão.

Também dá pelo terminal: `python -m darks buscar "mistérios" --dias 30`

## 2. Avaliação — sempre antes de criar

```bash
python -m darks avaliar --tipo narrado --nicho "mistérios não resolvidos"
```

Opções úteis: `--termos "mistérios,casos sem solução"` e `--canais "@canal1,@canal2"`.

O sistema busca os vídeos que mais performam, lê as transcrições dos melhores e o
Gemini monta um **modelo de criação**: padrões de título, gancho, estrutura,
técnicas de retenção, tom da narração, visual, thumbnail, duração ideal, temas que
funcionam, oportunidades e um **checklist de qualidade**.

Rodar `avaliar` de novo **refina** o modelo (não começa do zero). Cada versão fica
salva em `modelos/<tipo>/historico/`. O comando `criar` se recusa a rodar sem modelo
e avisa quando ele tem mais de 30 dias.

## 3. Ideias e criação — por comando

```bash
python -m darks ideias --tipo narrado --nicho "mistérios não resolvidos"
```

```bash
python -m darks criar --tipo narrado --nicho "mistérios não resolvidos" --tema "O navio Mary Celeste"
```

Fluxo: roteiro no Gemini seguindo o modelo → **revisão automática contra o checklist**
→ narração Edge-TTS → vídeos/fotos Pexels/Pixabay (troca de cena a cada poucos
segundos, sem repetir) → montagem FFmpeg → legenda queimada → música de fundo com
ducking (se houver arquivos em `musicas/`).

Resultado em `saida/<data>_<titulo>/`: `video.mp4`, `publicar.txt` (título, títulos
para teste A/B, descrição, tags, prompt da thumbnail), `thumbnail.png` (se o Gemini
gerar), `roteiro.json` e `legendas.ass`.

Quer revisar o roteiro antes de produzir? Gere só o roteiro com `--so-roteiro`, edite
o `roteiro.json` e produza a partir dele:

```bash
python -m darks criar --tipo narrado --nicho "mistérios não resolvidos" --tema "..." --so-roteiro
```

```bash
python -m darks criar --tipo narrado --nicho "mistérios não resolvidos" --roteiro "saida/.../roteiro.json"
```

Outras opções: `--duracao 600`, `--voz pt-BR-FranciscaNeural`.

### Tipos de vídeo (`python -m darks tipos`)

| Tipo | Formato | Estilo |
|---|---|---|
| `narrado` | 1920x1080 | longo, narração + vídeos de banco + legenda embaixo |
| `shorts` | 1080x1920 | até 60s, cortes rápidos, legenda grande estilo karaokê, final em loop |

Cada tipo é um arquivo em `darks/criacao/tipos/`. Para criar um novo, copie
`narrado.py`, ajuste e registre em `darks/criacao/tipos/__init__.py`.

## 4. Aprender — o ciclo de melhoria

```bash
python -m darks aprender --tipo narrado --nicho "mistérios não resolvidos" --nota "retenção caiu aos 40s, gancho longo"
```

Com `--video ID_DO_SEU_VIDEO` o sistema também puxa os números do vídeo e compara
com a mediana das referências. As lições têm prioridade nos próximos roteiros e na
próxima avaliação.

## Estrutura

```
darks/
  busca/        youtube.py (API + yt-dlp), metricas.py (outlier, views/dia, pontuação)
  avaliacao/    modelador.py (avaliar, aprender, ideias)
  criacao/      base.py (fluxo comum), voz.py, midia.py, ffmpeg.py, legendas.py
    tipos/      um gerador por tipo de vídeo
  ia/           gemini.py
  painel/       app.py + templates/index.html
modelos/        modelos aprendidos (versionados)
musicas/        coloque músicas sem direitos autorais (ou em musicas/<tipo>/)
saida/          vídeos gerados
```

## Direitos autorais e monetização

- Pexels/Pixabay: uso comercial liberado. Os IDs usados ficam em `publicar.txt`.
- Música: use a Biblioteca de Áudio do YouTube ou Pixabay Music.
- O modelo **inspira estrutura e estilo**; não copie roteiros ou títulos das referências.
- O YouTube exige marcar conteúdo realista gerado por IA como "conteúdo alterado".
