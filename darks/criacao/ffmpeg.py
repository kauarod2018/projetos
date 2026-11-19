"""Funções de vídeo/áudio com FFmpeg (grátis)."""
from __future__ import annotations

import json
import random
import subprocess
from pathlib import Path

FPS = 30


class ErroFFmpeg(RuntimeError):
    pass


def rodar(args: list[str], cwd: Path | None = None) -> None:
    r = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *args],
                       cwd=cwd, capture_output=True, text=True)
    if r.returncode != 0:
        raise ErroFFmpeg(r.stderr.strip()[-1500:])


def duracao(arquivo: Path) -> float:
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", str(arquivo)],
                       capture_output=True, text=True)
    try:
        return float(json.loads(r.stdout)["format"]["duration"])
    except (KeyError, ValueError, json.JSONDecodeError):
        return 0.0


_X264 = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", "-r", str(FPS)]


def segmento(midia: dict | None, dur: float, w: int, h: int, saida: Path) -> None:
    """Cria um trecho mudo de `dur` segundos a partir de um vídeo, imagem ou cor sólida."""
    cobrir = f"scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},setsar=1"
    if midia and midia["tipo"] == "video":
        total = duracao(Path(midia["arquivo"]))
        ini = random.uniform(0, max(total - dur, 0)) if total > dur + 1 else 0
        rodar(["-ss", f"{ini:.2f}", "-stream_loop", "-1", "-i", midia["arquivo"], "-t", f"{dur:.3f}",
               "-vf", f"{cobrir},fps={FPS}", "-an", *_X264, str(saida)])
    elif midia and midia["tipo"] == "imagem":
        frames = max(int(dur * FPS), 1)
        zoom_in = random.random() < 0.5
        z = "min(zoom+0.0009,1.18)" if zoom_in else "if(eq(on,0),1.18,max(zoom-0.0009,1))"
        rodar(["-loop", "1", "-i", midia["arquivo"], "-t", f"{dur:.3f}",
               "-vf", f"scale={w * 2}:{h * 2}:force_original_aspect_ratio=increase,crop={w * 2}:{h * 2},"
                      f"zoompan=z='{z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={frames}:s={w}x{h}:fps={FPS},setsar=1",
               "-an", *_X264, str(saida)])
    else:
        rodar(["-f", "lavfi", "-i", f"color=c=0x101014:s={w}x{h}:d={dur:.3f}:r={FPS}", *_X264, str(saida)])


def concatenar(arquivos: list[Path], saida: Path, copiar: bool = True) -> None:
    lista = saida.with_suffix(".txt")
    lista.write_text("".join(f"file '{a.resolve()}'\n" for a in arquivos), encoding="utf-8")
    extra = ["-c", "copy"] if copiar else []
    rodar(["-f", "concat", "-safe", "0", "-i", str(lista), *extra, str(saida)])


def audio_com_pausa(entrada: Path, dur_total: float, saida: Path) -> None:
    """Converte para WAV e completa com silêncio até `dur_total` segundos."""
    rodar(["-i", str(entrada), "-af", "apad", "-t", f"{dur_total:.3f}", "-ar", "44100", "-ac", "2", str(saida)])


def finalizar(video: Path, narracao: Path, legendas: Path | None, musica: Path | None,
              saida: Path, volume_musica: float = 0.10) -> None:
    """Junta vídeo + narração (+ música de fundo com ducking) e queima as legendas."""
    pasta = saida.parent
    args = ["-i", str(video.resolve()), "-i", str(narracao.resolve())]
    vf = f"[0:v]ass={legendas.name}[v]" if legendas else "[0:v]null[v]"
    if musica:
        args += ["-stream_loop", "-1", "-i", str(musica.resolve())]
        # música abaixa sozinha quando a narração fala (ducking)
        af = (f"[1:a]asplit=2[n1][n2];[2:a]volume={volume_musica}[m];"
              f"[m][n1]sidechaincompress=threshold=0.05:ratio=6[md];"
              f"[n2][md]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[a]")
    else:
        af = "[1:a]anull[a]"
    rodar([*args, "-filter_complex", f"{vf};{af}", "-map", "[v]", "-map", "[a]",
           *_X264, "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", saida.name], cwd=pasta)


def miniatura_de_quadro(video: Path, segundo: float, saida: Path) -> None:
    rodar(["-ss", f"{segundo:.2f}", "-i", str(video), "-frames:v", "1", "-q:v", "2", str(saida)])
