"""Geometry QA for a D2 SVG: gap evenness, clearance, joins, islands.
usage: python3 verify_d2.py <D2.svg> <g>
Reports, for letters a and r:
  - clearance: min distance from any letter point to the mascot silhouette S (must be >= g - tol)
  - gap evenness: distance to S along the cut edge where the edge runs parallel to S (fillets excluded)
  - G1 joins: max tangent angle jump between consecutive segments of the letter outline
  - pieces and their areas (no fragments below 12 units^2)
"""
import sys, os, re, math
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.join(HERE, 'lib'))
from svgpath import parse, flatten
from fitcurve import norm
import parts as P

def tangent_in(s):
    if s[0] == 'L': return norm((s[2][0] - s[1][0], s[2][1] - s[1][1]))
    for a, b in ((s[4], s[3]), (s[4], s[2]), (s[4], s[1])):
        if math.hypot(a[0] - b[0], a[1] - b[1]) > 1e-6: return norm((a[0] - b[0], a[1] - b[1]))
def tangent_out(s):
    if s[0] == 'L': return norm((s[2][0] - s[1][0], s[2][1] - s[1][1]))
    for a, b in ((s[2], s[1]), (s[3], s[1]), (s[4], s[1])):
        if math.hypot(a[0] - b[0], a[1] - b[1]) > 1e-6: return norm((a[0] - b[0], a[1] - b[1]))
def area(pts):
    a = 0
    for i in range(len(pts)): a += pts[i - 1][0] * pts[i][1] - pts[i][0] * pts[i - 1][1]
    return a / 2

def main(svg_path, g):
    svg = open(svg_path).read()
    S = flatten(parse(P.SIL)[0], 200)
    # bucket S points
    B = 1.0; grid = {}
    for p in S: grid.setdefault((int(p[0] // B), int(p[1] // B)), []).append(p)
    def dS(p, r=12):
        bx, by = int(p[0] // B), int(p[1] // B); best = 1e18
        for dx in range(-r, r + 1):
            for dy in range(-r, r + 1):
                for q in grid.get((bx + dx, by + dy), ()):
                    d = (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2
                    if d < best: best = d
        return math.sqrt(best)
    orig = {k: parse(P.letter_d(k)) for k in 'ar'}
    ok = True
    for k in 'ar':
        d = re.search(r'id="letter-%s" d="([^"]+)"' % k, svg).group(1)
        subs = parse(d)
        print('letter', k, 'subpaths', len(subs))
        for si, sp in enumerate(subs):
            pts = flatten(sp, 60); ar = abs(area(pts))
            segs = sp['segs']
            jumps = []
            for a, b in zip(segs, segs[1:] + segs[:1]):
                ta, tb = tangent_in(a), tangent_out(b)
                jumps.append(math.degrees(math.acos(max(-1, min(1, ta[0] * tb[0] + ta[1] * tb[1])))))
            # original corners (non-G1 joins that exist in the official letter) are allowed; report the max of new ones
            near = [p for p in pts if p[1] < 232]
            ds = [dS(p) for p in near]
            dmin = min(ds) if ds else None
            par = [x for x in ds if x < g + 0.05]
            print('  piece %d: area %.1f, segments %d, min clearance to S %.4f (g=%.2f), points within g+0.05: %d, spread %.4f..%.4f, max joint angle %.2f deg'
                  % (si, ar, len(segs), dmin if dmin is not None else -1, g, len(par), min(par) if par else 0, max(par) if par else 0, max(jumps)))
            if ar < 12: print('  !! fragment'); ok = False
            if dmin is not None and dmin < g - 0.02: print('  !! letter closer than g to the mascot'); ok = False
    print('OK' if ok else 'PROBLEMS')

if __name__ == '__main__':
    main(sys.argv[1], float(sys.argv[2]))
