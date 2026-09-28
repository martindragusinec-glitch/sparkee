import React from "react";
import { AbsoluteFill } from "remotion";
import { GuideCircle, GuideLine } from "../kit/construction";
import { Field } from "../kit/effects";
import { BOX_CENTRE, GEO, K } from "../kit/geometry";
import { LOGO } from "../kit/logo-data.gen";
import { LogoStage, useNs, type Cam } from "../kit/stage";
import { FLOAT, OX, OY, PIVOT, PS, logoBuild, type BuildState } from "./build";
import { BuildLayer } from "./BuildLayer";
import { Hook } from "./Type";

/**
 * Custom Reel cover, built from the same build clock and the same parts (no other artwork):
 *   hero       the finished mascot with its real construction drawn over it (circles fitted to the lobes,
 *              the hull tangents, the 24° eye line, every bezier anchor and handle)
 *   blueprint  the construction frame (b 116, the end of 02 řád)
 * No scrub bar: the cover is a promise, not a chapter. The question is set at 124 px inside x96–960 at
 * y290 (it survives the 3:4 profile-grid crop y240–1680 at ~15 pt); the drawing keeps ≥ 80 px of air under it.
 */
export type CoverVariant = "hero" | "blueprint";
export type CoverProps = { variant: CoverVariant };

const B = 116;
const COVER_K = 3.0;
const COVER_DY = 92;
export const TITLE = { size: 124, top: 290, x: 96 };
const COVER_CAM: Cam = { k: COVER_K, pivot: PIVOT, at: [PS[0], PS[1] + COVER_DY] };

export const coverState = (variant: CoverVariant): BuildState => {
  const st = logoBuild(B, COVER_CAM);
  const base: BuildState = { ...st, pen: { ...st.pen, x: st.pen.x - 8, y: st.pen.y + 6 } };
  if (variant === "blueprint") return base;
  return {
    ...base,
    sketchOp: 0,
    previewOp: 0,
    // every real anchor and handle of the outline
    anchorsT: 60,
    anchorOp: base.anchorOp.map(() => 1),
    handles: 1,
    rig: {
      ...base.rig,
      outline: 1,
      flood: 1,
      body: 1,
      floodSeed: undefined,
      cheeks: 1,
      mouth: 1,
      eyes: 1,
      happy: 0,
      flame: 1,
    },
  };
};

/** the same guides again in white, clipped to the mascot: construction you can read on the holo */
const WhiteGuides: React.FC<{ st: BuildState }> = ({ st }) => {
  const ns = useNs();
  const g = st.guides;
  return (
    <g transform={`translate(0 ${FLOAT})`}>
      <defs>
        <clipPath id={ns.id("sil")} clipPathUnits="userSpaceOnUse">
          <path d={LOGO.fills.head.dSolid} />
        </clipPath>
      </defs>
      <g clipPath={ns.url("sil")} opacity={0.85}>
        {GEO.lobes.map((c, i) => (
          <GuideCircle key={i} c={c} dot={g.lobes[i].dot} progress={g.lobes[i].ring} color="#fff" />
        ))}
        <GuideCircle c={GEO.inscribed} dot={g.inscribed.dot} progress={g.inscribed.ring} color="#fff" />
        {GEO.tangents.map(([a, b], i) => (
          <GuideLine key={i} a={a} b={b} progress={g.tangents[i].p} color="#fff" />
        ))}
      </g>
    </g>
  );
};

export const BrandStoryReelCover: React.FC<CoverProps & { field?: boolean }> = ({ variant, field = true }) => {
  const st = coverState(variant);
  const cx = OX + BOX_CENTRE[0] * K;
  const cy = OY + BOX_CENTRE[1] * K;
  return (
    <AbsoluteFill>
      {field ? <Field theme="light" cx={cx} cy={cy} /> : null}
      <BuildLayer st={st} width={1080} height={1920} pen={st.pen} overlay={variant === "hero"} />
      {variant === "hero" ? (
        <LogoStage width={1080} height={1920} ox={OX} oy={OY} cam={COVER_CAM}>
          <WhiteGuides st={st} />
        </LogoStage>
      ) : null}
      <Hook t={0} enter={null} size={TITLE.size} top={TITLE.top} x={TITLE.x} />
    </AbsoluteFill>
  );
};

/** 4:5 grid version (1080×1350): the 9:16 cover seen through a window at y200–1550 (90 px of air above the question) */
export const COVER_4X5_TOP = 200;
export const BrandStoryReelCover4x5: React.FC<CoverProps> = ({ variant }) => (
  <AbsoluteFill>
    <Field theme="light" cx={OX + BOX_CENTRE[0] * K} cy={OY + BOX_CENTRE[1] * K - COVER_4X5_TOP} />
    <div style={{ position: "absolute", left: 0, top: -COVER_4X5_TOP, width: 1080, height: 1920 }}>
      <BrandStoryReelCover variant={variant} field={false} />
    </div>
  </AbsoluteFill>
);
