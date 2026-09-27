"""Připraví pózy maskota pro import do Figmy: rozbalí <use href> na skutečné cesty, doplní width/height.
Výstup: assets/figma-export/<poza>.svg
"""
import re, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
src_dir, out_dir = ROOT / "assets/img/poses", ROOT / "assets/figma-export"
out_dir.mkdir(exist_ok=True)
ORDER = ["stand", "phone", "wave", "phone-wave", "happy", "surprised", "sticker", "lie", "peek", "head", "rig"]
for i, name in enumerate(ORDER):
    t = (src_dir / f"{name}.svg").read_text()
    shapes = {m.group(1): m.group(0) for m in re.finditer(r'<path id="([^"]+)" d="[^"]+"\s*/>', t)}
    def inline(m):
        attrs, ref = m.group(1) + m.group(3), m.group(2)
        base = shapes[ref]
        d = re.search(r' d="([^"]+)"', base).group(1)
        return f'<path d="{d}"{attrs}/>'
    t = re.sub(r'<use((?:\s+[a-z-]+="[^"]*")*?)\s+href="#([^"]+)"((?:\s+[a-z-]+="[^"]*")*)\s*/>', inline, t)
    assert "<use" not in t, name
    # odstranit definice použitých tvarů (už jsou inline)
    for ref, el in shapes.items():
        t = t.replace(el, "")
    vb = [float(v) for v in re.search(r'viewBox="([^"]+)"', t).group(1).split()]
    w, h = vb[2] * 2 + i, vb[3] * 2  # 2× + unikátní šířka kvůli identifikaci po importu
    t = t.replace("<svg ", f'<svg width="{w:g}" height="{h:g}" ', 1)
    t = re.sub(r' class="[^"]*"', "", t)
    (out_dir / f"{name}.svg").write_text(t)
    print(name, round(w), round(h), len(t))
