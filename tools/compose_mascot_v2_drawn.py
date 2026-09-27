"""Sparkee maskot – ručně kreslené SVG podle brand boardu (standing pose, rovná hlava).

Plamínek je vektor z loga ve Figmě (tools/parts/flame_*.svgfrag), zbytek je kreslený tady.
Výstup:
  assets/img/mascot.svg       – póza s telefonem (hero)
  assets/img/mascot-head.svg  – jen hlava (favicon, vykukování)
  vloží SVG do index.html mezi <!-- MASCOT:START --> a <!-- MASCOT:END -->
Spuštění: python3 tools/compose_mascot.py
"""
import re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
P = ROOT / "tools/parts"
frag = lambda n: re.sub(r' id="[^"]*"', "", (P / f"{n}.svgfrag").read_text())
INK = "#2C303C"

# gradienty plamínku z Figmy (paint0–paint3)
figma_defs = (P / "defs.svgfrag").read_text()
flame_defs = "".join(re.findall(r'<(?:linear|radial)Gradient id="paint[0-3]_[^"]*".*?</(?:linear|radial)Gradient>', figma_defs, re.S))

# ---------- tvary (souřadnice: střed postavičky x=200) ----------
HEAD = "M200 76C212 76 220 90 234 112C256 146 300 180 340 206C356 216 368 226 362 234C356 244 330 252 306 270C296 280 290 300 280 314C262 338 232 346 200 346C168 346 138 338 120 314C110 300 104 280 94 270C70 252 44 244 38 234C32 226 44 216 60 206C100 180 144 146 166 112C180 90 188 76 200 76Z"
BODY = "M156 328C146 356 142 386 148 410C151 424 150 440 146 452C142 466 152 474 164 472C176 470 182 462 184 452C186 444 192 440 200 440C208 440 214 446 218 454C224 464 234 470 244 466C255 462 256 452 250 444C246 432 248 420 252 408C258 386 254 356 244 328Z"
ARM = "M-11 6C-13 -6 -14 -18 -11 -28C-8 -36 6 -36 8 -28C11 -18 11 -6 11 6Z"  # míří nahoru, rameno v 0,0

DEFS = f'''<defs>
{flame_defs}
<path id="m-head-shape" d="{HEAD}"/>
<path id="m-body-shape" d="{BODY}"/>
<clipPath id="m-head-clip"><use href="#m-head-shape"/></clipPath>
<clipPath id="m-body-clip"><use href="#m-body-shape"/></clipPath>
<linearGradient id="m-head-base" x1="50" y1="200" x2="350" y2="220" gradientUnits="userSpaceOnUse">
  <stop stop-color="#8FE3B8"/><stop offset=".38" stop-color="#A8E6E0"/><stop offset=".62" stop-color="#A9C8F6"/><stop offset="1" stop-color="#C49CF2"/>
</linearGradient>
<radialGradient id="m-head-shine" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(176 170) scale(120 105)">
  <stop stop-color="#FFFFFF" stop-opacity=".85"/><stop offset=".55" stop-color="#FFFFFF" stop-opacity=".25"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
</radialGradient>
<radialGradient id="m-head-pink" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(250 330) scale(120 60)">
  <stop stop-color="#F5B8DC" stop-opacity=".55"/><stop offset="1" stop-color="#F5B8DC" stop-opacity="0"/>
</radialGradient>
<radialGradient id="m-head-cyan" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(120 300) scale(90 50)">
  <stop stop-color="#9AF0D8" stop-opacity=".6"/><stop offset="1" stop-color="#9AF0D8" stop-opacity="0"/>
</radialGradient>
<linearGradient id="m-body-base" x1="200" y1="330" x2="200" y2="475" gradientUnits="userSpaceOnUse">
  <stop stop-color="#FFFFFF"/><stop offset=".6" stop-color="#FAF8FE"/><stop offset="1" stop-color="#EDE6FA"/>
</linearGradient>
<radialGradient id="m-pearl-mint" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(146 410) scale(38 70)">
  <stop stop-color="#A5EDC5" stop-opacity=".85"/><stop offset=".6" stop-color="#C4E8EF" stop-opacity=".3"/><stop offset="1" stop-color="#E0F6EB" stop-opacity="0"/>
</radialGradient>
<radialGradient id="m-pearl-lav" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(254 416) scale(38 70)">
  <stop stop-color="#C49CF2" stop-opacity=".75"/><stop offset=".55" stop-color="#DDD0F5" stop-opacity=".3"/><stop offset="1" stop-color="#EAE3F7" stop-opacity="0"/>
</radialGradient>
<linearGradient id="m-limb-l" x1="0" y1="-48" x2="0" y2="8" gradientUnits="userSpaceOnUse">
  <stop stop-color="#C6F3DC"/><stop offset=".5" stop-color="#FFFFFF"/><stop offset="1" stop-color="#F3EFFB"/>
</linearGradient>
<linearGradient id="m-limb-r" x1="0" y1="-48" x2="0" y2="8" gradientUnits="userSpaceOnUse">
  <stop stop-color="#D9C4F6"/><stop offset=".5" stop-color="#FFFFFF"/><stop offset="1" stop-color="#F3EFFB"/>
</linearGradient>
<linearGradient id="m-screen-grad" x1="-28" y1="-55" x2="28" y2="55" gradientUnits="userSpaceOnUse">
  <stop stop-color="#A5EDC5"/><stop offset=".35" stop-color="#9AD8F8"/><stop offset=".7" stop-color="#C49CF2"/><stop offset="1" stop-color="#F5B8DC"/>
</linearGradient>
<radialGradient id="m-glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(200 250) scale(230 250)">
  <stop stop-color="#C49CF2" stop-opacity=".4"/><stop offset=".5" stop-color="#9AD8F8" stop-opacity=".2"/><stop offset="1" stop-color="#A5EDC5" stop-opacity="0"/>
</radialGradient>
</defs>'''

# plamínek z loga: střed ~ (425, 97), spodek ~141 -> nad špičku hlavy
FLAME = f'''<g class="m-flame"><g transform="translate(-225 -86)">
      {frag("flame_outline")}
      {frag("flame_fill")}
    </g></g>'''

HEAD_G = f'''<g class="m-head">
    {FLAME}
    <use href="#m-head-shape" fill="url(#m-head-base)"/>
    <g clip-path="url(#m-head-clip)">
      <rect x="30" y="60" width="340" height="300" fill="url(#m-head-cyan)"/>
      <rect x="30" y="60" width="340" height="300" fill="url(#m-head-pink)"/>
      <rect x="30" y="60" width="340" height="300" fill="url(#m-head-shine)"/>
    </g>
    <use href="#m-head-shape" fill="none" stroke="{INK}" stroke-width="9" stroke-linejoin="round"/>
    <!-- lesk -->
    <path d="M174 132C166 144 158 158 153 172" stroke="#fff" stroke-width="9" stroke-linecap="round" fill="none"/>
    <circle cx="152" cy="190" r="5" fill="#fff"/>
    <g class="m-face">
      <ellipse cx="126" cy="272" rx="16" ry="9" fill="#C6F7D7"/>
      <ellipse cx="274" cy="272" rx="16" ry="9" fill="#E9D7FB"/>
      <g class="m-eye m-eye-l"><circle cx="158" cy="240" r="20" fill="{INK}"/><circle cx="164" cy="232" r="7" fill="#fff"/><circle cx="151" cy="248" r="3.5" fill="#fff" opacity=".95"/></g>
      <g class="m-eye m-eye-r"><circle cx="242" cy="240" r="20" fill="{INK}"/><circle cx="248" cy="232" r="7" fill="#fff"/><circle cx="235" cy="248" r="3.5" fill="#fff" opacity=".95"/></g>
      <g class="m-mouth">
        <path d="M185 268C186 286 214 286 215 268C206 272 194 272 185 268Z" fill="{INK}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M191 279C196 274 204 274 209 279C204 283 196 283 191 279Z" fill="#F09BA5"/>
      </g>
    </g>
  </g>'''

BODY_G = f'''<g class="m-body">
    <use href="#m-body-shape" fill="url(#m-body-base)"/>
    <g clip-path="url(#m-body-clip)">
      <rect x="130" y="320" width="140" height="200" fill="url(#m-pearl-mint)"/>
      <rect x="130" y="320" width="140" height="200" fill="url(#m-pearl-lav)"/>
      <ellipse cx="200" cy="340" rx="60" ry="22" fill="#C3A8EE" opacity=".45"/>
      <ellipse cx="176" cy="392" rx="9" ry="15" fill="#fff" opacity=".9"/>
    </g>
    <use href="#m-body-shape" fill="none" stroke="{INK}" stroke-width="8" stroke-linejoin="round"/>
  </g>'''

PHONE = f'''<g class="m-phone" transform="translate(298 388) rotate(10)">
      <rect x="-33" y="-58" width="66" height="116" rx="14" fill="{INK}"/>
      <rect x="-26" y="-51" width="52" height="102" rx="9" fill="url(#m-screen-grad)"/>
      <rect x="-8" y="-47" width="16" height="4.5" rx="2.25" fill="{INK}"/>
      <circle cx="-14" cy="-31" r="6.5" fill="#fff" opacity=".9"/>
      <rect x="-5" y="-35" width="24" height="4" rx="2" fill="#fff" opacity=".85"/>
      <rect x="-5" y="-28" width="14" height="4" rx="2" fill="#fff" opacity=".6"/>
      <rect x="-20" y="-18" width="40" height="40" rx="7" fill="#fff" opacity=".55"/>
      <path class="m-phone-heart" d="M0 11c-7-5-12-9-12-14 0-4 3-6 6-6 3 0 5 2 6 4 1-2 3-4 6-4 3 0 6 2 6 6 0 5-5 9-12 14z" fill="#F09BA5"/>
      <rect x="-20" y="28" width="28" height="4" rx="2" fill="#fff" opacity=".8"/>
      <rect x="-20" y="36" width="18" height="4" rx="2" fill="#fff" opacity=".55"/>
    </g>'''

MASCOT = f'''<svg class="mascot" viewBox="0 -44 400 548" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sparkee – maskot s telefonem">
{DEFS}
<ellipse class="m-glow" cx="200" cy="250" rx="230" ry="250" fill="url(#m-glow)"/>
<ellipse class="m-shadow" cx="200" cy="494" rx="60" ry="8" fill="{INK}" opacity=".12"/>
<g class="m-float">
  <!-- mávající ručička -->
  <g transform="translate(156 370) rotate(-62)"><g class="m-arm-wave">
    <path d="{ARM}" fill="url(#m-limb-l)" stroke="{INK}" stroke-width="7" stroke-linejoin="round"/>
    <path d="M-3 -29C0 -32 4 -31 5 -27" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none"/>
  </g></g>
  {BODY_G}
  <!-- ručička s telefonem -->
  <g class="m-phone-arm">
    <g transform="translate(245 370) rotate(128)">
      <path d="{ARM}" fill="url(#m-limb-r)" stroke="{INK}" stroke-width="7" stroke-linejoin="round"/>
    </g>
    {PHONE}
    <path d="M261 400C260 391 269 387 276 391C283 395 282 406 275 409C268 413 261 408 261 400Z" fill="#fff" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>
  </g>
  {HEAD_G}
</g>
</svg>'''

HEAD_ONLY = f'''<svg viewBox="30 -44 340 400" xmlns="http://www.w3.org/2000/svg">
{DEFS}
{HEAD_G}
</svg>'''

clean = lambda s: re.sub(r"\n\s*\n", "\n", s)
out = ROOT / "assets/img"; out.mkdir(parents=True, exist_ok=True)
(out / "mascot.svg").write_text(clean(MASCOT))
(out / "mascot-head.svg").write_text(clean(HEAD_ONLY))

idx = ROOT / "index.html"
if idx.exists():
    html = idx.read_text()
    html = re.sub(r"(<!-- MASCOT:START -->).*?(<!-- MASCOT:END -->)",
                  lambda m: m.group(1) + "\n" + clean(MASCOT) + "\n" + m.group(2), html, flags=re.S)
    idx.write_text(html)
print("mascot.svg", len(MASCOT), "| head", len(HEAD_ONLY))
