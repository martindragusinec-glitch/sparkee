import React from "react";
import { evolvePath } from "@remotion/paths";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { MascotAt, preloadMascots } from "../mascot/Mascot";
import { C, POSE, jakarta, nunito } from "../lib/theme";
import { blinkAt, clamp, czNum, ease, loopSin } from "../lib/motion";
import { DotBg, SparkleBurst, hop } from "../lib/ui";

preloadMascots([POSE.stand]);

/**
 * SvcPaid — "Podpora dosahu" (paid social, framed as reach support).
 * The mascot stands on a small holo platform, reach rings pulse outward and light up little
 * "people" dots, while the follower counter ticks 1 204 → 12 480 with a sparkline.
 * 800×600, 6 s, seamless loop (rings are periodic, the counter rolls over like a ticker).
 */
export const PAID_DUR = 180;
const DUR = PAID_DUR;

const PLAT = { cx: 560, cy: 486, rx: 116, ry: 27, th: 22 };
const MW = 188;
const FEET = { x: 582, y: 484 };
const RING_C = { x: 560, y: 336 };
const RING_EVERY = 45; // 4 rings per loop
const RING_LIFE = 135;
const R0 = 70;
const R1 = 440;

const COUNT = { t0: 16, t1: 126, from: 1204, to: 12480 };
const RESET = { t0: 150, t1: 170 };

const DOTS = [
  { a: -150, r: 170 },
  { a: -35, r: 190 },
  { a: 200, r: 250 },
  { a: -80, r: 235 },
  { a: 20, r: 215 },
  { a: -120, r: 300 },
  { a: -10, r: 320 },
  { a: 160, r: 340 },
  { a: -60, r: 370 },
  { a: 45, r: 290 },
];
const DOT_COLORS = [C.mint, C.sky, C.lavender, C.pink];

const mod = (n: number, m: number) => ((n % m) + m) % m;
const ringR = (age: number) => R0 + (R1 - R0) * Easing.bezier(0.22, 0.6, 0.35, 1)(Math.min(1, age / RING_LIFE));

export const SvcPaid: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 4 rings, each on a 180-frame cycle (visible for RING_LIFE) → seamless
  const rings = [0, 1, 2, 3].map((k) => {
    const age = mod(frame - k * RING_EVERY, DUR);
    return { age, r: ringR(age), o: interpolate(age, [0, 10, RING_LIFE * 0.75, RING_LIFE], [0, 0.9, 0.25, 0], clamp) };
  });

  // counter
  const v = interpolate(frame, [COUNT.t0, COUNT.t1], [COUNT.from, COUNT.to], {
    ...clamp,
    easing: Easing.bezier(0.45, 0, 0.2, 1),
  });
  const roll = interpolate(frame, [RESET.t0, RESET.t1], [0, 1], { ...clamp, easing: ease });
  const spark = interpolate(frame, [COUNT.t0, COUNT.t1], [0, 1], { ...clamp, easing: Easing.bezier(0.45, 0, 0.2, 1) });
  const done = spring({ frame: frame - COUNT.t1, fps, config: { damping: 10, stiffness: 190, mass: 0.7 } });
  const doneOut = interpolate(frame, [RESET.t0, RESET.t0 + 8], [0, 1], clamp);

  const h = hop(frame, COUNT.t1 + 2, COUNT.t1 + 16, 0, 0, 34);
  const happy = frame >= COUNT.t1 && frame < 162;
  const counting = frame >= COUNT.t0 - 6 && frame < COUNT.t1;

  const sparkD = "M 8 70 C 40 66 52 58 76 56 C 100 54 108 40 132 38 C 156 36 168 22 196 16 C 214 12 226 8 236 6";
  const ev = evolvePath(spark * (1 - doneOut), sparkD);

  return (
    <AbsoluteFill style={{ fontFamily: jakarta, color: C.ink }}>
      <DotBg />

      {/* reach rings */}
      <svg width={800} height={600} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="paid-holo" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={C.mint} />
            <stop offset="0.34" stopColor={C.sky} />
            <stop offset="0.68" stopColor={C.lavender} />
            <stop offset="1" stopColor={C.pink} />
          </linearGradient>
          <radialGradient id="paid-glow">
            <stop offset="0" stopColor="#EDE2FB" stopOpacity="1" />
            <stop offset="0.6" stopColor="#DDF1FC" stopOpacity="0.6" />
            <stop offset="1" stopColor="#F6F4EF" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={RING_C.x} cy={RING_C.y} r={200 + loopSin(frame, DUR, 4) * 6} fill="url(#paid-glow)" />
        {rings.map((g, k) => (
          <circle
            key={k}
            cx={RING_C.x}
            cy={RING_C.y}
            r={g.r}
            fill="none"
            stroke="url(#paid-holo)"
            strokeWidth={interpolate(g.age, [0, RING_LIFE], [9, 2.5], clamp)}
            opacity={g.o}
          />
        ))}
        {rings.map((g, k) => (
          <circle
            key={`i${k}`}
            cx={RING_C.x}
            cy={RING_C.y}
            r={g.r}
            fill="none"
            stroke={C.ink}
            strokeWidth={1.4}
            strokeDasharray="2 10"
            strokeLinecap="round"
            opacity={g.o * 0.35}
          />
        ))}
      </svg>

      {/* reached people */}
      {DOTS.map((d, i) => {
        // pops whenever a ring front passes its radius
        let pop = 0;
        rings.forEach((g) => {
          const tHit = (() => {
            // find age where ringR(age) ≈ d.r (monotonic) by sampling
            for (let a = 0; a <= RING_LIFE; a += 1) if (ringR(a) >= d.r) return a;
            return RING_LIFE;
          })();
          const since = g.age - tHit;
          if (g.age <= RING_LIFE && since >= 0 && since < 40) {
            pop = Math.max(pop, spring({ frame: since, fps, config: { damping: 9, stiffness: 200, mass: 0.6 } }) * interpolate(since, [26, 40], [1, 0], clamp));
          }
        });
        const a = (d.a * Math.PI) / 180;
        const x = RING_C.x + Math.cos(a) * d.r;
        const y = RING_C.y + Math.sin(a) * d.r;
        if (pop <= 0.01 || x < -20 || x > 820 || y < -20 || y > 620) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - 13,
              top: y - 13,
              width: 26,
              height: 26,
              borderRadius: 99,
              background: DOT_COLORS[i % 4],
              border: `2.5px solid ${C.ink}`,
              boxSizing: "border-box",
              scale: String(pop),
              overflow: "hidden",
            }}
          >
            <svg viewBox="0 0 100 100" width={21} height={21}>
              <circle cx="50" cy="40" r="17" fill="#fff" />
              <path d="M18 96 C20 70 34 62 50 62 C66 62 80 70 82 96Z" fill="#fff" />
            </svg>
          </div>
        );
      })}

      {/* platform */}
      <svg width={800} height={600} style={{ position: "absolute", inset: 0 }}>
        <ellipse cx={PLAT.cx + 6} cy={PLAT.cy + PLAT.th + 6} rx={PLAT.rx} ry={PLAT.ry} fill={C.ink} />
        <path
          d={`M ${PLAT.cx - PLAT.rx} ${PLAT.cy} L ${PLAT.cx - PLAT.rx} ${PLAT.cy + PLAT.th} A ${PLAT.rx} ${PLAT.ry} 0 0 0 ${PLAT.cx + PLAT.rx} ${PLAT.cy + PLAT.th} L ${PLAT.cx + PLAT.rx} ${PLAT.cy} Z`}
          fill="#fff"
          stroke={C.ink}
          strokeWidth={3}
          strokeLinejoin="round"
        />
        <ellipse cx={PLAT.cx} cy={PLAT.cy} rx={PLAT.rx} ry={PLAT.ry} fill="url(#paid-holo)" stroke={C.ink} strokeWidth={3} />
        <ellipse cx={PLAT.cx - 30} cy={PLAT.cy - 8} rx={46} ry={7} fill="#fff" opacity={0.55} />
      </svg>

      <SparkleBurst frame={frame} start={COUNT.t1 + 4} x={560} y={300} radius={120} rays={10} stars={6} strokeWidth={4} />

      <MascotAt
        src={POSE.stand}
        x={FEET.x}
        y={FEET.y}
        width={MW}
        bob={h.lift / (MW / 264)}
        squash={h.inAir || h.squash !== 1 ? h.squash : 1 + loopSin(frame, DUR, 3) * 0.012}
        happy={happy}
        mouthScale={happy ? 1.25 : 1}
        lookX={counting ? -9 : 0}
        lookY={counting ? -2 : 0}
        blink={blinkAt(frame, [8, 100, 170])}
        headTilt={loopSin(frame, DUR, 2, 0.3) * 2}
        flameWiggle={loopSin(frame, DUR, 8) * 6}
      />

      {/* counter card */}
      <div
        style={{
          position: "absolute",
          left: 44,
          top: 176,
          width: 292,
          padding: "22px 24px 18px",
          background: C.white,
          border: `3px solid ${C.ink}`,
          borderRadius: 26,
          boxShadow: `6px 6px 0 ${C.ink}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700, fontSize: 18, color: "#5A5F6E" }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 99,
              border: `2.5px solid ${C.ink}`,
              background: "linear-gradient(115deg,#A5EDC5,#9AD8F8,#C49CF2,#F5B8DC)",
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg viewBox="0 0 24 24" width={16} height={16}>
              <circle cx="10" cy="8" r="4" fill={C.ink} />
              <path d="M3 21 C3 15.5 6 13 10 13 C14 13 17 15.5 17 21Z" fill={C.ink} />
              <path d="M19 6 V12 M16 9 H22" stroke={C.ink} strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </div>
          Sledující
          <div
            style={{
              marginLeft: "auto",
              padding: "3px 10px",
              borderRadius: 99,
              background: C.mint,
              border: `2px solid ${C.ink}`,
              color: C.ink,
              fontFamily: nunito,
              fontWeight: 900,
              fontSize: 15,
              scale: String(Math.max(0, done * (1 - doneOut))),
              transformOrigin: "100% 50%",
            }}
          >
            ▲ 10×
          </div>
        </div>
        <div style={{ position: "relative", height: 68, marginTop: 8, overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              fontFamily: nunito,
              fontWeight: 900,
              fontSize: 58,
              lineHeight: "68px",
              letterSpacing: -1,
              fontVariantNumeric: "tabular-nums",
              translate: `0 ${-70 * roll}px`,
            }}
          >
            {czNum(frame >= RESET.t0 ? COUNT.to : v)}
          </div>
          {roll > 0 ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                fontFamily: nunito,
                fontWeight: 900,
                fontSize: 58,
                lineHeight: "68px",
                letterSpacing: -1,
                fontVariantNumeric: "tabular-nums",
                translate: `0 ${70 * (1 - roll)}px`,
              }}
            >
              {czNum(COUNT.from)}
            </div>
          ) : null}
        </div>
        <svg width={244} height={78} viewBox="0 0 244 78" style={{ display: "block", marginTop: 6, overflow: "visible" }}>
          <path d="M 8 74 H 236" stroke="rgba(44,48,60,.12)" strokeWidth={2} strokeDasharray="3 7" strokeLinecap="round" />
          <path
            d={sparkD}
            fill="none"
            stroke="url(#paid-holo)"
            strokeWidth={7}
            strokeLinecap="round"
            strokeDasharray={ev.strokeDasharray}
            strokeDashoffset={ev.strokeDashoffset}
          />
          <path
            d={sparkD}
            fill="none"
            stroke={C.ink}
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray={ev.strokeDasharray}
            strokeDashoffset={ev.strokeDashoffset}
            opacity={0.9}
            transform="translate(0 0)"
          />
        </svg>
        <div style={{ fontWeight: 600, fontSize: 15, color: "#5A5F6E", marginTop: 6 }}>s podporou dosahu</div>
      </div>
    </AbsoluteFill>
  );
};
