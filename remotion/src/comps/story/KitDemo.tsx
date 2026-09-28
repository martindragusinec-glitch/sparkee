import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Anchors, AngleMeasure, DotGrid, GuideCircle, GuideLine, Handles, SketchStroke, TypeMetrics } from "./kit/construction";
import { BLOOM, DRAW, SNAP, popSettle, ramp, springAt } from "./kit/easing";
import { Field, FlashRays, FlashRing, MicroBurst } from "./kit/effects";
import { GEO, K, LETTERS, M } from "./kit/geometry";
import { LOGO } from "./kit/logo-data.gen";
import { LogoRig } from "./kit/LogoRig";
import { LogoStage } from "./kit/stage";

/**
 * QA / reference: every construction-kit component driven by one clock on the real logo geometry.
 * Left: the mascot at 3.4 px/u (sketch → construction → anchors + handles → outline → flood → face).
 * Right: the wordmark at 1.4 px/u (type metrics, letters rising, ✦ flash).
 */
export const KIT_DEMO_DUR = 150;

const HEAD = GEO.headCentre;
const ZOOM = 3.4 / K;

export const KitDemo: React.FC = () => {
  const f = useCurrentFrame();

  // mascot build clock
  const sketch = ramp(f, 0, 40, DRAW);
  const sketchDim = 1 - 0.65 * ramp(f, 40, 46);
  const grid = ramp(f, 30, 40);
  const lobes = GEO.lobes.map((_, i) => ({ dot: springAt(f, 34 + i * 4, BLOOM), ring: ramp(f, 36 + i * 4, 43 + i * 4, DRAW) }));
  const tangents = GEO.tangents.map((_, i) => ramp(f, 54 + i * 2, 60 + i * 2, DRAW));
  const angle = ramp(f, 48, 66);
  const anchorsT = f - 62;
  const handles = ramp(f, 66, 84);
  const outline = ramp(f, 84, 102, DRAW);
  const scaffold = 1 - ramp(f, 92, 104); // the clean line erases its own scaffolding
  const flood = ramp(f, 100, 112, SNAP);

  // wordmark clock
  const metrics = ramp(f, 20, 34);
  const letters = LETTERS.map((_, i) => ramp(f, 40 + i * 3, 48 + i * 3, SNAP));
  const flash = f - 118;

  const ox = 640 - K * HEAD[0];
  const oy = 520 - K * HEAD[1];
  return (
    <AbsoluteFill>
      <Field theme="light" cx={960} cy={540} />
      <LogoStage width={1920} height={1080} ox={ox} oy={oy} zoom={ZOOM} pivot={HEAD}>
        <DotGrid box={[120, 0, 320, 230]} progress={grid * scaffold} />
        <g opacity={sketchDim * scaffold}>
          <SketchStroke d={LOGO.flame.silhouette} seed={3} progress={ramp(f, 0, 10, DRAW)} />
          <SketchStroke d={LOGO.silhouette} seed={11} progress={sketch} />
        </g>
        <g opacity={scaffold}>
          {GEO.lobes.map((c, i) => (
            <GuideCircle key={i} c={c} dot={lobes[i].dot} progress={lobes[i].ring} />
          ))}
          <GuideCircle c={GEO.inscribed} dot={springAt(f, 50, BLOOM)} progress={ramp(f, 50, 58, DRAW)} />
          {GEO.tangents.map(([a, b], i) => (
            <GuideLine key={i} a={a} b={b} progress={tangents[i]} />
          ))}
          <GuideCircle c={GEO.flameCircle} dot={springAt(f, 56, BLOOM)} progress={ramp(f, 56, 63, DRAW)} />
          {GEO.flameTangents.map(([a, b], i) => (
            <GuideLine key={i} a={a} b={b} progress={ramp(f, 60 + i * 2, 66 + i * 2, DRAW)} />
          ))}
          <GuideCircle c={{ cx: GEO.eyeL.cx, cy: GEO.eyeL.cy, r: GEO.eyeL.ry }} dot={0} progress={ramp(f, 58, 64, DRAW)} />
          <GuideCircle c={GEO.eyeR} dot={0} progress={ramp(f, 60, 66, DRAW)} />
          <AngleMeasure origin={GEO.eyeLine.l} deg={GEO.eyeLine.deg} radiusPx={200} progress={angle} label="24°" labelAt={[304, 116]} />
          <Anchors pts={[...GEO.mascotAnchors.anchors, ...GEO.flameAnchors.anchors]} t={anchorsT} />
          <Handles pairs={[...GEO.mascotAnchors.handles, ...GEO.flameAnchors.handles]} progress={handles} />
        </g>
        <LogoRig
          theme="light"
          st={{
            letters: 0,
            outline: outline,
            flood,
            body: ramp(f, 103, 115, SNAP),
            sheen: 0.4,
            cheeks: ramp(f, 110, 114),
            mouth: springAt(f, 112, BLOOM),
            eyes: ramp(f, 116, 120, SNAP),
            flame: ramp(f, 104, 109, SNAP),
            sparkle: 0,
          }}
        />
        <MicroBurst x={GEO.flameBase[0]} y={GEO.flameBase[1]} t={f - 104} theme="light" />
      </LogoStage>

      <LogoStage width={1920} height={1080} ox={1085} oy={420}>
        <TypeMetrics
          ys={[M.ascender, M.xHeight, M.baseline, M.descender]}
          x0={-12}
          x1={548}
          progress={metrics}
          overshoot={[M.baseline, M.overshoot]}
          opacity={1 - 0.6 * ramp(f, 100, 110)}
        />
        <FlashRing t={flash} />
        <LogoRig
          theme="light"
          st={{
            letters: letters.map((r) => ({ rise: r })),
            sparkle: flash < 0 ? 0 : { scale: popSettle(f, 118, 1.35, 3, BLOOM, 0.2), rot: -90 * (1 - ramp(f, 118, 126, SNAP)) },
          }}
        />
        <FlashRays t={flash - 1} rot={-90 * (1 - ramp(f, 118, 126, SNAP))} scale={flash < 0 ? 0 : popSettle(f, 118, 1.35, 3, BLOOM, 0.2)} />
      </LogoStage>
    </AbsoluteFill>
  );
};
