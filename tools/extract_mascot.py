"""Extract mascot parts (head, face, flame, sparkle) from Figma logo SVG into reusable SVG fragments."""
import re, xml.etree.ElementTree as ET, pathlib
NS = "http://www.w3.org/2000/svg"
ET.register_namespace("", NS)
root_dir = pathlib.Path(__file__).resolve().parent.parent
src = ET.parse(root_dir / "assets/figma/logo-full.svg").getroot()
q = lambda t: f"{{{NS}}}{t}"
byid = {el.get("id"): el for el in src.iter() if el.get("id")}
def s(el):
    txt = ET.tostring(el, encoding="unicode")
    return re.sub(r' xmlns="[^"]+"', "", txt)
parts = {
    "flame_outline": byid["Vector_4"],
    "flame_fill": byid["Group_5"],
    "head_base": byid["Head base"],
    "cheek_l": byid["Vector_15"], "cheek_r": byid["Vector_16"],
    "hl_1": byid["Vector_17"], "hl_2": byid["Vector_18"],
    "mouth": byid["Group_12"],
    "eye_r": byid["Group_13"], "eye_l": byid["Group_14"],
    "sparkle": byid["Union"],
}
defs = byid.get("paint0_linear_0_1")
defs_el = [el for el in src.iter(q("defs"))][0]
out = []
for k, el in parts.items():
    out.append(f"<!-- {k} -->\n{s(el)}")
defs_txt = "".join(s(c) for c in defs_el if c.tag != q("clipPath"))
(root_dir / "tools/parts").mkdir(exist_ok=True)
for k, el in parts.items():
    (root_dir / f"tools/parts/{k}.svgfrag").write_text(s(el))
(root_dir / "tools/parts/defs.svgfrag").write_text(defs_txt)
preview = f'<svg xmlns="{NS}" viewBox="360 40 760 360" width="1520" height="720"><defs>{defs_txt}</defs>' + "".join(out) + "</svg>"
(root_dir / "tools/parts/preview.svg").write_text(preview)
print({k: len(s(v)) for k, v in parts.items()}, len(defs_txt))
