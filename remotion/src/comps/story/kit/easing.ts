import { Easing, interpolate, spring } from "remotion";

/**
 * The closed easing set of the brand story (storyboard "EASING"). Nothing else is used.
 *   SNAP     arrivals                   SWING   camera moves, transfers
 *   DRAW     line draw-ons              WHIP    exits into cuts, the rewind's kick-off
 *   DROP     the logo open's light drops (spark, drip)
 *   GRAVITY  a body falling with weight (true ease-in: the last step is never a teleport)
 *   DIVE     the ✦'s zoom into the lens (log space): a long, gentle ease-in
 *   ROLL     the slot roll of the headline words (exit and entry share it)
 *   LINEAR   only the rewind's machine speed
 */
export const SNAP = Easing.bezier(0.16, 1, 0.3, 1);
export const SWING = Easing.bezier(0.65, 0, 0.35, 1);
export const DRAW = Easing.bezier(0.55, 0, 0.1, 1);
export const WHIP = Easing.bezier(0.7, 0, 0.84, 0);
export const DROP = Easing.bezier(0.55, 0, 1, 0.45);
/** t²: over 10 f the mascot's 106 px fall ends on a 20 px step after 18 px (no end teleport) */
export const GRAVITY = (t: number) => t * t;
export const DIVE = Easing.bezier(0.45, 0, 0.8, 0.35);
export const ROLL = Easing.bezier(0.7, 0, 0.2, 1);
export const LINEAR = Easing.linear;

export type SpringCfg = { damping: number; stiffness: number; mass: number };
/** snaps */
export const CLICK: SpringCfg = { damping: 14, stiffness: 260, mass: 0.6 };
/** ✦ and face pops */
export const BLOOM: SpringCfg = { damping: 12, stiffness: 220, mass: 0.7 };
/** weight */
export const CUSHION: SpringCfg = { damping: 12, stiffness: 180, mass: 0.8 };

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0..1 progress of time `t` across [a, b], eased and clamped. `t` may be fractional (BPM remaps). */
export const ramp = (t: number, a: number, b: number, easing: (x: number) => number = LINEAR) =>
  interpolate(t, [a, b], [0, 1], { ...clamp, easing });

/** Spring 0→1 released at `start` (0 before it). */
export const springAt = (t: number, start: number, config: SpringCfg, fps = 30) =>
  t <= start ? 0 : spring({ frame: t - start, fps, config });

/** 0→1→0 over `dur` frames from `at` (a blink, a flash). */
export const pulse = (t: number, at: number, dur: number) =>
  interpolate(t, [at, at + dur / 2, at + dur], [0, 1, 0], clamp);

/** Linear interpolation. */
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

/**
 * Pop to `peak`, then settle to 1 on a spring: 0 → peak (SNAP, `rise` frames) → 1 (spring).
 * Used for the ✦ flash (0 → 1.35 → 1): the spring is released at the peak, so it lands exactly on 1.
 */
export const popSettle = (t: number, start: number, peak: number, rise: number, config: SpringCfg, from = 0) => {
  if (t <= start) return from;
  if (t <= start + rise) return lerp(from, peak, SNAP((t - start) / rise));
  const s = spring({ frame: t - start - rise, fps: 30, config });
  return lerp(peak, 1, s);
};
