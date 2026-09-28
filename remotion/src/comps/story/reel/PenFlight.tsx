import React from "react";
import { parsePath, reduceInstructions, serializeInstructions } from "@remotion/paths";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C } from "../../../lib/theme";
import { BLOOM, DIVE, SNAP, SWING, lerp, ramp, springAt } from "../kit/easing";
import { K, type Pt } from "../kit/geometry";
import { LOGO } from "../kit/logo-data.gen";
import { HERO_AT } from "../Zazeh";
import { HOVER3, OX, OY } from "./build";
import { SP_C } from "./geo";

/**
 * PRE-DROP (f360–f413), screen space. The pen leaves its rest under the ✦ seat, rises above the logo and
 * grows 60 → 84 px, charges on the 16ths (f381 / f385 / f389, +8 % each), winds up (×0.88, SNAP, 3 f),
 * then DIVES into the lens on a gentle log-space ease-in (f393–f411), turning a quarter. It stays opaque:
 * from f394 its body opens into a PORTAL whose interior is the logo open's first frame (the ink field
 * with the pinprick already lit, riding the ✦ centre), rimmed by the ✦'s own holo. At f411 the window
 * covers the frame, so the cut into the open (f414) matches through it.
 */
const START: Pt = [OX + K * HOVER3[0], OY + K * HOVER3[1]];
const TOP: Pt = [540, 560];
const PULSES = [381, 385, 389];
export const WIND = [390, 393] as const;
export const DIVE_F = [393, 411] as const;
/** window = the ✦ scaled 0.86 about its centre (the rim is the outer 14 %) */
export const WINDOW_FRAC = 0.86;
export const WIN_F = [405.5, 410] as const;
/** the dive's radial zoom blur integrates over a 120° shutter (⅓ frame) */
const SHUTTER = 1 / 3;
/** at S_END the window's inscribed circle (0.86 · 11.4 u · 1.4 px/u · s) clears every corner of the frame */
const S_END = 96;

export const flightState = (t: number) => {
  // rise + grow (SWING)
  const r = SWING(ramp(t, 360, 384));
  let x = lerp(START[0], TOP[0], r);
  let y = lerp(START[1], TOP[1], r);
  let s = lerp(1, 1.4, r);
  // charge: three pops, each +8 % (cumulative)
  for (const p of PULSES) s *= lerp(1, 1.08, springAt(t, p, BLOOM));
  // wind-up: a breath in before the dive
  s *= 1 - 0.12 * SNAP(ramp(t, WIND[0], WIND[1]));
  const sDive = s;
  // the dive: log space, gentle ease-in; the ✦ centres on the portal spot early (SWING), turns a quarter
  const w = DIVE(ramp(t, DIVE_F[0], DIVE_F[1]));
  if (t >= DIVE_F[0]) s = Math.exp(lerp(Math.log(sDive), Math.log(S_END), w));
  const c = SWING(ramp(t, DIVE_F[0], DIVE_F[0] + 12));
  x = lerp(x, HERO_AT[0], c);
  y = lerp(y, HERO_AT[1], c);
  // a slow turn while it rises and charges (−24°), wound back on the wind-up, then a quarter turn into the lens
  const idle = -24 * SWING(ramp(t, 360, 390)) * (1 - SNAP(ramp(t, WIND[0], WIND[1])));
  const rot = idle + 90 * SWING(ramp(t, DIVE_F[0], DIVE_F[1]));
  // the window dilates from the ✦'s core like a pupil, only once the ✦ is big (f406–f410): a holo ✦
  // dives at us, its heart opens onto the dark, and the dark swallows the frame
  const win = WINDOW_FRAC * SWING(ramp(t, WIN_F[0], WIN_F[1]));
  // height above the paper (px): lifts off as it rises, the shadow leaves before the dive
  const h = lerp(14, 70, r);
  const shadow = 1 - ramp(t, 378, 392, SWING);
  const halo = 0.55 * (1 - ramp(t, 390, 398, SWING));
  // zoom speed (log scale per frame) drives the radial zoom blur
  const sAt = (q: number) => (q >= DIVE_F[0] ? Math.exp(lerp(Math.log(sDive), Math.log(S_END), DIVE(ramp(q, DIVE_F[0], DIVE_F[1])))) : s);
  const speed = Math.log(s / sAt(t - 1));
  return { x, y, s, rot, h, shadow, halo, win, speed, w, sAt };
};

// ------------------------------------------------------------------ path helper: the ✦ in screen space
type M6 = [number, number, number, number, number, number];
const mul = (a: M6, b: M6): M6 => [
  a[0] * b[0] + a[2] * b[1],
  a[1] * b[0] + a[3] * b[1],
  a[0] * b[2] + a[2] * b[3],
  a[1] * b[2] + a[3] * b[3],
  a[0] * b[4] + a[2] * b[5] + a[4],
  a[1] * b[4] + a[3] * b[5] + a[5],
];
const T = (x: number, y: number): M6 => [1, 0, 0, 1, x, y];
const S = (s: number): M6 => [s, 0, 0, s, 0, 0];
const Rd = (deg: number): M6 => {
  const a = (deg * Math.PI) / 180;
  return [Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0];
};
const SPARKLE_INS = reduceInstructions(parsePath(LOGO.sparkle.d));
/** the logo ✦ outline at centre (x, y), rotation `rot`°, scale `s` (1 = 60 px), in screen px */
export const sparklePath = (x: number, y: number, rot: number, s: number): string => {
  const m = mul(mul(mul(T(x, y), Rd(rot)), S(K * s)), T(-SP_C[0], -SP_C[1]));
  const ap = (px: number, py: number): [number, number] => [m[0] * px + m[2] * py + m[4], m[1] * px + m[3] * py + m[5]];
  const out = SPARKLE_INS.map((c) => {
    if (c.type === "M" || c.type === "L") {
      const [px, py] = ap(c.x, c.y);
      return { ...c, x: px, y: py };
    }
    if (c.type === "C") {
      const [a1, b1] = ap(c.cp1x, c.cp1y);
      const [a2, b2] = ap(c.cp2x, c.cp2y);
      const [px, py] = ap(c.x, c.y);
      return { ...c, cp1x: a1, cp1y: b1, cp2x: a2, cp2y: b2, x: px, y: py };
    }
    return c;
  });
  return serializeInstructions(out);
};
/**
 * The hole the paper world gets once the portal is open: the ✦'s solid body (its oldest shutter sample),
 * so under the rim there is only the dark world and the rim's blurred edge still lies on paper.
 */
export const portalWindow = (t: number): string | null => {
  const f = flightState(t);
  if (f.win <= 0.001 || t < DIVE_F[0]) return null;
  return sparklePath(f.x, f.y, f.rot, f.sAt(t - SHUTTER));
};

// ------------------------------------------------------------------ rings on the charges
/** thin holo rings leaving the ✦ on each pulse (screen space); `at` = pulse times, 9 f each */
export const PulseRings: React.FC<{ t: number; at: number[]; c: Pt; s: number; id: string; dark?: boolean }> = ({ t, at, c, s, id, dark = false }) => {
  const live = at.map((p) => t - p).filter((u) => u >= 0 && u < 12);
  if (!live.length) return null;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <defs>
        <linearGradient id={`${id}-ring`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor={dark ? C.mint : C.mintD} />
          <stop offset="0.38" stopColor={dark ? C.sky : C.skyD} />
          <stop offset="0.72" stopColor={dark ? C.lilac : C.lilacD} />
          <stop offset="1" stopColor={dark ? C.blush : C.blushD} />
        </linearGradient>
      </defs>
      {live.map((u, i) => {
        const q = SNAP(u / 12);
        // radius on SNAP, fade on linear time: the ring is still readable when it has travelled
        return (
          <circle
            key={i}
            cx={c[0]}
            cy={c[1]}
            r={(34 + 110 * q) * s}
            fill="none"
            stroke={`url(#${id}-ring)`}
            strokeWidth={5 * (1 - 0.5 * u / 12)}
            opacity={0.85 * Math.pow(1 - u / 12, 1.2)}
          />
        );
      })}
    </svg>
  );
};

// ------------------------------------------------------------------ the ✦ in flight
const Star: React.FC<{ x: number; y: number; s: number; rot: number; prefix: string }> = ({ x, y, s, rot, prefix }) => (
  <g
    transform={`translate(${x} ${y}) rotate(${rot}) scale(${K * s}) translate(${-SP_C[0]} ${-SP_C[1]})`}
    dangerouslySetInnerHTML={{ __html: LOGO.sparkle.fills.split("__P__").join(prefix) }}
  />
);

/**
 * One frame of the ✦ in flight: paper halo + contact shadow before the dive; during the dive a radial
 * zoom blur (the ✦ accumulated over a 180° shutter: N scales, alpha 1/k, so its body stays opaque and only
 * the edge streaks outward), its core masked out as the portal window dilates.
 */
export const FlightLayer: React.FC<{ t: number }> = ({ t }) => {
  const f = flightState(t);
  const prefix = "flight-";
  const diving = t >= DIVE_F[0];
  const rimWindow = diving && f.win > 0.001 ? sparklePath(f.x, f.y, f.rot, f.s * f.win) : null;
  // shutter samples over a 120° shutter: from s(t − ⅓) to s(t); more samples the faster it zooms
  const N = diving && f.speed > 0.05 ? Math.min(12, 3 + Math.round(f.speed * 22)) : 1;
  const samples = Array.from({ length: N }, (_, i) => {
    const q = N === 1 ? t : t - SHUTTER + (SHUTTER * i) / (N - 1);
    // smallest (oldest) sample opaque, the newest 1/N: the body stays solid, only the edge streaks outward
    return { s: f.sAt(q), alpha: 1 / (i + 1) };
  });
  const soft = rimWindow ? Math.min(18, 2 + f.speed * 30) : 0;
  return (
    <AbsoluteFill>
      <PulseRings t={t} at={PULSES} c={[f.x, f.y]} s={Math.min(f.s, 2)} id="charge" />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <defs dangerouslySetInnerHTML={{ __html: LOGO.defsLight.split("__P__").join(prefix) }} />
        <defs>
          <filter id="flight-sh" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation={1.2 + 0.45 * f.h} />
          </filter>
          {rimWindow ? (
            <>
              <filter id="flight-edge" filterUnits="userSpaceOnUse" x={-20000} y={-20000} width={40000} height={40000}>
                <feGaussianBlur stdDeviation={soft} />
              </filter>
              <mask id="flight-rim" maskUnits="userSpaceOnUse" x={-20000} y={-20000} width={40000} height={40000}>
                <rect x={-20000} y={-20000} width={40000} height={40000} fill="#fff" />
                <path d={rimWindow} fill="#000" filter="url(#flight-edge)" />
              </mask>
            </>
          ) : null}
        </defs>
        {!diving && f.shadow > 0 ? (
          <g filter="url(#flight-sh)" opacity={f.shadow * Math.max(0.05, 0.16 - 0.0016 * f.h)}>
            <path
              d={LOGO.sparkle.d}
              fill={C.ink}
              transform={`translate(${f.x + 0.35 * f.h} ${f.y + 0.75 * f.h}) rotate(${f.rot}) scale(${K * f.s}) translate(${-SP_C[0]} ${-SP_C[1]})`}
            />
          </g>
        ) : null}
        {f.halo > 0 ? (
          <g opacity={f.halo}>
            <radialGradient id="flight-halo" gradientUnits="userSpaceOnUse" cx={f.x} cy={f.y} r={46 * f.s}>
              <stop offset={0} stopColor={C.sky} stopOpacity={0.5} />
              <stop offset={0.45} stopColor={C.mint} stopOpacity={0.22} />
              <stop offset={0.75} stopColor={C.lilac} stopOpacity={0.08} />
              <stop offset={1} stopColor={C.lilac} stopOpacity={0} />
            </radialGradient>
            <circle cx={f.x} cy={f.y} r={46 * f.s} fill="url(#flight-halo)" />
          </g>
        ) : null}
        <g mask={rimWindow ? "url(#flight-rim)" : undefined}>
          {samples.map((q, i) => (
            <g key={i} opacity={q.alpha < 1 ? q.alpha : undefined}>
              <Star x={f.x} y={f.y} s={q.s} rot={f.rot} prefix={prefix} />
            </g>
          ))}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/** standalone mount (Studio preview of the flight alone) */
export const PenFlight: React.FC<{ bpm: number }> = ({ bpm }) => {
  const frame = useCurrentFrame();
  const t = (frame * bpm) / 120;
  if (t < 360 || t >= DIVE_F[1] + 1) return null;
  return <FlightLayer t={t} />;
};
