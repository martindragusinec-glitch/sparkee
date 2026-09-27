import React from "react";
import { C, GRADS } from "./theme";

export type PostKind = "play" | "photo" | "carousel" | "text" | "heart";

/** Post thumbnail in brand gradients (4:5), used by the calendar and the feed. */
export const PostThumb: React.FC<{
  kind: PostKind;
  grad: number;
  w: number;
  h: number;
  radius?: number;
  border?: number;
  time?: string;
  day?: string;
}> = ({ kind, grad, w, h, radius = 14, border = 2.5, time, day }) => {
  const u = w / 84; // design unit
  return (
    <div
      style={{
        position: "relative",
        width: w,
        height: h,
        borderRadius: radius,
        border: `${border}px solid ${C.ink}`,
        background: GRADS[grad % GRADS.length],
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* soft sheen */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(120% 70% at 20% 0%, rgba(255,255,255,.55), rgba(255,255,255,0) 60%)",
        }}
      />
      <svg viewBox="0 0 84 105" width={w} height={h} style={{ position: "absolute", left: -border, top: -border }}>
        {kind === "play" ? (
          <g transform="translate(42 50)">
            <circle r="17" fill="#fff" stroke={C.ink} strokeWidth="2.6" />
            <path d="M-5 -8 L9 0 L-5 8Z" fill={C.ink} strokeLinejoin="round" stroke={C.ink} strokeWidth="2" />
          </g>
        ) : null}
        {kind === "photo" ? (
          <g>
            <circle cx="58" cy="34" r="9" fill="#fff" stroke={C.ink} strokeWidth="2.4" />
            <path d="M6 82 L30 52 L44 68 L54 58 L78 82Z" fill="#fff" stroke={C.ink} strokeWidth="2.4" strokeLinejoin="round" />
          </g>
        ) : null}
        {kind === "carousel" ? (
          <g>
            <rect x="26" y="30" width="30" height="36" rx="6" fill="rgba(255,255,255,.55)" stroke={C.ink} strokeWidth="2.2" />
            <rect x="32" y="36" width="30" height="36" rx="6" fill="#fff" stroke={C.ink} strokeWidth="2.4" />
            <circle cx="36" cy="86" r="2.6" fill={C.ink} />
            <circle cx="44" cy="86" r="2.6" fill="#fff" stroke={C.ink} strokeWidth="1.6" />
            <circle cx="52" cy="86" r="2.6" fill="#fff" stroke={C.ink} strokeWidth="1.6" />
          </g>
        ) : null}
        {kind === "text" ? (
          <g>
            <rect x="16" y="34" width="52" height="8" rx="4" fill="#fff" stroke={C.ink} strokeWidth="2" />
            <rect x="16" y="48" width="40" height="8" rx="4" fill="#fff" stroke={C.ink} strokeWidth="2" />
            <rect x="16" y="62" width="46" height="8" rx="4" fill="#fff" stroke={C.ink} strokeWidth="2" />
          </g>
        ) : null}
        {kind === "heart" ? (
          <path
            d="M42 72 C28 62 20 54 20 44 C20 36 26 31 32 31 C37 31 40 34 42 38 C44 34 47 31 52 31 C58 31 64 36 64 44 C64 54 56 62 42 72Z"
            fill="#fff"
            stroke={C.ink}
            strokeWidth="2.6"
            strokeLinejoin="round"
          />
        ) : null}
      </svg>
      {day ? (
        <div
          style={{
            position: "absolute",
            left: 6 * u,
            top: 5 * u,
            fontFamily: "inherit",
            fontWeight: 800,
            fontSize: 12 * u,
            color: C.ink,
          }}
        >
          {day}
        </div>
      ) : null}
      {time ? (
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: 6 * u,
            translate: "-50% 0",
            padding: `${1.5 * u}px ${6 * u}px`,
            borderRadius: 99,
            background: "#fff",
            border: `${1.8 * u}px solid ${C.ink}`,
            fontWeight: 800,
            fontSize: 10.5 * u,
            color: C.ink,
            whiteSpace: "nowrap",
          }}
        >
          {time}
        </div>
      ) : null}
    </div>
  );
};
