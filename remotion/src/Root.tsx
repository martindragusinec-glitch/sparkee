import React from "react";
import { Composition, Folder } from "remotion";
import { PoseSheet } from "./comps/PoseSheet";
import { SPRAVA_DUR, SvcSprava } from "./comps/SvcSprava";
import { CONTENT_DUR, SvcContent } from "./comps/SvcContent";
import { INFLUENCER_DUR, SvcInfluencer } from "./comps/SvcInfluencer";
import { PAID_DUR, SvcPaid } from "./comps/SvcPaid";
import { SHOWREEL_DUR, Showreel } from "./comps/Showreel";
import { CTA_DUR, CtaWave } from "./comps/CtaWave";

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
    <Folder name="Dev">
      <Composition id="PoseSheet" component={PoseSheet} durationInFrames={30} fps={30} width={1400} height={800} />
    </Folder>
  </>
);
