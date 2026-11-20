import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CatalogService } from '../core/catalog.service';
import { CartService } from '../core/cart.service';
import { AuthService } from '../core/auth.service';
import { FavoritesService } from '../core/favorites.service';
import { Product, isDrawing } from '../core/models';
import { site } from '../core/site.config';

@Component({
  selector: 'app-product', imports: [RouterLink],
  template: `
    @if (product(); as p) {
      <a routerLink="/catalogo" [queryParams]="{ tipo: p.type?.slug }">← {{ p.type?.name ?? 'Productos' }}</a>
      <h1>{{ p.name }}</h1>
      @if (gallery().length) {
        <div class="gallery">
          <img class="gallery-main" [class.drawing]="isDrawing(gallery()[shown()])" [src]="gallery()[shown()]" [alt]="p.name + (shown() ? ' — imagen ' + (shown() + 1) : '')" />
          @if (gallery().length > 1) {
            <div class="thumbs" role="group" aria-label="Imágenes del producto">
              @for (g of gallery(); track g; let i = $index) {
                <button type="button" class="thumb" [class.drawing]="isDrawing(g)" [class.on]="i === shown()" (click)="shown.set(i)" [attr.aria-label]="'Ver imagen ' + (i + 1)" [attr.aria-pressed]="i === shown()">
                  <img [src]="g" alt="" loading="lazy" />
                </button>
              }
            </div>
          }
        </div>
      }
      <p><span class="chip">{{ p.brand?.name }}</span>
        @for (s of p.segments ?? []; track s.segment.slug) { <span class="chip">{{ s.segment.name }}</span> }
        @if (p.part_number) { <span class="muted">N.º de parte: {{ p.part_number }}</span> }</p>
      @if (p.description) { <p class="desc-text">{{ p.description }}</p> }
      @if (p.video_url) { <p><a [href]="p.video_url" target="_blank" rel="noopener noreferrer">Ver video →</a></p> }
      @if (p.type?.sellable !== false) {
        <p><strong>{{ p.price_ars ? ('$' + p.price_ars) : 'Consultar precio' }}</strong></p>
        @if (p.price_ars && p.stock > 0) { <button type="button" (click)="add(p)">Agregar al carrito</button> }
        @else { <a class="btn" routerLink="/" fragment="contacto">Consultar</a> }
        <button type="button" (click)="fav(p)" [attr.aria-pressed]="favs.isFav(p.id)">{{ favs.isFav(p.id) ? '♥ En favoritos' : '♡ Favorito' }}</button>
      } @else {
        <p class="muted">Información institucional. Para consultas, <a routerLink="/" fragment="contacto">contactanos</a>@if (site.email) { o escribinos a {{ site.email }} }.</p>
      }
      @if (msg()) { <p role="status">{{ msg() }}</p> }
    } @else { <p>Producto no encontrado.</p> }`,
})
export class ProductPage {
  slug = input.required<string>();
  protected site = site;
  protected favs = inject(FavoritesService);
  private catalog = inject(CatalogService); private cart = inject(CartService); private auth = inject(AuthService); private router = inject(Router);
  product = signal<Product | null>(null); msg = signal('');
  protected shown = signal(0);
  protected isDrawing = isDrawing;
  /** Galería: images (0006); si está vacía, la foto principal sola. */
  protected gallery = computed(() => { const p = this.product(); return p ? (p.images?.length ? p.images : p.image_url ? [p.image_url] : []) : []; });
  ngOnInit() { this.catalog.product(this.slug()).then(p => this.product.set(p)).catch(() => this.product.set(null)); }
  private needLogin(p: Product) { this.router.navigate(['/ingresar'], { queryParams: { next: '/productos/' + p.slug } }); }
  async add(p: Product) { if (!this.auth.loggedIn()) return this.needLogin(p); await this.cart.add(p.id); this.msg.set('Agregado al carrito'); }
  async fav(p: Product) { if (!this.auth.loggedIn()) return this.needLogin(p); await this.favs.toggle(p.id); }
}
