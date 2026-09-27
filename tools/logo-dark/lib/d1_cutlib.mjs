// d1_cutlib.mjs - vector + distance-field helpers for the Sparkee dark logo knock-out (cut) variants.
// Coordinates: logo.svg user units (viewBox 0 0 568 292), y down.
// Pipeline for one letter L and mascot silhouette S (see build_d1_cut.mjs):
//   L'  = L \ D_g(S)                         knock-out with an even gap g (exact: dist-to-S minus g)
//   O   = opening(L', r) = D_r(E_r(L'))      rounds every cut corner with radius r, drops parts thinner than 2r
//   far from S (dS >= C) the letter is left exactly as it was (no opening there)
//   islands (outer loops with area < minArea) are dropped
//   splice: every part of the result that lies on the original letter outline is emitted as the ORIGINAL
//   Bezier segments (split with de Casteljau); only the new cut edges + fillets are fitted curves (G1 joins).

// ---------------------------------------------------------------- path parsing
const TOK = /[MmLlHhVvCcZz]|-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g;
export function parsePath(d) {
  const t = d.match(TOK); let i = 0, cmd = null, x = 0, y = 0, sx = 0, sy = 0; const subs = []; let cur = null;
  const num = () => parseFloat(t[i++]);
  const close = () => {
    if (!cur) return;
    if (Math.hypot(x - sx, y - sy) > 1e-9) cur.segs.push({ t: 'L', p: [[x, y], [sx, sy]] });
    subs.push(cur); cur = null; x = sx; y = sy;
  };
  while (i < t.length) {
    if (/[A-Za-z]/.test(t[i])) { cmd = t[i++]; if (cmd === 'Z' || cmd === 'z') { close(); continue; } }
    const c = cmd;
    if (c === 'M' || c === 'm') {
      let nx = num(), ny = num(); if (c === 'm') { nx += x; ny += y; }
      if (cur) close();
      cur = { segs: [] }; x = sx = nx; y = sy = ny; cmd = c === 'M' ? 'L' : 'l';
    } else if (c === 'L' || c === 'l') {
      let nx = num(), ny = num(); if (c === 'l') { nx += x; ny += y; }
      cur.segs.push({ t: 'L', p: [[x, y], [nx, ny]] }); x = nx; y = ny;
    } else if (c === 'H' || c === 'h') {
      let nx = num(); if (c === 'h') nx += x; cur.segs.push({ t: 'L', p: [[x, y], [nx, y]] }); x = nx;
    } else if (c === 'V' || c === 'v') {
      let ny = num(); if (c === 'v') ny += y; cur.segs.push({ t: 'L', p: [[x, y], [x, ny]] }); y = ny;
    } else if (c === 'C' || c === 'c') {
      const p = [num(), num(), num(), num(), num(), num()];
      if (c === 'c') for (let k = 0; k < 6; k += 2) { p[k] += x; p[k + 1] += y; }
      cur.segs.push({ t: 'C', p: [[x, y], [p[0], p[1]], [p[2], p[3]], [p[4], p[5]]] }); x = p[4]; y = p[5];
    } else throw new Error('unsupported path command ' + c);
  }
  if (cur) close();
  // drop zero-length line segments (e.g. "H86.9141" duplicates)
  for (const s of subs) s.segs = s.segs.filter(g => !(g.t === 'L' && Math.hypot(g.p[1][0] - g.p[0][0], g.p[1][1] - g.p[0][1]) < 1e-7));
  return subs;
}

// ---------------------------------------------------------------- bezier helpers
export const ptAt = (s, u) => {
  if (s.t === 'L') return [s.p[0][0] + (s.p[1][0] - s.p[0][0]) * u, s.p[0][1] + (s.p[1][1] - s.p[0][1]) * u];
  const [a, b, c, d] = s.p, m = 1 - u;
  return [m * m * m * a[0] + 3 * m * m * u * b[0] + 3 * m * u * u * c[0] + u * u * u * d[0],
          m * m * m * a[1] + 3 * m * m * u * b[1] + 3 * m * u * u * c[1] + u * u * u * d[1]];
};
export const d1At = (s, u) => {
  if (s.t === 'L') return [s.p[1][0] - s.p[0][0], s.p[1][1] - s.p[0][1]];
  const [a, b, c, d] = s.p, m = 1 - u;
  return [3 * (m * m * (b[0] - a[0]) + 2 * m * u * (c[0] - b[0]) + u * u * (d[0] - c[0])),
          3 * (m * m * (b[1] - a[1]) + 2 * m * u * (c[1] - b[1]) + u * u * (d[1] - c[1]))];
};
const lerp = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
export function splitSeg(s, u0, u1) { // sub-segment of s between params u0 < u1
  if (s.t === 'L') return { t: 'L', p: [ptAt(s, u0), ptAt(s, u1)] };
  const cut = (p, u) => { // returns [left, right]
    const [a, b, c, d] = p; const ab = lerp(a, b, u), bc = lerp(b, c, u), cd = lerp(c, d, u);
    const abc = lerp(ab, bc, u), bcd = lerp(bc, cd, u), m = lerp(abc, bcd, u);
    return [[a, ab, abc, m], [m, bcd, cd, d]];
  };
  let p = s.p;
  if (u1 < 1) p = cut(p, u1)[0];
  if (u0 > 0) p = cut(p, u0 / u1)[1];
  return { t: 'C', p };
}
export const norm = v => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };

// ---------------------------------------------------------------- flattening
// returns {pts:[[x,y]..] closed polyline (no repeat), map:[[segIdx,u]..]} per subpath
export function flatten(sub, step = 0.03) {
  const pts = [], map = [];
  sub.segs.forEach((s, si) => {
    let n = 1;
    if (s.t === 'C') { const [a, b, c, d] = s.p; const L = Math.hypot(b[0] - a[0], b[1] - a[1]) + Math.hypot(c[0] - b[0], c[1] - b[1]) + Math.hypot(d[0] - c[0], d[1] - c[1]); n = Math.max(4, Math.ceil(L / step)); }
    else { const L = Math.hypot(s.p[1][0] - s.p[0][0], s.p[1][1] - s.p[0][1]); n = Math.max(1, Math.ceil(L / step)); }
    for (let k = 0; k < n; k++) { pts.push(ptAt(s, k / n)); map.push([si, k / n]); }
  });
  return { pts, map };
}
export function segsOf(polys) { // Float64Array x0,y0,x1,y1 per edge, for closed polylines
  let n = 0; for (const p of polys) n += p.length;
  const S = new Float64Array(n * 4); let k = 0;
  for (const p of polys) for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; S[k++] = a[0]; S[k++] = a[1]; S[k++] = b[0]; S[k++] = b[1]; }
  return S;
}

// ---------------------------------------------------------------- grid ops
export class Grid {
  constructor(x0, y0, x1, y1, h) { this.h = h; this.x0 = x0; this.y0 = y0; this.nx = Math.ceil((x1 - x0) / h) + 1; this.ny = Math.ceil((y1 - y0) / h) + 1; this.N = this.nx * this.ny; }
  X(i) { return this.x0 + i * this.h; } Y(j) { return this.y0 + j * this.h; }
}
// even-odd scanline fill of closed polylines -> Uint8Array
export function scanFill(G, polys) {
  const M = new Uint8Array(G.N); const edges = [];
  for (const p of polys) for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; if (a[1] !== b[1]) edges.push([a[0], a[1], b[0], b[1]]); }
  for (let j = 0; j < G.ny; j++) {
    const y = G.Y(j); const xs = [];
    for (const e of edges) if ((e[1] > y) !== (e[3] > y)) xs.push(e[0] + (e[2] - e[0]) * (y - e[1]) / (e[3] - e[1]));
    xs.sort((a, b) => a - b);
    for (let m = 0; m + 1 < xs.length; m += 2) {
      let i0 = Math.max(0, Math.ceil((xs[m] - G.x0) / G.h)), i1 = Math.min(G.nx - 1, Math.floor((xs[m + 1] - G.x0) / G.h));
      for (let i = i0; i <= i1; i++) M[j * G.nx + i] ^= 1;
    }
  }
  return M;
}
function dseg2(px, py, S, s) {
  const ax = S[4 * s], ay = S[4 * s + 1], dx = S[4 * s + 2] - ax, dy = S[4 * s + 3] - ay;
  const L = dx * dx + dy * dy; let u = L ? ((px - ax) * dx + (py - ay) * dy) / L : 0; u = u < 0 ? 0 : u > 1 ? 1 : u;
  const qx = ax + u * dx - px, qy = ay + u * dy - py; return qx * qx + qy * qy;
}
// unsigned distance to a set of segments; nearest-segment propagation (vector 8SSEDT) with exact distances
export function distField(G, S, initRad = 2.5) {
  const { nx, ny, h, x0, y0 } = G; const N = G.N;
  const D = new Float64Array(N).fill(Infinity); const I = new Int32Array(N).fill(-1);
  const ns = S.length / 4;
  for (let s = 0; s < ns; s++) {
    const i0 = Math.max(0, Math.floor((Math.min(S[4 * s], S[4 * s + 2]) - x0) / h - initRad)), i1 = Math.min(nx - 1, Math.ceil((Math.max(S[4 * s], S[4 * s + 2]) - x0) / h + initRad));
    const j0 = Math.max(0, Math.floor((Math.min(S[4 * s + 1], S[4 * s + 3]) - y0) / h - initRad)), j1 = Math.min(ny - 1, Math.ceil((Math.max(S[4 * s + 1], S[4 * s + 3]) - y0) / h + initRad));
    for (let j = j0; j <= j1; j++) { const py = y0 + j * h; for (let i = i0; i <= i1; i++) { const k = j * nx + i; const d = dseg2(x0 + i * h, py, S, s); if (d < D[k]) { D[k] = d; I[k] = s; } } }
  }
  const tryN = (k, px, py, kn) => { const s = I[kn]; if (s < 0 || s === I[k]) return; const d = dseg2(px, py, S, s); if (d < D[k]) { D[k] = d; I[k] = s; } };
  for (let pass = 0; pass < 2; pass++) {
    for (let j = 0; j < ny; j++) {
      const py = y0 + j * h;
      for (let i = 0; i < nx; i++) { const k = j * nx + i, px = x0 + i * h; if (i > 0) tryN(k, px, py, k - 1); if (j > 0) { tryN(k, px, py, k - nx); if (i > 0) tryN(k, px, py, k - nx - 1); if (i < nx - 1) tryN(k, px, py, k - nx + 1); } }
      for (let i = nx - 2; i >= 0; i--) { const k = j * nx + i; tryN(k, x0 + i * h, py, k + 1); }
    }
    for (let j = ny - 1; j >= 0; j--) {
      const py = y0 + j * h;
      for (let i = nx - 1; i >= 0; i--) { const k = j * nx + i, px = x0 + i * h; if (i < nx - 1) tryN(k, px, py, k + 1); if (j < ny - 1) { tryN(k, px, py, k + nx); if (i < nx - 1) tryN(k, px, py, k + nx + 1); if (i > 0) tryN(k, px, py, k + nx - 1); } }
      for (let i = 1; i < nx; i++) { const k = j * nx + i; tryN(k, x0 + i * h, py, k - 1); }
    }
  }
  for (let k = 0; k < N; k++) D[k] = Math.sqrt(D[k]);
  return D;
}
// marching squares of F at level 0 (F > 0 inside). Returns closed loops with the inside on the visual left
// (y-down screen coords): outer loops have NEGATIVE shoelace area, holes positive.
export function march(G, F) {
  const { nx, ny, h, x0, y0 } = G; const segA = [], segB = [];
  const eid = (i, j, v) => 2 * (j * nx + i) + v; // v=0 horizontal edge (i,j)-(i+1,j), v=1 vertical (i,j)-(i,j+1)
  const pos = new Map();
  const P = (i, j, v) => {
    const id = eid(i, j, v); if (pos.has(id)) return id;
    const a = F[j * nx + i], b = v ? F[(j + 1) * nx + i] : F[j * nx + i + 1]; const u = a / (a - b);
    pos.set(id, v ? [x0 + i * h, y0 + (j + u) * h] : [x0 + (i + u) * h, y0 + j * h]); return id;
  };
  for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const a = F[j * nx + i] > 0, b = F[j * nx + i + 1] > 0, c = F[(j + 1) * nx + i + 1] > 0, d = F[(j + 1) * nx + i] > 0;
    const code = (a ? 1 : 0) | (b ? 2 : 0) | (c ? 4 : 0) | (d ? 8 : 0); if (code === 0 || code === 15) continue;
    const T = () => P(i, j, 0), R = () => P(i + 1, j, 1), B = () => P(i, j + 1, 0), Lf = () => P(i, j, 1);
    const add = (e1, e2) => { segA.push(e1); segB.push(e2); };
    // orientation: directed so that inside (F>0) is on the left in y-down coords (i.e. clockwise visually = positive area)
    switch (code) {
      case 1: add(Lf(), T()); break; case 2: add(T(), R()); break; case 3: add(Lf(), R()); break;
      case 4: add(R(), B()); break; case 6: add(T(), B()); break; case 7: add(Lf(), B()); break;
      case 8: add(B(), Lf()); break; case 9: add(B(), T()); break; case 11: add(B(), R()); break;
      case 12: add(R(), Lf()); break; case 13: add(R(), T()); break; case 14: add(T(), Lf()); break;
      case 5: { const ctr = (F[j * nx + i] + F[j * nx + i + 1] + F[(j + 1) * nx + i + 1] + F[(j + 1) * nx + i]) > 0;
        if (ctr) { add(Lf(), B()); add(R(), T()); } else { add(Lf(), T()); add(R(), B()); } break; }
      case 10: { const ctr = (F[j * nx + i] + F[j * nx + i + 1] + F[(j + 1) * nx + i + 1] + F[(j + 1) * nx + i]) > 0;
        if (ctr) { add(T(), Lf()); add(B(), R()); } else { add(T(), R()); add(B(), Lf()); } break; }
    }
  }
  const next = new Map(); segA.forEach((e, k) => next.set(e, segB[k]));
  const used = new Set(); const loops = [];
  for (const start of segA) {
    if (used.has(start)) continue; const loop = []; let e = start; let guard = 0;
    while (!used.has(e) && guard++ < 1e7) { used.add(e); loop.push(pos.get(e)); e = next.get(e); if (e === undefined) break; }
    if (loop.length > 2) loops.push(loop);
  }
  return loops;
}
export const area = p => { let a = 0; for (let i = 0; i < p.length; i++) { const q = p[i], r = p[(i + 1) % p.length]; a += q[0] * r[1] - r[0] * q[1]; } return a / 2; };

// ---------------------------------------------------------------- Schneider fit (fixed end tangents)
const sub2 = (a, b) => [a[0] - b[0], a[1] - b[1]], add2 = (a, b) => [a[0] + b[0], a[1] + b[1]], mul2 = (a, s) => [a[0] * s, a[1] * s], dot2 = (a, b) => a[0] * b[0] + a[1] * b[1];
const dist2 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const bz = (c, t) => ptAt({ t: 'C', p: c }, t);
const bzd1 = (c, t) => d1At({ t: 'C', p: c }, t);
const bzd2 = (c, t) => [6 * ((1 - t) * (c[2][0] - 2 * c[1][0] + c[0][0]) + t * (c[3][0] - 2 * c[2][0] + c[1][0])), 6 * ((1 - t) * (c[2][1] - 2 * c[1][1] + c[0][1]) + t * (c[3][1] - 2 * c[2][1] + c[1][1]))];
function chordParams(pts) { const u = [0]; for (let i = 1; i < pts.length; i++) u.push(u[i - 1] + dist2(pts[i], pts[i - 1])); return u.map(x => x / u[u.length - 1]); }
function generate(pts, u, t0, t1) {
  const P0 = pts[0], P3 = pts[pts.length - 1], th2 = mul2(t1, -1); let c00 = 0, c01 = 0, c11 = 0, x0 = 0, x1 = 0;
  pts.forEach((p, k) => { const t = u[k], m = 1 - t, b0 = m * m * m, b1 = 3 * m * m * t, b2 = 3 * m * t * t, b3 = t * t * t;
    const A1 = mul2(t0, b1), A2 = mul2(th2, b2); c00 += dot2(A1, A1); c01 += dot2(A1, A2); c11 += dot2(A2, A2);
    const tmp = sub2(p, add2(mul2(P0, b0 + b1), mul2(P3, b2 + b3))); x0 += dot2(A1, tmp); x1 += dot2(A2, tmp); });
  const det = c00 * c11 - c01 * c01, seg = dist2(P0, P3); let a1, a2;
  if (Math.abs(det) > 1e-12) { a1 = (x0 * c11 - x1 * c01) / det; a2 = (c00 * x1 - c01 * x0) / det; } else a1 = a2 = seg / 3;
  if (a1 < 1e-6 * seg || a2 < 1e-6 * seg) a1 = a2 = seg / 3;
  return [P0, add2(P0, mul2(t0, a1)), add2(P3, mul2(th2, a2)), P3];
}
function maxErr(c, pts, u) { let m = 0, idx = pts.length >> 1; pts.forEach((p, k) => { const d = dist2(bz(c, u[k]), p); if (d > m) { m = d; idx = k; } }); return [m, idx]; }
function reparam(c, pts, u) { return pts.map((p, k) => { const t = u[k], q = bz(c, t), d1 = bzd1(c, t), d2 = bzd2(c, t); const num = (q[0] - p[0]) * d1[0] + (q[1] - p[1]) * d1[1]; const den = d1[0] * d1[0] + d1[1] * d1[1] + (q[0] - p[0]) * d2[0] + (q[1] - p[1]) * d2[1]; return Math.abs(den) > 1e-12 ? Math.min(1, Math.max(0, t - num / den)) : t; }); }
export function fitCubic(pts, t0, t1, err) {
  if (pts.length === 2) { const s = dist2(pts[0], pts[1]) / 3; return [[pts[0], add2(pts[0], mul2(t0, s)), sub2(pts[1], mul2(t1, s)), pts[1]]]; }
  let u = chordParams(pts); let c = generate(pts, u, t0, t1); let [e, i] = maxErr(c, pts, u);
  if (e < err) return [c];
  if (e < err * 8) for (let it = 0; it < 30; it++) { u = reparam(c, pts, u); c = generate(pts, u, t0, t1); [e, i] = maxErr(c, pts, u); if (e < err) return [c]; }
  i = Math.max(1, Math.min(pts.length - 2, i));
  const tc = norm(sub2(pts[Math.min(i + 2, pts.length - 1)], pts[Math.max(i - 2, 0)]));
  return fitCubic(pts.slice(0, i + 1), t0, tc, err).concat(fitCubic(pts.slice(i), tc, t1, err));
}
export function resample(pts, step) {
  const s = [0]; for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + dist2(pts[i], pts[i - 1]));
  const L = s[s.length - 1], n = Math.max(2, Math.round(L / step) + 1), out = []; let j = 0;
  for (let k = 0; k < n; k++) { const t = L * k / (n - 1); while (j < s.length - 2 && s[j + 1] < t) j++; const sg = s[j + 1] - s[j], u = sg > 0 ? (t - s[j]) / sg : 0; out.push(lerp(pts[j], pts[j + 1], u)); }
  return out;
}

// ---------------------------------------------------------------- projection onto an original path
export class Projector {
  constructor(subs, step = 0.02) {
    this.subs = subs; this.fl = subs.map(s => flatten(s, step)); this.B = 0.5; this.bk = new Map();
    this.fl.forEach((f, si) => f.pts.forEach((p, k) => { const q = f.pts[(k + 1) % f.pts.length];
      const i0 = Math.floor(Math.min(p[0], q[0]) / this.B), i1 = Math.floor(Math.max(p[0], q[0]) / this.B), j0 = Math.floor(Math.min(p[1], q[1]) / this.B), j1 = Math.floor(Math.max(p[1], q[1]) / this.B);
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const key = i * 100000 + j; if (!this.bk.has(key)) this.bk.set(key, []); this.bk.get(key).push([si, k]); } }));
  }
  // nearest point on the true curves: {sub, seg, u, q, d}
  project(p, maxd = 2) {
    let best = null, bd = Infinity; const R = Math.ceil(maxd / this.B), bi = Math.floor(p[0] / this.B), bj = Math.floor(p[1] / this.B);
    for (let a = bi - R; a <= bi + R; a++) for (let b = bj - R; b <= bj + R; b++) { const L = this.bk.get(a * 100000 + b); if (!L) continue;
      for (const [si, k] of L) { const f = this.fl[si], A = f.pts[k], Bq = f.pts[(k + 1) % f.pts.length];
        const dx = Bq[0] - A[0], dy = Bq[1] - A[1], LL = dx * dx + dy * dy; let u = LL ? ((p[0] - A[0]) * dx + (p[1] - A[1]) * dy) / LL : 0; u = Math.max(0, Math.min(1, u));
        const d = Math.hypot(A[0] + u * dx - p[0], A[1] + u * dy - p[1]); if (d < bd) { bd = d; best = [si, k, u]; } } }
    if (!best) return null;
    const [si, k, u] = best; const f = this.fl[si]; const [seg, u0] = f.map[k]; const k2 = (k + 1) % f.pts.length;
    let [seg2, u1] = f.map[k2]; if (seg2 !== seg) u1 = 1;
    let t = u0 + (u1 - u0) * u; const S = this.subs[si].segs[seg];
    for (let it = 0; it < 30; it++) { // Newton on (B(t)-p).B'(t) = 0
      const q = ptAt(S, t), d1 = d1At(S, t); const e = [q[0] - p[0], q[1] - p[1]];
      const h = 1e-6; const qa = ptAt(S, Math.min(1, t + h)), qb = ptAt(S, Math.max(0, t - h));
      const d2 = [(qa[0] - 2 * q[0] + qb[0]) / (h * h), (qa[1] - 2 * q[1] + qb[1]) / (h * h)];
      const num = e[0] * d1[0] + e[1] * d1[1], den = d1[0] * d1[0] + d1[1] * d1[1] + e[0] * d2[0] + e[1] * d2[1];
      if (!(Math.abs(den) > 1e-12)) break; const nt = Math.max(0, Math.min(1, t - num / den)); if (Math.abs(nt - t) < 1e-12) { t = nt; break; } t = nt;
    }
    const q = ptAt(S, t); return { sub: si, seg, u: t, q, d: Math.hypot(q[0] - p[0], q[1] - p[1]) };
  }
  tangent(sub, seg, u) { return norm(d1At(this.subs[sub].segs[seg], Math.min(1 - 1e-9, Math.max(1e-9, u)))); }
}

// original sub-path piece from (s1,u1) forward to (s2,u2)
export function piece(sub, s1, u1, s2, u2) {
  const n = sub.segs.length, out = [];
  if (s1 === s2 && u2 >= u1) { if (u2 - u1 > 1e-9) out.push(splitSeg(sub.segs[s1], u1, u2)); return out; }
  if (u1 < 1 - 1e-9) out.push(splitSeg(sub.segs[s1], u1, 1));
  for (let s = (s1 + 1) % n; s !== s2; s = (s + 1) % n) out.push(sub.segs[s]);
  if (u2 > 1e-9) out.push(splitSeg(sub.segs[s2], 0, u2));
  return out;
}
const f3 = v => { const s = v.toFixed(3).replace(/\.?0+$/, ''); return s === '-0' ? '0' : s; };
export function toD(loops) { // loops: [{start:[x,y], segs:[...]}]
  let d = '';
  for (const L of loops) {
    d += `M${f3(L.start[0])} ${f3(L.start[1])}`;
    for (const s of L.segs) d += s.t === 'L' ? `L${f3(s.p[1][0])} ${f3(s.p[1][1])}` : `C${f3(s.p[1][0])} ${f3(s.p[1][1])} ${f3(s.p[2][0])} ${f3(s.p[2][1])} ${f3(s.p[3][0])} ${f3(s.p[3][1])}`;
    d += 'Z';
  }
  return d;
}
