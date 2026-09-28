import { parsePath, reduceInstructions, serializeInstructions, type ReducedInstruction } from "@remotion/paths";
import { LOGO } from "../kit/logo-data.gen";
import { GEO, K, LETTERS, M, type Pt } from "../kit/geometry";

/**
 * Geometry of the Reel "PŘETOČ", derived once (module load) from the official parts only
 * (kit/logo-data.gen.ts = tools/logo-dark/parts + logo-dark.svg). Nothing is placed by eye:
 * every stroke, anchor, handle, profile and contact below is cut from a real contour.
 * Units = logo units (logo.svg viewBox 0 0 568 292).
 */

// ------------------------------------------------------------------ polylines
export type Poly = { pts: Pt[]; s: number[]; L: number; closed: boolean };

const bez = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt => {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
};

/** Flatten every subpath of `d` into dense polylines (≈`step` u apart). */
export const flattenAll = (d: string, step = 0.35): Poly[] => {
  const ins = reduceInstructions(parsePath(d));
  const out: Poly[] = [];
  let cur: Pt[] = [];
  let start: Pt = [0, 0];
  let last: Pt = [0, 0];
  let closed = false;
  const flush = () => {
    if (cur.length > 1) {
      const s = [0];
      for (let i = 1; i < cur.length; i++) s.push(s[i - 1] + Math.hypot(cur[i][0] - cur[i - 1][0], cur[i][1] - cur[i - 1][1]));
      out.push({ pts: cur, s, L: s[s.length - 1], closed });
    }
    cur = [];
    closed = false;
  };
  for (const c of ins) {
    if (c.type === "M") {
      flush();
      start = [c.x, c.y];
      last = start;
      cur = [start];
    } else if (c.type === "L") {
      const p: Pt = [c.x, c.y];
      const n = Math.max(1, Math.ceil(Math.hypot(p[0] - last[0], p[1] - last[1]) / step));
      for (let i = 1; i <= n; i++) cur.push([last[0] + ((p[0] - last[0]) * i) / n, last[1] + ((p[1] - last[1]) * i) / n]);
      last = p;
    } else if (c.type === "C") {
      const p1: Pt = [c.cp1x, c.cp1y];
      const p2: Pt = [c.cp2x, c.cp2y];
      const p3: Pt = [c.x, c.y];
      const est =
        Math.hypot(p1[0] - last[0], p1[1] - last[1]) + Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) + Math.hypot(p3[0] - p2[0], p3[1] - p2[1]);
      const n = Math.max(2, Math.ceil(est / step));
      for (let i = 1; i <= n; i++) cur.push(bez(last, p1, p2, p3, i / n));
      last = p3;
    } else if (c.type === "Z") {
      if (Math.hypot(last[0] - start[0], last[1] - start[1]) > 1e-6) cur.push(start);
      closed = true;
      last = start;
    }
  }
  flush();
  return out;
};
export const flatten = (d: string, step = 0.35): Poly => flattenAll(d, step)[0];

const idxAt = (p: Poly, s: number) => {
  // binary search: last i with p.s[i] <= s
  let lo = 0;
  let hi = p.s.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (p.s[mid] <= s) lo = mid;
    else hi = mid - 1;
  }
  return lo;
};
const wrapS = (p: Poly, s: number) => (p.closed ? ((s % p.L) + p.L) % p.L : Math.max(0, Math.min(p.L, s)));

export const pointAt = (p: Poly, s: number): Pt => {
  const q = wrapS(p, s);
  const i = Math.min(idxAt(p, q), p.pts.length - 2);
  const seg = p.s[i + 1] - p.s[i] || 1;
  const u = (q - p.s[i]) / seg;
  const a = p.pts[i];
  const b = p.pts[i + 1];
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
};

export const tangentAt = (p: Poly, s: number): Pt => {
  const a = pointAt(p, s - 0.6);
  const b = pointAt(p, s + 0.6);
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
};

/** Arc position of the polyline point nearest to `q`. */
export const nearestS = (p: Poly, q: Pt) => {
  let best = 0;
  let bd = Infinity;
  for (let i = 0; i < p.pts.length; i++) {
    const d = (p.pts[i][0] - q[0]) ** 2 + (p.pts[i][1] - q[1]) ** 2;
    if (d < bd) {
      bd = d;
      best = p.s[i];
    }
  }
  return best;
};

/** Points of `p` from arc position s0 to s1 (s1 may exceed L on a closed path: it wraps). */
export const slicePts = (p: Poly, s0: number, s1: number, step = 1.2): Pt[] => {
  const n = Math.max(2, Math.ceil(Math.abs(s1 - s0) / step));
  return Array.from({ length: n + 1 }, (_, i) => pointAt(p, s0 + ((s1 - s0) * i) / n));
};

/** Catmull-Rom through points → cubic path string. */
export const smoothD = (p: Pt[]) => {
  let d = `M${p[0][0].toFixed(3)} ${p[0][1].toFixed(3)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[Math.max(0, i - 1)];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[Math.min(p.length - 1, i + 2)];
    d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(3)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(3)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(
      3,
    )} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(3)} ${p2[0].toFixed(3)} ${p2[1].toFixed(3)}`;
  }
  return d;
};

// ------------------------------------------------------------------ pen timing (curvature warp)
/**
 * Pen speed ∝ curvature^-0.5 (slow in the tips, fast on straights). Returns the cumulative time table
 * T(s) (0..1) of a stroke; `lambdaAt(u)` inverts it (time fraction → length fraction).
 */
export type Warp = { s: number[]; T: number[]; L: number };
export const makeWarp = (poly: Poly): Warp => {
  const n = Math.max(8, Math.round(poly.L / 1));
  const s: number[] = [];
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    s.push((poly.L * i) / n);
    pts.push(pointAt(poly, (poly.L * i) / n));
  }
  const ds = poly.L / n;
  const kap: number[] = pts.map((_, i) => {
    if (i === 0 || i === n) return 0;
    const a = pts[i - 1];
    const b = pts[i];
    const c = pts[i + 1];
    const t1 = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const t2 = Math.atan2(c[1] - b[1], c[0] - b[0]);
    let dt = t2 - t1;
    while (dt > Math.PI) dt -= 2 * Math.PI;
    while (dt < -Math.PI) dt += 2 * Math.PI;
    return Math.abs(dt) / ds;
  });
  // smooth over ±3 u so jitter in the flattening never reads as a stutter
  const w = Math.max(1, Math.round(3 / ds));
  const sm = kap.map((_, i) => {
    let acc = 0;
    let c = 0;
    for (let j = Math.max(0, i - w); j <= Math.min(n, i + w); j++) {
      acc += kap[j];
      c++;
    }
    return acc / c;
  });
  const T = [0];
  for (let i = 1; i <= n; i++) T.push(T[i - 1] + Math.sqrt(Math.max(0.012, sm[i])) * ds);
  const tot = T[n];
  return { s, T: T.map((x) => x / tot), L: poly.L };
};
/** time fraction u (0..1) → length fraction (0..1) */
export const lambdaAt = (w: Warp, u: number) => {
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  let lo = 0;
  let hi = w.T.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (w.T[mid] <= u) lo = mid;
    else hi = mid;
  }
  const f = (u - w.T[lo]) / (w.T[hi] - w.T[lo] || 1);
  return (w.s[lo] + (w.s[hi] - w.s[lo]) * f) / w.L;
};

// ------------------------------------------------------------------ sketch strokes (01 skica)
/**
 * 01 is ideation, not tracing: VOLUMES first (the flame teardrop, then the line of action as a light
 * guide, then loose ellipses on the five lobes the construction will later fit exactly), THEN the
 * silhouette, every stroke with a pen-pressure taper (0.5 → 1.4 → 0.4 u). All of it is cut from the
 * real parts (flame circle + tangents, GEO.lobes, the silhouette), jittered with fixed seeds.
 */
export type StrokeKind = "volume" | "action" | "line";
export type Stroke = {
  id: string;
  kind: StrokeKind;
  /** the drawn main pass (logo units, floating space) */
  d: string;
  /** the main pass flattened (the nib rides it) */
  poly: Poly;
  /** an optional lighter "searching" second pass */
  second?: Poly;
  warp: Warp;
  /** max half-width multiplier of the taper (1 = 1.4 u at the belly of the stroke) */
  weight: number;
};

/** mulberry32: fixed seeds, identical strokes on every render */
const rng = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** a hand-drawn version of the point list: one slow wave + a little noise along the normal, ends overshooting */
const handDrawn = (pts: Pt[], seed: number, amp: readonly [number, number], over: readonly [number, number] = [2, 4], step = 2.5): Pt[] => {
  const base = flatten(smoothD(pts), 0.4);
  const r = rng(seed);
  const n = Math.max(3, Math.round(base.L / step));
  const ph = r() * Math.PI * 2;
  const waves = 1.2 + r() * 1.6;
  const a = amp[0] + (amp[1] - amp[0]) * r();
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const s = (base.L * i) / n;
    const p = pointAt(base, s);
    const t = tangentAt(base, s);
    const off = a * (0.75 * Math.sin(ph + (waves * 2 * Math.PI * i) / n) + 0.25 * (r() * 2 - 1));
    out.push([p[0] - t[1] * off, p[1] + t[0] * off]);
  }
  const t0 = tangentAt(base, 0);
  const t1 = tangentAt(base, base.L);
  const o0 = over[0] + (over[1] - over[0]) * r();
  const o1 = over[0] + (over[1] - over[0]) * r();
  out.unshift([out[0][0] - t0[0] * o0, out[0][1] - t0[1] * o0]);
  const last = out[out.length - 1];
  out.push([last[0] + t1[0] * o1, last[1] + t1[1] * o1]);
  return out;
};

const mkStroke = (id: string, kind: StrokeKind, pts: Pt[], seed: number, opts: { amp?: readonly [number, number]; over?: readonly [number, number]; weight?: number; second?: boolean } = {}): Stroke => {
  const main = handDrawn(pts, seed, opts.amp ?? [0.8, 1.6], opts.over ?? [2, 4]);
  const d = smoothD(main);
  const poly = flatten(d, 0.5);
  const second = opts.second ? flatten(smoothD(handDrawn(pts, seed + 977, [1.6, 2.6], [3, 6])), 0.5) : undefined;
  return { id, kind, d, poly, second, warp: makeWarp(poly), weight: opts.weight ?? 1 };
};

const SIL = flatten(LOGO.silhouette);
const HEAD = flatten(LOGO.fills.head.dSolid);
const FLAME_SIL = flatten(LOGO.flame.silhouette);
const A = GEO.mascotAnchors.anchors;
const sAnchor = (i: number) => nearestS(SIL, A[i]);
// the flame's lowest point and its tip on the silhouette (the clean line splits the flame at its tip)
const FLAME_BOTTOM = FLAME_SIL.pts.reduce((m, p) => (p[1] > m[1] ? p : m), FLAME_SIL.pts[0]);
const FLAME_TIP_PT = FLAME_SIL.pts.reduce((m, p) => (p[1] < m[1] ? p : m), FLAME_SIL.pts[0]);
const sFlameBottom = nearestS(FLAME_SIL, FLAME_BOTTOM);
const sFlameTip = nearestS(FLAME_SIL, FLAME_TIP_PT);

/** the flame teardrop: tip → right tangent → round the fitted circle → left tangent → back past the tip */
const teardrop = (): Pt[] => {
  const c = GEO.flameCircle;
  const tip = GEO.flameTip;
  const [ra, la] = GEO.flameTangents.map(([p]) => Math.atan2(p[1] - c.cy, p[0] - c.cx));
  // clockwise on screen from the right tangent point to the left one (the long way, under the circle)
  const a0 = ra;
  const a1 = la < ra ? la + 2 * Math.PI : la;
  const arc: Pt[] = Array.from({ length: 25 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / 24;
    return [c.cx + c.r * 1.04 * Math.cos(a), c.cy + c.r * 0.98 * Math.sin(a)];
  });
  return [tip, [(tip[0] + arc[0][0]) / 2 + 1, (tip[1] + arc[0][1]) / 2], ...arc, [(tip[0] + arc[24][0]) / 2 - 1, (tip[1] + arc[24][1]) / 2], [tip[0] + 1.5, tip[1] - 1]];
};

/** a loose ellipse on a fitted lobe: ±6 % out of round, tilted, 1 turn + 4–8 u of overshoot, a slight spiral */
const looseEllipse = (c: { cx: number; cy: number; r: number }, seed: number, startDeg: number): Pt[] => {
  const r = rng(seed);
  const ecc = 0.03 + 0.05 * r();
  const rot = r() * Math.PI;
  const over = (4 + 4 * r()) / c.r; // radians of overshoot
  const spiral = (r() * 2 - 1) * 1.6;
  const dx = (r() * 2 - 1) * 1.2;
  const dy = (r() * 2 - 1) * 1.2;
  const a0 = (startDeg * Math.PI) / 180;
  const n = 36;
  return Array.from({ length: n + 1 }, (_, i) => {
    const u = i / n;
    const a = a0 + (2 * Math.PI + over) * u;
    const rr = c.r + spiral * u;
    const ex = rr * (1 + ecc) * Math.cos(a - rot);
    const ey = rr * (1 - ecc) * Math.sin(a - rot);
    return [c.cx + dx + ex * Math.cos(rot) - ey * Math.sin(rot), c.cy + dy + ex * Math.sin(rot) + ey * Math.cos(rot)] as Pt;
  });
};

// head: split at its top (under the flame) and its bottom lobe tip (clockwise path)
const sHeadTop = nearestS(HEAD, GEO.split);
const sHeadBot = nearestS(HEAD, GEO.lobes[2].tip);
const headSpan1 = ((sHeadBot - sHeadTop + HEAD.L) % HEAD.L) || HEAD.L;

/** the line of action: head crown → spine → hip → the foot (the gesture of the lying pose) */
export const ACTION: Pt[] = [
  [191, 64],
  [203, 104],
  [224, 143],
  [252, 170],
  [279, 183],
  [296, 186],
];

/** Silhouette arc positions of the body anchors (the path runs clockwise from anchor 0). */
const s1 = sAnchor(1);
const s19 = sAnchor(19);
const s23 = sAnchor(23);
const s29 = sAnchor(29);
const s40 = sAnchor(40);

/** lobe draw order (pen travel: the foot → the big right lobe → the ear → the crown → the chin → the cheek) */
export const LOBE_SKETCH = [1, 0, 4, 2, 3] as const;
const LOBE_START_DEG = [200, 120, 170, 300, 300];

export const STROKES: Stroke[] = [
  mkStroke("flame", "volume", teardrop(), 3, { amp: [0.5, 0.9], over: [1, 2], weight: 0.8 }),
  mkStroke("action", "action", ACTION, 31, { amp: [0.8, 1.4], over: [3, 5], weight: 0.9 }),
  ...LOBE_SKETCH.map((li, j) => mkStroke(`lobe${li}`, "volume", looseEllipse(GEO.lobes[li], 41 + li * 13, LOBE_START_DEG[j]), 51 + li, { amp: [0.3, 0.7], over: [0.5, 1], weight: 0.75 })),
  mkStroke("head1", "line", slicePts(HEAD, sHeadTop, sHeadTop + headSpan1), 11, { second: true }),
  mkStroke("head2", "line", slicePts(HEAD, sHeadTop + headSpan1, sHeadTop + HEAD.L + 6), 12, { second: true }),
  // body gestures, drawn back along the contour: folded arm + belly, paw + lower leg, upper leg, arm
  mkStroke("belly", "line", slicePts(SIL, s1 + SIL.L, s40), 21, { second: true }),
  mkStroke("leg2", "line", slicePts(SIL, s40, s29), 22),
  mkStroke("leg1", "line", slicePts(SIL, s29, s23), 23, { second: true }),
  mkStroke("arm", "line", slicePts(SIL, s23, s19), 24),
];
export const STROKE = (id: string) => STROKES[STROKES.map((s) => s.id).indexOf(id)];

/** pen-pressure taper along a stroke (u = fraction of its length) → half-width multiplier (1.4 u at the belly) */
const TAPER_U = [0, 0.22, 0.6, 1];
const TAPER_W = [0.5, 1.4, 1.2, 0.4];
export const taperAt = (u: number) => {
  const x = Math.max(0, Math.min(1, u));
  let i = 0;
  while (i < TAPER_U.length - 2 && x > TAPER_U[i + 1]) i++;
  const f = (x - TAPER_U[i]) / (TAPER_U[i + 1] - TAPER_U[i]);
  const sm = f * f * (3 - 2 * f);
  return TAPER_W[i] + (TAPER_W[i + 1] - TAPER_W[i]) * sm;
};

/**
 * The drawn part (0..lam of its length) of a tapered stroke as a filled outline path: pressure-shaped
 * width, round tip and tail. `scale` multiplies the width (a lighter second pass uses ~0.55).
 */
export const taperedD = (p: Poly, lam: number, scale = 1): string => {
  if (lam <= 0) return "";
  const sEnd = Math.min(1, lam) * p.L;
  const n = Math.max(2, Math.ceil(sEnd / 0.9));
  const L: Pt[] = [];
  const R: Pt[] = [];
  const hw = (s: number) => 0.5 * scale * taperAt(s / p.L);
  let tEnd: Pt = [1, 0];
  let tStart: Pt = [1, 0];
  for (let i = 0; i <= n; i++) {
    const s = (sEnd * i) / n;
    const q = pointAt(p, s);
    const t = tangentAt(p, s);
    if (i === 0) tStart = t;
    if (i === n) tEnd = t;
    const w = hw(s);
    L.push([q[0] - t[1] * w, q[1] + t[0] * w]);
    R.push([q[0] + t[1] * w, q[1] - t[0] * w]);
  }
  const cap = (c: Pt, t: Pt, w: number, back: boolean): Pt[] => {
    // half circle from the left edge round the tip to the right edge (or the reverse at the tail)
    const base = Math.atan2(t[1], t[0]);
    return Array.from({ length: 7 }, (_, i) => {
      const a = back ? base + Math.PI / 2 + (Math.PI * i) / 6 : base - Math.PI / 2 + (Math.PI * i) / 6;
      return [c[0] + Math.cos(a) * w, c[1] + Math.sin(a) * w] as Pt;
    });
  };
  const endC = pointAt(p, sEnd);
  const startC = pointAt(p, 0);
  // left side runs +normal; the tip cap sweeps from +normal to −normal through the tangent direction
  const tip = cap(endC, tEnd, hw(sEnd), false).reverse();
  const tail = cap(startC, tStart, hw(0), true).reverse();
  const f = (q: Pt) => `${q[0].toFixed(2)} ${q[1].toFixed(2)}`;
  return `M${f(L[0])}L${L.slice(1).map(f).join("L")}L${tip.map(f).join("L")}L${R.reverse().map(f).join("L")}L${tail.map(f).join("L")}Z`;
};

/** the drawn part of a polyline as an open path (for dashed guides) */
export const partialD = (p: Poly, lam: number): string => {
  if (lam <= 0) return "";
  const sEnd = Math.min(1, lam) * p.L;
  const n = Math.max(2, Math.ceil(sEnd / 1.2));
  const f = (q: Pt) => `${q[0].toFixed(2)} ${q[1].toFixed(2)}`;
  return `M${Array.from({ length: n + 1 }, (_, i) => f(pointAt(p, (sEnd * i) / n))).join("L")}`;
};

// ------------------------------------------------------------------ the pen (✦ = sparkle.svg)
export const SPARKLE_POLY = flatten(LOGO.sparkle.d, 0.2);
export const SP_C = GEO.sparkleCentre;
/** the ✦'s lowest tip: the nib of the pen */
export const SP_TIP: Pt = SPARKLE_POLY.pts.reduce((m, p) => (p[1] > m[1] ? p : m), SPARKLE_POLY.pts[0]);
/** nib offset from the ✦ centre in SCREEN px at the pen's 60 px size (= the ✦ at 1.4 px/u) */
export const NIB_PX: Pt = [(SP_TIP[0] - SP_C[0]) * K, (SP_TIP[1] - SP_C[1]) * K];
/** radius of the largest circle around the ✦ centre that stays inside the ✦ (logo units) */
export const SP_INNER_R = SPARKLE_POLY.pts.reduce((m, p) => Math.min(m, Math.hypot(p[0] - SP_C[0], p[1] - SP_C[1])), Infinity);

// ------------------------------------------------------------------ 03 křivky: anchors, handles, preview, the pull
/** rotate a closed path so it starts at its `k`-th on-curve anchor (instruction k ends on anchor k) */
const rotateClosed = (d: string, k: number) => {
  const ins = reduceInstructions(parsePath(d));
  const segs = ins.filter((c) => c.type === "L" || c.type === "C");
  const endOf = (c: ReducedInstruction): Pt => (c.type === "L" || c.type === "C" ? [c.x, c.y] : [0, 0]);
  const start = endOf(segs[(k - 1 + segs.length) % segs.length]);
  const rot = [...segs.slice(k), ...segs.slice(0, k)];
  return serializeInstructions([{ type: "M", x: start[0], y: start[1] }, ...rot, { type: "Z" }]);
};

/** The mascot's 49 anchors run clockwise from the crown (anchor 11); the flame's 12 come first. */
export const MASCOT_START = 11;
export const PREVIEW_MASCOT = rotateClosed(LOGO.silhouette, MASCOT_START);
export const PREVIEW_FLAME = LOGO.flame.silhouette;
const MASCOT_ORDER = Array.from({ length: A.length }, (_, i) => (MASCOT_START + i) % A.length);
export const ANCHOR_PTS: Pt[] = [...GEO.flameAnchors.anchors, ...MASCOT_ORDER.map((i) => A[i])];
const key = (p: Pt) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`;
const orderOf = new Map<string, number>(ANCHOR_PTS.map((p, i) => [key(p), i]));
/** handles sorted by the zip order of their anchor */
export const HANDLE_PAIRS: (readonly [Pt, Pt])[] = [...GEO.flameAnchors.handles, ...GEO.mascotAnchors.handles]
  .map((h) => ({ h, o: orderOf.get(key(h[0])) ?? 0 }))
  .sort((a, b) => a.o - b.o)
  .map((x) => x.h);
export const HANDLE_ORDER: number[] = HANDLE_PAIRS.map((h) => orderOf.get(key(h[0])) ?? 0);

/** Arc positions of the anchors on their preview path (to sync the path hairline with the zip). */
const PM = flatten(PREVIEW_MASCOT);
const PF = flatten(PREVIEW_FLAME);
export const PREVIEW_LEN = { flame: PF.L, mascot: PM.L };
export const ANCHOR_S: number[] = ANCHOR_PTS.map((p, i) => (i < 12 ? nearestS(PF, p) : nearestS(PM, p)));
// the last anchor of each loop closes it
ANCHOR_S[11] = PF.L;
ANCHOR_S[0] = 0;
ANCHOR_S[12] = 0;

/**
 * The design decision: the pen grabs the out-handle of the ear (anchor 15, the top-right lobe) and
 * over-pulls it. Returns path d with that control point moved to anchor + handle·(1 + pull).
 */
export const PULL_ANCHOR: Pt = A[15];
export const PULL_CTRL: Pt = (() => {
  const h = GEO.mascotAnchors.handles.filter((x) => key(x[0]) === key(A[15]));
  // the out-handle points toward anchor 16 (down the ear)
  return h.reduce((m, x) => (Math.hypot(x[1][0] - A[16][0], x[1][1] - A[16][1]) < Math.hypot(m[1][0] - A[16][0], m[1][1] - A[16][1]) ? x : m), h[0])[1];
})();
export const pulledCtrl = (pull: number): Pt => [
  PULL_ANCHOR[0] + (PULL_CTRL[0] - PULL_ANCHOR[0]) * (1 + pull),
  PULL_ANCHOR[1] + (PULL_CTRL[1] - PULL_ANCHOR[1]) * (1 + pull),
];
const pullCache = new Map<string, string>();
export const withPull = (d: string, pull: number) => {
  if (Math.abs(pull) < 1e-4) return d;
  const k = `${pull.toFixed(4)}|${d.length}|${d.slice(0, 24)}`;
  const hit = pullCache.get(k);
  if (hit) return hit;
  const ins = reduceInstructions(parsePath(d));
  const [nx, ny] = pulledCtrl(pull);
  let done = false;
  const out = ins.map((c) => {
    if (done || c.type !== "C") return c;
    if (Math.abs(c.cp1x - PULL_CTRL[0]) < 0.02 && Math.abs(c.cp1y - PULL_CTRL[1]) < 0.02) {
      done = true;
      return { ...c, cp1x: nx, cp1y: ny };
    }
    if (Math.abs(c.cp2x - PULL_CTRL[0]) < 0.02 && Math.abs(c.cp2y - PULL_CTRL[1]) < 0.02) {
      done = true;
      return { ...c, cp2x: nx, cp2y: ny };
    }
    return c;
  });
  const r = serializeInstructions(out);
  pullCache.set(k, r);
  return r;
};

// ------------------------------------------------------------------ clean line (flame halves + routes)
/** The flame outline split at its tip: both halves run from the tip down to the base. */
const flameHalf = (dir: 1 | -1) => {
  const span = dir > 0 ? (sFlameBottom - sFlameTip + FLAME_SIL.L) % FLAME_SIL.L : (sFlameTip - sFlameBottom + FLAME_SIL.L) % FLAME_SIL.L;
  return smoothD(slicePts(FLAME_SIL, sFlameTip, sFlameTip + dir * span, 0.8));
};
export const FLAME_HALF_A = flameHalf(1);
export const FLAME_HALF_B = flameHalf(-1);
export const FLAME_HALF_LEN = { a: flatten(FLAME_HALF_A).L, b: flatten(FLAME_HALF_B).L };
/** fraction of each side's run that belongs to the flame (both sides finish together at the paw) */
export const CLEAN_SPLIT = {
  a: FLAME_HALF_LEN.a / (FLAME_HALF_LEN.a + GEO.lenA),
  b: FLAME_HALF_LEN.b / (FLAME_HALF_LEN.b + GEO.lenB),
};
const RA = flatten(GEO.routeA);
const RB = flatten(GEO.routeB);
/** Where along its side (0..1) the clean line passes the point p (for "erase your own scaffolding"). */
export const cleanFractionOf = (p: Pt): number => {
  const fa = flatten(FLAME_HALF_A);
  const fb = flatten(FLAME_HALF_B);
  const cands: { d: number; f: number }[] = [];
  const near = (poly: Poly, map: (s: number) => number) => {
    const s = nearestS(poly, p);
    const q = pointAt(poly, s);
    cands.push({ d: Math.hypot(q[0] - p[0], q[1] - p[1]), f: map(s / poly.L) });
  };
  near(fa, (x) => x * CLEAN_SPLIT.a);
  near(fb, (x) => x * CLEAN_SPLIT.b);
  near(RA, (x) => CLEAN_SPLIT.a + x * (1 - CLEAN_SPLIT.a));
  near(RB, (x) => CLEAN_SPLIT.b + x * (1 - CLEAN_SPLIT.b));
  return cands.reduce((m, c) => (c.d < m.d ? c : m), cands[0]).f;
};
export const ANCHOR_CLEAN: number[] = ANCHOR_PTS.map(cleanFractionOf);
export const LOBE_CLEAN: number[] = GEO.lobes.map((l) => cleanFractionOf(l.tip));
export const TANGENT_CLEAN: number[] = GEO.tangents.map(([a, b]) => cleanFractionOf([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]));

// ------------------------------------------------------------------ 05 jméno: kerning profiles
/** Outline x-extent of each letter at N+1 heights through the x-height band (exact line crossings). */
export const KERN_N = 40;
export const KERN_Y: number[] = Array.from({ length: KERN_N + 1 }, (_, j) => M.xHeight + 1.2 + ((M.baseline - 1.2 - (M.xHeight + 1.2)) * j) / KERN_N);
export const LETTER_PROFILES = LETTERS.map((l) => {
  const polys = flattenAll(l.d, 0.3);
  const minX: number[] = [];
  const maxX: number[] = [];
  for (const y of KERN_Y) {
    let lo = Infinity;
    let hi = -Infinity;
    for (const p of polys) {
      for (let i = 0; i < p.pts.length - 1; i++) {
        const a = p.pts[i];
        const b = p.pts[i + 1];
        if ((a[1] - y) * (b[1] - y) <= 0 && a[1] !== b[1]) {
          const x = a[0] + ((y - a[1]) / (b[1] - a[1])) * (b[0] - a[0]);
          lo = Math.min(lo, x);
          hi = Math.max(hi, x);
        }
      }
    }
    minX.push(Number.isFinite(lo) ? lo : l.bbox[0]);
    maxX.push(Number.isFinite(hi) ? hi : l.bbox[2]);
  }
  return { minX, maxX };
});

// ------------------------------------------------------------------ 06 já: where the mascot meets the letters
/** Lowest silhouette points over the a and the r (the folded arm on the a, the foot on the r's shoulder). */
export const CONTACT_L: Pt = [A[0][0] + 1, M.xHeight];
export const CONTACT_R: Pt = [(A[27][0] + A[28][0]) / 2, M.xHeight];

/** The head's glossy highlight stripe: its top end is where the glint lands (04 barva). */
export const HIGHLIGHT_TOP: Pt = (() => {
  const m = /d="M([\d.]+) ([\d.]+)/.exec(LOGO.fills.highlights);
  return m ? [parseFloat(m[1]), parseFloat(m[2])] : [190.8, 73.1];
})();
