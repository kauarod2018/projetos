"""Painel web: busca no YouTube, vídeos em alta, análise de canais e modelos aprendidos.

Abrir com:  python -m darks painel   ->  http://localhost:8000
"""
from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse

from .. import config
from ..avaliacao import modelador
from ..busca import metricas, youtube
from ..criacao.tipos import TIPOS
from ..db import salvar_busca, ultimas_buscas

app = FastAPI(title="Darks — Painel")
HTML = (Path(__file__).parent / "templates" / "index.html").read_text(encoding="utf-8")


def _erro(fn, *args, **kw):
    try:
        return fn(*args, **kw)
    except youtube.ErroBusca as e:
        raise HTTPException(400, str(e))
    except Exception as e:  # mostra o erro no painel em vez de quebrar
        raise HTTPException(500, f"{e.__class__.__name__}: {e}")


@app.get("/", response_class=HTMLResponse)
def inicio():
    return HTML


@app.get("/api/status")
def status():
    return {
        "youtube_api": bool(config.YOUTUBE_API_KEY), "gemini": bool(config.GEMINI_API_KEY),
        "pexels": bool(config.PEXELS_API_KEY), "pixabay": bool(config.PIXABAY_API_KEY),
        "regiao": config.REGIAO_PADRAO, "categorias": youtube.CATEGORIAS,
        "tipos": {n: c.descricao for n, c in TIPOS.items()},
    }


@app.get("/api/buscar")
def buscar(termo: str, ordem: str = "viewCount", dias: int | None = None, duracao: str = "any",
           limite: int = 50, regiao: str = config.REGIAO_PADRAO):
    vids = _erro(youtube.buscar, termo, limite=limite, ordem=ordem, periodo_dias=dias or None,
                 duracao=duracao, regiao=regiao)
    salvar_busca(termo, "busca", {"ordem": ordem, "dias": dias, "duracao": duracao}, vids)
    return {"videos": vids, "resumo": metricas.resumo(vids)}


@app.get("/api/em-alta")
def em_alta(regiao: str = config.REGIAO_PADRAO, categoria: str = ""):
    vids = _erro(youtube.em_alta, regiao=regiao, categoria=categoria)
    salvar_busca(f"em alta {regiao} {categoria}", "em_alta", {}, vids)
    return {"videos": vids, "resumo": metricas.resumo(vids)}


@app.get("/api/canal")
def canal(canal: str, limite: int = 30):
    res = _erro(youtube.canal, canal, limite=limite)
    salvar_busca(canal, "canal", {}, res["videos"])
    return res


@app.get("/api/modelos")
def modelos():
    return modelador.listar_modelos()


@app.get("/api/modelo")
def modelo(tipo: str, nicho: str):
    m = modelador.carregar_modelo(tipo, nicho)
    if not m:
        raise HTTPException(404, "Modelo não encontrado")
    return m


@app.get("/api/historico")
def historico():
    return ultimas_buscas(30)
