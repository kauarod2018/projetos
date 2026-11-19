"""Linha de comando do Darks.  Uso:  python -m darks <comando> --help"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


def _lista(txt: str | None) -> list[str] | None:
    return [x.strip() for x in txt.split(",") if x.strip()] if txt else None


def cmd_tipos(a):
    from .criacao.tipos import TIPOS

    for nome, c in TIPOS.items():
        print(f"{nome:10} {c.largura}x{c.altura}  {c.descricao}")


def cmd_painel(a):
    import uvicorn

    print(f"Painel em http://localhost:{a.porta}")
    uvicorn.run("darks.painel.app:app", host=a.host, port=a.porta, reload=False)


def cmd_buscar(a):
    from .busca import youtube
    from .db import salvar_busca

    vids = youtube.buscar(a.termo, limite=a.limite, ordem=a.ordem, periodo_dias=a.dias, duracao=a.duracao)
    salvar_busca(a.termo, "busca", vars(a) | {"func": None}, vids)
    vids.sort(key=lambda v: v.get("pontuacao") or 0, reverse=True)
    for v in vids:
        print(f"{v['pontuacao'] or 0:>7}  {v['views']:>11,}  {str(v.get('outlier') or '-'):>6}x  "
              f"{v['formato']:5}  {v['titulo'][:70]}  [{v['canal']}]")


def cmd_avaliar(a):
    from .avaliacao import modelador
    from .criacao.tipos import obter

    T = obter(a.tipo)
    m = modelador.avaliar(a.tipo, a.nicho, T.formato, T.foco_avaliacao, termos=_lista(a.termos),
                          canais=_lista(a.canais), dias=a.dias, refs=a.refs, transcricoes=a.transcricoes)
    mod = m["modelo"]
    print("\nResumo do modelo:")
    print("  Promessa:", mod.get("promessa_central"))
    print("  Duração ideal:", mod.get("duracao_ideal_s"), "s")
    print("  Padrões de título:", *mod.get("titulos", {}).get("padroes", [])[:3], sep="\n    - ")
    print("  Mudanças:", mod.get("resumo_mudancas"))
    print("\nPróximo passo:  python -m darks ideias --tipo", a.tipo, f'--nicho "{a.nicho}"')


def cmd_modelos(a):
    from .avaliacao import modelador

    ms = modelador.listar_modelos()
    if not ms:
        print("Nenhum modelo ainda. Rode: python -m darks avaliar --tipo narrado --nicho \"seu nicho\"")
    for m in ms:
        print(f"{m['tipo']:10} {m['nicho']:30} v{m['versao']}  {m['atualizado']}  "
              f"{m['referencias']} refs, {m['licoes']} lições")


def cmd_ideias(a):
    from .avaliacao import modelador

    for i, ideia in enumerate(modelador.ideias(a.tipo, a.nicho, a.n), 1):
        print(f"{i:2}. [{ideia.get('potencial_1a10', '?')}/10] {ideia.get('titulo')}\n"
              f"    tema: {ideia.get('tema')}\n    por quê: {ideia.get('por_que_vai_funcionar')}\n")


def cmd_criar(a):
    from .criacao.tipos import obter

    g = obter(a.tipo)(a.nicho, voz_nome=a.voz)
    g.manter_temporarios = a.manter_temp
    g.criar(tema=a.tema, roteiro_arquivo=Path(a.roteiro) if a.roteiro else None,
            duracao_s=a.duracao, so_roteiro=a.so_roteiro, sem_modelo=a.sem_modelo)


def cmd_aprender(a):
    from .avaliacao import modelador

    licao = modelador.aprender(a.tipo, a.nicho, a.nota or "", a.video)
    print("Lição registrada:", json.dumps(licao, ensure_ascii=False, indent=2))
    print("Ela será usada nos próximos roteiros e na próxima avaliação.")


def main(argv=None):
    p = argparse.ArgumentParser(prog="python -m darks", description="Canais dark: busca, avaliação e criação de vídeos")
    sub = p.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("painel", help="abre o painel web de busca")
    s.add_argument("--porta", type=int, default=8000)
    s.add_argument("--host", default="127.0.0.1")
    s.set_defaults(func=cmd_painel)

    s = sub.add_parser("tipos", help="lista os tipos de vídeo disponíveis")
    s.set_defaults(func=cmd_tipos)

    s = sub.add_parser("buscar", help="busca rápida no YouTube pelo terminal")
    s.add_argument("termo")
    s.add_argument("--limite", type=int, default=25)
    s.add_argument("--ordem", default="viewCount", choices=["relevance", "viewCount", "date"])
    s.add_argument("--dias", type=int, help="só vídeos publicados nos últimos N dias")
    s.add_argument("--duracao", default="any", choices=["any", "short", "medium", "long"])
    s.set_defaults(func=cmd_buscar)

    s = sub.add_parser("avaliar", help="estuda os vídeos em alta do nicho e cria/refina o modelo")
    s.add_argument("--tipo", required=True)
    s.add_argument("--nicho", required=True, help='ex.: "mistérios não resolvidos"')
    s.add_argument("--termos", help="termos de busca separados por vírgula (padrão: o nicho)")
    s.add_argument("--canais", help="canais de referência separados por vírgula (@handle, URL ou ID)")
    s.add_argument("--dias", type=int, default=120)
    s.add_argument("--refs", type=int, default=15, help="quantos vídeos de referência usar")
    s.add_argument("--transcricoes", type=int, default=5, help="quantas transcrições ler")
    s.set_defaults(func=cmd_avaliar)

    s = sub.add_parser("modelos", help="lista os modelos de criação aprendidos")
    s.set_defaults(func=cmd_modelos)

    s = sub.add_parser("ideias", help="sugere temas de vídeo com base no modelo")
    s.add_argument("--tipo", required=True)
    s.add_argument("--nicho", required=True)
    s.add_argument("-n", type=int, default=10)
    s.set_defaults(func=cmd_ideias)

    s = sub.add_parser("criar", help="cria um vídeo completo")
    s.add_argument("--tipo", required=True)
    s.add_argument("--nicho", required=True)
    s.add_argument("--tema", help="assunto do vídeo")
    s.add_argument("--roteiro", help="usar um roteiro.json já pronto/editado")
    s.add_argument("--duracao", type=int, help="duração alvo em segundos")
    s.add_argument("--voz", help="voz do Edge-TTS (ex.: pt-BR-FranciscaNeural)")
    s.add_argument("--so-roteiro", action="store_true", help="só gera o roteiro para você revisar")
    s.add_argument("--sem-modelo", action="store_true", help="pula a exigência de avaliação (não recomendado)")
    s.add_argument("--manter-temp", action="store_true", help="não apaga arquivos temporários")
    s.set_defaults(func=cmd_criar)

    s = sub.add_parser("aprender", help="registra uma lição (sua observação e/ou números de um vídeo publicado)")
    s.add_argument("--tipo", required=True)
    s.add_argument("--nicho", required=True)
    s.add_argument("--nota", help='ex.: "gancho muito longo, retenção caiu aos 20s"')
    s.add_argument("--video", help="ID de um vídeo seu já publicado (puxa os números)")
    s.set_defaults(func=cmd_aprender)

    a = p.parse_args(argv)
    try:
        a.func(a)
    except KeyboardInterrupt:
        sys.exit(130)
    except Exception as e:
        print(f"\nErro: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
