// Sparkee ✦ Instagram launch kit: HTML šablony → headless Chrome → PNG (1 CSS px = 1 px, deviceScaleFactor 1).
//
// Použití (odkudkoli, server ani internet kromě Google Fonts nejsou potřeba):
//   node social/instagram/_src/build.mjs                 všechno (rig snímky, 3 profilovky, highlighty + jejich stories, feed, stories, náhledy)
//   node social/instagram/_src/build.mjs --only p04,hl   jen joby, jejichž id začíná p04 nebo hl (hl = covery highlightů, hs = stories highlightů, s = launch stories)
//   node social/instagram/_src/build.mjs --no-preview    bez _preview/ (mockup profilu, kontaktní listy)
//   node social/instagram/_src/build.mjs --no-rig        nepřegenerovat zmrazené snímky rigu (_src/rig/*.svg)
//
// Soubory:
//   content.mjs   všechny texty (grafika, popisky, hashtagy, alt texty), jediné místo pro úpravy copy
//   kit.html/.css/.js   šablony a layouty (render(id) → plátno přesně w×h)
//   rig.html      zmrazí živý rig (assets/js/mascot.js, set(akce, t)) do statického SVG → _src/rig/
//   preview.html  mockup profilu (_preview/profile-grid.png), test profilovky, průvodce stories, listy carouselů
// Web (assets/, index.html) se jen čte. Jeden Chrome, po doběhnutí se vždy zabije.
// Build skončí chybou, když popisek, alt text nebo bio obsahuje [DOPLNIT] nebo bio přesáhne 150 znaků.
// Kontroly obrysu maskota (hrany karet, okraj plátna, texty) vypisuje jako upozornění na konci.
import { spawn, spawnSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const SRC = path.dirname(fileURLToPath(import.meta.url));
const IG = path.resolve(SRC, '..');                 // social/instagram
const ROOT = path.resolve(IG, '../..');             // sparkee-web
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const only = arg('only') ? arg('only').split(',') : null;
const withPreview = !argv.includes('--no-preview') && !only;
const withRig = !argv.includes('--no-rig');

const { POSTS, STORIES, PROFILE, RIG_FRAMES } = await import(path.join(SRC, 'content.mjs'));

/* 0) texty k vložení nesmí obsahovat [DOPLNIT] (otevřené body patří do PLAN.md, kap. 11) */
{
  const bad = [];
  const scan = (where, t) => { if (t && /DOPLNIT/i.test(t)) bad.push(`${where}: ${String(t).slice(0, 80)}`); };
  for (const p of POSTS) { scan(`${p.id} popisek`, p.caption); scan(`${p.id} hashtagy`, p.hashtags); p.slides.forEach((x, i) => scan(`${p.id} alt ${i + 1}`, x.alt)); }
  for (const x of STORIES) for (const k of ['title', 'text', 'note', 'kicker']) scan(`${x.id} ${k}`, x[k]);
  scan('bio', PROFILE.bio.join('\n'));
  if (bad.length) { console.error('Chyba: [DOPLNIT] v textech k vložení:\n  ' + bad.join('\n  ')); process.exit(1); }
  const bio = PROFILE.bio.join('\n');
  if ([...bio].length > 150) { console.error(`Chyba: bio má ${[...bio].length} znaků (max 150)`); process.exit(1); }
}

/* ---------- mini statický server (kořen sparkee-web) ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const f = path.join(ROOT, u.endsWith('/') ? u + 'index.html' : u);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('404'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;

/* ---------- Chrome přes DevTools protokol ---------- */
const WS = globalThis.WebSocket || createRequire(import.meta.url)(path.join(ROOT, 'remotion/node_modules/ws'));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sparkee-ig-'));
const port = 9500 + Math.floor(Math.random() * 300);
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-color-profile=srgb',
  '--font-render-hinting=none', '--no-first-run', '--no-default-browser-check', `--remote-debugging-port=${port}`,
  `--user-data-dir=${tmp}/prof`, '--window-size=1080,1920', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws, id = 0; const pend = new Map();
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const withTimeout = (p, ms, what) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout: ' + what)), ms))]);
const evalJS = async expr => {
  const r = await withTimeout(send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }), 90000, expr.slice(0, 80));
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails));
  return r.result.value;
};
async function open(url, ready) {
  await send('Page.navigate', { url });
  await evalJS(`new Promise((r, j) => { const t0 = Date.now(); const w = () => (document.readyState === 'complete' && (${ready})) ? r(1) : Date.now() - t0 > 60000 ? j(new Error('stránka nenaběhla')) : setTimeout(w, 50); w(); })`);
}
async function shot(file, w, h) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  await evalJS('new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))');
  const s = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: w, height: h, scale: 1 } });
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from(s.data, 'base64'));
}
const rel = f => path.relative(IG, f);
const written = [];
const warnings = [];

try {
  for (let i = 0; i < 80 && !ws; i++) {
    try {
      const l = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const p = l.find(x => x.type === 'page');
      if (p) {
        ws = new WS(p.webSocketDebuggerUrl);
        await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
      }
    } catch { ws = null; }
    if (!ws) await sleep(250);
  }
  if (!ws) throw new Error('Chrome se nespustil');
  ws.onmessage = ev => { const d = JSON.parse(typeof ev.data === 'string' ? ev.data : ev.data.toString()); if (d.id && pend.has(d.id)) { const p = pend.get(d.id); pend.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); } };
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });

  /* 1) zmrazené snímky živého rigu → _src/rig/<akce>-<t>.svg */
  if (withRig) {
    await open(`${BASE}/social/instagram/_src/rig.html`, 'window.freeze');
    fs.mkdirSync(path.join(SRC, 'rig'), { recursive: true });
    for (const fr of RIG_FRAMES) {
      const [a, t] = fr.split('@');
      const svg = await evalJS(`freeze(${JSON.stringify(a)}, ${+t})`);
      const f = path.join(SRC, 'rig', `${a}-${t}.svg`);
      fs.writeFileSync(f, svg);
      console.log(`  rig ${a}@${t} → ${rel(f)}`);
    }
  }

  /* 2) kit: avatar, highlighty, feed, stories */
  await open(`${BASE}/social/instagram/_src/kit.html`, 'window.KIT && window.KIT.ready');
  const jobs = (await evalJS('KIT.jobs()')).filter(j => !only || only.some(o => j.id.startsWith(o)));
  for (const j of jobs) {
    await send('Emulation.setDeviceMetricsOverride', { width: j.w, height: j.h, deviceScaleFactor: 1, mobile: false });
    let rep;
    for (let attempt = 1; ; attempt++) {         // Google Fonts se občas načtou pozdě: počkat a zkusit znovu
      rep = await evalJS(`KIT.render(${JSON.stringify(j.id)})`);
      const f = rep.fonts;
      if (f.baloo && f.nunito && f.real) break;
      if (attempt >= 4) throw new Error(`${j.id}: fonty se nenačetly ${JSON.stringify(f)}`);
      await sleep(1500 * attempt);
    }
    for (const w of rep.warn || []) { warnings.push(`${j.id}: ${w}`); }
    const out = path.join(IG, j.out);
    await shot(out, j.w, j.h);
    written.push(out);
    console.log(`  ${j.id.padEnd(16)} ${rel(out)}  ${j.w}×${j.h}${rep.warn?.length ? '  ! ' + rep.warn.join('; ') : ''}`);
  }

  /* 3) popisky a alt texty ke každému postu (+ README u Reels: které soubory jsou finální) */
  for (const p of POSTS) {
    if (only && !only.some(o => p.id.startsWith(o))) continue;
    const dir = path.join(IG, 'feed', p.dir);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'caption.txt'), `${p.caption.trim()}\n\n${p.hashtags.trim()}\n`);
    const alt = p.slides.map((s, i) => p.slides.length > 1 ? `${String(i + 1).padStart(2, '0')}: ${s.alt}` : s.alt).join('\n');
    fs.writeFileSync(path.join(dir, 'alt.txt'), p.kind === 'reel' ? `Jen pro FB a TikTok (IG u Reels pole pro alt text nemá):\n\n${alt}\n` : `${alt}\n`);
    if (p.readme) fs.writeFileSync(path.join(dir, 'README.txt'), `${p.readme.trim()}\n`);
    console.log(`  ${p.id} caption.txt + alt.txt${p.readme ? ' + README.txt' : ''}`);
  }

  /* 3b) návod ke stories a highlightům (data z content.mjs) */
  if (!only) {
    const KIND = { question: 'otázka', poll: 'anketa', quiz: 'kvíz', link: 'odkaz', share: 'sdílený Reel P1' };
    const stk = x => {
      const k = x.sticker; if (!k) return [];
      const opts = k.options ? ` (${k.options.map((o, i) => (k.right === i ? '✓ ' : '') + o).join(' / ')})` : '';
      return [`  Sticker: ${KIND[k.kind]}${k.text ? ` „${k.text}“` : ''}${opts}, plocha x ${k.x} až ${k.x + k.w}, y ${k.y} až ${k.y + k.h}.`, k.url ? `  Odkaz: ${k.url}` : null];
    };
    const launch = STORIES.filter(x => x.set !== 'highlight');
    const st = launch.map(x => [`${x.file} · ${x.when}${x.hl ? ` · highlight ${x.hl}` : ''}`, ...stk(x),
      ...(x.how ? ['  Postup:', ...x.how.map((h, i) => `    ${i + 1}. ${h}`)] : [])].filter(Boolean).join('\n')).join('\n\n');
    fs.writeFileSync(path.join(IG, 'stories', 'stories.txt'),
      `Sparkee ✦ launch stories, 1080×1920 PNG. Nativní sticker se přidá v aplikaci do připravené plochy.\n` +
      `Ve PNG je v ploše jen měkká záře bez rámečku, obrys plochy a nákres stickeru je v _preview/stories-guide.png.\n` +
      `S1 je statická verze, živá 5s smyčka maskota může přijít jako MP4 ze stejného rigu.\n\n${st}\n`);
    const hs = STORIES.filter(x => x.set === 'highlight');
    const hl = PROFILE.highlights.map((h, i) => {
      const pre = hs.filter(x => x.hl === h.label);
      const later = launch.filter(x => x.hl === h.label);
      return [`${i + 1}. ${h.label}  →  cover ${h.id}.png`,
        ...pre.map(x => [`   Den −2: stories/${x.file}`, ...stk(x).map(l => l && '   ' + l)].filter(Boolean).join('\n')),
        ...later.map(x => `   později: ../stories/${x.file} (${x.when})`)].join('\n');
    }).join('\n\n');
    fs.writeFileSync(path.join(IG, 'highlights', 'highlights.txt'),
      `Highlighty ✦ pořadí zleva. Cover 1080×1920, IG ořízne střed do kruhu.\n` +
      `Highlight se na profilu ukáže, jen když obsahuje aspoň 1 story. Proto stálý obsah jde ven předem:\n\n` +
      `Den −2 (ne 4. 10.), profil zatím nikdo nesleduje:\n` +
      `  1. Nahraj jako běžné stories všech ${hs.length} snímků ze složky highlights/stories/ v pořadí níže (odkazy přidej nativním stickerem do plochy se září).\n` +
      `  2. Ulož je do highlightů (Ahoj ✦, Služby, Ceník, Kontakt, Tipy) a nastav covery.\n` +
      `  3. Zkontroluj profil: všech 5 highlightů je vidět. Launch stories se přidají později podle stories/stories.txt.\n\n${hl}\n`);
    console.log('  stories/stories.txt + highlights/highlights.txt');
  }

  /* 4) náhledy: mockup profilu, test profilovky, průvodce stories, listy carouselů */
  if (withPreview) {
    await open(`${BASE}/social/instagram/_src/preview.html`, 'window.PREVIEW && window.PREVIEW.ready');
    const views = await evalJS('PREVIEW.views()');
    for (const v of views) {
      await send('Emulation.setDeviceMetricsOverride', { width: v.w, height: v.h, deviceScaleFactor: 1, mobile: false });
      const size = await evalJS(`PREVIEW.render(${JSON.stringify(v.id)})`);
      const out = path.join(IG, '_preview', v.id + '.png');
      await shot(out, size.w, size.h);
      written.push(out);
      console.log(`  náhled ${rel(out)}  ${size.w}×${size.h}`);
    }
  }
} finally {
  try { ws && ws.close(); } catch {}
  chrome.kill('SIGKILL');
  server.close();
  await sleep(300);
  fs.rmSync(tmp, { recursive: true, force: true });
}

/* bezeztrátová optimalizace PNG (Pillow optimize), bez redukce barev: IG si obrázek stejně překomprimuje */
const PY_OPT = `
import sys, os
from PIL import Image
for f in sys.argv[1:]:
    im = Image.open(f); im.load()
    (im.convert('RGB') if im.mode == 'RGBA' and im.getchannel('A').getextrema()[0] == 255 else im).save(f, optimize=True)
`;
if (written.length) {
  const r = spawnSync('python3', ['-c', PY_OPT, ...written], { encoding: 'utf8' });
  if (r.status !== 0) console.warn('  optimalizace přeskočena (python3 + Pillow)');
}
if (warnings.length) { console.warn(`\n${warnings.length} upozornění:`); warnings.forEach(w => console.warn('  ! ' + w)); }
console.log(`hotovo: ${written.length} PNG`);
