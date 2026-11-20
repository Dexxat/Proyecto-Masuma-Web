// Crea el pedido (precios desde la base) y la preferencia de Checkout Pro. El usuario paga en Mercado Pago: nunca vemos la tarjeta.
import { HttpError, json, requireUser, serve } from '../_shared/http.ts';

serve('create-mercadopago-payment', async ({ req, cid, log, admin, cors }) => {
  const user = await requireUser(req);
  const site = Deno.env.get('SITE_URL')!;

  const { data, error } = await admin.rpc('create_order_from_cart', { p_user: user.id, p_provider: 'mercadopago', p_currency: 'ARS' });
  if (error) throw new HttpError(error.message.includes('cart_invalid') ? 409 : 500, error.message.includes('cart_invalid') ? 'cart_invalid' : 'order_create_failed',
    error.message.includes('cart_invalid') ? 'Hay productos sin precio o sin stock en tu carrito' : 'No se pudo crear el pedido');
  const { order_id: orderId, total } = data[0];
  const olog = log.with({ order_id: orderId });
  const { data: items } = await admin.from('order_items').select('name, unit_price, quantity').eq('order_id', orderId);

  const r = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: { Authorization: `Bearer ${Deno.env.get('MP_ACCESS_TOKEN')}`, 'Content-Type': 'application/json', 'X-Idempotency-Key': orderId },
    body: JSON.stringify({
      external_reference: orderId,                                // así volvemos del pago al pedido
      items: items!.map(i => ({ title: i.name, quantity: i.quantity, unit_price: Number(i.unit_price), currency_id: 'ARS' })),
      back_urls: { success: `${site}/pago/resultado?order=${orderId}`, pending: `${site}/pago/resultado?order=${orderId}`, failure: `${site}/pago/resultado?order=${orderId}` },
      auto_return: 'approved',
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`,
      statement_descriptor: 'MASUMA',
    }),
  });
  const pref = await r.json();
  if (!r.ok) { olog.error('mp preference failed', { status: r.status, body: pref }); throw new HttpError(502, 'mp_preference_failed', 'No pudimos iniciar el pago con Mercado Pago'); }

  await admin.from('orders').update({ provider_ref: pref.id }).eq('id', orderId);
  olog.info('preference created', { preference_id: pref.id, total });
  const url = Deno.env.get('MP_SANDBOX') === 'true' ? pref.sandbox_init_point : pref.init_point;
  return json({ order_id: orderId, redirect_url: url }, cors, cid);
});
