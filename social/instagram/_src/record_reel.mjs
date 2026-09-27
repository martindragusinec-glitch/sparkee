// Sparkee IG Reel: nahrávání seekovatelné stránky _src/reel.html do MP4 (snímek po snímku přes Chrome DevTools → ffmpeg).
// Adaptace tools/record_story.mjs. Nejvýš jeden headless Chrome, po skončení se vždy zabije.
//
// Použití (z kořene sparkee-web, server na :8770 musí běžet: node tools/serve.js):
//   node social/instagram/_src/record_reel.mjs            → reel/sparkee-reel.mp4 (1080×1920, 30 fps, H.264 yuv420p bt709, bez zvuku)
//                                                           (jediné finální video P1, viz feed/01_reel-ahoj/README)
//   node social/instagram/_src/record_reel.mjs --check    → ReelCheck(): logo × rig jen v záblesku, logo jen na světlém, holo text jen na tmě,
//                                                           text v zónách IG (nadpisy i text ve světě: čipy, pilulky, štítek, DM, popisky),
//                                                           překryvy, maskot × text, čitelnost ≥ 1,2 s (exit 1 při chybě)
//   Video i cover se píšou nejdřív do dočasného souboru vedle cíle (*.part.*) a teprve po úspěchu se přejmenují,
//   takže rozpracované nebo spadlé nahrávání nikdy nepřepíše hotové MP4.
//   node social/instagram/_src/record_reel.mjs --sheet    → _preview/reel-contact-sheet.png (snímek z MP4 každou 1 s + poslední)
//   node social/instagram/_src/record_reel.mjs --cover    → reel/cover.png = kopie jediného coveru feed/01_reel-ahoj/cover.png (IG kit)
//                                                           + reel/caption.txt = kopie feed/01_reel-ahoj/caption.txt
//   node social/instagram/_src/record_reel.mjs --shots 0,0.5,1.2 --dir /tmp/x   → PNG snímky v zadaných časech (rychlá kontrola)
//   node social/instagram/_src/record_reel.mjs --eval "JSON.stringify(ReelDebug())"   → vyhodnotí výraz po načtení
// Volby: --fps 30  --dur (jinak window.ReelDur ze stránky)  --crf 14  --out <soubor>  --url <adresa stránky>  --from 0 --to <DUR>
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const HERE = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.resolve(HERE, '../../..');                       // sparkee-web
const IG = path.resolve(HERE, '..');                                // social/instagram
const WebSocket = require(path.join(ROOT, 'remotion/node_modules/ws'));
const FFMPEG = '/Users/martinwork/Downloads/lp-tracking-standard/lions-liga-voiceover/node_modules/@remotion/compositor-darwin-arm64/ffmpeg';
const FFENV = { ...process.env, DYLD_LIBRARY_PATH: path.dirname(FFMPEG) };
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const flag = k => process.argv.includes('--' + k);
const W = 1080, H = 1920;
const FPS = +arg('fps', 30), CRF = arg('crf', '14');
const URL0 = arg('url', 'http://localhost:8770/social/instagram/_src/reel.html');
const cover = flag('cover'), check = flag('check'), sheet = flag('sheet'), shots = arg('shots', ''), evalExpr = arg('eval', '');
const MP4 = path.join(IG, 'reel/sparkee-reel.mp4');
const KIT_COVER = path.join(IG, 'feed/01_reel-ahoj/cover.png');
const OUT = path.resolve(arg('out', cover ? path.join(IG, 'reel/cover.png') : sheet ? path.join(IG, '_preview/reel-contact-sheet.png') : MP4));

const sleep = ms => new Promise(r => setTimeout(r, ms));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sparkee-reel-'));
let chrome = null;
const kill = () => { try { chrome && chrome.kill('SIGKILL'); } catch {} };
process.on('SIGINT', () => { kill(); process.exit(130); });
process.on('SIGTERM', () => { kill(); process.exit(143); });

/* ---------- Chrome (líně, jen když je potřeba; když spadne nebo ho někdo zabije, pozná to a spustí nový) ---------- */
let ws = null, id = 0, dead = true; const pend = new Map(); const logs = [];
const failAll = err => { for (const [, p] of pend) p.rej(err); pend.clear(); };
const send = (method, params = {}) => new Promise((res, rej) => {
  if (dead || !ws || ws.readyState !== 1) return rej(new Error('Chrome neběží'));
  const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params }));
});
const withTimeout = (p, ms, what) => {                               // časovač se po doběhnutí uklidí (jinak drží node naživu)
  let tm; const to = new Promise((_, rej) => { tm = setTimeout(() => rej(new Error('timeout: ' + what)), ms); });
  return Promise.race([p, to]).finally(() => clearTimeout(tm));
};
const evalJS = async (expr, ms = 60000) => {
  const r = await withTimeout(send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }), ms, expr.slice(0, 60));
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 1200));
  return r.result.value;
};
async function closeChrome() {
  dead = true;
  try { ws && ws.terminate(); } catch {}
  ws = null;
  failAll(new Error('Chrome zavřen'));
  if (chrome) {
    const c = chrome; chrome = null;
    try { c.kill('SIGKILL'); } catch {}
    await new Promise(r => { if (c.exitCode !== null || c.signalCode) r(); else { c.once('exit', r); setTimeout(r, 3000); } });
  }
}
async function openChrome(w = W, h = H) {
  await closeChrome();
  const port = 9800 + Math.floor(Math.random() * 180);
  const c = chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-color-profile=srgb', '--mute-audio',
    `--remote-debugging-port=${port}`, `--user-data-dir=${tmp}/prof${Date.now()}`, `--window-size=${w},${h}`, 'about:blank'], { stdio: 'ignore' });
  c.once('exit', () => { if (chrome === c) { dead = true; failAll(new Error('Chrome skončil')); } });
  let t = null;
  for (let i = 0; i < 120 && !t && chrome === c && c.exitCode === null && !c.signalCode; i++) {
    try { const l = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); t = l.find(x => x.type === 'page'); } catch {}
    if (!t) await sleep(250);
  }
  if (!t) throw new Error('Chrome se nespustil');
  const sock = ws = new WebSocket(t.webSocketDebuggerUrl, { perMessageDeflate: false, maxPayload: 256 * 1024 * 1024 });
  await withTimeout(new Promise((r, j) => { sock.once('open', r); sock.once('error', j); }), 20000, 'websocket');
  dead = false;
  sock.on('close', () => { if (ws === sock) { dead = true; failAll(new Error('DevTools spojení zavřeno')); } });
  sock.on('message', m => {
    const d = JSON.parse(m);
    if (d.id && pend.has(d.id)) { const p = pend.get(d.id); pend.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); }
    if (d.method === 'Runtime.exceptionThrown') logs.push(JSON.stringify(d.params.exceptionDetails).slice(0, 600));
    if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') logs.push(d.params.args.map(a => a.value || a.description).join(' '));
  });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
}
async function openReel() {
  await openChrome();
  await send('Page.navigate', { url: URL0 });
  try {
    await evalJS(`new Promise((r, j) => { const t0 = Date.now(); const w = () => window.ReelReady ? r(1) : Date.now() - t0 > 60000 ? j(new Error('ReelReady timeout')) : setTimeout(w, 100); w(); })`, 90000);
  } catch (e) { console.error(logs.join('\n')); throw e; }
  const fontsOk = await evalJS(`document.fonts.check('800 100px "Baloo 2"', 'ěščřžýáíéůúťďň') && document.fonts.check('700 40px Nunito', 'ěščřžýáíéůú')`);
  if (!fontsOk) console.warn('POZOR: fonty Baloo 2 / Nunito nejsou načtené (je internet?)');
  if (logs.length) console.warn('konzole:', logs.join('\n'));
  return +arg('dur', await evalJS('window.ReelDur'));
}
/* opakuj krok s novým Chrome, když ten starý zmizí (stránka je deterministická, snímky vyjdou stejně) */
async function retry(fn, what, tries = 5) {
  for (let a = 1; ; a++) {
    try { return await fn(); } catch (e) {
      if (a >= tries) throw e;
      console.warn(`${what}: ${e.message} → nový Chrome (pokus ${a + 1}/${tries})`);
      await closeChrome(); await sleep(1500);
    }
  }
}
const frameAt = async tt => {
  await evalJS(`(async () => { ReelSeek(${tt}); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); return 1; })()`);
  const shot = await withTimeout(send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: W, height: H, scale: 1 } }), 60000, 'screenshot');
  return Buffer.from(shot.data, 'base64');
};
const ff = (args, what) => {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', ...args], { env: FFENV, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`ffmpeg ${what}: ${r.stderr.slice(-600)}`);
};

try {
  if (cover) {
    /* jeden cover pro P1: design IG kitu (feed/01_reel-ahoj/cover.png, sedí na mřížku profilu) */
    if (!fs.existsSync(KIT_COVER)) throw new Error('chybí ' + KIT_COVER + ' (nejdřív build IG kitu)');
    const part = OUT.replace(/(\.[a-z0-9]+)$/i, '.part$1');
    fs.copyFileSync(KIT_COVER, part); fs.renameSync(part, OUT);
    console.log('cover (kopie z IG kitu):', OUT);
    const KIT_CAP = path.join(IG, 'feed/01_reel-ahoj/caption.txt'), CAP = path.join(IG, 'reel/caption.txt');
    if (fs.existsSync(KIT_CAP)) { const cp = CAP + '.part'; fs.copyFileSync(KIT_CAP, cp); fs.renameSync(cp, CAP); console.log('popisek (kopie z IG kitu):', CAP); }
  } else if (sheet) {
    /* kontaktní arch: snímek z hotového MP4 každou 1 s + poslední snímek smyčky */
    const src = path.resolve(arg('in', MP4));
    const pr = spawnSync(path.join(path.dirname(FFMPEG), 'ffprobe'), ['-v', 'error', '-select_streams', 'v:0', '-count_packets', '-show_entries', 'stream=nb_read_packets,r_frame_rate', '-of', 'csv=p=0', src], { env: FFENV, encoding: 'utf8' });
    const [rate, nb] = pr.stdout.trim().split(',');
    const fps = eval(rate), frames = +nb, dur = frames / fps;
    const times = []; for (let s = 0; s <= dur - 1 / fps + 1e-6; s += 1) times.push(s);
    times.push((frames - 1) / fps);                                    // poslední snímek smyčky
    const TW = 324, TH = 576, COLS = 5, G = 24, HEAD = 96, LAB = 44;
    const imgs = times.map((s, i) => {
      const f = path.join(tmp, `s${i}.png`);
      ff(['-ss', Math.max(0, s - (i === times.length - 1 ? .4 / fps : 0)).toFixed(4), '-i', src, '-frames:v', '1', '-vf', `scale=${TW}:${TH}:flags=lanczos:in_color_matrix=bt709:in_range=tv`, '-y', f], 'sheet frame');
      return 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
    });
    const rows = Math.ceil(times.length / COLS), SW = COLS * TW + (COLS + 1) * G, SH = HEAD + rows * (TH + LAB) + G;
    await openChrome(SW, SH);
    const fmt = s => s.toFixed(s % 1 ? 2 : 0).replace('.', ',');
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>
      body{margin:0;background:#1C1E25;color:#F5F4FB;font:700 22px/1 -apple-system,system-ui,sans-serif;width:${SW}px;height:${SH}px;overflow:hidden}
      h1{position:absolute;left:${G}px;top:30px;margin:0;font:800 34px/1 -apple-system,system-ui,sans-serif}
      h1 small{font-weight:600;font-size:22px;opacity:.6;margin-left:16px}
      .c{position:absolute;width:${TW}px}.c b{display:block;height:${LAB}px;line-height:${LAB - 8}px;opacity:.8}
      .c img{display:block;width:${TW}px;height:${TH}px;border-radius:10px}</style></head><body>
      <h1>Sparkee Reel P1 · kontaktní arch<small>${path.basename(src)} · ${frames} snímků · ${fmt(Math.round(dur * 100) / 100)} s · snímek každou 1 s + poslední (smyčka)</small></h1>
      ${times.map((s, i) => `<div class="c" style="left:${G + (i % COLS) * (TW + G)}px;top:${HEAD + Math.floor(i / COLS) * (TH + LAB)}px"><b>${i === times.length - 1 ? `${fmt(Math.round(s * 1000) / 1000)} s · poslední snímek` : `${fmt(s)} s`}</b><img src="${imgs[i]}"></div>`).join('')}
      </body></html>`;
    await send('Page.navigate', { url: 'about:blank' });
    await evalJS(`(async () => { document.open(); document.write(${JSON.stringify(html)}); document.close(); await Promise.all([...document.images].map(i => i.decode())); return 1; })()`, 120000);
    const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: SW, height: SH, scale: 1 } });
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, Buffer.from(shot.data, 'base64'));
    console.log('arch:', OUT, `${SW}×${SH}`, times.length, 'snímků');
  } else {
    const DUR = await retry(openReel, 'start');
    const reopen = async () => { if (dead) await openReel(); };
    if (evalExpr) {
      console.log(await retry(async () => { await reopen(); return evalJS(evalExpr, 600000); }, 'eval'));
    } else if (check) {
      const res = await retry(async () => { await reopen(); return evalJS(`JSON.stringify(ReelCheck(${+arg('step', 1 / FPS)}))`, 1800000); }, 'check');
      const r = JSON.parse(res);
      console.log(JSON.stringify({ dur: r.dur, frames: r.frames, P0: r.P0, PH: r.PH, stats: r.stats }, null, 1));
      console.log(r.problems.length ? 'PROBLÉMY:\n  ' + r.problems.join('\n  ') : 'OK: žádné problémy');
      process.exitCode = r.problems.length ? 1 : 0;
    } else if (shots) {
      const dir = path.resolve(arg('dir', path.join(tmp, 'shots')));
      fs.mkdirSync(dir, { recursive: true });
      const list = shots === 'all' ? Array.from({ length: Math.round(DUR * 2) + 1 }, (_, i) => i / 2) : shots.split(',').map(Number);
      for (const tt of list) {
        const f = path.join(dir, `t${tt.toFixed(2).padStart(5, '0')}.png`);
        const buf = await retry(async () => { await reopen(); return frameAt(Math.min(tt, DUR - 1 / FPS)); }, `snímek ${tt}`);
        fs.writeFileSync(f, buf);
      }
      console.log('snímky:', dir);
    } else {
      const from = +arg('from', 0), to = +arg('to', DUR);
      const N = Math.round((to - from) * FPS);
      fs.mkdirSync(path.dirname(OUT), { recursive: true });
      const PART = OUT.replace(/\.mp4$/i, '') + '.part.mp4';           // dočasný soubor, přejmenuje se až po úspěchu
      // RGB → yuv420p přes matici bt709 (ne výchozí 601), tv rozsah, značky bt709; aq-mode 3 drží tmavé přechody bez pruhů
      const enc = spawn(FFMPEG, ['-y', '-f', 'image2pipe', '-c:v', 'png', '-framerate', String(FPS), '-i', '-',
        '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', CRF, '-profile:v', 'high',
        '-x264-params', 'aq-mode=3:colorprim=bt709:transfer=bt709:colormatrix=bt709', '-r', String(FPS), '-movflags', '+faststart', '-an',
        '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv', PART],
        { stdio: ['pipe', 'ignore', 'pipe'], env: FFENV });
      let ffErr = ''; enc.stderr.on('data', d => ffErr += d);
      const t0 = Date.now();
      for (let f = 0; f < N; f++) {
        const buf = await retry(async () => { await reopen(); return frameAt(from + f / FPS); }, `snímek ${f}`);
        if (!enc.stdin.write(buf)) await new Promise(r => enc.stdin.once('drain', r));
        if (f % 60 === 0) console.log(`snímek ${f}/${N}  (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
      }
      enc.stdin.end();
      const code = await new Promise(r => enc.on('close', r));
      if (code !== 0) { try { fs.rmSync(PART, { force: true }); } catch {} throw new Error('ffmpeg: ' + ffErr.slice(-800)); }
      fs.renameSync(PART, OUT);
      console.log('hotovo:', OUT, (fs.statSync(OUT).size / 1e6).toFixed(2) + ' MB', `${((Date.now() - t0) / 1000).toFixed(0)} s`);
    }
  }
} catch (e) {
  console.error(e.stack || e.message);
  process.exitCode = 1;
} finally {
  await closeChrome();
  try { fs.rmSync(tmp, { recursive: true, force: true, maxRetries: 8, retryDelay: 250 }); } catch {}
  process.exit(process.exitCode || 0);
}
