# Pagos MASUMA: arquitectura, seguridad y diagnóstico

## 1. Idea central (para quien nunca hizo pagos online)
1. **Nunca tocamos datos de tarjeta.** El cliente paga en la página de Mercado Pago o PayPal. Nosotros solo recibimos "el pago X del pedido Y está aprobado". Esto deja a MASUMA fuera del alcance más pesado de PCI-DSS.
2. **El navegador no es confiable.** Todo lo que viene del cliente (precios, totales, "ya pagué") se ignora. Los precios salen de la base y el estado de pago solo lo cambia el servidor.
3. **Los webhooks avisan, no deciden.** Cuando llega una notificación, se valida su firma y se vuelve a consultar el pago a la API del proveedor antes de aceptarlo.
4. **Todo es idempotente.** Los proveedores reintentan notificaciones; procesar dos veces el mismo pago no duplica el descuento de stock ni el pedido.
5. **Todo deja rastro.** Cada pedido tiene historial de estados y cada notificación queda registrada con su resultado.

## 2. Flujo
```
Cliente (Angular)            Supabase Edge Functions                 Mercado Pago / PayPal
  │ "Pagar"                          │                                        │
  ├────────────────────────────────► create-*-payment                          │
  │                                   │ 1. valida sesión (JWT)                  │
  │                                   │ 2. create_order_from_cart (SQL):        │
  │                                   │    precios y stock desde la base        │
  │                                   │ 3. crea preferencia / orden ──────────► │
  │ ◄──────── redirect_url ───────────┤                                        │
  ├──────────── el cliente paga en el sitio del proveedor ───────────────────► │
  │                                   │ ◄── webhook firmado ────────────────────┤
  │                                   │ 4. valida firma                         │
  │                                   │ 5. registra evento (payment_events)     │
  │                                   │ 6. consulta el pago a la API ─────────► │
  │                                   │ 7. apply_payment_result (SQL):          │
  │                                   │    monto, moneda, stock, estado         │
  │ /pago/resultado?order=…           │                                        │
  ├── consulta estado cada 3 s ──────► (lee orders con RLS: solo el dueño)      │
```
PayPal agrega un paso: al volver el cliente, `capture-paypal-order` captura el pago en el servidor. El `paypal-webhook` es la red de seguridad si el cliente cierra el navegador antes de volver.

## 3. Modelo de seguridad
| Riesgo | Defensa |
|---|---|
| Alterar precio o total desde el navegador | `create_order_from_cart` calcula todo en SQL con los precios de `products` |
| Falsificar un webhook | Firma HMAC-SHA256 (MP) y `verify-webhook-signature` (PayPal); comparación en tiempo constante |
| Webhook con datos manipulados | Se vuelve a consultar el pago a la API del proveedor con nuestro token |
| Pago por un monto distinto | `apply_payment_result` compara monto y moneda; si no coinciden, el pedido pasa a `review` |
| Notificación repetida | `payment_events` único por (proveedor, id de evento) + `apply_payment_result` idempotente |
| Dos compras simultáneas del último producto | Bloqueo de filas (`for update`) y descuento atómico de stock; sin stock → `review` (se reembolsa a mano) |
| Cambios de estado inválidos | Trigger que rechaza transiciones ilegales (p. ej. `paid → pending`) |
| Cliente leyendo pedidos ajenos | RLS: cada usuario ve solo sus pedidos; `payment_events` solo admin |
| Fuga de claves | Secretos solo en Supabase Secrets; el frontend solo tiene la Publishable key (pública) |
| Doble cobro por reintento de red | `X-Idempotency-Key` (MP) y `PayPal-Request-Id` (PayPal) usan el id del pedido |
| Datos personales en logs | `log.ts` redacta tokens, mails, tarjetas, firmas |

Las funciones solo escriben en la base con `service_role`; las tablas de pagos no tienen políticas de escritura para clientes.

## 4. Cómo encontrar un error rápido
**Cada request tiene un `correlation_id`** (el `x-request-id` que manda MP o uno generado). Aparece en: los logs de la función, la fila de `payment_events` y el historial del pedido. Si algo falla, el cliente ve "(código …)" en el mensaje: con ese código se encuentra todo.

### Preguntas típicas
**"El cliente dice que pagó y no le figura."** Con el id del pedido:
```sql
select * from payment_trace where order_id = '<ID>';
```
Una sola fila muestra el estado, el historial de cambios y todas las notificaciones recibidas, con su resultado.

**"¿Qué webhooks fallaron en las últimas 24 h?"**
```sql
select received_at, provider, type, outcome, error, correlation_id
from payment_events where outcome in ('error','rejected_signature') and received_at > now() - interval '24 hours' order by received_at desc;
```
**"Pedidos que necesitan revisión manual"** (pago con monto distinto, sin stock, reembolso):
```sql
select id, failure_reason, provider, total, currency, created_at from orders where status = 'review';
```
**"Pedidos pendientes hace más de 1 hora"** (el cliente no terminó, o el webhook no llegó):
```sql
select id, provider, created_at from orders where status = 'pending' and created_at < now() - interval '1 hour';
```
**Logs de una operación:** en el panel de Supabase → Edge Functions → Logs, buscar el `correlation_id`. Cada línea es un JSON con `fn`, `cid`, `order_id`, `msg`.

### Guía de síntomas
| Síntoma | Causa probable |
|---|---|
| `rejected_signature` / `signature_mismatch` en todos los webhooks | `MP_WEBHOOK_SECRET` mal copiado, o es el secreto de otro entorno (prueba vs producción) |
| `rejected_signature` / `secret_not_configured` | Falta el secreto en Supabase |
| 401 en el webhook sin entrar al código | Falta `verify_jwt = false` en `supabase/config.toml` (ya configurado) |
| `outcome = error`, "MP API 401" | `MP_ACCESS_TOKEN` inválido o de otro entorno |
| Pedido en `review` con `amount_mismatch` | Cambió un precio entre crear el pedido y pagar, o moneda distinta |
| El pedido queda `pending` aunque pagó | No llegó el webhook: revisar la URL configurada en el panel de MP y los logs; el estado se puede forzar reprocesando el evento |
| PayPal "capture_failed" | Mirar `paypal_debug_id` en el log; es el dato que pide el soporte de PayPal |

## 5. Puesta en marcha
1. Migraciones: `supabase db push` (0001 y 0002).
2. Secretos:
   ```
   supabase secrets set SITE_URL=https://www.masuma.com.ar \
     MP_ACCESS_TOKEN=... MP_WEBHOOK_SECRET=... MP_SANDBOX=true \
     PAYPAL_CLIENT_ID=... PAYPAL_CLIENT_SECRET=... PAYPAL_WEBHOOK_ID=... PAYPAL_ENV=sandbox
   ```
3. Deploy: `supabase functions deploy` (los webhooks ya quedan sin JWT por `config.toml`).
4. Mercado Pago: en Tus integraciones → Webhooks, configurar `https://<proyecto>.supabase.co/functions/v1/mercadopago-webhook`, evento **Pagos**, y copiar la clave secreta.
5. PayPal: en el Developer Dashboard, crear webhook a `.../paypal-webhook` con eventos `PAYMENT.CAPTURE.COMPLETED` y `PAYMENT.CAPTURE.DENIED`; copiar el Webhook ID.
6. Probar **todo en sandbox** con las cuentas y tarjetas de prueba de cada proveedor antes de pasar a producción (`MP_SANDBOX=false`, `PAYPAL_ENV=live`, credenciales reales).
7. Tests: `node --test supabase/functions/_shared/mp-signature.test.ts` y `deno check` de cada función.

## 5b. Panel de administración (`/admin`)
- **Pedidos:** lista filtrable por estado; los pedidos en `review` aparecen resaltados. Cada pedido muestra productos, historial de estados, notificaciones recibidas del proveedor (con su `correlation_id`) y las acciones de administradores.
- **Reprocesar pago:** consulta el estado real al proveedor (`admin-reprocess-payment`) y aplica el resultado con la misma lógica idempotente que los webhooks. **No existe "marcar como pagado" a mano**: un pago solo se confirma desde Mercado Pago o PayPal.
- **Marcar enviado / cancelar:** pasan por `admin_set_order_status`, que valida el rol y respeta las transiciones permitidas. Cancelar exige un motivo.
- **Productos:** precio ARS, precio USD, stock y activo/inactivo. Precio vacío = "Consultar precio".
- **Auditoría:** cada acción de un admin queda en `admin_actions` (quién, qué, cuándo, resultado).
- **Seguridad:** el `adminGuard` del frontend solo oculta pantallas. La protección real está en RLS (solo admin lee eventos y auditoría, solo admin edita productos) y en las funciones, que verifican `profiles.role = 'admin'` en la base.
- **Crear el primer admin:** registrarse en el sitio y, desde el SQL Editor de Supabase: `update profiles set role = 'admin' where id = '<id del usuario>';`. Los clientes no pueden cambiar su propio rol (la política de `profiles` lo impide). Usar 2FA en la cuenta de admin y limitar el número de admins.
- Despliegue: `supabase functions deploy admin-reprocess-payment` y migración `0003_admin.sql`.

## 6. Qué está verificado y qué no
- **Verificado:** el SQL se parsea completo (migraciones 0001 a 0003); las 6 funciones pasan `deno check`; la validación de firma de Mercado Pago tiene tests (firma válida, alterada, secreto incorrecto, header ausente o malformado); el frontend compila.
- **No probado todavía:** el flujo completo contra Supabase, Mercado Pago y PayPal reales o sandbox. Hace falta cargar las credenciales y probar con cuentas de prueba.
- **Confirmar:** la moneda de PayPal. El diseño cobra en USD con `products.price_usd`; falta confirmar con la cuenta de PayPal de MASUMA qué monedas acepta.

## 7. Pendientes recomendados
1. (Hecho) Mails de confirmación y alertas internas: ver `docs/EMAILS.md`.
2. Datos de envío en el checkout (hoy PayPal va con `NO_SHIPPING`).
3. Expiración de pedidos `pending` antiguos y limpieza.
4. Eventos de reembolso y contracargo de PayPal (`PAYMENT.CAPTURE.REFUNDED`).
5. (Hecho) Panel de administración. Falta: exportar pedidos a CSV, buscador por mail y paginación.
6. Alertas (Sentry o similar) sobre logs de nivel `error` y sobre `payment_events` con `outcome = 'error'`.
7. Pruebas de integración automáticas con base de pruebas, y límite de intentos (rate limit) en las funciones de pago.
8. Cuotas y medios offline (Rapipago/Pago Fácil) de Mercado Pago, si el cliente los quiere.
