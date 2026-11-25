import React, { createContext, useContext, useId, useMemo } from "react";
import { geoMercator, geoPath, geoGraticule10, GeoProjection, GeoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import world from "world-atlas/countries-50m.json";
import regionsData from "../geo/regions.json";
import { FLAGS, FlagName } from "../flags";
import { CountryBall } from "./CountryBall";
import { FONT } from "./ui";

// Dados: Natural Earth (domínio público), via world-atlas.
type F = Feature<Geometry, { name: string; id?: string }>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const w = world as any;
const COUNTRIES = (feature(w, w.objects.countries) as unknown as FeatureCollection<Geometry, { name: string }>).features as F[];
const REGIONS = (regionsData as unknown as FeatureCollection<Geometry, { id: string; name: string }>).features as F[];

export type RegionId = "mato-grosso" | "mato-grosso-do-sul" | "corrientes" | "formosa" | "misiones";

export const country = (name: string) => COUNTRIES.find((c) => c.properties.name === name);
export const region = (id: RegionId) => REGIONS.find((r) => r.properties.id === id);

export type LonLat = [number, number];
export type Camera = { lon: number; lat: number; zoom: number };

// Interpola a câmera entre keyframes {f, lon, lat, zoom} (zoom em escala logarítmica).
export const cameraAt = (frame: number, keys: (Camera & { f: number })[]): Camera => {
  if (frame <= keys[0].f) return keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (frame <= b.f) {
      const t = interpolate(frame, [a.f, b.f], [0, 1], { easing: Easing.inOut(Easing.cubic) });
      return {
        lon: a.lon + (b.lon - a.lon) * t,
        lat: a.lat + (b.lat - a.lat) * t,
        zoom: Math.exp(Math.log(a.zoom) + (Math.log(b.zoom) - Math.log(a.zoom)) * t),
      };
    }
  }
  return keys[keys.length - 1];
};

type MapCtx = { projection: GeoProjection; path: GeoPath; camera: Camera; visible: (p: LonLat) => boolean };
const Ctx = createContext<MapCtx | null>(null);
const useMap = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("Use dentro de <WorldMap>");
  return c;
};

// flagBox: [lonMin, latMin, lonMax, latMax] faz vários países dividirem a MESMA bandeira contínua
export type CountryStyle = { flag?: FlagName; fill?: string; dim?: number; flagBox?: [number, number, number, number] };
export type RegionOverlay = {
  id?: RegionId; // estado/província
  countryName?: string; // ou um país inteiro (ex.: "Paraguay")
  flag?: FlagName; // bandeira de quem ocupa
  fill?: string;
  progress?: number; // 0..1 (revelação circular a partir de `origin`)
  origin?: LonLat;
  hatch?: boolean; // listras de "ocupado"
  flagBox?: [number, number, number, number]; // ancora a bandeira numa área (lon/lat)
  pulse?: boolean;
};

const FlagFill: React.FC<{
  d: string;
  bounds: [[number, number], [number, number]];
  flag: FlagName;
  id: string;
  plain?: boolean;
  stretch?: boolean;
}> = ({ d, bounds, flag, id, plain, stretch }) => {
  const Flag = FLAGS[flag];
  const [[x0, y0], [x1, y1]] = bounds;
  const s = Math.max(x1 - x0, y1 - y0) / 200;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  if (stretch) {
    return (
      <>
        <clipPath id={id}>
          <path d={d} />
        </clipPath>
        <g clipPath={`url(#${id})`}>
          <g transform={`translate(${x0}, ${y0}) scale(${(x1 - x0) / 200}, ${(y1 - y0) / 200})`}>
            <Flag plain={plain} />
          </g>
        </g>
      </>
    );
  }
  return (
    <>
      <clipPath id={id}>
        <path d={d} />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        <g transform={`translate(${cx - 100 * s}, ${cy - 100 * s}) scale(${s})`}>
          <Flag plain={plain} />
        </g>
      </g>
    </>
  );
};

export const WorldMap: React.FC<{
  camera: Camera;
  cy?: number;
  countries?: Record<string, CountryStyle>;
  regions?: RegionOverlay[];
  labels?: boolean;
  children?: React.ReactNode;
}> = ({ camera, cy = 1120, countries = {}, regions = [], children }) => {
  const frame = useCurrentFrame();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  // Mapa aberto (Mercator). zoom 1 = mundo inteiro na largura do vídeo.
  const scale = (1080 / (2 * Math.PI)) * camera.zoom;
  const projection = useMemo(
    () =>
      geoMercator()
        .center([camera.lon, camera.lat])
        .scale(scale)
        .translate([540, cy])
        .clipExtent([
          [-50, -50],
          [1130, 1970],
        ])
        .precision(0.3),
    [camera.lon, camera.lat, scale, cy],
  );
  const path = useMemo(() => geoPath(projection), [projection]);
  // limites sem recorte da tela: a bandeira fica "presa" ao país quando a câmera anda
  const fullProj = useMemo(
    () => geoMercator().center([camera.lon, camera.lat]).scale(scale).translate([540, cy]).precision(1),
    [camera.lon, camera.lat, scale, cy],
  );
  const fullPath = useMemo(() => geoPath(fullProj), [fullProj]);
  const boxBounds = (b: [number, number, number, number]): [[number, number], [number, number]] => {
    const p0 = fullProj([b[0], b[3]]) ?? [0, 0];
    const p1 = fullProj([b[2], b[1]]) ?? [0, 0];
    return [p0, p1];
  };
  const visible = (p: LonLat) => {
    const q = projection(p);
    return !!q && q[0] > -200 && q[0] < 1280 && q[1] > -200 && q[1] < 2120;
  };
  const grat = path(geoGraticule10()) ?? "";
  const borderW = Math.min(4.5, 1 + camera.zoom * 0.12);

  return (
    <Ctx.Provider value={{ projection, path, camera, visible }}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <radialGradient id={`ocean${uid}`} cx="50%" cy="50%" r="80%">
            <stop offset="0%" stopColor="#5fb4ea" />
            <stop offset="100%" stopColor="#1f5f99" />
          </radialGradient>
          <pattern id={`hatch${uid}`} width={18} height={18} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width={18} height={18} fill="none" />
            <rect width={7} height={18} fill="rgba(0,0,0,0.28)" />
          </pattern>
        </defs>
        <rect x={0} y={0} width={1080} height={1920} fill={`url(#ocean${uid})`} />
        <path d={grat} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={1.5} />
        {/* terra */}
        {COUNTRIES.map((c, i) => {
          const d = path(c);
          if (!d) return null;
          const st = countries[c.properties.name];
          return (
            <path
              key={i}
              d={d}
              fill={st?.fill ?? "#efe3c0"}
              stroke="#8a7650"
              strokeWidth={borderW * 0.5}
              opacity={st?.dim ?? 1}
            />
          );
        })}
        {/* países com bandeira */}
        {COUNTRIES.map((c, i) => {
          const st = countries[c.properties.name];
          if (!st?.flag) return null;
          const d = path(c);
          if (!d) return null;
          return (
            <g key={`f${i}`} opacity={st.dim ?? 1}>
              <FlagFill
                d={d}
                bounds={st.flagBox ? boxBounds(st.flagBox) : (fullPath.bounds(c) as [[number, number], [number, number]])}
                flag={st.flag}
                id={`cf${uid}${i}`}
                plain={camera.zoom > 8}
                stretch={!!st.flagBox}
              />
              <path d={d} fill="none" stroke="#111" strokeWidth={borderW} strokeLinejoin="round" />
            </g>
          );
        })}
        {/* regiões ocupadas / destacadas */}
        {regions.map((r, i) => {
          const reg = r.countryName ? country(r.countryName) : r.id ? region(r.id) : undefined;
          if (!reg) return null;
          const d = path(reg);
          if (!d) return null;
          const prog = r.progress ?? 1;
          if (prog <= 0) return null;
          const b = fullPath.bounds(reg) as [[number, number], [number, number]];
          const o = r.origin ? projection(r.origin) : null;
          const ox = o ? o[0] : (b[0][0] + b[1][0]) / 2;
          const oy = o ? o[1] : (b[0][1] + b[1][1]) / 2;
          const maxR = Math.hypot(b[1][0] - b[0][0], b[1][1] - b[0][1]) * 1.3;
          const pulse = r.pulse ? 0.55 + 0.45 * Math.sin(frame / 4) : 1;
          return (
            <g key={`r${i}`}>
              <clipPath id={`rv${uid}${i}`}>
                <circle cx={ox} cy={oy} r={maxR * prog} />
              </clipPath>
              <g clipPath={`url(#rv${uid}${i})`} opacity={pulse}>
                {r.flag ? (
                  <FlagFill
                    d={d}
                    bounds={r.flagBox ? boxBounds(r.flagBox) : b}
                    flag={r.flag}
                    id={`rf${uid}${i}`}
                    plain={camera.zoom > 8}
                    stretch={!!r.flagBox}
                  />
                ) : (
                  <path d={d} fill={r.fill ?? "#ffd23f"} />
                )}
                {r.hatch && <path d={d} fill={`url(#hatch${uid})`} />}
              </g>
              <path d={d} fill="none" stroke="#111" strokeWidth={borderW} strokeDasharray={r.hatch ? "10 6" : undefined} />
            </g>
          );
        })}
      </svg>
      {children}
    </Ctx.Provider>
  );
};

// Countryball posicionado no mapa por longitude/latitude.
type BallProps = Omit<React.ComponentProps<typeof CountryBall>, "x" | "y">;
export const MapBall: React.FC<BallProps & { at: LonLat; hop?: number }> = ({ at, hop = 0, ...rest }) => {
  const { projection, visible } = useMap();
  if (!visible(at)) return null;
  const p = projection(at);
  if (!p) return null;
  return <CountryBall x={p[0]} y={p[1] + (rest.size ?? 160) * 0.5 + hop} size={160} {...rest} />;
};

// Seta curva animada de A até B.
export const MapArrow: React.FC<{ from: LonLat; to: LonLat; progress: number; color?: string; bend?: number; width?: number }> = ({
  from,
  to,
  progress,
  color = "#E63946",
  bend = 0.25,
  width = 22,
}) => {
  const { projection } = useMap();
  const a = projection(from);
  const b = projection(to);
  if (!a || !b || progress <= 0) return null;
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const c: [number, number] = [mx - dy * bend, my + dx * bend];
  const d = `M ${a[0]} ${a[1]} Q ${c[0]} ${c[1]} ${b[0]} ${b[1]}`;
  // ponto e direção em t = progress
  const t = Math.min(1, progress);
  const q = (u: number) => [
    (1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * c[0] + u * u * b[0],
    (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * c[1] + u * u * b[1],
  ];
  const [hx, hy] = q(t);
  const [px, py] = q(Math.max(0, t - 0.02));
  const ang = (Math.atan2(hy - py, hx - px) * 180) / Math.PI;
  const len = Math.hypot(dx, dy) * 1.25;
  return (
    <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <path d={d} fill="none" stroke="#111" strokeWidth={width + 10} strokeLinecap="round" strokeDasharray={`${len * t} ${len * 2}`} />
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={`${len * t} ${len * 2}`} />
      <g transform={`translate(${hx}, ${hy}) rotate(${ang})`}>
        <polygon points={`${width * 1.6},0 ${-width * 0.6},${-width * 1.4} ${-width * 0.6},${width * 1.4}`} fill={color} stroke="#111" strokeWidth={6} strokeLinejoin="round" />
      </g>
    </svg>
  );
};

// Marcador de lugar (batalha / cidade) com nome.
export const MapPin: React.FC<{ at: LonLat; label: string; from?: number; color?: string; icon?: string; labelSide?: "up" | "down" }> = ({
  at,
  label,
  from = 0,
  color = "#E63946",
  icon = "⚔",
  labelSide = "up",
}) => {
  const { projection, visible } = useMap();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!visible(at) || frame < from) return null;
  const p = projection(at);
  if (!p) return null;
  const s = spring({ frame: frame - from, fps, config: { damping: 9 } });
  const ring = ((frame - from) % 30) / 30;
  return (
    <div style={{ position: "absolute", left: p[0], top: p[1] }}>
      <div
        style={{
          position: "absolute",
          left: -60 * (0.4 + ring),
          top: -60 * (0.4 + ring),
          width: 120 * (0.4 + ring),
          height: 120 * (0.4 + ring),
          borderRadius: "50%",
          border: `6px solid ${color}`,
          opacity: 1 - ring,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -36,
          top: -36,
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: color,
          border: "6px solid #111",
          transform: `scale(${s})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 38,
          color: "#fff",
        }}
      >
        {icon}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: labelSide === "up" ? -70 : 52,
          transform: `translate(-50%, ${labelSide === "up" ? "-100%" : "0"}) scale(${s})`,
          background: "#fff",
          border: "5px solid #111",
          borderRadius: 14,
          padding: "6px 22px",
          fontFamily: FONT,
          fontSize: 48,
          whiteSpace: "nowrap",
          color: "#111",
          boxShadow: "0 6px 0 rgba(0,0,0,0.3)",
        }}
      >
        {label}
      </div>
    </div>
  );
};

// Texto preso a um ponto do mapa.
export const MapLabel: React.FC<{ at: LonLat; text: string; size?: number; from?: number; color?: string }> = ({
  at,
  text,
  size = 44,
  from = 0,
  color = "#fff",
}) => {
  const { projection, visible } = useMap();
  const frame = useCurrentFrame();
  if (!visible(at)) return null;
  const p = projection(at);
  if (!p) return null;
  const o = interpolate(frame - from, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: p[0],
        top: p[1],
        transform: "translate(-50%, -50%)",
        fontFamily: FONT,
        fontSize: size,
        color,
        opacity: o,
        whiteSpace: "nowrap",
        WebkitTextStroke: `${size * 0.18}px #111`,
        paintOrder: "stroke fill",
        textTransform: "uppercase",
      }}
    >
      {text}
    </div>
  );
};

// Exército em formação marchando ao longo de um caminho (lista de pontos).
// `progress` 0..1 ao longo do caminho; `count` soldados visíveis.
export const MapArmy: React.FC<{
  flag: FlagName;
  path: LonLat[];
  progress: number;
  count: number;
  size?: number;
  spacing?: number; // em px
  expression?: React.ComponentProps<typeof CountryBall>["expression"];
  frozen?: number;
  seed?: number;
}> = ({ flag, path, progress, count, size = 56, spacing = 50, expression = "determined", frozen = 0, seed = 0 }) => {
  const { projection } = useMap();
  const frame = useCurrentFrame();
  const pts = path.map((p) => projection(p) ?? [0, 0]);
  const lens = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = lens.reduce((a, b) => a + b, 0);
  const at = (d: number): { x: number; y: number; ang: number } => {
    let rem = Math.max(0, Math.min(total, d));
    for (let i = 0; i < lens.length; i++) {
      if (rem <= lens[i] || i === lens.length - 1) {
        const t = lens[i] === 0 ? 0 : rem / lens[i];
        const a = pts[i];
        const b = pts[i + 1];
        return { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, ang: Math.atan2(b[1] - a[1], b[0] - a[0]) };
      }
      rem -= lens[i];
    }
    return { x: pts[0][0], y: pts[0][1], ang: 0 };
  };
  const lead = total * progress;
  const cols = 3;
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const row = Math.floor(i / cols);
        const col = (i % cols) - 1;
        const p = at(lead - row * spacing);
        const nx = -Math.sin(p.ang);
        const ny = Math.cos(p.ang);
        const x = p.x + nx * col * spacing * 0.9;
        const y = p.y + ny * col * spacing * 0.9 - Math.abs(Math.sin(frame * 0.5 + i * 0.7 + seed)) * 10;
        return (
          <CountryBall
            key={i}
            flag={flag}
            x={x}
            y={y + size / 2}
            size={size}
            expression={expression}
            look={Math.cos(p.ang) > 0 ? 1 : -1}
            frozen={frozen}
            shadow={false}
            blinkSeed={i}
          />
        );
      })}
    </>
  );
};

// Posiciona qualquer conteúdo num ponto do mapa (o conteúdo é desenhado a partir do ponto).
export const MapAt: React.FC<{ at: LonLat; children: React.ReactNode }> = ({ at, children }) => {
  const { projection, visible } = useMap();
  if (!visible(at)) return null;
  const p = projection(at);
  if (!p) return null;
  return <div style={{ position: "absolute", left: p[0], top: p[1], width: 0, height: 0 }}>{children}</div>;
};
