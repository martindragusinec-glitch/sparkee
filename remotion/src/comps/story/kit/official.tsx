import React, { useLayoutEffect, useReducer } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import type { Theme } from "./LogoRig";

/**
 * The official logo file itself (logo.svg / logo-dark.svg from the publicDir), mounted inline so it is
 * rasterised through exactly the same path as the parts: drop it inside a <LogoStage> (same logo units).
 * An <img> at 1.4 px/u would be a fractional 795.2 × 408.8 px box that Chrome resamples; inline it is not.
 */
const FILES: Record<Theme, string> = { light: "logo.svg", dark: "logo-dark.svg" };
const cache = new Map<string, string>();
const pending = new Map<string, Promise<string>>();

const load = (file: string) => {
  if (!pending.has(file)) {
    pending.set(
      file,
      fetch(staticFile(file))
        .then((r) => {
          if (!r.ok) throw new Error(`OfficialLogo: cannot load ${file} (${r.status})`);
          return r.text();
        })
        .then((text) => {
          const root = new DOMParser().parseFromString(text, "image/svg+xml").documentElement;
          // namespace every id and its references, so the file can share a stage with the parts
          let inner = root.innerHTML;
          const ids = Array.from(inner.matchAll(/\sid="([^"]+)"/g)).map((m) => m[1]);
          ids.forEach((id) => {
            const esc = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            inner = inner
              .replace(new RegExp(`\\sid="${esc}"`, "g"), ` id="off-${id}"`)
              .replace(new RegExp(`url\\(#${esc}\\)`, "g"), `url(#off-${id})`)
              .replace(new RegExp(`href="#${esc}"`, "g"), `href="#off-${id}"`);
          });
          cache.set(file, inner);
          return inner;
        }),
    );
  }
  return pending.get(file)!;
};

export const OfficialLogo: React.FC<{ theme: Theme }> = ({ theme }) => {
  const file = FILES[theme];
  const [, bump] = useReducer((x: number) => x + 1, 0);
  useLayoutEffect(() => {
    if (cache.has(file)) return;
    const h = delayRender(`Loading ${file}`);
    load(file)
      .then(() => {
        bump();
        continueRender(h);
      })
      .catch((e) => {
        console.error(e);
        continueRender(h);
      });
  }, [file]);
  const markup = cache.get(file);
  // the files' root <svg> carries fill="none": keep that inheritance
  return markup ? <g fill="none" dangerouslySetInnerHTML={{ __html: markup }} /> : null;
};
