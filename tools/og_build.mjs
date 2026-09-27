// OG obrázky (1200×630, JPEG) a ikony Sparkee: HTML šablona → headless Chrome → soubory.
// Použití (z kořene sparkee-web, server NENÍ potřeba, fonty se tahají z Google Fonts):
//   node tools/og_build.mjs                   všechno: assets/img/og/*.jpg, ikony v assets/img/icons/, /favicon.ico, logo-light.svg
//   node tools/og_build.mjs --only home,blog  jen vybrané karty (klíč "file" v tools/og/cards.json); ikony se pak NEgenerují
//   node tools/og_build.mjs --no-icons        bez ikon
//   node tools/og_build.mjs --out /tmp/og     jiný výstupní adresář (ikony do /tmp/og/icons)
//   node tools/og_build.mjs --logo badge      původní logo na bílém štítku místo světlé varianty (test)
// Potom vždy `python3 tools/build_pages.py`: přepíše og:image (s ?v=<hash souboru>) v podstránkách a srovná homepage.
// Data karet: tools/og/cards.json (stejný soubor čte tools/build_pages.py pro og:image a alt).
// Šablona: tools/og/template.html (náhled: http://localhost:8770/tools/og/template.html?all).
// Požadavky: Node 22+ (vestavěný WebSocket; se starším Node je potřeba `npm i` v remotion/ kvůli balíčku ws),
//            Chrome, internet (Google Fonts), python3 + Pillow (JPEG 4:4:4 a favicon.ico; bez Pillow JPEG z Chrome 4:2:0).
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const W = 1200, H = 630;
const JPEG_Q = 88;            // kvalita JPEG (4:4:4, bez podvzorkování barev: čisté přechody záře)
const MAX_KB = 300;           // WhatsApp a část klientů zahazují větší náhledy
const MIN_GAP = 24;           // min. odstup nadpisu od maskota v px

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const only = arg('only') ? new Set(arg('only').split(',')) : null;
const OUT = path.resolve(ROOT, arg('out', 'assets/img/og'));
const customOut = argv.includes('--out');
const withIcons = !argv.includes('--no-icons') && !only;
const logo = arg('logo', 'light');

// ikony: [soubor, velikost, pozadí, výška hlavy]; pozadí ink = tmavá se září (jako OG), none = průhledné
const ICON_DIR = customOut ? path.join(OUT, 'icons') : path.join(ROOT, 'assets/img/icons');
const ICONS = [
  ['apple-touch-icon.png', 180, 'ink', '80%'],
  ['icon-192.png', 192, 'ink', '80%'],
  ['icon-512.png', 512, 'ink', '74%'],
  ['favicon-32.png', 32, 'none', '100%'],
];
const FAVICON_ICO = customOut ? path.join(OUT, 'icons/favicon.ico') : path.join(ROOT, 'favicon.ico');

const cardsRaw = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/og/cards.json'), 'utf8'));
const cards = Object.entries(cardsRaw).filter(([k]) => !k.startsWith('_')).map(([, c]) => c)
  .filter(c => !only || only.has(c.file));
if (!cards.length && !withIcons) { console.error('žádná karta neodpovídá --only'); process.exit(1); }
if (only) console.log('  (--only: ikony a favicon.ico se přeskakují)');

// Světlé logo pro tmavé pozadí: odvozené z assets/img/logo.svg. Písmena bílá, maskot si nechává ink obrys
// (jinak by bílé tělo splynulo s písmeny „ar“) a tělo má jemný lila nádech. Tvar loga se nemění.
function buildLightLogo() {
  const INK = '#2C303C';
  const src = fs.readFileSync(path.join(ROOT, 'assets/img/logo.svg'), 'utf8');
  let s = src;
  for (const id of ['Vector_2', 'Vector_3', 'Subtract', 'Letter e1', 'Letter e2', 'Mascot outline + ar']) {
    const re = new RegExp(`(<path id="${id.replace('+', '\\+')}[^"]*"[^>]*?fill=")${INK}(")`);
    if (!re.test(s)) throw new Error('logo-light: v logo.svg chybí cesta ' + id);
    s = s.replace(re, '$1#FFFFFF$2');
  }
  const pathD = start => {
    const m = src.match(new RegExp(`<path[^>]* d="(M${start.replace(/\./g, '\\.')}[^"]*)"`));
    if (!m) throw new Error('logo-light: v logo.svg chybí silueta ' + start);
    return m[1];
  };
  // tělo, dvě končetiny, hlava
  const rim = ['575.59 317.66', '502.7 376.52', '479.41 366.15', '428.27 161.45'].map(pathD)
    .map(d => `<path d="${d}"/>`).join('');
  s = s.replace(/(<path id="Mascot outline \+ ar[^>]*\/>)/,
    `$1\n<g id="light-rim" fill="${INK}" stroke="${INK}" stroke-width="20" stroke-linejoin="round">${rim}</g>`);
  s = s.replace(/(<path d="M575\.59 317\.66[^"]*" fill=")white(")/, '$1#F0EAFB$2');
  s = s.replace('<svg ', '<!-- Generováno z logo.svg: node tools/og_build.mjs (needitovat ručně) -->\n<svg ');
  const out = path.join(ROOT, 'assets/img/logo-light.svg');
  if (!fs.existsSync(out) || fs.readFileSync(out, 'utf8') !== s) { fs.writeFileSync(out, s); console.log('  assets/img/logo-light.svg  (z logo.svg)'); }
}
buildLightLogo();

// WebSocket: Node 22+ ho má vestavěný, jinak ws z remotion/node_modules
const WS = globalThis.WebSocket || createRequire(import.meta.url)(path.join(ROOT, 'remotion/node_modules/ws'));

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sparkee-og-'));
const port = 9800 + Math.floor(Math.random() * 150);
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files',
  '--force-color-profile=srgb', '--font-render-hinting=none', `--remote-debugging-port=${port}`,
  `--user-data-dir=${tmp}/prof`, `--window-size=${W},${H}`, 'about:blank'], { stdio: 'ignore' });
const rel = f => f.startsWith(ROOT + path.sep) ? path.relative(ROOT, f) : f;
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
const evalJS = async expr => {
  const r = await withTimeout(send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }), 45000, expr.slice(0, 60));
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails));
  return r.result.value;
};
async function shot(file, w, h, format = 'png') {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  const s = await send('Page.captureScreenshot', { format, ...(format === 'jpeg' ? { quality: 90 } : {}), clip: { x: 0, y: 0, width: w, height: h, scale: 1 } });
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from(s.data, 'base64'));
}

// Pillow: karty PNG → JPEG q88 4:4:4 (FB, LinkedIn i Slack stejně překódují do JPEG; paleta 256 barev tam dělala zrno),
// ikony jen bezztrátově optimalizované PNG, favicon.ico 16/32/48 z 48px renderu.
const PY_JPEG = `
import sys, os
from PIL import Image
q = int(sys.argv[1])
for pair in sys.argv[2:]:
    src, dst = pair.split('::')
    Image.open(src).convert('RGB').save(dst, 'JPEG', quality=q, subsampling=0, optimize=True)
    print('%s %d kB' % (os.path.basename(dst), os.path.getsize(dst) // 1024))
`;
const PY_PNG = `
import sys, os
from PIL import Image
for f in sys.argv[1:]:
    before = os.path.getsize(f); im = Image.open(f)
    im.save(f + '.tmp.png', optimize=True)
    if os.path.getsize(f + '.tmp.png') < before: os.replace(f + '.tmp.png', f)
    else: os.remove(f + '.tmp.png')
    print('%s %d -> %d kB' % (os.path.basename(f), before // 1024, os.path.getsize(f) // 1024))
`;
const PY_ICO = `
import sys
from PIL import Image
Image.open(sys.argv[1]).convert('RGBA').save(sys.argv[2], sizes=[(16, 16), (32, 32), (48, 48)])
`;
const py = (code, args) => spawnSync('python3', ['-c', code, ...args], { encoding: 'utf8' });
const hasPillow = py('import PIL', []).status === 0;
if (!hasPillow) console.warn('  ! python3 + Pillow chybí: JPEG přímo z Chrome (4:2:0), PNG ikony neoptimalizované, bez favicon.ico');

const written = [], rawCards = [], warnings = [];
try {
  const t = await target();
  ws = new WS(t.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  ws.onmessage = ev => { const d = JSON.parse(typeof ev.data === 'string' ? ev.data : ev.data.toString()); if (d.id && pend.has(d.id)) { const p = pend.get(d.id); pend.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); } };
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
  const open = async () => {
    await send('Page.navigate', { url: pathToFileURL(path.join(ROOT, 'tools/og/template.html')).href });
    await evalJS(`new Promise(r => { const w = () => (document.readyState === 'complete' && window.render) ? r(1) : setTimeout(w, 50); w(); })`);
  };
  await open();
  const fontsOk = f => f.baloo && f.nunito && f.balooCheck && f.nunitoCheck && f.balooReal;

  for (const c of cards) {
    let rep = await evalJS(`render(${JSON.stringify(c)}, ${JSON.stringify(logo)})`);
    // Google Fonts občas nedorazí: stránku 2× znovu načíst, pak skončit chybou (nikdy nefotit se záložním fontem)
    for (let i = 0; i < 2 && !fontsOk(rep.fonts); i++) {
      console.warn(`  ! ${c.file}: fonty se nenačetly, zkouším znovu`);
      await sleep(1500); await open();
      rep = await evalJS(`render(${JSON.stringify(c)}, ${JSON.stringify(logo)})`);
    }
    const f = rep.fonts;
    if (!fontsOk(f)) throw new Error(`${c.file}: fonty se nenačetly ${JSON.stringify(f)}`);
    if (rep.overflow) warnings.push(`${c.file}: nadpis se nevešel ani při ${rep.fontSize}px`);
    for (const [k, what] of [['gap', 'maskota'], ['ringGap', 'kruhu'], ['stickerGap', 'samolepky']])
      if (rep[k] < MIN_GAP) warnings.push(`${c.file}: nadpis je jen ${rep[k]}px od ${what} (min. ${MIN_GAP})`);
    const out = path.join(OUT, c.file + '.jpg');
    if (hasPillow) { const raw = path.join(tmp, c.file + '.png'); await shot(raw, W, H, 'png'); rawCards.push([raw, out]); }
    else await shot(out, W, H, 'jpeg');
    written.push(out);
    console.log(`  ${rel(out)}  nadpis ${rep.fontSize}px / ${rep.lines} ř., odstup maskot ${rep.gap} / kruh ${rep.ringGap} / samolepka ${rep.stickerGap} px, fonty Baloo ${f.baloo}× Nunito ${f.nunito}× (latin-ext ok)`);
  }
  if (withIcons) {
    for (const [name, size, bg, hh] of [...ICONS, ...(hasPillow ? [['favicon-48.png', 48, 'none', '100%']] : [])]) {
      await send('Emulation.setDeviceMetricsOverride', { width: size, height: size, deviceScaleFactor: 1, mobile: false });
      await evalJS(`render(${JSON.stringify({ variant: 'icon', size, bg, hh })})`);
      const out = name === 'favicon-48.png' ? path.join(tmp, name) : path.join(ICON_DIR, name);
      await shot(out, size, size);
      if (name !== 'favicon-48.png') { written.push(out); console.log(`  ${rel(out)}  ${size}×${size}`); }
    }
  }
  if (hasPillow) {
    fs.mkdirSync(OUT, { recursive: true });
    if (rawCards.length) {
      const r = py(PY_JPEG, [String(JPEG_Q), ...rawCards.map(([a, b]) => `${a}::${b}`)]);
      if (r.status !== 0) throw new Error('JPEG export selhal: ' + r.stderr);
      process.stdout.write(r.stdout.replace(/^(?=.)/gm, '  jpg '));
    }
    if (withIcons) {
      const pngs = written.filter(f => f.endsWith('.png'));
      const r = py(PY_PNG, pngs);
      if (r.status === 0) process.stdout.write(r.stdout.replace(/^(?=.)/gm, '  png '));
      const ico = py(PY_ICO, [path.join(tmp, 'favicon-48.png'), FAVICON_ICO]);
      if (ico.status === 0) { written.push(FAVICON_ICO); console.log(`  ${rel(FAVICON_ICO)}  16/32/48`); }
      else warnings.push('favicon.ico: ' + ico.stderr.trim().split('\n').pop());
    }
  }
} finally {
  try { ws && ws.close(); } catch {}
  chrome.kill('SIGKILL');
  await sleep(300);
  fs.rmSync(tmp, { recursive: true, force: true });
}

for (const f of written.filter(f => f.endsWith('.jpg'))) {
  const kb = fs.statSync(f).size / 1024;
  if (kb > MAX_KB) warnings.push(`${path.basename(f)}: ${Math.round(kb)} kB > ${MAX_KB} kB`);
}
for (const w of warnings) console.warn('  ! ' + w);
console.log(`hotovo: ${written.length} souborů${cards.length ? '. Teď spusťte python3 tools/build_pages.py (nové ?v= v og:image).' : ''}`);
