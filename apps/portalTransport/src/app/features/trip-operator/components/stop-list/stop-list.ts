import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { RouteStop } from '../../../../shared/models/transport.models';

@Component({
  selector: 'app-stop-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stop-list">
      @for (stop of stops(); track stop.id; let last = $last) {
        <div class="stop-item">
          <div class="stop-marker">
            <div class="stop-dot" [class.last]="last"></div>
            @if (!last) { <div class="stop-line"></div> }
          </div>
          <div class="stop-content">
            <span class="stop-name">{{ stop.name }}</span>
            <span class="stop-order">Stop {{ stop.order }}</span>
          </div>
        </div>
      } @empty {
        <div class="no-stops">No stops defined for this route</div>
      }
    </div>
  `,
  styles: [`
    .stop-list { display: flex; flex-direction: column; gap: 0; }
    .stop-item { display: flex; gap: 12px; min-height: 44px; }
    .stop-marker { display: flex; flex-direction: column; align-items: center; width: 20px; flex-shrink: 0; padding-top: 6px; }
    .stop-dot {
      width: 12px; height: 12px; border-radius: 50%; background: #3b82f6;
      border: 2px solid #1e293b; flex-shrink: 0; z-index: 1;
    }
    .stop-dot.last { background: #22c55e; }
    .stop-line {
      width: 2px; flex: 1; background: #334155; min-height: 24px;
    }
    .stop-content {
      display: flex; align-items: center; gap: 8px; padding: 4px 0;
    }
    .stop-name { font-size: 0.85rem; font-weight: 500; color: #e2e8f0; }
    .stop-order { font-size: 0.65rem; color: #64748b; font-weight: 600; }
    .no-stops { padding: 12px; color: #64748b; font-size: 0.75rem; text-align: center; }
  `],
})
export class StopListComponent {
  readonly stops = input<RouteStop[]>([]);
}
