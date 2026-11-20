import { Component, ElementRef, NgZone, OnDestroy, afterNextRender, inject, signal, viewChild } from '@angular/core';
import { site } from '../core/site.config';

/**
 * Cierre de la página: el avión aterriza mientras se baja (el hero, a la inversa).
 * Es el mismo recurso del hero: el video no se "reproduce", el scroll mueve su tiempo. Termina en el cuadro de las ruedas
 * detenidas sobre la pista, el mismo plano con el que empieza el hero.
 *
 * Sección alta con un cuadro "pegado" (sticky). El progreso va de 0 (la sección recién asoma por abajo, cuando ya se está
 * pasando «Trabaje con nosotros») a 1 (el final de la sección llega al borde inferior de la pantalla, justo antes del pie).
 * El video se descarga recién cuando la sección está cerca, para no competir con el hero. Sin video, si falla o con
 * "reducir movimiento", se ve la imagen final (el avión ya aterrizado), sin scroll especial.
 */
@Component({
  selector: 'app-outro-video',
  template: `
    <section #sec class="outro bleed" [class.scrub]="scrub()" [attr.aria-label]="site.outro.title ? null : 'Cierre: el avión aterriza'" [attr.aria-labelledby]="site.outro.title ? 'outro-h' : null">
      <div class="outro-stick">
        @if (scrub()) {
          @if (site.outro.poster) { <img class="poster" [class.gone]="painted()" [src]="site.outro.poster" alt="" /> }
          <video #vid [class.on]="painted()" muted playsinline preload="auto" disablepictureinpicture tabindex="-1" aria-hidden="true"
                 (loadedmetadata)="onMeta()" (seeked)="painted.set(true)" (error)="failed.set(true)"></video>
        } @else if (site.outro.endImage) {
          <img class="poster" [src]="site.outro.endImage" alt="Un avión de MASUMA aterrizado en la pista" />
        }
        <div class="shade"></div>
        @if (site.outro.title) { <h2 class="outro-title" id="outro-h">{{ site.outro.title }}</h2> }
      </div>
    </section>`,
})
export class OutroVideo implements OnDestroy {
  protected site = site;
  private zone = inject(NgZone);
  private sec = viewChild.required<ElementRef<HTMLElement>>('sec');
  private vid = viewChild<ElementRef<HTMLVideoElement>>('vid');

  protected failed = signal(false);
  protected painted = signal(false);          // true cuando el video ya mostró un cuadro real (hasta entonces se ve el póster)
  private reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  protected scrub = () => !!site.outro.video && !this.failed() && !this.reduced;
  private mobile = typeof matchMedia !== 'undefined' && (matchMedia('(hover: none) and (pointer: coarse)').matches || matchMedia('(max-width:860px)').matches);
  private src = (this.mobile && site.outro.videoMobile) ? site.outro.videoMobile : site.outro.video;

  private duration = 0; private target = 0; private current = 0; private raf = 0; private last = -1;
  private started = false; private objectUrl = ''; private io?: IntersectionObserver;
  private onScroll = () => { this.update(); this.loop(); };

  constructor() {
    afterNextRender(() => {
      if (!this.scrub()) return;
      this.zone.runOutsideAngular(() => {
        addEventListener('scroll', this.onScroll, { passive: true }); addEventListener('resize', this.onScroll);
        addEventListener('pointerdown', this.prime, { once: true, passive: true }); addEventListener('touchstart', this.prime, { once: true, passive: true });
        // Descarga el video recién cuando la sección está a ~2 pantallas de distancia.
        if (typeof IntersectionObserver === 'undefined') { this.loadVideo(); return; }
        this.io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { this.loadVideo(); this.io?.disconnect(); } }, { rootMargin: '200% 0px' });
        this.io.observe(this.sec().nativeElement);
      });
      this.update();
    });
  }
  ngOnDestroy() {
    removeEventListener('scroll', this.onScroll); removeEventListener('resize', this.onScroll);
    removeEventListener('pointerdown', this.prime); removeEventListener('touchstart', this.prime);
    this.io?.disconnect(); cancelAnimationFrame(this.raf); if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
  }

  /** Carga el video como Blob (siempre se puede "seekear", sin depender de HTTP range), igual que el hero. */
  private loadVideo() {
    if (this.started) return; this.started = true;
    const v = this.vid()?.nativeElement; if (!v) return;
    fetch(this.src).then(r => r.ok ? r.blob() : Promise.reject(new Error(String(r.status))))
      .then(b => { this.objectUrl = URL.createObjectURL(b); v.src = this.objectUrl; })
      .catch(() => this.zone.run(() => this.failed.set(true)));
  }
  /** iOS exige un gesto para decodificar un video silenciado: en el primer toque lo "arrancamos" y pausamos. */
  private prime = () => {
    if (!this.mobile) return; const v = this.vid()?.nativeElement; if (!v || !v.src) return;
    try { const p = v.play(); p?.then(() => v.pause()).catch(() => {}); } catch { /* sin acción */ }
  };

  protected onMeta() { this.duration = this.vid()?.nativeElement.duration ?? 0; this.update(); this.loop(); }

  /** Progreso 0..1: 0 = la sección asoma por abajo; 1 = su final llega al borde inferior de la pantalla. */
  private update() {
    const r = this.sec().nativeElement.getBoundingClientRect();
    this.target = Math.min(1, Math.max(0, (innerHeight - r.top) / r.height));
  }
  /** Suaviza el movimiento (interpolación) para que el video no "salte" con la rueda del mouse. */
  private loop() {
    cancelAnimationFrame(this.raf);
    const step = () => {
      this.current += (this.target - this.current) * 0.14;
      if (Math.abs(this.target - this.current) < 0.0005) this.current = this.target;
      this.paint(this.current);
      if (this.current !== this.target || this.vid()?.nativeElement.seeking) this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }
  private paint(p: number) {
    const v = this.vid()?.nativeElement; if (!v || !this.duration) return;
    const t = Math.min(1, p / site.outro.end) * this.duration;       // llega al último cuadro un poco antes del final y lo sostiene
    // Nunca se encola un seek mientras el anterior sigue resolviéndose (en celulares un gesto rápido congelaría el video).
    if (!v.seeking && Math.abs(t - this.last) > (this.mobile ? 1 / 45 : 1 / 90)) { this.last = t; v.currentTime = Math.min(t, this.duration - 0.001); }
  }
}
