import type { Caption } from "@remotion/captions";
import { Audio, Video } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Fala } from "./FerroviaDoDiabo";
import { BonecoNanquim, CartelaSecao, Escrita, Papel, POSES, TINTA, Traco } from "./ensaio/Nanquim";

type Clipe = { id: number; autor: string };
type Props = {
  readonly legendas: Caption[];
  readonly falas: Fala[];
  /** fala → vídeos do Pixabay (vem de roteiros/<nome>.broll.json) */
  readonly broll: Partial<Record<string, Clipe[]>>;
  readonly audio: string;
  readonly trilha: string;
};

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const FUSAO = 8; // frames de fusão entre um plano e o próximo

const limpa = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
const relogio = (legendas: Caption[], fala: Fala, inicioCenaMs: number, fps: number) => (palavra: string, ocorrencia = 1) => {
  let n = 0;
  for (const c of legendas) {
    if (c.startMs < fala.startMs || c.startMs > fala.endMs) continue;
    if (limpa(c.text).startsWith(limpa(palavra)) && ++n === ocorrencia) return Math.round(((c.startMs - inicioCenaMs) / 1000) * fps);
  }
  throw new Error(`"${palavra}" não encontrada na fala ${fala.fala}: ${fala.texto}`);
};
type Em = (palavra: string, ocorrencia?: number) => number;

/* ─────────────── plano de vídeo de banco ─────────────── */

/** Vídeo de banco com zoom lento (Ken Burns) e cor levemente quente, como na referência. */
const PlanoVideo: React.FC<{ clipes: Clipe[]; indice: number }> = ({ clipes, indice }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fatia = Math.ceil(durationInFrames / clipes.length);
  const aproximando = indice % 2 === 0;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {clipes.map((c, k) => (
        <Sequence key={k} name={`Pixabay ${c.id} (${c.autor})`} from={k * fatia} durationInFrames={k === clipes.length - 1 ? undefined : fatia}>
          <AbsoluteFill
            style={{
              scale: String(interpolate(frame - k * fatia, [0, fatia], aproximando ? [1.0, 1.07] : [1.07, 1.0], CLAMP)),
              filter: "saturate(1.04) contrast(1.03) sepia(0.06) brightness(1.02)",
            }}
          >
            <Video src={staticFile(`broll/${c.id}.mp4`)} muted trimBefore={12} objectFit="cover" style={{ width: "100%", height: "100%" }} />
          </AbsoluteFill>
        </Sequence>
      ))}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 62%, rgba(0,0,0,0.28) 100%)" }} />
    </AbsoluteFill>
  );
};

/* ─────────────── cenas a nanquim ─────────────── */

const AmbicaoPreguica: React.FC<{ em: Em }> = ({ em }) => (
  <Papel>
    <Escrita x={80} y={170} largura={700} tamanho={124} inicio={FUSAO}>
      AMBIÇÃO
    </Escrita>
    <Escrita x={1140} y={170} largura={700} tamanho={124} inicio={em("preguiça")}>
      PREGUIÇA
    </Escrita>
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <Traco d="M430 330 Q560 470 760 540" inicio={FUSAO + 10} duracao={16} />
      <Traco d="M740 525 l28 20 l-34 6" inicio={FUSAO + 24} duracao={6} />
      <Traco d="M1490 330 Q1360 470 1160 540" inicio={em("preguiça") + 10} duracao={16} />
      <Traco d="M1180 525 l-28 20 l34 6" inicio={em("preguiça") + 24} duracao={6} />
      <Traco d="M520 150 Q960 -30 1400 150" inicio={em("mesma")} duracao={22} largura={6} />
      <Traco d="M1370 125 l32 26 l-40 8" inicio={em("mesma") + 20} duracao={6} largura={6} />
      <Traco d="M550 125 l-32 26 l40 8" inicio={em("mesma") + 20} duracao={6} largura={6} />
    </svg>
    <BonecoNanquim pose={POSES.empe} x={735} y={360} escala={1.1} />
    <Escrita y={935} tamanho={76} inicio={em("mesma") + 10}>
      a mesma coisa, de lados diferentes
    </Escrita>
  </Papel>
);

const Montanha: React.FC<{ em: Em }> = ({ em }) => (
  <Papel>
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <Traco d="M60 1000 L560 520 L760 640 L1180 140 L1520 560 L1660 470 L1880 1000" inicio={FUSAO} duracao={34} largura={10} />
      <Traco d="M1180 140 L1180 30 L1290 60 L1180 90" inicio={em("topo") - 4} duracao={12} largura={8} />
      <Traco d="M1100 240 l40 -30 l40 30 M980 380 l35 -25 l35 25" inicio={FUSAO + 20} duracao={12} largura={5} />
      {/* primeiro passo: pegadinhas minúsculas */}
      <Traco d="M330 985 l14 0 M362 975 l14 0 M394 985 l14 0" inicio={em("primeiro")} duracao={10} largura={7} />
      <Traco d="M450 900 Q420 950 400 965" inicio={em("primeiro") + 8} duracao={8} largura={4} />
    </svg>
    <Escrita x={1240} y={60} largura={500} alinhar="left" tamanho={82} inicio={em("topo")}>
      o topo
    </Escrita>
    <BonecoNanquim pose={POSES.empe} x={220} y={850} escala={0.28} />
    <Escrita x={430} y={820} largura={600} alinhar="left" tamanho={64} inicio={em("primeiro") + 4}>
      1º passo
    </Escrita>
  </Papel>
);

const ContaDoCerebro: React.FC<{ em: Em }> = ({ em }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const deita = spring({ frame: frame - em("nada"), fps, config: { damping: 14 } });
  return (
    <Papel>
      <Escrita x={160} y={150} largura={1200} alinhar="left" tamanho={96} inicio={FUSAO}>
        a conta do cérebro:
      </Escrita>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <Traco d="M160 290 Q700 270 1240 292" inicio={FUSAO + 14} duracao={14} largura={6} />
      </svg>
      <Escrita x={200} y={360} largura={1400} alinhar="left" tamanho={104} inicio={em("pequeno")}>
        o pequeno não resolve
      </Escrita>
      <Escrita x={200} y={560} largura={1400} alinhar="left" tamanho={104} inicio={em("melhor")}>
        então... nada.
      </Escrita>
      <div style={{ opacity: deita, translate: `${(1 - deita) * 80}px 0px` }}>
        <BonecoNanquim pose={POSES.deitado} x={1260} y={330} escala={1.2} />
      </div>
    </Papel>
  );
};

const HojeAmanha: React.FC<{ em: Em }> = ({ em }) => {
  const brilho = em("amanhã");
  return (
    <Papel>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <Traco d="M960 120 L960 980" inicio={FUSAO} duracao={16} largura={5} />
        <g>
          {Array.from({ length: 9 }).map((_, i) => {
            const a = (i / 9) * Math.PI * 2;
            return (
              <Traco
                key={i}
                d={`M${1450 + Math.cos(a) * 330} ${590 + Math.sin(a) * 330} L${1450 + Math.cos(a) * 390} ${590 + Math.sin(a) * 390}`}
                inicio={brilho + i * 2}
                duracao={8}
                largura={6}
              />
            );
          })}
        </g>
      </svg>
      <Escrita x={0} y={120} largura={960} tamanho={84} inicio={FUSAO}>
        você hoje
      </Escrita>
      <Escrita x={960} y={120} largura={960} tamanho={84} inicio={brilho}>
        você de amanhã
      </Escrita>
      <BonecoNanquim pose={POSES.curvado} x={240} y={330} escala={1.25} />
      <BonecoNanquim pose={POSES.heroi} x={1200} y={310} escala={1.25} />
    </Papel>
  );
};

const Zeigarnik: React.FC<{ em: Em }> = ({ em }) => {
  const frame = useCurrentFrame();
  const z = em("zeigarnik");
  // círculo que nunca fecha: a tarefa pela metade
  const arco = interpolate(frame, [z + 6, z + 40], [0, 300], CLAMP);
  const ang = (arco * Math.PI) / 180;
  const cx = 1180;
  const cy = 380;
  const r = 150;
  const fimX = cx + r * Math.cos(ang - Math.PI / 2);
  const fimY = cy + r * Math.sin(ang - Math.PI / 2);
  return (
    <Papel>
      <Escrita x={120} y={110} largura={1700} tamanho={112} inicio={FUSAO}>
        efeito Zeigarnik
      </Escrita>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <Traco d="M560 250 Q960 232 1360 252" inicio={FUSAO + 16} duracao={12} largura={6} />
        {/* balão de pensamento */}
        <circle cx={780} cy={560} r={14} fill="none" stroke={TINTA} strokeWidth={5} opacity={frame > z ? 1 : 0} />
        <circle cx={850} cy={500} r={22} fill="none" stroke={TINTA} strokeWidth={5} opacity={frame > z + 3 ? 1 : 0} />
        {arco > 0 ? (
          <path
            d={`M${cx} ${cy - r} A${r} ${r} 0 ${arco > 180 ? 1 : 0} 1 ${fimX} ${fimY}`}
            stroke={TINTA}
            strokeWidth={14}
            strokeLinecap="round"
            fill="none"
          />
        ) : null}
      </svg>
      <Escrita x={1400} y={330} largura={500} alinhar="left" tamanho={60} inicio={em("começou")}>
        começou...
      </Escrita>
      <Escrita x={1400} y={420} largura={500} alinhar="left" tamanho={60} inicio={em("terminou")}>
        ...não terminou
      </Escrita>
      <BonecoNanquim pose={POSES.sentado} x={330} y={430} escala={1.2} />
    </Papel>
  );
};

const Corrente: React.FC<{ em: Em }> = ({ em }) => {
  const frame = useCurrentFrame();
  const col = 7;
  const lado = 170;
  const x0 = (1920 - col * lado) / 2;
  const y0 = 300;
  const dias = Array.from({ length: col * 2 }, (_, i) => ({ x: x0 + (i % col) * lado, y: y0 + Math.floor(i / col) * lado }));
  const marcados = Math.min(9, Math.floor(interpolate(frame, [FUSAO + 6, em("corrente")], [0, 9.99], CLAMP)));
  return (
    <Papel>
      <Escrita y={110} tamanho={92} inicio={FUSAO}>
        dias em que você apareceu
      </Escrita>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {dias.map((d, i) => (
          <rect key={i} x={d.x + 8} y={d.y + 8} width={lado - 16} height={lado - 16} rx={10} fill="none" stroke={TINTA} strokeWidth={5} />
        ))}
        {dias.slice(0, marcados).map((d, i) => (
          <g key={i} stroke={TINTA} strokeWidth={12} strokeLinecap="round">
            <path d={`M${d.x + 40} ${d.y + 40} L${d.x + lado - 40} ${d.y + lado - 40}`} />
            <path d={`M${d.x + lado - 40} ${d.y + 40} L${d.x + 40} ${d.y + lado - 40}`} />
          </g>
        ))}
      </svg>
      <Escrita y={720} tamanho={104} inicio={em("corrente")}>
        não quebre a corrente
      </Escrita>
    </Papel>
  );
};

const Final: React.FC<{ em: Em }> = ({ em }) => (
  <Papel>
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      {/* mesa (na altura das mãos) e cadeira */}
      <Traco d="M520 600 L880 600 M560 600 L560 860 M850 600 L850 860" inicio={FUSAO} duracao={18} largura={9} />
      <Traco d="M600 560 L790 552 L796 594 L604 598 Z" inicio={FUSAO + 10} duracao={14} largura={5} />
      <Traco d="M250 650 L440 650 M270 650 L270 860 M420 650 L420 860 M250 650 L250 470" inicio={FUSAO + 4} duracao={16} largura={8} />
    </svg>
    <BonecoNanquim pose={POSES.sentado} x={190} y={300} escala={1.1} />
    <Escrita x={900} y={250} largura={980} tamanho={96} inicio={em("qual")}>
      qual vai ser a sua
      <br />
      tarefa ridícula
      <br />
      de amanhã?
    </Escrita>
    <Escrita x={900} y={720} largura={980} tamanho={70} inicio={em("comenta")}>
      comenta aqui embaixo ↓
    </Escrita>
  </Papel>
);

const NANQUIM: Partial<Record<number, React.FC<{ em: Em }>>> = {
  5: AmbicaoPreguica,
  6: Montanha,
  9: ContaDoCerebro,
  11: HojeAmanha,
  14: () => <CartelaSecao numero="1" titulo="Diminua a tarefa" pose={POSES.empe} />,
  19: Zeigarnik,
  20: () => <CartelaSecao numero="2" titulo="Tire as decisões do caminho" pose={POSES.heroi} />,
  24: () => <CartelaSecao numero="3" titulo="Meça presença, não resultado" pose={POSES.empe} />,
  27: Corrente,
  28: () => <CartelaSecao numero="4" titulo="Vai ter dia ruim" pose={POSES.curvado} />,
  38: Final,
};

/** Fusão de entrada de cada plano. */
const Fusao: React.FC<{ children: React.ReactNode; ativa: boolean }> = ({ children, ativa }) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: ativa ? interpolate(frame, [0, FUSAO], [0, 1], CLAMP) : 1 }}>{children}</AbsoluteFill>;
};

export const AmbiciosoPreguicoso: React.FC<Props> = ({ legendas, falas, broll, audio, trilha }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const inicio = (i: number) => (i === 0 ? 0 : Math.round((falas[i].startMs / 1000) * fps) - FUSAO);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {falas.map((fala, i) => {
        const de = inicio(i);
        const ate = i + 1 < falas.length ? inicio(i + 1) + FUSAO : durationInFrames;
        const em = relogio(legendas, fala, (de / fps) * 1000, fps);
        const Desenho = NANQUIM[i];
        const clipes = broll[String(i)];
        if (!Desenho && !clipes) throw new Error(`Fala ${i} sem vídeo e sem desenho: ${fala.texto}`);
        return (
          <Sequence key={i} name={`${i + 1}. ${Desenho ? "[nanquim]" : "[vídeo]"} ${fala.texto.slice(0, 40)}`} from={de} durationInFrames={ate - de}>
            <Fusao ativa={i > 0}>{Desenho ? <Desenho em={em} /> : <PlanoVideo clipes={clipes ?? []} indice={i} />}</Fusao>
          </Sequence>
        );
      })}
      <Audio name="Narração" src={staticFile(audio)} />
      <Audio name="Trilha" src={staticFile(trilha)} volume={0.16} />
    </AbsoluteFill>
  );
};
