import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { TripManifest } from '../../../../shared/models/transport.models';

@Component({
  selector: 'app-passenger-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="passenger-card" [class.completed]="passenger().alighted" [class.boarded]="passenger().boarded && !passenger().alighted">
      <div class="passenger-avatar">{{ initials() }}</div>
      <div class="passenger-info">
        <div class="passenger-name">{{ passenger().student_name }}</div>
        <div class="passenger-meta">
          <span class="stop-label">Stop: {{ passenger().stop_name }}</span>
          <span class="status-label" [class]="statusClass()">{{ statusText() }}</span>
        </div>
      </div>
      <div class="passenger-actions">
        @if (canBoard() && !passenger().boarded) {
          <button class="action-chip board" (click)="boarded.emit(passenger().id)">
            &#10003; Board
          </button>
        }
        @if (canAlight() && passenger().boarded && !passenger().alighted) {
          <button class="action-chip alight" (click)="droppedOff.emit(passenger().id)">
            &#10003; Drop
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .passenger-card {
      display: flex; align-items: center; gap: 12px;
      padding: 12px; background: #1e293b; border-radius: 12px;
      border: 1px solid #334155; transition: border-color 0.2s;
    }
    .passenger-card.boarded { border-color: #166534; background: #052e16; }
    .passenger-card.completed { border-color: #1e3a5f; background: #0f172a; opacity: 0.6; }
    .passenger-avatar {
      width: 40px; height: 40px; border-radius: 50%;
      background: #334155; color: #94a3b8; font-size: 0.8rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .passenger-info { flex: 1; min-width: 0; }
    .passenger-name { font-size: 0.9rem; font-weight: 600; color: #f1f5f9; }
    .passenger-meta { display: flex; gap: 8px; align-items: center; margin-top: 2px; }
    .stop-label { font-size: 0.7rem; color: #94a3b8; }
    .status-label { font-size: 0.6rem; font-weight: 600; padding: 2px 8px; border-radius: 8px; text-transform: uppercase; }
    .status-label.pending { background: #451a03; color: #fbbf24; }
    .status-label.boarded { background: #052e16; color: #4ade80; }
    .status-label.alighted { background: #1e3a5f; color: #60a5fa; }
    .passenger-actions { display: flex; gap: 4px; flex-shrink: 0; }
    .action-chip {
      padding: 8px 14px; font-size: 0.75rem; font-weight: 700; border: none;
      border-radius: 8px; cursor: pointer; min-height: 36px; min-width: 60px;
      transition: opacity 0.15s;
    }
    .action-chip:active { opacity: 0.6; }
    .action-chip.board { background: #16a34a; color: #fff; }
    .action-chip.alight { background: #2563eb; color: #fff; }
  `],
})
export class PassengerItemComponent {
  readonly passenger = input.required<TripManifest>();
  readonly canBoard = input(false);
  readonly canAlight = input(false);

  readonly boarded = output<number>();
  readonly droppedOff = output<number>();

  readonly initials = computed(() => {
    const name = this.passenger().student_name || '';
    const parts = name.split(' ');
    return parts.map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  });

  readonly statusClass = computed(() => {
    const p = this.passenger();
    if (p.alighted) return 'alighted';
    if (p.boarded) return 'boarded';
    return 'pending';
  });

  readonly statusText = computed(() => {
    const p = this.passenger();
    if (p.alighted) return 'Dropped';
    if (p.boarded) return 'Boarded';
    return 'Pending';
  });
}
