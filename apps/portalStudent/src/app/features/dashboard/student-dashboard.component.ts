import { Component, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StudentDashboardService } from './student-dashboard.service';

@Component({
  selector: 'app-student-dashboard',
  imports: [
    DatePipe,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './student-dashboard.component.html',
  styles: [`
    .dashboard { padding: 24px; }

    .welcome { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    h1 { margin: 0; font-size: 1.5rem; font-weight: 700; color: #0f172a; }
    .subtitle { margin: 4px 0 0; color: #64748b; font-size: 0.9375rem; }
    .subtitle strong { color: #0f172a; }
    .date-badge { background: #eff6ff; color: #2563eb; font-size: 0.8125rem; font-weight: 600; padding: 6px 14px; border-radius: 20px; white-space: nowrap; }

    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .stat-card mat-card-content { display: flex; align-items: center; gap: 16px; padding: 20px; }
    .stat-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .stat-icon mat-icon { color: white; font-size: 22px; width: 22px; height: 22px; }
    .stat-info { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.375rem; font-weight: 700; color: #0f172a; line-height: 1.2; }
    .stat-label { font-size: 0.8125rem; color: #64748b; margin-top: 2px; }

    .content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    @media (max-width: 900px) { .content-grid { grid-template-columns: 1fr; } }

    .announcements-card mat-card-header { padding-bottom: 0; }
    .announcement-item { display: flex; gap: 12px; padding: 14px 0; border-bottom: 1px solid #f1f5f9; }
    .announcement-item:last-child { border-bottom: none; }
    .ann-dot { width: 8px; height: 8px; border-radius: 50%; background: #2563eb; margin-top: 6px; flex-shrink: 0; }
    .ann-body { display: flex; flex-direction: column; }
    .ann-title { font-size: 0.875rem; font-weight: 600; color: #0f172a; }
    .ann-date { font-size: 0.75rem; color: #94a3b8; margin-top: 2px; }
    .ann-summary { margin: 6px 0 0; font-size: 0.8125rem; color: #475569; line-height: 1.4; }

    .quick-links { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding-top: 4px; }
    .quick-link { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; text-decoration: none; color: #334155; font-size: 0.8125rem; font-weight: 500; transition: background 0.15s; }
    .quick-link:hover { background: #f8fafc; }
    .quick-link mat-icon { font-size: 18px; width: 18px; height: 18px; color: #2563eb; }

    .empty-state { color: #94a3b8; font-size: 0.875rem; padding: 16px 0; margin: 0; }

    .loading-container, .error-container { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 24px; gap: 16px; }
    .loading-text { color: #64748b; font-size: 0.9375rem; margin: 0; }
    .error-icon { font-size: 48px; width: 48px; height: 48px; color: #ef4444; }
    .error-text { color: #64748b; font-size: 0.9375rem; margin: 0; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentDashboardComponent implements OnInit {
  readonly dashboardService = inject(StudentDashboardService);

  readonly today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  readonly quickLinks = [
    { label: 'My Classes', icon: 'school', route: '/student/classes' },
    { label: 'Exam Results', icon: 'quiz', route: '/student/exams' },
    { label: 'Attendance', icon: 'fact_check', route: '/student/attendance' },
    { label: 'Announcements', icon: 'campaign', route: '/student/announcements' },
    { label: 'Fee Balance', icon: 'account_balance_wallet', route: '/student/finance' },
  ];

  ngOnInit(): void {
    this.dashboardService.loadDashboard();
  }
}
