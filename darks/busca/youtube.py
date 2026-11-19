"""Sistema de busca no YouTube.

Usa a YouTube Data API v3 (chave grátis do Google) quando configurada; sem chave,
cai para o yt-dlp, que não precisa de login (menos dados: sem inscritos/likes).
"""
from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone

import httpx

from ..config import IDIOMA_PADRAO, REGIAO_PADRAO, YOUTUBE_API_KEY
from . import metricas

API = "https://www.googleapis.com/youtube/v3"

CATEGORIAS = {
    "": "Todas", "1": "Filmes e animação", "10": "Música", "17": "Esportes", "20": "Jogos",
    "22": "Pessoas e blogs", "23": "Comédia", "24": "Entretenimento", "25": "Notícias",
    "26": "Estilo", "27": "Educação", "28": "Ciência e tecnologia",
}


class ErroBusca(RuntimeError):
    pass


def usando_api() -> bool:
    return bool(YOUTUBE_API_KEY)


# ---------------------------------------------------------------- API oficial
def _get(caminho: str, **params) -> dict:
    params["key"] = YOUTUBE_API_KEY
    r = httpx.get(f"{API}/{caminho}", params={k: v for k, v in params.items() if v not in (None, "")}, timeout=30)
    if r.status_code != 200:
        try:
            msg = r.json()["error"]["message"]
        except Exception:
            msg = r.text[:200]
        raise ErroBusca(f"YouTube API ({r.status_code}): {msg}")
    return r.json()


def detalhes(ids: list[str]) -> list[dict]:
    """Busca estatísticas completas dos vídeos e dos canais."""
    videos: list[dict] = []
    for i in range(0, len(ids), 50):
        dados = _get("videos", part="snippet,statistics,contentDetails", id=",".join(ids[i:i + 50]))
        for it in dados.get("items", []):
            sn, st = it["snippet"], it.get("statistics", {})
            videos.append({
                "id": it["id"],
                "titulo": sn.get("title"),
                "descricao": (sn.get("description") or "")[:1000],
                "tags": sn.get("tags", [])[:30],
                "canal": sn.get("channelTitle"),
                "canal_id": sn.get("channelId"),
                "publicado": sn.get("publishedAt"),
                "idioma": sn.get("defaultAudioLanguage") or sn.get("defaultLanguage"),
                "thumb": (sn.get("thumbnails", {}).get("high") or sn.get("thumbnails", {}).get("default") or {}).get("url"),
                "views": int(st.get("viewCount", 0)),
                "likes": int(st["likeCount"]) if "likeCount" in st else None,
                "comentarios": int(st["commentCount"]) if "commentCount" in st else None,
                "duracao_s": metricas.duracao_iso(it.get("contentDetails", {}).get("duration")),
            })
    canais = list({v["canal_id"] for v in videos if v.get("canal_id")})
    inscritos: dict[str, int] = {}
    for i in range(0, len(canais), 50):
        dados = _get("channels", part="statistics", id=",".join(canais[i:i + 50]))
        for it in dados.get("items", []):
            inscritos[it["id"]] = int(it.get("statistics", {}).get("subscriberCount", 0) or 0)
    for v in videos:
        v["inscritos"] = inscritos.get(v.get("canal_id"))
        v["url"] = f"https://www.youtube.com/watch?v={v['id']}"
    return videos


# ---------------------------------------------------------------- yt-dlp
def _ytdlp(url: str, limite: int) -> list[dict]:
    import yt_dlp

    opts = {"quiet": True, "no_warnings": True, "extract_flat": "in_playlist",
            "playlistend": limite, "skip_download": True}
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=False)
    out = []
    for e in (info or {}).get("entries", [])[:limite]:
        if not e or not e.get("id"):
            continue
        ts = e.get("timestamp") or e.get("release_timestamp")
        out.append({
            "id": e["id"],
            "titulo": e.get("title"),
            "descricao": (e.get("description") or "")[:1000],
            "tags": [],
            "canal": e.get("channel") or e.get("uploader") or info.get("channel"),
            "canal_id": e.get("channel_id") or info.get("channel_id"),
            "publicado": datetime.fromtimestamp(ts, timezone.utc).isoformat() if ts else None,
            "thumb": f"https://i.ytimg.com/vi/{e['id']}/hqdefault.jpg",
            "views": e.get("view_count") or 0,
            "likes": None, "comentarios": None,
            "inscritos": e.get("channel_follower_count") or info.get("channel_follower_count"),
            "duracao_s": int(e.get("duration") or 0),
            "url": f"https://www.youtube.com/watch?v={e['id']}",
        })
    return out


def _finalizar(videos: list[dict]) -> list[dict]:
    videos = [metricas.calcular(v) for v in videos]
    metricas.outlier_no_canal(videos)
    for v in videos:
        v["pontuacao"] = metricas.pontuacao(v)
    return videos


# ---------------------------------------------------------------- funções públicas
def buscar(termo: str, limite: int = 25, ordem: str = "relevance", periodo_dias: int | None = None,
           duracao: str = "any", regiao: str = REGIAO_PADRAO, idioma: str = IDIOMA_PADRAO) -> list[dict]:
    """Busca vídeos por termo.

    ordem: relevance | viewCount | date ; duracao: any | short (<4min) | medium | long (>20min)
    """
    limite = max(1, min(limite, 50))
    if usando_api():
        depois = None
        if periodo_dias:
            depois = (datetime.now(timezone.utc) - timedelta(days=periodo_dias)).strftime("%Y-%m-%dT%H:%M:%SZ")
        dados = _get("search", part="id", q=termo, type="video", maxResults=limite, order=ordem,
                     publishedAfter=depois, videoDuration=duracao if duracao != "any" else None,
                     regionCode=regiao, relevanceLanguage=idioma)
        ids = [it["id"]["videoId"] for it in dados.get("items", []) if it.get("id", {}).get("videoId")]
        videos = detalhes(ids)
    else:
        prefixo = "ytsearchdate" if ordem == "date" else "ytsearch"
        videos = _ytdlp(f"{prefixo}{limite}:{termo}", limite)
        if periodo_dias:
            videos = [v for v in videos if not v["publicado"] or metricas.dias_desde(v["publicado"]) <= periodo_dias]
        if duracao == "short":
            videos = [v for v in videos if 0 < v["duracao_s"] < 240]
        elif duracao == "long":
            videos = [v for v in videos if v["duracao_s"] > 1200]
        if ordem == "viewCount":
            videos.sort(key=lambda v: v["views"], reverse=True)
    return _finalizar(videos)


def em_alta(regiao: str = REGIAO_PADRAO, categoria: str = "", limite: int = 50) -> list[dict]:
    """Vídeos em alta (trending) do país."""
    if usando_api():
        dados = _get("videos", part="id", chart="mostPopular", regionCode=regiao,
                     videoCategoryId=categoria or None, maxResults=min(limite, 50))
        videos = detalhes([it["id"] for it in dados.get("items", [])])
    else:
        videos = _ytdlp(f"https://www.youtube.com/feed/trending?gl={regiao}", limite)
    return _finalizar(videos)


def _canal_id(canal: str) -> str:
    canal = canal.strip()
    m = re.search(r"(UC[\w-]{22})", canal)
    if m:
        return m.group(1)
    handle = canal.rsplit("/", 1)[-1] if "youtube.com" in canal else canal
    handle = handle if handle.startswith("@") else "@" + handle
    dados = _get("channels", part="id", forHandle=handle)
    if not dados.get("items"):
        raise ErroBusca(f"Canal não encontrado: {canal}")
    return dados["items"][0]["id"]


def canal(canal: str, limite: int = 30) -> dict:
    """Analisa um canal: últimos vídeos, médias e quais vídeos estouraram."""
    if usando_api():
        cid = _canal_id(canal)
        info = _get("channels", part="snippet,statistics,contentDetails", id=cid)["items"][0]
        uploads = info["contentDetails"]["relatedPlaylists"]["uploads"]
        itens = _get("playlistItems", part="contentDetails", playlistId=uploads, maxResults=min(limite, 50))
        videos = detalhes([it["contentDetails"]["videoId"] for it in itens.get("items", [])])
        dados_canal = {
            "id": cid, "nome": info["snippet"]["title"],
            "descricao": info["snippet"].get("description", "")[:500],
            "inscritos": int(info["statistics"].get("subscriberCount", 0) or 0),
            "total_videos": int(info["statistics"].get("videoCount", 0) or 0),
            "total_views": int(info["statistics"].get("viewCount", 0) or 0),
            "criado": info["snippet"].get("publishedAt"),
        }
    else:
        url = canal if canal.startswith("http") else f"https://www.youtube.com/{canal if canal.startswith('@') else '@' + canal}"
        videos = _ytdlp(url.rstrip("/") + "/videos", limite)
        dados_canal = {"id": videos[0]["canal_id"] if videos else None,
                       "nome": videos[0]["canal"] if videos else canal,
                       "inscritos": videos[0]["inscritos"] if videos else None}
    videos = _finalizar(videos)
    return {"canal": dados_canal, "videos": videos, "resumo": metricas.resumo(videos)}


def transcricao(video_id: str, idioma: str = IDIOMA_PADRAO, max_chars: int = 12000) -> str:
    """Texto falado do vídeo (legenda manual ou automática) via yt-dlp. Vazio se não houver."""
    import yt_dlp

    with yt_dlp.YoutubeDL({"quiet": True, "no_warnings": True, "skip_download": True}) as ydl:
        info = ydl.extract_info(f"https://www.youtube.com/watch?v={video_id}", download=False)
    for fonte in ("subtitles", "automatic_captions"):
        legendas = info.get(fonte) or {}
        chave = next((k for k in legendas if k == idioma or k.startswith(idioma + "-")), None)
        chave = chave or next((k for k in legendas if k.startswith("en")), None)
        if not chave:
            continue
        fmt = next((f for f in legendas[chave] if f.get("ext") == "vtt"), None)
        if not fmt:
            continue
        vtt = httpx.get(fmt["url"], timeout=30).text
        return _vtt_para_texto(vtt)[:max_chars]
    return ""


def _vtt_para_texto(vtt: str) -> str:
    linhas, anterior = [], ""
    for ln in vtt.splitlines():
        if not ln.strip() or "-->" in ln or ln.startswith(("WEBVTT", "Kind:", "Language:", "NOTE")):
            continue
        ln = re.sub(r"<[^>]+>", "", ln).strip()
        if ln and ln != anterior:
            linhas.append(ln)
            anterior = ln
    return " ".join(linhas)
