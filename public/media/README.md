# Medios del sitio

Todo lo que está acá se sirve públicamente. Los originales sin procesar van en `design/originals/`.

| Carpeta | Contenido | Se referencia en |
|---|---|---|
| `hero/` | `hero.mp4` (1280×720), `hero-mobile.mp4` (540p), `hero-poster.jpg` | `site.hero` |
| `footer/` | video de cierre (avión aterrizando): `footer.mp4` (1280×720, clave cada 8), `footer-mobile.mp4` (960×540, clave cada 4), `footer-poster.jpg` (primer cuadro), `footer-end.jpg` (último) | `site.outro` (ver `docs/HOME.md`) |
| `brand/` | `logo.webp` (logo circular) | `site.logo` |
| `brands/` | logos de las marcas (SVG o PNG con fondo transparente) | `site.brands` |
| `nosotros/` | 6 fotos con color unificado (`nosotros-1..6.webp`) | `site.about.images` |
| `servicios/` | 5 fotos de las tarjetas de servicios (`servicios-1..5.webp`) | `site.services[].images` |
| `productos/` | 94 fotos, planos y medidas de los 49 productos (WebP, máx. 1600 px), generadas por `npm run catalog:media`. 53 fotos de producto tienen el fondo blanco recortado (transparente); los planos/medidas y las fotos ambientadas conservan su fondo | columnas `image_url` e `images` de `products` (vía `seed.sql`) |

Cómo regenerar: video con ffmpeg (comandos en `docs/HOME.md`, el video necesita fotogramas clave frecuentes `-g 8`/`-g 4`); fotos de Nosotros con `python3 tools/grade_nosotros.py originales...`; el resto con `convert original.jpg -resize 1920x1920\> -quality 80 salida.webp`.
Los originales de Nosotros en `design/originals/nosotros/` llevan el mismo número que su versión procesada.
