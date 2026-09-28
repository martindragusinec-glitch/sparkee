import { interpolate } from "remotion";
import { BLOOM, CLICK, CUSHION, DRAW, GRAVITY, SNAP, SWING, clamp, lerp, ramp, springAt } from "../kit/easing";
import { GEO, K, LETTERS, type Pt } from "../kit/geometry";
import type { LogoState } from "../kit/LogoRig";
import { camLerp, camToScreen, camToWorld, camZoom, type Cam } from "../kit/stage";
import {
  ANCHOR_CLEAN,
  ANCHOR_PTS,
  CLEAN_SPLIT,
  LOBE_CLEAN,
  LOBE_SKETCH,
  NIB_PX,
  PULL_ANCHOR,
  STROKE,
  TANGENT_CLEAN,
  lambdaAt,
  pointAt,
  pulledCtrl,
  type Stroke,
} from "./geo";

/**
 * LogoBuild(b) — the whole making of the logo as ONE pure function of the build clock b (0..330).
 *
 *   01 skica 0–60 · 02 řád 60–120 · 03 křivky 120–165 · 04 barva 165–210 · 05 jméno 210–255 · 06 já 255–300
 *   ✦ in its seat 300–330
 *
 * Forward, the Reel plays six 45 f chapters from f90 (b 0–120 over f90–f179, then b = f − 60, with a 2 f
 * hit-stop at the landing); the rewind plays the same function backward, so every rewind frame is a real
 * frame of the build. The scrub bar shows p = b / 330.
 * Units: logo units. "Floating" = the lying mascot 70 u above its seat (the build happens there).
 */
export const B_END = 330;
export const FLOAT = -70;
/** Logo origin of the Reel (9:16, L1 = 1.4 px/u): the ✦ right edge sits on x960. */
export const OX = 165;
export const OY = 676;
/** camera pivot = the flame tip of the floating mascot (416.6, 578 on screen at L1 and L3) */
export const PIVOT: Pt = [GEO.flameTip[0], GEO.flameTip[1] + FLOAT];
export const L3 = { a: 3.2, b: 3.3 };
/** screen position of the pivot at L1 / L3 */
export const PS: Pt = [OX + K * PIVOT[0], OY + K * PIVOT[1]];
/** the L1 → L3 zoom about the pivot (the rewind's camera) */
export const baseCam = (k: number): Cam => ({ k, pivot: PIVOT, at: PS });
export const L1_CAM = baseCam(K);

/** chapter starts in b (the scrub ticks sit on them) */
export const CHAPTERS = [0, 60, 120, 165, 210, 255, 300] as const;
export const chapterOf = (b: number) => (b < 60 ? 1 : b < 120 ? 2 : b < 165 ? 3 : b < 210 ? 4 : b < 255 ? 5 : 6);

/** The forward build clock: frame (at 120 BPM) → b. Six 45 f chapters from f90, a 2 f hit-stop at the landing. */
export const HIT_F = 330;
export const buildB = (t: number) => {
  if (t < 90) return 0;
  if (t < 180) return ((t - 90) * 4) / 3;
  if (t < HIT_F) return t - 60;
  if (t < HIT_F + 2) return 270;
  return Math.min(300, t - 62);
};

const logLerp = (a: number, b: number, u: number) => Math.exp(lerp(Math.log(a), Math.log(b), u));

// ------------------------------------------------------------------ 01 skica: stroke schedule
type Sk = { id: string; b0: number; b1: number };
/** volumes first (flame, the line of action, five loose lobes), then the silhouette */
export const SKETCH: Sk[] = [
  { id: "flame", b0: 0, b1: 6.5 },
  { id: "action", b0: 7.4, b1: 12.4 },
  { id: `lobe${LOBE_SKETCH[0]}`, b0: 13.3, b1: 17 },
  { id: `lobe${LOBE_SKETCH[1]}`, b0: 17.4, b1: 19.9 },
  { id: `lobe${LOBE_SKETCH[2]}`, b0: 20.3, b1: 23 },
  { id: `lobe${LOBE_SKETCH[3]}`, b0: 23.4, b1: 27 },
  { id: `lobe${LOBE_SKETCH[4]}`, b0: 27.4, b1: 29.9 },
  { id: "head1", b0: 31, b1: 37 },
  { id: "head2", b0: 37.3, b1: 43 },
  { id: "belly", b0: 43.6, b1: 47 },
  { id: "leg2", b0: 47.3, b1: 50.3 },
  { id: "leg1", b0: 50.6, b1: 53.6 },
  { id: "arm", b0: 54, b1: 57 },
];
/** per-stroke draw state: main-pass fraction, second-pass fraction, the nib (floating coords) */
const strokeState = (s: Stroke, b: number, b0: number, b1: number) => {
  const u = DRAW(ramp(b, b0, b1));
  const lam = lambdaAt(s.warp, u);
  const lam2 = s.second ? Math.max(0, Math.min(1, (u - 0.12) / 0.88)) : 0;
  return { lam, lam2, nib: pointAt(s.poly, lam * s.poly.L), u };
};
const strokeStart = (s: Stroke): Pt => pointAt(s.poly, 0);
const strokeEnd = (s: Stroke): Pt => pointAt(s.poly, s.poly.L);

// ------------------------------------------------------------------ pen rest points (floating coords unless noted)
export const HOVER1: Pt = [300, 30];
/** where the pen taps the head: the lower-left lobe, where the holo gradient starts (mint) */
export const TAP: Pt = [168, 139];
/** world coords: right of the name, just under the baseline (the carriage-return spot), under the ✦ seat */
export const HOVER3: Pt = [GEO.sparkleCentre[0], 286];

// ------------------------------------------------------------------ 03: the pull
export const PULL_MAX = 1.3;
export const pullAt = (b: number) => {
  if (b < 142) return 0;
  if (b < 148) return PULL_MAX * SWING(ramp(b, 142, 148));
  if (b >= 156) return 0;
  // released: snaps back with one CLICK overshoot, exactly 0 from b 156
  return PULL_MAX * (1 - springAt(b, 148, CLICK));
};

// ------------------------------------------------------------------ 03: the clean line (flame first, then both sides)
export const cleanU = (b: number) => DRAW(ramp(b, 146, 164));
/** frames after b 146 at which the clean line reaches side-fraction f */
const drawInv = (f: number) => {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 30; i++) {
    const m = (lo + hi) / 2;
    if (DRAW(m) < f) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
};
export const cleanPassB = (f: number) => 146 + 18 * drawInv(Math.max(0, Math.min(1, f)));
/** anchors, handles and guides dissolve 8 f behind the tip of the clean line */
const dissolve = (b: number, f: number) => 1 - ramp(b, cleanPassB(f) + 8, cleanPassB(f) + 11, SWING);
export const ANCHOR_FADE_B = ANCHOR_CLEAN.map((f) => cleanPassB(f) + 8);

// ------------------------------------------------------------------ 05: the name
/** each letter lands 8 u too loose per gap, centred on the r */
export const LOOSE = LETTERS.map((_, i) => (i - 3) * 8);
export const DROP_B = LETTERS.map((_, i) => 226 + 2 * i);

// ------------------------------------------------------------------ 06: contact ripple
/** a dip of `amp` u released at `t0`: down in 2 f, back up on CUSHION with one rebound, exactly 0 by t0+16 */
export const dip = (b: number, t0: number, amp: number) => {
  if (b <= t0 || b >= t0 + 16) return 0;
  const t = b - t0;
  const down = SNAP(Math.min(1, t / 2));
  const back = springAt(b, t0 + 2, CUSHION);
  return amp * (t < 2 ? down : 1 - back) * (1 - ramp(b, t0 + 12, t0 + 16));
};
/** contact order: a+r, then p+k, then s+e, then the last e (the graded ripple) */
const RIPPLE = [
  { at: 274, amp: 1 }, // s
  { at: 272, amp: 2.5 }, // p
  { at: 270, amp: 4 }, // a
  { at: 270, amp: 4 }, // r
  { at: 272, amp: 2.5 }, // k
  { at: 274, amp: 1 }, // e1
  { at: 276, amp: 0.5 }, // e2
];
export const CONTACT_B = 270;
/** fall of the lying mascot: rise 6 u (b 255–261), fall 76 u on GRAVITY (b 261–270, 10 samples incl. contact) */
export const FALL = { rise: [255, 261] as const, fall: [260.5, 270] as const };

// ------------------------------------------------------------------ the camera (forward)
/** world points the chapter accents zoom about */
const EYE_AXIS: Pt = [(GEO.eyeLine.l[0] + GEO.eyeLine.r[0]) / 2, (GEO.eyeLine.l[1] + GEO.eyeLine.r[1]) / 2 + FLOAT];
const EAR_HANDLE: Pt = (() => {
  const c = pulledCtrl(0.65);
  return [(PULL_ANCHOR[0] + c[0]) / 2, (PULL_ANCHOR[1] + c[1]) / 2 + FLOAT];
})();
const FACE: Pt = [GEO.mouthCentre[0] - 4, GEO.mouthCentre[1] - 8 + FLOAT];
/** where the lying mascot meets "ar" (world) */
export const CONTACT_PT: Pt = [(GEO.mascotAnchors.anchors[0][0] + 282) / 2, 190];

/** 01: the spark sits at SPARK_AT (the pen centre, screen px) when the lights come on */
export const SPARK_AT: Pt = [540, 960];
const CRANE_K = 1.5 * L3.a;
/** a CLICK impulse released at `t0`: 0 → 1 → 0 with one soft rebound */
const kick = (b: number, t0: number, rise = 2) => {
  if (b <= t0) return 0;
  if (b < t0 + rise) return SNAP((b - t0) / rise);
  return 1 - springAt(b, t0 + rise, CLICK);
};

/** the camera for build time b: 01 crane, L3 creep, one accent per chapter (02 eyes, 03 ear handle, 04 face), 05 pull-back */
export const camAt = (b: number): Cam => {
  // L3 creep, then the 05 pull back to L1 (log space, about the pivot)
  let k: number;
  if (b < 210) k = logLerp(L3.a, L3.b, SWING(ramp(b, 0, 210)));
  else if (b < 228) k = logLerp(L3.b, K, SWING(ramp(b, 210, 228)));
  else k = K;
  let cam = baseCam(k);
  // 01: the crane out of the spark (1.5 × L3 on the first nib, the spark's screen spot) into the L3 framing
  if (b < 34) {
    const nib0 = strokeStart(STROKE("flame"));
    const c0: Cam = { k: CRANE_K, pivot: [nib0[0], nib0[1] + FLOAT], at: [SPARK_AT[0] + NIB_PX[0], SPARK_AT[1] + NIB_PX[1]] };
    cam = camLerp(c0, cam, SWING(ramp(b, 2, 34)), [540, 960]);
  }
  // 02 řád: push 1.0 → 1.35 toward the eye axis, hold through the 24°, release
  if (b >= 76 && b < 120) {
    // push, then keep creeping (1.35 → 1.39) while the tangents and the 24° draw: the hold never freezes
    const push = 1 + 0.35 * SWING(ramp(b, 76, 92)) + 0.04 * ramp(b, 92, 110);
    const z = lerp(push, 1, SWING(ramp(b, 110, 119.5)));
    cam = camZoom(cam, z, EYE_AXIS);
  }
  // 03 křivky: SNAP to 1.3 on the ear handle, a CLICK kick on the release, SWING back while the clean line runs
  if (b >= 136 && b < 165) {
    const z = (1 + 0.3 * SNAP(ramp(b, 136, 142)) * (1 - SWING(ramp(b, 150, 164)))) * (1 + 0.035 * kick(b, 148));
    cam = camZoom(cam, z, EAR_HANDLE);
  }
  // 04 barva: a 2 f nudge on the tap, then push 1.0 → 1.4 on the face as it comes alive, release into 05
  if (b >= 165 && b < 210) {
    const push = 1 + 0.4 * SWING(ramp(b, 174, 184)) + 0.04 * ramp(b, 184, 198);
    const z = (1 + 0.02 * kick(b, 165)) * lerp(push, 1, SWING(ramp(b, 198, 210)));
    cam = camZoom(cam, z, FACE);
  }
  return cam;
};

/** the landing punch-in (f330 contact): SNAP to 1.06 in 3 f, CUSHION back over 12 f, about the contact point */
export const landingCam = (cam: Cam, t: number): Cam => {
  if (t < HIT_F || t > HIT_F + 20) return cam;
  const up = SNAP(ramp(t, HIT_F, HIT_F + 3));
  const back = t < HIT_F + 3 ? 0 : springAt(t, HIT_F + 3, CUSHION);
  const z = 1 + 0.06 * up * (1 - back) * (1 - ramp(t, HIT_F + 15, HIT_F + 20));
  return camZoom(cam, z, CONTACT_PT);
};

// ------------------------------------------------------------------ state
export type Guides = {
  grid: number;
  lobes: { dot: number; ring: number; op: number }[];
  inscribed: { dot: number; ring: number; op: number };
  tangents: { p: number; op: number }[];
  flameCircle: { dot: number; ring: number; op: number };
  flameTangents: number[];
  eyes: [number, number];
  eyesOp: number;
  angle: number;
  angleOp: number;
  metrics: number[];
  overshoot: number;
};
export type Pen = {
  /** ✦ centre, world logo units */
  x: number;
  y: number;
  /** uniform scale (1 = 60 px on screen) */
  s: number;
  /** pivot of `s`: "centre" or "nib" (a tap presses the nib into the paper) */
  pivot: "centre" | "nib";
  rot: number;
  /** height above the paper in px (drives the contact shadow) */
  h: number;
  /** 0 = the pen is the logo's own ✦ (in its seat, no shadow) */
  shadow: number;
  /** soft pastel halo (the spark's light on the paper), 0..1 */
  halo?: number;
};
export type SketchDraw = { id: string; kind: Stroke["kind"]; lam: number; lam2: number; op: number };
export type BuildState = {
  b: number;
  cam: Cam;
  /** = cam.k */
  k: number;
  sketch: SketchDraw[];
  sketchOp: number;
  /** progress of the clean line 8 f ago: the eraser trail that dissolves the sketch + preview */
  trail: number;
  guides: Guides;
  anchorsT: number;
  anchorOp: number[];
  handles: number;
  handleOp: number;
  preview: number;
  previewOp: number;
  pull: number;
  clean: number;
  flameOutline: number;
  flameFill: number;
  rig: LogoState;
  glint: number;
  kern: number;
  letterDx: number[];
  flashes: number[];
  contact: number;
  pen: Pen;
};

// the pen centre from a nib point (floating → world), at camera scale k and pen scale s
const centreFromNib = (nib: Pt, k: number, s = 1, float = FLOAT): Pt => [nib[0] - (NIB_PX[0] * s) / k, nib[1] + float - (NIB_PX[1] * s) / k];

/** where the pen is (and how high) at build time b, ignoring taps/pulses */
const penPath = (b: number, cam: Cam): { c: Pt; h: number } => {
  const k = cam.k;
  const lift = (u: number, h0: number, h1: number, peak: number) => lerp(h0, h1, u) + peak * Math.sin(Math.PI * u);
  // 01: drawing (nib on the stroke) and flicks between strokes
  if (b < 57) {
    for (let i = 0; i < SKETCH.length; i++) {
      const sk = SKETCH[i];
      const st = STROKE(sk.id);
      if (b < sk.b0) {
        if (i === 0) return { c: centreFromNib(strokeStart(st), k), h: 2 };
        const prev = SKETCH[i - 1];
        const u = SWING(ramp(b, prev.b1, sk.b0));
        const a = centreFromNib(strokeEnd(STROKE(prev.id)), k);
        const z = centreFromNib(strokeStart(st), k);
        return { c: [lerp(a[0], z[0], u), lerp(a[1], z[1], u)], h: lift(u, 2, 2, 12) };
      }
      if (b <= sk.b1) return { c: centreFromNib(strokeState(st, b, sk.b0, sk.b1).nib, k), h: 2 };
    }
  }
  const hov1: Pt = [HOVER1[0], HOVER1[1] + FLOAT];
  if (b < 139) {
    // lift off the last stroke and float to the first rest point
    const u = SWING(ramp(b, 57, 65));
    const a = centreFromNib(strokeEnd(STROKE("arm")), k);
    return { c: [lerp(a[0], hov1[0], u), lerp(a[1], hov1[1], u)], h: lerp(2, 14, u) };
  }
  // 03: grab the ear's handle, over-pull, release; then glide to the tap point
  if (b < 142) {
    const u = SWING(ramp(b, 139, 142));
    const z = centreFromNib(pulledCtrl(0), k);
    return { c: [lerp(hov1[0], z[0], u), lerp(hov1[1], z[1], u)], h: lerp(14, 2, u) };
  }
  if (b < 148) return { c: centreFromNib(pulledCtrl(pullAt(b)), k), h: 2 };
  const rel = centreFromNib(pulledCtrl(PULL_MAX), k);
  const relUp: Pt = [rel[0] + 6, rel[1] - 10];
  if (b < 156) {
    const u = SNAP(ramp(b, 148, 152));
    return { c: [lerp(rel[0], relUp[0], u), lerp(rel[1], relUp[1], u)], h: lerp(2, 14, u) };
  }
  const tap = centreFromNib(TAP, k);
  if (b < 165) {
    const u = SWING(ramp(b, 156, 165));
    return { c: [lerp(relUp[0], tap[0], u), lerp(relUp[1], tap[1], u)], h: lerp(14, 3, u) + 8 * Math.sin(Math.PI * u) };
  }
  // 04: tap at b 165, hold 2 f, lift and go back to rest while the face comes alive
  if (b < 181) {
    const u = SWING(ramp(b, 168, 181));
    const h = b < 165.5 ? 0 : b < 168 ? 1 : lerp(1, 14, u);
    return { c: [lerp(tap[0], hov1[0], u), lerp(tap[1], hov1[1], u)], h };
  }
  // 05: swoop down to the start of the baseline while the camera pulls back, then type
  const baseY = GEO.metrics.baseline;
  const slot = (i: number) => LETTERS[i].bbox[2] + LOOSE[i] + 7; // just right of letter i (loose)
  const startNib: Pt = [LETTERS[0].bbox[0] + LOOSE[0] - 8, baseY];
  if (b < 224) {
    if (b < 208) return { c: hov1, h: 14 };
    // a straight line ON SCREEN while the camera pulls back (a world-space path would swing off the frame)
    const u = SWING(ramp(b, 208, 224));
    const c208 = camAt(208);
    const c224 = camAt(224);
    const s0 = camToScreen(c208, hov1);
    const s1 = camToScreen(c224, centreFromNib(startNib, c224.k, 1, 0));
    return { c: camToWorld(cam, [lerp(s0[0], s1[0], u), lerp(s0[1], s1[1], u)]), h: lerp(14, 2, u) };
  }
  if (b < 239) {
    // typewriter carriage: one SNAP step per letter, each landing just before its letter drops behind it
    let x = startNib[0];
    for (let i = 0; i < LETTERS.length; i++) {
      const t0 = DROP_B[i] - 2;
      if (b >= t0) x = lerp(i === 0 ? startNib[0] : slot(i - 1), slot(i), SNAP(ramp(b, t0, t0 + 2)));
    }
    return { c: centreFromNib([x, baseY], k, 1, 0), h: 2 };
  }
  const last = centreFromNib([slot(6), baseY], k, 1, 0);
  if (b < 300) {
    const u = SWING(ramp(b, 239, 247));
    return { c: [lerp(last[0], HOVER3[0], u), lerp(last[1], HOVER3[1], u)], h: lerp(2, 14, u) };
  }
  // ✦ in its seat: rises into it and becomes the logo's own ✦
  const u = SWING(ramp(b, 300, 326));
  return { c: [lerp(HOVER3[0], GEO.sparkleCentre[0], u), lerp(HOVER3[1], GEO.sparkleCentre[1], u)], h: lerp(14, 0, u) };
};

/** The build at time b. `camOverride` replaces the forward camera (the rewind has its own clock). */
export const logoBuild = (bIn: number, camOverride?: Cam): BuildState => {
  const b = Math.max(0, Math.min(B_END, bIn));
  const cam = camOverride ?? camAt(b);
  const k = cam.k;

  // ---- 01 sketch: volumes are replaced by their fitted circles in 02, the action guide leaves in 02
  const LOBE_ORDER = [4, 0, 1, 2, 3];
  const ringEnd = (li: number) => 71.25 + 3.75 * LOBE_ORDER.indexOf(li);
  const sketch: SketchDraw[] = SKETCH.map((sk) => {
    const s = STROKE(sk.id);
    const st = strokeState(s, b, sk.b0, sk.b1);
    let op = 1;
    if (s.kind === "action") op = 1 - ramp(b, 66, 80, SWING);
    if (s.id.startsWith("lobe")) {
      const li = Number(s.id.slice(4));
      op = 1 - ramp(b, ringEnd(li) - 5, ringEnd(li) + 1, SWING);
    }
    if (s.id === "flame") op = 1 - ramp(b, 92, 99, SWING);
    return { id: sk.id, kind: s.kind, lam: st.lam, lam2: st.lam2, op };
  });
  const sketchOp = (1 - 0.6 * ramp(b, 60, 66, SWING)) * (1 - ramp(b, 160, 168, SWING));

  // ---- 02 construction (ring ends land on 16ths)
  const lobes = GEO.lobes.map((_, li) => {
    const end = ringEnd(li);
    return {
      dot: springAt(b, end - 9, BLOOM),
      ring: ramp(b, end - 7, end, DRAW),
      op: dissolve(b, LOBE_CLEAN[li]),
    };
  });
  const tangents = GEO.tangents.map((_, ti) => {
    const i = LOBE_ORDER.indexOf(ti === 4 ? 4 : ti);
    return { p: ramp(b, 84 + 1.5 * i, 90 + 1.5 * i, DRAW), op: dissolve(b, TANGENT_CLEAN[ti]) };
  });
  const lateFade = 1 - ramp(b, 158, 166, SWING);
  const guides: Guides = {
    grid: ramp(b, 60, 68, SWING) * (1 - ramp(b, 278, 294, SWING)),
    lobes,
    inscribed: { dot: springAt(b, 74, BLOOM), ring: ramp(b, 76, 84, DRAW), op: lateFade },
    tangents,
    flameCircle: { dot: springAt(b, 90, BLOOM), ring: ramp(b, 92, 98, DRAW), op: 1 - ramp(b, 152, 158, SWING) },
    flameTangents: [ramp(b, 95, 100, DRAW), ramp(b, 97, 102, DRAW)],
    eyes: [ramp(b, 94, 100, DRAW), ramp(b, 96, 102, DRAW)],
    eyesOp: lateFade,
    angle: ramp(b, 78, 92),
    angleOp: 1 - ramp(b, 127, 131, SWING),
    // 05 type metrics draw on (8 f, 2 f stagger) and un-draw toward their origins in 06
    metrics: [0, 1, 2, 3].map((i) => ramp(b, 212 + 2 * i, 220 + 2 * i, DRAW) * (1 - ramp(b, 278 + 2 * (3 - i), 288 + 2 * (3 - i), DRAW))),
    overshoot: ramp(b, 216, 224, DRAW) * (1 - ramp(b, 282, 292, DRAW)),
  };

  // ---- 03 anchors, handles, the path hairline, the pull, the clean line
  const anchorsT = b - 120;
  const anchorOp = ANCHOR_PTS.map((_, i) => 1 - ramp(b, ANCHOR_FADE_B[i], ANCHOR_FADE_B[i] + 3, SWING));
  const clean = cleanU(b);

  // ---- 04 colour
  const flood = ramp(b, 165, 177, SNAP);
  const seedR = 46 * SNAP(ramp(b, 165, 172));
  const wobble =
    b < 176 || b >= 192 ? 0 : 5 * Math.pow(1 - ramp(b, 176, 192), 2) * Math.sin((2 * Math.PI * (b - 176)) / 8);

  // ---- 05 letters: drop in (24 u, 6 f SNAP), loose → kerned in one SWING move
  const kernU = SWING(ramp(b, 242, 252));
  const letterDx = LOOSE.map((l) => l * (1 - kernU));
  const letters = LETTERS.map((_, i) => {
    const t = b - DROP_B[i];
    return {
      rise: 1,
      dx: letterDx[i],
      dy: -24 * (1 - SNAP(ramp(t, 0, 6))) + dip(b, RIPPLE[i].at, RIPPLE[i].amp),
      // struck, not faded: the letter exists from its first frame (24 u up) and slams down
      opacity: ramp(t, 0, 0.5),
    };
  });
  // the baseline flash under each landed letter holds 3 f (1 f read as noise on a phone)
  const flashes = LETTERS.map((_, i) => (b >= DROP_B[i] + 3 && b < DROP_B[i] + 6 ? 1 - 0.35 * (b - DROP_B[i] - 3) / 3 : 0));

  // ---- 06 the drop: rise 6 u, fall 76 u with true gravity (t²), land on "ar" and ride the a/r dip
  const rise = 6 * SWING(ramp(b, FALL.rise[0], FALL.rise[1]));
  const fall = GRAVITY(ramp(b, FALL.fall[0], FALL.fall[1]));
  const mascotDy = b < 255 ? FLOAT : b < CONTACT_B ? FLOAT - rise * (1 - fall) + (-FLOAT) * fall : dip(b, CONTACT_B, 4);
  const follow = 6 * dip(b, CONTACT_B, 1);

  // ---- face (04) and the contented blink (06). The round eyes are never squeezed: "closed" is the
  //      official ^^ (poses/happy.svg). ^^ until the eyes open ON the bar-5 downbeat (b 180 = f240),
  //      a 4 f ^^ first blink (b 198) and a 4 f contented ^^ after landing (b 285).
  const happy = b < 180 || (b >= 198 && b < 202) || (b >= 285 && b < 289) ? 1 : 0;

  const rig: LogoState = {
    letters: b < 226 ? 0 : letters,
    outline: b < 146 ? 0 : { a: ramp(clean, CLEAN_SPLIT.a, 1), b: ramp(clean, CLEAN_SPLIT.b, 1) },
    flood,
    body: ramp(b, 169, 181, SNAP),
    feather: 40,
    sheen: 0.45,
    floodSeed: b >= 165 && b < 181 ? { x: TAP[0], y: TAP[1], r: seedR, feather: 22 } : undefined,
    cheeks: ramp(b, 178, 182, SNAP),
    // the face comes alive in one hit: mouth pop and eyes open together on the bar-5 downbeat
    mouth: b < 180 ? 0 : b >= 210 ? 1 : springAt(b, 180, BLOOM),
    eyes: 1,
    blink: 0,
    happy,
    flame: b < 176 ? 0 : 1,
    flameRot: wobble + follow,
    sparkle: b < 326 ? 0 : 1,
    mascotDy,
  };

  // ---- the pen
  const pp = penPath(b, cam);
  const tapPress = b >= 165 && b < 171 ? interpolate(b, [165, 167, 171], [1, 0.85, 1], { ...clamp, easing: SNAP }) : 1;
  const pen: Pen = {
    x: pp.c[0],
    y: pp.c[1],
    s: tapPress,
    pivot: b >= 164 && b < 172 ? "nib" : "centre",
    rot: 0,
    h: pp.h,
    shadow: 1 - ramp(b, 314, 326, SWING),
    halo: 0.55 * (1 - ramp(b, 306, 322, SWING)),
  };

  return {
    b,
    cam,
    k,
    sketch,
    sketchOp,
    trail: cleanU(b - 8),
    guides,
    anchorsT,
    anchorOp,
    handles: ramp(b, 126, 146, SNAP),
    handleOp: 1,
    preview: b - 120,
    previewOp: 1 - ramp(b, 160, 166, SWING),
    pull: pullAt(b),
    clean,
    // the build's own flame exists only until the rig's flame takes over (b 176): outline band, then ignition
    flameOutline: b < 146 || b >= 176 ? 0 : ramp(clean, 0, Math.min(CLEAN_SPLIT.a, CLEAN_SPLIT.b)),
    flameFill: b < 172 || b >= 176 ? 0 : ramp(b, 172, 176, SNAP),
    rig,
    glint: b >= 189 && b < 196 ? (b - 189) / 7 : -1,
    kern: ramp(b, 241, 243) * (1 - ramp(b, 248, 254, SWING)),
    letterDx,
    flashes,
    contact: b - CONTACT_B,
    pen,
  };
};
