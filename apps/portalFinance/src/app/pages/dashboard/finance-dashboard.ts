import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanceService } from '../../services/finance.service';
import { FORMAT_CURRENCY, FinanceSummary } from '../../models/finance.models';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-finance-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container page-fade-in">
      <div class="page-header">
        <h1 class="page-title">Financial Overview</h1>
        <p class="page-subtitle">Real-time treasury snapshot for Mnara School</p>
        <div class="header-badge">
          @if (summary()) {
            <span class="badge-live">Live Data</span>
          } @else if (loading()) {
            <span class="badge-loading">Loading...</span>
          } @else {
            <span class="badge-offline">Offline — Mock Data</span>
          }
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon-wrapper liquidity">
            <svg class="kpi-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Total Revenue</span>
            <span class="kpi-value">{{ summary()?.total_revenue !== undefined ? FORMAT_CURRENCY(summary()!.total_revenue) : 'Loading...' }}</span>
            <span class="kpi-trend positive">Collected this term</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrapper arrears">
            <svg class="kpi-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Outstanding / Pending</span>
            <span class="kpi-value text-rose-600">{{ summary()?.total_pending ? FORMAT_CURRENCY(summary()!.total_pending) : 'Loading...' }}</span>
            <span class="kpi-trend negative">{{ summary()?.outstanding_invoices ?? 0 }} invoices pending</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrapper burn">
            <svg class="kpi-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/>
            </svg>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Total Expenses</span>
            <span class="kpi-value">{{ summary()?.total_expenses !== undefined ? FORMAT_CURRENCY(summary()!.total_expenses) : 'Loading...' }}</span>
            <span class="kpi-trend neutral">Operational expenses</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrapper students">
            <svg class="kpi-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Net Position</span>
            <span class="kpi-value">{{ netPosition() }}</span>
            <span class="kpi-trend neutral">Revenue minus expenses</span>
          </div>
        </div>
      </div>

      <!-- Main Charts Row -->
      <div class="charts-row">
        <!-- Cash Flow Chart -->
        <div class="chart-card large">
          <div class="chart-header">
            <h3>Cash Flow Trend</h3>
            <select class="period-select" (change)="onPeriodChange($event)">
              <option value="3">Last 3 months</option>
              <option value="6" selected>Last 6 months</option>
              <option value="12">Last 12 months</option>
            </select>
          </div>
          <div class="chart-body">
            <canvas #cashFlowCanvas></canvas>
          </div>
        </div>
      </div>

      <!-- Secondary Charts Row -->
      <div class="charts-row split">
        <!-- Revenue Breakdown -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Revenue Breakdown</h3>
            <span class="chart-badge">All Time</span>
          </div>
          <div class="chart-body doughnut-container">
            @if (!dashboardData()?.revenue_breakdown?.length) {
              <div class="empty-state">No data recorded</div>
            }
            <canvas #revenueCanvas></canvas>
          </div>
        </div>

        <!-- Expense Breakdown -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Expense Breakdown</h3>
            <span class="chart-badge">All Time</span>
          </div>
          <div class="chart-body doughnut-container">
            @if (!dashboardData()?.expense_summary?.length) {
              <div class="empty-state">No data recorded</div>
            }
            <canvas #expenseCanvas></canvas>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      @if (dashboardData()?.recent_activity?.length) {
        <div class="activity-card mt-6">
          <div class="chart-header">
            <h3>Recent Activity</h3>
            <span class="chart-badge">Latest transactions</span>
          </div>
          <div class="activity-list">
            @for (act of dashboardData()!.recent_activity.slice(0, 5); track act.timestamp) {
              <div class="activity-item">
                <div class="activity-dot" [class.payment]="act.type === 'payment'" [class.purchase]="act.type === 'purchase'"></div>
                <span class="activity-msg">{{ act.message }}</span>
                <span class="activity-amount">{{ FORMAT_CURRENCY(act.amount) }}</span>
                <span class="activity-time">{{ act.timestamp | date:'short' }}</span>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 0; }
    .page-header { margin-bottom: 28px; display: flex; align-items: flex-start; justify-content: space-between; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #0f172a; letter-spacing: -0.02em; }
    .page-subtitle { font-size: 0.875rem; color: #64748b; margin-top: 4px; }
    .header-badge { flex-shrink: 0; }
    .badge-live { font-size: 0.6875rem; background: #d1fae5; color: #059669; padding: 3px 10px; border-radius: 999px; font-weight: 600; }
    .badge-loading { font-size: 0.6875rem; background: #fef3c7; color: #d97706; padding: 3px 10px; border-radius: 999px; font-weight: 600; }
    .badge-offline { font-size: 0.6875rem; background: #f1f5f9; color: #94a3b8; padding: 3px 10px; border-radius: 999px; font-weight: 600; }

    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 28px; }
    .kpi-card {
      background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;
      display: flex; align-items: flex-start; gap: 16px;
      transition: box-shadow 0.2s, transform 0.2s;
    }
    .kpi-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.06); transform: translateY(-1px); }
    .kpi-icon-wrapper { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .kpi-icon-wrapper.liquidity { background: #dbeafe; color: #2563eb; }
    .kpi-icon-wrapper.arrears { background: #fee2e2; color: #e11d48; }
    .kpi-icon-wrapper.burn { background: #fef3c7; color: #d97706; }
    .kpi-icon-wrapper.students { background: #d1fae5; color: #059669; }
    .kpi-icon { width: 22px; height: 22px; }
    .kpi-content { display: flex; flex-direction: column; gap: 2px; }
    .kpi-label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
    .kpi-value { font-size: 1.375rem; font-weight: 700; color: #0f172a; letter-spacing: -0.01em; font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; }
    .text-rose-600 { color: #e11d48; }
    .kpi-trend { font-size: 0.75rem; }
    .kpi-trend.positive { color: #059669; }
    .kpi-trend.negative { color: #e11d48; }
    .kpi-trend.neutral { color: #64748b; }

    .charts-row { margin-bottom: 20px; }
    .charts-row.split { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .chart-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
    .chart-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; }
    .chart-header h3 { font-size: 0.9375rem; font-weight: 600; color: #0f172a; }
    .chart-badge { font-size: 0.6875rem; color: #64748b; background: #f1f5f9; padding: 3px 10px; border-radius: 999px; font-weight: 500; }
    .period-select { font-size: 0.75rem; color: #334155; border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px 8px; outline: none; background: #f8fafc; cursor: pointer; }
    .chart-body { padding: 20px; position: relative; height: 300px; width: 100%; }
    .doughnut-container { display: flex; justify-content: center; align-items: center; position: relative; }
    .empty-state { position: absolute; font-size: 0.875rem; color: #94a3b8; text-align: center; font-weight: 500; z-index: 10; }
    
    canvas { width: 100% !important; height: 100% !important; }

    .mt-6 { margin-top: 24px; }
    .activity-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
    .activity-list { padding: 12px 20px; }
    .activity-item { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 0.8125rem; }
    .activity-item:last-child { border-bottom: none; }
    .activity-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .activity-dot.payment { background: #059669; }
    .activity-dot.purchase { background: #d97706; }
    .activity-msg { flex: 1; color: #334155; }
    .activity-amount { font-weight: 600; color: #0f172a; font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; white-space: nowrap; }
    .activity-time { font-size: 0.6875rem; color: #94a3b8; white-space: nowrap; }

    @media (max-width: 1200px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 900px) { .charts-row.split { grid-template-columns: 1fr; } }
    @media (max-width: 640px) { .kpi-grid { grid-template-columns: 1fr; } }
  `]
})
export class FinanceDashboardComponent implements OnInit, AfterViewInit {
  private financeService = inject(FinanceService);

  @ViewChild('cashFlowCanvas') cashFlowCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('revenueCanvas') revenueCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('expenseCanvas') expenseCanvas!: ElementRef<HTMLCanvasElement>;

  summary = signal<FinanceSummary | null>(null);
  loading = signal(true);
  dashboardData = signal<any>(null);

  FORMAT_CURRENCY = FORMAT_CURRENCY;

  private cashFlowChart?: Chart;
  private revenueChart?: Chart;
  private expenseChart?: Chart;

  // Modern UI Colors
  private colors = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#64748b', // slate
  ];

  ngOnInit() {
    this.loadData();
  }

  ngAfterViewInit() {
    // Charts will render once data loads
  }

  private loadData(months: number = 6) {
    this.loading.set(true);

    this.financeService.getFinanceSummary().subscribe({
      next: (data) => {
        this.summary.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.financeService.getPrincipalDashboard(months).subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        setTimeout(() => this.renderCharts(), 0); // Render charts after view updates
      },
      error: () => {},
    });
  }

  onPeriodChange(event: any) {
    const months = parseInt(event.target.value, 10);
    this.loadData(months);
  }

  netPosition = () => {
    const s = this.summary();
    if (!s) return 'KES 0';
    const rev = parseFloat(s.total_revenue) || 0;
    const exp = parseFloat(s.total_expenses) || 0;
    return FORMAT_CURRENCY((rev - exp).toString());
  };

  private renderCharts() {
    const data = this.dashboardData();
    if (!data) return;

    this.renderCashFlowChart(data.cash_flow || []);
    this.renderRevenueChart(data.revenue_breakdown || []);
    this.renderExpenseChart(data.expense_summary || []);
  }

  private renderCashFlowChart(cashFlow: any[]) {
    if (!this.cashFlowCanvas?.nativeElement) return;
    
    if (this.cashFlowChart) this.cashFlowChart.destroy();

    const labels = cashFlow.map(cf => cf.month);
    const revenueData = cashFlow.map(cf => cf.revenue);
    const expenseData = cashFlow.map(cf => cf.expenses);

    this.cashFlowChart = new Chart(this.cashFlowCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Revenue',
            data: revenueData,
            backgroundColor: '#10b981', // emerald
            borderRadius: 4,
          },
          {
            label: 'Expenses',
            data: expenseData,
            backgroundColor: '#ef4444', // red
            borderRadius: 4,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label}: KES ${context.raw}`
            }
          }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  private renderRevenueChart(revenueBreakdown: any[]) {
    if (!this.revenueCanvas?.nativeElement || !revenueBreakdown.length) return;
    
    if (this.revenueChart) this.revenueChart.destroy();

    const labels = revenueBreakdown.map(r => r.category);
    const data = revenueBreakdown.map(r => r.total);

    this.revenueChart = new Chart(this.revenueCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: this.colors,
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { position: 'right' },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.label}: KES ${context.raw}`
            }
          }
        }
      }
    });
  }

  private renderExpenseChart(expenseSummary: any[]) {
    if (!this.expenseCanvas?.nativeElement || !expenseSummary.length) return;
    
    if (this.expenseChart) this.expenseChart.destroy();

    const labels = expenseSummary.map(e => e.category);
    const data = expenseSummary.map(e => e.total);

    this.expenseChart = new Chart(this.expenseCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: [...this.colors].reverse(),
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { position: 'right' },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.label}: KES ${context.raw}`
            }
          }
        }
      }
    });
  }
}
