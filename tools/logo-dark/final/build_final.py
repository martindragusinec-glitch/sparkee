"""Final dark-background Sparkee logo (winner D3 "cut + glow" with the judges' tweaks).

  assets/img/logo-dark.svg          master: knock-out cut + soft two-layer holo glow (feGaussianBlur)  -> 300 px wide and up
  assets/img/logo-dark-flat.svg     same geometry, filter-free radial glow                             -> 120 px wide and below
  assets/img/logo-dark-onglow.svg   same as master, but the mascot keeps its official ink contour      -> over a lit / bright glow
                                    (video end card), where a knocked-out contour would take the glow colour
  assets/img/logo-dark@2x.png       1136 x 584 transparent PNG of the master (rendered by render_png.py)

Geometry (same coordinates as assets/img/logo.svg = Figma 124:3, viewBox 0 0 568 292):
  letters mist #F5F4FB; only a + r are cut: letter minus (mascot silhouette grown by GAP), then a morphological opening
  with radius RHO (every cut end gets a round terminal of radius RHO on the letter side only; the concave cut itself
  stays exactly on the offset, so the channel width is constant; pieces thinner than 2*RHO would vanish - none do).
  The original Bezier outline of a and r is kept verbatim wherever the cut does not reach (d3/lib/splice.py).
  Mascot fills, face, flame and sparkle are the official paths, byte-identical, no transforms.

Judges' tweaks applied (vs variants/D3-cut-glow.svg):
  1. cut-end radius 2.9 -> 5.0 (the letters' own terminal radius, ~5-6): no knob / ear / chamfer on the r and a.
  3. glow mask is 0 until y=8 and eases in to y=40: no flat clip line of the blur at the viewBox top above the flame.
  4. flat file: sparkle halo is a faint mint -> sky tint instead of the grey-lilac disc.
  5. inner glow layer 0.38 -> 0.28 so the teal halo at the head reads as backlight, not as a second rim.
  2. extra on-glow file with the official ink contour (for lit glow backgrounds / video end cards).

usage: python3 tools/logo-dark/final/build_final.py [--no-assets]   (builds the cut with d3/build_cut.py if missing)
"""
import sys, os, re, json, math, subprocess, shutil
HERE = os.path.dirname(os.path.abspath(__file__))               # tools/logo-dark/final
ROOT = os.path.dirname(HERE)                                     # tools/logo-dark
SITE = os.path.abspath(os.path.join(ROOT, '..', '..'))           # sparkee-web
D3 = os.path.join(ROOT, 'd3')
sys.path.insert(0, D3); sys.path.insert(0, os.path.join(D3, 'lib')); sys.path.insert(0, os.path.join(ROOT, 'lib'))
from parts_src import body, LETTERS, SIL, FLAME_SIL
from geom import dense
from splice import signed_area
from logo_src import path_d

GAP, RHO, RES = 1.45, 5.0, 0.02
MIST, INK = '#F5F4FB', '#2C303C'
OUT_DIR = os.path.join(HERE, 'out')
SPARK_D = re.search(r' d="([^"]*)"', body('sparkle.svg')[0]).group(1)
GLOW = dict(blurA=4, opA=0.28, blurB=14, opB=0.55, fade0=140, fade1=184, spark_blur=3.5, spark_opacity=0.5,
            spark_fade_x=552, spark_e_gap=4)
# top of the glow mask: 0 up to y=8, smoothstep to 1 at y=40 (no hard clip at the viewBox top above the flame)
TOP_FADE = [(0, 0), (8, 0), (16, 0.16), (24, 0.5), (32, 0.84), (40, 1)]


def cut_file(g=GAP, rho=RHO):
    f = os.path.join(D3, 'cut', 'cut_g%.2f_r%.2f.json' % (g, rho))
    if not os.path.exists(f):
        subprocess.run([sys.executable, os.path.join(D3, 'build_cut.py'), str(g), str(rho), str(RES)], check=True, stdout=subprocess.DEVNULL)
    return json.load(open(f))


def prefixed(fragment, defs, pre):
    ids = set(re.findall(r'id="([^"]+)"', defs))
    for i in sorted(ids, key=len, reverse=True):
        fragment = fragment.replace('url(#%s)' % i, 'url(#%s%s)' % (pre, i)); defs = defs.replace('id="%s"' % i, 'id="%s%s"' % (pre, i))
    return fragment, defs


def strip_ids(fragment):
    return re.sub(r'\s+id="[^"]*"', '', fragment)


def tight(s):
    """Whitespace between tags only; path data and attribute values untouched."""
    s = re.sub(r'>\s+<', '><', s.strip())
    return s


def mascot_layers(pre):
    f, fd = body('mascot_fills.svg'); ff, ffd = body('flame_fills.svg'); sp, sd = body('sparkle.svg')
    f, fd = prefixed(strip_ids(f), fd, pre); ff, ffd = prefixed(strip_ids(ff), ffd, pre); sp, sd = prefixed(strip_ids(sp), sd, pre)
    return tight(f), tight(ff), tight(sp), tight(fd + ffd + sd)


def fade_y(pre):
    o = GLOW
    stops = ''.join('<stop offset="%s" stop-color="#fff" stop-opacity="%s"/>' % (round(y / 292, 4), a) for y, a in TOP_FADE)
    stops += '<stop offset="%s" stop-color="#fff"/><stop offset="%s" stop-color="#fff" stop-opacity="0"/>' % (round(o['fade0'] / 292, 4), round(o['fade1'] / 292, 4))
    return '<linearGradient id="%sfadeY" x1="0" y1="0" x2="0" y2="292" gradientUnits="userSpaceOnUse">%s</linearGradient>' % (pre, stops)


def masks(pre):
    o = GLOW
    return (fade_y(pre) +
            '<linearGradient id="{p}fadeX" x1="500" y1="0" x2="568" y2="0" gradientUnits="userSpaceOnUse"><stop stop-color="#fff"/>'
            '<stop offset="{sx0}" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>'
            '<mask id="{p}glowmask" maskUnits="userSpaceOnUse" x="0" y="0" width="568" height="292">'
            '<rect width="568" height="292" fill="url(#{p}fadeY)"/><path d="{sil} {flame}" fill="#000"/></mask>'
            '<mask id="{p}sglowmask" maskUnits="userSpaceOnUse" x="500" y="120" width="68" height="100">'
            '<rect x="500" y="120" width="68" height="100" fill="url(#{p}fadeX)"/><path d="{spark}" fill="#000"/>'
            '<path d="{e2}" fill="#000" stroke="#000" stroke-width="{e2pad}" stroke-linejoin="round"/></mask>').format(
        p=pre, sx0=round((o['spark_fade_x'] - 500) / 68, 4), sil=SIL, flame=FLAME_SIL, spark=SPARK_D, e2=LETTERS['e2'], e2pad=2 * o['spark_e_gap'])


def blur_glow(pre):
    o = GLOW
    defs = ('<linearGradient id="{p}holo" x1="160" y1="150" x2="290" y2="60" gradientUnits="userSpaceOnUse"><stop stop-color="#A5EDC5"/>'
            '<stop offset="0.5" stop-color="#9AD8F8"/><stop offset="1" stop-color="#C49CF2"/></linearGradient>'
            '<linearGradient id="{p}sholo" x1="546" y1="148" x2="546" y2="192" gradientUnits="userSpaceOnUse"><stop stop-color="#A5EDC5"/>'
            '<stop offset="0.5" stop-color="#9AD8F8"/><stop offset="1" stop-color="#C49CF2"/></linearGradient>'
            '<filter id="{p}blurA" x="100" y="-60" width="260" height="300" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="{bA}"/></filter>'
            '<filter id="{p}blurB" x="100" y="-60" width="260" height="300" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="{bB}"/></filter>'
            '<filter id="{p}sblur" x="500" y="120" width="90" height="100" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="{sb}"/></filter>'
            ).format(p=pre, bA=o['blurA'], bB=o['blurB'], sb=o['spark_blur']) + masks(pre)
    body_ = ('<g id="glow" mask="url(#{p}glowmask)">'
             '<path d="{sil} {flame}" fill="url(#{p}holo)" opacity="{oB}" filter="url(#{p}blurB)"/>'
             '<path d="{sil} {flame}" fill="url(#{p}holo)" opacity="{oA}" filter="url(#{p}blurA)"/></g>'
             '<g id="sparkle-glow" mask="url(#{p}sglowmask)"><path d="{spark}" fill="url(#{p}sholo)" opacity="{so}" filter="url(#{p}sblur)"/></g>'
             ).format(p=pre, sil=SIL, flame=FLAME_SIL, oA=o['opA'], oB=o['opB'], spark=SPARK_D, so=o['spark_opacity'])
    return defs, body_


def flat_glow(pre):
    defs = ('<radialGradient id="{p}rgA" cx="206" cy="118" r="78" gradientUnits="userSpaceOnUse"><stop offset="0.3" stop-color="#A5EDC5" stop-opacity="0.3"/>'
            '<stop offset="0.55" stop-color="#9AD8F8" stop-opacity="0.15"/><stop offset="0.8" stop-color="#9AD8F8" stop-opacity="0.045"/><stop offset="1" stop-color="#9AD8F8" stop-opacity="0"/></radialGradient>'
            '<radialGradient id="{p}rgB" cx="258" cy="92" r="72" gradientUnits="userSpaceOnUse"><stop offset="0.3" stop-color="#C49CF2" stop-opacity="0.3"/>'
            '<stop offset="0.55" stop-color="#9AD8F8" stop-opacity="0.15"/><stop offset="0.8" stop-color="#9AD8F8" stop-opacity="0.045"/><stop offset="1" stop-color="#9AD8F8" stop-opacity="0"/></radialGradient>'
            # sparkle halo: faint mint core -> sky -> 0 (was a sky->lilac disc that read grey at small sizes)
            '<radialGradient id="{p}rgS" cx="546" cy="170" r="22" gradientUnits="userSpaceOnUse"><stop offset="0.35" stop-color="#A5EDC5" stop-opacity="0.22"/>'
            '<stop offset="0.7" stop-color="#9AD8F8" stop-opacity="0.08"/><stop offset="1" stop-color="#9AD8F8" stop-opacity="0"/></radialGradient>'
            ).format(p=pre) + masks(pre)
    body_ = ('<g id="glow" mask="url(#{p}glowmask)"><ellipse cx="206" cy="118" rx="78" ry="74" fill="url(#{p}rgA)"/>'
             '<ellipse cx="258" cy="92" rx="72" ry="70" fill="url(#{p}rgB)"/></g>'
             '<g id="sparkle-glow" mask="url(#{p}sglowmask)"><circle cx="546" cy="170" r="22" fill="url(#{p}rgS)"/></g>').format(p=pre)
    return defs, body_


HEADER = {
    'glow': 'Sparkee logo on dark backgrounds (master, 300 px wide and up). Same coordinates as logo.svg (Figma 124:3). '
            'Letters mist #F5F4FB, a + r knocked out around the mascot: even gap 1.45 beyond the mascot silhouette, cut ends rounded r=5. '
            'Mascot, face, flame and sparkle unchanged; its ink outline is knocked out (shows the background). Contained holo glow (blur). '
            'Built by tools/logo-dark/final/build_final.py - do not edit by hand.',
    'flat': 'Sparkee logo on dark backgrounds, small sizes (120 px wide and below): same geometry as logo-dark.svg, filter-free radial glow. '
            'Built by tools/logo-dark/final/build_final.py - do not edit by hand.',
    'onglow': 'Sparkee logo on a lit / bright glow background (video end card): logo-dark.svg, but the mascot keeps its official ink #2C303C contour. '
              'Built by tools/logo-dark/final/build_final.py - do not edit by hand.',
}


def compose(cut, mode='glow', pre='sd-', bg=None, vb='0 0 568 292', size=None, comment=True, title='Sparkee'):
    f, ff, sp, mdefs = mascot_layers(pre)
    letters = dict(LETTERS); letters['a'] = cut['a']; letters['r'] = cut['r']
    gdefs, gbody = flat_glow(pre) if mode == 'flat' else blur_glow(pre)
    attrs = 'viewBox="%s"' % vb + (' width="%s" height="%s"' % size if size else '')
    s = ['<svg %s fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="%s">' % (attrs, title)]
    if comment: s.append('<!-- %s -->' % HEADER[mode])
    s.append('<title>%s</title>' % title)
    s.append('<defs>%s%s</defs>' % (gdefs, mdefs))
    if bg: s.append(bg)
    s.append(gbody)
    s.append('<g id="wordmark" fill="%s">%s</g>' % (MIST, ''.join('<path id="letter-%s" d="%s"/>' % (k, letters[k]) for k in ['s', 'p', 'a', 'r', 'k', 'e1', 'e2'])))
    if mode == 'onglow':
        s.append('<path id="contour" d="%s %s" fill="%s"/>' % (SIL, FLAME_SIL, INK))
    s.append('<g id="mascot">%s%s</g>' % (ff, f))
    s.append('<g id="sparkle">%s</g>' % sp)
    s.append('</svg>')
    return '\n'.join(s) + '\n'


# ---------------- checks ----------------
def checks(cut, files):
    sys.path.insert(0, D3)
    import build_variants as bv                       # reuse the D3 geometry verification (gap, subset, pieces)
    rep = {'gap': GAP, 'rho': RHO}
    Sx = bv.SegIndex(dense(SIL, 0.05))
    Fx = bv.SegIndex(json.load(open(os.path.join(ROOT, 'data', 'fillpolys.json'))))
    for k in ['a', 'r']:
        O = bv.SegIndex(dense(LETTERS[k], 0.05))
        pts = [p for poly in dense(cut[k], 0.05) for p in poly]
        dS, cut_d, chan, outside = [], [], [], 0
        for p in pts:
            d = Sx.dist(p, R=10); ins = Sx.inside(p)
            dS.append(-d if ins else d)
            if O.dist(p, R=2) > 0.01 and not O.inside(p): outside += 1
            if d < GAP + 0.25 and not ins:
                cut_d.append(d); chan.append(Fx.dist(p, R=12))
        cut_d.sort(); chan.sort()
        q = lambda a, fr: round(a[min(len(a) - 1, int(fr * len(a)))], 3) if a else None
        polys = dense(cut[k], 0.05)
        # thinnest part of each piece: min over interior grid of 2x distance to the boundary is heavy; use the opening
        # guarantee instead (every piece is a union of discs of radius RHO) and report areas
        rep[k] = {'min_signed_dist_to_silhouette': round(min(dS), 3),
                  'cut_edge_dist_to_silhouette': {'min': q(cut_d, 0), 'p05': q(cut_d, .05), 'median': q(cut_d, .5), 'p95': q(cut_d, .95)},
                  'visible_channel_fill_to_letter': {'min': q(chan, 0), 'p05': q(chan, .05), 'median': q(chan, .5), 'p95': q(chan, .95)},
                  'points_outside_official_letter': outside,
                  'pieces_area': sorted([round(abs(signed_area(pl)), 1) for pl in polys], reverse=True),
                  'islands_removed': cut['report'][k]['islands_removed']}
    rep['unchanged_letters_s_p_k_e_e'] = all(LETTERS[k] == path_d(pid) for k, pid in
                                             [('s', 'Vector_2'), ('p', 'Subtract'), ('k', 'Vector'), ('e1', 'Letter e1'), ('e2', 'Letter e2')])
    src_d = re.findall(r' d="([^"]+)"', body('mascot_fills.svg')[0]) + re.findall(r' d="([^"]+)"', body('flame_fills.svg')[0]) + [SPARK_D]
    for name, path in files.items():
        s = open(path).read()
        rep[name] = {'bytes': len(s.encode()), 'official_mascot_flame_sparkle_paths_identical': all(d in s for d in src_d),
                     'paths_checked': len(src_d),
                     'external_refs': re.findall(r'(?:href|src)="(?!#)[^"]+"', s) + re.findall(r'url\((?!#)[^)]+\)', s),
                     'transforms': len(re.findall(r'\btransform="', s)),
                     'dangling_url_refs': sorted(set(re.findall(r'url\(#([^)]+)\)', s)) - set(re.findall(r'id="([^"]+)"', s)))}
    return rep


if __name__ == '__main__':
    cut = cut_file()
    os.makedirs(OUT_DIR, exist_ok=True)
    files = {}
    for mode, name, pre in [('glow', 'logo-dark.svg', 'ld-'), ('flat', 'logo-dark-flat.svg', 'ldf-'), ('onglow', 'logo-dark-onglow.svg', 'ldg-')]:
        p = os.path.join(OUT_DIR, name)
        open(p, 'w').write(compose(cut, mode, pre))
        files[name] = p
    rep = checks(cut, files)
    json.dump(rep, open(os.path.join(HERE, 'checks.json'), 'w'), indent=1)
    print(json.dumps(rep, indent=1))
    if '--no-assets' not in sys.argv:
        for name, p in files.items():
            for d in ['assets/img', 'assets/figma']:
                shutil.copyfile(p, os.path.join(SITE, d, name))
        print('copied to assets/img and assets/figma')
