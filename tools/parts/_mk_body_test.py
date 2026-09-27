import sys, pathlib
sys.path.insert(0, 'tools')
import body_stand as B
src = open('tools/compose_mascot.py').read()
cut = src.index('out = ROOT / "assets/img/poses"')
ns = {'__file__': str(pathlib.Path('tools/compose_mascot.py').resolve())}
exec(compile(src[:cut], 'compose_head', 'exec'), ns)
head, upright, DEFS_INNER, EXTRA_DEFS, HEAD_D = ns['head'], ns['upright'], ns['DEFS_INNER'], ns['EXTRA_DEFS'], ns['HEAD_D']
def mk(inner, vb="370 30 272 470", h=470):
    return (f'<svg viewBox="{vb}" xmlns="http://www.w3.org/2000/svg" style="height:{h}px;background:#fff">'
            f'<defs>{DEFS_INNER}{EXTRA_DEFS}{B.BODY_DEFS}<path id="m-head-shape" d="{HEAD_D}"/></defs>{inner}</svg>')
sh = '<ellipse cx="504" cy="452" rx="58" ry="8" fill="#2C303C" opacity=".12"/>'
ov = (f'<image href="/assets/figma/orig/r1.png" x="{B.NX-B.X0*B.S}" y="{B.NY-B.Y0*B.S}" width="{1024*B.S}" height="{1536*B.S}" opacity=".35"/>')
def fore(svg, deg):
    return svg.replace('class="m-fore-l"', f'class="m-fore-l" transform="rotate({deg})"')
cells = [('wave 0', mk(sh + B.body(up_l=True) + upright(head("happy")))),
         ('wave -20', mk(sh + fore(B.body(up_l=True), -20) + upright(head("happy")))),
         ('wave +8', mk(sh + fore(B.body(up_l=True), 8) + upright(head("happy")))),
         ('zoom', mk(sh + B.body(up_l=True) + upright(head("happy")), "380 250 130 130", 470)),
         ('cheer', mk(sh + B.body(up_l=True, up_r=True) + upright(head("happy"))))]
extra = sys.argv[1] if len(sys.argv) > 1 else ''
html = '<!doctype html><body style="margin:0;background:#F6F4EF;display:flex;gap:14px;padding:14px;font:13px system-ui">' + ''.join(
    f'<figure style="margin:0">{c}<figcaption>{n}</figcaption></figure>' for n, c in cells) + '</body>'
open('tools/parts/body-test.html', 'w').write(html)
print('ok')
