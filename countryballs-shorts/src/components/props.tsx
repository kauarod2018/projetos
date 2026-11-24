import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

// Canhão com recuo nos frames de disparo.
export const Cannon: React.FC<{ x: number; y: number; dir?: 1 | -1; fireAt?: number[]; size?: number }> = ({
  x,
  y,
  dir = 1,
  fireAt = [],
  size = 1,
}) => {
  const frame = useCurrentFrame();
  let recoil = 0;
  for (const a of fireAt) {
    const t = frame - a;
    if (t >= 0 && t < 12) recoil = Math.max(recoil, interpolate(t, [0, 2, 12], [0, 34, 0]));
  }
  return (
    <svg
      viewBox="0 0 260 180"
      width={260 * size}
      height={180 * size}
      style={{
        position: "absolute",
        left: x - 130 * size,
        top: y - 170 * size,
        transform: `scaleX(${dir}) translateX(${-recoil}px)`,
        overflow: "visible",
      }}
    >
      <g transform="rotate(-12 110 90)">
        <rect x={60} y={64} width={180} height={44} rx={18} fill="#3b3b3b" stroke="#111" strokeWidth={6} />
        <rect x={226} y={58} width={24} height={56} rx={6} fill="#2a2a2a" stroke="#111" strokeWidth={6} />
        <rect x={86} y={64} width={14} height={44} fill="#d4a017" stroke="#111" strokeWidth={3} />
      </g>
      <path d="M 40 120 L 150 120 L 130 150 L 50 150 Z" fill="#7a4a22" stroke="#111" strokeWidth={6} />
      <circle cx={100} cy={142} r={34} fill="#8b5a2b" stroke="#111" strokeWidth={6} />
      {[0, 45, 90, 135].map((a) => (
        <line
          key={a}
          x1={100 + Math.cos((a * Math.PI) / 180) * 30}
          y1={142 + Math.sin((a * Math.PI) / 180) * 30}
          x2={100 - Math.cos((a * Math.PI) / 180) * 30}
          y2={142 - Math.sin((a * Math.PI) / 180) * 30}
          stroke="#111"
          strokeWidth={4}
        />
      ))}
      <circle cx={100} cy={142} r={8} fill="#111" />
    </svg>
  );
};

// Silhueta de Moscou com cúpulas em forma de cebola.
export const MoscowSkyline: React.FC<{ y: number; burn?: number }> = ({ y, burn = 0 }) => {
  const body = burn > 0 ? `rgb(${120 - burn * 70}, ${70 - burn * 50}, ${60 - burn * 40})` : "#c94c3c";
  const roof = burn > 0 ? "#2b1a12" : "#2a9d8f";
  const gold = burn > 0 ? "#6b4a1a" : "#f5c518";
  const Dome: React.FC<{ cx: number; base: number; w: number; h: number; color: string }> = ({ cx, base, w, h, color }) => (
    <g>
      <path
        d={`M ${cx - w / 2} ${base} Q ${cx - w * 0.75} ${base - h * 0.55} ${cx} ${base - h} Q ${cx + w * 0.75} ${base - h * 0.55} ${cx + w / 2} ${base} Z`}
        fill={color}
        stroke="#111"
        strokeWidth={5}
      />
      <line x1={cx} y1={base - h} x2={cx} y2={base - h - 40} stroke="#111" strokeWidth={5} />
      <line x1={cx - 12} y1={base - h - 26} x2={cx + 12} y2={base - h - 26} stroke="#111" strokeWidth={5} />
    </g>
  );
  return (
    <svg viewBox="0 0 1080 700" width={1080} height={700} style={{ position: "absolute", left: 0, top: y - 700 }}>
      {/* muralha do Kremlin */}
      <rect x={0} y={560} width={1080} height={140} fill={body} stroke="#111" strokeWidth={6} />
      {Array.from({ length: 27 }).map((_, i) => (
        <path key={i} d={`M ${i * 40 + 4} 560 L ${i * 40 + 4} 535 L ${i * 40 + 14} 545 L ${i * 40 + 24} 535 L ${i * 40 + 24} 560 Z`} fill={body} stroke="#111" strokeWidth={4} />
      ))}
      {/* torre */}
      <rect x={90} y={300} width={110} height={260} fill={body} stroke="#111" strokeWidth={6} />
      <polygon points="80,300 145,150 210,300" fill={roof} stroke="#111" strokeWidth={6} />
      <polygon points="145,110 132,150 158,150" fill={gold} stroke="#111" strokeWidth={4} />
      {/* catedral */}
      <rect x={380} y={380} width={320} height={180} fill={body} stroke="#111" strokeWidth={6} />
      <rect x={430} y={300} width={60} height={80} fill={body} stroke="#111" strokeWidth={5} />
      <rect x={590} y={300} width={60} height={80} fill={body} stroke="#111" strokeWidth={5} />
      <rect x={505} y={240} width={70} height={140} fill={body} stroke="#111" strokeWidth={5} />
      <Dome cx={460} base={300} w={70} h={90} color={burn > 0 ? roof : "#2a9d8f"} />
      <Dome cx={620} base={300} w={70} h={90} color={burn > 0 ? roof : "#e9c46a"} />
      <Dome cx={540} base={240} w={90} h={120} color={burn > 0 ? roof : "#e76f51"} />
      {/* casas */}
      <rect x={780} y={420} width={220} height={140} fill={body} stroke="#111" strokeWidth={6} />
      <polygon points="770,420 890,330 1010,420" fill={roof} stroke="#111" strokeWidth={6} />
      <Dome cx={890} base={330} w={60} h={70} color={burn > 0 ? roof : "#f4a261"} />
      {[810, 870, 930].map((wx) => (
        <rect key={wx} x={wx} y={460} width={34} height={50} fill={burn > 0 ? "#ff9f1c" : "#ffe8a3"} stroke="#111" strokeWidth={4} />
      ))}
      {[420, 480, 600, 660].map((wx) => (
        <rect key={wx} x={wx} y={440} width={30} height={60} fill={burn > 0 ? "#ff9f1c" : "#ffe8a3"} stroke="#111" strokeWidth={4} />
      ))}
    </svg>
  );
};

// Ponte de madeira (Berezina).
export const Bridge: React.FC<{ y: number; broken?: number }> = ({ y, broken = 0 }) => (
  <svg viewBox="0 0 1080 300" width={1080} height={300} style={{ position: "absolute", left: 0, top: y - 150 }}>
    {[120, 300, 480, 660, 840, 1000].map((px) => (
      <rect key={px} x={px} y={110} width={26} height={190} fill="#5a3416" stroke="#111" strokeWidth={5} />
    ))}
    <g transform={`rotate(${broken * 8} 540 120)`}>
      <rect x={-20} y={90} width={560} height={34} fill="#8b5a2b" stroke="#111" strokeWidth={6} />
    </g>
    <g transform={`rotate(${-broken * 14} 540 120) translate(0 ${broken * 60})`}>
      <rect x={540} y={90} width={560} height={34} fill="#8b5a2b" stroke="#111" strokeWidth={6} />
    </g>
    <path d="M 0 80 L 1080 80" stroke="#5a3416" strokeWidth={8} />
  </svg>
);
