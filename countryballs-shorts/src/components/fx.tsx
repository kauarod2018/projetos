import React from "react";
import { interpolate, random, useCurrentFrame } from "remotion";

// Explosão estilo cartoon que começa no frame `at`.
export const Explosion: React.FC<{ x: number; y: number; at: number; size?: number; seed?: string }> = ({
  x,
  y,
  at,
  size = 260,
  seed = "e",
}) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0 || t > 30) return null;
  const grow = interpolate(t, [0, 8], [0.2, 1], { extrapolateRight: "clamp" });
  const fade = interpolate(t, [14, 30], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const spikes = 12;
  const pts = (r1: number, r2: number) =>
    Array.from({ length: spikes * 2 })
      .map((_, i) => {
        const a = (i / (spikes * 2)) * Math.PI * 2;
        const jitter = 0.8 + random(`${seed}${i}`) * 0.4;
        const r = (i % 2 === 0 ? r2 : r1) * jitter;
        return `${Math.cos(a) * r},${Math.sin(a) * r}`;
      })
      .join(" ");
  return (
    <svg
      viewBox="-100 -100 200 200"
      width={size}
      height={size}
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        transform: `scale(${grow}) rotate(${t * 2}deg)`,
        opacity: fade,
        overflow: "visible",
      }}
    >
      <polygon points={pts(55, 95)} fill="#FF4D1A" stroke="#111" strokeWidth={4} />
      <polygon points={pts(35, 65)} fill="#FFB31A" />
      <polygon points={pts(18, 38)} fill="#FFF3A0" />
      <text x={0} y={12} textAnchor="middle" fontFamily="Anton, Impact" fontSize={34} fill="#111">
        BUM!
      </text>
    </svg>
  );
};

// Bala de canhão em arco de (x1,y1) até (x2,y2) entre os frames [from, to].
export const Cannonball: React.FC<{ x1: number; y1: number; x2: number; y2: number; from: number; to: number; arc?: number }> = ({
  x1,
  y1,
  x2,
  y2,
  from,
  to,
  arc = 260,
}) => {
  const frame = useCurrentFrame();
  if (frame < from || frame > to) return null;
  const p = (frame - from) / (to - from);
  const x = x1 + (x2 - x1) * p;
  const y = y1 + (y2 - y1) * p - Math.sin(p * Math.PI) * arc;
  return (
    <div
      style={{
        position: "absolute",
        left: x - 18,
        top: y - 18,
        width: 36,
        height: 36,
        borderRadius: "50%",
        background: "radial-gradient(circle at 35% 35%, #666, #111)",
        border: "3px solid #000",
      }}
    />
  );
};

// Linhas de velocidade (quando alguém corre/ataca).
export const SpeedLines: React.FC<{ x: number; y: number; dir: 1 | -1; opacity?: number }> = ({ x, y, dir, opacity = 1 }) => {
  const frame = useCurrentFrame();
  return (
    <>
      {[0, 1, 2, 3].map((i) => {
        const len = 90 + ((frame * 7 + i * 40) % 60);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: dir === 1 ? x - len - 20 : x + 20,
              top: y - 120 + i * 50,
              width: len,
              height: 8,
              borderRadius: 4,
              background: "#fff",
              opacity: opacity * 0.85,
              border: "2px solid #111",
            }}
          />
        );
      })}
    </>
  );
};
