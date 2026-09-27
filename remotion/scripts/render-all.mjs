// Render every composition to sparkee-web/assets/video/<name>.mp4 (+ <name>.jpg poster).
// Usage:
//   node scripts/render-all.mjs                 # all compositions → ../assets/video
//   node scripts/render-all.mjs SvcPaid CtaWave # only these
//   OUT=/tmp/x CRF=22 node scripts/render-all.mjs
import { spawnSync } from "node:child_process";
import { mkdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = process.env.OUT ?? path.resolve(root, "../assets/video");
const crf = process.env.CRF ?? "20";

// id → file name, poster frame, crf override (bigger canvases get a slightly higher crf)
const JOBS = [
  { id: "SvcSprava", name: "svc-sprava", poster: 118 },
  { id: "SvcContent", name: "svc-content", poster: 36 },
  { id: "SvcInfluencer", name: "svc-influencer", poster: 64 },
  { id: "SvcPaid", name: "svc-paid", poster: 136 },
  { id: "Showreel", name: "showreel", poster: 212 },
  { id: "CtaWave", name: "cta-wave", poster: 50 },
];

const only = process.argv.slice(2);
mkdirSync(out, { recursive: true });

const run = (args) => {
  const r = spawnSync("npx", ["remotion", ...args], { cwd: root, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

for (const job of JOBS.filter((j) => !only.length || only.includes(j.id))) {
  const mp4 = path.join(out, `${job.name}.mp4`);
  const jpg = path.join(out, `${job.name}.jpg`);
  run([
    "render",
    job.id,
    mp4,
    "--codec=h264",
    `--crf=${job.crf ?? crf}`,
    "--pixel-format=yuv420p",
    "--color-space=bt709",
    "--x264-preset=slow",
    "--concurrency=50%",
  ]);
  run(["still", job.id, jpg, `--frame=${job.poster}`, "--image-format=jpeg", "--jpeg-quality=82"]);
  const kb = (f) => `${Math.round(statSync(f).size / 1024)} kB`;
  console.log(`✓ ${job.name}: ${kb(mp4)} mp4, ${kb(jpg)} jpg`);
}
