// Envío por Resend (API REST). Cambiar de proveedor = cambiar solo este archivo.
export class EmailError extends Error { constructor(message: string, public retryable: boolean) { super(message); } }
export interface EmailMessage { to: string[]; subject: string; html: string; text: string; idempotencyKey: string; replyTo?: string; }

export const emailConfigured = () => !!(Deno.env.get('EMAIL_API_KEY') && Deno.env.get('EMAIL_FROM'));

export async function sendEmail(m: EmailMessage): Promise<{ id: string }> {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${Deno.env.get('EMAIL_API_KEY')}`, 'Content-Type': 'application/json', 'Idempotency-Key': m.idempotencyKey },
    body: JSON.stringify({ from: Deno.env.get('EMAIL_FROM'), to: m.to, subject: m.subject, html: m.html, text: m.text, reply_to: m.replyTo }),
  });
  const body = await r.json().catch(() => ({}));
  if (r.ok) return { id: body.id };
  // 429 y 5xx se reintentan; el resto (dirección inválida, dominio sin verificar, clave mala) no mejora reintentando.
  throw new EmailError(`Resend ${r.status}: ${String(body?.message ?? body?.name ?? 'error').slice(0, 200)}`, r.status === 429 || r.status >= 500);
}
