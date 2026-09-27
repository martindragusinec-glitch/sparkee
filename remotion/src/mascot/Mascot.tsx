import React, { useId, useLayoutEffect, useMemo, useReducer, useRef } from "react";
import { continueRender, delayRender, staticFile } from "remotion";

/**
 * <Mascot> renders a Sparkee pose SVG exactly as drawn (logo vectors untouched), loaded from
 * the website's image folder (Remotion publicDir = ../assets/img), e.g. src="poses/stand.svg".
 *
 * It only relies on these semantic classes, all optional:
 *   top-level groups              whole body: bob, squash, lean (around the feet), spin
 *   .m-body(-ink)                 its bottom-centre is measured as the ground contact ("feet")
 *   .m-shadow                     hidden; the component draws its own floor shadow instead
 *   .m-head                       headTilt (pivot: bottom centre of the head)
 *   .m-flame                      flameWiggle (pivot: bottom centre of the flame)
 *   .m-face                       lookX / lookY (in viewBox units, screen direction)
 *   .m-eye-l / .m-eye-r           blink (scaleY around each eye)
 *   .m-eyes / .m-eyes--happy      `happy`: true → ^^ eyes, false → round eyes (official vectors are
 *                                 injected when a pose lacks that set), undefined → pose file as drawn
 *   .m-mouth                      mouthScale
 * Anything else can be rotated/scaled/moved with `parts={{".selector": {deg, pivot}}}`.
 * Ids are namespaced per instance, so several mascots can share one composition.
 */

export type Pivot = "top" | "center" | "bottom" | "left" | "right" | [number, number];
export type PartTransform = { deg?: number; pivot?: Pivot; dx?: number; dy?: number; scale?: number; opacity?: number };

export type MascotProps = {
  /** file inside sparkee-web/assets/img, e.g. "poses/stand.svg" */
  src?: string;
  /** rendered width in px; height follows the viewBox ratio (never stretched) */
  width: number;
  /** force a common viewBox so different poses line up (they share head coordinates) */
  viewBox?: string;
  bob?: number; // viewBox units, negative = up
  headTilt?: number; // deg
  lookX?: number; // viewBox units
  lookY?: number;
  blink?: number; // 0 open … 1 closed
  /** true = ^^ eyes, false = round eyes, undefined = whatever the pose file draws */
  happy?: boolean;
  mouthScale?: number;
  flameWiggle?: number; // deg
  /** 1 = none, <1 squash, >1 stretch (volume kept), anchored on the feet */
  squash?: number;
  /** whole-body rotation around the body centre (e.g. flips), deg */
  spin?: number;
  /** whole-body rotation around the feet (rocking, leaning toward something), deg */
  lean?: number;
  parts?: Record<string, PartTransform>;
  shadow?: boolean;
  shadowColor?: string;
  /** feet point in viewBox coordinates (shadow centre / squash anchor) */
  feet?: [number, number];
  /** strip the hidden hole sub-paths from the head outline (default true, see solidify) */
  solidHead?: boolean;
  style?: React.CSSProperties;
};

export const STAND_VB = "374 20 264 462";
export const STAND_FEET: [number, number] = [504, 440];

type Parsed = { viewBox: string; inner: string; innerSolid: string; vb: number[]; feet: [number, number] };

/**
 * The head outline path (#m-head-shape and the head fills) carries hole sub-paths under the eyes,
 * mouth and cheeks. They are invisible at rest (the face covers them) but show up as rings as soon
 * as the face moves or the ^^ eyes replace the round ones. "Solid" keeps only the outer contour.
 */
const solidify = (root: Element) => {
  const def = root.querySelector("#m-head-shape");
  const d = def?.getAttribute("d");
  if (!def || !d || /m/.test(d)) return root.innerHTML;
  const outer = d.split(/(?=M)/)[0];
  const clone = root.cloneNode(true) as Element;
  clone.querySelector("#m-head-shape")!.setAttribute("d", outer);
  clone.querySelectorAll(".m-head path").forEach((p) => {
    const pd = p.getAttribute("d");
    if (pd && pd !== outer && pd.startsWith(outer)) p.setAttribute("d", outer);
  });
  return clone.innerHTML;
};

/**
 * Ground contact point of a pose, in viewBox units: bottom-centre of the body drawing
 * (all transforms applied). Poses without a body (head, peek) use the whole drawing.
 */
const measureFeet = (inner: string, vb: number[]): [number, number] => {
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-20000px;top:0;visibility:hidden;pointer-events:none";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", vb.join(" "));
  svg.setAttribute("width", String(vb[2]));
  svg.setAttribute("height", String(vb[3]));
  svg.innerHTML = inner.replace(/\sid="/g, ' id="measure-').replace(/url\(#/g, "url(#measure-").replace(/href="#/g, 'href="#measure-');
  host.appendChild(svg);
  document.body.appendChild(host);
  try {
    const r0 = svg.getBoundingClientRect();
    const el =
      svg.querySelector(".m-body-ink") ??
      svg.querySelector(".m-body") ??
      svg.querySelector(".m-float") ??
      svg;
    const r = el.getBoundingClientRect();
    const sx = vb[2] / r0.width;
    const sy = vb[3] / r0.height;
    return [vb[0] + (r.left + r.width / 2 - r0.left) * sx, vb[1] + (r.bottom - r0.top) * sy];
  } finally {
    host.remove();
  }
};

const cache = new Map<string, Promise<Parsed>>();
const resolved = new Map<string, Parsed>();

const load = (src: string): Promise<Parsed> => {
  if (!cache.has(src)) {
    cache.set(
      src,
      fetch(staticFile(src))
        .then((r) => {
          if (!r.ok) throw new Error(`Mascot: cannot load ${src} (${r.status})`);
          return r.text();
        })
        .then((text) => {
          const doc = new DOMParser().parseFromString(text, "image/svg+xml");
          const root = doc.documentElement;
          const viewBox = root.getAttribute("viewBox") ?? "0 0 100 100";
          const vb = viewBox.split(/[\s,]+/).map(Number);
          const innerSolid = solidify(root);
          const p: Parsed = { viewBox, inner: root.innerHTML, innerSolid, vb, feet: measureFeet(innerSolid, vb) };
          resolved.set(src, p);
          return p;
        }),
    );
  }
  return cache.get(src)!;
};

/** Loads a pose file (blocking the render until ready) and returns its parsed data. */
export const useMascotFile = (src: string): Parsed | null => {
  const [, bump] = useReducer((x: number) => x + 1, 0);
  useLayoutEffect(() => {
    if (resolved.has(src)) return;
    const h = delayRender(`Loading mascot ${src}`);
    load(src)
      .then(() => {
        bump();
        continueRender(h);
      })
      .catch((e) => {
        console.error(e);
        continueRender(h);
      });
  }, [src]);
  return resolved.get(src) ?? null;
};

/** Start fetching pose files early (call at module level of a composition). */
export const preloadMascots = (srcs: string[]) => srcs.forEach((s) => void load(s).catch(() => undefined));

/** Namespace every id (and its url(#)/href="#" references) per instance. */
const namespaceIds = (svg: string, prefix: string) => {
  const ids = new Set<string>();
  svg.replace(/\sid="([^"]+)"/g, (_, id: string) => {
    ids.add(id);
    return "";
  });
  let out = svg;
  ids.forEach((id) => {
    const esc = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out
      .replace(new RegExp(`\\sid="${esc}"`, "g"), ` id="${prefix}${id}"`)
      .replace(new RegExp(`url\\(#${esc}\\)`, "g"), `url(#${prefix}${id})`)
      .replace(new RegExp(`href="#${esc}"`, "g"), `href="#${prefix}${id}"`);
  });
  return out;
};

/** Official ^^ eyes from poses/happy.svg (same head coordinates in every pose). */
const HAPPY_EYES =
  '<path d="M441 283.5Q455 264.5 469 283.5" transform="rotate(-24 455 278.5)" fill="none" stroke="#2C303C" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>' +
  '<path d="M513.75 251.25Q528.75 231.25 543.75 251.25" transform="rotate(-24 528.75 246.25)" fill="none" stroke="#2C303C" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>';

/** Official round eyes from poses/stand.svg. */
const ROUND_EYES =
  '<g class="m-eye m-eye-l"><g><ellipse cx="455" cy="278.499" rx="15" ry="15.5" fill="#2C303C"/><circle cx="458.1" cy="272.219" r="5.5" fill="white"/><circle opacity="0.95" cx="450.25" cy="284.969" r="2.75" fill="white"/></g></g>' +
  '<g class="m-eye m-eye-r"><g><path d="M513.91 249.849C512.59 246.939 513.1 244.329 514.06 241.409L513.91 249.849Z" fill="#2E3441"/><circle cx="528.75" cy="246.25" r="16.75" fill="#2C303C"/><circle cx="531.57" cy="239.02" r="5.5" fill="white"/><circle opacity="0.95" cx="523.125" cy="253.02" r="2.75" fill="white"/></g></g>';

type Bx = { x: number; y: number; width: number; height: number };
const pivotOf = (b: Bx, p: Pivot = "center"): [number, number] => {
  if (Array.isArray(p)) return p;
  const cx = b.x + b.width / 2;
  const cy = b.y + b.height / 2;
  if (p === "top") return [cx, b.y];
  if (p === "bottom") return [cx, b.y + b.height];
  if (p === "left") return [b.x, cy];
  if (p === "right") return [b.x + b.width, cy];
  return [cx, cy];
};

// original transform attribute + untransformed bbox per element
const baseAttr = new WeakMap<Element, string>();
const baseBox = new WeakMap<Element, Bx>();
const setT = (el: Element | null, extra: string) => {
  if (!el) return;
  if (!baseAttr.has(el)) baseAttr.set(el, el.getAttribute("transform") ?? "");
  const t = `${baseAttr.get(el)} ${extra}`.trim();
  if (t) el.setAttribute("transform", t);
  else el.removeAttribute("transform");
};
const bbox = (el: Element): Bx => {
  if (!baseBox.has(el)) {
    const b = (el as SVGGraphicsElement).getBBox();
    baseBox.set(el, { x: b.x, y: b.y, width: b.width, height: b.height });
  }
  return baseBox.get(el)!;
};

export const Mascot: React.FC<MascotProps> = ({
  src = "poses/stand.svg",
  width,
  viewBox,
  bob = 0,
  headTilt = 0,
  lookX = 0,
  lookY = 0,
  blink = 0,
  happy,
  mouthScale = 1,
  flameWiggle = 0,
  squash = 1,
  spin = 0,
  lean = 0,
  parts,
  shadow = true,
  shadowColor = "#2C303C",
  feet: feetProp,
  solidHead = true,
  style,
}) => {
  const data = useMascotFile(src);
  const rid = useId();
  const prefix = useMemo(() => `mx${rid.replace(/[^a-zA-Z0-9]/g, "")}-`, [rid]);
  const gRef = useRef<SVGGElement>(null);

  const feet = feetProp ?? data?.feet ?? STAND_FEET;
  const html = useMemo(
    () => (data ? namespaceIds(solidHead ? data.innerSolid : data.inner, prefix) : ""),
    [data, prefix, solidHead],
  );

  // Apply the pose parameters to the SVG DOM. Pure function of props -> deterministic per frame.
  useLayoutEffect(() => {
    const g = gRef.current;
    if (!g || !html) return;
    const q = (s: string) => g.querySelector(s);
    const qa = (s: string) => Array.from(g.querySelectorAll(s));
    const [fx, fy] = feet;

    const fileShadow = q(".m-shadow");
    if (fileShadow) (fileShadow as SVGElement).style.display = "none";

    // body: every top-level drawing group (the file's own shadow excluded)
    const movers = Array.from(g.children).filter((c) => c !== fileShadow && c.tagName.toLowerCase() !== "defs");
    const sx = 1 / Math.sqrt(squash);
    const cy = fy - 200; // body centre used for spins
    movers.forEach((m) =>
      setT(
        m,
        `translate(0 ${bob}) rotate(${lean} ${fx} ${fy}) rotate(${spin} ${fx} ${cy}) translate(${fx} ${fy}) scale(${sx} ${squash}) translate(${-fx} ${-fy})`,
      ),
    );

    const head = q(".m-head");
    if (head) {
      const [px, py] = pivotOf(bbox(head), "bottom");
      setT(head, `rotate(${headTilt} ${px} ${py - 30})`);
    }
    const flame = q(".m-flame");
    if (flame) {
      const [px, py] = pivotOf(bbox(flame), "bottom");
      setT(flame, `rotate(${flameWiggle} ${px} ${py})`);
    }
    const face = q(".m-face");
    if (face && face.parentNode) {
      // map a viewBox-space vector into the face's local space (head groups may be rotated)
      const parent = face.parentNode as SVGGraphicsElement;
      const svg = g.ownerSVGElement!;
      const m = parent.getScreenCTM()!.inverse().multiply(svg.getScreenCTM()!);
      setT(face, `translate(${m.a * lookX + m.c * lookY} ${m.b * lookX + m.d * lookY})`);
    }

    // eyes: file's own set, or injected official sets when the pose lacks the requested one
    const ns = "http://www.w3.org/2000/svg";
    const inject = (cls: string, markup: string, after: Element) => {
      const el = document.createElementNS(ns, "g");
      el.setAttribute("class", cls);
      el.innerHTML = markup;
      after.parentNode!.insertBefore(el, after.nextSibling);
      return el;
    };
    const anchor = q(".m-eyes") ?? q(".m-mouth");
    let round = q(".m-eyes:not(.m-eyes--happy):not(.m-eyes--surprised)") ?? q(".m-eyes-round-inj");
    let joy = q(".m-eyes--happy, .m-eyes-happy, .m-eyes-happy-inj");
    const other = qa(".m-eyes--surprised");
    if (happy === true && !joy && anchor) joy = inject("m-eyes-happy-inj", HAPPY_EYES, anchor);
    if (happy === false && !round && anchor) round = inject("m-eyes-round-inj", ROUND_EYES, anchor);
    if (happy !== undefined) {
      round?.setAttribute("opacity", happy ? "0" : "1");
      joy?.setAttribute("opacity", happy ? "1" : "0");
      other.forEach((o) => o.setAttribute("opacity", "0"));
    }
    qa(".m-eye-l, .m-eye-r").forEach((e) => {
      const [ex, ey] = pivotOf(bbox(e), "center");
      const s = Math.max(0.1, 1 - blink);
      setT(e, `translate(${ex} ${ey}) scale(1 ${s}) translate(${-ex} ${-ey})`);
    });
    const mouth = q(".m-mouth");
    if (mouth) {
      const [mx, my] = pivotOf(bbox(mouth), "center");
      setT(mouth, `translate(${mx} ${my}) scale(${mouthScale}) translate(${-mx} ${-my})`);
    }

    if (parts) {
      Object.entries(parts).forEach(([sel, r]) => {
        qa(sel).forEach((el) => {
          const [px, py] = pivotOf(bbox(el), r.pivot);
          const s = r.scale ?? 1;
          setT(
            el,
            `translate(${r.dx ?? 0} ${r.dy ?? 0}) rotate(${r.deg ?? 0} ${px} ${py}) translate(${px} ${py}) scale(${s}) translate(${-px} ${-py})`,
          );
          if (r.opacity !== undefined) el.setAttribute("opacity", String(r.opacity));
        });
      });
    }
  });

  const vbStr = viewBox ?? data?.viewBox ?? STAND_VB;
  const vb = vbStr.split(/[\s,]+/).map(Number);
  const height = (width * vb[3]) / vb[2];
  const lift = Math.max(0, -bob);
  const k = Math.max(0.45, 1 - lift / 160);
  return (
    <svg
      viewBox={vbStr}
      width={width}
      height={height}
      style={{ overflow: "visible", display: "block", ...style }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {shadow ? (
        <ellipse cx={feet[0]} cy={feet[1]} rx={50 * k} ry={7 * k} fill={shadowColor} opacity={0.13 * (0.4 + 0.6 * k)} />
      ) : null}
      <g ref={gRef} dangerouslySetInnerHTML={{ __html: html }} />
    </svg>
  );
};

/**
 * Place a mascot so that its ground contact (feet) sits at (x, y) in the parent.
 * `width` is the size of 264 viewBox units (the standing poses' width), so every pose file
 * renders at the same scale even when its viewBox is wider (e.g. the sticker outline).
 */
export const MascotAt: React.FC<MascotProps & { x: number; y: number; flip?: boolean }> = ({
  x,
  y,
  flip,
  src = "poses/stand.svg",
  viewBox: vbProp,
  feet: feetProp,
  width,
  style,
  ...rest
}) => {
  const data = useMascotFile(src);
  const viewBox = vbProp ?? data?.viewBox ?? STAND_VB;
  const vb = viewBox.split(/[\s,]+/).map(Number);
  const feet = feetProp ?? data?.feet ?? STAND_FEET;
  const s = width / 264;
  const w = vb[2] * s;
  const ox = (feet[0] - vb[0]) * s;
  const oy = (feet[1] - vb[1]) * s;
  return (
    <div
      style={{
        position: "absolute",
        left: x - ox,
        top: y - oy,
        width: w,
        transformOrigin: `${ox}px ${oy}px`,
        scale: flip ? "-1 1" : undefined,
        ...style,
      }}
    >
      {data ? <Mascot src={src} width={w} viewBox={viewBox} feet={feet} {...rest} /> : null}
    </div>
  );
};
