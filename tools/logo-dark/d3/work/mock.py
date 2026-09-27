"""Quick mask-based mockups to choose outline/glow treatment (not the final geometry)."""
import sys, os
D = os.path.dirname(os.path.abspath(__file__)); sys.path[:0] = [os.path.join(D, '..', 'lib'), os.path.join(D, '..', '..', 'lib')]
from parts_src import body, LETTERS, SIL, FLAME_SIL
MIST = '#F5F4FB'; INK = '#2C303C'
fills, fdefs = body('mascot_fills.svg'); ffills, ffdefs = body('flame_fills.svg')
spark, sdefs = body('sparkle.svg'); band, bdefs = body('mascot_outline_underlap.svg')
fband, fbdefs = body('flame_outline.svg')
def bgdef(bg):
    if bg == 'glow':
        return ('<radialGradient id="bgg" cx="0.42" cy="0.45" r="0.75"><stop stop-color="#3A3350"/><stop offset="0.55" stop-color="#262434"/><stop offset="1" stop-color="#1E2029"/></radialGradient>'
                '<radialGradient id="bgg2" cx="0.8" cy="0.3" r="0.5"><stop stop-color="#9AD8F8" stop-opacity="0.18"/><stop offset="1" stop-color="#9AD8F8" stop-opacity="0"/></radialGradient>'
                '<radialGradient id="bgg3" cx="0.2" cy="0.8" r="0.5"><stop stop-color="#A5EDC5" stop-opacity="0.12"/><stop offset="1" stop-color="#A5EDC5" stop-opacity="0"/></radialGradient>',
                '<rect x="-400" y="-300" width="1400" height="900" fill="url(#bgg)"/><rect x="-400" y="-300" width="1400" height="900" fill="url(#bgg2)"/><rect x="-400" y="-300" width="1400" height="900" fill="url(#bgg3)"/>')
    return '', '<rect x="-400" y="-300" width="1400" height="900" fill="%s"/>' % bg
def mock(bg, g, bandmode='ink', glow=True, vb='0 0 568 292', W=1136, H=584):
    bd, bgr = bgdef(bg)
    defs = bd + fdefs + ffdefs + sdefs
    defs += ('<mask id="cut" maskUnits="userSpaceOnUse" x="-10" y="-10" width="600" height="320"><rect x="-10" y="-10" width="600" height="320" fill="#fff"/>'
             '<path d="%s" fill="#000" stroke="#000" stroke-width="%.3f" stroke-linejoin="round"/></mask>' % (SIL, 2*g))
    defs += ('<linearGradient id="gl" x1="170" y1="40" x2="290" y2="190" gradientUnits="userSpaceOnUse"><stop stop-color="#A5EDC5"/><stop offset="0.5" stop-color="#9AD8F8"/><stop offset="1" stop-color="#C49CF2"/></linearGradient>'
             '<filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>'
             '<linearGradient id="fade" x1="0" y1="120" x2="0" y2="188" gradientUnits="userSpaceOnUse"><stop stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>'
             '<mask id="glowm" maskUnits="userSpaceOnUse" x="-10" y="-60" width="600" height="400"><rect x="-10" y="-60" width="600" height="400" fill="url(#fade)"/></mask>')
    out = '<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="%s"><defs>%s</defs>%s' % (W, H, vb, defs, bgr)
    if glow:
        out += '<g mask="url(#glowm)"><g filter="url(#blur)" opacity="0.55"><path d="%s %s" fill="url(#gl)"/></g></g>' % (SIL, FLAME_SIL)
    out += '<g mask="url(#cut)" fill="%s">%s</g>' % (MIST, ''.join('<path d="%s"/>' % d for d in LETTERS.values()))
    if bandmode == 'ink':
        out += '<path d="%s" fill="%s"/><path d="%s" fill="%s"/>' % (SIL, INK, FLAME_SIL, INK)
    out += fills + ffills + spark + '</svg>'
    return out
if __name__ == '__main__':
    OUT = sys.argv[1]
    import itertools
    rows = []
    for bg in ['#2C303C', '#1E2029', 'glow']:
        for bm in ['ink', 'none']:
            n = 'mock_%s_%s.svg' % (bg.strip('#'), bm)
            open(os.path.join(OUT, n), 'w').write(mock(bg, 2.32, bm))
            n2 = 'mockz_%s_%s.svg' % (bg.strip('#'), bm)
            open(os.path.join(OUT, n2), 'w').write(mock(bg, 2.32, bm, vb='150 100 160 120', W=1280, H=960))
    html = '<html><body style="margin:0;background:#888;display:grid;grid-template-columns:repeat(2,568px);gap:4px">'
    for bg in ['2C303C', '1E2029', 'glow']:
        for bm in ['ink', 'none']:
            html += '<img src="mock_%s_%s.svg" style="width:568px">' % (bg, bm)
    open(os.path.join(OUT, 'mock.html'), 'w').write(html + '</body></html>')
