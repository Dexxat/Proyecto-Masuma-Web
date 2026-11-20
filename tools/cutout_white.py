#!/usr/bin/env python3
"""Fondo blanco -> transparente. Solo se quita el blanco conectado al borde de la imagen: los blancos internos del
producto (letras, etiquetas, brillos) se conservan. El borde queda suavizado y sin halo blanco.
Uso: python3 tools/cutout_white.py <entrada.webp> <salida.webp>"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

def cutout(src, dst, thr=246, feather=0.9):
    im = Image.open(src).convert('RGBA')
    rgb = np.array(im)[..., :3].astype(np.float32)
    near_white = rgb.min(axis=2) >= thr
    lab, _ = ndi.label(near_white)
    border = np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]]); border = border[border != 0]
    bg = np.isin(lab, border)
    alpha = 1.0 - ndi.gaussian_filter(bg.astype(np.float32), feather)      # borde suave
    alpha = np.clip((alpha - 0.02) / 0.96, 0, 1)
    solid = (alpha > 0.98) & ~bg
    _, (iy, ix) = ndi.distance_transform_edt(~solid, return_indices=True)  # quita el halo: el borde toma el color del producto
    rgb = np.where(solid[..., None], rgb, rgb[iy, ix])
    # 4 canales => Pillow lo toma como RGBA (el parámetro 'mode' de fromarray está deprecado en Pillow 13)
    Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8)).save(dst, 'WEBP', quality=90, method=6)

if __name__ == '__main__':
    cutout(sys.argv[1], sys.argv[2])
