-- Permisos de tabla explícitos para la Data API.
-- Los proyectos nuevos de Supabase ya no dan permisos automáticos a anon/authenticated sobre las tablas creadas por SQL
-- ("permission denied for table ..."). Estos GRANT solo habilitan el acceso: QUÉ filas ve o cambia cada uno lo siguen
-- decidiendo las políticas RLS (todas las tablas tienen RLS; payment_trace es security_invoker).
-- Mínimo privilegio: cada rol recibe solo lo que el sitio usa.

grant usage on schema public to anon, authenticated, service_role;

-- Catálogo: lectura pública (RLS: solo productos activos).
grant select on public.products, public.product_types, public.brands, public.segments, public.product_segments
  to anon, authenticated;

-- Usuario con sesión: su carrito, sus favoritos, su perfil y sus pedidos (RLS: solo filas propias).
grant select, insert, update, delete on public.cart_items, public.favorites to authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.orders, public.order_items to authenticated;

-- Panel de administración (RLS: solo profiles.role = 'admin').
grant insert, update, delete on public.products, public.product_types, public.brands, public.segments, public.product_segments
  to authenticated;
grant select on public.payment_trace, public.admin_actions, public.order_status_history, public.payment_events, public.email_outbox
  to authenticated;
grant usage, select on sequence public.products_id_seq, public.product_types_id_seq, public.brands_id_seq, public.segments_id_seq
  to authenticated;

-- Función usada por el sitio para saber si mostrar el panel.
grant execute on function public.is_admin() to anon, authenticated;

-- Edge Functions (pagos, webhooks, mails): usan service_role, que saltea RLS pero igual necesita permisos de tabla.
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
