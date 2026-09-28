import React from "react";
import { AbsoluteFill } from "remotion";
import { MascotAt } from "../mascot/Mascot";
import { C, nunito } from "../lib/theme";

/** Dev: every pose file on one baseline (red) to check feet anchoring and scale after pose updates. */
const FILES = [
  "poses/stand.svg",
  "poses/wave.svg",
  "poses/phone.svg",
  "poses/phone-wave.svg",
  "poses/happy.svg",
  "poses/surprised.svg",
  "poses/sticker.svg",
  "poses/lie.svg",
];

export const PoseSheet: React.FC = () => (
  <AbsoluteFill style={{ background: C.paper, fontFamily: nunito }}>
    <div style={{ position: "absolute", left: 0, top: 600, width: 1400, height: 2, background: "red" }} />
    {FILES.map((f, i) => (
      <React.Fragment key={f}>
        <MascotAt src={f} x={100 + i * 172} y={600} width={150} style={f.includes("sticker") ? { background: C.ink } : undefined} />
        <div style={{ position: "absolute", left: 40 + i * 172, top: 640, fontSize: 16, fontWeight: 600 }}>{f.replace("poses/", "")}</div>
      </React.Fragment>
    ))}
  </AbsoluteFill>
);
