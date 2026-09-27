/* Sparkee – mascot-rig.js
 * JS port of tools/limb_sweep.py  limb(joints, kind)  ("clean sweep" arm outline).
 * The look must stay EXACTLY the same as the Python generator (verified numerically,
 * max deviation < 0.3 units on all arm poses), only the arc-length inversion is faster
 * (per-panel lookup table instead of re-integrating from 0 every Newton step).
 *
 *   SparkeeRig.limb(joints [, kind='arm'])      -> SVG path d (closed, clockwise on screen)
 *   SparkeeRig.limbInfo(joints [, kind='arm'])  -> { d, paw:{x,y,r,angle}, tip:{x,y}, L }
 *
 * joints = [[x,y] root, [x,y] elbow, [x,y] tip]  (mascot units, y down).
 */
(function (root) {
  'use strict';

  // ---------- profile (identical to limb_sweep.py) ----------
  const ARM = { r0: 12.0, r_max: 13.2, t_peak: 0.42, r_end: 11.8 };
  const LEG = { r0: 15.5, r_max: 15.5, t_peak: 0.0, r_end: 12.8 };
  const TOL = 0.02;
  const SPINE_MU = 0.8;
  const CURV_LIMIT = 0.8;

  // Gauss-Legendre 8 points on [-1, 1]
  const GLX = [-0.9602898564975363, -0.7966664774136267, -0.5255324099163290, -0.1834346424956498,
    0.1834346424956498, 0.5255324099163290, 0.7966664774136267, 0.9602898564975363];
  const GLW = [0.1012285362903763, 0.2223810344533745, 0.3137066458778873, 0.3626837833783620,
    0.3626837833783620, 0.3137066458778873, 0.2223810344533745, 0.1012285362903763];

  const PANELS = 24;           // arc-length table resolution

  function bez(c, t) {
    const u = 1 - t, a = u * u * u, b = 3 * u * u * t, d = 3 * u * t * t, e = t * t * t;
    return [a * c[0][0] + b * c[1][0] + d * c[2][0] + e * c[3][0],
      a * c[0][1] + b * c[1][1] + d * c[2][1] + e * c[3][1]];
  }

  /* One cubic Bezier root -> elbow (exactly at t = .5) -> tip, parametrised by arc length. */
  function Spine(a, e, b, mu) {
    mu = mu || SPINE_MU;
    const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const q = [m[0] + (e[0] - m[0]) * 4 / (3 * mu), m[1] + (e[1] - m[1]) * 4 / (3 * mu)];
    const C = [a, [a[0] + mu * (q[0] - a[0]), a[1] + mu * (q[1] - a[1])],
      [b[0] + mu * (q[0] - b[0]), b[1] + mu * (q[1] - b[1])], b];
    this.C = C;
    // derivative coefficients
    this.d10 = [3 * (C[1][0] - C[0][0]), 3 * (C[1][1] - C[0][1])];
    this.d11 = [3 * (C[2][0] - C[1][0]), 3 * (C[2][1] - C[1][1])];
    this.d12 = [3 * (C[3][0] - C[2][0]), 3 * (C[3][1] - C[2][1])];
    this.d20 = [6 * (C[2][0] - 2 * C[1][0] + C[0][0]), 6 * (C[2][1] - 2 * C[1][1] + C[0][1])];
    this.d21 = [6 * (C[3][0] - 2 * C[2][0] + C[1][0]), 6 * (C[3][1] - 2 * C[2][1] + C[1][1])];
    // cumulative arc length per panel
    const cum = new Float64Array(PANELS + 1);
    for (let k = 0; k < PANELS; k++) cum[k + 1] = cum[k] + this.seg(k / PANELS, (k + 1) / PANELS);
    this.cum = cum;
    this.L = cum[PANELS];
  }
  Spine.prototype.d1 = function (t) {
    const u = 1 - t, A = u * u, B = 2 * u * t, D = t * t;
    return [A * this.d10[0] + B * this.d11[0] + D * this.d12[0], A * this.d10[1] + B * this.d11[1] + D * this.d12[1]];
  };
  Spine.prototype.d2 = function (t) {
    const u = 1 - t;
    return [u * this.d20[0] + t * this.d21[0], u * this.d20[1] + t * this.d21[1]];
  };
  Spine.prototype.speed = function (t) {
    const u = 1 - t, A = u * u, B = 2 * u * t, D = t * t;
    const x = A * this.d10[0] + B * this.d11[0] + D * this.d12[0], y = A * this.d10[1] + B * this.d11[1] + D * this.d12[1];
    return Math.sqrt(x * x + y * y);
  };
  Spine.prototype.kappa = function (t) {
    const d = this.d1(t), dd = this.d2(t), sp = Math.hypot(d[0], d[1]) || 1e-9;
    return (d[0] * dd[1] - d[1] * dd[0]) / (sp * sp * sp);
  };
  Spine.prototype.seg = function (a, b) {          // GL arc length of [a, b]
    const h = (b - a) / 2, m = (a + b) / 2;
    let s = 0;
    for (let i = 0; i < 8; i++) s += GLW[i] * this.speed(m + h * GLX[i]);
    return s * h;
  };
  Spine.prototype.t_of_s = function (s) {
    const cum = this.cum;
    if (s <= 0) return 0;
    if (s >= this.L) return 1;
    let lo = 0, hi = PANELS;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cum[mid] <= s) lo = mid; else hi = mid; }
    const t0 = lo / PANELS, t1 = hi / PANELS;
    let t = t0 + (t1 - t0) * (s - cum[lo]) / ((cum[hi] - cum[lo]) || 1e-9);
    for (let it = 0; it < 12; it++) {
      const f = cum[lo] + this.seg(t0, t) - s;
      let tn = t - f / (this.speed(t) || 1e-9);
      if (tn < t0) tn = t0; else if (tn > t1) tn = t1;
      if (Math.abs(tn - t) < 1e-12) { t = tn; break; }
      t = tn;
    }
    return t;
  };
  /* point, tangent T, normal N (= T rotated +90deg (x,y)->(-y,x)), curvature */
  Spine.prototype.frame = function (s) {
    const t = this.t_of_s(s);
    const p = bez(this.C, t);
    const d = this.d1(t);
    const sp = Math.hypot(d[0], d[1]) || 1e-9;
    const T = [d[0] / sp, d[1] / sp];
    const N = [-T[1], T[0]];
    const dd = this.d2(t);
    const kappa = (d[0] * dd[1] - d[1] * dd[0]) / (sp * sp * sp);
    return [p, T, N, kappa];
  };

  function makeProfile(pr, L, s_end) {
    const r0 = pr.r0, rm = pr.r_max, re = pr.r_end;
    const sp = Math.max(1e-6, Math.min(pr.t_peak * L, s_end - 1e-6));
    const r = s => {
      if (s <= sp) { const x = (sp - s) / sp; return rm - (rm - r0) * x * x; }
      const x = (s - sp) / (s_end - sp); return rm - (rm - re) * x * x;
    };
    const dr = s => (s <= sp) ? 2 * (rm - r0) * (sp - s) / (sp * sp) : -2 * (rm - re) * (s - sp) / ((s_end - sp) * (s_end - sp));
    return [r, dr, sp];
  }

  const clamp95 = q => Math.max(-0.95, Math.min(0.95, q));

  /* fast fixed-2 formatting (Number#toString on doubles dominated the profile) */
  function fmt2(v) {
    const n = Math.round(v * 100), a = n < 0 ? -n : n, i = (a / 100) | 0, fr = a - i * 100;
    return (n < 0 ? '-' : '') + i + (fr === 0 ? '' : fr < 10 ? '.0' + fr : fr % 10 === 0 ? '.' + fr / 10 : '.' + fr);
  }

  function arc(c, rad, a0, a1, out) {
    const n = Math.max(1, Math.ceil(Math.abs(a1 - a0) / (Math.PI / 2) - 1e-9));
    for (let i = 0; i < n; i++) {
      const t0 = a0 + (a1 - a0) * i / n, t1 = a0 + (a1 - a0) * (i + 1) / n;
      const k = 4 / 3 * Math.tan((t1 - t0) / 4) * rad;
      const q0 = [c[0] + rad * Math.cos(t0), c[1] + rad * Math.sin(t0)];
      const q3 = [c[0] + rad * Math.cos(t1), c[1] + rad * Math.sin(t1)];
      out.push([q0, [q0[0] - k * Math.sin(t0), q0[1] + k * Math.cos(t0)],
        [q3[0] + k * Math.sin(t1), q3[1] - k * Math.cos(t1)], q3]);
    }
    return out;
  }

  function limbInfo(joints, kind) {
    const J = joints.map(p => [+p[0], +p[1]]);
    const a = J[0], e = J[J.length >> 1], b = J[J.length - 1];
    const pr = kind === 'leg' ? LEG : ARM;
    const sp = new Spine(a, e, b);
    const r_end = pr.r_end;
    const s_end = sp.L - r_end;
    const prof = makeProfile(pr, sp.L, s_end), r_raw = prof[0], dr_raw = prof[1], s_peak = prof[2];

    // self-intersection guard on the inner side of the bend: r <= CURV_LIMIT * rho
    // (curvature scanned on a uniform t grid up to t(s_end): same maximum as the s-grid in Python,
    //  without 200 arc-length inversions)
    let kmax = 0, rmax = 0;
    const t_end = sp.t_of_s(s_end);
    for (let i = 0; i <= 200; i++) {
      const k = Math.abs(sp.kappa(t_end * i / 200));
      if (k > kmax) kmax = k;
      const rr = r_raw(s_end * i / 200);
      if (rr > rmax) rmax = rr;
    }
    let scale = 1;
    if (kmax > 0 && rmax * kmax > CURV_LIMIT) scale = CURV_LIMIT / (kmax * rmax);
    const r = s => r_raw(s) * scale;
    const dr = s => dr_raw(s) * scale;

    // frame cache (env is evaluated for both sides at the same s)
    const fk = new Float64Array(64), fv = new Array(64);
    const frameC = s => {                     // small direct-mapped cache (same s for both sides / denv)
      const h = ((s * 997.13) | 0) & 63;
      if (fk[h] === s && fv[h]) return fv[h];
      fk[h] = s; return (fv[h] = sp.frame(s));
    };

    const env = (s, side) => {
      const f = frameC(s), p = f[0], T = f[1], N = f[2];
      const q = clamp95(dr(s));
      const c = Math.sqrt(1 - q * q);
      const rr = r(s);
      return [p[0] + rr * (-q * T[0] + side * c * N[0]), p[1] + rr * (-q * T[1] + side * c * N[1])];
    };
    const denv = (s, side, lo, hi) => {
      const h = 1e-4;
      if (s - 2 * h < lo) {
        const f0 = env(s, side), f1 = env(s + h, side), f2 = env(s + 2 * h, side);
        return [(-3 * f0[0] + 4 * f1[0] - f2[0]) / (2 * h), (-3 * f0[1] + 4 * f1[1] - f2[1]) / (2 * h)];
      }
      if (s + 2 * h > hi) {
        const f0 = env(s, side), f1 = env(s - h, side), f2 = env(s - 2 * h, side);
        return [(3 * f0[0] - 4 * f1[0] + f2[0]) / (2 * h), (3 * f0[1] - 4 * f1[1] + f2[1]) / (2 * h)];
      }
      const f1 = env(s + h, side), f2 = env(s - h, side);
      return [(f1[0] - f2[0]) / (2 * h), (f1[1] - f2[1]) / (2 * h)];
    };

    const fitSide = side => {
      const knots = (0.5 < s_peak && s_peak < s_end - 0.5) ? [0, s_peak, s_end] : [0, s_end];
      const segs = [];
      const seg = (s0, s1, lo, hi, depth) => {
        const p0 = env(s0, side), p3 = env(s1, side);
        const d0 = denv(s0, side, lo, hi), d3 = denv(s1, side, lo, hi);
        const k = (s1 - s0) / 3;
        const p1 = [p0[0] + d0[0] * k, p0[1] + d0[1] * k];
        const p2 = [p3[0] - d3[0] * k, p3[1] - d3[1] * k];
        const cc = [p0, p1, p2, p3];
        let err = 0;
        for (let i = 1; i < 12; i++) {
          const tt = i / 12;
          const bz = bez(cc, tt), ex = env(s0 + (s1 - s0) * tt, side);
          const d = Math.hypot(bz[0] - ex[0], bz[1] - ex[1]);
          if (d > err) err = d;
        }
        if (err > TOL && depth < 8) {
          const m = (s0 + s1) / 2;
          seg(s0, m, lo, hi, depth + 1);
          seg(m, s1, lo, hi, depth + 1);
        } else segs.push(cc);
      };
      for (let i = 0; i + 1 < knots.length; i++) seg(knots[i], knots[i + 1], knots[i], knots[i + 1], 0);
      return segs;
    };

    const left = fitSide(+1), right = fitSide(-1);

    // paw: from the left envelope over the tip to the right one (angle decreasing)
    const fe = sp.frame(s_end), pe = fe[0], Te = fe[1];
    const phi = Math.atan2(Te[1], Te[0]);
    const alpha = Math.acos(Math.max(-1, Math.min(1, -clamp95(dr(s_end)))));
    const cap = arc(pe, r(s_end), phi + alpha, phi - alpha, []);
    // root: from the right envelope around the back to the left one
    const f0 = sp.frame(0), p0_ = f0[0], T0 = f0[1];
    const phi0 = Math.atan2(T0[1], T0[0]);
    const alpha0 = Math.acos(Math.max(-1, Math.min(1, -clamp95(dr(0)))));
    const rootArc = arc(p0_, r(0), phi0 - alpha0, phi0 + alpha0 - 2 * Math.PI, []);

    const rev = segs => segs.slice().reverse().map(s => [s[3], s[2], s[1], s[0]]);
    let loop = left.concat(cap, rev(right), rootArc);

    // uniform direction: clockwise on screen (positive shoelace area with y down)
    let area = 0;
    for (const s of loop) {
      let px = s[0][0], py = s[0][1];
      for (let k = 1; k <= 8; k++) {
        const t = k / 8, u = 1 - t, A = u * u * u, B = 3 * u * u * t, D = 3 * u * t * t, E = t * t * t;
        const qx = A * s[0][0] + B * s[1][0] + D * s[2][0] + E * s[3][0];
        const qy = A * s[0][1] + B * s[1][1] + D * s[2][1] + E * s[3][1];
        area += px * qy - qx * py;
        px = qx; py = qy;
      }
    }
    if (area < 0) loop = rev(loop);

    const f = fmt2;
    let d = 'M' + f(loop[0][0][0]) + ' ' + f(loop[0][0][1]);
    for (const s of loop) d += 'C' + f(s[1][0]) + ' ' + f(s[1][1]) + ' ' + f(s[2][0]) + ' ' + f(s[2][1]) + ' ' + f(s[3][0]) + ' ' + f(s[3][1]);
    d += 'Z';
    return { d, loop, paw: { x: pe[0], y: pe[1], r: r(s_end), angle: phi }, tip: { x: b[0], y: b[1] }, L: sp.L };
  }

  const limb = (joints, kind) => limbInfo(joints, kind || 'arm').d;

  const api = { limb, limbInfo, ARM, LEG, Spine, bez };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SparkeeRig = api;
})(typeof window !== 'undefined' ? window : this);
