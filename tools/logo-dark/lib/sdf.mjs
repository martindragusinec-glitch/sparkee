// Exact signed-distance fields + marching squares for precise morphological offsets of SVG shapes.
// Region = union of closed loops with even-odd fill per shape. Distances are exact (to flattened
// polylines with chord error < 0.001) inside a narrow band around the requested iso-levels.
// Used by build_d2.mjs (cut + rim variant of the dark logo).

const TOK = /[MmLlHhVvCcZz]|-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g;

function flatCubic(p0, p1, p2, p3, out, tol) {
  // adaptive subdivision by flatness (max distance of control points from chord)
  const stack = [[p0, p1, p2, p3, 0]];
  const res = [];
  while (stack.length) {
    const [a, b, c, d, depth] = stack.pop();
    const dx = d[0] - a[0], dy = d[1] - a[1], L = Math.hypot(dx, dy) || 1e-12;
    const d1 = Math.abs((b[0] - a[0]) * dy - (b[1] - a[1]) * dx) / L;
    const d2 = Math.abs((c[0] - a[0]) * dy - (c[1] - a[1]) * dx) / L;
    if ((d1 + d2) * 0.75 < tol || depth > 18) { res.push(d); continue; }
    const ab = mid(a, b), bc = mid(b, c), cd = mid(c, d), abc = mid(ab, bc), bcd = mid(bc, cd), m = mid(abc, bcd);
    stack.push([m, bcd, cd, d, depth + 1]);
    stack.push([a, ab, abc, m, depth + 1]);
  }
  for (const p of res) out.push(p);
}
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

export function parsePath(d, tol = 0.0008) {
  const t = d.match(TOK); let i = 0, cmd = null, x = 0, y = 0, sx = 0, sy = 0;
  const loops = []; let cur = null;
  const num = () => parseFloat(t[i++]);
  while (i < t.length) {
    if (/[A-Za-z]/.test(t[i])) { cmd = t[i++]; if (/[Zz]/.test(cmd)) { if (cur) { loops.push(cur); cur = null; } x = sx; y = sy; continue; } }
    const c = cmd;
    if (c === 'M' || c === 'm') {
      let nx = num(), ny = num(); if (c === 'm') { nx += x; ny += y; }
      if (cur) loops.push(cur); cur = [[nx, ny]]; x = sx = nx; y = sy = ny; cmd = c === 'M' ? 'L' : 'l';
    } else if (c === 'L' || c === 'l') {
      let nx = num(), ny = num(); if (c === 'l') { nx += x; ny += y; } cur.push([nx, ny]); x = nx; y = ny;
    } else if (c === 'H' || c === 'h') { let nx = num(); if (c === 'h') nx += x; cur.push([nx, y]); x = nx; }
    else if (c === 'V' || c === 'v') { let ny = num(); if (c === 'v') ny += y; cur.push([x, ny]); y = ny; }
    else if (c === 'C' || c === 'c') {
      let p = [num(), num(), num(), num(), num(), num()];
      if (c === 'c') p = [p[0] + x, p[1] + y, p[2] + x, p[3] + y, p[4] + x, p[5] + y];
      flatCubic([x, y], [p[0], p[1]], [p[2], p[3]], [p[4], p[5]], cur, tol); x = p[4]; y = p[5];
    } else throw new Error('cmd ' + c);
  }
  if (cur) loops.push(cur);
  // drop duplicate closing point
  return loops.map(l => { const a = l[0], b = l[l.length - 1]; if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-9) l.pop(); return l; });
}

// shapes: array of shapes, each shape = array of loops (even-odd inside the shape); union across shapes
export class Region {
  constructor(shapes, B = 0.5) {
    this.shapes = shapes;
    const segs = [];
    for (const sh of shapes) for (const lp of sh) for (let k = 0; k < lp.length; k++) { const a = lp[k], b = lp[(k + 1) % lp.length]; segs.push(a[0], a[1], b[0], b[1]); }
    this.segs = new Float64Array(segs); this.n = segs.length / 4;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (let s = 0; s < this.n; s++) { const o = s * 4; x0 = Math.min(x0, this.segs[o], this.segs[o + 2]); x1 = Math.max(x1, this.segs[o], this.segs[o + 2]); y0 = Math.min(y0, this.segs[o + 1], this.segs[o + 3]); y1 = Math.max(y1, this.segs[o + 1], this.segs[o + 3]); }
    this.bb = [x0, y0, x1, y1];
    this.B = B; this.gx0 = Math.floor(x0 / B) - 1; this.gy0 = Math.floor(y0 / B) - 1;
    this.gnx = Math.floor(x1 / B) - this.gx0 + 2; this.gny = Math.floor(y1 / B) - this.gy0 + 2;
    const cells = Array.from({ length: this.gnx * this.gny }, () => []);
    for (let s = 0; s < this.n; s++) {
      const o = s * 4;
      const i0 = Math.floor(Math.min(this.segs[o], this.segs[o + 2]) / B) - this.gx0, i1 = Math.floor(Math.max(this.segs[o], this.segs[o + 2]) / B) - this.gx0;
      const j0 = Math.floor(Math.min(this.segs[o + 1], this.segs[o + 3]) / B) - this.gy0, j1 = Math.floor(Math.max(this.segs[o + 1], this.segs[o + 3]) / B) - this.gy0;
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) cells[j * this.gnx + i].push(s);
    }
    this.cells = cells;
  }
  // exact unsigned distance to boundary (ring search)
  dist(px, py, cap = Infinity) {
    const B = this.B; let best = cap * cap;
    let ci = Math.floor(px / B) - this.gx0, cj = Math.floor(py / B) - this.gy0;
    const S = this.segs;
    for (let r = 0; ; r++) {
      // ring r: cells with max(|di|,|dj|) == r
      const ringMin = Math.max(0, (r - 1) * B);
      if (ringMin * ringMin > best) break;
      if (r > this.gnx + this.gny + 4 + Math.abs(ci) + Math.abs(cj)) break;
      if (!isFinite(best) && r > 4000) break;
      for (let di = -r; di <= r; di++) for (let dj = -r; dj <= r; dj++) {
        if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
        const i = ci + di, j = cj + dj; if (i < 0 || j < 0 || i >= this.gnx || j >= this.gny) continue;
        for (const s of this.cells[j * this.gnx + i]) {
          const o = s * 4, ax = S[o], ay = S[o + 1], dx = S[o + 2] - ax, dy = S[o + 3] - ay;
          const L = dx * dx + dy * dy; let u = L ? ((px - ax) * dx + (py - ay) * dy) / L : 0; u = u < 0 ? 0 : u > 1 ? 1 : u;
          const qx = ax + u * dx - px, qy = ay + u * dy - py, dd = qx * qx + qy * qy; if (dd < best) best = dd;
        }
      }
    }
    return Math.sqrt(best);
  }
  inside(px, py) {
    for (const sh of this.shapes) {
      let c = false;
      for (const p of sh) for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
        const a = p[i], b = p[j];
        if (((a[1] > py) !== (b[1] > py)) && (px < (b[0] - a[0]) * (py - a[1]) / (b[1] - a[1]) + a[0])) c = !c;
      }
      if (c) return true;
    }
    return false;
  }
  // row-wise inside mask on a grid (fast scanline)
  insideRow(grid, j, out) {
    const py = grid.y0 + j * grid.res; out.fill(0);
    for (const sh of this.shapes) {
      const xs = [];
      for (const p of sh) for (let i = 0, k = p.length - 1; i < p.length; k = i++) { const a = p[i], b = p[k]; if ((a[1] > py) !== (b[1] > py)) xs.push((b[0] - a[0]) * (py - a[1]) / (b[1] - a[1]) + a[0]); }
      xs.sort((a, b) => a - b);
      for (let m = 0; m + 1 < xs.length; m += 2) {
        let i0 = Math.ceil((xs[m] - grid.x0) / grid.res), i1 = Math.floor((xs[m + 1] - grid.x0) / grid.res);
        i0 = Math.max(0, i0); i1 = Math.min(grid.nx - 1, i1); for (let i = i0; i <= i1; i++) out[i] = 1;
      }
    }
  }
}

export class Grid {
  constructor(x0, y0, x1, y1, res) { this.x0 = x0; this.y0 = y0; this.res = res; this.nx = Math.round((x1 - x0) / res) + 1; this.ny = Math.round((y1 - y0) / res) + 1; }
}

// signed distance (negative inside) on grid; exact where |d - level| might be < band for any level in levels
export function signedField(region, grid, levels, band = 0.6) {
  const cap = Math.max(...levels.map(Math.abs)) + band + 4;
  const K = 8, cres = grid.res * K;
  const cnx = Math.ceil((grid.nx - 1) / K) + 1, cny = Math.ceil((grid.ny - 1) / K) + 1;
  const cg = { x0: grid.x0, y0: grid.y0, res: cres, nx: cnx, ny: cny };
  const C = new Float64Array(cnx * cny);
  for (let j = 0; j < cny; j++) for (let i = 0; i < cnx; i++) {
    const px = grid.x0 + i * cres, py = grid.y0 + j * cres; const d = region.dist(px, py, cap);
    C[j * cnx + i] = region.inside(px, py) ? -d : d;
  }
  const F = new Float32Array(grid.nx * grid.ny); const row = new Uint8Array(grid.nx);
  const lo = Math.min(...levels) - band - cres * 1.5, hi = Math.max(...levels) + band + cres * 1.5;
  let exact = 0;
  for (let j = 0; j < grid.ny; j++) {
    region.insideRow(grid, j, row);
    const cj = Math.min(cny - 2, Math.floor(j / K)), fy = j / K - cj;
    for (let i = 0; i < grid.nx; i++) {
      const ci = Math.min(cnx - 2, Math.floor(i / K)), fx = i / K - ci;
      const v = C[cj * cnx + ci] * (1 - fx) * (1 - fy) + C[cj * cnx + ci + 1] * fx * (1 - fy) + C[(cj + 1) * cnx + ci] * (1 - fx) * fy + C[(cj + 1) * cnx + ci + 1] * fx * fy;
      if (v >= lo && v <= hi) {
        const d = region.dist(grid.x0 + i * grid.res, grid.y0 + j * grid.res); F[j * grid.nx + i] = row[i] ? -d : d; exact++;
      } else {
        const a = Math.abs(v); F[j * grid.nx + i] = row[i] ? -a : a; // sign from exact scanline, magnitude approx (far from levels)
      }
    }
  }
  F.exactCount = exact;
  return F;
}

// marching squares; returns closed loops (arrays of [x,y]); inside = F < level
export function march(F, grid, level) {
  const { nx, ny, x0, y0, res } = grid;
  const v = (i, j) => F[j * nx + i] - level;
  // edge ids: horizontal edge (i,j)-(i+1,j): 2*(j*nx+i); vertical edge (i,j)-(i,j+1): 2*(j*nx+i)+1
  const pt = new Map();
  const P = (id) => {
    if (pt.has(id)) return pt.get(id);
    const h = (id & 1) === 0, k = id >> 1, i = k % nx, j = (k - i) / nx;
    const a = v(i, j), b = h ? v(i + 1, j) : v(i, j + 1); const u = a / (a - b);
    const p = h ? [x0 + (i + u) * res, y0 + j * res] : [x0 + i * res, y0 + (j + u) * res];
    pt.set(id, p); return p;
  };
  const next = new Map(); // directed: from edge -> to edge, oriented so inside is on the left
  for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const a = v(i, j) < 0, b = v(i + 1, j) < 0, c = v(i + 1, j + 1) < 0, d = v(i, j + 1) < 0;
    const code = (a ? 1 : 0) | (b ? 2 : 0) | (c ? 4 : 0) | (d ? 8 : 0);
    if (code === 0 || code === 15) continue;
    const eT = 2 * (j * nx + i), eR = 2 * (j * nx + i + 1) + 1, eB = 2 * ((j + 1) * nx + i), eL = 2 * (j * nx + i) + 1;
    // corners: a=TL b=TR c=BR d=BL (y down). Edges: T(a-b) R(b-c) B(d-c) L(a-d)
    const add = (f, t) => next.set(f, t);
    switch (code) {
      case 1: add(eL, eT); break;        // a
      case 2: add(eT, eR); break;        // b
      case 3: add(eL, eR); break;        // a b
      case 4: add(eR, eB); break;        // c
      case 6: add(eT, eB); break;        // b c
      case 7: add(eL, eB); break;        // a b c
      case 8: add(eB, eL); break;        // d
      case 9: add(eB, eT); break;        // a d
      case 11: add(eB, eR); break;       // a b d
      case 12: add(eR, eL); break;       // c d
      case 13: add(eR, eT); break;       // a c d
      case 14: add(eT, eL); break;       // b c d
      case 5: case 10: {
        const ctr = (v(i, j) + v(i + 1, j) + v(i + 1, j + 1) + v(i, j + 1)) / 4 < 0;
        if (code === 5) { if (ctr) { add(eL, eB); add(eR, eT); } else { add(eL, eT); add(eR, eB); } }
        else { if (ctr) { add(eT, eL); add(eB, eR); } else { add(eT, eR); add(eB, eL); } }
        break;
      }
    }
  }
  const loops = []; const used = new Set();
  for (const s of next.keys()) {
    if (used.has(s)) continue;
    const lp = []; let e = s;
    while (e !== undefined && !used.has(e)) { used.add(e); lp.push(P(e)); e = next.get(e); }
    if (lp.length > 2) loops.push(lp);
  }
  return loops;
}

export function area(lp) { let a = 0; for (let i = 0, j = lp.length - 1; i < lp.length; j = i++) a += (lp[j][0] - lp[i][0]) * (lp[j][1] + lp[i][1]); return a / 2; }
