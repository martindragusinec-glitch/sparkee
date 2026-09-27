"""Sparkee – kostra maskota (rig).

Končetiny se generují podél kostí (rameno → loket → tlapka, kyčel → koleno → chodidlo) s profilem tloušťky
změřeným z původní kresby klienta (Figma „Frame 3“, tools/parts/body_trace.json):
  ruka  = buclatý kužel, nejširší v polovině, zaoblený do kulaté tlapky
  noha  = krátká, široká nahoře, kulaté chodidlo
Trup = obrys z kresby (s nohama pro klidový postoj, nebo bez nich pro pózy s pokrčenýma nohama).
Obrys se skládá jako v logu: tahy všech dílů vespod, výplně navrch -> jednolitá silueta.

Souřadnice = narovnaný maskot (hlava z loga otočená o 24°, střed krku x=504).
"""
import math
import body_stand as B
import limb_sweep as LS   # ruce: čistý sweep (vítěz porovnání 3 konstrukcí) – kulatá tlapka, hladký obrys

INK = "#2C303C"

# profil poloviční tloušťky podél kosti (s = 0..1 od kořene ke špičce), v jednotkách maskota
# změřeno z kresby: šířka ~74/80/75/62/51 px při s = .17/.5/.67/.83/.92, měřítko 0.331
ARM_W = [(0.0, 12.0), (0.25, 12.8), (0.5, 13.2), (0.65, 12.4), (0.78, 11.2)]
ARM_CAP = 0.30          # posledních 30 % délky = kulatá tlapka
LEG_W = [(0.0, 15.5), (0.35, 14.6), (0.65, 13.2), (0.8, 12.6)]
LEG_CAP = 0.26


def _lerp_profile(prof, s):
    if s <= prof[0][0]:
        return prof[0][1]
    for (s0, w0), (s1, w1) in zip(prof, prof[1:]):
        if s0 <= s <= s1:
            k = (s - s0) / (s1 - s0)
            k = k * k * (3 - 2 * k)          # smoothstep
            return w0 + (w1 - w0) * k
    return prof[-1][1]


def _catmull(pts, n=80):
    """Hladká křivka skrz klouby (Catmull-Rom), n vzorků."""
    P = [pts[0]] + list(pts) + [pts[-1]]
    out = []
    segs = len(pts) - 1
    for i in range(segs):
        p0, p1, p2, p3 = P[i], P[i + 1], P[i + 2], P[i + 3]
        m = max(2, n // segs)
        for k in range(m):
            t = k / m
            t2, t3 = t * t, t * t * t
            out.append(tuple(0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2
                                    + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3) for j in range(2)))
    out.append(tuple(pts[-1]))
    return out


def sweep(joints, prof, cap):
    """Obrys končetiny: páteř skrz klouby, tloušťka podle profilu, kulatá špička i kořen."""
    spine = _catmull(joints)
    L = [0.0]
    for a, b in zip(spine, spine[1:]):
        L.append(L[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
    total = L[-1]
    s = [l / total for l in L]
    w_end = _lerp_profile(prof, 1 - cap)
    cap_len = cap * total

    def width(si):
        if si < 1 - cap:
            return _lerp_profile(prof, si)
        x = (si - (1 - cap)) * total / cap_len     # 0..1 přes tlapku
        # tlapka: nejdřív lehce naroste (měkký „palec“), pak kulatý konec
        bulge = 1 + 0.08 * math.sin(math.pi * min(1, x * 1.6))
        return w_end * bulge * math.sqrt(max(0.0, 1 - x * x))

    left, right = [], []
    for i, p in enumerate(spine):
        a = spine[max(0, i - 1)]
        b = spine[min(len(spine) - 1, i + 1)]
        tx, ty = b[0] - a[0], b[1] - a[1]
        tl = math.hypot(tx, ty) or 1
        nx, ny = -ty / tl, tx / tl
        w = width(s[i])
        left.append((p[0] + nx * w, p[1] + ny * w))
        right.append((p[0] - nx * w, p[1] - ny * w))
    # kulatý kořen (schovaný v trupu)
    a, b = spine[0], spine[1]
    ang = math.atan2(b[1] - a[1], b[0] - a[0])
    w0 = width(0)
    root = [(a[0] + w0 * math.cos(ang + math.pi / 2 + k * math.pi / 8), a[1] + w0 * math.sin(ang + math.pi / 2 + k * math.pi / 8))
            for k in range(1, 8)]
    # zjednodušit po polovinách (RDP na uzavřené smyčce by se zhroutil)
    half1 = B.rdp(left + [right[-1]], 0.3)
    half2 = B.rdp(right[::-1] + root + [left[0]], 0.3)
    poly = half1[:-1] + half2[:-1]
    return B.smooth(poly)


def arm_outline(joints):
    """Obrys ruky: kubická páteř přes loket, obálka kotoučů s profilem tloušťky, přesně kulatá tlapka."""
    return LS.limb(list(joints), "arm")


# ---------- kosti: klidový postoj odpovídá kresbě ----------
SH_L, SH_R = (467.0, 338.0), (541.0, 338.0)          # ramena (pod hlavou, uvnitř trupu) – z kresby
HIP_L, HIP_R = (483.0, 396.0), (525.0, 396.0)


def arm_joints(side, pose):
    """Klouby ruky pro pózu. Vrací [rameno, loket, špička]. side 'l' = divákova levá."""
    sx = -1 if side == "l" else 1
    sh = SH_L if side == "l" else SH_R
    P = lambda dx, dy: (sh[0] + sx * dx, sh[1] + dy)
    return {
        "rest":      [sh, P(20.5, 12), P(41, 24)],        # šikmo dolů jako v kresbě
        "down":      [sh, P(14, 20), P(24, 40)],          # podél těla
        "out":       [sh, P(24, 2), P(47, 0)],            # do strany (překvapení)
        "wave":      [sh, P(23, 2), P(45, -12)],          # natažená do strany, tlapka lehce nahoru – mávání
        "cheer":     [sh, P(22, -1), P(42, -17)],         # jásání (obě do strany nahoru)
        "hold":      [sh, P(22, 8), P(42, -2)],           # drží telefon před sebou
    }[pose]


def leg_joints(side, pose):
    sx = -1 if side == "l" else 1
    hip = HIP_L if side == "l" else HIP_R
    P = lambda dx, dy: (hip[0] + sx * dx, hip[1] + dy)
    return {
        "stand": [hip, P(1, 18), P(2, 38)],
        "sit":   [hip, P(14, 16), P(30, 22)],             # sedí, chodidla do stran
        "jump":  [hip, P(8, 10), P(4, 24)],
    }[pose]


# trup bez nohou (pro pózy s vlastníma nohama): obrys z kresby po kyčle + oblé bříško
def _torso_only():
    P = [tuple(p) for p in B.TRACE]
    right_side = P[20:31]            # pravé podpaží -> pravý bok (675.5, 1077.5)
    left_side = P[74:86]             # levý bok (372.5, 1071.5) -> levé podpaží
    belly = [(650, 1098), (600, 1112), (520.0, 1118), (440, 1112), (392, 1095)]
    raw = right_side + belly + left_side + [(384.0, 918.0), P[0], P[1], (645.0, 925.0)]
    return B.piece(raw, {P[20], P[85]})


TORSO_ONLY = _torso_only()

ARM_FILL = {"l": "url(#bd-arm-l)", "r": "url(#bd-arm-r)"}
TORSO_FILLS = ["url(#bd-base)", "url(#bd-blue)", "url(#bd-mint)", "url(#bd-lav)", "url(#bd-neck)"]


def body(arms=("rest", "rest"), legs=None, white=0, hold_r="", hero_wave_l=False):
    """Tělo z kostry. arms=(levá, pravá) pózy; legs=None = nohy z kresby (klidový stoj), jinak (levá, pravá).
    Každá ruka je ve skupině .m-arm-{l|r} s kloubem v rameni (lokální 0,0) – CSS/JS ji může natáčet."""
    torso = B.TORSO if legs is None else TORSO_ONLY
    parts_arms = {s: arm_outline(arm_joints(s, p)) for s, p in zip("lr", arms)}
    parts_legs = {} if legs is None else {s: sweep(leg_joints(s, p), LEG_W, LEG_CAP) for s, p in zip("lr", legs)}

    def arm_g(side, inner, cls=None, hidden=False):
        sh = SH_L if side == "l" else SH_R
        vis = ' opacity="0"' if hidden else ""
        return (f'<g transform="translate({sh[0]} {sh[1]})"><g class="{cls or "m-arm-" + side}"{vis}>'
                f'<g transform="translate({-sh[0]} {-sh[1]})">{inner}</g></g></g>')
    wave_l = arm_outline(arm_joints("l", "wave")) if hero_wave_l else None
    extra = lambda fn: arm_g("l", fn(wave_l), "m-arm-l-up", hidden=True) if wave_l else ""

    # data-limb = háček pro JS rig (assets/js/mascot.js přepočítává obrys ruky každý snímek)
    stroke = lambda d, w, c, limb="": (f'<path{f" data-limb={chr(34)}arm-{limb}{chr(34)}" if limb else ""} d="{d}" fill="none" '
                                       f'stroke="{c}" stroke-width="{w}" stroke-linejoin="round"/>')
    layers = []
    if white:
        layers.append('<g class="m-body-white">'
                      + "".join(stroke(d, white, "#fff") for d in parts_legs.values())
                      + stroke(torso, white, "#fff")
                      + "".join(arm_g(s, stroke(d, white, "#fff", s)) for s, d in parts_arms.items()) + '</g>')
    layers.append('<g class="m-body-ink">'
                  + "".join(stroke(d, 12, INK) for d in parts_legs.values())
                  + stroke(torso, 12, INK)
                  + "".join(arm_g(s, stroke(d, 12, INK, s)) for s, d in parts_arms.items())
                  + extra(lambda d: stroke(d, 12, INK)) + '</g>')
    leg_fill = "".join(f'<path d="{d}" fill="url(#bd-base)"/><path d="{d}" fill="url(#{"bd-mint" if s == "l" else "bd-lav"})"/>'
                       for s, d in parts_legs.items())
    torso_fill = "".join(f'<path d="{torso}" fill="{f}"/>' for f in TORSO_FILLS)
    arms_fill = "".join(arm_g(s, f'<path data-limb="arm-{s}" d="{d}" fill="{ARM_FILL[s]}"/>' + (hold_r if s == "r" else ""))
                        for s, d in parts_arms.items())
    arms_fill += extra(lambda d: f'<path d="{d}" fill="{ARM_FILL["l"]}"/>')
    layers.append(f'<g class="m-body-fill">{leg_fill}{torso_fill}{arms_fill}</g>')
    return f'<g class="m-body">{"".join(layers)}</g>'



def skeleton_overlay():
    """Schéma kostry: kosti (čáry) a klouby (kolečka) – pro dokumentaci ve Figmě."""
    bones = [arm_joints("l", "rest"), arm_joints("r", "rest"), leg_joints("l", "stand"), leg_joints("r", "stand"),
             [(504.0, 318.0), (504.0, 360.0), (504.0, 396.0)], [HIP_L, (504.0, 396.0), HIP_R], [SH_L, (504.0, 336.0), SH_R]]
    out = '<g class="m-rig" fill="none" stroke="#8B5FD9" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">'
    for b in bones:
        out += '<polyline points="' + " ".join(f"{x:.1f},{y:.1f}" for x, y in b) + '"/>'
    out += '</g><g fill="#fff" stroke="#2C303C" stroke-width="2.2">'
    for b in bones:
        for x, y in b:
            out += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="3.6"/>'
    return out + '</g>'
