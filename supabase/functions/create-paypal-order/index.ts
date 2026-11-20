// PayPal cobra en USD: usa products.price_usd. El pedido se crea en el servidor y el usuario aprueba en PayPal.
import { HttpError, json, requireUser, serve } from '../_shared/http.ts';
import { paypal } from '../_shared/paypal.ts';

serve('create-paypal-order', async ({ req, cid, log, admin, cors }) => {
  const user = await requireUser(req);
  const site = Deno.env.get('SITE_URL')!;
  const { data, error } = await admin.rpc('create_order_from_cart', { p_user: user.id, p_provider: 'paypal', p_currency: 'USD' });
  if (error) throw new HttpError(error.message.includes('cart_invalid') ? 409 : 500, error.message.includes('cart_invalid') ? 'cart_invalid' : 'order_create_failed',
    error.message.includes('cart_invalid') ? 'Hay productos sin precio en USD o sin stock en tu carrito' : 'No se pudo crear el pedido');
  const { order_id: orderId, total } = data[0];
  const olog = log.with({ order_id: orderId });

  const r = await paypal(olog, '/v2/checkout/orders', {
    method: 'POST', requestId: orderId,                       // idempotencia: reintentar no crea otra orden
    body: {
      intent: 'CAPTURE',
      purchase_units: [{ reference_id: orderId, custom_id: orderId, invoice_id: orderId, amount: { currency_code: 'USD', value: Number(total).toFixed(2) } }],
      payment_source: { paypal: { experience_context: { return_url: `${site}/pago/resultado?order=${orderId}&provider=paypal`, cancel_url: `${site}/pago/resultado?order=${orderId}&cancelled=1`, user_action: 'PAY_NOW', shipping_preference: 'NO_SHIPPING' } } },
    },
  });
  if (!r.ok) { olog.error('paypal create failed', { status: r.status, body: r.data }); throw new HttpError(502, 'paypal_create_failed', 'No pudimos iniciar el pago con PayPal'); }
  const link = r.data.links?.find((l: { rel: string }) => ['payer-action', 'approve'].includes(l.rel))?.href;
  if (!link) throw new HttpError(502, 'paypal_no_link', 'PayPal no devolvió el enlace de pago');
  await admin.from('orders').update({ provider_ref: r.data.id }).eq('id', orderId);
  olog.info('paypal order created', { paypal_order_id: r.data.id, total });
  return json({ order_id: orderId, redirect_url: link }, cors, cid);
});
