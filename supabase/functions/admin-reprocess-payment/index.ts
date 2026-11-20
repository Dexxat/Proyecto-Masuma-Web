// Reprocesa un pedido consultando el estado REAL del pago al proveedor (por si un webhook se perdió o falló).
// No permite "marcar como pagado" a mano: solo aplica lo que el proveedor confirma. Queda auditado en admin_actions.
import { HttpError, json, requireAdmin, serve } from '../_shared/http.ts';
import { applyPayment, isUuid, MP_STATUS, PAYPAL_CAPTURE_STATUS } from '../_shared/payments.ts';
import { paypal } from '../_shared/paypal.ts';
import { flushEmails } from '../_shared/outbox.ts';

serve('admin-reprocess-payment', async ({ req, cid, log, admin, cors }) => {
  const adminUser = await requireAdmin(req, admin);
  const { order_id: orderId } = await req.json().catch(() => ({}));
  if (!isUuid(orderId)) throw new HttpError(400, 'bad_request', 'Pedido inválido');
  const olog = log.with({ order_id: orderId, admin_id: adminUser.id });

  const { data: order } = await admin.from('orders').select('id, provider, provider_ref, provider_payment_id, status').eq('id', orderId).single();
  if (!order) throw new HttpError(404, 'order_not_found', 'Pedido no encontrado');

  let paymentId: string, status: string | undefined, amount: number, currency: string;
  if (order.provider === 'mercadopago') {
    const r = await fetch(`https://api.mercadopago.com/v1/payments/search?external_reference=${orderId}&sort=date_created&criteria=desc`, { headers: { Authorization: `Bearer ${Deno.env.get('MP_ACCESS_TOKEN')}` } });
    if (!r.ok) throw new HttpError(502, 'mp_api_error', `Mercado Pago respondió ${r.status}`);
    const results: any[] = (await r.json()).results ?? [];
    const p = results.find(x => x.status === 'approved') ?? results[0];
    if (!p) throw new HttpError(404, 'no_payment_found', 'Mercado Pago no tiene pagos para este pedido');
    ({ id: paymentId, currency_id: currency } = { id: String(p.id), currency_id: p.currency_id });
    status = MP_STATUS[p.status]; amount = Number(p.transaction_amount);
  } else if (order.provider === 'paypal' && order.provider_ref) {
    const r = await paypal(olog, `/v2/checkout/orders/${order.provider_ref}`);
    if (!r.ok) throw new HttpError(502, 'paypal_api_error', `PayPal respondió ${r.status}`);
    const c = r.data.purchase_units?.[0]?.payments?.captures?.[0];
    if (!c) throw new HttpError(404, 'no_payment_found', 'PayPal no tiene capturas para este pedido');
    paymentId = c.id; status = PAYPAL_CAPTURE_STATUS[c.status]; amount = Number(c.amount.value); currency = c.amount.currency_code;
  } else throw new HttpError(409, 'no_provider', 'El pedido no tiene un pago iniciado');

  const result = !status || status === 'pending' ? 'ignored_pending' : await applyPayment(admin, olog, { orderId, provider: order.provider, paymentId, status: status as never, amount, currency, cid });
  await admin.from('admin_actions').insert({ admin_id: adminUser.id, action: 'reprocess_payment', order_id: orderId, correlation_id: cid, result, detail: { provider: order.provider, payment_id: paymentId, provider_status: status ?? 'unknown' } });
  await flushEmails(admin, olog);
  return json({ result }, cors, cid);
});
