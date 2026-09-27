"""Compose the animatable Sparkee mascot SVG from Figma logo parts + hand-drawn body/phone.

Output:
  assets/img/mascot.svg        standalone (for reuse / social)
  injects into index.html between <!-- MASCOT:START --> and <!-- MASCOT:END -->
Run: python3 tools/compose_mascot.py
"""
import re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
P = ROOT / "tools/parts"
frag = lambda n: (P / f"{n}.svgfrag").read_text()
strip_ids = lambda t: re.sub(r' id="[^"]*"', "", t)

INK = "#2C303C"

# Head: 6 identical paths with different gradient fills -> one <path> in defs + <use>
head = frag("head_base")
head_d = re.search(r' d="([^"]+)"', head).group(1)
head_fills = re.findall(r'fill="(url\(#[^)]+\))"', head)
defs = frag("defs")

head_layers = "".join(f'<use href="#m-head-shape" fill="{f}"/>' for f in head_fills)

svg = f'''<svg class="mascot" viewBox="330 36 340 470" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sparkee – maskot s telefonem">
<defs>
{defs}
<path id="m-head-shape" d="{head_d}"/>
<path id="m-body-shape" d="M444 326C420 352 412 392 420 420C424 434 430 444 438 450C434 460 432 468 434 474C437 484 452 486 466 485C478 484 485 479 486 471C487 462 488 455 491 453C494 455 495 462 496 471C497 479 504 484 516 485C530 486 545 484 548 474C550 468 548 460 544 450C552 444 558 434 562 420C570 392 562 352 538 326Z"/>
<clipPath id="m-body-clip"><use href="#m-body-shape"/></clipPath>
<linearGradient id="m-body-grad" x1="490" y1="320" x2="490" y2="500" gradientUnits="userSpaceOnUse">
  <stop stop-color="#FFFFFF"/><stop offset=".6" stop-color="#FBFAFE"/><stop offset="1" stop-color="#EEE8FA"/>
</linearGradient>
<radialGradient id="m-pearl-mint" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(426 420) scale(44 64)">
  <stop stop-color="#A5EDC5" stop-opacity=".75"/><stop offset=".55" stop-color="#C4E8EF" stop-opacity=".35"/><stop offset="1" stop-color="#E0F6EB" stop-opacity="0"/>
</radialGradient>
<radialGradient id="m-pearl-lav" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(558 424) scale(48 72)">
  <stop stop-color="#C49CF2" stop-opacity=".7"/><stop offset=".5" stop-color="#DDD0F5" stop-opacity=".35"/><stop offset="1" stop-color="#EAE3F7" stop-opacity="0"/>
</radialGradient>
<radialGradient id="m-pearl-pink" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(491 486) scale(70 24)">
  <stop stop-color="#F5B8DC" stop-opacity=".55"/><stop offset="1" stop-color="#F5E8F0" stop-opacity="0"/>
</radialGradient>
<linearGradient id="m-limb-grad" x1="0" y1="-60" x2="0" y2="10" gradientUnits="userSpaceOnUse">
  <stop stop-color="#FFFFFF"/><stop offset=".7" stop-color="#F6F2FC"/><stop offset="1" stop-color="#E2DFF6"/>
</linearGradient>
<radialGradient id="m-paw-mint" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(-8 -48) scale(14 16)">
  <stop stop-color="#A5EDC5" stop-opacity=".7"/><stop offset="1" stop-color="#A5EDC5" stop-opacity="0"/>
</radialGradient>
<linearGradient id="m-arm-r-grad" x1="552" y1="394" x2="580" y2="426" gradientUnits="userSpaceOnUse">
  <stop stop-color="#FFFFFF"/><stop offset=".6" stop-color="#F3EFFB"/><stop offset="1" stop-color="#D9C9F4"/>
</linearGradient>
<linearGradient id="m-screen-grad" x1="-28" y1="-55" x2="28" y2="55" gradientUnits="userSpaceOnUse">
  <stop stop-color="#A5EDC5"/><stop offset=".35" stop-color="#9AD8F8"/><stop offset=".7" stop-color="#C49CF2"/><stop offset="1" stop-color="#F5B8DC"/>
</linearGradient>
<radialGradient id="m-glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(490 300) scale(190 200)">
  <stop stop-color="#C49CF2" stop-opacity=".45"/><stop offset=".5" stop-color="#9AD8F8" stop-opacity=".22"/><stop offset="1" stop-color="#A5EDC5" stop-opacity="0"/>
</radialGradient>
</defs>

<ellipse class="m-glow" cx="490" cy="300" rx="190" ry="200" fill="url(#m-glow)"/>
<ellipse class="m-shadow" cx="490" cy="494" rx="72" ry="9" fill="{INK}" opacity=".12"/>

<g class="m-float">
  <!-- waving arm (behind body) -->
  <g transform="translate(436 398) rotate(-48)"><g class="m-arm-wave">
    <path d="M0 0L0 -50" stroke="{INK}" stroke-width="31" stroke-linecap="round"/>
    <path d="M0 0L0 -50" stroke="url(#m-limb-grad)" stroke-width="19" stroke-linecap="round"/>
    <circle cx="-3" cy="-52" r="7" fill="#A5EDC5" opacity=".45"/>
    <path d="M-4 -56C-1 -60 4 -59 6 -55" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none"/>
  </g></g>

  <!-- body + legs (one silhouette) -->
  <g class="m-body">
    <use href="#m-body-shape" fill="url(#m-body-grad)"/>
    <g clip-path="url(#m-body-clip)">
      <rect x="400" y="300" width="180" height="220" fill="url(#m-pearl-mint)"/>
      <rect x="400" y="300" width="180" height="220" fill="url(#m-pearl-lav)"/>
      <rect x="400" y="300" width="180" height="220" fill="url(#m-pearl-pink)"/>
      <!-- stín pod hlavou -->
      <ellipse cx="488" cy="330" rx="74" ry="24" fill="#C3A8EE" opacity=".35"/>
      <!-- lesk na bříšku -->
      <ellipse cx="466" cy="394" rx="13" ry="19" fill="#fff" opacity=".75"/>
      <!-- chodidla – spodní stín -->
      <ellipse cx="460" cy="486" rx="26" ry="7" fill="#C49CF2" opacity=".35"/>
      <ellipse cx="522" cy="486" rx="26" ry="7" fill="#C49CF2" opacity=".35"/>
    </g>
    <use href="#m-body-shape" fill="none" stroke="{INK}" stroke-width="6.5" stroke-linejoin="round"/>
    <!-- detaily: dělení nožiček, prstíky, bříško -->
  </g>

  <!-- phone arm -->
  <g class="m-phone-arm">
    <path d="M552 394L578 424" stroke="{INK}" stroke-width="31" stroke-linecap="round"/>
    <path d="M552 394L578 424" stroke="url(#m-arm-r-grad)" stroke-width="19" stroke-linecap="round"/>
    <g class="m-phone" transform="translate(606 404) rotate(12)">
      <rect x="-36" y="-64" width="72" height="128" rx="15" fill="{INK}"/>
      <rect x="-29" y="-56" width="58" height="112" rx="10" fill="url(#m-screen-grad)"/>
      <rect x="-9" y="-52" width="18" height="5" rx="2.5" fill="{INK}"/>
      <circle cx="-16" cy="-34" r="7" fill="#fff" opacity=".9"/>
      <rect x="-6" y="-38" width="26" height="4" rx="2" fill="#fff" opacity=".85"/>
      <rect x="-6" y="-31" width="16" height="4" rx="2" fill="#fff" opacity=".6"/>
      <rect x="-22" y="-20" width="44" height="44" rx="7" fill="#fff" opacity=".55"/>
      <path class="m-phone-heart" d="M0 12c-8-6-13-10-13-16 0-4 3-7 7-7 3 0 5 2 6 4 1-2 3-4 6-4 4 0 7 3 7 7 0 6-5 10-13 16z" fill="#F09BA5"/>
      <rect x="-22" y="30" width="30" height="4" rx="2" fill="#fff" opacity=".8"/>
      <rect x="-22" y="38" width="20" height="4" rx="2" fill="#fff" opacity=".55"/>
    </g>
    <!-- tlapka držící telefon -->
    <path d="M570 424C569 413 580 408 588 413C595 418 594 430 586 434C578 438 570 433 570 424Z" fill="#fff" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M581 416C585 418 587 421 587 425" stroke="{INK}" stroke-width="2.5" stroke-linecap="round" fill="none" opacity=".35"/>
  </g>

  <!-- head -->
  <g class="m-head">
    <g class="m-flame">
      {strip_ids(frag("flame_outline"))}
      {strip_ids(frag("flame_fill"))}
    </g>
    <use href="#m-head-shape" fill="none" stroke="{INK}" stroke-width="12" stroke-linejoin="round"/>
    {head_layers}
    {strip_ids(frag("hl_1"))}
    {strip_ids(frag("hl_2"))}
    <g class="m-face">
      {strip_ids(frag("cheek_l"))}
      {strip_ids(frag("cheek_r"))}
      <g class="m-mouth">{strip_ids(frag("mouth"))}</g>
      <g class="m-eye m-eye-l">{strip_ids(frag("eye_l"))}</g>
      <g class="m-eye m-eye-r">{strip_ids(frag("eye_r"))}</g>
    </g>
  </g>
</g>
</svg>'''

svg = re.sub(r"\n\s*\n", "\n", svg)
out = ROOT / "assets/img"
out.mkdir(parents=True, exist_ok=True)
(out / "mascot.svg").write_text(svg)

idx = ROOT / "index.html"
if idx.exists():
    html = idx.read_text()
    html = re.sub(r"(<!-- MASCOT:START -->).*?(<!-- MASCOT:END -->)",
                  lambda m: m.group(1) + "\n" + svg + "\n" + m.group(2), html, flags=re.S)
    idx.write_text(html)
print("mascot.svg", len(svg), "bytes")
