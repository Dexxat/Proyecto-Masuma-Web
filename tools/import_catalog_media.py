#!/usr/bin/env python3
"""Importa fotos y descripciones del catálogo del sitio anterior (descarga en design/originals/masuma-catalogo 2/).

- Convierte cada imagen a WebP (máx. 1600 px, calidad 80) en public/media/productos/<nombre>.webp.
  Las imágenes que comparten varios productos se guardan una sola vez.
- Descarta duplicados: la misma imagen repetida y las versiones achicadas por WordPress (ej. "x-671x400.jpg" cuando existe "x.jpg").
- Recorta el fondo blanco de las fotos de producto (tools/cutout_white.py) para que queden sobre el verde del sitio.
  No se recortan: planos y medidas (sus líneas no se leerían sobre fondo oscuro), imágenes ya transparentes y fotos
  ambientadas (sin borde blanco). Requiere numpy y scipy; si no están, se avisa y las fotos quedan con su fondo.
- Limpia las descripciones (encabezado "DESCRIPCIÓN", líneas vacías repetidas, links sueltos).
- Escribe docs/catalogo-medios.json: { slug: { description, images[], links[] } }. Lo lee tools/generate_catalog.py.

Uso (desde la raíz del repo): python3 tools/import_catalog_media.py ["ruta/a/masuma-catalogo 2"]
Requiere Pillow (pip install Pillow); para el recorte, numpy y scipy (pip install numpy scipy).
"""
import json, os, re, sys, unicodedata
from PIL import Image

SRC = sys.argv[1] if len(sys.argv) > 1 else 'design/originals/masuma-catalogo 2'
OUT_DIR = 'public/media/productos'
OUT_URL = 'media/productos'
MAX = 1600
DRAWING = re.compile(r'plano|medidas|meidas', re.I)   # planos y medidas: conservan el fondo blanco
NO_CUT = {'contenido3'}                                # dibujo del PC-7 con textos: tampoco se recorta

def slugify(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')

def upload_key(url):
    """'https://masuma.com.ar/wp-content/uploads/2020/04/x.jpg?...' -> '2020/04/x.jpg'"""
    m = re.search(r'uploads/(.+?)(?:\?|$)', url)
    return m.group(1) if m else None

def base_stem(key):
    """Quita el sufijo de tamaño de WordPress: 'x-671x400.jpg' -> 'x'."""
    stem = os.path.splitext(os.path.basename(key))[0]
    return re.sub(r'-\d+x\d+$', '', stem)

URL_RE = re.compile(r'https?://\S+')

def clean_description(text):
    links = URL_RE.findall(text)
    lines = [l.strip() for l in URL_RE.sub('', text).splitlines()]
    while lines and (not lines[0] or lines[0].upper() in ('DESCRIPCIÓN', 'DESCRIPCION')):
        lines.pop(0)
    out = []
    for l in lines:
        if l or (out and out[-1]):
            out.append(l)
    return '\n'.join(out).strip(), links

try:
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import numpy as np
    from cutout_white import cutout
except ImportError:
    cutout = None

def should_cut(path, name):
    """Solo fotos de producto sobre fondo blanco: sin transparencia previa y con el borde mayormente blanco."""
    if DRAWING.search(name) or name in NO_CUT:
        return False
    a = np.array(Image.open(path).convert('RGBA'))
    if (a[..., 3] < 250).mean() > 0.01:          # ya es transparente (ej. PNG de los aviones)
        return False
    rgb = a[..., :3]
    border = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
    return (border.min(axis=1) >= 246).mean() >= 0.6

def convert(src_path, name):
    """Convierte a WebP una sola vez por nombre (y recorta el fondo si corresponde); devuelve la URL pública."""
    dst = os.path.join(OUT_DIR, name + '.webp')
    if not os.path.exists(dst):
        with Image.open(src_path) as im:
            im.load()
            keep_alpha = im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info)
            im = im.convert('RGBA' if keep_alpha else 'RGB')
            im.thumbnail((MAX, MAX))
            im.save(dst, 'WEBP', quality=80, method=6)
        if cutout is None:
            global WARNED
            if not WARNED: print('Aviso: sin numpy/scipy no se recorta el fondo blanco (pip install numpy scipy).'); WARNED = True
        elif should_cut(dst, name):
            cutout(dst, dst)
    return f'{OUT_URL}/{name}.webp'
WARNED = False

def main():
    products = json.load(open(os.path.join(SRC, 'catalogo.json'), encoding='utf-8'))
    os.makedirs(OUT_DIR, exist_ok=True)
    result, missing = {}, []
    for p in products:
        slug = p['path'].rstrip('/').split('/')[-1]
        urls = [i['src'] for i in p.get('images', [])] + p.get('description_images', [])
        keys = [k for k in (upload_key(u) for u in urls) if k]
        # Una entrada por imagen "real": si hay versión completa y achicada, se queda la completa.
        chosen = {}
        for k in keys:
            stem = base_stem(k)
            is_resized = os.path.splitext(os.path.basename(k))[0] != stem
            if stem not in chosen or (chosen[stem][1] and not is_resized):
                chosen[stem] = (k, is_resized)
        images = []
        for stem, (k, _) in chosen.items():   # respeta el orden original (la primera es la principal)
            path = os.path.join(SRC, 'imagenes', k)
            if not os.path.exists(path):
                missing.append(k); continue
            images.append(convert(path, slugify(stem)))
        description, links = clean_description(p.get('description_text', ''))
        result[slug] = {'name': p['name'], 'description': description, 'images': images, 'links': links}

    json.dump(result, open('docs/catalogo-medios.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    n_img = len(os.listdir(OUT_DIR))
    print(f'{len(result)} productos · {n_img} imágenes en {OUT_DIR} · docs/catalogo-medios.json escrito')
    if missing:
        print('Faltan en la carpeta de originales:', *missing, sep='\n  ')

if __name__ == '__main__':
    main()
