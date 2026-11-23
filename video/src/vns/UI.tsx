import React from "react";
import { AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CLAMP, COR, F } from "./estilo";

const contorno = (px: number, cor: string = COR.escuro): React.CSSProperties => ({
  WebkitTextStroke: `${px}px ${cor}`,
  paintOrder: "stroke fill",
});

/** Pílula escura com borda creme — só para número, nome ou data. `x` desloca a partir do centro. */
export const Pilula: React.FC<{
  children: React.ReactNode;
  x?: number;
  y: number;
  inicio?: number;
  tamanho?: number;
  cor?: string;
}> = ({ children, x, y, inicio = 0, tamanho = 64, cor = COR.creme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entra = spring({ frame: frame - inicio, fps, config: { damping: 12, stiffness: 180 } });
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        translate: `${x ?? 0}px 0px`,
        scale: String(entra),
      }}
    >
      <div
        style={{
          fontFamily: F.titulo,
          fontSize: tamanho,
          color: cor,
          backgroundColor: "rgba(18,15,24,0.9)",
          border: `5px solid ${COR.creme}`,
          borderRadius: 999,
          padding: `${tamanho * 0.18}px ${tamanho * 0.55}px`,
          letterSpacing: 2,
          boxShadow: "0 12px 30px rgba(0,0,0,0.45)",
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </div>
    </div>
  );
};

/** Etiqueta de calendário vermelha no canto (ano em cima, hora embaixo). */
export const Calendario: React.FC<{ ano: string; hora?: string; inicio?: number }> = ({ ano, hora, inicio = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entra = spring({ frame: frame - inicio, fps, config: { damping: 10 } });
  return (
    <div style={{ position: "absolute", top: 300, right: 70, width: 210, rotate: `${4 - entra * 2}deg`, scale: String(entra) }}>
      <div style={{ position: "relative", borderRadius: 22, overflow: "hidden", boxShadow: "0 14px 30px rgba(0,0,0,0.5)", border: `5px solid ${COR.escuro}` }}>
        <div style={{ backgroundColor: COR.vermelho, color: COR.creme, fontFamily: F.titulo, fontSize: 64, textAlign: "center", padding: "10px 0 4px" }}>
          {ano}
        </div>
        {hora ? (
          <div style={{ backgroundColor: COR.creme, color: COR.escuro, fontFamily: F.titulo, fontSize: 70, textAlign: "center", padding: "2px 0 6px" }}>
            {hora}
          </div>
        ) : null}
      </div>
      {[50, 150].map((x) => (
        <div key={x} style={{ position: "absolute", top: -14, left: x - 9, width: 18, height: 34, borderRadius: 9, backgroundColor: COR.escuro }} />
      ))}
    </div>
  );
};

/** Contador grande (sobe do zero até o valor). */
export const Contador: React.FC<{
  ate: number;
  y: number;
  inicio?: number;
  duracao?: number;
  prefixo?: string;
  sufixo?: string;
  rotulo?: string;
  cor?: string;
}> = ({ ate, y, inicio = 0, duracao = 30, prefixo = "", sufixo = "", rotulo, cor = COR.creme }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [inicio, inicio + duracao], [0, 1], { ...CLAMP, easing: Easing.out(Easing.cubic) });
  const valor = (t >= 0.995 ? ate : Math.round(ate * t)).toLocaleString("pt-BR");
  const pulo = interpolate(frame, [inicio + duracao, inicio + duracao + 8], [1.18, 1], CLAMP);
  return (
    <div style={{ position: "absolute", top: y, left: 0, right: 0, textAlign: "center", opacity: frame >= inicio ? 1 : 0 }}>
      <div style={{ fontFamily: F.titulo, fontSize: 230, lineHeight: 1, color: cor, scale: String(pulo), ...contorno(18), textShadow: "0 14px 0 rgba(0,0,0,0.45)" }}>
        {prefixo}
        {valor}
        {sufixo}
      </div>
      {rotulo ? (
        <div style={{ fontFamily: F.titulo, fontSize: 60, color: COR.creme, marginTop: 8, letterSpacing: 3, ...contorno(10) }}>{rotulo}</div>
      ) : null}
    </div>
  );
};

/** Bilhete de papel escrito à mão (Caveat), preso com fita. */
export const Bilhete: React.FC<{
  children: React.ReactNode;
  x: number;
  y: number;
  largura?: number;
  rot?: number;
  inicio?: number;
  tamanho?: number;
}> = ({ children, x, y, largura = 560, rot = -4, inicio = 0, tamanho = 76 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entra = spring({ frame: frame - inicio, fps, config: { damping: 13 } });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: largura,
        rotate: `${rot}deg`,
        translate: `0px ${(1 - entra) * 120}px`,
        opacity: Math.min(1, entra * 1.5),
      }}
    >
      <div
        style={{
          backgroundColor: "#F6EBD0",
          backgroundImage: "repeating-linear-gradient(180deg, transparent 0 62px, rgba(70,90,140,0.22) 62px 65px)",
          padding: "34px 40px 30px",
          fontFamily: F.bilhete,
          fontSize: tamanho,
          lineHeight: 1.05,
          color: "#2A2230",
          boxShadow: "0 18px 34px rgba(0,0,0,0.5)",
          borderRadius: 6,
        }}
      >
        {children}
      </div>
      <div style={{ position: "absolute", top: -22, left: largura / 2 - 80, width: 160, height: 44, backgroundColor: "rgba(240,230,190,0.75)", rotate: "3deg" }} />
    </div>
  );
};

/** Carimbo vermelho que bate na tela. */
export const Carimbo: React.FC<{ texto: string; x: number; y: number; inicio: number; rot?: number }> = ({ texto, x, y, inicio, rot = -14 }) => {
  const frame = useCurrentFrame();
  const t = frame - inicio;
  if (t < 0) return null;
  const escala = interpolate(t, [0, 5], [2.4, 1], { ...CLAMP, easing: Easing.out(Easing.quad) });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        rotate: `${rot}deg`,
        scale: String(escala),
        opacity: interpolate(t, [0, 3], [0, 0.92], CLAMP),
        fontFamily: F.titulo,
        fontSize: 120,
        color: COR.vermelho,
        border: `10px solid ${COR.vermelho}`,
        borderRadius: 18,
        padding: "0 30px",
        letterSpacing: 6,
      }}
    >
      {texto}
    </div>
  );
};

export type Queda = { em: number; para: number };

/**
 * Barra CHANCE DE SOBREVIVER: cai a cada erro, treme e pisca vermelho em cada queda.
 * `quedas` em frames absolutos do vídeo; `frameVideo` é o frame global.
 */
export const BarraChance: React.FC<{ quedas: Queda[]; frameVideo: number; inicial?: number; aparece?: number }> = ({
  quedas,
  frameVideo,
  inicial = 100,
  aparece = 0,
}) => {
  const { fps } = useVideoConfig();
  let valor = inicial;
  let ultimaQueda = -999;
  for (const q of quedas) {
    if (frameVideo >= q.em) {
      const antes = valor;
      valor = interpolate(frameVideo, [q.em, q.em + 10], [antes, q.para], { ...CLAMP, easing: Easing.out(Easing.cubic) });
      ultimaQueda = q.em;
    }
  }
  const desdeQueda = frameVideo - ultimaQueda;
  const tremor = interpolate(desdeQueda, [0, 16], [1, 0], CLAMP);
  const dx = (random(`cx${frameVideo}`) - 0.5) * 26 * tremor;
  const dy = (random(`cy${frameVideo}`) - 0.5) * 14 * tremor;
  const cor = valor > 60 ? "#58C46B" : valor > 30 ? "#F2B33D" : COR.vermelho;
  const entra = spring({ frame: frameVideo - aparece, fps, config: { damping: 14 } });
  return (
    <div style={{ position: "absolute", top: 120, left: 90, right: 90, translate: `${dx}px ${dy - (1 - entra) * 200}px` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontFamily: F.titulo, color: COR.creme, ...contorno(9) }}>
        <span style={{ fontSize: 46, letterSpacing: 2 }}>CHANCE DE SOBREVIVER</span>
        <span style={{ fontSize: 74, color: tremor > 0.2 ? COR.vermelho : COR.creme }}>{Math.round(valor)}%</span>
      </div>
      <div style={{ height: 40, marginTop: 6, borderRadius: 20, backgroundColor: "rgba(18,15,24,0.88)", border: `5px solid ${COR.creme}`, padding: 4 }}>
        <div
          style={{
            width: `${valor}%`,
            height: "100%",
            borderRadius: 14,
            backgroundColor: cor,
            boxShadow: tremor > 0 ? `0 0 ${30 * tremor}px ${COR.vermelho}` : undefined,
          }}
        />
      </div>
    </div>
  );
};

/** Flash vermelho de borda quando a chance cai. */
export const FlashPerigo: React.FC<{ em: number; frameVideo: number }> = ({ em, frameVideo }) => {
  const t = frameVideo - em;
  if (t < 0 || t > 14) return null;
  return <AbsoluteFill style={{ boxShadow: `inset 0 0 220px 40px rgba(224,49,43,${interpolate(t, [0, 14], [0.75, 0])})` }} />;
};
