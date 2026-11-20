-- Orden de los tipos de producto en el catálogo y en el estante (menor = primero). Pilatus Aircraft encabeza.
update public.product_types set sort = case slug
  when 'pilatus'         then 1
  when 'neumaticos'      then 2
  when 'baterias'        then 3
  when 'aerospecialties' then 4
  when 'otros'           then 5
  else sort end;

-- Video del producto (ej. YouTube del PC-24). Lo completa seed.sql desde docs/catalogo-medios.json.
alter table public.products add column if not exists video_url text;
