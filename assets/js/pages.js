/* Sparkee – pages.js (podstránky: blog, články, služby, 404) – vanilla, bez závislostí.
   Nezávislé na site.js: nav, burger, reveal, progress bar, TOC, filtr kategorií, newsletter. */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- nav ---------- */
  const nav = $('[data-nav]');
  const burger = $('[data-burger]');
  if (nav) {
    // is-stuck bez scroll listeneru: 10px „hlídka“ nahoře stránky
    const sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:10px;pointer-events:none;visibility:hidden';
    document.body.append(sentinel);
    new IntersectionObserver(([e]) => nav.classList.toggle('is-stuck', !e.isIntersecting)).observe(sentinel);
  }
  if (nav && burger) {
    const setOpen = open => {
      nav.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Zavřít menu' : 'Otevřít menu');
    };
    burger.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
    $$('.nav__links a', nav).forEach(a => a.addEventListener('click', () => setOpen(false)));
    addEventListener('keydown', e => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); burger.focus(); }
    });
    document.addEventListener('click', e => {
      if (nav.classList.contains('is-open') && !nav.contains(e.target)) setOpen(false);
    });
    nav.addEventListener('click', e => { if (nav.classList.contains('is-open') && e.target === nav) setOpen(false); });   // ťuk na závoj (.nav::before, site.css)
  }

  /* ---------- reveal ---------- */
  const reveals = $$('.reveal');
  if (reduced || !('IntersectionObserver' in window)) {
    reveals.forEach(el => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(el => {
      const sibs = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
      el.style.setProperty('--d', (sibs.indexOf(el) * 0.07) + 's');
      io.observe(el);
    });
  }

  /* ---------- reading progress ----------
     Moderní prohlížeče: čisté CSS (scroll-driven animace v pages.css, žádný scroll listener).
     Fallback (bez animation-timeline, nebo reduced motion, kde globální pravidlo animace vypíná): rAF. */
  const bar = $('[data-progress]');
  const article = $('[data-article]');
  const cssProgress = window.CSS && CSS.supports('animation-timeline: view()') && CSS.supports('timeline-scope: --a');
  if (bar && article && (!cssProgress || reduced)) {
    document.documentElement.classList.add('js-progress');
    let ticking = false;
    const update = () => {
      const r = article.getBoundingClientRect();
      const total = r.height - innerHeight * 0.6;
      const p = Math.max(0, Math.min(1, -r.top / (total > 0 ? total : 1)));
      bar.style.setProperty('--p', p.toFixed(4));
      ticking = false;
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener('resize', update); update();
  }

  /* ---------- TOC: na mobilu/tabletu sbalený ---------- */
  const tocBox = $('details.toc');
  if (tocBox && matchMedia('(max-width:1080px)').matches) tocBox.open = false;

  /* ---------- TOC: aktivní sekce ---------- */
  const tocLinks = $$('[data-toc] a[href^="#"]');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const map = new Map();
    tocLinks.forEach(a => { const t = document.getElementById(decodeURIComponent(a.hash.slice(1))); if (t) map.set(t, a); });
    const setActive = a => tocLinks.forEach(l => l.classList.toggle('is-active', l === a));
    const heads = [...map.keys()];
    const onCross = () => {
      let current = heads[0];
      heads.forEach(h => { if (h.getBoundingClientRect().top < 140) current = h; });
      setActive(map.get(current));
    };
    // přepočet jen když obsah překročí pásmo 140 px od horního okraje (ne při každém scroll eventu);
    // sledujeme i odstavce a bloky <main>, aby se stav chytil i po skoku (End, klik v obsahu)
    const tocIO = new IntersectionObserver(onCross, { rootMargin: '-140px 0px -60% 0px' });
    new Set([...heads, ...$$('.prose > *'), ...$$('main > *')]).forEach(el => tocIO.observe(el));
  }

  /* ---------- blog: filtr kategorií ---------- */
  const chips = $$('[data-filter]');
  if (chips.length) {
    const cards = $$('[data-cat]');
    const empty = $('[data-empty]');
    const status = $('[data-filter-status]');
    const plural = n => n === 1 ? 'Zobrazen 1 článek' : (n >= 2 && n <= 4 ? `Zobrazeny ${n} články` : `Zobrazeno ${n} článků`);
    const apply = (cat, announce) => {
      let n = 0;
      cards.forEach(c => { const show = cat === 'vse' || c.dataset.cat === cat; c.hidden = !show; if (show) n++; });
      chips.forEach(ch => ch.setAttribute('aria-pressed', ch.dataset.filter === cat));
      if (empty) empty.hidden = n > 0;
      if (announce && status) status.textContent = plural(n) + '.';
    };
    chips.forEach(ch => ch.addEventListener('click', () => {
      apply(ch.dataset.filter, true);
      const url = new URL(location.href);
      if (ch.dataset.filter === 'vse') url.searchParams.delete('kategorie'); else url.searchParams.set('kategorie', ch.dataset.filter);
      history.replaceState(null, '', url);
    }));
    const initial = new URLSearchParams(location.search).get('kategorie');
    if (initial && chips.some(c => c.dataset.filter === initial)) apply(initial);
  }

  /* ---------- newsletter (placeholder, bez backendu) ---------- */
  $$('[data-newsletter]').forEach(form => form.addEventListener('submit', e => {
    e.preventDefault(); // [DOPLNIT] napojit na e-mailingový nástroj / tracking gateway
    if (!form.reportValidity()) return;
    // živý region je v DOM od začátku (prázdný), vložený text čtečka oznámí
    const ok = $('[data-newsletter-ok]', form.parentElement);
    if (ok) ok.textContent = 'Hotovo! První jiskra dorazí brzy.';
    form.reset();
  }));

  /* ---------- sdílení článku ---------- */
  $$('[data-copy-link]').forEach(b => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(location.href.split('#')[0]); b.textContent = 'Odkaz zkopírován'; }
    catch { b.textContent = 'Zkopírujte z adresního řádku'; }
  }));

  /* ---------- 404: maskot se rozsvítí ---------- */
  const nf = $('[data-relight]');
  if (nf) nf.addEventListener('click', () => nf.classList.toggle('is-lit'));

  const y = $('[data-year]'); if (y) y.textContent = new Date().getFullYear();
})();
