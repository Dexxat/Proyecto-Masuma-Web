# Diseño: colores globales y botones

## Paleta: modo noche verde militar mate
Está al principio de `src/styles.scss`, en `:root`, y es la **única fuente de colores**. Cambiar un valor ahí lo cambia en todo el sitio. Colores del logo (medidos sobre `logo.webp`): verde `#188848`, amarillo `#F8E000`; el sitio usa versiones apagadas de ambos.

| Variable | Valor | Uso |
|---|---|---|
| `--bg` | `#2b3d32` | fondo de página |
| `--surface` | `#344a3c` | tarjetas, encabezado, Nosotros, contacto |
| `--surface-2` | `#243329` | bandas hundidas (cinta de palabras), inputs |
| `--line` | `#4d6556` | bordes suaves |
| `--ink` / `--ink-soft` / `--muted` | `#eef1e8` / `#cdd5c6` / `#a3b0a0` | texto principal, secundario, etiquetas (nunca blanco puro) |
| `--green-900…400` | `#1f2d25` → `#5c7f69` | hero, estante de productos, tarjetas de servicios |
| `--brand-green` | `#188848` | verde exacto del logo, solo detalles |
| `--gold-600…400` | `#a8861f` → `#d3b44a` | acentos mostaza. **No pasar de `--gold-400`** |
| `--gray-900…500` | `#171b18` → `#6b756d` | degradés sobre fotos, textos sobre fondo claro |
| `--brand` / `--on-brand` | `--gold-500` / `#1c1f14` | botones (INGRESAR) y su texto |
| `--btn-border`, `--btn-border-idle`, `--btn-border-w`, `--btn-hover-bg`, `--btn-hover-shadow`, `--radius-pill` | | botones del encabezado |
| `--stroke`, `--weight-text`, `--weight-strong` | `2` / `500` / `700` | trazo de íconos y pesos tipográficos |
| `--header-bg` / `--header-line` | `#1b2820` / `--gold-400` | fondo del encabezado (más oscuro que las tarjetas; tope `#15201a`) y su borde inferior, que es el mismo amarillo del avioncito miniatura |
| `--services-bg` / `--services-bg-2` | `#52695a` / `#47604f` | banda salvia de Servicios (más clara: `#5b7364`, no aclarar más sin oscurecer el texto) |
| `--space-section` | `clamp(2.5rem, 6vw, 5rem)` | aire entre secciones del home |

Reglas:
- Los amarillos van **solo en acentos**: botón INGRESAR, borde del link activo, puntos de los carruseles, bordes en hover, estrellitas de la cinta.
- Alternar tonos para no armar una pared verde: Nosotros sobre `--surface`, cinta de palabras sobre `--surface-2`, servicios con borde `--gold-600`, estante en `--green-900`, contacto sobre `--surface`.
- La banda de marcas lleva fondo blanco roto `#e9ece4` porque los logos oscuros se pierden sobre verde.
- Sobre fotos (servicios, Nosotros) el degradé inferior es `--gray-900` al 85 % para leer el texto.
- Contraste: `--ink` sobre `--bg` ≈ 9:1; `--muted` sobre `--bg` ≈ 4,8:1 (AA).

## Menú del encabezado
**Sitio de una sola página.** Los tres botones (con su avioncito mostaza que "arranca" al pasar el mouse) bajan con scroll suave a su sección del home: NOSOTROS → `#nosotros` (Nosotros, marcas y Servicios), PRODUCTOS → `#productos` (estante), CONTACTO → `#contacto` (Contacto y Trabaje con nosotros). Lo maneja `src/app/core/section-nav.ts`: marca el botón de la sección visible (`.navlink.on`), actualiza la URL (`/#productos`) y, desde otras pantallas, vuelve al home y baja a la sección. El logo lleva al inicio del hero. Las URLs viejas `/nosotros`, `/contacto` y `/productos` redirigen a su ancla; la grilla con filtros está en `/catalogo`. El encabezado es más oscuro que el resto, con sombra y borde inferior amarillo.

**Estante:** los tipos siguen `product_types.sort` (Pilatus Aircraft primero, luego Neumáticos, Baterías, AeroSpecialties, Otros). La fila de Pilatus se destaca (`.row.featured`: más grande, acento amarillo, avión entero) y en vez de precio muestra «Consultar este modelo» y, si hay, «Ver video».

## Avioncito y logo del encabezado
Cuando el avión del video sale de cuadro, un avión de contorno (mostaza, `--gold-400`) sube desde abajo del encabezado y se posa a la izquierda, y junto a él aparece el **logo circular en miniatura** (44 px; 34 px en celular). Van ligados al scroll mediante la variable CSS `--fly` (0 a 1) que escribe `shared/hero.ts`; se regula con `hero.landFrom` y `hero.landTo` en `site.config.ts`. Fuera del home `--fly` no existe y ambos se ven desde el inicio.

## Cintas (marquesinas)
| Cinta | Sentido | Duración |
|---|---|---|
| Marcas (`shared/brands-marquee.ts`) | ← izquierda | 52 s (40 s en celular) |
| Palabras clave (`.marquee.rev` en `pages/home.ts`) | → derecha | 60 s (6 frases, letra 0,7 rem) |

Las palabras salen de `site.ribbonWords`. Cada mitad de la cinta repite las frases (`fill`, hoy 2 veces) para ser más ancha que la pantalla y que nunca quede un tramo vacío. Si se agregan o quitan frases, subir o bajar la duración en proporción para que la velocidad no cambie. Ambas se pausan con el mouse encima.

## Logo
Solo se usa el logo circular (`public/media/brand/logo.webp`). El original es un JPG de 447 px: pedir el vector (SVG) a la empresa para que se vea nítido a 44 px.

## Hero
- Escritorio (≥ 1100 px): grilla `270px | 1fr | 270px` con logo a la izquierda, AVIATION PARTS / MASUMA INTERNATIONAL en el centro exacto y "Representamos" a la derecha. Por debajo de 1100 px todo se apila centrado.
- El título escala con el ancho (`clamp` en `vw`) para no invadir las columnas laterales; con contorno negro fino. Para agrandarlo: subir el tope (`4.4rem` → `5rem`) y `4.9vw` → `5.4vw`, y bajar las columnas laterales a `240px`.
- INGRESAR (`.hero-cta`) va centrado abajo, justo sobre "Deslizá", y se desvanece con el resto del bloque.
- "Representamos": logos de `site.partners` sin círculo, 122 px (104 en tablet, 102 en celular, 88 en < 480 px), en silueta gris claro; al pasar el mouse recuperan el color. Necesitan fondo transparente.
- Sobre el video hay un degradé oscuro y una capa gris tenue (`rgb(70 72 70 / .10)` en `.hero-scroll .shade`; rango útil .06–.15).
- Si la persona bajó hasta Nosotros y vuelve a subir, al asomar el hero se salta a su inicio y el efecto se repite (`restart()` en `shared/hero.ts`). El clic en el logo del header lleva arriba de todo.
- Encabezado: hasta 1000 px usa dos filas (logo + redes arriba, menú abajo) porque con los avioncitos el menú no entra en una sola.

## Títulos, cajas, Contacto y pie (v7 + v8)
- **Títulos de sección** (Nosotros, Servicios, Productos, Contacto, Trabaje con nosotros) usan la tipografía del hero: mayúsculas, 700, blanco con contorno negro (`--title-stroke`, 1px) y barra amarilla debajo. Tamaños en `--title-xl` (PRODUCTOS), `--title-l` y `--title-m`. Una sola regla en `styles.scss` (bloque v7).
- **Orden del catálogo**: `src/app/core/shelf-order.ts` (`orderTypes`), usado por el servicio y el estante. Pilatus, Neumáticos, Baterías, AeroSpecialties, Otros; reconoce cada tipo por slug o por nombre, sin depender de `sort`. Lo cubre `products-shelf.spec.ts`.
- **Cajas del estante**: interior `--card-bg` (verde casi negro), foto sobre `--card-pic` con foco de luz, borde amarillo `--card-line` (pleno en la seleccionada). La fila de aviones es `.row.lead`.
- **Contacto**: título afuera (`.sec-head`), caja amarilla `--contact-bg` con textos negros y borde negro mínimo (`--contact-stroke`), aro amarillo separado por una franja del fondo (`--contact-ring`) y logo abajo de los datos. `#contacto` es el contenedor (incluye el título).
- **Trabaje con nosotros**: caja gris clara compacta y centrada (`--jobs-bg`), título amarillo con borde negro, mail como botón negro.
- **Pie**: franja oscura con borde amarillo arriba: marca, legales, redes y copyright con el año actual.
