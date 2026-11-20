import { Component, inject, input, signal } from '@angular/core';
import { DatePipe, JsonPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService, OrderTrace } from '../core/admin.service';

@Component({
  selector: 'app-admin-order-detail', imports: [DatePipe, JsonPipe, RouterLink],
  template: `
    <a routerLink="/admin/pedidos">← Pedidos</a>
    @if (trace(); as t) {
      <h1>Pedido {{ t.order_id.slice(0, 8) }} <small>({{ t.status }})</small></h1>
      <p>{{ t.provider }} · {{ t.currency }} {{ t.total }} · pago: {{ t.provider_payment_id ?? '—' }} · creado {{ t.created_at | date: 'dd/MM/yyyy HH:mm' }}</p>
      @if (t.failure_reason) { <p role="alert"><b>Motivo:</b> {{ t.failure_reason }}</p> }

      <section class="card">
        <h3>Acciones</h3>
        <button type="button" [disabled]="busy()" (click)="reprocess()">Reprocesar pago (consulta al proveedor)</button>
        @if (t.status === 'paid') { <button type="button" [disabled]="busy()" (click)="setStatus('shipped')">Marcar enviado</button> }
        @if (['pending','failed','review'].includes(t.status)) { <button type="button" [disabled]="busy()" (click)="setStatus('cancelled')">Cancelar</button> }
        @if (msg()) { <p role="status">{{ msg() }}</p> }
      </section>

      <h3>Productos</h3>
      <ul>@for (i of items(); track i.name) { <li>{{ i.quantity }} × {{ i.name }} — {{ i.unit_price }}</li> }</ul>

      <h3>Historial de estados</h3>
      <table><tbody>@for (h of t.history ?? []; track h.at) {
        <tr><td>{{ h.at | date: 'dd/MM HH:mm:ss' }}</td><td>{{ h.from_status ?? '∅' }} → <b>{{ h.to_status }}</b></td><td>{{ h.reason }}</td><td><code>{{ h.correlation_id }}</code></td></tr>
      }</tbody></table>

      <h3>Notificaciones del proveedor</h3>
      <table><tbody>@for (e of t.events ?? []; track e.event_id) {
        <tr [class.warn]="e.outcome === 'error' || !e.signature_ok"><td>{{ e.at | date: 'dd/MM HH:mm:ss' }}</td><td>{{ e.type }}</td><td>{{ e.outcome }}</td>
          <td>{{ e.error }}</td><td><code>{{ e.cid }}</code></td></tr>
      } @empty { <tr><td>Sin notificaciones recibidas.</td></tr> }</tbody></table>

      <h3>Mails</h3>
      <table><tbody>@for (m of t.emails ?? []; track m.at + m.template) {
        <tr [class.warn]="m.status === 'dead'"><td>{{ m.at | date: 'dd/MM HH:mm:ss' }}</td><td>{{ m.template }}</td><td>{{ m.audience }}</td><td>{{ m.status }} ({{ m.attempts }})</td><td>{{ m.error }}</td></tr>
      } @empty { <tr><td>Ninguno.</td></tr> }</tbody></table>

      <h3>Acciones de administradores</h3>
      <table><tbody>@for (a of actions(); track a.at) {
        <tr><td>{{ a.at | date: 'dd/MM HH:mm:ss' }}</td><td>{{ a.action }}</td><td>{{ a.result }}</td><td><code>{{ a.detail | json }}</code></td></tr>
      } @empty { <tr><td>Ninguna.</td></tr> }</tbody></table>
    } @else { <p>Cargando…</p> }`,
  styles: `table{width:100%;border-collapse:collapse;background:var(--surface);font-size:.9rem} td{padding:.4rem;border-bottom:1px solid var(--line)} .warn{background:rgb(194 160 48 / .18)} section button{margin-right:.5rem}`,
})
export class AdminOrderDetail {
  id = input.required<string>();
  private admin = inject(AdminService);
  trace = signal<OrderTrace | null>(null);
  items = signal<{ name: string; unit_price: number; quantity: number }[]>([]);
  actions = signal<{ at: string; action: string; result: string; detail: unknown }[]>([]);
  busy = signal(false); msg = signal('');
  ngOnInit() { this.load(); }
  async load() {
    const d = await this.admin.order(this.id());
    this.trace.set(d.trace); this.items.set(d.items); this.actions.set(d.actions);
  }
  async reprocess() { await this.run(async () => `Resultado: ${await this.admin.reprocess(this.id())}`); }
  async setStatus(s: 'shipped' | 'cancelled') {
    let reason = '';
    if (s === 'cancelled') { reason = window.prompt('Motivo de la cancelación (queda registrado):') ?? ''; if (!reason.trim()) return; }
    await this.run(async () => { await this.admin.setStatus(this.id(), s, s === 'cancelled' ? `cancelado_por_admin: ${reason}` : ''); return 'Estado actualizado'; });
  }
  private async run(fn: () => Promise<string>) {
    this.busy.set(true); this.msg.set('');
    try { this.msg.set(await fn()); await this.load(); } catch (e) { this.msg.set((e as Error).message); } finally { this.busy.set(false); }
  }
}
