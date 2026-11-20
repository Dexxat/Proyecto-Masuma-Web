import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminService } from '../core/admin.service';
import { Product } from '../core/models';

@Component({
  selector: 'app-admin-products', imports: [RouterLink],
  template: `
    <a routerLink="/admin/pedidos">← Pedidos</a>
    <h1>Productos</h1>
    <p>Dejá el precio vacío para mostrar "Consultar precio". El precio en USD se usa solo para PayPal.</p>
    @if (msg()) { <p role="status">{{ msg() }}</p> }
    <table>
      <thead><tr><th>Producto</th><th>Precio ARS</th><th>Precio USD</th><th>Stock</th><th>Activo</th><th></th></tr></thead>
      <tbody>
        @for (p of products(); track p.id) {
          <tr>
            <td>{{ p.name }}</td>
            <td><input #ars type="number" min="0" step="0.01" [value]="p.price_ars ?? ''" /></td>
            <td><input #usd type="number" min="0" step="0.01" [value]="p.price_usd ?? ''" /></td>
            <td><input #stock type="number" min="0" step="1" [value]="p.stock" /></td>
            <td><input #act type="checkbox" [checked]="p.active" /></td>
            <td><button type="button" (click)="save(p, ars.value, usd.value, stock.value, act.checked)">Guardar</button></td>
          </tr>
        }
      </tbody>
    </table>`,
  styles: `table{width:100%;border-collapse:collapse;background:var(--surface)} th,td{padding:.4rem;border-bottom:1px solid var(--line);text-align:left} td input{margin:0;max-width:110px}`,
})
export class AdminProducts {
  private admin = inject(AdminService);
  products = signal<(Product & { price_usd?: number | null })[]>([]); msg = signal('');
  constructor() { this.admin.products().then(p => this.products.set(p)); }
  async save(p: Product, ars: string, usd: string, stock: string, active: boolean) {
    const num = (v: string) => (v.trim() === '' ? null : Number(v));
    const a = num(ars), u = num(usd), s = Number(stock);
    if ([a, u].some(v => v !== null && (!Number.isFinite(v) || v < 0)) || !Number.isInteger(s) || s < 0) { this.msg.set('Revisá los valores: no pueden ser negativos.'); return; }
    try { await this.admin.updateProduct(p.id, { price_ars: a, price_usd: u, stock: s, active }); this.msg.set(`${p.name}: guardado`); }
    catch { this.msg.set('No se pudo guardar'); }
  }
}
