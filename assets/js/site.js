/* Sparkee – site.js (vanilla, bez závislostí) */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(hover: none), (pointer: coarse)').matches;

  /* ---------- nav ---------- */
  const nav = $('[data-nav]');
  // is-stuck bez scroll listeneru: 10px „hlídka“ nahoře stránky, jakmile odjede z viewportu, nav dostane pozadí
  const sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:10px;pointer-events:none;visibility:hidden';
  document.body.append(sentinel);
  new IntersectionObserver(([e]) => nav.classList.toggle('is-stuck', !e.isIntersecting)).observe(sentinel);
  const burger = $('[data-burger]');
  const isOpen = () => nav.classList.contains('is-open');
  const setOpen = open => {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Zavřít menu' : 'Otevřít menu');
  };
  burger.addEventListener('click', () => setOpen(!isOpen()));
  $$('.nav__links a').forEach(a => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen()) { setOpen(false); burger.focus(); }
  });
  document.addEventListener('click', e => { if (isOpen() && !nav.contains(e.target)) setOpen(false); });
  nav.addEventListener('click', e => { if (isOpen() && e.target === nav) setOpen(false); });   // ťuk na závoj (.nav::before)

  /* ---------- hero: parallax plovoucích karet za kurzorem ----------
     Maskota (pohled, mávání, poskoky, reakce z telefonu, nadšení nad CTA [data-excite], klik)
     řídí assets/js/mascot.js – window.SparkeeMascot. */
  const stage = $('[data-stage]');
  const cards = stage ? $$('.float-card', stage) : [];
  let tx = 0, ty = 0, cx = 0, cy = 0, visible = true, raf = 0;
  const tick = () => {
    cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12;
    cards.forEach(c => {
      const d = +c.dataset.depth || 1;
      c.style.setProperty('--px', (cx * 14 * d).toFixed(1));
      c.style.setProperty('--py', (cy * 10 * d).toFixed(1));
    });
    raf = visible && (Math.abs(tx - cx) > 1e-3 || Math.abs(ty - cy) > 1e-3) ? requestAnimationFrame(tick) : 0;
  };
  if (cards.length && !reduced && !coarse) {
    const kick = () => { if (!raf && visible) raf = requestAnimationFrame(tick); };
    addEventListener('pointermove', e => {
      const r = stage.getBoundingClientRect();
      tx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (innerWidth * 0.45)));
      ty = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height * 0.4)) / (innerHeight * 0.45)));
      kick();
    }, { passive: true });
    document.addEventListener('pointerleave', () => { tx = ty = 0; kick(); });
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(stage);
  }

  /* reakce (srdíčka / bubliny) vyletí z telefonu v tlapce maskota */
  const burst = (n = 5) => { if (!reduced && window.SparkeeMascot && window.SparkeeMascot.burst) window.SparkeeMascot.burst(n); };

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => {
    const sibs = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
    el.style.setProperty('--d', (sibs.indexOf(el) * 0.08) + 's');
    io.observe(el);
  });

  /* ---------- KPI počítadla ---------- */
  const fmt = (v, dec) => v.toLocaleString('cs-CZ', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const countIO = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, to = parseFloat(el.dataset.count), dec = +(el.dataset.decimals || 0), suf = el.dataset.suffix || '';
    countIO.unobserve(el);
    if (reduced) { el.textContent = fmt(to, dec) + suf; return; }
    const t0 = performance.now(), dur = 1600;
    const step = t => {
      const p = Math.min(1, (t - t0) / dur), k = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(to * k, dec) + suf;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }), { threshold: 0.5 });
  // v HTML jsou skutečná čísla (crawleři, bez JS); s animací startujeme od nuly
  $$('[data-count]').forEach(el => {
    if (!reduced) el.textContent = fmt(0, +(el.dataset.decimals || 0)) + (el.dataset.suffix || '');
    countIO.observe(el);
  });

  /* ---------- ceník: měsíčně / závazek ---------- */
  const DISCOUNT = 0.10;
  const billingStatus = $('[data-billing-status]');
  $$('[data-billing]').forEach(btn => btn.addEventListener('click', () => {
    const commit = btn.dataset.billing === 'commit';
    if (billingStatus) billingStatus.textContent = commit
      ? 'Zobrazeny ceny při závazku na 6 měsíců, sleva 10 %.'
      : 'Zobrazeny ceny při měsíční platbě.';
    $$('[data-billing]').forEach(b => { const on = b === btn; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on); });
    $$('[data-price]').forEach(p => {
      const base = +p.dataset.price;
      const val = commit ? Math.round(base * (1 - DISCOUNT) / 100) * 100 : base;
      p.textContent = val.toLocaleString('cs-CZ');
      p.classList.add('is-bump'); setTimeout(() => p.classList.remove('is-bump'), 250);
    });
  }));

  /* ---------- formulář (placeholder, bez backendu) ---------- */
  const form = $('[data-form]');
  if (form) {
    const fields = ['name', 'email'].map(n => form.elements[n]);
    const errOf = f => document.getElementById(f.getAttribute('aria-describedby'));
    const check = f => {
      const ok = f.checkValidity();
      f.setAttribute('aria-invalid', String(!ok));
      const err = errOf(f); if (err) err.hidden = ok;
      return ok;
    };
    // po první chybě hlídáme pole průběžně, ať chybová hláška zmizí hned po opravě
    fields.forEach(f => f.addEventListener('input', () => { if (f.getAttribute('aria-invalid') === 'true') check(f); }));
    form.addEventListener('submit', e => {
      e.preventDefault(); // [DOPLNIT] napojit na endpoint / tracking gateway
      const bad = fields.filter(f => !check(f));
      if (bad.length) { bad[0].focus(); return; }
      // [DOPLNIT] po napojení endpointu: btn.disabled = true; btn.textContent = 'Odesílám…'; a po odpovědi vrátit
      const ok = $('[data-form-ok]', form);
      ok.hidden = false;
      $('[data-form-ok-text]', ok).textContent = 'Díky! Ozveme se do 24 hodin.';
      burst(10);
      form.reset();
      fields.forEach(f => f.removeAttribute('aria-invalid'));
    });
    // předvýběr služby z URL: /?sluzba=paid#kontakt (sprava | content | influenceri | paid)
    const s = new URLSearchParams(location.search).get('sluzba');
    const chip = s && [...form.querySelectorAll('input[name="interest"]')].find(i => i.value === s);
    if (chip) chip.checked = true;

    // balíček z ceníku: /?balicek=glow#kontakt předvyplní zprávu (tlačítka „Chci Spark/Glow/Blaze“)
    const PLANS = { spark: 'Spark', glow: 'Glow', blaze: 'Blaze' };
    const msg = form.elements.message;
    const pickPlan = k => {
      if (!PLANS[k] || !msg) return;
      const cur = msg.value.trim();
      if (!cur || /^Mám zájem o balíček \w+\.$/.test(cur)) msg.value = `Mám zájem o balíček ${PLANS[k]}.`;
    };
    pickPlan(new URLSearchParams(location.search).get('balicek'));
    $$('[data-plan]').forEach(a => a.addEventListener('click', e => {
      e.preventDefault(); // bez reloadu stránky: předvyplnit, přepsat URL a sjet k formuláři
      const k = a.dataset.plan;
      pickPlan(k);
      const url = new URL(location.href);
      url.searchParams.set('balicek', k); url.hash = 'kontakt';
      history.replaceState(null, '', url);
      const target = document.getElementById('kontakt');
      if (target) target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    }));
  }

  /* ---------- marquee: klik pozastaví / rozjede ---------- */
  const marquee = $('.marquee');
  const mToggle = $('[data-marquee-toggle]');
  const setPaused = p => {
    marquee.classList.toggle('is-paused', p);
    if (mToggle) mToggle.setAttribute('aria-pressed', String(p)); // přepínač: popisek stálý, stav nese aria-pressed
  };
  if (marquee) marquee.addEventListener('click', () => setPaused(!marquee.classList.contains('is-paused')));
  if (marquee && mToggle) mToggle.addEventListener('click', () => setPaused(!marquee.classList.contains('is-paused')));

  const y = $('[data-year]'); if (y) y.textContent = new Date().getFullYear();
})();
