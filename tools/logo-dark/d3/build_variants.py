"""Build the dark-background logo variants (D3: cut + glow) and verify the geometry.

  variants/D3-cut-glow.svg     knock-out cut (gap 0.5x outline) + soft two-layer holo glow (blur)   -> 300 px and up
  variants/D3-logo-dark-flat.svg  same geometry, filter-free radial glow                              -> 120 px and below
  variants/D3-gaps/D3-gap-*.svg   the three trial gaps (0.5x, 0.8x, 1.1x of the 2.9 outline) for the board
  variants/D3-checks.json      numeric verification (gap, subset of the official letters, pieces, unchanged parts)

usage: python3 build_variants.py            (runs build_cut.py for missing cut files)
"""
import sys, os, json, math, re, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))            # tools/logo-dark/d3
ROOT = os.path.dirname(HERE)                                  # tools/logo-dark
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(HERE, 'lib')); sys.path.insert(0, os.path.join(ROOT, 'lib'))
from compose import compose
from parts_src import LETTERS, SIL, body
from geom import dense
from splice import signed_area
from logo_src import S as LOGO_SRC, path_d

OUTLINE = 2.9                 # official outline band width (median, measured in the previous step)
GAP = round(0.5 * OUTLINE, 2)  # chosen gap: 1.45
RHO = OUTLINE                 # cut-end rounding radius (= one outline width; min feature 2*RHO = 5.8)
RES = 0.02
TRIALS = [(round(0.5 * OUTLINE, 2), RHO), (round(0.8 * OUTLINE, 2), RHO), (round(1.1 * OUTLINE, 2), RHO)]
VAR = os.path.join(ROOT, 'variants'); GAPS = os.path.join(VAR, 'D3-gaps'); os.makedirs(GAPS, exist_ok=True)

def cut_file(g, rho):
    f = os.path.join(HERE, 'cut', 'cut_g%.2f_r%.2f.json' % (g, rho))
    if not os.path.exists(f):
        subprocess.run([sys.executable, os.path.join(HERE, 'build_cut.py'), str(g), str(rho), str(RES)], check=True, stdout=subprocess.DEVNULL)
    return json.load(open(f))

HEADER = ('<!-- Sparkee logo, dark-background variant %s. Same coordinates as assets/img/logo.svg (Figma 124:3).\n'
          '     Letters mist #F5F4FB; a + r knocked out around the mascot: gap %.2f beyond the mascot silhouette\n'
          '     (0.5x the 2.9 outline), cut ends rounded r=%.1f. Mascot fills, face, flame and sparkle unchanged; the ink\n'
          '     outline band is knocked out so fills -> dark ring -> letters is one clean channel on any dark background.\n'
          '     %s -->\n')

def build():
    cut = cut_file(GAP, RHO)
    d3 = compose(cut, glow=True, pre='sd-', title='Sparkee')
    d3 = d3.replace('\n', '\n' + HEADER % ('D3 cut + glow', GAP, RHO, 'Glow: two blurred holo layers, contained (never over the mascot, fades out above the letters and at the edges). Use at 300 px wide and up; use D3-logo-dark-flat.svg at 120 px and below.'), 1)
    open(os.path.join(VAR, 'D3-cut-glow.svg'), 'w').write(d3)
    flat = compose(cut, glow='flat', pre='sdf-', title='Sparkee')
    flat = flat.replace('\n', '\n' + HEADER % ('flat (no blur)', GAP, RHO, 'Glow: filter-free radial gradients. For 120 px wide and below (header, avatars, favicons-ish).'), 1)
    open(os.path.join(VAR, 'D3-logo-dark-flat.svg'), 'w').write(flat)
    for g, rho in TRIALS:
        c = cut_file(g, rho)
        tag = {1.45: '0.5x', 2.32: '0.8x', 3.19: '1.1x'}[g]
        open(os.path.join(GAPS, 'D3-gap-%s.svg' % tag), 'w').write(compose(c, glow=True, pre='g%s-' % tag.replace('.', ''), title='Sparkee gap %s' % tag))
        open(os.path.join(GAPS, 'D3-flat-gap-%s.svg' % tag), 'w').write(compose(c, glow='flat', pre='f%s-' % tag.replace('.', ''), title='Sparkee gap %s' % tag))
    return cut

# ---------------- verification ----------------
class SegIndex:
    def __init__(self, polys, B=1.0):
        self.B = B; self.grid = {}; self.polys = polys
        for poly in polys:
            n = len(poly)
            for i in range(n):
                a, b = poly[i], poly[(i + 1) % n]
                for gx in range(int(min(a[0], b[0]) // B), int(max(a[0], b[0]) // B) + 1):
                    for gy in range(int(min(a[1], b[1]) // B), int(max(a[1], b[1]) // B) + 1):
                        self.grid.setdefault((gx, gy), []).append((a, b))
    def dist(self, p, R=8):
        bx, by = int(p[0] // self.B), int(p[1] // self.B); best = 1e18
        for gx in range(bx - R, bx + R + 1):
            for gy in range(by - R, by + R + 1):
                for a, b in self.grid.get((gx, gy), ()):
                    dx, dy = b[0] - a[0], b[1] - a[1]; L = dx * dx + dy * dy
                    u = max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L)) if L else 0
                    qx, qy = a[0] + u * dx - p[0], a[1] + u * dy - p[1]; d = qx * qx + qy * qy
                    if d < best: best = d
        return math.sqrt(best)
    def inside(self, p):  # even-odd
        c = False
        for poly in self.polys:
            n = len(poly)
            for i in range(n):
                a, b = poly[i], poly[i - 1]
                if (a[1] > p[1]) != (b[1] > p[1]) and p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]: c = not c
        return c

def verify(cut, g=GAP, rho=RHO):
    rep = {'gap_target': g, 'rho': rho}
    Sx = SegIndex(dense(SIL, 0.05))
    fills = json.load(open(os.path.join(ROOT, 'data', 'fillpolys.json')))
    Fx = SegIndex(fills)
    for k in ['a', 'r']:
        O = SegIndex(dense(LETTERS[k], 0.05))
        pts = [p for poly in dense(cut[k], 0.05) for p in poly]
        dS = []; outside_orig = 0; cut_d = []; chan = []; chan_on = []
        for p in pts:
            d = Sx.dist(p, R=10)
            ins = Sx.inside(p)
            dS.append(-d if ins else d)
            if O.dist(p, R=2) > 0.01 and not O.inside(p): outside_orig += 1
            if d < g + 0.25 and not ins:           # point on the cut (offset) part of the outline
                cut_d.append(d); chan.append(Fx.dist(p, R=12))
                if abs(d - g) < 0.02: chan_on.append(chan[-1])   # strictly on the offset (excludes rounded ends)
        pieces = [round(abs(signed_area(poly)), 1) for poly in dense(cut[k], 0.1)]
        cut_d.sort(); chan.sort(); chan_on.sort()
        q = lambda a, f: round(a[min(len(a) - 1, int(f * len(a)))], 3) if a else None
        rep[k] = {'samples': len(pts), 'min_signed_dist_to_silhouette': round(min(dS), 3),
                  'cut_edge_dist_to_silhouette': {'min': q(cut_d, 0), 'p05': q(cut_d, .05), 'median': q(cut_d, .5), 'p95': q(cut_d, .95), 'n': len(cut_d)},
                  'visible_channel_fill_to_letter': {'min': q(chan, 0), 'p05': q(chan, .05), 'median': q(chan, .5), 'p95': q(chan, .95)},
                  'visible_channel_on_offset_only': {'min': q(chan_on, 0), 'p05': q(chan_on, .05), 'median': q(chan_on, .5), 'p95': q(chan_on, .95), 'max': q(chan_on, 1)},
                  'points_outside_official_letter': outside_orig, 'pieces_area': pieces,
                  'islands_removed': cut['report'][k]['islands_removed']}
    # unchanged parts
    rep['unchanged_letters_s_p_k_e_e'] = all(LETTERS[k] == path_d(pid) for k, pid in
                                             [('s', 'Vector_2'), ('p', 'Subtract'), ('k', 'Vector'), ('e1', 'Letter e1'), ('e2', 'Letter e2')])
    src_d = re.findall(r' d="([^"]+)"', body('mascot_fills.svg')[0])
    d3 = open(os.path.join(VAR, 'D3-cut-glow.svg')).read()
    rep['mascot_fill_paths_identical'] = all(d in d3 for d in src_d) and len(src_d) > 0
    rep['mascot_fill_path_count'] = len(src_d)
    rep['external_refs'] = re.findall(r'(?:href|src)="(?!#)[^"]+"', d3) + re.findall(r'url\((?!#)[^)]+\)', d3)
    return rep

if __name__ == '__main__':
    cut = build()
    rep = verify(cut)
    pf = os.path.join(HERE, 'work', 'proof', 'proof.json')   # written by work/proof.py (needs a Chrome render)
    if os.path.exists(pf): rep['pixel_proof_900px_mascot_interior_vs_official'] = json.load(open(pf))
    json.dump(rep, open(os.path.join(VAR, 'D3-checks.json'), 'w'), indent=1)
    print(json.dumps(rep, indent=1))
