import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { FinanceService } from '../../services/finance.service';
import type { InventoryItem } from '../../../../shared/models/finance.models';

@Component({
  selector: 'app-finance-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
    BaseChartDirective,
  ],
  providers: [provideCharts(withDefaultRegisterables())],
  template: `
    <div class="dashboard-container">
      <header class="page-header">
        <div class="title-section">
          <h1>Principal's Finance Dashboard</h1>
          <p class="subtitle">Real-time financial overview & executive insights</p>
        </div>
        <div class="header-actions">
          <button mat-stroked-button (click)="refreshDashboard()" [disabled]="dashboardLoading()">
            <mat-icon>refresh</mat-icon>
            Refresh
          </button>
        </div>
      </header>

      @if (dashboardLoading() && !dashboardData()) {
        <mat-progress-bar mode="indeterminate"></mat-progress-bar>
        <div class="skeleton-grid">
          <div class="skeleton-card" *ngFor="let _ of [1,2,3,4]"><div class="skeleton-pulse"></div></div>
        </div>
      } @else if (dashboardError(); as err) {
        <div class="error-alert">
          <mat-icon>error</mat-icon>
          <span>{{ err }}</span>
          <button mat-button color="primary" (click)="loadDashboard()">Retry</button>
        </div>
      } @else if (dashboardData(); as data) {
        <!-- KPI Summary Tiles -->
        <div class="kpi-grid">
          <mat-card class="kpi-card">
            <mat-card-content>
              <div class="kpi-header">
                <div class="kpi-icon collection-icon">
                  <mat-icon>account_balance_wallet</mat-icon>
                </div>
                <span class="kpi-label">Collection Progress</span>
              </div>
              <div class="kpi-chart-container">
                @if (collectionChartConfig(); as config) {
                  <canvas baseChart
                    [type]="config.type"
                    [data]="config.data"
                    [options]="config.options"
                    [plugins]="config.plugins ?? []">
                  </canvas>
                }
              </div>
              <div class="kpi-stats">
                <div class="kpi-stat">
                  <span class="stat-dot collected"></span>
                  <span class="stat-label">Collected</span>
                  <span class="stat-value">{{ formatCurrency(data.fee_statistics.total_collected) }}</span>
                </div>
                <div class="kpi-stat">
                  <span class="stat-dot arrears"></span>
                  <span class="stat-label">Arrears</span>
                  <span class="stat-value warn">{{ formatCurrency(data.fee_statistics.outstanding_arrears) }}</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="kpi-card">
            <mat-card-content>
              <div class="kpi-header">
                <div class="kpi-icon cash-icon">
                  <mat-icon>payments</mat-icon>
                </div>
                <span class="kpi-label">Cash Position</span>
              </div>
              <div class="kpi-big-value">{{ formatCurrency(data.cash_flow[0]?.cash_on_hand ?? 0) }}</div>
              <div class="kpi-meta">
                <span class="meta-item">
                  <strong>Burn Rate:</strong> {{ formatCurrency(data.cash_flow[0]?.total_expenses ?? 0) }}/mo
                </span>
                <span class="meta-item" [class.healthy]="runway() >= 3"
                      [class.warning]="runway() >= 1 && runway() < 3"
                      [class.danger]="runway() < 1">
                  <strong>Runway:</strong> {{ runway().toFixed(1) }} months
                </span>
              </div>
              <div class="net-income-row">
                <span class="net-income-label">Net Income</span>
                <span class="net-income-value" [class.text-danger]="netIncome() < 0">
                  {{ formatCurrency(netIncome()) }}
                </span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="kpi-card">
            <mat-card-content>
              <div class="kpi-header">
                <div class="kpi-icon inventory-icon">
                  <mat-icon>inventory_2</mat-icon>
                </div>
                <span class="kpi-label">Inventory Health</span>
              </div>
              <div class="kpi-big-value">{{ formatCurrency(data.inventory_health.total_value) }}</div>
              <div class="kpi-meta">
                <span class="meta-item">{{ data.inventory_health.low_stock_count }} low stock items</span>
                @if ((data.inventory_health.pending_verifications ?? 0) > 0) {
                  <span class="red-alert-badge">
                    <mat-icon>warning</mat-icon>
                    {{ data.inventory_health.pending_verifications }} pending verification
                  </span>
                }
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="kpi-card" [class.needs-action]="(data.inventory_health.pending_verifications ?? 0) > 0">
            <mat-card-content>
              <div class="kpi-header">
                <div class="kpi-icon verification-icon">
                  <mat-icon>fact_check</mat-icon>
                </div>
                <span class="kpi-label">Verification Status</span>
              </div>
              @if ((data.inventory_health.pending_verifications ?? 0) > 0) {
                <div class="kpi-big-value action-needed">
                  {{ data.inventory_health.pending_verifications }}
                  <span class="action-label">Needs Action</span>
                </div>
                <div class="kpi-meta">
                  <span>Last verified: {{ data.verification_status?.last_verified ? (data.verification_status.last_verified | date:'mediumDate') : 'N/A' }}</span>
                </div>
              } @else {
                <div class="kpi-big-value all-clear">
                  <mat-icon>check_circle</mat-icon>
                  All Clear
                </div>
                <div class="kpi-meta">
                  <span>All items verified</span>
                </div>
              }
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Detailed Analytics Row -->
        <div class="analytics-grid">
          <mat-card class="expense-card">
            <mat-card-header>
              <mat-card-title>Expense Breakdown by Category</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-container">
                @if (data.expense_summary?.length && expenseChartConfig(); as config) {
                  <canvas baseChart
                    [type]="config.type"
                    [data]="config.data"
                    [options]="config.options"
                    [plugins]="config.plugins ?? []">
                  </canvas>
                } @else {
                  <div class="empty-state">
                    <mat-icon>bar_chart</mat-icon>
                    <p>No expense data available</p>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="activity-card">
            <mat-card-header>
              <mat-card-title>Recent Activity</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="activity-feed">
                @for (item of data.recent_activity; track item.id) {
                  <div class="activity-item" [class]="'type-' + item.type">
                    <div class="activity-icon-wrapper">
                      <mat-icon class="activity-icon" [class.text-success]="item.type === 'payment'"
                                             [class.text-warning]="item.type === 'purchase'">{{ activityIcon(item.type) }}</mat-icon>
                    </div>
                    <div class="activity-body">
                      <p class="activity-desc">{{ item.description }}</p>
                      <div class="activity-meta">
                        <span class="activity-amount" [class.outflow]="item.type === 'purchase' || item.type === 'requisition' || item.type === 'expense'">
                          {{ formatCurrency(item.amount) }}
                        </span>
                        <span class="activity-time">{{ item.timestamp | date:'short' }}</span>
                      </div>
                    </div>
                  </div>
                } @empty {
                  <div class="empty-state">
                    <mat-icon>inbox</mat-icon>
                    <p>No recent activity recorded</p>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Report Center & Inventory Verification -->
        <div class="bottom-grid">
          <mat-card class="report-card">
            <mat-card-header>
              <mat-card-title>Report Center</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="report-actions">
                <button mat-raised-button color="primary" (click)="downloadReport('pdf', 'financial_statement')" [disabled]="reportLoading()">
                  <mat-icon>picture_as_pdf</mat-icon>
                  Generate Financial Statement (PDF)
                </button>
                <button mat-raised-button color="accent" (click)="downloadReport('xlsx', 'aging_debt')" [disabled]="reportLoading()">
                  <mat-icon>table_chart</mat-icon>
                  Export Aging Debt (Excel)
                </button>
              </div>
              @if (reportError()) {
                <div class="report-error">
                  <mat-icon>error_outline</mat-icon>
                  <span>{{ reportError() }}</span>
                </div>
              }
            </mat-card-content>
          </mat-card>

          <mat-card class="inventory-card">
            <mat-card-header>
              <mat-card-title>Inventory Verification</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="inventory-list">
                @for (item of data.inventory; track item.id) {
                  <div class="inventory-item" [class.critical]="item.quantity === 0"
                       [class.low]="item.quantity > 0 && item.quantity <= item.min_threshold">
                    <div class="inventory-info">
                      <span class="item-name">{{ item.name }}</span>
                      <div class="item-details">
                        <span class="item-qty" [class.danger-text]="item.quantity <= item.min_threshold">
                          Qty: {{ item.quantity }} / Min: {{ item.min_threshold }}
                        </span>
                        <span class="item-verified">
                          Last: {{ item.last_verified | date:'mediumDate' }}
                        </span>
                      </div>
                    </div>
                    <button mat-icon-button color="primary" (click)="verifyItem(item)" [disabled]="verifyingIds().has(item.id)" matTooltip="Mark as verified">
                      @if (verifyingIds().has(item.id)) {
                        <mat-spinner diameter="20"></mat-spinner>
                      } @else {
                        <mat-icon>verified</mat-icon>
                      }
                    </button>
                  </div>
                } @empty {
                  <div class="empty-state">
                    <mat-icon>checklist</mat-icon>
                    <p>No inventory items to verify</p>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      } @else {
        <div class="loading-spinner">
          <mat-spinner diameter="48"></mat-spinner>
          <p>Crunching school records...</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-container { padding: 24px; max-width: 1400px; margin: 0 auto; }

    .page-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    .page-header .title-section h1 { font-size: 24px; font-weight: 600; margin: 0 0 4px 0; }
    .page-header .title-section .subtitle { color: #6b7280; margin: 0; }

    .error-alert { display: flex; align-items: center; gap: 8px; padding: 16px; background: #fee2e2; border-radius: 8px; color: #dc2626; margin-bottom: 24px; }

    .skeleton-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 24px; }
    @media (max-width: 1200px) { .skeleton-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 600px) { .skeleton-grid { grid-template-columns: 1fr; } }
    .skeleton-card { height: 200px; border-radius: 12px; background: #f1f5f9; overflow: hidden; }
    .skeleton-pulse { width: 100%; height: 100%; background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    .loading-spinner { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 0; gap: 16px; color: #64748b; font-size: 0.875rem; }

    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 24px; }
    @media (max-width: 1200px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 600px) { .kpi-grid { grid-template-columns: 1fr; } }

    .kpi-card { border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.07); overflow: hidden; }
    .kpi-card mat-card-content { padding: 20px; }
    .kpi-card.needs-action { border-left: 4px solid #f59e0b; background: #fffbeb; }

    .kpi-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .kpi-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .kpi-icon mat-icon { color: white; font-size: 20px; width: 20px; height: 20px; }
    .collection-icon { background: #10b981; }
    .cash-icon { background: #3b82f6; }
    .inventory-icon { background: #8b5cf6; }
    .verification-icon { background: #f59e0b; }

    .kpi-label { font-size: 0.8125rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }

    .kpi-chart-container { height: 120px; margin-bottom: 12px; }

    .kpi-big-value { font-size: 1.625rem; font-weight: 700; color: #1e293b; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
    .kpi-big-value.action-needed { color: #d97706; flex-direction: column; align-items: flex-start; gap: 2px; font-size: 2rem; }
    .kpi-big-value .action-label { font-size: 0.75rem; font-weight: 500; color: #92400e; text-transform: uppercase; letter-spacing: 0.3px; }
    .kpi-big-value.all-clear { color: #059669; font-size: 1.25rem; }
    .kpi-big-value.all-clear mat-icon { font-size: 24px; width: 24px; height: 24px; }

    .kpi-stats { display: flex; flex-direction: column; gap: 8px; }
    .kpi-stat { display: flex; align-items: center; gap: 8px; font-size: 0.8125rem; }
    .kpi-stat .stat-label { color: #64748b; min-width: 60px; }
    .kpi-stat .stat-value { font-weight: 600; color: #1e293b; margin-left: auto; }
    .kpi-stat .stat-value.warn { color: #d97706; }
    .stat-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .stat-dot.collected { background: #10b981; }
    .stat-dot.arrears { background: #f59e0b; }

    .kpi-meta { display: flex; flex-direction: column; gap: 4px; font-size: 0.8125rem; color: #64748b; }
    .kpi-meta .meta-item { display: flex; gap: 4px; }
    .kpi-meta .meta-item.healthy { color: #059669; }
    .kpi-meta .meta-item.warning { color: #d97706; }
    .kpi-meta .meta-item.danger { color: #dc2626; font-weight: 600; }

    .net-income-row { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; padding-top: 12px; border-top: 1px solid #f1f5f9; }
    .net-income-label { font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px; }
    .net-income-value { font-size: 1rem; font-weight: 700; color: #1e293b; }
    .net-income-value.text-danger { color: #dc2626; }

    .red-alert-badge { display: inline-flex; align-items: center; gap: 4px; background: #fef2f2; color: #dc2626; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; margin-top: 4px; }
    .red-alert-badge mat-icon { font-size: 14px; width: 14px; height: 14px; }

    .analytics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    @media (max-width: 900px) { .analytics-grid { grid-template-columns: 1fr; } }

    .expense-card, .activity-card, .report-card, .inventory-card { border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.07); }
    mat-card-header { padding: 20px 20px 0; }
    mat-card-title { font-size: 0.9375rem; font-weight: 600; color: #1e293b; }
    mat-card-content { padding: 20px; }

    .chart-container { height: 280px; position: relative; }

    .activity-feed { display: flex; flex-direction: column; gap: 4px; max-height: 360px; overflow-y: auto; }

    .activity-item { display: flex; gap: 12px; padding: 12px; border-radius: 8px; transition: background 0.15s; }
    .activity-item:hover { background: #f8fafc; }

    .activity-icon-wrapper { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .type-payment .activity-icon-wrapper { background: #dcfce7; }
    .type-requisition .activity-icon-wrapper { background: #fef3c7; }
    .type-expense .activity-icon-wrapper { background: #fee2e2; }
    .type-credit_note .activity-icon-wrapper { background: #dbeafe; }

    .activity-icon { font-size: 18px; width: 18px; height: 18px; }
    .text-success { color: #16a34a; }
    .text-warning { color: #d97706; }
    .type-payment .activity-icon { color: #16a34a; }
    .type-requisition .activity-icon { color: #d97706; }
    .type-expense .activity-icon { color: #dc2626; }
    .type-credit_note .activity-icon { color: #2563eb; }

    .activity-body { flex: 1; min-width: 0; }
    .activity-desc { margin: 0 0 4px; font-size: 0.8125rem; color: #334155; line-height: 1.4; }
    .activity-meta { display: flex; align-items: center; gap: 12px; font-size: 0.75rem; }
    .activity-amount { font-weight: 600; color: #059669; }
    .activity-amount.outflow { color: #dc2626; }
    .activity-time { color: #94a3b8; }

    .bottom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    @media (max-width: 900px) { .bottom-grid { grid-template-columns: 1fr; } }

    .report-actions { display: flex; flex-direction: column; gap: 12px; }
    .report-actions button { display: flex; align-items: center; gap: 8px; padding: 16px; justify-content: center; font-size: 0.875rem; }

    .report-error { display: flex; align-items: center; gap: 8px; margin-top: 12px; padding: 12px; background: #fef2f2; border-radius: 8px; color: #dc2626; font-size: 0.8125rem; }

    .inventory-list { display: flex; flex-direction: column; gap: 8px; max-height: 360px; overflow-y: auto; }

    .inventory-item { display: flex; align-items: center; justify-content: space-between; padding: 12px; border-radius: 8px; border: 1px solid #f1f5f9; transition: all 0.15s; }
    .inventory-item:hover { border-color: #e2e8f0; background: #f8fafc; }
    .inventory-item.critical { background: #fef2f2; border-color: #fecaca; }
    .inventory-item.low { background: #fffbeb; border-color: #fde68a; }

    .inventory-info { display: flex; flex-direction: column; gap: 4px; }
    .item-name { font-size: 0.875rem; font-weight: 500; color: #1e293b; }
    .item-details { display: flex; gap: 16px; font-size: 0.75rem; color: #64748b; }
    .item-qty.danger-text { color: #dc2626; font-weight: 600; }
    .item-verified { color: #94a3b8; }

    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px 16px; color: #94a3b8; text-align: center; }
    .empty-state mat-icon { font-size: 40px; width: 40px; height: 40px; opacity: 0.5; }
    .empty-state p { margin: 0; font-size: 0.875rem; }

    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
  `],
})
export class DashboardComponent implements OnInit {
  private financeService = inject(FinanceService);
  private snackBar = inject(MatSnackBar);

  readonly dashboardData = this.financeService.dashboardData;
  readonly dashboardLoading = this.financeService.dashboardLoading;
  readonly dashboardError = this.financeService.dashboardError;

  readonly reportLoading = signal(false);
  readonly reportError = signal<string | null>(null);
  readonly verifyingIds = signal<Set<number>>(new Set());

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.financeService.getDashboardData().subscribe({
      next: (data) => {
        this.financeService.dashboardData.set(data);
        this.financeService.dashboardLoading.set(false);
      },
      error: () => {},
    });
  }

  refreshDashboard(): void {
    this.loadDashboard();
  }

  readonly netIncome = computed(() => {
    const data = this.dashboardData();
    if (!data?.cash_flow?.length) return 0;
    return data.cash_flow[0]?.net_income ?? 0;
  });

  readonly runway = computed(() => {
    const data = this.dashboardData();
    const expenses = data?.cash_flow?.[0]?.total_expenses ?? 0;
    const cash = data?.cash_flow?.[0]?.cash_on_hand ?? 0;
    if (expenses <= 0) return 0;
    return cash / expenses;
  });

  private getFallbackChartConfig<T extends ChartType>(type: T): ChartConfiguration<T> {
    return {
      type,
      plugins: [],
      data: {
        labels: [],
        datasets: [{ data: [] as number[] }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    } as unknown as ChartConfiguration<T>;
  }

  readonly collectionChartConfig = computed<ChartConfiguration<'doughnut'>>(() => {
    const data = this.dashboardData();
    const stats = data?.fee_statistics;

    if (!stats) {
      return this.getFallbackChartConfig('doughnut');
    }

    const collected = stats.total_collected ?? 0;
    const arrears = stats.outstanding_arrears ?? 0;

    return {
      type: 'doughnut',
      plugins: [],
      data: {
        labels: ['Collected', 'Arrears'],
        datasets: [{
          data: [collected, arrears],
          backgroundColor: ['#10b981', '#f43f5e'],
          borderWidth: 0,
          hoverOffset: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const total = collected + arrears;
                const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : '0.0';
                return ` ${ctx.label}: ${this.formatCurrency(ctx.parsed)} (${pct}%)`;
              },
            },
          },
        },
      },
    };
  });

  readonly expenseChartConfig = computed<ChartConfiguration<'bar'>>(() => {
    const data = this.dashboardData();
    const summary = data?.expense_summary;

    if (!summary || summary.length === 0) {
      return this.getFallbackChartConfig('bar');
    }

    const labels = summary.map((e) => e.category ?? '');
    const totals = summary.map((e) => e.total ?? 0);

    return {
      type: 'bar',
      plugins: [],
      data: {
        labels,
        datasets: [
          {
            label: 'Total Spent',
            data: totals,
            backgroundColor: '#3b82f6',
            borderRadius: 4,
            maxBarThickness: 36,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { boxWidth: 12, padding: 12, font: { size: 11 } },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 } } },
          y: {
            beginAtZero: true,
            ticks: {
              font: { size: 10 },
              callback: (val) => this.formatCurrency(Number(val)),
            },
            grid: { color: '#f1f5f9' },
          },
        },
      },
    };
  });

  activityIcon(type: string): string {
    switch (type) {
      case 'payment': return 'arrow_downward';
      case 'purchase': return 'shopping_cart';
      case 'requisition': return 'assignment';
      case 'expense': return 'arrow_upward';
      case 'credit_note': return 'assignment_return';
      default: return 'circle';
    }
  }

  formatCurrency(amount: number): string {
    if (typeof amount !== 'number' || isNaN(amount)) return 'Ksh 0';
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  downloadReport(format: 'pdf' | 'xlsx', type: 'financial_statement' | 'aging_debt'): void {
    this.reportLoading.set(true);
    this.reportError.set(null);
    this.financeService.downloadReport(format, type).subscribe({
      next: (blob) => {
        this.reportLoading.set(false);
        const mimeType = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        const file = new Blob([blob], { type: mimeType });
        const fileURL = URL.createObjectURL(file);
        const filename = `${type}_${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
        const link = document.createElement('a');
        link.href = fileURL;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(fileURL);
        this.snackBar.open(`${type === 'financial_statement' ? 'Financial Statement' : 'Aging Debt'} report downloaded`, 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.reportLoading.set(false);
        this.reportError.set(err.message || 'Failed to download report');
      },
    });
  }

  verifyItem(item: InventoryItem): void {
    const ids = this.verifyingIds();
    ids.add(item.id);
    this.verifyingIds.set(new Set(ids));

    this.financeService.verifyItem(item.id).subscribe({
      next: (response) => {
        const data = this.dashboardData();
        if (data) {
          const updated = {
            ...data,
            inventory: data.inventory.map((i) =>
              i.id === item.id ? { ...i, last_verified: response.last_verified } : i
            ),
            inventory_health: {
              ...data.inventory_health,
              pending_verifications: Math.max(0, (data.inventory_health.pending_verifications ?? 0) - 1),
            },
          };
          this.financeService.dashboardData.set(updated);
        }
        const newIds = this.verifyingIds();
        newIds.delete(item.id);
        this.verifyingIds.set(new Set(newIds));
        this.snackBar.open(`"${item.name}" verified successfully`, 'Close', { duration: 3000 });
      },
      error: () => {
        const newIds = this.verifyingIds();
        newIds.delete(item.id);
        this.verifyingIds.set(new Set(newIds));
        this.snackBar.open(`Failed to verify "${item.name}"`, 'Close', { duration: 3000 });
      },
    });
  }
}
