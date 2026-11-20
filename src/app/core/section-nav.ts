import { Injectable, NgZone, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

export type SectionId = 'nosotros' | 'productos' | 'contacto';
/** Menú principal: tres secciones del home (single page). */
export const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'nosotros', label: 'Nosotros' },
  { id: 'productos', label: 'Productos' },
  { id: 'contacto', label: 'Contacto' },
];

/** Navegación por secciones del home + sección activa según el scroll. */
@Injectable({ providedIn: 'root' })
export class SectionNav {
  private router = inject(Router);
  private zone = inject(NgZone);
  readonly active = signal<SectionId | null>(null);
  private reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  private userScrolled = false;

  constructor() {
    if (typeof window === 'undefined') return;
    this.zone.runOutsideAngular(() => {
      const on = () => this.update();
      addEventListener('scroll', on, { passive: true }); addEventListener('resize', on);
      const mark = () => { this.userScrolled = true; };
      addEventListener('wheel', mark, { passive: true }); addEventListener('touchmove', mark, { passive: true }); addEventListener('keydown', mark);
    });
    // Al llegar al home con ancla desde otra pantalla, el estante carga sus productos después y corre las secciones de abajo:
    // se vuelve a alinear un par de veces, salvo que la persona ya haya scrolleado por su cuenta.
    this.router.events.subscribe(e => {
      if (!(e instanceof NavigationEnd)) return;
      const tree = this.router.parseUrl(e.urlAfterRedirects);
      const frag = tree.fragment as SectionId | null;
      this.update();
      if (!frag || !SECTIONS.some(s => s.id === frag) || this.path() !== '/') return;
      this.userScrolled = false;
      for (const ms of [400, 1200]) setTimeout(() => { if (!this.userScrolled) this.align(frag); }, ms);
    });
  }

  private path() { return this.router.url.split(/[?#]/)[0]; }

  /** Clic en un botón del menú: en el home, scroll suave; desde otra pantalla, vuelve al home con el ancla. */
  go(id: SectionId, ev?: Event) {
    ev?.preventDefault();
    if (this.path() === '/') this.scrollTo(id);
    else this.router.navigate(['/'], { fragment: id });   // anchorScrolling baja a la sección al cargar
  }
  scrollTo(id: SectionId) {
    document.getElementById(id)?.scrollIntoView({ behavior: this.reduced ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(history.state, '', '/#' + id);    // la URL refleja la sección (se puede compartir)
  }
  /** Logo del header: inicio del hero. */
  home(ev?: Event) {
    ev?.preventDefault();
    if (this.path() === '/') { scrollTo({ top: 0, behavior: this.reduced ? 'auto' : 'smooth' }); history.replaceState(history.state, '', '/'); }
    else this.router.navigateByUrl('/');
  }

  private align(id: SectionId) {
    const el = document.getElementById(id); if (!el) return;
    const hh = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hh')) || 0;
    if (Math.abs(el.getBoundingClientRect().top - (hh + 8)) > 4) el.scrollIntoView({ behavior: 'auto', block: 'start' });
  }

  /** Activa la última sección cuyo borde superior ya pasó el tercio superior de la pantalla. */
  private update() {
    let cur: SectionId | null = null;
    if (this.path() === '/') {
      const hh = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hh')) || 0;
      const line = hh + innerHeight * 0.33;
      for (const s of SECTIONS) { const el = document.getElementById(s.id); if (el && el.getBoundingClientRect().top <= line) cur = s.id; }
    }
    if (cur !== this.active()) this.zone.run(() => this.active.set(cur));
  }
}
