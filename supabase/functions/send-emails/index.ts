// Procesa la bandeja de salida. Lo llama (a) un cron cada pocos minutos con x-cron-secret, o (b) un administrador desde el panel.
import { HttpError, json, requireAdmin, serve } from '../_shared/http.ts';
import { processOutbox } from '../_shared/outbox.ts';

serve('send-emails', async ({ req, cid, log, admin, cors }) => {
  const secret = Deno.env.get('CRON_SECRET');
  const given = req.headers.get('x-cron-secret');
  if (given) { if (!secret || given !== secret) throw new HttpError(401, 'unauthorized', 'No autorizado'); }
  else await requireAdmin(req, admin);
  return json(await processOutbox(admin, log, 25), cors, cid);
});
