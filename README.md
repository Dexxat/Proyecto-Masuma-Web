# MASUMA Web: Angular + Supabase + Vercel

Reconstrucción del sitio de **MASUMA Internacional (Argentina)**: home con video controlado por el scroll, catálogo, favoritos, carrito con usuario y contraseña, pagos con Mercado Pago y PayPal, panel de administración y mails transaccionales.

> **Estado:** base completa y compilando. **Todavía no hay datos de la empresa** (la reunión con MASUMA no se realizó): todo el contenido sale de `src/app/core/site.config.ts` y de la base de datos, y lo vacío muestra un marcador visible. Los pagos y mails están implementados pero **no probados contra Mercado Pago, PayPal, Resend ni Supabase reales**.

## Empezar en VS Code (5 minutos)
Requisitos: **Node 22+** y npm 10, y VS Code. Para la parte de base de datos: [Supabase CLI](https://supabase.com/docs/guides/cli). Opcionales: Deno (Edge Functions), Python 3 y ffmpeg (herramientas de `tools/`).

```bash
npm install
npm start            # http://localhost:4200
```
1. Abrir la carpeta en VS Code y aceptar las **extensiones recomendadas** (`.vscode/extensions.json`).
2. Sin configurar nada el sitio ya se ve (home, servicios, marcas, hero). El catálogo, el login y el carrito necesitan Supabase: ver siguiente sección.
3. F5 en VS Code usa `.vscode/launch.json` (abre Chrome sobre `ng serve`).

## Conectar Supabase
1. Crear un proyecto en Supabase.
2. `supabase link --project-ref <ref>` y `supabase db push` (migraciones `0001` a `0008` en `supabase/migrations/`; o pegarlas en orden en el SQL Editor). La `0007` da los permisos de tabla que los proyectos nuevos de Supabase ya no otorgan solos; la `0008` ordena los tipos (Pilatus primero) y agrega `video_url`.
3. Cargar el catálogo: ejecutar `supabase/seed.sql` en el SQL Editor (49 productos, con descripción y fotos del sitio anterior).
4. Completar `src/app/core/env.ts` con la **URL** y la **Publishable key** (`sb_publishable_...`, en Project Settings → API Keys; la anon key legacy también sirve). Son públicas: la seguridad la dan las políticas RLS. Jamás poner ahí la Secret key (`sb_secret_...`), la `service_role` ni claves de pago.
5. Primer administrador: registrarse en el sitio y, en el SQL Editor, `update profiles set role = 'admin' where id = '<id>';`.

## Pagos, carrito y mails (lo más sensible)
Todo está documentado y listo para conectar en [`docs/INTEGRACION-CARRITO-PAGOS.md`](docs/INTEGRACION-CARRITO-PAGOS.md) (mapa de archivos, orden de puesta en marcha, pruebas en sandbox y qué falta). Los secretos se listan en `supabase/.env.example`. Arquitectura y diagnóstico: [`docs/PAGOS.md`](docs/PAGOS.md); mails: [`docs/EMAILS.md`](docs/EMAILS.md).

## Scripts
| Comando | Qué hace |
|---|---|
| `npm start` | servidor de desarrollo |
| `npm run build:prod` | compilación de producción en `dist/masuma-web/browser` |
| `npm test` | pruebas del frontend (Vitest) |
| `npm run test:functions` | pruebas de la validación de firma de Mercado Pago |
| `npm run format` | Prettier sobre `src/` |
| `npm run catalog:media` | convierte fotos y extrae descripciones del catálogo viejo (`design/originals/masuma-catalogo 2/`) a `public/media/productos/` y `docs/catalogo-medios.json`, y recorta el fondo blanco de las fotos de producto con `tools/cutout_white.py` (requiere Pillow; para el recorte, `numpy` y `scipy`) |
| `npm run catalog` | regenera `seed.sql` y las redirecciones 301 (`tools/generate_catalog.py`); suma descripción y fotos si existe `docs/catalogo-medios.json` |
| `npm run check:redirects` | verifica las redirecciones del sitio viejo |
| `npm run serve:dist` | sirve la compilación para probarla como en producción |

## Deploy
Importar el repositorio en Vercel (usa `vercel.json`: cabeceras de seguridad, CSP, redirecciones) y apuntar `masuma.com.ar` desde el DNS actual. Las Edge Functions se despliegan con `supabase functions deploy`.

## Mapa de la documentación
Índice completo en [`docs/INDICE.md`](docs/INDICE.md). Lo esencial:
- `docs/ESTRUCTURA.md`: carpetas y qué hay en cada una.
- `docs/HOME.md`: cómo cambiar video, imágenes, servicios, marcas y logo.
- `docs/DISENO.md`: colores globales y botones.
- `docs/PENDIENTES.md`: lista de todo lo que falta y qué datos pedir a la empresa.
- `docs/ARQUITECTURA-INFORMACION.md`: menú y normalización del catálogo.
- `docs/REUNION-CLIENTE.md`: checklist de la reunión.

## Seguridad (reglas del proyecto)
- La Publishable key (o la anon key legacy) es pública; los datos se protegen con RLS. Nunca exponer la Secret key ni la `service_role`.
- Contraseñas, claves y tarjetas nunca se comparten por chat ni van al repositorio; los secretos viven solo en Supabase Secrets.
- Precios y totales se calculan en el servidor. No existe "marcar como pagado" a mano.
- Cabeceras y CSP definidas en `vercel.json`.

## Licencias de terceros
`THIRD_PARTY_NOTICES.md` (técnica de scroll video adaptada de scroll-world, MIT). Los logos de marcas y las fotos pertenecen a sus dueños: confirmar derechos de uso antes de publicar (ver `docs/PENDIENTES.md`).
