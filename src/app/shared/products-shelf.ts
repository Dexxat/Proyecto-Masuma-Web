import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { CartService } from '../core/cart.service';
import { CatalogService } from '../core/catalog.service';
import { FavoritesService } from '../core/favorites.service';
import { Product, ProductType } from '../core/models';
import { orderTypes } from '../core/shelf-order';
import { SectionNav } from '../core/section-nav';
import { UiIcon } from './icons';

interface Row { type: ProductType; items: Product[]; }

/**
 * Estante de productos estilo menú de consola: un carril horizontal por tipo (uno sobre otro). El producto que queda
 * en el centro se agranda y muestra toda su ficha; los demás se achican y se atenúan. Tiene favoritos y un modo
 * "pick" (ícono de carrito) para seleccionar varios productos y agregarlos juntos al carrito.
 */
@Component({
  selector: 'app-products-shelf', imports: [RouterLink, UiIcon],
  template: `
    <section class="shelf bleed" id="productos" aria-labelledby="shelf-h">
      <div class="shelf-in">
        <header class="shelf-head">
          <h2 id="shelf-h">Productos</h2>
          <div class="tools" role="toolbar" aria-label="Opciones del catálogo">
            <button type="button" class="tool" [class.on]="onlyFavs()" [attr.aria-pressed]="onlyFavs()" (click)="onlyFavs.set(!onlyFavs())" title="Ver solo favoritos">
              <app-ui-icon name="heart" /> <span>Favoritos</span></button>
            <button type="button" class="tool" [class.on]="pick()" [attr.aria-pressed]="pick()" (click)="pick.set(!pick())" title="Modo selección para el carrito">
              <app-ui-icon name="cart" /> <span>Pick up</span>@if (selected().size) { <b>{{ selected().size }}</b> }</button>
          </div>
        </header>

        @if (error()) { <p role="alert" class="dim">No pudimos cargar los productos.</p> }
        @else if (!loading() && !rows().length) { <p class="dim">{{ onlyFavs() ? 'Todavía no marcaste favoritos.' : 'Todavía no hay productos para mostrar.' }}</p> }

        @for (r of rows(); track r.type.id) {
          <div class="row" [class.lead]="isLead(r.type)">
            <h3 class="row-label">{{ r.type.name }} <small>{{ r.items.length }}</small></h3>
            <button type="button" class="nav prev" (click)="step(lane, r, -1)" aria-label="Anterior"><app-ui-icon name="chevron-left" /></button>
            <button type="button" class="nav next" (click)="step(lane, r, 1)" aria-label="Siguiente"><app-ui-icon name="chevron-right" /></button>
            <div #lane class="lane" tabindex="0" [attr.aria-label]="'Productos de ' + r.type.name + ': usá las flechas para moverte'"
                 (scroll)="onScroll(r.type.slug, lane)" (keydown.arrowRight)="step(lane, r, 1); $event.preventDefault()" (keydown.arrowLeft)="step(lane, r, -1); $event.preventDefault()">
              @for (p of r.items; track p.id; let i = $index) {
                <article class="item" [class.active]="idx(r.type.slug) === i" [class.picked]="selected().has(p.id)" [attr.aria-current]="idx(r.type.slug) === i" (click)="idx(r.type.slug) !== i && center(lane, i)">
                  <div class="pic" [class.empty]="!p.image_url">
                    @if (p.image_url) { <img [src]="p.image_url" [alt]="p.name" loading="lazy" decoding="async" /> } @else { <span>{{ p.brand?.name }}</span> }
                  </div>
                  <h4>{{ p.name }}</h4>
                  <p class="meta">{{ p.brand?.name }} · {{ r.type.name }}</p>

                  <div class="detail">
                    @if (p.part_number) { <p class="pn">N.º de parte <b>{{ p.part_number }}</b></p> }
                    @if (p.segments?.length) { <p>@for (s of p.segments; track s.segment.slug) { <span class="chip">{{ s.segment.name }}</span> }</p> }
                    <p class="desc">{{ p.description || 'Descripción a cargar.' }}</p>
                    <dl>
                      @for (a of attrs(p); track a[0]) { <dt>{{ a[0] }}</dt><dd>{{ a[1] }}</dd> }
                      @empty { <dt>Ficha técnica</dt><dd>pendiente</dd> }
                    </dl>
                    <div class="buy">
                      @if (isLead(r.type)) { <a class="ask" href="#contacto" (click)="goContact($event)">Consultar este modelo</a> }
                      @else if (buyable(p)) { <strong>{{ '$' + p.price_ars }}</strong><small>{{ p.stock }} en stock</small> }
                      @else { <a href="#contacto" (click)="goContact($event)">Consultar precio</a> }
                      <span class="grow"></span>
                      <button type="button" class="round" [class.on]="favs.isFav(p.id)" [attr.aria-pressed]="favs.isFav(p.id)" (click)="fav(p); $event.stopPropagation()" aria-label="Favorito"><app-ui-icon name="heart" /></button>
                      @if (pick() && buyable(p)) {
                        <button type="button" class="round cart" [class.on]="selected().has(p.id)" [attr.aria-pressed]="selected().has(p.id)" (click)="toggle(p.id); $event.stopPropagation()" aria-label="Seleccionar para el carrito">
                          <app-ui-icon [name]="selected().has(p.id) ? 'check' : 'cart'" /></button>
                      }
                    </div>
                    <a class="more" [routerLink]="['/productos', p.slug]">Ver ficha completa →</a>
                    @if (p.video_url) { <a class="more" [href]="p.video_url" target="_blank" rel="noopener noreferrer">Ver video →</a> }
                  </div>
                </article>
              }
            </div>
          </div>
        }

        <div class="shelf-bar" aria-live="polite">
          @if (pick()) {
            <span>{{ selected().size }} seleccionado(s)</span>
            <button type="button" [disabled]="!selected().size || busy()" (click)="addSelected()">Agregar al carrito</button>
          } @else { <span class="dim">Activá «Pick up» para elegir varios productos.</span> }
          <a routerLink="/como-comprar">Cómo comprar</a>
          <a routerLink="/catalogo">Ver catálogo completo →</a>
          @if (msg()) { <span role="status">{{ msg() }}</span> }
        </div>
      </div>
    </section>`,
})
export class ProductsShelf {
  private catalog = inject(CatalogService); private cart = inject(CartService);
  private auth = inject(AuthService); private router = inject(Router);
  protected favs = inject(FavoritesService);
  private reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  protected types = signal<ProductType[]>([]); protected products = signal<Product[]>([]);
  protected onlyFavs = signal(false); protected pick = signal(false);
  protected selected = signal<Set<number>>(new Set());
  protected active = signal<Record<string, number>>({});
  protected loading = signal(true); protected error = signal(false); protected busy = signal(false); protected msg = signal('');
  private raf: Record<string, number> = {};

  /**
   * Un carril por tipo, en el orden del sitio: Pilatus Aircraft (aviones) primero, Neumáticos segundo, luego Baterías,
   * AeroSpecialties y Otros (ver core/shelf-order.ts). Dentro de cada carril, orden natural (PC-7, PC-9, PC-12, PC-21, PC-24).
   */
  protected rows = computed<Row[]>(() => orderTypes(this.types()).map(type => ({
    type,
    items: this.products()
      .filter(p => p.type_id === type.id && (!this.onlyFavs() || this.favs.isFav(p.id)))
      .sort((a, b) => a.name.localeCompare(b.name, 'es', { numeric: true })),
  })).filter(r => r.items.length));
  /** Los aviones Pilatus: fila destacada, sin precio ni carrito (se consultan). */
  protected isLead(t: ProductType) { return /pilatus/i.test(`${t.slug} ${t.name}`); }
  private nav = inject(SectionNav);
  protected goContact(e: Event) { this.nav.go('contacto', e); }

  constructor() {
    this.catalog.types().then(v => this.types.set(v)).catch(() => this.error.set(true));
    this.catalog.products().then(v => this.products.set(v)).catch(() => this.error.set(true)).finally(() => this.loading.set(false));
  }
  protected idx(slug: string) { return this.active()[slug] ?? 0; }
  protected buyable(p: Product) { return p.type?.sellable !== false && !!p.price_ars && p.stock > 0; }
  protected attrs(p: Product): [string, string][] { return Object.entries(p.attributes ?? {}).map(([k, v]) => [k, String(v)]); }

  /** Producto más cercano al centro del carril = el seleccionado. */
  protected onScroll(slug: string, track: HTMLElement) {
    cancelAnimationFrame(this.raf[slug]);
    this.raf[slug] = requestAnimationFrame(() => {
      const c = track.scrollLeft + track.clientWidth / 2; let best = 0, d = Infinity;
      (Array.from(track.querySelectorAll('.item')) as HTMLElement[]).forEach((el, i) => {
        const m = Math.abs(el.offsetLeft + el.offsetWidth / 2 - c); if (m < d) { d = m; best = i; }
      });
      if (this.active()[slug] !== best) this.active.update(a => ({ ...a, [slug]: best }));
    });
  }
  protected center(track: HTMLElement, i: number) {
    const el = track.querySelectorAll('.item')[i] as HTMLElement | undefined; if (!el) return;
    track.scrollTo({ left: el.offsetLeft + el.offsetWidth / 2 - track.clientWidth / 2, behavior: this.reduced ? 'auto' : 'smooth' });
  }
  protected step(track: HTMLElement, r: Row, dir: number) {
    this.center(track, Math.min(r.items.length - 1, Math.max(0, this.idx(r.type.slug) + dir)));
  }
  protected toggle(id: number) { this.selected.update(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }); }
  protected async fav(p: Product) {
    if (!this.auth.loggedIn()) { this.router.navigate(['/ingresar'], { queryParams: { next: '/' } }); return; }
    await this.favs.toggle(p.id);
  }
  protected async addSelected() {
    if (!this.auth.loggedIn()) { this.router.navigate(['/ingresar'], { queryParams: { next: '/' } }); return; }
    this.busy.set(true); this.msg.set('');
    try { for (const id of this.selected()) await this.cart.add(id); this.msg.set('Agregado al carrito'); this.selected.set(new Set()); }
    catch { this.msg.set('No pudimos agregar al carrito. Intentá de nuevo.'); } finally { this.busy.set(false); }
  }
}
