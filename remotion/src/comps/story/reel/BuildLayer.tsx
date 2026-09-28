import React from "react";
import { evolvePath } from "@remotion/paths";
import { C } from "../../../lib/theme";
import { AngleMeasure, GuideCircle, GuideLine, TOOL } from "../kit/construction";
import { SNAP } from "../kit/easing";
import { GEO, K, LETTERS, M, type Pt } from "../kit/geometry";
import { LogoRig } from "../kit/LogoRig";
import { LOGO } from "../kit/logo-data.gen";
import { LogoStage, camToWorld, useNs, useStage, type Cam } from "../kit/stage";
import { FLOAT, OX, OY, type BuildState, type Pen, type SketchDraw } from "./build";
export { OX, OY };
import {
  ANCHOR_PTS,
  ANCHOR_S,
  CLEAN_SPLIT,
  CONTACT_L,
  CONTACT_R,
  FLAME_HALF_A,
  FLAME_HALF_B,
  HANDLE_ORDER,
  HANDLE_PAIRS,
  HIGHLIGHT_TOP,
  KERN_Y,
  LETTER_PROFILES,
  NIB_PX,
  PREVIEW_FLAME,
  PREVIEW_LEN,
  PREVIEW_MASCOT,
  PULL_CTRL,
  SP_C,
  STROKE,
  partialD,
  pulledCtrl,
  taperedD,
  withPull,
} from "./geo";

const INK = C.ink;

// ------------------------------------------------------------------ grid (world units, screen-feathered y520–1300)
const Grid: React.FC<{ op: number; cam: Cam; w: number; h: number; dy?: number }> = ({ op, cam, w, h, dy = 0 }) => {
  const ns = useNs();
  if (op <= 0) return null;
  const k = cam.k;
  // inverse camera: screen → logo units
  const ux = (x: number) => camToWorld(cam, [x, 0])[0];
  const uy = (y: number) => camToWorld(cam, [0, y - dy])[1];
  const y0 = uy(520);
  const y1 = uy(1300);
  const step = 8;
  return (
    <g opacity={op}>
      <defs>
        <pattern id={ns.id("p")} patternUnits="userSpaceOnUse" x={-step / 2} y={-step / 2} width={step} height={step}>
          <circle cx={step / 2} cy={step / 2} r={1.6 / k} fill={INK} fillOpacity={0.14} />
        </pattern>
        <linearGradient id={ns.id("f")} gradientUnits="userSpaceOnUse" x1={0} y1={y0} x2={0} y2={y1}>
          <stop offset={0} stopColor="#000" />
          <stop offset={0.16} stopColor="#fff" />
          <stop offset={0.84} stopColor="#fff" />
          <stop offset={1} stopColor="#000" />
        </linearGradient>
        <mask id={ns.id("m")} maskUnits="userSpaceOnUse" x={ux(0)} y={y0} width={ux(w) - ux(0)} height={y1 - y0}>
          <rect x={ux(0)} y={y0} width={ux(w) - ux(0)} height={y1 - y0} fill={ns.url("f")} />
        </mask>
      </defs>
      <rect x={ux(0)} y={y0} width={ux(w) - ux(0)} height={Math.min(y1, uy(h)) - y0} fill={ns.url("p")} mask={ns.url("m")} />
    </g>
  );
};

// ------------------------------------------------------------------ 05 type metrics + kerning space + landing flashes
const METRIC_YS = [M.ascender, M.xHeight, M.baseline, M.descender];
const MX0 = -14;
const MX1 = 562;
const Metrics: React.FC<{ lines: number[]; overshoot: number }> = ({ lines, overshoot }) => {
  const { k } = useStage();
  return (
    <g>
      {overshoot > 0 ? (
        <rect x={MX0} y={M.baseline} width={(MX1 - MX0) * overshoot} height={M.overshoot - M.baseline} fill={C.blush} fillOpacity={0.7} />
      ) : null}
      {lines.map((p, i) =>
        p > 0 ? (
          <line key={i} x1={MX0} y1={METRIC_YS[i]} x2={MX0 + (MX1 - MX0) * p} y2={METRIC_YS[i]} stroke={INK} strokeOpacity={0.2} strokeWidth={TOOL.hair / k} />
        ) : null,
      )}
    </g>
  );
};

/** The real negative space between each pair of letters (x-height band), at the letters' current offsets. */
const KernSpace: React.FC<{ op: number; dx: number[] }> = ({ op, dx }) => {
  if (op <= 0) return null;
  // each pair's space is read like an optical-kerning tool does: at most DEPTH u into either letter's side
  const DEPTH = 9;
  const pairs = [0, 1, 2, 3, 4, 5].map((i) => {
    const a = LETTER_PROFILES[i];
    const b = LETTER_PROFILES[i + 1];
    const aEdge = Math.max(...a.maxX) - DEPTH;
    const bEdge = Math.min(...b.minX) + DEPTH;
    const rx = (j: number) => Math.max(a.maxX[j], aEdge) + dx[i];
    const lx = (j: number) => Math.max(Math.min(b.minX[j], bEdge) + dx[i + 1], rx(j));
    const right = KERN_Y.map((y, j) => [rx(j), y] as Pt);
    const left = KERN_Y.map((y, j) => [lx(j), y] as Pt).reverse();
    const pts = [...right, ...left];
    return `M${pts.map((p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join("L")}Z`;
  });
  return (
    <g fill={C.mint} fillOpacity={0.7 * op}>
      {pairs.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </g>
  );
};

const Flashes: React.FC<{ on: number[]; dx: number[] }> = ({ on, dx }) => {
  const { k } = useStage();
  return (
    <g stroke={INK} strokeWidth={TOOL.hair / k} strokeLinecap="round">
      {on.map((v, i) =>
        v > 0 ? (
          <line key={i} strokeOpacity={0.8 * v} x1={LETTERS[i].bbox[0] + dx[i] - 3} y1={M.baseline} x2={LETTERS[i].bbox[2] + dx[i] + 3} y2={M.baseline} />
        ) : null,
      )}
    </g>
  );
};

// ------------------------------------------------------------------ 03 anchors, handles, path hairline
const AnchorSquares: React.FC<{ t: number; op: number[] }> = ({ t, op }) => {
  const { k } = useStage();
  if (t < 0) return null;
  const s = TOOL.anchor / k;
  return (
    <g>
      {ANCHOR_PTS.map(([x, y], i) => {
        const t0 = i / 3;
        if (t < t0 || op[i] <= 0) return null;
        const q = SNAP(Math.min(1, (t - t0) / 4));
        const ang = ((Math.sin(i * 127.1 + 311.7) * 43758.5453) % 1) * Math.PI * 2;
        const ox = Math.cos(ang) * 4 * (1 - q);
        const oy = Math.sin(ang) * 4 * (1 - q);
        const sz = s * (0.85 + 0.15 * op[i]);
        return (
          <rect
            key={i}
            x={x + ox - sz / 2}
            y={y + oy - sz / 2}
            width={sz}
            height={sz}
            fill="#fff"
            stroke={INK}
            strokeWidth={TOOL.hair / k}
            opacity={Math.min(1, 0.4 + q) * op[i]}
          />
        );
      })}
    </g>
  );
};

const HandleLines: React.FC<{ progress: number; op: number[]; pull: number }> = ({ progress, op, pull }) => {
  const { k } = useStage();
  if (progress <= 0) return null;
  const n = HANDLE_PAIRS.length;
  const pc = pulledCtrl(pull);
  return (
    <g stroke={C.lilacD} strokeWidth={TOOL.hair / k} strokeLinecap="round">
      {HANDLE_PAIRS.map(([a, c0], i) => {
        const o = op[HANDLE_ORDER[i]];
        if (o <= 0) return null;
        const start = (i / Math.max(1, n - 1)) * 0.35;
        const q = SNAP(Math.max(0, Math.min(1, (progress - start) / 0.65)));
        if (q <= 0) return null;
        const pulled = c0[0] === PULL_CTRL[0] && c0[1] === PULL_CTRL[1];
        const c = pulled ? pc : c0;
        const x = a[0] + (c[0] - a[0]) * q;
        const y = a[1] + (c[1] - a[1]) * q;
        return (
          <g key={i} opacity={o}>
            <line x1={a[0]} y1={a[1]} x2={x} y2={y} />
            <circle cx={x} cy={y} r={(pulled && pull > 0.01 ? 6.5 : TOOL.handleEnd / 2) / k} fill={C.lilacD} stroke="none" />
          </g>
        );
      })}
    </g>
  );
};

/** the vector path itself (1.5 px), drawn with the zip: its tip is always the newest anchor */
const PathHairline: React.FC<{ t: number; pull: number; op: number }> = ({ t, pull, op }) => {
  const { k } = useStage();
  if (t <= 0 || op <= 0) return null;
  const z = t * 3; // anchors revealed
  const along = (i0: number, i1: number, total: number, closeAt: number) => {
    if (z <= i0) return 0;
    if (z >= closeAt) return total;
    const i = Math.min(i1 - 1, Math.floor(z));
    const f = z - i;
    const s0 = ANCHOR_S[i];
    const s1 = i + 1 <= i1 - 1 ? ANCHOR_S[i + 1] : total;
    return s0 + (s1 - s0) * SNAP(Math.min(1, f));
  };
  const sf = along(0, 12, PREVIEW_LEN.flame, 12);
  const sm = along(12, 61, PREVIEW_LEN.mascot, 61.5);
  const dm = withPull(PREVIEW_MASCOT, pull);
  const w = TOOL.hair / k;
  return (
    <g fill="none" stroke={INK} strokeOpacity={0.62 * op} strokeWidth={w} strokeLinejoin="round">
      {sf > 0 ? <path d={PREVIEW_FLAME} strokeDasharray={`${sf} ${PREVIEW_LEN.flame + 10}`} /> : null}
      {sm > 0 ? <path d={dm} strokeDasharray={`${sm} ${PREVIEW_LEN.mascot + 40}`} /> : null}
    </g>
  );
};

// ------------------------------------------------------------------ eraser trail: the clean line dissolves what it has passed
const TrailMask: React.FC<{ id: string; u: number }> = ({ id, u }) => {
  const ns = useNs();
  const box = { x: 100, y: -40, width: 260, height: 300 };
  const run = (d: string, p: number) => (p > 0 ? <path d={d} fill="none" stroke="#000" strokeWidth={26} strokeLinecap="round" {...evolvePath(Math.min(1, p), d)} /> : null);
  // each side = flame half, then its route (the same split as the clean line)
  const side = (split: number) => ({ f: Math.min(1, u / split), r: Math.max(0, (u - split) / (1 - split)) });
  const A = side(CLEAN_SPLIT.a);
  const B = side(CLEAN_SPLIT.b);
  return (
    <mask id={id} maskUnits="userSpaceOnUse" {...box}>
      <filter id={ns.id("tb")} x={-100} y={-100} width={600} height={500} filterUnits="userSpaceOnUse">
        <feGaussianBlur stdDeviation={5} />
      </filter>
      <rect {...box} fill="#fff" />
      <g filter={ns.url("tb")}>
        {run(FLAME_HALF_A, A.f)}
        {run(FLAME_HALF_B, B.f)}
        {run(GEO.routeA, A.r)}
        {run(GEO.routeB, B.r)}
      </g>
    </mask>
  );
};

// ------------------------------------------------------------------ the flame during the build (outline band, then ignition)
const BuildFlame: React.FC<{ outline: number; fill: number }> = ({ outline, fill }) => {
  const ns = useNs();
  if (outline <= 0 && fill <= 0) return null;
  const [bx, by] = GEO.flameBase;
  return (
    <g>
      <defs>
        <mask id={ns.id("fo")} maskUnits="userSpaceOnUse" x={150} y={-20} width={70} height={90}>
          {outline > 0 ? (
            <>
              <path d={FLAME_HALF_A} fill="none" stroke="#fff" strokeWidth={12} strokeLinecap="round" {...evolvePath(Math.min(1, outline), FLAME_HALF_A)} />
              <path d={FLAME_HALF_B} fill="none" stroke="#fff" strokeWidth={12} strokeLinecap="round" {...evolvePath(Math.min(1, outline), FLAME_HALF_B)} />
            </>
          ) : null}
        </mask>
        <clipPath id={ns.id("fc")} clipPathUnits="userSpaceOnUse">
          <rect x={bx - 40} y={by + 1.5 - (by + 3) * fill} width={80} height={(by + 3) * fill} />
        </clipPath>
      </defs>
      {outline > 0 ? <path d={LOGO.flame.outline} fill={INK} mask={outline < 1 ? ns.url("fo") : undefined} /> : null}
      {fill > 0 ? (
        <g clipPath={ns.url("fc")}>
          <path d={LOGO.flame.silhouette} fill={INK} />
          <g dangerouslySetInnerHTML={{ __html: ns.markup(LOGO.flame.fills) }} />
        </g>
      ) : null}
    </g>
  );
};

// ------------------------------------------------------------------ small effects
const Glint: React.FC<{ t: number }> = ({ t }) => {
  if (t < 0 || t > 1) return null;
  const s = t < 0.35 ? SNAP(t / 0.35) : 1 - SNAP((t - 0.35) / 0.65);
  const [x, y] = HIGHLIGHT_TOP;
  return (
    <g opacity={0.95}>
      <path
        d={LOGO.sparkle.d}
        fill="#fff"
        transform={`translate(${x + 1.5} ${y - 1}) rotate(${45 * t}) scale(${0.24 * s}) translate(${-SP_C[0]} ${-SP_C[1]})`}
      />
    </g>
  );
};

const ContactArcs: React.FC<{ t: number }> = ({ t }) => {
  const { k } = useStage();
  if (t < 0 || t > 8) return null;
  const r = 40 * SNAP(t / 8);
  if (r < 0.5) return null;
  const arc = (c: Pt, a0: number, a1: number) => {
    const p0 = [c[0] + r * Math.cos((a0 * Math.PI) / 180), c[1] + r * Math.sin((a0 * Math.PI) / 180)];
    const p1 = [c[0] + r * Math.cos((a1 * Math.PI) / 180), c[1] + r * Math.sin((a1 * Math.PI) / 180)];
    return `M${p0[0]} ${p0[1]}A${r} ${r} 0 0 1 ${p1[0]} ${p1[1]}`;
  };
  return (
    <g fill="none" stroke={INK} strokeOpacity={0.25 * (1 - t / 8)} strokeWidth={TOOL.hair / k} strokeLinecap="round">
      <path d={arc(CONTACT_L, 196, 238)} />
      <path d={arc(CONTACT_R, -58, -16)} />
    </g>
  );
};

// ------------------------------------------------------------------ the pen (✦ = sparkle.svg at exactly the logo ✦'s on-screen size)
export const PenMark: React.FC<{ pen: Pen }> = ({ pen }) => {
  const ns = useNs();
  const { k } = useStage();
  // screen-constant size: the ✦ is drawn at 1.4 px/u whatever the camera does
  const f = K / k;
  let cx = pen.x;
  let cy = pen.y;
  if (pen.pivot === "nib" && pen.s !== 1) {
    // scale about the nib: the nib stays on the paper
    const nx = pen.x + (NIB_PX[0] * 1) / k;
    const ny = pen.y + (NIB_PX[1] * 1) / k;
    cx = nx - (NIB_PX[0] * pen.s) / k;
    cy = ny - (NIB_PX[1] * pen.s) / k;
  }
  const T = `translate(${cx} ${cy}) rotate(${pen.rot}) scale(${pen.s * f}) translate(${-SP_C[0]} ${-SP_C[1]})`;
  const sh = Math.max(0, pen.shadow);
  const h = Math.max(0, pen.h);
  const halo = Math.max(0, pen.halo ?? 0);
  return (
    <g>
      {halo > 0 ? (
        <g opacity={halo}>
          <defs>
            <radialGradient id={ns.id("halo")} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={(46 * pen.s) / k}>
              <stop offset={0} stopColor={C.sky} stopOpacity={0.5} />
              <stop offset={0.45} stopColor={C.mint} stopOpacity={0.22} />
              <stop offset={0.75} stopColor={C.lilac} stopOpacity={0.08} />
              <stop offset={1} stopColor={C.lilac} stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle cx={cx} cy={cy} r={(46 * pen.s) / k} fill={ns.url("halo")} />
        </g>
      ) : null}
      {sh > 0 ? (
        <g filter={ns.url("sh")} opacity={sh * (0.16 - 0.004 * Math.min(20, h))}>
          <defs>
            <filter id={ns.id("sh")} x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation={(1.2 + 0.45 * h) / k} />
            </filter>
          </defs>
          <path d={LOGO.sparkle.d} fill={INK} transform={`translate(${(0.35 * h) / k} ${(0.75 * h) / k}) ${T}`} />
        </g>
      ) : null}
      <g transform={T} dangerouslySetInnerHTML={{ __html: ns.markup(LOGO.sparkle.fills) }} />
    </g>
  );
};

// ------------------------------------------------------------------ the whole build frame
export const BuildLayer: React.FC<{
  st: BuildState;
  width: number;
  height: number;
  pen?: Pen | null;
  /** cover only: draw the construction over the (coloured) rig instead of under it */
  overlay?: boolean;
  /** cover only: extra px offset of the whole drawing */
  dy?: number;
  /** recent pen centres (world, oldest → newest): a speed streak behind fast flicks */
  penTrail?: Pt[] | null;
}> = ({ st, width, height, pen, overlay = false, dy = 0, penTrail = null }) => {
  const ns = useNs();
  const g = st.guides;
  const floatT = `translate(0 ${FLOAT})`;
  const scaffold = st.b < 172;
  const eyeL = { cx: GEO.eyeL.cx, cy: GEO.eyeL.cy, r: GEO.eyeL.ry };
  const origin = GEO.eyeLine.l;
  const labelAt: Pt = [origin[0] + 382 / st.k, origin[1] - 58 / st.k];
  const scaffoldGroup = scaffold ? (
    <g transform={floatT}>
      <defs>
        <TrailMask id={ns.id("trail")} u={st.trail} />
      </defs>
      <g mask={st.trail > 0 ? ns.url("trail") : undefined}>
        {st.sketchOp > 0 ? (
          <g opacity={st.sketchOp}>
            <SketchLayer sketch={st.sketch} />
          </g>
        ) : null}
      </g>
      {/* 02 construction: circles fitted to the lobes, tangents, flame teardrop, eyes, the 24° */}
      {GEO.lobes.map((c, i) => (
        <GuideCircle key={i} c={c} dot={g.lobes[i].dot} progress={g.lobes[i].ring} opacity={g.lobes[i].op} />
      ))}
      <GuideCircle c={GEO.inscribed} dot={g.inscribed.dot} progress={g.inscribed.ring} opacity={g.inscribed.op} />
      {GEO.tangents.map(([a, b], i) => (
        <GuideLine key={i} a={a} b={b} progress={g.tangents[i].p} opacity={g.tangents[i].op} />
      ))}
      <GuideCircle c={GEO.flameCircle} dot={g.flameCircle.dot} progress={g.flameCircle.ring} opacity={g.flameCircle.op} />
      {GEO.flameTangents.map(([a, b], i) => (
        <GuideLine key={i} a={a} b={b} progress={g.flameTangents[i]} opacity={g.flameCircle.op} />
      ))}
      <GuideCircle c={eyeL} dot={0} progress={g.eyes[0]} opacity={g.eyesOp} />
      <GuideCircle c={GEO.eyeR} dot={0} progress={g.eyes[1]} opacity={g.eyesOp} />
      <AngleMeasure
        origin={origin}
        deg={GEO.eyeLine.deg}
        radiusPx={300}
        reachPx={342}
        progress={g.angle}
        label="24°"
        labelAt={labelAt}
        opacity={g.angleOp}
      />
      <g mask={st.trail > 0 ? ns.url("trail") : undefined}>
        <PathHairline t={st.preview} pull={st.pull} op={st.previewOp} />
      </g>
    </g>
  ) : null;
  return (
    <LogoStage width={width} height={height} ox={OX} oy={OY} cam={st.cam} dy={dy}>
      <Grid op={g.grid} cam={st.cam} w={width} h={height} dy={dy} />
      <Metrics lines={g.metrics} overshoot={g.overshoot} />
      <KernSpace op={st.kern} dx={st.letterDx} />
      {overlay ? null : scaffoldGroup}
      <LogoRig theme="light" st={st.rig} />
      {overlay ? scaffoldGroup : null}
      <g transform={floatT}>
        <BuildFlame outline={st.flameOutline} fill={st.flameFill} />
      </g>
      {scaffold ? (
        <g transform={floatT}>
          <HandleLines progress={st.handles} op={st.anchorOp} pull={st.pull} />
          <AnchorSquares t={st.anchorsT} op={st.anchorOp} />
        </g>
      ) : null}
      {st.glint >= 0 ? (
        <g transform={`translate(0 ${st.rig.mascotDy ?? FLOAT})`}>
          <Glint t={st.glint} />
        </g>
      ) : null}
      <Flashes on={st.flashes} dx={st.letterDx} />
      <ContactArcs t={st.contact} />
      {pen && penTrail ? <PenStreak pts={penTrail} /> : null}
      {pen ? <PenMark pen={pen} /> : null}
    </LogoStage>
  );
};

/**
 * 01 skica: tapered graphite strokes (filled outlines, pressure 0.5 → 1.4 → 0.4 u). Volumes are light
 * (34 %), the silhouette is firm (72 %) with a lighter searching second pass; the line of action is a
 * dashed blush-d guide at 50 %.
 */
const SketchLayer: React.FC<{ sketch: SketchDraw[] }> = ({ sketch }) => (
  <g>
    {sketch.map((s) => {
      if (s.lam <= 0 || s.op <= 0) return null;
      const S = STROKE(s.id);
      if (s.kind === "action") {
        return (
          <path
            key={s.id}
            d={partialD(S.poly, s.lam)}
            fill="none"
            stroke={C.blushD}
            strokeOpacity={0.5 * s.op}
            strokeWidth={1.4 * S.weight}
            strokeLinecap="round"
            strokeDasharray="6 4.5"
          />
        );
      }
      const vol = s.kind === "volume";
      return (
        <g key={s.id} opacity={s.op < 1 ? s.op : undefined}>
          {S.second && s.lam2 > 0 ? <path d={taperedD(S.second, s.lam2, 0.55 * S.weight)} fill={INK} fillOpacity={0.24} /> : null}
          <path d={taperedD(S.poly, s.lam, S.weight)} fill={INK} fillOpacity={vol ? 0.36 : 0.74} />
        </g>
      );
    })}
  </g>
);

/** a short pastel speed streak behind the pen on fast flicks (world points, oldest → newest) */
const PenStreak: React.FC<{ pts: Pt[] }> = ({ pts }) => {
  const { k } = useStage();
  if (pts.length < 2) return null;
  const n = pts.length - 1;
  return (
    <g strokeLinecap="round">
      {pts.slice(1).map((p, i) => {
        const q = pts[i];
        const w = (i + 1) / n;
        if (Math.hypot(p[0] - q[0], p[1] - q[1]) * k < 1) return null;
        return (
          <line
            key={i}
            x1={q[0]}
            y1={q[1]}
            x2={p[0]}
            y2={p[1]}
            stroke={i % 2 ? C.sky : C.lilac}
            strokeWidth={(6 + 14 * w) / k}
            opacity={0.1 + 0.35 * w * w}
          />
        );
      })}
    </g>
  );
};
