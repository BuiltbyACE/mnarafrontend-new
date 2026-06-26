import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RealtimeService } from '../core/services/realtime.service';

@Component({
  selector: 'app-portalStudent-entry',
  template: `<router-outlet />`,
  imports: [RouterOutlet],
})
export class RemoteEntry {
  constructor() {
    inject(RealtimeService).connect();
  }
}
