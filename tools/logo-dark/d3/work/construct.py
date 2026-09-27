"""Construction overlay for the board: D3 letters + mascot on #1E2029 with the silhouette line (pink),
the offset line at the gap (cyan) and the nodes of the new a/r curves (white). -> d3/construct.svg"""
import sys, os, json, re
D = os.path.dirname(os.path.abspath(__file__)); sys.path[:0] = [os.path.join(D, '..'), os.path.join(D, '..', 'lib'), os.path.join(D, '..', '..', 'lib')]
from compose import compose
from parts_src import SIL
from build_variants import GAP, RHO, cut_file
cut = cut_file(GAP, RHO)
svg = compose(cut, glow=False, pre='cx-', bg='<rect x="-10" y="-10" width="600" height="320" fill="#1E2029"/>')
lw = 0.16
ov = ('<defs><mask id="cx-off" maskUnits="userSpaceOnUse" x="-10" y="-10" width="600" height="320"><rect x="-10" y="-10" width="600" height="320" fill="#fff"/>'
      '<path d="{s}" fill="#000" stroke="#000" stroke-width="{i}" stroke-linejoin="round"/></mask></defs>'
      '<path d="{s}" fill="none" stroke="#9AD8F8" stroke-width="{o}" stroke-linejoin="round" mask="url(#cx-off)"/>'
      '<path d="{s}" fill="none" stroke="#F5B8DC" stroke-width="{lw}"/>').format(s=SIL, i=2 * GAP - lw, o=2 * GAP + lw, lw=lw)
for k in ['a', 'r']:
    for m in re.finditer(r'([-\d.]+) ([-\d.]+)(?=[CLZM]|$)', cut[k]):
        ov += '<circle cx="%s" cy="%s" r="0.32" fill="#fff" stroke="#1E2029" stroke-width="0.1"/>' % (m.group(1), m.group(2))
open(os.path.join(D, '..', 'construct.svg'), 'w').write(svg.replace('</svg>', ov + '</svg>'))
print('ok')
