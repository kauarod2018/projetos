"""Teste no estilo "palitinho no fundo preto": cortes secos, fotos recortadas, emojis 3D e GIFs."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from palitos.estilo import *  # noqa: E402,F403


class TesteV2(CenaNarrada):
    nome = "teste_v2"

    def construct(self):
        # ===== fala 0: a dor =====
        cuca = Cuca("neutro").move_to([-3.2, -0.6, 0])
        note = vivo(emoji("page_facing_up", 2.2).move_to([1.6, -0.9, 0]), amp=0.05, pulo=0.03)
        arq = txt("TRABALHO_FINAL_v7.docx", 40).next_to(note, UP, buff=0.35)
        self.ate(self.fala(0, "abre"))
        self.som("pop")
        self.play(surgir(cuca), surgir(note), run_time=0.3)
        self.play(FadeIn(arq, shift=UP * 0.2), run_time=0.25)

        self.ate(self.fala(0, "olha pra ele"))
        self.corte()
        moca = imagem("tedio_notebook", 5.6).move_to([-1.2, -0.9, 0])
        cansada = vivo(emoji("weary_face", 1.5).move_to([3.6, 1.6, 0]))
        self.add(moca)
        self.som("pop")
        self.play(surgir(cansada), run_time=0.25)

        self.ate(self.fala(0, "e quando percebe"))
        self.corte()
        feliz = imagem("feliz_celular", 5.2).move_to([-3.3, -0.9, 0])
        gif = ClipeVideo("rolando_celular", largura=4.6, inicio=0.5, dur=3.0).move_to([3.0, 0.4, 0])
        borda = moldura(gif)
        aliviado = vivo(emoji("relieved_face", 1.2).move_to([5.6, 2.6, 0]), fase=1.0)
        depois = txt("2 horas depois...", 44, CINZA).next_to(borda, DOWN, buff=0.35)
        self.add(feliz, borda, gif)
        self.som("pop")
        self.play(surgir(aliviado), FadeIn(depois), run_time=0.3)

        self.ate(self.fala(0, "De novo"))
        self.corte()
        de_novo = txt("DE NOVO.", 150, VERMELHO).shift(UP * 0.3)
        sub = rabisco(de_novo, VERMELHO, semente=2)
        repetir = emoji("repeat_button", 1.4).next_to(de_novo, RIGHT, buff=0.4)
        dentro(Group(de_novo, repetir))
        sub = rabisco(de_novo, VERMELHO, semente=2)
        repetir.add_updater(lambda m, dt: m.rotate(-dt * 4))
        self.som("carimbo")
        self.play(carimbo(de_novo), run_time=0.2)
        self.play(Create(sub), FadeIn(repetir, scale=0.5), run_time=0.35)

        # ===== fala 1: não é preguiça =====
        self.ate(self.fala(1, "Isso não é"))
        self.corte()
        bicho = imagem("bicho_preguica", 6.0).move_to([-3.4, -0.6, 0])
        pal = dentro(txt("PREGUIÇA?", 120, AMARELO).move_to([2.6, 0.6, 0]))
        self.add(bicho)
        self.som("pop")
        self.play(surgir(pal), run_time=0.3)
        self.ate(self.fala(1, "não é preguiça") + 0.35)
        xis = emoji("cross_mark", 2.6).move_to(pal)
        self.som("carimbo")
        self.play(carimbo(xis), run_time=0.18)

        self.ate(self.fala(1, "Preguiça é não"))
        self.corte()
        sofa = vivo(imagem("preguica_sofa", 3.8).move_to([-4.3, -0.4, 0]), amp=0.02, vel=2, pulo=0.03)
        zzz = vivo(emoji("sleeping_face", 1.3).move_to([-2.6, 1.9, 0]), fase=0.5)
        defin = VGroup(txt("preguiça =", 58, CINZA), txt("não querer fazer NADA", 58, destaque="NADA")).arrange(DOWN, aligned_edge=LEFT, buff=0.3)
        defin.next_to(sofa, RIGHT, buff=0.6)
        dentro(defin)
        self.add(sofa)
        self.play(surgir(zzz), FadeIn(defin, shift=LEFT * 0.3), run_time=0.35)

        self.ate(self.fala(1, "Você quer fazer"))
        self.corte()
        cuca = Cuca("energia").move_to([-5.0, -0.6, 0])
        ok = vivo(emoji("check_mark_button", 1.5).move_to([-3.4, 1.9, 0]))
        quer = dentro(txt("você QUER fazer.", 84, destaque="QUER").move_to([2.0, 0.2, 0]))
        self.add(cuca)
        self.som("pop")
        self.play(surgir(ok), surgir(quer), run_time=0.3)

        self.ate(self.fala(1, "Só não consegue"))
        self.corte()
        carga = imagem("carga_pesada", 5.6).move_to([-2.6, -0.8, 0])
        etiqueta = txt("COMEÇAR", 50, "#000000").move_to(carga.get_center() + np.array([-0.55, 0.3, 0])).rotate(0.12)
        fundo_et = RoundedRectangle(width=etiqueta.width + 0.4, height=etiqueta.height + 0.3, corner_radius=0.1,
                                    fill_color=AMARELO, fill_opacity=1, stroke_width=0).move_to(etiqueta).rotate(0.12)
        frase = dentro(txt("só não consegue COMEÇAR.", 64, destaque="COMEÇAR").move_to([3.0, 2.4, 0]))
        sofrendo = vivo(emoji("persevering_face", 1.3).move_to([4.2, 0.5, 0]))
        self.add(carga, fundo_et, etiqueta)
        self.som("pesado")
        self.play(FadeIn(frase, shift=DOWN * 0.2), surgir(sofrendo), run_time=0.35)

        # ===== fala 2: o ciclo =====
        self.ate(self.fala(2, "A tarefa"))
        self.corte()
        c = np.array([0.0, -0.3, 0])
        pos = {"tarefa": c + [0, 2.55, 0], "desconforto": c + [4.6, 0, 0], "fuga": c + [0, -2.6, 0], "alivio": c + [-4.6, 0, 0]}
        icones = {"tarefa": "page_facing_up", "desconforto": "persevering_face", "fuga": "mobile_phone", "alivio": "relieved_face"}
        rotulos = {"tarefa": "TAREFA", "desconforto": "DESCONFORTO", "fuga": "FUGA", "alivio": "ALÍVIO"}
        no = {}
        for k in pos:
            ic = emoji(icones[k], 1.25).move_to(pos[k] + UP * 0.25)
            rt = txt(rotulos[k], 36).next_to(ic, DOWN, buff=0.12)
            no[k] = Group(ic, rt)

        def seta(a, b):
            s = CurvedArrow(a, b, angle=-PI / 3.2, color=BRANCO, stroke_width=TRACO, tip_length=0.32)
            return tremer(s, amp=0.015, semente=int(abs(a[0] * 10)))

        setas = [
            seta(pos["tarefa"] + [1.1, 0.25, 0], pos["desconforto"] + [0, 1.25, 0]),
            seta(pos["desconforto"] + [0, -1.15, 0], pos["fuga"] + [1.1, 0.2, 0]),
            seta(pos["fuga"] + [-1.1, 0.2, 0], pos["alivio"] + [0, -1.15, 0]),
            seta(pos["alivio"] + [0, 1.25, 0], pos["tarefa"] + [-1.1, 0.25, 0]),
        ]
        self.som("pop")
        self.play(surgir(no["tarefa"]), run_time=0.28)
        self.ate(self.fala(2, "desconforto"))
        self.som("pop")
        self.play(Create(setas[0]), surgir(no["desconforto"]), run_time=0.35)
        self.ate(self.fala(2, "Adiar"))
        self.som("pop")
        self.play(Create(setas[1]), surgir(no["fuga"]), run_time=0.35)
        self.ate(self.fala(2, "alívio"))
        self.som("pop")
        self.play(Create(setas[2]), surgir(no["alivio"]), run_time=0.35)
        self.ate(self.fala(2, "E o seu"))
        self.play(Create(setas[3]), run_time=0.3)
        cerebro = vivo(emoji("brain", 1.7).move_to(c + UP * 0.5), amp=0.06)
        self.som("pop")
        self.play(surgir(cerebro), run_time=0.28)
        self.ate(self.fala(2, "fugir funciona"))
        regra = Group(txt("fugir =", 54), emoji("check_mark_button", 0.8)).arrange(RIGHT, buff=0.2).next_to(cerebro, DOWN, buff=0.15)
        self.som("carimbo")
        self.play(carimbo(regra), run_time=0.2)

        self.ate(self.fala(2, "Só que"))
        self.corte()
        carga = imagem("carga_pesada", 6.6).move_to([-3.2, -0.6, 0])
        et = txt("TAREFA", 60, "#000000")
        et_fundo = RoundedRectangle(width=et.width + 0.4, height=et.height + 0.3, corner_radius=0.1, fill_color=AMARELO,
                                    fill_opacity=1, stroke_width=0)
        etq = VGroup(et_fundo, et).move_to(carga.get_center() + np.array([-0.7, 0.5, 0])).rotate(0.1)
        culpa = txt("+ CULPA", 54, "#000000")
        culpa_f = RoundedRectangle(width=culpa.width + 0.4, height=culpa.height + 0.3, corner_radius=0.1, fill_color=VERMELHO,
                                   fill_opacity=1, stroke_width=0)
        etq2 = VGroup(culpa_f, culpa).next_to(etq, DOWN, buff=0.25).rotate(-0.08)
        pesada = dentro(VGroup(txt("ainda MAIS", 80, destaque="MAIS", cor_destaque=VERMELHO), txt("pesada.", 80)).arrange(DOWN, aligned_edge=LEFT).move_to([3.7, 0.3, 0]))
        self.add(carga, etq)
        self.som("pesado")
        self.play(carimbo(etq2), FadeIn(pesada, shift=DOWN * 0.2), run_time=0.3)

        # ===== fala 3: emoção, não tempo =====
        self.ate(self.fala(3, "não é falta"))
        self.corte()
        relogio = vivo(emoji("alarm_clock", 3.0).move_to([-2.6, 0.4, 0]), amp=0.12, vel=14, pulo=0.0)
        falta = txt("falta de tempo", 64).next_to(relogio, DOWN, buff=0.4)
        self.som("pop")
        self.play(surgir(relogio), FadeIn(falta), run_time=0.3)
        self.ate(self.fala(3, "tempo") + 0.25)
        xis = emoji("cross_mark", 3.4).move_to(Group(relogio, falta))
        self.som("carimbo")
        self.play(carimbo(xis), run_time=0.18)

        self.ate(self.fala(3, "É um jeito"))
        self.corte()
        cuca = Cuca("desconforto", escala=0.9).move_to([-5.6, -0.6, 0])
        coracao = vivo(emoji("red_heart", 1.3).move_to([-4.0, 1.9, 0]), amp=0.0, vel=7, pulo=0.12)
        l1 = txt("é um jeito de lidar com", 56).move_to([1.6, 1.1, 0])
        l2 = txt("uma EMOÇÃO.", 96, destaque="EMOÇÃO.").next_to(l1, DOWN, buff=0.4)
        dentro(VGroup(l1, l2))
        risco = rabisco(l2, AMARELO, semente=5)
        self.add(cuca)
        self.play(FadeIn(l1, shift=UP * 0.2), surgir(coracao), run_time=0.3)
        self.ate(self.fala(3, "uma emoção"))
        self.som("carimbo")
        self.play(carimbo(l2), run_time=0.2)
        self.play(Create(risco), cuca.emocao("alivio"), run_time=0.4)
        self.terminar()
