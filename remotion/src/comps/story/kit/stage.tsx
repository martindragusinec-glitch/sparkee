import React, { createContext, useContext, useId, useMemo } from "react";
import { LOGO } from "./logo-data.gen";
import { K, type Pt } from "./geometry";

/**
 * <LogoStage> is one full-frame <svg> whose children draw in LOGO UNITS.
 *
 *   screen = origin + K·zoom·(u − pivot) + K·pivot      (zoom about `pivot`, in logo units)
 *
 * It also mounts the gradient/mask defs of logo.svg (parts) and logo-dark.svg once, namespaced per
 * instance, so several stages can share a composition. Children read the scale with useStage().k
 * (px per logo unit) to draw screen-constant tooling (1.5 px hairlines, 6 px anchors).
 */
type StageCtx = { k: number; prefix: string };
const Ctx = createContext<StageCtx>({ k: K, prefix: "" });

export const useStage = () => useContext(Ctx);

/** Namespace helper: ns("flood") → a stage-unique id; ns.url("flood") → url(#…); ns.markup(svg) swaps __P__. */
export const useNs = () => {
  const { prefix } = useStage();
  const local = useId().replace(/[^a-zA-Z0-9]/g, "");
  return useMemo(() => {
    const id = (name: string) => `${prefix}${local}-${name}`;
    return {
      id,
      url: (name: string) => `url(#${id(name)})`,
      /** logo defs live on the stage: parts markup references them through the stage prefix */
      markup: (svg: string) => svg.split("__P__").join(prefix),
      logoUrl: (name: string) => `url(#${prefix}${name})`,
    };
  }, [prefix, local]);
};

/**
 * A camera in logo units: the world point `pivot` lands on screen at `at` (px) and the scale is `k`
 * px per logo unit, i.e.  screen = at + k·(u − pivot).  Overrides ox/oy/zoom/pivot of <LogoStage>.
 */
export type Cam = { k: number; pivot: Pt; at: Pt };
export const camToScreen = (c: Cam, u: Pt): Pt => [c.at[0] + c.k * (u[0] - c.pivot[0]), c.at[1] + c.k * (u[1] - c.pivot[1])];
export const camToWorld = (c: Cam, s: Pt): Pt => [c.pivot[0] + (s[0] - c.at[0]) / c.k, c.pivot[1] + (s[1] - c.at[1]) / c.k];
/** the same camera re-expressed about another world point (the view does not change) */
export const camAbout = (c: Cam, p: Pt): Cam => ({ k: c.k, pivot: p, at: camToScreen(c, p) });
/** an extra uniform zoom `z` about world point `s` (s stays put on screen) */
export const camZoom = (c: Cam, z: number, s: Pt): Cam => {
  const a = camAbout(c, s);
  return { k: a.k * z, pivot: s, at: a.at };
};
/** interpolate two cameras: scale in log space, the view centre (screen point `ref`) as a world point */
export const camLerp = (a: Cam, b: Cam, u: number, ref: Pt): Cam => {
  if (u <= 0) return a;
  if (u >= 1) return b;
  const k = Math.exp(Math.log(a.k) + (Math.log(b.k) - Math.log(a.k)) * u);
  const wa = camToWorld(a, ref);
  const wb = camToWorld(b, ref);
  return { k, pivot: [wa[0] + (wb[0] - wa[0]) * u, wa[1] + (wb[1] - wa[1]) * u], at: ref };
};
/** the ox/oy/zoom/pivot framing of <LogoStage> as a Cam */
export const stageCam = (ox: number, oy: number, zoom = 1, pivot: Pt = [0, 0]): Cam => ({
  k: K * zoom,
  pivot,
  at: [ox + K * pivot[0], oy + K * pivot[1]],
});

export type LogoStageProps = {
  width: number;
  height: number;
  /** px position of logo (0,0) at zoom 1 */
  ox: number;
  oy: number;
  /** full camera (overrides ox, oy, zoom and pivot) */
  cam?: Cam;
  /** extra uniform zoom about `pivot` (logo units), 1 = K px per unit */
  zoom?: number;
  pivot?: Pt;
  /** extra px offset of the whole drawing */
  dx?: number;
  dy?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

export const LogoStage: React.FC<LogoStageProps> = ({
  width,
  height,
  ox,
  oy,
  cam,
  zoom = 1,
  pivot = [0, 0],
  dx = 0,
  dy = 0,
  style,
  children,
}) => {
  const prefix = `st${useId().replace(/[^a-zA-Z0-9]/g, "")}-`;
  const k = cam ? cam.k : K * zoom;
  // translate so that `pivot` stays where it is at zoom 1 (or where the camera puts it)
  const tx = cam ? cam.at[0] - k * cam.pivot[0] + dx : ox + dx + K * pivot[0] - k * pivot[0];
  const ty = cam ? cam.at[1] - k * cam.pivot[1] + dy : oy + dy + K * pivot[1] - k * pivot[1];
  const defs = useMemo(() => (LOGO.defsLight + LOGO.defsDark).split("__P__").join(prefix), [prefix]);
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ position: "absolute", left: 0, top: 0, overflow: "visible", ...style }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs dangerouslySetInnerHTML={{ __html: defs }} />
      <Ctx.Provider value={{ k, prefix }}>
        <g transform={`translate(${tx} ${ty}) scale(${k})`}>{children}</g>
      </Ctx.Provider>
    </svg>
  );
};
