import { Component } from '@angular/core';
import { site, waUrl } from '../core/site.config';
import { AnchorGallery } from './anchor-gallery';

/** Contacto (y Trabaje con nosotros) en el home: destino del botón CONTACTO del menú (#contacto = contenedor, con el título). */
@Component({
  selector: 'app-contact-section', imports: [AnchorGallery],
  template: `
    <div id="contacto" class="contact-wrap">
    <header class="sec-head"><h2 id="contact-h">Contacto</h2></header>
    <section class="contact" aria-labelledby="contact-h">
      <div class="contact-info">
        @if (site.phone) { <p><span>Teléfono</span> <a [href]="'tel:+' + digits(site.phone)">{{ site.phone }}</a></p> }
        @if (site.whatsapp) { <p><span>WhatsApp</span> <a [href]="waUrl(site.whatsapp)" target="_blank" rel="noopener noreferrer">{{ site.whatsapp }}</a></p> }
        @if (site.email) { <p><span>Mail</span> <a [href]="'mailto:' + site.email">{{ site.email }}</a></p> }
        @if (site.address) { <p><span>Dirección</span> {{ site.address }}</p> }
        @if (!site.phone && !site.whatsapp && !site.email && !site.address) {
          <p class="muted">Datos de contacto a cargar en <code>site.config.ts</code> cuando la empresa los entregue.</p>
        }
        @if (site.logo) {
          <div class="contact-logo"><img [src]="site.logo" [alt]="'Logo ' + site.name" width="150" height="150" /></div>
        }
      </div>
      <div class="contact-map">
        @if (contactImgs.length) { <app-anchor-gallery class="contact-bg" aria-hidden="true" [images]="contactImgs" /> }
        @else if (site.mapEmbedUrl) {
          <iframe [src]="site.mapEmbedUrl" title="Ubicación" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
        } @else { <div class="ph">Mapa / ubicación</div> }
      </div>
    </section>
    @if (site.jobs.paragraphs.length) {
      <section class="jobs" id="trabaje-con-nosotros" aria-labelledby="jobs-h">
        <h3 id="jobs-h">{{ site.jobs.title }}</h3>
        <p class="jobs-text">@for (p of site.jobs.paragraphs; track $index) { {{ p }} } @if (site.email) { {{ site.jobs.cta }} }</p>
        @if (site.email) { <a class="jobs-mail" [href]="'mailto:' + site.email + '?subject=CV'">{{ site.email }}</a> }
      </section>
    }
    </div>`,
})
export class ContactSection {
  protected site = site;
  /** Foto de la caja, anclada como en Nosotros (una sola imagen: sin puntitos ni cambio de foto). */
  protected contactImgs = site.contactImage ? [site.contactImage] : [];
  protected waUrl = waUrl;
  protected digits = (s: string) => s.replace(/\D/g, '');
}
