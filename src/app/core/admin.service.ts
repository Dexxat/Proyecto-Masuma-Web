import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Product } from './models';

export interface OrderTrace {
  order_id: string; user_id: string; status: string; provider: string | null; provider_ref: string | null; provider_payment_id: string | null;
  total: number; currency: string; created_at: string; paid_at: string | null; failure_reason: string | null;
  history: { from_status: string | null; to_status: string; reason: string | null; correlation_id: string | null; at: string }[] | null;
  events: { at: string; type: string; event_id: string; signature_ok: boolean; outcome: string; error: string | null; cid: string }[] | null;
  emails: { at: string; template: string; audience: string; status: string; attempts: number; error: string | null; sent_at: string | null }[] | null;
}

/** Todas las consultas pasan por RLS: aunque alguien llegue a /admin sin ser admin, la base no le devuelve nada. */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private sb = inject(SupabaseService).client;

  async isAdmin(): Promise<boolean> {
    const { data } = await this.sb.rpc('is_admin');
    return data === true;
  }
  async orders(status?: string): Promise<OrderTrace[]> {
    let q = this.sb.from('payment_trace').select('*').order('created_at', { ascending: false }).limit(100);
    if (status) q = q.eq('status', status);
    const { data, error } = await q;
    if (error) throw error;
    return (data as OrderTrace[]) ?? [];
  }
  async order(id: string) {
    const [trace, items, actions] = await Promise.all([
      this.sb.from('payment_trace').select('*').eq('order_id', id).maybeSingle(),
      this.sb.from('order_items').select('name, unit_price, quantity').eq('order_id', id),
      this.sb.from('admin_actions').select('at, action, result, detail, correlation_id').eq('order_id', id).order('at'),
    ]);
    return { trace: trace.data as OrderTrace | null, items: items.data ?? [], actions: actions.data ?? [] };
  }
  async reprocess(orderId: string): Promise<string> {
    const { data, error } = await this.sb.functions.invoke('admin-reprocess-payment', { body: { order_id: orderId } });
    if (error) throw new Error(await this.message(error));
    return data.result;
  }
  async setStatus(orderId: string, status: 'shipped' | 'cancelled', reason: string) {
    const { error } = await this.sb.rpc('admin_set_order_status', { p_order: orderId, p_status: status, p_reason: reason, p_cid: crypto.randomUUID() });
    if (error) throw new Error(error.message.includes('invalid_order_transition') ? 'Ese cambio de estado no está permitido' : error.message);
    await this.sendEmails();   // el cambio de estado encola el mail; acá se despacha enseguida
  }
  /** Despacha la bandeja de salida ahora (un cron también lo hace cada pocos minutos como respaldo). */
  async sendEmails() { await this.sb.functions.invoke('send-emails'); }
  async products(): Promise<Product[]> {
    const { data, error } = await this.sb.from('products').select('*').order('name');
    if (error) throw error;
    return data ?? [];
  }
  async updateProduct(id: number, patch: Partial<Pick<Product, 'price_ars' | 'stock' | 'active'>> & { price_usd?: number | null }) {
    const { error } = await this.sb.from('products').update(patch).eq('id', id);
    if (error) throw error;
  }
  private async message(e: any): Promise<string> {
    try { const b = await e.context.json(); return `${b.error.message} (código ${b.error.correlation_id})`; } catch { return 'Error'; }
  }
}
