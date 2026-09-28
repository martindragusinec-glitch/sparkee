import React from "react";
import { evolvePath } from "@remotion/paths";
import { LOGO } from "./logo-data.gen";
import { FLOOD_DIR, FLOOD_RANGE, GEO, HEAD_DEG, LETTERS, LETTERS_DARK, RISE_EDGE, M, type Pt } from "./geometry";
import { useNs } from "./stage";

/**
 * <LogoRig> — the official Sparkee logo (Figma 124:3) assembled from its real parts, as a pure function
 * of a state object. With every field at its default (all 1 / 0) it renders exactly logo.svg (theme
 * "light") or logo-dark.svg (theme "dark"): same paths, same fills, same layer order, no masks.
 *
 * Draw it inside a <LogoStage> (logo units). Layer order always matches the official files:
 *   light  letters · mascot_outline_underlap · mascot_fills · flame · sparkle
 *   dark   #glow · #sparkle-glow · #wordmark · #mascot (flame, fills) · #sparkle
 *
 * The mascot is never deformed: it only translates (mascotDx/Dy). The only other transforms are the
 * flame's rigid rotation about its base, the eyes scaling along the head's own 23.6° axis (blink /
 * open), the mouth's uniform pop and the ✦'s uniform scale + rotation.
 */
export type Theme = "light" | "dark";

/**
 * Per-letter state. `rise` 0..1: the letter rises out of the baseline behind a clip edge that sweeps up
 * the glyph (the k ascender resolves last, the p descender reveals downward) while lifting LIFT u.
 */
export type LetterState = { rise?: number; dx?: number; dy?: number; opacity?: number };
/** Progress of the two spark routes (A: clockwise over the head, B: counter-clockwise), 0..1 each. */
export type RoutePair = { a: number; b: number };

export type LogoState = {
  /** number = same rise for all 7 letters */
  letters?: number | LetterState[];
  /** light: the ink outline band drawn along the two routes (0 = none, 1 = complete) */
  outline?: number | RoutePair;
  /** head fill + interior outline lines, wiped along the holo vector (0..1) */
  flood?: number;
  /** body + limbs fill (0..1); defaults to `flood` */
  body?: number;
  /** soft edge of the wipe, logo units (default 40) */
  feather?: number;
  /** strength of the band of light that leads the flood (0 = none) */
  sheen?: number;
  /** optional radial seed of the flood (a tap point), unioned with the wipe */
  floodSeed?: { x: number; y: number; r: number; feather?: number };
  cheeks?: number;
  /** mouth uniform scale (0 hidden … 1 rest; BLOOM overshoot allowed) */
  mouth?: number;
  /** eyes 0 closed (a thin line) … 1 open */
  eyes?: number;
  /** 0 open … 1 shut (multiplies `eyes`) */
  blink?: number;
  /** ≥ 0.5: the official ^^ eyes (poses/happy.svg, mapped through the lie transform) replace the round eyes */
  happy?: number;
  /** flame reveal bottom-up 0..1 */
  flame?: number;
  /** rigid flame rotation about its base, degrees */
  flameRot?: number;
  /** dark: white-hot core over the flame, 0..1 */
  flameCore?: number;
  sparkle?: number | { scale?: number; rot?: number; opacity?: number; dx?: number; dy?: number };
  /** dark: #glow revealed along the two routes (0..1 or per route) */
  glow?: number | RoutePair;
  /** dark: #glow intensity (1 = official; >1 adds light) */
  glowGain?: number;
  /** dark: #sparkle-glow opacity */
  sparkleGlow?: number;
  /** dark: #sparkle-glow intensity (1 = official; 1.4 = a second copy at 40 %) */
  sparkleGlowGain?: number;
  mascotDx?: number;
  mascotDy?: number;
};

const INK = "#2C303C";
/** how far a letter lifts while it rises out of the baseline (logo units) */
export const LIFT = 10;
const pair = (v: number | RoutePair | undefined): RoutePair => (typeof v === "number" ? { a: v, b: v } : (v ?? { a: 1, b: 1 }));
const full = (p: RoutePair) => p.a >= 1 && p.b >= 1;

/** Route strokes (for masks): the silhouette split at the flame and run both ways to the lowest paw. */
export const RouteStrokes: React.FC<{
  p: RoutePair;
  width: number;
  inset?: boolean;
  stroke?: string;
  opacity?: number;
  cap?: "butt" | "round";
}> = ({ p, width, inset = false, stroke = "#fff", opacity, cap = "butt" }) => {
  const A = inset ? GEO.routeAIn : GEO.routeA;
  const B = inset ? GEO.routeBIn : GEO.routeB;
  return (
    <>
      {p.a > 0 ? (
        <path d={A} fill="none" stroke={stroke} strokeWidth={width} strokeLinecap={cap} opacity={opacity} {...evolvePath(Math.min(1, p.a), A)} />
      ) : null}
      {p.b > 0 ? (
        <path d={B} fill="none" stroke={stroke} strokeWidth={width} strokeLinecap={cap} opacity={opacity} {...evolvePath(Math.min(1, p.b), B)} />
      ) : null}
    </>
  );
};

/** Linear wipe gradient along the holo vector: white behind the front, `feather` wide, black ahead. */
export const wipeStops = (progress: number, feather: number) => {
  const [p0, p1] = FLOOD_RANGE;
  const front = p0 + (p1 - p0 + feather) * progress;
  const a = front - feather;
  return {
    x1: FLOOD_DIR[0] * a,
    y1: FLOOD_DIR[1] * a,
    x2: FLOOD_DIR[0] * front,
    y2: FLOOD_DIR[1] * front,
  };
};

const MASK_BOX = { x: -40, y: -40, width: 660, height: 380 };

/** poses/happy.svg ^^ (= Mascot.tsx HAPPY_EYES) mapped from rig units into logo units: (p − (103.22, 53.78)) × 0.569486 */
const HAPPY_EYES =
  '<g transform="scale(0.569486) translate(-103.22 -53.78)">' +
  '<path d="M441 283.5Q455 264.5 469 283.5" transform="rotate(-24 455 278.5)" fill="none" stroke="#2C303C" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>' +
  '<path d="M513.75 251.25Q528.75 231.25 543.75 251.25" transform="rotate(-24 528.75 246.25)" fill="none" stroke="#2C303C" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>' +
  "</g>";

const eyeTransform = (cx: number, cy: number, s: number) =>
  s >= 1
    ? undefined
    : `translate(${cx} ${cy}) rotate(${HEAD_DEG}) scale(1 ${s}) rotate(${-HEAD_DEG}) translate(${-cx} ${-cy})`;

export const LogoRig: React.FC<{ theme: Theme; st?: LogoState }> = ({ theme, st = {} }) => {
  const ns = useNs();
  const dark = theme === "dark";

  // ---- normalise
  const letters: Required<LetterState>[] = LETTERS.map((_, i) => {
    const v = typeof st.letters === "number" ? { rise: st.letters } : (st.letters?.[i] ?? {});
    return { rise: v.rise ?? 1, dx: v.dx ?? 0, dy: v.dy ?? 0, opacity: v.opacity ?? 1 };
  });
  const outline = pair(st.outline);
  const flood = st.flood ?? 1;
  const body = st.body ?? flood;
  const feather = st.feather ?? 40;
  const sheen = st.sheen ?? 0;
  const cheeks = st.cheeks ?? 1;
  const mouth = st.mouth ?? 1;
  const eyes = st.eyes ?? 1;
  const blink = st.blink ?? 0;
  const happy = (st.happy ?? 0) >= 0.5;
  const flame = st.flame ?? 1;
  const flameRot = st.flameRot ?? 0;
  const flameCore = st.flameCore ?? 0;
  const sp = typeof st.sparkle === "number" ? { scale: st.sparkle } : (st.sparkle ?? {});
  const spScale = sp.scale ?? 1;
  const spRot = sp.rot ?? 0;
  const spOpacity = sp.opacity ?? 1;
  const glow = pair(st.glow);
  const glowGain = st.glowGain ?? 1;
  const sparkleGlow = st.sparkleGlow ?? 1;
  const sparkleGlowGain = st.sparkleGlowGain ?? 1;
  const mdx = st.mascotDx ?? 0;
  const mdy = st.mascotDy ?? 0;

  const floodOn = flood < 1 || !!st.floodSeed;
  const bodyOn = body < 1 || !!st.floodSeed;
  const outlineOn = !full(outline) || floodOn;
  const openness = Math.max(0, Math.min(1, eyes * (1 - blink)));
  // client (28. 9.): the round eyes are never squashed (a thin line reads as a broken face).
  // Anything below half open renders the official ^^ (poses/happy.svg) instead, like the web mascot.
  const eyeScale = 1;
  const eyesClosed = openness < 0.5;
  const faceAtRest = openness >= 1 && mouth === 1 && cheeks >= 1 && !happy;
  const moving = letters.some((l) => l.rise < 1 || l.dx !== 0 || l.dy !== 0) || mdx !== 0 || mdy !== 0;
  const mascotT = mdx || mdy ? `translate(${mdx} ${mdy})` : undefined;
  const [bx, by] = GEO.flameBase;
  const [scx, scy] = GEO.sparkleCentre;
  const [mcx, mcy] = GEO.mouthCentre as Pt;

  const F = LOGO.fills;
  // ---- defs (masks and clips of this frame)
  const wipe = (id: string, progress: number) => {
    const g = wipeStops(progress, feather);
    return (
      <>
        <linearGradient id={ns.id(`${id}-g`)} gradientUnits="userSpaceOnUse" {...g}>
          <stop offset={0} stopColor="#fff" />
          <stop offset={1} stopColor="#000" />
        </linearGradient>
        {st.floodSeed ? (
          <radialGradient id={ns.id(`${id}-r`)} gradientUnits="userSpaceOnUse" cx={st.floodSeed.x} cy={st.floodSeed.y} r={st.floodSeed.r + (st.floodSeed.feather ?? feather)}>
            <stop offset={Math.max(0, st.floodSeed.r / (st.floodSeed.r + (st.floodSeed.feather ?? feather)))} stopColor="#fff" />
            <stop offset={1} stopColor="#fff" stopOpacity={0} />
          </radialGradient>
        ) : null}
      </>
    );
  };
  const wipeRect = (id: string) => (
    <>
      <rect {...MASK_BOX} fill={ns.url(`${id}-g`)} />
      {st.floodSeed ? <rect {...MASK_BOX} fill={ns.url(`${id}-r`)} /> : null}
    </>
  );

  // a band of light riding just behind the flood front, on the fill that has arrived
  const sheenGrad = (id: string, progress: number) => {
    const [p0, p1] = FLOOD_RANGE;
    const front = p0 + (p1 - p0 + feather) * progress;
    const a = front - feather * 2.6;
    // the band dims out over the last 15 % so nothing pops when the flood completes
    const k = sheen * Math.min(1, (1 - progress) / 0.15);
    return (
      <linearGradient
        id={ns.id(id)}
        gradientUnits="userSpaceOnUse"
        x1={FLOOD_DIR[0] * a}
        y1={FLOOD_DIR[1] * a}
        x2={FLOOD_DIR[0] * front}
        y2={FLOOD_DIR[1] * front}
      >
        <stop offset={0} stopColor="#fff" stopOpacity={0} />
        <stop offset={0.62} stopColor="#fff" stopOpacity={k} />
        <stop offset={0.86} stopColor="#fff" stopOpacity={k * 0.35} />
        <stop offset={1} stopColor="#fff" stopOpacity={0} />
      </linearGradient>
    );
  };

  const clipLetters = letters.map((l, i) =>
    l.rise < 1 ? (
      <clipPath key={i} id={ns.id(`lc${i}`)} clipPathUnits="userSpaceOnUse">
        <rect
          x={LETTERS[i].bbox[0] - 4}
          y={RISE_EDGE - (RISE_EDGE - LETTERS[i].bbox[1] + 2) * Math.max(0, l.rise)}
          width={LETTERS[i].bbox[2] - LETTERS[i].bbox[0] + 8}
          height={(RISE_EDGE - LETTERS[i].bbox[1] + 2) * Math.max(0, l.rise)}
        />
        {LETTERS[i].bbox[3] > RISE_EDGE ? (
          <rect
            x={LETTERS[i].bbox[0] - 4}
            y={RISE_EDGE}
            width={LETTERS[i].bbox[2] - LETTERS[i].bbox[0] + 8}
            height={(M.descender - RISE_EDGE + 1) * Math.max(0, l.rise)}
          />
        ) : null}
      </clipPath>
    ) : null,
  );

  const defs = (
    <defs>
      {clipLetters}
      {floodOn ? wipe("flood", flood) : null}
      {bodyOn ? wipe("body", body) : null}
      {floodOn ? (
        <mask id={ns.id("flood")} maskUnits="userSpaceOnUse" {...MASK_BOX}>
          {wipeRect("flood")}
        </mask>
      ) : null}
      {bodyOn ? (
        <mask id={ns.id("body")} maskUnits="userSpaceOnUse" {...MASK_BOX}>
          {wipeRect("body")}
        </mask>
      ) : null}
      {floodOn && sheen > 0 && flood > 0 && flood < 1 ? sheenGrad("sheen", flood) : null}
      {bodyOn && sheen > 0 && body > 0 && body < 1 ? sheenGrad("bsheen", body) : null}
      {!dark && outlineOn ? (
        <mask id={ns.id("outline")} maskUnits="userSpaceOnUse" {...MASK_BOX}>
          {/* interior lines arrive with the flood; the exterior band (6 u deep) only where a route has passed */}
          {floodOn ? wipeRect("flood") : <rect {...MASK_BOX} fill="#fff" />}
          <path d={LOGO.silhouette} fill="none" stroke="#000" strokeWidth={12} />
          <RouteStrokes p={outline} width={12} />
        </mask>
      ) : null}
      {dark && !full(glow) ? (
        <>
          <filter id={ns.id("glowsoft")} x={-200} y={-200} width={968} height={692} filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation={9} />
          </filter>
          <mask id={ns.id("glow")} maskUnits="userSpaceOnUse" x={-200} y={-200} width={968} height={692}>
            <g filter={ns.url("glowsoft")}>
              <RouteStrokes p={glow} width={56} />
            </g>
          </mask>
        </>
      ) : null}
      {dark && moving ? (
        <mask id={ns.id("cut")} maskUnits="userSpaceOnUse" {...MASK_BOX}>
          <rect {...MASK_BOX} fill="#fff" />
          <path d={LOGO.silhouette} transform={mascotT} fill="#000" stroke="#000" strokeWidth={2.9} strokeLinejoin="round" />
        </mask>
      ) : null}
      {dark && flameCore > 0 ? (
        <linearGradient id={ns.id("core")} gradientUnits="userSpaceOnUse" x1={0} y1={by} x2={0} y2={0}>
          <stop offset={0} stopColor="#fff" />
          <stop offset={0.55} stopColor="#fff" stopOpacity={0.85} />
          <stop offset={1} stopColor="#fff" stopOpacity={0} />
        </linearGradient>
      ) : null}
      {flame < 1 ? (
        <clipPath id={ns.id("flame")} clipPathUnits="userSpaceOnUse">
          <rect x={bx - 40} y={by + 1.5 - (by + 3) * Math.max(0, flame)} width={80} height={(by + 3) * Math.max(0, flame)} />
        </clipPath>
      ) : null}
    </defs>
  );

  // ---- layers
  const letterLayer = (
    <g fill={dark ? LOGO.wordmarkDarkFill : INK} mask={dark && moving ? ns.url("cut") : undefined}>
      {letters.map((l, i) => {
        if (l.rise <= 0 || l.opacity <= 0) return null;
        const riseDy = l.rise < 1 ? (1 - l.rise) * LIFT : 0;
        const d = dark ? LETTERS_DARK[i].d : LETTERS[i].d;
        return (
          <g
            key={i}
            transform={l.dx || l.dy ? `translate(${l.dx} ${l.dy})` : undefined}
            opacity={l.opacity < 1 ? l.opacity : undefined}
            clipPath={l.rise < 1 ? ns.url(`lc${i}`) : undefined}
          >
            <path d={d} transform={riseDy ? `translate(0 ${riseDy})` : undefined} />
          </g>
        );
      })}
    </g>
  );

  const headD = faceAtRest ? F.head.d : F.head.dSolid;
  const fillLayer = (
    <>
      <g mask={bodyOn ? ns.url("body") : undefined}>
        <g dangerouslySetInnerHTML={{ __html: ns.markup(F.body) }} />
        {bodyOn && sheen > 0 && body > 0 && body < 1 ? <path d={F.bodyD} fill={ns.url("bsheen")} /> : null}
      </g>
      <g mask={floodOn ? ns.url("flood") : undefined}>
        {F.head.fills.map((fill, i) => (
          <path key={i} d={headD} fill={ns.markup(fill)} />
        ))}
        <g opacity={cheeks < 1 ? cheeks : undefined} dangerouslySetInnerHTML={{ __html: ns.markup(F.cheekR + F.cheekL) }} />
        <g dangerouslySetInnerHTML={{ __html: ns.markup(F.highlights) }} />
        {mouth > 0 ? (
          <g
            transform={mouth !== 1 ? `translate(${mcx} ${mcy}) scale(${mouth}) translate(${-mcx} ${-mcy})` : undefined}
            dangerouslySetInnerHTML={{ __html: ns.markup(F.mouth) }}
          />
        ) : null}
        {happy || eyesClosed ? (
          <g dangerouslySetInnerHTML={{ __html: HAPPY_EYES }} />
        ) : (
          <>
            <g transform={eyeTransform(GEO.eyeR.cx, GEO.eyeR.cy, eyeScale)} dangerouslySetInnerHTML={{ __html: ns.markup(F.eyeR) }} />
            <g transform={eyeTransform(GEO.eyeL.cx, GEO.eyeL.cy, eyeScale)} dangerouslySetInnerHTML={{ __html: ns.markup(F.eyeL) }} />
          </>
        )}
        {floodOn && sheen > 0 && flood > 0 && flood < 1 ? <path d={F.head.dSolid} fill={ns.url("sheen")} /> : null}
      </g>
    </>
  );

  const flameLayer =
    flame > 0 ? (
      <g transform={flameRot ? `rotate(${flameRot} ${bx} ${by})` : undefined}>
        <g clipPath={flame < 1 ? ns.url("flame") : undefined}>
          {dark ? null : <path d={LOGO.flame.silhouette} fill={INK} />}
          <g dangerouslySetInnerHTML={{ __html: ns.markup(LOGO.flame.fills) }} />
          {dark && flameCore > 0 ? <path d={LOGO.flame.fillD} fill={ns.url("core")} opacity={flameCore} /> : null}
        </g>
      </g>
    ) : null;

  const sparkleT =
    spScale !== 1 || spRot || sp.dx || sp.dy
      ? `translate(${scx + (sp.dx ?? 0)} ${scy + (sp.dy ?? 0)}) rotate(${spRot}) scale(${spScale}) translate(${-scx} ${-scy})`
      : undefined;
  const sparkleLayer =
    spScale > 0 && spOpacity > 0 ? (
      <g
        opacity={spOpacity < 1 ? spOpacity : undefined}
        transform={sparkleT}
        dangerouslySetInnerHTML={{ __html: ns.markup(LOGO.sparkle.fills) }}
      />
    ) : null;

  if (dark) {
    const glowOn = glow.a > 0 || glow.b > 0;
    return (
      <g>
        {defs}
        {glowOn ? (
          <g transform={mascotT}>
            <g mask={!full(glow) ? ns.url("glow") : undefined} dangerouslySetInnerHTML={{ __html: ns.markup(LOGO.darkGlow) }} />
            {glowGain > 1 ? (
              <g
                opacity={Math.min(1, glowGain - 1)}
                mask={!full(glow) ? ns.url("glow") : undefined}
                dangerouslySetInnerHTML={{ __html: ns.markup(LOGO.darkGlow) }}
              />
            ) : null}
          </g>
        ) : null}
        {sparkleGlow > 0 && spScale > 0 ? (
          <g
            opacity={sparkleGlow < 1 ? sparkleGlow * spOpacity : spOpacity < 1 ? spOpacity : undefined}
            transform={sparkleT}
            dangerouslySetInnerHTML={{ __html: ns.markup(LOGO.darkSparkleGlow) }}
          />
        ) : null}
        {sparkleGlowGain > 1 && sparkleGlow > 0 && spScale > 0 ? (
          <g
            opacity={Math.min(1, sparkleGlowGain - 1) * sparkleGlow * spOpacity}
            transform={sparkleT}
            dangerouslySetInnerHTML={{ __html: ns.markup(LOGO.darkSparkleGlow) }}
          />
        ) : null}
        {letterLayer}
        <g transform={mascotT}>
          {flameLayer}
          {flood > 0 || body > 0 || st.floodSeed ? fillLayer : null}
        </g>
        {sparkleLayer}
      </g>
    );
  }

  const outlineVisible = outline.a > 0 || outline.b > 0 || flood > 0;
  return (
    <g>
      {defs}
      {letterLayer}
      <g transform={mascotT}>
        {outlineVisible ? (
          <g fill={INK} mask={outlineOn ? ns.url("outline") : undefined}>
            {LOGO.outlineUnderlap.map((p, i) => (
              <path key={i} d={p.d} fillRule={p.evenodd ? "evenodd" : undefined} clipRule={p.evenodd ? "evenodd" : undefined} />
            ))}
          </g>
        ) : null}
        {flood > 0 || body > 0 || st.floodSeed ? fillLayer : null}
        {flameLayer}
      </g>
      {sparkleLayer}
    </g>
  );
};
