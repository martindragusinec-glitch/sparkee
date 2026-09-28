import { LOGO } from "./logo-data.gen";

/**
 * Typed view of the generated logo data. Units = logo units (logo.svg viewBox 0 0 568 292).
 * Every number here is measured on the official parts by scripts/build-logo-kit.mjs.
 */
export type Pt = readonly [number, number];
export type Box = readonly [number, number, number, number];
export type Circle = { cx: number; cy: number; r: number };
export type LetterId = "s" | "p" | "a" | "r" | "k" | "e1" | "e2";
export type Letter = { id: LetterId; d: string; bbox: Box; cx: number };

type Geo = {
  flameBase: Pt;
  flameTip: Pt;
  silhouetteLength: number;
  silhouetteBox: Box;
  top: Pt;
  paw: Pt;
  split: Pt;
  routeA: string;
  routeB: string;
  routeAIn: string;
  routeBIn: string;
  lenA: number;
  lenB: number;
  lenAIn: number;
  lenBIn: number;
  band: number;
  tanA0: Pt;
  tanB0: Pt;
  sparkleBox: Box;
  sparkleCentre: Pt;
  metrics: { ascender: number; xHeight: number; baseline: number; overshoot: number; descender: number };
  eyeLine: { l: Pt; r: Pt; deg: number };
  eyeR: { cx: number; cy: number; r: number };
  eyeL: { cx: number; cy: number; rx: number; ry: number };
  mouthBox: Box;
  mouthCentre: Pt;
  headCentre: Pt;
  lobes: (Circle & { tip: Pt })[];
  inscribed: Circle;
  tangents: [Pt, Pt][];
  flameCircle: Circle;
  flameTangents: [Pt, Pt][];
  mascotAnchors: { anchors: Pt[]; handles: [Pt, Pt][] };
  flameAnchors: { anchors: Pt[]; handles: [Pt, Pt][] };
  kernGaps: number[];
};

export const GEO = LOGO.geo as unknown as Geo;
export const LETTERS = LOGO.letters as unknown as Letter[];
export const LETTERS_DARK = LOGO.lettersDark as unknown as { id: LetterId; d: string }[];
export const LOGO_W = 568;
export const LOGO_H = 292;
export const M = GEO.metrics;

/** Letters + mascot box (the ✦ hangs outside it as punctuation). */
export const BOX: Box = [0, 0, LETTERS[6].bbox[2], M.descender];
export const BOX_CENTRE: Pt = [(BOX[0] + BOX[2]) / 2, (BOX[1] + BOX[3]) / 2];

/** The clip edge letters rise out of: just under the round overshoot, so nothing is ever trimmed at rest. */
export const RISE_EDGE = M.overshoot + 0.4;

/** Logo scale shared by every format (stroke weights and timing stay identical). */
export const K = 1.4;

export type Ratio = "9x16" | "1x1" | "16x9";
/** Integer origins (px) of the logo's (0,0) at K = 1.4. Box centres: 9:16 (539, 880), 1:1 (539, 540), 16:9 (960, 528). */
export const FORMATS: Record<Ratio, { width: number; height: number; ox: number; oy: number }> = {
  "9x16": { width: 1080, height: 1920, ox: 165, oy: 676 },
  "1x1": { width: 1080, height: 1080, ox: 165, oy: 336 },
  "16x9": { width: 1920, height: 1080, ox: 586, oy: 324 },
};

/** Head axis: the eye line (23.6° in the parts; rig.py rotates the standing head by 24°). */
export const HEAD_DEG = GEO.eyeLine.deg;

/** Unit vector of the holo flood (the logo-dark holo vector: mint lower left → lilac upper right). */
export const FLOOD_DIR: Pt = (() => {
  const x = 130;
  const y = -90;
  const l = Math.hypot(x, y);
  return [x / l, y / l] as const;
})();

/** Projection range of the mascot (silhouette box) on the flood direction. */
export const FLOOD_RANGE: Pt = (() => {
  const [x0, y0, x1, y1] = GEO.silhouetteBox;
  const pr = [
    [x0, y0],
    [x1, y0],
    [x0, y1],
    [x1, y1],
  ].map(([x, y]) => x * FLOOD_DIR[0] + y * FLOOD_DIR[1]);
  return [Math.min(...pr), Math.max(...pr)] as const;
})();
