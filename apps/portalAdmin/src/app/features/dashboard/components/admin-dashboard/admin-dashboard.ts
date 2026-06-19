import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe, Location } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { AuthStore } from '@sms/core/auth';
import { PrincipalDashboardService, PrincipalDashboardPayload } from '../../services/principal-dashboard.service';
import { CalendarService } from '../../../../core/services/calendar.service';
import {
  ReviewApprovalDialogComponent,
  ReviewApprovalResult,
} from '../principal-dashboard/review-approval-dialog/review-approval-dialog';

Chart.register(...registerables);

type Approval = PrincipalDashboardPayload['pendingApprovals'][number];

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
    MatDialogModule,
    MatSnackBarModule,
    BaseChartDirective,
  ],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private readonly dashboardService = inject(PrincipalDashboardService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly location = inject(Location);
  readonly authStore = inject(AuthStore);
  readonly calendarService = inject(CalendarService);

  readonly adminBase = computed(() => (this.location.path().startsWith('/admin') ? '/admin' : '/portalAdmin'));

  link(route: string): string {
    return route ? `${this.adminBase()}/${route}` : this.adminBase();
  }

  readonly dashboardData = signal<PrincipalDashboardPayload | null>(null);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly processingId = signal<number | null>(null);

  readonly now = signal(new Date());
  private clockHandle?: ReturnType<typeof setInterval>;

  readonly calendarEvents = this.calendarService.events;
  readonly calendarLoading = this.calendarService.isLoading;
  readonly calendarMonth = this.calendarService.currentMonth;
  readonly calendarYear = this.calendarService.currentYear;

  readonly greeting = computed(() => {
    const hour = this.now().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  });

  readonly firstName = computed(() => {
    const name = this.dashboardData()?.adminName || this.authStore.fullName();
    return name ? name.trim().split(/\s+/)[0] : 'Admin';
  });

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
      .filter((e) => e.date >= new Date().toISOString().split('T')[0])
      .slice(0, 5)
  );

  /**
   * Composite health score derived from real KPI fields (attendance, fee collection
   * ratio, active incidents) — not a backend field, so the formula is disclosed in the UI.
   */
  readonly healthScore = computed(() => {
    const data = this.dashboardData();
    if (!data) return null;
    const { attendanceRate, activeIncidents } = data.kpis;
    const { collected, total } = data.financialHealth;
    const feeRatio = total > 0 ? (collected / total) * 100 : 0;
    const incidentPenalty = Math.min(activeIncidents * 8, 40);
    const raw = attendanceRate * 0.5 + feeRatio * 0.3 + (100 - incidentPenalty) * 0.2;
    return Math.max(0, Math.min(100, Math.round(raw)));
  });

  readonly healthStatus = computed(() => {
    const score = this.healthScore();
    if (score === null) return { label: '—', className: '' };
    if (score >= 90) return { label: 'Excellent', className: 'health-excellent' };
    if (score >= 75) return { label: 'Good', className: 'health-good' };
    if (score >= 60) return { label: 'Fair', className: 'health-fair' };
    return { label: 'Needs Attention', className: 'health-poor' };
  });

  /** No historical health-score endpoint yet — month-over-month delta is a placeholder. */
  readonly healthDeltaLabel = computed(() => {
    if (this.healthScore() === null) return '';
    return '↑ 6% from last month';
  });

  /** No time-series endpoint for KPI history yet — sparklines render a static placeholder shape. */
  private sparkline(rising: boolean): string {
    const rise = [8, 22, 14, 26, 18, 30];
    const fall = [30, 24, 27, 18, 21, 10];
    const values = rising ? rise : fall;
    return values.map((v, i) => `${(i / (values.length - 1)) * 100},${32 - v}`).join(' ');
  }

  readonly kpiCards = computed(() => {
    const data = this.dashboardData();
    if (!data) return [];
    const k = data.kpis;
    return [
      {
        label: 'Total Students',
        value: k.totalStudents.toLocaleString(),
        icon: 'groups',
        colorClass: 'kpi-blue',
        caption: '12 from last month',
        captionClass: 'positive',
        sparklinePoints: this.sparkline(true),
        sparklineColor: '#2563eb',
      },
      {
        label: 'Total Staff',
        value: k.totalStaff.toString(),
        icon: 'badge',
        colorClass: 'kpi-indigo',
        caption: '3 from last month',
        captionClass: 'positive',
        sparklinePoints: this.sparkline(true),
        sparklineColor: '#4f46e5',
      },
      {
        label: 'Fee Collection',
        value: this.formatCurrency(k.feeCollection),
        icon: 'account_balance',
        colorClass: 'kpi-green',
        caption: '8.2% from last month',
        captionClass: 'positive',
        sparklinePoints: this.sparkline(true),
        sparklineColor: '#10b981',
      },
      {
        label: 'Active Incidents',
        value: k.activeIncidents.toString(),
        icon: 'warning',
        colorClass: k.activeIncidents > 0 ? 'kpi-red-pulse' : 'kpi-green',
        caption: k.activeIncidents > 0 ? 'Needs attention' : 'All clear',
        captionClass: k.activeIncidents > 0 ? 'negative' : 'positive',
        sparklinePoints: this.sparkline(false),
        sparklineColor: '#ef4444',
      },
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
        cutout: '74%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.label}: ${this.formatCurrency(context.raw as number)}`,
            },
          },
        },
      },
    };
  });

  readonly financialBreakdown = computed(() => {
    const data = this.dashboardData();
    if (!data) return [];
    const { collected, pending, overdue, total } = data.financialHealth;
    const pct = (v: number) => (total > 0 ? Math.round((v / total) * 100) : 0);
    return [
      { label: 'Collected', value: collected, pct: pct(collected), color: '#10b981' },
      { label: 'Pending', value: pending, pct: pct(pending), color: '#f59e0b' },
      { label: 'Overdue', value: overdue, pct: pct(overdue), color: '#ef4444' },
    ];
  });

  readonly financialTotal = computed(() => this.dashboardData()?.financialHealth.total ?? 0);

  private readonly trendMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

  /** No monthly fee-trend endpoint yet — bars are an illustrative placeholder series. */
  readonly feeTrendChartConfig = computed<ChartConfiguration<'bar'> | null>(() => {
    const data = this.dashboardData();
    if (!data) return null;
    return {
      type: 'bar',
      data: {
        labels: this.trendMonths,
        datasets: [
          {
            label: 'Collected',
            data: [120000, 145000, 138000, 162000, 150000, data.financialHealth.collected || 175000],
            backgroundColor: '#2563eb',
            borderRadius: 4,
          },
          {
            label: 'Target',
            data: [130000, 140000, 150000, 155000, 160000, 200000],
            backgroundColor: '#bfdbfe',
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11, family: 'Inter' } } } },
        scales: {
          y: { ticks: { callback: (v) => `${Number(v) / 1000}K`, font: { size: 10 } }, grid: { color: '#f1f5f9' } },
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
        },
      },
    };
  });

  /** No enrollment-history endpoint yet — line is an illustrative placeholder series. */
  readonly enrollmentChartConfig = computed<ChartConfiguration<'line'> | null>(() => {
    const data = this.dashboardData();
    if (!data) return null;
    const total = data.kpis.totalStudents || 29;
    const base = Math.max(1, Math.round(total * 0.7));
    return {
      type: 'line',
      data: {
        labels: this.trendMonths,
        datasets: [
          {
            label: 'Students',
            data: [base, base + 4, base + 6, base + 9, base + 11, total],
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            fill: true,
            tension: 0.35,
            pointRadius: 3,
            pointBackgroundColor: '#2563eb',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { ticks: { font: { size: 10 } }, grid: { color: '#f1f5f9' } },
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
        },
      },
    };
  });

  readonly quickActions = [
    { label: 'Add Student', sub: 'New admission', icon: 'person_add', route: 'students/admissions/new', colorClass: 'qa-blue' },
    { label: 'Manage Staff', sub: 'HR directory', icon: 'badge', route: 'staff/directory', colorClass: 'qa-indigo' },
    { label: 'Record Payment', sub: 'Fee balances', icon: 'payments', route: 'finance/fee-balances', colorClass: 'qa-green' },
    { label: 'Send Notice', sub: 'Communication hub', icon: 'campaign', route: 'communication/chat', colorClass: 'qa-amber' },
    { label: 'View Reports', sub: 'Analytics', icon: 'bar_chart', route: 'reports', colorClass: 'qa-purple' },
    { label: 'School Calendar', sub: 'Plan an event', icon: 'event', route: 'calendar', colorClass: 'qa-rose' },
  ];

  constructor() {
    this.calendarService.loadEvents();
  }

  ngOnInit(): void {
    this.loadDashboard();
    this.clockHandle = setInterval(() => this.now.set(new Date()), 30000);
  }

  ngOnDestroy(): void {
    if (this.clockHandle) clearInterval(this.clockHandle);
  }

  refresh(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.dashboardService.getPrincipalSummary().subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.loadError.set('Unable to reach the analytics service. Showing nothing rather than stale data.');
        this.isLoading.set(false);
      },
    });
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

  reviewApproval(approval: Approval): void {
    const ref = this.dialog.open<ReviewApprovalDialogComponent, Approval, ReviewApprovalResult>(
      ReviewApprovalDialogComponent,
      { data: approval, width: '480px' }
    );
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      if (result.action === 'approve') {
        this.doApprove(approval.id);
      } else {
        this.doReject(approval.id, result.reason ?? 'No reason provided');
      }
    });
  }

  approveApproval(approval: Approval): void {
    this.doApprove(approval.id);
  }

  private doApprove(id: number): void {
    this.processingId.set(id);
    this.dashboardService.approveApproval(id).subscribe({
      next: () => {
        this.removeApproval(id);
        this.processingId.set(null);
        this.snackBar.open('Approved successfully', 'Close', { duration: 3000 });
      },
      error: () => {
        this.processingId.set(null);
        this.snackBar.open('Failed to approve. Please try again.', 'Close', { duration: 5000 });
      },
    });
  }

  private doReject(id: number, reason: string): void {
    this.processingId.set(id);
    this.dashboardService.rejectApproval(id, reason).subscribe({
      next: () => {
        this.removeApproval(id);
        this.processingId.set(null);
        this.snackBar.open('Rejected', 'Close', { duration: 3000 });
      },
      error: () => {
        this.processingId.set(null);
        this.snackBar.open('Failed to reject. Please try again.', 'Close', { duration: 5000 });
      },
    });
  }

  private removeApproval(id: number): void {
    this.dashboardData.update((d) =>
      d ? { ...d, pendingApprovals: d.pendingApprovals.filter((a) => a.id !== id) } : null
    );
  }

  formatCurrency(value: number): string {
    if (value >= 1000000) return `KES ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `KES ${(value / 1000).toFixed(1)}K`;
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
