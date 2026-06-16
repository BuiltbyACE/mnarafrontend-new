import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { TripStatus } from '../../../../shared/models/transport.models';

@Component({
  selector: 'app-trip-status-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="status-indicator" [class]="status().toLowerCase()">
      <span class="status-dot" [class.pulsing]="status() === 'ON_ROUTE'"></span>
      <span class="status-label">{{ displayText() }}</span>
    </div>
  `,
  styles: [`
    .status-indicator {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 14px; border-radius: 20px; font-size: 0.7rem;
      font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .status-indicator.scheduled { background: #1e293b; color: #94a3b8; }
    .status-indicator.on_route { background: #052e16; color: #4ade80; }
    .status-indicator.completed { background: #1e3a5f; color: #60a5fa; }
    .status-indicator.cancelled { background: #1e1b1b; color: #6b7280; }
    .status-indicator.emergency_stop { background: #450a0a; color: #f87171; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
    .status-dot.pulsing { animation: pulse 1.5s infinite; }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(74,222,128,0.6); }
      70% { box-shadow: 0 0 0 8px rgba(74,222,128,0); }
      100% { box-shadow: 0 0 0 0 rgba(74,222,128,0); }
    }
  `],
})
export class TripStatusIndicatorComponent {
  readonly status = input<TripStatus>('SCHEDULED');

  readonly displayText = computed(() => {
    const s = this.status();
    switch (s) {
      case 'ON_ROUTE': return 'On Route';
      case 'EMERGENCY_STOP': return 'Emergency Stop';
      default: return s.charAt(0) + s.slice(1).toLowerCase();
    }
  });
}
