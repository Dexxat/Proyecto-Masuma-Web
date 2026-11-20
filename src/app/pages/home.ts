import { Component, computed } from '@angular/core';
import { site } from '../core/site.config';
import { ContactSection } from '../shared/contact-section';
import { OutroVideo } from '../shared/outro-video';
import { AnchorGallery } from '../shared/anchor-gallery';
import { BrandsMarquee } from '../shared/brands-marquee';
import { Hero } from '../shared/hero';
import { ProductsShelf } from '../shared/products-shelf';
import { ServicesSection } from '../shared/services-section';

/** Home: hero con scroll video, nosotros con imagen anclada, cinta + tarjetas de servicios, estante de productos y contacto. Todo sale de site.config.ts. */
@Component({
  selector: 'app-home', imports: [BrandsMarquee, Hero, AnchorGallery, ContactSection, ProductsShelf, ServicesSection, OutroVideo],
  template: `
    <app-hero />

    <section class="about" id="nosotros" aria-labelledby="about-h">
      <div class="about-text">
        <h2 id="about-h">{{ site.about.title }}</h2>
        @for (p of site.about.paragraphs; track $index) { <p>{{ p }}</p> }
        @empty { <p class="muted">Texto institucional a cargar con el contenido aprobado por la empresa.</p> }
      </div>
      <app-anchor-gallery [images]="site.about.images" />
    </section>

    <app-brands-marquee />

    <div class="marquee rev" aria-hidden="true">
      <div class="track" style="--dur:60s">
        @for (n of [0, 1]; track n) {
          <div class="half">
            @for (k of fill; track k) { @for (t of ribbon(); track $index) { <span>{{ t }}</span><i>✦</i> } }
          </div>
        }
      </div>
    </div>

    <section class="svc-band bleed" id="servicios" aria-labelledby="svc-h">
      <div class="svc-in">
        <header class="svc-head">
          <h2 id="svc-h">{{ site.servicesTitle }}</h2>
          @if (site.servicesIntro) { <p>{{ site.servicesIntro }}</p> }
        </header>
        <app-services-section />
      </div>
    </section>
    <app-products-shelf />
    <app-contact-section />      <!-- Contacto + Trabaje con nosotros -->
    <app-outro-video />          <!-- cierre: el avión aterriza -->`,
})
export class Home {
  protected site = site;
  protected ribbon = computed(() => (site.ribbonWords.length ? site.ribbonWords : ['SERVICIOS']));
  /** Repeticiones por mitad: cada mitad debe ser más ancha que la pantalla. Con 6 frases largas alcanza con 2 (con 2 palabras eran 8). */
  protected fill = Array.from({ length: 2 }, (_, i) => i);
}
