-- Generado por tools/generate_catalog.py desde docs/catalogo-normalizado.csv (no editar a mano).
-- Carga nombre, tipo, marca y segmento; y, desde docs/catalogo-medios.json, la descripción y las fotos del sitio anterior.
-- Precios, stock y números de parte los completa la empresa desde el panel.
-- Si el producto ya existe, la descripción y las fotos solo se completan cuando están vacías (no pisa lo editado en el panel).
insert into public.product_types (name, slug, sellable, sort) values
  ('Pilatus Aircraft', 'pilatus', false, 1),
  ('Neumáticos', 'neumaticos', true, 2),
  ('Baterías', 'baterias', true, 3),
  ('AeroSpecialties', 'aerospecialties', true, 4),
  ('Otros', 'otros', true, 5)
on conflict (slug) do nothing;

insert into public.segments (name, slug) values
  ('General', 'general'),
  ('Comercial', 'comercial'),
  ('Militar', 'militar')
on conflict (slug) do nothing;

insert into public.brands (name, slug) values
  ('AeroClassic', 'aeroclassic'),
  ('BP', 'bp'),
  ('Champion Aerospace', 'champion-aerospace'),
  ('Concorde', 'concorde'),
  ('GE', 'ge'),
  ('Gill', 'gill'),
  ('Goodyear', 'goodyear'),
  ('Pilatus', 'pilatus'),
  ('PowerVamp', 'powervamp'),
  ('Prist', 'prist'),
  ('Skydrol', 'skydrol'),
  ('Specialty Tire of America (STA)', 'specialty-tire-of-america-sta')
on conflict (slug) do nothing;

insert into public.products (slug, name, type_id, brand_id, active, description, image_url, images, video_url)
select v.slug, v.name, t.id, b.id, v.active, v.description, v.image_url, v.images, v.video_url
from (values
  ('12-24ga', '12/24GA', 'aerospecialties', 'powervamp', true, 'Un GPU de doble voltaje, de precio económico
2400 AMPERIOS DE PEAK
12 O 24 VOLTS
25 KG DE PESO
CONSTRUCCIÓN DURABLE Y ROBUSTA
IDEAL PARA AERONAVES CON MOTORES A PISTÓN
INCLUYE CABLE DE CONEXIÓN', 'media/productos/foto3a.webp', array['media/productos/foto3a.webp', 'media/productos/foto3b.webp', 'media/productos/foto3c.webp', 'media/productos/foto3d.webp', 'media/productos/foto3e.webp']::text[], null),
  ('ac-10-00-channel', 'AC 10.00 Channel', 'neumaticos', 'aeroclassic', true, 'Compuesto de caucho avanzado para una mayor durabilidad.
Dos surcos profundos y hombros cuadrados le dan mayor contacto de Area.
Guiones Vintage con hombros y robusta profundidad 6/32´de banda de rodamiento.', 'media/productos/aeroclassic-ac.webp', array['media/productos/aeroclassic-ac.webp']::text[], null),
  ('ac-10x3-50-4', 'AC 10×3.50-4', 'neumaticos', 'aeroclassic', true, 'Hombro en escuadra, 4 surcos.
Aplicaciones para trabajo pesado, 6 telas.
Baja deflexión de la carcasa.
Alta Dureza, compuesto de Caucho de larga duración.', 'media/productos/aeroclassic-ac.webp', array['media/productos/aeroclassic-ac.webp']::text[], null),
  ('ac-2-80-2-50-4', 'AC 2.80/2.50-4', 'neumaticos', 'aeroclassic', true, 'De alta resistencia y baja deflexión.
Compuesto de Caucho de goma duradera.
Diseño de canal Recto para un excelenteseguimiento.
6 telasnominal , mayor resistencia F.O.D.', 'media/productos/aeroclassic-ac280-250.webp', array['media/productos/aeroclassic-ac280-250.webp']::text[], null),
  ('ac-4-00-6-6ply', 'AC 4.00-6 6ply', 'neumaticos', 'aeroclassic', true, 'Perfil con 4 surcos profundos para una mayor duración.
Compuesto de Caucho de Larga duración 5/32″ de profundidad del dibujo.
Soporte de velocidad de 50MPH.
Capacidad de carga de 550 Lbs a 43 Lbs PSI.', 'media/productos/aeroclassic-ac.webp', array['media/productos/aeroclassic-ac.webp']::text[], null),
  ('aceite-bp-turbo-2380', 'Aceite BP Turbo 2380', 'otros', 'bp', true, 'BP Turbo 2380 es un aceite lubricante sintético cSt 5 que está aprobado en contra de Estados Unidos especificación militar MIL-PRF-23699 ETS, y la especificación militar del Reino Unido DEF STAN 91-101 (sustituido DERD 2499).
Este lubricante proporciona una combinación equilibrada de estabilidad térmica ya la oxidación, la capacidad de transporte de carga, menor volatilidad y tiene las mejores características de flujo a baja temperatura de los 5 aceites para turbinas cSt', 'media/productos/bp-turbo.webp', array['media/productos/bp-turbo.webp']::text[], null),
  ('bujias-champion', 'Bujías CHAMPION', 'otros', 'champion-aerospace', true, 'CHAMPION cuenta con la bujía ideal para cada motor (carburados y fuel injection) y bujías especiales de uso industrial, marinos, etc.
Las bujías CHAMPION tienen más especificaciones de equipo original que cualquier otra bujía fabricada en el mundo.
CHAMPION la bujía más recomendada en el mundo entero, gracias a su calidad de fabricación. El líder te respalda.', 'media/productos/bujias01.webp', array['media/productos/bujias01.webp', 'media/productos/bujias02.webp']::text[], null),
  ('concorde-rg380-40l', 'Concorde RG380/40L', 'baterias', 'concorde', true, 'Voltage: 24v
Rated Capacity C1 = 1 hr. Rate in ampere hours: 38.00
Max Weight: 84.00 lb / 38.1 kg', 'media/productos/bateria-condorde-rg380-40l.webp', array['media/productos/bateria-condorde-rg380-40l.webp', 'media/productos/bateria-condorde-rg380-40l-plano.webp']::text[], null),
  ('concorde-rg380-60l', 'Concorde RG380/60L', 'baterias', 'concorde', true, 'Voltage: 24v
Rated Capacity C1 = 1 hr. Rate in ampere hours: 48.00
Max Weight: 96.00 lb / 43.6 kg', 'media/productos/bateria-condorde-rg380-60l.webp', array['media/productos/bateria-condorde-rg380-60l.webp', 'media/productos/bateria-condorde-rg380-60l-plano.webp']::text[], null),
  ('concorde-rg380-e44', 'Concorde RG380/E44', 'baterias', 'concorde', true, 'Voltage: 24v
Rated Capacity C1 = 1 hr. Rate in ampere hours: 42.00
Max Weight: 86.00 lb / 39.0 kg', 'media/productos/bateria-condorde-rg380-e44.webp', array['media/productos/bateria-condorde-rg380-e44.webp', 'media/productos/bateria-condorde-rg380-e44-plano.webp']::text[], null),
  ('concorde-rg380-e44k', 'Concorde RG380/E44K', 'baterias', 'concorde', true, 'Voltage: 24v
Rated Capacity C1 = 1 hr. Rate in ampere hours: 42.00
Max Weight: 89.00 lb / 40.4 kg', 'media/productos/bateria-condorde-rg380-e44k.webp', array['media/productos/bateria-condorde-rg380-e44k.webp', 'media/productos/bateria-condorde-rg380-e44k-plano.webp']::text[], null),
  ('concorde-rg380-e44l', 'Concorde RG380/E44L', 'baterias', 'concorde', true, 'n

Voltage: 24v
Rated Capacity C1 = 1 hr. Rate in ampere hours: 38.00
Max Weight: 84.00 lb / 38.1 kg', 'media/productos/bateria-condorde-rg380-e44l.webp', array['media/productos/bateria-condorde-rg380-e44l.webp', 'media/productos/bateria-condorde-rg380-e44l-plano.webp']::text[], null),
  ('concorde-rg390', 'Concorde RG390', 'baterias', 'concorde', true, 'n

Voltage: 24v
Rated Capacity C1 = 1 hr. Rate in ampere hours: 28.00
Max Weight: 62.00 lb / 28.1 kg', 'media/productos/bateria-condorde-rg390.webp', array['media/productos/bateria-condorde-rg390.webp', 'media/productos/bateria-condorde-rg390-plano.webp']::text[], null),
  ('coolspoll-29', 'COOLSPOLL 29', 'aerospecialties', 'powervamp', true, 'Es un GPU portátil, fácil de manipular y transportar a bordo de la aeronave.
Resistencia excelente al efecto del tiempo, la luz del sol y el ozono.
28 VOLTS
2400 AMPERIOS DE PEAK
IDEAL PARA AVIONES Y HELICÓPTEROS QUE EXIJAN MAS DE 24 VOLTS PARA ARRANQUES
PESO: 28 kg', 'media/productos/foto4c.webp', array['media/productos/foto4c.webp', 'media/productos/foto4d.webp', 'media/productos/foto4b.webp', 'media/productos/foto4a.webp']::text[], null),
  ('coolspool-58', 'COOLSPOOL 29 Twin de 28v', 'aerospecialties', 'powervamp', true, 'Dos potentes unidades de arranque de aeronaves de 28 V CC conectadas en paralelo para duplicar la capacidad de arranque de la turbina, adecuadas para aviones y helicópteros de doble turbina más grandes donde se requiere capacidad adicional de amperios / hora para mantener el voltaje bajo carga.

4800 amperios pico
Baterías AGM de plomo ácido selladas
Autorizado para el transporte aéreo
Cargador interno con estado LED
Caja de aluminio con asa de transporte.
Voltímetro de estado sólido
Toma auxiliar / accesorio
Disponible en versiones de 26 V o 28 V CC', 'media/productos/foto5c.webp', array['media/productos/foto5c.webp', 'media/productos/foto5b.webp', 'media/productos/foto5a.webp']::text[], null),
  ('filtro-de-aceite-champion', 'Filtro de Aceite CHAMPION', 'otros', 'champion-aerospace', true, 'A pedido dealgunos clientes que tenían inconvenientes en instalar los filtros, Champion hiso la lata del filtro de aceite “1/2” más corto y, en el proceso, añadieron mejoras de diseño que ahora hacen sus filtros más fuerte y más eficaces que nunca.
Los filtros  Champion Aerospace, Filtran todas las partículas nocivas, incluyendo las virutas metálicas que resultan del desgaste anormal del motor. Debido a que el aceite fluye a través de muchas capas de fibras, no hay migración de material de fibra que obstruya los conductos de aceite del motor o afecte a las superficies de apoyo. De acuerdo a las pruebas aprobadas por la industria, los filtros de aceite Champiom frena y contiene partículas más sucias y peligrosas durante su tiempo de funcionamiento normal que cualquier otro filtro similar.', 'media/productos/filtro1.webp', array['media/productos/filtro1.webp', 'media/productos/filtro2.webp', 'media/productos/filtro3.webp']::text[], null),
  ('flight-custom-iii', 'FLIGHT CUSTOM III™', 'neumaticos', 'goodyear', true, 'Mayor profundidad de zurco.
Posee 2 acuachannels mas largos y profundos.
Cintas estabilizadoras de Kevlar® que le otorgan un mayor rodamiento y mayor durabilidad a la banda.', 'media/productos/goodyear-general-flightcustomiii1.webp', array['media/productos/goodyear-general-flightcustomiii1.webp']::text[], null),
  ('flight-eagle', 'FLIGHT EAGLE®', 'neumaticos', 'goodyear', true, 'Máximo número de aterrizajes.
Diseño con mejor retención del aire.
Bajo costo por aterrizaje.
Resistencia excelente al efecto del tiempo, la luz del sol y el ozono.', 'media/productos/goodyear-general-flighteagle.webp', array['media/productos/goodyear-general-flighteagle.webp']::text[], null),
  ('flight-eagle-lt', 'FLIGHT EAGLE® LT', 'neumaticos', 'goodyear', true, 'Diseñada para aviones livianos.
Máximo número de aterrizajes.
Diseño con mejor retención del aire.
Bajo costo por aterrizaje.
Resistencia excelente al efecto del tiempo, la luz del sol y el ozono.', 'media/productos/goodyear-general-flighteaglelt.webp', array['media/productos/goodyear-general-flighteaglelt.webp']::text[], null),
  ('flight-leader', 'FLIGHT LEADER®', 'neumaticos', 'goodyear', true, 'Mejor performance en altas velocidades y gran capacidad de carga.
Resistencia a los efectos del calor.
Vida útil prolongada.', 'media/productos/goodyear-flightleader1.webp', array['media/productos/goodyear-flightleader1.webp']::text[], null),
  ('flight-radial', 'FLIGHT RADIAL®', 'neumaticos', 'goodyear', true, 'Mejor dimensión en la pisada, que le proporciona estabilidad.
Mejores compuestos, para una vida útil mas larga.
Mejor resistencia, ante cortes y factores de carga.', 'media/productos/goodyear-flightradial1.webp', array['media/productos/goodyear-flightradial1.webp']::text[], null),
  ('flight-radial-2', 'FLIGHT RADIAL®', 'neumaticos', 'goodyear', true, 'Mejor dimensión en la pisada, que le proporciona estabilidad.
Mejores compuestos, para una vida útil mas larga.
Mejor resistencia, ante cortes y factores de carga.
Menos reemplazos garantizan bajos costos de operativos y mejor eficiencia.', 'media/productos/goodyear-flightradial1.webp', array['media/productos/goodyear-flightradial1.webp']::text[], null),
  ('flight-radial-3', 'FLIGHT RADIAL®', 'neumaticos', 'goodyear', true, 'Mejor dimensión en la pisada, que le proporciona estabilidad.
Mejores compuestos, para una vida útil mas larga.
Mejor resistencia, ante cortes y factores de carga.', 'media/productos/goodyear-flightradial1.webp', array['media/productos/goodyear-flightradial1.webp']::text[], null),
  ('flight-special-ii', 'FLIGHT SPECIAL II™', 'neumaticos', 'goodyear', true, 'Ofrece 20 % mas que cualquier otro neumático de su tipo, incluso que su predecesor el Flight Custom II
Mayor profundidad de zurco', 'media/productos/goodyear-general-flightspecialii.webp', array['media/productos/goodyear-general-flightspecialii.webp']::text[], null),
  ('fluido-hidraulico-para-aviacion-skydrol', 'Fluido hidráulico para aviación Skydrol®', 'otros', 'skydrol', true, 'Skydrol® es el más avanzado fluido hidráulico de la aviación, con el apoyo de expertos de reconocido prestigio en la tecnología de fluidos fosfato – éster. La línea Skydrol® de fluidos hidráulicos resistentes al fuego incluye Skydrol® 500B – 4, Skydrol® LD- 4, 5 y Skydrol® PE- 5. Skydrol® PE- 5 fue desarrollado para cumplir con el Tipo V requerimientos de líquidos hidráulicos desarrollado por Airbus, Boeing, y los fabricantes de fluido hidráulico
Excelente estabilidad térmica bajo condiciones del mundo real ha dado una reputación como el estándar de oro de los fluidos de Tipo IV. Skydrol LD- 4 cuenta con una baja densidad, excelente estabilidad térmica, la prevención de la erosión de la válvula, y el control de los depósitos.', 'media/productos/skydrol.webp', array['media/productos/skydrol.webp']::text[], null),
  ('gill-7025-20-sellada', 'Gill 7025-20 sellada', 'baterias', 'gill', false, 'Número de modelo: 7025-20
Número de parte: 22113
Tipo: Sellado
Voltios: 12
Peso 23 lbs
Electrolito: No es necesario
Capacidad: 1 hora (C1) 20
lpp: 30 min (2C) 32 lpr
Descripción Batería de Avión
TSO Autorizado: Sí
FAA-PMA: Sí', 'media/productos/7025-20-1.webp', array['media/productos/7025-20-1.webp', 'media/productos/7025-20-1-medidas.webp']::text[], null),
  ('gill-7035-28', 'Gill 7035-28', 'baterias', 'gill', false, 'Nominal Voltage, V: 12
One Hour Capacity, C1, Ah: 28
30 Minute Emergency Rate,C/2 A: 45
Weight, Lb. Maximum: 30.00
PowerPerformance:23°C:(75°F) 18°C (0° F) -30°C (-22°F)
Ipp, A :1599/ 1100 / 850
Ipr, A: 1088/ 840/ 600', 'media/productos/7035-28.webp', array['media/productos/7035-28.webp', 'media/productos/7035-28-medidas.webp']::text[], null),
  ('gill-g-25', 'Gill G-25', 'baterias', 'gill', true, '12
Type: Dry
Weight: 21
1 hr (C1) 18 — 30 min (2C) 30 — 60 sec/0 deg F (CCA) 225
Electrolyte: 2 Qts./1.285 s.g', 'media/productos/bateria-gill-g25.webp', array['media/productos/bateria-gill-g25.webp', 'media/productos/bateria-gill-g25-plano.webp']::text[], null),
  ('gill-g-35', 'Gill G-35', 'baterias', 'gill', true, '12
Type: Dry
Weight: 27
1 hr (C1) 23 — 30 min (2C) 40 — 60 sec/0 deg F (CCA) 250
Electrolyte: 3 Qts./1.285 s.g', 'media/productos/bateria-gill-g35.webp', array['media/productos/bateria-gill-g35.webp', 'media/productos/bateria-gill-g35-plano.webp']::text[], null),
  ('gill-g241', 'Gill G241', 'baterias', 'gill', true, '24
Type: Dry
Weight: 24
1 hr (C1) 8 — 30 min (2C) 13 — 60 sec/0 deg F (CCA) 160
Electrolyte: 3 Qts./1.285 s.g', 'media/productos/bateria-gill-g241.webp', array['media/productos/bateria-gill-g241.webp', 'media/productos/bateria-gill-g241-plano.webp']::text[], null),
  ('gill-g242', 'Gill G242', 'baterias', 'gill', true, '24 Volts
Type: Dry
Weight: 24
1 hr (C1) 8 — 30 min (2C) 13 — 60 sec/0 deg F (CCA) 160
Electrolyte: 3 Qts./1.285 s.g', 'media/productos/bateria-gill-g242.webp', array['media/productos/bateria-gill-g242.webp', 'media/productos/bateria-gill-g242-plano.webp']::text[], null),
  ('gill-g243', 'Gill G243', 'baterias', 'gill', true, '24 Volts
Type: Dry
Weight: 28
1 hr (C1) 10 — 30 min (2C) 17 — 60 sec/0 deg F (CCA) 150
Electrolyte: 3 Qts./1.285 s.g', 'media/productos/bateria-gill-g243.webp', array['media/productos/bateria-gill-g243.webp', 'media/productos/bateria-gill-g243-plano.webp']::text[], null),
  ('gill-g246', 'Gill G246', 'baterias', 'gill', true, '24 Volts
Type: Dry
Weight: 41.5 lbs.
1 hr (C1) 19 — 30 min (2C) 32 — 60 sec/0 deg F (CCA) 250
Electrolyte: 4 Qts./1.285 s.g', 'media/productos/bateria-gill-g246.webp', array['media/productos/bateria-gill-g246.webp', 'media/productos/bateria-gill-g246-plano.webp']::text[], null),
  ('gill-g6381e', 'Gill G6381E', 'baterias', 'gill', true, '24 Volts
Type: Dry
Weight: 80 lbs.
1 hr (C1) 43 — 30 min (2C) 70 — 60 sec/0 deg F (CCA) 445
Electrolyte: 9 Qts./1.285 s.g', 'media/productos/bateria-gill-g6381e.webp', array['media/productos/bateria-gill-g6381e.webp', 'media/productos/bateria-gill-g6381e-plano.webp']::text[], null),
  ('gill-g6381es', 'Gill G6381ES', 'baterias', 'gill', true, '24 Volts
Type: Sealed
Weight: 88.5 lbs.
1 hr (C1) 44 — 30 min (2C) 70 — 60 sec/0 deg F (CCA) 600
Electrolyte: Not', 'media/productos/bateria-gill-g6381es.webp', array['media/productos/bateria-gill-g6381es.webp', 'media/productos/bateria-gill-g6381es-plano.webp']::text[], null),
  ('gill-ge-51c', 'Gill GE 51C', 'baterias', 'gill', true, '24 Volts
Type: Dry
Weight: 56 lbs.
1 hr (C1) 22 — 30 min (2C) 35 — 60 sec/0 deg F (CCA) 235
Electrolyte: 5 Qts./1.285 s.g', 'media/productos/bateria-gill-ge51c.webp', array['media/productos/bateria-gill-ge51c.webp', 'media/productos/bateria-gill-ge51c-plano.webp']::text[], null),
  ('gpu-1500s', 'GPU 1500S', 'aerospecialties', 'powervamp', true, 'Utilizado por militares en todo el mundo.
Resistente a la corrosión por su composición total en acero inoxidable.
El mango de cuerpo entero sirve para evitar que se enganche en espacios reducidos.', 'media/productos/powervamp-gps1500s.webp', array['media/productos/powervamp-gps1500s.webp']::text[], null),
  ('lamparas-ge', 'Lámparas GE', 'otros', 'ge', true, 'En GE, tenemos una destacada trayectoria en el diseño. Nuestros ingenieros de clase mundial combinan los mejores componentes disponibles con innovadores diseños ópticos, eléctricos y térmicos para crear lámparas y sistemas que están optimizados para un rendimiento superior. Estamos excelentemente posicionados para continuar como una empresa innovadora líder en la industria en los próximos años. Gama de lámparas de GE ofrecen un excelente rendimiento con una estética de calidad y gran fiabilidad. Características tales como una larga vida útil y compatibilidad de regulación lo convierten en un producto muy conveniente', 'media/productos/lamp.webp', array['media/productos/lamp.webp']::text[], null),
  ('pc-12-ng-el-monomotor-multiproposito-preferido', 'PC-12 NG El Monomotor Multipropósito Preferido', 'pilatus', 'pilatus', true, 'El Monomotor Multipropósito Preferido

Take-off Distance 2,602 ft
Speed 285 ktas
Range', 'media/productos/pc-12ng.webp', array['media/productos/pc-12ng.webp', 'media/productos/meidas-pc-12ng.webp', 'media/productos/contenido4.webp', 'media/productos/cockpit1.webp']::text[], null),
  ('pc-21-el-entrenador-efectivo', 'PC-21 El Entrenador Efectivo', 'pilatus', 'pilatus', true, 'El Entrenador Efectivo

Rate of Climb 3,091 ft/min
Speed 370 keas
G Loads +8.0 g. / -4.0 g', 'media/productos/pc21.webp', array['media/productos/pc21.webp', 'media/productos/medidas-pc-21-2.webp', 'media/productos/3.webp', 'media/productos/foto2-scaled.webp']::text[], null),
  ('pc-24-el-jet-super-versatil-con-clase-propia', 'PC-24 El Jet Super Versátil con clase propia', 'pilatus', 'pilatus', true, 'El Jet Super Versátil con clase propia

Take-off Distance 2,690 ft
Speed 425 ktas
Range 1950 nm', 'media/productos/pc-24.webp', array['media/productos/pc-24.webp', 'media/productos/medidas-pc-24-2.webp', 'media/productos/foto7-contenido-scaled.webp', 'media/productos/foto18-contenido-scaled.webp']::text[], 'https://youtu.be/Z1MIFuLV6iM'),
  ('pc-7-mkii-una-aeronave-para-entrenamiento-basico', 'PC-7 MkII Una aeronave para Entrenamiento Básico', 'pilatus', 'pilatus', true, 'Una aeronave para Entrenamiento Básico

Rate of Climb 2,675 ft/min
Speed 300 keas
G Loads +7.0 g. / -3.5 g', 'media/productos/pc-7.webp', array['media/productos/pc-7.webp', 'media/productos/medidas-pc-7-2.webp', 'media/productos/contenido1.webp', 'media/productos/contenido3.webp', 'media/productos/contenido2.webp']::text[], null),
  ('pc-9-m-una-aeronave-para-entrenamiento-avanzado', 'PC-9 M Una aeronave para Entrenamiento Avanzado', 'pilatus', 'pilatus', true, 'Una aeronave para Entrenamiento Avanzado

Rate of Climb 3,880 ft/min
Speed 320 keas
G Loads +7.0 g. / -3.5 g', 'media/productos/pc-9.webp', array['media/productos/pc-9.webp', 'media/productos/medidas-pc-9-2.webp', 'media/productos/foto1-contenido-1.webp', 'media/productos/foto12.webp']::text[], null),
  ('portapump-mkii', 'PORTAPUMP MKII', 'aerospecialties', 'powervamp', true, 'Bomba de Combustible resistente, diseñado para alimentación rápida o descarga de combustible para todos los tipos de aeronaves.', 'media/productos/powervamp-portapumpmkii.webp', array['media/productos/powervamp-portapumpmkii.webp']::text[], null),
  ('prist-aditivo-anticongelante', 'Prist Aditivo Anticongelante', 'otros', 'prist', true, 'Las latas de aerosol Prist® Hi-Flash® Hi-Flo™ poseen un sistema de gatillo dispensador que hace su uso más fácil y seguro. El disparador le da al usuario el control del flujo del aditivo con instantánea dispensación debido a que viene pre-montado en la lata, lo cual elimina las fugas en la conexión de la válvula. Esto significa, que habrá una menor pérdida, sin goteos o derrames.
El aditivo anti-congelante Prist® se provee en una amplia gama de envases, lo que facilita la elección de la cantidad de producto y el método de dispensación para su aplicación.
Los pilotos lo piden por su nombre.', 'media/productos/prist.webp', array['media/productos/prist.webp']::text[], null),
  ('ps50c-y-ps30c', 'Ps50C Y Ps30C', 'aerospecialties', 'powervamp', true, 'Cargador/fuente de alimentación eléctrico en miniatura, de peso ligero, es capaz de suministrar 30 o 50 amperios

Ps 30C: capaz de suministrar hasta 30 A a 14 V CC o 28 V CC
Fuente de alimentación liviana de estado sólido

PS50M: Fuente de alimentación 28V / 31.5V
Fuente de alimentación liviana de estado sólido
Potencia continua de 50 A / 28 V CC', 'media/productos/foto1c.webp', array['media/productos/foto1c.webp', 'media/productos/foto1b.webp', 'media/productos/foto1a.webp', 'media/productos/foto1e.webp', 'media/productos/foto1d.webp']::text[], null),
  ('rib', 'RIB', 'neumaticos', 'goodyear', true, 'Una alternativa para aterrizajes de Alto Rendimiento.', 'media/productos/goodyear-militar-rib.webp', array['media/productos/goodyear-militar-rib.webp']::text[], null),
  ('sta-air-hawk', 'STA Air Hawk®', 'neumaticos', 'specialty-tire-of-america-sta', true, 'Versión mejorada de alta resistencia
Amplia separación del surco en la banda de rodamiento
Perfil en escuadra
Rendimiento con buenas características de desgaste', 'media/productos/sta-airhawk1.webp', array['media/productos/sta-airhawk1.webp']::text[], null),
  ('sta-air-trac', 'STA Air Trac', 'neumaticos', 'specialty-tire-of-america-sta', true, 'Diseñado para el uso en pistas de Césped
Económico
Patrón de pisada angosta
Perfil de tipo ovalada
Construcción ligera', 'media/productos/sta-airtrac1.webp', array['media/productos/sta-airtrac1.webp']::text[], null)
) as v(slug, name, type_slug, brand_slug, active, description, image_url, images, video_url)
join public.product_types t on t.slug = v.type_slug
left join public.brands b on b.slug = v.brand_slug
on conflict (slug) do update set
  description = coalesce(public.products.description, excluded.description),
  image_url = coalesce(public.products.image_url, excluded.image_url),
  images = case when cardinality(public.products.images) = 0 then excluded.images else public.products.images end,
  video_url = coalesce(public.products.video_url, excluded.video_url);

insert into public.product_segments (product_id, segment_id)
select p.id, s.id from (values
  ('flight-custom-iii', 'general'),
  ('flight-eagle', 'general'),
  ('flight-eagle-lt', 'general'),
  ('flight-leader', 'comercial'),
  ('flight-radial', 'militar'),
  ('flight-radial-2', 'general'),
  ('flight-radial-3', 'comercial'),
  ('flight-special-ii', 'general'),
  ('rib', 'militar')
) as v(product_slug, segment_slug)
join public.products p on p.slug = v.product_slug
join public.segments s on s.slug = v.segment_slug
on conflict do nothing;
