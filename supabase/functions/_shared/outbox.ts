import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import type { Logger } from './log.ts';
import { emailConfigured, EmailError, sendEmail } from './email.ts';
import { Brand, renderEmail, Template } from './email-templates.ts';

const MAX_ATTEMPTS = 5;
const backoffMinutes = (attempt: number) => [1, 5, 30, 120, 360][Math.min(attempt, 5) - 1];

export const brand = (): Brand => ({
  name: Deno.env.get('BRAND_NAME') ?? 'MASUMA', siteUrl: Deno.env.get('SITE_URL') ?? '', supportEmail: Deno.env.get('SUPPORT_EMAIL') || undefined,
});

/** Envía un lote de la bandeja de salida. Si el mail no está configurado, deja todo pendiente (se enviará cuando se configure). */
export async function processOutbox(admin: SupabaseClient, log: Logger, limit = 10) {
  const summary = { sent: 0, retry: 0, dead: 0, skipped: 0, notConfigured: false };
  if (!emailConfigured()) { log.warn('email no configurado (EMAIL_API_KEY / EMAIL_FROM): los mails quedan pendientes'); summary.notConfigured = true; return summary; }
  const { data: rows, error } = await admin.rpc('claim_pending_emails', { p_limit: limit });
  if (error) throw new Error(`claim_pending_emails: ${error.message}`);
  const adminTo = (Deno.env.get('EMAIL_ADMIN_TO') ?? '').split(',').map(s => s.trim()).filter(Boolean);

  for (const row of rows ?? []) {
    const rlog = log.with({ outbox_id: row.id, order_id: row.order_id, template: row.template, attempt: row.attempts });
    const finish = (patch: Record<string, unknown>) => admin.from('email_outbox').update({ locked_at: null, ...patch }).eq('id', row.id);
    try {
      // Destinatarios: el mail del cliente se lee de Auth en el momento del envío; los internos salen de la configuración.
      let to: string[] = adminTo, name: string | null = null;
      if (row.audience === 'customer') {
        const { data } = await admin.auth.admin.getUserById(row.user_id);
        to = data?.user?.email ? [data.user.email] : [];
        name = (data?.user?.user_metadata?.full_name as string | undefined) ?? null;
      }
      if (!to.length) { await finish({ status: 'skipped', last_error: row.audience === 'admin' ? 'EMAIL_ADMIN_TO sin configurar' : 'cliente sin mail' }); summary.skipped++; rlog.warn('skipped: sin destinatarios'); continue; }

      const [{ data: order }, { data: items }] = await Promise.all([
        admin.from('orders').select('id,currency,total,provider,failure_reason').eq('id', row.order_id).single(),
        admin.from('order_items').select('name,unit_price,quantity').eq('order_id', row.order_id),
      ]);
      if (!order) { await finish({ status: 'dead', last_error: 'pedido inexistente' }); summary.dead++; continue; }
      const msg = renderEmail(row.template as Template, { brand: brand(), customerName: name,
        order: { id: order.id, currency: order.currency, total: Number(order.total), provider: order.provider, failureReason: order.failure_reason, items: (items ?? []).map(i => ({ ...i, unit_price: Number(i.unit_price) })) } });

      const sent = await sendEmail({ to, subject: msg.subject, html: msg.html, text: msg.text, idempotencyKey: `outbox/${row.id}`, replyTo: brand().supportEmail });
      await finish({ status: 'sent', sent_at: new Date().toISOString(), provider_message_id: sent.id, last_error: null });
      summary.sent++; rlog.info('email sent', { provider_message_id: sent.id });
    } catch (e) {
      const retryable = e instanceof EmailError ? e.retryable : true;
      const dead = !retryable || row.attempts >= MAX_ATTEMPTS;
      await finish({ status: dead ? 'dead' : 'pending', last_error: (e instanceof Error ? e.message : String(e)).slice(0, 300),
        next_attempt_at: new Date(Date.now() + backoffMinutes(row.attempts) * 60_000).toISOString() });
      dead ? summary.dead++ : summary.retry++;
      rlog.error('email failed', { dead, retryable, detail: e instanceof Error ? e.message.slice(0, 200) : 'error' });
    }
  }
  return summary;
}

/** Para usar tras confirmar un pago: nunca lanza y no espera más de 10 s (un mail caído no puede romper el procesamiento del pago). */
export async function flushEmails(admin: SupabaseClient, log: Logger) {
  try {
    await Promise.race([processOutbox(admin, log), new Promise(r => setTimeout(r, 10_000))]);
  } catch (e) { log.error('flushEmails failed', { detail: e instanceof Error ? e.message : String(e) }); }
}
