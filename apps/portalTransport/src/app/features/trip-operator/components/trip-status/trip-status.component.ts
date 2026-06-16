import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { TripStatus } from '../../../../shared/models/transport.models';
import { ClockIcon, PlayIcon, SquareIcon, AlertTriangleIcon, CheckCircleIcon } from '../../../../shared/components/icons/lucide-icons';

/**
 * Trip Status Indicator
 * 
 * Color-coded status display for vehicle dashboard visibility:
 * - SCHEDULED: Gray/Blue - Awaiting departure
 * - ON_ROUTE: Green with pulse - Active trip, GPS streaming
 * - COMPLETED: Blue - Trip finished
 * - CANCELLED: Gray - Trip cancelled
 * - EMERGENCY_STOP: Red with alert - Emergency situation
 */
@Component({
  selector: 'app-trip-status',
  standalone: true,
  imports: [CommonModule, ClockIcon, PlayIcon, SquareIcon, AlertTriangleIcon, CheckCircleIcon],
  template: `
    <div class="status-container" [class]="statusClass()" role="status" [attr.aria-label]="ariaLabel()">
      <div class="status-icon">
        @switch (status()) {
          @case ('SCHEDULED') { <icon-clock [size]="20" /> }
          @case ('ON_ROUTE') { <icon-play [size]="20" /> }
          @case ('COMPLETED') { <icon-check-circle [size]="20" /> }
          @case ('CANCELLED') { <icon-square [size]="18" /> }
          @case ('EMERGENCY_STOP') { <icon-alert-triangle [size]="20" /> }
        }
      </div>
      <span class="status-text">{{ displayText() }}</span>
      @if (status() === 'ON_ROUTE') {
        <div class="status-pulse" aria-hidden="true"></div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
    }

    .status-container {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 24px;
      font-family: 'Fira Sans', sans-serif;
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      position: relative;
      overflow: hidden;
      border: 2px solid transparent;
      transition: all 200ms ease;
    }

    .status-icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Status: SCHEDULED */
    .status-scheduled {
      background: rgba(148, 163, 184, 0.15);
      border-color: rgba(148, 163, 184, 0.3);
      color: #94A3B8;
    }

    /* Status: ON_ROUTE - Green with pulse animation */
    .status-on-route {
      background: rgba(34, 197, 94, 0.15);
      border-color: rgba(34, 197, 94, 0.5);
      color: #22C55E;
    }

    .status-pulse {
      position: absolute;
      right: 8px;
      width: 8px;
      height: 8px;
      background: #22C55E;
      border-radius: 50%;
      animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    @keyframes pulse-ring {
      0% {
        transform: scale(1);
        opacity: 1;
        box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
      }
      70% {
        transform: scale(1);
        opacity: 1;
        box-shadow: 0 0 0 10px rgba(34, 197, 94, 0);
      }
      100% {
        transform: scale(1);
        opacity: 1;
        box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
      }
    }

    /* Status: COMPLETED */
    .status-completed {
      background: rgba(3, 105, 161, 0.15);
      border-color: rgba(3, 105, 161, 0.5);
      color: #0EA5E9;
    }

    /* Status: CANCELLED */
    .status-cancelled {
      background: rgba(100, 116, 139, 0.15);
      border-color: rgba(100, 116, 139, 0.3);
      color: #64748B;
    }

    /* Status: EMERGENCY_STOP - Red with alert */
    .status-emergency-stop {
      background: rgba(239, 68, 68, 0.2);
      border-color: rgba(239, 68, 68, 0.6);
      color: #EF4444;
      animation: emergency-pulse 1s ease-in-out infinite;
    }

    @keyframes emergency-pulse {
      0%, 100% {
        border-color: rgba(239, 68, 68, 0.6);
        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
      }
      50% {
        border-color: rgba(239, 68, 68, 1);
        box-shadow: 0 0 15px 5px rgba(239, 68, 68, 0.3);
      }
    }

    .status-emergency-stop .status-text {
      font-weight: 700;
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .status-pulse,
      .status-emergency-stop {
        animation: none;
      }
    }

    /* Touch optimization for tablet */
    @media (pointer: coarse) {
      .status-container {
        padding: 10px 18px;
        font-size: 1rem;
      }
    }
  `],
})
export class TripStatusComponent {
  readonly status = input<TripStatus>('SCHEDULED');

  readonly displayText = computed(() => {
    const s = this.status();
    switch (s) {
      case 'ON_ROUTE': return 'Active';
      case 'EMERGENCY_STOP': return 'Emergency';
      default: return s.replace('_', ' ');
    }
  });

  readonly statusClass = computed(() => {
    return `status-${this.status().toLowerCase()}`;
  });

  readonly ariaLabel = computed(() => {
    return `Trip status: ${this.displayText()}`;
  });
}
