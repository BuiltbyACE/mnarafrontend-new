import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanceService } from '../../services/finance.service';
import { FullLedgerEntry } from '../../models/finance.models';

@Component({
  selector: 'app-immutable-ledger',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container page-fade-in">
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">Master Ledger</h1>
          <p class="page-subtitle">Double-entry bookkeeping &mdash; immutable audit trail</p>
        </div>
        <div class="ledger-badge">
          <svg class="lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          Immutable &mdash; Read Only
        </div>
      </div>

      <div class="ledger-summary">
        <div class="summary-item">
          <span class="summary-label">Total Debits</span>
          <span class="summary-value debit">{{ totalDebits }}</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item">
          <span class="summary-label">Total Credits</span>
          <span class="summary-value credit">{{ totalCredits }}</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item">
          <span class="summary-label">Net Position</span>
          <span class="summary-value" [class.debit]="netPosition < 0" [class.credit]="netPosition >= 0">{{ netPositionFormatted }}</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item">
          <span class="summary-label">Total Entries</span>
          <span class="summary-value">{{ ledgerEntries().length }}</span>
        </div>
      </div>

      <div class="ledger-table-wrapper">
        <table class="ledger-table">
          <thead>
            <tr>
              <th class="col-txn">Transaction ID</th>
              <th class="col-date">Date</th>
              <th class="col-account">Account</th>
              <th class="col-desc">Description</th>
              <th class="col-debit">Debit (KES)</th>
              <th class="col-credit">Credit (KES)</th>
              <th class="col-user">User</th>
            </tr>
          </thead>
          <tbody>
            @for (entry of ledgerEntries(); track entry.id) {
              <tr>
                <td class="col-txn">
                  <span class="txn-id">{{ entry.transaction_id.substring(0, 8) }}</span>
                </td>
                <td class="col-date">{{ entry.date }}</td>
                <td class="col-account">{{ entry.account }}</td>
                <td class="col-desc text-muted">{{ entry.description }}</td>
                <td class="col-debit">
                  @if (parseFloat(entry.debit) > 0) {
                    <span class="mono debit-amount">{{ formatAmount(entry.debit) }}</span>
                  }
                </td>
                <td class="col-credit">
                  @if (parseFloat(entry.credit) > 0) {
                    <span class="mono credit-amount">{{ formatAmount(entry.credit) }}</span>
                  }
                </td>
                <td class="col-user text-muted">{{ entry.user }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <div class="ledger-footer-note">
        <svg class="footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
        <span>This ledger is <strong>immutable</strong>. All entries are final. Corrections must be made via offsetting journal entries, never by deletion.</span>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 0; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #0f172a; letter-spacing: -0.02em; }
    .page-subtitle { font-size: 0.875rem; color: #64748b; margin-top: 4px; }
    .ledger-badge { display: flex; align-items: center; gap: 8px; background: #f1f5f9; border: 1px solid #e2e8f0; padding: 8px 16px; border-radius: 8px; font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; flex-shrink: 0; }
    .lock-icon { width: 16px; height: 16px; color: #94a3b8; }
    .ledger-summary { display: flex; align-items: center; gap: 24px; background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 24px; margin-bottom: 20px; }
    .summary-item { display: flex; flex-direction: column; gap: 2px; }
    .summary-label { font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 600; }
    .summary-value { font-size: 1.125rem; font-weight: 700; font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; color: #0f172a; }
    .summary-value.debit { color: #e11d48; }
    .summary-value.credit { color: #059669; }
    .summary-divider { width: 1px; height: 40px; background: #e2e8f0; }
    .ledger-table-wrapper { background: white; border: 1px solid #e2e8f0; border-radius: 12px; overflow: auto; max-height: 600px; }
    .ledger-table { width: 100%; border-collapse: collapse; }
    .ledger-table thead { position: sticky; top: 0; z-index: 10; }
    .ledger-table th { padding: 10px 14px; text-align: left; font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; background: #f1f5f9; border-bottom: 2px solid #e2e8f0; font-weight: 600; white-space: nowrap; }
    .ledger-table td { padding: 10px 14px; font-size: 0.8125rem; color: #334155; border-bottom: 1px solid #f1f5f9; }
    .ledger-table tbody tr:hover td { background: #f8fafc; }
    .ledger-table tbody tr:nth-child(even) td { background: #fafbfc; }
    .ledger-table tbody tr:nth-child(even):hover td { background: #f1f5f9; }
    .col-txn { width: 110px; }
    .col-date { width: 100px; white-space: nowrap; }
    .col-account { min-width: 180px; }
    .col-desc { min-width: 200px; }
    .col-debit { width: 130px; text-align: right; }
    .col-credit { width: 130px; text-align: right; }
    .col-user { min-width: 160px; }
    .txn-id { font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; font-size: 0.75rem; color: #2563eb; cursor: default; }
    .mono { font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; }
    .debit-amount { color: #e11d48; font-weight: 600; font-size: 0.8125rem; }
    .credit-amount { color: #059669; font-weight: 600; font-size: 0.8125rem; }
    .text-muted { color: #94a3b8; font-size: 0.75rem; }
    .ledger-footer-note { display: flex; align-items: center; gap: 10px; margin-top: 16px; padding: 12px 18px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.75rem; color: #64748b; }
    .footer-icon { width: 16px; height: 16px; color: #94a3b8; flex-shrink: 0; }
    .ledger-footer-note strong { color: #334155; }
  `],
})
export class ImmutableLedgerComponent implements OnInit {
  private financeService = inject(FinanceService);

  ledgerEntries = signal<FullLedgerEntry[]>([]);
  parseFloat = parseFloat;

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    this.financeService.getTransactions().subscribe({
      next: (res) => {
        const entries: FullLedgerEntry[] = res.results.flatMap(tx =>
          tx.ledger_entries?.map(le => ({
            id: le.id,
            transaction_id: tx.reference_code || tx.id.toString(),
            date: tx.transaction_date?.substring(0, 10) || '',
            account: le.description || tx.student_name,
            debit: le.account_type === 'DEBIT' ? le.amount : '0.00',
            credit: le.account_type === 'CREDIT' ? le.amount : '0.00',
            user: tx.student_name || 'System',
            description: le.description || '',
          })) || []
        );
        this.ledgerEntries.set(entries.length > 0 ? entries : []);
      },
      error: () => this.ledgerEntries.set([]),
    });
  }

  formatAmount(val: string): string {
    const num = parseFloat(val) || 0;
    return num.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  get totalDebits(): string {
    const total = this.ledgerEntries().reduce((sum, e) => sum + (parseFloat(e.debit) || 0), 0);
    return 'KES ' + total.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  get totalCredits(): string {
    const total = this.ledgerEntries().reduce((sum, e) => sum + (parseFloat(e.credit) || 0), 0);
    return 'KES ' + total.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  get netPosition(): number {
    const credits = this.ledgerEntries().reduce((sum, e) => sum + (parseFloat(e.credit) || 0), 0);
    const debits = this.ledgerEntries().reduce((sum, e) => sum + (parseFloat(e.debit) || 0), 0);
    return credits - debits;
  }

  get netPositionFormatted(): string {
    const prefix = this.netPosition >= 0 ? '' : '\u2212';
    return prefix + 'KES ' + Math.abs(this.netPosition).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
