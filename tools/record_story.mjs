// Nahraje 20s animaci „Sparkee za 20 vteřin“ do MP4 (snímek po snímku přes Chrome DevTools, pak ffmpeg).
// Použití (z kořene sparkee-web, server na :8770 musí běžet):
//   node tools/record_story.mjs [--w 1920] [--h 1080] [--fps 30] [--out assets/video/sparkee-20s.mp4] [--mobile]
// --mobile = vertikální 4:5 layout (viewport 390 šířky, výstup 1080×1350).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const WebSocket = require(path.join(ROOT, 'remotion/node_modules/ws'));
const FFMPEG = '/Users/martinwork/Downloads/lp-tracking-standard/lions-liga-voiceover/node_modules/@remotion/compositor-darwin-arm64/ffmpeg';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const mobile = process.argv.includes('--mobile');
const FPS = +arg('fps', 30), DUR = +arg('dur', 20);
const OUT_W = +arg('w', mobile ? 1080 : 1920), OUT_H = +arg('h', mobile ? 1350 : 1080);
const OUT = path.resolve(ROOT, arg('out', mobile ? 'assets/video/sparkee-20s-mobile.mp4' : 'assets/video/sparkee-20s.mp4'));
// CSS viewport: mobile layout needs a narrow viewport; desktop 16:9 at 1440 wide
const VW = mobile ? 390 : 1440, VH = mobile ? 900 : 900;

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sparkee-rec-'));
const port = 9400 + Math.floor(Math.random() * 400);
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`,
  `--user-data-dir=${tmp}/prof`, `--window-size=${VW},${VH}`, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function target() {
  for (let i = 0; i < 80; i++) {
    try { const l = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); const p = l.find(x => x.type === 'page'); if (p) return p; } catch {}
    await sleep(250);
  }
  throw new Error('Chrome se nespustil');
}
let ws, id = 0; const pend = new Map();
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const withTimeout = (p, ms, what) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout: ' + what)), ms))]);
const evalJS = async expr => { const r = await withTimeout(send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }), 30000, expr.slice(0, 60)); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails)); return r.result.value; };

try {
  const t = await target();
  ws = new WebSocket(t.webSocketDebuggerUrl, { perMessageDeflate: false, maxPayload: 256 * 1024 * 1024 });
  await new Promise(r => ws.on('open', r));
  ws.on('message', m => { const d = JSON.parse(m); if (d.id && pend.has(d.id)) { const p = pend.get(d.id); pend.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); } });
  console.log('cdp ok'); await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: VW, height: VH, deviceScaleFactor: 1, mobile });
  await send('Page.navigate', { url: 'http://localhost:8770/?story=0#sparkee-20s' });
  await sleep(2500); console.log('navigated');
  await evalJS(`new Promise(r => { const ok = () => window.SparkeeStory && document.fonts.status === 'loaded'; const w = () => ok() ? r(1) : setTimeout(w, 100); w(); })`);
  // izolovat stage: skrýt vše ostatní, stage roztáhnout na celé okno (poměr zachová CSS aspect-ratio)
  const box = await evalJS(`(() => {
    SparkeeStory.pause();
    const st = document.querySelector('[data-st-stage]');
    const card = st.closest('.st__card') || st;
    document.querySelectorAll('.companion, .nav, header.nav').forEach(e => e.style.display = 'none');
    for (const el of [st, card, ...st.querySelectorAll(':scope > *')]) { el.style.borderRadius = '0'; }
    card.style.boxShadow = 'none';
    st.scrollIntoView({ block: 'center' });
    const r = st.getBoundingClientRect();
    const i = 3; // oříznout zaoblené rohy/rámeček karty
    return { x: r.left + scrollX + i, y: r.top + scrollY + i, w: r.width - 2 * i, h: r.height - 2 * i };
  })()`);
  const scale = OUT_W / box.w;
  console.log('stage', box, 'scale', scale.toFixed(3));
  const N = FPS * DUR;
  const ff = spawn(FFMPEG, ['-y', '-f', 'image2pipe', '-c:v', 'png', '-framerate', String(FPS), '-i', '-',
    '-vf', `scale=${OUT_W}:${OUT_H}:flags=lanczos,format=yuv420p`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '18',
    '-movflags', '+faststart', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', OUT],
    { stdio: ['pipe', 'ignore', 'pipe'], env: { ...process.env, DYLD_LIBRARY_PATH: path.dirname(FFMPEG) } });
  let ffErr = ''; ff.stderr.on('data', d => ffErr += d);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  for (let f = 0; f < N; f++) {
    const tt = f / FPS;
    await evalJS(`(async () => { SparkeeStory.seek(${tt}); await new Promise(r => setTimeout(r, 30)); return 1; })()`);
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true,
      clip: { x: box.x, y: box.y, width: box.w, height: box.h, scale } });
    if (!ff.stdin.write(Buffer.from(shot.data, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 60 === 0) console.log(`snímek ${f}/${N}`);
  }
  ff.stdin.end();
  const code = await new Promise(r => ff.on('close', r));
  if (code !== 0) throw new Error('ffmpeg: ' + ffErr.slice(-800));
  console.log('hotovo:', OUT, (fs.statSync(OUT).size / 1e6).toFixed(2) + ' MB');
} finally {
  try { ws && ws.close(); } catch {}
  chrome.kill('SIGKILL');
  fs.rmSync(tmp, { recursive: true, force: true });
}
