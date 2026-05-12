import { Component, inject, OnInit, ChangeDetectionStrategy, effect, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import Chart from 'chart.js/auto';
import { StaffService } from '../../services/staff.service';

@Component({
  selector: 'app-payroll-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="payroll-container">

      <header class="page-header">
        <div class="title-section">
          <h1>Payroll Summary</h1>
          <p class="subtitle">Monthly payroll overview & departmental cost breakdown</p>
        </div>
      </header>

      @if (staffService.payrollError(); as err) {
        <div class="error-alert" role="alert">
          <mat-icon>error</mat-icon>
          <span>{{ err }}</span>
        </div>
      }

      @if (staffService.payrollSummary(); as summary) {

        <!-- KPI Cards -->
        <div class="kpi-grid">
          <mat-card class="kpi-card">
            <mat-card-content>
              <div class="kpi-icon payroll">
                <mat-icon>payments</mat-icon>
              </div>
              <div class="kpi-info">
                <span class="kpi-value">{{ summary.total_payroll | currency:'KES':'symbol-narrow':'1.0-0' }}</span>
                <span class="kpi-label">Monthly Payroll</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="kpi-card">
            <mat-card-content>
              <div class="kpi-icon staff">
                <mat-icon>group</mat-icon>
              </div>
              <div class="kpi-info">
                <span class="kpi-value">{{ summary.total_staff }}</span>
                <span class="kpi-label">Active Staff</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="kpi-card">
            <mat-card-content>
              <div class="kpi-icon departments">
                <mat-icon>account_balance</mat-icon>
              </div>
              <div class="kpi-info">
                <span class="kpi-value">{{ summary.departments }}</span>
                <span class="kpi-label">Departments</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="kpi-card">
            <mat-card-content>
              <div class="kpi-icon leave">
                <mat-icon>event_busy</mat-icon>
              </div>
              <div class="kpi-info">
                <span class="kpi-value">{{ summary.on_leave }}</span>
                <span class="kpi-label">On Leave</span>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Chart + Table Side by Side -->
        @if (summary.department_breakdown?.length) {
          <div class="analytics-grid">

            <!-- Donut Chart -->
            <mat-card class="chart-card">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>pie_chart</mat-icon>
                  Cost Distribution
                </mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="chart-wrapper">
                  <canvas #payrollCanvas></canvas>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Departmental Cost Breakdown -->
            <mat-card class="dept-card">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>account_balance</mat-icon>
                  Department Cost Breakdown
                </mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="table-container">
                  <table mat-table [dataSource]="summary.department_breakdown">

                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Department</th>
                  <td mat-cell *matCellDef="let dept">
                    <span class="dept-name">{{ dept.name }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="count">
                  <th mat-header-cell *matHeaderCellDef>Staff Count</th>
                  <td mat-cell *matCellDef="let dept">
                    <span class="staff-count">{{ dept.count }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="payroll">
                  <th mat-header-cell *matHeaderCellDef>Payroll Cost</th>
                  <td mat-cell *matCellDef="let dept">
                    <span class="cost-value">{{ dept.payroll | currency:'KES':'symbol-narrow':'1.0-0' }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="percentage">
                  <th mat-header-cell *matHeaderCellDef>% of Payroll</th>
                  <td mat-cell *matCellDef="let dept">
                    <span class="percentage-value">{{ getPercentage(dept.payroll) }}</span>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="deptColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: deptColumns;"></tr>

                <tr class="mat-row no-data-row" *matNoDataRow>
                  <td class="mat-cell" [attr.colspan]="deptColumns.length">
                    <div class="no-data-message">
                      <mat-icon>account_balance</mat-icon>
                      <p>No department data available</p>
                    </div>
                  </td>
                </tr>
              </table>
            </div>
          </mat-card-content>
        </mat-card>

          </div>
        } @else {
          <div class="loading-container">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Loading department data...</p>
          </div>
        }

      } @else {
        <div class="loading-container">
          <mat-spinner diameter="48"></mat-spinner>
          <p>Loading payroll summary...</p>
        </div>
      }

    </div>
  `,
  styles: [`
    .payroll-container { padding: 24px; }

    .page-header {
      margin-bottom: 24px;
    }
    .page-header h1 { font-size: 24px; font-weight: 600; margin: 0 0 4px; }
    .page-header .subtitle { color: #6b7280; margin: 0; }

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

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .kpi-card {
      border-radius: 12px;
    }
    .kpi-card mat-card-content {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
    }

    .kpi-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .kpi-icon mat-icon { font-size: 24px; width: 24px; height: 24px; }
    .kpi-icon.payroll { background: #dbeafe; color: #3b82f6; }
    .kpi-icon.staff { background: #d1fae5; color: #059669; }
    .kpi-icon.departments { background: #ede9fe; color: #7c3aed; }
    .kpi-icon.leave { background: #fef3c7; color: #d97706; }

    .kpi-info { display: flex; flex-direction: column; }
    .kpi-value { font-size: 1.5rem; font-weight: 700; color: #1f2937; line-height: 1.2; }
    .kpi-label { font-size: 0.8rem; color: #6b7280; margin-top: 2px; }

    .analytics-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }

    .chart-card {
      border-radius: 12px;
      display: flex;
      flex-direction: column;
    }
    .chart-card mat-card-header { padding: 20px 24px 0; }
    .chart-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.1rem;
      font-weight: 600;
    }
    .chart-card mat-card-title mat-icon { color: #6b7280; }
    .chart-card mat-card-content {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px 24px 24px;
    }
    .chart-wrapper {
      width: 100%;
      max-width: 320px;
    }

    .dept-card { border-radius: 12px; }
    .dept-card mat-card-header { padding: 20px 24px 0; }
    .dept-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.1rem;
      font-weight: 600;
    }
    .dept-card mat-card-title mat-icon { color: #6b7280; }

    .table-container { overflow-x: auto; }
    table { width: 100%; }
    .mat-mdc-header-cell { font-weight: 600; color: #374151; background: #f9fafb; }

    .dept-name { font-weight: 500; }
    .staff-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 28px;
      padding: 2px 10px;
      border-radius: 12px;
      background: #e5e7eb;
      font-weight: 600;
      font-size: 0.85rem;
    }
    .cost-value { font-weight: 600; color: #059669; }
    .percentage-value { color: #6b7280; font-weight: 500; }

    .no-data-row .mat-cell { padding: 48px 24px; text-align: center; }
    .no-data-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      color: #9ca3af;
    }
    .no-data-message mat-icon { font-size: 48px; width: 48px; height: 48px; }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 80px 24px;
      color: #6b7280;
    }

    @media (max-width: 900px) {
      .analytics-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class PayrollSummaryComponent implements OnInit {
  readonly staffService = inject(StaffService);

  readonly deptColumns = ['name', 'count', 'payroll', 'percentage'];

  private chartInstance: Chart | null = null;
  readonly payrollCanvas = viewChild<ElementRef<HTMLCanvasElement>>('payrollCanvas');

  constructor() {
    effect(() => {
      const summary = this.staffService.payrollSummary();
      if (summary?.department_breakdown?.length) {
        setTimeout(() => this.renderChart(summary.department_breakdown));
      }
    });
  }

  ngOnInit(): void {
    this.staffService.loadPayrollSummary();
  }

  private renderChart(breakdown: { name: string; count: number; payroll: number }[]): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const canvasEl = this.payrollCanvas()?.nativeElement;
    if (!canvasEl) return;

    const labels = breakdown.map((d) => d.name);
    const data = breakdown.map((d) => d.payroll);
    const colors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
      '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
    ];

    this.chartInstance = new Chart(canvasEl, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors.slice(0, data.length),
            borderWidth: 2,
            borderColor: '#ffffff',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 16,
              usePointStyle: true,
              font: { size: 12 },
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const value = ctx.raw as number;
                const formatted = new Intl.NumberFormat('en-KE', {
                  style: 'currency',
                  currency: 'KES',
                  minimumFractionDigits: 0,
                }).format(value);
                return ` ${ctx.label}: ${formatted}`;
              },
            },
          },
        },
      },
    });
  }

  getPercentage(payroll: number): string {
    const summary = this.staffService.payrollSummary();
    if (!summary || summary.total_payroll === 0) return '0%';
    const pct = (payroll / summary.total_payroll) * 100;
    return pct.toFixed(1) + '%';
  }
}
