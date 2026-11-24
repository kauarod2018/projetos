import React from "react";
import { Composition } from "remotion";
import { GuerraDoParaguai, TOTAL_FRAMES } from "./videos/GuerraDoParaguai";
import { Napoleao, NAPOLEAO_FRAMES } from "./videos/Napoleao";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="GuerraDoParaguai"
      component={GuerraDoParaguai}
      durationInFrames={TOTAL_FRAMES}
      fps={30}
      width={1080}
      height={1920}
    />
    <Composition id="NapoleaoRussia" component={Napoleao} durationInFrames={NAPOLEAO_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
