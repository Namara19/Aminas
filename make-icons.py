"""Generates original placeholder app icons (Light/Dark orb with a sprout-eared Amina). Needs Pillow."""
from PIL import Image, ImageDraw, ImageFilter
import math, os
out = os.path.join(os.path.dirname(__file__), '..', 'icons'); os.makedirs(out, exist_ok=True)

def make(size, maskable=False):
    S = size * 2  # supersample
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    # background gradient (deep indigo -> violet), full-bleed
    for y in range(S):
        t = y / S; c = (int(24 + 70 * t), int(18 + 36 * t), int(70 + 90 * t), 255); d.line([(0, y), (S, y)], fill=c)
    mask = Image.new('L', (S, S), 0); md = ImageDraw.Draw(mask)
    if maskable: md.rectangle([0, 0, S, S], fill=255)
    else: md.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.22), fill=255)
    cx, cy = S // 2, int(S * 0.52); k = 0.62 if maskable else 0.78  # keep art inside the safe zone when maskable
    R = int(S * 0.34 * k / 0.78 * 0.78)
    glow = Image.new('RGBA', (S, S), (0, 0, 0, 0)); gd = ImageDraw.Draw(glow)
    gd.ellipse([cx - R * 1.5, cy - R * 1.5, cx + R * 1.5, cy + R * 1.5], fill=(255, 226, 150, 110)); glow = glow.filter(ImageFilter.GaussianBlur(S * 0.05)); img = Image.alpha_composite(img, glow)
    d = ImageDraw.Draw(img)
    # orb: left half light, right half dark
    d.ellipse([cx - R, cy - R, cx + R, cy + R], fill=(255, 233, 160, 255))
    half = Image.new('RGBA', (S, S), (0, 0, 0, 0)); hd = ImageDraw.Draw(half)
    hd.pieslice([cx - R, cy - R, cx + R, cy + R], -90, 90, fill=(74, 53, 144, 255)); img = Image.alpha_composite(img, half); d = ImageDraw.Draw(img)
    # face
    for ex in (-0.32, 0.32):
        x = cx + int(R * ex); y = cy - int(R * 0.05); r = int(R * 0.17)
        d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 255, 255, 255)); r2 = int(r * 0.7); d.ellipse([x - r2, y - r2 + 2, x + r2, y + r2 + 2], fill=(42, 32, 56, 255)); r3 = int(r * 0.28); d.ellipse([x - r2 // 2 - r3, y - r2 // 2 - r3, x - r2 // 2 + r3, y - r2 // 2 + r3], fill=(255, 255, 255, 255))
    my = cy + int(R * 0.28); d.arc([cx - int(R * .16), my - int(R * .1), cx + int(R * .16), my + int(R * .12)], 20, 160, fill=(70, 40, 80, 255), width=max(3, S // 150))
    for ex in (-0.5, 0.5):  # cheeks
        x = cx + int(R * ex); d.ellipse([x - R * .09, my - R * .06, x + R * .09, my + R * .08], fill=(255, 143, 176, 150))
    # ears: leaf (left, green) and horn (right, violet)
    d.polygon([(cx - R * .55, cy - R * .72), (cx - R * 1.0, cy - R * 1.35), (cx - R * .15, cy - R * .98)], fill=(126, 214, 106, 255))
    d.polygon([(cx + R * .55, cy - R * .72), (cx + R * 1.0, cy - R * 1.35), (cx + R * .15, cy - R * .98)], fill=(154, 120, 230, 255))
    # sparkle
    sx, sy, sr = cx, cy - int(R * 1.25), int(R * .22)
    d.polygon([(sx, sy - sr), (sx + sr * .3, sy - sr * .3), (sx + sr, sy), (sx + sr * .3, sy + sr * .3), (sx, sy + sr), (sx - sr * .3, sy + sr * .3), (sx - sr, sy), (sx - sr * .3, sy - sr * .3)], fill=(255, 245, 200, 255))
    # island base waves
    for i, a in enumerate((90, 70, 50)):
        y = int(S * (0.86 + i * 0.045)); d.arc([S * .12, y - S * .05, S * .88, y + S * .05], 200, 340, fill=(180, 220, 255, a * 2), width=max(2, S // 120))
    img.putalpha(mask)
    return img.resize((size, size), Image.LANCZOS)

make(512).save(os.path.join(out, 'icon-512.png')); make(192).save(os.path.join(out, 'icon-192.png'))
make(512, True).save(os.path.join(out, 'icon-maskable-512.png'))
ap = make(180, True).convert('RGB'); ap.save(os.path.join(out, 'apple-touch-icon.png'))  # iOS rounds corners itself; no transparency
make(32).save(os.path.join(out, 'favicon-32.png'))
print('icons written')
