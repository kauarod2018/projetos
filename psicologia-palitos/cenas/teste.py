"""Vídeo de teste (≈30 s): procrastinação, ciclo tarefa → desconforto → fuga → alívio."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from palitos.estilo_papel import *  # noqa: E402,F403


def notebook():
    base = Polygon([-1.0, 0, 0], [1.0, 0, 0], [0.8, 0.18, 0], [-0.8, 0.18, 0], color=TINTA, stroke_width=TRACO,
                   fill_color="#d9d2c5", fill_opacity=1)
    tela = Rectangle(width=1.5, height=1.05, color=TINTA, stroke_width=TRACO, fill_color="#efe9de", fill_opacity=1)
    tela.next_to(base, UP, buff=0)
    linhas = VGroup(*[Line(LEFT * 0.5, RIGHT * (0.5 - 0.25 * (k % 2)), color="#9a948a", stroke_width=4) for k in range(4)])
    linhas.arrange(DOWN, buff=0.14, aligned_edge=LEFT).move_to(tela)
    g = VGroup(base, tela)
    tremer(g, amp=0.01, semente=3)
    return g, tela, linhas


def celular():
    corpo = RoundedRectangle(width=0.36, height=0.62, corner_radius=0.07, color=TINTA, stroke_width=5,
                             fill_color="#3b3733", fill_opacity=1)
    tela = RoundedRectangle(width=0.27, height=0.46, corner_radius=0.04, stroke_width=0, fill_color="#9fd3ff", fill_opacity=1)
    icones = VGroup(*[Square(0.07, stroke_width=0, fill_color=c, fill_opacity=1)
                      for c in ("#ff6b6b", "#ffd93d", "#6bcB77", "#4d96ff")]).arrange_in_grid(2, 2, buff=0.05).move_to(tela)
    return VGroup(corpo, tela, icones)


def peso(txt):
    corpo = Polygon([-0.8, 0, 0], [0.8, 0, 0], [0.62, 0.6, 0], [-0.62, 0.6, 0], color=TINTA, stroke_width=TRACO,
                    fill_color="#5b5550", fill_opacity=1)
    alca = Arc(radius=0.17, start_angle=0, angle=PI, color=TINTA, stroke_width=TRACO).next_to(corpo, UP, buff=-0.02)
    t = rotulo(txt, 24, PAPEL).move_to(corpo).shift(DOWN * 0.03)
    return VGroup(tremer(VGroup(corpo, alca), amp=0.008, semente=5), t)


class Teste(CenaNarrada):
    nome = "teste"

    def construct(self):
        # ---------- fala 0: a cena da dor ----------
        chao = tremer(Line([-6.0, -2.45, 0], [6.6, -2.45, 0], color=TINTA, stroke_width=4), amp=0.01, semente=1)
        mesa_tampo = Line([0.6, -0.85, 0], [4.6, -0.85, 0], color=TINTA, stroke_width=TRACO + 2)
        mesa_pernas = VGroup(Line([0.9, -0.85, 0], [0.9, -2.45, 0]), Line([4.3, -0.85, 0], [4.3, -2.45, 0])).set_stroke(TINTA, TRACO)
        mesa = tremer(VGroup(mesa_tampo, mesa_pernas), amp=0.01, semente=2)
        note, tela, linhas = notebook()
        note.move_to([2.7, -0.85, 0], aligned_edge=DOWN)
        linhas.move_to(tela)
        cuca = Cuca("neutro").move_to([-0.6, -0.2, 0])
        cuca.shift(UP * (-2.45 - cuca.get_bottom()[1]))
        self.som("lapis")
        self.play(Create(chao), Create(mesa), FadeIn(note, shift=UP * 0.2), FadeIn(cuca, shift=UP * 0.3), run_time=0.8)
        self.ate(self.fala(0, "abre o arquivo"))
        self.som("lapis")
        self.play(tela.animate.set_fill("#ffffff"), LaggedStart(*[Create(l) for l in linhas], lag_ratio=0.25), run_time=0.8)
        self.ate(self.fala(0, "olha pra ele"))
        pontos = mao("...", 90).next_to(cuca.cabeca, UP + RIGHT, buff=0.05)
        self.play(cuca.emocao("desconforto"), Write(pontos), run_time=0.6)
        self.ate(self.fala(0, "está no celular"))
        cel = celular().move_to(cuca.braco_e.get_end() + UP * 0.15 + LEFT * 0.05).rotate(0.25)
        self.som("pop")
        self.play(FadeOut(pontos), FadeIn(cel, scale=0.3), cuca.emocao("alivio"),
                  cuca.braco_e.animate.put_start_and_end_on(cuca.braco_e.get_start(), cuca.braco_e.get_start() + np.array([-0.45, 0.25, 0])),
                  run_time=0.5)
        self.play(cel.animate.move_to(cuca.braco_e.get_start() + np.array([-0.5, 0.35, 0])), run_time=0.25)
        self.ate(self.fala(0, "De novo"))
        de_novo = mao("de novo.", 96, VERMELHO_CANETA).move_to([3.4, 2.4, 0]).rotate(0.06)
        tracos = VGroup(*[Line(UP * 0.3, DOWN * 0.3, color=VERMELHO_CANETA, stroke_width=7).shift(RIGHT * 0.22 * k) for k in range(4)])
        tracos.add(Line([-0.15, -0.2, 0], [0.85, 0.2, 0], color=VERMELHO_CANETA, stroke_width=7))
        tremer(tracos, amp=0.01, semente=9)
        tracos.next_to(de_novo, DOWN, buff=0.25)
        self.som("lapis")
        self.play(Write(de_novo), run_time=0.6)
        self.play(LaggedStart(*[Create(t) for t in tracos], lag_ratio=0.2), run_time=0.7)

        # ---------- fala 1: não é preguiça ----------
        self.ate(self.fala(1) - 0.35)
        self.play(FadeOut(VGroup(chao, mesa, note, linhas, de_novo, tracos, cel)),
                  cuca.animate.scale(0.85).move_to([-4.6, -0.4, 0]), run_time=0.6)
        self.play(cuca.emocao("neutro"), run_time=0.3)
        self.ate(self.fala(1, "Isso não é"))
        preguica = mao("PREGUIÇA", 170).move_to([1.4, 1.7, 0])
        self.som("lapis")
        self.play(Write(preguica), run_time=0.9)
        self.ate(self.fala(1, "Preguiça é não"))
        r = risco(preguica)
        self.som("risco")
        self.play(Create(r), run_time=0.4)
        self.ate(self.fala(1, "Você quer fazer"))
        quer = mao("você quer fazer.", 92).move_to([1.4, 0.0, 0])
        self.som("lapis")
        self.play(Write(quer), cuca.emocao("energia"), run_time=0.7)
        self.ate(self.fala(1, "Só não consegue"))
        nao = mao("só não consegue começar.", 92).move_to([1.4, -1.45, 0])
        faixa = marca_texto(nao)
        self.som("marca")
        self.play(GrowFromEdge(faixa, LEFT), Write(nao), cuca.emocao("desconforto"), run_time=0.9)

        # ---------- fala 2: o ciclo ----------
        self.ate(self.fala(2) - 0.35)
        self.play(FadeOut(VGroup(preguica, r, quer, nao, faixa, cuca)), run_time=0.5)
        c = np.array([0.6, -0.15, 0])
        pos = {"tarefa": c + [0, 2.45, 0], "desconforto": c + [4.4, 0, 0], "fuga": c + [0, -2.45, 0], "alivio": c + [-4.4, 0, 0]}
        cx = {k: caixa(t) for k, t in [("tarefa", "TAREFA"), ("desconforto", "DESCONFORTO"), ("fuga", "FUGA"), ("alivio", "ALÍVIO")]}
        for k, m in cx.items():
            m.move_to(pos[k])
        icone_desc = cabecinha("desconforto", 0.32).next_to(cx["desconforto"], UP, buff=0.15)
        icone_fuga = celular().scale(1.1).next_to(cx["fuga"], RIGHT, buff=0.25)
        icone_alivio = cabecinha("alivio", 0.32).next_to(cx["alivio"], UP, buff=0.15)

        def seta(a, b, ang):
            s = CurvedArrow(a, b, angle=ang, color=TINTA, stroke_width=TRACO, tip_length=0.28)
            return s

        setas = [
            seta(cx["tarefa"].get_right() + RIGHT * 0.1, cx["desconforto"].get_top() + UP * 0.6, -PI / 3),
            seta(cx["desconforto"].get_bottom() + DOWN * 0.1, cx["fuga"].get_right() + RIGHT * 0.1, -PI / 3),
            seta(cx["fuga"].get_left() + LEFT * 0.1, cx["alivio"].get_bottom() + DOWN * 0.1, -PI / 3),
            seta(cx["alivio"].get_top() + UP * 0.6, cx["tarefa"].get_left() + LEFT * 0.1, -PI / 3),
        ]
        self.ate(self.fala(2, "A tarefa"))
        self.som("pop")
        self.play(FadeIn(cx["tarefa"], scale=0.6), run_time=0.4)
        self.ate(self.fala(2, "desconforto"))
        self.som("pop")
        self.play(Create(setas[0]), FadeIn(cx["desconforto"], scale=0.6), FadeIn(icone_desc, scale=0.4), run_time=0.6)
        self.ate(self.fala(2, "Adiar"))
        self.som("pop")
        self.play(Create(setas[1]), FadeIn(cx["fuga"], scale=0.6), FadeIn(icone_fuga, scale=0.4), run_time=0.6)
        self.ate(self.fala(2, "alívio"))
        self.som("pop")
        self.play(Create(setas[2]), FadeIn(cx["alivio"], scale=0.6), FadeIn(icone_alivio, scale=0.4), run_time=0.6)
        self.ate(self.fala(2, "o seu cérebro"))
        self.play(Create(setas[3]), run_time=0.5)
        frase = mao("fugir funciona", 64).move_to(c)
        faixa2 = marca_texto(frase)
        self.ate(self.fala(2, "fugir funciona"))
        self.som("marca")
        self.play(GrowFromEdge(faixa2, LEFT), Write(frase), run_time=0.7)
        # bolinha dando a volta no ciclo
        trilho = ParametricFunction(lambda u: c + np.array([4.4 * np.sin(TAU * u), 2.45 * np.cos(TAU * u), 0]), t_range=[0, 1])
        bola = Dot(trilho.point_from_proportion(0), radius=0.13, color=VERMELHO_CANETA)
        self.add(bola)
        self.play(MoveAlongPath(bola, trilho), run_time=1.1, rate_func=linear)
        self.ate(self.fala(2, "Só que"))
        self.som("pesado")
        self.play(cx["tarefa"].animate.scale(1.35), run_time=0.4)
        p = peso("+ culpa").next_to(cx["tarefa"], UP, buff=0.08)
        self.play(FadeIn(p, shift=DOWN * 0.4), run_time=0.35)
        self.play(MoveAlongPath(bola, trilho), run_time=0.7, rate_func=linear)
        self.play(MoveAlongPath(bola, trilho), run_time=0.5, rate_func=linear)

        # ---------- fala 3: emoção, não tempo ----------
        self.ate(self.fala(3) - 0.3)
        ciclo = VGroup(*cx.values(), *setas, icone_desc, icone_fuga, icone_alivio, frase, faixa2, bola, p)
        self.play(FadeOut(ciclo), run_time=0.45)
        rel = Circle(radius=1.05, color=TINTA, stroke_width=TRACO, fill_color=WHITE, fill_opacity=0.6)
        ponteiros = VGroup(Line(ORIGIN, UP * 0.7), Line(ORIGIN, RIGHT * 0.5 + DOWN * 0.2)).set_stroke(TINTA, TRACO)
        relogio = tremer(VGroup(rel, ponteiros), amp=0.012, semente=4).move_to([-3.9, 1.0, 0])
        txt_tempo = mao("falta de tempo", 62).next_to(relogio, DOWN, buff=0.35)
        self.ate(self.fala(3, "não é falta"))
        self.som("lapis")
        self.play(Create(relogio), Write(txt_tempo), run_time=0.7)
        x = VGroup(Line([-1, 1, 0], [1, -1, 0]), Line([-1, -1, 0], [1, 1, 0])).set_stroke(VERMELHO_CANETA, 12)
        tremer(x, amp=0.015, semente=8).scale(1.15).move_to(VGroup(relogio, txt_tempo))
        self.som("risco")
        self.play(Create(x), run_time=0.45)
        self.ate(self.fala(3, "É um jeito"))
        l1 = mao("é um jeito de lidar com", 72).move_to([2.9, 1.5, 0])
        l2 = mao("uma EMOÇÃO.", 104).next_to(l1, DOWN, buff=0.45)
        faixa3 = marca_texto(l2)
        self.som("lapis")
        self.play(Write(l1), run_time=0.8)
        self.ate(self.fala(3, "uma emoção"))
        self.som("marca")
        self.play(GrowFromEdge(faixa3, LEFT), Write(l2), run_time=0.8)
        cuca2 = Cuca("neutro", escala=0.75).move_to([5.3, -2.0, 0])
        self.play(FadeIn(cuca2, shift=UP * 0.3), run_time=0.5)
        self.play(cuca2.emocao("alivio"), run_time=0.5)
        self.terminar()
