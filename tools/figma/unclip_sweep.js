// use_figma skript: vypne "Clip content" na kontejnerech, kde ořez není záměrný.
// Klient 27. 9. 2026: „často dáváš na sekce clip content a nejde pak vidět shadows“.
// Nech clip: slidy 1920×1080 (záře na okrajích), rámečky s dítětem geometricky přesahujícím
// (záměrný výřez/maska) a rámečky, kde by jinak přetekla blur záře ven.
// Použití: nahraď PAGE id stránky, spusť přes use_figma (jedna stránka na volání).
const PAGE = '197:286';
const page = await figma.getNodeByIdAsync(PAGE); await figma.setCurrentPageAsync(page);
const T = 0.5;
const inside = (a, b) => a.x >= b.x - T && a.y >= b.y - T && a.x + a.width <= b.x + b.width + T && a.y + a.height <= b.y + b.height + T;
const blurExt = (n) => { if (!('effects' in n) || !n.effects) return 0; let m = 0; for (const e of n.effects) { if (e.visible === false) continue; if (e.type === 'LAYER_BLUR') m = Math.max(m, (e.radius || 0) * 1.2); } return m; };
const frames = page.findAllWithCriteria({ types: ['FRAME', 'COMPONENT', 'COMPONENT_SET'] });
const changed = [], keptCrop = [], keptGlow = []; let slides = 0;
for (const f of frames) {
  if (!f.clipsContent) continue;
  const b = f.absoluteBoundingBox; if (!b) continue;
  if (Math.round(b.width) === 1920 && Math.round(b.height) === 1080) { slides++; continue; }
  let crop = false, glow = false;
  for (const c of f.children) {
    const cb = c.absoluteBoundingBox; if (!cb || c.visible === false) continue;
    if (!inside(cb, b)) { crop = true; break; }
    const be = blurExt(c); if (be > 0) { const gb = { x: cb.x - be, y: cb.y - be, width: cb.width + 2 * be, height: cb.height + 2 * be }; if (!inside(gb, b)) glow = true; }
  }
  if (crop) { keptCrop.push(f.id + ' ' + f.name.slice(0, 30)); continue; }
  if (glow) { keptGlow.push(f.id + ' ' + f.name.slice(0, 30)); continue; }
  f.clipsContent = false; changed.push(f.id);
}
return { page: PAGE, slidesKept: slides, changedCount: changed.length, keptCrop: keptCrop.slice(0, 60), keptGlow };
