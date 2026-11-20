// Validación de la firma de webhooks de Mercado Pago (HMAC-SHA256 del "manifest").
// Documentación: manifest = `id:<data.id>;request-id:<x-request-id>;ts:<ts>;` (los valores ausentes se omiten).
// Sin dependencias de Deno: se prueba con Node (node --test).
const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export interface MpSigInput { xSignature: string | null; xRequestId: string | null; dataId: string | null; secret: string; }
export type MpSigResult = { ok: true } | { ok: false; reason: string };

export async function verifyMpSignature({ xSignature, xRequestId, dataId, secret }: MpSigInput): Promise<MpSigResult> {
  if (!secret) return { ok: false, reason: 'secret_not_configured' };
  if (!xSignature) return { ok: false, reason: 'missing_x_signature' };
  let ts = '', v1 = '';
  for (const part of xSignature.split(',')) {
    const [k, v] = part.split('=').map(s => s?.trim());
    if (k === 'ts') ts = v; else if (k === 'v1') v1 = v;
  }
  if (!ts || !v1) return { ok: false, reason: 'malformed_x_signature' };
  // Si data.id es alfanumérico, MP firma la versión en minúsculas.
  let manifest = '';
  if (dataId) manifest += `id:${dataId.toLowerCase()};`;
  if (xRequestId) manifest += `request-id:${xRequestId};`;
  manifest += `ts:${ts};`;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const expected = hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(manifest)));
  return timingSafeEqual(expected, v1.toLowerCase()) ? { ok: true } : { ok: false, reason: 'signature_mismatch' };
}
