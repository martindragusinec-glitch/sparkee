"""D2 cut + rim: fit the distance-field geometry from build_d2_geom.mjs to clean cubic Beziers and
assemble the self-contained dark logo SVG (viewBox 0 0 568 292, same coordinates as assets/img/logo.svg).

Letters a, r: the ORIGINAL path segments are kept everywhere the cut does not touch them; only the cut
runs (fillet -> offset curve -> fillet) are replaced by fitted cubics that join the original outline
with matching tangents (G1). Islands below MIN_ISLAND area are dropped.
Rim / ink core: erode(S, wm) and erode(F, wm) fitted as closed smooth cubic loops.

usage: python3 build_d2.py <geom.json> <g/rho key> <out.svg> [--rim mist|holo] [--glow 0|1] [--debug out.json]
"""
import sys, os, json, math, argparse
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, 'lib'))
from svgpath import parse, to_d, fmt
from fitcurve import fit, norm, dist, bez
import parts as P

INK = '#2C303C'; MIST = '#F5F4FB'
G_CUT = None
MIN_ISLAND = 12.0      # units^2; anything smaller is a leftover fragment and is removed
EPS_ON = 0.006         # a contour point closer than this to the original outline is "on" the original

# ---------------------------------------------------------------- helpers
def resample(pts, step, closed=True):
    P_ = pts + [pts[0]] if closed else pts[:]
    s = [0.0]
    for a, b in zip(P_, P_[1:]): s.append(s[-1] + dist(a, b))
    L = s[-1]; n = max(4, int(round(L / step)))
    out = []; j = 0
    for k in range(n + (0 if closed else 1)):
        t = L * k / n
        while j < len(s) - 2 and s[j + 1] < t: j += 1
        seg = s[j + 1] - s[j]; u = (t - s[j]) / seg if seg > 0 else 0
        out.append((P_[j][0] + (P_[j + 1][0] - P_[j][0]) * u, P_[j][1] + (P_[j + 1][1] - P_[j][1]) * u))
    return out

def signed_area(l):
    a = 0
    for i in range(len(l)):
        x0, y0 = l[i - 1]; x1, y1 = l[i]; a += (x0 * y1 - x1 * y0)
    return a / 2

def seg_point(s, t):
    if s[0] == 'L': return (s[1][0] + (s[2][0] - s[1][0]) * t, s[1][1] + (s[2][1] - s[1][1]) * t)
    return bez((s[1], s[2], s[3], s[4]), t)

def seg_tangent(s, t):
    if s[0] == 'L': return norm((s[2][0] - s[1][0], s[2][1] - s[1][1]))
    p0, p1, p2, p3 = s[1], s[2], s[3], s[4]; mt = 1 - t
    d = (3 * (mt * mt * (p1[0] - p0[0]) + 2 * mt * t * (p2[0] - p1[0]) + t * t * (p3[0] - p2[0])),
         3 * (mt * mt * (p1[1] - p0[1]) + 2 * mt * t * (p2[1] - p1[1]) + t * t * (p3[1] - p2[1])))
    if math.hypot(*d) < 1e-9:  # degenerate handle: use chord to next control point
        q = p2 if t < 0.5 else p3; r = p0 if t < 0.5 else p1; d = (q[0] - r[0], q[1] - r[1])
    return norm(d)

def split_seg(s, t0, t1):
    """sub-segment of s between params t0 < t1"""
    if s[0] == 'L': return ('L', seg_point(s, t0), seg_point(s, t1))
    def split_at(c, t):
        p0, p1, p2, p3 = c
        lerp = lambda a, b: (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)
        a = lerp(p0, p1); b = lerp(p1, p2); cc = lerp(p2, p3); d = lerp(a, b); e = lerp(b, cc); f = lerp(d, e)
        return (p0, a, d, f), (f, e, cc, p3)
    c = (s[1], s[2], s[3], s[4])
    if t1 < 1: c, _ = split_at(c, t1)
    if t0 > 0: _, c = split_at(c, t0 / t1 if t1 > 0 else 0)
    return ('C',) + tuple(c)

class Outline:
    """one closed subpath of the original letter, flattened with (segment, t) parameters"""
    def __init__(self, sub, n=400):
        self.segs = sub['segs'][:]
        # close if needed
        if dist(self.segs[-1][-1], sub['start']) > 1e-6: self.segs.append(('L', self.segs[-1][-1], sub['start']))
        self.samples = []  # (x, y, seg_index, t)
        for i, s in enumerate(self.segs):
            m = n if s[0] == 'C' else max(2, int(dist(s[1], s[2]) / 0.02))
            for k in range(m):
                t = k / m; p = seg_point(s, t); self.samples.append((p[0], p[1], i, t))
        # bucket grid
        self.B = 0.5; self.grid = {}
        for idx, (x, y, i, t) in enumerate(self.samples):
            self.grid.setdefault((int(math.floor(x / self.B)), int(math.floor(y / self.B))), []).append(idx)
    def nearest(self, p, rmax=3):
        bx, by = int(math.floor(p[0] / self.B)), int(math.floor(p[1] / self.B)); best = (1e9, None)
        for dx in range(-rmax, rmax + 1):
            for dy in range(-rmax, rmax + 1):
                for idx in self.grid.get((bx + dx, by + dy), ()):
                    x, y, i, t = self.samples[idx]; d = (x - p[0]) ** 2 + (y - p[1]) ** 2
                    if d < best[0]: best = (d, idx)
        if best[1] is None: return 1e9, None
        # refine t on the segment (golden-section-free: local Newton-ish by sampling)
        x, y, i, t = self.samples[best[1]]; s = self.segs[i]
        lo, hi = max(0.0, t - 0.01), min(1.0, t + 0.01)
        bt, bd = t, math.sqrt(best[0])
        for _ in range(3):
            for k in range(21):
                tt = lo + (hi - lo) * k / 20; q = seg_point(s, tt); d = math.hypot(q[0] - p[0], q[1] - p[1])
                if d < bd: bd, bt = d, tt
            w = (hi - lo) / 20; lo, hi = max(0.0, bt - w), min(1.0, bt + w)
        return bd, (i, bt)
    def pos(self, it): return it[0] + it[1]  # monotone parameter along the outline

def original_between(ol, a, b):
    """original segments from param a=(i,t) to b=(i,t), going forward (wrapping)"""
    i0, t0 = a; i1, t1 = b; out = []
    n = len(ol.segs)
    if i0 == i1 and t1 >= t0:
        if t1 - t0 > 1e-6: out.append(split_seg(ol.segs[i0], t0, t1))
        return out
    if t0 < 1 - 1e-6: out.append(split_seg(ol.segs[i0], t0, 1.0))
    i = (i0 + 1) % n
    while i != i1:
        out.append(ol.segs[i]); i = (i + 1) % n
    if t1 > 1e-6: out.append(split_seg(ol.segs[i1], 0.0, t1))
    return out

def fit_run(pts, t_start, t_end, tol):
    pts = resample(pts, 0.04, closed=False)
    return [('C',) + tuple(c) for c in fit(pts, t_start, t_end, tol)]

# ---------------------------------------------------------------- closed loop fitting (rim core)
def fit_closed(loop, tol=0.012, pieces=10, corner_deg=28):
    pts = resample([tuple(p) for p in loop], 0.035)
    n = len(pts)
    def tang(i, k=3):
        a = pts[(i - k) % n]; b = pts[(i + k) % n]; return norm((b[0] - a[0], b[1] - a[1]))
    # corner detection: turning angle between backward and forward chords over ~0.2 units
    K = 6; corners = []
    for i in range(n):
        a = pts[(i - K) % n]; b = pts[i]; c = pts[(i + K) % n]
        u = norm((b[0] - a[0], b[1] - a[1])); v = norm((c[0] - b[0], c[1] - b[1]))
        ang = math.degrees(math.acos(max(-1, min(1, u[0] * v[0] + u[1] * v[1]))))
        if ang > corner_deg: corners.append((ang, i))
    # non-max suppression
    cs = []
    for ang, i in sorted(corners, reverse=True):
        if all(min(abs(i - j), n - abs(i - j)) > 2 * K for _, j in cs): cs.append((ang, i))
    brk = sorted(i for _, i in cs)
    is_corner = set(brk)
    # add regular breakpoints
    step = n // pieces
    for k in range(pieces):
        i = k * step
        if all(min(abs(i - j), n - abs(i - j)) > step // 3 for j in brk): brk.append(i)
    brk = sorted(brk)
    segs = []
    for a_i, b_i in zip(brk, brk[1:] + [brk[0] + n]):
        run = [pts[k % n] for k in range(a_i, b_i + 1)]
        if a_i in is_corner: ta = norm((run[min(4, len(run) - 1)][0] - run[0][0], run[min(4, len(run) - 1)][1] - run[0][1]))
        else: ta = tang(a_i)
        bi = b_i % n
        if bi in is_corner: tb = norm((run[-1][0] - run[-5][0], run[-1][1] - run[-5][1]))
        else: tb = tang(bi)
        for c in fit(run, ta, tb, tol): segs.append(('C',) + tuple(c))
    return {'start': segs[0][1], 'segs': segs, 'closed': True}, len(cs)

# ---------------------------------------------------------------- letters
def splice_letter(orig_d, loops, cutter_pts, near, tol=0.01, dbg=None):
    subs = parse(orig_d)
    outlines = [Outline(s) for s in subs]
    result = []; report = []
    for lp in loops:
        ar = abs(signed_area(lp))
        if ar < MIN_ISLAND: report.append(('dropped island', round(ar, 2))); continue
        pts = resample([tuple(p) for p in lp], 0.03)
        # which original subpath does this loop follow?
        best = None
        for oi, ol in enumerate(outlines):
            on = sum(1 for p in pts[::10] if ol.nearest(p)[0] < EPS_ON)
            if best is None or on > best[0]: best = (on, oi)
        ol = outlines[best[1]]
        info = [ol.nearest(p) for p in pts]
        on = [d < EPS_ON for d, _ in info]
        if all(on):
            result.append(subs[best[1]]); report.append(('unchanged subpath', best[1])); continue
        # orientation: parameters must increase along on-runs
        inc = dec = 0
        for k in range(len(pts) - 1):
            if on[k] and on[k + 1] and info[k][1][0] == info[k + 1][1][0]:
                dt = info[k + 1][1][1] - info[k][1][1]
                if dt > 0: inc += 1
                elif dt < 0: dec += 1
        if dec > inc:
            pts = pts[::-1]; info = info[::-1]; on = on[::-1]
        n = len(pts)
        # rotate so we start in the middle of an on-run
        k0 = next(k for k in range(n) if on[k] and not on[k - 1])
        pts = pts[k0:] + pts[:k0]; info = info[k0:] + info[:k0]; on = on[k0:] + on[:k0]
        # collect runs
        runs = []; k = 0
        while k < n:
            j = k
            while j + 1 < n and on[j + 1] == on[k]: j += 1
            runs.append((on[k], k, j)); k = j + 1
        # merge tiny on-runs (< 0.4 units) into the surrounding cut run
        merged = []
        for r in runs:
            if r[0] and (r[2] - r[1]) * 0.03 < 0.4 and merged and not merged[-1][0]:
                merged[-1] = (False, merged[-1][1], r[2]); continue
            if merged and merged[-1][0] == r[0]: merged[-1] = (r[0], merged[-1][1], r[2]); continue
            merged.append(r)
        runs = merged
        # classify off-runs: near the cutter -> replace; else keep the original (opening rounded an original corner)
        segs = []
        cur = info[runs[0][1]][1]  # current param on original
        k = 0
        out_runs = []
        for r in runs:
            if r[0]: out_runs.append(['on', r[1], r[2]]); continue
            sub = pts[r[1]:r[2] + 1]
            dmin = min(near(p) for p in sub[::3] + [sub[-1]])
            # a real cut run always contains the offset edge (distance g from S); anything else is the
            # opening rounding an ORIGINAL letter corner -> keep the official outline there
            out_runs.append(['cut' if dmin < G_CUT + 0.1 else 'keep', r[1], r[2], dmin])
        # a keep-run touching a cut-run belongs to that cut (fillet continues into it)
        for q in range(len(out_runs)):
            if out_runs[q][0] == 'keep' and ((q > 0 and out_runs[q - 1][0] == 'cut') or (q + 1 < len(out_runs) and out_runs[q + 1][0] == 'cut')):
                out_runs[q][0] = 'cut'
        mr = []
        for r in out_runs:
            if mr and mr[-1][0] == 'cut' and r[0] == 'cut': mr[-1][2] = r[2]; continue
            mr.append(r)
        out_runs = mr
        if not any(r[0] == 'cut' for r in out_runs):
            result.append(subs[best[1]]); report.append(('unchanged subpath (only sub-EPS rounding elsewhere)', best[1])); continue
        # build
        start_param = info[out_runs[0][1]][1]
        pieces = []
        i = 0
        cur_param = start_param
        while i < len(out_runs):
            r = out_runs[i]
            if r[0] in ('on', 'keep'):
                i += 1; continue
            # cut run: from the last on-point before it to the first on-point after it
            a_idx = r[1] - 1; b_idx = r[2] + 1 if r[2] + 1 < n else 0
            pa = info[a_idx][1]; pb = info[b_idx][1]
            pieces.append(('orig', cur_param, pa))
            ta = seg_tangent(ol.segs[pa[0]], pa[1]); tb = seg_tangent(ol.segs[pb[0]], pb[1])
            A = seg_point(ol.segs[pa[0]], pa[1]); Bp = seg_point(ol.segs[pb[0]], pb[1])
            run_pts = [A] + pts[r[1]:r[2] + 1] + [Bp]
            pieces.append(('fit', run_pts, ta, tb))
            cur_param = pb; i += 1
        pieces.append(('orig', cur_param, start_param))
        segs = []
        for pc in pieces:
            if pc[0] == 'orig':
                if pc[1] == pc[2]: continue
                segs += original_between(ol, pc[1], pc[2])
            else:
                segs += fit_run(pc[1], pc[2], pc[3], tol)
        start = segs[0][1]
        result.append({'start': start, 'segs': segs, 'closed': True})
        report.append(('spliced', round(ar, 1), [(r[0], round((r[2] - r[1]) * 0.03, 2)) for r in out_runs]))
    return result, report

def stitch(sub):
    """make consecutive segments share exact endpoints"""
    segs = sub['segs']; out = []
    for i, s in enumerate(segs):
        s = list(s)
        if i > 0: s[1] = out[-1][-1]
        out.append(tuple(s))
    # close
    first = list(out[0]); first[1] = out[-1][-1]; out[0] = tuple(first)
    return {'start': out[0][1], 'segs': out, 'closed': True}

# ---------------------------------------------------------------- assembly
def build(geom, key, out_svg, rim='mist', glow=True, dbg_path=None):
    G = json.load(open(geom)); cut = G['cuts'][key]
    g, rho = map(float, key.split('/'))
    S = parse(P.SIL)[0]
    from svgpath import flatten
    Sp = flatten(S, 48)
    # distance to S boundary (coarse check for which off-runs belong to the cut)
    global G_CUT
    G_CUT = g
    def near(p, lim=g + 2 * rho + 0.8):
        best = 1e9
        for q in Sp:
            d = (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2
            if d < best: best = d
        return math.sqrt(best) if math.sqrt(best) < lim else 1e9
    letters = {}
    reports = {}
    for lid in ('a', 'r'):
        subs, rep = splice_letter(P.letter_d(lid), cut[lid]['O'], Sp, near)
        letters[lid] = to_d([stitch(s) if 'segs' in s and s is not None else s for s in subs])
        reports[lid] = rep
    coreS = [fit_closed(l) for l in G['coreS']]
    coreF = [fit_closed(l) for l in G['coreF']]
    core_d = to_d([c[0] for c in coreS]); coreF_d = to_d([c[0] for c in coreF])
    reports['core'] = {'S corners': [c[1] for c in coreS], 'F corners': [c[1] for c in coreF],
                       'S segs': [len(c[0]['segs']) for c in coreS], 'F segs': [len(c[0]['segs']) for c in coreF]}
    svg = assemble(letters, core_d, coreF_d, rim, glow, G, key)
    open(out_svg, 'w').write(svg)
    if dbg_path: json.dump({'letters': letters, 'core': core_d, 'coreF': coreF_d, 'reports': reports}, open(dbg_path, 'w'), indent=1)
    return reports

RIM_HOLO = [('0', '#BDF3D5'), ('0.5', '#B8E4FB'), ('1', '#D6BEF7')]   # brand pastels mint/sky/lilac, lifted ~25% toward white

def assemble(letters, core_d, coreF_d, rim, glow, G, key):
    defs = [P.defs('mascot_fills.svg'), P.defs('flame_fills.svg'), P.defs('sparkle.svg')]
    rim_fill = MIST
    if rim == 'holo':
        stops = ''.join('<stop offset="%s" stop-color="%s"/>' % s for s in RIM_HOLO)
        # same diagonal as the head's own holo (mint top-left -> sky -> lilac bottom-right), one per shape
        defs.append('<linearGradient id="d2-rim" x1="152" y1="52" x2="295" y2="215" gradientUnits="userSpaceOnUse">%s</linearGradient>' % stops)
        defs.append('<linearGradient id="d2-rim-flame" x1="165" y1="0" x2="203" y2="51" gradientUnits="userSpaceOnUse">%s</linearGradient>' % stops)
        rim_fill = 'url(#d2-rim)'
    glow_markup = ''
    if glow:
        defs.append('<radialGradient id="d2-glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(222 112) scale(104 100)">'
                    '<stop stop-color="#C49CF2" stop-opacity="0.30"/><stop offset="0.45" stop-color="#9AD8F8" stop-opacity="0.13"/>'
                    '<stop offset="0.75" stop-color="#A5EDC5" stop-opacity="0.04"/><stop offset="1" stop-color="#A5EDC5" stop-opacity="0"/></radialGradient>')
        glow_markup = '<ellipse id="glow" cx="222" cy="112" rx="104" ry="100" fill="url(#d2-glow)"/>\n'
    wordmark = ''.join('<path id="letter-%s" d="%s"/>\n' % (k, P.letter_d(k)) for k in ('s', 'p'))
    wordmark += '<path id="letter-a" d="%s"/>\n<path id="letter-r" d="%s"/>\n' % (letters['a'], letters['r'])
    wordmark += ''.join('<path id="letter-%s" d="%s"/>\n' % (k, P.letter_d(k)) for k in ('k', 'e1', 'e2'))
    return ('<svg viewBox="0 0 568 292" role="img" aria-label="Sparkee" fill="none" xmlns="http://www.w3.org/2000/svg">\n<title>Sparkee</title>\n'
            '<!-- Sparkee logo, dark-background variant D2 "cut + rim". Same geometry and coordinates as the official\n'
            '     logo 124:3 (assets/img/logo.svg). Letters mist, knocked out around the mascot with an even gap\n'
            '     (g=%s, cut corners rounded r=%s); the outer %s units of the mascot ink outline are a %s rim.\n'
            '     Mascot fills, face and internal ink lines are unchanged. -->\n'
            '%s'
            '<g id="wordmark" fill="%s">\n%s</g>\n'
            '<g id="mascot">\n<path id="mascot-rim" d="%s" fill="%s"/>\n<path id="mascot-outline" d="%s" fill="%s"/>\n%s\n</g>\n'
            '<g id="flame">\n<path id="flame-rim" d="%s" fill="%s"/>\n<path id="flame-outline" d="%s" fill="%s"/>\n%s\n</g>\n'
            '<g id="sparkle">\n%s\n</g>\n'
            '<defs>\n%s\n</defs>\n</svg>\n') % (
        key.split('/')[0], key.split('/')[1], G['wm'], rim,
        glow_markup, MIST, wordmark,
        P.SIL, rim_fill, core_d, INK, P.body('mascot_fills.svg'),
        P.FLAME_SIL, rim_fill.replace('d2-rim', 'd2-rim-flame'), coreF_d, INK, P.body('flame_fills.svg'),
        P.body('sparkle.svg'), '\n'.join(defs))

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('geom'); ap.add_argument('key'); ap.add_argument('out')
    ap.add_argument('--rim', default='holo'); ap.add_argument('--glow', type=int, default=1); ap.add_argument('--debug')
    a = ap.parse_args()
    rep = build(a.geom, a.key, a.out, a.rim, bool(a.glow), a.debug)
    for k, v in rep.items(): print(k, v)
