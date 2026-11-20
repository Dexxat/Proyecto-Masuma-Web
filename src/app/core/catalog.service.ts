import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Brand, Product, ProductType, Segment } from './models';
import { orderTypes } from './shelf-order';

const SELECT = '*, brand:brands(name,slug), type:product_types(name,slug,sellable), segments:product_segments(segment:segments(name,slug))';
export interface ProductFilter { tipo?: string; marca?: string; segmento?: string; q?: string; }

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private sb = inject(SupabaseService).client;
  private cache: { types?: Promise<ProductType[]>; brands?: Promise<Brand[]>; segments?: Promise<Segment[]> } = {};

  /** Tipos en el orden del sitio (Pilatus primero; ver shelf-order.ts), sin depender de la columna sort. */
  types() { return this.cache.types ??= this.list<ProductType>('product_types', 'sort').then(orderTypes); }
  brands() { return this.cache.brands ??= this.list<Brand>('brands', 'name'); }
  segments() { return this.cache.segments ??= this.list<Segment>('segments', 'name'); }

  private async list<T>(table: string, order: string): Promise<T[]> {
    const { data, error } = await this.sb.from(table).select('*').order(order);
    if (error) throw error;
    return (data as T[]) ?? [];
  }

  async products(f: ProductFilter = {}): Promise<Product[]> {
    let q = this.sb.from('products').select(SELECT).eq('active', true).order('name');
    if (f.tipo) { const t = (await this.types()).find(x => x.slug === f.tipo); if (!t) return []; q = q.eq('type_id', t.id); }
    if (f.marca) { const b = (await this.brands()).find(x => x.slug === f.marca); if (!b) return []; q = q.eq('brand_id', b.id); }
    if (f.q) q = q.ilike('name', `%${f.q.replace(/[%,]/g, '')}%`);
    const { data, error } = await q;
    if (error) throw error;
    const list = (data as unknown as Product[]) ?? [];
    return f.segmento ? list.filter(p => p.segments?.some(s => s.segment.slug === f.segmento)) : list;
  }

  async product(slug: string): Promise<Product | null> {
    const { data, error } = await this.sb.from('products').select(SELECT).eq('slug', slug).eq('active', true).maybeSingle();
    if (error) throw error;
    return data as unknown as Product | null;
  }
}
