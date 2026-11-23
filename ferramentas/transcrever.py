"""Transcreve áudio ou vídeo com faster-whisper, com o tempo de cada palavra.

Uso:
  python ferramentas/transcrever.py ARQUIVO [--saida BASE] [--modelo small] [--idioma pt] [--roteiro ROTEIRO.txt]

--roteiro: quando a narração veio de um roteiro seu, passe o arquivo. O texto da legenda passa
a ser o do roteiro (sem erros de reconhecimento) e o Whisper só dá os tempos de cada palavra.

Gera:
  BASE.json  legendas palavra por palavra no formato Caption do Remotion
             ({text, startMs, endMs, timestampMs, confidence}) — pronto para importar no vídeo
  BASE.srt   legenda comum (por frase), para YouTube ou qualquer editor
  BASE.txt   o texto corrido, para ler ou estudar roteiros de referência
  BASE.falas.json  (só com --roteiro) início e fim de cada fala, para cortar as cenas

Modelos: tiny, base, small (padrão, bom equilíbrio), medium, large-v3 (melhor, mais lento).
"""

from __future__ import annotations

import argparse
import difflib
import json
import re
import unicodedata
from pathlib import Path


def _norm(palavra: str) -> str:
    sem_acento = unicodedata.normalize("NFKD", palavra.lower())
    return re.sub(r"[^a-z0-9]", "", "".join(c for c in sem_acento if not unicodedata.combining(c)))


def alinhar_ao_roteiro(palavras: list[dict], roteiro: Path) -> list[dict]:
    """Troca o texto reconhecido pelo texto do roteiro, mantendo os tempos do Whisper."""
    linhas = [l.strip() for l in roteiro.read_text(encoding="utf-8").splitlines()
              if l.strip() and not l.strip().startswith("#")]
    certas: list[str] = []
    fala_de: list[int] = []  # em qual linha (fala) do roteiro cada palavra está
    for n, linha in enumerate(linhas):
        for w in linha.split():
            certas.append(w)
            fala_de.append(n)
    ouvidas = [_norm(p["text"]) for p in palavras]
    saida: list[dict] = []
    matcher = difflib.SequenceMatcher(a=ouvidas, b=[_norm(c) for c in certas], autojunk=False)
    for op, a1, a2, b1, b2 in matcher.get_opcodes():
        if b1 == b2:  # palavra ouvida que não está no roteiro: descarta
            continue
        if a1 == a2:  # palavra do roteiro que o Whisper não ouviu: encaixa no fim da anterior
            ini = saida[-1]["endMs"] if saida else 0
            fim = palavras[a1]["startMs"] if a1 < len(palavras) else ini + 300 * (b2 - b1)
        else:
            ini, fim = palavras[a1]["startMs"], palavras[a2 - 1]["endMs"]
        passo = max(1, (fim - ini) // (b2 - b1))
        for k, texto in enumerate(certas[b1:b2]):
            if op == "equal":
                p = palavras[a1 + k]
                i, f, conf = p["startMs"], p["endMs"], p["confidence"]
            else:
                i, f, conf = ini + k * passo, ini + (k + 1) * passo, None
            saida.append({"text": texto, "startMs": i, "endMs": f, "timestampMs": (i + f) // 2, "confidence": conf,
                          "_fala": fala_de[b1 + k]})
    for n, p in enumerate(saida):
        p["text"] = p["text"] if n == 0 else " " + p["text"]
    return saida


def srt_tempo(seg: float) -> str:
    ms = int(round(seg * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("arquivo", type=Path)
    ap.add_argument("--saida", type=Path, help="caminho base sem extensão")
    ap.add_argument("--modelo", default="small")
    ap.add_argument("--idioma", default="pt", help="código do idioma ou 'auto'")
    ap.add_argument("--roteiro", type=Path, help="roteiro original, para corrigir o texto da legenda")
    args = ap.parse_args()

    from faster_whisper import WhisperModel

    base = args.saida or Path("saida/transcricoes") / args.arquivo.stem
    base.parent.mkdir(parents=True, exist_ok=True)

    modelo = WhisperModel(args.modelo, device="cpu", compute_type="int8")
    segmentos, info = modelo.transcribe(
        str(args.arquivo),
        language=None if args.idioma == "auto" else args.idioma,
        word_timestamps=True,
        vad_filter=True,
    )

    palavras, blocos_srt, texto = [], [], []
    for n, seg in enumerate(segmentos, 1):
        blocos_srt.append(f"{n}\n{srt_tempo(seg.start)} --> {srt_tempo(seg.end)}\n{seg.text.strip()}\n")
        texto.append(seg.text.strip())
        for w in seg.words or []:
            ini, fim = int(w.start * 1000), int(w.end * 1000)
            palavras.append({
                "text": w.word if palavras else w.word.lstrip(),
                "startMs": ini,
                "endMs": fim,
                "timestampMs": (ini + fim) // 2,
                "confidence": round(w.probability, 3),
            })

    falas: list[dict] = []
    if args.roteiro:
        palavras = alinhar_ao_roteiro(palavras, args.roteiro)
        # BASE.falas.json: início e fim de cada linha do roteiro, para cortar as cenas no tempo certo.
        for p in palavras:
            n = p.pop("_fala")
            if not falas or falas[-1]["fala"] != n:
                falas.append({"fala": n, "texto": "", "startMs": p["startMs"], "endMs": p["endMs"]})
            falas[-1]["texto"] = (falas[-1]["texto"] + p["text"]).strip()
            falas[-1]["endMs"] = p["endMs"]
        base.with_suffix(".falas.json").write_text(json.dumps(falas, ensure_ascii=False, indent=1), encoding="utf-8")
        # Refaz o SRT e o texto com as frases do roteiro (uma legenda por frase).
        blocos_srt, texto, frase = [], [], []
        for p in palavras:
            frase.append(p)
            if p["text"].rstrip().endswith((".", "?", "!")) or p is palavras[-1]:
                frase_txt = "".join(w["text"] for w in frase).strip()
                blocos_srt.append(f"{len(blocos_srt) + 1}\n{srt_tempo(frase[0]['startMs'] / 1000)} --> "
                                  f"{srt_tempo(frase[-1]['endMs'] / 1000)}\n{frase_txt}\n")
                texto.append(frase_txt)
                frase = []

    base.with_suffix(".json").write_text(json.dumps(palavras, ensure_ascii=False, indent=1), encoding="utf-8")
    base.with_suffix(".srt").write_text("\n".join(blocos_srt), encoding="utf-8")
    base.with_suffix(".txt").write_text("\n".join(texto) + "\n", encoding="utf-8")
    print(f"idioma: {info.language} ({info.language_probability:.0%}) · {len(palavras)} palavras")
    print(f"salvo: {base}.json / .srt / .txt")


if __name__ == "__main__":
    main()
