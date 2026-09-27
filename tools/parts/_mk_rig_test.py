import sys, pathlib
sys.path.insert(0, 'tools')
import body_stand as B, rig as R
src = open('tools/compose_mascot.py').read()
cut = src.index('# Postavička v logu leží na textu')
ns = {'__file__': str(pathlib.Path('tools/compose_mascot.py').resolve())}
exec(compile(src[:cut], 'compose_head', 'exec'), ns)
head, DEFS_INNER, EXTRA_DEFS, HEAD_D = ns['head'], ns['DEFS_INNER'], ns['EXTRA_DEFS'], ns['HEAD_D']
import re
FLAME = ns['FLAME']
def upright(inner, deg=24):
    inner = re.sub(r'<g class="m-flame">(.*?)' + re.escape(FLAME) + '</g>',
                   lambda m: f'<g class="m-flame"><g transform="rotate({-deg} 425 97)">{m.group(1)}{FLAME}</g></g>', inner, count=1, flags=re.S)
    return f'<g transform="rotate({deg} 490 300)">{inner}</g>'
def mk(inner, vb="370 30 272 440", h=440):
    return (f'<svg viewBox="{vb}" xmlns="http://www.w3.org/2000/svg" style="height:{h}px;background:#fff">'
            f'<defs>{DEFS_INNER}{EXTRA_DEFS}{B.BODY_DEFS}<path id="m-head-shape" d="{HEAD_D}"/></defs>{inner}</svg>')
sh = '<ellipse cx="504" cy="452" rx="58" ry="8" fill="#2C303C" opacity=".12"/>'
cells = eval(open('tools/parts/_rig_cells.py').read())
html = '<!doctype html><body style="margin:0;background:#F6F4EF;display:flex;flex-wrap:wrap;gap:12px;padding:12px;font:13px system-ui">' + ''.join(
    f'<figure style="margin:0">{c}<figcaption>{n}</figcaption></figure>' for n, c in cells) + '</body>'
open('tools/parts/rig-test.html', 'w').write(html)
print('ok')
