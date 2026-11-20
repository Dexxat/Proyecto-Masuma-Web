import { Component, input } from '@angular/core';

/** Avión de contorno (sin relleno ni detalles). Hereda el color del texto (currentColor). */
@Component({
  selector: 'app-plane-icon',
  template: `<svg viewBox="0 0 24 24" [attr.width]="size()" [attr.height]="size()" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M21.5 12 18 10.6H13.5L9.2 3.2H7.4l1.2 7.4H5.2L3.6 7.2H2.2L2.8 12l-.6 4.8h1.4l1.6-3.4h3.4l-1.2 7.4h1.8l4.3-7.4H18z"/></svg>`,
  styles: `:host{display:inline-flex;line-height:0}`,
})
export class PlaneIcon { size = input(24); }

export type SocialName = 'facebook' | 'instagram' | 'linkedin' | 'youtube' | 'whatsapp';

/** Íconos de redes, también de contorno, mismo trazo que el avión. */
@Component({
  selector: 'app-social-icon',
  template: `
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true" focusable="false">
      @switch (name()) {
        @case ('facebook') { <path d="M14 8.5h2.5V5H14a3.5 3.5 0 0 0-3.5 3.5V11H8v3.5h2.5V21H14v-6.5h2.5L17 11h-3V8.5a.5.5 0 0 1 .5-.5z"/> }
        @case ('instagram') { <rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r=".6"/> }
        @case ('linkedin') { <rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M8 10.5V16M8 8v.01M11.5 16v-5.5M11.5 13a2.5 2.5 0 0 1 5 0V16"/> }
        @case ('youtube') { <rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="m10 9.5 5 2.5-5 2.5z"/> }
        @case ('whatsapp') { <path d="M3.5 20.5l1.3-4.2A8.5 8.5 0 1 1 8 19.4z"/><path d="M9 8.6c.2-.5.5-.5.8-.5h.5c.2 0 .4.1.5.4l.7 1.6c.1.3 0 .5-.1.7l-.5.6c-.1.1-.2.3 0 .5a6.3 6.3 0 0 0 2.6 2.4c.2.1.4.1.5-.1l.6-.7c.2-.2.4-.2.6-.1l1.6.8c.3.1.4.3.4.5 0 .6-.3 1.4-1 1.7-.7.4-1.7.4-3-.1a9 9 0 0 1-4.2-3.8c-.8-1.4-.7-2.5-.4-3z"/> }
      }
    </svg>`,
  styles: `:host{display:inline-flex;line-height:0}`,
})
export class SocialIcon { name = input.required<SocialName>(); }

export type UiIconName = 'heart' | 'cart' | 'chevron-left' | 'chevron-right' | 'check' | 'plus';

/** Íconos de interfaz de contorno (mismo trazo que el avión). */
@Component({
  selector: 'app-ui-icon',
  template: `
    <svg viewBox="0 0 24 24" [attr.width]="size()" [attr.height]="size()" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true" focusable="false">
      @switch (name()) {
        @case ('heart') { <path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z"/> }
        @case ('cart') { <path d="M3 4h2.3l2 11h10.2l2-8H6.4"/><circle cx="9" cy="19.2" r="1.3"/><circle cx="16.5" cy="19.2" r="1.3"/> }
        @case ('chevron-left') { <path d="m14.5 5.5-6.5 6.5 6.5 6.5"/> }
        @case ('chevron-right') { <path d="m9.5 5.5 6.5 6.5-6.5 6.5"/> }
        @case ('check') { <path d="m5 12.5 4.5 4.5L19 7.5"/> }
        @case ('plus') { <path d="M12 5v14M5 12h14"/> }
      }
    </svg>`,
  styles: `:host{display:inline-flex;line-height:0}`,
})
export class UiIcon { name = input.required<UiIconName>(); size = input(20); }
