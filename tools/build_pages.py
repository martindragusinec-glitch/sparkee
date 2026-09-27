#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sparkee – generátor podstránek (statické HTML, jen standardní knihovna Pythonu)
===============================================================================
Spuštění z kořene projektu:

    python3 tools/build_pages.py

Generuje (a PŘEPISUJE):  blog/index.html, blog/*.html, sluzby/index.html, sluzby/*.html,
                         404.html, sitemap.xml, robots.txt
V index.html jen srovná: og:image / twitter:image / JSON-LD image (URL s ?v=) a alt podle tools/og/cards.json "/".
Negeneruje:              index.html (homepage je ruční), assets/css/pages.css, assets/js/pages.js

Mapa souboru
  1. KONFIGURACE    doména, fonty, navigace, autor
  2. PARTIALS       HEAD, HEADER, FOOTER, CTA, NEWSLETTER, AUTHOR_BOX – sdílené všemi stránkami
  3. HELPERY        šablony {{…}}, JSON-LD, karty článků/služeb, ikonky
  4. DATA: BLOG     seznam článků, karty „Připravujeme“, kategorie
  5. DATA: SLUŽBY   obsah 4 landing pages (texty, ceny, FAQ, kroky)
  6. DATA: ČLÁNKY   meta + HTML těla článků
  7. STRÁNKY        buildery (blog, článek, služba, přehled služeb, 404, sitemap/robots)
  8. MAIN

Partials používají značky {{nazev}} (ne str.format), takže v nich můžou být i { } z CSS/JSON.

Fonty: HEAD načítá GOOGLE_FONTS; rodiny se přiřazují v assets/css/site.css (--f-display, --f-body)
       a pages.css používá jen tyhle proměnné.
Tón:   [DOPLNIT] texty jsou zatím ve vykání, brand je tykání – převést v PARTIALS, v šablonách
       stránek (sekce 7) i v datech (sekce 4–6).
"""
import hashlib
import html
import json
import re
from pathlib import Path

# =====================================================================
# 1. KONFIGURACE
# =====================================================================
ROOT = Path(__file__).resolve().parent.parent   # sparkee-web/
SITE = "https://sparkee.cz"                     # [DOPLNIT] finální doména (canonical, OG, JSON-LD, sitemap)
# OG obrázky 1200×630 (JPEG): jeden na stránku, data v tools/og/cards.json (cesta stránky → soubor + alt).
# Generuje `node tools/og_build.mjs` do assets/img/og/. Stránka bez karty (404) dostane kartu homepage "/".
# URL nese ?v=<hash obsahu>: po přegenerování se změní a Facebook/LinkedIn si stáhnou nový obrázek.
OG_CARDS = {k: v for k, v in json.loads((ROOT / "tools/og/cards.json").read_text(encoding="utf-8")).items()
            if not k.startswith("_")}
OG_FALLBACK = {"/404.html"}                     # stránky, které záměrně sdílí kartu "/"


def og_for(path):
    """(absolutní URL obrázku s ?v=hash, alt) pro cestu stránky."""
    if path not in OG_CARDS and path not in OG_FALLBACK:
        print(f"  ! OG: {path} nemá kartu v tools/og/cards.json, použije se homepage")
    card = OG_CARDS.get(path, OG_CARDS["/"])
    rel = f"assets/img/og/{card['file']}.jpg"
    f = ROOT / rel
    if not f.exists():
        print(f"  ! OG: chybí {rel}, spusťte node tools/og_build.mjs")
        return f"{SITE}/{rel}", card["alt"]
    return f"{SITE}/{rel}?v={hashlib.sha1(f.read_bytes()).hexdigest()[:8]}", card["alt"]


SITEMAP_LASTMOD = "2026-09-26"                  # lastmod pro homepage, služby a blog index

# Brand fonty (Figma): Baloo 2 Bold/ExtraBold = nadpisy, Nunito = text.
# Stejná URL jako v index.html (sdílená cache). Přiřazení rodin: site.css → --f-display / --f-body.
GOOGLE_FONTS = ("https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800"
                "&family=Nunito:wght@400;500;600;700;800&display=swap")

# Hlavní navigace – (text, odkaz, klíč stránky pro aria-current)
NAV = [
    ("Služby", "/sluzby/", "sluzby"),
    ("Jak pracujeme", "/#jak-pracujeme", None),
    ("Výsledky", "/#vysledky", None),
    ("Ceník", "/#cenik", None),
    ("Blog", "/blog/", "blog"),
    ("FAQ", "/#faq", None),
]

# Autor článků (meta řádek, author box, JSON-LD).
# [DOPLNIT] konkrétní člověk kvůli E-E-A-T → v build_article pak přepni JSON-LD author na "Person".
AUTHOR_NAME = "Tým Sparkee"

ORG_ID = SITE + "/#organization"   # musí sedět s Organization JSON-LD na homepage
ORG_REF = {"@type": "Organization", "@id": ORG_ID, "name": "Sparkee", "url": SITE + "/",
           "logo": {"@type": "ImageObject", "url": SITE + "/assets/img/logo.svg"}}


# =====================================================================
# 2. PARTIALS – sdílené kusy stránek. Změna tady = změna na všech podstránkách.
# =====================================================================

# <head> každé stránky. {{json_ld}} = strukturovaná data stránky, {{article_meta}} = article:* jen u článků.
HEAD = """<!doctype html>
<!-- Vygenerováno: tools/build_pages.py. Ruční úpravy se při dalším buildu přepíšou. -->
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>{{title}}</title>
<meta name="description" content="{{description}}">
<meta name="robots" content="{{robots}}">
<!-- [DOPLNIT] doména: canonical/og:url počítají se sparkee.cz -->
<link rel="canonical" href="{{url}}">
<meta name="theme-color" content="#F6F4EF">
<link rel="icon" href="/assets/img/mascot-head.svg" type="image/svg+xml">
<link rel="icon" href="/assets/img/icons/favicon-32.png" type="image/png" sizes="32x32">
<link rel="icon" href="/assets/img/icons/icon-192.png" type="image/png" sizes="192x192">
<link rel="apple-touch-icon" href="/assets/img/icons/apple-touch-icon.png" sizes="180x180">
<link rel="manifest" href="/site.webmanifest">
<meta property="og:locale" content="cs_CZ">
<meta property="og:site_name" content="Sparkee">
<meta property="og:type" content="{{og_type}}">
<meta property="og:title" content="{{title}}">
<meta property="og:description" content="{{description}}">
<meta property="og:url" content="{{url}}">
<meta property="og:image" content="{{og_image}}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{{og_alt}}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{{title}}">
<meta name="twitter:description" content="{{description}}">
<meta name="twitter:image" content="{{og_image}}">
<meta name="twitter:image:alt" content="{{og_alt}}">
{{article_meta}}<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="{{fonts}}" rel="stylesheet">
<script>document.documentElement.classList.add('js')</script>
<link rel="stylesheet" href="/assets/css/site.css">
<link rel="stylesheet" href="/assets/css/pages.css">
{{json_ld}}</head>"""

# Hlavička – kopie z index.html s root-relative odkazy. {{nav_links}} se skládá z NAV.
HEADER = """<body>
<a class="skip" href="#main">Přeskočit na obsah</a>{{progress_bar}}

<!-- ========== HEADER (kopie z index.html, root-relative odkazy) ========== -->
<header class="nav" data-nav>
  <div class="nav__inner wrap">
    <a href="/" class="nav__logo" aria-label="Sparkee, úvodní stránka"><img src="/assets/img/logo.svg" alt="Sparkee" width="132" height="68"></a>
    <button class="nav__burger" aria-controls="site-menu" aria-expanded="false" aria-label="Otevřít menu" data-burger><span></span><span></span></button>
    <nav class="nav__links" id="site-menu" aria-label="Hlavní navigace">
{{nav_links}}
      <a href="/#kontakt" class="btn btn--holo nav__menu-cta">Nezávazná konzultace</a>
    </nav>
    <a href="/#kontakt" class="btn btn--ink btn--sm nav__cta">Nezávazná konzultace</a>
  </div>
</header>
"""

# Patička + skripty + konec dokumentu.
FOOTER = """
<!-- ========== FOOTER (kopie z index.html, root-relative odkazy) ========== -->
<footer class="footer">
  <div class="wrap footer__inner">
    <div class="footer__brand">
      <img src="/assets/img/logo.svg" alt="Sparkee" width="180" height="93" loading="lazy">
      <p><span lang="en">Social Media with a Spark</span><br>Dodáme jiskru vašim sociálním sítím.</p>
    </div>
    <div class="footer__col">
      <h2 class="footer__title">Sparkee</h2>
      <a href="/sluzby/">Služby</a><a href="/#jak-pracujeme">Jak pracujeme</a><a href="/#cenik">Ceník</a><a href="/#reference">Reference</a><a href="/blog/">Blog</a>
    </div>
    <div class="footer__col">
      <h2 class="footer__title">Služby</h2>
      <a href="/sluzby/sprava-socialnich-siti.html">Správa sociálních sítí</a>
      <a href="/sluzby/tvorba-obsahu.html">Tvorba obsahu</a>
      <a href="/sluzby/influencer-marketing.html">Influencer marketing</a>
      <a href="/sluzby/paid-social.html">Paid social</a>
    </div>
    <div class="footer__col">
      <h2 class="footer__title">Kontakt</h2>
      <a href="mailto:ahoj@sparkee.cz">ahoj@sparkee.cz [DOPLNIT]</a>
      <a href="tel:+420000000000">+420 000 000 000 [DOPLNIT]</a>
      <span>IČO: [DOPLNIT]</span>
      <div class="footer__social"><a href="https://www.instagram.com/" target="_blank" rel="noopener">Instagram</a><a href="https://www.tiktok.com/" target="_blank" rel="noopener">TikTok</a><a href="https://www.linkedin.com/" target="_blank" rel="noopener">LinkedIn</a></div> <!-- [DOPLNIT] URL profilů Sparkee (zatím jen domény sítí) -->
    </div>
  </div>
  <div class="wrap footer__bottom">
    <span>© <span data-year>2026</span> Sparkee</span>
    <a href="/zasady-ochrany-osobnich-udaju/">Zásady ochrany osobních údajů</a> <!-- [DOPLNIT] URL zásad OOÚ (stránka zatím neexistuje) -->
  </div>
</footer>

<script src="/assets/js/pages.js" defer></script>
</body>
</html>
"""

# Tmavý CTA pás na konci služeb a přehledu služeb (odkazuje na formulář na homepage).
# {{cta_href}}: /?sluzba=KLÍČ#kontakt na stránce služby (homepage formulář předvybere čip), jinak /#kontakt.
CTA = """
<section class="section cta cta--simple" id="konzultace">
  <div class="wrap cta__inner">
    <div class="cta__art" aria-hidden="true">
      <div class="cta__glow"></div>
      <img src="/assets/img/mascot.svg" alt="" width="264" height="443" class="cta__mascot" loading="lazy">
    </div>
    <div class="cta__copy">
      <h2>Pojďme vašim sítím<br>dodat <span class="holo-text">jiskru.</span></h2>
      <p>Řekneme vám, co funguje, co ne a kde je největší potenciál.</p>
      <ul class="cta__list"><li>20 minut</li><li>Zdarma a nezávazně</li><li>Konkrétní doporučení</li></ul>
      <div class="cta__actions">
        <a href="{{cta_href}}" class="btn btn--holo">Nezávazná konzultace <span aria-hidden="true">→</span></a>
        <a href="/#cenik" class="btn btn--ghost">Ceník balíčků</a>
      </div>
    </div>
  </div>
</section>
"""

# Newsletter blok (blog index + články). Formulář je zatím placeholder – obsluha v assets/js/pages.js.
NEWSLETTER = """
<aside class="newsletter reveal" aria-labelledby="nl-title">
  <div class="newsletter__inner">
    <img class="newsletter__art" src="/assets/img/mascot-sticker.svg" alt="" width="292" height="450" loading="lazy">
    <div>
      <span class="eyebrow eyebrow--light">Newsletter</span>
      <h2 id="nl-title">Jedna <span class="holo-text">jiskra</span> měsíčně do e-mailu.</h2>
      <p>Tipy na obsah, trendy a čísla ze sítí, které se dají hned použít. Žádný spam, odhlášení jedním klikem.</p>
      <!-- [DOPLNIT] napojit na e-mailingový nástroj (Ecomail / Mailchimp / SmartEmailing) + tracking gateway -->
      <form class="nl-form" action="#" method="post" data-newsletter>
        <label class="sr-only" for="nl-email">E-mail</label>
        <input id="nl-email" type="email" name="email" placeholder="vas@email.cz" autocomplete="email" required>
        <button class="btn btn--holo" type="submit">Odebírat</button>
      </form>
      <p class="nl-ok" role="status" aria-live="polite" data-newsletter-ok></p>
      <!-- [DOPLNIT] URL zásad (stránka zatím neexistuje); nová karta = rozepsaný e-mail nezmizí -->
      <p class="nl-note">Odesláním souhlasíte se zpracováním e-mailu dle <a href="/zasady-ochrany-osobnich-udaju/" target="_blank" rel="noopener">zásad ochrany osobních údajů</a> [DOPLNIT].</p>
    </div>
  </div>
</aside>"""

# Box o autorovi pod každým článkem.
AUTHOR_BOX = """    <!-- [DOPLNIT] autor: jméno, role, fotka (E-E-A-T) -->
    <aside class="author-box" aria-label="O autorovi">
      <div class="author-box__ava"><img src="/assets/img/mascot-head.svg" alt="" width="60" height="71" loading="lazy"></div>
      <div>
        <small>Napsal</small>
        <b>{{author_name}}</b>
        <p>Social media agentura, která dodává jiskru sítím malých a středních firem. Denně tvoříme obsah, spravujeme komunity a ladíme kampaně. Tady sdílíme, co funguje.</p>
      </div>
    </aside>"""


# =====================================================================
# 3. HELPERY
# =====================================================================
def fill(template, **values):
    """Doplní značky {{klic}} v šabloně. Vložené hodnoty se už znovu neprochází."""
    def rep(m):
        key = m.group(1)
        if key not in values:
            raise KeyError(f"šabloně chybí hodnota pro {{{{{key}}}}}")
        return str(values[key])
    return re.sub(r"\{\{(\w+)\}\}", rep, template)


def esc(s):
    return html.escape(s, quote=True)


def cta(href="/#kontakt"):
    return fill(CTA, cta_href=href)


def ld(obj):
    return '<script type="application/ld+json">\n' + json.dumps(obj, ensure_ascii=False, indent=2) + '\n</script>'


def head(title, desc, path, og_type="website", lds=(), article_meta="", robots="index, follow, max-image-preview:large", canonical=True):
    og_image, og_alt = og_for(path)
    out = fill(HEAD, title=esc(title), description=esc(desc), robots=robots, url=SITE + path,
               og_type=og_type, og_image=og_image, og_alt=esc(og_alt), article_meta=article_meta,
               fonts=GOOGLE_FONTS, json_ld="".join(ld(o) + "\n" for o in lds))
    if not canonical:  # např. 404: bez canonical a og:url
        out = re.sub(r'<link rel="canonical"[^>]*>\n|<meta property="og:url"[^>]*>\n', "", out)
    return out


def header(active=None, progress=False):
    links = "\n".join(
        f'      <a href="{href}"' + (' aria-current="page"' if key and key == active else "") + f">{text}</a>"
        for text, href, key in NAV)
    bar = '\n<div class="read-progress" aria-hidden="true"><i data-progress></i></div>' if progress else ""
    return fill(HEADER, nav_links=links, progress_bar=bar)


def breadcrumb_ld(items):
    """items: [(název, cesta), …]"""
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": n, "item": SITE + p}
            for i, (n, p) in enumerate(items)
        ],
    }


def crumbs_html(items):
    lis = []
    for i, (n, p) in enumerate(items):
        if i == len(items) - 1:
            lis.append(f'<li><span aria-current="page">{esc(n)}</span></li>')
        else:
            lis.append(f'<li><a href="{p}">{esc(n)}</a></li>')
    return '<nav class="crumbs" aria-label="Drobečková navigace"><ol>' + "".join(lis) + '</ol></nav>'


def faq_ld(faqs):
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {"@type": "Question", "name": q,
             "acceptedAnswer": {"@type": "Answer", "text": re.sub(r"<[^>]+>", "", a)}}
            for q, a in faqs
        ],
    }


SPARK = '<svg class="spark {c}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0c1 7 5 11 12 12-7 1-11 5-12 12-1-7-5-11-12-12C7 11 11 7 12 0z"/></svg>'

BG = ('<div class="hero__bg" aria-hidden="true"><span class="blob blob--mint"></span><span class="blob blob--lav"></span>'
      '<span class="blob blob--pink"></span></div>')

ICONS = {
    "calendar": '<rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/><path d="M8 14h3M13 14h3M8 17.5h3"/>',
    "chat": '<path d="M20 11.5a7.5 7.5 0 0 1-11 6.6L4 19.5l1.4-4.2A7.5 7.5 0 1 1 20 11.5z"/><path d="M9 11.5h.01M12.5 11.5h.01M16 11.5h.01"/>',
    "chart": '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    "spark": '<path d="M12 2c.6 5.4 3.9 8.7 9.3 9.3-5.4.6-8.7 3.9-9.3 9.3-.6-5.4-3.9-8.7-9.3-9.3C8.1 10.7 11.4 7.4 12 2z"/>',
    "camera": '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.8"/>',
    "video": '<rect x="2.5" y="5.5" width="14" height="13" rx="3"/><path d="M16.5 10.5l5-3v9l-5-3"/>',
    "users": '<circle cx="9" cy="8.5" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 5.2a3.5 3.5 0 0 1 0 6.6M18 14.3a6.5 6.5 0 0 1 3.5 5.7"/>',
    "target": '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
    "shield": '<path d="M12 2.5l8 3v6c0 5-3.5 8.6-8 10-4.5-1.4-8-5-8-10v-6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    "clock": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    "heart": '<path d="M12 20s-7.5-4.5-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.5-7.5 10-7.5 10z"/>',
    "trend": '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    "pen": '<path d="M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10z"/><path d="M13.5 7.5l3 3"/>',
    "layers": '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    "eye": '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    "coins": '<ellipse cx="9" cy="7" rx="6" ry="3"/><path d="M3 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3V7"/><path d="M9 15v2c0 1.7 2.7 3 6 3s6-1.3 6-3v-5c0-1.6-2.4-2.9-5.5-3"/>',
}


def icon(name):
    return f'<span class="benefit__icon" aria-hidden="true"><svg viewBox="0 0 24 24">{ICONS[name]}</svg></span>'


# Ilustrace služeb: stejné třídy jako bento na homepage (site.css .tile__cal / .tile__phones / .tile__faces / .bars).
VISUALS = {
    "cal": ('<div class="tile__cal" aria-hidden="true">'
            + "".join(f"<span>{d}</span>" for d in ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"])
            + '<b class="on"></b><b></b><b class="on"></b><b></b><b class="on lav"></b><b></b><b class="on pink"></b>'
            + '<b></b><b class="on"></b><b></b><b class="on lav"></b><b></b><b class="on"></b><b></b></div>'),
    "phones": '<div class="tile__phones" aria-hidden="true"><i></i><i></i><i></i></div>',
    "faces": '<div class="tile__faces" aria-hidden="true"><span></span><span></span><span></span><em>+12</em></div>',
    "bars": ('<div class="bars" aria-hidden="true">'
             + "".join(f'<i style="--h:{h}%"></i>' for h in (38, 52, 47, 66, 71, 88)) + '</div>'),
}


MONTHS = ["ledna", "února", "března", "dubna", "května", "června", "července", "srpna", "září", "října", "listopadu", "prosince"]


def cz_date(iso):
    y, m, d = iso.split("-")
    return f"{int(d)}. {MONTHS[int(m) - 1]} {y}"


def words(html_text):
    txt = re.sub(r"<[^>]+>", " ", html_text)
    return len(re.findall(r"\w+", txt))


def reading_time(html_text):
    return max(1, round(words(html_text) / 200))


def fmt_price(n):
    return f"{n:,}".replace(",", " ")


def label_tables(h):
    """Přidá data-label k <td> podle <th> v thead (tabulky se na mobilu skládají do karet)."""
    def one(m):
        t = m.group(0)
        heads = [re.sub(r"<[^>]+>", "", x).strip() for x in re.findall(r"<th>(.*?)</th>", t.split("</thead>")[0])]

        def row(rm):
            cells = iter(heads)
            # obsah buňky v <span>: na mobilu je buňka 2sloupcový grid (štítek | hodnota) a hodnota musí být jeden celek
            return re.sub(r"<td>(.*?)</td>",
                          lambda cm: '<td data-label="%s"><span>%s</span></td>' % (esc(next(cells, "")), cm.group(1)),
                          rm.group(0), flags=re.S)
        head_part, _, body = t.partition("</thead>")
        out = head_part + "</thead>" + re.sub(r"<tr>.*?</tr>", row, body, flags=re.S)
        # Explicitní ARIA role: na mobilu mají tr/td display:block/grid a Safari/VoiceOver by jinak
        # zahodil sémantiku tabulky. Skrytý <caption> = text nejbližšího předchozího <h2>.
        prev = re.findall(r"<h2[^>]*>(.*?)</h2>", h[:m.start()], flags=re.S)
        cap = re.sub(r"<[^>]+>", "", prev[-1]).strip() if prev else ""
        out = out.replace("<table>", '<table role="table">' + (f'<caption class="sr-only">{cap}</caption>' if cap else ""), 1)
        out = out.replace("<thead>", '<thead role="rowgroup">').replace("<tbody>", '<tbody role="rowgroup">')
        out = out.replace("<tr>", '<tr role="row">').replace("<th>", '<th role="columnheader">')
        return out.replace("<td data-label", '<td role="cell" data-label')
    return re.sub(r"<table>.*?</table>", one, h, flags=re.S)


def post_card(p, feature=False, reading=None, hx="h3"):
    cls = "post-card reveal" + (" post-card--feature" if feature else "")
    rt = f'<span>{reading} min čtení</span>' if reading else ''
    extra = ('<img class="post-card__mascot" src="/assets/img/mascot-happy.svg" alt="" width="264" height="421" loading="lazy">'
             '<span class="sticker">Nejnovější ✦</span>') if feature else ''
    return f'''<article class="{cls}" data-cat="{p['cat']}">
  <a class="post-card__link" href="/blog/{p['slug']}.html">
    <div class="post-card__thumb {p['th']}" aria-hidden="true"><span class="post-card__glyph">{p['glyph']}</span>{extra}</div>
    <div class="post-card__body">
      <span class="post-card__cat">{p['cat_name']}</span>
      <{hx}>{esc(p['title'])}</{hx}>
      <p>{esc(p['excerpt'])}</p>
      <div class="post-meta"><span><time datetime="{p['date']}">{cz_date(p['date'])}</time></span>{rt}</div>
    </div>
  </a>
</article>'''


def soon_list(items):
    """Připravované články: kompaktní seznam pod mřížkou (bez náhledů a odkazů)."""
    lis = "\n".join(f'    <li><span>{p["cat_name"]}</span> {esc(p["title"])}</li>' for p in items)
    return f'''<section class="soon-list reveal" aria-labelledby="soon-title">
  <h2 id="soon-title">Připravujeme</h2>
  <ul>
{lis}
  </ul>
</section>'''


def service_card(s, hx="h3"):
    return f'''<article class="post-card reveal" data-cat="sluzby">
  <a class="post-card__link" href="/sluzby/{s['slug']}.html">
    <div class="post-card__thumb th-f" aria-hidden="true"><span class="post-card__glyph post-card__glyph--icon"><svg viewBox="0 0 24 24" focusable="false">{ICONS[s['icon']]}</svg></span></div>
    <div class="post-card__body">
      <span class="post-card__cat">Služba</span>
      <{hx}>{esc(s['name'])}</{hx}>
      <p>{esc(s['short'])}</p>
      <div class="post-meta"><span>od {fmt_price(s['price'])} Kč{s['price_unit']}</span></div>
    </div>
  </a>
</article>'''


# Česká typografie („vlna“): nezlomitelná mezera za jednopísmennými předložkami/spojkami,
# mezi skupinami číslic a mezi číslem a jednotkou. Jen text mezi tagy v <body>, bez <script>/<style>.
_VLNA_TOKENS = re.compile(r"(<!--.*?-->|<[^>]*>)", re.S)
_VLNA_RULES = [
    # v, k, s, z, o, u, a, i (+ velká) jako samostatné slovo; mezera i na konci textového uzlu („v <b>…“)
    (re.compile(r"(?:^|(?<=[\s(„\"])|(?<=&nbsp;))([vkszouaiVKSZOUAI])[ \t\n]+"), r"\1&nbsp;"),
    (re.compile(r"(?<=\d) (?=\d{3}\b)"), "&nbsp;"),              # 14 900, 1 000 000
    (re.compile(r"(?<=\d) (?=(?:Kč|%|min\b))"), "&nbsp;"),       # 900 Kč, 10 %, 5 min
    (re.compile(r"(?<=\S) (?=\+(?:\s|$))"), "&nbsp;"),            # „60 000 Kč +“
    # rozsahy čísel a časů se nesmí zlomit na spojovníku („3-“ / „4 příspěvky“ vypadá jako mínus): 3-5, 7:00-9:00, 5 000-50 000
    # span.nw (pages.css: white-space:nowrap), ne U+2011 – Nunito ten znak nemusí mít
    (re.compile(r"\d(?:[\d.,:]|(?: |&nbsp;)(?=\d))*-\d(?:[\d.,:]|(?: |&nbsp;)(?=\d))*"), r'<span class="nw">\g<0></span>'),
]


def vlna(doc):
    start = doc.find("<body")
    if start < 0:
        return doc
    parts = _VLNA_TOKENS.split(doc[start:])
    skip = False
    for i, part in enumerate(parts):
        if i % 2:  # tag nebo komentář
            low = part[:8].lower()
            if low.startswith(("<script", "<style")):
                skip = True
            elif low.startswith(("</script", "</style")):
                skip = False
            continue
        if skip or not part.strip():
            continue
        for rx, rep in _VLNA_RULES:
            part = rx.sub(rep, part)
        parts[i] = part
    return doc[:start] + "".join(parts)


WRITTEN = []


def write(relpath, content, note=""):
    p = ROOT / relpath
    p.parent.mkdir(parents=True, exist_ok=True)
    if relpath.endswith(".html"):
        content = vlna(content)
    p.write_text(content, encoding="utf-8")
    WRITTEN.append(relpath)
    print(f"  {relpath}{note}")


# =====================================================================
# 4. DATA: BLOG – pořadí v POSTS = pořadí na blogu (první článek je velká „featured“ karta)
# =====================================================================
POSTS = [
    dict(slug="kolik-stoji-sprava-socialnich-siti", cat="strategie", cat_name="Strategie", th="th-a", glyph="Kč",
         title="Kolik stojí správa sociálních sítí v roce 2026?",
         excerpt="Freelancer, agentura, nebo vlastní člověk? Reálné cenové rozpětí, co ovlivňuje cenu a jak poznat, že neplatíte za vzduch.",
         date="2026-09-22"),
    dict(slug="jak-casto-postovat-na-instagram", cat="content", cat_name="Content", th="th-b", glyph="IG",
         title="Jak často postovat na Instagram v roce 2026",
         excerpt="Kolik Reels, carouselů a Stories týdně opravdu dává smysl podle typu firmy. Plus ukázkový týdenní plán.",
         date="2026-09-15"),
    dict(slug="influencer-marketing-pro-male-firmy", cat="influenceri", cat_name="Influenceři", th="th-c", glyph="@",
         title="Influencer marketing pro malé firmy bez velkého rozpočtu",
         excerpt="Nano a mikro influenceři, kolik stojí spolupráce, jak je najít, co napsat do briefu a jak měřit výsledky.",
         date="2026-09-08"),
]
# Karty „Připravujeme“ (bez odkazu). [DOPLNIT] napsat články, nebo karty smazat.
SOON = [
    dict(cat="reklama", cat_name="Reklama", th="th-d", glyph="Ad",
         title="Kolik dát do reklamy na začátek"),
    dict(cat="reporting", cat_name="Reporting", th="th-e", glyph="%",
         title="Report ze sociálních sítí, kterému porozumí i šéf"),
    dict(cat="strategie", cat_name="Strategie", th="th-f", glyph="✦",
         title="Content pilíře: měsíc obsahu za odpoledne"),
]
CATS = [("vse", "Vše"), ("strategie", "Strategie"), ("content", "Content"), ("influenceri", "Influenceři"),
        ("reklama", "Reklama"), ("reporting", "Reporting")]
POST_BY = {p["slug"]: p for p in POSTS}


# =====================================================================
# 5. DATA: SLUŽBY – ceny jsou placeholdery [DOPLNIT] (sjednotit s ceníkem na homepage)
# =====================================================================
SERVICES = [
  dict(
    slug="sprava-socialnich-siti", key="sprava", num="01", tile="tile--mint", art="/assets/img/mascot.svg", art_w=264, art_h=443,
    visual="cal", fit="Na sítě nemáte čas a profily stojí.",
    name="Správa sociálních sítí",
    seo_title="Správa sociálních sítí pro firmy: měsíční paušál | Sparkee",
    desc="Správa sociálních sítí na klíč: strategie, obsahový kalendář, publikace, komunitní management a report. Paušál od 14 900 Kč bez skrytých hodin.",
    h1='Správa sociálních sítí, které žijí <span class="holo-text">každý den.</span>',
    lead="Plánování, publikace, komunitní management a měsíční report. Vždy víte, co se na profilech děje a proč.",
    short="Kalendář na měsíc dopředu, publikace a odpovědi komunitě. Vy jen schvalujete.",
    inc_copy="Jeden měsíční paušál a předem daný počet příspěvků. Přesně víte, co dostanete a kolik zaplatíte.",
    icon="calendar",
    price=14900, price_unit="/měs.", tags=["Instagram", "Facebook", "TikTok", "LinkedIn"],
    benefits=[
      ("calendar", "Obsahový kalendář na měsíc dopředu", "Víte, co vyjde a kdy. Schvalujete najednou, ne každý den po kouscích."),
      ("chat", "Komunitní management", "Odpovídáme na komentáře a zprávy v pracovní dny, takže žádný dotaz nezapadne."),
      ("spark", "Strategie a content pilíře", "Každý příspěvek má svůj důvod. Žádné „něco tam dáme, ať to žije“."),
      ("chart", "Report, kterému rozumíte", "Dosah, engagement, růst a doporučení na další měsíc. Na jedné stránce."),
      ("clock", "Pravidelnost bez vaší námahy", "Plánujeme, publikujeme a hlídáme termíny. Vy řešíte byznys."),
      ("shield", "Účty zůstávají vaše", "Přístupy, obsah i data patří vám. Kdykoliv, i po skončení spolupráce."),
    ],
    included=["Audit profilů a konkurence", "Strategie, tón komunikace a content pilíře", "Měsíční obsahový kalendář ke schválení",
              "Copywriting a grafika příspěvků", "Reels / TikTok podle balíčku", "Publikace ve správný čas",
              "Komunitní management v pracovní dny", "Měsíční report + konzultace"],
    steps=[("Audit &amp; poznání", "Projdeme vaše sítě, konkurenci a cíle. Zjistíme, kde je jiskra a kde chybí.", "Týden 1"),
           ("Strategie &amp; plán", "Content pilíře, tón komunikace a první obsahový kalendář ke schválení.", "Týden 2"),
           ("Tvorba &amp; publikace", "Připravíme a naplánujeme obsah, odpovídáme komunitě. Vy jen schválíte.", "Každý měsíc"),
           ("Report &amp; ladění", "Vyhodnotíme čísla a řekneme na rovinu, co funguje a co změníme.", "Každý měsíc")],
    faqs=[
      ("Kolik stojí správa sociálních sítí?", "Balíčky začínají od 14 900 Kč měsíčně bez DPH (2 sítě, 12 příspěvků, 2 Reels, komunitní management a report). Přesná cena záleží na počtu sítí a množství obsahu. Podrobně to rozebíráme v článku <a href=\"/blog/kolik-stoji-sprava-socialnich-siti.html\">Kolik stojí správa sociálních sítí</a>."),
      ("Které sítě spravujete?", "Instagram, Facebook, TikTok a LinkedIn. Doporučíme, kde dává smysl být právě vám. A kde ne."),
      ("Kdo schvaluje obsah?", "Vy. Každý měsíc dostanete obsahový kalendář ke schválení a nic nevyjde bez vašeho souhlasu."),
      ("Jak rychle odpovídáte na komentáře a zprávy?", "V pracovní dny průběžně během dne. Víkendový režim si můžeme domluvit individuálně. [DOPLNIT: SLA]"),
      ("Musím se zavázat na dlouho?", "Ne. Spolupráce je měsíční s výpovědní lhůtou [DOPLNIT] dní. Při závazku na 6 měsíců máte slevu 10 %."),
    ],
    posts=["kolik-stoji-sprava-socialnich-siti", "jak-casto-postovat-na-instagram"],
  ),
  dict(
    slug="tvorba-obsahu", key="content", num="02", tile="tile--sky", art="/assets/img/mascot-phone.svg", art_w=264, art_h=427,
    visual="phones", fit="Postujete, ale obsah nikoho nezastaví.",
    name="Tvorba obsahu",
    seo_title="Tvorba obsahu pro sociální sítě: Reels i foto | Sparkee",
    desc="Tvorba obsahu pro sociální sítě: Reels a TikTok videa, produktové foto, grafika a copywriting. Obsah, který zastaví scroll. Pravidelně, ve vašem stylu.",
    h1='Tvorba obsahu, který zastaví <span class="holo-text">scroll.</span>',
    lead="Reels, TikToky, foto, grafika a texty. Natočíme, nafotíme a napíšeme obsah, který vypadá jako vy, jen o level lépe.",
    short="Foto, video, Reels, grafika a copy. Obsah, který zastaví scroll.",
    inc_copy="Předem domluvený počet videí, fotek a grafik za pevnou měsíční cenu. Dvě kola úprav jsou v ceně.",
    icon="video",
    price=9900, price_unit="/měs.", tags=["Reels", "TikTok", "Foto", "Grafika"],
    benefits=[
      ("video", "Krátká videa, která lidé dokoukají", "Reels a TikToky s háčkem v prvních vteřinách, titulky a trendovým střihem."),
      ("camera", "Produkční dny u vás", "Jeden natáčecí den měsíčně vydá na desítky výstupů. Šetříme váš čas."),
      ("pen", "Copy, které zní jako vy", "Texty, popisky a scénáře ve vašem tónu, ne jako z generátoru."),
      ("layers", "Jednotný vizuál", "Šablony a vizuální styl, díky kterým vás lidé poznají ještě před přečtením jména."),
      ("trend", "Trendy s rozumem", "Chytáme trendy, které sedí vaší značce. Na ty ostatní rádi zapomeneme."),
      ("heart", "Obsah vlastníte vy", "Všechny výstupy můžete použít na webu, v reklamě i v newsletteru."),
    ],
    included=["Kreativní koncept a scénáře", "Natáčecí / fotografický den [DOPLNIT: počet dle balíčku]", "Střih Reels a TikToků s titulky",
              "Produktové a lifestylové foto", "Grafika příspěvků a Stories", "Copywriting popisků", "Úpravy v ceně (2 kola)",
              "Předání zdrojových souborů"],
    steps=[("Brief &amp; koncept", "Zjistíme, co chcete říct a komu. Připravíme koncepty a scénáře.", "Týden 1"),
           ("Produkce", "Natočíme a nafotíme u vás nebo na lokaci. Vše v jednom dni.", "Týden 2"),
           ("Postprodukce", "Střih, titulky, grafika a copy. Posíláme ke schválení.", "Týden 3"),
           ("Publikace &amp; data", "Obsah publikujeme nebo předáme a vyhodnotíme, co fungovalo nejlépe.", "Každý měsíc")],
    faqs=[
      ("Kolik stojí tvorba obsahu?", "Samostatná tvorba obsahu začíná od 9 900 Kč měsíčně bez DPH [DOPLNIT]. Nejvýhodnější je jako součást balíčku správy sítí."),
      ("Musíme mít vlastní fotky a videa?", "Nemusíte. Obsah natočíme a nafotíme sami. Když máte vlastní materiály, rádi je využijeme."),
      ("Kde natáčíte?", "U vás na provozovně, v kanceláři nebo na lokaci. Většinou stačí jeden produkční den měsíčně."),
      ("Potřebujeme vystupovat na kameře?", "Není to nutné, ale obsah s lidmi funguje nejlépe. Pomůžeme vám se připravit, nebo zajistíme tvůrce."),
      ("Komu patří vytvořený obsah?", "Vám. Obsah můžete používat na sítích, webu i v reklamě. U hudby a licencí vás upozorníme na omezení."),
    ],
    posts=["jak-casto-postovat-na-instagram", "influencer-marketing-pro-male-firmy"],
  ),
  dict(
    slug="influencer-marketing", key="influenceri", num="03", tile="tile--lav", art="/assets/img/mascot-happy.svg", art_w=264, art_h=421,
    visual="faces", fit="Chcete, aby o vás mluvili lidé, kterým zákazníci věří.",
    name="Influencer marketing",
    seo_title="Influencer marketing pro firmy: výběr tvůrců | Sparkee",
    desc="Influencer marketing od výběru tvůrců po vyhodnocení. Najdeme nano a mikro influencery, kteří sedí vaší značce, připravíme brief a měříme výsledky.",
    h1='Influencer marketing s tvářemi, které <span class="holo-text">sedí.</span>',
    lead="Najdeme tvůrce, kterým vaše cílovka věří, a postaráme se o celou spolupráci od briefu po výsledky v číslech.",
    short="Najdeme tváře, které sedí vaší značce, a postaráme se o spolupráci od briefu po výsledky.",
    inc_copy="Naši práci na kampani znáte předem jako pevnou částku. Honoráře tvůrců vidíte zvlášť a schvalujete je vy.",
    icon="users",
    price=12900, price_unit="/kampaň", tags=["Nano", "Mikro", "UGC", "Ambasadoři"],
    benefits=[
      ("users", "Výběr podle publika, ne followerů", "Kontrolujeme engagement, publikum i kvalitu komentářů. Žádné nakoupené profily."),
      ("target", "Tvůrci pro vaši cílovku", "Lokální, oborové i lifestyle tváře, kterým vaši zákazníci opravdu věří."),
      ("pen", "Brief, který nechá prostor", "Jasné sdělení a pravidla, ale obsah ve stylu tvůrce. Proto funguje."),
      ("shield", "Smlouvy a označení reklamy", "Hlídáme práva k obsahu, termíny i správné označení spolupráce."),
      ("chart", "Měření každého tvůrce", "Slevové kódy, UTM a statistiky. Víte, kdo přinesl výsledek."),
      ("heart", "Dlouhodobí ambasadoři", "Z nejlepších spoluprací budujeme vztahy, které rostou s vaší značkou."),
    ],
    included=["Strategie kampaně a výběr formátů", "Research a shortlist tvůrců", "Oslovení a vyjednání podmínek",
              "Brief a schválení obsahu", "Smlouvy a práva k užití obsahu", "Koordinace termínů a publikace",
              "Tracking (kódy, UTM)", "Závěrečný report kampaně"],
    steps=[("Cíl &amp; strategie", "Ujasníme cíl, rozpočet a typ tvůrců. Navrhneme formáty.", "Týden 1"),
           ("Výběr tvůrců", "Shortlist s daty o publiku a engagementu. Vy vyberete finální tváře.", "Týden 1-2"),
           ("Realizace", "Brief, smlouvy, schválení obsahu a publikace podle plánu.", "Týden 2-4"),
           ("Vyhodnocení", "Report výsledků po tvůrcích a doporučení pro další vlnu.", "Po kampani")],
    faqs=[
      ("Kolik stojí influencer kampaň?", "Naše práce na kampani začíná od 12 900 Kč [DOPLNIT]. Honoráře tvůrců jsou samostatná položka. Pro první test se 3-5 mikro tvůrci počítejte orientačně s 20 000-50 000 Kč [DOPLNIT]."),
      ("Funguje influencer marketing i pro malou firmu?", "Ano, často velmi dobře. Nano a mikro tvůrci mají věrné publikum a jsou cenově dostupní. Více v článku <a href=\"/blog/influencer-marketing-pro-male-firmy.html\">Influencer marketing pro malé firmy</a>."),
      ("Jak poznáte falešné followery?", "Díváme se na vývoj sledujících, kvalitu komentářů, engagement rate a statistiky publika, které si od tvůrců vyžádáme."),
      ("Můžeme obsah od influencerů použít v reklamě?", "Ano, pokud si to dohodneme ve smlouvě. Práva k užití řešíme vždy předem."),
      ("Jak se spolupráce označuje?", "Placená spolupráce musí být jasně rozpoznatelná: funkcí Placené partnerství a označením typu #reklama. Hlídáme to za vás."),
    ],
    posts=["influencer-marketing-pro-male-firmy", "kolik-stoji-sprava-socialnich-siti"],
  ),
  dict(
    slug="paid-social", key="paid", num="04", tile="tile--pink", art="/assets/img/mascot-lie.svg", art_w=266, art_h=390,
    visual="bars", fit="Máte dobrý obsah, ale vidí ho málo lidí.",
    name="Paid social",
    seo_title="Paid social: podpora dosahu na sociálních sítích | Sparkee",
    desc="Paid social jako podpora dosahu: kampaně na Meta a TikTok, které dostanou dobrý obsah ke správným lidem. Bez agresivního prodeje a s jasným reportem.",
    h1='Paid social: dobrý obsah uvidí <span class="holo-text">víc lidí.</span>',
    lead="Reklama jako podpora dosahu vašich sítí. Váš nejlepší obsah dostaneme ke správným lidem, bez agresivních prodejních kampaní.",
    short="Podpora dosahu, aby dobrý obsah viděli správní lidé. Žádné agresivní prodejní kampaně.",
    inc_copy="Správu kampaní platíte měsíčním paušálem, rozpočet na reklamu přímo platformám. Víte přesně, kolik a za co.",
    icon="trend",
    price=6900, price_unit="/měs.", tags=["Meta", "Instagram", "TikTok", "Remarketing"],
    benefits=[
      ("eye", "Dosah na správné lidi", "Cílíme na publikum, které se podobá vašim zákazníkům, ne na kohokoliv."),
      ("spark", "Podpora nejlepšího obsahu", "Posilujeme příspěvky, které už organicky fungují. Menší riziko, lepší výsledky."),
      ("coins", "Rozpočet pod kontrolou", "Rozpočet platíte přímo platformám. Víte přesně, kolik a za co."),
      ("users", "Růst komunity", "Kampaně na nové sledující a interakce, které se propisují do organiky."),
      ("target", "Remarketing s citem", "Připomeneme se lidem, kteří o vás už vědí, bez otravného pronásledování."),
      ("chart", "Srozumitelný report", "Cena za dosah, sledujícího i proklik. A co s tím uděláme dál."),
    ],
    included=["Nastavení reklamního účtu a pixelu / CAPI [DOPLNIT dle tracking standardu]", "Strategie a struktura kampaní",
              "Cílení a tvorba publik", "Výběr a úpravy kreativ pro reklamu", "Průběžná optimalizace", "A/B testy kreativ",
              "Měsíční report", "Doporučení rozpočtu"],
    steps=[("Audit &amp; měření", "Zkontrolujeme účet, pixel a měření. Bez dat nejedeme naslepo.", "Týden 1"),
           ("Plán kampaní", "Cíle, publika, rozpočet a výběr obsahu, který podpoříme.", "Týden 1-2"),
           ("Spuštění &amp; ladění", "Kampaně běží, my průběžně optimalizujeme a testujeme kreativy.", "Průběžně"),
           ("Report", "Výsledky srozumitelně a doporučení na další měsíc.", "Každý měsíc")],
    faqs=[
      ("Kolik stojí paid social?", "Správa kampaní začíná od 6 900 Kč měsíčně bez DPH [DOPLNIT]. Rozpočet na reklamu platíte přímo platformám. Doporučujeme začít alespoň na [DOPLNIT] Kč měsíčně."),
      ("Je rozpočet na reklamu v ceně?", "Ne. Paušál pokrývá naši práci. Reklamní rozpočet platíte přímo Metě nebo TikToku, takže máte plnou kontrolu."),
      ("Proč „podpora dosahu“ a ne výkonnostní kampaně?", "Naší silou je obsah a komunita. Reklamu používáme k tomu, aby dobrý obsah viděli správní lidé. Pro čistě výkonnostní e-commerce kampaně vám doporučíme specialisty."),
      ("Na jakých platformách reklamy spravujete?", "Meta (Facebook, Instagram) a TikTok. LinkedIn po domluvě."),
      ("Kdy uvidím výsledky?", "První data máte do pár dnů. Kampaně se ale učí, stabilní výsledky obvykle přijdou po 2-4 týdnech ladění."),
    ],
    posts=["jak-casto-postovat-na-instagram", "kolik-stoji-sprava-socialnich-siti"],
  ),
]


# =====================================================================
# 6. DATA: ČLÁNKY – META (SEO + hero) a BODY (HTML obsah; <h2 id> tvoří obsah článku)
# =====================================================================
META_KOLIK = dict(
    slug="kolik-stoji-sprava-socialnich-siti",
    seo_title="Kolik stojí správa sociálních sítí? Ceny 2026 | Sparkee",
    desc="Kolik stojí správa sociálních sítí? Srovnání cen freelancera, agentury a interního člověka, co ovlivňuje cenu správy sociálních sítí a co paušál (ne)zahrnuje.",
    h1='Kolik stojí správa sociálních sítí v&nbsp;roce <span class="holo-text">2026?</span>',
    lead="Krátká odpověď: od pár tisíc po desítky tisíc korun měsíčně. Ukážeme, za co platíte a jak poznat férovou nabídku.",
    keywords=["kolik stojí správa sociálních sítí", "cena správy sociálních sítí", "správa sociálních sítí cena", "social media agentura cena"],
    date_modified="2026-09-24",
)

BODY_KOLIK = '''
<div class="callout">
  <img src="/assets/img/mascot-head.svg" alt="" width="52" height="61" loading="lazy">
  <div>
    <strong>Krátce a na rovinu</strong>
    Orientačně se cena správy sociálních sítí v Česku pohybuje zhruba od <b>5 000 Kč</b> (freelancer, 1 síť, málo obsahu) přes <b>15 000-40 000 Kč</b> (menší agentura, 2-3 sítě, vlastní foto a video) až po <b>60 000 Kč a více</b> měsíčně u velkých agentur. <em>[DOPLNIT: ověřit aktuální tržní rozpětí]</em> Rozpočet na reklamu je skoro vždy navíc.
  </div>
</div>

<h2 id="co-zahrnuje">Co všechno se skrývá pod „správou sociálních sítí“</h2>
<p>Největší zmatek v cenách vzniká tím, že každý pod stejným názvem nabízí něco jiného. Jeden „spravuje sítě“ tak, že dvakrát týdně nahraje fotku z fotobanky. Druhý vám dodá strategii, natočí Reels, odpovídá na komentáře a jednou měsíčně vysvětlí, co z čísel plyne. Než začnete porovnávat ceny, porovnávejte rozsah. Kompletní správa sociálních sítí obvykle zahrnuje:</p>
<ul>
  <li><strong>Strategii a content pilíře:</strong> o čem budete mluvit, komu a jakým tónem.</li>
  <li><strong>Obsahový kalendář:</strong> plán příspěvků na měsíc dopředu ke schválení.</li>
  <li><strong>Tvorbu obsahu:</strong> texty, grafika, fotky, krátká videa (Reels, TikTok).</li>
  <li><strong>Publikaci:</strong> plánování ve správný čas, hashtagy, označení, formáty.</li>
  <li><strong>Komunitní management:</strong> odpovědi na komentáře a zprávy, moderace.</li>
  <li><strong>Reporting:</strong> měsíční vyhodnocení a návrh, co dál.</li>
</ul>
<p>Čím víc z tohoto seznamu je v ceně, tím vyšší bude paušál. A tím méně práce zůstane na vás.</p>

<h2 id="srovnani">Freelancer vs. agentura vs. interní člověk: srovnání cen</h2>
<p>Tři nejčastější cesty, jak sítě „outsourcovat“ nebo řešit interně. Čísla níže jsou orientační rozpětí pro český trh a slouží k základní představě, ne jako ceník.</p>
<div class="table-wrap">
<table>
  <thead><tr><th>Varianta</th><th>Orientační cena / měsíc</th><th>Hodí se, když…</th><th>Pozor na</th></tr></thead>
  <tbody>
    <tr><td><strong>Freelancer</strong></td><td><b>5 000-20 000 Kč</b> [DOPLNIT]</td><td>máte 1-2 sítě a jasnou představu, co chcete</td><td>kapacitu, dovolené, šíři dovedností</td></tr>
    <tr><td><strong>Praktická agentura</strong></td><td><b>15 000-40 000 Kč</b> [DOPLNIT]</td><td>chcete systém, tým a pravidelný obsah bez starostí</td><td>co přesně je v paušálu</td></tr>
    <tr><td><strong>Velká agentura</strong></td><td><b>60 000 Kč +</b> [DOPLNIT]</td><td>řešíte velké kampaně, více trhů a značek</td><td>pomalé procesy, drahé hodiny navíc</td></tr>
    <tr><td><strong>Interní social media manažer</strong></td><td><b>45 000-70 000 Kč</b> superhrubá mzda [DOPLNIT]</td><td>sítě jsou klíčový kanál a máte na něj denní agendu</td><td>jeden člověk neumí vše (video, grafika, reklama)</td></tr>
  </tbody>
</table>
</div>
<p class="table-note">Ceny jsou bez DPH a bez rozpočtu na reklamu. [DOPLNIT: aktualizovat podle vlastního průzkumu trhu]</p>

<h3 id="freelancer">Freelancer</h3>
<p>Nejlevnější vstup a často skvělá volba pro začátek. Výhodou je přímá komunikace a flexibilita. Nevýhodou je, že jeden člověk málokdy umí stejně dobře strategii, copywriting, grafiku, video i reklamu. A když onemocní nebo odjede, vaše sítě stojí.</p>

<h3 id="agentura">Menší, praktická agentura</h3>
<p>Zlatá střední cesta. Dostanete tým (stratéga, kreativce, video, account managera), ale bez korporátních schvalovacích kolečků. Typicky funguje na měsíčním paušálu s jasně daným počtem výstupů. Přesně do této kategorie patří i Sparkee.</p>

<h3 id="velka-agentura">Velká agentura</h3>
<p>Dává smysl pro velké značky s komplexními kampaněmi. Pro malou a střední firmu bývá drahá a pomalá: platíte i za procesy, reporting pro reporting a hodiny account managementu.</p>

<h3 id="interni">Interní social media manažer</h3>
<p>Člověk, který firmu zná zevnitř a je k dispozici každý den. Počítejte ale s mzdovými náklady, nástroji, vzděláváním a tím, že na produkci videa nebo grafiky budete stejně často potřebovat externí pomoc.</p>

<h2 id="co-ovlivnuje-cenu">Co nejvíc ovlivňuje cenu správy sociálních sítí</h2>
<p>Když dostanete dvě nabídky, které se liší o polovinu, skoro vždy je rozdíl v jednom z těchto bodů:</p>
<ol>
  <li><strong>Počet sítí.</strong> Instagram a Facebook se dají částečně propojit, TikTok nebo LinkedIn ale potřebují vlastní obsah i tón.</li>
  <li><strong>Frekvence publikace.</strong> 8 příspěvků měsíčně je jiná práce než 20 příspěvků a denní Stories.</li>
  <li><strong>Typ obsahu.</strong> Video (Reels, TikTok) je náročnější než grafika. Vlastní focení je dražší než práce s dodanými podklady.</li>
  <li><strong>Produkce.</strong> Natáčecí dny, lokace, modelové, rekvizity. Jsou v paušálu, nebo se účtují zvlášť?</li>
  <li><strong>Komunitní management.</strong> Odpovídání jen v pracovní dny, nebo i o víkendu? Do kolika hodin?</li>
  <li><strong>Reklama.</strong> Správa kampaní je samostatná práce a rozpočet pro Metu nebo TikTok platíte navíc.</li>
  <li><strong>Schvalování.</strong> Čím víc lidí na vaší straně obsah schvaluje, tím víc času to stojí.</li>
</ol>

<div class="inline-cta">
  <div>
    <strong>Chcete vědět, kolik by to stálo u vás?</strong>
    <p>Za 20 minut projdeme vaše sítě a řekneme konkrétní rozsah i cenu. Nezávazně.</p>
  </div>
  <a href="/#kontakt" class="btn btn--holo">Nezávazná konzultace <span aria-hidden="true">→</span></a>
</div>

<h2 id="co-neni-v-cene">Co paušál obvykle nezahrnuje</h2>
<p>Tady se nejčastěji rodí nepříjemná překvapení. Před podpisem si nechte potvrdit, jak je to s těmito položkami:</p>
<ul>
  <li><strong>Rozpočet na reklamu:</strong> platíte ho přímo platformám (Meta, TikTok, LinkedIn).</li>
  <li><strong>Honoráře influencerů:</strong> agentura je vybere a řídí, ale odměna tvůrcům je samostatná položka.</li>
  <li><strong>Velké produkce:</strong> celodenní natáčení, dron, profesionální herci.</li>
  <li><strong>Licence:</strong> hudba pro reklamy, placené fotobanky, fonty.</li>
  <li><strong>Krizová komunikace:</strong> mimořádné situace mimo běžný režim.</li>
</ul>

<h2 id="cena-sparkee">Kolik stojí správa sociálních sítí u Sparkee</h2>
<p>Nemáme hodinovou sazbu, která by vás strašila na faktuře. Pracujeme s měsíčními balíčky, kde přesně víte, kolik výstupů dostanete:</p>
<ul>
  <li><strong>Spark</strong> (od 14 900 Kč/měs.): 2 sítě, 12 příspěvků, 2 Reels, komunitní management v pracovní dny, report. [DOPLNIT]</li>
  <li><strong>Glow</strong> (od 24 900 Kč/měs.): pro firmy, které chtějí pravidelné video a víc sítí. [DOPLNIT]</li>
  <li><strong>Blaze</strong> (od 39 900 Kč/měs.): 4+ sítě, 24 příspěvků, 10 Reels, 2 produkce měsíčně, influencer spolupráce. [DOPLNIT]</li>
</ul>
<p>Všechny ceny jsou bez DPH a bez reklamního rozpočtu. Při závazku na 6 měsíců máte slevu 10 %. Detailní srovnání najdete v <a href="/#cenik">ceníku</a>, popis služby na stránce <a href="/sluzby/sprava-socialnich-siti.html">správa sociálních sítí</a>.</p>

<h2 id="ferova-nabidka">Jak poznat férovou nabídku</h2>
<p>Cena sama o sobě nic neřekne. Dobrá nabídka na správu sociálních sítí by měla odpovědět na tyto otázky:</p>
<ul>
  <li>Kolik přesně příspěvků, videí a Stories měsíčně dostanu?</li>
  <li>Kdo obsah tvoří a kdo ho fotí a natáčí?</li>
  <li>Jak probíhá schvalování a kolik kol úprav je v ceně?</li>
  <li>Jak rychle se odpovídá na komentáře a zprávy?</li>
  <li>Jaké metriky budeme sledovat a jak vypadá report?</li>
  <li>Jaká je výpovědní lhůta a komu patří vytvořený obsah?</li>
</ul>

<div class="callout callout--warn">
  <img src="/assets/img/mascot-head.svg" alt="" width="52" height="61" loading="lazy">
  <div>
    <strong>Pozor na „levné“ nabídky</strong>
    Paušál za pár tisíc korun často znamená recyklované šablony, fotobanku a žádnou strategii. Ušetříte na faktuře, ale zaplatíte ztraceným časem a značkou, která na sítích vypadá jako všechny ostatní.
  </div>
</div>

<h2 id="chyby">Nejčastější chyby při výběru</h2>
<ol>
  <li><strong>Srovnávat jen cenu</strong>, a ne rozsah a kvalitu výstupů.</li>
  <li><strong>Chtít výsledky za měsíc.</strong> Stabilní růst přichází typicky za 3-6 měsíců pravidelné práce.</li>
  <li><strong>Nemít jasný cíl.</strong> Povědomí, komunita, poptávky? Každý cíl vyžaduje jiný přístup i jiné metriky.</li>
  <li><strong>Podcenit reklamu.</strong> Organický dosah je omezený. I malý rozpočet na podporu dosahu často udělá velký rozdíl.</li>
  <li><strong>Neřešit vlastnictví obsahu a přístupů.</strong> Účty i vytvořený obsah by měly vždy zůstat vaše.</li>
</ol>

<h2 id="zaver">Shrnutí</h2>
<p>Kolik stojí správa sociálních sítí, záleží hlavně na tom, kolik práce za vás má někdo převzít. Pro malou firmu, která chce pravidelný kvalitní obsah a měřitelný posun, obvykle dává největší smysl menší agentura s jasným paušálem: dostanete tým a systém bez ceny velké agentury. Nejdřív si ujasněte cíl a rozsah, pak porovnávejte nabídky. A pokud chcete konkrétní číslo pro vaši firmu, řekneme vám ho na <a href="/#kontakt">nezávazné konzultaci</a>.</p>
'''


META_JAK_CASTO = dict(
    slug="jak-casto-postovat-na-instagram",
    seo_title="Jak často postovat na Instagram v roce 2026 | Sparkee",
    desc="Jak často postovat na Instagram v roce 2026? Doporučená frekvence Reels, carouselů a Stories podle typu firmy, nejlepší čas a ukázkový týdenní plán.",
    h1='Jak často postovat na Instagram v&nbsp;roce <span class="holo-text">2026</span>',
    lead="Magické číslo neexistuje. Existuje ale rozumné rozpětí a systém, díky kterému ho udržíte dlouhodobě.",
    keywords=["jak často postovat na Instagram", "jak často postovat na Instagram 2026", "frekvence příspěvků Instagram", "kolikrát týdně postovat"],
    date_modified="2026-09-20",
)

BODY_JAK_CASTO = '''
<div class="callout">
  <img src="/assets/img/mascot-head.svg" alt="" width="52" height="61" loading="lazy">
  <div>
    <strong>Krátká odpověď</strong>
    Pro většinu firem funguje <b>3-5 příspěvků do feedu týdně</b> (z toho aspoň 2 Reels) a <b>Stories 4-7× týdně</b>. Důležitější než samotné číslo je, abyste ho zvládli držet měsíce, ne dva týdny.
  </div>
</div>

<h2 id="magicke-cislo">Proč neexistuje jedno magické číslo</h2>
<p>Instagram dnes nepracuje jen se sledujícími. Velkou část dosahu tvoří doporučení lidem, kteří vás ještě nesledují, hlavně přes Reels a Explore. Algoritmus proto víc než počet příspěvků zajímá, jak lidé na obsah reagují. Instagram veřejně zmiňuje jako důležité signály především <strong>dobu sledování</strong>, <strong>lajky v poměru k dosahu</strong> a <strong>sdílení do zpráv</strong>. [DOPLNIT: ověřit aktuální vyjádření Instagramu]</p>
<p>V praxi to znamená jednoduchou věc: tři dobré příspěvky týdně porazí sedm průměrných. Frekvence pomáhá (dává algoritmu víc šancí a lidem víc důvodů se vracet), ale jen dokud nejde na úkor kvality.</p>

<h2 id="frekvence-podle-formatu">Doporučená frekvence podle formátu</h2>
<p>Každý formát má na Instagramu jinou roli. Reels přivádějí nové lidi, carousely budují důvěru a ukládání, Stories drží vztah s komunitou.</p>
<div class="table-wrap">
<table>
  <thead><tr><th>Formát</th><th>Minimum</th><th>Ideál</th><th>K čemu slouží</th></tr></thead>
  <tbody>
    <tr><td><strong>Reels</strong></td><td>1× týdně</td><td><b>2-4× týdně</b></td><td>dosah na nové publikum</td></tr>
    <tr><td><strong>Carousel</strong></td><td>1× týdně</td><td><b>1-2× týdně</b></td><td>edukace, uložení, důvěra</td></tr>
    <tr><td><strong>Statický příspěvek</strong></td><td>podle potřeby</td><td><b>0-1× týdně</b></td><td>novinky, oznámení, estetika feedu</td></tr>
    <tr><td><strong>Stories</strong></td><td>3× týdně</td><td><b>denně</b> (3-7 snímků)</td><td>vztah, zákulisí, prodej</td></tr>
    <tr><td><strong>Live</strong></td><td>není nutné</td><td><b>1× měsíčně</b></td><td>komunita, Q&amp;A, launch</td></tr>
  </tbody>
</table>
</div>

<h3 id="reels">Reels</h3>
<p>Pokud chcete růst, bez krátkého videa to v roce 2026 nepůjde. Začněte klidně jedním Reelem týdně a postupně přidávejte. Nemusí jít o velkou produkci. Často lépe fungují autentická videa natočená na telefon s jasným háčkem v prvních dvou sekundách.</p>

<h3 id="carousely">Carousely</h3>
<p>Tipy, návody, srovnání, „5 chyb, které…“. Carousely lidé ukládají a posílají dál, což jsou pro algoritmus silné signály. Jeden kvalitní carousel týdně je pro většinu firem skvělý základ.</p>

<h3 id="stories">Stories</h3>
<p>Stories vidí hlavně vaši stávající sledující, takže slouží ke vztahu a konverzi. Ukazujte zákulisí, ankety, odpovědi na otázky, novinky. Pravidelnost je tu důležitější než dokonalost.</p>

<h2 id="podle-typu-firmy">Jak často postovat podle typu firmy</h2>
<ul>
  <li><strong>Lokální podnik</strong> (kavárna, salon, fitness): 3-4 příspěvky týdně, Stories denně. Síla je v každodenní atmosféře a lidech.</li>
  <li><strong>E-shop</strong>: 4-5 příspěvků týdně, hodně Reels s produktem v akci, Stories s novinkami a slevami.</li>
  <li><strong>B2B firma</strong>: 2-3 příspěvky týdně stačí. Víc carouselů a edukace, méně trendů. Zvažte i LinkedIn.</li>
  <li><strong>Osobní značka</strong>: 4-7 příspěvků týdně, Stories denně. Lidé sledují člověka, ne logo.</li>
</ul>

<div class="inline-cta">
  <div>
    <strong>Nemáte čas postovat pravidelně?</strong>
    <p>Připravíme obsahový kalendář, natočíme Reels a publikujeme za vás. Vy jen schválíte.</p>
  </div>
  <a href="/#kontakt" class="btn btn--holo">Nezávazná konzultace <span aria-hidden="true">→</span></a>
</div>

<h2 id="kdy-postovat">Kdy postovat: nejlepší čas</h2>
<p>Obecné tabulky „nejlepších časů“ berte s rezervou. Každé publikum je jiné. Místo toho otevřete <strong>Statistiky → Publikum</strong> v profesionálním účtu a podívejte se, kdy jsou vaši sledující nejaktivnější. Jako výchozí bod pro český trh můžete testovat:</p>
<ul>
  <li>všední dny <strong>7:00-9:00</strong> (cesta do práce),</li>
  <li><strong>12:00-13:00</strong> (oběd),</li>
  <li><strong>19:00-21:00</strong> (večer na gauči).</li>
</ul>
<p>[DOPLNIT: nahradit daty z vlastních klientských účtů] Pak čas dva až tři týdny testujte a vyhodnoťte. U Reels na přesném čase záleží méně. Mohou nabírat dosah i několik dní.</p>

<h2 id="system">Jak frekvenci udržet bez vyhoření</h2>
<p>Většina firem nezačíná špatně, jen po pár týdnech přestane stíhat. Pomůže jednoduchý systém:</p>
<ol>
  <li><strong>Content pilíře.</strong> Definujte 3-5 témat, o kterých mluvíte (např. tipy, zákulisí, produkt, zákazníci, tým).</li>
  <li><strong>Měsíční kalendář.</strong> Naplánujte obsah na celý měsíc dopředu. Rozhodování „co dnes dáme“ je největší žrout času.</li>
  <li><strong>Dávková tvorba.</strong> Jeden natáčecí den měsíčně vydá na 8-12 Reels.</li>
  <li><strong>Recyklace.</strong> Úspěšný carousel se dá převést na Reel, Reel na Stories, Stories na příspěvek.</li>
  <li><strong>Šablony.</strong> Jednotný vizuál šetří čas a zlepšuje rozpoznatelnost značky.</li>
</ol>

<h2 id="tydenni-plan">Ukázkový týdenní plán</h2>
<p>Příklad pro malou firmu, která chce růst, ale nemá celý tým na sítě:</p>
<div class="table-wrap">
<table>
  <thead><tr><th>Den</th><th>Feed</th><th>Stories</th></tr></thead>
  <tbody>
    <tr><td><strong>Pondělí</strong></td><td>Carousel: tip nebo návod</td><td>anketa k tématu týdne</td></tr>
    <tr><td><strong>Úterý</strong></td><td>bez příspěvku</td><td>zákulisí</td></tr>
    <tr><td><strong>Středa</strong></td><td>Reel: trend nebo „jak to děláme“</td><td>sdílení Reelu + otázka</td></tr>
    <tr><td><strong>Čtvrtek</strong></td><td>bez příspěvku</td><td>produkt / služba v akci</td></tr>
    <tr><td><strong>Pátek</strong></td><td>Reel: tým nebo zákazník</td><td>recenze, reakce</td></tr>
    <tr><td><strong>Víkend</strong></td><td>volitelně statický příspěvek</td><td>1-2 lehké Stories</td></tr>
  </tbody>
</table>
</div>

<h2 id="chyby">5 chyb, které frekvenci zbytečně zabijí</h2>
<ol>
  <li><strong>Start na plný plyn.</strong> První měsíc denně, druhý měsíc ticho. Algoritmus i sledující mají raději stabilní tempo.</li>
  <li><strong>Postování „aby něco bylo“.</strong> Slabý příspěvek nesnižuje jen svůj dosah. Učí lidi, že váš obsah nemusí sledovat.</li>
  <li><strong>Stejný obsah na všech sítích.</strong> Reel z Instagramu na TikToku funguje, ale popisky, hudba i tón by měly sedět platformě.</li>
  <li><strong>Ignorování komentářů.</strong> Konverzace pod příspěvkem je součástí obsahu. Odpovídejte hlavně v první hodině po publikaci.</li>
  <li><strong>Žádné vyhodnocení.</strong> Bez pravidelného pohledu do statistik nevíte, jestli máte přidat, ubrat, nebo změnit formát.</li>
</ol>

<h2 id="tiktok-facebook">Platí to i pro TikTok a Facebook?</h2>
<p>Částečně. <strong>TikTok</strong> snese vyšší frekvenci: aktivní účty často publikují 3-7 videí týdně a hodně záleží na rychlé reakci na trendy. <strong>Facebook</strong> je u většiny firem spíš doplňkový kanál: 2-4 příspěvky týdně, často sdílené z Instagramu, a víc prostoru pro komunitu ve skupinách a událostech. Pokud máte omezenou kapacitu, vyberte jednu hlavní síť, zvládněte ji dobře a teprve pak přidávejte další. [DOPLNIT: případně doplnit data z vlastních účtů]</p>

<h2 id="moc-nebo-malo">Jak poznat, že postujete moc, nebo málo</h2>
<ul>
  <li><strong>Moc:</strong> dosah na příspěvek dlouhodobě klesá, přibývá odhlášení, tým vyrábí obsah „aby něco bylo“.</li>
  <li><strong>Málo:</strong> profil působí neaktivně, noví sledující nepřibývají, lidé zapomínají, že existujete.</li>
  <li><strong>Akorát:</strong> dosah i interakce jsou stabilní nebo rostou a obsah zvládáte tvořit bez stresu.</li>
</ul>
<p>Sledujte čísla po měsících, ne po dnech. Jeden slabší příspěvek nic neznamená, trend za tři měsíce ano. Jak vypadá přehledný report, ukazujeme u služby <a href="/sluzby/sprava-socialnich-siti.html">Správa sociálních sítí</a>.</p>

<h2 id="zaver">Shrnutí</h2>
<p>Jak často postovat na Instagram v roce 2026? Začněte na 3 příspěvcích týdně (aspoň jeden Reel) a Stories většinu dní. Až to budete zvládat stabilně, přidávejte. Rozhoduje pravidelnost, kvalita a to, jestli obsah lidé sdílejí, ne počet čárek v kalendáři. A pokud na to nemáte kapacitu, <a href="/sluzby/tvorba-obsahu.html">obsah můžeme tvořit za vás</a>.</p>
'''


META_INFLUENCER = dict(
    slug="influencer-marketing-pro-male-firmy",
    seo_title="Influencer marketing pro malé firmy: jak začít | Sparkee",
    desc="Influencer marketing pro malé firmy krok za krokem: nano a mikro influenceři, kolik stojí spolupráce, jak je najít, jak napsat brief a jak měřit výsledky.",
    h1='Influencer marketing pro malé firmy bez velkého <span class="holo-text">rozpočtu</span>',
    lead="Nemusíte mít milionový rozpočet. Pro malou firmu funguje skvěle, pokud vsadíte na správné lidi, jasný brief a měření.",
    keywords=["influencer marketing pro malé firmy", "influencer marketing", "mikroinfluenceři", "spolupráce s influencery cena"],
    date_modified="2026-09-10",
)

BODY_INFLUENCER = '''
<div class="callout">
  <img src="/assets/img/mascot-head.svg" alt="" width="52" height="61" loading="lazy">
  <div>
    <strong>To hlavní v kostce</strong>
    Nemusíte platit celebritu. Malým firmám obvykle nejlépe fungují <b>nano a mikro influenceři</b> (zhruba 1 000-50 000 sledujících) s úzkou, věrnou komunitou. Začněte menším testem se 3-5 tvůrci, měřte a pak škálujte.
  </div>
</div>

<h2 id="proc">Proč influencer marketing dává smysl i pro malou firmu</h2>
<p>Lidé věří lidem víc než reklamám. Doporučení od někoho, koho sledují, působí jako rada od kamaráda, ne jako banner. Pro malou firmu to má tři velké výhody:</p>
<ul>
  <li><strong>Důvěra hned od začátku.</strong> Tvůrce vám „půjčí“ důvěru, kterou si u svého publika budoval roky.</li>
  <li><strong>Přesné cílení.</strong> Lokální foodblogerka nebo běžec z vašeho města osloví přesně ty, které potřebujete.</li>
  <li><strong>Obsah navíc.</strong> Fotky a videa od tvůrců můžete (s jejich souhlasem) použít na vlastních sítích i v reklamě.</li>
</ul>

<h2 id="koho-vybrat">Nano, mikro, makro: koho vybrat</h2>
<p>Velikost publika není všechno. Menší tvůrci mívají vyšší engagement a bližší vztah se sledujícími. A jsou dostupnější.</p>
<div class="table-wrap">
<table>
  <thead><tr><th>Typ</th><th>Sledující</th><th>Orientační cena za příspěvek</th><th>Hodí se pro</th></tr></thead>
  <tbody>
    <tr><td><strong>Nano</strong></td><td>1-10 tis.</td><td><b>barter až 3 000 Kč</b> [DOPLNIT]</td><td>lokální byznys, testování</td></tr>
    <tr><td><strong>Mikro</strong></td><td>10-50 tis.</td><td><b>3 000-15 000 Kč</b> [DOPLNIT]</td><td>většinu malých firem a e-shopů</td></tr>
    <tr><td><strong>Střední</strong></td><td>50-200 tis.</td><td><b>15 000-50 000 Kč</b> [DOPLNIT]</td><td>launch produktu, větší dosah</td></tr>
    <tr><td><strong>Makro</strong></td><td>200 tis. +</td><td><b>50 000 Kč +</b> [DOPLNIT]</td><td>brand awareness, velké kampaně</td></tr>
  </tbody>
</table>
</div>
<p class="table-note">Ceny se liší podle platformy, formátu (Reel vs. Stories), práv k užití obsahu a exkluzivity. [DOPLNIT: ověřit aktuální ceny na českém trhu]</p>

<h2 id="kolik-to-stoji">Kolik stojí spolupráce s influencerem</h2>
<p>Existují čtyři základní modely odměny. U malých firem se často kombinují:</p>
<ol>
  <li><strong>Barter:</strong> produkt nebo služba výměnou za obsah. Funguje hlavně u nano tvůrců a u produktů, které je opravdu baví.</li>
  <li><strong>Fixní honorář:</strong> jasná cena za dohodnuté výstupy (např. 1 Reel + 3 Stories).</li>
  <li><strong>Provize / affiliate:</strong> tvůrce dostává procento z prodejů přes svůj kód nebo odkaz.</li>
  <li><strong>Kombinace:</strong> nižší fix + provize. Motivuje obě strany k výsledku.</li>
</ol>
<p>Pro první test počítejte orientačně s rozpočtem <strong>20 000-50 000 Kč</strong> na 3-5 mikro tvůrců. [DOPLNIT] K tomu čas na výběr, komunikaci a vyhodnocení, nebo cenu agentury, která to udělá za vás.</p>

<h2 id="jak-najit">Jak najít správné influencery v 6 krocích</h2>
<ol>
  <li><strong>Definujte cíl.</strong> Povědomí o značce, prodeje, nové sledující, nebo obsah pro reklamy?</li>
  <li><strong>Popište ideálního zákazníka.</strong> Koho sleduje? Co řeší? Kde bydlí?</li>
  <li><strong>Hledejte tam, kde je vaše publikum.</strong> Hashtagy, lokace, komentáře u konkurence, profily, které sledují vaši zákazníci.</li>
  <li><strong>Udělejte si shortlist 15-20 tvůrců</strong> a projděte jejich posledních 20-30 příspěvků.</li>
  <li><strong>Oslovte je osobně.</strong> Krátce, konkrétně, s nabídkou, ne kopírovanou šablonou.</li>
  <li><strong>Začněte menším testem</strong> a s tvůrci, kteří fungují, budujte dlouhodobou spolupráci.</li>
</ol>

<h3 id="co-kontrolovat">Co kontrolovat na profilu</h3>
<ul>
  <li><strong>Engagement rate:</strong> poměr interakcí ke sledujícím. U mikro tvůrců bývá zdravé pásmo zhruba 2-6 %. [DOPLNIT]</li>
  <li><strong>Kvalita komentářů:</strong> skutečné reakce, nebo jen emoji a „nice pic“?</li>
  <li><strong>Publikum:</strong> je z Česka a Slovenska? Sedí věk a pohlaví? Požádejte o screenshot statistik.</li>
  <li><strong>Podezřelý růst:</strong> náhlé skoky ve sledujících mohou znamenat nakoupené followery.</li>
  <li><strong>Hodnoty a tón:</strong> sedí k vaší značce? Nespolupracuje zrovna s konkurencí?</li>
</ul>

<h2 id="brief">Brief, který funguje</h2>
<p>Dobrý brief dává tvůrci jasný rámec, ale nechává mu svobodu. Jeho publikum ho sleduje kvůli jeho stylu, ne kvůli vašemu scénáři. Do briefu patří:</p>
<ul>
  <li>kdo jste a co je cílem spolupráce (jednou větou),</li>
  <li>klíčové sdělení: maximálně 1-2 body, které musí zaznít,</li>
  <li>formáty, počet výstupů a termíny,</li>
  <li>co je zakázané (konkurence, citlivá témata, nepravdivá tvrzení),</li>
  <li>odkaz, slevový kód nebo UTM parametry,</li>
  <li>práva k užití obsahu: kde a jak dlouho ho smíte používat,</li>
  <li>způsob schválení a odměnu.</li>
</ul>

<div class="callout callout--warn">
  <img src="/assets/img/mascot-head.svg" alt="" width="52" height="61" loading="lazy">
  <div>
    <strong>Nezapomeňte na označení reklamy</strong>
    Placená spolupráce (i barter) musí být pro sledující jasně rozpoznatelná, např. přes funkci „Placené partnerství“ a srozumitelné označení typu #reklama nebo #spoluprace. Skrytá reklama poškodí důvěru i vás. [DOPLNIT: nechat ověřit aktuální pravidla a doporučení právníkem]
  </div>
</div>

<div class="inline-cta">
  <div>
    <strong>Chcete influencer kampaň bez starostí?</strong>
    <p>Najdeme tváře, které sedí vaší značce, a postaráme se o vše od briefu po výsledky.</p>
  </div>
  <a href="/#kontakt" class="btn btn--holo">Nezávazná konzultace <span aria-hidden="true">→</span></a>
</div>

<h2 id="mereni">Jak měřit výsledky</h2>
<p>Bez měření nevíte, koho do další vlny zařadit. Nastavte si metriky ještě před startem:</p>
<ul>
  <li><strong>Unikátní slevové kódy</strong> pro každého tvůrce: nejjednodušší měření prodejů.</li>
  <li><strong>UTM parametry</strong> v odkazech: uvidíte návštěvy a konverze v analytice.</li>
  <li><strong>Dosah a zobrazení:</strong> požádejte tvůrce o screenshoty statistik 7 dní po zveřejnění.</li>
  <li><strong>Uložení, sdílení a komentáře:</strong> ukazují skutečný zájem.</li>
  <li><strong>Noví sledující</strong> na vašem profilu v den a dny po publikaci.</li>
  <li><strong>Hodnota obsahu:</strong> kolik byste zaplatili za podobné foto a video v produkci?</li>
</ul>

<h2 id="priklad">Jak může vypadat první kampaň: příklad</h2>
<p>Představte si menší kavárnu v krajském městě, která chce víc lidí o víkendech a silnější komunitu na Instagramu. Rozumná první kampaň by mohla vypadat takto:</p>
<ul>
  <li><strong>Tvůrci:</strong> 4 lokální nano a mikro influenceři (food, lifestyle, rodiny) s publikem převážně z daného města.</li>
  <li><strong>Výstupy:</strong> od každého 1 Reel + 3 Stories během jednoho měsíce, s odstupem několika dní.</li>
  <li><strong>Odměna:</strong> kombinace barteru (brunch pro dva) a menšího honoráře u mikro tvůrců. Rozpočet orientačně [DOPLNIT] Kč.</li>
  <li><strong>Měření:</strong> unikátní kód na dezert zdarma pro každého tvůrce, noví sledující a dosah Stories.</li>
  <li><strong>Využití obsahu:</strong> nejlepší Reel po domluvě podpoříme reklamou na lidi v okolí kavárny.</li>
</ul>
<p>Po měsíci přesně víte, kdo přivedl nejvíc lidí, a s ním pokračujete dlouhodobě. Místo jednorázového „výstřelu“ tak postupně stavíte síť lokálních ambasadorů. [DOPLNIT: nahradit reálnou case study, až bude k dispozici]</p>

<h2 id="chyby">5 nejčastějších chyb</h2>
<ol>
  <li><strong>Vybírat podle počtu sledujících</strong>, ne podle publika a engagementu.</li>
  <li><strong>Příliš striktní scénář:</strong> obsah pak působí jako reklama a nefunguje.</li>
  <li><strong>Jednorázové akce.</strong> Opakovaná spolupráce se stejným tvůrcem buduje důvěru mnohem víc.</li>
  <li><strong>Žádné měření:</strong> bez kódů a UTM nevíte, co zafungovalo.</li>
  <li><strong>Nevyjasněná práva</strong> k obsahu a jeho využití v reklamách.</li>
</ol>

<h2 id="agentura">Kdy to svěřit agentuře</h2>
<p>Pokud chcete oslovit víc tvůrců najednou, nemáte čas na vyjednávání a vyhodnocování nebo chcete propojit influencery s vlastním obsahem a reklamou, dává smysl partner, který to dělá denně. Agentura má kontakty, zkušenosti s cenami a hlídá smlouvy, termíny i výsledky. Jak to děláme my, najdete na stránce <a href="/sluzby/influencer-marketing.html">influencer marketing</a>.</p>

<h2 id="zaver">Shrnutí</h2>
<p>Influencer marketing pro malé firmy funguje nejlépe v malém a pravidelně: pár správně vybraných mikro tvůrců, jasný brief, férová odměna a poctivé měření. Začněte testem, vyhodnoťte, co fungovalo, a z nejlepších tvůrců udělejte dlouhodobé ambasadory značky. <a href="/#kontakt">Rádi vám s prvním testem pomůžeme.</a></p>
'''


# slug → (META, BODY); pořadí = pořadí generování
ARTICLES = {m["slug"]: (m, b) for m, b in [
    (META_KOLIK, BODY_KOLIK),
    (META_JAK_CASTO, BODY_JAK_CASTO),
    (META_INFLUENCER, BODY_INFLUENCER),
]}

RT = {slug: reading_time(body) for slug, (_, body) in ARTICLES.items()}


# =====================================================================
# 7. STRÁNKY
# =====================================================================
def build_blog():
    path = "/blog/"
    title = "Blog: jiskry pro vaše sítě | Sparkee"
    desc = "Praktické tipy na sociální sítě od Sparkee: ceny správy sítí, jak často postovat na Instagram, influencer marketing pro malé firmy, reklama a reporting."
    crumbs = [("Domů", "/"), ("Blog", "/blog/")]
    blog_ld = {
        "@context": "https://schema.org", "@type": "Blog", "@id": SITE + "/blog/#blog",
        "name": "Sparkee blog: jiskry pro vaše sítě", "description": desc, "url": SITE + path, "inLanguage": "cs-CZ",
        "publisher": ORG_REF,
        "blogPost": [{"@type": "BlogPosting", "headline": p["title"], "url": f"{SITE}/blog/{p['slug']}.html",
                      "datePublished": p["date"]} for p in POSTS],
    }
    # Počty jen z publikovaných článků; kategorie bez článku se nezobrazí.
    counts = {k: sum(1 for p in POSTS if p["cat"] == k) for k, _ in CATS}
    counts["vse"] = len(POSTS)
    chips = "\n".join(
        f'<button type="button" class="cat-chip" data-filter="{k}" aria-pressed="{"true" if k == "vse" else "false"}">{n}<span class="sr-only">, počet článků: </span><small>{counts[k]}</small></button>'
        for k, n in CATS if counts[k])
    cards = [post_card(POSTS[0], feature=True, reading=RT[POSTS[0]["slug"]], hx="h2")]
    cards += [post_card(p, reading=RT[p["slug"]], hx="h2") for p in POSTS[1:]]
    body = f'''{head(title, desc, path, lds=[blog_ld, breadcrumb_ld(crumbs)])}
{header("blog")}
<main id="main" class="pg-blog">
<section class="page-hero">
  <div class="wrap">
    <div class="page-hero__band">
      {BG}
      <div class="page-hero__inner">
        <div>
          {crumbs_html(crumbs)}
          <h1><span class="holo-text">Jiskry</span> pro vaše sítě</h1>
          <p class="page-hero__lead">Praktické návody, čísla a zkušenosti z denní práce se sociálními sítěmi. Bez vaty, s tipy, které můžete použít ještě dnes.</p>
        </div>
        <div class="page-hero__art page-hero__art--float" aria-hidden="true">
          <img src="/assets/img/mascot-wave.svg" alt="" width="264" height="427">
        </div>
      </div>
    </div>
  </div>
</section>

<section class="section section--tight-top" aria-label="Články">
  <div class="wrap">
    <div class="cat-chips" role="group" aria-label="Filtrovat podle kategorie">
{chips}
    </div>
    <p class="sr-only" role="status" aria-live="polite" data-filter-status></p>
    <div class="posts">
{chr(10).join(cards)}
      <p class="posts__empty" hidden data-empty>V této kategorii zatím nic není, ale jiskra už se chystá.</p>
    </div>
{soon_list(SOON)}
{NEWSLETTER}
  </div>
</section>
</main>
{FOOTER}'''
    write("blog/index.html", body)


# Který servisní landing se ukazuje v „Čtěte dál“ pod článkem (index do SERVICES).
ARTICLE_SERVICE = {"kolik-stoji-sprava-socialnich-siti": 0, "jak-casto-postovat-na-instagram": 1,
                   "influencer-marketing-pro-male-firmy": 2}


def build_article(slug):
    M, raw_body = ARTICLES[slug]
    p = POST_BY[slug]
    path = f"/blog/{slug}.html"
    body_html = label_tables(raw_body)
    wc = words(body_html)
    rt = RT[slug]
    crumbs = [("Domů", "/"), ("Blog", "/blog/"), (p["title"], path)]
    toc = re.findall(r'<h2 id="([^"]+)">(.*?)</h2>', body_html)
    toc_html = "\n".join(f'<li><a href="#{i}">{t}</a></li>' for i, t in toc)
    post_ld = {
        "@context": "https://schema.org", "@type": "BlogPosting",
        "mainEntityOfPage": {"@type": "WebPage", "@id": SITE + path},
        "headline": p["title"], "description": M["desc"],
        "image": [og_for(path)[0]],
        "datePublished": p["date"] + "T08:00:00+02:00", "dateModified": M["date_modified"] + "T08:00:00+02:00",
        "author": {"@type": "Organization", "name": AUTHOR_NAME, "url": SITE + "/"},  # [DOPLNIT] Person, pokud bude konkrétní autor
        "publisher": ORG_REF, "inLanguage": "cs-CZ", "articleSection": p["cat_name"],
        "keywords": ", ".join(M["keywords"]), "wordCount": wc, "timeRequired": f"PT{rt}M",
        "isPartOf": {"@id": SITE + "/blog/#blog"},
    }
    article_meta = (f'<meta property="article:published_time" content="{p["date"]}T08:00:00+02:00">\n'
                    f'<meta property="article:modified_time" content="{M["date_modified"]}T08:00:00+02:00">\n'
                    f'<meta property="article:section" content="{p["cat_name"]}">\n')
    others = [POST_BY[s] for s in POST_BY if s != slug]
    related = [post_card(o, reading=RT[o["slug"]]) for o in others] + [service_card(SERVICES[ARTICLE_SERVICE[slug]])]
    upd = f', aktualizováno <time datetime="{M["date_modified"]}">{cz_date(M["date_modified"])}</time>' if M["date_modified"] != p["date"] else ""
    out = f'''{head(M["seo_title"], M["desc"], path, og_type="article", lds=[post_ld, breadcrumb_ld(crumbs)], article_meta=article_meta)}
{header("blog", progress=True)}
<main id="main" class="pg-article">
<header class="art-hero">
  <div class="wrap">
    <div class="art-hero__head">
      {crumbs_html(crumbs)}
      <a class="art-hero__cat" href="/blog/?kategorie={p["cat"]}">{p["cat_name"]}</a>
      <h1>{M["h1"]}</h1>
      <p class="art-hero__lead">{M["lead"]}</p>
      <div class="post-meta"><span>{AUTHOR_NAME}</span><span class="post-meta__date"><time datetime="{p["date"]}">{cz_date(p["date"])}</time>{upd}</span><span>{rt} min čtení</span></div>
    </div>
    <div class="art-hero__cover {p["th"]}" aria-hidden="true">
      <span class="post-card__glyph">{p["glyph"]}</span>
      <img src="/assets/img/mascot-peek.svg" alt="" width="264" height="314">
    </div>
  </div>
</header>

<div class="wrap art-layout">
  <details class="toc" open>
    <summary>Obsah článku <span class="toc__count">{len(toc)}</span></summary>
    <nav data-toc aria-label="Obsah článku">
      <ol>
{toc_html}
      </ol>
    </nav>
  </details>

  <article class="prose" data-article>
{body_html}
    <div class="art-share">
      <span>Sdílet:</span>
      <a href="https://www.linkedin.com/sharing/share-offsite/?url={SITE}{path}" target="_blank" rel="noopener">LinkedIn</a>
      <a href="https://www.facebook.com/sharer/sharer.php?u={SITE}{path}" target="_blank" rel="noopener">Facebook</a>
      <button type="button" data-copy-link>Kopírovat odkaz</button>
    </div>

{fill(AUTHOR_BOX, author_name=AUTHOR_NAME)}
  </article>
</div>

<section class="related" aria-labelledby="rel-title">
  <div class="wrap">
    <header class="sec-head sec-head--row reveal">
      <h2 id="rel-title">Další jiskry z blogu</h2>
      <a href="/blog/" class="btn btn--ghost btn--sm">Všechny články →</a>
    </header>
    <div class="posts">
{chr(10).join(related)}
    </div>
{NEWSLETTER}
  </div>
</section>
<div class="page-end" aria-hidden="true"></div>
</main>
{FOOTER}'''
    write(f"blog/{slug}.html", out, note=f"  ({wc} slov, {rt} min čtení)")


TILES = ["tile--mint", "tile--sky", "tile--lav", "tile--pink", "tile--mint", "tile--sky"]


def build_service(s, idx):
    path = f"/sluzby/{s['slug']}.html"
    crumbs = [("Domů", "/"), ("Služby", "/sluzby/"), (s["name"], path)]
    price_txt = fmt_price(s["price"])
    svc_ld = {
        "@context": "https://schema.org", "@type": "Service", "@id": SITE + path + "#service",
        "name": s["name"], "serviceType": s["name"], "description": s["desc"], "url": SITE + path,
        "provider": ORG_REF, "areaServed": {"@type": "Country", "name": "Česko"}, "inLanguage": "cs-CZ",
        "offers": {"@type": "Offer", "url": SITE + "/#cenik", "priceCurrency": "CZK",
                   "priceSpecification": {"@type": "UnitPriceSpecification", "minPrice": s["price"], "priceCurrency": "CZK",
                                          "valueAddedTaxIncluded": False}},  # [DOPLNIT] cena
    }
    # Asymetrické bento (pages.css .pg-service .benefits): 1. dlaždice je velká a nese ilustraci služby.
    bens = "\n".join(f'''<article class="tile {TILES[i]} reveal">
  {icon(ic)}
  <h3>{t}</h3>
  <p>{d}</p>{VISUALS[s["visual"]] if i == 0 else ""}
</article>''' for i, (ic, t, d) in enumerate(s["benefits"]))
    steps = "\n".join(f'''<li class="step reveal">
  <span class="step__n">{i + 1}</span>
  <h3>{t}</h3>
  <p>{d}</p>
  <small>{w}</small>
</li>''' for i, (t, d, w) in enumerate(s["steps"]))
    inc = "\n".join(f"<li>{x}</li>" for x in s["included"])
    faqs = "\n".join(f'''<details class="reveal"{" open" if i == 0 else ""}>
  <summary>{q}</summary>
  <p>{a}</p>
</details>''' for i, (q, a) in enumerate(s["faqs"]))
    posts = "\n".join(post_card(POST_BY[x], reading=RT[x]) for x in s["posts"])
    posts += "\n" + service_card([o for o in SERVICES if o is not s][idx % 3])
    contact = f"/?sluzba={s['key']}#kontakt"   # homepage formulář předvybere čip služby
    out = f'''{head(s["seo_title"], s["desc"], path, lds=[svc_ld, breadcrumb_ld(crumbs), faq_ld(s["faqs"])])}
{header("sluzby")}
<main id="main" class="pg-service">
<section class="page-hero">
  <div class="wrap">
    <div class="page-hero__band">
      {BG}
      <div class="page-hero__inner">
        <div>
          {crumbs_html(crumbs)}
          <h1>{s["h1"]}</h1>
          <p class="page-hero__lead">{s["lead"]}</p>
          <div class="page-hero__ctas">
            <a href="{contact}" class="btn btn--holo">Nezávazná konzultace <span aria-hidden="true">→</span></a>
            <a href="#co-je-v-cene" class="btn btn--ghost">Co je v ceně</a>
          </div>
        </div>
        <div class="page-hero__art page-hero__art--float" aria-hidden="true">
          <span class="sticker page-hero__sticker">{s["tags"][0]} ✦</span>
          <img src="{s["art"]}" alt="" width="{s["art_w"]}" height="{s["art_h"]}">
        </div>
      </div>
    </div>
  </div>
</section>

<section class="section" aria-labelledby="benefits-title">
  <div class="wrap">
    <header class="sec-head reveal">
      <h2 id="benefits-title">{s["name"]} se Sparkee</h2>
    </header>
    <div class="benefits">
{bens}
    </div>
  </div>
</section>

<section class="section process" aria-labelledby="process-title">
  <div class="wrap">
    <header class="sec-head reveal">
      <span class="eyebrow">Jak to probíhá</span>
      <h2 id="process-title">Jasný postup. Žádný chaos.</h2>
    </header>
    <ol class="steps">
{steps}
    </ol>
  </div>
</section>

<section class="section" id="co-je-v-cene" aria-labelledby="inc-title">
  <div class="wrap included">
    <div class="included__copy reveal">
      <h2 id="inc-title">Všechno podstatné.<br>Bez hodin navíc.</h2>
      <p>{s["inc_copy"]}</p>
    </div>
    <div class="included__box reveal">
      <h3>{s["name"]}</h3>
      <p class="plan__price">od <strong>{price_txt}</strong> Kč<span>{s["price_unit"]}</span></p>
      <ul class="ticks">
{inc}
      </ul>
      <a href="/#cenik" class="btn btn--holo btn--block">Ceník balíčků</a>
    </div>
  </div>
</section>

<section class="section section--flush-top faq" aria-labelledby="faq-title">
  <div class="wrap faq__inner">
    <header class="sec-head reveal">
      <h2 id="faq-title">Časté otázky</h2>
      <p>Nenašli jste odpověď? <a href="{contact}">Zeptejte se na nezávazné konzultaci.</a></p>
    </header>
    <div class="faq__list">
{faqs}
    </div>
  </div>
</section>

<section class="section section--flush-top" aria-labelledby="blog-title">
  <div class="wrap">
    <header class="sec-head sec-head--row reveal">
      <h2 id="blog-title">Než se ozvete, přečtěte si</h2>
      <a href="/blog/" class="btn btn--ghost btn--sm">Všechny články →</a>
    </header>
    <div class="posts">
{posts}
    </div>
  </div>
</section>
{cta(contact)}
</main>
{FOOTER}'''
    write(f"sluzby/{s['slug']}.html", out)


def build_services_index():
    path = "/sluzby/"
    title = "Služby: správa sítí, obsah, influenceři, paid social | Sparkee"
    desc = "Služby Sparkee: správa sociálních sítí, tvorba obsahu, influencer marketing a paid social. Měsíční paušály pro firmy, jasný systém a měřitelný posun."
    crumbs = [("Domů", "/"), ("Služby", "/sluzby/")]
    list_ld = {
        "@context": "https://schema.org", "@type": "ItemList", "name": "Služby Sparkee",
        "itemListElement": [{"@type": "ListItem", "position": i + 1, "url": f"{SITE}/sluzby/{s['slug']}.html",
                             "item": {"@type": "Service", "name": s["name"], "description": s["desc"], "provider": {"@id": ORG_ID},
                                      "url": f"{SITE}/sluzby/{s['slug']}.html"}} for i, s in enumerate(SERVICES)],
    }
    cards = "\n".join(f'''<a class="tile {s["tile"]} svc-card reveal" href="/sluzby/{s["slug"]}.html">
  <div class="svc-card__copy">
    <h2>{s["name"]}</h2>
    <p>{s["short"]}</p>
    <span class="svc-card__price">od {fmt_price(s["price"])} Kč{s["price_unit"]} <small>bez DPH</small></span>
    <span class="tile__go">Detail služby <i aria-hidden="true">→</i></span>
  </div>
  <div class="svc-card__art">{VISUALS[s["visual"]]}</div>
</a>''' for s in SERVICES)
    fit = "\n".join(f'''      <li class="reveal"><p>{s["fit"]}</p><a href="/sluzby/{s["slug"]}.html">{s["name"]} <span aria-hidden="true">→</span></a></li>'''
                    for s in SERVICES)
    steps_html = "\n".join(f'''<li class="step reveal">
  <span class="step__n">{i + 1}</span>
  <h3>{t}</h3>
  <p>{d}</p>
  <small>{w}</small>
</li>''' for i, (t, d, w) in enumerate(SERVICES[0]["steps"]))
    out = f'''{head(title, desc, path, lds=[list_ld, breadcrumb_ld(crumbs)])}
{header("sluzby")}
<main id="main" class="pg-services">
<section class="page-hero">
  <div class="wrap">
    <div class="page-hero__band">
      {BG}
      <div class="page-hero__inner">
        <div>
          {crumbs_html(crumbs)}
          <h1>Čtyři služby, jeden <span class="holo-text">paušál.</span></h1>
          <p class="page-hero__lead">Balíčky skládáme ze čtyř pilířů. Vy řešíte byznys, my se postaráme, aby o něm lidé věděli.</p>
          <div class="page-hero__ctas">
            <a href="/#kontakt" class="btn btn--holo">Nezávazná konzultace <span aria-hidden="true">→</span></a>
            <a href="/#cenik" class="btn btn--ghost">Ceník balíčků</a>
          </div>
        </div>
        <div class="page-hero__art page-hero__art--float" aria-hidden="true">
          <span class="sticker page-hero__sticker">4 pilíře ✦</span>
          <img src="/assets/img/mascot-happy.svg" alt="" width="264" height="421">
        </div>
      </div>
    </div>
  </div>
</section>

<section class="section" aria-label="Přehled služeb">
  <div class="wrap">
    <div class="svc-cards">
{cards}
    </div>
  </div>
</section>

<section class="section section--flush-top fit" aria-labelledby="fit-title">
  <div class="wrap fit__inner">
    <h2 id="fit-title" class="reveal">Kterou službu potřebujete?</h2>
    <ul class="fit__list">
{fit}
    </ul>
  </div>
</section>

<section class="section process" aria-labelledby="process-title">
  <div class="wrap">
    <header class="sec-head reveal">
      <h2 id="process-title">Od auditu po první výsledky.</h2>
    </header>
    <ol class="steps">
{steps_html}
    </ol>
  </div>
</section>
{cta()}
</main>
{FOOTER}'''
    write("sluzby/index.html", out)


def build_404():
    out = f'''{head("Stránka nenalezena (404) | Sparkee", "Tahle stránka ztratila jiskru. Zkuste to přes úvodní stránku nebo blog Sparkee.", "/404.html", robots="noindex, follow", canonical=False)}
{header()}
<main id="main" class="pg-404">
<section class="nf">
  <div class="hero__bg" aria-hidden="true">
    <span class="blob blob--mint"></span><span class="blob blob--lav"></span><span class="blob blob--pink"></span>
    {SPARK.format(c="s1")}{SPARK.format(c="s2")}{SPARK.format(c="s3")}
  </div>
  <div class="wrap nf__inner">
    <button type="button" class="nf__art" data-relight aria-label="Vrátit maskotovi jiskru">
      <img src="/assets/img/mascot-surprised.svg" alt="" width="264" height="421">
    </button>
    <div class="nf__copy">
      <p class="nf__code" aria-hidden="true">4<span>0</span>4</p>
      <h1>Tahle stránka ztratila <span class="holo-text">jiskru.</span></h1>
      <p>Hledali jsme všude: v kalendáři, ve Stories i pod komentáři. Stránka, kterou hledáte, neexistuje nebo se přestěhovala.</p>
      <div class="nf__ctas">
        <a href="/" class="btn btn--holo">Zpět na úvod <span aria-hidden="true">→</span></a>
        <a href="/blog/" class="btn btn--ghost">Na blog</a>
      </div>
      <p class="nf__hint">Tip: zkuste maskota probudit a vraťte mu jiskru.</p>
    </div>
  </div>
</section>
</main>
{FOOTER}'''
    write("404.html", out)


def sync_home_og():
    """index.html je ruční: srovná jen URL a alt OG obrázku homepage s kartou "/" (zapisuje jen při změně)."""
    p = ROOT / "index.html"
    s = p.read_text(encoding="utf-8")
    url, alt = og_for("/")
    alt = esc(alt)
    out = re.sub(r'https?://[^"\s]*/assets/img/og/home\.(?:png|jpg)(?:\?v=[0-9a-f]+)?', url, s)
    out = re.sub(r'(<meta property="og:image:type" content=")[^"]*(")', r'\g<1>image/jpeg\g<2>', out)
    out = re.sub(r'(<meta (?:property="og:image:alt"|name="twitter:image:alt") content=")[^"]*(")', lambda m: m.group(1) + alt + m.group(2), out)
    for need in (f'property="og:image" content="{url}"', f'name="twitter:image" content="{url}"', f'property="og:image:alt" content="{alt}"'):
        if need not in out:
            print(f"  ! index.html: chybí {need}")
    if out != s:
        p.write_text(out, encoding="utf-8")
        print(f"  index.html  (OG homepage → {url.rsplit('/', 1)[-1]})")


def build_sitemap_and_robots():
    urls = [("/", SITEMAP_LASTMOD, "weekly", "1.0"), ("/sluzby/", SITEMAP_LASTMOD, "monthly", "0.9")]
    urls += [(f"/sluzby/{s['slug']}.html", SITEMAP_LASTMOD, "monthly", "0.9") for s in SERVICES]
    urls += [("/blog/", SITEMAP_LASTMOD, "weekly", "0.8")]
    urls += [(f"/blog/{p['slug']}.html", ARTICLES[p["slug"]][0]["date_modified"], "monthly", "0.7") for p in POSTS]
    x = ['<?xml version="1.0" encoding="UTF-8"?>',
         '<!-- [DOPLNIT] doména: URL počítají se https://sparkee.cz -->',
         '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u, lm, cf, pr in urls:
        x.append(f"  <url><loc>{SITE}{u}</loc><lastmod>{lm}</lastmod><changefreq>{cf}</changefreq><priority>{pr}</priority></url>")
    x.append("</urlset>\n")
    write("sitemap.xml", "\n".join(x))
    write("robots.txt", f"""# Sparkee: robots.txt
User-agent: *
Allow: /
Disallow: /tools/
Disallow: /remotion/
Disallow: /assets/figma/

# [DOPLNIT] doména
Sitemap: {SITE}/sitemap.xml
""")


# =====================================================================
# 8. MAIN
# =====================================================================
def main():
    print(f"Sparkee build → {ROOT}")
    build_blog()
    for slug in ARTICLES:
        build_article(slug)
    for i, s in enumerate(SERVICES):
        build_service(s, i)
    build_services_index()
    build_404()
    build_sitemap_and_robots()
    sync_home_og()
    print(f"Hotovo: {len(WRITTEN)} souborů.")


if __name__ == "__main__":
    main()
