/* =========================================================
   Sparkee – story.js · „Sparkee za 20 vteřin“ (#sparkee-20s) · v2 „jeden záběr“
   20s smyčka jako živý kód. Vanilla JS, žádné knihovny, žádné MP4.
   Scénář: tools/parts/story-v2-script.md – jedna kamera bez střihů, jeden živý maskot
   (klon hero SVG, ruce z kloubů přes SparkeeRig.limb), titulky v pevné liště.

   JAK UPRAVIT
   • Texty generovaných prvků (chaos, kalendář, služby, komentáře, KPI, report): COPY níže.
     Nadpisy beatů: index.html (sekce #sparkee-20s, bloky data-k="t1…t6").
   • Svět: buildWorld() – BEAT 1–6, časy v sekundách:
       T.to(el, {o:1, y:0}, 3.2, .4, E.out3)  = od 3,2 s trvá 0,4 s
       T.set(el, {o:0}, 7)                     = skok v 7 s
       T.fn(el, 3, 7, t => ({x, y, r}))        = pohyb jako čistá funkce času
   • Maskot: buildPose() – kanály pózy (paže = presety PRE, pohled look, náklon lean, výška ry…).
     Póza P(t) je čistá funkce času (žádné pružiny ani náhoda) → scrub, kapitoly i ?story=t
     dají vždy stejný snímek. Brand: maskot se nikdy nedeformuje – jen posun, rotace,
     uniformní scale a ohyb paží.
   • Kamera: LAYOUTS.*.cam (monotónní Hermite, z 1–1,08). Bookend 1,25× = dolly jen na skupině maskota.
   • Rozložení: LAYOUTS.d (desktop 16:9) / LAYOUTS.m(H) (mobil ≤720 px + tablet na výšku ≤900 px, výška 21:20 až 9:16 podle okna), jednotky cqw.
   • Kapitoly: CHAPTERS (t = začátek, poster = snímek při pauze).
   • Test: ?story=12.5 → skočí na 12,5 s a zastaví (screenshoty). Debug: window.SparkeeStory
   ========================================================= */
(() => {
  'use strict';
  const root = document.querySelector('[data-story]');
  if (!root) return;

  /* ---------- texty generovaných prvků ---------- */
  const COPY = {
    month: 'Říjen', monthSub: 'content plán', monthStart: 3, // 1. 10. = čtvrtek (0 = pondělí)
    days: ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'],
    ok: 'Vše naplánováno',
    // chaos → dlaždice v kalendáři: [vzhled, ikona/barva, text, den v měsíci, typ dlaždice]
    items: [
      ['bub', 'bell', '12 nových notifikací', 1, 'post'], ['note', 'pink', 'DEADLINE<br>dnes!', 2, 'reel'],
      ['mini', 'a', '', 5, 'story'], ['bub', 'chat', 'Kdy bude další post?', 7, 'post'],
      ['note', 'lav', 'Kdo točí<br>reel??', 8, 'collab'], ['bub', 'heart', '3 lajky za týden', 31, 'reel'],
      ['note', 'sky', 'Brief<br>chybí', 12, 'post'], ['mini', 'b', '', 14, 'story'],
      ['bub', 'at', 'Zmínka bez odpovědi', 16, 'reel'], ['note', 'mint', 'Schválit<br>do 12:00', 19, 'ads'],
      ['warn', '', '!', 21, 'post'], ['bub', 'mail', '17 nepřečtených zpráv', 23, 'collab'],
      ['mini', 'c', '', 26, 'reel'], ['note', 'pink', 'Post<br>ve 23:58?', 28, 'story'],
      ['pill', '', 'Stories???', 30, 'report'],
    ],
    heroDay: 31, // Reel dlaždice u tlapky → rozbalí se do telefonu
    tiles: { post: ['mint', 'img', 'Post'], reel: ['lav', 'play', 'Reel'], story: ['sky', 'ring', 'Story'], collab: ['pink', 'users', 'Collab'], ads: ['holo', 'mega', 'Ads'], report: ['ink', 'chart', 'Report'] },
    // služby: [text, ikona, barva, typ dlaždice, ze které přiletí barevná kulička]
    chips: [['Správa sítí', 'cal', 'var(--mint)', 'post'], ['Content', 'cam', 'var(--sky)', 'story'], ['Influenceři', 'users', 'var(--pink)', 'collab'], ['Paid social', 'mega', 'var(--lav)', 'reel']],
    comments: [{ av: '', tx: 'Tohle chci vidět!' }, { av: 'b', tx: 'Kdo to točil?!' }, { ic: 'save', tx: 'Uloženo do sbírky' }, { ic: 'users', tx: '+1 nový sledující' }],
    cmtToKpi: [[0, 0], [1, 1], [3, 2]], // [komentář, KPI] – komentáře se promění v KPI (ve svislém pořadí, dráhy se nekříží)
    feedTitle: 'feed',
    // ⚠ ILUSTRATIVNÍ ČÍSLA – ukázka formátu reportu, ne reálné výsledky klienta. [DOPLNIT] až budou case studies.
    kpis: [
      { to: 42, from: 0, fmt: 'pct', label: 'engagement', ic: 'heart-o', c: 'var(--pink)' },
      { to: 3, from: 1, fmt: 'x', label: 'větší dosah', ic: 'eye', c: 'var(--sky)' },
      { to: 1248, from: 1, fmt: 'plus', label: 'nových sledujících', ic: 'users', c: 'var(--mint)' },
    ],
    likes: [184, 2480],                                           // ilustrativní
    hearts: ['pink', 'lav', 'mint', 'pink', 'sky', 'lav', 'pink', 'mint', 'sky', 'lav', 'pink', 'mint'], // 12 = jedno na sloupec grafu
    chartLine: [10, 13, 12, 17, 16, 21, 25, 24, 30, 35, 40, 47],  // ilustrativní
    chartBars: [18, 22, 20, 27, 25, 31, 36, 34, 41, 46, 52, 60],  // ilustrativní
    months: ['Čer', 'Čvc', 'Srp', 'Zář'],
    dash: ['Report', 'Instagram · 90 dní', 'ilustrativní data'],
  };
  const CHAPTERS = [
    { t: 0, poster: 1.9, name: 'Ahoj' },
    { t: 2.9, poster: 5.2, name: 'Chaos' },
    { t: 6.8, poster: 9.2, name: 'Systém' },
    { t: 10.2, poster: 13.5, name: 'Obsah' },
    { t: 14.2, poster: 16.6, name: 'Čísla' },
    { t: 16.9, poster: 18.72, name: 'Jiskra' },
  ];
  const POSTER = 18.72; // reduced motion / klávesa End / zastavení po jednom přehrání

  /* story.js se načítá před mascot-rig.js → start až po všech defer skriptech */
  let booted = false;
  const boot = () => { if (booted) return; booted = true; init(); };
  if (window.SparkeeRig) boot();
  else { document.addEventListener('DOMContentLoaded', boot); addEventListener('load', boot); }

  function init() {
    const Rig = window.SparkeeRig || null;
    const $ = (s, c = root) => c.querySelector(s);
    const $$ = (s, c = root) => [...c.querySelectorAll(s)];
    const figure = $('.st'), frame = $('[data-st-frame]'), stage = $('[data-st-stage]');
    if (!frame || !stage) return;
    const K = {};
    $$('[data-k]').forEach(el => { K[el.dataset.k] = el; });
    const cam = K.cam, hero = K.hero, par = K.par, over = K.over;
    if (!cam || !hero) return;

    const DUR = 20;
    const MQ = matchMedia('(max-width: 720px), (max-width: 900px) and (orientation: portrait)'); // = breakpoint v story.css (telefon + tablet na výšku)
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- rozložení (cqw; výška scény d = 56.25, m = 125) ---------- */
    const LAYOUTS = {
      // desktop 16:9 – kompozice „titulek vlevo, děj vpravo“:
      // lišta titulků x 6–40 · děj x 38–95 (maskot vpředu, rekvizity za ním) · podlaha y 52 · osa snímku y 28
      // maskot S 1,1 (≈ 36 cqw = 64 % výšky) ve všech beatech stejně; D = vznášení v tmavém světě (bookendy na ose)
      d: (() => {
        const Hc = 28.125, pan = (t, z) => [t, z, 50, Hc];
        const zf = (t, z, f) => [t, z, f[0] - (f[0] - 50) / z, f[1] - (f[1] - Hc) / z]; // zoom s pevným bodem f
        return {
          H: 56.25, Hc, U: 34 / 442, S: 1.1, wy: 2.2, wOut: 1.5, lift: 1.15, bob: .5, look: 17, itemS: 1.12,
          t1: { x: 6, y: 20, w: 46 }, txt: { x: 6, y: 6.2, w: 40 }, t6: { x: 6, y: 13, w: 62 }, cta: { x: 6.3, gap: 3.4 },
          st: { H: [79, 52], C: [68, 50], H5: [80, 52], D: [73, 45], A: [76, 52] },   // A = u telefonu (beat 4)
          rel: 2.64, hover: [-4.2, -2.5], hold: [-1.35, -1.2], halo: { rx: 11.6, ry: 3.4, tilt: -12 }, B: [50.5, 23], apexB: 16, bang: [5.2, -1.5],
          // vír kolem hlavy: přední oblouk (ryF) vede pod bradou, zadní (ryB) nad plamínkem → obličej zůstává volný
          swarm: { cx: 67.5, cy: 31.5, rx: [17, 21], ryF: [13, 15], ryB: [19, 23], out: [12, 19], arcs: [[-110, 25], [75, 140]],
            // hromádka notifikací pod titulkem (levý dolní kvadrant): 2 rovnou z výbuchu (t0 null), 1 opustí vír u levého okraje
            park: [{ i: 0, x: 15.1, y: 33.7, r: -3.5, d: .42, buzz: [3.5, 4.95] }, { i: 3, x: 21, y: 38.5, r: 2.5, d: .55, buzz: [3.75, 6.05] },
              { i: 11, x: 16.7, y: 43.3, r: -2, t0: 4.65, d: .62, arc: -3, buzz: [5.29] }] },
          cal: { x: 39.2, y: 10.5, w: 38, pad: 1.7, head: 3.6, days: 2.4, gap: .55 },
          ok: { ox: 1, oy: .48, inset: 0 },  // odznak: kotva v pravém horním rohu kalendáře, posun −100 % / −48 %
          chips: { x: 6, y: 28.5, w: 14, h: 4.6, gx: 1.2, gy: 1.3 }, bead: 2.4,
          phone: { x: 47.8, y: 5.7, w: 22 }, screenPt: [.9, .92],   // v bezpečném rámu ≥ 5,6 cqw nahoře i dole
          cmt: [[22.5, 29.5], [26, 35], [21.5, 40.5], [25, 46]],
          hearts: { x: [41.5, 44.5], y: [6, 24], cols: 2, rows: 6 },
          dash: { x: 34, y: 26.2, w: 40, h: 24 },
          kpi: { x: 6, y: [28, 34.6, 41.2], w: 25, h: 5.6 },
          tw: [[3.5, 47], [44, 3.2], [96, 4], [97, 33], [40, 52.5], [62, 2.5], [22, 3.5]],
          dolly: [56, 30], backstep: [14.0, 14.45],
          cam: [pan(0, 1), pan(2.5, 1), pan(2.95, 1), pan(3.3, 1), zf(6.8, 1.035, [66.8, 33]),      // vír: nájezd na hlavu
            pan(7.6, 1), pan(8.2, 1), zf(10.2, 1.02, [67, 40.5]), zf(10.9, 1.03, [58.8, 28.1]),    // Reel dlaždice → telefon (max 1,03: telefon v rámu)
            zf(11.6, 1.03, [58.8, 28.1]), zf(12.2, 1.03, [58.8, 28.1]), pan(13.9, 1), pan(15.3, 1),   // telefon
            zf(16.8, 1.02, [72.5, 33]), zf(17.4, 1.06, [74, 30]), pan(18.2, 1), pan(20, 1)],     // tečka grafu → úchop
        };
      })(),
      // mobil (≤720 px): výška scény H (cqw) podle výšky okna – story.css: 100svh − lišta − nadpis − ovládání,
      // 105 = 21:20 (iPhone SE s lištami) … 125 = 4:5 … 155,6 = 9:14 … 177,8 = 9:16 (vysoký telefon).
      // Tři návrhy: s = 21:20, a = 4:5, b = 9:14; mezi nimi lineárně, nad 9:14 lineárně dál (k > 1).
      // v(a, b, s): hodnota bez s se pod 4:5 prodlužuje přímkou a–b; s = ruční hodnota pro 21:20 (kalendář, telefon, report, stání).
      // titulky nahoře, děj uprostřed, maskot dole; s výškou roste i maskot (S), kalendář, telefon a report.
      m: H => {
        const k = (H - 125) / 30.6, ks = clamp01((125 - H) / 20);
        const v = (a, b, s) => (s !== undefined && H < 125 ? a + (s - a) * ks : a + (b - a) * k), V = (a, b, s) => a.map((x, i) => v(x, b[i], s && s[i]));
        const S = v(.62, .74), sr = S / .6;    // sr: jiskra u tlapky, svatozář a „!“ rostou s maskotem
        const Hc = H / 2;
        const cal = { x: 5, y: v(53, 63, 47.6), w: v(68, 74, 59), pad: v(2.6, 2.6, 2.3), head: v(6.4, 6.4, 5.6), days: v(4.2, 4.2, 3.8), gap: 1 };
        const cell = (cal.w - 2 * cal.pad - 6 * cal.gap) / 7;
        const tile = [cal.x + cal.pad + 5.5 * cell + 5 * cal.gap, cal.y + cal.pad + cal.head + cal.days + 4.5 * cell + 4 * cal.gap]; // Reel dlaždice (31. 10.)
        const phone = { x: v(13, 10, 15), y: v(40, 50, 31.5), w: v(36, 42, 31) }, pc = [phone.x + phone.w / 2, phone.y + phone.w * 1.02];
        const pan = (t, z, dx, dy) => [t, z, 50 + dx, Hc + dy];
        const zf = (t, z, f) => [t, z, f[0] - (f[0] - 50) / z, f[1] - (f[1] - Hc) / z]; // zoom s pevným bodem f (dlaždice, telefon)
        return {
          mob: 1, H, Hc, U: 60 / 442, S, wy: 4, wOut: 2.5, lift: 1.2, bob: .5, look: v(22, 26), itemS: v(.8, .94),
          t1: { x: 7, y: v(10, 15), w: 86 }, txt: { x: 7, y: v(7, 9, 5), w: 86 }, t6: { x: 7, y: v(9, 16), w: 86 }, cta: { x: 7.5, gap: 6 },
          // C: maskot se ve víru vznáší, aby chaos vyplnil střed scény (ne spodní třetinu)
          st: { H: V([72, 121], [72, 147], [72, 101.5]), C: V([50, 104], [50, 124]), H5: V([86, 121], [85, 147], [86, 101.5]), A: V([55, 121], [57, 147], [54, 101.5]) },
          rel: 2.56, hover: [-3.8 * sr, -2.3 * sr], hold: [-1.2 * sr, -1.1 * sr], halo: { rx: 12 * sr, ry: 3.5 * sr, tilt: -12 },
          B: V([46, 58], [45, 76]), apexB: v(52, 70), bang: [5 * sr, -1.5 * sr],
          swarm: { cx: 50, cy: v(89, 106), rx: V([25, 36], [27, 37]), ryF: V([10, 12], [12, 15]), ryB: V([25, 33], [34, 44]), out: V([16, 26], [20, 32]), arcs: [[-30, 210]] },
          cal,
          ok: { ox: 1, oy: 0, inset: 1 },     // odznak uvnitř hlavičky kalendáře vpravo (nezasahuje do čipů)
          chips: { x: 7, y: v(35.2, 41, 32.2), w: 41.5, h: v(7, 7.6, 6.3), gx: 2.5, gy: v(1.6, 2, 1.2) }, bead: 4,
          phone, screenPt: [.97, .985],      // spodní hrana ve výšce tlapky (dosah palce)
          cmt: [0, 1, 2, 3].map(i => [v(53, 56), v(37, 46) + i * v(10.5, 13)]),
          hearts: { x: V([72.5, 93.5], [71, 93]), y: V([79.5, 86], [96, 104]), cols: 6, rows: 2 }, // nad plamínkem maskota v H5
          dash: { x: 5, y: v(67, 76, 60.8), w: v(70, 72), h: v(45, 56, 37) },
          kpi: { x: 7, y: [0, 1, 2].map(i => v(34.6, 38, 31) + i * v(10.2, 12, 9.9)), w: v(55, 58), h: v(9.5, 10, 8.6) },
          tw: [[5, 47], [94, 44], [92, 31], [5, 70], [95, 70], [50, 122], [8, 121]].map(([x, y]) => [x, y * H / 125]),
          dolly: V([57, 74], [55, 92]), backstep: [13.95, 14.5],
          cam: [pan(0, 1, 0, 0), pan(2.5, 1, 0, 0), pan(2.95, 1, -1, -1), pan(3.3, 1, -1, -1), pan(6.8, 1.045, -.96, -1.93),
            pan(7.6, 1, 0, 0), pan(8.2, 1, 0, 0), zf(10.2, 1.02, tile), zf(10.9, 1.08, pc), zf(11.6, 1.03, pc),
            zf(12.2, 1.03, pc), pan(13.9, 1, 0, 0), pan(15.3, 1, 0, 0), pan(16.8, 1.02, .56, -1.41), pan(17.4, 1.06, 1.25, .65),
            pan(18.2, 1, 0, 0), pan(20, 1, 0, 0)],
        };
      },
    };
    const MH = [105, 177.8]; // rozsah výšky mobilní scény (cqw) = clamp() v story.css
    const stageH = () => clamp(100 * frame.clientHeight / (frame.clientWidth || 1), MH[0], MH[1]);

    /* =========================================================
       MATEMATIKA
       ========================================================= */
    const TAU = Math.PI * 2, D2R = Math.PI / 180;
    const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
    const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
    const lerp = (a, b, k) => a + (b - a) * k;
    const smooth = (a, b, v) => { const k = clamp01((v - a) / (b - a)); return k * k * (3 - 2 * k); };
    const wrap = t => (t >= 0 && t < DUR ? t : ((t % DUR) + DUR) % DUR);
    const bump = (x, len) => (x <= 0 || x >= len ? 0 : Math.sin(Math.PI * x / len));
    const E = {
      lin: k => k,
      in2: k => k * k,
      out2: k => k * (2 - k),
      io2: k => (k < .5 ? 2 * k * k : 1 - (2 - 2 * k) ** 2 / 2),
      in3: k => k * k * k,
      out3: k => 1 - (1 - k) ** 3,
      io3: k => (k < .5 ? 4 * k ** 3 : 1 - (2 - 2 * k) ** 3 / 2),
      outX: k => (k >= 1 ? 1 : 1 - 2 ** (-10 * k)),
      back: k => 1 + 2.70158 * (k - 1) ** 3 + 1.70158 * (k - 1) ** 2,
      back2: k => 1 + 3.6 * (k - 1) ** 3 + 2.6 * (k - 1) ** 2,
      soft: k => 1 + 2.04 * (k - 1) ** 3 + 1.04 * (k - 1) ** 2, // přestřel ≈ 4 % (kalendář 0,25 → 1,03)
      flick: k => 1 + 2.2 * (k - 1) ** 3 + 1.2 * (k - 1) ** 2,
      spring: k => (k >= 1 ? 1 : 1 - Math.exp(-6.5 * k) * Math.cos(k * 8.8)),
    };
    // pružina s krátkým náběhem (nulová počáteční rychlost) – návraty, které nejsou úder
    E.springIn = k => E.spring(k <= 0 ? 0 : k < .2 ? k * k / .4 / .9 : (k - .1) / .9);
    const tanhC = (x, m) => m * Math.tanh(x / m); // měkký strop ±m (bez zlomu)
    const ME = { // easingy riggu (mascot.js) pro akce wave / hop
      sine: x => .5 - .5 * Math.cos(Math.PI * x),
      o2: x => 1 - (1 - x) * (1 - x),
      back: x => { const c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); },
    };
    function kf(t, Kf) { // [[t, v, ease?], …]
      if (t <= Kf[0][0]) return Kf[0][1];
      for (let i = 1; i < Kf.length; i++) {
        const k1 = Kf[i];
        if (t <= k1[0]) { const k0 = Kf[i - 1]; return lerp(k0[1], k1[1], (ME[k1[2]] || ME.sine)((t - k0[0]) / ((k1[0] - k0[0]) || 1e-9))); }
      }
      return Kf[Kf.length - 1][1];
    }
    function ramp(t, a, b, c, d) { if (t <= a || t >= d) return 0; if (t < b) return ME.sine((t - a) / (b - a)); if (t <= c) return 1; return ME.sine((d - t) / (d - c)); }
    // 0 → 1 (up, out2) → 0 (down, out3): jednosměrný puls bez kmitání
    const pulseK = (t, t0, up, down) => (t <= t0 || t >= t0 + up + down ? 0 : t < t0 + up ? E.out2((t - t0) / up) : 1 - E.out3((t - t0 - up) / down));
    // parabola y(k): y0 → y1 s vrcholem apex (osa y dolů, apex nad oběma konci)
    function parab(y0, y1, apex) {
      const a = y0 - apex, b = y1 - y0;
      if (a <= 1e-6 || y1 - apex <= 1e-6) return k => y0 + b * k;
      const Bq = -2 * a - 2 * Math.sqrt(a * (a + b)), Aq = b - Bq;
      return k => y0 + Bq * k + Aq * k * k;
    }
    // monotónní kubický Hermite (Fritsch–Carlson), sklon 0 na krajích
    function hermite(ts, vs) {
      const n = ts.length, d = [], m = new Array(n).fill(0);
      for (let i = 0; i < n - 1; i++) d[i] = (vs[i + 1] - vs[i]) / (ts[i + 1] - ts[i]);
      for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
      for (let i = 0; i < n - 1; i++) {
        if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
        const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
        if (s > 9) { const q = 3 / Math.sqrt(s); m[i] = q * a * d[i]; m[i + 1] = q * b * d[i]; }
      }
      return t => {
        if (t <= ts[0]) return vs[0];
        if (t >= ts[n - 1]) return vs[n - 1];
        let i = 0;
        while (t > ts[i + 1]) i++;
        const h = ts[i + 1] - ts[i], k = (t - ts[i]) / h, k2 = k * k, k3 = k2 * k;
        return (2 * k3 - 3 * k2 + 1) * vs[i] + (k3 - 2 * k2 + k) * h * m[i] + (-2 * k3 + 3 * k2) * vs[i + 1] + (k3 - k2) * h * m[i + 1];
      };
    }
    // integrál io2 od 0 do k (pro zrychlování víru)
    const Iio2 = k => (k <= 0 ? 0 : k < .5 ? 2 / 3 * k * k * k : k <= 1 ? k + 2 / 3 * (1 - k) ** 3 - .5 : .5 + (k - 1));
    const rng = seed => () => { seed = seed + 0x6D2B79F5 | 0; let x = Math.imul(seed ^ seed >>> 15, 1 | seed); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; };
    // 2D afinní [a b c d e f] jako SVG matrix()
    const M = {
      mul: (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]],
      tr: (x, y) => [1, 0, 0, 1, x, y],
      sc: s => [s, 0, 0, s, 0, 0],
      rot: (deg, cx = 0, cy = 0) => { const a = deg * D2R, c = Math.cos(a), s = Math.sin(a); return [c, s, -s, c, cx - c * cx + s * cy, cy - s * cx - c * cy]; },
      ap: (m, p) => [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]],
    };
    const rotAbout = (p, c, deg) => { const a = deg * D2R, cs = Math.cos(a), sn = Math.sin(a), dx = p[0] - c[0], dy = p[1] - c[1]; return [c[0] + dx * cs - dy * sn, c[1] + dx * sn + dy * cs]; };

    /* =========================================================
       ENGINE – časová osa: keyframy per prvek a vlastnost, seekovatelná
       (hodnota = čistá funkce času), rAF řídí přehrávač.
       Vlastnosti: x y (cqw) r (deg) s sx sy o · d (kreslení čáry) · n (číslo)
                   clip (clip-path, jen v oknech) · z (z-index)
       Stejná třída drží i kanály pózy maskota (bez DOM).
       ========================================================= */
    const DEF = { x: 0, y: 0, r: 0, s: 1, sx: 1, sy: 1, o: 1, d: 0, n: 0, z: 0, clip: '', w: 0, h: 0, br: 0, wc: 0 };
    const TF = ['x', 'y', 'r', 's', 'sx', 'sy'];
    class TL {
      constructor() { this.m = new Map(); }
      // kontrola při sestavení: překryv segmentů stejné vlastnosti (val() by pozdější ignoroval) a skoky na začátku segmentu
      check(name = el => (el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className) || 'pose') {
        const out = [];
        for (const t of this.m.values()) {
          for (const k in t.p) {
            if (k === 'clip') continue;
            const segs = t.p[k];
            for (let i = 1; i < segs.length; i++) {
              const a = segs[i - 1], b = segs[i];
              if (b.t0 < a.t1 - 1e-6) out.push(['overlap', name(t.el), k, +a.t0.toFixed(3), +a.t1.toFixed(3), +b.t0.toFixed(3)]);
              if (b.t1 > b.t0 && typeof a.end === 'number') {
                const v0 = this.val(t, k, b.t0 - 1e-4), v1 = this.val(t, k, b.t0 + 1e-4);
                const vis = s => ('o' in t.p || 'o' in t.b ? this.val(t, 'o', s) : 1) * ('s' in t.p || 's' in t.b ? Math.min(1, this.val(t, 's', s) * 5) : 1);
                const seen = Math.min(vis(b.t0 - 1e-4), vis(b.t0 + 1e-4)) > .02 || (k === 'o' && vis(b.t0 + 1e-4) > .02 && vis(b.t0 - 1e-4) <= .02);
                if (seen && Math.abs(v1 - v0) > (k === 'o' ? .08 : 'rn'.includes(k) ? 1 : .15)) out.push(['jump', name(t.el), k, +b.t0.toFixed(3), +v0.toFixed(3), +v1.toFixed(3)]);
              }
            }
          }
        }
        return out;
      }
      tr(el) {
        let t = this.m.get(el);
        if (!t) { t = { el, p: {}, b: {}, last: {} }; this.m.set(el, t); }
        return t;
      }
      base(el, v) { Object.assign(this.tr(el).b, v); return this; }
      meta(el, v) { Object.assign(this.tr(el), v); return this; }
      val(t, k, time) {
        let v = k in t.b ? t.b[k] : DEF[k];
        const segs = t.p[k];
        if (!segs) return v;
        for (let i = 0; i < segs.length; i++) {
          const s = segs[i];
          if (time < s.t0) break;
          if (time >= s.t1) { v = s.end; continue; }
          if (s.f) { const c = s.c; if (c.t !== time) { c.t = time; c.v = s.f(time); } return c.v[k]; }
          return s.a + (s.b - s.a) * s.e((time - s.t0) / (s.t1 - s.t0));
        }
        return v;
      }
      get(el, k, time) { return this.val(this.tr(el), k, time); }
      push(el, k, seg) { const p = this.tr(el).p; (p[k] || (p[k] = [])).push(seg); p[k].sort((a, b) => a.t0 - b.t0); }
      to(el, v, t0, d = .4, e = E.out3) {
        const t = this.tr(el);
        for (const k in v) this.push(el, k, { t0, t1: t0 + d, a: this.val(t, k, t0), b: v[k], end: v[k], e });
        return this;
      }
      set(el, v, t0) { return this.to(el, v, t0, 0); }
      fn(el, t0, t1, f) {
        const c = { t: NaN, v: null }, a = f(t0), b = f(t1);
        for (const k in a) this.push(el, k, { t0, t1, f, c, end: b[k] });
        return this;
      }
      render(time) {
        for (const t of this.m.values()) {
          if (t.virtual) continue;
          const el = t.el, L = t.last, st = el.style;
          if (!t.keys) { t.keys = [...new Set([...Object.keys(t.b), ...Object.keys(t.p)])]; t.tf = t.keys.some(k => TF.includes(k)); }
          const V = {};
          for (const k of t.keys) V[k] = this.val(t, k, time);
          if ('o' in V) {
            const o = V.o < .003 ? 0 : V.o > .997 ? 1 : Math.round(V.o * 1000) / 1000;
            if (o !== L.o) {
              st.opacity = o === 1 ? '' : o; L.o = o;
              const vis = o === 0 ? 'hidden' : 'visible';
              if (vis !== L.v) { st.visibility = vis; L.v = vis; }
            }
            if (o === 0 && L.tr !== undefined) continue; // skrytý prvek: transformaci netřeba psát
          }
          if (t.tf) {
            const x = V.x || 0, y = V.y || 0, r = V.r || 0, s = V.s ?? 1, sx = s * (V.sx ?? 1), sy = s * (V.sy ?? 1);
            let tr = (x || y) ? `translate(${x.toFixed(3)}cqw,${y.toFixed(3)}cqw)` : '';
            if (r) tr += ` rotate(${r.toFixed(2)}deg)`;
            if (sx !== 1 || sy !== 1) tr += sx === sy ? ` scale(${sx.toFixed(4)})` : ` scale(${sx.toFixed(4)},${sy.toFixed(4)})`;
            if (tr !== L.tr) { st.transform = tr; L.tr = tr; }
          }
          if ('d' in V) { const d = (1 - V.d).toFixed(4); if (d !== L.d) { st.strokeDashoffset = d; L.d = d; } }
          if ('n' in V && t.fmt) { const n = t.fmt(V.n); if (n !== L.n) { el.textContent = n; L.n = n; } }
          if ('clip' in V) { const c = V.clip || ''; if (c !== L.clip) { st.clipPath = c; L.clip = c; } }
          if ('z' in V) { const z = Math.round(V.z); if (z !== L.z) { st.zIndex = z || ''; L.z = z; } }
          // rozměry (cqw) – jen malé prvky s vlastní ohraničenou výplní (pilulky, report), kde clip neumí orámování
          if ('w' in V) { const w = V.w.toFixed(3); if (w !== L.w) { st.width = w + 'cqw'; L.w = w; } }
          if ('h' in V) { const hh = V.h.toFixed(3); if (hh !== L.h) { st.height = hh + 'cqw'; L.h = hh; } }
          if ('br' in V) { const b = V.br.toFixed(3); if (b !== L.br) { st.borderRadius = b + 'cqw'; L.br = b; } }
          if ('wc' in V) { const wc = V.wc > .5 ? 'transform' : 'auto'; if (wc !== L.wc) { st.willChange = wc; L.wc = wc; } }
        }
      }
    }

    /* =========================================================
       RIG – konstanty z tools/rig.py a assets/js/mascot.js (jen čteno, needitováno)
       ========================================================= */
    const SH = { l: [467, 338], r: [541, 338] };
    const NECK = [504, 334], FEET = [504, 446], CENTER = [504, 262];
    const UPA = 24 * D2R, CU = Math.cos(UPA), SU = Math.sin(UPA);
    const toLogoV = (x, y) => [x * CU + y * SU, -x * SU + y * CU];
    const EYE = { l: [455, 278.5], r: [528.75, 246.25] };
    const MOUTH = [498, 281];
    const CHEEK = [[549.25, 264.55], [457.05, 305.7]];
    const FLAME_BASE = [425, 139], FLAME_CORE = [430, 131], FLAME_TIP = [420.2, 54.5];
    const HEAD_C = rotAbout([490, 245], [490, 300], -24);   // střed hlavy (logo prostor)
    const THUMB = [584, 331, -20];
    const ARM_GRAD = { l: [[456, 340], [410, 372]], r: [[552, 340], [596, 372]] };
    const KEYJ = {
      rest: [[20.5, 12], [41, 24]], down: [[14, 20], [24, 40]], out: [[24, 2], [47, 0]],
      wave: [[23, 2], [45, -12]], cheer: [[22, -1], [42, -17]], hold: [[22, 8], [42, -2]],
    };
    const PRE = {};
    for (const k in KEYJ) {
      const e = KEYJ[k][0], t = KEYJ[k][1];
      const a1 = Math.atan2(e[1], e[0]) / D2R, a2 = Math.atan2(t[1] - e[1], t[0] - e[0]) / D2R;
      PRE[k] = { a1, b: a2 - a1, l1: Math.hypot(e[0], e[1]), l2: Math.hypot(t[0] - e[0], t[1] - e[1]) };
    }
    // nové presety scénáře (délky kostí jen z rozsahu 22–26,1 j.)
    Object.assign(PRE, {
      offer: { a1: 8, b: -28, l1: 23.4, l2: 25 },
      lowOut: { a1: 30, b: -10, l1: PRE.out.l1, l2: PRE.out.l2 },
      cock: { a1: 35, b: -75, l1: 22.4, l2: 22.4 },
      present: { a1: 12, b: -8, l1: 23.4, l2: 26 },   // scénář −2/−14 by tlapku schoval pod lalok hlavy
      yayL: { a1: -4, b: -40, l1: 23.4, l2: 26 },
      yayR: { a1: 8, b: -48, l1: PRE.hold.l1, l2: PRE.hold.l2 },
    });
    function armJoints(side, a1, b, l1, l2) {
      const sx = side === 'l' ? -1 : 1, s = SH[side];
      const uu = a1 * D2R, w = (a1 + b) * D2R;
      const ex = Math.cos(uu) * l1, ey = Math.sin(uu) * l1;
      const tx = ex + Math.cos(w) * l2, ty = ey + Math.sin(w) * l2;
      return [[s[0], s[1]], [s[0] + sx * ex, s[1] + ey], [s[0] + sx * tx, s[1] + ty]];
    }
    const REST_TIP = { l: armJoints('l', PRE.rest.a1, PRE.rest.b, PRE.rest.l1, PRE.rest.l2)[2], r: armJoints('r', PRE.rest.a1, PRE.rest.b, PRE.rest.l1, PRE.rest.l2)[2] };
    const PAW0 = Rig ? Rig.limbInfo(armJoints('r', PRE.hold.a1, PRE.hold.b, PRE.hold.l1, PRE.hold.l2)).paw : { x: 0, y: 0, angle: 0 };
    const flick = t => 2.2 * Math.sin(TAU * 1.1 * t) + 1.2 * Math.sin(TAU * 2.7 * t + 1.3) + .5 * Math.sin(TAU * 5.3 * t);
    const flameScale = t => 1 + .025 * Math.sin(TAU * 1.9 * t) + .012 * Math.sin(TAU * 4.3 * t + .5);
    const blinkCurve = x => (x <= 0 || x >= .2 ? 0 : x < .06 ? (x / .06) ** 2 : x < .085 ? 1 : 1 - ME.o2((x - .085) / .115));
    const BLINKS = [.5, 3.4, 3.64, 4.9, 6.32, 8.1, 9.47, 10.27, 11.05, 15.4, 16.82, 18.77, 19.72];
    // matice riggu (jednotky SVG maskota)
    const floatM = F => M.mul(M.tr(F.x, F.y), M.rot(F.rot, CENTER[0], CENTER[1]));
    const bodyM = F => M.mul(floatM(F), M.rot(F.lean, FEET[0], FEET[1]));
    const headM = F => { const n = rotAbout(NECK, FEET, F.lean); return M.mul(floatM(F), M.mul(M.tr(n[0] + F.hx, n[1] + F.hy), M.mul(M.rot(F.hr), M.mul(M.tr(-NECK[0], -NECK[1]), M.rot(24, 490, 300))))); };
    const flameM = (F, t) => M.mul(headM(F), M.mul(M.rot(-24, 425, 97), M.mul(M.tr(F.flameDx || 0, F.flameDy || 0),
      M.mul(M.tr(FLAME_BASE[0], FLAME_BASE[1]), M.mul(M.rot((F.flameRot || 0) + flick(t) * (F.flick || 1)), M.mul(M.sc(F.flame * flameScale(t)), M.tr(-FLAME_BASE[0], -FLAME_BASE[1])))))));

    /* ---------- akce riggu jako čisté vrstvy (port z mascot.js: wave, hop) ---------- */
    function armL(P, side, a1, b, k, l1, l2) {
      if (k === 0) return;
      const p = side === 'l' ? 'L' : 'R';
      P[p + 'a'] = lerp(P[p + 'a'], a1, k); P[p + 'b'] = lerp(P[p + 'b'], b, k);
      if (l1 != null) P[p + '1'] = lerp(P[p + '1'], l1, k);
      if (l2 != null) P[p + '2'] = lerp(P[p + '2'], l2, k);
    }
    const sat = clamp01;
    const ACT = {
      wave(P, t) {
        const up = ME.back(ME.sine(sat(t / .42)));
        const ph = Math.max(0, t - .2) * 2.3 * TAU;
        const amp = ME.sine(sat((t - .14) / .3)), sw = Math.sin(ph) * amp;
        armL(P, 'l', 3 + 5 * Math.sin(ph - 1) * amp, -44 + 25 * sw, up, 23.4, 26);
        const k = ME.sine(sat(t / .35));
        P.happy = lerp(P.happy, 1, sat(t / .22)); P.mouth = lerp(P.mouth, 1.28, k); P.cheek = lerp(P.cheek, 1.14, k);
        P.hr += (4.5 + 1.2 * Math.sin(ph + .4) * amp) * k; P.hy += -2.5 * k; P.hx += 2.5 * k;
        P.lean += (-2.2 + .6 * Math.sin(ph + .8) * amp) * k;
        armL(P, 'r', PRE.hold.a1 + 7, PRE.hold.b + 4, k);
        P.phoneRot += 7 * k;
        P.lookX *= 1 - .6 * k; P.lookY *= 1 - .6 * k;
        P.y += -1.2 * Math.abs(Math.sin(ph)) * amp;
      },
      hop(P, t) { // přikrčení 0,18 s, odraz, vzduch 0,4 s, dopad
        const c0 = .18, air = .4, Hh = 26, tl = c0 + air;
        let y;
        if (t < c0) y = 5.5 * ME.sine(t / c0);
        else if (t < tl) { const q = (t - c0) / air; y = 5.5 * (1 - q) - Hh * 4 * q * (1 - q); }
        else y = kf(t - tl, [[0, 0], [.08, 4.5, 'o2'], [.23, -1.2, 'sine'], [.4, 0, 'sine']]);
        P.y += y;
        const down = ramp(t, 0, c0, c0, c0 + .16), up = ramp(t, c0 - .06, c0 + .16, tl - .05, tl + .3);
        armL(P, 'l', 46, 4, down); armL(P, 'r', 30, -44, down);
        armL(P, 'l', 2, -32, up); armL(P, 'r', 16, -46, up);
        P.phoneRot += 8 * up; P.hy += 2.5 * down;
        const joy = ramp(t, c0, c0 + .1, tl + .1, tl + .45);
        P.happy = lerp(P.happy, 1, joy * .95); P.mouth = lerp(P.mouth, 1.22, joy);
        P.rot += kf(t, [[c0, 0], [c0 + air * .5, -3, 'sine'], [tl, 1.8, 'sine'], [tl + .3, 0, 'sine']]);
      },
      flap(P, t) { // nízké zamávání tlapkou pod lalokem hlavy (čitelné): a1 12, b −8 ↔ −38 při 2,3 Hz
        const ph = t * 2.3 * TAU, amp = ME.sine(sat(t / .18));
        armL(P, 'l', 12 + 3 * Math.sin(ph + 1.2) * amp, -23 + 15 * Math.sin(ph) * amp, 1, 23.4, 26);
        P.hr += 3 + 1 * Math.sin(ph + .4) * amp; P.hx += 1.2; P.lean += -1.2 + .5 * Math.sin(ph + .8) * amp;
      },
    };
    const POSE_KEYS = ['fx', 'gy', 'x', 'y', 'rot', 'lean', 'hr', 'hx', 'hy', 'lookX', 'lookY', 'happy', 'mouth', 'cheek', 'flame',
      'La', 'Lb', 'L1', 'L2', 'Ra', 'Rb', 'R1', 'R2', 'phoneRot', 'tap', 'heart'];

    /* =========================================================
       DOM – pomocníci a generované prvky
       ========================================================= */
    const h = html => { const tp = document.createElement('template'); tp.innerHTML = html.trim(); return tp.content.firstChild; };
    const ico = (id, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24"><use href="#st-i-${id}"/></svg>`;
    const add = (html, parent = cam) => parent.insertBefore(h(html), parent === hero ? null : parent === cam ? hero : null);
    const pos = (el, r) => { const s = el.style; s.left = r.x + 'cqw'; s.top = r.y + 'cqw'; if (r.w != null) s.width = r.w + 'cqw'; if (r.h != null) s.height = r.h + 'cqw'; };
    const nf = new Intl.NumberFormat('cs-CZ');
    const FMT = {
      int: v => nf.format(Math.round(v)),
      plus: v => '+' + nf.format(Math.round(v)),
      pct: v => '+' + Math.round(v) + ' %',
      x: v => (Math.abs(v - Math.round(v)) < .05 ? Math.round(v) : v.toFixed(1).replace('.', ',')) + '×',
    };

    /* ---------- nadpisy → slova / písmena (kinetická typografie) ---------- */
    $$('.st-line', stage).forEach(line => {
      const out = [];
      [...line.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          n.textContent.split(/( +)/).forEach(part => {
            if (!part) return;
            if (/^ +$/.test(part)) { out.push(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'st-w'; w.textContent = part; out.push(w);
          });
        } else if (n.nodeType === 1) { n.classList.add('st-w'); out.push(n); }
      });
      line.replaceChildren(...out);
    });
    $$('.st-chaos', stage).forEach(w => { w.innerHTML = [...w.textContent].map(c => `<span class="st-l">${c}</span>`).join(''); });

    /* ---------- maskot: klon hero SVG s prefixovanými id ---------- */
    function cloneMascot() {
      const tpl = window.SparkeeMascot && window.SparkeeMascot.template;
      const src = tpl || document.querySelector('svg.mascot');
      if (!src) return null;
      const svg = src.cloneNode(true), live = !tpl, P = 'stm-';
      svg.querySelectorAll('.m-fx').forEach(n => n.remove());
      svg.querySelectorAll('[id]').forEach(n => { n.id = P + n.id; });
      [svg, ...svg.querySelectorAll('*')].forEach(n => {
        for (const a of [...n.attributes]) {
          if (a.value.includes('url(#')) n.setAttribute(a.name, a.value.replace(/url\(#/g, 'url(#' + P));
          else if ((a.name === 'href' || a.name === 'xlink:href') && a.value[0] === '#') n.setAttribute(a.name, '#' + P + a.value.slice(1));
        }
      });
      svg.removeAttribute('role'); svg.removeAttribute('aria-label');
      svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
      svg.setAttribute('class', 'mascot is-rigged st-mascot__svg');
      svg.removeAttribute('style');
      return { svg, live };
    }
    function makeRig(wrapEl) {
      const c = cloneMascot();
      if (!c) return null;
      const svg = c.svg;
      wrapEl.appendChild(svg);
      const q = s => svg.querySelector(s);
      const el = {
        float: q('.m-float'), body: q('.m-body'), head: q('.m-head-rig'), flame: q('.m-flame'),
        eyes: q('.m-eyes'), eyeL: q('.m-eye-l'), eyeR: q('.m-eye-r'), happy: q('.m-eyes-happy'),
        mouth: q('.m-mouth'), cheeks: [...svg.querySelectorAll('.m-cheek')], shadow: q('.m-shadow'),
        inkL: q('.m-body-ink [data-limb="arm-l"]'), fillL: q('.m-body-fill [data-limb="arm-l"]'),
        inkR: q('.m-body-ink [data-limb="arm-r"]'), fillR: q('.m-body-fill [data-limb="arm-r"]'),
        hand: q('.m-hand'), thumb: q('.m-thumb'), heart: q('.m-phone-heart'),
      };
      if (!el.float || !el.body || !el.head) return null;
      const grads = {};
      for (const side of ['l', 'r']) {
        const g = q('#stm-bd-arm-' + side), fill = side === 'l' ? el.fillL : el.fillR;
        if (g && fill) { fill.setAttribute('fill', 'url(#' + g.id + ')'); grads[side] = g; }
      }
      const flameInner = el.flame && el.flame.firstElementChild;
      const flameT0 = flameInner ? ((flameInner.getAttribute('transform') || '').match(/^\s*rotate\([^)]*\)/) || ['rotate(-24 425 97)'])[0] : '';
      const flamePaths = el.flame ? el.flame.querySelectorAll('path') : [];
      const flameCore = flamePaths.length > 1 ? flamePaths[flamePaths.length - 1] : null;
      const happyPaths = el.happy ? [...el.happy.children] : [];
      const happyT0 = happyPaths.map(p => { const v = p.getAttribute('transform') || ''; return c.live ? v.replace(/^(\s*(translate|scale)\([^)]*\)){4}\s*/, '') : v; });
      const f2 = v => (Math.abs(v) < 5e-3 ? '0' : v.toFixed(2));
      const f3 = v => (Math.abs(v) < 5e-4 ? '0' : v.toFixed(3));
      const setA = (node, name, v) => { if (!node) return; const key = '_' + name; if (node[key] !== v) { node[key] = v; node.setAttribute(name, v); } };
      const setT = (node, v) => setA(node, 'transform', v);
      const lastJ = { l: null, r: null };
      const same = (a, b) => b && Math.abs(a[1][0] - b[1][0]) < .004 && Math.abs(a[1][1] - b[1][1]) < .004 && Math.abs(a[2][0] - b[2][0]) < .004 && Math.abs(a[2][1] - b[2][1]) < .004;
      function drawArm(side, J) {
        if (same(J, lastJ[side])) return lastJ[side].info;
        const ink = side === 'l' ? el.inkL : el.inkR, fill = side === 'l' ? el.fillL : el.fillR;
        let info = null;
        if (Rig && ink && fill) {
          info = Rig.limbInfo(J);
          ink.setAttribute('d', info.d); fill.setAttribute('d', info.d);
          const g = grads[side];
          if (g) {
            const sh = J[0], rt = REST_TIP[side], tip = J[2];
            const v0x = rt[0] - sh[0], v0y = rt[1] - sh[1], v1x = tip[0] - sh[0], v1y = tip[1] - sh[1];
            const d0 = v0x * v0x + v0y * v0y, a = (v1x * v0x + v1y * v0y) / d0, b = (v1y * v0x - v1x * v0y) / d0;
            const G = ARM_GRAD[side];
            const mp = p => { const dx = p[0] - sh[0], dy = p[1] - sh[1]; return [sh[0] + a * dx - b * dy, sh[1] + b * dx + a * dy]; };
            const p1 = mp(G[0]), p2 = mp(G[1]);
            g.setAttribute('x1', p1[0].toFixed(1)); g.setAttribute('y1', p1[1].toFixed(1));
            g.setAttribute('x2', p2[0].toFixed(1)); g.setAttribute('y2', p2[1].toFixed(1));
          }
        }
        J.info = info || { paw: PAW0 };
        lastJ[side] = J;
        return J.info;
      }
      let lastWrap = '';
      function render(F, t, L) {
        const wt = `translate(${F.fx.toFixed(3)}cqw,${F.gy.toFixed(3)}cqw) scale(${L.S})`;
        if (wt !== lastWrap) { wrapEl.style.transform = wt; lastWrap = wt; }
        setT(el.float, `translate(${f2(F.x)} ${f2(F.y)})` + (Math.abs(F.rot) > 1e-3 ? ` rotate(${f2(F.rot)} ${CENTER[0]} ${CENTER[1]})` : ''));
        setT(el.body, `rotate(${f3(F.lean)} ${FEET[0]} ${FEET[1]})`);
        const n = rotAbout(NECK, FEET, F.lean);
        setT(el.head, `translate(${f2(n[0] + F.hx)} ${f2(n[1] + F.hy)}) rotate(${f3(F.hr)}) translate(${-NECK[0]} ${-NECK[1]}) rotate(24 490 300)`);
        if (flameInner) {
          const fl = F.flameRot + flick(t) * F.flick, fs = F.flame * flameScale(t), b = FLAME_BASE;
          setT(flameInner, `${flameT0} translate(${f2(F.flameDx)} ${f2(F.flameDy)}) translate(${b[0]} ${b[1]}) rotate(${f2(fl)}) scale(${f3(fs)}) translate(${-b[0]} ${-b[1]})`);
          if (flameCore) {
            const cc = FLAME_CORE, cs = 1 + .06 * Math.sin(TAU * 3.1 * t + .4) + .03 * Math.sin(TAU * 6.7 * t);
            setT(flameCore, `translate(0 ${f2(-1.2 * Math.sin(TAU * 2.2 * t))}) translate(${cc[0]} ${cc[1]}) scale(${f3(cs)}) translate(${-cc[0]} ${-cc[1]})`);
          }
        }
        const ev = toLogoV(F.eyeX, F.eyeY);
        const open = Math.max(.04, (1 - F.blink) * (1 - .96 * ME.sine(sat(F.happy / .4))));
        for (const [node, cc] of [[el.eyeL, EYE.l], [el.eyeR, EYE.r]]) {
          setT(node, `translate(${f2(ev[0] + cc[0])} ${f2(ev[1] + cc[1])}) rotate(-24) scale(1 ${f3(open)}) rotate(24) translate(${-cc[0]} ${-cc[1]})`);
        }
        setA(el.eyes, 'opacity', f2(1 - sat((F.happy - .38) / .06)));
        if (el.happy) {
          setA(el.happy, 'opacity', f2(sat((F.happy - .34) / .08)));
          const s = .35 + .65 * ME.back(sat((F.happy - .34) / .66));
          happyPaths.forEach((p, i) => {
            const cc = i ? EYE.r : EYE.l;
            setT(p, `translate(${f2(ev[0] * .6)} ${f2(ev[1] * .6)}) translate(${cc[0]} ${cc[1]}) scale(${f3(s)}) translate(${-cc[0]} ${-cc[1]}) ${happyT0[i]}`);
          });
        }
        setT(el.mouth, `translate(${MOUTH[0]} ${MOUTH[1]}) scale(${f3(F.mouth)}) translate(${-MOUTH[0]} ${-MOUTH[1]})`);
        el.cheeks.forEach((ch, i) => { const p = CHEEK[i] || CHEEK[0]; setT(ch, `translate(${p[0]} ${p[1]}) scale(${f3(F.cheek)}) translate(${-p[0]} ${-p[1]})`); });
        drawArm('l', armJoints('l', F.La, F.Lb, F.L1, F.L2));
        const paw = drawArm('r', armJoints('r', F.Ra, F.Rb, F.R1, F.R2)).paw;
        const hr = (paw.angle - PAW0.angle) / D2R * .55 + F.phoneRot + 2.5 * F.tap;
        setT(el.hand, `translate(${f2(paw.x)} ${f2(paw.y)}) rotate(${f2(hr)}) translate(${f2(-PAW0.x)} ${f2(-PAW0.y)})`);
        setT(el.thumb, `translate(${f2(THUMB[0] + 9 * F.tap)} ${f2(THUMB[1] - 3.5 * F.tap)}) rotate(${f2(THUMB[2] - 16 * F.tap)}) scale(${f3(1 - .12 * F.tap)})`);
        setT(el.heart, `translate(0 0.8) scale(${f3(1 + .5 * F.heart)}) translate(0 -0.8)`);
        if (el.shadow) {
          const k = clamp(1 + F.y / 150, .5, 1.06);
          setT(el.shadow, `translate(${f2(504 + F.x)} 452) scale(${f3(k)}) translate(-504 -452)`);
          setA(el.shadow, 'opacity', f3(.12 * (.35 + .65 * k) * F.shadow));
        }
      }
      return { svg, render };
    }

    /* ---------- generované prvky scény ---------- */
    const TWD = Array.from({ length: 7 }, () => add(`<svg class="st-tw st-tw--sky" viewBox="0 0 24 24"><use href="#st-i-spark"/></svg>`, par));
    const plate = () => {
      const p = add('<div class="st-plate"><div class="st-plate__in"></div></div>');
      const inn = p.firstChild;
      const tws = Array.from({ length: 7 }, () => inn.appendChild(h(`<svg class="st-tw" viewBox="0 0 24 24"><use href="#st-i-spark"/></svg>`)));
      return { el: p, inn, tws };
    };
    const PL = [plate(), plate()];
    const iring = add('<i class="st-ring st-iring"></i>');
    const burst = add('<i class="st-burst"></i>');
    const rings = [add('<i class="st-ring"></i>'), add('<i class="st-ring"></i>')];
    const PTS = Array.from({ length: 14 }, () => add(`<svg class="st-pt" viewBox="0 0 24 24"><use href="#st-i-spark"/></svg>`));
    const CR = Array.from({ length: 4 }, () => add('<i class="st-cring"></i>')); // kontaktní kroužky: slam, puls, šťouch, palec
    const bang = add('<div class="st-bang">!</div>');

    let cells = '';
    for (let i = 0; i < 35; i++) { const d = i - COPY.monthStart + 1; cells += d >= 1 && d <= 31 ? `<i><small>${d}</small></i>` : '<i class="is-out"></i>'; }
    const cal = add(`<div class="st-cal"><div class="st-cal__head"><b>${COPY.month}</b><span>${COPY.monthSub}</span></div><div class="st-cal__days">${COPY.days.map(d => `<span>${d}</span>`).join('')}</div><div class="st-cal__grid">${cells}</div></div>`);
    const okEl = add(`<div class="st-ok">${ico('check')}<span>${COPY.ok}</span></div>`);
    const IT = COPY.items.map(([m, c, tx, d, tile]) => {
      const [tc, ti, tl] = COPY.tiles[tile];
      const mess = {
        bub: `<div class="st-mess st-bub"><i>${ico(c)}</i><span>${tx}</span></div>`,
        note: `<div class="st-mess st-note st-note--${c}">${tx}</div>`,
        mini: `<div class="st-mess st-mini st-mini--${c}"><i></i><b></b><b></b></div>`,
        warn: `<div class="st-mess st-warn">${tx}</div>`,
        pill: `<div class="st-mess st-pill">${tx}</div>`,
      }[m];
      const el = add(`<div class="st-it"><i class="st-it__lift"></i><div class="st-it__mess">${mess}</div><div class="st-it__tidy st-tile st-tile--${tc}">${ico(ti)}<span>${tl}</span><i class="st-it__flash"></i></div></div>`);
      return { el, lift: el.children[0], mess: el.children[1], tidy: el.children[2], flash: el.children[2].lastChild, d, tile, hero: d === COPY.heroDay };
    });
    const HERO_IT = IT.find(it => it.hero);
    const BEADG = COPY.chips.map(ch => [add(`<i class="st-bead st-bead--g" style="--c:${ch[2]}"></i>`), add(`<i class="st-bead st-bead--g" style="--c:${ch[2]}"></i>`)]); // stopa kuličky
    const BEADS = COPY.chips.map(ch => add(`<i class="st-bead" style="--c:${ch[2]}"></i>`));
    // čip: vlastní ohraničené pozadí (__bg) roste z ikonky, text se odkrývá pod jeho kulatým koncem
    const CHIPS = COPY.chips.map(([tx, ic, c]) => add(`<div class="st-chip"><i class="st-chip__bg"></i><i class="st-chip__ic" style="--c:${c}">${ico(ic)}</i><span>${tx}</span></div>`));
    const CHIP_BG = CHIPS.map(c => c.children[0]), CHIP_I = CHIPS.map(c => c.children[1]), CHIP_T = CHIPS.map(c => c.children[2]);

    const post = (m, av, w1, w2) => `<article class="st-post"><header><i class="st-av ${av}"></i><b class="st-sk" style="--w:${w1}%"></b></header><div class="st-media ${m}">${ico('spark')}</div><footer>${ico('heart-o')}${ico('chat')}${ico('send')}${ico('save', 'st-post__save')}</footer><p><b class="st-sk" style="--w:${w2}%"></b><b class="st-sk" style="--w:${w2 - 26}%"></b></p></article>`;
    const phone = add(`<div class="st-phone"><i class="st-phone__bezel"></i><div class="st-phone__scr">
      <div class="st-phone__top"><b>${COPY.feedTitle} ✦</b><em>${ico('heart-o')}${ico('send')}</em></div>
      <div class="st-feed">${post('st-media--b', 'st-av--b', 44, 70)}${post('st-media--c', 'st-av--c', 30, 84)}
        <article class="st-post st-post--reel"><header><i class="st-av st-av--holo"></i><span>sparkee</span></header>
          <div class="st-media st-reel"><img class="st-reel__head" src="assets/img/poses/head.svg" alt="" width="264" height="312" loading="lazy" decoding="async">
            <span class="st-reel__tag">${ico('play')}12,4K</span><span class="st-reel__play">${ico('play')}</span><span class="st-reel__bar"><i></i></span>
            <svg class="st-reel__heart" viewBox="0 0 24 24"><use href="#st-i-heart"/></svg></div>
          <footer><span class="st-like">${ico('heart-o')}${ico('heart', 'st-like__on')}</span><b class="st-like__n">184</b>${ico('chat')}${ico('send')}${ico('save', 'st-post__save')}</footer>
          <p><b class="st-sk" style="--w:86%"></b><b class="st-sk" style="--w:52%"></b></p></article>
      </div><i class="st-phone__white"></i></div>
      <div class="st-phone__tile st-tile--lav"><div class="st-phone__tilein st-tile st-tile--lav">${ico('play')}<span>${COPY.tiles.reel[2]}</span></div></div></div>`);
    const PH = {
      bezel: $('.st-phone__bezel', phone), scr: $('.st-phone__scr', phone), white: $('.st-phone__white', phone),
      tile: $('.st-phone__tile', phone), tilein: $('.st-phone__tilein', phone), feed: $('.st-feed', phone),
    };
    const reelPost = $('.st-post--reel', phone);
    const R = { media: $('.st-reel', phone), head: $('.st-reel__head', phone), play: $('.st-reel__play', phone), bar: $('.st-reel__bar i', phone), like: $('.st-like__on', phone), likeN: $('.st-like__n', phone), big: $('.st-reel__heart', phone), likeBox: $('.st-like', phone) };
    const HEARTS = COPY.hearts.map((c, i) => add(`<svg class="st-heart${i % 3 === 2 ? ' st-heart--s' : ''}" viewBox="0 0 24 24" style="color:var(--${c})"><use href="#st-i-heart"/></svg>`));
    const CMTS = COPY.comments.map(c => add(`<div class="st-cmt">${c.ic ? `<i class="st-cmt__ic">${ico(c.ic)}</i>` : `<i class="st-av ${c.av ? 'st-av--' + c.av : ''}"></i>`}<span>${c.tx}</span></div>`));

    // report: ohraničené pozadí (__bg) přebírá obrys otočeného telefonu, obsah (__in) se odkrývá uvnitř
    const dash = add(`<div class="st-dash"><i class="st-dash__bg"></i><div class="st-dash__in"><div class="st-dash__head"><b>${COPY.dash[0]}</b><span>${COPY.dash[1]}</span><em>${COPY.dash[2]}</em></div><svg class="st-chart" preserveAspectRatio="none"></svg><div class="st-dash__x">${COPY.months.map(m => `<span>${m}</span>`).join('')}</div></div></div>`);
    const dashHead = $('.st-dash__head', dash), chart = $('.st-chart', dash), dashBg = $('.st-dash__bg', dash), dashIn = $('.st-dash__in', dash);
    // KPI pilulka: jedno ohraničené pozadí (__bg), které se z komentáře přetvaruje do pilulky; obsah nabíhá až po zmizení textu komentáře
    const KPIS = COPY.kpis.map(k => add(`<div class="st-kpi"><i class="st-kpi__bg"></i><i class="st-kpi__ic" style="--c:${k.c}">${ico(k.ic)}</i><b>${FMT[k.fmt](k.to)}</b><span>${k.label}</span></div>`));

    // skupina maskota (dolly): glow, maskot, glow jiskry, jiskra, stopa
    const mwrap = K.m;
    const rig = mwrap ? makeRig(mwrap) : null;
    const NTR = 10;
    const TRAIL = Array.from({ length: NTR }, () => add(`<svg class="st-trail" viewBox="0 0 24 24"><use href="#st-i-spark"/></svg>`, hero));
    const streak = add('<i class="st-streak"></i>', hero); // šmouha za hozenou jiskrou (ne maskot → smí se natáhnout)
    // přeletová čára (screen space) → podtržení „jiskru“
    const NS = 'http://www.w3.org/2000/svg';
    const clone = over ? over.appendChild(document.createElementNS(NS, 'path')) : null;
    const jiskruW = $('.st-jiskru', K.t6) || K.t6;
    if (clone) { clone.setAttribute('class', 'st-over__line'); clone.setAttribute('vector-effect', 'non-scaling-stroke'); }

    /* =========================================================
       ROZLOŽENÍ → DOM (měření jen zde, nikdy ve smyčce snímků)
       ========================================================= */
    const pxc = () => 100 / (frame.clientWidth || 1); // px → cqw
    let G = null; // naměřená geometrie
    function applyLayout(L) {
      L.u = L.U * L.S;
      const isMob = !!L.mob;
      frame.style.setProperty('--mu', L.U.toFixed(5) + 'cqw');
      const px = pxc();
      pos(K.t1, L.t1); ['t2', 't3', 't4', 't5'].forEach(k => pos(K[k], L.txt)); pos(K.t6, L.t6);
      L.cta.y = L.t6.y + K.t6.offsetHeight * px + L.cta.gap; pos(K.cta, L.cta);
      // reduced motion: tlačítko „Přehrát“ na mobilu pod CTA (vpravo dole by zakrylo tlapku s jiskrou)
      if (ui.big) {
        const bs = ui.big.style;
        if (isMob) { bs.left = L.cta.x + 'cqw'; bs.top = (L.cta.y + K.cta.offsetHeight * px + 4) + 'cqw'; bs.right = bs.bottom = 'auto'; }
        else bs.left = bs.top = bs.right = bs.bottom = '';
      }
      G = {};
      // plachty (paper svět): kruh 2Rc, vnitřek protiškálovaný na identitu s 8cqw přesahem
      const Wc = [[-3, -3], [103, -3], [-3, L.H + 3], [103, L.H + 3]];
      const c = L.cal, cell = (c.w - 2 * c.pad - 6 * c.gap) / 7, gy = c.y + c.pad + c.head + c.days;
      G.cell = cell; G.cal = { x: c.x, y: c.y, w: c.w, h: 2 * c.pad + c.head + c.days + 5 * cell + 4 * c.gap };
      pos(cal, G.cal);
      Object.entries({ cell, pad: c.pad, head: c.head, days: c.days, gap: c.gap }).forEach(([k, v]) => stage.style.setProperty('--' + k, v + 'cqw'));
      IT.forEach(it => {
        const idx = it.d + COPY.monthStart - 1;
        it.row = idx / 7 | 0; it.col = idx % 7;
        it.hx = c.x + c.pad + it.col * (cell + c.gap); it.hy = gy + it.row * (cell + c.gap);
        it.cx = it.hx + cell / 2; it.cy = it.hy + cell / 2;
        pos(it.el, { x: it.hx, y: it.hy, w: cell, h: cell });
        it.mw = it.mess.offsetWidth * px; it.mh = it.mess.offsetHeight * px; // rozměr „chaos“ podoby (pro vyhnutí se obličeji)
      });
      // odznak „Vše naplánováno“ – desktop: přes pravý horní roh kalendáře; mobil: uvnitř hlavičky vpravo
      {
        const oa = L.ok, okw = okEl.offsetWidth * px, okh = okEl.offsetHeight * px;
        const ax = c.x + c.w - oa.inset * c.pad, ay = oa.inset ? c.y + c.pad + Math.max(0, (c.head - okh) / 2) : c.y;
        pos(okEl, { x: ax, y: ay }); okEl.style.translate = `${-oa.ox * 100}% ${-oa.oy * 100}%`;
        G.ok = { w: okw, h: okh, cx: ax + (.5 - oa.ox) * okw, cy: ay + (.5 - oa.oy) * okh };
      }
      const ch = L.chips;
      G.chips = CHIPS.map((el, i) => {
        const r = { x: ch.x + (i % 2) * (ch.w + ch.gx), y: ch.y + (i >> 1) * (ch.h + ch.gy), w: ch.w, h: ch.h };
        pos(el, r);
        const ic = CHIP_I[i], iw = ic.offsetWidth * px, lb = CHIP_T[i];
        r.iw = iw; r.il = ic.offsetLeft * px; r.it = ic.offsetTop * px;               // ikonka (lokálně v čipu)
        r.ix = r.x + r.il + iw / 2; r.iy = r.y + r.it + iw / 2; r.cx = r.x + r.w / 2; r.cy = r.y + r.h / 2;
        r.tl = lb.offsetLeft * px; r.tw = lb.offsetWidth * px;                          // popisek (lokálně)
        return r;
      });
      BEADS.forEach(b => { b.style.width = b.style.height = L.bead + 'cqw'; b.style.margin = -L.bead / 2 + 'cqw 0 0 ' + -L.bead / 2 + 'cqw'; });
      // telefon
      const P = Object.assign({}, L.phone); P.h = P.w * 2.04; P.pu = P.w / 20;
      pos(phone, P); phone.style.setProperty('--pw', P.w + 'cqw');
      P.cx = P.x + P.w / 2; P.cy = P.y + P.h / 2; P.r = 3.2 * P.pu; P.inner = .55 * P.pu;
      G.phone = P;
      const tl = G.cell * 1.12;
      PH.tilein.style.width = PH.tilein.style.height = tl + 'cqw';
      PH.tilein.style.setProperty('--cell', tl + 'cqw');
      // feed (offsety bez transformací)
      const feedTop = P.y + P.inner + 4.6 * P.pu;
      G.reelBottom = (R.media.offsetTop + R.media.offsetHeight) * px; // v souřadnicích feedu (offsetParent = .st-feed)
      G.feedTop = feedTop;
      const lb = R.likeBox;
      G.like = { x: P.x + P.inner + (lb.offsetLeft + lb.offsetWidth / 2) * px, y: feedTop + (lb.offsetTop + lb.offsetHeight / 2) * px };
      G.cmt = CMTS.map((el, i) => { const r = { x: L.cmt[i][0], y: L.cmt[i][1] }; pos(el, r); r.w = el.offsetWidth * px; r.h = el.offsetHeight * px; return r; });
      pos(dash, L.dash);
      G.dash = Object.assign({ cx: L.dash.x + L.dash.w / 2, cy: L.dash.y + L.dash.h / 2 }, L.dash);
      { const cs = getComputedStyle(dash); G.dash.pad = ['Top', 'Right', 'Bottom', 'Left'].map(s => (parseFloat(cs['padding' + s]) || 0) * px); }
      G.kpi = KPIS.map((el, i) => { const r = { x: L.kpi.x, y: L.kpi.y[i], w: L.kpi.w, h: L.kpi.h }; pos(el, r); r.cx = r.x + r.w / 2; r.cy = r.y + r.h / 2; return r; });
      const uu = isMob ? 2.05 : 1; // = --u ve story.css
      G.radKpi = 1.2 * uu; G.radDash = 1.6 * uu; // cílová zaoblení pilulky a reportu (jako v CSS)
      buildChart(px);
      // „jiskru“: slot pro podtržení (screen space)
      const js = $('.st-jiskru', K.t6);
      if (js) G.jiskru = { x0: L.t6.x + js.offsetLeft * px, x1: L.t6.x + (js.offsetLeft + js.offsetWidth) * px, y: L.t6.y + (js.offsetTop + .86 * js.offsetHeight) * px }; // těsně pod účaří
      else G.jiskru = { x0: 28, x1: 45.5, y: 19 };
      // plachty
      G.plates = [L.B, G.dot].map((cc, i) => {
        const Rc = Math.max(...Wc.map(([a, b]) => Math.hypot(a - cc[0], b - cc[1]))) + 1;
        const p = PL[i];
        pos(p.el, { x: cc[0] - Rc, y: cc[1] - Rc, w: 2 * Rc, h: 2 * Rc });
        pos(p.inn, { x: Rc - cc[0] - 8, y: Rc - cc[1] - 8, w: 116, h: L.H + 16 });
        p.inn.style.transformOrigin = `${cc[0] + 8}cqw ${cc[1] + 8}cqw`;
        p.tws.forEach((el, j) => { el.style.left = L.tw[j][0] + 8 + 'cqw'; el.style.top = L.tw[j][1] + 8 + 'cqw'; });
        return { c: cc, Rc };
      });
      [20, cell * 1.3, cell * 1.1, isMob ? 7 : 4.5].forEach((d, i) => { const st = CR[i].style; st.width = st.height = d + 'cqw'; st.margin = -d / 2 + 'cqw 0 0 ' + -d / 2 + 'cqw'; });
      if (over) over.setAttribute('viewBox', `0 0 100 ${L.H}`);
      cal.style.transformOrigin = '0 0';
    }

    // graf: viewBox 400 × (podle poměru stran), čára se kreslí přes pathLength=1
    function buildChart(px) {
      const w = 400, hh = Math.max(80, Math.round(w * (chart.clientHeight || 100) / (chart.clientWidth || 400)));
      chart.setAttribute('viewBox', `0 0 ${w} ${hh}`);
      const Bv = COPY.chartBars, Ln = COPY.chartLine, n = Bv.length, pad = 6, bw = (w - 2 * pad) / n, top = 16, bot = hh - 2;
      const yB = v => bot - v / 66 * (bot - top), yL = v => bot - v / 50 * (bot - top);
      // čára končí až u pravého okraje grafu → koncový bod (a zvednutý maskot, který ho chytá) je ≥ 2 cqw za hranou karty
      const lx0 = pad + bw / 2, lx1 = w;
      const pts = Ln.map((v, i) => [lx0 + (lx1 - lx0) * i / (n - 1), yL(v)]);
      let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
        d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
      }
      const last = pts[n - 1];
      const grid = [.25, .5, .75].map(k => `<line class="grid" x1="0" x2="${w}" y1="${(top + (bot - top) * k).toFixed(1)}" y2="${(top + (bot - top) * k).toFixed(1)}"/>`).join('');
      const bars = Bv.map((v, i) => `<rect class="bar" x="${(pad + i * bw + bw * .17).toFixed(1)}" y="${yB(v).toFixed(1)}" width="${(bw * .66).toFixed(1)}" height="${(bot - yB(v)).toFixed(1)}" rx="5"/>`).join('');
      chart.innerHTML = `${grid}${bars}<path class="area" d="${d} L${last[0].toFixed(1)} ${bot} L${pts[0][0].toFixed(1)} ${bot}Z"/><path class="line" pathLength="1" d="${d}"/><circle class="pulse" cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="8"/><circle class="dot" cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="8"/>`;
      G.CH = { bars: [...chart.querySelectorAll('.bar')], area: $('.area', chart), line: $('.line', chart), dot: $('.dot', chart), pulse: $('.pulse', chart), d };
      // graf → svět
      const bx = G.dash.x + dashHead.offsetLeft * px, by = G.dash.y + (dashHead.offsetTop + dashHead.offsetHeight + (parseFloat(getComputedStyle(chart).marginTop) || 0)) * px; // svg nemá offsetLeft
      const sx = chart.clientWidth * px / w, sy = chart.clientHeight * px / hh;
      G.chart = { x: bx, y: by, sx, sy, hh, w };
      const cw = (x, y) => [bx + x * sx, by + y * sy];
      G.dot = cw(last[0], last[1]);
      G.barFoot = Bv.map((v, i) => cw(pad + i * bw + bw / 2, bot));
      const L0 = G.CH.line, len = L0.getTotalLength ? L0.getTotalLength() : 0;
      G.lut = [];
      for (let i = 0; i <= 64; i++) { const p = len ? L0.getPointAtLength(len * i / 64) : { x: pts[0][0] + (last[0] - pts[0][0]) * i / 64, y: pts[0][1] }; G.lut.push(cw(p.x, p.y)); }
      G.lineChart = { x0: pts[0][0], x1: last[0], y0: Math.min(...pts.map(p => p[1])), y1: Math.max(...pts.map(p => p[1])), end: last };
      G.lineSW = 5 * chart.clientWidth / w; // px při z = 1
      if (clone) clone.setAttribute('d', d);
    }
    const lutAt = k => { const L = G.lut, f = clamp01(k) * 64, i = Math.min(63, f | 0), q = f - i; return [lerp(L[i][0], L[i + 1][0], q), lerp(L[i][1], L[i + 1][1], q)]; };

    /* =========================================================
       MASKOT – póza P(t): kanály + idle + vrstvy akcí + pohled + sekundární pohyb
       ========================================================= */
    const PS = {};                 // „prvek“ pro kanály pózy (bez DOM)
    let Pt = null, L = null, ST = null, LAYERS = [], IKT = null;
    let BC = new Map(), PC = new Map();
    const pg = (k, t) => Pt.val(Pt.tr(PS), k, t);

    function baseAt(t) {
      const u = L.u;
      const g = k => pg(k, t);
      const F = {};
      const wI = g('wI');
      const p25 = TAU * t / 2.5, p5 = TAU * t / 5, p4 = TAU * t / 4;
      F.fx = g('fx'); F.gy = g('gy'); F.x = 0;
      F.y = (g('ry') + g('gl') - wI * L.bob * .5 * (1 - Math.cos(p25))) / u;
      F.rot = g('rot');
      F.lean = g('lean') + g('gLean') + wI * 1.2 * Math.sin(p5);
      F.hr = g('hr') + wI * Math.sin(p4 + 1);
      F.hx = g('hx'); F.hy = g('hy');
      F.lookX = g('lookX'); F.lookY = g('lookY');
      F.happy = g('happy'); F.mouth = g('mouth'); F.cheek = g('cheek'); F.flame = g('flame');
      F.La = g('La') + wI * 2.4 * Math.sin(p25); F.Lb = g('Lb') + wI * 3 * Math.sin(p25 - .8); F.L1 = g('L1'); F.L2 = g('L2');
      F.Ra = g('Ra') + wI * .8 * Math.sin(p5 + 2); F.Rb = g('Rb'); F.R1 = g('R1'); F.R2 = g('R2');
      F.phoneRot = g('phoneRot') + wI * 1.5 * Math.sin(p5);
      F.tap = 0;
      const hb = t % 2.5;
      F.heart = .35 * Math.max(bump(hb, .16), .7 * bump(hb - .22, .16));
      for (const Ly of LAYERS) {
        const w = g(Ly.w);
        if (w <= 0) continue;
        const Q = Object.assign({}, F);
        ACT[Ly.act](Q, t - Ly.t0);
        for (const k of POSE_KEYS) F[k] += (Q[k] - F[k]) * w;
      }
      return F;
    }
    function bodyAt(t) { // základ + hlava podle pohledu (bez očí a zpoždění)
      t = wrap(t);
      const key = Math.round(t * 1e4);
      let F = BC.get(key);
      if (F) return F;
      F = baseAt(t);
      const lx = clamp(F.lookX, -1.1, 1.1), ly = clamp(F.lookY, -1.1, 1.1), cx = clamp(lx, -1, 1);
      const dr = 1 - .8 * sat(lx) * sat(ly);
      F.hr += cx * 6 * dr; F.hx += lx * 3.2 * dr; F.hy += ly * 2.6; F.lean -= 1.6 * cx;
      if (BC.size > 900) BC.clear();
      BC.set(key, F);
      return F;
    }
    // sekundární pohyb: rychlosti z okna 0,12 s (krabicový filtr) místo 1/60 s → skok rychlosti = rampa, ne cuk
    const VW = .12;
    const Yv = s => { const b = bodyAt(s); return b.y + b.gy / L.u; };
    const HPv = s => { const b = bodyAt(s), n = rotAbout(NECK, FEET, b.lean); return [b.fx / L.u + b.x + n[0] + b.hx, b.gy / L.u + b.y + n[1] + b.hy, b.hr + b.rot]; };
    function flameLag(t) { // [rot, dx, dy] plamínku z vyhlazené rychlosti hlavy (zpoždění 0,10–0,12 s)
      const hr = bodyAt(t).hr, a0 = HPv(t - .10), a1 = HPv(t - .10 - VW), c0 = HPv(t - .12), c1 = HPv(t - .12 - VW);
      return [tanhC(-hr * .55 - (a0[0] - a1[0]) / VW * .06 - (a0[2] - a1[2]) / VW * .05, 16), tanhC(-(c0[0] - c1[0]) / VW * .012, 4), tanhC(-(c0[1] - c1[1]) / VW * .012, 6)];
    }
    // IK dvou kostí (délky zůstávají z presetu) – kontaktní pózy přesně v čase t
    function ikSolve(F, side, T) {
      const u = L.u;
      let p = [504 + (T[0] - F.fx) / u - F.x, 446 + (T[1] - F.gy) / u - F.y];
      if (F.rot) p = rotAbout(p, CENTER, -F.rot);
      p = rotAbout(p, FEET, -F.lean);
      const s = SH[side], sx = side === 'l' ? -1 : 1, l1 = side === 'l' ? F.L1 : F.R1, l2 = side === 'l' ? F.L2 : F.R2;
      const lx = (p[0] - s[0]) * sx, ly = p[1] - s[1];
      // měkké omezení natažení (bez singularity u plně natažené paže → loket necvakne)
      const d0 = Math.hypot(lx, ly), dm = .995 * (l1 + l2), kn = .06 * (l1 + l2);
      const d = Math.max(Math.abs(l1 - l2) + .01, d0 < dm - kn ? d0 : dm - kn * Math.exp(-(d0 - (dm - kn)) / kn));
      const b = -Math.acos(clamp((d * d - l1 * l1 - l2 * l2) / (2 * l1 * l2), -1, 1));
      const a1 = Math.atan2(ly, lx) - Math.atan2(l2 * Math.sin(b), l1 + l2 * Math.cos(b));
      return { a1: a1 / D2R, b: b / D2R };
    }
    function poseAt(t, noIK) {
      t = wrap(t);
      const key = Math.round(t * 1e4) * 2 + (noIK ? 1 : 0);
      let F = PC.get(key);
      if (F) return F;
      F = Object.assign({}, bodyAt(t));
      const Ee = bodyAt(t + .06); // oči předbíhají hlavu o 0,06 s
      F.eyeX = 2.4 * clamp(Ee.lookX, -1, 1); F.eyeY = 2.1 * clamp(Ee.lookY, -1, 1);
      const vy = (Yv(t - .08) - Yv(t - .08 - VW)) / VW;           // ruce se opožďují za tělem
      const drag = tanhC(-vy * .045, 20);
      F.La += drag; F.Ra += drag * .45; F.Lb -= drag * .25;
      F.hy += tanhC(-(Yv(t - .05) - Yv(t - .05 - VW)) / VW * .014, 5);
      // plamínek: 3 vzorky (0 / −0,04 / −0,08 s) → žádné přeskoky o celý rozsah během 1–2 snímků
      const f0 = flameLag(t), f1 = flameLag(t - .04), f2 = flameLag(t - .08);
      F.flameRot = .5 * f0[0] + .3 * f1[0] + .2 * f2[0];
      F.flameDx = .5 * f0[1] + .3 * f1[1] + .2 * f2[1];
      F.flameDy = .5 * f0[2] + .3 * f1[2] + .2 * f2[2];
      const wk = noIK ? 0 : pg('wIK', t);
      if (wk > 0 && IKT) { const T = IKT(t); if (T) { const s = ikSolve(F, 'l', T); F.La = lerp(F.La, s.a1, wk); F.Lb = lerp(F.Lb, s.b, wk); } }
      F.La += pg('dLa', t); F.Lb += pg('dLb', t); F.Ra += pg('dRa', t);
      let bl = pg('squint', t);
      for (const b of BLINKS) { const x = t - b; if (x > 0 && x < .2) bl = Math.max(bl, blinkCurve(x)); }
      F.blink = bl; F.shadow = pg('shadow', t); F.mglow = pg('mglow', t); F.flick = pg('flick', t);
      if (PC.size > 900) PC.clear();
      PC.set(key, F);
      return F;
    }
    // geometrie maskota ve světě (cqw)
    const W = (F, p) => [F.fx + (p[0] - FEET[0]) * L.u, F.gy + (p[1] - FEET[1]) * L.u];
    const pawW = (t, side = 'l', noIK) => { const F = poseAt(t, noIK), J = side === 'l' ? armJoints('l', F.La, F.Lb, F.L1, F.L2) : armJoints('r', F.Ra, F.Rb, F.R1, F.R2); return W(F, M.ap(bodyM(F), J[2])); };
    const headW = t => { const F = poseAt(t); return W(F, M.ap(headM(F), HEAD_C)); };
    const flameBaseW = t => { const F = poseAt(t); return W(F, M.ap(headM(F), M.ap(M.rot(-24, 425, 97), FLAME_BASE))); };
    const flameTipW = t => { const F = poseAt(t); return W(F, M.ap(flameM(F, t), FLAME_TIP)); };
    const bodyCW = t => { const F = poseAt(t); return W(F, M.ap(bodyM(F), [504, 300])); };
    const lookAt = (from, to, R = L.look) => [clamp((to[0] - from[0]) / R, -1, 1), clamp((to[1] - from[1]) / R, -1, 1)];

    /* ---------- vír chaosu (čisté funkce, potřebuje je i póza pro pohled) ---------- */
    let SW = null;
    function buildSwarm() {
      const rnd = rng(11), sw = L.swarm, B = L.B, u = L.u;
      const PHc = t => 1.15 * ((t - 3) + .35 * 2.7 * Iio2((t - 3.6) / 2.7));
      const RM = t => {
        // 3,6–6,3 se vír stahuje (1 → 0,9); 6,3–6,75 „výdech“ (0,9 → 1,12), aby nápřah a plácnutí byly vidět
        const r = t < 3.6 ? 1 : t < 6.3 ? lerp(1, .9, E.io2((t - 3.6) / 2.7)) : lerp(.9, 1.12, E.io2(clamp01((t - 6.3) / .45)));
        const pk = t < 3.3 ? 0 : t < 3.42 ? E.out2((t - 3.3) / .12) : t < 3.82 ? 1 - E.out2((t - 3.42) / .4) : 0;
        return r * (1 + .15 * pk);
      };
      const n = IT.length;
      // výstřel z bodu B jen do povolených směrů (ne přes titulky, ne do hlavy maskota)
      const arcs = sw.arcs, arcTot = arcs.reduce((s, a) => s + a[1] - a[0], 0);
      const dirAt = q => { let x = clamp01(q) * arcTot; for (const a of arcs) { const len = a[1] - a[0]; if (x <= len) return (a[0] + x) * D2R; x -= len; } return arcs[arcs.length - 1][1] * D2R; };
      const P0 = IT.map((it, i) => {
        const a = dirAt((i + .5 + (rnd() - .5) * .6) / n), dist = lerp(sw.out[0], sw.out[1], rnd());
        const q = rnd(), rx = lerp(sw.rx[0], sw.rx[1], rnd()), ry = lerp(sw.ryB[0], sw.ryB[1], q), ryF = lerp(sw.ryF[0], sw.ryF[1], q), w = .5 + rnd() * .45;
        const ex = B[0] + Math.cos(a) * dist, ey = B[1] + Math.sin(a) * dist * .8;
        return { a, rx, ry, ryF, w, ex, ey, al: Math.atan2((ey - sw.cy) / ry, (ex - sw.cx) / rx) };
      });
      // desktop (sw.park): část položek skončí v hromádce pod titulkem; ty rovnou z výbuchu (t0 null) nedostanou slot na elipse
      const park = sw.park || [], direct = i => park.some(p => p.i === i && p.t0 == null);
      // sloty rovnoměrně po elipse, přiřazené ve stejném kruhovém pořadí jako konce výstřelu (nejkratší přelety)
      const order = P0.map((p, i) => i).filter(i => !direct(i)).sort((i, j) => P0[i].al - P0[j].al), m = order.length;
      let bestOff = 0, bestCost = 1e9;
      for (let off = 0; off < m; off++) {
        let c = 0;
        order.forEach((i, j) => { const phi = (j + off) / m * TAU - Math.PI; let d = Math.abs(((P0[i].al - phi) % TAU + TAU) % TAU); c += Math.min(d, TAU - d); });
        if (c < bestCost) { bestCost = c; bestOff = off; }
      }
      order.forEach((i, j) => { P0[i].slot = (j + bestOff) / m * TAU - Math.PI + (rnd() - .5) * .25; });
      SW = IT.map((it, i) => {
        const { rx, ry, ryF, w, ex, ey } = P0[i];
        const ph = rnd() * TAU, rr = (rnd() - .5) * 30, sc = L.itemS * (.9 + rnd() * .2), spin = (i % 2 ? 1 : -1) * 90;
        const th0 = P0[i].slot - w * PHc(3.5);
        const orbitRaw = t => {
          const th = th0 + w * PHc(t), Rm = RM(t) * (1 + .06 * Math.sin(t * 2.3 + ph)), dep = Math.sin(th);
          const ryE = lerp(ry, ryF, (1 + dep) / 2); // vejčitá dráha: vpředu plošší (pod bradou), vzadu vyšší (nad plamínkem)
          return { x: sw.cx + Math.cos(th) * rx * Rm, y: sw.cy + dep * ryE * Rm, r: rr + 12 * Math.sin(t * 1.9 + ph), s: sc * (.84 + .2 * dep), dep };
        };
        // hromádka: jemné vznášení, po dopadu krátké „bzučení“ notifikace (třes rotací); dep −1 = za vírem, mimo pohled maskota
        const pk = park.find(p => p.i === i);
        const pile = t => {
          let r = pk.r;
          for (const tb of pk.buzz || []) { const x = t - tb; if (x > 0 && x < .32) r += 4.5 * Math.sin(TAU * 17 * x) * (1 - x / .32) ** 2; }
          return { x: pk.x + .25 * Math.sin(t * 1.3 + ph), y: pk.y + .3 * Math.sin(t * 1.7 + ph), r, s: L.itemS, dep: -1 };
        };
        const orbit = !pk ? orbitRaw : pk.t0 == null ? t => { // rovnou z výbuchu (outX dosedne bez rázu)
          const k = E.outX(clamp01((t - 2.94) / pk.d)), h = pile(t);
          return { x: lerp(B[0], h.x, k), y: lerp(B[1], h.y, k), r: lerp(rr + spin * .5, h.r, k), s: lerp(.2, h.s, k), dep: -1 };
        } : t => { // opustí vír po oblouku do hromádky
          if (t <= pk.t0) return orbitRaw(t);
          const k = clamp01((t - pk.t0) / pk.d), h = pile(t);
          if (k >= 1) return h;
          const e = E.io2(k), o = orbitRaw(pk.t0 + .12 * (1 - Math.exp((pk.t0 - t) / .12))); // vír ji pustí plynule (dál už nestoupá)
          return { x: lerp(o.x, h.x, e), y: lerp(o.y, h.y, e) - pk.arc * Math.sin(Math.PI * k) ** 2, r: lerp(o.r, h.r, e), s: lerp(o.s, h.s, e), dep: lerp(o.dep, -1, e) };
        };
        const at = t => { // 2,94 výstřel z bodu B → 3,2–3,8 plynule do orbity (i hloubka se prolíná, žádný skok)
          if (pk && pk.t0 == null) return orbit(t);
          const k = E.outX(clamp01((t - 2.94) / .36));
          const rad = { x: B[0] + (ex - B[0]) * k, y: B[1] + (ey - B[1]) * k, r: rr + spin * k, s: lerp(.2, sc, k), dep: 1 };
          if (t <= 3.2) return rad;
          const o = orbit(t), m = smooth(3.2, 3.8, t);
          return { x: lerp(rad.x, o.x, m), y: lerp(rad.y, o.y, m), r: lerp(rad.r, o.r, m), s: lerp(rad.s, o.s, m), dep: lerp(1, o.dep, m) };
        };
        return { at, orbit };
      });
    }

    /* =========================================================
       POZA – scénář maskota (kap. 4 motion scriptu). Časy v s.
       ========================================================= */
    function buildPose() {
      const P = new TL(), o = PS;
      P.tr(o).virtual = true;
      const [Hx, Hy] = L.st.H, [Cx, Cy] = L.st.C, [H5x, H5y] = L.st.H5, [Dx, Dy] = L.st.D || L.st.H; // D = desktop: vznášení v tmavém světě
      const isM = !!L.mob;
      P.base(o, {
        fx: Dx, gy: Dy, ry: 0, gl: 0, lean: 0, gLean: 0, rot: 0, hr: 0, hx: 0, hy: 0, lookX: -.5, lookY: -.4,
        happy: 0, mouth: 1, cheek: 1, flame: 1, squint: 0,
        La: PRE.offer.a1, Lb: PRE.offer.b, L1: PRE.offer.l1, L2: PRE.offer.l2,
        Ra: PRE.hold.a1, Rb: PRE.hold.b, R1: PRE.hold.l1, R2: PRE.hold.l2,
        dLa: 0, dLb: 0, dRa: 0, phoneRot: 0, wI: 1, wW1: 0, wFl: 0, wHop: 0, wIK: 0, mglow: .45, shadow: 0, flick: 1,
      });
      const to = (v, t0, d = .2, e = E.io2) => P.to(o, v, t0, d, e);
      const arm = (s, name, t0, d = .2, e = E.io2, da = 0) => { const p = PRE[name], S = s === 'l' ? 'L' : 'R'; to({ [S + 'a']: p.a1 + da, [S + 'b']: p.b, [S + '1']: p.l1, [S + '2']: p.l2 }, t0, d, e); };
      const look = (x, y, t0, d = .12, e = E.io2) => to({ lookX: x, lookY: y }, t0, d, e);
      const lookW = (target, t0, from, d = .12) => { const l = lookAt(from, target); look(l[0], l[1], t0, d); };
      const pulse = (k, amp, t0, up, down, e1 = E.out2, e2 = E.springIn) => { to({ [k]: amp }, t0, up, e1); to({ [k]: 0 }, t0 + up, down, e2); };
      const glide = (t0, t1, x, y) => { to({ fx: x, gy: y }, t0, t1 - t0, E.io3); const q = (t1 - t0) * .25; to({ gl: L.lift * -1 }, t0, q); to({ gl: 0 }, t1 - q, q); };
      const glideLean = (t0, t1, peak, arrive) => { const d = t1 - t0; to({ gLean: peak }, t0 - .08, d / 2 + .08); to({ gLean: arrive }, t0 + d / 2, d / 2); to({ gLean: 0 }, t1, .38, E.springIn); };
      const u = L.u, headOff = [(-14) * u, (-201) * u]; // střed hlavy od chodidel (nominálně)
      const headAt = (x, y, f = 0) => [x + headOff[0], y - f + headOff[1]];
      LAYERS = [{ w: 'wW1', t0: .9, act: 'wave' }, { w: 'wHop', t0: 13.02, act: 'hop' }, { w: 'wFl', t0: 18.7, act: 'flap' }];

      // ---- BEAT 1 · 0–2,9 · „Ahoj, tady Sparkee“ ----
      look(-.5, -.6, .24, .14);
      look(.1, -1, .38, .2);                                  // sleduje jiskru nahoru k plamínku
      look(0, 0, .62, .14);                                    // do kamery
      to({ flame: 1.25 }, .62, .15, E.out2); to({ flame: 1.08 }, .77, .23);
      to({ mglow: 1 }, .62, .6, E.out3);
      to({ happy: 1 }, .7, .22); to({ mouth: 1.28, cheek: 1.14 }, .7, .22); to({ hr: 4 }, .7, .3);
      to({ wW1: 1 }, .9, .1); to({ wW1: 0 }, 1.85, .22);       // MÁVÁNÍ (akce riggu)
      to({ happy: 0, mouth: 1, cheek: 1 }, 2.1, .2); to({ hr: 0 }, 2.1, .3);
      look(-.4, -.6, 2.1, .12);                                 // přilétající jiskra
      pulse('dLa', 6, 2.3, .08, .3);                           // CHYCENÍ – tlapka pod váhou klesne
      // HOD spodním švihem (tlapka pod lalokem hlavy, gesto je čitelné): nápřah dolů, švih vpřed-nahoru, jiskra jede na tlapce
      const rel = L.rel, w0 = Math.max(2.33, rel - .29), w1 = rel - .09; // D 2,35 / 2,55 / uvolnění 2,64
      to({ lean: 9 }, w0, w1 - w0); arm('l', 'down', w0, w1 - w0);
      to({ squint: .35 }, w0 + .05, .05); to({ squint: 0 }, rel + .02, .06);
      look(-.8, -.5, w0 + .03, .1);
      arm('l', 'out', w1, .11); to({ lean: -11 }, w1 + .02, .16);
      look(-1, -.3, rel - .02, .08);
      // ---- BEAT 2 · 2,9–6,8 · chaos ----
      glide(2.72, 3.45, Cx, Cy);                                // H → C
      to({ lean: -8 }, w1 + .18, .3);
      arm('l', 'rest', 2.8, .45);
      look(-.6, -.5, 2.85, .15);
      to({ mglow: 0 }, 2.95, .4, E.lin); to({ shadow: 1 }, 3.15, .3, E.lin);
      to({ lean: 12 }, 3.3, .14, E.out2); to({ lean: 2 }, 3.44, .5, E.springIn); // překvapení
      arm('l', 'cheer', 3.3, .12, E.out2); arm('r', 'yayR', 3.3, .12, E.out2);
      to({ phoneRot: 12 }, 3.3, .12); to({ mouth: .7 }, 3.3, .1);
      to({ flame: 1.3 }, 3.3, .1, E.out2); to({ flick: 1.6 }, 3.3, .1); to({ flick: 1 }, 4.3, .3);
      to({ wI: .6 }, 3.8, .3);                                  // nervózní
      arm('l', 'rest', 3.8, .5); arm('r', 'hold', 3.8, .5); to({ phoneRot: 0 }, 3.8, .5); to({ flame: 1.1 }, 3.8, .4);
      pulse('dLa', -8, 3.95, .04, .08, E.out2, E.io2); pulse('dLa', -8, 4.2, .04, .08, E.out2, E.io2);
      const hC = headAt(Cx, Cy);
      [3.6, 4.0, 4.6, 5.2, 5.8].forEach(ts => {              // sakády na nejbližší (přední) položku víru
        let best = null;
        SW.forEach(s => { const q = s.at(ts); if (!best || q.dep > best.dep) best = q; });
        lookW([best.x, best.y], ts, hC, .1);
      });
      to({ lean: 8 }, 4.35, .1, E.out2); to({ lean: 2 }, 4.45, .35, E.springIn);   // uhnutí
      to({ ry: .6 }, 4.35, .1, E.out2); to({ ry: 0 }, 4.45, .35, E.springIn);
      pulse('dLa', -6, 4.35, .1, .35);
      to({ squint: .6 }, 4.35, .03); to({ squint: 0 }, 4.5, .05);
      to({ lean: -8 }, 5.45, .1, E.out2); to({ lean: 2 }, 5.55, .35, E.springIn);  // zrcadlové uhnutí
      to({ ry: .6 }, 5.45, .1, E.out2); to({ ry: 0 }, 5.55, .35, E.springIn);
      to({ wI: .3 }, 6.3, .15); to({ lean: 0 }, 6.3, .15); look(0, 0, 6.3, .12); to({ mouth: .92, flame: 1 }, 6.3, .15); // klid
      to({ ry: .8 }, 6.45, .3); to({ lean: 6 }, 6.45, .3); arm('l', 'cheer', 6.45, .3); arm('r', 'yayR', 6.45, .3); to({ flame: .9 }, 6.45, .3);
      // ---- BEAT 3 · 6,8–10,25 · systém ----
      to({ ry: 0 }, 6.8, .35, E.spring);                        // PLÁCNUTÍ
      to({ lean: -4 }, 6.8, .08, E.out2); to({ lean: 0 }, 6.88, .4, E.springIn);
      arm('l', 'lowOut', 6.8, .07, E.out3); arm('r', 'hold', 6.8, .07, E.out3, 10);
      to({ flame: 1.2 }, 6.8, .1, E.out2); to({ flame: 1 }, 7.4, .4); to({ mouth: 1 }, 6.8, .2);
      const calC = [G.cal.x + G.cal.w * .6, G.cal.y + G.cal.h * .55];
      lookW(calC, 6.95, hC, .12);
      glide(7.0, 7.6, Hx, Hy); glideLean(7.0, 7.6, 6, -3);     // C → H pozpátku
      to({ wI: 1 }, 7.0, .6);
      arm('l', 'rest', 7.0, .3); arm('r', 'hold', 7.0, .3); arm('l', 'offer', 7.5, .2);
      lookW(calC, 7.08, headAt(Hx, Hy), .15);
      to({ happy: 1 }, 7.55, .2); to({ mouth: 1.25, cheek: 1.12 }, 7.55, .2);
      pulse('hr', 2.5, 7.65, .06, .09, E.out2, E.io2); pulse('hr', 2.5, 7.85, .06, .09, E.out2, E.io2);
      arm('l', 'rest', 8.2, .25); to({ happy: 0, mouth: 1, cheek: 1 }, 8.3, .15);
      const hH = headAt(Hx, Hy);
      look(-.5, .2, 8.4, .1);                                   // odznak u tlapky
      pulse('dLa', 8, 8.46, .03, .05);
      arm('l', 'out', 8.5, .16); look(-.5, -.9, 8.56, .1);                  // nadhoz odznaku dopředu (tlapka pod lalokem)
      lookW([G.ok.cx, G.ok.cy - 4], 8.74, hH, .12); lookW([G.ok.cx, G.ok.cy], 8.98, hH, .12);
      arm('l', 'rest', 8.95, .4); to({ happy: 1 }, 8.95, .15);
      pulse('hr', 3, 8.97, .1, .12, E.out2, E.io2); pulse('hr', 3, 9.2, .1, .12, E.out2, E.io2);
      const heroC = [HERO_IT.cx, HERO_IT.cy];
      look(-.7, .5, 9.45, .12); to({ happy: 0 }, 9.45, .15);
      // ---- šťouchnutí do Reel dlaždice (dosažení vznášením, stanice R) ----
      to({ fx: ST.R.x }, 9.75, .45, E.io3); to({ ry: -ST.R.f }, 9.75, .45);
      to({ lean: -8 }, 9.75, .3); to({ wI: 0 }, 9.75, .15); to({ flame: 1.15 }, 9.75, .3);
      arm('l', 'out', 9.75, .28); arm('l', 'cock', 10.05, .12); arm('l', 'out', 10.17, .08, E.out3);
      lookW(heroC, 9.75, headAt(ST.R.x, Hy, ST.R.f), .2);
      to({ wIK: 1 }, 10.21, .04);
      // ---- BEAT 4 · 10,25–14,2 · obsah ----
      const pinX = t => ST.R.x + (IKT(t)[0] - IKT(10.25)[0]);
      to({ lean: 0 }, 10.35, .3);
      // tah za roh: výška i chodidla sledují roh telefonu, paže zůstává v dosahu (tlapka drží roh)
      const pull = t => {
        const T = IKT(t), k = smooth(10.25, 10.6, t), R = .93 * 47 * u;
        const ry = lerp(-ST.R.f, Math.min(0, T[1] - 1 - (Hy - 108 * u)), k), dy = T[1] - (Hy + ry - 108 * u);
        return { fx: lerp(pinX(t), T[0] + 37 * u + Math.sqrt(Math.max(0, R * R - dy * dy)), k), ry };
      };
      if (!isM) {
        // čas tahu se od 10,6 plynule zastaví (10,66 v 10,72): roh telefonu pak klesne pod dosah paže → odmocnina v pull() by
        // škubla celým maskotem; tlapka roh pouští od 10,7
        const tq = t => (t < 10.6 ? t : t < 10.72 ? t - (t - 10.6) ** 2 / .24 : 10.66), Ax = L.st.A ? L.st.A[0] : Hx; // A: stanice u telefonu
        P.fn(o, 10.25, 10.85, t => { const p = pull(tq(t)), e = E.io2(clamp01((t - 10.6) / .25)); return { fx: lerp(p.fx, Ax, e), ry: p.ry * (1 - e) }; });
        to({ wIK: 0 }, 10.7, .25); arm('l', 'rest', 10.7, .25);
        to({ lean: 6 }, 10.7, .06, E.out2); to({ lean: 0 }, 10.76, .35, E.springIn);   // pustí → zhoupnutí
        to({ wI: 1 }, 10.85, .3);
      } else {
        // mobil: tlapka drží roh až do konce
        P.fn(o, 10.25, 11.1, t => { const p = pull(t); return { fx: p.fx, ry: p.ry * (1 - smooth(10.8, 11.1, t)) }; });
        to({ wI: .4 }, 11.05, .15);
        to({ fx: L.st.A[0] }, 11.1, .3);                        // mobil: úkrok k telefonu, aby palec dosáhl na displej
      }
      to({ flame: 1 }, 10.9, .3);
      lookW([G.phone.cx, G.phone.cy + G.phone.h * .15], 10.4, hH, .15);
      to({ wI: 0 }, 11.2, .2); to({ wIK: 1 }, 11.22, .22);    // tlapka na displej
      pulse('dLa', 4, 11.3, .1, .12, E.io2);
      to({ lean: -3 }, 11.25, .15); to({ lean: 4 }, 11.44, .16);                     // FLICK
      arm('l', 'cheer', 11.44, .14); to({ wIK: 0 }, 11.44, .12);
      look(-.6, -.85, 11.44, .08); look(-.6, -.3, 11.58, .3);
      arm('l', 'out', 11.84, .1); to({ wIK: 1 }, 11.94, .06, E.in2);                 // PALEC STOP
      to({ lean: -5 }, 11.9, .1); to({ lean: isM ? -4 : -2 }, 12.06, .3);       // náklon k telefonu už při dosahu
      look(-.7, -.1, 11.9, .1);
      pulse('dLa', 4, 12.3, .03, .05); pulse('dLa', 4, 12.88, .03, .04); pulse('dLa', 4, 13.0, .03, .04);
      to({ wIK: 0 }, 13.04, .24);
      to({ wHop: 1 }, 13.02, .05, E.lin); to({ wHop: 0 }, 13.9, .15);               // JEDINÝ POSKOK
      to({ wI: 1 }, 13.02, .3); to({ lean: 0 }, 13.02, .2);
      to({ happy: 1 }, 13.02, .2); to({ cheek: 1.2, mouth: 1.32 }, 13.02, .2); to({ flame: 1.15 }, 13.02, .2);
      look(-.6, .3, 13.6, .12);                                // počítadlo lajků
      look(.9, .75, 13.9, .12); to({ hr: -1.2 }, 13.9, .12);   // pohled do vlastního mobilu
      arm('l', 'rest', 13.9, .3);
      to({ happy: 0 }, 13.95, .15); to({ mouth: 1, cheek: 1 }, 13.95, .2); to({ flame: 1 }, 14, .3);
      const [b0, b1] = L.backstep;
      glide(b0, b1, H5x, H5y); glideLean(b0, b1, 5, -1.5);     // couvne → H5
      arm('r', 'out', b0, .3); to({ hr: 0 }, 14.2, .25);
      // ---- BEAT 5 · 14,2–16,9 · čísla ----
      to({ phoneRot: 8 }, 14.44, .08); to({ phoneRot: -90 }, 14.52, .58, k => E.soft(E.io2(k))); // přetočí na ≈ −94° a dosedne
      to({ ry: .8 }, 14.72, .1, E.out2); to({ lean: 10 }, 14.72, .1, E.out2);        // přikrčí se
      to({ squint: .9 }, 14.72, .03); to({ squint: 0 }, 14.87, .05);
      to({ ry: 0 }, 15.0, .3, E.springIn); to({ lean: 0 }, 15.0, .3, E.springIn);
      look(-.8, -.1, 15.1, .12);
      arm('r', 'hold', 15.1, .35); to({ phoneRot: 0 }, 15.15, .4);
      // zvedne se s čárou grafu – plynulá monotónní obálka (data čáry mají poklesy → maskot by poskakoval);
      // čáru sleduje jen pohled
      const lineK = t => E.io3(clamp01((t - 15.45) / 1.25));
      const env = t => E.io2(clamp01((t - 15.55) / 1.15));
      to({ ry: -ST.P.f }, 15.55, 1.15, E.io2);
      to({ lean: -4 }, 15.45, .4); to({ flame: 1.2 }, 15.45, .4);
      arm('l', 'out', 15.6, .3); to({ fx: ST.P.x }, 16.2, .5); to({ wI: 0 }, 16.2, .15);
      arm('l', isM ? 'offer' : 'yayL', 16.2, .4);            // desktop: tlapka výš → menší zvednutí (plamínek zůstane v rámu)
      to({ wIK: 1 }, 16.62, .08);
      [15.45, 15.8, 16.15, 16.5].forEach(ts => { const lh = lutAt(lineK(ts + .1)); lookW(lh, ts, headAt(ts < 16.2 ? H5x : ST.P.x, H5y, ST.P.f * env(ts)), .2); });
      pulse('dLb', -20, 16.8, .04, .06, E.out2, E.io2);         // ÚCHOP
      // ŠVIH nízko (tlapka pod lalokem): IK pustí do 16,90, pak out → lowOut → out; náklon vrcholí s lowOut
      to({ wIK: 0 }, 16.84, .06);
      arm('l', 'out', 16.86, .08); arm('l', 'lowOut', 16.95, .09); arm('l', 'out', 17.05, .1);
      to({ lean: 3 }, 16.86, .08); to({ lean: -6 }, 16.95, .1); to({ lean: 0 }, 17.05, .45, E.springIn);
      look(-1, -.4, 16.92, .1);
      // ---- BEAT 6 · 16,9–20 · jiskra ----
      const fd6 = isM ? .82 : .72;
      to(L.st.D ? { fx: Dx, gy: Dy } : { fx: Hx }, 17.2, fd6); to({ ry: 0 }, 17.2, fd6);          // snese se dolů (io2: max ≈ 0,7 cqw/snímek)
      to({ ry: .3 }, 17.2 + fd6, .1); to({ ry: 0 }, 17.3 + fd6, .35, E.springIn);
      arm('l', 'offer', 17.25, .25); look(-1, -.2, 17.25, .15);
      to({ mglow: 1 }, 17.3, .5, E.lin); to({ shadow: 0 }, 17.2, .3, E.lin); to({ flame: 1.1 }, 17.3, .3);
      to({ wI: 1 }, 17.6, .3);
      look(0, 0, 18.0, .12); to({ happy: 1 }, 18.05, .2); to({ cheek: 1.14, mouth: 1.28 }, 18.05, .2);
      look(-1, -.1, 18.12, .12);                               // na CTA
      to({ lean: -2 }, 18.15, .25); arm('l', 'present', 18.15, .25);
      look(0, 0, 18.66, .1);
      to({ wFl: 1 }, 18.7, .12); to({ wFl: 0 }, 19.22, .2);    // ZAMÁVÁNÍ na rozloučenou (nízko, pod hlavou)
      arm('l', 'offer', 18.85, .2); to({ lean: 0 }, 18.8, .3); to({ flame: 1.1 }, 18.75, .2);
      look(-.5, -.4, 19.5, .15);
      to({ happy: 0 }, 19.7, .1); to({ mouth: 1, cheek: 1 }, 19.7, .15); to({ flame: 1 }, 19.4, .5);
      to({ mglow: .45 }, 19.4, .5, E.lin);
      return P;
    }

    // IK cíle levé tlapky (svět, cqw) – kontakty z kap. 4
    function makeIK() {
      const c = [HERO_IT.cx, HERO_IT.cy], cl = G.cell * 1.12, Ph = G.phone;
      const tileBR = t => { const s = lerp(1, 1.12, E.out2(clamp01((t - 10.25) / .15))); return [c[0] + G.cell * s / 2, c[1] + G.cell * s / 2]; };
      const d0 = [c[0] + cl / 2 - (Ph.x + Ph.w), c[1] + cl / 2 - (Ph.y + Ph.h)];
      const corner = t => { const k = 1 - E.io3(clamp01((t - 10.35) / .75)); return [Ph.x + Ph.w + d0[0] * k, Ph.y + Ph.h + d0[1] * k]; };
      const scr = [Ph.x + Ph.w * L.screenPt[0], Ph.y + Ph.h * L.screenPt[1]];
      return t => {
        if (t < 10.25) return c;                                             // šťouch do středu
        if (t < 10.4) { const d = t < 10.35 ? tileBR(t) : corner(t), k = E.io2((t - 10.25) / .15); return [lerp(c[0], d[0], k), lerp(c[1], d[1], k)]; } // ze středu na roh
        if (t < 11.2) return corner(t);                                      // táhne roh telefonu
        if (t < 11.7) { const k = E.io2(clamp01((t - 11.22) / .22)); const a = corner(11.2); return [lerp(a[0], scr[0], k), lerp(a[1], scr[1], k)]; }
        if (t < 14) return G.stop;                                           // palec na Reelu
        return G.dot;                                                        // koncový bod grafu
      };
    }

    /* =========================================================
       SVĚT – časová osa prvků (kap. 5–6)
       ========================================================= */
    function buildWorld() {
      const T = new TL(), rnd = rng(7), H = L.H, B = L.B, isM = !!L.mob;
      const SPD = isM ? 1.35 : 1, DN = isM ? 1.8 : 1; // mobil: delší dráhy v cqw → o chlup delší přelety

      // ---------- kamera + dolly + paralaxa ----------
      const ck = L.cam, ts = ck.map(k => k[0]);
      const CZ = hermite(ts, ck.map(k => k[1])), CX = hermite(ts, ck.map(k => k[2])), CY = hermite(ts, ck.map(k => k[3]));
      const camAt = t => ({ z: CZ(t) + .012 * pulseK(t, 2.92, .08, .3) + .008 * pulseK(t, 6.8, .06, .3), cx: CX(t), cy: CY(t) - .2 * pulseK(t, 12, .06, .15) });
      const DK = [0, .6, 2.5, 18.2, 19.25, 20];
      const ZB = hermite(DK, [1.25, 1.25, 1, 1, 1.04, 1.25]), PB = hermite(DK, [1, 1, 0, 0, 0, 1]);
      const h0 = headW(0);
      const dollyAt = t => { const z = ZB(t), p = PB(t); return { z, tx: lerp(h0[0], L.dolly[0], p) - z * h0[0], ty: lerp(h0[1], L.dolly[1], p) - z * h0[1] }; };
      G.camAt = camAt;
      T.base(cam, { x: 0, y: 0, s: 1 }).fn(cam, 0, DUR, t => { const c = camAt(t); return { x: 50 - c.z * c.cx, y: L.Hc - c.z * c.cy, s: c.z }; });
      T.base(hero, { x: 0, y: 0, s: 1 }).fn(hero, 0, DUR, t => { const d = dollyAt(t); return { x: d.tx, y: d.ty, s: d.z }; });
      T.base(par, { x: 0, y: 0, s: 1 }).fn(par, 0, DUR, t => {
        const c = camAt(t), d = dollyAt(t), zz = c.z * d.z;
        return { x: .5 * (50 - c.z * c.cx + c.z * d.tx), y: .5 * (L.Hc - c.z * c.cy + c.z * d.ty), s: 1 + .5 * (zz - 1) };
      });
      // hvězdičky: periody celé v 20 s (7 cyklů, 22,5°/s)
      const twinkle = (el, i, x, y) => {
        const ph = i * 1.3, dir = i % 2 ? 1 : -1;
        T.base(el, { x, y }).fn(el, 0, DUR, t => ({ s: .45 + .55 * (.5 + .5 * Math.sin(TAU * 7 * t / 20 + ph)), r: t * 22.5 * dir }));
      };
      TWD.forEach((el, i) => twinkle(el, i, L.tw[i][0], L.tw[i][1]));
      PL.forEach(p => p.tws.forEach((el, i) => twinkle(el, i, 0, 0)));

      // ---------- jiskra (čistá funkce času) ----------
      const halo = L.halo, tilt = halo.tilt * D2R;
      const haloPt = (t, th) => { const c = flameBaseW(t), a = th * D2R, x = halo.rx * Math.cos(a), y = halo.ry * Math.sin(a); return [c[0] + x * Math.cos(tilt) - y * Math.sin(tilt), c[1] + x * Math.sin(tilt) + y * Math.cos(tilt)]; };
      const TH0 = 150 - 360, TH1 = 150;                          // orbita začíná i končí vpředu vlevo (u tlapky)
      const thAt = t => lerp(TH0, TH1, E.io2(clamp01((t - .95) / 1.2)));
      // jiskra nad tlapkou: offset šikmo ven, aby nesplývala s holo hlavou
      const pawUp = (t, k) => { const p = pawW(t), a = L.hold, b = L.hover; return [p[0] + lerp(a[0], b[0], k), p[1] + lerp(a[1], b[1], k)]; };
      const throwY = (() => { let f = null; return () => f || (f = parab(pawUp(L.rel, 0)[1], B[1], L.apexB)); })();
      const SP = new Map();
      function sparkAt(t) {
        t = wrap(t);
        const key = Math.round(t * 1e4);
        let S = SP.get(key);
        if (S) return S;
        let x, y, s, r, o = 1, z = 4;
        const idleS = amp => .35 + amp * Math.sin(TAU * t), idleR = () => 8 * Math.sin(TAU * t / 2.5);
        if (t < .38) {
          [x, y] = pawUp(t, 1); s = idleS(lerp(.04, .07, clamp01((t - .26) / .12))); r = idleR();
        } else if (t < .66) {                                     // k plamínku (oblouk nad špičkou)
          const k = E.io2((t - .38) / .28), p0 = pawUp(.38, 1), p1 = flameTipW(t), cc = [p0[0] - .5, p1[1] - 3];
          x = (1 - k) ** 2 * p0[0] + 2 * k * (1 - k) * cc[0] + k * k * p1[0]; y = (1 - k) ** 2 * p0[1] + 2 * k * (1 - k) * cc[1] + k * k * p1[1];
          s = lerp(.35, .5, E.back2(clamp01((t - .38) / .34))); r = lerp(idleR(), 40, k);
        } else if (t < .95) {                                     // sklouzne na kruh svatozáře
          const k = E.io2((t - .66) / .29), p0 = flameTipW(t), p1 = haloPt(t, TH0);
          x = lerp(p0[0], p1[0], k); y = lerp(p0[1], p1[1], k);
          s = lerp(.35, .5, E.back2(clamp01((t - .38) / .34))); r = 40 + 80 * k;
        } else if (t < 2.15) {                                    // svatozář kolem plamínku
          const th = thAt(t);
          [x, y] = haloPt(t, th); s = lerp(.5, .38, E.io2((t - .95) / 1.2)); r = 120 + (th - TH0) * .6;
          if (Math.sin(th * D2R) < 0) z = 1;                      // zadní polovina za maskotem
        } else if (t < 2.3) {                                     // spadne do tlapky
          const k = E.in2((t - 2.15) / .15), p0 = haloPt(2.15, TH1), p1 = pawUp(t, 0);
          x = lerp(p0[0], p1[0], k); y = lerp(p0[1], p1[1], k); s = .38; r = lerp(336, 360, k);
        } else if (t < L.rel) {
          [x, y] = pawUp(t, 0); s = .38; r = 360;
        } else if (t < 2.92) {                                    // HOD do bodu B: skutečná balistika (x lineárně, y parabola)
          // parametr letu: prvních 30 % (≈ 5 snímků) se jiskra z tlapky rozjíždí, pak rovnoměrně (bez skoku rychlosti)
          const tau = (t - L.rel) / (2.92 - L.rel), c = .3, k = (tau < c ? tau * tau / (2 * c) : tau - c / 2) / (1 - c / 2), p0 = pawUp(L.rel, 0);
          x = lerp(p0[0], B[0], k); y = throwY()(k);
          s = lerp(.38, .28, k); r = 360 + 360 * k;
        } else if (t < 16.8) {                                    // výbuch, pak schovaná
          const k = E.outX(clamp01((t - 2.92) / .5));
          x = B[0]; y = B[1]; s = lerp(.28, 2.2, k); r = 720 + 140 * k; o = 1 - clamp01((t - 2.96) / .16);
        } else if (t < 17.25) {                                   // z tečky grafu do tlapky
          const p = pawW(t), k = E.io2(clamp01((t - 16.8) / .45));
          x = p[0] + L.hold[0] * k; y = p[1] + L.hold[1] * k; s = .3; r = 45 * E.out2(clamp01((t - 16.8) / .3));
        } else if (t < 19.55) {
          const k = E.io2(clamp01((t - 17.25) / .35));
          [x, y] = pawUp(t, 0); s = lerp(.3, idleS(.04), k); r = lerp(45, idleR(), k);
        } else {                                                  // vznese se zpět nad tlapku (= t 0)
          const k = E.out3(clamp01((t - 19.55) / .35));
          [x, y] = pawUp(t, k); s = idleS(.04); r = idleR();
        }
        S = { x, y, s, r, o, z };
        if (SP.size > 900) SP.clear();
        SP.set(key, S);
        return S;
      }
      G.sparkAt = sparkAt;
      T.base(K.spark, { x: 0, y: 0, s: .35, r: 0, o: 1, z: 4 }).fn(K.spark, 0, DUR, t => sparkAt(t));
      T.base(K.sglow, { x: 0, y: 0, s: .5, o: .55, z: 3 }).fn(K.sglow, 0, DUR, t => {
        const S = sparkAt(t);
        let s = .5, o = .55;
        if (t >= .62 && t < L.rel) { s = lerp(lerp(.5, 1.2, E.out2(clamp01((t - .62) / .15))), .8, E.io2(clamp01((t - .77) / .3))); o = lerp(lerp(.55, .9, clamp01((t - .62) / .15)), .6, E.io2(clamp01((t - .77) / .3))); }
        else if (t >= L.rel && t < 2.92) { s = lerp(.8, .6, (t - L.rel) / (2.92 - L.rel)); o = .6; }
        else if (t >= 2.92 && t < 16.8) { const k1 = E.out2(clamp01((t - 2.92) / .25)), k2 = E.out2(clamp01((t - 3.17) / .6)); s = lerp(lerp(.6, 1.6, k1), 2.4, k2); o = lerp(lerp(.6, 1, k1), 0, k2); }
        else if (t >= 16.8 && t < 17.38) {                        // záblesk úchopu: náběh přes 3 snímky, za maskotem
          const k = E.io2(clamp01((t - 16.8) / .05));
          s = .5 + .2 * k * (1 - smooth(17.1, 17.38, t)); o = t < 16.85 ? .6 * k : lerp(.6, .3, E.out2(clamp01((t - 16.85) / .4)));
        } else if (t >= 17.38 && t < 17.7) {                      // záblesk zavření světa do jiskry
          const q = (t - 17.38) / .32, b = Math.sin(Math.PI * q);
          s = .5 + .8 * b; o = lerp(.3, .55, q) + .45 * b;
        } else if (t >= 17.7 && t < 19.9) { s = .5; o = .55; }
        return { x: S.x, y: S.y, s, o, z: S.z === 1 ? 0 : 1 };    // záře vždy za maskotem (nepřebíjí tlapku)
      });
      // stopa (komety): částice k ukazuje jiskru v čase emise, sloty se recyklují až po dohasnutí
      const TR = [[.95, 2.15, .08, .4], [L.rel, 2.92, .02, .2], [18.75, 19.35, .06, .4]];
      TRAIL.forEach((el, j) => {
        T.base(el, { x: 0, y: 0, s: 0, r: 0, o: 0, z: 2 }).fn(el, 0, DUR, t => {
          for (const [t0, t1, dt, life] of TR) {
            if (t < t0 || t > t1 + life) continue;
            const em = Math.floor((t - t0) / dt), e = em - (((em - j) % NTR) + NTR) % NTR, te = t0 + dt * e, age = t - te;
            if (e < 0 || te > t1 || age > life) continue;
            const S = sparkAt(te), a = age / life;
            return { x: S.x, y: S.y, s: S.s * .55 * (1 - .6 * a), r: S.r, o: .85 * (1 - a), z: S.z === 1 ? 0 : 2 };
          }
          return { x: 0, y: 0, s: 0, r: 0, o: 0, z: 2 };
        });
      });
      // šmouha podél rychlosti letící jiskry (hod) – stopa pak nečte jako tečky
      T.base(streak, { x: 0, y: 0, r: 0, sx: 0, o: 0, z: 2 }).fn(streak, L.rel, 3, t => {
        const a = sparkAt(t), b = sparkAt(t - .035), dx = a.x - b.x, dy = a.y - b.y, sp = Math.hypot(dx, dy) / .035;
        return { x: a.x, y: a.y, r: Math.atan2(dy, dx) / D2R, sx: clamp(sp * .045 / 10, 0, 1.2), o: clamp01((sp - 15) / 40) * (1 - smooth(2.9, 2.96, t)) };
      }).set(streak, { o: 0 }, 3);
      // záře maskota
      T.base(K.mglow, { x: 0, y: 0, o: .45 }).fn(K.mglow, 0, DUR, t => { const p = bodyCW(t); return { x: p[0], y: p[1], o: poseAt(t).mglow }; });

      // ---------- BEAT 1 → 2 · výbuch a světlý svět ----------
      T.base(burst, { x: B[0], y: B[1], s: 0, o: 0 }).set(burst, { o: 1 }, 2.92).to(burst, { s: 1 }, 2.92, .45, E.outX).to(burst, { o: 0 }, 3.4, 1, E.io2);
      rings.forEach((el, i) => {
        const t0 = 2.92 + i * .12;
        T.base(el, { x: B[0], y: B[1], s: .05, o: 0 }).set(el, { o: 1 }, t0).to(el, { s: 1 + i * .5 }, t0, .85, E.outX).to(el, { o: 0 }, t0 + .08, .6, E.out2);
      });
      PTS.forEach((el, i) => {
        const a = i / PTS.length * TAU + rnd() * .45, dist = (isM ? 28 : 19) + rnd() * 14, sc = .45 + rnd() * .8, t0 = 2.93 + rnd() * .07, dir = i % 2 ? 1 : -1;
        T.base(el, { x: B[0], y: B[1], s: 0, r: 0, o: 0 }).set(el, { o: 1 }, t0).fn(el, t0, t0 + 1, t => {
          const q = t - t0, k = E.outX(q);
          return { x: B[0] + Math.cos(a) * dist * k, y: B[1] + Math.sin(a) * dist * k * .8, r: k * 220 * dir, s: sc * (q < .06 ? q / .06 : 1 - k * .6), o: 1 - E.in2(clamp01((q - .45) / .55)) };
        }).set(el, { o: 0 }, t0 + 1);
      });
      // plachta A: kruh z bodu B (jen transformace)
      const pa = G.plates[0], pb = G.plates[1];
      const plateOpen = (p, k, dx = 0, dy = 0) => {
        const kk = Math.max(.002, k);
        return [{ x: dx, y: dy, s: kk, o: k * p.Rc > .05 ? 1 : 0 }, { x: -dx / kk, y: -dy / kk, s: 1 / kk }];
      };
      T.base(PL[0].el, { s: .002, o: 0 }).base(PL[0].inn, { s: 500 });
      T.fn(PL[0].el, 2.94, 3.5, t => plateOpen(pa, E.outX(clamp01((t - 2.94) / .56)))[0]);
      T.fn(PL[0].inn, 2.94, 3.5, t => plateOpen(pa, E.outX(clamp01((t - 2.94) / .56)))[1]);
      T.set(PL[0].el, { o: 0 }, 10);
      // plachta B (od 10 s, střed = koncový bod grafu) → imploze do jiskry: io3 (dosedne s nulovou rychlostí, žádné cvaknutí)
      const IM0 = 16.88, IMD = .6;
      const plateB = t => { const k = E.io3(clamp01((t - IM0) / IMD)), S = sparkAt(t), m = E.io2(clamp01((t - IM0) / IMD)); return { k: 1 - k, x: pb.c[0] + (S.x - pb.c[0]) * m, y: pb.c[1] + (S.y - pb.c[1]) * m, r: pb.Rc * (1 - k) }; };
      const implo = t => { const P = plateB(t); return plateOpen(pb, P.k, P.x - pb.c[0], P.y - pb.c[1]); };
      T.base(PL[1].el, { x: 0, y: 0, s: 1, o: 0 }).base(PL[1].inn, { x: 0, y: 0, s: 1 });
      T.set(PL[1].el, { o: 1 }, 10);
      T.fn(PL[1].el, IM0, IM0 + IMD, t => implo(t)[0]);
      T.fn(PL[1].inn, IM0, IM0 + IMD, t => implo(t)[1]);
      T.set(PL[1].el, { o: 0 }, IM0 + IMD);
      // měkký lem (papírová mlha + holo záře) sleduje okraj plachty v obou oknech – hrana světa není ostrý výřez
      T.base(iring, { x: B[0], y: B[1], s: 0, o: 0, wc: 0 })
        .set(iring, { o: 1, wc: 1 }, 2.94).fn(iring, 2.94, 3.5, t => ({ s: pa.Rc * E.outX(clamp01((t - 2.94) / .56)) / 20 })).to(iring, { o: 0 }, 3.25, .25, E.lin).set(iring, { wc: 0 }, 3.5)
        .set(iring, { wc: 1 }, IM0).to(iring, { o: 1 }, IM0, .1, E.lin).fn(iring, IM0, IM0 + IMD, t => { const P = plateB(t); return { x: P.x, y: P.y, s: P.r / 20 }; })
        .to(iring, { o: 0 }, IM0 + IMD - .1, .1, E.lin).set(iring, { wc: 0 }, IM0 + IMD);

      // ---------- BEAT 2 · vír chaosu ----------
      T.base(bang, { x: 0, y: 0, s: 0, r: 0, o: 0 }).fn(bang, 3.32, 4.5, t => {
        const p = flameBaseW(t), s = t < 4.3 ? E.back2(clamp01((t - 3.32) / .3)) : 1 - E.in2(clamp01((t - 4.3) / .2));
        return { x: p[0] + L.bang[0], y: p[1] + L.bang[1], s, r: 8 * Math.sin(TAU * 2 * clamp01((t - 3.5) / .8)) * (1 - clamp01((t - 3.5) / .8)), o: s > .01 ? 1 : 0 };
      });

      // ---------- BEAT 3 · plácnutí → kalendář ----------
      const okLand = 8.62 + .5 * SPD; // odznak dopadne na roh kalendáře (náraz kalendáře)
      const pl = pawW(6.87, 'l', true), prr = pawW(6.87, 'r', true), O = [(pl[0] + prr[0]) / 2, (pl[1] + prr[1]) / 2];
      G.slam = O;
      cal.style.transformOrigin = `${O[0] - G.cal.x}cqw ${O[1] - G.cal.y}cqw`;
      T.base(CR[0], { x: O[0], y: O[1], s: .05, o: 0 }).to(CR[0], { o: 1 }, 6.8, .04, E.lin).to(CR[0], { s: .6 }, 6.8, .5, E.outX).to(CR[0], { o: 0 }, 6.84, .46, E.out2);
      T.base(cal, { o: 0, s: .25, y: 0 }).to(cal, { o: 1 }, 6.82, .12, E.lin).to(cal, { s: 1 }, 6.82, .48, E.soft)
        .to(cal, { y: .3 }, 7.3, .06, E.out2).to(cal, { y: 0 }, 7.36, .25, E.spring)
        .to(cal, { y: .3 }, okLand, .06, E.out2).to(cal, { y: 0 }, okLand + .06, .25, E.spring)
        .to(cal, { s: .94, y: 2, o: 0 }, 10.35, .45, E.in2);
      const calAt = t => ({ s: T.get(cal, 's', t), y: T.get(cal, 'y', t) });
      const glue = (it, t) => { const c = calAt(t); return { x: O[0] + c.s * (it.cx - O[0]), y: O[1] + c.s * (it.cy - O[1]) + c.y, s: c.s }; };
      // pořadí: podle vzdálenosti od bodu plácnutí / od Reel dlaždice
      const rank = (arr, key) => { const s = arr.map((v, i) => [key(v), i]).sort((a, b) => a[0] - b[0]); const r = []; s.forEach(([, i], j) => { r[i] = j / Math.max(1, arr.length - 1); }); return r; };
      // pořadí přeletů: od bodu plácnutí; položky, které v tu chvíli stojí před maskotem, letí až poslední
      // (maskot mezitím odklouže do H, takže jejich dráha do kalendáře nevede přes obličej)
      const frontOver = IT.map((it, i) => {
        const q = SW[i].orbit(6.9), b = bodyAt(6.9), fy = b.gy + b.y * L.u, hw = it.mw * q.s / 2 + .6, hh = it.mh * q.s / 2 + .6;
        return q.dep > 0 && q.x + hw > b.fx - 125 * L.u && q.x - hw < b.fx + 125 * L.u && q.y + hh > fy - 415 * L.u && q.y - hh < fy + 4 * L.u;
      });
      const rSlam = rank(IT, it => Math.hypot(it.cx - O[0], it.cy - O[1]) + (frontOver[IT.indexOf(it)] ? 1000 : 0));
      const others = IT.filter(it => !it.hero);
      const rHero = rank(others, it => Math.hypot(it.cx - HERO_IT.cx, it.cy - HERO_IT.cy));
      IT.forEach((it, i) => {
        const sw = SW[i], ts0 = 6.85 + .65 * rSlam[i], q00 = sw.orbit(ts0);
        const fd = .45 + .2 * clamp01((Math.hypot(q00.x - it.cx, q00.y - it.cy) / DN - 16) / 18), land = ts0 + fd; // dlouhé přelety o chlup déle
        it.land = land;
        const q0 = sw.orbit(ts0), fl = k => E.io2(k) + .25 * k * k * (1 - k); // plynulý rozjezd, lehký přestřel do buňky
        const tExit = it.hero ? 99 : 10.35 + .25 * rHero[others.indexOf(it)];
        const sh = 9 + .03 * (it.row + it.col);
        const stAt = t => { // poloha položky (čistá funkce času) + žádaná vrstva zw
          let x, y, r, s, zw = 4, o = 1, tidy = 0;
          if (t < ts0) { const q = sw.at(t); x = q.x; y = q.y; r = q.r; s = q.s; zw = t >= 3.8 && q.dep > 0 ? 6 : 4; o = clamp01((t - 2.94) / .06); }
          else {
            const g = glue(it, t), k = (t - ts0) / fd;
            if (k < 1) { const e = fl(k), q = sw.orbit(t); x = lerp(q.x, g.x, e); y = lerp(q.y, g.y, e); r = lerp(q.r, 0, e); s = lerp(q.s, g.s, e); tidy = k > .55 ? 1 : 0; }
            else {
              x = g.x; y = g.y; r = 0; tidy = 1;
              s = g.s * (1 + .08 * pulseK(t, land, .05, .3) + .04 * bump(t - sh, .3));
              if (it.hero) s *= (1 + .06 * bump(t - 9.5, .32)) * lerp(1, 1.12, E.out2(clamp01((t - 10.25) / .15)));
            }
            if (t >= tExit) { const e = E.in2(clamp01((t - tExit) / .22)); s *= lerp(1, .6, e); o = 1 - e; }
            if (it.hero && t >= 10.35) o = 1 - clamp01((t - 10.35) / .15); // pod telefonem dohasne (stín zvednutí)
          }
          return { x, y, r, s, o, zw, tidy };
        };
        // vrstva (před/za maskotem) se přepne jen ve chvíli, kdy položka maskota nepřekrývá → žádné „probliknutí“ přes obličej
        const zSw = [];
        {
          let cur = 4;
          for (let tt = 2.94; tt <= land + .02; tt += 1 / 60) {
            const q = stAt(tt);
            if (q.zw === cur) continue;
            const b = bodyAt(tt), fy = b.gy + b.y * L.u, hw = (q.tidy ? G.cell : Math.max(it.mw, it.mh * .6)) * q.s / 2 + .6, hh = (q.tidy ? G.cell : it.mh) * q.s / 2 + .6;
            const hit = q.x + hw > b.fx - 125 * L.u && q.x - hw < b.fx + 125 * L.u && q.y + hh > fy - 415 * L.u && q.y - hh < fy + 4 * L.u;
            if (!hit || q.o < .02) { cur = q.zw; zSw.push([tt, cur]); }
          }
        }
        const zAt = t => { let z = 4; for (const [a, v] of zSw) { if (t >= a) z = v; else break; } return z; };
        T.base(it.el, { o: 0, x: 0, y: 0, r: 0, s: 1, z: 4 }).fn(it.el, 2.94, 10.9, t => {
          const q = stAt(t);
          return { x: q.x - it.cx, y: q.y - it.cy, r: q.r, s: q.s, o: q.o, z: zAt(t) };
        });
        T.base(it.mess, { o: 1, s: 1 }).to(it.mess, { o: 0, s: .5 }, ts0 + .6 * fd, .12, E.in2);
        T.base(it.tidy, { o: 0, s: .4 }).to(it.tidy, { o: 1 }, ts0 + .6 * fd, .12, E.lin).to(it.tidy, { s: 1 }, ts0 + .6 * fd, .3, E.back2);
        T.base(it.flash, { o: 0 }).to(it.flash, { o: .6 }, land - .03, .04, E.lin).to(it.flash, { o: 0 }, land + .01, .25, E.out2);
        if (it.hero) T.base(it.lift, { o: 0 }).to(it.lift, { o: 1 }, 10.25, .15, E.out2);
        else T.base(it.lift, { o: 0 });
      });
      // pulz Reel dlaždice + kontakt tlapky
      const hc = [HERO_IT.cx, HERO_IT.cy];
      T.base(CR[1], { x: hc[0], y: hc[1], s: .8, o: 0 }).to(CR[1], { o: .8 }, 9.5, .06, E.lin).to(CR[1], { s: 1.6 }, 9.5, .5, E.out2).to(CR[1], { o: 0 }, 9.56, .44, E.out2);
      T.base(CR[2], { x: hc[0], y: hc[1], s: .2, o: 0 }).to(CR[2], { o: 1 }, 10.25, .04, E.lin).to(CR[2], { s: 1 }, 10.25, .35, E.out2).to(CR[2], { o: 0 }, 10.29, .31, E.out2);
      // desktop: čipy a KPI stojí ve sloupci titulků → posun kompenzuje kameru (levá hrana drží x = 6 i při nájezdu)
      const pinCam = (px, py, t) => { const c = camAt(t); return [c.cx + (px - 50) / c.z - px, c.cy + (py - L.Hc) / c.z - py]; };
      // barevné kuličky z dlaždic → ikonky služeb
      COPY.chips.forEach((chp, i) => {
        const t1 = 8.15 + i * .1, t0 = t1 - .6, dst = G.chips[i];
        const src = IT.filter(it => !it.hero && it.tile === chp[3] && it.land < t0 - .05).sort((a, b) => a.land - b.land)[0] || IT.filter(it => !it.hero && it.land < t0).sort((a, b) => a.land - b.land)[i] || IT[i];
        // kulička doletí přesně ve velikosti a barvě ikonky → výměna kulička/ikonka je neviditelná
        const beadAt = t => {
          const k = E.io2(clamp01((t - t0) / (t1 - t0))), g = glue(src, t);
          return { x: lerp(g.x, dst.ix, k), y: lerp(g.y, dst.iy, k) - 3 * Math.sin(Math.PI * k), s: Math.min(1, (t - t0) / .1) * lerp(1, dst.iw / L.bead, k) };
        };
        T.base(BEADS[i], { x: src.cx, y: src.cy, s: 0, o: 0, z: 6 }).set(BEADS[i], { o: 1 }, t0).fn(BEADS[i], t0, t1, beadAt).set(BEADS[i], { o: 0 }, t1);
        BEADG[i].forEach((gel, j) => { // stopa: dvě menší průsvitné kuličky o 0,045 / 0,09 s pozadu
          const lag = .045 * (j + 1);
          T.base(gel, { x: src.cx, y: src.cy, s: 0, o: 0, z: 6 }).fn(gel, t0, t1 + lag, t => {
            const q = beadAt(Math.min(t - lag, t1));
            return { x: q.x, y: q.y, s: q.s * (.66 - .16 * j), o: (t - lag < t0 ? 0 : .5 - .18 * j) * (1 - smooth(t1 - .06, t1 + lag, t)) };
          }).set(gel, { o: 0 }, t1 + lag);
        });
        // čip: ohraničené pozadí vyroste zpod ikonky do pilulky (kulatý konec s obrysem jede doprava), popisek se odkrývá pod ním
        const c = CHIPS[i], bg = CHIP_BG[i], lb = CHIP_T[i], rr = [-2, 1.5, 1.2, -1.6][i], gd = .4;
        const bgAt = t => {
          const e = E.out2(clamp01((t - t1 - .02) / gd));
          return { x: lerp(dst.il, 0, e), y: lerp(dst.it, 0, e), w: lerp(dst.iw, dst.w, e), h: lerp(dst.iw, dst.h, e), br: lerp(dst.iw, dst.h, e) / 2 };
        };
        T.base(c, { o: 0, r: 0, x: 0, y: 0, s: 1 }).set(c, { o: 1 }, t1).to(c, { r: rr }, t1 + .05, .4, E.io2);
        T.base(bg, bgAt(t1)).fn(bg, t1, t1 + .02 + gd, bgAt);
        T.base(lb, { o: 0, clip: '' }).to(lb, { o: 1 }, t1 + .06, .12, E.lin)
          .fn(lb, t1, t1 + .02 + gd, t => { const b = bgAt(t), cap = b.x + b.w - b.h * .3 - dst.tl, rg = dst.tw - cap; return { clip: rg > 0 ? `inset(-1cqw ${rg.toFixed(3)}cqw -1cqw -1cqw)` : '' }; })
          .set(lb, { clip: '' }, t1 + .02 + gd);
        T.base(CHIP_I[i], { s: 1 }).fn(CHIP_I[i], t1, t1 + .3, t => ({ s: 1 + .08 * pulseK(t, t1, .08, .22) }));
        T.base(CHIP_I[i].firstChild, { o: 0 }).to(CHIP_I[i].firstChild, { o: 1 }, t1, .12, E.lin);
        // odchod: nasátí do displeje telefonu
        const te = 10.4 + i * .05, sx = dst.cx, sy = dst.cy, ex = G.phone.cx, ey = G.phone.cy;
        const pin = t => (isM ? [0, 0] : pinCam(dst.x, dst.cy, t));
        if (!isM) T.fn(c, t1, te, t => { const p = pin(t); return { x: p[0], y: p[1] }; });
        T.fn(c, te, te + .5, t => { const q = (t - te) / .5, k = E.in2(q), p = pin(t); return { x: (ex - sx) * k + p[0] * (1 - k), y: (ey - sy) * k - .8 * Math.sin(Math.PI * k) + p[1] * (1 - k), s: lerp(1, .3, k), o: 1 - smooth(.25, .75, q) }; });
      });
      // odznak „Vše naplánováno“: vyskočí u tlapky, hod na roh kalendáře
      const okH = [G.ok.cx, G.ok.cy];
      // bez rotace o celou otáčku (nečitelné): jen jemný náklon s jedním překmitem, oblouk io2 s mírným vrcholem
      const okY = (() => { const p = pawW(8.62); return parab(p[1] - .6, okH[1], Math.min(p[1] - .6, okH[1]) - (isM ? 5 : 3.5)); })();
      T.base(okEl, { o: 0, s: 0, r: 0, x: 0, y: 0 }).set(okEl, { o: 1 }, 8.45).fn(okEl, 8.45, okLand, t => {
        if (t < 8.62) { const p = pawW(t); return { x: p[0] - okH[0], y: p[1] - .6 - okH[1], s: .45 * E.back2(clamp01((t - 8.45) / .12)), r: 0 }; }
        const k = (t - 8.62) / (okLand - 8.62), e = E.io2(k), p0 = pawW(8.62);
        return { x: lerp(p0[0], okH[0], e) - okH[0], y: okY(e) - okH[1], s: lerp(.45, 1, E.soft(k)), r: -6 * e + 12 * Math.sin(Math.PI * e) * (1 - e) };
      }).to(okEl, { s: 0, r: 24, o: 0 }, 10.35, .2, E.in2);

      // ---------- BEAT 4 · Reel dlaždice se rozbalí do telefonu ----------
      const Ph = G.phone, cl = G.cell * lerp(1, 1.12, E.out2(2 / 3)), rT = cl * .2;
      const d0 = [HERO_IT.cx + cl / 2 - (Ph.x + Ph.w), HERO_IT.cy + cl / 2 - (Ph.y + Ph.h)];
      const unf = t => E.io3(clamp01((t - 10.35) / .75));
      T.base(phone, { o: 0, x: 0, y: 0, r: 0, s: 1, clip: '', z: 4, wc: 0 }).set(phone, { o: 1, wc: 1 }, 10.35);
      T.fn(phone, 10.35, 11.1, t => {
        const k = unf(t), cw = lerp(cl, Ph.w + 2, k), chh = lerp(cl, Ph.h + 2, k), rr = lerp(rT, Ph.r + 1, k);
        return { x: d0[0] * (1 - k), y: d0[1] * (1 - k), clip: `inset(${(Ph.h + 1 - chh).toFixed(3)}cqw -1cqw -1cqw ${(Ph.w + 1 - cw).toFixed(3)}cqw round ${rr.toFixed(3)}cqw)` };
      }).set(phone, { clip: '' }, 11.1);
      T.fn(phone, 11.1, 11.36, t => { const s = 1 + .015 * pulseK(t, 11.1, .08, .18); return { s, x: (1 - s) * Ph.w / 2, y: (1 - s) * Ph.h / 2 }; });
      T.set(phone, { wc: 0 }, 11.4).set(phone, { wc: 1 }, 14.4);
      // natočení s ministelefonem v tlapce (zrcadlí gesto se zpožděním 0,03 s) → report. Otočení běží samo (14,45–15,0).
      const rotPh = t => pg('phoneRot', t - .03);
      const rc0 = [Ph.cx, Ph.cy], rc1 = [G.dash.cx, G.dash.cy];
      T.fn(phone, 14.47, 15.07, t => { const k = E.io3(clamp01((t - 14.55) / .45)); return { r: rotPh(t), x: (rc1[0] - rc0[0]) * k, y: (rc1[1] - rc0[1]) * k }; });
      // rámeček telefonu drží do předání; telefon (nad reportem) se pak rozplyne do jeho obrysu – obrys je vidět v každém snímku
      T.set(phone, { z: 5 }, 14.9).to(phone, { o: 0 }, 14.95, .12, E.lin).set(phone, { z: 4, wc: 0 }, 15.1);
      T.base(PH.bezel, { o: 0 }).to(PH.bezel, { o: 1 }, 10.65, .25, E.lin);
      T.base(PH.white, { o: 0 }).to(PH.white, { o: 1 }, 14.73, .09, E.lin);
      T.base(PH.tile, { o: 1 }).to(PH.tile, { o: 0 }, 10.8, .22, E.lin);
      T.base(PH.tilein, { x: 0, y: 0, s: 1 }).fn(PH.tilein, 10.35, 11.02, t => {
        const k = unf(t), cw = lerp(cl, Ph.w, k), chh = lerp(cl, Ph.h, k);
        const cx = Ph.w - cw / 2, cy = Ph.h - chh / 2;
        return { x: cx - cl / 2, y: cy - cl / 2, s: Math.min(cw, chh) / cl };
      });
      // feed: tah prstem (11,40–11,50 in2 s tlapkou) → setrvačnost (bez skoku rychlosti) → dosednutí
      const stop = G.stop, S0 = G.feedTop + G.reelBottom - stop[1];
      G.scroll = S0;
      const D1 = S0 * 1.008, fA = 11.44, fB = 11.54, vB = 2.4 / (12 - fB), dA = D1 * vB / (2 / (fB - fA) + vB); // rychlost na konci tahu = rychlost na začátku setrvačnosti
      T.base(PH.feed, { y: 0 }).fn(PH.feed, fA, 12.0, t => {
        if (t < fB) { const k = (t - fA) / (fB - fA); return { y: -dA * k * k }; }
        const k = (t - fB) / (12 - fB); return { y: -(dA + (D1 - dA) * (1 - (1 - k) ** 2.4)) };
      }).to(PH.feed, { y: -S0 }, 12.0, .18, E.io2);
      T.base(CR[3], { x: stop[0], y: stop[1], s: .2, o: 0 }).to(CR[3], { o: 1 }, 12.0, .04, E.lin).to(CR[3], { s: 1 }, 12.0, .35, E.out2).to(CR[3], { o: 0 }, 12.04, .31, E.out2);
      // play: vyskočí (12,10–12,28) → ťuk (12,30) → prask (12,38) – segmenty se nepřekrývají
      T.base(R.play, { o: 0, s: 0 }).to(R.play, { o: 1 }, 12.1, .1, E.lin).to(R.play, { s: 1 }, 12.1, .18, E.back2)
        .to(R.play, { s: .8 }, 12.3, .06, E.out2).to(R.play, { s: 1.6 }, 12.38, .3, E.out2).to(R.play, { o: 0 }, 12.38, .3, E.out2);
      T.base(R.bar, { sx: 0 }).to(R.bar, { sx: 1 }, 12.38, 1.92, E.lin);
      T.base(R.head, { y: 0 }).fn(R.head, 12.38, 14.4, t => ({ y: -Math.abs(Math.sin(Math.PI * 2.2 * (t - 12.38))) * Ph.w * .05 }));
      T.base(R.big, { o: 0, s: 0, y: 0 }).set(R.big, { o: 1 }, 13.01).fn(R.big, 13.01, 13.41, t => ({ s: kf(t - 13.01, [[0, 0], [.22, 1.25, 'o2'], [.4, 1, 'sine']]) }))
        .to(R.big, { y: -3, o: 0 }, 13.45, .35, E.in2);
      T.base(R.like, { o: 0, s: .4 }).to(R.like, { o: 1 }, 13.02, .06, E.lin).to(R.like, { s: 1 }, 13.02, .5, E.back2);
      T.meta(R.likeN, { fmt: FMT.int }).base(R.likeN, { n: COPY.likes[0] }).to(R.likeN, { n: COPY.likes[1] }, 13.05, 1.25, E.out3);
      // srdíčka: 12 = jedno na sloupec grafu; střemhlav do sloupců až když report stojí (od 15,25)
      const like = [G.like.x, G.like.y - S0], HL = L.hearts;
      HEARTS.forEach((el, i) => {
        const col = i % HL.cols, row = i / HL.cols | 0;
        const sx = HL.cols > 1 ? lerp(HL.x[0], HL.x[1], col / (HL.cols - 1)) : HL.x[0], sy = HL.rows > 1 ? lerp(HL.y[0], HL.y[1], row / (HL.rows - 1)) : HL.y[0];
        const t0 = 13.1 + .07 * i, tr = .8 * SPD, ta = t0 + tr, td = 15.25 + .05 * i, ti = td + .45, sc = .75 + rnd() * .4, rr = (rnd() - .5) * 40, swg = (rnd() < .5 ? -1 : 1) * 1.2, bp = rnd() * TAU;
        const foot = G.barFoot[i] || G.barFoot[G.barFoot.length - 1];
        const at = t => {
          if (t < ta) { const k = (t - t0) / tr, e = isM ? E.out2(k) : E.out3(k); return [lerp(like[0], sx, e) + swg * Math.sin(Math.PI * 2 * k) * (1 - k), lerp(like[1], sy, e)]; }
          return [sx, sy + .4 * Math.sin(TAU * (t - ta) / 1.25 + bp) * clamp01((t - ta) / .3)];
        };
        T.base(el, { o: 0, x: like[0], y: like[1], s: 0, r: 0 }).set(el, { o: 1 }, t0).fn(el, t0, ti + .15, t => {
          let p, s = sc * (t - t0 < .16 ? E.back((t - t0) / .16) : 1), r = rr * E.out3(clamp01((t - t0) / tr));
          if (t < td) p = at(t);
          else if (t < ti) { const k = ((t - td) / .45) ** 1.6, a = at(td); p = [lerp(a[0], foot[0], k), lerp(a[1], foot[1], k)]; r = lerp(rr, 0, k); }
          else { p = foot; s = sc * (1 - E.in2(clamp01((t - ti) / .15))); r = 0; }
          return { x: p[0], y: p[1], s, r };
        }).set(el, { o: 0 }, ti + .15);
        // jiskřička při dopadu + sloupec vyroste
        const pt = PTS[i];
        T.set(pt, { o: 1, x: foot[0], y: foot[1] }, ti).fn(pt, ti, ti + .35, t => { const k = (t - ti) / .35; return { x: foot[0], y: foot[1] - 1.2 * E.out2(k), s: .7 * Math.sin(Math.PI * k), r: 180 * k, o: 1 }; }).set(pt, { o: 0 }, ti + .35);
        if (G.CH.bars[i]) T.base(G.CH.bars[i], { sy: 0 }).to(G.CH.bars[i], { sy: 1 }, ti, .5, E.back);
      });
      // komentáře: vyskočí 13,30 + 0,22 i, pak pomalu stoupají až do odletu
      const FL0 = 15.0, FLS = .14, FLD = isM ? .62 : .55, SAVE0 = 14.62; // odlety komentářů → KPI (až když report stojí)
      const flyAt = ci => { const j = COPY.cmtToKpi.findIndex(p => p[0] === ci); return j < 0 ? SAVE0 : FL0 + FLS * j; };
      CMTS.forEach((el, i) => {
        const t0 = isM ? 13.3 + .22 * i : 12.45 + .3 * i, tf = flyAt(i); // desktop: hned po spuštění Reelu (sloupec titulků není prázdný)
        T.base(el, { o: 0, s: .5, y: 1.2, x: 0 }).to(el, { o: 1 }, t0, .12, E.lin).to(el, { s: 1 }, t0, .5, E.back2)
          .to(el, { y: 0 }, t0, .5, E.out3).to(el, { y: -.9 }, t0 + .5, Math.max(.05, tf - t0 - .5), E.lin);
      });

      // ---------- BEAT 5 · report ----------
      // report: ohraničené pozadí startuje na obrysu telefonu naležato (+0,2 cqw) a roste do karty; obsah se odkrývá uvnitř
      const Dd = G.dash, [pT, pR, pB, pL] = Dd.pad, lw = Ph.h + .4, lh = Ph.w + .4;
      const morph = k => ({ x: lerp((Dd.w - lw) / 2, 0, k), y: lerp((Dd.h - lh) / 2, 0, k), w: lerp(lw, Dd.w, k), h: lerp(lh, Dd.h, k), br: lerp(Ph.r + .2, G.radDash, k) });
      const mk = t => E.io3(clamp01((t - 15.0) / .22));
      T.base(dash, { o: 0, s: 1, r: 0, x: 0, y: 0, wc: 0 }).set(dash, { o: 1, wc: 1 }, 14.95)
        .fn(dash, 14.95, 15.13, t => ({ r: rotPh(t) + 90 })).set(dash, { r: 0 }, 15.13)
        .fn(dash, 15.22, 15.43, t => ({ s: 1 + .015 * pulseK(t, 15.22, .06, .15) }))
        .set(dash, { wc: 0 }, 17.4);
      T.base(dashBg, morph(0)).fn(dashBg, 15.0, 15.22, t => morph(mk(t)));
      T.base(dashIn, { clip: '' }).fn(dashIn, 14.95, 15.24, t => {
        const m = morph(mk(t)), f = v => v.toFixed(3) + 'cqw';
        return { clip: `inset(${f(m.y - pT)} ${f(Dd.w - pR - m.x - m.w)} ${f(Dd.h - pB - m.y - m.h)} ${f(m.x - pL)} round ${f(m.br)})` };
      }).set(dashIn, { clip: '' }, 15.24);
      // komentáře → KPI pilulky: text komentáře zmizí do 35 % letu, pak JEDNO ohraničené pozadí přetvaruje pilulku
      // (žádné dva texty ani dva obrysy přes sebe); lety jsou odstupňované, dráhy se nekříží
      COPY.cmtToKpi.forEach(([ci, ki], j) => {
        const el = CMTS[ci], c = G.cmt[ci], kp = G.kpi[ki], kel = KPIS[ki], bg = kel.children[0], cont = [...kel.children].slice(1);
        const t0 = FL0 + FLS * j, t1 = t0 + FLD, tS = t0 + .4 * FLD;
        const cx0 = c.x + c.w / 2, cy0 = c.y - .9 + c.h / 2;
        const pathAt = t => { const k = clamp01((t - t0) / FLD), e = E.io2(k); return [lerp(cx0, kp.cx, e), lerp(cy0, kp.cy, e) - 1.2 * Math.sin(Math.PI * k)]; };
        T.fn(el, t0, tS, t => { const p = pathAt(t); return { x: p[0] - cx0, y: p[1] - cy0 - .9 }; }).set(el, { o: 0 }, tS);
        [...el.children].forEach(ch => T.base(ch, { o: 1 }).to(ch, { o: 0 }, t0, .35 * FLD, E.lin));
        const shp = t => {
          const q = E.io2(clamp01((t - tS) / (t1 - tS))), p = pathAt(t), w = lerp(c.w, kp.w, q), hh = lerp(c.h, kp.h, q);
          return { x: p[0] - w / 2 - kp.x, y: p[1] - hh / 2 - kp.y, w, h: hh, br: lerp(c.h / 2, G.radKpi, q) };
        };
        T.base(kel, { o: 0, x: 0, y: 0, s: 1, r: 0 }).set(kel, { o: 1 }, tS);
        T.base(bg, shp(t1)).fn(bg, tS, t1, shp);
        cont.forEach(e => T.base(e, { o: 0, x: -.8 }).to(e, { o: 1, x: 0 }, t0 + .72 * FLD, .3, E.out3));
        const b = kel.querySelector('b'), k = COPY.kpis[ki];
        T.meta(b, { fmt: FMT[k.fmt] }).base(b, { n: k.from }).to(b, { n: k.to }, t1 + .05, .6, E.out3); // dočítá do 16,55 (plakát 16,6)
      });
      { // „Uloženo do sbírky“ zmizí ve středu otáčejícího se telefonu (ještě před odlety do KPI)
        const ci = 2, el = CMTS[ci], c = G.cmt[ci], t0 = SAVE0;
        T.fn(el, t0, t0 + .38, t => { const k = E.in2((t - t0) / .38); return { x: (G.dash.cx - c.x - c.w / 2) * k, y: (G.dash.cy - c.y) * k - .9, s: lerp(1, .3, k), o: 1 - k }; }).set(el, { o: 0 }, t0 + .38);
      }
      T.base(dashHead, { o: 0, y: -1.5 }).to(dashHead, { o: 1, y: 0 }, 15.05, .3, E.out3);
      T.base(G.CH.line, { d: 0, o: 1 }).to(G.CH.line, { d: 1 }, 15.45, 1.25, E.io3).set(G.CH.line, { o: 0 }, 16.85);
      T.base(G.CH.area, { o: 0 }).to(G.CH.area, { o: 1 }, 15.9, .6, E.lin);
      T.base(G.CH.dot, { s: 0, o: 1 }).to(G.CH.dot, { s: 1 }, 16.7, .25, E.back2).set(G.CH.dot, { o: 0 }, 16.8);
      T.base(G.CH.pulse, { s: 1, o: 0 }).set(G.CH.pulse, { o: .8 }, 16.75).to(G.CH.pulse, { s: 2.8, o: 0 }, 16.75, .8, E.out2);
      // imploze: report a KPI se nasají do jiskry – nejvzdálenější první, dráha io2 (vzdálenost hned na začátku),
      // zmenšení in2, dohasnutí až v posledních 30 % a nikdy mimo zavírající se plachtu
      const suck = [dash, ...KPIS], sc = [[G.dash.cx, G.dash.cy], ...G.kpi.map(k => [k.cx, k.cy])];
      const hd = [Math.hypot(G.dash.w, G.dash.h) / 2, ...G.kpi.map(k => Math.hypot(k.w, k.h) / 2)];
      const sp0 = G.dot;
      sc.map((p, i) => [Math.hypot(p[0] - sp0[0], p[1] - sp0[1]), i]).sort((a, b) => b[0] - a[0]).forEach(([, i], j) => {
        const el = suck[i], c = sc[i], dir = i % 2 ? 20 : -20, t0 = 16.84 + .035 * j, du = .38;
        const pin = t => (isM || !i ? [0, 0] : pinCam(G.kpi[i - 1].x, c[1], t)); // KPI (ne report) drží sloupec titulků
        if (!isM && i) T.fn(el, 15.3, t0, t => { const p = pin(t); return { x: p[0], y: p[1] }; });
        T.fn(el, t0, t0 + du, t => {
          const k = clamp01((t - t0) / du), e = E.io2(k), S = sparkAt(t), s = lerp(1, .06, E.io2(k)), p = pin(t);
          const x = lerp(c[0], S.x, e), y = lerp(c[1], S.y, e), P = plateB(t);
          const inside = clamp01((P.r - Math.hypot(x - P.x, y - P.y) - hd[i] * s) / 3 + 1);
          return { x: x - c[0] + p[0] * (1 - e), y: y - c[1] + p[1] * (1 - e), s, r: dir * e, o: (1 - smooth(.7, 1, k)) * inside };
        }).set(el, { o: 0 }, t0 + du);
      });

      // ---------- titulky (screen space, nikdy se nehýbou s kamerou) ----------
      const wy = L.wy;
      const words = blk => $$('.st-w', blk).filter(w => !w.parentElement.closest('.st-w'));
      const txt = (blk, tk, tw, tout, o = {}) => {
        const st = o.st ?? .07, big = o.big || 0, kick = $('.st-kick', blk), sub = $('.st-sub', blk), W = words(blk), so = o.so ?? .025;
        T.base(blk, { o: 0 }).set(blk, { o: 1 }, tk).set(blk, { o: 0 }, Math.min(19.95, tout + W.length * so + .5));
        if (kick) T.base(kick, { o: 0, y: 1 }).to(kick, { o: 1, y: 0 }, tk, .45, E.out3).to(kick, { o: 0, y: -1 }, o.kout ?? tout, o.kd ?? .2, E.in2);
        W.forEach((w, i) => {
          const ti = (o.at && o.at[i]) || tw + i * st;
          T.base(w, { o: 0, y: wy * (big || 1), r: big ? -7 : 5, s: big ? .7 : 1 }).to(w, { o: 1 }, ti, .2, E.lin);
          // velká slova: měkký dojezd (přestřel scale ≈ 1 %), aby se sousední slova během nájezdu nesrážela
          if (big) T.to(w, { y: 0 }, ti, o.bd ?? .65, E.soft).to(w, { s: 1 }, ti, o.bd ?? .65, E.soft).to(w, { r: 0 }, ti, o.bd ?? .65, E.out3);
          else T.to(w, { y: 0, r: 0, s: 1 }, ti, .55, E.back);
          T.to(w, { y: -L.wOut, o: 0 }, tout + i * so, .28, E.in2);
        });
        if (sub) T.base(sub, { o: 0, y: .8 }).to(sub, { o: 1, y: 0 }, o.sub, .45, E.out3).to(sub, { y: -L.wOut, o: 0 }, tout + W.length * so, .28, E.in2);
      };
      const line = (el, t0) => T.base(el, { sx: 0 }).to(el, { sx: 1 }, t0, .5, E.out3);
      txt(K.t1, isM ? .85 : .5, .95, 2.45, { st: .09, big: 1, so: .03 }); // desktop: kicker dřív (první snímek bez textu kratší)
      txt(K.t2, 3.05, 3.2, 6.85, { sub: 3.75, kd: .12 });
      $$('.st-l', K.t2).forEach((l, i) => T.fn(l, 3.8, 6.4, t => {
        const k = Math.min(1, (t - 3.8) / .3, (6.4 - t) / .25);
        return { r: k * 14 * Math.sin(t * (7 + i * 1.7) + i * 2), y: k * .5 * Math.sin(t * (9 + i) + i) * (wy / 2.2) };
      }));
      txt(K.t3, 7.05, 7.25, 10.45, { sub: 7.85 }); line($('.st-mark__line', K.t3), 7.95); // kicker až po zmizení předchozího
      txt(K.t4, 10.75, 10.85, 13.95, { sub: 11.45 }); line($('.st-mark__line', K.t4), 12.0);
      txt(K.t5, 14.15, 14.25, 16.8, { sub: 14.8, so: .02 }); line($('.st-strike__line', K.t5), 15.5);
      txt(K.t6, 17.4, 17.45, 19.55, { st: .05, big: 1.5, so: .02, kout: 19.6, bd: .5 }); // claim čitelný ≈ 17,9–19,55
      $$('.st-cs', K.t6).forEach((c, i) => T.base(c, { s: 0, r: -90 }).to(c, { s: 1, r: 0 }, 18 + i * .1, .5, E.back2)
        .fn(c, 18.9, 19.4, t => ({ s: 1 + .25 * Math.sin(TAU * (t - 18.9) / .5) })));
      T.base(K.cta, { o: 0, s: .6, y: 1.5, x: 0 }).to(K.cta, { o: 1 }, 18.15, .15, E.lin).to(K.cta, { s: 1, y: 0 }, 18.15, .55, E.back2)
        .to(K.cta, { s: .8, o: 0 }, 19.6, .2, E.in2);
      return T;
    }

    /* ---------- přeletová čára grafu → podtržení „jiskru“ (screen space svg.st-over) ---------- */
    let lastClone = '';
    function renderClone(t) {
      if (!clone) return;
      let str = 'none';
      if (t >= 16.85 && t < 19.9 && G.chart) {
        const c = G.chart, lc = G.lineChart, cm = G.camAt(t), z = cm.z;
        const src = [z * c.sx, z * c.sy, 50 + z * (c.x - cm.cx), L.Hc + z * (c.y - cm.cy)];
        const anc = lc.end; // pravý konec čáry (chart souřadnice)
        const sA = [src[0] * anc[0] + src[2], src[1] * anc[1] + src[3]];
        const j = G.jiskru, tw = (j.x1 - j.x0) / (lc.x1 - lc.x0), th = src[1] * .11;
        const tA = [j.x1, j.y + (anc[1] - (lc.y0 + lc.y1) / 2) * th];
        const k = E.io3(clamp01((t - 17) / .72)), ret = E.in2(clamp01((t - 19.55) / .3));
        const ax = lerp(src[0], tw, k) * (1 - ret), ay = lerp(src[1], th, k), rr = -3 * k * D2R;
        const px = lerp(sA[0], tA[0], k), py = lerp(sA[1], tA[1], k);
        const cs = Math.cos(rr), sn = Math.sin(rr);
        const a = ax * cs, b = ax * sn, cc = -ay * sn, d = ay * cs;
        const e = px - (a * anc[0] + cc * anc[1]), f = py - (b * anc[0] + d * anc[1]);
        str = `matrix(${a.toFixed(5)} ${b.toFixed(5)} ${cc.toFixed(5)} ${d.toFixed(5)} ${e.toFixed(3)} ${f.toFixed(3)})`;
        clone.style.strokeWidth = (G.lineSW * G.camAt(16.85).z).toFixed(2) + 'px';
        clone.style.opacity = t < 19.5 ? '1' : T.get(jiskruW, 'o', t).toFixed(3); // zhasíná se slovem „jiskru“
      }
      if (str !== lastClone) {
        if (str === 'none') clone.style.visibility = 'hidden';
        else { clone.style.visibility = 'visible'; clone.setAttribute('transform', str); }
        lastClone = str;
      }
    }

    /* =========================================================
       SESTAVENÍ – rozložení, stanice (řešené z geometrie), póza, svět
       ========================================================= */
    let T = null;
    function build() {
      L = MQ.matches ? LAYOUTS.m(stageH()) : LAYOUTS.d;
      applyLayout(L);
      buildSwarm();
      BC = new Map(); PC = new Map();
      // stanice R (šťouch) a P (zvednutí): tlapka v kontaktním čase přesně na cíli
      const [Hx, Hy] = L.st.H;
      ST = { R: { x: Hx - 4, f: 2 }, P: { x: L.st.H5[0] - 6, f: 10 } };
      G.stop = [0, 0];
      const heroC = [HERO_IT.cx, HERO_IT.cy];
      for (let it = 0; it < 4; it++) {
        IKT = makeIK();
        Pt = buildPose(); BC = new Map(); PC = new Map();
        const a = pawW(10.25, 'l', true), b = pawW(16.7, 'l', true);
        ST.R.x += heroC[0] - a[0]; ST.R.f += a[1] - heroC[1];
        ST.P.x += G.dot[0] - b[0]; ST.P.f += b[1] - G.dot[1];
        // bod zastavení Reelu = tlapka v pozici out (na displeji, max. u pravého okraje)
        const s = pawW(12.0, 'l', true), Ph = G.phone, F12 = poseAt(12.0, true), sh = W(F12, M.ap(bodyM(F12), SH.l)), reach = (F12.L1 + F12.L2) * L.u * .9;
        const sy = clamp(s[1], Ph.y + Ph.h * .5, Ph.y + Ph.h - Ph.inner - .2), dyS = sy - sh[1];
        G.stop = [Math.max(Math.min(s[0], Ph.x + Ph.w - .25), sh[0] - Math.sqrt(Math.max(0, reach * reach - dyS * dyS))), sy]; // na hraně displeje a v dosahu paže
      }
      IKT = makeIK();
      Pt = buildPose(); BC = new Map(); PC = new Map();
      T = buildWorld();
      lastClone = '';
    }

    /* =========================================================
       PŘEHRÁVAČ – play/pauza, seek, kapitoly, autoplay jen ve výhledu
       ========================================================= */
    const ui = {
      toggle: $('[data-st-toggle]'), replay: $('[data-st-replay]'), track: $('[data-st-track]'), fill: $('[data-st-fill]'),
      pos: $('[data-st-pos]'), time: $('[data-st-time]'), ch: $$('[data-st-chapters] button'), big: $('[data-st-big]'),
    };
    const ctaLink = $('a', K.cta);
    const q = new URLSearchParams(location.search).get('story');
    const testT = q !== null && q !== '' && isFinite(+q) ? Math.max(0, Math.min(DUR - .001, +q)) : null;
    // stránkový přepínač „Pozastavit animace“ (mascot.js: html.is-still + událost sparkee:motion) = žádné autoplay
    const isStill = () => document.documentElement.classList.contains('is-still');
    let t = testT ?? 0, raf = 0, last = 0, running = false;
    let want = !reduced && !isStill() && testT === null;
    let inView = false, hold = false, dragging = false, lastSec = -1, lastCh = -1, chPin = null;
    const once = reduced;

    const chAt = v => { let i = 0; CHAPTERS.forEach((c, j) => { if (v >= c.t) i = j; }); return i; };
    function draw() {
      if (!T) return;
      T.render(t);
      if (rig) rig.render(poseAt(t), wrap(t), L);
      renderClone(t);
      const p = t / DUR;
      ui.fill.style.transform = `scaleX(${p.toFixed(4)})`;
      ui.pos.style.transform = `translateX(${(p * 100).toFixed(3)}%)`;
      // klik na kapitolu za běhu: předjezd 0,3 s už ukazuje zvolenou kapitolu
      if (chPin && (t < chPin.from || t >= chPin.until)) chPin = null;
      const sec = Math.floor(t + 1e-6), ch = chPin ? chPin.i : chAt(t);
      if (sec !== lastSec || ch !== lastCh) {
        ui.time.innerHTML = `<b>0:${String(sec).padStart(2, '0')}</b> / 0:20`;
        ui.track.setAttribute('aria-valuenow', sec);
        ui.track.setAttribute('aria-valuetext', `${sec} s z 20, ${CHAPTERS[ch].name}`);
        lastSec = sec;
      }
      if (ch !== lastCh) { ui.ch.forEach((b, i) => { b.classList.toggle('is-on', i === ch); if (i === ch) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); }); lastCh = ch; }
    }
    function frameLoop(now) {
      raf = 0;
      if (!running) return;
      t += Math.min(.1, (now - last) / 1000); last = now;
      if (t >= DUR) {
        if (once) { t = POSTER; want = false; draw(); sync(); return; }
        t %= DUR;
      }
      draw();
      raf = requestAnimationFrame(frameLoop);
    }
    function sync() {
      const go = want && inView && !hold && !dragging && !document.hidden;
      if (go && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(frameLoop); }
      if (!go && running) { running = false; cancelAnimationFrame(raf); raf = 0; }
      figure.classList.toggle('is-playing', want);
      ui.toggle.setAttribute('aria-label', want ? 'Pozastavit animaci' : 'Přehrát animaci');
      stage.classList.toggle('is-running', running);
      if (running !== lastRun) { lastRun = running; document.dispatchEvent(new CustomEvent('sparkee:story', { detail: { playing: running } })); } // pro scroll maskota (companion.js)
    }
    let lastRun = false;
    const seek = v => { t = Math.max(0, Math.min(DUR - .001, v)); draw(); };
    function setLayout() { build(); lastSec = lastCh = -1; draw(); }
    // změna šířky v rámci stejného rozložení (otočení tabletu, okno) → přepočet geometrie (px hodnoty, tloušťka čáry)
    // mobil: výška scény jde ze svh (neměnná při scrollu) → přepočet i při změně výšky okna
    let lastW = frame.clientWidth, lastH = frame.clientHeight, roT = 0;
    if (window.ResizeObserver) new ResizeObserver(() => {
      const w = frame.clientWidth, fh = frame.clientHeight;
      if (Math.abs(w - lastW) < 1 && (!L || !L.mob || Math.abs(fh - lastH) < 2)) return;
      lastW = w; lastH = fh; clearTimeout(roT); roT = setTimeout(() => { if (T) setLayout(); }, 160);
    }).observe(frame);

    ui.toggle.addEventListener('click', () => {
      want = !want;
      if (want && (once || isStill()) && t >= 18.7) t = 0;
      if (ui.big) ui.big.hidden = true;
      sync();
    });
    ui.replay.addEventListener('click', () => { if (ui.big) ui.big.hidden = true; want = true; seek(0); sync(); });
    if (ui.big) ui.big.addEventListener('click', () => { ui.big.hidden = true; want = true; seek(0); sync(); ui.toggle.focus({ preventScroll: true }); });
    stage.addEventListener('click', () => ui.toggle.click());
    ui.ch.forEach((b, i) => b.addEventListener('click', () => {
      const c = CHAPTERS[i], to = want ? Math.max(0, c.t - (i ? .3 : 0)) : c.poster;
      chPin = want && i ? { i, from: to - .01, until: c.t } : null;
      lastCh = -1; seek(to);
    }));
    const scrub = e => { const r = ui.track.getBoundingClientRect(); seek((e.clientX - r.left) / r.width * DUR); };
    ui.track.addEventListener('pointerdown', e => { dragging = true; ui.track.setPointerCapture(e.pointerId); scrub(e); sync(); });
    ui.track.addEventListener('pointermove', e => { if (dragging) scrub(e); });
    const endDrag = () => { if (dragging) { dragging = false; sync(); } };
    ui.track.addEventListener('pointerup', endDrag);
    ui.track.addEventListener('pointercancel', endDrag);
    ui.track.addEventListener('keydown', e => {
      const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 5, PageDown: -5 }[e.key];
      if (step) { e.preventDefault(); seek(Math.floor(t) + step); }
      else if (e.key === 'Home') { e.preventDefault(); seek(0); }
      else if (e.key === 'End') { e.preventDefault(); seek(POSTER); }
    });
    ['pointerenter', 'focusin'].forEach(ev => K.cta.addEventListener(ev, () => { hold = true; sync(); }));
    ['pointerleave', 'focusout'].forEach(ev => K.cta.addEventListener(ev, () => { hold = false; sync(); }));
    if (ctaLink) ctaLink.removeAttribute('tabindex');

    new IntersectionObserver(([e]) => {
      inView = e.isIntersecting && (e.intersectionRatio >= .5 || e.intersectionRect.height >= innerHeight * .6);
      sync();
    }, { threshold: [0, .25, .5, .75, 1] }).observe(frame);
    document.addEventListener('visibilitychange', sync);
    MQ.addEventListener('change', setLayout);
    document.addEventListener('sparkee:motion', e => {
      const still = !!(e.detail && e.detail.still);
      if (reduced || testT !== null) return;
      if (still) { want = false; if (ui.big) ui.big.hidden = true; }
      else want = true;
      sync();
    });

    root.classList.add('st--js');
    if (reduced) {
      root.classList.add('st--reduced');
      if (testT === null) t = POSTER; // přehrání = ▶ v liště (jedno tlačítko; pilulka „Přehrát animaci“ ve scéně by byla druhé)
    } else if (isStill() && testT === null) t = POSTER; // pozastavené animace: stojí na plakátu, přehrání tlačítkem
    setLayout();
    sync();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { const r = running; setLayout(); if (r) sync(); });

    window.SparkeeStory = {
      seek, play() { want = true; sync(); }, pause() { want = false; sync(); },
      get time() { return t; }, get playing() { return running; },
      debug: { pose: tt => poseAt(tt), paw: tt => pawW(tt), spark: tt => G.sparkAt(tt), G: () => G, L: () => L, ST: () => ST, T: () => T, rig: () => rig, ik: tt => IKT && IKT(tt), check: () => [...T.check(), ...Pt.check()] },
    };
  }
})();
