// Ejecutar: node --test supabase/functions/_shared/email-templates.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderEmail, escapeHtml, shortId, type OrderData, type Template } from './email-templates.ts';

const brand = { name: 'MARCA', siteUrl: 'https://sitio.test', supportEmail: 'ayuda@sitio.test' };
const order: OrderData = { id: 'abcdef12-0000-0000-0000-000000000000', currency: 'ARS', total: 1500.5, provider: 'mercadopago', failureReason: 'amount_mismatch',
  items: [{ name: 'Neumático <b>X</b>', unit_price: 500, quantity: 3 }] };
const all: Template[] = ['order_paid', 'order_shipped', 'admin_order_paid', 'admin_order_review'];

test('renderiza todas las plantillas sin "undefined" ni "NaN"', () => {
  for (const t of all) {
    const r = renderEmail(t, { brand, order, customerName: 'Ana' });
    for (const s of [r.subject, r.html, r.text]) { assert.ok(s.length > 0); assert.ok(!/undefined|NaN|\[object/.test(s), `${t}: ${s}`); }
    assert.ok(r.subject.includes('ABCDEF12'));
  }
});
test('escapa HTML de datos variables (nombres de producto, motivo)', () => {
  const r = renderEmail('order_paid', { brand, order });
  assert.ok(!r.html.includes('<b>X</b>') && r.html.includes('&lt;b&gt;X&lt;/b&gt;'));
  assert.equal(escapeHtml(`<a href="x">&'`), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
  const rv = renderEmail('admin_order_review', { brand, order: { ...order, failureReason: '<script>alert(1)</script>' } });
  assert.ok(!rv.html.includes('<script>'));
});
test('formatea moneda y funciona sin soporte ni nombre', () => {
  const r = renderEmail('order_paid', { brand: { name: 'M', siteUrl: 'https://x' }, order });
  assert.ok(/1\.500,50/.test(r.text)); assert.ok(r.text.startsWith('Hola,')); assert.ok(!r.html.includes('Escribinos'));
  assert.equal(shortId(order.id), 'ABCDEF12');
});
test('plantilla desconocida lanza error', () => { assert.throws(() => renderEmail('x' as Template, { brand, order })); });
