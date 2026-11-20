import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import type { Logger } from './log.ts';

export type ApplyStatus = 'approved' | 'rejected' | 'refunded' | 'pending';

/** Registra la notificación recibida. Devuelve `duplicate` si ya fue procesada con éxito (los proveedores reintentan). */
export async function recordEvent(admin: SupabaseClient, e: {
  provider: 'mercadopago' | 'paypal'; eventId: string; type?: string; cid: string; signatureValid: boolean; payload: unknown; orderId?: string;
}): Promise<{ id: string; duplicate: boolean }> {
  const payload = JSON.stringify(e.payload ?? {}).length > 16000 ? { truncated: true } : e.payload;
  const row = { provider: e.provider, event_id: e.eventId, type: e.type, correlation_id: e.cid, signature_valid: e.signatureValid, payload, order_id: e.orderId ?? null };
  const ins = await admin.from('payment_events').insert(row).select('id').single();
  if (ins.data) return { id: ins.data.id, duplicate: false };
  const prev = await admin.from('payment_events').select('id, outcome').eq('provider', e.provider).eq('event_id', e.eventId).single();
  if (!prev.data) throw new Error(`no se pudo registrar el evento: ${ins.error?.message}`);
  if (['processed', 'ignored'].includes(prev.data.outcome)) return { id: prev.data.id, duplicate: true };
  await admin.from('payment_events').update({ correlation_id: e.cid }).eq('id', prev.data.id); // reintento de uno que falló antes
  return { id: prev.data.id, duplicate: false };
}

export async function finishEvent(admin: SupabaseClient, id: string, outcome: string, opts: { error?: string; orderId?: string } = {}) {
  await admin.from('payment_events').update({ outcome, error: opts.error ?? null, order_id: opts.orderId ?? undefined, processed_at: new Date().toISOString() }).eq('id', id);
}

export async function applyPayment(admin: SupabaseClient, log: Logger, a: {
  orderId: string; provider: 'mercadopago' | 'paypal'; paymentId: string; status: ApplyStatus; amount: number; currency: string; cid: string;
}): Promise<string> {
  const { data, error } = await admin.rpc('apply_payment_result', {
    p_order_id: a.orderId, p_provider: a.provider, p_payment_id: a.paymentId, p_status: a.status, p_amount: a.amount, p_currency: a.currency, p_cid: a.cid,
  });
  if (error) throw new Error(`apply_payment_result: ${error.message}`);
  log.info('payment applied', { order_id: a.orderId, result: data, payment_id: a.paymentId, status: a.status });
  return data as string;
}

export const isUuid = (s: unknown): s is string => typeof s === 'string' && /^[0-9a-f-]{36}$/i.test(s);

export const MP_STATUS: Record<string, ApplyStatus> = {
  approved: 'approved', rejected: 'rejected', cancelled: 'rejected', refunded: 'refunded', charged_back: 'refunded',
  pending: 'pending', in_process: 'pending', authorized: 'pending',
};
export const PAYPAL_CAPTURE_STATUS: Record<string, ApplyStatus> = { COMPLETED: 'approved', DECLINED: 'rejected', REFUNDED: 'refunded', PARTIALLY_REFUNDED: 'refunded' };
