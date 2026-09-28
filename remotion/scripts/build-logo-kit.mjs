// Builds the logo construction kit data for src/comps/story/kit/.
//
//   node scripts/build-logo-kit.mjs
//
// 1. Copies the official logo parts (tools/logo-dark/parts/*.svg, Figma 124:3) unchanged into
//    assets/img/logo-parts/ (the Remotion publicDir) and checks every file byte for byte (sha256).
// 2. Parses the parts + assets/img/logo-dark.svg and writes src/comps/story/kit/logo-data.gen.ts:
//    path data, fills and gradient defs (ids namespaced with the token __P__), plus derived
//    geometry (spark routes, anchors/handles, fitted construction circles, type metrics).
// 3. Fails if anything under src/comps/story references the retired concept images (assets/figma).
//
// Everything is derived from the official vectors, nothing is placed by eye.
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  cutPath,
  getBoundingBox,
  getLength,
  getPointAtLength,
  getSubpaths,
  getTangentAtLength,
  parsePath,
  reduceInstructions,
  reversePath,
  serializeInstructions,
} from "@remotion/paths";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const web = path.resolve(root, "..");
const SRC_PARTS = path.join(web, "tools/logo-dark/parts");
const PUB_PARTS = path.join(web, "assets/img/logo-parts");
const LOGO_DARK = path.join(web, "assets/img/logo-dark.svg");
const OUT = path.join(root, "src/comps/story/kit/logo-data.gen.ts");

const fail = (msg) => {
  console.error(`build-logo-kit: ${msg}`);
  process.exit(1);
};
const sha = (f) => createHash("sha256").update(readFileSync(f)).digest("hex");

// ---------------------------------------------------------------- 1. copy + checksum
mkdirSync(PUB_PARTS, { recursive: true });
const checksums = {};
for (const f of readdirSync(SRC_PARTS).filter((n) => n.endsWith(".svg")).sort()) {
  const a = path.join(SRC_PARTS, f);
  const b = path.join(PUB_PARTS, f);
  if (!existsSync(b) || sha(a) !== sha(b)) copyFileSync(a, b);
  const ha = sha(a);
  if (ha !== sha(b)) fail(`checksum mismatch for ${f}`);
  checksums[f] = ha.slice(0, 16);
}

// ---------------------------------------------------------------- 2. tiny XML tree parser
const parseXml = (text) => {
  const rootNode = { tag: "#root", attrs: {}, children: [] };
  const stack = [rootNode];
  const re = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<\/([\w:-]+)\s*>|<([\w:-]+)((?:\s+[\w:-]+="[^"]*")*)\s*(\/?)>|([^<]+)/g;
  let m;
  while ((m = re.exec(text))) {
    if (m[1]) {
      const top = stack.pop();
      if (top.tag !== m[1]) fail(`xml: </${m[1]}> closes <${top.tag}>`);
    } else if (m[2]) {
      const attrs = {};
      for (const a of m[3].matchAll(/([\w:-]+)="([^"]*)"/g)) attrs[a[1]] = a[2];
      const node = { tag: m[2], attrs, children: [] };
      stack[stack.length - 1].children.push(node);
      if (!m[4]) stack.push(node);
    } else if (m[5] && m[5].trim()) {
      stack[stack.length - 1].children.push({ tag: "#text", text: m[5].trim(), attrs: {}, children: [] });
    }
  }
  return rootNode.children.find((c) => c.tag === "svg");
};
const find = (node, pred) => {
  if (pred(node)) return node;
  for (const c of node.children) {
    const r = find(c, pred);
    if (r) return r;
  }
  return null;
};
const byId = (node, id) => {
  const r = find(node, (n) => n.attrs.id === id);
  if (!r) fail(`element #${id} not found`);
  return r;
};
const all = (node, pred, out = []) => {
  if (pred(node)) out.push(node);
  node.children.forEach((c) => all(c, pred, out));
  return out;
};
// serialise with ids dropped (except defs / masks, which get the __P__ namespace token)
const ser = (n, keepIds = false) => {
  if (n.tag === "#text") return n.text;
  const attrs = Object.entries(n.attrs)
    .filter(([k]) => keepIds || k !== "id")
    .map(([k, v]) => {
      if (k === "id") return `id="__P__${v}"`;
      return `${k}="${v.replace(/url\(#([^)]+)\)/g, "url(#__P__$1)")}"`;
    })
    .join(" ");
  const open = `<${n.tag}${attrs ? " " + attrs : ""}`;
  if (!n.children.length) return `${open}/>`;
  return `${open}>${n.children.map((c) => ser(c, keepIds)).join("")}</${n.tag}>`;
};
const inner = (n, keepIds = false) => n.children.map((c) => ser(c, keepIds)).join("");
const load = (f) => parseXml(readFileSync(f, "utf8"));
const part = (name) => load(path.join(PUB_PARTS, name));

// ---------------------------------------------------------------- parts
const letters = part("letters.svg");
const outlineUnderlap = part("mascot_outline_underlap.svg");
const outlineExact = part("mascot_outline.svg");
const fillsSvg = part("mascot_fills.svg");
const silSvg = part("mascot_silhouette.svg");
const silFlameSvg = part("mascot_silhouette_with_flame.svg");
const flameSvg = part("flame.svg");
const flameOutlineSvg = part("flame_outline.svg");
const sparkleSvg = part("sparkle.svg");
const dark = load(LOGO_DARK);

const LETTER_IDS = ["s", "p", "a", "r", "k", "e1", "e2"];
const bb = (d) => {
  const b = getBoundingBox(d);
  return [b.x1, b.y1, b.x2, b.y2].map((v) => +v.toFixed(3));
};
const letterData = LETTER_IDS.map((id) => {
  const d = byId(letters, `letter-${id}`).attrs.d;
  const box = bb(d);
  return { id, d, bbox: box, cx: +((box[0] + box[2]) / 2).toFixed(3) };
});
const darkLetters = LETTER_IDS.map((id) => ({ id, d: byId(dark, `letter-${id}`).attrs.d }));

const underlapPaths = all(outlineUnderlap, (n) => n.tag === "path").map((p) => ({
  d: p.attrs.d,
  evenodd: p.attrs["fill-rule"] === "evenodd",
}));
const outlinePath = all(outlineExact, (n) => n.tag === "path")[0].attrs.d;
const silhouette = byId(silSvg, "mascot-silhouette").attrs.d;
const silhouetteFlame = byId(silFlameSvg, "mascot-silhouette-flame").attrs.d;

// defs (gradients) of the light parts, one namespace
const defsOf = (svg) => {
  const defs = svg.children.find((c) => c.tag === "defs");
  return defs ? defs.children : [];
};
const lightDefs = new Map();
for (const svg of [flameSvg, fillsSvg, sparkleSvg])
  for (const g of defsOf(svg)) lightDefs.set(g.attrs.id, ser(g, true));

// mascot fills, split into animatable groups
const g10 = byId(fillsSvg, "Group_10"); // body, limbs and their soft shading
const headBase = byId(fillsSvg, "Head base");
const headPaths = headBase.children.filter((c) => c.tag === "path");
const headD = headPaths[0].attrs.d;
if (!headPaths.every((p) => p.attrs.d === headD)) fail("head base paths differ");
const headSolid = getSubpaths(headD)[0];
const fills = {
  body: inner(g10),
  // outer contour of the body + limbs fill (white base of Vector_4)
  bodyD: byId(fillsSvg, "Vector_4").children[0].attrs.d,
  head: { d: headD, dSolid: headSolid, fills: headPaths.map((p) => p.attrs.fill.replace(/url\(#([^)]+)\)/, "url(#__P__$1)")) },
  highlights: ser(byId(fillsSvg, "Vector_16")) + ser(byId(fillsSvg, "Vector_17")),
  cheekR: ser(byId(fillsSvg, "Vector_14")),
  cheekL: ser(byId(fillsSvg, "Vector_15")),
  mouth: inner(byId(fillsSvg, "Group_12")),
  eyeR: inner(byId(fillsSvg, "Group_13")),
  eyeL: inner(byId(fillsSvg, "Group_14")),
};
const eyeR = byId(fillsSvg, "Eye").attrs;
const eyeL = byId(fillsSvg, "Eye_2").attrs;
const mouthBox = bb(byId(fillsSvg, "Vector_18").attrs.d);

// flame
const flameSil = byId(flameSvg, "flame-silhouette").attrs.d;
const flameFills = inner(byId(flameSvg, "Group_5"));
const flameOutline = all(flameOutlineSvg, (n) => n.tag === "path")[0].attrs.d;
// the coloured area of the flame (outer contour of its fill), for the dark white-hot core
const flameFillD = getSubpaths(byId(flameSvg, "Flame fill").children[0].attrs.d)[0];

// sparkle
const sparkleUnion = byId(sparkleSvg, "Union");
const sparkleD = sparkleUnion.children[0].attrs.d;
const sparkleFills = inner(sparkleUnion);

// dark master: defs, glow groups, knocked-out wordmark
const darkDefs = defsOf(dark).map((g) => ser(g, true)).join("");
const glow = byId(dark, "glow");
const sparkleGlow = byId(dark, "sparkle-glow");
const serGroup = (g) => `<g mask="${g.attrs.mask.replace(/url\(#([^)]+)\)/, "url(#__P__$1)")}">${inner(g)}</g>`;
const wordmarkFill = byId(dark, "wordmark").attrs.fill;

// ---------------------------------------------------------------- 3. derived geometry
const r3 = (v) => +v.toFixed(3);
const pt = (p) => [r3(p.x), r3(p.y)];

// scan a path for extreme points
const scan = (d, step, fn) => {
  const L = getLength(d);
  for (let t = 0; t <= L; t += step) fn(getPointAtLength(d, t), t);
  return L;
};

// flame base = lowest point of the flame silhouette
let flameBase = { y: -1e9 };
scan(flameSil, 0.02, (p) => {
  if (p.y > flameBase.y) flameBase = p;
});

// silhouette landmarks
const L = getLength(silhouette);
let top = { y: 1e9 },
  paw = { y: -1e9 },
  near = { dist: 1e9 };
scan(silhouette, 0.02, (p, t) => {
  if (p.y < top.y) top = { ...p, t };
  if (p.y > paw.y) paw = { ...p, t };
  const dd = Math.hypot(p.x - flameBase.x, p.y - flameBase.y);
  if (dd < near.dist) near = { ...p, t, dist: dd };
});

// exact bezier sub-segment of the closed silhouette between two arc lengths
const closedAbs = (() => {
  // absolute M/L/C instructions, Z replaced by an explicit L back to the start
  const ins = reduceInstructions(parsePath(silhouette));
  const out = [];
  let start = null;
  let cur = null;
  for (const i of ins) {
    if (i.type === "M") {
      start = [i.x, i.y];
      cur = start;
      out.push(i);
    } else if (i.type === "Z") {
      if (Math.hypot(cur[0] - start[0], cur[1] - start[1]) > 1e-6) out.push({ type: "L", x: start[0], y: start[1] });
      cur = start;
    } else {
      out.push(i);
      cur = [i.x, i.y];
    }
  }
  return serializeInstructions(out);
})();
const segment = (d, a, b) => {
  // path from length a to length b (a < b) along d
  const head = cutPath(d, b);
  const tail = reversePath(cutPath(reversePath(head), b - a));
  return tail;
};
const joinPaths = (d1, d2) => {
  // append d2 (which starts where d1 ends) without its initial M
  const i2 = reduceInstructions(parsePath(d2)).slice(1);
  return serializeInstructions([...reduceInstructions(parsePath(d1)), ...i2]);
};
const Lc = getLength(closedAbs);
const t0 = near.t;
const t1 = paw.t;
// A: forward (increasing length), B: backward (decreasing length); both start at the split point, end at the paw
const routeA = t1 > t0 ? segment(closedAbs, t0, t1) : joinPaths(segment(closedAbs, t0, Lc), segment(closedAbs, 0, t1));
const routeBrev = t1 > t0 ? joinPaths(segment(closedAbs, t1, Lc), segment(closedAbs, 0, t0)) : segment(closedAbs, t1, t0);
const routeB = reversePath(routeBrev);
const lenA = getLength(routeA);
const lenB = getLength(routeB);
const endA = getPointAtLength(routeA, lenA);
const endB = getPointAtLength(routeB, lenB);
const startA = getPointAtLength(routeA, 0);
const startB = getPointAtLength(routeB, 0);
if (Math.hypot(endA.x - endB.x, endA.y - endB.y) > 0.05) fail("spark routes do not meet at the paw");
if (Math.hypot(startA.x - startB.x, startA.y - startB.y) > 0.05) fail("spark routes do not start together");

// the same routes inset to the middle of the 2.9 u outline band (spark heads + dark hairline ride here)
const silPoly = [];
scan(silhouette, 0.25, (p) => silPoly.push([p.x, p.y]));
const inside = (x, y) => {
  let c = false;
  for (let i = 0, j = silPoly.length - 1; i < silPoly.length; j = i++) {
    const [xi, yi] = silPoly[i];
    const [xj, yj] = silPoly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const BAND = 2.9;
const inset = (d, off) => {
  const Ld = getLength(d);
  // one consistent inward side for the whole route (majority vote)
  let votes = 0;
  for (let k = 1; k < 40; k++) {
    const t = (Ld * k) / 40;
    const p = getPointAtLength(d, t);
    const v = getTangentAtLength(d, t);
    votes += inside(p.x - v.y * 0.6, p.y + v.x * 0.6) ? 1 : -1;
  }
  const side = votes > 0 ? 1 : -1;
  const pts = [];
  const n = Math.ceil(Ld / 0.5);
  for (let k = 0; k <= n; k++) {
    const t = (Ld * k) / n;
    const p = getPointAtLength(d, t);
    const v = getTangentAtLength(d, t);
    pts.push([p.x - v.y * off * side, p.y + v.x * off * side]);
  }
  return "M" + pts.map((p) => p.map((v) => v.toFixed(2)).join(" ")).join("L");
};
const routeAIn = inset(routeA, BAND / 2);
const routeBIn = inset(routeB, BAND / 2);

// anchors and handles (M/C/L parse) of silhouette + flame
const anchorsOf = (d) => {
  const ins = reduceInstructions(parsePath(d));
  const anchors = [];
  const handles = [];
  let prev = null;
  for (const i of ins) {
    if (i.type === "M" || i.type === "L") {
      anchors.push([r3(i.x), r3(i.y)]);
      prev = [i.x, i.y];
    } else if (i.type === "C") {
      handles.push([[r3(prev[0]), r3(prev[1])], [r3(i.cp1x), r3(i.cp1y)]]);
      handles.push([[r3(i.x), r3(i.y)], [r3(i.cp2x), r3(i.cp2y)]]);
      anchors.push([r3(i.x), r3(i.y)]);
      prev = [i.x, i.y];
    }
  }
  // drop the closing duplicate of the start point
  const [a0] = anchors;
  const last = anchors[anchors.length - 1];
  if (anchors.length > 1 && Math.hypot(a0[0] - last[0], a0[1] - last[1]) < 1e-3) anchors.pop();
  return { anchors, handles };
};
const mascotAnchors = anchorsOf(silhouette);
const flameAnchors = anchorsOf(flameSil);

// construction: circles fitted to the five lobes of the star head (Kasa least squares)
const fitCircle = (pts) => {
  let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0, sxz = 0, syz = 0, sz = 0;
  const n = pts.length;
  for (const [x, y] of pts) {
    const z = x * x + y * y;
    sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y; sxz += x * z; syz += y * z; sz += z;
  }
  // solve [sxx sxy sx; sxy syy sy; sx sy n] [A B C] = [sxz syz sz]
  const M = [
    [sxx, sxy, sx, sxz],
    [sxy, syy, sy, syz],
    [sx, sy, n, sz],
  ];
  for (let i = 0; i < 3; i++) {
    let p = i;
    for (let r = i + 1; r < 3; r++) if (Math.abs(M[r][i]) > Math.abs(M[p][i])) p = r;
    [M[i], M[p]] = [M[p], M[i]];
    for (let r = 0; r < 3; r++) {
      if (r === i) continue;
      const f = M[r][i] / M[i][i];
      for (let c = i; c < 4; c++) M[r][c] -= f * M[i][c];
    }
  }
  const A = M[0][3] / M[0][0], B = M[1][3] / M[1][1], C = M[2][3] / M[2][2];
  const cx = A / 2, cy = B / 2;
  return { cx: r3(cx), cy: r3(cy), r: r3(Math.sqrt(C + cx * cx + cy * cy)) };
};
const headLen = getLength(headSolid);
const headPts = [];
for (let t = 0; t < headLen; t += 0.5) {
  const p = getPointAtLength(headSolid, t);
  headPts.push([p.x, p.y, t]);
}
const hc = headPts.reduce((a, [x, y]) => [a[0] + x / headPts.length, a[1] + y / headPts.length], [0, 0]);
const rad = headPts.map(([x, y]) => Math.hypot(x - hc[0], y - hc[1]));
// lobe tips = the 5 strongest local maxima of the radius (min 40 u apart along the contour)
const cand = rad
  .map((r, i) => ({ r, i }))
  .filter(({ i }) => {
    for (let k = 1; k <= 16; k++) {
      const a = rad[(i - k + rad.length) % rad.length];
      const b = rad[(i + k) % rad.length];
      if (a > rad[i] || b > rad[i]) return false;
    }
    return true;
  })
  .sort((a, b) => b.r - a.r);
const tips = [];
for (const c of cand) {
  if (tips.every((t) => Math.min(Math.abs(t.i - c.i), rad.length - Math.abs(t.i - c.i)) * 0.5 > 40)) tips.push(c);
  if (tips.length === 5) break;
}
// fit each lobe on the contour points within ±9 u of arc length around its tip
const lobes = tips
  .map(({ i }) => {
    const pts = [];
    for (let k = -18; k <= 18; k++) {
      const [x, y] = headPts[(i + k + headPts.length) % headPts.length];
      pts.push([x, y]);
    }
    const c = fitCircle(pts);
    const [tx, ty] = headPts[i];
    return { ...c, tip: [r3(tx), r3(ty)], ang: Math.atan2(ty - hc[1], tx - hc[0]) };
  })
  // clockwise from the top lobe (screen coordinates: angle grows clockwise)
  .sort((a, b) => ((a.ang + Math.PI / 2 + 4 * Math.PI) % (2 * Math.PI)) - ((b.ang + Math.PI / 2 + 4 * Math.PI) % (2 * Math.PI)))
  .map(({ ang, ...c }) => c);
const inscribed = { cx: r3(hc[0]), cy: r3(hc[1]), r: r3(Math.min(...rad)) };

// external tangent segments between consecutive lobe circles (the rounded-star hull)
const tangents = lobes.map((c1, i) => {
  const c2 = lobes[(i + 1) % lobes.length];
  const dx = c2.cx - c1.cx, dy = c2.cy - c1.cy;
  const dist = Math.hypot(dx, dy);
  const ux = dx / dist, uy = dy / dist;
  // external tangent: unit normal n with n·u = (r1 - r2) / d, on either side of the centre line
  const cosA = (c1.r - c2.r) / dist;
  const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
  const nx = ux * cosA - uy * sinA, ny = uy * cosA + ux * sinA;
  const n2x = ux * cosA + uy * sinA, n2y = uy * cosA - ux * sinA;
  // pick the normal pointing away from the head centre
  const mid = [(c1.cx + c2.cx) / 2, (c1.cy + c2.cy) / 2];
  const away = (vx, vy) => (mid[0] + vx - hc[0]) ** 2 + (mid[1] + vy - hc[1]) ** 2;
  const [vx, vy] = away(nx, ny) > away(n2x, n2y) ? [nx, ny] : [n2x, n2y];
  return [
    [r3(c1.cx + c1.r * vx), r3(c1.cy + c1.r * vy)],
    [r3(c2.cx + c2.r * vx), r3(c2.cy + c2.r * vy)],
  ];
});

// flame teardrop: circle fitted to the round bottom of the flame silhouette + tangents to its tip
const flamePts = [];
let flameTip = { y: 1e9 };
scan(flameSil, 0.5, (p) => {
  flamePts.push([p.x, p.y]);
  if (p.y < flameTip.y) flameTip = p;
});
const flameBottom = flamePts.filter(([, y]) => y > 30);
const flameCircle = fitCircle(flameBottom);
const tangentTo = (c, p) => {
  const dx = p[0] - c.cx, dy = p[1] - c.cy;
  const d = Math.hypot(dx, dy);
  const a = Math.atan2(dy, dx);
  const b = Math.acos(Math.min(1, c.r / d));
  return [a + b, a - b].map((ang) => [
    [r3(c.cx + c.r * Math.cos(ang)), r3(c.cy + c.r * Math.sin(ang))],
    [r3(p[0]), r3(p[1])],
  ]);
};
const flameTangents = tangentTo(flameCircle, [flameTip.x, flameTip.y]);

// type metrics measured on the letters
const ys = (id, k) => letterData.find((l) => l.id === id).bbox[k];
const metrics = {
  ascender: ys("k", 1),
  xHeight: Math.min(ys("s", 1), ys("e1", 1), ys("e2", 1)),
  baseline: ys("r", 3),
  overshoot: Math.max(ys("s", 3), ys("a", 3), ys("e1", 3)),
  descender: ys("p", 3),
};
const eyeLine = {
  l: [r3(+eyeL.cx), r3(+eyeL.cy)],
  r: [r3(+eyeR.cx), r3(+eyeR.cy)],
  deg: r3((Math.atan2(+eyeR.cy - +eyeL.cy, +eyeR.cx - +eyeL.cx) * 180) / Math.PI),
};
const sparkleBox = bb(sparkleD);
const sparkleCentre = [r3((sparkleBox[0] + sparkleBox[2]) / 2), r3((sparkleBox[1] + sparkleBox[3]) / 2)];
const silBox = bb(silhouette);
const tanAt = (d, t) => {
  const v = getTangentAtLength(d, t);
  return [r3(v.x), r3(v.y)];
};

const geo = {
  flameBase: pt(flameBase),
  flameTip: pt(flameTip),
  silhouetteLength: r3(L),
  silhouetteBox: silBox,
  top: pt(top),
  paw: pt(paw),
  split: pt(near),
  routeA,
  routeB,
  routeAIn,
  routeBIn,
  lenA: r3(lenA),
  lenB: r3(lenB),
  lenAIn: r3(getLength(routeAIn)),
  lenBIn: r3(getLength(routeBIn)),
  band: BAND,
  tanA0: tanAt(routeA, 0),
  tanB0: tanAt(routeB, 0),
  sparkleBox,
  sparkleCentre,
  metrics,
  eyeLine,
  eyeR: { cx: +eyeR.cx, cy: +eyeR.cy, r: +eyeR.r },
  eyeL: { cx: +eyeL.cx, cy: +eyeL.cy, rx: +eyeL.rx, ry: +eyeL.ry },
  mouthBox,
  mouthCentre: [r3((mouthBox[0] + mouthBox[2]) / 2), r3((mouthBox[1] + mouthBox[3]) / 2)],
  headCentre: [r3(hc[0]), r3(hc[1])],
  lobes,
  inscribed,
  tangents,
  flameCircle,
  flameTangents,
  mascotAnchors,
  flameAnchors,
  kernGaps: letterData.slice(1).map((l, i) => r3(l.bbox[0] - letterData[i].bbox[2])),
};

// ---------------------------------------------------------------- 4. write
const data = {
  checksums,
  viewBox: [0, 0, 568, 292],
  defsLight: [...lightDefs.values()].join(""),
  defsDark: darkDefs,
  letters: letterData,
  lettersDark: darkLetters,
  wordmarkDarkFill: wordmarkFill,
  outlineUnderlap: underlapPaths,
  outline: outlinePath,
  silhouette,
  silhouetteFlame,
  flame: { silhouette: flameSil, outline: flameOutline, fills: flameFills, fillD: flameFillD },
  fills,
  sparkle: { d: sparkleD, fills: sparkleFills },
  darkGlow: serGroup(glow),
  darkSparkleGlow: serGroup(sparkleGlow),
  geo,
};
mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(
  OUT,
  `// GENERATED by scripts/build-logo-kit.mjs from assets/img/logo-parts (= tools/logo-dark/parts, sha256-checked)\n` +
    `// and assets/img/logo-dark.svg. Do not edit by hand. Coordinates = logo.svg viewBox 0 0 568 292 (Figma 124:3).\n` +
    `// Markup strings carry the id namespace token __P__ (see ns() in parts.tsx).\n` +
    `/* eslint-disable */\n` +
    `export const LOGO = ${JSON.stringify(data)};\n`,
);

// ---------------------------------------------------------------- 5. guard: no retired concept images
const bad = /assets\/figma|figma-export|raw-[\w-]*\.png|brand-board|board-grid|overview\.png|logo-[ab]\.(png|svg)/;
const walk = (dir) =>
  readdirSync(dir).flatMap((n) => {
    const p = path.join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
for (const f of walk(path.join(root, "src/comps/story"))) {
  const text = readFileSync(f, "utf8");
  const m = text.match(bad);
  if (m) fail(`${path.relative(root, f)} references a retired concept asset (${m[0]})`);
}

console.log(
  `logo kit: ${Object.keys(checksums).length} parts verified, routes A ${lenA.toFixed(1)} u / B ${lenB.toFixed(1)} u, ` +
    `${mascotAnchors.anchors.length}+${flameAnchors.anchors.length} anchors, ${lobes.length} lobes, eye line ${eyeLine.deg}°`,
);
console.log(`  flame base ${pt(flameBase)}  split ${pt(near)}  paw ${pt(paw)}  ✦ ${sparkleCentre}`);
console.log(`  metrics ${JSON.stringify(metrics)}  kern gaps ${geo.kernGaps}`);
console.log(`  lobes ${JSON.stringify(lobes)}\n  inscribed ${JSON.stringify(inscribed)} flameCircle ${JSON.stringify(flameCircle)}`);
