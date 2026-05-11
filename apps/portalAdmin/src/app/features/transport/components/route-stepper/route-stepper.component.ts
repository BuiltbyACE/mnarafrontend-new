import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { DailyTrip, RouteStop } from '../../../../shared/models/transport.models';

@Component({
  selector: 'app-route-stepper',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  template: `
    @if (stops().length > 0) {
      <div class="stepper-container">
        <div class="stepper-header">
          <mat-icon>alt_route</mat-icon>
          <span>Route Progress</span>
          <span class="stop-count">{{ currentStopIndex() + 1 }} / {{ stops().length }} stops</span>
        </div>
        <div class="stepper-track">
          @for (stop of stops(); track stop.id; let idx = $index; let last = $last) {
            <div class="stepper-step" [class.completed]="idx < currentStopIndex()" [class.current]="idx === currentStopIndex()" [class.upcoming]="idx > currentStopIndex()">
              <div class="step-indicator">
                @if (idx < currentStopIndex()) {
                  <div class="step-dot completed"><mat-icon>check</mat-icon></div>
                } @else if (idx === currentStopIndex()) {
                  <div class="step-dot current">
                    <span class="pulse-ring"></span>
                    <mat-icon>directions_bus</mat-icon>
                  </div>
                } @else {
                  <div class="step-dot upcoming">{{ idx + 1 }}</div>
                }
                @if (!last) {
                  <div class="step-line" [class.completed]="idx < currentStopIndex()"></div>
                }
              </div>
              <div class="step-content" [matTooltip]="stop.name">
                <span class="step-name">{{ stop.name }}</span>
                @if (idx === currentStopIndex()) {
                  <span class="step-status current-label">Current Stop</span>
                }
                @if (idx < currentStopIndex()) {
                  <span class="step-status completed-label">Completed</span>
                }
              </div>
            </div>
          }
        </div>
      </div>
    } @else {
      <div class="no-stops">
        <mat-icon>route</mat-icon>
        <p>No route stops available</p>
      </div>
    }
  `,
  styles: [`
    .stepper-container { padding: 12px; }
    .stepper-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; font-size: 0.8rem; font-weight: 600; color: #1e293b; }
    .stepper-header mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .stop-count { margin-left: auto; font-size: 0.65rem; color: #94a3b8; font-weight: 500; }

    .stepper-track { display: flex; flex-direction: column; max-height: 300px; overflow-y: auto; padding-right: 4px; }
    .stepper-step { display: flex; gap: 12px; min-height: 48px; }
    .step-indicator { display: flex; flex-direction: column; align-items: center; width: 28px; flex-shrink: 0; }
    .step-dot { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; position: relative; z-index: 1; }
    .step-dot.completed { background: #10b981; color: white; }
    .step-dot.completed mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .step-dot.current { background: #3b82f6; color: white; }
    .step-dot.current mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .step-dot.upcoming { background: #e2e8f0; color: #94a3b8; }
    .pulse-ring { position: absolute; inset: -4px; border-radius: 50%; border: 2px solid #3b82f6; animation: stepper-pulse 1.5s infinite; }
    @keyframes stepper-pulse { 0% { transform: scale(1); opacity: 0.6; } 70% { transform: scale(1.3); opacity: 0; } 100% { transform: scale(1.3); opacity: 0; } }
    .step-line { width: 2px; flex: 1; background: #e2e8f0; min-height: 20px; }
    .step-line.completed { background: #10b981; }
    .step-content { display: flex; flex-direction: column; justify-content: center; padding-bottom: 16px; min-width: 0; }
    .step-name { font-size: 0.8rem; color: #1e293b; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .step-status { font-size: 0.6rem; font-weight: 600; text-transform: uppercase; }
    .current-label { color: #3b82f6; }
    .completed-label { color: #10b981; }

    .no-stops { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px; color: #94a3b8; }
    .no-stops mat-icon { font-size: 32px; width: 32px; height: 32px; opacity: 0.5; }
    .no-stops p { margin: 0; font-size: 0.8rem; }

    ::-webkit-scrollbar { width: 3px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
  `],
})
export class RouteStepperComponent {
  readonly trip = input<DailyTrip | null>(null);
  readonly currentLat = input<number | null>(null);
  readonly currentLng = input<number | null>(null);

  readonly stops = computed<(RouteStop & { distance?: number })[]>(() => {
    const t = this.trip();
    if (!t?.route_details?.stops) return [];
    return [...t.route_details.stops].sort((a, b) => a.order - b.order);
  });

  readonly currentStopIndex = computed(() => {
    const stops = this.stops();
    if (!stops.length) return 0;
    const lat = this.currentLat();
    const lng = this.currentLng();
    if (lat == null || lng == null) return 0;

    let closestIdx = 0;
    let minDist = Infinity;

    for (let i = 0; i < stops.length; i++) {
      const s = stops[i];
      const stopLat = parseFloat(s.latitude);
      const stopLng = parseFloat(s.longitude);
      if (isNaN(stopLat) || isNaN(stopLng)) continue;

      const dist = Math.sqrt(
        Math.pow(lat - stopLat, 2) + Math.pow(lng - stopLng, 2)
      );
      if (dist < minDist) {
        minDist = dist;
        closestIdx = i;
      }
    }
    return closestIdx;
  });
}
