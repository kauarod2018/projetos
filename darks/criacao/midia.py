"""Busca e baixa vídeos/imagens gratuitos (Pexels e Pixabay: uso comercial liberado)."""
from __future__ import annotations

import hashlib
from pathlib import Path

import httpx

from ..config import PEXELS_API_KEY, PIXABAY_API_KEY


def _pexels_videos(busca: str, orientacao: str, n: int) -> list[dict]:
    if not PEXELS_API_KEY:
        return []
    r = httpx.get("https://api.pexels.com/videos/search", headers={"Authorization": PEXELS_API_KEY},
                  params={"query": busca, "orientation": orientacao, "per_page": n, "size": "medium"}, timeout=30)
    if r.status_code != 200:
        return []
    out = []
    for v in r.json().get("videos", []):
        arqs = [f for f in v.get("video_files", []) if f.get("file_type") == "video/mp4" and (f.get("height") or 0) >= 720]
        if not arqs:
            continue
        melhor = min(arqs, key=lambda f: abs((f.get("height") or 0) - 1080))
        out.append({"id": f"pexels-v{v['id']}", "tipo": "video", "url": melhor["link"], "duracao": v.get("duration")})
    return out


def _pixabay_videos(busca: str, orientacao: str, n: int) -> list[dict]:
    if not PIXABAY_API_KEY:
        return []
    r = httpx.get("https://pixabay.com/api/videos/", params={"key": PIXABAY_API_KEY, "q": busca[:100],
                  "per_page": max(n, 3), "safesearch": "true"}, timeout=30)
    if r.status_code != 200:
        return []
    out = []
    for v in r.json().get("hits", []):
        vs = v.get("videos", {})
        arq = vs.get("large") if (vs.get("large") or {}).get("url") else vs.get("medium")
        if not arq or not arq.get("url"):
            continue
        vertical = (arq.get("height") or 0) > (arq.get("width") or 0)
        if (orientacao == "portrait") != vertical and orientacao != "any":
            continue  # orientação errada (vertical x horizontal)
        out.append({"id": f"pixabay-v{v['id']}", "tipo": "video", "url": arq["url"], "duracao": v.get("duration")})
    return out


def _pexels_fotos(busca: str, orientacao: str, n: int) -> list[dict]:
    if not PEXELS_API_KEY:
        return []
    r = httpx.get("https://api.pexels.com/v1/search", headers={"Authorization": PEXELS_API_KEY},
                  params={"query": busca, "orientation": orientacao, "per_page": n}, timeout=30)
    if r.status_code != 200:
        return []
    return [{"id": f"pexels-f{f['id']}", "tipo": "imagem", "url": f["src"]["large2x"]} for f in r.json().get("photos", [])]


def _pixabay_fotos(busca: str, orientacao: str, n: int) -> list[dict]:
    if not PIXABAY_API_KEY:
        return []
    r = httpx.get("https://pixabay.com/api/", params={"key": PIXABAY_API_KEY, "q": busca[:100], "per_page": max(n, 3),
                  "orientation": "vertical" if orientacao == "portrait" else "horizontal", "safesearch": "true",
                  "image_type": "photo"}, timeout=30)
    if r.status_code != 200:
        return []
    return [{"id": f"pixabay-f{h['id']}", "tipo": "imagem", "url": h["largeImageURL"]} for h in r.json().get("hits", [])]


class BancoDeMidia:
    """Busca mídia para cada cena sem repetir arquivos no mesmo vídeo."""

    def __init__(self, pasta: Path, orientacao: str = "landscape", preferir: str = "video"):
        self.pasta = pasta
        self.pasta.mkdir(parents=True, exist_ok=True)
        self.orientacao = orientacao
        self.preferir = preferir
        self.usados: set[str] = set()
        self.cache: dict[str, list[dict]] = {}

    def disponivel(self) -> bool:
        return bool(PEXELS_API_KEY or PIXABAY_API_KEY)

    def _candidatos(self, busca: str) -> list[dict]:
        if busca not in self.cache:
            fontes = [_pexels_videos, _pixabay_videos, _pexels_fotos, _pixabay_fotos]
            if self.preferir == "imagem":
                fontes = fontes[2:] + fontes[:2]
            res: list[dict] = []
            for f in fontes:
                try:
                    res += f(busca, self.orientacao, 8)
                except httpx.HTTPError:
                    continue
                if len(res) >= 6:
                    break
            self.cache[busca] = res
        return self.cache[busca]

    def pegar(self, buscas: list[str]) -> dict | None:
        """Tenta cada busca em ordem; baixa o primeiro item ainda não usado."""
        for busca in buscas:
            for c in self._candidatos(busca):
                if c["id"] in self.usados:
                    continue
                arq = self._baixar(c)
                if arq:
                    self.usados.add(c["id"])
                    return {**c, "arquivo": str(arq), "busca": busca}
        # tudo usado: aceita repetir para não ficar tela preta
        for busca in buscas:
            for c in self._candidatos(busca):
                arq = self._baixar(c)
                if arq:
                    return {**c, "arquivo": str(arq), "busca": busca}
        return None

    def _baixar(self, c: dict) -> Path | None:
        ext = ".mp4" if c["tipo"] == "video" else ".jpg"
        destino = self.pasta / (hashlib.md5(c["id"].encode()).hexdigest()[:12] + ext)
        if destino.exists() and destino.stat().st_size > 0:
            return destino
        try:
            with httpx.stream("GET", c["url"], timeout=120, follow_redirects=True) as r:
                if r.status_code != 200:
                    return None
                with open(destino, "wb") as f:
                    for bloco in r.iter_bytes(1 << 16):
                        f.write(bloco)
            return destino
        except httpx.HTTPError:
            destino.unlink(missing_ok=True)
            return None
