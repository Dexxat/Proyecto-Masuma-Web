// El usuario vuelve de PayPal: el SERVIDOR captura el pago (el navegador nunca puede "declarar" que pagó).
import { HttpError, json, requireUser, serve } from '../_shared/http.ts';
import { applyPayment, isUuid } from '../_shared/payments.ts';
import { paypal } from '../_shared/paypal.ts';
import { flushEmails } from '../_shared/outbox.ts';

serve('capture-paypal-order', async ({ req, cid, log, admin, cors }) => {
  const user = await requireUser(req);
  const { order_id: orderId } = await req.json().catch(() => ({}));
  if (!isUuid(orderId)) throw new HttpError(400, 'bad_request', 'Pedido inválido');
  const olog = log.with({ order_id: orderId });

  const { data: order } = await admin.from('orders').select('id,user_id,provider,provider_ref,status').eq('id', orderId).single();
  if (!order || order.user_id !== user.id || order.provider !== 'paypal' || !order.provider_ref) throw new HttpError(404, 'order_not_found', 'Pedido no encontrado');
  if (['paid', 'shipped'].includes(order.status)) return json({ status: order.status }, cors, cid);

  let cap = await paypal(olog, `/v2/checkout/orders/${order.provider_ref}/capture`, { method: 'POST', requestId: `capture-${orderId}` });
  if (!cap.ok && cap.data?.details?.[0]?.issue === 'ORDER_ALREADY_CAPTURED') cap = await paypal(olog, `/v2/checkout/orders/${order.provider_ref}`);
  if (!cap.ok) { olog.warn('paypal capture failed', { status: cap.status, body: cap.data }); throw new HttpError(402, 'capture_failed', 'PayPal no pudo completar el pago'); }

  const c = cap.data.purchase_units?.[0]?.payments?.captures?.[0];
  if (cap.data.status !== 'COMPLETED' || c?.status !== 'COMPLETED') { olog.info('capture not completed', { order_status: cap.data.status, capture_status: c?.status }); return json({ status: 'pending' }, cors, cid, 202); }
  const result = await applyPayment(admin, olog, { orderId, provider: 'paypal', paymentId: c.id, status: 'approved', amount: Number(c.amount.value), currency: c.amount.currency_code, cid });
  await flushEmails(admin, olog);
  return json({ status: result }, cors, cid);
});
