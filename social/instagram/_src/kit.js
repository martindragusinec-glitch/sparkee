// Sparkee ✦ Instagram kit: layouty. KIT.jobs() = seznam výstupů, KIT.render(id) = vykreslí plátno přesně w×h.
// Maskot: jen originální SVG pózy (assets/img/poses) nebo zmrazený rig (_src/rig), jen rovnoměrné měřítko, posun a rotace.
// Pozice maskota se počítá z jeho viditelného obrysu (bez stínu): x = střed (nebo right/left = hrana obrysu),
// foot = nejnižší bod, h = výška postavičky. Kontroly po vykreslení hlídají obrys maskota proti hranám karet
// (žádné tečování: buď 40 px uvnitř, nebo rozhodně přes hranu), proti okraji plátna a proti textům a štítkům.
import { POSTS, STORIES, PROFILE } from './content.mjs';

const W = 1080, PH = 1350, SH = 1920, P = 72, HZ = 1230, BOTTOM = PH - P;
const CARD_R = P + 936;                 // pravá vnější hrana velké karty
const IN_R = CARD_R - 52;               // pravá hrana obrysu maskota uvnitř karty (5 px rámeček + 40 px vůle + rezerva)
const SWIPE = 'right:118px;top:1150px'; // „Přejeď“ na všech obálkách carouselů na stejném místě
const SPARK_D = 'M12 0c1 7 5 11 12 12-7 1-11 5-12 12-1-7-5-11-12-12C7 11 11 7 12 0z';
const C = { mint: '#A5EDC5', mint2: '#A5EDC5', sky: '#9AD8F8', lilac: '#C49CF2', lilac2: '#C49CF2', blush: '#F5B8DC', mist: '#F5F4FB', ink: '#2C303C' };
const PASTELS = ['mint', 'sky', 'lilac', 'blush'];

/* „s“ z wordmarku (assets/img/logo.svg, první písmeno) pro Figma avatar „kruh s s“: jen převzatá cesta, nic se nepřekresluje */
// „s“ = první (nejlevější) ink cesta wordmarku. Id cest se mezi exporty Figmy mění (v logu 124:3 je „s“ Vector_2,
// Vector_3 je obrys plamínku), proto se písmeno hledá podle polohy, ne podle id.
const LOGO_S = await (async () => {
  const t = await (await fetch('/assets/img/logo.svg')).text();
  const doc = new DOMParser().parseFromString(t, 'image/svg+xml');
  const ink = [...doc.querySelectorAll('path[d]')].filter(p => /^#2C303C$/i.test(p.getAttribute('fill') || ''));
  if (!ink.length) throw new Error('logo.svg: chybí ink cesty wordmarku');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('style', 'position:absolute;left:-9999px;width:10px;height:10px');
  svg.innerHTML = ink.map(p => `<path d="${p.getAttribute('d')}"/>`).join('');
  document.body.appendChild(svg);
  const all = [...svg.children].map((el, i) => { const b = el.getBBox(); return { d: ink[i].getAttribute('d'), box: [b.x, b.y, b.width, b.height] }; });
  svg.remove();
  const s = all.sort((a, b) => a.box[0] - b.box[0])[0];
  if (s.box[2] > s.box[3] * 1.2) throw new Error('logo.svg: nejlevější cesta nevypadá jako písmeno s');
  return s;
})();

/* ---------- pomocníci ---------- */
const poseUrl = p => p.startsWith('rig:') ? `rig/${p.slice(4)}.svg` : `/assets/img/poses/${p}.svg`;
const spk = (cls = '') => `<svg class="spk ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${SPARK_D}"/></svg>`;
/** text z content.mjs → HTML: \n, ✦, nezlomitelné mezery (předložky, čísla) */
function T(s) {
  if (s == null) return '';
  let out = String(s);
  // \u00a0 jako escape: skutečná nezlomitelná mezera se při úpravách souboru ztrácela (pak visely předložky na konci řádku)
  for (let i = 0; i < 2; i++) out = out.replace(/(^|[\s(„>\n])([kvszouaiKVSZOUAI])\s/g, '$1$2\u00a0');
  out = out.replace(/(\d)\s(\d{3})/g, '$1\u00a0$2').replace(/(\d)\s(Kč|%|dnů|dní|měsíců|týdnů|minut|postech|posty|postů|sítě|Reel|Reels|z)/g, '$1\u00a0$2')
    .replace(/\s(až)\s(\d)/g, ' $1\u00a0$2');
  return out.replace(/\s?✦/g, m => (m.length > 1 ? '\u00a0' : '') + spk()).replace(/\n/g, '<br>');
}
const blob = (x, y, d, color, o = 0.5, bl = 120) =>
  `<i class="blob" style="left:${x}px;top:${y}px;width:${d}px;height:${d}px;background:${C[color] || color};--o:${o};--bl:${bl}px"></i>`;
const sp = (x, y, s, { holo = false, fill } = {}) =>
  `<svg class="sp${holo ? ' holo' : ''}" viewBox="0 0 24 24" style="left:${x}px;top:${y}px;--s:${s}px${fill ? `;--f:${C[fill] || fill}` : ''}" aria-hidden="true"><path d="${SPARK_D}"/></svg>`;
const sparks = list => list.map(a => sp(...a)).join('');
/** maskot (+ glow louže na tmavé). rest = sedí/leží na hraně pod sebou (ta se nekontroluje), anchor = selektor prvku, na jehož horní hraně sedí */
function M(pose, o) {
  const { x = 540, right, left, foot = HZ, h, rot = 0, glow = false, z, cls = '', gs = 1, rest = false, anchor } = o;
  let out = '';
  if (glow) out += `<i class="puddle" data-for="${pose}" style="left:${x}px;top:${foot - h * 0.5}px;width:${h * 1.35 * gs}px;height:${h * 1.2 * gs}px"></i>`;
  const d = { pose, x, foot, h, rot, ...(right != null && { right }), ...(left != null && { left }), ...(rest && { rest: 1 }), ...(anchor && { anchor }) };
  out += `<img class="mascot ${cls}" src="${poseUrl(pose)}" alt="" ${Object.entries(d).map(([k, v]) => `data-${k}="${v}"`).join(' ')}${z ? ` style="z-index:${z}"` : ''}>`;
  return out;
}
const mp = (s, def) => M(s.pose, { ...def, ...(s.m || {}) });
const blk = (style, html, cls = '', avoid = false) => `<div class="blk ${cls}" style="${style}"${avoid ? ' data-avoid' : ''}>${html}</div>`;
const H = (txt, fs, extra = '', cls = '') => `<h2 class="h ${cls}" style="--fs:${fs}px;${extra}">${T(txt)}</h2>`;
const Pp = (txt, ps = 40, extra = '') => `<p class="p" style="--ps:${ps}px;${extra}">${T(txt)}</p>`;
const pill = txt => `<div class="pill">${spk()}${T(txt)}</div>`;
const sig = () => `<svg class="sig" viewBox="0 0 24 24" aria-hidden="true"><path d="${SPARK_D}"/></svg>`;
const url = (txt = 'sparkee.cz') => `<span class="url">${spk()}${txt}</span>`;
const swipe = (txt = 'Přejeď') => `<span class="swipe">${txt}<i><svg viewBox="0 0 24 24"><path d="M5 12h13M13 6l6 6-6 6"/></svg></i></span>`;
const tag = (txt, color, cls = '', extra = '') => `<span class="tag ${cls}" style="${color ? `background:${C[color] || color};` : ''}${extra}">${T(txt)}</span>`;
const card = (l, t, w, h, extra = '', cls = '', id = '') => `<div class="card ${cls}"${id ? ` id="${id}"` : ''} style="left:${l}px;top:${t}px;width:${w}px;height:${h}px;${extra}"><i class="pattern" style="--px:100%;--py:0%"></i></div>`;
const headDisc = (size, ring = false) => `<span style="flex:none;display:grid;place-items:center;width:${size}px;height:${size}px;border-radius:50%;${ring ? 'padding:5px;background:conic-gradient(from 200deg,#A5EDC5,#9AD8F8,#C49CF2,#F5B8DC,#A5EDC5);' : ''}">
  <span style="display:grid;place-items:center;width:100%;height:100%;border-radius:50%;background:radial-gradient(closest-side,#5B6A8C,#2C303C);${ring ? 'border:4px solid #fff;' : ''}overflow:hidden">
  <img src="/assets/img/poses/head.svg" alt="" style="width:78%;margin-top:4%"></span></span>`;

/* ikony (tah 4 px, ink), kreslené jen pro UI prvky, ne maskot */
const ICONS = {
  cal: '<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M8 14h3M13 14h3M8 17h3"/>',
  cam: '<rect x="3" y="7" width="18" height="13" rx="3.5"/><path d="M8.5 7l1.5-3h4l1.5 3"/><circle cx="12" cy="13.5" r="3.6"/>',
  star: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20c.6-4 3.3-6.3 7-6.3s6.4 2.3 7 6.3"/><path d="M19 3.2l.6 1.5 1.5.6-1.5.6-.6 1.5-.6-1.5-1.5-.6 1.5-.6z"/>',
  up: '<path d="M4 17l5.5-5.5 4 4L20 9"/><path d="M14.5 9H20v5.5"/>',
  heart: '<path d="M12 20s-7.6-4.5-9.4-9.1C1.2 7.3 3.3 4 6.9 4c2.2 0 3.9 1.2 5.1 3 1.2-1.8 2.9-3 5.1-3 3.6 0 5.7 3.3 4.3 6.9C19.6 15.5 12 20 12 20z"/>',
  save: '<path d="M6.5 3.5h11v17l-5.5-4-5.5 4z"/>',
  send: '<path d="M21 3L10 14M21 3l-7 18-4-7-7-4z"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  x: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  minus: '<path d="M6 12h12"/>',
  post: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M4 15l4.5-4.5 4 4 2.5-2.5 5 5"/>',
  reel: '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M10 9v6l5-3z"/>',
  story: '<circle cx="12" cy="12" r="8" stroke-dasharray="3.6 2.4"/>',
  msg: '<path d="M4 5.5h16v10H9l-5 4z"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  arrow: '<path d="M5 12h13M13 6l6 6-6 6"/>',
  q: '<path d="M9 9.2a3 3 0 1 1 4.2 2.8c-.8.4-1.2 1-1.2 1.9v.6"/><path d="M12 17.6v.2"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  chev: '<path d="M9 5l7 7-7 7"/>',
};
const icon = (k, size = 40, color = 'currentColor', sw = 4) => `<svg class="icon" viewBox="0 0 24 24" style="width:${size}px;height:${size}px;color:${color};--sw:${sw}" aria-hidden="true">${ICONS[k]}</svg>`;
const mark = (inner, bg, size = 62) => `<span class="mark" style="width:${size}px;height:${size}px;background:${bg}">${inner}</span>`;

/* ---------- pozadí ---------- */
function darkBg(blobs, o = {}) {
  return `<div class="bg">${blobs.map(b => blob(...b)).join('')}${o.pattern === false ? '' : `<i class="pattern" style="--px:${o.px || '0%'};--py:${o.py || '0%'}"></i>`}${o.ring ? `<i class="ring" style="left:${o.ring[0]}px;top:${o.ring[1]}px;width:${o.ring[2]}px;height:${o.ring[2]}px"></i>` : ''}</div>`;
}
function lightBg(accent, o = {}) {
  const sec = { mint: 'sky', mint2: 'sky', sky: 'lilac', lilac: 'blush', blush: 'lilac', holo: 'sky' }[accent] || 'sky';
  const a = accent === 'holo' ? 'lilac' : accent;
  const h = o.h || PH;
  return `<div class="bg">${blob(o.ax ?? 1000, o.ay ?? 40, o.ad ?? 720, a, o.ao ?? 0.55, 150)}${blob(o.bx ?? 40, o.by ?? h - 40, o.bd ?? 620, sec, o.bo ?? 0.32, 150)}${o.extra || ''}<i class="pattern" style="--px:0%;--py:0%"></i></div>`;
}
const canvas = (w, h, tone, accent, inner, cls = '') =>
  `<div class="cv ${tone} ${cls}" data-accent="${accent}" style="--w:${w}px;--h:${h}px">${inner}</div>`;

/* =====================================================================
   FEED: světlé dlaždice (mist + pastelová karta nebo předmět, ink text)
   ===================================================================== */
const L = {};

/* P2 obálka: herní karta postavy s holo fólií */
L.charCover = (s, ctx) => `
  ${lightBg(ctx.accent)}
  ${pill(s.pill)}
  ${blk(`left:${P}px;top:176px;width:900px`, H(s.title, 124))}
  ${card(P, 470, 936, 808, '', 'foil')}
  ${blk('left:124px;top:520px;right:124px;display:flex;align-items:center;justify-content:space-between',
    `<div><div class="h" style="--fs:64px;line-height:.9">${s.card.name}</div><div class="kick" style="margin-top:10px">${s.card.type}</div></div>${tag(s.card.lvl, '#fff')}`)}
  <i class="floor" style="left:540px;top:${HZ}px;width:520px;height:90px"></i>
  ${sparks([[210, 760, 44, { holo: true }], [860, 720, 30, { fill: 'lilac2' }], [850, 960, 22, { fill: 'sky' }], [240, 1010, 22, { fill: 'mint' }]])}
  ${mp(s, { x: 540, foot: HZ, h: 640 })}
  ${blk(SWIPE, swipe())}`;

/* P2 profil: řádky údajů */
L.facts = (s, ctx) => `
  ${lightBg(ctx.accent)}${pill(s.pill)}
  ${blk(`left:${P}px;top:180px;width:936px`, H(s.title, 104))}
  ${card(P, 330, 936, 948)}
  ${blk('left:120px;top:382px;width:520px', s.rows.map(([k, v], i) => `
    <div style="padding:${i ? 26 : 0}px 0 26px;${i < s.rows.length - 1 ? 'border-bottom:4px dashed rgba(44,48,60,.18)' : ''}">
      <div class="kick">${k}</div><div class="h" style="--fs:60px;margin-top:6px">${T(v)}</div></div>`).join(''), '', true)}
  ${mp(s, { right: IN_R, foot: HZ, h: 560 })}`;

/* P2 superschopnost: hlava vědomě nad hranou karty, tělo v kartě */
L.power = (s, ctx) => `
  ${lightBg(ctx.accent)}${pill(s.pill)}
  ${blk(`left:${P}px;top:188px`, tag(s.kicker, ctx.accent))}
  ${blk(`left:${P}px;top:282px;width:760px`, H(s.title, 160))}
  ${blk(`left:${P}px;top:630px;width:470px`, Pp(s.text, 42))}
  ${card(P, 860, 936, 418)}
  ${blk('left:116px;top:916px;display:flex;flex-direction:column;gap:22px;align-items:flex-start',
    [['heart', 'Líbí se mi', 'blush'], ['save', 'Uloženo', 'lilac'], ['send', 'Posláno dál', 'sky']]
      .map(([k, t, c]) => `<span class="chipx" style="height:72px;font-size:32px;padding:3px 28px 0 18px"><span class="mark" style="width:48px;height:48px;background:${C[c]};border-width:3px">${icon(k, 26, '#2C303C')}</span>${t}</span>`).join(''))}
  ${sparks([[700, 300, 34, { holo: true }], [985, 560, 22, { fill: 'lilac2' }]])}
  ${mp(s, { right: IN_R, foot: HZ, h: 640 })}`;

/* P2 statistiky jako ve hře: peek vykukuje přes horní hranu karty (tlapky na hraně) */
L.stats = (s, ctx) => {
  const fills = ['mint', 'sky', 'lilac', 'blush'];
  const top = 420;
  return `
  ${lightBg(ctx.accent)}${pill(s.pill)}
  ${blk(`left:${P}px;top:180px;width:600px`, H(s.title, 110))}
  ${card(P, top, 936, BOTTOM - top)}
  ${blk(`left:122px;top:${top + 64}px;width:836px;display:flex;flex-direction:column;gap:62px`, s.stats.map(([k, v], i) => {
    const [a, b] = String(k).split('\n');
    return `<div class="stat"><div class="lab">${T(a)}${b ? `<small>${T(b)}</small>` : ''}</div><div class="val">${v}</div>
      <div class="bar"><i style="width:${Math.max(v, 4)}%;background:linear-gradient(90deg,${C[fills[i]]},${C[fills[(i + 1) % 4]]})${v < 10 ? ';border-right-width:4px' : ''}"></i></div></div>`;
  }).join(''))}
  ${sparks([[700, 250, 30, { holo: true }], [640, 360, 18, { fill: 'sky' }]])}
  ${mp(s, { x: 830, foot: top + 3, h: 250, rest: true })}`;
};

/* seznam v kartě (P2, P6, P8) */
L.list = (s, ctx) => {
  const compact = !!s.compact, bottom = !!s.poseBottom;
  const rowsW = bottom ? 820 : compact ? 640 : 600;
  const mk = (i) => {
    const c = C[PASTELS[i % 4]];
    if (s.mark === 'num') return `<span class="mark" style="background:${c}">${i + 1}</span>`;
    if (s.mark === 'q') return `<span class="mark" style="background:${c}">${icon('q', 34, '#2C303C')}</span>`;
    return `<span class="mark" style="background:${s.mark === 'x' ? C.blush : s.mark === 'minus' ? C.lilac : C.mint}">${icon(s.mark === 'x' ? 'x' : s.mark === 'minus' ? 'minus' : 'check', 32, '#2C303C')}</span>`;
  };
  const titleLines = s.title.split('\n').length;
  const top = titleLines > 1 ? 410 : 330;
  const big = s.items.length <= 4;
  const long = s.items.some(t => t.length > 30);
  const rs = compact ? 34 : big ? (long ? 38 : 42) : 38;
  const def = bottom ? { x: 600, foot: HZ, h: 390 } : { right: IN_R, foot: HZ, h: compact ? 500 : long ? 400 : 540 };
  return `
  ${lightBg(ctx.accent)}${pill(s.pill)}
  ${blk(`left:${P}px;top:180px;width:936px`, H(s.title, titleLines > 1 ? 96 : 104))}
  ${card(P, top, 936, BOTTOM - top)}
  ${blk(`left:116px;top:${top + 44}px;width:${rowsW}px;display:flex;flex-direction:column;gap:${compact ? 16 : big ? 30 : 24}px`,
    s.items.map((t, i) => `<div class="row" style="--rs:${rs}px;padding:${compact ? '14px 24px 14px 16px' : big ? '30px 30px 30px 22px' : ''}">${mk(i)}<span>${T(t)}</span></div>`).join(''), '', !bottom)}
  ${s.foot ? blk(`left:116px;bottom:${P + 40}px;width:520px`, Pp(s.foot, 34, 'font-weight:800;color:#2C303C'), '', true) : ''}
  ${bottom ? `<i class="floor" style="left:600px;top:${HZ}px;width:460px;height:70px"></i>` : ''}
  ${mp(s, def)}`;
};

/* P2 co umím: 4 pilíře jako barevné dlaždice */
L.skills = (s, ctx) => `
  ${lightBg(ctx.accent)}${pill(s.pill)}
  ${blk(`left:${P}px;top:180px;width:936px`, H(s.title, 108))}
  ${blk(`left:${P}px;top:452px;width:540px;display:flex;flex-direction:column;gap:30px`, s.items.map(([k, t], i) => `
    <div class="card" style="position:relative;height:166px;border-radius:40px;box-shadow:9px 9px 0 var(--ink);background:linear-gradient(150deg,#fff 0%,${C[PASTELS[i]]} 100%);display:flex;align-items:center;gap:28px;padding:0 30px">
      <span class="mark" style="width:92px;height:92px;background:#fff">${icon(k, 50, '#2C303C')}</span>
      <span class="h" style="--fs:${t.includes('\n') ? 46 : 52}px;line-height:1.02;position:relative">${T(t)}</span></div>`).join(''))}
  <i class="floor" style="left:830px;top:${HZ + 12}px;width:340px;height:70px"></i>
  ${sparks([[1000, 470, 30, { holo: true }], [720, 330, 22, { fill: 'lilac2' }]])}
  ${mp(s, { right: 1004, foot: HZ, h: 560 })}`;

/* P2 závěr: náhled profilu se záložkou (skutečný předmět místo prázdné karty) */
L.ctaFollow = (s, ctx) => {
  const lines = s.title.split('\n').length, fs = 116, tTop = 176;
  const textTop = tTop + lines * fs + 30;
  return `
  ${lightBg(ctx.accent)}${pill(s.pill)}
  ${blk(`left:${P}px;top:${tTop}px;width:936px`, H(s.title, fs))}
  ${blk(`left:${P}px;top:${textTop}px;width:560px`, Pp(s.text, 42))}
  <div class="panel" style="left:${P}px;top:690px;width:530px;height:420px">
    <div class="abs" style="left:40px;top:40px;display:flex;align-items:center;gap:26px">${headDisc(128, true)}
      <div><div style="font:900 40px/1 var(--fb)">${PROFILE.handle}</div><div style="font:800 26px/1.2 var(--fb);color:#585D6C;margin-top:10px">${T(PROFILE.name)}</div></div></div>
    <div class="abs" style="left:40px;top:214px;width:440px;font:800 30px/1.3 var(--fb);color:#2C303C">${T(PROFILE.bio[0])}</div>
    <div class="abs" style="left:40px;top:300px;display:flex;gap:16px">
      <span style="display:inline-flex;align-items:center;gap:12px;height:76px;padding:4px 34px 0;border-radius:99px;background:var(--ink);color:var(--mist);font:900 32px/1 var(--fb)">Sledovat${spk('pastel')}</span>
      <span style="display:inline-flex;align-items:center;height:76px;padding:4px 30px 0;border-radius:99px;border:4px solid var(--ink);font:900 32px/1 var(--fb)">Zpráva</span></div>
  </div>
  <svg class="abs" viewBox="0 0 90 130" style="z-index:4;left:490px;top:676px;width:84px;height:122px;filter:drop-shadow(6px 6px 0 #2C303C)" aria-hidden="true">
    <path d="M6 4h78v120L45 96 6 124z" fill="${C.lilac}" stroke="#2C303C" stroke-width="6" stroke-linejoin="round"/>
    <path d="M45 30l4 11 11 4-11 4-4 11-4-11-11-4 11-4z" fill="#2C303C"/></svg>
  ${blk(`left:${P}px;top:1170px`, url())}
  <i class="floor" style="left:830px;top:${HZ + 10}px;width:400px;height:80px"></i>
  ${sparks([[1000, textTop + 30, 34, { holo: true }], [700, 640, 22, { fill: 'sky' }]])}
  ${mp(s, { right: 1010, foot: HZ, h: 540 })}`;
};

/* P4 obálka: maskot se válí přes celou dlaždici, bez rámu */
L.lazyCover = (s, ctx) => `
  ${lightBg(ctx.accent, { extra: blob(560, 1000, 760, 'mint', 0.28, 160) })}
  ${pill(s.pill)}
  ${blk(`left:${P}px;top:176px;width:936px`, H(s.title, 128))}
  ${blk(`left:${P}px;top:452px;width:936px`, Pp(s.sub, 48, 'font-weight:800;color:#2C303C'))}
  ${s.chips.map(([k, t], i) => blk(`right:${P + (i ? 0 : 46)}px;top:${560 + i * 108}px;transform:rotate(${i ? 3 : -3}deg)`,
    `<span class="chipx" style="height:84px;font-size:32px;padding:3px 30px 0 16px;gap:16px"><span class="mark" style="width:54px;height:54px;background:${C[i ? 'lilac' : 'sky']};border-width:3px">${icon(k, 30, '#2C303C')}</span>${T(t)}</span>`)).join('')}
  <i class="floor" style="left:440px;top:${HZ + 6}px;width:760px;height:100px"></i>
  ${sparks([[930, 560, 30, { holo: true }], [120, 640, 22, { fill: 'lilac2' }], [860, 900, 20, { fill: 'sky' }]])}
  ${mp(s, { x: 400, foot: HZ, h: 620, rot: -4 })}
  ${blk(SWIPE, swipe())}`;

/* P4 chyba + oprava: maskot střídá stranu (liché vpravo, sudé vlevo), celý uvnitř karty */
L.mistake = (s, ctx) => {
  const leftSide = s.num % 2 === 0, peek = s.pose === 'peek';
  const def = peek ? { right: IN_R, foot: BOTTOM, h: 300, rest: true }
    : leftSide ? { left: 124, foot: HZ, h: 378 } : { right: IN_R, foot: HZ, h: 378 };
  return `
  ${lightBg(ctx.accent)}${pill(s.pill)}
  ${blk(`left:${P}px;top:188px;display:flex;align-items:center;gap:26px`, `
    <span class="mark" style="width:150px;height:150px;border-width:5px;box-shadow:8px 8px 0 var(--ink);font-size:96px;padding-top:12px;background:${C.blush}">${s.num}</span>
    <span class="kick" style="color:#2C303C;font-size:36px">Chyba</span>`)}
  ${blk(`left:${P}px;top:384px;width:936px;display:flex;flex-direction:column;gap:24px`, H(s.title, 116) + Pp(s.text, 44))}
  ${card(P, 810, 936, 468)}
  ${blk(`left:${leftSide ? 470 : 118}px;top:866px;width:${leftSide ? 490 : 540}px;display:flex;flex-direction:column;gap:22px;align-items:flex-start`,
    `<span class="tag" style="background:${C.mint}"><span style="display:grid;place-items:center">${icon('check', 30, '#2C303C')}</span>Oprava</span>` + H(s.fix, s.fix.length > 40 ? 50 : 58, 'line-height:1.06'), '', !leftSide)}
  ${leftSide ? `<i class="floor" style="left:300px;top:${HZ + 8}px;width:320px;height:60px"></i>` : ''}
  ${mp(s, def)}`;
};

/* P4 týdenní plán: posty v gridu + kroužky Stories pod dny (6 ze 7) */
L.week = (s, ctx) => {
  const ic = { post: ['post', C.mint, 'post'], reel: ['reel', C.lilac, 'Reel'], '': [null, 'rgba(255,255,255,.55)', ''] };
  const stories = s.week.filter(d => d[2]).length;
  return `
  ${lightBg(ctx.accent)}${pill(s.pill)}
  ${blk(`left:${P}px;top:188px`, tag(s.kicker, ctx.accent))}
  ${blk(`left:${P}px;top:282px;width:936px`, H(s.title, 116))}
  ${blk(`left:${P}px;top:532px;width:936px`, Pp(s.text, 42))}
  ${card(P, 640, 936, 638)}
  ${blk('left:112px;top:684px;width:856px;display:grid;grid-template-columns:repeat(7,1fr);gap:12px', s.week.map(([d, k, st]) => `
    <div style="display:flex;flex-direction:column;align-items:center;gap:10px">
      <span style="font:900 28px/1 var(--fb);letter-spacing:.04em">${d}</span>
      <span style="width:100%;height:118px;border-radius:26px;border:4px ${k ? 'solid' : 'dashed'} ${k ? 'var(--ink)' : 'rgba(44,48,60,.28)'};background:${ic[k][1]};display:grid;place-items:center;${k ? 'box-shadow:5px 5px 0 var(--ink)' : ''}">${ic[k][0] ? icon(ic[k][0], 50, '#2C303C') : ''}</span>
      <span style="height:22px;font:800 22px/1 var(--fb);color:#2C303C">${ic[k][2]}</span>
      <span style="width:58px;height:58px;border-radius:50%;display:grid;place-items:center;${st ? `background:${C.sky};border:4px solid var(--ink)` : 'border:4px dashed rgba(44,48,60,.28)'}">${st ? icon('story', 34, '#2C303C') : ''}</span></div>`).join(''))}
  ${blk('left:118px;top:1010px;display:flex;flex-direction:column;gap:18px', [['post', C.mint, '2× post'], ['reel', C.lilac, '1× Reel'], ['story', C.sky, `Stories ${stories} dní ze 7`]]
    .map(([k, c, t]) => `<span style="display:flex;align-items:center;gap:18px;font:800 36px/1 var(--fb)">${mark(icon(k, 32, '#2C303C'), c)}${T(t)}</span>`).join(''))}
  ${mp(s, { right: IN_R, foot: HZ, h: 260 })}`;
};

/* P4 závěr: okno zpráv s odeslaným JISKRA */
L.ctaDM = (s, ctx) => {
  const lines = s.title.split('\n').length, fs = 104, tTop = 176;
  return `
  ${lightBg(ctx.accent)}${pill(s.pill)}
  ${blk(`left:${P}px;top:${tTop}px;width:936px`, H(s.title, fs))}
  ${blk(`left:${P}px;top:${tTop + lines * fs + 26}px;width:600px`, Pp(s.text, 42))}
  <div class="panel" style="left:${P}px;top:620px;width:560px;height:500px">
    <div class="bar">${headDisc(64)}<span>${PROFILE.handle}</span><span style="margin-left:auto;font:800 24px/1 var(--fb);color:#585D6C">Zprávy</span></div>
    <div class="abs" style="left:32px;right:32px;top:136px;display:flex;flex-direction:column;gap:22px">
      <span class="msg in" style="align-self:flex-start"><span>${T('Ahoj ✦ S čím ti můžu pomoct?')}</span></span>
      <span class="msg out" style="align-self:flex-end">JISKRA</span></div>
    <div class="abs" style="left:28px;right:28px;bottom:26px;height:84px;border-radius:99px;border:4px solid rgba(44,48,60,.25);display:flex;align-items:center;padding:0 12px 0 32px;font:800 30px/1 var(--fb);color:#8A8E9B">
      Napiš zprávu…<span style="margin-left:auto;display:grid;place-items:center;width:60px;height:60px;border-radius:50%;background:var(--ink)">${icon('send', 30, '#F5F4FB', 3)}</span></div>
  </div>
  ${blk(`left:${P}px;top:1170px`, url())}
  <i class="floor" style="left:850px;top:${HZ + 10}px;width:380px;height:80px"></i>
  ${sparks([[1000, 640, 32, { holo: true }], [760, 700, 20, { fill: 'lilac2' }]])}
  ${mp(s, { right: 1008, foot: HZ, h: 500 })}`;
};

/* P6 obálka: kolik to stojí */
L.priceCover = (s, ctx) => {
  const ptag = (x, y, r, t) => `<div class="blk" style="left:${x}px;top:${y}px;transform:rotate(${r}deg)"><span class="chipx" style="height:84px;font:800 44px/1 var(--fd);padding:6px 30px 0 22px;gap:14px">${t}</span></div>`;
  return `
  ${lightBg(ctx.accent)}${pill(s.pill)}
  ${blk(`left:${P}px;top:176px;width:936px`, H(s.title, 112))}
  ${blk(`left:${P}px;top:528px;width:936px`, Pp(s.sub, 46, 'font-weight:800;color:#2C303C'))}
  ${card(P, 640, 936, 638)}
  ${ptag(120, 730, -10, '? Kč')}${ptag(128, 1000, 7, 'Kč ?')}${ptag(780, 720, 12, '??? Kč')}
  <i class="floor" style="left:540px;top:${HZ}px;width:480px;height:80px"></i>
  ${sparks([[380, 880, 26, { holo: true }], [880, 900, 20, { fill: 'sky' }]])}
  ${mp(s, { x: 540, foot: HZ, h: 500 })}
  ${blk(SWIPE, swipe())}`;
};

/* P6 štítky (rozsah, co posouvá cenu) */
L.chips = (s, ctx) => {
  const lines = s.title.split('\n').length;
  const top = 180 + lines * 100 + 44;
  const peekTop = !!s.peekTop;
  return `
  ${lightBg(ctx.accent)}${pill(s.pill)}
  ${blk(`left:${P}px;top:180px;width:${peekTop ? 700 : 936}px`, H(s.title, 100))}
  ${card(P, top, 936, BOTTOM - top)}
  ${blk(`left:116px;top:${top + 46}px;width:${peekTop ? 848 : s.big ? 640 : 600}px`, `${s.lead ? Pp(s.lead, 38, 'font-weight:800;color:#2C303C;margin-bottom:26px') : ''}
    <div style="display:flex;flex-wrap:wrap;gap:${peekTop ? '34px 22px' : s.big ? '26px 18px' : '22px 18px'}">${s.chips.map((c, i) => `<span class="chipx" style="height:${peekTop ? 108 : 86}px;font-size:${peekTop ? 48 : 40}px;${peekTop ? 'padding:6px 38px 0;' : ''}background:${i % 2 ? '#fff' : C[PASTELS[(i >> 1) % 4]]}">${T(c)}</span>`).join('')}</div>`, '', !peekTop)}
  ${peekTop ? sparks([[260, 1150, 30, { holo: true }], [420, 1210, 18, { fill: 'sky' }]]) : ''}
  ${mp(s, peekTop ? { x: 880, foot: top + 3, h: 220, rest: true } : { right: IN_R, foot: HZ, h: 470 })}`;
};

/* P6 cenová rozpětí jako grafy (bez maskota, graf potřebuje místo) */
L.ranges = (s, ctx) => {
  const x0 = 124, span = 832, max = 90, k = span / max;
  const cols = ['mint', 'sky', 'lilac', 'blush'];
  let y = 424;
  const rows = s.rows.map((r, i) => {
    const y0 = y, head = 58, note = r.note ? 40 : 0, barY = y0 + head + note + 14;
    y = barY + 44 + 44;
    const bar = r.open
      ? `<div class="abs" style="z-index:6;left:${x0 + r.a * k}px;top:${barY}px;width:${(r.b - r.a) * k}px;height:44px;border-radius:99px;border:4px solid var(--ink);box-shadow:5px 5px 0 var(--ink);background:${C[cols[i]]}"></div>
         <div class="abs" style="z-index:6;left:${x0 + r.b * k + 8}px;top:${barY + 2}px;display:flex;align-items:center;gap:0">${icon('chev', 40, '#2C303C', 4)}${icon('chev', 40, 'rgba(44,48,60,.55)', 4)}${icon('chev', 40, 'rgba(44,48,60,.25)', 4)}</div>`
      : `<div class="abs" style="z-index:6;left:${x0 + r.a * k}px;top:${barY}px;width:${(r.b - r.a) * k}px;height:44px;border-radius:99px;border:4px solid var(--ink);box-shadow:5px 5px 0 var(--ink);background:${C[cols[i]]}"></div>`;
    return `${r.us ? `<div class="abs" style="z-index:4;left:${x0 - 26}px;top:${y0 - 18}px;width:${span + 52}px;height:${barY + 44 + 22 - (y0 - 18)}px;border-radius:30px;background:rgba(255,255,255,.75);border:4px solid var(--ink)"></div>` : ''}
      ${blk(`z-index:6;left:${x0}px;top:${y0}px;width:${span}px;display:flex;justify-content:space-between;align-items:baseline`,
        `<span class="h" style="--fs:48px">${T(r.name)}</span><span style="font:900 32px/1 var(--fb)">${T(r.txt)}</span>`)}
      ${r.us ? `<div class="abs" style="z-index:7;left:${x0 + r.b * k + 22}px;top:${barY - 6}px">${tag('✦ to jsme my', 'mint', '', 'height:56px;font-size:24px;padding:3px 20px 0')}</div>` : ''}
      ${r.note ? blk(`z-index:6;left:${x0}px;top:${y0 + head - 4}px`, `<span style="font:800 30px/1 var(--fb);color:#4A4E5B">${T(r.note)}</span>`) : ''}
      <div class="abs" style="z-index:5;left:${x0}px;top:${barY}px;width:${span}px;height:44px;border-radius:99px;background:rgba(255,255,255,.7);border:3px dashed rgba(44,48,60,.18)"></div>
      ${bar}`;
  }).join('');
  const axisY = y - 20, cardTop = 370, cardH = axisY + 60 - cardTop;
  return `
  ${lightBg(ctx.accent)}${pill(s.pill)}
  ${blk(`left:${P}px;top:180px;width:936px`, H(s.title, 90))}
  ${blk(`left:${P}px;top:290px;width:936px`, Pp(s.lead, 36))}
  ${card(P, cardTop, 936, cardH)}
  ${[0, 20, 40, 60, 80].map(v => `<div class="abs" style="z-index:5;left:${x0 + v * k}px;top:${axisY}px;${v ? 'translate:-50% 0;' : ''}font:800 32px/1 var(--fb);color:#4A4E5B">${v ? v + ' tis.' : '0 Kč'}</div>
    <div class="abs" style="z-index:3;left:${x0 + v * k - 1}px;top:${420}px;width:2px;height:${axisY - 436}px;background:rgba(44,48,60,.08)"></div>`).join('')}
  ${rows}
  ${blk(`left:${P}px;top:${cardTop + cardH + 44}px;width:900px`, Pp(s.note, 34, 'font-weight:800'))}`;
};

/* P6 závěr: cena + účtenka (plná karta s obsahem) */
L.ctaPrice = (s, ctx) => `
  ${lightBg(ctx.accent)}${pill(ctx.post.slides[0].pill)}
  ${blk(`left:${P}px;top:188px`, tag(s.kicker, ctx.accent))}
  ${blk(`left:${P}px;top:292px`, Pp(s.pre, 50, 'font-weight:800;color:#2C303C'))}
  ${blk(`left:${P - 6}px;top:344px;white-space:nowrap`, `<div class="h" style="--fs:196px;letter-spacing:-.035em"><em>${T(s.price)}</em></div>`)}
  ${blk(`left:${P}px;top:560px`, Pp(s.post, 50, 'font-weight:800;color:#2C303C'))}
  <div class="panel" style="left:${P}px;top:680px;width:500px;height:440px;border-radius:40px">
    <div class="abs" style="left:34px;right:34px;top:36px;display:flex;flex-direction:column;gap:22px">${s.checks.map((t, i) => `
      <div style="display:flex;align-items:flex-start;gap:18px;font:800 36px/1.18 var(--fb)">${mark(icon('check', 30, '#2C303C'), C[PASTELS[i]], 54)}<span style="padding-top:6px">${T(t)}</span></div>`).join('')}</div>
    <div class="abs" style="left:34px;right:34px;bottom:34px;padding-top:22px;border-top:4px dashed rgba(44,48,60,.2);font:900 32px/1.2 var(--fb)">${T(s.text)}</div>
  </div>
  ${blk(`left:${P}px;top:1170px`, url())}
  <i class="floor" style="left:820px;top:${HZ + 10}px;width:420px;height:80px"></i>
  ${sparks([[930, 640, 30, { holo: true }], [640, 1180, 20, { fill: 'sky' }]])}
  ${mp(s, { right: 1004, foot: HZ, h: 540 })}`;

/* P8 obálka: celoplošná cesta od klubka chaosu přes 3 kroky k reportu, maskot vykukuje přes hranu reportu */
L.pathCover = (s, ctx) => {
  const pts = [[176, 870], [262, 1046], [446, 1170]];
  const rep = { x: 548, y: 790, w: 460, h: 330 };
  const d = `M150 712 C 200 780 160 820 ${pts[0][0]} ${pts[0][1]} S 200 950 ${pts[1][0]} ${pts[1][1]} S 330 1110 ${pts[2][0]} ${pts[2][1]} S 520 1060 ${rep.x - 6} ${rep.y + 170}`;
  return `
  ${lightBg(ctx.accent)}${pill(s.pill)}
  ${blk(`left:${P}px;top:176px;width:936px`, H(s.title, 132))}
  ${blk(`left:${P}px;top:462px;width:936px`, Pp(s.sub, 46, 'font-weight:800;color:#2C303C'))}
  <svg class="abs" style="z-index:3;left:0;top:0;width:1080px;height:1350px;overflow:visible" viewBox="0 0 1080 1350" aria-hidden="true">
    <path d="${d}" fill="none" stroke="#2C303C" stroke-width="6" stroke-linecap="round" stroke-dasharray="2 16" opacity=".55"/>
    <path d="M112 650 c34 -66 124 -34 90 22 s-120 30 -60 -40 s140 10 90 70 s-110 -20 -40 -60 s70 60 20 80" fill="none" stroke="#2C303C" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  ${pts.map(([x, y], i) => `<div class="abs" style="z-index:5;left:${x}px;top:${y}px;translate:-50% -50%;width:88px;height:88px;border-radius:50%;border:5px solid var(--ink);background:${C[PASTELS[i]]};box-shadow:5px 5px 0 var(--ink);display:grid;place-items:center;font:800 44px/1 var(--fd);padding-top:6px">${i + 1}</div>
    <div class="abs" style="z-index:5;${i === 2 ? `left:${x}px;top:${y + 58}px;translate:-50% 0` : `left:${x + 62}px;top:${y - 16}px`};font:900 34px/1 var(--fb);letter-spacing:.06em;text-transform:uppercase">${s.steps[i]}</div>`).join('')}
  <div class="panel" id="report" style="left:${rep.x}px;top:${rep.y}px;width:${rep.w}px;height:${rep.h}px;border-radius:40px">
    <div class="abs" style="left:28px;top:26px;display:flex;align-items:center;gap:14px"><span style="display:grid;place-items:center;width:62px;height:62px;border-radius:50%;border:4px solid var(--ink);background:${C.blush};font:800 32px/1 var(--fd);padding-top:4px">4</span>
      <span style="font:900 30px/1 var(--fb);letter-spacing:.06em;text-transform:uppercase">${s.steps[3]}</span></div>
    <div class="abs" style="left:34px;right:34px;bottom:30px;height:150px;display:flex;align-items:flex-end;gap:22px;border-bottom:4px solid var(--ink)">
      ${[46, 72, 104, 142].map((h, i) => `<span style="flex:1;height:${h}px;border:4px solid var(--ink);border-bottom:0;border-radius:14px 14px 0 0;background:${C[PASTELS[i]]}"></span>`).join('')}</div>
    <div class="abs" style="right:34px;top:30px">${icon('up', 52, '#2C303C')}</div>
  </div>
  ${sparks([[1000, 740, 30, { holo: true }], [470, 820, 22, { fill: 'lilac2' }]])}
  ${mp(s, { x: 790, foot: rep.y + 3, h: 240, rest: true })}
  ${blk(SWIPE, swipe())}`;
};

/* P8 krok 1 až 4: pozici nese horní stepper (bez velkého čísla) */
L.step = (s, ctx) => {
  const steps = ['Audit', 'Plán', 'Tvorba', 'Report'];
  return `
  ${lightBg(ctx.accent)}${pill(s.pill)}
  ${blk(`left:${P}px;top:182px;width:936px;display:grid;grid-template-columns:repeat(4,1fr);gap:14px`, steps.map((t, i) => `
    <div style="height:64px;border-radius:99px;border:4px solid ${i + 1 === s.num ? 'var(--ink)' : 'rgba(44,48,60,.22)'};background:${i + 1 === s.num ? C[PASTELS[i]] : i + 1 < s.num ? 'rgba(255,255,255,.9)' : 'transparent'};
      display:flex;align-items:center;justify-content:center;gap:10px;font:900 27px/1 var(--fb);letter-spacing:.05em;text-transform:uppercase;color:${i + 1 <= s.num ? '#2C303C' : 'rgba(44,48,60,.45)'};padding-top:3px;${i + 1 === s.num ? 'box-shadow:5px 5px 0 var(--ink)' : ''}">
      ${i + 1 < s.num ? icon('check', 26, '#2C303C') : `<b style="font-family:var(--fd);font-size:30px">${i + 1}</b>`}${t}</div>`).join(''))}
  ${card(P, 300, 936, 978)}
  ${blk('left:118px;top:356px', tag(s.when, C[PASTELS[s.num - 1]]))}
  ${blk('left:118px;top:458px;width:640px;display:flex;flex-direction:column;gap:30px', H(s.title, Math.max(...s.title.split('\n').map(l => l.length)) > 9 ? 104 : 116) + Pp(s.text, 42, 'max-width:560px'), 'avoid')}
  ${s.out ? blk('left:118px;bottom:118px;display:flex;flex-direction:column;gap:14px;align-items:flex-start', `<span class="kick">Výstup</span><span class="chipx" style="height:80px;padding:4px 30px 0 16px;gap:16px;font-size:36px">${mark(icon('check', 28, '#2C303C'), C[PASTELS[s.num - 1]], 52)}${T(s.out)}</span>`, '', true) : ''}
  <i class="floor" style="left:800px;top:${HZ + 8}px;width:400px;height:80px"></i>
  ${mp(s, { right: IN_R, foot: HZ, h: 520 })}`;
};

/* P8 balíčky: název, co obsahuje, cena; Glow s holo štítkem */
L.packages = (s, ctx) => {
  const top = 380, cw = (936 - 60) / 3;
  return `
  ${lightBg(ctx.accent)}${pill(s.pill)}
  ${blk(`left:${P}px;top:180px;width:936px`, H(s.title, 112))}
  ${blk(`left:${P}px;top:${top}px;width:936px;display:grid;grid-template-columns:repeat(3,1fr);gap:30px`, s.pkgs.map(([n, what, p], i) => `
    <div class="card" style="position:relative;height:370px;border-radius:44px;box-shadow:10px 10px 0 var(--ink);background:linear-gradient(160deg,#fff 0%,${C[PASTELS[i]]} 100%);padding:34px 28px 30px;display:flex;flex-direction:column">
      <span class="h" style="--fs:62px;position:relative">${n}</span>
      <span style="position:relative;margin-top:10px;font:800 30px/1.2 var(--fb);color:#3A3E4B">${T(what)}</span>
      <span style="position:relative;margin-top:auto;font:800 28px/1 var(--fb);color:#4A4E5B">od</span>
      <span class="h" style="--fs:72px;position:relative;letter-spacing:-.03em;margin-top:2px">${T(p)}</span>
      <span style="position:relative;font:800 26px/1.1 var(--fb);color:#4A4E5B;margin-top:2px">Kč měsíčně</span></div>`).join(''))}
  ${s.pkgs.map(([, , , t], i) => t ? `<div class="abs" style="z-index:6;left:${P + i * (cw + 30) + cw / 2}px;top:${top - 34}px;translate:-50% 0"><span class="url" style="height:64px;font:900 26px/1 var(--fb);letter-spacing:.06em;text-transform:uppercase;padding:3px 24px 0 20px;box-shadow:5px 5px 0 var(--ink)">${spk()}${T(t)}</span></div>` : '').join('')}
  ${blk(`left:${P}px;top:808px;width:560px`, Pp(s.note, 38, 'font-weight:800;color:#2C303C'), '', true)}
  ${card(P, 1010, 520, 268, 'border-radius:44px')}
  ${blk('left:116px;top:1052px;width:440px;display:flex;flex-direction:column;gap:16px;align-items:flex-start', tag(s.bonus[0], 'mint') + Pp(s.bonus[1], 36, 'font-weight:800;color:#2C303C'))}
  <i class="floor" style="left:830px;top:${HZ + 8}px;width:360px;height:70px"></i>
  ${mp(s, { right: 1004, foot: HZ, h: 400 })}`;
};

/* P8 závěr: kalendář se 14. dnem, maskot se na něm válí */
L.ctaCalendar = (s, ctx) => {
  const lines = s.title.split('\n').length, fs = 112, tTop = 176;
  const cal = { x: P, y: 850, w: 936, h: 300 };
  const cw = (cal.w - 60) / 7;
  return `
  ${lightBg(ctx.accent)}${pill(s.pill)}
  ${blk(`left:${P}px;top:${tTop}px;width:936px`, H(s.title, fs))}
  ${blk(`left:${P}px;top:${tTop + lines * fs + 28}px;width:560px`, Pp(s.text, 42))}
  <div class="panel" id="cal" style="left:${cal.x}px;top:${cal.y}px;width:${cal.w}px;height:${cal.h}px;border-radius:44px">
    <div class="abs" style="left:30px;right:30px;top:30px;bottom:30px;display:grid;grid-template-columns:repeat(7,1fr);grid-template-rows:repeat(2,1fr);gap:12px">
      ${Array.from({ length: 14 }, (_, i) => {
        const n = i + 1, hot = n === 14, first = n === 1;
        return `<div style="position:relative;border-radius:22px;border:4px solid ${hot || first ? 'var(--ink)' : 'rgba(44,48,60,.16)'};background:${hot ? 'var(--holo)' : first ? C.blush : 'rgba(245,244,251,.9)'};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px">
          <span style="font:800 ${hot ? 46 : 36}px/1 var(--fd);padding-top:4px;color:${hot || first ? '#2C303C' : '#8A8E9B'}">${n}</span>
          ${first ? `<span style="font:900 17px/1 var(--fb);letter-spacing:.05em;text-transform:uppercase">podpis</span>` : ''}
          ${hot ? `<span style="font:900 17px/1 var(--fb);letter-spacing:.05em;text-transform:uppercase">obsah ✦</span>` : ''}</div>`;
      }).join('')}</div>
  </div>
  ${blk(`left:${P}px;top:1196px`, url())}
  ${sparks([[1000, 560, 30, { holo: true }], [960, 1220, 20, { fill: 'lilac2' }]])}
  ${mp(s, { x: 810, foot: cal.y + 3, h: 330, rest: true })}`;
};

/* =====================================================================
   FEED: tmavé dlaždice (ink + holo bloby, glow za maskotem, mist text)
   ===================================================================== */

/* P1 Reel cover 1080×1920 (grid výřez y 240 až 1680, text v y 380 až 740) */
L.reelCover = s => `
  ${darkBg([[120, 420, 820, 'mint', 0.42, 140], [1000, 980, 760, 'sky', 0.4, 140], [160, 1560, 820, 'lilac2', 0.45, 140], [940, 1800, 560, 'blush', 0.32, 130]], { ring: [540, 1180, 940], px: '0%', py: '20%' })}
  ${blk('left:120px;right:120px;top:404px;text-align:center', H(s.title, 136, 'text-wrap:balance'))}
  ${blk('left:72px;right:72px;top:712px;text-align:center', `<span class="tag" style="background:var(--mist);height:72px;font-size:32px;padding:4px 32px 0">${T(s.sub)}</span>`)}
  ${sparks([[190, 1000, 44, { holo: true }], [900, 880, 30], [960, 1310, 20], [140, 1400, 22], [820, 1560, 16]])}
  ${mp(s, { x: 540, foot: 1550, h: 700, glow: true })}`;

/* P5 Reel cover: když klient chce virál */
L.reelViral = s => `
  ${darkBg([[980, 380, 760, 'lilac2', 0.45, 140], [120, 1000, 700, 'sky', 0.34, 140], [860, 1640, 780, 'blush', 0.4, 140], [100, 1780, 520, 'mint', 0.28, 130]], { px: '100%', py: '10%' })}
  ${blk('left:72px;top:380px;width:936px', H(s.title, 136))}
  <div class="bubble" style="left:72px;top:720px;width:540px;padding:30px 36px 34px;border-radius:44px 44px 44px 12px">
    <div style="font:800 26px/1 var(--fb);color:#6A6F7D;letter-spacing:.02em;display:flex;align-items:center;gap:10px">${icon('msg', 30, '#6A6F7D')}${T(s.meta)}</div>
    <div style="font:900 50px/1.1 var(--fb);margin-top:16px;text-wrap:balance">${T(s.bubble)}</div></div>
  ${blk('left:922px;top:880px', `<div class="h deco" style="--fs:230px;color:${C.blush};transform:rotate(12deg);text-shadow:0 0 40px rgba(245,184,220,.6)">!</div>`)}
  ${sparks([[700, 700, 40, { holo: true }], [160, 1300, 24], [990, 1450, 18]])}
  ${mp(s, { x: 700, foot: 1550, h: 700, glow: true })}`;

/* P3 posuvník freelancer ↔ agentura */
L.slider = s => {
  const ty = HZ;
  return `
  ${darkBg([[980, 120, 720, 'sky', 0.45, 140], [60, 760, 560, 'mint', 0.32, 140], [540, 1420, 900, 'lilac2', 0.42, 150]], { px: '0%', py: '0%' })}
  ${sig()}
  ${blk(`left:${P}px;top:150px;width:900px`, H(s.title, 118))}
  ${blk(`left:${P}px;top:414px;width:936px`, Pp(s.sub, 44, 'font-weight:800;color:#F5F4FB'))}
  <div class="abs" style="z-index:3;left:${P}px;top:${ty - 7}px;width:936px;height:14px;border-radius:99px;background:var(--holo);box-shadow:0 0 30px rgba(154,216,248,.55)"></div>
  ${Array.from({ length: 9 }, (_, i) => `<i class="abs" style="z-index:3;left:${P + 58 + i * 102}px;top:${ty + 26}px;width:6px;height:18px;border-radius:9px;background:rgba(245,244,251,.3)"></i>`).join('')}
  ${[P, W - P].map(x => `<i class="abs" style="z-index:4;left:${x}px;top:${ty}px;translate:-50% -50%;width:40px;height:40px;border-radius:50%;background:var(--ink);border:6px solid var(--mist)"></i>`).join('')}
  ${blk(`left:${P}px;bottom:${PH - ty + 44}px;width:280px`, `<div class="h" style="--fs:52px">${T(s.left[0])}</div>${Pp(s.left[1], 34, 'margin-top:8px')}`)}
  ${blk(`right:${P}px;bottom:${PH - ty + 44}px;width:280px;text-align:right`, `<div class="h" style="--fs:52px">${T(s.right[0])}</div>${Pp(s.right[1], 34, 'margin-top:8px')}`)}
  <div class="abs" style="z-index:5;left:540px;top:${ty}px;translate:-50% -50%;width:190px;height:64px;border-radius:99px;background:var(--holo);border:5px solid var(--ink);box-shadow:0 0 0 5px var(--mist),0 0 50px rgba(196,156,242,.8);display:grid;place-items:center">
    <svg viewBox="0 0 24 24" style="width:34px;height:34px"><path d="${SPARK_D}" fill="#2C303C"/></svg></div>
  ${sparks([[250, 700, 40, { holo: true }], [850, 640, 26], [900, 900, 18], [180, 930, 16]])}
  ${mp(s, { x: 540, foot: ty - 30, h: 620, glow: true })}`;
};

/* P7 bingo */
L.bingo = s => {
  const cols = ['mint', 'sky', 'lilac', 'blush', null, 'mint', 'sky', 'lilac', 'blush'];
  const gx = P, gy = 330, gw = 936, gap = 22, ch = 272;
  return `
  ${darkBg([[80, 140, 640, 'mint', 0.4, 140], [1020, 720, 620, 'sky', 0.34, 140], [180, 1300, 700, 'lilac2', 0.42, 140], [960, 1320, 460, 'blush', 0.3, 130]])}
  ${sig()}
  ${blk(`left:${P}px;top:96px;width:860px`, H(s.title, 96, 'text-wrap:wrap'))}
  <div class="bingo" style="left:${gx}px;top:${gy}px;width:${gw}px;grid-template-rows:repeat(3,${ch}px)">
    ${s.cells.map((t, i) => cols[i] ? `<div class="c" style="background:${C[cols[i]]}">${T(t)}</div>` : `<div class="c free"><span class="kick" style="position:absolute;bottom:22px;color:#F5F4FB;font-size:26px;letter-spacing:.18em">${spk('holo')} FREE</span></div>`).join('')}
  </div>
  <i class="puddle" style="z-index:5;left:540px;top:${gy + ch * 1.5 + gap - 10}px;width:300px;height:280px"></i>
  ${M('head', { x: 540, foot: gy + ch * 2 + gap - 58, h: 196, z: 6 })}
  ${blk(`left:${P}px;right:${P}px;top:1244px;text-align:center`, Pp(s.foot, 40, 'font-weight:900;color:#F5F4FB'))}`;
};

/* P9 CTA (Figma „Máš nápad? Přidáme jiskru.“, 4:5) */
L.ctaDark = s => `
  ${darkBg([[120, 140, 680, 'mint', 0.42, 140], [1000, 440, 660, 'lilac2', 0.45, 140], [860, 1320, 760, 'blush', 0.38, 140], [60, 1180, 600, 'sky', 0.34, 140]])}
  ${sig()}
  ${blk(`left:${P}px;top:150px;width:936px`, H(s.title, 122))}
  ${blk(`left:${P}px;top:430px`, `<span class="tag" style="background:var(--mist);height:70px;font-size:30px;padding:4px 30px 0">${icon('msg', 30, '#2C303C')}${T(s.label)}</span>`)}
  ${blk(`left:${P}px;top:1010px`, `<span class="url" style="height:104px;font:900 44px/1 var(--fb);padding:5px 44px 0 40px;border-width:5px;gap:18px">${T(s.button)}${icon('arrow', 40, '#2C303C')}</span>`)}
  ${blk(`left:${P + 6}px;top:1160px;display:flex;align-items:center;gap:12px;font:800 40px/1 var(--fb);color:#F5F4FB`, `${spk('holo')}sparkee.cz`)}
  ${sparks([[590, 640, 46, { holo: true }], [1000, 700, 28], [980, 1000, 20], [620, 1000, 18], [430, 820, 16]])}
  ${mp(s, { x: 790, foot: HZ, h: 700, glow: true })}`;

/* =====================================================================
   STORIES 1080×1920 (text v y 250 až 1580, x 64 až 1016)
   ===================================================================== */
const SX = 80;
const down = () => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v15M6 13l6 6 6-6" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
/** plocha pro nativní sticker: měkká záře bez rámečku (+ krátká nápověda nad ní) */
const slot = (k, hint) => {
  const pad = 70;
  return `<i class="slot" style="left:${k.x - pad}px;top:${k.y - pad}px;width:${k.w + pad * 2}px;height:${k.h + pad * 2}px"></i>${hint ? `<div class="hint" style="left:${k.x + 8}px;top:${k.y - 62}px">${down()}${T(hint)}</div>` : ''}`;
};

L.storyHello = s => `
  ${darkBg([[120, 300, 760, 'mint', 0.42, 140], [1000, 900, 700, 'sky', 0.36, 140], [200, 1640, 760, 'lilac2', 0.4, 140], [960, 1760, 520, 'blush', 0.3, 130]])}
  ${blk(`left:${SX}px;top:290px;width:920px`, H(s.title, 156))}
  ${blk(`left:${SX}px;top:628px;width:920px`, Pp(s.text, 52, 'font-weight:800;color:#F5F4FB'))}
  ${blk('left:640px;top:790px;width:380px', `<div style="font:800 38px/1.18 var(--fb);color:#F5F4FB;transform:rotate(-4deg)">${T(s.note)}</div>`)}
  <svg class="abs" style="z-index:6;left:0;top:0;width:1080px;height:1920px;overflow:visible" viewBox="0 0 1080 1920" aria-hidden="true">
    <path d="M660 800 C 610 748 548 744 500 772" fill="none" stroke="#F5F4FB" stroke-width="6" stroke-linecap="round"/>
    <path d="M522 752 L 498 773 L 528 786" fill="none" stroke="#F5F4FB" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>
  ${slot(s.sticker, s.sticker.hint)}
  ${sparks([[930, 300, 40, { holo: true }], [980, 1120, 22], [120, 1130, 18]])}
  ${mp(s, { x: 400, foot: 1150, h: 440, glow: true })}`;

L.storyShare = s => `
  ${darkBg([[540, 1000, 1000, 'mint', 0.3, 160], [80, 300, 600, 'sky', 0.34, 140], [1000, 1700, 700, 'lilac2', 0.36, 140]])}
  ${blk(`left:${SX}px;right:${SX}px;top:290px;text-align:center`, H(s.title, 118))}
  ${slot(s.sticker)}
  ${sparks([[150, 700, 40, { holo: true }], [930, 820, 26], [940, 1300, 20], [140, 1280, 18]])}
  ${mp(s, { x: 540, foot: 1590, h: 320, glow: true })}`;

L.storyPoll = s => `
  ${darkBg([[1000, 300, 720, 'blush', 0.4, 140], [80, 900, 640, 'lilac2', 0.36, 140], [900, 1700, 720, 'sky', 0.34, 140]])}
  ${blk(`left:${SX}px;top:290px`, tag(s.kicker, 'blush'))}
  ${blk(`left:${SX}px;top:390px;width:920px`, H(s.title, 118))}
  ${slot(s.sticker, s.sticker.hint)}
  ${sparks([[150, 1420, 38, { holo: true }], [520, 1520, 20]])}
  ${mp(s, { right: 996, foot: 1600, h: 270, glow: true })}`;

L.storyQuiz = s => `
  ${lightBg(s.accent, { h: SH, ad: 900, ay: 120 })}
  ${blk(`left:${SX}px;top:290px`, tag(s.kicker, 'sky'))}
  ${blk(`left:${SX}px;top:390px;width:920px`, H(s.title, 118))}
  ${slot(s.sticker, s.sticker.hint)}
  <i class="floor" style="left:820px;top:1600px;width:380px;height:70px"></i>
  ${sparks([[170, 1420, 36, { holo: true }], [320, 1500, 22, { fill: 'lilac2' }]])}
  ${mp(s, { right: 996, foot: 1596, h: 290 })}`;

/* odkaz na článek (S4b, highlight Tipy): karta článku s náhledem, jediný maskot je v náhledu */
L.storyLink = s => `
  ${lightBg(s.accent, { h: SH, ad: 900, ay: 120 })}
  ${blk(`left:${SX}px;top:290px`, tag(s.kicker, s.accent === 'sky' ? 'mint' : 'sky'))}
  ${blk(`left:${SX}px;top:390px;width:920px`, H(s.title, 132))}
  <div class="card" style="left:64px;top:720px;width:952px;height:320px;border-radius:48px;background:#fff">
    <div class="abs" style="left:40px;top:40px;display:flex;align-items:center;gap:14px">${tag('Blog', 'sky')}<span style="font:800 28px/1 var(--fb);color:#6A6F7D">sparkee.cz/blog</span></div>
    <div class="abs" style="left:40px;top:130px;width:600px"><div class="h" style="--fs:52px;line-height:1.04">${T(s.text)}</div></div>
    <div class="abs" style="right:-5px;top:-5px;bottom:-5px;width:260px;border-left:5px solid var(--ink);background:var(--surf)"></div>
  </div>
  ${M(s.pose, { x: 886, foot: 994, h: 204, cls: 'flat', z: 5 })}
  ${slot(s.sticker, s.sticker.hint)}
  ${s.tail ? blk(`left:${SX}px;right:${SX}px;top:1420px;text-align:center`, Pp(s.tail, 44, 'font-weight:800;color:#2C303C')) : ''}
  ${sparks([[170, 1560, 30, { holo: true }], [900, 1540, 22, { fill: 'lilac2' }]])}`;

L.storyCta = s => `
  ${darkBg([[120, 320, 760, 'mint', 0.42, 140], [1000, 700, 700, 'lilac2', 0.42, 140], [880, 1640, 760, 'blush', 0.38, 140], [80, 1500, 600, 'sky', 0.32, 140]])}
  ${blk(`left:${SX}px;right:${SX}px;top:290px;text-align:center`, H(s.title, 140))}
  ${sparks([[200, 800, 40, { holo: true }], [880, 760, 26], [910, 1040, 18], [170, 1030, 18]])}
  ${mp(s, { x: 540, foot: 1090, h: 450, glow: true })}
  ${slot(s.sticker)}
  ${blk(`left:${SX}px;right:${SX}px;top:1440px;text-align:center`, Pp(s.text, 48, 'font-weight:800;color:#F5F4FB'))}`;

/* highlight stories: štítek, nadpis, text + jeden blok (řádky, kroky, štítky, balíčky nebo FAQ), případně odkaz */
L.storyInfo = s => {
  const dark = s.tone === 'dark';
  const bg = dark
    ? darkBg([[120, 300, 760, s.accent, 0.42, 140], [1000, 900, 700, 'lilac2', 0.34, 140], [200, 1640, 760, 'sky', 0.34, 140], [960, 1760, 520, 'blush', 0.3, 130]])
    : lightBg(s.accent, { h: SH, ad: 900, ay: 120 });
  const pc = C[s.accent === 'mint2' ? 'mint2' : s.accent];
  const titleFs = 118;
  let block = '';
  if (s.rows) block = `<div style="display:flex;flex-direction:column;gap:30px;width:760px">${s.rows.map((t, i) => `<div class="row" style="--rs:44px;padding:32px 34px 32px 22px">${mark(icon(s.mark === 'check' ? 'check' : 'arrow', 32, '#2C303C'), C[PASTELS[i % 4]])}<span>${T(t)}</span></div>`).join('')}</div>`;
  if (s.steps) block = `<div style="display:flex;flex-direction:column;gap:28px;width:880px">${s.steps.map(([t, w], i) => `<div class="row" style="--rs:44px;padding:30px 30px 30px 22px">${mark(`<span style="font:800 34px/1 var(--fd);padding-top:4px">${i + 1}</span>`, C[PASTELS[i % 4]])}<span style="flex:1">${T(t)}</span><span style="font:900 25px/1 var(--fb);letter-spacing:.06em;text-transform:uppercase;color:#585D6C;white-space:nowrap">${T(w)}</span></div>`).join('')}</div>`;
  if (s.chips) block = `<div style="display:flex;flex-wrap:wrap;gap:26px 18px;width:920px">${s.chips.map((c, i) => `<span class="chipx" style="height:92px;font-size:44px;background:${i % 2 ? '#fff' : C[PASTELS[(i >> 1) % 4]]}">${T(c)}</span>`).join('')}</div>`;
  if (s.tiers) block = `<div class="card" id="tiers" style="position:relative;width:920px;padding:34px 34px 30px;border-radius:48px;display:flex;flex-direction:column;gap:22px">${s.tiers.map(([n, what, p, t]) => `
    <div class="row" style="padding:22px 28px;gap:20px;${t ? 'border-width:5px' : ''}"><div style="flex:1"><div style="display:flex;align-items:center;gap:14px"><span class="h" style="--fs:54px">${n}</span>${t ? `<span class="url" style="height:50px;font:900 21px/1 var(--fb);letter-spacing:.06em;text-transform:uppercase;padding:3px 18px 0 14px;box-shadow:4px 4px 0 var(--ink);gap:8px">${spk()}${T(t)}</span>` : ''}</div>
      <div style="font:800 28px/1.2 var(--fb);color:#4A4E5B;margin-top:6px">${T(what)}</div></div>
      <div style="text-align:right"><div style="font:800 24px/1 var(--fb);color:#4A4E5B">od</div><div class="h" style="--fs:56px;letter-spacing:-.02em;white-space:nowrap">${T(p)} Kč</div></div></div>`).join('')}</div>`;
  if (s.faq) block = `<div style="display:flex;flex-direction:column;gap:30px;width:920px">${s.faq.map(([q, a], i) => `
    <div class="row" style="display:block;padding:38px 40px 42px"><div style="display:flex;align-items:center;gap:20px">${mark(icon('q', 34, '#2C303C'), C[PASTELS[(i + 1) % 4]])}<span class="h" style="--fs:54px;line-height:1.05">${T(q)}</span></div>
      <p style="font:700 42px/1.3 var(--fb);color:#3A3E4B;margin-top:20px">${T(a)}</p></div>`).join('')}</div>`;
  const def = s.pose === 'peek' ? { x: 912, h: 180, rest: true, anchor: '#tiers' }
    : s.faq ? { right: 1000, foot: 1596, h: 300 }
    : { right: 1000, foot: 1596, h: 330 };
  return `
  ${bg}
  ${blk(`left:${SX}px;top:290px;width:920px;display:flex;flex-direction:column;gap:34px;align-items:flex-start`, `
    ${tag(s.kicker, dark ? 'mist' : pc)}
    ${H(s.title, titleFs, 'margin-top:4px')}
    ${s.text ? Pp(s.text, 46, `max-width:900px;${dark ? '' : 'color:#2C303C'}`) : ''}
    ${block}
    ${s.foot ? Pp(s.foot, 34, 'font-weight:800') : ''}`)}
  ${s.sticker ? slot(s.sticker, s.sticker.hint) : ''}
  ${dark ? '' : `<i class="floor" style="left:${def.right ? def.right - 160 : def.x}px;top:1604px;width:360px;height:66px"></i>`}
  ${sparks(dark ? [[960, 330, 36, { holo: true }], [140, 1540, 20]] : [[960, 330, 34, { holo: true }], [150, 1560, 20, { fill: 'lilac2' }]])}
  ${mp(s, { ...def, glow: dark && s.pose !== 'peek' })}`;
};

/* =====================================================================
   HIGHLIGHTY a PROFILOVKA
   ===================================================================== */
function hlIcon(k) {
  const cx = 540, cy = 960;
  switch (k) {
    case 'head': return M('head', { x: cx, foot: cy + 320, h: 640, cls: 'flat' });
    case 'pillars': {
      const s = 176, g = 34, o = (s + g) / 2;
      return `${[[-1, -1, 'mint'], [1, -1, 'sky'], [-1, 1, 'lilac2'], [1, 1, 'blush']].map(([dx, dy, c]) =>
        `<i class="abs" style="z-index:4;left:${cx + dx * o}px;top:${cy + dy * o}px;translate:-50% -50%;width:${s}px;height:${s}px;border-radius:52px;background:${C[c]};box-shadow:0 0 50px ${C[c]}88"></i>`).join('')}
        <svg class="abs" viewBox="0 0 24 24" style="z-index:5;left:${cx}px;top:${cy}px;translate:-50% -50%;width:150px;height:150px" aria-hidden="true"><path d="${SPARK_D}" fill="#F5F4FB" stroke="#2C303C" stroke-width="1.6" paint-order="stroke"/></svg>`;
    }
    case 'kc': return `<div class="abs h" style="z-index:4;left:${cx}px;top:${cy}px;translate:-50% -46%;--fs:360px;color:#F5F4FB;letter-spacing:-.04em;text-shadow:0 0 60px rgba(196,156,242,.6)">Kč</div>`;
    case 'bubble': return `<svg class="abs" viewBox="0 0 400 360" style="z-index:4;left:${cx}px;top:${cy + 10}px;translate:-50% -50%;width:470px;height:423px;overflow:visible;filter:drop-shadow(0 0 40px rgba(245,184,220,.55))" aria-hidden="true">
        <path d="M70 20h260a52 52 0 0 1 52 52v150a52 52 0 0 1-52 52H170l-86 66 10-66H70a52 52 0 0 1-52-52V72a52 52 0 0 1 52-52z" fill="none" stroke="#F5F4FB" stroke-width="30" stroke-linejoin="round"/>
        <path d="${SPARK_D}" transform="translate(140 88) scale(5)" fill="url(#gHolo)"/></svg>`;
    case 'spark': return `<svg class="abs" viewBox="0 0 24 24" style="z-index:4;left:${cx}px;top:${cy}px;translate:-50% -50%;width:420px;height:420px;filter:drop-shadow(0 0 50px rgba(154,216,248,.7))" aria-hidden="true"><path d="${SPARK_D}" fill="url(#gHolo)"/></svg>
      ${sp(cx + 230, cy - 200, 60, { fill: 'mist' })}${sp(cx - 240, cy + 190, 44, { fill: 'mist' })}`;
  }
  return '';
}
L.highlight = h => `
  <div class="bg">${blob(540, 960, 760, h.accent === 'lilac' ? 'lilac2' : h.accent, 0.55, 120)}<i class="ring" style="left:540px;top:960px;width:760px;height:760px"></i></div>
  ${hlIcon(h.icon)}`;

/* profilovka: hlava o 6 % větší než v1 (víc se do kruhu nevejde), špička plamínku 90 px od hrany kruhu */
const AV = { foot: 994, h: 904 };
L.avatarDark = () => `
  <div class="bg">${blob(420, 480, 620, 'mint', 0.55, 120)}${blob(690, 510, 580, 'sky', 0.55, 120)}${blob(540, 740, 640, 'lilac', 0.6, 120)}</div>
  ${M('head', { x: 540, ...AV, cls: 'flat', z: 4 })}`;
L.avatarLight = () => `
  <div class="bg">${blob(120, 120, 760, 'mint', 0.85, 140)}${blob(1000, 180, 720, 'sky', 0.8, 140)}${blob(120, 1000, 720, 'lilac2', 0.7, 140)}${blob(980, 980, 760, 'blush', 0.85, 140)}${blob(540, 560, 560, '#FFFFFF', 0.9, 110)}</div>
  ${M('head', { x: 540, ...AV, z: 4 })}`;
/* Figma „Aplikace“: kruh s „s“ (ink + holo glow), písmeno převzaté z wordmarku */
L.avatarS = () => {
  const [bx, by, bw, bh] = LOGO_S.box, hgt = 560, wdt = hgt * bw / bh;
  return `
  <div class="bg">${blob(430, 440, 620, 'mint', 0.5, 130)}${blob(700, 520, 560, 'sky', 0.45, 130)}${blob(560, 720, 640, 'lilac2', 0.55, 130)}</div>
  <svg class="abs" viewBox="${bx} ${by} ${bw} ${bh}" style="z-index:4;left:${540 - wdt / 2}px;top:${540 - hgt / 2 + 10}px;width:${wdt}px;height:${hgt}px;overflow:visible;filter:drop-shadow(0 0 40px rgba(196,156,242,.45))" aria-hidden="true">
    <path d="${LOGO_S.d}" fill="#F5F4FB"/></svg>`;
};

/* =====================================================================
   JOBY
   ===================================================================== */
const JOBS = new Map();
const job = (id, out, w, h, tone, accent, fn, cls = '') => JOBS.set(id, { id, out, w, h, html: () => canvas(w, h, tone, accent, fn(), cls) });

job('avatar-dark', 'avatar/sparkee-avatar-dark.png', 1080, 1080, 'dark', 'holo', L.avatarDark, 'avatar');
job('avatar-light', 'avatar/sparkee-avatar-light.png', 1080, 1080, 'light', 'holo', L.avatarLight, 'avatar');
job('avatar-s', 'avatar/sparkee-avatar-s.png', 1080, 1080, 'dark', 'holo', L.avatarS, 'avatar');
for (const h of PROFILE.highlights) job(h.id, `highlights/${h.id}.png`, 1080, SH, 'dark', h.accent, () => L.highlight(h), 'hl');
for (const post of POSTS) {
  post.slides.forEach((s, i) => {
    const n = post.slides.length;
    const isReel = post.kind === 'reel';
    const file = s.file || `${String(i + 1).padStart(2, '0')}.png`;
    const id = isReel ? `${post.id}-cover` : `${post.id}-${String(i + 1).padStart(2, '0')}`;
    const ctx = { post, i: i + 1, n, accent: post.accent };
    if (!L[s.layout]) throw new Error('chybí layout ' + s.layout);
    job(id, `feed/${post.dir}/${file}`, W, isReel ? SH : PH, post.tone, post.accent, () => L[s.layout](s, ctx));
  });
}
for (const st of STORIES) job(st.id, `${st.set === 'highlight' ? 'highlights/stories' : 'stories'}/${st.file}`, W, SH, st.tone, st.accent, () => L[st.layout](st));

/* ---------- měření obrysu pózy (bez stínu) a umístění ---------- */
const bbCache = new Map();
async function measure(pose) {
  // viditelný obrys z pixelů (alfa kanál), bez stínu .m-shadow; SVG může obsahovat skryté části (např. oči ^^ s opacity 0)
  if (bbCache.has(pose)) return bbCache.get(pose);
  const txt = await (await fetch(poseUrl(pose))).text();
  const doc = new DOMParser().parseFromString(txt, 'image/svg+xml');
  doc.querySelectorAll('.m-shadow').forEach(e => e.remove());
  const svg = doc.documentElement;
  const [vx, vy, vw, vh] = svg.getAttribute('viewBox').split(/[\s,]+/).map(Number);
  const K = 4;
  svg.setAttribute('width', vw * K); svg.setAttribute('height', vh * K);
  const src = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }));
  const img = new Image(); img.src = src; await img.decode();
  const cv = document.createElement('canvas'); cv.width = Math.ceil(vw * K); cv.height = Math.ceil(vh * K);
  const ctx = cv.getContext('2d', { willReadFrequently: true }); ctx.drawImage(img, 0, 0, cv.width, cv.height);
  const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
  let x0 = cv.width, y0 = cv.height, x1 = 0, y1 = 0;
  for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) {
    if (d[(y * cv.width + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  const r = { vx, vy, vw, vh, x0: vx + x0 / K, y0: vy + y0 / K, x1: vx + (x1 + 1) / K, y1: vy + (y1 + 1) / K, img };
  bbCache.set(pose, r);
  return r;
}
async function placeMascots(root) {
  for (const cv of root.querySelectorAll('.cv')) await placeIn(cv);
}
async function placeIn(cv) {
  const cr = cv.getBoundingClientRect(), w = Math.round(cr.width), h = Math.round(cr.height);
  const rel = r => ({ x0: r.left - cr.left, y0: r.top - cr.top, x1: r.right - cr.left, y1: r.bottom - cr.top, width: r.width });
  const imgs = [...cv.querySelectorAll('img.mascot')];
  for (const img of imgs) {
    const d = img.dataset, b = await measure(d.pose);
    const s = +d.h / (b.y1 - b.y0);
    const hw = (b.x1 - b.x0) * s / 2;
    let x = +d.x, foot = +d.foot;
    if (d.right != null) x = +d.right - hw;
    if (d.left != null) x = +d.left + hw;
    if (d.anchor) { const a = cv.querySelector(d.anchor); if (a) foot = a.getBoundingClientRect().top - cr.top + 3; }
    const ox = ((b.x0 + b.x1) / 2 - b.vx) * s, oy = (b.y1 - b.vy) * s;
    const L0 = x - ox, T0 = foot - oy;
    Object.assign(img.style, { width: b.vw * s + 'px', height: b.vh * s + 'px', left: L0 + 'px', top: T0 + 'px' });
    img.style.setProperty('--ox', ox + 'px'); img.style.setProperty('--oy', oy + 'px');
    if (+d.rot) img.style.rotate = d.rot + 'deg';
    Object.assign(d, { px: x, pfoot: foot, l: L0, t: T0, w: b.vw * s, hh: b.vh * s, ox, oy });
    // glow louže za maskotem jde s ním (x se mohl dopočítat z right/left)
    const pud = img.previousElementSibling;
    if (pud && pud.classList.contains('puddle') && pud.dataset.for === d.pose) { pud.style.left = x + 'px'; pud.style.top = (foot - +d.h * 0.5) + 'px'; }
    img._mask = mascotMask(img, w, h);
  }
  // bloky s data-avoid se zúží tak, aby končily 40 px před skutečným obrysem maskota vpravo od nich (2 průchody, text se přelije)
  for (let pass = 0; pass < 2; pass++) for (const el of cv.querySelectorAll('[data-avoid], .avoid > *')) {
    const r = rel(el.getBoundingClientRect());
    let minX = Infinity;
    for (const img of imgs) {
      const M = img._mask;
      for (let y = Math.max(0, r.y0 | 0); y < Math.min(h, r.y1); y += 2)
        for (let x = (r.x0 | 0) + 1; x < Math.min(w, minX); x += 2) if (M.m[y * w + x]) { minX = Math.min(minX, x); break; }
    }
    const maxW = minX - 40 - r.x0;
    if (maxW < r.width) el.style.width = Math.max(320, Math.floor(maxW)) + 'px';
  }
}

/* ---------- fonty ---------- */
async function settle(el) {
  await Promise.all([...el.querySelectorAll('img')].map(i => i.decode().catch(() => { throw new Error('obrázek se nenačetl: ' + i.src); })));
  await Promise.all(['800 100px "Baloo 2"', '700 40px "Baloo 2"', '700 40px "Nunito"', '800 40px "Nunito"', '900 40px "Nunito"']
    .map(f => document.fonts.load(f, 'ěščřžýáíéůúťďňó ĚŠČŘŽÝÁÍÉŮÚ„“')));
  await document.fonts.ready;
}
function fontReport() {
  const loaded = fam => [...document.fonts].filter(f => f.family.replace(/["']/g, '') === fam && f.status === 'loaded').length;
  const cv = document.createElement('canvas').getContext('2d');
  const w = f => { cv.font = f; return cv.measureText('Přidáme jiskru ěščřžýáíé').width; };
  return {
    baloo: loaded('Baloo 2'), nunito: loaded('Nunito'),
    real: Math.abs(w('800 80px "Baloo 2"') - w('800 80px serif')) > 5 && Math.abs(w('800 40px "Nunito"') - w('800 40px serif')) > 5,
  };
}

/* ---------- kontroly: safe zóna, maskot proti hranám karet, okraji plátna, textům a štítkům ---------- */
/** maska viditelného obrysu maskota v souřadnicích plátna (1 = neprůhledný pixel) */
function mascotMask(img, w, h) {
  const d = img.dataset, b = bbCache.get(d.pose);
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.translate(+d.l + +d.ox, +d.t + +d.oy);
  ctx.rotate((+d.rot || 0) * Math.PI / 180);
  ctx.drawImage(b.img, -d.ox, -d.oy, +d.w, +d.hh);
  const px = ctx.getImageData(0, 0, w, h).data, m = new Uint8Array(w * h);
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let i = 0; i < w * h; i++) if (px[i * 4 + 3] > 60) {
    m[i] = 1; const x = i % w, y = (i / w) | 0;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return { m, w, h, box: { x0, y0, x1, y1 } };
}
const at = (M, x, y) => (x >= 0 && y >= 0 && x < M.w && y < M.h) ? M.m[(y | 0) * M.w + (x | 0)] : 0;
/** obrys proti hranám jedné karty: buď ≥ 40 px od hrany, nebo ji rozhodně přetíná (souvislý úsek ≥ 18 % výšky na obou stranách) */
function edgeCheck(M, rc, hgt, rest, foot, label) {
  const out = [], r = Math.min(rc.r, 60), D = Math.round(hgt * 0.18);
  const E = [
    ['horní', 'h', rc.y0 + 2, rc.x0 + r, rc.x1 - r, 1], ['dolní', 'h', rc.y1 - 2, rc.x0 + r, rc.x1 - r, -1],
    ['levá', 'v', rc.x0 + 2, rc.y0 + r, rc.y1 - r, 1], ['pravá', 'v', rc.x1 - 2, rc.y0 + r, rc.y1 - r, -1],
  ];
  const b = M.box;
  for (const [name, o, line, a, z, inw] of E) {
    if (rest && o === 'h' && Math.abs(line - foot) <= 18) continue;
    // rychlé vyřazení: obrys ani jeho okolí 40 px na hranu nesahá
    if (o === 'h' ? (b.y1 < line - 40 || b.y0 > line + 40 || b.x1 < a || b.x0 > z) : (b.x1 < line - 40 || b.x0 > line + 40 || b.y1 < a || b.y0 > z)) continue;
    const pix = (s, dd) => { const t = line + inw * dd; return o === 'h' ? at(M, s, t) : at(M, t, s); };
    let cross = false, decisive = false, near = Infinity;
    for (let s = Math.ceil(a); s <= z; s += 3) {
      if (pix(s, 0)) {
        cross = true;
        let ri = 0; while (ri < 600 && pix(s, ri + 1)) ri++;
        let ro = 0; while (ro < 600 && pix(s, -(ro + 1))) ro++;
        if (ri >= D && ro >= D) decisive = true;
      } else for (let dd = 1; dd < 40; dd++) if (pix(s, dd) || pix(s, -dd)) { near = Math.min(near, dd); break; }
    }
    if (cross && !decisive) out.push(`maskot tečuje ${name} hranu ${label} (přesah je jen malý kousek)`);
    else if (!cross && near < 40) out.push(`maskot je ${near} px od ${name} hrany ${label} (min. 40)`);
  }
  return out;
}
function maskIn(M, x0, y0, x1, y1) {
  let n = 0;
  for (let y = Math.max(0, y0 | 0); y < Math.min(M.h, y1); y += 2) for (let x = Math.max(0, x0 | 0); x < Math.min(M.w, x1); x += 2) n += M.m[y * M.w + x];
  return n * 4;
}
function checks(root, j) {
  const warn = [];
  const cv = root.querySelector('.cv');
  const cr = cv.getBoundingClientRect();
  const rel = r => ({ x0: r.left - cr.left, y0: r.top - cr.top, x1: r.right - cr.left, y1: r.bottom - cr.top });
  const isAvatar = j.id.startsWith('avatar'), isHl = j.id.startsWith('hl');
  const isStory = j.h === SH && !j.id.includes('cover') && !isHl;
  const safe = isAvatar || isHl ? null
    : isStory ? { x0: 64, y0: 250, x1: 1016, y1: 1580 }
    : j.h === SH ? { x0: 60, y0: 240, x1: 1020, y1: 1680 }
    : { x0: 60, y0: 40, x1: 1020, y1: 1310 };
  const masks = [...root.querySelectorAll('img.mascot')].map(img => ({ img, M: img._mask || mascotMask(img, j.w, j.h) }));
  // 1) texty a štítky: safe zóna + překryv s obrysem maskota
  for (const el of root.querySelectorAll('.h, .p, .pill, .url, .tag, .chipx, .row, .swipe, .bubble, .msg')) {
    const r = el.getBoundingClientRect();
    if (!r.width || el.classList.contains('deco')) continue;
    const a = rel(r);
    const label = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 28);
    if (safe && (a.x0 < safe.x0 - 1 || a.y0 < safe.y0 - 1 || a.x1 > safe.x1 + 1 || a.y1 > safe.y1 + 1)) warn.push(`mimo safe zónu: „${label}“ [${a.x0 | 0},${a.y0 | 0},${a.x1 | 0},${a.y1 | 0}]`);
    const rects = el.classList.contains('h') || el.classList.contains('p')
      ? (() => { const rg = document.createRange(); rg.selectNodeContents(el); return [...rg.getClientRects()].map(rel); })() : [a];
    for (const q of rects) for (const { M } of masks) {
      if (maskIn(M, q.x0 + 4, q.y0 + 4, q.x1 - 4, q.y1 - 4) > 120) { warn.push(`maskot se kryje s „${label}“ [${q.x0 | 0},${q.y0 | 0},${q.x1 | 0},${q.y1 | 0}]`); break; }
    }
  }
  // 2) maskot: okraj plátna, hrany karet a panelů, kruh profilovky
  for (const { img, M } of masks) {
    const d = img.dataset, b = M.box, name = d.pose;
    if (b.x1 < 0) continue;
    if (b.x0 <= 0 || b.y0 <= 0 || b.x1 >= j.w - 1 || b.y1 >= j.h - 1) warn.push(`${name}: obrys je oříznutý okrajem plátna [${b.x0},${b.y0},${b.x1},${b.y1}]`);
    if (safe && !isStory && j.h === PH && (b.x0 < 34 || b.x1 > 1046)) warn.push(`${name}: obrys leze mimo výřez 3:4 v gridu`);
    if (isStory && b.y1 > 1610) warn.push(`${name}: nohy pod safe zónou stories (y ${b.y1})`);
    if (isAvatar) {
      let worst = 540;
      for (let y = b.y0; y <= b.y1; y += 2) for (let x = b.x0; x <= b.x1; x += 2) if (at(M, x, y)) worst = Math.min(worst, 540 - Math.hypot(x - 540, y - 540));
      if (worst < 84) warn.push(`${name}: obrys je jen ${worst | 0} px od hrany kruhu (min. 84)`);
    }
    for (const el of root.querySelectorAll('.card, .panel')) {
      const r = rel(el.getBoundingClientRect());
      const rad = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
      const lab = el.id ? `#${el.id}` : `karty [${r.x0 | 0},${r.y0 | 0},${r.x1 | 0},${r.y1 | 0}]`;
      warn.push(...edgeCheck(M, { ...r, r: rad }, +d.h, !!d.rest, +d.pfoot, lab).map(w => `${name}: ${w}`));
    }
  }
  return [...new Set(warn)];
}

async function render(id) {
  const j = JOBS.get(id);
  if (!j) throw new Error('neznámý job ' + id);
  const root = document.getElementById('root');
  root.innerHTML = j.html();
  await settle(root);
  await placeMascots(root);
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  return { fonts: fontReport(), warn: checks(root, j) };
}

window.KIT = {
  ready: true,
  jobs: () => [...JOBS.values()].map(({ id, out, w, h }) => ({ id, out, w, h })),
  render,
  html: id => JOBS.get(id).html(),
  POSTS, STORIES, PROFILE,
};

/* náhled v prohlížeči: ?id=p04-02 nebo ?all[=prefix] */
(async () => {
  const q = new URLSearchParams(location.search);
  if (q.has('id')) return render(q.get('id'));
  if (q.has('all')) {
    document.body.classList.add('gallery');
    const pre = q.get('all') || '';
    const root = document.getElementById('root');
    root.style.display = 'contents';
    root.innerHTML = [...JOBS.values()].filter(j => j.id.startsWith(pre)).map(j => j.html()).join('');
    await settle(root); await placeMascots(root);
  }
})();
