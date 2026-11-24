import React from "react";
import { Composition } from "remotion";
import { GuerraDoParaguai, TOTAL_FRAMES } from "./videos/GuerraDoParaguai";

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
  </>
);
