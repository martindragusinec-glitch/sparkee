"""Build separated geometry for the Sparkee logo (124:3) in logo.svg coordinates (viewBox 0 0 568 292).
S  = mascot silhouette: exact free outline contour of 'Mascot outline + ar' + fitted curves in the two fused zones
     (fills dilated by t=2.9 = measured band width, then morphologically closed with r=5 to round concave spikes).
A,R = complete letters a, r: exact visible contour segments + reconstructed hidden tops.

Pipeline (run from this folder):
  1. python3 -c "import sys,json;sys.path.insert(0,'lib');from fills import fill_polys;json.dump(fill_polys(32),open('data/fillpolys.json','w'))"
  2. node lib/closing.mjs data/fillpolys.json 190 170 306 230 0.04 2.9 5 data/fused_offset_t2.9_close5.json
  3. python3 build_geometry.py   -> geometry.json (silhouette, a, r path data)
  4. python3 build_parts.py      -> parts/*.svg (letters, silhouette, fills, flame, sparkle)
  5. mascot_outline*.svg / flame_outline.svg come from Figma booleans (page "Logo dark", board "Logo parts"),
     cleaned with clean_figma_export.py.
Checks: stack.html?s=4&layers=... renders layered parts; lib/diff.py compares against assets/img/logo.svg."""
import sys, json, math, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'lib'))
from svgpath import parse, to_d, fmt, flatten
from logo_src import path_d
from fitcurve import fit, norm, dist, bez
HERE = os.path.dirname(os.path.abspath(__file__))
ISO = json.load(open(os.path.join(HERE, 'data', 'fused_offset_t2.9_close5.json')))['isoClose'][0]
Mall = parse(path_d('Mascot outline + ar'))
M = Mall[0]; COUNTER = Mall[1]
SEG = M['segs']; NODES = [M['start']] + [s[-1] for s in SEG]

def seg_end_tangent(s):
    if s[0] == 'L': return norm((s[2][0]-s[1][0], s[2][1]-s[1][1]))
    return norm((s[4][0]-s[3][0], s[4][1]-s[3][1]))
def seg_start_tangent(s):
    if s[0] == 'L': return norm((s[2][0]-s[1][0], s[2][1]-s[1][1]))
    return norm((s[2][0]-s[1][0], s[2][1]-s[1][1]))

def nearest_idx(p):
    return min(range(len(ISO)), key=lambda i: dist(p, ISO[i]))

def resample(pts, step):
    s = [0.0]
    for a, b in zip(pts, pts[1:]): s.append(s[-1] + dist(a, b))
    n = max(2, int(s[-1] / step) + 1); out = []; j = 0
    for k in range(n):
        t = s[-1] * k / (n - 1)
        while j < len(s) - 2 and s[j+1] < t: j += 1
        seg = s[j+1] - s[j]; u = (t - s[j]) / seg if seg > 0 else 0
        out.append((pts[j][0] + (pts[j+1][0]-pts[j][0])*u, pts[j][1] + (pts[j+1][1]-pts[j][1])*u))
    return out

def smooth(pts, sigma_pts):
    R = int(3 * sigma_pts); w = [math.exp(-(k*k)/(2*sigma_pts**2)) for k in range(-R, R+1)]
    out = []
    for i in range(len(pts)):
        sx = sy = sw = 0
        for k in range(-R, R+1):
            j = min(len(pts)-1, max(0, i+k)); sx += pts[j][0]*w[k+R]; sy += pts[j][1]*w[k+R]; sw += w[k+R]
        out.append((sx/sw, sy/sw))
    out[0] = pts[0]; out[-1] = pts[-1]
    return out

def fused_curve(n_from, n_to, t_from, t_to, blend=4.0, tol=0.04):
    i0 = nearest_idx(NODES[n_from]); i1 = nearest_idx(NODES[n_to])
    pts = ISO[i0:i1+1] if i0 < i1 else ISO[i1:i0+1][::-1]
    pts = smooth(resample([tuple(p) for p in pts], 0.08), 2)
    # arc length
    s = [0.0]
    for a, b in zip(pts, pts[1:]): s.append(s[-1] + dist(a, b))
    L = s[-1]
    d0 = (NODES[n_from][0]-pts[0][0], NODES[n_from][1]-pts[0][1])
    d1 = (NODES[n_to][0]-pts[-1][0], NODES[n_to][1]-pts[-1][1])
    f = lambda x: (1-x)**2*(1+2*x) if x < 1 else 0.0
    out = []
    for p, si in zip(pts, s):
        w0 = f(si/blend); w1 = f((L-si)/blend)
        out.append((p[0]+d0[0]*w0+d1[0]*w1, p[1]+d0[1]*w0+d1[1]*w1))
    out[0] = NODES[n_from]; out[-1] = NODES[n_to]
    if out[-1] != NODES[n_to]: out.append(NODES[n_to])
    return fit(out, t_from, t_to, tol)

def cubics_to_segs(cs):
    return [('C', c[0], c[1], c[2], c[3]) for c in cs]

# ---------- mascot silhouette S ----------
right = fused_curve(16, 27, seg_end_tangent(SEG[15]), seg_start_tangent(SEG[27]))
left  = fused_curve(28, 37, seg_end_tangent(SEG[27]), seg_start_tangent(SEG[37]))
s_segs = SEG[37:] + SEG[:16] + cubics_to_segs(right) + [SEG[27]] + cubics_to_segs(left)
SIL = {'start': NODES[37], 'segs': s_segs, 'closed': True}

# ---------- letter a ----------
def C(p0, p1, p2, p3): return ('C', p0, p1, p2, p3)
def Lseg(p0, p1): return ('L', p0, p1)
N37 = NODES[37]; N28 = NODES[28]
u37 = seg_end_tangent(SEG[36])            # bowl tangent arriving at node 37
notch = (215.857, 193.8)                  # stem inner edge x (from bottom crotch); raised to stay under the band
u_n = norm((0.70, 0.714))
a_top = [
    C(N37, (N37[0]+u37[0]*5.2, N37[1]+u37[1]*5.2), (notch[0]-u_n[0]*4.2, notch[1]-u_n[1]*4.2), notch),
    # stem top-left corner (mirror of the a's own bottom-left stem corner, y' = 450.599 - y)
    C(notch, (215.98, 192.55), (216.40, 191.24), (217.422, 190.134)),
    C((217.422, 190.134), (218.413, 188.950), (220.174, 188.334), (221.780, 188.340)),
    Lseg((221.780, 188.340), (230.943, 188.380)),
    C((230.943, 188.380), (234.388, 188.398), (236.558, 191.143), (236.558, 194.605)),
    Lseg((236.558, 194.605), N28),
]
A_OUT = {'start': N28, 'segs': SEG[28:37] + a_top, 'closed': True}
A = [A_OUT, COUNTER]

# ---------- letter r ----------
N16 = NODES[16]; N27 = NODES[27]
u16 = seg_start_tangent(SEG[16])          # terminal corner tangent leaving node 16
r_top = [
    Lseg(N27, (250.579, 194.110)),
    # stem top-left corner = p's top-left corner translated (+178.199, 0)
    C((250.579, 194.110), (250.579, 191.280), (252.759, 188.530), (255.409, 188.310)),
    C((255.409, 188.310), (263.36, 187.650), (279.0, 186.450), (286.5, 186.450)),
    # rounded top-right terminal corner: continues the visible corner (node 16 -> 17) with a ~3 unit radius
    C((286.5, 186.450), (290.5, 186.450), (N16[0]-u16[0]*2.2, N16[1]-u16[1]*2.2), N16),
]
R_OUT = {'start': N27, 'segs': r_top + SEG[16:27], 'closed': True}
R = [R_OUT]

if __name__ == '__main__':
    geo = {'silhouette': to_d([SIL]), 'a': to_d(A), 'r': to_d(R),
           'right_fused_n': len(right), 'left_fused_n': len(left)}
    json.dump(geo, open(os.path.join(os.path.dirname(__file__), 'geometry.json'), 'w'), indent=1)
    print('right cubics', len(right), 'left cubics', len(left))
    # check hidden letter tops vs silhouette boundary: sample and report min clearance (+ = inside S)
