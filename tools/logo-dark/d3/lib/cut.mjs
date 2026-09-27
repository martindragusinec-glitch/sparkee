// Knock-out cut of one letter around the mascot silhouette, with morphological opening (rounded cut ends).
//   X = L \ offset(S, g)            (letter minus silhouette grown by the gap g)
//   D = open(X, rho) = dilate(erode(X, rho), rho)   -> convex corners of the cut get radius rho, slivers < 2*rho vanish
// Everything is computed on a fine grid with EXACT point-to-segment distances (no pixel EDT), contours by
// marching squares with edge-id chaining (watertight loops).
// usage: node cut.mjs in.json out.json
//   in.json: {S:[[x,y]...]..., L:[[x,y]...]..., region:[x0,y0,x1,y1], res, g, rho}
import fs from 'fs';
const [,, IN, OUT] = process.argv;
const P = JSON.parse(fs.readFileSync(IN));
const [x0, y0, x1, y1] = P.region, res = P.res, g = P.g, rho = P.rho;
const nx = Math.round((x1 - x0) / res) + 1, ny = Math.round((y1 - y0) / res) + 1, N = nx * ny;
const t0 = Date.now(); const log = (...a) => console.error(((Date.now() - t0) / 1000).toFixed(1) + 's', ...a);

function insideMask(polys) { // even-odd over all polys, cell centers at x0+i*res
  const m = new Uint8Array(N);
  const edges = []; for (const p of polys) for (let i = 0, k = p.length - 1; i < p.length; k = i++) edges.push([p[k][0], p[k][1], p[i][0], p[i][1]]);
  for (let j = 0; j < ny; j++) {
    const py = y0 + j * res; const xs = [];
    for (const e of edges) if ((e[1] > py) != (e[3] > py)) xs.push(e[0] + (e[2] - e[0]) * (py - e[1]) / (e[3] - e[1]));
    xs.sort((a, b) => a - b);
    for (let m2 = 0; m2 + 1 < xs.length; m2 += 2) {
      let i0 = Math.ceil((xs[m2] - x0) / res), i1 = Math.floor((xs[m2 + 1] - x0) / res);
      i0 = Math.max(0, i0); i1 = Math.min(nx - 1, i1);
      for (let i = i0; i <= i1; i++) m[j * nx + i] ^= 1;
    }
  }
  return m;
}
function segsOf(polys, closed = true) { const s = []; for (const p of polys) { const n = p.length; for (let i = 0; i < (closed ? n : n - 1); i++) { const a = p[i], b = p[(i + 1) % n]; s.push([a[0], a[1], b[0], b[1]]); } } return s; }
function distField(segs, cap) { // unsigned exact distance to the segment set, capped
  const D = new Float32Array(N).fill(cap * cap);
  for (const s of segs) {
    const ax = s[0], ay = s[1], dx = s[2] - ax, dy = s[3] - ay, L = dx * dx + dy * dy;
    const i0 = Math.max(0, Math.floor((Math.min(s[0], s[2]) - cap - x0) / res)), i1 = Math.min(nx - 1, Math.ceil((Math.max(s[0], s[2]) + cap - x0) / res));
    const j0 = Math.max(0, Math.floor((Math.min(s[1], s[3]) - cap - y0) / res)), j1 = Math.min(ny - 1, Math.ceil((Math.max(s[1], s[3]) + cap - y0) / res));
    for (let j = j0; j <= j1; j++) {
      const py = y0 + j * res, row = j * nx;
      for (let i = i0; i <= i1; i++) {
        const px = x0 + i * res;
        let u = L ? ((px - ax) * dx + (py - ay) * dy) / L : 0; u = u < 0 ? 0 : u > 1 ? 1 : u;
        const qx = ax + u * dx - px, qy = ay + u * dy - py, d = qx * qx + qy * qy;
        if (d < D[row + i]) D[row + i] = d;
      }
    }
  }
  for (let k = 0; k < N; k++) D[k] = Math.sqrt(D[k]);
  return D;
}
// marching squares on F (inside = F<0), outside padding at the border -> closed loops, chained by edge id
function contour(F) {
  const val = (i, j) => (i < 0 || j < 0 || i >= nx || j >= ny) ? 1 : F[j * nx + i];
  const pt = new Map();
  const edgePoint = (id) => { // id: horizontal edges (i,j)-(i+1,j) = 2*k, vertical (i,j)-(i,j+1) = 2*k+1 with k over padded grid
    if (pt.has(id)) return id;
    const k = id >> 1, i = (k % (nx + 2)) - 1, j = Math.floor(k / (nx + 2)) - 1;
    const a = val(i, j), b = (id & 1) ? val(i, j + 1) : val(i + 1, j);
    const u = a / (a - b);
    const X = x0 + i * res, Y = y0 + j * res;
    pt.set(id, (id & 1) ? [X, Y + u * res] : [X + u * res, Y]);
    return id;
  };
  const K = (i, j) => (j + 1) * (nx + 2) + (i + 1);
  const next = new Map();
  for (let j = -1; j < ny; j++) for (let i = -1; i < nx; i++) {
    const a = val(i, j), b = val(i + 1, j), c = val(i + 1, j + 1), d = val(i, j + 1);
    const code = (a < 0 ? 1 : 0) | (b < 0 ? 2 : 0) | (c < 0 ? 4 : 0) | (d < 0 ? 8 : 0);
    if (code === 0 || code === 15) continue;
    const eT = 2 * K(i, j), eB = 2 * K(i, j + 1), eL = 2 * K(i, j) + 1, eR = 2 * K(i + 1, j) + 1;
    // oriented segments: inside on the left when walking (counter-clockwise around inside in y-down coords is fine as long as consistent)
    const S = [];
    switch (code) {
      case 1: S.push([eL, eT]); break; case 2: S.push([eT, eR]); break; case 3: S.push([eL, eR]); break;
      case 4: S.push([eR, eB]); break; case 6: S.push([eT, eB]); break; case 7: S.push([eL, eB]); break;
      case 8: S.push([eB, eL]); break; case 9: S.push([eB, eT]); break; case 11: S.push([eB, eR]); break;
      case 12: S.push([eR, eL]); break; case 13: S.push([eR, eT]); break; case 14: S.push([eT, eL]); break;
      case 5: case 10: {
        const ctr = (a + b + c + d) / 4;
        if (code === 5) { if (ctr < 0) { S.push([eL, eB]); S.push([eR, eT]); } else { S.push([eL, eT]); S.push([eR, eB]); } }
        else { if (ctr < 0) { S.push([eT, eL]); S.push([eB, eR]); } else { S.push([eT, eR]); S.push([eB, eL]); } }
      }
    }
    for (const [p, q] of S) { edgePoint(p); edgePoint(q); next.set(p, q); }
  }
  const loops = []; const used = new Set();
  for (const start of next.keys()) {
    if (used.has(start)) continue;
    const loop = []; let e = start;
    while (!used.has(e)) { used.add(e); loop.push(pt.get(e)); e = next.get(e); if (e === undefined) break; }
    if (loop.length > 2) loops.push(loop);
  }
  return loops;
}
function area(l) { let s = 0; for (let i = 0, k = l.length - 1; i < l.length; k = i++) s += (l[k][0] * l[i][1] - l[i][0] * l[k][1]); return s / 2; }
function simplify(loop, tol) { // Douglas-Peucker on a closed loop (split at two far points)
  const dp = (pts) => {
    if (pts.length < 3) return pts;
    const a = pts[0], b = pts[pts.length - 1]; const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1e-12;
    let m = -1, idx = 0; for (let i = 1; i < pts.length - 1; i++) { const d = Math.abs((pts[i][0] - a[0]) * dy - (pts[i][1] - a[1]) * dx) / L; if (d > m) { m = d; idx = i; } }
    if (m <= tol) return [a, b];
    const l = dp(pts.slice(0, idx + 1)), r = dp(pts.slice(idx)); return l.slice(0, -1).concat(r);
  };
  const h = loop.length >> 1; const A = dp(loop.slice(0, h + 1)), B = dp(loop.slice(h).concat([loop[0]]));
  return A.slice(0, -1).concat(B.slice(0, -1));
}
// ---- fields
const S = P.S, L = P.L;
const inS = insideMask(S), inL = insideMask(L);
log('grid', nx, ny);
const dS = distField(segsOf(S), g + 2), dL = distField(segsOf(L), 2);
const FX = new Float32Array(N);
for (let k = 0; k < N; k++) { const sdS = inS[k] ? -dS[k] : dS[k], sdL = inL[k] ? -dL[k] : dL[k]; FX[k] = Math.max(sdL, g - sdS); }
const X = contour(FX); log('X loops', X.map(l => l.length + ':' + area(l).toFixed(1)).join(' '));
let result = { X, nx, ny };
if (rho > 0) {
  const Xs = X.map(l => simplify(l, 0.0015));
  const cap = 2 * rho + 0.6;
  const dX = distField(segsOf(Xs), cap);
  const FE = new Float32Array(N);
  for (let k = 0; k < N; k++) FE[k] = (FX[k] < 0 ? -dX[k] : dX[k]) + rho;
  const E = contour(FE); log('E loops', E.map(l => l.length).join(' '));
  const Es = E.map(l => simplify(l, 0.0015));
  const dE = distField(segsOf(Es), rho + 0.6);
  const FD = new Float32Array(N);
  for (let k = 0; k < N; k++) FD[k] = (FE[k] < 0 ? -dE[k] : dE[k]) - rho;
  const D = contour(FD); log('D loops', D.map(l => l.length + ':' + area(l).toFixed(1)).join(' '));
  result.E = E.map(l => simplify(l, 0.002)); result.D = D;
}
result.X = X;
fs.writeFileSync(OUT, JSON.stringify(result));
log('done');
