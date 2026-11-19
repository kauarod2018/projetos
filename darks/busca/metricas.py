"""Métricas para achar vídeos que performam acima do normal (outliers)."""
from __future__ import annotations

import re
from datetime import datetime, timezone
from statistics import median


def duracao_iso(iso: str | None) -> int:
    """'PT1H2M3S' -> 3723 segundos."""
    if not iso:
        return 0
    m = re.match(r"P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", iso)
    if not m:
        return 0
    d, h, mi, s = (int(x or 0) for x in m.groups())
    return d * 86400 + h * 3600 + mi * 60 + s


def dias_desde(publicado: str | None) -> float:
    if not publicado:
        return 0.0
    try:
        dt = datetime.fromisoformat(publicado.replace("Z", "+00:00"))
    except ValueError:
        return 0.0
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return max((datetime.now(timezone.utc) - dt).total_seconds() / 86400, 0.0)


def calcular(v: dict) -> dict:
    """Completa o dicionário do vídeo com métricas derivadas."""
    views = v.get("views") or 0
    dias = dias_desde(v.get("publicado"))
    v["idade_dias"] = round(dias, 1) if dias else None
    v["views_dia"] = round(views / max(dias, 1), 1) if dias else None
    inscritos = v.get("inscritos") or 0
    # Outlier: quantas vezes o vídeo superou o tamanho do canal
    v["outlier"] = round(views / inscritos, 2) if inscritos else None
    interacoes = (v.get("likes") or 0) + (v.get("comentarios") or 0)
    v["engajamento"] = round(100 * interacoes / views, 2) if views and interacoes else None
    dur = v.get("duracao_s") or 0
    v["formato"] = "short" if 0 < dur <= 180 else ("longo" if dur else "?")
    return v


def outlier_no_canal(videos: list[dict]) -> list[dict]:
    """Compara cada vídeo com a mediana de views do próprio canal (no conjunto dado)."""
    por_canal: dict[str, list[int]] = {}
    for v in videos:
        por_canal.setdefault(v.get("canal_id") or v.get("canal") or "?", []).append(v.get("views") or 0)
    for v in videos:
        vals = por_canal[v.get("canal_id") or v.get("canal") or "?"]
        med = median(vals) if len(vals) >= 3 else 0
        v["outlier_canal"] = round((v.get("views") or 0) / med, 2) if med else None
    return videos


def pontuacao(v: dict) -> float:
    """Nota única para ordenar oportunidades: mistura velocidade e outlier."""
    vd = v.get("views_dia") or 0
    out = v.get("outlier") or v.get("outlier_canal") or 1
    return round((vd ** 0.5) * min(out, 50) ** 0.5, 1)


def resumo(videos: list[dict]) -> dict:
    if not videos:
        return {}
    views = [v.get("views") or 0 for v in videos]
    durs = [v.get("duracao_s") or 0 for v in videos if v.get("duracao_s")]
    return {
        "total": len(videos),
        "mediana_views": int(median(views)),
        "mediana_duracao_s": int(median(durs)) if durs else None,
        "shorts": sum(1 for v in videos if v.get("formato") == "short"),
        "longos": sum(1 for v in videos if v.get("formato") == "longo"),
    }
