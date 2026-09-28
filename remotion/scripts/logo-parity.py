#!/usr/bin/env python3
"""Pixel diff of two renders (PIL only).

usage: logo-parity.py A.png B.png [--bg=#F6F4EF] [--amp=out_amp.png]

Transparent PNGs are composited over --bg first (so alpha fringes are compared as they will be seen).
Prints max / mean channel difference (0-255) and the share of pixels that differ by more than 0, 2, 8, 32.
"""
import json
import sys

from PIL import Image, ImageChops, ImageStat


def flat(path, bg):
    im = Image.open(path).convert("RGBA")
    base = Image.new("RGBA", im.size, bg)
    return Image.alpha_composite(base, im).convert("RGB")


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    opts = dict(a[2:].split("=", 1) for a in sys.argv[1:] if a.startswith("--"))
    bg = opts.get("bg", "#F6F4EF")
    a, b = flat(args[0], bg), flat(args[1], bg)
    if a.size != b.size:
        print(json.dumps({"error": f"size {a.size} vs {b.size}"}))
        sys.exit(1)
    d = ImageChops.difference(a, b)
    per_ch_max = max(hi for _, hi in d.getextrema())
    mean = sum(ImageStat.Stat(d).mean) / 3
    g = d.convert("L")
    hist = g.histogram()
    tot = sum(hist)
    share = lambda k: round(100 * sum(hist[k + 1 :]) / tot, 4)
    out = {
        "size": a.size,
        "max": per_ch_max,
        "mean": round(mean, 4),
        "pct_gt0": share(0),
        "pct_gt2": share(2),
        "pct_gt8": share(8),
        "pct_gt32": share(32),
    }
    if "amp" in opts:
        g.point(lambda v: min(255, v * 8)).save(opts["amp"])
    print(json.dumps(out))


if __name__ == "__main__":
    main()
