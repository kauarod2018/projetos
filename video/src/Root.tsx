import type { Caption } from "@remotion/captions";
import React from "react";
import { Composition } from "remotion";
import { Arena3D } from "./Arena3D";
import { Batalha2D } from "./Batalha2D";
import legendasJson from "./dados/legendas.json";

const legendas = legendasJson as Caption[];
const FPS = 30;
// O vídeo dura o tempo da narração + 1,5 s de respiro no final.
const fimMs = legendas[legendas.length - 1].endMs + 1500;

/** Acha em que segundo uma palavra é falada, para sincronizar a animação com a voz.
 * Aceita variações, porque o Whisper às vezes escreve "3" em vez de "três". */
const quando = (palavras: string[], depoisDe = 0) => {
  const achada = legendas.find(
    (c) =>
      c.startMs >= depoisDe * 1000 &&
      palavras.some((p) => c.text.trim().toLowerCase().startsWith(p.toLowerCase())),
  );
  if (!achada) throw new Error(`Nenhuma destas palavras está na narração: ${palavras.join(", ")}`);
  return achada.startMs / 1000;
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Batalha2D"
        component={Batalha2D}
        durationInFrames={Math.ceil((fimMs / 1000) * FPS)}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{
          legendas,
          tempos: {
            fogoAcende: quando(["brilhar"]),
            ataque: quando(["ataca"]),
            contagem: quando(["três", "3"]),
            pergunta: quando(["correr"]),
          },
        }}
      />
      <Composition id="Arena3D" component={Arena3D} durationInFrames={6 * FPS} fps={FPS} width={1080} height={1920} />
    </>
  );
};
