"""Legendas no formato ASS (estilo controlado e queimadas no vídeo pelo FFmpeg)."""
from __future__ import annotations

from pathlib import Path


def _tempo(s: float) -> str:
    h, r = divmod(max(s, 0), 3600)
    m, s = divmod(r, 60)
    return f"{int(h)}:{int(m):02d}:{s:05.2f}"


def _limpar(t: str) -> str:
    return t.replace("{", "(").replace("}", ")").replace("\n", " ")


def gerar_ass(palavras: list[dict], arquivo: Path, w: int, h: int, estilo: dict) -> None:
    """palavras: [{palavra, inicio, fim}] já no tempo do vídeo final.

    estilo: palavras_por_bloco, tamanho, maiusculas, alinhamento (2=embaixo, 5=centro),
            margem_v, cor (&HBBGGRR), destaque (cor da palavra falada, opcional), fonte
    """
    n = estilo.get("palavras_por_bloco", 6)
    fonte = estilo.get("fonte", "Arial")
    cor = estilo.get("cor", "&H00FFFFFF")
    destaque = estilo.get("destaque")
    linhas = [
        "[Script Info]", "ScriptType: v4.00+", f"PlayResX: {w}", f"PlayResY: {h}", "WrapStyle: 0", "",
        "[V4+ Styles]",
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, "
        "Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
        f"Style: Padrao,{fonte},{estilo.get('tamanho', 56)},{cor},&H000000FF,&H00000000,&H64000000,-1,0,0,0,100,100,0,0,1,"
        f"{estilo.get('contorno', 4)},2,{estilo.get('alinhamento', 2)},60,60,{estilo.get('margem_v', 70)},1",
        "", "[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ]
    blocos: list[list[dict]] = []
    atual: list[dict] = []
    for p in palavras:
        atual.append(p)
        fim_frase = p["palavra"].rstrip().endswith((".", "!", "?", ",", ";", ":"))
        if len(atual) >= n or (fim_frase and len(atual) >= max(2, n // 2)):
            blocos.append(atual)
            atual = []
    if atual:
        blocos.append(atual)

    for i, b in enumerate(blocos):
        ini = b[0]["inicio"]
        fim = blocos[i + 1][0]["inicio"] if i + 1 < len(blocos) and blocos[i + 1][0]["inicio"] - b[-1]["fim"] < 0.6 else b[-1]["fim"] + 0.2
        textos = [_limpar(p["palavra"]) for p in b]
        if estilo.get("maiusculas"):
            textos = [t.upper() for t in textos]
        if destaque:  # karaokê: cada palavra acende quando é falada
            for j, p in enumerate(b):
                p_ini = p["inicio"]
                p_fim = b[j + 1]["inicio"] if j + 1 < len(b) else fim
                txt = " ".join(f"{{\\c{destaque}}}{t}{{\\c{cor}}}" if k == j else t for k, t in enumerate(textos))
                linhas.append(f"Dialogue: 0,{_tempo(p_ini)},{_tempo(p_fim)},Padrao,,0,0,0,,{txt}")
        else:
            linhas.append(f"Dialogue: 0,{_tempo(ini)},{_tempo(fim)},Padrao,,0,0,0,,{' '.join(textos)}")
    arquivo.write_text("\n".join(linhas) + "\n", encoding="utf-8")
