import sys
from PIL import Image, ImageChops, ImageFilter, ImageOps
def diff(a_path, b_path, out_prefix):
    a = Image.open(a_path).convert('RGB'); b = Image.open(b_path).convert('RGB')
    d = ImageChops.difference(a, b); g = d.convert('L')
    hist = g.histogram(); tot = sum(hist)
    over = lambda k: sum(hist[k+1:])
    stats = {'pixels': tot, 'identical': hist[0], '>0': over(0), '>2': over(2), '>8': over(8), '>32': over(32), '>96': over(96), 'max': max(i for i, v in enumerate(hist) if v)}
    g.point(lambda v: min(255, v * 8)).save(out_prefix + '_amp.png')
    ImageOps.invert(g.point(lambda v: 255 if v > 2 else 0).filter(ImageFilter.MaxFilter(5))).save(out_prefix + '_mask.png')
    return stats
if __name__ == '__main__':
    print(diff(sys.argv[1], sys.argv[2], sys.argv[3]))
