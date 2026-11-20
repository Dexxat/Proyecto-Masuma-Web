# Arquitectura de información y normalización

Objetivo: agrupar las secciones del sitio, eliminar lo repetido y ordenar los datos del catálogo, para que la web nueva sea más simple de navegar, de mantener y de migrar.

Base: relevamiento del sitio actual (menús, URLs y los 49 productos) del 20/11/2026. Los datos están en `catalogo-normalizado.csv` (una fila por producto, con las observaciones a resolver). **Estructura confirmada por el usuario y ya aplicada al proyecto** (sección 6).

## 1. Estructura confirmada
```
Inicio
NOSOTROS    Quiénes somos · Servicios · Novedades
PRODUCTOS   Neumáticos · Baterías · AeroSpecialties · Favoritos · Cómo comprar · Carrito
CONTACTO    Contacto · Trabaje con nosotros
(fuera de los tres grupos)  Ingresar / Salir · Admin (solo administradores)
(pie de página)             Términos y condiciones · Política de privacidad
```
Tres grupos y el inicio, frente a los 10 ítems del menú principal más 8 de la barra de categorías del sitio actual. En el menú de **Productos** conviven dos bloques: *Catálogo* (los tipos de producto) y *Tu compra* (Cómo comprar, Favoritos, Carrito).

## 2. De lo actual a lo nuevo
| Hoy | Nuevo |
|---|---|
| Quiénes somos, Servicios, Novedades | **Nosotros**: sección `#nosotros` del home (Novedades, sin sección todavía) |
| Productos, Neumáticos, Baterías, Aerospecialties, Productos Powervamp, Otros, Pilatus Aircraft | **Productos**: un solo catálogo con filtros; Aerospecialties y Powervamp pasan a ser una sola categoría |
| Favoritos, ¿Cómo comprar?, Carrito | **Productos › Tu compra** |
| Arrepentimiento de compra | Sección dentro de **Cómo comprar** |
| Contacto, Trabaje con nosotros | **Contacto** (una página con dos secciones) |
| Mi cuenta, Acceder | **Ingresar** (una sola entrada) |
| Términos, Privacidad | Pie de página, con las políticas propias |

## 3. Redundancias detectadas y resueltas
1. "Acceder" y "Mi cuenta" son la misma página y aparecen varias veces: queda una entrada.
2. "Aerospecialties" y "Productos Powervamp" apuntan a la misma URL: una sola categoría (AeroSpecialties, con la marca PowerVamp).
3. Dos barras de navegación y un tercer bloque de categorías en la portada, cargados por separado: un único menú definido en un solo archivo, con los tipos de producto leídos de la base.
4. "Novedades" estaba en tres lugares; "Inicio" en el menú, el pie y el logo: un solo lugar cada uno.
5. La política de privacidad del pie enlazaba a las de Google además de la propia.
6. Una misma ruta mezclaba tipo, marca y segmento (Neumáticos › Goodyear › Aviación General): se separan en ejes (sección 4).
7. Dos productos Gill estaban en la categoría "General", fuera de Baterías.

## 4. Normalización del catálogo
### Lo que muestran los 49 productos
| Tipo | Cantidad | Marcas |
|---|---|---|
| Neumáticos | 15 | Goodyear 9, AeroClassic 4, Specialty Tire of America 2 |
| Baterías | 15 | Gill 9, Concorde 6 |
| AeroSpecialties | 6 | PowerVamp |
| Otros | 6 | BP, Champion (2), GE, Skydrol, Prist |
| Pilatus Aircraft | 5 | Pilatus (aeronaves: información, no se compran) |
| Sin clasificar ("General") | 2 | Gill |

Problemas de datos, con la cantidad de productos afectados:
- **40** guardan la **marca dentro del atributo "Modelo"**; el modelo real solo existe en el título. Un producto usa "Marca" en vez de "Modelo" y la ficha del PC-9 M tiene "Marca: Gill", que es un error.
- **Ninguna ficha tiene número de parte**, ni muestra medida, voltaje, capacidad, posición (Main/Nose) o tipo (Tires/Tubes), aunque los filtros de Posición y Tipo existen.
- **"FLIGHT RADIAL®"** aparece 3 veces con el mismo nombre, distinguido solo por la categoría.
- **Errores puntuales:** "COOLSPOLL 29" (posible error de tipeo), "COOLSPOOL 29 Twin" con una URL que dice 58, y "Ps50C Y Ps30C" son dos productos en una ficha.
- **Fichas pobres** (con umbrales que fijé yo): 20 descripciones de menos de 130 caracteres y 21 productos con una sola foto.

### Modelo: ejes separados en lugar de una categoría mezclada
| Eje | Valores | Uso |
|---|---|---|
| **Tipo de producto** | Neumáticos, Baterías, AeroSpecialties, Otros, Pilatus Aircraft (este último no vendible) | Menú y filtro |
| **Marca** | AeroClassic, BP, Champion Aerospace, Concorde, GE, Gill, Goodyear, Pilatus, PowerVamp, Prist, Skydrol, Specialty Tire of America | Filtro |
| **Segmento** (hoy solo neumáticos Goodyear) | General, Comercial, Militar | Filtro |
| **Atributos técnicos por tipo** (`attributes`) | Neumáticos: medida, capas, posición, con/sin cámara. Baterías: voltaje, capacidad, tipo | Ficha y filtros. Vacíos hasta recibir datos |

Cada producto tiene además **número de parte** (único junto con la marca) y una URL plana `/productos/<slug>`.

## 5. URLs y redirecciones 301
Las 127 redirecciones están en `vercel.json`, generadas desde la columna `ruta_actual` del CSV (`tools/generate_catalog.py`). Cubren cada ficha de producto (con y sin barra final), las categorías antiguas (`/categoria-producto/…` con filtro de tipo y marca) y las páginas del sitio anterior.

| Actual | Nueva |
|---|---|
| `/productos/<cat>/…/<slug>/` | `/productos/<slug>` |
| `/categoria-producto/neumaticos/goodyear/` | `/catalogo?tipo=neumaticos&marca=goodyear` |
| `/quienes_somos/`, `/servicios/`, `/novedades/` | `/#nosotros` |
| `/mi-cuenta/` | `/ingresar` |
| `/anulacion-de-compra/` | `/como-comprar#arrepentimiento` |
| `/trabaje-con-nosotros/` | `/#contacto` |
| `/terminos-y-condiciones/`, `/politica-de-privacidad/` | `/legales/terminos`, `/legales/privacidad` |
| `/promo/` | `/productos` |

`/favoritos`, `/carrito` y `/como-comprar` conservan su dirección. Verificación: `node tools/check-redirects.mjs` comprueba que cada URL antigua del CSV redirige con 301 a un producto que existe en la carga inicial, sin duplicados ni bucles. **A comprobar en una vista previa de Vercel:** que las redirecciones con `#` en el destino conserven el ancla.

## 6. Qué quedó implementado
- **Base de datos** (`0005_catalog_normalization.sql`): tablas de tipos, marcas y segmentos; productos con marca, tipo, número de parte y atributos; favoritos con seguridad por usuario. Reemplaza las columnas y la tabla de categorías anteriores y **se detiene si ya hay productos cargados**, para no destruir datos. La función que arma el pedido ahora solo acepta tipos vendibles.
- **Carga inicial** (`supabase/seed.sql`, generada desde el CSV): nombre, tipo, marca y segmento de los 49 productos. Precios, stock, descripciones y números de parte los completa la empresa desde el panel.
- **Sitio de una sola página** (v6): el menú baja a las secciones del home (`core/section-nav.ts`). Páginas aparte: catálogo (`/catalogo`), fichas, Cómo comprar, Favoritos, Carrito y Legales.
- **Catálogo con filtros** por tipo, marca, segmento y búsqueda; los filtros viven en la URL, así que se pueden compartir y enlazar.
- **Datos de la empresa** en `core/site.config.ts` (teléfono, WhatsApp, mail, dirección): vacíos hasta recibirlos, y no se muestran si están vacíos.

Los textos institucionales, legales, de envío y arrepentimiento son marcadores: los define la empresa.

## 7. Supuestos que tomé (corregibles) y pendientes
1. **Pilatus Aircraft y Otros** no figuraban en tu lista de PRODUCTOS. Los conservé como tipos del catálogo para no perder contenido; Pilatus es informativo y no se compra. Si no van, se quitan con una fila de la base.
2. **Nosotros** es una página con dos secciones (Quiénes somos y Servicios) más la página de Novedades, en lugar de tres páginas.
3. **Los 2 Gill de "General"** se cargaron como Baterías pero **inactivos** hasta confirmar que lo son.
4. **El carrito** vive dentro de Productos, como pediste, con un contador al lado.
5. **Las URLs originales de producto se conservaron**, incluida la de COOLSPOOL (58); corregir los nombres con errores queda para cuando se revise el catálogo con la empresa.
6. **Pendientes:** formulario de contacto y de postulación, origen de las Novedades (hoy vacía), textos legales y datos técnicos por producto (número de parte, medidas, voltajes), y qué diferencia a los tres "FLIGHT RADIAL" entre sí.
7. **Modernizar el diseño** no se hizo todavía; el aspecto actual es provisorio.
