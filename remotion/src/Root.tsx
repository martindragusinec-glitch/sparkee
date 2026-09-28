import React from "react";
import { Composition, Folder, Still } from "remotion";
import { PoseSheet } from "./comps/PoseSheet";
import { SPRAVA_DUR, SvcSprava } from "./comps/SvcSprava";
import { CONTENT_DUR, SvcContent } from "./comps/SvcContent";
import { INFLUENCER_DUR, SvcInfluencer } from "./comps/SvcInfluencer";
import { PAID_DUR, SvcPaid } from "./comps/SvcPaid";
import { SHOWREEL_DUR, Showreel } from "./comps/Showreel";
import { CTA_DUR, CtaWave } from "./comps/CtaWave";
import { LogoParity, logoParityMeta } from "./comps/story/LogoParity";
import { Zazeh, zazehMeta } from "./comps/story/Zazeh";
import { KIT_DEMO_DUR, KitDemo } from "./comps/story/KitDemo";
import { BrandStoryReel, reelMeta } from "./comps/story/BrandStoryReel";
import { BrandStoryReelCover, BrandStoryReelCover4x5 } from "./comps/story/reel/Cover";

export const RemotionRoot: React.FC = () => (
  <>
    <Folder name="Services">
      <Composition id="SvcSprava" component={SvcSprava} durationInFrames={SPRAVA_DUR} fps={30} width={800} height={600} />
      <Composition id="SvcContent" component={SvcContent} durationInFrames={CONTENT_DUR} fps={30} width={800} height={600} />
      <Composition id="SvcInfluencer" component={SvcInfluencer} durationInFrames={INFLUENCER_DUR} fps={30} width={800} height={600} />
      <Composition id="SvcPaid" component={SvcPaid} durationInFrames={PAID_DUR} fps={30} width={800} height={600} />
    </Folder>
    <Folder name="Brand">
      <Composition id="Showreel" component={Showreel} durationInFrames={SHOWREEL_DUR} fps={30} width={1080} height={1350} />
      <Composition id="CtaWave" component={CtaWave} durationInFrames={CTA_DUR} fps={30} width={800} height={800} />
    </Folder>
    <Folder name="BrandStory">
      {/* the Reel "PŘETOČ": 600 f = 20.0 s = 10 bars at 120 BPM, with its sound design; bpm remaps every cue */}
      <Composition
        id="BrandStoryReel"
        component={BrandStoryReel}
        durationInFrames={600}
        fps={30}
        width={1080}
        height={1920}
        calculateMetadata={reelMeta}
        defaultProps={{ bpm: 120, rollFrames: 0 }}
      />
      {/* custom Reel cover from the same build clock: hero (chosen) / blueprint (the end of 02 řád) */}
      <Still id="BrandStoryReelCover" component={BrandStoryReelCover} width={1080} height={1920} defaultProps={{ variant: "hero" as const }} />
      <Still id="BrandStoryReelCover4x5" component={BrandStoryReelCover4x5} width={1080} height={1350} defaultProps={{ variant: "hero" as const }} />
      <Folder name="LogoOpen">
        <Composition id="LogoOpen16x9Light" component={Zazeh} durationInFrames={150} fps={30} width={1920} height={1080} calculateMetadata={zazehMeta} defaultProps={{ theme: "light" as const, ratio: "16x9" as const, variant: "full" as const, bpm: 120, grain: true }} />
        <Composition id="LogoOpen16x9Dark" component={Zazeh} durationInFrames={150} fps={30} width={1920} height={1080} calculateMetadata={zazehMeta} defaultProps={{ theme: "dark" as const, ratio: "16x9" as const, variant: "full" as const, bpm: 120, grain: true }} />
        <Composition id="LogoOpen9x16Light" component={Zazeh} durationInFrames={150} fps={30} width={1080} height={1920} calculateMetadata={zazehMeta} defaultProps={{ theme: "light" as const, ratio: "9x16" as const, variant: "full" as const, bpm: 120, grain: true }} />
        <Composition id="LogoOpen9x16Dark" component={Zazeh} durationInFrames={150} fps={30} width={1080} height={1920} calculateMetadata={zazehMeta} defaultProps={{ theme: "dark" as const, ratio: "9x16" as const, variant: "full" as const, bpm: 120, grain: true }} />
        <Composition id="LogoOpen1x1Light" component={Zazeh} durationInFrames={150} fps={30} width={1080} height={1080} calculateMetadata={zazehMeta} defaultProps={{ theme: "light" as const, ratio: "1x1" as const, variant: "full" as const, bpm: 120, grain: true }} />
        <Composition id="LogoOpen1x1Dark" component={Zazeh} durationInFrames={150} fps={30} width={1080} height={1080} calculateMetadata={zazehMeta} defaultProps={{ theme: "dark" as const, ratio: "1x1" as const, variant: "full" as const, bpm: 120, grain: true }} />
        {/* 5.0 s each: the 3.5 s open + a 1.5 s hold on the official file; sonic logo included.
            Parametric master below: theme, ratio, variant (full / mini / micro) and bpm */}
        <Composition id="Zazeh" component={Zazeh} durationInFrames={150} fps={30} width={1080} height={1920} calculateMetadata={zazehMeta} defaultProps={{ theme: "dark" as const, ratio: "9x16" as const, variant: "full" as const, bpm: 120, grain: true }} />
      </Folder>
      <Folder name="QA">
        <Composition id="LogoKitDemo" component={KitDemo} durationInFrames={KIT_DEMO_DUR} fps={30} width={1920} height={1080} />
        <Composition
          id="LogoParity"
          component={LogoParity}
          durationInFrames={1}
          fps={30}
          width={2272}
          height={1168}
          calculateMetadata={logoParityMeta}
          defaultProps={{ theme: "light" as const, mode: "parts" as const, pxPerUnit: 4, bg: false }}
        />
      </Folder>
    </Folder>
    <Folder name="Dev">
      <Composition id="PoseSheet" component={PoseSheet} durationInFrames={30} fps={30} width={1400} height={800} />
    </Folder>
  </>
);
