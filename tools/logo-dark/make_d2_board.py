"""Write variants/D2-cut-rim-board.html (rendered to D2-cut-rim-board.png with tools/shot.sh).
usage: python3 make_d2_board.py <chosen g> [--chosen-rho 5]"""
import sys, os, json
HERE = os.path.dirname(os.path.abspath(__file__))
V = os.path.join(HERE, 'variants')
g_chosen = sys.argv[1] if len(sys.argv) > 1 else '2.32'
RHO = '5'; WM = '1.45'
OUT = 'D2-cut-rim.svg'
OFF = '/assets/img/logo.svg'
K = 568 / 292

HOLO_BG = ('radial-gradient(ellipse 55% 75% at 30% 38%, rgba(196,156,242,.34), transparent 70%),'
           'radial-gradient(ellipse 45% 60% at 72% 62%, rgba(154,216,248,.26), transparent 70%),'
           'radial-gradient(ellipse 60% 50% at 50% 105%, rgba(165,237,197,.20), transparent 70%), #1E2029')
BGS = [('Ink #2C303C', '#2C303C'), ('Near-black #1E2029', '#1E2029'), ('Dark holo glow', HOLO_BG)]

def img(src, w, extra=''):
    return '<img src="%s" width="%d" height="%d" %s>' % (src, w, round(w / K), extra)

def crop(src, x, y, w, h, s, bg, label, overlay=''):
    pos = 'left:%dpx;top:%dpx;width:%dpx;height:%dpx' % (-x * s, -y * s, 568 * s, 292 * s)
    return ('<figure class="tile"><div class="crop" style="width:%dpx;height:%dpx;background:%s">'
            '<img src="%s" style="%s">%s</div><figcaption>%s</figcaption></figure>'
            % (w * s, h * s, bg, src, pos, overlay.replace('class="ov"', 'class="ov" style="%s"' % pos), label))

GUIDES = [('y', 0.0, 'flame tip'), ('y', 51.46, 'head top'), ('y', 214.85, 'foot'), ('y', 262.3, 'baseline'),
          ('x', 151.86, 'head left'), ('x', 295.38, 'paw right')]
def guides_svg(color):
    out = ['<svg class="guides" viewBox="0 0 568 292" preserveAspectRatio="none">']
    for ax, v, _ in GUIDES:
        if ax == 'y': out.append('<line x1="-10" x2="580" y1="%s" y2="%s" stroke="%s" stroke-width="0.6" stroke-dasharray="3 2" vector-effect="non-scaling-stroke"/>' % (v, v, color))
        else: out.append('<line y1="-10" y2="300" x1="%s" x2="%s" stroke="%s" stroke-width="0.6" stroke-dasharray="3 2" vector-effect="non-scaling-stroke"/>' % (v, v, color))
    out.append('</svg>')
    return ''.join(out)

SIL = open(os.path.join(HERE, 'parts', 'mascot_silhouette.svg')).read().split(' d="')[1].split('"')[0]
OFFSET = open(os.path.join(HERE, 'data', 'd2', 'offset_g2.32.path')).read()
def band_overlay(g):
    # exact offset of the mascot silhouette at distance g (distance field iso-line): the cut letter edges must lie on it
    return ('<svg class="ov" viewBox="0 0 568 292"><path d="%s" fill="none" stroke="#FF3D9A" stroke-width="1.6" stroke-dasharray="7 5" vector-effect="non-scaling-stroke"/></svg>' % OFFSET)

css = """
*{box-sizing:border-box} body{margin:0;background:#0F1016;color:#C9CBD6;font:15px/1.45 -apple-system,'Helvetica Neue',Arial,sans-serif;width:2000px}
.panel{padding:28px 22px !important}
h1{font-size:30px;margin:0 0 6px;color:#fff;font-weight:700;letter-spacing:-.01em} h2{font-size:19px;color:#fff;margin:0 0 14px;font-weight:650}
.sec{padding:34px 48px;border-top:1px solid #23252F} .sub{color:#8D90A0;font-size:14px;max-width:1880px}
.row{display:flex;gap:24px;align-items:flex-start;flex-wrap:nowrap}
.panel{position:relative;padding:28px 34px;border-radius:14px} .panel .lab{position:absolute;left:14px;top:9px;font-size:12px;color:#8D90A0;letter-spacing:.04em;text-transform:uppercase}
.paper .lab{color:#6E6A60}
.guides{position:absolute;left:22px;top:28px;width:900px;height:463px;overflow:visible;pointer-events:none}
.sizes{display:flex;gap:30px;align-items:flex-end;padding:30px 34px 26px;border-radius:14px;position:relative}
.sizes .cap{font-size:11px;color:#8D90A0;margin-top:6px;text-align:center}
.lab2{position:absolute;left:12px;top:7px;font-size:11px;color:#8D90A0;text-transform:uppercase;letter-spacing:.04em}
.tile{margin:0} .crop{position:relative;overflow:hidden;border-radius:10px} .crop img,.crop .ov{position:absolute}

figcaption{font-size:12.5px;color:#9A9DAD;margin-top:7px}
.pix canvas{image-rendering:pixelated;border-radius:8px;display:block}
.chosen{outline:2px solid #C49CF2;outline-offset:6px}
.tag{display:inline-block;background:#C49CF2;color:#1E2029;font-weight:700;font-size:11px;padding:2px 7px;border-radius:9px;margin-left:8px;vertical-align:2px}
.spec{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:18px}
.spec div{background:#171821;border:1px solid #23252F;border-radius:10px;padding:12px 14px;font-size:13px} .spec b{color:#fff;display:block;font-size:13.5px;margin-bottom:3px}
"""

S = 4 * 900 / 568  # "4x zoom" = four times the 900px presentation size
ZOOMS = [('a', 186, 168, 56, 48, 'a · bowl top + stem under the paw and leg'),
         ('r', 243, 176, 58, 50, 'r · stem cut under the foot, arm to the right of it'),
         ('k', 282, 146, 52, 50, 'k · nothing cut: 10.8 units of clear space'),
         ('sparkle', 516, 142, 54, 54, '✦ sparkle · holo, untouched, no letter contact')]

def page():
    h = ['<!doctype html><html><head><meta charset="utf-8"><style>%s</style></head><body>' % css]
    h.append('<div class="sec" style="border:0"><h1>Sparkee logo on dark · D2 “cut + rim”</h1>'
             '<div class="sub">The letters turn mist and are cut out around the lying mascot with one even gap. The outer part of the mascot\'s ink outline turns into a light holo rim, like a die-cut sticker edge. '
             'The mascot, flame and sparkle are the official vectors from 124:3 in the same place, so size, position and tilt do not change. Letter a and r keep their official outline everywhere the cut does not reach.</div>'
             '<div class="spec">'
             '<div><b>Gap %s units = 0.8× outline</b>Letters are knocked out along an exact offset of the mascot silhouette. Along the cut, every letter edge is %s ± 0.01 units from the mascot, then it opens out through the rounded ends.%s</div>'
             '<div><b>Cut ends rounded, r = %s</b>Same radius as the letters\' own corners (5–6). Pieces thinner than 10 units are removed, so no slivers or hairlines remain.</div>'
             '<div><b>Rim %s units, inside the silhouette</b>The outer %s of the 2.9-unit ink outline becomes a light holo rim (mint → sky → lilac). The inner 1.45 stays ink, and so do the face and limb lines.</div>'
             '<div><b>Glow built in</b>A soft lilac/sky halo sits behind the head, following the rule “on dark always a glow”. It fades out before the letters, so the gap stays dark.</div>'
             '</div></div>' % (g_chosen, g_chosen, '', RHO, WM, WM))
    # 1 same logo
    h.append('<div class="sec"><h2>1 · Same logo: official light version vs D2, both 900 px wide, with the same guides</h2><div class="row">')
    h.append('<div class="panel paper" style="background:#F6F4EF"><span class="lab">Official · assets/img/logo.svg on paper #F6F4EF</span>%s%s</div>' % (img(OFF, 900), guides_svg('#E0457B')))
    h.append('<div class="panel" style="background:#2C303C"><span class="lab">D2 · on ink #2C303C</span>%s%s</div>' % (img(OUT, 900), guides_svg('#FF6FAE')))
    h.append('</div><div class="sub" style="margin-top:10px">Guides are drawn in logo units: flame tip y 0, head top y 51.5, foot y 214.9, baseline y 262.3, head left x 151.9, paw right x 295.4. '
             'The mascot silhouette, fills, flame and sparkle paths in D2 are the same path data as the official logo.</div></div>')
    # 2 backgrounds x sizes
    h.append('<div class="sec"><h2>2 · Three dark backgrounds × 900 / 300 / 120 / 40 px (actual pixels)</h2>')
    for i, (name, bg) in enumerate(BGS):
        h.append('<div class="row" style="margin-bottom:22px;align-items:stretch"><div class="panel" style="background:%s"><span class="lab">%s · 900 px</span>%s</div>' % (bg, name, img(OUT, 900)))
        h.append('<div style="display:flex;flex-direction:column;gap:14px;width:380px">'
                 '<div class="sizes" style="background:%s;height:215px;justify-content:center;align-items:center"><span class="lab2">300 px</span>%s</div>'
                 '<div class="sizes" style="background:%s;height:125px;justify-content:center;align-items:center"><span class="lab2">120 px · header</span>%s</div>'
                 '<div class="sizes" style="background:%s;height:125px;justify-content:center;align-items:center"><span class="lab2">40 px</span>%s</div></div>'
                 % (bg, img(OUT, 300), bg, img(OUT, 120), bg, img(OUT, 40)))
        h.append('<div class="pix" style="display:flex;flex-direction:column;gap:14px"><div class="sizes" style="background:#0F1016;padding:26px 0 0;height:auto;display:block"><span class="lab2">120 px render, pixels ×4%s</span>'
                 '<canvas data-w="120" data-z="4" data-bg="%s"></canvas></div>'
                 '<div class="sizes" style="background:#0F1016;padding:26px 0 0;height:auto;display:block"><span class="lab2">40 px render, pixels ×8</span><canvas data-w="40" data-z="8" data-bg="%s"></canvas></div></div></div>'
                 % ('' if i < 2 else ' · glow approximated flat', bg if i < 2 else '#2A2440', bg if i < 2 else '#2A2440'))
    h.append('</div>')
    # 3 junction zooms
    h.append('<div class="sec"><h2>3 · Every cut junction at 4× the 900 px size (%.2f px per logo unit)</h2>' % S)
    for bg in ('#1E2029', '#2C303C'):
        h.append('<div class="row" style="margin-bottom:18px">')
        for key, x, y, w, hh, lab in ZOOMS:
            h.append(crop(OUT, x, y, w, hh, S, bg, lab + ' · ' + bg))
        h.append('</div>')
    h.append('<h2 style="margin-top:14px">Gap proof: the dashed pink line is the exact offset of the mascot silhouette at %s units. Every cut letter edge lies on it (8× the 900 px size)</h2><div class="row">' % g_chosen)
    s8 = 8 * 900 / 568
    h.append(crop(OUT, 196, 176, 42, 36, s8, '#1E2029', 'a: bowl top and stem follow the offset line exactly, then round off (r = 5) into the official outline', band_overlay(g_chosen)))
    h.append(crop(OUT, 247, 184, 52, 36, s8, '#1E2029', 'r: stem and arm keep the same gap. The 1-unit neck between them, hidden behind the toe, is removed', band_overlay(g_chosen)))
    h.append('</div></div>')
    # 3b radius comparison
    h.append('<div class="sec"><h2>Cut radius tried on the r (4× the 900 px size, gap 2.32)</h2><div class="row">')
    for src, lab in (('d2-work/D2_g2.32_r2.32.svg', 'r = 2.32 (= gap): a knob on the stem and a hook on the arm, which looks jagged'),
                     ('d2-work/D2_g2.32_r3.5.svg', 'r = 3.5: smaller knob and hook, still visible'),
                     (OUT, 'r = 5 (letters\' own corner radius): clean terminals ✓')):
        h.append(crop(src, 243, 176, 58, 50, S, '#1E2029', lab))
    h.append('</div></div>')
    # 4 gap comparison
    h.append('<div class="sec"><h2>4 · Gap width: 0.5× / 0.8× / 1.1× the official outline (2.9 units). Cut radius 5 in all three</h2><div class="row">')
    for gg, lab in (('1.45', '0.5× = 1.45'), ('2.32', '0.8× = 2.32'), ('3.19', '1.1× = 3.19')):
        src = 'd2-work/D2_g%s.svg' % gg
        cls = ' chosen' if gg == g_chosen else ''
        tag = '<span class="tag">chosen</span>' if gg == g_chosen else ''
        h.append('<div class="%s" style="width:600px"><div class="crop" style="width:600px;height:470px;background:#1E2029">'
                 '<img src="%s" style="left:%dpx;top:%dpx;width:%dpx;height:%dpx"></div>'
                 '<figcaption style="font-size:14px;color:#fff">%s%s</figcaption>'
                 '<div style="display:flex;gap:22px;align-items:flex-end;margin-top:10px;background:#1E2029;padding:14px 16px;border-radius:10px">'
                 '%s%s<canvas class="pxg" data-src="%s" data-w="120" data-z="3"></canvas></div></div>'
                 % (cls, src, -140 * 3.2, -122 * 3.2, 568 * 3.2, 292 * 3.2, lab, tag, img(src, 120), img(src, 40), src))
    h.append('</div><div class="sub" style="margin-top:12px">Top: the mascot zone at 3.2 px/unit (the size of a ~1800 px hero). Bottom: 120 and 40 px at actual size, then the 120 px render magnified 3×.</div></div>')
    h.append("""<script>
function px(c, src, bg){const w=+c.dataset.w,z=+c.dataset.z,h=Math.round(w*292/568);const im=new Image();im.onload=()=>{const o=document.createElement('canvas');o.width=w;o.height=h;const x=o.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,w,h);x.drawImage(im,0,0,w,h);c.width=w*z;c.height=h*z;const y=c.getContext('2d');y.imageSmoothingEnabled=false;y.drawImage(o,0,0,w*z,h*z);};im.src=src;}
document.querySelectorAll('.pix canvas').forEach(c=>px(c,'%s',c.dataset.bg||'#1E2029'));
document.querySelectorAll('canvas.pxg').forEach(c=>px(c,c.dataset.src,'#1E2029'));
</script></body></html>""" % OUT)
    open(os.path.join(V, 'D2-cut-rim-board.html'), 'w').write(''.join(h))

page()
print('ok')
