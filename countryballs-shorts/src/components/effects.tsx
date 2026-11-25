import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { FONT } from "./ui";

// ---------- Neve / nevasca ----------
export const Snow: React.FC<{ intensity?: number; wind?: number; seed?: string }> = ({ intensity = 1, wind = 2, seed = "snow" }) => {
  const frame = useCurrentFrame();
  const n = Math.round(160 * intensity);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: n }).map((_, i) => {
        const depth = 0.4 + random(`${seed}d${i}`) * 0.9; // perto = maior e mais rápido
        const speed = 4 + depth * 9 * (0.6 + intensity * 0.5);
        const x0 = random(`${seed}x${i}`) * 1500 - 210;
        const y0 = random(`${seed}y${i}`) * 2100;
        const y = ((y0 + frame * speed) % 2100) - 100;
        const x = (((x0 + frame * wind * depth * 3 + Math.sin(frame / 12 + i) * 18) % 1500) + 1500) % 1500 - 210;
        const r = 3 + depth * 7;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              background: "#fff",
              opacity: 0.55 + depth * 0.4,
              filter: depth < 0.6 ? "blur(1.5px)" : undefined,
            }}
          />
        );
      })}
      {intensity > 1.2 && <AbsoluteFill style={{ background: "rgba(220,235,255,0.18)" }} />}
    </AbsoluteFill>
  );
};

// ---------- Brasas subindo ----------
export const Embers: React.FC<{ count?: number; seed?: string; area?: [number, number, number, number] }> = ({
  count = 60,
  seed = "emb",
  area = [0, 900, 1080, 1920],
}) => {
  const frame = useCurrentFrame();
  const [ax, ay, aw, ah] = area;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: count }).map((_, i) => {
        const life = 50 + random(`${seed}l${i}`) * 50;
        const t = (frame + random(`${seed}o${i}`) * life) % life;
        const x = ax + random(`${seed}x${i}`) * aw + Math.sin((frame + i * 13) / 9) * 25;
        const y = ay + ah - t * (6 + random(`${seed}s${i}`) * 6) - random(`${seed}y${i}`) * 300;
        const o = interpolate(t, [0, 8, life], [0, 1, 0]);
        const r = 3 + random(`${seed}r${i}`) * 5;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              background: "#ffd166",
              boxShadow: "0 0 12px 4px rgba(255,120,30,0.9)",
              opacity: o,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- Chamas tremulando ----------
export const Flames: React.FC<{ x: number; y: number; width: number; height: number; seed?: string; grow?: number }> = ({
  x,
  y,
  width,
  height,
  seed = "fl",
  grow = 1,
}) => {
  const frame = useCurrentFrame();
  const n = Math.max(3, Math.round(width / 45));
  if (grow <= 0) return null;
  return (
    <svg
      width={width}
      height={height * 1.4}
      viewBox={`0 0 ${width} ${height * 1.4}`}
      style={{ position: "absolute", left: x - width / 2, top: y - height * 1.4, overflow: "visible" }}
    >
      {[
        ["#c1121f", 1],
        ["#ff6b1a", 0.78],
        ["#ffd166", 0.5],
      ].map(([color, k], layer) =>
        Array.from({ length: n }).map((_, i) => {
          const cx = ((i + 0.5) / n) * width + Math.sin(frame / 5 + i * 1.7 + layer) * 6;
          const base = height * 1.4;
          const h = height * (k as number) * grow * (0.7 + 0.3 * Math.sin(frame / 3.3 + i * 2.1 + random(`${seed}${i}`) * 6));
          const w = (width / n) * 0.85 * (k as number) + 10;
          const tip = cx + Math.sin(frame / 4 + i) * 12;
          return (
            <path
              key={`${layer}-${i}`}
              d={`M ${cx - w / 2} ${base} Q ${cx - w / 2} ${base - h * 0.55} ${tip} ${base - h} Q ${cx + w / 2} ${base - h * 0.55} ${cx + w / 2} ${base} Z`}
              fill={color as string}
              opacity={0.95}
            />
          );
        }),
      )}
    </svg>
  );
};

// ---------- Vinheta ----------
export const Vignette: React.FC<{ strength?: number; color?: string }> = ({ strength = 0.55, color = "0,0,0" }) => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background: `radial-gradient(ellipse at 50% 50%, rgba(${color},0) 45%, rgba(${color},${strength}) 100%)`,
    }}
  />
);

// ---------- Granulação de filme ----------
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.09 }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity, mixBlendMode: "overlay" }}>
      <svg width="100%" height="100%">
        <filter id={`grain${frame % 8}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={frame % 8} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain${frame % 8})`} />
      </svg>
    </AbsoluteFill>
  );
};

// ---------- Flash de impacto (branco -> negativo) ----------
export const ImpactFlash: React.FC<{ at: number; color?: string }> = ({ at, color = "#fff" }) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0 || t > 7) return null;
  return <AbsoluteFill style={{ background: color, opacity: interpolate(t, [0, 7], [0.95, 0]), pointerEvents: "none" }} />;
};

// ---------- Raio ----------
export const Lightning: React.FC<{ at: number; x?: number; seed?: string }> = ({ at, x = 540, seed = "lt" }) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0 || t > 10) return null;
  let d = `M ${x} -20`;
  let cx = x;
  for (let y = 80; y <= 1100; y += 90) {
    cx += (random(`${seed}${y}`) - 0.5) * 160;
    d += ` L ${cx} ${y}`;
  }
  const o = t < 2 || (t > 3 && t < 5) ? 1 : 0.25;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "#dfe9ff", opacity: o * 0.35 }} />
      <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute" }}>
        <path d={d} stroke="#9fc5ff" strokeWidth={26} fill="none" opacity={o * 0.5} strokeLinejoin="round" />
        <path d={d} stroke="#fff" strokeWidth={9} fill="none" opacity={o} strokeLinejoin="round" />
      </svg>
    </AbsoluteFill>
  );
};

// ---------- Zoom "soco" de câmera ----------
export const ZoomPunch: React.FC<{ children: React.ReactNode; at: number[]; amount?: number; origin?: string }> = ({
  children,
  at,
  amount = 0.08,
  origin = "50% 55%",
}) => {
  const frame = useCurrentFrame();
  let s = 1;
  for (const a of at) {
    const t = frame - a;
    if (t >= 0 && t < 14) s += amount * Math.exp(-t / 3.5);
  }
  return <AbsoluteFill style={{ transform: `scale(${s})`, transformOrigin: origin }}>{children}</AbsoluteFill>;
};

// ---------- Movimento lento de câmera (Ken Burns) ----------
export const Drift: React.FC<{ children: React.ReactNode; from?: number; to?: number; duration: number; x?: number }> = ({
  children,
  from = 1,
  to = 1.08,
  duration,
  x = 0,
}) => {
  const frame = useCurrentFrame();
  const s = interpolate(frame, [0, duration], [from, to], { extrapolateRight: "clamp" });
  const tx = interpolate(frame, [0, duration], [0, x], { extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ transform: `scale(${s}) translateX(${tx}px)` }}>{children}</AbsoluteFill>;
};

// ---------- Clarão de tiro de canhão ----------
export const MuzzleFlash: React.FC<{ x: number; y: number; at: number; dir?: 1 | -1; size?: number }> = ({ x, y, at, dir = 1, size = 160 }) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0 || t > 6) return null;
  const s = interpolate(t, [0, 2, 6], [0.4, 1.1, 0.6]);
  const o = interpolate(t, [0, 6], [1, 0]);
  return (
    <svg
      viewBox="-100 -100 200 200"
      width={size}
      height={size}
      style={{ position: "absolute", left: x - size / 2, top: y - size / 2, opacity: o, transform: `scale(${s * dir}, ${s})`, overflow: "visible" }}
    >
      <polygon points="-20,-30 90,0 -20,30 10,0" fill="#ff8c1a" stroke="#111" strokeWidth={4} />
      <polygon points="-10,-16 60,0 -10,16" fill="#fff3a0" />
      <circle cx={-10} cy={0} r={26} fill="#ffd166" opacity={0.8} />
    </svg>
  );
};

// ---------- Contador animado ----------
export const Counter: React.FC<{
  from: number;
  to: number;
  start: number;
  end: number;
  y?: number;
  prefix?: string;
  suffix?: string;
  color?: string;
  size?: number;
}> = ({ from, to, start, end, y = 1450, prefix = "", suffix = "", color = "#fff", size = 150 }) => {
  const frame = useCurrentFrame();
  const v = interpolate(frame, [start, end], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shake = frame > start && frame < end ? Math.sin(frame * 3) * 3 : 0;
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: 0,
        right: 0,
        textAlign: "center",
        fontFamily: FONT,
        fontSize: size,
        color,
        WebkitTextStroke: `${size * 0.12}px #111`,
        paintOrder: "stroke fill",
        transform: `translateX(${shake}px)`,
        textShadow: "0 10px 0 rgba(0,0,0,0.4), 0 0 40px rgba(255,60,60,0.6)",
      }}
    >
      {prefix}
      {Math.round(v / 1000).toLocaleString("pt-BR")} mil{suffix}
    </div>
  );
};

// ---------- Etiqueta de nome do personagem ----------
export const NameTag: React.FC<{ x: number; y: number; name: string; from?: number; color?: string }> = ({
  x,
  y,
  name,
  from = 0,
  color = "#111",
}) => {
  const frame = useCurrentFrame();
  const t = frame - from;
  if (t < 0) return null;
  const w = interpolate(t, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translateX(-50%) scaleX(${w})`,
        background: color,
        color: "#fff",
        fontFamily: FONT,
        fontSize: 42,
        padding: "4px 22px",
        borderRadius: 8,
        border: "4px solid #fff",
        whiteSpace: "nowrap",
        letterSpacing: 1,
        boxShadow: "0 6px 0 rgba(0,0,0,0.35)",
      }}
    >
      {name}
    </div>
  );
};

// ---------- Folhas de calendário voando ----------
export const CalendarPages: React.FC<{ from: number; count?: number }> = ({ from, count = 10 }) => {
  const frame = useCurrentFrame();
  const days = ["14 SET", "20 SET", "26 SET", "1 OUT", "5 OUT", "9 OUT", "12 OUT", "15 OUT", "17 OUT", "19 OUT"];
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const t = frame - from - i * 6;
        if (t < 0) return null;
        const x = 540 + t * (8 + random(`cp${i}`) * 10) * (random(`cd${i}`) > 0.5 ? 1 : -1);
        const y = 1000 - t * 9 + t * t * 0.12;
        const r = t * (6 + random(`cr${i}`) * 8);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - 80,
              top: y - 90,
              width: 160,
              height: 180,
              background: "#fff",
              border: "5px solid #111",
              borderRadius: 10,
              transform: `rotate(${r}deg)`,
              fontFamily: FONT,
              textAlign: "center",
              boxShadow: "0 6px 0 rgba(0,0,0,0.3)",
              overflow: "hidden",
            }}
          >
            <div style={{ background: "#c62828", color: "#fff", fontSize: 30, padding: 4 }}>1812</div>
            <div style={{ fontSize: 50, marginTop: 18, color: "#111" }}>{days[i % days.length]}</div>
          </div>
        );
      })}
    </>
  );
};

// ---------- Chuva ----------
export const Rain: React.FC<{ intensity?: number; seed?: string }> = ({ intensity = 1, seed = "rain" }) => {
  const frame = useCurrentFrame();
  const n = Math.round(140 * intensity);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
        {Array.from({ length: n }).map((_, i) => {
          const depth = 0.4 + random(`${seed}d${i}`) * 0.8;
          const speed = 40 + depth * 40;
          const x0 = random(`${seed}x${i}`) * 1300 - 110;
          const y0 = random(`${seed}y${i}`) * 2000;
          const y = ((y0 + frame * speed) % 2000) - 80;
          const x = x0 - (y + 80) * 0.18;
          const len = 40 + depth * 50;
          return (
            <line
              key={i}
              x1={x}
              y1={y}
              x2={x - len * 0.18}
              y2={y + len}
              stroke="#cfe3ff"
              strokeWidth={1.5 + depth * 2}
              opacity={0.35 + depth * 0.4}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      <AbsoluteFill style={{ background: "rgba(20,30,50,0.25)" }} />
    </AbsoluteFill>
  );
};

// ---------- Confete / brilhos (comemoração) ----------
export const Confetti: React.FC<{ from: number; count?: number; colors?: string[]; x?: number; y?: number }> = ({
  from,
  count = 60,
  colors = ["#0055A4", "#ffffff", "#EF4135", "#FFD23F"],
  x = 540,
  y = 1100,
}) => {
  const frame = useCurrentFrame();
  const t = frame - from;
  if (t < 0 || t > 90) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: count }).map((_, i) => {
        const a = random(`cf${i}`) * Math.PI * 2;
        const v = 18 + random(`cv${i}`) * 26;
        const px = x + Math.cos(a) * v * t * 0.9;
        const py = y + Math.sin(a) * v * t * 0.6 - 10 * t + 0.6 * t * t;
        const rot = t * (10 + random(`cr${i}`) * 20);
        const o = interpolate(t, [60, 90], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: px,
              top: py,
              width: 18,
              height: 30,
              background: colors[i % colors.length],
              border: "2px solid #111",
              transform: `rotate(${rot}deg)`,
              opacity: o,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- Saraivada de mosquetes (fileira de clarões + fumaça) ----------
export const Volley: React.FC<{ at: number; xs: number[]; y: number; dir?: 1 | -1 }> = ({ at, xs, y, dir = 1 }) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0 || t > 40) return null;
  return (
    <>
      {xs.map((x, i) => (
        <React.Fragment key={i}>
          <MuzzleFlash x={x + dir * 50} y={y} at={at + (i % 3)} dir={dir} size={110} />
          <div
            style={{
              position: "absolute",
              left: x + dir * (60 + t * 2) - 40 - t,
              top: y - 40 - t * 1.2,
              width: 80 + t * 2,
              height: 80 + t * 2,
              borderRadius: "50%",
              background: "rgba(235,235,235,0.75)",
              opacity: interpolate(t, [0, 6, 40], [0, 0.9, 0]),
            }}
          />
        </React.Fragment>
      ))}
    </>
  );
};
