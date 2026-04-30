/**
 * Admin Dashboard Page
 * Principal's Command Center with aggregated metrics
 */

import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { Subject, takeUntil } from 'rxjs';
import { AdminDashboardService } from '../../../../core/services/admin-dashboard.service';
import { StatusBadgeComponent, type BadgeType } from '../../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatButtonModule,
    MatChipsModule,
    StatusBadgeComponent,
  ],
  template: `
    <div class="dashboard-page">
      <header class="page-header">
        <h1>Dashboard</h1>
        <p class="subtitle">Real-time overview of the institution</p>
        <button mat-button (click)="refresh()" [disabled]="isLoading()">
          <mat-icon>refresh</mat-icon>
          Refresh
        </button>
      </header>

      @if (error()) {
        <div class="error-alert">
          <mat-icon>error</mat-icon>
          <span>{{ error() }}</span>
        </div>
      }

      <div class="metrics-grid">
        <!-- Enrollment Card -->
        <mat-card class="metric-card">
          <mat-card-header>
            <mat-icon mat-card-avatar class="icon-blue">school</mat-icon>
            <mat-card-title>Enrollment</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (dashboardData(); as data) {
              <div class="metric-value">{{ data.enrollment_health.total_active_students }}</div>
              <div class="metric-label">Active Students</div>
              <mat-progress-bar 
                mode="determinate" 
                [value]="data.enrollment_health.capacity_utilization_percent"
                color="primary">
              </mat-progress-bar>
              <div class="metric-detail">
                {{ data.enrollment_health.capacity_utilization_percent.toFixed(1) }}% capacity utilized
                ({{ data.enrollment_health.pending_admissions }} pending admissions)
              </div>
            } @else {
              <div class="loading-placeholder">Loading...</div>
            }
          </mat-card-content>
        </mat-card>

        <!-- Attendance Card -->
        <mat-card class="metric-card">
          <mat-card-header>
            <mat-icon mat-card-avatar class="icon-green">how_to_reg</mat-icon>
            <mat-card-title>Today's Attendance</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (dashboardData(); as data) {
              <div class="attendance-stats">
                <div class="stat">
                  <span class="stat-value">{{ data.daily_attendance.students_present_percent.toFixed(1) }}%</span>
                  <span class="stat-label">Students</span>
                </div>
                <div class="stat">
                  <span class="stat-value">{{ data.daily_attendance.staff_present_percent.toFixed(1) }}%</span>
                  <span class="stat-label">Staff</span>
                </div>
              </div>
              <div class="metric-detail">
                {{ data.daily_attendance.absentee_count }} absentees
              </div>
            } @else {
              <div class="loading-placeholder">Loading...</div>
            }
          </mat-card-content>
        </mat-card>

        <!-- Finance Card -->
        <mat-card class="metric-card">
          <mat-card-header>
            <mat-icon mat-card-avatar class="icon-amber">account_balance</mat-icon>
            <mat-card-title>Financial Health</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (dashboardData(); as data) {
              <div class="finance-stats">
                <div class="stat-row">
                  <span class="stat-label">Collection Rate</span>
                  <span class="stat-value">{{ data.financial_health.collection_rate_percent.toFixed(1) }}%</span>
                </div>
                <mat-progress-bar 
                  mode="determinate" 
                  [value]="data.financial_health.collection_rate_percent"
                  color="accent">
                </mat-progress-bar>
              </div>
              <div class="metric-detail">
                {{ formatCurrency(data.financial_health.outstanding_arrears_kes) }} outstanding
                <br>
                {{ data.financial_health.pending_expense_approvals }} expenses pending approval
              </div>
            } @else {
              <div class="loading-placeholder">Loading...</div>
            }
          </mat-card-content>
        </mat-card>

        <!-- System Alerts -->
        <mat-card class="metric-card alerts-card">
          <mat-card-header>
            <mat-icon mat-card-avatar class="icon-red">notifications_active</mat-icon>
            <mat-card-title>System Alerts</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (dashboardData(); as data) {
              @if (data.system_alerts.length > 0) {
                <div class="alerts-list">
                  @for (alert of data.system_alerts; track alert.message) {
                    <div class="alert-item" [class]="'alert-' + alert.severity.toLowerCase()">
                      <app-status-badge [type]="getSeverityType(alert.severity)"></app-status-badge>
                      <span class="alert-module">{{ alert.module }}</span>
                      <p class="alert-message">{{ alert.message }}</p>
                    </div>
                  }
                </div>
              } @else {
                <div class="no-alerts">
                  <mat-icon>check_circle</mat-icon>
                  <span>All systems operational</span>
                </div>
              }
            } @else {
              <div class="loading-placeholder">Loading...</div>
            }
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page {
      padding: 24px;
    }

    .page-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 32px;

      h1 {
        font-size: 28px;
        font-weight: 600;
        margin: 0;
      }

      .subtitle {
        color: #6b7280;
        margin: 0;
        flex: 1;
      }
    }

    .error-alert {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px;
      background: #fee2e2;
      border-radius: 8px;
      color: #dc2626;
      margin-bottom: 24px;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
    }

    .metric-card {
      border-radius: 12px;

      mat-card-header {
        padding-bottom: 16px;
      }

      mat-card-title {
        font-size: 16px;
        font-weight: 600;
        margin: 0;
      }
    }

    .icon-blue { color: #3b82f6; }
    .icon-green { color: #10b981; }
    .icon-amber { color: #f59e0b; }
    .icon-red { color: #ef4444; }

    .metric-value {
      font-size: 36px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 4px;
    }

    .metric-label {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 16px;
    }

    .metric-detail {
      font-size: 13px;
      color: #6b7280;
      margin-top: 12px;
    }

    .attendance-stats {
      display: flex;
      gap: 32px;
      margin-bottom: 16px;

      .stat {
        display: flex;
        flex-direction: column;

        .stat-value {
          font-size: 28px;
          font-weight: 600;
          color: #1f2937;
        }

        .stat-label {
          font-size: 13px;
          color: #6b7280;
        }
      }
    }

    .finance-stats {
      .stat-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;

        .stat-label {
          font-size: 14px;
          color: #6b7280;
        }

        .stat-value {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        }
      }
    }

    .alerts-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .alert-item {
      padding: 12px;
      border-radius: 8px;
      background: #f9fafb;

      &.alert-critical {
        background: #fee2e2;
      }

      &.alert-warning {
        background: #ffedd5;
      }
    }

    .alert-module {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: #6b7280;
      margin-left: 8px;
    }

    .alert-message {
      font-size: 13px;
      margin: 8px 0 0 0;
      color: #374151;
    }

    .no-alerts {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 24px;
      color: #10b981;

      mat-icon {
        color: #10b981;
      }
    }

    .loading-placeholder {
      padding: 32px;
      text-align: center;
      color: #9ca3af;
    }
  `],
})
export class DashboardPageComponent implements OnInit, OnDestroy {
  private dashboardService = inject(AdminDashboardService);
  private destroy$ = new Subject<void>();

  readonly dashboardData = this.dashboardService.dashboardData;
  readonly isLoading = this.dashboardService.isLoading;
  readonly error = this.dashboardService.error;

  ngOnInit(): void {
    this.dashboardService.getDashboardSummary(true)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refresh(): void {
    this.dashboardService.refreshDashboard();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  getSeverityType(severity: string): BadgeType {
    const severityMap: Record<string, BadgeType> = {
      'CRITICAL': 'critical',
      'WARNING': 'warning',
      'INFO': 'info',
    };
    return severityMap[severity] || 'info';
  }
}
