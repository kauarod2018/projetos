import React from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, Series, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CountryBall } from "../components/CountryBall";
import { Caption, YearTag, Bubble, SceneIn, Shake, Footnote } from "../components/ui";
import { Sky, Rays, Hills, Water, Smoke } from "../components/scenery";
import { Explosion, Cannonball } from "../components/fx";
import {
  Snow,
  Embers,
  Flames,
  Vignette,
  Grain,
  ImpactFlash,
  Lightning,
  ZoomPunch,
  Drift,
  MuzzleFlash,
  Counter,
  NameTag,
  CalendarPages,
} from "../components/effects";
import { Cannon, MoscowSkyline, Bridge } from "../components/props";
import { WorldMap, MapBall, MapArrow, MapArmy, MapAt, MapLabel, cameraAt, CountryStyle, LonLat } from "../components/map";

// "O maior erro de Napoleão": a invasão da Rússia (1812).

const ease = Easing.inOut(Easing.cubic);
const mv = (f: number, r: [number, number], v: [number, number]) =>
  interpolate(f, r, v, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
const hop = (f: number, r: [number, number], h = 30, sp = 0.5) => (f >= r[0] && f <= r[1] ? -Math.abs(Math.sin((f - r[0]) * sp)) * h : 0);
const idle = (f: number, seed = 0) => Math.sin(f / 10 + seed) * 0.06;

const L = {
  paris: [2.35, 48.86] as LonLat,
  neman: [23.9, 54.9] as LonLat,
  vilnius: [25.28, 54.69] as LonLat,
  vitebsk: [30.2, 55.19] as LonLat,
  smolensk: [32.05, 54.78] as LonLat,
  borodino: [35.82, 55.52] as LonLat,
  moscou: [37.62, 55.75] as LonLat,
  berezina: [28.35, 54.32] as LonLat,
};
const ROTA: LonLat[] = [L.neman, L.vilnius, L.vitebsk, L.smolensk, L.borodino, L.moscou];
const VOLTA: LonLat[] = [L.moscou, L.borodino, L.smolensk, L.berezina, L.vilnius, L.neman];

// Império Russo de 1812 (aprox. com fronteiras atuais)
const RU_BOX: [number, number, number, number] = [20, 44, 60, 66];
const RUSSIA_1812: Record<string, CountryStyle> = Object.fromEntries(
  ["Russia", "Belarus", "Lithuania", "Latvia", "Estonia", "Ukraine"].map((c) => [c, { flag: "russia" as const, flagBox: RU_BOX }]),
);
const IMPERIO_FRANCES = ["Spain", "Italy", "Germany", "Netherlands", "Belgium", "Luxembourg", "Switzerland", "Austria", "Czechia", "Poland", "Slovenia", "Croatia"];

const TopShade: React.FC = () => (
  <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.25) 25%, rgba(0,0,0,0) 38%)" }} />
);

// ---------- 1. Gancho ----------
const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: f - 8, fps, config: { damping: 8, stiffness: 120 } });
  return (
    <SceneIn>
      <ZoomPunch at={[8, 60]} amount={0.1}>
        <Sky top="#0b0f1f" bottom="#3b1d3a" />
        <Rays color="#ffcf6b" opacity={0.12} />
        <Snow intensity={0.35} wind={2} seed="hk" />
        <CountryBall flag="franca" hat="bicorne" x={540} y={1380} size={440 * pop} expression="determined" squash={idle(f)} />
        <NameTag x={540} y={1420} name="NAPOLEÃO BONAPARTE" from={30} color="#0055A4" />
        <Caption text="O maior erro de Napoleão" highlight={["erro"]} y={250} size={130} from={14} />
        <YearTag text="RÚSSIA · 1812" from={50} y={1560} />
      </ZoomPunch>
      <Lightning at={6} x={300} />
      <Lightning at={60} x={820} seed="lt2" />
      <ImpactFlash at={8} />
    </SceneIn>
  );
};

// ---------- 2. Contexto no mapa da Europa ----------
const Contexto: React.FC = () => {
  const f = useCurrentFrame();
  const cam = cameraAt(f, [
    { f: 0, lon: 5, lat: 30, zoom: 2.2 },
    { f: 35, lon: 17, lat: 50, zoom: 6 },
    { f: 150, lon: 20, lat: 51, zoom: 6.6 },
  ]);
  const countries: Record<string, CountryStyle> = {
    France: { flag: "franca" },
    ...(f > 85 ? RUSSIA_1812 : {}),
  };
  return (
    <SceneIn>
      <WorldMap
        camera={cam}
        countries={countries}
        regions={IMPERIO_FRANCES.map((c, i) => ({
          countryName: c,
          flag: "franca" as const,
          hatch: true,
          progress: mv(f, [35 + i * 3, 70 + i * 3], [0, 1]),
          origin: L.paris,
        }))}
      >
        <MapBall flag="franca" hat="bicorne" at={[3, 46.6]} size={170} expression={f > 120 ? "angry" : "happy"} look={1} />
        {f > 88 && <MapBall flag="russia" hat="crown" at={[38, 56]} size={180} expression="determined" look={-1} blinkSeed={2} />}
        {f > 40 && f < 110 && <MapLabel at={[12, 47.5]} text="Império Francês e aliados" size={44} from={45} />}
        {f > 95 && <MapLabel at={[38, 51.8]} text="Czar Alexandre I" size={40} from={95} color="#ffd23f" />}
      </WorldMap>
      <TopShade />
      <YearTag text="1812" />
      <Sequence durationInFrames={85}>
        <Caption text="Napoleão domina quase toda a Europa" highlight={["Europa"]} y={300} from={4} />
      </Sequence>
      <Sequence from={88}>
        <Caption text="Mas a Rússia rompe o bloqueio contra a Inglaterra" highlight={["Rússia"]} y={300} size={86} />
      </Sequence>
      <Bubble text="Inaceitável!" x={330} y={1060} from={118} duration={30} tail="left" />
    </SceneIn>
  );
};

// ---------- 3. Invasão no mapa ----------
const Invasao: React.FC = () => {
  const f = useCurrentFrame();
  const cam = cameraAt(f, [
    { f: 0, lon: 20, lat: 51, zoom: 6.6 },
    { f: 35, lon: 29.5, lat: 55.2, zoom: 15 },
    { f: 240, lon: 31.5, lat: 55.2, zoom: 15 },
  ]);
  const fr = mv(f, [40, 230], [0, 0.62]);
  const ru = Math.min(0.97, fr + 0.3);
  const burned = [L.vilnius, L.vitebsk, L.smolensk].map((p, i) => ({ p, at: 100 + i * 40 }));
  return (
    <SceneIn>
      <WorldMap camera={cam} countries={{ France: { flag: "franca" }, Poland: { flag: "franca" }, ...RUSSIA_1812 }}>
        <MapArrow from={L.neman} to={L.moscou} progress={mv(f, [40, 230], [0, 0.66])} color="#0055A4" bend={0.06} width={20} />
        {burned.map(({ p, at }, i) =>
          f > at ? (
            <MapAt key={i} at={p}>
              <div style={{ position: "absolute", left: 0, top: 0 }}>
                <Flames x={0} y={20} width={120} height={80} grow={mv(f, [at, at + 15], [0, 1])} seed={`b${i}`} />
              </div>
            </MapAt>
          ) : null,
        )}
        {f > 70 && <MapArmy flag="russia" path={ROTA} progress={ru} count={6} size={50} spacing={60} expression="determined" seed={3} />}
        <MapArmy flag="franca" path={ROTA} progress={fr} count={15} size={52} spacing={62} />
        <MapLabel at={[23.2, 55.6]} text="Rio Neman" size={38} from={20} />
        <MapLabel at={L.moscou} text="Moscou" size={44} />
      </WorldMap>
      <TopShade />
      <YearTag text="24 DE JUNHO DE 1812" />
      <Sequence durationInFrames={118}>
        <Caption text="Cerca de 600 mil soldados cruzam o rio Neman" highlight={["600", "mil"]} y={300} size={90} from={4} />
        <Counter from={0} to={600000} start={40} end={95} y={1480} />
      </Sequence>
      <Sequence from={122}>
        <Caption text="Os russos recuam e queimam tudo pelo caminho" highlight={["queimam"]} y={300} size={90} />
      </Sequence>
      <Embers count={f > 100 ? 25 : 0} seed="inv" />
    </SceneIn>
  );
};

// ---------- 4. Borodino ----------
const Borodino: React.FC = () => {
  const f = useCurrentFrame();
  const frFire = [40, 100, 160];
  const ruFire = [70, 130, 190];
  const hits = [...frFire.map((t) => ({ t: t + 22, x: 800, y: 1330 })), ...ruFire.map((t) => ({ t: t + 22, x: 290, y: 1330 }))];
  return (
    <SceneIn>
      <ZoomPunch at={[...frFire, ...ruFire]} amount={0.05}>
        <Shake from={62} to={80} amount={14}>
          <Shake from={152} to={170} amount={14}>
            <Sky top="#3a2f2a" bottom="#b5835a" />
            <Smoke x={540} y={900} count={14} seed="sky" color="rgba(60,50,45,0.45)" spread={900} />
            <Hills colors={["#7b6a45", "#665737", "#4f432a"]} y={1300} />
            {/* soldados ao fundo */}
            {Array.from({ length: 10 }).map((_, i) => {
              const side = i < 5 ? 1 : -1;
              const k = i % 5;
              const x = side === 1 ? 300 + k * 60 + mv(f, [20, 70], [0, 90]) : 780 - k * 60 - mv(f, [20, 70], [0, 90]);
              return (
                <CountryBall
                  key={i}
                  flag={side === 1 ? "franca" : "russia"}
                  x={x}
                  y={1225 + (k % 2) * 30 + hop(f, [20, 240], 14, 0.4 + k * 0.05)}
                  size={80}
                  expression="angry"
                  look={side}
                  shadow={false}
                  blinkSeed={i}
                />
              );
            })}
            {f > 65 && <Smoke x={540} y={1250} count={12} seed="dust" color="rgba(170,140,100,0.55)" spread={260} />}
            <Cannon x={360} y={1520} dir={1} fireAt={frFire} />
            <Cannon x={720} y={1520} dir={-1} fireAt={ruFire} />
            <CountryBall flag="franca" hat="bicorne" x={180} y={1560} size={250} expression="angry" look={1} squash={idle(f)} />
            <CountryBall flag="russia" hat="kutuzov" eyepatch x={900} y={1560} size={250} expression="determined" look={-1} squash={idle(f, 2)} blinkSeed={3} />
            <NameTag x={180} y={1590} name="NAPOLEÃO" from={15} color="#0055A4" />
            <NameTag x={900} y={1590} name="KUTUZOV" from={22} color="#c62828" />
            {frFire.map((t, i) => (
              <React.Fragment key={`fr${i}`}>
                <MuzzleFlash x={480} y={1440} at={t} dir={1} />
                <Cannonball x1={480} y1={1430} x2={800} y2={1330} from={t} to={t + 22} arc={220} />
              </React.Fragment>
            ))}
            {ruFire.map((t, i) => (
              <React.Fragment key={`ru${i}`}>
                <MuzzleFlash x={600} y={1440} at={t} dir={-1} />
                <Cannonball x1={600} y1={1430} x2={290} y2={1330} from={t} to={t + 22} arc={220} />
              </React.Fragment>
            ))}
            {hits.map((h, i) => (
              <Explosion key={i} x={h.x} y={h.y} at={h.t} size={230} seed={`bx${i}`} />
            ))}
            <YearTag text="7 DE SETEMBRO DE 1812" />
            <Sequence durationInFrames={120}>
              <Caption text="Borodino: o dia mais sangrento das guerras napoleônicas" highlight={["sangrento"]} y={300} size={84} from={4} />
            </Sequence>
            <Sequence from={124}>
              <Caption text="Napoleão vence... mas o exército russo escapa" highlight={["vence..."]} y={300} size={88} />
            </Sequence>
          </Shake>
        </Shake>
      </ZoomPunch>
      {hits.map((h, i) => (
        <ImpactFlash key={i} at={h.t} color={i % 2 ? "#fff" : "#ffe1a8"} />
      ))}
    </SceneIn>
  );
};

// ---------- 5. Moscou em chamas ----------
const Moscou: React.FC = () => {
  const f = useCurrentFrame();
  const burn = mv(f, [140, 200], [0, 1]);
  const nx = mv(f, [10, 40], [-200, 300]);
  const look = f > 85 && f < 140 ? Math.sin((f - 85) / 8) : 1;
  return (
    <SceneIn>
      <Drift duration={240} to={1.06}>
        <Sky top="#7fb3e0" bottom="#e8f1f8" />
        <AbsoluteFill style={{ background: "linear-gradient(180deg, #1a0b0b 0%, #a3260f 60%, #ff7b1c 100%)", opacity: burn }} />
        <Smoke x={540} y={1100} count={burn > 0 ? 18 : 0} seed="msk" color="rgba(30,20,20,0.6)" spread={900} />
        <MoscowSkyline y={1500} burn={burn} />
        {[140, 320, 540, 700, 900].map((x, i) => (
          <Flames key={i} x={x} y={1500 - (i === 2 ? 180 : 60)} width={220} height={240} grow={mv(f, [140 + i * 8, 175 + i * 8], [0, 1])} seed={`m${i}`} />
        ))}
        <AbsoluteFill style={{ background: "#3d5a3a", top: 1500 }} />
        <CountryBall
          flag="franca"
          hat="bicorne"
          x={nx}
          y={1720 + hop(f, [10, 40])}
          size={270}
          expression={f < 85 ? "happy" : f < 145 ? "neutral" : "surprised"}
          look={look}
        />
        <Bubble text="Moscou é minha!" x={420} y={1380} from={44} duration={45} tail="left" />
        <Bubble text="...cadê todo mundo?" x={420} y={1380} from={100} duration={35} tail="left" size={46} />
        {burn > 0 && <Embers count={70} seed="mf" area={[0, 700, 1080, 1100]} />}
        <YearTag text="14 DE SETEMBRO DE 1812" />
        <Sequence durationInFrames={80}>
          <Caption text="Napoleão entra em Moscou" highlight={["Moscou"]} y={300} from={4} />
        </Sequence>
        <Sequence from={84} durationInFrames={58}>
          <Caption text="Mas a cidade estava quase vazia..." highlight={["vazia..."]} y={300} />
        </Sequence>
        <Sequence from={146}>
          <Caption text="...e em chamas: cerca de 3/4 da cidade destruída" highlight={["chamas:"]} y={300} size={88} />
        </Sequence>
      </Drift>
      <ImpactFlash at={140} color="#ffb36b" />
      <Vignette strength={0.35 + burn * 0.3} color={burn > 0.3 ? "60,10,0" : "0,0,0"} />
    </SceneIn>
  );
};

// ---------- 6. A espera ----------
const Espera: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <SceneIn>
      <Sky top="#141b33" bottom="#3a4a7a" />
      <Rays color="#9fb7ff" opacity={0.06} />
      <CalendarPages from={10} />
      <CountryBall flag="franca" hat="bicorne" x={300} y={1600} size={280} expression="neutral" look={1} squash={idle(f)} />
      <CountryBall flag="russia" hat="crown" x={830} y={1380} size={230} expression="determined" look={1} squash={idle(f, 2)} blinkSeed={3} />
      <NameTag x={830} y={1410} name="CZAR ALEXANDRE I" from={12} color="#c62828" />
      <Bubble text="E aí, vai se render?" x={330} y={1250} from={22} duration={40} tail="left" />
      <Bubble text="..." x={830} y={1060} from={70} duration={40} tail="right" size={70} />
      <Caption text="Napoleão espera a rendição do czar... por 5 semanas" highlight={["5", "semanas"]} y={280} size={88} from={4} />
    </SceneIn>
  );
};

// ---------- 7. General Inverno ----------
const Inverno: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const snow = mv(f, [0, 200], [0.3, 2.2]);
  const frozen = mv(f, [120, 260], [0, 0.9]);
  const gen = spring({ frame: f - 100, fps, config: { damping: 9 } });
  return (
    <SceneIn>
      <ZoomPunch at={[100]} amount={0.12}>
        <Sky top={f < 100 ? "#7d8a99" : "#9aa7b5"} bottom="#e6edf3" />
        <Hills colors={["#f4f8fb", "#e3ebf2", "#d3dee8"]} y={1350} />
        {/* soldados em retirada */}
        {Array.from({ length: 7 }).map((_, i) => {
          const fallen = f > 150 + i * 12 && i % 2 === 0;
          return (
            <CountryBall
              key={i}
              flag="franca"
              x={980 - i * 110 - f * 0.8}
              y={1440 + (i % 2) * 40}
              size={110}
              expression={fallen ? "dead" : "sad"}
              rotate={fallen ? mv(f, [150 + i * 12, 165 + i * 12], [0, 85]) : 0}
              frozen={frozen}
              shiver={!fallen}
              shadow={false}
              blinkSeed={i}
            />
          );
        })}
        {f > 95 && (
          <CountryBall flag="inverno" hat="ushanka" x={760} y={1300 - (1 - gen) * 900} size={400} expression="angry" look={-1} squash={idle(f, 1)} />
        )}
        <NameTag x={760} y={1330} name="GENERAL INVERNO" from={115} color="#1d6fa3" />
        <CountryBall
          flag="franca"
          hat="bicorne"
          x={280}
          y={1650}
          size={290}
          expression={f < 100 ? "sad" : "surprised"}
          look={1}
          frozen={frozen}
          shiver={f > 110}
        />
        <Bubble text="Bem-vindo à Rússia!" x={720} y={820} from={125} duration={60} tail="down" />
        <Snow intensity={snow} wind={mv(f, [0, 200], [2, 9])} seed="inv" />
        <YearTag text={f < 95 ? "19 DE OUTUBRO DE 1812" : "NOVEMBRO DE 1812"} />
        <Sequence durationInFrames={92}>
          <Caption text="Napoleão desiste e começa a retirada" highlight={["retirada"]} y={300} from={4} />
        </Sequence>
        <Sequence from={96} durationInFrames={88}>
          <Caption text="E então chega o General Inverno" highlight={["General", "Inverno"]} y={300} size={100} />
        </Sequence>
        <Sequence from={186}>
          <Caption text="Frio abaixo de -20 °C, fome e ataques" highlight={["-20", "°C,"]} y={300} size={92} />
        </Sequence>
      </ZoomPunch>
      <Lightning at={98} x={760} seed="wl" />
      <ImpactFlash at={100} />
      <Vignette strength={0.45} color="10,30,60" />
    </SceneIn>
  );
};

// ---------- 8. Berezina ----------
const Berezina: React.FC = () => {
  const f = useCurrentFrame();
  const broken = mv(f, [128, 150], [0, 1]);
  return (
    <SceneIn>
      <Shake from={128} to={150}>
        <Sky top="#4a5566" bottom="#b8c4d0" />
        <Water y={1430} color="#3f6d8f" dark="#2b4e69" />
        {Array.from({ length: 7 }).map((_, i) => {
          const x = 1100 - i * 120 - f * 3.2;
          const onBroken = f > 128 && x > 520 && x < 760;
          return (
            <CountryBall
              key={i}
              flag="franca"
              hat={i === 3 ? "bicorne" : undefined}
              x={x}
              y={1340 + hop(f, [0, 200], 12, 0.4 + i * 0.03) + (onBroken ? mv(f, [128, 160], [0, 300]) : 0)}
              size={i === 3 ? 150 : 115}
              expression={onBroken ? "surprised" : "sad"}
              look={-1}
              frozen={0.5}
              shadow={false}
              blinkSeed={i}
            />
          );
        })}
        <Bridge y={1420} broken={broken} />
        <Flames x={560} y={1350} width={260} height={150} grow={mv(f, [122, 140], [0, 1])} seed="ponte" />
        {f > 55 &&
          [0, 1, 2].map((i) => (
            <CountryBall
              key={`c${i}`}
              flag="russia"
              hat="papakha"
              x={mv(f, [55, 90], [1250, 880 + i * 70])}
              y={1180 + i * 90 + hop(f, [55, 90], 30, 0.6)}
              size={150}
              expression="angry"
              look={-1}
              blinkSeed={i + 4}
            />
          ))}
        {f > 70 && <MuzzleFlash x={800} y={1150} at={92} dir={-1} />}
        <Explosion x={640} y={1300} at={128} size={300} />
        <Snow intensity={0.9} wind={5} seed="bz" />
        <YearTag text="26–29 DE NOVEMBRO DE 1812" />
        <Sequence durationInFrames={95}>
          <Caption text="A travessia do rio Berezina" highlight={["Berezina"]} y={300} from={4} />
        </Sequence>
        <Sequence from={98}>
          <Caption text="Até hoje, em francês, Bérézina quer dizer desastre" highlight={["desastre"]} y={300} size={86} />
        </Sequence>
      </Shake>
      <ImpactFlash at={128} color="#ffd9a0" />
      <Vignette strength={0.5} color="10,20,40" />
    </SceneIn>
  );
};

// ---------- 9. O que sobrou ----------
const Resultado: React.FC = () => {
  const f = useCurrentFrame();
  const cam = cameraAt(f, [
    { f: 0, lon: 31.5, lat: 55.2, zoom: 15 },
    { f: 200, lon: 29.5, lat: 55.0, zoom: 14 },
  ]);
  const count = Math.round(mv(f, [10, 170], [15, 3]));
  return (
    <SceneIn>
      <WorldMap camera={cam} countries={{ France: { flag: "franca" }, Poland: { flag: "franca" }, ...RUSSIA_1812 }}>
        <MapArrow from={L.moscou} to={L.neman} progress={mv(f, [10, 180], [0, 1])} color="#0055A4" bend={-0.08} width={18} />
        <MapArmy flag="franca" path={VOLTA} progress={mv(f, [10, 180], [0.05, 1])} count={count} size={58} expression="sad" frozen={0.7} />
        <MapLabel at={L.moscou} text="Moscou" size={44} />
        <MapLabel at={[23.2, 55.6]} text="Rio Neman" size={38} />
      </WorldMap>
      <Snow intensity={1.2} wind={4} seed="rs" />
      <TopShade />
      <YearTag text="DEZEMBRO DE 1812" />
      <Caption text="Da Grande Armée, só uma pequena parte voltou" highlight={["pequena", "parte"]} y={300} size={90} from={4} />
      <Counter from={600000} to={100000} start={30} end={170} y={1230} suffix="*" color="#ff8a8a" />
      <Sequence from={60}>
        <Footnote text="*números aproximados: as estimativas variam entre historiadores" />
      </Sequence>
    </SceneIn>
  );
};

// ---------- 10. Final ----------
const Final: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <SceneIn>
      <Sky top="#0b0f1f" bottom="#26324f" />
      <Rays color="#9fb7ff" opacity={0.08} />
      <Snow intensity={0.5} wind={2} seed="fn" />
      <CountryBall flag="franca" hat="bicorne" x={540} y={1300} size={400} expression="sad" damage={0.7} bandage frozen={0.35} squash={idle(f)} />
      <Caption text="O começo do fim de Napoleão" highlight={["fim"]} y={280} size={110} from={4} />
      <Sequence from={60}>
        <Caption text="Parte 2: Waterloo? Comenta!" highlight={["Waterloo?"]} y={1380} size={84} />
      </Sequence>
      <Vignette strength={0.6} />
    </SceneIn>
  );
};

export const NAPOLEAO_SCENES: { component: React.FC; frames: number }[] = [
  { component: Hook, frames: 110 },
  { component: Contexto, frames: 150 },
  { component: Invasao, frames: 240 },
  { component: Borodino, frames: 240 },
  { component: Moscou, frames: 240 },
  { component: Espera, frames: 120 },
  { component: Inverno, frames: 270 },
  { component: Berezina, frames: 190 },
  { component: Resultado, frames: 210 },
  { component: Final, frames: 140 },
];
export const NAPOLEAO_FRAMES = NAPOLEAO_SCENES.reduce((a, s) => a + s.frames, 0);

export const Napoleao: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Series>
      {NAPOLEAO_SCENES.map(({ component: C, frames }, i) => (
        <Series.Sequence key={i} durationInFrames={frames}>
          <C />
        </Series.Sequence>
      ))}
    </Series>
    <Grain opacity={0.08} />
    <Vignette strength={0.3} />
  </AbsoluteFill>
);
