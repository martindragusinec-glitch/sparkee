import sys, os, json
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'd3')); sys.path.insert(0, os.path.join(ROOT, 'd3', 'lib')); sys.path.insert(0, os.path.join(ROOT, 'lib'))
from compose import compose
cuts = sys.argv[1:]
cells = []
for i, cf in enumerate(cuts):
    cut = json.load(open(cf))
    for bg in ['#2C303C', '#1E2029']:
        svg = compose(cut, glow=False, pre='z%d%s-' % (i, bg[1:3]), vb='148 150 155 118', bg='<rect x="0" y="0" width="568" height="292" fill="%s"/>' % bg)
        cells.append('<div><p>%s %s</p>%s</div>' % (os.path.basename(cf), bg, svg.replace('<svg ', '<svg width="930" height="708" ', 1)))
open(os.path.join(HERE, 'zoom.html'), 'w').write('<html><body style="margin:0;background:#888;font:14px sans-serif;display:grid;grid-template-columns:930px 930px;gap:10px">%s</body></html>' % ''.join(cells))
