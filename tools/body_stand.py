"""Stojící tělo Sparkee maskota – vektorizované z původního konceptu (Figma, skrytý „Frame 3“ /
ChatGPT Image 25. 1. 2026), rozdělené na díly: trup (+ nohy), levá a pravá ruka.

Obrys vzniká stejně jako v logu: tahy (stroke) všech dílů pod sebou, bílé výplně navrch -> jednolitá silueta,
štěrbiny v podpaží zůstanou tmavé. Ruce mají kulatý kloub kolem otočného bodu, takže jdou natáčet bez švů.
"""
import json, math, pathlib

HERE = pathlib.Path(__file__).resolve().parent
TRACE = json.loads((HERE / "parts/body_trace.json").read_text())   # obrys těla v px konceptu (1024×1536)

# umístění pod hlavu (souřadnice narovnaného maskota): střed krku konceptu (516.5, 878.5) -> (504, 322.5)
S = 0.36
SXT = 0.80    # zeštíhlení trupu a nohou (jen do šířky)
SA = 0.92     # ruce o kousek menší (stejnoměrně kolem kloubu)
X0, Y0, NX, NY = 516.5, 878.5, 504.0, 322.5
T = lambda p: (round(NX + (p[0] - X0) * S * SXT, 2), round(NY + (p[1] - Y0) * S, 2))


def T_arm(pivot):
    """Ruka: kloub se posune s trupem, tvar ruky se škáluje stejnoměrně kolem kloubu."""
    px, py = T(pivot)
    return lambda p: (round(px + (p[0] - pivot[0]) * S * SA, 2), round(py + (p[1] - pivot[1]) * S * SA, 2))

# klouby (v px konceptu)
PIVOT_R = (645.0, 925.0)   # divákova pravá ruka
PIVOT_L = (388.0, 918.0)   # divákova levá ruka


def rdp(P, eps):
    if len(P) < 3:
        return P
    a, z = P[0], P[-1]
    dx, dy = z[0] - a[0], z[1] - a[1]
    L = math.hypot(dx, dy) or 1
    md, mi = 0, 0
    for i in range(1, len(P) - 1):
        dd = abs(dy * P[i][0] - dx * P[i][1] + z[0] * a[1] - z[1] * a[0]) / L
        if dd > md:
            md, mi = dd, i
    if md > eps:
        return rdp(P[:mi + 1], eps)[:-1] + rdp(P[mi:], eps)
    return [a, z]


def arc(c, p_from, p_to, ccw, steps=10):
    """Body oblouku kolem c od p_from do p_to (bez krajních bodů)."""
    a1 = math.atan2(p_from[1] - c[1], p_from[0] - c[0])
    a2 = math.atan2(p_to[1] - c[1], p_to[0] - c[0])
    r = (math.hypot(p_from[0] - c[0], p_from[1] - c[1]) + math.hypot(p_to[0] - c[0], p_to[1] - c[1])) / 2
    if ccw:   # na obrazovce proti směru hodin = úhel klesá
        while a2 > a1:
            a2 -= 2 * math.pi
    else:
        while a2 < a1:
            a2 += 2 * math.pi
    return [(c[0] + r * math.cos(a1 + (a2 - a1) * k / steps), c[1] + r * math.sin(a1 + (a2 - a1) * k / steps))
            for k in range(1, steps)]


def smooth(P, corners=()):
    """Uzavřená hladká cesta přes body P (Catmull-Rom → kubické Bézierky), rohy zůstanou ostré."""
    n = len(P)
    unit = lambda v: (v[0] / (math.hypot(*v) or 1), v[1] / (math.hypot(*v) or 1))
    out = f"M{P[0][0]:.2f} {P[0][1]:.2f}"
    for i in range(n):
        p0, p1, p2, p3 = P[i - 1], P[i], P[(i + 1) % n], P[(i + 2) % n]
        seg = math.hypot(p2[0] - p1[0], p2[1] - p1[1]) * 0.36
        t1 = (0, 0) if i in corners else unit((p2[0] - p0[0], p2[1] - p0[1]))
        t2 = (0, 0) if (i + 1) % n in corners else unit((p3[0] - p1[0], p3[1] - p1[1]))
        c1 = (p1[0] + t1[0] * seg, p1[1] + t1[1] * seg)
        c2 = (p2[0] - t2[0] * seg, p2[1] - t2[1] * seg)
        out += f"C{c1[0]:.2f} {c1[1]:.2f} {c2[0]:.2f} {c2[1]:.2f} {p2[0]:.2f} {p2[1]:.2f}"
    return out + "Z"


def piece(raw_pts, sharp_raw, eps=1.6, tf=None):
    """raw body (px konceptu) -> zjednodušit, převést do souřadnic maskota, vyhladit; sharp = rohy."""
    tf = tf or T
    # rdp po úsecích mezi ostrými body, ať rohy zůstanou přesně
    idx = sorted(set(i for i, p in enumerate(raw_pts) if tuple(p) in sharp_raw) | {0, len(raw_pts) - 1})
    simp = []
    for a, b in zip(idx, idx[1:]):
        simp += rdp(raw_pts[a:b + 1], eps)[:-1]
    simp.append(raw_pts[-1])
    pts = [tf(p) for p in simp]
    corners = {i for i, p in enumerate(simp) if tuple(p) in sharp_raw}
    return smooth(pts, corners)


P = [tuple(p) for p in TRACE]
APEX_R, APEX_L = P[20], P[85]           # vrcholy štěrbin v podpaží
SH_R, SH_L = P[2], P[104]               # ramena (schovaná pod hlavou)
TOP_L, TOP_R = P[0], P[1]

# pravá ruka: rameno -> tlapka -> spodek -> podpaží + kloubový oblouk dovnitř trupu
arm_r_raw = P[2:21] + arc(PIVOT_R, APEX_R, SH_R, ccw=False)
ARM_R = piece(arm_r_raw, {APEX_R, SH_R}, tf=T_arm(PIVOT_R))
# levá ruka: podpaží -> spodek -> tlapka -> vršek -> rameno + oblouk
arm_l_raw = P[85:105] + arc(PIVOT_L, SH_L, APEX_L, ccw=False)
ARM_L = piece(arm_l_raw, {APEX_L, SH_L}, tf=T_arm(PIVOT_L))
# trup + nohy: pravé podpaží -> nohy -> levé podpaží, nahoře uzavřít schovaně pod rukama/hlavou
torso_raw = P[20:86] + [(384.0, 918.0), TOP_L, TOP_R, (645.0, 925.0)]
TORSO = piece(torso_raw, {APEX_R, APEX_L, P[44], P[55], P[56], P[60]})

PIV_R, PIV_L = T(PIVOT_R), T(PIVOT_L)

BODY_DEFS = """
<linearGradient id="bd-base" x1="504" y1="322" x2="504" y2="434" gradientUnits="userSpaceOnUse">
  <stop stop-color="#FFFFFF"/><stop offset=".62" stop-color="#FBFAFE"/><stop offset="1" stop-color="#EEEBF8"/>
</linearGradient>
<radialGradient id="bd-blue" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(500 392) scale(46 34)">
  <stop stop-color="#D5DCF5" stop-opacity=".45"/><stop offset="1" stop-color="#D5DCF5" stop-opacity="0"/>
</radialGradient>
<radialGradient id="bd-lav" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(548 412) scale(38 30)">
  <stop stop-color="#DDD0F5" stop-opacity=".6"/><stop offset="1" stop-color="#DDD0F5" stop-opacity="0"/>
</radialGradient>
<radialGradient id="bd-mint" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(456 400) scale(30 40)">
  <stop stop-color="#E0F6EB" stop-opacity=".9"/><stop offset="1" stop-color="#E0F6EB" stop-opacity="0"/>
</radialGradient>
<radialGradient id="bd-neck" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(504 338) scale(52 14)">
  <stop stop-color="#DDD0F5" stop-opacity=".7"/><stop offset="1" stop-color="#DDD0F5" stop-opacity="0"/>
</radialGradient>
<linearGradient id="bd-arm-l" x1="456" y1="340" x2="410" y2="372" gradientUnits="userSpaceOnUse">
  <stop stop-color="#FFFFFF"/><stop offset=".55" stop-color="#F3FAF6"/><stop offset="1" stop-color="#E0F6EB"/>
</linearGradient>
<linearGradient id="bd-arm-up" x1="462" y1="350" x2="412" y2="300" gradientUnits="userSpaceOnUse">
  <stop stop-color="#FFFFFF"/><stop offset=".55" stop-color="#F3FAF6"/><stop offset="1" stop-color="#E0F6EB"/>
</linearGradient>
<linearGradient id="bd-arm-up-r" x1="546" y1="350" x2="596" y2="300" gradientUnits="userSpaceOnUse">
  <stop stop-color="#FFFFFF"/><stop offset=".5" stop-color="#EAE3F7"/><stop offset="1" stop-color="#F5E8F0"/>
</linearGradient>
<linearGradient id="bd-arm-r" x1="552" y1="340" x2="596" y2="372" gradientUnits="userSpaceOnUse">
  <stop stop-color="#FFFFFF"/><stop offset=".5" stop-color="#EAE3F7"/><stop offset="1" stop-color="#F5E8F0"/>
</linearGradient>
"""

INK = "#2C303C"


def _limb(cls, d, pivot, fill, deg=0, extra=""):
    """Díl ruky: translate(kloub) > rotate(póza) > .m-arm-* (animace z CSS/Remotion) > translate(-kloub)."""
    px, py = pivot
    return (f'<g transform="translate({px} {py}) rotate({deg})"><g class="{cls}">'
            f'<g transform="translate({-px} {-py})">{fill(d)}{extra}</g></g></g>')


def arm_local(final_pt, pivot, deg):
    """Kam dát v nenatočených souřadnicích ruky bod, aby po natočení ruky o deg skončil ve final_pt."""
    a = math.radians(-deg)
    dx, dy = final_pt[0] - pivot[0], final_pt[1] - pivot[1]
    return (round(pivot[0] + dx * math.cos(a) - dy * math.sin(a), 2), round(pivot[1] + dx * math.sin(a) + dy * math.cos(a), 2))


def body(arm_l=0, arm_r=0, white=0, hold_r="", up_l=False, up_r=False, hero_wave_l=False):
    """Stojící tělo. arm_l/arm_r = natočení rukou ve stupních (záporné = nahoru u pravé, kladné = nahoru u levé).
    white = šířka bílého sticker okraje (0 = bez)."""
    ink = lambda d: f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="12" stroke-linejoin="round"/>'
    wht = lambda d: f'<path d="{d}" fill="none" stroke="#fff" stroke-width="{white}" stroke-linejoin="round"/>'
    fill_t = lambda d: (f'<path d="{d}" fill="url(#bd-base)"/><path d="{d}" fill="url(#bd-blue)"/>'
                        f'<path d="{d}" fill="url(#bd-mint)"/><path d="{d}" fill="url(#bd-lav)"/><path d="{d}" fill="url(#bd-neck)"/>')
    fill_l = lambda d: f'<path d="{d}" fill="url(#bd-arm-l)"/>'
    fill_r = lambda d: f'<path d="{d}" fill="url(#bd-arm-r)"/>'
    layers = []
    up_fill = {"l": "bd-arm-up", "r": "bd-arm-up-r"}
    f_ink = lambda d, side=None: ink(d)
    f_wht = lambda d, side=None: wht(d)
    f_fill = lambda d, side: f'<path d="{d}" fill="url(#{up_fill[side]})"/>'

    def left(kind):
        fn = {"ink": ink, "wht": wht, "fill": fill_l}[kind]
        bfn = {"ink": f_ink, "wht": f_wht, "fill": f_fill}[kind]
        shine = _bent("l")[3] if kind == "fill" else ""
        out = ""
        if not up_l:
            out += _limb("m-arm-l", ARM_L, PIV_L, fn, arm_l)
        if up_l or hero_wave_l:
            vis = ' opacity="0"' if (hero_wave_l and not up_l) else ""
            out += f'<g class="m-arm-l-up"{vis}>{bent_arm("l", bfn, -14, shine)}</g>'
        return out

    def right(kind):
        fn = {"ink": ink, "wht": wht, "fill": fill_r}[kind]
        bfn = {"ink": f_ink, "wht": f_wht, "fill": f_fill}[kind]
        if up_r:
            shine = _bent("r")[3] if kind == "fill" else ""
            return f'<g class="m-arm-r-up">{bent_arm("r", bfn, 14, shine)}</g>'
        return _limb("m-arm-r", ARM_R, PIV_R, fn, arm_r, hold_r if kind == "fill" else "")

    if white:
        layers.append(f'<g class="m-body-white">{left("wht")}{wht(TORSO)}{right("wht")}</g>')
    layers.append(f'<g class="m-body-ink">{left("ink")}{ink(TORSO)}{right("ink")}</g>')
    layers.append(f'<g class="m-body-fill">{fill_t(TORSO)}{left("fill")}{right("fill")}</g>')
    return f'<g class="m-body">{"".join(layers)}</g>'


if __name__ == "__main__":
    print("pivots", PIV_L, PIV_R)
    print(len(TORSO), len(ARM_L), len(ARM_R))


# ---------- zdvižená ruka na mávání (kreslená zvlášť, ve stylu těla) ----------
def _ellipse(cx, cy, rx, ry, rot=0.0):
    """Elipsa jako 4 kubické oblouky, po směru hodin (na obrazovce) – kvůli sjednocení výplní (nonzero)."""
    k = 0.5523
    a = math.radians(rot)
    ca, sa = math.cos(a), math.sin(a)
    P = lambda x, y: (cx + x * ca - y * sa, cy + x * sa + y * ca)
    pts = [(0, -ry), (rx, 0), (0, ry), (-rx, 0)]
    ctr = [((k * rx, -ry), (rx, -k * ry)), ((rx, k * ry), (k * rx, ry)), ((-k * rx, ry), (-rx, k * ry)), ((-rx, -k * ry), (-k * rx, -ry))]
    s = P(*pts[0])
    d = f"M{s[0]:.2f} {s[1]:.2f}"
    for i in range(4):
        c1, c2, e = P(*ctr[i][0]), P(*ctr[i][1]), P(*pts[(i + 1) % 4])
        d += f"C{c1[0]:.2f} {c1[1]:.2f} {c2[0]:.2f} {c2[1]:.2f} {e[0]:.2f} {e[1]:.2f}"
    return d + "Z"


def _capsule(p1, p2, r1, r2):
    """Zužující se „párek“ z p1 (poloměr r1) do p2 (r2), po směru hodin."""
    ang = math.atan2(p2[1] - p1[1], p2[0] - p1[0])
    nx, ny = -math.sin(ang), math.cos(ang)          # normála
    ux, uy = math.cos(ang), math.sin(ang)
    a1 = (p1[0] + nx * r1, p1[1] + ny * r1); b1 = (p1[0] - nx * r1, p1[1] - ny * r1)
    a2 = (p2[0] + nx * r2, p2[1] + ny * r2); b2 = (p2[0] - nx * r2, p2[1] - ny * r2)
    k = 0.5523
    d = f"M{b1[0]:.2f} {b1[1]:.2f}L{b2[0]:.2f} {b2[1]:.2f}"
    # půlkruh na konci p2 (b2 -> špička -> a2)
    tip = (p2[0] + ux * r2, p2[1] + uy * r2)
    d += (f"C{b2[0] + ux * k * r2:.2f} {b2[1] + uy * k * r2:.2f} {tip[0] - nx * k * r2:.2f} {tip[1] - ny * k * r2:.2f} {tip[0]:.2f} {tip[1]:.2f}"
          f"C{tip[0] + nx * k * r2:.2f} {tip[1] + ny * k * r2:.2f} {a2[0] + ux * k * r2:.2f} {a2[1] + uy * k * r2:.2f} {a2[0]:.2f} {a2[1]:.2f}")
    d += f"L{a1[0]:.2f} {a1[1]:.2f}"
    tail = (p1[0] - ux * r1, p1[1] - uy * r1)
    d += (f"C{a1[0] - ux * k * r1:.2f} {a1[1] - uy * k * r1:.2f} {tail[0] + nx * k * r1:.2f} {tail[1] + ny * k * r1:.2f} {tail[0]:.2f} {tail[1]:.2f}"
          f"C{tail[0] - nx * k * r1:.2f} {tail[1] - ny * k * r1:.2f} {b1[0] - ux * k * r1:.2f} {b1[1] - uy * k * r1:.2f} {b1[0]:.2f} {b1[1]:.2f}Z")
    return d


# ---------- pokrčená ruka na mávání: nadloktí z boku těla, předloktí nahoru, tlapka vedle hlavy ----------
# (součást siluety těla – kreslí se ve vrstvách těla, takže obrys splyne; předloktí se točí v lokti)
MIRROR_X = 1008.0                # osa souměrnosti těla (x = 504)
BENT_L = dict(shoulder=(462.0, 350.0), elbow=(430.0, 345.0), wrist=(417.0, 318.0), paw=(413.5, 306.0))


def _bent(side="l"):
    g = dict(BENT_L)
    if side == "r":
        g = {k: (MIRROR_X - v[0], v[1]) for k, v in g.items()}
    sh, el, wr, pw = g["shoulder"], g["elbow"], g["wrist"], g["paw"]
    upper = _capsule(sh, el, 9.2, 8.2)
    rot = math.degrees(math.atan2(pw[0] - wr[0], -(pw[1] - wr[1])))
    fore = _capsule(el, wr, 8.2, 7.4) + _ellipse(pw[0], pw[1], 10.6, 12.2, rot)
    dx, dy = pw[0] - wr[0], pw[1] - wr[1]
    L = math.hypot(dx, dy) or 1
    d = (dx / L, dy / L)
    n = (d[1], -d[0]) if side == "l" else (-d[1], d[0])
    shine = (f'<path d="M{pw[0] + n[0] * 4 - d[0] * 4:.2f} {pw[1] + n[1] * 4 - d[1] * 4:.2f}'
             f'L{pw[0] + n[0] * 5.2 + d[0] * 0.5:.2f} {pw[1] + n[1] * 5.2 + d[1] * 0.5:.2f}" '
             f'fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>')
    return upper, fore, el, shine


def bent_arm(side, fn, fore_deg=0, extra=""):
    """Pokrčená ruka v jedné vrstvě (tah/výplň podle fn). Předloktí = .m-fore-{side}, kloub v lokti = lokální 0,0."""
    upper, fore, (ex, ey), shine = _bent(side)
    return (f'{fn(upper, side)}<g transform="translate({ex} {ey}) rotate({fore_deg})"><g class="m-fore-{side}">'
            f'<g transform="translate({-ex} {-ey})">{fn(fore, side)}{extra}</g></g></g>')
