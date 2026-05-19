import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-pay-now',
  template: `<div class="placeholder"><h2>Pay Now</h2><p>Make secure fee payments</p></div>`,
  styles: [`.placeholder { padding: 24px; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PayNowComponent {}