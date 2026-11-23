"""Cenas de explicação física no Manim.

Uso: manim -r 1920,1080 --fps 30 --media_dir build/manim manim/cenas.py Curvatura QuedaLivre Orbita Lua
A duração de cada cena vem de public/duracoes.json (igual à da narração).
"""
import json
from pathlib import Path

import numpy as np
from manim import *

DUR = json.loads((Path(__file__).resolve().parent.parent / "public" / "duracoes.json").read_text())
config.background_color = "#0b1426"

AMARELO = "#FFD400"
CIANO = "#4FC3F7"
AZUL_TERRA = "#1f5fa8"
VERDE = "#3ddc84"
CINZA = "#8aa0bd"
TITULO = "Anton"
CORPO = "Montserrat Thin"


def rotulo(txt, tam=40, cor=WHITE, fonte=TITULO, peso=NORMAL):
    return Text(txt, font=fonte, font_size=tam, color=cor, weight=peso)


def corpo(txt, tam=30, cor=WHITE):
    return Text(txt, font=CORPO, font_size=tam, color=cor, weight=ULTRABOLD)


class CenaTempo(MovingCameraScene):
    """Cena que completa exatamente a duração pedida."""
    nome = ""

    def completar(self):
        alvo = DUR[self.nome]
        resta = alvo - self.renderer.time
        if resta > 0.04:
            self.wait(resta)


class Curvatura(CenaTempo):
    nome = "Curvatura"

    def construct(self):
        self.wait(0.5)
        R = 9.0
        centro = np.array([0, -R - 1.2, 0])
        arco = Arc(radius=R, start_angle=PI / 2 - 0.62, angle=1.24, arc_center=centro, color=CIANO, stroke_width=8)
        chao = AnnularSector(inner_radius=R - 3, outer_radius=R, angle=1.24, start_angle=PI / 2 - 0.62,
                             arc_center=centro, fill_color=AZUL_TERRA, fill_opacity=0.55, stroke_width=0)
        topo = centro + np.array([0, R, 0])
        ponto = Dot(topo, color=AMARELO, radius=0.12)
        self.play(FadeIn(chao), Create(arco), run_time=1.5)
        self.play(FadeIn(ponto, scale=2), run_time=0.4)
        # reta tangente de 8 km
        ang = 0.5
        fim_reta = topo + np.array([R * np.tan(ang) * 0.92, 0, 0])
        reta = DashedLine(topo, fim_reta, color=WHITE, stroke_width=5, dash_length=0.2)
        self.play(Create(reta), run_time=1.3)
        chave_h = BraceBetweenPoints(topo, fim_reta, direction=UP, color=WHITE)
        txt_h = rotulo("8 km", 54).next_to(chave_h, UP, buff=0.15)
        self.play(GrowFromCenter(chave_h), FadeIn(txt_h, shift=UP * 0.2), run_time=0.8)
        # queda até o chão curvo
        x = fim_reta[0]
        y_chao = centro[1] + np.sqrt(R ** 2 - x ** 2)
        base = np.array([x, y_chao, 0])
        queda = Arrow(fim_reta, base, buff=0, color=AMARELO, stroke_width=9, max_tip_length_to_length_ratio=0.25)
        self.wait(0.6)
        self.play(GrowArrow(queda), run_time=0.9)
        txt_v = rotulo("≈ 5 m", 64, AMARELO).next_to(queda, RIGHT, buff=0.3)
        self.play(FadeIn(txt_v, scale=1.4), Flash(base, color=AMARELO, line_length=0.35), run_time=0.8)
        formula = MathTex(r"h \approx \frac{d^2}{2R} = \frac{(8\,000\ \text{m})^2}{2 \cdot 6\,371\,000\ \text{m}} \approx 5\ \text{m}",
                          font_size=40).to_edge(DOWN, buff=0.45)
        caixa = SurroundingRectangle(formula, color=CINZA, buff=0.25, corner_radius=0.15, stroke_width=2,
                                     fill_color="#0b1426", fill_opacity=0.85)
        self.play(FadeIn(formula, shift=UP * 0.2), Create(caixa), run_time=1.0)
        aviso = corpo("escala exagerada", 22, CINZA).to_corner(UR, buff=0.5)
        self.add(aviso)
        self.completar()


class QuedaLivre(CenaTempo):
    nome = "QuedaLivre"

    def construct(self):
        topo_y, base_y, x_regua = 3.0, -3.0, -3.2
        m_por_unid = 5.0 / (topo_y - base_y)
        regua = Line([x_regua, topo_y, 0], [x_regua, base_y, 0], color=CINZA, stroke_width=4)
        marcas = VGroup()
        for m in range(6):
            y = topo_y - m / m_por_unid
            marcas.add(Line([x_regua - 0.2, y, 0], [x_regua + 0.2, y, 0], color=CINZA, stroke_width=4))
            marcas.add(rotulo(f"{m} m", 30, CINZA).next_to([x_regua - 0.2, y, 0], LEFT, buff=0.2))
        chao = Line([x_regua - 1.2, base_y - 0.25, 0], [x_regua + 2.6, base_y - 0.25, 0], color=WHITE, stroke_width=4)
        bola = Circle(radius=0.22, color=AMARELO, fill_opacity=1).move_to([x_regua + 1.0, topo_y, 0])
        relogio = Variable(0.0, MathTex("t", font_size=56), num_decimal_places=2).to_corner(UR, buff=0.7).shift(LEFT * 1.2)
        unidade = rotulo("s", 44).next_to(relogio, RIGHT, buff=0.15)
        self.play(Create(regua), FadeIn(marcas), Create(chao), FadeIn(bola, scale=0.5), run_time=0.9)
        self.play(FadeIn(relogio), FadeIn(unidade), run_time=0.3)
        self.wait(0.3)
        # queda em câmera lenta: 1 s de física em 2,6 s de vídeo, com "fantasmas" a cada 0,1 s
        g = 9.8
        tempo = ValueTracker(0)
        bola.add_updater(lambda b: b.move_to([x_regua + 1.0, topo_y - 0.5 * g * tempo.get_value() ** 2 / m_por_unid, 0]))
        relogio.tracker.add_updater(lambda v: v.set_value(tempo.get_value()))
        self.add(relogio.tracker)
        fantasmas = VGroup(*[Circle(radius=0.22, color=AMARELO, fill_opacity=0.25, stroke_opacity=0.4)
                             .move_to([x_regua + 1.0, topo_y - 0.5 * g * (k / 10) ** 2 / m_por_unid, 0]) for k in range(11)])
        for k in range(11):
            fantasmas[k].add_updater(lambda f, k=k: f.set_opacity(0.25 if tempo.get_value() >= k / 10 else 0))
        self.add(fantasmas)
        self.play(tempo.animate.set_value(1.0), run_time=2.6, rate_func=linear)
        bola.clear_updaters()
        y_final = topo_y - 4.9 / m_por_unid
        destaque = Line([x_regua, y_final, 0], [x_regua + 1.6, y_final, 0], color=AMARELO, stroke_width=5)
        f1 = MathTex(r"h = \tfrac{1}{2}\, g\, t^2", font_size=64).move_to([2.6, 1.0, 0])
        f2 = MathTex(r"h = \tfrac{1}{2} \cdot 9{,}8 \cdot 1^2", font_size=56).next_to(f1, DOWN, buff=0.5)
        f3 = MathTex(r"h \approx 4{,}9\ \text{m}", font_size=80, color=AMARELO).next_to(f2, DOWN, buff=0.55)
        self.play(Create(destaque), Write(f1), run_time=0.8)
        self.play(FadeIn(f2, shift=DOWN * 0.2), run_time=0.6)
        self.play(FadeIn(f3, scale=1.3), Circumscribe(f3, color=AMARELO), run_time=0.9)
        self.completar()


class Orbita(CenaTempo):
    nome = "Orbita"

    def construct(self):
        R = 2.3
        centro = np.array([0, -0.6, 0])
        terra = Circle(radius=R, color=CIANO, stroke_width=6, fill_color=AZUL_TERRA, fill_opacity=0.85).move_to(centro)
        montanha = Polygon(centro + [-0.35, R - 0.05, 0], centro + [0.35, R - 0.05, 0], centro + [0, R + 0.45, 0],
                           color="#6b5a48", fill_color="#6b5a48", fill_opacity=1, stroke_width=0)
        r0 = R + 0.45
        inicio = centro + np.array([0, r0, 0])
        bola = Dot(inicio, radius=0.11, color=AMARELO)
        self.wait(0.5)
        self.play(DrawBorderThenFill(terra), FadeIn(montanha), run_time=1.0)
        self.play(FadeIn(bola, scale=2), run_time=0.3)
        vel = Arrow(inicio, inicio + RIGHT * 2.2, buff=0, color=AMARELO, stroke_width=8)
        txt_v = rotulo("8 km/s", 50, AMARELO).next_to(vel, UP, buff=0.15)
        self.play(GrowArrow(vel), FadeIn(txt_v, shift=UP * 0.2), run_time=1.0)
        self.wait(0.9)
        # sem gravidade iria reto; com gravidade cai 5 m; o chão também cai 5 m
        ang = 0.42
        reto = inicio + np.array([r0 * np.tan(ang), 0, 0])
        curva = centro + r0 * np.array([np.sin(ang), np.cos(ang), 0])
        tracejada = DashedLine(inicio, reto, color=WHITE, stroke_width=4)
        cai = Arrow(reto, curva, buff=0, color=AMARELO, stroke_width=7, max_tip_length_to_length_ratio=0.3)
        txt_cai = rotulo("cai 5 m", 40, AMARELO).next_to(cai, RIGHT, buff=0.15)
        self.play(FadeOut(vel), FadeOut(txt_v), Create(tracejada), run_time=0.8)
        self.play(GrowArrow(cai), FadeIn(txt_cai), MoveAlongPath(bola, ArcBetweenPoints(inicio, curva, angle=-ang)), run_time=1.2)
        arco_chao = Arc(radius=R, start_angle=PI / 2, angle=-ang, arc_center=centro, color=VERDE, stroke_width=12)
        txt_chao = rotulo("o chão também cai 5 m", 40, VERDE).move_to(centro + [0, R - 0.9, 0])
        self.play(Create(arco_chao), FadeIn(txt_chao, shift=UP * 0.2), run_time=1.1)
        self.wait(1.0)
        self.play(FadeOut(VGroup(tracejada, cai, txt_cai, arco_chao, txt_chao)), run_time=0.5)
        # e segue caindo para sempre: uma volta completa
        theta = ValueTracker(ang)
        bola.add_updater(lambda b: b.move_to(centro + r0 * np.array([np.sin(theta.get_value()), np.cos(theta.get_value()), 0])))
        rastro = TracedPath(bola.get_center, stroke_color=AMARELO, stroke_width=5, stroke_opacity=[0, 1])
        self.add(rastro)
        self.play(theta.animate.set_value(ang + TAU), run_time=4.0, rate_func=linear)
        bola.clear_updaters()
        titulo = rotulo("ÓRBITA", 90, AMARELO).to_edge(UP, buff=0.35)
        formula = MathTex(r"v = \sqrt{g\,R} = \sqrt{9{,}8 \times 6\,371\,000} \approx 7{,}9\ \text{km/s}", font_size=46)
        formula.to_edge(DOWN, buff=0.35)
        fundo = BackgroundRectangle(formula, color="#0b1426", fill_opacity=0.85, buff=0.2)
        self.play(FadeIn(titulo, scale=1.3), FadeIn(fundo), Write(formula), run_time=1.4)
        self.completar()


class Lua(CenaTempo):
    nome = "Lua"

    def construct(self):
        terra = Circle(radius=0.45, color=CIANO, fill_color=AZUL_TERRA, fill_opacity=1, stroke_width=4).move_to(LEFT * 3.2)
        rot_terra = rotulo("TERRA", 30, CIANO).next_to(terra, DOWN, buff=0.2)
        raio_orb = 3.6
        orbita = DashedVMobject(Circle(radius=raio_orb, color=CINZA, stroke_width=3).move_to(terra), num_dashes=80)
        ang = ValueTracker(0.55)
        lua = Circle(radius=0.16, color="#d9d9d9", fill_color="#bdbdbd", fill_opacity=1, stroke_width=2)
        lua.add_updater(lambda m: m.move_to(terra.get_center() + raio_orb * np.array([np.cos(ang.get_value()), np.sin(ang.get_value()), 0])))
        self.wait(0.5)
        self.play(FadeIn(terra, scale=0.5), FadeIn(rot_terra), Create(orbita), FadeIn(lua), run_time=1.5)
        self.play(ang.animate.set_value(0.25), run_time=1.0, rate_func=linear)
        linha = always_redraw(lambda: DoubleArrow(terra.get_center(), lua.get_center(), buff=0.5, color=WHITE, stroke_width=3,
                                                  tip_length=0.2))
        dist = rotulo("384.400 km", 46).move_to(terra.get_center() + RIGHT * 1.8 + UP * 0.85)
        self.play(GrowFromCenter(linha), FadeIn(dist, shift=UP * 0.2), ang.animate.set_value(0.0), run_time=1.5, rate_func=linear)
        self.play(ang.animate.set_value(-0.3), run_time=2.4, rate_func=linear)
        # zoom na Lua
        lua.clear_updaters()
        self.play(FadeOut(linha), FadeOut(dist), self.camera.frame.animate.set(width=3.2).move_to(lua.get_center() + RIGHT * 0.5),
                  run_time=1.5)
        p = lua.get_center()
        tangente = np.array([-np.sin(-0.3), np.cos(-0.3), 0])
        para_terra = (terra.get_center() - p) / np.linalg.norm(terra.get_center() - p)
        seta_lado = Arrow(p, p + tangente * 0.9, buff=0.18, color=AMARELO, stroke_width=4, max_tip_length_to_length_ratio=0.2)
        txt_lado = rotulo("1 km para o lado", 16, AMARELO).next_to(seta_lado.get_end(), RIGHT, buff=0.08)
        self.play(GrowArrow(seta_lado), FadeIn(txt_lado), run_time=1.0)
        self.wait(1.0)
        seta_cai = Arrow(p, p + para_terra * 0.55, buff=0.18, color=VERDE, stroke_width=4, max_tip_length_to_length_ratio=0.25)
        txt_cai = rotulo("cai ≈ 1,4 mm", 16, VERDE).next_to(seta_cai.get_end(), DOWN, buff=0.06)
        self.play(GrowArrow(seta_cai), FadeIn(txt_cai), run_time=1.0)
        por_seg = rotulo("a cada segundo", 13, CINZA).next_to(p, UP, buff=0.32)
        self.play(FadeIn(por_seg), run_time=0.5)
        self.wait(1.2)
        self.play(FadeOut(VGroup(seta_lado, txt_lado, seta_cai, txt_cai, por_seg)),
                  self.camera.frame.animate.set(width=config.frame_width).move_to(ORIGIN), run_time=1.3)
        lua.add_updater(lambda m: m.move_to(terra.get_center() + raio_orb * np.array([np.cos(ang.get_value()), np.sin(ang.get_value()), 0])))
        resta = DUR[self.nome] - self.renderer.time
        if resta > 0.1:
            self.play(ang.animate.set_value(-0.3 - 0.4 * resta), run_time=resta, rate_func=linear)
        self.completar()
