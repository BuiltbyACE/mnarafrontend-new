import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../services/finance.service';
import { MpesaTransaction, MpesaReceiptVerification, FORMAT_CURRENCY } from '../../models/finance.models';

@Component({
  selector: 'app-mpesa-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container page-fade-in">
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">M-Pesa Transactions</h1>
          <p class="page-subtitle">Monitor incoming mobile money payments</p>
        </div>
        <div class="header-actions">
          <button class="btn-primary" (click)="showLookupModal.set(true)">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Lookup Receipt
          </button>
        </div>
      </div>

      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-label">Total Transactions</span>
          <span class="stat-value">{{ transactions().length }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Verified</span>
          <span class="stat-value text-blue">{{ verifiedCount() }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Pending / Failed</span>
          <span class="stat-value" [class.text-warning]="pendingCount() > 0">{{ pendingCount() }}</span>
        </div>
      </div>

      <div class="panel main-panel">
        <div class="panel-header">
          <h3>Transaction History</h3>
          <div class="panel-actions">
            <div class="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" [(ngModel)]="searchQuery" placeholder="Search receipt or phone..." class="search-input">
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
                <th>Status</th>
                <th>Verified At</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              @for (t of filteredTransactions(); track t.id) {
                <tr>
                  <td><span class="mono-badge">{{ t.mpesa_receipt_number }}</span></td>
                  <td>
                    <span class="type-badge" [class.bg-green]="t.transaction_type === 'C2B'" [class.bg-blue]="t.transaction_type === 'STK_PUSH'">
                      {{ t.transaction_type }}
                    </span>
                  </td>
                  <td class="font-bold">{{ FORMAT_CURRENCY(t.amount) }}</td>
                  <td class="mono-badge">{{ t.phone }}</td>
                  <td>
                    <span class="status-badge" [style.background]="statusColor(t.status)">
                      {{ t.status }}
                    </span>
                  </td>
                  <td class="text-faint">{{ t.verified_at ? t.verified_at.slice(0, 16).replace('T', ' ') : '—' }}</td>
                  <td class="text-faint">{{ t.created_at.slice(0, 10) }}</td>
                </tr>
              } @empty {
                <tr><td colspan="7" class="empty-state">No transactions found</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    @if (showLookupModal()) {
      <div class="modal-overlay" (click)="showLookupModal.set(false)">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Lookup M-Pesa Receipt</h2>
            <button class="close-btn" (click)="showLookupModal.set(false)">&times;</button>
          </div>
          <div class="modal-body">
            <p class="modal-desc">Enter an M-Pesa receipt number to verify its status with Safaricom.</p>
            <div class="form-group">
              <label>Receipt Number</label>
              <input type="text" class="form-control" [(ngModel)]="lookupReceipt" placeholder="e.g. NLJ7RT61SV" style="text-transform:uppercase;">
            </div>
            @if (lookupResult()) {
              <div class="lookup-result" [class.verified]="lookupResult()?.verified" [class.failed]="!lookupResult()?.verified">
                <div class="lookup-row">
                  <span class="lookup-label">Verified</span>
                  <span class="lookup-value">{{ lookupResult()?.verified ? 'Yes' : 'No' }}</span>
                </div>
                <div class="lookup-row">
                  <span class="lookup-label">Amount</span>
                  <span class="lookup-value">{{ lookupResult()?.amount != null ? FORMAT_CURRENCY(lookupResult()!.amount!) : '—' }}</span>
                </div>
                <div class="lookup-row">
                  <span class="lookup-label">Result</span>
                  <span class="lookup-value">{{ lookupResult()?.result_desc }}</span>
                </div>
                @if (lookupResult()?.duplicate) {
                  <div class="lookup-row">
                    <span class="lookup-label text-warning">⚠ Duplicate</span>
                    <span class="lookup-value">Already processed</span>
                  </div>
                }
              </div>
            }
            @if (lookupError()) {
              <div class="error-msg">{{ lookupError() }}</div>
            }
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" (click)="showLookupModal.set(false)">Close</button>
            <button class="btn-primary" (click)="doLookup()" [disabled]="!lookupReceipt().trim() || lookupLoading()">
              {{ lookupLoading() ? 'Checking...' : 'Verify Receipt' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: contents; }
    .page-container { padding: 24px 32px; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .header-left { display: flex; flex-direction: column; gap: 4px; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0; }
    .page-subtitle { font-size: 0.875rem; color: #64748b; margin: 0; }
    .header-actions { display: flex; gap: 8px; }
    .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06); }
    .stat-label { display: block; font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: #0f172a; }
    .text-warning { color: #d97706; }
    .text-blue { color: #2563eb; }
    .text-faint { color: #94a3b8; }
    .font-bold { font-weight: 600; }
    .btn-primary {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 8px 20px; background: #2563eb; color: white; border: none;
      border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer;
      font-family: 'Inter', sans-serif;
    }
    .btn-primary:hover { background: #1d4ed8; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-icon { width: 16px; height: 16px; }
    .panel { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06); overflow: hidden; }
    .main-panel { margin-bottom: 24px; }
    .panel-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #e2e8f0; }
    .panel-header h3 { margin: 0; font-size: 1rem; font-weight: 600; color: #0f172a; }
    .panel-actions { display: flex; gap: 8px; }
    .search-box { display: flex; align-items: center; gap: 6px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 12px; }
    .search-box svg { width: 16px; height: 16px; color: #94a3b8; }
    .search-input { border: none; background: transparent; outline: none; font-size: 0.8125rem; color: #0f172a; width: 200px; font-family: 'Inter', sans-serif; }
    .table-container { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; padding: 10px 16px; font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; background: #f8fafc; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
    .data-table td { padding: 12px 16px; font-size: 0.8125rem; color: #334155; border-bottom: 1px solid #f1f5f9; }
    .data-table tbody tr:hover td { background: #f8fafc; }
    .mono-badge { font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; color: #64748b; }
    .type-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.6875rem; font-weight: 600; color: white; }
    .bg-green { background: #059669; }
    .bg-blue { background: #2563eb; }
    .status-badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 0.6875rem; font-weight: 600; color: white; text-transform: uppercase; }
    .empty-state { text-align: center; padding: 40px; color: #94a3b8; font-size: 0.875rem; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-content { background: white; border-radius: 16px; width: 480px; max-height: 80vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px 0; }
    .modal-header h2 { margin: 0; font-size: 1.125rem; font-weight: 700; color: #0f172a; }
    .close-btn { background: none; border: none; font-size: 1.5rem; color: #94a3b8; cursor: pointer; padding: 0; line-height: 1; }
    .modal-desc { font-size: 0.8125rem; color: #64748b; margin: 0; }
    .modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 0.8125rem; font-weight: 600; color: #334155; }
    .form-control {
      padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px;
      font-size: 0.875rem; color: #0f172a; background: white; outline: none;
      font-family: 'Inter', sans-serif; transition: border-color 0.15s;
    }
    .form-control:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
    .modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 16px 24px 20px; border-top: 1px solid #f1f5f9; }
    .btn-ghost { padding: 8px 20px; background: transparent; color: #334155; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem; font-weight: 500; cursor: pointer; font-family: 'Inter', sans-serif; }
    .btn-ghost:hover { background: #f8fafc; }
    .lookup-result { padding: 16px; border-radius: 10px; display: flex; flex-direction: column; gap: 8px; }
    .lookup-result.verified { background: #f0fdf4; border: 1px solid #bbf7d0; }
    .lookup-result.failed { background: #fef2f2; border: 1px solid #fecaca; }
    .lookup-row { display: flex; justify-content: space-between; align-items: center; }
    .lookup-label { font-size: 0.8125rem; font-weight: 600; color: #475569; }
    .lookup-value { font-size: 0.875rem; color: #0f172a; font-weight: 500; }
    .error-msg { padding: 10px 14px; background: #fef2f2; color: #e11d48; border-radius: 8px; font-size: 0.8125rem; border: 1px solid #fecaca; }
  `],
})
export class MpesaTransactionsComponent implements OnInit {
  private financeService = inject(FinanceService);

  readonly transactions = signal<MpesaTransaction[]>([]);
  readonly searchQuery = signal('');
  readonly showLookupModal = signal(false);
  readonly lookupReceipt = signal('');
  readonly lookupResult = signal<MpesaReceiptVerification | null>(null);
  readonly lookupLoading = signal(false);
  readonly lookupError = signal<string | null>(null);

  readonly FORMAT_CURRENCY = FORMAT_CURRENCY;

  readonly verifiedCount = computed(() =>
    this.transactions().filter(t => t.status === 'SUCCESS').length
  );
  readonly pendingCount = computed(() =>
    this.transactions().filter(t => t.status === 'INITIATED' || t.status === 'FAILED').length
  );
  readonly filteredTransactions = computed(() => {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.transactions();
    return this.transactions().filter(t =>
      t.mpesa_receipt_number.toLowerCase().includes(q) ||
      t.phone.includes(q)
    );
  });

  statusColor(status: string): string {
    switch (status) {
      case 'SUCCESS': return '#059669';
      case 'INITIATED': return '#d97706';
      case 'FAILED': return '#e11d48';
      default: return '#94a3b8';
    }
  }

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    this.financeService.getMpesaTransactions().subscribe({
      next: (res) => this.transactions.set(res),
    });
  }

  doLookup() {
    const receipt = this.lookupReceipt().trim().toUpperCase();
    if (!receipt) return;
    this.lookupLoading.set(true);
    this.lookupError.set(null);
    this.lookupResult.set(null);
    this.financeService.lookupMpesaReceipt(receipt).subscribe({
      next: (res) => {
        this.lookupResult.set(res);
        this.lookupLoading.set(false);
      },
      error: (err) => {
        this.lookupLoading.set(false);
        this.lookupError.set(err.error?.message || err.error?.detail || 'Lookup failed');
      },
    });
  }
}
