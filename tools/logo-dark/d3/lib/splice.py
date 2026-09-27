"""Splice a cut contour (polyline loops from cut.mjs) back into the ORIGINAL Bezier letter outline.

Where the new contour lies on the original outline, the original Bezier data is kept verbatim (split with
de Casteljau at the exact splice parameters). Only the runs that leave the original outline (the cut and its
rounded ends) are replaced by fitted cubic Beziers with G1 joins (end tangents = original tangents).
"""
import math
from svgpath import parse, bez as bez4
from fitcurve import fit, norm, dist

def seg_pt(s, t):
    if s[0] == 'L':
        a, b = s[1], s[2]; return (a[0] + (b[0]-a[0])*t, a[1] + (b[1]-a[1])*t)
    return bez4(s[1], s[2], s[3], s[4], t)

def seg_d1(s, t):
    if s[0] == 'L': return (s[2][0]-s[1][0], s[2][1]-s[1][1])
    p0, p1, p2, p3 = s[1:]; mt = 1 - t
    return (3*(mt*mt*(p1[0]-p0[0]) + 2*mt*t*(p2[0]-p1[0]) + t*t*(p3[0]-p2[0])),
            3*(mt*mt*(p1[1]-p0[1]) + 2*mt*t*(p2[1]-p1[1]) + t*t*(p3[1]-p2[1])))

def seg_tan(s, t):
    d = seg_d1(s, t)
    if math.hypot(*d) < 1e-9:
        a = seg_pt(s, max(0, t-1e-3)); b = seg_pt(s, min(1, t+1e-3)); d = (b[0]-a[0], b[1]-a[1])
    return norm(d)

def split(s, t0, t1):
    """Sub-segment of s between params t0 < t1."""
    if s[0] == 'L': return ('L', seg_pt(s, t0), seg_pt(s, t1))
    def de_casteljau(c, t):
        p0, p1, p2, p3 = c
        lerp = lambda a, b: (a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t)
        a, b, cc = lerp(p0, p1), lerp(p1, p2), lerp(p2, p3); d, e = lerp(a, b), lerp(b, cc); f = lerp(d, e)
        return (p0, a, d, f), (f, e, cc, p3)
    c = s[1:]
    if t1 < 1: c, _ = de_casteljau(c, t1)
    if t0 > 0: _, c = de_casteljau(c, t0 / t1 if t1 > 0 else 0)
    return ('C',) + tuple(c)

def closed_segs(sp):
    segs = list(sp['segs'])
    end = segs[-1][-1]
    if dist(end, sp['start']) > 1e-6: segs.append(('L', end, sp['start']))
    return segs

def signed_area(pts):
    return 0.5 * sum(pts[k][0]*pts[i][1] - pts[i][0]*pts[k][1] for i, k in zip(range(len(pts)), [len(pts)-1] + list(range(len(pts)-1))))

class Outline:
    def __init__(self, d, step=0.02):
        self.subs = [closed_segs(sp) for sp in parse(d)]
        self.samples = []  # (sub, seg, t, x, y)
        for si, segs in enumerate(self.subs):
            for gi, s in enumerate(segs):
                L = sum(dist(seg_pt(s, k/32), seg_pt(s, (k+1)/32)) for k in range(32))
                n = max(4, int(L / step))
                for k in range(n):
                    t = k / n; p = seg_pt(s, t); self.samples.append((si, gi, t, p[0], p[1]))
        self.B = 0.5; self.grid = {}
        for idx, smp in enumerate(self.samples):
            self.grid.setdefault((int(smp[3] // self.B), int(smp[4] // self.B)), []).append(idx)

    def nearest(self, p, rad=1):
        bi, bj = int(p[0] // self.B), int(p[1] // self.B); best = (1e9, None)
        for a in range(bi-rad, bi+rad+1):
            for b in range(bj-rad, bj+rad+1):
                for idx in self.grid.get((a, b), ()):
                    s = self.samples[idx]; d = (s[3]-p[0])**2 + (s[4]-p[1])**2
                    if d < best[0]: best = (d, idx)
        if best[1] is None: return 1e9, None
        si, gi, t = self.samples[best[1]][:3]
        # refine t by Newton projection
        s = self.subs[si][gi]
        for _ in range(8):
            q = seg_pt(s, t); d1 = seg_d1(s, t); den = d1[0]**2 + d1[1]**2
            if den < 1e-12: break
            t = min(1.0, max(0.0, t - ((q[0]-p[0])*d1[0] + (q[1]-p[1])*d1[1]) / den))
        q = seg_pt(s, t)
        return dist(q, p), (si, gi, t)

    def point(self, prm): si, gi, t = prm; return seg_pt(self.subs[si][gi], t)
    def tangent(self, prm): si, gi, t = prm; return seg_tan(self.subs[si][gi], t)

    def piece(self, a, b):
        """Original segments from param a to param b (same subpath), walking forward (cyclic)."""
        si, g0, t0 = a; _, g1, t1 = b; segs = self.subs[si]; n = len(segs); out = []
        if g0 == g1 and t1 >= t0:
            if t1 - t0 > 1e-9: out.append(split(segs[g0], t0, t1))
            return out
        if t0 < 1 - 1e-9: out.append(split(segs[g0], t0, 1.0))
        g = (g0 + 1) % n
        while g != g1:
            out.append(segs[g]); g = (g + 1) % n
        if t1 > 1e-9: out.append(split(segs[g1], 0.0, t1))
        return out

def splice(orig_d, loops, near_cut, eps_on=0.012, fit_tol=0.015, min_area=12.0, log=None):
    """orig_d: original letter path data. loops: new contour loops (list of [x,y]).
    near_cut(p) -> True where the new contour may legitimately differ from the original (cut zone).
    Returns (list of subpath dicts {'start','segs','closed'}, report)."""
    O = Outline(orig_d)
    rep = {'islands_removed': [], 'loops': []}
    out = []
    used_subs = set()
    for loop in loops:
        A = signed_area(loop)
        if abs(A) < min_area:
            rep['islands_removed'].append({'area': round(abs(A), 3), 'at': [round(sum(p[0] for p in loop)/len(loop), 2), round(sum(p[1] for p in loop)/len(loop), 2)]})
            continue
        pts = [tuple(p) for p in loop]
        info = [O.nearest(p) for p in pts]
        # orientation must match the original subpath the loop mostly lies on -> reverse the loop if needed
        cand = [prm[0] for d, prm in info if d < eps_on]
        if cand:
            si0 = max(set(cand), key=cand.count)
            orig_poly0 = [O.point((si0, gi, k/8)) for gi in range(len(O.subs[si0])) for k in range(8)]
            if (signed_area(orig_poly0) > 0) != (A > 0):
                pts = pts[::-1]; info = info[::-1]; A = -A
        # orientation must match the original subpath the loop mostly lies on
        on = [(d < eps_on) or (d < 0.05 and not near_cut(p)) for (d, prm), p in zip(info, pts)]
        # original-shape differences far from the cut (letter's own tight corners rounded by the opening) -> keep original
        n = len(pts)
        if not any(on):
            # completely new loop: fit closed
            cs = fit(pts + [pts[0]], norm((pts[1][0]-pts[-1][0], pts[1][1]-pts[-1][1])), norm((pts[1][0]-pts[-1][0], pts[1][1]-pts[-1][1])), fit_tol)
            out.append({'start': pts[0], 'segs': [('C',) + c for c in cs], 'closed': True}); rep['loops'].append({'new': True, 'n': len(cs)}); continue
        # mark off-runs that never come near the cut as 'on' (keep original there)
        i = 0
        runs = []
        start = next(k for k in range(n) if on[k] and not on[k-1]) if not all(on) else 0
        k = start; cur = None
        for step in range(n):
            idx = (start + step) % n
            if cur is None or cur[0] != on[idx]:
                cur = [on[idx], [idx]]; runs.append(cur)
            else: cur[1].append(idx)
        for r in runs:
            if not r[0] and not any(near_cut(pts[j]) for j in r[1]): r[0] = True
        # merge consecutive runs with equal flag
        merged = []
        for r in runs:
            if merged and merged[-1][0] == r[0]: merged[-1][1].extend(r[1])
            else: merged.append([r[0], list(r[1])])
        if len(merged) > 1 and merged[0][0] == merged[-1][0]:
            merged[0][1] = merged[-1][1] + merged[0][1]; merged.pop()
        sub_ids = {info[j][1][0] for r in merged if r[0] for j in r[1]}
        if len(sub_ids) != 1: raise RuntimeError('loop touches several original subpaths: %s' % sub_ids)
        si = sub_ids.pop(); used_subs.add(si)
        orig_poly = [O.point((si, gi, k/8)) for gi in range(len(O.subs[si])) for k in range(8)]
        if (signed_area(orig_poly) > 0) != (A > 0):
            raise RuntimeError('orientation mismatch (reverse loop)')
        if all(r[0] for r in merged):
            segs = O.subs[si]
            out.append({'start': segs[0][1], 'segs': list(segs), 'closed': True, 'orig': si}); rep['loops'].append({'unchanged_sub': si}); continue
        # build path: start at the beginning of the first on-run
        if not merged[0][0]: merged = merged[1:] + merged[:1]
        segs = []; lrep = {'sub': si, 'new_runs': []}
        for m, r in enumerate(merged):
            if r[0]:
                a = info[r[1][0]][1]; b = info[r[1][-1]][1]
                segs += O.piece(a, b)
            else:
                prev_on = merged[m-1]; next_on = merged[(m+1) % len(merged)]
                pa = info[prev_on[1][-1]][1]; pb = info[next_on[1][0]][1]
                P0 = O.point(pa); P1 = O.point(pb)
                poly = [P0] + [pts[j] for j in r[1]] + [P1]
                cs = fit(poly, O.tangent(pa), O.tangent(pb), fit_tol)
                segs += [('C',) + c for c in cs]
                lrep['new_runs'].append({'from': [round(P0[0], 3), round(P0[1], 3)], 'to': [round(P1[0], 3), round(P1[1], 3)], 'cubics': len(cs), 'points': len(r[1])})
        out.append({'start': segs[0][1], 'segs': segs, 'closed': True}); rep['loops'].append(lrep)
    return out, rep
