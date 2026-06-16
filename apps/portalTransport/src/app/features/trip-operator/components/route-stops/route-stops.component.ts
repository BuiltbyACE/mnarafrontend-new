import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { RouteStop } from '../../../../shared/models/transport.models';
import { MapPinIcon, NavigationIcon, CheckIcon } from '../../../../shared/components/icons/lucide-icons';

/**
 * Route Stops Component
 * 
 * Sequential vertical timeline showing all stops on the route.
 * Optimized for quick scanning by conductors during active trips.
 * 
 * Features:
 * - Vertical timeline with connecting line
 * - Current stop highlighting
 * - Completed stops marked
 * - Upcoming stops clearly visible
 */
@Component({
  selector: 'app-route-stops',
  standalone: true,
  imports: [CommonModule, MapPinIcon, NavigationIcon, CheckIcon],
  template: `
    <div class="stops-container" role="list" [attr.aria-label]="'Route stops for ' + routeName()">
      @for (stop of stops(); track stop.id; let index = $index; let first = $first; let last = $last) {
        <div 
          class="stop-item"
          [class.current]="isCurrentStop(stop)"
          [class.completed]="isCompleted(stop)"
          [class.upcoming]="isUpcoming(stop)"
          role="listitem"
          [attr.aria-current]="isCurrentStop(stop) ? 'true' : null"
        >
          <!-- Timeline Line -->
          @if (!last) {
            <div class="timeline-line" aria-hidden="true"></div>
          }

          <!-- Stop Marker -->
          <div class="stop-marker" aria-hidden="true">
            @if (isCompleted(stop)) {
              <div class="marker-completed">
                <icon-check [size]="14" />
              </div>
            } @else if (isCurrentStop(stop)) {
              <div class="marker-current">
                <icon-navigation [size]="16" />
              </div>
            } @else {
              <div class="marker-upcoming">
                <span class="stop-number">{{ index + 1 }}</span>
              </div>
            }
          </div>

          <!-- Stop Content -->
          <div class="stop-content">
            <div class="stop-name">{{ stop.name }}</div>
            <div class="stop-meta">
              @if (isCurrentStop(stop)) {
                <span class="current-badge">Current</span>
              }
              <span class="stop-order">Stop {{ stop.order }}</span>
            </div>
          </div>
        </div>
      } @empty {
        <div class="empty-state" role="status">
          <icon-map-pin [size]="32" />
          <span>No stops defined for this route</span>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .stops-container {
      display: flex;
      flex-direction: column;
      gap: 0;
      padding: 8px 0;
    }

    .stop-item {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 12px 0;
      position: relative;
      min-height: 64px;
    }

    /* Timeline Line */
    .timeline-line {
      position: absolute;
      left: 20px;
      top: 44px;
      width: 3px;
      height: calc(100% - 24px);
      background: #334155;
      border-radius: 2px;
    }

    .stop-item.completed .timeline-line {
      background: #16A34A;
    }

    /* Stop Marker */
    .stop-marker {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      z-index: 1;
    }

    .marker-completed {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: #166534;
      border: 3px solid #22C55E;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #86EFAC;
    }

    .marker-current {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: #075985;
      border: 3px solid #0EA5E9;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #7DD3FC;
      animation: current-pulse 2s ease-in-out infinite;
    }

    @keyframes current-pulse {
      0%, 100% {
        box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.4);
      }
      50% {
        box-shadow: 0 0 0 8px rgba(14, 165, 233, 0);
      }
    }

    .marker-upcoming {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: #1E293B;
      border: 3px solid #475569;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stop-number {
      font-family: 'Fira Code', monospace;
      font-size: 0.875rem;
      font-weight: 700;
      color: #94A3B8;
    }

    /* Stop Content */
    .stop-content {
      flex: 1;
      padding-top: 8px;
      min-width: 0;
    }

    .stop-name {
      font-family: 'Fira Sans', sans-serif;
      font-size: 0.9375rem;
      font-weight: 600;
      color: #F8FAFC;
      margin-bottom: 4px;
    }

    .stop-item.current .stop-name {
      color: #7DD3FC;
      font-size: 1.0625rem;
    }

    .stop-item.completed .stop-name {
      color: #86EFAC;
    }

    .stop-item.upcoming .stop-name {
      color: #CBD5E1;
    }

    .stop-meta {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .current-badge {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 2px 8px;
      background: #0C4A6E;
      color: #7DD3FC;
      border-radius: 4px;
    }

    .stop-order {
      font-size: 0.75rem;
      color: #64748B;
    }

    .stop-item.completed .stop-order {
      color: #22C55E;
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 32px 16px;
      color: #64748B;
      text-align: center;
    }

    .empty-state icon-map-pin {
      opacity: 0.5;
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .marker-current {
        animation: none;
      }
    }

    /* Touch optimization */
    @media (pointer: coarse) {
      .stop-item {
        min-height: 72px;
        padding: 16px 0;
      }

      .stop-marker {
        width: 48px;
        height: 48px;
      }

      .stop-name {
        font-size: 1rem;
      }
    }
  `],
})
export class RouteStopsComponent {
  readonly stops = input<RouteStop[]>([]);
  readonly currentStopId = input<number | null>(null);
  readonly completedStopIds = input<number[]>([]);
  readonly routeName = input('Route');

  readonly sortedStops = computed(() => {
    return [...this.stops()].sort((a, b) => a.order - b.order);
  });

  isCurrentStop(stop: RouteStop): boolean {
    return this.currentStopId() === stop.id;
  }

  isCompleted(stop: RouteStop): boolean {
    return this.completedStopIds().includes(stop.id);
  }

  isUpcoming(stop: RouteStop): boolean {
    return !this.isCurrentStop(stop) && !this.isCompleted(stop);
  }
}
