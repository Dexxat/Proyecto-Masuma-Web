export interface ProductType { id: number; name: string; slug: string; sellable: boolean; sort: number; }
export interface Brand { id: number; name: string; slug: string; }
export interface Segment { id: number; name: string; slug: string; }
export interface Product {
  id: number; slug: string; name: string; part_number: string | null; description: string | null;
  price_ars: number | null;       // null => "consultar precio"
  price_usd?: number | null;      // solo PayPal
  stock: number; image_url: string | null; active: boolean;
  images?: string[];             // galería: foto principal, planos y medidas (migración 0006)
  video_url?: string | null;     // video del producto, ej. YouTube (migración 0008)
  brand_id: number | null; type_id: number | null; attributes: Record<string, unknown>;
  brand?: { name: string; slug: string } | null;
  type?: { name: string; slug: string; sellable: boolean } | null;
  segments?: { segment: { name: string; slug: string } }[];
}
/** Planos y medidas: conservan fondo blanco (sus líneas no se leen sobre el verde). Mismo criterio que tools/import_catalog_media.py. */
export const isDrawing = (src: string) => /plano|medidas|meidas|contenido3/i.test(src);

export interface CartItem { product_id: number; quantity: number; product?: Product; }
