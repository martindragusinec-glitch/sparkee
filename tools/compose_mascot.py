"""Sparkee maskot – pózy 1:1 z vektorového loga ve Figmě (node 45:201 / 124:3).

Postavička se NEOTÁČÍ ani nepřekresluje: hlava, plamínek i tělo jsou originální vektory z loga.
Obrys = tah (stroke) všech výplní, stejně jako v logu. Pózy mění jen obličej / doplňky.

Výstupy assets/img/poses/*.svg + assets/img/mascot*.svg, hero vloží do index.html
(<!-- MASCOT:START --> … <!-- MASCOT:END -->).
Spuštění: python3 tools/compose_mascot.py
"""
import re, pathlib
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parent.parent
NS = "http://www.w3.org/2000/svg"
ET.register_namespace("", NS)
src = ET.parse(ROOT / "assets/figma/logo-full.svg").getroot()
byid = {e.get("id"): e for e in src.iter() if e.get("id")}
raw = lambda e: re.sub(r' xmlns="[^"]+"', "", ET.tostring(e, encoding="unicode"))
s = lambda e: re.sub(r' id="[^"]*"', "", raw(e))
paths = lambda e: [p.get("d") for p in e.iter() if p.tag.endswith("path")]

INK = "#2C303C"
DEFS_INNER = "".join(raw(c) for c in next(src.iter(f"{{{NS}}}defs")) if not c.tag.endswith("clipPath"))

# Tvar hlavy v logu má 13 pod-cest: 1. = vnější obrys, zbytek = otvory pod očima/pusou/tvářemi/odlesky.
# Otvory by při pohybu/změně obličeje prosvítaly (i s obrysem) -> necháváme jen vnější obrys.
outer = lambda d: re.split(r"(?<=[Zz])\s*(?=[Mm])", d.strip())[0]
HEAD_D = outer(paths(byid["Head base"])[0])
for _p in byid["Head base"].iter():
    if _p.tag.endswith("path"):
        _p.set("d", outer(_p.get("d")))
BODY = byid["Group_10"]
BODY_DS = paths(BODY)
FLAME_DS = paths(byid["Vector_4"])  # obrys plamínku
FLAME = s(byid["Group_4"])

EYE_L, EYE_R = (455, 278.5), (528.75, 246.25)
MOUTH_C = (498, 281)
TILT = -24  # sklon obličeje v logu


def stroke(ds, w, col=INK):
    return "".join(f'<path d="{d}" fill="none" stroke="{col}" stroke-width="{w}" '
                   f'stroke-linejoin="round" stroke-linecap="round"/>' for d in ds)


def sparkle(x, y, r, fill="url(#sp-holo)", rot=0):
    k = r * 0.28
    return (f'<path class="m-sparkle" transform="translate({x} {y}) rotate({rot})" '
            f'd="M0 {-r}C{k} {-k} {k} {-k} {r} 0C{k} {k} {k} {k} 0 {r}C{-k} {k} {-k} {k} {-r} 0C{-k} {-k} {-k} {-k} 0 {-r}Z" fill="{fill}"/>')


EXTRA_DEFS = """
<linearGradient id="m-screen-grad" x1="-19" y1="-35" x2="19" y2="35" gradientUnits="userSpaceOnUse">
  <stop stop-color="#A5EDC5"/><stop offset=".35" stop-color="#9AD8F8"/><stop offset=".7" stop-color="#C49CF2"/><stop offset="1" stop-color="#F5B8DC"/>
</linearGradient>
<linearGradient id="sp-holo" x1="-20" y1="-20" x2="20" y2="20" gradientUnits="userSpaceOnUse">
  <stop stop-color="#A5EDC5"/><stop offset=".5" stop-color="#9AD8F8"/><stop offset="1" stop-color="#C49CF2"/>
</linearGradient>"""


# ---------- obličeje ----------
def eyes_normal():
    return (f'<g class="m-eyes"><g class="m-eye m-eye-l">{s(byid["Group_14"])}</g>'
            f'<g class="m-eye m-eye-r">{s(byid["Group_13"])}</g></g>')


def eyes_happy():  # ^^
    out = ""
    for (cx, cy), r in ((EYE_L, 14), (EYE_R, 15)):
        out += (f'<path d="M{cx - r} {cy + 5}Q{cx} {cy - r} {cx + r} {cy + 5}" transform="rotate({TILT} {cx} {cy})" '
                f'fill="none" stroke="{INK}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>')
    return f'<g class="m-eyes m-eyes--happy">{out}</g>'


def eyes_surprised():  # kulaté bílé oči
    out = ""
    for (cx, cy), r in ((EYE_L, 13), (EYE_R, 14)):
        out += (f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="#fff" stroke="{INK}" stroke-width="5.5"/>'
                f'<circle cx="{cx + 1}" cy="{cy + 1}" r="4" fill="{INK}"/>')
    return f'<g class="m-eyes m-eyes--surprised">{out}</g>'


def mouth(kind):
    cx, cy = MOUTH_C
    if kind == "o":
        return (f'<g class="m-mouth" transform="rotate({TILT} {cx} {cy})"><ellipse cx="{cx}" cy="{cy}" rx="7.5" ry="10" fill="{INK}"/>'
                f'<ellipse cx="{cx}" cy="{cy + 4}" rx="4.5" ry="3.5" fill="#F09BA5"/></g>')
    m = s(byid["Group_12"])
    if kind == "big":
        return f'<g class="m-mouth" transform="translate({cx} {cy}) scale(1.3) translate({-cx} {-cy})">{m}</g>'
    return f'<g class="m-mouth">{m}</g>'


FACES = {
    "normal": lambda: eyes_normal() + mouth("smile"),
    "happy": lambda: eyes_happy() + mouth("big"),
    "surprised": lambda: eyes_surprised() + mouth("o"),
}


def cheek(e):  # tvářička (class = háček pro JS rig)
    return s(e).replace("<path ", '<path class="m-cheek" ', 1)


def head(face="normal", sticker=False, alt_happy=False):
    fl = stroke(FLAME_DS, 30, "#fff") if sticker else ""
    # hero: skryté ^^ oči pro stav „nadšení“ (CSS je přepne) – atribut opacity=0 = neviditelné i bez CSS
    alt = eyes_happy().replace('class="m-eyes m-eyes--happy"', 'class="m-eyes-happy" opacity="0"') if alt_happy else ""
    return f'''<g class="m-head">
    <g class="m-flame">{fl}{FLAME}</g>
    <use href="#m-head-shape" fill="none" stroke="{INK}" stroke-width="12" stroke-linejoin="round"/>
    {"".join(s(p) for p in byid["Head base"])}
    {s(byid["Vector_17"])}{s(byid["Vector_18"])}
    <g class="m-face">{cheek(byid["Vector_15"])}{cheek(byid["Vector_16"])}{FACES[face]()}{alt}</g>
  </g>'''


def body_logo():
    return f'<g class="m-body">{stroke(BODY_DS, 12)}{s(BODY)}</g>'


# Postavička v logu leží na textu -> hlava je nakloněná. Když STOJÍ, hlavu narovnáme (hlava rovně)
# a použijeme stojící tělo z původního konceptu (tools/body_stand.py – díly s klouby, ruce jdou natáčet).
import sys
sys.path.insert(0, str(ROOT / "tools"))
import body_stand as B
import rig as R

STAND = 24            # o kolik stupňů narovnat hlavu (sklon očí v logu je ~ -23.7°)
PIVOT = (490, 300)
SHADOW = f'<ellipse class="m-shadow" cx="504" cy="452" rx="58" ry="8" fill="{INK}" opacity=".12"/>'


def upright(inner, deg=STAND, cls=""):
    """Narovná hlavu; plamínek zůstane svisle (protirotace kolem jeho středu).
    cls = třída obalové skupiny (m-head-rig = háček pro JS rig: hlava se natáčí v souřadnicích obrazovky)."""
    inner = re.sub(r'<g class="m-flame">(.*?)' + re.escape(FLAME) + '</g>',
                   lambda m: f'<g class="m-flame"><g transform="rotate({-deg} 425 97)">{m.group(1)}{FLAME}</g></g>', inner, count=1, flags=re.S)
    c = f' class="{cls}"' if cls else ""
    return f'<g{c} transform="rotate({deg} {PIVOT[0]} {PIVOT[1]})">{inner}</g>'


def fig(face="normal", arms=("rest", "rest"), sticker=False, alt_happy=False, hold_r="", hero=False):
    """Stojící maskot z kostry (tools/rig.py) + rovná hlava z loga.
    arms = (levá, pravá) z: rest, down, out, wave, cheer, hold.
    hero = hero verze pro JS rig (assets/js/mascot.js): ruce se přepočítávají za běhu, proto už bez skryté
    mávající ruky (.m-arm-l-up)."""
    white = upright(stroke([HEAD_D], 40, "#fff")) if sticker else ""
    return (white + R.body(arms, white=40 if sticker else 0, hold_r=hold_r, hero_wave_l=False)
            + upright(head(face, sticker, alt_happy), cls="m-head-rig"))


PHONE_AT, PHONE_TILT = (603, 331), 10          # telefon v pravé tlapce (ruka „hold“)
THUMB_AT = (584, 331)


def phone_hold():
    """Telefon v pravé tlapce + palec přes okraj (kreslí se do skupiny ruky, hýbe se s ní)."""
    ux, uy = PHONE_AT
    tx, ty = THUMB_AT
    rot = PHONE_TILT
    # .m-hand = telefon + palec (JS rig ji drží v tlapce), .m-thumb = palec (ťukání do displeje)
    return f'''<g class="m-hand"><g class="m-phone" transform="translate({ux} {uy}) rotate({rot})">
      <rect x="-23" y="-40" width="46" height="80" rx="10" fill="{INK}"/>
      <rect x="-19" y="-35" width="38" height="70" rx="7" fill="url(#m-screen-grad)"/>
      <rect x="-6" y="-32" width="12" height="3.5" rx="1.75" fill="{INK}"/>
      <circle cx="-11" cy="-22" r="4.5" fill="#fff" opacity=".9"/>
      <rect x="-4" y="-25" width="17" height="3" rx="1.5" fill="#fff" opacity=".85"/>
      <rect x="-4" y="-20" width="10" height="3" rx="1.5" fill="#fff" opacity=".6"/>
      <rect x="-15" y="-13" width="30" height="28" rx="5" fill="#fff" opacity=".55"/>
      <path class="m-phone-heart" d="M0 8c-5-3.6-8.5-6.4-8.5-10 0-2.6 2-4.4 4.4-4.4 1.8 0 3.3 1.1 4.1 2.6.8-1.5 2.3-2.6 4.1-2.6 2.4 0 4.4 1.8 4.4 4.4 0 3.6-3.5 6.4-8.5 10z" fill="#F09BA5"/>
      <rect x="-15" y="20" width="20" height="3" rx="1.5" fill="#fff" opacity=".8"/>
      <rect x="-15" y="26" width="13" height="3" rx="1.5" fill="#fff" opacity=".55"/>
    </g>
    <g class="m-thumb" transform="translate({tx} {ty}) rotate(-20)"><ellipse rx="7" ry="9.5" fill="#fff" stroke="{INK}" stroke-width="5"/></g></g>'''


EXCL = (f'<g class="m-excl" transform="rotate(12 606 128)"><rect x="599" y="96" width="14" height="40" rx="7" fill="{INK}"/>'
        f'<circle cx="606" cy="149" r="7.5" fill="{INK}"/></g>')

# ležící postavička = originál z loga (jen pro „položení“ na text/kartu)
lie_figure = lambda: f'{body_logo()}{head()}'


def svg(inner, vb, cls="", label="Sparkee maskot"):
    c = f' class="{cls}"' if cls else ""
    return (f'<svg{c} viewBox="{vb}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="{label}">'
            f'<defs>{DEFS_INNER}{EXTRA_DEFS}{B.BODY_DEFS}<path id="m-head-shape" d="{HEAD_D}"/></defs>{inner}</svg>')


VB_STAND = "374 39 264 427"   # s podlahovým stínem
VB_FIG = "374 39 264 407"
POSES = {
    # stojí – hlava rovně, ruce volně dolů (klidový postoj z kresby)
    "stand": svg(SHADOW + f'<g class="m-float">{fig()}</g>', VB_STAND),
    # drží telefon (hero)
    "phone": svg(SHADOW + f'<g class="m-float">{fig(arms=("rest", "hold"), hold_r=phone_hold())}</g>', VB_STAND),
    # mává – ruka do strany, tlapka nahoru
    "wave": svg(SHADOW + f'<g class="m-float">{fig("happy", arms=("wave", "rest"))}</g>', VB_STAND),
    # mává a drží telefon
    "phone-wave": svg(SHADOW + f'<g class="m-float">{fig("happy", arms=("wave", "hold"), hold_r=phone_hold())}</g>', VB_STAND),
    # jásá ^^ – obě ruce nahoru, jiskry
    "happy": svg(f'<g class="m-float">{fig("happy", arms=("cheer", "cheer"))}</g>'
                 + sparkle(612, 112, 16) + sparkle(392, 200, 11) + sparkle(622, 300, 9), VB_FIG),
    # překvapený – ruce do stran, vykřičník
    "surprised": svg(f'<g class="m-float">{fig("surprised", arms=("out", "out"))}</g>' + EXCL, VB_FIG),
    # sticker s bílým okrajem (tmavé pozadí) – mává
    "sticker": svg(fig("happy", arms=("wave", "rest"), sticker=True)
                   + sparkle(636, 104, 16, "#fff") + sparkle(380, 196, 11, "#fff") + sparkle(640, 300, 9, "#fff"),
                   "360 24 298 436"),
    # kostra (dokumentace pro Figmu): klouby a kosti nad klidovou pózou
    "rig": svg(f'<g opacity=".45">{fig()}</g>' + R.skeleton_overlay(), VB_STAND),
    # leží jako v logu – položit na nadpis, kartu, tlačítko
    "lie": svg(f'<g class="m-float">{lie_figure()}</g>', "363 48 266 390"),
    # vykukování přes hranu: rovná hlava + tlapky na lince (spodek viewBoxu = hrana)
    "peek": svg(f'''<defs><clipPath id="peek-clip"><rect x="300" y="0" width="400" height="336"/></clipPath></defs>
      <g clip-path="url(#peek-clip)">{upright(head())}</g>
      <g fill="#fff" stroke="{INK}" stroke-width="7"><ellipse cx="440" cy="334" rx="22" ry="13"/><ellipse cx="548" cy="334" rx="22" ry="13"/></g>
      <path d="M433 330v6M447 330v6M541 330v6M555 330v6" stroke="{INK}" stroke-width="3" stroke-linecap="round" opacity=".35"/>''',
                "374 39 264 314", label="Sparkee maskot vykukuje"),
    "head": svg(upright(head()), "374 39 264 312"),
}

out = ROOT / "assets/img/poses"
out.mkdir(parents=True, exist_ok=True)
for f in out.glob("*.svg"):
    f.unlink()
for name, code in POSES.items():
    (out / f"{name}.svg").write_text(code)

# názvy používané webem
img = ROOT / "assets/img"
for fname, pose in {"mascot": "stand", "mascot-phone": "phone", "mascot-wave": "wave", "mascot-phone-wave": "phone-wave", "mascot-lie": "lie",
                    "mascot-head": "head", "mascot-peek": "peek", "mascot-sticker": "sticker",
                    "mascot-happy": "happy", "mascot-surprised": "surprised"}.items():
    (img / f"{fname}.svg").write_text(POSES[pose])

# hero: stojící + skryté ^^ oči; celé ho oživuje JS rig (assets/js/mascot-rig.js + mascot.js):
# háčky .m-head-rig, .m-flame, .m-eye-l/r, .m-eyes-happy, .m-mouth, .m-cheek, [data-limb=arm-l|r], .m-hand, .m-thumb
HERO = svg(SHADOW + f'<g class="m-float">{fig(alt_happy=True, arms=("rest", "hold"), hold_r=phone_hold(), hero=True)}</g>', VB_STAND)
hero = HERO.replace("<svg ", '<svg class="mascot" ', 1)
idx = ROOT / "index.html"
if idx.exists():
    html = idx.read_text()
    html = re.sub(r"(<!-- MASCOT:START -->).*?(<!-- MASCOT:END -->)",
                  lambda m: m.group(1) + "\n" + hero + "\n" + m.group(2), html, flags=re.S)
    idx.write_text(html)
print("poses:", ", ".join(POSES))
