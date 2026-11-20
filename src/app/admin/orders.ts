import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService, OrderTrace } from '../core/admin.service';

@Component({
  selector: 'app-admin-orders', imports: [RouterLink, DatePipe],
  template: `
    <h1>Pedidos</h1>
    <nav class="tabs">
      <a routerLink="/admin/productos">Productos</a>
      @for (s of statuses; track s) { <button type="button" [class.on]="filter() === s" (click)="load(s)">{{ s || 'todos' }}</button> }
    </nav>
    @if (error()) { <p role="alert">{{ error() }}</p> }
    <table>
      <thead><tr><th>Fecha</th><th>Estado</th><th>Medio</th><th>Total</th><th>Motivo</th><th></th></tr></thead>
      <tbody>
        @for (o of orders(); track o.order_id) {
          <tr [class.warn]="o.status === 'review'">
            <td>{{ o.created_at | date: 'dd/MM HH:mm' }}</td><td><b>{{ o.status }}</b></td><td>{{ o.provider }}</td>
            <td>{{ o.currency }} {{ o.total }}</td><td>{{ o.failure_reason }}</td>
            <td><a [routerLink]="['/admin/pedidos', o.order_id]">Ver</a></td>
          </tr>
        } @empty { <tr><td colspan="6">Sin pedidos.</td></tr> }
      </tbody>
    </table>`,
  styles: `table{width:100%;border-collapse:collapse;background:var(--surface)} th,td{padding:.5rem;border-bottom:1px solid var(--line);text-align:left}
    .warn{background:rgb(194 160 48 / .18)} .tabs{display:flex;gap:.5rem;margin-bottom:1rem;align-items:center} .tabs button{background:var(--surface);color:var(--ink);border:1px solid var(--line)} .tabs .on{background:var(--brand);color:var(--on-brand)}`,
})
export class AdminOrders {
  private admin = inject(AdminService);
  readonly statuses = ['', 'review', 'pending', 'paid', 'shipped', 'failed', 'cancelled'];
  orders = signal<OrderTrace[]>([]); filter = signal(''); error = signal('');
  constructor() { this.load(''); }
  async load(status: string) {
    this.filter.set(status); this.error.set('');
    try { this.orders.set(await this.admin.orders(status || undefined)); } catch { this.error.set('No se pudieron cargar los pedidos'); }
  }
}
