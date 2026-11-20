import { AfterViewInit, Component, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
import { AdminService } from './core/admin.service';
import { CartService } from './core/cart.service';
import { SECTIONS, SectionNav } from './core/section-nav';
import { site, waUrl } from './core/site.config';
import { PlaneIcon, SocialIcon, SocialName } from './shared/icons';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, PlaneIcon, SocialIcon],
  template: `
    <header class="top" #hdr>
      <a href="/" class="mini" aria-label="Inicio" (click)="nav.home($event)">
        @if (site.logo) { <img class="mini-logo" [src]="site.logo" [alt]="site.name" /> }
        <app-plane-icon [size]="40" />
      </a>
      <nav aria-label="Principal">
        @for (s of sections; track s.id) {
          <a [href]="'/#' + s.id" class="navlink" [class.on]="nav.active() === s.id" [attr.aria-current]="nav.active() === s.id ? 'true' : null"
             (click)="nav.go(s.id, $event)"><app-plane-icon [size]="22" />{{ s.label }}</a>
        }
        @if (auth.loggedIn()) {
          @if (isAdmin()) { <a routerLink="/admin">Admin</a> }
          <button type="button" (click)="auth.signOut()">Salir</button>
        }
      </nav>
      <div class="social" aria-label="Redes sociales">
        @for (n of socials; track n) {
          @if (site.social[n]; as url) { <a [href]="url" target="_blank" rel="noopener noreferrer" [attr.aria-label]="labels[n]"><app-social-icon [name]="n" /></a> }
        }
        @if (site.whatsapp) { <a [href]="waUrl(site.whatsapp)" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><app-social-icon name="whatsapp" /></a> }
      </div>
    </header>
    <main><router-outlet /></main>
    <footer class="foot">
      <div class="foot-in">
        <a href="/" class="foot-brand" aria-label="MASUMA Internacional, inicio" (click)="nav.home($event)">
          @if (site.logo) { <img [src]="site.logo" alt="" width="40" height="40" /> }
          <span><b>{{ site.name }}</b> Internacional<small>{{ site.tagline }}</small></span>
        </a>
        <nav class="foot-links" aria-label="Información legal">
          <a routerLink="/legales/terminos">Términos y condiciones</a>
          <a routerLink="/legales/privacidad">Política de privacidad</a>
        </nav>
        <div class="foot-social" aria-label="Redes sociales">
          @for (n of socials; track n) {
            @if (site.social[n]; as url) { <a [href]="url" target="_blank" rel="noopener noreferrer" [attr.aria-label]="labels[n]"><app-social-icon [name]="n" /></a> }
          }
          @if (site.whatsapp) { <a [href]="waUrl(site.whatsapp)" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><app-social-icon name="whatsapp" /></a> }
        </div>
      </div>
      <p class="foot-copy">© {{ year }} {{ site.name }} Internacional · Argentina · Todos los derechos reservados</p>
    </footer>
  `,
})
export class App implements AfterViewInit {
  private hdr = viewChild<ElementRef<HTMLElement>>('hdr');
  protected auth = inject(AuthService);
  protected cart = inject(CartService);
  protected site = site;
  /** Redes del encabezado: solo se muestran las que tienen link en site.social (YouTube no tiene por ahora). */
  protected socials: Exclude<SocialName, 'whatsapp'>[] = ['instagram', 'facebook', 'linkedin', 'youtube'];
  protected labels: Record<SocialName, string> = { instagram: 'Instagram', facebook: 'Facebook', linkedin: 'LinkedIn', youtube: 'YouTube', whatsapp: 'WhatsApp' };
  protected waUrl = waUrl;
  protected year = new Date().getFullYear();
  protected isAdmin = signal(false);
  protected nav = inject(SectionNav);
  protected sections = SECTIONS;

  constructor() {
    const admin = inject(AdminService);
    effect(() => { this.auth.user() ? admin.isAdmin().then(v => this.isAdmin.set(v)) : this.isAdmin.set(false); });
  }

  /** Altura real del encabezado (cambia al envolverse en celulares): la usan las secciones "pegadas" del home. */
  ngAfterViewInit() {
    const el = this.hdr()?.nativeElement;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const set = () => document.documentElement.style.setProperty('--hh', el.offsetHeight + 'px');
    new ResizeObserver(set).observe(el); set();
  }
}
