import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { adminGuard } from './core/admin.guard';

/** Las secciones institucionales viven en el home (single page): las URLs viejas redirigen a su ancla. */
const toHome = (fragment: string) => () => inject(Router).createUrlTree(['/'], { fragment });

export const routes: Routes = [
  { path: '', title: 'MASUMA Internacional', loadComponent: () => import('./pages/home').then(m => m.Home) },
  { path: 'nosotros', redirectTo: toHome('nosotros') },
  { path: 'nosotros/novedades', redirectTo: toHome('nosotros') },
  { path: 'contacto', redirectTo: toHome('contacto') },
  { path: 'productos', pathMatch: 'full', redirectTo: toHome('productos') },
  { path: 'catalogo', title: 'Catálogo | MASUMA', loadComponent: () => import('./pages/catalog').then(m => m.Catalog) },
  { path: 'productos/:slug', loadComponent: () => import('./pages/product').then(m => m.ProductPage) },
  { path: 'favoritos', title: 'Favoritos | MASUMA', canActivate: [authGuard], loadComponent: () => import('./pages/favoritos').then(m => m.Favoritos) },
  { path: 'como-comprar', title: 'Cómo comprar | MASUMA', loadComponent: () => import('./pages/como-comprar').then(m => m.ComoComprar) },
  { path: 'carrito', title: 'Carrito | MASUMA', canActivate: [authGuard], loadComponent: () => import('./pages/cart').then(m => m.Cart) },
  { path: 'legales/:doc', title: 'Legales | MASUMA', loadComponent: () => import('./pages/legales').then(m => m.Legales) },
  { path: 'ingresar', title: 'Ingresar | MASUMA', loadComponent: () => import('./pages/login').then(m => m.Login) },
  { path: 'pago/resultado', title: 'Estado del pago | MASUMA', canActivate: [authGuard], loadComponent: () => import('./pages/pago-resultado').then(m => m.PagoResultado) },
  { path: 'admin', canActivate: [adminGuard], loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES) },
  { path: '**', redirectTo: '' },
];
