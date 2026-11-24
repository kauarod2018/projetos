import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import "@fontsource/anton";

export const FONT = "Anton, Impact, 'Arial Black', sans-serif";

const outline = (w: number): React.CSSProperties => ({
  WebkitTextStroke: `${w}px #111`,
  paintOrder: "stroke fill",
});

// Legenda grande, palavra por palavra, com "pop".
export const Caption: React.FC<{
  text: string;
  from?: number;
  y?: number;
  size?: number;
  color?: string;
  highlight?: string[]; // palavras destacadas em amarelo
  stagger?: number;
}> = ({ text, from = 0, y = 300, size = 96, color = "#fff", highlight = [], stagger = 3 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: 60,
        right: 60,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: `0 ${size * 0.4}px`,
        fontFamily: FONT,
        fontSize: size,
        lineHeight: 1.12,
        textTransform: "uppercase",
        textAlign: "center",
      }}
    >
      {words.map((w, i) => {
        const s = spring({ frame: frame - from - i * stagger, fps, config: { damping: 11, stiffness: 180 } });
        const isHi = highlight.includes(w.replace(/[.,!?:]/g, ""));
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              color: isHi ? "#FFD23F" : color,
              ...outline(size * 0.16),
              transform: `scale(${s}) translateY(${(1 - s) * 30}px)`,
              opacity: s > 0.01 ? 1 : 0,
              textShadow: "0 8px 0 rgba(0,0,0,0.35)",
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

// Etiqueta com o ano / data.
export const YearTag: React.FC<{ text: string; from?: number; y?: number }> = ({ text, from = 0, y = 150 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - from, fps, config: { damping: 14 } });
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: "50%",
        transform: `translateX(-50%) scale(${s}) rotate(-3deg)`,
        background: "#C8102E",
        color: "#fff",
        fontFamily: FONT,
        fontSize: 64,
        padding: "8px 36px",
        border: "6px solid #111",
        borderRadius: 14,
        boxShadow: "0 10px 0 #111",
        letterSpacing: 2,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};

// Balão de fala estilo quadrinho.
export const Bubble: React.FC<{
  text: string;
  x: number;
  y: number;
  from?: number;
  duration?: number;
  tail?: "left" | "right" | "down";
  size?: number;
}> = ({ text, x, y, from = 0, duration = 60, tail = "down", size = 54 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame - from;
  if (t < 0 || t > duration + 8) return null;
  const s = spring({ frame: t, fps, config: { damping: 10, stiffness: 200 } });
  const out = interpolate(t, [duration, duration + 8], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tailPos: React.CSSProperties =
    tail === "left" ? { left: 30 } : tail === "right" ? { right: 30 } : { left: "50%", marginLeft: -22 };
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -100%) scale(${s * out})`,
        transformOrigin: "50% 100%",
      }}
    >
      <div
        style={{
          position: "relative",
          background: "#fff",
          border: "6px solid #111",
          borderRadius: 40,
          padding: "18px 34px",
          fontFamily: FONT,
          fontSize: size,
          color: "#111",
          whiteSpace: "nowrap",
          boxShadow: "0 8px 0 rgba(0,0,0,0.3)",
        }}
      >
        {text}
        <div
          style={{
            position: "absolute",
            bottom: -34,
            width: 0,
            height: 0,
            borderLeft: "22px solid transparent",
            borderRight: "22px solid transparent",
            borderTop: "34px solid #111",
            ...tailPos,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -22,
            width: 0,
            height: 0,
            borderLeft: "14px solid transparent",
            borderRight: "14px solid transparent",
            borderTop: "24px solid #fff",
            ...(tail === "left" ? { left: 38 } : tail === "right" ? { right: 38 } : { left: "50%", marginLeft: -14 }),
          }}
        />
      </div>
    </div>
  );
};

// Entrada de cena: zoom leve + fade, e flash branco no corte.
export const SceneIn: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 12], [1.12, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const flash = interpolate(frame, [0, 6], [0.8, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      {children}
      <AbsoluteFill style={{ background: "#fff", opacity: flash }} />
    </AbsoluteFill>
  );
};

// Tremor de câmera entre os frames [from, to].
export const Shake: React.FC<{ children: React.ReactNode; from: number; to: number; amount?: number }> = ({
  children,
  from,
  to,
  amount = 18,
}) => {
  const frame = useCurrentFrame();
  const active = frame >= from && frame <= to;
  const k = active ? interpolate(frame, [from, to], [1, 0]) : 0;
  const dx = Math.sin(frame * 2.7) * amount * k;
  const dy = Math.cos(frame * 3.3) * amount * k;
  return <AbsoluteFill style={{ transform: `translate(${dx}px, ${dy}px)` }}>{children}</AbsoluteFill>;
};

// Nota de rodapé pequena (fontes/estimativas).
export const Footnote: React.FC<{ text: string; from?: number }> = ({ text, from = 0 }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame - from, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        bottom: 330,
        left: 80,
        right: 80,
        textAlign: "center",
        fontFamily: "Arial, sans-serif",
        fontWeight: 700,
        fontSize: 34,
        color: "#fff",
        opacity: o,
        textShadow: "0 2px 6px rgba(0,0,0,0.8)",
      }}
    >
      {text}
    </div>
  );
};
