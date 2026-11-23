import React from "react";
import { AbsoluteFill } from "remotion";
import { BonecoNanquim, FONTE_RABISCO, PAPEL, POSES, TINTA } from "./Nanquim";

/** Capa no conceito da referência (fundo branco, silhueta preguiçosa, letra rabiscada) — frase e desenho próprios. */
export const CapaAmbicioso: React.FC<{ frase: string }> = ({ frase }) => (
  <AbsoluteFill style={{ backgroundColor: PAPEL }}>
    <div
      style={{
        position: "absolute",
        top: 60,
        left: 0,
        right: 0,
        textAlign: "center",
        fontFamily: FONTE_RABISCO,
        fontWeight: 700,
        fontSize: 124,
        whiteSpace: "nowrap",
        color: TINTA,
        letterSpacing: 2,
      }}
    >
      {frase}
    </div>
    <BonecoNanquim pose={POSES.deitado} x={330} y={-60} escala={1.4} />
    <div style={{ position: "absolute", left: 880, top: 360, fontFamily: FONTE_RABISCO, fontWeight: 700, fontSize: 80, color: TINTA, rotate: "-10deg" }}>
      zzz
    </div>
  </AbsoluteFill>
);
