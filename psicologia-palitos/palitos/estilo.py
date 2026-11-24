"""Template visual do canal (estilo "palitinho no fundo preto").

Fundo preto, boneco de palito branco com traço tosco, fotos recortadas, emojis 3D,
vídeos curtos no lugar de GIFs, textos brancos em negrito com destaques em amarelo/vermelho
e cortes secos. Toda cena importa daqui.
"""
import json
import subprocess
from pathlib import Path

import numpy as np
from manim import *

RAIZ = Path(__file__).resolve().parent.parent
ASSETS = RAIZ / "assets"
config.background_color = "#000000"

# ---------- paleta ----------
BRANCO = "#FFFFFF"
AMARELO = "#FFD60A"
VERMELHO = "#FF3B30"
VERDE = "#34C759"
CINZA = "#8E8E93"
EMOCOES = {  # cor da cabeça da Cuca (a marca do canal)
    "neutro": None, "tedio": "#9A9A9A", "desconforto": "#8E6CC9", "alivio": "#4CAF7A",
    "triste": "#4A7BD0", "raiva": "#E0533D", "energia": "#F2B33D",
}
CABECA_COLORIDA = False  # cabeça só com contorno branco (True = colorida pela emoção)
FONTE = "Liberation Sans"
TRACO = 9


# ---------- texto ----------
def txt(s, tam=60, cor=BRANCO, destaque=None, cor_destaque=AMARELO):
    """Texto branco em negrito. `destaque` = palavra(s) pintadas em amarelo (ou cor_destaque)."""
    t2c = {}
    if destaque:
        for d in ([destaque] if isinstance(destaque, str) else destaque):
            t2c[d] = cor_destaque
    return Text(s, font=FONTE, font_size=tam, color=cor, weight=BOLD, t2c=t2c)


def dentro(m, margem=0.4):
    """Garante que algo caiba na tela: reduz se for largo demais e empurra para dentro das bordas."""
    W, H = config.frame_width / 2 - margem, config.frame_height / 2 - margem
    if m.width > 2 * W:
        m.scale_to_fit_width(2 * W)
    if m.height > 2 * H:
        m.scale_to_fit_height(2 * H)
    dx = min(0, W - m.get_right()[0]) + max(0, -W - m.get_left()[0])
    dy = min(0, H - m.get_top()[1]) + max(0, -H - m.get_bottom()[1])
    m.shift([dx, dy, 0])
    return m


def rabisco(alvo, cor=AMARELO, semente=0):
    """Sublinhado rabiscado à mão embaixo de um texto."""
    rng = np.random.default_rng(semente)
    a, b = alvo.get_corner(DL) + DOWN * 0.18 + LEFT * 0.1, alvo.get_corner(DR) + DOWN * 0.12 + RIGHT * 0.15
    fases = rng.uniform(0, TAU, 3)

    def f(u):
        p = a + (b - a) * u
        return p + UP * (0.05 * np.sin(9 * u + fases[0]) + 0.035 * np.sin(23 * u + fases[1]) - 0.06 * u)

    return ParametricFunction(f, t_range=[0, 1], color=cor, stroke_width=TRACO)


def tremer(mob, amp=0.03, semente=0):
    """Traço tosco, como desenhado com o mouse."""
    rng = np.random.default_rng(semente)
    fs = rng.uniform(0, TAU, 4)

    def f(p):
        x, y, _ = p
        return np.array([x + amp * (np.sin(4.1 * y + fs[0]) + 0.5 * np.sin(11.3 * x + fs[1])),
                         y + amp * (np.sin(3.7 * x + fs[2]) + 0.5 * np.sin(9.9 * y + fs[3])), 0])

    for sub in mob.family_members_with_points():
        if isinstance(sub, VMobject) and not isinstance(sub, Text):
            sub.insert_n_curves(10)
            sub.apply_function(f)
    return mob


# ---------- imagens, emojis e "GIFs" ----------
def imagem(nome, altura=3.0):
    """Foto recortada (PNG com transparência) de assets/img/."""
    m = ImageMobject(str(ASSETS / "img" / f"{nome}.png"))
    m.height = altura
    return m


def emoji(nome, altura=1.3):
    """Emoji 3D (Microsoft Fluent, licença MIT) de assets/emoji/."""
    m = ImageMobject(str(ASSETS / "emoji" / f"{nome}.png"))
    m.height = altura
    return m


def vivo(m, amp=0.08, vel=5.0, pulo=0.06, fase=0.0):
    """Dá vida a um adesivo: balança e quica, como um GIF."""
    m._t = fase
    m._ang = 0.0
    m._base = m.get_center().copy()

    def upd(mob, dt):
        mob._t += dt
        ang = amp * np.sin(vel * mob._t)
        mob.rotate(ang - mob._ang)
        mob._ang = ang
        mob.move_to(mob._base + UP * pulo * abs(np.sin(vel * 0.5 * mob._t)))

    m.add_updater(upd)
    return m


class ClipeVideo(ImageMobject):
    """Trecho de vídeo tocando dentro da cena (faz o papel de GIF)."""

    def __init__(self, nome, largura=4.0, inicio=0.0, dur=3.0, px=480, **kw):
        cam = ASSETS / "clipes" / f"{nome}.mp4"
        info = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
                               "-of", "csv=p=0", str(cam)], capture_output=True, text=True, check=True).stdout.strip().split(",")
        w0, h0 = int(info[0]), int(info[1])
        h = int(px * h0 / w0) // 2 * 2
        raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(inicio), "-t", str(dur), "-i", str(cam),
                              "-vf", f"fps=30,scale={px}:{h}", "-f", "rawvideo", "-pix_fmt", "rgba", "-"],
                             capture_output=True, check=True).stdout
        self.quadros = np.frombuffer(raw, np.uint8).reshape(-1, h, px, 4)
        super().__init__(self.quadros[0].copy(), **kw)
        self.width = largura
        self._t = 0.0
        self.add_updater(self._avancar)

    def _avancar(self, m, dt):
        m._t += dt
        i = int(m._t * 30) % len(m.quadros)  # repete em loop, como GIF
        m.pixel_array = m.quadros[i].copy()


def moldura(m, cor=BRANCO, buff=0.06):
    r = Rectangle(width=m.width + 2 * buff, height=m.height + 2 * buff, color=cor, stroke_width=6).move_to(m)
    return r


# ---------- animações curtas ----------
def surgir(m, t=0.28):
    """Entrada com "pop" (cresce passando um pouco do tamanho)."""
    return FadeIn(m, scale=0.4, rate_func=rate_functions.ease_out_back, run_time=t)


def carimbo(m, t=0.18):
    """Entrada de carimbo: vem grande e bate no lugar."""
    return FadeIn(m, scale=2.4, rate_func=rate_functions.ease_in_cubic, run_time=t)


# ---------- personagem ----------
class Cuca(VGroup):
    """Boneco de palito branco, traço tosco, cabeça colorida pela emoção (se CABECA_COLORIDA)."""

    def __init__(self, emocao="neutro", escala=1.0, **kw):
        super().__init__(**kw)
        r = 0.62
        cor = EMOCOES.get(emocao) if CABECA_COLORIDA else None
        self.cabeca = Circle(radius=r, color=BRANCO, stroke_width=TRACO, fill_color=cor or "#000000", fill_opacity=1)
        tremer(self.cabeca, amp=0.02, semente=1)
        self.rosto = self._rosto(emocao)
        pesc = np.array([0, -r, 0])
        quadril = pesc + DOWN * 1.45
        ombro = pesc + DOWN * 0.38
        self.tronco = Line(pesc, quadril)
        self.braco_e = Line(ombro, ombro + np.array([-0.6, -0.8, 0]))
        self.braco_d = Line(ombro, ombro + np.array([0.6, -0.8, 0]))
        self.perna_e = Line(quadril, quadril + np.array([-0.42, -1.1, 0]))
        self.perna_d = Line(quadril, quadril + np.array([0.42, -1.1, 0]))
        self.corpo = VGroup(self.tronco, self.braco_e, self.braco_d, self.perna_e, self.perna_d).set_stroke(BRANCO, TRACO)
        tremer(self.corpo, amp=0.025, semente=4)
        self.add(self.corpo, self.cabeca, self.rosto)
        self.scale(escala)

    def _rosto(self, e):
        tinta = BRANCO if not (CABECA_COLORIDA and EMOCOES.get(e)) else "#111111"
        g = VGroup()
        if e == "alivio":  # olhos fechados de satisfação ^ ^
            for x in (-0.22, 0.22):
                g.add(ArcBetweenPoints([x - 0.1, 0.05, 0], [x + 0.1, 0.05, 0], angle=-PI * 0.8))
            g.add(ArcBetweenPoints([-0.25, -0.2, 0], [0.25, -0.2, 0], angle=PI * 0.7))
        elif e == "tedio":  # pálpebras caídas
            for x in (-0.22, 0.22):
                g.add(Line([x - 0.11, 0.08, 0], [x + 0.11, 0.08, 0]))
                g.add(Dot([x, 0.02, 0], radius=0.045))
            g.add(Line([-0.2, -0.25, 0], [0.2, -0.25, 0]))
        elif e == "desconforto":
            g.add(Dot([-0.22, 0.05, 0], radius=0.06), Dot([0.22, 0.05, 0], radius=0.06))
            g.add(Line([-0.34, 0.27, 0], [-0.12, 0.2, 0]), Line([0.12, 0.2, 0], [0.34, 0.27, 0]))
            ond = ParametricFunction(lambda u: np.array([-0.25 + 0.5 * u, -0.25 + 0.04 * np.sin(4 * PI * u), 0]), t_range=[0, 1])
            g.add(ond)
        elif e == "raiva":
            g.add(Dot([-0.22, 0.02, 0], radius=0.06), Dot([0.22, 0.02, 0], radius=0.06))
            g.add(Line([-0.36, 0.25, 0], [-0.1, 0.13, 0]), Line([0.1, 0.13, 0], [0.36, 0.25, 0]))
            g.add(ArcBetweenPoints([-0.2, -0.3, 0], [0.2, -0.3, 0], angle=-PI * 0.6))
        elif e == "triste":
            g.add(Dot([-0.22, 0.03, 0], radius=0.06), Dot([0.22, 0.03, 0], radius=0.06))
            g.add(ArcBetweenPoints([-0.22, -0.32, 0], [0.22, -0.32, 0], angle=-PI * 0.7))
        elif e == "energia":
            g.add(Dot([-0.22, 0.08, 0], radius=0.07), Dot([0.22, 0.08, 0], radius=0.07))
            boca = ArcBetweenPoints([-0.3, -0.15, 0], [0.3, -0.15, 0], angle=PI * 0.9)
            g.add(VGroup(boca, Line([-0.3, -0.15, 0], [0.3, -0.15, 0])))
        else:  # neutro: olhar meio desconfiado, sorriso de lado
            g.add(Line([-0.32, 0.08, 0], [-0.12, 0.08, 0]), Dot([-0.2, 0.0, 0], radius=0.05))
            g.add(Line([0.12, 0.1, 0], [0.32, 0.06, 0]), Dot([0.22, 0.0, 0], radius=0.05))
            g.add(ArcBetweenPoints([-0.15, -0.25, 0], [0.25, -0.18, 0], angle=PI * 0.35))
        for sub in g.family_members_with_points():
            if isinstance(sub, Dot):
                sub.set_fill(tinta, 1).set_stroke(width=0)
            else:
                sub.set_stroke(tinta, TRACO * 0.7).set_fill(opacity=0)
        return g

    def emocao(self, nome, run_time=0.25):
        novo = self._rosto(nome).scale(self.cabeca.width / 1.24).move_to(self.cabeca.get_center())
        novo.shift((self.rosto.get_center() - self.cabeca.get_center()) * 0)
        cor = (EMOCOES.get(nome) if CABECA_COLORIDA else None) or "#000000"
        return AnimationGroup(self.cabeca.animate.set_fill(cor), Transform(self.rosto, novo), run_time=run_time)


# ---------- linha do tempo ----------
class CenaNarrada(Scene):
    """Cena sincronizada com a narração (build/<nome>/timeline.json)."""

    nome = ""

    def setup(self):
        self.tl = json.loads((RAIZ / "build" / self.nome / "timeline.json").read_text(encoding="utf-8"))
        self.eventos = []

    def agora(self):
        return self.renderer.time

    def ate(self, t):
        resto = t - self.agora()
        if resto > 1 / 60:
            self.wait(resto)

    def fala(self, i, trecho=None):
        f = self.tl["falas"][i]
        if trecho is None:
            return f["inicio"]
        pos = f["texto"].lower().find(trecho.lower())
        assert pos >= 0, f"trecho não encontrado: {trecho}"
        return f["inicio"] + f["duracao"] * pos / len(f["texto"])

    def som(self, tipo):
        self.eventos.append((round(self.agora(), 3), tipo))

    def corte(self, som=True):
        """Corte seco: limpa a tela de uma vez."""
        for m in list(self.mobjects):
            m.clear_updaters()
        self.clear()
        if som:
            self.som("corte")

    def terminar(self):
        self.ate(self.tl["duracao"])
        (RAIZ / "build" / self.nome / "eventos.json").write_text(json.dumps(self.eventos), encoding="utf-8")
