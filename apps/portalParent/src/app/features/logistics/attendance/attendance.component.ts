import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DatePipe } from '@angular/common';
import { ParentApiService } from '../../../services/parent-api.service';
import { AttendanceRecord, STATUS_COLORS } from '../../../models/parent.models';

@Component({
  selector: 'app-attendance',
  imports: [MatCardModule, MatIconModule, MatProgressSpinnerModule, DatePipe],
  template: `
    <div class="attendance-page">
      <h2>Attendance Records</h2>
      @if (loading()) { <div class="loading-wrap"><mat-spinner diameter="28"></mat-spinner></div> }
      @else {
        <div class="stats-bar">
          <div class="stat"><span class="stat-value">{{ presentCount }}</span><span class="stat-label">Present</span></div>
          <div class="stat"><span class="stat-value">{{ absentCount }}</span><span class="stat-label">Absent</span></div>
          <div class="stat"><span class="stat-value">{{ lateCount }}</span><span class="stat-label">Late</span></div>
          <div class="stat"><span class="stat-value">{{ excusedCount }}</span><span class="stat-label">Excused</span></div>
        </div>
        @if (records().length > 0) {
          <table class="attendance-table">
            <thead><tr><th>Date</th><th>Status</th><th>Remarks</th></tr></thead>
            <tbody>
              @for (r of records(); track r.date + r.student) {
                <tr>
                  <td>{{ r.date | date:'mediumDate' }}</td>
                  <td><span class="status-dot" [style.background]="STATUS_COLORS[r.status]"></span> {{ r.status }}</td>
                  <td>{{ r.remarks || '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        } @else { <div class="no-data">No attendance records</div> }
      }
    </div>
  `,
  styles: [`
    .attendance-page { padding: 16px 0; }
    h2 { font-size: 1.125rem; margin: 0 0 16px; color: #1e293b; }
    .loading-wrap { display: flex; justify-content: center; padding: 48px; }
    .stats-bar { display: flex; gap: 12px; margin-bottom: 20px; }
    .stat { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 20px; flex: 1; text-align: center; }
    .stat-value { display: block; font-size: 1.25rem; font-weight: 700; color: #1e293b; }
    .stat-label { font-size: 0.6875rem; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.04em; }
    .attendance-table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
    .attendance-table th { text-align: left; padding: 8px 12px; border-bottom: 2px solid #e2e8f0; color: #64748b; font-weight: 600; font-size: 0.6875rem; text-transform: uppercase; }
    .attendance-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
    .status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
    .no-data { padding: 48px; text-align: center; color: #94a3b8; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttendanceComponent implements OnInit {
  private readonly api = inject(ParentApiService);

  readonly records = signal<AttendanceRecord[]>([]);
  readonly loading = signal(true);

  readonly STATUS_COLORS = STATUS_COLORS;

  ngOnInit() {
    this.api.getAttendanceRecords().subscribe({
      next: (records) => this.records.set(records),
      complete: () => this.loading.set(false),
    });
  }

  get presentCount() { return this.records().filter(r => r.status === 'PRESENT').length; }
  get absentCount() { return this.records().filter(r => r.status === 'ABSENT').length; }
  get lateCount() { return this.records().filter(r => r.status === 'LATE').length; }
  get excusedCount() { return this.records().filter(r => r.status === 'EXCUSED').length; }
}
