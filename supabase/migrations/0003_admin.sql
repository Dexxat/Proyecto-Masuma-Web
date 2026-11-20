-- Administración: toda acción de un admin queda auditada, y los cambios de estado pasan por una función que valida el rol.
create table public.admin_actions (
  id bigserial primary key, at timestamptz not null default now(),
  admin_id uuid references auth.users on delete set null, action text not null,
  order_id uuid references public.orders on delete set null, detail jsonb, correlation_id text, result text
);
create index on public.admin_actions (order_id);
alter table public.admin_actions enable row level security;
create policy "admin lee auditoría" on public.admin_actions for select using (public.is_admin());
-- (sin políticas de escritura: solo escriben la función SQL de abajo y las Edge Functions con service_role)

-- El admin puede marcar "enviado" o "cancelado". Marcar "pagado" a mano NO existe: un pago solo se confirma desde el proveedor.
create or replace function public.admin_set_order_status(p_order uuid, p_status text, p_reason text, p_cid text)
returns text language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_status not in ('shipped', 'cancelled') then raise exception 'status_not_allowed' using errcode = 'P0001'; end if;
  perform set_config('app.cid', coalesce(p_cid, ''), true);
  update orders set status = p_status, failure_reason = nullif(trim(coalesce(p_reason, '')), '') where id = p_order;
  if not found then raise exception 'order_not_found' using errcode = 'P0001'; end if;
  insert into admin_actions (admin_id, action, order_id, detail, correlation_id, result)
  values (auth.uid(), 'set_status', p_order, jsonb_build_object('status', p_status, 'reason', p_reason), p_cid, 'ok');
  return p_status;
end $$;
revoke all on function public.admin_set_order_status(uuid, text, text, text) from public, anon;
grant execute on function public.admin_set_order_status(uuid, text, text, text) to authenticated;
