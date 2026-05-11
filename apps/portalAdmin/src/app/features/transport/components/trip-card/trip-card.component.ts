import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import type { DailyTrip, FleetTelemetry } from '../../../../shared/models/transport.models';

@Component({
  selector: 'app-trip-card',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule,
    MatButtonModule, MatProgressBarModule, MatTooltipModule, MatDividerModule,
  ],
  template: `
    <mat-card class="trip-card" [class.emergency]="trip().status === 'EMERGENCY_STOP'" [class.focused]="isFocused()">
      <mat-card-content>
        <div class="trip-header">
          <div class="trip-title">
            <span class="vehicle-plate">{{ trip().vehicle_details?.registration_number || 'N/A' }}</span>
            <span class="route-name">{{ trip().route_name }}</span>
          </div>
          <div class="trip-actions-top">
            <button mat-icon-button [matTooltip]="isFocused() ? 'Unfocus' : 'Focus on map'" (click)="focusClick.emit(trip().id)" class="focus-btn">
              <mat-icon>my_location</mat-icon>
            </button>
            <button mat-icon-button [matTooltip]="'View manifest'" (click)="tripClick.emit(trip())" class="manifest-btn">
              <mat-icon>groups</mat-icon>
            </button>
          </div>
        </div>

        <div class="status-row">
          <span class="status-badge" [class]="statusClass()">
            <span class="status-dot" [class.pulsing]="trip().status === 'ON_ROUTE'"></span>
            {{ trip().status }}
          </span>
          <span class="trip-type-badge" [class]="trip().trip_type?.toLowerCase()">{{ trip().trip_type }}</span>
        </div>

        <div class="crew-row">
          <div class="crew-member">
            <mat-icon class="crew-icon">person</mat-icon>
            <div class="crew-detail">
              <span class="crew-label">Driver</span>
              <span class="crew-name">{{ trip().driver_name || 'Unassigned' }}</span>
            </div>
          </div>
          <div class="crew-member">
            <mat-icon class="crew-icon">person_outline</mat-icon>
            <div class="crew-detail">
              <span class="crew-label">Conductor</span>
              <span class="crew-name">{{ trip().conductor_name || 'Unassigned' }}</span>
            </div>
          </div>
        </div>

        <mat-divider></mat-divider>

        <div class="manifest-section">
          <div class="manifest-header">
            <span class="manifest-title">Passenger Manifest</span>
            <span class="manifest-count">{{ trip().passenger_count ?? 0 }} / {{ capacity() }}</span>
          </div>
          <div class="progress-wrapper">
            <div class="progress-bg">
              <div class="progress-fill" [style.width.%]="occupancyPct()" [class]="occupancyColor()"></div>
            </div>
          </div>
          <div class="manifest-meta">
            <span class="occupancy-text" [class]="occupancyColor()">{{ occupancyPct() }}% Occupied</span>
            <span class="capacity-text">Seats: {{ capacity() }}</span>
          </div>
        </div>

        @if (telemetry(); as tel) {
          <div class="telemetry-row">
            <div class="tel-item">
              <mat-icon class="tel-icon">speed</mat-icon>
              <span class="tel-value" [class]="speedColor(tel.speed_kmh)">{{ tel.speed_kmh || 0 }}</span>
              <span class="tel-unit">km/h</span>
            </div>
          </div>
        }

        <div class="card-actions">
          <button mat-stroked-button color="warn" class="emergency-btn"
                  (click)="emergencyStop.emit(trip())"
                  [disabled]="trip().status !== 'ON_ROUTE'"
                  [matTooltip]="trip().status === 'ON_ROUTE' ? 'Emergency Stop Trip' : 'Only active trips can be stopped'">
            <mat-icon>emergency</mat-icon> Emergency Stop
          </button>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .trip-card { border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.07); border: 1px solid #e2e8f0; transition: all 0.2s; overflow: hidden; }
    .trip-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .trip-card.emergency { border-color: #ef4444; background: #fef2f2; }
    .trip-card.focused { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.2); }
    .trip-card mat-card-content { padding: 16px; display: flex; flex-direction: column; gap: 12px; }

    .trip-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
    .trip-title { display: flex; flex-direction: column; gap: 2px; }
    .vehicle-plate { font-size: 1rem; font-weight: 700; color: #1e293b; letter-spacing: 0.5px; }
    .route-name { font-size: 0.75rem; color: #64748b; font-weight: 500; }
    .trip-actions-top { display: flex; gap: 4px; }
    .focus-btn, .manifest-btn { width: 32px; height: 32px; line-height: 32px; }
    .focus-btn mat-icon, .manifest-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .status-row { display: flex; align-items: center; gap: 8px; }
    .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .status-badge.scheduled { background: #f1f5f9; color: #64748b; }
    .status-badge.on_route { background: #dcfce7; color: #059669; }
    .status-badge.completed { background: #dbeafe; color: #2563eb; }
    .status-badge.emergency_stop { background: #fee2e2; color: #dc2626; }
    .status-badge.cancelled { background: #f3f4f6; color: #6b7280; }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
    .status-dot.pulsing { animation: status-pulse 1.5s infinite; }
    @keyframes status-pulse { 0% { box-shadow: 0 0 0 0 rgba(5,150,105,0.6); } 70% { box-shadow: 0 0 0 6px rgba(5,150,105,0); } 100% { box-shadow: 0 0 0 0 rgba(5,150,105,0); } }
    .trip-type-badge { font-size: 0.6rem; font-weight: 600; padding: 2px 8px; border-radius: 10px; text-transform: uppercase; background: #f1f5f9; color: #475569; }
    .trip-type-badge.morning { background: #e0f2fe; color: #0369a1; }
    .trip-type-badge.afternoon { background: #fef3c7; color: #92400e; }

    .crew-row { display: flex; gap: 16px; }
    .crew-member { display: flex; align-items: center; gap: 8px; flex: 1; }
    .crew-icon { font-size: 18px; width: 18px; height: 18px; color: #94a3b8; }
    .crew-detail { display: flex; flex-direction: column; }
    .crew-label { font-size: 0.6rem; color: #94a3b8; text-transform: uppercase; font-weight: 600; }
    .crew-name { font-size: 0.8rem; color: #1e293b; font-weight: 500; }

    .manifest-section { display: flex; flex-direction: column; gap: 6px; }
    .manifest-header { display: flex; justify-content: space-between; align-items: center; }
    .manifest-title { font-size: 0.7rem; font-weight: 600; color: #64748b; text-transform: uppercase; }
    .manifest-count { font-size: 0.75rem; font-weight: 600; color: #1e293b; }
    .progress-wrapper { width: 100%; }
    .progress-bg { width: 100%; height: 6px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
    .progress-fill.green { background: #10b981; }
    .progress-fill.amber { background: #f59e0b; }
    .progress-fill.red { background: #ef4444; }
    .manifest-meta { display: flex; justify-content: space-between; align-items: center; }
    .occupancy-text { font-size: 0.65rem; font-weight: 600; }
    .occupancy-text.green { color: #059669; }
    .occupancy-text.amber { color: #d97706; }
    .occupancy-text.red { color: #dc2626; }
    .capacity-text { font-size: 0.65rem; color: #94a3b8; }

    .telemetry-row { display: flex; gap: 16px; padding: 8px 12px; background: #f8fafc; border-radius: 8px; }
    .tel-item { display: flex; align-items: center; gap: 4px; }
    .tel-icon { font-size: 16px; width: 16px; height: 16px; color: #94a3b8; }
    .tel-value { font-size: 1rem; font-weight: 700; }
    .tel-value.green { color: #059669; }
    .tel-value.amber { color: #d97706; }
    .tel-value.red { color: #dc2626; }
    .tel-unit { font-size: 0.65rem; color: #94a3b8; }

    .card-actions { margin-top: 4px; }
    .emergency-btn { width: 100%; font-size: 0.75rem; padding: 4px; border-color: #fca5a5; color: #dc2626; }
    .emergency-btn:disabled { opacity: 0.4; }
    .emergency-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }
  `],
})
export class TripCardComponent {
  readonly trip = input.required<DailyTrip>();
  readonly telemetry = input<FleetTelemetry | undefined>(undefined);
  readonly isFocused = input<boolean>(false);

  readonly tripClick = output<DailyTrip>();
  readonly emergencyStop = output<DailyTrip>();
  readonly focusClick = output<string>();

  readonly capacity = computed(() => this.trip().vehicle_details?.capacity || 0);
  readonly occupancyPct = computed(() => {
    const cap = this.capacity();
    if (!cap) return 0;
    return Math.min(100, Math.round(((this.trip().passenger_count ?? 0) / cap) * 100));
  });
  readonly occupancyColor = computed(() => {
    const pct = this.occupancyPct();
    if (pct >= 90) return 'red';
    if (pct >= 70) return 'amber';
    return 'green';
  });
  readonly statusClass = computed(() => this.trip().status?.toLowerCase().replace(/_/g, '_') || 'scheduled');

  speedColor(speed: number): string {
    if (speed > 80) return 'red';
    if (speed > 60) return 'amber';
    return 'green';
  }
}
