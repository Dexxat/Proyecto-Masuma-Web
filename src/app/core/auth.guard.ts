import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async (_r, state) => {
  const auth = inject(AuthService);
  await auth.ready;
  return auth.loggedIn() || inject(Router).createUrlTree(['/ingresar'], { queryParams: { next: state.url } });
};
