import { HttpError } from './http.ts';
import type { Logger } from './log.ts';

const base = () => Deno.env.get('PAYPAL_ENV') === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
let cached: { token: string; exp: number } | null = null;

async function token(): Promise<string> {
  if (cached && cached.exp > Date.now() + 30_000) return cached.token;
  const basic = btoa(`${Deno.env.get('PAYPAL_CLIENT_ID')}:${Deno.env.get('PAYPAL_CLIENT_SECRET')}`);
  const r = await fetch(`${base()}/v1/oauth2/token`, { method: 'POST', headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=client_credentials' });
  if (!r.ok) throw new HttpError(502, 'paypal_auth_failed', 'No se pudo autenticar con PayPal');
  const j = await r.json();
  cached = { token: j.access_token, exp: Date.now() + j.expires_in * 1000 };
  return cached.token;
}

/** Llamada a la API de PayPal. `requestId` activa la idempotencia (PayPal-Request-Id): reintentar no duplica el cobro. */
export async function paypal(log: Logger, path: string, opts: { method?: string; body?: unknown; requestId?: string } = {}) {
  const headers: Record<string, string> = { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' };
  if (opts.requestId) headers['PayPal-Request-Id'] = opts.requestId;
  const r = await fetch(`${base()}${path}`, { method: opts.method ?? 'GET', headers, body: opts.body ? JSON.stringify(opts.body) : undefined });
  const text = await r.text();
  const data = text ? JSON.parse(text) : {};
  // debug_id es el código que soporte de PayPal necesita para investigar un problema: lo dejamos en el log.
  log.info('paypal call', { path, status: r.status, paypal_debug_id: r.headers.get('paypal-debug-id') });
  return { status: r.status, ok: r.ok, data };
}

/** Verifica la firma del webhook con el endpoint oficial de PayPal. Requiere el cuerpo ORIGINAL ya parseado y el PAYPAL_WEBHOOK_ID. */
export async function verifyPaypalWebhook(log: Logger, headers: Headers, event: unknown): Promise<boolean> {
  const body = {
    auth_algo: headers.get('paypal-auth-algo'), cert_url: headers.get('paypal-cert-url'), transmission_id: headers.get('paypal-transmission-id'),
    transmission_sig: headers.get('paypal-transmission-sig'), transmission_time: headers.get('paypal-transmission-time'),
    webhook_id: Deno.env.get('PAYPAL_WEBHOOK_ID'), webhook_event: event,
  };
  if (Object.values(body).some(v => !v)) return false;
  const r = await paypal(log, '/v1/notifications/verify-webhook-signature', { method: 'POST', body });
  return r.ok && r.data.verification_status === 'SUCCESS';
}
