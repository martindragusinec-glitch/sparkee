"""Compose the dark-background Sparkee logo from the separated parts + the knock-out cut geometry.

Layers (bottom -> top):
  glow      soft pastel holo glow behind the mascot + flame (+ a small one behind the sparkle); masked so it never
            touches the mascot itself (the outline band stays a dark knock-out ring) and fades out above the letters.
  letters   mist #F5F4FB; a and r knocked out around the mascot (cut/cut_g*_r*.json).
  mascot    fills unchanged (head holo, face, body, limbs) + flame fills; the ink outline band is knocked out
            (transparent), so fills -> dark ring -> letters reads as ONE clean channel on any dark background.
  sparkle   unchanged holo sparkle.
"""
import sys, os, re, json
HERE = os.path.dirname(os.path.abspath(__file__))            # tools/logo-dark/d3
ROOT = os.path.dirname(HERE)                                  # tools/logo-dark
sys.path.insert(0, os.path.join(HERE, 'lib')); sys.path.insert(0, os.path.join(ROOT, 'lib'))
from parts_src import body, LETTERS, SIL, FLAME_SIL
MIST = '#F5F4FB'; INK = '#2C303C'
SPARK_D = re.search(r' d="([^"]*)"', body('sparkle.svg')[0]).group(1)

def prefixed(fragment, defs, pre):
    ids = set(re.findall(r'id="([^"]+)"', defs))
    for i in sorted(ids, key=len, reverse=True):
        fragment = fragment.replace('url(#%s)' % i, 'url(#%s%s)' % (pre, i)); defs = defs.replace('id="%s"' % i, 'id="%s%s"' % (pre, i))
    return fragment, defs

def strip_ids(fragment):
    return re.sub(r'\s+id="[^"]*"', '', fragment)

def mascot_layers(pre):
    f, fd = body('mascot_fills.svg'); ff, ffd = body('flame_fills.svg'); sp, sd = body('sparkle.svg')
    f, fd = prefixed(strip_ids(f), fd, pre); ff, ffd = prefixed(strip_ids(ff), ffd, pre); sp, sd = prefixed(strip_ids(sp), sd, pre)
    return f, ff, sp, fd + '\n' + ffd + '\n' + sd

def glow_defs(pre, o):
    """Glow = two blurred copies of (silhouette + flame) in the holo gradient (tight + wide), masked so that
    (1) it never covers the mascot itself (outline ring stays dark), (2) it fades out before the x-height of the
    letters, (3) it fades to zero at the viewBox edges (no clipped glow at the top / right)."""
    return ('''<linearGradient id="{p}holo" x1="160" y1="150" x2="290" y2="60" gradientUnits="userSpaceOnUse">
<stop stop-color="#A5EDC5"/><stop offset="0.5" stop-color="#9AD8F8"/><stop offset="1" stop-color="#C49CF2"/></linearGradient>
<linearGradient id="{p}sholo" x1="546" y1="148" x2="546" y2="192" gradientUnits="userSpaceOnUse">
<stop stop-color="#A5EDC5"/><stop offset="0.5" stop-color="#9AD8F8"/><stop offset="1" stop-color="#C49CF2"/></linearGradient>
<filter id="{p}blurA" x="100" y="-60" width="260" height="300" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="{bA}"/></filter>
<filter id="{p}blurB" x="100" y="-60" width="260" height="300" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="{bB}"/></filter>
<filter id="{p}sblur" x="500" y="120" width="90" height="100" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="{sb}"/></filter>
<linearGradient id="{p}fadeY" x1="0" y1="0" x2="0" y2="292" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="{t0}" stop-color="#fff"/><stop offset="{f0}" stop-color="#fff"/><stop offset="{f1}" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="{p}fadeX" x1="500" y1="0" x2="568" y2="0" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="#fff"/><stop offset="{sx0}" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<mask id="{p}glowmask" maskUnits="userSpaceOnUse" x="0" y="0" width="568" height="292">
<rect x="0" y="0" width="568" height="292" fill="url(#{p}fadeY)"/>
<path d="{sil} {flame}" fill="#000"/></mask>
<mask id="{p}sglowmask" maskUnits="userSpaceOnUse" x="500" y="120" width="68" height="100">
<rect x="500" y="120" width="68" height="100" fill="url(#{p}fadeX)"/><path d="{spark}" fill="#000"/>
<path d="{e2}" fill="#000" stroke="#000" stroke-width="{e2pad}" stroke-linejoin="round"/></mask>'''
            ).format(p=pre, bA=o['blurA'], bB=o['blurB'], sb=o['spark_blur'], t0=round(o['top_fade']/292, 4),
                     f0=round(o['fade0']/292, 4), f1=round(o['fade1']/292, 4), sx0=round((o['spark_fade_x']-500)/68, 4),
                     sil=SIL, flame=FLAME_SIL, spark=SPARK_D, e2=LETTERS['e2'], e2pad=2 * o['spark_e_gap'])

def flat_glow_defs(pre, o):
    """Filter-free glow for small sizes: two soft radial gradients (mint lower-left, lilac upper-right) behind the head,
    same containment masks as the blur glow (never over the mascot, fades out above the letters and at the edges)."""
    base = glow_defs(pre, o)
    base = re.sub(r'<filter[\s\S]*?</filter>\n?', '', base)
    return base + ('''
<radialGradient id="{p}rgA" cx="206" cy="118" r="78" gradientUnits="userSpaceOnUse"><stop offset="0.3" stop-color="#A5EDC5" stop-opacity="{a}"/><stop offset="0.55" stop-color="#9AD8F8" stop-opacity="{b}"/><stop offset="0.8" stop-color="#9AD8F8" stop-opacity="{c}"/><stop offset="1" stop-color="#9AD8F8" stop-opacity="0"/></radialGradient>
<radialGradient id="{p}rgB" cx="258" cy="92" r="72" gradientUnits="userSpaceOnUse"><stop offset="0.3" stop-color="#C49CF2" stop-opacity="{a}"/><stop offset="0.55" stop-color="#9AD8F8" stop-opacity="{b}"/><stop offset="0.8" stop-color="#9AD8F8" stop-opacity="{c}"/><stop offset="1" stop-color="#9AD8F8" stop-opacity="0"/></radialGradient>
<radialGradient id="{p}rgS" cx="546" cy="170" r="24" gradientUnits="userSpaceOnUse"><stop stop-color="#9AD8F8" stop-opacity="{sa}"/><stop offset="1" stop-color="#C49CF2" stop-opacity="0"/></radialGradient>''').format(
        p=pre, a=o.get('flat_a', 0.30), b=o.get('flat_b', 0.15), c=o.get('flat_c', 0.045), sa=o.get('flat_s', 0.32))

def compose(cut, glow=True, pre='sd-', o=None, bg=None, title='Sparkee', vb='0 0 568 292', size=None, band='knockout'):
    o = dict(dict(blurA=4, opA=0.38, blurB=14, opB=0.55, top_fade=26, fade0=140, fade1=184, spark_blur=3.5, spark_opacity=0.5,
                  spark_fade_x=552, spark_e_gap=4), **(o or {}))
    f, ff, sp, mdefs = mascot_layers(pre)
    letters = dict(LETTERS); letters['a'] = cut['a']; letters['r'] = cut['r']
    defs = mdefs
    if glow == 'flat': defs = flat_glow_defs(pre, o) + '\n' + defs
    elif glow: defs = glow_defs(pre, o) + '\n' + defs
    attrs = 'viewBox="%s"' % vb + (' width="%d" height="%d"' % size if size else '')
    s = ['<svg %s role="img" aria-label="%s" fill="none" xmlns="http://www.w3.org/2000/svg">' % (attrs, title)]
    s.append('<title>%s</title>' % title)
    s.append('<defs>\n%s\n</defs>' % defs)
    if bg: s.append(bg)
    if glow == 'flat':
        s.append('<g id="glow" mask="url(#%sglowmask)">' % pre)
        s.append('<ellipse cx="206" cy="118" rx="78" ry="74" fill="url(#%srgA)"/>' % pre)
        s.append('<ellipse cx="258" cy="92" rx="72" ry="70" fill="url(#%srgB)"/>' % pre)
        s.append('</g>')
        s.append('<g id="sparkle-glow" mask="url(#%ssglowmask)"><circle cx="546" cy="170" r="24" fill="url(#%srgS)"/></g>' % (pre, pre))
    elif glow:
        s.append('<g id="glow" mask="url(#%sglowmask)">' % pre)
        s.append('<path d="%s %s" fill="url(#%sholo)" opacity="%s" filter="url(#%sblurB)"/>' % (SIL, FLAME_SIL, pre, o['opB'], pre))
        s.append('<path d="%s %s" fill="url(#%sholo)" opacity="%s" filter="url(#%sblurA)"/>' % (SIL, FLAME_SIL, pre, o['opA'], pre))
        s.append('</g>')
        s.append('<g id="sparkle-glow" mask="url(#%ssglowmask)"><path d="%s" fill="url(#%ssholo)" opacity="%s" filter="url(#%ssblur)"/></g>'
                 % (pre, SPARK_D, pre, o['spark_opacity'], pre))
    s.append('<g id="wordmark" fill="%s">' % MIST)
    for k in ['s', 'p', 'a', 'r', 'k', 'e1', 'e2']:
        s.append('<path id="letter-%s" d="%s"/>' % (k, letters[k]))
    s.append('</g>')
    if band == 'ink':
        s.append('<path d="%s" fill="%s"/><path d="%s" fill="%s"/>' % (SIL, INK, FLAME_SIL, INK))
    s.append('<g id="mascot">\n%s\n%s\n</g>' % (ff, f))
    s.append('<g id="sparkle">%s</g>' % sp)
    s.append('</svg>')
    return '\n'.join(s)

if __name__ == '__main__':
    cutf = sys.argv[1]; out = sys.argv[2]; mode = sys.argv[3] if len(sys.argv) > 3 else 'glow'
    glow = {'glow': True, 'flat': 'flat', 'none': False}[mode]
    cut = json.load(open(cutf))
    open(out, 'w').write(compose(cut, glow=glow))
    print('wrote', out)
