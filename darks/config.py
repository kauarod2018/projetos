"""Configuração central: lê o .env e define pastas do projeto."""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

RAIZ = Path(__file__).resolve().parent.parent
load_dotenv(RAIZ / ".env")

PASTA_MODELOS = RAIZ / "modelos"
PASTA_SAIDA = RAIZ / "saida"
PASTA_MUSICAS = RAIZ / "musicas"
PASTA_DADOS = RAIZ / "dados"
for _p in (PASTA_MODELOS, PASTA_SAIDA, PASTA_MUSICAS, PASTA_DADOS):
    _p.mkdir(parents=True, exist_ok=True)


def env(nome: str, padrao: str = "") -> str:
    return os.getenv(nome, padrao).strip()


GEMINI_API_KEY = env("GEMINI_API_KEY")
GEMINI_MODELO = env("GEMINI_MODELO", "gemini-2.5-flash")
YOUTUBE_API_KEY = env("YOUTUBE_API_KEY")
PEXELS_API_KEY = env("PEXELS_API_KEY")
PIXABAY_API_KEY = env("PIXABAY_API_KEY")
VOZ_PADRAO = env("VOZ_PADRAO", "pt-BR-AntonioNeural")
REGIAO_PADRAO = env("REGIAO_PADRAO", "BR")
IDIOMA_PADRAO = env("IDIOMA_PADRAO", "pt")
