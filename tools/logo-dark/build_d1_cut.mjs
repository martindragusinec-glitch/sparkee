// build_d1_cut.mjs - knock-out (cut) letters around the mascot silhouette, for the dark logo variants.
// usage: node build_d1_cut.mjs --g 2.32 --r 2.32 [--h 0.03] [--min-area 12] [--eps 0.004] [--out data/cut_xxx.json]
//   g  = gap between mascot silhouette (incl. its ink outline) and the letters, in logo units
//   r  = radius of the rounded letter ends where a letter is cut (morphological opening radius)
// Output JSON: { g, r, letters: {s,p,a,r,k,e1,e2: d}, changed: [...], checks: {...} }
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
import { parsePath, flatten, segsOf, Grid, scanFill, distField, march, area, Projector, piece, fitCubic, resample, norm, toD, ptAt } from './lib/d1_cutlib.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url));
if (process.argv.includes('--help') || process.argv.includes('-h')) { console.log('usage: node build_d1_cut.mjs --g <gap> --r <radius> [--h 0.025] [--eps 0.003] [--tol 0.005] [--min-area 12] [--out data/x.json]\nD1 final: node build_d1_cut.mjs --g 2.32 --r 2.9 --h 0.025 --eps 0.003 --tol 0.005 --out data/cut_D1_g2.32_r2.9.json\n          node assemble_d1.mjs data/cut_D1_g2.32_r2.9.json variants/D1-cut-clean.svg'); process.exit(0); }
const A = Object.fromEntries(process.argv.slice(2).join(' ').split('--').filter(Boolean).map(s => { const [k, ...v] = s.trim().split(/\s+/); return [k, v.join(' ')]; }));
const g = +(A.g ?? 2.32), r = +(A.r ?? g), h = +(A.h ?? 0.03), minArea = +(A['min-area'] ?? 12), eps = +(A.eps ?? 0.004), tol = +(A.tol ?? 0.008);
const OUT = A.out || path.join(HERE, 'data', `cut_g${g}_r${r}.json`);

const lettersSvg = fs.readFileSync(path.join(HERE, 'parts', 'letters.svg'), 'utf8');
const LET = Object.fromEntries([...lettersSvg.matchAll(/<path id="letter-([^"]+)" d="([^"]+)"/g)].map(m => [m[1], m[2]]));
const geo = JSON.parse(fs.readFileSync(path.join(HERE, 'geometry.json'), 'utf8'));
const S = parsePath(geo.silhouette);
const Spts = S.map(s => flatten(s, 0.02).pts);
const Ssegs = segsOf(Spts);
const bboxOf = polys => { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const p of polys) for (const q of p) { x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); } return [x0, y0, x1, y1]; };
const SB = bboxOf(Spts);
const C = g + 2 * r + 1.5; // beyond this distance from S nothing is touched

function minDistPolys(P, Q) { let m = Infinity; const seg = segsOf(Q); for (const p of P) for (const q of p) for (let s = 0; s < seg.length / 4; s++) { const ax = seg[4 * s], ay = seg[4 * s + 1], dx = seg[4 * s + 2] - ax, dy = seg[4 * s + 3] - ay, L = dx * dx + dy * dy; let u = L ? ((q[0] - ax) * dx + (q[1] - ay) * dy) / L : 0; u = Math.max(0, Math.min(1, u)); m = Math.min(m, Math.hypot(ax + u * dx - q[0], ay + u * dy - q[1])); } return m; }

function cornerSplit(pts) { // split a polyline at sharp corners (turn > 28 deg within 0.2 units)
  const n = pts.length, w = 4, idx = [];
  const ang = new Array(n).fill(0);
  for (let i = w; i < n - w; i++) { const a = norm([pts[i][0] - pts[i - w][0], pts[i][1] - pts[i - w][1]]), b = norm([pts[i + w][0] - pts[i][0], pts[i + w][1] - pts[i][1]]); ang[i] = Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1]))) * 180 / Math.PI; }
  for (let i = w; i < n - w; i++) if (ang[i] > 28 && ang[i] >= ang[i - 1] && ang[i] > ang[i + 1]) idx.push(i);
  return { idx, maxAng: Math.max(0, ...ang) };
}
function fitRun(pts, t0, t1, tol) {
  const P = resample(pts, 0.05);
  const { idx } = cornerSplit(P);
  const cuts = [0, ...idx, P.length - 1]; let out = [];
  for (let k = 0; k + 1 < cuts.length; k++) {
    const part = P.slice(cuts[k], cuts[k + 1] + 1);
    const a = k === 0 ? t0 : norm([part[3][0] - part[0][0], part[3][1] - part[0][1]]);
    const b = k === cuts.length - 2 ? t1 : norm([part[part.length - 1][0] - part[part.length - 4][0], part[part.length - 1][1] - part[part.length - 4][1]]);
    out = out.concat(fitCubic(part, a, b, tol));
  }
  return { cubics: out.map(c => ({ t: 'C', p: c, fit: true })), corners: idx.length };
}

function cutLetter(name, d) {
  const subs = parsePath(d);
  const Lpts = subs.map(s => flatten(s, 0.02).pts);
  const LB = bboxOf(Lpts);
  const overlapBox = !(LB[2] < SB[0] - C || LB[0] > SB[2] + C || LB[3] < SB[1] - C || LB[1] > SB[3] + C);
  const md = overlapBox ? minDistPolys(Lpts.map(p => p.filter((_, i) => i % 4 === 0)), Spts) : Infinity;
  if (md > g + r + 0.5) return { d, changed: false, minDistToS: md };
  const G = new Grid(LB[0] - 1, LB[1] - 1, LB[2] + 1, LB[3] + 1, h);
  const inL = scanFill(G, Lpts), inS = scanFill(G, Spts);
  const dL = distField(G, segsOf(Lpts)), dS = distField(G, Ssegs);
  const N = G.N, fE = new Float64Array(N);
  for (let k = 0; k < N; k++) { const inLp = inL[k] && !inS[k] && dS[k] > g; fE[k] = inLp ? Math.min(dL[k], dS[k] - g) - r : -(r + 1); }
  const Eloops = march(G, fE);
  const dE = distField(G, segsOf(Eloops));
  const F = new Float64Array(N);
  for (let k = 0; k < N; k++) {
    if (!inS[k] && dS[k] >= C) F[k] = inL[k] ? dL[k] : -dL[k];
    else F[k] = fE[k] > 0 ? r + dE[k] : r - dE[k];
    if (F[k] === 0) F[k] = 1e-9;
  }
  let loops = march(G, F);
  const info = loops.map(p => ({ area: area(p), n: p.length, bbox: bboxOf([p]) }));
  const dropped = [];
  loops = loops.filter((p, i) => { const a = info[i].area; if (a < 0 && -a < minArea) { dropped.push({ area: -a, bbox: info[i].bbox.map(v => +v.toFixed(2)) }); return false; } return true; });
  // splice: original segments where the result lies on the original outline, fitted curves elsewhere
  const proj = new Projector(subs, 0.02);
  const outLoops = []; const runsInfo = [];
  for (let P of loops) {
    let pr = P.map(p => proj.project(p, 1.5));
    // far from the mascot the result IS the original outline: accept marching-squares noise at the letter's own sharp corners
    const dSat = p => { const i = Math.round((p[0] - G.x0) / h), j = Math.round((p[1] - G.y0) / h); return dS[Math.max(0, Math.min(G.ny - 1, j)) * G.nx + Math.max(0, Math.min(G.nx - 1, i))]; };
    let on = pr.map((q, k) => !!q && (q.d < eps || (q.d < 0.05 && dSat(P[k]) > C - 0.3)));
    // orientation vs original
    let vote = 0; for (let k = 1; k < P.length - 1; k++) if (on[k] && on[k - 1] && on[k + 1]) { const t = proj.tangent(pr[k].sub, pr[k].seg, pr[k].u); vote += Math.sign((P[k + 1][0] - P[k - 1][0]) * t[0] + (P[k + 1][1] - P[k - 1][1]) * t[1]); }
    if (vote < 0) { P = P.slice().reverse(); pr = pr.slice().reverse(); on = on.slice().reverse(); }
    const n = P.length;
    // clean on-runs: need >= 4 pts and one sub
    const runs = []; { let k = 0; while (k < n) { if (!on[k]) { k++; continue; } let e = k; while (e + 1 < n && on[e + 1]) e++; runs.push([k, e]); k = e + 1; } }
    if (runs.length > 1 && runs[0][0] === 0 && runs[runs.length - 1][1] === n - 1) { const last = runs.pop(); runs[0] = [last[0] - n, runs[0][1]]; }
    const good = runs.filter(([a, b]) => b - a + 1 >= 4);
    if (!good.length) { // fully new loop (should not happen here)
      const cub = fitCubic(resample(P.concat([P[0]]), 0.05), norm([P[1][0] - P[n - 1][0], P[1][1] - P[n - 1][1]]), norm([P[1][0] - P[n - 1][0], P[1][1] - P[n - 1][1]]), 0.01);
      outLoops.push({ start: cub[0][0], segs: cub.map(c => ({ t: 'C', p: c })) }); runsInfo.push({ newLoop: true }); continue;
    }
    if (good.length === 1 && good[0][1] - good[0][0] + 1 === n) { // unchanged subpath
      const sI = pr[0].sub; outLoops.push({ start: subs[sI].segs[0].p[0], segs: subs[sI].segs }); runsInfo.push({ unchanged: sI }); continue;
    }
    const at = k => pr[((k % n) + n) % n], Pt = k => P[((k % n) + n) % n];
    const segs = []; let start = null; const ri = { on: [], off: [] };
    for (let q = 0; q < good.length; q++) {
      const [a, b] = good[q]; const [c] = good[(q + 1) % good.length]; const cc = q + 1 < good.length ? c : c + n;
      const A0 = at(a), B0 = at(b);
      if (A0.sub !== B0.sub) throw new Error(name + ': on-run spans two subpaths');
      if (start === null) start = A0.q;
      const pc = piece(subs[A0.sub], A0.seg, A0.u, B0.seg, B0.u);
      let plen = 0; for (const s of pc) { let prev = ptAt(s, 0); for (let t = 1; t <= 16; t++) { const pt = ptAt(s, t / 16); plen += Math.hypot(pt[0] - prev[0], pt[1] - prev[1]); prev = pt; } }
      let rlen = 0; for (let k = a; k < b; k++) rlen += Math.hypot(Pt(k + 1)[0] - Pt(k)[0], Pt(k + 1)[1] - Pt(k)[1]);
      if (Math.abs(plen - rlen) > 0.05 * Math.max(1, rlen)) throw new Error(`${name}: on-run length mismatch ${plen.toFixed(3)} vs ${rlen.toFixed(3)}`);
      segs.push(...pc); ri.on.push(+rlen.toFixed(2));
      // off-run b -> cc
      const C0 = at(cc);
      const pts = [B0.q]; for (let k = b + 1; k < cc; k++) pts.push(Pt(k)); pts.push(C0.q);
      const t0 = proj.tangent(B0.sub, B0.seg, B0.u), t1 = proj.tangent(C0.sub, C0.seg, C0.u);
      const fr = fitRun(pts, t0, t1, tol);
      segs.push(...fr.cubics); ri.off.push({ from: B0.q.map(v => +v.toFixed(2)), to: C0.q.map(v => +v.toFixed(2)), pts: pts.length, cubics: fr.cubics.length, corners: fr.corners });
    }
    outLoops.push({ start, segs }); runsInfo.push(ri);
  }
  // G1 check at every join that touches a fitted (new) segment
  const joins = [];
  for (const Lp of outLoops) { const n = Lp.segs.length; for (let k = 0; k < n; k++) { const a = Lp.segs[k], b = Lp.segs[(k + 1) % n]; if (!a.fit && !b.fit) continue;
    const ta = norm(a.t === 'L' ? [a.p[1][0] - a.p[0][0], a.p[1][1] - a.p[0][1]] : [a.p[3][0] - a.p[2][0], a.p[3][1] - a.p[2][1]]);
    const tb = norm(b.t === 'L' ? [b.p[1][0] - b.p[0][0], b.p[1][1] - b.p[0][1]] : [b.p[1][0] - b.p[0][0], b.p[1][1] - b.p[0][1]]);
    const end = a.t === 'L' ? a.p[1] : a.p[3], st = b.p[0];
    joins.push({ at: end.map(v => +v.toFixed(3)), kind: (a.fit ? 'fit' : 'orig') + '>' + (b.fit ? 'fit' : 'orig'), angleDeg: +(Math.acos(Math.max(-1, Math.min(1, ta[0] * tb[0] + ta[1] * tb[1]))) * 180 / Math.PI).toFixed(3), gapPos: +Math.hypot(end[0] - st[0], end[1] - st[1]).toFixed(5) }); } }
  const maxJoin = Math.max(0, ...joins.map(j => j.angleDeg));
  // verification: sample output, distance to the marching result, and gap to S
  const outD = toD(outLoops);
  const outSubs = parsePath(outD); const outPts = outSubs.map(s => flatten(s, 0.02).pts);
  const segM = segsOf(loops); const bk = new Map(); const B = 0.5; for (let s = 0; s < segM.length / 4; s++) { const i = Math.floor(segM[4 * s] / B), j = Math.floor(segM[4 * s + 1] / B); for (let a = i - 1; a <= i + 1; a++) for (let b = j - 1; b <= j + 1; b++) { const key = a * 100000 + b; if (!bk.has(key)) bk.set(key, []); bk.get(key).push(s); } }
  let hd = 0; for (const p of outPts) for (const q of p) { let m = Infinity; const L = bk.get(Math.floor(q[0] / B) * 100000 + Math.floor(q[1] / B)) || []; for (const s of L) { const ax = segM[4 * s], ay = segM[4 * s + 1], dx = segM[4 * s + 2] - ax, dy = segM[4 * s + 3] - ay, LL = dx * dx + dy * dy; let u = LL ? ((q[0] - ax) * dx + (q[1] - ay) * dy) / LL : 0; u = Math.max(0, Math.min(1, u)); m = Math.min(m, Math.hypot(ax + u * dx - q[0], ay + u * dy - q[1])); } hd = Math.max(hd, m); }
  const gapMin = minDistPolys(outPts.map(p => p.filter((_, i) => i % 2 === 0)), Spts);
  return { d: outD, changed: true, minDistToS: md, gapMin, fitVsGrid: hd, maxJoinAngleDeg: maxJoin, joins, dropped, loops: loops.length, runs: runsInfo, grid: [G.nx, G.ny] };
}

const t0 = Date.now();
const res = { g, r, h, minArea, eps, letters: {}, report: {} };
for (const [k, d] of Object.entries(LET)) {
  const o = cutLetter(k, d); res.letters[k] = o.d; const { d: _, ...rest } = o; res.report[k] = rest;
}
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
console.log(JSON.stringify(res.report, (k, v) => typeof v === 'number' ? +v.toFixed(4) : v, 1).slice(0, 6000));
console.log('done in', ((Date.now() - t0) / 1000).toFixed(1), 's ->', OUT);
