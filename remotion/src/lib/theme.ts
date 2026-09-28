import { loadFont as loadBaloo } from "@remotion/google-fonts/Baloo2";
import { loadFont as loadNunito } from "@remotion/google-fonts/Nunito";

/**
 * Brand type (same as the website, assets/css/site.css --f-display / --f-body):
 *   Baloo 2  headlines, weights 700–800
 *   Nunito   text, weights 500–900
 * Both load the latin-ext subset, so Czech diacritics (ř ě ů á í ý) never fall back.
 * Baloo 2 has no ✦ glyph: always draw the sparkle as a vector (sparkle.svg / <Sparkle>).
 */
export const baloo = loadBaloo("normal", { weights: ["700", "800"], subsets: ["latin", "latin-ext"] }).fontFamily;
export const nunito = loadNunito("normal", { weights: ["500", "600", "700", "800", "900"], subsets: ["latin", "latin-ext"] })
  .fontFamily;

/** Official brand colours (site.css tokens). `lavender` / `pink` are older aliases of lilac / blush. */
export const C = {
  ink: "#2C303C",
  ink2: "#242835", // dark field falloff (site.css --ink-2)
  paper: "#F6F4EF",
  mist: "#F5F4FB",
  white: "#FFFFFF",
  mint: "#A5EDC5",
  sky: "#9AD8F8",
  lilac: "#C49CF2",
  blush: "#F5B8DC",
  // deeper pastels for small marks on paper (site.css --*-d)
  mintD: "#6FD6A8",
  skyD: "#6FBCEB",
  lilacD: "#9C7BE0",
  blushD: "#F09BA5",
  lavender: "#C49CF2",
  pink: "#F5B8DC",
  muted: "#8A8E99",
  line: "#E6E2DA",
};

/** Holo surface (site.css --holo). */
export const HOLO = `linear-gradient(115deg, ${C.mint} 0%, ${C.sky} 34%, ${C.lilac} 68%, ${C.blush} 100%)`;
/**
 * Holo text / marker diagonal (site.css --holo-text). Gradient TEXT only on dark, one short accent word;
 * on light the accent is a soft marker bar under the word.
 */
export const HOLO_TEXT = `linear-gradient(135deg, ${C.mint} 0%, ${C.sky} 38%, ${C.lilac} 72%, ${C.blush} 100%)`;
export const GRADS = [
  HOLO,
  `linear-gradient(135deg, ${C.mint}, ${C.sky})`,
  `linear-gradient(135deg, ${C.lilac}, ${C.blush})`,
  `linear-gradient(135deg, ${C.sky}, ${C.lilac})`,
  `linear-gradient(135deg, ${C.blush}, ${C.mint})`,
];

export const cardShadow = "0 1px 0 rgba(44,48,60,.04), 0 10px 30px -12px rgba(44,48,60,.22)";

/**
 * Mascot pose files (relative to sparkee-web/assets/img). All compositions read poses from here,
 * so new pose files only need a one-line change. Poses share head coordinates, see Mascot.tsx.
 */
export const POSE = {
  stand: "poses/stand.svg",
  happy: "poses/happy.svg",
  surprised: "poses/surprised.svg",
  wave: "poses/wave.svg", // bent arm: forearm .m-fore-l rotates at the elbow (its local origin)
  phone: "poses/phone.svg", // holds its own phone (.m-phone)
  phoneWave: "poses/phone-wave.svg",
  sticker: "poses/sticker.svg", // white outline, for dark backgrounds; has .m-fore-l too
  lie: "poses/lie.svg",
  peek: "poses/peek.svg",
};

/** Forearm wave for poses with .m-fore-l (pivot [0,0] = the elbow in the forearm's local space). */
export const foreWave = (deg: number) => ({ ".m-fore-l": { deg, pivot: [0, 0] as [number, number] } });
