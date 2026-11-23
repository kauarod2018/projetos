import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

/**
 * Acabamento GRADE do modelo v3: saturação +16%, contraste em S leve, pretos levemente levantados,
 * vinheta e grão fino animado. Envolve a cena inteira (menos o HUD e a legenda).
 */
export const Acabamento: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ filter: "saturate(1.16) contrast(1.07)" }}>{children}</AbsoluteFill>
      {/* pretos levantados */}
      <AbsoluteFill style={{ backgroundColor: "rgba(46,34,56,0.10)", mixBlendMode: "lighten" }} />
      {/* vinheta (metade da força) */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,0.42) 100%)" }} />
      {/* grão fino: a semente muda a cada frame */}
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.09, mixBlendMode: "overlay" }}>
        <filter id="grao">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={frame % 12} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grao)" />
      </svg>
    </AbsoluteFill>
  );
};
