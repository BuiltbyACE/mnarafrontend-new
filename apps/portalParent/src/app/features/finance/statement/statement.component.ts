import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DatePipe } from '@angular/common';
import { ParentApiService } from '../../../services/parent-api.service';
import { StudentInvoice, Transaction, FeeBalance, STATUS_COLORS, PAYMENT_METHOD_LABEL } from '../../../models/parent.models';

@Component({
  selector: 'app-statement',
  imports: [MatCardModule, MatIconModule, MatTabsModule, MatProgressSpinnerModule, DatePipe],
  template: `
    <div class="statement-page">
      @if (loading()) {
        <div class="loading-wrap"><mat-spinner diameter="32"></mat-spinner></div>
      } @else {
        <div class="summary-bar">
          <div class="summary-item">
            <span class="s-label">Total Due</span>
            <span class="s-value">{{ formatCurrency(totalDue) }}</span>
          </div>
          <div class="summary-item">
            <span class="s-label">Total Paid</span>
            <span class="s-value paid">{{ formatCurrency(totalPaid) }}</span>
          </div>
          <div class="summary-item">
            <span class="s-label">Outstanding</span>
            <span class="s-value" [class.negative]="outstanding > 0">{{ formatCurrency(outstanding) }}</span>
          </div>
        </div>

        <mat-tab-group>
          <mat-tab label="Invoices ({{ invoices().length }})">
            @if (invoices().length > 0) {
              <table class="data-table">
                <thead><tr><th>Title</th><th>Year/Term</th><th>Due</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead>
                <tbody>
                  @for (inv of invoices(); track inv.id) {
                    <tr>
                      <td>{{ inv.fee_title }}</td>
                      <td>{{ inv.student_name }}</td>
                      <td class="mono">{{ formatCurrency(inv.amount_due) }}</td>
                      <td class="mono">{{ formatCurrency(inv.amount_paid) }}</td>
                      <td class="mono">{{ formatCurrency(inv.amount_due - inv.amount_paid) }}</td>
                      <td><span class="status-chip" [style.background]="STATUS_COLORS[inv.status] || '#94a3b8'">{{ inv.status }}</span></td>
                    </tr>
                  }
                </tbody>
              </table>
            } @else { <div class="no-data">No invoices</div> }
          </mat-tab>
          <mat-tab label="Transactions ({{ transactions().length }})">
            @if (transactions().length > 0) {
              <table class="data-table">
                <thead><tr><th>Date</th><th>Student</th><th>Reference</th><th>Amount</th><th>Method</th></tr></thead>
                <tbody>
                  @for (txn of transactions(); track txn.id) {
                    <tr>
                      <td>{{ txn.transaction_date | date:'shortDate' }}</td>
                      <td>{{ txn.student_name }}</td>
                      <td class="mono">{{ txn.reference_code }}</td>
                      <td class="mono">{{ formatCurrency(txn.amount) }}</td>
                      <td>{{ PAYMENT_METHOD_LABEL[txn.payment_method] || txn.payment_method }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            } @else { <div class="no-data">No transactions</div> }
          </mat-tab>
        </mat-tab-group>
      }
    </div>
  `,
  styles: [`
    .statement-page { padding: 16px 0; }
    .loading-wrap { display: flex; justify-content: center; padding: 48px; }
    .summary-bar { display: flex; gap: 16px; margin-bottom: 20px; }
    .summary-item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 20px; flex: 1; }
    .s-label { display: block; font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.04em; color: #94a3b8; margin-bottom: 4px; }
    .s-value { font-size: 1.25rem; font-weight: 700; font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; color: #1e293b; }
    .s-value.paid { color: #059669; }
    .s-value.negative { color: #e11d48; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; margin-top: 12px; }
    .data-table th { text-align: left; padding: 8px 12px; border-bottom: 2px solid #e2e8f0; color: #64748b; font-weight: 600; font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.04em; }
    .data-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
    .mono { font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; font-weight: 500; }
    .status-chip { display: inline-block; padding: 2px 8px; border-radius: 4px; color: #fff; font-size: 0.6875rem; font-weight: 600; }
    .no-data { padding: 32px; text-align: center; color: #94a3b8; font-size: 0.8125rem; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatementComponent implements OnInit {
  private readonly api = inject(ParentApiService);

  readonly invoices = signal<StudentInvoice[]>([]);
  readonly transactions = signal<Transaction[]>([]);
  readonly loading = signal(true);

  readonly STATUS_COLORS = STATUS_COLORS;
  readonly PAYMENT_METHOD_LABEL = PAYMENT_METHOD_LABEL;

  ngOnInit() {
    this.api.getInvoices().subscribe({
      next: (inv) => this.invoices.set(inv),
    });
    this.api.getTransactions().subscribe({
      next: (txns) => this.transactions.set(txns),
      complete: () => this.loading.set(false),
    });
  }

  get totalDue() { return this.invoices().reduce((s, i) => s + i.amount_due, 0); }
  get totalPaid() { return this.invoices().reduce((s, i) => s + i.amount_paid, 0); }
  get outstanding() { return this.totalDue - this.totalPaid; }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount);
  }
}
