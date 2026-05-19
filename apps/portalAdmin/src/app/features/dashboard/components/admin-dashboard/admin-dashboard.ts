import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { PrincipalDashboardService, PrincipalDashboardPayload } from '../../services/principal-dashboard.service';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    DecimalPipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    BaseChartDirective,
  ],
  template: `
    @if (isLoading()) {
      <div class="p-10 text-center">
        <mat-spinner diameter="48"></mat-spinner>
        <span class="mt-4 block text-gray-500">Loading Command Center...</span>
      </div>
    } @else if (dashboardData(); as data) {
      <div class="command-center">
        <!-- Header -->
        <header class="command-header">
          <div class="header-left">
            <h1 class="header-title">Principal's Command Center</h1>
            <p class="header-subtitle">Overview of Institutional Health</p>
          </div>
          <div class="header-right">
            <div class="last-refresh">
              <mat-icon class="refresh-icon">update</mat-icon>
              <span>Last refresh: {{ data.lastRefresh | date:'short' }}</span>
            </div>
          </div>
        </header>

        <!-- The 4 Pillars - KPI Cards -->
        <section class="kpi-row">
          @for (card of kpiCards(); track card.label) {
            <mat-card class="kpi-card" [class]="card.colorClass">
              <mat-card-content>
                <div class="kpi-icon">
                  <mat-icon>{{ card.icon }}</mat-icon>
                </div>
                <div class="kpi-body">
                  <span class="kpi-label">{{ card.label }}</span>
                  <span class="kpi-value">{{ card.value }}</span>
                  <span class="kpi-change" [class.positive]="card.changeType === 'positive'" [class.negative]="card.changeType === 'negative'">
                    {{ card.change }}
                  </span>
                </div>
              </mat-card-content>
            </mat-card>
          }
        </section>

        <!-- Middle Grid - Financial Pulse + Action Queue -->
        <section class="middle-grid">
          <mat-card class="financial-card">
            <mat-card-header>
              <mat-icon mat-card-avatar class="section-icon">pie_chart</mat-icon>
              <mat-card-title>Term Revenue Breakdown</mat-card-title>
              <mat-card-subtitle>Financial health snapshot</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="doughnut-wrapper">
                <div class="chart-container">
                  @if (feeChartConfig(); as config) {
                    <canvas baseChart
                      [type]="config.type"
                      [data]="config.data"
                      [options]="config.options">
                    </canvas>
                  }
                </div>
                <div class="doughnut-center">
                  <span class="center-label">Total</span>
                  <span class="center-value">{{ formatCurrency(financialTotal()) }}</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="approvals-card">
            <mat-card-header>
              <mat-icon mat-card-avatar class="section-icon">fact_check</mat-icon>
              <mat-card-title>Action Queue</mat-card-title>
              <mat-card-subtitle>Pending Approvals</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="approvals-list">
                @for (approval of data.pendingApprovals; track approval.id) {
                  <div class="approval-item">
                    <div class="approval-header">
                      <span class="approval-type">{{ approval.type }}</span>
                      <span class="approval-priority" [class]="getPriorityClass(approval.priority)">
                        {{ approval.priority }}
                      </span>
                    </div>
                    <div class="approval-body">
                      <span class="approval-requester">{{ approval.requester }}</span>
                      <span class="approval-desc">{{ approval.description }}</span>
                    </div>
                    <div class="approval-actions">
                      <button mat-stroked-button class="action-btn review-btn">
                        <mat-icon>visibility</mat-icon>
                        Review
                      </button>
                      <button mat-flat-button color="primary" class="action-btn approve-btn">
                        <mat-icon>check</mat-icon>
                        Approve
                      </button>
                    </div>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>
        </section>

        <!-- Bottom Section - Operations Radar -->
        <section class="operations-section">
          <mat-card class="operations-card">
            <mat-card-header>
              <mat-icon mat-card-avatar class="section-icon">radar</mat-icon>
              <mat-card-title>Operations Radar</mat-card-title>
              <mat-card-subtitle>Live monitoring feed</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="operations-log">
                @for (op of data.liveOperations; track op.id) {
                  <div class="operation-entry" [class]="getOperationColor(op.type)">
                    <span class="op-time">[{{ formatTime(op.timestamp) }}]</span>
                    <mat-icon class="op-icon">{{ getOperationIcon(op.type) }}</mat-icon>
                    <span class="op-message">{{ op.message }}</span>
                    <span class="op-location">
                      <mat-icon class="loc-icon">place</mat-icon>
                      {{ op.location }}
                    </span>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>
        </section>
      </div>
    } @else {
      <div class="p-10 text-center">
        <span class="text-gray-500">No data available</span>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
    }

    .command-center {
      padding: 0 0 40px;
      font-family: 'Inter', sans-serif;
      max-width: 1400px;
      margin: 0 auto;
    }

    .command-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 28px 32px;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      border-radius: 16px;
      margin-bottom: 28px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
    }

    .header-left {
      display: flex;
      flex-direction: column;
    }

    .header-title {
      font-size: 1.625rem;
      font-weight: 700;
      color: white;
      margin: 0 0 6px;
    }

    .header-subtitle {
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.7);
      margin: 0;
    }

    .header-right {
      display: flex;
      align-items: center;
    }

    .last-refresh {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.75rem;
    }

    .refresh-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: rgba(255, 255, 255, 0.7);
    }

    .kpi-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 28px;
    }

    .kpi-card {
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      transition: transform 0.2s, box-shadow 0.2s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      }

      mat-card-content {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 20px;
      }
    }

    .kpi-icon {
      width: 52px;
      height: 52px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      mat-icon {
        font-size: 26px;
        width: 26px;
        height: 26px;
        color: white;
      }
    }

    .kpi-blue .kpi-icon { background: #2563eb; }
    .kpi-indigo .kpi-icon { background: #4f46e5; }
    .kpi-green .kpi-icon { background: #10b981; }
    .kpi-red-pulse .kpi-icon {
      background: #ef4444;
      animation: pulse-border 2s infinite;
    }

    @keyframes pulse-border {
      0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
      50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
    }

    .kpi-body {
      display: flex;
      flex-direction: column;
    }

    .kpi-label {
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .kpi-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.2;
      margin: 4px 0;
    }

    .kpi-change {
      font-size: 0.75rem;
      font-weight: 600;
    }

    .kpi-change.positive { color: #10b981; }
    .kpi-change.negative { color: #ef4444; }

    .middle-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 28px;
    }

    .financial-card,
    .approvals-card {
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .section-icon {
      background: #eff6ff;
      color: #2563eb;
    }

    .doughnut-wrapper {
      position: relative;
      margin-top: 16px;
    }

    .chart-container {
      height: 240px;
      position: relative;
    }

    .doughnut-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -60%);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .center-label {
      font-size: 0.6875rem;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .center-value {
      font-size: 1rem;
      font-weight: 700;
      color: #0f172a;
      margin-top: 4px;
    }

    .approvals-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 16px;
    }

    .approval-item {
      padding: 16px;
      background: #f8fafc;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      transition: border-color 0.2s;

      &:hover {
        border-color: #2563eb;
      }
    }

    .approval-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .approval-type {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #0f172a;
    }

    .approval-priority {
      font-size: 0.625rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 4px 8px;
      border-radius: 4px;
    }

    .priority-high {
      background: #fee2e2;
      color: #991b1b;
    }

    .priority-medium {
      background: #fef3c7;
      color: #92400e;
    }

    .priority-low {
      background: #dcfce7;
      color: #166534;
    }

    .approval-body {
      display: flex;
      flex-direction: column;
      margin-bottom: 12px;
    }

    .approval-requester {
      font-size: 0.8125rem;
      font-weight: 500;
      color: #334155;
    }

    .approval-desc {
      font-size: 0.75rem;
      color: #64748b;
      margin-top: 2px;
    }

    .approval-actions {
      display: flex;
      gap: 8px;
    }

    .action-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 8px 12px;
      font-size: 0.75rem;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }

    .review-btn {
      border-color: #2563eb;
      color: #2563eb;
    }

    .approve-btn {
      background: #2563eb;
      color: white;
    }

    .operations-card {
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .operations-log {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 16px;
    }

    .operation-entry {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: #f8fafc;
      border-radius: 8px;
      border-left: 3px solid transparent;
      font-size: 0.875rem;
    }

    .op-time {
      font-family: 'SF Mono', 'Consolas', monospace;
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      min-width: 80px;
    }

    .op-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .op-message {
      flex: 1;
      font-weight: 500;
      color: #0f172a;
    }

    .op-location {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      color: #64748b;
      background: white;
      padding: 4px 10px;
      border-radius: 4px;
    }

    .loc-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .op-info {
      border-left-color: #2563eb;

      .op-icon { color: #2563eb; }
    }

    .op-warning {
      border-left-color: #f59e0b;
      background: #fffbeb;

      .op-icon { color: #f59e0b; }
    }

    .op-alert {
      border-left-color: #ef4444;
      background: #fef2f2;

      .op-icon { color: #ef4444; }
    }

    .op-success {
      border-left-color: #10b981;
      background: #f0fdf4;

      .op-icon { color: #10b981; }
    }

    @media (max-width: 1200px) {
      .kpi-row {
        grid-template-columns: repeat(2, 1fr);
      }

      .middle-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .kpi-row {
        grid-template-columns: 1fr;
      }

      .command-header {
        flex-direction: column;
        gap: 16px;
        padding: 20px;
      }

      .kpi-card mat-card-content {
        padding: 16px;
      }

      .approval-actions {
        flex-direction: column;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent implements OnInit {
  private readonly dashboardService = inject(PrincipalDashboardService);
  private readonly http = inject(HttpClient);

  readonly dashboardData = signal<PrincipalDashboardPayload | null>(null);
  readonly isLoading = signal(true);

  private readonly mockData: PrincipalDashboardPayload = {
    adminName: 'Dr. Margaret Wanjiku',
    lastRefresh: new Date().toISOString(),
    kpis: {
      totalStudents: 847,
      totalStaff: 62,
      totalClasses: 28,
      feeCollection: 12.4,
      activeIncidents: 3,
      attendanceRate: 94.7,
    },
    financialHealth: {
      collected: 8450000,
      pending: 2130000,
      overdue: 450000,
      total: 10635000,
    },
    pendingApprovals: [
      { id: 1, type: 'Leave Request', requester: 'Mr. James Ouma', description: 'Annual leave - 5 days', submittedAt: '2026-05-18T08:00:00Z', priority: 'medium' },
      { id: 2, type: 'Expense Claim', requester: 'Ms. Grace Mwende', description: 'Teaching supplies - KES 15,000', submittedAt: '2026-05-18T09:30:00Z', priority: 'low' },
      { id: 3, type: 'Event Request', requester: 'Sports Department', description: 'Inter-school athletics permit', submittedAt: '2026-05-18T10:15:00Z', priority: 'high' },
      { id: 4, type: 'Curriculum Change', requester: 'Mr. Peter Kimani', description: 'Add coding elective - Form 2', submittedAt: '2026-05-17T14:00:00Z', priority: 'medium' },
    ],
    liveOperations: [
      { id: 1, timestamp: '2026-05-18T08:15:00Z', type: 'warning', message: 'Form 3A Math is unsupervised', location: 'Room 104' },
      { id: 2, timestamp: '2026-05-18T08:30:00Z', type: 'info', message: 'Bus Route 3 departed', location: 'Main Gate' },
      { id: 3, timestamp: '2026-05-18T07:45:00Z', type: 'success', message: 'Fire drill completed - all clear', location: 'Playground' },
      { id: 4, timestamp: '2026-05-18T09:00:00Z', type: 'alert', message: 'Lab 2 - Chemical spill reported', location: 'Science Block' },
    ],
    quickStats: [
      { label: 'Fee Collection (M)', value: 12.4, change: 8.2, unit: 'KES' },
      { label: 'Active Incidents', value: 3, change: -2, unit: '' },
      { label: 'Attendance Rate', value: 94.7, change: 1.5, unit: '%' },
      { label: 'Pending Approvals', value: 12, change: 4, unit: '' },
    ],
  };

  ngOnInit(): void {
    console.log('AdminDashboardComponent: Initializing...');
    this.loadDashboard();

    setTimeout(() => {
      if (this.isLoading()) {
        console.log('AdminDashboardComponent: Timeout - falling back to mock data');
        this.dashboardData.set(this.mockData);
        this.isLoading.set(false);
      }
    }, 5000);
  }

  private loadDashboard(): void {
    console.log('AdminDashboardComponent: Loading dashboard from API');
    this.isLoading.set(true);
    this.dashboardService.getPrincipalSummary().subscribe({
      next: (data) => {
        console.log('AdminDashboardComponent: API success');
        this.dashboardData.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('AdminDashboardComponent: API error, using mock data:', err);
        this.dashboardData.set(this.mockData);
        this.isLoading.set(false);
      },
    });
  }

  readonly kpiCards = computed(() => {
    const data = this.dashboardData();
    if (!data) return [];
    const k = data.kpis;
    return [
      { label: 'Total Students', value: k.totalStudents.toLocaleString(), icon: 'groups', colorClass: 'kpi-blue', change: '+12', changeType: 'positive' },
      { label: 'Total Staff', value: k.totalStaff.toString(), icon: 'badge', colorClass: 'kpi-indigo', change: '+3', changeType: 'positive' },
      { label: 'Fee Collection', value: `KES ${k.feeCollection}M`, icon: 'account_balance', colorClass: 'kpi-green', change: '+8.2%', changeType: 'positive' },
      { label: 'Active Incidents', value: k.activeIncidents.toString(), icon: 'warning', colorClass: k.activeIncidents > 0 ? 'kpi-red-pulse' : 'kpi-green', change: k.activeIncidents > 0 ? 'Needs attention' : 'All clear', changeType: k.activeIncidents > 0 ? 'negative' : 'positive' },
    ];
  });

  readonly feeChartConfig = computed<ChartConfiguration<'doughnut'> | null>(() => {
    const data = this.dashboardData();
    if (!data) return null;
    return {
      type: 'doughnut',
      data: {
        labels: ['Collected', 'Pending', 'Overdue'],
        datasets: [{
          data: [data.financialHealth.collected, data.financialHealth.pending, data.financialHealth.overdue],
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
          borderWidth: 0,
          hoverOffset: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: {
          legend: { position: 'bottom', labels: { color: '#64748b', padding: 16, font: { size: 12, family: 'Inter' }, boxWidth: 12 } },
        },
      },
    };
  });

  readonly financialTotal = computed(() => {
    const data = this.dashboardData();
    return data?.financialHealth.total ?? 0;
  });

  formatCurrency(value: number): string {
    if (value >= 1000000) return `KES ${(value / 1000000).toFixed(1)}M`;
    return `KES ${value.toLocaleString()}`;
  }

  getOperationIcon(type: string): string {
    const icons: Record<string, string> = { info: 'info', warning: 'warning', alert: 'error', success: 'check_circle' };
    return icons[type] || 'info';
  }

  getOperationColor(type: string): string {
    const colors: Record<string, string> = { info: 'op-info', warning: 'op-warning', alert: 'op-alert', success: 'op-success' };
    return colors[type] || 'op-info';
  }

  getPriorityClass(priority: string): string {
    const classes: Record<string, string> = { high: 'priority-high', medium: 'priority-medium', low: 'priority-low' };
    return classes[priority] || 'priority-low';
  }

  formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }
}