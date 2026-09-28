import React, { useLayoutEffect, useRef } from "react";
import { getLength, getPointAtLength } from "@remotion/paths";
import { interpolate, useVideoConfig } from "remotion";
import { C } from "../../../lib/theme";
import { LOGO } from "./logo-data.gen";
import { GEO, type Pt } from "./geometry";
import type { Theme } from "./LogoRig";
import { useNs, useStage } from "./stage";
import { SNAP, SWING as SWING_, clamp } from "./easing";

/**
 * Light effects that travel over the logo. All geometry in logo units (draw inside <LogoStage>).
 * Light theme: ink cores with pastel halos (never a white glow on paper).
 * Dark theme: mist cores with holo halos.
 */

const [SCX, SCY] = GEO.sparkleCentre;
const SPARKLE_D = LOGO.sparkle.d;

// ------------------------------------------------------------------ routes
const ROUTE_LEN: Record<string, number> = {};
const lenOf = (d: string) => (ROUTE_LEN[d] ??= getLength(d));
export type RouteId = "A" | "B";
export const routeD = (r: RouteId, inset = true) =>
  r === "A" ? (inset ? GEO.routeAIn : GEO.routeA) : inset ? GEO.routeBIn : GEO.routeB;
/** Point on a spark route at progress 0..1 (inset = middle of the outline band). */
export const routePoint = (r: RouteId, p: number, inset = true): Pt => {
  const d = routeD(r, inset);
  const L = lenOf(d);
  const q = getPointAtLength(d, Math.max(0, Math.min(1, p)) * L);
  return q ? [q.x, q.y] : [0, 0];
};

// ------------------------------------------------------------------ spark head
/**
 * The spark: a core, a halo and a tiny ✦ glint (the logo's own sparkle geometry, uniformly scaled).
 * `glint` is the glint scale relative to the logo ✦ (0.16 ≈ 7 u); `energy` scales halo + brightness.
 */
export const SparkHead: React.FC<{
  x: number;
  y: number;
  theme: Theme;
  energy?: number;
  glint?: number;
  rot?: number;
  opacity?: number;
}> = ({ x, y, theme, energy = 1, glint = 0.16, rot = 0, opacity = 1 }) => {
  const ns = useNs();
  if (opacity <= 0) return null;
  const dark = theme === "dark";
  const halo = 7 * Math.sqrt(Math.max(0.05, energy));
  return (
    <g opacity={opacity < 1 ? opacity : undefined}>
      <defs>
        <radialGradient id={ns.id("halo")} gradientUnits="userSpaceOnUse" cx={x} cy={y} r={halo}>
          {dark ? (
            <>
              <stop offset={0} stopColor={C.mist} stopOpacity={Math.min(1, 0.95 * energy)} />
              <stop offset={0.28} stopColor={C.sky} stopOpacity={Math.min(1, 0.55 * energy)} />
              <stop offset={0.62} stopColor={C.lilac} stopOpacity={Math.min(1, 0.22 * energy)} />
              <stop offset={1} stopColor={C.lilac} stopOpacity={0} />
            </>
          ) : (
            <>
              <stop offset={0} stopColor={C.sky} stopOpacity={Math.min(1, 0.9 * energy)} />
              <stop offset={0.4} stopColor={C.mint} stopOpacity={Math.min(1, 0.5 * energy)} />
              <stop offset={0.75} stopColor={C.lilac} stopOpacity={Math.min(1, 0.18 * energy)} />
              <stop offset={1} stopColor={C.lilac} stopOpacity={0} />
            </>
          )}
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={halo} fill={ns.url("halo")} />
      {glint > 0 ? (
        <path
          d={SPARKLE_D}
          transform={`translate(${x} ${y}) rotate(${rot}) scale(${glint}) translate(${-SCX} ${-SCY})`}
          fill={dark ? C.mist : C.ink}
        />
      ) : null}
      <circle cx={x} cy={y} r={0.9 + 0.35 * Math.min(2, energy)} fill={dark ? "#fff" : C.ink} />
    </g>
  );
};

// ------------------------------------------------------------------ comet tail
/**
 * Comet tail along a spark route between progress `from` (older) and `to` (head), drawn as stacked
 * dash segments that brighten toward the head. Pass `from` = the head's progress 10 frames ago.
 */
export const Comet: React.FC<{ route: RouteId; from: number; to: number; theme: Theme; opacity?: number }> = ({
  route,
  from,
  to,
  theme,
  opacity = 1,
}) => {
  const ns = useNs();
  const d = routeD(route, true);
  const L = lenOf(d);
  const a = Math.max(0, from) * L;
  const b = Math.min(1, to) * L;
  if (b - a < 0.2 || opacity <= 0) return null;
  const dark = theme === "dark";
  const N = 6;
  const segs = Array.from({ length: N }, (_, i) => {
    const s0 = a + ((b - a) * i) / N;
    return { s0, len: b - s0, w: i / (N - 1) };
  });
  return (
    <g opacity={opacity < 1 ? opacity : undefined}>
      <defs>
        <filter id={ns.id("soft")} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={dark ? 1.6 : 1.3} />
        </filter>
      </defs>
      <g filter={ns.url("soft")}>
        {segs.map(({ s0, len, w }, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={dark ? (i % 2 ? C.sky : C.lilac) : i % 2 ? C.sky : C.mint}
            strokeWidth={dark ? 4.2 : 4.6}
            strokeLinecap="round"
            strokeDasharray={`${len} ${L + 20}`}
            strokeDashoffset={-s0}
            opacity={0.1 + 0.16 * w}
          />
        ))}
      </g>
      {dark
        ? segs.map(({ s0, len, w }, i) => (
            <path
              key={`c${i}`}
              d={d}
              fill="none"
              stroke={C.mist}
              strokeWidth={0.5 + 0.7 * w}
              strokeLinecap="round"
              strokeDasharray={`${len} ${L + 20}`}
              strokeDashoffset={-s0}
              opacity={0.12 + 0.2 * w}
            />
          ))
        : null}
    </g>
  );
};

// ------------------------------------------------------------------ dark hairline in the knocked-out band
/** Dark: a holo hairline riding the middle of the (knocked-out) outline band. */
export const BandHairline: React.FC<{ a: number; b: number; opacity?: number; width?: number }> = ({ a, b, opacity = 1, width = 0.85 }) => {
  const ns = useNs();
  if (opacity <= 0 || (a <= 0 && b <= 0)) return null;
  const seg = (r: RouteId, p: number) => {
    if (p <= 0) return null;
    const d = routeD(r, true);
    const L = lenOf(d);
    return (
      <path
        d={d}
        fill="none"
        stroke={ns.url("holo")}
        strokeWidth={width}
        strokeLinecap="round"
        strokeDasharray={`${Math.min(1, p) * L} ${L + 20}`}
      />
    );
  };
  return (
    <g opacity={opacity < 1 ? opacity : undefined}>
      <defs>
        <linearGradient id={ns.id("holo")} gradientUnits="userSpaceOnUse" x1={160} y1={200} x2={290} y2={60}>
          <stop offset={0} stopColor={C.mint} />
          <stop offset={0.5} stopColor={C.sky} />
          <stop offset={1} stopColor={C.lilac} />
        </linearGradient>
      </defs>
      {seg("A", a)}
      {seg("B", b)}
    </g>
  );
};

// ------------------------------------------------------------------ strike: micro-sparks
/**
 * Six pastel micro-sparks bursting radially from (x, y); `t` = frames since the strike (0..12).
 * Each is a short streak that flies out on SNAP and shrinks to nothing (its tail catches up).
 */
export const MicroBurst: React.FC<{ x: number; y: number; t: number; theme: Theme; reach?: number; rot?: number; width?: number }> = ({
  x,
  y,
  t,
  theme,
  reach = 22,
  rot = -60,
  width = 1.4,
}) => {
  if (t < 0 || t >= 12) return null;
  const u = t / 12;
  const cols = theme === "dark" ? [C.mint, C.sky, C.lilac, C.blush, C.mint, C.lilac] : [C.mintD, C.skyD, C.lilacD, C.blushD, C.mintD, C.lilacD];
  return (
    <g strokeLinecap="round">
      {cols.map((c, i) => {
        const k = i % 2 ? 0.72 : 1; // alternate reach: less mechanical
        const ang = ((rot + i * 60 + (i % 2 ? 9 : 0)) * Math.PI) / 180;
        const head = 3 + reach * k * SNAP(Math.min(1, u * 1.2));
        const len = 7 * (reach / 22) * k * Math.pow(1 - u, 1.6);
        const tail = Math.max(3, head - len);
        const cx = Math.cos(ang);
        const cy = Math.sin(ang);
        return (
          <line
            key={i}
            x1={x + cx * tail}
            y1={y + cy * tail}
            x2={x + cx * head}
            y2={y + cy * head}
            stroke={c}
            strokeWidth={width * (1 - 0.5 * u)}
            opacity={Math.pow(1 - u, 1.2)}
          />
        );
      })}
    </g>
  );
};

// ------------------------------------------------------------------ drip + baseline light
/** A drop of light falling from `from` to `to`; `u` = eased progress 0..1, `trail` = its progress 1–2 frames ago. */
export const Drip: React.FC<{ from: Pt; to: Pt; u: number; trail: number; theme: Theme }> = ({ from, to, u, trail, theme }) => {
  if (u < 0 || u >= 1) return null;
  const y = from[1] + (to[1] - from[1]) * u;
  const yt = from[1] + (to[1] - from[1]) * Math.max(0, trail);
  const x = from[0];
  const dark = theme === "dark";
  return (
    <g>
      <line x1={x} y1={yt} x2={x} y2={y} stroke={dark ? C.mist : C.ink} strokeWidth={1.1} strokeLinecap="round" opacity={0.55} />
      <SparkHead x={x} y={y} theme={theme} energy={0.9} glint={0} />
    </g>
  );
};

/** The hairline of light that runs along the baseline and names the letters. */
export const BaselineLight: React.FC<{ y: number; xL: number; xR: number; theme: Theme; opacity?: number }> = ({
  y,
  xL,
  xR,
  theme,
  opacity = 1,
}) => {
  const ns = useNs();
  const { k } = useStage();
  if (opacity <= 0 || xR - xL < 0.1) return null;
  const dark = theme === "dark";
  return (
    <g opacity={opacity < 1 ? opacity : undefined}>
      {dark ? (
        <>
          <defs>
            <filter id={ns.id("bl")} x="-10%" y="-400%" width="120%" height="900%">
              <feGaussianBlur stdDeviation={2.2} />
            </filter>
          </defs>
          <line x1={xL} y1={y} x2={xR} y2={y} stroke={C.sky} strokeWidth={4} opacity={0.35} filter={ns.url("bl")} />
          <line x1={xL} y1={y} x2={xR} y2={y} stroke={C.mist} strokeWidth={1.5 / k} />
        </>
      ) : (
        <line x1={xL} y1={y} x2={xR} y2={y} stroke={C.ink} strokeWidth={1.5 / k} />
      )}
    </g>
  );
};

// ------------------------------------------------------------------ ✦ flash
/** Dark: a holo radial bloom around the ✦ (`t` frames since the flash, 12 f), frame-scale: 22 → 22 + r u. */
export const FlashBloom: React.FC<{ t: number; r?: number }> = ({ t, r = 260 }) => {
  const ns = useNs();
  if (t < 0 || t > 12) return null;
  const u = t / 12;
  const R = 22 + r * SNAP(Math.min(1, u * 1.6));
  return (
    <g>
      <defs>
        <radialGradient id={ns.id("b")} gradientUnits="userSpaceOnUse" cx={SCX} cy={SCY} r={R}>
          <stop offset={0} stopColor="#fff" stopOpacity={0.7} />
          <stop offset={0.14} stopColor={C.sky} stopOpacity={0.42} />
          <stop offset={0.38} stopColor={C.lilac} stopOpacity={0.14} />
          <stop offset={0.7} stopColor={C.lilac} stopOpacity={0.03} />
          <stop offset={1} stopColor={C.lilac} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={SCX} cy={SCY} r={R} fill={ns.url("b")} opacity={Math.pow(1 - u, 1.4)} />
    </g>
  );
};

/**
 * Light: two pastel holo rings leaving the ✦ (6 u → 2 u strokes), the second 2 f behind, expanding to
 * `r` (≈200 u) over 16 f on SNAP and fading on linear time (still readable when they have travelled).
 */
export const FlashRing: React.FC<{ t: number; r?: number; width?: number }> = ({ t, r = 200, width = 6 }) => {
  const ns = useNs();
  if (t < 0 || t > 18) return null;
  const ring = (dt: number, rr: number, i: number) => {
    const tt = t - dt;
    if (tt < 0 || tt > 16) return null;
    const u = tt / 16;
    const R = rr * SNAP(u);
    if (R < 0.5) return null;
    return (
      <circle
        key={i}
        cx={SCX}
        cy={SCY}
        r={R}
        fill="none"
        stroke={ns.url("ring")}
        strokeWidth={width * (1 - 0.65 * u)}
        opacity={0.8 * Math.pow(1 - u, 1.2)}
      />
    );
  };
  return (
    <g>
      <defs>
        <linearGradient id={ns.id("ring")} gradientUnits="userSpaceOnUse" x1={SCX - r} y1={SCY + r} x2={SCX + r} y2={SCY - r}>
          <stop offset={0} stopColor={C.mintD} />
          <stop offset={0.38} stopColor={C.skyD} />
          <stop offset={0.72} stopColor={C.lilacD} />
          <stop offset={1} stopColor={C.blushD} />
        </linearGradient>
      </defs>
      {ring(0, r, 0)}
      {ring(2, r * 0.72, 1)}
    </g>
  );
};

/**
 * Light: four ink rays (3 px) shot from the ✦'s own tips (0→60 u in 4 f), retracted by 8 f.
 * They ride the ✦'s rotation and scale, so they always continue its points.
 */
export const FlashRays: React.FC<{ t: number; rot?: number; scale?: number; len?: number; px?: number }> = ({
  t,
  rot = 0,
  scale = 1,
  len = 60,
  px = 3,
}) => {
  const { k } = useStage();
  if (t < 0 || t > 8) return null;
  const r0 = 21.5 * scale + 5;
  const head = r0 + len * interpolate(t, [0, 4], [0, 1], { ...clamp, easing: SNAP });
  const tail = r0 + len * interpolate(t, [2, 7], [0, 1], { ...clamp, easing: SNAP });
  if (head - tail < 0.3) return null;
  return (
    <g stroke={C.ink} strokeWidth={px / k} strokeLinecap="round" opacity={Math.min(1, (head - tail) / (0.35 * len))}>
      {[0, 90, 180, 270].map((a) => {
        const c = Math.cos(((a + rot) * Math.PI) / 180);
        const s = Math.sin(((a + rot) * Math.PI) / 180);
        return <line key={a} x1={SCX + c * tail} y1={SCY + s * tail} x2={SCX + c * head} y2={SCY + s * head} />;
      })}
    </g>
  );
};

/** A tapered streak of light behind a moving spark (points oldest → newest). */
export const LightStreak: React.FC<{ pts: Pt[]; theme: Theme; opacity?: number; width?: number }> = ({ pts, theme, opacity = 1, width = 1.6 }) => {
  if (pts.length < 2 || opacity <= 0) return null;
  const dark = theme === "dark";
  const n = pts.length - 1;
  return (
    <g strokeLinecap="round" opacity={opacity < 1 ? opacity : undefined}>
      {pts.slice(1).map((p, i) => {
        const w = (i + 1) / n;
        const q = pts[i];
        return (
          <line
            key={i}
            x1={q[0]}
            y1={q[1]}
            x2={p[0]}
            y2={p[1]}
            stroke={dark ? (w > 0.6 ? C.mist : C.sky) : w > 0.6 ? C.ink : C.skyD}
            strokeWidth={width * (0.25 + 0.75 * w)}
            opacity={0.08 + 0.55 * w * w}
          />
        );
      })}
    </g>
  );
};

// ------------------------------------------------------------------ field
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

/**
 * Background field, computed once per size/theme into a <canvas> (it is static, so the loop never changes).
 * Dark: ink with a radial falloff to #242835 at the corners (the CSS "circle farthest-corner" ramp,
 * ink held to 34 %), centred on the logo's optical centre. Light: paper.
 * The ramp is evaluated in float and a static, zero-mean mono grain (dark ±1.5 %, light ±3 %,
 * triangular) is added before quantisation: brand colours stay exact on average and the vignette is
 * dithered, so it never bands after compression. `grain={false}` for alpha / clean plates.
 */
export const Field: React.FC<{ theme: Theme; cx: number; cy: number; grain?: boolean }> = ({ theme, cx, cy, grain = true }) => {
  const { width, height } = useVideoConfig();
  const ref = useRef<HTMLCanvasElement>(null);
  const dark = theme === "dark";
  useLayoutEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const img = ctx.createImageData(width, height);
    const px = img.data;
    const A = hex(dark ? C.ink : C.paper);
    const B = hex(dark ? C.ink2 : C.paper);
    const R = Math.max(Math.hypot(cx, cy), Math.hypot(width - cx, cy), Math.hypot(cx, height - cy), Math.hypot(width - cx, height - cy));
    const amp = grain ? (dark ? 0.015 : 0.03) * 255 : 0;
    // mulberry32, fixed seed: the same grain on every frame and every render
    let seed = 0x5a17ee;
    const rnd = () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const t = dark ? Math.max(0, (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / R - 0.34) / 0.66) : 0;
        const n = amp ? (rnd() + rnd() - 1) * amp : 0;
        const i = (y * width + x) * 4;
        px[i] = Math.round(A[0] + (B[0] - A[0]) * t + n);
        px[i + 1] = Math.round(A[1] + (B[1] - A[1]) * t + n);
        px[i + 2] = Math.round(A[2] + (B[2] - A[2]) * t + n);
        px[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [width, height, dark, cx, cy, grain]);
  return <canvas ref={ref} width={width} height={height} style={{ position: "absolute", left: 0, top: 0, width, height }} />;
};

// ------------------------------------------------------------------ screen-space light (px, drawn over the whole frame)
/**
 * Anamorphic flash: a horizontal mist-to-sky streak through (cx, cy), `len` px long in total (≈80 % of the
 * frame width), a hot 5 px core in a 40 px glow; it decays over 8 f (shrinks 25 %, fades on SWING-ish).
 */
export const FlashStreak: React.FC<{ t: number; cx: number; cy: number; len: number; width: number; height: number }> = ({
  t,
  cx,
  cy,
  len,
  width,
  height,
}) => {
  const ns = useNs();
  if (t < 0 || t > 8) return null;
  const u = t / 8;
  const a = Math.pow(1 - u, 1.5);
  const L = len * (1 - 0.25 * u) * (t < 1 ? 0.8 + 0.2 * t : 1);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", mixBlendMode: "screen" }}>
      <defs>
        <linearGradient id={ns.id("h")} gradientUnits="userSpaceOnUse" x1={cx - L / 2} y1={0} x2={cx + L / 2} y2={0}>
          <stop offset={0} stopColor={C.sky} stopOpacity={0} />
          <stop offset={0.3} stopColor={C.sky} stopOpacity={0.55} />
          <stop offset={0.5} stopColor={C.mist} stopOpacity={1} />
          <stop offset={0.7} stopColor={C.sky} stopOpacity={0.55} />
          <stop offset={1} stopColor={C.sky} stopOpacity={0} />
        </linearGradient>
        <filter id={ns.id("g")} x="-20%" y="-400%" width="140%" height="900%">
          <feGaussianBlur stdDeviation="0 14" />
        </filter>
        <filter id={ns.id("c")} x="-20%" y="-400%" width="140%" height="900%">
          <feGaussianBlur stdDeviation="0 1.6" />
        </filter>
      </defs>
      <rect x={cx - L / 2} y={cy - 20} width={L} height={40} fill={ns.url("h")} opacity={0.5 * a} filter={ns.url("g")} />
      <rect x={cx - L / 2} y={cy - 2.5} width={L} height={5} fill={ns.url("h")} opacity={a} filter={ns.url("c")} />
    </svg>
  );
};

/** +`gain` full-field glow centred on (cx, cy), decaying over `dur` f on SWING (screen blend: it only adds light). */
export const FieldGlow: React.FC<{ t: number; cx: number; cy: number; width: number; height: number; gain?: number; dur?: number }> = ({
  t,
  cx,
  cy,
  width,
  height,
  gain = 0.2,
  dur = 10,
}) => {
  const ns = useNs();
  if (t < 0 || t > dur) return null;
  const a = gain * (1 - SWING_(t / dur));
  const R = Math.hypot(Math.max(cx, width - cx), Math.max(cy, height - cy));
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute", left: 0, top: 0, mixBlendMode: "screen" }}>
      <defs>
        <radialGradient id={ns.id("fg")} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={R}>
          <stop offset={0} stopColor={C.mist} />
          <stop offset={0.12} stopColor={C.sky} stopOpacity={0.95} />
          <stop offset={0.45} stopColor={C.lilac} stopOpacity={0.55} />
          <stop offset={1} stopColor={C.lilac} stopOpacity={0.3} />
        </radialGradient>
      </defs>
      <rect width={width} height={height} fill={ns.url("fg")} opacity={a} />
    </svg>
  );
};

/**
 * The strike as a light event (screen px): a 2 f exposure lift to ~1.3 with radial falloff and a thin
 * holo ring that crosses the whole frame in 10 f. `t` = frames since the strike.
 */
export const StrikeLight: React.FC<{ t: number; cx: number; cy: number; width: number; height: number }> = ({ t, cx, cy, width, height }) => {
  const ns = useNs();
  if (t < 0 || t > 12) return null;
  const R = Math.hypot(Math.max(cx, width - cx), Math.max(cy, height - cy)) * 1.08;
  const lift = t < 1 ? 1 : t < 2 ? 0.55 : t < 3 ? 0.18 : 0;
  const u = Math.min(1, t / 10);
  const rr = R * SNAP(u);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute", left: 0, top: 0, mixBlendMode: "screen" }}>
      <defs>
        <radialGradient id={ns.id("ex")} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={R * 0.85}>
          <stop offset={0} stopColor="#fff" stopOpacity={0.42} />
          <stop offset={0.18} stopColor={C.mist} stopOpacity={0.3} />
          <stop offset={0.55} stopColor={C.sky} stopOpacity={0.12} />
          <stop offset={1} stopColor={C.lilac} stopOpacity={0} />
        </radialGradient>
        <linearGradient id={ns.id("rg")} gradientUnits="userSpaceOnUse" x1={cx - rr} y1={cy + rr} x2={cx + rr} y2={cy - rr}>
          <stop offset={0} stopColor={C.mint} />
          <stop offset={0.38} stopColor={C.sky} />
          <stop offset={0.72} stopColor={C.lilac} />
          <stop offset={1} stopColor={C.blush} />
        </linearGradient>
      </defs>
      {lift > 0 ? <rect width={width} height={height} fill={ns.url("ex")} opacity={lift} /> : null}
      {rr > 4 && u < 1 ? (
        <circle cx={cx} cy={cy} r={rr} fill="none" stroke={ns.url("rg")} strokeWidth={10 * (1 - 0.6 * u)} opacity={0.85 * Math.pow(1 - u, 1.1)} />
      ) : null}
    </svg>
  );
};
