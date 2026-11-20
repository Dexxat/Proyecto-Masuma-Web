import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { CartItem } from './models';

/** Carrito persistido en la base (tabla cart_items con RLS): solo existe con sesión iniciada. */
@Injectable({ providedIn: 'root' })
export class CartService {
  private sb = inject(SupabaseService).client;
  private auth = inject(AuthService);
  readonly items = signal<CartItem[]>([]);
  readonly count = computed(() => this.items().reduce((n, i) => n + i.quantity, 0));
  readonly total = computed(() => this.items().reduce((n, i) => n + (i.product?.price_ars ?? 0) * i.quantity, 0));

  constructor() {
    effect(() => { this.auth.user() ? this.load() : this.items.set([]); });
  }
  async load() {
    const { data } = await this.sb.from('cart_items').select('product_id, quantity, product:products(*)');
    this.items.set((data as unknown as CartItem[]) ?? []);
  }
  async add(productId: number, quantity = 1) {
    const user = this.auth.user();
    if (!user) throw new Error('Necesitás iniciar sesión');
    const current = this.items().find(i => i.product_id === productId)?.quantity ?? 0;
    const { error } = await this.sb.from('cart_items')
      .upsert({ user_id: user.id, product_id: productId, quantity: current + quantity });
    if (error) throw error;
    await this.load();
  }
  async remove(productId: number) {
    await this.sb.from('cart_items').delete().eq('product_id', productId);
    await this.load();
  }
  /** El cobro lo inicia una Edge Function que arma el pedido con precios de la base (nunca del navegador). */
  async checkout(provider: 'mercadopago' | 'paypal'): Promise<string> {
    const fn = provider === 'mercadopago' ? 'create-mercadopago-payment' : 'create-paypal-order';
    const { data, error } = await this.sb.functions.invoke(fn);
    if (error) throw await this.toError(error);
    return data.redirect_url as string;
  }
  /** Consulta el estado del pedido (RLS: solo el dueño). El navegador nunca decide si se pagó. */
  async orderStatus(orderId: string): Promise<string | null> {
    const { data } = await this.sb.from('orders').select('status').eq('id', orderId).maybeSingle();
    return data?.status ?? null;
  }
  /** Tras volver de PayPal, el servidor captura el pago. */
  async capturePaypal(orderId: string) {
    const { error } = await this.sb.functions.invoke('capture-paypal-order', { body: { order_id: orderId } });
    if (error) throw await this.toError(error);
  }
  /** Convierte el error de la función en uno con el correlation_id que ve el usuario y se busca en los logs. */
  private async toError(e: any): Promise<Error> {
    try { const b = await e.context.json(); return new Error(`${b.error.message} (código ${b.error.correlation_id})`); } catch { return new Error('Error de pago'); }
  }
}
