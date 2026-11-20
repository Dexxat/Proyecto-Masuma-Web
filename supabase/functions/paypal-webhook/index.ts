// Red de seguridad: si el usuario cierra el navegador antes de volver, este webhook confirma igual el pago.
import { HttpError, json, serve } from '../_shared/http.ts';
import { applyPayment, finishEvent, isUuid, recordEvent } from '../_shared/payments.ts';
import { paypal, verifyPaypalWebhook } from '../_shared/paypal.ts';
import { flushEmails } from '../_shared/outbox.ts';

serve('paypal-webhook', async ({ req, cid, log, admin, cors }) => {
  const event = await req.json().catch(() => ({}));
  const valid = await verifyPaypalWebhook(log, req.headers, event);
  const ev = await recordEvent(admin, { provider: 'paypal', eventId: String(event?.id ?? crypto.randomUUID()), type: event?.event_type, cid, signatureValid: valid, payload: event });
  if (!valid) { await finishEvent(admin, ev.id, 'rejected_signature'); log.warn('invalid signature', { event_id: event?.id }); throw new HttpError(401, 'invalid_signature', 'Firma inválida'); }
  if (ev.duplicate) return json({ ok: true, duplicate: true }, cors, cid);

  try {
    const type = event.event_type as string;
    if (!['PAYMENT.CAPTURE.COMPLETED', 'PAYMENT.CAPTURE.DENIED'].includes(type)) { await finishEvent(admin, ev.id, 'ignored'); return json({ ok: true, ignored: type }, cors, cid); }
    // Releemos la captura desde PayPal en vez de confiar en el cuerpo del evento.
    const cap = await paypal(log, `/v2/payments/captures/${encodeURIComponent(event.resource.id)}`);
    if (!cap.ok) throw new Error(`PayPal captures ${cap.status}`);
    const orderId = cap.data.custom_id;
    if (!isUuid(orderId)) { await finishEvent(admin, ev.id, 'ignored', { error: 'custom_id inválido' }); return json({ ok: true }, cors, cid); }
    const status = cap.data.status === 'COMPLETED' ? 'approved' : cap.data.status === 'DECLINED' ? 'rejected' : 'pending';
    const result = status === 'pending' ? 'ignored_pending' : await applyPayment(admin, log.with({ order_id: orderId }), { orderId, provider: 'paypal', paymentId: cap.data.id, status, amount: Number(cap.data.amount.value), currency: cap.data.amount.currency_code, cid });
    await finishEvent(admin, ev.id, result.startsWith('ignored') ? 'ignored' : 'processed', { orderId, error: ['paid', 'already_processed', 'failed', 'ignored', 'ignored_pending'].includes(result) ? undefined : result });
    await flushEmails(admin, log);
    return json({ ok: true, result }, cors, cid);
  } catch (e) {
    await finishEvent(admin, ev.id, 'error', { error: e instanceof Error ? e.message : String(e) });
    throw e;
  }
});
