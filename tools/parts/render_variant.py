"""Harness: vykreslí list póz maskota s alternativní konstrukcí končetin.

Použití (z kořene sparkee-web):
  python3 tools/parts/render_variant.py tools/parts/variants/<name>.py /abs/out.png

Varianta (.py) může definovat:
  limb(joints, kind) -> SVG path d  (kind 'arm' | 'leg'; joints = [(x,y), ...] kořen -> špička, souřadnice maskota)
  arm_joints(side, pose) -> list kloubů   (volitelně – jinak rig.arm_joints)
Bez varianty ('-') se použije aktuální rig.py.
"""
import sys, pathlib, importlib.util, re, subprocess
ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools"))
import rig as R, body_stand as B

var_path, out_png = sys.argv[1], sys.argv[2]
name = "current"
if var_path != "-":
    spec = importlib.util.spec_from_file_location("variant", var_path)
    V = importlib.util.module_from_spec(spec); spec.loader.exec_module(V)
    name = pathlib.Path(var_path).stem
    if hasattr(V, "limb"):
        R.sweep = lambda joints, prof, cap: V.limb(list(joints), "arm" if prof is R.ARM_W else "leg")
    if hasattr(V, "arm_joints"):
        R.arm_joints = V.arm_joints

src = (ROOT / "tools/compose_mascot.py").read_text()
cut = src.index("VB_STAND =")
ns = {"__file__": str(ROOT / "tools/compose_mascot.py")}
exec(compile(src[:cut], "compose", "exec"), ns)
fig, svgf, phone_hold, SHADOW = ns["fig"], ns["svg"], ns["phone_hold"], ns["SHADOW"]

def cell(label, inner, vb="374 39 264 427", h=380):
    s = svgf(inner, vb).replace("<svg ", f'<svg style="height:{h}px;background:#fff" ', 1)
    return f'<figure style="margin:0">{s}<figcaption>{label}</figcaption></figure>'

cells = [
    cell("rest", SHADOW + fig()),
    cell("phone (hold)", SHADOW + fig(arms=("rest", "hold"), hold_r=phone_hold())),
    cell("wave", SHADOW + fig("happy", arms=("wave", "rest"))),
    cell("cheer", SHADOW + fig("happy", arms=("cheer", "cheer"))),
    cell("out", SHADOW + fig("surprised", arms=("out", "out"))),
    cell("down", SHADOW + fig(arms=("down", "down"))),
    cell("ZOOM rest L", fig(), "400 310 110 90", 300),
    cell("ZOOM wave L", fig("happy", arms=("wave", "rest")), "390 290 120 100", 300),
    cell("ZOOM rest R", fig(), "500 310 110 90", 300),
]
html = ('<!doctype html><body style="margin:0;background:#F6F4EF;display:flex;flex-wrap:wrap;gap:10px;padding:10px;font:13px system-ui">'
        f'<h3 style="width:100%;margin:0">{name}</h3>' + "".join(cells) + "</body>")
out_html = ROOT / f"tools/parts/variants/_{name}.html"
out_html.write_text(html)
url = f"http://localhost:8770/tools/parts/variants/_{name}.html"
subprocess.run([str(ROOT / "tools/shot.sh"), "1420", "860", out_png, url], capture_output=True)
print("rendered", out_png, "from", url)
