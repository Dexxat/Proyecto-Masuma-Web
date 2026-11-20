import { Injectable, computed, inject, signal } from '@angular/core';
import type { Session } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private sb = inject(SupabaseService).client;
  readonly session = signal<Session | null>(null);
  readonly user = computed(() => this.session()?.user ?? null);
  readonly loggedIn = computed(() => !!this.session());
  readonly ready: Promise<void>;

  constructor() {
    this.ready = this.sb.auth.getSession().then(({ data }) => this.session.set(data.session));
    this.sb.auth.onAuthStateChange((_e, s) => this.session.set(s));
  }
  signUp(email: string, password: string) { return this.sb.auth.signUp({ email, password }); }
  signIn(email: string, password: string) { return this.sb.auth.signInWithPassword({ email, password }); }
  resetPassword(email: string) { return this.sb.auth.resetPasswordForEmail(email); }
  signOut() { return this.sb.auth.signOut(); }
}
