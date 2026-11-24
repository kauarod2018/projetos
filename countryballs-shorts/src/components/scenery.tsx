import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";

export const Sky: React.FC<{ top: string; bottom: string }> = ({ top, bottom }) => (
  <AbsoluteFill style={{ background: `linear-gradient(180deg, ${top} 0%, ${bottom} 100%)` }} />
);

// Raios girando atrás (fundo de "abertura").
export const Rays: React.FC<{ color?: string; opacity?: number }> = ({ color = "#fff", opacity = 0.12 }) => {
  const frame = useCurrentFrame();
  const n = 16;
  return (
    <AbsoluteFill style={{ opacity }}>
      <svg viewBox="-100 -100 200 200" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
        <g transform={`rotate(${frame * 0.4})`}>
          {Array.from({ length: n }).map((_, i) => {
            const a1 = (i / n) * Math.PI * 2;
            const a2 = a1 + Math.PI / n;
            return (
              <polygon
                key={i}
                points={`0,0 ${Math.cos(a1) * 200},${Math.sin(a1) * 200} ${Math.cos(a2) * 200},${Math.sin(a2) * 200}`}
                fill={color}
              />
            );
          })}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// Morros em camadas.
export const Hills: React.FC<{ y?: number; colors?: [string, string, string] }> = ({
  y = 1250,
  colors = ["#8fc46b", "#6fae4f", "#4f8f3a"],
}) => (
  <AbsoluteFill>
    <svg viewBox="0 0 1080 1920" width="100%" height="100%">
      <path d={`M 0 ${y - 120} Q 270 ${y - 230} 540 ${y - 130} T 1080 ${y - 150} L 1080 1920 L 0 1920 Z`} fill={colors[0]} />
      <path d={`M 0 ${y - 30} Q 300 ${y - 110} 620 ${y - 40} T 1080 ${y - 50} L 1080 1920 L 0 1920 Z`} fill={colors[1]} />
      <rect x={0} y={y} width={1080} height={1920 - y} fill={colors[2]} />
    </svg>
  </AbsoluteFill>
);

// Água animada (rio Paraná / Riachuelo).
export const Water: React.FC<{ y: number; color?: string; dark?: string }> = ({ y, color = "#3b8fd1", dark = "#2a6ea6" }) => {
  const frame = useCurrentFrame();
  const wave = (offset: number, amp: number, phase: number) => {
    let d = `M 0 ${y + offset}`;
    for (let x = 0; x <= 1080; x += 30) {
      d += ` L ${x} ${y + offset + Math.sin(x / 70 + frame / 8 + phase) * amp}`;
    }
    return d + " L 1080 1920 L 0 1920 Z";
  };
  return (
    <AbsoluteFill>
      <svg viewBox="0 0 1080 1920" width="100%" height="100%">
        <path d={wave(0, 12, 0)} fill={color} />
        <path d={wave(70, 10, 2)} fill={dark} opacity={0.7} />
        <path d={wave(170, 8, 4)} fill={dark} />
      </svg>
    </AbsoluteFill>
  );
};

// Fumaça/poeira subindo.
export const Smoke: React.FC<{ x: number; y: number; count?: number; seed?: string; color?: string; spread?: number }> = ({
  x,
  y,
  count = 10,
  seed = "s",
  color = "rgba(90,90,90,0.55)",
  spread = 120,
}) => {
  const frame = useCurrentFrame();
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const life = 60;
        const t = (frame + random(`${seed}${i}`) * life) % life;
        const px = x + (random(`${seed}x${i}`) - 0.5) * spread + t * (random(`${seed}d${i}`) - 0.5) * 2;
        const py = y - t * 3;
        const r = 30 + t * 1.4;
        const o = interpolate(t, [0, 10, life], [0, 1, 0]);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: px - r,
              top: py - r,
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              background: color,
              opacity: o,
            }}
          />
        );
      })}
    </>
  );
};

// Mapa estilizado em pergaminho (abertura / contexto).
export const Parchment: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, #f4e4bc 0%, #e2c88f 70%, #b8935a 100%)" }}>
    <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{ opacity: 0.18 }}>
      {Array.from({ length: 14 }).map((_, i) => (
        <line key={`h${i}`} x1={0} x2={1080} y1={i * 140} y2={i * 140} stroke="#5b3a14" strokeWidth={2} />
      ))}
      {Array.from({ length: 8 }).map((_, i) => (
        <line key={`v${i}`} y1={0} y2={1920} x1={i * 154} x2={i * 154} stroke="#5b3a14" strokeWidth={2} />
      ))}
    </svg>
  </AbsoluteFill>
);

// Navio simples. `y` é a linha d'água; os filhos (countryball) ficam no convés.
export const Ship: React.FC<{
  x: number;
  y: number;
  flip?: boolean;
  sink?: number; // 0..1
  hull?: string;
  children?: React.ReactNode;
}> = ({ x, y, flip = false, sink = 0, hull = "#7a4a22", children }) => {
  const frame = useCurrentFrame();
  const bob = Math.sin(frame / 9 + x) * 8;
  const tilt = Math.sin(frame / 13 + x) * 2 + sink * 24 * (flip ? -1 : 1);
  return (
    <div
      style={{
        position: "absolute",
        left: x - 220,
        top: y - 420 + bob + sink * 520,
        width: 440,
        height: 480,
        transform: `rotate(${tilt}deg)`,
        transformOrigin: "50% 90%",
      }}
    >
      <svg viewBox="0 0 440 480" width={440} height={480} style={{ position: "absolute", transform: flip ? "scaleX(-1)" : undefined }}>
        <rect x={212} y={40} width={14} height={330} fill="#4a2c12" stroke="#111" strokeWidth={4} />
        <path d="M 226 60 Q 330 140 226 250 Z" fill="#f5efe0" stroke="#111" strokeWidth={5} />
        <path d="M 212 90 Q 130 160 212 240 Z" fill="#f5efe0" stroke="#111" strokeWidth={5} />
        <path d="M 20 360 L 420 360 L 370 450 L 70 450 Z" fill={hull} stroke="#111" strokeWidth={6} />
        <rect x={40} y={340} width={360} height={26} fill="#5a3416" stroke="#111" strokeWidth={5} />
        {[110, 180, 250, 320].map((cx) => (
          <circle key={cx} cx={cx} cy={400} r={12} fill="#222" stroke="#111" strokeWidth={3} />
        ))}
      </svg>
      {children}
    </div>
  );
};
