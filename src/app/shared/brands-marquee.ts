import { Component } from '@angular/core';
import { site } from '../core/site.config';

/** Cinta de marcas que avanza hacia la izquierda. Logos en SVG (public/media/brands/). Sin logo cargado se muestra el nombre. */
@Component({
  selector: 'app-brands-marquee',
  template: `
    <section class="brands" aria-label="Marcas con las que trabajamos">
      <p class="brands-title">Marcas con las que trabajamos</p>
      <div class="brands-view">
        <ul class="brands-track">
          @for (n of [0, 1]; track n) {
            @for (b of site.brands; track b.name) {
              <li [attr.aria-hidden]="n === 1 ? 'true' : null">
                @if (b.logo) { <img [src]="b.logo" [style.--h.px]="b.h" [alt]="n === 1 ? '' : b.name" loading="lazy" /> }
                @else { <span class="wordmark">{{ b.name }}</span> }
              </li>
            }
          }
        </ul>
      </div>
    </section>`,
})
export class BrandsMarquee {
  protected site = site;
}
