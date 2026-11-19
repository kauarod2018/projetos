"""Tipo SHORTS: vertical (9:16), até 60s, cortes rápidos e legenda grande palavra a palavra."""
from ..base import GeradorVideo


class Shorts(GeradorVideo):
    nome = "shorts"
    descricao = "vídeo vertical curto (Shorts) com gancho imediato, cortes rápidos e legenda grande estilo karaokê"
    formato = "short"
    foco_avaliacao = ("Shorts; observe a primeira frase (0-2s), o tamanho do texto, se há loop no final "
                      "que emenda com o começo, velocidade da fala e quantidade de cortes")
    largura, altura = 1080, 1920
    orientacao = "portrait"
    duracao_padrao_s = 45
    segundos_por_tomada = 2.2
    pausa_entre_cenas = 0.1
    velocidade_voz = "+12%"
    volume_musica = 0.12
    estilo_legenda = {"palavras_por_bloco": 3, "tamanho": 96, "alinhamento": 5, "margem_v": 0,
                      "maiusculas": True, "contorno": 7, "destaque": "&H0000FFFF"}
    regras_roteiro = ("- Máximo 55 segundos. A PRIMEIRA frase já é o gancho (nada de 'olá', nada de introdução).\n"
                      "- Cenas de 1 frase cada. Termine com uma frase que emende com o início (loop).")
