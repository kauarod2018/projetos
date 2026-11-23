import { Composition } from "remotion";
import { Video } from "./Video";
import timeline from "../public/timeline.json";

export const Raiz: React.FC = () => (
  <Composition
    id="LuaNaoCai"
    component={Video}
    durationInFrames={Math.ceil(timeline.duracao * timeline.fps)}
    fps={timeline.fps}
    width={1920}
    height={1080}
  />
);
