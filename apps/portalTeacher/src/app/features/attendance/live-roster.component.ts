import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TeacherAttendanceService, LiveRosterStudent } from '../../core/services/teacher-attendance.service';

@Component({
  selector: 'app-live-roster',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './live-roster.component.html',
  styles: [`
    :host {
      --mnara-primary: #2563eb;
      --mnara-primary-light: #dbeafe;
      --mnara-green: #16a34a;
      --mnara-green-light: #dcfce7;
      --mnara-red: #dc2626;
      --mnara-red-light: #fee2e2;
      --mnara-amber: #d97706;
      --mnara-amber-light: #fef3c7;
      --mnara-bg: #f1f5f9;
      --mnara-surface: #ffffff;
      --mnara-text: #1e293b;
      --mnara-text-secondary: #64748b;
      --mnara-border: #e2e8f0;
      display: block;
      min-height: 100vh;
      background: var(--mnara-bg);
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    }
    .roster-page { padding: 32px; max-width: 1200px; margin: 0 auto; }

    .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; gap: 16px; color: var(--mnara-text-secondary); }
    .spinner { width: 36px; height: 36px; border: 3px solid var(--mnara-border); border-top-color: var(--mnara-primary); border-radius: 50%; animation: spin .7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .error-state { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; gap: 12px; color: var(--mnara-red); }
    .error-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .retry-btn { padding: 8px 20px; border: none; border-radius: 8px; background: var(--mnara-primary); color: #fff; font-weight: 600; cursor: pointer; }

    .free-period { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; text-align: center; }
    .free-icon mat-icon { font-size: 64px; width: 64px; height: 64px; color: var(--mnara-text-secondary); opacity: .5; }
    .free-period h2 { font-size: 22px; font-weight: 600; color: var(--mnara-text); margin: 16px 0 4px; }
    .free-period p { color: var(--mnara-text-secondary); margin: 0 0 24px; }
    .refresh-btn { padding: 10px 24px; border: none; border-radius: 8px; background: var(--mnara-primary); color: #fff; font-weight: 600; font-size: 14px; cursor: pointer; }
    .refresh-btn:hover { background: #1d4ed8; }

    .roster-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
    .roster-header h1 { font-size: 28px; font-weight: 600; color: var(--mnara-text); margin: 0 0 6px; }
    .class-badge { display: flex; align-items: center; gap: 6px; font-size: 14px; color: var(--mnara-text-secondary); }
    .class-badge mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .badge-sep { color: var(--mnara-border); }

    .live-indicator { display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: var(--mnara-green-light); border-radius: 100px; font-size: 13px; font-weight: 600; color: var(--mnara-green); }
    .live-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--mnara-green); animation: pulse 1.5s ease-in-out infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .3; } }

    .kpi-bar { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 28px; }
    .kpi { background: var(--mnara-surface); border: 1px solid var(--mnara-border); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 4px; }
    .kpi-value { font-size: 32px; font-weight: 700; line-height: 1.1; }
    .kpi-label { font-size: 13px; color: var(--mnara-text-secondary); }
    .kpi.total .kpi-value { color: var(--mnara-primary); }
    .kpi.present .kpi-value { color: var(--mnara-green); }
    .kpi.missing .kpi-value { color: var(--mnara-red); }

    .roster-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }

    .student-card { display: flex; align-items: center; justify-content: space-between; gap: 12px; background: var(--mnara-surface); border: 1px solid var(--mnara-border); border-radius: 12px; padding: 14px 18px; transition: box-shadow .15s; flex-wrap: wrap; }
    .student-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,.06); }
    .student-card.present { border-left: 4px solid var(--mnara-green); }
    .student-card.absent { border-left: 4px solid var(--mnara-red); background: #fef2f2; }

    .card-left { display: flex; align-items: center; gap: 12px; }
    .avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--mnara-primary); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; flex-shrink: 0; }
    .student-info { display: flex; flex-direction: column; }
    .student-name { font-size: 14px; font-weight: 600; color: var(--mnara-text); }
    .student-id { font-size: 12px; color: var(--mnara-text-secondary); font-family: 'SF Mono', monospace; }

    .status-verified { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; color: var(--mnara-green); }
    .check-icon { font-size: 20px; width: 20px; height: 20px; }

    .status-absent { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; color: var(--mnara-red); }
    .cross-icon { font-size: 20px; width: 20px; height: 20px; }

    .status-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .action-btn { display: flex; align-items: center; gap: 4px; padding: 6px 14px; border: 1px solid var(--mnara-border); border-radius: 8px; background: var(--mnara-surface); font-size: 12px; font-weight: 600; cursor: pointer; transition: all .12s; white-space: nowrap; }
    .action-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .action-btn.verify { color: var(--mnara-primary); border-color: var(--mnara-primary); }
    .action-btn.verify:hover { background: var(--mnara-primary-light); }
    .action-btn.absent { color: var(--mnara-red); border-color: var(--mnara-red); }
    .action-btn.absent:hover { background: var(--mnara-red-light); }

    @media (max-width: 768px) {
      .roster-grid { grid-template-columns: 1fr; }
      .kpi-bar { grid-template-columns: 1fr; }
      .roster-header { flex-direction: column; }
      .student-card { flex-direction: column; align-items: flex-start; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveRosterComponent {
  private service = inject(TeacherAttendanceService);

  readonly data = this.service.liveRoster;
  readonly loading = this.service.rosterLoading;
  readonly error = this.service.rosterError;

  readonly overridingAbsent = signal<Set<number>>(new Set());

  constructor() {
    this.service.fetchLiveRoster();
  }

  markAbsent(student: LiveRosterStudent): void {
    this.overridingAbsent.update(s => { s.add(student.id); return new Set(s); });
    this.service.markAsAbsent(student.id);
  }

  isAbsent(student: LiveRosterStudent): boolean {
    return this.overridingAbsent().has(student.id) || student.status === 'ABSENT';
  }

  refresh(): void {
    this.overridingAbsent.set(new Set());
    this.service.fetchLiveRoster();
  }
}
