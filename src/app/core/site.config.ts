// Datos de la empresa: se completan cuando MASUMA los entregue (ver docs/REUNION-CLIENTE.md).
// Vacío = no se muestra o se ve un marcador visible. Nada de esto está inventado.
export interface Partner { name: string; logo: string; }
export interface Brand { name: string; logo: string; h?: number; }   // h = alto máximo en px (por defecto 58)
export interface Service { title: string; text: string; items?: string[]; images: string[]; }   // images[0] = reposo, images[1] = al pasar el mouse

export const site = {
  name: 'MASUMA',
  fullName: 'MASUMA INTERNATIONAL',
  tagline: 'AVIATION PARTS',
  logo: 'media/brand/logo.webp',      // logo circular (hero). Para cambiarlo: reemplazar el archivo o la ruta
  phone: '+54 (11) 4704 5577',             // se muestra así; el link tel: usa solo los dígitos
  whatsapp: '+54 (11) 2353-6393',          // se muestra así; el link wa.me se arma con los dígitos (con el 9 de celular)
  email: 'masuma@masuma.com.ar',
  address: 'Amenábar 4073, AEW, Buenos Aires, Argentina',
  // Trabaje con nosotros (/contacto#trabaje-con-nosotros). Los CV se mandan a site.email.
  jobs: {
    title: 'Trabaje con nosotros',
    paragraphs: [
      'Somos una empresa con visión internacional, por eso estamos buscando personas con nuevas ideas y espíritu de compromiso. Queremos conocerte y que nos conozcas para que puedas sumarte a nuestro equipo.',
    ] as string[],
    cta: '¡Mandanos tu CV a nuestro mail!',
  },
  mapEmbedUrl: '',              // URL de Google Maps "Compartir > Insertar un mapa" (requiere frame-src en la CSP de vercel.json)
  contactImage: 'media/contacto/contacto.webp',   // foto de la caja de Contacto, anclada como en Nosotros (original en design/originals/contacto.jpg). Vacío = sin foto
  // Redes del encabezado (en este orden). WhatsApp no va acá: el link se arma con site.whatsapp (ver waUrl).
  social: {
    instagram: 'https://www.instagram.com/masuma.internacional',
    facebook: 'https://www.facebook.com/masumaint',
    linkedin: 'https://www.linkedin.com/company/masuma-internacional/home/',
  } as Partial<Record<'facebook' | 'instagram' | 'linkedin' | 'youtube', string>>,
  // Marcas que representan. Nombres según el diseño; los logos se cargan al recibirlos.
  partners: [
    { name: 'Goodyear', logo: 'media/brands/goodyear.svg' },
    { name: 'Pilatus Aircraft', logo: 'media/brands/pilatus.svg' },
  ] as Partner[],
  // Cinta de marcas (home, al final de Nosotros). logo = SVG en public/media/brands/ (ej. 'media/brands/pilatus.svg'). Vacío = se muestra el nombre.
  brands: [
    { name: 'Gill Aircraft Batteries', logo: 'media/brands/gill.png', h: 84 },
    { name: 'Pratt & Whitney', logo: 'media/brands/pratt-whitney.png', h: 88 },
    { name: 'Powervamp', logo: 'media/brands/powervamp.png' },
    { name: 'Pilatus', logo: 'media/brands/pilatus.svg' },
    { name: 'Goodyear Aviation', logo: 'media/brands/goodyear.svg' },
  ] as Brand[],
  // Hero con video controlado por el scroll (ver docs/HOME.md). Todo vacío = hero estático.
  // Cierre de la página: el avión aterriza mientras se baja (video controlado por el scroll, como el hero pero a la inversa).
  outro: {
    video: 'media/footer/footer.mp4',               // 1280×720, un fotograma clave cada 8 cuadros (para poder "scrubear")
    videoMobile: 'media/footer/footer-mobile.mp4',  // 960×540, un fotograma clave cada 4 cuadros
    poster: 'media/footer/footer-poster.jpg',       // primer cuadro: se ve mientras carga
    endImage: 'media/footer/footer-end.jpg',        // último cuadro (ruedas detenidas): "reducir movimiento" y fallo de carga
    end: 0.88,                                      // avance del scroll (0–1) en que llega al último cuadro; el resto lo sostiene
    title: '¡Gracias por visitarnos!',              // título sobre el video (misma tipografía y tamaño que el del hero). Vacío = sin título
  },
  hero: {
    video: 'media/hero/hero.mp4',          // plano de las ruedas; el avión despega y el video termina con la toma cenital
    videoMobile: 'media/hero/hero-mobile.mp4',    // versión liviana (540p, GOP corto) para celulares
    poster: 'media/hero/hero-poster.jpg',         // primer cuadro, se ve mientras carga el video
    landFrom: 0.55,   // avance del scroll (0–1) en que el avión sale de cuadro y el avioncito empieza a bajar al encabezado
    landTo: 0.8,      // avance en que queda posado
    aerialImage: '',    // opcional: imagen cenital aparte (hoy la toma cenital ya viene dentro del video)
  },
  about: {
    title: 'Nosotros',
    paragraphs: [
      'Somos proveedores de servicios y productos aeronáuticos con toda la experiencia en el desarrollo de logísticas personalizadas, con más de 25 años en el mercado.',
      'Somos distribuidor y único representante Técnico de Goodyear Aviation para Chile, Argentina, Bolivia, Paraguay y Uruguay. Somos representantes de Pilatus Aircraft LTD para organismos gubernamentales. Comercializamos Neumáticos Aeronáuticos para Aviación General, Comercial y Militar, repuestos, partes y componentes, motores, arrancadores, cargadores y baterías de aviación.',
    ] as string[],  // tomado de masuma.com.ar/quienes_somos (pendiente de aprobación de la empresa)
    // Imágenes "ancladas": el cuadro baja con el scroll, la imagen queda fija y va cambiando. Color unificado con tools/grade_nosotros.py
    images: ['media/nosotros/nosotros-1.webp', 'media/nosotros/nosotros-2.webp', 'media/nosotros/nosotros-3.webp', 'media/nosotros/nosotros-4.webp', 'media/nosotros/nosotros-5.webp', 'media/nosotros/nosotros-6.webp'],
  },
  // Tres tarjetas del home (también alimentan la cinta de servicios).
  servicesTitle: 'Servicios',
  servicesIntro: 'Somos proveedores de servicios de Pratt & Whitney (SPA). Los motores más potentes y modernos a turbohélices, ofreciendo una amplia gama de productos de tecnología avanzada que se han convertido en sinónimo de un rendimiento fiable, excelente economía de combustible y el respeto al medio ambiente.',
  // Palabras clave de la cinta del home (se completan tras revisar la plataforma y el sitio actual; solo las confirmadas).
  ribbonWords: [
    '(Overhaul) de motores y accesorios',
    '(HSI) de turbinas',
    'Repuestos y Partes originales (OEM)',
    'Motores Nuevos, Serviciables, Outright y Exchange',
    'Engine Condition Trend Monitoring',
    'Distribuidor y único representante Técnico de Goodyear Aviation',
  ] as string[],
  servicesSlideMs: 5500,        // tiempo que se ve cada imagen en las tarjetas de servicios (ms)
  // Dos tarjetas grandes. images = tantas como se quieran (se pasan solas). La venta ya la cubre la tienda, por eso no hay tarjeta de Venta.
  services: [
    { title: 'Servicios de mantenimiento', text: '', items: ['Reparaciones de motores y accesorios', 'Inspecciones Zona Caliente (HSI) de turbinas', 'Recorrida General (Overhaul) de motores y accesorios', 'Alquiler'], images: ['media/servicios/servicios-1.webp', 'media/servicios/servicios-3.webp', 'media/servicios/servicios-5.webp'] as string[] },
    { title: 'Capacitación', text: '', items: ['Mantenimiento básico de línea', 'Inspección de Zona Caliente (HSI)', 'Engine Condition Trend Monitoring', 'Procedimientos de mantenimiento operacional'], images: ['media/servicios/servicios-2.webp', 'media/servicios/servicios-4.webp'] as string[] },
  ] as Service[],
};

/** Link de WhatsApp: wa.me pide el número internacional sin signos; los celulares de Argentina llevan un 9 después del 54. */
export function waUrl(phone: string): string {
  const d = phone.replace(/\D/g, '');
  return 'https://wa.me/' + (d.startsWith('54') && !d.startsWith('549') ? '549' + d.slice(2) : d);
}
