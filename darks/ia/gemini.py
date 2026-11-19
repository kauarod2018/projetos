"""Integração com o Gemini (Google). Usado para avaliar vídeos e escrever roteiros."""
from __future__ import annotations

import json
import re

from ..config import GEMINI_API_KEY, GEMINI_MODELO


class ErroIA(RuntimeError):
    pass


def _cliente():
    if not GEMINI_API_KEY:
        raise ErroIA(
            "GEMINI_API_KEY não configurada. Crie em https://aistudio.google.com/apikey "
            "e coloque no arquivo .env"
        )
    from google import genai

    return genai.Client(api_key=GEMINI_API_KEY)


def gerar_texto(prompt: str, sistema: str | None = None, temperatura: float = 0.8) -> str:
    from google.genai import types

    resp = _cliente().models.generate_content(
        model=GEMINI_MODELO,
        contents=prompt,
        config=types.GenerateContentConfig(system_instruction=sistema, temperature=temperatura),
    )
    return (resp.text or "").strip()


def gerar_json(prompt: str, sistema: str | None = None, temperatura: float = 0.7) -> dict | list:
    """Pede uma resposta em JSON e devolve já convertida."""
    from google.genai import types

    resp = _cliente().models.generate_content(
        model=GEMINI_MODELO,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=sistema,
            temperature=temperatura,
            response_mime_type="application/json",
        ),
    )
    return extrair_json(resp.text or "")


def extrair_json(texto: str) -> dict | list:
    texto = texto.strip()
    try:
        return json.loads(texto)
    except json.JSONDecodeError:
        m = re.search(r"```(?:json)?\s*(.+?)```", texto, re.S) or re.search(r"(\{.*\}|\[.*\])", texto, re.S)
        if not m:
            raise ErroIA(f"Resposta da IA não é JSON: {texto[:300]}")
        return json.loads(m.group(1))


def gerar_imagem(prompt: str, arquivo) -> bool:
    """Gera uma imagem com o modelo de imagem do Gemini. Retorna False se não for possível."""
    import os

    if not GEMINI_API_KEY:
        return False
    try:
        from google.genai import types

        resp = _cliente().models.generate_content(
            model=os.getenv("GEMINI_MODELO_IMAGEM", "gemini-2.5-flash-image"),
            contents=prompt,
            config=types.GenerateContentConfig(response_modalities=["IMAGE"]),
        )
        for parte in resp.candidates[0].content.parts:
            if getattr(parte, "inline_data", None) and parte.inline_data.data:
                with open(arquivo, "wb") as f:
                    f.write(parte.inline_data.data)
                return True
    except Exception:
        return False
    return False
