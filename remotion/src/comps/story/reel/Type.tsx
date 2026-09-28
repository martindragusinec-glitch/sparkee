import React from "react";
import { C, HOLO, HOLO_TEXT, baloo, nunito } from "../../../lib/theme";
import { BLOOM, ROLL, SNAP, popSettle, ramp } from "../kit/easing";
import { LOGO } from "../kit/logo-data.gen";
import { GEO } from "../kit/geometry";

/**
 * The Reel's type. One headline lane and one claim lane, both on the wordmark's left edge (x166), so the
 * question, the story lines, the logo and the claim share one axis.
 *   headline  top y250, Baloo 2 800 92 px, lh 1.02, −1 % tracking
 *   claim     top y1170, 60 px, lh 1.05
 * Light: solid ink, the accent is the brand highlighter under one word (site.css .holo-text::after).
 * Dark: mist, the accent is the holo diagonal ON one short word (site.css --holo-text, background-clip).
 * Words move through their line's mask as a slot roll (opacity stays 1); nothing is readable < 36 f.
 */
export const LANE = { x: 166, top: 250, size: 92, lh: 1.02 };
export const CLAIM = { x: 166, top: 1170, size: 60, lh: 1.05 };
/** mask padding (em) above / below a line: háčky and čárky on top, descenders below */
const PAD_T = 0.16;
const PAD_B = 0.24;
/** slot-roll travel (em): one line plus the padding, so a word fully clears the mask */
export const ROLL_EM = 1.42;
const ROLL_F = 8;

type Anim = { y?: number; op?: number };

/**
 * A line that clips its words (the "mask" they roll through). Its lane is a flex column, so the negative
 * margins that cancel the padding can never collapse between lines: layout = lh × size per line.
 */
const MaskLine: React.FC<{ size: number; lh: number; children: React.ReactNode }> = ({ size, lh, children }) => (
  <div
    style={{
      display: "block",
      height: size * lh,
      lineHeight: lh,
      overflow: "hidden",
      paddingTop: size * PAD_T,
      paddingBottom: size * PAD_B,
      marginTop: -size * PAD_T,
      marginBottom: -size * PAD_B,
      whiteSpace: "nowrap",
      boxSizing: "content-box",
      flexShrink: 0,
    }}
  >
    {children}
  </div>
);

const W: React.FC<{ a?: Anim; children: React.ReactNode }> = ({ a = {}, children }) => (
  <span style={{ display: "inline-block", translate: `0 ${a.y ?? 0}px`, opacity: a.op ?? 1 }}>{children}</span>
);

/**
 * The brand highlighter (site.css .holo-text::after / story.css .st-mark__line): a soft --holo (115°)
 * swipe behind the lower part of the word, left −.06em, right −.08em, bottom .14em, height .3em,
 * radius .14em, 55 %, skewed −8°, drawn left → right with scaleX. Behind the letters (isolated span, z −1).
 */
export const Marked: React.FC<{ progress: number; children: React.ReactNode }> = ({ progress, children }) => (
  <span style={{ position: "relative", display: "inline-block", isolation: "isolate" }}>
    {progress > 0 ? (
      <span
        style={{
          position: "absolute",
          zIndex: -1,
          left: "-0.06em",
          right: "-0.08em",
          bottom: "0.14em",
          height: "0.3em",
          borderRadius: "0.14em",
          opacity: 0.55,
          transformOrigin: "0 50%",
          scale: `${Math.min(1, progress)} 1`,
        }}
      >
        <span style={{ position: "absolute", inset: 0, borderRadius: "inherit", backgroundImage: HOLO, transform: "skewX(-8deg)" }} />
      </span>
    ) : null}
    {children}
  </span>
);

/** Dark only: the holo diagonal ON one short word (box = the word exactly, no animation of the hue). */
export const HoloWord: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    style={{
      backgroundImage: HOLO_TEXT,
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      WebkitTextFillColor: "transparent",
      color: "transparent",
      paddingRight: "0.04em",
      marginRight: "-0.04em",
    }}
  >
    {children}
  </span>
);

const laneStyle = (x: number, top: number, size: number, lh: number, color: string = C.ink): React.CSSProperties => ({
  position: "absolute",
  left: x,
  top,
  width: 940 - x,
  display: "flex",
  flexDirection: "column",
  fontFamily: baloo,
  fontWeight: 800,
  fontSize: size,
  lineHeight: lh,
  letterSpacing: "-0.01em",
  color,
  fontKerning: "normal",
});

// ------------------------------------------------------------------ the slot roll
/** a word rolling IN from one slot below: it starts 2 f after `at` and lands on ROLL over 8 f */
export const rollIn = (t: number, at: number, size = LANE.size): Anim => ({ y: ROLL_EM * size * (1 - ROLL(ramp(t, at + 2, at + 2 + ROLL_F))) });
/** a word rolling OUT one slot up, from `at`, on the same 8 f curve */
export const rollOut = (t: number, at: number, size = LANE.size): Anim => ({ y: -ROLL_EM * size * ROLL(ramp(t, at, at + ROLL_F)) });
const add = (a: Anim, b: Anim): Anim => ({ y: (a.y ?? 0) + (b.y ?? 0), op: (a.op ?? 1) * (b.op ?? 1) });
/** visible in the mask at all? (a word is clipped away once it has travelled a full slot) */
const inSlot = (a: Anim, size = LANE.size) => Math.abs(a.y ?? 0) < ROLL_EM * size - 0.5;

// ------------------------------------------------------------------ the hook "Jak vzniklo / moje logo?"
/**
 * `enter` = when the words roll in (the loop seam; at f0 it is already set: null); `outAt` = the frame the
 * hook leaves (null = it is cut away by the lights-off, never animated out).
 */
export const Hook: React.FC<{ t: number; enter: number | null; size?: number; top?: number; x?: number }> = ({
  t,
  enter,
  size = LANE.size,
  top = LANE.top,
  x = LANE.x,
}) => {
  const words = ["Jak", "vzniklo", "moje", "logo"];
  const a = words.map((_, i) => (enter === null ? {} : rollIn(t, enter + 2 * i, size)));
  const marker = enter === null ? 1 : ramp(t, enter + 14, enter + 22, SNAP);
  return (
    <div style={laneStyle(x, top, size, LANE.lh)}>
      <MaskLine size={size} lh={LANE.lh}>
        <W a={a[0]}>{words[0]}</W> <W a={a[1]}>{words[1]}</W>
      </MaskLine>
      <MaskLine size={size} lh={LANE.lh}>
        <W a={a[2]}>{words[2]}</W>{" "}
        <W a={a[3]}>
          <Marked progress={marker}>logo</Marked>?
        </W>
      </MaskLine>
    </div>
  );
};

// ------------------------------------------------------------------ the first spark (dark): eyebrow + "Na počátku / byla jiskra."
/** the website's eyebrow (site.css .eyebrow): holo ✦ + uppercase, .14em tracking, mist 72 % on dark */
const Eyebrow: React.FC<{ a: Anim; text: string }> = ({ a, text }) => {
  const [x0, y0, x1, y1] = GEO.sparkleBox;
  return (
    <div style={{ height: 56, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", fontSize: 44, lineHeight: 1.1 }}>
      <W a={a}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 16,
            fontFamily: nunito,
            fontWeight: 800,
            fontSize: 44,
            lineHeight: 1.1,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(245,244,251,0.72)",
          }}
        >
          <svg width={36} height={36 * ((y1 - y0) / (x1 - x0))} viewBox={`${x0} ${y0} ${x1 - x0} ${y1 - y0}`} style={{ display: "block" }}>
            <defs dangerouslySetInnerHTML={{ __html: LOGO.defsLight.split("__P__").join("eyebrow-") }} />
            <g dangerouslySetInnerHTML={{ __html: LOGO.sparkle.fills.split("__P__").join("eyebrow-") }} />
          </svg>
          {text}
        </span>
      </W>
    </div>
  );
};

export const SparkLine: React.FC<{ t: number }> = ({ t }) => {
  if (t < 45 || t >= 92) return null;
  const words = ["Na", "počátku", "byla", "jiskra"];
  const a = words.map((_, i) => rollIn(t, 45 + 2 * i));
  const eb: Anim = { y: 30 * (1 - SNAP(ramp(t, 45, 52))), op: ramp(t, 45, 49) };
  return (
    <div style={laneStyle(LANE.x, LANE.top, LANE.size, LANE.lh, C.mist)}>
      <Eyebrow a={eb} text="září 2026" />
      <div style={{ height: 30, flexShrink: 0 }} />
      <MaskLine size={LANE.size} lh={LANE.lh}>
        <W a={a[0]}>{words[0]}</W> <W a={a[1]}>{words[1]}</W>
      </MaskLine>
      <MaskLine size={LANE.size} lh={LANE.lh}>
        <W a={a[2]}>{words[2]}</W>{" "}
        <W a={a[3]}>
          <HoloWord>jiskra</HoloWord>.
        </W>
      </MaskLine>
    </div>
  );
};

// ------------------------------------------------------------------ the story lane (paper, f90 → the portal)
const CH_WORDS = ["skica.", "řád.", "křivky.", "barva.", "jméno."];
/** chapter downbeats of the lane: 01 f90 … 05 f270, 06 = the whole line swaps to "A pak já." at f315 */
export const CH_AT = [90, 135, 180, 225, 270];
const JA_AT = 315;
const NAOSTRO_AT = 360;

export const StoryLane: React.FC<{ t: number }> = ({ t }) => {
  if (t < 90) return null;
  const layers: React.ReactNode[] = [];
  // "Pak ___." — "Pak" never moves after it lands; the chapter word rolls in its slot 8 f before each downbeat
  if (t < JA_AT + 2) {
    const lineIn = rollIn(t, 88);
    const lineOut = rollOut(t, JA_AT - 6);
    const line = add(lineIn, lineOut);
    const words = CH_WORDS.map((w, i) => {
      const inA: Anim = i === 0 ? {} : rollIn(t, CH_AT[i] - 6);
      const outA: Anim = i === CH_WORDS.length - 1 ? {} : rollOut(t, CH_AT[i + 1] - 6);
      const a = add(inA, outA);
      const on = (i === 0 || t >= CH_AT[i] - 6) && (i === CH_WORDS.length - 1 || t < CH_AT[i + 1] + 2 + ROLL_F);
      return { w, a, on: on && inSlot(a) };
    });
    layers.push(
      <div key="pak" style={laneStyle(LANE.x, LANE.top, LANE.size, LANE.lh)}>
        <MaskLine size={LANE.size} lh={LANE.lh}>
          <W a={line}>Pak</W>{" "}
          <W a={line}>
            <span style={{ display: "inline-grid", verticalAlign: "baseline" }}>
              {words.map((x) =>
                x.on ? (
                  <span key={x.w} style={{ gridArea: "1 / 1", translate: `0 ${x.a.y ?? 0}px` }}>
                    {x.w}
                  </span>
                ) : null,
              )}
            </span>
          </W>
        </MaskLine>
      </div>,
    );
  }
  // "A pak já." (06): the rhythm breaks, the whole line rolls
  if (t >= JA_AT - 6 && t < NAOSTRO_AT + 4) {
    const a = add(rollIn(t, JA_AT - 6), rollOut(t, NAOSTRO_AT - 6));
    const mk = ramp(t, JA_AT + 6, JA_AT + 14, SNAP);
    if (inSlot(a))
      layers.push(
        <div key="ja" style={laneStyle(LANE.x, LANE.top, LANE.size, LANE.lh)}>
          <MaskLine size={LANE.size} lh={LANE.lh}>
            <W a={a}>
              A pak <Marked progress={mk}>já</Marked>.
            </W>
          </MaskLine>
        </div>,
      );
  }
  // "A teď naostro." (the pre-drop) — swallowed by the ✦ portal
  if (t >= NAOSTRO_AT - 6 && t < 414) {
    const a = rollIn(t, NAOSTRO_AT - 6);
    layers.push(
      <div key="naostro" style={laneStyle(LANE.x, LANE.top, LANE.size, LANE.lh)}>
        <MaskLine size={LANE.size} lh={LANE.lh}>
          <W a={a}>A teď naostro.</W>
        </MaskLine>
      </div>,
    );
  }
  return layers.length ? <>{layers}</> : null;
};

// ------------------------------------------------------------------ the claim "Dodáme jiskru / tvým sociálním sítím ✦"
/** the ✦ inline: sparkle.svg (holo), 0.28 em after the word, optically centred on the x-height (vertical-align: middle) */
const InlineSparkle: React.FC<{ size: number; scale: number }> = ({ size, scale }) => {
  const [x0, y0, x1, y1] = GEO.sparkleBox;
  const w = x1 - x0;
  const h = y1 - y0;
  return (
    <svg
      width={size * (w / h)}
      height={size}
      viewBox={`${x0} ${y0} ${w} ${h}`}
      style={{ display: "inline-block", verticalAlign: "middle", overflow: "visible", scale: `${scale}`, marginLeft: "0.28em" }}
    >
      <defs dangerouslySetInnerHTML={{ __html: LOGO.defsLight.split("__P__").join("claim-") }} />
      <g dangerouslySetInnerHTML={{ __html: LOGO.sparkle.fills.split("__P__").join("claim-") }} />
    </svg>
  );
};

/** claim in on the lights (f512), marker f524, ✦ twinkle on the bar-10 downbeat (f540), rolls out at the seam (f566) */
export const CLAIM_IN = 512;
export const CLAIM_OUT = 566;
export const Claim: React.FC<{ t: number }> = ({ t }) => {
  if (t < CLAIM_IN - 2 || t >= CLAIM_OUT + 12) return null;
  const l1 = add(rollIn(t, CLAIM_IN - 2, CLAIM.size), rollOut(t, CLAIM_OUT, CLAIM.size));
  const l2 = add(rollIn(t, CLAIM_IN + 1, CLAIM.size), rollOut(t, CLAIM_OUT + 2, CLAIM.size));
  const mk = ramp(t, CLAIM_IN + 12, CLAIM_IN + 21, SNAP);
  const tw = t < 540 || t >= 566 ? 1 : popSettle(t, 540, 1.16, 3, BLOOM, 1);
  return (
    <div style={laneStyle(CLAIM.x, CLAIM.top, CLAIM.size, CLAIM.lh)}>
      <MaskLine size={CLAIM.size} lh={CLAIM.lh}>
        <W a={l1}>
          Dodáme <Marked progress={mk}>jiskru</Marked>
        </W>
      </MaskLine>
      <MaskLine size={CLAIM.size} lh={CLAIM.lh}>
        <W a={l2}>
          tvým sociálním sítím
          <InlineSparkle size={CLAIM.size * 0.56} scale={tw} />
        </W>
      </MaskLine>
    </div>
  );
};
