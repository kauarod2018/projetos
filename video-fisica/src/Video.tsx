import "@fontsource/anton/400.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/800.css";
import "@fontsource/montserrat/900.css";
import { useEffect, useState } from "react";
import {
  AbsoluteFill, OffthreadVideo, Sequence, continueRender, delayRender, interpolate, spring,
  staticFile, useCurrentFrame, useVideoConfig, Easing,
} from "remotion";
import timeline from "../public/timeline.json";

type Cena = (typeof timeline.cenas)[number];

const FPS = timeline.fps;
const AMARELO = "#FFD400";
const FUNDO = "#0b1426";
const TRANSICAO = 0.35; // segundos de fusão entre cenas
const s2f = (s: number) => Math.round(s * FPS);
const cenaPorId = (id: string) => timeline.cenas.find((c) => c.id === id)!;

// instante (em s) em que um trecho da fala começa, estimado pela posição do texto
function tempoDe(c: Cena, trecho: string) {
  const i = c.fala.toLowerCase().indexOf(trecho.toLowerCase());
  return c.inicioFala + (c.duracaoFala * Math.max(i, 0)) / c.fala.length;
}

// ---------- legendas ----------
function blocosLegenda(c: Cena) {
  const palavras = c.fala.split(" ");
  const blocos: string[] = [];
  let atual = "";
  for (const p of palavras) {
    const tenta = atual ? atual + " " + p : p;
    if (tenta.length > 34 && atual) { blocos.push(atual); atual = p; } else atual = tenta;
    if (/[.:?!]$/.test(p) && atual.length > 12) { blocos.push(atual); atual = ""; }
  }
  if (atual) blocos.push(atual);
  const peso = (b: string) => b.length + (/[.:?!,]$/.test(b) ? 6 : 0);
  const total = blocos.reduce((a, b) => a + peso(b), 0);
  let t = c.inicioFala;
  return blocos.map((b) => {
    const d = (c.duracaoFala * peso(b)) / total;
    const r = { texto: b, de: t, ate: t + d };
    t += d;
    return r;
  });
}
const LEGENDAS = timeline.cenas.flatMap(blocosLegenda);

const Legenda: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const b = LEGENDAS.find((x) => t >= x.de && t < x.ate);
  if (!b) return null;
  const u = Math.min(1, (t - b.de) / 0.12);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 46 }}>
      <div style={{
        fontFamily: "Montserrat", fontWeight: 800, fontSize: 44, color: "white", textAlign: "center",
        background: "rgba(5,10,22,0.72)", padding: "10px 26px", borderRadius: 14, letterSpacing: 0.5,
        transform: `translateY(${(1 - u) * 10}px)`, opacity: u, maxWidth: 1500,
      }}>
        {b.texto}
      </div>
    </AbsoluteFill>
  );
};

// ---------- peças de texto ----------
const Pop: React.FC<{ de: number; ate?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ de, ate, children, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f0 = s2f(de);
  if (frame < f0) return null;
  const sp = spring({ frame: frame - f0, fps, config: { damping: 12, stiffness: 160 } });
  const saida = ate ? interpolate(frame, [s2f(ate) - 8, s2f(ate)], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  if (saida <= 0) return null;
  return <div style={{ transform: `scale(${0.4 + 0.6 * sp})`, opacity: Math.min(1, sp * 1.5) * saida, ...style }}>{children}</div>;
};

const grande = (cor = "white", tam = 130): React.CSSProperties => ({
  fontFamily: "Anton", fontSize: tam, color: cor, lineHeight: 1.05, letterSpacing: 2, textAlign: "center",
  textShadow: "0 6px 30px rgba(0,0,0,0.75)",
});

const Rotulo: React.FC<{ c: Cena }> = ({ c }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f0 = s2f(c.inicio + 0.3), f1 = s2f(c.fim - 0.3);
  if (!c.rotulo || frame < f0 || frame > f1) return null;
  const sp = spring({ frame: frame - f0, fps, config: { damping: 14 } });
  const sai = interpolate(frame, [f1 - 10, f1], [0, 1], { extrapolateLeft: "clamp" });
  return (
    <div style={{
      position: "absolute", left: 60, top: 54, transform: `translateX(${(1 - sp) * -500 - sai * 500}px)`,
      display: "flex", alignItems: "center", gap: 16, background: "rgba(5,10,22,0.8)", borderRadius: 16,
      padding: "14px 26px 14px 18px", border: "2px solid rgba(255,255,255,0.12)",
    }}>
      <div style={{ width: 10, height: 44, borderRadius: 5, background: AMARELO }} />
      <div style={{ fontFamily: "Montserrat", fontWeight: 900, fontSize: 34, color: "white", letterSpacing: 3 }}>{c.rotulo}</div>
    </div>
  );
};

// ---------- clipes ----------
// clipes reaproveitados (terra_lua) continuam de onde pararam na cena anterior
const OFFSETS: Record<number, number> = {};
{
  const usado: Record<string, number> = {};
  timeline.cenas.forEach((c, i) => {
    OFFSETS[i] = usado[c.clipe] ?? 0;
    usado[c.clipe] = (usado[c.clipe] ?? 0) + (c.fim - c.inicio);
  });
}

const Clipe: React.FC<{ c: Cena; i: number }> = ({ c, i }) => {
  const frame = useCurrentFrame();
  const entrada = i === 0 ? 0 : TRANSICAO;
  const opac = i === 0 ? 1 : interpolate(frame, [0, s2f(entrada)], [0, 1], { extrapolateRight: "clamp" });
  const inicioClipe = Math.max(0, OFFSETS[i] - entrada);
  const manim = c.ferramenta === "manim";
  return (
    <AbsoluteFill style={{ opacity: opac, backgroundColor: FUNDO }}>
      <OffthreadVideo
        src={staticFile(`clipes/${c.clipe}.mp4`)}
        startFrom={s2f(inicioClipe)}
        muted
        style={manim
          // o Manim fica um pouco menor e mais alto, liberando a faixa de baixo para a legenda
          ? { width: 1920 * 0.88, height: 1080 * 0.88, position: "absolute", left: 1920 * 0.06, top: 20 }
          : { width: 1920, height: 1080 }}
      />
    </AbsoluteFill>
  );
};

// ---------- sobreposições de cada cena ----------
const Abertura: React.FC = () => {
  const c = cenaPorId("gancho");
  const frame = useCurrentFrame();
  const sai = interpolate(frame, [s2f(c.inicioFala + 0.2), s2f(c.inicioFala + 0.7)], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const escuro = interpolate(frame, [0, 20], [1, 0.35], { extrapolateRight: "clamp" }) * sai;
  return (
    <>
      <AbsoluteFill style={{ backgroundColor: `rgba(0,0,0,${escuro})` }} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: sai }}>
        <Pop de={0.25}><div style={grande("white", 150)}>{timeline.titulo[0]}</div></Pop>
        <Pop de={0.6}><div style={grande(AMARELO, 150)}>{timeline.titulo[1]}</div></Pop>
      </AbsoluteFill>
    </>
  );
};

const Gancho: React.FC = () => {
  const c = cenaPorId("gancho");
  const t1 = tempoDe(c, "setenta"), t2 = tempoDe(c, "Ela não"), t3 = tempoDe(c, "Por quê");
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <Pop de={t1} ate={t2 + 0.2}>
        <div style={grande(AMARELO, 120)}>73 QUINTILHÕES</div>
        <div style={{ ...grande("white", 60), fontFamily: "Montserrat", fontWeight: 900, letterSpacing: 6 }}>DE TONELADAS</div>
      </Pop>
      <div style={{ position: "absolute" }}>
        <Pop de={t3} ate={c.fim + 0.1}><div style={grande("white", 200)}>POR QUÊ?</div></Pop>
      </div>
    </AbsoluteFill>
  );
};

const Virada: React.FC = () => {
  const c = cenaPorId("virada");
  const frases: [string, string, string][] = [
    ["a Lua está caindo", "A LUA ESTÁ CAINDO.", AMARELO],
    ["O tempo todo", "O TEMPO TODO.", "white"],
    ["Ela só nunca", "SÓ NUNCA ACERTA O CHÃO.", "white"],
  ];
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 10 }}>
      {frases.map(([trecho, txt, cor]) => (
        <Pop key={txt} de={tempoDe(c, trecho)} ate={c.fim}><div style={grande(cor, 110)}>{txt}</div></Pop>
      ))}
    </AbsoluteFill>
  );
};

const Estacao: React.FC = () => {
  const c = cenaPorId("estacao");
  const frame = useCurrentFrame();
  const f0 = s2f(c.inicioFala - 0.2);
  if (frame < f0) return null;
  const u = interpolate(frame, [f0, f0 + s2f(2.2)], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const n = Math.round((28000 * u) / 100) * 100;
  const sai = interpolate(frame, [s2f(c.fim) - 10, s2f(c.fim)], [1, 0], { extrapolateLeft: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "flex-end", padding: "150px 90px", opacity: sai }}>
      <div style={{ textAlign: "right" }}>
        <div style={grande(AMARELO, 150)}>{n.toLocaleString("pt-BR")}</div>
        <div style={{ ...grande("white", 54), fontFamily: "Montserrat", fontWeight: 900, letterSpacing: 6 }}>KM/H</div>
        <Pop de={tempoDe(c, "Estação")} style={{ marginTop: 18 }}>
          <div style={{ fontFamily: "Montserrat", fontWeight: 800, fontSize: 32, color: "#9fd8ff", letterSpacing: 2 }}>
            ≈ VELOCIDADE DA ESTAÇÃO ESPACIAL
          </div>
        </Pop>
      </div>
    </AbsoluteFill>
  );
};

const Final: React.FC = () => {
  const c = cenaPorId("final");
  const frame = useCurrentFrame();
  const tBotao = tempoDe(c, "Se você");
  const pulso = 1 + 0.04 * Math.sin((frame / FPS - tBotao) * 6);
  const fade = interpolate(frame, [s2f(c.fim) - 24, s2f(c.fim)], [0, 1], { extrapolateLeft: "clamp" });
  return (
    <>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 8, paddingBottom: 120 }}>
        <Pop de={tempoDe(c, "está sempre caindo")}><div style={grande("white", 120)}>SEMPRE CAINDO.</div></Pop>
        <Pop de={tempoDe(c, "sempre errando")}><div style={grande(AMARELO, 120)}>SEMPRE ERRANDO.</div></Pop>
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 170 }}>
        <Pop de={tBotao}>
          <div style={{
            transform: `scale(${pulso})`, background: "#e62117", color: "white", fontFamily: "Montserrat", fontWeight: 900,
            fontSize: 56, letterSpacing: 4, padding: "26px 70px", borderRadius: 24, boxShadow: "0 10px 50px rgba(230,33,23,0.55)",
          }}>INSCREVA-SE</div>
        </Pop>
      </AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: "black", opacity: fade }} />
    </>
  );
};

const BarraProgresso: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <div style={{ position: "absolute", left: 0, top: 0, height: 6, width: `${(100 * frame) / durationInFrames}%`, background: AMARELO, opacity: 0.85 }} />
  );
};

// ---------- composição ----------
export const Video: React.FC = () => {
  const [handle] = useState(() => delayRender("fontes"));
  useEffect(() => {
    Promise.all(["130px Anton", "800 40px Montserrat", "900 40px Montserrat"].map((f) => document.fonts.load(f, "ÁÃÇÊÕ")))
      .then(() => continueRender(handle));
  }, [handle]);

  return (
    <AbsoluteFill style={{ backgroundColor: FUNDO }}>
      {timeline.cenas.map((c, i) => {
        const entrada = i === 0 ? 0 : TRANSICAO;
        return (
          <Sequence key={c.id} from={s2f(c.inicio - entrada)} durationInFrames={s2f(c.fim - c.inicio + entrada)}>
            <Clipe c={c} i={i} />
          </Sequence>
        );
      })}
      <Gancho />
      <Virada />
      <Estacao />
      <Final />
      <Abertura />
      {timeline.cenas.map((c) => <Rotulo key={c.id} c={c} />)}
      <Legenda />
      <BarraProgresso />
    </AbsoluteFill>
  );
};
