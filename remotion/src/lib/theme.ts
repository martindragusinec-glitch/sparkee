import { loadFont as loadNunito } from "@remotion/google-fonts/Nunito";
import { loadFont as loadJakarta } from "@remotion/google-fonts/PlusJakartaSans";

export const nunito = loadNunito("normal", { weights: ["800", "900"], subsets: ["latin", "latin-ext"] }).fontFamily;
export const jakarta = loadJakarta("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin", "latin-ext"] })
  .fontFamily;

export const C = {
  ink: "#2C303C",
  paper: "#F6F4EF",
  white: "#FFFFFF",
  mint: "#A5EDC5",
  sky: "#9AD8F8",
  lavender: "#C49CF2",
  pink: "#F5B8DC",
  muted: "#8A8E99",
  line: "#E6E2DA",
};

export const HOLO = `linear-gradient(115deg, ${C.mint} 0%, ${C.sky} 35%, ${C.lavender} 70%, ${C.pink} 100%)`;
export const GRADS = [
  HOLO,
  `linear-gradient(135deg, ${C.mint}, ${C.sky})`,
  `linear-gradient(135deg, ${C.lavender}, ${C.pink})`,
  `linear-gradient(135deg, ${C.sky}, ${C.lavender})`,
  `linear-gradient(135deg, ${C.pink}, ${C.mint})`,
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
