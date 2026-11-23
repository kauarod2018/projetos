import type { Caption } from "@remotion/captions";
import { Audio } from "@remotion/media";
import React from "react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Legendas } from "./Legendas";
import { Acabamento } from "./vns/Acabamento";
import { Boneco } from "./vns/Boneco";
import { CLAMP, COR, F, PALETAS, misturar, type Paleta } from "./vns/estilo";
import { Arvores, Ceu, Chao, Folhagem, Morros, Mosquitos, Nevoa, Particulas, Plano, Sol, Trilho } from "./vns/Mundo";
import { BarraChance, Bilhete, Calendario, Carimbo, Contador, FlashPerigo, Pilula, type Queda } from "./vns/UI";

export type Fala = { fala: number; texto: string; startMs: number; endMs: number };

type Props = {
  readonly legendas: Caption[];
  readonly falas: Fala[];
  readonly audio: string;
};

const limpa = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

/** Cria a função `em(palavra)` de uma fala: frame (relativo ao começo da cena) em que a palavra é dita. */
const relogio = (legendas: Caption[], fala: Fala, inicioCenaMs: number, fps: number) => {
  return (palavra: string, ocorrencia = 1) => {
    let achadas = 0;
    for (const c of legendas) {
      if (c.startMs < fala.startMs || c.startMs > fala.endMs) continue;
      if (limpa(c.text).startsWith(limpa(palavra)) && ++achadas === ocorrencia) {
        return Math.round(((c.startMs - inicioCenaMs) / 1000) * fps);
      }
    }
    throw new Error(`"${palavra}" não encontrada na fala ${fala.fala}: ${fala.texto}`);
  };
};

type Cena = React.FC<{ em: (p: string, o?: number) => number; dur: number }>;

/** Câmera: aproximação lenta durante a cena (e um soco de zoom opcional num instante). */
const Camera: React.FC<{
  children: React.ReactNode;
  /** Interface da cena (pílula, calendário, bilhete, contador): fica fora do zoom para não sair do quadro. */
  hud?: React.ReactNode;
  de?: number;
  ate?: number;
  soco?: number;
  origem?: string;
}> = ({
  children,
  hud,
  de = 1,
  ate = 1.07,
  soco,
  origem = "50% 50%",
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const base = interpolate(frame, [0, durationInFrames], [de, ate], CLAMP);
  const extra = soco === undefined ? 0 : interpolate(frame, [soco, soco + 6, soco + 30], [0, 0.18, 0.12], CLAMP);
  return (
    <>
      <AbsoluteFill style={{ scale: String(base + extra), transformOrigin: origem }}>{children}</AbsoluteFill>
      {hud}
    </>
  );
};

/** Paralaxe: deslocamento horizontal suave conforme a profundidade. */
const usePan = (velocidade = 0.6) => {
  const frame = useCurrentFrame();
  return (profundidade: number) => -frame * velocidade * profundidade;
};

const Cenario: React.FC<{ p: Paleta; horizonte: number; sol?: { x: number; y: number; r?: number; raios?: boolean }; pan?: number; arvoresY?: number }> = ({
  p,
  horizonte,
  sol,
  pan = 0.5,
  arvoresY,
}) => {
  const desloca = usePan(pan);
  return (
    <>
      <Ceu p={p} horizonteY={horizonte} />
      {sol ? <Sol p={p} x={sol.x} y={sol.y} raio={sol.r} raios={sol.raios} /> : null}
      <Plano desloca={desloca(0.15)} blur={5}>
        <Morros cor={p.longe} y={horizonte} semente="longe" />
      </Plano>
      <Nevoa cor={p.nevoa} y={horizonte - 20} opacidade={0.5} />
      <Plano desloca={desloca(0.4)} blur={2}>
        <Arvores cor={p.meio} y={arvoresY ?? horizonte + 90} semente="meio" />
      </Plano>
    </>
  );
};

/* ───────────────────────────── cenas ───────────────────────────── */

const Cartela: Cena = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = PALETAS.porDoSol;
  const entra = (atraso: number) => spring({ frame: frame - atraso, fps, config: { damping: 14 } });
  const extrusao = Array.from({ length: 14 }, (_, i) => `0 ${i + 1}px 0 ${misturar("#5A2A10", "#1A0A04", i / 14)}`).join(", ");
  return (
    <Camera de={1.04} ate={1}>
      <Cenario p={p} horizonte={1250} sol={{ x: 540, y: 1180, r: 120 }} pan={0.2} />
      <Trilho horizonteY={1250} />
      <Plano blur={6}>
        <Folhagem cor={p.perto} semente="cartela" />
      </Plano>
      <Particulas cor={p.sol} n={26} semente="cartela" />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 380, textAlign: "center" }}>
        <div style={{ fontFamily: F.cartela, fontWeight: 900, fontSize: 54, color: COR.creme, letterSpacing: 4, opacity: entra(0), textShadow: "0 4px 0 #2A1206" }}>
          POR QUE VOCÊ NÃO
          <br />
          SOBREVIVERIA NA
        </div>
        <div
          style={{
            fontFamily: F.cartela,
            fontWeight: 900,
            fontSize: 150,
            lineHeight: 1.02,
            marginTop: 30,
            color: "#FFD27A",
            textShadow: `${extrusao}, 0 24px 40px rgba(0,0,0,0.6)`,
            scale: String(interpolate(entra(6), [0, 1], [1.3, 1])),
            opacity: entra(6),
          }}
        >
          FERROVIA
          <br />
          DO DIABO
        </div>
        <div style={{ fontFamily: F.cartela, fontWeight: 900, fontSize: 46, color: COR.creme, marginTop: 36, letterSpacing: 3, opacity: entra(16), textShadow: "0 4px 0 #2A1206" }}>
          MADEIRA-MAMORÉ · 1907–1912
        </div>
      </AbsoluteFill>
    </Camera>
  );
};

const Barraca: React.FC<{ x: number; y: number; escala: number; cor: string }> = ({ x, y, escala, cor }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
    <g transform={`translate(${x} ${y}) scale(${escala})`}>
      <path d="M-160 0 L0 -170 L160 0 Z" fill={cor} stroke={COR.escuro} strokeWidth={8} />
      <path d="M-30 0 L0 -60 L30 0 Z" fill={COR.escuro} />
    </g>
  </svg>
);

const Amanhecer: Cena = () => {
  const p = PALETAS.amanhecer;
  const frame = useCurrentFrame();
  return (
    <Camera hud={<Calendario ano="1909" hora="05:30" inicio={6} />}>
      <Cenario p={p} horizonte={1180} sol={{ x: 800, y: 1110, r: 80 }} />
      <Chao cor={p.chao} y={1290} />
      <Barraca x={230} y={1420} escala={0.9} cor={misturar("#CDBB98", p.ceuMeio, 0.25)} />
      <Barraca x={860} y={1380} escala={0.6} cor={misturar("#CDBB98", p.ceuMeio, 0.35)} />
      {/* fumaça da fogueira do acampamento (elemento vivo) */}
      {Array.from({ length: 6 }).map((_, i) => {
        const t = ((frame + i * 14) % 84) / 84;
        return (
          <div
            key={i}
            style={{ position: "absolute", left: 600 + Math.sin(t * 6 + i) * 30, top: 1430 - t * 380, width: 70 + t * 90, height: 70 + t * 90, borderRadius: "50%", backgroundColor: "#E9DCCB", opacity: (1 - t) * 0.35, filter: "blur(10px)" }}
          />
        );
      })}
      <div style={{ position: "absolute", left: 360, top: 1060 }}>
        <Boneco emocao="tired" tint={p.ceuMeio} luz={p.luz} ladoLuz="dir" olhar={1} largura={380} semente="amanhecer" />
      </div>
      <Plano blur={7}>
        <Folhagem cor={p.perto} semente="amanhecer" />
      </Plano>
      <Particulas cor={p.sol} n={22} semente="amanhecer" />
    </Camera>
  );
};

const Placa: React.FC<{ inicio: number }> = ({ inicio }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entra = spring({ frame: frame - inicio, fps, config: { damping: 11 } });
  return (
    <div style={{ position: "absolute", left: 600, top: 760, rotate: `${-3 + (1 - entra) * 20}deg`, scale: String(entra), transformOrigin: "50% 100%" }}>
      <div style={{ position: "absolute", left: 175, top: 150, width: 26, height: 500, backgroundColor: "#4A2F1A", border: `5px solid ${COR.escuro}` }} />
      <div
        style={{
          position: "relative",
          width: 380,
          padding: "22px 20px",
          backgroundColor: "#8A5A32",
          backgroundImage: "repeating-linear-gradient(180deg, transparent 0 46px, rgba(0,0,0,0.18) 46px 50px)",
          border: `7px solid ${COR.escuro}`,
          borderRadius: 10,
          fontFamily: F.titulo,
          color: COR.creme,
          textAlign: "center",
          lineHeight: 1.05,
        }}
      >
        <div style={{ fontSize: 44 }}>PORTO VELHO</div>
        <div style={{ fontSize: 40, color: COR.amarelo }}>↓</div>
        <div style={{ fontSize: 44 }}>GUAJARÁ-MIRIM</div>
      </div>
    </div>
  );
};

const Trilhos366: Cena = ({ em }) => {
  const p = PALETAS.amanhecer;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const passo = Math.sin((frame / fps) * Math.PI * 2 * 0.9);
  return (
    <Camera
      de={1}
      ate={1.05}
      hud={
        <Pilula y={600} inicio={em("trezentos")} tamanho={92}>
          366 KM DE TRILHO
        </Pilula>
      }
    >
      <Ceu p={p} horizonteY={1050} />
      <Sol p={p} x={540} y={1000} raio={70} />
      <Morros cor={p.longe} y={1050} semente="t-longe" />
      <Nevoa cor={p.nevoa} y={1040} opacidade={0.7} />
      <Plano blur={2}>
        <Arvores cor={p.meio} y={1110} escala={1.4} semente="t-meio" quantidade={10} />
      </Plano>
      <Trilho horizonteY={1060} avanco={(frame / fps) * 1.3} />
      <div style={{ position: "absolute", left: 90, top: 1120 + Math.abs(passo) * 14 }}>
        <Boneco emocao="back" tint={p.ceuMeio} luz={p.luz} ladoLuz="dir" largura={360} picareta semente="trilho" />
      </div>
      <Placa inicio={em("trezentos") - 6} />
      <Plano blur={8}>
        <Folhagem cor={p.perto} semente="trilho" />
      </Plano>
    </Camera>
  );
};

const Frasco: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: x, top: y, rotate: `${Math.sin(frame / 20) * 3}deg` }}>
      <div style={{ width: 60, height: 40, margin: "0 auto", backgroundColor: "#6B4A2B", border: `6px solid ${COR.escuro}`, borderRadius: 8 }} />
      <div style={{ width: 200, height: 300, backgroundColor: "#6B3A12", border: `7px solid ${COR.escuro}`, borderRadius: "40px 40px 26px 26px", position: "relative", boxShadow: "inset -30px 0 0 rgba(0,0,0,0.25), inset 18px 0 0 rgba(255,220,160,0.25)" }}>
        <div style={{ position: "absolute", left: 14, right: 14, top: 90, padding: "16px 0", backgroundColor: COR.creme, border: `4px solid ${COR.escuro}`, fontFamily: F.titulo, fontSize: 40, textAlign: "center", color: COR.escuro }}>
          QUININO
        </div>
      </div>
    </div>
  );
};

const Quinino: Cena = ({ em }) => {
  const p = PALETAS.amanhecer;
  return (
    <Camera
      de={1.02}
      ate={1.1}
      origem="40% 60%"
      hud={
        <Bilhete x={430} y={430} largura={560} rot={5} inicio={em("quinino")}>
          Quinino:
          <br />
          dose <u>obrigatória</u>
          <br />
          todo santo dia.
        </Bilhete>
      }
    >
      <Ceu p={p} horizonteY={1500} />
      <Plano blur={14}>
        <Arvores cor={misturar(p.meio, p.ceuMeio, 0.4)} y={1300} escala={1.6} semente="q-fundo" quantidade={7} />
      </Plano>
      <Sol p={p} x={900} y={500} raio={60} raios={false} />
      <div style={{ position: "absolute", left: 40, top: 860 }}>
        <Boneco emocao="worried" tint={p.ceuMeio} luz={p.luz} ladoLuz="dir" olhar={1} largura={720} semente="quinino" />
      </div>
      <Frasco x={780} y={1180} />
      <Particulas cor={p.sol} n={14} semente="quinino" />
    </Camera>
  );
};

const Termometro: React.FC<{ x: number; y: number; nivel: number }> = ({ x, y, nivel }) => (
  <div style={{ position: "absolute", left: x, top: y, width: 90, height: 560 }}>
    <div style={{ position: "absolute", left: 20, top: 0, width: 50, height: 470, borderRadius: 25, backgroundColor: "#F4F0E6", border: `7px solid ${COR.escuro}`, overflow: "hidden" }}>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${nivel * 100}%`, backgroundColor: COR.vermelho }} />
    </div>
    <div style={{ position: "absolute", left: 0, top: 440, width: 90, height: 90, borderRadius: "50%", backgroundColor: COR.vermelho, border: `7px solid ${COR.escuro}` }} />
  </div>
);

const MeioDia: Cena = ({ em }) => {
  const p = PALETAS.meioDia;
  const frame = useCurrentFrame();
  const nivel = interpolate(frame, [em("calor") - 10, em("calor") + 25], [0.35, 0.95], { ...CLAMP, easing: Easing.out(Easing.cubic) });
  return (
    <Camera hud={<Calendario ano="1909" hora="12:00" />}>
      <Cenario p={p} horizonte={1250} sol={{ x: 540, y: 330, r: 130 }} pan={0.3} />
      <Chao cor={p.chao} y={1330} />
      {/* ar tremendo de calor (elemento vivo) */}
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          style={{ position: "absolute", left: -100, right: -100, top: 1260 + i * 26 + Math.sin(frame / 4 + i) * 6, height: 10, backgroundColor: "#FFF6D6", opacity: 0.12, filter: "blur(4px)" }}
        />
      ))}
      {/* colegas trabalhando ao fundo */}
      {[150, 320, 830].map((x, i) => (
        <div key={x} style={{ position: "absolute", left: x, top: 1190 + i * 6, rotate: `${Math.sin(frame / 7 + i) * 6}deg`, transformOrigin: "50% 100%", filter: "blur(1.5px)" }}>
          <Boneco emocao="tired" tint={p.ceuMeio} luz={p.luz} largura={130} picareta semente={`colega${i}`} />
        </div>
      ))}
      <div style={{ position: "absolute", left: 260, top: 1050 }}>
        <Boneco emocao="tired" tint={p.ceuMeio} luz={p.luz} ladoLuz="esq" largura={470} suor semente="meiodia" />
      </div>
      <Termometro x={830} y={620} nivel={nivel} />
      <Plano blur={7}>
        <Folhagem cor={p.perto} semente="meiodia" />
      </Plano>
    </Camera>
  );
};

const Mosquito: Cena = ({ em }) => {
  const p = PALETAS.mata;
  const frame = useCurrentFrame();
  const quando = em("mosquito");
  const pousa = interpolate(frame, [quando - 20, quando], [0, 1], { ...CLAMP, easing: Easing.out(Easing.cubic) });
  return (
    <Camera soco={quando} origem="55% 48%">
      <Ceu p={p} horizonteY={1400} />
      <Plano blur={18}>
        <Arvores cor={p.longe} y={1250} escala={1.5} semente="mq" quantidade={6} />
        <div style={{ position: "absolute", left: 150, top: 1080 }}>
          <Boneco emocao="tired" tint={p.ceuMeio} luz={p.luz} largura={300} semente="mq-fundo" />
        </div>
      </Plano>
      <Particulas cor={p.sol} n={18} semente="mosq" brilho />
      {/* folha enorme em foco */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g transform="translate(560 1050) rotate(-24)">
          <ellipse cx={0} cy={0} rx={300} ry={620} fill="#2F7A3E" stroke="#123A1C" strokeWidth={10} />
          <line x1={0} y1={-600} x2={0} y2={600} stroke="#1E5A2B" strokeWidth={10} />
          {Array.from({ length: 9 }).map((_, i) => (
            <g key={i} stroke="#1E5A2B" strokeWidth={6} fill="none">
              <path d={`M0 ${-480 + i * 115} q140 -40 240 -120`} />
              <path d={`M0 ${-480 + i * 115} q-140 -40 -240 -120`} />
            </g>
          ))}
          <ellipse cx={-90} cy={-200} rx={60} ry={180} fill="#FFFFFF" opacity={0.08} />
        </g>
      </svg>
      {/* o mosquito pousando na folha */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(${interpolate(pousa, [0, 1], [880, 580])} ${interpolate(pousa, [0, 1], [500, 900])}) scale(7)`}>
          <ellipse cx={-7} cy={-7} rx={10} ry={frame % 2 ? 4 : 2} fill="#FFFFFF" opacity={0.55} transform="rotate(-30)" />
          <ellipse cx={7} cy={-7} rx={10} ry={frame % 2 ? 4 : 2} fill="#FFFFFF" opacity={0.55} transform="rotate(30)" />
          <ellipse cx={0} cy={2} rx={3.2} ry={11} fill="#17130F" />
          <circle cx={0} cy={-10} r={3.4} fill="#17130F" />
          <line x1={0} y1={-12} x2={0} y2={-26} stroke="#17130F" strokeWidth={1.4} />
          {[-1, 1].map((l) => (
            <g key={l} stroke="#17130F" strokeWidth={0.9} fill="none">
              <path d={`M0 0 l${l * 12} 6 l${l * 3} 12`} />
              <path d={`M0 3 l${l * 10} 10 l${l * 1} 12`} />
              <path d={`M0 -3 l${l * 12} -2 l${l * 6} 8`} />
            </g>
          ))}
          {[1, 2, 3, 4].map((k) => (
            <line key={k} x1={-3} y1={-4 + k * 3.4} x2={3} y2={-4 + k * 3.4} stroke="#EDE6D6" strokeWidth={0.8} />
          ))}
        </g>
      </svg>
      <Mosquitos n={6} semente="enxame" area={{ x: 100, y: 300, w: 880, h: 700 }} tamanho={1.6} />
    </Camera>
  );
};

const Mosquiteiro: React.FC<{ furo: number }> = ({ furo }) => {
  const frame = useCurrentFrame();
  const t = frame - furo;
  const r = interpolate(t, [0, 8], [0, 42], CLAMP);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <pattern id="tela" width="18" height="18" patternUnits="userSpaceOnUse">
          <path d="M0 0 L18 18 M18 0 L0 18" stroke="#F3F6FF" strokeWidth="1.4" opacity="0.5" />
        </pattern>
        <mask id="furo">
          <rect width="1080" height="1920" fill="white" />
          <circle cx="720" cy="1000" r={r} fill="black" />
        </mask>
      </defs>
      <g mask="url(#furo)">
        <path d="M200 600 L880 600 L960 1640 L120 1640 Z" fill="#DDE6FF" opacity="0.13" />
        <path d="M200 600 L880 600 L960 1640 L120 1640 Z" fill="url(#tela)" />
      </g>
      <path d="M200 600 L880 600 L960 1640 L120 1640 Z" fill="none" stroke="#DDE6FF" strokeOpacity={0.5} strokeWidth={4} />
      {t >= 0 ? <circle cx="720" cy="1000" r={r + 26} fill="none" stroke={COR.vermelho} strokeWidth={9} opacity={interpolate(t, [0, 6], [0, 1], CLAMP)} /> : null}
    </svg>
  );
};

const Noite: Cena = ({ em }) => {
  const p = PALETAS.noite;
  const frame = useCurrentFrame();
  const furo = em("furo");
  const febre = em("febre");
  const entrando = interpolate(frame, [furo + 8, febre], [0, 1], CLAMP);
  const close = frame >= em("um");
  return (
    <Camera
      de={close ? 1.25 : 1}
      ate={close ? 1.4 : 1.06}
      origem={close ? "66% 52%" : "50% 50%"}
      hud={<Calendario ano="1909" hora="18:10" />}
    >
      <Ceu p={p} horizonteY={1200} />
      <Sol p={p} x={820} y={420} raio={60} raios={false} />
      <Plano blur={4}>
        <Morros cor={p.longe} y={1200} semente="n-longe" />
        <Arvores cor={p.meio} y={1280} escala={1.2} semente="n-meio" />
      </Plano>
      <Chao cor={p.chao} y={1500} />
      {/* lampião: luz quente no meio do azul */}
      <div style={{ position: "absolute", left: 30, top: 1200, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,190,90,0.55), transparent 65%)" }} />
      <div style={{ position: "absolute", left: 250, top: 1420, width: 40, height: 60, borderRadius: 10, backgroundColor: "#FFD27A", boxShadow: "0 0 40px 18px rgba(255,190,90,0.6)" }} />
      <div style={{ position: "absolute", left: 300, top: 1000 }}>
        <Boneco
          emocao={frame >= febre ? "scared" : "worried"}
          tint={p.ceuMeio}
          luz="#FFC27A"
          ladoLuz="esq"
          olhar={frame >= furo ? 1 : 0}
          chapeu={false}
          doente={frame >= febre + 6}
          largura={440}
          semente="noite"
        />
      </div>
      <Mosquiteiro furo={furo} />
      <Mosquitos n={1} semente="invasor" area={{ x: interpolate(entrando, [0, 1], [740, 560]), y: interpolate(entrando, [0, 1], [970, 1090]), w: 30, h: 30 }} tamanho={3} />
      <Mosquitos n={5} semente="noite-fora" area={{ x: 760, y: 700, w: 280, h: 500 }} tamanho={1.6} />
      <Particulas cor="#E8FF8A" n={16} semente="vagalume" brilho />
    </Camera>
  );
};

const Fileiras: Cena = ({ em }) => {
  const p = PALETAS.doenca;
  const frame = useCurrentFrame();
  const adoece = em("malária");
  const filas = [
    { y: 1080, n: 9, l: 120 },
    { y: 1170, n: 8, l: 150 },
    { y: 1280, n: 7, l: 185 },
    { y: 1420, n: 5, l: 240 },
  ];
  return (
    <Camera
      hud={
        <>
          <Contador ate={5000} y={420} inicio={em("cinco", 1)} duracao={22} sufixo="+" rotulo="TRABALHADORES" />
          <Calendario ano="1911" />
        </>
      }
    >
      <Cenario p={p} horizonte={1080} sol={{ x: 820, y: 860, r: 70, raios: false }} pan={0.3} arvoresY={1120} />
      <Chao cor={p.chao} y={1160} />
      {filas.map((fila, fi) =>
        Array.from({ length: fila.n }).map((_, i) => {
          const chave = `${fi}-${i}`;
          const doente = frame >= adoece + Math.floor(random(`atraso${chave}`) * 16) && random(`sorte${chave}`) < 0.9;
          const x = 540 + (i - (fila.n - 1) / 2) * (fila.l * 0.82) - fila.l / 2;
          return (
            <div key={chave} style={{ position: "absolute", left: x, top: fila.y - fila.l * 0.5, filter: fi === 0 ? "blur(2px)" : undefined }}>
              <Boneco emocao={doente ? "tired" : "neutral"} doente={doente} tint={p.ceuMeio} luz={p.luz} largura={fila.l} semente={`fila${chave}`} />
            </div>
          );
        }),
      )}
      <Mosquitos n={10} semente="fileira" area={{ x: 60, y: 900, w: 960, h: 700 }} tamanho={1.4} />
    </Camera>
  );
};

const Dormentes: Cena = ({ em }) => {
  const p = PALETAS.porDoSol;
  return (
    <Camera
      de={1.05}
      ate={1}
      hud={
        <>
          <Bilhete x={250} y={820} largura={580} rot={-6} inicio={em("dormente") - 4} tamanho={88}>
            1 dormente
            <br />= 1 vida?
          </Bilhete>
          <Carimbo texto="EXAGERO" x={300} y={1090} inicio={em("exagero")} />
        </>
      }
    >
      <Ceu p={p} horizonteY={760} />
      <Sol p={p} x={540} y={720} raio={70} />
      <Plano blur={4}>
        <Arvores cor={p.meio} y={800} escala={0.9} semente="d-meio" />
      </Plano>
      <Trilho horizonteY={780} ate={30} />
      <Particulas cor={p.sol} n={18} semente="dormente" />
    </Camera>
  );
};

const Cruz: React.FC<{ x: number; y: number; s: number; cor: string }> = ({ x, y, s, cor }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill={cor} stroke={COR.escuro} strokeWidth={4}>
    <rect x={-9} y={-120} width={18} height={130} />
    <rect x={-42} y={-92} width={84} height={16} />
  </g>
);

const Cruzes: Cena = ({ em }) => {
  const p = PALETAS.noite;
  const frame = useCurrentFrame();
  const visiveis = interpolate(frame, [0, em("mortos")], [0.25, 1], CLAMP);
  const cruzes: React.ReactNode[] = [];
  for (let fila = 0; fila < 7; fila++) {
    const s = 0.35 + fila * 0.18;
    const y = 1080 + fila * fila * 14 + fila * 40;
    const n = 12 - fila;
    for (let i = 0; i < n; i++) {
      const ordem = (fila * 12 + i) / 84;
      if (ordem > visiveis) continue;
      const x = 540 + (i - (n - 1) / 2) * (100 * s * 1.6) + (random(`cz${fila}${i}`) - 0.5) * 20;
      cruzes.push(<Cruz key={`${fila}-${i}`} x={x} y={y} s={s} cor={misturar("#6B5A48", p.horizonte, 0.4)} />);
    }
  }
  return (
    <Camera hud={<Contador ate={6000} y={430} inicio={em("seis")} duracao={20} rotulo="MORTOS · ESTIMATIVA" cor={COR.creme} />}>
      <Ceu p={p} horizonteY={1060} />
      <Sol p={p} x={300} y={520} raio={55} raios={false} />
      <Plano blur={5}>
        <Arvores cor={p.meio} y={1080} escala={1.1} semente="c-meio" />
      </Plano>
      <Chao cor={p.chao} y={1060} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {cruzes}
      </svg>
      <Nevoa cor={p.nevoa} y={1150} altura={420} opacidade={0.45} />
    </Camera>
  );
};

const Locomotiva: React.FC<{ x: number; y: number; luz: string }> = ({ x, y, luz }) => {
  const frame = useCurrentFrame();
  const giro = frame * 9;
  return (
    <div style={{ position: "absolute", left: x, top: y }}>
      {Array.from({ length: 6 }).map((_, i) => {
        const t = ((frame + i * 10) % 60) / 60;
        return (
          <div key={i} style={{ position: "absolute", left: 120 + t * 160, top: -40 - t * 260, width: 60 + t * 120, height: 60 + t * 120, borderRadius: "50%", backgroundColor: "#E8D8C8", opacity: (1 - t) * 0.6, filter: "blur(8px)" }} />
        );
      })}
      <svg width={620} height={360} viewBox="0 0 620 360" style={{ overflow: "visible" }}>
        <g fill={COR.escuro} stroke={luz} strokeWidth={4}>
          <rect x={60} y={120} width={330} height={130} rx={50} />
          <rect x={120} y={40} width={50} height={90} />
          <path d="M100 40 L190 40 L180 60 L110 60 Z" />
          <rect x={380} y={60} width={170} height={190} rx={10} />
          <rect x={360} y={40} width={210} height={30} rx={8} />
          <path d="M20 250 L70 190 L70 260 Z" />
        </g>
        <rect x={410} y={90} width={60} height={60} fill={luz} opacity={0.85} />
        {[130, 250, 470].map((cx) => (
          <g key={cx} transform={`rotate(${giro} ${cx} 280)`}>
            <circle cx={cx} cy={280} r={58} fill={COR.escuro} stroke={luz} strokeWidth={4} />
            <line x1={cx - 50} y1={280} x2={cx + 50} y2={280} stroke={luz} strokeWidth={6} />
            <line x1={cx} y1={230} x2={cx} y2={330} stroke={luz} strokeWidth={6} />
          </g>
        ))}
        <circle cx={20} cy={170} r={22} fill="#FFE9A8" />
      </svg>
    </div>
  );
};

const Grafico: React.FC<{ inicio: number }> = ({ inicio }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [inicio + 8, inicio + 40], [0, 1], { ...CLAMP, easing: Easing.inOut(Easing.cubic) });
  const pontos = [
    [0, 40], [90, 20], [170, 10], [240, 60], [320, 150], [400, 230], [470, 280],
  ];
  const d = pontos.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
  return (
    <Bilhete x={150} y={560} largura={780} rot={-3} inicio={inicio} tamanho={74}>
      Preço da borracha
      <svg width={520} height={320} viewBox="-10 -10 520 320" style={{ display: "block", marginTop: 10 }}>
        <line x1={0} y1={300} x2={500} y2={300} stroke="#2A2230" strokeWidth={4} />
        <line x1={0} y1={0} x2={0} y2={300} stroke="#2A2230" strokeWidth={4} />
        <path d={d} stroke={COR.vermelho} strokeWidth={10} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - t} />
        {t > 0.95 ? <path d="M470 280 l-40 -6 l26 -30 Z" fill={COR.vermelho} /> : null}
      </svg>
    </Bilhete>
  );
};

const Chegada: Cena = ({ em }) => {
  const p = PALETAS.porDoSol;
  const frame = useCurrentFrame();
  const corte = em("borracha") - 6;
  if (frame >= corte) {
    return (
      <Camera de={1} ate={1.05} hud={<Grafico inicio={corte} />}>
        <Ceu p={PALETAS.doenca} horizonteY={1500} />
        <Plano blur={12}>
          <Arvores cor={PALETAS.doenca.meio} y={1400} escala={1.4} semente="g-fundo" quantidade={7} />
        </Plano>
      </Camera>
    );
  }
  const x = interpolate(frame, [0, corte], [1100, 330], { ...CLAMP, easing: Easing.out(Easing.cubic) });
  return (
    <Camera hud={<Calendario ano="1912" inicio={em("doze") - 4} />}>
      <Ceu p={p} horizonteY={1180} />
      <Sol p={p} x={300} y={1080} raio={110} />
      <Morros cor={p.longe} y={1180} semente="ch-longe" />
      <Nevoa cor={p.nevoa} y={1170} />
      <Plano blur={2}>
        <Arvores cor={p.meio} y={1240} escala={0.9} semente="ch-meio" />
      </Plano>
      <Chao cor={p.chao} y={1340} />
      <div style={{ position: "absolute", left: -100, right: -100, top: 1330, height: 18, backgroundColor: "#C9CDD4", borderBottom: `10px solid ${COR.escuro}` }} />
      <Locomotiva x={x} y={980} luz={p.luz} />
      <Plano blur={7}>
        <Folhagem cor={p.perto} semente="chegada" />
      </Plano>
    </Camera>
  );
};

const Escolha: Cena = ({ em }) => {
  const p = PALETAS.porDoSol;
  const frame = useCurrentFrame();
  return (
    <Camera
      de={1}
      ate={1.08}
      origem="50% 70%"
      hud={
        <>
          <Pilula x={-250} y={640} inicio={em("trilho")} tamanho={84}>
            TRILHO
          </Pilula>
          <Pilula x={250} y={640} inicio={em("barco", 2)} tamanho={84} cor={COR.amarelo}>
            BARCO
          </Pilula>
        </>
      }
    >
      <Ceu p={p} horizonteY={1100} />
      <Sol p={p} x={760} y={1030} raio={90} />
      <Morros cor={p.longe} y={1100} semente="e-longe" />
      {/* rio com reflexo e um barco indo embora */}
      <div style={{ position: "absolute", left: -100, right: -100, top: 1100, height: 300, background: `linear-gradient(180deg, ${p.horizonte}, ${p.ceuMeio})` }} />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ position: "absolute", left: 560 + Math.sin(frame / 10 + i) * 30, top: 1120 + i * 34, width: 400 - i * 40, height: 6, backgroundColor: p.sol, opacity: 0.5 }} />
      ))}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(${880 - frame * 0.8} 1150)`} fill={COR.escuro}>
          <path d="M-90 0 L90 0 L60 30 L-60 30 Z" />
          <rect x={-10} y={-80} width={10} height={80} />
          <path d="M0 -80 L60 -10 L0 -10 Z" />
        </g>
      </svg>
      <Arvores cor={p.meio} y={1400} escala={1.1} semente="e-meio" quantidade={10} />
      <div style={{ position: "absolute", left: 190, top: 900 }}>
        <Boneco emocao="determined" tint={p.ceuMeio} luz={p.luz} ladoLuz="dir" olhar={frame > em("barco", 1) ? 1 : 0} largura={700} semente="escolha" />
      </div>
    </Camera>
  );
};

const CENAS: Cena[] = [Cartela, Amanhecer, Trilhos366, Quinino, MeioDia, Mosquito, Noite, Fileiras, Dormentes, Cruzes, Chegada, Escolha];

/* ───────────────────────────── vídeo ───────────────────────────── */

export const FerroviaDoDiabo: React.FC<Props> = ({ legendas, falas, audio }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const f = (ms: number) => Math.round((ms / 1000) * fps);

  // início de cada cena = começo da fala (a primeira começa no frame 0)
  const inicios = falas.map((fala, i) => (i === 0 ? 0 : f(fala.startMs)));

  // quedas da chance: palavra → novo valor
  const palavraEm = (fala: number, palavra: string) => {
    const c = legendas.find((l) => l.startMs >= falas[fala].startMs && limpa(l.text).startsWith(limpa(palavra)));
    if (!c) throw new Error(`queda: "${palavra}" não encontrada`);
    return f(c.startMs);
  };
  const quedas: Queda[] = [
    { em: palavraEm(4, "calor"), para: 82 },
    { em: palavraEm(5, "mosquito."), para: 61 },
    { em: palavraEm(6, "febre"), para: 40 },
    { em: palavraEm(7, "malária"), para: 18 },
    { em: palavraEm(9, "mortos"), para: 6 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: COR.escuro }}>
      <Acabamento>
        {CENAS.map((CenaAtual, i) => {
          const de = inicios[i];
          const ate = i + 1 < inicios.length ? inicios[i + 1] : durationInFrames;
          const em = relogio(legendas, falas[i], (de / fps) * 1000, fps);
          return (
            <Sequence key={i} name={`Cena ${i + 1}: ${falas[i].texto.slice(0, 40)}`} from={de} durationInFrames={ate - de}>
              <CenaAtual em={em} dur={ate - de} />
            </Sequence>
          );
        })}
      </Acabamento>

      {frame >= inicios[1] ? <BarraChance quedas={quedas} frameVideo={frame} aparece={inicios[1]} /> : null}
      {quedas.map((q) => (
        <FlashPerigo key={q.em} em={q.em} frameVideo={frame} />
      ))}

      {/* sem legenda na cartela: o título já está escrito na tela */}
      <Legendas legendas={legendas.filter((c) => c.startMs >= falas[1].startMs)} fundo={400} tamanho={84} />
      <Audio name="Narração" src={staticFile(audio)} />
    </AbsoluteFill>
  );
};
