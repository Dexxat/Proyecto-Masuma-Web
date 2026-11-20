# Dónde se conectan el carrito y los pagos

Esta es la parte más sensible. La arquitectura **ya está implementada** (código, SQL, funciones, panel admin y mails), pero **nunca se probó contra Supabase, Mercado Pago ni PayPal reales**. La pantalla del carrito y la del catálogo son funcionales pero **sin diseño**: falta modernizarlas (ver `PENDIENTES.md`).

## Mapa de archivos
| Capa | Archivo | Qué hace |
|---|---|---|
| Pantalla | `src/app/pages/cart.ts` | lista el carrito y tiene los botones "Pagar con tarjeta" / "Pagar con PayPal" (requiere sesión: `authGuard`) |
| Pantalla | `src/app/pages/pago-resultado.ts` | al volver del proveedor consulta el estado real del pedido cada 3 s; si es PayPal dispara la captura |
| Servicio | `src/app/core/cart.service.ts` | carrito en `cart_items` (RLS), `checkout()`, `orderStatus()`, `capturePaypal()` |
| Base | `supabase/migrations/0001_init.sql` | productos, perfiles, carrito, RLS |
| Base | `supabase/migrations/0002_payments.sql` | pedidos, ítems, historial, eventos de pago; `create_order_from_cart` y `apply_payment_result` (precio, stock y estado en SQL) |
| Funciones | `create-mercadopago-payment`, `create-paypal-order` | validan sesión, crean el pedido desde el carrito con precios de la base y devuelven la URL de pago |
| Funciones | `mercadopago-webhook`, `paypal-webhook` | validan firma, registran el evento, **reconsultan** el pago al proveedor y lo aplican (idempotente) |
| Funciones | `capture-paypal-order` | captura el pago de PayPal en el servidor al volver el cliente |
| Funciones | `admin-reprocess-payment` | el admin reconsulta al proveedor un pago trabado |
| Módulos | `supabase/functions/_shared/` | `payments.ts`, `paypal.ts`, `mp-signature.ts` (con tests), `log.ts` (correlation id), `outbox.ts`/`email.ts` |
| Admin | `src/app/admin/` | pedidos, traza de cada pedido, reproceso, enviado/cancelado, productos |
| Mails | `0004_emails.sql`, `send-emails`, `_shared/email-templates.ts` | cola (outbox) y envío con Resend |

## Orden de puesta en marcha
1. Proyecto Supabase + migraciones + seed + `env.ts` (ver README).
2. Crear el primer admin (README).
3. Cuentas de **prueba**: Mercado Pago (usuarios y tarjetas de prueba) y PayPal Sandbox.
4. Cargar secretos (`supabase/.env.example`) con `supabase secrets set`.
5. `supabase functions deploy`.
6. Configurar los webhooks en cada proveedor (URLs y eventos en `PAGOS.md` §5).
7. Poner precios a algunos productos desde `/admin` (hoy todos son "[$ A DEFINIR]" y sin precio no se puede comprar).
8. Probar el flujo completo en sandbox: pago aprobado, rechazado, pendiente, webhook duplicado, cierre del navegador antes de volver.
9. Recién entonces pasar a producción (`MP_SANDBOX=false`, `PAYPAL_ENV=live`, credenciales reales).

## Qué falta (ordenado)
1. **Probar todo en sandbox** (lo más importante).
2. Diseño del carrito, del catálogo y de la ficha de producto (hoy sin estilo).
3. Confirmar la moneda de PayPal (el diseño cobra en USD con `products.price_usd`).
4. Datos de envío en el checkout (hoy PayPal va sin envío).
5. Expiración de pedidos `pending` viejos; eventos de reembolso y contracargo de PayPal.
6. Alertas (Sentry o similar) sobre logs de error y eventos con `outcome = 'error'`.
7. Rate limit en las funciones de pago y pruebas de integración automáticas.
8. Cuotas y medios offline de Mercado Pago, si la empresa los quiere.
9. Medios de pago y facturación reales: definir con la empresa (razón social, CUIT, condiciones).

## Cómo encontrar un error rápido
Cada pedido y cada notificación llevan un `correlation_id` que aparece en los logs de las funciones, en `payment_events` y en el mensaje que ve el cliente. El detalle de pedido del panel `/admin` muestra la traza completa. Guía de síntomas en `PAGOS.md` §4.

## Reglas que no se rompen
- El navegador nunca manda precios ni marca pagos.
- Nunca se piden ni guardan datos de tarjeta (paga el cliente en el sitio del proveedor).
- Claves solo en Supabase Secrets; el frontend solo tiene la Publishable key (pública).
- Sin "marcar como pagado" manual: un pago se confirma únicamente desde el proveedor.
