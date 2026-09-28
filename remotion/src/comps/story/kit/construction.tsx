import React from "react";
import { evolvePath, getLength, getPointAtLength, getTangentAtLength } from "@remotion/paths";
import { C, nunito } from "../../../lib/theme";
import { SNAP, clamp, DRAW } from "./easing";
import { useNs, useStage } from "./stage";
import type { Box, Circle, Pt } from "./geometry";
import { interpolate } from "remotion";

/**
 * Construction overlays in the Figma-like style of the storyboard. Draw inside <LogoStage>.
 *
 * TOOL vs DRAWING: graphite and outlines are in logo units and scale with the camera; guides, grid,
 * anchors, handles and labels are screen-constant, the way a real design tool behaves. They are sized
 * for a phone, not a monitor: 2.75 px hairlines, 11 px anchors, 36 px labels (a 1.5 px hairline reads
 * as texture on a 6" screen). Every component is a pure function of a progress / frame input.
 */
export const TOOL = { hair: 2.75, anchor: 11, handleEnd: 7.5, label: 36 } as const;
/** construction lines: sky-d at 80 % (plain sky vanishes on paper at phone size) */
const GUIDE = C.skyD;
const GUIDE_OP = 0.8;
const HANDLE = C.lilacD; // bezier handles

const circleD = (c: Circle, startDeg = -90) => {
  const a = (startDeg * Math.PI) / 180;
  const x0 = c.cx + c.r * Math.cos(a);
  const y0 = c.cy + c.r * Math.sin(a);
  const x1 = c.cx - c.r * Math.cos(a);
  const y1 = c.cy - c.r * Math.sin(a);
  // clockwise on screen (sweep 1), two half arcs
  return `M${x0} ${y0}A${c.r} ${c.r} 0 1 1 ${x1} ${y1}A${c.r} ${c.r} 0 1 1 ${x0} ${y0}`;
};

// ------------------------------------------------------------------ grid
/** Dot grid (default 8 u, ink 6 %), feathered at the box edges; `progress` fades it in. */
export const DotGrid: React.FC<{ box: Box; step?: number; progress?: number; opacity?: number; feather?: number }> = ({
  box,
  step = 8,
  progress = 1,
  opacity = 0.06,
  feather = 60,
}) => {
  const ns = useNs();
  const { k } = useStage();
  if (progress <= 0) return null;
  const [x0, y0, x1, y1] = box;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const r = Math.max(x1 - x0, y1 - y0) / 2;
  return (
    <g opacity={progress}>
      <defs>
        <pattern id={ns.id("p")} patternUnits="userSpaceOnUse" x={0} y={0} width={step} height={step}>
          <circle cx={step / 2} cy={step / 2} r={1.1 / k} fill={C.ink} fillOpacity={opacity} />
        </pattern>
        <radialGradient id={ns.id("f")} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={r}>
          <stop offset={Math.max(0, 1 - feather / r)} stopColor="#fff" />
          <stop offset={1} stopColor="#000" />
        </radialGradient>
        <mask id={ns.id("m")} maskUnits="userSpaceOnUse" x={x0} y={y0} width={x1 - x0} height={y1 - y0}>
          <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={ns.url("f")} />
        </mask>
      </defs>
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={ns.url("p")} mask={ns.url("m")} />
    </g>
  );
};

// ------------------------------------------------------------------ circles and lines
/** A fitted construction circle: the centre dot pops (`dot` 0..1), then the ring draws on clockwise (`progress`). */
export const GuideCircle: React.FC<{ c: Circle; progress: number; dot?: number; color?: string; opacity?: number; startDeg?: number }> = ({
  c,
  progress,
  dot = 1,
  color = GUIDE,
  opacity = 1,
  startDeg = -90,
}) => {
  const { k } = useStage();
  if (opacity <= 0 || (progress <= 0 && dot <= 0)) return null;
  const d = circleD(c, startDeg);
  const op = (color === GUIDE ? GUIDE_OP : 1) * opacity;
  return (
    <g opacity={op < 1 ? op : undefined}>
      {progress > 0 ? (
        <path d={d} fill="none" stroke={color} strokeWidth={TOOL.hair / k} {...evolvePath(Math.min(1, progress), d)} />
      ) : null}
      {dot > 0 ? (
        <g transform={`translate(${c.cx} ${c.cy}) scale(${dot})`}>
          <line x1={-8 / k} y1={0} x2={8 / k} y2={0} stroke={color} strokeWidth={TOOL.hair / k} />
          <line x1={0} y1={-8 / k} x2={0} y2={8 / k} stroke={color} strokeWidth={TOOL.hair / k} />
          <circle r={3 / k} fill={color} />
        </g>
      ) : null}
    </g>
  );
};

/** A straight guide from a to b drawn on by `progress` (optionally dashed, screen-constant dashes). */
export const GuideLine: React.FC<{ a: Pt; b: Pt; progress: number; color?: string; dashed?: boolean; opacity?: number; extend?: number }> = ({
  a,
  b,
  progress,
  color = GUIDE,
  dashed = false,
  opacity = 1,
  extend = 0,
}) => {
  const { k } = useStage();
  if (progress <= 0 || opacity <= 0) return null;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const L = Math.hypot(dx, dy);
  const ux = dx / L;
  const uy = dy / L;
  const ax = a[0] - ux * extend;
  const ay = a[1] - uy * extend;
  const len = (L + 2 * extend) * Math.min(1, progress);
  const op = (color === GUIDE ? GUIDE_OP : 1) * opacity;
  return (
    <line
      x1={ax}
      y1={ay}
      x2={ax + ux * len}
      y2={ay + uy * len}
      stroke={color}
      strokeWidth={TOOL.hair / k}
      strokeLinecap="round"
      strokeDasharray={dashed ? `${10 / k} ${8 / k}` : undefined}
      opacity={op < 1 ? op : undefined}
    />
  );
};

// ------------------------------------------------------------------ bezier anchors and handles
const hash = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * Bezier anchors as white 6 px squares with a 1.5 px ink stroke. They zip in in path order at `rate`
 * anchors per frame (`t` = frames since the first), each appearing 4 u off target and snapping home in
 * `snap` frames (SNAP).
 */
export const Anchors: React.FC<{ pts: readonly Pt[]; t: number; rate?: number; snap?: number; offset?: number; opacity?: number }> = ({
  pts,
  t,
  rate = 3,
  snap = 4,
  offset = 4,
  opacity = 1,
}) => {
  const { k } = useStage();
  if (t < 0 || opacity <= 0) return null;
  const s = TOOL.anchor / k;
  return (
    <g opacity={opacity < 1 ? opacity : undefined}>
      {pts.map(([x, y], i) => {
        const t0 = i / rate;
        if (t < t0) return null;
        const q = SNAP(Math.min(1, (t - t0) / snap));
        const ang = hash(i) * Math.PI * 2;
        const ox = Math.cos(ang) * offset * (1 - q);
        const oy = Math.sin(ang) * offset * (1 - q);
        return (
          <rect
            key={i}
            x={x + ox - s / 2}
            y={y + oy - s / 2}
            width={s}
            height={s}
            fill="#fff"
            stroke={C.ink}
            strokeWidth={TOOL.hair / k}
            opacity={Math.min(1, 0.4 + q)}
          />
        );
      })}
    </g>
  );
};

/** Bezier handles (anchor → control point) in lilac, growing to their true length with `progress`. */
export const Handles: React.FC<{ pairs: readonly (readonly [Pt, Pt])[]; progress: number; stagger?: number; opacity?: number }> = ({
  pairs,
  progress,
  stagger = 0.35,
  opacity = 1,
}) => {
  const { k } = useStage();
  if (progress <= 0 || opacity <= 0) return null;
  const n = pairs.length;
  return (
    <g opacity={opacity < 1 ? opacity : undefined} stroke={HANDLE} strokeWidth={TOOL.hair / k} strokeLinecap="round">
      {pairs.map(([a, c], i) => {
        const start = (i / Math.max(1, n - 1)) * stagger;
        const q = SNAP(Math.max(0, Math.min(1, (progress - start) / (1 - stagger))));
        if (q <= 0) return null;
        const x = a[0] + (c[0] - a[0]) * q;
        const y = a[1] + (c[1] - a[1]) * q;
        return (
          <g key={i}>
            <line x1={a[0]} y1={a[1]} x2={x} y2={y} />
            <circle cx={x} cy={y} r={TOOL.handleEnd / 2 / k} fill={HANDLE} stroke="none" />
          </g>
        );
      })}
    </g>
  );
};

// ------------------------------------------------------------------ measurement
/**
 * Angle measurement: a dashed horizontal and a dashed line at `deg` through `origin`, an arc of
 * `radiusPx` (screen) between them and a solid-ink label. Negative deg = rising to the right.
 */
export const AngleMeasure: React.FC<{
  origin: Pt;
  deg: number;
  radiusPx: number;
  progress: number;
  label: string;
  /** label position in logo units (default: just outside the arc's middle) */
  labelAt?: Pt;
  reachPx?: number;
  opacity?: number;
}> = ({ origin, deg, radiusPx, progress, label, labelAt, reachPx, opacity = 1 }) => {
  const { k } = useStage();
  if (progress <= 0 || opacity <= 0) return null;
  const R = radiusPx / k;
  const reach = (reachPx ?? radiusPx * 1.35) / k;
  const a = (deg * Math.PI) / 180;
  const [ox, oy] = origin;
  const lines = interpolate(progress, [0, 0.55], [0, 1], { ...clamp, easing: DRAW });
  const arc = interpolate(progress, [0.35, 0.85], [0, 1], { ...clamp, easing: DRAW });
  const txt = interpolate(progress, [0.7, 1], [0, 1], { ...clamp, easing: SNAP });
  const arcD = `M${ox + R} ${oy}A${R} ${R} 0 0 ${deg < 0 ? 0 : 1} ${ox + R * Math.cos(a)} ${oy + R * Math.sin(a)}`;
  const mid = a / 2;
  const [lx, ly] = labelAt ?? [ox + (R + 16 / k) * Math.cos(mid), oy + (R + 16 / k) * Math.sin(mid)];
  return (
    <g opacity={opacity < 1 ? opacity : undefined}>
      <g stroke={C.ink} strokeOpacity={0.4} strokeWidth={TOOL.hair / k} strokeDasharray={`${10 / k} ${8 / k}`}>
        <line x1={ox} y1={oy} x2={ox + reach * lines} y2={oy} />
        <line x1={ox} y1={oy} x2={ox + reach * lines * Math.cos(a)} y2={oy + reach * lines * Math.sin(a)} />
      </g>
      {arc > 0 ? <path d={arcD} fill="none" stroke={C.ink} strokeWidth={TOOL.hair / k} {...evolvePath(arc, arcD)} /> : null}
      {txt > 0 ? (
        <text
          x={lx}
          y={ly + (1 - txt) * (8 / k)}
          fontFamily={nunito}
          fontWeight={800}
          fontSize={TOOL.label / k}
          fill={C.ink}
          opacity={txt}
          dominantBaseline="middle"
        >
          {label}
        </text>
      ) : null}
    </g>
  );
};

/**
 * Type metric hairlines (ink 20 %) drawn left → right with a 2 f stagger feel (`progress` 0..1), plus the
 * blush strip that marks the round overshoot below the baseline.
 */
export const TypeMetrics: React.FC<{
  ys: readonly number[];
  x0: number;
  x1: number;
  progress: number;
  overshoot?: readonly [number, number];
  opacity?: number;
}> = ({ ys, x0, x1, progress, overshoot, opacity = 1 }) => {
  const { k } = useStage();
  if (progress <= 0 || opacity <= 0) return null;
  const n = ys.length;
  return (
    <g opacity={opacity < 1 ? opacity : undefined}>
      {overshoot ? (
        <rect
          x={x0}
          y={overshoot[0]}
          width={(x1 - x0) * DRAW(Math.min(1, progress))}
          height={overshoot[1] - overshoot[0]}
          fill={C.blush}
          fillOpacity={0.55}
        />
      ) : null}
      {ys.map((y, i) => {
        const q = DRAW(Math.max(0, Math.min(1, (progress - (i / n) * 0.3) / 0.7)));
        return q > 0 ? (
          <line key={i} x1={x0} y1={y} x2={x0 + (x1 - x0) * q} y2={y} stroke={C.ink} strokeOpacity={0.2} strokeWidth={TOOL.hair / k} />
        ) : null;
      })}
    </g>
  );
};

// ------------------------------------------------------------------ graphite sketch
/** mulberry32: fixed seeds, identical strokes on every render */
const rng = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** Catmull-Rom through points → cubic bezier path. */
const smooth = (p: Pt[]) => {
  let d = `M${p[0][0].toFixed(2)} ${p[0][1].toFixed(2)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[Math.max(0, i - 1)];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[Math.min(p.length - 1, i + 2)];
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(2)} ${c1[1].toFixed(2)} ${c2[0].toFixed(2)} ${c2[1].toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return d;
};

const ZERO = { x: 0, y: 0 };
const pointAt = (d: string, t: number) => getPointAtLength(d, t) ?? ZERO;
const tangentAt = (d: string, t: number) => getTangentAtLength(d, t) ?? ZERO;

const SKETCH_CACHE = new Map<string, string[]>();
/**
 * Hand-drawn graphite passes of a real outline: the true path resampled every `step` u, jittered
 * 1.2–2.4 u along its normal with a fixed seed, ends overshooting 4 u along the tangent.
 */
export const sketchPasses = (d: string, seed: number, passes = 3, step = 4, jitter: readonly [number, number] = [1.2, 2.4]) => {
  const key = `${seed}|${passes}|${step}|${d}`;
  const hit = SKETCH_CACHE.get(key);
  if (hit) return hit;
  const L = getLength(d);
  const out: string[] = [];
  for (let j = 0; j < passes; j++) {
    const r = rng(seed * 7919 + j * 104729);
    const n = Math.max(2, Math.round(L / step));
    const pts: Pt[] = [];
    // each pass drifts with a slow wave plus a little per-point noise: a searching hand, not a zig-zag
    const ph = r() * Math.PI * 2;
    const wav = 2 + r() * 3;
    for (let i = 0; i <= n; i++) {
      const t = (L * i) / n;
      const p = pointAt(d, t);
      const v = tangentAt(d, t);
      const amp = jitter[0] + (jitter[1] - jitter[0]) * r();
      const off = amp * (0.65 * Math.sin(ph + (wav * Math.PI * 2 * i) / n) + 0.35 * (r() * 2 - 1));
      pts.push([p.x - v.y * off, p.y + v.x * off]);
    }
    const t0 = tangentAt(d, 0);
    const t1 = tangentAt(d, L);
    pts.unshift([pts[0][0] - t0.x * 4, pts[0][1] - t0.y * 4]);
    const last = pts[pts.length - 1];
    pts.push([last[0] + t1.x * 4, last[1] + t1.y * 4]);
    out.push(smooth(pts));
  }
  SKETCH_CACHE.set(key, out);
  return out;
};

/** Graphite sketch of `d`: three passes (1.1 / 0.8 / 0.6 u, ink 55 / 35 / 25 %) drawn on by `progress`. */
export const SketchStroke: React.FC<{ d: string; seed: number; progress: number; opacity?: number; passOffset?: number }> = ({
  d,
  seed,
  progress,
  opacity = 1,
  passOffset = 0.18,
}) => {
  if (progress <= 0 || opacity <= 0) return null;
  const passes = sketchPasses(d, seed);
  const W = [1.1, 0.8, 0.6];
  const O = [0.55, 0.35, 0.25];
  return (
    <g opacity={opacity < 1 ? opacity : undefined} fill="none" stroke={C.ink} strokeLinecap="round" strokeLinejoin="round">
      {passes.map((pd, j) => {
        const q = Math.max(0, Math.min(1, (progress - j * passOffset) / (1 - 2 * passOffset)));
        return q > 0 ? <path key={j} d={pd} strokeWidth={W[j]} strokeOpacity={O[j]} {...evolvePath(q, pd)} /> : null;
      })}
    </g>
  );
};

/** Draw any outline on with evolvePath (e.g. a letter's contour, the flame outline) at a given width. */
export const OutlineDraw: React.FC<{ d: string; progress: number; width?: number; color?: string; screenConstant?: boolean }> = ({
  d,
  progress,
  width = 1.5,
  color = C.ink,
  screenConstant = true,
}) => {
  const { k } = useStage();
  if (progress <= 0) return null;
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={screenConstant ? width / k : width}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...evolvePath(Math.min(1, progress), d)}
    />
  );
};
