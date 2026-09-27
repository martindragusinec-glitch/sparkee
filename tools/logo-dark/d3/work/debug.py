"""Debug zoom: cut letters + mascot fills on dark, with overlays. usage: debug.py cut.json out.svg x y w h scale"""
import sys, os, json
D = os.path.dirname(os.path.abspath(__file__)); sys.path[:0] = [os.path.join(D, '..'), os.path.join(D, '..', 'lib'), os.path.join(D, '..', '..', 'lib')]
from compose import compose
from parts_src import LETTERS, SIL
cut = json.load(open(sys.argv[1])); out = sys.argv[2]; x, y, w, h, sc = map(float, sys.argv[3:8])
overlay = sys.argv[8] if len(sys.argv) > 8 else 'on'
svg = compose(cut, glow=False, vb='%g %g %g %g' % (x, y, w, h), size=(int(w*sc), int(h*sc)), bg='<rect x="-50" y="-50" width="700" height="400" fill="#1E2029"/>')
ov = ''
if overlay == 'on':
    lw = 1.2 / sc
    ov += '<path d="%s" fill="none" stroke="#ff4d6d" stroke-width="%g"/>' % (SIL, lw)
    for k in ['a', 'r']:
        ov += '<path d="%s" fill="none" stroke="#35c2ff" stroke-width="%g" stroke-dasharray="%g %g"/>' % (LETTERS[k], lw, 4/sc, 3/sc)
        for loop in cut['raw'][k]['X']:
            ov += '<polyline points="%s" fill="none" stroke="#ffd166" stroke-width="%g" opacity="0.8"/>' % (' '.join('%.3f,%.3f' % tuple(p) for p in loop[::2]), lw)
    # nodes of the new a, r paths
    import re
    for k in ['a', 'r']:
        for m in re.finditer(r'([-\d.]+) ([-\d.]+)(?=[CLZM]|$)', cut[k]):
            ov += '<circle cx="%s" cy="%s" r="%g" fill="#00e0a0"/>' % (m.group(1), m.group(2), 2.2/sc)
svg = svg.replace('</svg>', ov + '</svg>')
open(out, 'w').write(svg)
