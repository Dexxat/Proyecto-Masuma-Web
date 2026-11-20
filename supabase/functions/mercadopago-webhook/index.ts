// Recibe notificaciones de Mercado Pago. Regla de oro: la notificación solo AVISA; el estado real se consulta a la API de MP.
import { HttpError, json, serve } from '../_shared/http.ts';
import { verifyMpSignature } from '../_shared/mp-signature.ts';
import { applyPayment, finishEvent, isUuid, MP_STATUS, recordEvent } from '../_shared/payments.ts';
import { flushEmails } from '../_shared/outbox.ts';

serve('mercadopago-webhook', async ({ req, cid, log, admin, cors }) => {
  const url = new URL(req.url);
  const body = await req.json().catch(() => ({}));
  const dataId = url.searchParams.get('data.id') ?? body?.data?.id?.toString() ?? null;
  const type = url.searchParams.get('type') ?? body?.type ?? null;
  const eventId = String(body?.id ?? `${type}:${dataId}`);

  // 1) ¿Lo envió Mercado Pago? (firma HMAC con el secreto del webhook)
  const sig = await verifyMpSignature({ xSignature: req.headers.get('x-signature'), xRequestId: req.headers.get('x-request-id'), dataId: url.searchParams.get('data.id'), secret: Deno.env.get('MP_WEBHOOK_SECRET') ?? '' });
  const ev = await recordEvent(admin, { provider: 'mercadopago', eventId, type, cid, signatureValid: sig.ok, payload: body });
  if (!sig.ok) {
    await finishEvent(admin, ev.id, 'rejected_signature', { error: sig.reason });
    log.warn('invalid signature', { reason: sig.reason, event_id: eventId });
    throw new HttpError(401, 'invalid_signature', 'Firma inválida');
  }
  if (ev.duplicate) return json({ ok: true, duplicate: true }, cors, cid);
  if (type !== 'payment' || !dataId) { await finishEvent(admin, ev.id, 'ignored'); return json({ ok: true, ignored: type }, cors, cid); }

  try {
    // 2) Estado real del pago, directo de la API de MP (no confiamos en el cuerpo del webhook).
    const r = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(dataId)}`, { headers: { Authorization: `Bearer ${Deno.env.get('MP_ACCESS_TOKEN')}` } });
    if (!r.ok) throw new Error(`MP API ${r.status}`);   // error transitorio → 500 → MP reintenta
    const p = await r.json();
    const orderId = p.external_reference;
    const olog = log.with({ order_id: orderId, payment_id: p.id, mp_status: p.status, mp_status_detail: p.status_detail });
    if (!isUuid(orderId)) { olog.warn('external_reference inválido'); await finishEvent(admin, ev.id, 'ignored', { error: 'external_reference inválido' }); return json({ ok: true }, cors, cid); }

    const mapped = MP_STATUS[p.status] ?? 'pending';
    const result = mapped === 'pending' ? 'ignored_pending' : await applyPayment(admin, olog, { orderId, provider: 'mercadopago', paymentId: String(p.id), status: mapped, amount: Number(p.transaction_amount), currency: p.currency_id, cid });
    await finishEvent(admin, ev.id, result.startsWith('ignored') ? 'ignored' : 'processed', { orderId, error: ['paid', 'already_processed', 'failed', 'ignored', 'ignored_pending'].includes(result) ? undefined : result });
    await flushEmails(admin, olog);
    return json({ ok: true, result }, cors, cid);
  } catch (e) {
    await finishEvent(admin, ev.id, 'error', { error: e instanceof Error ? e.message : String(e) });
    throw e;   // 500: MP reintenta y recordEvent vuelve a procesar porque el evento quedó en 'error'
  }
});
