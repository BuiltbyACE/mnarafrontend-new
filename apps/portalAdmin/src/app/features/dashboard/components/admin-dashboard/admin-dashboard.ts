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
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { PrincipalDashboardService, PrincipalDashboardPayload } from '../../services/principal-dashboard.service';
import { CalendarService } from '../../../../core/services/calendar.service';

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

        <!-- Bottom Section - Operations Radar + Calendar -->
        <section class="bottom-grid">
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

          <mat-card class="calendar-card">
            <mat-card-header>
              <mat-icon mat-card-avatar class="section-icon">calendar_month</mat-icon>
              <mat-card-title>
                <button mat-icon-button class="cal-nav" (click)="calendarService.previousMonth()">
                  <mat-icon>chevron_left</mat-icon>
                </button>
                <span>{{ calendarMonthLabel() }}</span>
                <button mat-icon-button class="cal-nav" (click)="calendarService.nextMonth()">
                  <mat-icon>chevron_right</mat-icon>
                </button>
              </mat-card-title>
              <mat-card-subtitle>{{ calendarEvents().length }} event(s)</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              @if (calendarLoading()) {
                <mat-progress-spinner diameter="24"></mat-progress-spinner>
              } @else if (calendarEvents(); as events) {
                <div class="calendar-grid">
                  @for (day of ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']; track day) {
                    <span class="cal-day-header">{{ day }}</span>
                  }
                  @for (day of calendarDays(); track day) {
                    <div class="cal-day" [class.has-event]="dayHasEvent(day)"
                         [class.other-month]="day.month !== calendarMonth() - 1">
                      <span class="day-num">{{ day.num }}</span>
                      @if (dayHasEvent(day)) {
                        <span class="day-dot"></span>
                      }
                    </div>
                  }
                </div>
                @if (upcomingEvents().length > 0) {
                  <mat-divider class="cal-divider"></mat-divider>
                  <div class="upcoming-list">
                    <span class="upcoming-title">Upcoming</span>
                    @for (evt of upcomingEvents(); track evt.id) {
                      <div class="upcoming-item">
                        <span class="upcoming-dot" [style.background]="getEventColor(evt.type)"></span>
                        <span class="upcoming-text">{{ evt.title }}</span>
                        <span class="upcoming-date">{{ evt.date | date:'d MMM' }}</span>
                      </div>
                    }
                  </div>
                }
              }
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

    .bottom-grid {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 20px;
      margin-bottom: 28px;
    }

    .operations-card,
    .calendar-card {
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .cal-nav {
      vertical-align: middle;
    }

    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px;
      text-align: center;
      margin-top: 12px;
    }

    .cal-day-header {
      font-size: 0.625rem;
      font-weight: 600;
      color: #64748b;
      padding: 4px 0;
      text-transform: uppercase;
    }

    .cal-day {
      padding: 6px 0;
      border-radius: 6px;
      cursor: default;
      position: relative;
    }

    .cal-day.other-month .day-num {
      color: #cbd5e1;
    }

    .cal-day.has-event {
      background: #eff6ff;
    }

    .day-num {
      font-size: 0.8125rem;
      font-weight: 500;
      color: #0f172a;
    }

    .day-dot {
      display: block;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: #2563eb;
      margin: 2px auto 0;
    }

    .cal-divider {
      margin: 12px 0;
    }

    .upcoming-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .upcoming-title {
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.05em;
    }

    .upcoming-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.75rem;
    }

    .upcoming-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .upcoming-text {
      flex: 1;
      color: #0f172a;
      font-weight: 500;
    }

    .upcoming-date {
      color: #64748b;
      font-size: 0.6875rem;
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

      .bottom-grid {
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
  readonly calendarService = inject(CalendarService);

  readonly dashboardData = signal<PrincipalDashboardPayload | null>(null);
  readonly isLoading = signal(true);

  readonly calendarEvents = this.calendarService.events;
  readonly calendarLoading = this.calendarService.isLoading;
  readonly calendarMonth = this.calendarService.currentMonth;
  readonly calendarYear = this.calendarService.currentYear;

  readonly calendarMonthLabel = computed(() => {
    const month = this.calendarMonth();
    const year = this.calendarYear();
    return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });

  readonly calendarDays = computed(() => {
    const month = this.calendarMonth();
    const year = this.calendarYear();
    const first = new Date(year, month - 1, 1);
    const last = new Date(year, month, 0);
    const startPad = (first.getDay() + 6) % 7;
    const totalCells = Math.ceil((startPad + last.getDate()) / 7) * 7;
    const days: { num: number; month: number; fullDate: string }[] = [];
    for (let i = 0; i < totalCells; i++) {
      const d = new Date(year, month - 1, -startPad + i + 1);
      const fullDate = d.getMonth() === month - 1
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        : '';
      days.push({ num: d.getDate(), month: d.getMonth(), fullDate });
    }
    return days;
  });

  readonly upcomingEvents = computed(() =>
    this.calendarEvents()
      .filter(e => e.date >= new Date().toISOString().split('T')[0])
      .slice(0, 5)
  );

  constructor() {
    this.calendarService.loadEvents();
  }

  ngOnInit(): void {
    this.loadDashboard();
  }

  dayHasEvent(day: { num: number; month: number; fullDate: string }): boolean {
    if (!day.fullDate) return false;
    return this.calendarService.hasEvents(day.fullDate);
  }

  getEventColor(type: string): string {
    const colors: Record<string, string> = {
      holiday: '#ef4444',
      exam: '#f59e0b',
      meeting: '#8b5cf6',
      event: '#2563eb',
      deadline: '#dc2626',
      assembly: '#10b981',
    };
    return colors[type] || '#64748b';
  }

  private loadDashboard(): void {
    this.isLoading.set(true);
    this.dashboardService.getPrincipalSummary().subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        this.isLoading.set(false);
      },
      error: () => {
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
      { label: 'Fee Collection', value: this.formatCurrency(k.feeCollection), icon: 'account_balance', colorClass: 'kpi-green', change: '+8.2%', changeType: 'positive' },
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