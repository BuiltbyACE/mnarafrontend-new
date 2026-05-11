import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { FleetTelemetry } from '../../../../shared/models/transport.models';

@Component({
  selector: 'app-telemetry-gauge',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="gauge-overlay">
      <div class="gauge-container">
        <div class="gauge-header">
          <mat-icon>speed</mat-icon>
          <span>Fleet Telemetry</span>
        </div>
        <div class="gauge-body">
          <div class="gauge-item">
            <div class="gauge-ring" [class]="avgSpeedColorClass()">
              <svg viewBox="0 0 36 36" class="gauge-svg">
                <path class="gauge-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                <path class="gauge-fill" [style.stroke-dasharray]="avgSpeedDash()" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
              </svg>
              <div class="gauge-value">
                <span class="gauge-num">{{ avgSpeed() }}</span>
                <span class="gauge-unit">km/h</span>
              </div>
            </div>
            <div class="gauge-label">
              <span class="gauge-title">Average Speed</span>
              <span class="gauge-subtitle">Fleet-wide</span>
            </div>
          </div>

          <div class="gauge-divider"></div>

          <div class="gauge-item">
            <div class="gauge-ring" [class]="topSpeedColorClass()">
              <svg viewBox="0 0 36 36" class="gauge-svg">
                <path class="gauge-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                <path class="gauge-fill" [style.stroke-dasharray]="topSpeedDash()" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
              </svg>
              <div class="gauge-value">
                <span class="gauge-num">{{ topSpeed() }}</span>
                <span class="gauge-unit">km/h</span>
              </div>
            </div>
            <div class="gauge-label">
              <span class="gauge-title">Top Speed</span>
              <span class="gauge-subtitle">Peak detected</span>
            </div>
          </div>
        </div>
        <div class="gauge-legend">
          <span class="legend-item"><span class="legend-dot green"></span> Safe (&lt;60)</span>
          <span class="legend-item"><span class="legend-dot amber"></span> Caution (60-80)</span>
          <span class="legend-item"><span class="legend-dot red"></span> Alert (&gt;80)</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .gauge-overlay { position: absolute; top: 12px; left: 12px; z-index: 500; pointer-events: auto; }
    .gauge-container { background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); border-radius: 12px; padding: 12px 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; min-width: 200px; }
    .gauge-header { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-size: 0.7rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .gauge-header mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .gauge-body { display: flex; align-items: center; gap: 12px; }
    .gauge-item { display: flex; align-items: center; gap: 8px; flex: 1; }
    .gauge-divider { width: 1px; height: 48px; background: #e2e8f0; }

    .gauge-ring { position: relative; width: 48px; height: 48px; flex-shrink: 0; }
    .gauge-svg { width: 48px; height: 48px; transform: rotate(-90deg); }
    .gauge-bg { fill: none; stroke: #e2e8f0; stroke-width: 3; }
    .gauge-fill { fill: none; stroke-width: 3; stroke-linecap: round; transition: stroke-dasharray 0.5s ease; }
    .gauge-ring.green .gauge-fill { stroke: #10b981; }
    .gauge-ring.amber .gauge-fill { stroke: #f59e0b; }
    .gauge-ring.red .gauge-fill { stroke: #ef4444; }
    .gauge-value { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .gauge-num { font-size: 0.85rem; font-weight: 800; color: #1e293b; line-height: 1; }
    .gauge-unit { font-size: 0.5rem; color: #94a3b8; font-weight: 600; }

    .gauge-label { display: flex; flex-direction: column; }
    .gauge-title { font-size: 0.75rem; font-weight: 600; color: #1e293b; }
    .gauge-subtitle { font-size: 0.6rem; color: #94a3b8; }

    .gauge-legend { display: flex; gap: 12px; margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0; }
    .legend-item { display: flex; align-items: center; gap: 4px; font-size: 0.6rem; color: #64748b; }
    .legend-dot { width: 6px; height: 6px; border-radius: 50%; }
    .legend-dot.green { background: #10b981; }
    .legend-dot.amber { background: #f59e0b; }
    .legend-dot.red { background: #ef4444; }
  `],
})
export class TelemetryGaugeComponent {
  readonly telemetryData = input<FleetTelemetry[]>([]);

  readonly avgSpeed = computed(() => {
    const data = this.telemetryData();
    if (!data.length) return 0;
    const total = data.reduce((sum, t) => sum + (t.speed_kmh || 0), 0);
    return Math.round(total / data.length);
  });

  readonly topSpeed = computed(() => {
    const data = this.telemetryData();
    if (!data.length) return 0;
    return Math.round(Math.max(...data.map(t => t.speed_kmh || 0)));
  });

  readonly avgSpeedColorClass = computed(() => this.speedColorClass(this.avgSpeed()));
  readonly topSpeedColorClass = computed(() => this.speedColorClass(this.topSpeed()));

  readonly avgSpeedDash = computed(() => this.calcDash(this.avgSpeed(), 120));
  readonly topSpeedDash = computed(() => this.calcDash(this.topSpeed(), 120));

  private speedColorClass(speed: number): string {
    if (speed > 80) return 'red';
    if (speed > 60) return 'amber';
    return 'green';
  }

  private calcDash(speed: number, maxSpeed: number): string {
    const pct = Math.min(1, speed / maxSpeed);
    const circumference = 2 * Math.PI * 15.9155;
    const offset = circumference * (1 - pct);
    return `${circumference - offset} ${circumference}`;
  }
}
