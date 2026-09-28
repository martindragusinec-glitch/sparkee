import React from "react";
import { evolvePath } from "@remotion/paths";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { MascotAt, preloadMascots } from "../mascot/Mascot";
import { C, POSE, nunito } from "../lib/theme";
import { blinkAt, clamp, ease, loopSin } from "../lib/motion";
import { DotBg, SparkleBurst, hop } from "../lib/ui";
import { Phone } from "../lib/Phone";
import { Heart, Sparkle } from "../lib/shapes";

preloadMascots([POSE.stand]);

/**
 * SvcContent — "Tvorba obsahu".
 * The mascot leans toward a floating phone playing a Reel (latte art): REC dot, progress bar,
 * a camera flash with sparkle twice per loop, hearts floating up.
 * 800×600, 6 s, seamless loop (particles use modular time).
 */
export const CONTENT_DUR = 180;
const DUR = CONTENT_DUR;

const MW = 262;
const FEET = { x: 226, y: 548 };
const PAW: [number, number] = [578, 362]; // right paw in stand.svg viewBox (measured on an earlier body; re-check)
const PHONE = { x: 398, y: 116, w: 216, h: 432, rot: 7 };
const FLASHES = [46, 130];

const mod = (n: number, m: number) => ((n % m) + m) % m;

/** Paw position in composition px for a given lean (deg, clockwise, around the feet). */
const pawAt = (lean: number, lift: number) => {
  const s = MW / 264;
  const rx = (PAW[0] - 530) * s;
  const ry = (PAW[1] - 455) * s;
  const a = (lean * Math.PI) / 180;
  return { x: FEET.x + rx * Math.cos(a) - ry * Math.sin(a), y: FEET.y + lift + rx * Math.sin(a) + ry * Math.cos(a) };
};

const ReelScreen: React.FC<{ frame: number; w: number; h: number }> = ({ frame, w, h }) => {
  const zoom = 1.04 + loopSin(frame, DUR, 1) * 0.03;
  const steam = (i: number) => {
    const t = mod(frame + i * 20, 60) / 60;
    const d = `M ${-18 + i * 18} 0 C ${-28 + i * 18} -18 ${-8 + i * 18} -30 ${-18 + i * 18} -48`;
    const ev = evolvePath(interpolate(t, [0, 0.6], [0, 1], clamp), d);
    return (
      <path
        key={i}
        d={d}
        fill="none"
        stroke="#fff"
        strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={ev.strokeDasharray}
        strokeDashoffset={ev.strokeDashoffset}
        opacity={interpolate(t, [0, 0.15, 0.7, 1], [0, 0.95, 0.9, 0])}
        transform={`translate(0 ${-t * 14})`}
      />
    );
  };
  return (
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(165deg,#FCE6F2 0%,#F5B8DC 48%,#C49CF2 100%)" }}>
      {/* the "video" */}
      <div style={{ position: "absolute", inset: 0, scale: String(zoom) }}>
        <div
          style={{
            position: "absolute",
            left: -40,
            top: 40 + loopSin(frame, DUR, 1, 1) * 10,
            width: 190,
            height: 190,
            borderRadius: 999,
            background: "radial-gradient(circle, rgba(165,237,197,.9), rgba(165,237,197,0) 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: h * 0.34,
            background: "linear-gradient(180deg,#FFF7FB,#F3E6FA)",
            borderTop: `3px solid ${C.ink}`,
          }}
        />
        <svg viewBox="-100 -120 200 200" width={w} height={w} style={{ position: "absolute", left: 0, top: h * 0.3 }}>
          {[0, 1, 2].map(steam)}
          {/* saucer */}
          <ellipse cx="0" cy="62" rx="74" ry="16" fill="#fff" stroke={C.ink} strokeWidth="4" />
          {/* cup */}
          <path d="M-52 6 C-50 56 -28 70 0 70 C28 70 50 56 52 6Z" fill="#fff" stroke={C.ink} strokeWidth="4.5" strokeLinejoin="round" />
          <path d="M50 18 C74 14 76 44 48 44" fill="none" stroke={C.ink} strokeWidth="4.5" strokeLinecap="round" />
          <ellipse cx="0" cy="6" rx="52" ry="13" fill="#E9CBA8" stroke={C.ink} strokeWidth="4.5" />
          {/* latte art heart */}
          <path d="M0 14 C-10 8 -16 4 -16 -1 C-16 -5 -12 -7 -8 -6 C-5 -6 -2 -4 0 -1 C2 -4 5 -6 8 -6 C12 -7 16 -5 16 -1 C16 4 10 8 0 14Z" fill="#fff" />
        </svg>
      </div>
      {/* progress */}
      <div style={{ position: "absolute", left: 12, right: 12, top: 34, height: 4, borderRadius: 4, background: "rgba(255,255,255,.45)" }}>
        <div style={{ width: `${(frame / DUR) * 100}%`, height: "100%", borderRadius: 4, background: "#fff" }} />
      </div>
      {/* REC */}
      <div
        style={{
          position: "absolute",
          left: 12,
          top: 46,
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 9px 4px 7px",
          borderRadius: 99,
          background: "rgba(44,48,60,.72)",
          color: "#fff",
          fontFamily: nunito,
          fontWeight: 800,
          fontSize: 11,
          letterSpacing: 0.8,
        }}
      >
        <div
          style={{
            width: 9,
            height: 9,
            borderRadius: 9,
            background: "#FF5C6C",
            opacity: 0.35 + 0.65 * ((loopSin(frame, DUR, 6) + 1) / 2),
            boxShadow: "0 0 0 3px rgba(255,92,108,.25)",
          }}
        />
        REC
      </div>
      {/* side actions */}
      <div style={{ position: "absolute", right: 10, bottom: 176, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        {[
          { d: "M12 21 C5 16 2 12.5 2 8.5 C2 5.5 4.5 3.2 7.3 3.2 C9.2 3.2 10.9 4.2 12 5.8 C13.1 4.2 14.8 3.2 16.7 3.2 C19.5 3.2 22 5.5 22 8.5 C22 12.5 19 16 12 21Z", n: "2,4k" },
          { d: "M4 5 H20 A2 2 0 0 1 22 7 V15 A2 2 0 0 1 20 17 H10 L5 21 V17 H4 A2 2 0 0 1 2 15 V7 A2 2 0 0 1 4 5Z", n: "128" },
          { d: "M3 12 L21 4 L14 21 L11 13Z", n: "" },
        ].map((ic, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", color: "#fff" }}>
            <svg width={26} height={26} viewBox="0 0 24 24">
              <path d={ic.d} fill={i === 0 ? "#fff" : "none"} stroke="#fff" strokeWidth={2.2} strokeLinejoin="round" />
            </svg>
            {ic.n ? <div style={{ fontFamily: nunito, fontWeight: 800, fontSize: 10, marginTop: 1 }}>{ic.n}</div> : null}
          </div>
        ))}
      </div>
      {/* caption */}
      <div style={{ position: "absolute", left: 12, bottom: 16, right: 50, color: C.ink, fontFamily: nunito }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: 12 }}>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 20,
              border: `2px solid ${C.ink}`,
              background: "linear-gradient(115deg,#A5EDC5,#9AD8F8,#C49CF2,#F5B8DC)",
            }}
          />
          @sparkee
        </div>
        <div style={{ fontWeight: 600, fontSize: 11.5, marginTop: 5 }}>Latte art za 15 sekund ✨</div>
      </div>
      {/* flash */}
      {FLASHES.map((f) => (
        <div
          key={f}
          style={{
            position: "absolute",
            inset: 0,
            background: "#fff",
            opacity: interpolate(frame, [f, f + 2, f + 12], [0, 0.92, 0], clamp),
          }}
        />
      ))}
    </div>
  );
};

export const SvcContent: React.FC = () => {
  const frame = useCurrentFrame();

  // small excited hops right after each flash
  const hops = FLASHES.map((f) => hop(frame, f + 4, f + 16, 0, 0, 22));
  const active = hops.find((h) => frame >= 0 && (h.inAir || h.squash !== 1));
  const lift = active ? active.lift : 0;
  const squash = active ? active.squash : 1 + loopSin(frame, DUR, 3) * 0.012;

  // "presenting" lean with two emphasis pulses toward the phone
  const pulse = (t: number) => interpolate(frame, [t, t + 6, t + 22], [0, 1, 0], { ...clamp, easing: ease });
  const lean = 7 + 2.5 * (pulse(14) + pulse(96)) + loopSin(frame, DUR, 2) * 0.8;
  const happy = FLASHES.some((f) => frame >= f + 2 && frame < f + 34);
  const paw = pawAt(lean, lift);

  const floatY = loopSin(frame, DUR, 2) * 7;
  const phoneRot = PHONE.rot + loopSin(frame, DUR, 1, 0.8) * 1.2;

  // hearts float up from the phone's like button
  const hearts = new Array(6).fill(0).map((_, i) => {
    const life = 80;
    const t = mod(frame - i * 30, DUR);
    if (t > life) return null;
    const p = t / life;
    const x = 618 + Math.sin(p * Math.PI * 2 + i) * 14 + p * (18 + (i % 3) * 16);
    const y = 420 - p * 300;
    const sc = interpolate(p, [0, 0.12, 0.8, 1], [0.2, 1, 0.9, 0.6]);
    const colors = [C.pink, C.lavender, C.mint, C.sky];
    return (
      <Heart
        key={i}
        size={22 + (i % 3) * 8}
        color={colors[i % colors.length]}
        style={{
          position: "absolute",
          left: x,
          top: y,
          scale: String(sc),
          rotate: `${Math.sin(p * 6 + i) * 14}deg`,
          opacity: interpolate(p, [0, 0.1, 0.75, 1], [0, 1, 1, 0]),
        }}
      />
    );
  });

  // pointer emphasis strokes from the paw toward the phone (@remotion/paths)
  const strokes = [14, 96].map((t) =>
    [-38, -8, 22].map((deg, i) => {
      const a = (deg * Math.PI) / 180;
      const x0 = paw.x + Math.cos(a) * 26;
      const y0 = paw.y + Math.sin(a) * 26;
      const x1 = paw.x + Math.cos(a) * 50;
      const y1 = paw.y + Math.sin(a) * 50;
      const d = `M ${x0} ${y0} L ${x1} ${y1}`;
      const draw = interpolate(frame, [t + i * 1.5, t + 7 + i * 1.5], [0, 1], { ...clamp, easing: ease });
      const out = interpolate(frame, [t + 12, t + 20], [1, 0], clamp);
      if (draw <= 0 || out <= 0) return null;
      const ev = evolvePath(draw, d);
      return (
        <path
          key={`${t}-${i}`}
          d={d}
          stroke={C.ink}
          strokeWidth={4.5}
          strokeLinecap="round"
          strokeDasharray={ev.strokeDasharray}
          strokeDashoffset={ev.strokeDashoffset}
          opacity={out}
        />
      );
    }),
  );

  return (
    <AbsoluteFill style={{ fontFamily: nunito, color: C.ink }}>
      <DotBg />
      {/* soft holo halo behind the phone */}
      <div
        style={{
          position: "absolute",
          left: 348,
          top: 118,
          width: 380,
          height: 420,
          borderRadius: 999,
          background: "radial-gradient(closest-side, rgba(196,156,242,.35), rgba(154,216,248,.18) 60%, rgba(246,244,239,0))",
        }}
      />

      <Phone
        w={PHONE.w}
        h={PHONE.h}
        style={{ left: PHONE.x, top: PHONE.y + floatY, rotate: `${phoneRot}deg` }}
      >
        <ReelScreen frame={frame} w={PHONE.w - 18} h={PHONE.h - 18} />
      </Phone>

      {/* flash sparkles at the phone's top-right corner */}
      {FLASHES.map((f) => {
        const p = interpolate(frame, [f, f + 6, f + 22], [0, 1.15, 0], { ...clamp, easing: ease });
        if (p <= 0) return null;
        return (
          <React.Fragment key={f}>
            <Sparkle
              size={70}
              color="#fff"
              stroke={C.ink}
              style={{ position: "absolute", left: 566, top: 86 + floatY, scale: String(p), rotate: `${(frame - f) * 4}deg` }}
            />
            <Sparkle
              size={30}
              color={C.mint}
              stroke={C.ink}
              style={{ position: "absolute", left: 640, top: 160 + floatY, scale: String(p * 0.9), rotate: `${-(frame - f) * 5}deg` }}
            />
          </React.Fragment>
        );
      })}
      {FLASHES.map((f) => (
        <SparkleBurst key={`b${f}`} frame={frame} start={f + 1} x={606} y={128 + floatY} radius={70} rays={8} stars={3} strokeWidth={3.5} />
      ))}

      {hearts}

      <svg width={800} height={600} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {strokes}
      </svg>

      <MascotAt
        src={POSE.stand}
        x={FEET.x}
        y={FEET.y}
        width={MW}
        bob={lift / (MW / 264)}
        squash={squash}
        lean={lean}
        happy={happy}
        mouthScale={happy ? 1.3 : 1}
        lookX={7}
        lookY={-3}
        blink={blinkAt(frame, [24, 150])}
        headTilt={loopSin(frame, DUR, 1, 0.4) * 2}
        flameWiggle={loopSin(frame, DUR, 8) * 6}
      />

      <div
        style={{
          position: "absolute",
          left: 44,
          top: 40,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 16px 8px 12px",
          borderRadius: 99,
          border: `2.5px solid ${C.ink}`,
          background: C.white,
          boxShadow: `4px 4px 0 ${C.ink}`,
          fontFamily: nunito,
          fontWeight: 900,
          fontSize: 19,
        }}
      >
        <Sparkle size={16} color={C.lavender} stroke={C.ink} /> Reels · foto · video
      </div>
    </AbsoluteFill>
  );
};
