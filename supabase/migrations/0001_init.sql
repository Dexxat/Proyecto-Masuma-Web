-- MASUMA: esquema inicial con Row Level Security. Ejecutar con `supabase db push`.
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text, phone text, role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz default now()
);
create table public.categories (id serial primary key, name text not null, slug text unique not null);
create table public.products (
  id serial primary key, slug text unique not null, name text not null, sku text unique,
  description text, brand text, model text, position text, type text,
  price_ars numeric(12,2),            -- null = consultar precio
  stock int not null default 0, image_url text,
  category_id int references public.categories, active boolean not null default true,
  created_at timestamptz default now()
);
create table public.cart_items (
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  product_id int not null references public.products on delete cascade,
  quantity int not null check (quantity between 1 and 99),
  primary key (user_id, product_id)
);
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users,
  status text not null default 'pending' check (status in ('pending','paid','failed','cancelled','shipped')),
  provider text check (provider in ('mercadopago','paypal')), provider_ref text,
  total_ars numeric(12,2) not null, shipping jsonb, created_at timestamptz default now()
);
create table public.order_items (
  order_id uuid references public.orders on delete cascade, product_id int references public.products,
  name text not null, unit_price numeric(12,2) not null, quantity int not null, primary key (order_id, product_id)
);

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') $$;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public
as $$ begin insert into public.profiles (id) values (new.id); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "catálogo público" on public.categories for select using (true);
create policy "productos activos públicos" on public.products for select using (active or public.is_admin());
create policy "admin gestiona categorías" on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy "admin gestiona productos" on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy "perfil propio (lectura)" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "perfil propio (edición)" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid() and role = 'customer');
create policy "carrito propio" on public.cart_items for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "pedidos propios" on public.orders for select using (user_id = auth.uid() or public.is_admin());
create policy "items de pedidos propios" on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));
-- Los pedidos y su estado de pago SOLO los escriben las Edge Functions con service_role (no hay política de insert/update).
