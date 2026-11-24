import React from "react";

// Bandeiras desenhadas num quadrado 200x200 (o countryball recorta em círculo).
// Estilo simplificado, como nos countryballs.

const Sun: React.FC<{ cx: number; cy: number; r: number; color?: string; rays?: number; face?: boolean }> = ({
  cx,
  cy,
  r,
  color = "#F6B40E",
  rays = 16,
  face = true,
}) => {
  const rayEls = [];
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2;
    const long = i % 2 === 0;
    const r2 = r * (long ? 1.9 : 1.6);
    const w = 0.13;
    rayEls.push(
      <polygon
        key={i}
        points={[
          `${cx + Math.cos(a - w) * r * 0.9},${cy + Math.sin(a - w) * r * 0.9}`,
          `${cx + Math.cos(a) * r2},${cy + Math.sin(a) * r2}`,
          `${cx + Math.cos(a + w) * r * 0.9},${cy + Math.sin(a + w) * r * 0.9}`,
        ].join(" ")}
        fill={color}
        stroke="#85340A"
        strokeWidth={1}
      />,
    );
  }
  return (
    <g>
      {rayEls}
      <circle cx={cx} cy={cy} r={r} fill={color} stroke="#85340A" strokeWidth={1.2} />
      {face && (
        <g stroke="#85340A" strokeWidth={1.2} fill="none" strokeLinecap="round">
          <circle cx={cx - r * 0.35} cy={cy - r * 0.15} r={r * 0.08} fill="#85340A" />
          <circle cx={cx + r * 0.35} cy={cy - r * 0.15} r={r * 0.08} fill="#85340A" />
          <path d={`M ${cx - r * 0.35} ${cy + r * 0.35} Q ${cx} ${cy + r * 0.6} ${cx + r * 0.35} ${cy + r * 0.35}`} />
        </g>
      )}
    </g>
  );
};

const Star: React.FC<{ cx: number; cy: number; r: number; fill: string }> = ({ cx, cy, r, fill }) => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.42;
    pts.push(`${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr}`);
  }
  return <polygon points={pts.join(" ")} fill={fill} />;
};

export const Argentina: React.FC<{ plain?: boolean }> = ({ plain }) => (
  <g>
    <rect x={0} y={0} width={200} height={200} fill="#74ACDF" />
    <rect x={0} y={66.7} width={200} height={66.6} fill="#FFFFFF" />
    {!plain && <Sun cx={100} cy={100} r={13} />}
  </g>
);

export const Uruguai: React.FC<{ plain?: boolean }> = ({ plain }) => {
  const h = 200 / 9;
  return (
    <g>
      {Array.from({ length: 9 }).map((_, i) => (
        <rect key={i} x={0} y={i * h} width={200} height={h + 0.5} fill={i % 2 === 0 ? "#FFFFFF" : "#0038A8"} />
      ))}
      <rect x={0} y={0} width={95} height={h * 5} fill="#FFFFFF" />
      {!plain && <Sun cx={52} cy={58} r={14} rays={16} />}
    </g>
  );
};

export const Paraguai: React.FC<{ plain?: boolean }> = () => (
  <g>
    <rect x={0} y={0} width={200} height={200} fill="#D52B1E" />
    <rect x={0} y={66.7} width={200} height={66.6} fill="#FFFFFF" />
    <rect x={0} y={133.3} width={200} height={66.7} fill="#0038A8" />
    <circle cx={100} cy={100} r={20} fill="#FFFFFF" stroke="#000" strokeWidth={1.2} />
    <circle cx={100} cy={100} r={15} fill="none" stroke="#1E8E3E" strokeWidth={4} strokeDasharray="5 2" />
    <Star cx={100} cy={100} r={8} fill="#FFD100" />
  </g>
);

// Bandeira do Império do Brasil (o Brasil era um império durante a guerra).
export const ImperioDoBrasil: React.FC<{ plain?: boolean }> = ({ plain }) => (
  <g>
    <rect x={0} y={0} width={200} height={200} fill="#00923F" />
    <polygon points="100,22 186,100 100,178 14,100" fill="#FFDF00" />
    {!plain && (
      <g>
    {/* brasão simplificado */}
    <path d="M 82 82 L 118 82 L 118 108 Q 118 124 100 130 Q 82 124 82 108 Z" fill="#00923F" stroke="#5a3d00" strokeWidth={1.5} />
    <circle cx={100} cy={104} r={11} fill="none" stroke="#FFDF00" strokeWidth={2.5} />
    <path d="M 89 104 L 111 104 M 100 93 L 100 115" stroke="#FFDF00" strokeWidth={1.8} />
    {/* coroa */}
    <path d="M 86 80 L 86 68 L 92 74 L 100 64 L 108 74 L 114 68 L 114 80 Z" fill="#FFDF00" stroke="#5a3d00" strokeWidth={1.5} />
    <circle cx={100} cy={62} r={2.6} fill="#c0392b" />
      </g>
    )}
  </g>
);

export const Franca: React.FC<{ plain?: boolean }> = () => (
  <g>
    <rect x={0} y={0} width={67} height={200} fill="#0055A4" />
    <rect x={66.5} y={0} width={67} height={200} fill="#FFFFFF" />
    <rect x={133} y={0} width={67} height={200} fill="#EF4135" />
  </g>
);

export const Russia: React.FC<{ plain?: boolean }> = () => (
  <g>
    <rect x={0} y={0} width={200} height={67} fill="#FFFFFF" />
    <rect x={0} y={66.5} width={200} height={67} fill="#0039A6" />
    <rect x={0} y={133} width={200} height={67} fill="#D52B1E" />
  </g>
);

// "General Inverno": gelo e flocos de neve.
export const Inverno: React.FC<{ plain?: boolean }> = () => (
  <g>
    <rect x={0} y={0} width={200} height={200} fill="#dff3ff" />
    <rect x={0} y={120} width={200} height={80} fill="#b9e2fa" />
    {[
      [40, 50],
      [150, 40],
      [100, 150],
      [30, 140],
      [170, 130],
    ].map(([x, y], i) => (
      <g key={i} stroke="#7cc4ef" strokeWidth={3} strokeLinecap="round">
        <path d={`M ${x - 10} ${y} L ${x + 10} ${y} M ${x} ${y - 10} L ${x} ${y + 10} M ${x - 7} ${y - 7} L ${x + 7} ${y + 7} M ${x + 7} ${y - 7} L ${x - 7} ${y + 7}`} />
      </g>
    ))}
  </g>
);

export const FLAGS = {
  franca: Franca,
  russia: Russia,
  inverno: Inverno,
  argentina: Argentina,
  uruguai: Uruguai,
  paraguai: Paraguai,
  brasil: ImperioDoBrasil,
} as const;

export type FlagName = keyof typeof FLAGS;
