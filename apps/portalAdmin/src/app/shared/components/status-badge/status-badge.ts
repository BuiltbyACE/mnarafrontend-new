/**
 * Status Badge Component
 * Displays colored badges for different entity statuses
 */

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeType = 
  | 'active' 
  | 'inactive' 
  | 'archived' 
  | 'pending' 
  | 'approved' 
  | 'rejected'
  | 'paid'
  | 'arrears'
  | 'overpaid'
  | 'critical'
  | 'warning'
  | 'info'
  | 'in-transit'
  | 'idle'
  | 'stopped';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="status-badge" [ngClass]="badgeClass">
      {{ label }}
    </span>
  `,
  styles: [`
    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    // Status colors
    .badge-active, .badge-approved, .badge-paid, .badge-in-transit {
      background-color: #dcfce7;
      color: #166534;
    }

    .badge-inactive, .badge-archived, .badge-idle, .badge-stopped {
      background-color: #f3f4f6;
      color: #6b7280;
    }

    .badge-pending {
      background-color: #fef3c7;
      color: #92400e;
    }

    .badge-rejected, .badge-critical {
      background-color: #fee2e2;
      color: #991b1b;
    }

    .badge-arrears {
      background-color: #fee2e2;
      color: #dc2626;
    }

    .badge-overpaid {
      background-color: #dbeafe;
      color: #1d4ed8;
    }

    .badge-warning {
      background-color: #ffedd5;
      color: #c2410c;
    }

    .badge-info {
      background-color: #e0f2fe;
      color: #0369a1;
    }
  `],
})
export class StatusBadgeComponent {
  @Input() type: BadgeType = 'active';
  @Input() customLabel?: string;

  get badgeClass(): string {
    return `badge-${this.type}`;
  }

  get label(): string {
    if (this.customLabel) return this.customLabel;
    
    // Default labels
    const labels: Record<BadgeType, string> = {
      'active': 'Active',
      'inactive': 'Inactive',
      'archived': 'Archived',
      'pending': 'Pending',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'paid': 'Paid',
      'arrears': 'Arrears',
      'overpaid': 'Overpaid',
      'critical': 'Critical',
      'warning': 'Warning',
      'info': 'Info',
      'in-transit': 'In Transit',
      'idle': 'Idle',
      'stopped': 'Stopped',
    };
    
    return labels[this.type] || this.type;
  }
}
