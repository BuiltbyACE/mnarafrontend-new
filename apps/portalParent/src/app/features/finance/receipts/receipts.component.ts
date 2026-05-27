import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DatePipe } from '@angular/common';
import { ParentApiService } from '../../../services/parent-api.service';
import { Transaction, PAYMENT_METHOD_LABEL } from '../../../models/parent.models';

@Component({
  selector: 'app-receipts',
  imports: [MatCardModule, MatIconModule, MatProgressSpinnerModule, DatePipe],
  template: `
    <div class="receipts-page">
      <h2>Payment Receipts</h2>
      @if (loading()) {
        <div class="loading-wrap"><mat-spinner diameter="28"></mat-spinner></div>
      } @else if (transactions().length > 0) {
        <div class="receipt-list">
          @for (txn of transactions(); track txn.id) {
            <div class="receipt-card">
              <div class="receipt-header">
                <mat-icon>receipt</mat-icon>
                <div>
                  <span class="receipt-student">{{ txn.student_name }}</span>
                  <span class="receipt-date">{{ txn.transaction_date | date:'mediumDate' }}</span>
                </div>
                <span class="receipt-amount">{{ formatCurrency(txn.amount) }}</span>
              </div>
              <div class="receipt-body">
                <div class="receipt-row"><span class="r-label">Reference</span><span class="r-value mono">{{ txn.reference_code }}</span></div>
                <div class="receipt-row"><span class="r-label">Method</span><span class="r-value">{{ PAYMENT_METHOD_LABEL[txn.payment_method] || txn.payment_method }}</span></div>
              </div>
            </div>
          }
        </div>
      } @else { <div class="no-data">No receipts found</div> }
    </div>
  `,
  styles: [`
    .receipts-page { padding: 16px 0; }
    h2 { font-size: 1.125rem; margin: 0 0 16px; color: #1e293b; }
    .loading-wrap { display: flex; justify-content: center; padding: 48px; }
    .receipt-list { display: flex; flex-direction: column; gap: 12px; }
    .receipt-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; }
    .receipt-header { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
    .receipt-header mat-icon { color: #2563eb; }
    .receipt-student { display: block; font-size: 0.875rem; font-weight: 600; color: #1e293b; }
    .receipt-date { font-size: 0.6875rem; color: #94a3b8; }
    .receipt-amount { margin-left: auto; font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; font-weight: 700; font-size: 1rem; color: #059669; }
    .receipt-body { padding: 12px 16px; }
    .receipt-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 0.8125rem; }
    .r-label { color: #94a3b8; }
    .r-value { color: #334155; font-weight: 500; }
    .mono { font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; }
    .no-data { padding: 48px; text-align: center; color: #94a3b8; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReceiptsComponent implements OnInit {
  private readonly api = inject(ParentApiService);

  readonly transactions = signal<Transaction[]>([]);
  readonly loading = signal(true);

  readonly PAYMENT_METHOD_LABEL = PAYMENT_METHOD_LABEL;

  ngOnInit() {
    this.api.getTransactions().subscribe({
      next: (txns) => this.transactions.set(txns),
      complete: () => this.loading.set(false),
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount);
  }
}
