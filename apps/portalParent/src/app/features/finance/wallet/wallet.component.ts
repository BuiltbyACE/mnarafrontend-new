import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { ParentApiService } from '../../../services/parent-api.service';
import { ParentWallet, WalletTransaction } from '../../../models/parent.models';

@Component({
  selector: 'app-wallet',
  imports: [RouterLink, DatePipe, MatIconModule, MatCardModule, MatButtonModule, MatProgressSpinnerModule, MatDividerModule],
  template: `
    <div class="wallet-page">
      <header class="page-header">
        <mat-icon class="header-icon">account_balance_wallet</mat-icon>
        <div class="header-text">
          <h1>Family Wallet</h1>
          <p>View your wallet balance and transaction history</p>
        </div>
      </header>

      @if (loading()) {
        <div class="loading-state">
          <mat-spinner diameter="36" />
          <span>Loading wallet...</span>
        </div>
      } @else if (error()) {
        <div class="error-msg">{{ error() }}</div>
      } @else {
        @if (wallet(); as w) {
          <section class="balance-card">
            <mat-card class="wallet-balance-card">
              <mat-card-content>
                <div class="balance-content">
                  <div class="balance-icon-wrapper">
                    <mat-icon class="balance-icon">account_balance_wallet</mat-icon>
                  </div>
                  <div class="balance-details">
                    <span class="balance-label">Available Balance</span>
                    <span class="balance-amount" [class.positive]="w.available_balance > 0" [class.zero]="w.available_balance <= 0">
                      {{ formatCurrency(w.available_balance) }}
                    </span>
                    <span class="balance-hint">
                      @if (w.last_transaction_at) {
                        Last activity: {{ formatDate(w.last_transaction_at) }}
                      } @else {
                        No recent activity
                      }
                    </span>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </section>
        } @else {
          <section class="no-wallet">
            <mat-card>
              <mat-card-content>
                <div class="empty-state">
                  <mat-icon class="empty-icon">account_balance_wallet</mat-icon>
                  <h3>No Wallet Yet</h3>
                  <p>Your family wallet will be created when an overpayment or credit is applied.</p>
                </div>
              </mat-card-content>
            </mat-card>
          </section>
        }

        <section class="transactions-section">
          <mat-card>
            <mat-card-header>
              <mat-icon mat-card-avatar>history</mat-icon>
              <mat-card-title>Transaction History</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              @if (transactions().length > 0) {
                <table class="txn-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Reference</th>
                      <th class="amount-col">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (txn of transactions(); track txn.id) {
                      <tr>
                        <td>{{ formatDate(txn.created_at) }}</td>
                        <td>
                          <span class="txn-badge" [class.credit]="isCredit(txn)" [class.debit]="!isCredit(txn)">
                            {{ txn.transaction_type }}
                          </span>
                        </td>
                        <td>{{ txn.description || '—' }}</td>
                        <td class="ref">{{ txn.reference || '—' }}</td>
                        <td class="amount-col" [class.credit-amount]="isCredit(txn)" [class.debit-amount]="!isCredit(txn)">
                          {{ isCredit(txn) ? '+' : '-' }}{{ formatCurrency(txn.amount) }}
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              } @else {
                <div class="no-data">No wallet transactions yet</div>
              }
            </mat-card-content>
          </mat-card>
        </section>
      }
    </div>
  `,
  styles: [`
    .wallet-page { padding: 24px; max-width: 900px; margin: 0 auto; }
    .page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .page-header h1 { margin: 0; font-size: 24px; font-weight: 600; color: #1e293b; }
    .page-header p { margin: 2px 0 0; color: #64748b; font-size: 14px; }
    .header-icon { font-size: 32px; width: 32px; height: 32px; color: #6366f1; }
    .loading-state { display: flex; align-items: center; gap: 12px; justify-content: center; padding: 48px; color: #64748b; }
    .error-msg { padding: 16px; background: #fef2f2; color: #dc2626; border-radius: 8px; }
    .balance-card { margin-bottom: 24px; }
    .wallet-balance-card { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; border-radius: 16px; }
    .balance-content { display: flex; align-items: center; gap: 20px; padding: 8px 0; }
    .balance-icon-wrapper { display: flex; align-items: center; justify-content: center; width: 64px; height: 64px; background: rgba(255,255,255,0.15); border-radius: 50%; }
    .balance-icon { font-size: 32px; width: 32px; height: 32px; }
    .balance-details { display: flex; flex-direction: column; gap: 4px; }
    .balance-label { font-size: 14px; opacity: 0.85; }
    .balance-amount { font-size: 32px; font-weight: 700; }
    .balance-amount.positive { color: #bbf7d0; }
    .balance-amount.zero { color: #fca5a5; }
    .balance-hint { font-size: 12px; opacity: 0.7; margin-top: 2px; }
    .no-wallet { margin-bottom: 24px; }
    .empty-state { text-align: center; padding: 32px; color: #94a3b8; }
    .empty-state h3 { margin: 12px 0 4px; color: #64748b; }
    .empty-icon { font-size: 48px; width: 48px; height: 48px; color: #cbd5e1; }
    .txn-table { width: 100%; border-collapse: collapse; font-size: 14px; }
    .txn-table th { text-align: left; padding: 8px 12px; color: #64748b; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e2e8f0; }
    .txn-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; color: #334155; }
    .amount-col { text-align: right; }
    .ref { font-family: monospace; font-size: 12px; color: #94a3b8; }
    .txn-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    .txn-badge.credit { background: #dcfce7; color: #059669; }
    .txn-badge.debit { background: #fee2e2; color: #dc2626; }
    .credit-amount { color: #059669; font-weight: 600; }
    .debit-amount { color: #dc2626; font-weight: 600; }
    .no-data { text-align: center; padding: 32px; color: #94a3b8; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WalletComponent implements OnInit {
  private readonly api = inject(ParentApiService);

  readonly wallet = signal<ParentWallet | null>(null);
  readonly transactions = signal<WalletTransaction[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.api.getWallet().subscribe({
      next: (data) => {
        this.wallet.set(data.wallet);
        this.transactions.set(data.transactions);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Failed to load wallet data. Please try again later.');
      },
    });
  }

  isCredit(txn: WalletTransaction): boolean {
    return ['CREDIT', 'PAYMENT_OVERFLOW', 'REFUND'].includes(txn.transaction_type);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount);
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
