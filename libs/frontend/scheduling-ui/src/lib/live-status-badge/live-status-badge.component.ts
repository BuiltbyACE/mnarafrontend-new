import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeacherStatus } from '../models/live-status.model';

const STATUS_CONFIG: Record<TeacherStatus, { label: string; dotClass: string }> = {
  IN_CLASS: { label: 'In Class', dotClass: 'status-in-class' },
  AVAILABLE: { label: 'Available', dotClass: 'status-available' },
  INSTITUTIONAL_BLOCK: { label: 'Institutional', dotClass: 'status-institutional' },
  RESTRICTED: { label: 'Restricted', dotClass: 'status-restricted' },
};

@Component({
  selector: 'sched-live-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="live-badge" [class]="config().dotClass">
      <span class="live-dot">
        <span class="pulse-ring"></span>
      </span>
      <span class="live-label">{{ config().label }}</span>
    </div>
  `,
  styles: [`
    .live-badge { display: inline-flex; align-items: center; gap: 5px; padding: 2px 8px; border-radius: 20px; font-size: 0.6875rem; font-weight: 600; white-space: nowrap; }
    .live-dot { position: relative; width: 7px; height: 7px; border-radius: 50%; display: inline-flex; }
    .pulse-ring { position: absolute; inset: -3px; border-radius: 50%; animation: none; }
    .status-in-class .live-dot { background: #22c55e; }
    .status-in-class .pulse-ring { border: 2px solid #22c55e; animation: pulse 2s ease-out infinite; }
    .status-in-class { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
    .status-available .live-dot { background: #94a3b8; }
    .status-available { background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; }
    .status-institutional .live-dot { background: #8b5cf6; }
    .status-institutional { background: #f5f3ff; color: #6d28d9; border: 1px solid #ddd6fe; }
    .status-restricted .live-dot { background: #f59e0b; }
    .status-restricted { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
    @keyframes pulse { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(2); opacity: 0; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveStatusBadgeComponent {
  readonly status = input.required<TeacherStatus>();

  readonly config = () => STATUS_CONFIG[this.status()] ?? STATUS_CONFIG.AVAILABLE;
}
