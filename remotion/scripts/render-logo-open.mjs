// Render the logo open "Zážeh" (full, 3.5 s) in 3 formats × 2 themes, one render at a time.
//   node scripts/render-logo-open.mjs                      # all six → ../assets/video/logo-open
//   node scripts/render-logo-open.mjs LogoOpen9x16Dark     # only these ids
//   OUT=/tmp/x CRF=18 node scripts/render-logo-open.mjs
// Output: sparkee_zazeh_full_{16x9|9x16|1x1}_{light|dark}.mp4 (H.264, yuv420p, bt709) + .png poster of the last frame.
import { spawnSync } from "node:child_process";
import { mkdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = process.env.OUT ?? path.resolve(root, "../assets/video/logo-open");
const crf = process.env.CRF ?? "16";
const LAST = 104;

const JOBS = ["16x9", "9x16", "1x1"].flatMap((ratio) =>
  ["Light", "Dark"].map((theme) => ({ id: `LogoOpen${ratio}${theme}`, name: `sparkee_zazeh_full_${ratio}_${theme.toLowerCase()}` })),
);

const only = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const run = (args) => {
  const r = spawnSync("npx", ["remotion", ...args], { cwd: root, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

for (const job of JOBS.filter((j) => !only.length || only.includes(j.id))) {
  const mp4 = path.join(out, `${job.name}.mp4`);
  const png = path.join(out, `${job.name}.png`);
  run([
    "render",
    job.id,
    mp4,
    "--codec=h264",
    `--crf=${crf}`,
    "--pixel-format=yuv420p",
    "--color-space=bt709",
    "--image-format=png",
    "--x264-preset=slow",
    "--concurrency=4",
  ]);
  run(["still", job.id, png, `--frame=${LAST}`, "--image-format=png"]);
  const kb = (f) => `${Math.round(statSync(f).size / 1024)} kB`;
  console.log(`✓ ${job.name}: ${kb(mp4)} mp4, ${kb(png)} png`);
}
