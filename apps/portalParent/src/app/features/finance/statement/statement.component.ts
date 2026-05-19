import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-statement',
  template: `<div class="placeholder"><h2>Fee Statement</h2><p>View fee balance and payment history</p></div>`,
  styles: [`.placeholder { padding: 24px; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatementComponent {}