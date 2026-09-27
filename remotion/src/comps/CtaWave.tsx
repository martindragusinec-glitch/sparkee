import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { MascotAt, preloadMascots } from "../mascot/Mascot";
import { C, POSE, foreWave } from "../lib/theme";
import { blinkAt, clamp, loopSin } from "../lib/motion";
import { SparkleBurst, SpeechBubble, Twinkle, hop } from "../lib/ui";

preloadMascots([POSE.sticker]);

/**
 * CtaWave — greeting for the CTA block, on ink with a soft holo glow.
 * Greeting: anticipation → hop with squash & stretch → rock ±7°, forearm wave at the elbow (.m-fore-l),
 * ^^ eyes + bigger mouth, "Ahoj! 👋" bubble and a sparkle burst. Uses the white-outline sticker pose.
 * 800×800, 4 s, seamless loop (rest pose at both ends).
 */
export const CTA_DUR = 120;
const DUR = CTA_DUR;

const FEET = { x: 400, y: 650 };
const MW = 300;

export const CtaWave: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = MW / 264;

  const h = hop(frame, 14, 30, FEET.x, FEET.x, 74);
  const rockAmp = interpolate(frame, [32, 38, 76, 86], [0, 7, 7, 0], clamp);
  const rock = Math.sin(((frame - 32) / 22) * Math.PI * 2) * rockAmp;
  const happy = frame >= 16 && frame < 96;
  const breathe = 1 + loopSin(frame, DUR, 2) * 0.012;
  const glow = (loopSin(frame, DUR, 1) + 1) / 2;
  const hopGlow = interpolate(frame, [14, 22, 40], [0, 1, 0], clamp);

  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      {/* soft holo glow */}
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 70,
          width: 620,
          height: 620,
          borderRadius: 999,
          background:
            "radial-gradient(closest-side at 38% 40%, rgba(165,237,197,.55), rgba(165,237,197,0) 70%)," +
            "radial-gradient(closest-side at 64% 46%, rgba(196,156,242,.55), rgba(196,156,242,0) 72%)," +
            "radial-gradient(closest-side at 50% 70%, rgba(245,184,220,.35), rgba(245,184,220,0) 70%)," +
            "radial-gradient(closest-side at 50% 30%, rgba(154,216,248,.35), rgba(154,216,248,0) 70%)",
          filter: "blur(18px)",
          opacity: 0.8 + 0.15 * glow + 0.2 * hopGlow,
          scale: String(0.97 + 0.04 * glow + 0.06 * hopGlow),
        }}
      />
      {/* floor glow */}
      <div
        style={{
          position: "absolute",
          left: FEET.x - 150,
          top: FEET.y - 26,
          width: 300,
          height: 52,
          borderRadius: 999,
          background: "radial-gradient(closest-side, rgba(196,156,242,.55), rgba(196,156,242,0))",
          scale: String(1 + h.lift / 260),
        }}
      />

      {[
        { x: 150, y: 190, s: 26, c: C.mint, p: 0 },
        { x: 668, y: 170, s: 20, c: C.lavender, p: 1.6 },
        { x: 120, y: 520, s: 18, c: C.sky, p: 3.1 },
        { x: 690, y: 560, s: 28, c: C.pink, p: 4.4 },
        { x: 600, y: 380, s: 14, c: "#fff", p: 2.2 },
        { x: 210, y: 360, s: 14, c: "#fff", p: 5.2 },
      ].map((t, i) => (
        <Twinkle key={i} frame={frame} dur={DUR} x={t.x} y={t.y} size={t.s} color={t.c} phase={t.p} />
      ))}

      <SparkleBurst
        frame={frame}
        start={24}
        x={400}
        y={330}
        radius={250}
        rays={12}
        stars={8}
        color="#fff"
        strokeWidth={7}
        starColors={[C.mint, C.sky, C.lavender, C.pink]}
      />
      <SparkleBurst frame={frame} start={62} x={404} y={320} radius={200} rays={8} stars={5} color="#fff" strokeWidth={5} seed={0.4} />

      <MascotAt
        src={POSE.sticker}
        x={FEET.x}
        y={FEET.y}
        width={MW}
        shadow={false}
        bob={h.lift / s}
        squash={h.inAir || h.squash !== 1 ? h.squash : breathe}
        lean={rock}
        happy={happy}
        mouthScale={happy ? 1.15 : 0.85}
        blink={happy ? 0 : blinkAt(frame, [6, 104])}
        headTilt={0}
        flameWiggle={0}
        parts={foreWave(Math.sin(((frame - 20) / 12) * Math.PI * 2) * 22 * interpolate(frame, [18, 26, 80, 92], [0, 1, 1, 0], clamp))}
      />

      <SpeechBubble frame={frame} fps={fps} start={22} end={92} x={528} y={250} text="Ahoj! 👋" size={46} side="right" />
    </AbsoluteFill>
  );
};
