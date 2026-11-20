import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { AdminService } from './admin.service';

/** Solo mejora la experiencia (oculta pantallas). La seguridad real está en RLS y en las funciones del servidor. */
export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  await auth.ready;
  if (!auth.loggedIn()) return inject(Router).createUrlTree(['/ingresar'], { queryParams: { next: '/admin' } });
  return (await inject(AdminService).isAdmin()) || inject(Router).createUrlTree(['/']);
};
