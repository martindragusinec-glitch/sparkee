// Render the Reel "PŘETOČ" (BrandStoryReel) and its covers, one render at a time.
//   node scripts/render-reel.mjs            # mp4 + cover.png + cover-4x5.png → ../social/instagram/reel-znacka
//   OUT=/tmp/x BPM=124 node scripts/render-reel.mjs
// Output: sparkee-reel-znacka.mp4 (H.264, yuv420p, bt709, CRF 16, silent master A), cover.png (1080×1920),
// cover-4x5.png (1080×1350), _preview/cover-blueprint.png (the storyboard's f236 construction cover).
import { spawnSync } from "node:child_process";
import { mkdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = process.env.OUT ?? path.resolve(root, "../social/instagram/reel-znacka");
const bpm = Number(process.env.BPM ?? 120);
mkdirSync(path.join(out, "_preview"), { recursive: true });
const run = (args) => {
  const r = spawnSync("npx", ["remotion", ...args], { cwd: root, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
};
const mp4 = path.join(out, "sparkee-reel-znacka.mp4");
run([
  "render",
  "BrandStoryReel",
  mp4,
  `--props=${JSON.stringify({ bpm, rollFrames: 0 })}`,
  "--codec=h264",
  "--crf=16",
  "--pixel-format=yuv420p",
  "--color-space=bt709",
  "--image-format=png",
  "--x264-preset=slow",
  "--concurrency=4",
]);
run(["still", "BrandStoryReelCover", path.join(out, "cover.png"), "--image-format=png"]);
run(["still", "BrandStoryReelCover4x5", path.join(out, "cover-4x5.png"), "--image-format=png"]);
run(["still", "BrandStoryReelCover", path.join(out, "_preview/cover-blueprint.png"), `--props=${JSON.stringify({ variant: "blueprint" })}`, "--image-format=png"]);
const kb = (f) => `${Math.round(statSync(f).size / 1024)} kB`;
console.log(`✓ ${mp4} ${kb(mp4)}`);
