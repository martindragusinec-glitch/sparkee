"""Knock-out cut of the letters around the lying mascot (dark-background logo).

For each gap g (distance between the mascot silhouette incl. its outline band and the letters):
  cut.mjs : X = letter - offset(silhouette, g);  D = opening(X, rho)  (rounded cut ends, slivers removed)
  splice  : original Bezier outline kept verbatim wherever D follows it; only the cut runs are fitted curves.
Only 'a' and 'r' touch the mascot (k is 10.85 units away, the sparkle 19.2 units from the last e).

usage: python3 build_cut.py <g> <rho> [res]   -> cut/cut_g<g>_r<rho>.json  {a, r, report}
"""
import sys, os, json, math, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))            # tools/logo-dark/d3
ROOT = os.path.dirname(HERE)                                  # tools/logo-dark
sys.path.insert(0, os.path.join(HERE, 'lib')); sys.path.insert(0, os.path.join(ROOT, 'lib'))
from parts_src import LETTERS, SIL
from geom import dense
from splice import splice
from svgpath import to_d

def run(g, rho, res=0.025, letters=('a', 'r')):
    os.makedirs(os.path.join(HERE, 'cut'), exist_ok=True)
    S = dense(SIL, 0.04)
    Spts = [p for poly in S for p in poly]
    B = 1.0; grid = {}
    for p in Spts: grid.setdefault((int(p[0] // B), int(p[1] // B)), []).append(p)
    def dS(p, R=6):
        bi, bj = int(p[0] // B), int(p[1] // B); best = 1e18
        for a in range(bi-R, bi+R+1):
            for b in range(bj-R, bj+R+1):
                for q in grid.get((a, b), ()):
                    d = (q[0]-p[0])**2 + (q[1]-p[1])**2
                    if d < best: best = d
        return math.sqrt(best)
    near = g + 2 * rho + 0.6
    near_cut = lambda p: dS(p) < near
    out = {'g': g, 'rho': rho, 'res': res, 'report': {}}
    for k in letters:
        Lp = dense(LETTERS[k], 0.04)
        xs = [p[0] for poly in Lp for p in poly]; ys = [p[1] for poly in Lp for p in poly]
        region = [math.floor(min(xs)) - 3, math.floor(min(ys)) - 3, math.ceil(max(xs)) + 3, math.ceil(max(ys)) + 3]
        inp = os.path.join(HERE, 'cut', '_in_%s.json' % k); outp = os.path.join(HERE, 'cut', '_out_%s.json' % k)
        json.dump({'S': S, 'L': Lp, 'region': region, 'res': res, 'g': g, 'rho': rho}, open(inp, 'w'))
        subprocess.run(['node', os.path.join(HERE, 'lib', 'cut.mjs'), inp, outp], check=True)
        R = json.load(open(outp))
        loops = R['D'] if rho > 0 else R['X']
        subs, rep = splice(LETTERS[k], loops, near_cut)
        out[k] = to_d(subs)
        out['report'][k] = rep
        out.setdefault('raw', {})[k] = {'X': R['X'], 'E': R.get('E')}
        os.remove(inp); os.remove(outp)
    name = os.path.join(HERE, 'cut', 'cut_g%.2f_r%.2f.json' % (g, rho))
    json.dump(out, open(name, 'w'))
    print(name); print(json.dumps(out['report'], indent=1))
    return out

if __name__ == '__main__':
    g = float(sys.argv[1]); rho = float(sys.argv[2]); res = float(sys.argv[3]) if len(sys.argv) > 3 else 0.025
    run(g, rho, res)
