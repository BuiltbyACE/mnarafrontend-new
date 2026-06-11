import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanceService } from '../../services/finance.service';
import { JournalEntry, LedgerEntryLine } from '../../models/finance.models';

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
          <span class="summary-value">{{ journalEntries().length }}</span>
        </div>
      </div>

      @if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading journal entries...</p>
        </div>
      } @else {
        <div class="ledger-list-wrapper">
          @for (entry of journalEntries(); track entry.id) {
            <div class="journal-entry-card">
              <div class="je-header">
                <div class="je-header-left">
                  <span class="je-date">{{ entry.date | date:'mediumDate' }}</span>
                  <span class="je-ref">{{ entry.reference }}</span>
                  @if (entry.status === 'POSTED') {
                    <span class="je-status status-posted">POSTED</span>
                  } @else {
                    <span class="je-status status-draft">{{ entry.status }}</span>
                  }
                </div>
                <div class="je-header-right">
                  <div class="je-meta">
                    <span class="meta-label">Prepared by</span>
                    <span class="meta-value">{{ entry.prepared_by_name }}</span>
                  </div>
                  <div class="je-meta">
                    <span class="meta-label">Approved by</span>
                    <span class="meta-value">{{ entry.approved_by_name }}</span>
                  </div>
                </div>
              </div>
              @if (entry.description) {
                <div class="je-desc">{{ entry.description }}</div>
              }
              <table class="ledger-table">
                <thead>
                  <tr>
                    <th class="col-account">Account</th>
                    <th class="col-desc">Line Description</th>
                    <th class="col-debit">Debit (KES)</th>
                    <th class="col-credit">Credit (KES)</th>
                  </tr>
                </thead>
                <tbody>
                  @for (line of entry.lines; track line.id) {
                    <tr>
                      <td class="col-account">
                        <span class="acc-code">{{ line.account_code }}</span>
                        <span class="acc-name">{{ line.account_name }}</span>
                      </td>
                      <td class="col-desc text-muted">{{ line.description }}</td>
                      <td class="col-debit">
                        @if (line.is_debit && parseFloat(line.amount) > 0) {
                          <span class="mono debit-amount">{{ formatAmount(line.amount) }}</span>
                        }
                      </td>
                      <td class="col-credit">
                        @if (!line.is_debit && parseFloat(line.amount) > 0) {
                          <span class="mono credit-amount">{{ formatAmount(line.amount) }}</span>
                        }
                      </td>
                    </tr>
                  }
                  <tr class="totals-row">
                    <td colspan="2" class="totals-label">Total</td>
                    <td class="col-debit mono debit-amount">{{ formatAmount(getEntryTotal(entry, true)) }}</td>
                    <td class="col-credit mono credit-amount">{{ formatAmount(getEntryTotal(entry, false)) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          }
          @if (!journalEntries()?.length) {
            <div class="empty-state">
              <p>No journal entries found in the ledger.</p>
            </div>
          }
        </div>
      }

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
    .ledger-badge { display: flex; align-items: center; gap: 8px; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); padding: 8px 16px; border-radius: 8px; font-size: 0.75rem; font-weight: 600; color: #1d4ed8; text-transform: uppercase; letter-spacing: 0.04em; flex-shrink: 0; }
    .lock-icon { width: 16px; height: 16px; color: #3b82f6; }
    .ledger-summary { display: flex; align-items: center; gap: 24px; background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 24px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .summary-item { display: flex; flex-direction: column; gap: 2px; }
    .summary-label { font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 600; }
    .summary-value { font-size: 1.125rem; font-weight: 700; font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; color: #0f172a; }
    .summary-value.debit { color: #e11d48; }
    .summary-value.credit { color: #059669; }
    .summary-divider { width: 1px; height: 40px; background: #e2e8f0; }
    
    .ledger-list-wrapper { display: flex; flex-direction: column; gap: 20px; }
    .journal-entry-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.02); transition: box-shadow 0.2s; }
    .journal-entry-card:hover { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
    
    .je-header { padding: 16px 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; }
    .je-header-left { display: flex; align-items: center; gap: 16px; }
    .je-date { font-weight: 600; color: #334155; font-size: 0.875rem; }
    .je-ref { font-family: 'SF Mono', 'Cascadia Code', monospace; color: #64748b; font-size: 0.8125rem; background: #e2e8f0; padding: 2px 8px; border-radius: 4px; }
    .je-status { font-size: 0.6875rem; font-weight: 700; padding: 4px 8px; border-radius: 12px; letter-spacing: 0.05em; }
    .status-posted { background: #dcfce7; color: #166534; }
    .status-draft { background: #fef9c3; color: #854d0e; }
    
    .je-header-right { display: flex; gap: 20px; }
    .je-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
    .meta-label { font-size: 0.625rem; text-transform: uppercase; color: #94a3b8; font-weight: 600; }
    .meta-value { font-size: 0.75rem; color: #475569; font-weight: 500; }
    
    .je-desc { padding: 12px 20px; font-size: 0.875rem; color: #475569; border-bottom: 1px solid #f1f5f9; font-style: italic; }
    
    .ledger-table { width: 100%; border-collapse: collapse; }
    .ledger-table th { padding: 10px 20px; text-align: left; font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; border-bottom: 1px solid #e2e8f0; font-weight: 600; }
    .ledger-table td { padding: 12px 20px; font-size: 0.8125rem; color: #334155; border-bottom: 1px solid #f1f5f9; }
    .ledger-table tbody tr:hover td { background: #f8fafc; }
    
    .col-account { min-width: 200px; display: flex; flex-direction: column; gap: 2px; border-bottom: none !important; }
    .acc-code { font-family: 'SF Mono', monospace; font-size: 0.75rem; color: #94a3b8; }
    .acc-name { font-weight: 500; color: #0f172a; }
    
    .col-desc { min-width: 200px; }
    .col-debit { width: 150px; text-align: right; }
    .col-credit { width: 150px; text-align: right; }
    
    .mono { font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; }
    .debit-amount { color: #e11d48; font-weight: 600; font-size: 0.875rem; }
    .credit-amount { color: #059669; font-weight: 600; font-size: 0.875rem; }
    .text-muted { color: #94a3b8; font-size: 0.75rem; }
    
    .totals-row td { border-top: 2px solid #e2e8f0; background: #fafbfc; border-bottom: none !important; padding: 10px 20px; }
    .totals-label { text-align: right; font-weight: 600; color: #64748b; font-size: 0.75rem; text-transform: uppercase; }
    
    .ledger-footer-note { display: flex; align-items: center; gap: 10px; margin-top: 24px; padding: 12px 18px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.75rem; color: #64748b; }
    .footer-icon { width: 16px; height: 16px; color: #94a3b8; flex-shrink: 0; }
    .ledger-footer-note strong { color: #334155; }
    
    .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 0; color: #64748b; }
    .spinner { width: 24px; height: 24px; border: 3px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 12px; }
    .empty-state { text-align: center; padding: 40px; color: #94a3b8; background: white; border-radius: 12px; border: 1px dashed #cbd5e1; }
    @keyframes spin { 100% { transform: rotate(360deg); } }
  `],
})
export class ImmutableLedgerComponent implements OnInit {
  private financeService = inject(FinanceService);

  journalEntries = signal<JournalEntry[]>([]);
  isLoading = signal(true);
  parseFloat = parseFloat;

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    this.financeService.getJournalEntries().subscribe({
      next: (res) => {
        this.journalEntries.set(res.results || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.journalEntries.set([]);
        this.isLoading.set(false);
      },
    });
  }

  getEntryTotal(entry: JournalEntry, isDebit: boolean): string {
    const total = entry.lines
      .filter(l => l.is_debit === isDebit)
      .reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);
    return total.toString();
  }

  formatAmount(val: string | number): string {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  get netPosition(): number {
    let debits = 0;
    let credits = 0;
    this.journalEntries().forEach(je => {
      je.lines.forEach(l => {
        if (l.is_debit) debits += (parseFloat(l.amount) || 0);
        else credits += (parseFloat(l.amount) || 0);
      });
    });
    return credits - debits; // Net Assets (Credit - Debit) could be negative, but let's keep the old logic or just Absolute Difference
  }

  get netPositionFormatted(): string {
    const prefix = this.netPosition >= 0 ? '' : '\u2212';
    return prefix + 'KES ' + Math.abs(this.netPosition).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  get totalDebits(): string {
    let total = 0;
    this.journalEntries().forEach(je => {
      total += je.lines.filter(l => l.is_debit).reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);
    });
    return 'KES ' + total.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  get totalCredits(): string {
    let total = 0;
    this.journalEntries().forEach(je => {
      total += je.lines.filter(l => !l.is_debit).reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);
    });
    return 'KES ' + total.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
