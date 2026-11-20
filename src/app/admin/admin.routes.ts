import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'pedidos' },
  { path: 'pedidos', title: 'Pedidos | Admin', loadComponent: () => import('./orders').then(m => m.AdminOrders) },
  { path: 'pedidos/:id', title: 'Pedido | Admin', loadComponent: () => import('./order-detail').then(m => m.AdminOrderDetail) },
  { path: 'productos', title: 'Productos | Admin', loadComponent: () => import('./products').then(m => m.AdminProducts) },
];
