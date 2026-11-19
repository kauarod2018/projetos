"""Narração gratuita com Edge-TTS (vozes neurais da Microsoft), com tempo de cada palavra."""
from __future__ import annotations

import asyncio
from pathlib import Path

from .ffmpeg import duracao


async def _narrar(texto: str, voz: str, arquivo: Path, velocidade: str) -> list[dict]:
    import edge_tts

    com = edge_tts.Communicate(texto, voz, rate=velocidade, boundary="WordBoundary")
    palavras: list[dict] = []
    with open(arquivo, "wb") as f:
        async for parte in com.stream():
            if parte["type"] == "audio":
                f.write(parte["data"])
            elif parte["type"] == "WordBoundary":
                ini = parte["offset"] / 10_000_000
                palavras.append({"palavra": parte["text"], "inicio": ini, "fim": ini + parte["duration"] / 10_000_000})
    return palavras


def narrar(texto: str, voz: str, arquivo: Path, velocidade: str = "+0%") -> tuple[float, list[dict]]:
    """Gera o MP3 e devolve (duração, palavras com tempos)."""
    palavras = asyncio.run(_narrar(texto, voz, arquivo, velocidade))
    dur = duracao(arquivo)
    if not palavras:  # algumas vozes não mandam tempos: distribui por igual
        lista = texto.split()
        passo = dur / max(len(lista), 1)
        palavras = [{"palavra": p, "inicio": i * passo, "fim": (i + 1) * passo} for i, p in enumerate(lista)]
    return dur, palavras
