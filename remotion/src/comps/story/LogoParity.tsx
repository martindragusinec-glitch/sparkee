import React from "react";
import { AbsoluteFill, Img, staticFile, type CalculateMetadataFunction } from "remotion";
import { C } from "../../lib/theme";
import { K, LOGO_H, LOGO_W } from "./kit/geometry";
import { LogoRig, type Theme } from "./kit/LogoRig";
import { LogoStage } from "./kit/stage";

/**
 * QA still: the logo rebuilt from the parts (<LogoRig> at rest) or the official file, same size.
 * Render both and diff them (scripts/logo-parity.py). `bg` false = transparent.
 */
export type LogoParityProps = { theme: Theme; mode: "parts" | "official"; pxPerUnit: number; bg: boolean };

export const logoParityMeta: CalculateMetadataFunction<LogoParityProps> = ({ props }) => ({
  width: Math.round(LOGO_W * props.pxPerUnit),
  height: Math.round(LOGO_H * props.pxPerUnit),
});

export const LogoParity: React.FC<LogoParityProps> = ({ theme, mode, pxPerUnit, bg }) => {
  const w = LOGO_W * pxPerUnit;
  const h = LOGO_H * pxPerUnit;
  return (
    <AbsoluteFill style={{ background: bg ? (theme === "dark" ? C.ink : C.paper) : "transparent" }}>
      {mode === "official" ? (
        <Img
          src={staticFile(theme === "dark" ? "logo-dark.svg" : "logo.svg")}
          style={{ position: "absolute", left: 0, top: 0, width: w, height: h }}
        />
      ) : (
        <LogoStage width={Math.round(w)} height={Math.round(h)} ox={0} oy={0} zoom={pxPerUnit / K}>
          <LogoRig theme={theme} />
        </LogoStage>
      )}
    </AbsoluteFill>
  );
};
