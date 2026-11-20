import { Component, DestroyRef, inject, signal } from '@angular/core';
import { site } from '../core/site.config';

/** 2 tarjetas grandes (mantenimiento y capacitación). Cada una pasa sus imágenes sola, con fundido suave y zoom lento. */
@Component({
  selector: 'app-services-section',
  template: `
    <section class="services" aria-label="Servicios">
      @for (s of site.services; track $index; let c = $index) {
        <article class="svc" tabindex="0" (click)="toggle($event)"
                 (mouseenter)="hold(true)" (mouseleave)="hold(false)" (focusin)="hold(true)" (focusout)="hold(false)">
          @for (img of s.images; track img; let i = $index) {
            <div class="layer" [class.on]="i === idx()[c]" [style.background-image]="'url(' + img + ')'"></div>
          } @empty { <div class="empty">Imágenes a cargar</div> }
          @if (s.images.length > 1) {
            <div class="svc-dots" aria-hidden="true">@for (img of s.images; track img; let i = $index) { <i [class.on]="i === idx()[c]"></i> }</div>
          }
          <div class="svc-text">
            <h3>{{ s.title }}</h3>
            @if (s.items?.length) { <ul>@for (it of s.items; track it) { <li>{{ it }}</li> }</ul> }
          </div>
        </article>
      }
    </section>`,
})
export class ServicesSection {
  protected site = site;
  protected idx = signal<number[]>(site.services.map(() => 0));
  private paused = false;

  constructor() {
    const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof window === 'undefined') return;
    // Cada tarjeta avanza cada site.servicesSlideMs (def. 5500 ms) y la segunda arranca desfasada para que no cambien a la vez.
    const ms = site.servicesSlideMs;
    const timers: number[] = [];
    site.services.forEach((s, c) => {
      if (s.images.length < 2) return;
      const start = window.setTimeout(() => {
        timers.push(window.setInterval(() => {
          if (this.paused || document.hidden) return;
          this.idx.update(a => a.map((v, k) => k === c ? (v + 1) % s.images.length : v));
        }, ms));
      }, c * (ms / 2));
      timers.push(start);
    });
    inject(DestroyRef).onDestroy(() => timers.forEach(t => { clearTimeout(t); clearInterval(t); }));
  }

  /** Se frena mientras el mouse o el foco están sobre una tarjeta (para poder leer la lista). */
  protected hold(v: boolean) { this.paused = v; }
  /** En pantallas táctiles no hay hover: un toque muestra/oculta la lista. */
  protected toggle(e: Event) { (e.currentTarget as HTMLElement).classList.toggle('tap'); }
}
