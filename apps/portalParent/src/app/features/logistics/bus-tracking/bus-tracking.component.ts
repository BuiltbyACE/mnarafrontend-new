import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-bus-tracking',
  template: `<div class="placeholder"><h2>Bus Tracking</h2><p>Track school bus location</p></div>`,
  styles: [`.placeholder { padding: 24px; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusTrackingComponent {}