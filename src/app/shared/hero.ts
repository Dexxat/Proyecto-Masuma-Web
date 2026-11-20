import { Component, ElementRef, NgZone, OnDestroy, afterNextRender, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { site } from '../core/site.config';

/**
 * Hero con video controlado por el scroll ("scroll video").
 * La sección es alta (varias pantallas) y el cuadro queda "pegado" (sticky): al bajar, el progreso del scroll mueve el
 * tiempo del video (las ruedas giran y el avión despega hacia la izquierda). Cuando el avión sale de plano, aparece
 * la imagen cenital alejándose. Sin video configurado, o con "reducir movimiento", es un hero estático normal.
 */
@Component({
  selector: 'app-hero', imports: [RouterLink],
  template: `
    <section #sec class="hero-scroll bleed" [class.scrub]="scrub()" aria-label="Presentación">
      <div class="stick">
        <div class="media" aria-hidden="true">
          @if (site.hero.poster) { <img class="poster" [class.gone]="painted()" [src]="site.hero.poster" alt="" /> }
          @if (site.hero.video) {
            <video #vid [class.on]="painted()" muted playsinline preload="auto" disablepictureinpicture tabindex="-1"
                   (loadedmetadata)="onMeta()" (seeked)="painted.set(true)" (error)="failed.set(true)"></video>
          }
          @if (site.hero.aerialImage) { <img #aerial class="aerial" [src]="site.hero.aerialImage" alt="" /> }
        </div>
        <div class="shade"></div>

        <div #content class="hero-content">
          <div class="hero-logo" [class.has]="!!site.logo" role="img" [attr.aria-label]="'Logo ' + site.name">
            @if (site.logo) { <img [src]="site.logo" [alt]="site.name" /> } @else { <span>LOGO</span> }
          </div>
          <div class="hero-text">
            <p class="tag">-{{ site.tagline }}-</p>
            <h1>{{ site.fullName }}</h1>
          </div>

          <div class="reps">
            <h2>Representamos</h2>
            <ul>
              @for (p of site.partners; track p.name) {
                <li class="circle" [title]="p.name">@if (p.logo) { <img [src]="p.logo" [alt]="p.name" /> } @else { <span>{{ p.name }}</span> }</li>
              }
            </ul>
          </div>

          <a class="btn btn-wide hero-cta" routerLink="/ingresar">INGRESAR</a>
        </div>
        @if (scrub()) { <div #hint class="hint" aria-hidden="true">Deslizá <i></i></div> }
      </div>
    </section>`,
})
export class Hero implements OnDestroy {
  protected site = site;
  private zone = inject(NgZone);
  private sec = viewChild.required<ElementRef<HTMLElement>>('sec');
  private vid = viewChild<ElementRef<HTMLVideoElement>>('vid');
  private aerial = viewChild<ElementRef<HTMLImageElement>>('aerial');
  private content = viewChild.required<ElementRef<HTMLElement>>('content');
  private hint = viewChild<ElementRef<HTMLElement>>('hint');

  protected failed = signal(false);
  protected painted = signal(false);   // true cuando el video ya mostró un cuadro real (hasta entonces se ve el póster)
  private reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  /** El video se "scrubea" solo si hay video, no falló y la persona no pidió menos movimiento. */
  protected scrub = () => !!site.hero.video && !this.failed() && !this.reduced;
  private mobile = typeof matchMedia !== 'undefined' && (matchMedia('(hover: none) and (pointer: coarse)').matches || matchMedia('(max-width:860px)').matches);
  private videoSrc = (this.mobile && site.hero.videoMobile) ? site.hero.videoMobile : site.hero.video;

  private duration = 0; private target = 0; private current = 0; private raf = 0; private last = -1;
  private passed = false;   // true cuando la persona ya está por debajo del hero (en Nosotros o más abajo)
  private lastY = 0;        // para saber si el scroll va hacia arriba
  private onScroll = () => { this.update(); this.loop(); };

  constructor() {
    afterNextRender(() => {
      if (!this.scrub()) return;
      document.documentElement.style.setProperty('--fly', '0');   // el avioncito del encabezado todavía no aterrizó
      this.zone.runOutsideAngular(() => {
        addEventListener('scroll', this.onScroll, { passive: true }); addEventListener('resize', this.onScroll);
        addEventListener('pointerdown', this.prime, { once: true, passive: true }); addEventListener('touchstart', this.prime, { once: true, passive: true });
      });
      this.lastY = scrollY;
      this.loadVideo(); this.update();
      this.current = this.target;   // si se entra por un ancla (/#productos) el hero ya está pasado: sin animar, avioncito aterrizado
      this.paint(this.current);
    });
  }
  ngOnDestroy() {
    removeEventListener('scroll', this.onScroll); removeEventListener('resize', this.onScroll);
    removeEventListener('pointerdown', this.prime); removeEventListener('touchstart', this.prime);
    document.documentElement.style.removeProperty('--fly');   // fuera del home el avioncito queda posado
    cancelAnimationFrame(this.raf); if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
  }

  /**
   * Carga el video como Blob (siempre se puede "seekear", sin depender de HTTP range) — técnica tomada del motor
   * scroll-world (MIT, ver docs/scroll-world/LICENSE). Si falla, se ve el póster y el hero queda estático.
   */
  private loadVideo() {
    const v = this.vid()?.nativeElement; if (!v) return;
    fetch(this.videoSrc).then(r => r.ok ? r.blob() : Promise.reject(new Error(String(r.status))))
      .then(b => { this.objectUrl = URL.createObjectURL(b); v.src = this.objectUrl; })
      .catch(() => this.zone.run(() => this.failed.set(true)));
  }
  private objectUrl = '';
  /** iOS exige un gesto para decodificar un video silenciado: en el primer toque lo "arrancamos" y pausamos. */
  private prime = () => {
    if (!this.mobile) return; const v = this.vid()?.nativeElement; if (!v) return;
    try { const p = v.play(); p?.then(() => v.pause()).catch(() => {}); } catch { /* sin acción */ }
  };

  protected onMeta() { this.duration = this.vid()?.nativeElement.duration ?? 0; this.update(); this.loop(); }

  private headerH() { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hh')) || 0; }

  /**
   * Progreso 0..1 del scroll dentro de la sección alta.
   * Si la persona ya bajó hasta Nosotros y vuelve a subir, al asomar el hero se salta a su inicio (ver restart()).
   */
  private update() {
    const el = this.sec().nativeElement, hh = this.headerH(), r = el.getBoundingClientRect();
    const goingUp = scrollY < this.lastY; this.lastY = scrollY;
    if (r.bottom <= hh + 40) this.passed = true;                        // ya está en Nosotros (o más abajo)
    if (this.passed && goingUp && r.bottom > hh + 120) { this.restart(); return; }   // vuelve a asomar el hero
    const stick = innerHeight - hh, total = el.offsetHeight - stick;
    this.target = Math.min(1, Math.max(0, (hh - r.top) / total));
  }

  /** Vuelve el hero a su estado inicial (video en el cuadro 0, logo, título, botón y "Deslizá" visibles) y deja el scroll en su comienzo. */
  private restart() {
    this.passed = false;
    const el = this.sec().nativeElement;
    scrollTo({ top: el.getBoundingClientRect().top + scrollY - this.headerH(), behavior: 'instant' });
    this.lastY = scrollY;
    this.target = 0; this.current = 0; this.last = -1;
    const v = this.vid()?.nativeElement; if (v && this.duration) v.currentTime = 0;
    this.paint(0);
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
  // Reparto del recorrido: 0–VIDEO_END mueve el video; después aparece la imagen cenital.
  private paint(p: number) {
    const END = this.aerial() ? 0.72 : 1;
    const v = this.vid()?.nativeElement;
    if (v && this.duration) {
      const t = Math.min(1, p / END) * this.duration;
      // Nunca se encola un seek mientras el anterior sigue resolviéndose (en celulares un gesto rápido congelaría el video).
      if (!v.seeking && Math.abs(t - this.last) > (this.mobile ? 1 / 45 : 1 / 90)) { this.last = t; v.currentTime = Math.min(t, this.duration - 0.001); }
    }
    const a = this.aerial()?.nativeElement;
    if (a) {
      const k = Math.min(1, Math.max(0, (p - END + 0.05) / 0.12));   // fundido de entrada
      const z = Math.min(1, Math.max(0, (p - END) / (1 - END)));     // el avión se aleja: la imagen "se abre"
      a.style.opacity = String(k); a.style.transform = `scale(${1.3 - 0.3 * z})`;
    }
    // Avioncito del encabezado: cuando el avión sale de cuadro, aterriza en el hueco del encabezado (CSS lee --fly).
    const [a0, a1] = [site.hero.landFrom, site.hero.landTo];
    const t = Math.min(1, Math.max(0, (p - a0) / (a1 - a0)));
    const c1 = 1.1, c3 = c1 + 1, e = t === 0 || t === 1 ? t : 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);   // easeOutBack: llega, se pasa un poco y se asienta
    document.documentElement.style.setProperty('--fly', e.toFixed(4));
    const fade = Math.max(0, 1 - p / 0.18);
    const c = this.content().nativeElement; c.style.opacity = String(fade); c.style.pointerEvents = fade < 0.4 ? 'none' : 'auto';
    c.style.transform = `translateY(${(1 - fade) * -24}px)`;
    const h = this.hint()?.nativeElement; if (h) h.style.opacity = String(Math.max(0, 1 - p / 0.06));
  }
}
