import React, { useId } from "react";
import { useCurrentFrame } from "remotion";
import { FLAGS, FlagName } from "../flags";

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
}) => {
  const frame = useCurrentFrame();
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const Flag = FLAGS[flag];
  const cycle = (frame + blinkSeed * 37) % 110;
  const blink = cycle > 104;
  const sx = 1 + squash * 0.25;
  const sy = 1 - squash * 0.25;

  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
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
