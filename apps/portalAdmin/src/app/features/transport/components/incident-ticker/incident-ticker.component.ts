import { Component, input, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { TripIncident } from '../../../../shared/models/transport.models';

@Component({
  selector: 'app-incident-ticker',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatChipsModule, MatTooltipModule],
  template: `
    <div class="ticker-container">
      <div class="ticker-header">
        <div class="ticker-title">
          <mat-icon>warning</mat-icon>
          <span>Incident Feed</span>
          @if (activeCount() > 0) {
            <span class="incident-count">{{ activeCount() }}</span>
          }
        </div>
        <button mat-icon-button (click)="dismissAll()" [disabled]="activeCount() === 0" matTooltip="Dismiss all">
          <mat-icon>clear_all</mat-icon>
        </button>
      </div>

      <div class="ticker-feed">
        @for (inc of visibleIncidents(); track inc.id) {
          <div class="ticker-item" [class]="inc.severity.toLowerCase()" [class.dismissed]="dismissedIds().has(inc.id)">
            <div class="ticker-indicator">
              <mat-icon class="ticker-icon">{{ incidentIcon(inc.incident_type) }}</mat-icon>
            </div>
            <div class="ticker-body">
              <div class="ticker-primary">
                <span class="ticker-desc">{{ inc.description }}</span>
                <span class="ticker-type">{{ inc.incident_type }}</span>
              </div>
              <div class="ticker-meta">
                @if (inc.trip_name) {
                  <span class="ticker-trip">{{ inc.trip_name }}</span>
                }
              </div>
            </div>
            <div class="ticker-actions">
              <mat-chip [color]="severityColor(inc.severity)" highlighted class="severity-chip">{{ inc.severity }}</mat-chip>
              <button mat-icon-button (click)="dismiss(inc.id)" matTooltip="Dismiss" class="dismiss-btn">
                <mat-icon>close</mat-icon>
              </button>
            </div>
            @if (!inc.resolved) {
              <div class="ticker-badge">OPEN</div>
            }
          </div>
        } @empty {
          <div class="ticker-empty">
            <mat-icon>check_circle_outline</mat-icon>
            <p>All clear — no active incidents</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .ticker-container { display: flex; flex-direction: column; max-height: 100%; }
    .ticker-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #e2e8f0; }
    .ticker-title { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; font-weight: 600; color: #1e293b; }
    .ticker-title mat-icon { font-size: 18px; width: 18px; height: 18px; color: #f59e0b; }
    .incident-count { background: #fee2e2; color: #dc2626; font-size: 0.65rem; font-weight: 700; padding: 2px 6px; border-radius: 8px; }

    .ticker-feed { flex: 1; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 4px; }
    .ticker-item { display: flex; align-items: flex-start; gap: 8px; padding: 10px; border-radius: 8px; border-left: 3px solid #94a3b8; background: white; border: 1px solid #e2e8f0; position: relative; transition: all 0.3s; }
    .ticker-item.low { border-left-color: #94a3b8; }
    .ticker-item.medium { border-left-color: #f59e0b; background: #fffbeb; }
    .ticker-item.high { border-left-color: #ef4444; background: #fef2f2; animation: incident-flash 2s ease-in-out infinite; }
    .ticker-item.dismissed { opacity: 0.3; pointer-events: none; }
    @keyframes incident-flash { 0%, 100% { background: #fef2f2; } 50% { background: #fff; } }
    .ticker-indicator { flex-shrink: 0; }
    .ticker-icon { font-size: 18px; width: 18px; height: 18px; }
    .ticker-item.low .ticker-icon { color: #64748b; }
    .ticker-item.medium .ticker-icon { color: #d97706; }
    .ticker-item.high .ticker-icon { color: #dc2626; }
    .ticker-body { flex: 1; display: flex; flex-direction: column; gap: 4px; }
    .ticker-primary { display: flex; flex-direction: column; }
    .ticker-desc { font-size: 0.75rem; color: #334155; font-weight: 500; }
    .ticker-type { font-size: 0.6rem; color: #94a3b8; text-transform: uppercase; font-weight: 600; }
    .ticker-meta { display: flex; align-items: center; gap: 8px; }
    .ticker-trip { font-size: 0.65rem; color: #3b82f6; background: #eff6ff; padding: 1px 6px; border-radius: 4px; }
    .ticker-actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
    .severity-chip { font-size: 0.6rem !important; height: 20px !important; min-height: 20px !important; }
    .dismiss-btn { width: 24px; height: 24px; line-height: 24px; }
    .dismiss-btn mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .ticker-badge { position: absolute; top: -1px; right: -1px; background: #ef4444; color: white; font-size: 0.5rem; font-weight: 700; padding: 1px 6px; border-radius: 0 8px 0 8px; }

    .ticker-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px 16px; color: #94a3b8; }
    .ticker-empty mat-icon { font-size: 32px; width: 32px; height: 32px; }
    .ticker-empty p { margin: 0; font-size: 0.8rem; }

    ::-webkit-scrollbar { width: 3px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
  `],
})
export class IncidentTickerComponent implements OnDestroy {
  readonly incidents = input<TripIncident[]>([]);

  readonly dismissedIds = signal<Set<number>>(new Set());

  private scrollInterval: ReturnType<typeof setInterval> | null = null;

  readonly activeCount = () => this.incidents().filter(i => !this.dismissedIds().has(i.id) && !i.resolved).length;

  readonly visibleIncidents = () => this.incidents().filter(i => !this.dismissedIds().has(i.id));

  constructor() {
    this.startAutoScroll();
  }

  ngOnDestroy(): void {
    this.stopAutoScroll();
  }

  private startAutoScroll(): void {
    this.scrollInterval = setInterval(() => {
      const feed = document.querySelector('.ticker-feed');
      if (feed) {
        feed.scrollTop += 1;
      }
    }, 100);
  }

  private stopAutoScroll(): void {
    if (this.scrollInterval) {
      clearInterval(this.scrollInterval);
      this.scrollInterval = null;
    }
  }

  dismiss(id: number): void {
    const current = this.dismissedIds();
    const updated = new Set(current);
    updated.add(id);
    this.dismissedIds.set(updated);
  }

  dismissAll(): void {
    const allIds = new Set(this.incidents().map(i => i.id));
    this.dismissedIds.set(allIds);
  }

  incidentIcon(type: string): string {
    switch (type) {
      case 'BREAKDOWN': return 'build';
      case 'TRAFFIC': return 'traffic';
      case 'MEDICAL': return 'local_hospital';
      case 'DIVERSION': return 'alt_route';
      default: return 'warning';
    }
  }

  severityColor(severity: string): 'warn' | 'accent' | 'primary' {
    switch (severity) {
      case 'HIGH': return 'warn';
      case 'MEDIUM': return 'accent';
      default: return 'primary';
    }
  }
}
