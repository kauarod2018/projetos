import React from "react";
import { Composition, Still } from "remotion";
import { GuerraDoParaguai, TOTAL_FRAMES } from "./videos/GuerraDoParaguai";
import { Napoleao, NAPOLEAO_FRAMES } from "./videos/Napoleao";
import { Waterloo1815, WaterlooCapa, WATERLOO_FRAMES } from "./videos/Waterloo";

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
    <Composition id="Waterloo1815" component={Waterloo1815} durationInFrames={WATERLOO_FRAMES} fps={30} width={1080} height={1920} />
    <Still id="WaterlooCapa" component={WaterlooCapa} width={1080} height={1920} />
  </>
);
