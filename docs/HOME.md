# Home: cómo cargar el contenido

Todo el contenido del home sale de `src/app/core/site.config.ts`. Vacío = se ve un marcador, nunca un dato inventado.

## 1. Hero con video controlado por el scroll
**Estado:** ya está cargado el video real (`public/media/hero/hero.mp4`, plano de las ruedas → despegue → toma cenital; 10 s, 24 fps, 1280×720). La toma cenital viene dentro del mismo video, por eso `aerialImage` queda vacío (es opcional: si se carga una imagen aparte, entra con fundido en el último 28 % del recorrido).

Config: `site.hero = { video, videoMobile, poster, aerialImage }`.

**Cómo funciona:** la sección mide ~5 pantallas y el cuadro queda pegado (sticky). El progreso del scroll mueve el tiempo del video (`currentTime`) con interpolación para que no salte. El texto del hero (logo circular, título, INGRESAR, «Representamos») se desvanece en los primeros pasos. Sin video, si falla la carga o con «reducir movimiento» activado en el sistema, es un hero estático con el póster. Técnicas tomadas del motor *scroll-world* (MIT, ver `docs/scroll-world/` y `THIRD_PARTY_NOTICES.md`): el video se carga como Blob (siempre se puede «seekear»), no se encolan seeks mientras el decodificador no terminó el anterior, el póster se ve hasta que el video pinta un cuadro real y en celulares se «arranca» el video en el primer toque (iOS).

**Importante — el video original no servía tal cual para scrub:** traía solo 2 fotogramas clave en 240 cuadros (cada seek obliga a decodificar decenas de cuadros → trabas) y audio. Se recodificó con un fotograma clave cada 8 cuadros y sin audio:
```
# escritorio: 7,1 MB
ffmpeg -i original.mp4 -an -vf "unsharp=5:5:0.8:5:5:0.0" -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p -g 8 -keyint_min 8 -sc_threshold 0 -movflags +faststart hero.mp4
# celular (540p, fotograma clave cada 4): 5,1 MB
ffmpeg -i original.mp4 -an -vf "scale=-2:540,unsharp=5:5:0.6:5:5:0.0" -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p -g 4 -keyint_min 4 -sc_threshold 0 -movflags +faststart hero-mobile.mp4
# póster (primer cuadro)
ffmpeg -i original.mp4 -frames:v 1 -vf scale=1280:-2 -q:v 3 hero-poster.jpg
```
Para cambiar el video: reemplazar los archivos de `public/media/hero/` con esos mismos comandos. Si en celulares se traba, bajar `-g` a 2 (o 1) o subir el `crf`. Si el video se aloja en Supabase Storage, la CSP de `vercel.json` ya permite `media-src https://*.supabase.co`.
Pendiente de decidir: el video original es 720p, así que en pantallas grandes se ve algo blando; si se consigue una versión 1080p se recodifica igual.

## 2. Nosotros: galería anclada
`site.about.images` (hoy 6 fotos: PC-12 de frente, cabina, hangar, jet negro, tren de aterrizaje y PC-24 de noche, en el orden numérico de los nombres de archivo). Las imágenes quedan fijas respecto de la pantalla y el cuadro con bordes redondeados las «recorta» mientras baja; a medida que el cuadro cruza la pantalla, la imagen cambia con un fundido (puntos indicadores abajo). Componente: `shared/anchor-gallery.ts`.

**Filtro de color unificado:** las fotos venían con colores muy distintos (cielo celeste, noche azul, pasto, amarillo). Se igualaron con `tools/grade_nosotros.py`: nivelación de exposición + mapa de degradé azul acero al 50 % + color original atenuado al 50 %, de modo que el color de cada foto se suaviza y los aviones y ruedas siguen destacando. Para regenerar o sumar fotos: `python3 tools/grade_nosotros.py f1.jpg f2.jpg ...` (genera `public/media/nosotros/nosotros-N.webp`). Ajustes en el script: `MIX` (más = más uniforme) y `KEEP` (más = más color original).
Notas: las fotos más chicas (hangar 1063 px, cabina 1000 px) se ven algo blandas en pantallas grandes porque la imagen anclada ocupa todo el ancho; conviene conseguir versiones de ≥1800 px. **Confirmar los derechos de uso** de las fotos (parecen de fabricantes/terceros) antes de publicar.

## 3. Servicios (dos tarjetas grandes)
Un título corto (`site.servicesTitle`) y el párrafo de Pratt & Whitney (`site.servicesIntro`) arriba; debajo, **dos tarjetas**: *Servicios de mantenimiento* y *Capacitación* (la venta se quitó porque la tienda ya cubre eso). `site.services[i] = { title, items[], images[] }`.
- Las imágenes de cada tarjeta (todas las que se quiera) **cambian solas** con fundido suave y zoom lento; cada una se ve `site.servicesSlideMs` ms (5500 por defecto) y la segunda tarjeta arranca desfasada. Se frena mientras el mouse o el foco están encima; con «reducir movimiento» no cambian solas. Puntos indicadores arriba a la derecha.
- La lista de servicios (`items`) aparece al pasar el mouse, enfocar o tocar la tarjeta.
- Hoy: 3 fotos de mantenimiento y 2 de capacitación en `public/media/servicios/`. Derechos de uso por confirmar (se ven marcas ajenas); la del turbofán parece generada con IA.
- Los títulos alimentan también la cinta oscura que corre debajo de las marcas.

## 3b. Marcas (cinta que avanza a la izquierda)
`site.brands = [{ name, logo, h? }]`, al final de Nosotros. Logos en `public/media/brands/` (SVG o PNG con fondo transparente; hoy Gill, Pratt & Whitney, Powervamp, Pilatus y Goodyear). Van en gris suave y recuperan el color al pasar el mouse, que además frena la cinta. `h` = alto máximo en px (por defecto 58; Gill y Pratt & Whitney usan 84 y 88 porque son más cuadrados). Sin logo se muestra el nombre. Con «reducir movimiento» la cinta queda quieta. Componente: `shared/brands-marquee.ts`.

## 3c. Logo y avioncito del encabezado
- `site.logo` = `media/brand/logo.webp` (logo circular de MASUMA, 447 px de origen: pedir el vector). Se muestra en el círculo del hero; en el encabezado ya no hay nombre de texto.
- **Avioncito:** cuando el avión del video sale de cuadro (`site.hero.landFrom` ≈ 55 % del scroll), un avión de contorno sube desde abajo del encabezado y queda posado a la izquierda (`landTo` ≈ 80 %), con una sombra suave; al subir el scroll vuelve a despegar. Fuera del home aparece ya posado y lleva al inicio. Lo maneja la variable CSS `--fly` (0–1) que escribe `shared/hero.ts` y lee `.mini` en `styles.scss`.

## 4. Productos (estante tipo menú de consola)
Se alimenta de la base (no de la configuración). Un carril por **tipo vendible** (hoy: Neumáticos, Baterías, AeroSpecialties, Otros; Pilatus es informativo y no aparece). Se mueve con scroll lateral, flechas, teclas ← → o tocando un producto lateral. El del centro se agranda y muestra la ficha (número de parte, segmentos, descripción, atributos técnicos, precio y stock); los demás se achican y atenúan.
- **Corazón** en cada producto: favorito (requiere sesión). El botón «Favoritos» de arriba filtra solo los favoritos.
- **Ícono de carrito / «Pick up»:** activa el modo selección; aparece un botón de carrito en la ficha para marcar varios productos y «Agregar al carrito» los suma juntos. Solo se pueden marcar productos con precio y stock.
- Las imágenes salen de `products.image_url`; la ficha técnica, de `products.attributes` (jsonb).

## Notas técnicas
- Altura del encabezado: la app publica `--hh` en `:root` (se recalcula si el encabezado cambia de tamaño) y las secciones pegadas la usan.
- Accesibilidad: el video es decorativo (`aria-hidden`), el carril se maneja con teclado, y con «reducir movimiento» se apagan el scroll video y las animaciones.
- Pendiente de decidir con la empresa/diseño: tipografía y colores definitivos (ver `docs/DISENO.md`).

## Video de cierre (el avión aterriza)
Al final del home, después de Contacto y antes del pie: mismo recurso que el hero (el scroll mueve el tiempo del video), pero a la inversa. Termina en las ruedas detenidas sobre la pista, el mismo plano con el que empieza el hero. Componente `src/app/shared/outro-video.ts`, configuración en `site.outro` (`site.config.ts`), archivos en `public/media/footer/`.
- **Largo del recorrido:** `--outro-len` en `.outro` (`styles.scss`, en pantallas; 4 por defecto). **Que llegue antes al último cuadro:** bajar `site.outro.end` (0.88).
- El video se descarga recién cuando la sección está a ~2 pantallas. Con «reducir movimiento» o si falla, se ve `footer-end.jpg`.
- Hay un corte de plano en el cuadro 95 (≈ 3,9 s), que viene del video original.

Para regenerarlo con otro video (hace falta muchos fotogramas clave, igual que el hero):
```bash
# escritorio
ffmpeg -i original.mp4 -an -vf "unsharp=5:5:0.8:5:5:0.0" -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p -g 8 -keyint_min 8 -sc_threshold 0 -movflags +faststart footer.mp4
# celular
ffmpeg -i original.mp4 -an -vf "scale=-2:540,unsharp=5:5:0.6:5:5:0.0" -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p -g 4 -keyint_min 4 -sc_threshold 0 -movflags +faststart footer-mobile.mp4
# primer y último cuadro
ffmpeg -i original.mp4 -frames:v 1 -vf scale=1280:-2 -q:v 3 footer-poster.jpg
ffmpeg -i original.mp4 -vf "select=eq(n\,239),scale=1280:-2" -frames:v 1 -q:v 3 footer-end.jpg
```
