// Plantillas de mail. Funciones puras (sin Deno): se prueban con Node. Textos en español rioplatense.
// Ningún dato de la empresa está escrito acá: nombre, sitio y contacto vienen de la configuración (Brand).
export type Template = 'order_paid' | 'order_shipped' | 'admin_order_paid' | 'admin_order_review';
export interface Brand { name: string; siteUrl: string; supportEmail?: string; }
export interface OrderData {
  id: string; currency: 'ARS' | 'USD'; total: number; provider: string | null; failureReason?: string | null;
  items: { name: string; unit_price: number; quantity: number }[];
}
export interface Rendered { subject: string; html: string; text: string; }

export const escapeHtml = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
export const money = (currency: string, n: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(n);
export const shortId = (id: string) => id.slice(0, 8).toUpperCase();
const providerName = (p: string | null) => p === 'mercadopago' ? 'Mercado Pago' : p === 'paypal' ? 'PayPal' : (p ?? '—');

function layout(brand: Brand, title: string, bodyHtml: string): string {
  const support = brand.supportEmail ? `<p style="color:#64748b;font-size:13px">¿Dudas? Escribinos a ${escapeHtml(brand.supportEmail)}.</p>` : '';
  return `<!doctype html><html lang="es"><body style="margin:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #e2e8f0;border-radius:12px">
<tr><td style="padding:20px 28px;border-bottom:1px solid #e2e8f0;font-weight:700;letter-spacing:.15em;color:#c8102e">${escapeHtml(brand.name)}</td></tr>
<tr><td style="padding:28px"><h1 style="font-size:20px;margin:0 0 16px">${escapeHtml(title)}</h1>${bodyHtml}${support}</td></tr>
</table></td></tr></table></body></html>`;
}

function itemsTable(o: OrderData): string {
  const rows = o.items.map(i => `<tr><td style="padding:6px 0">${escapeHtml(i.quantity)} × ${escapeHtml(i.name)}</td><td align="right">${escapeHtml(money(o.currency, i.unit_price * i.quantity))}</td></tr>`).join('');
  return `<table role="presentation" width="100%" style="border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;margin:12px 0">${rows}
<tr><td style="padding:8px 0"><b>Total</b></td><td align="right"><b>${escapeHtml(money(o.currency, o.total))}</b></td></tr></table>`;
}
const itemsText = (o: OrderData) => o.items.map(i => `- ${i.quantity} x ${i.name}: ${money(o.currency, i.unit_price * i.quantity)}`).join('\n') + `\nTotal: ${money(o.currency, o.total)}`;

export function renderEmail(template: Template, ctx: { brand: Brand; order: OrderData; customerName?: string | null }): Rendered {
  const { brand, order: o } = ctx;
  const ref = shortId(o.id);
  const hi = ctx.customerName ? `Hola ${ctx.customerName},` : 'Hola,';
  switch (template) {
    case 'order_paid': {
      const subject = `Recibimos tu pago – Pedido ${ref}`;
      return { subject,
        html: layout(brand, '¡Pago confirmado!', `<p>${escapeHtml(hi)}</p><p>Recibimos tu pago del pedido <b>${escapeHtml(ref)}</b> (${escapeHtml(providerName(o.provider))}). Ya estamos preparando tu compra.</p>${itemsTable(o)}<p>Te avisaremos cuando salga el envío.</p>`),
        text: `${hi}\n\nRecibimos tu pago del pedido ${ref} (${providerName(o.provider)}). Ya estamos preparando tu compra.\n\n${itemsText(o)}\n\nTe avisaremos cuando salga el envío.\n${brand.name}` };
    }
    case 'order_shipped': {
      const subject = `Tu pedido ${ref} fue despachado`;
      return { subject,
        html: layout(brand, 'Tu pedido está en camino', `<p>${escapeHtml(hi)}</p><p>Despachamos tu pedido <b>${escapeHtml(ref)}</b>.</p>${itemsTable(o)}`),
        text: `${hi}\n\nDespachamos tu pedido ${ref}.\n\n${itemsText(o)}\n${brand.name}` };
    }
    case 'admin_order_paid': {
      const subject = `[${brand.name}] Nuevo pedido pagado ${ref} – ${money(o.currency, o.total)}`;
      const link = `${brand.siteUrl}/admin/pedidos/${o.id}`;
      return { subject,
        html: layout(brand, 'Nuevo pedido pagado', `<p>Pedido <b>${escapeHtml(ref)}</b> pagado con ${escapeHtml(providerName(o.provider))}.</p>${itemsTable(o)}<p><a href="${escapeHtml(link)}">Ver en el panel</a></p>`),
        text: `Nuevo pedido pagado ${ref} (${providerName(o.provider)})\n\n${itemsText(o)}\n\nPanel: ${link}` };
    }
    case 'admin_order_review': {
      const subject = `[${brand.name}] ⚠ Pedido ${ref} requiere revisión`;
      const link = `${brand.siteUrl}/admin/pedidos/${o.id}`;
      return { subject,
        html: layout(brand, 'Pedido para revisar a mano', `<p>El pedido <b>${escapeHtml(ref)}</b> (${escapeHtml(providerName(o.provider))}, ${escapeHtml(money(o.currency, o.total))}) pasó a revisión.</p><p><b>Motivo:</b> ${escapeHtml(o.failureReason ?? 'sin detalle')}</p><p>Puede haber un pago recibido que requiera acción (reembolso, stock o monto distinto).</p><p><a href="${escapeHtml(link)}">Abrir en el panel</a></p>`),
        text: `Pedido ${ref} requiere revisión (${providerName(o.provider)}, ${money(o.currency, o.total)}).\nMotivo: ${o.failureReason ?? 'sin detalle'}\n\nPanel: ${link}` };
    }
    default: throw new Error(`template desconocido: ${template}`);
  }
}
