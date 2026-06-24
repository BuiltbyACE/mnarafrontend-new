import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ParentApiService } from '../../../services/parent-api.service';
import { PaymentHistoryItem, PaymentHistoryResponse, PAYMENT_METHOD_LABEL } from '../../../models/parent.models';

@Component({
  selector: 'app-payments',
  imports: [DatePipe, MatIconModule, MatCardModule, MatButtonModule, MatProgressSpinnerModule, MatPaginatorModule],
  template: `
    <div class="payments-page">
      <header class="page-header">
        <mat-icon class="header-icon">payments</mat-icon>
        <div class="header-text">
          <h1>Payment History</h1>
          <p>View all payments made across your family</p>
        </div>
      </header>

      @if (loading()) {
        <div class="loading-state">
          <mat-spinner diameter="36" />
          <span>Loading payment history...</span>
        </div>
      } @else if (error()) {
        <div class="error-msg">{{ error() }}</div>
      } @else if (items().length === 0) {
        <div class="empty-state">
          <mat-icon class="empty-icon">payments</mat-icon>
          <h3>No Payments Yet</h3>
          <p>Your payment history will appear here once you make your first payment.</p>
        </div>
      } @else {
        <section class="payment-list">
          @for (pmt of items(); track pmt.id) {
            <mat-card class="payment-card" appearance="outlined">
              <mat-card-content>
                <div class="payment-row">
                  <div class="payment-icon-wrapper">
                    <mat-icon class="payment-icon">{{ getIcon(pmt) }}</mat-icon>
                  </div>
                  <div class="payment-info">
                    <span class="payment-amount">{{ formatCurrency(pmt.amount) }}</span>
                    <span class="payment-method">
                      {{ PAYMENT_METHOD_LABEL[pmt.payment_method] || pmt.payment_method }}
                      @if (pmt.reference_code) {
                        · {{ pmt.reference_code }}
                      }
                    </span>
                  </div>
                  <div class="payment-student">
                    @if (pmt.student_name) {
                      <span class="student-name">{{ pmt.student_name }}</span>
                      <span class="label">Student</span>
                    } @else {
                      <span class="student-none">General</span>
                    }
                  </div>
                  <div class="payment-date">{{ formatDate(pmt.transaction_date) }}</div>
                </div>
              </mat-card-content>
            </mat-card>
          }
        </section>

        <mat-paginator
          [length]="totalCount()"
          [pageSize]="pageSize"
          [pageIndex]="pageIndex()"
          [pageSizeOptions]="[20, 50, 100]"
          (page)="onPage($event)"
          showFirstLastButtons
        />
      }
    </div>
  `,
  styles: [`
    .payments-page { padding: 24px; max-width: 900px; margin: 0 auto; }
    .page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .page-header h1 { margin: 0; font-size: 24px; font-weight: 600; color: #1e293b; }
    .page-header p { margin: 2px 0 0; color: #64748b; font-size: 14px; }
    .header-icon { font-size: 32px; width: 32px; height: 32px; color: #0891b2; }
    .loading-state { display: flex; align-items: center; gap: 12px; justify-content: center; padding: 48px; color: #64748b; }
    .error-msg { padding: 16px; background: #fef2f2; color: #dc2626; border-radius: 8px; }
    .empty-state { text-align: center; padding: 64px 24px; color: #94a3b8; }
    .empty-state h3 { margin: 12px 0 4px; color: #64748b; }
    .empty-icon { font-size: 64px; width: 64px; height: 64px; color: #cbd5e1; }
    .payment-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
    .payment-card { border-radius: 8px; }
    .payment-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .payment-icon-wrapper { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: #f1f5f9; border-radius: 50%; }
    .payment-icon { color: #64748b; }
    .payment-info { display: flex; flex-direction: column; min-width: 160px; }
    .payment-amount { font-size: 16px; font-weight: 700; color: #1e293b; }
    .payment-method { font-size: 12px; color: #94a3b8; }
    .payment-student { display: flex; flex-direction: column; margin-left: auto; min-width: 120px; text-align: right; }
    .student-name { font-size: 14px; font-weight: 600; color: #334155; }
    .student-none { font-size: 14px; color: #94a3b8; font-style: italic; }
    .label { font-size: 11px; color: #94a3b8; text-transform: uppercase; }
    .payment-date { font-size: 12px; color: #94a3b8; min-width: 90px; text-align: right; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentsComponent implements OnInit {
  private readonly api = inject(ParentApiService);

  readonly items = signal<PaymentHistoryItem[]>([]);
  readonly totalCount = signal(0);
  readonly pageIndex = signal(0);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly PAYMENT_METHOD_LABEL = PAYMENT_METHOD_LABEL;
  readonly pageSize = 20;

  private nextUrl: string | null = null;
  private prevUrl: string | null = null;

  ngOnInit(): void {
    this.fetchPage();
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.loading.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const paginatedUrl = `${this.api['baseUrl']}/finance/parent/payments/?page=${event.pageIndex + 1}`;
    this.fetchPage(paginatedUrl);
  }

  private fetchPage(url?: string): void {
    this.api.getPaymentHistory(url).subscribe({
      next: (data: PaymentHistoryResponse) => {
        this.items.set(data.results);
        this.totalCount.set(data.count);
        this.nextUrl = data.next;
        this.prevUrl = data.previous;
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Failed to load payment history.');
      },
    });
  }

  getIcon(pmt: PaymentHistoryItem): string {
    if (pmt.payment_method === 'MPESA') return 'phone_iphone';
    if (pmt.payment_method === 'BANK') return 'account_balance';
    if (pmt.payment_method === 'CASH') return 'payments';
    if (pmt.payment_method === 'CHEQUE') return 'check_circle';
    return 'payment';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount);
  }

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
