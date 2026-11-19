"""Tipo NARRADO: vídeo longo (16:9) com narração + vídeos de banco + legendas.

Bom para: curiosidades, mistérios, história, top 10, explicações, true crime leve.
"""
from ..base import GeradorVideo


class Narrado(GeradorVideo):
    nome = "narrado"
    descricao = "vídeo longo horizontal com narração em voz IA, vídeos de banco gratuitos e legenda"
    formato = "longo"
    foco_avaliacao = ("vídeos longos narrados sem rosto; observe como o gancho prende nos primeiros 30s, "
                      "a estrutura em blocos, loops abertos, ritmo das trocas de imagem e o padrão de títulos")
    largura, altura = 1920, 1080
    orientacao = "landscape"
    duracao_padrao_s = 480
    segundos_por_tomada = 5.0
    estilo_legenda = {"palavras_por_bloco": 7, "tamanho": 56, "alinhamento": 2, "margem_v": 70, "contorno": 4}
    regras_roteiro = "- Use 'loops abertos' (prometa algo que só será revelado mais tarde) a cada ~60-90 segundos."
