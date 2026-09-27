/* Sparkee – companion.js
 * Scroll companion: a small live copy of the hero mascot that accompanies the visitor after the hero.
 * Same rig + behaviour engine as the hero (SparkeeMascot.create on a clone of the hero SVG, shared rAF ticker),
 * so every state change is a spring / joint animation – no image swaps, no deformation.
 *  - pops in bottom-right once the hero leaves the viewport (pops out when it comes back)
 *  - staged, not chatty: a few beats only (story entrance, ceník, reference, kontakt, form sent) get a gesture and a
 *    short Czech bubble; in every other section he just turns to the headline
 *  - never next to a static clone of himself: ducks while an in-content mascot picture is at least 40 % in view
 *  - never covers CTAs / form fields: an IntersectionObserver whose root is his box padded outward (arm reach, jump
 *    apex) watches every interactive element -> he ducks below the screen edge while one is under him; hidden while
 *    the form has focus and near the footer; a bubble that would cover a control or the focused element is not shown
 *  - hysteresis: once shown he stays >= 1.5 s (unless a button / field is under him), once hidden he stays away >= 0.8 s
 *  - dismissible: × (top-left of his box) or the "Skrýt maskota" button right after the skip link; remembered in
 *    localStorage; prefers-reduced-motion = static figure, no bubbles; the page motion toggle (html.is-still) freezes him
 *  - costs nothing while hidden: the rig only ticks while he is on screen and the tab is visible
 * Test hooks: SparkeeCompanion.show('cenik', 1.1) freezes that section's reaction 1.1 s in (bubble shown),
 *   SparkeeCompanion.play() resumes live, .state() for QA;  URL /?companion=cenik@1.1#cenik does show() on load,
 *   ?companion=reset clears the dismissal.
 */
(function () {
  'use strict';
  const M = window.SparkeeMascot;
  const heroEl = document.querySelector('.hero');
  if (!M || !M.create || !M.template || !heroEl) return;

  const KEY = 'sparkee-companion';
  const store = {
    get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } },
    set(v) { try { if (v == null) localStorage.removeItem(KEY); else localStorage.setItem(KEY, v); } catch (e) { /* storage blocked */ } }
  };
  const param = new URLSearchParams(location.search).get('companion');
  if (param === 'reset') store.set(null);
  const test = param && param !== 'reset' ? param : null;
  if (store.get() === 'off' && !test) {
    window.SparkeeCompanion = { dismissed: true, reset() { store.set(null); } };
    return;
  }

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(hover: none), (pointer: coarse)').matches;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const has = (o, k) => typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k);
  const ac = new AbortController(), signal = ac.signal;             // every listener goes away on dismissal
  const observers = [];
  const observe = io => { observers.push(io); return io; };

  /* section id -> beat. act = gesture (mascot.js action), say = one-off line (max 4 words), look = what he turns to
     (default: the section's h2). Sections that are not listed: he only turns to the headline. */
  const SECTIONS = Object.assign(Object.create(null), {
    'sparkee-20s': { look: '[data-st-frame]', hold: 5, say: 'Koukej! ✦' },
    'cenik':       { act: 'point', say: 'Vyber si balíček' },
    'reference':   { act: 'nod', say: 'Čti, co říkají' },
    'kontakt':     { act: 'wave', say: 'Napiš nám!' },
    sent:          { act: 'cheer', say: 'Hurá, díky! ✦' }            // form sent (event, not a section)
  });
  const HELLO = 'Ahoj! ✦';                                            // entrance line when he first appears elsewhere

  /* ---------- DOM: clone the pristine hero SVG, rename its ids (no duplicates in the page) ---------- */
  const SFX = '-cmp';
  const svg = M.template.cloneNode(true);
  svg.removeAttribute('role');
  svg.removeAttribute('aria-label');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.classList.add('companion__svg');
  const ids = new Set();
  svg.querySelectorAll('[id]').forEach(n => { ids.add(n.id); n.id += SFX; });
  svg.querySelectorAll('*').forEach(n => {
    for (const a of n.attributes) {
      if (a.value.includes('url(#')) a.value = a.value.replace(/url\(#([^)]+)\)/g, (m0, id) => (ids.has(id) ? `url(#${id}${SFX})` : m0));
      else if (/(^|:)href$/.test(a.name) && a.value[0] === '#' && ids.has(a.value.slice(1))) a.value += SFX;
    }
  });

  const root = document.createElement('div');
  root.className = 'companion';
  root.innerHTML =
    '<div class="companion__body">' +
      '<div class="companion__glow" aria-hidden="true"></div>' +
      '<div class="companion__fig" aria-hidden="true"></div>' +
      '<div class="reactions companion__fx" aria-hidden="true"></div>' +
      '<div class="companion__bubble" aria-live="off"></div>' +
      '<button class="companion__close" type="button" aria-label="Skrýt maskota" title="Skrýt maskota">' +
        '<svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M2.5 2.5l7 7M9.5 2.5l-7 7"/></svg></button>' +
    '</div>';
  const fig = root.querySelector('.companion__fig');
  const bubble = root.querySelector('.companion__bubble');
  const closeBtn = root.querySelector('.companion__close');
  fig.appendChild(svg);
  document.body.appendChild(root);
  /* keyboard users meet him only at the end of the tab order (×) -> a hide button right after the skip link */
  const skipBtn = document.createElement('button');
  skipBtn.type = 'button';
  skipBtn.className = 'companion-skip';
  skipBtn.textContent = 'Skrýt maskota';
  const skipLink = document.querySelector('a.skip');
  if (skipLink) skipLink.after(skipBtn); else document.body.prepend(skipBtn);

  const m = M.create(svg, {
    reactions: root.querySelector('.companion__fx'), reduced, idSuffix: SFX, ambient: false, fxDir: -0.4,   // hearts drift a bit left (he sits at the right edge)
    idle: { bag: { look: 0.4, glance: 0.3, tap: 0.3 }, phone: { tap: 0.5, glance: 0.5 }, first: [6, 4], gap: [7, 8] },   // calmer than the hero: he is a sidekick
    onAir: air => root.classList.toggle('is-air', air)                  // × fades while he is off the ground
  });
  if (!m) { root.remove(); skipBtn.remove(); return; }
  let still = document.documentElement.classList.contains('is-still');
  m.setVisible(false);
  if (reduced || still) m.set('idle', 0);                             // static friendly pose, never ticks
  else m.play();

  /* ---------- state ---------- */
  const st = {
    hero: true, footer: false, form: false, cover: 0, hard: 0, twin: 0, focus: false, forced: 0,
    seen: { hero: false, cover: false, footer: false },
    shown: false, shownAt: 0, hiddenAt: -1e9, met: false, frozen: false, dead: false, current: null
  };
  const said = new Set(), reacted = new Set();
  let showT = 0, holdT = 0, hideT = 0, reactT = 0, sayT = 0, unsayT = 0, watchT = 0, bubbleOn = false, bubbleForced = false;

  const displayed = () => root.getClientRects().length > 0;            // display:none on landscape phones / print
  const forcedNow = () => performance.now() < st.forced;
  function wantShown() {
    if (st.dead || !displayed()) return false;
    if (st.focus) return true;                                           // keyboard focus on ×: always visible
    if (!(st.seen.hero && st.seen.cover && st.seen.footer)) return false; // wait for the first observer reports
    if (forcedNow()) return !st.hard;                                    // form-sent celebration: may overlap links, never fields/buttons
    return !st.hero && !st.footer && !st.form && !st.cover && !st.twin && !st.story && !st.text;
  }
  // 20s story plays its own Sparkee -> step aside while it runs (story.js dispatches 'sparkee:story')
  document.addEventListener('sparkee:story', e => { st.story = !!(e.detail && e.detail.playing); update(); });
  function update() {
    if (st.frozen) return;
    const want = wantShown(), now = performance.now();
    if (want) {
      clearTimeout(holdT); holdT = 0;
      if (st.shown || showT) return;
      const debounce = st.met && !st.focus && !forcedNow() ? 380 : 0;   // re-appearing while scrolling past controls
      const delay = Math.max(debounce, st.focus || forcedNow() ? 0 : st.hiddenAt + 800 - now);   // hidden >= 0.8 s
      showT = setTimeout(() => { showT = 0; if (!st.frozen && wantShown() && !st.shown) apply(true); }, delay);
    } else {
      clearTimeout(showT); showT = 0;
      if (!st.shown) return;
      // a button / field under him, the form in use, the hero or footer back, another Sparkee in view: go now;
      // links / text lines: after >= 1.5 s shown
      const urgent = st.hard || st.form || st.hero || st.footer || st.story || st.twin || st.dead || !displayed();
      const left = st.shownAt + 1500 - now;
      if (urgent || left <= 0) { clearTimeout(holdT); holdT = 0; apply(false); }
      else if (!holdT) holdT = setTimeout(() => { holdT = 0; update(); }, left);
    }
  }
  function apply(on) {
    st.shown = on;
    clearTimeout(hideT);
    if (on) {
      st.shownAt = performance.now();
      root.classList.remove('is-ducked');
      root.classList.add('is-on');
      m.setVisible(true);
      if (reduced || still) return;
      if (!st.met) { st.met = true; m.trigger('hop'); later(950); }   // first entrance: pop + hop, then react
      else later(500);
    } else {
      st.hiddenAt = performance.now();
      root.classList.remove('is-on');
      root.classList.toggle('is-ducked', !st.hero);                      // duck below the edge / pop out when the hero is back
      clearTimeout(reactT); clearTimeout(sayT);
      unsay();
      m.hover(false); m.excite(false);
      hideT = setTimeout(() => { if (!st.shown) m.setVisible(false); }, 520);
    }
  }

  /* ---------- reactions ---------- */
  function later(ms) { clearTimeout(reactT); reactT = setTimeout(react, ms); }
  function lookTarget(cfg, id) {
    const sec = document.getElementById(id);
    return (cfg.look && document.querySelector(cfg.look)) || (sec && sec.querySelector('h2')) || sec;
  }
  function lookVec(el) {                                                 // client point -> normalised gaze of the companion
    const r = el.getBoundingClientRect(), c = root.getBoundingClientRect();
    const hx = c.left + c.width * 0.49, hy = c.top + c.height * 0.49;   // head centre (504,250) in the viewBox
    const tx = r.left + r.width / 2, ty = r.top + Math.min(r.height, 140) / 2;
    return [clamp((tx - hx) / (innerWidth * 0.42), -1, 1), clamp((ty - hy) / (innerHeight * 0.42), -1, 1)];
  }
  function react() {
    if (!st.shown || st.frozen || reduced || still) return;
    const id = st.current;
    if (!id) return;
    const cfg = has(SECTIONS, id) ? SECTIONS[id] : {};
    const first = !reacted.has(id);
    reacted.add(id);
    const el = lookTarget(cfg, id);
    if (el) { const v = lookVec(el); m.lookAt(v[0], v[1], first ? (cfg.hold || 2.2) : 1.4); }
    if (first && cfg.act) gesture(cfg.act);
    const line = cfg.say || (!said.size ? HELLO : null);                  // no line here: greet once on the first appearance
    const key = cfg.say ? id : 'hello';
    if (line && !said.has(key)) { clearTimeout(sayT); sayT = setTimeout(() => say(key, line), first ? 380 : 220); }
  }
  let exciteT = 0;
  function gesture(a) {
    if (a === 'cheer') { m.excite(true); clearTimeout(exciteT); exciteT = setTimeout(() => m.excite(false), 2300); }
    else m.trigger(a);
  }
  function setCurrent(id) {
    if (id === st.current || st.frozen) return;                         // frozen test frame: leave it alone
    st.current = id;
    clearTimeout(reactT); clearTimeout(sayT);
    if (bubbleOn && !bubbleForced) unsay();
    if (st.shown) later(420);                                            // let a fast scroll settle first
  }

  /* ---------- speech bubble ---------- */
  function fill(text) {
    bubble.textContent = '';
    text.split('✦').forEach((part, i) => {
      if (i) {
        const s = document.createElement('span');
        s.className = 'companion__spark';
        s.setAttribute('aria-hidden', 'true');
        s.textContent = '✦';
        bubble.appendChild(s);
      }
      if (part.trim()) bubble.appendChild(document.createTextNode(part.trim()));
    });
  }
  function bubbleRect() {                                                // resting position (ignores the pop transforms)
    const c = root.getBoundingClientRect();
    const l = c.left + bubble.offsetLeft, t = c.top + bubble.offsetTop;
    return { left: l, top: t, right: l + bubble.offsetWidth, bottom: t + bubble.offsetHeight };
  }
  const focusUnder = r => {                                              // the element the visitor is on sits under it
    const a = document.activeElement;
    return !!(a && a !== document.body && !root.contains(a) && overlaps(a.getBoundingClientRect(), r));
  };
  function say(key, text, force) {
    if (!text || reduced || still || !st.shown || st.frozen) return;
    if (!force && (said.has(key) || (key !== 'hello' && key !== st.current))) return;
    fill(text);
    if (!force) {                                                        // would cover a control (incl. one still sliding in
      const r = bubbleRect();                                            // with .reveal, translateY 28px) or the focus: next visit
      const pad = { left: r.left - 12, top: r.top - 36, right: r.right + 12, bottom: r.bottom + 36 };
      if (blocked(pad, true) || focusUnder(pad) || textUnder(r)) return;   // … or body text (it would hide words)
    }
    said.add(key);
    bubbleForced = !!force;
    bubble.classList.remove('is-out', 'is-static');
    void bubble.offsetWidth;                                             // restart the pop animation
    bubble.classList.add('is-in');
    bubbleOn = true;
    clearTimeout(unsayT);
    unsayT = setTimeout(unsay, 2500 + text.length * 50);
    clearInterval(watchT);                                               // scrolling / reveal animations can move a control under it
    if (!force) watchT = setInterval(() => { const b = bubbleRect(); if (bubbleOn && (blocked(b, true) || textUnder(b))) unsay(); }, 200);
  }
  function unsay() {
    clearTimeout(unsayT); clearInterval(watchT);
    if (!bubbleOn) return;
    bubbleOn = false; bubbleForced = false;
    bubble.classList.remove('is-in', 'is-static');
    bubble.classList.add('is-out');
  }
  bubble.addEventListener('animationend', e => { if (e.animationName === 'cmpUnsay') bubble.classList.remove('is-out'); });

  /* ---------- never cover controls ---------- */
  const TARGETS = 'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [tabindex]:not([tabindex="-1"]), .chips label';
  const HARD = 'input, select, textarea, button, .btn, [data-excite], summary, .chips label';   // CTAs + form fields
  let targets = [];
  const collect = () => { targets = [...document.querySelectorAll(TARGETS)].filter(el => !root.contains(el) && el !== skipBtn); };
  const LINKISH = new Set(['A', 'DIV', 'SECTION', 'ARTICLE', 'LI', 'FIGURE']);
  const bigArea = (el, r) => LINKISH.has(el.tagName) && r.width * r.height > 60000;   // card-sized links: a corner under HIM blocks nothing
  const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  function blocked(rect, strict) {                                       // strict (bubble): big card links count too
    for (const el of targets) {
      const r = el.getBoundingClientRect();
      if (r.width && r.height && (strict || !bigArea(el, r)) && overlaps(r, rect)) return el;
    }
    return null;
  }
  /* body text: real line boxes (Range rects of the text nodes), not the element box – a paragraph box spans the whole
     column, its short last line does not. Used for the bubble (never hides words) and for him (steps aside, like links). */
  const TEXT = 'main :is(p, h1, h2, h3, h4, li, blockquote, dt, dd, figcaption, td, th, label)';
  let texts = [];
  const collectText = () => { texts = [...document.querySelectorAll(TEXT)].filter(el => !root.contains(el) && !el.closest('[data-st-stage]')); };
  const lineRange = document.createRange();
  function textUnder(rect) {
    for (const el of texts) {
      const r = el.getBoundingClientRect();
      if (!r.width || !overlaps(r, rect)) continue;
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n; n = w.nextNode()) {
        if (!n.data.trim()) continue;
        lineRange.selectNodeContents(n);
        for (const q of lineRange.getClientRects()) if (q.width > 1 && overlaps(q, rect)) return el;
      }
    }
    return null;
  }
  let txT = 0;
  function checkText() {                                                 // his own box, a hair inside (the glow may touch text)
    txT = 0;
    if (st.dead) return;
    const r = root.getBoundingClientRect();
    const on = displayed() && !!textUnder({ left: r.left + 4, top: r.top + 6, right: r.right - 4, bottom: r.bottom - 4 });
    if (on !== !!st.text) { st.text = on; update(); }
  }
  addEventListener('scroll', () => { if (!txT) txT = setTimeout(checkText, 120); }, { passive: true, signal });
  const hits = new Set();
  let coverIO = null;
  function zone() {                                                      // his box padded outward: arm reach (left), jump apex (top)
    const r = root.getBoundingClientRect();
    return { left: r.left - 22, top: r.top - 24, right: r.right + 10, bottom: r.bottom + 8 };
  }
  function observeZone() {
    if (st.dead) return;
    if (coverIO) coverIO.disconnect();
    hits.clear();
    collect();                                                           // controls added later (story, dynamic states) count too
    collectText(); checkText();
    if (!displayed()) { st.cover = 0; st.seen.cover = true; return; }
    const z = zone(), W = document.documentElement.clientWidth, H = document.documentElement.clientHeight;
    const mg = [z.top, W - z.right, H - z.bottom, z.left].map(v => -Math.max(0, Math.floor(v)) + 'px').join(' ');
    coverIO = new IntersectionObserver(es => {
      for (const e of es) {
        if (e.isIntersecting && !bigArea(e.target, e.boundingClientRect)) hits.add(e.target);
        else hits.delete(e.target);
      }
      st.cover = hits.size;
      st.hard = 0;
      hits.forEach(el => { if (el.matches(HARD)) st.hard++; });
      st.seen.cover = true;
      update();
    }, { rootMargin: mg, threshold: 0 });
    targets.forEach(t => coverIO.observe(t));
    if (!targets.length) { st.cover = st.hard = 0; st.seen.cover = true; }
  }

  /* ---------- no twins: duck at once while another Sparkee is >= 40 % in view: a static picture (phones: from 48 px,
     the card mascots there are 52–68 px wide; larger screens from 70 px) or the 20s story stage, playing or paused ---------- */
  const twins = new Set();
  const phoneMQ = matchMedia('(max-width: 600px)');
  const twinIO = observe(new IntersectionObserver(es => {
    for (const e of es) {
      if (e.intersectionRatio >= 0.4 && e.boundingClientRect.width >= (phoneMQ.matches ? 48 : 70)) twins.add(e.target);
      else twins.delete(e.target);
    }
    st.twin = twins.size;
    update();
  }, { threshold: [0, 0.4, 0.7] }));
  // the compare peek rises out of a clip (0.95 s delay): watch its unclipped box, so he is gone before the peek appears
  document.querySelectorAll('img[src*="mascot"]').forEach(i => { if (!i.closest('[data-story], [data-mascot], .companion')) twinIO.observe(i.closest('.compare__peek') || i); });
  const storyStage = document.querySelector('[data-story] [data-st-stage]');
  if (storyStage) twinIO.observe(storyStage);

  /* ---------- observers ---------- */
  observe(new IntersectionObserver(([e]) => { st.hero = e.isIntersecting; st.seen.hero = true; update(); })).observe(heroEl);
  const footer = document.querySelector('body > footer, footer.footer');   // (story.js renders <footer>s inside its posts)
  if (footer) observe(new IntersectionObserver(([e]) => { st.footer = e.isIntersecting; st.seen.footer = true; update(); }, { rootMargin: '0px 0px 60px 0px' })).observe(footer);
  else st.seen.footer = true;
  observeZone();
  let moT = 0;
  const main = document.getElementById('main') || document.body;
  const isControl = n => n.nodeType === 1 && (n.matches(TARGETS) || !!n.querySelector(TARGETS));
  observe(new MutationObserver(recs => {                                 // controls added / removed later: rebuild the watch list
    if (!recs.some(r => [...r.addedNodes].some(isControl) || [...r.removedNodes].some(isControl))) return;   // (counters, reactions: no)
    clearTimeout(moT); moT = setTimeout(observeZone, 400);
  })).observe(main, { childList: true, subtree: true });

  const secs = [...document.querySelectorAll('main section[id]')];
  const inBand = new Set();                                              // sections crossing a thin band at 56 % of the viewport
  const bandIO = observe(new IntersectionObserver(es => {
    es.forEach(e => (e.isIntersecting ? inBand.add(e.target) : inBand.delete(e.target)));
    let cur = null;
    for (const s of secs) if (inBand.has(s)) cur = s.id;                 // document order: the lower one wins at a boundary
    setCurrent(cur);
  }, { rootMargin: '-56% 0px -43% 0px' }));
  secs.forEach(s => bandIO.observe(s));

  /* form: hidden while it has focus; celebrate when site.js reports success (it writes [data-form-ok-text]) */
  const form = document.querySelector('[data-form]');
  function onFocusChange() {
    const a = document.activeElement;
    st.form = !!(form && a && form.contains(a));
    st.focus = a === closeBtn;
    if (bubbleOn && !bubbleForced && focusUnder(bubbleRect())) unsay();  // keyboard focus landed under the bubble
    update();
  }
  document.addEventListener('focusin', onFocusChange, { signal });
  document.addEventListener('focusout', () => setTimeout(onFocusChange, 0), { signal });
  const okText = form && form.querySelector('[data-form-ok-text]');
  if (okText) observe(new MutationObserver(() => { if (okText.textContent.trim()) celebrate(); }))
    .observe(okText, { childList: true, characterData: true, subtree: true });
  function celebrate() {
    if (reduced || still || st.dead || st.frozen) return;
    const a = document.activeElement;
    if (coarse && a && a.matches('input, textarea, select')) return;    // on-screen keyboard is up: stay out of the way
    st.forced = performance.now() + 3600;
    setTimeout(update, 3650);
    const wasShown = st.shown;
    update();
    setTimeout(() => {
      if (!st.shown) return;
      clearTimeout(reactT);
      gesture('cheer');
      m.burst(8);
      say('sent', SECTIONS.sent.say, true);
    }, wasShown ? 60 : 420);
  }

  /* ---------- interaction ---------- */
  let head = [0, 0];
  const measure = () => { const c = root.getBoundingClientRect(); head = [c.left + c.width * 0.49, c.top + c.height * 0.49]; };
  measure();
  if (!reduced) {
    if (!coarse) {
      addEventListener('pointermove', e => {
        if (!st.shown || e.pointerType === 'touch' || !m.ticking()) return;
        m.pointer(clamp((e.clientX - head[0]) / (innerWidth * 0.42), -1, 1), clamp((e.clientY - head[1]) / (innerHeight * 0.42), -1, 1));
      }, { passive: true, signal });
      document.documentElement.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') m.away(); }, { signal });
      svg.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch' && st.shown) m.hover(true); });
      svg.addEventListener('pointerleave', () => m.hover(false));
      document.querySelectorAll('[data-excite]').forEach(b => {
        const on = () => { if (st.shown) m.excite(true); }, off = () => m.excite(false);
        b.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch') on(); }, { signal });
        b.addEventListener('pointerleave', off, { signal });
        b.addEventListener('focus', on, { signal });
        b.addEventListener('blur', off, { signal });
      });
    }
    svg.addEventListener('click', () => { if (st.shown && !still) m.poke(); });
    let lastY = scrollY, lastT = performance.now();
    addEventListener('scroll', () => {
      const now = performance.now(), dt = Math.max(16, now - lastT);
      if (st.shown && m.ticking()) m.scroll((scrollY - lastY) / dt * 1000);
      lastY = scrollY; lastT = now;
    }, { passive: true, signal });
  }
  let rsT = 0;
  addEventListener('resize', () => { clearTimeout(rsT); rsT = setTimeout(() => { measure(); observeZone(); update(); }, 150); }, { signal });
  document.addEventListener('visibilitychange', () => m.setVisible(st.shown), { signal });   // the rig stops with the tab

  /* page motion toggle (mascot.js): freeze in the calm rest pose / resume */
  document.addEventListener('sparkee:motion', e => {
    still = !!(e.detail && e.detail.still);
    if (reduced || st.frozen) return;
    if (still) { unsay(); m.set('idle', 0); } else { m.resume(); m.setVisible(st.shown); }
  }, { signal });

  /* ---------- dismiss: × or the skip-area button (remembered) ---------- */
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';
  function focusBefore(el) {                                             // the previous stop in tab order (e.g. the last footer link)
    let prev = null;
    for (const c of document.querySelectorAll(FOCUSABLE)) {
      if (c === el || root.contains(c) || c === skipBtn) continue;
      if (!(el.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_PRECEDING)) break;
      if (c.getClientRects().length && getComputedStyle(c).visibility !== 'hidden') prev = c;
    }
    return prev;
  }
  function dismiss() {
    const a = document.activeElement;
    const prev = a === closeBtn || a === skipBtn ? focusBefore(a) : null;
    store.set('off');
    st.dead = true; st.focus = false; st.frozen = false; st.shown = false;
    [showT, holdT, reactT, sayT, exciteT, moT].forEach(clearTimeout);
    unsay();
    root.classList.remove('is-on', 'is-ducked', 'is-instant');
    root.classList.add('is-gone');
    if (prev) prev.focus({ preventScroll: true });                       // keyboard focus stays where the visitor is
    ac.abort();
    observers.forEach(o => o.disconnect());
    if (coverIO) coverIO.disconnect();
    setTimeout(() => { m.pause(); root.remove(); skipBtn.remove(); }, 420);
  }
  closeBtn.addEventListener('click', dismiss);
  skipBtn.addEventListener('click', dismiss);

  /* ---------- test hook ---------- */
  const api = {
    el: root, instance: m, sections: SECTIONS,
    /* freeze the reaction of a section (or 'sent') t seconds in, bubble visible – for screenshots */
    show(id, t) {
      id = id || st.current || 'cenik';
      const cfg = has(SECTIONS, id) ? SECTIONS[id] : {};
      st.frozen = true;
      [showT, holdT, hideT, reactT, sayT, unsayT].forEach(clearTimeout); showT = holdT = 0;
      if (id !== 'sent') st.current = id;
      root.classList.remove('is-ducked', 'is-gone');
      root.classList.add('is-on', 'is-instant');
      st.shown = true;
      const el = id !== 'sent' && document.getElementById(id) && lookTarget(cfg, id);
      const v = el ? lookVec(el) : null;
      const act = cfg.act || 'idle';
      m.set(act, t == null ? 1.1 : +t, a => {
        if (v) a.lookAt(v[0], v[1], cfg.hold || 2.6);
        if (id === 'sent') a.burst(8);
      });
      if (cfg.say && !reduced) {
        fill(cfg.say);
        bubble.classList.remove('is-in', 'is-out');
        bubble.classList.add('is-static');
        bubbleOn = true;
      } else unsay();
      return api.state();
    },
    play() {
      st.frozen = false;
      root.classList.remove('is-instant', 'is-on');
      bubble.classList.remove('is-static');
      bubbleOn = false;
      st.shown = false;
      if (!reduced && !still) { m.S.auto = true; m.play(); }
      m.setVisible(false);
      update();
    },
    state() {
      return {
        shown: st.shown, frozen: st.frozen, dismissed: st.dead, section: st.current, hero: st.hero, footer: st.footer,
        form: st.form, twin: st.twin, text: !!st.text, story: !!st.story, still,
        covering: [...hits].map(el => el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '')),
        bubble: bubbleOn ? bubble.textContent : null, said: [...said], ticking: m.ticking(), rig: m.state()
      };
    },
    reset() { store.set(null); said.clear(); reacted.clear(); }
  };
  window.SparkeeCompanion = api;

  if (test) {
    const [id, t] = test.split('@');
    const run = () => setTimeout(() => api.show(id, t == null ? undefined : parseFloat(t)), 350);
    if (document.readyState === 'complete') run(); else addEventListener('load', run, { signal });
  }
})();
