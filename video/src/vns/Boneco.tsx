import React from "react";
import { random, useCurrentFrame } from "remotion";
import { COR, misturar } from "./estilo";

export type Emocao = "worried" | "scared" | "shock" | "determined" | "tired" | "happy" | "back" | "neutral";

type Props = {
  readonly emocao?: Emocao;
  /** Cor da cena aplicada de leve sobre o boneco. */
  readonly tint?: string;
  /** Cor da luz de recorte (vem do sol/lampião). */
  readonly luz?: string;
  readonly ladoLuz?: "esq" | "dir";
  /** -1 olha para a esquerda, 1 para a direita. */
  readonly olhar?: number;
  readonly chapeu?: boolean;
  readonly picareta?: boolean;
  readonly suor?: boolean;
  /** Pele esverdeada e olheira (doente). */
  readonly doente?: boolean;
  readonly semente?: string;
  readonly largura?: number;
  readonly style?: React.CSSProperties;
};

/** Pálpebra de cima: quanto cobre (0–1) e inclinação (graus, + = canto de dentro mais baixo). */
const PALPEBRA: Record<Emocao, { cobre: number; inclina: number; escala: number; pupila: number; baixo: number }> = {
  neutral: { cobre: 0.12, inclina: 0, escala: 1, pupila: 8, baixo: 0 },
  worried: { cobre: 0.3, inclina: -22, escala: 1, pupila: 8, baixo: 0 },
  scared: { cobre: 0, inclina: 0, escala: 1.14, pupila: 6, baixo: 0 },
  shock: { cobre: 0, inclina: 0, escala: 1.3, pupila: 4, baixo: 0 },
  determined: { cobre: 0.38, inclina: 20, escala: 1, pupila: 8, baixo: 0.1 },
  tired: { cobre: 0.52, inclina: -4, escala: 1, pupila: 8, baixo: 0.12 },
  happy: { cobre: 0.08, inclina: 0, escala: 1, pupila: 8, baixo: 0.42 },
  back: { cobre: 0, inclina: 0, escala: 1, pupila: 0, baixo: 0 },
};

/**
 * Boneco do canal (modelo v3): cabeça redonda escura, olhos brancos grandes com pálpebras de emoção,
 * luz de recorte na borda e tint da cor da cena. Pisca sozinho de vez em quando.
 */
export const Boneco: React.FC<Props> = ({
  emocao = "neutral",
  tint = "#000000",
  luz = "#FFD9A0",
  ladoLuz = "esq",
  olhar = 0,
  chapeu = true,
  picareta = false,
  suor = false,
  doente = false,
  semente = "voce",
  largura = 300,
  style,
}) => {
  const frame = useCurrentFrame();
  const pele = misturar(doente ? "#25301F" : COR.pele, tint, 0.16);
  const p = PALPEBRA[emocao];
  const lado = ladoLuz === "esq" ? -1 : 1;

  // piscada: a cada ~3 s, dura 5 frames
  const ciclo = 80 + Math.floor(random(`pisca-${semente}`) * 40);
  const fase = (frame + Math.floor(random(`fase-${semente}`) * ciclo)) % ciclo;
  const piscando = fase < 5 && emocao !== "shock";
  const cobre = piscando ? 1 : p.cobre;
  const id = `b-${semente}`;

  const Olho: React.FC<{ cx: number; espelho: 1 | -1 }> = ({ cx, espelho }) => {
    const rx = 17 * p.escala;
    const ry = 22 * p.escala;
    const cy = 86;
    const topo = cy - ry;
    const alturaPalpebra = ry * 2 * cobre;
    if (piscando) {
      // olho fechado: só um traço curvo (sem o anel do branco aparecendo)
      return <path d={`M${cx - rx} ${cy + 2} Q${cx} ${cy + 12} ${cx + rx} ${cy + 2}`} stroke="#FFFDF5" strokeWidth={5} strokeLinecap="round" fill="none" />;
    }
    return (
      <g>
        <clipPath id={`${id}-olho-${cx}`}>
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} />
        </clipPath>
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#FFFDF5" />
        <g clipPath={`url(#${id}-olho-${cx})`}>
          <circle cx={cx + olhar * 6} cy={cy + 3} r={p.pupila} fill={COR.escuro} />
          {/* pálpebra de cima, inclinada conforme a emoção */}
          <rect
            x={cx - rx - 10}
            y={topo - 60 + alturaPalpebra}
            width={rx * 2 + 20}
            height={60}
            fill={pele}
            transform={`rotate(${p.inclina * espelho} ${cx} ${cy})`}
          />
          {/* pálpebra de baixo (sorriso nos olhos / cansaço) */}
          {p.baixo > 0 && !piscando ? (
            <ellipse cx={cx} cy={cy + ry + 14 - ry * 2 * p.baixo} rx={rx + 8} ry={18} fill={pele} />
          ) : null}
        </g>
        {doente ? <path d={`M${cx - 14} ${cy + ry + 6} q14 8 28 0`} stroke="#4E5A2E" strokeWidth={5} fill="none" /> : null}
      </g>
    );
  };

  return (
    <svg viewBox="0 0 200 300" width={largura} height={largura * 1.5} style={{ overflow: "visible", ...style }}>
      {/* picareta atrás do corpo */}
      {picareta ? (
        <g transform="rotate(-28 160 190)">
          <rect x={154} y={110} width={10} height={170} rx={4} fill="#6B4A2B" />
          <path d="M112 118 Q160 92 208 118 L204 128 Q160 106 116 128 Z" fill="#9AA0A8" stroke="#3A3F46" strokeWidth={3} />
        </g>
      ) : null}

      {/* luz de recorte: a mesma forma em cor clara, deslocada para o lado da luz */}
      <g fill={luz}>
        <circle cx={100 + lado * 5} cy={84} r={62} />
        <path d={`M${40 + lado * 5} 300 Q${40 + lado * 5} 150 ${100 + lado * 5} 146 Q${160 + lado * 5} 150 ${160 + lado * 5} 300 Z`} />
      </g>
      <g fill={pele}>
        <path d="M40 300 Q40 150 100 146 Q160 150 160 300 Z" />
        <circle cx={100} cy={84} r={62} />
      </g>

      {emocao !== "back" ? (
        <>
          <Olho cx={78} espelho={1} />
          <Olho cx={122} espelho={-1} />
        </>
      ) : null}

      {chapeu ? (
        <g>
          <ellipse cx={100} cy={40} rx={92} ry={18} fill={misturar("#C9A25A", tint, 0.25)} stroke={COR.escuro} strokeWidth={5} />
          <path d="M52 40 Q56 -2 100 -4 Q144 -2 148 40 Z" fill={misturar("#D9B46A", tint, 0.25)} stroke={COR.escuro} strokeWidth={5} />
          <path d="M54 30 Q100 22 146 30" stroke="#7A3B22" strokeWidth={8} fill="none" />
        </g>
      ) : null}

      {suor ? (
        <g fill="#BFE6FF" opacity={0.9}>
          {[0, 1].map((i) => {
            const y = ((frame * 1.6 + i * 40) % 70) + 70;
            return <path key={i} d={`M${148 + i * 8} ${y} q6 10 0 14 q-6 -4 0 -14 Z`} />;
          })}
        </g>
      ) : null}
    </svg>
  );
};
