import { Component, inject, signal, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { LiveCampusService, LiveEvent } from '../services/live-campus.service';

@Component({
  selector: 'app-campus-monitor',
  standalone: true,
  imports: [DecimalPipe, MatIconModule],
  templateUrl: './campus-monitor.component.html',
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: #0b1120;
      color: #e2e8f0;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    }
    .monitor-page { padding: 24px 32px; max-width: 1600px; margin: 0 auto; }
    .monitor-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
    .monitor-header h1 { font-size: 22px; font-weight: 700; color: #f1f5f9; margin: 0; display: flex; align-items: center; gap: 10px; }
    .badge { font-size: 11px; font-weight: 600; background: #059669; color: #fff; padding: 3px 10px; border-radius: 100px; letter-spacing: .5px; }

    .gauges { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
    .gauge { background: #131c31; border: 1px solid #1e293b; border-radius: 14px; padding: 20px 24px; }
    .gauge-label { font-size: 13px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 10px; }
    .gauge-bar { height: 8px; background: #1e293b; border-radius: 100px; overflow: hidden; margin-bottom: 8px; }
    .gauge-fill { height: 100%; border-radius: 100px; transition: width .6s ease; }
    .gauge-fill.students { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
    .gauge-fill.staff { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
    .gauge-value { font-size: 24px; font-weight: 700; color: #f1f5f9; }
    .gauge-sub { font-size: 13px; color: #64748b; }

    .body { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

    .ticker-panel { background: #131c31; border: 1px solid #1e293b; border-radius: 14px; overflow: hidden; display: flex; flex-direction: column; }
    .ticker-header { padding: 14px 20px; border-bottom: 1px solid #1e293b; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #94a3b8; display: flex; align-items: center; justify-content: space-between; }
    .ticker-count { font-size: 11px; color: #475569; }
    .ticker-list { flex: 1; overflow-y: auto; max-height: 520px; display: flex; flex-direction: column; gap: 1px; padding: 4px 0; }
    .ticker-row { display: flex; align-items: center; gap: 10px; padding: 10px 20px; font-size: 13px; border-left: 3px solid transparent; transition: background .12s; animation: rowFlash .5s ease-out; }
    .ticker-row.student { border-left-color: #22c55e; }
    .ticker-row.teacher { border-left-color: #3b82f6; }
    .ticker-row.staff { border-left-color: #a855f7; }
    .ticker-row:hover { background: #1a243b; }
    .ticker-time { font-family: 'SF Mono', 'Cascadia Code', monospace; font-size: 12px; color: #64748b; white-space: nowrap; }
    .ticker-role { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; padding: 2px 6px; border-radius: 4px; }
    .ticker-role.student { background: rgba(34,197,94,.15); color: #4ade80; }
    .ticker-role.teacher { background: rgba(59,130,246,.15); color: #60a5fa; }
    .ticker-role.staff { background: rgba(168,85,247,.15); color: #c084fc; }
    .ticker-name { font-weight: 600; color: #f1f5f9; }
    .ticker-location { color: #94a3b8; }
    .ticker-direction { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 100px; margin-left: auto; }
    .ticker-direction.in { background: rgba(34,197,94,.15); color: #4ade80; }
    .ticker-direction.out { background: rgba(239,68,68,.15); color: #f87171; }

    @keyframes rowFlash { 0% { background: rgba(59,130,246,.12); } 100% { background: transparent; } }

    .zones-panel { background: #131c31; border: 1px solid #1e293b; border-radius: 14px; padding: 16px; }
    .zones-header { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #94a3b8; margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid #1e293b; }
    .zones-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 10px; }
    .zone-card { background: #0b1120; border: 1px solid #1e293b; border-radius: 10px; padding: 14px; }
    .zone-name { font-size: 13px; font-weight: 600; color: #e2e8f0; margin-bottom: 8px; }
    .zone-bar { height: 5px; background: #1e293b; border-radius: 100px; overflow: hidden; margin-bottom: 6px; }
    .zone-fill { height: 100%; border-radius: 100px; background: linear-gradient(90deg, #3b82f6, #60a5fa); transition: width .6s ease; }
    .zone-stats { font-size: 12px; color: #64748b; }
    .zone-stats strong { color: #e2e8f0; }

    .empty-ticker { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; color: #475569; gap: 8px; }
    .empty-ticker mat-icon { font-size: 40px; width: 40px; height: 40px; opacity: .5; }
    .loading-state { display: flex; align-items: center; justify-content: center; min-height: 300px; color: #64748b; font-size: 14px; gap: 10px; }

    @media (max-width: 1024px) {
      .body { grid-template-columns: 1fr; }
      .gauges { grid-template-columns: 1fr; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampusMonitorComponent implements OnDestroy {
  private service = inject(LiveCampusService);

  readonly stats = this.service.campusStats;
  readonly statsLoading = this.service.statsLoading;
  readonly statsError = this.service.statsError;

  readonly liveEvents = signal<LiveEvent[]>([]);
  private wsSub: Subscription | null = null;

  constructor() {
    this.service.getBaselineStats();
    this.connectWs();
  }

  private connectWs(): void {
    try {
      this.wsSub = this.service.connectWebSocket().subscribe({
        next: (event) => {
          this.liveEvents.update(prev => {
            const next = [event, ...prev];
            return next.length > 50 ? next.slice(0, 50) : next;
          });
          this.service.campusStats.update(s => {
            if (!s) return s;
            if (event.type === 'ENTRY') {
              if (event.role === 'STUDENT') return { ...s, students_on_campus: s.students_on_campus + 1 };
              if (event.role === 'TEACHER' || event.role === 'STAFF') return { ...s, staff_on_campus: s.staff_on_campus + 1 };
            }
            if (event.type === 'EXIT') {
              if (event.role === 'STUDENT') return { ...s, students_on_campus: Math.max(0, s.students_on_campus - 1) };
              if (event.role === 'TEACHER' || event.role === 'STAFF') return { ...s, staff_on_campus: Math.max(0, s.staff_on_campus - 1) };
            }
            return s;
          });
        },
        error: () => {
          setTimeout(() => this.connectWs(), 5000);
        },
      });
    } catch {
      setTimeout(() => this.connectWs(), 5000);
    }
  }

  ngOnDestroy(): void {
    this.wsSub?.unsubscribe();
    this.service.disconnect();
  }

  roleClass(role: string): string {
    return role === 'TEACHER' ? 'teacher' : role === 'STAFF' ? 'staff' : 'student';
  }
}
