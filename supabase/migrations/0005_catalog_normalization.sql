-- Normalización del catálogo: tipo de producto, marca y segmento como ejes separados (antes una sola categoría mezclada).
-- Seguridad: esta migración elimina columnas antiguas; se detiene si ya hay productos cargados para no destruir datos.
do $$ begin
  if exists (select 1 from public.products) then
    raise exception 'products tiene datos: migrarlos manualmente antes de eliminar columnas antiguas';
  end if;
end $$;

create table public.product_types (id serial primary key, name text not null unique, slug text not null unique, sellable boolean not null default true, sort int not null default 0);
create table public.brands (id serial primary key, name text not null unique, slug text not null unique);
create table public.segments (id serial primary key, name text not null unique, slug text not null unique);

alter table public.products drop column category_id, drop column brand, drop column model, drop column position, drop column type;
drop table public.categories;
alter table public.products rename column sku to part_number;
alter table public.products drop constraint if exists products_sku_key;
alter table public.products
  add column brand_id int references public.brands, add column type_id int references public.product_types,
  add column attributes jsonb not null default '{}';   -- atributos técnicos según el tipo (medida, voltaje, capacidad...)
create unique index products_brand_part_uq on public.products (brand_id, part_number) where part_number is not null;
create index on public.products (type_id);
create index on public.products (brand_id);

create table public.product_segments (
  product_id int not null references public.products on delete cascade, segment_id int not null references public.segments,
  primary key (product_id, segment_id));

-- Favoritos (reemplaza la lista de deseos del sitio anterior)
create table public.favorites (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  product_id int not null references public.products on delete cascade, created_at timestamptz not null default now(),
  primary key (user_id, product_id));

alter table public.product_types enable row level security;
alter table public.brands enable row level security;
alter table public.segments enable row level security;
alter table public.product_segments enable row level security;
alter table public.favorites enable row level security;
create policy "tipos públicos" on public.product_types for select using (true);
create policy "marcas públicas" on public.brands for select using (true);
create policy "segmentos públicos" on public.segments for select using (true);
create policy "segmentos de producto públicos" on public.product_segments for select using (true);
create policy "admin gestiona tipos" on public.product_types for all using (public.is_admin()) with check (public.is_admin());
create policy "admin gestiona marcas" on public.brands for all using (public.is_admin()) with check (public.is_admin());
create policy "admin gestiona segmentos" on public.segments for all using (public.is_admin()) with check (public.is_admin());
create policy "admin gestiona segmentos de producto" on public.product_segments for all using (public.is_admin()) with check (public.is_admin());
create policy "favoritos propios" on public.favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Solo se pueden comprar productos de tipos "vendibles" (las aeronaves Pilatus son informativas).
create or replace function public.create_order_from_cart(p_user uuid, p_provider text, p_currency text)
returns table (order_id uuid, total numeric) language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_cart int; v_ok int;
begin
  select count(*) into v_cart from cart_items where user_id = p_user;
  insert into orders (user_id, provider, currency, total) values (p_user, p_provider, p_currency, 0) returning id into v_id;
  insert into order_items (order_id, product_id, name, unit_price, quantity)
    select v_id, p.id, p.name, case when p_currency = 'ARS' then p.price_ars else p.price_usd end, c.quantity
    from cart_items c join products p on p.id = c.product_id join product_types pt on pt.id = p.type_id and pt.sellable
    where c.user_id = p_user and p.active and p.stock >= c.quantity
      and (case when p_currency = 'ARS' then p.price_ars else p.price_usd end) is not null;
  get diagnostics v_ok = row_count;
  if v_cart = 0 or v_ok <> v_cart then raise exception 'cart_invalid' using errcode = 'P0001'; end if;
  update orders o set total = (select sum(unit_price * quantity) from order_items where order_items.order_id = v_id) where o.id = v_id;
  return query select o.id, o.total from orders o where o.id = v_id;
end $$;
