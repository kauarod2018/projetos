"""Banco SQLite simples: guarda buscas e vídeos analisados para comparar com o tempo."""
from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone

from .config import PASTA_DADOS

ARQUIVO = PASTA_DADOS / "darks.db"

ESQUEMA = """
CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    titulo TEXT, canal TEXT, canal_id TEXT,
    views INTEGER, likes INTEGER, comentarios INTEGER, inscritos INTEGER,
    duracao_s INTEGER, publicado TEXT,
    views_dia REAL, outlier REAL, engajamento REAL,
    dados TEXT, atualizado TEXT
);
CREATE TABLE IF NOT EXISTS buscas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    termo TEXT, tipo TEXT, parametros TEXT, ids TEXT, criado TEXT
);
"""


def conectar() -> sqlite3.Connection:
    con = sqlite3.connect(ARQUIVO)
    con.row_factory = sqlite3.Row
    con.executescript(ESQUEMA)
    return con


def agora() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def salvar_videos(videos: list[dict]) -> None:
    with conectar() as con:
        for v in videos:
            con.execute(
                """INSERT OR REPLACE INTO videos VALUES
                (:id,:titulo,:canal,:canal_id,:views,:likes,:comentarios,:inscritos,
                 :duracao_s,:publicado,:views_dia,:outlier,:engajamento,:dados,:atualizado)""",
                {**{k: v.get(k) for k in (
                    "id", "titulo", "canal", "canal_id", "views", "likes", "comentarios",
                    "inscritos", "duracao_s", "publicado", "views_dia", "outlier", "engajamento")},
                 "dados": json.dumps(v, ensure_ascii=False), "atualizado": agora()},
            )


def salvar_busca(termo: str, tipo: str, parametros: dict, videos: list[dict]) -> None:
    salvar_videos(videos)
    with conectar() as con:
        con.execute(
            "INSERT INTO buscas (termo,tipo,parametros,ids,criado) VALUES (?,?,?,?,?)",
            (termo, tipo, json.dumps(parametros, ensure_ascii=False),
             json.dumps([v["id"] for v in videos]), agora()),
        )


def ultimas_buscas(limite: int = 20) -> list[dict]:
    with conectar() as con:
        rows = con.execute(
            "SELECT id, termo, tipo, criado FROM buscas ORDER BY id DESC LIMIT ?", (limite,)
        ).fetchall()
    return [dict(r) for r in rows]
