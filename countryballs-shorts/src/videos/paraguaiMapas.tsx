import React from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame } from "remotion";
import { WorldMap, MapBall, MapArrow, MapPin, MapLabel, cameraAt, CountryStyle, LonLat } from "../components/map";
import { Caption, YearTag, Bubble, SceneIn, Footnote } from "../components/ui";

// Cenas em mapa aberto da Guerra do Paraguai.

const ease = Easing.inOut(Easing.cubic);
const mv = (f: number, r: [number, number], v: [number, number]) =>
  interpolate(f, r, v, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
const lerpPt = (f: number, r: [number, number], a: LonLat, b: LonLat): LonLat => [mv(f, r, [a[0], b[0]]), mv(f, r, [a[1], b[1]])];
const hop = (f: number, r: [number, number], h = 30) => (f >= r[0] && f <= r[1] ? -Math.abs(Math.sin((f - r[0]) * 0.5)) * h : 0);

// Lugares (longitude, latitude)
export const P = {
  paraguai: [-58.2, -23.4] as LonLat,
  uruguai: [-56.0, -32.8] as LonLat,
  brasil: [-50, -12] as LonLat,
  argentina: [-65, -35] as LonLat,
  rioGrande: [-53.2, -29.0] as LonLat,
  matoGrosso: [-55.5, -15.5] as LonLat,
  corrientes: [-58.0, -28.6] as LonLat,
  riachuelo: [-58.8, -27.5] as LonLat,
  tuyuti: [-58.37, -27.25] as LonLat,
  curupayty: [-58.56, -27.12] as LonLat,
  humaita: [-58.52, -27.07] as LonLat,
  assuncao: [-57.63, -25.28] as LonLat,
  cerroCora: [-56.0, -22.65] as LonLat,
};

const BRASIL_VERDE = "#1E9E4A";

const flagsOn = (dim = 1): Record<string, CountryStyle> => ({
  Brazil: { flag: "brasil", dim },
  Argentina: { flag: "argentina", dim },
  Uruguay: { flag: "uruguai", dim },
  Paraguay: { flag: "paraguai", dim },
});

// Escurece o topo para as legendas ficarem legíveis sobre o mapa.
const TopShade: React.FC = () => (
  <AbsoluteFill
    style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 25%, rgba(0,0,0,0) 38%)" }}
  />
);

// ---------- abertura: mapa-múndi -> América do Sul ----------
export const MapIntro: React.FC = () => {
  const f = useCurrentFrame();
  const cam = cameraAt(f, [
    { f: 0, lon: 0, lat: 10, zoom: 1 },
    { f: 22, lon: -20, lat: 0, zoom: 1.2 },
    { f: 85, lon: -60, lat: -22, zoom: 5.5 },
  ]);
  const dim = mv(f, [70, 95], [0, 1]);
  return (
    <SceneIn>
      <WorldMap camera={cam} countries={flagsOn(dim)}>
        {f > 92 && <MapBall flag="brasil" at={P.brasil} size={230} expression="surprised" look={-1} blinkSeed={1} />}
        {f > 98 && <MapBall flag="argentina" at={P.argentina} size={190} expression="surprised" look={1} blinkSeed={2} />}
        {f > 104 && <MapBall flag="uruguai" at={[-55.5, -33.2]} size={120} expression="surprised" look={-1} blinkSeed={3} />}
        {f > 86 && <MapBall flag="paraguai" at={P.paraguai} size={160} expression="determined" />}
      </WorldMap>
      <TopShade />
      <Caption text="A guerra mais sangrenta da América do Sul" highlight={["sangrenta"]} y={250} size={100} from={6} />
      <YearTag text="GUERRA DO PARAGUAI · 1864–1870" from={105} y={1540} />
    </SceneIn>
  );
};

// ---------- 1864: Brasil intervém no Uruguai ----------
export const MapUruguai: React.FC = () => {
  const f = useCurrentFrame();
  const cam = cameraAt(f, [
    { f: 0, lon: -60, lat: -22, zoom: 5.5 },
    { f: 40, lon: -55.5, lat: -29, zoom: 15 },
  ]);
  const br = lerpPt(f, [45, 85], P.rioGrande, [-55.2, -31.6]);
  return (
    <SceneIn>
      <WorldMap camera={cam} countries={flagsOn()}>
        <MapArrow from={P.rioGrande} to={[-55.6, -32.2]} progress={mv(f, [42, 80], [0, 1])} color={BRASIL_VERDE} />
        <MapBall flag="uruguai" at={[-56.2, -33.0]} size={150} expression={f > 80 ? "surprised" : "neutral"} look={1} />
        <MapBall flag="brasil" at={br} size={190} expression="determined" look={-1} hop={hop(f, [45, 85])} blinkSeed={2} />
        <MapBall flag="paraguai" at={[-57.8, -25.6]} size={150} expression={f > 95 ? "angry" : "neutral"} look={1} blinkSeed={4} />
      </WorldMap>
      <TopShade />
      <YearTag text="1864" />
      <Sequence durationInFrames={95}>
        <Caption text="O Brasil intervém no Uruguai" highlight={["Uruguai"]} y={300} from={4} />
      </Sequence>
      <Sequence from={100}>
        <Caption text="O Paraguai, aliado do governo uruguaio, não gostou" highlight={["Paraguai,"]} y={300} size={86} />
      </Sequence>
      <Bubble text="Isso não fica assim!" x={420} y={760} from={104} duration={70} tail="left" />
    </SceneIn>
  );
};

// ---------- Paraguai invade Mato Grosso e Corrientes ----------
export const MapInvasao: React.FC = () => {
  const f = useCurrentFrame();
  const cam = cameraAt(f, [
    { f: 0, lon: -55.5, lat: -29, zoom: 15 },
    { f: 30, lon: -56, lat: -19, zoom: 12 },
    { f: 110, lon: -56, lat: -19, zoom: 12 },
    { f: 140, lon: -58, lat: -26.5, zoom: 17 },
  ]);
  const py = f < 110 ? lerpPt(f, [40, 80], P.paraguai, [-55.8, -17.5]) : lerpPt(f, [140, 175], [-58.3, -25.2], [-58.1, -28.0]);
  const mt = mv(f, [42, 95], [0, 1]);
  return (
    <SceneIn>
      <WorldMap
        camera={cam}
        countries={flagsOn()}
        regions={[
          { id: "mato-grosso-do-sul", flag: "paraguai", hatch: true, progress: mt, origin: P.paraguai },
          { id: "mato-grosso", flag: "paraguai", hatch: true, progress: mv(f, [55, 105], [0, 1]), origin: P.paraguai },
          { id: "corrientes", flag: "paraguai", hatch: true, progress: mv(f, [150, 200], [0, 1]), origin: [-58.3, -27.3] },
        ]}
      >
        <MapArrow from={P.paraguai} to={P.matoGrosso} progress={mv(f, [30, 75], [0, 1])} />
        <MapArrow from={[-58.3, -25.6]} to={[-58.1, -28.8]} progress={mv(f, [140, 178], [0, 1])} bend={-0.3} />
        {f < 110 && <MapBall flag="brasil" at={[-49.5, -15]} size={170} expression={f > 70 ? "surprised" : "neutral"} look={-1} />}
        {f >= 110 && (
          <MapBall flag="argentina" at={[-60.4, -29.6]} size={170} expression={f > 175 ? "angry" : "surprised"} look={1} blinkSeed={3} />
        )}
        <MapBall flag="paraguai" at={py} size={150} expression="angry" hop={hop(f, [40, 80]) + hop(f, [140, 175])} blinkSeed={4} />
        {f > 95 && f < 115 && <MapLabel at={[-54.5, -13]} text="Mato Grosso" size={56} from={95} />}
        {f > 190 && <MapLabel at={[-57.9, -29.3]} text="Corrientes" size={52} from={190} />}
      </WorldMap>
      <TopShade />
      <YearTag text={f < 110 ? "DEZ 1864" : "ABR 1865"} />
      <Sequence durationInFrames={105}>
        <Caption text="O Paraguai invade o Mato Grosso" highlight={["Mato", "Grosso"]} y={300} from={4} />
      </Sequence>
      <Sequence from={110}>
        <Caption text="E depois a Argentina, em Corrientes" highlight={["Argentina,"]} y={300} />
      </Sequence>
    </SceneIn>
  );
};

// ---------- zoom num ponto de batalha (antes da cena em desenho) ----------
export const makeMapPinScene = (at: LonLat, label: string): React.FC => {
  const Scene: React.FC = () => {
    const f = useCurrentFrame();
    const cam = cameraAt(f, [
      { f: 0, lon: -58, lat: -25.5, zoom: 9 },
      { f: 40, lon: at[0], lat: at[1] + 0.25, zoom: 38 },
    ]);
    return (
      <SceneIn>
        <WorldMap camera={cam} countries={flagsOn()}>
          <MapPin at={at} label={label} from={16} labelSide="down" />
          <MapLabel at={[at[0] + 0.9, at[1] + 0.75]} text="Paraguai" size={46} />
          <MapLabel at={[at[0] - 1.5, at[1] + 0.15]} text="Argentina" size={46} />
        </WorldMap>
      </SceneIn>
    );
  };
  return Scene;
};

// ---------- o fim: Humaitá -> Assunção -> Cerro Corá ----------
export const MapFim: React.FC = () => {
  const f = useCurrentFrame();
  const cam = cameraAt(f, [
    { f: 0, lon: -58, lat: -26.4, zoom: 34 },
    { f: 90, lon: -57.6, lat: -25.6, zoom: 30 },
    { f: 160, lon: -56.8, lat: -24.2, zoom: 26 },
  ]);
  const step = f < 80 ? 0 : f < 160 ? 1 : 2;
  const brasilAt: LonLat =
    f < 85 ? [P.humaita[0] - 0.3, P.humaita[1] + 0.25] : f < 165 ? lerpPt(f, [85, 120], [-58.8, -26.8], [-58.4, -24.8]) : lerpPt(f, [165, 205], [-58.4, -24.8], [-57.3, -23.0]);
  const tags = ["1868", "1869", "1º DE MARÇO DE 1870"];
  const texts = ["Cai a fortaleza de Humaitá", "Os aliados ocupam Assunção", "A guerra termina em Cerro Corá"];
  const hi = [["Humaitá"], ["Assunção"], ["Cerro", "Corá"]];
  return (
    <SceneIn>
      <WorldMap
        camera={cam}
        countries={flagsOn()}
        regions={[{ countryName: "Paraguay", flag: "brasil", hatch: true, progress: mv(f, [20, 250], [0, 0.95]), origin: P.humaita }]}
      >
        <MapPin at={P.humaita} label="Humaitá" from={10} labelSide="down" />
        <MapArrow from={[-58.4, -26.8]} to={[-57.75, -25.45]} progress={mv(f, [80, 115], [0, 1])} color={BRASIL_VERDE} />
        <MapPin at={P.assuncao} label="Assunção" from={110} icon="★" labelSide="down" />
        <MapArrow from={[-57.5, -25.1]} to={[-56.15, -22.85]} progress={mv(f, [160, 200], [0, 1])} color={BRASIL_VERDE} bend={-0.2} />
        <MapPin at={P.cerroCora} label="Cerro Corá" from={195} icon="✝" />
        <MapBall flag="brasil" at={brasilAt} size={150} expression="determined" hop={hop(f, [85, 120]) + hop(f, [165, 205])} look={1} />
        <MapBall
          flag="paraguai"
          at={step === 0 ? [-57.4, -26.0] : step === 1 ? [-56.3, -25.0] : [-55.0, -24.4]}
          size={150}
          expression={step < 2 ? "sad" : "dead"}
          damage={[0.35, 0.7, 1][step]}
          bandage={step >= 1}
          look={-1}
          blinkSeed={4}
        />
      </WorldMap>
      <TopShade />
      {[0, 1, 2].map((i) => (
        <Sequence key={i} from={i * 80} durationInFrames={i === 2 ? 120 : 80}>
          <YearTag text={tags[i]} />
          <Caption text={texts[i]} highlight={hi[i]} y={300} size={94} />
        </Sequence>
      ))}
    </SceneIn>
  );
};

// ---------- consequências ----------
export const MapFinal: React.FC = () => {
  const f = useCurrentFrame();
  const cam = cameraAt(f, [
    { f: 0, lon: -56.8, lat: -24.2, zoom: 26 },
    { f: 35, lon: -57.8, lat: -24.8, zoom: 16 },
  ]);
  return (
    <SceneIn>
      <WorldMap
        camera={cam}
        countries={flagsOn()}
        regions={[
          { id: "formosa", flag: "argentina", hatch: true, progress: mv(f, [35, 60], [0, 1]), origin: [-58.3, -25.5], pulse: f > 60 && f < 110 },
          { id: "misiones", flag: "argentina", hatch: true, progress: mv(f, [45, 70], [0, 1]), origin: [-55.8, -27.3], pulse: f > 70 && f < 110 },
        ]}
      >
        <MapLabel at={[-61.3, -24.3]} text="Argentina ←" size={44} from={60} />
        <MapLabel at={[-53.6, -28.0]} text="→ Argentina" size={40} from={70} />
        <MapPin at={[-57.0, -21.7]} label="→ Brasil" from={75} icon="!" color={BRASIL_VERDE} />
        <MapBall flag="paraguai" at={[-56.4, -24.6]} size={120} expression="sad" damage={0.8} bandage />
      </WorldMap>
      <TopShade />
      <Sequence durationInFrames={110}>
        <Caption text="O Paraguai perdeu territórios para Argentina e Brasil" highlight={["territórios"]} y={260} size={86} from={4} />
      </Sequence>
      <Sequence from={115}>
        <Caption text="E até 60% da sua população*" highlight={["60%"]} y={260} size={100} />
      </Sequence>
      <Sequence from={115} durationInFrames={70}>
        <Footnote text="*estimativas variam muito entre historiadores (de ~25% a mais de 60%). Áreas aproximadas." />
      </Sequence>
      <Sequence from={185}>
        <Caption text="Qual guerra eu faço agora? Comenta!" highlight={["Comenta!"]} y={1380} size={76} />
      </Sequence>
    </SceneIn>
  );
};
