import React from "react";
import { evolvePath } from "@remotion/paths";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { MascotAt, preloadMascots } from "../mascot/Mascot";
import { C, GRADS, POSE, jakarta, nunito } from "../lib/theme";
import { blinkAt, clamp, ease, loopSin } from "../lib/motion";
import { DotBg, hop } from "../lib/ui";
import { PersonGlyph, Sparkle } from "../lib/shapes";

preloadMascots([POSE.stand]);

/**
 * SvcInfluencer — "Influencer marketing".
 * The mascot sits in the centre, four creator bubbles orbit on an ellipse (one full turn per loop),
 * dashed links draw in with @remotion/paths, "+12" chips and speech bubbles pop in.
 * 800×600, 6 s, seamless loop.
 */
export const INFLUENCER_DUR = 180;
const DUR = INFLUENCER_DUR;

const CX = 400;
const CY = 300;
const RX = 292;
const RY = 196;
const HUB = { x: 400, y: 318 }; // where links attach on the mascot
const MW = 176;
const FEET = { x: 419, y: 446 };

const CREATORS = [
  { grad: 1, chip: "+12", bubble: "Jdu do toho!", a0: -150 },
  { grad: 2, chip: "+48", bubble: null, a0: -60 },
  { grad: 3, chip: "+1,2k", bubble: "Miluju to ✦", a0: 30 },
  { grad: 4, chip: "+36", bubble: null, a0: 120 },
];
const LINK_IN = (i: number) => 6 + i * 7;
const LINK_OUT = (i: number) => 148 + i * 5;
const CHIP_AT = (i: number) => 38 + i * 22;

export const SvcInfluencer: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pos = CREATORS.map((c) => {
    const a = ((c.a0 + (frame / DUR) * 360) * Math.PI) / 180;
    const x = CX + Math.cos(a) * RX;
    const y = CY + Math.sin(a) * RY;
    const depth = (Math.sin(a) + 1) / 2; // 0 back … 1 front
    return { x, y, depth, a };
  });

  // mascot looks toward the creator whose chip is popping
  const focus = CREATORS.map((_, i) => interpolate(frame, [CHIP_AT(i) - 4, CHIP_AT(i) + 2, CHIP_AT(i) + 22, CHIP_AT(i) + 30], [0, 1, 1, 0], clamp));
  let lx = 0;
  let ly = 0;
  focus.forEach((w, i) => {
    const dx = pos[i].x - HUB.x;
    const dy = pos[i].y - HUB.y;
    const n = Math.hypot(dx, dy) || 1;
    lx += (dx / n) * 9 * w;
    ly += (dy / n) * 6 * w;
  });
  const h = hop(frame, 124, 138, 0, 0, 26);
  const happy = frame >= 118 && frame < 150;

  const dashFlow = -(frame * 0.8); // 144 units per loop = 12 dash periods → seamless
  const renderCreator = (i: number) => {
          const p = pos[i];
          const c = CREATORS[i];
          const s = 0.84 + 0.22 * p.depth;
          const r = 42;
          const chip = spring({ frame: frame - CHIP_AT(i), fps, config: { damping: 10, stiffness: 200, mass: 0.6 } });
          const chipOut = interpolate(frame, [CHIP_AT(i) + 46, CHIP_AT(i) + 54], [0, 1], clamp);
          const bub = spring({ frame: frame - (CHIP_AT(i) + 10), fps, config: { damping: 11, stiffness: 180, mass: 0.7 } });
          const bubOut = interpolate(frame, [CHIP_AT(i) + 58, CHIP_AT(i) + 66], [0, 1], clamp);
          const ping = interpolate(frame, [CHIP_AT(i), CHIP_AT(i) + 16], [0, 1], clamp);
          const bob = loopSin(frame, DUR, 3, i * 1.7) * 4;
          return (
            <div key={i} style={{ position: "absolute", left: p.x, top: p.y + bob, width: 0, height: 0 }}>
              {/* ping ring */}
              {ping > 0 && ping < 1 ? (
                <div
                  style={{
                    position: "absolute",
                    left: -r * s * (1 + ping * 0.8),
                    top: -r * s * (1 + ping * 0.8),
                    width: r * 2 * s * (1 + ping * 0.8),
                    height: r * 2 * s * (1 + ping * 0.8),
                    borderRadius: 999,
                    border: `3px solid ${C.lavender}`,
                    opacity: 1 - ping,
                    boxSizing: "border-box",
                  }}
                />
              ) : null}
              <div
                style={{
                  position: "absolute",
                  left: -r - 7,
                  top: -r - 7,
                  width: (r + 7) * 2,
                  height: (r + 7) * 2,
                  borderRadius: 999,
                  background: "linear-gradient(115deg,#A5EDC5 0%,#9AD8F8 34%,#C49CF2 68%,#F5B8DC 100%)",
                  border: `3px solid ${C.ink}`,
                  boxSizing: "border-box",
                  scale: String(s * (1 + 0.12 * Math.sin(Math.min(1, chip) * Math.PI))),
                  boxShadow: `4px 4px 0 ${C.ink}`,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 5,
                    borderRadius: 999,
                    background: GRADS[c.grad],
                    border: `3px solid ${C.white}`,
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                  }}
                >
                  <PersonGlyph size={70} />
                </div>
              </div>
              {/* +chip */}
              {frame >= CHIP_AT(i) && chipOut < 1 ? (
                <div
                  style={{
                    position: "absolute",
                    left: r * 0.55,
                    top: -r - 30,
                    padding: "5px 12px",
                    borderRadius: 99,
                    background: C.ink,
                    color: C.white,
                    fontFamily: nunito,
                    fontWeight: 900,
                    fontSize: 20,
                    whiteSpace: "nowrap",
                    scale: String(chip * (1 - chipOut)),
                    translate: `0 ${-10 * chipOut}px`,
                    transformOrigin: "0% 100%",
                  }}
                >
                  {c.chip}
                </div>
              ) : null}
              {/* speech bubble */}
              {c.bubble && frame >= CHIP_AT(i) + 10 && bubOut < 1 ? (
                <div
                  style={{
                    position: "absolute",
                    [p.x < CX ? "left" : "right"]: -r * 0.9,
                    top: r * 0.9,
                    padding: "8px 14px",
                    borderRadius: 18,
                    borderTopLeftRadius: p.x < CX ? 4 : 18,
                    borderTopRightRadius: p.x < CX ? 18 : 4,
                    background: C.white,
                    border: `2.5px solid ${C.ink}`,
                    boxShadow: `3px 3px 0 ${C.ink}`,
                    fontWeight: 700,
                    fontSize: 17,
                    whiteSpace: "nowrap",
                    scale: String(bub * (1 - bubOut)),
                    transformOrigin: p.x < CX ? "0% 0%" : "100% 0%",
                  }}
                >
                  {c.bubble}
                </div>
              ) : null}
            </div>
          );
        };
  const order = [...pos.keys()].sort((a, b) => pos[a].depth - pos[b].depth);

  return (
    <AbsoluteFill style={{ fontFamily: jakarta, color: C.ink }}>
      <DotBg />
      {/* stage: soft holo disc + dashed orbit */}
      <div
        style={{
          position: "absolute",
          left: CX - 150,
          top: CY - 150,
          width: 300,
          height: 300,
          borderRadius: 999,
          background: "linear-gradient(115deg,#DDF8E8 0%,#DDF1FC 34%,#EDE2FB 68%,#FCE6F2 100%)",
          opacity: 0.95,
        }}
      />
      <svg width={800} height={600} style={{ position: "absolute", inset: 0 }}>
        <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="none" stroke="rgba(44,48,60,.14)" strokeWidth={2} strokeDasharray="3 9" strokeLinecap="round" />
        <defs>
          {pos.map((p, i) => {
            const mx = (HUB.x + p.x) / 2 + (p.y - HUB.y) * 0.18;
            const my = (HUB.y + p.y) / 2 - (p.x - HUB.x) * 0.18;
            const d = `M ${HUB.x} ${HUB.y} Q ${mx} ${my} ${p.x} ${p.y}`;
            const grow = interpolate(frame, [LINK_IN(i), LINK_IN(i) + 22], [0, 1], { ...clamp, easing: ease });
            const shrink = interpolate(frame, [LINK_OUT(i), LINK_OUT(i) + 20], [0, 1], { ...clamp, easing: ease });
            // draw out from the mascot, retract toward the creator
            const ev = evolvePath(grow, d);
            const offset = Number(ev.strokeDashoffset) - shrink * Number(String(ev.strokeDasharray).split(" ")[0]);
            return (
              <mask id={`link-${i}`} key={i} maskUnits="userSpaceOnUse">
                <path d={d} stroke="#fff" strokeWidth={10} fill="none" strokeDasharray={ev.strokeDasharray} strokeDashoffset={offset} />
              </mask>
            );
          })}
        </defs>
        {pos.map((p, i) => {
          const mx = (HUB.x + p.x) / 2 + (p.y - HUB.y) * 0.18;
          const my = (HUB.y + p.y) / 2 - (p.x - HUB.x) * 0.18;
          const d = `M ${HUB.x} ${HUB.y} Q ${mx} ${my} ${p.x} ${p.y}`;
          return (
            <path
              key={i}
              d={d}
              mask={`url(#link-${i})`}
              stroke={C.ink}
              strokeWidth={3.2}
              strokeLinecap="round"
              strokeDasharray="0.1 12"
              strokeDashoffset={dashFlow}
              fill="none"
            />
          );
        })}
      </svg>

      {order.filter((i) => pos[i].depth < 0.5).map(renderCreator)}
      {/* little twinkles on the orbit */}
      {[0.1, 0.35, 0.62, 0.86].map((k, i) => {
        const a = (k * 360 + 45 + (frame / DUR) * 360) * (Math.PI / 180);
        const tw = (loopSin(frame, DUR, 4, i * 2) + 1) / 2;
        return (
          <Sparkle
            key={i}
            size={16}
            color={[C.mint, C.sky, C.lavender, C.pink][i]}
            stroke={C.ink}
            style={{
              position: "absolute",
              left: CX + Math.cos(a) * RX - 8,
              top: CY + Math.sin(a) * RY - 8,
              scale: String(0.6 + 0.5 * tw),
            }}
          />
        );
      })}

      <MascotAt
        src={POSE.stand}
        x={FEET.x}
        y={FEET.y}
        width={MW}
        bob={(h.lift + loopSin(frame, DUR, 3) * 3) / (MW / 264)}
        squash={h.squash}
        happy={happy}
        mouthScale={happy ? 1.25 : 1}
        lookX={lx}
        lookY={ly}
        blink={blinkAt(frame, [20, 104, 166])}
        headTilt={loopSin(frame, DUR, 2, 0.5) * 2.5}
        flameWiggle={loopSin(frame, DUR, 8) * 6}
      />
      {order.filter((i) => pos[i].depth >= 0.5).map(renderCreator)}
    </AbsoluteFill>
  );
};
