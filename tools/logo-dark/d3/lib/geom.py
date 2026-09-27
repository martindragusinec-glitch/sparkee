"""Small geometry helpers: dense flattening (lines too), point/segment distance."""
import math
from svgpath import parse, bez
def dense(d, step=0.1):
    """Flatten path data to closed polylines with ~step spacing (curves and lines)."""
    out = []
    for sp in parse(d):
        pts = [sp['start']]
        for s in sp['segs']:
            if s[0] == 'L':
                a, b = s[1], s[2]; n = max(1, int(math.hypot(b[0]-a[0], b[1]-a[1]) / step))
                pts += [(a[0]+(b[0]-a[0])*k/n, a[1]+(b[1]-a[1])*k/n) for k in range(1, n+1)]
            else:
                L = sum(math.hypot(*(q-p for p, q in zip(bez(*s[1:], k/16), bez(*s[1:], (k+1)/16)))) for k in range(16))
                n = max(2, int(L / step))
                pts += [bez(*s[1:], k/n) for k in range(1, n+1)]
        if math.hypot(pts[0][0]-pts[-1][0], pts[0][1]-pts[-1][1]) < 1e-9: pts.pop()
        out.append(pts)
    return out
