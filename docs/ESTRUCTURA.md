# Estructura del proyecto

```
masuma-web/
├─ src/app/
│  ├─ app.ts, app.routes.ts, app.config.ts   encabezado (3 botones + redes + avioncito), rutas, configuración
│  ├─ core/                                   servicios y configuración (sin pantallas)
│  │   ├─ site.config.ts      TODO el contenido de la empresa (textos, servicios, marcas, hero, contacto, redes)
│  │   ├─ env.ts              URL y Publishable key de Supabase (públicas)
│  │   ├─ section-nav.ts      menú de una sola página: Nosotros / Productos / Contacto bajan a su sección del home
│  │   ├─ supabase.service.ts, auth.service.ts, auth.guard.ts, admin.guard.ts, admin.service.ts
│  │   ├─ catalog.service.ts, favorites.service.ts
│  │   ├─ cart.service.ts     carrito (tabla cart_items) + inicio del pago + estado del pedido   ◄ PAGOS
│  │   └─ models.ts           tipos
│  ├─ pages/                  una pantalla por ruta
│  │   ├─ home.ts             arma el home con las secciones de shared/
│  │   ├─ catalog.ts (/catalogo), product.ts, favoritos.ts, como-comprar.ts, legales.ts, login.ts
│  │   ├─ cart.ts             carrito y botones de pago                                            ◄ PAGOS
│  │   └─ pago-resultado.ts   pantalla de retorno: consulta el estado real del pedido             ◄ PAGOS
│  ├─ shared/                 secciones reutilizables
│  │   ├─ hero.ts             scroll video + avioncito que aterriza en el encabezado
│  │   ├─ anchor-gallery.ts   imágenes "ancladas" de Nosotros
│  │   ├─ brands-marquee.ts   cinta de marcas
│  │   ├─ services-section.ts dos tarjetas con galería automática
│  │   ├─ products-shelf.ts   estante tipo menú de consola (favoritos y modo Pick up)
│  │   ├─ contact-section.ts, icons.ts
│  └─ admin/                  panel /admin: pedidos, detalle con traza, productos
├─ src/styles.scss            estilos globales; arriba están los colores y medidas globales (tokens)
├─ public/media/              imágenes y video que sirve el sitio (ver public/media/README.md)
├─ design/originals/          archivos originales recibidos (no se sirven): logos, fotos, video, catálogo del sitio anterior (masuma-catalogo 2/)
├─ supabase/
│  ├─ migrations/             0001 esquema+RLS · 0002 pagos · 0003 admin · 0004 mails · 0005 normalización · 0006 galería de fotos · 0007 permisos (grants) · 0008 orden de tipos + video
│  ├─ seed.sql                49 productos
│  ├─ functions/              Edge Functions (Deno): pagos, webhooks, mails, reproceso admin
│  │   └─ _shared/            módulos comunes: payments, paypal, mp-signature (+tests), outbox, email, log, http
│  ├─ config.toml             qué funciones no usan JWT (webhooks y cron)
│  └─ .env.example            lista de secretos a cargar
├─ tools/                     generate_catalog.py, import_catalog_media.py, check-redirects.mjs, grade_nosotros.py
├─ docs/                      documentación (ver INDICE.md)
├─ vercel.json                hosting: cabeceras, CSP, 301 del sitio viejo
└─ .vscode/                   extensiones, ajustes, depuración
```

## Convenciones
- **Contenido** en `site.config.ts` o en la base; nada de datos de la empresa escritos dentro de componentes.
- Componentes standalone con señales; rutas con carga diferida.
- Colores y bordes solo con las variables de `styles.scss` (ver `DISENO.md`).
- Lo que toca dinero o estados de pedido **solo** se cambia desde el servidor (funciones y SQL), nunca desde el navegador.
