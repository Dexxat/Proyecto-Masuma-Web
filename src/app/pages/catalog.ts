import { Component, effect, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CatalogService } from '../core/catalog.service';
import { Brand, Product, ProductType, Segment } from '../core/models';

@Component({
  selector: 'app-catalog', imports: [RouterLink],
  template: `
    <h1>Productos</h1>
    <div class="filters">
      <input type="search" placeholder="Buscar…" [value]="q() ?? ''" (change)="set('q', $any($event.target).value)" aria-label="Buscar" />
      <select aria-label="Tipo" (change)="set('tipo', $any($event.target).value)">
        <option value="">Todos los tipos</option>
        @for (t of types(); track t.id) { <option [value]="t.slug" [selected]="t.slug === tipo()">{{ t.name }}</option> }
      </select>
      <select aria-label="Marca" (change)="set('marca', $any($event.target).value)">
        <option value="">Todas las marcas</option>
        @for (b of brands(); track b.id) { <option [value]="b.slug" [selected]="b.slug === marca()">{{ b.name }}</option> }
      </select>
      <select aria-label="Segmento" (change)="set('segmento', $any($event.target).value)">
        <option value="">Todos los segmentos</option>
        @for (s of segments(); track s.id) { <option [value]="s.slug" [selected]="s.slug === segmento()">{{ s.name }}</option> }
      </select>
    </div>
    @if (error()) { <p role="alert">No pudimos cargar los productos.</p> }
    <p class="muted">{{ products().length }} productos</p>
    <div class="grid">
      @for (p of products(); track p.id) {
        <a class="card pcard" [routerLink]="['/productos', p.slug]">
          <div class="pcard-pic">
            @if (p.image_url) { <img [src]="p.image_url" [alt]="p.name" loading="lazy" decoding="async" /> }
            @else { <span>{{ p.brand?.name }}</span> }
          </div>
          <h3>{{ p.name }}</h3>
          <p class="muted">{{ p.brand?.name }} · {{ p.type?.name }}</p>
          @if (p.type?.sellable !== false) { <strong>{{ p.price_ars ? ('$' + p.price_ars) : 'Consultar precio' }}</strong> }
        </a>
      } @empty { @if (!loading()) { <p>No hay productos con esos filtros.</p> } }
    </div>`,
})
export class Catalog {
  tipo = input<string>(); marca = input<string>(); segmento = input<string>(); q = input<string>();   // vienen de la URL (?tipo=…)
  private catalog = inject(CatalogService);
  private router = inject(Router);
  types = signal<ProductType[]>([]); brands = signal<Brand[]>([]); segments = signal<Segment[]>([]);
  products = signal<Product[]>([]); loading = signal(true); error = signal(false);

  constructor() {
    this.catalog.types().then(v => this.types.set(v)).catch(() => {});
    this.catalog.brands().then(v => this.brands.set(v)).catch(() => {});
    this.catalog.segments().then(v => this.segments.set(v)).catch(() => {});
    effect(() => { this.load({ tipo: this.tipo(), marca: this.marca(), segmento: this.segmento(), q: this.q() }); });
  }
  private async load(f: { tipo?: string; marca?: string; segmento?: string; q?: string }) {
    this.loading.set(true); this.error.set(false);
    try { this.products.set(await this.catalog.products(f)); } catch { this.error.set(true); } finally { this.loading.set(false); }
  }
  set(key: string, value: string) { this.router.navigate([], { queryParams: { [key]: value || null }, queryParamsHandling: 'merge' }); }
}
