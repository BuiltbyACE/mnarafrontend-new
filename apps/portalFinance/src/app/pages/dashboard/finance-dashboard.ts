import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanceService } from '../../services/finance.service';
import { FORMAT_CURRENCY, FinanceSummary } from '../../models/finance.models';

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
            <span class="kpi-value">{{ summary()?.total_revenue ? FORMAT_CURRENCY(summary()!.total_revenue) : 'Loading...' }}</span>
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
            <span class="kpi-value">{{ summary()?.total_expenses ? FORMAT_CURRENCY(summary()!.total_expenses) : 'Loading...' }}</span>
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

      <div class="charts-row">
        <div class="chart-card">
          <div class="chart-header">
            <h3>Cash Flow Trend</h3>
            <span class="chart-badge">Last 6 months</span>
          </div>
          <div class="chart-body">
            @if (dashboardData()?.cash_flow?.length) {
              <div class="cashflow-list">
                @for (cf of dashboardData()!.cash_flow; track cf.month) {
                  <div class="cashflow-row">
                    <span class="cf-month">{{ cf.month }}</span>
                    <div class="cf-bars">
                      <div class="cf-bar-track">
                        <div class="cf-bar revenue" [style.width.%]="getBarWidth(cf.revenue, maxCashFlow)"></div>
                      </div>
                      <div class="cf-bar-track">
                        <div class="cf-bar expense" [style.width.%]="getBarWidth(cf.expenses, maxCashFlow)"></div>
                      </div>
                    </div>
                    <div class="cf-values">
                      <span class="cf-revenue">{{ FORMAT_CURRENCY(cf.revenue) }}</span>
                      <span class="cf-expense">{{ FORMAT_CURRENCY(cf.expenses) }}</span>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="placeholder-content">
                <svg class="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M3 3v18h18M7 16l4-4 4 4 5-5"/>
                </svg>
                <span class="placeholder-text">Cash Flow Chart — Coming Soon</span>
                <span class="placeholder-hint">Integration with backend dashboard data</span>
              </div>
            }
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-header">
            <h3>Revenue Breakdown</h3>
            <span class="chart-badge">This term</span>
          </div>
          <div class="chart-body">
            @if (dashboardData()?.expense_summary?.length) {
              <div class="revenue-list">
                @for (item of dashboardData()!.expense_summary; track item.category) {
                  <div class="revenue-item">
                    <div class="revenue-left">
                      <div class="revenue-dot" [style.background]="getCategoryColor(item.category)"></div>
                      <span>{{ item.category }}</span>
                    </div>
                    <span class="revenue-amount">{{ FORMAT_CURRENCY(item.total) }}</span>
                  </div>
                }
                <div class="revenue-total">
                  <span>Total Revenue</span>
                  <span class="font-bold">{{ summary()?.total_revenue ? FORMAT_CURRENCY(summary()!.total_revenue) : 'KES 0' }}</span>
                </div>
              </div>
            } @else {
              <div class="placeholder-content">
                <svg class="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                <span class="placeholder-text">Revenue Chart — Coming Soon</span>
                <span class="placeholder-hint">Data will display once connected</span>
              </div>
            }
          </div>
        </div>
      </div>

      @if (dashboardData()?.recent_activity?.length) {
        <div class="activity-card">
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

    .charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
    .chart-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
    .chart-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; }
    .chart-header h3 { font-size: 0.9375rem; font-weight: 600; color: #0f172a; }
    .chart-badge { font-size: 0.6875rem; color: #64748b; background: #f1f5f9; padding: 3px 10px; border-radius: 999px; font-weight: 500; }
    .chart-body { padding: 20px; min-height: 200px; }

    .placeholder-content { display: flex; flex-direction: column; align-items: center; gap: 8px; color: #94a3b8; padding: 40px 0; }
    .placeholder-icon { width: 40px; height: 40px; }
    .placeholder-text { font-size: 0.875rem; font-weight: 500; }
    .placeholder-hint { font-size: 0.75rem; }

    .cashflow-list { display: flex; flex-direction: column; gap: 10px; }
    .cashflow-row { display: grid; grid-template-columns: 70px 1fr 180px; gap: 12px; align-items: center; }
    .cf-month { font-size: 0.75rem; font-weight: 600; color: #64748b; }
    .cf-bars { display: flex; flex-direction: column; gap: 4px; }
    .cf-bar-track { height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
    .cf-bar { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
    .cf-bar.revenue { background: #2563eb; }
    .cf-bar.expense { background: #e11d48; }
    .cf-values { display: flex; flex-direction: column; gap: 2px; font-size: 0.6875rem; font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; }
    .cf-revenue { color: #2563eb; font-weight: 600; }
    .cf-expense { color: #e11d48; font-weight: 600; }

    .revenue-list { display: flex; flex-direction: column; gap: 12px; }
    .revenue-item { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
    .revenue-left { display: flex; align-items: center; gap: 10px; font-size: 0.875rem; color: #334155; }
    .revenue-dot { width: 8px; height: 8px; border-radius: 50%; }
    .revenue-amount { font-size: 0.8125rem; font-weight: 600; color: #0f172a; font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; }
    .revenue-total { display: flex; align-items: center; justify-content: space-between; padding-top: 8px; font-size: 0.875rem; color: #0f172a; }
    .font-bold { font-weight: 700; }

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
    @media (max-width: 900px) { .charts-row { grid-template-columns: 1fr; } }
    @media (max-width: 640px) { .kpi-grid { grid-template-columns: 1fr; } }
  `],
})
export class FinanceDashboardComponent implements OnInit {
  private financeService = inject(FinanceService);

  summary = signal<FinanceSummary | null>(null);
  loading = signal(true);
  dashboardData = signal<any>(null);

  FORMAT_CURRENCY = FORMAT_CURRENCY;

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    this.loading.set(true);

    this.financeService.getFinanceSummary().subscribe({
      next: (data) => {
        this.summary.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.summary.set({
          total_revenue: '3522500.00',
          total_pending: '345000.00',
          total_expenses: '1380000.00',
          outstanding_invoices: 3,
        });
        this.loading.set(false);
      },
    });

    this.financeService.getPrincipalDashboard().subscribe({
      next: (data) => this.dashboardData.set(data),
      error: () => {},
    });
  }

  netPosition = () => {
    const s = this.summary();
    if (!s) return 'KES 0';
    const rev = parseFloat(s.total_revenue) || 0;
    const exp = parseFloat(s.total_expenses) || 0;
    return FORMAT_CURRENCY((rev - exp).toString());
  };

  getBarWidth(value: string, max: number): number {
    const v = parseFloat(value) || 0;
    return max > 0 ? (v / max) * 100 : 0;
  }

  get maxCashFlow(): number {
    const cf = this.dashboardData()?.cash_flow;
    if (!cf?.length) return 0;
    return Math.max(...cf.flatMap((c: any) => [parseFloat(c.revenue) || 0, parseFloat(c.expenses) || 0]));
  }

  getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      PAYROLL: '#2563eb', FUEL: '#f59e0b', UTILITY: '#8b5cf6',
      MAINTENANCE: '#10b981', SUPPLIES: '#ec4899', OTHER: '#64748b',
    };
    return colors[category] || '#64748b';
  }
}
