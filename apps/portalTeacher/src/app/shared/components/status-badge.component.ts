import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  imports: [NgClass],
  template: `
    <span class="badge" [ngClass]="variant">
      {{ label }}
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex; align-items: center;
      padding: 3px 10px; border-radius: 100px;
      font-size: 0.75rem; font-weight: 500;
      font-family: 'Inter', sans-serif;
      white-space: nowrap;
    }
    .success { background: #dcfce7; color: #166534; }
    .warning { background: #fef3c7; color: #92400e; }
    .error { background: #fee2e2; color: #991b1b; }
    .info { background: #dbeafe; color: #1d4ed8; }
    .neutral { background: #f3f4f6; color: #6b7280; }
    .purple { background: #ede9fe; color: #5b21b6; }
    .orange { background: #ffedd5; color: #c2410c; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadgeComponent {
  @Input() label = '';
  @Input() variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'purple' | 'orange' = 'neutral';
}
