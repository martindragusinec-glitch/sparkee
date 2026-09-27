// D2 cut + rim geometry (exact distance fields, logo.svg coordinates, viewBox 0 0 568 292).
//
// Rim ("inset" mode): the outer edge of the mascot stays exactly the official silhouette S; the outer
// `wm` units of the ink outline turn into the mist rim, the inner part stays ink:
//   core  = erode(S, wm), erode(F, wm)      (S = mascot silhouette, F = flame silhouette)
// Letter cut: letters a and r are knocked out around the silhouette with an even gap g, and every
// convex corner the cut creates is rounded with radius rho (morphological opening, which also
// removes any sliver thinner than 2*rho):
//   L' = open(L \ dilate(S, g), rho)
// ("outer" mode, kept for comparison: rim outside S, RO = close(dilate(S ∪ F, wm), rc), cut from RO.)
//
// usage: node build_d2_geom.mjs <mode inset|outer> <wm> <g[,g2..]> <rho[,rho2..]> <out.json> [res] [rc] [coreCache.json]
// out.json: { coreS, coreF | RO, cuts: { "<g>/<rho>": { a: {O, raw}, r: {O, raw} } } }
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parsePath, Region, Grid, signedField, march, area } from './lib/sdf.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const [,, MODE, WM, G, RHO, OUT, RES, RC, CACHE] = process.argv;
const wm = +WM, gs = G.split(',').map(Number), rhos = RHO.split(',').map(Number), res = +(RES || 0.03), rc = +(RC || 2);
const geo = JSON.parse(fs.readFileSync(path.join(HERE, 'geometry.json')));
const flameD = fs.readFileSync(path.join(HERE, 'parts/flame_silhouette.svg'), 'utf8').match(/ d="([^"]+)"/)[1];
const lettersSvg = fs.readFileSync(path.join(HERE, 'parts/letters.svg'), 'utf8');
const letterD = id => lettersSvg.match(new RegExp('id="letter-' + id + '" d="([^"]+)"'))[1];
const t0 = Date.now(); const log = (...a) => console.log(((Date.now() - t0) / 1000).toFixed(1) + 's', ...a);
const r4 = v => Math.round(v * 10000) / 10000;
const round = loops => loops.map(l => l.map(p => [r4(p[0]), r4(p[1])]));
const big = loops => loops.filter(l => Math.abs(area(l)) > 0.05);

const Sreg = new Region([parsePath(geo.silhouette)]);
const Freg = new Region([parsePath(flameD)]);
const out = { mode: MODE, wm, res, cuts: {} };
let cutter;
if (MODE === 'inset' && CACHE && fs.existsSync(CACHE)) {
  const c = JSON.parse(fs.readFileSync(CACHE)); out.coreS = c.coreS; out.coreF = c.coreF; cutter = Sreg; log('core from cache');
} else if (MODE === 'inset') {
  const GS = new Grid(147, 47, 300, 219, res);
  out.coreS = round(big(march(signedField(Sreg, GS, [-wm]), GS, -wm))); log('core S', out.coreS.map(l => l.length));
  const GF = new Grid(160, -3, 206, 55, res);
  out.coreF = round(big(march(signedField(Freg, GF, [-wm]), GF, -wm))); log('core F', out.coreF.map(l => l.length));
  cutter = Sreg;
  if (CACHE) fs.writeFileSync(CACHE, JSON.stringify({ wm, coreS: out.coreS, coreF: out.coreF }));
} else {
  const SF = new Region([parsePath(geo.silhouette), parsePath(flameD)]);
  const G1 = new Grid(135, -12, 315, 232, Math.max(res, 0.04));
  const V = march(signedField(SF, G1, [wm + rc]), G1, wm + rc);
  const RO = big(march(signedField(new Region([V]), G1, [-rc]), G1, -rc)); log('RO', RO.map(l => l.length));
  out.RO = round(RO); cutter = new Region([RO]);
}
// ---- letters a, r ----
const G2 = new Grid(150, 180, 305, 268, res);
const Ls = {}; const FLs = {};
for (const id of ['a', 'r']) Ls[id] = new Region([parsePath(letterD(id))]);
for (const g of gs) {
  const FC = signedField(cutter, G2, [...rhos.map(r => g + r), g], 0.8); log('g', g, 'cutter field exact', FC.exactCount);
  for (const rho of rhos) {
    const key = g + '/' + rho; out.cuts[key] = {};
    for (const id of ['a', 'r']) {
      const L = Ls[id];
      const kf = id + rho; if (!FLs[kf]) FLs[kf] = signedField(L, G2, [-rho, 0], 0.8);
      const FL = FLs[kf];
      const FE = new Float32Array(FL.length);
      for (let k = 0; k < FE.length; k++) FE[k] = Math.max(FL[k] + rho, g + rho - FC[k]);
      const E = big(march(FE, G2, 0));
      const O = big(march(signedField(new Region([E]), G2, [rho], 0.8), G2, rho));
      const Fr = new Float32Array(FL.length);
      for (let k = 0; k < Fr.length; k++) Fr[k] = Math.max(FL[k], g - FC[k]);
      const raw = march(Fr, G2, 0).filter(l => Math.abs(area(l)) > 1e-3);
      log(key, id, 'raw', raw.map(l => area(l).toFixed(2)).join(' '), '| opened', O.map(l => area(l).toFixed(2)).join(' '));
      out.cuts[key][id] = { O: round(O), raw: round(raw) };
    }
  }
}
fs.writeFileSync(OUT, JSON.stringify(out)); log('wrote', OUT);
