import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { MascotAt, preloadMascots } from "../mascot/Mascot";
import { C, HOLO, POSE, jakarta, nunito } from "../lib/theme";
import { clamp, ease, loopSin } from "../lib/motion";
import { DotBg, SparkleBurst, hop } from "../lib/ui";
import { PostKind, PostThumb } from "../lib/Post";

preloadMascots([POSE.stand]);

/**
 * SvcSprava — "Správa sociálních sítí".
 * A week of the content calendar fills day by day: the mascot hops from cell to cell and every
 * landing pops a post in. At the end the week gets "published" and the mascot flips back to Monday.
 * 800×600, 6 s, seamless loop (the return hop lands on Monday exactly at the loop point).
 */
export const SPRAVA_DUR = 180;

const CARD = { x: 48, y: 352, w: 704, h: 196 };
const PAD = 22;
const CELL_W = 84;
const CELL_H = 105;
const GAP = 12;
const CELL_TOP = CARD.y + PAD;
const cellLeft = (i: number) => CARD.x + PAD + i * (CELL_W + GAP);
const cellCX = (i: number) => cellLeft(i) + CELL_W / 2;

const LAND = [0, 17, 34, 51, 68, 85, 102]; // landing (= pop) frames per day
const AIR = 12;
const RET = { t0: 150, t1: 180, h: 125 };
const PUB0 = 132; // publish sweep start
const MW = 116; // mascot width
const FEET_DX = 8;

const DAYS = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];
const DATES = ["22", "23", "24", "25", "26", "27", "28"];
const POSTS: { kind: PostKind; grad: number; time: string }[] = [
  { kind: "play", grad: 0, time: "18:00" },
  { kind: "photo", grad: 1, time: "12:30" },
  { kind: "carousel", grad: 2, time: "09:00" },
  { kind: "text", grad: 3, time: "17:15" },
  { kind: "play", grad: 4, time: "19:00" },
  { kind: "heart", grad: 0, time: "10:00" },
  { kind: "photo", grad: 3, time: "20:00" },
];

const mascotState = (f: number) => {
  // returning flip hop (wraps over the loop point: frames 0–7 are its landing squash)
  const fr = f < 10 ? f + SPRAVA_DUR : f;
  if (fr >= RET.t0 - 5) {
    const h = hop(fr, RET.t0, RET.t1, cellCX(6), cellCX(0), RET.h);
    const spin = -360 * interpolate(h.air, [0.08, 0.85], [0, 1], { ...clamp, easing: ease });
    return { ...h, dir: -1, spin };
  }
  for (let i = 1; i < LAND.length; i++) {
    if (f >= LAND[i] - AIR - 5 && f < LAND[i] + 8) {
      return { ...hop(f, LAND[i] - AIR, LAND[i], cellCX(i - 1), cellCX(i), 52), dir: 1, spin: 0 };
    }
  }
  const idx = LAND.filter((l) => f >= l).length - 1;
  return { x: cellCX(Math.max(0, idx)), lift: 0, squash: 1, air: 0, inAir: false, dir: 1, spin: 0 };
};

export const SvcSprava: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const m = mascotState(frame);
  const scale = MW / 264;

  const celebrating = frame >= 103 && frame < 146;
  const rockAmp = interpolate(frame, [106, 112, 136, 146], [0, 6, 6, 0], clamp);
  const rock = Math.sin(((frame - 106) / 20) * Math.PI * 2) * rockAmp;
  const lean = m.inAir && m.dir === 1 ? 7 * Math.sin(Math.PI * m.air) : rock;

  const planned = LAND.filter((l) => frame >= l + 3).length;
  const published = interpolate(frame, [PUB0, PUB0 + 8, 164, 172], [0, 1, 1, 0], { ...clamp, easing: ease });
  const allDone = spring({ frame: frame - (LAND[6] + 3), fps, config: { damping: 9, stiffness: 180 } });

  return (
    <AbsoluteFill style={{ fontFamily: jakarta, color: C.ink }}>
      <DotBg />

      {/* header */}
      <div style={{ position: "absolute", left: 52, top: 52 }}>
        <div style={{ fontFamily: nunito, fontWeight: 900, fontSize: 34, letterSpacing: -0.5 }}>Obsahový plán</div>
        <div style={{ fontWeight: 600, fontSize: 18, color: "#5A5F6E", marginTop: 2 }}>Září · 39. týden</div>
      </div>

      {/* counter pill */}
      <div
        style={{
          position: "absolute",
          right: 52,
          top: 58,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 18px 10px 14px",
          borderRadius: 99,
          border: `2.5px solid ${C.ink}`,
          background: published > 0.5 ? HOLO : C.white,
          boxShadow: `4px 4px 0 ${C.ink}`,
          fontWeight: 700,
          fontSize: 18,
          scale: String(1 + 0.08 * Math.sin(Math.min(1, allDone) * Math.PI) * (frame < PUB0 ? 1 : 0)),
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: 99,
            background: published > 0.5 ? C.white : HOLO,
            border: `2px solid ${C.ink}`,
          }}
        />
        <div style={{ position: "relative", height: 24, width: 190, overflow: "hidden", lineHeight: "24px" }}>
          <div style={{ position: "absolute", inset: 0, translate: `0 ${-26 * published}px` }}>
            Naplánováno{" "}
            <span style={{ fontFamily: nunito, fontWeight: 900 }}>
              {frame >= PUB0 ? 0 : planned}/7
            </span>
          </div>
          <div style={{ position: "absolute", inset: 0, translate: `0 ${26 * (1 - published)}px` }}>
            Publikováno ✓
          </div>
        </div>
      </div>

      {/* calendar card */}
      <div
        style={{
          position: "absolute",
          left: CARD.x,
          top: CARD.y,
          width: CARD.w,
          height: CARD.h,
          background: C.white,
          border: `3px solid ${C.ink}`,
          borderRadius: 28,
          boxShadow: `6px 6px 0 ${C.ink}`,
          boxSizing: "border-box",
        }}
      />
      {DAYS.map((d, i) => {
        const land = LAND[i];
        const pop = spring({ frame: frame - (land + 1), fps, config: { damping: 10, stiffness: 190, mass: 0.7 } });
        const pub = interpolate(frame, [PUB0 + i * 2, PUB0 + i * 2 + 14], [0, 1], { ...clamp, easing: ease });
        const shown = frame >= land + 1 && pub < 1;
        const press = interpolate(frame, [land, land + 2, land + 9], [0, 5, 0], clamp);
        return (
          <React.Fragment key={d}>
            {/* empty slot */}
            <div
              style={{
                position: "absolute",
                left: cellLeft(i),
                top: CELL_TOP + press,
                width: CELL_W,
                height: CELL_H,
                borderRadius: 16,
                border: "2px dashed rgba(44,48,60,.22)",
                background: "#FBFAF7",
                boxSizing: "border-box",
                padding: "6px 8px",
                fontWeight: 700,
                fontSize: 13,
                color: "rgba(44,48,60,.45)",
              }}
            >
              {DATES[i]}
            </div>
            {shown ? (
              <div
                style={{
                  position: "absolute",
                  left: cellLeft(i),
                  top: CELL_TOP + press,
                  scale: String(Math.max(0, pop * (1 - 0.35 * pub))),
                  rotate: `${(1 - pop) * -10}deg`,
                  translate: `0 ${-46 * pub}px`,
                  opacity: 1 - pub,
                  transformOrigin: "50% 100%",
                }}
              >
                <PostThumb {...POSTS[i]} w={CELL_W} h={CELL_H} radius={16} day={DATES[i]} />
              </div>
            ) : null}
            <div
              style={{
                position: "absolute",
                left: cellLeft(i),
                width: CELL_W,
                top: CELL_TOP + CELL_H + 14,
                textAlign: "center",
                fontWeight: 700,
                fontSize: 16,
                color: i >= 5 ? "#9C7BE0" : "#5A5F6E",
              }}
            >
              {d}
            </div>
            <SparkleBurst
              frame={frame}
              start={land + 1}
              x={cellCX(i)}
              y={CELL_TOP + CELL_H * 0.55}
              radius={62}
              rays={8}
              stars={4}
              seed={i}
              strokeWidth={3.5}
            />
          </React.Fragment>
        );
      })}

      {/* celebration burst around the head */}
      <SparkleBurst frame={frame} start={104} x={cellCX(6) - 6} y={CELL_TOP - 118} radius={105} rays={10} stars={6} strokeWidth={4} />

      <MascotAt
        src={POSE.stand}
        x={m.x + FEET_DX}
        y={CELL_TOP + 3}
        width={MW}
        bob={m.lift / scale}
        squash={m.squash}
        spin={m.spin}
        lean={lean}
        happy={celebrating}
        mouthScale={celebrating ? 1.25 : 1}
        lookX={celebrating ? 0 : m.dir * 7}
        lookY={celebrating ? -3 : 0}
        headTilt={m.inAir ? -m.dir * 3 * Math.sin(Math.PI * m.air) : loopSin(frame, SPRAVA_DUR, 2) * 1.5}
        flameWiggle={loopSin(frame, SPRAVA_DUR, 8) * 5 - (m.inAir ? m.dir * 12 * Math.sin(Math.PI * m.air) : 0)}
      />
    </AbsoluteFill>
  );
};
