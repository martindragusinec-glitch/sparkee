"""Write the separated SVG parts (viewBox 0 0 568 292, same coordinates as assets/img/logo.svg)."""
import sys, os, re, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, 'lib'))
from logo_src import S as SRC, path_d, group_inner, DEFS
INK = '#2C303C'
PARTS = os.path.join(HERE, 'parts'); os.makedirs(PARTS, exist_ok=True)
geo = json.load(open(os.path.join(HERE, 'geometry.json')))

def defs_for(fragment):
    ids = set(re.findall(r'url\(#([^)]+)\)', fragment))
    if not ids: return ''
    blocks = re.findall(r'<(linearGradient|radialGradient)\s+id="([^"]+)"[\s\S]*?</\1>', DEFS)
    out = []
    for m in re.finditer(r'<(linearGradient|radialGradient)\s+id="([^"]+)"[\s\S]*?</\1>', DEFS):
        if m.group(2) in ids: out.append(m.group(0))
    return '<defs>\n' + '\n'.join(out) + '\n</defs>\n'

def write(name, inner, title):
    svg = ('<svg viewBox="0 0 568 292" fill="none" xmlns="http://www.w3.org/2000/svg">\n'
           '<!-- Sparkee logo 124:3 part: %s. Coordinates identical to assets/img/logo.svg -->\n%s\n%s</svg>\n'
           % (title, inner, defs_for(inner)))
    open(os.path.join(PARTS, name), 'w').write(svg)

letters = {
    's': path_d('Vector_2'), 'p': path_d('Subtract'), 'a': geo['a'], 'r': geo['r'],
    'k': path_d('Vector'), 'e1': path_d('Letter e1'), 'e2': path_d('Letter e2'),
}
write('letters.svg', '<g id="letters" fill="%s">\n%s\n</g>' % (INK, '\n'.join(
    '<path id="letter-%s" d="%s"/>' % (k, v) for k, v in letters.items())), 'wordmark letters s p a r k e e (a, r completed under the mascot)')
write('mascot_silhouette.svg', '<path id="mascot-silhouette" d="%s" fill="%s"/>' % (geo['silhouette'], INK),
      'mascot outer silhouette incl. ink outline (head, body, limbs), solid')
flame_sil = path_d('Vector_3')
write('mascot_silhouette_with_flame.svg', '<path id="mascot-silhouette-flame" d="%s %s" fill="%s"/>' % (geo['silhouette'], flame_sil, INK),
      'mascot silhouette + flame silhouette, solid')
g7 = group_inner('Group_7')
write('mascot_fills.svg', g7, 'mascot fills and details (head holo, face, highlights, body, limbs), unchanged')
g5 = group_inner('Group_5')
write('flame.svg', '<g id="flame">\n<path id="flame-silhouette" d="%s" fill="%s"/>\n%s\n</g>' % (flame_sil, INK, g5), 'flame complete (ink silhouette + fills)')
write('flame_silhouette.svg', '<path id="flame-silhouette" d="%s" fill="%s"/>' % (flame_sil, INK), 'flame ink silhouette, solid')
write('flame_fills.svg', g5, 'flame fills only')
write('sparkle.svg', group_inner('Union'), 'sparkle star, unchanged')

print('ok', sorted(os.listdir(PARTS)))
