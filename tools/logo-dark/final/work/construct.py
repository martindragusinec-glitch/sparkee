"""High-zoom construction view: letter (cut) fill, raw unrounded cut (X) line, silhouette line, node dots."""
import sys, os, json, re
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'd3')); sys.path.insert(0, os.path.join(ROOT, 'd3', 'lib')); sys.path.insert(0, os.path.join(ROOT, 'lib'))
from parts_src import SIL, LETTERS, body
from svgpath import parse
def nodes(d):
    out = []
    for sp in parse(d):
        out.append(sp['start'])
        for s in sp['segs']: out.append(s[-1])
    return out
def view(cutf, vb, W, out, bg='#1E2029'):
    c = json.load(open(cutf)); x0, y0, w, h = vb; k = W / w
    f, fd = body('mascot_fills.svg')
    s = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="%g %g %g %g" width="%d" height="%d"><defs>%s</defs>' % (x0, y0, w, h, W, int(h * k), fd)]
    s.append('<rect x="0" y="0" width="568" height="292" fill="%s"/>' % bg)
    s.append(f)
    for L in 'ar':
        s.append('<path d="%s" fill="#F5F4FB"/>' % c[L])
        for loop in c['raw'][L]['X']:
            s.append('<polyline points="%s" fill="none" stroke="#ff4fa3" stroke-width="%g" stroke-dasharray="%g %g"/>' % (' '.join('%.3f,%.3f' % tuple(p) for p in loop[::3] + [loop[0]]), 1.2 / k, 5 / k, 4 / k))
        for p in nodes(c[L]):
            s.append('<circle cx="%.3f" cy="%.3f" r="%g" fill="#00b3ff"/>' % (p[0], p[1], 2.2 / k))
    s.append('<path d="%s" fill="none" stroke="#ffcc00" stroke-width="%g"/>' % (SIL, 1 / k))
    s.append('</svg>')
    open(out, 'w').write('\n'.join(s))
if __name__ == '__main__':
    cutf, out = sys.argv[1], sys.argv[2]; vb = [float(v) for v in sys.argv[3].split(',')]; W = int(sys.argv[4])
    view(cutf, vb, W, out)
