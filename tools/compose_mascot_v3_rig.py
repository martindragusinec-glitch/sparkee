"""Sparkee maskot – přímo vektory z loga ve Figmě (node 45:201 / 124:3), otočené do vzpřímené pózy.

Obrys se dopočítá tahem (stroke) všech výplní – stejně jako v logu.
Výstupy (assets/img/):
  mascot.svg          – hero (animovatelné třídy .m-*)
  mascot-sticker.svg  – s bílým „sticker“ okrajem (tmavé pozadí)
  mascot-peek.svg     – hlava + tlapky vykukující přes hranu
  mascot-head.svg     – jen hlava (favicon)
+ vloží hero SVG do index.html mezi <!-- MASCOT:START --> / <!-- MASCOT:END -->
Spuštění: python3 tools/compose_mascot.py
"""
import re, pathlib
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parent.parent
NS = "http://www.w3.org/2000/svg"
ET.register_namespace("", NS)
src = ET.parse(ROOT / "assets/figma/logo-full.svg").getroot()
byid = {e.get("id"): e for e in src.iter() if e.get("id")}
s = lambda e: re.sub(r' id="[^"]*"', "", re.sub(r' xmlns="[^"]+"', "", ET.tostring(e, encoding="unicode")))
paths = lambda e: [p.get("d") for p in e.iter() if p.tag.endswith("path")]

INK = "#2C303C"
TILT = 22            # otočení celé postavičky (logo je nakloněné)
PIVOT = "490 300"

raw = lambda e: re.sub(r' xmlns="[^"]+"', "", ET.tostring(e, encoding="unicode"))
defs = "".join(raw(c) for c in next(src.iter(f"{{{NS}}}defs")) if not c.tag.endswith("clipPath"))
head_d = paths(byid["Head base"])[0]
head_fills = re.findall(r'fill="(url\(#[^)]+\))"', s(byid["Head base"]))
body = byid["Group_10"]
body_ds = paths(body)

stroke_pass = lambda ds, w, col=INK: "".join(
    f'<path d="{d}" fill="none" stroke="{col}" stroke-width="{w}" stroke-linejoin="round" stroke-linecap="round"/>' for d in ds)

EYE_L, EYE_R = (455, 278.5), (528.75, 246.25)
FACE_TILT = -24  # obličej v logu je nakloněný – kvůli „^^“ očím

def happy_eye(cx, cy):
    return (f'<path d="M{cx-13} {cy+5}Q{cx} {cy-12} {cx+13} {cy+5}" transform="rotate({FACE_TILT} {cx} {cy})" '
            f'fill="none" stroke="{INK}" stroke-width="7" stroke-linecap="round"/>')

face_parts = {k: s(byid[v]) for k, v in dict(cheek_l="Vector_15", cheek_r="Vector_16", hl1="Vector_17", hl2="Vector_18",
                                              mouth="Group_12", eye_r="Group_13", eye_l="Group_14").items()}

DEFS = f'<defs>{defs}<path id="m-head-shape" d="{head_d}"/></defs>'

FLAME = f'<g class="m-flame"><g transform="rotate({-TILT} 425 97)">{s(byid["Group_4"])}</g></g>'

def head_group(extra_stroke=""):
    return f'''<g class="m-head">
    {FLAME}
    {extra_stroke}
    <use href="#m-head-shape" fill="none" stroke="{INK}" stroke-width="12" stroke-linejoin="round"/>
    {"".join(f'<use href="#m-head-shape" fill="{f}"/>' for f in head_fills)}
    {face_parts["hl1"]}{face_parts["hl2"]}
    <g class="m-face">
      {face_parts["cheek_l"]}{face_parts["cheek_r"]}
      <g class="m-mouth">{face_parts["mouth"]}</g>
      <g class="m-eyes">
        <g class="m-eye m-eye-l">{face_parts["eye_l"]}</g>
        <g class="m-eye m-eye-r">{face_parts["eye_r"]}</g>
      </g>
      <g class="m-eyes-happy" opacity="0">{happy_eye(*EYE_L)}{happy_eye(*EYE_R)}</g>
    </g>
  </g>'''

def body_group(extra_stroke=""):
    return f'''<g class="m-body">
    {extra_stroke}
    {stroke_pass(body_ds, 12)}
    {s(body)}
  </g>'''

def figure(sticker=False):
    white = ""
    if sticker:
        white = stroke_pass(body_ds + [head_d], 44, "#fff")
    return f'''<g transform="rotate({TILT} {PIVOT})">
  {white}
  {body_group()}
  {head_group()}
</g>'''

# ---------- RIG: stojící tělo z dílů (kreslené ve stylu loga) ----------
# Souřadnice po otočení hlavy; krk ~ (497, 336). Každý díl má kloub v 0,0 svých lokálních souřadnic,
# takže pózy = jen rotate() na .rig-j uvnitř dílu (web CSS / JS / Remotion).
RIG_DEFS = """
<linearGradient id="rig-white" x1="0" y1="-10" x2="0" y2="60" gradientUnits="userSpaceOnUse">
  <stop stop-color="#FFFFFF"/><stop offset=".6" stop-color="#F8F6FD"/><stop offset="1" stop-color="#E6DEF8"/>
</linearGradient>
<linearGradient id="rig-torso" x1="497" y1="330" x2="497" y2="440" gradientUnits="userSpaceOnUse">
  <stop stop-color="#FFFFFF"/><stop offset=".65" stop-color="#FAF8FE"/><stop offset="1" stop-color="#E9E1F9"/>
</linearGradient>
<radialGradient id="rig-mint" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(452 400) scale(34 58)">
  <stop stop-color="#A5EDC5" stop-opacity=".8"/><stop offset=".6" stop-color="#C4E8EF" stop-opacity=".3"/><stop offset="1" stop-color="#E0F6EB" stop-opacity="0"/>
</radialGradient>
<radialGradient id="rig-lav" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(544 408) scale(34 58)">
  <stop stop-color="#C49CF2" stop-opacity=".7"/><stop offset=".55" stop-color="#DDD0F5" stop-opacity=".3"/><stop offset="1" stop-color="#EAE3F7" stop-opacity="0"/>
</radialGradient>
<radialGradient id="rig-tip-mint" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(0 34) scale(16 14)">
  <stop stop-color="#A5EDC5" stop-opacity=".75"/><stop offset="1" stop-color="#A5EDC5" stop-opacity="0"/>
</radialGradient>
<radialGradient id="rig-tip-lav" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(0 34) scale(16 14)">
  <stop stop-color="#C49CF2" stop-opacity=".7"/><stop offset="1" stop-color="#C49CF2" stop-opacity="0"/>
</radialGradient>
<path id="rig-torso-shape" d="M462 328C447 351 443 380 449 405C454 425 470 438 497 438C524 438 540 425 545 405C551 380 547 351 532 328Z"/>
<clipPath id="rig-torso-clip"><use href="#rig-torso-shape"/></clipPath>
<path id="rig-arm" d="M-10 -4C-12 10 -12 23 -9 31C-6 40 8 40 10 31C12 23 12 10 11 -4C8 -9 -7 -9 -10 -4Z"/>
<path id="rig-leg" d="M-15 -8C-17 10 -18 24 -17 32C-15 44 13 45 15 33C16 23 16 9 14 -8C9 -13 -10 -13 -15 -8Z"/>
"""


def limb(cls, shape, x, y, rot, tip):
    return (f'<g class="{cls}" transform="translate({x} {y}) rotate({rot})"><g class="rig-j">'
            f'<use href="#{shape}" fill="url(#rig-white)" stroke="{INK}" stroke-width="6.5" stroke-linejoin="round"/>'
            f'<use href="#{shape}" fill="url(#{tip})"/>'
            f'<path d="M-4 30C-1 33 3 33 6 30" stroke="#fff" stroke-width="2.5" stroke-linecap="round" fill="none" opacity=".9"/>'
            f'</g></g>')


TORSO = f"""<g class="rig-torso">
      <use href="#rig-torso-shape" fill="url(#rig-torso)"/>
      <g clip-path="url(#rig-torso-clip)">
        <rect x="440" y="320" width="120" height="130" fill="url(#rig-mint)"/>
        <rect x="440" y="320" width="120" height="130" fill="url(#rig-lav)"/>
        <ellipse cx="497" cy="336" rx="58" ry="18" fill="#C3A8EE" opacity=".45"/>
        <ellipse cx="478" cy="388" rx="8" ry="14" fill="#fff" opacity=".9"/>
      </g>
      <use href="#rig-torso-shape" fill="none" stroke="{INK}" stroke-width="6.5" stroke-linejoin="round"/>
    </g>"""


def rig_body():
    return ('<g class="m-body rig">'
            + limb("rig-leg-l", "rig-leg", 479, 424, 4, "rig-tip-mint")
            + limb("rig-leg-r", "rig-leg", 516, 424, -4, "rig-tip-lav")
            + TORSO
            + limb("rig-arm-l", "rig-arm", 457, 356, 38, "rig-tip-mint")
            + limb("rig-arm-r", "rig-arm", 537, 356, -38, "rig-tip-lav")
            + '</g>')


RIG = f"""<svg class="mascot" viewBox="362 40 272 440" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sparkee maskot">
<defs>{defs}<path id="m-head-shape" d="{head_d}"/>{RIG_DEFS}</defs>
<ellipse class="m-shadow" cx="497" cy="474" rx="56" ry="7" fill="{INK}" opacity=".12"/>
<g class="m-float">{rig_body()}
<g transform="rotate({TILT} {PIVOT})">{head_group()}</g></g>
</svg>"""

VB = "362 30 290 440"

MASCOT = f'''<svg class="mascot" viewBox="{VB}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sparkee maskot">
{DEFS}
<ellipse class="m-shadow" cx="505" cy="440" rx="58" ry="8" fill="{INK}" opacity=".12"/>
<g class="m-float">{figure()}</g>
</svg>'''

STICKER = f'''<svg viewBox="350 24 294 450" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sparkee maskot">
{DEFS}
{figure(sticker=True)}
</svg>'''

# vykukování: hlava bez naklonění těla + dvě tlapky na hraně (hrana = spodek viewBoxu)
PEEK = f'''<svg viewBox="356 36 300 266" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
{DEFS}
<g transform="rotate(10 490 300)">{head_group()}</g>
<g stroke="{INK}" stroke-width="7" fill="#fff">
  <ellipse cx="430" cy="296" rx="22" ry="13"/>
  <ellipse cx="552" cy="296" rx="22" ry="13"/>
</g>
<path d="M423 292v6M437 292v6M545 292v6M559 292v6" stroke="{INK}" stroke-width="3" stroke-linecap="round" opacity=".35"/>
</svg>'''

HEAD = f'''<svg viewBox="362 40 292 312" xmlns="http://www.w3.org/2000/svg">
{DEFS}
<g transform="rotate({TILT} 490 300)">{head_group()}</g>
</svg>'''

out = ROOT / "assets/img"
out.mkdir(parents=True, exist_ok=True)
for name, svg in dict(mascot=RIG, **{"mascot-float": MASCOT, "mascot-sticker": STICKER, "mascot-peek": PEEK, "mascot-head": HEAD}).items():
    (out / f"{name}.svg").write_text(re.sub(r"\n\s*\n", "\n", svg))

idx = ROOT / "index.html"
if idx.exists():
    html = idx.read_text()
    html = re.sub(r"(<!-- MASCOT:START -->).*?(<!-- MASCOT:END -->)",
                  lambda m: m.group(1) + "\n" + RIG + "\n" + m.group(2), html, flags=re.S)
    idx.write_text(html)
print("ok", len(MASCOT))
