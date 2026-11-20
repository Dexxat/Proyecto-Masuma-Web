import { Component, inject, signal } from '@angular/core';
import { CartService } from '../core/cart.service';

@Component({
  selector: 'app-cart',
  template: `
    <h1>Tu carrito</h1>
    @for (i of cart.items(); track i.product_id) {
      <div class="card">{{ i.product?.name }} × {{ i.quantity }}
        — {{ '$' + ((i.product?.price_ars ?? 0) * i.quantity) }}
        <button type="button" (click)="cart.remove(i.product_id)">Quitar</button></div>
    } @empty { <p>Tu carrito está vacío.</p> }
    @if (cart.count() > 0) {
      <h2>Total: {{ '$' + cart.total() }}</h2>
      <button type="button" (click)="pay('mercadopago')">Pagar con tarjeta (Mercado Pago)</button>
      <button type="button" (click)="pay('paypal')">Pagar con PayPal</button>
      @if (error()) { <p role="alert">{{ error() }}</p> }
    }`,
})
export class Cart {
  cart = inject(CartService); error = signal('');
  async pay(p: 'mercadopago' | 'paypal') {
    try { window.location.href = await this.cart.checkout(p); } catch { this.error.set('No pudimos iniciar el pago. Intentá de nuevo.'); }
  }
}
