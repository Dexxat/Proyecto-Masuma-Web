import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { createLogger, Logger } from './log.ts';

export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
export interface Ctx { req: Request; cid: string; log: Logger; admin: SupabaseClient; cors: Record<string, string>; }

export const adminClient = () => createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

/** Usuario autenticado a partir del JWT del request (nunca del body). */
export async function requireUser(req: Request) {
  const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } });
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new HttpError(401, 'unauthorized', 'Necesitás iniciar sesión');
  return user;
}

/** Solo administradores: el rol se verifica en la base (profiles.role), nunca con datos del cliente. */
export async function requireAdmin(req: Request, admin: SupabaseClient) {
  const user = await requireUser(req);
  const { data } = await admin.from('profiles').select('role').eq('id', user.id).single();
  if (data?.role !== 'admin') throw new HttpError(403, 'forbidden', 'No autorizado');
  return user;
}

export const json = (body: unknown, cors: Record<string, string>, cid: string, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json', 'x-correlation-id': cid } });

/**
 * Envoltorio común: genera el correlation id, loguea inicio/fin/error y devuelve errores con formato único.
 * El usuario ve el `correlation_id` en cualquier error; con ese código se encuentra TODO en los logs.
 */
export function serve(fn: string, handler: (ctx: Ctx) => Promise<Response>) {
  Deno.serve(async (req) => {
    const cid = req.headers.get('x-request-id') ?? crypto.randomUUID();
    const log = createLogger(fn, cid);
    const cors = { 'Access-Control-Allow-Origin': Deno.env.get('SITE_URL') ?? '', 'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey', 'Vary': 'Origin' };
    if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
    const started = Date.now();
    try {
      log.info('request', { method: req.method });
      const res = await handler({ req, cid, log, admin: adminClient(), cors });
      log.info('response', { status: res.status, ms: Date.now() - started });
      return res;
    } catch (e) {
      const err = e instanceof HttpError ? e : new HttpError(500, 'internal_error', 'Error interno');
      (err.status >= 500 ? log.error : log.warn)('failed', { code: err.code, status: err.status, detail: e instanceof Error ? e.message : String(e), stack: err.status >= 500 && e instanceof Error ? e.stack : undefined, ms: Date.now() - started });
      return json({ error: { code: err.code, message: err.message, correlation_id: cid } }, cors, cid, err.status);
    }
  });
}
