import { Audio } from "@remotion/media";
import type { Caption } from "@remotion/captions";
import React from "react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import "./fontes";
import { Legendas } from "./Legendas";

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

type Props = {
  readonly legendas: Caption[];
  /** Momentos-chave em segundos (vêm da narração). */
  readonly tempos: { fogoAcende: number; ataque: number; contagem: number; pergunta: number };
};

/** Demo 2D: uma batalha simples feita só de formas, animada por código e sincronizada com a narração. */
export const Batalha2D: React.FC<Props> = ({ legendas, tempos }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = (seg: number) => Math.round(seg * fps);

  // Tremida de câmera logo depois do impacto.
  const forcaTremida = interpolate(frame, [s(tempos.ataque), s(tempos.ataque) + 14], [1, 0], CLAMP);
  const tremX = (random(`x${frame}`) - 0.5) * 50 * forcaTremida;
  const tremY = (random(`y${frame}`) - 0.5) * 50 * forcaTremida;
  const zoom = interpolate(frame, [0, s(tempos.pergunta)], [1.08, 1], { ...CLAMP, easing: Easing.out(Easing.quad) });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0B0D17" }}>
      <AbsoluteFill style={{ translate: `${tremX}px ${tremY}px`, scale: String(zoom) }}>
        <Cenario fogoAcende={s(tempos.fogoAcende)} />
        <Lutador
          nome="VOCÊ"
          cor="#3A86FF"
          x={290}
          entrada={0}
          recuo={s(tempos.ataque)}
          vidaAntes={100}
          vidaDepois={62}
        />
        <LutadorFogo acende={s(tempos.fogoAcende)} ataque={s(tempos.ataque)} />
        <Impacto quando={s(tempos.ataque)} />
      </AbsoluteFill>

      <Sequence name="Contagem" from={s(tempos.contagem)} durationInFrames={s(tempos.pergunta - tempos.contagem)}>
        <Contagem duracao={s(tempos.pergunta - tempos.contagem)} />
      </Sequence>
      <Sequence name="Pergunta final" from={s(tempos.pergunta)}>
        <Pergunta />
      </Sequence>

      {/* No final a pergunta já está escrita em letras grandes, então a legenda sai antes. */}
      <Legendas legendas={legendas.filter((c) => c.startMs < tempos.pergunta * 1000)} />
      <Audio name="Narração" src={staticFile("narracao.wav")} />
    </AbsoluteFill>
  );
};

const Cenario: React.FC<{ fogoAcende: number }> = ({ fogoAcende }) => {
  const frame = useCurrentFrame();
  const calor = interpolate(frame, [fogoAcende, fogoAcende + 30], [0, 1], CLAMP);
  return (
    <AbsoluteFill>
      {/* céu */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, #11142A 0%, ${calor > 0.5 ? "#3B1624" : "#1A1F3D"} 58%, #2A1A12 100%)`,
        }}
      />
      {/* brilho quente que cresce quando o lutador de fogo acende */}
      <AbsoluteFill
        style={{
          background: "radial-gradient(circle at 78% 52%, rgba(255,120,30,0.55), transparent 55%)",
          opacity: calor,
        }}
      />
      {/* arquibancada */}
      {Array.from({ length: 14 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: i * 80 - 20,
            top: 640 + (i % 2) * 18,
            width: 70,
            height: 120,
            borderRadius: "35px 35px 0 0",
            backgroundColor: "#151833",
          }}
        />
      ))}
      {/* chão da arena */}
      <div
        style={{
          position: "absolute",
          left: -100,
          right: -100,
          top: 1180,
          height: 900,
          background: "linear-gradient(180deg, #5C3B24, #2B1B10)",
          borderTop: "10px solid #1A100A",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 140,
          width: 800,
          top: 1230,
          height: 120,
          borderRadius: "50%",
          border: "6px dashed rgba(255,255,255,0.18)",
        }}
      />
    </AbsoluteFill>
  );
};

const Corpo: React.FC<{ cor: string; olhar: number; bravo?: boolean }> = ({ cor, olhar, bravo }) => (
  <div style={{ position: "relative", width: 240, height: 330 }}>
    {/* sombra */}
    <div
      style={{
        position: "absolute",
        left: 20,
        bottom: -30,
        width: 200,
        height: 40,
        borderRadius: "50%",
        backgroundColor: "rgba(0,0,0,0.45)",
      }}
    />
    {/* corpo em forma de feijão, com contorno grosso de desenho animado */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: "120px 120px 90px 90px",
        backgroundColor: cor,
        border: "12px solid #0B0D17",
        boxShadow: "inset -26px -20px 0 rgba(0,0,0,0.22)",
      }}
    />
    {[70, 150].map((x) => (
      <div
        key={x}
        style={{
          position: "absolute",
          left: x + olhar * 10,
          top: 90,
          width: 34,
          height: bravo ? 30 : 46,
          borderRadius: 20,
          backgroundColor: "#0B0D17",
          rotate: bravo ? (x === 70 ? "18deg" : "-18deg") : "0deg",
        }}
      />
    ))}
  </div>
);

const Lutador: React.FC<{
  nome: string;
  cor: string;
  x: number;
  entrada: number;
  recuo: number;
  vidaAntes: number;
  vidaDepois: number;
}> = ({ nome, cor, x, entrada, recuo, vidaAntes, vidaDepois }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aparece = spring({ frame: frame - entrada, fps, config: { damping: 12 } });
  const empurrao = spring({ frame: frame - recuo, fps, config: { damping: 9, stiffness: 120 } });
  const respira = Math.sin(frame / 9) * 6;
  const vida = interpolate(frame, [recuo, recuo + 10], [vidaAntes, vidaDepois], CLAMP);

  return (
    <div
      style={{
        position: "absolute",
        left: x - 120 - empurrao * 70,
        top: 880 + respira,
        scale: String(aparece),
        rotate: `${-empurrao * 8 * Math.max(0, 1 - (frame - recuo) / 40)}deg`,
      }}
    >
      <BarraVida nome={nome} vida={vida} cor={cor} />
      <Corpo cor={cor} olhar={1} />
    </div>
  );
};

const LutadorFogo: React.FC<{ acende: number; ataque: number }> = ({ acende, ataque }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aparece = spring({ frame, fps, delay: 8, config: { damping: 12 } });
  const brilho = interpolate(frame, [acende, acende + 25], [0, 1], CLAMP);
  // investida: vai até o outro lutador e volta
  const ida = interpolate(frame, [ataque - 8, ataque], [0, 1], { ...CLAMP, easing: Easing.in(Easing.cubic) });
  const volta = interpolate(frame, [ataque + 4, ataque + 24], [0, 1], { ...CLAMP, easing: Easing.out(Easing.cubic) });
  const deslocamento = (ida - volta) * -330;
  const respira = Math.sin(frame / 7 + 1) * 6;
  const cor = brilho > 0.4 ? "#FF6B1A" : "#8A8FA8";

  return (
    <>
      {/* a barra fica parada no lugar enquanto o lutador avança */}
      <div style={{ position: "absolute", left: 790 - 120, top: 880 + respira, scale: String(aparece) }}>
        <BarraVida nome="FOGO" vida={100} cor="#FF6B1A" />
      </div>
    <div style={{ position: "absolute", left: 790 - 120 + deslocamento, top: 880 + respira, scale: String(aparece) }}>
      <div style={{ position: "relative" }}>
        <Chamas intensidade={brilho} />
        <div style={{ filter: `drop-shadow(0 0 ${40 * brilho}px rgba(255,140,40,${brilho}))` }}>
          <Corpo cor={cor} olhar={-1} bravo={brilho > 0.4} />
        </div>
      </div>
    </div>
    </>
  );
};

const Chamas: React.FC<{ intensidade: number }> = ({ intensidade }) => {
  const frame = useCurrentFrame();
  if (intensidade <= 0) return null;
  return (
    <>
      {Array.from({ length: 16 }).map((_, i) => {
        const ciclo = 26 + random(`c${i}`) * 14;
        const fase = ((frame + random(`f${i}`) * ciclo) % ciclo) / ciclo;
        const tamanho = (30 + random(`t${i}`) * 34) * (1 - fase);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 20 + random(`x${i}`) * 200,
              top: 40 - fase * 220,
              width: tamanho,
              height: tamanho,
              borderRadius: "50% 50% 50% 0",
              rotate: "-45deg",
              backgroundColor: fase < 0.4 ? "#FFD60A" : "#FF6B1A",
              opacity: (1 - fase) * intensidade,
            }}
          />
        );
      })}
    </>
  );
};

const BarraVida: React.FC<{ nome: string; vida: number; cor: string }> = ({ nome, vida, cor }) => (
  <div style={{ position: "absolute", top: -120, left: -10, width: 260 }}>
    <div style={{ fontFamily: "Anton, sans-serif", fontSize: 46, color: "white", WebkitTextStroke: "8px #0B0D17", paintOrder: "stroke fill" }}>
      {nome}
    </div>
    <div style={{ height: 30, borderRadius: 15, backgroundColor: "#0B0D17", padding: 5 }}>
      <div style={{ width: `${vida}%`, height: "100%", borderRadius: 10, backgroundColor: vida < 70 ? "#FF3B30" : cor }} />
    </div>
  </div>
);

const Impacto: React.FC<{ quando: number }> = ({ quando }) => {
  const frame = useCurrentFrame();
  const t = frame - quando;
  if (t < 0 || t > 16) return null;
  const raio = interpolate(t, [0, 16], [80, 520]);
  return (
    <>
      <AbsoluteFill style={{ backgroundColor: "white", opacity: interpolate(t, [0, 5], [0.85, 0], CLAMP) }} />
      <div
        style={{
          position: "absolute",
          left: 420 - raio / 2,
          top: 1040 - raio / 2,
          width: raio,
          height: raio,
          borderRadius: "50%",
          border: `${interpolate(t, [0, 16], [40, 2])}px solid #FFD60A`,
          opacity: interpolate(t, [8, 16], [1, 0], CLAMP),
        }}
      />
      <div
        style={{
          position: "absolute",
          // em cima da cabeça de quem levou o golpe
          left: 70,
          top: 640 - t * 6,
          fontFamily: "Anton, sans-serif",
          fontSize: 140,
          color: "#FFD60A",
          WebkitTextStroke: "14px #0B0D17",
          paintOrder: "stroke fill",
          rotate: "-12deg",
          scale: String(interpolate(t, [0, 4], [0.4, 1.15], CLAMP)),
        }}
      >
        -38
      </div>
    </>
  );
};

const Contagem: React.FC<{ duracao: number }> = ({ duracao }) => {
  const frame = useCurrentFrame();
  const numero = 3 - Math.min(2, Math.floor((frame / duracao) * 3));
  const local = frame % Math.ceil(duracao / 3);
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 230 }}>
      <div
        style={{
          fontFamily: "Anton, sans-serif",
          fontSize: 300,
          color: "#FF3B30",
          WebkitTextStroke: "20px #0B0D17",
          paintOrder: "stroke fill",
          scale: String(interpolate(local, [0, 8], [1.6, 1], { ...CLAMP, easing: Easing.out(Easing.back(2)) })),
        }}
      >
        {numero}
      </div>
    </AbsoluteFill>
  );
};

const Pergunta: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entra = spring({ frame, fps, config: { damping: 11 } });
  return (
    <AbsoluteFill
      style={{
        backgroundColor: `rgba(11,13,23,${0.88 * Math.min(1, entra)})`,
        alignItems: "center",
        justifyContent: "space-between",
        padding: "300px 0 380px",
      }}
    >
      <div
        style={{
          fontFamily: "Anton, sans-serif",
          fontSize: 150,
          lineHeight: 1,
          textAlign: "center",
          color: "white",
          WebkitTextStroke: "16px #0B0D17",
          paintOrder: "stroke fill",
          scale: String(entra),
        }}
      >
        CORRER
        <br />
        <span style={{ color: "#FFD60A", fontSize: 100 }}>OU</span>
        <br />
        LUTAR?
      </div>
      <div style={{ display: "flex", gap: 40, scale: String(entra) }}>
        {[
          ["🏃 CORRER", "#3A86FF"],
          ["🥊 LUTAR", "#FF3B30"],
        ].map(([rotulo, cor]) => (
          <div
            key={rotulo}
            style={{
              fontFamily: "Anton, sans-serif",
              fontSize: 64,
              color: "white",
              padding: "24px 44px",
              borderRadius: 28,
              backgroundColor: cor,
              border: "10px solid #0B0D17",
            }}
          >
            {rotulo}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
