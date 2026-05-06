import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { DashboardService, AdminDashboardData } from '../../services/dashboard.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    BaseChartDirective,
  ],
  template: `
    <div class="dashboard-container">
      @if (isLoading()) {
        <div class="loading-spinner">
          <mat-spinner diameter="40"></mat-spinner>
          <span>Loading dashboard...</span>
        </div>
      } @else {
        <div class="hero-section">
          <div class="hero-content">
            <h1>Welcome back, {{ dashboardData()?.adminName || 'Admin' }}!</h1>
            <p>{{ currentDate() }}</p>
          </div>
        </div>

        <div class="grid-12 stats-row">
          @for (card of statCards(); track card.label) {
            <mat-card class="grid-col-3 stat-card">
              <div class="stat-icon" [class]="card.color">
                <mat-icon>{{ card.icon }}</mat-icon>
              </div>
              <div class="stat-body">
                <span class="stat-label">{{ card.label }}</span>
                <span class="stat-value">{{ card.value }}</span>
                <div class="stat-delta" [class.positive]="card.deltaPositive" [class.negative]="!card.deltaPositive">
                  <mat-icon>{{ card.deltaPositive ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                  {{ card.delta >= 0 ? '+' : '' }}{{ card.delta }}%
                </div>
              </div>
            </mat-card>
          }
        </div>

        <div class="grid-12 charts-row">
          <mat-card class="grid-col-4 fee-card">
            <mat-card-header>
              <mat-card-title>Fee Collection</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-container">
                @if (feeChartConfig(); as config) {
                  <canvas baseChart
                    [type]="config.type"
                    [data]="config.data"
                    [options]="config.options">
                  </canvas>
                }
              </div>
              <div class="fee-summary">
                <div class="fee-item">
                  <span class="fee-dot collected"></span>
                  <span>Collected: {{ dashboardData()?.feeCollected || 0 }}</span>
                </div>
                <div class="fee-item">
                  <span class="fee-dot pending"></span>
                  <span>Pending: {{ dashboardData()?.feePending || 0 }}</span>
                </div>
                <div class="fee-item">
                  <span class="fee-dot overdue"></span>
                  <span>Overdue: {{ dashboardData()?.feeOverdue || 0 }}</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="grid-col-8 attendance-card">
            <mat-card-header>
              <mat-card-title>Attendance Overview</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-container bar-chart">
                @if (attendanceChartConfig(); as config) {
                  <canvas baseChart
                    [type]="config.type"
                    [data]="config.data"
                    [options]="config.options">
                  </canvas>
                }
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <div class="grid-12 bottom-row">
          <mat-card class="grid-col-4">
            <mat-card-header>
              <mat-card-title>Quick Actions</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="quick-actions-grid">
                @for (action of quickActions(); track action.label) {
                  <button mat-stroked-button [routerLink]="action.route">
                    <mat-icon>{{ action.icon }}</mat-icon>
                    {{ action.label }}
                  </button>
                }
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="grid-col-4">
            <mat-card-header>
              <mat-card-title>Upcoming Events</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="events-list">
                @for (event of upcomingEvents(); track event.id) {
                  <div class="event-item">
                    <div class="event-dot"></div>
                    <div class="event-info">
                      <span class="event-title">{{ event.title }}</span>
                      <span class="event-date">{{ event.date }}</span>
                    </div>
                  </div>
                } @empty {
                  <p class="no-data-text">No upcoming events</p>
                }
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="grid-col-4">
            <mat-card-header>
              <mat-card-title>System Alerts</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="alerts-list">
                @for (alert of alerts(); track alert.id) {
                  <div class="alert-item" [class.warning]="alert.type === 'warning'" [class.error]="alert.type === 'error'">
                    <mat-icon [class.orange]="alert.type === 'warning'" [class.red]="alert.type === 'error'">
                      {{ alert.type === 'warning' ? 'warning' : alert.type === 'error' ? 'error' : 'info' }}
                    </mat-icon>
                    <span>{{ alert.message }}</span>
                  </div>
                } @empty {
                  <p class="no-data-text">No active alerts</p>
                }
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 0 0 32px;
      font-family: 'Inter', sans-serif;
      max-width: 1400px;
      margin: 0 auto;
    }

    .loading-spinner {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 0;
      gap: 16px;
      color: #64748b;
      font-size: 0.875rem;
    }

    .hero-section {
      background: linear-gradient(135deg, #f0f4ff 0%, #fafbff 55%, #f5f0ff 100%);
      border-radius: 16px;
      padding: 36px;
      margin-bottom: 32px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }

    .hero-content h1 {
      font-size: 1.625rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 8px;
    }

    .hero-content p {
      font-size: 0.9rem;
      color: #64748b;
      margin: 0;
    }

    .grid-12 {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 24px;
      margin-bottom: 24px;
    }

    .grid-col-3 {
      grid-column: span 3;
    }

    .grid-col-4 {
      grid-column: span 4;
    }

    .grid-col-8 {
      grid-column: span 8;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.07);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stat-icon mat-icon {
      color: white;
      font-size: 22px;
    }

    .stat-icon.blue { background: #2563eb; }
    .stat-icon.indigo { background: #4f46e5; }
    .stat-icon.green { background: #10b981; }
    .stat-icon.amber { background: #f59e0b; }

    .stat-body {
      display: flex;
      flex-direction: column;
    }

    .stat-label {
      font-size: 0.75rem;
      color: #64748b;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
      line-height: 1.2;
    }

    .stat-delta {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.7rem;
    }

    .stat-delta mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .stat-delta.positive { color: #10b981; }
    .stat-delta.negative { color: #ef4444; }

    .charts-row {
      align-items: start;
    }

    .fee-card,
    .attendance-card {
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.07);
    }

    mat-card-header {
      padding: 20px 20px 0;
    }

    mat-card-title {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #1e293b;
    }

    mat-card-content {
      padding: 20px;
    }

    .chart-container {
      height: 250px;
      position: relative;
      margin-bottom: 16px;
    }

    .bar-chart {
      height: 250px;
    }

    .fee-summary {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .fee-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8rem;
      color: #475569;
    }

    .fee-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .fee-dot.collected { background: #10b981; }
    .fee-dot.pending { background: #f59e0b; }
    .fee-dot.overdue { background: #ef4444; }

    .bottom-row {
      align-items: start;
    }

    .quick-actions-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .quick-actions-grid button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      justify-content: center;
    }

    .quick-actions-grid button mat-icon {
      font-size: 18px;
    }

    .events-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .event-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .event-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #2563eb;
      margin-top: 6px;
      flex-shrink: 0;
    }

    .event-info {
      display: flex;
      flex-direction: column;
    }

    .event-title {
      font-size: 0.875rem;
      color: #334155;
      font-weight: 500;
    }

    .event-date {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .alerts-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .alert-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid #f1f5f9;
      font-size: 0.875rem;
      color: #334155;
    }

    .alert-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .alert-item mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .alert-item mat-icon.orange { color: #f59e0b; }
    .alert-item mat-icon.red { color: #ef4444; }

    .no-data-text {
      font-size: 0.875rem;
      color: #94a3b8;
      text-align: center;
      padding: 16px 0;
      margin: 0;
    }

    @media (max-width: 1200px) {
      .grid-col-3 {
        grid-column: span 6;
      }

      .grid-col-4 {
        grid-column: span 12;
      }

      .grid-col-8 {
        grid-column: span 12;
      }

      .stats-row {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .grid-col-3 {
        grid-column: span 12;
      }

      .grid-12 {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .stats-row {
        grid-template-columns: 1fr;
      }

      .quick-actions-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class AdminDashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  dashboardData = signal<AdminDashboardData | null>(null);
  isLoading = signal(false);

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading.set(true);
    this.dashboardService.getAdminDashboardData().subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  readonly statCards = computed(() => {
    const data = this.dashboardData();
    if (!data) return [];
    const m = data.metrics;
    return [
      { label: 'Students', value: m.students.total, delta: m.students.changePct, deltaPositive: m.students.changePct >= 0, icon: 'groups', color: 'blue' },
      { label: 'Staff', value: m.staff.total, delta: m.staff.changePct, deltaPositive: m.staff.changePct >= 0, icon: 'badge', color: 'indigo' },
      { label: 'Classes', value: m.classes.total, delta: m.classes.changePct, deltaPositive: m.classes.changePct >= 0, icon: 'class', color: 'green' },
      { label: 'Subjects', value: m.subjects.total, delta: m.subjects.changePct, deltaPositive: m.subjects.changePct >= 0, icon: 'menu_book', color: 'amber' },
    ];
  });

  readonly feeChartConfig = computed<ChartConfiguration<'doughnut'> | null>(() => {
    const data = this.dashboardData();
    if (!data) return null;
    return {
      type: 'doughnut',
      data: {
        labels: ['Collected', 'Pending', 'Overdue'],
        datasets: [
          {
            data: [data.feeCollected, data.feePending, data.feeOverdue],
            backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, padding: 12, font: { size: 11 } } },
        },
      },
    };
  });

  readonly attendanceChartConfig = computed<ChartConfiguration<'bar'> | null>(() => {
    const data = this.dashboardData();
    if (!data) return null;
    return {
      type: 'bar',
      data: {
        labels: data.attendanceLabels || [],
        datasets: [
          {
            data: data.attendanceData || [],
            backgroundColor: '#2563eb',
            borderRadius: 4,
            maxBarThickness: 32,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, max: 100, ticks: { callback: (val) => val + '%', font: { size: 10 } }, grid: { color: '#f1f5f9' } },
        },
      },
    };
  });

  readonly attendancePercentage = computed(() => this.dashboardData()?.attendancePercentage || 0);
  readonly alerts = computed(() => this.dashboardData()?.alerts || []);
  readonly upcomingEvents = computed(() => this.dashboardData()?.upcomingEvents || []);
  readonly quickActions = computed(() => this.dashboardData()?.quickActions || [
    { label: 'Add Student', route: '/portalAdmin/students/admissions', icon: 'person_add' },
    { label: 'Add Staff', route: '/portalAdmin/staff', icon: 'group_add' },
    { label: 'Create Notice', route: '/portalAdmin/communication', icon: 'campaign' },
    { label: 'Assign Class', route: '/portalAdmin/academics', icon: 'assignment_ind' },
  ]);

  readonly currentDate = computed(() =>
    new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  );
}
