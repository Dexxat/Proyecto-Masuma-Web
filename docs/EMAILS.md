# Mails transaccionales

## Qué se envía
| Plantilla | Destinatario | Cuándo |
|---|---|---|
| `order_paid` | Cliente | El pedido pasa a `paid` (pago confirmado por el proveedor) |
| `order_shipped` | Cliente | Un administrador marca el pedido como enviado |
| `admin_order_paid` | Equipo interno | Nuevo pedido pagado |
| `admin_order_review` | Equipo interno | Un pedido pasa a `review` (monto distinto, sin stock, reembolso): requiere acción humana |

## Cómo funciona (patrón "outbox")
1. Un trigger de la base encola el mail **en la misma transacción** que el cambio de estado. Si el pedido cambió, el mail existe; si el proveedor de mail está caído, no se pierde.
2. Al confirmarse un pago (o al marcar un envío) se despacha la bandeja enseguida. Un **cron cada 5 minutos** es el respaldo y reintenta los fallidos.
3. Reintentos con espera creciente (1, 5, 30, 120 y 360 min). Tras 5 intentos, o ante un error que no mejora reintentando (dirección inválida, dominio sin verificar), el mail queda `dead` y es visible en el panel.
4. Dos ejecuciones simultáneas no se pisan (`skip locked`) y el envío usa `Idempotency-Key` (id de la fila), por lo que un reintento no duplica el mail. Según la documentación de Resend, esas claves expiran a las 24 horas.
5. Un mail caído **nunca rompe** el procesamiento de un pago: `flushEmails` no lanza y no espera más de 10 segundos.

## Privacidad
- El mail del cliente **no se copia** a la bandeja: se lee de Auth en el momento de enviar.
- Los logs no incluyen direcciones ni contenido (el redactor oculta claves como `email`); solo ids y estados.
- Las plantillas escapan todo dato variable (nombres de producto, motivos) contra inyección de HTML.

## Configuración (nada de datos de la empresa está escrito en el código)
```
supabase secrets set EMAIL_API_KEY=... EMAIL_FROM="NOMBRE <no-responder@dominio>" \
  EMAIL_ADMIN_TO="ventas@...,logistica@..." BRAND_NAME=MASUMA SUPPORT_EMAIL=... CRON_SECRET=<aleatorio largo>
```
- Si `EMAIL_API_KEY` o `EMAIL_FROM` no están configurados, **los mails quedan pendientes** y se envían cuando se configure (el sistema se puede desplegar antes de tener los datos).
- Si falta `EMAIL_ADMIN_TO`, los mails internos se marcan `skipped` con ese motivo.
- Proveedor: Resend (API REST). Cambiar de proveedor implica modificar solo `_shared/email.ts`.
- Cron de respaldo (ajustar al configurar; confirmar la sintaxis vigente en la documentación de Supabase):
  ```sql
  select cron.schedule('send-emails', '*/5 * * * *', $$
    select net.http_post(url := 'https://<proyecto>.supabase.co/functions/v1/send-emails',
                         headers := '{"x-cron-secret": "<CRON_SECRET>"}'::jsonb) $$);
  ```
  Guardar el secreto en Supabase Vault en lugar de escribirlo en claro.

## Dominio de envío (requiere a la empresa)
Para que los mails lleguen a la bandeja de entrada (y no a spam) hay que verificar el dominio emisor en el proveedor agregando registros **SPF, DKIM y DMARC** en el DNS de `masuma.com.ar`. Ojo: el correo actual de la empresa (`@masuma.com.ar`) ya funciona con registros MX/SPF existentes; hay que **agregar sin pisar** los actuales. Alternativa conservadora: enviar desde un subdominio (por ejemplo `mail.masuma.com.ar`).

## Diagnóstico
```sql
-- Mails que no salieron
select created_at, template, audience, status, attempts, last_error, order_id from email_outbox where status in ('pending','dead','skipped') order by created_at desc;
-- Todo lo de un pedido (incluye los mails)
select * from payment_trace where order_id = '<ID>';
```
En el panel: detalle del pedido → sección **Mails**. Los `dead` aparecen resaltados.

## Pendientes
- Botón "reenviar" para un mail `dead` desde el panel.
- Mail al cliente cuando el pago es rechazado o el pedido se cancela (hoy solo se muestra en pantalla).
- Plantillas definitivas con logo, colores y textos legales aprobados por la empresa.
- Si un pedido vuelve a `review` más de una vez, cada transición genera un aviso (comportamiento intencional).
