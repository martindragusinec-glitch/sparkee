import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, type CalculateMetadataFunction } from "remotion";
import { Audio } from "@remotion/media";
import { C } from "../../lib/theme";
import { BLOOM, CLICK, SNAP, SWING, WHIP, lerp, popSettle, ramp } from "./kit/easing";
import { Field, FlashRays, LightStreak, SparkHead } from "./kit/effects";
import { BOX_CENTRE, GEO, K, type Pt } from "./kit/geometry";
import { LogoRig } from "./kit/LogoRig";
import { LOGO } from "./kit/logo-data.gen";
import { LogoStage, type Cam } from "./kit/stage";
import { HERO_AT, ZazehScene, zazehFrame } from "./Zazeh";
import {
  B_END,
  L1_CAM,
  L3,
  SPARK_AT,
  baseCam,
  buildB,
  camAt,
  chapterOf,
  landingCam,
  logoBuild,
  type BuildState,
  type Pen,
} from "./reel/build";
import { BuildLayer, OX, OY } from "./reel/BuildLayer";
import { DIVE_F, FlightLayer, PulseRings, flightState, portalWindow, sparklePath } from "./reel/PenFlight";
import { Scrub, TICKS, barCY, barX, type ScrubState } from "./reel/Scrub";
import { CH_AT, Claim, Hook, SparkLine, StoryLane } from "./reel/Type";
import { SP_C } from "./reel/geo";
import reelSfx from "./audio/sparkee-reel-sfx.wav";

/**
 * "PŘETOČ" — Sparkee Reel "Jak vzniklo moje logo" (1080×1920, 30 fps, 600 f = 20.0 s = 10 bars at 120 BPM).
 *
 * One idea: the playhead IS the real build progress, and the rewind is the build played backward.
 *   f0–44    hook: the ✦ lifts out of its seat, hooks the playhead and drags the logo back to nothing
 *            (fast, 4 f hold on the coloured mascot, fast, hold on the construction, fast, hold on the sketch)
 *   f45–89   LIGHTS OFF on the beat: "Září 2026. Na počátku byla jiskra." A glowing spark breathes on the beats.
 *   f89–359  lights on from the spark; six 45 f chapters (01 f90 … 06 f315), one camera accent each
 *   f360–413 pre-drop: "A teď naostro." The ✦ charges, winds up and dives into the lens as a portal
 *   f414–509 the logo open "Zážeh" (hero cut: macro strike on bar 8 at f420, ✦ flash on bar 9 at f480)
 *   f510     the ✦ switches the light on (✦ iris) · f512 claim · f566 seam · f596–f599 = the ✦ lifts again (→ f0)
 * Every cue is authored in storyboard frames at 120 BPM (1 beat = 15 f); `bpm` remaps the whole sheet.
 */
export type ReelProps = { bpm: number; rollFrames: number };

export const REEL_LEN = 600;
export const reelDuration = (bpm: number) => Math.round((REEL_LEN * 120) / bpm);
export const reelMeta: CalculateMetadataFunction<ReelProps> = ({ props }) => ({ durationInFrames: reelDuration(props.bpm) });

const FIELD_C = { cx: OX + BOX_CENTRE[0] * K, cy: OY + BOX_CENTRE[1] * K };
const OPEN_AT = 414;
const LIGHTS_AT = 510;
/** the ✦ seat on screen at L1 */
const SEAT: Pt = [OX + K * GEO.sparkleCentre[0], OY + K * GEO.sparkleCentre[1]];

// ------------------------------------------------------------------ the rewind (f3–f44)
/** keyframes (frame, b): WHIP start, then on twos with three 4 f stutter holds on recognisable states */
const RW: [number, number][] = [
  [6, 290],
  [14, 195], // hold: the coloured mascot, floating, eyes open
  [18, 195],
  [26, 100], // hold: the construction
  [30, 100],
  [36, 45], // hold: the sketch
  [40, 45],
  [44, 0],
];
export const rewindB = (t: number) => {
  if (t < 3) return B_END;
  if (t < 6) return lerp(B_END, 290, WHIP(ramp(t, 3, 6)));
  if (t >= 44) return 0;
  const ts = 2 * Math.floor(t / 2); // on twos
  for (let i = 0; i < RW.length - 1; i++) {
    const [f0, b0] = RW[i];
    const [f1, b1] = RW[i + 1];
    if (ts < f1) return lerp(b0, b1, ramp(ts, f0, f1));
  }
  return 0;
};
/** the rewind camera runs on its own continuous clock: L1 → L3 about the pivot, SWING in log space */
const rewindCam = (t: number): Cam => baseCam(Math.exp(lerp(Math.log(K), Math.log(L3.a), SWING(ramp(t, 6, 32)))));

// ------------------------------------------------------------------ the ✦ grip (spans the loop seam)
/** T = frames from f0, negative across the seam (f596–f599 = T −4…−1) */
const seamT = (t: number) => (t >= 300 ? t - REEL_LEN : t);
const playheadAt = (p: number): Pt => [barX(p), barCY];
/** where the ✦ is from its lift out of the seat (T −4) to the playhead (T 4), and its scale */
const gripFlight = (T: number, target: Pt) => {
  const lift = SNAP(ramp(T, -4, 0));
  const from: Pt = [SEAT[0], SEAT[1] - 12 * lift];
  if (T < 0) return { c: from, s: 1 + 0.1 * lift, flying: false };
  const u = SNAP(ramp(T, 0, 4));
  const ctrl: Pt = [lerp(from[0], target[0], 0.2) - 40, lerp(from[1], target[1], 0.55)];
  const a = (1 - u) * (1 - u);
  const b = 2 * u * (1 - u);
  const c = u * u;
  const pos: Pt = [a * from[0] + b * ctrl[0] + c * target[0], a * from[1] + b * ctrl[1] + c * target[1]];
  const pop = T < 4 ? 1.1 - 0.1 * u : popSettle(T, 4, 1.25, 2, CLICK, 1);
  return { c: pos, s: pop, flying: T < 4 };
};

/** the ✦ drawn in screen space (holo, 60 px at s = 1), with a soft contact shadow on paper */
const ScreenStar: React.FC<{ c: Pt; s: number; rot?: number; shadow?: number; id: string }> = ({ c, s, rot = 0, shadow = 0, id }) => {
  const T = `translate(${c[0]} ${c[1]}) rotate(${rot}) scale(${K * s}) translate(${-SP_C[0]} ${-SP_C[1]})`;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <defs dangerouslySetInnerHTML={{ __html: LOGO.defsLight.split("__P__").join(`${id}-`) }} />
      {shadow > 0 ? (
        <g opacity={0.14 * shadow}>
          <filter id={`${id}-sh`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation={3} />
          </filter>
          <path d={LOGO.sparkle.d} fill={C.ink} filter={`url(#${id}-sh)`} transform={`translate(2 5) ${T}`} />
        </g>
      ) : null}
      <g transform={T} dangerouslySetInnerHTML={{ __html: LOGO.sparkle.fills.split("__P__").join(`${id}-`) }} />
    </svg>
  );
};

// ------------------------------------------------------------------ scrub states
/** frames at which p(t) crosses each tick (scan of the clock), for the 3 f tick flashes */
const tickFlashes = (t: number, pOf: (f: number) => number, from: number): number[] =>
  TICKS.map((q) => {
    for (let f = Math.max(from + 1, Math.floor(t) - 3); f <= Math.floor(t); f++) {
      const a = pOf(f - 1);
      const b = pOf(f);
      if ((a > q && b <= q) || (a < q && b >= q)) {
        const d = t - f;
        return d < 3 ? 1 - 0.3 * d : 0;
      }
    }
    return 0;
  });

const rewindScrub = (t: number): ScrubState => {
  const pOf = (f: number) => rewindB(f) / B_END;
  const flash = tickFlashes(t, pOf, 3);
  const grab = SNAP(ramp(t, 3, 6));
  return {
    p: pOf(t),
    op: 1,
    h: 6 + 6 * grab,
    grip: t >= 4,
    tickFlash: flash,
    rew: { op: ramp(t, 3, 5), pulse: Math.max(...flash, t < 8 ? 1 - ramp(t, 5, 8) : 0) },
  };
};

const forwardScrub = (t: number): ScrubState => {
  const b = buildB(t);
  const pOf = (f: number) => buildB(f) / B_END;
  const c = chapterOf(Math.min(b, 299.9));
  const at = CH_AT[c - 1] ?? 315;
  const cIn = c === 1 ? SNAP(ramp(t, 90, 95)) : SNAP(ramp(t, at, at + 4));
  const label: ScrubState["label"] = [{ text: `0${c}`, op: cIn, dy: 16 * (1 - cIn) }];
  if (c > 1 && t < at + 4) {
    const u = SNAP(ramp(t, at, at + 4));
    label.push({ text: `0${c - 1}`, op: 1 - u, dy: -16 * u });
  }
  return { p: b / B_END, op: 1, tickFlash: tickFlashes(t, pOf, 89), label };
};

/** loop seam: the bar returns full (f576–f590), each tick appears as the fill passes it */
const seamScrub = (t: number): ScrubState => {
  const u = SWING(ramp(t, 576, 590));
  return {
    p: u,
    op: ramp(t, 574, 578),
    fill: 1,
    tickOp: TICKS.map((q) => (u >= q ? 1 : 0)),
    tickFlash: tickFlashes(t, (f) => SWING(ramp(f, 576, 590)), 575),
  };
};

// ------------------------------------------------------------------ the first spark (dark, f45–f89)
const sparkState = (t: number) => {
  const from = playheadAt(0);
  const u = SWING(ramp(t, 45, 55));
  const c: Pt = [lerp(from[0], SPARK_AT[0], u), lerp(from[1], SPARK_AT[1], u) - 120 * Math.sin(Math.PI * u) * 0.35];
  const breath = [60, 75].reduce((e, at) => e + 0.7 * (popSettle(t, at, 1.6, 2, BLOOM, 1) - 1) / 0.6, 0);
  const gather = 0.7 * SWING(ramp(t, 83, 89));
  // once it has arrived it hovers: a slow bob and sway (it is alive, not a dot), settling back by f89
  const hover = ramp(t, 53, 58) * (1 - SWING(ramp(t, 84, 89)));
  const bob: Pt = [5 * Math.sin((2 * Math.PI * (t - 53)) / 44) * hover, -9 * Math.sin((2 * Math.PI * (t - 53)) / 30) * hover];
  return { c: [c[0] + bob[0], c[1] + bob[1]] as Pt, energy: 1.7 + breath + gather, rot: (t - 45) * 3, u };
};

const Spark: React.FC<{ t: number }> = ({ t }) => {
  const s = sparkState(t);
  const trail: Pt[] | null =
    t < 57
      ? Array.from({ length: 10 }, (_, i) => {
          const q = sparkState(t - 3 + (3 * i) / 9);
          return q.c;
        })
      : null;
  const cam: Cam = { k: 8.5, pivot: [0, 0], at: s.c };
  const bloom = 0.3 + 0.12 * (s.energy - 1.7);
  return (
    <>
      {/* the light the spark throws into the dark room (a wide, soft bloom) */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, mixBlendMode: "screen" }}>
        <radialGradient id="spark-bloom" gradientUnits="userSpaceOnUse" cx={s.c[0]} cy={s.c[1]} r={300}>
          <stop offset={0} stopColor={C.sky} stopOpacity={0.5} />
          <stop offset={0.3} stopColor={C.lilac} stopOpacity={0.18} />
          <stop offset={1} stopColor={C.lilac} stopOpacity={0} />
        </radialGradient>
        <circle cx={s.c[0]} cy={s.c[1]} r={300} fill="url(#spark-bloom)" opacity={Math.max(0, Math.min(1, bloom))} />
      </svg>
      <PulseRings t={t} at={[60, 75]} c={s.c} s={1} id="breath" dark />
      {trail ? (
        <LogoStage width={1080} height={1920} ox={0} oy={0} cam={{ k: 1, pivot: [0, 0], at: [0, 0] }}>
          <LightStreak pts={trail} theme="dark" width={10} />
        </LogoStage>
      ) : null}
      <LogoStage width={1080} height={1920} ox={0} oy={0} cam={cam}>
        <SparkHead x={0} y={0} theme="dark" energy={s.energy} glint={0.165} rot={s.rot} />
      </LogoStage>
    </>
  );
};

// ------------------------------------------------------------------ the composition
export const BrandStoryReel: React.FC<ReelProps> = ({ bpm }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = (frame * bpm) / 120;
  const audio = <Audio src={reelSfx} playbackRate={bpm / 120} />;
  const T = seamT(t);

  // ================= f45–f88: lights off, the first spark
  if (t >= 45 && t < 89) {
    return (
      <AbsoluteFill>
        {audio}
        <Field theme="dark" cx={FIELD_C.cx} cy={FIELD_C.cy} />
        <Spark t={t} />
        <SparkLine t={t} />
      </AbsoluteFill>
    );
  }

  // ================= f414–f509: the logo open, hero cut (dark)
  if (t >= OPEN_AT && t < LIGHTS_AT) {
    const o = t - OPEN_AT;
    // o90–o95: the ✦ gathers (1 → 1.12, its glow +40 %) before it switches the light on
    if (o >= 90) {
      const z = zazehFrame(o, "full", "dark");
      const g = SWING(ramp(o, 90, 95));
      return (
        <AbsoluteFill>
          {audio}
          <Field theme="dark" cx={FIELD_C.cx} cy={FIELD_C.cy} />
          <LogoStage width={width} height={height} ox={OX} oy={OY}>
            <LogoRig theme="dark" st={{ ...z.rig, sparkle: { scale: 1 + 0.12 * g }, sparkleGlowGain: 1 + 0.4 * g }} />
          </LogoStage>
        </AbsoluteFill>
      );
    }
    return (
      <AbsoluteFill>
        {audio}
        <ZazehScene o={o} theme="dark" width={width} height={height} ox={OX} oy={OY} hero />
      </AbsoluteFill>
    );
  }

  // ================= the paper world (hook + rewind, build, pre-drop, end card)
  let st: BuildState;
  let pen: Pen | null = null;
  let penTrail: Pt[] | null = null;
  let scrub: ScrubState | null = null;
  let grip: { c: Pt; s: number; shadow: number } | null = null;
  let drift = 1;
  const endCard = t >= LIGHTS_AT;

  if (t < 45) {
    // hook + rewind: the seat is empty (the ✦ is the grip), the pen is not drawn
    const b = rewindB(t);
    const cam = t < 6 ? L1_CAM : rewindCam(t);
    const raw = logoBuild(b, cam);
    st = { ...raw, rig: { ...raw.rig, sparkle: 0 } };
    scrub = rewindScrub(t);
    const g = gripFlight(T, playheadAt(scrub.p));
    grip = { c: T >= 4 ? playheadAt(scrub.p) : g.c, s: g.s, shadow: 1 };
  } else if (t < 360) {
    // the build, forward
    const b = buildB(t);
    const cam = landingCam(camAt(b), t);
    st = logoBuild(b, cam);
    pen = b < 300 ? st.pen : null;
    // a speed streak behind fast pen moves (screen distance > 40 px in the last frame)
    const prev = logoBuild(buildB(t - 1));
    const d = Math.hypot(prev.pen.x - st.pen.x, prev.pen.y - st.pen.y) * st.k;
    if (pen && d > 40 && t > 90) {
      penTrail = Array.from({ length: 6 }, (_, i) => {
        const q = logoBuild(lerp(buildB(t - 1), b, i / 5));
        return [q.pen.x, q.pen.y] as Pt;
      });
    }
    scrub = forwardScrub(t);
  } else if (t < OPEN_AT) {
    // pre-drop: the logo waits at L1 (no ✦ in the seat), the flight is drawn on top
    st = logoBuild(300, L1_CAM);
    scrub = { ...forwardScrub(t), p: 300 / B_END };
  } else {
    // end card: the official logo from its parts, a slow 1.00 → 1.03 drift, one ^^ blink on the bar-10 downbeat
    // the drift peaks while the claim rolls out and the question rolls in (no dead turnaround)
    drift = 1 + 0.03 * SWING(ramp(t, LIGHTS_AT + 2, 578)) * (1 - SWING(ramp(t, 578, 594)));
    const rest = logoBuild(B_END, L1_CAM);
    const lifting = T >= -4 && T < 0;
    const tw = t >= 540 && t < 566 ? popSettle(t, 540, 1.1, 3, BLOOM, 1) : 1;
    st = {
      ...rest,
      rig: { ...rest.rig, happy: t >= 540 && t < 544 ? 1 : 0, sparkle: lifting ? 0 : tw === 1 ? 1 : { scale: tw } },
    };
    if (t >= 574) scrub = seamScrub(t);
    if (lifting) {
      const g = gripFlight(T, playheadAt(1));
      grip = { c: g.c, s: g.s, shadow: 0.6 };
    }
  }

  const paper = (
    <AbsoluteFill>
      <Field theme="light" cx={FIELD_C.cx} cy={FIELD_C.cy} />
      <AbsoluteFill style={drift !== 1 ? { scale: `${drift}`, transformOrigin: "540px 990px" } : undefined}>
        <BuildLayer st={st} width={width} height={height} pen={pen} penTrail={penTrail} />
        {endCard ? <Claim t={t} /> : null}
      </AbsoluteFill>
      {endCard && t < LIGHTS_AT + 10 ? (
        // the ✦ switches the light on: four rays from its tips (3.5 px × 70 u)
        <LogoStage width={width} height={height} ox={OX} oy={OY}>
          <FlashRays t={t - LIGHTS_AT} len={70} px={3.5} />
        </LogoStage>
      ) : null}
      {scrub ? <Scrub s={scrub} /> : null}
      {t < 45 ? <Hook t={t} enter={null} /> : null}
      <StoryLane t={t} />
      {t >= 572 ? <Hook t={t} enter={574} /> : null}
      {grip ? <ScreenStar c={grip.c} s={grip.s} shadow={grip.shadow} id="grip" /> : null}
    </AbsoluteFill>
  );

  // ================= f89–f93: lights on, an iris out of the spark
  if (t >= 89 && t < 94) {
    const R = 1180 * SNAP(ramp(t, 89, 94));
    return (
      <AbsoluteFill>
        {audio}
        <Field theme="dark" cx={FIELD_C.cx} cy={FIELD_C.cy} />
        <Spark t={t} />
        <SparkLine t={t} />
        <AbsoluteFill style={{ clipPath: `circle(${R}px at ${SPARK_AT[0]}px ${SPARK_AT[1]}px)` }}>{paper}</AbsoluteFill>
        <svg width={width} height={height} style={{ position: "absolute", left: 0, top: 0 }}>
          <circle cx={SPARK_AT[0]} cy={SPARK_AT[1]} r={R} fill="none" stroke={C.sky} strokeWidth={8} opacity={0.7 * (1 - ramp(t, 89, 94))} />
        </svg>
      </AbsoluteFill>
    );
  }

  // ================= f393–f413: the portal (the open's first frame inside the ✦ window)
  if (t >= DIVE_F[0] && t < OPEN_AT) {
    // until f411 the paper world has a ✦-shaped hole; from f411 the window covers the whole frame
    const f = t < DIVE_F[1] ? portalWindow(t) : null;
    return (
      <AbsoluteFill>
        {audio}
        <PortalWorld t={t} width={width} height={height} />
        {f ? (
          <AbsoluteFill style={{ clipPath: `path(evenodd, "M0 0H${width}V${height}H0Z ${f}")` }}>{paper}</AbsoluteFill>
        ) : t < DIVE_F[1] ? (
          paper
        ) : null}
        {t < DIVE_F[1] + 1 ? <FlightLayer t={t} /> : null}
      </AbsoluteFill>
    );
  }

  // ================= f510–f515: the ✦ iris (light world inside a ✦ that bursts from the seat)
  if (t >= LIGHTS_AT && t < LIGHTS_AT + 6) {
    const s = Math.exp(lerp(Math.log(1.12), Math.log(100), SNAP(ramp(t, LIGHTS_AT, LIGHTS_AT + 6))));
    const d = sparklePath(SEAT[0], SEAT[1], 0, s);
    const o = t - OPEN_AT;
    const z = zazehFrame(o, "full", "dark");
    return (
      <AbsoluteFill>
        {audio}
        <Field theme="dark" cx={FIELD_C.cx} cy={FIELD_C.cy} />
        <LogoStage width={width} height={height} ox={OX} oy={OY}>
          <LogoRig theme="dark" st={{ ...z.rig, sparkle: { scale: 1.12 }, sparkleGlowGain: 1.4 }} />
        </LogoStage>
        <AbsoluteFill style={{ clipPath: `path("${d}")` }}>{paper}</AbsoluteFill>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill>
      {audio}
      {paper}
      {t >= 360 && t < DIVE_F[0] ? <FlightLayer t={t} /> : null}
    </AbsoluteFill>
  );
};

/** inside the portal: the open's first frame (o0, hero framing), its pinprick riding the ✦ centre */
const PortalWorld: React.FC<{ t: number; width: number; height: number }> = ({ t, width, height }) => {
  const fs = flightCentre(t);
  const dx = fs[0] - HERO_AT[0];
  const dy = fs[1] - HERO_AT[1];
  return (
    <AbsoluteFill style={dx || dy ? { translate: `${dx}px ${dy}px` } : undefined}>
      <ZazehScene o={0} theme="dark" width={width} height={height} ox={OX} oy={OY} hero />
    </AbsoluteFill>
  );
};

const flightCentre = (t: number): Pt => {
  if (t >= DIVE_F[1]) return HERO_AT;
  const f = flightState(t);
  return [f.x, f.y];
};
