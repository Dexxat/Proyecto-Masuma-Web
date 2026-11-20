# Checklist para la reunión con MASUMA
Todavía no se pidió ningún dato a la empresa. El proyecto está construido para funcionar con **configuración**, así que ningún punto de esta lista bloquea el desarrollo, pero varios bloquean el **lanzamiento**.

## A. Decisiones de negocio (definen el alcance)
- [ ] ¿Se vende online o se cotiza por consulta? (hoy el sitio no muestra precios ni permite comprar)
- [ ] ¿Qué productos se venden online y cuáles son "consultar precio"?
- [ ] ¿Precios en pesos, en dólares o ambos? ¿Quién actualiza los precios y con qué frecuencia? (si hay precio en USD, ¿cuál es el tipo de cambio?)
- [ ] ¿Venta a consumidor final, a empresas/talleres, o ambos? (condiciona facturación y datos fiscales)
- [ ] Zonas de envío, transportes, costos de envío (¿gratis desde cierto monto?), retiro en sucursal, plazos
- [ ] Política de stock: ¿hay stock real en el sistema o se maneja por fuera? ¿Quién lo carga?
- [ ] Cambios y devoluciones, garantía, y botón de arrepentimiento (obligatorio por ley)

## B. Pagos
- [ ] ¿Qué medios aceptan? (tarjetas vía Mercado Pago, PayPal, transferencia, otros). ¿Cuotas? ¿Medios offline?
- [ ] Cuenta de **Mercado Pago**: ¿existe?, ¿a nombre de quién (razón social/CUIT)? Quién crea la aplicación y entrega las credenciales de prueba y producción.
- [ ] Cuenta de **PayPal Business**: ¿existe?, ¿qué monedas acepta? (confirmar si admite pesos; el sistema está diseñado para cobrar en USD)
- [ ] Facturación: ¿se emite factura electrónica (AFIP/ARCA)? ¿Quién la hace y con qué sistema? ¿Se integra o es manual?
- [ ] Condición fiscal (monotributo / responsable inscripto) y qué datos mostrar al cliente en la factura
- [ ] Datos bancarios para recibir los fondos (los configura el titular directamente en cada plataforma; no se comparten con el desarrollador)

## C. Mails
- [ ] Dirección remitente (por ejemplo, un "no responder" y una casilla de soporte real)
- [ ] Casillas internas que reciben los avisos de nuevos pedidos y de pedidos para revisar
- [ ] Nombre comercial, logo, colores y firma
- [ ] Textos de los mails (revisar y aprobar los borradores)
- [ ] Acceso al **DNS** del dominio para agregar SPF, DKIM y DMARC sin romper el correo actual. ¿Dónde está alojado el correo hoy?

## D. Dominio y hosting
- [ ] Quién es el titular de `masuma.com.ar` en NIC Argentina y quién tiene el acceso
- [ ] Dónde está el DNS actual (¿quién administra los registros?)
- [ ] Acceso al hosting actual (WordPress.com) para migrar contenido, usuarios, imágenes y redirecciones; fecha de vencimiento del plan actual
- [ ] Cuentas de Vercel, Supabase y del proveedor de mails **a nombre de la empresa** (con un administrador de la empresa)

## E. Contenido y marca
- [ ] Catálogo completo con fichas técnicas, SKU, marcas, modelos y fotos de calidad (¿quién las tiene?)
- [ ] Logo en vectorial, paleta y tipografías, si existen; referencias de sitios que les gusten
- [ ] Textos: Quiénes somos, Servicios, Contacto, Cómo comprar, Términos y condiciones, Política de privacidad
- [ ] Redes sociales activas, WhatsApp comercial y teléfonos
- [ ] Noticias/novedades: ¿se van a mantener? ¿Quién las escribe?

## F. Usuarios y datos personales
- [ ] ¿Cuántos usuarios y pedidos tiene el sitio actual? ¿Se migran? (las contraseñas no se pueden migrar: se pide restablecerlas)
- [ ] Inscripción de la base de datos de clientes (Ley 25.326) y responsable de datos
- [ ] ¿Quiénes serán administradores del panel? (máximo pocos, con verificación en dos pasos)

## G. Operación y mantenimiento
- [ ] ¿Quién atiende los pedidos y los casos en `review`? ¿En qué horarios?
- [ ] Expectativas de tiempo de respuesta ante problemas (define el plan de mantenimiento)
- [ ] Presupuesto aproximado y fechas deseadas de lanzamiento
- [ ] Analytics: ¿quieren medir ventas y visitas? ¿Tienen cuenta de Google Analytics / Search Console?

## Datos que NO hay que pedir ni recibir por chat o mail
Contraseñas, claves secretas, tarjetas o cuentas bancarias. Las cuentas se crean a nombre de la empresa y el desarrollador recibe acceso delegado o las claves de API por un canal seguro (gestor de contraseñas).
