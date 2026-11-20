import { Component, ElementRef, NgZone, OnDestroy, afterNextRender, inject, input, signal } from '@angular/core';

/**
 * Cuadro "anclado": las imágenes quedan fijas respecto de la pantalla y el cuadro (con bordes redondeados) las recorta
 * mientras baja por la página. A medida que el cuadro cruza la pantalla, la imagen cambia con un fundido suave.
 */
@Component({
  selector: 'app-anchor-gallery',
  template: `
    <div class="anchor" role="group" aria-roledescription="galería" aria-label="Imágenes institucionales">
      @for (src of images(); track src; let i = $index) {
        <img [src]="src" alt="" [class.on]="i === idx()" [attr.loading]="i === 0 ? 'eager' : 'lazy'" />
      } @empty { <div class="ph">Imágenes de Nosotros</div> }
      @if (images().length > 1) {
        <div class="adots" aria-hidden="true">@for (s of images(); track s; let i = $index) { <i [class.on]="i === idx()"></i> }</div>
      }
    </div>`,
})
export class AnchorGallery implements OnDestroy {
  images = input<string[]>([]);
  protected idx = signal(0);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private zone = inject(NgZone);
  private raf = 0;
  private onScroll = () => { cancelAnimationFrame(this.raf); this.raf = requestAnimationFrame(() => this.update()); };

  constructor() {
    afterNextRender(() => {
      this.zone.runOutsideAngular(() => { addEventListener('scroll', this.onScroll, { passive: true }); addEventListener('resize', this.onScroll); });
      this.update();
    });
  }
  ngOnDestroy() { removeEventListener('scroll', this.onScroll); removeEventListener('resize', this.onScroll); cancelAnimationFrame(this.raf); }

  /** Progreso del cuadro al cruzar la pantalla (0 = recién asoma abajo, 1 = ya salió por arriba) → imagen activa. */
  private update() {
    const n = this.images().length; if (n < 2) return;
    const r = this.host.nativeElement.getBoundingClientRect();
    const p = Math.min(0.999, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height)));
    const i = Math.floor(p * n);
    if (i !== this.idx()) this.zone.run(() => this.idx.set(i));
  }
}
