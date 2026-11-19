"""Base de todos os geradores de vídeo.

Cada TIPO de vídeo é uma subclasse de `GeradorVideo` em criacao/tipos/, com seu
próprio formato, estilo de roteiro, visual e legenda. O fluxo é sempre:

  modelo avaliado -> roteiro (Gemini) -> narração (Edge-TTS) -> mídia (Pexels/Pixabay)
  -> montagem (FFmpeg) -> legendas -> metadados para publicar

Tudo é salvo em saida/<data>_<titulo>/ (roteiro.json pode ser editado e reaproveitado).
"""
from __future__ import annotations

import json
import random
import shutil
from datetime import datetime
from pathlib import Path

from ..config import PASTA_MUSICAS, PASTA_SAIDA, VOZ_PADRAO
from ..avaliacao import modelador
from ..ia import gemini
from . import ffmpeg, legendas, voz
from .midia import BancoDeMidia


class GeradorVideo:
    # ----- o que cada tipo pode mudar -----
    nome = "base"
    descricao = ""
    formato = "longo"                  # "longo" ou "short" (usado na avaliação)
    foco_avaliacao = ""                # o que o Gemini deve observar nas referências
    largura, altura = 1920, 1080
    orientacao = "landscape"
    duracao_padrao_s = 480
    segundos_por_tomada = 5.0          # troca de imagem a cada N segundos
    preferir_midia = "video"
    pausa_entre_cenas = 0.35
    velocidade_voz = "+0%"
    volume_musica = 0.10
    estilo_legenda = {"palavras_por_bloco": 6, "tamanho": 58, "alinhamento": 2, "margem_v": 80}
    regras_roteiro = ""                # instruções extras de roteiro específicas do tipo

    def __init__(self, nicho: str, voz_nome: str | None = None, log=print):
        self.nicho = nicho
        self.voz = voz_nome or VOZ_PADRAO
        self.log = log

    # ------------------------------------------------------------ modelo
    def carregar_modelo(self, exigir: bool = True) -> dict | None:
        m = modelador.carregar_modelo(self.nome, self.nicho)
        if not m and exigir:
            raise RuntimeError(
                f"Não há modelo avaliado para o tipo '{self.nome}' no nicho '{self.nicho}'.\n"
                f"Antes de criar, rode a avaliação:\n"
                f"  python -m darks avaliar --tipo {self.nome} --nicho \"{self.nicho}\"")
        if m and modelador.idade_dias(m) > 30:
            self.log(f"! O modelo tem {modelador.idade_dias(m):.0f} dias. Considere re-avaliar para pegar tendências novas.")
        return m

    # ------------------------------------------------------------ roteiro
    def prompt_roteiro(self, tema: str, modelo: dict | None, duracao_s: int) -> str:
        palavras = int(duracao_s * 2.4)  # ~145 palavras por minuto
        m = modelo or {}
        return f"""Você é roteirista de um canal dark do YouTube (sem rosto, só narração) do nicho "{self.nicho}".
Escreva o roteiro COMPLETO de um vídeo do tipo "{self.nome}" ({self.descricao}).

TEMA: {tema}
DURAÇÃO ALVO: ~{duracao_s} segundos (~{palavras} palavras de narração no total)

MODELO DE CRIAÇÃO (aprendido com os vídeos que mais performam no nicho — siga-o):
{json.dumps(m.get("modelo"), ensure_ascii=False) if m else "sem modelo"}

LIÇÕES DE VÍDEOS ANTERIORES (prioridade máxima):
{json.dumps(m.get("licoes", []), ensure_ascii=False) if m else "nenhuma"}

REGRAS:
- Português do Brasil, frases curtas e faladas (é para ser narrado), sem emojis, sem marcações de cena no texto.
- O gancho dos primeiros segundos é o mais importante: aplique as técnicas do modelo.
- Divida em cenas de 1 a 4 frases. Para cada cena, dê 2 ou 3 buscas visuais EM INGLÊS, concretas
  (o que aparece na tela, ex.: "dark forest fog night", "ancient roman soldiers"), boas para bancos de vídeo grátis.
- Fatos precisam ser verdadeiros; se for ficção/hipótese, deixe claro na narração.
- Termine com uma chamada natural para o próximo vídeo/inscrição, no estilo do modelo.
{self.regras_roteiro}

Responda SOMENTE com JSON:
{{"titulo": "...", "titulos_alternativos": ["...", "..."], "descricao": "descrição para o YouTube com 2-3 parágrafos e hashtags",
  "tags": ["..."], "thumbnail": {{"texto": "2-4 palavras", "imagem": "descrição detalhada da imagem da thumbnail, em inglês"}},
  "cenas": [{{"narracao": "...", "buscas_visuais": ["...", "..."]}}]}}"""

    def gerar_roteiro(self, tema: str, modelo: dict | None, duracao_s: int) -> dict:
        self.log("• Escrevendo roteiro com o Gemini...")
        roteiro = gemini.gerar_json(self.prompt_roteiro(tema, modelo, duracao_s), temperatura=0.85)
        if not isinstance(roteiro, dict) or not roteiro.get("cenas"):
            raise RuntimeError("O roteiro veio sem cenas. Tente de novo.")
        roteiro = self.revisar_roteiro(roteiro, modelo)
        roteiro.update({"tipo": self.nome, "nicho": self.nicho, "tema": tema,
                        "modelo_versao": (modelo or {}).get("versao")})
        return roteiro

    def revisar_roteiro(self, roteiro: dict, modelo: dict | None) -> dict:
        """Segunda passada: o Gemini confere o roteiro contra o checklist do modelo e melhora."""
        checklist = ((modelo or {}).get("modelo") or {}).get("checklist_qualidade")
        if not checklist:
            return roteiro
        self.log("• Revisando roteiro contra o checklist de qualidade do modelo...")
        prompt = f"""Revise este roteiro de vídeo do YouTube contra o checklist. Corrija o que não cumprir
(principalmente gancho, ritmo e retenção), mantendo o mesmo formato JSON e o mesmo tema.
Devolva SOMENTE o JSON revisado, com um campo extra "revisao": ["o que foi melhorado"].

CHECKLIST: {json.dumps(checklist, ensure_ascii=False)}
ROTEIRO: {json.dumps(roteiro, ensure_ascii=False)}"""
        try:
            novo = gemini.gerar_json(prompt, temperatura=0.5)
            return novo if isinstance(novo, dict) and novo.get("cenas") else roteiro
        except Exception as e:
            self.log(f"  (revisão pulada: {e})")
            return roteiro

    # ------------------------------------------------------------ produção
    def pasta_projeto(self, titulo: str) -> Path:
        p = PASTA_SAIDA / f"{datetime.now():%Y%m%d-%H%M}_{modelador.slug(titulo)[:50]}"
        p.mkdir(parents=True, exist_ok=True)
        return p

    def escolher_musica(self) -> Path | None:
        pasta = PASTA_MUSICAS / self.nome
        opcoes = [p for d in (pasta, PASTA_MUSICAS) if d.exists() for p in d.iterdir()
                  if p.suffix.lower() in (".mp3", ".wav", ".m4a", ".ogg")]
        return random.choice(opcoes) if opcoes else None

    def produzir(self, roteiro: dict, pasta: Path) -> Path:
        (pasta / "roteiro.json").write_text(json.dumps(roteiro, ensure_ascii=False, indent=2), encoding="utf-8")
        tmp = pasta / "tmp"
        tmp.mkdir(exist_ok=True)
        banco = BancoDeMidia(pasta / "midia", self.orientacao, self.preferir_midia)
        if not banco.disponivel():
            self.log("! Sem PEXELS_API_KEY/PIXABAY_API_KEY: o vídeo terá fundo liso. Configure no .env.")

        cenas = roteiro["cenas"]
        segmentos, audios, palavras_total, creditos = [], [], [], []
        t = 0.0
        for i, cena in enumerate(cenas, 1):
            self.log(f"• Cena {i}/{len(cenas)}: narrando e buscando imagens...")
            mp3 = tmp / f"cena{i:03d}.mp3"
            dur_voz, palavras = voz.narrar(cena["narracao"], self.voz, mp3, self.velocidade_voz)
            dur = dur_voz + self.pausa_entre_cenas
            wav = tmp / f"cena{i:03d}.wav"
            ffmpeg.audio_com_pausa(mp3, dur, wav)
            audios.append(wav)
            palavras_total += [{**p, "inicio": p["inicio"] + t, "fim": p["fim"] + t} for p in palavras]

            # divide a cena em tomadas para o visual não ficar parado
            n = max(1, round(dur / self.segundos_por_tomada))
            buscas = cena.get("buscas_visuais") or [self.nicho]
            for k in range(n):
                d = dur / n
                ordem = buscas[k % len(buscas):] + buscas[:k % len(buscas)]
                midia = banco.pegar(ordem) if banco.disponivel() else None
                if midia:
                    creditos.append(midia["id"])
                seg = tmp / f"seg{i:03d}_{k:02d}.mp4"
                ffmpeg.segmento(midia, d, self.largura, self.altura, seg)
                segmentos.append(seg)
            t += dur

        self.log("• Montando vídeo final...")
        video_mudo = tmp / "video_mudo.mp4"
        ffmpeg.concatenar(segmentos, video_mudo)
        narracao = tmp / "narracao.wav"
        ffmpeg.concatenar(audios, narracao)
        ass = pasta / "legendas.ass"
        legendas.gerar_ass(palavras_total, ass, self.largura, self.altura, self.estilo_legenda)
        final = pasta / "video.mp4"
        ffmpeg.finalizar(video_mudo, narracao, ass, self.escolher_musica(), final, self.volume_musica)

        self.salvar_metadados(roteiro, pasta, creditos, t)
        self.thumbnail(roteiro, pasta, final)
        if not getattr(self, "manter_temporarios", False):
            shutil.rmtree(tmp, ignore_errors=True)
        self.log(f"✓ Pronto: {final}  ({t / 60:.1f} min)")
        return final

    def salvar_metadados(self, roteiro: dict, pasta: Path, creditos: list[str], dur: float) -> None:
        txt = [
            f"TÍTULO:\n{roteiro.get('titulo', '')}\n",
            "TÍTULOS ALTERNATIVOS (teste A/B):\n" + "\n".join(f"- {x}" for x in roteiro.get("titulos_alternativos", [])) + "\n",
            f"DESCRIÇÃO:\n{roteiro.get('descricao', '')}\n",
            "TAGS:\n" + ", ".join(roteiro.get("tags", [])) + "\n",
            f"THUMBNAIL:\nTexto: {roteiro.get('thumbnail', {}).get('texto', '')}\n"
            f"Imagem (prompt para gerar no Gemini/ImageFX): {roteiro.get('thumbnail', {}).get('imagem', '')}\n",
            f"DURAÇÃO: {dur / 60:.1f} min | Tipo: {self.nome} | Nicho: {self.nicho} | Modelo v{roteiro.get('modelo_versao')}\n",
            "MÍDIAS USADAS (Pexels/Pixabay, uso comercial liberado):\n" + ", ".join(sorted(set(creditos))),
        ]
        (pasta / "publicar.txt").write_text("\n".join(txt), encoding="utf-8")

    def thumbnail(self, roteiro: dict, pasta: Path, video: Path) -> None:
        """Tenta gerar a thumbnail com o Gemini (imagem); se não der, salva um quadro do vídeo."""
        th = roteiro.get("thumbnail") or {}
        if th.get("imagem"):
            prompt = (f"YouTube thumbnail, 16:9, high contrast, dramatic lighting. {th['imagem']}. "
                      f"Big bold text: \"{th.get('texto', '')}\"")
            if gemini.gerar_imagem(prompt, pasta / "thumbnail.png"):
                self.log("• Thumbnail gerada com o Gemini.")
                return
        try:
            ffmpeg.miniatura_de_quadro(video, min(3.0, ffmpeg.duracao(video) / 2), pasta / "thumbnail_quadro.jpg")
        except ffmpeg.ErroFFmpeg:
            pass

    # ------------------------------------------------------------ fluxo completo
    def criar(self, tema: str | None = None, roteiro_arquivo: Path | None = None, duracao_s: int | None = None,
              so_roteiro: bool = False, sem_modelo: bool = False) -> Path:
        if roteiro_arquivo:
            roteiro = json.loads(Path(roteiro_arquivo).read_text(encoding="utf-8"))
            pasta = Path(roteiro_arquivo).parent
        else:
            if not tema:
                raise RuntimeError("Informe --tema ou --roteiro.")
            modelo = self.carregar_modelo(exigir=not sem_modelo)
            dur = duracao_s or int(((modelo or {}).get("modelo") or {}).get("duracao_ideal_s") or self.duracao_padrao_s)
            roteiro = self.gerar_roteiro(tema, modelo, dur)
            pasta = self.pasta_projeto(roteiro.get("titulo") or tema)
        if so_roteiro:
            arq = pasta / "roteiro.json"
            arq.write_text(json.dumps(roteiro, ensure_ascii=False, indent=2), encoding="utf-8")
            self.log(f"✓ Roteiro salvo em {arq}\n  Edite se quiser e depois rode:\n"
                     f"  python -m darks criar --tipo {self.nome} --nicho \"{self.nicho}\" --roteiro \"{arq}\"")
            return arq
        return self.produzir(roteiro, pasta)
