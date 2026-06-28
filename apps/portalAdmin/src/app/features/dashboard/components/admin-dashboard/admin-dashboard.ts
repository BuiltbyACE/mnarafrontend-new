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
import { PrincipalDashboardService, PrincipalDashboardPayload, AdminDashboardPayload } from '../../services/principal-dashboard.service';
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
  readonly adminDashboardData = signal<AdminDashboardPayload | null>(null);
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
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const days: { num: number; month: number; fullDate: string; isToday: boolean }[] = [];
    for (let i = 0; i < totalCells; i++) {
      const d = new Date(year, month - 1, -startPad + i + 1);
      const fullDate = d.getMonth() === month - 1
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        : '';
      days.push({ num: d.getDate(), month: d.getMonth(), fullDate, isToday: fullDate === todayStr && !!fullDate });
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

  readonly healthDeltaLabel = computed(() => {
    if (this.healthScore() === null) return '';
    return '';
  });

  readonly heroIncidents = computed(() => {
    const ops = this.dashboardData()?.liveOperations ?? [];
    return ops.filter(op => op.type === 'warning' || op.type === 'alert').slice(0, 3);
  });

  readonly keyRisks = computed(() => {
    const data = this.dashboardData();
    if (!data) return [];
    const risks: { label: string; color: string }[] = [];
    const feeRatio = data.financialHealth.total > 0
      ? (data.financialHealth.collected / data.financialHealth.total) * 100 : 0;
    if (data.kpis.attendanceRate < 85) risks.push({ label: 'Low attendance rate', color: '#10b981' });
    if (feeRatio < 50) risks.push({ label: 'Low fee collection rate', color: '#f59e0b' });
    if (data.financialHealth.overdue > 0) risks.push({ label: 'Overdue fee accumulation', color: '#f59e0b' });
    if (data.kpis.activeIncidents > 0) risks.push({ label: 'Active incidents', color: '#ef4444' });
    return risks.slice(0, 4);
  });

  private sparkline(): string {
    return '';
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
        caption: '',
        captionClass: 'positive',
        sparklinePoints: this.sparkline(),
        sparklineColor: '#2563eb',
      },
      {
        label: 'Total Staff',
        value: k.totalStaff.toString(),
        icon: 'badge',
        colorClass: 'kpi-indigo',
        caption: '',
        captionClass: 'positive',
        sparklinePoints: this.sparkline(),
        sparklineColor: '#4f46e5',
      },
      {
        label: 'Fee Collection',
        value: this.formatKpiCurrency(k.feeCollection),
        icon: 'account_balance',
        colorClass: 'kpi-green',
        caption: '',
        captionClass: 'positive',
        sparklinePoints: this.sparkline(),
        sparklineColor: '#10b981',
      },
      {
        label: 'Active Incidents',
        value: k.activeIncidents.toString(),
        icon: 'warning',
        colorClass: k.activeIncidents > 0 ? 'kpi-red-pulse' : 'kpi-green',
        caption: k.activeIncidents > 0 ? 'Needs attention' : 'All clear',
        captionClass: k.activeIncidents > 0 ? 'negative' : 'positive',
        sparklinePoints: this.sparkline(),
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

  readonly feeTrendChartConfig = computed<ChartConfiguration<'bar'> | null>(() => {
    const data = this.dashboardData();
    if (!data) return null;
    return {
      type: 'bar',
      data: {
        labels: ['Collected', 'Pending', 'Overdue'],
        datasets: [
          {
            label: 'Amount (KES)',
            data: [data.financialHealth.collected, data.financialHealth.pending, data.financialHealth.overdue],
            backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { ticks: { callback: (v) => `${Number(v) / 1000}K`, font: { size: 10 } }, grid: { color: '#f1f5f9' } },
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
        },
      },
    };
  });

  readonly enrollmentChartConfig = computed<ChartConfiguration<'line'> | null>(() => {
    const data = this.dashboardData();
    if (!data) return null;
    return null;
  });

  // ── Admin endpoint derived data ────────────────────────────────────────
  readonly systemAlerts = computed(() => this.adminDashboardData()?.system_alerts ?? []);
  readonly recentActivities = computed(() => this.adminDashboardData()?.recent_activities ?? []);
  readonly staffAbsences = computed(() => this.adminDashboardData()?.staff_absences ?? []);

  readonly adminMetrics = computed(() => {
    const m = this.adminDashboardData()?.metrics;
    if (!m) return null;
    return [
      { label: 'Students', total: m.students.total, change: m.students.change_pct, icon: 'groups', color: '#2563eb' },
      { label: 'Staff', total: m.staff.total, change: m.staff.change_pct, icon: 'badge', color: '#7c3aed' },
      { label: 'Classes', total: m.classes.total, change: m.classes.change_pct, icon: 'meeting_room', color: '#0891b2' },
      { label: 'Subjects', total: m.subjects.total, change: m.subjects.change_pct, icon: 'menu_book', color: '#059669' },
    ];
  });

  readonly financialDoughnut = computed(() => {
    const d = this.adminDashboardData()?.financial_doughnut;
    if (!d) return null;
    return d;
  });

  readonly adminDoughnutConfig = computed<ChartConfiguration<'doughnut'> | null>(() => {
    const d = this.financialDoughnut();
    if (!d) return null;
    return {
      type: 'doughnut',
      data: {
        labels: ['Collected', 'Pending'],
        datasets: [{
          data: [d.total_collected, d.total_pending],
          backgroundColor: ['#10b981', '#f59e0b'],
          borderWidth: 0,
          hoverOffset: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '74%',
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${this.formatCurrency(ctx.raw as number)}` } } },
      },
    };
  });

  readonly quickActions = [
    { label: 'Add Student', sub: 'New admission', icon: 'person_add', route: 'students/admissions/new', colorClass: 'qa-blue' },
    { label: 'Add Staff', sub: 'New employee', icon: 'badge', route: 'staff/directory', colorClass: 'qa-indigo' },
    { label: 'Record Payment', sub: 'Quick entry', icon: 'payments', route: 'finance/fee-balances', colorClass: 'qa-green' },
    { label: 'Create Notice', sub: 'Broadcast', icon: 'campaign', route: 'communication/chat', colorClass: 'qa-amber' },
    { label: 'View Reports', sub: 'Analytics', icon: 'bar_chart', route: 'reports', colorClass: 'qa-purple' },
    { label: 'Calendar Event', sub: 'Schedule', icon: 'event', route: 'calendar', colorClass: 'qa-rose' },
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
      },
      error: () => {
        this.dashboardData.set(null);
      },
    });

    this.dashboardService.getAdminDashboard().subscribe({
      next: (data) => {
        this.adminDashboardData.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        if (!this.dashboardData()) {
          this.loadError.set('Unable to reach the analytics service. Showing nothing rather than stale data.');
        }
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
    const approval = this.dashboardData()?.pendingApprovals.find(a => a.id === id);
    this.processingId.set(id);
    this.dashboardService.approveApproval(id, approval?.type ?? 'purchase_requisition').subscribe({
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
    const approval = this.dashboardData()?.pendingApprovals.find(a => a.id === id);
    this.processingId.set(id);
    this.dashboardService.rejectApproval(id, approval?.type ?? 'purchase_requisition', reason).subscribe({
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

  getPriorityDotClass(priority: string): string {
    const classes: Record<string, string> = { high: 'dot-high', medium: 'dot-medium', low: 'dot-low' };
    return classes[priority] || 'dot-low';
  }

  getApprovalIcon(type: string): string {
    const icons: Record<string, string> = {
      facility_booking: 'meeting_room',
      leave_request: 'calendar_today',
      support_ticket: 'support_agent',
      purchase_requisition: 'shopping_cart',
    };
    return icons[type] || 'description';
  }

  getAlertIcon(type: string): string {
    const icons: Record<string, string> = { warning: 'warning', danger: 'error', info: 'info' };
    return icons[type] || 'info';
  }

  getAlertColor(type: string): string {
    const colors: Record<string, string> = { warning: '#f59e0b', danger: '#ef4444', info: '#3b82f6' };
    return colors[type] || '#64748b';
  }

  getOperationDotClass(type: string): string {
    const classes: Record<string, string> = { info: 'dot-info', warning: 'dot-warning', alert: 'dot-alert', success: 'dot-success' };
    return classes[type] || 'dot-info';
  }

  getLocationBadgeClass(location: string): string {
    if (!location) return 'op-badge-default';
    const loc = location.toLowerCase();
    if (loc.includes('finance')) return 'op-badge-finance';
    if (loc.includes('campus')) return 'op-badge-campus';
    return 'op-badge-default';
  }

  getIncidentRowClass(type: string): string {
    const map: Record<string, string> = { alert: 'icr-alert', warning: 'icr-warning', info: 'icr-info', success: 'icr-success' };
    return map[type] || 'icr-info';
  }

  getIncidentIconClass(type: string): string {
    const map: Record<string, string> = { alert: 'icon-alert', warning: 'icon-warning', info: 'icon-info', success: 'icon-success' };
    return map[type] || 'icon-info';
  }

  formatKpiCurrency(value: number): string {
    if (value >= 1000000) return `KES ${(value / 1000000).toFixed(1)}M`;
    return `KES ${value.toLocaleString()}`;
  }

  formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }
}
