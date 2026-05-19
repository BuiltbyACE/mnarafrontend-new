import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-broadcasts',
  template: `<div class="placeholder"><h2>Broadcasts</h2><p>View school broadcasts and messages</p></div>`,
  styles: [`.placeholder { padding: 24px; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BroadcastsComponent {}