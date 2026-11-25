import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, Series, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CountryBall } from "../components/CountryBall";
import { Caption, YearTag, Bubble, SceneIn, Shake, Footnote, FONT } from "../components/ui";
import { Sky, Rays, Hills, Water, Smoke } from "../components/scenery";
import { Explosion, Cannonball, SpeedLines } from "../components/fx";
import {
  Rain,
  Confetti,
  Volley,
  Embers,
  Vignette,
  Grain,
  ImpactFlash,
  Lightning,
  ZoomPunch,
  Drift,
  MuzzleFlash,
  Counter,
  NameTag,
} from "../components/effects";
import { Cannon } from "../components/props";
import { WorldMap, MapBall, MapArrow, MapArmy, MapAt, MapLabel, MapPin, cameraAt, CountryStyle, LonLat } from "../components/map";
import timeline from "./waterlooTimeline.json";

// "Parte 2: Waterloo" – os Cem Dias de Napoleão (1815).

const ease = Easing.inOut(Easing.cubic);
const mv = (f: number, r: [number, number], v: [number, number]) =>
  interpolate(f, r, v, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
const hop = (f: number, r: [number, number], h = 30, sp = 0.5) => (f >= r[0] && f <= r[1] ? -Math.abs(Math.sin((f - r[0]) * sp)) * h : 0);
const idle = (f: number, seed = 0) => Math.sin(f / 10 + seed) * 0.06;

// ponto ao longo de um caminho em lon/lat (t de 0 a 1)
const geoAlong = (path: LonLat[], t: number): LonLat => {
  const seg = path.slice(1).map((p, i) => Math.hypot(p[0] - path[i][0], p[1] - path[i][1]));
  const total = seg.reduce((a, b) => a + b, 0);
  let d = Math.max(0, Math.min(1, t)) * total;
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i] || i === seg.length - 1) {
      const k = seg[i] === 0 ? 0 : Math.min(1, d / seg[i]);
      return [path[i][0] + (path[i + 1][0] - path[i][0]) * k, path[i][1] + (path[i + 1][1] - path[i][1]) * k];
    }
    d -= seg[i];
  }
  return path[path.length - 1];
};

const L = {
  elba: [10.3, 42.78] as LonLat,
  golfeJuan: [7.07, 43.57] as LonLat,
  grenoble: [5.72, 45.19] as LonLat,
  lyon: [4.84, 45.76] as LonLat,
  paris: [2.35, 48.86] as LonLat,
  gante: [3.72, 51.05] as LonLat,
  charleroi: [4.44, 50.41] as LonLat,
  ligny: [4.57, 50.51] as LonLat,
  quatreBras: [4.46, 50.57] as LonLat,
  waterloo: [4.41, 50.68] as LonLat,
  wavre: [4.61, 50.72] as LonLat,
  bruxelas: [4.35, 50.85] as LonLat,
  rochefort: [-0.96, 45.94] as LonLat,
  helena: [-5.72, -15.97] as LonLat,
};

// França europeia (sem territórios ultramarinos) para a bandeira não esticar
const FR_BOX: [number, number, number, number] = [-5, 42.3, 8.3, 51.1];
const FRANCA: CountryStyle = { flag: "franca", flagBox: FR_BOX };
const BOURBON: CountryStyle = { flag: "bourbon", flagBox: FR_BOX };

const TopShade: React.FC = () => (
  <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.25) 25%, rgba(0,0,0,0) 38%)" }} />
);

// barquinho para o countryball navegar no mapa
const Boat: React.FC<{ w?: number }> = ({ w = 120 }) => (
  <svg width={w} height={w * 0.5} viewBox="0 0 120 60" style={{ position: "absolute", left: -w / 2, top: 2, overflow: "visible" }}>
    <path d="M 4 14 L 116 14 L 98 50 L 22 50 Z" fill="#7a4a22" stroke="#111" strokeWidth={5} strokeLinejoin="round" />
  </svg>
);

const Mountains: React.FC<{ y: number }> = ({ y }) => (
  <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
    {[
      [-80, 520, 380],
      [260, 620, 470],
      [640, 560, 420],
      [900, 480, 360],
    ].map(([x, w, h], i) => (
      <g key={i}>
        <polygon points={`${x},${y} ${x + w / 2},${y - h} ${x + w},${y}`} fill={i % 2 ? "#6b7b8f" : "#7d8ca0"} stroke="#111" strokeWidth={5} />
        <polygon
          points={`${x + w / 2 - w * 0.13},${y - h * 0.74} ${x + w / 2},${y - h} ${x + w / 2 + w * 0.13},${y - h * 0.74} ${x + w / 2 + w * 0.05},${y - h * 0.68} ${x + w / 2 - w * 0.04},${y - h * 0.76}`}
          fill="#f4f8fb"
        />
      </g>
    ))}
  </svg>
);

// ---------- 1. Gancho ----------
const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: f - 8, fps, config: { damping: 8, stiffness: 120 } });
  const side = (d: number) => spring({ frame: f - d, fps, config: { damping: 12 } });
  return (
    <SceneIn>
      <ZoomPunch at={[8, 60]} amount={0.1}>
        <Sky top="#0b0f1f" bottom="#1d2f5a" />
        <Rays color="#ffcf6b" opacity={0.13} />
        <CountryBall flag="reinoUnido" hat="wellington" x={-140 + side(40) * 330} y={1700} size={240} expression="angry" look={1} blinkSeed={1} />
        <CountryBall flag="prussia" hat="blucher" mustache="#eee" x={1220 - side(46) * 330} y={1700} size={240} expression="angry" look={-1} blinkSeed={2} />
        <CountryBall flag="franca" hat="bicorne" x={540} y={1300} size={420 * pop} expression="determined" squash={idle(f)} />
        <Caption text="Ele fugiu do exílio... e quase reconquistou a Europa" highlight={["fugiu"]} y={250} size={96} from={12} />
        <YearTag text="PARTE 2 · WATERLOO 1815" from={50} y={1340} />
      </ZoomPunch>
      <Lightning at={6} x={250} />
      <Lightning at={60} x={830} seed="lt2" />
      <ImpactFlash at={8} />
    </SceneIn>
  );
};

// ---------- 2. Fuga de Elba ----------
const Elba: React.FC = () => {
  const f = useCurrentFrame();
  const cam = cameraAt(f, [
    { f: 0, lon: 9.4, lat: 43.6, zoom: 22 },
    { f: 90, lon: 9.0, lat: 43.4, zoom: 26 },
    { f: 180, lon: 8.2, lat: 43.6, zoom: 26 },
  ]);
  const at = f < 96 ? L.elba : geoAlong([L.elba, [8.6, 43.1], L.golfeJuan], mv(f, [96, 170], [0, 1]));
  return (
    <SceneIn>
      <WorldMap camera={cam} countries={{ France: BOURBON, Italy: { fill: "#e8dcc0" } }}>
        <MapPin at={L.elba} label="Ilha de Elba" from={12} labelSide="down" icon="⚑" />
        <MapArrow from={[10.1, 42.95]} to={[7.25, 43.5]} progress={mv(f, [96, 160], [0, 1])} color="#0055A4" bend={-0.2} />
        <MapAt at={at}>{f >= 96 && <Boat w={150} />}</MapAt>
        <MapBall flag="franca" hat="bicorne" at={at} size={140} expression={f < 92 ? "sad" : "determined"} look={f < 92 ? 0 : -1} />
        <MapLabel at={[5.6, 44.6]} text="França (do rei Luís XVIII)" size={40} from={20} />
      </WorldMap>
      <TopShade />
      <YearTag text={f < 92 ? "1814" : "26 DE FEVEREIRO DE 1815"} />
      <Sequence durationInFrames={90}>
        <Caption text="Derrotado em 1814, Napoleão é exilado na ilha de Elba" highlight={["Elba"]} y={300} size={86} from={4} />
      </Sequence>
      <Sequence from={94}>
        <Caption text="Mas ele foge com cerca de mil soldados" highlight={["foge"]} y={300} size={92} />
      </Sequence>
    </SceneIn>
  );
};

// ---------- 3. Laffrey: "aqui estou!" ----------
const Laffrey: React.FC = () => {
  const f = useCurrentFrame();
  const turned = f >= 190;
  const nx = mv(f, [8, 50], [-200, 330]);
  return (
    <SceneIn>
      <Sky top="#86b7e8" bottom="#e9f2fb" />
      <Mountains y={1300} />
      <Hills colors={["#8fbf6a", "#76a955", "#5b8c40"]} y={1380} />
      {turned && <Rays color="#fff6c2" opacity={0.18} />}
      {Array.from({ length: 6 }).map((_, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        return (
          <CountryBall
            key={i}
            flag={turned ? "franca" : "bourbon"}
            hat="shako"
            x={690 + col * 130 + row * 50}
            y={1470 + row * 150 + (turned ? hop(f, [190, 240], 30, 0.45 + i * 0.05) : 0)}
            size={150}
            expression={turned ? "happy" : f > 120 ? "surprised" : "determined"}
            look={-1}
            blinkSeed={i}
          />
        );
      })}
      <CountryBall flag="franca" hat="bicorne" x={nx} y={1650 + hop(f, [8, 50])} size={260} expression={turned ? "happy" : "determined"} look={1} />
      <Bubble text="Soldados!" x={380} y={1300} from={60} duration={45} tail="left" />
      <Bubble text="Quem quiser matar seu imperador..." x={480} y={1300} from={112} duration={36} tail="left" size={44} />
      <Bubble text="...aqui estou!" x={400} y={1300} from={150} duration={34} tail="left" size={60} />
      <Bubble text="Viva o Imperador!" x={800} y={1290} from={196} duration={42} tail="down" />
      <Confetti from={190} x={800} y={1300} />
      <YearTag text="7 DE MARÇO DE 1815" />
      <Sequence durationInFrames={110}>
        <Caption text="O rei manda tropas para prendê-lo" highlight={["prendê-lo"]} y={300} from={4} />
      </Sequence>
      <Sequence from={112} durationInFrames={76}>
        <Caption text="Napoleão vai até eles, sozinho" highlight={["sozinho"]} y={300} />
      </Sequence>
      <Sequence from={190}>
        <Caption text="E os soldados mudam de lado" highlight={["mudam", "de", "lado"]} y={300} />
      </Sequence>
      <ImpactFlash at={188} color="#fff6c2" />
    </SceneIn>
  );
};

// ---------- 4. Marcha até Paris ----------
const Paris: React.FC = () => {
  const f = useCurrentFrame();
  const cam = cameraAt(f, [
    { f: 0, lon: 6.5, lat: 45.2, zoom: 22 },
    { f: 60, lon: 4.2, lat: 47.6, zoom: 17 },
  ]);
  const ROTA: LonLat[] = [L.golfeJuan, L.grenoble, L.lyon, L.paris];
  const p = mv(f, [10, 100], [0, 1]);
  const kingAt = f < 108 ? [2.6, 48.6] as LonLat : geoAlong([[2.6, 48.6], L.gante], mv(f, [108, 150], [0, 1]));
  return (
    <SceneIn>
      <WorldMap
        camera={cam}
        countries={{ France: BOURBON, Belgium: { fill: "#e8dcc0" } }}
        regions={[{ countryName: "France", flag: "franca", flagBox: FR_BOX, hatch: true, progress: mv(f, [10, 110], [0, 1]), origin: L.golfeJuan }]}
      >
        <MapArrow from={L.golfeJuan} to={[2.6, 48.7]} progress={p} color="#0055A4" bend={-0.12} />
        <MapArmy flag="franca" path={ROTA} progress={Math.max(0, p - 0.06)} count={Math.round(mv(f, [10, 100], [2, 12]))} size={46} spacing={44} />
        <MapBall flag="franca" hat="bicorne" at={geoAlong(ROTA, p)} size={130} expression="happy" />
        <MapArrow from={[2.8, 49.0]} to={[3.7, 50.9]} progress={mv(f, [108, 150], [0, 1])} color="#F7F4EA" width={16} />
        {f > 60 && <MapBall flag="bourbon" hat="crown" at={kingAt} size={120} expression={f > 90 ? "surprised" : "neutral"} look={1} blinkSeed={2} />}
        {f > 70 && <MapLabel at={[1.0, 48.3]} text="Rei Luís XVIII" size={38} from={70} color="#ffd23f" />}
        <MapLabel at={L.paris} text="Paris" size={44} from={30} />
      </WorldMap>
      <TopShade />
      <YearTag text={f < 100 ? "MARÇO DE 1815" : "20 DE MARÇO DE 1815"} />
      <Sequence durationInFrames={98}>
        <Caption text="Ele marcha até Paris, e o exército cresce pelo caminho" highlight={["Paris,"]} y={300} size={86} from={4} />
      </Sequence>
      <Sequence from={102}>
        <Caption text="O rei foge. Começam os Cem Dias" highlight={["Cem", "Dias"]} y={300} size={96} />
      </Sequence>
    </SceneIn>
  );
};

// ---------- 5. Sétima Coalizão ----------
const Coalizao: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = (d: number) => spring({ frame: f - d, fps, config: { damping: 10 } });
  return (
    <SceneIn>
      <ZoomPunch at={[20]} amount={0.08}>
        <Sky top="#2a0a0a" bottom="#7a1a1a" />
        <Rays color="#ff9b6b" opacity={0.12} />
        <CountryBall flag="franca" hat="bicorne" x={540} y={1420} size={300} expression={f > 95 ? "sad" : "determined"} squash={idle(f)} />
        <CountryBall flag="reinoUnido" hat="wellington" x={230} y={1130} size={250 * pop(22)} expression="angry" look={1} />
        <CountryBall flag="prussia" hat="blucher" mustache="#eee" x={850} y={1130} size={250 * pop(30)} expression="angry" look={-1} blinkSeed={2} />
        <CountryBall flag="austria" x={220} y={1740} size={220 * pop(38)} expression="angry" look={1} blinkSeed={3} />
        <CountryBall flag="russia" hat="crown" x={860} y={1740} size={220 * pop(46)} expression="angry" look={-1} blinkSeed={4} />
        <NameTag x={230} y={1160} name="WELLINGTON" from={30} color="#012169" />
        <NameTag x={850} y={1160} name="BLÜCHER" from={38} color="#222" />
        <Bubble text="...de novo?" x={540} y={1080} from={100} duration={45} />
        <Caption text="A Europa inteira se une contra ele: a Sétima Coalizão" highlight={["Sétima", "Coalizão"]} y={250} size={88} from={4} />
      </ZoomPunch>
      <ImpactFlash at={20} color="#ffd0b0" />
    </SceneIn>
  );
};

// ---------- 6. Bélgica: o plano ----------
const Belgica: React.FC = () => {
  const f = useCurrentFrame();
  const cam = cameraAt(f, [
    { f: 0, lon: 3.5, lat: 49.5, zoom: 30 },
    { f: 40, lon: 4.49, lat: 50.6, zoom: 210 },
  ]);
  return (
    <SceneIn>
      <WorldMap camera={cam} countries={{ France: FRANCA, Belgium: { fill: "#efe3c0" } }}>
        <MapArrow from={[4.42, 50.2]} to={[4.44, 50.39]} progress={mv(f, [30, 70], [0, 1])} color="#0055A4" width={18} />
        <MapArrow from={[4.44, 50.43]} to={[4.43, 50.6]} progress={mv(f, [84, 120], [0, 1])} color="#0055A4" bend={0.25} width={16} />
        <MapArrow from={[4.46, 50.43]} to={[4.6, 50.53]} progress={mv(f, [84, 120], [0, 1])} color="#0055A4" bend={-0.25} width={16} />
        <MapBall flag="reinoUnido" hat="wellington" at={[4.37, 50.66]} size={120} expression="determined" look={1} />
        <MapBall flag="prussia" hat="blucher" mustache="#eee" at={[4.63, 50.58]} size={120} expression="determined" look={-1} blinkSeed={2} />
        <MapBall flag="franca" hat="bicorne" at={f < 70 ? [4.43, mv(f, [30, 70], [50.22, 50.4])] : L.charleroi} size={120} expression="determined" />
        <MapLabel at={[4.35, 50.82]} text="Bruxelas" size={40} from={40} />
        <MapLabel at={[4.49, 50.7]} text="Waterloo" size={34} from={40} color="#ffd23f" />
        <MapLabel at={[4.46, 50.36]} text="Charleroi" size={34} from={40} />
        <MapLabel at={[4.24, 50.6]} text="Britânicos" size={34} from={90} color="#9ec5ff" />
        <MapLabel at={[4.74, 50.62]} text="Prussianos" size={34} from={90} color="#dddddd" />
      </WorldMap>
      <TopShade />
      <YearTag text="15 DE JUNHO DE 1815" />
      <Sequence durationInFrames={80}>
        <Caption text="Napoleão invade a Bélgica" highlight={["Bélgica"]} y={300} from={4} />
      </Sequence>
      <Sequence from={84}>
        <Caption text="O plano: enfrentar britânicos e prussianos separados" highlight={["separados"]} y={300} size={86} />
      </Sequence>
    </SceneIn>
  );
};

// ---------- 7. Ligny ----------
const Ligny: React.FC = () => {
  const f = useCurrentFrame();
  const down = f >= 84 && f < 124;
  return (
    <SceneIn>
      <ZoomPunch at={[40, 70, 84]} amount={0.06}>
        <Shake from={62} to={95}>
          <Sky top="#d98b4a" bottom="#f6dcb0" />
          <Hills colors={["#a3a35a", "#888a45", "#6b6e35"]} y={1350} />
          {Array.from({ length: 4 }).map((_, i) => (
            <CountryBall key={i} flag="prussia" x={720 + i * 90} y={1300 + (i % 2) * 40} size={90} expression={f > 84 ? "surprised" : "angry"} look={-1} shadow={false} blinkSeed={i} />
          ))}
          {f > 62 && <Smoke x={800} y={1350} count={12} seed="lg" color="rgba(120,100,80,0.55)" spread={300} />}
          <Cannon x={380} y={1560} dir={1} fireAt={[40, 70]} />
          <MuzzleFlash x={500} y={1480} at={40} />
          <MuzzleFlash x={500} y={1480} at={70} />
          <Cannonball x1={500} y1={1470} x2={820} y2={1350} from={40} to={62} />
          <Cannonball x1={500} y1={1470} x2={860} y2={1450} from={70} to={84} arc={150} />
          <CountryBall flag="franca" hat="bicorne" x={200} y={1620} size={250} expression={f > 90 ? "happy" : "angry"} look={1} squash={idle(f)} />
          <CountryBall
            flag="prussia"
            hat="blucher"
            mustache="#eee"
            x={860 + (down ? 40 : 0)}
            y={1620 + (down ? 40 : 0)}
            size={250}
            expression={down ? "dead" : f >= 124 ? "determined" : "angry"}
            rotate={down ? mv(f, [84, 96], [0, 85]) : 0}
            squash={f >= 124 && f < 132 ? -0.3 : idle(f, 2)}
            bandage={f >= 124}
            look={-1}
          />
          <NameTag x={860} y={1650} name="BLÜCHER" from={10} color="#222" />
          <Explosion x={820} y={1330} at={62} />
          <Explosion x={860} y={1450} at={82} size={320} seed="lg2" />
          <Bubble text="Ainda não acabou!" x={820} y={1300} from={126} duration={48} tail="right" />
          <YearTag text="16 DE JUNHO DE 1815" />
          <Sequence durationInFrames={92}>
            <Caption text="Napoleão vence os prussianos em Ligny" highlight={["Ligny"]} y={300} from={4} />
          </Sequence>
          <Sequence from={96}>
            <Caption text="Blücher, aos 72 anos, cai do cavalo... mas escapa" highlight={["72", "anos,"]} y={300} size={88} />
          </Sequence>
        </Shake>
      </ZoomPunch>
      <ImpactFlash at={84} />
    </SceneIn>
  );
};

// ---------- 8. Grouchy ----------
const Grouchy: React.FC = () => {
  const f = useCurrentFrame();
  const gx = f < 50 ? 560 : mv(f, [50, 110], [560, 1250]);
  return (
    <SceneIn>
      <Sky top="#8fb8d8" bottom="#eaf2f7" />
      <Hills />
      {/* prussianos escapando ao fundo */}
      {f > 55 &&
        Array.from({ length: 5 }).map((_, i) => (
          <CountryBall
            key={i}
            flag="prussia"
            hat={i === 0 ? "blucher" : undefined}
            mustache={i === 0 ? "#eee" : undefined}
            bandage={i === 0}
            x={mv(f, [55, 145], [1180 + i * 90, -150 + i * 90])}
            y={1180 + hop(f, [55, 150], 14, 0.5 + i * 0.05)}
            size={i === 0 ? 120 : 95}
            expression="determined"
            look={-1}
            shadow={false}
            blinkSeed={i}
          />
        ))}
      <CountryBall flag="franca" hat="bicorne" x={230} y={1650} size={240} expression="determined" look={1} squash={idle(f)} />
      {f > 50 && f < 112 && <SpeedLines x={gx - 90} y={1560} dir={1} />}
      <CountryBall flag="franca" hat="bicorne" x={gx} y={1600 + hop(f, [50, 110], 30, 0.6)} size={200} expression={f > 40 ? "surprised" : "neutral"} look={f > 50 ? 1 : -1} blinkSeed={5} />
      {f < 50 && <NameTag x={560} y={1630} name="MARECHAL GROUCHY" from={12} color="#0055A4" />}
      {f > 20 &&
        f < 115 &&
        [0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: gx - 80 + i * 70,
              top: 1300 - Math.sin(f / 6 + i) * 20 - i * 30,
              fontFamily: FONT,
              fontSize: 80,
              color: "#FFD23F",
              WebkitTextStroke: "10px #111",
              paintOrder: "stroke fill",
            }}
          >
            ?
          </div>
        ))}
      <Bubble text="Persiga os prussianos!" x={300} y={1330} from={8} duration={38} tail="left" />
      <Sequence durationInFrames={70}>
        <Caption text="Ele manda o marechal Grouchy perseguir os prussianos com 33 mil homens" highlight={["33", "mil"]} y={250} size={78} from={4} />
      </Sequence>
      <Sequence from={74}>
        <Caption text="Grouchy vai devagar... e os prussianos escapam para ajudar Wellington" highlight={["escapam"]} y={250} size={78} />
      </Sequence>
    </SceneIn>
  );
};

// ---------- 9. A chuva ----------
const Chuva: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <SceneIn>
      <Sky top="#0d1424" bottom="#2b3a55" />
      <AbsoluteFill style={{ top: 1350, background: "linear-gradient(180deg, #4a3a28 0%, #2e2418 100%)" }} />
      {[
        [200, 1500, 220],
        [700, 1620, 300],
        [420, 1760, 180],
      ].map(([x, y, w], i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: x - w / 2,
            top: y,
            width: w,
            height: w * 0.18,
            borderRadius: "50%",
            background: "rgba(120,150,190,0.5)",
            transform: `scale(${1 + Math.sin(f / 4 + i) * 0.04})`,
          }}
        />
      ))}
      <CountryBall flag="franca" hat="bicorne" x={540} y={1560} size={300} expression="sad" look={0} squash={idle(f)} />
      <Rain intensity={1.6} />
      <Lightning at={18} x={300} />
      <Lightning at={78} x={800} seed="ch2" />
      <YearTag text="NOITE DE 17 DE JUNHO" />
      <Sequence durationInFrames={58}>
        <Caption text="Chove a noite inteira" highlight={["Chove"]} y={300} from={4} />
      </Sequence>
      <Sequence from={62}>
        <Caption text="O chão vira lama, e Napoleão atrasa o ataque" highlight={["lama,"]} y={300} size={88} />
      </Sequence>
    </SceneIn>
  );
};

// ---------- 10. Waterloo ----------
const SQUARE = Array.from({ length: 9 }).map((_, i) => ({ x: 740 + (i % 3) * 105, y: 1260 + Math.floor(i / 3) * 95 }));
const Waterloo: React.FC = () => {
  const f = useCurrentFrame();
  const fire = [30, 60, 90];
  const charge = (t0: number) => (f < t0 ? 0 : f < t0 + 45 ? mv(f, [t0, t0 + 45], [0, 1]) : mv(f, [t0 + 45, t0 + 70], [1, 0]));
  const c = Math.max(charge(118), charge(188));
  return (
    <SceneIn>
      <ZoomPunch at={[...fire, 165, 235]} amount={0.05}>
        <Shake from={165} to={182}>
          <Shake from={235} to={252}>
            <Sky top="#8fa3b5" bottom="#e9e1cc" />
            <Smoke x={540} y={980} count={12} seed="wsky" color="rgba(90,85,80,0.4)" spread={900} />
            <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute" }}>
              <path d="M 0 1320 Q 300 1300 560 1350 Q 800 1240 1080 1220 L 1080 1920 L 0 1920 Z" fill="#7ea35a" />
              <path d="M 0 1500 Q 400 1440 1080 1480 L 1080 1920 L 0 1920 Z" fill="#628a44" />
            </svg>
            {SQUARE.map((p, i) => (
              <CountryBall key={i} flag="reinoUnido" hat="shako" x={p.x} y={p.y} size={100} expression={c > 0.8 ? "surprised" : "determined"} look={-1} shadow={false} blinkSeed={i} />
            ))}
            {Array.from({ length: 5 }).map((_, i) => (
              <CountryBall
                key={`cv${i}`}
                flag="franca"
                hat={i === 2 ? "bicorne" : "shako"}
                x={260 + (i % 3) * 60 + c * 330}
                y={1380 + Math.floor(i / 2) * 70 + hop(f, [118, 260], 20, 0.7 + i * 0.05)}
                size={i === 2 ? 130 : 105}
                expression="angry"
                look={c > 0 && f % 70 < 45 ? 1 : -1}
                shadow={false}
                blinkSeed={i + 3}
              />
            ))}
            {c > 0.1 && <SpeedLines x={330 + c * 330} y={1480} dir={1} opacity={c} />}
            {f > 118 && f < 150 && <NameTag x={380 + c * 330} y={1560} name="MARECHAL NEY" from={118} color="#0055A4" />}
            <Volley at={165} xs={[740, 740, 740]} y={1240} dir={-1} />
            <Volley at={235} xs={[740, 740, 740]} y={1330} dir={-1} />
            <Cannon x={330} y={1720} dir={1} fireAt={fire} size={0.9} />
            {fire.map((t, i) => (
              <React.Fragment key={i}>
                <MuzzleFlash x={440} y={1640} at={t} />
                <Cannonball x1={440} y1={1630} x2={760 + i * 60} y2={1200} from={t} to={t + 22} arc={260} />
                <Explosion x={760 + i * 60} y={1180} at={t + 22} size={220} seed={`w${i}`} />
              </React.Fragment>
            ))}
            <CountryBall flag="franca" hat="bicorne" x={150} y={1760} size={230} expression="angry" look={1} squash={idle(f)} />
            <CountryBall flag="reinoUnido" hat="wellington" x={960} y={1760} size={230} expression="determined" look={-1} squash={idle(f, 2)} blinkSeed={7} />
            <NameTag x={150} y={1790} name="NAPOLEÃO" from={10} color="#0055A4" />
            <NameTag x={960} y={1790} name="WELLINGTON" from={16} color="#012169" />
            <YearTag text="18 DE JUNHO DE 1815 · 11H30" />
            <Sequence durationInFrames={100}>
              <Caption text="Começa a Batalha de Waterloo" highlight={["Waterloo"]} y={300} from={4} />
            </Sequence>
            <Sequence from={104} durationInFrames={84}>
              <Caption text="Cerca de 73 mil franceses contra 68 mil aliados" highlight={["73", "68"]} y={300} size={88} />
            </Sequence>
            <Sequence from={190}>
              <Caption text="Ney ataca com a cavalaria, mas os britânicos não cedem" highlight={["não", "cedem"]} y={300} size={84} />
            </Sequence>
          </Shake>
        </Shake>
      </ZoomPunch>
      <ImpactFlash at={166} />
      <ImpactFlash at={236} />
    </SceneIn>
  );
};

// ---------- 11. Chegam os prussianos ----------
const Prussianos: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <SceneIn>
      <ZoomPunch at={[75]} amount={0.1}>
        <Shake from={75} to={100}>
          <Sky top="#c98a5a" bottom="#f1dcc0" />
          <Hills colors={["#8aa35e", "#71894a", "#566f38"]} y={1380} />
          {f > 68 &&
            Array.from({ length: 9 }).map((_, i) => (
              <CountryBall
                key={i}
                flag="prussia"
                hat={i === 4 ? "blucher" : undefined}
                mustache={i === 4 ? "#eee" : undefined}
                bandage={i === 4}
                x={mv(f, [68, 110], [1250, 680]) + (i % 3) * 120}
                y={1250 + Math.floor(i / 3) * 140 + hop(f, [68, 180], 26, 0.55 + i * 0.04)}
                size={i === 4 ? 170 : 125}
                expression="angry"
                look={-1}
                blinkSeed={i}
              />
            ))}
          {f > 70 && f < 112 && <SpeedLines x={mv(f, [68, 110], [1250, 680]) + 260} y={1380} dir={-1} />}
          <CountryBall flag="reinoUnido" hat="wellington" x={300} y={1450} size={230} expression={f < 75 ? "sad" : "happy"} look={1} squash={idle(f)} />
          <CountryBall flag="franca" hat="bicorne" x={220} y={1780} size={200} expression={f < 75 ? "determined" : "surprised"} look={1} />
          <Bubble text="Ou chega a noite... ou os prussianos!" x={360} y={1150} from={8} duration={58} tail="left" size={44} />
          <Sequence durationInFrames={72}>
            <Caption text="No fim da tarde, Wellington está no limite" highlight={["limite"]} y={300} from={4} />
          </Sequence>
          <Sequence from={76}>
            <Caption text="Então os prussianos de Blücher chegam pelo flanco" highlight={["prussianos"]} y={300} size={88} />
          </Sequence>
        </Shake>
      </ZoomPunch>
      <ImpactFlash at={75} />
    </SceneIn>
  );
};

// ---------- 12. A Guarda Imperial ----------
const Guarda: React.FC = () => {
  const f = useCurrentFrame();
  const adv = f < 150 ? mv(f, [15, 110], [0, 1]) : mv(f, [150, 205], [1, -0.4]);
  const rise = mv(f, [100, 116], [0, 1]);
  const hit = f >= 120;
  return (
    <SceneIn>
      <Shake from={120} to={150}>
        <Sky top="#5a3b2e" bottom="#d9a46c" />
        <Smoke x={540} y={1000} count={14} seed="gsky" color="rgba(60,40,30,0.45)" spread={900} />
        {/* linha britânica escondida atrás da crista */}
        {Array.from({ length: 5 }).map((_, i) => (
          <CountryBall
            key={`b${i}`}
            flag="reinoUnido"
            hat="shako"
            x={700 + i * 85}
            y={1420 - rise * 130}
            size={110}
            expression="determined"
            look={-1}
            shadow={false}
            blinkSeed={i}
          />
        ))}
        <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute" }}>
          <path d="M 0 1420 Q 500 1380 1080 1360 L 1080 1920 L 0 1920 Z" fill="#6f8c48" />
        </svg>
        {Array.from({ length: 6 }).map((_, i) => (
          <CountryBall
            key={`g${i}`}
            flag="franca"
            hat="bearskin"
            x={120 + (i % 3) * 120 + Math.floor(i / 3) * 50 + adv * 300}
            y={1560 + Math.floor(i / 3) * 130 + hop(f, [15, 110], 14, 0.5)}
            size={125}
            expression={hit ? (f > 150 ? "sad" : "surprised") : "determined"}
            look={f > 150 ? -1 : 1}
            shadow={false}
            blinkSeed={i + 2}
          />
        ))}
        <Volley at={120} xs={[700, 785, 870, 955]} y={1260} dir={-1} />
        <Volley at={135} xs={[700, 785, 870, 955]} y={1270} dir={-1} />
        {f > 120 && <Smoke x={640} y={1300} count={10} seed="gv" color="rgba(230,230,230,0.7)" spread={250} />}
        <YearTag text="18 DE JUNHO · 19H30" />
        <Sequence durationInFrames={108}>
          <Caption text="Última cartada: a Guarda Imperial, a elite de Napoleão" highlight={["Guarda", "Imperial,"]} y={300} size={86} from={4} />
        </Sequence>
        <Sequence from={112} durationInFrames={52}>
          <Caption text="Os britânicos se levantam e disparam" highlight={["disparam"]} y={300} />
        </Sequence>
        <Sequence from={166}>
          <Caption text="A Guarda recua... e o exército francês desmorona" highlight={["recua..."]} y={300} size={88} />
        </Sequence>
      </Shake>
      <ImpactFlash at={120} />
      <Vignette strength={0.4} color="40,10,0" />
    </SceneIn>
  );
};

// ---------- 13. O resultado ----------
const Resultado: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <SceneIn>
      <Drift duration={150} to={1.06}>
        <Sky top="#2c2238" bottom="#b0704a" />
        <Smoke x={540} y={1200} count={16} seed="rs" color="rgba(50,40,40,0.5)" spread={900} />
        <Hills colors={["#55603f", "#454f33", "#363f28"]} y={1450} />
        <CountryBall flag="reinoUnido" hat="wellington" x={400} y={1680} size={240} expression="happy" look={1} squash={idle(f)} />
        <CountryBall flag="prussia" hat="blucher" mustache="#eee" bandage x={690} y={1680} size={240} expression="happy" look={-1} squash={idle(f, 2)} blinkSeed={3} />
        <Embers count={30} seed="re" area={[0, 1100, 1080, 600]} />
        <Caption text="Cerca de 50 mil mortos e feridos em um único dia" highlight={["50", "mil"]} y={280} size={90} from={4} />
        <Counter from={0} to={50000} start={10} end={60} y={760} suffix="*" color="#ff8a8a" size={170} />
        <Bubble text="Foi por um triz!" x={400} y={1380} from={62} duration={70} tail="left" />
        <Sequence from={30}>
          <div style={{ position: "absolute", top: 960, left: 80, right: 80, textAlign: "center", fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: 36, color: "#fff", textShadow: "0 2px 6px rgba(0,0,0,0.8)" }}>
            *somando os três exércitos; as estimativas variam entre historiadores
          </div>
        </Sequence>
      </Drift>
      <Vignette strength={0.5} />
    </SceneIn>
  );
};

// ---------- 14. Santa Helena ----------
const Helena: React.FC = () => {
  const f = useCurrentFrame();
  const cam = cameraAt(f, [
    { f: 0, lon: 4.4, lat: 50.6, zoom: 60 },
    { f: 55, lon: 0, lat: 22, zoom: 2.4 },
    { f: 130, lon: -2, lat: 10, zoom: 2.4 },
    { f: 175, lon: -5.72, lat: -15.6, zoom: 40 },
  ]);
  const ship = geoAlong([L.rochefort, [-14, 20], L.helena], mv(f, [60, 130], [0, 1]));
  return (
    <SceneIn>
      <WorldMap camera={cam} countries={{ France: BOURBON, "United Kingdom": { flag: "reinoUnido" } }}>
        <MapArrow from={L.rochefort} to={[-5.9, -15.4]} progress={mv(f, [60, 130], [0, 1])} color="#012169" bend={0.12} width={14} />
        <MapAt at={L.helena}>
          <div style={{ position: "absolute", left: -60, top: -40, width: 120, height: 80, borderRadius: "45% 55% 50% 50%", background: "#9c8a5a", border: "5px solid #111" }} />
        </MapAt>
        {f >= 60 && <MapAt at={ship}>{f < 140 && <Boat w={90} />}</MapAt>}
        <MapBall flag="franca" hat="bicorne" at={f < 60 ? L.rochefort : ship} size={f > 140 ? 150 : 100} expression="sad" />
        <MapPin at={L.helena} label="Santa Helena" from={150} labelSide="down" icon="⚓" color="#012169" />
        {f > 55 && f < 135 && <MapLabel at={[18, 5]} text="África" size={56} />}
      </WorldMap>
      <TopShade />
      <YearTag text={f < 62 ? "22 DE JUNHO DE 1815" : "OUTUBRO DE 1815"} />
      <Sequence durationInFrames={60}>
        <Caption text="Napoleão abdica pela segunda vez" highlight={["segunda"]} y={300} from={4} />
      </Sequence>
      <Sequence from={64}>
        <Caption text="Os britânicos o levam para Santa Helena, no meio do Atlântico Sul" highlight={["Santa", "Helena,"]} y={300} size={80} />
      </Sequence>
    </SceneIn>
  );
};

// ---------- 15. Final ----------
const Final: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <SceneIn>
      <Sky top="#2b1d3a" bottom="#ff9a5a" />
      <div style={{ position: "absolute", left: 640, top: 1080, width: 260, height: 260, borderRadius: "50%", background: "#ffd27a", opacity: 0.9 }} />
      <Water y={1360} color="#3a4a7a" dark="#26335a" />
      <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute" }}>
        <path d="M -40 1700 Q 200 1480 520 1560 Q 640 1600 700 1700 Z" fill="#6b5a3a" stroke="#111" strokeWidth={6} />
      </svg>
      <CountryBall flag="franca" hat="bicorne" x={330} y={1580} size={240} expression="sad" look={1} squash={idle(f)} />
      <Sequence durationInFrames={78}>
        <Caption text="Ele morreu lá, em 5 de maio de 1821" highlight={["1821"]} y={300} from={4} />
      </Sequence>
      <Sequence from={80}>
        <Caption text="Qual guerra eu conto agora? Comenta!" highlight={["Comenta!"]} y={300} size={92} />
        <Caption text="Segue pra não perder a próxima" y={560} size={56} stagger={2} />
      </Sequence>
      <Vignette strength={0.45} />
    </SceneIn>
  );
};

const COMPONENTS: Record<string, React.FC> = {
  hook: Hook,
  elba: Elba,
  laffrey: Laffrey,
  paris: Paris,
  coalizao: Coalizao,
  belgica: Belgica,
  ligny: Ligny,
  grouchy: Grouchy,
  chuva: Chuva,
  waterloo: Waterloo,
  prussianos: Prussianos,
  guarda: Guarda,
  resultado: Resultado,
  helena: Helena,
  final: Final,
};

export const WATERLOO_SCENES = timeline.scenes.map((s) => ({ component: COMPONENTS[s.id], frames: s.frames }));
export const WATERLOO_FRAMES = WATERLOO_SCENES.reduce((a, s) => a + s.frames, 0);

export const Waterloo1815: React.FC<{ comAudio?: boolean }> = ({ comAudio = true }) => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Series>
      {WATERLOO_SCENES.map(({ component: C, frames }, i) => (
        <Series.Sequence key={i} durationInFrames={frames}>
          <C />
        </Series.Sequence>
      ))}
    </Series>
    <Grain opacity={0.07} />
    <Vignette strength={0.28} />
    {comAudio && <Audio src={staticFile("audio/waterloo.wav")} />}
  </AbsoluteFill>
);

// ---------- Capa (thumbnail) ----------
export const WaterlooCapa: React.FC = () => (
  <AbsoluteFill>
    <AbsoluteFill style={{ background: "linear-gradient(135deg, #0b2a6b 0%, #0b2a6b 49.5%, #7a0d16 50.5%, #7a0d16 100%)" }} />
    <Rays color="#ffd27a" opacity={0.14} />
    <CountryBall flag="franca" hat="bicorne" x={300} y={1300} size={420} expression="angry" look={1} />
    <CountryBall flag="reinoUnido" hat="wellington" x={790} y={1380} size={380} expression="angry" look={-1} blinkSeed={3} />
    <CountryBall flag="prussia" hat="blucher" mustache="#eee" x={900} y={1720} size={240} expression="angry" look={-1} blinkSeed={5} />
    <div
      style={{
        position: "absolute",
        top: 980,
        left: 0,
        right: 0,
        textAlign: "center",
        fontFamily: FONT,
        fontSize: 200,
        color: "#FFD23F",
        WebkitTextStroke: "26px #111",
        paintOrder: "stroke fill",
        transform: "rotate(-8deg)",
        textShadow: "0 14px 0 rgba(0,0,0,0.5)",
      }}
    >
      VS
    </div>
    <div
      style={{
        position: "absolute",
        top: 230,
        left: 0,
        right: 0,
        textAlign: "center",
        fontFamily: FONT,
        fontSize: 210,
        lineHeight: 1,
        color: "#FFD23F",
        WebkitTextStroke: "28px #111",
        paintOrder: "stroke fill",
        textShadow: "0 16px 0 rgba(0,0,0,0.5)",
      }}
    >
      WATERLOO
    </div>
    <div
      style={{
        position: "absolute",
        top: 480,
        left: 60,
        right: 60,
        textAlign: "center",
        fontFamily: FONT,
        fontSize: 92,
        lineHeight: 1.1,
        color: "#fff",
        WebkitTextStroke: "16px #111",
        paintOrder: "stroke fill",
        textTransform: "uppercase",
      }}
    >
      A última batalha de Napoleão
    </div>
    <Vignette strength={0.45} />
  </AbsoluteFill>
);
