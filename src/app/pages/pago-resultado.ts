import { Component, OnDestroy, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CartService } from '../core/cart.service';

/** Pantalla de retorno del pago. Muestra el estado REAL del pedido (leído de la base), no lo que diga la URL. */
@Component({
  selector: 'app-pago-resultado', imports: [RouterLink],
  template: `
    <h1>Estado de tu pago</h1>
    @switch (status()) {
      @case ('paid') { <p role="status">¡Pago confirmado! Te enviamos el detalle por mail.</p><a class="btn" routerLink="/catalogo">Seguir comprando</a> }
      @case ('shipped') { <p role="status">Tu pedido ya fue despachado.</p> }
      @case ('failed') { <p role="alert">El pago fue rechazado. Podés intentar con otro medio.</p><a class="btn" routerLink="/carrito">Volver al carrito</a> }
      @case ('review') { <p role="status">Recibimos tu pago y lo estamos revisando. Te contactaremos a la brevedad.</p> }
      @default { <p role="status">Estamos confirmando tu pago…</p> }
    }
    @if (error()) { <p role="alert">{{ error() }}</p> }
    <small>Pedido {{ orderId }}</small>`,
})
export class PagoResultado implements OnDestroy {
  private cart = inject(CartService);
  readonly orderId = inject(ActivatedRoute).snapshot.queryParamMap.get('order') ?? '';
  private provider = inject(ActivatedRoute).snapshot.queryParamMap.get('provider');
  status = signal<string | null>(null); error = signal('');
  private timer?: ReturnType<typeof setInterval>;

  constructor() { this.start(); }
  private async start() {
    if (!/^[0-9a-f-]{36}$/i.test(this.orderId)) { this.error.set('Pedido inválido'); return; }
    if (this.provider === 'paypal') { try { await this.cart.capturePaypal(this.orderId); } catch (e) { this.error.set((e as Error).message); } }
    // Mercado Pago confirma por webhook: consultamos el estado cada 3 s (hasta 2 min) hasta que cambie.
    let tries = 0;
    const tick = async () => {
      const s = await this.cart.orderStatus(this.orderId); this.status.set(s);
      if ((s && s !== 'pending') || ++tries > 40) clearInterval(this.timer);
    };
    await tick(); this.timer = setInterval(tick, 3000);
  }
  ngOnDestroy() { clearInterval(this.timer); }
}
