"""Registro dos tipos de vídeo. Para criar um tipo novo:

1. copie criacao/tipos/narrado.py para criacao/tipos/<seu_tipo>.py
2. mude nome/descrição/formato/visual/regras (ou sobrescreva métodos, ex.: produzir)
3. adicione a classe em TIPOS abaixo
"""
from .narrado import Narrado
from .shorts import Shorts

TIPOS = {c.nome: c for c in (Narrado, Shorts)}


def obter(nome: str):
    if nome not in TIPOS:
        raise KeyError(f"Tipo '{nome}' não existe. Tipos disponíveis: {', '.join(TIPOS)}")
    return TIPOS[nome]
