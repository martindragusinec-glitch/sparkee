import React from "react";
import { evolvePath } from "@remotion/paths";
import { interpolate, spring } from "remotion";
import { C, jakarta, nunito } from "./theme";
import { Sparkle } from "./shapes";
import { clamp, ease } from "./motion";

/** Subtle dotted paper background. */
export const DotBg: React.FC<{ color?: string; gap?: number; bg?: string; opacity?: number }> = ({
  color = C.ink,
  gap = 26,
  bg = C.paper,
  opacity = 0.07,
}) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      backgroundColor: bg,
      backgroundImage: `radial-gradient(rgba(44,48,60,${opacity}) 1.6px, transparent 1.8px)`,
      backgroundSize: `${gap}px ${gap}px`,
      backgroundPosition: `${gap / 2}px ${gap / 2}px`,
      color,
    }}
  />
);

/**
 * Speech bubble that springs in at `start` and pops out at `end`.
 * (x, y) is the tip of the tail; the bubble sits above-right (or above-left with side="left").
 */
export const SpeechBubble: React.FC<{
  frame: number;
  fps: number;
  start: number;
  end: number;
  x: number;
  y: number;
  text: React.ReactNode;
  size?: number;
  side?: "left" | "right";
  bg?: string;
}> = ({ frame, fps, start, end, x, y, text, size = 30, side = "right", bg = C.white }) => {
  const inP = spring({ frame: frame - start, fps, config: { damping: 11, stiffness: 190, mass: 0.7 } });
  const outP = interpolate(frame, [end, end + 8], [0, 1], { ...clamp, easing: ease });
  const s = inP * (1 - outP);
  if (frame < start || s <= 0.001) return null;
  const border = Math.max(2.5, size / 11);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 0,
        height: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          bottom: size * 0.55,
          [side === "right" ? "left" : "right"]: -size * 0.6,
          transformOrigin: side === "right" ? "0% 100%" : "100% 100%",
          scale: String(s),
          rotate: `${(1 - inP) * (side === "right" ? -14 : 14)}deg`,
          opacity: Math.min(1, s * 1.6),
        }}
      >
        <div
          style={{
            position: "relative",
            padding: `${size * 0.36}px ${size * 0.62}px`,
            background: bg,
            border: `${border}px solid ${C.ink}`,
            borderRadius: size * 0.9,
            boxShadow: `${size * 0.14}px ${size * 0.14}px 0 ${C.ink}`,
            fontFamily: nunito,
            fontWeight: 900,
            fontSize: size,
            lineHeight: 1.1,
            color: C.ink,
            whiteSpace: "nowrap",
          }}
        >
          {text}
          {/* tail */}
          <svg
            width={size * 0.9}
            height={size * 0.75}
            viewBox="0 0 36 30"
            style={{
              position: "absolute",
              bottom: -size * 0.62,
              [side === "right" ? "left" : "right"]: size * 0.34,
              overflow: "visible",
              scale: side === "right" ? "1 1" : "-1 1",
            }}
          >
            <path d="M2 0 L4 28 L26 0" fill={bg} stroke={C.ink} strokeWidth={border * 1.1} strokeLinejoin="round" />
            <rect x="0" y={-border * 1.6} width="30" height={border * 1.7} fill={bg} />
          </svg>
        </div>
      </div>
    </div>
  );
};

/**
 * Radial sparkle burst centred at (x, y): evolving rays (@remotion/paths) + flying ✦ stars.
 */
export const SparkleBurst: React.FC<{
  frame: number;
  start: number;
  x: number;
  y: number;
  radius: number;
  rays?: number;
  stars?: number;
  color?: string;
  starColors?: string[];
  seed?: number;
  strokeWidth?: number;
}> = ({
  frame,
  start,
  x,
  y,
  radius,
  rays = 8,
  stars = 6,
  color = C.ink,
  starColors = [C.mint, C.sky, C.lavender, C.pink],
  seed = 0,
  strokeWidth = 5,
}) => {
  const t = frame - start;
  if (t < 0 || t > 40) return null;
  const size = radius * 2.6;
  const draw = interpolate(t, [0, 12], [0, 1], { ...clamp, easing: ease });
  const erase = interpolate(t, [8, 22], [0, 1], { ...clamp, easing: ease });
  return (
    <svg
      width={size}
      height={size}
      viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}
      style={{ position: "absolute", left: x - size / 2, top: y - size / 2, overflow: "visible", pointerEvents: "none" }}
    >
      {new Array(rays).fill(0).map((_, i) => {
        const a = (i / rays) * Math.PI * 2 + seed;
        const r0 = radius * 0.62;
        const r1 = radius * (i % 2 ? 0.86 : 1);
        const d = `M ${Math.cos(a) * r0} ${Math.sin(a) * r0} L ${Math.cos(a) * r1} ${Math.sin(a) * r1}`;
        const head = evolvePath(draw, d);
        // erase from the inside out by growing the dash offset past the length
        const len = r1 - r0;
        return (
          <path
            key={i}
            d={d}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={head.strokeDasharray}
            strokeDashoffset={Number(head.strokeDashoffset) - erase * len}
            opacity={erase >= 1 ? 0 : 1}
          />
        );
      })}
      {new Array(stars).fill(0).map((_, i) => {
        const a = (i / stars) * Math.PI * 2 + seed + 0.4;
        const p = interpolate(t, [0, 26], [0, 1], { ...clamp, easing: ease });
        const r = radius * (0.55 + 0.75 * p) * (i % 2 ? 0.85 : 1.05);
        const sc = interpolate(t, [0, 7, 20, 32], [0, 1, 0.8, 0], clamp);
        const s = radius * (i % 3 === 0 ? 0.26 : 0.18);
        return (
          <g
            key={`s${i}`}
            transform={`translate(${Math.cos(a) * r} ${Math.sin(a) * r}) rotate(${p * 90}) scale(${sc})`}
          >
            <path
              d={`M0 ${-s} C${s * 0.08} ${-s * 0.28} ${s * 0.28} ${-s * 0.08} ${s} 0 C${s * 0.28} ${s * 0.08} ${s * 0.08} ${s * 0.28} 0 ${s} C${-s * 0.08} ${s * 0.28} ${-s * 0.28} ${s * 0.08} ${-s} 0 C${-s * 0.28} ${-s * 0.08} ${-s * 0.08} ${-s * 0.28} 0 ${-s}Z`}
              fill={starColors[i % starColors.length]}
              stroke={C.ink}
              strokeWidth={s * 0.14}
              strokeLinejoin="round"
            />
          </g>
        );
      })}
    </svg>
  );
};

/** Small static twinkle (✦) that pulses on a loop. */
export const Twinkle: React.FC<{
  frame: number;
  dur: number;
  x: number;
  y: number;
  size: number;
  color?: string;
  phase?: number;
  stroke?: string;
}> = ({ frame, dur, x, y, size, color = C.lavender, phase = 0, stroke }) => {
  const k = (Math.sin((frame / dur) * Math.PI * 2 * 2 + phase) + 1) / 2;
  return (
    <Sparkle
      size={size}
      color={color}
      stroke={stroke}
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        scale: String(0.55 + 0.45 * k),
        rotate: `${k * 20}deg`,
        opacity: 0.5 + 0.5 * k,
      }}
    />
  );
};

/** White sticker card with ink border + hard pop shadow (site style). */
export const cardStyle = (scale = 1): React.CSSProperties => ({
  background: C.white,
  border: `${3 * scale}px solid ${C.ink}`,
  borderRadius: 24 * scale,
  boxShadow: `${5 * scale}px ${5 * scale}px 0 ${C.ink}`,
});

export const labelFont: React.CSSProperties = { fontFamily: jakarta, fontWeight: 700, color: C.ink };
export const headFont: React.CSSProperties = { fontFamily: nunito, fontWeight: 900, color: C.ink };

/**
 * Hop helper: returns x, lift (px, negative up), squash for a hop from x0 to x1
 * taking off at `t0` and landing at `t1`. Includes anticipation and landing squash.
 */
export const hop = (frame: number, t0: number, t1: number, x0: number, x1: number, height: number) => {
  const air = interpolate(frame, [t0, t1], [0, 1], clamp);
  const inAir = frame > t0 && frame < t1;
  const x = x0 + (x1 - x0) * interpolate(air, [0, 1], [0, 1], { easing: (v) => v * v * (3 - 2 * v) });
  const lift = inAir ? -height * 4 * air * (1 - air) : 0;
  // squash: anticipation (3f before take-off), stretch in air, squash on landing (5f)
  const antic = interpolate(frame, [t0 - 4, t0 - 1, t0 + 1], [1, 0.86, 1.1], clamp);
  const stretch = inAir ? interpolate(air, [0, 0.3, 0.7, 1], [1.1, 1.03, 1.02, 1.08]) : 1;
  const land = interpolate(frame, [t1, t1 + 2, t1 + 7], [0.84, 0.9, 1], clamp);
  let squash = 1;
  if (frame <= t0) squash = frame >= t0 - 4 ? antic : 1;
  else if (inAir) squash = stretch;
  else if (frame >= t1 && frame <= t1 + 7) squash = land;
  return { x, lift, squash, air, inAir };
};
