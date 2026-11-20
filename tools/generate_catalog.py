#!/usr/bin/env python3
"""Genera supabase/seed.sql y las redirecciones 301 de vercel.json a partir de docs/catalogo-normalizado.csv.
Si existe docs/catalogo-medios.json (lo crea tools/import_catalog_media.py), suma descripción y fotos de cada producto.
Uso (desde la raíz del repo): python3 tools/generate_catalog.py"""
import csv, json, os, re, unicodedata

# El orden define product_types.sort (catálogo y estante): Pilatus Aircraft primero. En bases existentes lo fija la migración 0008.
TYPES = [('Pilatus Aircraft', 'pilatus', False), ('Neumáticos', 'neumaticos', True), ('Baterías', 'baterias', True),
         ('AeroSpecialties', 'aerospecialties', True), ('Otros', 'otros', True)]
TYPE_SLUG = {n: s for n, s, _ in TYPES}
SEGMENTS = [('General', 'general'), ('Comercial', 'comercial'), ('Militar', 'militar')]
UNCONFIRMED = 'SIN CLASIFICAR'      # 2 productos Gill de "General": se cargan como Baterías pero inactivos hasta confirmar

def slugify(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')
def q(s): return "'" + str(s).replace("'", "''") + "'"

rows = list(csv.DictReader(open('docs/catalogo-normalizado.csv', encoding='utf-8')))
MEDIA = json.load(open('docs/catalogo-medios.json', encoding='utf-8')) if os.path.exists('docs/catalogo-medios.json') else {}
def arr(xs): return 'array[' + ', '.join(q(x) for x in xs) + ']::text[]' if xs else "'{}'::text[]"
def null_or(s): return q(s) if s else 'null'
brands = sorted({r['marca'] for r in rows if r['marca']})
vals, seg_vals, redirects = [], [], []
for r in rows:
    slug = r['ruta_actual'].rstrip('/').split('/')[-1]
    tipo = 'Baterías' if r['tipo_de_producto'] == UNCONFIRMED else r['tipo_de_producto']
    active = r['tipo_de_producto'] != UNCONFIRMED
    m = MEDIA.get(slug, {}); imgs = m.get('images', [])
    video = next((l for l in m.get('links', []) if re.search(r'youtu\.?be|vimeo', l)), '')
    vals.append(f"({q(slug)}, {q(r['nombre_sugerido'])}, {q(TYPE_SLUG[tipo])}, {q(slugify(r['marca']))}, {str(active).lower()}, "
                f"{null_or(m.get('description'))}, {null_or(imgs[0] if imgs else '')}, {arr(imgs)}, {null_or(video)})")
    for sg in filter(None, r['segmento'].split('/')):
        seg_vals.append(f"({q(slug)}, {q(slugify(sg))})")
    old = '/productos/' + r['ruta_actual'].rstrip('/')
    for src in (old, old + '/'):
        redirects.append({'source': src, 'destination': f'/productos/{slug}', 'permanent': True})

sql = f"""-- Generado por tools/generate_catalog.py desde docs/catalogo-normalizado.csv (no editar a mano).
-- Carga nombre, tipo, marca y segmento; y, desde docs/catalogo-medios.json, la descripción y las fotos del sitio anterior.
-- Precios, stock y números de parte los completa la empresa desde el panel.
-- Si el producto ya existe, la descripción y las fotos solo se completan cuando están vacías (no pisa lo editado en el panel).
insert into public.product_types (name, slug, sellable, sort) values
{(','+chr(10)).join(f"  ({q(n)}, {q(s)}, {str(sell).lower()}, {i+1})" for i, (n, s, sell) in enumerate(TYPES))}
on conflict (slug) do nothing;

insert into public.segments (name, slug) values
{(','+chr(10)).join(f"  ({q(n)}, {q(s)})" for n, s in SEGMENTS)}
on conflict (slug) do nothing;

insert into public.brands (name, slug) values
{(','+chr(10)).join(f"  ({q(b)}, {q(slugify(b))})" for b in brands)}
on conflict (slug) do nothing;

insert into public.products (slug, name, type_id, brand_id, active, description, image_url, images, video_url)
select v.slug, v.name, t.id, b.id, v.active, v.description, v.image_url, v.images, v.video_url
from (values
{(','+chr(10)).join('  ' + v for v in vals)}
) as v(slug, name, type_slug, brand_slug, active, description, image_url, images, video_url)
join public.product_types t on t.slug = v.type_slug
left join public.brands b on b.slug = v.brand_slug
on conflict (slug) do update set
  description = coalesce(public.products.description, excluded.description),
  image_url = coalesce(public.products.image_url, excluded.image_url),
  images = case when cardinality(public.products.images) = 0 then excluded.images else public.products.images end,
  video_url = coalesce(public.products.video_url, excluded.video_url);

insert into public.product_segments (product_id, segment_id)
select p.id, s.id from (values
{(','+chr(10)).join('  ' + v for v in seg_vals)}
) as v(product_slug, segment_slug)
join public.products p on p.slug = v.product_slug
join public.segments s on s.slug = v.segment_slug
on conflict do nothing;
"""
open('supabase/seed.sql', 'w', encoding='utf-8').write(sql)

# Redirecciones de páginas y categorías del sitio anterior
def both(src, dst): return [{'source': s, 'destination': dst, 'permanent': True} for s in (src, src + '/')]
# Las secciones institucionales viven en el home (single page): /#nosotros, /#productos, /#contacto.
pages = [('/quienes_somos', '/#nosotros'), ('/servicios', '/#nosotros'), ('/novedades', '/#nosotros'),
         ('/mi-cuenta', '/ingresar'), ('/como-comprar', '/como-comprar'), ('/anulacion-de-compra', '/como-comprar#arrepentimiento'),
         ('/trabaje-con-nosotros', '/#trabaje-con-nosotros'), ('/terminos-y-condiciones', '/legales/terminos'),
         ('/politica-de-privacidad', '/legales/privacidad'), ('/promo', '/#productos')]
pages = [p for p in pages if p[0] != p[1]]
cats = {'neumaticos': 'neumaticos', 'baterias-aeronauticas': 'baterias', 'productos-powervamp-aerospecialties': 'aerospecialties', 'otros': 'otros', 'pilatus-aircraft': 'pilatus'}
brand_sub = {('neumaticos', 'goodyear'): 'goodyear', ('neumaticos', 'aeroclassic'): 'aeroclassic', ('neumaticos', 'sta'): 'specialty-tire-of-america-sta',
             ('baterias-aeronauticas', 'gill'): 'gill', ('baterias-aeronauticas', 'concorde'): 'concorde'}
cat_r = []
for (c, sub), marca in brand_sub.items():
    cat_r.append({'source': f'/categoria-producto/{c}/{sub}/:rest*', 'destination': f'/catalogo?tipo={cats[c]}&marca={marca}', 'permanent': True})
for c, t in cats.items():
    cat_r.append({'source': f'/categoria-producto/{c}/:rest*', 'destination': f'/catalogo?tipo={t}', 'permanent': True})
cat_r.append({'source': '/categoria-producto/:rest*', 'destination': '/#productos', 'permanent': True})
extra = [x for s, d in pages for x in both(s, d)]

v = json.load(open('vercel.json'))
v['redirects'] = cat_r + extra + redirects
json.dump(v, open('vercel.json', 'w'), indent=2, ensure_ascii=False); open('vercel.json', 'a').write('\n')
print(f'{len(rows)} productos, {len(brands)} marcas, {len(seg_vals)} segmentos asignados, {len(v["redirects"])} redirecciones')
