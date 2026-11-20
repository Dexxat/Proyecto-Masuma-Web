// Logs estructurados (una línea JSON por evento) con redacción automática de datos sensibles.
const SENSITIVE = /(authorization|token|secret|password|card|cvv|signature|api[-_]?key|email|phone|document)/i;

export function redact(value: unknown, depth = 0): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (depth > 5) return '[depth]';
  if (Array.isArray(value)) return value.slice(0, 20).map(v => redact(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = SENSITIVE.test(k) ? '[redacted]' : redact(v, depth + 1);
  return out;
}

export interface Logger {
  info(msg: string, extra?: object): void; warn(msg: string, extra?: object): void; error(msg: string, extra?: object): void;
  with(extra: object): Logger;
}

export function createLogger(fn: string, cid: string, base: object = {}): Logger {
  const emit = (level: string, msg: string, extra: object = {}) =>
    console.log(JSON.stringify({ ts: new Date().toISOString(), level, fn, cid, msg, ...(redact({ ...base, ...extra }) as object) }));
  return {
    info: (m, e) => emit('info', m, e), warn: (m, e) => emit('warn', m, e), error: (m, e) => emit('error', m, e),
    with: (extra) => createLogger(fn, cid, { ...base, ...extra }),
  };
}
