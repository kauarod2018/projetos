import React from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, Series, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CountryBall } from "../components/CountryBall";
import { Caption, YearTag, Bubble, SceneIn, Shake, Footnote } from "../components/ui";
import { Sky, Rays, Hills, Water, Smoke, Parchment, Ship } from "../components/scenery";
import { Explosion, Cannonball, SpeedLines } from "../components/fx";
import { MapIntro, MapUruguai, MapInvasao, MapFim, MapFinal, makeMapPinScene, P } from "./paraguaiMapas";

// ---------- helpers de movimento ----------
const ease = Easing.inOut(Easing.cubic);
const mv = (f: number, range: [number, number], values: [number, number]) =>
  interpolate(f, range, values, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
// pulinhos enquanto anda dentro do intervalo
const hop = (f: number, range: [number, number], h = 40, speed = 0.45) =>
  f >= range[0] && f <= range[1] ? -Math.abs(Math.sin((f - range[0]) * speed)) * h : 0;
// respiração parada
const idle = (f: number, seed = 0) => Math.sin(f / 10 + seed) * 0.06;

// ---------- CENA 1: gancho ----------
const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const drop = spring({ frame: f - 4, fps, config: { damping: 9 } });
  const side = (d: number) => spring({ frame: f - d, fps, config: { damping: 12 } });
  return (
    <SceneIn>
      <Sky top="#3a0d0d" bottom="#8e1b1b" />
      <Rays color="#ffb36b" opacity={0.14} />
      <CountryBall flag="brasil" x={-120 + side(30) * 300} y={1330} size={260} expression="surprised" look={1} blinkSeed={1} />
      <CountryBall flag="argentina" x={1200 - side(36) * 300} y={1330} size={260} expression="surprised" look={-1} blinkSeed={2} />
      <CountryBall flag="uruguai" x={1250 - side(42) * 240} y={1560} size={200} expression="surprised" look={-1} blinkSeed={3} />
      <CountryBall
        flag="paraguai"
        x={540}
        y={-300 + drop * 1640}
        size={420}
        expression="determined"
        squash={f > 14 && f < 24 ? 0.4 * Math.sin(((f - 14) / 10) * Math.PI) : idle(f)}
      />
      <Caption text="A guerra mais sangrenta da América do Sul" highlight={["sangrenta"]} y={280} size={104} from={6} />
      <YearTag text="GUERRA DO PARAGUAI · 1864–1870" from={58} y={1420} />
    </SceneIn>
  );
};

// ---------- CENA 2: Brasil intervém no Uruguai ----------
const Uruguai: React.FC = () => {
  const f = useCurrentFrame();
  const brX = mv(f, [8, 40], [-220, 380]);
  const pyX = mv(f, [70, 100], [1300, 900]);
  return (
    <SceneIn>
      <Sky top="#7cc7ff" bottom="#d8f0ff" />
      <Hills />
      <YearTag text="1864" from={0} />
      <Sequence durationInFrames={95}>
        <Caption text="O Brasil intervém no Uruguai" highlight={["Uruguai"]} y={330} from={4} />
      </Sequence>
      <Sequence from={100}>
        <Caption text="O Paraguai, aliado do governo uruguaio, não gostou" highlight={["Paraguai,"]} y={330} size={88} />
      </Sequence>
      <CountryBall flag="uruguai" x={640} y={1380} size={290} expression={f > 40 ? "surprised" : "neutral"} look={-1} squash={idle(f, 1)} />
      <CountryBall
        flag="brasil"
        x={brX + (f > 40 && f < 50 ? 25 : 0)}
        y={1380 + hop(f, [8, 40])}
        size={320}
        expression="determined"
        look={1}
        squash={idle(f)}
        blinkSeed={2}
      />
      <CountryBall flag="paraguai" x={pyX} y={1720 + hop(f, [70, 100], 50)} size={240} expression="angry" look={-1} blinkSeed={4} />
      <Bubble text="Isso não fica assim!" x={760} y={1420} from={104} duration={70} tail="right" />
    </SceneIn>
  );
};

// ---------- CENA 3: Paraguai invade Mato Grosso e Corrientes ----------
const Invasao: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pyX = f < 105 ? mv(f, [15, 45], [1250, 560]) : mv(f, [130, 150], [560, 700]);
  const brPush = mv(f, [45, 60], [0, -160]);
  const arDrop = spring({ frame: f - 100, fps, config: { damping: 10 } });
  return (
    <SceneIn>
      <Sky top="#ffcf8a" bottom="#fff1d6" />
      <Hills colors={["#c9b46a", "#ad9a52", "#8c7b3c"]} />
      <Shake from={45} to={62}>
        <Shake from={150} to={166}>
          <YearTag text={f < 105 ? "DEZ 1864" : "ABR 1865"} from={0} />
          <Sequence durationInFrames={100}>
            <Caption text="O Paraguai invade o Mato Grosso" highlight={["Mato", "Grosso"]} y={330} from={4} />
          </Sequence>
          <Sequence from={105}>
            <Caption text="E depois a Argentina, em Corrientes" highlight={["Argentina,"]} y={330} />
          </Sequence>
          <CountryBall
            flag="brasil"
            x={330 + brPush}
            y={1400}
            size={300}
            expression={f < 45 ? "neutral" : "surprised"}
            look={f < 30 ? -0.5 : 1}
            rotate={mv(f, [45, 60], [0, -14])}
            squash={f > 45 && f < 55 ? 0.35 : idle(f)}
            damage={f > 45 ? 0.3 : 0}
          />
          {f > 100 && (
            <CountryBall
              flag="argentina"
              x={880}
              y={-200 + arDrop * 1600}
              size={280}
              expression={f > 150 ? "angry" : "surprised"}
              look={-1}
              squash={f > 150 && f < 160 ? 0.35 : 0}
              damage={f > 150 ? 0.3 : 0}
              blinkSeed={3}
            />
          )}
          {f > 14 && f < 46 && <SpeedLines x={pyX + 140} y={1450} dir={-1} />}
          <CountryBall
            flag="paraguai"
            x={pyX}
            y={1400 + hop(f, [15, 45], 30, 0.6) + hop(f, [130, 150], 30, 0.6)}
            size={320}
            expression="angry"
            look={f < 105 ? -1 : 1}
            blinkSeed={4}
          />
          <Explosion x={460} y={1230} at={45} />
          <Explosion x={800} y={1230} at={150} seed="e2" />
        </Shake>
      </Shake>
    </SceneIn>
  );
};

// ---------- CENA 4: Tríplice Aliança ----------
const Alianca: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const up = (d: number) => spring({ frame: f - d, fps, config: { damping: 10 } });
  return (
    <SceneIn>
      <Sky top="#0b3a7a" bottom="#2d7dd2" />
      <Rays color="#fff" opacity={0.1} />
      <YearTag text="1º DE MAIO DE 1865" from={0} />
      <Caption text="Tríplice Aliança" highlight={["Tríplice", "Aliança"]} y={300} size={140} from={4} />
      <Caption text="Brasil + Argentina + Uruguai" y={520} size={66} from={26} stagger={4} />
      <CountryBall flag="argentina" x={250} y={1900 - up(10) * 480} size={280} expression="determined" look={0.5} squash={idle(f, 1)} blinkSeed={1} />
      <CountryBall flag="uruguai" x={830} y={1900 - up(16) * 480} size={280} expression="determined" look={-0.5} squash={idle(f, 2)} blinkSeed={2} />
      <CountryBall flag="brasil" x={540} y={1900 - up(4) * 420} size={360} expression="determined" squash={idle(f, 3)} />
      <Bubble text="Juntos!" x={540} y={1060} from={60} duration={50} />
      <CountryBall flag="paraguai" x={1180 - up(112) * 180} y={1700} size={190} expression="surprised" look={-1} blinkSeed={5} />
      <Bubble text="...opa" x={940} y={1480} from={124} duration={50} tail="right" size={46} />
    </SceneIn>
  );
};

// ---------- CENA 5: Batalha do Riachuelo ----------
const Riachuelo: React.FC = () => {
  const f = useCurrentFrame();
  const sink = mv(f, [155, 225], [0, 1]);
  return (
    <SceneIn>
      <Sky top="#6aa9d8" bottom="#d6ecf7" />
      <Shake from={110} to={126}>
        <Shake from={150} to={168}>
          <YearTag text="11 DE JUNHO DE 1865" from={0} />
          <Sequence durationInFrames={115}>
            <Caption text="Batalha naval do Riachuelo" highlight={["Riachuelo"]} y={320} from={4} />
          </Sequence>
          <Sequence from={120}>
            <Caption text="Vitória do Brasil no rio Paraná" highlight={["Vitória"]} y={320} />
          </Sequence>
          <Ship x={280} y={1380}>
            <CountryBall flag="brasil" x={220} y={345} size={200} expression={f > 160 ? "happy" : "determined"} look={1} />
          </Ship>
          <Ship x={810} y={1380} flip sink={sink} hull="#5b5b5b">
            <CountryBall
              flag="paraguai"
              x={220}
              y={345}
              size={200}
              expression={f > 185 ? "sad" : f > 110 ? "surprised" : "angry"}
              look={-1}
              damage={f > 110 ? 0.5 : 0}
              blinkSeed={3}
            />
          </Ship>
          <Water y={1395} />
          <Cannonball x1={760} y1={1250} x2={470} y2={1360} from={36} to={66} />
          <Cannonball x1={330} y1={1250} x2={780} y2={1200} from={84} to={110} />
          <Cannonball x1={330} y1={1250} x2={830} y2={1240} from={126} to={150} />
          {f > 66 && f < 90 && <Smoke x={470} y={1360} count={6} seed="splash" color="rgba(255,255,255,0.8)" spread={60} />}
          <Explosion x={790} y={1180} at={110} />
          <Explosion x={830} y={1230} at={150} seed="e3" size={320} />
          {f > 115 && <Smoke x={820} y={1150 + sink * 300} count={12} seed="ship" />}
        </Shake>
      </Shake>
    </SceneIn>
  );
};

// ---------- CENA 6: Tuyutí ----------
const ALLIES = ["brasil", "argentina", "brasil", "uruguai", "brasil", "argentina", "brasil", "brasil", "uruguai"] as const;
const Tuyuti: React.FC = () => {
  const f = useCurrentFrame();
  const charge = mv(f, [28, 70], [0, 1]);
  return (
    <SceneIn>
      <Sky top="#ff9e57" bottom="#ffe0b0" />
      <Hills colors={["#a7b25c", "#8a9a45", "#6c7d33"]} y={1200} />
      <Shake from={70} to={130} amount={14}>
        <YearTag text="24 DE MAIO DE 1866" from={0} />
        <Sequence durationInFrames={108}>
          <Caption text="Tuyutí: a maior batalha da história da América do Sul" highlight={["maior"]} y={300} size={86} from={4} />
        </Sequence>
        <Sequence from={112}>
          <Caption text="Vitória aliada... mas a guerra continua" highlight={["aliada..."]} y={300} size={90} />
        </Sequence>
        {ALLIES.map((flag, i) => {
          const row = Math.floor(i / 3);
          const col = i % 3;
          const baseX = 100 + col * 135 + row * 45;
          const x = baseX + charge * 190;
          return (
            <CountryBall
              key={`a${i}`}
              flag={flag}
              x={x}
              y={1180 + row * 175 + hop(f, [28, 70], 26, 0.6 + i * 0.03)}
              size={175}
              expression={f > 125 ? "happy" : "angry"}
              look={1}
              blinkSeed={i}
            />
          );
        })}
        {Array.from({ length: 9 }).map((_, i) => {
          const row = Math.floor(i / 3);
          const col = i % 3;
          const baseX = 980 - col * 135 - row * 45;
          const x = baseX - charge * 190;
          const fallen = f > 95 && i % 3 !== 0;
          return (
            <CountryBall
              key={`p${i}`}
              flag="paraguai"
              x={x + (fallen ? mv(f, [95, 120], [0, 160]) : 0)}
              y={1180 + row * 175 + hop(f, [28, 70], 26, 0.62 + i * 0.03)}
              size={175}
              expression={fallen ? "dead" : "angry"}
              rotate={fallen ? mv(f, [95, 120], [0, 80]) : 0}
              opacity={fallen ? mv(f, [110, 140], [1, 0]) : 1}
              look={-1}
              blinkSeed={i + 3}
            />
          );
        })}
        {f > 66 && <Smoke x={540} y={1480} count={16} seed="dust" color="rgba(170,140,90,0.6)" spread={300} />}
        <Explosion x={480} y={1300} at={72} size={240} />
        <Explosion x={640} y={1450} at={82} size={220} seed="t2" />
        <Explosion x={540} y={1250} at={94} size={260} seed="t3" />
        <Explosion x={700} y={1330} at={106} size={200} seed="t4" />
      </Shake>
    </SceneIn>
  );
};

// ---------- CENA 7: Curupayty ----------
const Curupayty: React.FC = () => {
  const f = useCurrentFrame();
  // avançam, batem na trincheira e voltam
  const ax = f < 55 ? mv(f, [18, 55], [0, 330]) : mv(f, [55, 80], [330, 40]);
  const hit = f >= 55;
  return (
    <SceneIn>
      <Sky top="#5d6d7e" bottom="#c8d1da" />
      <Hills colors={["#7d9a63", "#64824c", "#4c6a38"]} />
      <Shake from={55} to={72}>
        <YearTag text="22 DE SETEMBRO DE 1866" from={0} />
        <Sequence durationInFrames={95}>
          <Caption text="Mas em Curupayty..." highlight={["Curupayty..."]} y={320} size={110} from={4} />
        </Sequence>
        <Sequence from={98}>
          <Caption text="O Paraguai vence e a guerra se arrasta por anos" highlight={["vence"]} y={320} size={88} />
        </Sequence>
        <CountryBall flag="paraguai" x={850} y={1330} size={280} expression={f > 62 ? "happy" : "determined"} look={-1} squash={idle(f)} />
        {/* trincheira */}
        <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <rect x={640} y={1210} width={70} height={240} fill="#7a5a32" stroke="#111" strokeWidth={6} />
          {[0, 1, 2, 3].map((i) => (
            <ellipse key={i} cx={675} cy={1235 + i * 58} rx={60} ry={28} fill="#c9a66b" stroke="#111" strokeWidth={5} />
          ))}
        </svg>
        <CountryBall
          flag="argentina"
          x={140 + ax}
          y={1500 + hop(f, [18, 55], 30, 0.55)}
          size={230}
          expression={hit ? "sad" : "angry"}
          look={1}
          rotate={hit ? mv(f, [55, 80], [0, -25]) : 0}
          damage={hit ? 0.6 : 0}
          blinkSeed={2}
        />
        <CountryBall
          flag="brasil"
          x={300 + ax}
          y={1400 + hop(f, [18, 55], 30, 0.5)}
          size={260}
          expression={hit ? "sad" : "angry"}
          look={1}
          rotate={hit ? mv(f, [55, 80], [0, -20]) : 0}
          damage={hit ? 0.6 : 0}
          bandage={f > 85}
        />
        <Explosion x={600} y={1260} at={55} />
        <Explosion x={560} y={1420} at={62} seed="c2" size={220} />
        <Bubble text="Não passarão!" x={860} y={980} from={66} duration={80} />
      </Shake>
    </SceneIn>
  );
};

// ---------- CENA 8: o fim ----------
const Fim: React.FC = () => {
  const f = useCurrentFrame();
  const step = f < 70 ? 0 : f < 140 ? 1 : 2;
  const tags = ["1868", "1869", "1º DE MARÇO DE 1870"];
  const texts = ["Cai a fortaleza de Humaitá", "Os aliados ocupam Assunção", "A guerra termina em Cerro Corá"];
  const hi = [["Humaitá"], ["Assunção"], ["Cerro", "Corá"]];
  const allyX = mv(f, [0, 200], [-80, 160]);
  return (
    <SceneIn>
      <Sky top="#2c2f3a" bottom="#6b6f7d" />
      <Hills colors={["#5b6b4a", "#4a5a3c", "#3a4a2f"]} />
      {[0, 1, 2].map((i) => (
        <Sequence key={i} from={i * 70} durationInFrames={i === 2 ? 100 : 70}>
          <YearTag text={tags[i]} />
          <Caption text={texts[i]} highlight={hi[i]} y={320} size={96} />
        </Sequence>
      ))}
      <CountryBall flag="uruguai" x={allyX} y={1580} size={200} expression="determined" look={1} blinkSeed={1} />
      <CountryBall flag="argentina" x={allyX + 60} y={1350} size={230} expression="determined" look={1} blinkSeed={2} />
      <CountryBall flag="brasil" x={allyX + 230} y={1480} size={270} expression="determined" look={1} />
      <CountryBall
        flag="paraguai"
        x={mv(f, [0, 200], [760, 840])}
        y={1450}
        size={mv(f, [0, 200], [340, 290])}
        expression={step < 2 ? "sad" : "dead"}
        look={-1}
        damage={[0.35, 0.7, 1][step]}
        bandage={step >= 1}
        rotate={step === 2 ? mv(f, [140, 170], [0, 12]) : 0}
        blinkSeed={4}
      />
      {step >= 1 && <Smoke x={840} y={1200} count={8} seed="fim" />}
    </SceneIn>
  );
};

// ---------- CENA 9: consequência + chamada ----------
const Final: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <SceneIn>
      <Parchment />
      <Caption text="O Paraguai perdeu até 60% da sua população*" highlight={["60%"]} y={280} size={98} from={4} />
      <CountryBall flag="paraguai" x={540} y={1150} size={340} expression="sad" damage={0.8} bandage squash={idle(f)} />
      <Footnote text="*as estimativas variam muito entre historiadores: de cerca de 25% a mais de 60%" from={20} />
      <Sequence from={70}>
        <Caption text="Qual guerra eu faço agora? Comenta!" highlight={["Comenta!"]} y={1230} size={78} />
      </Sequence>
    </SceneIn>
  );
};

// Duração de cada cena em frames (30 fps).
// Duração de cada cena em frames (30 fps). Mapas + cenas em desenho.
// (Hook, Uruguai, Invasao, Fim e Final antigas continuam no arquivo como alternativa sem mapa.)
export const SCENES: { component: React.FC; frames: number }[] = [
  { component: MapIntro, frames: 150 },
  { component: MapUruguai, frames: 180 },
  { component: MapInvasao, frames: 240 },
  { component: Alianca, frames: 180 },
  { component: makeMapPinScene(P.riachuelo, "Riachuelo"), frames: 60 },
  { component: Riachuelo, frames: 240 },
  { component: makeMapPinScene(P.tuyuti, "Tuyutí"), frames: 60 },
  { component: Tuyuti, frames: 180 },
  { component: makeMapPinScene(P.curupayty, "Curupayty"), frames: 60 },
  { component: Curupayty, frames: 180 },
  { component: MapFim, frames: 280 },
  { component: MapFinal, frames: 260 },
];

export const SEM_MAPA = { Hook, Uruguai, Invasao, Fim, Final };

export const TOTAL_FRAMES = SCENES.reduce((a, s) => a + s.frames, 0);

export const GuerraDoParaguai: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Series>
      {SCENES.map(({ component: C, frames }, i) => (
        <Series.Sequence key={i} durationInFrames={frames}>
          <C />
        </Series.Sequence>
      ))}
    </Series>
  </AbsoluteFill>
);
