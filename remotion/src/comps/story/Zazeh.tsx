import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, type CalculateMetadataFunction } from "remotion";
import { Audio } from "@remotion/media";
import { BLOOM, CLICK, DRAW, DROP, SNAP, SWING, clamp, lerp, popSettle, ramp, springAt } from "./kit/easing";
import {
  BaselineLight,
  BandHairline,
  Comet,
  Drip,
  Field,
  FieldGlow,
  FlashBloom,
  FlashRays,
  FlashRing,
  FlashStreak,
  LightStreak,
  MicroBurst,
  SparkHead,
  StrikeLight,
  routePoint,
} from "./kit/effects";
import { BOX_CENTRE, FORMATS, GEO, K, LETTERS, M, type Pt, type Ratio } from "./kit/geometry";
import { LogoRig, type LogoState, type Theme } from "./kit/LogoRig";
import { LogoStage, camLerp, camToScreen, camZoom, stageCam, type Cam } from "./kit/stage";
import { OfficialLogo } from "./kit/official";
import sonicLogo from "./audio/sparkee-sonic-logo.wav";

/**
 * LOGO OPEN "ZÁŽEH" (Ignition) — 3.5 s, 105 f at 30 fps, locked to 120 BPM.
 *
 * One spark, one line, two notes (1 → 2 → 1 → 2 → 1): the spark lights the flame, splits and runs both
 * sides of Sparkee's real outline, the halves meet at the lowest paw and drip to the baseline, the drop
 * splits again and names the letters, the right half leaps into the ✦. The mascot never moves: it is
 * built in its seat. Strike (o6) and ✦ flash (o66) are exactly one bar apart; the leap lands on o63 and
 * the ✦ pops 0.2 → 1.35 over o63–o66, so its peak and the light hit the same frame.
 * Standalone renders hold the official file from o93 to o149 (a 1.5 s tail for editors).
 *
 * Everything is a pure function of the open clock `o` (open frames at 120 BPM), so the Reel can mount
 * <ZazehScene o={f − 414} hero/> inline: the same open seen through a camera (macro on the flame base →
 * L1 on the leap), identical to the standalone from the flash on.
 */
export type Variant = "full" | "mini" | "micro";
export type ZazehProps = { theme: Theme; ratio: Ratio; variant: Variant; bpm: number; grain: boolean };

/** Cue sheet in open frames (120 BPM: 1 beat = 15 f). */
export const CUE = {
  strike: 6, // hit 1
  split: 8,
  flood0: 22,
  meet: 34,
  eyes: 36, // beat 3, note 1
  name: 40,
  speed: 20.5, // u per frame along the baseline
  leap: 58,
  land: 63, // the leap lands, the ✦ starts its pop
  flash: 66, // hit 2, next downbeat: the ✦ peak (1.35) and the light on the same frame
  blink: 81, // beat 2
  settle: 82,
  hold: 93, // the official file itself
  end: 150, // standalone: 1.5 s static tail after the settle
} as const;

const WINDOW: Record<Variant, { start: number; len: number }> = {
  full: { start: 0, len: CUE.end },
  mini: { start: CUE.leap, len: 60 }, // leap f0-f5, ✦ peak f8, blink f23, hold to f59
  micro: { start: CUE.land - 2, len: 40 }, // ✦ pop f2-f5, hold to f39
};
export const zazehDuration = (variant: Variant, bpm = 120) => Math.round((WINDOW[variant].len * 120) / bpm);
/** Open clock for a composition frame (bpm remaps the whole cue sheet, every cue is a beat index). */
export const openClock = (frame: number, variant: Variant = "full", bpm = 120) => WINDOW[variant].start + (frame * bpm) / 120;

// ------------------------------------------------------------------ geometry of the story
const PAW_IN: Pt = routePoint("A", 1);
const PAW_X = GEO.paw[0];
const BASE_Y = M.baseline;
const END_E: Pt = [LETTERS[6].bbox[2], BASE_Y];
// leap arc control: the ✦'s right edge, halfway between baseline and ✦ centre (the arc peaks at x≈554 u,
// inside the logo box, so it never crosses the 9:16 safe line at x960)
const LEAP_CTRL: Pt = [GEO.sparkleBox[2] - 1.5, (M.baseline + GEO.sparkleCentre[1]) / 2];
const ZOOM_HELD = 1.421 / 1.4; // the logo holds its breath 1.5 % large until the flash, then exhales
/** Each letter ignites when the baseline light crosses its centre (r o40, a+k o44, p+e o47/48, s+e o51). */
export const IGNITE = LETTERS.map((l) => CUE.name + Math.abs(l.cx - PAW_X) / CUE.speed);
const X_LEFT_END = 0;
const T_LEFT_END = CUE.name + (PAW_X - X_LEFT_END) / CUE.speed;
const T_RIGHT_END = CUE.name + (END_E[0] - PAW_X) / CUE.speed;

const fuse = (o: number) => DRAW(Math.max(0, Math.min(1, (o - CUE.split) / (CUE.meet - CUE.split))));
const leapPoint = (u: number): Pt => {
  const a = (1 - u) * (1 - u);
  const b = 2 * u * (1 - u);
  const c = u * u;
  const [sx, sy] = GEO.sparkleCentre;
  return [a * END_E[0] + b * LEAP_CTRL[0] + c * sx, a * END_E[1] + b * LEAP_CTRL[1] + c * sy];
};
const leapU = (o: number) => SWING(Math.max(0, Math.min(1, (o - CUE.leap) / (CUE.land - CUE.leap))));

type Head = { x: number; y: number; energy: number; glint: number; rot: number; opacity?: number };
export type ZazehFrame = {
  rig: LogoState;
  zoom: number;
  lift: number;
  heads: Head[];
  comets: { route: "A" | "B"; from: number; to: number }[];
  hairline: { a: number; b: number; opacity: number };
  burst: number; // frames since strike
  drip: { u: number; trail: number } | null;
  baseline: { xL: number; xR: number; opacity: number } | null;
  leapTrail: Pt[] | null;
  flashT: number; // frames since the ✦ flash
  official: boolean;
};

/** The whole open as data. `pre` = mini/micro: everything before the leap is already built. */
export const zazehFrame = (o: number, variant: Variant = "full", theme: Theme = "dark"): ZazehFrame => {
  const pre = variant !== "full";
  const dark = theme === "dark";
  const micro = variant === "micro";

  // ---- letters rise out of the baseline slot as the light crosses their centres
  const letters = LETTERS.map((_, i) => ({ rise: pre ? 1 : ramp(o, IGNITE[i], IGNITE[i] + 8, SNAP) }));

  // ---- the fuse: both routes, same clock, different lengths (one runs faster)
  const pF = pre ? 1 : fuse(o);
  const pGlow = pre ? 1 : fuse(o - 3); // the glow blooms behind the sparks

  // ---- flame: bottom-up ignition + rigid flicker about its base, decaying to exactly 0 by o40;
  //      it feels the ✦ flash and eases back to exactly 0 by o92
  const flicker =
    pre || o < CUE.strike || o >= 40 ? 0 : 4 * Math.pow(1 - ramp(o, CUE.strike, 40), 2) * Math.cos((2 * Math.PI * (o - CUE.strike)) / 9);
  const react =
    o < CUE.flash || o >= 92 ? 0 : -2.2 * Math.sin((2 * Math.PI * (o - CUE.flash)) / 16) * Math.pow(1 - ramp(o, CUE.flash, 92), 2);

  const rig: LogoState = {
    letters,
    outline: { a: pF, b: pF },
    flood: pre ? 1 : ramp(o, CUE.flood0, CUE.meet, SNAP),
    feather: dark ? 18 : 40,
    sheen: dark ? 0.6 : 0.4,
    body: pre ? 1 : ramp(o, CUE.flood0 + 3, CUE.meet + 3, SNAP),
    cheeks: pre ? 1 : ramp(o, 30, 34, SNAP),
    // springs never reach their target exactly: call them settled once they are sub-pixel
    mouth: pre || o >= 32 + 30 ? 1 : springAt(o, 32, BLOOM),
    // the round eyes never squeeze (client: squashed eyes read as a broken face); "closed" is the
    // official ^^ from poses/happy.svg, like the web mascot: ^^ until the eyes open on beat 3, and the blink is a 4 f ^^
    eyes: 1,
    blink: 0,
    happy: (!pre && o < CUE.eyes) || (!micro && o >= CUE.blink && o < CUE.blink + 4) ? 1 : 0,
    flame: pre ? 1 : ramp(o, CUE.strike, CUE.strike + 5, SNAP),
    flameRot: flicker + react,
    flameCore: pre ? 0 : interpolate(o, [CUE.strike, CUE.strike + 1, CUE.strike + 3], [1, 0.85, 0], clamp),
    // the leap lands on o63 and the ✦ pops 0.2 → 1.35 over o63–o66: its peak IS the flash frame
    sparkle:
      o < CUE.land
        ? 0
        : {
            scale: o >= CUE.flash + 24 ? 1 : popSettle(o, CUE.land, 1.35, CUE.flash - CUE.land, BLOOM, 0.2),
            rot: -90 * (1 - ramp(o, CUE.land, CUE.land + 9, SNAP)),
          },
    glow: { a: pGlow, b: pGlow },
    glowGain: o >= 90 ? 1 : 1 + 0.4 * Math.sin(Math.PI * ramp(o, CUE.flash, 90, SWING)),
    sparkleGlow: ramp(o, CUE.land, CUE.flash, SNAP),
  };

  // ---- spark heads
  const heads: Head[] = [];
  const comets: ZazehFrame["comets"] = [];
  const [fbx, fby] = GEO.flameBase;
  if (!pre) {
    if (o < CUE.strike) {
      // pinprick breathes 40 % → 100 %
      const e = 0.4 + 0.6 * ramp(o, 0, CUE.strike - 1, SWING);
      heads.push({ x: fbx, y: fby, energy: 0.35 * e, glint: 0, rot: 0, opacity: e });
    } else if (o < CUE.split) {
      // strike: a tiny ✦ glint (sparkle geometry at uniform 0.3) for 2 f, then the spark drops onto the outline
      const u = DROP(ramp(o, CUE.strike, CUE.split));
      const [sx, sy] = GEO.split;
      heads.push({ x: lerp(fbx, sx, u), y: lerp(fby, sy, u), energy: 1.8, glint: o < CUE.strike + 2 ? 0.3 : 0.16, rot: 0 });
    } else if (o < CUE.meet) {
      const [ax, ay] = routePoint("A", pF);
      const [bx, by] = routePoint("B", pF);
      const rot = (o - CUE.split) * 7;
      heads.push({ x: ax, y: ay, energy: 1, glint: 0.14, rot });
      heads.push({ x: bx, y: by, energy: 1, glint: 0.14, rot: -rot });
      const pTail = fuse(o - 10);
      comets.push({ route: "A", from: pTail, to: pF }, { route: "B", from: pTail, to: pF });
    } else if (o < CUE.eyes) {
      // meet: the halves merge with a 1 f flare, then hang at the paw
      const e = o < CUE.meet + 1 ? 2.6 : 1.3;
      heads.push({ x: PAW_IN[0], y: PAW_IN[1], energy: e, glint: o < CUE.meet + 1 ? 0.3 : 0.12, rot: 0 });
    }
  }

  let drip: ZazehFrame["drip"] = null;
  if (!pre && o >= CUE.eyes && o < CUE.name) {
    drip = { u: DROP(ramp(o, CUE.eyes, CUE.name)), trail: DROP(ramp(o - 1.5, CUE.eyes, CUE.name)) };
  }

  let baseline: ZazehFrame["baseline"] = null;
  if (!pre && o >= CUE.name) {
    const t = o - CUE.name;
    const xL = Math.max(X_LEFT_END, PAW_X - CUE.speed * t);
    const xR = Math.min(END_E[0], PAW_X + CUE.speed * t);
    const op = 1 - ramp(o, 52, 60, SWING);
    if (op > 0) baseline = { xL, xR, opacity: op };
    // left spark runs to x0 and dies with a 2 f glint
    if (o < T_LEFT_END) heads.push({ x: xL, y: BASE_Y, energy: 1, glint: 0.12, rot: -t * 9 });
    else if (o < T_LEFT_END + 2) heads.push({ x: X_LEFT_END, y: BASE_Y, energy: 1.6, glint: 0.24, rot: 0, opacity: 1 - (o - T_LEFT_END) / 2 });
    // right spark runs to the end of the last e and gathers
    if (o < T_RIGHT_END) heads.push({ x: xR, y: BASE_Y, energy: 1, glint: 0.12, rot: t * 9 });
  }
  // the right spark rests at the end of the last e, gathers, then leaps into the ✦ seat
  if (!micro && o >= (pre ? CUE.leap : T_RIGHT_END) && o < CUE.land) {
    const g = ramp(o, T_RIGHT_END, CUE.leap, SWING);
    const u = leapU(o);
    const [x, y] = leapPoint(u);
    heads.push({
      x,
      y,
      energy: pre ? 1.8 - 0.6 * u : 1 + 0.8 * g - 0.6 * u,
      glint: 0.12 + 0.08 * (pre ? 1 : g),
      rot: -90 * u + (1 - u) * (o - T_RIGHT_END) * 12,
    });
  }
  let leapTrail: Pt[] | null = null;
  if (!micro && o > CUE.leap && o < CUE.land + 2) {
    const u1 = leapU(Math.min(o, CUE.land));
    const u0 = leapU(o - 4);
    leapTrail = Array.from({ length: 16 }, (_, i) => leapPoint(lerp(u0, u1, i / 15)));
  }

  return {
    rig,
    zoom: lerp(ZOOM_HELD, 1, ramp(o, CUE.flash, CUE.settle, SNAP)),
    lift: dark && o >= CUE.flash && o < CUE.flash + 2 ? 1.1 : 1,
    heads,
    comets,
    hairline: { a: pF, b: pF, opacity: pre ? 0 : 1 - ramp(o, 30, 40, SWING) },
    burst: pre ? -1 : o - CUE.strike,
    drip,
    baseline,
    leapTrail,
    flashT: o - CUE.flash,
    official: o >= (micro ? CUE.settle + 1 : CUE.hold),
  };
};

// ------------------------------------------------------------------ the Reel's hero cut: a camera on the open
/** where the flame base (the pinprick) sits on the 9:16 screen at o0: the ✦ portal of the Reel lands here */
export const HERO_AT: Pt = [540, 900];
const HERO_K = 6 * K;
const HERO_PULL = Easing.bezier(0.3, 0, 0.25, 1);
const lockedCam = (o: number, ox: number, oy: number) => {
  const zoom = o < CUE.flash ? ZOOM_HELD : lerp(ZOOM_HELD, 1, ramp(o, CUE.flash, CUE.settle, SNAP));
  return stageCam(ox, oy, zoom, BOX_CENTRE);
};
/**
 * o0–o8 macro on the flame base (6 × L1: the flame ≈ 420 px, the strike fills the frame); from the split the
 * camera pulls back in log space, riding spark A (20 % follow), through the flood, reaching L1 on the leap
 * (o58); at the ✦ flash it settles on a CLICK. From o66 on it is the standalone framing (+ the kick).
 */
export const heroCam = (o: number, ox: number, oy: number): Cam => {
  const locked = lockedCam(Math.max(o, CUE.leap), ox, oy);
  if (o >= CUE.leap) {
    if (o < CUE.flash) return locked;
    const kk = o <= CUE.flash ? 0 : o < CUE.flash + 2 ? SNAP((o - CUE.flash) / 2) : 1 - springAt(o, CUE.flash + 2, CLICK);
    const z = 1 + 0.028 * kk * (1 - ramp(o, CUE.flash + 14, CUE.flash + 18));
    return z === 1 ? locked : camZoom(locked, z, GEO.sparkleCentre);
  }
  const f = routePoint("A", fuse(o));
  const w = 0.2 * ramp(o, CUE.split, CUE.split + 6) * (1 - ramp(o, 30, 44));
  const [fx, fy] = GEO.flameBase;
  const macro: Cam = { k: HERO_K, pivot: [fx + w * (f[0] - fx), fy + w * (f[1] - fy)], at: HERO_AT };
  return camLerp(macro, locked, HERO_PULL(ramp(o, CUE.split, CUE.leap)), HERO_AT);
};

// ------------------------------------------------------------------ scene
/**
 * The open drawn at open-clock `o` in a W×H frame with the logo origin at (ox, oy) px (at 1.4 px/u).
 * `hero` = the Reel's cut: the camera above, the strike as a light event (exposure lift, a ring across the
 * frame, sparks at 3 × reach) and the flash at frame scale. The standalone stings stay locked at L1.
 */
export const ZazehScene: React.FC<{
  o: number;
  theme: Theme;
  width: number;
  height: number;
  ox: number;
  oy: number;
  variant?: Variant;
  grain?: boolean;
  background?: boolean;
  hero?: boolean;
}> = ({ o, theme, width, height, ox, oy, variant = "full", grain = true, background = true, hero = false }) => {
  const z = zazehFrame(o, variant, theme);
  const sp = typeof z.rig.sparkle === "object" ? z.rig.sparkle : { scale: 0, rot: 0 };
  const comets = z.comets.map((c, i) => <Comet key={i} route={c.route} from={c.from} to={c.to} theme={theme} />);
  const dark = theme === "dark";
  const cx = ox + BOX_CENTRE[0] * K;
  const cy = oy + BOX_CENTRE[1] * K;
  const cam = hero ? heroCam(o, ox, oy) : stageCam(ox, oy, z.zoom, BOX_CENTRE);
  const star = camToScreen(cam, GEO.sparkleCentre);
  const strikeAt = camToScreen(cam, GEO.flameBase);
  return (
    <AbsoluteFill style={{ filter: z.lift !== 1 ? `brightness(${z.lift})` : undefined }}>
      {background ? <Field theme={theme} cx={cx} cy={cy} grain={grain} /> : null}
      {z.official && !hero ? (
        // the hold is the official file itself, drawn inline through the same raster path as the parts
        <LogoStage width={width} height={height} ox={ox} oy={oy}>
          <OfficialLogo theme={theme} />
        </LogoStage>
      ) : z.official ? (
        <LogoStage width={width} height={height} ox={ox} oy={oy} cam={cam}>
          <OfficialLogo theme={theme} />
        </LogoStage>
      ) : (
        <LogoStage width={width} height={height} ox={ox} oy={oy} cam={cam}>
          {dark ? <FlashBloom t={z.flashT} r={hero ? 280 : 250} /> : <FlashRing t={z.flashT} />}
          <MicroBurst
            x={GEO.flameBase[0]}
            y={GEO.flameBase[1]}
            t={z.burst}
            theme={theme}
            reach={hero ? 66 : 22}
            width={hero ? 3 : 1.4}
          />
          {/* light: the pastel heat trail sits behind the fresh ink, dark: light rides on top */}
          {dark ? null : comets}
          <LogoRig theme={theme} st={z.rig} />
          {dark ? <BandHairline a={z.hairline.a} b={z.hairline.b} opacity={z.hairline.opacity} /> : null}
          {dark ? comets : null}
          {z.drip ? <Drip from={PAW_IN} to={[PAW_IN[0], BASE_Y]} u={z.drip.u} trail={z.drip.trail} theme={theme} /> : null}
          {z.baseline ? <BaselineLight y={BASE_Y} xL={z.baseline.xL} xR={z.baseline.xR} theme={theme} opacity={z.baseline.opacity} /> : null}
          {z.leapTrail ? <LightStreak pts={z.leapTrail} theme={theme} opacity={1 - ramp(o, CUE.land, CUE.land + 2)} /> : null}
          {z.heads.map((h, i) => (
            <SparkHead key={i} x={h.x} y={h.y} theme={theme} energy={h.energy} glint={h.glint} rot={h.rot} opacity={h.opacity} />
          ))}
          {dark ? null : <FlashRays t={z.flashT} rot={sp.rot ?? 0} scale={sp.scale ?? 1} />}
        </LogoStage>
      )}
      {hero ? <StrikeLight t={z.burst} cx={strikeAt[0]} cy={strikeAt[1]} width={width} height={height} /> : null}
      {dark ? (
        <>
          <FieldGlow t={z.flashT} cx={star[0]} cy={star[1]} width={width} height={height} gain={0.2} dur={10} />
          <FlashStreak t={z.flashT} cx={star[0]} cy={star[1]} len={0.8 * width} width={width} height={height} />
        </>
      ) : null}
    </AbsoluteFill>
  );
};

export const Zazeh: React.FC<ZazehProps> = ({ theme, ratio, variant, bpm, grain }) => {
  const frame = useCurrentFrame();
  const f = FORMATS[ratio];
  return (
    <>
      <ZazehScene
        o={openClock(frame, variant, bpm)}
        theme={theme}
        width={f.width}
        height={f.height}
        ox={f.ox}
        oy={f.oy}
        variant={variant}
        grain={grain}
      />
      {/* the sonic logo (scripts/build-audio.mjs), authored on the same cue sheet at 120 BPM */}
      {variant === "full" ? <Audio src={sonicLogo} playbackRate={bpm / 120} /> : null}
    </>
  );
};

export const zazehMeta: CalculateMetadataFunction<ZazehProps> = ({ props }) => ({
  width: FORMATS[props.ratio].width,
  height: FORMATS[props.ratio].height,
  durationInFrames: zazehDuration(props.variant, props.bpm),
});
