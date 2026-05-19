import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-receipts',
  template: `<div class="placeholder"><h2>Receipts</h2><p>View payment receipts</p></div>`,
  styles: [`.placeholder { padding: 24px; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReceiptsComponent {}