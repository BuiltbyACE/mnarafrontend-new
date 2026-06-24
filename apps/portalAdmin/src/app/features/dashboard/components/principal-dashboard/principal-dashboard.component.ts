import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  OnInit,
  ElementRef,
  viewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { PrincipalDashboardService, PrincipalDashboardPayload } from '../../services/principal-dashboard.service';
import { ReviewApprovalDialogComponent, ReviewApprovalResult } from './review-approval-dialog/review-approval-dialog';

Chart.register(...registerables);

@Component({
  selector: 'app-principal-dashboard',
  standalone: true,
  imports: [
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatDialogModule,
    MatSnackBarModule,
    BaseChartDirective,
  ],
  templateUrl: './principal-dashboard.component.html',
  styleUrls: ['./principal-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrincipalDashboardComponent implements OnInit {
  private readonly dashboardService = inject(PrincipalDashboardService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly dashboardData = signal<PrincipalDashboardPayload | null>(null);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly processingId = signal<number | null>(null);

  readonly doughnutChartRef = viewChild<ElementRef<HTMLCanvasElement>>('doughnutCanvas');

  ngOnInit(): void {
    this.loadDashboard();
  }

  refresh(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.dashboardService.getPrincipalSummary().subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Unable to load dashboard data. Please try again.');
        this.isLoading.set(false);
      },
    });
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
        change: '+12',
        changeType: 'positive',
      },
      {
        label: 'Total Staff',
        value: k.totalStaff.toString(),
        icon: 'badge',
        colorClass: 'kpi-indigo',
        change: '+3',
        changeType: 'positive',
      },
      {
        label: 'Fee Collection',
        value: `KES ${k.feeCollection}M`,
        icon: 'account_balance',
        colorClass: 'kpi-green',
        change: '+8.2%',
        changeType: 'positive',
      },
      {
        label: 'Active Incidents',
        value: k.activeIncidents.toString(),
        icon: 'warning',
        colorClass: k.activeIncidents > 0 ? 'kpi-red-pulse' : 'kpi-green',
        change: k.activeIncidents > 0 ? 'Needs attention' : 'All clear',
        changeType: k.activeIncidents > 0 ? 'negative' : 'positive',
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
        datasets: [
          {
            data: [data.financialHealth.collected, data.financialHealth.pending, data.financialHealth.overdue],
            backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
            borderWidth: 0,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '85%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#64748b',
              padding: 16,
              font: { size: 12, family: 'Inter' },
              boxWidth: 12,
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw as number;
                return ` ${context.label}: KES ${value.toLocaleString()}`;
              },
            },
          },
        },
      },
    };
  });

  readonly financialTotal = computed(() => {
    const data = this.dashboardData();
    if (!data) return 0;
    return data.financialHealth.total;
  });

  reviewApproval(approval: PrincipalDashboardPayload['pendingApprovals'][0]): void {
    const ref = this.dialog.open<ReviewApprovalDialogComponent, PrincipalDashboardPayload['pendingApprovals'][0], ReviewApprovalResult>(
      ReviewApprovalDialogComponent,
      { data: approval, width: '480px' },
    );
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      if (result.action === 'approve') {
        this.doApprove(approval.id);
      } else {
        this.doReject(approval.id, result.reason ?? 'No reason provided');
      }
    });
  }

  approveApproval(approval: PrincipalDashboardPayload['pendingApprovals'][0]): void {
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
    this.dashboardData.update(d => d ? { ...d, pendingApprovals: d.pendingApprovals.filter(a => a.id !== id) } : null);
  }

  formatCurrency(value: number): string {
    if (value >= 1000000) {
      return `KES ${(value / 1000000).toFixed(1)}M`;
    }
    return `KES ${value.toLocaleString()}`;
  }

  getOperationIcon(type: string): string {
    const icons: Record<string, string> = {
      info: 'info',
      warning: 'warning',
      alert: 'error',
      success: 'check_circle',
    };
    return icons[type] || 'info';
  }

  getOperationColor(type: string): string {
    const colors: Record<string, string> = {
      info: 'op-info',
      warning: 'op-warning',
      alert: 'op-alert',
      success: 'op-success',
    };
    return colors[type] || 'op-info';
  }

  getPriorityClass(priority: string): string {
    const classes: Record<string, string> = {
      high: 'priority-high',
      medium: 'priority-medium',
      low: 'priority-low',
    };
    return classes[priority] || 'priority-low';
  }

  formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }
}