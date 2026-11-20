import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FavoritesService } from '../core/favorites.service';
import { Product } from '../core/models';

@Component({
  selector: 'app-favoritos', imports: [RouterLink],
  template: `
    <h1>Favoritos</h1>
    <div class="grid">
      @for (p of products(); track p.id) {
        <a class="card" [routerLink]="['/productos', p.slug]"><h3>{{ p.name }}</h3><p class="muted">{{ p.brand?.name }} · {{ p.type?.name }}</p></a>
      } @empty { <p>Todavía no marcaste favoritos. Podés hacerlo desde la ficha de cada producto.</p> }
    </div>`,
})
export class Favoritos {
  products = signal<Product[]>([]);
  constructor() { inject(FavoritesService).products().then(p => this.products.set(p)); }
}
