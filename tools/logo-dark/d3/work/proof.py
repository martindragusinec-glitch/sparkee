"""Pixel proof: mascot interior pixels of the dark D3 logo vs the official light logo (both rendered at 900 px)."""
import sys, os, json, subprocess
from PIL import Image, ImageChops, ImageFilter
D = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(D, '..', '..'))
SITE = os.path.abspath(os.path.join(ROOT, '..', '..'))
SHOT = sys.argv[1]; OUT = os.path.join(D, 'proof'); W = 900; H = round(900 * 292 / 568)
polys = json.load(open(os.path.join(ROOT, 'data', 'fillpolys.json')))
fl = os.path.join(ROOT, 'parts', 'flame_fills.svg')
mask = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 568 292" width="%d" height="%d"><rect width="568" height="292" fill="#000"/>%s</svg>' % (
    W, H, ''.join('<polygon points="%s" fill="#fff"/>' % ' '.join('%.3f,%.3f' % tuple(p) for p in poly) for poly in polys))
open(os.path.join(OUT, 'mask.svg'), 'w').write(mask)
def page(name, src, bg):
    p = os.path.join(OUT, name + '.html')
    open(p, 'w').write('<html><body style="margin:0;background:%s"><img src="file://%s" style="display:block;width:%dpx"></body></html>' % (bg, src, W))
    subprocess.run([SHOT, str(W), str(H), os.path.join(OUT, name + '.png'), 'file://' + p], check=True, stdout=subprocess.DEVNULL)
page('light', os.path.join(SITE, 'assets', 'img', 'logo.svg'), '#F6F4EF')
page('dark', os.path.join(ROOT, 'variants', 'D3-cut-glow.svg'), '#2C303C')
page('dark_1e', os.path.join(ROOT, 'variants', 'D3-cut-glow.svg'), '#1E2029')
page('mask', os.path.join(OUT, 'mask.svg'), '#000')
m = Image.open(os.path.join(OUT, 'mask.png')).convert('L').point(lambda v: 255 if v > 250 else 0).filter(ImageFilter.MinFilter(5))
L = Image.open(os.path.join(OUT, 'light.png')).convert('RGB')
res = {}
for n in ['dark', 'dark_1e']:
    Dk = Image.open(os.path.join(OUT, n + '.png')).convert('RGB')
    diff = ImageChops.difference(L, Dk).convert('L')
    hist = [0] * 256; px = diff.load(); mp = m.load(); tot = 0
    for y in range(H):
        for x in range(W):
            if mp[x, y]: hist[px[x, y]] += 1; tot += 1
    res[n] = {'mascot_interior_pixels': tot, 'identical': hist[0], 'max_diff': max(i for i, v in enumerate(hist) if v)}
print(json.dumps(res))
json.dump(res, open(os.path.join(OUT, 'proof.json'), 'w'))
