import React from "react";
import { C } from "./theme";

/** 4-point sparkle star (brand "✦"). */
export const Sparkle: React.FC<{ size: number; color?: string; style?: React.CSSProperties; stroke?: string }> = ({
  size,
  color = C.ink,
  stroke,
  style,
}) => (
  <svg width={size} height={size} viewBox="-50 -50 100 100" style={{ overflow: "visible", ...style }}>
    <path
      d="M0 -50 C4 -14 14 -4 50 0 C14 4 4 14 0 50 C-4 14 -14 4 -50 0 C-14 -4 -4 -14 0 -50Z"
      fill={color}
      stroke={stroke}
      strokeWidth={stroke ? 6 : 0}
      strokeLinejoin="round"
    />
  </svg>
);

export const Heart: React.FC<{ size: number; color?: string; style?: React.CSSProperties }> = ({
  size,
  color = C.pink,
  style,
}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: "visible", ...style }}>
    <path
      d="M50 88 C20 66 6 50 6 32 C6 18 17 8 30 8 C39 8 46 13 50 20 C54 13 61 8 70 8 C83 8 94 18 94 32 C94 50 80 66 50 88Z"
      fill={color}
      stroke={C.ink}
      strokeWidth={7}
      strokeLinejoin="round"
    />
  </svg>
);

/** Simple person glyph used inside avatar bubbles. */
export const PersonGlyph: React.FC<{ size: number; color?: string }> = ({ size, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <circle cx="50" cy="38" r="17" fill={color} />
    <path d="M18 88 C20 66 34 58 50 58 C66 58 80 66 82 88Z" fill={color} />
  </svg>
);
