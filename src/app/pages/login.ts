import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-login',
  template: `
    <h1>{{ mode() === 'in' ? 'Ingresar' : 'Crear cuenta' }}</h1>
    <form (submit)="submit($event, email.value, pass.value)" style="max-width:360px">
      <input #email type="email" placeholder="Email" required autocomplete="email" />
      <input #pass type="password" placeholder="Contraseña (mín. 8)" minlength="8" required
             [autocomplete]="mode() === 'in' ? 'current-password' : 'new-password'" />
      <button type="submit">{{ mode() === 'in' ? 'Ingresar' : 'Registrarme' }}</button>
      <button type="button" (click)="mode.set(mode() === 'in' ? 'up' : 'in')">
        {{ mode() === 'in' ? 'Crear cuenta' : 'Ya tengo cuenta' }}</button>
      @if (error()) { <p role="alert">{{ error() }}</p> }
    </form>`,
})
export class Login {
  private auth = inject(AuthService); private router = inject(Router); private route = inject(ActivatedRoute);
  mode = signal<'in' | 'up'>('in'); error = signal('');
  async submit(e: Event, email: string, pass: string) {
    e.preventDefault(); this.error.set('');
    const { error } = this.mode() === 'in' ? await this.auth.signIn(email, pass) : await this.auth.signUp(email, pass);
    if (error) { this.error.set(error.message); return; }
    const next = this.route.snapshot.queryParamMap.get('next');
    this.router.navigateByUrl(next && next.startsWith('/') && !next.startsWith('//') ? next : '/');
  }
}
