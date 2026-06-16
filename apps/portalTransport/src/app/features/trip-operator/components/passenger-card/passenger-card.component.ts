import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { TripManifest } from '../../../../shared/models/transport.models';
import { 
  CheckIcon, 
  MapPinIcon,
  ArrowDownIcon 
} from '../../../../shared/components/icons/lucide-icons';

/**
 * Passenger Card Component
 * 
 * Large, highly click-optimized interface for marking passengers as boarded/alighted.
 * Designed for 7-inch tablets with gloved hands in a moving vehicle.
 * 
 * Features:
 * - Large touch targets (minimum 48px, ideally 56px+)
 * - Clear visual state indicators
 * - Color-coded status (Pending, Boarded, Alighted)
 * - Accessibility optimized with ARIA labels
 */
@Component({
  selector: 'app-passenger-card',
  standalone: true,
  imports: [CommonModule, CheckIcon, MapPinIcon, ArrowDownIcon],
  template: `
    <div 
      class="passenger-card" 
      [class.boarded]="passenger().boarded && !passenger().alighted"
      [class.alighted]="passenger().alighted"
      [class.pending]="!passenger().boarded && !passenger().alighted"
      role="article"
      [attr.aria-label]="ariaLabel()"
    >
      <!-- Avatar Section -->
      <div class="passenger-avatar" aria-hidden="true">
        <span class="avatar-text">{{ initials() }}</span>
      </div>

      <!-- Info Section -->
      <div class="passenger-info">
        <div class="passenger-name">{{ passenger().student_name }}</div>
        <div class="passenger-meta">
          <span class="meta-item stop-info">
            <icon-map-pin [size]="14" />
            <span>{{ passenger().stop_name }}</span>
          </span>
          <span class="status-badge" [class]="statusClass()">
            {{ statusText() }}
          </span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="passenger-actions">
        @if (canBoard() && !passenger().boarded) {
          <button
            type="button"
            class="action-btn board-btn"
            (click)="onBoarded()"
            [attr.aria-label]="'Mark ' + passenger().student_name + ' as boarded'"
          >
            <icon-check [size]="24" />
            <span>Board</span>
          </button>
        }

        @if (canAlight() && passenger().boarded && !passenger().alighted) {
          <button
            type="button"
            class="action-btn alight-btn"
            (click)="onAlighted()"
            [attr.aria-label]="'Mark ' + passenger().student_name + ' as alighted'"
          >
            <icon-arrow-down [size]="24" />
            <span>Drop</span>
          </button>
        }

        @if (passenger().alighted) {
          <div class="completed-indicator" aria-hidden="true">
            <icon-check [size]="28" />
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .passenger-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 16px;
      background: #1E293B;
      border: 2px solid #334155;
      border-radius: 12px;
      transition: all 200ms ease;
      position: relative;
    }

    /* Status States */
    .passenger-card.pending {
      border-color: #334155;
      background: #1E293B;
    }

    .passenger-card.boarded {
      border-color: #16A34A;
      background: linear-gradient(135deg, #14532D 0%, #166534 100%);
    }

    .passenger-card.alighted {
      border-color: #0369A1;
      background: linear-gradient(135deg, #0C4A6E 0%, #075985 100%);
      opacity: 0.85;
    }

    /* Avatar */
    .passenger-avatar {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: #334155;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      border: 2px solid #475569;
    }

    .boarded .passenger-avatar {
      background: #166534;
      border-color: #22C55E;
    }

    .alighted .passenger-avatar {
      background: #075985;
      border-color: #0EA5E9;
    }

    .avatar-text {
      font-family: 'Fira Code', monospace;
      font-size: 1.125rem;
      font-weight: 700;
      color: #CBD5E1;
    }

    .boarded .avatar-text {
      color: #86EFAC;
    }

    .alighted .avatar-text {
      color: #7DD3FC;
    }

    /* Info Section */
    .passenger-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .passenger-name {
      font-family: 'Fira Sans', sans-serif;
      font-size: 1rem;
      font-weight: 600;
      color: #F8FAFC;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .passenger-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      color: #94A3B8;
    }

    .meta-item icon-map-pin {
      color: #F59E0B;
    }

    /* Status Badge */
    .status-badge {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .status-badge.pending {
      background: #451A03;
      color: #FBBF24;
    }

    .status-badge.boarded {
      background: #14532D;
      color: #86EFAC;
    }

    .status-badge.alighted {
      background: #0C4A6E;
      color: #7DD3FC;
    }

    /* Action Buttons */
    .passenger-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .action-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      min-width: 72px;
      min-height: 64px;
      padding: 8px 12px;
      border: none;
      border-radius: 10px;
      font-family: 'Fira Sans', sans-serif;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      cursor: pointer;
      transition: all 150ms ease;
      touch-action: manipulation;
    }

    .action-btn:active {
      transform: scale(0.96);
    }

    /* Board Button */
    .board-btn {
      background: linear-gradient(135deg, #16A34A 0%, #22C55E 100%);
      color: white;
      box-shadow: 0 4px 6px rgba(34, 197, 94, 0.3);
    }

    .board-btn:hover {
      background: linear-gradient(135deg, #15803D 0%, #16A34A 100%);
      box-shadow: 0 6px 8px rgba(34, 197, 94, 0.4);
    }

    .board-btn:active {
      box-shadow: 0 2px 4px rgba(34, 197, 94, 0.3);
    }

    /* Alight Button */
    .alight-btn {
      background: linear-gradient(135deg, #0369A1 0%, #0EA5E9 100%);
      color: white;
      box-shadow: 0 4px 6px rgba(3, 105, 161, 0.3);
    }

    .alight-btn:hover {
      background: linear-gradient(135deg, #075985 0%, #0369A1 100%);
      box-shadow: 0 6px 8px rgba(3, 105, 161, 0.4);
    }

    .alight-btn:active {
      box-shadow: 0 2px 4px rgba(3, 105, 161, 0.3);
    }

    /* Completed Indicator */
    .completed-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 64px;
      height: 64px;
      color: #7DD3FC;
    }

    /* Responsive adjustments */
    @media (max-width: 480px) {
      .passenger-card {
        padding: 12px;
        gap: 10px;
      }

      .passenger-avatar {
        width: 44px;
        height: 44px;
      }

      .avatar-text {
        font-size: 0.875rem;
      }

      .action-btn {
        min-width: 60px;
        min-height: 56px;
        padding: 6px 8px;
      }

      .passenger-name {
        font-size: 0.875rem;
      }
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .passenger-card,
      .action-btn {
        transition: none;
      }

      .action-btn:active {
        transform: none;
      }
    }
  `],
})
export class PassengerCardComponent {
  readonly passenger = input.required<TripManifest>();
  readonly canBoard = input(true);
  readonly canAlight = input(true);

  readonly boarded = output<number>();
  readonly alighted = output<number>();

  readonly initials = computed(() => {
    const name = this.passenger().student_name || '';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  });

  readonly statusText = computed(() => {
    const p = this.passenger();
    if (p.alighted) return 'Completed';
    if (p.boarded) return 'Onboard';
    return 'Awaiting';
  });

  readonly statusClass = computed(() => {
    const p = this.passenger();
    if (p.alighted) return 'alighted';
    if (p.boarded) return 'boarded';
    return 'pending';
  });

  readonly ariaLabel = computed(() => {
    const p = this.passenger();
    let label = `Passenger: ${p.student_name}`;
    if (p.alighted) {
      label += ', status: journey completed';
    } else if (p.boarded) {
      label += ', status: onboard';
    } else {
      label += ', status: awaiting pickup';
    }
    return label;
  });

  onBoarded(): void {
    this.boarded.emit(this.passenger().id);
  }

  onAlighted(): void {
    this.alighted.emit(this.passenger().id);
  }
}
