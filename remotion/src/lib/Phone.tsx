import React from "react";
import { C } from "./theme";

/** Phone with ink bezel and dynamic island; children render inside the screen (clipped). */
export const Phone: React.FC<{
  w: number;
  h: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  screenBg?: string;
  shadow?: number;
}> = ({ w, h, children, style, screenBg = C.white, shadow = 6 }) => {
  const u = w / 216;
  const bezel = 9 * u;
  return (
    <div
      style={{
        position: "absolute",
        width: w,
        height: h,
        borderRadius: 38 * u,
        background: C.ink,
        boxShadow: `${shadow * u}px ${shadow * u}px 0 rgba(44,48,60,.18)`,
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: bezel,
          top: bezel,
          right: bezel,
          bottom: bezel,
          borderRadius: 30 * u,
          overflow: "hidden",
          background: screenBg,
        }}
      >
        {children}
      </div>
      {/* dynamic island */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: bezel + 7 * u,
          width: 58 * u,
          height: 17 * u,
          translate: "-50% 0",
          borderRadius: 99,
          background: C.ink,
        }}
      />
      {/* side button */}
      <div
        style={{
          position: "absolute",
          right: -3.5 * u,
          top: 110 * u,
          width: 4 * u,
          height: 46 * u,
          borderRadius: 4 * u,
          background: C.ink,
        }}
      />
    </div>
  );
};
