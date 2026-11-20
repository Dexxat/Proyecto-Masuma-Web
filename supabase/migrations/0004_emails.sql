-- Mails transaccionales con patrón "outbox": el mail se encola en la MISMA transacción que el cambio de estado,
-- así nunca se pierde (aunque el proveedor de mail esté caído) y cada envío queda trazado.
create table public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  template text not null,                                   -- order_paid | order_shipped | admin_order_paid | admin_order_review
  audience text not null check (audience in ('customer','admin')),
  order_id uuid not null references public.orders on delete cascade,
  user_id uuid references auth.users on delete set null,    -- el mail del cliente se resuelve al enviar (no se copia acá)
  status text not null default 'pending' check (status in ('pending','sending','sent','dead','skipped')),
  attempts int not null default 0, next_attempt_at timestamptz not null default now(), locked_at timestamptz,
  last_error text, sent_at timestamptz, provider_message_id text, correlation_id text
);
create index on public.email_outbox (status, next_attempt_at);
create index on public.email_outbox (order_id);
alter table public.email_outbox enable row level security;
create policy "admin lee outbox" on public.email_outbox for select using (public.is_admin());

create or replace function public.enqueue_order_emails() returns trigger language plpgsql security definer set search_path = public as $$
declare cid text := nullif(current_setting('app.cid', true), '');
begin
  if new.status is not distinct from old.status then return new; end if;
  if new.status = 'paid' then
    insert into email_outbox (template, audience, order_id, user_id, correlation_id) values
      ('order_paid', 'customer', new.id, new.user_id, cid), ('admin_order_paid', 'admin', new.id, null, cid);
  elsif new.status = 'review' then
    insert into email_outbox (template, audience, order_id, user_id, correlation_id) values ('admin_order_review', 'admin', new.id, null, cid);
  elsif new.status = 'shipped' then
    insert into email_outbox (template, audience, order_id, user_id, correlation_id) values ('order_shipped', 'customer', new.id, new.user_id, cid);
  end if;
  return new;
end $$;
create trigger orders_enqueue_emails after update of status on public.orders
  for each row execute function public.enqueue_order_emails();

-- Toma un lote de mails pendientes sin pisarse con otra ejecución concurrente (skip locked).
-- También recupera los que quedaron "sending" hace más de 5 minutos (una ejecución que murió a mitad).
create or replace function public.claim_pending_emails(p_limit int default 10)
returns setof public.email_outbox language plpgsql security definer set search_path = public as $$
begin
  return query
  with c as (
    select id from email_outbox
    where (status = 'pending' and next_attempt_at <= now()) or (status = 'sending' and locked_at < now() - interval '5 minutes')
    order by created_at limit p_limit for update skip locked)
  update email_outbox e set status = 'sending', locked_at = now(), attempts = e.attempts + 1
  from c where e.id = c.id returning e.*;
end $$;
revoke all on function public.claim_pending_emails(int) from public, anon, authenticated;
grant execute on function public.claim_pending_emails(int) to service_role;

-- La vista de diagnóstico suma los mails de cada pedido (columna nueva al final).
create or replace view public.payment_trace with (security_invoker = true) as
select o.id as order_id, o.user_id, o.status, o.provider, o.provider_ref, o.provider_payment_id, o.total, o.currency,
       o.created_at, o.paid_at, o.failure_reason,
       (select jsonb_agg(to_jsonb(h) - 'order_id' order by h.at) from order_status_history h where h.order_id = o.id) as history,
       (select jsonb_agg(jsonb_build_object('at', e.received_at, 'type', e.type, 'event_id', e.event_id, 'signature_ok', e.signature_valid,
                 'outcome', e.outcome, 'error', e.error, 'cid', e.correlation_id) order by e.received_at)
          from payment_events e where e.order_id = o.id) as events,
       (select jsonb_agg(jsonb_build_object('at', m.created_at, 'template', m.template, 'audience', m.audience, 'status', m.status,
                 'attempts', m.attempts, 'error', m.last_error, 'sent_at', m.sent_at) order by m.created_at)
          from email_outbox m where m.order_id = o.id) as emails
from orders o;
