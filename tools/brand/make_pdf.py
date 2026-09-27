#!/usr/bin/env python3
"""Složí brand manuál do jednoho PDF z vektorových exportů sekcí z Figmy.

Vstup:
  --layout layout.json   výstup use_figma: [{id, name, w, h, slides:[{id,name,x,y}]}] (x/y relativně k sekci)
  --dir DIR              složka se soubory sec_<id s ':'→'-'>.pdf (download_assets defaultFormat=pdf na SECTION)
  --out OUT.pdf
Figma exportuje sekci s okrajem 40 pt (stránka = w+80 × h+80), slide = 1920×1080 pt.
Každý slide = kopie stránky sekce s mediaboxem/cropboxem na výřez slidu (vektor, žádný rastr).
"""
import argparse, json, os
from pypdf import PdfReader, PdfWriter
from pypdf.generic import RectangleObject

ap = argparse.ArgumentParser()
ap.add_argument('--layout', required=True); ap.add_argument('--dir', required=True); ap.add_argument('--out', required=True)
ap.add_argument('--off', type=float, default=40.0)
ap.add_argument('--light', help='volitelně: lehká verze (JPEG stránky 2880 px, q 82) do tohoto souboru')
a = ap.parse_args()
layout = json.load(open(a.layout))
w = PdfWriter()
page_no = 0
for sec in layout:
    src = os.path.join(a.dir, 'sec_' + sec['id'].replace(':', '-') + '.pdf')
    r = PdfReader(src)
    H = float(r.pages[0].mediabox.height)
    first = None
    for s in sec['slides']:
        p = w.add_page(r.pages[0])
        llx = a.off + s['x']; lly = H - (a.off + s['y'] + 1080)
        box = RectangleObject([llx, lly, llx + 1920, lly + 1080])
        p.mediabox = box; p.cropbox = box; p.trimbox = box; p.artbox = box
        if first is None: first = page_no
        page_no += 1
    w.add_outline_item(sec['name'], first)
w.add_metadata({'/Title': 'Sparkee · Brand manuál v1.0', '/Author': 'Sparkee'})
w.compress_identical_objects(remove_duplicates=True, remove_unreferenced=True)
os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
with open(a.out, 'wb') as f: w.write(f)
print(f'{page_no} stran → {a.out} ({os.path.getsize(a.out)/1e6:.1f} MB)')

if a.light:
    import subprocess, tempfile, glob
    from PIL import Image
    r = PdfReader(a.out); tmp = tempfile.mkdtemp()
    imgs = []
    for i, pg in enumerate(r.pages):
        one = os.path.join(tmp, f'p{i:03d}.pdf'); ww = PdfWriter(); ww.add_page(pg); ww.write(one)
        subprocess.run(['qlmanage', '-t', '-s', '2880', '-o', tmp, one], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        im = Image.open(one + '.png').convert('RGB'); imgs.append(im)
    imgs[0].save(a.light, 'PDF', resolution=144.0, save_all=True, append_images=imgs[1:], quality=82)
    print(f'lehká verze → {a.light} ({os.path.getsize(a.light)/1e6:.1f} MB)')
