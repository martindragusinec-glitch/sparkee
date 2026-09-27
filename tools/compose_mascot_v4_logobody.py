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


def head(face="normal", sticker=False, alt_happy=False):
    fl = stroke(FLAME_DS, 30, "#fff") if sticker else ""
    # hero: skryté ^^ oči pro stav „nadšení“ (CSS je přepne) – atribut opacity=0 = neviditelné i bez CSS
    alt = eyes_happy().replace('class="m-eyes m-eyes--happy"', 'class="m-eyes-happy" opacity="0"') if alt_happy else ""
    return f'''<g class="m-head">
    <g class="m-flame">{fl}{FLAME}</g>
    <use href="#m-head-shape" fill="none" stroke="{INK}" stroke-width="12" stroke-linejoin="round"/>
    {"".join(s(p) for p in byid["Head base"])}
    {s(byid["Vector_17"])}{s(byid["Vector_18"])}
    <g class="m-face">{s(byid["Vector_15"])}{s(byid["Vector_16"])}{FACES[face]()}{alt}</g>
  </g>'''


def body():
    return f'<g class="m-body">{stroke(BODY_DS, 12)}{s(BODY)}</g>'


# ---------- EXPERIMENT (nepoužito): mávající ruka vyříznutá z těla – při větším úhlu jsou u ramene švy,
# protože trup pod rukou v originále není nakreslený. Pro čisté mávání je potřeba dokreslit trup. ----------
ARM_PIVOT = (558, 318)   # rameno (souřadnice loga)
ARM_POLY = "M555 296H660V340L592 347L576 348L553 330Z"   # oblast zvednuté ruky – hrany vedou po tahu záhybu


def body_wave():
    px, py = ARM_PIVOT
    inner = f'{stroke(BODY_DS, 12)}{s(BODY)}'
    return (f'<defs><clipPath id="arm-clip"><path d="{ARM_POLY}"/></clipPath>'
            f'<clipPath id="rest-clip"><path clip-rule="evenodd" d="M300 0H720V620H300Z{ARM_POLY}"/></clipPath></defs>'
            # výplň ramene pod rukou – při zvednutí ruky zakryje odhalené místo (při 0° je schovaná)
            f'<g class="m-body"><circle cx="{px + 4}" cy="{py + 6}" r="17" fill="#FBFAFE"/>'
            f'<g clip-path="url(#rest-clip)">{inner}</g>'
            f'<g transform="translate({px} {py})"><g class="m-arm-wave">'
            f'<g transform="translate({-px} {-py})" clip-path="url(#arm-clip)">{inner}</g></g></g></g>')


def svg(inner, vb, cls="", label="Sparkee maskot"):
    c = f' class="{cls}"' if cls else ""
    return (f'<svg{c} viewBox="{vb}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="{label}">'
            f'<defs>{DEFS_INNER}{EXTRA_DEFS}<path id="m-head-shape" d="{HEAD_D}"/></defs>{inner}</svg>')


# Postavička v logu leží na textu -> hlava je nakloněná. Když STOJÍ, celou ji narovnáme (hlava rovně).
STAND = 24            # o kolik stupňů narovnat (sklon očí v logu je ~ -23.7°)
PIVOT = (490, 300)
SHADOW = f'<ellipse class="m-shadow" cx="490" cy="468" rx="60" ry="8" fill="{INK}" opacity=".12"/>'


def upright(inner, deg=STAND):
    """Narovná postavičku; plamínek zůstane svisle (protirotace kolem jeho středu)."""
    inner = re.sub(r'<g class="m-flame">(.*?)' + re.escape(FLAME) + '</g>',
                   lambda m: f'<g class="m-flame"><g transform="rotate({-deg} 425 97)">{m.group(1)}{FLAME}</g></g>', inner, count=1, flags=re.S)
    return f'<g transform="rotate({deg} {PIVOT[0]} {PIVOT[1]})">{inner}</g>'


figure = lambda face="normal", sticker=False: f'{body()}{head(face, sticker)}'
sticker_outline = lambda: f'<g class="m-sticker">{stroke(BODY_DS + [HEAD_D], 40, "#fff")}</g>'
EXCL = (f'<g class="m-excl" transform="rotate(12 606 128)"><rect x="599" y="96" width="14" height="40" rx="7" fill="{INK}"/>'
        f'<circle cx="606" cy="149" r="7.5" fill="{INK}"/></g>')

VB_STAND = "374 39 264 443"
VB_FIG = "374 39 264 421"
POSES = {
    # stojí / vznáší se – hlava rovně (hero, obecné použití)
    "stand": svg(SHADOW + f'<g class="m-float">{upright(figure())}</g>', VB_STAND),
    # leží jako v logu – na hranu karet, nadpisů, tlačítek
    "lie": svg(f'<g class="m-float">{figure()}</g>', "363 48 266 390"),
    # nadšený (^^) s jiskrami – úspěch formuláře, CTA
    "happy": svg(f'<g class="m-float">{upright(figure("happy"))}</g>'
                 + sparkle(600, 120, 16) + sparkle(392, 210, 11) + sparkle(612, 300, 9), VB_FIG),
    # překvapený s vykřičníkem – FAQ, 404
    "surprised": svg(f'<g class="m-float">{upright(figure("surprised"))}</g>' + EXCL, VB_FIG),
    # sticker s bílým okrajem (tmavé pozadí)
    "sticker": svg(upright(sticker_outline() + figure("happy", sticker=True))
                   + sparkle(622, 110, 16, "#fff") + sparkle(378, 200, 11, "#fff") + sparkle(630, 300, 9, "#fff"),
                   "360 24 292 450"),
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
for name, code in POSES.items():
    (out / f"{name}.svg").write_text(code)

# názvy používané webem
img = ROOT / "assets/img"
for fname, pose in {"mascot": "stand", "mascot-lie": "lie", "mascot-head": "head", "mascot-peek": "peek",
                    "mascot-sticker": "sticker", "mascot-happy": "happy", "mascot-surprised": "surprised"}.items():
    (img / f"{fname}.svg").write_text(POSES[pose])
for old in ("mascot-float.svg",):
    (img / old).unlink(missing_ok=True)

HERO = svg(SHADOW + f'<g class="m-float">{upright(body() + head(alt_happy=True))}</g>', VB_STAND)
hero = HERO.replace("<svg ", '<svg class="mascot" ', 1)
idx = ROOT / "index.html"
if idx.exists():
    html = idx.read_text()
    html = re.sub(r"(<!-- MASCOT:START -->).*?(<!-- MASCOT:END -->)",
                  lambda m: m.group(1) + "\n" + hero + "\n" + m.group(2), html, flags=re.S)
    idx.write_text(html)
print("poses:", ", ".join(POSES))
