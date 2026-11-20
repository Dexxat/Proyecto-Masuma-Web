import { Component, computed, input } from '@angular/core';

const DOCS: Record<string, string> = { terminos: 'Términos y condiciones', privacidad: 'Política de privacidad' };

@Component({
  selector: 'app-legales',
  template: `<h1>{{ title() }}</h1><p class="muted">Texto legal a cargar: debe ser redactado o aprobado por la empresa (datos personales: Ley 25.326; defensa del consumidor: Ley 24.240).</p>`,
})
export class Legales {
  doc = input.required<string>();
  title = computed(() => DOCS[this.doc()] ?? 'Legales');
}
