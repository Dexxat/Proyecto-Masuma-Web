-- Galería de fotos por producto (foto principal, planos y medidas). image_url sigue siendo la foto principal (estante, listados).
-- Las rutas son relativas al sitio (ej. 'media/productos/7035-28.webp'); las genera tools/import_catalog_media.py.
alter table public.products add column if not exists images text[] not null default '{}';
