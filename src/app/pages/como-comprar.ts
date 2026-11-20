import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-como-comprar', imports: [RouterLink],
  template: `
    <h1>¿Cómo comprar?</h1>
    <ol>
      <li><a routerLink="/ingresar">Creá tu cuenta</a> o iniciá sesión: el carrito es personal.</li>
      <li>Elegí tus productos en el <a routerLink="/catalogo">catálogo</a> y agregalos al carrito. Si un producto dice «Consultar precio», escribinos.</li>
      <li>Revisá tu <a routerLink="/carrito">carrito</a> y elegí cómo pagar: tarjeta (Mercado Pago) o PayPal.</li>
      <li>Pagás en el sitio del medio de pago: MASUMA nunca ve los datos de tu tarjeta. Te enviamos la confirmación por mail.</li>
    </ol>
    <p class="muted">Envíos, plazos y costos: a completar con la información de la empresa.</p>
    <section class="block" id="arrepentimiento"><h2>Arrepentimiento de compra</h2>
      <p class="muted">Procedimiento de arrepentimiento (obligatorio por ley): texto y formulario a cargar con la información de la empresa.</p></section>`,
})
export class ComoComprar {}
