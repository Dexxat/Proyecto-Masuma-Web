# Pendientes

## A pedir a la empresa (ver `REUNION-CLIENTE.md`)
- Contacto: ya cargados teléfono, WhatsApp, mail, dirección e Instagram/Facebook/LinkedIn. Falta: confirmar «AEW» en la dirección (Amenábar 4073 queda en CABA), el mapa y si hay canal de YouTube. **El mail es el único canal para consultas y CV** (ver Decisiones).
- Logo en vector (SVG), paleta e identidad.
- Textos aprobados: Nosotros, servicios, legales (términos, privacidad, arrepentimiento), cómo comprar.
- Precios (ARS y USD), stock y datos técnicos de los 49 productos; fotos de producto. Revisar descripciones con datos incompletos: Gill G-25, G-35 y G241 (voltaje sin etiqueta) y PC-12 NG («Range» sin valor).
- Fuente de Novedades.
- Cuentas de Mercado Pago y PayPal, dominio de correo para los mails, razón social y CUIT.
- Confirmar si hay más marcas que las 5 de la cinta.

## Decisiones tomadas (no volver a plantear)
- **Sin formulario de contacto ni de postulación** (20/11/2026): se simplifica. La gente escribe al mail que figura en Contacto; los CV se envían a ese mismo mail desde «Trabaje con nosotros». No hace falta tabla, función ni envío de mails para formularios.
- **Una sola página (single page):** el menú tiene solo NOSOTROS, PRODUCTOS y CONTACTO, y baja a cada sección del inicio (ver `cambios-navegacion-v6.md`).
- **Orden del catálogo:** Pilatus Aircraft (5 aviones) → Neumáticos (15) → Baterías (15) → AeroSpecialties (6) → Otros (6) (ver `cambios-layout-v8.md`). Lo fija `src/app/core/shelf-order.ts`.

## Derechos de uso (confirmar antes de publicar)
- Las fotos de Nosotros y de Servicios provienen de terceros: se ven marcas ajenas (Lufthansa Technik, Iberia, Pilatus). Reemplazar por fotos propias o con licencia. La foto del turbofán parece generada con IA.
- Foto de la caja de Contacto (`design/originals/contacto.jpg`): confirmar origen y licencia.
- Logos de marcas (Goodyear, Pilatus, Pratt & Whitney, Gill, Powervamp): pedir el kit de prensa o los lineamientos de uso de cada una.

## Desarrollo
1. Probar pagos y mails en sandbox (`INTEGRACION-CARRITO-PAGOS.md`).
2. Modernizar el diseño del catálogo, la ficha de producto y el carrito; unificar colores con las variables.
3. Pulir los íconos de las redes del encabezado.
4. Video de cierre (avión aterrizando, `shared/outro-video.ts`): hecho. Falta probarlo en iPhone y Android reales y con conexión lenta; si el peso preocupa, reconvertir con `crf 25` y clave cada 12 (−41 %). Guardar el video original en `design/originals/footer-original.mp4` (hoy solo están las versiones preparadas).
5. Novedades (fuente y diseño).
6. Textos legales reales.
7. Video del hero en 1080p (el actual es 720p); fotos de Nosotros de mayor resolución (hangar y cabina se ven blandas).
8. Probar en iOS y Android reales y con conexión lenta.
9. Probar las redirecciones 301 en Vercel (en especial las que llevan `#`) y la propuesta comercial con montos.
10. Confirmar que "activar" productos en el estante significa "seleccionar" para el carrito.
11. Pedir fotos de mayor resolución del PC-12, PC-9 y la lata de BP. (El recorte del fondo blanco ya está hecho: 53 fotos, ver `tools/cutout_white.py`.)
12. Correr en Supabase la migración `0008` (orden de tipos y `video_url`) y el seed actualizado: así aparece el «Ver video» del PC-24.
