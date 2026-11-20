// Ejecutar: node --test supabase/functions/_shared/mp-signature.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { verifyMpSignature } from './mp-signature.ts';

const secret = 'secreto-de-prueba';
const sign = (manifest: string) => createHmac('sha256', secret).update(manifest).digest('hex');
const base = { dataId: '123456', xRequestId: 'req-1', secret };

test('firma válida', async () => {
  const h = `ts=1742505638683,v1=${sign('id:123456;request-id:req-1;ts:1742505638683;')}`;
  assert.deepEqual(await verifyMpSignature({ ...base, xSignature: h }), { ok: true });
});
test('data.id alfanumérico se firma en minúsculas', async () => {
  const h = `ts=1,v1=${sign('id:ord01abc;request-id:req-1;ts:1;')}`;
  assert.equal((await verifyMpSignature({ ...base, dataId: 'ORD01ABC', xSignature: h })).ok, true);
});
test('sin request-id se omite del manifest', async () => {
  const h = `ts=5,v1=${sign('id:123456;ts:5;')}`;
  assert.equal((await verifyMpSignature({ ...base, xRequestId: null, xSignature: h })).ok, true);
});
test('rechaza data.id alterado', async () => {
  const h = `ts=1,v1=${sign('id:123456;request-id:req-1;ts:1;')}`;
  assert.deepEqual(await verifyMpSignature({ ...base, dataId: '999', xSignature: h }), { ok: false, reason: 'signature_mismatch' });
});
test('rechaza secreto incorrecto, header ausente o malformado', async () => {
  const h = `ts=1,v1=${sign('id:123456;request-id:req-1;ts:1;')}`;
  assert.equal((await verifyMpSignature({ ...base, secret: 'otro', xSignature: h })).ok, false);
  assert.deepEqual(await verifyMpSignature({ ...base, xSignature: null }), { ok: false, reason: 'missing_x_signature' });
  assert.deepEqual(await verifyMpSignature({ ...base, xSignature: 'basura' }), { ok: false, reason: 'malformed_x_signature' });
  assert.deepEqual(await verifyMpSignature({ ...base, secret: '', xSignature: h }), { ok: false, reason: 'secret_not_configured' });
});
