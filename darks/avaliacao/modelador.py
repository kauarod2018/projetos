"""Avaliação e modelagem.

Antes de criar qualquer vídeo, o sistema estuda o que está funcionando no nicho:
busca vídeos e canais em alta, separa os que performam acima do normal, lê as
transcrições e pede ao Gemini um "modelo de criação" (padrões de título, gancho,
estrutura, ritmo, narração, visual, thumbnail...).

Cada nova avaliação REFINA o modelo anterior (não começa do zero), e lições
registradas com `aprender` também entram no modelo. Assim a qualidade melhora
a cada ciclo. Os modelos ficam em modelos/<tipo>/<nicho>.json (versionados).
"""
from __future__ import annotations

import json
import re
import unicodedata
from datetime import datetime, timezone

from ..config import PASTA_MODELOS
from ..db import salvar_busca
from ..busca import youtube, metricas
from ..ia import gemini


def slug(texto: str) -> str:
    t = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-") or "geral"


def caminho_modelo(tipo: str, nicho: str):
    return PASTA_MODELOS / tipo / f"{slug(nicho)}.json"


def carregar_modelo(tipo: str, nicho: str) -> dict | None:
    p = caminho_modelo(tipo, nicho)
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else None


def salvar_modelo(m: dict) -> None:
    p = caminho_modelo(m["tipo"], m["nicho"])
    p.parent.mkdir(parents=True, exist_ok=True)
    if p.exists():  # guarda a versão anterior
        hist = p.parent / "historico"
        hist.mkdir(exist_ok=True)
        antigo = json.loads(p.read_text(encoding="utf-8"))
        (hist / f"{p.stem}.v{antigo.get('versao', 0)}.json").write_text(
            json.dumps(antigo, ensure_ascii=False, indent=2), encoding="utf-8")
    p.write_text(json.dumps(m, ensure_ascii=False, indent=2), encoding="utf-8")


def listar_modelos() -> list[dict]:
    out = []
    for p in sorted(PASTA_MODELOS.glob("*/*.json")):
        try:
            m = json.loads(p.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        out.append({"tipo": m.get("tipo"), "nicho": m.get("nicho"), "versao": m.get("versao"),
                    "atualizado": m.get("atualizado"), "referencias": len(m.get("referencias", [])),
                    "licoes": len(m.get("licoes", [])), "arquivo": str(p.relative_to(PASTA_MODELOS))})
    return out


def idade_dias(m: dict) -> float:
    return metricas.dias_desde(m.get("atualizado"))


ESQUEMA_MODELO = """{
  "publico_alvo": "quem assiste e por quê",
  "promessa_central": "o que o espectador ganha ao assistir",
  "titulos": {"padroes": ["estruturas que se repetem, com [variáveis]"], "gatilhos": ["curiosidade, medo, ..."], "tamanho_ideal_caracteres": 60, "exemplos_bons": ["..."]},
  "gancho": {"duracao_s": 15, "tecnicas": ["..."], "exemplos": ["frases de abertura no estilo do nicho"]},
  "estrutura": [{"parte": "nome", "objetivo": "...", "proporcao_pct": 10}],
  "retencao": ["técnicas usadas para segurar o espectador (loops abertos, perguntas, contagem...)"],
  "narracao": {"pessoa": "1a/2a/3a", "tom": "...", "velocidade": "lenta/média/rápida", "vocabulario": "...", "frases_tipicas": ["..."]},
  "visual": {"estilo": "...", "tipos_de_cena": ["..."], "trocas_de_cena_por_minuto": 12, "texto_na_tela": "...", "legenda": "estilo da legenda"},
  "thumbnail": {"elementos": ["..."], "cores": ["..."], "texto": "padrão do texto (poucas palavras)"},
  "duracao_ideal_s": 600,
  "temas_que_funcionam": ["temas/ângulos com mais views nas referências"],
  "lacunas_oportunidades": ["temas pedidos nos comentários/títulos que ninguém fez bem"],
  "evitar": ["o que derruba a qualidade ou pode gerar problema de direitos/monetização"],
  "checklist_qualidade": ["itens verificáveis que todo vídeo deste modelo deve cumprir"],
  "resumo_mudancas": "o que mudou em relação à versão anterior do modelo (ou 'primeira versão')"
}"""


def coletar_referencias(nicho: str, formato: str, termos: list[str] | None = None,
                        canais: list[str] | None = None, dias: int = 120, limite: int = 15,
                        log=print) -> list[dict]:
    """Busca vídeos do nicho e devolve os melhores (outliers) no formato pedido."""
    termos = termos or [nicho]
    vistos: dict[str, dict] = {}
    for termo in termos:
        log(f"  buscando: {termo!r}")
        for ordem in ("viewCount", "relevance"):
            try:
                vids = youtube.buscar(termo, limite=50, ordem=ordem, periodo_dias=dias,
                                      duracao="short" if formato == "short" else "any")
            except youtube.ErroBusca as e:
                log(f"  ! {e}")
                continue
            salvar_busca(termo, "avaliacao", {"ordem": ordem, "dias": dias}, vids)
            for v in vids:
                vistos[v["id"]] = v
    for c in canais or []:
        log(f"  analisando canal: {c}")
        try:
            for v in youtube.canal(c, limite=30)["videos"]:
                vistos[v["id"]] = v
        except Exception as e:  # canal inválido não deve parar a avaliação
            log(f"  ! canal {c}: {e}")
    candidatos = [v for v in vistos.values() if v.get("formato") in (formato, "?")]
    if len(candidatos) < 5:  # nicho pequeno: aceita qualquer formato
        candidatos = list(vistos.values())
    candidatos.sort(key=lambda v: v.get("pontuacao") or 0, reverse=True)
    return candidatos[:limite]


def avaliar(tipo: str, nicho: str, formato: str, foco: str, termos: list[str] | None = None,
            canais: list[str] | None = None, dias: int = 120, refs: int = 15,
            transcricoes: int = 5, log=print) -> dict:
    """Roda uma avaliação completa e salva o modelo refinado."""
    log(f"[1/3] Coletando referências do nicho '{nicho}' ({formato})...")
    referencias = coletar_referencias(nicho, formato, termos, canais, dias, refs, log)
    if not referencias:
        raise RuntimeError("Nenhum vídeo encontrado. Tente outros termos (--termos) ou canais (--canais).")

    log(f"[2/3] Lendo transcrições dos {min(transcricoes, len(referencias))} melhores...")
    for v in referencias[:transcricoes]:
        try:
            v["transcricao"] = youtube.transcricao(v["id"], max_chars=6000)
            log(f"  ok: {v['titulo'][:60]} ({len(v['transcricao'])} caracteres)")
        except Exception as e:
            v["transcricao"] = ""
            log(f"  - sem transcrição: {v['titulo'][:60]} ({e.__class__.__name__})")

    anterior = carregar_modelo(tipo, nicho)
    dados = [{
        "titulo": v["titulo"], "canal": v["canal"], "views": v["views"], "inscritos_canal": v.get("inscritos"),
        "outlier": v.get("outlier") or v.get("outlier_canal"), "views_dia": v.get("views_dia"),
        "duracao_s": v.get("duracao_s"), "tags": v.get("tags", [])[:10],
        "descricao": (v.get("descricao") or "")[:300],
        **({"transcricao": v["transcricao"]} if v.get("transcricao") else {}),
    } for v in referencias]

    log("[3/3] Gemini analisando e montando o modelo de criação...")
    prompt = f"""Você é um estrategista de canais dark do YouTube (canais sem rosto) e analista de retenção.

TIPO DE VÍDEO: {tipo} — {foco}
NICHO: {nicho}
FORMATO: {formato}

Abaixo estão os vídeos que MAIS performaram recentemente nesse nicho (ordenados por desempenho
acima do tamanho do canal). Estude títulos, transcrições, duração e números e extraia um MODELO
DE CRIAÇÃO concreto e reutilizável, para produzir vídeos de qualidade igual ou superior.
Seja específico (exemplos reais, números), nada genérico.

REFERÊNCIAS:
{json.dumps(dados, ensure_ascii=False)}

MODELO ANTERIOR (refine-o: mantenha o que as novas referências confirmam, corrija o que mudou):
{json.dumps(anterior.get("modelo"), ensure_ascii=False) if anterior else "nenhum (primeira avaliação)"}

LIÇÕES APRENDIDAS COM VÍDEOS JÁ PRODUZIDOS (têm prioridade):
{json.dumps(anterior.get("licoes", []), ensure_ascii=False) if anterior else "nenhuma"}

Responda SOMENTE com JSON neste formato, em português do Brasil:
{ESQUEMA_MODELO}"""
    modelo = gemini.gerar_json(prompt, temperatura=0.4)

    versao = (anterior or {}).get("versao", 0) + 1
    agora = datetime.now(timezone.utc).isoformat(timespec="seconds")
    novo = {
        "tipo": tipo, "nicho": nicho, "formato": formato, "versao": versao, "atualizado": agora,
        "modelo": modelo,
        "licoes": (anterior or {}).get("licoes", []),
        "dados": metricas.resumo(referencias),
        "referencias": [{k: v.get(k) for k in ("id", "titulo", "canal", "views", "outlier", "views_dia", "duracao_s", "url")}
                        for v in referencias],
        "historico": (anterior or {}).get("historico", []) + [{
            "versao": versao, "data": agora, "termos": termos or [nicho], "canais": canais or [],
            "resumo": modelo.get("resumo_mudancas", "") if isinstance(modelo, dict) else "",
        }],
    }
    salvar_modelo(novo)
    log(f"Modelo salvo: modelos/{tipo}/{slug(nicho)}.json (versão {versao})")
    return novo


def aprender(tipo: str, nicho: str, nota: str = "", video_id: str | None = None) -> dict:
    """Registra uma lição (sua observação e/ou números de um vídeo seu publicado)."""
    m = carregar_modelo(tipo, nicho)
    if not m:
        raise RuntimeError(f"Ainda não existe modelo para {tipo}/{nicho}. Rode 'avaliar' primeiro.")
    licao = {"data": datetime.now(timezone.utc).isoformat(timespec="seconds"), "nota": nota}
    if video_id:
        try:
            vids = youtube.detalhes([video_id]) if youtube.usando_api() else []
            if vids:
                v = metricas.calcular(vids[0])
                licao["video"] = {k: v.get(k) for k in ("id", "titulo", "views", "views_dia", "outlier", "engajamento", "idade_dias")}
                med = (m.get("dados") or {}).get("mediana_views")
                if med:
                    licao["video"]["vs_mediana_referencias"] = round((v.get("views") or 0) / med, 2)
        except Exception as e:
            licao["erro_video"] = str(e)
    m.setdefault("licoes", []).append(licao)
    salvar_modelo({**m})
    return licao


def ideias(tipo: str, nicho: str, quantidade: int = 10) -> list[dict]:
    m = carregar_modelo(tipo, nicho)
    if not m:
        raise RuntimeError(f"Ainda não existe modelo para {tipo}/{nicho}. Rode 'avaliar' primeiro.")
    prompt = f"""Com base neste modelo de criação de um canal dark do nicho "{nicho}" (tipo {tipo}),
sugira {quantidade} ideias de vídeos NOVAS (não repita os títulos das referências), com alto potencial.

MODELO: {json.dumps(m["modelo"], ensure_ascii=False)}
REFERÊNCIAS (já existem): {json.dumps([r["titulo"] for r in m["referencias"]], ensure_ascii=False)}
LIÇÕES: {json.dumps(m.get("licoes", []), ensure_ascii=False)}

Responda com JSON: [{{"tema": "...", "titulo": "...", "por_que_vai_funcionar": "...", "potencial_1a10": 8}}]"""
    res = gemini.gerar_json(prompt, temperatura=0.9)
    return res if isinstance(res, list) else res.get("ideias", [])
