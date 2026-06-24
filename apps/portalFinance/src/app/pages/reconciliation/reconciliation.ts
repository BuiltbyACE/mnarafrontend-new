import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../services/finance.service';
import {
  ReconciliationDashboard,
  FailedTransactionItem,
  UnallocatedItem,
  FORMAT_CURRENCY,
  PaginatedResponse,
} from '../../models/finance.models';

@Component({
  selector: 'app-reconciliation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container page-fade-in">
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">Reconciliation Dashboard</h1>
          <p class="page-subtitle">Monitor M-Pesa transactions, failures, and unallocated payments</p>
        </div>
        <div class="header-actions">
          <button class="btn-primary" (click)="refresh()" [disabled]="loading()">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 4v6h6M23 20v-6h-6"/>
              <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab-btn" [class.active]="activeTab() === 'overview'" (click)="activeTab.set('overview')">Overview</button>
        <button class="tab-btn" [class.active]="activeTab() === 'failed'" (click)="switchToTab('failed')">Failed Transactions</button>
        <button class="tab-btn" [class.active]="activeTab() === 'unallocated'" (click)="switchToTab('unallocated')">Unallocated Queue</button>
      </div>

      @if (loading()) {
        <div class="loading-state">Loading...</div>
      } @else {

        <!-- ═══ Tab 1: Overview ═══ -->
        @if (activeTab() === 'overview' && dashboard(); as d) {
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-content">
                <span class="kpi-label">Failed Today</span>
                <span class="kpi-value text-rose-600">{{ d.failed_today }}</span>
              </div>
            </div>
            <div class="kpi-card">
              <div class="kpi-content">
                <span class="kpi-label">Failed Total</span>
                <span class="kpi-value text-rose-600">{{ d.failed_total }}</span>
                <span class="kpi-sub">Total: {{ FORMAT_CURRENCY(+d.failed_amount_total) }}</span>
              </div>
            </div>
            <div class="kpi-card">
              <div class="kpi-content">
                <span class="kpi-label">Pending Verification</span>
                <span class="kpi-value text-amber-600">{{ d.pending_verification }}</span>
              </div>
            </div>
            <div class="kpi-card">
              <div class="kpi-content">
                <span class="kpi-label">Stuck (Initiated >24h)</span>
                <span class="kpi-value text-amber-600">{{ d.initiated_stuck }}</span>
              </div>
            </div>
            <div class="kpi-card">
              <div class="kpi-content">
                <span class="kpi-label">Unallocated Payments</span>
                <span class="kpi-value text-blue-600">{{ d.unallocated_payments }}</span>
                <span class="kpi-sub">Amount: {{ FORMAT_CURRENCY(+d.unallocated_amount) }}</span>
              </div>
            </div>
            <div class="kpi-card">
              <div class="kpi-content">
                <span class="kpi-label">Success / No Payment</span>
                <span class="kpi-value text-amber-600">{{ d.success_callback_no_payment }}</span>
              </div>
            </div>
            <div class="kpi-card">
              <div class="kpi-content">
                <span class="kpi-label">Reconciliation Rate</span>
                <span class="kpi-value" [class.text-green-600]="d.reconciliation_rate >= 95" [class.text-amber-600]="d.reconciliation_rate < 95 && d.reconciliation_rate >= 80" [class.text-rose-600]="d.reconciliation_rate < 80">
                  {{ d.reconciliation_rate }}%
                </span>
              </div>
            </div>
            <div class="kpi-card">
              <div class="kpi-content">
                <span class="kpi-label">C2B / STK Push</span>
                <span class="kpi-value" style="font-size:1rem;">{{ d.c2b_total }} / {{ d.stk_push_total }}</span>
              </div>
            </div>
          </div>
        }

        <!-- ═══ Tab 2: Failed Transactions ═══ -->
        @if (activeTab() === 'failed') {
          <div class="panel">
            <div class="panel-header">
              <h3>Failed M-Pesa Transactions</h3>
              <div class="panel-actions">
                <div class="search-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input type="text" [(ngModel)]="failedPhone" placeholder="Search phone..." class="search-input" (input)="loadFailed()">
                </div>
              </div>
            </div>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Receipt</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Phone</th>
                    <th>Reason</th>
                    <th>Age</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  @for (t of failedItems(); track t.id) {
                    <tr>
                      <td><span class="mono-badge">{{ t.mpesa_receipt_number || '—' }}</span></td>
                      <td><span class="type-badge" [class.bg-green]="t.transaction_type === 'C2B'" [class.bg-blue]="t.transaction_type === 'STK_PUSH'">{{ t.transaction_type }}</span></td>
                      <td class="font-bold">{{ FORMAT_CURRENCY(+t.amount) }}</td>
                      <td class="mono-badge">{{ t.phone }}</td>
                      <td class="max-w-200"><span class="text-faint" [title]="t.result_desc">{{ t.result_desc?.slice(0, 50) || '—' }}</span></td>
                      <td>
                        <span class="age-badge" [class.age-warn]="t.age_hours > 24" [class.age-ok]="t.age_hours <= 24">
                          {{ t.age_hours >= 1 ? (t.age_hours | number:'1.0-0') + 'h' : '<1h' }}
                        </span>
                      </td>
                      <td class="text-faint">{{ t.created_at.slice(0, 10) }}</td>
                    </tr>
                  } @empty {
                    <tr><td colspan="7" class="empty-state">No failed transactions found</td></tr>
                  }
                </tbody>
              </table>
            </div>
            @if (failedTotalPages() > 1) {
              <div class="pagination">
                <button class="page-btn" [disabled]="failedPage() <= 1" (click)="failedPage.set(failedPage() - 1); loadFailed()">Prev</button>
                <span class="page-info">Page {{ failedPage() }} of {{ failedTotalPages() }}</span>
                <button class="page-btn" [disabled]="failedPage() >= failedTotalPages()" (click)="failedPage.set(failedPage() + 1); loadFailed()">Next</button>
              </div>
            }
          </div>
        }

        <!-- ═══ Tab 3: Unallocated Queue ═══ -->
        @if (activeTab() === 'unallocated') {
          <div class="panel">
            <div class="panel-header">
              <h3>Unallocated Queue</h3>
              <div class="panel-actions">
                <select class="form-select" [(ngModel)]="unallocatedTypeFilter" (change)="loadUnallocated()">
                  <option value="">All Types</option>
                  <option value="pending_payment">Pending Payment</option>
                  <option value="orphan_callback">Orphan Callback</option>
                  <option value="stuck_initiated">Stuck Initiated</option>
                </select>
              </div>
            </div>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Reference</th>
                    <th>Amount</th>
                    <th>Phone / Method</th>
                    <th>Family</th>
                    <th>Date</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of unallocatedItems(); track item.id) {
                    <tr>
                      <td><span class="type-badge" [style.background]="typeColor(item.type)">{{ typeLabel(item.type) }}</span></td>
                      <td class="mono-badge">{{ item.reference_number || item.mpesa_receipt_number || item.checkout_request_id || '—' }}</td>
                      <td class="font-bold">{{ FORMAT_CURRENCY(+item.amount) }}</td>
                      <td>{{ item.phone || (item.payment_method ? PAYMENT_METHOD_LABEL(item.payment_method) : '—') }}</td>
                      <td class="text-faint">{{ item.family_code || '—' }}</td>
                      <td class="text-faint">{{ item.created_at.slice(0, 10) }}</td>
                      <td class="max-w-200 text-faint">{{ item.notes || item.result_desc || '—' }}</td>
                    </tr>
                  } @empty {
                    <tr><td colspan="7" class="empty-state">No unallocated items found</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    :host { display: contents; }
    .page-container { padding: 24px 32px; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .header-left { display: flex; flex-direction: column; gap: 4px; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0; }
    .page-subtitle { font-size: 0.875rem; color: #64748b; margin: 0; }
    .header-actions { display: flex; gap: 8px; }
    .btn-icon { width: 16px; height: 16px; }
    .loading-state { text-align: center; padding: 48px; color: #64748b; font-size: 0.875rem; }

    /* Tabs */
    .tabs { display: flex; gap: 4px; margin-bottom: 24px; background: #f1f5f9; border-radius: 10px; padding: 4px; width: fit-content; }
    .tab-btn { padding: 8px 20px; border: none; background: transparent; border-radius: 8px; font-size: 0.875rem; font-weight: 500; color: #64748b; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s; }
    .tab-btn.active { background: white; color: #0f172a; font-weight: 600; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .tab-btn:hover:not(.active) { color: #334155; }

    /* KPI Grid */
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .kpi-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06); }
    .kpi-content { display: flex; flex-direction: column; gap: 2px; }
    .kpi-label { font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    .kpi-value { font-size: 1.5rem; font-weight: 700; color: #0f172a; }
    .kpi-sub { font-size: 0.75rem; color: #94a3b8; margin-top: 2px; }

    /* Colors */
    .text-rose-600 { color: #e11d48; }
    .text-amber-600 { color: #d97706; }
    .text-blue-600 { color: #2563eb; }
    .text-green-600 { color: #059669; }
    .text-faint { color: #94a3b8; }
    .font-bold { font-weight: 600; }
    .max-w-200 { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    /* Panel */
    .panel { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06); overflow: hidden; }
    .panel-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #e2e8f0; }
    .panel-header h3 { margin: 0; font-size: 1rem; font-weight: 600; color: #0f172a; }
    .panel-actions { display: flex; gap: 8px; align-items: center; }

    /* Table */
    .table-container { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; padding: 10px 16px; font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; background: #f8fafc; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
    .data-table td { padding: 12px 16px; font-size: 0.8125rem; color: #334155; border-bottom: 1px solid #f1f5f9; }
    .data-table tbody tr:hover td { background: #f8fafc; }
    .empty-state { text-align: center; padding: 40px; color: #94a3b8; font-size: 0.875rem; }

    /* Badges */
    .mono-badge { font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; color: #64748b; }
    .type-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.6875rem; font-weight: 600; color: white; white-space: nowrap; }
    .bg-green { background: #059669; }
    .bg-blue { background: #2563eb; }
    .age-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.6875rem; font-weight: 600; }
    .age-warn { background: #fef3c7; color: #92400e; }
    .age-ok { background: #f1f5f9; color: #475569; }

    /* Search & Select */
    .search-box { display: flex; align-items: center; gap: 6px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 12px; }
    .search-box svg { width: 16px; height: 16px; color: #94a3b8; }
    .search-input { border: none; background: transparent; outline: none; font-size: 0.8125rem; color: #0f172a; width: 180px; font-family: 'Inter', sans-serif; }
    .form-select { padding: 6px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.8125rem; color: #334155; background: white; font-family: 'Inter', sans-serif; outline: none; cursor: pointer; }

    /* Buttons */
    .btn-primary {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 8px 20px; background: #2563eb; color: white; border: none;
      border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer;
      font-family: 'Inter', sans-serif;
    }
    .btn-primary:hover { background: #1d4ed8; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Pagination */
    .pagination { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 16px; border-top: 1px solid #e2e8f0; }
    .page-btn { padding: 6px 14px; border: 1px solid #e2e8f0; border-radius: 6px; background: white; color: #334155; font-size: 0.8125rem; cursor: pointer; font-family: 'Inter', sans-serif; }
    .page-btn:hover:not(:disabled) { background: #f8fafc; border-color: #94a3b8; }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .page-info { font-size: 0.8125rem; color: #64748b; }
  `],
})
export class ReconciliationComponent implements OnInit {
  private financeService = inject(FinanceService);

  readonly activeTab = signal<'overview' | 'failed' | 'unallocated'>('overview');
  readonly loading = signal(true);

  // Overview
  readonly dashboard = signal<ReconciliationDashboard | null>(null);

  // Failed tab
  readonly failedItems = signal<FailedTransactionItem[]>([]);
  readonly failedPage = signal(1);
  readonly failedTotalPages = signal(1);
  readonly failedPhone = signal('');
  private readonly pageSize = 20;

  // Unallocated tab
  readonly unallocatedItems = signal<UnallocatedItem[]>([]);
  readonly unallocatedTypeFilter = signal('');

  readonly FORMAT_CURRENCY = FORMAT_CURRENCY;

  ngOnInit(): void {
    this.loadOverview();
  }

  refresh(): void {
    this.loading.set(true);
    if (this.activeTab() === 'overview') this.loadOverview();
    else if (this.activeTab() === 'failed') this.loadFailed();
    else this.loadUnallocated();
  }

  switchToTab(tab: 'failed' | 'unallocated'): void {
    this.activeTab.set(tab);
    this.loading.set(true);
    if (tab === 'failed' && this.failedItems().length === 0) this.loadFailed();
    if (tab === 'unallocated' && this.unallocatedItems().length === 0) this.loadUnallocated();
    this.loading.set(false);
  }

  private loadOverview(): void {
    this.financeService.getReconciliationDashboard().subscribe({
      next: (data) => {
        this.dashboard.set(data);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); },
    });
  }

  loadFailed(): void {
    this.financeService.getFailedTransactions({
      phone: this.failedPhone() || undefined,
    }).subscribe({
      next: (data: PaginatedResponse<FailedTransactionItem>) => {
        this.failedItems.set(data.results);
        this.failedTotalPages.set(Math.max(1, Math.ceil(data.count / this.pageSize)));
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); },
    });
  }

  loadUnallocated(): void {
    this.financeService.getUnallocatedPayments({
      type: this.unallocatedTypeFilter() || undefined,
    }).subscribe({
      next: (data: PaginatedResponse<UnallocatedItem>) => {
        this.unallocatedItems.set(data.results);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); },
    });
  }

  typeColor(type: string): string {
    switch (type) {
      case 'pending_payment': return '#d97706';
      case 'orphan_callback': return '#e11d48';
      case 'stuck_initiated': return '#64748b';
      default: return '#94a3b8';
    }
  }

  typeLabel(type: string): string {
    switch (type) {
      case 'pending_payment': return 'Pending Payment';
      case 'orphan_callback': return 'Orphan Callback';
      case 'stuck_initiated': return 'Stuck Initiated';
      default: return type;
    }
  }

  PAYMENT_METHOD_LABEL(method: string): string {
    const labels: Record<string, string> = {
      MPESA: 'M-Pesa',
      BANK_TRANSFER: 'Bank Transfer',
      BANK_DEPOSIT: 'Bank Deposit',
      CASH: 'Cash',
      CHEQUE: 'Cheque',
      WALLET_CREDIT: 'Wallet Credit',
    };
    return labels[method] || method;
  }
}
