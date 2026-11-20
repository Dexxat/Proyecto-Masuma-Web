#!/usr/bin/env python3
"""Unifica el color de las fotos de «Nosotros»: mapa de degradé azul acero (50 %) + color original atenuado (50 %).
Uso: python3 tools/grade_nosotros.py foto1.jpg foto2.jpg ...   -> public/media/nosotros/nosotros-1.webp, nosotros-2.webp ...
Las fotos se numeran en el orden dado. Requiere numpy y Pillow."""
import sys
import numpy as np
from PIL import Image

STOPS = np.array([[0x0b, 0x14, 0x26], [0x2f, 0x4a, 0x72], [0x8f, 0xa6, 0xc6], [0xf1, 0xf4, 0xfa]], float) / 255
POS = np.array([0, .35, .72, 1.0])
MIX, KEEP = 0.50, 0.55      # MIX: peso del degradé (más = más uniforme); KEEP: color original conservado (más = más color)

def grade(im):
    a = np.asarray(im.convert('RGB'), float) / 255
    lum = a @ np.array([.299, .587, .114])
    lo, hi = np.percentile(lum, [1, 99])
    ln = np.clip((lum - lo) / (hi - lo), 0, 1); ln = 0.5 * ln + 0.5 * ln ** 0.9     # nivela la exposición entre fotos
    mapped = np.stack([np.interp(ln, POS, STOPS[:, c]) for c in range(3)], -1)
    desat = ln[..., None] + (a - lum[..., None]) * KEEP
    return Image.fromarray((np.clip(MIX * mapped + (1 - MIX) * np.clip(desat, 0, 1), 0, 1) * 255).astype('uint8'))

for i, f in enumerate(sys.argv[1:], 1):
    im = Image.open(f); im.thumbnail((2200, 2200))
    grade(im).save(f'public/media/nosotros/nosotros-{i}.webp', quality=80, method=6); print('ok', i, f)
