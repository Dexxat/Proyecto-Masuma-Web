-- Pagos: estado de pedidos auditable, idempotencia de webhooks, descuento de stock atómico.
alter table public.products add column price_usd numeric(12,2);   -- PayPal cobra en USD (confirmar moneda con la cuenta de PayPal)
alter table public.orders rename column total_ars to total;
alter table public.orders drop constraint orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending','paid','failed','cancelled','shipped','review'));
alter table public.orders
  add column currency text not null default 'ARS' check (currency in ('ARS','USD')),
  add column provider_payment_id text, add column paid_at timestamptz, add column failure_reason text;
create unique index orders_provider_ref_uq on public.orders (provider, provider_ref) where provider_ref is not null;

-- 1) Eventos recibidos de MP/PayPal: uno por notificación, con su resultado. Sirve de idempotencia y de bitácora.
create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  received_at timestamptz not null default now(),
  provider text not null check (provider in ('mercadopago','paypal')),
  event_id text not null,                 -- id único de la notificación del proveedor
  type text, correlation_id text, order_id uuid references public.orders on delete set null,
  signature_valid boolean not null, payload jsonb,
  outcome text not null default 'received', -- received | processed | ignored | duplicate | error | rejected_signature
  error text, processed_at timestamptz,
  unique (provider, event_id)
);
create index on public.payment_events (order_id);
create index on public.payment_events (correlation_id);

-- 2) Historial de estados de cada pedido (lo escribe un trigger: nadie puede olvidarse de registrarlo).
create table public.order_status_history (
  id bigserial primary key, order_id uuid not null references public.orders on delete cascade,
  from_status text, to_status text not null, reason text, correlation_id text, at timestamptz not null default now()
);
create index on public.order_status_history (order_id);

create or replace function public.track_order_status() returns trigger language plpgsql as $$
declare cid text := nullif(current_setting('app.cid', true), '');
begin
  if tg_op = 'INSERT' then
    insert into order_status_history (order_id, from_status, to_status, reason, correlation_id)
    values (new.id, null, new.status, 'created', cid);
  elsif new.status is distinct from old.status then
    if not ( (old.status = 'pending'   and new.status in ('paid','failed','cancelled','review'))
          or (old.status = 'failed'    and new.status in ('paid','review','cancelled'))
          or (old.status = 'paid'      and new.status in ('shipped','review'))
          or (old.status = 'review'    and new.status in ('paid','cancelled','shipped'))
          or (old.status = 'cancelled' and new.status = 'review')
          or (old.status = 'shipped'   and new.status = 'review') ) then
      raise exception 'invalid_order_transition % -> %', old.status, new.status using errcode = 'P0001';
    end if;
    insert into order_status_history (order_id, from_status, to_status, reason, correlation_id)
    values (new.id, old.status, new.status, new.failure_reason, cid);
  end if;
  return new;
end $$;
create trigger orders_track_status after insert or update of status on public.orders
  for each row execute function public.track_order_status();

-- 3) Crear el pedido desde el carrito: los precios salen SIEMPRE de products, todo en una transacción.
create or replace function public.create_order_from_cart(p_user uuid, p_provider text, p_currency text)
returns table (order_id uuid, total numeric) language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_cart int; v_ok int;
begin
  select count(*) into v_cart from cart_items where user_id = p_user;
  insert into orders (user_id, provider, currency, total) values (p_user, p_provider, p_currency, 0) returning id into v_id;
  insert into order_items (order_id, product_id, name, unit_price, quantity)
    select v_id, p.id, p.name, case when p_currency = 'ARS' then p.price_ars else p.price_usd end, c.quantity
    from cart_items c join products p on p.id = c.product_id
    where c.user_id = p_user and p.active and p.stock >= c.quantity
      and (case when p_currency = 'ARS' then p.price_ars else p.price_usd end) is not null;
  get diagnostics v_ok = row_count;
  if v_cart = 0 or v_ok <> v_cart then raise exception 'cart_invalid' using errcode = 'P0001'; end if;
  update orders o set total = (select sum(unit_price * quantity) from order_items where order_items.order_id = v_id) where o.id = v_id;
  return query select o.id, o.total from orders o where o.id = v_id;
end $$;

-- 4) Aplicar el resultado de un pago. Idempotente: llamarla 2 veces con el mismo pago no duplica nada.
create or replace function public.apply_payment_result(
  p_order_id uuid, p_provider text, p_payment_id text, p_status text, p_amount numeric, p_currency text, p_cid text)
returns text language plpgsql security definer set search_path = public as $$
declare o orders;
begin
  perform set_config('app.cid', coalesce(p_cid, ''), true);
  select * into o from orders where id = p_order_id for update;
  if not found then return 'order_not_found'; end if;
  if o.provider is distinct from p_provider then return 'provider_mismatch'; end if;

  if p_status = 'approved' then
    if o.status in ('paid','shipped') then return 'already_processed'; end if;
    if o.currency <> p_currency or abs(o.total - p_amount) > 0.01 then
      update orders set status = 'review', failure_reason = format('amount_mismatch: pagado %s %s, esperado %s %s', p_amount, p_currency, o.total, o.currency),
        provider_payment_id = p_payment_id where id = o.id;
      return 'amount_mismatch';
    end if;
    perform 1 from products where id in (select product_id from order_items where order_id = o.id) order by id for update;
    if exists (select 1 from order_items oi join products p on p.id = oi.product_id where oi.order_id = o.id and p.stock < oi.quantity) then
      update orders set status = 'review', failure_reason = 'sin_stock_luego_del_pago', provider_payment_id = p_payment_id where id = o.id;
      return 'review_no_stock';
    end if;
    update products p set stock = p.stock - oi.quantity from order_items oi where oi.order_id = o.id and p.id = oi.product_id;
    update orders set status = 'paid', provider_payment_id = p_payment_id, paid_at = now(), failure_reason = null where id = o.id;
    delete from cart_items where user_id = o.user_id;
    return 'paid';
  elsif p_status = 'rejected' then
    if o.status = 'pending' then
      update orders set status = 'failed', failure_reason = 'pago_rechazado', provider_payment_id = p_payment_id where id = o.id;
      return 'failed';
    end if;
    return 'ignored';
  elsif p_status = 'refunded' then
    if o.status in ('paid','shipped') then
      update orders set status = 'review', failure_reason = 'pago_reembolsado_o_contracargo' where id = o.id;
      return 'review_refund';
    end if;
    return 'ignored';
  end if;
  return 'ignored';
end $$;

revoke all on function public.create_order_from_cart(uuid, text, text) from public, anon, authenticated;
revoke all on function public.apply_payment_result(uuid, text, text, text, numeric, text, text) from public, anon, authenticated;
grant execute on function public.create_order_from_cart(uuid, text, text) to service_role;
grant execute on function public.apply_payment_result(uuid, text, text, text, numeric, text, text) to service_role;

-- 5) Seguridad de las tablas nuevas: solo admin lee; escribe únicamente service_role (Edge Functions).
alter table public.payment_events enable row level security;
alter table public.order_status_history enable row level security;
create policy "admin lee eventos" on public.payment_events for select using (public.is_admin());
create policy "historial propio" on public.order_status_history for select
  using (public.is_admin() or exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()));

-- 6) Vista de diagnóstico: todo lo que pasó con un pedido, en una sola fila.
create view public.payment_trace with (security_invoker = true) as
select o.id as order_id, o.user_id, o.status, o.provider, o.provider_ref, o.provider_payment_id, o.total, o.currency,
       o.created_at, o.paid_at, o.failure_reason,
       (select jsonb_agg(to_jsonb(h) - 'order_id' order by h.at) from order_status_history h where h.order_id = o.id) as history,
       (select jsonb_agg(jsonb_build_object('at', e.received_at, 'type', e.type, 'event_id', e.event_id, 'signature_ok', e.signature_valid,
                 'outcome', e.outcome, 'error', e.error, 'cid', e.correlation_id) order by e.received_at)
          from payment_events e where e.order_id = o.id) as events
from orders o;
