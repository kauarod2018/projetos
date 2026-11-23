import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import type { Paleta } from "./estilo";

const W = 1080;
const H = 1920;

/** Céu em degradê longo. */
export const Ceu: React.FC<{ p: Paleta; horizonteY?: number }> = ({ p, horizonteY = 1000 }) => (
  <AbsoluteFill
    style={{
      background: `linear-gradient(180deg, ${p.ceuTopo} 0%, ${p.ceuMeio} ${(horizonteY / H) * 70}%, ${p.horizonte} ${(horizonteY / H) * 100}%, ${p.horizonte} 100%)`,
    }}
  />
);

/** Sol (ou lua) com halo grande e raios girando devagar. */
export const Sol: React.FC<{ p: Paleta; x: number; y: number; raio?: number; raios?: boolean }> = ({
  p,
  x,
  y,
  raio = 90,
  raios = true,
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: x - raio * 7,
          top: y - raio * 7,
          width: raio * 14,
          height: raio * 14,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${p.sol}88 0%, ${p.horizonte}55 18%, transparent 60%)`,
        }}
      />
      {raios ? (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: 0.16, mixBlendMode: "screen" }}>
          <g transform={`rotate(${frame * 0.08} ${x} ${y})`}>
            {Array.from({ length: 14 }).map((_, i) => {
              const a = (i / 14) * Math.PI * 2;
              const b = a + 0.07;
              const r = 2200;
              return (
                <path
                  key={i}
                  d={`M${x} ${y} L${x + Math.cos(a) * r} ${y + Math.sin(a) * r} L${x + Math.cos(b) * r} ${y + Math.sin(b) * r} Z`}
                  fill={p.sol}
                />
              );
            })}
          </g>
        </svg>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: x - raio,
          top: y - raio,
          width: raio * 2,
          height: raio * 2,
          borderRadius: "50%",
          backgroundColor: p.sol,
          boxShadow: `0 0 ${raio}px ${raio / 2}px ${p.sol}AA, 0 0 ${raio * 3}px ${raio}px ${p.horizonte}66`,
        }}
      />
    </AbsoluteFill>
  );
};

/** Um plano do cenário com paralaxe (deslocamento horizontal) e desfoque de profundidade. */
export const Plano: React.FC<{ desloca?: number; blur?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  desloca = 0,
  blur = 0,
  children,
  style,
}) => (
  <AbsoluteFill style={{ translate: `${desloca}px 0px`, filter: blur ? `blur(${blur}px)` : undefined, ...style }}>
    {children}
  </AbsoluteFill>
);

/** Morros distantes. */
export const Morros: React.FC<{ cor: string; y: number; semente?: string; altura?: number }> = ({ cor, y, semente = "m", altura = 160 }) => {
  const pts: string[] = [`M-200 ${H}`, `L-200 ${y}`];
  for (let i = 0; i <= 14; i++) {
    const x = -200 + i * 110;
    pts.push(`Q${x + 55} ${y - altura * (0.4 + random(`${semente}${i}`) * 0.6)} ${x + 110} ${y - altura * 0.2 * random(`${semente}b${i}`)}`);
  }
  pts.push(`L${W + 200} ${H} Z`);
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <path d={pts.join(" ")} fill={cor} />
    </svg>
  );
};

/** Linha de árvores da mata (copas redondas + palmeiras), em silhueta. */
export const Arvores: React.FC<{ cor: string; y: number; escala?: number; semente?: string; quantidade?: number }> = ({
  cor,
  y,
  escala = 1,
  semente = "a",
  quantidade = 12,
}) => {
  const frame = useCurrentFrame();
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <rect x={-300} y={y} width={W + 600} height={H - y} fill={cor} />
      {Array.from({ length: quantidade }).map((_, i) => {
        const x = -150 + (i / (quantidade - 1)) * (W + 300) + (random(`${semente}x${i}`) - 0.5) * 60;
        const alt = (200 + random(`${semente}h${i}`) * 260) * escala;
        const palmeira = random(`${semente}p${i}`) > 0.55;
        const balanco = Math.sin(frame / 40 + i) * 2;
        if (palmeira) {
          return (
            <g key={i} transform={`rotate(${balanco} ${x} ${y})`}>
              <path d={`M${x - 5 * escala} ${y} Q${x + 10 * escala} ${y - alt * 0.5} ${x} ${y - alt}`} stroke={cor} strokeWidth={10 * escala} fill="none" />
              {Array.from({ length: 7 }).map((__, k) => {
                const ang = (k / 6) * Math.PI + Math.PI;
                const fx = x + Math.cos(ang) * 110 * escala;
                const fy = y - alt + Math.sin(ang) * 50 * escala + 40 * escala;
                return (
                  <path
                    key={k}
                    d={`M${x} ${y - alt} Q${(x + fx) / 2} ${y - alt - 40 * escala} ${fx} ${fy}`}
                    stroke={cor}
                    strokeWidth={14 * escala}
                    strokeLinecap="round"
                    fill="none"
                  />
                );
              })}
            </g>
          );
        }
        const r = (70 + random(`${semente}r${i}`) * 70) * escala;
        return (
          <g key={i} fill={cor}>
            <rect x={x - 12 * escala} y={y - alt + r} width={24 * escala} height={alt - r} />
            <circle cx={x} cy={y - alt + r * 0.6} r={r} />
            <circle cx={x - r * 0.75} cy={y - alt + r * 1.1} r={r * 0.7} />
            <circle cx={x + r * 0.8} cy={y - alt + r * 1.05} r={r * 0.75} />
          </g>
        );
      })}
    </svg>
  );
};

/** Folhagem grande e escura na frente, nas bordas do quadro (desfocada). */
export const Folhagem: React.FC<{ cor: string; semente?: string }> = ({ cor, semente = "f" }) => {
  const frame = useCurrentFrame();
  const folhas = Array.from({ length: 9 }).map((_, i) => {
    const esquerda = i % 2 === 0;
    return {
      x: esquerda ? -60 + random(`${semente}x${i}`) * 140 : W + 60 - random(`${semente}x${i}`) * 140,
      y: 200 + random(`${semente}y${i}`) * 1600,
      rot: (esquerda ? 30 : -30) + (random(`${semente}r${i}`) - 0.5) * 50,
      tam: 220 + random(`${semente}t${i}`) * 200,
    };
  });
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      {folhas.map((f, i) => (
        <g key={i} transform={`translate(${f.x} ${f.y}) rotate(${f.rot + Math.sin(frame / 30 + i) * 3})`}>
          <ellipse cx={0} cy={0} rx={f.tam * 0.28} ry={f.tam} fill={cor} />
          <line x1={0} y1={-f.tam} x2={0} y2={f.tam} stroke="#000" strokeOpacity={0.3} strokeWidth={6} />
        </g>
      ))}
    </svg>
  );
};

/** Névoa no horizonte, andando devagar. */
export const Nevoa: React.FC<{ cor: string; y: number; altura?: number; opacidade?: number }> = ({ cor, y, altura = 260, opacidade = 0.55 }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        left: -400 + Math.sin(frame / 90) * 60,
        width: W + 800,
        top: y - altura / 2,
        height: altura,
        background: `radial-gradient(ellipse at 50% 50%, ${cor} 0%, transparent 70%)`,
        opacity: opacidade,
      }}
    />
  );
};

/** Chão liso. */
export const Chao: React.FC<{ cor: string; y: number }> = ({ cor, y }) => (
  <div style={{ position: "absolute", left: -200, right: -200, top: y, bottom: -200, background: `linear-gradient(180deg, ${cor}, #0B0806)` }} />
);

/** Trilho em perspectiva sumindo no horizonte; `avanco` move os dormentes em direção à câmera. */
export const Trilho: React.FC<{ horizonteY: number; avanco?: number; cxFuga?: number; ate?: number }> = ({
  horizonteY,
  avanco = 0,
  cxFuga = 540,
  ate = 40,
}) => {
  const base = H + 200;
  const proj = (d: number) => {
    const s = 1 / (1 + d * 0.45);
    return { y: horizonteY + (base - horizonteY) * s, s };
  };
  const frac = avanco % 1;
  const dormentes = [];
  for (let i = 0; i < ate; i++) {
    const d = i - frac;
    if (d < -0.9) continue;
    const a = proj(d);
    const b = proj(d + 0.35);
    dormentes.push(
      <path
        key={i}
        d={`M${cxFuga - 520 * a.s} ${a.y} L${cxFuga + 520 * a.s} ${a.y} L${cxFuga + 520 * b.s} ${b.y} L${cxFuga - 520 * b.s} ${b.y} Z`}
        fill="#5A3A22"
        stroke="#2A1A0E"
        strokeWidth={Math.max(1, 6 * a.s)}
      />,
    );
  }
  const trilhoX = [-330, 330];
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      {/* leito de cascalho */}
      <path d={`M${cxFuga - 900} ${base} L${cxFuga} ${horizonteY} L${cxFuga + 900} ${base} Z`} fill="#4A3A2C" />
      {dormentes}
      {trilhoX.map((tx) => (
        <g key={tx}>
          <path d={`M${cxFuga + tx * 1.0} ${base} L${cxFuga} ${horizonteY}`} stroke="#2B2B30" strokeWidth={34} />
          <path d={`M${cxFuga + tx * 1.0 - 6} ${base} L${cxFuga} ${horizonteY}`} stroke="#C9CDD4" strokeWidth={10} />
        </g>
      ))}
    </svg>
  );
};

/** Mosquitos zumbindo (elemento vivo). */
export const Mosquitos: React.FC<{
  n?: number;
  semente?: string;
  area?: { x: number; y: number; w: number; h: number };
  tamanho?: number;
  cor?: string;
}> = ({ n = 8, semente = "q", area = { x: 0, y: 0, w: W, h: H }, tamanho = 1, cor = "#14110F" }) => {
  const frame = useCurrentFrame();
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      {Array.from({ length: n }).map((_, i) => {
        const vx = 0.02 + random(`${semente}vx${i}`) * 0.04;
        const vy = 0.03 + random(`${semente}vy${i}`) * 0.05;
        const x = area.x + area.w * (0.5 + 0.45 * Math.sin(frame * vx + i * 7));
        const y = area.y + area.h * (0.5 + 0.45 * Math.sin(frame * vy + i * 3));
        const asa = frame % 2 === 0 ? 1 : 0.4;
        const s = tamanho * (0.7 + random(`${semente}s${i}`) * 0.6);
        return (
          <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
            <ellipse cx={-6} cy={-6} rx={9} ry={4 * asa} fill="#FFFFFF" opacity={0.5} transform="rotate(-30)" />
            <ellipse cx={6} cy={-6} rx={9} ry={4 * asa} fill="#FFFFFF" opacity={0.5} transform="rotate(30)" />
            <ellipse cx={0} cy={0} rx={3} ry={9} fill={cor} />
            <line x1={0} y1={-9} x2={0} y2={-18} stroke={cor} strokeWidth={1.5} />
            {[-1, 1].map((l) => (
              <path key={l} d={`M0 2 l${l * 10} 8 l${l * 2} 8`} stroke={cor} strokeWidth={1.2} fill="none" />
            ))}
          </g>
        );
      })}
    </svg>
  );
};

/** Partículas flutuando (poeira na luz, ou vaga-lumes à noite). */
export const Particulas: React.FC<{ n?: number; cor: string; semente?: string; brilho?: boolean }> = ({
  n = 30,
  cor,
  semente = "p",
  brilho = false,
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: n }).map((_, i) => {
        const x = random(`${semente}x${i}`) * W + Math.sin(frame / 25 + i) * 20;
        const y = (random(`${semente}y${i}`) * H - frame * (0.4 + random(`${semente}v${i}`)) + H * 2) % H;
        const tam = 3 + random(`${semente}t${i}`) * 6;
        const pulso = brilho ? 0.4 + 0.6 * Math.abs(Math.sin(frame / 12 + i)) : 0.6;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: tam,
              height: tam,
              borderRadius: "50%",
              backgroundColor: cor,
              opacity: pulso,
              boxShadow: brilho ? `0 0 ${tam * 3}px ${cor}` : undefined,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
