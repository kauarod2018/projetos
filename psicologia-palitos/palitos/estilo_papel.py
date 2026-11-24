"""Template visual do canal: paleta, fontes, papel, traço "à mão" e a personagem Cuca.

Toda cena importa daqui, então mudar a identidade do canal é mudar este arquivo.
"""
import json
from pathlib import Path

import numpy as np
from manim import *

RAIZ = Path(__file__).resolve().parent.parent

# ---------- paleta fixa ----------
TINTA = "#2E2A26"
PAPEL = "#F3EBDD"
MARCA_TEXTO = "#FFE45C"
VERMELHO_CANETA = "#D8433B"
EMOCOES = {
    "neutro": "#B9B3AA",
    "desconforto": "#8E6CC9",  # roxo: desconforto, culpa, vergonha
    "alivio": "#4CAF7A",       # verde: alívio, calma
    "triste": "#4A7BD0",       # azul: cansaço, desânimo
    "raiva": "#E0533D",        # vermelho: irritação
    "energia": "#F2B33D",      # mostarda: energia, confiança
}
FONTE_MAO = "Caveat"
FONTE_ROTULO = "Nunito ExtraLight"  # nome de família que o fontsource gera para a Nunito
TRACO = 6


def mao(txt, tam=72, cor=TINTA):
    """Texto em letra de mão."""
    return Text(txt, font=FONTE_MAO, font_size=tam, color=cor, weight=BOLD)


def rotulo(txt, tam=34, cor=TINTA):
    """Texto de rótulo (títulos de caixas, números)."""
    return Text(txt, font=FONTE_ROTULO, font_size=tam, color=cor, weight=HEAVY)


def tremer(mob, amp=0.018, semente=0):
    """Deixa o traço levemente tremido, como desenhado à mão."""
    rng = np.random.default_rng(semente)
    fases = rng.uniform(0, TAU, 6)

    def f(p):
        x, y, _ = p
        dx = amp * (np.sin(3.1 * y + fases[0]) + 0.6 * np.sin(7.3 * x + fases[1]) + 0.3 * np.sin(13.7 * y + fases[2]))
        dy = amp * (np.sin(2.9 * x + fases[3]) + 0.6 * np.sin(6.7 * y + fases[4]) + 0.3 * np.sin(12.1 * x + fases[5]))
        return np.array([x + dx, y + dy, 0])

    for sub in mob.family_members_with_points():
        if isinstance(sub, VMobject) and not isinstance(sub, (Text, SVGMobject)):
            sub.insert_n_curves(12)
            sub.apply_function(f)
    return mob


def marca_texto(alvo, cor=MARCA_TEXTO):
    """Faixa de marca-texto atrás de um texto (anime com GrowFromEdge(..., LEFT))."""
    faixa = Rectangle(width=alvo.width + 0.3, height=alvo.height * 0.75, fill_color=cor, fill_opacity=0.85, stroke_width=0)
    faixa.move_to(alvo).shift(DOWN * alvo.height * 0.08)
    faixa.rotate(-0.012)
    return faixa


def risco(alvo, cor=VERMELHO_CANETA):
    """Risco de caneta vermelha atravessando algo."""
    l, r = alvo.get_left() + LEFT * 0.25 + DOWN * 0.05, alvo.get_right() + RIGHT * 0.25 + UP * 0.1
    return tremer(Line(l, r, color=cor, stroke_width=10), amp=0.01, semente=7)


def caixa(txt, cor_borda=TINTA, largura=None, tam=34):
    t = rotulo(txt, tam)
    w = largura or t.width + 0.7
    r = RoundedRectangle(width=w, height=t.height + 0.55, corner_radius=0.18, color=cor_borda, stroke_width=TRACO,
                         fill_color=WHITE, fill_opacity=0.55)
    tremer(r, amp=0.012, semente=len(txt))
    return VGroup(r, t)


def fundo_papel(formato="horizontal"):
    caminho = RAIZ / "build" / f"papel_{formato}.png"
    img = ImageMobject(str(caminho))
    img.height = config.frame_height
    img.set_z_index(-100)
    return img


# ---------- personagem ----------
class Cuca(VGroup):
    """Bonequinha de palito com a cabeça colorida pela emoção.

    cuca.emocao("desconforto") devolve uma animação que muda a cor da cabeça e a boca.
    """

    BOCAS = {"neutro": 0.0, "desconforto": -0.35, "alivio": 0.45, "triste": -0.5, "raiva": -0.3, "energia": 0.6}

    def __init__(self, emocao="neutro", escala=1.0, **kw):
        super().__init__(**kw)
        self.estado = emocao
        r = 0.55
        self.cabeca = Circle(radius=r, color=TINTA, stroke_width=TRACO, fill_color=EMOCOES[emocao], fill_opacity=1)
        self.olhos = VGroup(Dot([-0.18, 0.08, 0], radius=0.055, color=TINTA), Dot([0.18, 0.08, 0], radius=0.055, color=TINTA))
        self.boca = self._boca(emocao)
        pesc = np.array([0, -r, 0])
        quadril = pesc + DOWN * 1.35
        self.tronco = Line(pesc, quadril, color=TINTA, stroke_width=TRACO)
        ombro = pesc + DOWN * 0.35
        self.braco_e = Line(ombro, ombro + np.array([-0.55, -0.75, 0]), color=TINTA, stroke_width=TRACO)
        self.braco_d = Line(ombro, ombro + np.array([0.55, -0.75, 0]), color=TINTA, stroke_width=TRACO)
        self.perna_e = Line(quadril, quadril + np.array([-0.4, -1.0, 0]), color=TINTA, stroke_width=TRACO)
        self.perna_d = Line(quadril, quadril + np.array([0.4, -1.0, 0]), color=TINTA, stroke_width=TRACO)
        self.corpo = VGroup(self.tronco, self.braco_e, self.braco_d, self.perna_e, self.perna_d)
        tremer(self.corpo, amp=0.012, semente=11)
        self.add(self.corpo, self.cabeca, self.olhos, self.boca)
        self.scale(escala)

    def _boca(self, emocao):
        curva = self.BOCAS[emocao]
        boca = ArcBetweenPoints([-0.2, -0.2, 0], [0.2, -0.2, 0], angle=curva * 2.2, color=TINTA, stroke_width=TRACO * 0.8)
        if abs(curva) < 0.01:
            boca = Line([-0.2, -0.2, 0], [0.2, -0.2, 0], color=TINTA, stroke_width=TRACO * 0.8)
        return boca

    def emocao(self, nome, run_time=0.5):
        """Animação: troca a cor da cabeça e a forma da boca."""
        self.estado = nome
        nova = self._boca(nome)
        nova.match_width(self.boca).move_to(self.cabeca.get_center() + (self.boca.get_center() - self.cabeca.get_center()))
        if self.BOCAS[nome] > 0:
            nova.shift(DOWN * 0.02 * self.cabeca.width)
        return AnimationGroup(self.cabeca.animate.set_fill(EMOCOES[nome]), Transform(self.boca, nova), run_time=run_time)


def cabecinha(emocao, raio=0.3):
    """Só a cabeça da Cuca, para ícones em diagramas."""
    c = Circle(radius=raio, color=TINTA, stroke_width=TRACO * 0.8, fill_color=EMOCOES[emocao], fill_opacity=1)
    olhos = VGroup(Dot(c.get_center() + [-0.1 * raio / 0.3, 0.05, 0], radius=0.035, color=TINTA),
                   Dot(c.get_center() + [0.1 * raio / 0.3, 0.05, 0], radius=0.035, color=TINTA))
    curva = Cuca.BOCAS[emocao]
    if abs(curva) < 0.01:
        boca = Line([-0.11, -0.11, 0], [0.11, -0.11, 0], color=TINTA, stroke_width=4)
    else:
        boca = ArcBetweenPoints([-0.11, -0.11, 0], [0.11, -0.11, 0], angle=curva * 2.2, color=TINTA, stroke_width=4)
    boca.scale(raio / 0.3, about_point=ORIGIN).shift(c.get_center())
    return VGroup(c, olhos, boca)


# ---------- linha do tempo ----------
class CenaNarrada(Scene):
    """Cena sincronizada com a narração: usa build/<nome>/timeline.json."""

    nome = ""

    def setup(self):
        self.tl = json.loads((RAIZ / "build" / self.nome / "timeline.json").read_text(encoding="utf-8"))
        self.eventos = []  # (tempo, tipo) para a trilha colocar efeitos sonoros
        self.add(fundo_papel(self.tl["formato"]))

    def agora(self):
        return self.renderer.time

    def ate(self, t):
        """Espera até o instante t (segundos desde o início do vídeo)."""
        resto = t - self.agora()
        if resto > 1 / 60:
            self.wait(resto)

    def fala(self, i, trecho=None):
        """Instante em que a fala i começa, ou em que um trecho dela é dito (estimado pela posição no texto)."""
        f = self.tl["falas"][i]
        if trecho is None:
            return f["inicio"]
        pos = f["texto"].lower().find(trecho.lower())
        assert pos >= 0, f"trecho não encontrado: {trecho}"
        return f["inicio"] + f["duracao"] * pos / len(f["texto"])

    def som(self, tipo):
        self.eventos.append((round(self.agora(), 3), tipo))

    def terminar(self):
        self.ate(self.tl["duracao"])
        (RAIZ / "build" / self.nome / "eventos.json").write_text(json.dumps(self.eventos), encoding="utf-8")
