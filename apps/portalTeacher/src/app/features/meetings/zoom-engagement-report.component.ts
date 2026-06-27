import { Component, ChangeDetectionStrategy, input, inject, signal, effect } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ZoomMeetingService } from '../../core/services/zoom-meeting.service';

@Component({
  selector: 'app-zoom-engagement-report',
  standalone: true,
  imports: [CommonModule, MatIconModule, DecimalPipe],
  template: `
    <div class="report-panel">
      @if (isLoading()) {
        <div class="loading">Generating engagement report...</div>
      } @else if (report()) {
        <div class="metrics-grid">
          <div class="metric-card highlight">
            <mat-icon>trending_up</mat-icon>
            <div class="val">{{ report().class_engagement_score | number:'1.0-0' }}%</div>
            <div class="lbl">Avg Engagement</div>
          </div>
          <div class="metric-card">
            <mat-icon>people</mat-icon>
            <div class="val">{{ report().total_attendees }}</div>
            <div class="lbl">Total Attendees</div>
          </div>
          <div class="metric-card">
            <mat-icon>timer</mat-icon>
            <div class="val">{{ report().actual_duration_minutes }}m</div>
            <div class="lbl">Duration</div>
          </div>
        </div>

        <div class="attendance-breakdown">
          <div class="bar-chart">
            <div class="bar full" [style.width.%]="pct(report().full_attendance_count)"></div>
            <div class="bar partial" [style.width.%]="pct(report().partial_attendance_count)"></div>
            <div class="bar absent" [style.width.%]="pct(report().absent_count)"></div>
          </div>
          <div class="legend">
            <div class="leg-item"><span class="dot full"></span> {{ report().full_attendance_count }} Full</div>
            <div class="leg-item"><span class="dot partial"></span> {{ report().partial_attendance_count }} Partial</div>
            <div class="leg-item"><span class="dot absent"></span> {{ report().absent_count }} Absent</div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; border-radius: 12px; background: white; border: 1px solid #e2e8f0; padding: 20px; }
    
    .loading { text-align: center; color: #64748b; padding: 20px; }
    
    .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
    .metric-card { background: #f8fafc; border-radius: 10px; padding: 16px; text-align: center; }
    .metric-card mat-icon { color: #64748b; margin-bottom: 8px; font-size: 24px; width: 24px; height: 24px; }
    .metric-card .val { font-size: 1.5rem; font-weight: 700; color: #0f172a; line-height: 1; margin-bottom: 4px; }
    .metric-card .lbl { font-size: 0.75rem; font-weight: 500; color: #64748b; text-transform: uppercase; }
    
    .metric-card.highlight { background: #eff6ff; }
    .metric-card.highlight mat-icon { color: #3b82f6; }
    .metric-card.highlight .val { color: #1d4ed8; }
    
    .bar-chart { display: flex; height: 8px; border-radius: 100px; overflow: hidden; margin-bottom: 12px; background: #f1f5f9; }
    .bar { height: 100%; transition: width 0.5s ease-out; }
    .bar.full { background: #22c55e; }
    .bar.partial { background: #f59e0b; }
    .bar.absent { background: #ef4444; }
    
    .legend { display: flex; justify-content: center; gap: 16px; font-size: 0.8rem; color: #475569; }
    .leg-item { display: flex; align-items: center; gap: 6px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; }
    .dot.full { background: #22c55e; }
    .dot.partial { background: #f59e0b; }
    .dot.absent { background: #ef4444; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoomEngagementReportComponent {
  readonly classroomId = input.required<number>();
  readonly svc = inject(ZoomMeetingService);
  
  readonly report = signal<any>(null);
  readonly isLoading = signal(true);

  constructor() {
    effect(() => {
      const id = this.classroomId();
      if (id) {
        this.fetchReport(id);
      }
    });
  }

  fetchReport(id: number) {
    this.isLoading.set(true);
    this.svc.getEngagementReport(id).subscribe({
      next: (data) => {
        this.report.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  pct(count: number): number {
    const r = this.report();
    if (!r) return 0;
    const total = r.full_attendance_count + r.partial_attendance_count + r.absent_count;
    if (total === 0) return 0;
    return (count / total) * 100;
  }
}
