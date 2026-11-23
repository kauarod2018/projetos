import { loadFont } from "@remotion/fonts";
import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * Estilo "nanquim" (como a capa da referência): papel branco, boneco preto em silhueta com brilho
 * branco nas bordas, traço que "ferve" levemente (desenho à mão) e letra rabiscada.
 */
export const FONTE_RABISCO = "Cabin Sketch";
loadFont({ family: FONTE_RABISCO, url: staticFile("fonts/CabinSketch.woff2"), weight: "700" });

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const TINTA = "#111111";
export const PAPEL = "#F7F5F0";

/** Papel + filtro que faz o traço tremer como desenho à mão (muda a cada 3 frames). */
export const Papel: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const semente = Math.floor(frame / 3) % 6;
  return (
    <AbsoluteFill style={{ backgroundColor: PAPEL }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="ferver">
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves={2} seed={semente} />
          <feDisplacementMap in="SourceGraphic" scale={5} />
        </filter>
      </svg>
      {/* textura do papel */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, transparent 60%, rgba(120,100,70,0.10) 100%)" }} />
      <AbsoluteFill style={{ filter: "url(#ferver)" }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Texto rabiscado que aparece da esquerda para a direita, como se fosse escrito. */
export const Escrita: React.FC<{
  children: React.ReactNode;
  x?: number;
  y: number;
  tamanho?: number;
  inicio?: number;
  duracao?: number;
  cor?: string;
  alinhar?: "left" | "center";
  largura?: number;
}> = ({ children, x = 0, y, tamanho = 110, inicio = 0, duracao = 18, cor = TINTA, alinhar = "center", largura = 1920 }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [inicio, inicio + duracao], [0, 100], { ...CLAMP, easing: Easing.out(Easing.quad) });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: largura,
        textAlign: alinhar,
        fontFamily: FONTE_RABISCO,
        fontWeight: 700,
        fontSize: tamanho,
        lineHeight: 1.1,
        color: cor,
        clipPath: `inset(-20% ${100 - t}% -20% -5%)`,
      }}
    >
      {children}
    </div>
  );
};

/** Linha/curva que se desenha (para setas, montanha, círculos). */
export const Traco: React.FC<{ d: string; inicio?: number; duracao?: number; largura?: number; cor?: string; preencher?: string }> = ({
  d,
  inicio = 0,
  duracao = 20,
  largura = 8,
  cor = TINTA,
  preencher = "none",
}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [inicio, inicio + duracao], [0, 1], { ...CLAMP, easing: Easing.inOut(Easing.cubic) });
  return (
    <path
      d={d}
      stroke={cor}
      strokeWidth={largura}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={preencher}
      fillOpacity={preencher === "none" ? 0 : t}
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={1 - t}
    />
  );
};

type Ponto = [number, number];
export type Pose = {
  cabeca: Ponto;
  pescoco: Ponto;
  quadril: Ponto;
  maoE: Ponto;
  cotoveloE: Ponto;
  maoD: Ponto;
  cotoveloD: Ponto;
  joelhoE: Ponto;
  peE: Ponto;
  joelhoD: Ponto;
  peD: Ponto;
};

/** Poses do boneco (coordenadas num quadro de ~400x500, pés em y≈480). */
export const POSES: Record<string, Pose> = {
  empe: {
    cabeca: [200, 70], pescoco: [200, 140], quadril: [200, 300],
    cotoveloE: [160, 220], maoE: [150, 300], cotoveloD: [240, 220], maoD: [250, 300],
    joelhoE: [180, 390], peE: [170, 480], joelhoD: [220, 390], peD: [230, 480],
  },
  heroi: {
    cabeca: [200, 60], pescoco: [200, 130], quadril: [200, 295],
    cotoveloE: [140, 190], maoE: [130, 260], cotoveloD: [270, 170], maoD: [320, 110],
    joelhoE: [170, 390], peE: [150, 480], joelhoD: [235, 390], peD: [255, 480],
  },
  curvado: {
    cabeca: [235, 150], pescoco: [215, 200], quadril: [190, 330],
    cotoveloE: [180, 270], maoE: [205, 330], cotoveloD: [235, 275], maoD: [250, 335],
    joelhoE: [200, 410], peE: [185, 480], joelhoD: [215, 410], peD: [225, 480],
  },
  sentado: {
    cabeca: [180, 120], pescoco: [190, 185], quadril: [175, 340],
    cotoveloE: [230, 270], maoE: [300, 260], cotoveloD: [245, 285], maoD: [320, 280],
    joelhoE: [300, 345], peE: [300, 480], joelhoD: [310, 355], peD: [315, 480],
  },
  sofa: {
    cabeca: [150, 200], pescoco: [170, 255], quadril: [215, 380],
    cotoveloE: [200, 330], maoE: [245, 280], cotoveloD: [230, 335], maoD: [260, 290],
    joelhoE: [330, 330], peE: [370, 470], joelhoD: [340, 345], peD: [385, 475],
  },
  deitado: {
    cabeca: [345, 425], pescoco: [300, 440], quadril: [150, 450],
    cotoveloE: [260, 470], maoE: [200, 478], cotoveloD: [250, 455], maoD: [190, 462],
    joelhoE: [95, 360], peE: [30, 470], joelhoD: [120, 355], peD: [60, 472],
  },
};

const lerp = (a: Ponto, b: Ponto, t: number): Ponto => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export const misturarPose = (a: Pose, b: Pose, t: number): Pose =>
  Object.fromEntries(Object.keys(a).map((k) => [k, lerp(a[k as keyof Pose], b[k as keyof Pose], t)])) as Pose;

/** Boneco de nanquim: silhueta preta grossa com fios de luz brancos (como na capa). */
export const BonecoNanquim: React.FC<{ pose: Pose; x: number; y: number; escala?: number; espelhar?: boolean; olhoBrilho?: boolean }> = ({
  pose: p,
  x,
  y,
  escala = 1,
  espelhar = false,
  olhoBrilho = true,
}) => {
  const membro = (a: Ponto, b: Ponto, c: Ponto, largura: number) => (
    <>
      <path d={`M${a[0]} ${a[1]} L${b[0]} ${b[1]} L${c[0]} ${c[1]}`} stroke={TINTA} strokeWidth={largura} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d={`M${a[0] + 10} ${a[1]} L${b[0] + 10} ${b[1]}`} stroke="#FFFFFF" strokeWidth={3.5} strokeLinecap="round" opacity={0.9} />
    </>
  );
  return (
    <svg
      width={400 * escala}
      height={500 * escala}
      viewBox="0 0 400 500"
      style={{ position: "absolute", left: x, top: y, overflow: "visible", scale: espelhar ? "-1 1" : undefined }}
    >
      {/* chão rabiscado */}
      <path d="M-20 486 Q100 480 200 488 T420 484" stroke={TINTA} strokeWidth={4} fill="none" />
      {membro(p.quadril, p.joelhoE, p.peE, 64)}
      {membro(p.quadril, p.joelhoD, p.peD, 64)}
      {/* tronco */}
      <path d={`M${p.pescoco[0]} ${p.pescoco[1]} L${p.quadril[0]} ${p.quadril[1]}`} stroke={TINTA} strokeWidth={128} strokeLinecap="round" />
      {membro(p.pescoco, p.cotoveloE, p.maoE, 50)}
      {membro(p.pescoco, p.cotoveloD, p.maoD, 50)}
      <circle cx={p.cabeca[0]} cy={p.cabeca[1]} r={76} fill={TINTA} />
      {/* brilho na cabeça e "cabelo" rabiscado */}
      {olhoBrilho ? <path d={`M${p.cabeca[0] + 22} ${p.cabeca[1] - 36} q8 24 0 48`} stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" fill="none" /> : null}
      <path d={`M${p.cabeca[0] + 64} ${p.cabeca[1] - 36} q26 34 2 82`} stroke={TINTA} strokeWidth={3} fill="none" />
    </svg>
  );
};

/** Cartela de seção: número grande + título rabiscado + boneco. */
export const CartelaSecao: React.FC<{ numero: string; titulo: string; pose?: Pose }> = ({ numero, titulo, pose = POSES.empe }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entra = spring({ frame, fps, config: { damping: 12 } });
  return (
    <Papel>
      <div
        style={{
          position: "absolute",
          left: 200,
          top: 230,
          fontFamily: FONTE_RABISCO,
          fontWeight: 700,
          fontSize: 420,
          lineHeight: 1,
          color: TINTA,
          scale: String(entra),
        }}
      >
        {numero}
      </div>
      <Escrita x={560} y={300} tamanho={104} inicio={8} duracao={22} alinhar="left" largura={820}>
        {titulo}
      </Escrita>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <Traco d="M560 600 Q900 585 1300 605" inicio={26} duracao={14} largura={7} />
      </svg>
      <BonecoNanquim pose={pose} x={1400} y={420} escala={1.15} />
    </Papel>
  );
};
