import React, { useId } from "react";
import { useCurrentFrame } from "remotion";
import { FLAGS, FlagName } from "../flags";

export type Hat = "bicorne" | "crown" | "ushanka" | "kutuzov" | "papakha";

export type Expression = "neutral" | "happy" | "angry" | "surprised" | "sad" | "determined" | "dead";

type Props = {
  flag: FlagName;
  size?: number;
  x: number; // centro, em px no quadro 1080x1920
  y: number; // base (chão) da bola
  expression?: Expression;
  look?: number; // -1 (esquerda) .. 1 (direita)
  rotate?: number;
  squash?: number; // >0 achata, <0 estica
  damage?: number; // 0..1 rachaduras
  bandage?: boolean;
  opacity?: number;
  blinkSeed?: number;
  shadow?: boolean;
  hat?: Hat;
  eyepatch?: boolean;
  frozen?: number; // 0..1 congelando
  shiver?: boolean;
};

// Chapéus e acessórios (coordenadas do viewBox 0..200, bola com raio 92 em 100,100).
const HatSvg: React.FC<{ hat: Hat }> = ({ hat }) => {
  const k = { stroke: "#111", strokeWidth: 5, strokeLinejoin: "round" as const };
  switch (hat) {
    case "bicorne": // Napoleão: bicorne de lado
      return (
        <g>
          <path d="M 4 50 Q 30 -30 100 -38 Q 170 -30 196 50 Q 150 22 100 22 Q 50 22 4 50 Z" fill="#161616" {...k} />
          <path d="M 14 44 Q 60 16 100 16 Q 140 16 186 44" fill="none" stroke="#d4a017" strokeWidth={5} />
          <circle cx={62} cy={4} r={14} fill="#0055A4" stroke="#111" strokeWidth={3} />
          <circle cx={62} cy={4} r={9} fill="#fff" />
          <circle cx={62} cy={4} r={4.5} fill="#EF4135" />
        </g>
      );
    case "crown":
      return (
        <g>
          <path d="M 52 30 L 46 -18 L 74 4 L 100 -30 L 126 4 L 154 -18 L 148 30 Z" fill="#f5c518" {...k} />
          <rect x={50} y={20} width={100} height={14} fill="#e0a800" {...k} />
          <circle cx={100} cy={-30} r={7} fill="#e63946" stroke="#111" strokeWidth={3} />
          <circle cx={75} cy={27} r={4} fill="#2a9d8f" />
          <circle cx={100} cy={27} r={4} fill="#e63946" />
          <circle cx={125} cy={27} r={4} fill="#2a9d8f" />
        </g>
      );
    case "ushanka":
      return (
        <g>
          <path d="M 22 60 Q 18 100 30 112 L 50 108 Q 44 80 48 56 Z" fill="#8a6a4a" {...k} />
          <path d="M 178 60 Q 182 100 170 112 L 150 108 Q 156 80 152 56 Z" fill="#8a6a4a" {...k} />
          <path d="M 24 46 Q 30 -14 100 -16 Q 170 -14 176 46 Z" fill="#6b4f35" {...k} />
          <path d="M 18 44 Q 100 20 182 44 L 182 62 Q 100 40 18 62 Z" fill="#8a6a4a" {...k} />
          <polygon points="100,-2 105,10 118,10 108,18 112,30 100,22 88,30 92,18 82,10 95,10" fill="#e63946" stroke="#111" strokeWidth={2} />
        </g>
      );
    case "kutuzov": // quepe branco de general russo
      return (
        <g>
          <path d="M 30 40 Q 34 -6 100 -10 Q 166 -6 170 40 Z" fill="#f2f2f2" {...k} />
          <rect x={30} y={28} width={140} height={16} fill="#c62828" {...k} />
          <path d="M 40 44 Q 100 70 168 44 L 172 50 Q 100 82 36 50 Z" fill="#111" />
          <circle cx={100} cy={36} r={6} fill="#f5c518" stroke="#111" strokeWidth={2} />
        </g>
      );
    case "papakha": // cossaco
      return (
        <g>
          <path d="M 40 40 L 44 -40 Q 100 -56 156 -40 L 160 40 Q 100 26 40 40 Z" fill="#222" {...k} />
          <path d="M 48 -20 L 152 -20 M 46 0 L 154 0 M 44 20 L 156 20" stroke="#444" strokeWidth={4} />
          <path d="M 60 -44 Q 100 -30 140 -44 L 140 -34 Q 100 -20 60 -34 Z" fill="#c62828" />
        </g>
      );
  }
};

const Eye: React.FC<{ expression: Expression; side: -1 | 1; blink: boolean }> = ({ expression, side, blink }) => {
  const stroke = { stroke: "#111", strokeWidth: 5, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  if (expression === "dead") {
    return <path d="M -12 -12 L 12 12 M 12 -12 L -12 12" fill="none" {...stroke} strokeWidth={6} />;
  }
  if (blink && expression !== "surprised") {
    return <path d="M -15 4 L 15 4" fill="none" {...stroke} strokeWidth={6} />;
  }
  switch (expression) {
    case "happy":
      return <path d="M -15 6 Q 0 -16 15 6" fill="none" {...stroke} strokeWidth={6} />;
    case "angry": {
      // borda superior inclinada para o centro do rosto
      const d = side === -1 ? "M -16 -10 L 16 2 Q 16 20 0 21 Q -16 20 -16 4 Z" : "M 16 -10 L -16 2 Q -16 20 0 21 Q 16 20 16 4 Z";
      return <path d={d} fill="#fff" {...stroke} />;
    }
    case "sad": {
      const d = side === -1 ? "M -16 2 L 16 -10 Q 16 20 0 21 Q -16 20 -16 2 Z" : "M 16 2 L -16 -10 Q -16 20 0 21 Q 16 20 16 2 Z";
      return <path d={d} fill="#fff" {...stroke} />;
    }
    case "determined":
      return <path d="M -16 -2 L 16 -2 Q 16 18 0 19 Q -16 18 -16 -2 Z" fill="#fff" {...stroke} />;
    case "surprised":
      return <ellipse cx={0} cy={0} rx={17} ry={22} fill="#fff" {...stroke} />;
    default:
      return <ellipse cx={0} cy={2} rx={14} ry={18} fill="#fff" {...stroke} />;
  }
};

export const CountryBall: React.FC<Props> = ({
  flag,
  size = 300,
  x,
  y,
  expression = "neutral",
  look = 0,
  rotate = 0,
  squash = 0,
  damage = 0,
  bandage = false,
  opacity = 1,
  blinkSeed = 0,
  shadow = true,
  hat,
  eyepatch = false,
  frozen = 0,
  shiver = false,
}) => {
  const frame = useCurrentFrame();
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const Flag = FLAGS[flag];
  const cycle = (frame + blinkSeed * 37) % 110;
  const blink = cycle > 104;
  const shake = shiver ? Math.sin(frame * 2.9) * 4 : 0;
  const sx = 1 + squash * 0.25;
  const sy = 1 - squash * 0.25;

  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2 + shake,
        top: y - size,
        width: size,
        height: size,
        opacity,
      }}
    >
      {shadow && (
        <div
          style={{
            position: "absolute",
            left: size * 0.12,
            top: size * 0.93,
            width: size * 0.76,
            height: size * 0.12,
            borderRadius: "50%",
            background: "rgba(0,0,0,0.22)",
            filter: "blur(4px)",
          }}
        />
      )}
      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        style={{
          overflow: "visible",
          transformOrigin: "50% 100%",
          transform: `scale(${sx}, ${sy}) rotate(${rotate}deg)`,
        }}
      >
        <defs>
          <clipPath id={`c${id}`}>
            <circle cx={100} cy={100} r={92} />
          </clipPath>
          <radialGradient id={`s${id}`} cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#fff" stopOpacity={0.35} />
            <stop offset="45%" stopColor="#fff" stopOpacity={0} />
            <stop offset="100%" stopColor="#000" stopOpacity={0.28} />
          </radialGradient>
        </defs>
        <g clipPath={`url(#c${id})`}>
          <Flag />
          <circle cx={100} cy={100} r={92} fill={`url(#s${id})`} />
          {damage > 0 && (
            <g stroke="#111" strokeWidth={3} fill="none" strokeLinecap="round" opacity={Math.min(1, damage * 1.5)}>
              <path d="M 150 30 L 135 55 L 148 70 L 128 95" />
              {damage > 0.4 && <path d="M 40 150 L 62 138 L 58 120 L 78 110" />}
              {damage > 0.7 && <path d="M 100 190 L 104 165 L 92 150" />}
            </g>
          )}
        </g>
        <circle cx={100} cy={100} r={92} fill="none" stroke="#111" strokeWidth={6} />
        <g transform={`translate(${look * 18}, 0)`}>
          <g transform="translate(70, 82)">
            <Eye expression={expression} side={-1} blink={blink} />
          </g>
          <g transform="translate(130, 82)">
            <Eye expression={expression} side={1} blink={blink} />
          </g>
        </g>
        {eyepatch && (
          <g>
            <path d="M 12 52 L 180 120" stroke="#111" strokeWidth={5} />
            <ellipse cx={70} cy={84} rx={21} ry={24} fill="#111" />
          </g>
        )}
        {frozen > 0 && (
          <g opacity={Math.min(1, frozen)}>
            <circle cx={100} cy={100} r={92} fill="#9fdcff" opacity={0.45} />
            <path d="M 30 150 L 38 186 L 46 156 L 58 196 L 68 162 L 82 192 L 92 168" fill="#e8f7ff" stroke="#111" strokeWidth={3} strokeLinejoin="round" />
            <path d="M 112 170 L 122 198 L 130 168 L 144 190 L 152 158 L 164 182 L 170 150" fill="#e8f7ff" stroke="#111" strokeWidth={3} strokeLinejoin="round" />
            <path d="M 36 40 Q 100 -6 164 40 Q 140 30 120 38 Q 100 26 80 38 Q 60 30 36 40 Z" fill="#fff" stroke="#111" strokeWidth={3} />
          </g>
        )}
        {hat && <HatSvg hat={hat} />}
        {bandage && (
          <g>
            <g transform="rotate(-28 60 150)">
              <rect x={30} y={140} width={62} height={18} rx={3} fill="#f3ead8" stroke="#111" strokeWidth={3} />
              <path d="M 52 143 L 52 155 M 70 143 L 70 155" stroke="#d8c9a8" strokeWidth={2} />
            </g>
            <g transform="rotate(35 150 40)">
              <rect x={124} y={32} width={56} height={16} rx={3} fill="#f3ead8" stroke="#111" strokeWidth={3} />
            </g>
          </g>
        )}
      </svg>
    </div>
  );
};
