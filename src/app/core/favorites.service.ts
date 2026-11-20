import { Injectable, effect, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import { Product } from './models';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private sb = inject(SupabaseService).client;
  private auth = inject(AuthService);
  readonly ids = signal<Set<number>>(new Set());

  constructor() { effect(() => { this.auth.user() ? this.load() : this.ids.set(new Set()); }); }

  async load() {
    const { data } = await this.sb.from('favorites').select('product_id');
    this.ids.set(new Set((data ?? []).map(r => r.product_id as number)));
  }
  isFav(id: number) { return this.ids().has(id); }
  async toggle(id: number) {
    if (this.isFav(id)) await this.sb.from('favorites').delete().eq('product_id', id);
    else await this.sb.from('favorites').insert({ product_id: id });
    await this.load();
  }
  async products(): Promise<Product[]> {
    const { data } = await this.sb.from('favorites').select('product:products(*, brand:brands(name,slug), type:product_types(name,slug,sellable))').order('created_at', { ascending: false });
    return (data ?? []).map(r => (r as unknown as { product: Product }).product).filter(p => p?.active);
  }
}
