import React from "react";
import { C, HOLO_TEXT, nunito } from "../../../lib/theme";

/**
 * The scrub bar: the playhead IS the build clock (p = b / 330). Screen-space UI at y1420, on the lane axis.
 *   track x166–890 (every element stays ≤ x940: IG draws its action icons in the right 120 px column)
 *   6 px ink 10 % track (12 px while the ✦ drags it) · holo fill · 14 px ink playhead (or the ✦ itself)
 *   six ticks on the chapter starts (their flash holds 3 f) · chapter numeral 34 px above the playhead
 *   ◀◀ OSD glyph (100 px, ink) above the bar end while rewinding, pulsing with the tick flashes
 */
export const BAR = { x0: 166, x1: 890, y: 1420, h: 6 };
export const TICKS = [60, 120, 165, 210, 255, 300].map((b) => b / 330);
export const barX = (p: number) => BAR.x0 + (BAR.x1 - BAR.x0) * Math.max(0, Math.min(1, p));
export const barCY = BAR.y + BAR.h / 2;

export type ScrubState = {
  p: number;
  /** 0..1 fade of the whole bar */
  op: number;
  /** track/fill reveal (loop seam): fill runs 0 → p */
  fill?: number;
  /** bar thickness in px (6 at rest, 12 while dragged) */
  h?: number;
  /** playhead extra scale (grab) */
  headScale?: number;
  /** the ✦ has hooked the playhead: the dot hides under it */
  grip?: boolean;
  /** tick flash per tick, 0..1 (held 3 f) */
  tickFlash?: number[];
  /** tick visibility per tick (loop seam: they appear as the playhead passes) */
  tickOp?: number[];
  /** chapter numerals above the playhead ("01"–"06"), rolling */
  label?: { text: string; op: number; dy: number }[];
  /** ◀◀ OSD glyph above the bar end */
  rew?: { op: number; pulse: number };
};

/** ◀◀ as an on-screen-display glyph: two rounded ink triangles, 100 × 56 px */
const Rew: React.FC<{ scale: number }> = ({ scale }) => (
  <svg width={100} height={56} viewBox="0 0 100 56" style={{ display: "block", scale: `${scale}`, transformOrigin: "50% 50%" }}>
    <path
      d="M46 5 L6 28 L46 51 Z M94 5 L54 28 L94 51 Z"
      fill={C.ink}
      stroke={C.ink}
      strokeWidth={8}
      strokeLinejoin="round"
    />
  </svg>
);

export const Scrub: React.FC<{ s: ScrubState }> = ({ s }) => {
  if (s.op <= 0) return null;
  const h = s.h ?? BAR.h;
  const x = barX(s.p);
  const fillX = barX(s.p * (s.fill ?? 1));
  const cy = barCY;
  const hs = s.headScale ?? 1;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: s.op }}>
      {/* track */}
      <div
        style={{
          position: "absolute",
          left: BAR.x0,
          top: cy - h / 2,
          width: BAR.x1 - BAR.x0,
          height: h,
          borderRadius: h / 2,
          background: "rgba(44,48,60,0.10)",
        }}
      />
      {/* holo fill */}
      {fillX > BAR.x0 + 0.5 ? (
        <div
          style={{
            position: "absolute",
            left: BAR.x0,
            top: cy - h / 2,
            width: fillX - BAR.x0,
            height: h,
            borderRadius: h / 2,
            backgroundImage: HOLO_TEXT,
            backgroundSize: `${BAR.x1 - BAR.x0}px ${h}px`,
          }}
        />
      ) : null}
      {/* ticks */}
      {TICKS.map((p, i) => {
        const op = s.tickOp?.[i] ?? 1;
        const fl = s.tickFlash?.[i] ?? 0;
        if (op <= 0) return null;
        const th = h + 8 + 10 * fl;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: barX(p) - 1.5,
              top: cy - th / 2,
              width: 3,
              height: th,
              borderRadius: 1.5,
              background: C.ink,
              opacity: (0.3 + 0.7 * fl) * op,
            }}
          />
        );
      })}
      {/* playhead */}
      {s.grip ? null : (
        <div
          style={{
            position: "absolute",
            left: x - 8,
            top: cy - 8,
            width: 16,
            height: 16,
            borderRadius: 8,
            background: C.ink,
            scale: `${hs}`,
          }}
        />
      )}
      {/* chapter numerals above the playhead */}
      {(s.label ?? []).map((l, i) =>
        l.op > 0 ? (
          <div
            key={`${l.text}-${i}`}
            style={{
              position: "absolute",
              left: x - 50,
              width: 100,
              top: cy - 30 - 36 + l.dy,
              height: 36,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              opacity: l.op,
              fontFamily: nunito,
              fontWeight: 800,
              fontSize: 34,
              lineHeight: 1,
              color: C.ink,
              letterSpacing: "0.02em",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {l.text}
          </div>
        ) : null,
      )}
      {/* ◀◀ OSD */}
      {s.rew && s.rew.op > 0 ? (
        <div style={{ position: "absolute", left: 828, top: cy - 64 - 56, width: 100, height: 56, opacity: s.rew.op }}>
          <Rew scale={1 + 0.12 * s.rew.pulse} />
        </div>
      ) : null}
    </div>
  );
};
